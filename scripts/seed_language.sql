-- The programming language a question is authored in. Fixed per question
-- (derived from the subject/question path); never chosen by the learner.
alter table questions add column if not exists language text;

update questions set language = case
  when kind = 'sql' then 'sql'
  when kind = 'shell' then 'bash'
  when kind = 'coding' then 'python'
  else null
end
where language is null;
