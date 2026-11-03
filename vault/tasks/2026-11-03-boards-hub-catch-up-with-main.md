---
type: task
status: blocked
hub: boards
created: 2026-11-03
requested-by: Sam
waiting-on: PR 215 (the vault) merged into main
agent: 
pr: 
---

# Bring claude/boards-hub up to date with main

## Goal

`claude/boards-hub` (the INBDE + ADEX hub, draft PR https://github.com/smcmurry6-source/study-hubs/pull/70) last took
in `main` on 2026-10-10 and is 272 commits behind. Merge `main` into it once, on purpose, right after the vault PR
(https://github.com/smcmurry6-source/study-hubs/pull/215) merges, so the boards hub picks up `AGENTS.md`, `vault/` and
the short `CLAUDE.md`, and its next session starts from the same rules as everyone else. Every week it waits, the
merge gets bigger.

## Context

- Hub note: [boards](../hubs/boards.md). Rule: [github-is-the-source-of-truth](../rules/github-is-the-source-of-truth.md):
  never take one side of a conflict wholesale without checking what the other side had.
- A trial merge on 2026-11-03 conflicts in six files. Four conflict with or without the vault: `DEPLOY_NOTES.md`,
  `.gitignore`, `tools/ci/smoke.js` and `tools/ci/syntax.js`. Two come from the vault: `AGENTS.md` (both sides added
  one) and `CLAUDE.md` (main rewrote it). The resolution below was tried in a scratch copy: `syntax.js`, `vault.js`,
  `build-boards.js --check` and `boards-plan.test.js` passed, and `smoke.js` failed only on
  `boards: no LIKELY_TOPICS` (step 3 below; that comes from main's High Likelihood rule of 2026-10-30, not the
  vault). With an empty `LIKELY_TOPICS` added to the page, the smoke test passed on every hub, boards included.
- The 15 boards work branches not yet merged into `claude/boards-hub` (`codex/boards-*`, `claude/boards-session-7`)
  don't touch `AGENTS.md` or `CLAUDE.md`, so they won't conflict on them after this merge.

## How to resolve each file

- **`AGENTS.md`:** keep main's. The boards version's rules are in the [boards hub note](../hubs/boards.md) and
  `vault/rules/`; diff the two once, and put anything still missing in the hub note, not in `AGENTS.md`.
- **`CLAUDE.md`:** keep main's. The boards side changed one sentence: entries about two weeks old move from
  `DEPLOY_NOTES.md` to `DEPLOY_HISTORY.md`. Put that in step 7 of [ship-a-change](../how-to/ship-a-change.md) and
  add `DEPLOY_HISTORY.md` to the [repo map](../reference/repo-map.md).
- **`DEPLOY_NOTES.md`:** start from main's (the vault redirect table on top, every entry main has). The boards side
  moved the 32 entries from 2026-09-26 and earlier into `DEPLOY_HISTORY.md` and put a paragraph saying so after the
  list: keep that split (every Claude Code session loads this file, so shorter is better). Cut those 32 entries from
  main's file and put the paragraph where they were. In the 2026-11-03 trial, 31 were already word for word in
  `DEPLOY_HISTORY.md`; main had since edited one ("perio revamp + Pocket Arcade", 2026-09-24), so copy main's wording
  of it into `DEPLOY_HISTORY.md`. The boards side had no entries of its own.
- **`.gitignore`:** keep both blocks (boards: `.cache/`; main: anima examples, figure previews, `.obsidian/`).
- **`tools/ci/smoke.js`:** one line, where each side added keys to `window.__CI`: keep every key (`CASES` and
  `READINGS_DEEP` from boards, `LIKELY_TOPICS` from main). The rest of the boards checks (`lintBoards`) merge cleanly.
- **`tools/ci/syntax.js`:** main's widget list, plus `widget/timmy.js` and `widget/recap.js` (only the boards list
  had them), then the boards loop over `hubs/<id>/game/*.js`.
- **Anything else** that conflicts by then: combine both sides.

## Steps

1. A branch from `claude/boards-hub` (Claude Code cloud sessions: your own `claude/...` branch).
2. `git merge origin/main`: a merge, not a rebase (the boards branch is shared and other branches build on it).
   Resolve as above and search for conflict markers line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`).
3. Main's [High Likelihood rule](../rules/high-likelihood-topics.md) needs `LIKELY_TOPICS` in every hub. Have the
   boards build (`src/boards/`, then `node tools/build-boards.js`) write `LIKELY_TOPICS = []` into the page, before
   `window.SH_EXPORT = {`, while no unit is published. A published unit then needs its topics like any lecture: ask
   Sam what should rank them for a board exam (the INBDE and ADEX content outlines' weights are the obvious evidence)
   and add that call to [decisions](../decisions.md). Check the other rules main added since 2026-10-10 the same way
   (Home page, filter panel, question formats): the smoke test names what's missing.
4. Run `node tools/build-boards.js --check`, `node tools/ci/boards-plan.test.js`, `node tools/ci/syntax.js`,
   `node tools/ci/vault.js` and `node tools/ci/smoke.js`.
5. Open the PR into `claude/boards-hub` (not `main`), saying what came in from main and how each conflict was
   resolved. Sam merges.

## Done when

- [ ] `claude/boards-hub` has main merged in, every conflicted file resolved as above
- [ ] The boards page has `LIKELY_TOPICS` and the five checks pass
- [ ] The boards hub note says the branch is up to date (with the date); this note's Outcome written and the note
  moved to `done/`

## Log

- 2026-11-03: written with the vault PR, after a trial merge. Waiting on that PR.

## Outcome

