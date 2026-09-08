import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import LexiconMarquee from "@/components/LexiconMarquee";
import { getTrainingPages, localImg } from "@/lib/content";

export const metadata: Metadata = {
  title: "Training",
  description: "Personal, groeps- en online training in functionele snelheid en kracht voor spelsporters.",
};

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

export default function TrainingIndex() {
  const pages = getTrainingPages();
  return (
    <>
      <PageHero
        eyebrow="01 — Training"
        title="Train de vaardigheid, niet de oefening"
        sub="Een gefaseerde methode in functionele snelheid en kracht — afgestemd op jouw niveau, leerstijl en spelsport."
        image="Functionele-Snelheid-Jesse-Caron-Looptraining-Voetbal-Hockey-Tennis.jpg"
      />
      <LexiconMarquee />
      <section className="pad">
        <div className="wrap">
          <Reveal className="tgrid">
            {pages.map((p, i) => (
              <Link key={p.slug} href={`/training/${p.slug}`} className="tcard">
                <div className="tcard__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImg(IMG[p.slug] ?? "")} alt="" loading="lazy" />
                </div>
                <div className="tcard__b">
                  <span className="tcard__no">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="tcard__t">{p.title}</h2>
                  <span className="tcard__go">
                    Bekijk <span className="ar">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </Reveal>
          <div className="tcta">
            <Link href="/prijzen" className="btn btn--blue">
              Prijzen &amp; pakketten ↗
            </Link>
            <Link href="/aanmelden" className="btn">
              Meld je aan
            </Link>
          </div>
        </div>
      </section>
      <style>{`
        .tgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
        .tcard { position:relative; background:var(--ink); display:flex; flex-direction:column; transition:transform var(--card-t), box-shadow var(--card-t); z-index:0; }
        .tcard:hover, .tcard:focus-visible { transform:translateY(var(--card-lift)); box-shadow:inset 0 0 0 1px var(--blue); z-index:2; }
        .tcard__img { aspect-ratio:16/10; overflow:hidden; }
        .tcard__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s, transform .5s; }
        .tcard:hover .tcard__img img, .tcard:focus-visible .tcard__img img { filter:grayscale(0) brightness(1); transform:scale(1.04); }
        .tcard__b { padding:26px 26px 30px; }
        .tcard__no { font-family:var(--font-jetbrains),monospace; font-size:12px; color:var(--blue); letter-spacing:.2em; }
        .tcard__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:26px; line-height:1; margin:12px 0 16px; }
        .tcard__go { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--paper); display:inline-flex; gap:8px; align-items:center; }
        .tcard__go .ar { color:var(--blue); transition:.3s; }
        .tcard:hover .tcard__go .ar, .tcard:focus-visible .tcard__go .ar { transform:translateX(5px); }
        .tcta { display:flex; gap:14px; flex-wrap:wrap; margin-top:44px; }
        @media(max-width:1000px){ .tgrid{ grid-template-columns:repeat(2,1fr);} }
        @media(max-width:640px){ .tgrid{ grid-template-columns:1fr;} }
      `}</style>
    </>
  );
}
