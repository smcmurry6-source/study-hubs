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
- 2026-11-11 (Claude Code): both changes made in `migration_v54.sql` (still unapplied), with the tests and notes.

## Outcome

Sam answered every call on 2026-11-11 ([decisions](../../decisions.md)). The two that changed are made in
`migration_v54.sql`, which is still unapplied and waits for [the release](../2026-11-06-redesign-release.md):

- **Visiting can't be turned off.** `set_visiting`, the `pet_visit_off` table, `visiting` in `get_my_shop` and Link my
  devices' move of the switch are gone; `sh_visit_link` gives every board row its key, and `get_place` opens anyone a
  board lists. The design page's "Let classmates visit my place" switch and its "Visits off" row came out too.
- **An author's idea delete removes the idea completely.** `delete_my_idea` deletes the row, and its votes, reports and
  Inbox notes go with it (`on delete cascade`), so it no longer counts toward the day's three or the 20 seconds. The
  unused `'self'` value of `ideas.hidden_by` and the admin functions' checks for it are gone.

Tests: `tools/release/xp.js` (344 checks: no switch, the keys after Link my devices, the complete delete, the limits after
it, a shipped idea's Inbox notes leaving with it), `rls.js` with `rls-expectations.json` (`anonNone` is `visit_secret`
alone; every board row carries a key; C's place opens once C is on a board) and `rls-audit.sql`; `admin-ops.js` and
`retention.js` still pass with v54 in place. Notes: [game-server](../../reference/game-server.md),
[analytics-retention](../../reference/analytics-retention.md) (also records the 90 days for hidden ideas, not yet written
into the weekly job), the [idea board](../2026-11-06-idea-board.md) and [Timmy's place](../2026-11-06-redesign-timmys-place.md).
`supabase/rollback-v54.sql` is unchanged: it undid the version applied on 2026-11-10, switch included.
