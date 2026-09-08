import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { brand } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jesse Caron — Functionele Snelheid & Kracht",
    template: "%s — Jesse Caron",
  },
  description: brand.description,
  openGraph: {
    title: "Jesse Caron — Functionele Snelheid & Kracht",
    description: brand.description,
    locale: "nl_NL",
    type: "website",
    siteName: "Jesse Caron",
    images: [
      {
        url: "/brand/photos/DSC_0857-b-scaled.jpg",
        width: 1200,
        height: 630,
        alt: "Jesse Caron — functionele snelheid en kracht",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jesse Caron — Functionele Snelheid & Kracht",
    description: brand.description,
    images: ["/brand/photos/DSC_0857-b-scaled.jpg"],
  },
  // icons come from app/icon.png (square); the old 175x150 png rendered squashed.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0E10",
};

/**
 * Who this site is, in the one format a search engine reads without guessing.
 *
 * The posts already emit `BlogPosting` and the archives `BreadcrumbList`, but nothing
 * said whose site this is — and on a domain move that matters more than usual: the
 * knowledge panel, the social profiles and the logo are the signals that tell Google
 * the new host is the same business as the old one, not a squatter that took the name.
 *
 * `sameAs` lists the three profiles the footer already links. `url` follows `SITE_URL`,
 * so it becomes www.jessecaron.com the moment the environment variable does, with
 * nothing else to remember.
 */
const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brand.name,
  url: SITE_URL,
  description: brand.description,
  logo: `${SITE_URL}/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png`,
  image: `${SITE_URL}/brand/photos/DSC_0857-b-scaled.jpg`,
  telephone: brand.phone,
  areaServed: brand.location,
  sameAs: [brand.socials.instagram, brand.socials.facebook, brand.socials.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${anton.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        {/* Reveal animates in via IntersectionObserver; without JS it must not stay invisible. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
