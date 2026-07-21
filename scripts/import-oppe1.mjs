// Replace the Python question bank with the OPPE 1 set in scripts/oppe1-questions.json.
//
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-oppe1.mjs           # dry run
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-oppe1.mjs --commit  # apply
//
// Also needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local).
//
// DESTRUCTIVE: deletes every row in public.questions, which cascades to
// attempts, notes and submissions. Take a backup first.
//
// Deletion is done in SQL (it cascades to attempts/notes/submissions); the
// inserts go through PostgREST so the jsonb/array columns need no escaping.
import { readFileSync } from "node:fs";

const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const questions = JSON.parse(readFileSync(new URL("./oppe1-questions.json", import.meta.url), "utf8"));

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${t.slice(0, 400)}`);
  return JSON.parse(t);
}

async function rest(path, method, body, extraHeaders = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`REST ${method} ${path} ${r.status}: ${t.slice(0, 500)}`);
  return t ? JSON.parse(t) : null;
}

const before = await sql(`
  select (select count(*) from public.questions)   as questions,
         (select count(*) from public.attempts)    as attempts,
         (select count(*) from public.notes)       as notes,
         (select count(*) from public.submissions) as submissions;
`);
console.log("before:", JSON.stringify(before[0]));
console.log(`to load: ${questions.length} questions, ` +
  `${questions.reduce((n, q) => n + q.tests.length, 0)} test cases`);

if (!COMMIT) {
  console.log("\nDRY RUN — nothing changed. Re-run with --commit to apply.");
  process.exit(0);
}

// 1. Wipe the bank, reset the Python topics to the source's three sections.
const topics = await sql(`
  delete from public.questions;

  delete from public.topics
   where subject_id = (select id from public.subjects where slug = 'python');

  insert into public.topics (subject_id, name, week, sort_order)
  select s.id, t.name, null, t.ord
    from public.subjects s,
         (values ('Data Types & Basics', 1),
                 ('Data Processing', 2),
                 ('I/O Based Problem Solving', 3)) as t(name, ord)
   where s.slug = 'python';

  select t.id, t.name
    from public.topics t
    join public.subjects s on s.id = t.subject_id
   where s.slug = 'python';
`);
const topicId = Object.fromEntries(topics.map((t) => [t.name, t.id]));
console.log("topics:", JSON.stringify(topicId, null, 0));

const subject = await sql(`select id from public.subjects where slug = 'python';`);
const subjectId = subject[0].id;

// 2. Insert in chunks so no single request gets unwieldy.
let inserted = 0;
for (let i = 0; i < questions.length; i += 25) {
  const chunk = questions.slice(i, i + 25).map((q) => ({
    subject_id: subjectId,
    topic_id: topicId[q.topic],
    title: q.title,
    body_md: q.body_md,
    difficulty: q.difficulty,
    kind: q.kind,
    solution_md: q.solution_md,
    tags: q.tags,
    sort_order: q.sort_order,
    tests: q.tests,
    mcq_options: [],
    mcq_answer: null,
    setup_sql: null,
    input_labels: q.input_labels,
    exam: q.exam,
    starter_code: q.starter_code,
    language: q.language,
    harness: q.harness,
    practice_only: q.practice_only,
  }));
  await rest("questions", "POST", chunk, { Prefer: "return=minimal" });
  inserted += chunk.length;
  process.stdout.write(`  inserted ${inserted}/${questions.length}\r`);
}
console.log(`\ninserted ${inserted} questions`);

const after = await sql(`
  select count(*) as questions,
         count(*) filter (where harness is not null) as with_harness,
         count(*) filter (where practice_only)      as practice_only,
         sum(jsonb_array_length(tests))             as test_cases
    from public.questions;
`);
console.log("after:", JSON.stringify(after[0]));
