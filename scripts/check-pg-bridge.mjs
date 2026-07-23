// Exercises the JS half of lib/runtime/pg-bridge.ts against a real Postgres.
//
//   node --experimental-strip-types scripts/check-pg-bridge.mjs
//
// Evaluates the exact source string the worker runs, wired to a real PGlite via
// execProtocolRawSync, so the Postgres wire framing and decoding are tested as
// shipped rather than as a reimplementation.
import { PGlite } from "@electric-sql/pglite";
const { PG_BRIDGE_JS } = await import("../lib/runtime/pg-bridge.ts");

// The bridge expects a worker's global scope.
globalThis.self = globalThis;

const db = new PGlite();
await db.waitReady;
globalThis.self.__pgDb = db;
new Function(PG_BRIDGE_JS)();
const exec = (sql) => JSON.parse(globalThis.self.__pgExec(sql));

let failures = 0;
const check = (name, cond, extra = "") => {
  if (!cond) failures++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}${cond ? "" : "  " + extra}`);
};

// --- setup -----------------------------------------------------------------
let r = exec(`
  create table t (
    id int primary key, name text, ok boolean, price numeric(8,2),
    born date, note text, tags text[]
  );
  insert into t values
    (1, 'Asha',  true,  10.50, '1998-03-12', null, '{a,b}'),
    (2, 'Bimal', false,  7.25, '1997-07-05', 'hi', '{}');
`);
check("multi-statement setup runs", r.error === null, JSON.stringify(r.error));

// --- shape -----------------------------------------------------------------
r = exec("select id, name, ok, price, born, note, tags from t order by id");
const res = r.results[r.results.length - 1];
check("no error on select", r.error === null);
check("row count", res.rows.length === 2, JSON.stringify(res.rows));
check("column names", JSON.stringify(res.columns.map((c) => c.name)) ===
  '["id","name","ok","price","born","note","tags"]');
check(
  "type oids reported",
  res.columns[0].oid === 23 && res.columns[2].oid === 16 &&
    res.columns[3].oid === 1700 && res.columns[4].oid === 1082,
  JSON.stringify(res.columns.map((c) => c.oid)),
);
check("values arrive as postgres text", res.rows[0][0] === "1" && res.rows[0][1] === "Asha");
check("booleans are t/f", res.rows[0][2] === "t" && res.rows[1][2] === "f");
check("numeric keeps its scale", res.rows[0][3] === "10.50", res.rows[0][3]);
check("dates are iso", res.rows[0][4] === "1998-03-12");
check("NULL is null, not empty string", res.rows[0][5] === null && res.rows[1][5] === "hi");
check("arrays render as literals", res.rows[0][6] === "{a,b}" && res.rows[1][6] === "{}");

// --- the bug that bit the SQL grader --------------------------------------
r = exec("select a.name, b.name from t a join t b on b.id = 1 where a.id = 2");
const dup = r.results[r.results.length - 1];
check(
  "duplicate column names stay two distinct positional values",
  dup.columns.length === 2 && dup.rows[0].length === 2 &&
    dup.rows[0][0] === "Bimal" && dup.rows[0][1] === "Asha",
  JSON.stringify(dup.rows),
);

// --- errors ----------------------------------------------------------------
r = exec("select * from nope");
check("missing table reports an error", r.error !== null);
check("sqlstate is surfaced", r.error && r.error.sqlstate === "42P01", JSON.stringify(r.error));
check("message is human readable", !!(r.error && /nope/.test(r.error.message)), JSON.stringify(r.error));

r = exec("select 1 +");
check("syntax error is caught", r.error !== null && r.error.sqlstate === "42601");

r = exec("insert into t values (1, 'dup', true, 1, '2000-01-01', null, '{}')");
check("unique violation keeps its 23xxx sqlstate",
  r.error !== null && r.error.sqlstate === "23505", JSON.stringify(r.error));

// The connection must still work after an error.
r = exec("select count(*) from t");
check("usable after an error", r.error === null && r.results[0].rows[0][0] === "2");

// --- commands and counts ---------------------------------------------------
r = exec("insert into t values (3, 'Chitra', true, 5, '1995-01-01', null, '{}')");
check("insert reports its tag", r.results[0].command === "INSERT 0 1", r.results[0].command);
check("insert reports one row", r.results[0].rowCount === 1);

r = exec("update t set note = 'x' where id in (1,2)");
check("update counts rows", r.results[0].rowCount === 2, String(r.results[0].rowCount));

r = exec("select * from t where id = 999");
check("empty result has columns but no rows",
  r.results[0].rows.length === 0 && r.results[0].columns.length > 0);

// --- text edge cases -------------------------------------------------------
r = exec("select 'O''Brien' as who, '' as empty, 'multi\nline' as m");
const t2 = r.results[0];
check("quotes survive", t2.rows[0][0] === "O'Brien", JSON.stringify(t2.rows[0]));
check("empty string is not null", t2.rows[0][1] === "");
check("newlines survive", t2.rows[0][2] === "multi\nline");

r = exec("select 'नमस्ते' as hi");
check("utf-8 survives the round trip", r.results[0].rows[0][0] === "नमस्ते", r.results[0].rows[0][0]);

await db.close();
console.log(
  failures === 0
    ? "\nThe wire bridge frames, decodes and reports errors correctly."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures ? 1 : 0);
