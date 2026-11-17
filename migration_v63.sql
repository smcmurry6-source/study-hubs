-- v63 (2026-11-17): a medal's double XP never runs over a boost someone bought, and the Bowling trophy counts on the server.
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js). Applied to the live project on
-- 2026-11-17 through the Supabase connector, at Sam's "merge when ready" (PR #395).
--
-- 1. sh_boost_bump (new) and sh_medal_check: when a new mastery medal starts its 24 hours of double XP, what is left of the
--    visitor's shop boosts (running or waiting) moves to start when the last medal boost ends; the part already used stays
--    where it was. Before, the medal's 24 hours ran over it, and XP is never more than doubled, so up to 3 bought hours
--    doubled nothing. (migration_v62 did the same for a boost bought during a medal's 24 hours; this is the other order.)
--    The medal's reply says until when double XP lasts, the moved boost included, for the 2x chip.
-- 2. record_achievement takes 'bowling', the bowling egg's secret trophy (all eight clips seen). widget/bowling.js kept it on
--    the device only, since the kind wasn't listed (vault/tasks/done/2026-11-06-redesign-bowling-egg.md); widget/v3.js now
--    sends it once from the device that won it. Like every other trophy it then pays 25 crowns (sh_wallet counts the
--    profile's badges) and gets its share of the class (get_trophy_stats counts every achievement kind).

-- a medal's 24 hours never run over double XP someone bought (v63): the rest of every shop boost of the visitor's that is
-- still to come at p_at moves to start when the last other boost ends, as one row; the part already used stays where it
-- was. Returns when the moved boost ends (null when there was none). Called by sh_medal_check, under its caller's lock.
create or replace function public.sh_boost_bump(p_visitor text, p_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare r record; rest interval := interval '0'; m timestamptz;
begin
  for r in select b.key, b.starts_at, b.ends_at from xp_boosts b
           where b.visitor_id = p_visitor and b.src = 'shop' and b.ends_at > p_at order by b.starts_at loop
    rest := rest + (r.ends_at - greatest(r.starts_at, p_at));
    if r.starts_at < p_at then
      update xp_boosts set ends_at = p_at where visitor_id = p_visitor and key = r.key;
    else
      delete from xp_boosts where visitor_id = p_visitor and key = r.key;
    end if;
  end loop;
  if rest <= interval '0' then return null; end if;
  select max(b.ends_at) into m from xp_boosts b where b.visitor_id = p_visitor and b.src <> 'shop' and b.ends_at > p_at;
  m := greatest(coalesce(m, p_at), p_at);
  insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
    values (p_visitor, 'shop:moved:' || to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDDHH24MISSUS'), 'shop', 2, m, m + rest);
  return m + rest;
end;
$$;
revoke all on function public.sh_boost_bump(text, timestamptz) from public, anon, authenticated;

-- ---------- a hub mastery medal, worked out from the server-checked answers ----------
-- The share of the hub's counted questions whose latest answer is right: Bronze 50%, Silver 75%, Gold 90%, Crown 100%.
-- Each new medal pays +100/+200/+300/+500 (not boosted) and starts 24 hours of double XP (a new medal during a boost
-- restarts the 24 hours). A medal reached before the switch pays nothing (no back pay). A shop boost's unused time moves
-- after the medal's 24 hours (sh_boost_bump, v63).
create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[100, 200, 300, 500]; c timestamptz; paid int; total int := 0; newest int := 0; b_end timestamptz;
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
revoke all on function public.sh_medal_check(text, text, timestamptz) from public, anon, authenticated;

-- the trophies a page can record (v63: 'bowling', the bowling egg's secret trophy)
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect', 'pet-adopt',
                    'seen-all', 'mock-perfect', 'bowling') then return false; end if;  -- seen-all, mock-perfect: v38; bowling: v63
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;
