---
type: how-to
tags: [shipping]
---

# Ship a change

1. Start from a fresh `main` (`git fetch && git rebase origin/main` before pushing if
   the session has run a while — other Claude Projects push here too).
2. Make the change on your branch. Cloud sessions can only push their own
   `claude/...` branch; that's fine — open a PR. When Sam says "merge", merge it (that publishes); or Sam merges it.
   In a local session, still prefer a branch + PR over pushing `main` directly.
3. Verify before pushing ([verify-before-pushing](verify-before-pushing.md)): the checks for what you touched; CI does
   the rest. **Every change is the same** (no tiers since 2026-11-18): no local release suites, test report or bug-log
   rows for the release, and a preview only when Sam asks ([preview-a-change](preview-a-change.md)). Show Sam a
   screenshot when students will see a difference, and wait for Sam's "merge"
   ([preview-and-release-test](../rules/preview-and-release-test.md)). After the merge, the **After merge** workflow
   runs `node tools/release/postcheck.js` by itself ([after-a-merge](after-a-merge.md)).
4. In the PR description, write what changed in plain, student-facing language, in
   [American English](../rules/american-english.md).
5. **Any student-visible feature, easter egg, trophy, holiday or setting goes on the About page in the same PR**
   ([about-page](../rules/about-page.md)).
6. **Write back to the vault in the same PR** ([repo-is-the-vault](../rules/repo-is-the-vault.md)): the task note's
   outcome, any decision Sam made, anything the next agent working on this hub needs to know.
7. Add a line to "Recent major changes" in `DEPLOY_NOTES.md` for anything non-trivial (in the PR, or after merge),
   and, if students would notice it, a line `<hub> | <message>` in `tools/after-merge/changelog.txt`: after the merge
   it is logged to the site changelog, which sets the hub's "Updated" label on the dashboard (there is no "What's new"
   list any more).
8. **The rest happens by itself after the merge** (Sam, 2026-11-15: "lets make all of that automatic"): the **After merge**
   workflow loads a changed hub's answer keys, deploys Ask Timmy when its function changed, registers a new Timmy Time
   episode, runs a data fix the PR added to `tools/data-fixes/`, logs the changelog lines and runs the post-release check
   ([after-a-merge](after-a-merge.md)). After merging, read its result on `main` (Actions → After merge); a red one says
   which step to fix and run again.

Never force-push `main`. If a PR conflicts, rebase and resolve deliberately —
don't take one side wholesale; the other side is usually another session's work.

Related: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) · [roll-back-a-release](roll-back-a-release.md) ·
[github-is-the-source-of-truth](../rules/github-is-the-source-of-truth.md) ·
[ship-it-now](../rules/ship-it-now.md) · [verify-before-pushing](verify-before-pushing.md) ·
[tasks](../tasks/README.md)
