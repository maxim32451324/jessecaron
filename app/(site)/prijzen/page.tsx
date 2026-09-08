import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/content";
import { getPageBody } from "@/lib/content.server";

export const metadata: Metadata = {
  title: "Prijzen",
  description:
    "Prijzen en informatie over de trainingspakketten van Jesse Caron — intake, personal training, duo, groepstraining en open gym.",
};

export default function PrijzenPage() {
  const page = getPage("prijzen");
  if (!page) notFound();
  const body = getPageBody("prijzen");

  return (
    <>
      <PageHero
        eyebrow="Prijzen"
        title="Trainingspakketten"
        sub="Alle pakketten, tarieven en veelgestelde vragen op één plek. Iedere sporter start met een persoonlijke intake."
        image="Groepstraining-Team-Jesse-Caron.jpg"
      />
      <section className="pad">
        <div className="wrap">
          <Markdown>{body}</Markdown>
          <div style={{ marginTop: 56, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/aanmelden" className="btn btn--blue">
              Meld je aan ↗
            </Link>
            <Link href="/training" className="btn">
              ← Alle training
            </Link>
            <Link href="/voorwaarden" className="btn">
              Algemene voorwaarden
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
