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

Move the other live hubs (Heme & Endo 2, Special Patient Care, PCD Implants if still live, perio) onto `widget/hub.js` with their content as JSON, their tint, emblem, masthead and arcade skin. Perio's own engine retires. The four archived hubs stay as they are (Sam).

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- Hub notes: [perio](../hubs/perio.md) (its own engine, `two()`/`tf()`/`nums()`, the case kit), [heme-endo-exam2](../hubs/heme-endo-exam2.md), [special-patient-care](../hubs/special-patient-care.md), [pcd-implants-exam1](../hubs/pcd-implants-exam1.md).
- Each hub is its own PR with a preview link; ship-it-now: a hub whose exam is close goes first.

## Done when

- [ ] Each live hub on the engine, one PR each, with its own emblem and masthead
- [ ] Perio's engine removed; its questions, cases and figures unchanged (ids permanent)
- [ ] The archived hubs untouched; the dashboard's archived cards restyled only
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.

## Outcome
