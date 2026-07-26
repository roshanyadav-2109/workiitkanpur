---
title: SQL Joins, GROUP BY and HAVING: The Queries That Actually Decide Your DBMS OPPE
description: A senior-student walkthrough of the SQL joins, subqueries and aggregation traps that trip up IITM BS students in the DBMS OPPE, with copy-ready examples.
date: 2026-07-24
theme: sql
---

If you fail a question in the DBMS OPPE, it is almost never because you did not know a join existed. It is because you picked the wrong one, or you put a condition in the wrong clause, and the grader returned rows you did not expect. The SQL half of the exam (roughly seven query questions across the University, Library and EShop schemas) rewards people who are precise, not people who have memorised syntax. So let us be precise.

## INNER JOIN vs LEFT JOIN: the mistake that quietly costs marks

Ninety percent of join confusion comes down to one question: do you want rows that have no match to disappear, or to stay?

An `INNER JOIN` keeps only rows where both sides match. A `LEFT JOIN` keeps every row from the left table, and fills the right side with NULLs when there is no match. That difference is the whole game.

Say the question asks: "list every student and their total number of enrolled courses, including students who enrolled in nothing." If you use an inner join, the students with zero courses vanish, and you lose marks even though your logic "looked" right.

```sql
SELECT s.student_id, s.name, COUNT(e.course_id) AS course_count
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
GROUP BY s.student_id, s.name;
```

Read the question wording carefully. Words like "including", "even if", "all", and "who have never" are your signal to reach for a `LEFT JOIN`. Words like "who have at least one" usually mean an inner join is fine.

One more trap: never put a filter on the right-hand table in the `WHERE` clause of a left join. It silently turns your left join back into an inner join, because `NULL` fails the comparison. If you must filter, put the condition inside the `ON`.

## When to use a self join

The Library and University schemas love self joins. Any time a table points at itself (an employee has a manager who is also an employee, a course has a prerequisite that is also a course), you join the table to a second copy of itself using aliases.

```sql
SELECT e.name AS employee, m.name AS manager
FROM staff e
LEFT JOIN staff m ON e.manager_id = m.staff_id;
```

The alias is not decoration. Without `e` and `m`, PostgreSQL cannot tell which copy of the table you mean, and it will error.

## GROUP BY vs HAVING: the single most searched DBMS doubt

Here is the rule you should be able to recite at 2am. `WHERE` filters individual rows before grouping. `HAVING` filters groups after aggregation. If your condition uses `COUNT`, `SUM`, `AVG`, `MIN` or `MAX`, it belongs in `HAVING`. If it uses a plain column, it belongs in `WHERE`.

```sql
SELECT department, COUNT(*) AS staff_count
FROM staff
WHERE active = true          -- filters rows first
GROUP BY department
HAVING COUNT(*) > 5;         -- filters groups after
```

Trying to write `WHERE COUNT(*) > 5` is the classic error, and PostgreSQL will reject it because the count does not exist yet at the `WHERE` stage. Also remember: every non-aggregated column in your `SELECT` must appear in `GROUP BY`, or the query fails. That one rule catches a huge number of students under exam pressure.

## Subqueries and when a join is cleaner

A subquery is a query inside a query. A correlated subquery references the outer row and re-runs for each one, which is powerful but slow. For OPPE questions, a plain join is usually easier to reason about and less likely to break. Reach for a subquery when you need a single aggregate value to compare against, for example "students who scored above the class average".

```sql
SELECT name, marks
FROM results
WHERE marks > (SELECT AVG(marks) FROM results);
```

## How to practise so this is muscle memory

Do not just read solutions. Type the queries against the real schemas until the joins feel obvious. The best prep is repetition on the actual [DBMS practice sets](/app/subjects/dbms), then checking where you rank on the [leaderboard](/leaderboard) so you know if your speed is exam-ready. The official [course page](https://study.iitm.ac.in/ds/) lists the schema documentation, and the [PostgreSQL join tutorial](https://www.postgresql.org/docs/current/tutorial-join.html) is the cleanest free reference there is.

## FAQ

**Is the SQL part of the DBMS OPPE hard?**
Not conceptually. It is hard under time pressure, because small clause mistakes return wrong rows. Practise until you stop second-guessing which join to use.

**What is the difference between WHERE and HAVING in one line?**
WHERE filters rows before grouping, HAVING filters groups after aggregation.

**Do I need to memorise every join type?**
You mainly need INNER, LEFT and self joins. FULL OUTER and CROSS joins show up rarely, but know they exist.

**Should I use joins or subqueries in the exam?**
Prefer joins when you can. They are easier to debug quickly, which matters when the clock is running.
