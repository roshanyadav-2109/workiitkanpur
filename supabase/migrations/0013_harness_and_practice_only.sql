-- 0013_harness_and_practice_only.sql
-- Two additions for the OPPE 1 question bank. Idempotent.

-- ---------------------------------------------------------------------------
-- harness
-- ---------------------------------------------------------------------------
-- Function-implementation questions ("write this function, no I/O needed")
-- cannot be judged by the stdin/stdout runner on their own: the learner's code
-- defines a function and prints nothing. The harness is hidden driver code
-- appended to the submission at run time — it reads the arguments from stdin as
-- Python literals, calls the function and prints the result deterministically.
--
-- NULL means "run the code as-is", which is how every I/O-style question works.
alter table public.questions add column if not exists harness text;

-- ---------------------------------------------------------------------------
-- practice_only
-- ---------------------------------------------------------------------------
-- Test Series assembles its papers from a subject's coding questions. Questions
-- flagged practice_only are excluded from that assembly, so a large practice
-- bank does not get swept into the mock papers.
alter table public.questions
  add column if not exists practice_only boolean not null default false;

create index if not exists idx_questions_practice_only
  on public.questions(practice_only);
