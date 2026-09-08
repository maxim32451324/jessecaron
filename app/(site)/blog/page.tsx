import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PostCard, { POSTCARD_CSS } from "@/components/PostCard";
import { getPosts, getPillarPosts, getCategories, categoryHref, postGenre } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: "Trainingsgidsen en atletenverhalen rond functionele snelheid en kracht.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndex() {
  const posts = getPosts();
  const guides = posts.filter((p) => postGenre(p.slug) === "guide");
  const profiles = posts.filter((p) => postGenre(p.slug) === "profile");
  const pillars = getPillarPosts();
  const topics = getCategories({ pagesOnly: true }).slice(0, 8);

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Kennis & resultaten"
        sub="Trainingsgidsen die de methode uitleggen, en verhalen van de atleten die ermee groeien."
        image="Loopcoordinatie-Training-Voetbal-e1577925080993.jpg"
      />

      {/* The old sidebar's category cloud, as a strip: the eight biggest archives with
          their counts, and a way through to all of them. */}
      <div className="topics">
        <div className="wrap topics__in">
          <span className="topics__lab">Onderwerpen</span>
          <div className="topics__chips">
            {topics.map((c) => (
              <Link key={c.slug} href={categoryHref(c.slug)} className="chip">
                {c.name} <b>{c.count}</b>
              </Link>
            ))}
            <Link href="/blog/onderwerpen" className="chip chip--all">
              Alle onderwerpen →
            </Link>
          </div>
        </div>
      </div>

      <section className="pad">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">Start hier</span>
              <h2 className="display">De zes die de rest verklaren</h2>
            </div>
          </Reveal>
          {/* The six posts the old site's Blog dropdown promoted, in its order. */}
          <Reveal className="startlist">
            {pillars.map((p, i) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="srow">
                <span className="srow__no">{String(i + 1).padStart(2, "0")}</span>
                <span className="srow__t">{p.title}</span>
                <span className="srow__ar">→</span>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">Trainingsgidsen</span>
              <h2 className="display">De methode uitgelegd</h2>
            </div>
          </Reveal>
          <Reveal className="pgrid">
            {guides.map((p) => (
              <PostCard key={p.slug} p={p} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="pad" style={{ background: "var(--ink-2)" }}>
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="sec-num">Atleten &amp; Resultaten</span>
              <h2 className="display">De mensen achter de methode</h2>
            </div>
          </Reveal>
          <Reveal className="pgrid">
            {profiles.map((p) => (
              <PostCard key={p.slug} p={p} />
            ))}
          </Reveal>
        </div>
      </section>

      <style>{`
        ${POSTCARD_CSS}
        .topics { border-bottom:1px solid var(--line-d); background:var(--ink-2); }
        .topics__in { display:flex; align-items:center; gap:20px; padding-top:18px; padding-bottom:18px; flex-wrap:wrap; }
        .topics__lab { min-width:0; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--ash); }
        .topics__chips { display:flex; flex-wrap:wrap; gap:8px; min-width:0; }
        .chip { display:inline-flex; align-items:center; gap:8px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-muted); border:1px solid var(--line-d); padding:6px 11px; transition:.25s; }
        .chip b { color:var(--blue); font-weight:400; }
        .chip:hover, .chip:focus-visible { border-color:var(--blue); color:var(--paper); }
        .chip--all { color:var(--blue); border-color:rgba(0,144,216,.4); }

        .startlist { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); }
        .srow { min-width:0; background:var(--ink); display:flex; align-items:center; gap:16px; padding:20px 24px; transition:background var(--card-t); }
        .srow:hover, .srow:focus-visible { background:var(--ink-2); }
        .srow__no { font-family:var(--font-jetbrains),monospace; font-size:12px; color:var(--blue); letter-spacing:.2em; }
        .srow__t { flex:1; min-width:0; font-weight:600; font-size:17px; line-height:1.25; overflow-wrap:anywhere; }
        .srow__ar { color:var(--ash); transition:transform var(--card-t), color var(--card-t); }
        .srow:hover .srow__ar, .srow:focus-visible .srow__ar { transform:translateX(5px); color:var(--blue); }
        @media(max-width:760px){ .startlist{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
