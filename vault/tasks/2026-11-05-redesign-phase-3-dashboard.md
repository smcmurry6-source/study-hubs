---
type: task
status: open
hub: dashboard
created: 2026-11-05
requested-by: Sam
due: 
waiting-on:
agent:
pr:
---

# Redesign phase 3: the dashboard and the About page

## Goal

Rebuild `index.html` on the design system: the next exam and Start studying first, the hubs as tabs with their emblems and tints, one "you" card (Timmy's house, rank, mastery; the rank card and the house merged), the class board with When people study as a line under it, the recaps slideshow for archived hubs, the podcast card per hub; "Correct in a row" cut. The About page rewritten for every feature that changed.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- The dashboard today: `HUBS`/`CLASSES`/`ARCHIVED_HUBS`/`ARCADES` arrays, `#petHome`, `widget/archive.js`, the check-in and survey flows, `widget/tour.js` (the full tour stays in the menu; no prompt on arrival).
- The About page rule: [about-page](../rules/about-page.md).

## Done when

- [ ] The dashboard on the design system, inspector 0 FAIL at three widths, light and dark
- [ ] Check-ins, surveys, notices, luck, the leaderboard, streaks, archive rules and the tour all work on the preview
- [ ] About page lists every changed feature, counts true
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.

## Outcome
