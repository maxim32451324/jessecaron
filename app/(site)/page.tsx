import Link from "next/link";
import LexiconMarquee from "@/components/LexiconMarquee";
import Reveal from "@/components/Reveal";
import VideoFacade from "@/components/VideoFacade";
import { brand, stats, getVideos, getProducts, localImg, fmtPrice } from "@/lib/content";
import CountUp from "@/components/CountUp";

const DISCIPLINES = [
  {
    no: "/01",
    title: ["Personal", "Training"],
    desc: "Individuele aandacht met specifieke aanwijzingen, volledig gebouwd rond jouw doel en spelsport.",
    href: "/training/personal-training",
    img: "Reactiesnelheid-Trainen-Stroboscoop-Bril.jpg",
  },
  {
    no: "/02",
    title: ["Functionele", "Snelheid"],
    desc: "Start-, reactie- en handelingssnelheid: snel kijken, denken én doen onder druk.",
    href: "/training/functionele-snelheid-trainen",
    img: "Startsnelheid-Trainen-Voetbal-scaled.jpg",
  },
  {
    no: "/03",
    title: ["Functionele", "Kracht"],
    desc: "Verworven krachteigenschappen die leiden tot een beter functionerend, explosiever lichaam.",
    href: "/training/functionele-kracht-trainen",
    img: "Krachttraining-Voetbal-1.jpg",
  },
  {
    no: "/04",
    title: ["Loop-", "scholing"],
    desc: "Looptechniek als basis: motoriek, stabiliteit en efficiëntie in elke pas.",
    href: "/training/loopscholing",
    img: "Functionele-Looptraining-voor-Voetbal.jpg",
  },
  {
    no: "/05",
    title: ["Groeps-", "trainingen"],
    desc: "Variatie breekt de routine, verhoogt het plezier en stimuleert vooral het denken.",
    href: "/training/groepstrainingen",
    img: "Groepstraining-Team-Jesse-Caron.jpg",
  },
  {
    no: "/06",
    title: ["Online", "Training"],
    desc: "Ebooks vol oefeningen voor snelheid, kracht en reactievermogen — train waar je wilt.",
    href: "/shop",
    img: "Handelingssnelheid-Trainen-Voetbal-Smartgoals-Oefeningen.jpg",
  },
];

const PARTNERS = [
  { src: "/brand/partners/Looptrainer-Feyenoord.png", alt: "Feyenoord" },
  { src: "/brand/partners/Gemeente-Rotterdam.png", alt: "Gemeente Rotterdam" },
  { src: "/brand/partners/Rotterdam-Sportsupport.png", alt: "Rotterdam Sportsupport" },
  { src: "/brand/partners/Rotterdam-Atletiek.jpg", alt: "Rotterdam Atletiek" },
  { src: "/brand/partners/Smartgoals.jpg", alt: "Smartgoals", light: true },
];

export default function HomePage() {
  const videos = getVideos();
  const featured = videos.find((v) => v.youtube_id === "R8R4p_4564U") ?? videos[0];
  const secondary = videos.find((v) => v.youtube_id === "LjHB4u8kU8k") ?? videos[1];
  const gridVideos = videos.filter((v) => v !== featured && v !== secondary).slice(0, 4);
  const shopPicks = ["reflection-hoodie", "stroboscoop-glasses", "reflection-cowl-sweatshirt", "sport-shirt-white"]
    .map((s) => getProducts().find((p) => p.slug === s))
    .filter(Boolean);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={localImg("DSC_0857-b-scaled.jpg")}
            alt="Atleet in startpositie op de baan"
          />
        </div>
        <div className="hero__side">Rotterdam · est. 2005 · Origami™</div>
        <div className="wrap hero__inner">
          <div className="hero__kicker">
            <span className="tick" />
            <span className="eyebrow">Functionele Snelheid &amp; Kracht</span>
          </div>
          <h1 className="display hero__h1">
            Don&apos;t confuse movement
            <br />
            with <span style={{ color: "var(--blue)" }}>progress.</span>
          </h1>
          <div className="hero__row">
            <p className="hero__sub">
              20 jaar specialisatie in het vergroten van functionele snelheid bij spelsporters —
              personal, groeps- en online training voor voetbal, hockey, tennis en meer.
            </p>
            <div className="hero__actions">
              <Link href="/aanmelden" className="btn btn--blue">
                Meld je aan ↗
              </Link>
              <Link href="/training" className="btn">
                Bekijk training
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LexiconMarquee />

      {/* STATS */}
      <section className="stats-band">
        <div className="wrap stats-row">
          <Reveal className="stat" as="div">
            <div className="stat__v">
              <CountUp to={20} suffix="" />
            </div>
            <div className="stat__l">Jaar specialisatie</div>
          </Reveal>
          <Reveal className="stat" as="div">
            <div className="stat__v">
              <CountUp to={stats.videos} />
            </div>
            <div className="stat__l">Trainingsvideo&apos;s</div>
          </Reveal>
          <Reveal className="stat" as="div">
            <div className="stat__v">
              <CountUp to={stats.posts} />
            </div>
            <div className="stat__l">Artikelen &amp; verhalen</div>
          </Reveal>
          <Reveal className="stat" as="div">
            <div className="stat__v">
              <CountUp to={stats.products} />
            </div>
            <div className="stat__l">Producten &amp; ebooks</div>
          </Reveal>
        </div>
      </section>

      {/* DISCIPLINES */}
      <section className="pad" id="disciplines">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">01 — Training</span>
              <h2 className="display">
                Train de vaardigheid,
                <br />
                niet de oefening
              </h2>
            </div>
            <p style={{ maxWidth: "34ch", color: "#bdbdba", fontSize: 15 }}>
              Elke vorm bouwt aan reactief, explosief en wendbaar bewegen — afgestemd op jouw spelsport.
            </p>
          </Reveal>

          <Reveal className="disc-grid">
            {DISCIPLINES.map((d) => (
              <Link className="disc" href={d.href} key={d.no}>
                <div className="disc__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImg(d.img)} alt="" />
                </div>
                <span className="disc__no">{d.no}</span>
                <div>
                  <h3 className="disc__t">
                    {d.title[0]}
                    <br />
                    {d.title[1]}
                  </h3>
                  <p className="disc__d">{d.desc}</p>
                </div>
                <span className="disc__go">
                  Meer <span className="ar">→</span>
                </span>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mani">
        <div className="wrap">
          <p className="mani__sm">Filosofie</p>
          <p className="mani__big">Fall in love with the process and the results will come</p>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="pad" id="videos">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">02 — Impressie</span>
              <h2 className="display">
                Zie de methode
                <br />
                in beweging
              </h2>
            </div>
            <Link href="/videos" className="btn btn--blue">
              Alle videos ↗
            </Link>
          </Reveal>
          <Reveal>
            <div className="vid-feature">
              <VideoFacade
                youtubeId={featured.youtube_id}
                title="RTL4 — De beste personal trainer van NL"
                main
              />
              <VideoFacade youtubeId={secondary.youtube_id} title="Handelingssnelheid · Blazepod" />
            </div>
            <div className="vid-grid">
              {gridVideos.map((v) => (
                <VideoFacade key={v.youtube_id} youtubeId={v.youtube_id} title={v.title} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT / ORIGAMI */}
      <section className="pad" id="about" style={{ background: "var(--ink-2)" }}>
        <div className="wrap about">
          <Reveal className="about__img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localImg("19984196_10212602758331342_779455213785724961_o-b.jpg")} alt="Sprintfinish op de atletiekbaan" />
            <span className="about__tag">Origami™ — Adelaar</span>
          </Reveal>
          <Reveal>
            <span className="sec-num">03 — Over Jesse</span>
            <h2 className="display" style={{ fontSize: "clamp(28px,3.6vw,50px)", margin: "10px 0 24px" }}>
              Vorm jezelf
              <br />
              als een adelaar
            </h2>
            <p style={{ color: "#cfcfcc", marginBottom: 30, fontSize: 16, maxWidth: "46ch" }}>
              Jesse Caron specialiseert zich al 20 jaar in functionele snelheid bij spelsporters —
              middels personal-, groeps- en online training, workshops, kleding én producten,
              gekenmerkt door zijn merk: een origami adelaar.
            </p>
            <div className="defs">
              <div className="def">
                <h4>Origami</h4>
                <p>De kunst om een sporter — als een blanco vel papier — te vouwen tot een functionele vorm.</p>
              </div>
              <div className="def">
                <h4>Technique</h4>
                <p>De mate van techniek bepaalt de kwaliteit van je sportprestatie en de functionaliteit van je fysiek.</p>
              </div>
              <div className="def">
                <h4>Eagle</h4>
                <p>Reactief, explosief en wendbaar — kracht, focus en visie van een roofvogel.</p>
              </div>
            </div>
            <div style={{ marginTop: 34 }}>
              <Link href="/aanmelden" className="btn">
                Plan een intake
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SHOP */}
      <section className="pad" id="shop">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">04 — Shop</span>
              <h2 className="display">
                Don&apos;t tell people your
                <br />
                dreams. Show them.
              </h2>
            </div>
            <Link href="/shop" className="btn btn--blue">
              Hele webshop ↗
            </Link>
          </Reveal>
          <Reveal className="shop-grid">
            {shopPicks.map((p) => (
              <Link className="prod" href={`/shop/${p!.slug}`} key={p!.slug}>
                <div className="prod__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImg(p!.image)} alt={p!.name} loading="lazy" />
                </div>
                <div className="prod__b">
                  <span className="prod__n">{p!.name}</span>
                  <span className="prod__p">{fmtPrice(p!.price_eur)}</span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* PARTNERS */}
      <div className="partners">
        <div className="wrap">
          <div className="partners__label">Vertrouwd door</div>
          <Reveal className="partners__row">
            {PARTNERS.map((p) => (
              <div className="partner-chip" key={p.alt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} />
              </div>
            ))}
          </Reveal>
        </div>
      </div>

      <HomeStyles />
    </>
  );
}

function HomeStyles() {
  return (
    <style>{`
      .hero { position:relative; min-height:100vh; display:flex; align-items:flex-end; overflow:hidden; }
      .hero__bg { position:absolute; inset:0; z-index:0; overflow:hidden; }
      .hero__bg img { width:100%; height:100%; object-fit:cover; filter:grayscale(.15) contrast(1.08) brightness(.66); transform:scale(1.04); animation:heroZoom 18s ease-in-out infinite alternate; }
      @keyframes heroZoom { from{ transform:scale(1.04); } to{ transform:scale(1.14); } }
      .hero__bg::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.55) 0%,rgba(14,14,16,.1) 35%,rgba(14,14,16,.85) 100%); }
      .hero__inner { position:relative; z-index:2; width:100%; padding-bottom:64px; }
      .hero__kicker { display:flex; gap:18px; align-items:center; margin-bottom:26px; flex-wrap:wrap; }
      .hero__kicker .tick { width:34px; height:1px; background:var(--blue); }
      .hero__h1 { font-size:clamp(48px,9.5vw,150px); max-width:14ch; }
      .hero__row { display:flex; justify-content:space-between; align-items:flex-end; gap:30px; margin-top:34px; flex-wrap:wrap; }
      .hero__sub { max-width:42ch; color:#cfcfcc; font-size:16px; }
      .hero__actions { display:flex; gap:14px; flex-wrap:wrap; }
      .hero__side { position:absolute; right:28px; top:50%; transform:translateY(-50%) rotate(180deg); writing-mode:vertical-rl; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.4em; text-transform:uppercase; color:var(--ash); z-index:2; }

      .disc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      .disc { position:relative; background:var(--ink); padding:34px 30px 30px; min-height:340px; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; transition:.4s; }
      .disc__img { position:absolute; inset:0; z-index:0; opacity:.42; transition:.5s; }
      .disc__img::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.45) 0%,rgba(14,14,16,.55) 55%,rgba(14,14,16,.9) 100%); }
      .disc__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.85) brightness(.6); transition:.6s; transform:scale(1); }
      .disc:hover .disc__img { opacity:.9; }
      .disc:hover .disc__img img { filter:grayscale(0) brightness(.7); transform:scale(1.06); }
      .disc:hover { background:var(--ink-2); }
      .disc > * { position:relative; z-index:1; }
      .disc__no { font-family:var(--font-jetbrains),monospace; font-size:12px; color:var(--blue); letter-spacing:.2em; }
      .disc__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:30px; line-height:.98; margin:14px 0 12px; }
      .disc__d { font-size:14.5px; color:#bdbdba; max-width:34ch; }
      .disc__go { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--paper); margin-top:20px; display:inline-flex; gap:8px; align-items:center; }
      .disc__go .ar { color:var(--blue); transition:.3s; }
      .disc:hover .disc__go .ar { transform:translateX(5px); }

      .mani { background:var(--blue); color:#fff; text-align:center; padding:120px 0; }
      .mani__big { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:clamp(32px,6vw,86px); line-height:.95; max-width:18ch; margin:0 auto; letter-spacing:.01em; }
      .mani__sm { font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.28em; text-transform:uppercase; opacity:.85; margin-bottom:30px; }

      .vid-feature { display:grid; grid-template-columns:1.4fr 1fr; gap:1px; background:var(--line-d); border:1px solid var(--line-d); margin-bottom:1px; }
      .vid-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); border-top:0; }

      .about { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
      .about__img { position:relative; }
      .about__img img { width:100%; filter:grayscale(.2) contrast(1.05); }
      .about__tag { position:absolute; left:-1px; bottom:24px; background:var(--blue); color:#fff; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.18em; text-transform:uppercase; padding:11px 18px; }
      .defs { display:grid; gap:20px; margin-top:8px; }
      .def { border-left:2px solid var(--blue); padding-left:18px; }
      .def h4 { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--blue); margin-bottom:5px; }
      .def p { font-size:14.5px; color:#bdbdba; }

      .shop-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
      .prod { background:var(--ink-2); border:1px solid var(--line-d); transition:.3s; display:block; }
      .prod:hover { transform:translateY(-5px); border-color:var(--blue); }
      .prod__img { aspect-ratio:1; overflow:hidden; background:#fff; }
      .prod__img img { width:100%; height:100%; object-fit:cover; transition:.5s; }
      .prod:hover .prod__img img { transform:scale(1.05); }
      .prod__b { padding:18px; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
      .prod__n { font-size:14px; font-weight:600; line-height:1.3; }
      .prod__p { font-family:var(--font-jetbrains),monospace; font-size:14px; color:var(--blue); white-space:nowrap; }

      .partners { border-top:1px solid var(--line-d); padding:56px 0; }
      .partners__label { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--ash); text-align:center; margin-bottom:30px; }
      .partners__row { display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      .partner-chip { background:#fff; height:104px; display:grid; place-items:center; padding:22px 24px; transition:.3s; }
      .partner-chip:hover { background:#f0f0ec; }
      .partner-chip img { max-height:100%; max-width:100%; width:auto; object-fit:contain; transition:.3s; transform:scale(1); }
      .partner-chip:hover img { transform:scale(1.06); }

      .stats-band { border-bottom:1px solid var(--line-d); padding:44px 0; background:var(--ink-2); }
      .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; }
      .stats-band .stat { text-align:center; padding:8px 12px; }
      .stats-band .stat__v { font-family:var(--font-anton),sans-serif; font-size:clamp(40px,5vw,64px); line-height:1; color:var(--paper); }
      .stats-band .stat__l { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--blue); margin-top:10px; }

      @media(max-width:1000px){
        .disc-grid { grid-template-columns:repeat(2,1fr); }
        .vid-grid { grid-template-columns:repeat(2,1fr); }
        .shop-grid { grid-template-columns:repeat(2,1fr); }
        .about { grid-template-columns:1fr; gap:36px; }
        .vid-feature { grid-template-columns:1fr; }
        .hero__side { display:none; }
      }
      @media(max-width:760px){
        .stats-row { grid-template-columns:1fr 1fr; gap:28px 1px; }
      }
      @media(max-width:640px){
        .disc-grid { grid-template-columns:1fr; }
        .vid-grid { grid-template-columns:1fr; }
        .shop-grid { grid-template-columns:1fr 1fr; }
        .mani { padding:84px 0; }
        .partners__row { grid-template-columns:repeat(2,1fr); }
        .partner-chip { height:88px; }
      }
      @media(prefers-reduced-motion:reduce){
        .hero__bg img { animation:none; transform:none; }
      }
    `}</style>
  );
}
