// Add the Week 7 OPPE mock as a seventh Test Series paper.
//
//   node load_week7.mjs            # dry run
//   node load_week7.mjs --commit   # apply
//
// Incremental on purpose: it only removes and rebuilds this one set, so the six
// previous-year papers keep their rows (and any attempts against them).
import { readFileSync } from "node:fs";

const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const sets = JSON.parse(readFileSync(new URL("./oppe1-pyq-2025-sets.json", import.meta.url), "utf8"));

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

async function rest(path, method, body, headers = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json", ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`REST ${method} ${path} ${r.status}: ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
}

const total = sets.reduce((n, s) => n + s.questions.length, 0);
console.log(`${sets.length} PYQ 2025 sets, ${total} questions, ${total * 5} tests`);
for (const s of sets) console.log(`  ${s.title.padEnd(14)} ${s.questions.length} questions`);

if (!COMMIT) {
  console.log("DRY RUN — re-run with --commit.");
  process.exit(0);
}

const [subject] = await sql(`select id from public.subjects where slug = 'python';`);

for (const set of sets) {
  await sql(`
    delete from public.test_sets
     where subject_id = '${subject.id}' and slug = '${set.slug}';
    delete from public.questions
     where subject_id = '${subject.id}' and practice_only = false and '${set.slug}' = any(tags);
  `);

  const [row] = await rest("test_sets", "POST", [{
    subject_id: subject.id,
    slug: set.slug,
    title: set.title,
    exam: "OPPE 1",
    year: null,
    source: "IITM BS Seek portal - official OPPE 1 previous-year paper",
    category: "pyq",
    duration_seconds: set.duration_seconds,
    sort_order: set.sort_order,
    is_available: true,
  }], { Prefer: "return=representation" });

  const created = await rest("questions", "POST", set.questions.map((q) => ({
    subject_id: subject.id,
    topic_id: null,
    title: q.title,
    body_md: q.body_md,
    difficulty: q.difficulty,
    kind: "coding",
    solution_md: q.solution_md,
    tags: ["oppe-1", "pyq", "python", set.slug],
    sort_order: q.sort_order,
    tests: q.tests,
    mcq_options: [],
    mcq_answer: null,
    setup_sql: null,
    input_labels: q.input_labels,
    exam: "OPPE 1",
    starter_code: q.starter_code,
    language: "python",
    harness: q.harness,
    practice_only: false,
  })), { Prefer: "return=representation" });

  await rest("test_set_questions", "POST", created.map((r, i) => ({
    set_id: row.id,
    question_id: r.id,
    section: set.questions[i].section,
    marks: set.questions[i].marks,
    sort_order: set.questions[i].sort_order,
  })), { Prefer: "return=minimal" });

  console.log(`  loaded ${set.title} (${created.length})`);
}

const after = await sql(`
  select (select count(*) from public.test_sets) as sets,
         (select count(*) from public.test_set_questions) as set_questions,
         (select count(*) from public.questions where practice_only = false) as paper_questions;
`);
console.log("after:", JSON.stringify(after[0]));
