// Add the Week 7 OPPE mock as a seventh Test Series paper.
//
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-week7-mock.mjs           # dry run
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-week7-mock.mjs --commit  # apply
//
// Incremental on purpose: it only removes and rebuilds this one set, so the six
// previous-year papers keep their rows (and any attempts against them).
import { readFileSync } from "node:fs";

const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const SLUG = "week-7-oppe-mock";
const TITLE = "Week 7 — OPPE Mock";
const questions = JSON.parse(readFileSync(new URL("./week7-oppe-mock.json", import.meta.url), "utf8"));

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

const bySection = {};
for (const q of questions) bySection[q.section] = (bySection[q.section] || 0) + 1;
console.log(`${TITLE}: ${questions.length} problems, ${questions.reduce((n, q) => n + q.tests.length, 0)} tests`);
console.log("sections:", JSON.stringify(bySection));
console.log("marks total:", questions.reduce((n, q) => n + (q.marks || 0), 0));

if (!COMMIT) {
  console.log("\nDRY RUN — re-run with --commit.");
  process.exit(0);
}

const [subject] = await sql(`select id from public.subjects where slug = 'python';`);

// Only this set. Its questions are tagged so they can be found again.
await sql(`
  delete from public.test_sets
   where subject_id = '${subject.id}' and slug = '${SLUG}';
  delete from public.questions
   where subject_id = '${subject.id}' and practice_only = false and '${SLUG}' = any(tags);
`);

const [set] = await rest("test_sets", "POST", [{
  subject_id: subject.id,
  slug: SLUG,
  title: TITLE,
  exam: "OPPE 1",
  year: null,
  source: "github.com/Shashwatology/IITM-Python-Grpa - GRPA WEEK 7 (OPPE MOCK)",
  duration_seconds: 3 * 60 * 60,
  sort_order: 7,
  is_available: true,
}], { Prefer: "return=representation" });

const created = await rest("questions", "POST", questions.map((q) => ({
  subject_id: subject.id,
  topic_id: null,
  title: q.title,
  body_md: q.body_md,
  difficulty: q.difficulty,
  kind: "coding",
  solution_md: q.solution_md,
  tags: ["oppe-1", "mock", "python", SLUG],
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

await rest("test_set_questions", "POST", created.map((row, i) => ({
  set_id: set.id,
  question_id: row.id,
  section: questions[i].section,
  marks: questions[i].marks,
  sort_order: questions[i].sort_order,
})), { Prefer: "return=minimal" });

const after = await sql(`
  select (select count(*) from public.test_sets)          as sets,
         (select count(*) from public.test_set_questions) as set_questions,
         (select count(*) from public.questions where practice_only = false) as paper_questions;
`);
console.log(`inserted ${created.length} problems`);
console.log("after:", JSON.stringify(after[0]));
