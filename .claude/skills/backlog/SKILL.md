---
name: backlog
description: Sam's to-do list for the study hubs as numbered packages, each one session and one PR. Collects every open item (task notes in vault/tasks/, the inbox, pending migrations, open bug-log rows, leftovers in done tasks) and the open PRs, sets aside what is in a PR, waiting, Sam's own, parked or probably done, groups the rest by shared files and size (a really big item alone), and when Sam replies with a number, gives him the prompt that launches that package in a new session. Use when Sam says "/backlog", "the to-do list", "what's open", "what's left", "what should I do next", or asks for packages or a session prompt. Read-only: changes nothing, opens no PR.
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
written, then the short lists. Keep it short enough to read on a phone. No artifact, no file: Sam replies with a number.

## Give the prompt (step 5)

- When Sam replies with a number (or several), or the skill is called with one (`/backlog 3`): for each, one fenced
  `text` block with the prompt from the how-to's template, nothing else inside it, so it copies whole. If the list isn't
  in this conversation yet, collect and group first, show the package you're giving the prompt for, then the prompt.
- If Sam asks you to **launch** it rather than hand it over: start it with `mcp__claude-code-remote__create_session`
  (`source_url` `https://github.com/smcmurry6-source/study-hubs`, `title` the package's title, `prompt` the block) and
  give him the session's link. Only when asked.
- Don't start the package's work in this session unless Sam asks for that.

## Write back (step 6)

Calls Sam makes while picking go into the prompt of the package they belong to. One that no package carries: a small
vault-only PR from your `claude/...` branch (the decision line, the struck or ticked line), and say so.
