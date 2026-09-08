/**
 * Where the money is taken.
 *
 * THIS IS THE SINGLE BIGGEST RISK IN THE WHOLE DOMAIN MOVE, so it gets its own file.
 *
 * This site has no basket, no stock and no payment provider. Every buy button, on all
 * 38 product pages plus the sticky bar, sends the customer to the WooCommerce store
 * that still runs the shop — and `content.json` records that store's address as
 * `https://www.jessecaron.com/product/<slug>/`, because at harvest time the old site
 * and the shop were the same thing.
 *
 * They stop being the same thing the day `www.jessecaron.com` is pointed at this
 * deployment. From that moment every buy button links into this site, the redirect map
 * turns `/product/<slug>/` into `/shop/<slug>`, and the customer is returned to the
 * page they were already on. Nothing errors. Nothing is logged. The shop just quietly
 * stops selling, and the first anyone hears of it is an empty month.
 *
 * The fix is one environment variable, set BEFORE the DNS change:
 *
 *     NEXT_PUBLIC_SHOP_URL=https://shop.jessecaron.com
 *
 * `buyUrl()` rewrites the stored product URL onto that origin, so the 38 rows in
 * `content.json` never have to be rewritten by hand, and `scripts/check-shop-links.mjs`
 * (run by `prebuild`) fails the build if the shop origin has become this site's own
 * hostname. A guard, because a comment is not a guard.
 *
 * See `docs/DOMAIN-MOVE.md` for the order of operations.
 */
import { SITE_URL } from "@/lib/site";

/** The origin that owns baskets, checkout and accounts. Empty means "wherever the harvest said". */
export const SHOP_URL: string = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").replace(/\/+$/, "");

/**
 * True when the shop is being served from this site's own origin — i.e. the buy
 * buttons point back at a page that cannot take a payment.
 */
export function shopIsSelfReferential(productUrl: string, siteUrl: string = SITE_URL): boolean {
  try {
    const shop = new URL(SHOP_URL || productUrl);
    const site = new URL(siteUrl);
    return shop.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

/**
 * The URL a buy button should actually use: the stored path, on the shop's own origin.
 * With `NEXT_PUBLIC_SHOP_URL` unset this returns the stored URL unchanged, which is
 * correct while this site lives on a different hostname from the shop.
 */
export function buyUrl(productUrl: string): string {
  if (!SHOP_URL) return productUrl;
  try {
    const u = new URL(productUrl);
    return `${SHOP_URL}${u.pathname}${u.search}`;
  } catch {
    return productUrl;
  }
}
