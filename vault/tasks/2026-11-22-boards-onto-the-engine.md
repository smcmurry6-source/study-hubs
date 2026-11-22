---
type: task
status: in-progress
hub: boards
created: 2026-11-22
requested-by: Sam
due:
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/532 (the plan, merged into claude/boards-hub)
---

# Move the boards hub onto the engine

## Goal

Sam, 2026-11-22: **"Yes to 2 and 3"**, 2 being the merging session's question "Should boards move onto the hub engine? I
recommend yes" ([decisions](../decisions.md)). The boards hub (INBDE + ADEX, live until about August 2028) is built on the
same engine as every hub on `main` (`hubs/boards/content/*.json` drawn by `widget/hub.js`), not as the one page
`tools/build-boards.js` generates today. Then it gets the engine's Home, Notes, Questions and More, the game layer (XP,
crowns, ranks, Timmy, the shop), Ask Timmy, the service worker and every CI check the other hubs have, and fixes to the
engine reach it without a second copy.

## Context

- **Where the work lives:** branch `claude/boards-hub` (draft PR https://github.com/smcmurry6-source/study-hubs/pull/70); its
  briefs, plan and Sam's boards decisions are in `docs/boards/` there (`NEXT.md`, `DECISIONS.md`, `PLAN_V2.md`). Branch from
  it and open PRs into it. Read [the boards hub note](../hubs/boards.md) first; its rules hold (questions written from the
  fact records in `src/boards/facts/`, every key traced to a primary source, no released exam or prep-company items).
- **What it has today** (`src/boards/` on that branch): units (`units/medcx`, `units/pharm`: Core and Deep notes, a
  blueprint, `unit.js`), the app in parts (`app/`: state, card, notes, bank, readiness plan, mock, home, clinic, boot,
  export), its own CSS and `config.js`, and the fact records. 16 PRs into the branch are still open (the hub note lists them).
- **What the engine has:** [build-a-hub](../how-to/build-a-hub.md), [the repo map](../reference/repo-map.md) (the engine's
  four scripts and `tools/hub-next/build.mjs`), [hub-home-page](../rules/hub-home-page.md),
  [game-server](../reference/game-server.md).
- **Storage** ([the plan for years](2026-11-22-sustainable-for-years.md), package 3, Sam's E): boards keeps each person's
  latest state on each item, daily XP totals and about 30 days of attempts, so it grows with people × items, not with time.
  The engine's answer path (`record_answer_v2`) keeps every answer, so this move is where that gets decided.
- **No High Likelihood for now** (2026-11-21) and **no narration or Timmy Time recording in the repo**
  ([no-narration-in-the-repo](../rules/no-narration-in-the-repo.md)).

## Done when

- [x] **A plan, before any code**, in `docs/boards/ENGINE_PLAN.md` on `claude/boards-hub`, in one PR into that branch:
      how each part of `src/boards/` maps onto the engine (units across two exams, Core and Deep notes, the fact citations,
      the readiness plan, the mock, the clinic, cards), what the engine lacks and would gain for every hub vs. for boards
      only, what `tools/build-boards.js` becomes (a converter into `content/`, or retired), what happens to the 16 open PRs,
      how package 3's storage bound fits the answer path, and the order of the build as task briefs
      (`docs/boards/tasks/T-NN.md`), each one PR. Sam's questions in one message.
- [x] Sam approves the plan (2026-11-22, keeping Chairside).
- [ ] The build, brief by brief, into `claude/boards-hub`.
- [ ] `tools/ci/smoke.js` and the bank lint walk boards as an engine hub (its separate walk comes out), and the hub note
      says it's on the engine.
- [ ] [Package 3](2026-11-22-sustainable-for-years.md)'s box ticked when the storage bound is built.

## Log

- 2026-11-22: written by the session handling the merging, from Sam's answer.
- 2026-11-22: the plan, `docs/boards/ENGINE_PLAN.md`, with briefs T-07 to T-17, merged into `claude/boards-hub` (#532).
  Sam: "Sounds good except for getting rid of chairside. I want to keep it." So: engine changes go to `main` in their own
  PRs, off by default; `tools/build-boards.js` becomes a converter into `hubs/boards/content/`; one answer path with a
  rolling per-item store for boards (T-13, with package 3); Chairside is built on the engine (T-16, T-17), with #95 and
  #101 landing through them; #81, #97, #100 and #102 closed as replaced by the engine; the other ten open PRs finished and
  merged as they are. Next: T-07.

## Outcome

Related: [the boards hub](../hubs/boards.md) · [build-a-hub](../how-to/build-a-hub.md) ·
[the plan for years](2026-11-22-sustainable-for-years.md) · [decisions](../decisions.md)
