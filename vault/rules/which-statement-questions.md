---
type: rule
load: on-demand
tags: [questions]
since: 2026-11-10
---

# "Which statement is true?" and "Which statement is false?" questions

Sam's rule, 2026-11-10 (the lessons refresh's "For Sam" list: a PCD Implants check-in asked for "which statement is
correct" questions; Sam: "add which statement questions", then "also do the inverse ... where one is false and the rest
are true"): **every lecture's questions include both kinds**, for every new hub, every lecture added to a hub and every
lecture that goes from slides-only to taught.

- **Which statement is true** (`fmt: 'which'`): "Which statement about X is true?" (or "is correct?") over four statements,
  one true and three false. **Which statement is false** (`fmt: 'whichf'`): "Which statement about X is false?", one false
  and three true.
- Aim for about 2 of each per lecture; CI fails a taught lecture with fewer than 1 of each (`WHICH_MIN` in
  `tools/ci/smoke.js`). Hubs archived before the rule are exempt (`WHICH_EXEMPT`), and so are lectures already taught then
  (`WHICH_GRANDFATHERED`: Occlusion's midterm lectures, Heme & Endo Exam 2's Exam 1 Refresher, Perio through Session 9).
- Build them with `which(id, lec, src, stem, pairs, ex, extra)` and `whichf(...)`: `pairs` is four `[statement, why]` rows,
  the key first (Heme & Endo Exam 2 and Occlusion have them; copy them, and `mq()` where a hub lacks it). The choices
  shuffle like any multiple-choice item, and the Question Bank's type filter has both formats.
- Each statement stands alone and reads as a full sentence. A false statement changes **one** taught detail (a number, a
  side, a swapped pair, the wrong drug, cell or hormone), as in [true/false](two-statement-and-true-false.md); never a
  trick of wording. Don't let two choices contradict each other in a way that gives the answer away.
- **The key is never the longest choice** (the CI lint counts every MCQ: under 40% of a hub's items). Make a distractor the
  longest, or trim the key.
- Every choice gets its why ([every-choice-gets-a-why](every-choice-gets-a-why.md)): for a `whichf` item, the key's line
  says it is the false one and what is actually true, and each true statement's line says why it holds.
- CI checks the shape: 4 or more choices, a "which" stem, and a stem that asks for the false one exactly when the format
  is `whichf`. Draw every statement from the hub's own notes; the [graded-coursework](graded-coursework.md) rules and
  [dont-ask-what-professors-skip](dont-ask-what-professors-skip.md) apply as to any question.

Related: [two-statement-and-true-false](two-statement-and-true-false.md) · [numbered-statements](numbered-statements.md) ·
[every-choice-gets-a-why](every-choice-gets-a-why.md) · [question-bank-filter-panel](question-bank-filter-panel.md)
