-- 0002_execution_and_exam.sql
-- Phase 2 (in-browser execution) + Phase 3 (timed mock exam). Idempotent.

-- ---------------------------------------------------------------------------
-- Execution data on questions
-- ---------------------------------------------------------------------------
-- Coding judge: array of { stdin, expected, hidden } test cases.
alter table public.questions add column if not exists tests jsonb not null default '[]'::jsonb;
-- Structured MCQ: options [{ key, label }] and the correct key.
alter table public.questions add column if not exists mcq_options jsonb not null default '[]'::jsonb;
alter table public.questions add column if not exists mcq_answer text;
-- SQL runtime: schema/data setup run before the user's query.
alter table public.questions add column if not exists setup_sql text;

-- ---------------------------------------------------------------------------
-- Phase 3 — exam sessions
-- ---------------------------------------------------------------------------
do $$ begin
  create type exam_status as enum ('in_progress', 'submitted', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists public.exam_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subject_id       uuid not null references public.subjects(id) on delete cascade,
  question_ids     uuid[] not null default '{}',
  duration_seconds int not null,
  status           exam_status not null default 'in_progress',
  score            int,
  total            int,
  leave_count      int not null default 0,
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz
);

create table if not exists public.exam_answers (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.exam_sessions(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  question_id        uuid not null references public.questions(id) on delete cascade,
  answer             text,
  is_correct         boolean,
  time_spent_seconds int not null default 0,
  unique (session_id, question_id)
);

create index if not exists idx_exam_sessions_user on public.exam_sessions(user_id, started_at desc);
create index if not exists idx_exam_answers_session on public.exam_answers(session_id);

-- ---------------------------------------------------------------------------
-- RLS — a user sees and writes only their own exam data
-- ---------------------------------------------------------------------------
alter table public.exam_sessions enable row level security;
alter table public.exam_answers  enable row level security;

drop policy if exists "exam_sessions own" on public.exam_sessions;
create policy "exam_sessions own"
  on public.exam_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exam_answers own" on public.exam_answers;
create policy "exam_answers own"
  on public.exam_answers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
