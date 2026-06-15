import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import { getPage, getPages, getTrainingPages } from "@/lib/content";
import { getPageBody } from "@/lib/content.server";

// All real pages are previewable at /training/[slug] (service + info pages).
export function generateStaticParams() {
  return getPages().map((p) => ({ slug: p.slug }));
}

const IMG: Record<string, string> = {
  "personal-training": "Reactiesnelheid-Trainen-Stroboscoop-Bril.jpg",
  "functionele-snelheid-trainen": "Sprintsnelheid-Voetbal.jpg",
  "functionele-kracht-trainen": "Functionele-Kracht-Training-Voetbal.jpg",
  loopscholing: "Functionele-Looptraining-voor-Voetbal.jpg",
  groepstrainingen: "Groepstraining-Team-Jesse-Caron.jpg",
  "zomerstop-training": "Startsnelheid-Trainen-Voetbal-1.jpg",
  snelheidsmetingen: "Handelingssnelheid-Trainen-Voetbal-Smartgoals-Oefeningen.jpg",
  sportmassage: "Sportmassage-Groeipijnen-Stephany-Suykerbuyk.jpg",
  oefeningen: "Reactietraining-Hand-Oog-Coordinatie-Oefeningen.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return { title: page.title };
}

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  const body = getPageBody(slug);

  const training = getTrainingPages();
  const idx = training.findIndex((p) => p.slug === slug);
  const next = idx >= 0 ? training[(idx + 1) % training.length] : undefined;

  return (
    <>
      <PageHero eyebrow="Training" title={page.title} image={IMG[slug] ?? page.featured_image} />
      <section className="pad">
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 0 }}>
          <Markdown>{body}</Markdown>

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
    </>
  );
}
