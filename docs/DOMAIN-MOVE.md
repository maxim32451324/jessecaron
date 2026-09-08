# Moving jessecaron.com to the new site

**Who this is for:** Jesse, and whoever is helping on the day.
**How long it takes:** about two weeks of waiting, and one afternoon of doing.
**The one thing that must not be skipped:** step 3. Everything else can be fixed the next
morning. Step 3 cannot — it is the difference between a webshop that takes orders and a
webshop that quietly stops.

---

## The short version

Right now there are two websites:

| | Where it lives | What it does |
|---|---|---|
| **The old site** | `www.jessecaron.com` — WordPress | Everything: pages, blog, **and the webshop that takes the money** |
| **The new site** | `jessecaron.vercel.app` | Everything except the webshop |

"Moving the domain" means pointing `www.jessecaron.com` at the new site. The moment that
happens, the new site inherits every link, every bookmark and every Google result that
pointed at the old one — about 800 web addresses. Those are handled: the new site knows
all 800 and sends each one to the right new page, and this has been tested address by
address (`content/data/redirect-audit.json`).

What is **not** automatically handled is the shop. Read step 3 before you start.

---

## Step 3, said first, because it is the one that costs money

Every "Toevoegen aan winkelwagen" button on the new site — all 38 of them — currently
sends the customer to `www.jessecaron.com/product/…`, because that is where the basket,
the stock and the payment provider are. That works today because the new site lives at a
different address.

**The moment `www.jessecaron.com` points at the new site, those buttons point at the new
site too — which has no basket.** The customer clicks "buy", and lands back on the page
they were already looking at. Nothing breaks visibly. No error appears. Nobody is told.
You would find out from an empty bank statement.

So, before the domain moves, one of these three has to be true:

**(a) Keep selling — recommended for launch day.**
Ask the WordPress host (the company that currently hosts jessecaron.com) to move the
WordPress installation to **`shop.jessecaron.com`** instead of `www.jessecaron.com`.
Nothing about the shop changes for customers except the address. Then tell the new site
where the shop went — one setting in Vercel:

```
NEXT_PUBLIC_SHOP_URL = https://shop.jessecaron.com
```

and redeploy. The buy buttons follow automatically; there is no list to edit.

**(b) Replace the shop** with Shopify or Lightspeed. This is a project, not a step. Do it
after the move, not during it.

**(c) Stop selling.** Then the buy buttons should be removed rather than left pointing at
nothing. Say so and it is a half-day of work.

The new site refuses to build if this is got wrong: if the shop's address and the
website's address are the same, the deployment fails with an explanation instead of
going live broken. That check is `scripts/check-shop-links.mjs`, and it exists precisely
because "remember to do the shop first" is not a plan.

---

## The order of operations

### Two weeks before

**1. Decide the shop question above.** Everything else waits on it. If the answer is (a),
this is when you ask the host to move WordPress to `shop.jessecaron.com` — hosts are slow,
and this is the only step with somebody else's timeline in it.

**2. Tell the new site what its address will be.** In the Vercel project settings, add:

```
NEXT_PUBLIC_SITE_URL = https://www.jessecaron.com
NEXT_PUBLIC_SHOP_URL = https://shop.jessecaron.com     ← only if you chose (a)
```

Redeploy. Then open the preview and check two addresses look right:

- `…/sitemap.xml` — the list of pages should say `www.jessecaron.com`, not `vercel.app`
- `…/robots.txt` — same

**3. Add the new site in Google Search Console** for `www.jessecaron.com`, if it is not
there already. Do not submit anything yet. You just want the property to exist so you can
submit the sitemap within the hour on the day.

### The day before

**4. Test one purchase**, end to end, on `shop.jessecaron.com`. Buy something cheap.
Actually pay. Check the confirmation email arrives. If (a) was chosen and this does not
work, stop — do not move the domain.

**5. Run the link check** (whoever is doing the technical work):

```
npm run build
npm run check:redirects
```

It fetches all ~800 old addresses against the new site and prints a table. Every line
must pass. If anything fails, it names the address and why.

### The day

**6. Point the DNS at Vercel.** The exact records are in `DEPLOY.md`. Vercel handles
`jessecaron.com` → `www.jessecaron.com` and the security certificate on its own; give it
up to an hour to go green. Do this in the morning, on a weekday, not on a Friday.

**7. Within the hour, submit the sitemap** in Search Console: `https://www.jessecaron.com/sitemap.xml`.

**8. Check ten links by hand.** Not because the automated check is wrong, but because it
is worth seeing it work. Open these in a browser — each should land on a real page, not
an error:

```
www.jessecaron.com/loopscholing/
www.jessecaron.com/records/
www.jessecaron.com/data/
www.jessecaron.com/category/voetbal/
www.jessecaron.com/tag/hockey/
www.jessecaron.com/product/bidon/
www.jessecaron.com/portfolio-item/explosiviteit-sprongkracht-oefeningen/
www.jessecaron.com/schoolsport-vereniging-rotterdam-atletiek/
www.jessecaron.com/stretching/
www.jessecaron.com/elements/pie-charts/       ← this one SHOULD say "bestaat niet meer"
```

**9. Click one buy button** and complete a purchase. Again. For real. This is the only
check that proves the shop survived the move.

### The month after

**10. Leave the old WordPress switched on**, reachable at `shop.jessecaron.com` (or an
internal address if selling stopped), for **thirty days**. It costs one month of hosting
and it is the safety net for anything the crawl did not think of.

**11. Watch Search Console** once a week for "Not found (404)". Expect the *number of
indexed pages to fall* — from around 800 to around 100. That is the plan working, not a
problem: roughly 500 of the old addresses were tag and category pages with one article on
them, and 62 were leftover demo pages from the old theme that were never yours.

**12. After thirty days, switch the old WordPress off** — unless it is still running the
shop, in which case it stays until the shop is replaced.

---

## What happens to the old addresses

| The old address | What it does now | How many |
|---|---|---|
| An article, e.g. `/looptrainer-looptraining-feyenoord/` | Goes to the same article on the new site | 27 |
| A training page, e.g. `/loopscholing/` | Goes to `/training/loopscholing` | 11 |
| A product, e.g. `/product/bidon/` | Goes to the product page on the new site | 38 |
| A topic with its own page, e.g. `/category/voetbal/` | Goes to the new topic page | 18 |
| A topic without one, e.g. `/category/blessure/` | Goes to the blog index | 50 |
| A tag, e.g. `/tag/bindweefsel/` | Goes to the blog index, or to the matching topic page where one exists | 261 |
| A video, e.g. `/portfolio-item/…/` | Goes to `/videos` | 21 |
| Basket, checkout, my-account | Goes to the shop (or `/shop` until the shop question is settled) | 6 |
| A leftover demo page from the old theme, e.g. `/elements/counters/` | Says "deze pagina bestaat niet meer" — deliberately | 62 |

Nothing returns an error. Nothing takes two steps to arrive. That was tested one address
at a time, and the result is in `content/data/redirect-audit.json`.

---

## If something goes wrong

**Everything is broken.** Point the DNS back at the old host. The old WordPress is still
running (step 10) and nothing was deleted from it. You lose nothing but the afternoon.

**One page is wrong.** It is a one-line change to `lib/legacy-routes.mjs` and a redeploy;
about ten minutes.

**The shop is not taking orders.** Check `NEXT_PUBLIC_SHOP_URL` in Vercel. This is,
overwhelmingly, the thing that will have gone wrong.
