---
type: task
status: blocked
hub: heme-endo-exam2
created: 2026-11-05
requested-by: Sam
due: 2026-11-13
waiting-on: L17 and L18 slides; the recordings of Lecture A and L13-L16; the Exam 2 review (Wed 11/11)
agent: 
pr: 
---

# Heme & Endo Exam 2: add L17 and L18, and make the slides-only lectures taught

## Goal

The hub shipped on 2026-11-05, before half of its lectures were given. Bring it up to the whole exam before Fri 11/13:
add L17 (Pregnancy and lactation, Dr. Madison, Tue 11/10) and L18 (Estrogens and androgens, Dr. Fasinu, Wed 11/11)
when their slides are posted, take Lecture A and L13-L16 from slides-only to taught as their recordings land, and
re-rank High Likelihood from the review on Wed 11/11.

## Context

- Hub note: [heme-endo-exam2](../hubs/heme-endo-exam2.md)
- Sources: Drive, "Hematology and Endocrinology" → "Exam 2" (slides, and the class recordings' transcripts). Read them;
  never commit them. Never use "Resources from D3s" (last year's study guide, deck and practice questions).
- A new lecture or one going from slides-only to taught brings in every per-lecture rule:
  [two-statement-and-true-false](../rules/two-statement-and-true-false.md),
  [numbered-statements](../rules/numbered-statements.md),
  [every-choice-gets-a-why](../rules/every-choice-gets-a-why.md),
  [high-likelihood-topics](../rules/high-likelihood-topics.md) (topics for L17 and L18; re-rank after the review),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md) (both mp3s for every lecture whose notes change:
  `python3 tools/narrate.py hubs/heme-endo-exam2/index.html --lec <id> --force`),
  [diagram-review](../rules/diagram-review.md) (Sam said yes to all animations for this hub on 2026-11-05).
- Quiz 3 is open until Thu 11/12, 11:59 pm and the take-home until 11/15: never use either
  ([graded-coursework](../rules/graded-coursework.md)).
- `MOCK_BLUEPRINT` and `EXAM_COUNTS` in the hub: update them if the course announces a count per lecture.

## Done when

- [ ] L17 and L18 are lectures with notes at both levels, narration, questions in every required format and their
      `LIKELY_TOPICS`; `MOCK_BLUEPRINT` gives them questions
- [ ] Lecture A and L13-L16 are `status:'taught'` with notes checked against the recordings (both mp3s regenerated)
      and Exam Hints quoted from what was said
- [ ] High Likelihood re-ranked from the 11/11 review
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-05: written when the hub shipped (L11 and L12 from their recordings; A and L13-L16 from slides and speaker
  notes; L17 and L18 had no slides yet).

## Outcome
