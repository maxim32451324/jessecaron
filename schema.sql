-- ============================================================================
-- Jesse Caron — Academy backend schema (Supabase / Postgres)
-- Run in Supabase SQL editor (or as a migration). Idempotent-ish; safe on fresh DB.
-- Model: owner (Jesse) manages everything; members see only their own scoped data.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner','member')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- auto-create a profile whenever an auth user is created (self-signup OR admin-created)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS  (SECURITY DEFINER -> bypass RLS internally, no recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner');
$$;

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.user_id = auth.uid() and e.course_id = p_course_id and e.status = 'active'
  );
$$;

-- shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------------------------------------------------------------------------
-- COURSES -> MODULES -> LESSONS
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text,
  cover_image  text,
  access_type  text not null default 'members' check (access_type in ('free','members','paid')),
  is_published boolean not null default false,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  sort       int not null default 0
);

create table if not exists public.lessons (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid not null references public.modules(id) on delete cascade,
  title          text not null,
  slug           text not null,
  body           text,                          -- rich text / markdown
  video_provider text check (video_provider in ('mux','bunny','youtube')),
  playback_id    text,                          -- provider playback id (NOT a raw file)
  duration_sec   int,
  attachments    jsonb not null default '[]',   -- [{name,url,size}]
  is_preview     boolean not null default false,-- viewable without enrollment
  sort           int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (module_id, slug)
);

-- ---------------------------------------------------------------------------
-- INTAKES  (public enquiry form -> /admin/intakes)
--   Written by lib/intake.ts via the anon server client, so a public INSERT
--   policy is required. Reading/updating stays owner-only.
-- ---------------------------------------------------------------------------
create table if not exists public.intakes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  sport       text,
  level       text,
  format      text,
  message     text,
  status      text not null default 'new'
                check (status in ('new','contacted','converted','archived')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ENROLLMENTS  +  PROGRESS  (per-student scoping lives here)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','revoked')),
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  watch_seconds int not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- indexes
create index if not exists idx_modules_course on public.modules(course_id);
create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_enroll_user on public.enrollments(user_id);
create index if not exists idx_enroll_course on public.enrollments(course_id);
create index if not exists idx_progress_user on public.lesson_progress(user_id);
create index if not exists idx_intakes_created on public.intakes(created_at desc);

-- updated_at triggers
drop trigger if exists t_courses_upd on public.courses;
create trigger t_courses_upd before update on public.courses for each row execute function public.set_updated_at();
drop trigger if exists t_lessons_upd on public.lessons;
create trigger t_lessons_upd before update on public.lessons for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.intakes         enable row level security;

-- PROFILES: user sees/edits own; owner sees/edits all
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_owner());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_owner());

-- COURSES: anyone authed sees published; owner sees + writes all
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select
  using (is_published or public.is_owner());
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all
  using (public.is_owner()) with check (public.is_owner());

-- MODULES: outline visible if parent course published; owner full
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select
  using (public.is_owner() or exists (
    select 1 from public.courses c where c.id = course_id and c.is_published));
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all
  using (public.is_owner()) with check (public.is_owner());

-- LESSONS: outline/body readable if course published; owner full.
-- NOTE: real content gate = the SIGNED VIDEO TOKEN (minted server-side only if
-- is_enrolled OR is_preview). Listing titles/outline to non-enrolled is intended (Skool-style).
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select
  using (public.is_owner() or exists (
    select 1 from public.modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and c.is_published));
drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all
  using (public.is_owner()) with check (public.is_owner());

-- ENROLLMENTS: member reads own + self-enrolls free; owner reads all + enrolls anyone
drop policy if exists enroll_select on public.enrollments;
create policy enroll_select on public.enrollments for select
  using (user_id = auth.uid() or public.is_owner());
drop policy if exists enroll_insert on public.enrollments;
create policy enroll_insert on public.enrollments for insert
  with check (
    public.is_owner()
    or (user_id = auth.uid() and exists (
          select 1 from public.courses c
          where c.id = course_id and c.is_published and c.access_type = 'free'))
  );
drop policy if exists enroll_modify on public.enrollments;
create policy enroll_modify on public.enrollments for update
  using (public.is_owner()) with check (public.is_owner());
drop policy if exists enroll_delete on public.enrollments;
create policy enroll_delete on public.enrollments for delete using (public.is_owner());

-- LESSON_PROGRESS: member reads/writes only their own; owner reads all (dashboards)
drop policy if exists progress_select on public.lesson_progress;
create policy progress_select on public.lesson_progress for select
  using (user_id = auth.uid() or public.is_owner());
drop policy if exists progress_upsert on public.lesson_progress;
create policy progress_upsert on public.lesson_progress for insert
  with check (user_id = auth.uid());
drop policy if exists progress_update on public.lesson_progress;
create policy progress_update on public.lesson_progress for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- INTAKES: anyone (incl. anon) may submit the public form; only the owner reads/manages.
drop policy if exists intakes_insert on public.intakes;
create policy intakes_insert on public.intakes for insert
  with check (true);
drop policy if exists intakes_select on public.intakes;
create policy intakes_select on public.intakes for select
  using (public.is_owner());
drop policy if exists intakes_update on public.intakes;
create policy intakes_update on public.intakes for update
  using (public.is_owner()) with check (public.is_owner());
drop policy if exists intakes_delete on public.intakes;
create policy intakes_delete on public.intakes for delete using (public.is_owner());

-- ============================================================================
-- STORAGE  (images/attachments only — course VIDEO lives at Mux/Bunny, not here)
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('public-assets','public-assets', true)
  on conflict (id) do nothing;

drop policy if exists pubassets_read on storage.objects;
create policy pubassets_read on storage.objects for select
  using (bucket_id = 'public-assets');
drop policy if exists pubassets_write on storage.objects;
create policy pubassets_write on storage.objects for insert
  with check (bucket_id = 'public-assets' and public.is_owner());
drop policy if exists pubassets_modify on storage.objects;
create policy pubassets_modify on storage.objects for update
  using (bucket_id = 'public-assets' and public.is_owner());

-- ============================================================================
-- SEED: promote Jesse to owner AFTER he signs up once.
--   update public.profiles set role = 'owner' where id =
--     (select id from auth.users where email = 'JESSE_EMAIL_HERE');
-- ============================================================================
