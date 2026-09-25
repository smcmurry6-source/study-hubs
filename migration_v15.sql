-- migration_v15 (2026-09-25): handpiece ranks, trophies, and "link my devices"
--
-- Ranks: XP is computed from personal_answers (no new tracking needed, so everyone's history counts):
--   first time you get a question right 10, any other right answer 2, a wrong answer 1 (effort counts),
--   capped at 600 per Central-time day, plus 20 for every day studied. Tiers (sh_tier):
--   0 Antique drill, 1 Stone 150, 2 Bronze 600, 3 Silver 1500, 4 Gold 3000, 5 Diamond 6000, 6 Dark Matter 12000.
-- Trophies: most are derived from existing tables; the few that only a browser can see (Plaque Boss final
--   blow, Night Owl, Through the Root Canal, a 90%+ mock, hub mastery tiers) are reported through
--   record_achievement with a fixed whitelist.
-- Leaderboards: get_leaderboard, get_correct_streak_stats and get_arcade_leaderboard gain a `tier` column.
-- Link devices: one device makes a 6-character code (10 minutes); entering it on another device moves that
--   device's history onto the first device's id, and the second device adopts that id from then on.

-- ---------- XP + tier ----------
create or replace function public.sh_tier(p_xp integer) returns integer language sql immutable as $$
  select case when p_xp >= 12000 then 6 when p_xp >= 6000 then 5 when p_xp >= 3000 then 4
              when p_xp >= 1500 then 3 when p_xp >= 600 then 2 when p_xp >= 150 then 1 else 0 end;
$$;
create or replace function public.sh_tier_floor(p_tier integer) returns integer language sql immutable as $$
  select (array[0, 150, 600, 1500, 3000, 6000, 12000])[least(greatest(p_tier, 0), 6) + 1];
$$;

create or replace function public.sh_visitor_xp(p_visitor text default null)
returns table(visitor_id text, xp integer, days integer, answers integer, correct integer)
language sql stable security definer set search_path = public as $$
  with pa as (
    select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
      row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn
    from personal_answers a where p_visitor is null or a.visitor_id = p_visitor
  ), per_day as (
    select pa.visitor_id, pa.d, count(*) as n, count(*) filter (where pa.correct) as c,
      sum(case when pa.correct and pa.rn = 1 then 10 when pa.correct then 2 else 1 end) as raw
    from pa group by 1, 2
  )
  select per_day.visitor_id, sum(least(raw, 600) + 20)::int, count(*)::int, sum(n)::int, sum(c)::int
  from per_day group by 1;
$$;
revoke all on function public.sh_visitor_xp(text) from public, anon, authenticated;

-- ---------- achievements a browser reports ----------
create table if not exists public.achievements (
  visitor_id text not null,
  kind text not null,
  hub text not null default '',
  created_at timestamptz not null default now(),
  primary key (visitor_id, kind, hub)
);
alter table public.achievements enable row level security;

create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;

-- per-hub count of questions whose latest attempt was right (the client divides by the bank size)
create or replace function public.get_hub_mastery(p_visitor text)
returns table(hub text, latest_correct integer, seen integer)
language sql stable security definer set search_path = public as $$
  select l.hub, count(*) filter (where l.correct)::int, count(*)::int from (
    select distinct on (a.hub, a.qid) a.hub, a.qid, a.correct from personal_answers a
    where a.visitor_id = p_visitor order by a.hub, a.qid, a.answered_at desc
  ) l group by l.hub;
$$;

-- ---------- one visitor's rank card + trophy case ----------
create or replace function public.get_rank_profile(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare x record; t int; pos int; everyone int; best_days int; best_run int; fairies int; goldens int; arcade int; badges text[] := '{}'; ach record;
begin
  select * into x from sh_visitor_xp(p_visitor) limit 1;
  if x.visitor_id is null then
    return jsonb_build_object('xp', 0, 'tier', 0, 'tier_at', 0, 'next_at', sh_tier_floor(1), 'answers', 0, 'correct', 0, 'days', 0, 'badges', '[]'::jsonb);
  end if;
  t := sh_tier(x.xp);
  select count(*) + 1 into pos from sh_visitor_xp(null) o where o.xp > x.xp;
  select count(*) into everyone from sh_visitor_xp(null);
  -- longest run of consecutive study days
  select coalesce(max(len), 0) into best_days from (
    select count(*) as len from (
      select d, d - (row_number() over (order by d))::int as grp from (
        select distinct (answered_at at time zone 'America/Chicago')::date as d from personal_answers where visitor_id = p_visitor) dd
    ) i group by grp) s;
  select coalesce(max(best_streak), 0) into best_run from correct_streaks where visitor_id = p_visitor;
  select count(*) filter (where kind = 'fairy'), count(*) filter (where kind = 'golden') into fairies, goldens from egg_events where visitor_id = p_visitor;
  select count(*) into arcade from arcade_scores where visitor_id = p_visitor;

  if x.answers >= 100 then badges := array_append(badges, 'answers-100'); end if;
  if x.answers >= 1000 then badges := array_append(badges, 'answers-1000'); end if;
  if best_days >= 7 then badges := array_append(badges, 'days-7'); end if;
  if best_days >= 30 then badges := array_append(badges, 'days-30'); end if;
  if best_run >= 25 then badges := array_append(badges, 'run-25'); end if;
  if best_run >= 100 then badges := array_append(badges, 'run-100'); end if;
  if goldens > 0 then badges := array_append(badges, 'golden'); end if;
  if fairies > 0 then badges := array_append(badges, 'fairy'); end if;
  if fairies >= 5 then badges := array_append(badges, 'fairy-5'); end if;
  if arcade >= 25 then badges := array_append(badges, 'arcade-25'); end if;
  for ach in select kind, hub from achievements where visitor_id = p_visitor order by created_at loop
    badges := array_append(badges, ach.kind || case when ach.hub <> '' then ':' || ach.hub else '' end);
  end loop;

  return jsonb_build_object('xp', x.xp, 'tier', t, 'tier_at', sh_tier_floor(t), 'next_at', case when t < 6 then sh_tier_floor(t + 1) end,
    'answers', x.answers, 'correct', x.correct, 'days', x.days, 'best_days', best_days, 'best_run', best_run,
    'position', pos, 'of', everyone, 'badges', to_jsonb(badges));
end;
$$;

-- public board: top ranks by XP
create or replace function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v)
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.xp, sh_tier(r.xp), (p_visitor is not null and r.visitor_id = p_visitor)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk;
$$;

-- ---------- existing leaderboards gain a tier column ----------
drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with days as (
    select visitor_id, (answered_at at time zone 'America/Chicago')::date as d
    from personal_answers group by visitor_id, (answered_at at time zone 'America/Chicago')::date
  ), islands as (
    select visitor_id, d, d - (row_number() over (partition by visitor_id order by d))::int as grp from days
  ), streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day from islands group by visitor_id, grp
  ), current_streaks as (
    select visitor_id, max(len) as streak from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1 group by visitor_id
  ), totals as (
    select visitor_id, count(*)::int as total_answered from personal_answers group by visitor_id
  )
  select coalesce(vn.display_name, anon_name(cs.visitor_id)), cs.streak, coalesce(t.total_answered, 0), sh_tier(coalesce(x.xp, 0))
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  left join sh_visitor_xp(null) x on x.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, 3 desc
  limit p_limit;
end;
$$;

drop function if exists public.get_correct_streak_stats();
create function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  (select 'active'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.current_streak, sh_tier(coalesce(x.xp, 0))
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.current_streak > 0 order by s.current_streak desc limit 1)
  union all
  (select 'record'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.best_streak, sh_tier(coalesce(x.xp, 0))
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.best_streak > 0 order by s.best_streak desc limit 1);
end;
$$;

drop function if exists public.get_arcade_leaderboard(text, text, text, integer);
create function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
         (p_visitor is not null and r.visitor_id = p_visitor), sh_tier(coalesce(x.xp, 0))
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join sh_visitor_xp(r.visitor_id) x on true
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

-- ---------- link my devices ----------
create table if not exists public.link_codes (
  code text primary key,
  visitor_id text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.link_attempts (
  visitor_id text not null,
  tried_at timestamptz not null default now()
);
create table if not exists public.visitor_links (
  alias_id text primary key,
  primary_id text not null,
  linked_at timestamptz not null default now()
);
alter table public.link_codes enable row level security;
alter table public.link_attempts enable row level security;
alter table public.visitor_links enable row level security;

create or replace function public.create_link_code(p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  delete from link_codes where visitor_id = p_visitor or created_at < now() - interval '10 minutes';
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    begin
      insert into link_codes (code, visitor_id) values (c, p_visitor);
      return c;
    exception when unique_violation then -- try another
    end;
  end loop;
end;
$$;

-- returns the id this device should use from now on, or null for a wrong/expired code
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

  update personal_answers set visitor_id = p where visitor_id = p_visitor;
  update arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update egg_events set visitor_id = p where visitor_id = p_visitor;
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
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
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  return p;
end;
$$;
