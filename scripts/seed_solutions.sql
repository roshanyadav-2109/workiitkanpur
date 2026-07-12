-- Seed representative "last submitted code" + notes for every solved
-- (user, question) so the question-analysis / comparison view has data to show.
-- These are sample solutions for the demo; real submissions overwrite them.

with solved as (
  select distinct user_id, question_id from public.attempts where status = 'solved'
)
insert into public.submissions (user_id, question_id, code, language, updated_at)
select
  s.user_id,
  s.question_id,
  (case abs(hashtext(s.user_id::text || s.question_id::text)) % 4
    when 0 then E'n = int(input())\nxs = list(map(int, input().split()))\nprint(sum(x for x in xs if x % 2 == 0))'
    when 1 then E'n = int(input())\ntotal = 0\nfor x in map(int, input().split()):\n    if x % 2 == 0:\n        total += x\nprint(total)'
    when 2 then E'data = list(map(int, input().split()))\nevens = [x for x in data if not x & 1]\nprint(sum(evens))'
    else E'import sys\nnums = list(map(int, sys.stdin.read().split()))\nprint(sum(v for v in nums if v % 2 == 0))'
  end),
  'python',
  now()
from solved s
on conflict (user_id, question_id) do update set code = excluded.code, updated_at = now();

with solved as (
  select distinct user_id, question_id from public.attempts where status = 'solved'
)
insert into public.notes (user_id, question_id, content_md, updated_at)
select
  s.user_id,
  s.question_id,
  (case abs(hashtext(s.question_id::text || s.user_id::text)) % 5
    when 0 then E'Read the input, filter with a comprehension, then sum. Remember the empty-input edge case.'
    when 1 then E'Used a running total in a plain loop — easier to read than a one-liner. Runs in O(n).'
    when 2 then E'Key idea: test parity with `x % 2 == 0`. Be careful with negative numbers.'
    when 3 then E'Read everything from stdin at once with `sys.stdin` — much faster for large inputs.'
    else E'Bit trick: `x & 1` is 0 for even numbers, so `not x & 1` keeps the evens. Slightly quicker.'
  end),
  now()
from solved s
on conflict (user_id, question_id) do nothing;

select
  (select count(*) from public.submissions) as submissions,
  (select count(*) from public.notes) as notes;
