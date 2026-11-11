---
type: rule
load: on-demand
tags: [questions]
---

# Two-statement and true/false questions

Sam's rule, 2026-10-22: **every lecture's questions include two-statement and true/false items**, for every new hub, every
lecture added to a hub and every lecture that goes from slides-only to taught. Aim for about 5 two-statement and 8
true/false per lecture (Occlusion has 27 and 42 over its five lectures). CI fails a taught lecture with fewer than 3 and 5
(`FORMAT_MIN` in `tools/ci/smoke.js`; archived hubs and perio S1-S5, taught before the rule, are exempt).
- Build them with Occlusion's helpers (copy `two()`, `tf()`, `TWO_CHOICES` and `choiceOrder()` into a hub that lacks them):
  `two(id, lec, src, s1, s2, t1, t2, ex, r1, r2)` writes the stem "Read the two statements." with each statement on a line
  starting "1. " / "2. ", the four fixed choices and the key; `tf(id, lec, src, statement, isTrue, ex, whyTrue, whyFalse)`
  writes "True or false: …" with the choices True, False. Their choices never shuffle (bank, drill, Weak Spots, mock),
  `.qcard-stem` keeps line breaks, and the arcade skips both (`arcadeQ`).
- Spread two-statement keys over all four choices and keep true/false keys near half True (CI: each two-statement key
  10-40% of a hub's items, since 2026-11-04; true/false 35-65% True). Don't write the true statement first by habit: PCD
  Implants had 36 of 46 keyed "1 true, 2 false" until a student noticed (suggestion #14).
- A false statement changes one detail that was taught (a number, a side, a swapped pair, who said it); never make it
  false through a trick of wording. Write each statement so it stands alone.
- Every choice still gets its why: `two()` builds the four lines from one reason per statement (write each reason so it
  reads after "Statement 1 is true:"), `tf()` takes one line for True and one for False. Draw them from the hub's notes.
- The [graded-coursework](graded-coursework.md) rules apply as to any question. Perio has `two()`, `tf()` and `nums()` (since 2026-11-03), so
  Session 6 and any later session marked taught needs all three formats.
