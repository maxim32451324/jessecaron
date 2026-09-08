import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageHero from "@/components/PageHero";
import ShopGrid from "@/components/ShopGrid";
import { getProducts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Shop",
  alternates: { canonical: `${SITE_URL}/shop` },
  description: "Kleding, materiaal en online trainingen — Don't tell people your dreams, show them.",
};

export default function ShopPage() {
  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Don't tell people your dreams. Show them."
        sub="Origami-merch, trainingsmateriaal en online trainingen. Bestellen verloopt via de officiële webshop."
        image="Adelaar-Sport-Shirt-Jesse-Caron-Zwart.jpg"
      />
      <section className="pad">
        <div className="wrap">
          <ShopGrid products={getProducts()} />
        </div>
      </section>
    </>
  );
}
