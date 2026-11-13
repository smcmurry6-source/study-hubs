---
type: task
status: done
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: 
---

# The bowling egg: odd bowling-alley animations, Timmy style

## Goal

Sam's idea (2026-11-06): bowling animations like the strange cartoon clips that play on the screens at real bowling alleys
after a strike or a spare, slightly Timmy themed, as an **Easter egg**. Ships with the redesign.

## Context

- Easter eggs live in `widget/eggs.js`; the About page lists them inside spoilers ([about-page](../../rules/about-page.md)).
- Rules that matter most here: [podcast-reactions](../../rules/podcast-reactions.md) (lore: nothing that contradicts
  `tools/podcast/LORE.md` or `widget/pet.js`, never TIMMY in capitals), [every-hub-gets-its-own-art](../../rules/every-hub-gets-its-own-art.md)
  (drawn in SVG, nothing generated). Dismissing things is a top-five interaction ([the audit](2026-11-05-redesign-audit-and-plan.md)),
  so a clip is short, skips with a tap and never covers an unanswered question.

## The clips

About eight, 3-5 seconds each, drawn in Timmy's ink style and animated in SVG and CSS (no video). The pins are the Plaque crew
from the boss egg (Count Plaqula, Plaque Claus and the rest), never teeth; the ball is a giant sugar-free mint. In the spirit
of the bowling-alley screens:

1. **The panic**: the pins see the mint coming, scream and scatter; the mint follows one around the corner.
2. **The conga**: the pins dance a conga line straight into the gutter.
3. **The floss lasso**: a strand of floss lassos all ten and yanks them off screen.
4. **The handpiece rocket**: the ball turns out to be a handpiece with a jet flame; the pins are flung into orbit (Dark
   Matter stars in the background).
5. **The clean sweep**: the toothbrush by the door sweeps the pins into a dustpan.
6. **The neighbor**: number thirty-one watches from the gallery, faints at the noise, and is fanned with a scorecard.
7. **The turkey** (three strikes in a row): a turkey in Timmy's pilgrim hat struts across and takes a bow.
8. **The spare**: one pin wobbles for a long time, then a tiny mint rolls in and taps it over.

Each has a still version for reduced motion: the last frame and the word ("Strike!", "Spare!", "Turkey!").

## How it's found

- **In the bank**: every 50 first-try right answers in a row plays a strike clip (at 50 and 100), on the bar and only after
  that answer's verdict (never over a question); the third strike, 150 in a row, plays the turkey instead. Not in the mock.
  (Sam, 2026-11-06: 10 and 30 "would happen way too often and be annoying".) Since 2026-09-08, counting every answer (retries
  and the mock too, so more often than the real trigger): a run of 10 right came about 5,200 times, about 4.6 times a day for
  each person studying; a run of 50 about 110 times, for 43 people, about once in ten study days; a run of 150 only a couple
  of times. So the turkey is rare by design, and the bowling lane at Timmy's place still plays any clip.
- **At Timmy's place**: the bowling lane yard item ([Timmy's place](../2026-11-06-redesign-timmys-place.md)); tapping it plays a
  random clip.
- **First sighting** of each clip goes in the egg log; seeing all eight is a secret trophy (keep the About page's trophy count true).
  (2026-11-12: there is no egg log on the site; sightings and the trophy are kept on the device, see "Sam's calls
  (2026-11-12)".)
- Off with the eggs toggle in Settings, like every egg. Tracked as `egg:bowling=<clip>` (`window.shTrack`), with its row in the
  [event taxonomy](../../reference/event-taxonomy.md).

## Sam's calls (2026-11-12, [decisions](../../decisions.md))

- **The clips are not redrawn.** The eight were drawn and animated on 2026-11-06 in
  [#291](https://github.com/smcmurry6-source/study-hubs/pull/291) (never merged; its base branch is long gone):
  `tools/figures/site/bowling.mjs`, one kit, built into `window.SH_BOWL`. This session carries that file to a fresh
  branch, shows Sam a recording, and closes #291.
- **No XP for a strike.** Paying XP would need a change to `migration_v54.sql`.
- **Sightings are kept on the device**, and seeing all eight is the secret trophy. The server stores no sightings as
  written, so clips seen on a phone and on a laptop don't add up.
- **The trophy itself is on the device too until after the release** (found while writing this spec, told to Sam):
  the database's `record_achievement` takes only the trophy kinds it lists, `bowling` isn't one, and neither pending
  migration changes that. So at the release the Bowling trophy shows in the case from this device's sightings, earns
  no gold crowns and has no "share of the class" line. The first migration after the release adds the kind (a box in
  [the later journeys' rank sets](../2026-11-12-redesign-later-journeys-rank-sets.md), which needs a migration anyway),
  and the client then records it for everyone who has it.
- **Only on the redesign's pages** (the engine's answer path), so no live hub changes before the release.
- **The lane** at Timmy's place plays a random clip; its small "Strike! Well, close." stays as what it does when the
  eggs are off.

## Build spec

Session 5 of [phase 4](../2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release", after the shop's
client. Read first: "For every session above" there, this note, the lore rules in
[podcast-reactions](../../rules/podcast-reactions.md), `widget/place.js`'s `playEgg`.

**Files to touch**:
- `tools/figures/site/bowling.mjs`: taken whole from #291 (`git fetch origin claude/bowling-egg-r3inwl`, then
  `git checkout origin/claude/bowling-egg-r3inwl -- tools/figures/site/bowling.mjs`). Don't merge that branch: its
  `build.mjs`, design page and notes are a week behind `main`. Read #291's diff of `tools/figures/site/build.mjs` and
  `tools/preview/design/` and redo those few hunks by hand on today's files.
- `tools/figures/site/build.mjs`: build the kit into `widget/hub-art/bowling.js` (`window.SH_BOWL`, about 56 KB) and
  into the design page's "The bowling egg" section; keep the build's check of every clip, still and playing.
- `tools/figures/site/medals.mjs`: the Bowling trophy's drawing and its silhouette (key `bowling`), for the
  [trophy case](../2026-11-12-redesign-trophy-case-and-cards.md) session to list.
- New: `widget/bowling.js` (`window.shBowl`: `play(clip, { host })`, `random()`, `seen()`), with its styles inside
  or beside it, fetched on first use. It fetches `widget/hub-art/bowling.js` itself.
- `widget/hub-rewards.js`: the run counter, in the engine's one answer path (`recordAnswer`), so only the
  redesign's pages count.
- `widget/place.js`: in `playEgg`, a tap on the lane (`data-egg="lane"`) plays a random clip inside the full view
  when the eggs are on, and the lane's own small surprise otherwise.
- `tools/podcast/LORE.md` (the bowling alley, number thirty-one fainting at the noise; never TIMMY in capitals),
  the tests, the vault.

**Not to touch**: `widget/eggs.js`, `widget/ranks.js`, `widget/rankup.js` (shared with the live hubs; the queue below
is called, not changed), `widget/v3.js`, `widget/pet.js`, the migrations.

**How it behaves**:
- **The run**: an answer counts when it is the first answer to that question on this device today, on a question
  card outside the mock and the arcade (the bank, the Daily Drill, Weak spots; `ctx` says which). Right: the run
  goes up by one. Wrong: it goes to 0. A second try at a question neither counts nor resets. The run is kept on the
  device across hubs and reloads (`sh_bowl_run`).
- **The triggers**: at 50 and at 100 a strike clip, picked at random from the six strike clips (the panic, the conga,
  the floss lasso, the handpiece rocket, the clean sweep, the neighbor); at 150 the turkey, and the run starts again
  from 0. The spare plays only from the lane (the agent's default: the note names no trigger for it).
- **When and where it plays**: after that answer's verdict is on the card, as a small card docked at the bottom of
  the screen (not over the question, not full-screen), 3 to 5 seconds, gone by itself or at a tap. It waits its turn
  behind a rank-up, level or trophy card (`window.shRankUp.scene(run)` queues it, as the journeys' scenes do). Never
  during a mock (`html.sh-mock-on`), and not at all when the eggs are off (`sh_pref_eggs` is `off`) or in Focus mode.
- **Reduced motion**: the clip's still (its last frame) with its word, "Strike!", "Spare!" or "Turkey!".
- **Sightings**: `sh_bowl_seen`, the clips' keys seen on this device. With all eight, `sh_bowl_trophy` is set and
  Timmy says a line; the trophy's card and its place in the case are the trophy case session's. Nothing is sent to
  the server for a sighting or the trophy (see Sam's calls).
- **Tracking**: `egg:bowling=<clip>` (`window.shTrack`), with its row in [event-taxonomy](../../reference/event-taxonomy.md).

**The preview's made-up data**: nothing new on the server side, and no new query parameter. A test or a scripted
browser sets `sh_bowl_run` to 49 in the device's storage, so one right answer shows a strike; the `high-xp` account
has the lane out at Timmy's place.

**Budgets**: `widget/bowling.js` and `widget/hub-art/bowling.js` load at the first strike or the first tap on the
lane, never with a page; the three new hubs stay at 20, 20 and 18 requests.

**Tests to add**:
- The build: every clip plays and has its still; every class a clip's CSS moves is in its drawing (from #291).
- `node tools/ci/smoke.js`, on a new hub: with the run at 49, one first-try right answer in the bank shows the clip
  card after the verdict, and a tap removes it; a wrong answer puts the run at 0; a retry changes nothing; nothing
  plays in the mock, with the eggs off or in Focus mode; reduced motion shows the still and the word; neither file
  loaded with the page. At Timmy's place (`high-xp`): a tap on the lane plays a clip, and with the eggs off the
  lane's own surprise. On a live hub: no counter, no file.
- `tools/release/a11y.js`: the clip card (it is named, can be closed from the keyboard, and takes no focus by itself).

**Out of scope**: XP; anything on the server; `widget/eggs.js`; the trophy case's row and the trophy's pop-up card
(the next session); sound; the live hubs.

**Done when** (this replaces the list below where they differ):
- [x] The eight clips on `main` from #291's kit, in the design page, and Sam's yes to a recording of them (and to
      the stills); #291 closed
- [x] The run, the three triggers and the lane work as above on the redesign's pages; the live hubs are unchanged
- [x] Sightings and the trophy are kept on the device; the Bowling trophy's drawing and silhouette are in `medals.mjs`
- [x] The tests above added and passing; `node tools/release/run.js` once; budgets unchanged
- [x] `tools/podcast/LORE.md`; the About draft in [the release note](../2026-11-06-redesign-release.md) ("From phase 4,
      part D", in a spoiler, with the trophy count); the event taxonomy row; the hand-off in phase 4's Log

## Done when

- [x] The eight clips drawn and animated, approved by Sam from a recording (and their still versions)
- [x] The triggers ~~in `widget/eggs.js`~~ (in the engine's answer path instead, per the build spec) and the bowling
      lane at Timmy's place, built in phase 4
      (the lane is at his place since part C, 2026-11-12: a wide yard piece with a small tap surprise of its own;
      where a clip hooks in is in [phase 4's Log](../2026-11-05-redesign-phase-4-game-layer.md))
- [x] `LORE.md` (the bowling alley, number thirty-one's fainting), the About page (in a spoiler: drafted in the release
      note, written to `about/index.html` at the release), the event taxonomy
- [x] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [x] Vault written back (`DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: written from Sam's calls in chat ("maybe we can make it an easter egg").
- 2026-11-06: the triggers moved from 10 and 30 in a row to 50 and 150 (Sam), with the data on how often each happens.
- 2026-11-12 (Claude Code, planning only): Sam's calls and the build spec above. The clips exist (#291) and are
  carried over. The triggers go in the engine's answer path, not `widget/eggs.js`, so no live hub changes. The trophy
  can't be recorded on the server as written (`record_achievement` lists its kinds), so it is on the device until
  the first migration after the release.
- 2026-11-13 (Claude Code): **built**, ahead of sessions 3 and 4 (it needs only session 2). The kit carried over from
  #291 unchanged and built into `widget/hub-art/bowling.js` and the design page; a recording of the eight clips and their
  stills sent to Sam. New `widget/bowling.js` (`window.shBowl`); the run in `widget/hub-rewards.js`'s `recordAnswer`;
  the lane in `widget/place.js`'s `playEgg`; the Bowling trophy ("Lane Legend", the agent's name for it) drawn in
  `medals.mjs` as `EGG_TROPHIES.bowling`. Calls the spec left open, made here:
  - **The eggs off or Focus mode stop the run too**, not only the clip ("not at all"): nothing counts or resets until
    they are back on.
  - **The spare plays only from the lane**, as the spec's default said; the lane picks any of the eight, never the one
    just shown.
  - **A still (reduced motion) goes by itself after 4 seconds** like a playing clip (3 to 5 seconds), rather than staying
    until tapped; hovering or focusing the card holds it, and Esc or its close button closes it.
  - **On the bar the card waits for an open dialog**: it doesn't show while a modal is up (the place, the shop), and it
    sits above the widget's floating pieces (Timmy, the Full Arch chart) and below the rank-up cards.
  - Learn mode's questions count like the bank's (a question card outside the mock and the arcade); a Learn question
    asked again the same day is a second try.
- 2026-11-13: Sam, after the recording: "Looks good. Merge when ready" ([decisions](../../decisions.md)). Merged; #291
  closed unmerged with a note pointing here.

## Outcome

**Built and merged, not live until the redesign's release** (2026-11-13). What changed:

- **The clips**: #291's kit (`tools/figures/site/bowling.mjs`) carried over as drawn (only its header's path to this note changed), built by `build.mjs` (which now
  checks every clip: each class the CSS moves is in the drawing, 3 to 5.5 seconds with the word inside, the still has no
  NaN) into `widget/hub-art/bowling.js` (`window.SH_BOWL`, 56 KB, 18 KB gzipped) and a "The bowling egg" section of the
  design page (every clip playing and still, plus the trophy).
- **The player**: `widget/bowling.js` (`window.shBowl`) draws a clip in a small card docked at the bottom of the screen
  (inside the place's full view when the lane is tapped). It takes no focus, is named for screen readers, closes on a
  tap, its close button or Esc, holds while hovered or focused, waits behind the rank-up cards and open dialogs, and
  shows the still with "Strike!" under reduced motion. Neither file loads with a page: both are fetched at a strike or a
  lane tap.
- **The run**: `widget/hub-rewards.js` counts right first tries in a row on the device (`sh_bowl_run`, one try per
  question a day in `sh_bowl_today`): a strike at 50 and 100, the turkey at 150 (the run starts again). The mock and the
  arcade don't count, and with the eggs off or Focus mode on nothing counts or plays. The live hubs are unchanged.
- **The lane**: `widget/place.js`'s lane egg plays any clip but the one just shown (its old line, "Strike! Well, close.",
  stays for the eggs off).
- **The trophy**: Lane Legend (secret) for seeing all eight, kept on the device (`sh_bowl_seen`, `sh_bowl_trophy`) with a
  line from Timmy and an `sh:bowl-trophy` event; its drawing and silhouette are `EGG_TROPHIES.bowling` in `medals.mjs`.
  The server can't record it yet (`record_achievement` lists its kinds): the trophy case session shows it from the
  device, and the first migration after the release can take it.
- **Tests**: the smoke test plays a strike, the turkey, the retry, the wrong answer, the eggs off, Focus mode, the mock,
  reduced motion, the lane and a live hub; the accessibility suite checks the clip card. Two bugs found and fixed in
  testing (BUG-105, BUG-106).

Left, each written where it belongs: the About page entry and the service worker's precache at the release
([the release note](../2026-11-06-redesign-release.md), "From phase 4, part D"); the trophy's row and pop-up card
([the trophy case](../2026-11-12-redesign-trophy-case-and-cards.md)); the trophy on the server after the release.

Related: [Timmy's place](../2026-11-06-redesign-timmys-place.md) · [Timmy's shop](../2026-11-06-redesign-timmy-shop.md) ·
[phase 4](../2026-11-05-redesign-phase-4-game-layer.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the **"Build spec"** in
> `vault/tasks/2026-11-06-redesign-bowling-egg.md`. The eight clips are already drawn on PR #291: carry
> `tools/figures/site/bowling.mjs` over, don't redraw and don't merge that branch. Grep the big files, never read
> them whole. No subagents. No XP and nothing on the server: neither pending migration is applied or changed. Send
> me a recording of the eight clips and their stills and wait for my yes; then open a draft PR with the test report
> and close #291.
