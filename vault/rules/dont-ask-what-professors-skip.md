---
type: rule
tags: [questions, content]
since: 2026-11-08
---

# No questions on what a professor says you don't need

Sam's standing rule, 2026-11-08 ("that should be a standing rule"), for every hub, live and future: **no question tests
something a professor said students don't need to know.** It started in Heme & Endo Exam 2 ("2 should come out along with
any questions that professors say we dont need to know").

- **What counts:** a professor says it in a recording, an in-class review or a focus list, for example "you don't need to
  know this", "I'm not going to test you on", "skip this", "trivia", or "the only thing you need from this image is X"
  (everything else on that image is skipped). A slide that is merely not discussed doesn't count by itself.
- **Look for it every time a lecture goes taught** (its recording arrives) and when a review or focus list comes in: search
  the transcript for those phrases, record each one as a `deemphasize` Exam Hint, and mark it in the notes.
- **A question whose key depends on a skipped point comes out**: delete it and mark its id `retired` in
  `tools/question-ids/<hub>.txt` ([question-ids-are-permanent](question-ids-are-permanent.md)). This rule is Sam's standing
  OK for these removals, so they don't need to be asked one by one; say in the PR which questions came out and the quote
  behind each.
- **Mentioning a skipped point is fine**: in a wrong choice, in a "why", or in an explanation that says it isn't needed. A
  question that asks for the part the professor said to keep stays (for example, "know the mechanism, not the figure's
  labels").
- Removing questions can take a lecture below the format minimums ([two-statement-and-true-false](two-statement-and-true-false.md),
  [numbered-statements](numbered-statements.md)) or leave a `LIKELY_TOPICS` entry pointing at a retired id: fix both in
  the same change.
- Never base anything on a graded quiz or a previous year's exam ([graded-coursework](graded-coursework.md)).

Related: [question-ids-are-permanent](question-ids-are-permanent.md) · [high-likelihood-topics](high-likelihood-topics.md) ·
[graded-coursework](graded-coursework.md) · [decisions](../decisions.md)
