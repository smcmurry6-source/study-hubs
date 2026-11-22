-- v97 (2026-11-22): the exam-eve boss (idea board #4: one giant boss the night before an exam, every right answer from anyone in
-- the class takes a hit off it, and the class wins if it falls before midnight). Sam set the idea Planned: "This could be fun.
-- Maybe have an xp + gold crowns reward". Its page side is widget/eggs.js (the band while you study, Home's card) and
-- widget/hub-art/eveboss.js (the drawing); vault/reference/game-server.md, "The exam-eve boss", says how it fits together.
--
--   1. eve_bosses (hub, day): one row per exam eve, the day before an exam (Central). The After merge workflow keeps the rows
--      still to come equal to hubs.js's exams (tools/after-merge/run.js, the "eves" step); the two below are Review of
--      Systems' (its mock boards are Thu Dec 3 and Thu Dec 10). Closed to anon altogether: the page reads it through
--      get_eve_boss.
--   2. sh_eve_prize(): the numbers, in one place: the boss is up from 3 pm to midnight Central, has 3,000 HP, and pays everyone
--      who landed a hit 250 XP and crowns plus 25 a hit, up to 1,000 (30 hits), once, when it falls (Sam, 2026-11-22: "open it
--      from 3pm to midntight, hp is good, pay is good"). On the 11 exam eves since September the class had a median of 5,921
--      right answers from 3 pm to midnight (2,971 to 12,974): 10 of the 11 would have beaten it, the middle one at about 8 pm.
--   3. The count, without slowing the answer save: nothing is added to record_answer_v2 and no shared row is touched by an
--      answer. The class's hits are counted from personal_answers on demand: the first answer id at 3 pm is found once (a
--      binary search on the primary key: answers are saved in time order), then each count is a range scan of the primary key
--      from it (the evening's answers, every hub), filtered by hub, right and the time. A count is kept in the boss's row and
--      done again at most every 20 seconds, by whichever call comes first (pg_try_advisory_xact_lock: the others read the row
--      as it is), and every 10 minutes by pg_cron's 'sh-eve-boss', so the boss is settled after midnight even if nobody looks.
--   4. When it falls (its 3,000th right answer, in the order they were saved), everyone who landed a hit before it is paid at
--      once, on the server: one xp_awards row each, key 'eve:<hub>:<day>', to the linked id (visitor_links), src 'boss' (already
--      a prize: as many crowns as XP, never boosted; so sh_prizes, sh_is_prize, sh_wallet and the src check are unchanged).
--      Hits from a person's linked devices count together. A boss still up at midnight got away: nobody is paid.
--   5. get_eve_boss(hub, visitor): tonight's boss (or last night's, on the exam day) for the page: soon, up, down or lost, its
--      HP, the class's hits, how many people landed one, and the visitor's own hits and pay. No visitor id ever comes back.
--
-- Applying it: one small table, two rows, functions and a pg_cron job: no backfill, nothing locked; safe at any hour, one call
-- through the connector.

set local lock_timeout = '3s';

-- ====================================================================== 1. the eves
create table if not exists public.eve_bosses (
  hub text not null check (hub ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  day date not null,                       -- the eve (Central): the day before the exam
  exam_date date not null,
  hp integer not null check (hp between 100 and 100000),
  start_id bigint,                         -- the first personal_answers id from 3 pm on (found once, at the first count)
  hits integer not null default 0,         -- the class's right answers counted so far (up to hp)
  people integer not null default 0,       -- how many people landed one (linked devices as one)
  counted_at timestamptz,
  fell_id bigint,                          -- the answer that took its last HP
  fell_at timestamptz,
  settled_at timestamptz,                  -- its fate decided: it fell (and everyone was paid), or midnight passed
  paid integer not null default 0,         -- how many people were paid
  primary key (hub, day),
  check (exam_date > day)
);
alter table public.eve_bosses enable row level security;
revoke all on table public.eve_bosses from public, anon, authenticated;

-- ====================================================================== 2. the numbers
-- when it's up (from `hour` to midnight, Central), its HP unless hubs.js gives an exam its own (eveBoss), and what it pays:
-- base + per a hit, up to max
create or replace function public.sh_eve_prize()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('hour', 15, 'hp', 3000, 'base', 250, 'per', 25, 'max', 1000);
$$;
revoke all on function public.sh_eve_prize() from public;
grant execute on function public.sh_eve_prize() to anon, authenticated;

-- Review of Systems' two mock boards (hubs.js): their eves, Wed Dec 2 and Wed Dec 9
insert into public.eve_bosses (hub, day, exam_date, hp) values
  ('review-of-systems', '2026-12-02', '2026-12-03', 3000),
  ('review-of-systems', '2026-12-09', '2026-12-10', 3000)
on conflict (hub, day) do nothing;

-- ====================================================================== 3. the count
-- the first personal_answers id saved at or after p_ts: a binary search on the primary key, a few dozen index probes. Answers
-- are saved in time order (sh_answer stamps clock_timestamp()); the count below also filters by time, so one saved a moment
-- out of order is never counted wrongly, only, at worst, left out.
create or replace function public.sh_answer_id_at(p_ts timestamptz)
returns bigint language plpgsql stable security definer set search_path = public as $$
declare lo bigint; hi bigint; mid bigint; r record;
begin
  select min(id), max(id) + 1 into lo, hi from personal_answers;
  if lo is null then return 1; end if;
  while lo < hi loop
    mid := lo + (hi - lo) / 2;
    select a.id, a.answered_at into r from personal_answers a where a.id >= mid order by a.id limit 1;
    if not found or r.answered_at >= p_ts then hi := mid; else lo := r.id + 1; end if;
  end loop;
  return lo;
end;
$$;
revoke all on function public.sh_answer_id_at(timestamptz) from public, anon, authenticated;

-- the window of an eve: 3 pm to midnight, Central
create or replace function public.sh_eve_window(p_day date)
returns tstzrange language sql stable set search_path = public as $$
  select tstzrange((p_day::timestamp + make_interval(hours => (sh_eve_prize()->>'hour')::int)) at time zone 'America/Chicago',
                   ((p_day + 1)::timestamp) at time zone 'America/Chicago', '[)');
$$;
revoke all on function public.sh_eve_window(date) from public, anon, authenticated;

-- count the class's hits on one eve's boss as of p_at, and settle it when it has fallen (paying everyone who landed a hit) or
-- midnight has passed. Only one call counts at a time (the others return at once and read the row as it is), and a count
-- less than 20 seconds old is kept unless p_force.
create or replace function public.sh_eve_count(p_at timestamptz, p_hub text, p_day date, p_force boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_at timestamptz := coalesce(p_at, clock_timestamp()); b public.eve_bosses; w tstzrange; t0 timestamptz; t1 timestamptz; upto timestamptz;
  n int; ppl int; fid bigint; fat timestamptz; pr jsonb := sh_eve_prize(); r record; got int; npaid int := 0;
begin
  w := sh_eve_window(p_day); t0 := lower(w); t1 := upper(w);
  if v_at < t0 then return; end if;
  -- a fresh count (or a settled boss) needs nothing: read the row without a lock first, so the page's polls don't queue on it
  select * into b from eve_bosses where hub = p_hub and day = p_day;
  if not found or b.settled_at is not null then return; end if;
  if not coalesce(p_force, false) and b.counted_at is not null and b.counted_at > v_at - interval '20 seconds' and v_at < t1 then return; end if;
  if not pg_try_advisory_xact_lock(hashtext('eve|' || p_hub || '|' || p_day)) then return; end if;
  select * into b from eve_bosses where hub = p_hub and day = p_day for update;
  if not found or b.settled_at is not null then return; end if;
  if not coalesce(p_force, false) and b.counted_at is not null and b.counted_at > v_at - interval '20 seconds' and v_at < t1 then return; end if;
  if b.start_id is null then b.start_id := sh_answer_id_at(t0 - interval '10 minutes'); end if;
  upto := least(v_at, t1);

  -- Each query below reads the evening's answers as a range of the primary key (id >= start_id, every hub) in a materialized
  -- CTE, and filters hub, right and the time on that: with a.hub = p_hub next to the range, the planner took the
  -- (visitor_id, hub) index for the hub alone and read every answer the hub ever had.
  with ev as materialized (select a.id, a.visitor_id, a.hub, a.correct, a.answered_at from personal_answers a where a.id >= b.start_id)
  select count(*)::int, count(distinct coalesce(l.primary_id, ev.visitor_id))::int into n, ppl
    from ev left join visitor_links l on l.alias_id = ev.visitor_id
    where ev.hub = p_hub and ev.correct and ev.answered_at >= t0 and ev.answered_at < upto;

  if n >= b.hp then
    -- it fell: the answer that took its last HP, and everyone who landed a hit up to it, paid once
    with ev as materialized (select a.id, a.hub, a.correct, a.answered_at from personal_answers a where a.id >= b.start_id)
    select ev.id, ev.answered_at into fid, fat from ev
      where ev.hub = p_hub and ev.correct and ev.answered_at >= t0 and ev.answered_at < upto
      order by ev.id offset b.hp - 1 limit 1;
    for r in with ev as materialized (select a.id, a.visitor_id, a.hub, a.correct, a.answered_at from personal_answers a
                                       where a.id >= b.start_id and a.id <= fid)
             select coalesce(l.primary_id, ev.visitor_id) as who, count(*)::int as h
               from ev left join visitor_links l on l.alias_id = ev.visitor_id
               where ev.hub = p_hub and ev.correct and ev.answered_at >= t0 and ev.answered_at < upto
               group by 1 order by 1 loop
      got := sh_award(r.who, 'eve:' || p_hub || ':' || p_day, 'boss', p_hub,
                      least((pr->>'max')::int, (pr->>'base')::int + (pr->>'per')::int * r.h), 1, fat);
      npaid := npaid + 1;
    end loop;
    update eve_bosses set start_id = b.start_id, hits = b.hp, people = npaid, counted_at = v_at, fell_id = fid, fell_at = fat,
      settled_at = v_at, paid = npaid where hub = p_hub and day = p_day;
  else
    update eve_bosses set start_id = b.start_id, hits = n, people = ppl, counted_at = v_at,
      settled_at = case when v_at >= t1 then v_at end where hub = p_hub and day = p_day;
  end if;
end;
$$;
revoke all on function public.sh_eve_count(timestamptz, text, date, boolean) from public, anon, authenticated;

-- ====================================================================== 4. the page's read
-- tonight's boss on this hub (or last night's, on the exam day): its state (soon: before 3 pm; up; down: it fell; lost: it
-- got away at midnight), HP, the class's hits and how many people landed one, and this visitor's hits and pay (with a linked
-- device's). boss is null on any other day. A count older than 20 seconds is done again first (sh_eve_count).
create or replace function public.sh_eve_boss(p_at timestamptz, p_hub text, p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_at timestamptz := coalesce(p_at, clock_timestamp()); dd date := (v_at at time zone 'America/Chicago')::date;
  b public.eve_bosses; w tstzrange; st text; me text; mine int := 0; got int; pr jsonb := sh_eve_prize(); you jsonb := null;
begin
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' or (p_visitor is not null and length(p_visitor) not between 1 and 80) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  select * into b from eve_bosses where hub = p_hub and day in (dd, dd - 1) order by day desc limit 1;
  if not found then return jsonb_build_object('ok', true, 'boss', null); end if;
  w := sh_eve_window(b.day);
  if v_at >= lower(w) and b.settled_at is null then
    perform sh_eve_count(v_at, p_hub, b.day, false);
    select * into b from eve_bosses where hub = p_hub and day = b.day;
  end if;
  st := case when v_at < lower(w) then 'soon' when b.fell_id is not null then 'down' when b.settled_at is not null or v_at >= upper(w) then 'lost' else 'up' end;
  if p_visitor is not null then
    me := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
    if st <> 'soon' then
      -- visitor_id = any(array(...)) with the time range: an index scan of (visitor_id, answered_at) on both; written with
      -- "or ... in (...)" the planner read every answer of the hub through the (visitor_id, hub) index
      select count(*)::int into mine from personal_answers a
        where a.visitor_id = any(array(select me union select l.alias_id from visitor_links l where l.primary_id = me))
          and a.answered_at >= lower(w) and a.answered_at < least(upper(w), v_at)
          and a.hub = p_hub and a.correct and (b.fell_id is null or a.id <= b.fell_id);
    end if;
    select x.base into got from xp_awards x where x.visitor_id = me and x.key = 'eve:' || p_hub || ':' || b.day;
    you := jsonb_build_object('hits', mine,
      'pay', case when mine > 0 then least((pr->>'max')::int, (pr->>'base')::int + (pr->>'per')::int * mine) else 0 end,
      'paid', coalesce(got, 0));
    if coalesce(got, 0) > 0 then you := you || jsonb_build_object('crowns', sh_crowns(p_visitor)); end if;
  end if;
  return jsonb_build_object('ok', true, 'prize', pr, 'you', you, 'boss', jsonb_build_object(
    'day', b.day, 'exam', b.exam_date, 'state', st, 'starts', lower(w), 'ends', upper(w), 'hp', b.hp,
    'hits', least(b.hits, b.hp), 'left', greatest(0, b.hp - b.hits), 'people', b.people, 'fell_at', b.fell_at,
    'counted_at', b.counted_at, 'now', v_at));
end;
$$;
revoke all on function public.sh_eve_boss(timestamptz, text, text) from public, anon, authenticated;

create or replace function public.get_eve_boss(p_hub text, p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  return sh_eve_boss(null, p_hub, p_visitor);
end;
$$;
revoke all on function public.get_eve_boss(text, text) from public;
grant execute on function public.get_eve_boss(text, text) to anon, authenticated;

-- ====================================================================== 5. the job
-- every 10 minutes: count each boss whose window has begun and isn't settled yet, so it is settled (and paid) after midnight
-- even when no page asks; nothing to do on any other day. Its own run log is kept 2 days.
create or replace function public.sh_eve_tick()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select e.hub, e.day from eve_bosses e
             where e.settled_at is null and e.day <= (clock_timestamp() at time zone 'America/Chicago')::date
             order by e.day, e.hub loop
    if clock_timestamp() >= lower(sh_eve_window(r.day)) then
      perform sh_eve_count(clock_timestamp(), r.hub, r.day, true); n := n + 1;
    end if;
  end loop;
  if extract(hour from now()) = 9 and extract(minute from now()) < 10 and to_regclass('cron.job_run_details') is not null then
    begin
      execute $q$delete from cron.job_run_details where end_time < now() - interval '2 days'
                 and jobid in (select jobid from cron.job where jobname = 'sh-eve-boss')$q$;
    exception when others then null;
    end;
  end if;
  return n;
end;
$$;
revoke all on function public.sh_eve_tick() from public, anon, authenticated;

do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'sh-eve-boss';
      perform cron.schedule('sh-eve-boss', '*/10 * * * *', $c$set statement_timeout = '20s'; select public.sh_eve_tick()$c$);
    exception when others then
      raise notice 'pg_cron not set up (%): an eve boss is counted and settled when a page asks', sqlerrm;
    end;
  end if;
end $do$;
