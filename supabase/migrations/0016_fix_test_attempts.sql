-- 0016_fix_test_attempts.sql
-- Repair public.test_attempts. Idempotent.
--
-- 0011 created this table with `create table if not exists`, but a cut-down
-- test_attempts (id, user_id, set_id, set_name, score, total, time_seconds,
-- submitted_at) already existed to back the mock_leaderboard view. The guard
-- matched, the create was skipped, and the real schema was never applied — so
-- every column startTestAttempt writes (subject_id, subject_slug, environment,
-- question_ids, duration_seconds, status, leave_count, started_at) was missing
-- and starting a Test Series paper always failed. test_answers was never
-- created either, so submitting could not have worked.
--
-- The existing rows are kept: they are the seeded mock history the leaderboard
-- reads, so the new columns are added nullable, backfilled, then tightened.

do $$ begin
  create type test_attempt_status as enum ('in_progress', 'submitted', 'expired');
exception when duplicate_object then null; end $$;

alter table public.test_attempts add column if not exists subject_id       uuid;
alter table public.test_attempts add column if not exists subject_slug     text;
alter table public.test_attempts add column if not exists environment      text;
alter table public.test_attempts add column if not exists question_ids     uuid[] not null default '{}';
alter table public.test_attempts add column if not exists duration_seconds int;
alter table public.test_attempts add column if not exists status           test_attempt_status;
alter table public.test_attempts add column if not exists leave_count      int not null default 0;
alter table public.test_attempts add column if not exists started_at       timestamptz not null default now();

-- Backfill the pre-existing rows. They are finished mock attempts on Python.
update public.test_attempts
   set subject_id = coalesce(subject_id, (select id from public.subjects where slug = 'python')),
       subject_slug = coalesce(subject_slug, 'python'),
       environment = coalesce(environment, 'exam'),
       duration_seconds = coalesce(duration_seconds, 10800),
       status = coalesce(status, 'submitted'::test_attempt_status)
 where subject_id is null or subject_slug is null or environment is null
    or duration_seconds is null or status is null;

alter table public.test_attempts alter column subject_slug     set not null;
alter table public.test_attempts alter column environment      set not null;
alter table public.test_attempts alter column environment      set default 'exam';
alter table public.test_attempts alter column duration_seconds set not null;
alter table public.test_attempts alter column status           set not null;
alter table public.test_attempts alter column status           set default 'in_progress';

-- score/total/time_seconds must be nullable: an in-progress attempt has none.
alter table public.test_attempts alter column score        drop not null;
alter table public.test_attempts alter column total        drop not null;
alter table public.test_attempts alter column time_seconds drop not null;
alter table public.test_attempts alter column submitted_at drop not null;

alter table public.test_attempts drop constraint if exists test_attempts_environment_chk;
alter table public.test_attempts add constraint test_attempts_environment_chk
  check (environment in ('learning', 'exam'));

create table if not exists public.test_answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.test_attempts(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  question_id        uuid not null references public.questions(id) on delete cascade,
  answer             text,
  is_correct         boolean,
  q_status           text not null default 'none',
  time_spent_seconds int not null default 0,
  unique (attempt_id, question_id)
);

create index if not exists idx_test_attempts_user on public.test_attempts(user_id, started_at desc);
create index if not exists idx_test_attempts_set  on public.test_attempts(set_id, score desc);
create index if not exists idx_test_answers_attempt on public.test_answers(attempt_id);

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

-- Recreate the view now that the columns it filters on actually exist.
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
order by t.set_id, t.user_id, t.score desc, coalesce(t.time_seconds, 0) asc;

grant select on public.mock_leaderboard to anon, authenticated;
