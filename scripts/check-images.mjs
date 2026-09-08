/**
 * Fails the build if any image referenced by content does not resolve to a file on disk.
 *
 * WHY THIS EXISTS
 *
 * `localImg()` maps a remote WordPress URL to our local copy through
 * `lib/image-manifest.json`, and when it finds no entry it returns the remote URL
 * unchanged. That fallback is deliberate — it kept the site rendering during the
 * migration — but it is silent, and silence is the problem: a page that hotlinks
 * www.jessecaron.com looks perfect today and loses its pictures the moment the old
 * WordPress is switched off. That has already happened once here: six images sat on
 * disk the whole time while the pages pointed at the old host, because the export
 * kept WordPress's `-1024x683` resized filenames and the manifest is keyed on the
 * original basename.
 *
 * So: every image in content must resolve locally, and the build says so out loud.
 *
 * Run by `prebuild`, so `npm run build` cannot pass with an off-site image.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/image-manifest.json"), "utf8"));

/** Same resolution `localImg()` performs, including the WordPress size-suffix retry. */
function resolve(url) {
  const base = decodeURIComponent(url.split("?")[0].split("#")[0].split("/").pop() ?? "");
  if (manifest[base]) return manifest[base];
  const unsized = base.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
  if (unsized !== base && manifest[unsized]) return manifest[unsized];
  return null;
}

const IMG_URL = /https?:\/\/[^\s")']+\.(?:jpe?g|png|gif|webp|avif)/gi;

/**
 * Only the old WordPress host is a risk. YouTube thumbnails (img.youtube.com) are
 * remote by design and stay up whatever happens to jessecaron.com, so flagging them
 * would train everyone to ignore this check — which is how a guard stops working.
 */
const AT_RISK = /(^|\/\/)(www\.)?jessecaron\.com\//i;
const failures = [];
let checked = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(md|json)$/i.test(entry.name)) scan(p);
  }
}

function scan(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.match(IMG_URL) ?? []) {
    if (!AT_RISK.test(match)) continue;
    checked++;
    const local = resolve(match);
    if (!local) {
      failures.push({ file: path.relative(ROOT, file), url: match, why: "no manifest entry" });
      continue;
    }
    if (!fs.existsSync(path.join(ROOT, "public", local))) {
      failures.push({ file: path.relative(ROOT, file), url: match, why: `manifest points at ${local}, which is not on disk` });
    }
  }
}

walk(path.join(ROOT, "content"));

if (failures.length) {
  console.error(`\ncheck-images: ${failures.length} of ${checked} content image(s) do not resolve locally.\n`);
  for (const f of failures.slice(0, 30)) {
    console.error(`  ${f.file}\n    ${f.url}\n    ${f.why}\n`);
  }
  if (failures.length > 30) console.error(`  …and ${failures.length - 30} more.\n`);
  console.error("Harvest the file into public/brand/photos and add it to lib/image-manifest.json.");
  console.error("Leaving it remote means the picture disappears when the old WordPress goes off.\n");
  process.exit(1);
}

console.log(`check-images: ${checked} content image reference(s), all resolve to files on disk.`);
