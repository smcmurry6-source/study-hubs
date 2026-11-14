-- Class picks after the Bennett question's rewrite (lessons refresh follow-up 2026-11-14; Sam: "Replace the choice").
-- Why: Occlusion's `in-bennett` kept its id, key and choice order, but its second choice was rewritten ("Cusp height" became
-- "How steep the cusps can be in protrusion"). The class picks on each choice (question_choices) are stored by position, so
-- the old choice's picks would show beside the new one. They are cleared; the other choices' rows stay.
-- Tested on a throwaway Postgres with synthetic rows (tools/release/pg.js). Run once, right after the PR merges.
begin;
delete from question_choices where hub = 'occlusion' and qid = 'in-bennett' and choice = 1;
commit;
