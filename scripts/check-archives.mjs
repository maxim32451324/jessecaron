/**
 * Asserts that the eighteen category archives were actually built, that each one lists
 * exactly the posts it should in exactly the order it should, and that the taxonomy
 * furniture on the 27 post pages resolves.
 *
 * WHY THIS EXISTS
 *
 * `/blog/categorie/<slug>` is generated from two sources that can drift apart without
 * anything visibly breaking: `taxonomy.json` decides WHICH archives exist (`page: true`),
 * and `content.json` `posts[].categories` decides WHAT is on each one. A post that loses
 * a category slug, a category whose `page` flag is flipped, or a change to the sort
 * comparator all produce a page that still renders, still looks right, and is quietly
 * wrong. Eyeballing one archive proves nothing about the other seventeen.
 *
 * So this reads the data, computes the expected list of post slugs per archive itself
 * — from the raw JSON, deliberately not by importing lib/content.ts, so that a bug in
 * the accessor cannot agree with itself — and compares that against the order of the
 * `<a class="pcard">` hrefs in the prerendered HTML that `next build` wrote.
 *
 * The sort is date-descending, ties broken on slug. The tie-break is load-bearing:
 * `kleurplaat` and `flickmyhouse-sponsort-jubileum-activiteiten-jesse-caron` share
 * 2016-11-30 and share three archives, so without it the order of two cards is
 * whatever V8's sort happened to do that day.
 *
 * USAGE
 *   npm run build && npm run check:archives
 * (it fails with an explanatory message if the build output is not there).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, ".next/server/app");
const OUT = path.join(APP, "blog/categorie");

const taxonomy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content/data/taxonomy.json"), "utf8"),
);
const content = JSON.parse(fs.readFileSync(path.join(ROOT, "content/data/content.json"), "utf8"));

/**
 * Filter on `count > 0`, never on array length: `interview` is still a row in
 * taxonomy.json after being merged into `interviews`, with count 0, and so are the two
 * categories that never had a post.
 */
const HIDDEN = new Set(["geen-categorie", "interview"]);
const archives = taxonomy.categories
  .filter((c) => c.page && c.count > 0 && !HIDDEN.has(c.slug))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"));

/** Newest first, ties on slug — the comparator `lib/content.ts` promises. */
function byDateThenSlug(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.slug.localeCompare(b.slug);
}

function expectedFor(slug) {
  return content.posts
    .filter((p) => (p.categories ?? []).includes(slug))
    .sort(byDateThenSlug)
    .map((p) => p.slug);
}

/** Hrefs of the anchors carrying `cls`, in document order. */
function hrefsWithClass(html, cls) {
  const hasClass = new RegExp(`\\bclass="[^"]*\\b${cls}\\b[^"]*"`, "i");
  const out = [];
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    if (!hasClass.test(tag)) continue;
    const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
    if (href) out.push(href);
  }
  return out;
}

/** Does this internal path exist as a page `next build` prerendered? */
function routeExists(href) {
  return fs.existsSync(path.join(APP, `${href.replace(/^\//, "")}.html`));
}

/**
 * The card slugs of one archive, in document order. Matching on the `pcard` class
 * rather than on every `/blog/*` href keeps the "verder in het archief" chips, the
 * breadcrumb JSON-LD and the footer out of the comparison — this asserts the GRID,
 * not the page.
 */
function renderedFor(slug) {
  const file = path.join(OUT, `${slug}.html`);
  if (!fs.existsSync(file)) return null;
  return hrefsWithClass(fs.readFileSync(file, "utf8"), "pcard")
    .map((href) => href.match(/^\/blog\/([^/"#?]+)$/)?.[1])
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
if (!fs.existsSync(OUT)) {
  console.error(
    `\ncheck-archives: no build output at ${path.relative(ROOT, OUT)}.\n` +
      "Run `npm run build` first — this checks the rendered pages, not the source.\n",
  );
  process.exit(1);
}

const built = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""))
  .sort();

const failures = [];

console.log(`check-archives: archives — ${archives.length} expected, ${built.length} built.\n`);

if (archives.length !== 18) {
  failures.push(
    `taxonomy.json declares ${archives.length} archives with page:true and count>0, expected 18`,
  );
}

const expectedSlugs = [...archives.map((c) => c.slug)].sort();
const extra = built.filter((s) => !expectedSlugs.includes(s));
const missing = expectedSlugs.filter((s) => !built.includes(s));
if (extra.length) failures.push(`built but not declared: ${extra.join(", ")}`);
if (missing.length) failures.push(`declared but not built: ${missing.join(", ")}`);

for (const cat of archives) {
  const expected = expectedFor(cat.slug);
  const rendered = renderedFor(cat.slug);

  if (rendered === null) {
    console.log(`  FAIL  ${cat.slug.padEnd(22)} not rendered`);
    failures.push(`${cat.slug}: no prerendered HTML`);
    continue;
  }

  const countOk = cat.count === expected.length;
  const orderOk = rendered.length === expected.length && rendered.every((s, i) => s === expected[i]);

  if (countOk && orderOk) {
    console.log(
      `  ok    ${cat.slug.padEnd(22)} ${String(expected.length).padStart(2)} cards  first: ${expected[0]}`,
    );
    continue;
  }

  console.log(`  FAIL  ${cat.slug.padEnd(22)} ${rendered.length} cards, expected ${expected.length}`);
  if (!countOk) {
    failures.push(
      `${cat.slug}: taxonomy count ${cat.count} but ${expected.length} posts carry the slug`,
    );
  }
  if (!orderOk) {
    failures.push(`${cat.slug}: rendered order differs`);
    console.log(`          expected: ${expected.join(", ")}`);
    console.log(`          rendered: ${rendered.join(", ")}`);
  }
}

// ---------------------------------------------------------------------------
// The post pages: the category line, prev/next and related must all resolve.
// An archive nobody can reach from an article is a page that exists and does no work.
const RELATED = 3;
console.log(`\ncheck-archives: post pages — ${content.posts.length} expected.\n`);

for (const post of [...content.posts].sort(byDateThenSlug)) {
  const file = path.join(APP, "blog", `${post.slug}.html`);
  if (!fs.existsSync(file)) {
    failures.push(`${post.slug}: no prerendered HTML`);
    console.log(`  FAIL  ${post.slug} not rendered`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const cats = hrefsWithClass(html, "post-cat");
  const adj = hrefsWithClass(html, "adj");
  const rel = hrefsWithClass(html, "pcard");
  const problems = [];

  // Exactly one post — `bosu-trainingsmateriaal`, filed only under `geen-categorie` —
  // has no archive of its own to link to and falls back to the topics index. That is
  // still a live link to a real page, which is what this line has to guarantee.
  if (!cats.length) problems.push("no linked category");
  for (const href of [...cats, ...adj, ...rel]) {
    if (!routeExists(href)) problems.push(`dead link ${href}`);
  }
  if (rel.length !== RELATED) problems.push(`${rel.length} related, expected ${RELATED}`);
  if (rel.includes(`/blog/${post.slug}`)) problems.push("related includes itself");
  if (adj.includes(`/blog/${post.slug}`)) problems.push("prev/next points at itself");

  if (problems.length) {
    failures.push(`${post.slug}: ${problems.join("; ")}`);
    console.log(`  FAIL  ${post.slug.padEnd(66)} ${problems.join("; ")}`);
  } else {
    console.log(
      `  ok    ${post.slug.padEnd(66)} cats ${String(cats.length).padStart(2)}  prev/next ${adj.length}  related ${rel.length}`,
    );
  }
}

/** The plan names these two numbers explicitly; check them by name, not by inference. */
const voetbal = expectedFor("voetbal");
if (voetbal.length !== 13) failures.push(`voetbal: ${voetbal.length} posts, plan says 13`);
if (voetbal[0] !== "handelingssnelheid-trainen-voetbal-met-smartgoals") {
  failures.push(
    `voetbal: first card is ${voetbal[0]}, plan says handelingssnelheid-trainen-voetbal-met-smartgoals`,
  );
}

if (failures.length) {
  console.error(`\ncheck-archives: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

const total = archives.reduce((n, c) => n + c.count, 0);
console.log(
  `\ncheck-archives: ${archives.length} archives, ${total} cards, every one in date-desc order and` +
    ` matching content.json; ${content.posts.length} post pages with a linked category,` +
    ` working prev/next and ${RELATED} related posts each.`,
);
