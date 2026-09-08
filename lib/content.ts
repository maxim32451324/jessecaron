// CLIENT-SAFE content module — no node:fs. Reads bundled JSON only.
// Filesystem-backed markdown bodies live in `lib/content.server.ts`.
import contentJson from "@/content/data/content.json";
import taxonomyJson from "@/content/data/taxonomy.json";
import imageManifest from "@/lib/image-manifest.json";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
export type Brand = {
  name: string;
  tagline: string;
  description: string;
  location: string;
  phone: string;
  timezone: string;
  trademark: string;
  language: string;
  socials: { instagram: string; facebook: string; linkedin: string };
  taglines: string[];
  palette: Record<string, string>;
  logo: { white: string; black: string };
};

export type LexiconEntry = { word: string; phonetic: string; meaning: string };

export type PageMeta = {
  title: string;
  slug: string;
  url: string;
  featured_image: string;
  chars: number;
};

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  url: string;
  featured_image: string;
  /** Display names, as WordPress printed them under the article. Never linked. */
  tags: string[];
  excerpt: string;
  /** Category slugs, every one of them — including terms that get no page. */
  categories: string[];
  /** Tag slugs. Carried for completeness; no `/tag/` route is built (PARITY-PLAN §2). */
  tag_slugs: string[];
};

/**
 * A WordPress category. `page` marks the 18 terms with >= 5 posts that get an
 * archive route; `count` is the harvested post count and is 0 for the three dead
 * terms (`interview`, merged into `interviews`, plus `samet-dag` and `shirtsponsor`).
 *
 * `description` is the hole the client's archive copy drops into. All 70 are empty
 * on the old site, so no archive currently prints an intro paragraph — and none
 * should until the client writes one. See `app/(site)/blog/categorie/[slug]/page.tsx`.
 */
export type Category = {
  id: number;
  slug: string;
  name: string;
  count: number;
  description: string;
  page: boolean;
  /** Set on `interview`, whose single post was folded into `interviews`. */
  merged_into?: string;
};

export type Tag = { id: number; slug: string; name: string; count: number };

/** Per-variation availability as scraped from the WooCommerce variations form. */
export type VariantStock = { in_stock: boolean; text: string };

export type Product = {
  name: string;
  price_eur: string;
  category: "merch" | "ebook" | "event";
  slug: string;
  url: string;
  image: string;
  /** Struck-through original price — only present on the two sale items. */
  regular_price_eur?: string;
  /** Local image paths, main first. 33 of the 38 products carry more than one. */
  gallery?: string[];
  /** Size run (S/M/L, kids 140/152/164, or the gloves' S/M–L/XL). Empty for 21 products. */
  sizes?: string[];
  /** Non-size variation axes. Only `padeltoernooi`, whose axis is a skill level. */
  variants?: Record<string, string[]>;
  /** WooCommerce attribute table — Dutch labels kept verbatim (Gewicht, Afmetingen). */
  attributes?: Record<string, string>;
  stock_status?: string;
  stock_text?: string;
  /** Keyed by size (or, for `padeltoernooi`, by niveau). */
  variant_stock?: Record<string, VariantStock>;
  short_description?: string;
};

export type Video = {
  title: string;
  youtube_id: string;
  slug: string;
  url: string;
  thumbnail: string;
};

type ContentShape = {
  brand: Brand;
  lexicon: LexiconEntry[];
  stats: Record<string, number>;
  pages: PageMeta[];
  posts: PostMeta[];
  products: Product[];
  videos: Video[];
};

type TaxonomyShape = { categories: Category[]; tags: Tag[] };

const data = contentJson as unknown as ContentShape;
const taxonomy = taxonomyJson as unknown as TaxonomyShape;
const manifest = imageManifest as Record<string, string>;

// ----------------------------------------------------------------------------
// Image mapping: remote URL -> local copy (fallback to remote, which is live)
// ----------------------------------------------------------------------------
export function localImg(url: string | undefined | null): string {
  if (!url) return "";
  const base = decodeURIComponent(url.split("?")[0].split("#")[0].split("/").pop() ?? "");
  if (manifest[base]) return manifest[base];

  // WordPress serves resized copies as `Name-1024x683.jpg`, and the content export kept
  // those URLs while we downloaded only the originals. Keying the manifest on the exact
  // basename therefore missed them and `localImg` fell through to `?? url`, quietly
  // hotlinking the old site for pictures we already have on disk. That fallback is the
  // dangerous part: nothing looks broken until the old WordPress is switched off, and
  // then those images vanish. Strip the size suffix and try the original.
  const unsized = base.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
  if (unsized !== base && manifest[unsized]) return manifest[unsized];

  return url;
}

// ----------------------------------------------------------------------------
// Top-level accessors (data-only — safe on client & server)
// ----------------------------------------------------------------------------
export const brand = data.brand;
export const lexicon = data.lexicon;
export const stats = data.stats;

export function getVideos(): Video[] {
  return data.videos.filter((v) => v.youtube_id);
}

export function getProducts(category?: Product["category"]): Product[] {
  return category ? data.products.filter((p) => p.category === category) : data.products;
}

export function getProduct(slug: string): Product | undefined {
  return data.products.find((p) => p.slug === slug);
}

// ----- Pages --------------------------------------------------------------
export function getPages(): PageMeta[] {
  return data.pages;
}

export function getPage(slug: string): PageMeta | undefined {
  return data.pages.find((p) => p.slug === slug);
}

export const TRAINING_SLUGS = [
  "personal-training",
  "functionele-snelheid-trainen",
  "functionele-kracht-trainen",
  "loopscholing",
  "groepstrainingen",
  "zomerstop-training",
  "snelheidsmetingen",
  "sportmassage",
  "oefeningen",
  // Harvested in Phase 1 from the old `/data/` and
  // `/schoolsport-vereniging-rotterdam-atletiek/`. They come last because they are
  // background rather than an offer: the numbers behind the method, and the school
  // project. `records` is deliberately NOT here — it names minors, and its figures
  // are folded into `snelheidsmetingen` instead (PARITY-PLAN §1.3, §11 Q6).
  "data",
  "schoolsport-vereniging",
] as const;

export function getTrainingPages(): PageMeta[] {
  return TRAINING_SLUGS.map((s) => data.pages.find((p) => p.slug === s)).filter(
    (p): p is PageMeta => Boolean(p),
  );
}

// ----- Posts --------------------------------------------------------------
const ATHLETE_SLUGS = new Set([
  "stephany-suykerbuyk",
  "damian-muller-0-to-100-real-quick",
  "djevan-en-djediel-jansen",
  "esajas-statia-tahiri-winnen-bronzen-medaille-op-nk-atletiek",
  "esmee-de-willigen",
  "hamza-el-dahri",
  "isa-van-schaik",
  "team-caron",
  "rotterdam-krijgt-talent-team-boksen",
  "sport-performance-centre-spc-rijnmond-errol-esajas",
  "looptrainer-looptraining-feyenoord",
  "samenwerkingsverband-looptraining-sc-feyenoord-verlengd",
  "looptraining-hockey-craeyenhout-meisjes-c2",
  "flickmyhouse-sponsort-jubileum-activiteiten-jesse-caron",
  "schoolsport-vereniging-rotterdam-atletiek-mannequin-shirt-challenge",
]);

/**
 * Newest first, ties broken on slug.
 *
 * The tie-break is not cosmetic. `kleurplaat` and
 * `flickmyhouse-sponsort-jubileum-activiteiten-jesse-caron` share 2016-11-30 and share
 * three of the eighteen archives, and the old comparator (`a.date < b.date ? 1 : -1`)
 * answered -1 for BOTH (a,b) and (b,a) on equal dates — an inconsistent comparator,
 * which V8's sort is free to resolve either way. The order of two cards is a small
 * thing; a build whose output is not reproducible is not, and `scripts/check-archives.mjs`
 * asserts the rendered order against a comparator it computes itself.
 */
export function comparePosts(a: PostMeta, b: PostMeta): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.slug.localeCompare(b.slug);
}

export function getPosts(): PostMeta[] {
  return [...data.posts].sort(comparePosts);
}

export function getPost(slug: string): PostMeta | undefined {
  return data.posts.find((p) => p.slug === slug);
}

export type PostGenre = "guide" | "profile";
export function postGenre(slug: string): PostGenre {
  return ATHLETE_SLUGS.has(slug) ? "profile" : "guide";
}

/**
 * The six posts the old site's "Blog" nav dropdown promoted, in its order. They are
 * the pillar guides — the ones that explain the method rather than report on it —
 * and they open `/blog` as "Start hier".
 */
export const PILLAR_POST_SLUGS = [
  "voetbal-specifieke-warming-up",
  "rekken",
  "krachtraining-voetbal",
  "startsnelheid-trainen-voetbal",
  "reactiesnelheid-trainen-voetbal",
  "handelingssnelheid-trainen-voetbal-met-smartgoals",
] as const;

export function getPillarPosts(): PostMeta[] {
  return PILLAR_POST_SLUGS.map((s) => getPost(s)).filter((p): p is PostMeta => Boolean(p));
}

// ----- Taxonomy -----------------------------------------------------------
/**
 * Terms that exist but must never be printed as a topic:
 *   - `geen-categorie` is WordPress's "Uncategorized" — it names nothing;
 *   - `interview` was merged into `interviews` at harvest time and survives in
 *     taxonomy.json only so the redirect map has something to point at.
 * Everything else is filtered on `count > 0`, never on array length: the merged
 * and empty terms are still rows in the file.
 */
const HIDDEN_CATEGORY_SLUGS = new Set(["geen-categorie", "interview"]);

function compareCategories(a: Category, b: Category): number {
  if (a.count !== b.count) return b.count - a.count;
  return a.name.localeCompare(b.name, "nl");
}

/** Categories that carry at least one post, biggest first. `pagesOnly` = the 18 archives. */
export function getCategories(opts?: { pagesOnly?: boolean }): Category[] {
  return taxonomy.categories
    .filter((c) => c.count > 0 && !HIDDEN_CATEGORY_SLUGS.has(c.slug))
    .filter((c) => (opts?.pagesOnly ? c.page : true))
    .sort(compareCategories);
}

export function getCategory(slug: string): Category | undefined {
  return taxonomy.categories.find((c) => c.slug === slug);
}

/** Does this term have its own archive route? */
export function hasCategoryPage(slug: string): boolean {
  const c = getCategory(slug);
  return Boolean(c?.page && c.count > 0 && !HIDDEN_CATEGORY_SLUGS.has(c.slug));
}

export function categoryHref(slug: string): string {
  return `/blog/categorie/${slug}`;
}

/** Every post in a category, newest first. Empty for a term with no archive. */
export function getPostsInCategory(slug: string): PostMeta[] {
  return data.posts.filter((p) => (p.categories ?? []).includes(slug)).sort(comparePosts);
}

/**
 * The category line: only terms that resolve to a real archive, biggest first.
 * One post — `bosu-trainingsmateriaal` — sits in `geen-categorie` and nothing else,
 * so this legitimately returns []. Callers fall back to a link to /blog/onderwerpen
 * rather than printing a dead label.
 */
export function categoriesOf(post: PostMeta): Category[] {
  return (post.categories ?? [])
    .map(getCategory)
    .filter((c): c is Category => Boolean(c?.page && c.count > 0))
    .sort(compareCategories);
}

/** Every named term on a post, archive or not — used for the topics row on a post. */
export function allCategoriesOf(post: PostMeta): Category[] {
  return (post.categories ?? [])
    .map(getCategory)
    .filter((c): c is Category => Boolean(c && c.count > 0 && !HIDDEN_CATEGORY_SLUGS.has(c.slug)))
    .sort(compareCategories);
}

export function getTags(): Tag[] {
  return taxonomy.tags.filter((t) => t.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"));
}

/**
 * Jaccard similarity on category slugs: |A n B| / |A u B|, computed over ALL of a
 * post's terms, not just the eighteen that get a page — the narrow terms
 * (`rotterdam-atletiek`, `smartgoals`) are the ones that actually distinguish two
 * posts, and the plan's whole argument for this metric is that the posts are
 * over-categorised (median 8 terms, max 26). Plain overlap count would hand every
 * result to `looptraining-voetbal`, which sits in 26 categories; dividing by the
 * union is what stops the biggest post from being everybody's neighbour.
 *
 * Ties fall back to `comparePosts` (newest first), so the result is stable.
 *
 * Posts with no overlap at all are topped up from the newest remaining posts, so the
 * section always has three cards. Exactly one post needs that: `bosu-trainingsmateriaal`,
 * whose only term is `geen-categorie`, shares it with no one.
 */
export function relatedPosts(slug: string, limit = 3): PostMeta[] {
  const self = getPost(slug);
  if (!self) return [];
  const mine = new Set(self.categories ?? []);

  const scored = data.posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const theirs = p.categories ?? [];
      let shared = 0;
      for (const c of theirs) if (mine.has(c)) shared += 1;
      const union = mine.size + theirs.length - shared;
      return { post: p, score: union > 0 ? shared / union : 0 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || comparePosts(a.post, b.post));

  const picked = scored.slice(0, limit).map((s) => s.post);
  if (picked.length >= limit) return picked;

  const taken = new Set([slug, ...picked.map((p) => p.slug)]);
  const filler = getPosts().filter((p) => !taken.has(p.slug));
  return [...picked, ...filler].slice(0, limit);
}

/**
 * Neighbours in the site's own reading order (date desc). WordPress's sense:
 * `prev` is the older post, `next` the newer one. Both ends of the run return
 * `undefined` on one side; nothing wraps.
 */
export function adjacentPosts(slug: string): { prev?: PostMeta; next?: PostMeta } {
  const all = getPosts();
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { prev: all[i + 1], next: all[i - 1] };
}

// ----- Helpers ------------------------------------------------------------
export function fmtPrice(eur: string): string {
  const n = Number(eur);
  if (Number.isNaN(n)) return eur;
  return n % 1 === 0 ? `€${n}` : `€${n.toFixed(2)}`;
}

export const CATEGORY_LABEL: Record<Product["category"], string> = {
  merch: "Kleding & Materiaal",
  ebook: "Online Training",
  event: "Event",
};

export function categoryLabel(p: Product): string {
  return CATEGORY_LABEL[p.category] ?? p.category;
}

/**
 * `sport-shirt-black-blue` came back from the harvest priced at 0.00 — a hole in
 * the old shop's data, not a free product. Rather than print "€0" we say nothing
 * about the price and let the webshop be the source of truth.
 */
export function hasPrice(p: Product): boolean {
  const n = Number(p.price_eur);
  return Number.isFinite(n) && n > 0;
}

export function isOnSale(p: Product): boolean {
  if (!p.regular_price_eur || !hasPrice(p)) return false;
  const was = Number(p.regular_price_eur);
  return Number.isFinite(was) && was > Number(p.price_eur);
}

// ----- Product gallery ----------------------------------------------------
/** Always at least one image; the harvest verified every gallery path resolves. */
export function productGallery(p: Product): string[] {
  const g = (p.gallery ?? []).filter(Boolean);
  if (g.length) return g;
  const fallback = localImg(p.image);
  return fallback ? [fallback] : [];
}

// ----- Product options ----------------------------------------------------
export type ProductOption = { value: string; inStock: boolean; text?: string };

/**
 * The one selectable axis a product has, if any. For 17 products that is the
 * size run; for `padeltoernooi` it is a skill level (`niveau`), which is why the
 * label travels with the options instead of being hard-coded to "Maat".
 */
export type OptionRun = { key: string; label: string; options: ProductOption[] };

const VARIANT_LABEL: Record<string, string> = { niveau: "Niveau" };

export function productOptions(p: Product): OptionRun | null {
  const stock = p.variant_stock ?? {};
  const build = (key: string, label: string, values: string[]): OptionRun => ({
    key,
    label,
    options: values.map((value) => ({
      value,
      // No per-variation row means the harvest saw no sold-out marker for it.
      inStock: stock[value] ? stock[value].in_stock : true,
      text: stock[value]?.text,
    })),
  });

  if (p.sizes?.length) return build("maat", "Maat", p.sizes);

  const variantKey = Object.keys(p.variants ?? {}).find((k) => (p.variants?.[k] ?? []).length);
  if (variantKey) {
    const label = VARIANT_LABEL[variantKey] ?? variantKey[0].toUpperCase() + variantKey.slice(1);
    return build(variantKey, label, p.variants?.[variantKey] ?? []);
  }
  return null;
}

/**
 * Variation-level truth beats the parent flag. WooCommerce left several parents
 * marked `outofstock` while S and M were still sellable (`sport-shirt-black`),
 * so a product only counts as sold out when nothing on it can be bought.
 */
export function isSoldOut(p: Product): boolean {
  const variants = Object.values(p.variant_stock ?? {});
  if (variants.length) return variants.every((v) => !v.in_stock);
  return p.stock_status === "outofstock";
}

/** Attribute rows worth printing — WooCommerce leaves "N/B" (n/a) placeholders behind. */
export function productAttributes(p: Product): [string, string][] {
  return Object.entries(p.attributes ?? {}).filter(
    ([, v]) => v && v.trim() && !/^n\/b$/i.test(v.trim()),
  );
}

/**
 * Same category first, then the rest of the shop, never the product itself.
 * The walk starts at the current product and wraps, rather than always taking
 * the first four in the file — otherwise every merch page recommended the same
 * four shirts.
 */
export function relatedProducts(slug: string, limit = 4): Product[] {
  const all = data.products;
  const start = all.findIndex((p) => p.slug === slug);
  if (start < 0) return [];
  const self = all[start];
  const rotated = [...all.slice(start + 1), ...all.slice(0, start)];
  const sameCat = rotated.filter((p) => p.category === self.category);
  const rest = rotated.filter((p) => p.category !== self.category);
  return [...sameCat, ...rest].slice(0, limit);
}
