alter table questions add column if not exists exam text;

-- Default split by week: early weeks -> OPPE 1, later weeks -> OPPE 2.
-- (Adjust per subject as the real syllabus dictates.)
update questions q
set exam = case
  when t.week is null then null
  when t.week <= 3 then 'OPPE 1'
  else 'OPPE 2'
end
from topics t
where q.topic_id = t.id;
