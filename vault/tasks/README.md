---
type: reference
tags: [tasks, agents]
---

# How tasks work

A task is one note in this folder. Sam (or an agent Sam asked) writes it; any agent can pick it up from the note alone.
Finished tasks move to [done/](done/README.md). Quick ideas that aren't tasks yet go in [inbox.md](inbox.md).

## Giving a task to an agent

Point the agent at the repo and the note, in any words. For example:

> Work in the GitHub repo smcmurry6-source/study-hubs. Read `AGENTS.md` first, then do the task in
> `vault/tasks/2026-11-03-occlusion-final-time-and-format.md`.

Or "go through `vault/tasks/inbox.md`", or "do the open tasks for perio". An agent that can't read the repo directly
can be given the raw file URL: `https://raw.githubusercontent.com/smcmurry6-source/study-hubs/main/AGENTS.md`.

## A task note

File name: `<yyyy-mm-dd>-<what>.md` (the day it was written, lowercase words joined by hyphens). Copy
[the template](../templates/task.md). Frontmatter:

```yaml
---
type: task
status: open          # open | in-progress | blocked | review | done | dropped
hub: occlusion        # a hub id, or site / dashboard / widget / vault
created: 2026-11-03
requested-by: Sam
due: 2026-11-19       # optional: the exam or date it must land before
waiting-on:           # for blocked: what or whom (a recording, an announcement, Sam's call)
agent:                # who took it: "Claude Code", "Codex", ...
pr:                   # the PR's URL once there is one
---
```

Body: **Goal** (what and why, in a sentence or two), **Context** (links to the hub note, rules, decisions, change-log
entries, Drive folders by name), **Done when** (a checklist an agent can verify), **Log** (dated lines, newest last)
and **Outcome** (filled in at the end).

## Doing a task (agents)

1. Read `AGENTS.md`, the rules, the task note and everything it links. If anything is unclear or needs Sam's call,
   don't guess: ask, or set `status: blocked` with `waiting-on: Sam` and say what you need.
2. On your branch, set `status: in-progress` and `agent:`. (Work happens on branches, so other agents only see this
   once your PR is open; Sam normally gives one task to one agent.)
3. Do the work under every rule in `vault/rules/`. Ship it now: never hold it until after an exam.
4. In the same PR: tick the "Done when" boxes you met, add a Log line, write the **Outcome** (what changed, what you
   verified, anything left), set `pr:`, then `status: done` and move the note to `vault/tasks/done/` (`git mv`). If
   part of it is left, keep the note here with `status: review` (waiting for Sam to look) or `blocked`, and say why.
5. Write back anything the next agent needs ([repo-is-the-vault](../rules/repo-is-the-vault.md)): the hub note,
   [decisions](../decisions.md), a new rule.

Merging the PR is what makes a task done. If Sam closes the PR instead, the task note on `main` is still open.

## The inbox

[inbox.md](inbox.md) is a checklist anyone can add a line to, from the Obsidian app on a phone. An agent asked to
"go through the inbox" turns each line into a task note (or, if it's small and clear, just does it in its PR), then
deletes the line in the same PR.

## Statuses

| status | means |
|---|---|
| open | ready for an agent |
| in-progress | an agent is on it (see `agent:` and `pr:`) |
| blocked | can't start or finish until `waiting-on:` arrives |
| review | the work is in a PR; Sam needs to look or decide |
| done | merged (the note is in `done/`) |
| dropped | not doing it; say why in Outcome (the note is in `done/`) |

`node tools/ci/vault.js` checks every task note's frontmatter, and that `done/` holds only done or dropped tasks.

Related: [repo-is-the-vault](../rules/repo-is-the-vault.md) · [home](../home.md)
