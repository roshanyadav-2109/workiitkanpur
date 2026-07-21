// Load the GrPA weeks 1-5 questions in scripts/grpa-week1-5-questions.json
// into the Python practice bank.
//
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-grpa.mjs           # dry run
//   SUPABASE_ACCESS_TOKEN=... node scripts/import-grpa.mjs --commit  # apply
//
// Also needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Re-runnable: drops previously loaded GrPA rows (tagged 'grpa') and rebuilds.
// The OPPE bank and the Test Series papers are untouched.
import { readFileSync } from "node:fs";

const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const rows = JSON.parse(readFileSync(new URL("./grpa-week1-5-questions.json", import.meta.url), "utf8"));

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

const byTopic = {};
for (const r of rows) byTopic[r.topic] = (byTopic[r.topic] || 0) + 1;
console.log(`to load: ${rows.length} questions, ${rows.reduce((n, r) => n + r.tests.length, 0)} tests`);
console.log("by topic:", JSON.stringify(byTopic));

if (!COMMIT) {
  console.log("\nDRY RUN — re-run with --commit.");
  process.exit(0);
}

const [subject] = await sql(`select id from public.subjects where slug = 'python';`);
const topics = await sql(`
  select t.id, t.name from public.topics t
   where t.subject_id = '${subject.id}';
`);
const topicId = Object.fromEntries(topics.map((t) => [t.name, t.id]));
const missing = [...new Set(rows.map((r) => r.topic))].filter((t) => !topicId[t]);
if (missing.length) throw new Error(`no such topic(s): ${missing.join(", ")}`);

await sql(`
  delete from public.questions
   where subject_id = '${subject.id}' and 'grpa' = any(tags);
`);

let n = 0;
for (let i = 0; i < rows.length; i += 25) {
  const chunk = rows.slice(i, i + 25).map((q) => ({
    subject_id: subject.id,
    topic_id: topicId[q.topic],
    title: q.title,
    body_md: q.body_md,
    difficulty: q.difficulty,
    kind: "coding",
    solution_md: q.solution_md,
    tags: q.tags,
    sort_order: 0, // set by the alphabetical re-rank below
    tests: q.tests,
    mcq_options: [],
    mcq_answer: null,
    setup_sql: null,
    input_labels: q.input_labels,
    exam: q.exam,
    starter_code: q.starter_code,
    language: q.language,
    harness: q.harness,
    practice_only: true,
  }));
  await rest("questions", "POST", chunk, { Prefer: "return=minimal" });
  n += chunk.length;
  process.stdout.write(`  inserted ${n}/${rows.length}\r`);
}
console.log(`\ninserted ${n} GrPA questions`);

// The practice bank reads A-Z, so re-rank the whole of it including the new rows.
await sql(`
  with ranked as (
    select id, row_number() over (order by lower(title), id) as rk
      from public.questions
     where subject_id = '${subject.id}' and practice_only = true
  )
  update public.questions q set sort_order = r.rk from ranked r where q.id = r.id;
`);

const after = await sql(`
  select count(*) filter (where practice_only) as practice,
         count(*) filter (where practice_only and 'grpa' = any(tags)) as grpa,
         count(*) filter (where practice_only and exam = 'OPPE 1') as oppe,
         count(*) filter (where not practice_only) as paper_questions,
         sum(jsonb_array_length(tests)) as tests
    from public.questions;
`);
console.log("after:", JSON.stringify(after[0]));
