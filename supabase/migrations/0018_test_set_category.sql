-- 0018_test_set_category.sql
-- Split the papers by what they are. Idempotent.
--
-- A previous-year paper and a mock are both sat the same way, but they answer
-- different questions for a learner ("what has actually been asked?" versus
-- "am I ready?"), so they belong under different sections. The category says
-- which, rather than the UI inferring it from a title.

alter table public.test_sets
  add column if not exists category text not null default 'mock';

alter table public.test_sets drop constraint if exists test_sets_category_chk;
alter table public.test_sets add constraint test_sets_category_chk
  check (category in ('pyq', 'mock'));

-- The six papers lifted from the previous-year archive.
update public.test_sets
   set category = 'pyq'
 where slug in ('may-2024', 'may-2024-set2', 'may-2024-set3',
                'sep-2024', 'sep-2024-set2', 'sep-2024-set3');

update public.test_sets
   set category = 'mock'
 where slug = 'week-7-oppe-mock';

create index if not exists idx_test_sets_category
  on public.test_sets(subject_id, category, sort_order);
