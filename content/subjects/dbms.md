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
