import type { MetadataRoute } from "next";
import { TRAINING_SLUGS, getCategories, getPosts, getProducts } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// This site's own origin, never the old WordPress domain: a sitemap served from here
// that lists URLs over there points crawlers at the site this one replaces.
const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
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
  ];

  return [
    ...staticRoutes.map((path) => ({ url: `${BASE}${path}`, changeFrequency: "monthly" as const })),
    ...TRAINING_SLUGS.map((slug) => ({ url: `${BASE}/training/${slug}` })),
    // The 18 categories with >= 5 posts. The other 52 terms are labels, not routes, and
    // a sitemap must never list a URL that redirects (PARITY-PLAN §8.3).
    ...getCategories({ pagesOnly: true }).map((c) => ({
      url: `${BASE}/blog/categorie/${c.slug}`,
      changeFrequency: "monthly" as const,
    })),
    ...getPosts().map((p) => ({ url: `${BASE}/blog/${p.slug}`, lastModified: p.date || undefined })),
    ...getProducts().map((p) => ({ url: `${BASE}/shop/${p.slug}` })),
  ];
}
