-- ---------------------------------------------------------------------------
-- Every IIT Madras sign-in goes into the Unknown IITians announcement groups.
--
-- The main site (unknowniitians.com) keeps a numbered series of Google Groups,
-- ui-announcements-01 … NN, 499 members each, with one address book: an email
-- that already has a place is never given another, and a full group is
-- followed by the next. This site keeps no book of its own — it hands each
-- email to that system (lib/group-signup.ts, from the sign-in callback).
--
-- This table records the hand-over: which emails are queued, which were sent,
-- and which group the main site put each in. Nobody reads or writes it
-- directly — it holds every student's email. The sign-in callback reports the
-- result through mark_group_signup(), which can only touch the caller's own row.
--
-- Only IIT Madras addresses (iitm.ac.in and its sub-domains) are queued: the
-- callback refuses any other account after it has been created, and an
-- outsider must never reach the groups.
-- ---------------------------------------------------------------------------

create table if not exists public.group_signups (
  email_normalized     text primary key,
  user_id              uuid not null,
  status               text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  attempts             int  not null default 0,
  group_number         int,
  was_already_assigned boolean,
  last_error           text,
  created_at           timestamptz not null default now(),
  processed_at         timestamptz
);

create index if not exists group_signups_pending_idx on public.group_signups (created_at) where status <> 'done';

alter table public.group_signups enable row level security;
revoke all on public.group_signups from anon, authenticated;

create or replace function public.is_iitm_email(p_email text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(split_part(coalesce(p_email, ''), '@', 2)) = 'iitm.ac.in'
      or lower(split_part(coalesce(p_email, ''), '@', 2)) like '%.iitm.ac.in';
$$;

create or replace function public.queue_group_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is not null
     and public.is_iitm_email(new.email)
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    insert into public.group_signups (email_normalized, user_id)
    values (lower(btrim(new.email)), new.id)
    on conflict (email_normalized) do nothing;
  end if;
  return new;
exception when others then
  -- A sign-in is never refused because the outbox could not be written.
  return new;
end;
$$;

revoke all on function public.queue_group_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_group_signup on auth.users;
create trigger on_auth_user_group_signup
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.queue_group_signup();

-- The signed-in student's own row: what the main site answered.
create or replace function public.mark_group_signup(
  p_ok                   boolean,
  p_group_number         int default null,
  p_was_already_assigned boolean default null,
  p_error                text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;
  update public.group_signups
     set status = case when p_ok then 'done' else 'failed' end,
         attempts = attempts + 1,
         group_number = case when p_ok then p_group_number else group_number end,
         was_already_assigned = case when p_ok then p_was_already_assigned else was_already_assigned end,
         last_error = case when p_ok then null else left(p_error, 300) end,
         processed_at = now()
   where user_id = auth.uid();
end;
$$;

revoke all on function public.mark_group_signup(boolean, int, boolean, text) from public, anon;
grant execute on function public.mark_group_signup(boolean, int, boolean, text) to authenticated;

-- Every IIT Madras account so far.
insert into public.group_signups (email_normalized, user_id)
select lower(btrim(email)), id
from auth.users
where email is not null and email_confirmed_at is not null and public.is_iitm_email(email)
on conflict (email_normalized) do nothing;
