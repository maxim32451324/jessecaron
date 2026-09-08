import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ShopGrid, { SHOPGRID_CSS } from "@/components/ShopGrid";
import { CheckoutTrust, Guarantees, SHOPTRUST_CSS } from "@/components/ShopTrust";
import {
  brand,
  CATEGORY_LABEL,
  fmtPrice,
  getProduct,
  getProducts,
  hasPrice,
  isSoldOut,
  localImg,
  productGallery,
  type Product,
} from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * /shop as a landing page.
 *
 * It used to be a `PageHero` and one flat 38-tile grid behind a client-side tab
 * filter. The client's brief was that it should "feel like a main page again" — a
 * hero, a scroll cue, grouped sections, more of the collection, a trust widget and
 * a small quote. The order below is that brief:
 *
 *   1  HERO                  full-bleed photograph, its own composition (see SHERO_SRC)
 *   2  UIT DE COLLECTIE      a rail of twelve second-angle gallery shots, one in view
 *                            at a time with its price, read left to right
 *   3  01 Kleding & Materiaal  33 products
 *   4  TRUST                 payments, delivery, returns — shared with the product page
 *   5  IN HET DETAIL         three close-ups, out of the same galleries
 *   6  02 Online Training    4 e-books, each showing a page from the book
 *   7  03 Event              1 product, sold out, so no buy affordance near it
 *   8  QUOTE                 Jesse's own tagline, attributed to him
 *
 * WHAT IS NOT HERE, deliberately: no price beyond the harvested price, no delivery
 * promise that is not already published, no stock or free-shipping threshold, no
 * security badge (the payment happens on the webshop, not here), and no testimonial
 * — the old store's product pages all read "Er zijn nog geen beoordelingen", so
 * there is no customer to quote and the quote band is Jesse's own line, labelled
 * as his.
 *
 * Ordering still happens on the webshop, and nothing on this page is a buy button:
 * every tile links to `/shop/<slug>`, where `buyUrl()` decides the shop origin. So
 * `lib/shop.ts` is not imported here at all, and the one sold-out product (the
 * padeltoernooi) cannot present a buy affordance because there is none to present.
 */

export const metadata: Metadata = {
  title: "Shop",
  alternates: { canonical: `${SITE_URL}/shop` },
  description: "Kleding, materiaal en online trainingen — Don't tell people your dreams, show them.",
};

/**
 * The hero shot: `Nargelis-Statia-Jesse-Caron-Sportkleding-Blauw.jpg`, from
 * `public/brand/photos`. Chosen over the shirt-on-a-model shot that used to sit in
 * the `PageHero` for three reasons `content/data/media-harvest-report.json` settles
 * between them: at 1920x881 it is the only genuinely wide (2.18:1) photograph of the
 * clothing in the library, so a short full-bleed band crops it barely at all, where
 * every other apparel shot is 3:2 and would lose half its frame; it is the one frame
 * where the origami eagle is *the* subject, in brand blue, on an otherwise
 * desaturated track; and it is not the home page's hero, which is a track start
 * (`DSC_0857-b-scaled.jpg`) and stays the site's front door.
 *
 * The composition is centred, which is part of why this hero is not a copy of the
 * home one: at any desktop width the band is wider than 2.18:1, so `cover` fills
 * the width exactly and no horizontal `object-position` can move her. The copy
 * therefore sits low-left over dark track and dark trousers rather than fighting
 * the subject, the band stops well short of 100vh so the mosaic below already
 * shows, and the scroll cue takes the centre.
 */
const SHERO_SRC = "Nargelis-Statia-Jesse-Caron-Sportkleding-Blauw.jpg";

/**
 * One image out of one product's own gallery, resolved rather than hardcoded.
 *
 * 33 of the 38 products carry a `gallery` array (88 unique images, main shot
 * first) and this page used to show exactly one of them per product. The bands
 * below use the *other* shots, and this is how they are picked: a curated
 * `[slug, basename]` pair is looked up inside that product's own gallery, so a
 * basename that ever stops being one of that product's images resolves to nothing
 * and drops out of the row instead of 404-ing. Anchored on "/" so
 * `Stroboscoopbril-Reactiebril.jpg` cannot answer for `Reactiebril.jpg`.
 */
type Shot = {
  src: string;
  slug: string;
  name: string;
  /** Formatted, or null where the old shop holds no price (sport-shirt-black-blue is 0.00). */
  price: string | null;
  soldOut: boolean;
};

function shot(slug: string, basename: string): Shot | null {
  const p: Product | undefined = getProduct(slug);
  if (!p) return null;
  const src = productGallery(p).find((s) => s.startsWith("/") && s.endsWith(`/${basename}`));
  if (!src) return null;
  return {
    src,
    slug: p.slug,
    name: p.name,
    price: hasPrice(p) ? fmtPrice(p.price_eur) : null,
    soldOut: isSoldOut(p),
  };
}

function shots(pairs: [string, string][]): Shot[] {
  return pairs.map(([s, b]) => shot(s, b)).filter((s): s is Shot => Boolean(s));
}

/**
 * "Uit de collectie" — twelve second-angle shots, none of them the picture already
 * on that product's card in the grid below. Eight apparel, four training material,
 * so the strip shows the actual range rather than twelve shirts.
 *
 * They are a rail now, not a mosaic: one image in view at a time, scrolled left to
 * right, each captioned with its name and price. Twelve at roughly one screen each
 * is a long scroll on purpose — this band is where the collection is looked at,
 * and the grid below is where it is scanned.
 */
const COLLECTION: [string, string][] = [
  ["longsleeved-shirt-black", "Jesse-Caron-Kleding-Longsleeve-Zwart.jpg"],
  ["shirt-white", "Loic-Wondel-Shirt-Wit-Zwart.jpg"],
  ["shirt-black", "Adelaar-Shirt.jpg"],
  ["dream-shirt", "Jesse-Caron-Casual-Kleding.jpg"],
  ["dream-shirt-kids", "Dont-Tell-People-Your-Dreams-Show-Them-Kids-Shirt-Bank.jpg"],
  ["kids-sport-shirt-black", "Jesse-Caron-Sport-Kleding-Kinderen.jpg"],
  ["reflection-hoodie", "Zwarte-Trui-Jesse-Caron-Adelaar.jpg"],
  ["reflection-cowl-sweatshirt", "Sport-Cowl-Trui-Jesse-Caron-Reflection.jpg"],
  ["backpack", "Sportzak-Rugzak-Adelaar-Vogel-Blauw.jpg"],
  ["stroboscoop-glasses", "Reactiebril.jpg"],
  ["reaction-balls", "Jesse-Caron-Product-Reactieballen-Blauw-Zwart-Zakje-scaled.jpg"],
  ["springtouw", "Springtouw-Blauw-Zwart.jpg"],
];

/**
 * "In het detail" — the three close-ups in the library, each from the gallery of
 * the product it is a close-up of: the reflective print on the hoodie, the logo at
 * thread level on the longsleeve, the eagle on the shoe bag. These are the shots a
 * one-image-per-product grid can never show. All three products are in stock.
 */
const DETAILS: [string, string][] = [
  ["reflection-hoodie", "Adelaar-Hoodie-Reflectie-Detail.jpg"],
  ["longsleeved-shirt-black", "Jesse-Caron-Kleding-Longsleeve-Zwart-Detail.jpg"],
  ["shoe-bag", "Jesse-Caron-Product-Schoenentas-Origiami-Adelaar-Close.jpg"],
];

/**
 * The quote. Jesse's own line, read out of `content/data/content.json`
 * (`brand.taglines`) rather than retyped, so it cannot drift from the brand data,
 * and attributed to him in a `<figcaption>` so there is no chance of it reading as
 * a customer review. There are no customer reviews to read: the old store's
 * product pages all say "Er zijn nog geen beoordelingen".
 *
 * Found by its content rather than by index — the other three taglines are already
 * spoken for (the home hero, the home manifesto band, the footer headline), and
 * this is the one that has always belonged to the shop.
 */
const SHOP_LINE = brand.taglines.find((t) => /dreams/i.test(t)) ?? brand.tagline;

/* --------------------------------------------------------------------------
   `sizes`, every one of them read off the CSS at the bottom of this file
   rather than guessed. The content column is 1224px (--maxw 1280 less 2x28
   padding); subtract the gaps and divide by the track count at each
   breakpoint. Getting these wrong is not a visible bug but a silent one: the
   browser picks a candidate far larger than the box and next/image has done
   nothing at all.
   -------------------------------------------------------------------------- */
// .scoll__slide is a rail slide, not a mosaic tile: 88vw on a phone, 82vw to 1000px,
// then 46vw where two fit. These were 34/25/17vw for the six-track mosaic this band
// used to be, which is exactly the silent failure described above — a near-full-width
// slide served a 17vw candidate is a soft image, and nothing reports it.
const COLLECTION_SIZES = "(max-width: 640px) 88vw, (max-width: 1000px) 82vw, 46vw";
// .sdet: 3 tracks, 1px gaps, inside the column -> 1 track below 760px.
const DETAIL_SIZES =
  "(max-width: 760px) calc(100vw - 56px), (max-width: 1280px) calc((100vw - 58px) / 3), 407px";
// .sbooks: 2 tracks, 24px gap, inside the column -> 1 track below 760px.
const BOOK_SIZES =
  "(max-width: 760px) calc(100vw - 56px), (max-width: 1280px) calc((100vw - 80px) / 2), 600px";
// .sevent: 2 equal tracks, 44px gap, inside the column -> 1 track below 860px.
const EVENT_SIZES =
  "(max-width: 860px) calc(100vw - 56px), (max-width: 1280px) calc((100vw - 100px) / 2), 590px";

export default function ShopPage() {
  const merch = getProducts("merch");
  const ebooks = getProducts("ebook");
  const events = getProducts("event");
  const collection = shots(COLLECTION);
  const details = shots(DETAILS);

  /* The hero's fact row: counted off the data, not typed in, so it can never
     disagree with the bands underneath it, and each chip is the anchor to its
     band. Filtered on `n > 0` so an emptied category leaves no dead link. */
  const counts: { label: string; n: number; href: string }[] = [
    { label: CATEGORY_LABEL.merch, n: merch.length, href: "#kleding" },
    { label: CATEGORY_LABEL.ebook, n: ebooks.length, href: "#online" },
    { label: CATEGORY_LABEL.event, n: events.length, href: "#event" },
  ].filter((c) => c.n > 0);

  return (
    <>
      {/* ---- 1. HERO ------------------------------------------------------- */}
      <section className="shero">
        <div className="shero__bg">
          {/* The LCP element of this route: `priority` so it is preloaded rather
              than discovered by the lazy-load observer two paints later, and
              `fill` because the height comes from the section, not the file. */}
          <Image
            src={localImg(SHERO_SRC)}
            alt="Atleet in Origami-sportkleding van Jesse Caron op de atletiekbaan"
            fill
            sizes="100vw"
            priority
          />
        </div>

        <div className="wrap shero__inner">
          <div className="shero__kicker">
            <span className="shero__tick" />
            {/* .eyebrow is brand blue, which reads well on this site's near-black
                but not on a photograph with a brand-blue logo in the middle of it.
                White with a shadow survives whatever is behind it and the blue tick
                to its left keeps the accent — the same fix the home hero makes, for
                the same reason. */}
            <span className="eyebrow shero__eyebrow">Shop — Origami™</span>
          </div>

          <h1 className="display shero__h1">
            De hele
            <br />
            collectie
          </h1>

          <div className="shero__row">
            <p className="shero__sub">
              Kleding, materiaal en online trainingen. Bestellen verloopt via de officiële
              webshop.
            </p>
            <div className="shero__actions">
              <a href="#kleding" className="btn btn--blue">
                Kleding &amp; materiaal
              </a>
              <a href="#online" className="btn">
                Online training
              </a>
            </div>
          </div>

          <ul className="shero__facts" role="list">
            {counts.map((c) => (
              <li className="shero__fact" key={c.label}>
                <a href={c.href}>
                  <span className="shero__factn">{c.n}</span>
                  <span className="shero__factl">{c.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/*
          The scroll cue — the "scroll thing" in the brief. Deliberately quiet: a
          hairline rail with a dot falling down it, a mono label, and a real anchor
          to the first band, so it is a control and not only decoration.

          It does not duplicate or fight `components/ScrollRunner.tsx`, the
          site-wide sprinting figure: that one is `position:fixed` across the TOP of
          the viewport at z-index 101 and is driven by progress through the whole
          document. This is a static element at the BOTTOM of the hero and scrolls
          away with it, so the two are never in the same place at the same time.

          The falling dot is the only motion on the page, and `prefers-reduced-motion`
          parks it at the top of the rail.
        */}
        <a className="shero__cue" href="#collectie">
          <span className="shero__cuelabel">Scroll</span>
          <span className="shero__cuerail" aria-hidden>
            <span className="shero__cuedot" />
          </span>
        </a>
      </section>

      {/* ---- 2. UIT DE COLLECTIE ------------------------------------------- */}
      {collection.length ? (
        <section className="scoll" id="collectie" aria-labelledby="scoll-h">
          <div className="wrap">
            <Reveal className="scoll__head">
              <div>
                <span className="sec-num">Uit de collectie</span>
                <h2 className="display scoll__h" id="scoll-h">
                  Meer dan één
                  <br />
                  hoek per product
                </h2>
              </div>
              <p className="scoll__p">
                Extra beelden uit de fotoseries van de producten hieronder — kleding en
                trainingsmateriaal. Elk beeld gaat naar zijn eigen product.
              </p>
            </Reveal>
          </div>
          {/* Full-bleed on purpose: the one band that steps outside the 1224px
              column, which is most of what stops the page reading as one long
              grid again. */}
          {/* One image at a time, read left to right, each with its price.
              Native scroll-snap does the paging: no script, so it works before
              hydration and with JavaScript off, and it is the same rail mechanic
              the related-products strip on the product page already uses. */}
          <ul className="scoll__rail" role="list" tabIndex={0} aria-label="Beelden uit de collectie">
            {collection.map((s, i) => (
              <li className="scoll__slide" key={s.src}>
                <Link className="scoll__l" href={`/shop/${s.slug}`}>
                  <span className="scoll__frame">
                    <Image src={s.src} alt="" fill sizes={COLLECTION_SIZES} />
                    {s.soldOut ? <span className="scoll__out">Uitverkocht</span> : null}
                  </span>
                  {/* The caption is the tile's accessible name and its price line at
                      once — always in the accessibility tree, never hover-only, because
                      a price a touch user cannot reveal is a price that is not there. */}
                  <span className="scoll__cap">
                    <span className="scoll__no">{String(i + 1).padStart(2, "0")}</span>
                    <span className="scoll__n">{s.name}</span>
                    <span className="scoll__p">{s.price ?? "Zie webshop"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---- 3. KLEDING & MATERIAAL --------------------------------------- */}
      <section className="pad" id="kleding">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">01 — {CATEGORY_LABEL.merch}</span>
              <h2 className="display">
                Shirts, hoodies en
                <br />
                trainingsmateriaal
              </h2>
            </div>
            <p className="sband__note">
              {merch.length} producten. Maten en varianten kies je in de webshop.
            </p>
          </Reveal>
          {/*
            No <Reveal> around this one, unlike every other block on the page.
            Reveal fires at 12% of the element's own height, and 33 products in two
            columns is 4337px tall on a phone: 12% of that is 520px, more than the
            461px of it that is on screen when the band arrives, so the entire grid
            sat at opacity:0 until you had scrolled half a screen past its heading.
            Measured at 390x844. The heading above it still reveals.
          */}
          <ShopGrid products={merch} badges={false} />
        </div>
      </section>

      {/* ---- 4. TRUST — the same two blocks the product page renders ------- */}
      <section className="strust" aria-labelledby="strust-h">
        <div className="wrap">
          <Reveal className="strust__grid">
            <div className="strust__col">
              <h2 className="display strust__h" id="strust-h">
                Betalen, bezorgen,
                <br />
                retourneren
              </h2>
              <Guarantees className="pguar--wide" />
            </div>
            <div className="strust__col">
              <CheckoutTrust className="ptrust--wide" headingId="strust-checkout" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 5. IN HET DETAIL --------------------------------------------- */}
      {details.length ? (
        <section className="pad" aria-labelledby="sdet-h">
          <div className="wrap">
            <Reveal className="sec-head">
              <div>
                <span className="sec-num">In het detail</span>
                <h2 className="display" id="sdet-h">
                  De adelaar,
                  <br />
                  van dichtbij
                </h2>
              </div>
              <p className="sband__note">
                Close-ups uit dezelfde fotoseries, op het niveau waarop je het draagt.
              </p>
            </Reveal>
            <Reveal className="sdet">
              {details.map((d) => (
                <Link className="sdet__i" href={`/shop/${d.slug}`} key={d.src}>
                  <span className="sdet__img">
                    <Image src={d.src} alt="" fill sizes={DETAIL_SIZES} />
                  </span>
                  <span className="sdet__b">
                    <span className="sdet__k">Detail</span>
                    <span className="sdet__n">{d.name}</span>
                    <span className="sdet__go">
                      Bekijk <span className="ar">→</span>
                    </span>
                  </span>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ---- 6. ONLINE TRAINING ------------------------------------------- */}
      {ebooks.length ? (
        <section className="sonline" id="online" aria-labelledby="sonline-h">
          <div className="wrap">
            <Reveal className="sec-head">
              <div>
                <span className="sec-num">02 — {CATEGORY_LABEL.ebook}</span>
                <h2 className="display" id="sonline-h">
                  Download de
                  <br />
                  oefeningen
                </h2>
              </div>
              <p className="sband__note">
                {ebooks.length} e-books, te downloaden na aankoop in de webshop.
              </p>
            </Reveal>
            <Reveal className="sbooks">
              {ebooks.map((p) => {
                const g = productGallery(p).filter((s) => s.startsWith("/"));
                /* The second gallery image where there is one: for an e-book that is
                   a page out of the book rather than its cover, which is the one
                   thing somebody weighing a download actually wants to see. All four
                   have one. */
                const preview = g[1] ?? g[0];
                return (
                  <Link className="sbook" href={`/shop/${p.slug}`} key={p.slug}>
                    <span className="sbook__img">
                      {preview ? <Image src={preview} alt="" fill sizes={BOOK_SIZES} /> : null}
                      <span className="sbook__k">E-book</span>
                      {isSoldOut(p) ? <span className="sprod__out">Uitverkocht</span> : null}
                    </span>
                    <span className="sbook__b">
                      <span className="sbook__top">
                        <span className="sbook__n">{p.name}</span>
                        <span className="sbook__p">
                          {hasPrice(p) ? fmtPrice(p.price_eur) : "Zie webshop"}
                        </span>
                      </span>
                      {/* His own harvested product copy, verbatim and clipped on a
                          word boundary — it states the exercise counts, which is the
                          only concrete fact these four carry. */}
                      {p.short_description ? (
                        <span className="sbook__d">{clip(p.short_description, 170)}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ---- 7. EVENT ------------------------------------------------------ */}
      {events.length ? (
        <section className="pad" id="event" aria-labelledby="sevent-h">
          <div className="wrap">
            <Reveal className="sec-head">
              <div>
                <span className="sec-num">03 — {CATEGORY_LABEL.event}</span>
                {/* "Eenmalige events" and not "Toernooien en clinics": an event
                    product on this shop is a one-off ticket, and there is exactly one
                    of them. Clinics are not something this shop has ever sold, so
                    naming them here would be inventing a product line out of a
                    section heading. */}
                <h2 className="display" id="sevent-h">
                  Eenmalige
                  <br />
                  events
                </h2>
              </div>
            </Reveal>
            {events.map((p) => {
              const [cover] = productGallery(p).filter((s) => s.startsWith("/"));
              const gone = isSoldOut(p);
              return (
                <Reveal className="sevent" key={p.slug}>
                  <div className="sevent__media">
                    {cover ? <Image src={cover} alt={p.name} fill sizes={EVENT_SIZES} /> : null}
                    {gone ? <span className="sprod__out">Uitverkocht</span> : null}
                  </div>
                  <div className="sevent__b">
                    <h3 className="display sevent__n">{p.name}</h3>
                    {/*
                      Not the harvested `short_description`: that paragraph ends in
                      "koop nu je deelnemers-ticket", and this event is sold out, so
                      printing it would put a buy exhortation on a thing nobody can
                      buy. The two facts kept are from the same sentence of his copy.
                    */}
                    <p className="sevent__d">
                      In samenwerking met Buitenlandsche Zaken, op RacketSport Schiedam.
                    </p>
                    <p className="sevent__p">
                      {hasPrice(p) ? fmtPrice(p.price_eur) : "Zie webshop"}
                    </p>
                    {/*
                      A sold-out event gets no buy affordance — not here, not on its
                      own page, not in a sticky bar. This link goes to the product
                      page, which says in words that there is nothing to order.
                    */}
                    <Link className="btn" href={`/shop/${p.slug}`}>
                      {gone ? "Bekijk het event" : "Bekijk en boek"}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---- 8. QUOTE ------------------------------------------------------ */}
      <section className="squote">
        <div className="wrap">
          <figure className="squote__fig">
            <span className="eyebrow squote__k">Filosofie</span>
            <blockquote className="squote__q">
              <p>{SHOP_LINE}</p>
            </blockquote>
            <figcaption className="squote__by">Jesse Caron — Origami™</figcaption>
          </figure>
        </div>
      </section>

      <ShopStyles />
    </>
  );
}

/** Clip on a word boundary, and add the ellipsis only when something was cut. */
function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > 0 ? cut.slice(0, at) : cut).replace(/[.,;:]$/, "")}…`;
}

function ShopStyles() {
  return (
    <style>{`
      /* The product card, exactly as the merch band draws it, and the trust blocks
         exactly as the product page draws them. Both arrive as strings so there is
         one source of truth per object and no second copy to drift. */
      ${SHOPGRID_CSS}
      ${SHOPTRUST_CSS}

      /* ---- 1. hero ------------------------------------------------------- */
      /* Not 100vh. The home hero fills the viewport because it is the front door;
         this one stops short so the mosaic below is already peeking, which is half
         of what the scroll cue is telling you. */
      .shero { position:relative; min-height:clamp(560px,82vh,820px); display:flex; align-items:flex-end; overflow:hidden; border-bottom:1px solid var(--line-d); }
      .shero__bg { position:absolute; inset:0; z-index:0; overflow:hidden; }
      /* object-position only bites where the band is WIDER than the photograph's
         2.18:1 — i.e. above about 1300px, where cover crops the height and 32%
         keeps the head and torso in frame instead of centring on the legs. Narrower
         than that the height already fits and only the middle ~30% of the width
         survives, which is the athlete: there is no crop to tune on a phone, so
         there is deliberately no mobile override here. */
      .shero__bg img { width:100%; height:100%; object-fit:cover; object-position:50% 32%; filter:grayscale(.2) contrast(1.06) brightness(.72); }
      .shero__bg::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.5) 0%,rgba(14,14,16,.18) 32%,rgba(14,14,16,.92) 100%); }
      /* padding-bottom clears the scroll cue, which is absolutely positioned at the
         bottom centre of the section and must never land on the copy. */
      /* padding-bottom is the cue's own stack — 24 bottom + 54 rail + 10 gap + the
         label — plus air, so it can never land on the fact row. */
      .shero__inner { position:relative; z-index:2; width:100%; padding-top:132px; padding-bottom:126px; }
      .shero__kicker { display:flex; gap:18px; align-items:center; margin-bottom:24px; flex-wrap:wrap; }
      .shero__tick { width:34px; height:1px; background:var(--blue); }
      .shero__eyebrow { color:var(--paper); text-shadow:0 1px 14px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.6); }
      .shero__h1 { font-size:clamp(52px,10vw,138px); max-width:12ch; }
      .shero__row { display:flex; justify-content:space-between; align-items:flex-end; gap:30px; margin-top:30px; flex-wrap:wrap; }
      .shero__sub { max-width:40ch; color:var(--text-muted); font-size:16px; }
      .shero__actions { display:flex; gap:14px; flex-wrap:wrap; }

      .shero__facts { list-style:none; margin:36px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      /* Flex children, not grid, but the same rule applies: min-width:0, or the
         longest label ("Kleding & Materiaal") sets the floor for the whole row and
         the row sets the floor for the page. */
      .shero__fact { min-width:0; flex:1 1 190px; background:rgba(14,14,16,.62); }
      .shero__fact a { display:flex; align-items:baseline; gap:12px; padding:15px 20px; transition:background var(--card-t); }
      .shero__fact a:hover, .shero__fact a:focus-visible { background:var(--blue); }
      .shero__factn { font-family:var(--font-anton),sans-serif; font-size:26px; line-height:1; color:var(--blue); transition:color var(--card-t); }
      .shero__fact a:hover .shero__factn, .shero__fact a:focus-visible .shero__factn { color:#fff; }
      .shero__factl { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-muted); min-width:0; overflow-wrap:anywhere; }

      .shero__cue { position:absolute; left:50%; bottom:24px; transform:translateX(-50%); z-index:3; display:flex; flex-direction:column; align-items:center; gap:10px; }
      .shero__cuelabel { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.3em; text-transform:uppercase; color:var(--text-muted); transition:color .25s; }
      .shero__cuerail { display:block; position:relative; width:1px; height:54px; background:var(--line-d); overflow:hidden; }
      .shero__cuedot { position:absolute; left:-1px; top:0; width:3px; height:14px; background:var(--blue); animation:cueFall 2.1s cubic-bezier(.5,0,.5,1) infinite; }
      .shero__cue:hover .shero__cuelabel, .shero__cue:focus-visible .shero__cuelabel { color:var(--blue); }
      @keyframes cueFall { 0%{ transform:translateY(-16px); opacity:0; } 25%{ opacity:1; } 75%{ opacity:1; } 100%{ transform:translateY(54px); opacity:0; } }

      /* ---- 2. uit de collectie ------------------------------------------- */
      .scoll { padding:104px 0 0; }
      .scoll__head { display:flex; justify-content:space-between; align-items:flex-end; gap:28px; flex-wrap:wrap; margin-bottom:44px; }
      .scoll__head > * { min-width:0; }
      .scoll__h { font-size:clamp(30px,4.4vw,62px); max-width:16ch; margin-top:12px; }
      .scoll__p { max-width:34ch; color:var(--text-dim); font-size:15px; }
      /* One slide in view, scrolled left to right. The slide is 82% of the viewport
         so the next one always peeks in at the right edge — that sliver is the only
         honest affordance a scroll rail has, and without it people do not know there
         is more. Padding on both ends lets the first and last slide still centre. */
      .scoll__rail { list-style:none; margin:0; padding:0 0 4px; display:flex; gap:1px;
        overflow-x:auto; scroll-snap-type:x mandatory; overscroll-behavior-x:contain;
        border-top:1px solid var(--line-d); border-bottom:1px solid var(--line-d);
        background:var(--line-d); scrollbar-width:none; }
      .scoll__rail::-webkit-scrollbar { display:none; }
      .scoll__rail:focus-visible { outline:2px solid var(--blue); outline-offset:-2px; }
      .scoll__slide { min-width:0; flex:0 0 82%; scroll-snap-align:center; }
      @media(min-width:1000px){ .scoll__slide { flex:0 0 46%; } }
      @media(max-width:640px){ .scoll__slide { flex:0 0 88%; } }
      .scoll__l { display:block; background:var(--ink); }
      .scoll__frame { position:relative; display:block; aspect-ratio:4/3; overflow:hidden; background:#fff; }
      .scoll__frame img { width:100%; height:100%; object-fit:cover; filter:grayscale(.35) brightness(.95); transition:filter .5s, transform .5s; }
      .scoll__l:hover .scoll__frame img, .scoll__l:focus-visible .scoll__frame img { filter:none; transform:scale(1.04); }
      .scoll__frame::after { content:""; position:absolute; inset:0; box-shadow:inset 0 0 0 0 var(--blue); transition:box-shadow var(--card-t); }
      .scoll__l:hover .scoll__frame::after, .scoll__l:focus-visible .scoll__frame::after { box-shadow:inset 0 0 0 2px var(--blue); }
      .scoll__out { position:absolute; left:0; bottom:0; z-index:1; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; background:var(--ink); color:var(--paper); padding:5px 9px; }
      .scoll__cap { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:baseline; padding:14px 16px 16px; }
      .scoll__cap > * { min-width:0; }
      .scoll__no { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; color:var(--ash); }
      .scoll__n { font-size:14px; font-weight:600; line-height:1.3; color:var(--paper); overflow-wrap:anywhere; }
      /* .price, not raw --blue: see the token comment in globals.css — brand blue at
         mono 400 is optically thin at this size and the price is the one number on
         the tile somebody actually needs to read. */
      .scoll__p { font-family:var(--font-jetbrains),monospace; font-size:14px; font-weight:600; color:var(--blue-bright); white-space:nowrap; }

      /* ---- band furniture ------------------------------------------------ */
      .sband__note { max-width:32ch; color:var(--text-dim); font-size:13.5px; font-family:var(--font-jetbrains),monospace; letter-spacing:.02em; line-height:1.8; }

      /* ---- 4. trust ------------------------------------------------------ */
      .strust { padding:96px 0; background:var(--ink-2); border-top:1px solid var(--line-d); border-bottom:1px solid var(--line-d); }
      .strust__grid { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:56px; align-items:start; }
      .strust__col { min-width:0; }
      .strust__h { font-size:clamp(26px,3.4vw,46px); margin-bottom:34px; }
      /* .ptrust brings its own ink-2 ground, which is this band's ground too, so on
         /shop the box takes the darker one and the hairline border keeps the edge. */
      .strust .ptrust--wide { background:var(--ink); }

      /* ---- 5. in het detail ---------------------------------------------- */
      .sdet { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      .sdet__i { min-width:0; display:flex; flex-direction:column; background:var(--ink); transition:transform var(--card-t), box-shadow var(--card-t); }
      .sdet__i:hover, .sdet__i:focus-visible { transform:translateY(var(--card-lift)); box-shadow:inset 0 0 0 1px var(--blue); z-index:1; }
      .sdet__img { position:relative; display:block; aspect-ratio:4/5; overflow:hidden; background:#fff; }
      .sdet__img img { width:100%; height:100%; object-fit:cover; transition:transform .6s; }
      .sdet__i:hover .sdet__img img, .sdet__i:focus-visible .sdet__img img { transform:scale(1.04); }
      .sdet__b { display:flex; flex-direction:column; gap:8px; padding:24px 26px 28px; min-width:0; }
      .sdet__k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.2em; text-transform:uppercase; font-weight:600; color:var(--blue-bright); }
      .sdet__n { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:24px; line-height:1; letter-spacing:.01em; min-width:0; overflow-wrap:anywhere; }
      .sdet__go { margin-top:6px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--paper); display:inline-flex; gap:8px; align-items:center; }
      .sdet__go .ar { color:var(--blue); transition:transform .3s; }
      .sdet__i:hover .sdet__go .ar, .sdet__i:focus-visible .sdet__go .ar { transform:translateX(5px); }

      /* ---- 6. online training -------------------------------------------- */
      .sonline { padding:108px 0; background:var(--ink-2); border-top:1px solid var(--line-d); border-bottom:1px solid var(--line-d); }
      .sbooks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; }
      .sbook { min-width:0; display:flex; flex-direction:column; background:var(--ink); border:1px solid var(--line-d); transition:transform var(--card-t), border-color var(--card-t); }
      .sbook:hover, .sbook:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
      .sbook__img { position:relative; display:block; aspect-ratio:16/10; overflow:hidden; background:#fff; }
      .sbook__img img { width:100%; height:100%; object-fit:cover; transition:transform .5s; }
      .sbook:hover .sbook__img img, .sbook:focus-visible .sbook__img img { transform:scale(1.03); }
      .sbook__k { position:absolute; top:10px; left:10px; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; background:var(--blue); color:#fff; padding:4px 8px; }
      .sbook__b { display:flex; flex-direction:column; gap:12px; padding:22px 24px 26px; min-width:0; flex:1; }
      .sbook__top { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap; min-width:0; }
      .sbook__n { font-size:17px; font-weight:700; line-height:1.25; min-width:0; overflow-wrap:anywhere; }
      .sbook__p { font-family:var(--font-jetbrains),monospace; font-size:15px; font-weight:600; color:var(--blue-bright); white-space:nowrap; }
      .sbook__d { font-size:14px; line-height:1.6; color:var(--text-dim); }

      /* ---- 7. event ------------------------------------------------------ */
      .sevent { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:44px; align-items:center; border:1px solid var(--line-d); padding:1px; }
      .sevent > * { min-width:0; }
      .sevent__media { position:relative; aspect-ratio:3/2; overflow:hidden; background:#fff; }
      .sevent__media img { width:100%; height:100%; object-fit:cover; filter:grayscale(.35) brightness(.92); }
      .sevent__b { padding:8px 40px 8px 0; display:flex; flex-direction:column; align-items:flex-start; gap:16px; }
      .sevent__n { font-size:clamp(24px,3vw,40px); }
      .sevent__d { color:var(--text-muted); font-size:15.5px; max-width:40ch; }
      .sevent__p { font-family:var(--font-jetbrains),monospace; font-size:20px; font-weight:600; color:var(--blue-bright); }

      /* ---- 8. quote ------------------------------------------------------ */
      /* Deliberately not the home page's .mani band: that one is full-bleed brand
         blue at 86px, and this is the "small quote" the brief asked for. Same
         family, a third of the volume, and it carries an attribution the manifesto
         band does not need — because a line on a shop page with no attribution is
         exactly what a fabricated review looks like. */
      .squote { padding:104px 0 112px; border-top:1px solid var(--line-d); }
      /* 660px, not a ch measure: max-width resolves ch against the INHERITED font,
         which on the figure is Inter, while the line inside it is set in Anton. 24ch
         of Inter measured ~200px and broke the line into five words on five rows. */
      .squote__fig { margin:0; max-width:660px; border-left:2px solid var(--blue); padding-left:clamp(20px,3vw,38px); }
      .squote__k { display:block; margin-bottom:18px; }
      .squote__q { margin:0; }
      .squote__q p { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:clamp(26px,3.6vw,46px); line-height:1.02; letter-spacing:.01em; }
      .squote__by { margin-top:20px; font-family:var(--font-jetbrains),monospace; font-size:11.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--ash); }

      /* ---- responsive ---------------------------------------------------- */
      @media(max-width:1000px){
        .scoll__grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
        .strust__grid { grid-template-columns:minmax(0,1fr); gap:40px; }
      }
      @media(max-width:860px){
        .sevent { grid-template-columns:minmax(0,1fr); gap:0; }
        .sevent__b { padding:28px 26px 30px; }
      }
      @media(max-width:760px){
        .sdet { grid-template-columns:minmax(0,1fr); }
        .sdet__img { aspect-ratio:3/2; }
        .sbooks { grid-template-columns:minmax(0,1fr); }
      }
      @media(max-width:640px){
        .shero { min-height:clamp(520px,78vh,700px); }
        .shero__inner { padding-top:112px; padding-bottom:120px; }
        .shero__h1 { font-size:clamp(44px,13vw,72px); }
        /* Three fact chips at 390px would be ~118px each and "Kleding & Materiaal"
           wraps to four lines in a 11px mono. One per row instead. */
        .shero__fact { flex:1 1 100%; }
        .scoll { padding-top:76px; }
        .scoll__grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        .strust, .sonline { padding:76px 0; }
        .squote { padding:80px 0 88px; }
        .squote__fig { max-width:none; }
      }
      @media(prefers-reduced-motion:reduce){
        .shero__cuedot { animation:none; transform:none; }
      }
    `}</style>
  );
}
