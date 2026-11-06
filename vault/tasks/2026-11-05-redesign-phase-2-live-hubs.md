---
type: task
status: open
hub: site
created: 2026-11-05
requested-by: Sam
due: 2026-11-19
waiting-on:
agent:
pr:
---

# Redesign phase 2: every live hub on the engine, perio ported

## Goal

Build new versions of **Heme & Endo Exam 2 and Perio** on `widget/hub.js`, with their content as JSON, their tint, emblem, masthead and arcade skin, ready for the one release with the rest (Sam, 2026-11-06). Perio's own engine retires at the release. **PCD Implants and Special Patient Care are not ported** (Sam, 2026-11-06, [decisions](../decisions.md)); they and the archived hubs stay as they are.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- Hub notes: [perio](../hubs/perio.md) (its own engine, `two()`/`tf()`/`nums()`, the case kit), [heme-endo-exam2](../hubs/heme-endo-exam2.md), [special-patient-care](../hubs/special-patient-care.md), [pcd-implants-exam1](../hubs/pcd-implants-exam1.md).
- Each hub is its own PR with a preview link. Each new version is built beside the live hub, the way
  [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md) builds Occlusion's (`hubs/<id>/next/`, `tools/hub-next/build.mjs`
  `--hub <id>`), and goes live with the rest at [the release](2026-11-06-redesign-release.md) (Sam, 2026-11-06).
- The two hubs: **Heme & Endo Exam 2** (`hee2-state-v1`, `hee2:answered`; its Exam 1 Refresher's review-only questions
  through `uncounted()`, its "Exam 1 High likelihood" toggle through `SH_HUB.bank.only`) and **Perio** (its own engine:
  `perio-d2-compendium-state-v1`, `perio:answered`, sessions, notes as template literals, `QBANK_FILTER`, Patient Box
  cases through the case kit, `PERIO_SKIN`). Progress must carry over: same hub id, state key, state shape and answered event.
- What the engine already gives each new version (Sam's second look, 2026-11-06): Focus mode, the live count, the notes'
  previous / next and Report a mistake, the More tiles, the decorated Today and Timmy Time cards. What each hub still
  draws: its emblem, masthead and medals, and **its six arcade lobby drawings** in `tools/figures/site/arcade.mjs`
  (`arcadeArt(hub)` returns null for both today, so the lobby falls back to icons), from its own skin
  ([arcade-skins](../rules/arcade-skins.md)).

## Done when

- [ ] New versions of Heme & Endo Exam 2 and Perio on the engine, beside the live ones, one PR each, with their own emblem and masthead
- [ ] Perio's new version needs no engine of its own; its questions, cases and figures unchanged (ids permanent); the old engine goes at the release
- [ ] The archived hubs untouched; the dashboard's archived cards restyled only
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: Sam narrowed it to Heme & Endo Exam 2 and Perio (no PCD Implants, no Special Patient Care), all released at once.

## Outcome
