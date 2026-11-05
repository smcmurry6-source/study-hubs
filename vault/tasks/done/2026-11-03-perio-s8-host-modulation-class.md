---
type: task
status: done
hub: perio
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/257
---

# Perio Session 8: host modulation from the class capture

## Goal

S8 (Pharmacotherapy: Antibiotics & Host Modulation) is taught, but only the antibiotics half was recorded (Dr. Litz's
2024 recording). Its host modulation section comes from the slides, and the lecture's `note` says so. When the class part
is posted, rewrite that section from it before the final (Thu Nov 19).

## Context

- Hub note: [perio](../../hubs/perio.md)
- Change log: "2026-11-03 (perio S7 and S8 taught" in `DEPLOY_NOTES.md`
- Rules: [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) (both `antibiotics-host-mod-*.mp3`),
  [high-likelihood-topics](../../rules/high-likelihood-topics.md) (re-rank S8 from what he stresses),
  [every-choice-gets-a-why](../../rules/every-choice-gets-a-why.md)

## Done when

- [x] Host modulation section at both levels written from the capture; both mp3s regenerated
- [x] The lecture's `note` no longer says host modulation is slides-only
- [x] Exam hints quoted from the capture; S8 `LIKELY_TOPICS` re-ranked; any new questions have their whys
- [x] CI passes; hub note and Outcome written

## Log

- 2026-11-03: written; waiting on the capture.
- 2026-11-05: Sam added `litz nov5.txt` (the Nov 5 class capture) to Drive, Periodontology/hubs, and asked to update the hub
  with it; done in one PR, merged on Sam's "merge when ready".

## Outcome

The Nov 5 class opened with a short antibiotics recap (the primary etiologic factor, the indications, never monotherapy,
biofilms "know this for life", "I definitely would know dosing"), then the whole host modulation part. From it:

- **Notes, both levels**: the host modulation section rewritten from the class (what host modulation means; bacteria the
  key and the host response the engine, not autoimmune, the vicious cycle; pellicle, complement, neutrophils at 24-48 h
  then macrophages, IL-1; why to step lightly; NSAIDs; bisphosphonates and why BRONJ is so hard to treat; Periostat as a
  fifth of the antibiotic dose; Caton 2000 as "statistically, but clinically, significant?"; summary and references).
  A new **dosing chart** section from the slide he told the class to know for the exam (the slides PDF's last table:
  usual adult dose and length for seven regimens; the doses that differ from the drug slides are named). The recap's
  emphases added where they belong. Both `antibiotics-host-mod-*.mp3` regenerated.
- The lecture's `note` and `source` say host modulation came from the class.
- **10 exam hints** quoted from the capture (one de-emphasis: Caton's numbers); **S8 `LIKELY_TOPICS`** re-ranked to 13
  (dosing, the host response and the cascade are now hint-based topics).
- **21 new questions** (S8 88 -> 109, bank 665 -> 686), each choice with its why: 11 MCQs, 1 select-all, 4 true/false
  (2 True), 3 two-statement (keys avoid "1 true, 2 false", already at 36%), 2 numbered (statement 1 false in both).
- Review: the host modulation rows rewritten and a dosing-chart table; cram lines, mind map, one arcade word.
- `tools/narrate.py` now reads perio's template-literal `READINGS['<id>']` blocks and says prescription shorthand (mg, po,
  qd/bid/tid/qid, q6h, IL-1) properly; two lexicon words (Epocrates, osteonecrosis).

Not done: a diagram review was not part of this task (no new lecture). One candidate worth asking Sam about: the host
response flowchart (microbial challenge, host response, cytokines and PGE2, breakdown, the vicious cycle) with where
NSAIDs, Periostat and bisphosphonates act.

