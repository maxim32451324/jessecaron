/**
 * Fetches every URL the old WordPress sitemap advertises against a local production
 * build of this site, and fails if any of them is worse off than it was.
 *
 * WHY THIS EXISTS
 *
 * On the day `www.jessecaron.com` stops answering from WordPress and starts answering
 * from here, 797 URLs change owner at once: 27 posts, 38 products, 68 category
 * archives, 261 tag archives, 138 pages, and a long tail of portfolio and shop
 * taxonomies. Every one of them is indexed. Every one of them is somebody's bookmark,
 * or a link on a club's website, or a row in Search Console.
 *
 * A redirect map is easy to write and impossible to eyeball. You cannot tell by reading
 * `content/data/redirects.json` that `/category/interview/` lands on a page that exists,
 * that no rule shadows another, or that `/tag/voetbal/` does not take two hops to get
 * where it is going. So this asks the server, one URL at a time, and asserts five things
 * PARITY-PLAN §10 Phase 5 requires:
 *
 *   1. no 404                      — nothing indexed is lost
 *   2. no 5xx                      — nothing indexed is broken
 *   3. no redirect chain > 1 hop   — one hop, or none; chains leak PageRank and crawl budget
 *   4. every redirect target is 200 — a 301 into a 404 is a 404 with extra steps
 *   5. 410 only on the demo/plumbing patterns — nothing real is thrown away by accident
 *
 * It also checks the sitemap this site serves, because a sitemap that lists a URL which
 * redirects tells a crawler the site does not know its own addresses.
 *
 * USAGE
 *   npm run build && npm run check:redirects        (starts and stops its own server)
 *   node scripts/crawl-old-urls.mjs --base http://localhost:3000   (use a running one)
 *
 * Writes `content/data/redirect-audit.json` and prints the summary table.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const old = read("content/data/old-urls.json");
const map = read("content/data/redirects.json");

const argBase = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : null;
const PORT = Number(process.env.PORT ?? 3100);
const BASE = (argBase ?? `http://localhost:${PORT}`).replace(/\/+$/, "");
const CONCURRENCY = 8;
const MAX_HOPS = 5;

// ---------------------------------------------------------------------------
// Extra probes: patterns that are not in the sitemap but that the map claims to
// handle. WordPress emitted all of these for fifteen years and the web still holds
// links to them, so "not in the sitemap" is not the same as "nobody will ask".
// ---------------------------------------------------------------------------
const EXTRA_PROBES = [
  "/page/2/",
  "/blog/page/2/",
  "/category/voetbal/page/2/",
  "/tag/voetbal/page/2/",
  "/feed/",
  "/blog/feed/",
  "/looptraining-voetbal/feed/",
  "/?s=snelheid",
  "/product/stroboscoop-knipper-bril/",
  "/functionele-snelheid/",
  "/functionele-kracht/",
  "/portfolio_item/guyon-balsemhof/",
  // Two terms WordPress kept out of its own sitemap because they label nothing, and one
  // portfolio item the harvest never found — all three are linked from pages that still
  // exist, which is exactly the kind of URL a sitemap-only crawl misses.
  "/category/samet-dag/",
  "/category/shirtsponsor/",
  "/portfolio-item/mannequin-challenge-schoolsport-vereniging-rotterdam-atletiek/",
  "/shop-lists/shop-four-columns/",
  "/wp-json/wp/v2/posts",
  "/wp-admin/",
  "/wp-login.php",
  "/xmlrpc.php",
  "/wp-content/uploads/2017/01/Rotterdam-Atletiek-Schoolsport-Vereniging-Jesse-Caron-Kleurplaat.pdf",
];

/** The `:name` / `:name*` subset of path-to-regexp that the gone patterns use. */
function toRegExp(source) {
  // `:name*` swallows the slash in front of it, because that is what Next does:
  // `/wp-admin/:path*` matches `/wp-admin` as well as `/wp-admin/network/site.php`.
  // Getting that wrong makes this replay disagree with the server it is checking —
  // which is how the first run of this script reported a phantom failure on `/wp-admin/`.
  let out = "";
  for (const seg of source.split("/")) {
    if (!seg) continue;
    if (seg.startsWith(":") && seg.endsWith("*")) out += "(?:/[^/]+)*";
    else if (seg.startsWith(":")) out += "/[^/]+";
    // Only `.` needs escaping: every literal segment in the map is a slug or a
    // filename (`/wp-login.php`), never a regex metacharacter.
    else out += "/" + seg.replaceAll(".", "\\.");
  }
  return new RegExp(`^${out || "/"}/?$`);
}
const GONE_RE = map.gone.map(toRegExp);
const isGoneAllowed = (p) => GONE_RE.some((re) => re.test(p.split("?")[0].replace(/\/+$/, "") || "/"));

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
async function reachable(base) {
  try {
    const res = await fetch(base, { redirect: "manual", signal: AbortSignal.timeout(2000) });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function startServer() {
  const bin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(bin)) throw new Error("next binary not found — run npm install");
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    throw new Error("no production build found — run `npm run build` first");
  }
  const child = spawn(process.execPath, [bin, "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await reachable(BASE)) return child;
    await new Promise((r) => setTimeout(r, 400));
  }
  child.kill();
  throw new Error(`server did not come up on ${BASE} within 60s`);
}

// ---------------------------------------------------------------------------
// Crawl
// ---------------------------------------------------------------------------

/** Follows one old URL through its redirect chain, recording every step. */
async function trace(oldPath) {
  const chain = [];
  let url = `${BASE}${oldPath}`;
  for (let i = 0; i <= MAX_HOPS; i++) {
    let res;
    try {
      res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      return { from: oldPath, status: 0, hops: chain.length, chain, final: url, error: String(err) };
    }
    const status = res.status;
    if (status >= 300 && status < 400) {
      const loc = res.headers.get("location");
      chain.push({ status, to: loc });
      if (!loc) break;
      const next = new URL(loc, url);
      // A redirect off this host — the WooCommerce shop once it has its own hostname —
      // is somebody else's server. Record it, do not chase it.
      if (next.origin !== new URL(BASE).origin) {
        return { from: oldPath, status: chain[0].status, hops: chain.length, chain, final: next.href, external: true };
      }
      url = next.href;
      continue;
    }
    return {
      from: oldPath,
      status: chain.length ? chain[0].status : status,
      finalStatus: status,
      hops: chain.length,
      chain,
      final: url.slice(BASE.length) || "/",
    };
  }
  return { from: oldPath, status: chain[0]?.status ?? 0, hops: chain.length, chain, final: url, tooDeep: true };
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await worker(items[n]);
      }
    }),
  );
  return out;
}

// ---------------------------------------------------------------------------

const owned = argBase ? null : await startServer();
if (argBase && !(await reachable(BASE))) {
  console.error(`crawl-old-urls: nothing answering on ${BASE}.`);
  process.exit(1);
}

try {
  const jobs = [];
  for (const [group, paths] of Object.entries(old.groups)) {
    for (const p of paths) jobs.push({ group, path: p });
  }
  for (const p of EXTRA_PROBES) jobs.push({ group: "extra-probes", path: p });

  process.stdout.write(`crawl-old-urls: ${jobs.length} URLs against ${BASE} …\n`);
  const results = await pool(jobs, async (j) => ({ group: j.group, ...(await trace(j.path)) }));

  // --- the five assertions ------------------------------------------------
  const failures = [];
  for (const r of results) {
    const label = `${r.from} -> ${r.chain.map((c) => `${c.status} ${c.to}`).join(" -> ") || r.status}`;
    if (r.error) failures.push({ why: "request failed", url: r.from, detail: r.error });
    if (r.finalStatus === 404 || r.status === 404) failures.push({ why: "404", url: r.from, detail: label });
    if ((r.finalStatus ?? r.status) >= 500) failures.push({ why: "5xx", url: r.from, detail: label });
    if (r.hops > 1) failures.push({ why: `redirect chain of ${r.hops} hops`, url: r.from, detail: label });
    if (r.tooDeep) failures.push({ why: "redirect loop", url: r.from, detail: label });
    if (r.hops === 1 && !r.external && r.finalStatus !== 200 && r.finalStatus !== 410) {
      failures.push({ why: `redirect target returns ${r.finalStatus}`, url: r.from, detail: label });
    }
    if (r.finalStatus === 410 && !isGoneAllowed(r.from)) {
      failures.push({ why: "410 on a URL that is not a demo/plumbing pattern", url: r.from, detail: label });
    }
  }

  // --- the sitemap must not list a URL that redirects ----------------------
  const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sitemapChecks = await pool(sitemapUrls, async (u) => {
    const p = new URL(u).pathname;
    return { url: p, ...(await trace(p)) };
  });
  for (const s of sitemapChecks) {
    if (s.hops > 0) failures.push({ why: "sitemap lists a URL that redirects", url: s.url, detail: `${s.status} -> ${s.final}` });
    if ((s.finalStatus ?? s.status) !== 200) {
      failures.push({ why: `sitemap URL returns ${s.finalStatus ?? s.status}`, url: s.url, detail: "" });
    }
  }

  // --- summary ------------------------------------------------------------
  const bucketOf = (r) => {
    if (r.error) return "error";
    if (r.hops === 0) return String(r.finalStatus);
    return String(r.status);
  };
  const byGroup = {};
  const totals = {};
  for (const r of results) {
    const b = bucketOf(r);
    (byGroup[r.group] ??= {})[b] = (byGroup[r.group][b] ?? 0) + 1;
    totals[b] = (totals[b] ?? 0) + 1;
  }

  const audit = {
    generated: new Date().toISOString().slice(0, 19) + "Z",
    base: BASE,
    note:
      "Produced by scripts/crawl-old-urls.mjs against a local production build. Every URL in " +
      "content/data/old-urls.json (the old wp-sitemap.xml) plus a set of extra probes for " +
      "patterns WordPress served but never listed. PARITY-PLAN §10 Phase 5.",
    old_urls: old.total,
    probed: results.length,
    assertions: {
      "0 x 404": failures.filter((f) => f.why === "404").length === 0,
      "0 x 5xx": failures.filter((f) => f.why === "5xx").length === 0,
      "no chain > 1 hop": failures.filter((f) => f.why.startsWith("redirect chain")).length === 0,
      "every redirect target 200": failures.filter((f) => f.why.startsWith("redirect target")).length === 0,
      "410 only on demo/plumbing": failures.filter((f) => f.why.startsWith("410")).length === 0,
      "sitemap lists no redirecting URL": failures.filter((f) => f.why.startsWith("sitemap")).length === 0,
    },
    totals,
    by_group: byGroup,
    sitemap: { urls: sitemapUrls.length, all_200_no_redirect: sitemapChecks.every((s) => s.hops === 0 && s.finalStatus === 200) },
    failures,
    results: results.map((r) => ({
      group: r.group,
      from: r.from,
      status: r.hops ? r.status : r.finalStatus,
      hops: r.hops,
      to: r.final,
    })),
  };

  fs.writeFileSync(
    path.join(ROOT, "content/data/redirect-audit.json"),
    JSON.stringify(audit, null, 1) + "\n",
  );

  const codes = ["200", "301", "302", "410", "404", "error"];
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n  ${pad("group", 24)}${pad("urls", 7)}${codes.map((c) => pad(c, 7)).join("")}`);
  console.log(`  ${"-".repeat(24 + 7 + codes.length * 7)}`);
  for (const [g, b] of Object.entries(byGroup)) {
    const n = Object.values(b).reduce((a, x) => a + x, 0);
    console.log(`  ${pad(g, 24)}${pad(n, 7)}${codes.map((c) => pad(b[c] ?? "·", 7)).join("")}`);
  }
  console.log(`  ${"-".repeat(24 + 7 + codes.length * 7)}`);
  console.log(
    `  ${pad("TOTAL", 24)}${pad(results.length, 7)}${codes.map((c) => pad(totals[c] ?? "·", 7)).join("")}\n`,
  );
  for (const [k, v] of Object.entries(audit.assertions)) {
    console.log(`  ${v ? "PASS" : "FAIL"}  ${k}`);
  }
  console.log(`  ${audit.sitemap.all_200_no_redirect ? "PASS" : "FAIL"}  sitemap: ${sitemapUrls.length} URLs, all 200, none redirecting`);

  if (failures.length) {
    console.error(`\ncrawl-old-urls: ${failures.length} failure(s).\n`);
    for (const f of failures.slice(0, 40)) console.error(`  [${f.why}] ${f.url}\n      ${f.detail}`);
    if (failures.length > 40) console.error(`  …and ${failures.length - 40} more (see redirect-audit.json).`);
    process.exitCode = 1;
  } else {
    console.log(`\ncrawl-old-urls: all ${results.length} URLs pass. content/data/redirect-audit.json written.\n`);
  }
} finally {
  owned?.kill();
}
