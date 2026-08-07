-- 0021_merge_dbms_topics.sql
-- DBMS had two names for each of the same two practice categories. Keep one
-- canonical backend topic per category and move every DBMS question onto it.

do $$
declare
  dbms_id uuid;
  sql_topic_id uuid;
  python_topic_id uuid;
begin
  select id into dbms_id from public.subjects where slug = 'dbms';
  if dbms_id is null then return; end if;

  select id into sql_topic_id
    from public.topics
   where subject_id = dbms_id and name = 'OPE SQL Questions'
   order by sort_order, id
   limit 1;
  if sql_topic_id is null then
    insert into public.topics(subject_id, name, week, sort_order)
    values (dbms_id, 'OPE SQL Questions', null, 1)
    returning id into sql_topic_id;
  end if;

  select id into python_topic_id
    from public.topics
   where subject_id = dbms_id and name = 'OPE Python-PostgreSQL Questions'
   order by sort_order, id
   limit 1;
  if python_topic_id is null then
    insert into public.topics(subject_id, name, week, sort_order)
    values (dbms_id, 'OPE Python-PostgreSQL Questions', null, 2)
    returning id into python_topic_id;
  end if;

  update public.questions
     set topic_id = case when kind = 'sql' then sql_topic_id else python_topic_id end
   where subject_id = dbms_id
     and kind in ('sql', 'coding');

  -- The filters are generated from topics, so deleting every superseded DBMS
  -- topic guarantees the API returns exactly these two options.
  delete from public.topics
   where subject_id = dbms_id
     and id not in (sql_topic_id, python_topic_id);

  update public.topics set sort_order = 1 where id = sql_topic_id;
  update public.topics set sort_order = 2 where id = python_topic_id;
end $$;
