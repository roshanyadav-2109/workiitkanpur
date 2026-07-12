-- Which OPPE a question belongs to (e.g. "OPPE 1" / "OPPE 2"). A subject can
-- run several exams over the same syllabus; this tags each question to one.
alter table questions add column if not exists exam text;
