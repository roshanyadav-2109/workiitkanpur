-- 0022_restore_leaderboard_names.sql
-- Display names are intentionally public on leaderboards. Authentication UUIDs,
-- email addresses, phone numbers, code, notes, and activity remain private.
-- If a profile name itself looks like contact information, use a safe fallback.

create or replace view public.leaderboard_overall
with (security_barrier = true) as
select p.public_id,
       case
         when nullif(btrim(p.display_name), '') is null
           or position('@' in p.display_name) > 0
           or btrim(p.display_name) ~ '^\+?[0-9 ()-]{8,}$'
         then 'Student'
         else left(btrim(p.display_name), 80)
       end as name,
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

create or replace view public.question_leaderboard
with (security_barrier = true) as
select a.question_id,
       p.public_id,
       case
         when nullif(btrim(p.display_name), '') is null
           or position('@' in p.display_name) > 0
           or btrim(p.display_name) ~ '^\+?[0-9 ()-]{8,}$'
         then 'Student'
         else left(btrim(p.display_name), 80)
       end as name,
       min(a.time_spent_seconds)::int as best_time
  from public.attempts a
  join public.profiles p on p.id = a.user_id
 where a.status = 'solved'
 group by a.question_id, p.public_id, p.display_name;

create or replace view public.mock_leaderboard
with (security_barrier = true) as
select distinct on (t.set_id, t.user_id)
       t.set_id,
       t.set_name,
       p.public_id,
       case
         when nullif(btrim(p.display_name), '') is null
           or position('@' in p.display_name) > 0
           or btrim(p.display_name) ~ '^\+?[0-9 ()-]{8,}$'
         then 'Student'
         else left(btrim(p.display_name), 80)
       end as name,
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

revoke all on public.leaderboard_overall,
  public.question_leaderboard, public.mock_leaderboard
  from public, anon, authenticated;
grant select on public.leaderboard_overall,
  public.question_leaderboard, public.mock_leaderboard
  to anon, authenticated;

notify pgrst, 'reload schema';
