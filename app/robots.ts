import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // `/login` joins the list for the same reason the others are on it: it is a form,
    // not a page, and an indexed sign-in screen helps nobody. `/gone` is deliberately
    // absent — it answers 410 with its own `x-robots-tag: noindex`, and a crawler has to
    // be allowed to fetch it to learn that the 62 old theme-demo URLs are dead.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/auth", "/login"] }],
    // This deployment's own sitemap. It pointed at the old WordPress domain, which sent
    // every crawler that read it away from the site it was served from.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
