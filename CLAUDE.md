# study-hubs — instructions for Claude Code sessions

Interactive study hubs for UAB dental school exams, served by GitHub Pages at
https://smcmurry6-source.github.io/study-hubs/ from branch `main`.
Pushing to `main` IS deploying — classmates see it within a minute or two.

**This repo is a vault** (Sam's standing rule, 2026-11-03, `vault/rules/repo-is-the-vault.md`): the rules, how-tos, hub
notes, decisions and tasks are linked notes under `vault/`, shared with every other agent, and `AGENTS.md` is the entry
point for all of them. This file loads `AGENTS.md` and every note that used to be written out here, so a Claude Code
session starts with every rule except the few for one feature ("Feature rules" below, read when a task touches
that feature); read hub notes (`vault/hubs/`), `vault/decisions.md`, task notes and how-tos such as
`vault/how-to/build-a-hub.md` on demand. **To change a rule, edit its note in `vault/rules/`**, not this file. A new rule gets its own note, a line in
`vault/home.md` and an import line below (a rule for one feature: `load: on-demand` and a line under "Feature rules"
instead); `node tools/ci/vault.js` fails without them.

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

@vault/rules/question-ids-are-permanent.md

@vault/rules/hub-home-page.md

@vault/rules/text-and-audio-never-drift.md

@vault/rules/archiving-is-a-retrospective.md

@vault/rules/secrets.md

@vault/rules/graded-coursework.md

@vault/rules/preview-and-release-test.md

@vault/rules/learner-data-privacy.md

## Feature rules: read them when your task touches the feature

These standing rules apply to one feature each, so they aren't loaded into every session (Sam, 2026-11-06: tasks were
slow to start). They bind just as much: **read the ones for a feature before you change it.** Claude Code also loads
them by itself when it opens a file in `hubs/`, `tools/figures/` or `tools/podcast/` (each has a `CLAUDE.md` that imports them),
and the `/podcast` and `anima` skills point at them.

- **Writing or editing questions** (any hub's bank, a lecture added or taught, `QUESTION_WHY`, `LIKELY_TOPICS`, Exam Hints,
  the Question Bank's panel, a question-health flag, the lessons refresh's fixes): [every-choice-gets-a-why](vault/rules/every-choice-gets-a-why.md),
  [two-statement-and-true-false](vault/rules/two-statement-and-true-false.md), [numbered-statements](vault/rules/numbered-statements.md),
  [which-statement-questions](vault/rules/which-statement-questions.md), [high-likelihood-topics](vault/rules/high-likelihood-topics.md),
  [dont-ask-what-professors-skip](vault/rules/dont-ask-what-professors-skip.md), [question-bank-filter-panel](vault/rules/question-bank-filter-panel.md),
  [question-health-flags-are-leads](vault/rules/question-health-flags-are-leads.md). Claude Code loads them by itself when it opens a file in `hubs/`
  (`hubs/CLAUDE.md`); `/lessons-audit` and [build-a-hub](vault/how-to/build-a-hub.md) point at them.
- **An arcade game or a hub's arcade skin** (`widget/games.js`, a hub's `GAMES` list or skin, lobby thumbnails):
  [arcade-skins](vault/rules/arcade-skins.md).
- **A Timmy Time episode** (`tools/podcast/`, a hub's `SH_PODCAST`, `widget/podcast.js`):
  [podcast-intro](vault/rules/podcast-intro.md), [podcast-reactions](vault/rules/podcast-reactions.md).
- **Any figure** (anima figures, drawn `FIGS`, case images, diagram questions, a game that draws anatomy), and the
  diagram review that **building a hub or adding lectures** always includes: [diagram-review](vault/rules/diagram-review.md),
  [diagrams-anima](vault/rules/diagrams-anima.md), [figures-teach-the-lecture](vault/rules/figures-teach-the-lecture.md),
  [outside-sources-for-figures](vault/rules/outside-sources-for-figures.md).
- **A new hub's art** (emblem, masthead scene, medals, tint; `tools/figures/site/`):
  [every-hub-gets-its-own-art](vault/rules/every-hub-gets-its-own-art.md).

## How-tos and reference

Read when the task calls for it (not loaded, to keep every session's start small; Sam, 2026-11-11):
[narrate-with-kokoro](vault/how-to/narrate-with-kokoro.md) (narration), [read-usage-data](vault/how-to/read-usage-data.md)
(the analytics, surveys), [reply-to-reports](vault/how-to/reply-to-reports.md) (student reports, notices).

@vault/reference/shared-infrastructure.md
