---
type: rule
load: on-demand
tags: [questions]
---

# Every choice gets a why

Every multiple-choice and select-all question explains **each** of its choices, not only the right one (Sam's standing
rule, 2026-10-20): a `QUESTION_WHY` row per question (`id: [one line per choice]`, same order as `choices`), drawn as
"Why each choice" under the explanation once the student answers (`whyHTML`), folded until the student taps it (Sam,
2026-11-06: open, it took up too much of the screen). For the right choice say why it's right;
for each wrong one say what it actually is or what it's confused with. Don't start with "Correct"/"Wrong" (the list
draws its own marks) or refer to letters or positions (choices are shuffled). Draw it from the hub's own notes. **Any
question you write or edit gets its row in the same change**; the CI lint fails without it. Hubs archived before the
rule (`WHY_EXEMPT` in `tools/ci/smoke.js`) are exempt; a new hub copies `whyHTML` from `occlusion` and is not.

Related: [two-statement-and-true-false](two-statement-and-true-false.md) · [numbered-statements](numbered-statements.md)
