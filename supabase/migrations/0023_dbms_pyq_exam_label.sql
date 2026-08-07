-- 0023_dbms_pyq_exam_label.sql
-- The subject is already clear from the page, so every DBMS exam badge/filter
-- should read simply "OPPE", across Practice, PYQs, and Test Series.

update public.test_sets ts
   set exam = 'OPPE'
  from public.subjects s
 where s.id = ts.subject_id
   and s.slug = 'dbms'
   and ts.exam is distinct from 'OPPE';

update public.questions q
   set exam = 'OPPE'
  from public.subjects s
 where s.id = q.subject_id
   and s.slug = 'dbms'
   and q.exam is not null
   and q.exam is distinct from 'OPPE';

notify pgrst, 'reload schema';
