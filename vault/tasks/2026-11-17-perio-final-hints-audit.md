---
type: task
status: in-progress
hub: perio
created: 2026-11-17
requested-by: Sam
due: 2026-11-19
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/402
---

# Perio: vet the bank against the final's hints, and the midterm check-ins

## Goal

Sam, 2026-11-17: "using the final exam hints dr abou arraj gave at the end of his lecture, vet the whole question bank
for accuracy, relevancy, and all. Do a whole audit of the question bank in general first to make sure that all questions,
answers, and explanations are sufficient and accurate. using all of the perio midterm check ins, see if there are any
additions that need to be made that havent been doen already".

## Context

- Hub note: [perio](../hubs/perio.md) (the "no fact more than twice" bar and who owns a shared fact).
- The hints: `hubs/perio/content/core.json` (`hints`, the Nov 12 review). The earlier audit:
  [2026-11-15-perio-bank-audit](done/2026-11-15-perio-bank-audit.md).
- Rules: the question rules `hubs/CLAUDE.md` imports, [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md) (High yield is rebuilt from the questions, so a
  changed session's `-hy.mp3` is recorded again in the same PR).
- How it was done: six reviewers read the bank session by session against the notes and hints, and one read the 28
  midterm check-ins (27 people; the only gap left was suture materials: Dr. Abou-Arraj said the final asks the materials,
  not the techniques or pictures). Their findings were applied to `questions.json` in place (ids kept); third asks of a
  fact and giveaways were retired in `tools/question-ids/perio.txt`; the suture-materials questions are new S2 items.

## Done when

- [x] Reviewers' findings applied (or rejected with a reason) and the check-in additions written
- [ ] High yield recorded again for every session whose `hy` changed (`node tools/ci/smoke.js` names any whose
      recording no longer matches: `python3 tools/narrate.py perio --level hy --lec <id> --force`, then
      `node tools/hub-next/build.mjs --hub perio`)
- [ ] `node tools/hub-next/build.mjs --check`, the smoke test's lint for perio, CI green on the PR
- [ ] `DEPLOY_NOTES.md` entry and a `perio | ...` line in `tools/after-merge/changelog.txt`
- [ ] This note's Outcome, `status: done`, moved to `done/`

## Log

- 2026-11-17: findings applied by a Claude Code session; a work-in-progress snapshot pushed to the PR while High yield was
  being recorded again.

## Outcome
