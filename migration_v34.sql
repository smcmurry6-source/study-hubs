-- ============================================================================
-- migration_v34.sql — Boards hub persistence and supporting RPCs.
--
-- Draft only. Claude reviews and applies this migration after the PR review.
-- No database has been changed by preparing this file.
-- ============================================================================

-- ---------------------------------------------------------------- arcade games
-- submit_arcade_score is copied from migration_v11, with the Boards game-id
-- pattern added. Keep the existing whitelist, throttle, and score bounds.
create or replace function public.submit_arcade_score(p_visitor text, p_hub text, p_game text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_game is null or (
    p_game not in (
      -- msk-exam3 Bone Zone Arcade
      'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',
      -- perio Pocket Arcade
      'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross'
    )
    and not coalesce(p_hub = 'boards' and p_game ~ '^[a-z][a-z0-9-]{1,23}$', false)
  ) then return; end if;
  if p_score is null or p_score < 1 or p_score > 200000 then return; end if;
  if exists (
    select 1 from public.arcade_scores
    where visitor_id = p_visitor and hub = coalesce(p_hub, '') and game = p_game
      and played_at > now() - interval '10 seconds'
  ) then return; end if;
  insert into public.arcade_scores (hub, game, visitor_id, score)
  values (coalesce(p_hub, ''), p_game, p_visitor, p_score);
end;
$$;
revoke all on function public.submit_arcade_score(text, text, text, integer) from public;
grant execute on function public.submit_arcade_score(text, text, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------- achievements
-- record_achievement is copied from migration_v32, with the Boards trophy
-- pattern added.
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind is null or (
    p_kind not in (
      'boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
      'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
      'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect', 'pet-adopt'
    )
    and not coalesce(p_hub = 'boards' and p_kind ~ '^cs-[a-z0-9-]{1,30}$', false)
  ) then return false; end if;
  insert into public.achievements (visitor_id, kind, hub)
  values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
  on conflict do nothing;
  return found;
end;
$$;
revoke all on function public.record_achievement(text, text, text) from public;
grant execute on function public.record_achievement(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- game saves
create table if not exists public.game_saves (
  visitor_id text not null,
  hub text not null,
  slot text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (visitor_id, hub, slot)
);
alter table public.game_saves enable row level security;
revoke all on table public.game_saves from public, anon, authenticated;

create or replace function public.save_game(p_visitor text, p_hub text, p_slot text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80
     or p_hub is null or length(trim(p_hub)) not between 1 and 40
     or p_slot is null or length(trim(p_slot)) not between 1 and 80
     or p_data is null or length(p_data::text) > 200000 then
    return false;
  end if;

  insert into public.game_saves as current_save (visitor_id, hub, slot, data, updated_at)
  values (p_visitor, p_hub, p_slot, p_data, now())
  on conflict (visitor_id, hub, slot) do update
    set data = excluded.data, updated_at = excluded.updated_at
    where current_save.updated_at <= now() - interval '5 seconds';
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;
revoke all on function public.save_game(text, text, text, jsonb) from public;
grant execute on function public.save_game(text, text, text, jsonb) to anon, authenticated;

create or replace function public.load_game(p_visitor text, p_hub text, p_slot text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select s.data
  from public.game_saves s
  where s.visitor_id = p_visitor and s.hub = p_hub and s.slot = p_slot
  limit 1;
$$;
revoke all on function public.load_game(text, text, text) from public;
grant execute on function public.load_game(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- spaced repetition
create table if not exists public.srs_state (
  visitor_id text not null,
  hub text not null,
  qid text not null,
  b integer not null,
  due date not null,
  t date not null,
  primary key (visitor_id, hub, qid)
);
alter table public.srs_state enable row level security;
revoke all on table public.srs_state from public, anon, authenticated;

create or replace function public.get_my_srs(p_visitor text, p_hub text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('qid', s.qid, 'b', s.b, 'due', s.due, 't', s.t) order by s.qid),
    '[]'::jsonb
  )
  from public.srs_state s
  where s.visitor_id = p_visitor and s.hub = p_hub;
$$;
revoke all on function public.get_my_srs(text, text) from public;
grant execute on function public.get_my_srs(text, text) to anon, authenticated;

create or replace function public.upsert_srs(p_visitor text, p_hub text, p_rows jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80
     or p_hub is null or length(trim(p_hub)) not between 1 and 40 then
    return false;
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then return false; end if;
  if jsonb_array_length(p_rows) > 200 then return false; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) as e(item)
    where jsonb_typeof(e.item) is distinct from 'object'
       or jsonb_typeof(e.item -> 'qid') is distinct from 'string'
       or length(e.item ->> 'qid') not between 1 and 160
       or jsonb_typeof(e.item -> 'b') is distinct from 'number'
       or (e.item ->> 'b') !~ '^-?[0-9]+$'
       or case
            when (e.item ->> 'b') ~ '^-?[0-9]+$' and length(e.item ->> 'b') <= 11
              then (e.item ->> 'b')::numeric < -2147483648
                or (e.item ->> 'b')::numeric > 2147483647
            else true
          end
       or jsonb_typeof(e.item -> 'due') is distinct from 'string'
       or (e.item ->> 'due') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
       or jsonb_typeof(e.item -> 't') is distinct from 'string'
       or (e.item ->> 't') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ) then
    return false;
  end if;

  begin
    insert into public.srs_state as current_srs (visitor_id, hub, qid, b, due, t)
    select p_visitor, p_hub, x.qid, x.b, x.due, x.t
    from (
      select distinct on (e.item ->> 'qid')
        e.item ->> 'qid' as qid,
        (e.item ->> 'b')::integer as b,
        (e.item ->> 'due')::date as due,
        (e.item ->> 't')::date as t,
        e.ordinality
      from jsonb_array_elements(p_rows) with ordinality as e(item, ordinality)
      order by e.item ->> 'qid', (e.item ->> 't')::date desc, e.ordinality desc
    ) as x
    on conflict (visitor_id, hub, qid) do update
      set b = excluded.b, due = excluded.due, t = excluded.t
      where excluded.t > current_srs.t;
  exception
    when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
      return false;
  end;
  return true;
end;
$$;
revoke all on function public.upsert_srs(text, text, jsonb) from public;
grant execute on function public.upsert_srs(text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- answer summaries
create or replace function public.get_my_latest(p_visitor text, p_hub text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(
      a.qid,
      jsonb_build_array(a.last_correct, a.last_at, a.attempts, a.first_correct)
    ),
    '{}'::jsonb
  )
  from (
    select pa.qid,
      (array_agg(pa.correct order by pa.answered_at desc, pa.id desc))[1] as last_correct,
      max(pa.answered_at) as last_at,
      count(*)::integer as attempts,
      (array_agg(pa.correct order by pa.answered_at, pa.id))[1] as first_correct
    from public.personal_answers pa
    where pa.visitor_id = p_visitor and pa.hub = p_hub
    group by pa.qid
  ) as a;
$$;
revoke all on function public.get_my_latest(text, text) from public;
grant execute on function public.get_my_latest(text, text) to anon, authenticated;

create or replace function public.get_question_stats_lite(p_hub text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(s.qid, jsonb_build_array(s.attempts, s.correct)),
    '{}'::jsonb
  )
  from public.question_stats s
  where s.hub = p_hub;
$$;
revoke all on function public.get_question_stats_lite(text) from public;
grant execute on function public.get_question_stats_lite(text) to anon, authenticated;

-- ---------------------------------------------------------------- activity pings
alter table public.activity_pings add column if not exists device text;
alter table public.activity_pings enable row level security;

-- Replace the old four-argument overload so legacy callers resolve to this
-- function through the trailing defaulted p_device parameter.
drop function if exists public.record_activity_ping(text, text, text, text);
create or replace function public.record_activity_ping(
  p_visitor text,
  p_visit text,
  p_hub text,
  p_section text,
  p_device text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_visit is null or length(trim(p_visit)) = 0 then return; end if;
  insert into public.activity_pings (visitor_id, visit_id, hub, section, device, pinged_at)
  values (
    p_visitor,
    p_visit,
    coalesce(p_hub, ''),
    nullif(p_section, ''),
    case lower(trim(coalesce(p_device, '')))
      when 'phone' then 'phone'
      when 'tablet' then 'tablet'
      when 'desktop' then 'desktop'
      else null
    end,
    now()
  );
end;
$$;
revoke all on function public.record_activity_ping(text, text, text, text, text) from public;
grant execute on function public.record_activity_ping(text, text, text, text, text) to anon, authenticated;

create or replace function public.get_today_reach(p_hub text, p_prefix text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today_start timestamptz;
  v_tomorrow_start timestamptz;
begin
  if p_hub is null or p_prefix is null or length(trim(p_prefix)) = 0 or length(p_prefix) > 160 then
    return 0;
  end if;
  v_today_start := date_trunc('day', now() at time zone 'America/Chicago') at time zone 'America/Chicago';
  v_tomorrow_start := (date_trunc('day', now() at time zone 'America/Chicago') + interval '1 day') at time zone 'America/Chicago';
  return (
    select count(distinct a.visitor_id)::integer
    from public.activity_pings a
    where a.hub = p_hub
      and a.section is not null
      and left(a.section, length(p_prefix)) = p_prefix
      and a.pinged_at >= v_today_start
      and a.pinged_at < v_tomorrow_start
  );
end;
$$;
revoke all on function public.get_today_reach(text, text) from public;
grant execute on function public.get_today_reach(text, text) to anon, authenticated;

-- ---------------------------------------------------------------- device linking
-- redeem_link_code is copied from migration_v15. Preserve its existing merge
-- behavior and also move game saves / SRS state, keeping the newest row.
create or replace function public.redeem_link_code(p_code text, p_visitor text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  if (
    select count(*) from public.link_attempts
    where visitor_id = p_visitor and tried_at > now() - interval '1 hour'
  ) >= 10 then return null; end if;
  insert into public.link_attempts (visitor_id) values (p_visitor);
  select visitor_id into p from public.link_codes where code = c and created_at > now() - interval '10 minutes';
  if p is null then return null; end if;
  delete from public.link_codes where code = c;
  if p = p_visitor then return p; end if;
  -- follow an existing chain so everything ends on one id
  p := coalesce((select primary_id from public.visitor_links where alias_id = p), p);

  update public.personal_answers set visitor_id = p where visitor_id = p_visitor;
  update public.arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update public.egg_events set visitor_id = p where visitor_id = p_visitor;
  update public.activity_pings set visitor_id = p where visitor_id = p_visitor;
  update public.nuke_launches set visitor_id = p where visitor_id = p_visitor;

  insert into public.game_saves as current_save (visitor_id, hub, slot, data, updated_at)
  select p, hub, slot, data, updated_at from public.game_saves where visitor_id = p_visitor
  on conflict (visitor_id, hub, slot) do update
    set data = excluded.data, updated_at = excluded.updated_at
    where excluded.updated_at > current_save.updated_at;
  delete from public.game_saves where visitor_id = p_visitor;

  insert into public.srs_state as current_srs (visitor_id, hub, qid, b, due, t)
  select p, hub, qid, b, due, t from public.srs_state where visitor_id = p_visitor
  on conflict (visitor_id, hub, qid) do update
    set b = excluded.b, due = excluded.due, t = excluded.t
    where excluded.t > current_srs.t;
  delete from public.srs_state where visitor_id = p_visitor;

  insert into public.achievements (visitor_id, kind, hub, created_at)
  select p, kind, hub, created_at from public.achievements where visitor_id = p_visitor
  on conflict do nothing;
  delete from public.achievements where visitor_id = p_visitor;
  insert into public.survey_responses (survey_id, visitor_id, answers, created_at)
  select survey_id, p, answers, created_at from public.survey_responses where visitor_id = p_visitor
  on conflict do nothing;
  delete from public.survey_responses where visitor_id = p_visitor;
  insert into public.ui_click_reach (day, hub, target, visitor_id)
  select day, hub, target, p from public.ui_click_reach where visitor_id = p_visitor
  on conflict do nothing;
  delete from public.ui_click_reach where visitor_id = p_visitor;
  insert into public.correct_streaks (visitor_id, current_streak, best_streak, updated_at)
    select p, current_streak, best_streak, updated_at from public.correct_streaks where visitor_id = p_visitor
    on conflict (visitor_id) do update set
      best_streak = greatest(correct_streaks.best_streak, excluded.best_streak),
      current_streak = case
        when excluded.updated_at > correct_streaks.updated_at then excluded.current_streak
        else correct_streaks.current_streak
      end,
      updated_at = greatest(correct_streaks.updated_at, excluded.updated_at);
  delete from public.correct_streaks where visitor_id = p_visitor;
  -- keep a chosen name if the first device had none
  insert into public.visitor_names (visitor_id, display_name, updated_at)
  select p, display_name, updated_at from public.visitor_names where visitor_id = p_visitor
  on conflict (visitor_id) do nothing;
  delete from public.visitor_names where visitor_id = p_visitor;
  update public.visitor_links set primary_id = p where primary_id = p_visitor;
  insert into public.visitor_links (alias_id, primary_id) values (p_visitor, p)
  on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  return p;
end;
$$;
revoke all on function public.redeem_link_code(text, text) from public;
grant execute on function public.redeem_link_code(text, text) to anon, authenticated;
