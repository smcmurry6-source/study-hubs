-- v70 (2026-11-18): the admin page's A/B versions page, from one small query of its own.
-- Sam, 2026-11-18, after asking for the A/B results: "i want somewhere to see this in the admin page". Question health
-- already shows each question's first tries by version (qh_report's wordings, migration_v67), but only inside a hub's
-- whole report (1 to 3 s), which timed out that day while the class studied. This function answers the question on its
-- own, from the answers that carry a version (question_events.w): for every hub with versions, the class's first tries
-- on A and on B, the later tries, the first tries by kind of question, and each question's pair on its latest wording.
--
-- 1. question_events_ab: a partial index on the answers that carry a version (about 2% of the table on 2026-11-18), so
--    the function reads those rows only. Built in a fraction of a second; record_qh's inserts wait that long at most.
-- 2. get_ab_summary(secret, days): admin only (sh_admin_ok), read only, totals only: no visitor id, no per-person row.
--    A person is a visitor's primary device (visitor_links), and a first try is that person's try 1 at the question,
--    as qh_report counts it. A question's pair counts first tries on the question's latest wording (the newest
--    fingerprint, question_events.v), so an edited question's pair starts again; the hub's totals count every one.
-- Nothing a student sees changes. Tested on a throwaway copy of supabase/schema.sql (tools/release/admin-ops.js,
-- section 6). Applied to the live project on 2026-11-18 through the Supabase connector.

create index if not exists question_events_ab on public.question_events (at) where w is not null and kind = 'answer';

create or replace function public.get_ab_summary(p_secret text, p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d int := greatest(1, least(coalesce(p_days, 30), 365)); out jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  with ev as (
    select e.hub, e.qid, e.v, e.w, e.try, e.correct, e.ms, e.ctx, e.at, coalesce(lk.primary_id, e.visitor_id) person
    from question_events e left join visitor_links lk on lk.alias_id = e.visitor_id
    where e.w is not null and e.kind = 'answer' and e.at > now() - make_interval(days => d)
  ),
  -- each person's first try at each question, with the version they were shown
  ft as (select distinct on (hub, qid, person) hub, qid, v, w, correct, ms, ctx, person
         from ev where try = 1 order by hub, qid, person, at),
  -- each question's latest wording
  lv as (select distinct on (hub, qid) hub, qid, v from ev order by hub, qid, at desc),
  hubs as (select hub, count(*)::int answers, count(distinct person)::int people, min(at) since, max(at) last from ev group by hub),
  firsts as (
    select hub, jsonb_object_agg(w::text, jsonb_build_object('n', n, 'c', c, 'people', people, 'med_ms', med_ms)) j
    from (select hub, w, count(*)::int n, count(*) filter (where correct)::int c, count(distinct person)::int people,
                 (percentile_cont(0.5) within group (order by ms) filter (where ms is not null and ctx <> 'mock'))::int med_ms
          from ft group by hub, w) x
    group by hub
  ),
  laters as (
    select hub, jsonb_object_agg(w::text, jsonb_build_object('n', n, 'c', c)) j
    from (select hub, w, count(*)::int n, count(*) filter (where correct)::int c from ev where try > 1 group by hub, w) x
    group by hub
  ),
  -- first tries by kind of question (mcq, mcq:tf, mcq:2stmt, ...), from the latest wording's recorded kind
  kinds as (
    select hub, jsonb_object_agg(qt, j) j
    from (select hub, qt, jsonb_object_agg(w::text, jsonb_build_object('n', n, 'c', c)) j
          from (select ft.hub, coalesce(nullif(qv.qt, ''), '?') qt, ft.w, count(*)::int n, count(*) filter (where ft.correct)::int c
                from ft join lv on lv.hub = ft.hub and lv.qid = ft.qid and lv.v = ft.v
                left join question_versions qv on qv.hub = ft.hub and qv.qid = ft.qid and qv.v = ft.v
                group by 1, 2, 3) y
          group by hub, qt) z
    group by hub
  ),
  -- each question's pair: [qid, first tries on A, right on A, first tries on B, right on B]
  pairs as (
    select hub, jsonb_agg(jsonb_build_array(qid, an, ac, bn, bc) order by least(an, bn) desc, qid) j
    from (select ft.hub, ft.qid,
                 count(*) filter (where ft.w = 0)::int an, count(*) filter (where ft.w = 0 and ft.correct)::int ac,
                 count(*) filter (where ft.w = 1)::int bn, count(*) filter (where ft.w = 1 and ft.correct)::int bc
          from ft join lv on lv.hub = ft.hub and lv.qid = ft.qid and lv.v = ft.v
          group by 1, 2) p
    group by hub
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'hub', h.hub, 'answers', h.answers, 'people', h.people, 'since', h.since, 'last', h.last,
      'first', coalesce(f.j, '{}'::jsonb), 'later', coalesce(l.j, '{}'::jsonb), 'kinds', coalesce(k.j, '{}'::jsonb),
      'pairs', coalesce(p.j, '[]'::jsonb)) order by h.hub), '[]'::jsonb)
  into out
  from hubs h left join firsts f on f.hub = h.hub left join laters l on l.hub = h.hub
  left join kinds k on k.hub = h.hub left join pairs p on p.hub = h.hub;
  return jsonb_build_object('days', d, 'at', now(), 'hubs', out);
end;
$$;

revoke all on function public.get_ab_summary(text, integer) from public;
grant execute on function public.get_ab_summary(text, integer) to anon, authenticated;
