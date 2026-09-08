import Link from "next/link";
import { categoriesOf, localImg, type PostMeta } from "@/lib/content";

/**
 * The blog card, lifted out of `app/(site)/blog/page.tsx` so the archives, the
 * "Start hier" row and the related-posts block on a post all show the same object.
 *
 * The CSS travels with it as a string rather than living in `globals.css`, because
 * this site keeps its route CSS in an inline `<style>` per route and a second source
 * of truth for `.pcard` is exactly how the two copies drift. Every route that renders
 * a PostCard embeds `POSTCARD_CSS` at the top of its own style block.
 */
export const POSTCARD_CSS = `
  .pgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  /* min-width:0 is load-bearing on every grid child on this site. The default
     min-width:auto refuses to shrink below the widest unbreakable word — a long
     Dutch compound in a title, or the mono tag chips — and that has already pushed
     three grids (shop cards, footer links, the home video row) past their track. */
  .pcard { min-width:0; background:var(--ink); border:1px solid var(--line-d); display:flex; flex-direction:column; transition:transform var(--card-t), border-color var(--card-t); }
  .pcard:hover, .pcard:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
  .pcard__img { aspect-ratio:16/10; overflow:hidden; background:#000; }
  .pcard__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s, transform .5s; }
  .pcard:hover .pcard__img img, .pcard:focus-visible .pcard__img img { filter:grayscale(0) brightness(1); transform:scale(1.04); }
  .pcard__b { padding:22px 22px 26px; display:flex; flex-direction:column; gap:10px; flex:1; min-width:0; }
  .pcard__meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; }
  .pcard__date { color:var(--blue); }
  .pcard__cat { color:var(--ash); text-transform:uppercase; letter-spacing:.12em; }
  .pcard__cat::before { content:"·"; margin-right:10px; color:var(--line-d); }
  .pcard__t { font-size:20px; font-weight:700; line-height:1.2; overflow-wrap:anywhere; }
  .pcard__ex { font-size:14px; color:var(--text-dim); flex:1; }
  .pcard__tags { display:flex; gap:8px; flex-wrap:wrap; }
  .pcard__tags span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); border:1px solid var(--line-d); padding:3px 8px; }
  @media(max-width:1000px){ .pgrid{ grid-template-columns:repeat(2,1fr);} }
  @media(max-width:640px){ .pgrid{ grid-template-columns:1fr;} }
`;

export default function PostCard({
  p,
  omitCategory,
}: {
  p: PostMeta;
  /**
   * The archive's own term. Printing "Voetbal" on all thirteen cards of
   * /blog/categorie/voetbal says nothing, so the card shows the next-biggest
   * category the post carries instead.
   */
  omitCategory?: string;
}) {
  // Plain text, not a link: this whole card is already an <a>, and an anchor
  // inside an anchor is invalid HTML that browsers silently unnest.
  const cat = categoriesOf(p).find((c) => c.slug !== omitCategory);

  return (
    <Link href={`/blog/${p.slug}`} className="pcard">
      <div className="pcard__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={localImg(p.featured_image)} alt="" loading="lazy" />
      </div>
      <div className="pcard__b">
        <span className="pcard__meta">
          <span className="pcard__date">{p.date}</span>
          {cat ? <span className="pcard__cat">{cat.name}</span> : null}
        </span>
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
