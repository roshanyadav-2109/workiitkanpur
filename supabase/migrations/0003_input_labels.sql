-- Per-line labels for the guided "Custom input" form. Each entry names the
-- value the learner should type on that stdin line (e.g. length / breadth).
alter table questions add column if not exists input_labels text[];
