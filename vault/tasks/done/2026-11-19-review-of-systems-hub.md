---
type: task
status: done
hub: review-of-systems
created: 2026-11-19
requested-by: Sam
due: 2026-12-03
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/480
---

# Build the Review of Systems hub

## Goal

A hub for DENT 2165 Review of Systems: the class's two 200-question mock board exams (Thu Dec 3 and Thu Dec 10, 8:00 am to
noon CST), which cover every course in the course's intro deck. Sam, 2026-11-19: "please go through all materials. things
from previous classes and quiz content is okay. please use everything from those folders. is this going to end up being
too big? i dont think we do any figures. keep notes very high yield with a section for each course tested and then sub
sections to make it more manageable."

## Context

- Hub note: [review-of-systems](../../hubs/review-of-systems.md). Sam's calls: [decisions](../../decisions.md) (2026-11-19).
- Rules that matter most: [graded-coursework](../../rules/graded-coursework.md) (with Sam's "topic check only" for this
  hub), [every-hub-gets-its-own-art](../../rules/every-hub-gets-its-own-art.md), the question rules (`hubs/CLAUDE.md`).
- Sources: Sam's Drive, the Review of Systems folder and each course's folder (never committed).
- **Too big?** No: with no narration and no figures it is a few MB of text (the size check, `tools/ci/size.js`, barely
  moves). It is the biggest bank on the site, which the engine already pages (At a time, 100 to start).

## Done when

- [x] The engine lists a hub's parts under their courses (`core.json` `groups`), in the notes, Home and the bank's picker
- [x] Two mocks: the countdown moves to the second once the first closes, with Home's words for each
- [x] Its own art: tint, emblem, masthead scene, medal glyph and ribbon
- [x] Notes (As taught and Plain English), a cram list, review tables and board-style questions for every course
- [x] High likelihood topics for every part; every choice with its why; the format minimums per course
- [x] Wired into the site: `hubs.js`, `sw.js`, the admin page, the recap tool, the budgets
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-19: written; Sam answered the four questions (structure, old quizzes, scope, question style).
- 2026-11-19: 13 drafting sessions, one per course or pair of courses, each from that course's folders; merged here.

## Outcome

To be filled in when the drafts are merged.
