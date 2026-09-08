import Image from "next/image";
import Link from "next/link";
import { fmtPrice, hasPrice, isOnSale, isSoldOut, localImg, type Product } from "@/lib/content";

/**
 * The product grid — the card, and nothing else.
 *
 * WHY THE TAB FILTER IS GONE. This component used to own a client-side tab bar
 * (Alles / Kleding & Materiaal / Online Training / Events) above the grid, because
 * /shop was one flat grid of all 38 products and the tabs were the only way to get
 * at a category. /shop is now grouped into a band per category, each with its own
 * heading and its own anchor, so the tabs and the bands were two controls doing the
 * same job — and the tabs were the worse of the two: they hid content behind a click,
 * they had no URL to link or share, and "Alles" put the four e-books back in among
 * the shirts, which is the flat grid the client asked us to break up.
 *
 * Losing them also loses the only reason this file was a client component. There is
 * no `useState` here any more, so the grid renders on the server and /shop ships no
 * JavaScript for it.
 *
 * The card itself is unchanged and is still the one object this site uses for a
 * product, so it stays a component rather than being inlined into the page: /shop
 * draws it three times (merch, e-books, events) and each band must show the same
 * card, with the same sold-out rule.
 */

/**
 * `.sgrid` is four tracks in the 1224px column (291px each after the 20px gaps),
 * three below 1000px, two below 760px. The product photographs are the heaviest
 * files on the site — a 2000px shirt shot into a 291px tile was most of what the
 * shop page weighed.
 */
export const SPROD_SIZES =
  "(max-width: 760px) calc((100vw - 70px) / 2), (max-width: 1000px) calc((100vw - 96px) / 3), 291px";

/**
 * The CSS travels with the component as a string, the same way `POSTCARD_CSS` does:
 * this site keeps its route CSS in one inline `<style>` per route, and /shop renders
 * three grids — a `<style>` inside the component would be emitted three times.
 */
export const SHOPGRID_CSS = `
  .sgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
  /* min-width:0 — a grid item defaults to min-width:auto, so it refuses to shrink
     below its content. With a nowrap price and an unbreakable product name in the
     row below, the two 1fr tracks blew out past the viewport and took the whole
     page into horizontal scroll on a phone. */
  .sprod { background:var(--ink-2); border:1px solid var(--line-d); transition:transform var(--card-t), border-color var(--card-t); display:block; min-width:0; }
  .sprod:hover, .sprod:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
  .sprod__img { position:relative; aspect-ratio:1; overflow:hidden; background:#fff; }
  .sprod__img img { width:100%; height:100%; object-fit:cover; transition:.5s; }
  .sprod:hover .sprod__img img, .sprod:focus-visible .sprod__img img { transform:scale(1.04); }
  .sprod__badge { position:absolute; top:10px; left:10px; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; background:var(--blue); color:#fff; padding:4px 8px; }
  .sprod__out { position:absolute; left:0; bottom:0; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; background:var(--ink); color:var(--paper); padding:5px 9px; }
  .sprod__b { padding:16px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:6px 10px; }
  /* Product names include unbreakable runs like "Stroboscoop-Bril"; without this a
     single long word sets the card's floor width. */
  .sprod__n { font-size:13.5px; font-weight:600; line-height:1.3; min-width:0; overflow-wrap:anywhere; }
  .sprod__p { font-family:var(--font-jetbrains),monospace; font-size:14px; font-weight:600; color:var(--blue-bright); white-space:nowrap; }
  .sprod__was { color:var(--ash); margin-right:7px; font-size:12px; }
  @media(max-width:1000px){ .sgrid{ grid-template-columns:repeat(3,1fr);} }
  @media(max-width:760px){ .sgrid{ grid-template-columns:repeat(2,1fr); gap:14px; } }
  /* Below this the two columns are ~150px wide: a name and a two-part sale price
     cannot share a row, so the price drops onto its own line. */
  @media(max-width:560px){
    .sprod__b { flex-direction:column; align-items:flex-start; padding:13px; }
    .sprod__p { font-size:13.5px; }
  }
`;

export default function ShopGrid({
  products,
  /**
   * The category badge on the tile. It was worth printing when all 38 products sat
   * in one undifferentiated grid; inside a band already headed "Online Training" it
   * is the heading repeated four times, so the bands turn it off.
   */
  badges = true,
}: {
  products: Product[];
  badges?: boolean;
}) {
  return (
    <div className="sgrid">
      {products.map((p) => (
        <Link className="sprod" href={`/shop/${p.slug}`} key={p.slug}>
          <div className="sprod__img">
            {/* `fill` inside the square: .sprod__img is already position:relative and
                aspect-ratio:1, so the box is reserved before the bytes land and the
                grid cannot jump as the row fills in. */}
            <Image src={localImg(p.image)} alt={p.name} fill sizes={SPROD_SIZES} />
            {badges && p.category === "ebook" ? <span className="sprod__badge">E-book</span> : null}
            {badges && p.category === "event" ? <span className="sprod__badge">Event</span> : null}
            {/* The harvest brought per-variation stock with it, so the grid can be
                honest about what is gone before anybody opens the product. */}
            {isSoldOut(p) ? <span className="sprod__out">Uitverkocht</span> : null}
          </div>
          <div className="sprod__b">
            <span className="sprod__n">{p.name}</span>
            <span className="sprod__p">
              {isOnSale(p) && p.regular_price_eur ? (
                <s className="sprod__was">{fmtPrice(p.regular_price_eur)}</s>
              ) : null}
              {hasPrice(p) ? fmtPrice(p.price_eur) : "Zie webshop"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
