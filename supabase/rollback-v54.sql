-- Undo migration_v54 on the live project (the game layer's server). It was applied on 2026-11-10 ahead of the redesign's
-- release by mistake (Sam: "dont run the migration if it wasnt supposed to yet"); this puts the database back exactly as
-- supabase/schema.sql has it, so v54 can be applied as planned at the release (vault/tasks/2026-11-06-redesign-release.md).
--
-- Generated and checked on a throwaway copy: supabase/schema.sql, then migration_v54.sql, then this file gives the same
-- functions (definition and grants), tables, policies and triggers as supabase/schema.sql alone. It drops the 20 tables
-- and 64 functions v54 added (they held 0 rows besides v54's own seed data, the shop catalog and the baselines, when this was written)
-- and restores today's redeem_link_code, sh_xp_rebuild and sh_xp_on_insert. Run it once, as one transaction.
begin;
CREATE OR REPLACE FUNCTION public.redeem_link_code(p_code text, p_visitor text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  return p;
end;
$function$
;

revoke all on function redeem_link_code(text,text) from public, anon, authenticated, service_role;

grant execute on function redeem_link_code(text,text) to public;

grant execute on function redeem_link_code(text,text) to postgres;

grant execute on function redeem_link_code(text,text) to anon;

grant execute on function redeem_link_code(text,text) to authenticated;

grant execute on function redeem_link_code(text,text) to service_role;

CREATE OR REPLACE FUNCTION public.sh_xp_rebuild(p_ids text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(cardinality(p_ids), 0) = 0 then return; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || x.visitor_id))
  from (select distinct unnest(p_ids) as visitor_id order by 1) x
  where x.visitor_id is not null;
  delete from xp_seen where visitor_id = any(p_ids);
  delete from xp_days where visitor_id = any(p_ids);
  delete from xp_visitors where visitor_id = any(p_ids);

  insert into xp_seen (visitor_id, hub, qid, correct)
    select distinct visitor_id, hub, qid, correct
    from personal_answers where visitor_id = any(p_ids);

  insert into xp_days (visitor_id, d, n, c, raw)
    with pa as (
      select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
        row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn
      from personal_answers a where a.visitor_id = any(p_ids)
    )
    select visitor_id, d, count(*)::integer, count(*) filter (where correct)::integer,
      sum(case when correct and rn = 1 then 10 when correct then 2 else 1 end)::integer
    from pa group by 1, 2;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    with totals as (
      select visitor_id, sum(least(raw, 600) + 20)::integer as xp, count(*)::integer as days,
        sum(n)::integer as answers, sum(c)::integer as correct
      from xp_days where visitor_id = any(p_ids) group by visitor_id
    ), islands as (
      select visitor_id, d, d - row_number() over (partition by visitor_id order by d)::integer as grp
      from xp_days where visitor_id = any(p_ids)
    ), best as (
      select visitor_id, max(len)::integer as best_days
      from (select visitor_id, grp, count(*)::integer as len from islands group by 1, 2) runs
      group by visitor_id
    )
    select t.visitor_id, t.xp, t.days, t.answers, t.correct, coalesce(b.best_days, 0)
    from totals t left join best b using (visitor_id);
end;
$function$
;

revoke all on function sh_xp_rebuild(text[]) from public, anon, authenticated, service_role;

grant execute on function sh_xp_rebuild(text[]) to postgres;

grant execute on function sh_xp_rebuild(text[]) to service_role;

CREATE OR REPLACE FUNCTION public.sh_xp_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  seen_inserted integer;
  raw_delta integer;
  previous_raw integer := 0;
  answer_day date;
  is_new_day boolean := false;
  new_best_days integer := 0;
  xp_delta integer;
begin
  if new.visitor_id is null or new.hub is null or new.qid is null or new.correct is null then return null; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || new.visitor_id));

  insert into xp_seen (visitor_id, hub, qid, correct)
    values (new.visitor_id, new.hub, new.qid, new.correct)
    on conflict do nothing;
  get diagnostics seen_inserted = row_count;
  raw_delta := case when new.correct and seen_inserted = 1 then 10 when new.correct then 2 else 1 end;
  answer_day := (new.answered_at at time zone 'America/Chicago')::date;

  loop
    previous_raw := 0;
    select raw into previous_raw from xp_days
      where visitor_id = new.visitor_id and d = answer_day for update;
    if found then
      update xp_days set n = n + 1, c = c + case when new.correct then 1 else 0 end,
        raw = raw + raw_delta
      where visitor_id = new.visitor_id and d = answer_day;
      exit;
    end if;
    begin
      insert into xp_days (visitor_id, d, n, c, raw)
        values (new.visitor_id, answer_day, 1, case when new.correct then 1 else 0 end, raw_delta);
      is_new_day := true;
      -- select ... into left previous_raw null when the day had no row yet; a null here would make
      -- least(previous_raw + raw_delta, 600) read 600 and drop this answer's XP from the cache.
      previous_raw := 0;
      exit;
    exception when unique_violation then
      -- Another transaction made this visitor/day while this one was checking.  Lock and update it.
      null;
    end;
  end loop;

  if is_new_day then
    select coalesce(max(len), 0)::integer into new_best_days from (
      select count(*)::integer as len from (
        select d, d - row_number() over (order by d)::integer as grp
        from xp_days where visitor_id = new.visitor_id
      ) islands group by grp
    ) runs;
  end if;
  xp_delta := least(previous_raw + raw_delta, 600) - least(previous_raw, 600)
    + case when is_new_day then 20 else 0 end;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    values (new.visitor_id, xp_delta, case when is_new_day then 1 else 0 end, 1,
      case when new.correct then 1 else 0 end, new_best_days)
    on conflict (visitor_id) do update set
      xp = xp_visitors.xp + excluded.xp,
      days = xp_visitors.days + excluded.days,
      answers = xp_visitors.answers + excluded.answers,
      correct = xp_visitors.correct + excluded.correct,
      best_days = greatest(xp_visitors.best_days, excluded.best_days);
  return null;
end;
$function$
;

revoke all on function sh_xp_on_insert() from public, anon, authenticated, service_role;

grant execute on function sh_xp_on_insert() to public;

grant execute on function sh_xp_on_insert() to postgres;

grant execute on function sh_xp_on_insert() to anon;

grant execute on function sh_xp_on_insert() to authenticated;

grant execute on function sh_xp_on_insert() to service_role;

drop function if exists sh_season_was_on(text,date,date);

drop function if exists sh_owns(text,text);

drop function if exists xp_session_start(text,text,text,text);

drop function if exists sh_v2_at();

drop function if exists sh_key(text,text,text);

drop function if exists sh_xp_mult(text,timestamp with time zone);

drop function if exists sh_boost_json(text,timestamp with time zone);

drop function if exists sh_award(text,text,text,text,integer,integer,timestamp with time zone);

drop function if exists sh_xp_replay(text[]);

drop function if exists sh_medal_check(text,text,timestamp with time zone);

drop function if exists sh_answer(timestamp with time zone,text,text,text,integer,integer[],boolean,text,text,text,uuid,boolean);

drop function if exists sh_session_start(timestamp with time zone,text,text,text,text);

drop function if exists sh_session_finish(timestamp with time zone,text,uuid,integer,integer);

drop function if exists sh_pod_minute(timestamp with time zone,text,text,text,integer);

drop function if exists sh_shop_pick(text,integer,text[]);

drop function if exists sh_shop_day(date);

drop function if exists sh_shop_for(text,date);

drop function if exists sh_wallet(text);

drop function if exists sh_throwback_items(date);

drop function if exists sh_owned(text);

drop function if exists sh_buy(date,text,text,text);

drop function if exists sh_my_shop(date,text);

drop function if exists sh_visit_key(text);

drop function if exists sh_visit_link(text);

drop function if exists record_answer_v2(text,text,text,integer,integer[],boolean,text,text,text,uuid,boolean);

drop function if exists xp_session_finish(text,uuid,integer,integer);

drop function if exists pod_minute_v2(text,text,text,integer);

drop function if exists sh_rank(integer);

drop function if exists sh_season(date);

drop function if exists sh_is_fall(date);

drop function if exists buy_item(text,text,text);

drop function if exists sh_easter(integer);

drop function if exists sh_shop_seasons(date);

drop function if exists sh_throwback_days(date);

drop function if exists sh_is_throwback(date);

drop function if exists get_rank_profile_v2(text);

drop function if exists mark_dark_unlock_seen(text,integer);

drop function if exists get_rank_board_v2(text,integer);

drop function if exists get_leaderboard_v2(integer);

drop function if exists get_correct_streak_stats_v2();

drop function if exists get_arcade_leaderboard_v2(text,text,text,integer);

drop function if exists get_trophy_stats_v2();

drop function if exists set_visiting(text,boolean);

drop function if exists get_place(text);

drop function if exists get_my_shop(text);

drop function if exists equip_item(text,text,text);

drop function if exists record_costume_sighting(text,text);

drop function if exists get_pet_days_v2(text);

drop function if exists delete_my_idea(text,bigint);

drop function if exists post_idea(text,text,text,text,text,text,text);

drop function if exists vote_idea(text,bigint,integer);

drop function if exists report_idea(text,bigint);

drop function if exists get_ideas(text,text,text,text,integer);

drop function if exists get_my_inbox_v2(text);

drop function if exists mark_idea_note_seen(text,bigint);

drop function if exists admin_set_podcast_episode(text,text,text,integer);

drop function if exists get_widget_bootstrap_v2(text,text,text,text,boolean,boolean,text,date,text);

drop function if exists admin_load_question_keys(text,text,jsonb,boolean);

drop function if exists admin_resolve_report_v2(text,text,bigint,text,text);

drop function if exists get_reports_v2(text);

drop function if exists admin_upsert_shop_item(text,jsonb);

drop function if exists admin_ideas(text,integer);

drop function if exists admin_set_idea(text,bigint,text,text,text);

drop function if exists admin_post_starter_idea(text,text,text,text,text,text);

drop table if exists game_config cascade;

drop table if exists game_baseline cascade;

drop table if exists question_keys cascade;

drop table if exists xp_awards cascade;

drop table if exists xp_boosts cascade;

drop table if exists xp_sessions cascade;

drop table if exists answer_xp cascade;

drop table if exists podcast_episodes cascade;

drop table if exists report_outcomes cascade;

drop table if exists shop_items cascade;

drop table if exists pet_purchases cascade;

drop table if exists pet_inventory cascade;

drop table if exists pet_equipped cascade;

drop table if exists costume_log cascade;

drop table if exists ideas cascade;

drop table if exists idea_votes cascade;

drop table if exists idea_reports cascade;

drop table if exists idea_notes cascade;

drop table if exists visit_secret cascade;

drop table if exists pet_visit_off cascade;
delete from supabase_migrations.schema_migrations where name = 'v54_game_layer_server';
commit;
