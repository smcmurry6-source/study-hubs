# study-hubs — instructions for Claude Code sessions

Interactive study hubs for UAB dental school exams, served by GitHub Pages at
https://smcmurry6-source.github.io/study-hubs/ from branch `main`.
Pushing to `main` IS deploying — classmates see it within a minute or two.

**This repo is a vault** (Sam's standing rule, 2026-11-03, `vault/rules/repo-is-the-vault.md`): the rules, how-tos, hub
notes, decisions and tasks are linked notes under `vault/`, shared with every other agent, and `AGENTS.md` is the entry
point for all of them. This file loads `AGENTS.md`, the change log and every note that used to be written out here, so a
Claude Code session starts with all the rules; read hub notes (`vault/hubs/`), `vault/decisions.md` and task notes on
demand. **To change a rule, edit its note in `vault/rules/`**, not this file. A new rule gets its own note, a line in
`vault/home.md` and an import line below; `node tools/ci/vault.js` fails without both.

@AGENTS.md

@DEPLOY_NOTES.md

The notes above and below are shared with Cowork/Claude Project sessions and every other agent. Everything in them
applies here too, except where a note says how a Claude Code session does it differently.

## Claude Code specifics

- Cloud sessions can only push their own `claude/...` branch: push it, open a draft PR, Sam merges.
- Connectors: Supabase (project `thytmzsgymydbzcqdnix`; read-only SQL for data, `apply_migration` pre-approved in
  `.claude/settings.json`) and, when connected, Google Drive for lecture sources (read them, never commit them).
- Skills in `.claude/skills/`: `/lessons-audit` (the lessons refresh), `/podcast` (a Timmy Time episode), `anima` (diagrams).
- "Do the task in `vault/tasks/...`", "go through the inbox": `vault/tasks/README.md`.

## Repo map, shipping, verifying

@vault/reference/repo-map.md

@vault/how-to/ship-a-change.md

@vault/how-to/verify-before-pushing.md

## Standing rules (one note each in vault/rules/)

@vault/rules/repo-is-the-vault.md

@vault/rules/github-is-the-source-of-truth.md

@vault/rules/ship-it-now.md

@vault/rules/american-english.md

@vault/rules/about-page.md

@vault/rules/every-choice-gets-a-why.md

@vault/rules/two-statement-and-true-false.md

@vault/rules/numbered-statements.md

@vault/rules/question-bank-filter-panel.md

@vault/rules/high-likelihood-topics.md

@vault/rules/hub-home-page.md

@vault/rules/arcade-skins.md

@vault/rules/text-and-audio-never-drift.md

@vault/rules/diagram-review.md

@vault/rules/diagrams-anima.md

@vault/rules/archiving-is-a-retrospective.md

@vault/rules/secrets.md

@vault/rules/graded-coursework.md

## How-tos and reference

@vault/how-to/narrate-with-kokoro.md

@vault/how-to/read-usage-data.md

@vault/how-to/reply-to-reports.md

@vault/reference/shared-infrastructure.md
