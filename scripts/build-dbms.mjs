// Author + validate a small DBMS (SQL) subject, then emit seed SQL.
// Each question's setup_sql + reference query is executed in PGlite (the same
// engine the browser runtime uses) to guarantee it runs before seeding.
//   node scripts/build-dbms.mjs supabase/seed_dbms.sql
import { writeFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const SETUP = `create table employees (
  id int primary key,
  name text not null,
  dept text not null,
  salary int not null
);
insert into employees (id, name, dept, salary) values
  (1, 'Ada',     'Engineering', 95000),
  (2, 'Grace',   'Engineering', 88000),
  (3, 'Linus',   'Engineering', 72000),
  (4, 'Edsger',  'Research',     99000),
  (5, 'Barbara', 'Research',     81000),
  (6, 'Donald',  'Design',       67000),
  (7, 'Alan',    'Design',       67000);`;

const schemaNote = `The database has one table:

\`\`\`
employees(id int, name text, dept text, salary int)
\`\`\`

seeded with seven rows across the Engineering, Research, and Design departments.`;

const questions = [
  {
    title: "Names above the average salary",
    difficulty: "easy",
    body: `${schemaNote}

Write a query that returns the \`name\` of every employee whose \`salary\` is strictly greater than the average salary of all employees, ordered by \`name\`.`,
    reference:
      "select name\nfrom employees\nwhere salary > (select avg(salary) from employees)\norder by name;",
    tags: ["sql", "subquery", "aggregate"],
  },
  {
    title: "Headcount per department",
    difficulty: "medium",
    body: `${schemaNote}

Write a query that returns each department (\`dept\`) and its number of employees as \`headcount\`, ordered by \`dept\`.`,
    reference:
      "select dept, count(*) as headcount\nfrom employees\ngroup by dept\norder by dept;",
    tags: ["sql", "group-by", "count"],
  },
  {
    title: "Three highest paid employees",
    difficulty: "medium",
    body: `${schemaNote}

Write a query that returns the \`name\` and \`salary\` of the three highest-paid employees, most-paid first. Break ties by \`name\` ascending.`,
    reference:
      "select name, salary\nfrom employees\norder by salary desc, name asc\nlimit 3;",
    tags: ["sql", "order-by", "limit"],
  },
  {
    title: "Departments with more than two employees",
    difficulty: "hard",
    body: `${schemaNote}

Write a query that returns the \`dept\` of every department that has more than two employees, ordered by \`dept\`.`,
    reference:
      "select dept\nfrom employees\ngroup by dept\nhaving count(*) > 2\norder by dept;",
    tags: ["sql", "group-by", "having"],
  },
];

// Validate every setup + reference query in PGlite.
for (const q of questions) {
  const db = new PGlite();
  await db.exec(SETUP);
  const res = await db.query(q.reference);
  if (!res.rows || res.rows.length === 0) {
    throw new Error(`Query returned no rows: ${q.title}`);
  }
  console.log(`OK  ${q.title}  -> ${res.rows.length} rows`);
  await db.close();
}

const sq = (s) => "'" + String(s ?? "").replace(/'/g, "''") + "'";
const sqArr = (arr) => "array[" + arr.map(sq).join(",") + "]::text[]";

const out = [];
out.push("-- supabase/seed_dbms.sql — GENERATED + validated by scripts/build-dbms.mjs.");
out.push("set client_min_messages to warning;");
out.push("do $$");
out.push("declare v_subject uuid; v_topic uuid;");
out.push("begin");
out.push(
  `  insert into subjects(slug,name,short_code,description,is_active,sort_order)` +
    ` values('dbms','Database Management Systems','DBMS','SQL and relational querying for the DBMS OPPE. Runs in-browser on Postgres (PGlite).',true,2)` +
    ` on conflict(slug) do update set name=excluded.name, short_code=excluded.short_code, description=excluded.description, is_active=excluded.is_active, sort_order=excluded.sort_order` +
    ` returning id into v_subject;`,
);
out.push("  delete from questions where subject_id = v_subject;");
out.push("  delete from topics where subject_id = v_subject;");
out.push(
  `  insert into topics(subject_id,name,week,sort_order) values(v_subject,'SQL Querying',1,1) returning id into v_topic;`,
);
questions.forEach((q, i) => {
  const solution = `A reference query:\n\n\`\`\`sql\n${q.reference}\n\`\`\``;
  out.push(
    `  insert into questions(subject_id,topic_id,title,body_md,difficulty,kind,solution_md,tags,sort_order,setup_sql)` +
      ` values(v_subject,v_topic,${sq(q.title)},${sq(q.body)},${sq(q.difficulty)},'sql',${sq(solution)},${sqArr(q.tags)},${i + 1},${sq(SETUP)});`,
  );
});
out.push("end $$;");

const outPath = process.argv[2] ?? "supabase/seed_dbms.sql";
writeFileSync(outPath, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${outPath}: ${questions.length} SQL questions, DBMS activated.`);
