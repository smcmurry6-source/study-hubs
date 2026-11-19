-- v77 (2026-11-19): a page's study-time pings go out together, once a minute, instead of one call every 25 seconds.
-- The optimization pass, idea 3 (vault/tasks/2026-11-18-database-optimization-pass.md).
--
-- record_activity_ping was 18% of every request the evening before the Perio final (12,800 calls in four hours) and 8% of
-- the database's time, nearly all of it what any call costs (the request, its transaction, its commit), not the row: on a
-- throwaway copy the insert with its two summary upserts takes 0.12 ms. A page still banks its time a section at a time
-- and still counts a ping for every 25 seconds (widget/v3.js), but holds the pings and sends what it has once a minute
-- (at once for a visit's first ping, and when the page is hidden or closed): about 2.4 pings a call, so 58% fewer calls
-- for the same rows. On the copy, as PostgREST runs a call (its own transaction, the role and the request's settings set
-- first): 3 pings as 3 calls 1.0 ms, as 1 call 0.47 ms.
--
-- Each item is one 25-second ping: { "s": section, "a": how many seconds ago the page counted it }. It is saved at the
-- time it was counted (now less its age, by the page's own stopwatch, so a wrong clock on the device changes nothing), so
-- the hour it lands in, the visit's first and last times and every total are what one call a ping gave: the same rows in
-- activity_pings, the same activity_hourly and activity_visits through the same trigger, the same time crowns.
-- At most 12 pings a call (five minutes' worth) and an age of at most 5 minutes; the rest is dropped, as a ping that
-- never arrived always was. record_activity_ping stays as it is: pages cached before this change, and the old
-- single-file hubs, keep calling it.
--
-- One new function, no table or data changes: safe to apply at any hour. Apply it before the page change ships (a page
-- that doesn't find it goes back to one call a ping).

create or replace function public.record_activity_pings(p_visitor text, p_visit text, p_hub text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; k int := 0; t timestamptz := now();
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_visit is null or length(trim(p_visit)) = 0 then return; end if;
  if jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    k := k + 1; exit when k > 12;
    continue when jsonb_typeof(it) is distinct from 'object';
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
    values (p_visitor, p_visit, coalesce(p_hub, ''), nullif(left(coalesce(it->>'s', ''), 80), ''),
            t - make_interval(secs => coalesce(qh_int(it->>'a', 0, 300), 0)));
  end loop;
end;
$$;

revoke all on function public.record_activity_pings(text, text, text, jsonb) from public;
grant execute on function public.record_activity_pings(text, text, text, jsonb) to anon, authenticated;
