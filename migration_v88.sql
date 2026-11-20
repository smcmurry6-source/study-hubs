-- v88 (2026-11-20): a survey asks each person once, not each device.
-- Sam: "Surveys are asking once per device", then, asked what should change: "Once per person" (answering, or saying
-- Later, on one device stops the pop-up on all of that person's devices).
-- get_active_survey (the dashboard's pop-up, the v2 bootstrap's `survey_popup`) skipped a survey only when a row was
-- under the exact id asking, and get_my_survey (the Inbox, the bootstrap's `survey`) only when that id had answered.
-- Link my devices moves a device's rows to the id that remains (redeem_link_code) and the device takes that id, so the
-- usual case already worked. What didn't: a device still holding an id that was linked away from (it was linked to a
-- device that later linked to a third, or it never reloaded), and any row a device wrote under such an id after the
-- link. Both now look across the person: the id that remains (visitor_links' primary_id) and every id linked to it,
-- the way sh_submit_exam_debrief finds a person's first check-in (migration_v60).
-- Devices that were never linked are still two people to the server; the dashboard's pop-up now offers Link my devices
-- for them ("Answered this on another device?", widget/dash.js).
-- Everything else is as it was: the newest live survey, the pop-up skipped after any row (Later included), the Inbox
-- until an answer. Written in PL/pgSQL, not SQL: the bootstrap calls both on every page load, and a security definer
-- SQL function is planned again on every call (migration_v76, vault/reference/shared-infrastructure.md).
-- Two functions replaced, no table touched: a moment, any time of day (vault/how-to/run-sql-on-the-live-database.md).
-- Copied from main's newest copies (migration_v14.sql, migration_v36.sql, as in supabase/schema.sql).

create or replace function public.get_active_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare me text := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
begin
  return query
  select s.id, s.title, s.questions from surveys s
  where s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id
      and (r.visitor_id = p_visitor or r.visitor_id = me
           or r.visitor_id in (select l.alias_id from visitor_links l where l.primary_id = me)))
  order by s.starts_at desc limit 1;
end;
$$;
grant execute on function public.get_active_survey(text) to anon, authenticated;

create or replace function public.get_my_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb, starts_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare me text := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
begin
  if p_visitor is null then return; end if;
  return query
  select s.id, s.title, s.questions, s.starts_at from surveys s
  where s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id and r.answers is not null
      and (r.visitor_id = p_visitor or r.visitor_id = me
           or r.visitor_id in (select l.alias_id from visitor_links l where l.primary_id = me)))
  order by s.starts_at desc limit 1;
end;
$$;
grant execute on function public.get_my_survey(text) to anon, authenticated;
