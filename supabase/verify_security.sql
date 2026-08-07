-- Read-only/rollback-only post-deployment security checks.
-- The result contains booleans only; it never returns user identifiers or PII.

select
  not has_table_privilege('anon', 'public.profiles', 'select') as anon_profiles_blocked,
  not has_table_privilege('anon', 'public.attempts', 'select') as anon_attempts_blocked,
  not has_table_privilege('anon', 'public.feedback', 'select') as anon_feedback_read_blocked,
  has_table_privilege('anon', 'public.feedback', 'insert') as anon_feedback_insert_allowed,
  not has_column_privilege('anon', 'public.questions', 'solution_md', 'select') as anon_solutions_blocked,
  not has_column_privilege('authenticated', 'public.questions', 'solution_md', 'select') as raw_auth_solutions_blocked,
  has_function_privilege('authenticated', 'public.get_question_solutions(uuid[])', 'execute') as solution_rpc_allowed,
  not has_table_privilege('anon', 'private.report_practice_activity', 'select') as anon_private_reports_blocked,
  has_table_privilege('service_role', 'private.report_practice_activity', 'select') as service_reports_allowed;

select
  bool_and(c.relrowsecurity and c.relforcerowsecurity) as sensitive_tables_force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'attempts', 'notes', 'submissions', 'test_attempts',
    'test_answers', 'activity_events', 'feedback'
  );

begin;

do $$
declare probe_user uuid;
begin
  select p.id into probe_user
  from public.profiles p
  order by p.created_at
  limit 1;
  if probe_user is null then
    raise exception 'No profile is available for the authenticated RLS probe';
  end if;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', probe_user, 'role', 'authenticated')::text,
    true
  );
end $$;

set local role authenticated;

select
  (select count(*) from public.profiles) = 1 as profile_is_own_row_only,
  not exists (
    select 1 from public.attempts where user_id <> (select auth.uid())
  ) as attempts_are_own_rows_only,
  not exists (
    select 1 from public.notes where user_id <> (select auth.uid())
  ) as notes_are_own_rows_only,
  not exists (
    select 1 from public.submissions where user_id <> (select auth.uid())
  ) as submissions_are_own_rows_only,
  not exists (
    select 1 from public.test_attempts where user_id <> (select auth.uid())
  ) as tests_are_own_rows_only,
  exists (
    select 1
    from public.get_question_solutions(
      array[(select id from public.questions order by id limit 1)]
    )
  ) as authenticated_solution_rpc_works;

-- Same-value update checks the actual profile UPDATE grant and own-row policy.
update public.profiles
set display_name = display_name
where id = (select auth.uid());

rollback;

begin;
set local role anon;
insert into public.feedback(user_id, message)
values (null, 'rollback-only security verification');
rollback;

-- Keep this as the final result set because the Management API returns the
-- last row-producing statement from a multi-statement query.
select
  not has_table_privilege('anon', 'public.profiles', 'select') as anon_profiles_blocked,
  not has_table_privilege('anon', 'public.attempts', 'select') as anon_attempts_blocked,
  not has_table_privilege('anon', 'public.feedback', 'select') as anon_feedback_read_blocked,
  has_table_privilege('anon', 'public.feedback', 'insert') as anon_feedback_insert_allowed,
  not has_column_privilege('anon', 'public.questions', 'solution_md', 'select') as anon_solutions_blocked,
  not has_column_privilege('authenticated', 'public.questions', 'solution_md', 'select') as raw_auth_solutions_blocked,
  has_function_privilege('authenticated', 'public.get_question_solutions(uuid[])', 'execute') as solution_rpc_allowed,
  not has_table_privilege('anon', 'private.report_practice_activity', 'select') as anon_private_reports_blocked,
  has_table_privilege('service_role', 'private.report_practice_activity', 'select') as service_reports_allowed,
  (
    select bool_and(c.relrowsecurity and c.relforcerowsecurity)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles', 'attempts', 'notes', 'submissions', 'test_attempts',
        'test_answers', 'activity_events', 'feedback'
      )
  ) as sensitive_tables_force_rls;
