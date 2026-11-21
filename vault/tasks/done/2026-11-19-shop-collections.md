---
type: task
status: done
hub: site
created: 2026-11-19
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/437
---

# Collections: your progress on every shop set, and a bonus for finishing one

## Goal

Sam, 2026-11-19: "in the timmy card i want there to be a button where you can view your collections of items bought in the
shop. holiday collections and other things. you can see your progress and all and completing a collection gives 1000 xp
and 1000 crowns as a bonus".

## Context

- How it works: [game-server](../../reference/game-server.md) ("Collections (migration_v75)"); the calls on what counts as a
  collection: [decisions](../../decisions.md) (2026-11-19).
- Rules: [earn-rates-stay-enjoyable](../../rules/earn-rates-stay-enjoyable.md) (a new prize; the PR says what it does to the
  economy), [about-page](../../rules/about-page.md), [learner-data-privacy](../../rules/learner-data-privacy.md) (two new counted
  taps, [event-taxonomy](../../reference/event-taxonomy.md)).
- Code: `migration_v75.sql`; `widget/place.js` + `place.css` (the view, `openCollections`), `widget/shop.js` + `shop.css`
  (pays when a purchase finishes one), `widget/dash.js` + `dash.css` (the You card's button), `widget/hub-timmy.js` (More →
  Timmy's place), `widget/v3.js` (`PRIZES.collection`); tests in `tools/release/xp.js` (14d) and `tools/ci/smoke.js`.

## Done when

- [x] A Collections button in Timmy's place (by Customize and Shop, with how many are finished), on the dashboard's You
  card and in a hub's More → Timmy's place
- [x] The view: 14 season sets, 6 year-round collections and the rare costumes, each with its bar, its pieces (owned in
  color with a tick, the rest gray with their price) and when it's in the shop; drawings fetched only near the screen
- [x] Finishing one pays 1,000 XP and 1,000 crowns once (server-checked, `collection:<k>`), from the shop at the last
  piece or a Claim button; Halloween's gift set pays nothing
- [x] `node tools/release/xp.js`, `rls.js`, the fast checks and the smoke test pass; screenshots to Sam
- [x] About page, game-server, decisions, event-taxonomy, analytics-retention, DEPLOY_NOTES, changelog line
- [x] After the merge: apply `migration_v75.sql` through the Supabase connector (a column, 48 one-row updates of the catalog,
  five functions and xp_awards' list of kinds widened under a 3 s lock limit, left `not valid`: no backfill and no table
  scan, so any hour, [run-sql-on-the-live-database](../../how-to/run-sql-on-the-live-database.md); if the lock limit trips,
  apply it again); then, in a small PR, append it to `supabase/schema.sql` and take
  its line out of `supabase/pending-migrations.txt`. Until it's applied the buttons show progress only (no Claim, no
  bonus), and the shop's banner doesn't appear
- [x] Sam confirms the calls in [decisions](../../decisions.md) (rank sets out, Halloween's gift pays nothing, the costumes
  count as one collection)

## Log

- 2026-11-19: written and built (Claude Code); [#437](https://github.com/smcmurry6-source/study-hubs/pull/437) opened.
- 2026-11-19: Sam said "merge"; #437 merged with CI green. `migration_v75.sql` applied through the connector right after
  (the six function bodies md5-checked against the file; 48 catalog rows in six collections of 8; 21 collections for a
  made-up visitor id, Halloween's not paying), then appended to `supabase/schema.sql` and taken off the pending list in
  a small PR ([#439](https://github.com/smcmurry6-source/study-hubs/pull/439)).
- 2026-11-19: Sam: "im ok with your calls. merge". Done.

## Outcome

Shipped in [#437](https://github.com/smcmurry6-source/study-hubs/pull/437) and live with `migration_v75.sql` (2026-11-19):
the Collections button in Timmy's place, on the dashboard's You card and in a hub's More; the view of all 21
collections; 1,000 XP and 1,000 crowns once for each finished one, from the shop or a Claim button. Sam OK'd the calls in
[decisions](../../decisions.md) (rank sets out, Halloween's gift pays nothing, the costumes one collection).
