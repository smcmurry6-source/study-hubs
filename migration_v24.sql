-- migration_v24 (2026-09-29): exam check-ins can be sent more than once and stay open longer.
-- The dashboard now shows the check-in as a pop-up on someone's first visit after an exam (however late), and every
-- hub card with a finished exam, including archived hubs' cards, keeps a "Check in" button for 60 days. So:
--   - one person can send several check-ins for the same exam (up to 10), each its own row;
--   - accepted up to 90 days after the exam (was 21);
--   - "Not now" is no longer recorded (null answers are rejected).

alter table public.exam_debriefs drop constraint if exists exam_debriefs_hub_exam_visitor_id_key;
create index if not exists exam_debriefs_who_idx on public.exam_debriefs (hub, exam, visitor_id);
delete from public.exam_debriefs where answers is null;

create or replace function public.submit_exam_debrief(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or length(p_hub) not between 1 and 40 then return false; end if;
  if p_exam is null or p_exam !~ '^\d{4}-\d{2}-\d{2}' or length(p_exam) > 60 then return false; end if;
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or p_answers = '{}'::jsonb or length(p_answers::text) > 3000 then return false; end if;
  -- only for an exam that has happened, and not forever after
  if left(p_exam, 10)::date >= (now() at time zone 'America/Chicago')::date
     or left(p_exam, 10)::date < (now() at time zone 'America/Chicago')::date - 90 then return false; end if;
  if (select count(*) from exam_debriefs where hub = p_hub and exam = p_exam and visitor_id = p_visitor) >= 10 then return false; end if;
  insert into exam_debriefs (hub, exam, visitor_id, answers) values (p_hub, p_exam, p_visitor, p_answers);
  return true;
exception when others then return false;
end;
$$;
