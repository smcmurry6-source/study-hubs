---
type: task
status: open
hub: vault
created: 2026-11-03
requested-by: Sam
waiting-on: 
agent: Sam (only Sam can change the claude.ai skills)
pr: https://github.com/smcmurry6-source/study-hubs/pull/215
---

# Bring Sam's claude.ai study-hub skills in line with the vault

## Goal

Sam's three claude.ai skills predate the vault and contradict it. Replace two with short versions that point at the
repo, and delete the third, so no agent is told something the vault forbids.

## Context

Checked on 2026-11-03 (the vault PR):
- **`study-hub-builder`** (the most urgent): tells an agent in a Claude Project to "extract literally every question" from
  the course's quizzes, practice packets, crosswords and Slido sets into the hub, which breaks
  [graded-coursework](../rules/graded-coursework.md); still builds the retired Atlas and illustrated-scene game modes
  (removed 2026-09-24/25, replaced by the shared arcade, [arcade-skins](../rules/arcade-skins.md)); keeps a per-Project
  manifest doc instead of the hub note; and has none of the rules added since October (Home page, whys, question
  formats, High Likelihood, filter panel, diagram review). The new version points at `AGENTS.md` and
  [build-a-hub](../how-to/build-a-hub.md), which now hold all of that.
- **`study-hub-deploy`** (Cowork): pushes straight to `main` (the vault: every agent ships a branch and a PR, so CI runs
  before classmates see it), reads `DEPLOY_NOTES.md` for the rules, and says `CLAUDE.md` imports it. The new version
  keeps the Cowork mechanics (PAT, device bridge, Git Data API, Kokoro, long jobs) and ships a `cowork/...` branch and a
  draft PR instead.
- **`study-hub-git-workflow`** (Claude Code): everything in it is now loaded by `CLAUDE.md`, and its pointers (rules in
  `DEPLOY_NOTES.md`) are stale. Delete it.

The replacement files were handed to Sam in the PR's session. If they're lost, any agent can write them again from this
note: each one says the vault wins, points at the notes rather than restating them, and keeps only what's specific to
its setting.

## Done when

- [ ] `study-hub-builder` replaced (claude.ai: Settings → Capabilities → Skills, upload the new zip)
- [ ] `study-hub-deploy` replaced
- [ ] `study-hub-git-workflow` deleted
- [ ] This note moved to `done/` with the date

## Log

- 2026-11-03: the three skills read against the vault; replacements written and validated.

## Outcome

