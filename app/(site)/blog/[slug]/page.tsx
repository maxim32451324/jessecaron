import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Markdown from "@/components/Markdown";
import { getPost, getPosts } from "@/lib/content";
import { getPostBody } from "@/lib/content.server";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

/** Only the slugs generateStaticParams lists may answer here; anything else is a 404.
 *  Without this Next renders unknown slugs on demand, which is how three Lorem ipsum
 *  pages were live under /training. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const body = getPostBody(slug);

  return (
    <>
      <PageHero eyebrow={post.date} title={post.title} image={post.featured_image} />
      <article className="pad">
        <div className="wrap">
          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <Markdown>{body}</Markdown>
          <div style={{ marginTop: 56, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/blog" className="btn">
              ← Alle artikelen
            </Link>
            <Link href="/aanmelden" className="btn btn--blue">
              Meld je aan ↗
            </Link>
          </div>
        </div>
      </article>
      <style>{`
        .post-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:36px; }
        .post-tags span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); border:1px solid var(--line-d); padding:4px 9px; }
      `}</style>
    </>
  );
}
