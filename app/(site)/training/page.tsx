import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import LexiconMarquee from "@/components/LexiconMarquee";
import { getTrainingPages, localImg } from "@/lib/content";
import { TRAINING_HERO } from "./hero-images";

export const metadata: Metadata = {
  title: "Training",
  alternates: { canonical: `${SITE_URL}/training` },
  description: "Personal, groeps- en online training in functionele snelheid en kracht voor spelsporters.",
};

/** .tgrid: 3 tracks with 1px gaps in the 1224px column → 2 at ≤1000px → 1 at ≤640px. */
const TCARD_SIZES =
  "(max-width: 640px) calc(100vw - 56px), (max-width: 1000px) calc((100vw - 58px) / 2), 407px";

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
                  <Image
                    src={localImg(TRAINING_HERO[p.slug] ?? "")}
                    alt=""
                    fill
                    sizes={TCARD_SIZES}
                  />
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
        /* The hairline grid is drawn by each card's own outline, not by a coloured
           background showing through the 1px gaps. Eleven cards in three columns
           leave one cell empty, and a background paints that empty cell as a large
           pale block — invisible while the grid held exactly nine. */
        .tgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; }
        /* min-width:0 on every grid child: the default min-width:auto will not let a
           card shrink below its widest unbreakable word, and "Schoolsport Vereniging
           Rotterdam Atletiek" is exactly the kind of title that then pushes the row
           past its track. Same fault that has already hit three grids on this site. */
        .tcard { min-width:0; position:relative; background:var(--ink); display:flex; flex-direction:column; transition:transform var(--card-t), box-shadow var(--card-t); z-index:0; box-shadow:0 0 0 1px var(--line-d); }
        .tcard:hover, .tcard:focus-visible { transform:translateY(var(--card-lift)); box-shadow:0 0 0 1px var(--blue), inset 0 0 0 1px var(--blue); z-index:2; }
        /* position:relative — the containing block for the next/image fill. */
        .tcard__img { position:relative; aspect-ratio:16/10; overflow:hidden; }
        .tcard__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s, transform .5s; }
        .tcard:hover .tcard__img img, .tcard:focus-visible .tcard__img img { filter:grayscale(0) brightness(1); transform:scale(1.04); }
        .tcard__b { padding:26px 26px 30px; }
        .tcard__no { font-family:var(--font-jetbrains),monospace; font-size:12px; font-weight:600; color:var(--blue-bright); letter-spacing:.2em; }
        .tcard__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:26px; line-height:1; margin:12px 0 16px; overflow-wrap:anywhere; }
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
