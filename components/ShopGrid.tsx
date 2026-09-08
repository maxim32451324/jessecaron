"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtPrice, hasPrice, isOnSale, isSoldOut, localImg, type Product } from "@/lib/content";

const TABS: { key: "all" | Product["category"]; label: string }[] = [
  { key: "all", label: "Alles" },
  { key: "merch", label: "Kleding & Materiaal" },
  { key: "ebook", label: "Online Training" },
  { key: "event", label: "Events" },
];

export default function ShopGrid({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<"all" | Product["category"]>("all");
  const shown = tab === "all" ? products : products.filter((p) => p.category === tab);

  return (
    <>
      <div className="shop-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`shop-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sgrid">
        {shown.map((p) => (
          <Link className="sprod" href={`/shop/${p.slug}`} key={p.slug}>
            <div className="sprod__img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localImg(p.image)} alt={p.name} loading="lazy" />
              {p.category === "ebook" ? <span className="sprod__badge">E-book</span> : null}
              {p.category === "event" ? <span className="sprod__badge">Event</span> : null}
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

      <style>{`
        .shop-tabs { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:40px; }
        .shop-tab { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; padding:10px 18px; border:1px solid var(--line-d); background:transparent; color:var(--ash); cursor:pointer; transition:.2s; }
        .shop-tab:hover, .shop-tab:focus-visible { color:var(--blue); border-color:var(--blue); }
        .shop-tab.active { background:var(--blue); border-color:var(--blue); color:#fff; }
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
        .sprod__p { font-family:var(--font-jetbrains),monospace; font-size:14px; color:var(--blue); white-space:nowrap; }
        .sprod__was { color:var(--ash); margin-right:7px; font-size:12px; }
        @media(max-width:1000px){ .sgrid{ grid-template-columns:repeat(3,1fr);} }
        @media(max-width:760px){ .sgrid{ grid-template-columns:repeat(2,1fr); gap:14px; } }
        /* Below this the two columns are ~150px wide: a name and a two-part sale price
           cannot share a row, so the price drops onto its own line. */
        @media(max-width:560px){
          .sprod__b { flex-direction:column; align-items:flex-start; padding:13px; }
          .sprod__p { font-size:13.5px; }
        }
      `}</style>
    </>
  );
}
