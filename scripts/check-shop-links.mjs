/**
 * Fails the build when the buy buttons point back at this site.
 *
 * WHY THIS EXISTS
 *
 * This site does not sell anything. It shows 38 products and sends the customer to a
 * WooCommerce store to pay. `content/data/content.json` records that store as
 * `https://www.jessecaron.com/product/<slug>/`, which is also the address the new site
 * is eventually going to answer on.
 *
 * On the day the domain is pointed here, and only on that day, those two facts collide:
 * the buy button links into this deployment, `next.config.ts` redirects
 * `/product/<slug>/` to `/shop/<slug>`, and the customer is delivered back to the page
 * they clicked from. No error is raised anywhere. The shop just stops taking orders,
 * and it can be weeks before somebody notices that nothing has been ordered.
 *
 * PARITY-PLAN calls this the top risk of the whole migration, and a risk with no
 * detector attached is a risk nobody will remember on the day. So: if the shop's origin
 * and this site's origin are the same hostname, the build stops here and says what to do.
 *
 * The fix is never to edit this file. It is to set, in Vercel, BEFORE the DNS change:
 *
 *     NEXT_PUBLIC_SHOP_URL=https://shop.jessecaron.com
 *
 * See `docs/DOMAIN-MOVE.md`.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const content = JSON.parse(fs.readFileSync(path.join(ROOT, "content/data/content.json"), "utf8"));

const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://jessecaron.vercel.app");
const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").replace(/\/+$/, "");

const siteHost = host(SITE_URL);
const productHosts = [...new Set(content.products.map((p) => host(p.url)).filter(Boolean))];
const shopHost = SHOP_URL ? host(SHOP_URL) : productHosts[0];

if (!shopHost || !siteHost) {
  console.error("check-shop-links: could not read a hostname from the site or shop URL.");
  process.exit(1);
}

if (shopHost === siteHost) {
  console.error(`
check-shop-links: the shop and this site are on the same hostname (${siteHost}).

  ${content.products.length} buy buttons currently resolve to https://${shopHost}/product/<slug>/,
  which this deployment answers with a 301 back to /shop/<slug> — the page the customer
  just clicked from. Nobody can complete an order.

  Before pointing the domain here, move WooCommerce to its own hostname and set:

      NEXT_PUBLIC_SHOP_URL=https://shop.jessecaron.com

  in the Vercel project, then redeploy. Step 3 of docs/DOMAIN-MOVE.md.
  If selling has genuinely stopped, remove the buy buttons instead — do not silence
  this check.
`);
  process.exit(1);
}

const stray = content.products.filter((p) => host(p.url) && host(p.url) !== productHosts[0]);
if (stray.length) {
  console.error(`check-shop-links: ${stray.length} product(s) point at a different host than the rest.`);
  for (const p of stray.slice(0, 10)) console.error(`  ${p.slug} -> ${p.url}`);
  process.exit(1);
}

console.log(
  `check-shop-links: ${content.products.length} buy buttons -> ${shopHost}; this site is ${siteHost}. Distinct, so the shop works.`,
);
