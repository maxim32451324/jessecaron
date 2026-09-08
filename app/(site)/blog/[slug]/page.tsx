import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import Reveal from "@/components/Reveal";
import PostCard, { POSTCARD_CSS } from "@/components/PostCard";
import {
  getPost,
  getPosts,
  categoriesOf,
  categoryHref,
  adjacentPosts,
  relatedPosts,
  localImg,
  type PostMeta,
} from "@/lib/content";
import { getPostBody } from "@/lib/content.server";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

/** Only the slugs generateStaticParams lists may answer here; anything else is a 404.
 *  Without this Next renders unknown slugs on demand, which is how three Lorem ipsum
 *  pages were live under /training. */
export const dynamicParams = false;

/** How many category links the line prints before it collapses into "+n". */
const MAX_CATS = 6;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const image = localImg(post.featured_image);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.date || undefined,
      tags: post.tags,
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
  };
}

/** Prev/next: two small cards, so the end of an article is a door and not a dead end. */
function AdjacentCard({ p, dir }: { p: PostMeta; dir: "prev" | "next" }) {
  return (
    <Link href={`/blog/${p.slug}`} className="adj">
      <div className="adj__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={localImg(p.featured_image)} alt="" loading="lazy" />
      </div>
      <div className="adj__b">
        <span className="adj__lab">{dir === "prev" ? "← Ouder artikel" : "Nieuwer artikel →"}</span>
        <span className="adj__t">{p.title}</span>
      </div>
    </Link>
  );
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const body = getPostBody(slug);

  const cats = categoriesOf(post);
  const shown = cats.slice(0, MAX_CATS);
  const overflow = cats.length - shown.length;
  const { prev, next } = adjacentPosts(slug);
  const related = relatedPosts(slug, 3);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
      ...(cats[0]
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: cats[0].name,
              item: `${SITE_URL}${categoryHref(cats[0].slug)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: cats[0] ? 3 : 2,
        name: post.title,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
    url: `${SITE_URL}/blog/${slug}`,
    image: post.featured_image ? `${SITE_URL}${localImg(post.featured_image)}` : undefined,
    author: { "@type": "Person", name: "Jesse Caron", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Jesse Caron", url: SITE_URL },
    keywords: post.tags.join(", "),
    articleSection: cats.map((c) => c.name),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
      />

      <PageHero
        eyebrow={`Blog / ${cats[0]?.name ?? "Artikel"}`}
        title={post.title}
        image={post.featured_image}
      />

      <article className="pad">
        <div className="wrap">
          {/* Category line. Linked terms only — a label that goes nowhere is worse than
              no label. `bosu-trainingsmateriaal` sits in `geen-categorie` and nothing
              else, so it falls through to the topics index rather than printing
              "Uncategorized", which is WordPress's word for "we never filed this". */}
          <div className="post-meta">
            <span className="post-date">{post.date}</span>
            <div className="post-cats">
              {shown.length ? (
                <>
                  {shown.map((c) => (
                    <Link key={c.slug} href={categoryHref(c.slug)} className="post-cat">
                      {c.name}
                    </Link>
                  ))}
                  {overflow > 0 ? (
                    <Link href="/blog/onderwerpen" className="post-cat post-cat--more">
                      +{overflow}
                    </Link>
                  ) : null}
                </>
              ) : (
                <Link href="/blog/onderwerpen" className="post-cat post-cat--more">
                  Alle onderwerpen
                </Link>
              )}
            </div>
          </div>

          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          <Markdown>{body}</Markdown>

          <div className="post-cta">
            <Link href="/blog" className="btn">
              ← Alle artikelen
            </Link>
            <Link href="/aanmelden" className="btn btn--blue">
              Meld je aan ↗
            </Link>
          </div>
        </div>
      </article>

      {prev || next ? (
        <section className="pad" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="adjgrid">
              {prev ? <AdjacentCard p={prev} dir="prev" /> : <span />}
              {next ? <AdjacentCard p={next} dir="next" /> : <span />}
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="pad" style={{ background: "var(--ink-2)" }}>
          <div className="wrap">
            <Reveal className="sec-head">
              <div>
                <span className="sec-num">Verder lezen</span>
                <h2 className="display">In dezelfde onderwerpen</h2>
              </div>
            </Reveal>
            <Reveal className="pgrid">
              {related.map((p) => (
                <PostCard key={p.slug} p={p} />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <style>{`
        ${POSTCARD_CSS}
        .post-meta { display:flex; align-items:baseline; gap:16px; flex-wrap:wrap; padding-bottom:16px; border-bottom:1px solid var(--line-d); margin-bottom:18px; }
        .post-date { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.16em; color:var(--blue); }
        .post-cats { display:flex; gap:8px; flex-wrap:wrap; min-width:0; }
        .post-cat { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-muted); border:1px solid var(--line-d); padding:5px 10px; transition:.25s; }
        .post-cat:hover, .post-cat:focus-visible { border-color:var(--blue); color:var(--paper); }
        .post-cat--more { color:var(--ash); }
        .post-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:36px; }
        .post-tags span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); border:1px solid var(--line-d); padding:4px 9px; }
        .post-cta { margin-top:56px; display:flex; gap:14px; flex-wrap:wrap; }

        .adjgrid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
        .adj { min-width:0; display:flex; gap:18px; align-items:center; background:var(--ink); border:1px solid var(--line-d); padding:16px; transition:transform var(--card-t), border-color var(--card-t); }
        .adj:hover, .adj:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
        .adj__img { flex:0 0 96px; width:96px; aspect-ratio:1/1; overflow:hidden; background:#000; }
        .adj__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s; }
        .adj:hover .adj__img img, .adj:focus-visible .adj__img img { filter:grayscale(0) brightness(1); }
        .adj__b { min-width:0; display:flex; flex-direction:column; gap:8px; }
        .adj__lab { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--blue); }
        .adj__t { font-size:16px; font-weight:600; line-height:1.25; overflow-wrap:anywhere; }
        @media(max-width:760px){ .adjgrid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
