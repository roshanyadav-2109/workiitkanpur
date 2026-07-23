// Verifies scripts/dbms-databases.json against a real Postgres.
//
//   node scripts/check-databases.mjs
//
// For each database it creates the schema and loads the seed in PGlite, then
// compares what Postgres actually built to the table metadata the schema
// reference shows students. A student reading a column that doesn't exist —
// or missing one that does — can't answer the question, and the mismatch would
// otherwise be invisible until someone sat the paper.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = dirname(fileURLToPath(import.meta.url));
const { databases } = JSON.parse(
  readFileSync(join(here, "dbms-databases.json"), "utf8"),
);

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log(`  FAIL ${msg}`);
};

for (const db of databases) {
  console.log(`\n${db.key}`);
  const pg = new PGlite();
  try {
    await pg.exec(db.ddl);
    await pg.exec(db.seed);
  } catch (e) {
    fail(`DDL/seed did not run: ${e.message ?? e}`);
    await pg.close();
    continue;
  }

  // What Postgres actually created.
  const actual = await pg.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `);
  const real = new Map();
  for (const r of actual.rows) {
    if (!real.has(r.table_name)) real.set(r.table_name, []);
    real.get(r.table_name).push(r.column_name);
  }

  // Metadata table names must match, case-insensitively (Postgres folds
  // unquoted identifiers to lowercase — ISBN_no becomes isbn_no).
  const metaNames = db.tables.map((t) => t.name.toLowerCase()).sort();
  const realNames = [...real.keys()].sort();
  for (const n of metaNames)
    if (!realNames.includes(n)) fail(`metadata lists table "${n}" but the DDL never creates it`);
  for (const n of realNames)
    if (!metaNames.includes(n)) fail(`DDL creates table "${n}" but the metadata omits it`);

  for (const t of db.tables) {
    const cols = real.get(t.name.toLowerCase());
    if (!cols) continue;
    const metaCols = t.columns.map((c) => c.name.toLowerCase());
    for (const c of metaCols)
      if (!cols.includes(c))
        fail(`${t.name}: metadata shows column "${c}" that does not exist`);
    for (const c of cols)
      if (!metaCols.includes(c))
        fail(`${t.name}: real column "${c}" is missing from the metadata`);
  }

  // Foreign keys named in the metadata must point at something real.
  for (const t of db.tables) {
    for (const c of t.columns) {
      if (!c.fk) continue;
      const [tbl, col] = c.fk.split(".");
      const target = real.get((tbl ?? "").toLowerCase());
      if (!target) fail(`${t.name}.${c.name} references unknown table "${tbl}"`);
      else if (!target.includes((col ?? "").toLowerCase()))
        fail(`${t.name}.${c.name} references "${c.fk}", which has no such column`);
    }
  }

  // Every table should hold data — an empty table means questions over it
  // return nothing, which looks like a wrong answer rather than a bad seed.
  for (const name of realNames) {
    const c = await pg.query(`select count(*)::int as n from "${name}"`);
    const n = c.rows[0].n;
    if (n === 0) fail(`table "${name}" is empty`);
    else console.log(`  ok   ${name.padEnd(18)} ${String(n).padStart(3)} rows`);
  }

  await pg.close();
}

console.log(
  problems === 0
    ? "\nAll databases match their metadata and carry data."
    : `\n${problems} problem(s) found.`,
);
process.exit(problems ? 1 : 0);
