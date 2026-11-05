---
type: how-to
tags: [shipping]
---

# Ship a change

1. Start from a fresh `main` (`git fetch && git rebase origin/main` before pushing if
   the session has run a while — other Claude Projects push here too).
2. Make the change on your branch. Cloud sessions can only push their own
   `claude/...` branch; that's fine — open a PR and Sam merges it to publish.
   In a local session, still prefer a branch + PR over pushing `main` directly.
3. Verify before pushing ([verify-before-pushing](verify-before-pushing.md)). **A substantial change** (tier 2 or 3 in
   [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)) also gets a preview ([preview-a-change](preview-a-change.md)),
   the release suites, UAT, its bug-log rows and a test report in the PR, and waits for Sam to tick "Sam approved this
   release" ([preview-and-release-test](../rules/preview-and-release-test.md)). After the merge:
   `node tools/release/postcheck.js`.
4. In the PR description, write what changed in plain, student-facing language, in
   [American English](../rules/american-english.md).
5. **Any student-visible feature, easter egg, trophy, holiday or setting goes on the About page in the same PR**
   ([about-page](../rules/about-page.md)).
6. **Write back to the vault in the same PR** ([repo-is-the-vault](../rules/repo-is-the-vault.md)): the task note's
   outcome, any decision Sam made, anything the next agent working on this hub needs to know.
7. Add a line to "Recent major changes" in `DEPLOY_NOTES.md` for anything non-trivial (in the PR, or after merge),
   and log it to the site changelog (`log_changelog`, see [secrets](../rules/secrets.md)) if students would notice it.

Never force-push `main`. If a PR conflicts, rebase and resolve deliberately —
don't take one side wholesale; the other side is usually another session's work.

Related: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) · [roll-back-a-release](roll-back-a-release.md) ·
[github-is-the-source-of-truth](../rules/github-is-the-source-of-truth.md) ·
[ship-it-now](../rules/ship-it-now.md) · [verify-before-pushing](verify-before-pushing.md) ·
[tasks](../tasks/README.md)
