-- ---------------------------------------------------------------------------
-- Locking the question bank against copying.
--
-- APPLY ONLY AFTER the site that reads questions through the server's own
-- key (SUPABASE_SERVICE_ROLE_KEY) is live: this takes the question text,
-- tests and answer keys off the public key, and the previous release read
-- them with it.
--
-- What the public key could do before: GET /rest/v1/questions?select=* returned
-- every question's text, its hidden tests and its answer key to anyone, with no
-- login. Now the public and signed-in keys keep only the columns that lists and
-- progress pages need (title, kind, difficulty, tags ...); the rest is read by
-- the server, which decides what each visitor is shown.
--
-- Also here:
--   * content_access   what each account opened — a limit and a trail.
--   * open_question / open_test_set   the per-account limit.
--   * get_question_solutions   a signed-in student gets a solution only for a
--     question they opened, a paper they sat, or one they answered.
--   * scrape_signals   what looks like copying, for staff to read. The app
--     writes it with the service role; nobody else may.
-- ---------------------------------------------------------------------------

-- 1. Question content off the public and signed-in keys ----------------------
revoke select (body_md, tests, mcq_options, mcq_answer, setup_sql, input_labels,
               starter_code, language, harness)
  on public.questions from anon, authenticated;

-- 2. What an account opened ---------------------------------------------------
create table if not exists public.content_access (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  set_id      uuid references public.test_sets(id) on delete cascade,
  opened_at   timestamptz not null default now(),
  constraint content_access_one_target check ((question_id is null) <> (set_id is null))
);

create index if not exists content_access_user_idx on public.content_access (user_id, opened_at desc);
create index if not exists content_access_question_idx on public.content_access (question_id) where question_id is not null;
create index if not exists content_access_set_idx on public.content_access (set_id) where set_id is not null;

alter table public.content_access enable row level security;
alter table public.content_access force row level security;

drop policy if exists content_access_own on public.content_access;
create policy content_access_own on public.content_access
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.content_access from anon, authenticated;
grant select on public.content_access to authenticated;

create table if not exists public.scrape_signals (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  kind        text not null check (kind in ('limit', 'trap')),
  user_id     uuid references public.profiles(id) on delete set null,
  question_id uuid,
  set_id      uuid,
  ip          text,
  user_agent  text,
  path        text
);

create index if not exists scrape_signals_at_idx on public.scrape_signals (at desc);

alter table public.scrape_signals enable row level security;
alter table public.scrape_signals force row level security;
revoke all on public.scrape_signals from anon, authenticated;

-- 3. The per-account limits ---------------------------------------------------
-- Practice questions: 60 new ones an hour, 200 a day. Papers: 8 an hour, 25 a
-- day. Opening again one already opened in the last day is always allowed.
create or replace function public.open_question(p_question uuid)
returns table (allowed boolean, opened_last_hour int, opened_today int)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  uid       uuid := (select auth.uid());
  last_hour int;
  today     int;
begin
  if uid is null then
    return query select false, 0, 0;
    return;
  end if;

  select count(distinct question_id) filter (where opened_at > now() - interval '1 hour'),
         count(distinct question_id)
    into last_hour, today
    from public.content_access
   where user_id = uid and question_id is not null and opened_at > now() - interval '1 day';

  if exists (
    select 1 from public.content_access
     where user_id = uid and question_id = p_question and opened_at > now() - interval '1 day'
  ) then
    return query select true, last_hour, today;
    return;
  end if;

  if last_hour >= 60 or today >= 200 then
    return query select false, last_hour, today;
    return;
  end if;

  insert into public.content_access (user_id, question_id) values (uid, p_question);
  return query select true, last_hour + 1, today + 1;
end;
$$;

create or replace function public.open_test_set(p_set uuid)
returns table (allowed boolean, opened_last_hour int, opened_today int)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  uid       uuid := (select auth.uid());
  last_hour int;
  today     int;
begin
  if uid is null then
    return query select false, 0, 0;
    return;
  end if;

  select count(distinct set_id) filter (where opened_at > now() - interval '1 hour'),
         count(distinct set_id)
    into last_hour, today
    from public.content_access
   where user_id = uid and set_id is not null and opened_at > now() - interval '1 day';

  if exists (
    select 1 from public.content_access
     where user_id = uid and set_id = p_set and opened_at > now() - interval '1 day'
  ) then
    return query select true, last_hour, today;
    return;
  end if;

  if last_hour >= 8 or today >= 25 then
    return query select false, last_hour, today;
    return;
  end if;

  insert into public.content_access (user_id, set_id) values (uid, p_set);
  return query select true, last_hour + 1, today + 1;
end;
$$;

revoke execute on function public.open_question(uuid) from public, anon, authenticated;
revoke execute on function public.open_test_set(uuid) from public, anon, authenticated;
grant execute on function public.open_question(uuid) to authenticated;
grant execute on function public.open_test_set(uuid) to authenticated;

-- 4. Solutions only for what the account opened -----------------------------
-- A question counts as theirs if they opened it in the last 7 days, or opened a
-- paper that holds it in the last 90. Only content_access says so: it is
-- written by open_question / open_test_set alone. Rows of attempts,
-- submissions or test_answers are NOT evidence — a signed-in key can insert
-- those for any question, so they would let an account unlock every solution.
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
     and q.id = any(target_ids)
     and exists (
       select 1 from public.content_access c
        where c.user_id = (select auth.uid())
          and (
            (c.question_id = q.id and c.opened_at > now() - interval '7 days')
            or (c.set_id in (select tsq.set_id from public.test_set_questions tsq where tsq.question_id = q.id)
                and c.opened_at > now() - interval '90 days')
          )
     );
$$;

revoke execute on function public.get_question_solutions(uuid[]) from public, anon, authenticated;
grant execute on function public.get_question_solutions(uuid[]) to authenticated;
