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
likelihood"; before that, a lecture got as many topics as exam questions). The listed questions get `q.likely` (on a hub on the engine, `node tools/hub-next/build.mjs` sets it from `likelyTopics`, since 2026-11-18, BUG-164: never by hand): `likelyChip()` tags them in the bank and the drill (not the mock), and since 2026-11-18 the tag says why (Sam: "yes to the two
ideas", Perio report #57: "what is the rationale for this being high likelihood"): a tap opens the topic, its rank in its
lecture and what it rests on, its `basis` in words (`basisWords()` in `widget/hub-bank.js`), so write `basis` with the usual
words joined by " + " (hint, final review, final focus, review guide, live class, midterm check-ins, study guide, recording,
objectives, slides, lecture); the bank's
**High likelihood** toggle shows only those, on top of any Show chip (Missed last time, Not answered yet, Pinned; since 2026-11-06;
no "Likely first" order since 2026-11-03); Exam Hints opens with `likelyHTML()` ("Most likely questions", a
Practice these button per lecture). Never base a topic on a graded quiz or a previous year's exam ([graded-coursework](graded-coursework.md)).
**Adding a lecture to an existing hub (or taking one from slides-only to taught) always includes its `LIKELY_TOPICS`
entries**, ranked with the rest; when new hints, reviews or focus lists arrive, re-rank them. CI fails a lecture with questions
but no topics, or a topic listing a question from another lecture (`LIKELY_SKIP` in `tools/ci/smoke.js` is only for lectures
whose exam is already over).

Perio: add topics for each session as it is taught.

**A hub that reviews earlier courses** (Review of Systems, Sam, 2026-11-20: "exam hints for old exams are not exam hints for review of
systems. they do indicate higher yield content, however"): its topics and hints rest on those courses' own exams, so they are ranked
the same way but never called a prediction of this hub's exam. Set `"hintsFrom": "courses"` in its `core.json`: the engine and Ask
Timmy then say High yield and High-yield points instead of High likelihood and Exam hints.

**They also write the High yield notes** (Sam, 2026-11-12): on the engine (every hub since the redesign's release), each lecture's
notes have a third reading level, **High yield**, built from its topics in this order, each with the notes' paragraphs its
questions point to and the Exam Hints' takeaways (`tools/hub-next/high-yield.mjs`, run by `tools/hub-next/build.mjs`). So a
topic's words and its question list decide what that level shows: after changing topics, rebuild and check the picks with
`node tools/hub-next/high-yield.mjs <hub> <lecture>`. Never write High yield text by hand. A topic may also carry `picks` (Heme & Endo Exam 3, 2026-11-20), some of its `ids` with each point it
names asked once, for a bank toggle with a basis ([question-bank-filter-panel](question-bank-filter-panel.md)); `ids` alone decide High likelihood and High yield.

Related: [question-bank-filter-panel](question-bank-filter-panel.md) (the High likelihood toggle) ·
[the redesign release](../tasks/done/2026-11-06-redesign-release.md) (High yield's drafts)
