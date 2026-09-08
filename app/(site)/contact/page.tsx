import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageHero from "@/components/PageHero";
import { brand } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: `${SITE_URL}/contact` },
  description: `Neem contact op met Jesse Caron — ${brand.location}.`,
};

const ROWS = [
  { k: "Telefoon / WhatsApp", v: brand.phone, href: "tel:+31613980227" },
  { k: "Locatie", v: brand.location },
  { k: "Instagram", v: "@caron_jesse", href: brand.socials.instagram },
  { k: "Facebook", v: "jessecarondotcom", href: brand.socials.facebook },
  { k: "LinkedIn", v: "caronjesse", href: brand.socials.linkedin },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Laten we kennismaken"
        sub="Vragen over training, kleding of samenwerking? Bel, app of stuur een bericht via social."
        image="Groepstraining-Team-Jesse-Caron.jpg"
      />
      <section className="pad">
        <div className="wrap cgrid">
          <div>
            {ROWS.map((r) => (
              <div className="crow" key={r.k}>
                <div className="ck">{r.k}</div>
                <div className="cv">
                  {r.href ? (
                    <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener">
                      {r.v}
                    </a>
                  ) : (
                    r.v
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="ccta">
            <h2 className="display" style={{ fontSize: "clamp(26px,3vw,40px)", marginBottom: 18 }}>
              Klaar om te starten?
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 26 }}>
              Iedere sporter start met een persoonlijke interactieve intake. Meld je aan en we
              plannen je eerste training.
            </p>
            <Link href="/aanmelden" className="btn btn--blue">
              Aanmelden ↗
            </Link>
          </div>
        </div>
      </section>
      <style>{`
        .cgrid { display:grid; grid-template-columns:1.2fr 1fr; gap:60px; align-items:start; }
        .crow { border-bottom:1px solid var(--line-d); padding:18px 0; }
        .ck { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--ash); margin-bottom:6px; }
        .cv { font-size:22px; font-weight:600; }
        .cv a:hover, .cv a:focus-visible { color:var(--blue); }
        .ccta { background:var(--ink-2); border:1px solid var(--line-d); padding:36px; }
        @media(max-width:860px){ .cgrid{ grid-template-columns:1fr; gap:36px; } }
      `}</style>
    </>
  );
}
