# Jesse Caron — platform

Rebuild of **jessecaron.com**: a public marketing site **+** a Skool-style academy
(courses, modules, lessons, progress) with an owner admin. Built per `MASTERPLAN.md`.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + RLS + Storage)
- **Brand:** ink / paper / electric-blue · Anton + Inter + JetBrains Mono · origami-eagle · lexicon motif

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build / typecheck
```

`.env.local` is already wired to the provisioned Supabase project
(`aobjodqnnuzueblcjcka`, eu-central-1). The marketing site runs with no extra setup.

## Routes

| Area | Routes |
|------|--------|
| Marketing | `/` · `/training` + `/training/[slug]` · `/videos` · `/blog` + `/blog/[slug]` · `/shop` + `/shop/[slug]` · `/contact` · `/aanmelden` |
| Academy (auth) | `/academy` · `/academy/[course]` · `/academy/[course]/[lesson]` · `/account` |
| Admin (owner) | `/admin` · `/admin/courses` · `/admin/courses/[id]` |
| API | `/api/intake` · `/api/admin/create-student` · `/api/lessons/[id]/play` · `/auth/callback` · `/auth/signout` |

`proxy.ts` (Next 16's renamed middleware) refreshes the session and gates `/academy`,
`/admin`, `/account`. Real data protection is Postgres RLS (see `schema.sql`).

## Finish the backend setup (2 steps)

1. **Service-role key** — admin student provisioning and signed video tokens need it.
   Supabase Dashboard → Project Settings → API → `service_role` → paste into
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then restart `npm run dev`.
   (The marketing site, login, academy, and the intake form already work without it.)

2. **Become owner** — sign up once at `/login`, then in Supabase SQL editor:
   ```sql
   update public.profiles set role = 'owner'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
   Now `/admin` unlocks. New users default to `member`.

> Auth uses magic-link (default) or email+password. New projects have "Confirm email"
> on, so confirm via the emailed link before password login (or disable it in
> Dashboard → Authentication → Providers → Email for faster local testing).

## Content & data

- `content/data/content.json` + `content/{pages,posts,products}/*.md` — all marketing copy
  (27 posts, 17 pages, 38 products, 21 videos). Loaded via `lib/content.ts` (client-safe)
  and `lib/content.server.ts` (markdown bodies, server-only).
- `public/brand/{photos,logo,partners,icons}` — 132 brand assets (original filenames;
  `localImg()` maps content URLs to these, falling back to the live site).
- Academy data model + RLS: `schema.sql`. Two demo courses are seeded so the catalog
  isn't empty.

## Video

- Marketing videos: YouTube facade (thumbnail → iframe on click; no eager loading).
- Course video: provider-agnostic (`video_provider` + `playback_id`). YouTube works now;
  Mux/Bunny signed playback is stubbed in `/api/lessons/[id]/play` until provider keys
  are added (`MUX_*` / `BUNNY_*`).

## Not in this pass (Phase 2)

Community feed, gamification/leaderboards, Stripe membership tiers, live Mux/Bunny signing,
WooCommerce rebuild (shop links out to the existing store).
