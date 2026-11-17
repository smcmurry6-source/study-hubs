-- v60 (2026-11-17): a reward for a survey or an exam check-in. Sam: "Also give 500xp and 1000 crowns as a reward for
-- completing a survey or check in. Only reward for the first submission of each".
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js, admin-ops.js). Applied to the live
-- project on 2026-11-17 through the Supabase connector, at Sam's "merge" (PR #387).
--
-- 1. Two new award kinds, `survey` and `checkin` (xp_awards.src). Each pays +500 XP once, through sh_award, so it is a row
--    keyed per visitor: `survey:<survey id>` and `checkin:<hub>:<exam>` (the exam string the check-in carries, e.g.
--    '2026-11-16 Final'). A replayed call, a second check-in for the same exam or a linked device's copy pays nothing more
--    (Link my devices dedupes award rows by key). Not boosted: like medals and fixed reports, a double XP boost doesn't
--    double it. Paid to the linked id (visitor_links), as a fixed report is.
-- 2. "Only the first submission of each": a survey answered (not "Later") for the first time pays; its row can't be
--    answered twice anyway (unique per survey and visitor). An exam check-in pays only when nobody on this visitor's
--    linked ids had checked in for that hub and exam before, so someone who checked in before this release gets nothing
--    for checking in again. Back pay only for the survey active on 11-17 and
--    Occlusion's final check-ins (Sam), in tools/data-fixes/2026-11-17-reward-backpay.sql, run after this migration.
-- 3. 1,000 Shiny Gold Crowns per reward. The crowns come from sh_wallet, which works them out from the award rows (1,000 a
--    `survey` or `checkin` row) and leaves those rows' XP out of the "1 crown per 10 XP" share, so the reward pays exactly
--    1,000 crowns, not 1,050. No new column: redeem_link_code copies award rows by column, and the kind travels with them.
-- 4. submit_survey and submit_exam_debrief keep their signatures and still answer true or false (the old single-file hub
--    pages call them through widget/replies.js and v3.js). They pay too. submit_survey_v2 and submit_exam_debrief_v2 answer
--    { ok, xp, crowns } so the dashboard and the Inbox can say what was paid; the pages fall back to the old name when the
--    _v2 one isn't there.

alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin'));

-- pays a survey's or a check-in's reward once: 500 XP (and, through sh_wallet, 1,000 crowns); returns the XP paid
create or replace function public.sh_form_reward(p_visitor text, p_key text, p_src text, p_hub text)
returns integer language plpgsql security definer set search_path = public as $$
declare me text;
begin
  if p_visitor is null or p_src not in ('survey', 'checkin') then return 0; end if;
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  return sh_award(me, p_key, p_src, coalesce(p_hub, ''), 500, 1, now());
end;
$$;

create or replace function public.sh_submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare paid int := 0;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false); end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 4000) then return jsonb_build_object('ok', false); end if;
  if not exists (select 1 from surveys where id = p_survey and active) then return jsonb_build_object('ok', false); end if;
  insert into survey_responses (survey_id, visitor_id, answers) values (p_survey, p_visitor, p_answers)
    on conflict (survey_id, visitor_id) do update set answers = excluded.answers, created_at = now()
    where survey_responses.answers is null and excluded.answers is not null;
  if not found then return jsonb_build_object('ok', false); end if;
  if p_answers is not null then paid := sh_form_reward(p_visitor, 'survey:' || p_survey, 'survey', ''); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'crowns', case when paid > 0 then 1000 else 0 end);
end;
$$;

create or replace function public.submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((sh_submit_survey(p_survey, p_visitor, p_answers)->>'ok')::boolean, false);
$$;

create or replace function public.submit_survey_v2(p_survey bigint, p_visitor text, p_answers jsonb)
returns jsonb language sql security definer set search_path = public as $$
  select sh_submit_survey(p_survey, p_visitor, p_answers);
$$;

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

create or replace function public.submit_exam_debrief(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((sh_submit_exam_debrief(p_hub, p_exam, p_visitor, p_answers)->>'ok')::boolean, false);
$$;

create or replace function public.submit_exam_debrief_v2(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns jsonb language sql security definer set search_path = public as $$
  select sh_submit_exam_debrief(p_hub, p_exam, p_visitor, p_answers);
$$;

-- the wallet (migration_v54), plus 1,000 crowns a survey or check-in reward; those rewards' XP earns no crowns of its own
create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; form_xp int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[]; m_now text[]; m_was text[];
  n_t int; n_m int; n_r int; earned int; spent int;
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  select coalesce(sum(a.xp - a.base), 0) into extra from xp_awards a where a.visitor_id = p_visitor;
  select coalesce(sum(a.base), 0), count(*) into form_xp, n_f from xp_awards a where a.visitor_id = p_visitor and a.src in ('survey', 'checkin');
  base_xp := greatest(0, v_xp - extra - form_xp);
  select * into bl from game_baseline where visitor_id = p_visitor;
  badges := array(select jsonb_array_elements_text(coalesce(get_rank_profile_v2(p_visitor)->'badges', '[]'::jsonb)));
  t_now := array(select distinct split_part(b, ':', 1) from unnest(badges) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  t_was := array(select distinct split_part(b, ':', 1) from unnest(coalesce(bl.badges, '{}')) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  m_now := array(select b from unnest(badges) b where b like 'mastery-%:%');
  m_was := array(select b from unnest(coalesce(bl.badges, '{}')) b where b like 'mastery-%:%');
  n_t := (select count(*) from unnest(t_now) z where not (z = any(t_was)));
  n_m := (select count(*) from unnest(m_now) z where not (z = any(m_was)));
  n_r := greatest(0, (select gtier from sh_rank(v_xp)) - (select gtier from sh_rank(coalesce(bl.xp, 0))));
  earned := base_xp / 10 + 25 * n_t + 50 * n_m + 20 * n_r + 1000 * n_f;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 10,
    'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'rewards', n_f);
end;
$$;

revoke all on function public.sh_form_reward(text, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_submit_survey(bigint, text, jsonb) from public, anon, authenticated;
revoke all on function public.sh_submit_exam_debrief(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;
grant execute on function public.submit_survey(bigint, text, jsonb) to anon, authenticated;
grant execute on function public.submit_exam_debrief(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.submit_survey_v2(bigint, text, jsonb) to anon, authenticated;
grant execute on function public.submit_exam_debrief_v2(text, text, text, jsonb) to anon, authenticated;
