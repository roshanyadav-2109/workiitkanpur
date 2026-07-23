// Validates scripts/dbms-oppe-paper.json against its databases, in PGlite.
//
//   node scripts/check-paper.mjs
//
// Every reference query is the definition of a correct answer, so each one is
// actually executed and checked for the properties that make it gradable:
//
//   - it runs, and returns at least one row (an empty answer is unmarkable)
//   - it doesn't return the whole table (which would mean the filter is untested)
//   - ORDER BY appears if and only if the paper says the question is ordered,
//     because lib/grading.ts reads ORDER BY in the reference as the signal that
//     row order is part of the answer
//   - a wrong-but-plausible variant returns something DIFFERENT, so the seed
//     data can actually tell a right answer from a near miss
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = dirname(fileURLToPath(import.meta.url));
const { databases } = JSON.parse(
  readFileSync(join(here, "dbms-databases.json"), "utf8"),
);
const paper = JSON.parse(readFileSync(join(here, "dbms-oppe-paper.json"), "utf8"));

let problems = 0;
const fail = (id, msg) => {
  problems++;
  console.log(`  FAIL ${id}: ${msg}`);
};

// Near misses a student plausibly writes. If one returns the same rows as the
// reference, the seed data doesn't discriminate and the question tests nothing.
const DECOYS = {
  Q1: ["SELECT room_number, building FROM classroom WHERE capacity >= 50"],
  Q2: [
    "SELECT player_id FROM players WHERE name LIKE '%a%'",
    "SELECT player_id FROM players WHERE name LIKE 'a%'",
  ],
  Q3: ["SELECT match_date FROM matches WHERE host_team_score BETWEEN 3 AND 5"],
  Q6: [
    "SELECT t.name, m.name FROM managers m JOIN teams t ON t.team_id = m.team_id WHERE m.mgr_id NOT IN ('M0001','M0003')",
    "SELECT t.name, m.name FROM managers m JOIN teams t ON t.team_id = m.team_id WHERE m.mgr_id IN ('M0001','M0003','M0005')",
  ],
  Q7: [
    "SELECT p.name, p.dob, t.name, m.name FROM players p JOIN teams t ON t.team_id = p.team_id JOIN managers m ON m.team_id = t.team_id WHERE p.jersey_no >= 59",
  ],
};

const open = async (key) => {
  const d = databases.find((x) => x.key === key);
  if (!d) throw new Error(`no database "${key}"`);
  const pg = new PGlite();
  await pg.exec(d.ddl);
  await pg.exec(d.seed);
  return pg;
};

const shape = (r) =>
  JSON.stringify(
    (r.rows ?? []).map((row) => Object.values(row).map(String).join("")).sort(),
  );

const pool = new Map();
for (const key of new Set(paper.questions.map((q) => q.db)))
  pool.set(key, await open(key));

console.log(`${paper.title} — ${paper.questions.length} questions\n`);

for (const q of paper.questions) {
  const pg = pool.get(q.db);

  if (q.kind === "sql") {
    // A SQL question's cases are datasets: the one shown in the question, and
    // a hidden one it is graded against. Without the hidden one, a query that
    // simply prints the visible answer passes.
    const cases = q.tests ?? [];
    const pub = cases.filter((t) => !t.hidden).length;
    const hidden = cases.filter((t) => t.hidden);
    if (!pub) fail(q.id, "no visible dataset");
    if (!hidden.length)
      fail(q.id, "no hidden dataset — a hard-coded answer would pass");
    for (const h of hidden)
      if (!h.setup)
        fail(q.id, "a hidden case carries no dataset of its own");
  }

  // Questions graded on program output rather than on a result set.
  if (q.kind !== "sql") {
    const tests = q.tests ?? [];
    const pub = tests.filter((t) => !t.hidden).length;
    const priv = tests.filter((t) => t.hidden).length;
    if (!pub) fail(q.id, "no public test cases");
    if (!priv) fail(q.id, "no private test cases — the answer could be hard-coded");
    for (const [i, t] of tests.entries()) {
      if (!String(t.expected ?? "").trim())
        fail(q.id, `test ${i + 1} has no expected output`);
      if (t.files && Object.keys(t.files).length === 0)
        fail(q.id, `test ${i + 1} declares files but supplies none`);
    }
    // Different inputs must produce different answers, or the private cases
    // are decoration and a hard-coded print would pass them all.
    const distinct = new Set(tests.map((t) => t.expected)).size;
    if (distinct < 2)
      fail(q.id, "every test expects the same output — hard-coding would pass");
    console.log(
      `  ok   ${q.id} ${String(q.marks).padStart(3)} marks  ` +
        `${pub} public + ${priv} private  ${distinct} distinct answers`,
    );
    continue;
  }


  let res;
  try {
    res = await pg.query(q.reference_sql);
  } catch (e) {
    fail(q.id, `reference query failed: ${e.message ?? e}`);
    continue;
  }
  const n = res.rows.length;

  if (n === 0) fail(q.id, "reference returns no rows — nothing to mark against");

  const hasOrderBy = /\border\s+by\b/i.test(
    q.reference_sql.replace(/'(?:[^']|'')*'/g, "''"),
  );
  if (hasOrderBy !== !!q.ordered)
    fail(
      q.id,
      `ordered is ${q.ordered} but the reference ${hasOrderBy ? "has" : "has no"} ORDER BY — ` +
        `the grader keys row-order sensitivity off exactly this`,
    );

  // Is the filter doing any work at all?
  const table = /\bfrom\s+([a-z_][a-z0-9_]*)/i.exec(q.reference_sql)?.[1];
  if (table) {
    const all = await pg.query(`select count(*)::int as n from ${table}`);
    if (n === all.rows[0].n && !/group\s+by/i.test(q.reference_sql))
      fail(q.id, `returns every row of ${table} — the filter is untested`);
  }

  let decoysChecked = 0;
  for (const d of DECOYS[q.id] ?? []) {
    let dr;
    try {
      dr = await pg.query(d);
    } catch {
      continue; // a decoy that doesn't parse can't be a false pass
    }
    decoysChecked++;
    if (shape(dr) === shape(res))
      fail(q.id, `a wrong variant returns the SAME result — seed doesn't discriminate:\n        ${d}`);
  }

  const hiddenCount = (q.tests ?? []).filter((t) => t.hidden).length;
  console.log(
    `  ok   ${q.id} ${String(q.marks).padStart(3)} marks  ${String(n).padStart(2)} row(s)  ` +
      `ordered=${q.ordered ? "yes" : "no "}  decoys=${decoysChecked}  ` +
      `hidden=${hiddenCount}`,
  );
}

// The paper's own arithmetic, using the same rules the app scores with.
const bySection = new Map();
for (const q of paper.questions) {
  if (!bySection.has(q.section)) bySection.set(q.section, []);
  bySection.get(q.section).push(q);
}
let total = 0;
console.log("");
for (const s of paper.sections) {
  const qs = bySection.get(s.name) ?? [];
  const marks = qs.map((q) => q.marks).sort((a, b) => b - a);
  const k = s.bestOf == null || s.bestOf >= marks.length ? marks.length : s.bestOf;
  const secTotal = marks.slice(0, k).reduce((a, b) => a + b, 0);
  total += secTotal;
  console.log(
    `  ${s.name}: ${qs.length} imported question(s), ` +
      `${s.bestOf == null ? "all count" : `best ${s.bestOf}`} — ${secTotal} marks`,
  );
  if (qs.length === 0 && s.bestOf != null)
    console.log(`       (its questions are still pending — see _pending)`);
}
console.log(`  Paper total as imported: ${total} marks\n`);

for (const pg of pool.values()) await pg.close();
console.log(
  problems === 0
    ? "Every reference query runs, discriminates, and matches its ordered flag."
    : `${problems} problem(s) found.`,
);
process.exit(problems ? 1 : 0);
