import Link from "next/link";
import PaymentMarks from "@/components/PaymentMarks";

/**
 * The reassurance block, in one place.
 *
 * It was written on the product page and it stays true there, but /shop asks for
 * the same four promises and the same payment strip a section above the grid. Two
 * copies of a block whose whole job is to be *exactly* what the business has put
 * in writing is the one duplication on this site that can turn into a lie: edit
 * the withdrawal period on one page, forget the other, and the shop now publishes
 * two different return policies. So the content, the glyphs and the CSS live here
 * and both routes render this file.
 *
 * NOTHING in here is a shop-page cliché. There is no free-delivery threshold (this
 * business publishes none), no money-back promise beyond the statutory withdrawal
 * right, and no padlock or "secure checkout" badge, because the basket, the payment
 * and the stock all live on the old webshop — a security claim about a checkout this
 * site does not run would be the one dishonest line on the page. Every sentence is
 * sourced in the comment above it.
 */

/**
 * The guarantees, and where each one comes from.
 *
 * Four lines, every one of them a promise this business has already put in
 * writing — `content/pages/voorwaarden.md` or the shipping paragraph the product
 * copy carries.
 */
export const GUARANTEES: { glyph: React.ReactElement; head: string; sub: string }[] = [
  {
    // voorwaarden.md § Herroepingsrecht — "de mogelijkheid de overeenkomst
    // zonder opgave van redenen te ontbinden gedurende 14 dagen", and "komen
    // ten hoogste de kosten van terugzending voor zijn rekening".
    glyph: (
      <>
        <path d="M3 5.4h6.4a3.3 3.3 0 0 1 0 6.6H5.2" />
        <path d="M5.8 2.6 3 5.4l2.8 2.8" />
      </>
    ),
    head: "14 dagen bedenktijd",
    sub: "Retourzending voor eigen rekening",
  },
  {
    // voorwaarden.md § Garantie — "De garantietermijn van de ondernemer komt
    // overeen met de fabrieksgarantietermijn", and defects reported "binnen 14
    // dagen na levering".
    glyph: (
      <>
        <path d="M8 1.7 2.7 3.8v3.9c0 3.3 2.2 5.5 5.3 6.6 3.1-1.1 5.3-3.3 5.3-6.6V3.8L8 1.7Z" />
        <path d="M5.9 7.9 7.4 9.4l2.9-2.9" />
      </>
    ),
    head: "Fabrieksgarantie",
    sub: "Gebreken binnen 14 dagen melden",
  },
  {
    // Product copy, on 29 of the 38 products — "estimated up to 5 business days
    // by Post NL".
    glyph: (
      <>
        <path d="M1.4 3.9h7.3v6.9H1.4z" />
        <path d="M8.7 6.4h2.8l2.1 2.2v2.2H8.7z" />
        <circle cx="4.4" cy="12.3" r="1.4" />
        <circle cx="11.2" cy="12.3" r="1.4" />
      </>
    ),
    head: "Verzending met PostNL",
    sub: "Doorgaans binnen 5 werkdagen",
  },
  {
    // voorwaarden.md § Feedback & Klachten — "Ingediende klachten worden binnen
    // een termijn van 14 dagen gerekend vanaf de datum van ontvangst beantwoord."
    glyph: (
      <>
        <path d="M1.9 3.1h12.2v7.5H8.3l-3.2 2.9v-2.9H1.9z" />
        <path d="M4.8 5.9h6.4M4.8 8h4" />
      </>
    ),
    head: "Antwoord binnen 14 dagen",
    sub: "Op elke ingediende klacht",
  },
];

/**
 * The four promises as a list. `className` is the only thing the two hosts differ
 * on, and only over spacing: the product page takes the default in its 520px
 * column, /shop passes `pguar--wide` for the same two tracks with more air.
 */
export function Guarantees({ className = "" }: { className?: string }) {
  return (
    <ul className={`pguar ${className}`.trim()} role="list">
      {GUARANTEES.map((g) => (
        <li className="pguar__i" key={g.head}>
          <svg
            className="pguar__g"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            focusable="false"
          >
            {g.glyph}
          </svg>
          <span className="pguar__t">
            <span className="pguar__h">{g.head}</span>
            <span className="pguar__s">{g.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Payment methods, delivery area and the statutory delivery term.
 *
 * The methods and the PostNL/Netherlands-only terms are stated in the product copy
 * on 29 of the 38 products; the 30-day delivery term and the withdrawal right are
 * `content/pages/voorwaarden.md`, which the block links to rather than paraphrases.
 *
 * It says "op jessecaron.com" rather than "hier" because the order is completed on
 * the webshop. The strip carries five marks; bankoverschrijving is a sixth method
 * the copy lists but has no logo of its own, so it is a sentence underneath rather
 * than a chip pretending to be a brand.
 *
 * `headingId` exists because two of these can never share a page but the heading is
 * still the accessible name of the section — the caller owns the id so it stays
 * unique wherever the block is dropped.
 */
export function CheckoutTrust({
  className = "",
  headingId = "ptrust-h",
}: {
  className?: string;
  headingId?: string;
}) {
  return (
    <section className={`ptrust ${className}`.trim()} aria-labelledby={headingId}>
      <h2 className="ptrust__h" id={headingId}>
        Veilig afrekenen op jessecaron.com
      </h2>
      <PaymentMarks />
      <ul className="ptrust__list" role="list">
        <li>Betalen kan ook per bankoverschrijving</li>
        <li>Alleen bezorging in Nederland — daarbuiten eerst even mailen</li>
        <li>Ophalen bij je personal of groepstraining kan ook</li>
        <li>
          Levering wettelijk uiterlijk binnen 30 dagen —{" "}
          <Link href="/voorwaarden">lees de voorwaarden</Link>
        </li>
      </ul>
    </section>
  );
}

/**
 * The CSS travels with the component as a string, the same way `POSTCARD_CSS`
 * does, because this site keeps its route CSS in one inline `<style>` per route.
 * Every route that renders `Guarantees` or `CheckoutTrust` embeds this once.
 *
 * `.ppay` is in here too: `PaymentMarks` ships no CSS of its own, and it is only
 * ever rendered inside `CheckoutTrust`.
 */
export const SHOPTRUST_CSS = `
  /* Guarantees. Two columns so four short promises read as a block rather than a
     list to work through. */
  .pguar { list-style:none; margin:22px 0 0; padding:0;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px 18px; }
  /* min-width:0 on every grid child. The default min-width:auto refuses to shrink
     below the widest unbreakable word — "Retourzending" and "Fabrieksgarantie" both
     set a floor wider than a 150px track — and that is how five layout faults on
     this site began. */
  .pguar__i { display:flex; align-items:flex-start; gap:10px; min-width:0; }
  .pguar__g { flex:0 0 auto; margin-top:1px; color:var(--blue); }
  .pguar__t { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .pguar__h { font-size:13px; font-weight:600; line-height:1.35; color:var(--paper); }
  .pguar__s { font-size:11.5px; line-height:1.4; color:var(--text-dim); }
  /* The wide variant keeps two tracks and spends the extra room on the gaps. Four
     across was tried first and, in /shop's 620px left column, gave each promise a
     ~140px track: every one of the four heads wrapped ("14 dagen / bedenktijd"),
     which is worse than the two-column version it was meant to improve on. */
  .pguar--wide { margin-top:0; gap:26px 40px; }

  .ptrust { margin:30px 0 0; padding:20px; border:1px solid var(--line-d); background:var(--ink-2); }
  .ptrust__h { font-family:var(--font-jetbrains),monospace; font-size:11px; font-weight:600;
    letter-spacing:.16em; text-transform:uppercase; color:var(--paper); margin:0 0 14px; }
  .ptrust--wide { margin-top:0; padding:26px; }

  /* The marks are coloured artwork on a near-black page, so each one gets a light
     chip to sit on — the same ground a real checkout gives them. */
  .ppay { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 14px; padding:0; list-style:none; }
  .ppay__item { display:flex; }
  .ppay__mark { display:inline-flex; padding:3px;
    background:#f7f7f5; border:1px solid rgba(0,0,0,.12); }
  .ppay__mark svg { display:block; width:38px; height:24px; }
  .ppay__vh { position:absolute; width:1px; height:1px; overflow:hidden;
    clip-path:inset(50%); white-space:nowrap; }

  .ptrust__list { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px; }
  .ptrust__list li { font-size:13.5px; line-height:1.5; color:var(--text-muted); padding-left:16px; position:relative; }
  .ptrust__list li::before { content:""; position:absolute; left:0; top:.62em; width:6px; height:1px; background:var(--blue); }
  .ptrust__list a { color:var(--blue); text-decoration:underline; text-underline-offset:2px; }

  @media(max-width:860px){
    .pguar--wide { gap:18px 22px; }
  }
  /* Below this a two-column guarantee row is ~150px per track and the heads wrap
     to three lines each, so they stack instead. */
  @media(max-width:400px){
    .pguar, .pguar--wide { grid-template-columns:minmax(0,1fr); gap:12px; }
  }
`;
