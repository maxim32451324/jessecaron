# PROJECT.md — Jesse Caron platform

> Read alongside `CLAUDE.md` (brand + content) and `content.json` (data).
> This file defines **what we're building beyond the marketing site**.

## 1. What this is
Two things in one product, sharing one brand and one codebase:

1. **Marketing site** — the public rebuild (home, training, videos, blog, shop, contact).
   Drives sign-ups. Built from the content in this pack.
2. **Membership platform** — a **Skool-style** area where **Jesse (owner) uploads courses,
   modules and videos**, and **students enroll, watch, and complete lessons** with progress tracking.

Think: public brand site out front, a gated "academy" behind login. One visual language across both.

## 2. Roles
| Role | Can do |
|------|--------|
| **Owner / admin** (Jesse) | Create & order courses → modules → lessons; upload videos & attachments; publish/unpublish; see member list & progress; manage memberships |
| **Member / student** | Browse catalog, enroll, watch lessons, mark complete, track progress, resume where they left off |
| **Visitor** | See marketing site + preview lessons; must sign up to access course content |

## 3. MVP feature set (build this first)
**Owner backend (`/admin`, role-gated)**
- Course CRUD: title, slug, cover image, description, access type (`free` / `members` / `paid`), publish toggle
- Module CRUD nested under a course, drag-to-reorder
- Lesson CRUD nested under a module, drag-to-reorder: title, rich-text body, **video**, attachments, `is_preview` flag
- **Video upload** → handed to a video provider (see §6), store returned playback ID on the lesson
- Member list with per-student course progress %

**Student app (`/academy`, auth-gated)**
- Course catalog (cards: cover, title, lesson count, progress ring)
- Course player: left sidebar = modules/lessons with completion ticks; main = video player + lesson body + attachments
- **Mark lesson complete** (and auto-advance / "Next lesson")
- Progress bar per course; dashboard "Continue learning" = last incomplete lesson
- Basic profile (name, avatar)

**Auth**
- Email + magic link / password via Supabase Auth (Google optional). New users get a `member` profile row.

## 4. Phase 2 (Skool parity — note, don't build yet)
- Community feed: posts, comments, likes, categories (the "group" side of Skool)
- Gamification: points for completing lessons + activity, leaderboard, levels
- Notifications, course discussions per-lesson
- Certificates on course completion
- Paid membership tiers (gate courses behind a subscription)

## 5. Recommended stack
Matches the existing toolchain — keep it boring and shippable.
- **Next.js (App Router) + TypeScript + Tailwind** — one app serves marketing (static/SSG) and the authed academy.
- **Supabase** — Postgres + Auth + Row Level Security + Storage (for images/attachments). A Supabase MCP is already connected for this workspace.
- **Video: a dedicated provider, NOT Supabase Storage.** Course video needs adaptive streaming + signed playback so only enrolled members can watch. Recommend **Bunny Stream** (cheap, EU-friendly for a Rotterdam audience) or **Mux** (best DX, signed playback tokens). Store `video_provider` + `playback_id` on the lesson; never expose raw files.
- **Payments (Phase 2): Stripe** subscriptions for membership; gate `access_type='paid'` courses on an active sub.
- **Deploy:** Vercel (app) + Supabase (data) + provider for video.

## 6. Video pipeline (the one real architecture decision)
1. Owner uploads in `/admin` → app requests a direct-upload URL from Bunny/Mux → browser uploads straight to the provider (don't proxy large files through the server).
2. Provider returns a `playback_id`; save it on the lesson with `duration_sec`.
3. Student player loads the provider's player with a **short-lived signed token**, minted server-side only if the user is enrolled. This is what stops link-sharing.
4. `lesson_progress.watch_seconds` updates on a throttle; lesson marks complete at ~90% or on explicit "Mark complete".

## 7. Data model (Supabase / Postgres)
```
profiles            id (=auth.users.id) · role(owner|member) · full_name · avatar_url · created_at
courses             id · slug · title · description · cover_image · access_type · is_published · sort · created_at
modules             id · course_id→courses · title · sort
lessons             id · module_id→modules · title · slug · body(richtext) ·
                    video_provider · playback_id · duration_sec · attachments(jsonb) · is_preview · sort
enrollments         id · user_id→profiles · course_id→courses · status · enrolled_at   [unique(user_id,course_id)]
lesson_progress     id · user_id→profiles · lesson_id→lessons · watch_seconds ·
                    completed_at(nullable)                                            [unique(user_id,lesson_id)]
-- phase 2 --
subscriptions       user_id · stripe_customer_id · status · plan · current_period_end
posts/comments/likes ... community
```
**RLS sketch**
- `profiles`: a user reads/updates their own row; owner reads all.
- `courses`/`modules`/`lessons`: anyone reads where `is_published` AND (`access_type='free'` OR enrolled); `is_preview` lessons readable by anyone; owner full read/write on everything.
- `enrollments`: user reads/creates their own; owner reads all.
- `lesson_progress`: user reads/writes only their own rows; owner reads all.

## 8. Route map
```
PUBLIC (marketing — from this content pack)
  /                     home
  /training/[slug]      service pages (functionele-snelheid, kracht, personal-training, …)
  /videos               YouTube grid (content.json → videos)
  /blog, /blog/[slug]   27 posts
  /shop                 (link out to existing WooCommerce, or rebuild later)
  /contact, /aanmelden  intake / sign-up

ACADEMY (auth-gated)
  /academy                       catalog + dashboard ("continue learning")
  /academy/[course]              course overview
  /academy/[course]/[lesson]     player (video + body + mark complete)
  /account                       profile

ADMIN (role = owner)
  /admin                         overview + members & progress
  /admin/courses                 list / create
  /admin/courses/[id]            edit course → modules → lessons, reorder, upload video, publish
```

## 9. Build order
1. Next + Tailwind + Supabase wired; auth + `profiles` on signup.
2. DB schema + RLS (tables in §7).
3. Marketing site from this pack (brand + content).
4. Admin course/module/lesson CRUD (text first, video stubbed).
5. Video provider integration (upload + signed playback).
6. Student catalog → player → progress/completion.
7. Polish: dashboard resume, progress rings, empty states.
8. Phase 2: community, gamification, Stripe memberships.

## 10. Notes
- Keep the academy visually consistent with the rebuilt brand (same palette/type/logo from `CLAUDE.md`).
- Don't load 21 marketing YouTube iframes or any course video eagerly — facade + lazy.
- Member-only course video must be signed/tokenized; public marketing videos stay on YouTube.
