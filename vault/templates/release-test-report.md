---
type: template
tags: [testing, release]
---

# Release test: {{title}}

<!-- The test report for a tier 2 or 3 change (RELEASE_TEST_PLAN.md). Paste it into the PR description, or save it as
     vault/release/reports/<yyyy-mm-dd>-<what>.md when it's long, and link it from the PR. Say what was exercised and
     what was not: "blocked" and "not tested" are fine answers; "passed" for something not run is not. -->

- **Change:** what students will see, in a sentence. PR:
- **Tier:** 2 or 3, and why.
- **Preview:** none (Sam didn't ask for one), or how to open it (the PR's link, a cloud session's live preview, the
  `preview-site` artifact of run …), branch and commit; what Sam was shown (screenshots, a recording).
- **Data:** fixtures / staging. No request reached production (the Preview button's status at the end):

## Automated

Paste the summary from `node tools/release/run.js` (or the "Release tests" run's page), and explain every failure or
"blocked".

## Manual (UAT)

The [UAT checklist](../release/uat-checklist.md) sections used, ticked, with what you saw. Devices and browsers, real or
emulated:

| Device | Browser | Accounts | Result |
|---|---|---|---|
| | | | |

## Bugs

Rows added or closed in the [bug log](../release/bug-log.md): ID, severity, status.

## Not covered

What wasn't tested, and why (no staging, no real iPhone, realtime not simulated…).

## Release

- [ ] Sam approved this release (Sam ticks it).
- [ ] Merged; `node tools/release/postcheck.js` passed:
- [ ] `DEPLOY_NOTES.md` and the site changelog updated.
