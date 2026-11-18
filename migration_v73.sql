-- migration_v73: the answer catch-up after the evening outage of 2026-11-18.
-- Sam, 2026-11-18: "we can do fixes for 1 and 2" (this is 2, the answers; 1 is the time, tools/data-fixes/2026-11-18-outage-time.sql;
-- vault/tasks/2026-11-18-database-load.md). From 19:35 to 21:03 UTC about 1,300 answers never reached the database (about 2,500
-- tried, the edge logs), with the XP and crowns they paid. Each device kept them: a hub's page keeps the day's answers, right
-- answers and XP (STATE.nx.days['2026-11-18']: n, r, xp, met), and it keeps them after the day, but not which choice was picked, so
-- the answers can't be graded or saved again. What comes back is what they paid, once, on the next visit (widget/hub-rewards.js):
--
-- restore_outage_v2(p_visitor, p_hub, p_n, p_r, p_xp, p_goal, p_met), until 2026-11-22 (Central), once per person and hub:
--   * Only for someone who was studying in that hub during the outage (a ping there between 19:35 and 21:06 UTC), and for no
--     more answers than 3 a minute from their first to their last ping in that window, at most 250 (the class averaged about
--     half a minute's answer).
--   * The missing answers: the device's count for 2026-11-18 in that hub minus the database's (the right ones likewise).
--   * Their XP: the device's XP for the day minus everything the database paid that person that day in that hub (or in no hub),
--     never more than the answer rules would pay them (10 a right one, 1 a miss, times a boost running at 20:20 UTC); plus the
--     day's 20th answer (30, goal20) and the day's first answer (20) when the missing answers are what would have reached them.
--     One award, src 'restore', key 'outage:2026-11-18:<hub>': answer XP, so it pays crowns as answers do (one for 2 XP,
--     sh_wallet), and it survives a rebuild (sh_xp_rebuild redoes only 'answer', 'goal20' and 'fix').
--   * The daily ring (5 XP and crowns a question of the goal) when the device met its goal and the restored answers reach it
--     and it wasn't paid: the live key ('ring:<hub>:2026-11-18'), so never twice.
--   * The day counts for the streak: xp_days gets the missing answers (a new day when none was saved), xp_visitors' days and best
--     run of days follow, and the streak step runs for that day and each day studied since, as the day's first answer would have
--     (its prizes' keys make it pay once).
-- The answers themselves are not added: medals, the class's numbers on each question and another device's progress don't count
-- them (the device that answered still has them).
-- Safe to run twice (create or replace; the award's key). Quick to apply: the new kind of award is checked against the awards
-- already there with `validate constraint`, which doesn't stop answers being saved while it reads them.

alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin',
                 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime', 'notes', 'trophy', 'visit', 'game', 'record', 'restore'))
  not valid;
-- checked against the rows already there without holding up the answers being saved meanwhile (validate takes a lighter lock)
alter table public.xp_awards validate constraint xp_awards_src_check;

create or replace function public.restore_outage_v2(p_visitor text, p_hub text, p_n integer, p_r integer, p_xp integer,
  p_goal integer, p_met boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  dd constant date := date '2026-11-18';
  w0 constant timestamptz := timestamptz '2026-11-18 19:35:00+00';
  w1 constant timestamptz := timestamptz '2026-11-18 21:06:00+00';
  v_at constant timestamptz := timestamptz '2026-11-18 20:20:00+00';
  t0 timestamptz := dd::timestamp at time zone 'America/Chicago';
  t1 timestamptz := (dd + 1)::timestamp at time zone 'America/Chicago';
  v_key text; first_at timestamptz; last_at timestamptz; cap int; n_s int; r_s int; xp_s int; miss_n int; miss_r int;
  v_mult int; want int; day_n int; new_day boolean := false; g20 int := 0; paid int := 0; ring int := 0; cards int;
  bonus jsonb := '[]'::jsonb; sd date;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_n is null or p_n not between 0 and 5000 or p_r is null or p_r not between 0 and p_n
     or p_xp is null or p_xp not between 0 and 100000 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  if now() >= timestamptz '2026-11-22 06:00:00+00' then return jsonb_build_object('ok', false, 'error', 'closed'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_key := 'outage:' || dd || ':' || p_hub;
  if exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = v_key) then
    return sh_prize_reply(p_visitor, 'restore', 0, jsonb_build_object('why', 'done'));
  end if;

  -- studying in that hub during the outage, and for how long
  select min(a.pinged_at), max(a.pinged_at) into first_at, last_at from activity_pings a
    where a.visitor_id = p_visitor and a.hub = p_hub and a.pinged_at >= w0 and a.pinged_at < w1;
  if first_at is null then return sh_prize_reply(p_visitor, 'restore', 0, jsonb_build_object('why', 'none')); end if;
  cap := least(250, 3 * ceil(greatest(1, extract(epoch from last_at - first_at) / 60.0))::int);

  -- what the database has for that day in that hub
  select count(*), count(*) filter (where a.correct) into n_s, r_s from personal_answers a
    where a.visitor_id = p_visitor and a.hub = p_hub and a.answered_at >= t0 and a.answered_at < t1;
  select coalesce(sum(w.xp), 0) into xp_s from xp_awards w
    where w.visitor_id = p_visitor and w.d = dd and w.hub in (p_hub, '');
  miss_n := least(cap, greatest(0, p_n - n_s));
  miss_r := least(miss_n, greatest(0, p_r - r_s));
  if miss_n = 0 then return sh_prize_reply(p_visitor, 'restore', 0, jsonb_build_object('why', 'none')); end if;
  v_mult := sh_xp_mult(p_visitor, v_at);
  want := least(greatest(0, p_xp - xp_s), (10 * miss_r + (miss_n - miss_r)) * v_mult);

  -- the day's count, for the streak and the 20th answer
  select x.n into day_n from xp_days x where x.visitor_id = p_visitor and x.d = dd;
  if day_n is null then
    insert into xp_days (visitor_id, d, n, c, raw) values (p_visitor, dd, miss_n, miss_r, 0);
    new_day := true; day_n := 0;
  else
    update xp_days x set n = x.n + miss_n, c = x.c + miss_r where x.visitor_id = p_visitor and x.d = dd;
  end if;
  if day_n < 20 and day_n + miss_n >= 20 and not exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'g20:' || dd) then
    g20 := 30 * v_mult;
  end if;
  paid := sh_award(p_visitor, v_key, 'restore', p_hub, want + g20 + case when new_day then 20 else 0 end, 1, v_at);
  update xp_visitors x set answers = x.answers + miss_n, correct = x.correct + miss_r,
    days = (select count(*) from xp_days z where z.visitor_id = p_visitor),
    best_days = greatest(x.best_days, (select coalesce(max(len), 0)::int from (select count(*) as len from (
      select z.d, z.d - (row_number() over (order by z.d))::int as grp from xp_days z where z.visitor_id = p_visitor) i group by grp) r))
    where x.visitor_id = p_visitor;

  -- the daily ring, as sh_claim_ring counts it (the hub's answers and paying flashcards that day), with the missing answers
  if coalesce(p_met, false) and p_goal in (10, 20, 30, 40, 50) then
    select count(*) into cards from xp_awards w where w.visitor_id = p_visitor and w.src = 'card' and w.hub = p_hub and w.d = dd;
    if n_s + cards + miss_n >= p_goal then
      ring := sh_award(p_visitor, 'ring:' || p_hub || ':' || dd, 'ring', p_hub, 5 * p_goal, 1, v_at);
    end if;
  end if;

  -- the streak of days, for that day and each one studied since (its prizes pay once, by their keys)
  if new_day then
    for sd in select z.d from xp_days z where z.visitor_id = p_visitor and z.d >= dd order by z.d loop
      bonus := bonus || sh_streak_step(p_visitor, p_hub, sd, v_at);
    end loop;
  end if;

  return sh_prize_reply(p_visitor, 'restore', (paid + ring + coalesce((select sum((b->>'xp')::int) from jsonb_array_elements(bonus) b), 0))::int,
    jsonb_build_object('n', miss_n, 'right', miss_r, 'answers', paid, 'ring', ring, 'bonus', bonus, 'day', new_day));
end;
$$;

revoke all on function public.restore_outage_v2(text, text, integer, integer, integer, integer, boolean) from public;
grant execute on function public.restore_outage_v2(text, text, integer, integer, integer, integer, boolean) to anon, authenticated;
