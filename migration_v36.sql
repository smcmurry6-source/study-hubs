-- migration_v36: a survey someone hasn't answered waits in their Inbox.
-- get_my_survey: the live survey this visitor hasn't answered yet ("Later" / "No thanks" rows have null answers and
-- still count as unanswered), for the Inbox in widget/replies.js on every hub and the dashboard.
-- submit_survey: answers sent after a "Later" now replace that empty row instead of being dropped.
create or replace function public.get_my_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.questions, s.starts_at from surveys s
  where p_visitor is not null and s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id and r.visitor_id = p_visitor and r.answers is not null)
  order by s.starts_at desc limit 1;
$$;
grant execute on function public.get_my_survey(text) to anon, authenticated;

-- p_answers null = "later" (recorded so the pop-up isn't offered again; the survey stays in the Inbox until answered)
create or replace function public.submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 4000) then return false; end if;
  if not exists (select 1 from surveys where id = p_survey and active) then return false; end if;
  insert into survey_responses (survey_id, visitor_id, answers) values (p_survey, p_visitor, p_answers)
    on conflict (survey_id, visitor_id) do update set answers = excluded.answers, created_at = now()
    where survey_responses.answers is null and excluded.answers is not null;
  return found;
end;
$$;
