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
2026-11-25 (T-07: onto the engine, #562).

## Before you work on it

- **Where:** branch `claude/boards-hub`, not `main`. Its files: `src/boards/` (the hub's sources and the fact records),
  `tools/boards/` (scripts), `tools/build-boards.js` (writes the hub's content, `hubs/boards/content/*.json`, from
  `src/boards/`: edit the sources, never the JSON), `hubs/boards/index.html` (the engine's settings page, written by hand)
  and `docs/boards/` (plan, decisions, task briefs). Browse them at
  https://github.com/smcmurry6-source/study-hubs/tree/claude/boards-hub/docs/boards
- **Start at** `docs/boards/NEXT.md` on that branch (the handoff), then `docs/boards/DECISIONS.md` (Sam's boards
  decisions) and `docs/boards/PLAN_V2.md` (the plan Sam approved on 2026-10-11).
- **Branches and PRs:** branch from `claude/boards-hub` and open the PR into `claude/boards-hub`, never into `main`.
  A task brief is `docs/boards/tasks/T-NN.md`; touch only the files your brief names.
- **Checks**, on top of the repo's: `node tools/boards/lint-items.mjs` on the item files you changed; every fact id
  you cite exists in `src/boards/facts/`; `node tools/build-boards.js --check` (the content matches its sources, laid out
  as `tools/hub-next/build.mjs` would) and `node tools/ci/boards-plan.test.js` (both run in that branch's CI). A drafts
  preview writes only to a folder: `node tools/build-boards.js --include-drafts --out <dir>`.
- **Content:** questions are written from the fact records in `src/boards/facts/`, in new wording, and every key
  traces to a fact id with a primary source. No released exam items, prep-company questions or textbook text, on top
  of [graded-coursework](../rules/graded-coursework.md).
- **The branch is up to date with `main`** (2026-11-20, `main` at #504 merged in:
  [the task](../tasks/done/2026-11-03-boards-hub-catch-up-with-main.md)), so it has `AGENTS.md`, the vault and the short
  `CLAUDE.md`; its old `AGENTS.md` and `DEPLOY_HISTORY.md` are gone. Bring `main` in again with a merge (never a rebase),
  then rerun `node tools/build-boards.js`; never resolve `hubs/boards/content/` by picking a side (rebuild it).
- **It moves onto the engine before it ships** (Sam, 2026-11-22: "Yes to 2 and 3", 2 being "Should boards move onto the hub
  engine? I recommend yes"; [decisions](../decisions.md)): **[the task](../tasks/2026-11-22-boards-onto-the-engine.md)**. The plan is
  `docs/boards/ENGINE_PLAN.md` on the branch (approved 2026-11-22, Chairside kept), built as briefs T-07 to T-17.
  **Since T-07 (2026-11-25, #562) it is a hub on the engine**: `hubs/boards/content/` drawn by `widget/hub.js`, and
  `tools/ci/smoke.js` walks it as one, with the bank lint and `lintBoards` reading `content/`. The units are its
  lectures, grouped by the INBDE's three components (`GROUPS` in `src/boards/config.js`); pharm and medcx are listed as
  coming, since the engine draws Home and Notes only with a lecture, and nothing is published until a unit's items are
  checked. Its narration is off (`"audio": "off"`). Still to come: the levels' names and the coming units (T-08, T-09),
  the exam card without dates (T-09), the case box on a card (T-10), and its art, `hubs.js`, `sw.js` and the dashboard
  (T-15).
- **Its storage grows with people × items, not with time** (Sam, 2026-11-22, [decisions](../decisions.md); package 3 of
  [the sustainability task](../tasks/2026-11-22-sustainable-for-years.md)): boards stays live until about August 2028, and
  keeping every attempt for good the way other hubs do could fill the free database on its own. It keeps each person's
  latest state on each item, daily totals for XP, and recent attempts (about 30 days, for question health and paying once).
  The build picks how (a boards-only answer path, or folding old attempts into per-item state for every hub). **No
  narration or Timmy Time recording in this repo** ([no-narration-in-the-repo](../rules/no-narration-in-the-repo.md)).
- **No High Likelihood for now** (Sam, 2026-11-21: "I have no idea so maybe just take it out for now", asked what should rank a
  board exam's topics; [decisions](../decisions.md), [high-likelihood-topics](../rules/high-likelihood-topics.md)): the build writes
  `"likelyTopics": []` into `core.json`, and nothing on the page shows High Likelihood. `tools/ci/smoke.js`'s check for a lecture
  with questions but no topics skips boards (`LIKELY_SKIP`, since T-07).
- **The open PRs into this branch** (16 from 2026-10-13/14, left open on 2026-11-20 by Sam; their reviews are
  `docs/boards/reviews/session-7.md` and `session-7b.md`) go the way section 6 of `docs/boards/ENGINE_PLAN.md` (on
  `claude/boards-hub`) says: #81, #97, #100 and #102 were closed as replaced by the engine (2026-11-22); #95 and #101 (Chairside) land
  through T-16 and T-17; the other ten are finished as they are and, now that T-07 has landed, merge without a page rebuild
  (#111 changes the old generated page: take the branch's settings page and rebuild). None merges `main` in on its own (the
  inbox line).

Related: [home](../home.md) · [decisions](../decisions.md)
