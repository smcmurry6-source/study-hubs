---
type: task
status: done
hub: site
created: 2026-11-11
requested-by: Sam
due:
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/308
---

# The redesign's open calls, answered in one pass

## Goal

Every judgment call the redesign is still waiting on, in one list, so Sam answers them in one sitting before the next build
session instead of one look round at a time ([run-a-redesign-session](../../how-to/run-a-redesign-session.md), step 3). An
agent records each answer in [decisions](../../decisions.md) and changes the code or note it names.

## Context

- The game layer's server: [game-server](../../reference/game-server.md) ("Calls made while building it"); each is one line in
  `migration_v54.sql`, still unapplied (it goes in at [the release](../2026-11-06-redesign-release.md)).
- The shop: [Timmy's shop](../2026-11-06-redesign-timmy-shop.md); the release's step 7 ([the release](../2026-11-06-redesign-release.md)).
- The idea board: [idea board](../2026-11-06-idea-board.md).

## The calls (Sam: yes, or what instead)

**XP and the server**
- [x] A question's wrong answers also pay only their first three a day, like its right ones.
- [x] Medal and fixed-report awards aren't doubled by a double-XP boost; answers, the day's bonuses, mocks and games are.
- [x] A rank-up, for its +20 gold crowns, is a new tier (seven a journey), not every level.
- [x] Match questions are self-graded for a flat 2 XP (the server can't check a drag-and-drop pairing).
- [x] A mock pays its +50 only with 10 or more answers; an arcade game only when finished 20 seconds or more after it started.
- [x] Timmy Time pays a minute every 25 seconds of listening (so 2x speed still pays); "finished" is 90% of its minutes.
- [x] Today's `record_personal_answer` (the capped rules) stays open after the release for any page still calling it.

**The shop and Timmy's place**
- [x] The undrawn outfits, the snacks, the boosts and **their prices** (drafts in `migration_v54.sql`'s catalog): approve the
  list and prices, or say what to change. (The seasonal and rank sets aren't drafts: they follow `sets.mjs`.)
- [x] A rare costume Timmy was seen in stays on that visitor's shop until bought (one new sighting a day).
- [x] Throwback days: one in each half of the month, never back to back; homes and scenes at 0.4 of their rarity's weight.
- [x] A gift or rank item counts as owned only while active in the catalog; what was bought stays owned either way.
- [x] **Sam: no opt-out.** Visiting can't be turned off (made in `migration_v54.sql`: see the Outcome). Was: the key never changes, even after turning visiting off and on; a visited place shows the rank as journey,
  tier and level only (no XP).

**The idea board**
- [x] An idea must name a hub with its answer keys loaded (the release loads every live hub's), or "All hubs".
- [x] **Sam: an author's delete removes the idea completely** (its row and votes; it then no longer counts toward the day's
  limit). Was: keep an empty row for the day's limit.
- [x] How long hidden ideas are kept ([analytics-retention](../../reference/analytics-retention.md)): suggest 90 days.

**Order of the rest**
- [x] Next session: **Heme & Endo Exam 2 first** (Sam), then Perio.

## Done when

- [x] Every box above answered by Sam, each answer a line in [decisions](../../decisions.md) (2026-11-11)
- [x] Each changed call made in `migration_v54.sql` (with `node tools/release/xp.js` and `rls.js` passing) or its note
- [x] This note moved to `done/` with its Outcome

## Log

- 2026-11-11: Sam on call 14: the idea "disappears completely". Sam OK'd a short separate session for both v54 changes.
- 2026-11-11: Sam answered: yes to 1-11, 13 and 15; **12: don't allow people to turn visiting off**; **14: no** (what instead
  still to ask); **16: Heme & Endo Exam 2 first**. Recorded in decisions. Still to do: take the opt-out out of
  `migration_v54.sql` (`set_visiting`, `pet_visit_off`, `visiting` in `get_my_shop`, Link my devices' move of it) with
  `xp.js`, `rls.js` and `rls-expectations.json` updated and passing, and [game-server](../../reference/game-server.md)'s Visiting
  section; and make an author's idea delete remove the row and its votes (and update `xp.js`'s idea-board checks). It can ride with any later phase 5 or phase 4 session.
- 2026-11-11 (Claude Code): written from the game-server note, the shop, idea board and release notes.
- 2026-11-11 (Claude Code, its own short session): both `migration_v54.sql` changes made, not applied (see the Outcome).

## Outcome

All 16 calls answered by Sam on 2026-11-11 and recorded in [decisions](../../decisions.md). The two that changed something
are made in `migration_v54.sql`, which is still unapplied and still listed in `supabase/pending-migrations.txt` (it goes in
at [the release](../2026-11-06-redesign-release.md)):

- **No opt-out from visiting.** `set_visiting`, the `pet_visit_off` table, `visiting` in `get_my_shop`, Link my devices'
  move of the choice and `sh_visit_link` are gone; the four `_v2` boards call `sh_visit_key` directly, so every row has a
  key, and `get_place` opens anyone a board lists. `rls-expectations.json` (`anonNone`: `visit_secret`; `anonNoRun`:
  `sh_visit_key`) and `tools/release/rls-audit.sql` list what is left. The design page's rank board lost its "Let classmates
  visit my place" switch and its "Visits off" row (Enamel Ninja has a place now).
- **An author's idea delete removes the idea completely.** `delete_my_idea` deletes the row; its votes, reports and Inbox
  notes go with it (`on delete cascade`), so it no longer counts toward the day's three or the 20 seconds. `hidden_by` no
  longer has a `self` value, and `admin_ideas` and `admin_set_idea` dropped their checks for it.

Checked on throwaway copies: `node tools/release/xp.js` (344 checks; the new ones: the delete leaves no row, vote, report or
note, a deleted idea frees the day's limit and the 20 seconds, no visiting switch exists, Link my devices moves a place),
`rls.js` (every board row has a key; C, on the arcade board only, can be visited), `admin-ops.js` and `retention.js` all
pass. `game-server`, `analytics-retention`, `event-taxonomy` and the idea board's note are updated.

Left for later: hidden ideas' 90 days is approved but not built (the weekly job would need it, and `ideas` has no time it
was hidden). The release note's step 7 still asks Sam about the calls, the prices and the 90 days: all three are answered.
