-- migration_v47: get_exam_debriefs reads activity_hourly instead of raw activity_pings.
-- The admin Surveys tab said "Couldn't load exam check-ins (migration_v23)" again on 2026-10-30:
-- counting each person's raw pings (~190k rows, and the admin page sends 16 RPCs at once) ran past
-- the API's 3 s anon timeout. activity_hourly (migration_v45) holds the same ping counts per hour;
-- minutes checked identical for all 80 (hub, person) pairs. Same signature and output.
create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path to 'public'
as $function$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with d as (select * from exam_debriefs e order by e.created_at desc limit 2000),
  who as (select distinct d.hub, d.visitor_id from d),
  t as (select w.hub, w.visitor_id, coalesce(sum(h.n), 0) * 25 / 60 as minutes
        from who w left join activity_hourly h on h.visitor_id = w.visitor_id and h.hub = w.hub
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
$function$;
