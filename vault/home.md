---
type: map
tags: [map]
---

# Home

The map of this vault: Sam's study hubs for UAB dental school exams (live at
https://smcmurry6-source.github.io/study-hubs/ from `main`), and everything an agent needs to work on them. New here?
Read `AGENTS.md` at the repo root first. How the vault works: [repo-is-the-vault](rules/repo-is-the-vault.md).

## Tasks

- [How tasks work](tasks/README.md): one note per task in `vault/tasks/`; finished ones in `vault/tasks/done/`.
- [Inbox](tasks/inbox.md): quick ideas, one line each.
- [Sam's decisions](decisions.md): what was approved, skipped or left alone. Check before proposing anything.

## Rules (every agent, every change)

Shipping and the vault
- [The repo is the vault](rules/repo-is-the-vault.md): read from it, write back to it, link don't copy, nothing private.
- [GitHub is the source of truth](rules/github-is-the-source-of-truth.md): fetch fresh, merge, never overwrite blind.
- [Ship it now, never "after the exam"](rules/ship-it-now.md)
- [American English everywhere](rules/american-english.md)
- [The About page lists everything](rules/about-page.md) students can see.
- [Secrets](rules/secrets.md): public repo; keys only from the environment.
- [Content from lecture materials and graded coursework](rules/graded-coursework.md): no course files in the repo;
  graded work never copied, closed quizzes only as context, previous years' never.
- [Preview and release-test every substantial change](rules/preview-and-release-test.md): a preview on made-up data, the
  release tests, Sam's explicit approval, then checks after the release ([the plan](../RELEASE_TEST_PLAN.md)).

Questions
- [Every choice gets a why](rules/every-choice-gets-a-why.md)
- [Two-statement and true/false questions](rules/two-statement-and-true-false.md) (CI minimums per taught lecture)
- [Numbered-statement questions](rules/numbered-statements.md) (CI minimum per taught lecture)
- [High Likelihood Exam Questions](rules/high-likelihood-topics.md): `LIKELY_TOPICS` for every lecture.
- [Question Bank: the filter panel](rules/question-bank-filter-panel.md), lecture picker, order and pins.

Hub building
- [Every hub opens on its own Home page](rules/hub-home-page.md)
- [Every hub's arcade looks like that hub](rules/arcade-skins.md)
- [Text and audio must never drift](rules/text-and-audio-never-drift.md)
- [Every Timmy Time episode has likes, dislikes and comments](rules/podcast-reactions.md), with 1-3 lore comments.
- [Timmy Time's cold open skips the minutiae](rules/podcast-intro.md): no question counts, exam times or LockDown Browser.
- [Building a hub = diagram review](rules/diagram-review.md), approved by Sam one candidate at a time.
- [Diagrams (the anima skill)](rules/diagrams-anima.md): house rules for drawn figures.
- [Figures teach the lecture](rules/figures-teach-the-lecture.md): outside sources for accuracy, the lecture for what's shown and named.
- [Archiving a hub = retrospective](rules/archiving-is-a-retrospective.md)

## How-tos

- [Ship a change](how-to/ship-a-change.md) · [Verify before pushing](how-to/verify-before-pushing.md)
- [Preview a change](how-to/preview-a-change.md): the site from a branch, on made-up data, with test accounts and time
  travel · [Roll back a release](how-to/roll-back-a-release.md)
- [Build a hub, or add a lecture to one](how-to/build-a-hub.md): the checklist, and every file a new hub touches.
- [Draw a Patient Box case from its numbers](how-to/draw-a-patient-box-case.md): the shared case kit (chart, radiograph,
  drawn view and the diagnosis from one set of numbers) every hub's Patient Box questions use.
- [Narrate with Kokoro](how-to/narrate-with-kokoro.md)
- [Read usage data and run surveys](how-to/read-usage-data.md)
- [Student reports, suggestions and notices](how-to/reply-to-reports.md)
- Lessons audit and refresh: `tools/lessons-refresh.md` (Claude Code: `/lessons-audit`). A Timmy Time episode:
  `tools/podcast/README.md` (Claude Code: `/podcast`). Ideas from the Claude subreddits, checked against the repo:
  `.claude/skills/reddit-scout/SKILL.md` (Claude Code: `/reddit-scout`; past runs in `tools/reddit-scout/log.md`).

## Release testing

- [RELEASE_TEST_PLAN.md](../RELEASE_TEST_PLAN.md): the whole process, from tiers to rollback, and what waits on Sam.
- [UAT checklist](release/uat-checklist.md) · [Bug log](release/bug-log.md) ·
  [Release test report template](templates/release-test-report.md) · past reports in `vault/release/reports/`
  ([the first one](release/reports/2026-11-04-release-process-dry-run.md)).
- Tools: `tools/preview/` (previews) and `tools/release/` (the suites; `node tools/release/run.js` runs them all).

## Reference

- [Repo map](reference/repo-map.md): what every file and folder is.
- [Shared infrastructure](reference/shared-infrastructure.md): the widget, Supabase, Pages, the Kokoro model.
- `LESSONS.md`: what the data and archived hubs taught. Read it before building or restructuring a hub.
- `DEPLOY_NOTES.md`: the change log, newest first. Grep it for a hub or feature.
- `supabase/schema.sql` and `migration_v*.sql`: the database.

## Hubs

Live
- [Occlusion](hubs/occlusion.md)
- [Periodontology](hubs/perio.md)
- [PCD Implants Exam 1](hubs/pcd-implants-exam1.md)
- [Special Patient Care](hubs/special-patient-care.md)

Archived (page still up)
- [Heme & Endo Exam 1](hubs/heme-endo-exam1.md) · [MSK Exam 4](hubs/msk-exam4.md) ·
  [PCD Fixed Pros Exam 3](hubs/pcd-exam3.md) · [MSK Exam 3](hubs/msk-exam3.md)
- Removed earlier (no folder, labels only): GI Exam 1 (`gi-exam1`), GI Exam 2 (`hepatobiliary`), Genetics, Fixed Pros.

Being built on its own branch
- [Boards (INBDE + ADEX)](hubs/boards.md): on `claude/boards-hub`, not on `main` yet.

Which hubs are live, and every exam date, comes from `HUBS` in `index.html`: if this list disagrees, the code is right
and this list needs fixing. A new hub gets a note from [the hub template](templates/hub.md).

## Templates

[Task](templates/task.md) · [Hub](templates/hub.md) · [Rule](templates/rule.md) ·
[Release test report](templates/release-test-report.md)
