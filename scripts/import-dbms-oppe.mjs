// Load the DBMS OPPE paper from scripts/dbms-oppe-paper.json into Supabase.
//
//   node scripts/import-dbms-oppe.mjs            # dry run — shows exactly what it would write
//   node scripts/import-dbms-oppe.mjs --commit   # apply
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// environment, falling back to .env.local. It needs no management token: every
// write goes through PostgREST, so the one credential it uses is the one the
// app already has.
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
import { bodyWithSchema } from "./schema-markdown.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");

/** Environment, with .env.local as the fallback so no exporting is needed. */
function credentials() {
  const out = { ...process.env };
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && !out[m[1]]) out[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local — rely on the real environment */
  }
  return out;
}
const ENV = credentials();
const URL_ = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = ENV.SUPABASE_SERVICE_ROLE_KEY;

const { databases } = JSON.parse(
  readFileSync(join(here, "dbms-databases.json"), "utf8"),
);
const paper = JSON.parse(readFileSync(join(here, "dbms-oppe-paper.json"), "utf8"));
const dbOf = new Map(databases.map((d) => [d.key, d]));

async function rest(path, method = "GET", body, headers = {}) {
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

/** Does a table exist? PostgREST answers 404 with PGRST205 when it doesn't. */
async function tableExists(name) {
  const r = await fetch(`${URL_}/rest/v1/${name}?select=*&limit=1`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  return r.status !== 404;
}

/** How many rows match, without fetching them. */
async function countOf(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const range = r.headers.get("content-range") || "";
  return Number(range.split("/")[1] ?? 0);
}

/** setup_sql is the whole database: schema first, then its rows. */
const setupFor = (key) => {
  const d = dbOf.get(key);
  if (!d) throw new Error(`question references unknown database "${key}"`);
  return `${d.ddl.trim()}\n\n${d.seed.trim()}\n`;
};

/**
 * SQL questions are graded against a reference query, which is stored inside
 * solution_md as a ```sql block — that fence is where lib/sql.ts reads the
 * grading key from. Python questions carry their own written solution and are
 * graded on their output instead.
 */
const solutionFor = (q) =>
  q.solution_md ??
  `A reference query:\n\n\`\`\`sql\n${q.reference_sql.trim()}\n\`\`\`\n`;

/** The question, with its database's schema appended below the statement. */
const bodyFor = (q) => {
  const d = dbOf.get(q.db);
  if (!d) throw new Error(`question references unknown database "${q.db}"`);
  return bodyWithSchema(q.body_md, d);
};

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

// Fail before touching anything if a question could not be graded once loaded.
for (const q of paper.questions) {
  setupFor(q.db);
  if (q.kind === "sql") {
    const m = solutionFor(q).match(/```sql\s*([\s\S]*?)```/i);
    if (!m || m[1].trim() !== q.reference_sql.trim())
      throw new Error(`${q.id}: reference query is not recoverable from solution_md`);
  } else {
    const tests = q.tests ?? [];
    if (tests.length === 0)
      throw new Error(`${q.id}: a ${q.kind} question with no test cases cannot be graded`);
    if (tests.some((t) => !String(t.expected ?? "").trim()))
      throw new Error(`${q.id}: a test case has no expected output`);
    if (!tests.some((t) => t.hidden))
      throw new Error(`${q.id}: no private test cases — the answer could be hard-coded`);
    if (!tests.some((t) => !t.hidden))
      throw new Error(`${q.id}: no public test cases — nothing to check against while solving`);
  }
}
console.log("\n  Every question carries what it needs to be graded.");

if (!COMMIT) {
  console.log("\nDRY RUN — re-run with --commit to apply.");
  process.exit(0);
}
if (!URL_ || !SERVICE)
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or put them in .env.local).",
  );

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
if (!(await tableExists("test_set_sections")))
  throw new Error(
    'test_set_sections is missing — the paper\'s "Solve any one" rule has nowhere to live.\n' +
      "Apply supabase/migrations/0019_section_rules.sql first (Supabase dashboard → SQL editor,\n" +
      "or: SUPABASE_ACCESS_TOKEN=<sbp_...> node scripts/run-sql.mjs supabase/migrations/0019_section_rules.sql)",
  );

const [subject] = await rest(
  `subjects?select=id,is_active&slug=eq.${paper.subjectSlug}`,
);
if (!subject) throw new Error(`No subject with slug "${paper.subjectSlug}".`);
if (!subject.is_active)
  console.log(
    `  NOTE: subject "${paper.subjectSlug}" is not active, so the paper won't be browsable until it is.`,
  );

// Rebuild just this paper: its own set row (questions cascade from it) and the
// questions tagged with its slug. Everything else in the subject is untouched.
await rest(
  `test_sets?subject_id=eq.${subject.id}&slug=eq.${paper.slug}`,
  "DELETE",
  undefined,
  { Prefer: "return=minimal" },
);
await rest(
  `questions?subject_id=eq.${subject.id}&practice_only=is.false` +
    `&tags=cs.%7B${encodeURIComponent(paper.slug)}%7D`,
  "DELETE",
  undefined,
  { Prefer: "return=minimal" },
);

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
    body_md: bodyFor(q),
    difficulty: q.difficulty,
    kind: q.kind,
    solution_md: solutionFor(q),
    tags: ["dbms", "pyq", "oppe", paper.slug, `db:${q.db}`],
    sort_order: q.sortOrder,
    // Python questions are graded on their output; each case carries the files
    // and command-line arguments that run drives the program with.
    tests: q.tests ?? [],
    mcq_options: [],
    mcq_answer: null,
    // Both kinds get the whole database: the SQL runtime queries it directly,
    // the Python runtime hands it to psycopg2.
    setup_sql: setupFor(q.db),
    input_labels: null,
    exam: paper.exam,
    starter_code: q.starter_code ?? null,
    language: q.language ?? (q.kind === "sql" ? "sql" : "python"),
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

const loadedQuestions = await countOf(
  `test_set_questions?select=id&set_id=eq.${set.id}`,
);
const loadedSections = await countOf(
  `test_set_sections?select=id&set_id=eq.${set.id}`,
);
console.log(
  `\nLoaded "${paper.title}": ${loadedQuestions} questions, ${loadedSections} section rules.`,
);
