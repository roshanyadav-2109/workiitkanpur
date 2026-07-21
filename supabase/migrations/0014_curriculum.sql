-- 0014_curriculum.sql
-- The degree / level / subject map, moved out of lib/curriculum.ts into tables.
-- Idempotent.
--
-- A subject is not owned by one degree: Programming in Python is a Foundation
-- course in Data Science and a Diploma course in Electronic Systems, and
-- Introduction to C Programming is Foundation in two different degrees. That is
-- a many-to-many between subjects and (degree, level), which is what
-- subject_offerings holds.

create table if not exists public.degrees (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,          -- "BS in Data Science and Applications"
  short_name text not null,          -- "Data Science & Applications"
  sort_order int  not null default 0
);

create table if not exists public.subject_offerings (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  degree_id  uuid not null references public.degrees(id)  on delete cascade,
  level      text not null,
  sort_order int  not null default 0,
  unique (subject_id, degree_id, level)
);

alter table public.subject_offerings drop constraint if exists subject_offerings_level_chk;
alter table public.subject_offerings add constraint subject_offerings_level_chk
  check (level in ('Foundation', 'Diploma', 'Degree'));

create index if not exists idx_offerings_subject on public.subject_offerings(subject_id);
create index if not exists idx_offerings_degree  on public.subject_offerings(degree_id);

-- Reference data: readable by everyone, same as subjects/topics.
alter table public.degrees           enable row level security;
alter table public.subject_offerings enable row level security;

drop policy if exists "degrees readable by everyone" on public.degrees;
create policy "degrees readable by everyone"
  on public.degrees for select using (true);

drop policy if exists "offerings readable by everyone" on public.subject_offerings;
create policy "offerings readable by everyone"
  on public.subject_offerings for select using (true);

-- ---------------------------------------------------------------------------
-- Degrees
-- ---------------------------------------------------------------------------
insert into public.degrees (slug, name, short_name, sort_order) values
  ('ds', 'BS in Data Science and Applications',   'Data Science & Applications', 1),
  ('es', 'BS in Electronic Systems',              'Electronic Systems',          2),
  ('as', 'BS in Aeronautics & Space Technology',  'Aeronautics & Space Tech',    3)
on conflict (slug) do update
  set name = excluded.name,
      short_name = excluded.short_name,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Subjects — two new ones, and names brought in line with the curriculum
-- ---------------------------------------------------------------------------
insert into public.subjects (slug, name, short_code, is_active, sort_order) values
  ('linux',      'Introduction to Linux & Programming', 'LINUX', false, 7),
  ('embedded-c', 'Embedded C Programming',              'EMBC',  false, 8)
on conflict (slug) do nothing;

update public.subjects set name = 'Introduction to C Programming'                        where slug = 'c';
update public.subjects set name = 'Programming, Data Structures & Algorithms using Python' where slug = 'pdsa';

-- ---------------------------------------------------------------------------
-- Offerings — rebuilt from scratch so removals take effect on a re-run
-- ---------------------------------------------------------------------------
delete from public.subject_offerings;

insert into public.subject_offerings (subject_id, degree_id, level, sort_order)
select s.id, d.id, v.level, v.ord
  from (values
    -- BS in Data Science and Applications
    ('python',     'ds', 'Foundation', 1),
    ('dbms',       'ds', 'Diploma',    2),
    ('pdsa',       'ds', 'Diploma',    3),
    ('java',       'ds', 'Diploma',    4),
    ('syscmd',     'ds', 'Diploma',    5),
    -- BS in Electronic Systems
    ('c',          'es', 'Foundation', 1),
    ('linux',      'es', 'Foundation', 2),
    ('embedded-c', 'es', 'Foundation', 3),
    ('python',     'es', 'Diploma',    4),
    -- BS in Aeronautics & Space Technology
    ('c',          'as', 'Foundation', 1)
  ) as v(subject_slug, degree_slug, level, ord)
  join public.subjects s on s.slug = v.subject_slug
  join public.degrees  d on d.slug = v.degree_slug;
