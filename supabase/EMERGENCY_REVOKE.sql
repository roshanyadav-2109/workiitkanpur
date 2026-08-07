-- Run this immediately in Supabase Dashboard > SQL Editor if migration 0020
-- cannot be deployed at once. It closes the currently confirmed cross-user
-- exposures without modifying or deleting any stored rows.

revoke all on public.report_practice_activity
  from public, anon, authenticated;
revoke all on public.report_test_activity
  from public, anon, authenticated;
revoke all on public.question_top_solutions
  from public, anon, authenticated;

-- These old views contain auth user UUIDs and profile-derived names. Migration
-- 0020 replaces them with pseudonymous aggregate-only versions.
revoke all on public.leaderboard_overall
  from public, anon, authenticated;
revoke all on public.question_leaderboard
  from public, anon, authenticated;
revoke all on public.mock_leaderboard
  from public, anon, authenticated;

revoke all on public.seed_students
  from public, anon, authenticated;

notify pgrst, 'reload schema';
