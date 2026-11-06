---
type: task
status: in-progress
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

- Easter eggs live in `widget/eggs.js`; the About page lists them inside spoilers ([about-page](../rules/about-page.md)).
- Rules that matter most here: [podcast-reactions](../rules/podcast-reactions.md) (lore: nothing that contradicts
  `tools/podcast/LORE.md` or `widget/pet.js`, never TIMMY in capitals), [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)
  (drawn in SVG, nothing generated). Dismissing things is a top-five interaction ([the audit](done/2026-11-05-redesign-audit-and-plan.md)),
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
- **At Timmy's place**: the bowling lane yard item ([Timmy's place](2026-11-06-redesign-timmys-place.md)); tapping it plays a
  random clip.
- **First sighting** of each clip goes in the egg log; seeing all eight is a secret trophy (keep the About page's trophy count true).
- Off with the eggs toggle in Settings, like every egg. Tracked as `egg:bowling=<clip>` (`window.shTrack`), with its row in the
  [event taxonomy](../reference/event-taxonomy.md).

## Done when

- [ ] The eight clips drawn and animated, approved by Sam from a recording (and their still versions)
- [ ] The triggers in `widget/eggs.js` and the bowling lane at Timmy's place, built in phase 4
- [ ] `LORE.md` (the bowling alley, number thirty-one's fainting), the About page (in a spoiler), the event taxonomy
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (`DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: written from Sam's calls in chat ("maybe we can make it an easter egg").
- 2026-11-06: the triggers moved from 10 and 30 in a row to 50 and 150 (Sam), with the data on how often each happens.
- 2026-11-06 (Claude Code): the eight clips drawn and animated, on the design page only, for Sam's look from a recording
  before any trigger goes into `widget/eggs.js`. One kit, `tools/figures/site/bowling.mjs`, built by `build.mjs` into
  `tools/preview/design/bowling.js` (`window.SH_BOWL`; about 56 KB): a front view of a lane (the deck, the curtain, the
  kickbacks the pins run behind, a masking panel with chasing bulbs), ten pins in the boss egg's colors with each crew
  member's mark (Plaque Boss is the head pin), the mint, number thirty-one (a second molar with worried brows and a
  thermometer), the toothbrush by the door, the handpiece and a turkey in Timmy's pilgrim hat. Each clip is one CSS
  timeline of 4.4 to 5.2 seconds; its still is the same timeline frozen on the last frame (`.bw-still`), and the word is
  page text over it, placed low over the lane (over the curtain for the neighbor). The build checks every clip, still
  and playing, and that every class its CSS moves is in its drawing. The design page's "The bowling egg" section plays
  them (tap to skip, play all, still), with the stills, the cast and how it's found. Left for after Sam's yes: the
  triggers, the lane at Timmy's place, the egg log and trophy, `LORE.md`, the About page and the event taxonomy.

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md)
