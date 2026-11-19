-- v86 (2026-11-19, written as v85; renumbered at the merge: #469's Ask Timmy cache took v85): a closed exam check-in is
-- closed on the server too. Applied live before the renumbering, through the connector, as "v85_closed_checkins".
-- Sam: "close all current check ins except for perio and occlusion final. no one should be able to submit for any older
-- exams". Closing a check-in was only `checkinClosed: true` in hubs.js, which takes away its button and its pop-up on the
-- dashboard; the server still took a check-in for any exam up to 90 days old (sh_submit_exam_debrief, v60), and paid its
-- first one 1,000 XP and 1,000 crowns. A page loaded before the change, or anyone calling the function, could still send one.
--   1. exam_checkins_closed (hub, exam date): the check-ins that are closed. Closed to anon altogether (RLS on, no policy, no
--      privilege; tools/release/rls-expectations.json's anonNone). It holds what hubs.js says: the After merge workflow's
--      "checkins" step (tools/after-merge/run.js) sets it to every exam with checkinClosed in hubs.js whenever a push to main
--      changes hubs.js, so reopening one (taking checkinClosed out) reopens it here too. The rows below are hubs.js's
--      closed exams on 2026-11-19, so it's right from the moment it's applied.
--   2. sh_submit_exam_debrief refuses a check-in for a closed exam ({ok: false, closed: true}; submit_exam_debrief, the old
--      name, answers false), before anything is saved or paid. Everything else is as it was: the 90-day window, the ten a
--      person, the reward once. Check-ins already sent stay on the admin page.
-- A small new table and one function replaced: a moment, any time of day (vault/how-to/run-sql-on-the-live-database.md).
-- sh_submit_exam_debrief is copied from main's newest copy (migration_v60.sql, as in supabase/schema.sql).

create table if not exists public.exam_checkins_closed (
  hub text not null,
  exam_date date not null,
  closed_at timestamptz not null default now(),
  primary key (hub, exam_date)
);
alter table public.exam_checkins_closed enable row level security;
revoke all on table public.exam_checkins_closed from public, anon, authenticated;

insert into public.exam_checkins_closed (hub, exam_date) values
  ('hepatobiliary', '2026-09-18'),
  ('perio', '2026-10-01'),
  ('msk-exam3', '2026-10-02'),
  ('pcd-exam3', '2026-10-15'),
  ('msk-exam4', '2026-10-16'),
  ('occlusion', '2026-10-21'),
  ('heme-endo-exam1', '2026-10-30'),
  ('pcd-implants-exam1', '2026-11-06'),
  ('heme-endo-exam2', '2026-11-13'),
  ('special-patient-care', '2026-11-13')
on conflict do nothing;

create or replace function public.sh_submit_exam_debrief(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text; first boolean; paid int := 0;
begin
  if p_hub is null or length(p_hub) not between 1 and 40 then return jsonb_build_object('ok', false); end if;
  if p_exam is null or p_exam !~ '^\d{4}-\d{2}-\d{2}' or length(p_exam) > 60 then return jsonb_build_object('ok', false); end if;
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false); end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or p_answers = '{}'::jsonb or length(p_answers::text) > 3000 then return jsonb_build_object('ok', false); end if;
  -- only for an exam that has happened (exam day counts), and not forever after
  if left(p_exam, 10)::date > (now() at time zone 'America/Chicago')::date
     or left(p_exam, 10)::date < (now() at time zone 'America/Chicago')::date - 90 then return jsonb_build_object('ok', false); end if;
  -- and not once its check-in is closed (v86: checkinClosed in hubs.js)
  if exists (select 1 from exam_checkins_closed c where c.hub = p_hub and c.exam_date = left(p_exam, 10)::date) then
    return jsonb_build_object('ok', false, 'closed', true);
  end if;
  if (select count(*) from exam_debriefs where hub = p_hub and exam = p_exam and visitor_id = p_visitor) >= 10 then return jsonb_build_object('ok', false); end if;
  -- the first check-in for this hub and exam from any of this person's linked ids
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  first := not exists (select 1 from exam_debriefs d where d.hub = p_hub and d.exam = p_exam
    and (d.visitor_id = me or d.visitor_id in (select alias_id from visitor_links where primary_id = me)));
  insert into exam_debriefs (hub, exam, visitor_id, answers) values (p_hub, p_exam, p_visitor, p_answers);
  if first then paid := sh_form_reward(p_visitor, 'checkin:' || p_hub || ':' || p_exam, 'checkin', p_hub); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'crowns', case when paid > 0 then 1000 else 0 end);
exception when others then return jsonb_build_object('ok', false);
end;
$$;
revoke all on function public.sh_submit_exam_debrief(text, text, text, jsonb) from public, anon, authenticated;
