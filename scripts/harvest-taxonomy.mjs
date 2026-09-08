/**
 * Harvests the old WordPress taxonomy into `content/data/taxonomy.json` and stamps
 * each post in `content/data/content.json` with the category and tag slugs the old
 * site gave it.
 *
 * WHY THIS EXISTS
 *
 * The markdown export that seeded this repo carried tag *names* on posts and nothing
 * else — no categories, no slugs. Categories are what the old site actually organised
 * itself by (the sidebar "tag cloud" is a category cloud, and `/category/<slug>/` is a
 * real URL with inbound links), so without them we cannot build the archive pages, the
 * category line on a post, related posts, or an honest redirect map. Names are not
 * enough: "Coördinatie" the tag and `coordinatie` the category are different things
 * that happen to read alike, and only the slug survives a URL.
 *
 * WHY IT RE-RUNS AGAINST THE LIVE API RATHER THAN A CACHED DUMP
 *
 * The old WordPress is still up and is the only authority for these numbers. Counts
 * drift if anyone touches the old site, and the redirect map has to match reality on
 * the day the domain moves. So this script is idempotent: run it again, get the current
 * truth, diff the JSON. It is deliberately polite about it — sequential GETs with a
 * small delay, no writes, a normal browser UA — because it is pointed at a client's
 * production site.
 *
 * WHY THE HARVEST IS ADDITIVE
 *
 * `content.json` is hand-edited elsewhere (copy, lexicon, products) and by other agents.
 * This script only ever *adds* `categories` and `tag_slugs` to an existing post object,
 * keyed on `slug`, and rewrites nothing else. It refuses to run if a post it has data
 * for is missing from the file, rather than inventing an entry.
 *
 * Usage:  node scripts/harvest-taxonomy.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API = "https://www.jessecaron.com/wp-json/wp/v2";
const TAXONOMY_FILE = path.join(ROOT, "content/data/taxonomy.json");
const CONTENT_FILE = path.join(ROOT, "content/data/content.json");

/** A category becomes an archive page at this many posts. §2 of the parity plan. */
const PAGE_THRESHOLD = 5;

/**
 * Terms the old site duplicated. `interview` (1 post) and `interviews` (5) are the same
 * word twice; WordPress let both exist because they were typed on different days. The
 * merge is lossless here — the one `interview` post does not also carry `interviews` —
 * so no post loses a category and the totals still reconcile. The dead slug stays in
 * taxonomy.json carrying `merged_into` so the redirect map can point `/category/interview/`
 * at the surviving archive instead of guessing.
 */
const MERGE = { interview: "interviews" };

/**
 * Never an archive page whatever its count. "Geen categorie" is WordPress's fallback
 * bucket, not a topic anyone would browse.
 */
const NEVER_A_PAGE = new Set(["geen-categorie"]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Pages through a WP REST collection. Sequential and slowed on purpose: this hits a
 * live client site, and a burst of parallel requests is the thing that gets a harvester
 * blocked at the CDN.
 */
async function getAll(endpoint, fields) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API}/${endpoint}?per_page=100&page=${page}&_fields=${fields.join(",")}`;
    const res = await fetch(url, {
      headers: {
        // A normal UA: some hosts serve 403 to anything that looks automated, and we
        // are only reading pages a browser could read anyway.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
    if (page === 1) totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1);
    const batch = await res.json();
    out.push(...batch);
    page++;
    if (page <= totalPages) await sleep(300);
  } while (page <= totalPages);
  return out;
}

/** count desc, then name — the order the archive index and the old cloud both read in. */
const byCountThenName = (a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl");

async function main() {
  console.log(`harvest-taxonomy: reading ${API}`);

  const rawCategories = await getAll("categories", ["id", "slug", "name", "count", "description"]);
  await sleep(300);
  const rawTags = await getAll("tags", ["id", "slug", "name", "count", "description"]);
  await sleep(300);
  const rawPosts = await getAll("posts", ["id", "slug", "categories", "tags"]);

  console.log(
    `harvest-taxonomy: fetched ${rawCategories.length} categories, ${rawTags.length} tags, ${rawPosts.length} posts`,
  );

  // --- Categories, with the duplicate term folded in ------------------------------
  const catBySlug = new Map(rawCategories.map((c) => [c.slug, c]));
  for (const [dead, alive] of Object.entries(MERGE)) {
    const from = catBySlug.get(dead);
    const to = catBySlug.get(alive);
    // If the client cleaned this up on the old site, the merge is simply a no-op.
    if (!from || !to) continue;
    to.count += from.count;
    from.count = 0;
    from.merged_into = alive;
  }

  const categories = rawCategories
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      count: c.count,
      description: c.description ?? "",
      page: c.count >= PAGE_THRESHOLD && !NEVER_A_PAGE.has(c.slug) && !c.merged_into,
      ...(c.merged_into ? { merged_into: c.merged_into } : {}),
    }))
    .sort(byCountThenName);

  const tags = rawTags
    .map((t) => ({ id: t.id, slug: t.slug, name: t.name, count: t.count }))
    .sort(byCountThenName);

  // --- Post → slug arrays ---------------------------------------------------------
  const catSlugById = new Map(rawCategories.map((c) => [c.id, MERGE[c.slug] ?? c.slug]));
  const tagSlugById = new Map(rawTags.map((t) => [t.id, t.slug]));

  const perPost = new Map();
  for (const post of rawPosts) {
    // Dedupe after the merge: a post carrying both halves of a merged pair must not
    // count the surviving slug twice. Sorted so a re-run produces a byte-identical file.
    const cats = [...new Set(post.categories.map((id) => catSlugById.get(id)).filter(Boolean))].sort();
    const tagSlugs = [...new Set(post.tags.map((id) => tagSlugById.get(id)).filter(Boolean))].sort();
    perPost.set(post.slug, { categories: cats, tag_slugs: tagSlugs });
  }

  // --- Write taxonomy.json --------------------------------------------------------
  const taxonomy = {
    generated: new Date().toISOString(),
    source: API,
    categories,
    tags,
  };
  fs.mkdirSync(path.dirname(TAXONOMY_FILE), { recursive: true });
  fs.writeFileSync(TAXONOMY_FILE, JSON.stringify(taxonomy, null, 2) + "\n");

  // --- Extend content.json, additively --------------------------------------------
  // Read as late as possible: other agents write this same file, and the window between
  // read and write is the only place we can clobber them.
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
  const missing = [];
  let stamped = 0;
  for (const [slug, data] of perPost) {
    const entry = content.posts?.find((p) => p.slug === slug);
    if (!entry) {
      missing.push(slug);
      continue;
    }
    // Assign rather than rebuild: existing keys keep their values and their order,
    // and the two new keys land at the end.
    entry.categories = data.categories;
    entry.tag_slugs = data.tag_slugs;
    stamped++;
  }
  if (missing.length) {
    throw new Error(
      `content.json has no post for: ${missing.join(", ")}. ` +
        `Add the post first — this script never invents entries.`,
    );
  }
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2) + "\n");

  // --- Gate (parity plan §10, Phase 1) --------------------------------------------
  const tagsWithPosts = tags.filter((t) => t.count > 0).length;
  const pages = categories.filter((c) => c.page);
  const knownSlugs = new Set(categories.map((c) => c.slug));
  const postsWithoutCategory = content.posts.filter(
    (p) => !(p.categories ?? []).some((s) => knownSlugs.has(s)),
  );
  const sumCategoryCounts = categories.reduce((a, c) => a + c.count, 0);
  const sumPostCategories = content.posts.reduce((a, p) => a + (p.categories?.length ?? 0), 0);
  const merged = Object.entries(MERGE)
    .map(([dead, alive]) => {
      const d = categories.find((c) => c.slug === dead);
      const a = categories.find((c) => c.slug === alive);
      return `${dead} (now ${d?.count ?? "gone"}) → ${alive} (${a?.count ?? "gone"})`;
    })
    .join(", ");

  console.log("");
  console.log(`  categories written ............ ${categories.length}`);
  console.log(`  categories with page:true ..... ${pages.length} (count >= ${PAGE_THRESHOLD})`);
  console.log(`  tags written .................. ${tags.length}`);
  console.log(`  tags with count > 0 ........... ${tagsWithPosts}`);
  console.log(`  posts stamped ................. ${stamped} of ${content.posts.length}`);
  console.log(`  posts with no known category .. ${postsWithoutCategory.length}`);
  console.log(`  interview merge ............... ${merged}`);
  console.log(`  sum of category counts ........ ${sumCategoryCounts}`);
  console.log(`  sum of posts[].categories ..... ${sumPostCategories}`);
  console.log("");

  const failures = [];
  if (categories.length !== 70) failures.push(`expected 70 categories, got ${categories.length}`);
  if (tags.length !== 597) failures.push(`expected 597 tags, got ${tags.length}`);
  if (tagsWithPosts !== 261) failures.push(`expected 261 tags with count>0, got ${tagsWithPosts}`);
  if (stamped !== 27) failures.push(`expected to stamp 27 posts, stamped ${stamped}`);
  if (postsWithoutCategory.length) {
    failures.push(`posts with no known category: ${postsWithoutCategory.map((p) => p.slug).join(", ")}`);
  }
  if (sumCategoryCounts !== sumPostCategories) {
    failures.push(`counts do not reconcile: ${sumCategoryCounts} != ${sumPostCategories}`);
  }

  if (failures.length) {
    // Not fatal to the write — the files are the truth of what the API said, and a
    // changed number is information, not corruption. But it must be loud.
    console.error("harvest-taxonomy: GATE FAILED");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log("harvest-taxonomy: gate passed.");
}

main().catch((err) => {
  console.error(`harvest-taxonomy: ${err.message}`);
  process.exit(1);
});
