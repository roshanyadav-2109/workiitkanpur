---
title: The DBMS OPPE psycopg2 Question: Nailing the Python–PostgreSQL Task
description: The DBMS OPPE has one question you must answer correctly to pass — connecting to PostgreSQL from Python with psycopg2. Here's the exact pattern and the mistakes to avoid.
date: 2026-07-21
---

The DBMS OPPE has a rule that catches people out: alongside scoring at least ~35% overall, **you must answer the Python-to-PostgreSQL connectivity question correctly to receive a final grade**. It comes from Week 7, it uses `psycopg2`, and it is very learnable once you've written the pattern a few times.

## The pattern you must know cold

Connect, get a cursor, run a **parameterised** query, fetch, and print exactly what's asked:

```python
import psycopg2

conn = psycopg2.connect(dbname="...", user="...", password="...", host="...")
cur = conn.cursor()
cur.execute("SELECT name FROM students WHERE dept = %s", (dept,))
for row in cur.fetchall():
    print(row[0])

cur.close()
conn.close()
```

Note the `%s` placeholder with a **tuple** of parameters — that's parameterised querying, and it's how the course expects you to pass values safely.

## Common mistakes on this question

- **String-formatting the query** (`f"... {dept}"`) instead of using `%s` placeholders.
- Passing a single parameter as `(dept)` instead of the one-tuple `(dept,)` — without the comma it isn't a tuple.
- Reading `cur.fetchall()` as full rows but printing the whole tuple `row` instead of the column `row[0]`.
- Forgetting to `commit()` after an `INSERT`/`UPDATE` (SELECT-only questions don't need it, but write ones do).
- Output formatting — printing extra spaces, wrong order, or the wrong columns.

## How to practise it

Write the connect-cursor-execute-fetch loop from memory until it's automatic, then vary it: a filter, a join fed into Python, an aggregate. Reinforce the SQL itself on the [DBMS practice set](/app/subjects/dbms) and your Python on the [Python practice track](/app/subjects/python). For the driver's exact API, keep the [psycopg documentation](https://www.psycopg.org/docs/) handy.

## FAQ

**Is the psycopg2 question really mandatory?** Yes — per the official grading rule, you must answer the Python-database-connectivity question correctly to get a final grade.

**Do I need to commit after a SELECT?** No. `commit()` is only needed after statements that change data (`INSERT`, `UPDATE`, `DELETE`).

**Which week is it from?** Week 7, Application Development. See the [DBMS course page](https://study.iitm.ac.in/ds/course_pages/BSCS2001.html).
