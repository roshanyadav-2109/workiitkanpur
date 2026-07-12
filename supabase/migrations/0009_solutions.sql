-- 0009_solutions.sql
-- Store only the LAST code a user submitted per question (one row per
-- user+question, upserted on submit — no full history), plus a view that
-- exposes the fastest solvers' solution (last code + note) per question so the
-- analysis page can show how top students approached each problem. The view is
-- owned by postgres so it bypasses RLS for read-only cross-user aggregation;
-- it is granted read-only to the app roles. Safe to re-run.

create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  code        text not null default '',
  language    text,
  updated_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.submissions enable row level security;

drop policy if exists submissions_select_own on public.submissions;
create policy submissions_select_own on public.submissions
  for select using (user_id = auth.uid());

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own on public.submissions
  for insert with check (user_id = auth.uid());

drop policy if exists submissions_update_own on public.submissions;
create policy submissions_update_own on public.submissions
  for update using (user_id = auth.uid());

grant select, insert, update on public.submissions to authenticated;

create or replace view public.question_top_solutions as
select
  x.question_id,
  x.user_id,
  coalesce(nullif(p.display_name, ''), 'Student') as name,
  x.best_time,
  s.code,
  s.language,
  n.content_md as note
from (
  select distinct on (user_id, question_id)
    user_id, question_id, time_spent_seconds as best_time
  from public.attempts
  where status = 'solved'
  order by user_id, question_id, time_spent_seconds asc, created_at asc
) x
join public.profiles p on p.id = x.user_id
left join public.submissions s on s.user_id = x.user_id and s.question_id = x.question_id
left join public.notes n on n.user_id = x.user_id and n.question_id = x.question_id;

grant select on public.question_top_solutions to anon, authenticated;
