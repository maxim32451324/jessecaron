/**
 * The one map from old WordPress paths to routes on this site.
 *
 * WHY THIS FILE EXISTS (and is .mjs rather than .ts)
 *
 * Two very different consumers need exactly the same answer to "where did
 * `/schoolsport-vereniging-rotterdam-atletiek/` go?":
 *
 *   1. `lib/content.server.ts`, which rewrites absolute www.jessecaron.com links
 *      inside harvested markdown so a body link lands on this site instead of the
 *      old one;
 *   2. `scripts/build-redirects.mjs`, which emits the HTTP 301 map that
 *      `next.config.ts` serves, so an inbound link or a search result lands on the
 *      same place.
 *
 * When those two disagree the site is quietly broken in a way nobody notices: the
 * body link goes one way, Google goes another, and one of them is a 404. They were
 * two maps until this phase. Now there is one, and it lives here — plain ESM so a
 * `node scripts/*.mjs` run can import it without a TypeScript step, and `allowJs`
 * lets the app import it back.
 *
 * Extend THIS file, never a copy of it.
 */

/** Real routes in the app router that a scraped link may point at directly. */
export const STATIC_ROUTES = new Set([
  "",
  "/training",
  "/videos",
  "/blog",
  "/shop",
  "/academy",
  "/contact",
  "/aanmelden",
  "/prijzen",
  "/voorwaarden",
]);

/**
 * Pages that live at their own route rather than under `/training/[slug]`.
 * @type {Record<string, string>}
 */
export const PAGE_ROUTES = {
  contact: "/contact",
  prijzen: "/prijzen",
  voorwaarden: "/voorwaarden",
};

/**
 * Page slugs that exist in `content.json.pages` but have no route of their own.
 *
 * `records` is the only one: `content/pages/records.md` was harvested deliberately
 * unrouted — its U12/U14 sprint table renders as a block inside
 * `/training/snelheidsmetingen` (PARITY-PLAN §1.3, §11 Q6). Without this set the
 * slug lookup below would happily produce `/training/records`, which
 * `dynamicParams = false` answers with a 404. That was a live bug: every old
 * `/records/` link resolved to a dead route.
 */
export const UNROUTED_PAGES = new Set(["records"]);

/**
 * Old WordPress paths with no 1:1 slug on the new site.
 *
 * Single-segment keys are matched against the whole path; they are also the
 * complete list of "this page moved and changed its name" rows the redirect map
 * needs, which is why the harvested and folded pages are here rather than in the
 * redirect script.
 *
 * @type {Record<string, string>}
 */
export const ALIASES = {
  "/functionele-snelheid": "/training/functionele-snelheid-trainen",
  "/functionele-kracht": "/training/functionele-kracht-trainen",
  "/products": "/shop",
  "/product-categorie": "/shop",
  "/productcategorie": "/shop",
  "/webshop": "/shop",
  // The old portfolio (one page per video) is `/videos` here. Without this, the
  // "Video" link on `/training/schoolsport-vereniging` still pointed at
  // www.jessecaron.com — at a portfolio item that is not even among the 21 the
  // harvest found, so it was a link off our own site to a page that will not exist.
  // `portfolio_item` (underscore) is the older permalink; `content/pages/records.md`
  // uses it.
  "/portfolio-item": "/videos",
  "/portfolio_item": "/videos",

  // ---- Pages that were harvested under a new name (PARITY-PLAN §1.3) ----------
  // The old slug was 42 characters of SEO keyword stuffing; the page is the same page.
  "/schoolsport-vereniging-rotterdam-atletiek": "/training/schoolsport-vereniging",
  // Not a page here: the sprint records render inside `/training/snelheidsmetingen`.
  "/records": "/training/snelheidsmetingen",

  // ---- Pages that were folded into an existing one (PARITY-PLAN §1.3) --------
  // `/stretching/` and the `rekken` post are the same article; the page duplicated
  // the post's first 800 characters verbatim.
  "/stretching": "/blog/rekken",
  // Core-stability preamble, plus its two empty stubs. `/functionele-kracht-trainen/`
  // covers the same ground at four times the length.
  "/strenght-stability": "/training/functionele-kracht-trainen",
  "/strenght-stability-exercises": "/training/functionele-kracht-trainen",
  "/self-myofascial-release": "/training/functionele-kracht-trainen",
  // A 2017 draft of the page that shipped.
  "/prijzen-concept": "/prijzen",
  // "Fout: Contact formulier niet gevonden" — the massage stub. The real page.
  "/massage": "/training/sportmassage",

  // ---- Links inside post bodies that were already broken on the old site -----
  // Both of these return 404 on www.jessecaron.com today, and both are inside articles
  // that still get read. `strength-stability` is the correctly-spelled version of a page
  // whose real slug carries a typo (`strenght-stability`); `/clinics/` never existed at
  // all. Left alone they would simply become this site's 404s after the domain move, so
  // they are pointed at the pages the sentences around them are talking about.
  //   bosu-trainingsmateriaal:               "Meer informatie bij 'Strength & Stability'"
  //   looptraining-hockey-craeyenhout-…:     "een clinic op jouw hockeyvereniging"
  "/training/strength-stability": "/training/functionele-kracht-trainen",
  "/clinics": "/training/groepstrainingen",

  // ---- Pages dropped in Phase 0 -----------------------------------------------
  // `shirts` and `teamkleding` were product listings scraped as prose; the shop grid
  // does the job properly. They left `content.json.pages`, which means the slug lookup
  // no longer answers for them — and `/training/oefeningen` links `/shirts/` in its body.
  "/shirts": "/shop",
  "/teamkleding": "/shop",
};

/**
 * Products the shop renamed when it moved.
 * @type {Record<string, string>}
 */
export const RENAMED_SLUGS = {
  "stroboscoop-knipper-bril": "stroboscoop-glasses",
};

/**
 * Uploads that are not images and therefore invisible to `scripts/check-images.mjs`
 * until this phase extended it.
 *
 * `/training/schoolsport-vereniging` and the `kleurplaat` post both link the 2017
 * colouring-page PDF on the old host. Nothing in the build was watching it, and it
 * dies the day WordPress is switched off — so the file now lives in
 * `public/downloads/` and both the body links and the HTTP redirect map point there.
 * Keyed on the old path, without the host.
 *
 * @type {Record<string, string>}
 */
export const ASSET_ALIASES = {
  "/wp-content/uploads/2017/01/Rotterdam-Atletiek-Schoolsport-Vereniging-Jesse-Caron-Kleurplaat.pdf":
    "/downloads/Rotterdam-Atletiek-Schoolsport-Vereniging-Jesse-Caron-Kleurplaat.pdf",
};

/**
 * Maps an old jessecaron.com path onto the new site, or returns null when there is
 * no answer here (the caller then leaves the link alone, or falls through to the
 * pattern table in `scripts/build-redirects.mjs`).
 *
 * @param {string} rawPath  path only, e.g. `/product/bidon/` or `/data/#stats`
 * @param {Map<string, string>} slugRoutes  slug -> route, built from the content indexes
 * @returns {string | null}
 */
export function resolveInternal(rawPath, slugRoutes) {
  const [withoutHash, hash = ""] = rawPath.split("#");
  const clean = withoutHash.split("?")[0].replace(/\/+$/, "").toLowerCase();
  const suffix = hash ? `#${hash}` : "";
  const hit = (route) => `${route}${suffix}`;

  if (ASSET_ALIASES[withoutHash.split("?")[0]]) {
    return hit(ASSET_ALIASES[withoutHash.split("?")[0]]);
  }
  if (STATIC_ROUTES.has(clean)) return hit(clean === "" ? "/" : clean);

  // A whole-path alias wins over the per-prefix rules below. This is what lets a
  // multi-segment old path be named exactly — two post bodies link
  // `/training/strength-stability/` and `/clinics/`, both of which have been 404s on
  // the old site for years and would have become 404s on this one.
  if (ALIASES[clean]) return hit(ALIASES[clean]);

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return hit("/");

  // /product/<slug>/ and /product-categorie/<anything>/
  if (segments.length >= 2) {
    const prefix = `/${segments[0]}`;
    if (prefix === "/product") {
      const slug = RENAMED_SLUGS[segments[1]] ?? segments[1];
      const route = slugRoutes.get(slug);
      return route ? hit(route) : null;
    }
    if (ALIASES[prefix]) return hit(ALIASES[prefix]);
    return null;
  }

  if (ALIASES[clean]) return hit(ALIASES[clean]);
  const route = slugRoutes.get(RENAMED_SLUGS[segments[0]] ?? segments[0]);
  return route ? hit(route) : null;
}

/**
 * slug -> route for every routable piece of content. Both callers build the map
 * from their own content index (the app from `lib/content.ts`, the script from the
 * raw JSON) but they build it the same way, here.
 *
 * @param {{ products: {slug: string}[], posts: {slug: string}[], pages: {slug: string}[] }} content
 * @returns {Map<string, string>}
 */
export function buildSlugRoutes(content) {
  /** @type {Map<string, string>} */
  const m = new Map();
  for (const p of content.products) m.set(p.slug, `/shop/${p.slug}`);
  for (const p of content.posts) m.set(p.slug, `/blog/${p.slug}`);
  for (const p of content.pages) {
    if (UNROUTED_PAGES.has(p.slug)) continue;
    m.set(p.slug, PAGE_ROUTES[p.slug] ?? `/training/${p.slug}`);
  }
  return m;
}
