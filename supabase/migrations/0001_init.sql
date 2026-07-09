-- 0001_init.sql
-- OPPE Practice Platform — schema, indexes, Row Level Security, and profile trigger.
-- Safe to re-run (idempotent).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type difficulty_level as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_kind as enum ('mcq', 'coding', 'sql', 'shell');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attempt_status as enum ('attempted', 'solved');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  short_code  text not null,
  description text,
  is_active   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  name        text not null,
  week        int,
  sort_order  int not null default 0
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  topic_id    uuid references public.topics(id) on delete set null,
  title       text not null,
  body_md     text not null,
  difficulty  difficulty_level not null default 'easy',
  kind        question_kind not null default 'coding',
  solution_md text,
  tags        text[] not null default '{}',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  question_id        uuid not null references public.questions(id) on delete cascade,
  status             attempt_status not null default 'attempted',
  time_spent_seconds int not null default 0,
  self_rating        int,
  is_correct         boolean,
  created_at         timestamptz not null default now()
);

alter table public.attempts drop constraint if exists attempts_self_rating_chk;
alter table public.attempts add constraint attempts_self_rating_chk
  check (self_rating is null or self_rating between 1 and 5);

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  content_md  text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_topics_subject         on public.topics(subject_id);
create index if not exists idx_questions_subject       on public.questions(subject_id);
create index if not exists idx_questions_topic         on public.questions(topic_id);
create index if not exists idx_attempts_user           on public.attempts(user_id);
create index if not exists idx_attempts_question       on public.attempts(question_id);
create index if not exists idx_attempts_user_created   on public.attempts(user_id, created_at desc);
create index if not exists idx_attempts_user_question  on public.attempts(user_id, question_id);
create index if not exists idx_notes_user              on public.notes(user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.subjects  enable row level security;
alter table public.topics    enable row level security;
alter table public.questions enable row level security;
alter table public.attempts  enable row level security;
alter table public.notes     enable row level security;

-- Content is public-readable (browsing does not require an account).
drop policy if exists "subjects readable by everyone" on public.subjects;
create policy "subjects readable by everyone"
  on public.subjects for select using (true);

drop policy if exists "topics readable by everyone" on public.topics;
create policy "topics readable by everyone"
  on public.topics for select using (true);

drop policy if exists "questions readable by everyone" on public.questions;
create policy "questions readable by everyone"
  on public.questions for select using (true);

-- Profiles: a user may read and manage only their own row.
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Attempts: a user may read/write only their own attempts.
drop policy if exists "attempts select own" on public.attempts;
create policy "attempts select own"
  on public.attempts for select using (auth.uid() = user_id);

drop policy if exists "attempts insert own" on public.attempts;
create policy "attempts insert own"
  on public.attempts for insert with check (auth.uid() = user_id);

drop policy if exists "attempts update own" on public.attempts;
create policy "attempts update own"
  on public.attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "attempts delete own" on public.attempts;
create policy "attempts delete own"
  on public.attempts for delete using (auth.uid() = user_id);

-- Notes: a user may read/write only their own notes.
drop policy if exists "notes select own" on public.notes;
create policy "notes select own"
  on public.notes for select using (auth.uid() = user_id);

drop policy if exists "notes insert own" on public.notes;
create policy "notes insert own"
  on public.notes for insert with check (auth.uid() = user_id);

drop policy if exists "notes update own" on public.notes;
create policy "notes update own"
  on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes delete own" on public.notes;
create policy "notes delete own"
  on public.notes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profile auto-creation on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
