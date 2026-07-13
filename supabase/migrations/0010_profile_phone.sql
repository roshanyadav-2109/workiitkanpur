-- 0010_profile_phone.sql
-- Add an optional phone number to the profile. Safe to re-run.
alter table public.profiles add column if not exists phone text;
