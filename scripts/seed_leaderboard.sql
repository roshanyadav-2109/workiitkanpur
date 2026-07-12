-- seed_leaderboard.sql — sample students + attempts so the leaderboard and
-- progress pages have data to show. Idempotent (guards on existing rows).
--   node scripts/run-sql.mjs scripts/seed_leaderboard.sql

-- 1) Sample students (profiles auto-created by the on_auth_user_created trigger)
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
       'authenticated', s.email, crypt('Password123!', gen_salt('bf')),
       now(), now() - (s.idx || ' days')::interval, now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('display_name', s.name)
from (values
  ('aarav.sharma@oppe.dev','Aarav Sharma',1),
  ('meera.krishnan@oppe.dev','Meera Krishnan',2),
  ('rohan.verma@oppe.dev','Rohan Verma',3),
  ('priya.das@oppe.dev','Priya Das',4),
  ('kabir.mehta@oppe.dev','Kabir Mehta',5),
  ('ananya.rao@oppe.dev','Ananya Rao',6),
  ('ishaan.gupta@oppe.dev','Ishaan Gupta',7)
) as s(email, name, idx)
where not exists (select 1 from auth.users u where u.email = s.email);

-- 2) Solved attempts across users x questions (deterministic, varied times)
insert into public.attempts (user_id, question_id, status, time_spent_seconds, is_correct, created_at)
select p.id, q.id, 'solved'::attempt_status,
       25 + (abs(hashtextextended(p.id::text || q.id::text, 42)) % 220)::int,
       true,
       now() - ((abs(hashtextextended(p.id::text || q.id::text, 3)) % 240)) * interval '1 hour'
from public.profiles p
cross join public.questions q
where (abs(hashtextextended(p.id::text || q.id::text, 7)) % 100) < 68
  and not exists (select 1 from public.attempts a where a.user_id = p.id and a.question_id = q.id);

-- 3) Some attempted-but-unsolved rows, for progress variety
insert into public.attempts (user_id, question_id, status, time_spent_seconds, is_correct, created_at)
select p.id, q.id, 'attempted'::attempt_status,
       40 + (abs(hashtextextended(p.id::text || q.id::text, 11)) % 180)::int,
       false,
       now() - ((abs(hashtextextended(p.id::text || q.id::text, 5)) % 200)) * interval '1 hour'
from public.profiles p
cross join public.questions q
where (abs(hashtextextended(p.id::text || q.id::text, 7)) % 100) >= 68
  and (abs(hashtextextended(p.id::text || q.id::text, 9)) % 100) < 55
  and not exists (select 1 from public.attempts a where a.user_id = p.id and a.question_id = q.id);
