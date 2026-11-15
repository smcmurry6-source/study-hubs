---
type: rule
tags: [shipping]
---

# GitHub is the source of truth

Never trust a locally-cached or previously-read copy of a hub file across
sessions. Before editing or publishing anything in `hubs/` (a hub's page or its `content/`) or
`widget/`:

1. Fetch the file fresh from `main` (raw GitHub content, not a cached Read/Artifact
   snapshot from an earlier turn) and diff it against whatever you were about to
   publish over it.
2. If it changed since your working copy's common ancestor, don't blind-overwrite.
   Do a real three-way merge (`git merge-file -p <mine> <ancestor> <theirs>`),
   then check the result for conflict markers with a line-anchored pattern
   (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) — this file's own CSS uses long `====`
   dividers as comments, which false-positive on a naive substring search.
3. After merging, verify before publishing ([verify-before-pushing](../how-to/verify-before-pushing.md)): the fast
   checks, structural counts (question/lecture counts match what you expect), a duplicate-id check, a check that
   the feature you were adding is actually present, and the smoke test before it goes out.
4. Check the change log ("Recent major changes" in `DEPLOY_NOTES.md`) for anything recent before you
   deploy (the site's own changelog, the Supabase `changelog` table, only drives each hub's "Updated" label and the
   admin page since the redesign) — if someone else's change isn't reflected in your working copy yet,
   that's your signal to go back to step 1.

Claude Code sessions (and any agent that can use git) do this with `git fetch` and a rebase onto `origin/main`:
[ship-a-change](../how-to/ship-a-change.md).
