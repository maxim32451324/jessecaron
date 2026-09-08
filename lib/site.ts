/**
 * The site's own public origin — the single source of truth for every absolute URL the
 * app emits: `metadataBase` (og:image, canonicals), `sitemap.ts`, and the `Sitemap:`
 * line in `robots.ts`.
 *
 * All three of those used to hardcode `https://www.jessecaron.com`, the OLD WordPress
 * site, each in its own file. That was not cosmetic:
 *
 *   - og:image resolved to a 404, because the image only exists on this deployment;
 *   - the sitemap served from this domain advertised 83 URLs on the old domain, several
 *     of which do not exist there — actively pointing search engines away from this site;
 *   - robots.txt referred crawlers to the old site's sitemap.
 *
 * Keep it in one place so the three cannot drift apart again. When the real domain is
 * attached, set `NEXT_PUBLIC_SITE_URL` in Vercel and everything follows; until then this
 * resolves to the deployment's own production origin, which is correct wherever it runs.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://jessecaron.vercel.app");
