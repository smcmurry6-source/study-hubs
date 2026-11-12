---
type: rule
tags: [shipping, testing, speed]
since: 2026-11-12
---

# Run the long tests once, then let CI be the check

Sam's rule, 2026-11-12, after a merge Sam had asked for took two hours: `main` moved three times, and each time the
agent brought it in and ran the every-hub smoke test again on its own machine (7 minutes a run) before pushing, the
same test CI runs on every push. Sam: "do these things need to take this long?"

- **While building,** run what you touched: the fast checks, and the smoke test (it already checks only the hubs your
  change touches).
- **When a change or a fix is finished,** run the long ones **once** on the final code: the smoke test on every hub when
  shared files changed, `node tools/release/run.js` for a tier 2 or 3 change.
- **Once that has passed, push, and CI is the check.** Don't run a long suite again on your own machine for something
  that changed nothing it tests: a rebase or merge of `main` with no conflict in code you changed, a vault note, a PR
  description. After bringing `main` in, run only the fast checks (`node tools/ci/syntax.js`, `node tools/ci/vault.js`,
  the `--check` builds, `node tools/release/secrets.js`: seconds each), push, and read CI's result. CI tests the branch
  merged with `main`, which is the thing that will ship.
- **No gate goes away.** CI is still green before a merge, a red check is still reproduced before it's fixed (with the
  one test that failed, not the whole suite), and a conflict in code you changed, or a fix to code, starts again from
  the second point.
- **Say how long.** When Sam is waiting on a push, say what is still running and about how long it takes ("Check hubs"
  about 8 minutes and "Release tests" about 15 when shared code changed; a hub's content or a note, a minute or two).

Related: [verify-before-pushing](../how-to/verify-before-pushing.md) · [ship-a-change](../how-to/ship-a-change.md) ·
[preview-and-release-test](preview-and-release-test.md) · [run-a-redesign-session](../how-to/run-a-redesign-session.md) ·
[ship-it-now](ship-it-now.md)
