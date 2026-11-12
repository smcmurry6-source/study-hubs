---
type: task
status: in-progress
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: Sam (a look at the new hand-off, then "merge")
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/332
---

# Three equipment journeys, more ways to earn XP, and the Dark Matter unlock

## Goal

Sam's idea (2026-11-06, workshopped in chat and decided the same day): the handpiece ladder becomes the first of three
journeys, **Handpiece, then the Acadental ModuPro, then Dental Loupes**, each from Stone to Dark Matter III. Everyone keeps
their XP and handpiece rank; finishing one journey's Dark Matter III starts the next. XP has **no daily cap** and many more
ways to earn it, and the server checks what it pays for. Reaching Dark Matter plays a special one-time unlock, with a calm
version for reduced motion. Ships with the redesign.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10).
  The client side is [phase 4](2026-11-05-redesign-phase-4-game-layer.md) (part A); the server side is
  [phase 5](2026-11-05-redesign-phase-5-backend.md) (part 3); both go live with [the release](2026-11-06-redesign-release.md).
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md),
  [about-page](../rules/about-page.md), [learner-data-privacy](../rules/learner-data-privacy.md),
  [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (the drawn ink style),
  [outside-sources-for-figures](../rules/outside-sources-for-figures.md).
- Code: `widget/ranks.js` (`TIERS`, `art()`, `levelFor`), `widget/rankup.js` (the tier cutscene and cards), `widget/pet.js`
  (the house grows with the tier), `sh_tier`, `sh_tier_floor`, `sh_step`, `sh_xp_on_insert`, `sh_xp_rebuild`, `xp_seen`,
  `xp_days`, `xp_visitors`, `record_personal_answer`, `record_choice` in `supabase/schema.sql` (migration_v53). The new
  engine's `recordAnswer` (phase 1; in `widget/hub-rewards.js` since the split, 2026-11-12) already sends the picked choice's index and the context (`bank`,
  `mock`, `arcade`...) with every answer.

## Sam's calls (2026-11-06, [decisions](../decisions.md))

- **No cap on the XP earn rate** (the 600-a-day cap goes, and no new daily caps).
- **More ways to earn XP**: double XP for 24 hours on hub mastery, XP for listening to Timmy Time and for playing the
  arcade, XP when your report is resolved (and the milestones below).
- **The journeys keep their length**, or only slightly less, since there will be more ways to earn. "ModuPro" stays the name.
- Everything here ships with the redesign.

## What the data says (2026-11-06, `xp_visitors` and `xp_days`, totals over 5+ people)

- 158 people have XP: Antique or higher 118, Bronze 75, Silver 39, Gold 7, Diamond 0, Dark Matter 0. Median 1,240 XP. The
  five most active average about 14,500 XP over about 29 active days since 2026-09-08.
- **The cap halved what heavy studiers earned**: 540 of 1,112 person-days (49%) hit it, and without it the answers so far
  would have paid about 2.1 times as much, for the class and for the five most active alike. So taking it off roughly
  doubles the leaders' pace, to about 15,000 XP a month in term, before the new sources.
- 14% of all answers repeat a question already answered that day ("Try it again" is the bank's most-used feature).

## The ladder

- **The Handpiece stays exactly as it is** (Dark Matter 50,000-125,000), so no one's rank or level moves.
- **The ModuPro runs 125,000-250,000 and the Loupes 250,000-375,000**: each journey the same length, so Dark Matter means
  the same in each. Their seven tiers are evenly spaced (about 17,900 XP a tier, 6,000 a level). At the uncapped pace the
  most active finish the Handpiece in about seven or eight months and each later journey in about eight more, before the
  new sources. If that proves slow, the later journeys can be shortened before anyone reaches them.
- One ladder of 63 steps on the server (3 journeys, 7 tiers, levels I-III): `sh_step` gives the step and a `journey` 0-2,
  and `get_rank_profile`, the bootstrap, the rank board and the leaderboards carry it. Rank names read "ModuPro Gold II".

## XP: no cap, checked by the server

The 600-a-day cap is removed **from the release on**; past days keep what they paid, with no back pay (Sam, 2026-11-06). Without a
cap, these guardrails keep a script from flooding the leaderboards without slowing anyone who studies:

- **The server knows the bank.** At the release the content JSON also loads a `question_keys` table (hub, qid, version, the
  right choice indexes). `record_personal_answer` takes the picked choice's original index (as `record_choice` already does)
  and the context, and the server decides right or wrong. Unknown and retired ids earn nothing. Self-graded cards (Perio's
  "Show answer") earn a flat 2.
- **A speed limit no reader reaches**: answers under 2 seconds apart, or over 30 a minute, still count in class stats but
  earn no XP. (The median answer takes 7 seconds.)
- **A question's repeat XP pays for its first three right answers each day**, so "Try it again" always pays and replaying one
  question all night doesn't.
- The honest limit: without accounts, a determined script can still earn about as much as the most dedicated student. The
  answer keys are in the public page. In the same work, check that no public function hands out another visitor's id
  (`record_personal_answer` writes to whatever id it's given).

## Ways to earn

| Source | XP | How the server knows | Pays |
|---|---|---|---|
| An answer | 10 for a question's first right answer, 2 for a later right one, 1 for a wrong one | server-checked answers | every answer, with the guardrails above |
| A day studied | +20 | any answer that day | once a day |
| **A hub mastery medal** (Bronze, Silver, Gold, Crown) | +100, +200, +300, +500, **and 24 hours of double XP** | the medal, worked out from answers | once per medal; a new medal during a boost restarts the 24 hours; never more than 2x at once (a shop boost doesn't stack on top of it, the larger one applies) |
| **Timmy Time** | 10 per minute of an episode heard for the first time, +100 for finishing it | the player's progress, minute by minute | each minute of each episode once |
| **The arcade** | the game's answers earn answer XP; +50 for finishing a game | the answers (context `arcade`) and the game's end | the finishing bonus the first time each game is finished each day |
| **A report or suggestion fixed** | +100 to the person who sent it | Sam resolves it as "Fixed" on the admin page (a new choice beside "No change needed", which pays nothing) | once per report |
| The day's 20th answer (the goal ring's default) | +30 | today's answers | once a day |
| Fixing an earlier miss | +5 | a question missed on an earlier day, answered right today | once per question |
| A mock finished | +50 | its answers | once per hub per day |

Not XP: reading time (activity pings are easy to fake; the Check-yourself questions under each lecture reward reading),
taps, page loads, rank-ups, trophies and idea-board votes. Every award is a row with a unique key, so a reload or a replayed
call can't pay twice, and Link my devices (`sh_xp_rebuild`) rebuilds it all. The About page lists every source.

## The journeys on screen

- The same seven materials in every journey, so Gold reads as Gold; the object changes: the handpiece, then the ModuPro (the
  sim-lab typodont), then the loupes. The handpiece art is one shape drawn in each material (`shRanks.art`), so each new
  journey is one new drawing (plus its Stone and Antique variant) in the same materials, in Timmy's ink style, drawn anew from
  the manufacturers' own specs and photos as reference.
- Everything that stops at tier 6 learns about journeys: `widget/ranks.js`, `widget/rankup.js`, `widget/pet.js` and Timmy's
  place ([its note](2026-11-06-redesign-timmys-place.md): the journey's object shows there), trophies (one per journey
  finished), the "you" panel (the road ahead, the next object shown locked).
- A hand-off scene when a journey's Dark Matter III is done: "The ModuPro is yours."
- The double-XP boost shows on the rank pill with its time left, and the XP float says "2x".

## The Dark Matter unlock

- Once per journey, ever: recorded on the server (an achievement row), so a second device or a reload doesn't replay it; the
  bootstrap says whether it's been seen.
- Full version: about 6-8 seconds, skippable, built on the tier cutscene: the casing goes dark, a starfield opens inside it,
  Timmy reacts on the bar. Reduced motion: one still card that fades in under a second, the starfield drawn still, no camera
  moves. Sound only when the student turned sounds on. The ModuPro's and the Loupes' Dark Matter get their own versions.

## Where people end up by June 1 (projection, 2026-11-06)

Sam asked where people would end up, with the winter break (about Dec 8 to Jan 2) and the term running to June 1. The
assumptions: each group keeps the pace it has had since 2026-09-08 (60 days of term so far); 181 days of term to go (Nov 7
to Dec 7, then Jan 3 to Jun 1, nothing over the break); the new rules from now on (each week before the release runs at the
old rate, about half the leaders' new pace); past days as they were. Groups by XP today, averages over 5-11 people.

| Group | XP today | Old rules, June 1 | New rules: answers and milestones | Plus medals and double XP (estimate) |
|---|---|---|---|---|
| The five most active | 14,500 | 58,000: Dark Matter I | 113,000: Dark Matter III | 138,000-153,000: ModuPro Stone III to Antique II |
| The next 10% (11 people) | 10,900 | 44,000: Diamond III | 91,000: Dark Matter II | 109,000-121,000: Dark Matter III |
| Around the 75th percentile (11 people) | 4,900 | 20,000: Gold II | 40,000: Diamond II | 44,000-47,000: Diamond III |
| Around the median (11 people) | 1,300 | 5,100: Silver I | 8,200: Silver II | about 8,400: Silver II |

- **How**: answer XP per day of term without the cap (about 500, 420, 190 and 36 for the four groups; with the cap it was 242,
  182, 82 and 21), milestones from each group's own history (days with 20 answers and misses fixed on a later day: about 39,
  24, 6 and 2 XP a day), medals at the rate each group has earned them (19, 14, 4 and 0.4 per person in 60 days, about 275 XP
  each), and double XP as a range (one extra study day's XP for every one or two medals). Timmy Time, the arcade and fixed
  reports add a little more (a whole episode is about 550 XP).
- **What it means**: only the most active reach the ModuPro by June; the Loupes (250,000) are two years or more away for
  anyone; the middle of the class spends the year in Silver and Gold, so that's where most rank-ups happen.
- **Back pay was considered and turned down** (Sam, 2026-11-06). It would have added about 15,600, 14,200, 6,200 and 900, and the five most active
  would have reached ModuPro Antique II to Bronze II, the next 10% Dark Matter III to ModuPro Stone II, the 75th percentile Dark
  Matter I, the median Silver II.

## Done when

- [x] Server (phase 5, part 3, built on a throwaway copy, applied at the release): `question_keys`, the new
      `record_personal_answer`, the guardrails, the 63-step ladder, every source in the table, the boosts, the award rows,
      `sh_xp_rebuild` updated; tests for each source, a replayed call, a double tap, a linked device (`node tools/release/rls.js`
      and a new XP suite)
- [x] Client (phase 4, part A): journeys, their art, the hand-off, the Dark Matter unlock, the boost on the rank pill
      ([#332](https://github.com/smcmurry6-source/study-hubs/pull/332), 2026-11-12). Sam saw the art in light and dark
      and asked for a bigger hand-off, which was redrawn and recorded for Sam (full and reduced motion) from the design
      page; no preview was made (asked once, Sam didn't ask for one), so the recording on the preview is left to the
      release's own preview ([phase 4](2026-11-05-redesign-phase-4-game-layer.md), its "Every card and the cutscene" box)
- [ ] The admin page's resolve control has "Fixed" and "No change needed"
- [ ] The About page's rank, XP and trophy entries rewritten, counts true; event taxonomy and retention rows for any new table
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea with the XP data.
- 2026-11-06: Sam's calls (above); the ladder keeps its length, the cap goes, more sources added. Ready for phases 4 and 5.
- 2026-11-06: the June 1 projection added, at Sam's request. Sam: no back pay; "that projection looks good".
- 2026-11-06 (Claude Code): the server is written and tested on a throwaway copy (`migration_v54.sql`, phase 5 part 3;
  [game-server](../reference/game-server.md)): `question_keys` and `record_answer_v2` (the server grades; today's
  `record_personal_answer` keeps the cap for the old pages), the guardrails, every source in the table with its award rows,
  the medal boost, `sh_rank` (the Handpiece identical to today's below 125,000), the `_v2` profile, boards and trophies, the
  Dark Matter unlock mark, `sh_xp_rebuild` with a replay. The admin page's "Fixed" / "No change needed" is
  `admin_resolve_report_v2` on the server; the control itself is still to build. The event taxonomy and retention rows for
  the new tables are in. Calls made while building, for Sam: a question's wrong answers also pay only three a day; medal and
  report awards aren't doubled by a boost; a rank-up is a tier; match questions are self-graded (a flat 2); a mock needs 10
  answers for its +50; a podcast minute needs 25 seconds since the last; "finished" is 90% of its minutes.

- 2026-11-12 (Claude Code, part A, **the art and the open calls; nothing is in the engine yet**). Branch
  `claude/game-layer-phase-4-client-rtv06n`.
  - **Drawn**: the ModuPro and the loupes, each one drawing plus its antique, as shapes in a new kit,
    `tools/figures/site/journeys.mjs` (its header cites the sources and says what a shape is). `shRanks.art(tier, px,
    { shape })` in `widget/ranks.js` draws a shape in the same medallion as the handpiece (same disc, metals, textures,
    stars, glints); without a shape its output is byte for byte what it was (checked over every tier, size and option), so
    the live hubs' handpieces don't change. Three journey trophies (`journey-0` to `journey-2`) in `medals.mjs`
    (`JOURNEY_TROPHIES`, apart from the live list).
  - **The contact sheet** is on the design page (`tools/preview/design/`, "The three journeys" under Ranks, built by
    `journeysHTML()` in `design.js` from `A.journeys` and `A.journeyTrophies` in `art.js`): the 21 medallions, the rank pill
    and board sizes, double XP on the pill and on the flying XP, the hand-off's last frame, the Dark Matter unlock's still
    card for each journey, the road ahead for the "you" panel, the trophies won and not won. Light and dark, laptop and
    phone width looked at. **Waiting for Sam's yes before any of it goes into the engine.**
  - **Next, after Sam's answers** (the open calls below): the kit built into a file the new pages load on first use (never
    with the page: Occlusion has one request to spare), the journey-aware rank in `widget/hub-rewards.js`, the hand-off and
    the unlock, the boost on the pill.

## Open calls (2026-11-12, asked before part A was built)

Asked in chat on 2026-11-12; each has the recommendation that gets built if Sam says "yes to all". **Sam's answer, the
same day: "Make the hand off more epic. Everything else looks great"** ([decisions](../decisions.md)). The agent read
that as a yes to the art and to every recommendation below (its reading, said back to Sam before building), so each is
ticked as built that way; the hand-off was redrawn as a full-screen scene. Any of them is one small change if Sam
meant otherwise.

- [x] **The art** (the contact sheet): the new objects drawn in today's medallion look, not flat ink, so the three journeys
      are one family (the plan keeps the handpiece medallions as drawn); the trophies are in ink. The ModuPro's antique is
      plaster casts on a brass hinge articulator; the loupes' antique is brass telescopic pince-nez; the loupes are
      through-the-lens with a headlight.
- [x] **The answer call.** The boost, the new XP rules and "2x" only exist behind `record_answer_v2`, and no part's note
      builds the switch (the release note lists it as a step). Recommended: part A wires it. The engine calls
      `record_answer_v2` and shows what the server paid (falling back to today's five calls while the function isn't there,
      as the dashboard does); `widget/v3.js` gets one switch only the engine sets, so it doesn't record the same answer
      twice; a mock starts and finishes its session (without one the server pays a mock's answers nothing, they arrive
      together). Or: part A only shows what the profile says and the release session wires the calls.
- [x] **The arcade's +50 and Timmy Time's minutes** (`xp_session_start` for a game, `pod_minute_v2`) are in
      `widget/games.js` and `widget/podcast.js`, shared with the live hubs. Recommended: not in part A; a to-do in the
      release note, done with the release's wiring.
- [x] **The Handpiece keeps today's names** ("Gold II", not "Handpiece Gold II"); the object's name shows from the
      ModuPro on.
- [x] **One scene at a time.** Reaching Dark Matter plays the unlock in place of the ordinary rank-up cutscene. Reaching
      125,000 plays the hand-off alone: it names the journey trophy, and no trophy card or Stone cutscene follows.
- [x] **Skipping the unlock counts as seen** (the server's mark is written when it ends or is skipped). The hand-off is
      remembered per device, like every rank-up today: the server has a mark for the unlock only, and adding one would
      change the migration.
- [x] **Each journey's Dark Matter has its own sky**: stars (Handpiece), a nebula (ModuPro), a constellation (Loupes).
- [x] **Trophy names**: "Handpiece finished", "ModuPro finished", "Loupes finished" (27 trophies in all at the release).
- [x] **The new dashboard** (its "you" card, boards, stage and ladder) learns the journeys' names and medallions in part A
      too; the kit loads there only when someone on the page is past the Handpiece.
- [x] **Timmy's place** (the statue by the door, "the ModuPro on the porch, Timmy in loupes", the rank sets for tiers
      7-20) is part C's, drawn before anyone reaches 125,000. In part A the old house card just keeps its Dark Matter
      house past 125,000.
- [x] **A preview?** The note wants the hand-off and the unlock recorded on one, reduced motion too. Asked once, here.
      Sam didn't ask for one, so none was made.

Not a call, how it will work: nothing earned is lost on entering a journey (accent colors, the house and rank sets
follow the overall rank, since the v2 profile's `tier` restarts at Stone); the flying XP shows the client's count at once
and the pill takes the server's total when the reply comes; no request is added to a page's load.

- 2026-11-12 (Claude Code, **part A built; hand-off**, [#332](https://github.com/smcmurry6-source/study-hubs/pull/332)).
  Nothing students see changes: the live hubs load none of it, and on the new pages it switches on only when the
  database has migration_v54, which is still pending.
  - **The hand-off, redrawn** (Sam: "Make the hand off more epic"): a full-screen scene of about seven seconds. The
    finished journey's Dark Matter medallion charges and flies to its place on a track of the three journeys, a beam
    comes down, the next object lands with a flash and a shake, then "The ModuPro is yours.", its seven ranks lighting
    in turn, the trophy won and one button. Skip and Escape close it at any moment; reduced motion gets the last frame
    as a still card. The Dark Matter unlock is the same kind of scene with each journey's own sky.
  - **Files.** `widget/journeys.js` (the two scenes, the road ahead, their styles) and `widget/hub-art/journeys.js`
    (the ModuPro's and the loupes' shapes and the three journey trophies, built by `tools/figures/site/build.mjs` from
    `journeys.mjs` and `medals.mjs`). **Neither loads with a page**: `widget/ranks.js` fetches them the first time a
    scene plays, the road is opened, or someone past the Handpiece is drawn (`shRanks.journeys(cb)`,
    `shRanks.needJourneyArt(cb)`). So no page's request count moved.
  - **The switch.** `widget/hub.js` writes `data-game="v2"` on the shared widget's tag; `widget/v3.js` then asks for
    `get_widget_bootstrap_v2` and falls back to today's when the function isn't there. `window.shGame.v2()` is true only
    after a v2 profile came back. With it on, an answer is **one call**, `record_answer_v2` (the pick, the ticked
    choices, a sequence's order as placed or the student's own grade; the question's version; the context; a random
    request id; the mock's session), and what the server paid goes out as `sh:answer-paid`. Without it, on every live
    hub and under an automated browser, v3.js makes today's calls exactly as before.
  - **In the engine** (`widget/hub-rewards.js`): `xpFor` counts by the new rules when the game layer is on (no cap, a
    self-graded card 2, three right and three wrong a question a day, doubled under a boost) and by today's otherwise;
    the pill takes the server's total when the reply comes and corrects today's figure; the day's 20th answer, a miss
    fixed, a medal with its double XP and a finished mock's +50 are said in a toast; the rank's name and medallion are
    the journey's (`shRanks.nameOf`, `artOf`); the boost is a gold chip on the pill with the time left, spoken too, a
    small "2x" on the phone's XP meter and on the flying XP. More's Stats shows the road ahead and the new XP note.
    `widget/hub-bank.js`: a mock starts a session when it starts and finishes it on submit (the server then saves the
    score itself); a sequence sends its order. `widget/rankup.js`: a rank-up or level-up past the Handpiece draws the
    journey's object and names it. `widget/dash.js`: the new dashboard's rank card, pill, boards and ladder know the
    journeys. `widget/pet.js` needed nothing: `shRanks.legacy()` gives the Handpiece's own rank (Dark Matter III from the
    ModuPro on) to everything that reads tiers 0 to 6, so accents and Timmy's house never go back to Stone.
  - **Where the client and the server meet, for Sam** (no change made to the migration):
    1. A one-choice question answered without a pick index is refused by `record_answer_v2` (`bad`, nothing recorded).
       The engine always sends one; a page that doesn't (an older arcade game) is recorded by today's calls for that
       answer, which pay by today's rules. The arcade's wiring at the release should send the index.
    2. The mock recasts a sequence as one pick among orderings, and the server grades a sequence by its order: the page
       sends the steps in order for the right pick and two of them swapped for any other.
    3. The server marks only the Dark Matter unlock as seen. The hand-off is remembered per device (`sh_rank_g`, the
       step of 63), like every rank-up today, so a second device plays it once more the first time it crosses.
    4. **Anyone already at Dark Matter when the release lands sees the Handpiece's unlock once**, on their first new
       page (the server has no mark for them yet). It reads as a late celebration; say so if it shouldn't play.
    5. The site has no sound setting, so the scenes are silent (the note says "sound only when the student turned
       sounds on").
  - **Checked** on the local preview's made-up data with a scripted browser (no preview for Sam was made): the answer
    that crosses 125,000 plays the hand-off and the pill reads "ModuPro Stone I"; a level-up inside the ModuPro; the
    ModuPro's Dark Matter unlock under reduced motion, marked seen once and not replayed on reload; the boost chip and
    "2x"; the road ahead on laptop and phone; the Stats panel; the new dashboard past the Handpiece; a mock (one session,
    its answers, one finish, none of today's calls); a live hub makes no v2 call and loads no journey file. The
    handpiece medallions are byte for byte what they were (every tier, size and option). The smoke test has a new
    block for it on one new hub. The preview takes `?xp=<n>` to stand a test account anywhere on the ladder.
  - **Left, written down**: the arcade's +50 and Timmy Time's minutes, the journey trophies in the trophy case, sound,
    and the About entries are boxes and drafts in [the release note](2026-11-06-redesign-release.md) ("From phase 4,
    part A"); the admin page's resolve control and the About page are this note's own open boxes; Timmy's place past
    125,000 is [part C](2026-11-06-redesign-timmys-place.md)'s.

## Outcome

Related: [phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [phase 5](2026-11-05-redesign-phase-5-backend.md) ·
[Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md)
