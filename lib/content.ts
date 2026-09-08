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

export type Product = {
  name: string;
  price_eur: string;
  category: "merch" | "ebook" | "event";
  slug: string;
  url: string;
  image: string;
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
