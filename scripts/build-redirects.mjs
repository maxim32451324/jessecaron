/**
 * Generates `content/data/redirects.json` — the whole old-URL space of
 * www.jessecaron.com mapped onto this site — which `next.config.ts` serves.
 *
 * WHY THIS IS A SCRIPT AND NOT A HAND-WRITTEN LIST
 *
 * The old WordPress sitemap advertises 797 URLs. 27 of them are posts, 38 are
 * products, 68 are category archives, 261 are tag archives: four sets that already
 * exist as data in `content/data/`, and that would go stale the first time a post is
 * renamed or a category crosses the five-post line that decides whether it gets an
 * archive page. Typing them out once produces a map that is correct today and wrong
 * in a month, silently, because nothing re-reads a 300-row config.
 *
 * So the rows are derived: from `content.json` (posts, pages, products), from
 * `taxonomy.json` (which categories became pages, which term was merged into which),
 * and from `old-urls.json` (the sitemap itself, cached so this still runs after the
 * WordPress host is switched off). The only things typed by hand are the classifications
 * that are not derivable from data — which of the 138 old pages were Malmö theme demos,
 * and which of them were real.
 *
 * The rules that map an old path to a route live in `lib/legacy-routes.mjs`, shared
 * with `lib/content.server.ts`, so a link inside a page body and a link from Google
 * land on the same place. Extend that file, not this one, when a page moves.
 *
 * THE COVERAGE ASSERTION is the point of the whole script: it replays every one of the
 * 797 sitemap URLs through the generated map, in order, exactly as Next will, and fails
 * if a single one is unaccounted for. A redirect map you cannot prove is complete is a
 * redirect map with 404s in it.
 *
 *   node scripts/build-redirects.mjs           write content/data/redirects.json
 *   node scripts/build-redirects.mjs --check   fail if the file on disk is out of date
 */
import fs from "node:fs";
import path from "node:path";
import { ALIASES, ASSET_ALIASES, buildSlugRoutes, resolveInternal } from "../lib/legacy-routes.mjs";

const ROOT = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const content = read("content/data/content.json");
const taxonomy = read("content/data/taxonomy.json");
const old = read("content/data/old-urls.json");

const slugRoutes = buildSlugRoutes(content);

/** Routes this site actually serves, top level. Never redirect one of these. */
const LIVE_ROUTES = new Set([
  "/",
  "/training",
  "/videos",
  "/blog",
  "/blog/onderwerpen",
  "/shop",
  "/aanmelden",
  "/contact",
  "/prijzen",
  "/voorwaarden",
]);

const TRAINING_SLUGS = new Set(
  content.pages
    .map((p) => p.slug)
    .filter((s) => !["prijzen", "voorwaarden", "contact", "records"].includes(s)),
);

// ---------------------------------------------------------------------------
// 1. The 138 old pages, classified by hand — the only hand-classification here.
//    Everything in this section came out of PARITY-PLAN §1.3, which read the
//    rendered content of all 138.
// ---------------------------------------------------------------------------

/**
 * 410 Gone, not 301. These are Malmö theme-demo layouts (lorem ipsum, dummy
 * portfolios, dummy shop grids) and WordPress's own plumbing. They are indexed —
 * they were in the client's sitemap — so they need an answer, and the honest answer
 * is that they are gone: a 410 de-indexes faster than a soft 301 to the home page,
 * and it does not teach Google that the home page is the same thing as
 * `/elements/pie-charts/`.
 *
 * Served as rewrites to `app/gone/route.ts`, because `redirects()` cannot return 410.
 */
const GONE = [
  // Malmö element demos: 34 pages of buttons, accordions and pie charts.
  "/elements",
  "/elements/:path*",
  "/blurb-elements",
  "/blurb-elements/:path*",
  // Dummy portfolio and shop grids.
  "/shop-lists",
  "/shop-lists/:path*",
  "/standard-portfolio-lists",
  "/standard-portfolio-lists/:path*",
  "/gallery-portfolio-lists",
  "/gallery-portfolio-lists/:path*",
  "/portfolio-masonry-lists",
  "/portfolio-masonry-lists/:path*",
  "/boxes-portfolio",
  "/gallery-portfolio",
  "/masonry-portfolio",
  "/parallax-portfolio",
  "/pinboard-portfolio",
  "/portfolio-carousel",
  "/pinterest-portfolio-list",
  // WordPress itself. After the domain moves these paths are ours, and there is no
  // WordPress behind them. 410 rather than 404 so scanners stop asking.
  "/wp-json/:path*",
  "/wp-admin/:path*",
  "/wp-login.php",
  "/xmlrpc.php",
  "/wp-includes/:path*",
  "/wp-content/plugins/:path*",
  "/wp-content/themes/:path*",
];

/**
 * Theme-demo pages that get a 301 to the home page rather than a 410: alternative
 * home-page layouts and marketing filler. They are gone in the same sense, but their
 * URLs read like something a person might have bookmarked (`/landing/`, `/pricing/`,
 * `/our-team/`), so a redirect is kinder than a slammed door.
 */
const DEMO_TO_HOME = [
  "/boxed-home",
  "/business-home",
  "/main-home",
  "/parallax-home",
  "/shop-home",
  "/shop-home-example",
  "/shop-masonry",
  "/shop-masonry-example",
  "/product-landing",
  "/coming-soon",
  "/jewelry-store",
  "/landing",
  "/our-team",
  "/our-team-1",
  "/our-team-2",
  "/pricing",
  "/sample-page",
  "/services",
  "/services-2",
  "/services-2-2",
  "/services-3",
  "/shortcodes",
  "/split-screen-slider",
  "/voorbeeld-pagina",
  "/voorbeeld-pagina-2",
  "/justified-gallery-list",
  // Two 2011–2013 stubs: two motivational quotes, and a 146-character page.
  "/media",
  // The theme's about-page demo. The one on this site was deleted in Phase 0 for the
  // same reason: "Combining Form & Function — Lorem ipsum".
  "/about",
  "/about/about-ext-alt",
  "/about/profile-page",
  "/about/profile-page-alt",
  // Password-test and offline stubs.
  "/testwachtwoord",
  "/offline",
];

/** Demo blog layouts — they at least name the right section. */
const DEMO_TO_BLOG = ["/blog-2", "/blog-split-column", "/standard-blog-list"];

/**
 * The old portfolio index. Its 21 items are this site's `/videos`, so the index
 * belongs there too rather than at the home page — a visitor following a 2013 link to
 * "portfolio" wants to see the work.
 */
const TO_VIDEOS_PAGES = ["/portfolio"];

/**
 * WooCommerce plumbing and the shop listing pages.
 *
 * `/cart/`, `/checkout/` and the account pages are marked `shopOrigin`: their real
 * destination depends on a decision that has not been taken yet (PARITY-PLAN §11 Q2 —
 * does WooCommerce move to shop.jessecaron.com, or does selling stop?). Until it is,
 * they land on `/shop` with a 302, because a 301 would be cached by browsers and would
 * outlive the decision. See `next.config.ts`.
 */
const WOO_PLUMBING = ["/cart", "/winkelmand", "/checkout", "/afrekenen", "/my-account", "/mijn-account"];
// `/products`, `/shirts` and `/teamkleding` come from ALIASES instead — the same rows
// that fix the body links pointing at them.
const TO_SHOP_PAGES = ["/winkel", "/smartgoals-kopen"];

/**
 * Every old path named in `lib/legacy-routes.mjs`. Each becomes an explicit row, so
 * the pages that moved and changed name are declared in one file and served from it —
 * the redirect and the in-body link rewrite cannot disagree, because they are the same
 * table read twice.
 */
const VIA_ALIASES = Object.keys(ALIASES);

// ---------------------------------------------------------------------------
// 2. Build the rows.
// ---------------------------------------------------------------------------

const rows = [];
const seen = new Set();

/**
 * `statusCode: 301` rather than `permanent: true`, deliberately. Next's `permanent`
 * flag emits 308, which is the modern, method-preserving equivalent — and which some
 * older crawlers, link checkers and the client's own reporting still do not treat as
 * "moved permanently". PARITY-PLAN §8.1 specifies 301 for every row; this is a
 * migration off a fifteen-year-old WordPress, so it uses the code the whole web agrees
 * about.
 *
 * @param {string} source @param {string} destination @param {object} [extra]
 */
function add(source, destination, extra = {}) {
  if (seen.has(source)) return;
  if (source === destination) throw new Error(`redirect loop: ${source}`);
  seen.add(source);
  rows.push({ source, destination, statusCode: 301, ...extra });
}

// --- 2a. Top-level content pages -------------------------------------------
// Posts, training pages, products and the renamed/folded pages all go through the
// same resolver the markdown link rewriter uses. If it answers, that is the answer.
for (const slug of [...content.posts.map((p) => p.slug), ...TRAINING_SLUGS]) {
  const to = resolveInternal(`/${slug}`, slugRoutes);
  if (to && to !== `/${slug}`) add(`/${slug}`, to);
}
for (const alias of VIA_ALIASES) {
  const to = resolveInternal(alias, slugRoutes);
  if (to) add(alias, to);
}
for (const p of content.products) {
  add(`/product/${p.slug}`, `/shop/${p.slug}`);
}
// The one product whose slug changed in the move.
add("/product/stroboscoop-knipper-bril", "/shop/stroboscoop-glasses");

// --- 2b. The Kleurplaat PDF -------------------------------------------------
// Its bytes now live in `public/downloads/`, so the old upload URL — which becomes
// ours the moment DNS moves — points at the local copy instead of at nothing.
for (const [from, to] of Object.entries(ASSET_ALIASES)) add(from, to);

// --- 2c. Categories ---------------------------------------------------------
//
// Three rules, in order, and no hardcoded slugs:
//   1. a category that became an archive page  -> its archive
//   2. a category whose slug is a page on this site -> that page
//   3. a category that names a person          -> the newest post it labels
//   4. anything else                           -> /blog
//
// The merged duplicate (`interview` -> `interviews`) is carried in taxonomy.json as
// `merged_into`, so it needs no special case here: it is data, and this reads it.
const postsByCategory = {};
for (const p of content.posts) for (const c of p.categories ?? []) (postsByCategory[c] ??= []).push(p);

/**
 * Category slugs that are a person or an organisation rather than a topic. Not
 * derivable — `errol-esajas` looks exactly like `explosiviteit` to a program — so it
 * is the one list in this section that is typed. Each resolves to the newest post it
 * labels, read from the data, so a renamed post takes its redirect with it.
 */
const PERSON_CATEGORIES = new Set([
  "errol-esajas",
  "nargelis-statia",
  "tarik-tahiri",
  "pieter-jan-van-der-heiden",
  "samet-dag",
  "shirtsponsor",
]);

const pageCategories = new Set(taxonomy.categories.filter((c) => c.page).map((c) => c.slug));

function termDestination(slug) {
  if (pageCategories.has(slug)) return `/blog/categorie/${slug}`;
  const merged = taxonomy.categories.find((c) => c.slug === slug)?.merged_into;
  if (merged && pageCategories.has(merged)) return `/blog/categorie/${merged}`;
  if (TRAINING_SLUGS.has(slug)) return `/training/${slug}`;
  if (PERSON_CATEGORIES.has(slug)) {
    const posts = [...(postsByCategory[slug] ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (posts.length) return `/blog/${posts[0].slug}`;
    // `samet-dag` and `shirtsponsor` label nothing: the first is a video subject, the
    // second a sponsorship. Neither has an article to land on.
    return slug === "samet-dag" ? "/videos" : "/shop";
  }
  return null;
}

for (const c of taxonomy.categories) {
  const to = termDestination(c.slug);
  if (to) add(`/category/${c.slug}`, to);
}

// --- 2d. Tags ---------------------------------------------------------------
// 597 of them, 336 with no posts at all. None become pages (PARITY-PLAN §2). The 15
// whose slug is also a built category, and the 3 whose slug is a page here, get the
// real destination; the remaining ~579 fall through to the `/tag/:slug` catch-all.
for (const t of taxonomy.tags) {
  const to = termDestination(t.slug);
  if (to) add(`/tag/${t.slug}`, to);
}

// --- 2e. Everything else, as patterns ---------------------------------------
for (const p of DEMO_TO_HOME) add(p, "/");
for (const p of DEMO_TO_BLOG) add(p, "/blog");
for (const p of TO_VIDEOS_PAGES) add(p, "/videos");
for (const p of TO_SHOP_PAGES) add(p, "/shop");
for (const p of WOO_PLUMBING) add(p, "/shop", { statusCode: 302, shopOrigin: p });

add("/aanmelden-padeltoernooi", "/shop/padeltoernooi");

// The 21 old portfolio items, their categories and their tags. `/videos` lists all 21
// with an `id` per slug, so a person following a 2016 link still finds the right clip.
add("/portfolio-item/:slug*", "/videos");
add("/portfolio_item/:slug*", "/videos");
add("/portfolio-category/:slug*", "/videos");
add("/portfolio-tag/:slug*", "/videos");
add("/type/:slug*", "/videos");

// Taxonomy noise with nothing behind it.
add("/testimonials-category/:slug*", "/");
add("/carousels-category/:slug*", "/");

// Shop taxonomies: 4 product categories and 116 product tags, against 38 products.
add("/product-categorie/:slug*", "/shop");
add("/productcategorie/:slug*", "/shop");
add("/product-tag/:slug*", "/shop");
add("/product_shipping_class/:slug*", "/shop");
add("/product/:slug*", "/shop");

// One author, no author pages.
add("/author/:slug*", "/blog");

// Catch-alls for the terms not named above. These must come after the explicit rows.
add("/category/:slug*", "/blog");
add("/tag/:slug*", "/blog");

// WordPress pagination and feeds. The largest archive here holds 13 posts on one page,
// so every `/page/N/` collapses onto its parent.
add("/page/:n", "/blog");
add("/blog/page/:n", "/blog");
add("/shop/page/:n", "/shop");
add("/videos/page/:n", "/videos");
add("/category/:slug/page/:n", "/blog");
add("/tag/:slug/page/:n", "/blog");
add("/feed", "/blog");
add("/comments/feed", "/blog");
add("/blog/feed", "/blog");
add("/:slug/feed", "/blog");

// WordPress search. A query, not a moved page, so it is a 302.
rows.push({
  source: "/",
  has: [{ type: "query", key: "s" }],
  destination: "/blog",
  statusCode: 302,
});

// ---------------------------------------------------------------------------
// 3. Coverage: replay all 797 sitemap URLs through the map.
// ---------------------------------------------------------------------------

/** The subset of path-to-regexp Next uses that this map actually needs: `:name` and `:name*`. */
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

const compiled = rows.filter((r) => !r.has).map((r) => ({ ...r, re: toRegExp(r.source) }));
const compiledGone = GONE.map((g) => ({ source: g, re: toRegExp(g) }));

function classify(rawPath) {
  const p = rawPath.split("?")[0].replace(/\/+$/, "") || "/";
  const hit = compiled.find((r) => r.re.test(p));
  if (hit) return { bucket: hit.statusCode === 302 ? "302" : "301", to: hit.destination, via: hit.source };
  const goneHit = compiledGone.find((g) => g.re.test(p));
  if (goneHit) return { bucket: "410", to: null, via: goneHit.source };
  if (LIVE_ROUTES.has(p)) return { bucket: "200", to: p, via: "live route" };
  if (p.startsWith("/training/") && TRAINING_SLUGS.has(p.slice(10))) return { bucket: "200", to: p, via: "live route" };
  return { bucket: "404", to: null, via: null };
}

const buckets = { 200: 0, 301: 0, 302: 0, 410: 0, 404: 0 };
const uncovered = [];
const byGroup = {};
for (const [group, paths] of Object.entries(old.groups)) {
  byGroup[group] = { 200: 0, 301: 0, 302: 0, 410: 0, 404: 0 };
  for (const raw of paths) {
    const c = classify(raw);
    buckets[c.bucket]++;
    byGroup[group][c.bucket]++;
    if (c.bucket === "404") uncovered.push(raw);
  }
}

// Redirect targets must themselves be reachable, or the map trades a 404 for a 404
// one hop later. Checked here on the data; `scripts/crawl-old-urls.mjs` checks it
// again over real HTTP.
const badTargets = [];
for (const r of rows) {
  const d = r.destination;
  if (!d || d.includes(":")) continue;
  if (LIVE_ROUTES.has(d)) continue;
  if (d.startsWith("/downloads/") && fs.existsSync(path.join(ROOT, "public", d))) continue;
  if (d.startsWith("/blog/categorie/") && pageCategories.has(d.slice(16))) continue;
  if (d.startsWith("/blog/") && content.posts.some((p) => `/blog/${p.slug}` === d)) continue;
  if (d.startsWith("/shop/") && content.products.some((p) => `/shop/${p.slug}` === d)) continue;
  if (d.startsWith("/training/") && TRAINING_SLUGS.has(d.slice(10))) continue;
  badTargets.push(`${r.source} -> ${d}`);
}

if (uncovered.length || badTargets.length) {
  if (uncovered.length) {
    console.error(`\nbuild-redirects: ${uncovered.length} old URL(s) have no destination:\n`);
    for (const u of uncovered.slice(0, 40)) console.error(`  ${u}`);
  }
  if (badTargets.length) {
    console.error(`\nbuild-redirects: ${badTargets.length} redirect(s) point at a route that does not exist:\n`);
    for (const b of badTargets.slice(0, 40)) console.error(`  ${b}`);
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Write.
// ---------------------------------------------------------------------------

const output = {
  generated: new Date().toISOString().slice(0, 10),
  note:
    "Generated by scripts/build-redirects.mjs from content.json, taxonomy.json and old-urls.json. " +
    "Do not edit by hand: rerun the script. The path rules live in lib/legacy-routes.mjs.",
  old_urls: old.total,
  coverage: buckets,
  coverage_by_group: byGroup,
  redirects: rows.map(({ ...r }) => r),
  gone: GONE,
};

const file = path.join(ROOT, "content/data/redirects.json");
const text = JSON.stringify(output, null, 1) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const strip = (s) => s.replace(/"generated": "[^"]*",\n/, "");
  if (strip(current) !== strip(text)) {
    console.error("build-redirects --check: content/data/redirects.json is out of date. Run the script.");
    process.exit(1);
  }
  console.log("build-redirects --check: content/data/redirects.json is up to date.");
} else {
  fs.writeFileSync(file, text);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nbuild-redirects: ${rows.length} redirect rows, ${GONE.length} gone patterns.\n`);
console.log(`  ${pad("group", 24)} ${pad("urls", 6)} ${pad("200", 6)} ${pad("301", 6)} ${pad("302", 6)} 410`);
for (const [g, b] of Object.entries(byGroup)) {
  const n = b[200] + b[301] + b[302] + b[410];
  console.log(`  ${pad(g, 24)} ${pad(n, 6)} ${pad(b[200], 6)} ${pad(b[301], 6)} ${pad(b[302], 6)} ${b[410]}`);
}
console.log(
  `  ${pad("TOTAL", 24)} ${pad(old.total, 6)} ${pad(buckets[200], 6)} ${pad(buckets[301], 6)} ${pad(buckets[302], 6)} ${buckets[410]}`,
);
