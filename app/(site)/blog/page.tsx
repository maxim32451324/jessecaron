import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getPosts, postGenre, localImg, type PostMeta } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Trainingsgidsen en atletenverhalen rond functionele snelheid en kracht.",
};

function PostCard({ p }: { p: PostMeta }) {
  return (
    <Link href={`/blog/${p.slug}`} className="pcard">
      <div className="pcard__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={localImg(p.featured_image)} alt="" loading="lazy" />
      </div>
      <div className="pcard__b">
        <span className="pcard__date">{p.date}</span>
        <h3 className="pcard__t">{p.title}</h3>
        <p className="pcard__ex">{p.excerpt.slice(0, 120)}…</p>
        <div className="pcard__tags">
          {p.tags.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function BlogIndex() {
  const posts = getPosts();
  const guides = posts.filter((p) => postGenre(p.slug) === "guide");
  const profiles = posts.filter((p) => postGenre(p.slug) === "profile");

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Kennis & resultaten"
        sub="Trainingsgidsen die de methode uitleggen, en verhalen van de atleten die ermee groeien."
      />

      <section className="pad">
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
        .pgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .pcard { background:var(--ink); border:1px solid var(--line-d); display:flex; flex-direction:column; transition:.3s; }
        .pcard:hover { transform:translateY(-5px); border-color:var(--blue); }
        .pcard__img { aspect-ratio:16/10; overflow:hidden; background:#000; }
        .pcard__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.4) brightness(.8); transition:.5s; }
        .pcard:hover .pcard__img img { filter:grayscale(0) brightness(.95); transform:scale(1.05); }
        .pcard__b { padding:22px 22px 26px; display:flex; flex-direction:column; gap:10px; flex:1; }
        .pcard__date { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; color:var(--blue); }
        .pcard__t { font-size:20px; font-weight:700; line-height:1.2; }
        .pcard__ex { font-size:14px; color:#a9a9a5; flex:1; }
        .pcard__tags { display:flex; gap:8px; flex-wrap:wrap; }
        .pcard__tags span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); border:1px solid var(--line-d); padding:3px 8px; }
        @media(max-width:1000px){ .pgrid{ grid-template-columns:repeat(2,1fr);} }
        @media(max-width:640px){ .pgrid{ grid-template-columns:1fr;} }
      `}</style>
    </>
  );
}
