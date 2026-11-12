---
type: rule
load: on-demand
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

**They also write the redesign's High yield notes** (Sam, 2026-11-12): in the new versions (`hubs/<id>/next/`), each lecture's
notes have a third reading level, **High yield**, built from its topics in this order, each with the notes' paragraphs its
questions point to and the Exam Hints' takeaways (`tools/hub-next/high-yield.mjs`, run by `tools/hub-next/build.mjs`). So a
topic's words and its question list decide what that level shows: after changing topics, rebuild and check the picks with
`node tools/hub-next/high-yield.mjs <hub> <lecture>`. Never write High yield text by hand.

Related: [question-bank-filter-panel](question-bank-filter-panel.md) (the High likelihood toggle) ·
[the redesign release](../tasks/2026-11-06-redesign-release.md) (High yield's drafts)
