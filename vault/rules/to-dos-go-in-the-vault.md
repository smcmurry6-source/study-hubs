---
type: rule
tags: [tasks, agents, vault]
since: 2026-11-12
---

# Anything left to do goes on the to-do list, and is checked off when done

Sam's standing rule, 2026-11-12, for every agent and every session: "make it a standing rule to add things like that to a
to do so things dont get lost in chats that need to be done. check them off as they are done." (It came up when Sam put
off the High yield narration: "add that as a to do for later".)

- **Whatever still needs doing goes in the vault, not only in the chat.** Work Sam puts off ("later", "add that as a to do",
  "hold it"), work that is held or blocked (waiting on Sam, a recording, an announcement, room on the site), a follow-up an
  agent finds and doesn't do in its PR, a step a release still needs. A chat, an agent's memory or a PR comment doesn't
  count: the next agent never sees them ([repo-is-the-vault](repo-is-the-vault.md)).
- **Where it goes:**
  - a **task note** in `vault/tasks/` ([how tasks work](../tasks/README.md)) when it needs context or a session of its
    own: what, why, what Sam already decided (quoted), how, and a **Done when** checklist;
  - a line in [the inbox](../tasks/inbox.md) (`- [ ] ...`) for a quick one;
  - a box in the Done when of the task it belongs to, when it's a step of one already written (the redesign's release
    steps go in [its note](../tasks/2026-11-06-redesign-release.md));
  - a row in [the bug log](../release/bug-log.md) for a bug found in testing or after a release and left open.
  Write it in the same PR as the work it came from; when there is no other PR, a small vault-only one.
- **Check it off as it's done**, in the PR that does it: tick its box (`- [x]`). When every box of a task is ticked, write
  its Outcome, set `status: done` and move it to `vault/tasks/done/`. A done inbox line is ticked with its PR (`- [x] ...
  (#123)`); whoever next goes through the inbox clears the ticked lines. Something dropped is marked so with the reason
  (`status: dropped`, or the line struck with a word on why), never just deleted.
- **Before starting**, look in `vault/tasks/` and the inbox for to-dos on the hub or feature you're about to touch, so you
  can tick what your work finishes. **Before finishing**, tell Sam what's left and where it was written down.

Related: [how tasks work](../tasks/README.md) · [the inbox](../tasks/inbox.md) · [repo-is-the-vault](repo-is-the-vault.md) ·
[decisions](../decisions.md)
