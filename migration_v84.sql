-- v84 (2026-11-19): the database optimization pass, phase 3: the bootstrap's answers, and Timmy's days.
-- Sam's package of the to-do list (vault/tasks/2026-11-18-database-optimization-pass.md, the box "The bootstrap's
-- answers"). Sam: "dont cut anything for now", "i dont want to upgrade the plan. stay free". Nothing students see or earn
-- changes; a page without the new parts asks the old way.
--   1. sh_answers_since and get_my_answers_since: a device that holds a hub's answer history (widget/v3.js keeps it, up to
--      the newest 5,000) sends the id of the newest answer it holds and how many answers the server had then, and gets only
--      the answers after it. A heavy student's history was 8.8 of the bootstrap's 22.5 ms (8,000 answers, phase 2's copy),
--      on every page load and again every 3 minutes a hub is open. Answers are only ever added to personal_answers, except
--      by Link my devices, which moves another device's (older) answers onto this one: then the count is more than the
--      device's count plus the new ones, and the whole history comes back, as it does without a device copy. The count and
--      the newest id come from one index-only scan of personal_answers_visitor_q (v71), which holds visitor, hub and id.
--      The reply: {answers, answers_id, answers_n, answers_part}; answers_part says the answers are only those after
--      p_after (the device adds them to its copy); otherwise they are get_my_answers', unchanged.
--   2. get_widget_bootstrap_v2 takes the same two (p_answers_after, p_answers_n, both default null) and adds the same keys.
--      Without them it answers exactly as before, with answers_id, answers_n and answers_part (false) added. A new argument
--      changes the function's signature, so the old one is dropped and the new one created in this one transaction;
--      PostgREST finds it by its argument names, so every page's call still matches.
--   3. get_pet_days (Timmy's days, under get_pet_days_v2): the one day it reads from personal_answers (the day 70 days back,
--      for the rolling boundary) was found by reading every answer of the last 70 days and keeping that day's: about 3 ms
--      for the heaviest. The same rows, read with that day's end as a bound too. Both are PL/pgSQL now (v76: kept plans).
-- Measured and checked on a throwaway copy of supabase/schema.sql (the task's Log). Functions only, with one drop and
-- create of the bootstrap; apply it at night (1 to 5 am Central), one statement a call
-- (vault/how-to/run-sql-on-the-live-database.md).
-- Copied from main's newest copies: get_widget_bootstrap_v2 and get_my_answers (v82), get_pet_days (v53),
-- get_pet_days_v2 (v54).

set local lock_timeout = '3s';

-- ---------- 1. the answers after the device's newest ----------
create or replace function public.sh_answers_since(p_visitor text, p_hub text, p_after bigint, p_n bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare total bigint; top bigint; k bigint; rows jsonb;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40 then
    return jsonb_build_object('answers', '[]'::jsonb, 'answers_id', 0, 'answers_n', 0, 'answers_part', false);
  end if;
  select count(*), coalesce(max(a.id), 0), count(*) filter (where a.id > p_after) into total, top, k
  from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub;
  if p_after is not null and p_n is not null and p_after >= 0 and p_n >= 0 and p_after <= top then
    if p_n + k = total and k < 5000 then
      select coalesce(('[' || string_agg('[' || to_json(x.qid)::text || ',' || x.t || ',' || x.c || ']', ',' order by x.t, x.id) || ']')::jsonb, '[]'::jsonb)
      into rows
      from (
        select a.id, a.qid, floor(date_part('epoch', a.answered_at))::bigint as t, case when a.correct then 1 else 0 end as c
        from personal_answers a
        where a.visitor_id = p_visitor and a.hub = p_hub and a.id > p_after
      ) x;
      return jsonb_build_object('answers', rows, 'answers_id', top, 'answers_n', total, 'answers_part', true);
    end if;
  end if;
  return jsonb_build_object('answers', get_my_answers(p_visitor, p_hub), 'answers_id', top, 'answers_n', total,
    'answers_part', false);
end;
$$;

create or replace function public.get_my_answers_since(p_visitor text, p_hub text, p_after bigint default null, p_n bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  return sh_answers_since(p_visitor, p_hub, p_after, p_n);
end;
$$;

-- ---------- 2. the bootstrap with the device's answers ----------
drop function if exists public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text);
create function public.get_widget_bootstrap_v2(
  p_visitor text, p_hub text default null, p_cavity_week text default null, p_episode text default null,
  p_include_pins boolean default false, p_dashboard boolean default false, p_luck_hub text default null,
  p_luck_date date default null, p_link_name text default null,
  p_answers_after bigint default null, p_answers_n bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  valid_visitor boolean := p_visitor is not null and length(p_visitor) between 1 and 80;
  valid_hub boolean := p_hub is not null and p_hub ~ '^[a-z0-9][a-z0-9-]{0,39}$';
begin
  if not valid_visitor then
    return get_widget_bootstrap(p_visitor, p_hub, p_cavity_week, p_episode, p_include_pins, p_dashboard, p_luck_hub, p_luck_date, p_link_name)
      || jsonb_build_object('shop', get_my_shop(null));
  end if;

  return jsonb_build_object(
    'display_name', get_display_name(p_visitor),
    'pins', case when valid_hub and p_include_pins then get_my_pins(p_visitor, p_hub) else '[]'::jsonb end,
    'survey', coalesce((select jsonb_agg(to_jsonb(s) order by s.starts_at desc) from get_my_survey(p_visitor) s), '[]'::jsonb),
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.hub) from get_hub_overrides() o), '[]'::jsonb),
    'cavity', case when valid_hub and p_cavity_week ~ '^\d{4}-W\d{2}$' then
      coalesce((select jsonb_agg(to_jsonb(c) order by c.claimed_at) from get_cavity_week(p_hub, p_cavity_week) c), '[]'::jsonb)
      else '[]'::jsonb end,
    'podcast', case when valid_hub and length(coalesce(p_episode, '')) between 1 and 80
      then pod_feed(p_hub, p_episode, p_visitor) else null end,
    'dashboard_week', case when p_dashboard then coalesce((
      select jsonb_agg(jsonb_build_object('answer_date', x.answer_date, 'attempts', x.attempts, 'correct', x.correct) order by x.answer_date)
      from (
        select (a.answered_at at time zone 'America/Chicago')::date as answer_date,
          count(*)::integer as attempts, count(*) filter (where a.correct)::integer as correct
        from personal_answers a
        where a.visitor_id = p_visitor
          and (a.answered_at at time zone 'America/Chicago')::date >= (now() at time zone 'America/Chicago')::date - 13
        group by 1
      ) x
    ), '[]'::jsonb) else '[]'::jsonb end,
    'survey_popup', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(s) order by s.id) from get_active_survey(p_visitor) s
    ), '[]'::jsonb) else '[]'::jsonb end,
    'exam_luck', case when p_dashboard and length(coalesce(p_luck_hub, '')) between 1 and 40 and p_luck_date is not null
      then get_exam_luck(p_luck_hub, p_luck_date, p_visitor) else null end,
    'recaps', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(r) order by r.published_at desc) from get_published_recaps() r
    ), '[]'::jsonb) else '[]'::jsonb end,
    'golden', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(g) order by g.claimed_at) from get_golden_today() g
    ), '[]'::jsonb) else '[]'::jsonb end,
    'name_shared', case when length(btrim(coalesce(p_link_name, ''))) between 1 and 24
      then name_shared(p_visitor, p_link_name) else false end,
    'mastery', case when valid_hub then
      coalesce((select jsonb_agg(to_jsonb(m) order by m.hub) from get_hub_mastery(p_visitor) m), '[]'::jsonb)
      else '[]'::jsonb end,
    'rank', get_rank_profile_v2(p_visitor),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days_v2(p_visitor) pd), '[]'::jsonb),
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox_v2(p_visitor) i), '[]'::jsonb),
    'shop', get_my_shop(p_visitor))
    || case when valid_hub then sh_answers_since(p_visitor, p_hub, p_answers_after, p_answers_n)
       else jsonb_build_object('answers', '[]'::jsonb) end;
end;
$$;

-- ---------- 3. Timmy's days: the boundary day read alone ----------
create or replace function public.get_pet_days(p_visitor text)
returns table(d date, attempts integer, correct integer)
language plpgsql stable security definer set search_path = public as $$
declare
  at0 timestamptz := now() - interval '70 days';
  d0 date := ((now() - interval '70 days') at time zone 'America/Chicago')::date;
begin
  /* xp_days supplies whole Central-time days. The one cutoff day comes from personal_answers so this keeps the original
     rolling 70-day boundary exact; v84 bounds that read by the day's end too (the same rows). */
  return query
  select z.d, z.attempts, z.correct from (
    select x.d, x.n::integer as attempts, x.c::integer as correct
    from xp_days x
    where x.visitor_id = p_visitor and x.d > d0
    union all
    select (a.answered_at at time zone 'America/Chicago')::date,
      count(*)::integer, count(*) filter (where a.correct)::integer
    from personal_answers a
    where a.visitor_id = p_visitor and a.answered_at > at0
      and a.answered_at < ((d0 + 1)::timestamp at time zone 'America/Chicago')
      and (a.answered_at at time zone 'America/Chicago')::date = d0
    group by 1
  ) z order by z.d;
end;
$$;

create or replace function public.get_pet_days_v2(p_visitor text)
returns table(d date, attempts integer, correct integer, hp integer)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with a as (select g.d, g.attempts, g.correct from get_pet_days(p_visitor) g),
  s as (
    select p.day as d, sum(p.hp)::integer as hp from pet_purchases p
    where p.visitor_id = p_visitor and p.hp is not null and p.day > (now() at time zone 'America/Chicago')::date - 70
    group by p.day
  )
  select coalesce(a.d, s.d), coalesce(a.attempts, 0), coalesce(a.correct, 0), coalesce(s.hp, 0)
  from a full join s on s.d = a.d order by 1;
end;
$$;

revoke all on function public.sh_answers_since(text, text, bigint, bigint) from public, anon, authenticated;
revoke all on function public.get_my_answers_since(text, text, bigint, bigint) from public;
grant execute on function public.get_my_answers_since(text, text, bigint, bigint) to anon, authenticated;
revoke all on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text, bigint, bigint) from public;
grant execute on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text, bigint, bigint) to anon, authenticated;
