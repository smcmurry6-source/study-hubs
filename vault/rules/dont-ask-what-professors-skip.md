---
type: rule
load: on-demand
tags: [questions, notes, content]
since: 2026-11-08
---

# Nothing on what a professor says you don't need

Sam's standing rule for every hub, live and future. It started on 2026-11-08 for questions ("that should be a standing
rule", from Heme & Endo Exam 2: "2 should come out along with any questions that professors say we dont need to know"),
and on 2026-11-20 it took in the notes too: "dont include anything that was deemphasized or we were told not to worry
about", then "make it a rule for every hub". **No question tests a point a professor said students don't need, and no note
teaches it.** Since 2026-11-23 the professor's "skip this" isn't written down either (Sam, of Review of Systems' 50 such
notes: "just do not include things they said not to memorize. dont include a note saying 'dont memorize'. thats just
confusing and takes up space"): no `deemphasize` Exam Hint, no "You can skip" in High yield, no line in the podcast.

- **What counts:** the course's professor says it in a recording, an in-class review, a focus list or a study guide, for
  example "you don't need to know this", "I'm not going to test you on", "skip this", "don't worry about", "trivia", "won't
  ask", or "the only thing you need from this image is X" (everything else on that image is skipped). A slide that is
  merely not discussed doesn't count by itself. A classmate's note, or an earlier class being told something wasn't on
  *their* exam, is a lead to ask Sam about, not a rule: in Review of Systems Sam kept CKD (a classmate's "NO EXAM Qs") and
  NYHA class, prazosin and artificial valves (the class above's "not on the test") ([decisions](../decisions.md), 2026-11-20).
- **Look for it every time a lecture goes taught** (its recording arrives) and when a review or focus list comes in, and in
  the slides' speaker notes ("FOR REFERENCE ONLY! DO NOT MEMORIZE!"): search for those phrases and leave the point out.
  Write no hint for it (the `deemphasize` kind, kept 2026-11-20 to 2026-11-23, is no longer written); list in the PR what
  came out and the quote behind each, so Sam can see it. If the professor said what to know instead ("know AML versus ALL"),
  make sure the notes teach that. A professor's "FYI" isn't a skip by itself (2026-11-23, one of the calls Sam left to the
  agent, "use outside sources to decide the content calls": [decisions](../decisions.md)).
- **The notes leave it out**: As taught, Plain English, High yield, the cram list, review tables, sort sets, mind maps and
  High likelihood topics don't describe a skipped point, not even marked as "not needed" or "background". Keep what the
  professor said to know about it (the "know that" half). Editing a lecture's notes means recording its
  narration again in the same PR ([text-and-audio-never-drift](text-and-audio-never-drift.md)).
- **A question whose key depends on a skipped point comes out**: delete it and mark its id `retired` in
  `tools/question-ids/<hub>.txt` ([question-ids-are-permanent](question-ids-are-permanent.md)). This rule is Sam's standing
  OK for these removals, so they don't need to be asked one by one; say in the PR which questions came out and the quote
  behind each. Don't use a skipped point as a wrong choice or in a "why" or an explanation either. A question that asks for
  the part the professor said to keep stays (for example, "know the mechanism, not the figure's labels").
- **Since 2026-11-20 for the notes:** Review of Systems was built to it. Heme & Endo Exam 3 keeps the marked asides in its
  As taught notes until it archives on the night of its exam (Sam, 2026-11-20: the rule from then on, no re-recording the
  night before). Hubs archived before then are left as they are.
- Removing questions can take a lecture below the format minimums ([two-statement-and-true-false](two-statement-and-true-false.md),
  [numbered-statements](numbered-statements.md)) or leave a `LIKELY_TOPICS` entry pointing at a retired id: fix both in
  the same change.
- Never base anything on a graded quiz or a previous year's exam ([graded-coursework](graded-coursework.md)).

Related: [question-ids-are-permanent](question-ids-are-permanent.md) · [high-likelihood-topics](high-likelihood-topics.md) ·
[text-and-audio-never-drift](text-and-audio-never-drift.md) · [graded-coursework](graded-coursework.md) ·
[decisions](../decisions.md)
