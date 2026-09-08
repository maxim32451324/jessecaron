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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${anton.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        {/* Reveal animates in via IntersectionObserver; without JS it must not stay invisible. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
