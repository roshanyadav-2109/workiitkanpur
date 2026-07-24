Database Management Systems (**BSCS2001**, Diploma level, 4 credits) has **one OPPE** (not a separate OPPE 1 and OPPE 2), worth **20% of the course grade**, conducted in remote-proctored online mode with a single conditional re-attempt if the first is failed. It is a live coding paper that mixes **SQL query questions** against pre-loaded relational schemas with a **Python-to-PostgreSQL connectivity question** (using `psycopg2`). Per the official grading rules you must score **at least 35% on the OPPE and answer the Python-database-connectivity question correctly** to receive a final grade. SQL content comes from Weeks 2–3 and the connectivity question from Week 7.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Course overview | What a DBMS is, databases vs file systems, data models, three-schema architecture |
| 2 | Relational model & basic SQL | Relations, keys, DDL (`CREATE`, constraints), `SELECT`/`INSERT`/`WHERE`/`ORDER BY` — **core OPPE** |
| 3 | Intermediate & advanced SQL | Joins (inner/outer/self), `GROUP BY`/`HAVING`, aggregates, subqueries, set ops, views — **core OPPE** |
| 4 | Query languages & DB design | Relational algebra, ER model, ER-to-relational mapping, cardinality |
| 5–6 | Functional dependency & normal forms | FDs, closure, keys, decomposition, 1NF/2NF/3NF/BCNF, lossless join |
| 7 | Application development | Python + PostgreSQL via `psycopg2`, parameterised queries, transactions — **tested in the OPPE** |
| 8 | Storage management | File organisation, records/blocks, buffer management |
| 9 | Indexing & hashing | Ordered indices, B/B+-trees, static & dynamic hashing |
| 10 | Transactions | ACID, schedules, serializability, concurrency control, locking, deadlocks |
| 11 | Backup & recovery | Failure types, log-based recovery, checkpoints |
| 12 | Query optimization | Query processing, evaluation plans, cost estimation |

<!--ARTICLE-->

The DBMS OPPE is very clearable once you know its shape: a set of **SQL queries plus one Python-PostgreSQL question**, graded on exact output. Here's what's actually tested and how to prepare.

## Is DBMS one OPPE or two?

DBMS has **a single OPPE worth 20%** of your grade, with a first attempt and one conditional re-attempt if you fail. It's remote-proctored and combines SQL questions with one Python-PostgreSQL question. Rehearse the format on the [DBMS practice page](/app/subjects/dbms).

## What SQL is tested in the DBMS OPPE?

The SQL comes straight from **Weeks 2 and 3**. Expect to:

- Write `SELECT` queries with the right `WHERE` filters and `ORDER BY`.
- Join two or more tables — including **self-joins** and **outer joins** — after spotting the foreign keys.
- Aggregate with `GROUP BY` … `HAVING` and `COUNT`/`SUM`/`AVG`/`MIN`/`MAX`.
- Use **subqueries** (including correlated ones) and set operations.

You work against pre-loaded schemas (past exams used University, Library, Football-League and EShop databases). **Read the schema first** — know the primary and foreign keys before you type a single join.

### How to practise joins & aggregation

Don't just read solutions — rebuild them. Take one schema and write ten questions of rising difficulty: a filter, a two-table join, a three-table join, a `GROUP BY … HAVING`, then a subquery. Timed drills on the [DBMS practice set](/app/subjects/dbms) mirror the real query patterns, and you can benchmark yourself on the [leaderboard](/leaderboard).

## The Python-PostgreSQL question you must not skip

Week 7's content — connecting to PostgreSQL from Python with **`psycopg2`** — appears in the OPPE, and the rule is strict: **you must answer the connectivity question correctly to get a final grade**, on top of scoring at least 35% overall. Practise the full loop:

```python
import psycopg2
conn = psycopg2.connect(dbname="...", user="...", password="...", host="...")
cur = conn.cursor()
cur.execute("SELECT name FROM students WHERE dept = %s", (dept,))
for row in cur.fetchall():
    print(row[0])
```

Reinforce your Python fundamentals on the [Python practice track](/app/subjects/python).

## psql / PostgreSQL tips

- `\dt` lists tables and `\d tablename` inspects columns and keys — use them before writing queries.
- String comparisons are case-sensitive; watch `=` vs `ILIKE`.
- Integer division truncates — cast with `::numeric` when you need decimals in averages.
- Alias tables in joins to avoid ambiguous-column errors.

## Common query mistakes

- Non-aggregated columns in `SELECT` that aren't in `GROUP BY`.
- Filtering aggregates in `WHERE` instead of `HAVING`.
- Forgetting that `COUNT(column)` ignores `NULL`s while `COUNT(*)` doesn't.
- Wrong join type — an inner join when the question needs unmatched rows (use `LEFT JOIN`).
- Output formatting: extra columns, wrong order, or wrong names fail auto-grading.

## Exam-day tips

Run the System Compatibility Test in advance, read every schema and the exact expected output before coding, and **bank the SQL marks first, then solve the Python-PostgreSQL question** — it's mandatory to pass. Keep your face in frame; the proctoring flags head movement.

## FAQ

**How many OPPEs does DBMS have?** One, worth 20%, with a conditional re-attempt.

**What are the passing conditions?** At least ~35% on the OPPE **and** the Python-connectivity question answered correctly.

**Which weeks matter most?** Weeks 2 and 3 (SQL) and Week 7 (Python-PostgreSQL).

**Is `psql` knowledge needed?** Yes — know basic meta-commands and standard SQL. See the [PostgreSQL docs](https://www.postgresql.org/docs/current/tutorial-sql.html).

**Where's the official info?** The [IITM BS Data Science](https://study.iitm.ac.in/ds/) site and the [DBMS course page](https://study.iitm.ac.in/ds/course_pages/BSCS2001.html).
