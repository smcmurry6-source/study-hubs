---
type: rule
tags: [questions]
---

# High Likelihood Exam Questions

**High Likelihood Exam Questions** (Sam's rule, 2026-10-30, every live and future hub; first in `heme-endo-exam1`): `LIKELY_TOPICS`
(`{lec, t, basis, ids}`) lists each lecture's predicted exam topics, strongest evidence first: what a professor flagged in a recording
(`hint`), an in-class review or focus list, the class exam-review guide, what check-ins said the exam asked, then the core of the
slides / lecture / module / reading. When the exam's count per lecture is announced, put it in `EXAM_COUNTS` (shown beside each lecture,
and the mock's blueprint), but **never trim topics to it**: every topic a professor hinted at stays High Likelihood (Sam,
2026-11-10: "Dont remove any high likelihood questions. If they were hinted to be exam questions, they need to be high
likelihood"; before that, a lecture got as many topics as exam questions). The listed questions get `q.likely`: `likelyChip()` tags them in the bank and the drill (not the mock); the bank's
**High likelihood** toggle shows only those, on top of any Show chip (Missed last time, Not answered yet, Pinned; since 2026-11-06;
no "Likely first" order since 2026-11-03); Exam Hints opens with `likelyHTML()` ("Most likely questions", a
Practice these button per lecture). Never base a topic on a graded quiz or a previous year's exam ([graded-coursework](graded-coursework.md)).
**Adding a lecture to an existing hub (or taking one from slides-only to taught) always includes its `LIKELY_TOPICS`
entries**, ranked with the rest; when new hints, reviews or focus lists arrive, re-rank them. CI fails a lecture with questions
but no topics, or a topic listing a question from another lecture (`LIKELY_SKIP` in `tools/ci/smoke.js` is only for lectures
whose exam is already over).

Perio: add topics for each session as it is taught.

Related: [question-bank-filter-panel](question-bank-filter-panel.md) (the High likelihood toggle)
