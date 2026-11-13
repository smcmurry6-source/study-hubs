---
type: task
status: done
hub: widget
created: 2026-11-12
requested-by: Sam
due: before the redesign's release
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/356
---

# The trophy case and the celebration cards, on the design system

## Goal

[Phase 4](../2026-11-05-redesign-phase-4-game-layer.md)'s original goal, never built: the redesign's pages still open
today's trophy panel (an emoji grid with ??? for secrets) and show today's rank-up, level, trophy and mock cards.
The trophies and their silhouettes were drawn in phase 0. This puts the trophy case and the cards on the design
system, on the redesign's pages only: drawn trophies in place of emoji and ???, a secret trophy as its silhouette
with a one-line riddle, the rank name in flat metal, and the tier cutscene and the level, trophy and mock cards on
the site's type with their motion kept.

## Context

- Session 6 of phase 4's "From here to the release", after [the bowling egg](2026-11-06-redesign-bowling-egg.md), so
  the case lists the three journey trophies and the Bowling trophy once. "For every session above" there holds here.
- Sam, 2026-11-12 ([decisions](../../decisions.md)): build it before the release. And the same day: "I also want to
  remove the full arch challenge thing" ("Full Arch is retired", below). Earlier calls that stand: the eggs'
  pop-ups stay as they are; "the mastery medals that pop up on the screen and the ones that are visible in timmys
  board need to be the same" (2026-11-10); the scenes are silent (no sound setting in the redesign).
- The plan: [the audit and plan](2026-11-05-redesign-audit-and-plan.md), section 4; the taste skill in full
  (`.claude/skills/taste-skill/`, Sam, 2026-11-04); the design page, `tools/preview/design/`.
- Where things are today:
  - The case's list: `TROPHIES` in `widget/ranks.js` (24 rows: `k`, `n`, `d`, `ic` an icon path, `secret`, `clue`
    the riddle). The panel that shows it is the shared widget's Stats panel; a new hub's More, "Stats and trophies"
    (`moreStats` in `widget/hub.js`) draws a few numbers and a button that clicks the old panel open
    (`#shstat-stats-pill`).
  - The cards: `widget/rankup.js` (`window.shRankUp`: `tier`, `level`, `trophy`, `mock`, `scene`; its styles are
    built in `css()`; `trophyArt(ic, px, key)` draws a trophy's icon). `widget/ranks.js` decides when
    (`trackTrophies`, `trophyCard`, `masteryCard`, `playRankUp`).
  - The drawings: `tools/figures/site/medals.mjs` (`TROPHIES`, `silhouette(key)`, the medals), built today only into
    the design page; the three journey trophies are in `widget/hub-art/journeys.js` (`SH_JOURNEY_ART.trophies`).
  - Shares: `get_trophy_stats_v2` (the 24 kinds and `journey-0` to `journey-2`).

## Build spec

**Sam's look comes first.** Before the build: one contact sheet, light and dark, phone and laptop widths, of the
case (earned, not earned, secret) and of each card's last frame (a new rank, a new level, a trophy, a mastery medal,
a mock result), drawn as static pages from the real drawings. Sam's yes, then build.

**Files to touch**:
- `tools/figures/site/build.mjs`: build the trophies and silhouettes into a new `widget/hub-art/trophies.js`
  (`window.SH_TROPHY_ART`), fetched on first use.
- New: `widget/trophies.js` (+ its styles): the case as something a page can mount
  (`window.shTrophies.mount(el, { profile, stats })`), fetched on first use.
- `widget/hub.js`: `moreStats` mounts the case in More, "Stats and trophies"; the leaderboards stay behind today's
  button (the agent's cut, to keep this one session; Sam can widen it).
- `widget/dash.js`: the "you" card's trophies open the same case.
- `widget/ranks.js`: the Bowling trophy's row, the three journey trophies in the list and Full Arch out of it
  (below), **only for a page on the redesign** (a v2 profile, or the engine): a live page's case must still say 24.
- For Full Arch (below): one gate in `widget/eggs.js`, and its row out of the Extras lists in `widget/hub.js`
  (`moreSettings`) and `widget/dash.js` (`openSettings`).
- `widget/rankup.js`: the cards' new look **only on the redesign's pages**. The safest way: the new styles go in a
  stylesheet only the new pages load (`widget/hub.css`, `widget/dash.css`, or a file fetched with the first card),
  keyed on a class the new pages set on `<html>`, and `trophyArt` draws from `SH_TROPHY_ART` when it is there. The
  cards' timing, order, queue (`enqueue`), skip and reduced-motion stills don't change.
- The tests, the vault.

**Not to touch**: the migrations; what earns a trophy or a rank; `widget/eggs.js`'s pop-ups (Full Arch's gate is the
one change there); `widget/v3.js`'s Stats panel (the live hubs use it); the journeys' scenes (`widget/journeys.js`).

**What it shows**:
- **27 trophies, 16 of them secret** (this note first said 14; today's 24 already have 16 secret, the About page's
  "14" being out of date, and Sam OK'd 16 on 2026-11-13): today's 24 without Full Arch (retired, below), `journey-0`, `journey-1`,
  `journey-2` (Handpiece, ModuPro and Loupes finished) and Bowling (secret). An earned trophy: its drawing, name, what it was for, and the share of the
  class that has it. Not earned: the drawing dimmed, with what earns it. A secret one not earned: its silhouette and
  its riddle (`clue`), never its name. Bowling is earned on the device (`sh_bowl_trophy`,
  [the bowling egg](2026-11-06-redesign-bowling-egg.md)) and shows no share until the server knows the kind.
  **What the bowling egg left for it** (2026-11-13): the drawing and its silhouette are `EGG_TROPHIES.bowling` in
  `tools/figures/site/medals.mjs` (`{ body, sil }`, 64 box; built into the design page's `art.js` as `eggTrophies`, in
  no widget file yet: put it with the case's own art); its words are `shBowl.TROPHY` in `widget/bowling.js`
  (`{ k: "bowling", n: "Lane Legend", d: "Saw all eight bowling clips", secret: true, clue }`; copy them, since that
  file loads only at a strike or the lane). The device keeps `sh_bowl_trophy` (the day it was earned) and
  `sh_bowl_seen` (the clips' keys); the page hears `sh:bowl-trophy` when the eighth is seen, and Timmy says his line
  then. The name "Lane Legend" is the bowling session's pick: Sam can rename it.
- **The rank** at the top of the case: the medallion (`HX.rankArt`, `shRanks.artOf`), the rank's name set in flat
  metal, the level, the XP to the next step, and the road ahead (`shJourneys.road(profile)`, as More, Stats has it).
- **The cards**: the site's typeface and tokens, the drawn trophy or medal, one line of what happened and one of
  what's next. Motion as today; with reduced motion one still card.

**Full Arch is retired** (Sam, 2026-11-12: "I also want to remove the full arch challenge thing"). Full Arch is the
32-tooth chart in the corner of a hub that grows a tooth for each right answer and loses one for each miss
(`widget/eggs.js`, "Full Arch"; its switch is `sh_pref_arch`), with a secret trophy for filling it, once per hub
(`fullarch` in `TROPHIES` and in the per-hub list in `widget/ranks.js`). On the redesign's pages, in this session:
- **The chart never shows**: one gate at the top of Full Arch's code in `widget/eggs.js`, true only on the redesign's
  pages (the engine, or `data-game="v2"` on the widget's tag), so a live hub keeps it until the release.
- **Its switch is gone** from Settings, Extras: the `sh_pref_arch` row comes out of `EXTRAS` in `widget/hub.js` and
  `widget/dash.js` (Focus mode's list of extras with it).
- **Its trophy leaves the case's list**, the main one and each hub's: nobody sees a locked Full Arch any more, and
  it isn't one of the 27. **Someone who already earned it keeps it**, shown after the others as "Full Arch
  (retired)" with its drawing (the agent's default, told to Sam; Sam, asked again with #337: "Sounds good". The other way was that it vanishes
  for everyone). Nothing on the server changes: the kind stays in `record_achievement`'s list and nothing calls it.
- What is left for the release itself is a box in [the release note](../2026-11-06-redesign-release.md): the code out
  of the shared files, the About page's entries, Timmy's tip and line about it.

**The preview's made-up data**: `high-xp` has earned Full Arch in one hub (so the retired trophy can be seen),
`returning` hasn't. `high-xp` has most trophies and all three kinds of secret state; `new` has none;
`?xp=124999` and one answer still plays the hand-off after a card. `get_trophy_stats_v2` is answered with made-up
shares, each over at least 5 people.

**Budgets**: `widget/trophies.js` and `widget/hub-art/trophies.js` load when the case is first opened or a trophy
card first shows, never with a page. Report `hub-art/trophies.js`'s size.

**Tests to add**:
- `node tools/ci/smoke.js`: on a new hub, More, "Stats and trophies" shows 27 trophies, no Full Arch among the locked ones, the retired one for `high-xp` only, a secret one as a silhouette
  with no name in the page, an earned one with its drawing; neither file loaded with the page; a trophy earned in
  the test shows the new card, and it can be skipped; no Full Arch chart shows after a right answer, and Settings has
  no Full Arch switch. On the new dashboard: the case opens from the "you" card. On a
  live hub: the case says 24, the Full Arch chart still grows, and the cards look as today (compare the card's markup and class list before and after).
- `tools/release/a11y.js`: the case (every trophy has a name a screen reader gets, a secret one is announced as
  secret, never by name) and one card, added to the baseline with no issues.

**Out of scope**: new trophies beyond the four; the leaderboards' look; sound; the old pages; the About page (draft
in [the release note](../2026-11-06-redesign-release.md): its "From phase 4, part A" draft said 27 trophies and 14 secret; the count is
27 and 16: Bowling joins and Full Arch leaves; the draft's wording changes to say so).

## Done when

- [x] Sam's yes to the contact sheet, then to a recording of each card and the cutscene from a scripted browser on
      made-up data, reduced motion too (the sheet: "sounds good" to round 2, 2026-11-13; the recording sent
      2026-11-13: laptop, laptop with reduced motion, phone; Sam, after it: "merge when ready")
- [x] The case on the design system in a new hub's More and on the new dashboard, with 27 trophies, 16 secret
- [x] Full Arch retired on the redesign's pages: no chart, no switch, no locked trophy; an earned one kept as retired
- [x] The cards on the site's type on the redesign's pages; a live page's case and cards unchanged
- [x] The tests above added and passing; `node tools/release/run.js` once; budgets unchanged
- [x] The release note's About drafts say 27 and 16, with Bowling in and Full Arch out; its "journey trophies in
      the trophy case" box ticked
- [x] Vault written back (decisions, `DEPLOY_NOTES.md`, the hand-off in phase 4's Log, this note's Outcome)

## Log

- 2026-11-12 (Claude Code, planning only): written when the planning found this part of phase 4 unbuilt; Sam:
  build it before the release.
- 2026-11-12 (Claude Code, planning only): Sam: "I also want to remove the full arch challenge thing". Written in as
  "Full Arch is retired": this session takes it off the redesign's pages, the release takes the code and the About
  entries out. The count is 27 trophies, 14 secret.
- 2026-11-13 (Claude Code, session 6): the contact sheet, round 1 (light and dark, phone and laptop, from the real
  drawings and today's card code). Sam: "It needs to be more epic". Round 2: the rank in a burst of rays, a showcase
  stand, a wooden cabinet with a plaque and three velvet shelves, the cards framed in metal. Sam: "sounds good" (the yes,
  with the calls listed in [decisions](../../decisions.md): 16 secret, Timmy's place pieces in the rank-up, a "what's
  next" line, the share on an unfound secret, the mastery card's own medal). Built. Then Sam, seeing the page: "the
  whole stats and trophies page could use a face lift. make it more epic" and "the trophy case you did earlier is good,
  but the rest of the page doesnt match the epicness": the rest of More, Stats and trophies redrawn to match (below).
  Bugs found on the way: BUG-116 to BUG-121. The recording of the cards went to Sam (laptop, reduced motion, phone); Sam: "merge when ready".

## Outcome

Built 2026-11-13 by session 6 ([#356](https://github.com/smcmurry6-source/study-hubs/pull/356)), on the redesign's pages only, with one live fix (BUG-116, below). Otherwise nothing students see changes: the
live hubs and the live dashboard keep their 24 trophies, Full Arch, the old Stats panel and today's cards (the smoke test
compares the live cards' markup with `main`'s). Neither pending migration was applied or changed.

- **The case**: `window.shTrophies.mount(el, { profile, stats, sb, onBoards })` in the new `widget/trophies.js`, with its
  styles in the new `widget/trophies.css` (container queries, light and dark). It draws the rank (the medallion in rays
  of its metal, the name in flat metal, the level, the XP bar and, on the game layer, the road ahead from
  `shJourneys.road`), a showcase stand (opens on your rarest trophy, or the next to win; a tap on any trophy puts it
  there), and the cabinet: "Won by studying" (8), "The journeys" (3), "Secrets" (16), and a "Retired" shelf with "Full
  Arch (retired)" only for someone who won it. A won trophy is lit on a brass plate with its share; one not won is dimmed
  with what earns it; an unfound secret is its silhouette, "Secret" on its plate, its clue in the showcase, and "Found
  by N% of the class", never its name (its spoken label too: "Secret trophy, not found yet. Clue: ..."). Bowling comes
  from the device (`sh_bowl_trophy`, and the page's `sh:bowl-trophy`) and shows no share. Every button carries
  `data-sht` first, so click counts record "trophy", never a name.
- **Where it opens**: a new hub's More, "Stats and trophies" (`moreStats` in `widget/hub.js`), with the leaderboards
  behind its "Leaderboards" button (today's panel, `#shstat-stats-pill`); and the new dashboard's "you" card, a "Trophy
  case" button with the count that opens it in a dialog (`openTrophies` in `widget/dash.js`; Leaderboards there closes
  the dialog and goes to the boards).
- **The rest of the Stats page** (Sam's face lift): the numbers on a dark scoreboard with brass rivets and an accuracy
  gauge, a card for each lecture (answered, accuracy in a color band, "Strongest" and "Needs work" once two lectures
  have five answers), and the achievements as rosettes; its styles are in `widget/trophies.css` (`.stx`), so the page
  draws them once that file is in.
- **Loading**: `widget/ranks.js` is the loader: `trophyCase(cb)` fetches `widget/hub-art/trophies.js`
  (`window.SH_TROPHY_ART`, built by `tools/figures/site/build.mjs`: 30 drawings and 16 silhouettes, **128 KB, 23 KB
  compressed**) and `widget/trophies.js`; `trophyCss(cb)` adds the stylesheet; `trophyStats(cb, sb)` reads
  `get_trophy_stats_v2` (falling back to `get_trophy_stats`) and keeps it 10 minutes; `shareOf(k)`, `caseCount(badges)`
  and `RETIRED` are exported. None of it loads with a page; the first card or the first look at the case fetches it.
- **The list on the redesign** (`NEW` in `widget/ranks.js`: the `shx` class the redesign's pages set on `<html>`):
  `TROPHIES` is the 8 study trophies, `journey-0` to `journey-2` ("Handpiece finished", "ModuPro finished", "Loupes
  finished"; `scene: true`, so the journeys' hand-off awards them, not `trackTrophies`), the 15 secrets without Full
  Arch, and Bowling ("Lane Legend", secret, `device: "sh_bowl_trophy"`); `HUB_TROPHIES` without Full Arch.
- **The cards** (`widget/rankup.js`, only under `html.shx`; their styles are in `widget/trophies.css`): each card waits
  for the stylesheet and the drawings (at most 2.5 s; the journeys' scenes don't wait). A trophy card is drawn from
  `SH_TROPHY_ART`, says "New trophy" in the rank's metal, with "N% of the class has it · 12 of 27 in your case"; a
  mastery card keeps the hub's medal and adds the next medal ("Gold at 90% right"); the rank-up says "New rank" (or
  "Top rank") and lists the rank's pieces for Timmy's place, then the next rank; the mock card takes its score's
  color. Timing, the queue, skip and the reduced-motion stills are as before, except BUG-116's fix: after a level-up
  card, later cards now play (on every page, live too: Sam, "ship the BUG-116 live fix too").
- **Full Arch retired** on the redesign: one gate in `widget/eggs.js` (`ARCH_OFF`: the `shx` class or a `data-game="v2"`
  widget tag), its row out of the Extras in `widget/hub.js` and `widget/dash.js`, out of both trophy lists.
- **The preview**: `high-xp` won Full Arch in Occlusion (and most trophies), `returning` didn't; `get_trophy_stats_v2`
  answers made-up shares out of 212, each at least 5.
- **Tests**: the smoke test's trophy-case block (a new hub, the new dashboard and a live hub, desktop and phone),
  `a11y.js`'s "trophy case" and "trophy card" screens (in the baseline at zero, with the bowling clip's screen that
  wasn't); the keyboard check now tells stops apart by their spoken names too. `node tools/release/run.js` once.

**For the release** ([its note](../2026-11-06-redesign-release.md)): `sw.js`'s `PRECACHE` gains the three files (with the
engine's, in session 8 or 9); the About drafts are written there ("From phase 4, session 6"); the live About page's
"14 of them secret" is already wrong today (there are 16), a line in [the inbox](../inbox.md). BUG-116 is fixed live too (Sam: "ship the
BUG-116 live fix too", in the same PR). The per-hub trophies (8 a hub) aren't in the new case (the
task didn't ask for them): they stay in today's panel behind Leaderboards, and a shelf for them is Sam's call (a box in
the release note's "From phase 4, session 6").

Related: [phase 4](../2026-11-05-redesign-phase-4-game-layer.md) · [the journeys](../2026-11-06-redesign-progression-journeys.md) ·
[the bowling egg](2026-11-06-redesign-bowling-egg.md) · [the release](../2026-11-06-redesign-release.md) ·
[about-page](../../rules/about-page.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the task in
> `vault/tasks/2026-11-12-redesign-trophy-case-and-cards.md`. Use the taste skill. Grep the big files
> (`widget/ranks.js`, `widget/rankup.js`, `widget/hub.js`), never read them whole. No subagents. The live pages must
> look and behave exactly as today. Neither pending migration is applied or changed. Send me the contact sheet first
> and wait for my yes before building; then a recording of the cards. No hosted preview. Open a draft PR with the
> test report; I'll say "merge".
