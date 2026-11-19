---
type: task
status: review
hub: site
created: 2026-11-19
requested-by: Sam
due: 
waiting-on: Sam's "merge", then migration_v75 applied
agent: Claude Code
pr: 
---

# Collections: your progress on every shop set, and a bonus for finishing one

## Goal

Sam, 2026-11-19: "in the timmy card i want there to be a button where you can view your collections of items bought in the
shop. holiday collections and other things. you can see your progress and all and completing a collection gives 1000 xp
and 1000 crowns as a bonus".

## Context

- How it works: [game-server](../reference/game-server.md) ("Collections (migration_v75)"); the calls on what counts as a
  collection: [decisions](../decisions.md) (2026-11-19).
- Rules: [earn-rates-stay-enjoyable](../rules/earn-rates-stay-enjoyable.md) (a new prize; the PR says what it does to the
  economy), [about-page](../rules/about-page.md), [learner-data-privacy](../rules/learner-data-privacy.md) (two new counted
  taps, [event-taxonomy](../reference/event-taxonomy.md)).
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
- [ ] After the merge: apply `migration_v75.sql` through the Supabase connector (it adds a column, 48 one-row updates and
  five functions, no backfill: seconds, safe in the day); then, in a small PR, append it to `supabase/schema.sql` and take
  its line out of `supabase/pending-migrations.txt`. Until it's applied the buttons show progress only (no Claim, no
  bonus), and the shop's banner doesn't appear
- [ ] Sam confirms the calls in [decisions](../decisions.md) (rank sets out, Halloween's gift pays nothing, the costumes
  count as one collection)

## Log

- 2026-11-19: written and built (Claude Code).

## Outcome

Built and tested on a branch; waiting on Sam's "merge" and the migration. See the PR.
