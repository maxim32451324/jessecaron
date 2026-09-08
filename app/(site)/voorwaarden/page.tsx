import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/content";
import { getPageBody } from "@/lib/content.server";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden",
  alternates: { canonical: `${SITE_URL}/voorwaarden` },
  description:
    "De algemene voorwaarden en gedragsregels voor trainingen, producten en diensten van Jesse Caron.",
};

export default function VoorwaardenPage() {
  const page = getPage("voorwaarden");
  if (!page) notFound();
  const body = getPageBody("voorwaarden");

  return (
    <>
      <PageHero
        eyebrow="Algemeen"
        title="Algemene Voorwaarden"
        sub="De voorwaarden en gedragsregels die gelden voor deelname aan trainingen en voor bestellingen in de webshop."
      />
      <section className="pad">
        <div className="wrap">
          <Markdown>{body}</Markdown>
          <div style={{ marginTop: 56, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/prijzen" className="btn">
              Prijzen &amp; pakketten
            </Link>
            <Link href="/contact" className="btn">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
