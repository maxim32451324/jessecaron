import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Markdown from "@/components/Markdown";
import ProductGallery from "@/components/ProductGallery";
import ProductOptions from "@/components/ProductOptions";
import {
  categoryLabel,
  fmtPrice,
  getProduct,
  getProducts,
  hasPrice,
  isOnSale,
  isSoldOut,
  localImg,
  productAttributes,
  productGallery,
  productOptions,
  relatedProducts,
} from "@/lib/content";
import { getProductBodyAfterLead } from "@/lib/content.server";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

/** next/image can only serve what is on disk here; a stray remote URL falls back to <img>. */
function localOnly(paths: string[]): string[] {
  return paths.filter((s) => s.startsWith("/"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const [cover] = productGallery(p);
  return {
    title: p.name,
    description: p.short_description,
    openGraph: cover ? { images: [{ url: cover, alt: p.name }] } : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const gallery = localOnly(productGallery(p));
  const run = productOptions(p);
  const soldOut = isSoldOut(p);
  const onSale = isOnSale(p);
  const attributes = productAttributes(p);
  const body = getProductBodyAfterLead(slug, p.short_description);
  const related = relatedProducts(slug, 4);

  // Every row is harvested, so the grid only exists when there is something true
  // to put in it.
  const facts: [string, string][] = [
    ["Categorie", categoryLabel(p)],
    ...(p.stock_text ? ([["Voorraad", p.stock_text]] as [string, string][]) : []),
    ...attributes,
  ];

  return (
    <>
      <section className="pdp-wrap">
        <div className="wrap">
          <nav className="pcrumb" aria-label="Kruimelpad">
            <ol className="pcrumb__list" role="list">
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li aria-current="page">{p.name}</li>
            </ol>
          </nav>

          <article className={`pdp ${gallery.length ? "" : "pdp--nomedia"}`}>
            <div className="pdp__media">
              {gallery.length ? (
                <ProductGallery images={gallery} name={p.name} id={p.slug} />
              ) : (
                <div className="pdp__mediafallback">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImg(p.image)} alt={p.name} />
                </div>
              )}
            </div>

            <div className="pdp__info">
              <p className="pdp__flags">
                <span className="eyebrow">{categoryLabel(p)}</span>
                {soldOut ? <span className="pdp__flag pdp__flag--out">Uitverkocht</span> : null}
                {onSale ? <span className="pdp__flag pdp__flag--sale">Aanbieding</span> : null}
              </p>

              <h1 className="display pdp__title">{p.name}</h1>

              {p.short_description ? <p className="pdp__lead">{p.short_description}</p> : null}

              <div className="pdp__pricebox">
                {hasPrice(p) ? (
                  <p className="pdp__price">
                    <span className="pdp__now">
                      {onSale ? <span className="pdp__sr">Nu </span> : null}
                      {fmtPrice(p.price_eur)}
                    </span>
                    {onSale && p.regular_price_eur ? (
                      <s className="pdp__was">
                        <span className="pdp__sr">Was </span>
                        {fmtPrice(p.regular_price_eur)}
                      </s>
                    ) : null}
                  </p>
                ) : (
                  // `sport-shirt-black-blue` came out of the harvest priced at 0.00.
                  // Printing "€0" would be a claim; the webshop settles it instead.
                  <p className="pdp__price pdp__price--unknown">
                    Prijs niet bekend — zie de webshop
                  </p>
                )}
                {hasPrice(p) ? (
                  <p className="pdp__pricenote">
                    Prijs zoals vermeld in de officiële webshop op jessecaron.com.
                  </p>
                ) : null}
              </div>

              <hr className="pdp__rule" />

              {run ? <ProductOptions run={run} id={p.slug} /> : null}

              <div className="pdp__buy">
                {soldOut ? (
                  <>
                    <p className="pdp__unavailable">
                      Dit artikel staat in de webshop als uitverkocht. Er valt hier niets te
                      bestellen.
                    </p>
                    <a className="btn" href={p.url} target="_blank" rel="noopener noreferrer">
                      Bekijk in de webshop ↗
                    </a>
                  </>
                ) : (
                  <a
                    className="btn btn--blue pdp__cta"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bestel via de webshop ↗
                  </a>
                )}
                <p className="pdp__note">
                  Bestellen verloopt via de officiële webshop. Deze pagina houdt geen voorraad aan
                  en verwerkt geen betalingen — je rondt de bestelling af op jessecaron.com
                  {run && !soldOut ? `, waar je ook je ${run.label.toLowerCase()} opgeeft` : ""}.
                </p>
              </div>

              {facts.length ? (
                <dl className="pdl" aria-label="Productgegevens">
                  {facts.map(([k, v]) => (
                    <div className="pdl__row" key={k}>
                      <dt className="pdl__k">{k}</dt>
                      <dd className="pdl__v">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {/*
                Checkout, delivery and returns — the reassurance block a shop page is expected
                to carry, at the moment somebody decides to buy.

                Every line here is a fact this business already publishes, and nothing else.
                Payment methods and the PostNL/Netherlands-only delivery terms are stated in
                the product copy on 29 of the 38 products; the 14-day withdrawal right, and
                that return postage is the customer's, are from `content/pages/voorwaarden.md`
                (§Herroepingsrecht) and link to it. No free-delivery threshold is claimed
                anywhere on this business's own material, so none is claimed here.

                It says "op jessecaron.com" rather than "hier" because the basket, the payment
                and the stock all live on the old webshop — promising a secure checkout on a
                page that cannot take a payment would be the one dishonest line on it.
              */}
              <section className="ptrust" aria-labelledby="ptrust-h">
                <h2 className="ptrust__h" id="ptrust-h">
                  Veilig afrekenen op jessecaron.com
                </h2>
                <ul className="ptrust__pay" role="list">
                  {["iDEAL", "Visa", "Mastercard", "American Express", "PayPal", "Bankoverschrijving"].map(
                    (m) => (
                      <li className="ptrust__chip" key={m}>
                        {m}
                      </li>
                    ),
                  )}
                </ul>
                <ul className="ptrust__list" role="list">
                  <li>Verzending met PostNL — doorgaans binnen 5 werkdagen</li>
                  <li>Alleen bezorging in Nederland — daarbuiten eerst even mailen</li>
                  <li>Ophalen bij je personal of groepstraining kan ook</li>
                  <li>
                    14 dagen bedenktijd —{" "}
                    <Link href="/voorwaarden">retourvoorwaarden</Link> (retourzending voor eigen
                    rekening)
                  </li>
                </ul>
              </section>
            </div>

            <div className="pdp__copy">
              {body ? (
                <>
                  <h2 className="pdp__h2">Productinformatie</h2>
                  <Markdown>{body}</Markdown>
                </>
              ) : null}
              <div className="pdp__back">
                <Link href="/shop" className="btn">
                  ← Terug naar shop
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {related.length ? (
        <section className="prel" aria-labelledby="prel-title">
          <div className="wrap">
            <h2 className="display prel__title" id="prel-title">
              Misschien ook iets voor jou
            </h2>
            <ul className="prel__rail" role="list">
              {related.map((r) => {
                const [cover] = localOnly(productGallery(r));
                return (
                  <li className="prel__item" key={r.slug}>
                    <Link className="prel__link" href={`/shop/${r.slug}`}>
                      <span className={`prel__well ${cover ? "" : "prel__well--empty"}`}>
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            sizes="(max-width:760px) 62vw, 300px"
                            className="prel__img"
                          />
                        ) : null}
                        {isSoldOut(r) ? <span className="prel__out">Uitverkocht</span> : null}
                      </span>
                      <span className="prel__meta">
                        <span className="prel__name">{r.name}</span>
                        <span className="prel__price">
                          {hasPrice(r) ? fmtPrice(r.price_eur) : "Zie webshop"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <style>{`
        .pdp-wrap { padding:132px 0 0; }
        .pcrumb { margin-bottom:28px; }
        .pcrumb__list { list-style:none; display:flex; flex-wrap:wrap; gap:10px; margin:0; padding:0; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ash); }
        .pcrumb__list li + li::before { content:"/"; margin-right:10px; color:var(--line-d); }
        .pcrumb__list a:hover, .pcrumb__list a:focus-visible { color:var(--blue); }
        .pcrumb__list [aria-current] { color:var(--text-dim); }

        /* Gallery and buy block side by side, body copy across the full width
           beneath. The photographs are landscape, so a media column that tried to
           span both rows would leave a hole under a short gallery. */
        .pdp { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,520px); grid-template-areas:"media info" "copy copy"; column-gap:56px; row-gap:56px; align-items:start; padding-bottom:24px; }
        .pdp--nomedia { grid-template-columns:minmax(0,1fr); grid-template-areas:"info" "copy"; }
        .pdp__media { grid-area:media; min-width:0; max-width:660px; align-self:start; }
        .pdp--nomedia .pdp__media { display:none; }
        .pdp__info { grid-area:info; min-width:0; }
        .pdp__copy { grid-area:copy; min-width:0; }
        .pdp__mediafallback { background:#fff; border:1px solid var(--line-d); aspect-ratio:3/2; }
        .pdp__mediafallback img { width:100%; height:100%; object-fit:contain; }

        .pdp__flags { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .pdp__flag { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; padding:4px 9px; border:1px solid currentColor; }
        .pdp__flag--out { color:var(--ash); }
        .pdp__flag--sale { color:#fff; background:var(--blue); border-color:var(--blue); }

        .pdp__title { font-size:clamp(30px,4.4vw,58px); margin:14px 0 0; }
        .pdp__lead { margin-top:18px; color:var(--text-muted); max-width:52ch; }

        .pdp__pricebox { margin-top:26px; }
        .pdp__price { font-family:var(--font-jetbrains),monospace; font-size:28px; display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
        .pdp__now { color:var(--blue); }
        .pdp__was { color:var(--ash); font-size:19px; text-decoration-thickness:1px; }
        .pdp__price--unknown { font-size:18px; color:var(--text-dim); }
        .pdp__pricenote { margin-top:8px; font-size:13px; color:var(--text-dim); }
        .pdp__sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }

        .pdp__rule { border:0; border-top:1px solid var(--line-d); margin:30px 0; }

        .pdp__buy { margin-top:28px; }
        .pdp__cta { width:100%; justify-content:center; }
        .pdp__unavailable { font-size:15px; color:var(--text-muted); margin-bottom:16px; }
        .pdp__note { margin-top:14px; font-size:13px; line-height:1.65; color:var(--text-dim); max-width:48ch; }

        .ptrust { margin:30px 0 0; padding:20px; border:1px solid var(--line-d); background:var(--ink-2); }
        .ptrust__h { font-family:var(--font-jetbrains),monospace; font-size:11px; font-weight:600;
          letter-spacing:.16em; text-transform:uppercase; color:var(--paper); margin:0 0 14px; }
        .ptrust__pay { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 14px; padding:0; list-style:none; }
        .ptrust__chip { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.06em;
          color:var(--text-muted); border:1px solid var(--line-d); padding:4px 8px; white-space:nowrap; }
        .ptrust__list { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px; }
        .ptrust__list li { font-size:13.5px; line-height:1.5; color:var(--text-muted); padding-left:16px; position:relative; }
        .ptrust__list li::before { content:""; position:absolute; left:0; top:.62em; width:6px; height:1px; background:var(--blue); }
        .ptrust__list a { color:var(--blue); text-decoration:underline; text-underline-offset:2px; }
        .pdl { margin:34px 0 0; border-top:1px solid var(--line-d); }
        .pdl__row { display:grid; grid-template-columns:118px minmax(0,1fr); gap:16px; align-items:baseline; padding:11px 0; border-bottom:1px solid var(--line-d); }
        .pdl__k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ash); }
        .pdl__v { font-size:15px; color:var(--text-muted); overflow-wrap:anywhere; }

        .pdp__h2 { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:clamp(20px,2.2vw,26px); letter-spacing:.02em; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--line-d); }
        .pdp__copy .prose h2:first-of-type { margin-top:0; }
        .pdp__back { margin-top:44px; }

        .prel { padding:96px 0 108px; margin-top:56px; border-top:1px solid var(--line-d); }
        .prel__title { font-size:clamp(24px,3vw,40px); margin-bottom:32px; }
        .prel__rail { list-style:none; margin:0; padding:2px; display:grid; gap:20px; grid-auto-flow:column; grid-auto-columns:minmax(160px,62%); overflow-x:auto; overscroll-behavior-inline:contain; scroll-snap-type:x proximity; }
        .prel__item { min-width:0; scroll-snap-align:start; }
        .prel__link { display:flex; flex-direction:column; background:var(--ink-2); border:1px solid var(--line-d); transition:transform var(--card-t), border-color var(--card-t); height:100%; }
        .prel__link:hover, .prel__link:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
        .prel__well { position:relative; display:block; aspect-ratio:1; background:#fff; overflow:hidden; }
        .prel__well--empty { background:var(--ink-2); }
        .prel__img { object-fit:cover; }
        .prel__out { position:absolute; left:0; bottom:0; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; background:var(--ink); color:var(--paper); padding:5px 9px; }
        .prel__meta { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:15px; }
        .prel__name { font-size:13.5px; font-weight:600; line-height:1.3; }
        .prel__price { font-family:var(--font-jetbrains),monospace; font-size:14px; color:var(--blue); white-space:nowrap; }

        @media(min-width:761px){
          .prel__rail { grid-auto-flow:row; grid-template-columns:repeat(4,minmax(0,1fr)); overflow-x:visible; scroll-snap-type:none; }
        }
        @media(max-width:960px){
          .pdp { grid-template-columns:minmax(0,1fr); grid-template-areas:"media" "info" "copy"; column-gap:0; row-gap:36px; }
          .pdp__media { max-width:none; }
        }
        @media(max-width:640px){
          .pdp-wrap { padding-top:108px; }
          .prel { padding:72px 0 84px; }
        }
        @media print {
          .pcrumb, .pdp__back, .prel { display:none; }
          .pdp { display:block; }
        }
      `}</style>
    </>
  );
}
