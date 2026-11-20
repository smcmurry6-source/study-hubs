-- Class picks and accuracy after the statement-key fix (lessons audit 2026-11-04, Sam's OK needed).
-- Why: PCD Implants and Special Patient Care statement questions were reordered or rewritten (same ids), and the class picks
-- on each choice (question_choices) are stored by position. Moved rows: matched by statement text. Rewritten items: cleared.
-- Tested on a throwaway Postgres with synthetic rows. Not yet run on production (see the PR).
-- Run once, right after the PR merges. Moved rows go to choice+100 first, then back, so no two rows share a key midway.
begin;
-- pcd-implants-exam1 bm-2s-4
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='bm-2s-4' and c.choice = m.a;
-- pcd-implants-exam1 bm-num-2
update question_choices c set choice = m.b + 100 from (values (0,2),(1,0),(2,1),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='bm-num-2' and c.choice = m.a;
-- pcd-implants-exam1 bm-num-3 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='pcd-implants-exam1' and qid='bm-num-3' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,0),(2,1),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='bm-num-3' and c.choice = m.a;
-- pcd-implants-exam1 cb-num-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,3),(2,2),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='cb-num-2' and c.choice = m.a;
-- pcd-implants-exam1 cb-num-3
update question_choices c set choice = m.b + 100 from (values (0,1),(1,2),(2,0),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='cb-num-3' and c.choice = m.a;
-- pcd-implants-exam1 ev-2s-5
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='ev-2s-5' and c.choice = m.a;
-- pcd-implants-exam1 ev-num-3
update question_choices c set choice = m.b + 100 from (values (0,1),(1,0),(2,2),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='ev-num-3' and c.choice = m.a;
-- pcd-implants-exam1 gs-num-1
update question_choices c set choice = m.b + 100 from (values (0,0),(1,3),(2,2),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='gs-num-1' and c.choice = m.a;
-- pcd-implants-exam1 gs-num-3
update question_choices c set choice = m.b + 100 from (values (0,0),(1,2),(2,3),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='gs-num-3' and c.choice = m.a;
-- pcd-implants-exam1 im-2s-3
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='im-2s-3' and c.choice = m.a;
-- pcd-implants-exam1 im-num-1
update question_choices c set choice = m.b + 100 from (values (0,0),(1,3),(2,2),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='im-num-1' and c.choice = m.a;
-- pcd-implants-exam1 im-num-2
update question_choices c set choice = m.b + 100 from (values (0,2),(1,0),(2,1),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='im-num-2' and c.choice = m.a;
-- pcd-implants-exam1 in-2s-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='in-2s-2' and c.choice = m.a;
-- pcd-implants-exam1 in-num-2 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='pcd-implants-exam1' and qid='in-num-2' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,3),(2,0),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='in-num-2' and c.choice = m.a;
-- pcd-implants-exam1 pf-2s-4
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='pf-2s-4' and c.choice = m.a;
-- pcd-implants-exam1 pf-num-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,2),(2,3),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='pf-num-2' and c.choice = m.a;
-- pcd-implants-exam1 pf-num-3
update question_choices c set choice = m.b + 100 from (values (0,1),(1,2),(2,0),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='pf-num-3' and c.choice = m.a;
-- pcd-implants-exam1 su-2s-3
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='su-2s-3' and c.choice = m.a;
-- pcd-implants-exam1 su-num-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,3),(2,2),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='su-num-2' and c.choice = m.a;
-- pcd-implants-exam1 su-num-3
update question_choices c set choice = m.b + 100 from (values (0,0),(1,2),(2,3),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='su-num-3' and c.choice = m.a;
-- pcd-implants-exam1 tm-2s-1
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='tm-2s-1' and c.choice = m.a;
-- pcd-implants-exam1 tm-num-1
update question_choices c set choice = m.b + 100 from (values (0,0),(1,2),(2,3),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='tm-num-1' and c.choice = m.a;
-- pcd-implants-exam1 tm-num-2 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='pcd-implants-exam1' and qid='tm-num-2' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,0),(2,3),(3,1)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='tm-num-2' and c.choice = m.a;
-- pcd-implants-exam1 tm-num-4
update question_choices c set choice = m.b + 100 from (values (0,1),(1,0),(2,2),(3,3)) m(a,b) where c.hub='pcd-implants-exam1' and c.qid='tm-num-4' and c.choice = m.a;
-- pcd-implants-exam1: statements rewritten, so the old picks and accuracy describe a different question
delete from question_choices where hub='pcd-implants-exam1' and qid in ('bm-2s-1','bm-2s-3','bm-2s-5','bm-num-1','cb-2s-1','cb-2s-4','cb-num-1','ev-2s-2','ev-2s-4','ev-num-1','gs-2s-2','gs-2s-4','im-2s-1','im-2s-2','in-2s-1','in-2s-4','in-2s-5','pf-2s-1','pf-2s-2','pf-num-1','su-num-4','tm-2s-2','tm-2s-6');
delete from question_stats where hub='pcd-implants-exam1' and qid in ('bm-2s-1','bm-2s-3','bm-2s-5','bm-num-1','cb-2s-1','cb-2s-4','cb-num-1','ev-2s-2','ev-2s-4','ev-num-1','gs-2s-2','gs-2s-4','im-2s-1','im-2s-2','in-2s-1','in-2s-4','in-2s-5','pf-2s-1','pf-2s-2','pf-num-1','su-num-4','tm-2s-2','tm-2s-6');
-- special-patient-care au-num-1 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='au-num-1' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,0),(2,3),(3,1)) m(a,b) where c.hub='special-patient-care' and c.qid='au-num-1' and c.choice = m.a;
-- special-patient-care au-num-2
update question_choices c set choice = m.b + 100 from (values (0,1),(1,0),(2,2),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='au-num-2' and c.choice = m.a;
-- special-patient-care au-num-3
update question_choices c set choice = m.b + 100 from (values (0,2),(1,0),(2,1),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='au-num-3' and c.choice = m.a;
-- special-patient-care bg-2s-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='bg-2s-2' and c.choice = m.a;
-- special-patient-care bg-num-1
update question_choices c set choice = m.b + 100 from (values (0,3),(1,1),(2,0),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='bg-num-1' and c.choice = m.a;
-- special-patient-care bg-num-2 (old choice [2] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='bg-num-2' and choice in (2);
update question_choices c set choice = m.b + 100 from (values (0,1),(1,0),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='bg-num-2' and c.choice = m.a;
-- special-patient-care bg-num-3 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='bg-num-3' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,2),(2,0),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='bg-num-3' and c.choice = m.a;
-- special-patient-care cp-num-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,3),(2,2),(3,1)) m(a,b) where c.hub='special-patient-care' and c.qid='cp-num-2' and c.choice = m.a;
-- special-patient-care cp-num-3
update question_choices c set choice = m.b + 100 from (values (0,2),(1,0),(2,3),(3,1)) m(a,b) where c.hub='special-patient-care' and c.qid='cp-num-3' and c.choice = m.a;
-- special-patient-care ds-num-1 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='ds-num-1' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,1),(2,3),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='ds-num-1' and c.choice = m.a;
-- special-patient-care ds-num-2
update question_choices c set choice = m.b + 100 from (values (0,2),(1,0),(2,1),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='ds-num-2' and c.choice = m.a;
-- special-patient-care in-2s-1
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='in-2s-1' and c.choice = m.a;
-- special-patient-care in-num-3
update question_choices c set choice = m.b + 100 from (values (0,1),(1,2),(2,0),(3,3)) m(a,b) where c.hub='special-patient-care' and c.qid='in-num-3' and c.choice = m.a;
-- special-patient-care mi-2s-2
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='mi-2s-2' and c.choice = m.a;
-- special-patient-care mi-num-3 (old choice [2] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='mi-num-3' and choice in (2);
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='mi-num-3' and c.choice = m.a;
-- special-patient-care pv-num-1
update question_choices c set choice = m.b + 100 from (values (0,3),(1,2),(2,0),(3,1)) m(a,b) where c.hub='special-patient-care' and c.qid='pv-num-1' and c.choice = m.a;
-- special-patient-care sy-2s-5
update question_choices c set choice = m.b + 100 from (values (0,0),(1,1),(2,3),(3,2)) m(a,b) where c.hub='special-patient-care' and c.qid='sy-2s-5' and c.choice = m.a;
-- special-patient-care sy-num-1 (old choice [0] is gone: its row is dropped)
delete from question_choices where hub='special-patient-care' and qid='sy-num-1' and choice in (0);
update question_choices c set choice = m.b + 100 from (values (1,2),(2,1),(3,0)) m(a,b) where c.hub='special-patient-care' and c.qid='sy-num-1' and c.choice = m.a;
-- special-patient-care sy-num-3
update question_choices c set choice = m.b + 100 from (values (0,3),(1,2),(2,0),(3,1)) m(a,b) where c.hub='special-patient-care' and c.qid='sy-num-3' and c.choice = m.a;
-- special-patient-care: statements rewritten, so the old picks and accuracy describe a different question
delete from question_choices where hub='special-patient-care' and qid in ('cp-2s-1','ds-2s-1');
delete from question_stats where hub='special-patient-care' and qid in ('cp-2s-1','ds-2s-1');
update question_choices set choice = choice - 100 where hub in ('pcd-implants-exam1','special-patient-care') and choice >= 100;
commit;
-- summary: {"pcd-implants-exam1": {"moved": 24, "cleared": 23}, "special-patient-care": {"moved": 19, "cleared": 2}}
