-- v64 (2026-11-17): crowns that show as they're earned, every prize paying as many crowns as XP, and new prizes.
-- Sam, 2026-11-17: "my crowns are not increasing after i answer questions. make sure there is no cap on daily crown or xp
-- earn rates", then "crowns and xp for selecting a custom name, add crowns for having a report fixed along with the xp you
-- already get. crowns and xp bonus for completing daily ring, defeating a question boss prorated to how much damage you did,
-- reaching streaks. 10,000 xp and crowns for launching a nuke. small bonus for completing a lecture in notes. immediately
-- scrolling to the bottom doesnt count. bonus for getting achievements and hub medals. once daily bonus for visiting someone
-- elses timmy, bonus for games and setting a game record. 20,000 xp and crown bonus for breaking the all time streak."
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js). Applied to the live project on
-- 2026-11-18 through the Supabase connector, at Sam's "merge when ready" (PR #403).
--
-- What was wrong: nothing on the server. Answers pay XP with no daily cap (migration_v54; the 600-a-day cap is only on the
-- old single-file pages' record_personal_answer), and crowns are worked out from XP whenever they're read. But the page read
-- the balance once, in its bootstrap, and nothing updated it, so crowns only moved on a reload. Every paid reply now carries
-- the balance (`crowns`), and the page shows it at once (widget/v3.js sends it on as sh:crowns).
--
-- 1. Crowns (sh_wallet). Study XP (answers, the day's bonuses, mocks, games, Timmy Time's minutes, flashcards) pays 5 crowns
--    per 10 XP (Sam, 2026-11-17: "lets increase it to 5 crowns per 10xp"; it was 1, and a balance is worked out from all the
--    XP so far, so every balance goes up with it), and 100 crowns per hour of hub time (Sam: "also 100 crowns per hour of
--    hub time"; from all the time recorded, at most 100 in a clock hour: sh_time_crowns). Every *prize* now pays as many crowns as its XP
--    (sh_is_prize): the survey and check-in rewards (as since v60), a fixed report (100 XP, now 100 crowns, was 10), a hub
--    medal, finishing a Timmy Time episode, and every prize below. A prize is never boosted, so its XP and crowns are equal.
--    The trophy (+25), medal (+50) and rank-up (+20) grants stay. Fixed reports, medals and finished episodes already paid
--    since the release get their crowns too (crowns only: XP and rank don't move).
-- 2. Medals pay more: Bronze 250, Silver 500, Gold 750, Crown 1,000 XP (were 100 to 500), with as many crowns, for medals won
--    from now on.
-- 3. New prizes, each a row in xp_awards (paid once per key, kept by the rebuild and Link my devices like a mock's), each
--    checked on the server so a page can't make one up:
--      name     500   choosing a leaderboard name (not the made-up default), once
--      ring     5 a question of your daily goal (10-50 questions: 50-250), once per hub per day, when the day's answers
--                     and flashcard ratings in that hub reach it
--      boss     up to 500 for a Plaque Boss, by your share of its HP: the damage you say you did, never more than your right
--                     answers in that hub in the boss's 2 hours (a critical hit every 5th), once per boss
--      streak   100 / 300 / 700 / 1,500 / 3,000 / 5,000 at 3, 7, 14, 30, 60 and 100 days in a row studied
--      row      25 / 100 / 250 at 10, 25 and 50 right in a row (the server's own run: answers it grades from a key, at the
--                     speed limit, that pay XP; a self-graded card, a question it has no key for or a question's 4th right
--                     answer of the day neither adds to it nor ends it)
--      nuke     10,000 for launching a tactical nuke: the run reached 100 since the last launch
--      alltime  20,000 for passing the class's longest run of right answers ever (175 when this ran), once per run
--      notes    50 for a lecture's notes read to the end, once per lecture: the page asks when the lecture opens and when
--                     it's done; at least 60 seconds apart (the page also wants time for the lecture's length)
--      trophy   200 for each trophy won from now on (the trophies held now are recorded in prize_seen and pay nothing)
--      visit    50 for visiting someone else's place, once a day
--      game     100 for the first arcade game finished each day (at least 20 seconds, like its 50 XP)
--      record   50 for beating your own best in a game, 250 for the hub's top score in it, each once per game a day
-- 4. Every reply that pays says so (`xp`, and `crowns`, the balance after it), so the page can show it at once.
-- 5. Every right answer pays (Sam, 2026-11-17: "Every right answer should give xp"): 10 the first time ever, 2 after (a
--    self-graded card 2), with no speed limit and no limit a day on a question; only a double tap (the same question again
--    within 2 seconds) and the same question twice in one mock don't. A retired question still holding its key is graded from it. Misses keep the speed limit and three a day; the
--    run of right answers in a row (and so the nuke and the record) still counts only answers at the speed limit and a
--    question's first three right of the day. sh_xp_replay pays the same, and every visitor is rebuilt from it, so the
--    right answers since the release that paid nothing are paid now.

-- ====================================================================== the award kinds
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin',
                 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime', 'notes', 'trophy', 'visit', 'game', 'record'));

-- the kinds whose XP pays as many crowns (and is left out of the 1-crown-per-10-XP share)
create or replace function public.sh_is_prize(p_src text)
returns boolean language sql immutable set search_path = public as $$
  select p_src in ('survey', 'checkin', 'report', 'medal', 'pod-done', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime',
                   'notes', 'trophy', 'visit', 'game', 'record');
$$;

-- what every prize pays, for the page (widget/v3.js's PRIZES must say the same: tools/release/xp.js checks)
create or replace function public.sh_prizes()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('name', 500, 'ring', 5, 'boss', 500, 'nuke', 10000, 'alltime', 20000, 'notes', 50, 'trophy', 200,
    'visit', 50, 'game', 100, 'pb', 50, 'top', 250, 'report', 100,
    'streak', jsonb_build_array(jsonb_build_array(3, 100), jsonb_build_array(7, 300), jsonb_build_array(14, 700),
      jsonb_build_array(30, 1500), jsonb_build_array(60, 3000), jsonb_build_array(100, 5000)),
    'row', jsonb_build_array(jsonb_build_array(10, 25), jsonb_build_array(25, 100), jsonb_build_array(50, 250)),
    'medal', jsonb_build_array(250, 500, 750, 1000));
$$;

-- ====================================================================== 1. the wallet
-- the wallet (migration_v54): 5 crowns per 10 XP of study XP (was 1) (a boost's extra earns none), as many crowns as XP for every prize
-- (v64), 1,000 a survey or check-in reward (as since v60, whatever its XP), +25 a trophy, +50 a medal and +20 a rank-up since the switch, minus what
-- was spent. `got` says which once-only prizes are taken (the name ever; the visit and the first game today), and `pays` what
-- every prize pays (sh_prizes), for the page.
-- v64 also pays 100 crowns per hour of hub time (Sam, 2026-11-17: "also 100 crowns per hour of hub time"), from the time the
-- hubs record (activity_hourly: a ping is 25 seconds, sent only while a hub is open and someone has touched it in the last
-- 15 minutes), all of it since tracking began, at most 100 in any clock hour (144 pings): pings come straight from the page,
-- so two tabs, or a script, never pay more than an hour's worth an hour. The dashboard sends none.
create or replace function public.sh_time_crowns(p_visitor text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((sum(least(t.n, 144)) * 100 / 144)::integer, 0)
  from (select h.h, sum(h.n) as n from activity_hourly h
        where h.visitor_id = p_visitor and h.hub <> '' and h.hub <> 'zz-test' group by h.h) t;
$$;

create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; prize_xp int; prize_c int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[];
  m_now text[]; m_was text[]; n_t int; n_m int; n_r int; earned int; spent int; dd date := (now() at time zone 'America/Chicago')::date;
  t_c int := sh_time_crowns(p_visitor);
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  select coalesce(sum(a.xp - a.base), 0), coalesce(sum(a.base) filter (where sh_is_prize(a.src)), 0),
         count(*) filter (where a.src in ('survey', 'checkin')),
         coalesce(sum(a.base) filter (where sh_is_prize(a.src) and a.src not in ('survey', 'checkin')), 0)
    into extra, prize_xp, n_f, prize_c from xp_awards a where a.visitor_id = p_visitor;
  base_xp := greatest(0, v_xp - extra - prize_xp);
  select * into bl from game_baseline where visitor_id = p_visitor;
  badges := array(select jsonb_array_elements_text(coalesce(get_rank_profile_v2(p_visitor)->'badges', '[]'::jsonb)));
  t_now := array(select distinct split_part(b, ':', 1) from unnest(badges) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  t_was := array(select distinct split_part(b, ':', 1) from unnest(coalesce(bl.badges, '{}')) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  m_now := array(select b from unnest(badges) b where b like 'mastery-%:%');
  m_was := array(select b from unnest(coalesce(bl.badges, '{}')) b where b like 'mastery-%:%');
  n_t := (select count(*) from unnest(t_now) z where not (z = any(t_was)));
  n_m := (select count(*) from unnest(m_now) z where not (z = any(m_was)));
  n_r := greatest(0, (select gtier from sh_rank(v_xp)) - (select gtier from sh_rank(coalesce(bl.xp, 0))));
  earned := base_xp / 2 + t_c + prize_c + 1000 * n_f + 25 * n_t + 50 * n_m + 20 * n_r;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 2, 'from_time', t_c,
    'prizes', prize_c + 1000 * n_f, 'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'rewards', n_f, 'pays', sh_prizes(),
    'got', jsonb_build_object(
      'name', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'name'),
      'visit', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || dd),
      'game', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'game:' || dd)));
end;
$$;

-- the balance alone, for the replies that pay
create or replace function public.sh_crowns(p_visitor text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((sh_wallet(p_visitor)->>'balance')::integer, 0);
$$;

-- what a prize call answers: the XP paid (0 when it was paid before), the crowns it paid (the same) and the balance
create or replace function public.sh_prize_reply(p_visitor text, p_src text, p_paid integer, p_more jsonb default '{}'::jsonb)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ok', true, 'src', p_src, 'xp', coalesce(p_paid, 0), 'won', coalesce(p_paid, 0), 'repeat', coalesce(p_paid, 0) = 0,
    'crowns', sh_crowns(p_visitor)) || coalesce(p_more, '{}'::jsonb);
$$;

-- ====================================================================== 2. medals pay more
-- a hub mastery medal (v54, v63): the share of the hub's counted questions whose latest answer is right: Bronze 50%, Silver
-- 75%, Gold 90%, Crown 100%. Each new medal pays +250/+500/+750/+1,000 (v64; was 100 to 500), not boosted, with as many crowns
-- (sh_is_prize), and starts 24 hours of double XP; a shop boost's unused time moves after them (sh_boost_bump, v63). A medal
-- reached before the switch pays nothing (no back pay).
create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[250, 500, 750, 1000]; c timestamptz; paid int; total int := 0; newest int := 0; b_end timestamptz;
begin
  select count(*) into bank from question_keys k where k.hub = p_hub and k.is_current and not k.retired and k.counted;
  if bank = 0 then return null; end if;
  select count(*) filter (where l.correct) into got from (
    select distinct on (a.qid) a.qid, a.correct from personal_answers a
    where a.visitor_id = p_visitor and a.hub = p_hub order by a.qid, a.answered_at desc, a.id desc
  ) l join question_keys k on k.hub = p_hub and k.qid = l.qid and k.is_current and not k.retired and k.counted;
  lvl := case when got >= bank then 4 when got * 10 >= bank * 9 then 3 when got * 4 >= bank * 3 then 2 when got * 2 >= bank then 1 else 0 end;
  for i in 1..lvl loop
    c := null;
    select a.created_at into c from achievements a where a.visitor_id = p_visitor and a.kind = kinds[i] and a.hub = p_hub;
    if c is not null and c < sh_v2_at() then continue; end if;
    if c is null then
      insert into achievements (visitor_id, kind, hub, created_at) values (p_visitor, kinds[i], p_hub, p_at) on conflict do nothing;
    end if;
    paid := sh_award(p_visitor, 'medal:' || p_hub || ':' || i, 'medal', p_hub, pays[i], 1, p_at);
    if paid > 0 then
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'mb:' || p_hub || ':' || i, 'medal', 2, p_at, p_at + interval '24 hours')
        on conflict (visitor_id, key) do nothing;
      total := total + paid; newest := i;
    end if;
  end loop;
  if newest = 0 then return null; end if;
  b_end := sh_boost_bump(p_visitor, p_at);   -- v63: bought double XP moves after the medal's 24 hours
  return jsonb_build_object('kind', kinds[newest], 'level', newest, 'xp', total,
    'boost_until', greatest(p_at + interval '24 hours', b_end));
end;
$$;

-- ====================================================================== 3. the run of right answers, the streak of days
-- The server's own run: answers it grades from a key (one choice, select all, put in order) and that pass the speed limit.
-- A right one that pays XP adds one, a wrong one ends it; a self-graded card, a question with no key, a too-fast answer and
-- a question's 4th right answer of the day (it pays nothing) do neither, so one easy question can't be answered 100 times.
-- run_id is the answer that started the run (a run's prizes are keyed on it); since_nuke counts from the last launch; ready
-- is the run (and its count) that reached 100 since then and hasn't been launched yet.
create table if not exists public.xp_runs (
  visitor_id text primary key,
  n integer not null default 0,
  run_id bigint,
  since_nuke integer not null default 0,
  ready text,
  updated_at timestamptz not null default now()
);
alter table public.xp_runs enable row level security;

-- the class's records: 'run' is the longest run of right answers ever, started from correct_streaks' best when this ran
create table if not exists public.game_records (
  kind text primary key,
  value integer not null,
  visitor_id text,
  run text,
  at timestamptz not null default now()
);
alter table public.game_records enable row level security;
insert into public.game_records (kind, value)
  select 'run', coalesce(max(best_streak), 0) from public.correct_streaks
  on conflict (kind) do nothing;

-- one graded answer's step of the run, under the caller's lock; returns the prizes it paid ([{src, xp}])
create or replace function public.sh_run_step(p_visitor text, p_hub text, p_aid bigint, p_correct boolean, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.xp_runs; v_n int; rid bigint; sn int; out jsonb := '[]'::jsonb; paid int; i int; rec public.game_records;
  ms int[] := array[10, 25, 50]; pays int[] := array[25, 100, 250];
begin
  select * into r from xp_runs where visitor_id = p_visitor for update;
  if not found then
    insert into xp_runs (visitor_id) values (p_visitor) on conflict (visitor_id) do nothing;
    select * into r from xp_runs where visitor_id = p_visitor for update;
  end if;
  if not p_correct then
    update xp_runs set n = 0, run_id = null, since_nuke = 0, updated_at = p_at where visitor_id = p_visitor;
    return out;
  end if;
  v_n := r.n + 1; rid := coalesce(r.run_id, p_aid); sn := r.since_nuke + 1;
  update xp_runs set n = v_n, run_id = rid, since_nuke = sn,
    ready = case when sn >= 100 and r.ready is null then rid || ':' || v_n else r.ready end, updated_at = p_at
    where visitor_id = p_visitor;
  for i in 1..3 loop
    if v_n = ms[i] then
      paid := sh_award(p_visitor, 'row:' || rid || ':' || v_n, 'row', p_hub, pays[i], 1, p_at);
      if paid > 0 then out := out || jsonb_build_object('src', 'row', 'xp', paid, 'n', v_n); end if;
    end if;
  end loop;
  -- the class's longest run: passing it pays once per run (from 100 on), and the record follows the run up
  if v_n > coalesce((select g.value from game_records g where g.kind = 'run'), 0) then
    select * into rec from game_records where kind = 'run' for update;
    if v_n > rec.value then
      if v_n > 100 and rec.run is distinct from rid::text then
        paid := sh_award(p_visitor, 'alltime:' || rid, 'alltime', p_hub, 20000, 1, p_at);
        if paid > 0 then out := out || jsonb_build_object('src', 'alltime', 'xp', paid, 'n', v_n, 'was', rec.value); end if;
      end if;
      update game_records set value = v_n, visitor_id = p_visitor, run = rid::text, at = p_at where kind = 'run';
    end if;
  end if;
  return out;
end;
$$;

-- a day's first answer: the streak of days studied (xp_days, any answer) reaching 3, 7, 14, 30, 60 or 100 pays once per streak
create or replace function public.sh_streak_step(p_visitor text, p_hub text, p_d date, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k int; i int; paid int; out jsonb := '[]'::jsonb;
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
  return out;
end;
$$;

-- ---------- one answer, checked and paid by the server ----------
-- p_choice: the picked choice's authored index (one-choice questions); p_picks: the ticked indexes (select all) or the
-- order of the authored steps as placed (put in order); p_self: the student's own grade (recall cards, matching);
-- p_v: the question's version as shown; p_ctx: where it was answered (bank, drill, weak, misses, mock, arcade, check,
-- review, case, learn); p_request: a random id per answer, so a retried or replayed call records and pays once; p_session: the
-- mock or arcade game it belongs to (xp_session_start); p_claim: the page's own verdict, used only for a question the
-- server has no key for (recorded for class stats and your progress, never paid). p_at is null except in the tests.
-- v64: as v59, plus the run of right answers (sh_run_step) and the streak of days (sh_streak_step), whose prizes come back
-- in `bonus`, and the crowns after it all (`crowns`).
create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int; dp boolean;
  speed_ok boolean := false; right_ok boolean := false; v_base int := 0; v_mult int := 1; paid int := 0; v_n int; why text; bonus jsonb := '[]'::jsonb;
  medal jsonb; v_resp jsonb; prev record; day_n int; tap boolean := false;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_picks is not null and (cardinality(p_picks) > 20 or exists (select 1 from unnest(p_picks) z where z is null or z not between 0 and 19)))
     or (p_choice is not null and p_choice not between 0 and 19) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  v_ctx := case when p_ctx in ('bank', 'drill', 'weak', 'misses', 'mock', 'arcade', 'check', 'review', 'case', 'learn') then p_ctx else 'other' end;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());

  -- the same answer again (a retry, a reload, a replayed call): what it got the first time, nothing new
  if p_request is not null then
    select x.resp, a.visitor_id into prev from answer_xp x join personal_answers a on a.id = x.answer_id where x.request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;

  -- right or wrong, from the key
  select * into k from sh_key(p_hub, p_qid, p_v);
  -- v64: a retired question that still has its key is graded from it (Sam: "Every right answer should give xp")
  v_kind := case when k.qid is null then 'unknown'
                 when k.retired and k.kind <> 'self' and coalesce(cardinality(k.answer), 0) = 0 then 'retired' else k.kind end;
  if v_kind = 'one' then
    if p_choice is null and coalesce(cardinality(p_picks), 0) <> 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := coalesce(p_choice, p_picks[1]) = k.answer[1];
  elsif v_kind = 'all' then
    if p_picks is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := (select coalesce(array_agg(distinct z order by z), '{}') from unnest(p_picks) z)
               = (select array_agg(distinct z::int order by z::int) from unnest(k.answer) z);
  elsif v_kind = 'order' then
    v_correct := p_picks is not null and p_picks = k.answer::integer[];
  elsif v_kind = 'self' then
    v_correct := coalesce(p_self, p_claim, false);
  else
    v_correct := coalesce(p_claim, false);
  end if;

  -- the mock or arcade game it belongs to: this visitor's, this hub's, started within 6 hours, not finished long ago
  if p_session is not null then
    select * into s from xp_sessions where id = p_session and visitor_id = p_visitor and hub = p_hub
      and started_at <= v_at and started_at > v_at - interval '6 hours'
      and (finished_at is null or finished_at > v_at - interval '10 minutes');
    if found then
      s_ok := true;
      select count(*), coalesce(bool_or(a.qid = p_qid), false) into s_n, s_dup
        from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = p_session;
    end if;
  end if;

  -- record it as the four calls a page makes today do: class stats, the class's picks, the right-in-a-row streak, your answers
  perform record_answer(p_hub, p_qid, v_correct);
  if p_choice is not null then perform record_choice(p_hub, p_qid, p_choice);
  elsif p_picks is not null and v_kind <> 'order' then
    if cardinality(p_picks) = 1 and v_kind <> 'all' then perform record_choice(p_hub, p_qid, p_picks[1]);
    else perform record_choices(p_hub, p_qid, p_picks); end if;
  end if;
  perform record_correct_streak(p_visitor, v_correct);
  perform set_config('sh.xp_v2', 'on', true);
  insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values (p_visitor, p_hub, p_qid, v_correct, v_at)
    returning id into aid;
  perform set_config('sh.xp_v2', 'off', true);
  insert into answer_xp (answer_id, request_id, session_id, ctx, kind)
    values (aid, p_request, case when s_ok then p_session end, v_ctx, v_kind);
  dd := (v_at at time zone 'America/Chicago')::date;

  -- the guardrails: no key, no XP; then the speed limit
  if v_kind in ('one', 'all', 'order', 'self') then
    if s_ok and s.kind = 'mock' then
      speed_ok := not s_dup and s_n + 1 <= 300 and v_at - s.started_at >= (s_n + 1) * interval '2 seconds';
    else
      select max(a.answered_at) into prev_t from personal_answers a where a.visitor_id = p_visitor and a.id <> aid and a.answered_at <= v_at;
      select count(*) into n60 from personal_answers a
        left join answer_xp x on x.answer_id = a.id left join xp_sessions ss on ss.id = x.session_id
        where a.visitor_id = p_visitor and a.answered_at >= v_at - interval '60 seconds' and a.answered_at <= v_at
          and coalesce(ss.kind, '') <> 'mock';
      speed_ok := (prev_t is null or v_at - prev_t >= interval '2 seconds') and n60 <= 30;
    end if;
    -- v64 (Sam, 2026-11-17: "Every right answer should give xp"): a right answer always pays, however fast and however
    -- often that day; only the same question twice in one mock (one answer sent twice) doesn't. The speed limit and the
    -- three a day still hold for misses, and for the runs of right answers in a row (the nuke's 100 among them).
    -- a double tap: the same question again within 2 seconds of answering it is one answer sent twice
    select a.hub = p_hub and a.qid = p_qid and v_at - a.answered_at < interval '2 seconds' into tap
      from personal_answers a where a.visitor_id = p_visitor and a.id <> aid and a.answered_at <= v_at
      order by a.answered_at desc, a.id desc limit 1;
    right_ok := v_correct and not coalesce(tap, false) and not (s_ok and s.kind = 'mock' and s_dup);
    if not speed_ok and not right_ok then why := 'fast'; end if;
  else
    why := v_kind;
  end if;

  select count(*) filter (where a.correct = v_correct), count(*), count(*) filter (where a.correct)
    into rn_same, rn_all, v_n
    from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
      and (a.answered_at at time zone 'America/Chicago')::date = dd;
  if speed_ok or right_ok then
    if v_correct then select count(*) into rn_ever from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid and a.correct; end if;
    v_base := case when right_ok then case when v_kind = 'self' or rn_ever > 1 then 2 else 10 end
                   when v_kind = 'self' then case when rn_all <= 3 then 2 else 0 end
                   else case when rn_same <= 3 then 1 else 0 end end;
    if v_base = 0 then why := 'repeat'; end if;
    v_mult := sh_xp_mult(p_visitor, v_at);
    paid := sh_award(p_visitor, 'a:' || aid, 'answer', p_hub, v_base, v_mult, v_at);
    -- the day's 20th answer
    select n into pos_day from xp_days where visitor_id = p_visitor and d = dd;
    if coalesce(pos_day, 0) >= 20 then
      v_n := sh_award(p_visitor, 'g20:' || dd, 'goal20', p_hub, 30, v_mult, v_at);
      if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'goal20', 'xp', v_n); end if;
    end if;
    -- a question missed the last time you answered it before today, right today
    if v_correct and v_kind <> 'self' then
      select a.correct into dp from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date < dd order by a.answered_at desc, a.id desc limit 1;
      if found and not dp then
        v_n := sh_award(p_visitor, 'fix:' || p_hub || ':' || p_qid, 'fix', p_hub, 5, v_mult, v_at);
        if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'fix', 'xp', v_n); end if;
      end if;
    end if;
    -- v64: the run of right answers in a row (graded from a key), with its prizes. Only within the speed limit and a
    -- question's first three right answers of the day: a 4th, or one under 2 seconds, pays but neither adds nor breaks it
    if speed_ok and v_kind in ('one', 'all', 'order') and (rn_same <= 3 or not v_correct) then
      bonus := bonus || sh_run_step(p_visitor, p_hub, aid, v_correct, v_at);
    end if;
  end if;
  -- v64: the day's first answer moves the streak of days studied
  select n into day_n from xp_days where visitor_id = p_visitor and d = dd;
  if coalesce(day_n, 0) = 1 then bonus := bonus || sh_streak_step(p_visitor, p_hub, dd, v_at); end if;
  if v_kind in ('one', 'all', 'order', 'self') then medal := sh_medal_check(p_visitor, p_hub, v_at); end if;

  v_resp := jsonb_build_object('ok', true, 'correct', v_correct, 'kind', v_kind, 'xp', paid, 'base', v_base, 'mult', v_mult,
    'first', v_correct and rn_ever = 1 and paid > 0, 'why', why, 'bonus', bonus, 'medal', medal,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor),
    'crowns', sh_crowns(p_visitor));
  update answer_xp set resp = v_resp where answer_id = aid;
  return v_resp;
end;
$$;

-- ====================================================================== 4. the tactical nuke
-- the launch: logged as before (record_nuke_launch, for the admin page), and 10,000 XP and crowns when the run reached 100
-- right since the last launch (the page shows the nuke at its own 100 in a row; the server counts graded answers only)
create or replace function public.sh_launch_nuke(p_at timestamptz, p_visitor text, p_hub text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); rdy text; paid int := 0;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform record_nuke_launch(p_hub, p_visitor, left(coalesce(p_name, ''), 40));
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select ready into rdy from xp_runs where visitor_id = p_visitor for update;
  if rdy is null then return sh_prize_reply(p_visitor, 'nuke', 0, jsonb_build_object('why', 'run')); end if;
  paid := sh_award(p_visitor, 'nuke:' || rdy, 'nuke', p_hub, 10000, 1, v_at);
  update xp_runs set ready = null, since_nuke = 0, updated_at = v_at where visitor_id = p_visitor;
  return sh_prize_reply(p_visitor, 'nuke', paid);
end;
$$;
create or replace function public.launch_nuke_v2(p_visitor text, p_hub text, p_name text default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_launch_nuke(null, p_visitor, p_hub, p_name);
$$;

-- ====================================================================== 5. the daily ring
-- your daily goal (10 to 50 questions, the page's setting) reached in a hub: today's answers there and today's paying
-- flashcard ratings there. 5 XP and crowns a question of the goal, once per hub per Central day.
create or replace function public.sh_claim_ring(p_at timestamptz, p_visitor text, p_hub text, p_goal integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); dd date; t0 timestamptz; n int; paid int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_goal is null or p_goal not in (10, 20, 30, 40, 50) then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  dd := (v_at at time zone 'America/Chicago')::date;
  t0 := dd::timestamp at time zone 'America/Chicago';
  select count(*) into n from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.answered_at >= t0 and a.answered_at <= v_at;
  n := n + (select count(*) from xp_awards w where w.visitor_id = p_visitor and w.src = 'card' and w.hub = p_hub and w.d = dd);
  if n < p_goal then return sh_prize_reply(p_visitor, 'ring', 0, jsonb_build_object('why', 'short', 'n', n)); end if;
  paid := sh_award(p_visitor, 'ring:' || p_hub || ':' || dd, 'ring', p_hub, 5 * p_goal, 1, v_at);
  return sh_prize_reply(p_visitor, 'ring', paid, jsonb_build_object('goal', p_goal));
end;
$$;
create or replace function public.claim_ring_v2(p_visitor text, p_hub text, p_goal integer)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_claim_ring(null, p_visitor, p_hub, p_goal);
$$;

-- ====================================================================== 6. a Plaque Boss
-- A boss lives for a 2-hour window of a Central day in a hub (widget/eggs.js: its id is "<hub>|<day>|<window 0-11>"). Defeated,
-- each page that hit it asks for its share: 500 XP and crowns for the whole boss, by the HP you took off it (p_hp, 30 to 60:
-- the bosses have 34 to 50), never more than your right answers in that hub since the window opened (a critical hit every
-- 5th), and only while the window is open (15 minutes' grace). Once per boss.
create or replace function public.sh_claim_boss(p_at timestamptz, p_visitor text, p_hub text, p_boss text, p_damage integer, p_hp integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); d date; w int; t0 timestamptz; r int; dmg int; pay int; paid int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_boss is null or p_boss !~ '^\d{4}-\d{2}-\d{2}\|([0-9]|1[01])$' or p_hp is null or p_hp not between 30 and 60
     or p_damage is null or p_damage < 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  begin d := split_part(p_boss, '|', 1)::date; exception when others then return jsonb_build_object('ok', false, 'error', 'bad'); end;
  w := split_part(p_boss, '|', 2)::int;
  t0 := (d::timestamp + make_interval(hours => 2 * w)) at time zone 'America/Chicago';
  if v_at < t0 or v_at > t0 + interval '2 hours 15 minutes' then return jsonb_build_object('ok', false, 'error', 'late'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select count(*) into r from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.correct
    and a.answered_at >= t0 and a.answered_at <= v_at;
  dmg := least(p_damage, p_hp, r + r / 5);
  if dmg <= 0 then return sh_prize_reply(p_visitor, 'boss', 0, jsonb_build_object('why', 'hits')); end if;
  pay := greatest(1, round(500.0 * dmg / p_hp))::int;
  paid := sh_award(p_visitor, 'boss:' || p_hub || ':' || p_boss, 'boss', p_hub, pay, 1, v_at);
  return sh_prize_reply(p_visitor, 'boss', paid, jsonb_build_object('damage', dmg, 'of', p_hp));
end;
$$;
create or replace function public.claim_boss_v2(p_visitor text, p_hub text, p_boss text, p_damage integer, p_hp integer)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_claim_boss(null, p_visitor, p_hub, p_boss, p_damage, p_hp);
$$;

-- ====================================================================== 7. a lecture's notes, read
-- The page asks when a lecture opens (notes_start_v2: a read id, or null when this lecture already paid) and when the reader
-- reaches its end (notes_done_v2), at least 60 seconds later and within 6 hours. 50 XP and crowns, once per lecture. The
-- reads are kept two days, for this only.
create table if not exists public.notes_reads (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  hub text not null,
  lec text not null,
  started_at timestamptz not null,
  done_at timestamptz
);
create index if not exists notes_reads_visitor on public.notes_reads (visitor_id, started_at);
alter table public.notes_reads enable row level security;

create or replace function public.sh_notes_start(p_at timestamptz, p_visitor text, p_hub text, p_lec text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); rid uuid;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_lec is null or p_lec !~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,39}$' then return null; end if;
  if exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'notes:' || p_hub || ':' || p_lec) then return null; end if;
  delete from notes_reads where visitor_id = p_visitor and started_at < v_at - interval '2 days';
  if (select count(*) from notes_reads where visitor_id = p_visitor and started_at > v_at - interval '1 day') >= 300 then return null; end if;
  insert into notes_reads (visitor_id, hub, lec, started_at) values (p_visitor, p_hub, p_lec, v_at) returning id into rid;
  return rid;
end;
$$;
create or replace function public.sh_notes_done(p_at timestamptz, p_visitor text, p_read uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); r public.notes_reads; paid int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_read is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select * into r from notes_reads where id = p_read and visitor_id = p_visitor for update;
  if not found or r.started_at > v_at or r.started_at < v_at - interval '6 hours' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if v_at - r.started_at < interval '60 seconds' then return sh_prize_reply(p_visitor, 'notes', 0, jsonb_build_object('why', 'fast')); end if;
  update notes_reads set done_at = coalesce(done_at, v_at) where id = r.id;
  paid := sh_award(p_visitor, 'notes:' || r.hub || ':' || r.lec, 'notes', r.hub, 50, 1, v_at);
  return sh_prize_reply(p_visitor, 'notes', paid, jsonb_build_object('lec', r.lec));
end;
$$;
create or replace function public.notes_start_v2(p_visitor text, p_hub text, p_lec text)
returns uuid language sql volatile security definer set search_path = public as $$
  select sh_notes_start(null, p_visitor, p_hub, p_lec);
$$;
create or replace function public.notes_done_v2(p_visitor text, p_read uuid)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_notes_done(null, p_visitor, p_read);
$$;

-- ====================================================================== 8. a name, a visit, trophies
-- a leaderboard name: 500 XP and crowns the first time one is chosen (not the made-up default name), once per person
create or replace function public.sh_name_prize(p_visitor text, p_name text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 or p_name is null or length(trim(p_name)) = 0 then return 0; end if;
  if left(trim(p_name), 24) = anon_name(p_visitor) then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  return sh_award(p_visitor, 'name', 'name', '', 500, 1, clock_timestamp());
end;
$$;
create or replace function public.set_display_name(p_visitor text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_name is null or length(trim(p_name)) = 0 then return; end if;
  insert into visitor_names (visitor_id, display_name, updated_at)
  values (p_visitor, left(trim(p_name), 24), now())
  on conflict (visitor_id) do update set display_name = excluded.display_name, updated_at = now();
  perform sh_name_prize(p_visitor, p_name);   -- v64
end;
$$;
create or replace function public.set_display_name_v2(p_visitor text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare paid int;
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 or p_name is null or length(trim(p_name)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  insert into visitor_names (visitor_id, display_name, updated_at)
  values (p_visitor, left(trim(p_name), 24), now())
  on conflict (visitor_id) do update set display_name = excluded.display_name, updated_at = now();
  paid := sh_name_prize(p_visitor, p_name);
  return sh_prize_reply(p_visitor, 'name', paid, jsonb_build_object('name', left(trim(p_name), 24)));
end;
$$;

-- visiting someone else's place (a key from a board row or Visit someone random): 50 XP and crowns once per Central day.
-- Never your own place or a linked device's.
create or replace function public.sh_claim_visit(p_at timestamptz, p_visitor text, p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); v text; me text; paid int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_key is null or p_key !~ '^[0-9a-f]{24}$' then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || (v_at at time zone 'America/Chicago')::date) then
    return sh_prize_reply(p_visitor, 'visit', 0); end if;
  select z.visitor_id into v from (
    select x.visitor_id from xp_visitors x
    union select c.visitor_id from correct_streaks c
    union select a.visitor_id from arcade_scores a
  ) z where sh_visit_key(z.visitor_id) = p_key limit 1;
  if v is null then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  if v = p_visitor or v = me or exists (select 1 from visitor_links l where l.primary_id = me and l.alias_id = v) then
    return sh_prize_reply(p_visitor, 'visit', 0, jsonb_build_object('why', 'self')); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  paid := sh_award(p_visitor, 'visit:' || (v_at at time zone 'America/Chicago')::date, 'visit', '', 50, 1, v_at);
  return sh_prize_reply(p_visitor, 'visit', paid);
end;
$$;
create or replace function public.claim_visit_v2(p_visitor text, p_key text)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_claim_visit(null, p_visitor, p_key);
$$;

-- trophies: 200 XP and crowns for each one won from now on (on top of its 25 crowns since the switch). prize_seen holds the
-- trophies each visitor had when this ran, which pay nothing (no back pay), and stays under the id it was written for (a
-- linked device's are read through visitor_links).
create table if not exists public.prize_seen (
  visitor_id text not null,
  key text not null,
  primary key (visitor_id, key)
);
alter table public.prize_seen enable row level security;
insert into public.prize_seen (visitor_id, key)
  select v.visitor_id, 'trophy:' || z.k from public.xp_visitors v
  cross join lateral (
    select distinct split_part(b, ':', 1) as k
    from jsonb_array_elements_text(coalesce(public.get_rank_profile_v2(v.visitor_id)->'badges', '[]'::jsonb)) b
    where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt'
  ) z
  on conflict do nothing;

-- pays every trophy in the visitor's profile not paid, not held at the switch and not held when v64 ran; the page calls it
-- when its profile shows a trophy it hasn't had paid (widget/ranks.js). `have` lists every trophy now settled.
create or replace function public.claim_trophies_v2(p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare kinds text[]; was text[]; seen text[]; k text; paid int; total int := 0; won jsonb := '[]'::jsonb;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  kinds := array(select distinct split_part(b, ':', 1)
    from jsonb_array_elements_text(coalesce(get_rank_profile_v2(p_visitor)->'badges', '[]'::jsonb)) b
    where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  was := array(select distinct split_part(b, ':', 1) from game_baseline g cross join unnest(coalesce(g.badges, '{}')) b where g.visitor_id = p_visitor);
  seen := array(select substr(s.key, 8) from prize_seen s where s.key like 'trophy:%' and (s.visitor_id = p_visitor
    or s.visitor_id in (select l.alias_id from visitor_links l where l.primary_id = p_visitor)));
  foreach k in array kinds loop
    if k = any(was) or k = any(seen) then continue; end if;
    paid := sh_award(p_visitor, 'trophy:' || k, 'trophy', '', 200, 1, clock_timestamp());
    if paid > 0 then total := total + paid; won := won || to_jsonb(k); end if;
  end loop;
  return sh_prize_reply(p_visitor, 'trophy', total, jsonb_build_object('won', won, 'have', to_jsonb(kinds)));
end;
$$;

-- ====================================================================== 9. games: the day's first, and records
-- a mock pays +50 once per hub per day when 10 or more of its answers were recorded, and saves its score (record_mock_score)
-- from the server's own count; a game pays +50 the first time that game is finished each day, at least 20 seconds after
-- it started, and posts its score (submit_arcade_score, with its own checks). Both are boosted. v64: a game finished (20
-- seconds or more) is also the day's first game (100 XP and crowns, once a day), and its score, once posted, can beat your
-- own best in that game (50) and the hub's top score in it (250), each once per game a day. Every reply has the crowns.
create or replace function public.sh_session_finish(p_at timestamptz, p_visitor text, p_session uuid, p_score integer, p_total integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; s record; n int := 0; nc int := 0; paid int := 0; v_mult int; dd date; v_game int := 0; v_pb int := 0; v_top int := 0;
  my_best int; best int; n_before int; n_after int; long_ok boolean;
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
    return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult, 'answers', n, 'correct', nc, 'crowns', sh_crowns(p_visitor));
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

-- ---------- Timmy Time (v54): as before, with the crowns in the reply (finishing an episode now pays its 100 in crowns too)
create or replace function public.sh_pod_minute(p_at timestamptz, p_visitor text, p_hub text, p_ep text, p_minute integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; e record; mins int; last_at timestamptz; v_mult int; paid int := 0; done int := 0; heard int;
  pre text := 'pod:' || coalesce(p_hub, '') || ':' || coalesce(p_ep, '') || ':';
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_ep is null or p_minute is null then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select * into e from podcast_episodes where hub = p_hub and episode = p_ep;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  mins := ceil(e.seconds / 60.0)::int;
  if p_minute < 0 or p_minute >= mins then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  if exists (select 1 from xp_awards where visitor_id = p_visitor and key = pre || p_minute) then
    return jsonb_build_object('ok', true, 'xp', 0, 'repeat', true); end if;
  select max(at) into last_at from xp_awards where visitor_id = p_visitor and src = 'pod-min';
  if last_at is not null and v_at - last_at < interval '25 seconds' then return jsonb_build_object('ok', true, 'xp', 0, 'why', 'fast'); end if;
  v_mult := sh_xp_mult(p_visitor, v_at);
  paid := sh_award(p_visitor, pre || p_minute, 'pod-min', p_hub, 10, v_mult, v_at);
  select count(*) into heard from xp_awards where visitor_id = p_visitor and src = 'pod-min' and left(key, length(pre)) = pre;
  if heard >= ceil(mins * 0.9) then done := sh_award(p_visitor, 'pod-done:' || p_hub || ':' || p_ep, 'pod-done', p_hub, 100, v_mult, v_at); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'done', done, 'mult', v_mult, 'heard', heard, 'of', mins, 'crowns', sh_crowns(p_visitor));
end;
$$;

-- ---------- every right answer pays (Sam, 2026-11-17: "Every right answer should give xp"), in the replay too ----------
-- sh_xp_replay is what Link my devices rebuilds a visitor's answers from (sh_xp_rebuild), so it pays exactly what
-- sh_answer pays: a right answer graded from its key always pays (10 the first time ever, 2 after; a self-graded card 2),
-- except a double tap (the same question again within 2 seconds) and the same question twice in one mock; misses keep the
-- speed limit and their three a day. As v54's otherwise.
create or replace function public.sh_xp_replay(p_ids text[])
returns table(visitor_id text, key text, src text, hub text, base integer, xp integer, at timestamptz, d date)
language sql stable security definer set search_path = public as $$
  with pa as (
    select a.id, a.visitor_id, a.hub, a.qid, a.correct, a.answered_at as t,
      (a.answered_at at time zone 'America/Chicago')::date as d,
      x.answer_id is not null as v2, x.kind, x.session_id, s.kind as s_kind, s.started_at as s_start
    from personal_answers a
    left join answer_xp x on x.answer_id = a.id
    left join xp_sessions s on s.id = x.session_id
    where a.visitor_id = any(p_ids)
  ), w as (
    select pa.*,
      lag(pa.t) over (partition by pa.visitor_id order by pa.t, pa.id) as prev_t,
      lag(pa.hub || '|' || pa.qid) over (partition by pa.visitor_id order by pa.t, pa.id) as prev_hq,
      count(*) filter (where coalesce(pa.s_kind, '') <> 'mock')
        over (partition by pa.visitor_id order by pa.t range between interval '60 seconds' preceding and current row) as n60,
      row_number() over (partition by pa.session_id order by pa.t, pa.id) as s_rank,
      row_number() over (partition by pa.session_id, pa.qid order by pa.t, pa.id) as s_qrank,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d, pa.correct order by pa.t, pa.id) as rn_same,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d order by pa.t, pa.id) as rn_all,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.correct order by pa.t, pa.id) as rn_ever,
      row_number() over (partition by pa.visitor_id, pa.d order by pa.t, pa.id) as pos_day,
      lag(pa.correct) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_c,
      lag(pa.d) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_d
    from pa
  ), e0 as (
    select w.*,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and case
        when w.s_kind = 'mock' then w.s_qrank = 1 and w.s_rank <= 300 and w.t - w.s_start >= w.s_rank * interval '2 seconds'
        else (w.prev_t is null or w.t - w.prev_t >= interval '2 seconds') and w.n60 <= 30 end, false) as g_ok,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and w.correct
        and not coalesce(w.prev_hq = w.hub || '|' || w.qid and w.t - w.prev_t < interval '2 seconds', false)
        and (w.s_kind is distinct from 'mock' or w.s_qrank = 1), false) as r_ok,
      max(case when w.prev_d is distinct from w.d then case when w.prev_c then 1 when not w.prev_c then 0 end end)
        over (partition by w.visitor_id, w.hub, w.qid, w.d) as day_prev
    from w
  ), e as (
    select e0.*, e0.g_ok or e0.r_ok as ok from e0
  ), b as (
    select e.*,
      case when e.r_ok then case when e.kind = 'self' or e.rn_ever > 1 then 2 else 10 end
        when not e.g_ok then 0
        when e.kind = 'self' then case when e.rn_all <= 3 then 2 else 0 end
        else case when e.rn_same <= 3 then 1 else 0 end end as base_xp,
      sh_xp_mult(e.visitor_id, e.t) as mult
    from e
  )
  select b.visitor_id, 'a:' || b.id, 'answer'::text, b.hub, b.base_xp, b.base_xp * b.mult, b.t, b.d from b where b.base_xp > 0
  union all
  select g.visitor_id, 'g20:' || g.d, 'goal20'::text, g.hub, 30, 30 * g.mult, g.t, g.d from (
    select distinct on (b.visitor_id, b.d) b.visitor_id, b.d, b.hub, b.mult, b.t from b
    where b.ok and b.pos_day >= 20 order by b.visitor_id, b.d, b.t, b.id) g
  union all
  select f.visitor_id, 'fix:' || f.hub || ':' || f.qid, 'fix'::text, f.hub, 5, 5 * f.mult, f.t, f.d from (
    select distinct on (b.visitor_id, b.hub, b.qid) b.visitor_id, b.hub, b.qid, b.mult, b.t, b.d from b
    where b.ok and b.correct and b.kind <> 'self' and b.day_prev = 0 order by b.visitor_id, b.hub, b.qid, b.t, b.id) f;
$$;

-- the right answers given since the release that paid nothing (under 2 seconds after the one before, or a question's
-- 4th right answer of a day) are paid now, by rebuilding every visitor with a v2 answer from the replay above: the same
-- thing Link my devices does, so the two never disagree. (A retired question's answers from before stay as they were:
-- they were recorded without a key to grade them.)
select public.sh_xp_rebuild(array(select distinct a.visitor_id from personal_answers a join answer_xp x on x.answer_id = a.id));

-- ====================================================================== privileges
revoke all on table public.xp_runs, public.game_records, public.notes_reads, public.prize_seen from public, anon, authenticated;
revoke all on function public.sh_is_prize(text) from public, anon, authenticated;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;
revoke all on function public.sh_time_crowns(text) from public, anon, authenticated;
revoke all on function public.sh_crowns(text) from public, anon, authenticated;
revoke all on function public.sh_prize_reply(text, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.sh_medal_check(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_run_step(text, text, bigint, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_streak_step(text, text, date, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
revoke all on function public.sh_launch_nuke(timestamptz, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_claim_ring(timestamptz, text, text, integer) from public, anon, authenticated;
revoke all on function public.sh_claim_boss(timestamptz, text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.sh_notes_start(timestamptz, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_notes_done(timestamptz, text, uuid) from public, anon, authenticated;
revoke all on function public.sh_name_prize(text, text) from public, anon, authenticated;
revoke all on function public.sh_claim_visit(timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.sh_session_finish(timestamptz, text, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.sh_pod_minute(timestamptz, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.sh_prizes() from public;
grant execute on function public.sh_prizes() to anon, authenticated;
revoke all on function public.launch_nuke_v2(text, text, text) from public;
revoke all on function public.claim_ring_v2(text, text, integer) from public;
revoke all on function public.claim_boss_v2(text, text, text, integer, integer) from public;
revoke all on function public.notes_start_v2(text, text, text) from public;
revoke all on function public.notes_done_v2(text, uuid) from public;
revoke all on function public.set_display_name_v2(text, text) from public;
revoke all on function public.claim_visit_v2(text, text) from public;
revoke all on function public.claim_trophies_v2(text) from public;
grant execute on function public.launch_nuke_v2(text, text, text) to anon, authenticated;
grant execute on function public.claim_ring_v2(text, text, integer) to anon, authenticated;
grant execute on function public.claim_boss_v2(text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.notes_start_v2(text, text, text) to anon, authenticated;
grant execute on function public.notes_done_v2(text, uuid) to anon, authenticated;
grant execute on function public.set_display_name_v2(text, text) to anon, authenticated;
grant execute on function public.claim_visit_v2(text, text) to anon, authenticated;
grant execute on function public.claim_trophies_v2(text) to anon, authenticated;
grant execute on function public.set_display_name(text, text) to anon, authenticated;
