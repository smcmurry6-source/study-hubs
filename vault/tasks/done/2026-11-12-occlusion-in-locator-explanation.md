---
type: task
status: done
hub: occlusion
created: 2026-11-12
requested-by: Sam
due: 2026-11-16
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/328
---

# Occlusion `in-locator`: the explanation names the pantograph trap

## Goal

`in-locator` ("How is the exact hinge axis found for a kinematic facebow?") was missed by about half of the people who
tried it, and the favorite wrong pick was "Trace protrusive and lateral paths on six recording tables". Its "why" row for that
choice already says this is the pantograph, but the explanation students see first doesn't. Add one sentence to the
explanation: tracing paths on six recording tables is the pantograph, which records how the jaw moves, not where the hinge
axis is. Sam approved this on the 2026-11-11 lessons refresh's list ("Everything else sounds good").

## Context

- Hub note: [occlusion](../../hubs/occlusion.md). The question is `mcq('in-locator', ...)` in `hubs/occlusion/index.html`.
  Its `QUESTION_WHY` row is already right.
- It waits for [#319](https://github.com/smcmurry6-source/study-hubs/pull/319), which retires repeat questions and
  rebuilds `hubs/occlusion/next/content/questions.json`, a single generated line. Any edit made before #319 merges
  conflicts with it there. `in-locator` itself is kept by #319.
- After #319 merges, fix it on a fresh `origin/main`, then rebuild `next/content` with `node tools/hub-next/build.mjs` (the Occlusion hub note has the details).
- Rules: [question-ids-are-permanent](../../rules/question-ids-are-permanent.md) (keep the id),
  [every-choice-gets-a-why](../../rules/every-choice-gets-a-why.md), [ship-it-now](../../rules/ship-it-now.md) (the final is
  Mon 11-16). Where it was found: `LESSONS.md`, Live signals, Occlusion (2026-11-11).

## Done when

- [x] The explanation of `in-locator` says the six-table tracing is the pantograph and that it doesn't find the hinge axis
- [x] `next/content` rebuilt; the live hub and `next/` say the same
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (this note's Outcome)

## Log

- 2026-11-12: written while #319 was still open (Follow along session, #323).
- 2026-11-12: #319 merged (Sam: "merge 319", through #327); fixed.

## Outcome

`in-locator`'s explanation now ends: "Tracing protrusive and lateral paths on six recording tables is the pantograph, the
next step: it records how the jaw moves (the "timing"), not where the hinge axis is", from L6's notes (the kinematic
facebow is step 1, the pantograph step 2). The id, stem, choices, key and why row are unchanged, so no answers move.
`next/content` rebuilt.
