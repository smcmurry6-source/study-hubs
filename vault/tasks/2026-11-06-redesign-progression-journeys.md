---
type: task
status: open
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
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
  engine's `recordAnswer` (phase 1, `widget/hub.js`) already sends the picked choice's index and the context (`bank`,
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

The 600-a-day cap is removed **from the release on**; past days keep what they paid (see the open question below). Without a
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
- **With back pay** (past days recomputed without the cap) add about 15,600, 14,200, 6,200 and 900: the five most active
  would reach ModuPro Antique II to Bronze II, the next 10% Dark Matter III to ModuPro Stone II, the 75th percentile Dark
  Matter I, the median Silver II.

## Still open

- **Back pay for the cap?** Recomputing past days without the cap would about double everyone's XP and lift the leaders into
  Diamond on release day. The default is forward only; Sam may choose back pay instead.

## Done when

- [ ] Server (phase 5, part 3, built on a throwaway copy, applied at the release): `question_keys`, the new
      `record_personal_answer`, the guardrails, the 63-step ladder, every source in the table, the boosts, the award rows,
      `sh_xp_rebuild` updated; tests for each source, a replayed call, a double tap, a linked device (`node tools/release/rls.js`
      and a new XP suite)
- [ ] Client (phase 4, part A): journeys, their art, the hand-off, the Dark Matter unlock, the boost on the rank pill,
      recorded on the preview with reduced motion too; Sam has seen the art in light and dark
- [ ] The admin page's resolve control has "Fixed" and "No change needed"
- [ ] The About page's rank, XP and trophy entries rewritten, counts true; event taxonomy and retention rows for any new table
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea with the XP data.
- 2026-11-06: Sam's calls (above); the ladder keeps its length, the cap goes, more sources added. Ready for phases 4 and 5.
- 2026-11-06: the June 1 projection added, at Sam's request.

## Outcome

Related: [phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [phase 5](2026-11-05-redesign-phase-5-backend.md) ·
[Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md)
