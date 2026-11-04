---
type: hub
tags: [hub, boards]
hub: boards
status: building
---

# Boards (INBDE + ADEX)

A hub for the INBDE and ADEX licensure exams (roughly August 2028): notes, a large question bank written for this site,
and a game built around the questions (Chairside). It is being built on its own branch, `claude/boards-hub`, in draft
PR https://github.com/smcmurry6-source/study-hubs/pull/70. Nothing of it is on the live site yet. Last worked on
2026-10-14.

## Before you work on it

- **Where:** branch `claude/boards-hub`, not `main`. Its files: `src/boards/` (the hub's sources and the fact records),
  `tools/boards/` (scripts), `tools/build-boards.js` (builds `hubs/boards/index.html` from `src/boards/`: edit the
  sources, never the built page) and `docs/boards/` (plan, decisions, task briefs). Browse them at
  https://github.com/smcmurry6-source/study-hubs/tree/claude/boards-hub/docs/boards
- **Start at** `docs/boards/NEXT.md` on that branch (the handoff), then `docs/boards/DECISIONS.md` (Sam's boards
  decisions) and `docs/boards/PLAN_V2.md` (the plan Sam approved on 2026-10-11).
- **Branches and PRs:** branch from `claude/boards-hub` and open the PR into `claude/boards-hub`, never into `main`.
  A task brief is `docs/boards/tasks/T-NN.md`; touch only the files your brief names.
- **Checks**, on top of the repo's: `node tools/boards/lint-items.mjs` on the item files you changed; every fact id
  you cite exists in `src/boards/facts/`; `node tools/build-boards.js --check` (the page matches its sources) and
  `node tools/ci/boards-plan.test.js` (both run in that branch's CI).
- **Content:** questions are written from the fact records in `src/boards/facts/`, in new wording, and every key
  traces to a fact id with a primary source. No released exam items, prep-company questions or textbook text, on top
  of [graded-coursework](../rules/graded-coursework.md).
- **The branch is behind `main`** (272 commits on 2026-11-03), so it doesn't have the vault yet and its own
  `AGENTS.md` is an older, shorter version of the root one (its boards rules are the ones above). Catching it up:
  [the task](../tasks/2026-11-03-boards-hub-catch-up-with-main.md).

Related: [home](../home.md) · [decisions](../decisions.md)
