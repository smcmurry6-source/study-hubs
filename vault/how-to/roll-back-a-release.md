---
type: how-to
tags: [shipping, release]
---

# Roll back a release

When a release breaks something for the class (an S1 in [the bug log](../release/bug-log.md), or Sam says so), undo it
first and debug after. A rollback is a release too: it goes through a PR, and Sam merges it.

1. **Find the merge.** On GitHub, the PR's page; or `git log --merges --oneline origin/main | head`.
2. **Revert it with a new PR.** On the merged PR's page, **Revert** makes the PR. Or by hand:
   `git fetch origin main && git switch -c <your-branch> origin/main && git revert -m 1 <merge-sha>`, push, open a PR.
   Never force-push `main`, never reset it.
3. **Check the revert** like any change: CI (a preview only if Sam asks for one), and that the
   reverted files don't also carry someone else's later fix (if a later PR built on the change, revert both or fix
   forward; say which in the PR).
4. **Sam merges.** Pages republishes in a minute or two. Pages and scripts are network-first in the service worker, so
   students get the old version on their next load; when only cached files changed (a precached widget script), bump
   `VERSION` in `sw.js` in the revert too.
5. **Verify:** `node tools/release/postcheck.js` (the reverted files are live and identical to `main`, the pages load).
   Then the broken thing, by hand, on a phone.
6. **Database changes:** a migration is undone with a new migration that reverses it (committed as the next
   `migration_v*.sql`, `supabase/schema.sql` refreshed), applied through the connector or the SQL editor. Never restore the
   live database from a backup, and never delete rows, without Sam: it would erase everything students did since.
7. **Tell people:** a "Recent major changes" line in `DEPLOY_NOTES.md` (what was rolled back and why); the site changelog;
   and, if students saw the problem, a notice to everyone, which Sam approves first
   ([reply-to-reports](reply-to-reports.md)). Reply to any reports it caused.
8. **The bug log:** the row gets the revert PR, and stays open until the fixed change ships and is retested.

Related: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) · [ship-a-change](ship-a-change.md) ·
[shared-infrastructure](../reference/shared-infrastructure.md) (Pages deploys)
