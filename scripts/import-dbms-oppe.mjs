// Load the DBMS OPPE paper from scripts/dbms-oppe-paper.json into Supabase.
//
//   node scripts/import-dbms-oppe.mjs            # dry run — shows exactly what it would write
//   node scripts/import-dbms-oppe.mjs --commit   # apply
//
// Needs SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment.
//
// Incremental on purpose: it removes and rebuilds only this one paper, so any
// other subject's papers — and attempts against them — are untouched.
//
// Unlike the Python papers, each question here carries a whole database in its
// setup_sql: PGlite creates a fresh Postgres for every run, applies that SQL,
// then runs the learner's query against it. The reference query is stored
// inside solution_md as a ```sql block, which is where lib/sql.ts reads the
// grading key from — so the fence format matters and is asserted below.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REF = "hzlqdbmyvltvoqiaojjg";
const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMMIT = process.argv.includes("--commit");

const { databases } = JSON.parse(
  readFileSync(join(here, "dbms-databases.json"), "utf8"),
);
const paper = JSON.parse(readFileSync(join(here, "dbms-oppe-paper.json"), "utf8"));
const dbOf = new Map(databases.map((d) => [d.key, d]));

async function sql(query) {
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MGMT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const t = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${t.slice(0, 400)}`);
  return JSON.parse(t);
}

async function rest(path, method, body, headers = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
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
  if (!r.ok)
    throw new Error(`REST ${method} ${path} ${r.status}: ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
}

/** setup_sql is the whole database: schema first, then its rows. */
const setupFor = (key) => {
  const d = dbOf.get(key);
  if (!d) throw new Error(`question references unknown database "${key}"`);
  return `${d.ddl.trim()}\n\n${d.seed.trim()}\n`;
};

/** The ```sql fence lib/sql.ts extracts the grading key from. */
const solutionFor = (q) =>
  `A reference query:\n\n\`\`\`sql\n${q.reference_sql.trim()}\n\`\`\`\n`;

// ---------------------------------------------------------------------------
// Plan — printed in full on a dry run, so the write is never a surprise.
// ---------------------------------------------------------------------------
const bySection = new Map();
for (const q of paper.questions) {
  if (!bySection.has(q.section)) bySection.set(q.section, []);
  bySection.get(q.section).push(q);
}

console.log(`${paper.title}  (${paper.subjectSlug}, slug "${paper.slug}")`);
console.log(
  `  ${Math.round(paper.durationSeconds / 60)} min · category ${paper.category}`,
);
for (const s of paper.sections) {
  const qs = bySection.get(s.name) ?? [];
  const rule = s.bestOf == null ? "all count" : `best ${s.bestOf} of ${qs.length}`;
  console.log(`\n  ${s.name} — ${rule}${s.note ? ` ("${s.note}")` : ""}`);
  for (const q of qs)
    console.log(
      `    ${q.id}  ${String(q.marks).padStart(3)} marks  db=${q.db.padEnd(11)} ${q.title}`,
    );
  if (qs.length === 0) console.log("    (no questions yet)");
}

const pending = paper._pending?.questions ?? [];
if (pending.length)
  console.log(
    `\n  Held back (need the Python-to-Postgres runtime): ${pending.map((q) => q.id).join(", ")}`,
  );

// Fail before touching anything if the grading key wouldn't be readable.
for (const q of paper.questions) {
  const md = solutionFor(q);
  const m = md.match(/```sql\s*([\s\S]*?)```/i);
  if (!m || m[1].trim() !== q.reference_sql.trim())
    throw new Error(`${q.id}: reference query is not recoverable from solution_md`);
  setupFor(q.db);
}
console.log("\n  Every reference query is recoverable from its solution_md.");

if (!COMMIT) {
  console.log("\nDRY RUN — re-run with --commit to apply.");
  process.exit(0);
}
if (!MGMT || !URL_ || !SERVICE)
  throw new Error(
    "Set SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
const [{ exists: hasSections }] = await sql(`
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'test_set_sections'
  ) as exists;
`);
if (!hasSections)
  throw new Error(
    "test_set_sections is missing — apply supabase/migrations/0019_section_rules.sql first:\n" +
      "  node scripts/run-sql.mjs supabase/migrations/0019_section_rules.sql",
  );

const [subject] = await sql(
  `select id, is_active from public.subjects where slug = '${paper.subjectSlug}';`,
);
if (!subject)
  throw new Error(`No subject with slug "${paper.subjectSlug}".`);
if (!subject.is_active)
  console.log(
    `  NOTE: subject "${paper.subjectSlug}" is not active, so the paper won't be browsable until it is.`,
  );

// Rebuild just this paper.
await sql(`
  delete from public.test_sets
   where subject_id = '${subject.id}' and slug = '${paper.slug}';
  delete from public.questions
   where subject_id = '${subject.id}' and practice_only = false
     and '${paper.slug}' = any(tags);
`);

const [set] = await rest(
  "test_sets",
  "POST",
  [
    {
      subject_id: subject.id,
      slug: paper.slug,
      title: paper.title,
      exam: paper.exam,
      year: paper.year,
      source: paper.source,
      category: paper.category,
      duration_seconds: paper.durationSeconds,
      sort_order: paper.sortOrder,
      is_available: paper.isAvailable,
    },
  ],
  { Prefer: "return=representation" },
);

const created = await rest(
  "questions",
  "POST",
  paper.questions.map((q) => ({
    subject_id: subject.id,
    topic_id: null,
    title: q.title,
    body_md: q.body_md,
    difficulty: q.difficulty,
    kind: q.kind,
    solution_md: solutionFor(q),
    // db:<key> is how the runner finds which schema to show alongside the paper.
    tags: ["dbms", "pyq", "oppe", paper.slug, `db:${q.db}`],
    sort_order: q.sortOrder,
    tests: [],
    mcq_options: [],
    mcq_answer: null,
    setup_sql: setupFor(q.db),
    input_labels: null,
    exam: paper.exam,
    starter_code: null,
    language: "sql",
    harness: null,
    practice_only: false,
  })),
  { Prefer: "return=representation" },
);

await rest(
  "test_set_questions",
  "POST",
  created.map((row, i) => ({
    set_id: set.id,
    question_id: row.id,
    section: paper.questions[i].section,
    marks: paper.questions[i].marks,
    sort_order: paper.questions[i].sortOrder,
  })),
  { Prefer: "return=minimal" },
);

// Section rules — written for every section the paper declares, including the
// one whose questions are still pending, so the rule is already right when they
// land.
await rest(
  "test_set_sections",
  "POST",
  paper.sections.map((s) => ({
    set_id: set.id,
    name: s.name,
    sort_order: s.sortOrder,
    best_of: s.bestOf,
    note: s.note,
  })),
  { Prefer: "return=minimal" },
);

const [after] = await sql(`
  select
    (select count(*) from public.test_set_questions where set_id = '${set.id}') as questions,
    (select count(*) from public.test_set_sections  where set_id = '${set.id}') as sections;
`);
console.log(
  `\nLoaded "${paper.title}": ${after.questions} questions, ${after.sections} section rules.`,
);
