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

# Timmy's shop, rare costumes and bowling

## Goal

Sam's idea (2026-11-06, workshopped in chat): Timmy becomes a lasting cosmetic reward with no effect on studying. Students
earn a separate currency and spend it in a Timmy shop on visual-only outfits, house items and effects, kept on the server
across devices and safe from refresh or replay. When no holiday is on, Timmy now and then wears a rare costume, the same one
all day. Bowling animations play at defined moments. This note is the workshop and the proposed plan; nothing is built yet.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (sections 4.4 and 4.5; 4.10 lists
  this note), [phase 1](2026-11-05-redesign-phase-1-hub-engine.md) (the session recap card, the goal ring),
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md).
- Rules that matter most here: [podcast-reactions](../rules/podcast-reactions.md) (the lore rules: never contradict
  `tools/podcast/LORE.md` or `widget/pet.js`), [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (drawn
  in SVG in Timmy's ink style, nothing generated), [about-page](../rules/about-page.md) (spoilers for secrets),
  [learner-data-privacy](../rules/learner-data-privacy.md).
- Sam's standing calls: Timmy's HP model stays as it is; every pop-up stays as it is (2026-11-05, [decisions](../decisions.md)).
- Code: `widget/pet.js` (`OUTFITS`, `holidayId()`, `isFall()`, `houseSvg`), `widget/eggs.js` (`HOLIDAYS`, the Plaque bosses).

## What the data says (the [audit](done/2026-11-05-redesign-audit-and-plan.md), section 1)

- About 28% of visitors adopted Timmy; 60 of 89 adopted Timmys sit under 50 HP. The game layer reaches about a quarter of
  the class and holds a few; Sam's direction is that it leads (plan, 4.1).
- Dismissing things is a top-five interaction, so nothing here adds a pop-up: it lives on surfaces people already see (the
  bar, the "you" panel, the session recap card).
- Holidays and the fall weeks cover Sep 22 to Jan 2 (but for Dec 27-30), Feb 10-14, Mar 6, Mar 14-17 and Easter week. A
  rare costume would show from January to mid-September, the spring semester's exams included.

## The proposal

### The currency

- Name: **Mints** (Timmy's sugar-free mints). Alternatives: Sparkles, Floss.
- **Worked out by the server from XP**: 1 Mint per 10 XP, plus one-time grants (each trophy 25, each mastery medal 50,
  each rank-up 20). It follows XP, so it inherits XP's cap and checks ([the journeys note](2026-11-06-redesign-progression-journeys.md))
  and adds no new way to farm. Spending never lowers XP or rank.
- **Back pay**: on day one everyone has the Mints their XP already earned (median about 120, the most active about
  1,450), so the shop isn't empty.
- The balance is earned minus spent, always computed on the server; the browser only shows it.

### The shop

- In More and on the "you" panel. Outfits for Timmy that aren't holiday ones (a scrub cap, a white coat, safety glasses,
  a bow tie, a beanie, a graduation cap...), things for his house and yard (a mailbox, a porch light, a bed of floss
  flowers...), and effects on Timmy and the celebration cards only (a sparkle trail on the XP float, the recap card's
  confetti). Nothing that touches HP, XP, the questions or the study surfaces.
- Prices from about 100 to 1,500 Mints, with a few cheap items so a median student can buy one in the first week.
- **Every item drawn by the agent in SVG**, in Timmy's ink style, and approved by Sam the way phase 0's art was.
- **Purchases on the server**: `buy_item(visitor, item, request_id)` checks the price (a server catalog table) and the
  balance, writes `pet_inventory (visitor, item)` with a unique key (each item is owned once) and is idempotent on
  `request_id` (a double tap or a replayed call buys once). `equip_item` keeps what Timmy wears on the server, so every
  linked device shows the same. The bootstrap carries the balance, the inventory and what's worn. Link my devices merges
  inventories and spending.

### Rare costumes

- About a dozen drawn costumes (a pirate, an astronaut, a detective, a chef, "Captain Enamel" with a cape...), each with
  its lines, added to `tools/podcast/LORE.md` in the same PR.
- **Picked from the visitor's id and the day** (Central time): on about 1 day in 12 that has no holiday or fall outfit, the
  same costume on every reload and every linked device that day. No server call needed.
- **What wins**: a holiday or fall outfit, then the rare costume of the day, then the outfit the student is wearing from
  the shop. A first sighting goes in the "you" panel's costume log ("Spotted: the pirate") and unlocks it in the shop.
- Holidays keep one costume per page load (canon in `LORE.md`: "he can't pick one"), unless Sam wants them daily too.

### Bowling

- **What Timmy bowls with**: a giant sugar-free mint, at ten pins that are the Plaque crew from the boss egg (Count Plaqula,
  Plaque Claus and the rest in `widget/eggs.js`), never teeth. Holiday pins in season (pumpkins in October).
- **When**: on the session recap card (after 25 answers or on leaving the bank, plan 4.4), so it adds no pop-up. **Ball
  one** knocks down the first-try score out of 10; **ball two** knocks down the misses fixed with "Try it again" (the bank's
  most-used feature: 78 of 82 bank users). All ten on ball one is a **strike**, all ten after ball two a **spare**; Timmy
  cheers or shrugs on the bar.
- **Big moments**: a rank-up, a mastery Crown and the Dark Matter unlock get a perfect strike with the pins flying. A first
  strike and a first three strikes in a row are trophies (keep the About page's trophy count true).
- **Reduced motion**: the pins and the score drawn still, no roll.
- Tracked as `recap:bowl=strike`, `spare` or `open` (`window.shTrack`), with its row in the
  [event taxonomy](../reference/event-taxonomy.md).

## Where it goes in the redesign

Phase 4 (the game layer), released with the rest; the server tables and functions are built and tested beside phase 5's.
The art (the items, the costumes, the alley and pins) goes through phase 0's process: drawn, shown to Sam, approved.

## Decisions for Sam

1. How Mints are earned: from XP (recommended), or by rules of their own?
2. The name: Mints, Sparkles, Floss, or another?
3. Bowling: on the session recap card (recommended), or only at big moments (rank-ups, medals, a perfect mock)?
4. On a rare-costume day, does the rare costume win over the shop outfit (recommended)? And do holiday costumes stay one
   per page load, or become one per day?

## Done when

- [ ] Sam's calls are in [decisions](../decisions.md) and this note
- [ ] The catalog, the costumes and the bowling art drawn and approved by Sam (light and dark, phone and laptop)
- [ ] The Mints balance, `buy_item`, `equip_item` and the inventory built, with tests on a throwaway copy (a double tap,
      a replayed call, a balance too low, a linked device)
- [ ] Rare costumes and bowling built in phase 4 and recorded on the preview, reduced motion too
- [ ] `LORE.md`, the About page (shop, rare costumes in a spoiler, bowling, trophies) and the event taxonomy and retention rows
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea; waiting on Sam's calls.

## Outcome

Related: [the journeys](2026-11-06-redesign-progression-journeys.md) · [phase 4](2026-11-05-redesign-phase-4-game-layer.md) ·
[podcast-reactions](../rules/podcast-reactions.md) · [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md)
