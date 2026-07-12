-- 0007_leaderboard.sql
-- Cross-user leaderboard. The view is owned by postgres so it bypasses RLS and
-- can aggregate every user's attempts; it exposes no sensitive data (just the
-- display name, solved count and total best-time), and is granted read-only to
-- the app roles. Safe to re-run.

create or replace view public.leaderboard_overall as
select
  p.id as user_id,
  coalesce(nullif(p.display_name, ''), 'Student') as name,
  bt.solved,
  bt.total_seconds
from public.profiles p
join lateral (
  select count(*)::int as solved, coalesce(sum(best), 0)::int as total_seconds
  from (
    select a.question_id, min(a.time_spent_seconds) as best
    from public.attempts a
    where a.user_id = p.id and a.status = 'solved'
    group by a.question_id
  ) x
) bt on true
where bt.solved > 0;

grant select on public.leaderboard_overall to anon, authenticated;
