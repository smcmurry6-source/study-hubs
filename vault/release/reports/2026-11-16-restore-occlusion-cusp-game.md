---
type: test-report
tags: [testing, release, occlusion]
---

# Release test: restore Occlusion's cusp game

- **Change:** The base Occlusion Question Bank again starts with **What cusp hits where?**, whose Contacts and Movements practice modes retain their existing device-local best score. The game is not shown in Learn, Flashcards, Daily drill, Yesterday's misses, Weak spots or the mock.
- **Tier:** 2 — a student-visible shared Question Bank behavior and generated bundle changed.
- **Preview:** No hosted preview was requested. On branch `codex/restore-cusp-game-pr`, a local fixture-only preview at `http://127.0.0.1:4173/hubs/occlusion/#questions` was used for verification; it was not shared or deployed.
- **Data:** Fixture data only. No production data or writes were used.

## Automated

| Check | Result | Coverage |
|---|---|---|
| `node tools/figures/occlusion/build.mjs --check` | pass | The existing generated game and its CSS are current. |
| `node tools/bundle/build.mjs --check` | pass | The rebuilt shared hub bundle exactly matches its sources. |
| `node --check widget/hub-bank.js` and `node --check tools/ci/smoke.js` | pass | Changed runtime and regression test parse. |
| `node tools/ci/syntax.js` | pass | 12 pages and widget scripts parse. |
| `node tools/ci/vault.js` | pass | 131 vault notes, links, task ordering and rule inventory. |
| `node tools/ci/smoke.js` | blocked locally | The fresh worktree has no `playwright` package. The new assertion must run in CI before merge. |

`tools/ci/smoke.js` now waits for Occlusion's lazy-loaded launcher, verifies its title and both mode buttons, checks its overflow, and confirms that its four set routes do not render it.

## Manual (UAT)

| Device | Browser | Accounts | Result |
|---|---|---|---|
| Desktop (1101 px) | local fixture preview | Returning learner fixture | Light and dark: launcher appears above filters; Contacts and Movements both open; no horizontal overflow. |
| Phone (390 × 844) | local fixture preview | Returning learner fixture | Light and dark: launcher and both buttons fit without horizontal overflow; Movements opens and its four choices fit. |

Contacts' focusable fossa accepts **Enter**, produces feedback, and moves focus to **Next round**. The Daily drill, Yesterday's misses, Weak spots and mock routes each had no game host.

## Bugs

Added [BUG-156](../bug-log.md): S2, fixed (awaiting the CI smoke rerun).

## Not covered

- The full release suite and automated smoke run are blocked in this worktree by the missing Playwright dependency; CI must run them.
- No hosted preview, production request, or physical device was used.

## Release

- [ ] Merged; `node tools/release/postcheck.js` passed:
- [x] `DEPLOY_NOTES.md` and the site changelog updated.
