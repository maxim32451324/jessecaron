import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import IntakeForm from "@/components/IntakeForm";

export const metadata: Metadata = {
  title: "Aanmelden",
  description: "Meld je aan voor een persoonlijke intake bij Jesse Caron.",
};

const STEPS = [
  { n: "01", t: "Aanmelding", d: "Je laat hieronder weten wie je bent en wat je doel is." },
  { n: "02", t: "Intake", d: "Een persoonlijke, interactieve intake — kennismaken en de basis testen." },
  { n: "03", t: "Plan", d: "Een trainingsplan op jouw niveau, leerstijl en agenda." },
  { n: "04", t: "Groei", d: "Personal-, groeps- of online training met meetbaar resultaat." },
];

export default function AanmeldenPage() {
  return (
    <>
      <PageHero
        eyebrow="Aanmelden"
        title="Start met een persoonlijke intake"
        sub="Iedere sporter begint met een interactieve intake waarin trainee en trainer elkaar leren kennen."
      />
      <section className="pad">
        <div className="wrap amgrid">
          <div>
            <h2 className="display" style={{ fontSize: "clamp(24px,3vw,38px)", marginBottom: 28 }}>
              Hoe het werkt
            </h2>
            <div className="steps">
              {STEPS.map((s) => (
                <div className="step" key={s.n}>
                  <span className="step__n">{s.n}</span>
                  <div>
                    <h3 className="step__t">{s.t}</h3>
                    <p className="step__d">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="display" style={{ fontSize: "clamp(24px,3vw,38px)", marginBottom: 28 }}>
              Aanmeldformulier
            </h2>
            <IntakeForm />
          </div>
        </div>
      </section>
      <style>{`
        .amgrid { display:grid; grid-template-columns:.8fr 1.2fr; gap:64px; align-items:start; }
        .steps { display:grid; gap:24px; }
        .step { display:flex; gap:18px; }
        .step__n { font-family:var(--font-anton),sans-serif; font-size:30px; color:var(--blue); line-height:1; }
        .step__t { font-size:18px; font-weight:700; margin-bottom:4px; }
        .step__d { font-size:14.5px; color:#a9a9a5; }
        @media(max-width:860px){ .amgrid{ grid-template-columns:1fr; gap:40px; } }
      `}</style>
    </>
  );
}
