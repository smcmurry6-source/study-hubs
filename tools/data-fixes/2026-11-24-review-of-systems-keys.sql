-- Review of Systems' class numbers after the lessons audit of 2026-11-24 fixed 52 answer keys (51 in Head & Neck, one in
-- Fundamentals I, f1-biomol-03). Each key pointed one choice past the right answer, the one its explanation and why lines
-- describe (students reported ten of them on 11-23 and 11-24). The audit moved each key back one place; nothing else about
-- the question moved, so the class's picks per choice (question_choices, stored by position) are still right.
-- Why: question_stats (the "% of the class got it right" line under each answered card) counted every answer against the
-- wrong key: someone who picked the right choice was counted wrong, and someone who picked the keyed one, right.
-- How: each fixed question's correct count becomes the picks on its corrected choice (every answer to these single-answer
-- questions records its pick in question_choices, retries included, as question_stats counts them), never more than its
-- attempts. A recount, not an increment: safe to run twice, and an answer saved after the new keys are loaded (After merge
-- loads them) counts the same way.
-- Not changed: each person's own answers (personal_answers stores only right or wrong, not the pick, so they can't be
-- regraded: a question someone got right and was told was wrong stays among their misses until they answer it again), the
-- XP already paid (never taken back), and question health (a changed key is a new version of the question, whose numbers
-- start fresh by themselves).
begin;
with fix(qid, k) as (values
  ('f1-biomol-03', 0),
  ('hn-face-01', 1),
  ('hn-face-03', 2),
  ('hn-face-05', 0),
  ('hn-face-06', 2),
  ('hn-face-07', 1),
  ('hn-face-08', 3),
  ('hn-face-09', 1),
  ('hn-face-10', 2),
  ('hn-face-11', 3),
  ('hn-face-12', 1),
  ('hn-face-13', 0),
  ('hn-face-14', 2),
  ('hn-itf-01', 1),
  ('hn-itf-06', 1),
  ('hn-itf-07', 2),
  ('hn-itf-08', 0),
  ('hn-itf-09', 3),
  ('hn-itf-10', 1),
  ('hn-itf-11', 2),
  ('hn-itf-12', 3),
  ('hn-itf-13', 0),
  ('hn-neck-11', 0),
  ('hn-neck-14', 0),
  ('hn-neck-15', 2),
  ('hn-oral-02', 2),
  ('hn-oral-03', 1),
  ('hn-oral-04', 3),
  ('hn-oral-06', 3),
  ('hn-oral-07', 1),
  ('hn-oral-10', 2),
  ('hn-oral-11', 0),
  ('hn-oral-14', 0),
  ('hn-oral-15', 2),
  ('hn-phx-01', 2),
  ('hn-phx-03', 0),
  ('hn-phx-05', 3),
  ('hn-phx-07', 1),
  ('hn-phx-08', 2),
  ('hn-phx-09', 0),
  ('hn-phx-10', 3),
  ('hn-phx-12', 2),
  ('hn-phx-13', 3),
  ('hn-phx-14', 1),
  ('hn-phx-15', 0),
  ('hn-skull-03', 0),
  ('hn-skull-08', 2),
  ('hn-skull-10', 0),
  ('hn-skull-12', 2),
  ('hn-skull-13', 3),
  ('hn-skull-14', 1),
  ('hn-skull-15', 0))
update question_stats s
set correct = least(s.attempts, coalesce((select c.picks from question_choices c where c.hub = s.hub and c.qid = s.qid and c.choice = fix.k), 0))
from fix
where s.hub = 'review-of-systems' and s.qid = fix.qid;
commit;
