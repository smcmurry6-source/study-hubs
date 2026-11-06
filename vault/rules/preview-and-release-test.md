---
type: rule
tags: [shipping, testing]
since: 2026-11-04
---

# Release-test every substantial change; preview it on request

Sam's standing rule, 2026-11-04, changed 2026-11-06: **every substantial change passes the release tests and gets Sam's
explicit approval before it reaches the class**, and is verified and (if needed) rolled back after. **A preview is made
only on request** (Sam, 2026-11-06: "for the majority of cases i dont need it"). The whole process, with the tiers that
say what counts as substantial, is [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md). In short:

- **Previews on request.** An agent doesn't open, build or show a preview by default. For a tier 2 or 3 change it asks
  Sam once, in one line, when it hands the change over ("Want a preview of this?"), and goes on without one unless Sam
  says yes. Tier 0 and 1 don't ask. Sam can ask for one at any time.
- **With a yes**, the agent adds the `preview` label to the PR (or runs the Preview workflow on its branch) for the
  hosted link, and uses the change in an interactive preview (`node tools/preview/serve.js`) as the test accounts, on
  an emulated phone and a laptop, doing the UAT itself ([preview-a-change](../how-to/preview-a-change.md),
  [UAT checklist](../release/uat-checklist.md)).
- **Without a preview**, the checks are the automated ones: CI and the release suites, which fake or stub the class's
  data. Screenshots for Sam come from a scripted browser with the class's data stubbed, the way `tools/ci/smoke.js`
  does it. Never from the plain page used as a test account: without the preview's made-up data, it saves to the class's
  real data.
- **Sam looks, doesn't test** (Sam, 2026-11-04): the agent shows Sam the change (screenshots, a short recording if it
  moves, and the preview link on its own line, first, when there is one); Sam says yes or what to change.
- **No production data, ever:** previews and tests run on fixtures (or a staging project), never write to the class's
  data and never count in the analytics. Never type the real admin secret into a preview; never copy production rows
  into fixtures, staging or a report.
- **Gates:** "Check hubs" and "Release tests" green, or each failure explained in the PR; the UAT checklist when there
  is a preview; every problem in the [bug log](../release/bug-log.md).
- **Approval:** for tier 2 and 3, only Sam ticks "Sam approved this release" in the PR (or comments "approved for
  release"). Agents never tick it and never merge.
- **After:** `node tools/release/postcheck.js` and the changelogs; [roll back](../how-to/roll-back-a-release.md) an S1.
  No post-release monitoring (Sam, 2026-11-05): no timed checks after a release and no scheduled check-ins for one.

It doesn't slow a fix down: tier 1 (a question, a typo, a date) needs only CI, and
[ship-it-now](ship-it-now.md) still holds: an exam is never a reason to wait.

Related: [ship-a-change](../how-to/ship-a-change.md) · [verify-before-pushing](../how-to/verify-before-pushing.md) ·
[preview-a-change](../how-to/preview-a-change.md) · [secrets](secrets.md) · [repo-is-the-vault](repo-is-the-vault.md)
