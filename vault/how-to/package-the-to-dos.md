---
type: how-to
tags: [tasks, agents, planning]
---

# Package the to-do list into sessions

Sam, 2026-11-18: "give me a list of all the open items on the to do and the inbox ... if it makes sense to, group them in
packages that can be shipped in the same pr. i dont want to do one long session for everything, so a really big item should
go alone in its own session. make it easy for me to tell you which one to do and then you give me the prompt to launch it in
a new session. make this a skill so i can do this regularly." Claude Code: `/backlog` (`.claude/skills/backlog/`). Any
other agent: these steps.

**Running it changes nothing.** It reads the to-do list, shows Sam numbered packages, and hands over a prompt for the one
Sam picks. The work happens in the session that prompt starts.

## 1. Collect

- `git fetch origin main`, then `node tools/todo/list.mjs --ref origin/main`: every open item on `main`, without leaving
  your branch. It lists the task notes (status, due, waiting-on, `pr:` and each unticked box of Done when), the inbox lines
  not ticked (and how many ticked ones wait to be cleared), the pending migrations, the bug-log rows not retested, accepted
  or won't fix (open ones, then fixed ones waiting for a retest), and unticked boxes left in `vault/tasks/done/`. `--full`
  prints each item whole; `--json` for a script.
- **Open pull requests** (GitHub, the repo's open PRs): the script can't see them. An item a PR already covers is "in a
  PR", not a package; when a title doesn't say which item it covers, read the PR's description. A long-idle draft is
  worth one line to Sam (close it, or finish it).
- **The calendar:** exam dates and archive hours are in `hubs.js` (Central time: `TZ=America/Chicago date`). An item for a
  hub whose exam is this week goes first; one for a hub that has archived is usually moot.
- Read a task note or an inbox line in full before you size it (`--full`, or the note itself), not from its first line.

## 2. Set aside what isn't a package

- **In a PR:** the PR's link and what it waits on (Sam's "merge", a red check, a migration after the merge).
- **Waiting:** a blocked task's `waiting-on`, a date (an archiving at 10 pm on exam day), a file Sam has to put in Drive,
  another PR. Say what unblocks it and, if known, when.
- **For Sam, not a session:** what only Sam can do (a look on a real phone, a key saved in Supabase, a GitHub setting,
  closing a PR). A short list.
- **Parked:** lines that say "only if Sam asks", or wait on something that may never come (a sound setting). One line each.
- **Probably done or moot:** an item a merged PR already did (its note never got ticked), a bug on a page that has come
  down, a task for a hub that has archived. Propose ticking or dropping it, with the reason; the housekeeping package does
  it ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md): dropped items are struck with the reason, never deleted).

## 3. Group the rest into packages

A package is **one session and one PR**. Put items together when:

- they touch the **same files or feature** (the place kit, the Question Bank, Ask Timmy, one hub's content, the bug log),
  so one set of checks covers them all;
- they're about the **same size**: a quick fix doesn't wait in a big feature's PR unless it is in the same files;
- one needs the other: say the order in the prompt. If the other is in an open PR, the package waits for that merge.

Never put anything next to an item with an exam this week: it ships alone and first.

**Size every package:**

- **S**: an hour or so, a few files.
- **M**: one feature or a handful of fixes in one area; most packages.
- **L, always alone:** a lecture or more added to a hub; a set of drawings for Sam to look at; a feature with a migration,
  client code and tests; a Timmy Time episode; a lessons audit or an archiving; merging a long-diverged branch; any task
  note with several phases (the package is its next phase, and says so); anything that needs more than about three hours
  of agent time.

Two M packages are better than one big one. A package of one small item is fine when nothing else fits with it.

## 4. Show Sam the list

Most urgent first: an exam this week, then what students would notice, then the rest. For each package:

- its **number** (1, 2, 3...; that is what Sam replies with), a short title and its size;
- its items, one line each, with where each is written (a task note, "the inbox line ...", a BUG id);
- why they go together, what Sam has to answer first, and what it waits on, if anything.

Then the short lists from step 2: In a PR · Waiting · For Sam · Parked · Probably done or moot. End with how to pick:
"Reply with a number (or a few) and I'll give you the prompt for each." Keep it short enough to read on a phone.

**The board** (Sam, 2026-11-18: "yes build it", [decisions](../decisions.md)). The same list is also a page Sam can start
sessions from: the private claude.ai artifact "Study Hubs Backlog", four columns (This week, Next, Later, Set aside), each
package a card with its prompt, Copy prompt and Start session, which opens a cloud session through the Claude Code
Remote connector. **It is a view, never a second to-do list:** nothing on it changes the vault, and each run redraws it.
An agent that can publish claude.ai artifacts writes the packages as JSON (`node tools/todo/board.mjs --example` shows
the shape; it can carry the session's environment id, so it lives in the agent's scratch space, never the repo), builds
the page with `node tools/todo/board.mjs <packages.json> --out <board.html>` (the page is `tools/todo/board.html`) and
republishes it to the same link, then gives Sam the link with the list. Claude Code: the skill says how. Other agents:
the list in the chat is enough.

## 5. Write the prompt for the package Sam picks

One prompt per package, in a code block Sam can copy whole, in plain words and American English:

```text
Work in smcmurry6-source/study-hubs. Read AGENTS.md, then do this package from the to-do list: <title>.

It covers (each is written down in the vault; read it first):
1. <item>: <vault/tasks/<file>.md, its Done when | the inbox line "<its bold title>" in vault/tasks/inbox.md | BUG-123 in vault/release/bug-log.md>
2. ...

<Sam already decided: "<his words>". | Ask me first, in one message, then go: <the questions>.>
<Order: ... | Deadline: ... | It needs <PR> merged first.>
Out of scope: anything else on the to-do list. Put what you find on the list instead.

Wait for my "merge". In the same PR, tick each item off where it's written (the inbox line as `- [x] ... (#524)`, the task note's boxes,
Outcome and status, the bug row's status), and put anything left over on the to-do list. Open a draft PR.
```

Quote Sam's calls word for word, and give the paths an agent needs to start (the task note, the hub note, a file named in
the inbox line), but not a summary of the note: the session reads it. A task note with its own "Opening prompt" section:
use that prompt, with the package's other items added.

The board fills this template for every package (`promptFor()` in `tools/todo/board.mjs` reads it from this note), so
when you change it, keep its shape: the `<title>`, the `1. <item>` line, the two `<... | ...>` lines and the
`Out of scope:` line. The script stops with a message if one goes missing.

## 6. Write back what Sam decides while picking

"Drop that one", "do X before Y", an answer to a package's question: these are Sam's calls. Put each in the prompt of the
package it belongs to, so that session writes it back ([decisions](../decisions.md), the inbox, the task note). If no
session will carry it, a small vault-only PR does.

Related: [how tasks work](../tasks/README.md) · [to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md) ·
[the inbox](../tasks/inbox.md) · [the bug log](../release/bug-log.md) · [ship-a-change](ship-a-change.md) ·
[preview-and-release-test](../rules/preview-and-release-test.md)
