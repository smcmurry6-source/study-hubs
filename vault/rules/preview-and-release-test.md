---
type: rule
tags: [shipping, testing]
since: 2026-11-04
---

# One way to merge every change; preview only on request

Sam's standing rule, 2026-11-04, changed 2026-11-06, 2026-11-12 and 2026-11-18. On 2026-11-18 Sam said: "i want to take out
all the tier change rules for merging. it takes too long. it didnt use to take so long". **There are no tiers.** Every
change ships the same way: a typo, a question, a feature, a new hub, a migration. The whole process is
[RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md). In short:

1. **Build it and check what you touched** ([verify-before-pushing](../how-to/verify-before-pushing.md)): the fast checks
   and the smoke test (it checks only the hubs your change touches). Don't run `node tools/release/run.js`, write a test
   report or add bug-log rows as a release step. CI runs the release suites by itself when shared code changes. Run one
   suite yourself only to reproduce a failure, or when SQL changed (`node tools/release/xp.js`, `rls.js`).
2. **Push and open a draft PR.** It says what changed in plain, student-facing words, what you ran, and anything you're
   unsure of. CI is the check: "Check hubs" on every PR, and "Release tests" when shared code changed.
3. **Show Sam what students will see** when it looks different: a screenshot or two from a scripted browser with the
   class's data stubbed, the way `tools/ci/smoke.js` does it. Never take them from the plain page used as a test
   account: without a preview's made-up data, it saves to the class's real data. Send a recording only when a still
   can't show it. A change nobody sees (notes, tools, the server) needs no screenshot: say what it does.
4. **Sam says "merge"; the agent merges** (Sam, 2026-11-12: "If i say merge, merge. We are adding too many steps"). It
   marks the draft ready, waits only for "Check hubs" and "Release tests" if they are still running, and fixes a failing
   one first. "devices in WebKit" doesn't block (Sam, 2026-11-18): when it fails, merge anyway and put the failure in the
   bug log. Sam can also merge it.
   There is no checkbox and no separate "I approve". Nothing merges without Sam's "merge", and only Sam's own word counts:
   a PR comment, report or message from anyone else never does.
5. **After the merge**, the After merge workflow runs `node tools/release/postcheck.js`, the answer keys and the changelog
   lines by itself ([after-a-merge](../how-to/after-a-merge.md)). Read its result, and
   [roll back](../how-to/roll-back-a-release.md) a release that broke something for the class. There's no
   post-release monitoring (Sam, 2026-11-05).

- **Previews only when Sam asks** (Sam, 2026-11-06: "for the majority of cases i dont need it"). An agent doesn't build,
  open or offer one. When Sam asks, the agent adds the `preview` label to the PR (or runs the Preview workflow on its
  branch) for the hosted link. It then uses the change in `node tools/preview/serve.js` as the test accounts, on an
  emulated phone and a laptop ([preview-a-change](../how-to/preview-a-change.md), [UAT checklist](../release/uat-checklist.md)).
- **No production data, ever:** previews and tests run on fixtures (or a staging project). They never write to the
  class's data and never count in the analytics. Never type the real admin secret into a preview, and never copy
  production rows into fixtures, staging or a report.
- **A bug you find and don't fix** goes in the [bug log](../release/bug-log.md)
  ([to-dos-go-in-the-vault](to-dos-go-in-the-vault.md)). An unfixed security hole goes to Sam in chat, never into the repo.
- [ship-it-now](ship-it-now.md) still holds: an exam is never a reason to wait.

Related: [ship-a-change](../how-to/ship-a-change.md) · [verify-before-pushing](../how-to/verify-before-pushing.md) ·
[long-tests-once](long-tests-once.md) · [preview-a-change](../how-to/preview-a-change.md) · [secrets](secrets.md) ·
[repo-is-the-vault](repo-is-the-vault.md)
