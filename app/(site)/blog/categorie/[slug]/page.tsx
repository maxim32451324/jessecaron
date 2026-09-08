import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PostCard, { POSTCARD_CSS } from "@/components/PostCard";
import { getCategories, getCategory, getPostsInCategory, categoryHref } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/** The eighteen terms with >= 5 posts. Everything else is a label, not a page. */
export function generateStaticParams() {
  return getCategories({ pagesOnly: true }).map((c) => ({ slug: c.slug }));
}

/** Only those eighteen may answer here — see the same note on blog/[slug]. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  const n = getPostsInCategory(slug).length;
  return {
    title: `${cat.name} — Blog`,
    // The client's own paragraph the moment it exists (see the note in the body);
    // until then a description that states a fact instead of inventing a claim.
    description:
      cat.description ||
      `${n} ${n === 1 ? "artikel" : "artikelen"} van Jesse Caron over ${cat.name.toLowerCase()}.`,
    alternates: { canonical: `${SITE_URL}${categoryHref(slug)}` },
  };
}

export default async function CategoryArchive({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat || !cat.page) notFound();

  const posts = getPostsInCategory(slug);
  const others = getCategories({ pagesOnly: true }).filter((c) => c.slug !== slug);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 2, name: "Onderwerpen", item: `${SITE_URL}/blog/onderwerpen` },
      { "@type": "ListItem", position: 3, name: cat.name, item: `${SITE_URL}${categoryHref(slug)}` },
    ],
  };

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} — Blog`,
    url: `${SITE_URL}${categoryHref(slug)}`,
    isPartOf: { "@type": "Blog", name: "Jesse Caron — Blog", url: `${SITE_URL}/blog` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }}
      />

      <PageHero
        eyebrow={`Blog / ${cat.name}`}
        title={cat.name}
        image={posts[0]?.featured_image}
      />

      <section className="pad">
        <div className="wrap">
          <div className="arch-bar">
            <span className="arch-count">
              {posts.length} {posts.length === 1 ? "artikel" : "artikelen"}
            </span>
            <Link href="/blog/onderwerpen" className="arch-all">
              Alle onderwerpen →
            </Link>
          </div>

          {/*
            ARCHIVE INTRO COPY GOES HERE — and only here.

            All 70 category descriptions are empty on the old WordPress site, so there
            is no intro paragraph to migrate and none has been written: inventing prose
            about a real trainer's method and shipping it under his name is not this
            build's job (PARITY-PLAN §11 Q3 puts the eighteen paragraphs in front of the
            client for approval).

            The hole is a data field, not a TODO in a component. Fill
            `description` for a category in `content/data/taxonomy.json` and it renders
            below, is used as the page's meta description, and needs no code change.
            Until then the archive is a hero, a count and the cards — which reads as a
            deliberate index rather than as a page with a piece missing.
          */}
          {cat.description ? (
            <div className="prose arch-intro">
              <p>{cat.description}</p>
            </div>
          ) : null}

          <Reveal className="pgrid">
            {posts.map((p) => (
              <PostCard key={p.slug} p={p} omitCategory={slug} />
            ))}
          </Reveal>

          <div className="arch-nav">
            <span className="sec-num">Verder in het archief</span>
            <div className="arch-chips">
              {others.map((c) => (
                <Link key={c.slug} href={categoryHref(c.slug)} className="chip">
                  {c.name} <b>{c.count}</b>
                </Link>
              ))}
            </div>
          </div>

          <div className="arch-cta">
            <Link href="/blog" className="btn">
              ← Alle artikelen
            </Link>
            <Link href="/aanmelden" className="btn btn--blue">
              Meld je aan ↗
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        ${POSTCARD_CSS}
        .arch-bar { display:flex; justify-content:space-between; align-items:baseline; gap:20px; flex-wrap:wrap; margin-bottom:32px; padding-bottom:16px; border-bottom:1px solid var(--line-d); }
        .arch-count { font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.2em; text-transform:uppercase; color:var(--blue); }
        .arch-all { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ash); }
        .arch-all:hover, .arch-all:focus-visible { color:var(--paper); }
        .arch-intro { margin-bottom:40px; }
        .arch-nav { margin-top:64px; padding-top:34px; border-top:1px solid var(--line-d); }
        .arch-chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }
        .chip { display:inline-flex; align-items:center; gap:8px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-muted); border:1px solid var(--line-d); padding:7px 12px; transition:.25s; }
        .chip b { color:var(--blue); font-weight:400; }
        .chip:hover, .chip:focus-visible { border-color:var(--blue); color:var(--paper); }
        .arch-cta { display:flex; gap:14px; flex-wrap:wrap; margin-top:44px; }
      `}</style>
    </>
  );
}
