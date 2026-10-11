# Rules for coding agents (Codex, opencode, others)

Study hubs for UAB dental students, served by GitHub Pages from `main`. **Merging to `main` deploys to the class**, so
agents never push `main`. Claude Code sessions read `CLAUDE.md` + `DEPLOY_NOTES.md`; this file is the short version for
every other agent. If anything here conflicts with your task brief, stop and say so in the PR.

## Branches and PRs

- **Boards hub work** (INBDE + ADEX, `src/boards/`, `tools/boards/`, `docs/boards/`, `hubs/boards/`): branch from
  `claude/boards-hub` and open the PR **into `claude/boards-hub`**, never into `main`. The plan is
  `docs/boards/PLAN_V2.md`; your task brief is `docs/boards/tasks/T-NN.md`. Touch only the files the brief names.
- Anything else: branch from `main` and open a PR into `main`; Sam merges.
- Never force-push a shared branch, rewrite someone else's history, or resolve a conflict by taking one side
  wholesale (the other side is usually another session's work).
- PR description: what changed, in plain words a student would understand, plus your self-report (what you ran, what
  passed, anything unsure).

## Before you open a PR

- `node tools/ci/syntax.js` (every inline script parses, no conflict markers). The slow browser test
  (`tools/ci/smoke.js`) runs in GitHub CI; you don't need to run it locally.
- Boards content: `node tools/boards/lint-items.mjs` on the files you changed, and every fact id you cite exists in
  `src/boards/facts/`.
- Search for conflict markers line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`); hub CSS uses long `====` comments.

## Content rules

- **American English everywhere** (color, center, favorite, labeled, anesthesia, pediatric): site text, questions,
  notes, comments, commit messages.
- **No secrets.** The repo is public. Never commit keys or tokens or put an admin secret in client-side JS.
- **No copied course or exam material.** No lecture slides, graded quizzes, released exam items, prep-company
  questions or textbook text. Boards questions are written from the fact records in `src/boards/facts/`, in new
  wording, and every key traces to a fact id with a primary source.
- **About page rule:** any student-visible feature, setting, game, trophy or easter egg is added to `about/index.html`
  in the same PR (secrets inside a `spoil` element). Questions and notes alone don't need an entry.
- **Text and audio never drift:** a hub with narration in `hubs/<id>/audio/` needs that lecture's mp3 regenerated
  whenever its text changes. If you can't regenerate it, say so in the PR instead of editing the text.
- Each hub is one generated or hand-built `hubs/<id>/index.html`; shared features go in `widget/`, never patched into
  one hub. Keep `window.SH_EXPORT = {` as the last statement of a hub script (the CI lint hooks in there).
- Don't read the big hub files whole; grep for the part you need.
