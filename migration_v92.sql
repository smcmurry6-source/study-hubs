-- v92 (2026-11-20): more ways to earn Shiny Gold Crowns. Seven new prizes, each one xp_awards row with a key that pays once,
-- paying as many crowns as XP (sh_is_prize), never boosted; the amounts are in sh_prizes() (widget/v3.js's PRIZES says the same).
-- Sam, 2026-11-17: "im open to other ways too"; 2026-11-20: "yes want more ways to earn crowns", then, to the list with each
-- amount in study days (a median study day earned about 950 crowns over 11-19 and 11-20): "Yes and backpay".
--
--   fairy      250  the first Tooth Fairy caught                    key 'fairy'                record_fairy, claim_fairy_v2
--   goldfairy  500  the first Golden Tooth Fairy caught (the rare)  key 'goldfairy'            claim_fairy_v2 (p_gold)
--   probe      300  a Golden Probe won (first in the class that day) key 'probe:<hub>:<day>'  claim_golden_probe(_v2)
--   perfect    750  a perfect mock: 20+ questions, every one right   key 'perfect:<hub>'        sh_session_finish
--   misses     100  yesterday's misses (3+) all answered right today key 'misses:<hub>:<day>'   claim_misses_v2
--   idea       500  an idea of yours marked shipped on the idea board key 'idea:<id>'           admin_set_idea
--   back       200  the first answer after 7+ days without studying  key 'back:<day>'           sh_streak_step
--
-- The src of each is its own kind (xp_awards_src_check, sh_is_prize). The Tooth Fairy is caught on the page, so only the first
-- catch pays (a catch every minute can't be farmed); a Golden Tooth Fairy's catch is kept with qid 'gold' in egg_events so
-- the next one is known. The Golden Probe is the class's one winner per hub per day, so each win pays.
--
-- Back pay (Sam, "Yes and backpay"), section 4, paid to the primary id of a linked device: the first fairy catch of everyone
-- who caught one, every Golden Probe ever won, and each hub's first perfect mock (mock_scores, 20+ questions, all right). Not
-- the Golden Tooth Fairy (egg_events never kept which catches were golden), nor a day back after a week, nor yesterday's misses
-- (no clean record of either), nor ideas (none of the shipped ones has a student author). The keys are the ones the live
-- functions use, so nothing pays twice. The back pay is XP too, like v68's for reports and medals, so it can move a rank.
--
-- Applying it: function replacements, the src check (not valid, as v75's), and about 130 award rows: a few seconds. Apply
-- when the class is quiet (1 to 5 am Central) or at any quiet hour; one call through the connector.

set local lock_timeout = '3s';

-- ====================================================================== 1. the kinds and the amounts
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin',
                 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime', 'notes', 'trophy', 'visit', 'game', 'record', 'restore',
                 'collection', 'fairy', 'goldfairy', 'probe', 'perfect', 'misses', 'idea', 'back'))
  not valid;

-- the kinds whose XP pays as many crowns (migration_v76's list, and v92's seven)
create or replace function public.sh_is_prize(p_src text)
returns boolean language plpgsql immutable set search_path = public as $$
begin
  return p_src in ('survey', 'checkin', 'report', 'medal', 'pod-done', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime',
                   'notes', 'trophy', 'visit', 'game', 'record', 'collection', 'fairy', 'goldfairy', 'probe', 'perfect', 'misses', 'idea', 'back');
end;
$$;

-- what every prize pays, for the page (migration_v89's table, and v92's seven; widget/v3.js's PRIZES says the same)
create or replace function public.sh_prizes()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('name', 500, 'ring', 5, 'boss', 500, 'nuke', 10000, 'alltime', 20000, 'notes', 50, 'trophy', 200,
    'visit', 50, 'game', 100, 'pb', 50, 'top', 250, 'report', 100, 'collection', 1000, 'dark', 5000, 'modupro', 20000, 'loupes', 30000,
    'fairy', 250, 'goldfairy', 500, 'probe', 300, 'perfect', 750, 'misses', 100, 'idea', 500, 'back', 200,
    'streak', jsonb_build_array(jsonb_build_array(3, 100), jsonb_build_array(7, 300), jsonb_build_array(14, 700),
      jsonb_build_array(30, 1500), jsonb_build_array(60, 3000), jsonb_build_array(100, 5000)),
    'row', jsonb_build_array(jsonb_build_array(10, 25), jsonb_build_array(25, 100), jsonb_build_array(50, 250)),
    'medal', jsonb_build_array(250, 500, 750, 1000));
$$;
revoke all on function public.sh_prizes() from public;
grant execute on function public.sh_prizes() to anon, authenticated;

-- ====================================================================== 2. the easter eggs
-- the Tooth Fairy: one catch a minute at most (as v13), kept with qid 'gold' for a Golden one; the first catch pays `fairy`,
-- the first Golden one `goldfairy`. Returns the catches so far and what it paid.
create or replace function public.sh_fairy(p_hub text, p_visitor text, p_gold boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare paid int := 0; caught boolean := false; n int;
begin
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  if not exists (select 1 from egg_events where kind = 'fairy' and visitor_id = p_visitor and created_at > now() - interval '1 minute') then
    insert into egg_events (kind, hub, visitor_id, qid) values ('fairy', coalesce(p_hub, ''), p_visitor, case when coalesce(p_gold, false) then 'gold' end);
    caught := true;
  end if;
  if caught then
    paid := sh_award(p_visitor, 'fairy', 'fairy', coalesce(p_hub, ''), (sh_prizes()->>'fairy')::int, 1, clock_timestamp());
    if coalesce(p_gold, false) then
      paid := paid + sh_award(p_visitor, 'goldfairy', 'goldfairy', coalesce(p_hub, ''), (sh_prizes()->>'goldfairy')::int, 1, clock_timestamp());
    end if;
  end if;
  select count(*)::int into n from egg_events where kind = 'fairy' and visitor_id = p_visitor;
  return jsonb_build_object('n', n, 'paid', paid);
end;
$$;
revoke all on function public.sh_fairy(text, text, boolean) from public, anon, authenticated;

-- v13's call, as a cached page sends it: the same count, and now the first catch pays
create or replace function public.record_fairy(p_hub text, p_visitor text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 then return 0; end if;
  return (sh_fairy(p_hub, p_visitor, false)->>'n')::int;
end;
$$;

-- the page's call since v92: says whether she was the Golden one, and answers like every prize call (sh_prize_reply) with `n`
create or replace function public.claim_fairy_v2(p_hub text, p_visitor text, p_gold boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  r := sh_fairy(p_hub, p_visitor, p_gold);
  return sh_prize_reply(p_visitor, case when coalesce(p_gold, false) then 'goldfairy' else 'fairy' end, (r->>'paid')::int,
    jsonb_build_object('n', (r->>'n')::int));
end;
$$;
revoke all on function public.claim_fairy_v2(text, text, boolean) from public;
grant execute on function public.claim_fairy_v2(text, text, boolean) to anon, authenticated;

-- the Golden Probe: true only for the day's first claim on that hub (v13), which now pays `probe:<hub>:<day>`
create or replace function public.sh_golden_probe(p_hub text, p_visitor text, p_qid text)
returns integer language plpgsql security definer set search_path = public as $$
declare dd date := (now() at time zone 'America/Chicago')::date;
begin
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  insert into egg_events (kind, hub, visitor_id, qid, day) values ('golden', p_hub, p_visitor, p_qid, dd)
  on conflict do nothing;
  if not found then return -1; end if;
  return sh_award(p_visitor, 'probe:' || p_hub || ':' || dd, 'probe', p_hub, (sh_prizes()->>'probe')::int, 1, clock_timestamp());
end;
$$;
revoke all on function public.sh_golden_probe(text, text, text) from public, anon, authenticated;

create or replace function public.claim_golden_probe(p_hub text, p_visitor text, p_qid text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 or p_hub is null then return false; end if;
  return sh_golden_probe(p_hub, p_visitor, p_qid) >= 0;
end;
$$;

-- the page's call since v92: `first` says whether this was the day's first claim, the rest as every prize call
create or replace function public.claim_golden_probe_v2(p_hub text, p_visitor text, p_qid text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare paid int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  paid := sh_golden_probe(p_hub, p_visitor, p_qid);
  return sh_prize_reply(p_visitor, 'probe', greatest(paid, 0), jsonb_build_object('first', paid >= 0));
end;
$$;
revoke all on function public.claim_golden_probe_v2(text, text, text) from public;
grant execute on function public.claim_golden_probe_v2(text, text, text) to anon, authenticated;

-- ====================================================================== 3. study prizes
-- yesterday's misses all right: the questions whose latest answer before today came yesterday (Central) and was wrong, at
-- least 3 of them in the hub, each answered right today. The page asks when it has seen every one right in Yesterday's
-- misses; `left` says how many are still to do (an answer still on its way, say).
create or replace function public.claim_misses_v2(p_visitor text, p_hub text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare dd date := (now() at time zone 'America/Chicago')::date; t0 timestamptz; n int; left_n int; paid int := 0;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  t0 := dd::timestamp at time zone 'America/Chicago';
  select count(*), count(*) filter (where not exists (select 1 from personal_answers b where b.visitor_id = p_visitor and b.hub = p_hub
      and b.qid = m.qid and b.correct and b.answered_at >= t0))
    into n, left_n
    from (select distinct on (a.qid) a.qid, a.correct, a.answered_at from personal_answers a
          where a.visitor_id = p_visitor and a.hub = p_hub and a.answered_at < t0 and a.answered_at >= t0 - interval '2 days'
          order by a.qid, a.answered_at desc, a.id desc) m
    where not m.correct and (m.answered_at at time zone 'America/Chicago')::date = dd - 1;
  if n >= 3 and left_n = 0 then
    paid := sh_award(p_visitor, 'misses:' || p_hub || ':' || dd, 'misses', p_hub, (sh_prizes()->>'misses')::int, 1, clock_timestamp());
  end if;
  return sh_prize_reply(p_visitor, 'misses', paid, jsonb_build_object('n', n, 'left', left_n));
end;
$$;
revoke all on function public.claim_misses_v2(text, text) from public;
grant execute on function public.claim_misses_v2(text, text) to anon, authenticated;

-- the streak of days (v68) and, since v92, the first answer after 7 or more days without studying: `back:<day>`, once a day.
-- Called on the day's first answer (sh_answer); a first day ever isn't a day back.
create or replace function public.sh_streak_step(p_visitor text, p_hub text, p_d date, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k int; i int; paid int; out jsonb := '[]'::jsonb; prev date;
  ms int[] := array[3, 7, 14, 30, 60, 100]; pays int[] := array[100, 300, 700, 1500, 3000, 5000];
begin
  select count(*) into k from (
    select x.d, p_d - x.d as back, row_number() over (order by x.d desc) - 1 as rn
    from xp_days x where x.visitor_id = p_visitor and x.d <= p_d and x.d > p_d - 400
  ) z where z.back = z.rn;
  for i in 1..6 loop
    if k = ms[i] then
      paid := sh_award(p_visitor, 'streak:' || (p_d - k + 1) || ':' || k, 'streak', p_hub, pays[i], 1, p_at);
      if paid > 0 then out := out || jsonb_build_object('src', 'streak', 'xp', paid, 'n', k); end if;
    end if;
  end loop;
  -- v92: back after a week away (7+ days with nothing studied between)
  select max(x.d) into prev from xp_days x where x.visitor_id = p_visitor and x.d < p_d;
  if prev is not null and p_d - prev >= 8 then
    paid := sh_award(p_visitor, 'back:' || p_d, 'back', p_hub, (sh_prizes()->>'back')::int, 1, p_at);
    if paid > 0 then out := out || jsonb_build_object('src', 'back', 'xp', paid, 'n', p_d - prev - 1); end if;
  end if;
  return out;
end;
$$;
revoke all on function public.sh_streak_step(text, text, date, timestamptz) from public, anon, authenticated;

-- a finished mock (migration_v68's sh_session_finish) and, since v92, a perfect one: 20 or more questions answered, every
-- one right, and none left out (p_total, the mock's length, no more than the answers): `perfect:<hub>` once per hub
create or replace function public.sh_session_finish(p_at timestamptz, p_visitor text, p_session uuid, p_score integer, p_total integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; s record; n int := 0; nc int := 0; paid int := 0; v_mult int; dd date; v_game int := 0; v_pb int := 0; v_top int := 0;
  my_best int; best int; n_before int; n_after int; long_ok boolean; v_perfect int := 0;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_session is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  select * into s from xp_sessions where id = p_session and visitor_id = p_visitor for update;
  if not found or s.started_at > v_at or s.started_at < v_at - interval '6 hours' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', true, 'repeat', true, 'xp', 0); end if;
  update xp_sessions set finished_at = v_at where id = s.id;
  v_mult := sh_xp_mult(p_visitor, v_at);
  dd := (v_at at time zone 'America/Chicago')::date;
  if s.kind = 'mock' then
    select count(*), count(*) filter (where a.correct) into n, nc
      from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = s.id;
    if n >= 10 then paid := sh_award(p_visitor, 'mock:' || s.hub || ':' || dd, 'mock', s.hub, 50, v_mult, v_at); end if;
    if n > 0 then perform record_mock_score(p_visitor, s.hub, nc, least(300, greatest(n, coalesce(p_total, n)))); end if;
    -- v92: a perfect mock
    if n >= 20 and nc = n and coalesce(p_total, n) <= n then
      v_perfect := sh_award(p_visitor, 'perfect:' || s.hub, 'perfect', s.hub, (sh_prizes()->>'perfect')::int, 1, v_at);
    end if;
    return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult, 'answers', n, 'correct', nc, 'perfect', v_perfect, 'crowns', sh_crowns(p_visitor));
  end if;
  long_ok := v_at - s.started_at >= interval '20 seconds';
  if long_ok then
    paid := sh_award(p_visitor, 'arc:' || s.hub || ':' || s.game || ':' || dd, 'arcade', s.hub, 50, v_mult, v_at);
    v_game := sh_award(p_visitor, 'game:' || dd, 'game', s.hub, 100, 1, v_at);
  end if;
  if p_score is not null then
    select max(a.score) filter (where a.visitor_id = p_visitor), max(a.score), count(*) filter (where a.visitor_id = p_visitor)
      into my_best, best, n_before from arcade_scores a where a.hub = s.hub and a.game = s.game;
    perform submit_arcade_score(p_visitor, s.hub, s.game, p_score);
    select count(*) into n_after from arcade_scores a where a.hub = s.hub and a.game = s.game and a.visitor_id = p_visitor;
    if long_ok and n_after > n_before then
      if my_best is not null and p_score > my_best then
        v_pb := sh_award(p_visitor, 'pb:' || s.hub || ':' || s.game || ':' || dd, 'record', s.hub, 50, 1, v_at); end if;
      if best is not null and p_score > best then
        v_top := sh_award(p_visitor, 'top:' || s.hub || ':' || s.game || ':' || dd, 'record', s.hub, 250, 1, v_at); end if;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult, 'game', v_game, 'pb', v_pb, 'top', v_top, 'crowns', sh_crowns(p_visitor));
end;
$$;
revoke all on function public.sh_session_finish(timestamptz, text, uuid, integer, integer) from public, anon, authenticated;

-- the idea board (migration_v54's admin_set_idea) and, since v92, an idea marked shipped pays its author `idea:<id>` once
-- (the Inbox note they already get says so on the page)
create or replace function public.admin_set_idea(p_secret text, p_id bigint, p_action text, p_status text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare i record; nn text := nullif(left(btrim(coalesce(p_note, '')), 200), ''); k int := 0; paid int := 0;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into i from ideas where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if p_action = 'hide' then update ideas set hidden = true, hidden_by = 'admin' where id = p_id;
  elsif p_action = 'restore' then update ideas set hidden = false, hidden_by = null, restored_at = now() where id = p_id;
  elsif p_action = 'status' then
    if p_status is null or p_status not in ('open', 'considering', 'planned', 'shipped', 'not-doing') then raise exception 'bad status'; end if;
    if p_status is distinct from i.status or nn is distinct from i.status_note then
      update ideas set status = p_status, status_note = nn, status_at = now() where id = p_id;
      if p_status is distinct from i.status and p_status <> 'open' then
        insert into idea_notes (idea_id, visitor_id, status, note)
          select p_id, w.visitor_id, p_status, nn from (
            select i.visitor_id where i.visitor_id is not null
            union select x.visitor_id from idea_votes x where x.idea_id = p_id and x.val = 1) w;
        get diagnostics k = row_count;
      end if;
    end if;
    -- v92: the author's prize, once, whoever's device it was posted from (a linked one pays the primary id)
    if p_status = 'shipped' and i.visitor_id is not null then
      paid := sh_award(coalesce((select l.primary_id from visitor_links l where l.alias_id = i.visitor_id), i.visitor_id),
        'idea:' || p_id, 'idea', coalesce(i.hub, ''), (sh_prizes()->>'idea')::int, 1, clock_timestamp());
    end if;
  else raise exception 'bad action';
  end if;
  return jsonb_build_object('ok', true, 'notified', k, 'paid', paid);
end;
$$;
revoke all on function public.admin_set_idea(text, bigint, text, text, text) from public;
grant execute on function public.admin_set_idea(text, bigint, text, text, text) to anon, authenticated;

-- ====================================================================== 4. back pay (Sam: "Yes and backpay")
-- to the primary id of a linked device; at the time it was won; the live keys, so a second run or a live claim pays nothing more
select sh_award(f.v, 'fairy', 'fairy', f.hub, (sh_prizes()->>'fairy')::int, 1, f.at)
from (select distinct on (coalesce(l.primary_id, e.visitor_id)) coalesce(l.primary_id, e.visitor_id) v, e.hub, e.created_at at
      from egg_events e left join visitor_links l on l.alias_id = e.visitor_id
      where e.kind = 'fairy' order by coalesce(l.primary_id, e.visitor_id), e.created_at) f;

select sh_award(coalesce(l.primary_id, e.visitor_id), 'probe:' || e.hub || ':' || e.day, 'probe', e.hub, (sh_prizes()->>'probe')::int, 1, e.created_at)
from egg_events e left join visitor_links l on l.alias_id = e.visitor_id
where e.kind = 'golden';

select sh_award(m.v, 'perfect:' || m.hub, 'perfect', m.hub, (sh_prizes()->>'perfect')::int, 1, m.at)
from (select distinct on (coalesce(l.primary_id, s.visitor_id), s.hub) coalesce(l.primary_id, s.visitor_id) v, s.hub, s.created_at at
      from mock_scores s left join visitor_links l on l.alias_id = s.visitor_id
      where s.total >= 20 and s.correct = s.total order by coalesce(l.primary_id, s.visitor_id), s.hub, s.created_at) m;
