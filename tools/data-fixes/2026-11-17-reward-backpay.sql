-- Back pay for the survey and check-in reward (migration_v60.sql). Sam, 2026-11-17: "You can implement backpay for the
-- active survey and occlusion check in only". Run once after migration_v60 is applied; the After merge workflow runs it.
-- Who: everyone who answered the survey that is active today (id 4, not "Later"), and everyone who checked in after
-- Occlusion's final ('2026-11-16 Final'). Occlusion's midterm check-ins and older surveys get nothing.
-- Safe to run twice: sh_form_reward pays through sh_award, once per person and key (`survey:4`,
-- `checkin:occlusion:2026-11-16 Final`), on the linked id, so someone already paid by the live functions, or with two linked
-- devices that both sent one, is paid once. Each reward is +500 XP and, through sh_wallet, 1,000 crowns.
begin;
select count(*) filter (where paid > 0) as survey_paid from (
  select sh_form_reward(visitor_id, 'survey:4', 'survey', '') as paid
  from survey_responses where survey_id = 4 and answers is not null order by created_at) s;
select count(*) filter (where paid > 0) as checkin_paid from (
  select sh_form_reward(visitor_id, 'checkin:occlusion:2026-11-16 Final', 'checkin', 'occlusion') as paid
  from (select visitor_id, min(created_at) t from exam_debriefs
        where hub = 'occlusion' and exam = '2026-11-16 Final' group by visitor_id order by t) d) c;
commit;
