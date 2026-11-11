---
type: task
status: in-progress
hub: site
created: 2026-11-05
requested-by: Sam
due: 2026-11-19
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/312
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
- 2026-11-11: Sam: **Heme & Endo Exam 2 first**, then Perio, each in its own fresh session ([run-a-redesign-session](../how-to/run-a-redesign-session.md)).
- 2026-11-06: Sam narrowed it to Heme & Endo Exam 2 and Perio (no PCD Implants, no Special Patient Care), all released at once.
- 2026-11-11 (Claude Code, hand-off): **Heme & Endo Exam 2's new version is built**, its own session as Sam asked
  ([run-a-redesign-session](../how-to/run-a-redesign-session.md)), waiting for Sam's
  look. What's built: `hubs/heme-endo-exam2/next/` (settings in `SH_HUB`; content from `node tools/hub-next/build.mjs`, all
  609 ids, state key and answered event unchanged; how it's kept in step and every piece: the [hub note](../hubs/heme-endo-exam2.md),
  "The new version"); in `widget/hub.js` (gated, Occlusion's new version unchanged) review-only lectures, a toggle tied to a
  lecture, the grouped and High-Likelihood-only mock, the "which statement" filters, focus-list hints and `hints.words`; the
  build without `od:kit`; the six arcade lobby drawings (`arcade.mjs`). Checked on the local preview as the returning test
  account, phone and laptop: the four views, every More page, the six games, the drill, the mock (50: L12a + L12b = 9, R's 5
  High Likelihood), Exam 1 High likelihood ticking and unticking R; the release drafts are in [the release note](2026-11-06-redesign-release.md).
  **Left for Heme & Endo:** Sam's look on [PR #312](https://github.com/smcmurry6-source/study-hubs/pull/312) (one round, screenshots shown in the session) and anything it asks for; the timing question (its
  exam is 11/13, so by the release's rule it is switched in only if the release comes first).
- 2026-11-11 (Claude Code, same session): Sam's look: "it needs a little bit more color ... to distinguish each lecture", and
  "everything else looks good". Built in the engine for every hub on it: each lecture's own color (question cards, the
  notes' list, Home, the picker, hints, cram, mock, stats; review-only grey) and **Notes done** (a button at the end of the
  notes, or reading to the end after a minute). Checking Timmy Time on the engine found BUG-056 (the player's buttons in the
  default color with dark labels on every new hub), fixed. Sam's answers: switch it in only if the release beats 11/13; the
  About page now says the mock's five Exam 1 questions are drawn at random; a preview (the `preview` label on #312). Learn
  and Flashcards wasn't lost: it's [its own task](2026-11-06-redesign-learn-and-flashcards.md), not started. **Left for
  Heme & Endo:** Sam's look at the colors in the preview.
- 2026-11-11 (Claude Code, same session): Sam: "Looks much better. Redesign the timmy time ui/card", and asked whether the
  animated card still shows on Home (yes, among the quick starts, unchanged). Built in the engine for every hub on it:
  More > Timmy Time as one page (the episode on the hub's color with Timmy in headphones, the chapters always open, then
  what the class thinks; the pinned player in the hub's color), checked on Occlusion's new version (the only one with an
  episode). axe on it found BUG-057 in the shared player (the speed and vote buttons' spoken names), fixed live with no
  look change. **Left for Heme & Endo:** Sam's look at the colors and the player in the preview. **Next step for this task:**
  Perio's port in a fresh session (its own engine: `QBANK_FILTER`, sessions, template-literal notes, the case kit,
  `PERIO_SKIN` and its six lobby drawings), reading this note, the [perio hub note](../hubs/perio.md) and phase 1's Outcome.
- 2026-11-11 (Claude Code, hand-off): **Perio's new version is built**, its own session as Sam asked, waiting for Sam's look
  and the arcade drawings' yes. What's built: `hubs/perio/next/` (settings in `SH_HUB`; content from
  `node tools/hub-next/build.mjs --hub perio` through `adaptPerio()`, all 749 ids, state key, answered event and Perio's own
  saved shape unchanged; every piece: the [hub note](../hubs/perio.md), "The new version"). In `widget/hub.js`, gated so
  Occlusion's and Heme & Endo's new versions are unchanged: Perio's saved shape (`stateShape: "answered"`), recall cards,
  case links, HTML review sections under each session's notes (Side by side hidden), the exam-format mock (46 in 80, 5 Patient
  Box, 5 multiple-answer with partial credit, 1 ordering), Perio's export for question health, and its arcade's `start`/`stop`.
  For every hub on the engine: the games keep their own buttons' style (BUG-058) and tag a question with its lecture's color.
  Checked on the local preview as the returning test account, phone and laptop: the four views, every More page, an answer
  of each kind, a drawn case and its links, the mock, all six games (an arcade answer counts), lecture colors (9) and Notes
  done; a carried-over save (old bank filters, a retired id, trophies, arcade bests) keeps Perio's shape, and the live page
  reads a save the new one wrote. The exports match the live hubs' for all three new versions. Checks: syntax, vault, build
  `--check`, cases, smoke (every hub), secrets, archive, preview safety, accessibility (Perio's new page clean, its baseline
  added; its text a deeper pink for contrast) and performance (564 KB against the live page's 1,106; its budget added).
  The database suites need PostgreSQL, which this session lacks: CI runs them. **Left for Perio:** Sam's look on the PR,
  Sam's yes on the six lobby drawings (contact sheet sent; until then the lobby shows icons; how to switch them in: the hub
  note), BUG-059 (Occlusion's and Heme & Endo's game header buttons, open). The release drafts are in
  [the release note](2026-11-06-redesign-release.md). **Next step for this task:** Sam's answers on Perio, then the
  [release](2026-11-06-redesign-release.md); this note's Outcome once both new versions are approved.

## Outcome
