"use client";

// Manual regression check for the Python + Postgres runtime, reachable at
// /runtime-check in development only (see page.tsx). It exercises the parts of
// the runtime that unit tests can't reach — a real worker, a real Pyodide, a
// real PGlite — so a change to any of them can be verified in about a minute
// rather than by opening a question and hoping.

import { useEffect, useState } from "react";
import { usePythonRunner, type RunContext } from "@/lib/python-runner";

interface Case {
  name: string;
  code: string;
  stdin?: string;
  ctx?: RunContext;
  expect: string;
  /** Match anywhere in stderr instead of comparing stdout. */
  expectStderr?: boolean;
}

const DB = `
create table book_catalogue (isbn_no varchar(13) primary key, title varchar(256), publisher varchar(80), year int);
insert into book_catalogue values
  ('9789352921171','Database System Concepts','McGraw Hill',2020),
  ('9789351343202','Operating Systems','Pearson',2020),
  ('9789353333380','Computer Networks','Wiley',2020),
  ('9788177582932','Discrete Mathematics','Pearson',2016);
create table players (player_id varchar(10) primary key, name varchar(80), dob date, jersey_no integer, fee numeric(10,2));
insert into players values
  ('P01','Rekha Sharma','1997-07-05',59,1250.75),
  ('P02','Arjun Nair','1995-05-18',9,980.00);
`;

const CASES: Case[] = [
  {
    name: "plain python still works",
    code: "print(sum(range(5)))",
    expect: "10",
  },
  {
    name: "stdin still works",
    code: "import sys\nprint(sys.stdin.readline().strip().upper())",
    stdin: "hello\n",
    expect: "HELLO",
  },
  {
    name: "argv reaches sys.argv[1]",
    code: "import sys\nprint(sys.argv[1])",
    ctx: { argv: ["bookca"] },
    expect: "bookca",
  },
  {
    name: "input files land in the working directory",
    code: "print(open('number.txt').read().strip())",
    ctx: { files: { "number.txt": "4" } },
    expect: "4",
  },
  {
    name: "a file from a previous run does not linger",
    code: "import os\nprint(os.path.exists('number.txt'))",
    expect: "False",
  },
  {
    name: "PG environment variables are set",
    code: "import os\nprint(os.environ.get('PGUSER'), os.environ.get('PGPORT'))",
    expect: "postgres 5432",
  },
  {
    name: "psycopg2 imports and connects",
    code: [
      "import sys, os, psycopg2",
      "conn = psycopg2.connect(database=sys.argv[1], user=os.environ.get('PGUSER'),",
      "                        password=os.environ.get('PGPASSWORD'),",
      "                        host=os.environ.get('PGHOST'), port=os.environ.get('PGPORT'))",
      "cur = conn.cursor()",
      "cur.execute('select title from book_catalogue order by isbn_no')",
      "print(cur.fetchone()[0])",
      "conn.close()",
    ].join("\n"),
    ctx: { setupSql: DB, argv: ["bookca"] },
    // isbn_no is text, so 9788177582932 sorts first.
    expect: "Discrete Mathematics",
  },
  {
    name: "the real Q8 shape: read a file, compute a year, query, print",
    code: [
      "import sys, os, psycopg2",
      "x = int(open('number.txt').read().strip())",
      "year = 2000 + 4*x + 4",
      "conn = psycopg2.connect(database=sys.argv[1])",
      "cur = conn.cursor()",
      "cur.execute('select isbn_no from book_catalogue where year = %s order by isbn_no desc', (year,))",
      "print(' '.join(r[0] for r in cur.fetchall()))",
      "conn.close()",
    ].join("\n"),
    ctx: { setupSql: DB, files: { "number.txt": "4" }, argv: ["bookca"] },
    expect: "9789353333380 9789352921171 9789351343202",
  },
  {
    name: "values come back as real Python types",
    code: [
      "import psycopg2, datetime, decimal",
      "cur = psycopg2.connect(database='x').cursor()",
      "cur.execute('select name, dob, jersey_no, fee from players where player_id = %s', ('P01',))",
      "n, d, j, f = cur.fetchone()",
      "print(type(d).__name__, d.year, type(j).__name__, type(f).__name__, f + 1)",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "date 1997 int Decimal 1251.75",
  },
  {
    name: "parameters are escaped, not concatenated",
    code: [
      "import psycopg2",
      "cur = psycopg2.connect(database='x').cursor()",
      "cur.execute('select count(*) from players where name = %s', (\"O'Brien\",))",
      "print(cur.fetchone()[0])",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "0",
  },
  {
    name: "description and rowcount are populated",
    code: [
      "import psycopg2",
      "cur = psycopg2.connect(database='x').cursor()",
      "cur.execute('select player_id, name from players order by player_id')",
      "print([c.name for c in cur.description], cur.rowcount)",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "['player_id', 'name'] 2",
  },
  {
    name: "RealDictCursor works",
    code: [
      "import psycopg2, psycopg2.extras",
      "cur = psycopg2.connect(database='x').cursor(cursor_factory=psycopg2.extras.RealDictCursor)",
      "cur.execute('select name from players order by player_id')",
      "print(cur.fetchone()['name'])",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "Rekha Sharma",
  },
  {
    name: "a SQL mistake raises a real psycopg2 error",
    code: [
      "import psycopg2",
      "cur = psycopg2.connect(database='x').cursor()",
      "try:",
      "    cur.execute('select * from no_such_table')",
      "except psycopg2.ProgrammingError as e:",
      "    print('caught', e.pgcode)",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "caught 42P01",
  },
  {
    name: "unsupported features say so instead of guessing",
    code: [
      "import psycopg2",
      "cur = psycopg2.connect(database='x').cursor()",
      "try:",
      "    cur.copy_from(None, 'players')",
      "except psycopg2.NotSupportedError as e:",
      "    print('refused:', e)",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "refused: copy_from is not available in the browser runtime",
  },
  {
    name: "each run gets a clean database",
    code: [
      "import psycopg2",
      "conn = psycopg2.connect(database='x')",
      "cur = conn.cursor()",
      "cur.execute('delete from players')",
      "conn.commit()",
      "cur.execute('select count(*) from players')",
      "print(cur.fetchone()[0])",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "0",
  },
  {
    name: "...so the next run still sees every row",
    code: [
      "import psycopg2",
      "cur = psycopg2.connect(database='x').cursor()",
      "cur.execute('select count(*) from players')",
      "print(cur.fetchone()[0])",
    ].join("\n"),
    ctx: { setupSql: DB },
    expect: "2",
  },
  {
    name: "a traceback still reaches stderr",
    code: "raise ValueError('boom')",
    expect: "ValueError: boom",
    expectStderr: true,
  },
];

export function RuntimeCheckHarness() {
  const { run, status } = usePythonRunner(60000);
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: string[] = [];
      for (const c of CASES) {
        const r = await run(c.code, c.stdin ?? "", c.ctx ?? {});
        const got = (c.expectStderr ? r.stderr : r.stdout).trim();
        const ok = c.expectStderr ? got.includes(c.expect) : got === c.expect;
        out.push(
          `${ok ? "PASS" : "FAIL"}  ${c.name}` +
            (ok ? "" : `\n        want: ${c.expect}\n        got:  ${got || "(empty)"}` +
              (r.stderr && !c.expectStderr ? `\n        err:  ${r.stderr.trim().slice(0, 2500)}` : "")),
        );
        if (cancelled) return;
        setLines([...out]);
      }
      const failed = out.filter((l) => l.startsWith("FAIL")).length;
      out.push(failed === 0 ? "ALL RUNTIME CHECKS PASSED" : `${failed} CHECK(S) FAILED`);
      setLines([...out]);
      setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [run]);

  return (
    <main className="p-6">
      <h1 className="mb-3 text-[16px] font-semibold">
        Runtime check — {done ? "finished" : `running (${status})`}
      </h1>
      <pre id="results" className="whitespace-pre-wrap font-mono text-[12.5px] leading-5">
        {lines.join("\n")}
      </pre>
    </main>
  );
}
