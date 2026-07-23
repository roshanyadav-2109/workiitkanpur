-- 0019_section_rules.sql
-- Per-section marking rules, so a paper's shape is data rather than code.
--
-- Real OPPE papers don't all score the same way. The DBMS paper has two
-- sections: seven SQL questions that all count, and two Python-PostgreSQL
-- questions where only the better of the two counts ("Solve Any One"). Nothing
-- in the schema could express that, and marks were being stored on
-- test_set_questions and then ignored by the scorer.
--
-- Sections themselves stay derived from test_set_questions.section (a paper
-- always has its sections); this table only carries the RULES for a section, so
-- a paper with no rows here behaves exactly as before — every question counts.
-- Idempotent.

create table if not exists public.test_set_sections (
  id         uuid primary key default gen_random_uuid(),
  set_id     uuid not null references public.test_sets(id) on delete cascade,
  -- Matches test_set_questions.section verbatim.
  name       text not null,
  sort_order int  not null default 0,
  -- How many of this section's questions count toward the score. NULL = all of
  -- them. 1 means "solve any one": the single best answer is taken and the
  -- section is marked out of the highest-marked question in it.
  best_of    int,
  -- Optional per-section note rendered to the student, e.g. "Solve any one".
  note       text,
  unique (set_id, name),
  constraint test_set_sections_best_of_positive check (best_of is null or best_of > 0)
);

create index if not exists idx_test_set_sections_set
  on public.test_set_sections(set_id);

-- A question with no explicit marks is worth 1, so existing papers keep their
-- "one point per question" behaviour after the scorer starts reading marks.
alter table public.test_set_questions
  alter column marks set default 1;

update public.test_set_questions set marks = 1 where marks is null;

-- Same public-reference-data policy as the other paper tables.
alter table public.test_set_sections enable row level security;

drop policy if exists "test_set_sections readable by everyone" on public.test_set_sections;
create policy "test_set_sections readable by everyone"
  on public.test_set_sections for select using (true);
