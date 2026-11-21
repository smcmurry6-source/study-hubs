-- v94 (2026-11-21): the bootstrap says whether its name is one someone picked (BUG-196's follow-up).
-- Linked devices share one id, so the server keeps one name for them (visitor_names), and since #518 a device takes the
-- bootstrap's display_name when it differs from its own copy (nameFromServer in widget/v3.js and widget/dash.js). But
-- display_name is the picked name or, without one, the random class name (anon_name), and the bootstrap didn't say which:
-- after "Go back to a random name" on one device, the other took the random name as one it had picked (its name window
-- offered "Go back to a random name"; the idea board asked for a name when it refused one).
--
--   1. get_widget_bootstrap_v2 adds name_custom: true when visitor_names has a row for the id (the name get_display_name
--      returns is one someone picked), false when it is the random one. A device that has a name of its own and gets
--      name_custom false clears its copy. Nothing else changes.
--
-- Copied from main's newest copy: get_widget_bootstrap_v2 (migration_v84, as in supabase/schema.sql); one key added.
-- Applying it: one function replaced (same arguments, so create or replace keeps its grants); nothing is read or
-- rewritten. Any quiet hour; one call.

set local lock_timeout = '3s';

create or replace function public.get_widget_bootstrap_v2(
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
    'name_custom', exists(select 1 from visitor_names where visitor_id = p_visitor),
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

revoke all on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text, bigint, bigint) from public;
grant execute on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text, bigint, bigint) to anon, authenticated;
