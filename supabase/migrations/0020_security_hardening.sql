-- 0020_security_hardening.sql
-- Emergency privacy hardening for every browser-accessible relation.
--
-- The public schema is exposed by Supabase's Data API. RLS protects table rows,
-- but owner-created views can bypass RLS and PostgreSQL's default grants can
-- make a newly-created relation callable before anyone notices. This migration
-- therefore uses both layers: explicit grants and explicit RLS policies.

begin;

create extension if not exists "pgcrypto";

-- Administrative reports belong outside every Data API exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

drop view if exists public.report_practice_activity;
drop view if exists public.report_test_activity;

create or replace view private.report_practice_activity as
select p.id as user_id,
       coalesce(nullif(p.display_name, ''), 'Student') as name,
       u.email,
       s.name as subject,
       t.name as topic,
       q.title as question,
       q.exam as source,
       count(*) filter (where e.event = 'question_open') as opens,
       count(*) filter (where e.event = 'run_tests') as runs,
       count(*) filter (where e.event = 'submit') as submits,
       count(*) filter (where e.event = 'pdf_download') as downloads,
       max(e.created_at) as last_seen
  from public.activity_events e
  join public.profiles p on p.id = e.user_id
  join auth.users u on u.id = p.id
  left join public.questions q on q.id = e.question_id
  left join public.subjects s on s.id = coalesce(e.subject_id, q.subject_id)
  left join public.topics t on t.id = q.topic_id
 where e.question_id is not null
 group by p.id, p.display_name, u.email, s.name, t.name, q.title, q.exam;

create or replace view private.report_test_activity as
select p.id as user_id,
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
  join auth.users u on u.id = p.id
  left join public.test_sets ts on ts.slug = a.set_id
 order by a.started_at desc;

revoke all on private.report_practice_activity from public, anon, authenticated;
revoke all on private.report_test_activity from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on private.report_practice_activity to service_role;
grant select on private.report_test_activity to service_role;

-- This seed helper was accidentally left as a permanent browser-readable view.
drop view if exists public.seed_students;

-- Cross-user code and notes are private. There is deliberately no replacement
-- until an explicit per-submission opt-in sharing model exists.
drop view if exists public.question_top_solutions;

-- Never put auth.users.id on a public leaderboard. A separate random ID is
-- stable enough to identify a row without becoming an authentication handle.
alter table public.profiles add column if not exists public_id uuid;
update public.profiles set public_id = gen_random_uuid() where public_id is null;
alter table public.profiles alter column public_id set default gen_random_uuid();
alter table public.profiles alter column public_id set not null;
create unique index if not exists profiles_public_id_uidx
  on public.profiles(public_id);

drop view if exists public.leaderboard_overall;
create view public.leaderboard_overall
with (security_barrier = true) as
select p.public_id,
       'Student ' || upper(left(replace(p.public_id::text, '-', ''), 6)) as name,
       bt.solved,
       bt.total_seconds
  from public.profiles p
  join lateral (
    select count(*)::int as solved,
           coalesce(sum(best), 0)::int as total_seconds
      from (
        select a.question_id, min(a.time_spent_seconds) as best
          from public.attempts a
         where a.user_id = p.id and a.status = 'solved'
         group by a.question_id
      ) solved_questions
  ) bt on true
 where bt.solved > 0;

drop view if exists public.question_leaderboard;
create view public.question_leaderboard
with (security_barrier = true) as
select a.question_id,
       p.public_id,
       'Student ' || upper(left(replace(p.public_id::text, '-', ''), 6)) as name,
       min(a.time_spent_seconds)::int as best_time
  from public.attempts a
  join public.profiles p on p.id = a.user_id
 where a.status = 'solved'
 group by a.question_id, p.public_id;

drop view if exists public.mock_leaderboard;
create view public.mock_leaderboard
with (security_barrier = true) as
select distinct on (t.set_id, t.user_id)
       t.set_id,
       t.set_name,
       p.public_id,
       'Student ' || upper(left(replace(p.public_id::text, '-', ''), 6)) as name,
       t.score,
       t.total,
       coalesce(t.time_seconds, 0) as time_seconds,
       t.submitted_at
  from public.test_attempts t
  join public.profiles p on p.id = t.user_id
 where t.status = 'submitted'
   and t.environment = 'exam'
   and t.score is not null
 order by t.set_id, t.user_id, t.score desc,
          coalesce(t.time_seconds, 0) asc;

-- Model solutions are not anonymous content. The browser can retrieve them
-- only through this authenticated function; raw table SELECT cannot include
-- solution_md. The array limit prevents using one call as a bulk dump.
create or replace function public.get_question_solutions(target_ids uuid[])
returns table(question_id uuid, solution_md text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select q.id, q.solution_md
    from public.questions q
   where (select auth.uid()) is not null
     and coalesce(array_length(target_ids, 1), 0) between 1 and 100
     and q.id = any(target_ids);
$$;

-- Revoke everything first. Only the exact operations used by the app are
-- granted back below. RLS without table privileges is intentionally not enough.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Public curriculum/content: only non-secret columns needed to render the site.
grant select on public.subjects, public.topics, public.degrees,
  public.subject_offerings, public.carousel_banners,
  public.test_set_questions, public.test_set_sections
  to anon, authenticated;
grant select (id, subject_id, slug, title, exam, year, duration_seconds,
              sort_order, is_available, created_at, category)
  on public.test_sets to anon, authenticated;
grant select (id, subject_id, topic_id, title, body_md, difficulty, kind, tags,
              sort_order, created_at, tests, mcq_options, mcq_answer, setup_sql,
              input_labels, exam, starter_code, language, harness, practice_only)
  on public.questions to anon, authenticated;

-- Deliberately-safe aggregate views. They contain no auth IDs, profile names,
-- email addresses, phone numbers, code, notes, or per-attempt history.
grant select on public.leaderboard_overall,
  public.question_leaderboard, public.mock_leaderboard
  to anon, authenticated;

-- Private learner tables: own-row RLS plus minimum required SQL verbs.
grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;
grant select, insert on public.attempts to authenticated;
grant select, insert on public.notes to authenticated;
grant update (content_md, updated_at) on public.notes to authenticated;
grant select, insert on public.submissions to authenticated;
grant update (code, language, updated_at) on public.submissions to authenticated;
grant select, insert on public.test_attempts to authenticated;
grant update (status, score, total, time_seconds, leave_count, submitted_at)
  on public.test_attempts to authenticated;
grant select, insert on public.test_answers to authenticated;
grant update (answer, is_correct, q_status, time_spent_seconds)
  on public.test_answers to authenticated;
grant insert on public.activity_events to authenticated;
grant usage on sequence public.activity_events_id_seq to authenticated;
grant execute on function public.get_question_solutions(uuid[]) to authenticated;

-- Feedback existed in production before it was added to migrations. Keep it
-- insert-only and make a fresh environment converge on the same secure shape.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
alter table public.feedback force row level security;
grant insert on public.feedback to anon, authenticated;

-- If production's feedback id is serial/bigserial, grant only that sequence.
do $$
declare feedback_sequence text;
begin
  feedback_sequence := pg_get_serial_sequence('public.feedback', 'id');
  if feedback_sequence is not null then
    execute format('grant usage on sequence %s to anon, authenticated', feedback_sequence);
  end if;
end $$;

-- Remove every old policy on private learner tables so a forgotten permissive
-- policy cannot be ORed with these restrictions.
do $$
declare target_table text;
declare target_policy text;
begin
  foreach target_table in array array[
    'profiles', 'attempts', 'notes', 'submissions', 'test_attempts',
    'test_answers', 'activity_events', 'feedback'
  ] loop
    for target_policy in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', target_policy, target_table);
    end loop;
  end loop;
end $$;

alter table public.profiles force row level security;
alter table public.attempts force row level security;
alter table public.notes force row level security;
alter table public.submissions force row level security;
alter table public.test_attempts force row level security;
alter table public.test_answers force row level security;
alter table public.activity_events force row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy attempts_select_own on public.attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy attempts_insert_own on public.attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy notes_select_own on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notes_update_own on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy submissions_select_own on public.submissions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy submissions_insert_own on public.submissions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy submissions_update_own on public.submissions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy test_attempts_select_own on public.test_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy test_attempts_insert_own on public.test_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy test_attempts_update_own on public.test_attempts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy test_answers_select_own on public.test_answers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy test_answers_insert_own on public.test_answers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy test_answers_update_own on public.test_answers
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy activity_insert_own on public.activity_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy feedback_insert_anon on public.feedback
  for insert to anon with check (user_id is null);
create policy feedback_insert_own on public.feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Resource exhaustion / oversized payload guards. NOT VALID protects all new
-- writes immediately without making deployment depend on legacy cleanup.
alter table public.profiles drop constraint if exists profiles_display_name_size;
alter table public.profiles add constraint profiles_display_name_size
  check (display_name is null or char_length(display_name) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_phone_size;
alter table public.profiles add constraint profiles_phone_size
  check (phone is null or char_length(phone) <= 32) not valid;

alter table public.attempts drop constraint if exists attempts_time_sane;
alter table public.attempts add constraint attempts_time_sane
  check (time_spent_seconds between 0 and 604800) not valid;
alter table public.notes drop constraint if exists notes_content_size;
alter table public.notes add constraint notes_content_size
  check (char_length(content_md) <= 20000) not valid;
alter table public.submissions drop constraint if exists submissions_payload_size;
alter table public.submissions add constraint submissions_payload_size
  check (char_length(code) <= 200000 and
         (language is null or char_length(language) <= 32)) not valid;

alter table public.test_attempts drop constraint if exists test_attempts_numbers_sane;
alter table public.test_attempts add constraint test_attempts_numbers_sane
  check (duration_seconds between 1 and 86400 and
         leave_count between 0 and 100000 and
         (time_seconds is null or time_seconds between 0 and 604800)) not valid;
alter table public.test_answers drop constraint if exists test_answers_payload_sane;
alter table public.test_answers add constraint test_answers_payload_sane
  check ((answer is null or char_length(answer) <= 200000) and
         q_status in ('none', 'answered', 'review') and
         time_spent_seconds between 0 and 604800) not valid;

alter table public.activity_events drop constraint if exists activity_event_sane;
alter table public.activity_events add constraint activity_event_sane
  check (event in ('page_view', 'question_open', 'run_code', 'run_tests',
                   'submit', 'solved', 'pdf_download', 'test_start', 'test_submit')
         and (set_slug is null or char_length(set_slug) <= 100)
         and (path is null or char_length(path) <= 300)
         and octet_length(meta::text) <= 4096) not valid;

alter table public.feedback drop constraint if exists feedback_payload_sane;
alter table public.feedback add constraint feedback_payload_sane
  check ((name is null or char_length(name) <= 100)
         and (email is null or char_length(email) <= 320)
         and (phone is null or char_length(phone) <= 32)
         and char_length(message) between 1 and 5000) not valid;

notify pgrst, 'reload schema';

commit;
