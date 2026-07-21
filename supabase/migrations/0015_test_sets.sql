-- 0015_test_sets.sql
-- Named Test Series papers. Idempotent.
--
-- Test Series used to assemble itself from whatever coding questions a subject
-- happened to have, under invented names ("SET 1 — Full OPPE Mock"). Real papers
-- have real identities — "September 2024 Set2" is a specific exam with a fixed
-- set of problems in a fixed order — so a paper is now a row, and its problems
-- are rows pointing at it.

create table if not exists public.test_sets (
  id               uuid primary key default gen_random_uuid(),
  subject_id       uuid not null references public.subjects(id) on delete cascade,
  slug             text not null,
  title            text not null,      -- shown on the card, e.g. "September 2024 Set2"
  exam             text,               -- "OPPE 1"
  year             int,
  source           text,               -- where the paper came from
  duration_seconds int  not null default 5400,
  sort_order       int  not null default 0,
  is_available     boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (subject_id, slug)
);

create table if not exists public.test_set_questions (
  id          uuid primary key default gen_random_uuid(),
  set_id      uuid not null references public.test_sets(id)  on delete cascade,
  question_id uuid not null references public.questions(id)  on delete cascade,
  section     text,                    -- "Section 1 - Data types"
  marks       int,
  sort_order  int not null default 0,
  unique (set_id, question_id)
);

create index if not exists idx_test_set_questions_set on public.test_set_questions(set_id);
create index if not exists idx_test_sets_subject      on public.test_sets(subject_id);

-- Papers and their contents are public reference data, like subjects/questions.
alter table public.test_sets          enable row level security;
alter table public.test_set_questions enable row level security;

drop policy if exists "test_sets readable by everyone" on public.test_sets;
create policy "test_sets readable by everyone"
  on public.test_sets for select using (true);

drop policy if exists "test_set_questions readable by everyone" on public.test_set_questions;
create policy "test_set_questions readable by everyone"
  on public.test_set_questions for select using (true);
