-- v76 (2026-11-19): the small helper functions every answer calls are PL/pgSQL, so the database plans them once a
-- connection instead of on every call. The optimization pass, idea 1 (vault/tasks/2026-11-18-database-optimization-pass.md).
--
-- What was measured (a throwaway copy of supabase/schema.sql with a made-up class of 200: 188,000 answers, 215,000 awards;
-- pg_stat_statements with track = all, 400-600 answers each by a heavy, a middling and a light student):
--   - 60-66% of an answer save was the crown balance in its reply (sh_crowns -> sh_wallet): 4.5 of 6.8 ms for the student
--     with 8,000 answers, 3.6 of 6.1 ms at 3,300 answers, 3.0 of 4.9 ms at 500.
--   - Most of that was not reading rows. A SQL-language function that can't be inlined (security definer, or with its own
--     search_path: all of ours) is parsed and planned again on every call; a PL/pgSQL function keeps its plans for the
--     life of the connection, and PostgREST's connections live for hours. sh_wallet asks get_rank_profile_v2 for the
--     badges and sh_rank for the rank twice more, which between them called sh_rank three times, sh_tier, sh_step and
--     sh_step_floor (each calling sh_tier_floor), sh_visitor_xp and sh_boost_json: about 2.1 ms of planning an answer,
--     the same for every student. On the live shared CPU planning is the dearest part (2026-11-18: 442 ms to plan a
--     one-row query while the CPU was starved), and the statement timeouts of the evening after v72 landed "during
--     startup" of exactly these functions (sh_tier, sh_time_crowns, sh_rank).
--   - After (with the two changes at the end of this file): 4.4 ms for the heavy student's answer (6.9 before), 3.6 ms for
--     the middling one (5.7), 2.4 ms for the light one (4.8); a flashcard rating 0.90 ms (1.16); a question-health batch
--     of 10 items 0.75 ms (1.90); get_rank_profile_v2 0.43 ms (1.4); get_hub_mastery 3.4 ms for the heavy student (7.9);
--     the page bootstrap 31, 18 and 12 ms (40, 21 and 16). What is left of the heavy student's answer is mostly the sum
--     of their 9,000 awards (1.7 ms), which needs a table of running totals: the next step, written in the task note.
--
-- What changes: the language of 18 functions, and two functions' way of counting (at the end, each explained there).
-- Each of the 18 bodies below is the SQL one it replaces (from the live definitions, which are supabase/schema.sql's newest
-- copies), as a PL/pgSQL function with the same arguments, return type, volatility, security and search_path. create or
-- replace keeps each function's owner and grants. sh_rank's count over the ladder is a loop over the same 63 steps;
-- sh_visitor_xp reads the one visitor by the primary key when it is given one (the same rows).
-- Checked on the copy: every function's result compared with the SQL one's over its whole input (every 7th XP from -50 to
-- 400,000, every tier's edges and null; every key and version; every made-up visitor's XP, boosts, time crowns, wallet,
-- rank profile and hub mastery), then 2,400 answers and 343 card ratings by six students (three new ones winning and losing
-- medals in a bank of 23, boosts running, double taps, replays, select-all, order and self-graded items) replayed on two
-- copies, one with this file: identical replies, and identical rows after in every table an answer or a rating writes.
-- And tools/release/xp.js, rls.js, admin-ops.js, retention.js and timmy.js.
--
-- No table, index, grant or data changes: safe to apply at any hour (each statement takes a moment).
-- Not in this migration: the awards summed once instead of on every answer (it needs a table), and the pings sent
-- together (migration_v77). The optimization pass's note says where each idea stands.

-- ------------------------------------------------------------------ the rank ladders (pure functions of an XP total)

create or replace function public.sh_tier(p_xp integer) returns integer
language plpgsql immutable set search_path = public as $$
begin
  return case when p_xp >= 50000 then 6 when p_xp >= 25000 then 5 when p_xp >= 12000 then 4
              when p_xp >= 5000 then 3 when p_xp >= 1500 then 2 when p_xp >= 300 then 1 else 0 end;
end;
$$;

create or replace function public.sh_tier_floor(p_tier integer) returns integer
language plpgsql immutable set search_path = public as $$
begin
  return (array[0, 300, 1500, 5000, 12000, 25000, 50000, 125000])[least(greatest(p_tier, 0), 7) + 1];
end;
$$;

create or replace function public.sh_step(p_xp integer) returns integer
language plpgsql immutable set search_path = public as $$
declare t integer := sh_tier(p_xp);
begin
  return t * 3 + least(2, floor((greatest(p_xp, 0) - sh_tier_floor(t))::numeric * 3 / (sh_tier_floor(t + 1) - sh_tier_floor(t)))::int);
end;
$$;

create or replace function public.sh_step_floor(p_step integer) returns integer
language plpgsql immutable set search_path = public as $$
declare t integer := least(greatest(p_step, 0), 20) / 3;
begin
  return sh_tier_floor(t) + ((sh_tier_floor(t + 1) - sh_tier_floor(t)) * (p_step - t * 3)) / 3;
end;
$$;

create or replace function public.sh_rank(p_xp integer)
returns table(journey integer, tier integer, level integer, step integer, gtier integer, step_at integer, next_at integer, tier_at integer)
language plpgsql immutable set search_path = public as $$
declare
  a constant integer[] := '{0,100,200,300,700,1100,1500,2666,3833,5000,7333,9666,12000,16333,20666,25000,33333,41666,50000,75000,100000,
    125000,130952,136904,142857,148809,154761,160714,166666,172618,178571,184523,190475,196428,202380,208332,214285,220237,226189,
    232142,238094,244047,250000,255952,261904,267857,273809,279761,285714,291666,297618,303571,309523,315475,321428,327380,333332,
    339285,345237,351189,357142,363094,369047,375000}';
  x constant integer := greatest(coalesce(p_xp, 0), 0);
  st integer := 0; i integer;
begin
  -- how many of the first 63 floors the XP has reached, less one: the step, 0 to 62
  for i in 1..63 loop
    if a[i] <= x then st := st + 1; end if;
  end loop;
  st := least(62, greatest(0, st - 1));
  journey := st / 21; tier := (st % 21) / 3; level := st % 3 + 1; step := st; gtier := st / 3;
  step_at := a[st + 1]; next_at := case when st < 62 then a[st + 2] end; tier_at := a[(st / 3) * 3 + 1];
  return next;
end;
$$;

-- ------------------------------------------------------------------ one-row reads every answer makes

create or replace function public.sh_visitor_xp(p_visitor text default null)
returns table(visitor_id text, xp integer, days integer, answers integer, correct integer)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if p_visitor is null then
    return query select x.visitor_id, x.xp, x.days, x.answers, x.correct from xp_visitors x;
  else
    return query select x.visitor_id, x.xp, x.days, x.answers, x.correct from xp_visitors x where x.visitor_id = p_visitor;
  end if;
end;
$$;

create or replace function public.sh_v2_at()
returns timestamptz language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select v2_at from game_config where id), now());
end;
$$;

create or replace function public.sh_key(p_hub text, p_qid text, p_v text)
returns setof public.question_keys language plpgsql stable security definer set search_path = public as $$
begin
  return query
    select * from question_keys k
    where k.hub = p_hub and k.qid = p_qid and (k.v = coalesce(p_v, '') or k.is_current)
    order by (k.v = coalesce(p_v, '')) desc, k.is_current desc
    limit 1;
end;
$$;

create or replace function public.sh_choice_version(p_hub text, p_qid text)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select k.cv from question_keys k where k.hub = p_hub and k.qid = p_qid and k.is_current and not k.retired limit 1), '');
end;
$$;

create or replace function public.sh_xp_mult(p_visitor text, p_at timestamptz)
returns integer language plpgsql stable security definer set search_path = public as $$
declare m integer;
begin
  select least(2, coalesce(max(b.mult), 1))::integer into m from xp_boosts b
    where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at;
  return m;
end;
$$;

create or replace function public.sh_boost_json(p_visitor text, p_at timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare j jsonb;
begin
  with run as (select b.mult, b.src, b.ends_at from xp_boosts b where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at),
  nxt as (select max(q.ends_at) e from xp_boosts q where q.visitor_id = p_visitor and q.starts_at >= p_at
    and q.starts_at <= (select max(run.ends_at) from run))
  select case when count(*) = 0 then null else jsonb_build_object('mult', least(2, max(r.mult)),
    'until', greatest(max(r.ends_at), (select nxt.e from nxt)), 'src', (array_agg(r.src order by r.ends_at desc))[1]) end
  into j from run r;
  return j;
end;
$$;

-- ------------------------------------------------------------------ the crown balance's parts

create or replace function public.sh_is_prize(p_src text)
returns boolean language plpgsql immutable set search_path = public as $$
begin
  return p_src in ('survey', 'checkin', 'report', 'medal', 'pod-done', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime',
                   'notes', 'trophy', 'visit', 'game', 'record', 'collection');
end;
$$;

create or replace function public.sh_time_crowns(p_visitor text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare c integer;
begin
  select coalesce((sum(least(t.n, 144)) * 100 / 144)::integer, 0) into c
  from (select h.h, sum(h.n) as n from activity_hourly h
        where h.visitor_id = p_visitor and h.hub <> '' and h.hub <> 'zz-test' group by h.h) t;
  return c;
end;
$$;

create or replace function public.sh_crowns(p_visitor text)
returns integer language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((sh_wallet(p_visitor)->>'balance')::integer, 0);
end;
$$;

-- ------------------------------------------------------------------ the two calls a page makes most, and question health's numbers

create or replace function public.record_answer_v2(p_visitor text, p_hub text, p_qid text, p_choice integer default null,
  p_picks integer[] default null, p_self boolean default null, p_v text default null, p_ctx text default null,
  p_request text default null, p_session uuid default null, p_claim boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return sh_answer(null, p_visitor, p_hub, p_qid, p_choice, p_picks, p_self, p_v, p_ctx, p_request, p_session, p_claim);
end;
$$;

create or replace function public.record_card_v2(p_visitor text, p_hub text, p_qid text, p_what text,
  p_ahead boolean default false, p_request text default null, p_seen bigint default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return sh_card(null, p_visitor, p_hub, p_qid, p_what, p_ahead, p_request, p_seen);
end;
$$;

create or replace function public.qh_int(p text, p_lo integer, p_hi integer)
returns integer language plpgsql immutable set search_path = public as $$
begin
  return case when p ~ '^-?\d{1,9}$' and p::bigint between p_lo and p_hi then p::int end;
end;
$$;

-- ------------------------------------------------------------------ the medal check: skip the count when no medal is in reach
-- (the one change here that isn't only a language: sh_medal_check is v72's, with the lines marked "v76")
-- The check counts the hub's questions whose latest answer is right: one index lookup a question (v72), 1.3 to 2 ms for a
-- bank of 800, on about one answer in three. The first medal needs half the bank, and a question whose latest answer is
-- right has been answered right at least once, so while the questions a student has EVER answered right in the hub
-- (xp_seen, which the answer trigger keeps and Link my devices rebuilds) are under half the bank, no medal can be due and
-- the count is skipped. The same medals at the same answers (compared on the copy over every made-up student).

create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[250, 500, 750, 1000]; c timestamptz; paid int; total int := 0; newest int := 0; b_end timestamptz;
begin
  select count(*) into bank from question_keys k where k.hub = p_hub and k.is_current and not k.retired and k.counted;
  if bank = 0 then return null; end if;
  -- v76: under half the bank ever answered right, so under half right now: no medal, nothing to count
  if (select count(*) from xp_seen s where s.visitor_id = p_visitor and s.hub = p_hub and s.correct) * 2 < bank then return null; end if;
  -- v72: the latest answer to each counted question, one index lookup a question (personal_answers_visitor_q, v71), in place
  -- of reading every answer the student ever gave in the hub (thousands for the most active); the same count
  select count(*) filter (where l.correct) into got
    from question_keys k
    cross join lateral (select a.correct from personal_answers a
                        where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = k.qid
                        order by a.answered_at desc, a.id desc limit 1) l
    where k.hub = p_hub and k.is_current and not k.retired and k.counted;
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

-- ------------------------------------------------------------------ a hub's mastery: one lookup a question, not every answer
-- get_hub_mastery is read with the rank on page load and again after every tenth answer (widget/ranks.js). It sorted every
-- answer the student ever gave to keep the latest of each question: 8.9 ms on the copy for the student with 8,000 answers,
-- and four of the evening's statement timeouts live. Now it takes the questions from xp_seen (one row a question and
-- outcome) and looks up each one's latest answer on personal_answers_visitor_q (v71): 3.4 ms, the same rows for every
-- made-up student. (Two answers to one question in the same microsecond: the later id is the latest, as in sh_medal_check;
-- the old sort left that tie to chance.)

create or replace function public.get_hub_mastery(p_visitor text)
returns table(hub text, latest_correct integer, seen integer)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
    select q.hub, count(*) filter (where l.correct)::int, count(*)::int
    from (select s.hub, s.qid from xp_seen s where s.visitor_id = p_visitor group by s.hub, s.qid) q
    cross join lateral (select a.correct from personal_answers a
                        where a.visitor_id = p_visitor and a.hub = q.hub and a.qid = q.qid
                        order by a.answered_at desc, a.id desc limit 1) l
    group by q.hub;
end;
$$;
