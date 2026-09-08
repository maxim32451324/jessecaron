# PARITY PLAN — jessecaron.com (WordPress) → jessecaron (Next.js)

Written 2026-09-08 from a fresh probe of `https://www.jessecaron.com/wp-json/wp/v2/*`, the old site's
rendered HTML (home, `/blog/`, `/category/voetbal/`, `/tag/voetbal/`, one single post, the testimonials
archives) and the code in `C:\Users\J\jessecaron` at commit `4eb71ac`. Every number below was measured,
not copied from the brief. Where the brief and the probe disagree, §12 says so.

Companion documents: `MASTERPLAN.md` (the original build), `README.md`, `DEPLOY.md`.
This plan is only about the public marketing site. The academy/admin half is untouched by it and,
with the Supabase project gone, is out of scope for parity (see §12).

---

## 0. Headline

The old site is not "much bigger" in the way the numbers suggest. Of 138 pages, **85 are Malmö
theme-demo pages (lorem ipsum, `/elements/*`, `/shop-lists/*`, `/our-team-2/`)**, 16 are WooCommerce
plumbing, 7 are empty or broken stubs, 8 are old versions of routes the new site already has, and
**5 carry real content worth moving** (`/data/`, `/records/`, `/schoolsport-vereniging-rotterdam-atletiek/`,
`/stretching/`, `/strenght-stability/`). Of 1,065 media items, 720 are referenced by nothing at all;
the 27 posts reference 50 images and **all 50 are already local**.

What genuinely did not come across, and what the client is actually seeing:

1. **The taxonomy.** 70 categories and 597 tags exist on the old site, all 27 posts are wired to
   them, and the single-post sidebar shows a category cloud with per-term counts. The new site has
   zero archive pages and shows tag names as dead chips.
2. **The training pages' imagery.** The export dropped every WPBakery `[vc_single_image]` shortcode.
   Twelve of the fifteen kept pages reference **no images at all** in their markdown; the old
   `/loopscholing/` showed 9, `/functionele-kracht-trainen/` 6, `/personal-training/` 3. 22 of those
   images are not on disk. This, not the 720 orphaned uploads, is the "lots more imagery" gap.
3. **Blog furniture.** No prev/next post, no category line, no related posts, no author.

Scope recommendation in one line: **build 18 category archives + one topics index, rewire the 27
posts to them, restore ~30 images to the training pages, harvest 3 real pages, add a 300-line
redirect map — and deliberately do not build 597 tag pages, 85 demo pages, or a sidebar.**

---

## 1. Content inventory

### 1.1 Totals (X-WP-Total headers, 2026-09-08)

| Resource | Old site | New site | Came across | Missing | Verdict |
|---|---|---|---|---|---|
| Posts (`/wp/v2/posts`) | 27 | 27 (`content/posts/*.md`) | 27 | 0 | Complete. Bodies, dates, featured images, tag **names** present. Category membership absent. |
| Pages (`/wp/v2/pages`) | 138 | **15** (`content/pages/*.md`, `content.json.pages`) | 15 | 123 | See §1.3 — 5 worth harvesting. README says 17; the repo holds 15. |
| Categories | 70 (68 with ≥1 post) | 0 | 0 | 70 | Build the 18 with ≥5 posts as pages; the rest become labels. §3 |
| Tags | 597 (261 with ≥1 post, 336 empty) | 0 (names only, inside posts) | — | 597 | Do not build pages. §3 |
| Media (`/wp/v2/media`) | 1,065 advertised, 1,038 listable | 182 files in `public/brand/` (72 MB) | 182 | see §1.4 | ~30 to harvest for kept pages, ~10 for harvested pages. Not 900. |
| Products (`/wp/v2/product`) | 38 | 38 (`content/products/*.md`, 93 gallery images) | 38 | 0 | Complete (harvest report `content/data/product-harvest-report.json`). |
| Product categories | 5 (`exercises` 5, `new` 21, `products` 16, `shirts` 16, `uncategorized` 0) | 3 (`merch`/`ebook`/`event` in `content.ts`) | mapped | — | Different but equivalent split. Redirect only. |
| Product tags | 135 (116 indexed) | 0 | 0 | 135 | Drop with redirect to `/shop`. |
| Videos (`portfolio-item`) | 21 | 21 (`content.json.videos`; `stats.videos` says 20 — one lacks a `youtube_id`) | 21 | 0 | Complete. |
| Portfolio categories / tags | 14 / 100 archive URLs | 0 | — | — | Drop with redirect to `/videos`. |
| Comments | 1 (Frank, 2024-08-18, on Isa van Schaik) | 0 | 0 | 1 | Drop. |
| Testimonials | taxonomy exists (2 terms), **0 items** ("No posts were found") | 0 | — | — | Confirms §9: there are no reviews to migrate. |
| Nav menus | 4 menus (see §1.6); REST returns 401 | 1 flat nav (6 links + CTA) | — | — | Rebuild the Blog and Shop dropdowns' *targets*, not the dropdowns. §7 |
| Sitemap URLs | 757 (`wp-sitemap.xml`) | 83 (`app/sitemap.ts`) | — | — | §8 |

### 1.2 Posts — what the 27 carry on the old site

Per post the API gives `categories[]` and `tags[]` ids. Facts that matter for the archive design:

- Every post has ≥1 category; the median post sits in **9 categories** (min 1, max 25:
  `looptraining-voetbal`). The categories were used as keywords, not as a hierarchy — all 70 have
  `parent=0`.
- **58 of the 70 category slugs also exist as tag slugs** (`voetbal`, `looptraining`, `snelheid`, …).
  The two taxonomies are one vocabulary entered twice.
- Six posts are the athlete interviews (`interviews` ×5, `interview` ×1 — `isa-van-schaik` sits in
  the singular one; treat as the same term). `bosu-trainingsmateriaal` sits only in `geen-categorie`.
- Featured images: 24 of 27 have one; `damian-muller-0-to-100-real-quick`,
  `kbands-trainingsmateriaal`, `bosu-trainingsmateriaal` have `featured_media: 0` (the new site
  already handles this — `content.json` carries a `featured_image` string for all 27).
- Images referenced in post bodies + featured: **50 unique, 50 in `lib/image-manifest.json`**. Zero
  to harvest for posts.
- `content.json` post `tags[]` are display names; all 27×N names match an API tag name exactly, so
  slugs can be attached by lookup without re-scraping.

### 1.3 Pages — what the 123 missing pages are

Classified from the REST `content.rendered` of all 138 (full dump in the scratchpad, `pages-rows.json`).

| Class | Count | What it is | Action |
|---|---|---|---|
| **Theme demo** | **85** | Malmö/Elated demo content: `/elements/*` (34), `/blurb-elements/*` (6), `/standard-portfolio-lists/*` (5), `/gallery-portfolio-lists/*` (4), `/portfolio-masonry-lists/*` (3), `/about/profile-page*` (3), `/our-team*` (3), `/services*` (4), `/*-home/` (4), `/landing/`, `/coming-soon/`, `/jewelry-store/`, `/pricing/`, `/sample-page/`, `/voorbeeld-pagina*` (2), `/shortcodes/`, … 70 of them created 2016-08/09 (theme install), 32 contain "Lorem ipsum", 17 are empty. All 85 are in the old sitemap and therefore indexed. | Do not build. 410 for the worst (`/elements/*`), 301 → `/` for the rest. |
| **WooCommerce plumbing** | **16** | `/cart/`, `/checkout/`, `/afrekenen/`, `/winkelmand/`, `/winkel/`, `/my-account/`, `/mijn-account/`, `/shop-lists/*` (4), `/shop-home*` (2), `/shop-masonry*` (2), `/product-landing/` | 301 → `/shop` (cart/checkout/account → the live webshop URL while it exists, see §8). |
| **Superseded** | **8** | `/` (slug `video-home`, the real home), `/blog/`, `/videos/`, `/aanmelden/`, `/products/`, `/shop/`, `/training/` (23 chars), `/prijzen-concept/` (2017 draft of `/prijzen/`) | Already have a route. Redirect map only. |
| **Stubs** | **7** | `/aanmelden-padeltoernooi/`, `/massage/`, `/smartgoals-kopen/` (all render "Fout: Contact formulier niet gevonden"), `/self-myofascial-release/` (empty), `/strenght-stability-exercises/` (empty), `/testwachtwoord/`, `/offline/` | 301 to the nearest real page (`/shop/padeltoernooi`, `/training/sportmassage`, `/shop/stroboscoop-glasses`… see §8). |
| **Quotes** | **2** | `/media/` (2011: two motivational quotes, Bolt and Jordan), `/portfolio/` (2013: 146 chars) | Drop, 301 → `/`. |
| **Real content** | **5** | See table below | Harvest 3, fold 1, redirect 1. |

The five real pages:

| Old path | Chars | Images | Dated | What it is | Recommendation |
|---|---|---|---|---|---|
| `/data/` | 4,203 | 6 | 2024-03 | "Without data you're just another person with an opinion." Sport split (Voetbal 42 %, Hockey 19 %, Honkbal 17 %, Padel/Tennis 12 %, Basketbal 6 %, Overig 4 %), counters **19 trainingsjaren / 15,493 trainingen / 1,256 atleten**, and ~3,000 chars of Jesse's argument about measuring vs improving. Newest real page on the site. | **Harvest** → `/training/data` (in `TRAINING_SLUGS`). Feed the counters into the home stats band (`content.json.stats`), which currently shows the older numbers. |
| `/schoolsport-vereniging-rotterdam-atletiek/` | 3,278 | 4 | 2017-02 | Schoolsport project: what it is, training times, locations, the FlickmyHouse kit sponsorship. Linked from two posts. | **Harvest** → `/training/schoolsport-vereniging` (or `/over/schoolsport` if a "Over" section is created — see §11 Q4). |
| `/records/` | 386 | 0 | 2013-05 | U12/U14 all-time sprint records (8 named children, 2013). | **Harvest as a block** inside `/training/snelheidsmetingen` (which already lists personal bests), not as its own page. Names of minors — ask the client (§11 Q6). |
| `/stretching/` | 4,661 | 2 | 2013-12 | Same article as the `rekken` post (post title "Statisch en/of Dynamisch Rekken?"; page and post share the first 800 chars). | **Do not duplicate.** 301 → `/blog/rekken`. |
| `/strenght-stability/` | 1,653 | 0 | 2014-03 | Core-stability preamble to functional strength. `/functionele-kracht-trainen/` (7,050 chars) covers the same ground. | **Fold**: if the kracht page lacks the "transfer" paragraph, append it as a section; otherwise 301 → `/training/functionele-kracht-trainen`. Decide on read, one hour. |

The fifteen kept pages need one correction too: **`content/pages/about.md` is a theme-demo page**
("Combining Form & Function — Lorem ipsum…") and it is **live at `https://jessecaron.vercel.app/training/about`**
(HTTP 200, verified), because `app/(site)/training/[slug]/page.tsx` has `generateStaticParams` but not
`dynamicParams = false`, so any slug in `content.json.pages` renders on demand. `/training/shirts` and
`/training/teamkleding` (both product listings scraped as markdown, the latter opening with "Fout:
Contact formulier niet gevonden") are live the same way. Fix in Phase 0.

### 1.4 Media — what the 1,065 are

| Slice | Count | Note |
|---|---|---|
| Advertised total | 1,065 | `X-WP-Total`. |
| Listable via pagination | 1,038 | 11 pages of 100; page 11 returns 65, pages 1–10 return fewer than 100 in places. The 27-item gap is unexplained (probably attachments whose parent is not publicly readable). Not worth chasing. |
| By type | 879 JPEG, 148 PNG, 4 PDF, 6 video (2× mp4/webm/ogg — one clip), 1 MP3 | The PDF/video/audio are theme demo assets. |
| By upload year | 2016: 649 · 2017: 211 · 2018: 75 · 2019: 38 · 2020: 20 · 2021: 23 · 2023: 1 · 2024: 16 · 2025: 5 | 2016 is the theme install; 510 of the 649 are referenced by nothing. |
| Attached to a post/page/product | 338 (60 posts, 140 pages, 138 products/portfolio) | 700 unattached. |
| Referenced by any post or page body or featured image | 318 | Includes `[vc_single_image image="ID"]` shortcodes resolved by id. |
| **Referenced by nothing** | **720** | Do not harvest. |
| Referenced by the 27 posts | 50 | **50 local.** |
| Referenced by the 15 kept pages (old rendered content) | 72 | **22 not local** — all of them dropped shortcode images. Measured by HEAD over 21 of the 22: **12.4 MB**, largest 2.0 MB (`Jesse-Caron-Functionele-Snelheid-Trainen.jpg`). |
| Referenced by the 123 non-kept pages | 238 | 189 not local. 40 belong to the real home (icons and partner logos among them are already in `public/brand/{icons,partners}`); the rest are demo. Harvest only what the 3 harvested pages use (≈10). |
| Local today | 182 (163 photos, 5 logo, 5 partners, 9 icons) — 72 MB, 10 files over 1 MB | Every one served by raw `<img>` except the product gallery. |

Per kept page, old image count vs. what the markdown kept:

| Page | Old page showed | Markdown has | Not on disk |
|---|---|---|---|
| `loopscholing` | 9 | 0 | 8 (`Loopscholing-Rotterdam.jpg`, six `Loop*.png` technique diagrams, `Loopscholing-Training-Rotterdam.jpg`) |
| `functionele-kracht-trainen` | 6 | 0 | 3 |
| `personal-training` | 3 | 0 | 3 |
| `zomerstop-training` | 3 | 0 | 3 |
| `functionele-snelheid-trainen` | 2 | 0 | 2 |
| `sportmassage` | 2 | 0 | 2 (`TV-Reclame.jpg`, `Stephany-Suykerbuyk-Sportmassage.jpg`) |
| `oefeningen` | 7 | 5 | 2 |
| `shirts` | 18 | 16 | 2 |
| `contact` | 2 | 0 | 1 |
| `teamkleding` | 21 | 21 | 0 |
| `groepstrainingen`, `prijzen`, `snelheidsmetingen`, `voorwaarden`, `about` | 0 | 0 | 0 |

`localImg()` silently hotlinks the old domain for anything not in the manifest; today that fallback
is not being exercised by the kept pages only because the images were dropped from the markdown
altogether. When they are restored, the 22 must be on disk first.

### 1.5 Taxonomy — distribution

Categories (70):

| Posts in category | Categories | Cumulative |
|---|---|---|
| 0 | 2 (`samet-dag`, `shirtsponsor`) | — |
| 1 | 21 | 68 |
| 2 | 11 | 47 |
| 3–4 | 18 | 36 |
| 5+ | **18** | 18 |

The 18 with ≥5: `nieuws` 13, `voetbal` 13, `looptraining` 11, `snelheid` 10, `explosiviteit` 9,
`coordinatie` 8, `flexibiliteit` 8, `hockey` 8, `stabiliteit` 8, `reactiviteit` 7, `blog` 6,
`looptraining-voetbal` 6, `wendbaarheid` 6, `atletiek` 5, `interviews` 5, `krachttraining` 5,
`oefeningen` 5, `rekken` 5.

Tags (597): 336 with 0 posts, 196 with 1, 28 with 2, 16 with 3–4, **21 with ≥5**. The top tags are
the same words as the top categories (`jesse-caron` 14, `looptraining` 13, `voetbal` 13, `snelheid` 11…).
A tag with one post is a page with one link on it; a tag with zero posts (336 of them) is a page with
nothing on it, and WordPress already excludes those from its sitemap.

### 1.6 What the old layout actually is (theme Malmö 2.2, WPBakery)

- **Navigation**: Home · Training ▾ (Functionele Snelheid, Functionele Kracht, Zomerstop Training,
  Personal Training, Loopscholing) · Aanmelden · Videos · Blog ▾ (six pillar posts: Warming-Up, Rekken,
  Krachtraining Voetbal, Startsnelheid, Reactiesnelheid, Handelingssnelheid) · Shop ▾ (Shirts,
  Producten, Oefeningen) · Contact.
- **Category / tag archive** (`/category/voetbal/`): breadcrumbs → standard list, **10 per page**
  (featured image with a day/month date badge, title, "By Jesse Caron", comment count, like count,
  category line, excerpt, read-more) → numbered pagination. **No sidebar.**
- **Blog index** (`/blog/`): 2-slide "latest" slider, then the same list, 3 pages of 10. No sidebar.
- **Single post**: 3/4 content + 1/4 **sidebar** = search · Instagram widget · a **"tag cloud" that is
  actually a category cloud** (`widget_tag_cloud` set to `taxonomy=category`, 45 terms, font size
  scaled by count, `aria-label="Atletiek (5 items)"`) · a **Categories list with counts** (68 entries).
  Below the article: tags block, author box, prev/next post with thumbnails. This sidebar is the
  "tag cloud / category list with per-category counts" the client pointed at — it appears on posts
  only, not on archives or the index.
- **Home**: revslider hero → three CTA tiles (PT / Snelheid / Kracht) → Aanmelden CTA → **13 Dutch
  lexicon entries + 4 English ones** (functioneel, snelheid, uithoudingsvermogen, wendbaarheid,
  persoonlijk, kracht, coördinatie, flexibiliteit, doelstelling, explosiviteit, reactievermogen,
  leerstijl; origami, technique, functionality, eagle) → online training / workshops / fysiek
  management → video impression → About → three shop teasers → "download origami instructions" →
  latest 3 posts (with their full tag lists printed) → shirts strip → partner logos → Instagram feed.
  The new home already has hero, stats band, 6 disciplines, manifesto, videos, about, shop, partners,
  contact; `content.json.lexicon` carries **8** entries against the old 17.

---

## 2. Scope recommendation

### Build

| Item | Why |
|---|---|
| 18 category archive pages (`count ≥ 5`) + a topics index with counts | This is what the client asked for by URL. 18 pages each hold 5–13 posts — enough to be a real page. The index with counts *is* the sidebar cloud, promoted to a page and a footer block. |
| Category line + prev/next + related posts on every post | The three cheapest pieces of old furniture, and the ones that keep readers on the site. |
| The 22 + ~10 missing images, back into the training pages | The visible "imagery" gap. 12–15 MB. |
| `/training/data`, `/training/schoolsport-vereniging`, records block in `snelheidsmetingen` | The only real content that did not cross. |
| Blog dropdown targets as a "Start here" row on `/blog` | The six pillar posts the old nav promoted. |
| Redirect map covering all 757 old URLs by pattern | Non-negotiable for the domain move. |
| 9 more lexicon entries | Data, not code; the marquee is already the site's signature. |
| `dynamicParams = false` on every `[slug]` route | Removes the live lorem-ipsum page. |

### Deliberately not build

| Item | Why | What happens to inbound links |
|---|---|---|
| 597 tag pages | 336 are empty, 196 have one post, 28 have two. 37 would have ≥3. Even those duplicate categories (58 shared slugs). Thin archives are the classic reason a site loses crawl budget after a migration. | `/tag/<slug>` → `/blog/categorie/<slug>` for the 18 slugs that are also a built category (`voetbal`, `looptraining`, `snelheid`, …); every other `/tag/*` → `/blog` (301). Not `/blog/onderwerpen#<slug>`: a fragment on a redirect is invisible to crawlers. Tag names stay visible as labels on posts, unlinked, as now. |
| 50 category pages with < 5 posts | 21 have one post, 11 have two. Same thinness. | `/category/<slug>` → `/blog` (301), except the 5 person/organisation categories (`errol-esajas`, `nargelis-statia`, `tarik-tahiri`, `pieter-jan-van-der-heiden`, `samet-dag`) → the single post they label, and `interview` → `/blog/categorie/interviews`. The topics index lists every category with ≥1 post as an unlinked count row, so the vocabulary is still visible. |
| 85 theme-demo pages | Lorem ipsum on the client's domain. Indexed, but nothing links to them that matters. | `/elements/*`, `/blurb-elements/*`, `/*-portfolio*`, `/shop-lists/*` → **410 Gone**. Others → `/` (301). 410 is deliberate: it de-indexes faster than a soft redirect to the home page and it is honest. |
| Sidebar, tag cloud widget, like counts, comment counts, author box, search widget, Instagram widget | WordPress habits. The new design is full-width dark editorial; a 1/4 sidebar breaks it, likes and comment counts would all read "0", the Instagram widget needs an API token the site doesn't have. | n/a (no URLs). The *information* in the cloud (which topics exist, how many posts each) survives as the topics index and a footer block. |
| Product tags (135), portfolio categories/tags (114), shipping classes, author archives, post-format archive | Taxonomy noise. | `/product-tag/*`, `/product-categorie/*` → `/shop`; `/portfolio-category/*`, `/portfolio-tag/*` → `/videos`; `/author/*` → `/blog`. |
| Comments | One comment exists. No database to hold new ones. | Drop. |
| Pagination on archives | Largest category has 13 posts, the blog 27. One page each. `/blog/page/2/` and `/category/x/page/2/` → the unpaginated route. Revisit if the blog ever exceeds ~30 posts. |
| A WooCommerce rebuild | Out of scope, as before. Buy buttons keep linking to the live webshop. | — |

### Numbers after this plan

Routes: today 83 → **~105** (83 + 18 categories + 1 topics index + 2 harvested pages + `/blog/start`
if built as a page rather than a row). Media on disk: 182 → **~215 files, ~85 MB** before optimisation.

---

## 3. Taxonomy and routing

### 3.1 Data

Add `content/data/taxonomy.json`, generated by `scripts/harvest-taxonomy.mjs` from
`/wp/v2/categories?per_page=100` and `/wp/v2/tags?per_page=100&page=1..6`:

```jsonc
{
  "categories": [
    { "id": 167, "slug": "voetbal", "name": "Voetbal", "count": 13, "description": "", "page": true },
    { "id": 150, "slug": "atletiek", "name": "Atletiek", "count": 5, "description": "", "page": true },
    { "id": 584, "slug": "atletiektraining", "name": "Atletiektraining", "count": 3, "page": false }
    // … 70 entries; `page` = count >= 5, overridable by hand
  ],
  "tags": [ { "id": 137, "slug": "voetbal", "name": "voetbal", "count": 13 } /* 261 entries with count>0 */ ]
}
```

Extend each post in `content/data/content.json` (script, not by hand — the script keys on `slug`):

```jsonc
{ "slug": "looptraining-voetbal", "categories": ["coordinatie", "explosiviteit", /* 25 slugs */],
  "tags": ["Conditie", "Coördinatie", /* unchanged names */], "tag_slugs": ["conditie", "coordinatie", /* … */] }
```

`PostMeta` in `lib/content.ts` gains `categories: string[]` and `tag_slugs: string[]`. Merge `interview`
into `interviews` at harvest time (one post, obviously the same term) and record it in the redirect map.
`geen-categorie` ("Uncategorized") is never a page.

Description fields: all 70 category descriptions are empty on the old site. Each of the 18 archive
pages needs one paragraph of intro copy or the hero reads as a bare label. Write them from the
posts' own vocabulary (the `looptraining-voetbal` post defines most of these terms) and flag them
for the client to approve — they are the only new prose this plan introduces.

### 3.2 Accessors (`lib/content.ts`)

```ts
export function getCategories(opts?: { pagesOnly?: boolean }): Category[]   // sorted by count desc, then name
export function getCategory(slug: string): Category | undefined
export function getPostsInCategory(slug: string): PostMeta[]                // date desc
export function categoriesOf(post: PostMeta): Category[]                    // only those with page:true, for the category line
export function relatedPosts(slug: string, limit = 3): PostMeta[]           // Jaccard on category slugs, ties by date, never self
export function adjacentPosts(slug: string): { prev?: PostMeta; next?: PostMeta } // by date
```

`relatedPosts` on category overlap works well here precisely because the posts are over-categorised
(median 9): every guide has several neighbours, and the interviews cluster with each other.

### 3.3 Routes

| Route | File | Static params | Notes |
|---|---|---|---|
| `/blog/categorie/[slug]` | `app/(site)/blog/categorie/[slug]/page.tsx` | the 18 with `page:true` | `export const dynamicParams = false`. Hero = category name + count + intro; list = existing `PostCard` grid (reuse from `blog/page.tsx` — move `PostCard` to `components/PostCard.tsx`). No pagination. |
| `/blog/onderwerpen` | `app/(site)/blog/onderwerpen/page.tsx` | static | The topics index: 18 linked rows with counts, then the other 50 as unlinked rows in a smaller list. This is the category cloud as a page. |
| `/blog` | existing | — | Add a "Start hier" row (the six pillar posts from the old Blog dropdown, in that order) above the guides grid, and a compact topics strip (top 8 by count) under the hero. |
| `/blog/[slug]` | existing | 27 | Add category line (linked, `page:true` only), tag labels (unlinked, as now), prev/next, related 3. |
| `/training/data`, `/training/schoolsport-vereniging` | existing `[slug]` | add to `TRAINING_SLUGS` | Bodies via `getPageBody`. |

Dutch slugs (`categorie`, `onderwerpen`) because the site is Dutch and every existing route is
(`aanmelden`, `prijzen`, `voorwaarden`). `/tag/` is not built.

### 3.4 `generateStaticParams` interaction

All new routes return their full param list at build time and set `dynamicParams = false`. The same
line must be added to `training/[slug]`, `blog/[slug]` and `shop/[slug]` — that is the Phase 0 fix
for `/training/about`. Build output should list every route as `●` (SSG); any `ƒ` on a marketing
route is a regression. `app/sitemap.ts` gets `getCategories({pagesOnly:true})` and the two new pages.

---

## 4. The 121 (123) missing pages — harvest plan

Only `/data/`, `/schoolsport-vereniging-rotterdam-atletiek/` and `/records/` are harvested. The
existing export was HTML→markdown that lost shortcodes; do not reuse it. Harvest from the REST
`content.rendered`, which contains the shortcodes verbatim, and resolve them:

1. `scripts/harvest-page.mjs <slug>` → GET `/wp/v2/pages?slug=<slug>&_fields=id,slug,title,content,featured_media,modified`.
2. Strip the REST noise prefix (the API prepends `Sorry, no posts matched your criteria.` ×19 before
   the JSON — a broken shortcode echoing during render; slice from the first `[`).
3. Resolve `[vc_single_image image="ID"]` → `/wp/v2/media/ID` → `source_url`; download the original
   (strip any `-WxH` suffix; `localImg()` already handles the suffix on the read side).
4. Resolve `[vc_progress_bar]` / `eltd-progress-bar` (the `/data/` sport split) into a markdown table;
   `eltd-counter` values into the page's front matter (`stats:`), not prose.
5. Emit `content/pages/<slug>.md` in the existing front-matter shape (`# Title`, `slug:`, `url:`,
   `---`, body) and add the images to `public/brand/photos/` + `lib/image-manifest.json`.
6. Register the slug in `TRAINING_SLUGS`, give it a hero image in the `IMG` map, add it to the
   training index card grid.

Information architecture: both land under `/training/` because that is where every other content
page lives and the nav has no "Over" section. If the client wants an "Over Jesse" section (§11 Q4),
`data` and `schoolsport` move there with `contact`; the redirect map is updated in the same commit.

The other 120: redirect map only (§8). Nothing is copied.

---

## 5. Media

### 5.1 What to harvest

- The 22 dropped shortcode images of the kept pages (list in §1.4; ~12.4 MB).
- Whatever the 3 harvested pages resolve to (≈10 files; `/data/` has 6 refs, `schoolsport` 4, `records` 0).
- Home: the 9 lexicon icons and 10 partner logos are already local. Nothing.
- Nothing from the 720 unreferenced uploads, the 85 demo pages, or the product galleries (done).

Total ≈ 32 files, ≈ 15 MB. `manifest_entries_total` goes 182 → ~214.

### 5.2 How

Same method the product harvest used and documented (`product-harvest-report.json` → `method`):
sequential GET, 1.5 s delay, desktop UA, original filename preserved, `-WxH` suffix stripped so the
full-size original is fetched, manifest keyed on basename. Extend `scripts/` with
`harvest-media.mjs --from refs.json` that takes a list of basenames, looks each up in the cached media
dump (`media-all.json`, 1,038 rows with `source_url`), downloads, and appends to the manifest. Write a
`content/data/media-harvest-report.json` with the same shape as the product report so the next
person can see what was pulled and why.

### 5.3 `next/image` — adopt, with a size gate

Facts: 182 files, 72 MB, 10 over 1 MB, largest 1.57 MB (`Massage-Stick.jpg`); every `<img>` outside the
product gallery serves the original bytes at whatever width the layout gives it. A blog card at
~400 px wide is downloading a 1 MB JPEG. After this plan it is ~215 files / ~85 MB.

Recommendation: **adopt `next/image` for every content image, and pre-shrink the originals.** Costs:

| Cost | Size | Mitigation |
|---|---|---|
| Vercel image optimisation counts *source images*, and Hobby has a monthly cap (5,000 as of the last published limits — check the dashboard, this changes). ~215 sources, ~5 sizes each, cached at the edge after first hit. | Fits comfortably. | If the domain move ends up on Pro anyway (custom domain + the client's traffic), moot. |
| `fill` + `sizes` need a sized parent; the `PageHero`, `PostCard`, discipline tiles, `ShopGrid` all already fix their aspect ratio in CSS. `Markdown.tsx`'s `img` renderer has no dimensions — use `width`/`height` from the manifest (extend the manifest to `{ path, w, h }`; a script can read dimensions with `sharp` in one pass). | ½ day | Do the manifest change first; everything else follows from it. |
| Repo weight: 72 → 85 MB in `public/` is fine for git and Vercel, but the *originals* are needlessly large. Re-encode anything over 2,000 px wide to 2,000 px, quality 82, in place, same filenames — `sharp` script, one run. Expect ~72 MB → ~25 MB. | 1 hour | Keep a copy of originals outside the repo (the scratchpad or the Obsidian vault) in case the client wants prints. |
| `remotePatterns`: none needed once `localImg()` never falls through. Add a build-time check that fails when any content image resolves to `https://www.jessecaron.com/...` — that is the day the old site goes off. | ½ hour | `scripts/check-images.mjs` run in `prebuild`. |

Product gallery already uses `next/image` and `localOnly()`; leave it. The one place to keep a raw
`<img>` is the header logo (38 px PNG).

---

## 6. Layout parity — what "the same layout" should mean

The new site is a redesign in the brand's own tokens (`globals.css`: ink/paper/blue, Anton/Inter/
JetBrains Mono) and the client has been shipping fixes against it for weeks. Parity means **the same
things are reachable and the same information is visible**, not that Malmö's chrome comes back.

| Old-site furniture | Verdict | How it appears in the new language |
|---|---|---|
| Category archive lists | **Keep** | `/blog/categorie/<slug>`: `PageHero` (name, "13 artikelen", intro) + the existing `pgrid`/`pcard` grid. Same card the blog index uses. |
| Category cloud with counts (single-post sidebar) | **Keep the information, not the widget** | `/blog/onderwerpen` as a page; a "Onderwerpen" block in the footer's paper section (top 10 with counts, mono labels); a top-8 strip under the blog hero. No font-size scaling by count — counts are printed. |
| Categories list (68, with counts) | **Merge into the above** | The lower, unlinked half of `/blog/onderwerpen`. |
| Category line on cards and posts | **Keep** | Mono eyebrow above the title, linked, `page:true` terms only (max ~6 shown, "+n"). |
| Tags block under the post | **Keep as labels** | Already there (`.post-tags`), unlinked. |
| Prev/next post with thumbnails | **Keep** | Two-up row at the end of the article, same card hover system (`--card-lift`). |
| Related posts | **Add** (old site had none, but it is the thing that makes archives worth having) | Three `PostCard`s under prev/next, "Verder lezen". |
| Breadcrumbs | **Keep, minimal** | `Blog / Voetbal` as the hero eyebrow on archives; `Blog / <category>` on posts. Also emit `BreadcrumbList` JSON-LD. No breadcrumb bar. |
| Sidebar (search, Instagram, cloud, list) | **Drop** | See §2. |
| Author box, likes, comment counts, "By Jesse Caron" | **Drop** | One author, no comments, no likes. Interviews carry a byline in the body already ("Tijn van Giezen" wrote the 2024–25 interviews — worth keeping as a line in the eyebrow: "Interview · Tijn van Giezen"). |
| Blog slider (2 latest) | **Drop** | The index already leads with the grid; a "Start hier" row of the six pillar posts does the same job better. |
| Day/month date badge over the image | **Drop** | Date is in the card eyebrow already. |
| Nav dropdowns (Training/Blog/Shop) | **Drop the dropdowns, keep the targets** | Training index already lists the 9 pages; blog index gets the pillar row; shop grid already filters. Adding a mega-menu to a 6-link mono nav is the kind of WordPress habit this design shed on purpose. |
| Home lexicon (17 entries) | **Keep, complete it** | `content.json.lexicon` 8 → 17; marquee already handles any length. |
| Home "latest 3 posts" | **Add** | The new home has no blog section at all. Three cards after Videos, before About. |
| Home stats band | **Keep, refresh** | Use the `/data/` counters (19 / 15,493 / 1,256) and the sport split as a second row or the `CountUp` targets. |
| Instagram feed | **Drop** | Needs an API token and a server; link to the profile as the footer does. |
| Revslider hero | **Drop** | Existing hero. |

---

## 7. Navigation after this plan

Header stays six links + CTA. Changes are inside sections:

- **Blog** index: hero → "Onderwerpen" strip (8 chips with counts, link to `/blog/onderwerpen`) →
  "Start hier" (6 pillar posts) → Trainingsgidsen grid → Atleten & Resultaten grid.
- **Training** index: 9 → 11 cards (`data`, `schoolsport-vereniging`).
- **Footer**: add an "Onderwerpen" column (top 10 categories with counts) next to the contact column;
  it is where the old sidebar's information lives permanently and on every page.
- **Home**: + "Laatste artikelen" (3) after Videos.

---

## 8. SEO and continuity

### 8.1 Old URL space (757 URLs in `wp-sitemap.xml`) → new

Implemented as `redirects()` in `next.config.ts` (currently empty). Patterns first, explicit rows
after; Next evaluates in order.

| Old pattern | Count | New | Code |
|---|---|---|---|
| `/<post-slug>/` (27) | 27 | `/blog/<slug>` | 301 |
| `/functionele-snelheid-trainen/`, `/functionele-kracht-trainen/`, `/personal-training/`, `/loopscholing/`, `/groepstrainingen/`, `/zomerstop-training/`, `/snelheidsmetingen/`, `/sportmassage/`, `/oefeningen/` | 9 | `/training/<slug>` | 301 |
| `/functionele-snelheid/`, `/functionele-kracht/` (already aliased in `content.server.ts`) | 2 | `/training/<slug>-trainen` | 301 |
| `/data/`, `/schoolsport-vereniging-rotterdam-atletiek/` | 2 | `/training/data`, `/training/schoolsport-vereniging` | 301 |
| `/records/` | 1 | `/training/snelheidsmetingen` | 301 |
| `/stretching/` | 1 | `/blog/rekken` | 301 |
| `/strenght-stability/`, `/strenght-stability-exercises/`, `/self-myofascial-release/` | 3 | `/training/functionele-kracht-trainen` | 301 |
| `/contact/`, `/prijzen/`, `/voorwaarden/`, `/aanmelden/`, `/videos/`, `/blog/` | 6 | same path | none (already match) |
| `/prijzen-concept/` | 1 | `/prijzen` | 301 |
| `/shirts/`, `/products/`, `/shop/`, `/winkel/`, `/product-categorie/*`, `/product-tag/*`, `/shop-*` | ~135 | `/shop` | 301 |
| `/product/<slug>/` | 38 | `/shop/<slug>` (+ `stroboscoop-knipper-bril` → `stroboscoop-glasses`) | 301 |
| `/cart/`, `/winkelmand/`, `/checkout/`, `/afrekenen/`, `/my-account/`, `/mijn-account/` | 6 | `/shop` — or the live webshop's own URLs while WooCommerce is kept alive on a subdomain (§11 Q2) | 302 until decided |
| `/category/<slug>/` for the 18 built | 18 | `/blog/categorie/<slug>` | 301 |
| `/category/interview/` | 1 | `/blog/categorie/interviews` | 301 |
| `/category/errol-esajas/`, `/nargelis-statia/`, `/tarik-tahiri/`, `/pieter-jan-van-der-heiden/`, `/samet-dag/` | 5 | the post they label (`samet-dag` has 0 posts → `/videos`) | 301 |
| `/category/<other>/` | 44 | `/blog` | 301 |
| `/tag/*` | 261 | `/blog` | 301 |
| `/portfolio-item/<slug>/` | 21 | `/videos` (a fragment target would be dropped by crawlers; add `id="<slug>"` anchors on `/videos` so `content.json.videos[].slug` still means something for humans following an old link) | 301 |
| `/portfolio-category/*`, `/portfolio-tag/*`, `/carousels-category/*`, `/testimonials-category/*`, `/product_shipping_class/*` | ~121 | `/videos` (portfolio), `/` (rest) | 301 |
| `/author/*`, `/page/N/`, `/*/page/N/`, `/feed/`, `/?s=` | — | `/blog`, the unpaginated parent, `/blog`, `/blog` | 301 |
| `/elements/*`, `/blurb-elements/*`, `/*-portfolio*/`, `/shop-lists/*`, `/standard-portfolio-lists/*`, `/gallery-portfolio-lists/*`, `/portfolio-masonry-lists/*` | ~60 | — | **410** via a `app/gone/route.ts` or `rewrites` to a 410 route handler |
| remaining demo pages (`/main-home/`, `/landing/`, `/our-team*/`, `/services*/`, `/pricing/`, `/sample-page/`, `/voorbeeld-pagina*/`, …) | ~25 | `/` | 301 |
| `/wp-content/uploads/**` | — | leave alone until the old host is off; then 404 (images are local) | — |
| `/wp-json/*`, `/wp-admin/*`, `/xmlrpc.php`, `/wp-login.php` | — | 410 | — |

Keep the map as data (`content/data/redirects.json`, `{from, to, status}`), generated by
`scripts/build-redirects.mjs` from the taxonomy and page dumps so the 300-odd explicit rows are never
hand-typed, and consumed by `next.config.ts`. Vercel's redirect limit is 2,048 on Hobby — fine.

### 8.2 Canonicals and metadata

- `metadataBase` = `SITE_URL` (already). Add `alternates.canonical` per route via `generateMetadata`
  — currently no route sets a canonical.
- Archive pages: `title: "<Name> — Blog"`, description = the intro paragraph, canonical self,
  `robots: index`. The topics index: index.
- Posts: add `article:published_time`, `og:image` from the featured image (products already do this).
- JSON-LD: `BlogPosting` on posts, `BreadcrumbList` on posts and archives, `Organization` in the root
  layout. Small, and it is the part of "SEO" the client can see in Search Console.

### 8.3 Sitemap

`app/sitemap.ts` lists 83 URLs today. Add the 18 archives, `/blog/onderwerpen`, the 2 harvested
pages, and `lastModified` for pages (the old API has `modified` per page — carry it into
`content.json.pages[].modified`). Never list a URL that redirects.

### 8.4 When the domain moves

1. Two weeks before: `NEXT_PUBLIC_SITE_URL=https://www.jessecaron.com` in Vercel (all three
   emitters follow, per `lib/site.ts`); verify the sitemap and `robots.txt` in a preview.
2. Search Console: add the property for the new host if not already there; be ready to submit the
   sitemap the hour DNS flips.
3. Decide the webshop's fate first (§11 Q2). If WooCommerce stays, move it to `shop.jessecaron.com`
   *before* the flip, update every `url` in `content.json.products` and `StickyBuy`'s targets, and
   test one purchase.
4. Flip DNS to Vercel (A/CNAME per `DEPLOY.md`). Vercel handles `jessecaron.com` → `www` and HTTPS.
5. Same hour: crawl the 757 old URLs with the redirect map (script in Phase 5) and confirm 0×404,
   0×5xx, 0×redirect-chains longer than 1.
6. Keep the old WordPress reachable on an internal hostname for 30 days for anything the crawl missed,
   then switch it off. The `prebuild` image check (§5.3) guarantees the new site is not hotlinking
   it on the day it dies.

---

## 9. Customer reviews — blocked

The client asked for 5/5-star customer reviews on the hero, home and product pages.

- Verified: every old product page reads "Er zijn nog geen beoordelingen". WooCommerce has zero
  reviews.
- Verified: the theme's testimonials post type has two taxonomy terms and **no items** (both archives:
  "No posts were found").
- One blog comment exists on the whole site (Frank, 2024, on the Isa van Schaik interview).
- No Google Business or Facebook review data has been provided.

There is nothing to migrate. Writing testimonials for a real trainer's real business is not on the
table. **Blocked pending a real source**: a Google Business Profile export, Facebook page
recommendations, or dated client emails/WhatsApps the client is willing to have quoted with a first
name and sport.

What the site can honestly show today: the five 2024–25 **Interviews** posts are first-person
accounts by named athletes and parents (Stephany Suykerbuyk, Team Caron, Djevan & Djediel Jansen,
Esmee de Willigen, Melika El Dahri for Hamza, Isa van Schaik). Pulling one attributed sentence from
each into a "Wat atleten zeggen" band on the home page, each linking to its interview, is
defensible and needs only the client's yes. Stars are not: no rating was ever given.

---

## 10. Phased build plan with agent assignments

Model split per `model-and-agent-split.md`: plan on Fable (this document), build/QA agents on Opus.
Every agent works in the repo on a branch named for its phase; the integrator merges in order.
Gates are commands, not opinions.

### Phase 0 — Guardrails (sequential, first; ½ day) — agent `guard`
- `export const dynamicParams = false` on `training/[slug]`, `blog/[slug]`, `shop/[slug]`.
- Remove `about` from `content.json.pages` (keep the `.md` out of the build) and decide `shirts`/
  `teamkleding`: they are product listings scraped as prose — drop from `pages` (their images stay in
  the manifest for the shop) and redirect.
- `scripts/check-images.mjs` in `prebuild`: fail on any content image that resolves off-site.
- **Gate**: `npm run build` passes; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/training/about` → 404;
  build output shows `●` for every `(site)` route.

### Phase 1 — Harvest (parallel, 3 agents; 1 day)
- `harvest-taxonomy`: `scripts/harvest-taxonomy.mjs` → `content/data/taxonomy.json`; extend
  `content.json.posts[]` with `categories`, `tag_slugs`; merge `interview`→`interviews`.
  **Gate**: 70 categories, 597 tags (261 with count>0), 27 posts each with ≥1 category slug that
  exists in `taxonomy.json`; sum of category counts equals the sum over posts of `categories.length`
  after the interview merge (−0) — print both.
- `harvest-media`: `scripts/harvest-media.mjs` for the 22 + the harvested pages' images; manifest
  extended to `{path, w, h}`; `media-harvest-report.json` written.
  **Gate**: every basename in `refs.json` (kept-page missing list, §1.4) resolves via `localImg()` to a
  path that exists on disk; report lists bytes per file; nothing over 2,000 px after the resize pass.
- `harvest-pages`: `scripts/harvest-page.mjs` for `data`, `schoolsport-vereniging-rotterdam-atletiek`,
  `records` (as a block), plus **re-harvest of the 9 kept training pages** so their shortcode images
  are placed back in the body where the old page had them (the markdown export lost position as
  well as the files). **Gate**: each re-harvested `.md` references the same image basenames the old
  REST content resolves to (script prints old vs new counts; §1.4 table becomes all zeros in the
  "Not on disk" column); `npm run build` passes; a diff of each training page's *prose* against the
  current `.md` is empty apart from image lines (the text must not change).

Sequencing inside Phase 1: `harvest-pages` depends on `harvest-media` for the files but can write
the markdown first and let the image gate run after; run all three together and gate at the end.

### Phase 2 — Taxonomy routes (after Phase 1 taxonomy; 1–2 days) — agent `archives`
- `lib/content.ts` accessors (§3.2); `components/PostCard.tsx` extracted; `/blog/categorie/[slug]`,
  `/blog/onderwerpen`; post page gets category line, prev/next, related; blog index gets topics strip +
  "Start hier"; footer "Onderwerpen" column; sitemap entries; canonicals + JSON-LD.
- **Gate**: build lists exactly 18 `/blog/categorie/*` routes; `/blog/categorie/voetbal` shows 13
  cards in date-desc order, first card `handelingssnelheid-trainen-voetbal-met-smartgoals`
  (2018-08-31, the newest post in `voetbal`); the gate script computes the expected order from
  `content.json` for all 18 and compares it to the rendered `<a href>` order. Every post page renders
  ≥1 linked category, prev/next resolve to real routes, related never includes self. Lighthouse
  accessibility ≥ 95 on one archive and one post (the existing focus/contrast rules make this cheap).

### Phase 3 — Pages and imagery into the layout (after Phase 1; parallel with Phase 2; 1 day) — agent `pages`
- `TRAINING_SLUGS` += `data`, `schoolsport-vereniging`; hero images in the `IMG` maps; training index
  cards; records block in `snelheidsmetingen`; home: lexicon 8→17, stats band from `/data/`
  counters, "Laatste artikelen" section.
- **Gate**: `/training/data` and `/training/schoolsport-vereniging` return 200 and show ≥1 image
  from disk; `/training/loopscholing` shows 9 images (was 0); the home marquee contains
  `uit·hou·dings·ver·mo·gen`; `npm run build` passes.

### Phase 4 — `next/image` and weight (after Phases 2–3; 1 day) — agent `images`
- Resize pass on `public/brand/photos`; `Markdown.tsx` `img` → `next/image` with manifest dimensions;
  `PageHero`, `PostCard`, `ShopGrid`, home tiles → `next/image` with `sizes`.
- **Gate**: `du -sh public` ≤ 35 MB; no `<img ` in `app/(site)/**` or `components/**` except `Nav.tsx`
  and `Footer.tsx` logos (grep); Lighthouse performance on `/blog` mobile ≥ 85 (baseline measured
  before the phase and recorded in the PR); no layout shift on the product page (CLS < 0.05).

### Phase 5 — Redirects and SEO (after Phase 2; parallel with 3–4; 1 day) — agent `seo`
- `scripts/build-redirects.mjs` → `content/data/redirects.json` → `next.config.ts`; 410 handler;
  canonical audit; sitemap review.
- **Gate**: `scripts/crawl-old-urls.mjs` fetches all 757 `wp-sitemap` URLs against the preview with
  the old host substituted: 0×404, 0×5xx, no chain > 1 hop, every 301 target returns 200, 410 only on
  the listed demo/plumbing patterns. Sitemap contains no redirecting URL. Output committed as
  `content/data/redirect-audit.json`.

### Phase 6 — Integration and client review (sequential; ½ day) — agent `integrate` (or the human)
- Merge order: 0 → 1 → 2 → 3 → 5 → 4. Full build, deploy to a preview, walk the §6 table against the
  preview with screenshots for the client (one per row that says "Keep").
- The 18 category intro paragraphs and the interview-quote band go to the client as a single
  document for approval; nothing in them ships without it.

Parallelism summary: Phase 1's three agents together; Phases 2 and 3 together; Phases 4 and 5 together.
Critical path: 0 → 1 → 2 → 4 → 6, about five working days.

---

## 11. Open questions for the client (with recommendations)

1. **Which categories deserve a page?** Recommend the 18 with ≥5 posts. If he wants more, the next
   sensible cut is ≥3 (36 pages), not "all 70". The topics index shows all of them either way.
2. **What happens to the WooCommerce shop when the domain moves?** Buy buttons still point at
   `www.jessecaron.com/product/...`. Options: (a) move WordPress to `shop.jessecaron.com` and keep
   selling there; (b) Shopify/Lightspeed; (c) stop selling. Recommend (a) as the zero-risk move for
   launch day, decision on (b) afterwards. This is the one item that blocks the domain switch.
3. **Category intro copy** (18 paragraphs, written from his own posts) — approve or edit.
4. **An "Over Jesse" section?** The old site has no about page (the one it has is lorem ipsum).
   `/data/` and `/schoolsport` read like "about" content. Recommend leaving them under `/training/`
   now and revisiting when there is a real bio to anchor a section.
5. **Reviews source** (§9): Google Business, Facebook, emails — or accept the attributed interview
   quotes without stars. Recommend the quotes now, real reviews when they exist.
6. **`/records/` names minors** (2013 U12/U14 sprint times with full names). Recommend publishing
   only with his explicit OK, and dropping the page otherwise.
7. **Tags**: confirm he is happy that tag words stay visible on posts but are not pages. Recommend yes.
8. **Old-site switch-off date** — needed to schedule §8.4 step 6 and to stop paying for the WP host.
9. **Interview byline**: the 2024–25 interviews are written by Tijn van Giezen. Keep the byline?
   Recommend yes, in the eyebrow.
10. **Home stats**: replace the current numbers with the `/data/` counters (19 years / 15,493
    sessions / 1,256 athletes, dated 2024-03)? Recommend yes, with a "sinds 2005"-style qualifier
    once he confirms the start year.

---

## 12. Uncertainties and contradictions with the brief

- **Pages kept is 15, not 17.** `content/data/content.json` → `pages: 15`; `content/pages/` has 15
  files; README says 17. One of the 15 (`about`) is theme lorem ipsum and is live.
- **Media: 1,065 advertised, 1,038 listable.** The API's own pagination stops at 1,038 unique ids
  (offset 1000 → 65 rows). Every number in §1.4 is over the 1,038; the missing 27 cannot be
  referenced by public content, or the reference would have shown up as a broken basename (0 found).
- **"Roughly 900 images did not come across"** is true as a count (1,038 − 182 = 856) and false as a
  gap: 720 are referenced by nothing, ~190 by demo pages, and the posts are complete. The real gap
  is ~32 files.
- **Videos: 21 vs 20.** `content.json.videos` has 21 entries, `stats.videos` says 20 and
  `getVideos()` filters on `youtube_id`, so one portfolio item has no video id. Not investigated
  which; Phase 3 should print it.
- **The "tag cloud"** on the old site is a category cloud. There is no tag cloud anywhere on the
  rendered old site; tags appear only as the block under each post.
- **Vercel image-optimisation quotas** — quoted from memory; confirm in the dashboard before Phase 4.
- **Sort order on old archives** is date-desc with 10 per page; whether the client wants the
  interviews (2024–25) to dominate every archive's first row is a taste question the design should
  answer (the blog index already separates guides from profiles — archives can do the same).
- The Supabase project behind `/academy`, `/admin`, `/account` no longer exists
  (`aobjodqnnuzueblcjcka`); `proxy.ts` falls through to marketing-only mode when the env is unset.
  Parity work does not touch it, but the nav still shows "Academy". Not this plan's question, but
  it will be the client's next one.

---

## Appendix A — where the probe data is

Scratchpad `…\scratchpad\wp\`: `posts-1.json`, `postsfull.json` (with content, categories, tags),
`pagesfull-{1,2}.json` (138 pages with content — note the `Sorry, no posts matched…` prefix),
`pages-rows.json` (the classification table), `categories-1.json`, `tags-{1..6}.json`,
`media-all.json` (1,038), `refs.json` (basename cross-reference), `sample-urls.txt`;
`…\scratchpad\{home,blog,cat-voetbal,cat-voetbal-2,tag-voetbal,post-looptraining}.html`.
Re-running the four `curl` loops in Phase 1's scripts regenerates all of it; nothing here depends on
the scratchpad surviving.

## Appendix B — files this plan touches

```
next.config.ts                         redirects(), images
app/(site)/blog/page.tsx               topics strip, "Start hier" row, PostCard extracted
app/(site)/blog/[slug]/page.tsx        category line, prev/next, related, JSON-LD, canonical
app/(site)/blog/categorie/[slug]/page.tsx   NEW
app/(site)/blog/onderwerpen/page.tsx   NEW
app/(site)/training/[slug]/page.tsx    dynamicParams=false, IMG map +2
app/(site)/training/page.tsx           +2 cards
app/(site)/shop/[slug]/page.tsx        dynamicParams=false only
app/(site)/page.tsx                    latest posts, stats refresh
app/sitemap.ts                         +21 URLs, lastModified
app/gone/route.ts                      NEW (410)
components/PostCard.tsx                NEW (moved)
components/Footer.tsx                  Onderwerpen column
components/Markdown.tsx                next/image
components/PageHero.tsx                next/image
lib/content.ts                         Category type, accessors, TRAINING_SLUGS +2, manifest {path,w,h}
lib/content.server.ts                  ALIASES for the new redirects (internal link rewriting)
lib/image-manifest.json                +~32 entries, dimensions
content/data/taxonomy.json             NEW
content/data/redirects.json            NEW
content/data/media-harvest-report.json NEW
content/data/content.json              posts[].categories/tag_slugs, lexicon 8→17, stats, pages −3 +2
content/pages/{data,schoolsport-vereniging}.md   NEW; 9 training pages re-harvested with images
scripts/{harvest-taxonomy,harvest-media,harvest-page,build-redirects,check-images,crawl-old-urls}.mjs   NEW
public/brand/photos/                   +~32 files, resize pass
```
