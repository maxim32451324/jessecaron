import { categoryHref, getCategories, getTrainingPages } from "@/lib/content";
import NavClient, { type NavSub } from "./NavClient";

/**
 * The nav's data half.
 *
 * This is a server component on purpose. `lib/content.ts` is client-safe, but it
 * pulls in content.json (~96KB) and taxonomy.json (~72KB); importing it from the
 * client component would ship both to every visitor for the sake of nineteen
 * labels. Reading it here sends only the labels.
 *
 * It also means `app/(site)/layout.tsx` still imports `@/components/Nav` and
 * renders `<Nav />` exactly as before — the split is invisible from outside.
 */

/** Eighteen archives is a wall. Eight plus "alle onderwerpen" is a menu. */
const TOPICS_IN_MENU = 8;

export default function Nav() {
  const training: NavSub[] = getTrainingPages().map((p) => ({
    href: `/training/${p.slug}`,
    label: p.title,
  }));

  const allTopics = getCategories({ pagesOnly: true });
  const topics: NavSub[] = allTopics.slice(0, TOPICS_IN_MENU).map((c) => ({
    href: categoryHref(c.slug),
    label: c.name,
    meta: String(c.count),
  }));

  return <NavClient training={training} topics={topics} topicTotal={allTopics.length} />;
}
