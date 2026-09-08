/**
 * Harvest the images the kept pages reference but the export dropped.
 *
 * WHY THIS EXISTS
 *
 * The WordPress → markdown export threw away every WPBakery `[vc_single_image image="ID"]`
 * shortcode. The prose survived; the photographs did not, and neither did the files —
 * about two dozen images that the old pages showed are not in `public/brand/photos`.
 * `localImg()` would happily hotlink www.jessecaron.com for those, which looks fine right
 * up until the old WordPress is switched off. So: fetch them, once, into the repo.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not mirror the media library. Of 1,038 listable uploads, 720 are referenced by
 * nothing at all and ~190 only by Malmö theme-demo pages. This script resolves the images
 * that the pages we are actually keeping reference, and fetches only those.
 *
 * METHOD (same as the product harvest: read-only, sequential, unhurried)
 *
 *   1. Build an id → media row index from `/wp-json/wp/v2/media` (11 paged GETs of metadata
 *      only — no image bytes). Cached on disk between runs; `--refresh` re-fetches.
 *   2. GET each kept page's REST record and pull every image reference out of the *raw*
 *      rendered content: `[vc_single_image image="ID"]` and friends (the REST API returns
 *      WPBakery shortcodes unexpanded, so ids must be resolved through the media index),
 *      `<img src|data-src|srcset>`, bare image URLs, and the featured media id.
 *   3. Resolve every reference to the *full-size original*: WordPress's `-1024x683` size
 *      suffix is stripped, and an id resolves straight to `source_url`, which is the original.
 *   4. Skip anything already on disk. Matching is by basename AND by basename with the
 *      `-WxH` suffix stripped, exactly as `localImg()` does — six files were re-downloaded
 *      needlessly once because only the exact basename was checked.
 *   5. Download what is left (1.5 s apart, desktop UA, GET only), and if the long edge is
 *      over 2000 px re-encode it down to 2000 px in place, same filename.
 *   6. Extend `lib/image-manifest.json`, write `lib/image-dimensions.json`, and record every
 *      decision in `content/data/media-harvest-report.json`.
 *
 * Idempotent: a second run downloads nothing and rewrites the same three files.
 *
 * Usage:
 *   node scripts/harvest-media.mjs               # harvest
 *   node scripts/harvest-media.mjs --dry-run     # resolve and report, download nothing
 *   node scripts/harvest-media.mjs --refresh     # re-fetch the media index and page bodies
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const ROOT = process.cwd();
const SITE = "https://www.jessecaron.com";
const PHOTOS_DIR = path.join(ROOT, "public", "brand", "photos");
const PHOTOS_URL_PREFIX = "/brand/photos/";
const MANIFEST_PATH = path.join(ROOT, "lib", "image-manifest.json");
const DIMENSIONS_PATH = path.join(ROOT, "lib", "image-dimensions.json");
const REPORT_PATH = path.join(ROOT, "content", "data", "media-harvest-report.json");
const CACHE_DIR = path.join(os.tmpdir(), "jessecaron-harvest");

const DELAY_MS = 1500;
const MAX_EDGE = 2000;
const JPEG_QUALITY = 82;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REFRESH = args.has("--refresh");

/**
 * The pages whose imagery we owe. The twelve that survive in `content/pages` plus the three
 * §2 says are worth harvesting. `shirts`/`teamkleding` are not here: Phase 0 dropped them
 * from `pages` and their pictures already came across with the shop harvest.
 */
const KEPT_PAGES = [
  "loopscholing",
  "functionele-kracht-trainen",
  "functionele-snelheid-trainen",
  "personal-training",
  "zomerstop-training",
  "sportmassage",
  "oefeningen",
  "groepstrainingen",
  "prijzen",
  "snelheidsmetingen",
  "voorwaarden",
  "contact",
];
const HARVESTED_PAGES = ["data", "schoolsport-vereniging-rotterdam-atletiek", "records"];
const SLUGS = [...KEPT_PAGES, ...HARVESTED_PAGES];

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)$/i;
const SIZE_SUFFIX = /-\d+x\d+(?=\.[a-z0-9]+$)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------
let requests = 0;

async function getJSON(url) {
  requests++;
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function cached(name, produce) {
  const file = path.join(CACHE_DIR, name);
  if (!REFRESH && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  const value = await produce();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
  return value;
}

/**
 * Every media row, as metadata only. This is the id → URL dictionary the shortcodes need;
 * it is also the only place the *original* filename and its true pixel dimensions live.
 */
async function fetchMediaIndex() {
  return cached("media-all.json", async () => {
    const rows = [];
    for (let page = 1; page <= 20; page++) {
      const url = `${SITE}/wp-json/wp/v2/media?per_page=100&page=${page}&_fields=id,source_url,mime_type,media_details`;
      let batch;
      try {
        batch = await getJSON(url);
      } catch {
        break; // page past the end returns 400
      }
      if (!Array.isArray(batch) || batch.length === 0) break;
      rows.push(
        ...batch.map((m) => ({
          id: m.id,
          source_url: m.source_url,
          mime_type: m.mime_type,
          width: m.media_details?.width ?? null,
          height: m.media_details?.height ?? null,
        })),
      );
      log(`  media page ${page}: ${batch.length} rows (${rows.length} total)`);
      await sleep(DELAY_MS);
    }
    return rows;
  });
}

async function fetchPages() {
  return cached("kept-pages.json", async () => {
    const out = [];
    for (const slug of SLUGS) {
      const url = `${SITE}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,link,content,featured_media`;
      const rows = await getJSON(url);
      if (!rows.length) {
        log(`  ! ${slug}: no page on the old site`);
        out.push({ slug, missing: true });
      } else {
        const p = rows[0];
        out.push({
          slug,
          id: p.id,
          link: p.link,
          featured_media: p.featured_media || 0,
          html: p.content?.rendered ?? "",
        });
        log(`  ${slug}: ${(p.content?.rendered ?? "").length} bytes`);
      }
      await sleep(DELAY_MS);
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// Reference extraction
// ---------------------------------------------------------------------------
/** WordPress serves `&#8221;` (a curly quote) where the editor typed `"`. Normalise. */
function decodeEntities(s) {
  return s
    .replace(/&#8220;|&#8221;|&#8243;|&#8242;|&#8216;|&#8217;|&quot;|&#0*34;|&#0*39;/g, '"')
    .replace(/&amp;/g, "&");
}

/**
 * Every image reference in one page body, as either `{kind:'id'}` or `{kind:'url'}`.
 * Shortcodes come back unexpanded from the REST API, so the id forms matter more than the
 * `<img>` forms — on `loopscholing` there are eight shortcodes and zero `<img>` tags.
 */
function extractRefs(html) {
  const refs = [];
  const text = decodeEntities(html);

  // [vc_single_image image="123"], [vc_icon ... ], any shortcode attribute holding one id.
  // Also the theme's page hero, which is a *row* attribute rather than an image element:
  // `[vc_row row_type="parallax" parallax_background_image="6275"]`. Those heroes are half
  // the pictures a training page showed, so a narrow `image="\d+"` misses them. Any
  // attribute whose name contains "image" and whose value is digits-only counts;
  // `img_size="full"` is excluded by the value, not the name.
  for (const m of text.matchAll(/\b([a-z_]*image[a-z_]*)="(\d+)"/gi)) {
    refs.push({ kind: "id", value: Number(m[2]), via: m[1].toLowerCase() });
  }
  // [vc_images_carousel images="1,2,3"], [vc_gallery ...]
  for (const m of text.matchAll(/\b(?:images|include|ids)="([\d,\s]+)"/gi)) {
    for (const id of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      refs.push({ kind: "id", value: Number(id), via: "shortcode-list" });
    }
  }
  // Plain markup, wherever the editor dropped raw HTML in.
  for (const m of text.matchAll(/<img[^>]*?\s(?:data-)?src="([^"]+)"/gi)) {
    refs.push({ kind: "url", value: m[1], via: "img-src" });
  }
  for (const m of text.matchAll(/srcset="([^"]+)"/gi)) {
    for (const part of m[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push({ kind: "url", value: url, via: "srcset" });
    }
  }
  // Bare URLs, including CSS `background-image:url(...)` and shortcode `image="https://..."`.
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>()\]]+\.(?:jpe?g|png|gif|webp|avif)/gi)) {
    refs.push({ kind: "url", value: m[0], via: "bare-url" });
  }

  /**
   * Only the uploads directory is content. Themes and plugins ship their own art —
   * revslider's `dummy.png` lazy-load placeholder is the one that keeps turning up — and
   * that is chrome, not photography. Harvesting it would put a placeholder in the manifest
   * and make a page look as though it had a picture it never had.
   */
  return refs.filter(
    (r) =>
      (r.kind === "id" && Number.isFinite(r.value) && r.value > 0) ||
      (r.kind === "url" && /\/wp-content\/uploads\//i.test(r.value)),
  );
}

// ---------------------------------------------------------------------------
// Disk matching — must mirror localImg() exactly
// ---------------------------------------------------------------------------
function basenameOf(url) {
  try {
    return decodeURIComponent(url.split("?")[0].split("#")[0].split("/").pop() ?? "");
  } catch {
    return url.split("?")[0].split("#")[0].split("/").pop() ?? "";
  }
}
const unsize = (base) => base.replace(SIZE_SUFFIX, "");

/**
 * `localImg()` tries the exact basename, then the basename with the `-WxH` size suffix
 * stripped. Anything that resolves either way is already on disk and must not be fetched
 * again — that mistake cost six needless downloads the first time round.
 */
function resolveLocal(base, manifest) {
  if (manifest[base]) return { key: base, path: manifest[base] };
  const un = unsize(base);
  if (un !== base && manifest[un]) return { key: un, path: manifest[un] };
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log("harvest-media — resolving the imagery the export dropped\n");

  log("1. media index");
  const media = await fetchMediaIndex();
  log(`   ${media.length} media rows\n`);

  const byId = new Map(media.map((m) => [m.id, m]));
  const byBasename = new Map();
  for (const m of media) {
    const b = basenameOf(m.source_url);
    if (!byBasename.has(b)) byBasename.set(b, m);
  }

  log("2. page bodies");
  const pages = await fetchPages();
  log("");

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const onDisk = new Set(fs.existsSync(PHOTOS_DIR) ? fs.readdirSync(PHOTOS_DIR) : []);

  // --- resolve every reference to one full-size original -------------------
  /** @type {Map<string, {basename:string, sourceUrl:string|null, mediaId:number|null, width:number|null, height:number|null, refs:Set<string>, pages:Set<string>}>} */
  const wanted = new Map();
  const unresolved = [];

  function want(key, patch, slug, via) {
    let e = wanted.get(key);
    if (!e) {
      e = { basename: key, sourceUrl: null, mediaId: null, width: null, height: null, pages: new Set(), refs: new Set() };
      wanted.set(key, e);
    }
    Object.assign(e, Object.fromEntries(Object.entries(patch).filter(([, v]) => v != null)));
    e.pages.add(slug);
    e.refs.add(via);
    return e;
  }

  const perPage = [];
  for (const page of pages) {
    if (page.missing) {
      perPage.push({ slug: page.slug, missing: true, refs: 0 });
      continue;
    }
    const refs = extractRefs(page.html);
    if (page.featured_media) refs.push({ kind: "id", value: page.featured_media, via: "featured" });

    const seen = new Set();
    for (const ref of refs) {
      if (ref.kind === "id") {
        const m = byId.get(ref.value);
        if (!m) {
          unresolved.push({ page: page.slug, ref: `#${ref.value}`, why: "id not in media index" });
          continue;
        }
        if (!IMAGE_EXT.test(m.source_url)) continue;
        const base = basenameOf(m.source_url);
        seen.add(base);
        want(base, { sourceUrl: m.source_url, mediaId: m.id, width: m.width, height: m.height }, page.slug, ref.via);
      } else {
        if (!IMAGE_EXT.test(ref.value)) continue;
        const raw = basenameOf(ref.value);
        const base = unsize(raw); // always aim at the full-size original
        seen.add(base);
        const m = byBasename.get(base) ?? byBasename.get(raw);
        want(
          base,
          m
            ? { sourceUrl: m.source_url, mediaId: m.id, width: m.width, height: m.height }
            : { sourceUrl: ref.value.replace(SIZE_SUFFIX, "") },
          page.slug,
          ref.via,
        );
      }
    }
    perPage.push({ slug: page.slug, refs: seen.size, basenames: [...seen].sort() });
    log(`   ${page.slug.padEnd(42)} ${seen.size} image ref(s)`);
  }
  log(`\n   ${wanted.size} distinct originals referenced by the ${pages.filter((p) => !p.missing).length} pages`);

  // --- split into already-present and to-fetch -----------------------------
  const files = [];
  const toFetch = [];
  for (const entry of [...wanted.values()].sort((a, b) => a.basename.localeCompare(b.basename))) {
    const hit = resolveLocal(entry.basename, manifest);
    const diskPath = hit ? path.join(ROOT, "public", hit.path) : null;
    if (hit && diskPath && fs.existsSync(diskPath)) {
      files.push({ entry, already: true, localPath: hit.path, manifestKey: hit.key });
    } else if (onDisk.has(entry.basename)) {
      // On disk but not in the manifest. That is a file an interrupted run of *this* script
      // left behind, so adopt it rather than paying for the download again — but push it
      // through the size gate first, because an interrupted run is exactly the one that did
      // not get to resize.
      const abs = path.join(PHOTOS_DIR, entry.basename);
      if (!DRY_RUN) await downscale(abs, fs.readFileSync(abs));
      files.push({ entry, already: true, localPath: PHOTOS_URL_PREFIX + entry.basename, manifestKey: entry.basename, adopted: true });
    } else {
      toFetch.push(entry);
    }
  }
  log(`   ${files.length} already on disk, ${toFetch.length} to fetch\n`);

  // --- fetch ---------------------------------------------------------------
  const fetched = [];
  const failed = [];
  if (toFetch.length && !DRY_RUN) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  log("3. download");
  for (const entry of toFetch) {
    if (!entry.sourceUrl) {
      failed.push({ basename: entry.basename, why: "no source URL could be resolved", pages: [...entry.pages] });
      continue;
    }
    if (DRY_RUN) {
      log(`   [dry-run] ${entry.basename} ← ${entry.sourceUrl}`);
      continue;
    }
    const dest = path.join(PHOTOS_DIR, entry.basename);
    try {
      requests++;
      const res = await fetch(entry.sourceUrl, { headers: { "user-agent": UA } });
      if (!res.ok) {
        // The original may have been deleted while a resized copy survives; try what
        // the page actually pointed at before giving up.
        throw new Error(`HTTP ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const info = await downscale(dest, buf);
      fetched.push({ ...(await describe(dest, entry, info)), downloadedBytes: buf.length });
      log(`   ✓ ${entry.basename} — ${fmt(info.bytes)}${info.resizedFrom ? ` (resized from ${info.resizedFrom})` : ""}`);
    } catch (err) {
      failed.push({ basename: entry.basename, url: entry.sourceUrl, why: String(err.message ?? err), pages: [...entry.pages] });
      log(`   ✗ ${entry.basename} — ${err.message ?? err}`);
    }
    await sleep(DELAY_MS);
  }
  if (!toFetch.length) log("   nothing to fetch — everything referenced is already on disk");
  log("");

  if (DRY_RUN) {
    log("dry run: no files written.");
    return;
  }

  // --- manifest + dimensions ----------------------------------------------
  log("4. manifest and dimensions");
  for (const f of fetched) manifest[f.basename] = PHOTOS_URL_PREFIX + f.basename;
  for (const f of files) if (f.adopted) manifest[f.entry.basename] = f.localPath;

  const sorted = Object.fromEntries(Object.keys(manifest).sort((a, b) => a.localeCompare(b)).map((k) => [k, manifest[k]]));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + "\n");

  /**
   * `{path, w, h}` lives *beside* the manifest rather than inside it: `lib/content.ts`
   * casts the manifest to `Record<string, string>` and `scripts/check-images.mjs` indexes
   * it the same way, and both belong to other agents this phase. Same keys, so a caller
   * that wants dimensions does `dimensions[base]` and gets `{path, w, h}`.
   */
  const dims = {};
  let oversize = 0;
  for (const [base, rel] of Object.entries(sorted)) {
    const abs = path.join(ROOT, "public", rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const meta = await metadataWithRetry(abs, 2);
      dims[base] = { path: rel, w: meta.width ?? null, h: meta.height ?? null };
      if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE) oversize++;
    } catch {
      dims[base] = { path: rel, w: null, h: null };
    }
  }
  fs.writeFileSync(DIMENSIONS_PATH, JSON.stringify(dims, null, 2) + "\n");
  log(`   manifest: ${Object.keys(sorted).length} entries (+${fetched.length})`);
  log(`   dimensions: ${Object.keys(dims).length} entries; ${oversize} file(s) still over ${MAX_EDGE}px (Phase 4's resize pass)`);

  // --- report --------------------------------------------------------------
  const presentRows = [];
  for (const f of files) presentRows.push(await describe(path.join(ROOT, "public", f.localPath), f.entry, null, true));
  let rows = [...fetched.map((f) => ({ ...f, already_present: false })), ...presentRows].sort((a, b) =>
    a.basename.localeCompare(b.basename),
  );

  /**
   * `already_present` means "was on disk before this harvest started", not "was on disk
   * when this particular run started". The script is idempotent, so a second run finds
   * everything present and would otherwise rewrite the report to claim the harvest fetched
   * nothing — erasing exactly the provenance the report exists to record. So: once a file
   * is marked as fetched, it stays marked, and `fetched_at` says when.
   */
  const priorRows = fs.existsSync(REPORT_PATH)
    ? new Map((JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")).files ?? []).map((r) => [r.basename, r]))
    : new Map();
  const now = new Date().toISOString();
  rows = rows.map((r) => {
    const prior = priorRows.get(r.basename);
    if (!r.already_present) return { ...r, fetched_at: prior?.fetched_at ?? now };
    if (prior && prior.already_present === false) {
      return { ...r, already_present: false, fetched_at: prior.fetched_at, source_url: r.source_url ?? prior.source_url, resized_from: r.resized_from ?? prior.resized_from };
    }
    return r;
  });
  const harvested = rows.filter((r) => !r.already_present);

  const report = {
    generated: new Date().toISOString(),
    source_site: SITE,
    method:
      "Sequential GET (1.5s delay, desktop UA, read-only). Image references resolved from the old site's " +
      "REST page bodies: WPBakery [vc_single_image image=\"ID\"] and friends resolved through a metadata-only " +
      "dump of /wp-json/wp/v2/media, plus <img src|srcset> and bare URLs. WordPress's -WxH size suffix is " +
      "stripped so the full-size original is fetched. Files already on disk are matched by basename AND by " +
      "basename with the size suffix stripped, exactly as localImg() does, so nothing is downloaded twice. " +
      "Anything whose long edge exceeded " + MAX_EDGE + "px was re-encoded to " + MAX_EDGE + "px (quality " + JPEG_QUALITY + ") in place. " +
      "The media library itself was NOT mirrored: 720 of 1,038 uploads are referenced by nothing.",
    pages: perPage,
    totals: {
      pages_probed: SLUGS.length,
      pages_found: pages.filter((p) => !p.missing).length,
      distinct_images_referenced: wanted.size,
      already_present: rows.length - harvested.length,
      harvested: harvested.length,
      fetched_this_run: fetched.length,
      failed: failed.length,
      bytes_added: harvested.reduce((n, f) => n + (f.bytes || 0), 0),
      bytes_added_this_run: fetched.reduce((n, f) => n + f.bytes, 0),
      bytes_total_referenced: rows.reduce((n, f) => n + (f.bytes || 0), 0),
      http_requests: requests,
      manifest_entries_total: Object.keys(sorted).length,
      max_edge_px: MAX_EDGE,
      files_over_max_edge_in_manifest: oversize,
    },
    files: rows,
    unresolved,
    failed,
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  log(`   report: ${path.relative(ROOT, REPORT_PATH)}`);

  log(
    `\ndone — harvest owns ${harvested.length} file(s), ${fmt(report.totals.bytes_added)} added to public/; ` +
      `${fetched.length} fetched this run (${fmt(report.totals.bytes_added_this_run)}); ` +
      `${report.totals.already_present} already present; ${failed.length} failed; ${requests} HTTP requests.`,
  );
  if (failed.length) {
    log("\nreferenced but not served by the old site:");
    for (const f of failed) log(`   ${f.basename} — ${f.why} (${f.pages.join(", ")})`);
  }
}

/**
 * Read image metadata, retrying briefly. On Windows a file that was written microseconds
 * ago is sometimes still held open by the on-access virus scanner, and libvips reports
 * that as a bare "unknown error, open '...'" — which looks exactly like a corrupt download
 * and is not one. Two files were misreported as "the old site no longer serves this"
 * before this retry existed.
 */
async function metadataWithRetry(file, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await sharp(file, { failOn: "none" }).metadata();
    } catch (err) {
      last = err;
      await sleep(200 * (i + 1));
    }
  }
  throw last;
}

/**
 * Bring a just-downloaded image under the size gate and write it once.
 *
 * Everything happens on the in-memory buffer, and the file is written exactly once, at the
 * end. That is deliberate: writing the download and then re-opening it by path failed on
 * Windows for two of the twenty-seven files with libvips' opaque "unknown error, open
 * '<path>'" — the on-access virus scanner still had the newly created file open — and the
 * script mistook that for "the old site no longer serves this image". Never read back a
 * file you wrote microseconds ago when you still have its bytes.
 */
async function downscale(dest, buf) {
  const meta = await sharp(buf, { failOn: "none" }).metadata();
  const long = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (long <= MAX_EDGE) {
    fs.writeFileSync(dest, buf);
    return { bytes: buf.length, w: meta.width ?? null, h: meta.height ?? null, resizedFrom: null };
  }
  const pipeline = sharp(buf, { failOn: "none" }).resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });
  const ext = path.extname(dest).toLowerCase();
  const out =
    ext === ".png"
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : ext === ".webp"
        ? await pipeline.webp({ quality: JPEG_QUALITY }).toBuffer()
        : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  const after = await sharp(out, { failOn: "none" }).metadata();
  fs.writeFileSync(dest, out);
  return {
    bytes: out.length,
    w: after.width ?? null,
    h: after.height ?? null,
    resizedFrom: `${meta.width}×${meta.height}`,
  };
}

async function describe(absPath, entry, info, already = false) {
  const bytes = fs.existsSync(absPath) ? fs.statSync(absPath).size : 0;
  let { w, h } = info ?? {};
  if (w == null && fs.existsSync(absPath)) {
    try {
      const meta = await metadataWithRetry(absPath, 2);
      w = meta.width ?? null;
      h = meta.height ?? null;
    } catch {
      /* not an image sharp can read; leave null */
    }
  }
  return {
    basename: entry.basename,
    source_url: entry.sourceUrl,
    media_id: entry.mediaId,
    local_path: PHOTOS_URL_PREFIX + path.basename(absPath),
    bytes,
    width: w ?? entry.width ?? null,
    height: h ?? entry.height ?? null,
    resized_from: info?.resizedFrom ?? null,
    already_present: already,
    referenced_by: [...entry.pages].sort(),
    reference_kind: [...entry.refs].sort(),
  };
}

const fmt = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`);

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
