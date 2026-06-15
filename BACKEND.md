# BACKEND.md — Academy backend

Companion to `PROJECT.md` + `backend/schema.sql`. This is *how the backend behaves*.
The whole owner-vs-student split is enforced by **one boolean: `profiles.role`** + Postgres RLS.
There is no "admin password" — admin power is a role on a normal user, checked by `is_owner()`.

## Setup order
1. Run `backend/schema.sql` in Supabase (SQL editor or `supabase db push`).
2. Jesse signs up once through the normal flow → a `profiles` row is auto-created (trigger).
3. Promote him to owner (one-time):
   ```sql
   update public.profiles set role='owner'
   where id = (select id from auth.users where email='jesse@…');
   ```
4. Everyone else stays `member` by default.

## Capability matrix
| Action | Owner | Member |
|--------|:-----:|:------:|
| Create / edit / publish courses, modules, lessons | ✅ | ❌ |
| Upload course video & attachments | ✅ | ❌ |
| **Create student accounts** (provision/invite) | ✅ | ❌ |
| Enroll any student into any course | ✅ | self-enroll into `free` only |
| See every student's progress | ✅ | ❌ |
| Watch enrolled lesson video | ✅ (all) | ✅ (enrolled only) |
| See own progress / resume | ✅ | ✅ |
| Edit own profile | ✅ | ✅ |

RLS already enforces every row of this — a member literally cannot `select` another member's
`lesson_progress`, and cannot `insert` a course. No app-level checks needed for data safety
(app-level checks are only for UX, e.g. hiding the `/admin` nav).

## Jesse creates a student  (the part you flagged)
Self-signup is fine, but Jesse can also provision students directly. Creating an auth user
requires the **service-role key**, so it runs in a server-only route — never the browser.

```ts
// app/api/admin/create-student/route.ts  (Next.js route handler, server-only)
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!         // server env only, never shipped to client
)

export async function POST(req: Request) {
  // 1) verify caller is the owner (check their session's profile.role === 'owner')
  //    — reject with 403 otherwise.
  const { email, full_name, course_ids } = await req.json()

  // 2) create the auth user (or invite by email instead of setting a password)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
    // password: optional — or use admin.auth.admin.inviteUserByEmail(email)
  })
  if (error) return Response.json({ error: error.message }, { status: 400 })

  const userId = data.user.id   // profile row auto-created by the trigger

  // 3) optionally enroll them straight away
  if (course_ids?.length) {
    await admin.from('enrollments').insert(
      course_ids.map((c: string) => ({ user_id: userId, course_id: c }))
    )
  }
  return Response.json({ ok: true, userId })
}
```
Use `inviteUserByEmail` if you want the student to set their own password via an email link
(nicer onboarding than Jesse setting passwords).

## Student logs in → sees only their stuff
- After auth, the app reads `profiles` (their row), `enrollments` (their courses),
  `lesson_progress` (their ticks). RLS guarantees scoping — a query for "my courses" returns
  only theirs even if the client code is sloppy.
- Catalog shows published courses; clicking one they're not enrolled in shows an **enroll** CTA
  (free) or a locked state (members/paid).

## Watching a video (the real content gate)
Listing lesson titles/outline is open on published courses (Skool-style preview). What's gated
is **playback**:
1. Player requests `/api/lessons/[id]/play` (server).
2. Server checks `is_enrolled(course)` **or** `lesson.is_preview` — else 403.
3. If allowed, server mints a **short-lived signed token** from Mux (signed playback) or Bunny
   (token auth) and returns it. Token expires in minutes.
4. Client player uses the token. Sharing a `playback_id` is useless without a fresh signed token.

This is why course video must NOT sit in Supabase Storage (no per-view signing / adaptive
streaming). Marketing YouTube videos stay public and ungated.

## Marking progress / completion
- Player posts `watch_seconds` on a throttle (e.g. every 15s) → upsert `lesson_progress`.
- Set `completed_at = now()` at ~90% watched, or on an explicit "Mark complete" button.
- Course progress % = completed lessons / total lessons (compute in a view or client-side).
- Owner progress dashboard: owner can `select` all `enrollments` + `lesson_progress` (RLS allows),
  group by student × course.

## Env vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only — admin user creation, signed tokens
MUX_TOKEN_ID= / MUX_TOKEN_SECRET= # or BUNNY_API_KEY + BUNNY_LIBRARY_ID
```

## Don't
- Don't expose the service-role key to the browser.
- Don't gate content only in React — always rely on RLS + the signed-token check.
- Don't eager-load video; facade + signed token on play.
