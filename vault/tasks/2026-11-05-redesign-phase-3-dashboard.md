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
- **Added 2026-11-06 (Sam)**: [the idea board](2026-11-06-idea-board.md) is part of this phase (a dashboard section and a
  page in a hub's More, `widget/ideas.js`), and the "you" card shows [Timmy's place](2026-11-06-redesign-timmys-place.md)
  (drawn in phase 4, part C). The server side of both is in [phase 5](2026-11-05-redesign-phase-5-backend.md), part 3.
- **Built beside the live dashboard, released with the rest** (Sam, 2026-11-06, [decisions](../decisions.md)): the new
  dashboard is a page next to `index.html` (for example `next/index.html`) that links to the new hub versions, and it
  replaces `index.html` at [the release](2026-11-06-redesign-release.md). The About page's rewrite is drafted in the
  release note and lands with it, since the live About page describes the live site until then.

## Done when

- [ ] The idea board on the new dashboard and in More, with its starting ideas ready to post at the release

- [ ] The dashboard on the design system, inspector 0 FAIL at three widths, light and dark
- [ ] Check-ins, surveys, notices, luck, the leaderboard, streaks, archive rules and the tour all work on the preview
- [ ] About page lists every changed feature, counts true
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: the idea board and Timmy's place added (Sam).

## Outcome
