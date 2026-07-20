-- 0011_test_series.sql
-- Test Series persistence. Until now a Test Series attempt lived only in the
-- browser's localStorage: nothing was graded and nothing was stored, so "My
-- Mock history" (which reads mock_leaderboard) could never show a row.
--
-- This gives Test Series the same server-side treatment the old /app/exam flow
-- had — an attempt row, per-question answers, authoritative scoring — plus the
-- mock_leaderboard view that lib/queries.ts has always expected. Idempotent.

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
-- Its own status type — the old exam_status enum belonged to the removed
-- /app/exam flow and is dropped in 0012.
do $$ begin
  create type test_attempt_status as enum ('in_progress', 'submitted', 'expired');
exception when duplicate_object then null; end $$;

-- Sets are still derived from questions at request time (lib/test-series.ts),
-- so set_id / set_name are denormalised text rather than a foreign key. The
-- question_ids snapshot keeps an attempt gradable even if the set changes.
create table if not exists public.test_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subject_id       uuid not null references public.subjects(id) on delete cascade,
  subject_slug     text not null,
  set_id           text not null,
  set_name         text not null,
  -- 'exam' attempts are ranked and count as mocks; 'learning' ones are untimed
  -- practice and are deliberately excluded from mock_leaderboard below.
  environment      text not null default 'exam'
                     check (environment in ('learning', 'exam')),
  question_ids     uuid[] not null default '{}',
  duration_seconds int not null,
  status           test_attempt_status not null default 'in_progress',
  score            int,
  total            int,
  -- Wall-clock seconds the learner actually used, for the ranking tie-break.
  time_seconds     int,
  leave_count      int not null default 0,
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz
);

create table if not exists public.test_answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.test_attempts(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  question_id        uuid not null references public.questions(id) on delete cascade,
  answer             text,
  is_correct         boolean,
  -- What the palette showed at submit time: answered / review / none.
  q_status           text not null default 'none',
  time_spent_seconds int not null default 0,
  unique (attempt_id, question_id)
);

create index if not exists idx_test_attempts_user
  on public.test_attempts(user_id, started_at desc);
create index if not exists idx_test_attempts_set
  on public.test_attempts(set_id, score desc);
create index if not exists idx_test_answers_attempt
  on public.test_answers(attempt_id);

-- ---------------------------------------------------------------------------
-- RLS — a learner reads and writes only their own attempts
-- ---------------------------------------------------------------------------
alter table public.test_attempts enable row level security;
alter table public.test_answers  enable row level security;

drop policy if exists "test_attempts own" on public.test_attempts;
create policy "test_attempts own"
  on public.test_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "test_answers own" on public.test_answers;
create policy "test_answers own"
  on public.test_answers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- mock_leaderboard — one row per (set, user): their best submitted exam attempt
-- ---------------------------------------------------------------------------
-- Owned by postgres so it bypasses RLS and can rank across users, the same way
-- leaderboard_overall does. It exposes only the display name and the score.
create or replace view public.mock_leaderboard as
select distinct on (t.set_id, t.user_id)
  t.set_id,
  t.set_name,
  t.user_id,
  coalesce(nullif(p.display_name, ''), 'Student') as name,
  t.score,
  t.total,
  coalesce(t.time_seconds, 0) as time_seconds,
  t.submitted_at
from public.test_attempts t
join public.profiles p on p.id = t.user_id
where t.status = 'submitted'
  and t.environment = 'exam'
  and t.score is not null
-- distinct on keeps the first row per (set_id, user_id): highest score, and on
-- a tie the faster attempt.
order by t.set_id, t.user_id, t.score desc, coalesce(t.time_seconds, 0) asc;

grant select on public.mock_leaderboard to anon, authenticated;
