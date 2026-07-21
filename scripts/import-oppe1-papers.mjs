// Load the OPPE 1 previous-year papers in scripts/oppe1-pyq-papers.json as
// Test Series sets.
//
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-oppe1-papers.mjs           # dry run
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-oppe1-papers.mjs --commit  # apply
//
// Also needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Re-runnable: it drops the previously loaded paper questions (tagged 'pyq')
// and their sets, then rebuilds. The practice bank (practice_only) is untouched.
import { readFileSync } from "node:fs";

const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const sets = JSON.parse(readFileSync(new URL("./oppe1-pyq-papers.json", import.meta.url), "utf8"));

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
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`REST ${method} ${path} ${r.status}: ${t.slice(0, 500)}`);
  return t ? JSON.parse(t) : null;
}

console.log(`papers: ${sets.length}`);
for (const s of sets) {
  console.log(`  ${s.title.padEnd(22)} ${String(s.questions.length).padStart(2)} problems`);
}
const total = sets.reduce((n, s) => n + s.questions.length, 0);
console.log(`total questions: ${total}, test cases: ${total * 5}`);

if (!COMMIT) {
  console.log("\nDRY RUN — nothing changed. Re-run with --commit.");
  process.exit(0);
}

const [subject] = await sql(`select id from public.subjects where slug = 'python';`);
const subjectId = subject.id;

// Clear any previous load so this is idempotent.
await sql(`
  delete from public.test_sets where subject_id = '${subjectId}';
  delete from public.questions
   where subject_id = '${subjectId}' and practice_only = false and 'pyq' = any(tags);
`);

let inserted = 0;
for (const s of sets) {
  const [set] = await rest("test_sets", "POST", [{
    subject_id: subjectId,
    slug: s.slug,
    title: s.title,
    exam: s.exam,
    year: s.year,
    source: s.source,
    duration_seconds: s.duration_seconds,
    sort_order: s.sort_order,
    is_available: true,
  }], { Prefer: "return=representation" });

  const rows = s.questions.map((q) => ({
    subject_id: subjectId,
    topic_id: null,
    title: q.title,
    body_md: q.body_md,
    difficulty: q.difficulty,
    kind: "coding",
    solution_md: q.solution_md,
    tags: q.tags,
    sort_order: q.sort_order,
    tests: q.tests,
    mcq_options: [],
    mcq_answer: null,
    setup_sql: null,
    input_labels: q.input_labels,
    exam: s.exam,
    starter_code: q.starter_code,
    language: "python",
    harness: q.harness,
    practice_only: false, // belongs to a paper, not the practice bank
  }));

  const created = await rest("questions", "POST", rows, {
    Prefer: "return=representation",
  });

  await rest("test_set_questions", "POST", created.map((q, i) => ({
    set_id: set.id,
    question_id: q.id,
    section: s.questions[i].section,
    marks: s.questions[i].marks,
    sort_order: s.questions[i].sort_order,
  })), { Prefer: "return=minimal" });

  inserted += created.length;
  console.log(`  loaded ${s.title} (${created.length})`);
}

const after = await sql(`
  select (select count(*) from public.test_sets)                                   as sets,
         (select count(*) from public.test_set_questions)                          as set_questions,
         (select count(*) from public.questions where practice_only = false)       as paper_questions,
         (select count(*) from public.questions where practice_only = true)        as practice_questions;
`);
console.log("after:", JSON.stringify(after[0]));
console.log(`inserted ${inserted} paper questions`);
