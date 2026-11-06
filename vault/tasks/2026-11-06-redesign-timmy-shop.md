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

# Timmy's shop: Mints, a rotating shop, rarity, seasonal outfits and rare costumes

## Goal

Sam's idea (2026-11-06, workshopped in chat and decided the same day): students earn **Mints** and spend them in a Timmy
shop that rotates (some items every 24 hours, some every week), with limited-time seasonal outfits and rarity tiers whose
prices reflect the rarity. It sells outfits, cosmetics for Timmy's house and yard, snacks and floss that restore his health,
and XP boosts. Purchases and inventory are kept on the server across devices and are safe from refresh or replay. On days
with no holiday, Timmy now and then wears a rare costume, the same one all day. Ships with the redesign.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10). Client:
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md) (part B); server: [phase 5](2026-11-05-redesign-phase-5-backend.md)
  (part 3); live at [the release](2026-11-06-redesign-release.md).
- What the house items go into: [Timmy's place](2026-11-06-redesign-timmys-place.md) (the house card, redrawn). XP and its
  boosts: [the journeys note](2026-11-06-redesign-progression-journeys.md). Bowling: [its own note](2026-11-06-redesign-bowling-egg.md).
- Rules that matter most here: [podcast-reactions](../rules/podcast-reactions.md) (the lore rules: never contradict
  `tools/podcast/LORE.md` or `widget/pet.js`), [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (drawn in
  SVG in Timmy's ink style, nothing generated), [about-page](../rules/about-page.md) (spoilers for secrets),
  [learner-data-privacy](../rules/learner-data-privacy.md).
- **This changes an earlier call**: on 2026-11-05 Sam kept Timmy's HP model as it is. Its decay and moods stay, but
  snacks and floss from the shop now restore HP (Sam, 2026-11-06).
- Code: `widget/pet.js` (`OUTFITS`, `holidayId()`, `isFall()`, `houseSvg`), `widget/eggs.js` (`HOLIDAYS`).

## Sam's calls (2026-11-06, [decisions](../decisions.md))

Mints is the name. The shop rotates daily and weekly, has limited-time seasonal outfits and rarity tiers priced by rarity,
sells house cosmetics, snacks and floss that boost health, and XP boosts. The house card gets a full redesign
([its note](2026-11-06-redesign-timmys-place.md)). Ships with the redesign.

## Mints

- **Worked out by the server from XP**: 1 Mint per 10 XP of base XP (the extra from a double-XP boost doesn't mint, so
  boosts can't feed themselves), plus one-time grants: each trophy 25, each mastery medal 50, each rank-up 20. It follows
  XP, so it inherits XP's server checks and adds no new way to farm. Spending never lowers XP or rank.
- **Back pay**: on release day everyone has the Mints their XP already earned (median about 120, the most active about
  1,450), so the shop opens with something to spend.
- The balance is earned minus spent, always computed on the server; the browser only shows it.

## The shop

- **Where**: More, and a button on the "you" panel and on Timmy's place.
- **What rotates** (the same shop for everyone, worked out from the date in Central time, so classmates can talk about
  today's shop):
  - **Daily**: 4 items, new at midnight.
  - **Weekly**: 3 featured items, new every Monday.
  - **Seasonal**: limited-time outfits and house props for each holiday and the fall weeks, on sale only in their season
    (`holidayId()`, `isFall()`); owned for good once bought. They don't replace the free holiday outfits he already wears.
  - **Always on the shelf**: snacks, floss and XP boosts.
- **Rarity tiers**, each with a price band and how often it comes up in the rotation: Common 100-200 Mints, Uncommon
  250-500, Rare 600-1,200, Epic 1,500-3,000, Legendary 4,000-8,000 (the castle, the giant mushroom, the treehouse). The rarer
  the item, the less often it shows; the tier has its own frame color on the card.
- **What it sells**:
  - **Outfits** for Timmy (a scrub cap, a white coat, safety glasses, a bow tie, a beanie, a graduation cap...), worn one at a time.
  - **Cosmetics for his place**: a new house, scene upgrades and yard items ([Timmy's place](2026-11-06-redesign-timmys-place.md)).
  - **Snacks and floss that restore HP**: for example an apple +10 HP, a cheese cube +15, floss +25, a fluoride rinse +40, each
    used at once; at most one a day of each kind, so studying stays the main way he stays healthy. Never sugar: Timmy is a tooth.
  - **XP boosts**: 2x XP for 1 hour (Rare) or 3 hours (Epic). A boost starts when you buy it; a second one extends the time
    instead of stacking, and the larger of a shop boost and a mastery boost applies.
- Every item is drawn by the agent in SVG, in Timmy's ink style, and approved by Sam the way phase 0's art was.

## On the server (phase 5, part 3)

- `shop_items` (the catalog: id, kind, rarity, price, season, art key) and a rotation function that gives the day's and the
  week's items from the date, so the browser can't pick its own.
- `buy_item(visitor, item, request_id)` checks the item is on sale today, the price and the balance, writes
  `pet_inventory (visitor, item)` with a unique key for things you own once, and is idempotent on `request_id` (a double tap or
  a replayed call buys once). Snacks, floss and boosts are used at once and logged in `pet_purchases`.
- `equip_item` keeps what Timmy wears and where his things stand on the server, so every linked device shows the same.
  The bootstrap carries the balance, the inventory, what's worn and placed, and today's shop.
- HP from snacks and floss goes through the same place HP is computed today (`get_pet_days`), so the house and the bar agree.
- Link my devices merges inventories and spending.

## Rare costumes

- About a dozen drawn costumes (a pirate, an astronaut, a detective, a chef, "Captain Enamel" with a cape...), each with its
  lines, added to `tools/podcast/LORE.md` in the same PR.
- **Picked from the visitor's id and the day** (Central time): on about 1 day in 12 that has no holiday or fall outfit (most
  of January to mid-September), the same costume on every reload and every linked device that day. No server call needed.
- **What wins**: a holiday or fall outfit, then the rare costume of the day, then the outfit the student wears from the shop.
  A first sighting goes in the "you" panel's costume log ("Spotted: the pirate") and puts it in the shop's rotation for them.
- Holiday costumes keep changing each page load (canon in `LORE.md`: "he can't pick one").

## Done when

- [ ] The catalog drawn and approved by Sam (light and dark, phone and laptop): the outfits, the snacks, the boosts, the
      seasonal sets, the rare costumes, the rarity frames
- [ ] Server: Mints, the catalog and rotation, `buy_item`, `equip_item`, the inventory and purchases, HP from snacks, the boosts,
      tested on a throwaway copy (a double tap, a replayed call, a balance too low, an item not on sale today, a linked device)
- [ ] Client: the shop in More, the balance on the "you" panel, rare costumes, recorded on the preview (reduced motion too)
- [ ] `LORE.md`, the About page (Mints, the shop, rarity, boosts, health items; rare costumes in a spoiler), the event taxonomy
      and retention rows
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea.
- 2026-11-06: Sam's calls (above). Bowling moved to [its own note](2026-11-06-redesign-bowling-egg.md) as an Easter egg; the
  house card's redesign to [Timmy's place](2026-11-06-redesign-timmys-place.md).

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [podcast-reactions](../rules/podcast-reactions.md)
