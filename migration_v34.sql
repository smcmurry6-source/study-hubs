-- migration_v34 (2026-10-14): question progress follows you across linked devices.
--
-- Every answer is already saved per visitor in personal_answers (record_personal_answer, widget/v3.js), and
-- "Link my devices" (redeem_link_code, migration_v15) moves a device's rows onto the linked id. Nothing read them
-- back, so each hub's own progress (which questions you've tried and got right, Weak Spots, spaced review) stayed
-- on the device it was earned on. widget/v3.js now calls get_my_answers when a hub opens and merges the result
-- into the hub's local state (window.SH_SYNC) and into spaced review.
--
-- Returns one compact jsonb array, oldest first: [[qid, epoch seconds, 1 = right / 0 = wrong], ...], at most the
-- latest 5000 answers (the heaviest user has ~1,100 in one hub). A jsonb value, not a set of rows, so the API's
-- row cap doesn't cut it short. Same access as get_personal_stats: anyone holding the visitor id.

create or replace function public.get_my_answers(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(x.qid, x.t, x.c) order by x.t, x.id), '[]'::jsonb)
  from (
    select a.id, a.qid, floor(extract(epoch from a.answered_at))::bigint as t, case when a.correct then 1 else 0 end as c
    from personal_answers a
    where p_visitor is not null and length(p_visitor) between 1 and 80 and length(coalesce(p_hub, '')) between 1 and 40
      and a.visitor_id = p_visitor and a.hub = p_hub
    order by a.answered_at desc, a.id desc
    limit 5000
  ) x;
$$;

grant execute on function public.get_my_answers(text, text) to anon, authenticated;
