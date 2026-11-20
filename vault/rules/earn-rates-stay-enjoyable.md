---
type: rule
load: on-demand
tags: [xp, shop, game-layer, data]
since: 2026-11-18
---

# Earning XP and crowns stays enjoyable: every lessons audit checks the rates against the prices

Sam's standing rule, 2026-11-18: "add to the lessons audit a review of xp and crowns across the class to make sure earn
rates are healthy. also include shop prices in this analysis. this helps to make sure people arent earning too fast or too
slow and rates stay at a enjoyable rate. i want there to be some accomplishment in earning crowns and buying things you want
but i dont want people to feel like they are never able to afford the things they want for their timmy".

Read this before changing how XP or Shiny Gold Crowns are paid (`sh_wallet`, `sh_prizes`, `sh_time_crowns`, an award's
amount), or what the shop charges (`shop_items`, its rarity bands, the snacks and boosts):
[game-server](../reference/game-server.md) says how both work.

## The check, every audit

`/lessons-audit` runs `tools/economy.sql` (step 1b of the skill) and writes the reading in `LESSONS.md`'s Live signals,
under "The game economy". It turns every price into **study days**: a band's price divided by what the class's median
study day earns today (E1, read over a window with today's rules), next to the 75th percentile's day (a heavy studier), and
reads that against the class's rhythm (E2: how many study days a typical student has in four weeks).

## The yardstick (proposed by the 2026-11-18 audit; Sam changes it here)

| Band | Feels like | Median study days to earn one |
|---|---|---|
| Common (snacks, small outfits, paints) | something small most days you study | under 1 |
| Uncommon | a treat for a good day or two | 1-2 |
| Rare | about one exam's studying | 2-4 |
| Epic | a goal across an exam or two | 5-10 |
| Legendary | a semester goal, the real accomplishment | 10-20 |

And four signs that the rates have drifted:

- **Too fast:** the median wallet of the people studying holds more than the shop's priciest piece; or most active
  people could buy anything on today's shelves; or an Epic takes under 3 median study days.
- **Too slow:** fewer than a quarter of the people studying can afford a Rare; or a Legendary takes more than 25 median
  study days (for the median student, most of a semester); or people open the shop and leave without buying, week after week.
- **Nothing to want:** the heaviest studiers own most of the everyday rotation (compare E3's 90th percentile with the
  rotation's total in E5's catalog numbers).
- **Hoarding:** under about 10% of the crowns earned has been spent while balances keep climbing.

XP has no price, so its check is the ladder: rank-ups (E6) should come every week or two for someone studying, and the
Handpiece's end should stay months away for the median student (the journeys keep their length, Sam, 2026-11-06).

## What an audit may do about it

- **Report, never change.** A price, a rate or a prize is Sam's call: the audit writes the reading, says which signs it
  sees, and proposes numbers in the PR's "For Sam". Once Sam picks, it is a migration (the rarity bands are checked in the
  database) or `admin_upsert_shop_item`, in its own PR.
- **Never take crowns back.** A balance is worked out from all the XP, time and prizes so far, never stored, so lowering a
  rate lowers every balance at once, and someone who already spent can fall below zero. To slow earning, change the rate
  only for what is earned from a date on, or raise prices; to speed it up, a new prize or a higher rate is safe.
- **Read a change after it has had time.** A rate or price changed in the last few days, a back pay, or an exam eve
  skews a reading: say so, and read it again at the next audit before proposing more.
- Every number written down is a total over 5 or more people ([learner-data-privacy](learner-data-privacy.md)): never one
  person's balance or purchases.

Related: [game-server](../reference/game-server.md) · [the shop](../tasks/done/2026-11-06-redesign-timmy-shop.md) ·
[decisions](../decisions.md) · [learner-data-privacy](learner-data-privacy.md)
