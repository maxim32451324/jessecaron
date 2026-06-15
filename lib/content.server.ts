import "server-only";
import fs from "node:fs";
import path from "node:path";
import { localImg } from "@/lib/content";

const CONTENT_DIR = path.join(process.cwd(), "content");

const INTERNAL_LINK_MAP: Record<string, string> = {
  "/videos/": "/videos",
  "/blog/": "/blog",
  "/contact/": "/contact",
  "/aanmelden/": "/aanmelden",
  "/shop/": "/shop",
  "/functionele-kracht-trainen/": "/training/functionele-kracht-trainen",
  "/functionele-snelheid-trainen/": "/training/functionele-snelheid-trainen",
  "/personal-training/": "/training/personal-training",
  "/loopscholing/": "/training/loopscholing",
  "/groepstrainingen/": "/training/groepstrainingen",
};

function rewriteMarkdown(md: string): string {
  return md.replace(/\((https?:\/\/(?:www\.)?jessecaron\.com[^)\s]*)\)/g, (_m, url: string) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return `(${localImg(url)})`;
    const pathPart = url.replace(/^https?:\/\/(?:www\.)?jessecaron\.com/, "");
    if (INTERNAL_LINK_MAP[pathPart]) return `(${INTERNAL_LINK_MAP[pathPart]})`;
    return `(${url})`;
  });
}

function readBody(kind: "pages" | "posts" | "products", slug: string): string {
  const file = path.join(CONTENT_DIR, kind, `${slug}.md`);
  if (!fs.existsSync(file)) return "";
  const raw = fs.readFileSync(file, "utf8");
  const sep = raw.indexOf("\n---");
  let body = sep >= 0 ? raw.slice(raw.indexOf("\n", sep + 1) + 1) : raw;
  return rewriteMarkdown(body.trim());
}

export function getPageBody(slug: string): string {
  return readBody("pages", slug);
}
export function getPostBody(slug: string): string {
  return readBody("posts", slug);
}
export function getProductBody(slug: string): string {
  return readBody("products", slug);
}
