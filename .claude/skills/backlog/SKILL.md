---
name: backlog
description: Sam's to-do list for the study hubs as numbered packages, each one session and one PR. Collects every open item (task notes in vault/tasks/, the inbox, pending migrations, open bug-log rows, leftovers in done tasks) and the open PRs, sets aside what is in a PR, waiting, Sam's own, parked or probably done, groups the rest by shared files and size (a really big item alone), redraws the backlog board (a private claude.ai artifact where each package has its prompt and a Start session button), and when Sam replies with a number, gives Sam the prompt that launches that package in a new session. Use when Sam says "/backlog", "the board", "the to-do list", "what's open", "what's left", "what should I do next", or asks for packages or a session prompt. Changes nothing in the repo and opens no PR.
argument-hint: "[package number(s), for their prompts]"
---

# Backlog

The procedure is [vault/how-to/package-the-to-dos.md](../../../vault/how-to/package-the-to-dos.md): read it and follow
it. Where this skill and the vault disagree, the vault wins: follow it and fix this file. Below is only how a Claude Code
session does each step.

## Collect (steps 1 and 2)

- `git fetch origin main -q`, then `node tools/todo/list.mjs --ref origin/main` (add `--full` for an item you're sizing).
- Open PRs: the GitHub MCP `list_pull_requests` (owner `smcmurry6-source`, repo `study-hubs`, `state: open`, fields
  `number, title, draft, head, base, updated_at`). Read a PR's body (`pull_request_read`) only when its title doesn't say
  which item it covers. Without the GitHub tools: `gh api -X GET search/issues -f q='repo:smcmurry6-source/study-hubs is:pr is:open'`.
- `TZ=America/Chicago date`, and the exam dates in `hubs.js` (`grep -n "exam\|date" hubs.js`, not the whole file).
- Read the task notes and inbox lines you need in full; grep, never read `DEPLOY_NOTES.md` or the bug log whole.
- Don't use subagents for this: it is a few minutes of reading.

## Show the list (steps 3 and 4)

In the chat, as the how-to says: numbered packages, most urgent first, each with its size, its items and where they're
written, then the short lists. Keep it short enough to read on a phone. Sam can reply with a number.

Then redraw **the board** (the how-to's step 4) and put its link at the top of that message:

1. Write the packages to `<scratchpad>/backlog/packages.json` (`node tools/todo/board.mjs --example` shows the shape):
   `asOf` and `asOfLabel` from `TZ=America/Chicago date`; `calendar`, the exam chips; `environmentId`, this session's
   `environment_id` from `mcp__claude-code-remote__get_environment` (so a session started from the board runs where this
   one does); and for each package `n`, `tier` (`week`, `next`, `later`), `title`, `size`, `alone`, `state` (`ready`,
   `waiting` with `waits`, `ask`), `items` (`text`, `where`), `why`, and the prompt's parts: `decided` (Sam's words),
   `ask`, `order`, `deadline`, `needs`, or `opening` for a task note's own Opening prompt. `aside` holds the short lists
   (`pr`, `waiting`, `sam`, `parked`, `moot`); `[text](https://...)` and backticks render there and in items.
2. `node tools/todo/board.mjs <scratchpad>/backlog/packages.json --out <scratchpad>/backlog/board.html`. It fills every
   package's prompt from the how-to's template and stops if the template lost a line it needs.
3. Find the board: `Artifact` with `action: "list"`, the one titled "Study Hubs Backlog"; read it once (`action:
   "read"`), then publish the new file with its `url`, leaving out `icon` and `capabilities` so it keeps both. None
   listed: publish a new one with `icon: "board"` and `capabilities: {"mcp": {"servers": [{"server": "Claude Code
   Remote", "tools": ["create_session"]}]}}`.
4. Check nothing by hand beyond the script's own message: the page was checked when it was built (its two files are in
   `tools/todo/`). A change to `board.html` itself gets one look in a scripted browser, phone and desktop, before it ships.

## Give the prompt (step 5)

- When Sam replies with a number (or several), or the skill is called with one (`/backlog 3`): for each, one fenced
  `text` block with the prompt from the how-to's template, nothing else inside it, so it copies whole. If the list isn't
  in this conversation yet, collect and group first, show the package you're giving the prompt for, then the prompt.
- If Sam asks you to **launch** it rather than hand it over: start it with `mcp__claude-code-remote__create_session`
  (`source_url` `https://github.com/smcmurry6-source/study-hubs`, `title` the package's title, `prompt` the block) and
  give Sam the session's link. Only when asked. (The board's Start session button does the same from Sam's side.)
- Don't start the package's work in this session unless Sam asks for that.

## Write back (step 6)

Calls Sam makes while picking go into the prompt of the package they belong to. One that no package carries: a small
vault-only PR from your `claude/...` branch (the decision line, the struck or ticked line), and say so.
