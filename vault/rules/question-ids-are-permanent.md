---
type: rule
tags: [questions, ci]
since: 2026-11-04
---

# Question ids are permanent

Sam's rule, 2026-11-04 (the question-health system, [question-health](../reference/question-health.md)), for every hub:
**a question's id never changes and is never reused.** Class stats, every person's answers, reports, pins, the drill and
question health are all keyed on `(hub, id)`, so a renamed id orphans its data and a reused one mixes two questions.

- **Editing a question keeps its id.** Fix the stem, a choice, the key or the explanation in place; the system notices
  the new version by itself (its numbers start fresh, the old ones stay).
- **A new question gets a new id**, never one the hub has used before. Follow the hub's own pattern (`q4-06`, `an-compound`).
- **Deleting a question** is Sam's call ([graded-coursework](graded-coursework.md) says ask), except a question on something a
  professor said you don't need, which comes out by standing rule ([dont-ask-what-professors-skip](dont-ask-what-professors-skip.md)). Then change its line in
  `tools/question-ids/<hub>.txt` to `<id> retired`; the id stays out of use for good.
- **The registry**: `tools/question-ids/<hub>.txt` lists every id the hub has ever shipped, one per line (`#` starts a
  comment). `node tools/ci/smoke.js` checks it: a registered id missing from the hub fails, a retired id coming back
  fails. A local run adds new ids to the file (commit it); CI can't, so it fails and lists the lines to add.
- Moving a question to another lecture changes its `lec`, not its id. A new hub starts its own file (the first local
  smoke run writes it). When a hub's page is removed, its file stays.

Related: [question-health-flags-are-leads](question-health-flags-are-leads.md) ·
[verify-before-pushing](../how-to/verify-before-pushing.md) · [build-a-hub](../how-to/build-a-hub.md)
