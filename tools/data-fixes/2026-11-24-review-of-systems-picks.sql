-- Review of Systems' picks per choice and class numbers for the 52 keys fixed on 2026-11-24 (#552), put right after its
-- data fix (tools/data-fixes/2026-11-24-review-of-systems-keys.sql) found nothing to count.
-- What happened: After merge loads a hub's answer keys before it runs a data fix. The key loader
-- (admin_load_question_keys) starts a question's picks again when its choices' version changes, and that version is a
-- fingerprint of the choices *and the key* (choiceVersion() in tools/xp/keys.js), so each fixed question's picks were
-- moved to question_choices_past at 18:26 UTC (31 questions had picks, 105 in all). The recount ran a few seconds later
-- against an empty question_choices and set those 31 questions' correct count to 0.
-- Why moving them back is right: only the key moved; every choice's words and position are the same, so the picks on each
-- choice still mean what they meant (the audit's PR said they would stay).
-- Already run by hand through the Supabase connector at about 18:29 UTC on 2026-11-24, the moment it was found; checked
-- after: 105 picks back under each question's current choice version, none left in question_choices_past, and the 31
-- questions at 52 right of 105 tries. Safe to run again (After merge runs it once when this file merges): the move only
-- takes rows set aside in that one load (moved_at in 18:25-18:30 UTC), which are gone now, and the recount is a recount.
begin;
create temp table fix_k (qid text primary key, k int) on commit drop;
insert into fix_k values
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
  ('hn-skull-15', 0);
-- 1. the picks that load set aside go back under each question's current choice version
insert into question_choices (hub, qid, choice, picks, v)
select p.hub, p.qid, p.choice, p.picks, q.cv
from question_choices_past p
join fix_k f on f.qid = p.qid
join question_keys q on q.hub = p.hub and q.qid = p.qid and q.is_current and not q.retired
where p.hub = 'review-of-systems' and p.moved_at >= '2026-11-24 18:25:00+00' and p.moved_at < '2026-11-24 18:30:00+00'
  and coalesce(q.cv, '') <> ''
on conflict (hub, qid, choice) do update set picks = question_choices.picks + excluded.picks, v = excluded.v;
delete from question_choices_past p using fix_k f
where p.hub = 'review-of-systems' and p.qid = f.qid
  and p.moved_at >= '2026-11-24 18:25:00+00' and p.moved_at < '2026-11-24 18:30:00+00';
-- 2. the recount the first fix meant to do: correct = the picks on the corrected choice, never more than the attempts
update question_stats s
set correct = least(s.attempts, coalesce((select c.picks from question_choices c
  where c.hub = s.hub and c.qid = s.qid and c.choice = f.k), 0))
from fix_k f
where s.hub = 'review-of-systems' and s.qid = f.qid;
commit;
