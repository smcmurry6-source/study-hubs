-- Class data after the Occlusion question bank audit (2026-11-15; Sam asked for the audit). Run once, right after the PR
-- merges, in the Supabase SQL editor (or through the connector with Sam's OK).
-- Why: ids, keys and choice order were kept, but some choices were rewritten to mean something else, and a few questions were
-- re-aimed at a different fact. The class numbers are stored by question and choice position, so old picks would show beside
-- the new choices (the same problem as tools/data-fixes/2026-11-14-in-bennett.sql).
-- How: each rewritten choice's count becomes the picks made on the question's NEW version only, counted from question_events
-- (every answer carries the version v of the page that showed it). The versions below are the page's own fingerprints
-- (shQH.fp) of the merged questions, read from the hub in the preview; three untouched questions' fingerprints, read the
-- same way, match the live events exactly. A select-all answer stores no choice in question_events, so a rewritten
-- select-all choice starts again from 0. For the questions re-aimed as a whole (every choice listed, and cs-in-crown-lab,
-- whose case changed), question_stats (the "% of the class got it right" line) is recounted from the new version too.
-- If a question here is edited again before this runs, its version changes: read the new one first.
begin;
with fix(qid, v, choice, multi) as (values
  ('nc-ws-2', '2kft8julz4', 2, false),
  ('nc-wf-1', '1ctwu6534u1', 1, false),
  ('nc-sel-acid', '1jjhhn8ayso', 1, true),
  ('nc-citric', 'vi3scb2f71', 2, false),
  ('nc-tf-1', '22latilh7wm', 0, false),
  ('nc-tf-1', '22latilh7wm', 1, false),
  ('mo-histo', '4mdoa6t2jw', 3, false),
  ('mo-wf-mobility', 'obyayxthdu', 3, false),
  ('mo-wf-tmd', '21gm3keapmm', 1, false),
  ('mo-wf-tmd', '21gm3keapmm', 2, false),
  ('mo-wf-tmd', '21gm3keapmm', 3, false),
  ('mo-ws-splint', '1fzvdkus9g3', 2, false),
  ('mo-ws-splint', '1fzvdkus9g3', 3, false),
  ('mo-tmd-split', '1yhow1s3e4p', 3, false),
  ('mo-cause', '19c4grhe15u', 1, false),
  ('mo-tuesday', '1gzo07hip8q', 1, false),
  ('mo-lit-weak', '1risxreubrt', 2, false),
  ('mo-class2', '10l5yx4qqht', 2, false),
  ('mo-class2', '10l5yx4qqht', 3, false),
  ('mo-new-medio', '1t52mmuzphq', 2, false),
  ('mo-philosophy', '174wtg2q9vk', 2, false),
  ('mo-philosophy', '174wtg2q9vk', 3, false),
  ('mo-direction', 'z4zu98ezzd', 2, false),
  ('mo-direction', 'z4zu98ezzd', 3, false),
  ('mo-where', '1i1jhjpkdnj', 3, false),
  ('mo-num-6', 'k6pbx4a9i8', 1, false),
  ('mo-num-6', 'k6pbx4a9i8', 2, false),
  ('mo-num-6', 'k6pbx4a9i8', 3, false),
  ('mo-num-1', '10t1m88g4al', 3, false),
  ('mo-num-5', '256jw6u2h38', 0, false),
  ('mo-gerd', '169y8cqd2do', 2, false),
  ('mo-wear-first', '16n1h5l0wh2', 3, false),
  ('mo-scallop', '27fv0slb2wl', 2, false),
  ('mo-scallop', '27fv0slb2wl', 3, false),
  ('ot-sel-clin', '11ktqlmktvq', 4, true),
  ('ot-2s-1', 'knh663npjt', 0, false),
  ('ot-2s-1', 'knh663npjt', 1, false),
  ('ot-2s-1', 'knh663npjt', 2, false),
  ('ot-2s-1', 'knh663npjt', 3, false),
  ('ot-wf-2', '1gg2cs1vslv', 2, false),
  ('ot-wf-2', '1gg2cs1vslv', 3, false),
  ('ot-ws-2', '1c53fp225dj', 2, false),
  ('ot-ws-2', '1c53fp225dj', 3, false),
  ('ot-ws-1', 'a5pvusxlxv', 1, false),
  ('ot-mob-dep', 'xvgt405gck', 0, false),
  ('in-num-4', '28nhqaz5qmn', 0, false),
  ('in-num-4', '28nhqaz5qmn', 2, false),
  ('in-wf-artic', '1teaf2faogn', 1, false),
  ('dn-wf-co', '1ugqvlu7k9v', 3, false),
  ('dn-ling-ant', 'm4vjer6ylu', 3, false),
  ('dn-fit', '29xnkjycfvu', 2, false),
  ('dn-fit', '29xnkjycfvu', 3, false),
  ('dn-num-4', 'yn29eg6qpb', 2, false),
  ('dn-num-3', '1nvy073fs9i', 0, false),
  ('dn-num-3', '1nvy073fs9i', 1, false),
  ('dn-num-3', '1nvy073fs9i', 2, false),
  ('dn-num-3', '1nvy073fs9i', 3, false),
  ('dn-num-7', 'qdrlry9ket', 0, false),
  ('dn-num-7', 'qdrlry9ket', 1, false),
  ('dn-num-7', 'qdrlry9ket', 2, false),
  ('dn-num-7', 'qdrlry9ket', 3, false),
  ('dn-wf-ling', 'bm83ea4eyp', 1, false),
  ('dn-wf-ling', 'bm83ea4eyp', 3, false),
  ('dn-2s-1', 'jl4j7z1myf', 0, false),
  ('dn-2s-1', 'jl4j7z1myf', 1, false),
  ('dn-2s-1', 'jl4j7z1myf', 2, false),
  ('dn-2s-1', 'jl4j7z1myf', 3, false),
  ('dn-2s-10', 'ig4dp6dw1l', 0, false),
  ('dn-2s-10', 'ig4dp6dw1l', 1, false),
  ('dn-2s-10', 'ig4dp6dw1l', 2, false),
  ('dn-2s-10', 'ig4dp6dw1l', 3, false),
  ('dn-tf-5', '90z4td8d5k', 0, false),
  ('dn-tf-5', '90z4td8d5k', 1, false)
)
update question_choices c
   set picks = case when f.multi then 0 else (select count(*) from question_events e
                 where e.hub = 'occlusion' and e.qid = f.qid and e.kind = 'answer' and e.v = f.v and e.choice = f.choice) end
  from fix f
 where c.hub = 'occlusion' and c.qid = f.qid and c.choice = f.choice;
with whole(qid, v) as (values
  ('cs-in-crown-lab', 'rk44ipjy8u'),
  ('nc-tf-1', '22latilh7wm'),
  ('ot-2s-1', 'knh663npjt'),
  ('dn-num-3', '1nvy073fs9i'),
  ('dn-num-7', 'qdrlry9ket'),
  ('dn-2s-1', 'jl4j7z1myf'),
  ('dn-2s-10', 'ig4dp6dw1l'),
  ('dn-tf-5', '90z4td8d5k')
)
update question_stats s
   set attempts = (select count(*) from question_events e where e.hub = 'occlusion' and e.qid = w.qid and e.kind = 'answer' and e.v = w.v),
       correct  = (select count(*) from question_events e where e.hub = 'occlusion' and e.qid = w.qid and e.kind = 'answer' and e.v = w.v and e.correct)
  from whole w
 where s.hub = 'occlusion' and s.qid = w.qid;
select qid, choice, picks from question_choices
 where hub = 'occlusion' and qid in ('nc-ws-2', 'nc-wf-1', 'nc-sel-acid', 'nc-citric', 'nc-tf-1', 'mo-histo', 'mo-wf-mobility', 'mo-wf-tmd', 'mo-ws-splint', 'mo-tmd-split', 'mo-cause', 'mo-tuesday', 'mo-lit-weak', 'mo-class2', 'mo-new-medio', 'mo-philosophy', 'mo-direction', 'mo-where', 'mo-num-6', 'mo-num-1', 'mo-num-5', 'mo-gerd', 'mo-wear-first', 'mo-scallop', 'ot-sel-clin', 'ot-2s-1', 'ot-wf-2', 'ot-ws-2', 'ot-ws-1', 'ot-mob-dep', 'in-num-4', 'in-wf-artic', 'dn-wf-co', 'dn-ling-ant', 'dn-fit', 'dn-num-4', 'dn-num-3', 'dn-num-7', 'dn-wf-ling', 'dn-2s-1', 'dn-2s-10', 'dn-tf-5') order by qid, choice;
commit;
