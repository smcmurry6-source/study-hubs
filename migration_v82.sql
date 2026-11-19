-- v82 (2026-11-19, written as v79; renumbered at the merge: v79-v81 went to the answer save, #457): the database optimization pass, phase 2: fewer calls from the page, and a lighter page bootstrap.
-- Sam's package of the to-do list (vault/tasks/2026-11-18-database-optimization-pass.md, Phase 2's boxes "The class's
-- numbers on each card", "The page's three analytics batches as one call" and "The bootstrap"; the fourth box, the rank and
-- mastery after every tenth answer, is page work in widget/ranks.js with no server part). Sam: "dont cut anything for now",
-- "i dont want to upgrade the plan. stay free". Nothing students see or earn changes; the pages fall back to the old calls
-- while this isn't applied.
--   1. get_class_numbers(hub, qids, choice qids): the class's numbers on a card (question_stats: how many answered, how
--      many right; question_choices: how often each choice was picked) in one call. The page read them as two REST reads a
--      card, each with its own preflight: a fifth of every request the class made (2026-11-19's edge logs).
--   2. record_analytics(hub, visitor, visit, question health, clicks, events): the page's three analytics batches
--      (record_qh, record_clicks, record_events: 14.8% of the requests) in one call. It calls the three functions as they
--      are, each with its own checks and its own "never surface an error" block, so every row is what it was.
--   3. The shop's picks of the day, worked out once for everyone (shop_days), not again for every visitor's bootstrap,
--      shop read and purchase. sh_shop_day reads the stored day when it's there and works it out as before when it isn't,
--      so the shop is the same either way; any change to shop_items clears what's stored (a trigger), and pg_cron fills
--      today and tomorrow once an hour.
--   4. get_widget_bootstrap_v2 builds its answer once: it called today's bootstrap and then replaced three of its parts
--      (the rank, Timmy's days and the Inbox) with their v2 versions, so the old rank, Timmy's days and Inbox were worked
--      out on every page load and thrown away. The same keys and the same values, without them.
--   5. get_my_answers: the same rows, a little cheaper to build (the time as a float's seconds, not numeric's; the JSON
--      built as text and read once).
--   6. anon_name (the class name of a visitor without a chosen one, e.g. "Gleaming Molar 42"): it compared the visitor's
--      name with everyone's, working out every visitor's name on every call (3.6-6 ms; in every bootstrap and on every row
--      of the boards). An index on the name's base (correct_streaks_anon_base) makes that a lookup; the same names.
-- Measured on a throwaway copy of supabase/schema.sql with a made-up class (the task's Log has the numbers). Tested with
-- tools/release/xp.js and rls.js. Functions are created or replaced, with one small new table and one index on
-- correct_streaks (about 2,000 rows on 2026-11-19: a moment's lock); apply it at night (1 to 5 am Central), after
-- Heme & Endo Exam 3 (Fri 2026-11-20, 9:30 am) (vault/how-to/run-sql-on-the-live-database.md).
-- Copied from main's newest copies: sh_shop_day (v54), get_widget_bootstrap_v2 (v54) and the parts of get_widget_bootstrap
-- it repeats (v53's, as in supabase/schema.sql), get_my_answers (v34), anon_name (v12).

-- ---------- 1. the class's numbers on a card, in one call ----------
-- {stats: [{qid, attempts, correct}], choices: [{qid, choice, picks}]}: the rows the two REST reads returned
-- (question_stats for p_qids, question_choices for p_choices), up to 1,000 questions each.
create or replace function public.get_class_numbers(p_hub text, p_qids text[], p_choices text[] default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' or coalesce(cardinality(p_qids), 0) > 1000
     or coalesce(cardinality(p_choices), 0) > 1000 then
    return jsonb_build_object('stats', '[]'::jsonb, 'choices', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'stats', coalesce((select jsonb_agg(jsonb_build_object('qid', s.qid, 'attempts', s.attempts, 'correct', s.correct))
      from question_stats s where s.hub = p_hub and s.qid = any(p_qids)), '[]'::jsonb),
    'choices', coalesce((select jsonb_agg(jsonb_build_object('qid', c.qid, 'choice', c.choice, 'picks', c.picks))
      from question_choices c where c.hub = p_hub and c.qid = any(p_choices)), '[]'::jsonb));
end;
$$;

-- ---------- 2. the page's three analytics batches, in one call ----------
-- Each part is optional; each goes to its own function as it is (record_qh, record_clicks, record_events), which checks
-- it and swallows its own errors, so one bad batch never loses the other two.
create or replace function public.record_analytics(p_hub text, p_visitor text, p_visit text default null,
  p_qh jsonb default null, p_clicks jsonb default null, p_events jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_qh) = 'array' and jsonb_array_length(p_qh) > 0 then perform record_qh(p_hub, p_visitor, p_visit, p_qh); end if;
  if jsonb_typeof(p_clicks) = 'array' and jsonb_array_length(p_clicks) > 0 then perform record_clicks(p_hub, p_visitor, p_clicks); end if;
  if jsonb_typeof(p_events) = 'array' and jsonb_array_length(p_events) > 0 then perform record_events(p_hub, p_visitor, p_events); end if;
end;
$$;

-- ---------- 3. the shop's picks of the day, once for everyone ----------
-- One row per item on sale that day, exactly as sh_shop_day_make(day) gives them. Read only by sh_shop_day.
create table if not exists public.shop_days (
  day date not null,
  shelf text not null,
  pos integer not null,
  item_id text not null,
  primary key (day, shelf, pos)
);
alter table public.shop_days enable row level security;
revoke all on public.shop_days from anon, authenticated;

-- the day's shop worked out from the catalog: v54's sh_shop_day, unchanged (the rotation, the seasons, a throwback day's
-- three and the shelf; the same for everyone, from the Central date and shop_items alone)
create or replace function public.sh_shop_day_make(p_day date)
returns table(item_id text, shelf text, pos integer) language plpgsql stable security definer set search_path = public as $$
declare wk text[]; ssn text[] := sh_shop_seasons(p_day);
begin
  wk := array(select w.item_id from sh_shop_pick('week:' || date_trunc('week', p_day)::date, 3, null) w order by w.pos);
  return query
    select w.item_id, 'weekly'::text, w.pos::integer from unnest(wk) with ordinality w(item_id, pos)
    union all select d.item_id, 'daily', d.pos from sh_shop_pick('day:' || p_day, 4, wk) d
    union all select i.id, 'season', (row_number() over (order by array_position(ssn, i.season), i.sort, i.id))::integer from shop_items i
      where i.active and i.season = any(ssn)
    union all select t.item_id, 'throwback', t.pos from sh_throwback_items(p_day) t
    union all select i.id, 'always', (row_number() over (order by i.sort, i.id))::integer from shop_items i where i.active and i.shelf;
end;
$$;

-- the day's shop: the stored one when it's there (in the order sh_shop_day_make gives), otherwise worked out
create or replace function public.sh_shop_day(p_day date)
returns table(item_id text, shelf text, pos integer) language plpgsql stable security definer set search_path = public as $$
begin
  if exists (select 1 from shop_days c where c.day = p_day) then
    return query select c.item_id, c.shelf, c.pos from shop_days c where c.day = p_day
      order by array_position(array['weekly', 'daily', 'season', 'throwback', 'always'], c.shelf), c.pos;
  else
    return query select m.item_id, m.shelf, m.pos from sh_shop_day_make(p_day) m;
  end if;
end;
$$;

-- store today's and tomorrow's (Central) shop if they aren't stored yet, and drop the days before yesterday; pg_cron runs
-- it hourly. Returns how many days it stored.
create or replace function public.sh_shop_days_fill()
returns integer language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'America/Chicago')::date; x date; n int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('sh_shop_days'));
  delete from shop_days where day < d - 1;
  foreach x in array array[d, d + 1] loop
    if not exists (select 1 from shop_days where day = x) then
      insert into shop_days (day, shelf, pos, item_id) select x, m.shelf, m.pos, m.item_id from sh_shop_day_make(x) m;
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

-- any change to the catalog (a new item, a price, an item taken off sale) clears what's stored, so the shop is worked out
-- from the new catalog until the next fill
create or replace function public.sh_shop_days_clear()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from shop_days;
  return null;
end;
$$;
drop trigger if exists shop_items_clear_days on public.shop_items;
create trigger shop_items_clear_days after insert or update or delete or truncate on public.shop_items
  for each statement execute function public.sh_shop_days_clear();

revoke all on function public.sh_shop_day_make(date) from public, anon, authenticated;
revoke all on function public.sh_shop_day(date) from public, anon, authenticated;
revoke all on function public.sh_shop_days_fill() from public, anon, authenticated;
revoke all on function public.sh_shop_days_clear() from public, anon, authenticated;

select public.sh_shop_days_fill();

do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'sh-shop-days';
      perform cron.schedule('sh-shop-days', '7 * * * *', 'select public.sh_shop_days_fill()');
    exception when others then
      raise notice 'pg_cron not set up (%): the shop is worked out on every read, as before', sqlerrm;
    end;
  end if;
end
$do$;

-- ---------- 5. get_my_answers: the same rows, cheaper to build ----------
-- [qid, seconds, 1 or 0] for each of the visitor's latest 5,000 answers in the hub, oldest first. date_part's float
-- seconds floor to the same whole second as extract's numeric ones (checked on every answer of the throwaway copy and on
-- two million made-up times), and the JSON is built as text and read once instead of an element at a time. PL/pgSQL, so
-- its plan is kept for the connection (v76).
create or replace function public.get_my_answers(p_visitor text, p_hub text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40 then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select ('[' || string_agg('[' || to_json(x.qid)::text || ',' || x.t || ',' || x.c || ']', ',' order by x.t, x.id) || ']')::jsonb
    from (
      select a.id, a.qid, floor(date_part('epoch', a.answered_at))::bigint as t, case when a.correct then 1 else 0 end as c
      from personal_answers a
      where a.visitor_id = p_visitor and a.hub = p_hub
      order by a.answered_at desc, a.id desc
      limit 5000
    ) x), '[]'::jsonb);
end;
$$;

-- ---------- 4. the v2 bootstrap, built once ----------
-- Every key of get_widget_bootstrap (today's), worked out the same way, except the three the v2 replaces (rank, pet_days,
-- inbox), which come from their v2 functions only; then the shop. Without a visitor: today's, with the shop, as before.
create or replace function public.get_widget_bootstrap_v2(
  p_visitor text, p_hub text default null, p_cavity_week text default null, p_episode text default null,
  p_include_pins boolean default false, p_dashboard boolean default false, p_luck_hub text default null,
  p_luck_date date default null, p_link_name text default null)
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
    'answers', case when valid_hub then get_my_answers(p_visitor, p_hub) else '[]'::jsonb end,
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
    'shop', get_my_shop(p_visitor));
end;
$$;

-- ---------- 6. the class name, by lookup ----------
-- The visitor's word pair, with a two-digit number when someone who answered earlier has the same pair (v12's rule,
-- unchanged). The index finds the others with the same pair; before it, every visitor's pair was worked out each call.
create index if not exists correct_streaks_anon_base on public.correct_streaks (public.anon_name_base(visitor_id));
analyze public.correct_streaks;
create or replace function public.anon_name(p_visitor_id text)
returns text language plpgsql stable set search_path = public as $$
declare b text := anon_name_base(p_visitor_id); since timestamptz := first_seen(p_visitor_id);
begin
  if exists (
      select 1 from correct_streaks c
      where anon_name_base(c.visitor_id) = b
        and c.visitor_id <> p_visitor_id
        and first_seen(c.visitor_id) is not null
        and (since is null or first_seen(c.visitor_id) < since
             or (first_seen(c.visitor_id) = since and c.visitor_id < p_visitor_id))) then
    return b || ' ' || (10 + abs(hashtext(p_visitor_id || ':n')) % 90)::text;
  end if;
  return b;
end;
$$;

revoke all on function public.get_class_numbers(text, text[], text[]) from public;
grant execute on function public.get_class_numbers(text, text[], text[]) to anon, authenticated;
revoke all on function public.record_analytics(text, text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.record_analytics(text, text, text, jsonb, jsonb, jsonb) to anon, authenticated;
