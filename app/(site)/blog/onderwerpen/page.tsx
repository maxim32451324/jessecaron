import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getCategories, categoryHref } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Onderwerpen",
  description:
    "Alle onderwerpen in het archief van Jesse Caron, met het aantal artikelen per onderwerp.",
  alternates: { canonical: `${SITE_URL}/blog/onderwerpen` },
};

/**
 * The old site's single-post sidebar carried a "tag cloud" that was really a category
 * cloud (68 terms, font size scaled by count) plus a categories list with counts. The
 * sidebar is gone — it breaks a full-width dark editorial layout — but the information
 * in it is the useful part, so it lives here as a page, in the footer, and as a strip
 * under the blog hero. Counts are printed rather than encoded in the type size: a
 * number is legible, and a scaled font is not a control anyone can read.
 */
export default function TopicsIndex() {
  const linked = getCategories({ pagesOnly: true });
  const rest = getCategories().filter((c) => !c.page);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Onderwerpen",
        item: `${SITE_URL}/blog/onderwerpen`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <PageHero
        eyebrow="Blog / Onderwerpen"
        title="Onderwerpen"
        sub={`${linked.length} onderwerpen met een eigen archief, ${rest.length} verdere labels. Elk getal is het aantal artikelen.`}
        image="Functionele-Looptraining-voor-Voetbal.jpg"
      />

      <section className="pad">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">Archieven</span>
              <h2 className="display">Onderwerpen met een eigen pagina</h2>
            </div>
          </Reveal>

          <Reveal className="tlist">
            {linked.map((c) => (
              <Link key={c.slug} href={categoryHref(c.slug)} className="trow">
                <span className="trow__n">{c.name}</span>
                <span className="trow__c">{c.count}</span>
                <span className="trow__ar">→</span>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="pad" style={{ background: "var(--ink-2)" }}>
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">Verdere labels</span>
              <h2 className="display">De rest van het vocabulaire</h2>
            </div>
          </Reveal>
          {/* Deliberately not links. A term with one or two posts is a page with one
              or two links on it — the classic way a migrated site loses crawl budget.
              The words stay visible; only the thin pages are not built (PARITY-PLAN §2). */}
          <p className="tnote">
            Deze woorden staan wel op de artikelen, maar krijgen geen eigen archiefpagina —
            daarvoor zijn het er te weinig artikelen per woord.
          </p>
          <Reveal className="tcloud">
            {rest.map((c) => (
              <span key={c.slug} className="tterm">
                {c.name} <b>{c.count}</b>
              </span>
            ))}
          </Reveal>

          <div className="tcta">
            <Link href="/blog" className="btn">
              ← Alle artikelen
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .tlist { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
        .trow { min-width:0; background:var(--ink); display:flex; align-items:center; gap:16px; padding:20px 24px; transition:background var(--card-t), color var(--card-t); }
        .trow:hover, .trow:focus-visible { background:var(--ink-2); }
        .trow__n { flex:1; min-width:0; font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:22px; line-height:1; overflow-wrap:anywhere; }
        .trow__c { font-family:var(--font-jetbrains),monospace; font-size:13px; font-weight:600; color:var(--blue-bright); letter-spacing:.1em; }
        .trow__ar { color:var(--ash); transition:transform var(--card-t), color var(--card-t); }
        .trow:hover .trow__ar, .trow:focus-visible .trow__ar { transform:translateX(5px); color:var(--blue); }
        .tnote { color:var(--text-dim); font-size:15px; max-width:62ch; margin:-24px 0 26px; }
        .tcloud { display:flex; flex-wrap:wrap; gap:10px; }
        .tterm { min-width:0; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--line-d); padding:7px 12px; }
        .tterm b { color:var(--ash); font-weight:400; }
        .tcta { margin-top:44px; }
        @media(max-width:760px){ .tlist{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
