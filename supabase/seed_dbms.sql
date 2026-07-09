-- supabase/seed_dbms.sql — GENERATED + validated by scripts/build-dbms.mjs.
set client_min_messages to warning;
do $$
declare v_subject uuid; v_topic uuid;
begin
  insert into subjects(slug,name,short_code,description,is_active,sort_order) values('dbms','Database Management Systems','DBMS','SQL and relational querying for the DBMS OPPE. Runs in-browser on Postgres (PGlite).',true,2) on conflict(slug) do update set name=excluded.name, short_code=excluded.short_code, description=excluded.description, is_active=excluded.is_active, sort_order=excluded.sort_order returning id into v_subject;
  delete from questions where subject_id = v_subject;
  delete from topics where subject_id = v_subject;
  insert into topics(subject_id,name,week,sort_order) values(v_subject,'SQL Querying',1,1) returning id into v_topic;
  insert into questions(subject_id,topic_id,title,body_md,difficulty,kind,solution_md,tags,sort_order,setup_sql) values(v_subject,v_topic,'Names above the average salary','The database has one table:

```
employees(id int, name text, dept text, salary int)
```

seeded with seven rows across the Engineering, Research, and Design departments.

Write a query that returns the `name` of every employee whose `salary` is strictly greater than the average salary of all employees, ordered by `name`.','easy','sql','A reference query:

```sql
select name
from employees
where salary > (select avg(salary) from employees)
order by name;
```',array['sql','subquery','aggregate']::text[],1,'create table employees (
  id int primary key,
  name text not null,
  dept text not null,
  salary int not null
);
insert into employees (id, name, dept, salary) values
  (1, ''Ada'',     ''Engineering'', 95000),
  (2, ''Grace'',   ''Engineering'', 88000),
  (3, ''Linus'',   ''Engineering'', 72000),
  (4, ''Edsger'',  ''Research'',     99000),
  (5, ''Barbara'', ''Research'',     81000),
  (6, ''Donald'',  ''Design'',       67000),
  (7, ''Alan'',    ''Design'',       67000);');
  insert into questions(subject_id,topic_id,title,body_md,difficulty,kind,solution_md,tags,sort_order,setup_sql) values(v_subject,v_topic,'Headcount per department','The database has one table:

```
employees(id int, name text, dept text, salary int)
```

seeded with seven rows across the Engineering, Research, and Design departments.

Write a query that returns each department (`dept`) and its number of employees as `headcount`, ordered by `dept`.','medium','sql','A reference query:

```sql
select dept, count(*) as headcount
from employees
group by dept
order by dept;
```',array['sql','group-by','count']::text[],2,'create table employees (
  id int primary key,
  name text not null,
  dept text not null,
  salary int not null
);
insert into employees (id, name, dept, salary) values
  (1, ''Ada'',     ''Engineering'', 95000),
  (2, ''Grace'',   ''Engineering'', 88000),
  (3, ''Linus'',   ''Engineering'', 72000),
  (4, ''Edsger'',  ''Research'',     99000),
  (5, ''Barbara'', ''Research'',     81000),
  (6, ''Donald'',  ''Design'',       67000),
  (7, ''Alan'',    ''Design'',       67000);');
  insert into questions(subject_id,topic_id,title,body_md,difficulty,kind,solution_md,tags,sort_order,setup_sql) values(v_subject,v_topic,'Three highest paid employees','The database has one table:

```
employees(id int, name text, dept text, salary int)
```

seeded with seven rows across the Engineering, Research, and Design departments.

Write a query that returns the `name` and `salary` of the three highest-paid employees, most-paid first. Break ties by `name` ascending.','medium','sql','A reference query:

```sql
select name, salary
from employees
order by salary desc, name asc
limit 3;
```',array['sql','order-by','limit']::text[],3,'create table employees (
  id int primary key,
  name text not null,
  dept text not null,
  salary int not null
);
insert into employees (id, name, dept, salary) values
  (1, ''Ada'',     ''Engineering'', 95000),
  (2, ''Grace'',   ''Engineering'', 88000),
  (3, ''Linus'',   ''Engineering'', 72000),
  (4, ''Edsger'',  ''Research'',     99000),
  (5, ''Barbara'', ''Research'',     81000),
  (6, ''Donald'',  ''Design'',       67000),
  (7, ''Alan'',    ''Design'',       67000);');
  insert into questions(subject_id,topic_id,title,body_md,difficulty,kind,solution_md,tags,sort_order,setup_sql) values(v_subject,v_topic,'Departments with more than two employees','The database has one table:

```
employees(id int, name text, dept text, salary int)
```

seeded with seven rows across the Engineering, Research, and Design departments.

Write a query that returns the `dept` of every department that has more than two employees, ordered by `dept`.','hard','sql','A reference query:

```sql
select dept
from employees
group by dept
having count(*) > 2
order by dept;
```',array['sql','group-by','having']::text[],4,'create table employees (
  id int primary key,
  name text not null,
  dept text not null,
  salary int not null
);
insert into employees (id, name, dept, salary) values
  (1, ''Ada'',     ''Engineering'', 95000),
  (2, ''Grace'',   ''Engineering'', 88000),
  (3, ''Linus'',   ''Engineering'', 72000),
  (4, ''Edsger'',  ''Research'',     99000),
  (5, ''Barbara'', ''Research'',     81000),
  (6, ''Donald'',  ''Design'',       67000),
  (7, ''Alan'',    ''Design'',       67000);');
end $$;
