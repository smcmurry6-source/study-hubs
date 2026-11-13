---
type: task
status: open
hub: widget
created: 2026-11-12
requested-by: Sam
due: before the redesign's release
waiting-on: 
agent: 
pr: 
---

# The game layer's wiring left by part A: the arcade, Timmy Time and the admin page's "Fixed"

## Goal

Three places still talk to the server the old way on the redesign's pages, so three of the new XP rules pay nothing
yet: an arcade game finished (+50), a Timmy Time minute heard (10, and +100 at the end) and a report resolved as
Fixed (+100). Wire them before the release, in their own session, so the release's one PR only switches addresses.

## Context

- Session 8 of [phase 4](2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release". "For every session
  above" there holds here. Sam, 2026-11-12 ([decisions](../decisions.md)): its own session before the release.
- What part A wired and left: [the journeys](2026-11-06-redesign-progression-journeys.md) (its Log and "Open
  calls") and [the release note](2026-11-06-redesign-release.md), "From phase 4, part A". The rules:
  [game-server](../reference/game-server.md), "Answers and XP".
- What part A built for this: `window.shGame` in `widget/v3.js` (`v2()`, `startSession(kind, game)`,
  `finishSession(id, score, total)`), `HX.recordAnswer(qid, lec, right, ctx, choice, picks, { order, session })`, and
  the events `sh:answer-paid` and `sh:session-paid`, which `widget/hub-rewards.js` already turns into the pill's
  total, today's XP and a toast.

## Build spec

**Files to touch**: `widget/games.js` (the arcade), `widget/podcast.js` (Timmy Time), `widget/hub-rewards.js` (one
line each for what the two pay, if the events don't already cover it), `review/index.html` (the resolve control),
`tools/preview/runtime/preview.js`, the tests, the vault.

**Not to touch**: the migrations; `sw.js` (the release bumps it and edits its lists: keep the list of files to add
current in the release note instead); `widget/eggs.js`; the engine's core.

`widget/games.js` and `widget/podcast.js` are shared with the live hubs: every change runs only when
`window.shGame && shGame.v2()` is true, and falls back to today's calls otherwise. A live page must make exactly the
calls it makes today.

**What it calls**:
- **The arcade**: when a game starts, `shGame.startSession("arcade", <game id>)` (a promise of the session's id; the
  server's `xp_session_start(visitor, hub, kind, game)`); when it ends, `shGame.finishSession(id, score)`
  (`xp_session_finish`: the +50 when the game ended 20 seconds or more after it started, once per game per day, and
  the server posts the score itself, so under v2 the page no longer calls `submit_arcade_score` for it). Each answer
  inside a game goes through the answer path with the pick's **authored** index (not the shuffled one) and
  `session`; an answer without an index is refused by the server (`bad`) and recorded by today's calls instead,
  which is what happens now.
- **Timmy Time**: each minute heard reports `pod_minute_v2({ p_visitor, p_hub, p_ep, p_minute })` (the minute's
  number; a minute pays when 25 seconds have passed since the last paid one, so 2x speed still pays; the +100 at 90%
  of the episode's minutes is the server's). `widget/podcast.js` already counts what was heard (grep
  `sh_pod_heard`). What a call pays reaches the pill the way an answer's does: fire `sh:answer-paid`'s sibling (name
  it `sh:pod-paid`, with the server's answer) and add its line in `widget/hub-rewards.js`.
- **The admin page**: a report's resolve control offers "Fixed" and "No change needed" and calls
  `admin_resolve_report_v2(secret, kind, id, outcome, reply)` when the database has it (Fixed pays the sender +100),
  today's `set_report_resolved` otherwise. The list comes from `get_reports_v2` then.

**For the release, not this session** (keep them in the release note's list): each episode's length is loaded with
`admin_set_podcast_episode(secret, hub, ep, seconds)` when the migration is applied, or its minutes pay nothing;
the service worker's `PRECACHE` gains the files the phase-4 sessions added. The bowling egg added two (2026-11-13): `widget/bowling.js` and `widget/hub-art/bowling.js`, fetched at the first
strike or the first tap on the lane.

**The preview's made-up data**: `xp_session_start` and `xp_session_finish` are answered since part A; add
`pod_minute_v2` (a minute pays 10 once, the last one +100), `admin_resolve_report_v2` and `get_reports_v2` behind
the fixture secret.

**Budgets**: no new file. The arcade makes two more calls a game and one fewer score call; Timmy Time one a minute
while playing. The page-load request counts don't change.

**Tests to add**:
- `node tools/ci/smoke.js`: on a new hub on the game layer, a game played to the end makes one session start, one
  finish and no `submit_arcade_score`, and its answers carry an index and the session; a Timmy Time minute reports
  once; the pill's total rises with what the stubbed server paid. On a live hub: the calls are exactly today's.
- `tools/release/xp.js` already covers the server side (a game under 20 seconds, a second game the same day, a
  minute too soon, the 90% bonus): it must still pass, unchanged.
- The admin page in a preview (`node tools/release/run.js` runs it): Fixed and No change needed each make their call.

**Out of scope**: sound for the scenes (the redesign has no sound setting: Sam hasn't asked for one); the journey
trophies in the case ([the trophy case](done/2026-11-12-redesign-trophy-case-and-cards.md)); `sw.js`; applying anything.

## Done when

- [ ] An arcade game on a new hub starts and finishes a session and pays its +50 through the server
- [ ] Timmy Time's minutes report, and what they pay shows on the pill
- [ ] The admin page resolves a report as Fixed or No change needed (the box in
      [the journeys](2026-11-06-redesign-progression-journeys.md))
- [ ] The live hubs make exactly today's calls (the smoke test on every hub)
- [ ] The release note's box "The game layer's wiring left by phase 4, part A" ticked for the arcade and Timmy
      Time, with what is left for the release itself (episode lengths, `sw.js`) still listed
- [ ] `node tools/release/run.js` once; vault written back (`DEPLOY_NOTES.md`, the hand-off in phase 4's Log, this
      note's Outcome)

## Log

- 2026-11-12 (Claude Code, planning only): written from the release note's box, as its own session (Sam's call).

## Outcome

Related: [the journeys](2026-11-06-redesign-progression-journeys.md) · [game-server](../reference/game-server.md) ·
[the release](2026-11-06-redesign-release.md) · [phase 4](2026-11-05-redesign-phase-4-game-layer.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the task in
> `vault/tasks/2026-11-12-redesign-game-layer-wiring.md`. Grep the big files (`widget/games.js`, `widget/podcast.js`,
> `widget/v3.js`, `review/index.html`), never read them whole. No subagents. The live hubs must make exactly the
> calls they make today. Neither pending migration is applied or changed: if the client disagrees with one, tell me.
> No hosted preview. Open a draft PR with the test report; I'll say "merge".
