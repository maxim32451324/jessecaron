#!/usr/bin/env node
/**
 * One-shot re-encode of `public/brand/photos` (PARITY-PLAN §5.3, Phase 4).
 *
 * The harvest pulled WordPress *originals*, which is right for archival and wrong
 * for the web: 190 files, 82 MB, twelve of them over 1 MB, and every one of them
 * served whole to a 400 px blog card. This pass caps the long edge at MAX_EDGE and
 * re-encodes with mozjpeg, **in place and under the same filename**, because the
 * filename is the key `lib/image-manifest.json` and every markdown body use.
 * Renaming here would mean rewriting the manifest, the 15 page bodies and the 27
 * post bodies — and `scripts/check-images.mjs` would (correctly) fail the build
 * the moment one of them drifted.
 *
 *   node scripts/optimize-images.mjs [--dry] [--dir public/brand/photos]
 *
 * PNGs are left alone: all 17 of them together are 2.1 MB, most are technique
 * diagrams with an alpha channel, and re-quantising a line drawing to save 1 MB is
 * a bad trade. JPEG is where the 80 MB is.
 *
 * A re-encode that comes out *larger* than the source is discarded — that happens
 * on the few small already-optimised files, and swapping a 40 KB original for a
 * 44 KB "optimised" copy is a regression the byte count would hide.
 *
 * Originals are not recoverable from git after this runs in the same commit, so
 * keep a copy outside the repo first (§5.3).
 *
 * Re-encoding invalidates two files that record what is on disk, so the run
 * finishes by rewriting both rather than leaving them to drift:
 *   - `lib/image-dimensions.json` — the `{path,w,h}` companion `next/image` reserves
 *     its box from. Stale numbers here would put the layout shift straight back.
 *   - `content/data/media-harvest-report.json` — per-file `bytes`/`width`/`height`
 *     and `totals.files_over_max_edge_in_manifest`, which Phase 4 is meant to drive
 *     to zero.
 * `lib/image-manifest.json` is deliberately NOT touched: same filenames, same paths,
 * and its `Record<string,string>` shape is load-bearing for `localImg()` and
 * `scripts/check-images.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MAX_EDGE = 2000;
const QUALITY = 82;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "lib", "image-manifest.json");
const DIMENSIONS_PATH = path.join(ROOT, "lib", "image-dimensions.json");
const REPORT_PATH = path.join(ROOT, "content", "data", "media-harvest-report.json");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const dirArg = args.indexOf("--dir");
const DIR = dirArg === -1 ? "public/brand/photos" : args[dirArg + 1];

const mb = (n) => (n / 1048576).toFixed(2);

const files = fs
  .readdirSync(DIR)
  .filter((f) => /\.(jpe?g)$/i.test(f))
  .sort();

let before = 0;
let after = 0;
let resized = 0;
let recoded = 0;
let skipped = 0;
const rows = [];

for (const name of files) {
  const file = path.join(DIR, name);
  const src = fs.readFileSync(file);
  const meta = await sharp(src).metadata();
  before += src.length;

  const edge = Math.max(meta.width, meta.height);
  const willResize = edge > MAX_EDGE;

  const out = await sharp(src)
    // Auto-orient first: two of the harvested files carry an EXIF rotation, and
    // stripping the tag (which the re-encode does) without applying it would turn
    // them on their side.
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({
      quality: QUALITY,
      mozjpeg: true,
      progressive: true,
      // 4:4:4 rather than the 4:2:0 default: half these photographs are apparel
      // shots whose subject is a printed logo, and chroma subsampling is exactly
      // what smears a hard-edged mark against fabric.
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();

  // Write only when the re-encode is a real win. Two reasons: a handful of the
  // small already-optimised files come out *larger*, and — more importantly — this
  // makes the script idempotent. Re-running it must not put every photograph
  // through a second generation of lossy encoding to shave a stray kilobyte.
  if (out.length >= src.length * 0.95 && !willResize) {
    skipped += 1;
    after += src.length;
    continue;
  }

  after += out.length;
  if (willResize) resized += 1;
  else recoded += 1;
  rows.push([name, src.length, out.length, `${meta.width}x${meta.height}`]);
  if (!dry) fs.writeFileSync(file, out);
}

rows.sort((a, b) => b[1] - b[2] - (a[1] - a[2]));
for (const [name, b, a, dim] of rows.slice(0, 10)) {
  console.log(`  ${name} ${dim} ${(b / 1024).toFixed(0)}KB -> ${(a / 1024).toFixed(0)}KB`);
}

console.log(
  `\n${dry ? "[dry] " : ""}${files.length} jpeg in ${DIR}: ` +
    `${resized} resized over ${MAX_EDGE}px, ${recoded} re-encoded at q${QUALITY}, ${skipped} left alone.`,
);
console.log(`jpeg bytes ${mb(before)} MB -> ${mb(after)} MB (${((1 - after / before) * 100).toFixed(1)}% off)`);

if (dry) process.exit(0);

// --- re-measure everything the manifest points at ---------------------------
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const dims = {};
const measured = new Map();
let oversize = 0;

for (const [base, rel] of Object.entries(manifest).sort((a, b) => a[0].localeCompare(b[0]))) {
  const abs = path.join(ROOT, "public", rel);
  if (!fs.existsSync(abs)) continue;
  try {
    const meta = await sharp(abs).metadata();
    dims[base] = { path: rel, w: meta.width ?? null, h: meta.height ?? null };
    measured.set(base, { w: meta.width ?? null, h: meta.height ?? null, bytes: fs.statSync(abs).size });
    if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE) oversize += 1;
  } catch {
    dims[base] = { path: rel, w: null, h: null };
  }
}
fs.writeFileSync(DIMENSIONS_PATH, JSON.stringify(dims, null, 2) + "\n");
console.log(`\nlib/image-dimensions.json: ${Object.keys(dims).length} entries, ${oversize} over ${MAX_EDGE}px`);

// --- and tell the harvest report what it is now looking at -------------------
if (fs.existsSync(REPORT_PATH)) {
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  for (const row of report.files ?? []) {
    const m = measured.get(row.basename);
    if (!m) continue;
    if (row.width !== m.w || row.height !== m.h) row.resized_from = row.resized_from ?? `${row.width}x${row.height}`;
    row.bytes = m.bytes;
    row.width = m.w;
    row.height = m.h;
  }
  if (report.totals) {
    report.totals.files_over_max_edge_in_manifest = oversize;
    report.totals.bytes_total_referenced = (report.files ?? []).reduce((n, r) => n + (r.bytes ?? 0), 0);
  }
  report.optimize_pass = {
    ran: new Date().toISOString(),
    dir: DIR,
    max_edge_px: MAX_EDGE,
    quality: QUALITY,
    encoder: "mozjpeg, progressive, 4:4:4",
    jpeg_files: files.length,
    resized,
    recoded,
    skipped,
    bytes_before: before,
    bytes_after: after,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(`content/data/media-harvest-report.json: totals.files_over_max_edge_in_manifest = ${oversize}`);
}
