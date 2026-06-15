import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { brand } from "@/lib/content";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jessecaron.com"),
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
  },
  icons: { icon: "/brand/logo/faviconontwerp.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0E10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${anton.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
