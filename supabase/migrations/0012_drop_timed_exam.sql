-- 0012_drop_timed_exam.sql
-- Removes the old /app/exam "timed exam" feature from the database. Test Series
-- (0011) replaces it: its exam environment is the timed, proctored, graded mock,
-- and it stores attempts in test_attempts / test_answers.
--
-- DESTRUCTIVE: this drops every timed-exam session and answer. Run it only once
-- you're satisfied nothing there is worth keeping. Idempotent.

drop table if exists public.exam_answers;
drop table if exists public.exam_sessions;

-- The enum went with those tables; test_attempts uses test_attempt_status.
drop type if exists exam_status;
