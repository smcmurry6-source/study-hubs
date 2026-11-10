---
type: reference
tags: [supabase, xp, ranks, shop, visiting, idea-board, redesign]
---

# The game layer's server (migration_v54)

How the redesign's game layer works on the database: XP without a daily cap, server-checked answers, the three journeys,
Shiny Gold Crowns and Timmy's shop (the seasonal sets, the rank sets and throwback days included), visiting someone's place,
and the idea board. Written and tested on a throwaway copy on 2026-11-06, changed in place on 2026-11-10 for
[Sam's third round](../tasks/2026-11-10-redesign-timmys-place-round-3.md), and **applied
at [the release](../tasks/2026-11-06-redesign-release.md), not before**; until then `migration_v54.sql` is listed in
`supabase/pending-migrations.txt` and the live project runs today's rules. What each part should do and why:
[the journeys](../tasks/2026-11-06-redesign-progression-journeys.md), [the shop](../tasks/2026-11-06-redesign-timmy-shop.md),
[Timmy's place](../tasks/2026-11-06-redesign-timmys-place.md), [the idea board](../tasks/2026-11-06-idea-board.md). The code is
the home of the details: read `migration_v54.sql` (its sections are numbered as below).

## Beside today's, not instead

- Today's functions keep today's rules for every page that still calls them: `record_personal_answer` (the 600-a-day cap
  included), `record_achievement`, `get_rank_profile`, `get_widget_bootstrap`, `get_pet_days`, `get_my_inbox`,
  `set_report_resolved` and the boards. The new pages call the `_v2` functions and the new ones below.
- Three of today's functions are replaced with versions that do the same while the new tables are empty (`tools/release/xp.js`
  checks every total, profile, board and trophy rate before and after): `sh_xp_on_insert` (a v2 answer adds no capped answer
  XP; its award pays instead), `sh_xp_rebuild` (adds the award rows and replays the v2 answers) and `redeem_link_code` (also
  moves the new tables, then rebuilds).
- Section 0 is a fix for today's bootstrap ([BUG-049](../release/bug-log.md)). It was applied to the live project on its own
  on 2026-11-06 (Sam's OK) and is in `supabase/schema.sql`, so at the release it changes nothing.
- **The switch** is `game_config.v2_at`, set when the migration runs. `game_baseline` keeps each visitor's XP and badges at
  that moment. **No XP back pay** (Sam, 2026-11-06): answers from before keep what they paid, and a medal reached before the
  switch earns no XP and no boost.

## Answers and XP

- **`question_keys`** (hub, id, version, kind `one` / `all` / `order` / `self`, the answer, counted, retired): loaded per hub
  with `admin_load_question_keys(secret, hub, keys, retire_missing)`. `node tools/xp/keys.js <hub>` builds the list from a hub's
  content JSON (`--sql` prints the call with the secret left out); retired ids come from `tools/question-ids/<hub>.txt`. A
  question's version is the same fingerprint `widget/qhealth.js` uses, so a page still showing an older version is graded
  against its own key; an unknown version falls back to the current one.
- **`record_answer_v2(visitor, hub, qid, choice, picks, self, v, ctx, request, session, claim)`** replaces five calls the page
  makes today (`record_answer`, `record_choice` or `record_choices`, `record_personal_answer`, `record_correct_streak`): the
  server grades the answer from the key and records all of it, then pays. Unknown and retired ids are recorded with the
  page's own verdict (`claim`) and earn nothing.
- **What pays** (no daily cap): 10 for a question's first right answer ever, 2 for a later right one, 1 for a wrong one,
  self-graded cards a flat 2; a question pays its first three right and its first three wrong answers each Central day; +20
  for a day studied (as today); +30 at the day's 20th answer; +5 for a question missed the last time before today and right
  today (once per question); +50 for a mock with 10 or more answers (once per hub per day); +50 for an arcade game finished 20
  seconds or more after it started (once per game per day); 10 a minute of a Timmy Time episode heard for the first time
  and +100 at 90% of its minutes; +100 to the sender when Sam resolves a report as Fixed (`admin_resolve_report_v2`; "No change
  needed" pays nothing); +100 / 200 / 300 / 500 for a hub's Bronze, Silver, Gold and Crown, which also start **24 hours of
  double XP**.
- **The guardrails**: an answer under 2 seconds after the last, or the 31st in a minute, still counts in your answers and the
  class stats but earns nothing. A mock's answers arrive together at the end, so they need 2 seconds of mock time each instead
  (the session from `xp_session_start`, one answer per question per mock). A podcast minute needs 25 seconds since the last
  paid one.
- **Boosts** (`xp_boosts`): never more than 2x at once, whatever is running; a new medal restarts its 24 hours; a shop boost
  extends the running shop boost. Medal and report awards aren't boosted; answers, the day's bonuses, mocks and games are.
- **Every award is a row** (`xp_awards`, unique per visitor and key), and `answer_xp` keeps each v2 answer's request id and
  result, so a replayed call returns the first result and pays nothing, and another visitor reusing the request id is
  refused. `sh_xp_replay` works out the answer, 20th-answer and fix awards from the answers alone, so `sh_xp_rebuild` (Link my
  devices) pays exactly what the live calls paid; mocks, medals, minutes, games and reports keep their rows and are deduped by
  key when two devices merge.
- XP itself (`xp_visitors.xp`) is today's capped XP for the answers recorded the old way plus the sum of the award rows.

## The ladder

`sh_rank(xp)` gives the journey (0 Handpiece, 1 ModuPro, 2 Loupes), tier, level and step of 63. Below 125,000 XP it is
today's `sh_step` and `sh_tier` exactly; the ModuPro runs 125,000-250,000 and the Loupes 250,000-375,000, seven even tiers
each. `get_rank_profile_v2` adds the journey, the boost and which Dark Matter unlocks were seen (`mark_dark_unlock_seen`,
an achievement `dark-seen-<journey>`, once ever); a journey finished is a trophy (`journey-<n>`). The rank board, the
leaderboards, the streak stats and the arcade board have `_v2` versions with the journey and each row's visit key
(Visiting, below); `get_trophy_stats_v2` counts the journey trophies and leaves the unlock marks out.

## Shiny Gold Crowns and the shop

- **The balance** (`sh_wallet`, never stored): 1 per 10 XP of base XP (a boost's extra earns none), +25 a trophy, +50 a medal,
  +20 a rank-up (a tier) since the switch, minus what was spent. Spending never lowers XP or rank. The XP from before the
  switch counts, so the shop opens with what XP already earned; the one-time grants count from the switch on.
- **The catalog** (`shop_items`): each item's kind, rarity, price (checked against its rarity's band), season, slot, HP or
  boost, `wide` for a yard item that takes two spots (the bowling lane), `gift` (everyone owns it) and `rank_tier` (owned
  from that rank on; its price is 0). 181 rows: 57 everyday ones (the rotation, the always-shelf and the rare costumes;
  they follow Timmy's place's art, `tools/figures/site/place.mjs`; Sam, 2026-11-06: the names follow the art; the mint
  fountain is now `mouthwash-fountain`; Timmy's podcast studio, `podcast-studio`, an Epic yard piece, joined on 2026-11-10), 112 seasonal and 12 rank. The seasonal and rank rows are **exactly** `allSetItems()` of
  `tools/figures/site/sets.mjs` (generated from it; `xp.js` fails if they differ). The outfits that aren't drawn yet, the
  snacks and the boosts are still drafts (`admin_upsert_shop_item` edits them).
- **A season's set** (Sam, 2026-11-10): 1 home and 1 scene (both Legendary) and a Rare, an Epic and a Legendary outfit and
  yard thing, 8 pieces, for each of fourteen seasons. `sh_shop_seasons(date)` gives every season whose set is on sale that
  Central day (several can be at once): Halloween in October; Thanksgiving from November 1 to the day after the fourth
  Thursday; the winter holidays from then to December 26; the short holidays for the 7 days ending on their last day (New
  Year December 27 to January 2, Valentine's February 8-14, Tooth Fairy week February 22-28, Dentist's Day the 7 days
  ending March 6, St. Patrick's March 11-17, the Fourth of July June 28 to July 4, Mardi Gras the 7 days ending on Fat
  Tuesday); Easter from 6 days before to the day after; spring March 20 to May 31, summer June 1 to September 21, fall
  September 22 to November 30. `sh_season` and `sh_is_fall` are unchanged: they are the days Timmy dresses up by himself,
  in step with `holidayId()` and `isFall()` in `widget/pet.js` (checked over three years), and each falls inside its set's
  window. `sh_easter(year)` is the Easter date both use.
- **Halloween 2026's set is everyone's** (`gift`): owned by every visitor with no row written, never sold (`buy_item` says
  `owned`), never on the daily, weekly or throwback shelves; in October it is listed on the season shelf as owned.
- **Rank sets** (Sam: an outfit and a decoration for each full rank-up, earned by rank, never sold): twelve rows for the
  Handpiece's six ranks (`rank_tier` 1-6 is `sh_rank`'s `gtier`: Antique to Dark Matter; the ModuPro's and the Loupes'
  sets, tiers 7-20, come before anyone reaches them). Owned by anyone whose rank has reached the tier, so the sets of ranks
  already passed are theirs with no rows written. Never on a shelf; `buy_item` says `rank`.
- **Who owns what** is decided in one place, `sh_owned(visitor)` (and `sh_owns(visitor, item)`): what was bought, every
  gift, and every rank item reached. `equip_item`, `buy_item` and `get_my_shop` all use it.
- **The rotation** (`sh_shop_day(date)`, Central time, the same for everyone): 4 daily items seeded by the date, 3 weekly ones
  seeded by Monday's date (rarer items come up less often: weights 10, 6, 3, 1.5, 0.6; never a seasonal, gift or rank
  item), the sets of the seasons on sale (`season`), a throwback day's three (`throwback`), and the always-shelf (snacks,
  floss, boosts). A rare costume Timmy was seen in (`record_costume_sighting`, one new one a day) joins that visitor's shop
  as one more shelf until bought.
- **Throwback days** (Sam: two a month, the same for everyone): `sh_throwback_days(date)` gives the month's two days, one
  in each half of the month (the 1st-14th and the 15th-28th), worked out from the year and month; `sh_is_throwback(date)`
  says whether a day is one. That day's "Back for today" shelf is 3 seasonal items whose season is not on sale, at their
  usual price: the same weighted draw, with homes and scenes at 0.4 of their rarity's weight so they come up least; never
  a gift or a rank item.
- **Nothing is sold before its season's first run** (Sam, 2026-11-10: "holiday content is not available in the shop
  until the holiday dates"): `shop_items.added_on` is the day a row joined the catalog (the day the migration is
  applied), and a throwback only brings back a season that has been on sale since then (`sh_season_was_on`, looking back
  400 days). So in the first months the "Back for today" shelf is short or empty (`throwback` can be true with no
  throwback items: the client hides an empty shelf), and a season added later waits for its own first run.
- **`buy_item(visitor, item, request)`**: not owned already, not a rank item, on sale today for this visitor (any shelf
  above), one of each snack a day, and the balance; idempotent on the request id. **`equip_item(visitor, slot, item)`**:
  what Timmy wears and where his things stand (the home, the scene, the five yard spots the art draws, `yard-left`,
  `yard-front`, `yard-corner`, `yard-side` and `yard-right`, and the home's upgrades), only with what `sh_owns` says is
  theirs. The bowling lane always stands in `yard-side` and takes the front corner too; something put in the front corner
  takes it away. If XP ever drops below a rank (a rebuild), a rank item already on stays on.
- **`get_my_shop(visitor)`** gives today's shop (`items`, each with its shelf, `owned` and `gift`), the seasons on sale
  (`seasons`), whether today is a throwback day (`throwback`), the wallet, the `inventory` (everything owned, each with
  `how`: `bought`, `gift` or `rank`), `locked` (the rank items not reached yet, with the `rank_tier` that unlocks each),
  what's equipped, the costume log, today's snacks, the boost and `visiting`. Snack HP shows in `get_pet_days_v2`.
  `sh_buy(day, ...)` and `sh_my_shop(day, ...)` are the same two with the date given, private, for the tests.

## Visiting

Sam, 2026-11-10: "Its on by default and you visit from the boards"; a visitor sees only the place, under the leaderboard
name ([learner-data-privacy](../rules/learner-data-privacy.md): a visitor id never leaves the database).

- **The visit key.** Every row of the four `_v2` boards (`get_rank_board_v2`, `get_leaderboard_v2`,
  `get_correct_streak_stats_v2`, `get_arcade_leaderboard_v2`) has a `visit` column: 24 hex characters, a SHA-256 digest of
  the person's id with a secret only the server holds, the same on every board and for the caller's own row. The secret
  (`visit_secret`, one random value made when the migration runs) and `sh_visit_key` are closed to anon, so a key can't be
  worked out from an id or an id from a key.
- **`get_place(key)`** returns only what a place shows: `name` (the leaderboard name exactly as the boards show it, a
  chosen name or the generated one), `equipped` (the item in each slot: home, scene, the five yard spots, the upgrades,
  paint, outfit), `rank` (journey, tier, level) and `flair` (the mastery flair the boards already show). Never the visitor
  id, XP as a number, HP, snacks, the streak, answers, the wallet, the inventory, or any date or time. An unknown key gives
  null.
- **Turning it off**: `set_visiting(visitor, false)` writes a row in `pet_visit_off`; that person's `visit` is then null on
  every board and `get_place` returns null, with an old key too. `set_visiting(visitor, true)` brings the same key back.
  `get_my_shop` says `visiting: true` or `false`. Link my devices moves the choice: off on either device stays off.
- The idea board and today's boards (the ones without `_v2`) carry no key.

## The idea board

`post_idea` (a leaderboard name, a title of 3-80 characters, up to 280 more, a hub the server knows or all hubs, one of the
six categories, three a day, one every 20 seconds; `source` says whether it came from the board, Suggest or a check-in),
`vote_idea` (up, down or taken back), `report_idea` (three reports since the last restore hide it), `delete_my_idea` (its words, name, votes and notes go; an empty row keeps the day's limit),
`get_ideas` (Top, New, Shipped, filtered by hub and category, with the counts each filter would show; never a visitor id).
Sam's side, behind the secret: `admin_ideas`, `admin_set_idea` (hide, restore, a status with one line on why: the author and
every up-voter get an Inbox note, `get_my_inbox_v2`, `mark_idea_note_seen`) and `admin_post_starter_idea` (Timmy and his
neighbors, no visitor).

## The bootstrap

`get_widget_bootstrap_v2` takes today's arguments and returns today's bootstrap plus the v2 rank, Timmy's days with snack HP,
the Inbox with idea notes and the visitor's shop. With no visitor it carries today's shop and nothing of anyone's.

## Calls made while building it, for Sam to confirm before the release

Each is one line in `migration_v54.sql` to change.

- A question's wrong answers also pay only their first three a day (as its right ones do).
- Medal and fixed-report awards aren't doubled by a boost; answers, the day's bonuses, mocks and games are.
- A rank-up, for the +20 gold crowns, is a new tier (seven a journey), not a level.
- Match questions are self-graded (a flat 2): the server can't check a drag-and-drop pairing from one index.
- A mock pays its +50 only with 10 or more answers; an arcade game only when finished 20 seconds or more after it started,
  and a very fast game's answers can fall under the speed limit.
- Timmy Time: a minute pays when 25 seconds have passed since the last paid one (so 2x speed still pays); "finished" is 90%
  of its minutes.
- A rare costume Timmy was seen in stays on that visitor's shop until bought (one new sighting a day).
- An idea's hub must have keys loaded; an author's delete removes the words, name and votes but keeps an empty row for the
  day's limit.
- The catalog's undrawn outfits, snacks and boosts, and their prices, are drafts. (The seasonal and rank rows are no longer
  drafts: they follow `tools/figures/site/sets.mjs`.)
- From the third round (2026-11-10), each also one place in `migration_v54.sql`:
  - The two throwback days are one in each half of the month (the 1st-14th and the 15th-28th), so they are never back to
    back; homes and scenes carry 0.4 of their rarity's weight on that shelf.
  - A gift or a rank item counts as owned only while it is active in the catalog; what was bought stays owned either way.
  - `buy_item` checks "owned" before "on sale today", so a gift always answers `owned`, and a rank item not yet reached
    answers `rank` (with its `rank_tier`) instead of `not-today`.
  - Gifts and rank items show in `get_my_shop`'s `inventory` with no date (`at` is null); with no visitor, `locked` lists
    all twelve rank items.
  - The visit key is 24 hex characters of SHA-256 (not md5), and it never changes: turning visiting off and on again
    brings the same key back. The secret has its own table (`visit_secret`), apart from `game_config`.
  - `get_place` finds its person among everyone a board can list (XP, answer streaks, arcade scores), so someone on the
    arcade board with no answers can be visited too. It gives the rank as journey, tier and level only (no step, no XP).
  - `get_my_shop` also says which seasons are on sale and whether today is a throwback day; the season shelf lists the
    holidays' sets before the long seasons'.
  - A season's set is on sale on every day Timmy wears that holiday's outfit and, for the short holidays, the days before:
    the Fourth of July's is June 28 to July 4 (7 days; Sam confirmed it, 2026-11-10).
- Today's `record_personal_answer` stays open after the release, with today's capped rules, for any page that still calls it;
  a later migration can close it once no page does.

## Tests

`node tools/release/xp.js` builds a throwaway database from `supabase/schema.sql` with made-up history, applies the pending
migrations as the release will, and checks all of the above (348 checks: a replayed call, a double tap and a linked device
among them, the rebuild against the live calls, the catalog against `tools/figures/site/sets.mjs`, three years of shelves
day by day, and a place opened from a board row). `node tools/release/rls.js` applies the pending migrations too, seeds
the new tables and calls every function a visitor can run with one visitor's id, failing if another visitor's id comes back;
`rls-expectations.json` also lists what must be closed to anon altogether (`anonNone`: `visit_secret`, `pet_visit_off`;
`anonNoRun`: `sh_visit_key`, `sh_visit_link`), and it checks that a place and the boards give a key, never an id.
`admin-ops.js` and `retention.js` run with them in place. CI runs all four. `tools/release/rls-audit.sql` checks the same
two lists on the live database once the migration is applied.

Related: [the release](../tasks/2026-11-06-redesign-release.md) · [phase 5](../tasks/2026-11-05-redesign-phase-5-backend.md) ·
[event-taxonomy](event-taxonomy.md) · [analytics-retention](analytics-retention.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [shared-infrastructure](shared-infrastructure.md)
