"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtPrice, localImg, type Product } from "@/lib/content";

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
            </div>
            <div className="sprod__b">
              <span className="sprod__n">{p.name}</span>
              <span className="sprod__p">{fmtPrice(p.price_eur)}</span>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .shop-tabs { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:40px; }
        .shop-tab { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; padding:10px 18px; border:1px solid var(--line-d); background:transparent; color:var(--ash); cursor:pointer; transition:.2s; }
        .shop-tab:hover { color:var(--paper); border-color:var(--paper); }
        .shop-tab.active { background:var(--blue); border-color:var(--blue); color:#fff; }
        .sgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        .sprod { background:var(--ink-2); border:1px solid var(--line-d); transition:.3s; display:block; }
        .sprod:hover { transform:translateY(-5px); border-color:var(--blue); }
        .sprod__img { position:relative; aspect-ratio:1; overflow:hidden; background:#fff; }
        .sprod__img img { width:100%; height:100%; object-fit:cover; transition:.5s; }
        .sprod:hover .sprod__img img { transform:scale(1.05); }
        .sprod__badge { position:absolute; top:10px; left:10px; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; background:var(--blue); color:#fff; padding:4px 8px; }
        .sprod__b { padding:16px; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .sprod__n { font-size:13.5px; font-weight:600; line-height:1.3; }
        .sprod__p { font-family:var(--font-jetbrains),monospace; font-size:14px; color:var(--blue); white-space:nowrap; }
        @media(max-width:1000px){ .sgrid{ grid-template-columns:repeat(3,1fr);} }
        @media(max-width:760px){ .sgrid{ grid-template-columns:repeat(2,1fr);} }
      `}</style>
    </>
  );
}
