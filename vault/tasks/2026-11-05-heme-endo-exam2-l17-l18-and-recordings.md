---
type: task
status: blocked
hub: heme-endo-exam2
created: 2026-11-05
requested-by: Sam
due: 2026-11-13
waiting-on: the Exam 2 review (Wed 11/11)
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/310
---

# Heme & Endo Exam 2: make the slides-only lectures taught (L17 and L18 left the exam)

## Goal

The hub shipped on 2026-11-05, before half of its lectures were given. Bring it up to the whole exam before Fri 11/13:
add L17 (Pregnancy and lactation, Dr. Madison, Tue 11/10) and L18 (Estrogens and androgens, Dr. Fasinu, Wed 11/11)
when their slides are posted, take Lecture A and L13-L16 from slides-only to taught as their recordings land, and
re-rank High Likelihood from the review on Wed 11/11. **Changed 2026-11-10:** L16 is the last lecture on Exam 2 (Sam, from
Dr. Herr), so L17 and L18 aren't added here; they, and Lecture A, go to the Exam 3 hub
([carry-over task](2026-11-10-heme-endo-exam3-carry-lecture-a.md)).

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
- `MOCK_BLUEPRINT` and `EXAM_COUNTS` in the hub: set from Dr. Herr's count per lecture on 2026-11-10 (see the hub note).
  The counts never trim High Likelihood: a topic the review raises is added or ranked higher.
- **The bank is kept high yield** (Sam, 2026-11-08: "803 is way too many questions"; it was cut to 339): L17 and L18 get
  about 30-35 questions each, and L16 going taught swaps questions instead of adding; see the hub note.

## Done when

- [x] ~~L17 and L18 are lectures with notes at both levels, narration, questions in every required format and their
      `LIKELY_TOPICS`; `MOCK_BLUEPRINT` gives them questions~~ Dropped 2026-11-10: not on Exam 2 (L16 is its last lecture)
- [x] Lecture A and L13-L16 are `status:'taught'` with notes checked against the recordings (both mp3s regenerated)
      and Exam Hints quoted from what was said (A, L13, L14 and L15 done 2026-11-08; L16 2026-11-11)
- [ ] High Likelihood re-ranked from the 11/11 review
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-05: written when the hub shipped (L11 and L12 from their recordings; A and L13-L16 from slides and speaker
  notes; L17 and L18 had no slides yet).
- 2026-11-05: the hub merged with smcmurry6-source/study-hubs#246: every question vetted, nine figures, both narration
  levels. The places where a lecture contradicts a textbook or itself (kept as taught) are in the hub note: check each
  against the recording when A and L13-L16 go to taught, and the figures against the slide images.
- 2026-11-08: Sam added the 11/6 recordings' transcripts to Drive ("update the heme and endo exam 2 hub with the
  transcripts i just added to the drive folder"; then "merge when ready"). A, L13, L14 and L15 are taught: notes at both
  levels checked against what was said, 57 new questions (sources relabeled `rec` where the point was said aloud), Exam
  Hints quoted from each recording, High Likelihood re-ranked from what each professor flagged, both mp3s regenerated,
  and the `hpg` figure moved to Dr. Madison's in-class aromatase correction. The contradictions found are in the hub
  note's content flags. Still to do here: L16 (recording Tue 11/10), L17 and L18, the 11/11 review, and the `cycle`
  figure's FSH at midcycle (L14 and L16 disagree).
- 2026-11-08: Sam: "2 should come out along with any questions that professors say we dont need to know". `mh-2s-6`
  retired; every recording and Exam 1's de-emphasis hints checked, nothing else tested a skipped point. Do the same
  check for L16-L18 and the review. Then "That should be a standing rule" (now
  [dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)) and "803 is way too many questions. They need
  to be higher yield": the bank was cut to 339 high-yield questions (464 ids retired), High Likelihood made selective
  (about half of each lecture), the Refresher to one question per Exam 1 topic. (Superseded by the next entry.)
- 2026-11-08 to 11-10: Sam: "be sure the emphasized points are covered, deemphasized points are left out ... be sure
  that the high likelihood questions are sufficient. I dont know what you took out from them. Go with dr herrs version",
  then Dr. Herr's in-class focus slides for L13 and L14 (11-09). Midcycle FSH now follows Dr. Herr hub-wide (notes,
  cram, `cycle`, the L14 and L16 mp3s regenerated); the focus list is an Exam Hint and ranks those topics first; every
  lecture was audited for coverage (emphasized points, topic facets, gaps): 90 cut questions back, 2 new, 339 → 431,
  369 High Likelihood. Still to do: L16's recording (Tue 11/10), L17 and L18, the 11/11 review, each with the same
  coverage audit.
- 2026-11-10: Sam: all of Exam 1's High Likelihood questions back in the Refresher (206), the mock's Exam 1 five drawn at
  random from them, R out of the bank's default lectures; "fill in the gaps a little more" (a key-term pass: 68 back, 2
  new; Exam 2 lectures 421); L14 38-39 is the endometrium during menstruation, so the focus topics were re-ranked from the
  decks' real slide order. Still to do: the same as above.
- 2026-11-10: Lecture A is not on Exam 2 (Sam asked Dr. Herr: he forgot about it, so it will likely be on the next exam;
  "i guess save all that for exam 3"). It came out of the hub whole; the Exam 3 hub picks it up:
  [the carry-over task](2026-11-10-heme-endo-exam3-carry-lecture-a.md). A's line under "Done when" is met by its removal.
- 2026-11-10: Sam, from Dr. Herr: "There are 5 review, 8 for l11, 9 for l12, and 7 for the rest of the lectures. L16 is the
  last lecture on the test." `EXAM_COUNTS` and the mock follow it (High Likelihood keeps every topic: Sam, "Dont remove any
  high likelihood questions"), and L17 and L18 are dropped from this task (the first "Done when" box no longer applies; they go to the Exam 3 hub). Still to do:
  L16's recording and the 11/11 review.

- 2026-11-11: Sam uploaded L16's 11/10 recording transcript to Drive ("i just uploaded the l16 transcript"). L16 is taught:
  notes at both levels checked against what Dr. Madison said (what he stressed added, with his words), 17 Exam Hints
  quoted from the recording (3 de-emphasize: the other steroid enzymes, the in-between follicle names, the whole-body
  actions slide; no question's key depended on them), `src` relabeled `rec` on 28 questions, 7 new questions for what he
  stressed and nothing tested (`fp-purpose`, `fp-tf-temp`, `fp-inhibin-peak`, `fp-omi`, `fp-tf-leptin`, `fp-tf-prl`,
  `fp-tf-turner`), `fp-2s-default` and `fp-lh-block` back as they were (L16 43 to 52), High Likelihood re-ranked from the
  recording (follicular versus luteal first: "high yield for exam"; 29 to 40 HL questions, none dropped), cram, Review
  tables (a follicular versus luteal table), sequences, the `cycle` figure's FSH text, and both mp3s. His FSH at midcycle
  agrees with Dr. Herr's, so the L14/L16 conflict is closed (hub note). Still to do: the 11/11 review.
## Outcome
