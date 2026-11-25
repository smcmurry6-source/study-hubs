-- v103 (2026-11-25): the boards keep people tied on a place in one order, and Link my devices rebuilds once.
-- Two lines of the to-do list (vault/tasks/inbox.md): "The boards order people tied on a place by chance" (2026-11-22, #533's
-- CI) and "Does Link my devices time out for someone with thousands of answers?" (2026-11-22, applying migration_v96).
--
-- 1. The boards. get_rank_board_v2, get_leaderboard_v2, get_correct_streak_stats_v2, get_arcade_leaderboard_v2 and
--    get_fairy_board ended on the place alone (rank, or a count), so people tied on a place came back in whatever order the
--    database read them, which can change between two loads (a delete, a rewrite, a different plan), and where a board stops
--    at a number of rows (the streaks board, the fairy board, the answer-streak records), which of the tied people made the
--    cut could change too. Now each orders a tie by the name the board shows, ignoring case, then by the id (two people with
--    one name), as the Crowns board (get_crowns_board_v2, v99) already did, and a board that stops at a number of rows takes
--    the tied ones in that order. Nothing else about a board changes: the same places, the same people at each place, the
--    same columns. The name is worked out only for the rows that can show (a place within the limit), not for everyone.
--    get_rank_board_v2 is now PL/pgSQL, like its sibling boards (vault/reference/shared-infrastructure.md: a function a page
--    calls often keeps its plans in PL/pgSQL; a SQL one with security definer is planned again on every call).
--    Not changed: get_crowns_board_v2 (already tie-ordered), get_studying_now (by name, at most 50), get_cavity_week (by the
--    time each was claimed, then id), and the boards from before the game layer (get_rank_board, get_leaderboard,
--    get_arcade_leaderboard, get_correct_streak_stats), which no page calls since #523 (2026-11-21).
--
-- 2. Link my devices (redeem_link_code, v54's body) worked XP out from scratch twice: once in the middle, when it moved the
--    second device's answers (the update trigger on personal_answers, sh_xp_on_update, rebuilds every id an update
--    touches), and once at the end for both ids. Only the second counts (it starts over from the answers and awards, after
--    everything has moved). On the live database the links that finished since 2026-11-18 took 2.0 s on average, up to
--    2.7 s, and the Postgres logs show 24 that ran out of anon's 3 s (statement_timeout) and were rolled back: 19 on
--    2026-11-18, the day the database was overloaded, 4 on 2026-11-19 and 1 on 2026-11-23 (9 ran out inside a rebuild, the
--    rest in the moves after the one in the middle). The page then says the code didn't work. Now:
--      - redeem_link_code sets sh.linking around the answers' move, and sh_xp_on_update skips its rebuild while it is set
--        (as sh_xp_on_delete skips its own while a hub is packed, v96). The rebuild at the end is unchanged and covers both ids.
--        No other trigger the link fires reads the XP tables, so the result is the same, row for row.
--      - sh_xp_replay (v78's body) looks a boost up inline instead of calling sh_xp_mult once per answer (a PL/pgSQL call
--        each, for every answer the person ever gave). The lookup is sh_xp_mult's own query, so every award is the same.
--    On a throwaway copy (a made-up visitor with 10,000 answers, the top five's size on the live site, and a second device
--    with 600; medians of five): a link 770 -> 350 ms, a rebuild 344 -> 324 ms, the replay 203 -> 149 ms, with XP, awards,
--    days and the questions seen identical after the link (checksums of all four). The live database is about 3 times
--    slower, so a link that took 2.0-2.7 s should take about 1 s.
--
-- Every body is supabase/schema.sql's newest copy, md5-checked against the live one on 2026-11-25 (all nine the same:
-- get_rank_board_v2 075298557887139e2ecbe47d49dc9ca4, get_leaderboard_v2 f3a82923877c153bea58a157a9ea06fc,
-- get_correct_streak_stats_v2 0dda737715ec538a058f9d7546db0e52, get_arcade_leaderboard_v2 b545a277c921d42252701cb9c206306c,
-- get_fairy_board 1775dba9cbf11ed9c0f42c1184e08666, redeem_link_code 39652a36526bd120c0f93e8cb81cd468,
-- sh_xp_on_update 7b9e1759e1e434a11251bb5e4e82c393, sh_xp_replay 9b4105d896ffa76d8336f2505164cc2b; sh_xp_mult
-- dc41656b84e3e16aa4af1cdc1d39c737, not replaced), with the changes marked "v103". Eight functions replaced, the same
-- arguments, return types and grants; no table, index or data changes, nothing backfilled. Safe at any hour; applied at
-- 1-5 am Central all the same (Sam's package note).
-- Tests: tools/release/xp.js section 21 (and section 16's boards, now compared in the order they come back), rls.js.

-- ====================================================================== 1. the boards
-- the Ranks board: by XP, people tied on a place by name, then id (v103; PL/pgSQL from v103)
create or replace function public.get_rank_board_v2(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, journey integer, tier integer, level integer, step integer, is_me boolean, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rk from xp_visitors v),
  top as (select r.visitor_id, r.xp, r.rk from r
          where r.rk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor))
  select t.rk, coalesce(vn.display_name, anon_name(t.visitor_id)), t.xp, k.journey, k.tier, k.level, k.step,
    (p_visitor is not null and t.visitor_id = p_visitor), sh_mastery_flair(t.visitor_id), sh_visit_key(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id cross join lateral sh_rank(t.xp) k
  -- v103: a tie by the name shown, then the id
  order by t.rk, lower(coalesce(vn.display_name, anon_name(t.visitor_id))), t.visitor_id;
end;
$$;

-- the streaks board: the longest current streaks of days studied (2 or more), then the most answers; the top p_limit rows.
-- v103: the rows are ranked first, the names worked out only for a place within the limit, and a tie (at the limit too)
-- taken by the name shown, then the id
create or replace function public.get_leaderboard_v2(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with islands as (
    select x.visitor_id, x.d, x.d - (row_number() over (partition by x.visitor_id order by x.d))::int as grp from xp_days x
  ), streaks as (
    select i.visitor_id, count(*)::int as len, max(i.d) as last_day from islands i group by i.visitor_id, i.grp
  ), current_streaks as (
    select s.visitor_id, max(s.len) as streak from streaks s
    where s.last_day >= (now() at time zone 'America/Chicago')::date - 1 group by s.visitor_id
  ), ranked as (
    select cs.visitor_id, cs.streak as days, coalesce(v.answers, 0) as answered, coalesce(v.xp, 0) as vxp,
      rank() over (order by cs.streak desc, coalesce(v.answers, 0) desc) as rk
    from current_streaks cs left join xp_visitors v on v.visitor_id = cs.visitor_id
    where cs.streak >= 2
  ), top as (
    select r.visitor_id, r.days, r.answered, r.vxp, r.rk, coalesce(vn.display_name, anon_name(r.visitor_id)) as nm
    from ranked r left join visitor_names vn on vn.visitor_id = r.visitor_id
    where r.rk <= greatest(1, least(coalesce(p_limit, 10), 50))
    order by r.rk, lower(coalesce(vn.display_name, anon_name(r.visitor_id))), r.visitor_id
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  select t.nm, t.days::int, t.answered::int,
    k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id), sh_visit_key(t.visitor_id)
  from top t cross join lateral sh_rank(t.vxp) k
  order by t.rk, lower(t.nm), t.visitor_id;
end;
$$;

-- the right-in-a-row records: the longest run going now and the longest ever, one person each.
-- v103: of the people tied for it, the first by the name shown, then the id (the name worked out only for the tied ones)
create or replace function public.get_correct_streak_stats_v2()
returns table(kind text, display_name text, streak integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with top as (
    (select 'active'::text as k, s.visitor_id, s.current_streak as n, 1 as ord
       from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id
       where s.current_streak > 0 and s.current_streak = (select max(m.current_streak) from correct_streaks m)
       order by lower(coalesce(vn.display_name, anon_name(s.visitor_id))), s.visitor_id limit 1)
    union all
    (select 'record'::text, s.visitor_id, s.best_streak, 2
       from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id
       where s.best_streak > 0 and s.best_streak = (select max(m.best_streak) from correct_streaks m)
       order by lower(coalesce(vn.display_name, anon_name(s.visitor_id))), s.visitor_id limit 1)
  )
  select t.k, coalesce(vn.display_name, anon_name(t.visitor_id)), t.n, k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id),
    sh_visit_key(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id
  left join xp_visitors v on v.visitor_id = t.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  order by t.ord;
end;
$$;

-- a hub's arcade game board: each person's best score. v103: a tie by the name shown, then the id
create or replace function public.get_arcade_leaderboard_v2(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
    (p_visitor is not null and r.visitor_id = p_visitor), k.journey, k.tier, k.level, k.step, sh_mastery_flair(r.visitor_id),
    sh_visit_key(r.visitor_id)
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join xp_visitors v on v.visitor_id = r.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  -- v103: a tie by the name shown, then the id (r.best desc said nothing r.rnk didn't)
  order by r.rnk, lower(coalesce(vn.display_name, anon_name(r.visitor_id))), r.visitor_id;
end;
$$;

-- the Tooth Fairy's collectors: the most catches, the top p_limit (5, at most 20). v103: ranked first, the names worked out
-- only for a place within the limit, and a tie (at the limit too) taken by the name shown, then the id
create or replace function public.get_fairy_board(p_limit integer default 5)
returns table(display_name text, catches integer, flair text)
language sql stable security definer set search_path = public as $$
  with c as (
    select e.visitor_id, count(*)::int as n from egg_events e where e.kind = 'fairy' group by e.visitor_id
  ), r as (
    select c.visitor_id, c.n, rank() over (order by c.n desc) as rk from c
  )
  select coalesce(vn.display_name, anon_name(r.visitor_id)), r.n, sh_mastery_flair(r.visitor_id)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rk <= greatest(1, least(coalesce(p_limit, 5), 20))
  order by r.rk, lower(coalesce(vn.display_name, anon_name(r.visitor_id))), r.visitor_id
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

-- ====================================================================== 2. Link my devices rebuilds once
-- the answers' update trigger: rebuild every id an update touches, except while redeem_link_code moves a device's answers
create or replace function public.sh_xp_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- v103: Link my devices rebuilds once, at its end, after everything has moved
  if current_setting('sh.linking', true) = 'on' then return null; end if;
  perform sh_xp_rebuild(array(
    select distinct visitor_id from (
      select visitor_id from old_rows union select visitor_id from new_rows
    ) affected where visitor_id is not null
  ));
  return null;
end;
$$;

-- Link my devices: v54's body; v103 moves the answers without the update trigger's rebuild (the one at the end covers both ids)
create or replace function public.redeem_link_code(p_code text, p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare p text; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  if (select count(*) from link_attempts where visitor_id = p_visitor and tried_at > now() - interval '1 hour') >= 10 then return null; end if;
  insert into link_attempts (visitor_id) values (p_visitor);
  select visitor_id into p from link_codes where code = c and created_at > now() - interval '10 minutes';
  if p is null then return null; end if;
  delete from link_codes where code = c;
  if p = p_visitor then return p; end if;
  -- follow an existing chain so everything ends on one id
  p := coalesce((select primary_id from visitor_links where alias_id = p), p);

  -- the game layer (v54)
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    select p, key, src, hub, base, xp, at, d from xp_awards where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_awards where visitor_id = p_visitor;
  insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
    select p, key, src, mult, starts_at, ends_at from xp_boosts where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_boosts where visitor_id = p_visitor;
  update xp_sessions set visitor_id = p where visitor_id = p_visitor;
  insert into game_baseline (visitor_id, xp, badges, at)
    select p, xp, badges, at from game_baseline where visitor_id = p_visitor
    on conflict (visitor_id) do update set xp = game_baseline.xp + excluded.xp,
      badges = array(select distinct z from unnest(game_baseline.badges || excluded.badges) z order by 1);
  delete from game_baseline where visitor_id = p_visitor;
  update pet_purchases set visitor_id = p where visitor_id = p_visitor;
  insert into pet_inventory (visitor_id, item_id, bought_at)
    select p, item_id, bought_at from pet_inventory where visitor_id = p_visitor
    on conflict (visitor_id, item_id) do update set bought_at = least(pet_inventory.bought_at, excluded.bought_at);
  delete from pet_inventory where visitor_id = p_visitor;
  insert into pet_equipped (visitor_id, slot, item_id, set_at)
    select p, slot, item_id, set_at from pet_equipped where visitor_id = p_visitor
    on conflict (visitor_id, slot) do update set
      item_id = case when excluded.set_at > pet_equipped.set_at then excluded.item_id else pet_equipped.item_id end,
      set_at = greatest(pet_equipped.set_at, excluded.set_at);
  delete from pet_equipped where visitor_id = p_visitor;
  delete from pet_equipped e using pet_equipped e2                       -- a yard item now in two spots stays in the newer one
    where e.visitor_id = p and e2.visitor_id = p and e.item_id = e2.item_id and e.slot <> e2.slot
      and (e.set_at, e.slot) < (e2.set_at, e2.slot);
  insert into costume_log (visitor_id, costume, first_day)
    select p, costume, first_day from costume_log where visitor_id = p_visitor
    on conflict (visitor_id, costume) do update set first_day = least(costume_log.first_day, excluded.first_day);
  delete from costume_log where visitor_id = p_visitor;
  update ideas set visitor_id = p where visitor_id = p_visitor;
  insert into idea_votes (idea_id, visitor_id, val, at)
    select idea_id, p, val, at from idea_votes where visitor_id = p_visitor
    on conflict (idea_id, visitor_id) do update set val = case when excluded.at > idea_votes.at then excluded.val else idea_votes.val end,
      at = greatest(idea_votes.at, excluded.at);
  delete from idea_votes where visitor_id = p_visitor;
  insert into idea_reports (idea_id, visitor_id, created_at)
    select idea_id, p, created_at from idea_reports where visitor_id = p_visitor on conflict do nothing;
  delete from idea_reports where visitor_id = p_visitor;
  update idea_notes set visitor_id = p where visitor_id = p_visitor;

  -- v103: no rebuild here (sh_xp_on_update skips it while sh.linking is on); the one at the end covers both ids
  perform set_config('sh.linking', 'on', true);
  update personal_answers set visitor_id = p where visitor_id = p_visitor;
  perform set_config('sh.linking', 'off', true);
  update arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update egg_events set visitor_id = p where visitor_id = p_visitor;
  -- time (v52): move the hour and visit rollups, then the raw pings with the rebuild trigger off, so hours whose raw
  -- pings the retention job already removed are kept
  insert into activity_hourly (h, hub, section, visitor_id, n)
    select h, hub, section, p, n from activity_hourly where visitor_id = p_visitor
    on conflict (h, hub, section, visitor_id) do update set n = activity_hourly.n + excluded.n;
  delete from activity_hourly where visitor_id = p_visitor;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    select visit_id, p, first_at, last_at from activity_visits where visitor_id = p_visitor
    on conflict (visit_id, visitor_id) do update set first_at = least(activity_visits.first_at, excluded.first_at),
      last_at = greatest(activity_visits.last_at, excluded.last_at);
  delete from activity_visits where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'on', true);
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'off', true);
  update nuke_launches set visitor_id = p where visitor_id = p_visitor;
  insert into achievements (visitor_id, kind, hub, created_at) select p, kind, hub, created_at from achievements where visitor_id = p_visitor on conflict do nothing;
  delete from achievements where visitor_id = p_visitor;
  insert into survey_responses (survey_id, visitor_id, answers, created_at) select survey_id, p, answers, created_at from survey_responses where visitor_id = p_visitor on conflict do nothing;
  delete from survey_responses where visitor_id = p_visitor;
  insert into ui_click_reach (day, hub, target, visitor_id) select day, hub, target, p from ui_click_reach where visitor_id = p_visitor on conflict do nothing;
  delete from ui_click_reach where visitor_id = p_visitor;
  insert into correct_streaks (visitor_id, current_streak, best_streak, updated_at)
    select p, current_streak, best_streak, updated_at from correct_streaks where visitor_id = p_visitor
    on conflict (visitor_id) do update set best_streak = greatest(correct_streaks.best_streak, excluded.best_streak),
      current_streak = case when excluded.updated_at > correct_streaks.updated_at then excluded.current_streak else correct_streaks.current_streak end,
      updated_at = greatest(correct_streaks.updated_at, excluded.updated_at);
  delete from correct_streaks where visitor_id = p_visitor;
  -- pinned questions (v46): per question, the newer change wins
  insert into question_pins (visitor_id, hub, qid, pinned, t)
    select p, hub, qid, pinned, t from question_pins where visitor_id = p_visitor
    on conflict (visitor_id, hub, qid) do update set pinned = case when excluded.t > question_pins.t then excluded.pinned else question_pins.pinned end,
      t = greatest(question_pins.t, excluded.t);
  delete from question_pins where visitor_id = p_visitor;
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  -- one rebuild for both ids, also when the second device had no answers (v54)
  perform sh_xp_rebuild(array[p, p_visitor]);
  return p;
end;
$$;

-- the rebuild's replay of the v2 answers: v78's body; v103 looks the boost up inline (sh_xp_mult's own query) instead of
-- calling sh_xp_mult once per answer
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
      row_number() over (partition by pa.visitor_id, pa.d order by pa.t, pa.id) as pos_day
    from pa
  ), e0 as (
    select w.*,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and case
        when w.s_kind = 'mock' then w.s_qrank = 1 and w.s_rank <= 300 and w.t - w.s_start >= w.s_rank * interval '2 seconds'
        else (w.prev_t is null or w.t - w.prev_t >= interval '2 seconds') and w.n60 <= 30 end, false) as g_ok,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and w.correct
        and not coalesce(w.prev_hq = w.hub || '|' || w.qid and w.t - w.prev_t < interval '2 seconds', false)
        and (w.s_kind is distinct from 'mock' or w.s_qrank = 1), false) as r_ok
    from w
  ), e as (
    select e0.*, e0.g_ok or e0.r_ok as ok from e0
  ), b as (
    select e.*,
      case when e.r_ok then case when e.kind = 'self' or e.rn_ever > 1 then 2 else 10 end
        when not e.g_ok then 0
        when e.kind = 'self' then case when e.rn_all <= 3 then 2 else 0 end
        else case when e.rn_same <= 3 then 1 else 0 end end as base_xp,
      -- v103: sh_xp_mult's query inline, not a PL/pgSQL call per answer
      (select least(2, coalesce(max(bo.mult), 1))::integer from xp_boosts bo
        where bo.visitor_id = e.visitor_id and bo.starts_at < e.t and bo.ends_at > e.t) as mult
    from e
  )
  select b.visitor_id, 'a:' || b.id, 'answer'::text, b.hub, b.base_xp, b.base_xp * b.mult, b.t, b.d from b where b.base_xp > 0
  union all
  select g.visitor_id, 'g20:' || g.d, 'goal20'::text, g.hub, 30, 30 * g.mult, g.t, g.d from (
    select distinct on (b.visitor_id, b.d) b.visitor_id, b.d, b.hub, b.mult, b.t from b
    where b.ok and b.pos_day >= 20 order by b.visitor_id, b.d, b.t, b.id) g;
$$;
