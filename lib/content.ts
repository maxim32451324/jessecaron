// CLIENT-SAFE content module — no node:fs. Reads bundled JSON only.
// Filesystem-backed markdown bodies live in `lib/content.server.ts`.
import contentJson from "@/content/data/content.json";
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
  tags: string[];
  excerpt: string;
};

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

const data = contentJson as unknown as ContentShape;
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

export function getPosts(): PostMeta[] {
  return [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): PostMeta | undefined {
  return data.posts.find((p) => p.slug === slug);
}

export type PostGenre = "guide" | "profile";
export function postGenre(slug: string): PostGenre {
  return ATHLETE_SLUGS.has(slug) ? "profile" : "guide";
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
