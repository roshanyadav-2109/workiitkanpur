-- Optional pre-filled boilerplate shown in the editor when a question opens
-- (e.g. a `def` skeleton or hint), as some OPPE questions ship with.
alter table questions add column if not exists starter_code text;
