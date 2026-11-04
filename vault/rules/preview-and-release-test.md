---
type: rule
tags: [shipping, testing]
since: 2026-11-04
---

# Preview and release-test every substantial change

Sam's standing rule, 2026-11-04: **every substantial change is used in an interactive preview, passes the release tests
and gets Sam's explicit approval before it reaches the class**, and is verified, watched and (if needed) rolled back
after. The whole process, with the tiers that say what counts as substantial, is
[RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md). In short:

- **The agent tests:** it uses the change in an interactive preview (`node tools/preview/serve.js`) as the test accounts,
  on an emulated phone and a laptop, and does the UAT itself ([preview-a-change](../how-to/preview-a-change.md)).
- **Sam looks, doesn't test** (Sam, 2026-11-04): the agent shows Sam the change (screenshots first, every time; a short
  recording if it moves; its cloud session's live preview where the Claude app shows it, which has no link Sam can tap);
  Sam says yes or what to change.
- **No production data, ever:** previews and tests run on fixtures (or a staging project), never write to the class's
  data and never count in the analytics. Never type the real admin secret into a preview; never copy production rows
  into fixtures, staging or a report.
- **Gates:** "Check hubs" and "Release tests" green, or each failure explained in the PR; the
  [UAT checklist](../release/uat-checklist.md); every problem in the [bug log](../release/bug-log.md).
- **Approval:** for tier 2 and 3, only Sam ticks "Sam approved this release" in the PR (or comments "approved for
  release"). Agents never tick it and never merge.
- **After:** `node tools/release/postcheck.js`, `tools/release/monitor.sql` at 1, 24 and 48 hours, the changelogs;
  [roll back](../how-to/roll-back-a-release.md) an S1.

It doesn't slow a fix down: tier 1 (a question, a typo, a date) needs only CI and a look in the preview, and
[ship-it-now](ship-it-now.md) still holds: an exam is never a reason to wait.

Related: [ship-a-change](../how-to/ship-a-change.md) · [verify-before-pushing](../how-to/verify-before-pushing.md) ·
[secrets](secrets.md) · [repo-is-the-vault](repo-is-the-vault.md)
