alter table questions add column if not exists starter_code text;

-- One demonstrative starter (a def skeleton hint), like some OPPE questions.
update questions
set starter_code = E'# Count how many decimal digits of N are divisible by 3 (treat 0 as divisible).\nn = int(input())\n\ndef count_divisible_by_three(n):\n    # TODO: complete this\n    return 0\n\nprint(count_divisible_by_three(n))\n'
where title = 'Count Digits Divisible by Three';
