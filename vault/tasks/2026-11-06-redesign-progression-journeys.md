---
type: task
status: blocked
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: Sam's calls (the questions under "Decisions for Sam")
agent: 
pr: 
---

# Three equipment journeys, XP that can't be gamed, and the Dark Matter unlock

## Goal

Sam's idea (2026-11-06, workshopped in chat): the handpiece ladder becomes the first of three journeys, **Handpiece, then
the Acadental ModuPro, then Dental Loupes**, each from Stone to Dark Matter III. Everyone keeps their XP and handpiece rank;
finishing one journey's Dark Matter III starts the next. XP comes from approved study activities and milestones and
resists abuse. Reaching Dark Matter plays a special one-time unlock, with a calm version for reduced motion. This note is
the workshop and the proposed plan; nothing is built yet.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10 lists this note),
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md) (the game layer), [phase 5](2026-11-05-redesign-phase-5-backend.md)
  (the XP cache), [the release](2026-11-06-redesign-release.md).
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md),
  [about-page](../rules/about-page.md), [learner-data-privacy](../rules/learner-data-privacy.md),
  [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (the drawn ink style),
  [outside-sources-for-figures](../rules/outside-sources-for-figures.md).
- Code: `widget/ranks.js` (`TIERS`, `art()`, `levelFor`), `widget/rankup.js` (the tier cutscene and cards), `widget/pet.js`
  (the house grows with the tier), `sh_tier`, `sh_tier_floor`, `sh_step`, `sh_xp_on_insert`, `xp_days`, `xp_visitors` in
  `supabase/schema.sql` (migration_v53).

## What the data says (2026-11-06, `xp_visitors` and `xp_days`, totals over 5+ people)

- 158 people have XP. Antique or higher 118, Bronze 75, Silver 39, Gold 7, **Diamond 0, Dark Matter 0**. Median 1,240 XP,
  90th percentile about 8,400. The five most active average about 14,500 XP over about 29 active days since 2026-09-08,
  about 500 XP a day they study.
- **The daily cap binds**: 540 of 1,112 person-days (49%) hit the 600 raw XP cap, and 96 people have hit it at least once.
  For the heaviest users, XP already measures days studied more than answers.
- At the most active students' pace (about 7,000 XP a month in term), Diamond (25,000) is about 1.5 months away, Dark
  Matter I (50,000) about 5 months, and the end of Dark Matter III (125,000 today) about 16 months. Two more journeys of
  that length would take the most active about three more years; most of the class would never leave the handpiece.

## How XP works today

- XP comes **only from answers**, never from clicks or reloads: 10 for a question's first right answer, 2 for a later right
  answer, 1 for a wrong one, at most 600 a day, plus 20 for each day with an answer. A rank is a step on `sh_step` (21
  steps: 7 tiers, levels I-III).
- **The weak spot is trust, not clicks.** `record_personal_answer(p_visitor, p_hub, p_qid, p_correct)` takes the browser's
  word for the question id and for right or wrong, with no check that the question exists and no pace limit. A console
  call can earn a full capped day without studying. The 600-a-day cap is the only bound, and it's what holds abuse to one
  heavy study day.

## The proposal

### 1. Reshape the empty top of the ladder now, while nobody is on it

Nobody is at Diamond, so Diamond and Dark Matter can change without moving anyone's rank or level (Gold still ends at
25,000). Recommended: **Dark Matter still starts at 50,000 but ends at 75,000** (not 125,000); **the ModuPro runs
75,000-150,000 and the Loupes 150,000-225,000**, their seven tiers evenly spaced (about 10,700 XP a tier and 3,600 a level,
about a week of steady study each). At today's pace the most active finish the handpiece in about nine months and each
later journey in about a year, and a steady student reaches the ModuPro. `sh_tier`, `sh_tier_floor`, `sh_step` and
`shRanks.TIERS` / `levelFor` change together. **This stays free only until the first person reaches Diamond**, around the
end of the semester at the leaders' pace. The alternative: keep 125,000 and make each journey 125,000 long (the Loupes
then sit out of reach for everyone).

### 2. The journeys

- One ladder of 63 steps (3 journeys, 7 tiers, levels I-III) on the server: `sh_step` gives the step and a `journey` 0-2,
  and `get_rank_profile`, the bootstrap, the rank board and the leaderboards carry it. Rank names read "ModuPro Gold II".
- The same seven materials in every journey, so Gold reads as Gold; the object changes: the handpiece, then the ModuPro
  (the sim-lab typodont), then the loupes. The handpiece art is already one shape drawn in each material (`shRanks.art`),
  so each new journey is one new drawing (plus its Stone and Antique variant) in the same materials, in Timmy's ink style,
  drawn anew from the manufacturers' own specs and photos as reference, never copied.
- Everything that stops at tier 6 learns about journeys: `widget/ranks.js`, `widget/rankup.js` (cutscene and cards),
  `widget/pet.js` (the house keeps its Dark Matter decorations and adds the journey's object: a ModuPro on the porch,
  then Timmy in loupes), trophies (one per journey finished), the "you" panel (the road ahead, the next object shown locked).
- A hand-off scene when a journey's Dark Matter III is done: "The ModuPro is yours."

### 3. XP from approved activities and milestones, checked by the server

- **The server knows the bank.** At the redesign release the content JSON ([phase 1](2026-11-05-redesign-phase-1-hub-engine.md))
  also loads a `question_keys` table (hub, qid, version, the right choice ids). The browser sends the choice it picked (by
  choice id, since choices shuffle) and the server decides right or wrong. Unknown and retired ids earn nothing.
  Self-graded cards (Perio's "Show answer") earn a flat 2.
- **A pace limit**: answers closer than 2 seconds apart, or over 30 a minute, still count in class stats but earn no XP.
- **Milestones, worked out on the server from rows it already has**, each once per person per day (a unique key, so a
  reload or a replayed call can't pay twice), capped at 100 a day on top of the answer cap:
  - the day's 20th answer (the daily goal ring at its default; a lower goal a student sets doesn't lower it): +30;
  - **fixing earlier misses**: a question missed on an earlier day and answered right today: +5 each (a day-later retry is
    the one that teaches: 69-80% right, against 88-96% within 30 minutes);
  - a mock finished (the server sees its answers): +50, once per hub per day.
- **One-time awards, outside the daily cap**: a hub mastery medal: Bronze +100, Silver +200, Gold +300, Crown +500.
- **Not XP**: reading time (activity pings come from the browser and are easy to fake; the three Check-yourself questions
  under each lecture's notes reward reading instead), taps, page loads, rank-ups and trophies (no loops).
- Everything earned so far stays (`xp_days` is kept; the new rules count from the day they ship). Link my devices
  (`sh_xp_rebuild`) rebuilds milestone XP with the rest.
- The honest limit: without accounts, abuse-resistant means **bounded**. The answer keys are in the public page, so a
  script can still answer right, but only at a human pace and only up to the cap. In the same PR, check that no public
  function hands out another visitor's id (`record_personal_answer` writes to whatever id it's given).

### 4. The Dark Matter unlock

- Once per journey, ever: recorded on the server (an achievement row), so a second device or a reload doesn't replay it;
  the bootstrap says whether it's been seen.
- Full version: about 6-8 seconds, skippable, built on the tier cutscene: the casing goes dark, a starfield opens inside
  it, Timmy reacts on the bar. Reduced motion: one still card that fades in under a second, the starfield drawn still, no
  camera moves. Sound only when the student turned sounds on.
- The ModuPro's and the Loupes' Dark Matter get their own version of the same scene.

## Where it goes in the redesign

- The ladder reshape (1): a small PR now (a migration, the rank functions, `ranks.js`, the release suites). Nothing
  anyone sees changes.
- The journeys, the hand-off and the Dark Matter unlock: phase 4, released with the rest.
- Server-checked answers and milestones need the content JSON, so they land with the release; the server side is built
  and tested beside phase 5's.

## Decisions for Sam

1. The ladder: reshape the empty top now (Dark Matter 50,000-75,000, each later journey 75,000 long), or keep 125,000 and
   make every journey 125,000 long?
2. The milestone list and amounts above: keep, change, add?
3. The name on the site: "ModuPro" (Acadental's product name, as students say it) or a plain name such as "Typodont"?
4. The Dark Matter unlock: once per journey (recommended), or only the first Dark Matter?

## Done when

- [ ] Sam's calls are in [decisions](../decisions.md) and this note
- [ ] The ladder reshape shipped: a migration, `ranks.js`, the rank functions tested on a throwaway copy (`node tools/release/rls.js`)
- [ ] The journeys, their art, the hand-off and the Dark Matter unlock built in phase 4 and recorded on the preview,
      reduced motion too; Sam has seen the art in light and dark
- [ ] Server-checked answers, the pace limit and the milestones built and tested, released with the redesign
- [ ] The About page's rank, XP and trophy entries rewritten, counts true ([about-page](../rules/about-page.md)); the event
      taxonomy and retention rows for any new table ([learner-data-privacy](../rules/learner-data-privacy.md))
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea with the XP data; waiting on Sam's calls.

## Outcome

Related: [phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop-and-bowling.md) ·
[the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) · [event-taxonomy](../reference/event-taxonomy.md)
