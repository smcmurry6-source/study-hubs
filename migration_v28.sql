-- migration_v28 (2026-10-01)
-- Per-option picks for select-all ("multi") questions. record_choice takes one index, so select-alls
-- recorded nothing and the lessons refresh couldn't see which option tripped people (perio q1-P05,
-- q2-P01). record_choices takes every ticked option (authored indexes) in one call and adds one
-- pick per option to question_choices. For a multi item a row's picks = how often that option was
-- ticked; compare with question_stats.attempts (which also counts answers from before this date).

create or replace function public.record_choices(p_hub text, p_qid text, p_choices integer[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or p_qid is null or p_choices is null
     or cardinality(p_choices) = 0 or cardinality(p_choices) > 10 then return; end if;
  insert into question_choices (hub, qid, choice, picks)
  select p_hub, p_qid, c, 1 from (select distinct unnest(p_choices) c) x where c between 0 and 9
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

grant execute on function public.record_choices(text, text, integer[]) to anon, authenticated;
