---
type: reference
tags: [supabase, xp, ranks, shop, visiting, idea-board, redesign]
---

# The game layer's server (migration_v54)

How the redesign's game layer works on the database: XP without a daily cap, server-checked answers, the three journeys,
Shiny Gold Crowns and Timmy's shop (the seasonal sets, the rank sets and throwback days included), visiting someone's place,
and the idea board. Written and tested on a throwaway copy on 2026-11-06, changed in place on 2026-11-10 for
[Sam's third round](../tasks/done/2026-11-10-redesign-timmys-place-round-3.md), and **applied
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
  what's equipped, the costume log, today's snacks and the boost. Snack HP shows in `get_pet_days_v2`.
  `sh_buy(day, ...)` and `sh_my_shop(day, ...)` are the same two with the date given, private, for the tests.
- **How the client uses it** (`widget/shop.js`, session 2 of [the shop](../tasks/2026-11-06-redesign-timmy-shop.md)):
  the balance and the shelves come from the bootstrap's `shop`, then one `get_my_shop` when the shop opens and one after
  each purchase (handed to the place: `shPlace.setup({ shop })`); `buy_item`'s `balance` is shown at once. A purchase's
  request id is made when an item's sheet opens and reused for every try from it (a double tap, a retry after a dropped
  connection), and a new one only after `dup`. A snack's reply has no HP: `widget/pet.js` reads his days again
  (`shPet.refresh(true)`, `get_pet_days_v2`), and `simulate()` adds each day's `hp` after the day's own change. A
  boost's `boost_until` goes to `shGame.setBoost` unless a longer boost is already running. `get_my_shop`'s items don't
  carry `wide`: the client reads it from the place's kit. The rare costume of the day is worked out on the page
  (`costumeOfDay` in `widget/hub-timmy.js` and `widget/dash.js`: about one day in twelve from the visitor id and the
  Central day, never on a holiday or in the fall weeks), and `record_costume_sighting` is called only on that day if
  the costume isn't in `shop.costumes` yet (once a day per device). `tools/release/xp.js` checks both against the server.

## Visiting

Sam, 2026-11-10: "Its on by default and you visit from the boards"; a visitor sees only the place, under the leaderboard
name ([learner-data-privacy](../rules/learner-data-privacy.md): a visitor id never leaves the database). **No opt-out**
(Sam, 2026-11-11): everyone on a board can be visited, and there is no switch, no `set_visiting` and no list of who turned it
off.

- **The visit key.** Every row of the four `_v2` boards (`get_rank_board_v2`, `get_leaderboard_v2`,
  `get_correct_streak_stats_v2`, `get_arcade_leaderboard_v2`) has a `visit` column: 24 hex characters, a SHA-256 digest of
  the person's id with a secret only the server holds, the same on every board and for the caller's own row; every row has
  one. The secret
  (`visit_secret`, one random value made when the migration runs) and `sh_visit_key` are closed to anon, so a key can't be
  worked out from an id or an id from a key.
- **`get_place(key)`** returns only what a place shows: `name` (the leaderboard name exactly as the boards show it, a
  chosen name or the generated one), `equipped` (the item in each slot: home, scene, the five yard spots, the upgrades,
  paint, outfit), `rank` (journey, tier, level) and `flair` (the mastery flair the boards already show). Never the visitor
  id, XP as a number, HP, snacks, the streak, answers, the wallet, the inventory, or any date or time. An unknown key gives
  null.
- **Link my devices** moves a place with everything else: the id that remains has the board rows and the place, and the
  other device's key opens nothing.
- The idea board and today's boards (the ones without `_v2`) carry no key.
- **The client** (2026-11-13, [visiting](../tasks/done/2026-11-12-redesign-visiting.md)): on the new dashboard
  (`widget/dash.js`) every row of the Ranks and Study streaks boards with a key (24 hex characters; anything else isn't
  one) has its name as a button, `data-dash="visit"`, with the key on the row (`data-visit`), never on the button, so a
  click count never holds it. A tap asks `get_place` once a page for a person (the stage's outfits, `loadFits`, share the
  answer) and opens `shPlace.open({ place })`: the name as text in the title, no HP, no Customize, in the leaderboard's
  theater look. Your own row opens your own place. A null place or a failed call puts one plain line on the row. The
  hubs' boards (`widget/v3.js`) don't visit yet (Sam, 2026-11-12).
- **Visit someone random, from the whole class** (`migration_v57.sql`, pending, applied at the release after v56; Sam,
  2026-11-13: "i want random to be for the whole class"). `get_random_place(p_visitor, p_skip)` picks on the server from
  everyone `get_place` can open (XP, answer streaks, arcade scores: on a board or not) **who has customized their place**
  (at least one row in `pet_equipped`; Sam: "skip people with zero customization"; null when no one else has, and the page
  says so), never the caller, the id the
  caller's linked devices share, or any device linked to another (its place is under the id that remains). It returns
  `get_place`'s answer and `visit`, that person's key; nothing when there is no one else or the visitor id is malformed.
  `p_skip` takes up to 100 keys the trip has shown: anyone else comes first, so a trip goes through the class once before
  anyone twice, then starts again. Volatile, runnable by anon; v54 is unchanged. The page (`widget/dash.js`'s
  `visitRandom`) sends its own id and the trip's keys, keeps the places it gets (no second `get_place` for them), and
  hands `widget/place.js` a `nav` with `more()`: Next past the last place rolls the die again, Previous goes back through
  the trip. Without the function (before the release) or when it fails, the button picks among the board's rows whose
  place has something chosen. A visit to someone in the Ranks board's top ten shows their number as a badge (the page
  matches the key to that board's `rnk`: nothing on the server).

## The idea board

`post_idea` (a leaderboard name, a title of 3-80 characters, up to 280 more, a hub the server knows or all hubs, one of the
six categories, three a day, one every 20 seconds; `source` says whether it came from the board, Suggest or a check-in),
`vote_idea` (up, down or taken back), `report_idea` (three reports since the last restore hide it), `delete_my_idea` (the
author's delete removes the idea completely, Sam 2026-11-11: its row, votes, reports and Inbox notes, so it no longer counts
toward the day's three or the 20 seconds, and Sam can't see or restore it),
`get_ideas` (Top, New, Shipped, filtered by hub and category, with the counts each filter would show; never a visitor id).
Sam's side, behind the secret: `admin_ideas`, `admin_set_idea` (hide, restore, a status with one line on why: the author and
every up-voter get an Inbox note, `get_my_inbox_v2`, `mark_idea_note_seen`) and `admin_post_starter_idea` (Timmy and his
neighbors, no visitor).

**The answer call, the ladder and mock sessions have their pages since 2026-11-12** (phase 4, part A,
[the journeys](../tasks/2026-11-06-redesign-progression-journeys.md)): a new hub's widget tag carries `data-game="v2"`,
and `widget/v3.js` then asks for `get_widget_bootstrap_v2`, sends each answer as one `record_answer_v2` (falling back
to today's calls when the function isn't there, or when the server answers `bad` because a one-choice question came
without a pick), starts and finishes a mock's session, and hands the server's reply to the engine as `sh:answer-paid`
(`window.shGame`). `widget/ranks.js` reads `get_rank_profile_v2` there, plays the hand-off and the Dark Matter unlock
(`widget/journeys.js`) and calls `mark_dark_unlock_seen` when an unlock ends or is skipped.

**The arcade, Timmy Time and the admin page's "Fixed" have their pages since 2026-11-13** (phase 4, session 8,
[the wiring](../tasks/done/2026-11-12-redesign-game-layer-wiring.md)). Each runs only where `shGame.v2()` is true, so a
live page makes today's calls (the smoke test compares them with `main`'s files):
- **The arcade** (`widget/games.js`): `shGames.played(game, name)` at a game's start calls
  `shGame.startSession("arcade", game)`; `shGames.over(game, score, today)` at its end calls `finishSession(id, score)`
  (the score whole, 0 to 200000) in place of `submit_arcade_score`, and falls back to `today()` when there is no session
  or the finish fails. The five shared games call `played` in their `begin()`; a hub's own games (`arcade.js`) get both
  hooks from `tools/hub-next/build.mjs` (`gameHooks`), which fails the build if it can't find every game's start.
  `widget/hub-rewards.js` puts the session (`shGames.session()`) on an arcade answer and turns `sh:session-paid` into
  the pill, today's XP and "<the lobby's game name> finished: +50 XP." (`shGames.ran(id)`). Perio's Pocket Crusher
  answers have no pick, so the server says `bad` and they go out as today's calls, as the server intends.
- **Timmy Time** (`widget/podcast.js`): a minute counts once three quarters of it (45 s, less for a short last minute)
  has been heard on the device (`sh_pod_min:<hub>:<episode>`, beside `sh_pod_heard`), and the lowest such minute is
  sent as `pod_minute_v2` no sooner than 26 s after the last one paid. `unknown` (the episode's length not loaded yet)
  or a missing function stops the calls for the visit. What a minute pays goes out as `sh:pod-paid`
  (`{ hub, ep, minute, res }`), which `widget/hub-rewards.js` adds to the pill ("Timmy Time finished: +100 XP." at the end).
- **The admin page** (`review/index.html`): the Inbox reads `get_reports_v2` (`reportsRpc()`, `repV2` once it answered)
  and offers "Fixed" and "No change needed" through `admin_resolve_report_v2`, with Reopen as `open`; without the
  functions it reads `get_reports` and resolves with `set_report_resolved`, as today.

**Timmy's place has its client since 2026-11-12** (phase 4, part C, [the place](../tasks/2026-11-06-redesign-timmys-place.md)):
`widget/place.js` reads the bootstrap's `shop` (or `get_my_shop`) for `inventory`, `locked` and `equipped`, draws the
place from them and the v2 profile's `journey`, `tier` and `level`, and saves every change in its customizer with one
`equip_item`. It shows a change before the server answers by the same rules (a yard piece stands in one spot, the wide
lane goes to `yard-side` and clears `yard-corner`, a piece in `yard-corner` takes the lane away), and
`tools/release/xp.js` runs fourteen changes through both and fails if they ever differ; it also checks the place's
spring, summer and fall against `sh_shop_seasons` for every day of three years, and the kit's ids against the catalog.
`get_place` is drawn by visiting since 2026-11-13 (below and "Visiting", above). Not wired
yet: the shop (`buy_item`, the wallet, snacks and their HP in `get_pet_days_v2`: part B). **The one gap is closed** (2026-11-12, the
shop's art session, [#339](https://github.com/smcmurry6-source/study-hubs/pull/339)): the five everyday outfits
that had no drawing and the five rare costumes are drawn as kit outfits under the catalog's ids (a costume is marked
`costume`), and `tools/release/xp.js` fails if a catalog piece has no drawing, a kit costume has no row, or a snack's
or boost's thumbnail (`widget/hub-art/shop.js`) differs from its row.

The pages that call them (built 2026-11-12, [the idea board](../tasks/2026-11-06-idea-board.md)): `widget/ideas.js` (the
board and the tick), `widget/replies.js` (a status note shows as a pop-up once and stays in the Inbox; it reads
`get_my_inbox_v2` where the page says the game layer is there, which only the new dashboard does so far) and the admin
page's Inbox, "Idea board" (`admin_ideas`, `admin_set_idea`). The preview answers all of them from made-up ideas
(`tools/preview/runtime/preview.js`).

## The bootstrap

`get_widget_bootstrap_v2` takes today's arguments and returns today's bootstrap plus the v2 rank, Timmy's days with snack HP,
the Inbox with idea notes and the visitor's shop. With no visitor it carries today's shop and nothing of anyone's.

## Calls made while building it, for Sam to confirm before the release

**Sam answered these on 2026-11-11** ([decisions](../decisions.md), [the list](../tasks/done/2026-11-11-redesign-open-calls.md)):
yes to all but two. Visiting has no opt-out, and an author's idea delete removes the idea completely (row and votes). Both
are made in `migration_v54.sql` (2026-11-11) and described above; the lines below are the calls as they were asked.

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
- An idea's hub must have keys loaded. (Asked as: an author's delete keeps an empty row for the day's limit. Sam: no, it
  removes the idea completely.)
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
  - The visit key is 24 hex characters of SHA-256 (not md5), and it never changes. The secret has its own table
    (`visit_secret`), apart from `game_config`. (Asked with a switch to turn visiting off; Sam: no opt-out.)
  - `get_place` finds its person among everyone a board can list (XP, answer streaks, arcade scores), so someone on the
    arcade board with no answers can be visited too. It gives the rank as journey, tier and level only (no step, no XP).
  - `get_my_shop` also says which seasons are on sale and whether today is a throwback day; the season shelf lists the
    holidays' sets before the long seasons'.
  - A season's set is on sale on every day Timmy wears that holiday's outfit and, for the short holidays, the days before:
    the Fourth of July's is June 28 to July 4 (7 days; Sam confirmed it, 2026-11-10).
- Today's `record_personal_answer` stays open after the release, with today's capped rules, for any page that still calls it;
  a later migration can close it once no page does.

## Where the client works around the server as written

Sam's instruction since 2026-11-12: when the client and `migration_v54.sql` disagree, tell him and don't change the
migration. These are the known cases and what he chose for each (2026-11-12, [decisions](../decisions.md)). The
client follows the server in all of them. A new case: stop and tell Sam.

| The server as written | What the client does |
|---|---|
| Five everyday outfits have rows and no drawing | They are drawn (the shop's art session) |
| Five rare costumes, where the shop's first note said "about a dozen" | Five. More can join later with `admin_upsert_shop_item` |
| The prices are the draft ones | Released as written; any Sam wants changed are changed afterwards with `admin_upsert_shop_item` ([the shop](../tasks/2026-11-06-redesign-timmy-shop.md) keeps the list) |
| `record_answer_v2`'s reply has the XP and the total, not the balance | The balance is read at page load (the bootstrap's `shop.wallet`), when the shop or the "you" card opens (`get_my_shop`) and from `buy_item`'s reply; no counter ticks after an answer |
| `buy_item` sells a snack at 100 HP | The shop greys it out ("He's full") |
| `get_my_shop` says which seasons are on sale, not until when | A season's shelf says "Limited time", with no countdown |
| `sh_wallet` counts every badge kind that isn't `mastery-`, `dark-seen-` or `pet-adopt` as a trophy (+25) | The client records no new badge kinds except real trophies |
| `record_achievement` takes only the kinds it lists; `bowling` isn't one | The Bowling trophy and the clips seen are kept on the device; the kind is added in the first migration after the release ([the rank sets](../tasks/2026-11-12-redesign-later-journeys-rank-sets.md)) |
| Nothing pays XP for a bowling clip | No XP for it |
| Rank items exist for tiers 1 to 6 only | The ModuPro's and the Loupes' sets come after the release, in a new migration |
| `post_idea` takes the sources `board`, `suggest` and `checkin` | An idea Timmy drafts (Ask Timmy, part 2) posts as `board` |
| `sh_season` and `sh_is_fall` are described as the days Timmy dresses up by himself | They stay as the holiday dates (the hubs' themes, the eggs, the place's props). On the redesign's pages Timmy wears only what the student put on (Sam, 2026-11-12), and a rare costume turns up at the shop on its day instead of being worn |

Learn and Flashcards' server part is its own pending migration, not a change to this one (Sam, 2026-11-12: "B"): below.

## Learn and Flashcards (migration_v56)

The Question Bank's "Study as" toggle ([the task](../tasks/2026-11-06-redesign-learn-and-flashcards.md)): **Learn** asks
questions in rounds until each is right twice; **Flashcards** turn a question over and the student rates it Again, Hard,
Good or Easy, on a schedule like Anki's that ends on exam eve. `migration_v56.sql` is listed in
`supabase/pending-migrations.txt` after v54 and v55, needs both, and changes neither (Sam chose B of three options,
2026-11-12, [decisions](../decisions.md)). It is applied at the release, after them.

- **`card_reviews`**: one row per rating or Learn step (`what`: `again`, `hard`, `good`, `easy`, `learn-0`, `learn-1`,
  `learn-2`, `learn-reset`), with the visitor, hub, question id, whether it was rated with Study ahead, the server's time,
  the page's time (`seen_at`, clamped to the 2 days before the server's, used only for the replay's order), the request id
  and what it paid. Closed to anon (RLS on, no grants); only the functions below touch it.
- **`record_card_v2(visitor, hub, qid, what, ahead, request, seen)`** records one and pays it, through `sh_card` (closed to
  anon), which takes the same per-visitor lock as answers. A **rating pays a flat 2** (`xp_awards` source `card`, times
  `sh_xp_mult`, so a boost doubles it) for a question the server has a key for, only for **a card's first three ratings a
  Central day**, and only past **the speed limit shared with answers** (2 seconds since the last answer or rating, 30 in a
  minute, a mock's answers aside). **Study ahead pays nothing and doesn't count toward the three**; **Learn's steps pay
  nothing** (Learn's answers are ordinary `record_answer_v2` answers and pay as answers). An unknown or retired id is
  recorded and never paid. The reply is `{ok, xp, base, mult, why, boost, total}` (`why`: `learn`, `ahead`, `unknown`,
  `retired`, `fast`, `repeat` or null). The same request id again returns the first reply with `repeat: true` and adds
  nothing; another visitor's request id gets `{ok: false, error: "dup"}`. The page decides whether a card was due or new
  and sends Study ahead's ratings as such: the three-a-day cap is what keeps tapping Easy over and over from paying.
- **`reset_my_learn(visitor, hub, qids[])`**: Learn's Start over, one `learn-reset` row per question (up to 2,000 a call),
  paying nothing; returns how many.
- **`get_my_cards(visitor, hub)`**: the caller's own rows for one hub, oldest first, as `[qid, what, page time in ms,
  ahead 1/0, request id]` (the newest 20,000). The page replays them through the same scheduling code
  (`widget/study-modes.js`'s `rebuild`) with the ratings still waiting on the device, so another device ends up with the
  same schedule and Learn progress.
- **Link my devices**: a trigger on `visitor_links` (`sh_cards_on_link`, as v55 does for Timmy's chats) moves the second
  id's rows onto the first; the `card` XP already paid follows the link the way v54 handles every award (`xp.js` checks
  both).
- **Not an answer**: a rating never reaches `personal_answers`, `question_stats`, the class's picks, `answer_xp` or question
  health, and pays no day bonus (+20), no goal bonus and no medal. A flashcards-only day fills the ring and keeps the
  flame on every device (the replay marks the day studied), but the server's `xp_days` and the streak board count
  answers only, as before.
- **Learn's context**: v54's `record_answer_v2` doesn't list `learn`, so Learn's answers are filed as `other` (Sam,
  2026-11-12: v54 isn't changed). A later migration can add `learn` to the list.
- **Before the migration** (the preview's `rpc()` answers all three from fixtures): the page keeps everything on the
  device, the ratings wait in `STATE.cardq` (up to 3,000), and the first call that finds the functions missing stops
  trying until the next page load. Test browsers (`navigator.webdriver`) send nothing.

## Tests

`node tools/release/xp.js` builds a throwaway database from `supabase/schema.sql` with made-up history, applies the pending
migrations as the release will, and checks all of the above (416 checks, the shop's client in section 13b and Learn and Flashcards' in 14b: a replayed call, a double tap and a linked device
among them, the rebuild against the live calls, the catalog against `tools/figures/site/sets.mjs`, three years of shelves
day by day, a place opened from a board row, and a random visit going through the whole class, in 14a). `node tools/release/rls.js` applies the pending migrations too, seeds
the new tables and calls every function a visitor can run with one visitor's id, failing if another visitor's id comes back;
`rls-expectations.json` also lists what must be closed to anon altogether (`anonNone`: `visit_secret`, `card_reviews`;
`anonNoRun`: `sh_visit_key`, `sh_card`, `sh_cards_on_link`), and it checks that a place, a random place and the boards give a key, never an id, and that every board row has one.
`admin-ops.js` and `retention.js` run with them in place. CI runs all four. `tools/release/rls-audit.sql` checks the same
two lists on the live database once the migration is applied.

Related: [the release](../tasks/2026-11-06-redesign-release.md) · [phase 5](../tasks/done/2026-11-05-redesign-phase-5-backend.md) ·
[event-taxonomy](event-taxonomy.md) · [analytics-retention](analytics-retention.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [shared-infrastructure](shared-infrastructure.md)
