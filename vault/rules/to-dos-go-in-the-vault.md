---
type: rule
tags: [tasks, agents, vault]
since: 2026-11-12
---

# Anything left to do goes on the to-do list, and is checked off when done

Sam's standing rule, 2026-11-12, for every agent and every session: "make it a standing rule to add things like that to a
to do so things dont get lost in chats that need to be done. check them off as they are done." (It came up when Sam put
off the High yield narration: "add that as a to do for later".) Sam again, 2026-11-18, when the list had fallen behind:
"make it a rule that any sessions from now on will add open items to the to do list and check things off that have been
done."

- **Whatever still needs doing goes in the vault, not only in the chat.** Work Sam puts off ("later", "add that as a to do",
  "hold it"), work that is held or blocked (waiting on Sam, a recording, an announcement, room on the site), a follow-up an
  agent finds and doesn't do in its PR, a step a release still needs. A chat, an agent's memory or a PR comment doesn't
  count: the next agent never sees them ([repo-is-the-vault](repo-is-the-vault.md)).
- **Where it goes:**
  - a **task note** in `vault/tasks/` ([how tasks work](../tasks/README.md)) when it needs context or a session of its
    own: what, why, what Sam already decided (quoted), how, and a **Done when** checklist;
  - a line in [the inbox](../tasks/inbox.md) (`- [ ] ...`) for a quick one;
  - a box in the Done when of the task it belongs to, when it's a step of one already written (the redesign's release
    steps go in [its note](../tasks/done/2026-11-06-redesign-release.md));
  - a row in [the bug log](../release/bug-log.md) for a bug found in testing or after a release and left open.
  Write it in the same PR as the work it came from; when there is no other PR, a small vault-only one.
- **Check it off as it's done**, in the PR that does it: tick its box (`- [x]`). When every box of a task is ticked, write
  its Outcome, set `status: done` and move it to `vault/tasks/done/`. A done inbox line is ticked with its PR (`- [x] ...
  (#123)`); whoever next goes through the inbox clears the ticked lines. Something dropped is marked so with the reason
  (`status: dropped`, or the line struck with a word on why), never just deleted.

## Every session, every time (2026-11-18)

1. **At the start**, `node tools/todo/list.mjs --ref origin/main` (seconds) and look for items on the hub or feature
   you're about to touch, so your PR can tick what its work finishes and you don't redo or undo someone's open item.
2. **Before you open the PR**, in the PR itself: tick everything the PR finishes (the inbox line, the task's boxes, its
   Outcome and status, the bug row's status and retest), and add everything it leaves: the step you didn't get to, the
   follow-up you found, the call Sam still has to make, the migration to apply after the merge, the bug you saw and didn't
   fix.
3. **Tick what you find already done**, whoever did it: a task note still `in-progress` after its PR merged, an inbox line
   a merged PR did, a bug fixed but never retested that you just watched work. Say so in your PR. A step that can only be
   ticked after the merge (a migration, a deploy) is ticked by whoever does it, in that follow-up's PR.
4. **The PR description's "To-do list" section** ([the PR template](../../.github/pull_request_template.md)) says what you
   ticked and what you added, with where; "nothing" is an answer, an empty section isn't.

**Before finishing**, tell Sam what's left and where it was written down. Sam can ask for the whole list at any time, as
numbered packages with a prompt for each ([package-the-to-dos](../how-to/package-the-to-dos.md); Claude Code: `/backlog`).

Related: [how tasks work](../tasks/README.md) · [the inbox](../tasks/inbox.md) · [repo-is-the-vault](repo-is-the-vault.md) ·
[decisions](../decisions.md) · [package-the-to-dos](../how-to/package-the-to-dos.md)
