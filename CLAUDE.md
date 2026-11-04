# study-hubs — instructions for Claude Code sessions

Interactive study hubs for UAB dental school exams, served by GitHub Pages at
https://smcmurry6-source.github.io/study-hubs/ from branch `main`.
Pushing to `main` IS deploying — classmates see it within a minute or two.

**This repo is a vault** (Sam's standing rule, 2026-11-03, `vault/rules/repo-is-the-vault.md`): the rules, how-tos, hub
notes, decisions and tasks are linked notes under `vault/`, shared with every other agent, and `AGENTS.md` is the entry
point for all of them. This file loads `AGENTS.md` and every note that used to be written out here, so a Claude Code
session starts with all the rules; read hub notes (`vault/hubs/`), `vault/decisions.md`, task notes and how-tos such as
`vault/how-to/build-a-hub.md` on demand. **To change a rule, edit its note in `vault/rules/`**, not this file. A new rule gets its own note, a line in
`vault/home.md` and an import line below; `node tools/ci/vault.js` fails without both.

@AGENTS.md

**The change log is not loaded** (`DEPLOY_NOTES.md` is over 200 KB, about 50k tokens): before you change a hub or a
shared file, read its first entries (`sed -n '1,120p' DEPLOY_NOTES.md`) and grep it for the hub or feature
([github-is-the-source-of-truth](vault/rules/github-is-the-source-of-truth.md) step 4).

The notes above and below are shared with Cowork/Claude Project sessions and every other agent. Everything in them
applies here too, except where a note says how a Claude Code session does it differently.

## Claude Code specifics

- Cloud sessions can only push their own `claude/...` branch: push it, open a draft PR, Sam merges.
- Connectors: Supabase (project `thytmzsgymydbzcqdnix`; read-only SQL for data, `apply_migration` pre-approved in
  `.claude/settings.json`) and, when connected, Google Drive for lecture sources (read them, never commit them).
- Skills in `.claude/skills/`: `/lessons-audit` (the lessons refresh), `/podcast` (a Timmy Time episode), `anima` (diagrams),
  `taste-skill` (art direction for pages and app screens, vendored from Leonxlnx/taste-skill: used in full when Sam asks for a redesign),
  `/reddit-scout` (ideas from the Claude subreddits, checked against the repo; runs only when Sam calls it; log in `tools/reddit-scout/log.md`).
  Sam's claude.ai skills (`study-hub-builder`, `study-hub-deploy`) only point here: where one disagrees with the vault,
  follow the vault and tell Sam.
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

@vault/rules/podcast-reactions.md

@vault/rules/podcast-intro.md

@vault/rules/diagram-review.md

@vault/rules/diagrams-anima.md

@vault/rules/figures-teach-the-lecture.md

@vault/rules/archiving-is-a-retrospective.md

@vault/rules/secrets.md

@vault/rules/graded-coursework.md

@vault/rules/preview-and-release-test.md

## How-tos and reference

@vault/how-to/narrate-with-kokoro.md

@vault/how-to/read-usage-data.md

@vault/how-to/reply-to-reports.md

@vault/reference/shared-infrastructure.md
