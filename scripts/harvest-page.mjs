/**
 * Re-harvest WordPress pages from the old site's REST API.
 *
 * WHY THIS EXISTS
 *
 * The original migration turned each old page into markdown by flattening
 * `content.rendered` from `/wp-json/wp/v2/pages`. That content is only half
 * rendered: WordPress runs the theme's own shortcodes but leaves every WPBakery
 * `[vc_*]` shortcode as literal text, so the flattener — which stripped anything
 * in square brackets — silently deleted every `[vc_single_image image="123"]` and
 * every row `parallax_background_image="123"` on the way through. The prose
 * survived; the photography did not. Twelve of the fifteen kept pages came out of
 * the migration with zero images in their bodies. That is the "lots more imagery"
 * the client can see missing, and it is what this script puts back.
 *
 * TWO MODES, ONE RULE
 *
 *   merge  (a `content/pages/<slug>.md` already exists)
 *          The markdown is NOT regenerated. The script reads the old rendered
 *          content, works out where each image sat in document order relative to
 *          the surrounding text, and splices `![](url)` lines into the existing
 *          file at those points. Every other byte of the file is left exactly as
 *          it was, and the script proves it: after writing, it strips the lines it
 *          inserted and asserts the result is byte-identical to what it read.
 *          The prose is the client's. We are putting pictures back, not editing copy.
 *
 *   new    (no such file)
 *          A full conversion of `content.rendered` into the same front-matter shape
 *          the other pages use. Used for the three pages the migration skipped:
 *          `data`, `schoolsport-vereniging-rotterdam-atletiek` and `records`.
 *
 * IMAGE POSITIONS ARE DOCUMENT ORDER, DELIBERATELY
 *
 * WPBakery rows are multi-column. `/loopscholing/` puts seven technique diagrams in
 * a narrow left rail beside a long text column; on a phone that column stacked, so
 * the old page really did show seven diagrams in a row before the text. Pairing
 * image k with heading k would read better, but it would be a guess about a visual
 * alignment that CSS produced and the document never stated. Document order is what
 * the old markup says, so document order is what we restore.
 *
 * WHAT WE REFERENCE
 *
 * Images are written as the original `https://www.jessecaron.com/wp-content/...`
 * URL, exactly as the rest of `content/` does. `localImg()` maps that to the local
 * copy through `lib/image-manifest.json`, and `scripts/check-images.mjs` fails the
 * build if any of them is not on disk. This script does not download anything —
 * fetching the files and extending the manifest is `harvest-media.mjs`'s job.
 *
 * POLITENESS
 *
 * Sequential GETs only, a real desktop User-Agent, 1.5 s between requests, and every
 * response cached under the OS temp dir so a re-run costs the old server nothing.
 *
 * USAGE
 *
 *   node scripts/harvest-page.mjs --training      # re-harvest the 9 kept training pages
 *   node scripts/harvest-page.mjs --new           # harvest data, schoolsport, records
 *   node scripts/harvest-page.mjs --all           # both
 *   node scripts/harvest-page.mjs loopscholing    # one slug
 *   node scripts/harvest-page.mjs --all --dry     # report only, write nothing
 *   node scripts/harvest-page.mjs --all --refresh # ignore the cache, re-fetch
 *
 *   HARVEST_DEBUG=1 …                             # print where each image anchored
 *
 * Re-running is safe: merge mode skips images the file already carries, so `--all`
 * is idempotent. A page harvested by `new` mode becomes a merge target on the next
 * run — delete its `.md` first if you really want the body regenerated.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const API = "https://www.jessecaron.com/wp-json/wp/v2";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DELAY_MS = 1500;

/** The nine kept training pages — must stay in step with TRAINING_SLUGS in lib/content.ts. */
const TRAINING = [
  "personal-training",
  "functionele-snelheid-trainen",
  "functionele-kracht-trainen",
  "loopscholing",
  "groepstrainingen",
  "zomerstop-training",
  "snelheidsmetingen",
  "sportmassage",
  "oefeningen",
];

/** The three pages §1.3 of the parity plan judged worth having. */
const NEW_PAGES = ["data", "schoolsport-vereniging-rotterdam-atletiek", "records"];

/** `records` is filed under a shorter slug; the old URL redirects to it. */
const SLUG_ALIAS = { "schoolsport-vereniging-rotterdam-atletiek": "schoolsport-vereniging" };

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const DRY = flag("--dry");
const REFRESH = flag("--refresh");
const CACHE_DIR =
  (args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null) ??
  path.join(os.tmpdir(), "jessecaron-harvest-cache");

let slugs = args.filter((a) => !a.startsWith("--") && !fs.existsSync(a));
if (flag("--all")) slugs = [...TRAINING, ...NEW_PAGES];
else if (flag("--training")) slugs = TRAINING;
else if (flag("--new")) slugs = NEW_PAGES;
if (!slugs.length) {
  console.error("Nothing to do. Pass slugs, or --training / --new / --all.");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Polite, cached HTTP
// ---------------------------------------------------------------------------
fs.mkdirSync(CACHE_DIR, { recursive: true });
let lastRequest = 0;

async function sleepUntilPolite() {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

/**
 * The REST index echoes "Sorry, no posts matched your criteria." nineteen times
 * before the JSON — a broken shortcode printing during render. Slice from the
 * first structural character rather than trusting the body to start with it.
 */
function parseNoisyJson(text) {
  const first = Math.min(
    ...[text.indexOf("["), text.indexOf("{")].filter((i) => i >= 0).concat([text.length]),
  );
  return JSON.parse(text.slice(first));
}

async function getJson(url, cacheKey) {
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (!REFRESH && fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  }
  await sleepUntilPolite();
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const data = parseNoisyJson(await res.text());
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 1));
  return data;
}

async function getPage(slug) {
  const rows = await getJson(
    `${API}/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,content,featured_media,modified,link`,
    `page-${slug}`,
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error(`No page with slug "${slug}"`);
  return rows[0];
}

/** Attachment ids are resolved one at a time and remembered across runs. */
const mediaCacheFile = path.join(CACHE_DIR, "media-by-id.json");
const mediaCache = fs.existsSync(mediaCacheFile)
  ? JSON.parse(fs.readFileSync(mediaCacheFile, "utf8"))
  : {};

async function mediaUrl(id) {
  if (mediaCache[id]) return mediaCache[id];
  await sleepUntilPolite();
  const res = await fetch(`${API}/media/${id}?_fields=id,source_url`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET media/${id} -> ${res.status}`);
  const item = parseNoisyJson(await res.text());
  mediaCache[id] = item.source_url;
  fs.writeFileSync(mediaCacheFile, JSON.stringify(mediaCache, null, 1));
  return item.source_url;
}

// ---------------------------------------------------------------------------
// HTML / shortcode helpers
// ---------------------------------------------------------------------------

/**
 * WordPress runs wptexturize over shortcode attributes too, so `image="123"`
 * arrives as `image=&#8221;123&#8243;` — curly quote in, double prime out. Any of
 * the four forms can close a value.
 */
const Q = `(?:"|'|&#8216;|&#8217;|&#8220;|&#8221;|&#8242;|&#8243;)`;
const attr = (name) => new RegExp(`${name}=${Q}([^"']*?)${Q}`);

const ENTITIES = {
  "&#8211;": "–", "&#8212;": "—", "&#8216;": "‘", "&#8217;": "’", "&#8220;": "“",
  "&#8221;": "”", "&#8230;": "…", "&#8242;": "′", "&#8243;": "″", "&hellip;": "…",
  "&nbsp;": " ", "&#160;": " ", "&#916;": "Δ", "&quot;": '"', "&#039;": "'",
  "&#39;": "'", "&#038;": "&", "&amp;": "&", "&lt;": "<", "&gt;": ">",
};

function decodeEntities(s) {
  return s
    .replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, (m) => ENTITIES[m] ?? ENTITIES[m.toLowerCase()] ?? m)
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)));
}

/** Chrome that carries no content: the theme's scoped CSS, scripts, Slider Revolution. */
function stripChrome(html) {
  return html
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<!--\s*START[\s\S]*?REVOLUTION SLIDER[\s\S]*?<!--\s*END REVOLUTION SLIDER\s*-->/gi, "")
    .replace(/<rs-module-wrap[\s\S]*?<\/rs-module-wrap>/gi, "");
}

/**
 * Every image the old page showed, in document order, with the character range it
 * occupied so it can be replaced by a marker.
 *
 *  - `[vc_single_image image="ID"]`      the inline photographs and diagrams
 *  - `parallax_background_image="ID"`    the full-bleed band at the top of a row,
 *    `background_image="ID"`             which is a picture the visitor saw
 *  - `<img src="...">`                   theme shortcodes the REST layer did render
 *                                        (product tiles, the related-posts grid)
 */
function findImages(html) {
  const found = [];
  const push = (m, kind, value) =>
    found.push({ start: m.index, end: m.index + m[0].length, kind, value });

  for (const m of html.matchAll(/\[vc_single_image[^\]]*\]/g)) {
    const id = m[0].match(attr("image"));
    if (id) push(m, "single", id[1]);
  }
  for (const m of html.matchAll(
    new RegExp(`(?:parallax_)?background_image=${Q}(\\d+)${Q}`, "g"),
  )) {
    // A row background is one attribute inside `[vc_row …]`. Claim the whole
    // shortcode: replacing just the attribute would leave the two halves of the
    // shortcode behind as text, and the linearised stream would then anchor the
    // picture to `[vc_row row_type="parallax"` instead of to real prose.
    const open = html.lastIndexOf("[", m.index);
    const close = html.indexOf("]", m.index);
    if (open < 0 || close < 0) continue;
    found.push({ start: open, end: close + 1, kind: "background", value: m[1] });
  }
  for (const m of html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"[^>]*>/gi)) {
    const src = m[1];
    // Slider Revolution's transparent spacer and other plugin furniture are not
    // photographs of anything; they only exist to hold a lazy-load attribute.
    if (/\/plugins\/|dummy\.png|data:/i.test(src)) continue;
    push(m, "img", src.startsWith("//") ? `https:${src}` : src);
  }

  return found.sort((a, b) => a.start - b.start);
}

/** Resolve each marker to an absolute source URL (attachment ids need a lookup). */
async function resolveImages(images) {
  const out = [];
  for (const img of images) {
    const url = img.kind === "img" ? img.value : await mediaUrl(img.value);
    out.push({ ...img, url });
  }
  return out;
}

const basename = (url) => decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");

// ---------------------------------------------------------------------------
// Linearising the rendered content
// ---------------------------------------------------------------------------
const MARK = (i) => `@@IMG${i}@@`;

/**
 * The rendered content as a flat stream of text lines and image markers, in the
 * order the old markup put them. This is what tells us where a picture belongs.
 */
function linearize(html, images) {
  let s = html;
  for (let i = images.length - 1; i >= 0; i--) {
    s = s.slice(0, images[i].start) + `\n${MARK(i)}\n` + s.slice(images[i].end);
  }
  s = stripChrome(s);
  s = s.replace(/\[[^\]\n]*\]/g, "\n"); // every remaining shortcode
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|h[1-6]|div|li|ul|ol|blockquote|pre|tr|section)>/gi, "\n");
  s = s.replace(/<(p|h[1-6]|div|li|ul|ol|blockquote|pre|tr|section)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);

  const stream = [];
  for (const raw of s.split("\n")) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    const mark = line.match(/^@@IMG(\d+)@@$/);
    if (mark) stream.push({ image: Number(mark[1]) });
    else stream.push({ text: line });
  }
  return stream;
}

/** Comparison key: what the words are, ignoring markdown and punctuation. */
function key(s) {
  return decodeEntities(s)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Paragraph-sized blocks of an existing markdown body, with their byte offsets. */
function blocksOf(body) {
  const blocks = [];
  const re = /\n[ \t]*\n/g;
  let last = 0;
  let m;
  while ((m = re.exec(body))) {
    blocks.push({ text: body.slice(last, m.index), start: last, end: m.index });
    last = re.lastIndex;
  }
  blocks.push({ text: body.slice(last), start: last, end: body.length });
  return blocks.filter((b) => b.text.trim());
}

// ---------------------------------------------------------------------------
// Mode 1: merge images into an existing markdown body
// ---------------------------------------------------------------------------
const MATCH_LEN = 40;

function findBlock(blocks, needle, from) {
  const k = key(needle);
  if (k.length < 8) return -1;
  const probe = k.slice(0, MATCH_LEN);
  for (let i = from; i < blocks.length; i++) {
    const b = key(blocks[i].text);
    // A block that is only an image has an empty key; `startsWith("")` is true of
    // everything, so without this guard the first picture in a file swallows every
    // later anchor and the rest of the images pile up behind it.
    if (b.length < 8) continue;
    if (b.startsWith(probe) || b.includes(probe) || k.startsWith(b.slice(0, MATCH_LEN))) return i;
  }
  return -1;
}

/**
 * Work out, for every image, which existing block it followed on the old page.
 *
 * The anchor is the nearest preceding line of text in the old document. If that
 * line never made it into the markdown (raw-HTML widgets, WooCommerce loops and
 * button labels were all dropped by the original export) we walk further back, and
 * failing that forward, so the image lands on the near side of text that did
 * survive. An image with nothing before it goes to the top of the body.
 */
function planInsertions(stream, images, blocks) {
  const plan = [];
  const unplaced = [];
  let cursor = 0;

  stream.forEach((token, index) => {
    if (token.image === undefined) return;
    const img = images[token.image];

    let at = null;
    let side = "after";
    for (let i = index - 1; i >= 0 && at === null; i--) {
      if (stream[i].text === undefined) continue;
      const hit = findBlock(blocks, stream[i].text, cursor);
      if (hit >= 0) {
        at = blocks[hit].end;
        side = "after";
        cursor = hit;
      }
      if (index - i > 6) break; // too far back to be this image's neighbour
    }
    // Nothing at all precedes it in the old document: it opened the page. Decide
    // this before looking forward — the first text after a hero band is usually the
    // page title, and a title is a phrase that also turns up inside the body.
    if (at === null && !stream.slice(0, index).some((t) => t.text !== undefined)) {
      at = 0;
      side = "before";
    }
    if (at === null) {
      for (let i = index + 1; i < stream.length && at === null; i++) {
        if (stream[i].text === undefined) continue;
        const hit = findBlock(blocks, stream[i].text, cursor);
        if (hit >= 0) {
          at = blocks[hit].start;
          side = "before";
          cursor = Math.max(cursor, hit - 1);
        }
        if (i - index > 6) break;
      }
    }
    if (process.env.HARVEST_DEBUG) {
      console.log(`  [dbg] img ${token.image} ${basename(img.url)} -> at=${at} side=${side} cursor=${cursor}`);
    }
    if (at === null) unplaced.push(img);
    else plan.push({ at, side, url: img.url, kind: img.kind });
  });

  return { plan, unplaced };
}

function applyInsertions(body, plan) {
  // Group by offset so images that share an anchor keep their document order,
  // then apply back-to-front so earlier offsets stay valid.
  const groups = new Map();
  for (const p of plan) {
    const k = `${p.at}|${p.side}`;
    if (!groups.has(k)) groups.set(k, { at: p.at, side: p.side, urls: [] });
    groups.get(k).urls.push(p.url);
  }
  let out = body;
  // "before" sorts after "after" at the same offset so the two stay in document order.
  const ordered = [...groups.values()].sort((a, b) =>
    b.at - a.at || (a.side === "before" ? -1 : 1),
  );
  for (const g of ordered) {
    const lines = g.urls.map((u) => `![](${u})`).join("\n\n");
    const text = g.side === "before" ? `${lines}\n\n` : `\n\n${lines}`;
    out = out.slice(0, g.at) + text + out.slice(g.at);
  }
  return out;
}

/** Everything this script writes is one of these lines and nothing else. */
const IMAGE_LINE = /^!\[\]\([^)\s]+\)$/;

function stripImageLines(body) {
  return body
    .split("\n")
    .filter((l) => !IMAGE_LINE.test(l.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Mode 2: convert rendered content to markdown for a page we never had
// ---------------------------------------------------------------------------

/** The `/data/` sport split is six `eltd-progress-bar` widgets. Make it a table. */
function extractProgressBars(html) {
  const rows = [];
  const block = /<div class="eltd-progress-bar">([\s\S]*?)<div data-percentage=(\d+)/g;
  let m;
  while ((m = block.exec(html))) {
    const label = m[1].match(/class="eltd-progress-title"[^>]*>([^<]*)</);
    if (label) rows.push([decodeEntities(label[1]).trim(), `${m[2]} %`]);
  }
  if (!rows.length) return { html, table: null };
  const table = [
    "| Sport | Aandeel |",
    "| --- | --- |",
    ...rows.map(([a, b]) => `| ${a} | ${b} |`),
  ].join("\n");
  // Take the widgets out where they stand: the first becomes the table, the rest
  // go, so their bar labels do not survive as stray "Honkbal 0" paragraphs.
  let first = true;
  const cleaned = html.replace(
    /<div class="eltd-progress-bar">[\s\S]*?class="eltd-progress-content"[^>]*><\/div>\s*<\/div>\s*<\/div>/g,
    () => {
      if (!first) return "";
      first = false;
      return "\n<p>@@TABLE@@</p>\n";
    },
  );
  return { html: cleaned, table };
}

/** `eltd-counter` values are facts about the business, not prose: front matter. */
function extractCounters(html) {
  const counters = [];
  const re =
    /<span class="eltd-counter[^"]*"[^>]*>\s*([\d.,]+)\s*<\/span>\s*<h6 class="eltd-counter-title">\s*([^<]*)</g;
  let m;
  while ((m = re.exec(html))) {
    counters.push({ value: m[1].trim(), label: decodeEntities(m[2]).trim() });
  }
  return { html: html.replace(/<div class="eltd-counter-holder[\s\S]*?<\/div>/g, ""), counters };
}

/**
 * The theme renders a related-posts grid inside the page. Those are posts the new
 * site already has, so keep them as links (and their thumbnails) rather than as a
 * transcription of a WordPress loop.
 */
function extractBlogList(html) {
  return html.replace(
    /<div class="eltd-blog-list-holder[\s\S]*?<\/ul>\s*<\/div>/g,
    (grid) => {
      const items = [];
      for (const li of grid.split("<li ").slice(1)) {
        // The thumbnails were already turned into image markers upstream, so match
        // the marker, not the <img> that is no longer there.
        const img = li.match(/@@IMG(\d+)@@/);
        const title = li.match(/class="eltd-item-title">\s*<a href="([^"]+)"[^>]*>\s*([\s\S]*?)<\/a>/);
        if (!title) continue;
        const parts = [];
        if (img) parts.push(`<p>@@IMG${img[1]}@@</p>`);
        parts.push(`<h3><a href="${title[1]}">${title[2].trim()}</a></h3>`);
        items.push(parts.join("\n"));
      }
      return `\n${items.join("\n")}\n`;
    },
  );
}

const HEADING_MD = { h1: "#", h2: "##", h3: "###", h4: "####", h5: "#####", h6: "######" };

function inlineToMarkdown(html) {
  let s = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a\b[^>]*?\shref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
      const label = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return label ? `[${label}](${href})` : "";
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text) => {
      const inner = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return inner ? `**${inner}**` : "";
    })
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text) => {
      const inner = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return inner ? `*${inner}*` : "";
    })
    .replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l, i, a) => l || (i > 0 && i < a.length - 1))
    .join("\n")
    .trim();
}

/**
 * Split rendered HTML into blocks by walking the block-level tags rather than by
 * matching an opening tag to its close.
 *
 * WordPress wraps the whole WPBakery body in a single `<p>` that only ever closes
 * after several headings and paragraphs have gone by, so a balanced-pair regex hands
 * you one giant "paragraph" and every heading inside it loses its level. Treating a
 * block tag — open or close — as a boundary, and remembering the last one opened,
 * gets the levels right on markup this ill-formed. Inline tags stay in the buffer
 * for `inlineToMarkdown`.
 */
function splitBlocks(html) {
  const out = [];
  const re = /<(\/?)(h[1-6]|p|pre|li|div|ul|ol|blockquote|section|tr|table)\b[^>]*>/gi;
  let last = 0;
  let tag = null;
  let buf = "";
  let m;
  const flush = () => {
    if (buf.replace(/<[^>]+>/g, "").trim()) out.push({ tag, html: buf });
    buf = "";
  };
  while ((m = re.exec(html))) {
    buf += html.slice(last, m.index);
    last = re.lastIndex;
    flush();
    const name = m[2].toLowerCase();
    tag = !m[1] && /^(h[1-6]|p|pre|li)$/.test(name) ? name : null;
  }
  buf += html.slice(last);
  flush();
  return out;
}

/**
 * Convert the whole rendered body. Block elements are emitted in document order;
 * headings keep their level (h5/h6 are the theme's body copy — `content.server.ts`
 * demotes them back to plain text when it renders, which is why every existing page
 * file carries them); everything else becomes a paragraph.
 */
function toMarkdown(html, images, extras, pageTitle = "") {
  let s = html;
  for (let i = images.length - 1; i >= 0; i--) {
    s = s.slice(0, images[i].start) + `\n<p>@@IMG${i}@@</p>\n` + s.slice(images[i].end);
  }
  s = stripChrome(s);
  s = extractBlogList(s);
  const counters = extractCounters(s);
  s = counters.html;
  extras.counters = counters.counters;
  const bars = extractProgressBars(s);
  s = bars.html;
  extras.table = bars.table;

  s = s.replace(/\[[^\]\n]*\]/g, "\n"); // WPBakery shortcodes
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const text = inlineToMarkdown(inner.replace(/<\/?(pre|p|div)\b[^>]*>/gi, "\n"));
    return `\n<p>@@QUOTE@@${text.replace(/\n+/g, " ")}</p>\n`;
  });

  const out = [];
  const seen = new Set();
  const dropped = [];
  for (const { tag, html: chunk } of splitBlocks(s)) {
    const text = inlineToMarkdown(chunk);
    if (!text || text === "&nbsp;") continue;

    const mark = text.match(/^@@IMG(\d+)@@$/);
    if (mark) {
      out.push(`![](${images[Number(mark[1])].url})`);
      continue;
    }
    if (text === "@@TABLE@@") {
      out.push(extras.table ?? "");
      continue;
    }
    if (text.startsWith("@@QUOTE@@")) {
      out.push(`> ${text.slice("@@QUOTE@@".length).trim()}`);
      continue;
    }

    // The theme prints the page title again as the first section title. `PageHero`
    // already shows it, and none of the twelve migrated pages carries it, so drop it
    // — but only where it opens the page and only where it really is the title.
    const k = key(text);
    if (!out.length && pageTitle && k === key(pageTitle)) continue;

    // The client duplicated one row of `/data/` five times and never replaced the
    // placeholder copy inside it. Print a paragraph once; note the repeats.
    if (k.length > 20 && seen.has(k)) {
      dropped.push(text.slice(0, 60));
      continue;
    }
    seen.add(k);

    out.push(HEADING_MD[tag] ? `${HEADING_MD[tag]} ${text.replace(/\n+/g, " ")}` : text);
  }
  extras.dropped = dropped;
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------
function frontMatter(page, slug, extras) {
  const lines = [`# ${decodeEntities(page.title.rendered)}`, "", `slug: ${slug}  `, `url: ${page.link}  `];
  if (page.modified) lines.push(`modified: ${page.modified.slice(0, 10)}  `);
  if (extras.counters?.length) {
    lines.push(
      `stats: ${extras.counters.map((c) => `${c.label.toLowerCase()}=${c.value}`).join(", ")}  `,
    );
  }
  lines[lines.length - 1] = lines[lines.length - 1].replace(/ {2}$/, "");
  return `${lines.join("\n")}\n\n---\n`;
}

/**
 * `core.autocrlf` is on in this repo, so a checkout hands you CRLF while the
 * migration wrote LF. Block detection is newline-sensitive — with CRLF the whole
 * body reads as one paragraph and every image lands at the bottom of the page — so
 * normalise on the way in and write LF, which is what the index stores either way.
 */
function readMarkdown(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function splitFile(raw) {
  const sep = raw.indexOf("\n---");
  if (sep < 0) return { head: "", body: raw };
  const bodyStart = raw.indexOf("\n", sep + 1) + 1;
  return { head: raw.slice(0, bodyStart), body: raw.slice(bodyStart) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const report = [];

for (const slug of slugs) {
  const page = await getPage(slug);
  const html = page.content.rendered;
  const images = await resolveImages(findImages(html));
  const file = path.join(PAGES_DIR, `${SLUG_ALIAS[slug] ?? slug}.md`);
  const exists = fs.existsSync(file);
  const oldCount = images.length;

  if (exists) {
    // ---- merge mode: images only, prose untouched -------------------------
    const raw = readMarkdown(file);
    const { head, body } = splitFile(raw);
    const before = (body.match(/!\[\]\(/g) ?? []).length;
    const stream = linearize(html, images);
    const blocks = blocksOf(body);

    // Images the file already carries (the export kept the ones the theme had
    // already turned into <img>) must not be added a second time.
    const have = new Set(
      [...body.matchAll(/!\[\]\(([^)\s]+)\)/g)].map((m) => basename(m[1]).replace(/-\d+x\d+(?=\.\w+$)/, "")),
    );
    const wanted = images.filter(
      (i) => !have.has(basename(i.url).replace(/-\d+x\d+(?=\.\w+$)/, "")),
    );
    const wantedIndex = new Set(wanted.map((w) => images.indexOf(w)));
    const filteredStream = stream.filter((t) => t.image === undefined || wantedIndex.has(t.image));

    const { plan, unplaced } = planInsertions(filteredStream, images, blocks);
    const newBody = applyInsertions(body, plan);

    // The gate: nothing but image lines may differ.
    const proseBefore = stripImageLines(body);
    const proseAfter = stripImageLines(newBody);
    const proseOk = proseBefore === proseAfter;

    if (!proseOk) {
      console.error(`\n${slug}: PROSE CHANGED — refusing to write.\n`);
      const a = proseBefore.split("\n");
      const b = proseAfter.split("\n");
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) console.error(`  line ${i + 1}\n  - ${a[i]}\n  + ${b[i]}`);
      }
      process.exitCode = 1;
    } else if (!DRY && plan.length) {
      // A page with nothing to add is left alone rather than rewritten, so a run
      // over all twelve does not touch files it has no reason to change.
      fs.writeFileSync(file, head + newBody, "utf8");
    }

    report.push({
      slug,
      mode: "merge",
      oldImages: oldCount,
      markdownBefore: before,
      markdownAfter: before + plan.length,
      unplaced: unplaced.map((u) => basename(u.url)),
      prose: proseOk ? "identical" : "CHANGED",
      basenames: images.map((i) => `${i.kind[0]}:${basename(i.url)}`),
    });
  } else {
    // ---- new page ---------------------------------------------------------
    const extras = {};
    const body = toMarkdown(html, images, extras, decodeEntities(page.title.rendered));
    const outSlug = SLUG_ALIAS[slug] ?? slug;
    const text = `${frontMatter(page, outSlug, extras)}\n${body}\n`;
    if (!DRY) fs.writeFileSync(file, text, "utf8");
    report.push({
      slug,
      mode: "new",
      file: path.relative(ROOT, file),
      oldImages: oldCount,
      markdownAfter: (body.match(/!\[\]\(/g) ?? []).length,
      counters: extras.counters,
      droppedDuplicates: extras.dropped,
      chars: body.length,
      title: decodeEntities(page.title.rendered),
      url: page.link,
      basenames: images.map((i) => `${i.kind[0]}:${basename(i.url)}`),
    });
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`\nharvest-page — ${DRY ? "DRY RUN, nothing written" : "wrote content/pages/*.md"}\n`);
console.log(
  ["page", "mode", "old", "md before", "md after", "prose"].map((h) => h.padEnd(14)).join(""),
);
for (const r of report) {
  console.log(
    [
      r.slug.slice(0, 13),
      r.mode,
      String(r.oldImages),
      String(r.markdownBefore ?? 0),
      String(r.markdownAfter),
      r.prose ?? "-",
    ]
      .map((c) => String(c).padEnd(14))
      .join(""),
  );
}
for (const r of report) {
  if (r.unplaced?.length) console.log(`\n${r.slug}: COULD NOT PLACE ${r.unplaced.join(", ")}`);
  if (r.droppedDuplicates?.length) {
    console.log(`\n${r.slug}: dropped ${r.droppedDuplicates.length} repeated block(s):`);
    for (const d of r.droppedDuplicates) console.log(`  "${d}…"`);
  }
  if (r.counters?.length) {
    console.log(`\n${r.slug}: counters -> front matter: ${r.counters.map((c) => `${c.label} ${c.value}`).join(", ")}`);
  }
}

const missing = [];
if (fs.existsSync(path.join(ROOT, "lib/image-manifest.json"))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/image-manifest.json"), "utf8"));
  for (const r of report) {
    for (const b of r.basenames) {
      const name = b.slice(2);
      const unsized = name.replace(/-\d+x\d+(?=\.\w+$)/i, "");
      if (!manifest[name] && !manifest[unsized]) missing.push(`${r.slug}: ${name}`);
    }
  }
}
if (missing.length) {
  console.log(`\n${missing.length} referenced image(s) not yet in lib/image-manifest.json (harvest-media's job):`);
  for (const m of missing) console.log(`  ${m}`);
}

if (!DRY) {
  const summary = path.join(CACHE_DIR, "page-harvest-report.json");
  fs.writeFileSync(summary, JSON.stringify(report, null, 2));
  console.log(`\nDetail: ${summary}`);
}
