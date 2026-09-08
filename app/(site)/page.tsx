import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LexiconMarquee from "@/components/LexiconMarquee";
import Reveal from "@/components/Reveal";
import VideoFacade from "@/components/VideoFacade";
import { getVideos, getProducts, getPosts, localDims, localImg, fmtPrice } from "@/lib/content";
import { getPageFrontMatter, getPageStats } from "@/lib/content.server";
import CountUp from "@/components/CountUp";
import PostCard, { POSTCARD_CSS } from "@/components/PostCard";
import { SITE_URL } from "@/lib/site";

/**
 * Title and description come from the root layout, which is right — the home page IS
 * the site. The canonical is not inherited, though: without it the home page has no
 * declared address, and `skipTrailingSlashRedirect` means both `/` and `//`-style
 * variants, plus every `?utm_*` a campaign appends, look like separate pages.
 */
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

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

/**
 * The stats band is the counter row from the old `/data/` page: three numbers on
 * brand blue, labelled TRAININGSJAREN / TRAININGEN / ATLETEN. They are Jesse's own
 * figures, and they live in `content/pages/data.md`'s front matter — the band reads
 * them from there, so the page and the home page can never disagree.
 *
 * They replace the four counts that used to stand here (years, videos, posts,
 * products). Three of those four counted this website's own inventory, which is a
 * fact about the site rather than about the work.
 */
const COUNTERS: { key: string; label: string }[] = [
  { key: "trainingsjaren", label: "Trainingsjaren" },
  { key: "trainingen", label: "Trainingen" },
  { key: "atleten", label: "Atleten" },
];

const NL_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** "2024-03-29" -> "maart 2024". The counters are a measurement, so they carry a date. */
function dutchMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${NL_MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}

const PARTNERS = [
  { src: "/brand/partners/Looptrainer-Feyenoord.png", alt: "Feyenoord" },
  { src: "/brand/partners/Gemeente-Rotterdam.png", alt: "Gemeente Rotterdam" },
  { src: "/brand/partners/Rotterdam-Sportsupport.png", alt: "Rotterdam Sportsupport" },
  { src: "/brand/partners/Rotterdam-Atletiek.jpg", alt: "Rotterdam Atletiek" },
  { src: "/brand/partners/Smartgoals.jpg", alt: "Smartgoals", light: true },
];

/**
 * `sizes` for the two image grids on this page, each read off the CSS at the bottom
 * of the file rather than guessed. The content column is 1224px (--maxw 1280 less
 * 2×28 padding); subtract the gaps, divide by the track count at each breakpoint.
 * Getting these wrong is not a layout bug but a silent one: the browser picks a
 * candidate far larger than the box and the whole point of next/image is lost.
 */
// .disc-grid: 3 tracks, 1px gaps → 2 at ≤1000px → 1 at ≤640px
const DISC_SIZES =
  "(max-width: 640px) calc(100vw - 56px), (max-width: 1000px) calc((100vw - 58px) / 2), 407px";
// .shop-grid: 4 tracks, 24px gaps → 2 at ≤1000px, and still 2 at ≤640px
const PROD_SIZES = "(max-width: 1000px) calc((100vw - 80px) / 2), 288px";

/**
 * The about photograph and the five partner logos are laid out at their own aspect
 * ratio rather than cropped into a fixed box, so they take real `width`/`height`
 * from `lib/image-dimensions.json` instead of `fill`. All six are in
 * `lib/image-manifest.json` and `scripts/check-images.mjs` fails the build if a
 * manifest entry stops resolving — but the fallbacks are there so a missing entry
 * degrades to a wrong box rather than a crashed build.
 */
const ABOUT_SRC = "19984196_10212602758331342_779455213785724961_o-b.jpg";
const ABOUT_IMG = {
  path: localImg(ABOUT_SRC),
  w: localDims(ABOUT_SRC)?.w ?? 2000,
  h: localDims(ABOUT_SRC)?.h ?? 1333,
};

function partnerDims(src: string): { w: number; h: number } {
  const d = localDims(src);
  return { w: d?.w ?? 200, h: d?.h ?? 60 };
}

export default function HomePage() {
  const dataStats = getPageStats("data");
  const counters = COUNTERS.filter((c) => Number.isFinite(dataStats[c.key]));
  const measured = dutchMonth(getPageFrontMatter("data").modified ?? "");
  const latest = getPosts().slice(0, 3);
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
          {/* The LCP element of the whole site: a full-viewport crop at the top of the
              home page. `priority` so it is preloaded rather than discovered by the
              lazy-load observer two paints later, and `fill` because its height comes
              from the section (min-height:100vh), not from the photograph. */}
          <Image
            src={localImg("DSC_0857-b-scaled.jpg")}
            alt="Atleet in startpositie op de baan"
            fill
            sizes="100vw"
            priority
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

      {/* STATS — the counters from /training/data */}
      {counters.length ? (
        <section className="stats-band">
          <div className="wrap">
            <div className="stats-row">
              {counters.map((c) => (
                <Reveal className="stat" as="div" key={c.key}>
                  <div className="stat__v">
                    <CountUp to={dataStats[c.key]} grouped />
                  </div>
                  <div className="stat__l">{c.label}</div>
                </Reveal>
              ))}
            </div>
            <div className="stats-note">
              {measured ? <span>Cijfers van {measured}</span> : null}
              <Link href="/training/data">Alle data ↗</Link>
            </div>
          </div>
        </section>
      ) : null}

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
            <p style={{ maxWidth: "34ch", color: "var(--text-dim)", fontSize: 15 }}>
              Elke vorm bouwt aan reactief, explosief en wendbaar bewegen — afgestemd op jouw spelsport.
            </p>
          </Reveal>

          <Reveal className="disc-grid">
            {DISCIPLINES.map((d) => (
              <Link className="disc" href={d.href} key={d.no}>
                <div className="disc__img">
                  <Image src={localImg(d.img)} alt="" fill sizes={DISC_SIZES} />
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

      {/* LAATSTE ARTIKELEN — the home page had no route into the blog at all */}
      {latest.length ? (
        <section className="pad" style={{ paddingTop: 0 }} id="artikelen">
          <div className="wrap">
            <Reveal className="sec-head">
              <div>
                <span className="sec-num">03 — Blog</span>
                <h2 className="display">
                  Laatste
                  <br />
                  artikelen
                </h2>
              </div>
              <Link href="/blog" className="btn btn--blue">
                Alle artikelen ↗
              </Link>
            </Reveal>
            <Reveal className="pgrid">
              {latest.map((p) => (
                <PostCard key={p.slug} p={p} />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ABOUT / ORIGAMI */}
      <section className="pad" id="about" style={{ background: "var(--ink-2)" }}>
        <div className="wrap about">
          <Reveal className="about__img">
            {/* Intrinsic width/height rather than `fill`: this one is set by its own
                aspect ratio inside a half-width column, so the manifest's dimensions
                reserve exactly the right box and nothing below it moves. */}
            <Image
              src={ABOUT_IMG.path}
              alt="Sprintfinish op de atletiekbaan"
              width={ABOUT_IMG.w}
              height={ABOUT_IMG.h}
              sizes="(max-width: 1000px) calc(100vw - 56px), 580px"
            />
            <span className="about__tag">Origami™ — Adelaar</span>
          </Reveal>
          <Reveal>
            <span className="sec-num">04 — Over Jesse</span>
            <h2 className="display" style={{ fontSize: "clamp(28px,3.6vw,50px)", margin: "10px 0 24px" }}>
              Vorm jezelf
              <br />
              als een adelaar
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 30, fontSize: 16, maxWidth: "46ch" }}>
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
              <span className="sec-num">05 — Shop</span>
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
                  <Image src={localImg(p!.image)} alt={p!.name} fill sizes={PROD_SIZES} />
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
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={partnerDims(p.src).w}
                  height={partnerDims(p.src).h}
                  sizes="(max-width: 640px) 45vw, 200px"
                />
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
      /* The blog card, exactly as /blog and the archives draw it — "Laatste
         artikelen" here must not become a second, slightly different card. */
      ${POSTCARD_CSS}
      .hero { position:relative; min-height:max(100vh, 720px); display:flex; align-items:flex-end; overflow:hidden; }
      .hero__bg { position:absolute; inset:0; z-index:0; overflow:hidden; }
      .hero__bg img { width:100%; height:100%; object-fit:cover; filter:grayscale(.15) contrast(1.08) brightness(.66); transform:scale(1.04); animation:heroZoom 18s ease-in-out infinite alternate; }
      @keyframes heroZoom { from{ transform:scale(1.04); } to{ transform:scale(1.14); } }
      .hero__bg::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.55) 0%,rgba(14,14,16,.1) 35%,rgba(14,14,16,.85) 100%); }
      .hero__inner { position:relative; z-index:2; width:100%; padding-top:110px; padding-bottom:64px; }
      .hero__kicker { display:flex; gap:18px; align-items:center; margin-bottom:26px; flex-wrap:wrap; }
      .hero__kicker .tick { width:34px; height:1px; background:var(--blue); }
      /* .eyebrow is brand blue, which reads well against the site's solid near-black — but
         this one sits on a photograph, and lands squarely on the bright teal wristband:
         blue on blue, illegible. Only the hero copy is overridden. White with a soft shadow
         survives whatever is behind it, and the blue tick to its left keeps the accent. */
      .hero__kicker .eyebrow { color:var(--paper); text-shadow:0 1px 14px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.6); }
      .hero__h1 { font-size:clamp(48px,9.5vw,150px); max-width:14ch; }
      .hero__row { display:flex; justify-content:space-between; align-items:flex-end; gap:30px; margin-top:34px; flex-wrap:wrap; }
      .hero__sub { max-width:42ch; color:var(--text-muted); font-size:16px; }
      .hero__actions { display:flex; gap:14px; flex-wrap:wrap; }
      .hero__side { position:absolute; right:28px; top:50%; transform:translateY(-50%) rotate(180deg); writing-mode:vertical-rl; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.4em; text-transform:uppercase; color:var(--ash); z-index:2; }

      /* Every grid child on this page can shrink to its track. Grid items default to
         min-width:auto, which means one long word or one wide image quietly overrides
         the 1fr track and pushes the row past the content column — the same fault that skewed
         .vid-feature here, blew out the shop cards, and sent the footer links off-screen.
         Declared once so it stops happening. */
      .disc-grid > *, .vid-grid > *, .shop-grid > *, .partners__row > * { min-width:0; }
      .disc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      .disc { position:relative; background:var(--ink); padding:34px 30px 30px; min-height:340px; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; transition:transform var(--card-t), box-shadow var(--card-t); z-index:0; }
      .disc__img { position:absolute; inset:0; z-index:0; opacity:1; transition:opacity var(--card-t); }
      .disc__img::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(14,14,16,.45) 0%,rgba(14,14,16,.65) 55%,rgba(14,14,16,.9) 100%); transition:background var(--card-t); }
      .disc__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s, transform .5s; transform:scale(1); }
      .disc:hover .disc__img img, .disc:focus-visible .disc__img img { filter:grayscale(0) brightness(1); transform:scale(1.04); }
      .disc:hover .disc__img::after, .disc:focus-visible .disc__img::after { background:linear-gradient(180deg,rgba(14,14,16,.34) 0%,rgba(14,14,16,.56) 55%,rgba(14,14,16,.88) 100%); }
      .disc:hover, .disc:focus-visible { transform:translateY(var(--card-lift)); box-shadow:inset 0 0 0 1px var(--blue); z-index:2; }
      /* NB: must exclude .disc__img — it is absolutely positioned. */
      .disc > :not(.disc__img) { position:relative; z-index:1; }
      .disc__no { font-family:var(--font-jetbrains),monospace; font-size:12px; font-weight:600; color:var(--blue-bright); letter-spacing:.2em; }
      .disc__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:30px; line-height:.98; margin:14px 0 12px; }
      .disc__d { font-size:14.5px; color:var(--text-muted); max-width:34ch; }
      .disc__go { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--paper); margin-top:20px; display:inline-flex; gap:8px; align-items:center; }
      .disc__go .ar { color:var(--blue); transition:.3s; }
      .disc:hover .disc__go .ar, .disc:focus-visible .disc__go .ar { transform:translateX(5px); }

      .mani { background:var(--blue); color:#fff; text-align:center; padding:120px 0; }
      .mani__big { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:clamp(32px,6vw,86px); line-height:.95; max-width:18ch; margin:0 auto; letter-spacing:.01em; }
      .mani__sm { font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.28em; text-transform:uppercase; opacity:.85; margin-bottom:30px; }

      .vid-feature { display:grid; grid-template-columns:1.4fr 1fr; gap:1px; background:var(--line-d); border:1px solid var(--line-d); margin-bottom:1px; }
      /* width:100% here is load-bearing. The tiles carry aspect-ratio 16/9, and the old
         height:100% on the second cell made that ratio resolve the wrong way round: it
         derived each tile's WIDTH from the row HEIGHT. Measured at a 1440 viewport the row
         was 401 tall, so both tiles came out 401 x 16/9 = 712 wide and the pair ran to
         x=1527, while every other section on the page stops at 1324. That 200px overhang
         is what made the video block look crooked against everything else. Pinning the
         width to the track makes the ratio set the height again, which is its job.
         The dead gap under the shorter cell is closed by align-items:stretch plus the
         image's object-fit, so no cell has to be told its height. */
      .vid-feature { align-items:stretch; }
      .vid-feature > * { min-width:0; width:100%; }
      .vid-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); border-top:0; }

      .about { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
      .about__img { position:relative; }
      .about__img img { width:100%; filter:grayscale(.2) contrast(1.05); }
      .about__tag { position:absolute; left:-1px; bottom:24px; background:var(--blue); color:#fff; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.18em; text-transform:uppercase; padding:11px 18px; }
      .defs { display:grid; gap:20px; margin-top:8px; }
      .def { border-left:2px solid var(--blue); padding-left:18px; }
      .def h4 { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.16em; text-transform:uppercase; font-weight:600; color:var(--blue-bright); margin-bottom:5px; }
      .def p { font-size:14.5px; color:var(--text-dim); }

      .shop-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
      .prod { background:var(--ink-2); border:1px solid var(--line-d); transition:transform var(--card-t), border-color var(--card-t); display:block; }
      .prod:hover, .prod:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
      /* position:relative: the containing block for the next/image fill inside. */
      .prod__img { position:relative; aspect-ratio:1; overflow:hidden; background:#fff; }
      .prod__img img { width:100%; height:100%; object-fit:cover; transition:.5s; }
      .prod:hover .prod__img img, .prod:focus-visible .prod__img img { transform:scale(1.04); }
      .prod__b { padding:18px; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
      .prod__n { font-size:14px; font-weight:600; line-height:1.3; }
      .prod__p { font-family:var(--font-jetbrains),monospace; font-size:14px; font-weight:600; color:var(--blue-bright); white-space:nowrap; }

      .partners { border-top:1px solid var(--line-d); padding:56px 0; }
      .partners__label { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--ash); text-align:center; margin-bottom:30px; }
      .partners__row { display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
      .partner-chip { background:#fff; height:104px; display:grid; place-items:center; padding:22px 24px; overflow:hidden; transition:background var(--card-t); }
      .partner-chip:hover { background:var(--paper-2); }
      .partner-chip img { max-height:60px; max-width:100%; height:auto; width:auto; object-fit:contain; transition:transform var(--card-t); transform:scale(1); }
      .partner-chip:hover img { transform:scale(1.06); }

      .stats-band { border-bottom:1px solid var(--line-d); padding:44px 0; background:var(--ink-2); }
      .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; }
      .stats-row > * { min-width:0; }
      .stats-band .stat { text-align:center; padding:8px 12px; }
      /* The counters are a measurement taken on a date, so the date travels with
         them, and the page they came from is one click away. */
      .stats-note { display:flex; justify-content:center; align-items:center; gap:14px; flex-wrap:wrap; margin-top:26px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ash); }
      .stats-note a { color:var(--blue); border-bottom:1px solid rgba(0,144,216,.35); }
      .stats-note a:hover, .stats-note a:focus-visible { color:var(--paper); border-bottom-color:var(--paper); }
      .stats-band .stat__v { font-family:var(--font-anton),sans-serif; font-size:clamp(40px,5vw,64px); line-height:1; color:var(--paper); }
      .stats-band .stat__l { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:600; color:var(--blue-bright); margin-top:10px; }

      @media(max-width:1000px){
        .disc-grid { grid-template-columns:repeat(2,1fr); }
        .vid-grid { grid-template-columns:repeat(2,1fr); }
        .shop-grid { grid-template-columns:repeat(2,1fr); }
        .about { grid-template-columns:1fr; gap:36px; }
        .vid-feature { grid-template-columns:1fr; }
        .hero__side { display:none; }
      }
      @media(max-width:760px){
        .stats-row { grid-template-columns:1fr; gap:28px; }
      }
      @media(max-width:640px){
        .disc-grid { grid-template-columns:1fr; }
        .vid-grid { grid-template-columns:1fr; }
        .shop-grid { grid-template-columns:1fr 1fr; }
        .mani { padding:84px 0; }
        .partners__row { grid-template-columns:repeat(2,1fr); }
        .partner-chip { height:88px; }
        .partner-chip img { max-height:48px; }
      }
      @media(prefers-reduced-motion:reduce){
        .hero__bg img { animation:none; transform:none; }
      }
    `}</style>
  );
}
