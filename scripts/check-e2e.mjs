// End-to-end rehearsal of a DBMS paper, using the app's own code.
//
//   node --experimental-strip-types scripts/check-e2e.mjs
//
// Builds each question row exactly as scripts/import-dbms-oppe.mjs would, then
// walks the same path a learner's submission takes:
//
//   solution_md --extractSqlBlock--> reference query   (lib/sql.ts)
//   setup_sql   --PGlite----------> a fresh Postgres
//   learner SQL --PGlite----------> their result
//   both        --compareSqlResults-> pass / fail       (lib/grading.ts)
//
// A right answer written differently from the reference must pass, and a wrong
// one must fail. This is the check that would have caught the old grader, which
// failed correct answers over row order and column names.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const { extractSqlBlock } = await import("../lib/sql.ts");
const { compareSqlResults } = await import("../lib/grading.ts");

const here = dirname(fileURLToPath(import.meta.url));
const { databases } = JSON.parse(
  readFileSync(join(here, "dbms-databases.json"), "utf8"),
);
const paper = JSON.parse(readFileSync(join(here, "dbms-oppe-paper.json"), "utf8"));
const dbOf = new Map(databases.map((d) => [d.key, d]));

// Exactly what the importer stores.
const solutionFor = (q) =>
  `A reference query:\n\n\`\`\`sql\n${q.reference_sql.trim()}\n\`\`\`\n`;
const setupFor = (k) => `${dbOf.get(k).ddl.trim()}\n\n${dbOf.get(k).seed.trim()}\n`;

// A correct answer phrased differently, and a plausible wrong one.
const ALT = {
  Q1: {
    right: "SELECT c.room_number, c.building FROM classroom c WHERE c.capacity > 50 ORDER BY c.building DESC",
    wrong: "SELECT room_number, building FROM classroom WHERE capacity >= 50",
  },
  Q2: {
    right: "SELECT player_id FROM players WHERE RIGHT(name, 1) = 'a' ORDER BY player_id DESC",
    wrong: "SELECT player_id FROM players WHERE name LIKE '%a%'",
  },
  Q3: {
    right: "SELECT match_date FROM matches WHERE host_team_score < 3 OR host_team_score > 5",
    wrong: "SELECT match_date FROM matches WHERE host_team_score BETWEEN 3 AND 5",
  },
  Q4: {
    right: "SELECT name FROM managers WHERE team_id = (SELECT team_id FROM teams WHERE name = 'Arawali')",
    wrong: "SELECT name FROM managers WHERE team_id = (SELECT team_id FROM teams WHERE name = 'Nilgiri')",
  },
  Q5: {
    // Same answer, different column alias — must still pass.
    right: "SELECT member_type, COUNT(*) AS total FROM members GROUP BY member_type ORDER BY 2 DESC",
    // Right data, wrong direction — the question demands descending, so it must fail.
    wrong: "SELECT member_type, COUNT(*) AS total FROM members GROUP BY member_type ORDER BY 2 ASC",
  },
  Q6: {
    right: "SELECT t.name, m.name FROM teams t JOIN managers m ON m.team_id = t.team_id WHERE m.mgr_id <> 'M0001' AND m.mgr_id <> 'M0003' AND m.mgr_id <> 'M0005'",
    wrong: "SELECT t.name, m.name FROM teams t JOIN managers m ON m.team_id = t.team_id WHERE m.mgr_id NOT IN ('M0001','M0003')",
  },
  Q7: {
    right: "SELECT p.name, p.dob, t.name, m.name FROM players p, teams t, managers m WHERE t.team_id = p.team_id AND m.team_id = t.team_id AND p.jersey_no = 59",
    wrong: "SELECT p.name, p.dob, t.name, m.name FROM players p JOIN teams t ON t.team_id = p.team_id JOIN managers m ON m.team_id = t.team_id WHERE p.jersey_no >= 59",
  },
};

// Mirrors components/execution/sql-runtime.tsx exactly, including rowMode
// "array" — reading rows back by column name collapses duplicate names.
const run = async (pg, q) => {
  try {
    const res = await pg.query(q, [], { rowMode: "array" });
    return {
      columns: (res.fields ?? []).map((f) => f.name),
      rows: res.rows ?? [],
    };
  } catch (e) {
    return { columns: [], rows: [], error: String(e.message ?? e) };
  }
};

let failures = 0;
// Program questions are graded on their output, not on a result set, so they
// are covered by app/runtime-check instead — there is no way to run Python here.
for (const q of paper.questions.filter((x) => x.kind === "sql")) {
  // The grading key must survive the round trip through solution_md.
  const reference = extractSqlBlock(solutionFor(q));
  if (reference !== q.reference_sql.trim()) {
    console.log(`  FAIL ${q.id}: reference query not recovered from solution_md`);
    failures++;
    continue;
  }

  const pg = new PGlite();
  await pg.exec(setupFor(q.db));

  const expected = await run(pg, reference);
  const alt = ALT[q.id];
  const okRight = compareSqlResults(await run(pg, alt.right), expected, reference);
  const okWrong = compareSqlResults(await run(pg, alt.wrong), expected, reference);

  // Sanity: the reference must of course grade itself as correct.
  const okSelf = compareSqlResults(expected, expected, reference);

  const good = okSelf && okRight && !okWrong;
  if (!good) failures++;
  console.log(
    `  ${good ? "ok  " : "FAIL"} ${q.id}  self=${okSelf ? "pass" : "FAIL"}  ` +
      `differently-written-correct=${okRight ? "pass" : "FAIL"}  ` +
      `plausible-wrong=${okWrong ? "PASSED (bad)" : "rejected"}`,
  );
  await pg.close();
}

const skipped = paper.questions.filter((q) => q.kind !== "sql").map((q) => q.id);
if (skipped.length)
  console.log(
    `\n  (${skipped.join(", ")} are program questions — run /runtime-check in the browser for those)`,
  );
console.log(
  failures === 0
    ? "\nEvery SQL question grades a correct answer as correct and a wrong one as wrong."
    : `\n${failures} question(s) would grade incorrectly.`,
);
process.exit(failures ? 1 : 0);
