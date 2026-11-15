-- Class picks after the Bennett question's rewrite (lessons refresh follow-up 2026-11-14; Sam: "Replace the choice", "Run it").
-- Why: Occlusion's `in-bennett` kept its id, key and choice order, but its second choice was rewritten ("Cusp height" became
-- "How steep the cusps can be in protrusion", live with #361 at 2026-11-14 15:18 UTC). The class picks on each choice
-- (question_choices) are stored by position, so the old choice's 9 picks would show beside the new one.
-- Not a plain delete: by the time it could run, students had already picked the new choice (12 picks on 11-15: 9 old + new).
-- So choice 1's count becomes the new version's picks only, counted from question_events (each answer, with the version `v`
-- of the page that showed it): every version seen before the merge is old, every other one is the rewrite.
-- The connector's approval prompt timed out three times (11-14 and 11-15), so Sam runs it in the Supabase SQL editor.
-- Tested on a throwaway Postgres with synthetic rows (tools/release/pg.js). Run once.
begin;
update question_choices c
   set picks = (select count(*) from question_events e
                 where e.hub = 'occlusion' and e.qid = 'in-bennett' and e.kind = 'answer' and e.choice = 1
                   and e.v not in (select distinct o.v from question_events o
                                    where o.hub = 'occlusion' and o.qid = 'in-bennett' and o.at < '2026-11-14 15:18:54+00'))
 where c.hub = 'occlusion' and c.qid = 'in-bennett' and c.choice = 1;
select choice, picks from question_choices where hub = 'occlusion' and qid = 'in-bennett' order by choice;
commit;
