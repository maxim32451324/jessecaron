import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/auth"] }],
    // This deployment's own sitemap. It pointed at the old WordPress domain, which sent
    // every crawler that read it away from the site it was served from.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
