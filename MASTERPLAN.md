# MASTERPLAN — Jesse Caron platform rebuild

> Source brief: `CLAUDE.md`, `PROJECT.md`, `BACKEND.md`, `content.json`, `schema.sql`
> (in `C:\Users\J\Downloads\jessecaron_extracted\`). This file is the build plan we execute against.

## 1. What we're building

One product, two halves, one brand:

1. **Marketing site** (public) — rebuild of jessecaron.com from the content pack.
   Home · Training · Videos · Blog · Shop · Contact/Aanmelden.
2. **Academy** (Skool-style, auth-gated) — owner (Jesse) uploads courses → modules →
   lessons + video; members enroll, watch, mark complete, track progress.
3. **Admin** (role = owner) — course/module/lesson CRUD, member list + progress,
   provision students, signed video playback.

## 2. Stack (decided)

- **Next.js 15 (App Router) + TypeScript + Tailwind v4** — one app serves marketing (SSG)
  and the authed academy/admin.
- **Supabase** — Postgres + Auth + RLS + Storage. New project provisioned for this app.
- **Video (academy):** provider-agnostic lesson model (`video_provider` + `playback_id`).
  Marketing videos stay on YouTube (facade + lazy iframe). Course playback gated by a
  server-minted short-lived token (Mux/Bunny) — stubbed until provider keys are added.
- **Deploy target:** Vercel (app) + Supabase (data). Runs locally with `npm run dev`.

## 3. Brand system (intact — new look)

| token | hex | use |
|-------|-----|-----|
| ink | `#0E0E10` | bg / text |
| ink-2 | `#16161A` | raised surfaces |
| paper | `#F4F4F1` | light bg / inverse text |
| blue | `#0090D8` | the single accent — sparingly |
| blue-deep | `#0A6FA5` | hover/links on light |
| ash | `#8C8C8A` | muted labels |

- **Type:** Anton (display) + Inter (body) + JetBrains Mono (eyebrows/labels).
- **Signature motif:** the brand's **dictionary/lexicon entries** (`func·tio·neel`, `snel·heid`,
  `kracht` …) — used as a scrolling marquee + section device. This is where we spend boldness.
- **Logo:** origami eagle (white on dark, black on light). Photography is the hero asset —
  full-bleed, high contrast, slight desaturation.
- **Taglines:** *Don't confuse movement with progress* (primary) + 3 others reused as section breaks.
- A11y: visible focus, keyboard nav, `prefers-reduced-motion` respected, mobile-first responsive.

## 4. Route map

```
PUBLIC (marketing)
  /                         home (hero, lexicon, disciplines, manifesto, videos, about, shop, partners, contact)
  /training                 index of service pages
  /training/[slug]          functionele-snelheid, functionele-kracht, personal-training, loopscholing,
                            groepstrainingen, zomerstop-training, + info pages
  /videos                   YouTube grid (21, facade-loaded)
  /blog                     27 posts, split: training guides vs athlete profiles
  /blog/[slug]              post detail
  /shop                     38 products, filter by merch/ebook/event (links out to WooCommerce)
  /contact                  contact details
  /aanmelden                intake / sign-up CTA

ACADEMY (auth-gated)
  /academy                  catalog + "continue learning" dashboard
  /academy/[course]         course overview
  /academy/[course]/[lesson] player (video facade + body + mark complete + next)
  /account                  profile

ADMIN (role = owner)
  /admin                    overview + members & progress
  /admin/courses            list / create
  /admin/courses/[id]       edit course → modules → lessons, reorder, publish

API (server only)
  /api/admin/create-student POST — owner provisions/invites a student (service-role)
  /api/lessons/[id]/play    POST — mint signed playback token if enrolled or preview
```

## 5. Data model — `schema.sql` (run as-is)

`profiles` (1:1 auth.users, role owner|member) · `courses` · `modules` · `lessons`
· `enrollments` · `lesson_progress`. RLS enforces owner-vs-member; `is_owner()` +
`is_enrolled()` helpers. Storage bucket `public-assets` for images/attachments.
Phase 2 (not built): community feed, gamification, Stripe subscriptions.

## 6. Content pipeline

- `content.json` → bundled into the app as the master data source (brand, lexicon, stats,
  pages index, posts, products, videos).
- `content/{pages,posts,products}/*.md` → page/post bodies, parsed at build time.
- 133 images → `public/brand/{photos,logo,partners,icons}` (original filenames preserved so
  the `content.json` URL basenames map directly to local files via a `localImg()` helper).

## 7. Build order (status tracked in task list)

1. ✅ Masterplan.
2. Scaffold Next + Tailwind + Supabase; design tokens in `globals.css`; copy content + images.
3. Content layer (`lib/content.ts`) + shared UI (Nav, Footer, LexiconMarquee, VideoFacade, Reveal).
4. Marketing pages (home → training → videos → blog → shop → contact/aanmelden).
5. Provision Supabase, run `schema.sql`, wire clients + env, generate types.
6. Auth + academy (catalog → player → progress) + admin (CRUD → members) + API routes.
7. Verify: `npm run build`, dev server, preview, fix, screenshot.

## 8. Non-goals this pass

- Rebuilding commerce (shop links out to the existing WooCommerce store).
- Live video provider integration (model + token route stubbed; YouTube allowed as a provider).
- Phase-2 community/gamification/payments.
