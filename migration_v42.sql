-- migration_v42 (2026-10-28): the admin page's Surveys tab often said "Couldn't load exam check-ins (migration_v23)"
-- on first load and worked after a refresh. get_exam_debriefs ran three subqueries per check-in, and the
-- activity_pings one had no (visitor_id, hub) index, so it AND-ed a visitor scan with a whole-hub scan each time:
-- ~2.5 s warm with 78 check-ins, over the API's 3 s anon timeout when cold and sharing the database with the
-- page's 16 other loads. Now: an index on (visitor_id, hub), and each (hub, person) pair's time and answers are
-- counted once, not once per check-in. Same columns and rows.
-- Applied to the live database 2026-10-28 via the Supabase connector.
create index if not exists activity_pings_visitor_hub_idx on public.activity_pings (visitor_id, hub);

create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with d as (select * from exam_debriefs e order by e.created_at desc limit 2000),
  who as (select distinct d.hub, d.visitor_id from d),
  t as (select w.hub, w.visitor_id, count(p.id) * 25 / 60 as minutes
        from who w left join activity_pings p on p.visitor_id = w.visitor_id and p.hub = w.hub
        group by w.hub, w.visitor_id),
  a as (select w.hub, w.visitor_id, count(pa.id) as answered,
               round(avg(case when pa.id is null then null when pa.correct then 100 else 0 end), 0) as accuracy
        from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
        group by w.hub, w.visitor_id)
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    t.minutes::bigint, a.answered::bigint, a.accuracy
  from d
  join t on t.hub = d.hub and t.visitor_id = d.visitor_id
  join a on a.hub = d.hub and a.visitor_id = d.visitor_id
  order by d.created_at desc;
end;
$$;
