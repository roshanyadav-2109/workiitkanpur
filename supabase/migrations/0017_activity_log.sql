-- 0017_activity_log.sql
-- Per-learner activity log: what is being practised, which papers are being
-- sat, and the interactions along the way. Idempotent.
--
-- attempts / test_attempts already record outcomes. This records behaviour --
-- opening a question, running tests, downloading a handout, starting a paper --
-- which is what tells you where learners get stuck rather than only how they
-- finished.

create table if not exists public.activity_events (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event        text not null,
  question_id  uuid references public.questions(id) on delete set null,
  subject_id   uuid references public.subjects(id)  on delete set null,
  set_slug     text,
  path         text,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- The queries this is for: one learner's trail, one question's traffic, and
-- "what happened today".
create index if not exists idx_activity_user_time
  on public.activity_events(user_id, created_at desc);
create index if not exists idx_activity_event_time
  on public.activity_events(event, created_at desc);
create index if not exists idx_activity_question
  on public.activity_events(question_id) where question_id is not null;
create index if not exists idx_activity_set
  on public.activity_events(set_slug) where set_slug is not null;

alter table public.activity_events enable row level security;

-- A learner may only ever write rows about themselves, and read their own.
-- Nobody reads across learners through the anon/authenticated key: reporting
-- runs with the service role, so a stolen anon key cannot pull the whole log.
drop policy if exists "activity insert own" on public.activity_events;
create policy "activity insert own"
  on public.activity_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "activity select own" on public.activity_events;
create policy "activity select own"
  on public.activity_events for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Reporting views (service role only -- they are not granted to anon)
-- ---------------------------------------------------------------------------

-- Who is practising what, and how far they got.
create or replace view public.report_practice_activity as
select p.id                              as user_id,
       coalesce(nullif(p.display_name, ''), 'Student') as name,
       u.email,
       s.name                            as subject,
       t.name                            as topic,
       q.title                           as question,
       q.exam                            as source,
       count(*) filter (where e.event = 'question_open')  as opens,
       count(*) filter (where e.event = 'run_tests')      as runs,
       count(*) filter (where e.event = 'submit')         as submits,
       count(*) filter (where e.event = 'pdf_download')   as downloads,
       max(e.created_at)                 as last_seen
  from public.activity_events e
  join public.profiles p on p.id = e.user_id
  join auth.users  u on u.id = p.id
  left join public.questions q on q.id = e.question_id
  left join public.subjects  s on s.id = coalesce(e.subject_id, q.subject_id)
  left join public.topics    t on t.id = q.topic_id
 where e.question_id is not null
 group by p.id, p.display_name, u.email, s.name, t.name, q.title, q.exam;

-- Who is sitting which paper.
create or replace view public.report_test_activity as
select p.id  as user_id,
       coalesce(nullif(p.display_name, ''), 'Student') as name,
       u.email,
       ts.title as paper,
       a.environment,
       a.status,
       a.score,
       a.total,
       a.time_seconds,
       a.leave_count,
       a.started_at,
       a.submitted_at
  from public.test_attempts a
  join public.profiles p on p.id = a.user_id
  join auth.users  u on u.id = p.id
  left join public.test_sets ts on ts.slug = a.set_id
 order by a.started_at desc;
