import { localImg } from "@/lib/content";

// Compact interior-page hero: eyebrow + big title over an optional image.
export default function PageHero({
  eyebrow,
  title,
  sub,
  image,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  image?: string;
}) {
  return (
    <section className="phero">
      {image ? (
        <div className="phero__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={localImg(image)} alt="" />
        </div>
      ) : null}
      <div className="wrap phero__inner">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display phero__h1">{title}</h1>
        {sub ? <p className="phero__sub">{sub}</p> : null}
      </div>
      <style>{`
        .phero { position:relative; padding:148px 0 56px; overflow:hidden; border-bottom:1px solid var(--line-d); }
        .phero__bg { position:absolute; inset:0; z-index:0; }
        .phero__bg img { width:100%; height:100%; object-fit:cover; filter:grayscale(.4) brightness(.4); }
        .phero__bg::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.6),rgba(14,14,16,.9)); }
        .phero__inner { position:relative; z-index:2; }
        .phero__inner > * { animation:pheroIn .7s cubic-bezier(.2,.7,.2,1) both; }
        .phero__inner > .eyebrow { animation-delay:.05s; }
        .phero__h1 { font-size:clamp(40px,7vw,96px); margin-top:18px; max-width:18ch; animation-delay:.14s; }
        .phero__sub { margin-top:22px; max-width:54ch; color:#cfcfcc; font-size:17px; animation-delay:.24s; }
        .phero__bg img { animation:pheroZoom 14s ease-in-out infinite alternate; }
        @keyframes pheroIn { from{ opacity:0; transform:translateY(22px); } to{ opacity:1; transform:none; } }
        @keyframes pheroZoom { from{ transform:scale(1.05); } to{ transform:scale(1.13); } }
        @media(prefers-reduced-motion:reduce){
          .phero__inner > *, .phero__bg img { animation:none; }
        }
      `}</style>
    </section>
  );
}
