import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import { TRAINING_SLUGS, getPage, getTrainingPages, localImg } from "@/lib/content";
import { getPageBody } from "@/lib/content.server";
import { TRAINING_HERO } from "../hero-images";
import { splitImageRuns } from "./image-runs";
import RecordsBlock from "./records";

// The eleven training pages — not every page in the content index.
export function generateStaticParams() {
  return TRAINING_SLUGS.map((slug) => ({ slug }));
}

/**
 * Only the slugs above may answer here. Anything else is a 404.
 *
 * Without this, Next renders any slug present in the content index on demand, even
 * though it is not in generateStaticParams — which is how `/training/about` was live
 * and serving twenty paragraphs of the theme's Lorem ipsum on the client's public
 * site, along with `/training/shirts` and `/training/teamkleding`. Nothing linked to
 * them, so nothing looked wrong; they were simply reachable, and indexable.
 */
export const dynamicParams = false;

// Pages that own a top-level route must not answer here as well.
const OWN_ROUTE = new Set(["prijzen", "voorwaarden", "contact"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page || OWN_ROUTE.has(slug)) return {};
  return { title: page.title };
}

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page || OWN_ROUTE.has(slug)) notFound();
  const segments = splitImageRuns(getPageBody(slug));

  const training = getTrainingPages();
  const idx = training.findIndex((p) => p.slug === slug);
  const next = idx >= 0 ? training[(idx + 1) % training.length] : undefined;

  return (
    <>
      <PageHero
        eyebrow="Training"
        title={page.title}
        image={TRAINING_HERO[slug] ?? page.featured_image}
      />
      <section className="pad">
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 0 }}>
          {segments.map((s, i) =>
            s.kind === "prose" ? (
              <Markdown key={i}>{s.text}</Markdown>
            ) : (
              <figure className={`igal${s.wide ? " igal--wide" : ""}`} key={i}>
                {s.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.src} src={localImg(img.src)} alt={img.alt} loading="lazy" />
                ))}
              </figure>
            ),
          )}

          {/* The old `/records/` page lives here rather than at a route of its own. */}
          {slug === "snelheidsmetingen" ? <RecordsBlock /> : null}

          <div style={{ marginTop: 56, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/aanmelden" className="btn btn--blue">
              Meld je aan ↗
            </Link>
            <Link href="/training" className="btn">
              ← Alle training
            </Link>
            {next ? (
              <Link href={`/training/${next.slug}`} className="btn">
                Volgende: {next.title} →
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <style>{`
        /* A run of images from the body, shown as one figure — see image-runs.ts for
           why they are grouped rather than paired with the headings around them.
           The figure sits outside .prose, so it gets the full content column instead
           of the 72ch measure the text is set to. */
        .igal { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; margin:36px 0 44px; align-items:start; }
        /* min-width:0 on every grid child. Without it a wide image refuses to shrink
           below its intrinsic width and drags the whole track past the page column —
           the fault that has already broken three grids on this site.
           The hairline comes from each tile's own outline rather than from a coloured
           background behind the grid: seven images in three columns leave two empty
           cells, and a background would paint those as two grey blocks. */
        .igal > * { min-width:0; width:100%; display:block; background:var(--ink-2); box-shadow:0 0 0 1px var(--line-d); }
        /* The tiles are technique diagrams of several different shapes. A fixed box
           with object-fit:contain keeps the row from going ragged, and stops the
           grid's default stretch from distorting a short image to a tall row. */
        .igal:not(.igal--wide) > * { aspect-ratio:16/10; object-fit:contain; padding:18px; }
        /* Dense charts (the /data/ result tables are 1920px of sprint times) are
           unreadable at a third of the column, so they take the whole of it, at
           their own height — nothing to crop and nothing to letterbox. */
        .igal--wide { grid-template-columns:1fr; }
        .igal--wide > * { height:auto; }
        @media(max-width:1000px){ .igal{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:640px){ .igal{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
