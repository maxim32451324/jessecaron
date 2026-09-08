import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getPages, getPosts, getProducts, localImg } from "@/lib/content";
import { ASSET_ALIASES, buildSlugRoutes, resolveInternal } from "@/lib/legacy-routes.mjs";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * slug -> new route, built once from the content indexes rather than a
 * hand-maintained list (the old map missed ~100 links, /aanmelden included).
 *
 * The rules themselves — ALIASES, RENAMED_SLUGS, the unrouted `records` page —
 * live in `lib/legacy-routes.mjs`, because `scripts/build-redirects.mjs` has to
 * answer the same question for the HTTP 301 map, and the two must not drift apart:
 * a link in a body and a link from Google have to land on the same page.
 * See the header of that file.
 */
let SLUG_ROUTES: Map<string, string> | null = null;
function slugRoutes(): Map<string, string> {
  if (SLUG_ROUTES) return SLUG_ROUTES;
  SLUG_ROUTES = buildSlugRoutes({ products: getProducts(), posts: getPosts(), pages: getPages() });
  return SLUG_ROUTES;
}

function rewriteMarkdown(md: string): string {
  let out = md;

  // The scrape emitted body prose as h5/h6 (and inside list items), which the
  // prose styles render as bold mini-headings. Demote those to plain text.
  out = out.replace(/^([ \t]*(?:[*+-]|\d+[.)])[ \t]+)?#{5,6}(?:[ \t]+|[ \t]*$)/gm, (_m, lead = "") => lead ?? "");

  // Leftover empty-bold separators / icon placeholders from the page builder.
  out = out.replace(/^[ \t]*__[ \t]*$/gm, "");
  out = out.replace(/\[[ \t]*__[ \t]*\]\(([^)\s]+)\)/g, "[$1]($1)");
  out = out.replace(/^[ \t]*Δ[ \t]*$/gm, "");

  // jessecaron.com -> local asset or new route. The optional trailing group is
  // a markdown link title — `[x](url "Title")` — which the old map never matched.
  out = out.replace(
    /\((https?:\/\/(?:www\.)?jessecaron\.com[^)\s]*)((?:\s+"[^"]*")?)\)/g,
    (_m, url: string, title: string) => {
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return `(${localImg(url)}${title})`;
      const pathPart = url.replace(/^https?:\/\/(?:www\.)?jessecaron\.com/, "");
      // Non-image uploads — today exactly one, the 2017 Kleurplaat PDF, linked from
      // `/training/schoolsport-vereniging` and the `kleurplaat` post. `localImg()`
      // only knows about pictures, so before this the two links pointed at the old
      // host and would have died with it, silently, on a page nobody re-reads.
      const asset = ASSET_ALIASES[pathPart.split("?")[0]];
      if (asset) return `(${asset}${title})`;
      const internal = resolveInternal(pathPart, slugRoutes());
      return `(${internal ?? url}${title})`;
    },
  );

  return out.replace(/\n{3,}/g, "\n\n");
}

function readBody(kind: "pages" | "posts" | "products", slug: string): string {
  const file = path.join(CONTENT_DIR, kind, `${slug}.md`);
  if (!fs.existsSync(file)) return "";
  const raw = fs.readFileSync(file, "utf8");
  const sep = raw.indexOf("\n---");
  const body = sep >= 0 ? raw.slice(raw.indexOf("\n", sep + 1) + 1) : raw;
  return rewriteMarkdown(body.trim());
}

export function getPageBody(slug: string): string {
  return readBody("pages", slug);
}
export function getPostBody(slug: string): string {
  return readBody("posts", slug);
}
export function getProductBody(slug: string): string {
  return readBody("products", slug);
}

/**
 * The lines above the `---` in a harvested page: `slug`, `url`, `modified`, and on
 * `/data/` a `stats:` line. They are not prose, so `readBody` throws them away —
 * but they carry facts the layout needs, and the only honest place to keep those
 * facts is next to the page they came from.
 */
function frontMatter(slug: string): Record<string, string> {
  const file = path.join(CONTENT_DIR, "pages", `${slug}.md`);
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8");
  const sep = raw.indexOf("\n---");
  const head = sep >= 0 ? raw.slice(0, sep) : "";
  const out: Record<string, string> = {};
  for (const line of head.split(/\r?\n/)) {
    const m = /^([a-z_][a-z0-9_-]*):\s*(.*?)\s*$/i.exec(line.trim());
    if (m) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

export function getPageFrontMatter(slug: string): Record<string, string> {
  return frontMatter(slug);
}

/**
 * `/data/`'s three `eltd-counter` values, which the old page showed as a blue
 * three-up band (TRAININGSJAREN / TRAININGEN / ATLETEN) and the Phase 1 harvest
 * resolved into the page's front matter rather than into its prose:
 *
 *   stats: trainingsjaren=19, trainingen=15493, atleten=1256
 *
 * The home stats band reads them from here so the numbers have exactly one source.
 * Edit `content/pages/data.md` and the home page follows; there is no second copy
 * to forget. Returns {} for a page without a `stats:` line.
 */
export function getPageStats(slug: string): Record<string, number> {
  const line = frontMatter(slug).stats;
  if (!line) return {};
  const out: Record<string, number> = {};
  for (const pair of line.split(",")) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    const n = Number(value);
    if (key && Number.isFinite(n)) out[key] = n;
  }
  return out;
}

/**
 * WooCommerce's short description and the first paragraph of the long description
 * are the same sentence on 16 of the 25 products that have both. The product page
 * shows the short description as a lead next to the price, so printing it again as
 * the opening line of the body reads like a stutter. Drop the body's first
 * paragraph only when it demonstrably restates the lead; where the two genuinely
 * differ (nine products) both are kept, because neither is ours to rewrite.
 */
function normaliseLead(s: string): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * The identical "Shipment" and "Payment" blocks WooCommerce appended to 29 of the 38
 * product bodies — carrier, delivery window, the Netherlands-only rule, the accepted
 * cards, and the two logo images.
 *
 * The product page now states all of that once, as structured content in the checkout
 * block beside the buy button, where somebody deciding to buy will actually look. Left
 * in the body as well it appears twice on the same page, the second time as a wall of
 * scraped prose ending in two logos. So it is removed from the body — the facts are not
 * lost, they moved up the page.
 *
 * Anchored on the headings the export produced. If a body ever stops matching, the
 * fallback is simply that the old block stays visible: nothing breaks, it just reads
 * the way it did before.
 */
function stripShippingBlocks(body: string): string {
  const cut = body.search(/^\s*(?:\*\*)?(?:Shipment|Verzending|Payment|Betaling)(?:\*\*)?\s*$/im);
  return cut === -1 ? body : body.slice(0, cut).trimEnd();
}

export function getProductBodyAfterLead(slug: string, lead?: string): string {
  const body = stripShippingBlocks(getProductBody(slug));
  if (!lead || !body) return body;
  const paragraphs = body.split(/\n{2,}/);
  const head = normaliseLead(paragraphs[0] ?? "");
  const tail = normaliseLead(lead);
  if (head.slice(0, 60) === tail.slice(0, 60)) return paragraphs.slice(1).join("\n\n").trim();
  return body;
}
