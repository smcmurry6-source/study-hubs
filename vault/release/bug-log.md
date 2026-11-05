---
type: bug-log
tags: [testing, release]
---

# Bug log

Every problem found in a preview, a release test or after a release, until it is fixed and retested, or accepted by Sam
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 9). Newest first. Add a row in the PR that finds the bug;
update it in the PR that fixes it.

- **Severity:** S1 blocker, S2 major, S3 minor, S4 cosmetic (definitions in the plan).
- **Owner:** who is fixing it (an agent, Sam), or `unassigned`.
- **Status:** open, fixing, fixed (awaiting retest), retested (done), accepted (Sam decided to ship it as it is), won't fix.
- **Retest:** how it was checked after the fix, and when.
- **Never log a security hole here until it's fixed:** tell Sam in chat. Never paste a student's data, name or id.

| ID | Found | Severity | Problem | Owner | Status | Fix | Retest |
|---|---|---|---|---|---|---|---|
| BUG-015 | 2026-11-04, reading `review/index.html` | S3 | Admin Surveys tab: exam check-in groups were sorted by their hub and exam name in reverse (`Object.keys(groups).sort().reverse()`), not by when check-ins came in, so a new check-in could sit under older groups | Claude Code | fixed (awaiting retest) | the admin-operations PR: groups sort by their newest check-in, rows newest first, `id` breaks ties in `get_exam_debriefs` / `get_survey_results` (migration_v50) | 2026-11-04 in the preview (`admin-ui.js`, fixtures out of order) and on a throwaway database (`admin-ops.js`, equal times); retest on the live page after the release |
| BUG-014 | 2026-11-04, CI `a11y.js` on PR 235 | S3 | Perio: the Review sidebar and the mock-exam bar were sticky at fixed offsets (70 px, 58 px) that assume a one-row top bar; with the bar stacked in two rows the sidebar's top slid under it (axe target-size on the "All sessions" chip) | Claude Code | fixed (awaiting retest) | the top bar PR: both follow `--sh-head-h` | |
| BUG-013 | 2026-11-04, top-bar audit at the largest text size | S4 | At XX-Large text on a 390 px phone, the widget's Settings sheet button rows (`.shset-seg`) and Timmy's speech bubble on the dashboard (`.shpet-say`) are wider than the screen | unassigned | open | | |
| BUG-012 | 2026-11-04, header audit | S3 | Perio's arcade leaderboard tabs (`.ar-board-tabs`) scrolled past the edge behind a hidden scrollbar; the later games' boards were out of sight | Claude Code | fixed (awaiting retest) | the top bar PR: the tabs wrap | |
| BUG-011 | 2026-11-04, header audit | S3 | Dashboard: at 320 px the theme button sat past the screen's edge (the page scrolled sideways 30 px); the Arcade high scores' hub and game rows hid most of their buttons past the edge at every width | Claude Code | fixed (awaiting retest) | the top bar PR: the buttons wrap onto their own row; the arcade rows wrap | |
| BUG-010 | 2026-11-04, Sam (cramped top bar, Arcade cut off) | S2 | Hub top bars: at 1001-1280 px the Arcade tab (and in PCD Implants, Review) was clipped inside the mode switch behind an invisible scrollbar (Occlusion, PCD Implants, Special Patient Care, Perio, Heme & Endo, PCD 3); at 320 px it sat past the edge and the page scrolled sideways (4 hubs); under 760 px some tab labels were `display:none`, leaving tabs with no spoken name; the hub name was hidden on phones. Root cause: per-hub width breakpoints guessing what the content needs, and the text-size setting zooms `<html>` where media queries can't see it | Claude Code | fixed (awaiting retest) | the top bar PR: the widget measures the bar and picks row / stack / stack3 and inline / tall / grid tabs (`widget/v3.js`, `widget/v3.css`); a smoke check guards it | |
| BUG-009 | 2026-11-04, `matrix.js` | S4 | 4 controls under 24x24 px on a Pixel 7-sized phone and 1 on an iPad in landscape, in the live hubs (WCAG 2.2 target size) | unassigned | open | | |
| BUG-008 | 2026-11-04, `matrix.js` slow 3G | S3 | On slow 3G, a hub's mode bar shows in about 2 s but taps do nothing until its script finishes: about 15 s for Occlusion, 8.5 s for Special Patient Care | unassigned | open | | |
| BUG-007 | 2026-11-04, `a11y.js` keyboard | S3 | 18 keyboard stops on the About page have no visible focus (its links) | unassigned | open | | |
| BUG-006 | 2026-11-04, `a11y.js` | S3 | About page: the seasons table scrolls sideways but can't be reached by keyboard (`scrollable-region-focusable`, 2) | unassigned | open | | |
| BUG-005 | 2026-11-04, `a11y.js` | S3 | Diagrams drawn as `role="img"` SVGs with no text alternative: PCD Implants Compendium and Review (6 each), Perio Review's suture figures (10) | unassigned | open | | |
| BUG-004 | 2026-11-04, `a11y.js` | S3 | Perio Review: the lecture filter buttons (`.rv-chip`, `data-rv-lec`) use `aria-selected`, which a plain button doesn't support, so screen readers don't announce which one is on (10; axe rates it critical). `aria-pressed` is the fix | unassigned | open | | |
| BUG-003 | 2026-11-04, `a11y.js` | S3 | Buttons whose spoken name doesn't contain their visible text (29 on 20 screens): the widget's Stats launcher (`#shstat-launch`) and the podcast speed button (`.sh-pod-rate`); voice-control users can't say what they see | unassigned | open | | |
| BUG-002 | 2026-11-04, `a11y.js` | S3 | Text below WCAG AA contrast: 94 elements on 20 screens (light and dark), e.g. lecture-number tags on Occlusion's Home, the About page's tags | unassigned | open | | |
| BUG-001 | 2026-11-04, `rls.js` | S2 | `supabase/schema.sql` couldn't rebuild the database: its migration_v31 section had `$` where `$$` quotes belong (and lost a `$'` in `claim_cavity`'s week check), so a disaster-recovery rebuild would have failed partway | Claude Code | retested | this PR (the release test process): the section's quoting restored | 2026-11-04: the whole file loads into a fresh PostgreSQL 16 in one transaction (38 tables, 98 functions, the same counts as the live project); `rls.js` passes on it |

Known accessibility issues are also counted per screen in `tools/release/baselines/a11y.json`, so they can't grow; fixing
one lowers its count there (`node tools/release/a11y.js --update`).

Related: [uat-checklist](uat-checklist.md) · [roll-back-a-release](../how-to/roll-back-a-release.md)
