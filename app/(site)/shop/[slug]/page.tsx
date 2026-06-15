import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Markdown from "@/components/Markdown";
import { getProduct, getProducts, fmtPrice, localImg } from "@/lib/content";
import { getProductBody } from "@/lib/content.server";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return { title: p.name };
}

const CAT_LABEL: Record<string, string> = {
  merch: "Kleding & Materiaal",
  ebook: "Online Training",
  event: "Event",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const body = getProductBody(slug);

  return (
    <section style={{ paddingTop: 120 }}>
      <div className="wrap pdp">
        <div className="pdp__img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={localImg(p.image)} alt={p.name} />
        </div>
        <div className="pdp__info">
          <span className="eyebrow">{CAT_LABEL[p.category] ?? p.category}</span>
          <h1 className="display" style={{ fontSize: "clamp(30px,4.5vw,56px)", margin: "12px 0 16px" }}>
            {p.name}
          </h1>
          <div className="pdp__price">{fmtPrice(p.price_eur)}</div>
          <a href={p.url} target="_blank" rel="noopener" className="btn btn--blue" style={{ marginTop: 24 }}>
            Bestel via webshop ↗
          </a>
          {body ? <Markdown>{body}</Markdown> : null}
          <div style={{ marginTop: 40 }}>
            <Link href="/shop" className="btn">
              ← Terug naar shop
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        .pdp { display:grid; grid-template-columns:1fr 1fr; gap:56px; padding-bottom:96px; align-items:start; }
        .pdp__img { background:#fff; border:1px solid var(--line-d); position:sticky; top:100px; }
        .pdp__img img { width:100%; aspect-ratio:1; object-fit:cover; }
        .pdp__price { font-family:var(--font-jetbrains),monospace; font-size:26px; color:var(--blue); }
        .pdp__info .prose { margin-top:32px; }
        @media(max-width:860px){ .pdp{ grid-template-columns:1fr; gap:28px; } .pdp__img{ position:static; } }
      `}</style>
    </section>
  );
}
