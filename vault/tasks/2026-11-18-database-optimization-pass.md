---
type: task
status: open
hub: site
created: 2026-11-18
requested-by: Sam
due:
waiting-on:
agent:
pr:
---

# The database optimization pass: the same site for less of the Free plan's CPU

## Goal

Make the database do less work for the same pages, so a busy exam night fits the Free plan's shared CPU without a paid
plan. Rework only: nothing students see changes, and nothing is cut.

## Context

- Sam, 2026-11-18, after the evening outage ([database-load](2026-11-18-database-load.md)): "are there any other settings we
  can use that would help, or would it be worth doing a pass over with fable to see if the existing database could be
  optimized further. what things are necessary/could be reworked vs cut to optimize". Then: **"dont cut anything for now"**
  and "i dont want to upgrade the plan. stay free" ([decisions](../decisions.md)). Any model can do this pass; what matters
  is starting from the numbers below and measuring on a throwaway copy.
- The project is on Supabase's **Free plan**: shared CPU, 500 MB before read-only
  ([shared-infrastructure](../reference/shared-infrastructure.md)). Already done: `migration_v71` (two answer indexes),
  `migration_v72` (the answer save a quarter as costly), the pages' quiet spell (`widget/v3.js`, `window.shDb`), raw pings
  kept 3 days (`migration_v74`).
- **Where the database's time went**, `pg_stat_statements` from the restart (about 20:57 UTC) to about 21:30, 2026-11-18,
  the evening before the Perio final (the first minutes after the restart were slow for everything, so the means run high):

  | Call | Share of requests (edge logs) | Share of database time | Mean |
  |---|---|---|---|
  | `record_answer_v2` | 12% | **55%** | 360 ms |
  | `record_activity_ping` | 18% | 8% | 38 ms |
  | `record_qh` (question health) | 6% | 7% | 97 ms |
  | `record_card_v2` (flashcards) | 5% | 5% | 74 ms |
  | `get_hub_mastery` | 1% | 4% | 361 ms |
  | `record_clicks` | 5% | 4% | 74 ms |
  | `record_events` | 3.5% | 2% | 65 ms |
  | `get_my_answers` | 1% | 1.5% | 166 ms |
  | `get_widget_bootstrap_v2` | 0.5% | 1.4% | 519 ms |
  | `get_rank_profile_v2`, `get_exam_luck`, `get_my_shop`, `claim_ring_v2`, `get_pet_days` | 1-2% each | about 1% each | 115-520 ms |
  | `question_stats`, `question_choices` (REST reads on every card) | 35% together | under 1% each | |
  | the changelog read (the "Updated" label) | 5% | small | |

  On a throwaway copy the answer save takes 5-7 ms (`migration_v72`'s benchmark); on the live shared CPU about 150 ms at the
  median, so the CPU, not the plan of a query, sets most of it, and every statement an answer runs counts.

## What to look at (rework, no visible change)

1. **The answer save** (`sh_answer`, `migration_v72.sql`): which of its statements could move out of the answer, or run
   less often: the class's numbers (`question_stats` / `question_choices` updates), the per-question counts, the run of
   right answers, the medal check, the boost and crowns in every reply (`sh_crowns` works out the whole wallet). Measure
   each part with `tools/release/pg.js` (the way `migration_v72` was measured: a made-up heavy student).
2. **Page-load reads**: `get_widget_bootstrap_v2`, `get_hub_mastery`, `get_exam_luck`, `get_my_shop`, `get_pet_days`,
   `get_rank_profile_v2`: combine them into the bootstrap, or keep their answer on the device for a while.
3. **Pings**: one call a minute carrying the seconds it counted, instead of one every 25 s (half the calls; `activity_hourly`
   counts 25 s pings, so it would add the seconds instead).
4. **The changelog read**: once an hour per device (the service worker or `localStorage`), not every page.
5. **Table settings**: `fillfactor` (about 70-80) on the rows updated with every answer or ping (`activity_hourly`,
   `activity_visits`, `question_stats`, `question_choices`, `answer_xp`), so their updates stay on the same page and skip
   the indexes; it takes effect for new pages, and fully after a night-time rewrite.
6. **Cuts Sam said no to for now** (2026-11-18): who-tapped-what click reach (19 MB, 5% of requests) and question-health
   timing on every answer (28 MB, 7% of the time; sampling 1 in 3 was the idea). Don't do them without asking again.

## How

- Benchmark on a throwaway copy (`tools/release/pg.js`), never in a loop on the live database; read the live side from the
  edge logs and `pg_stat_statements` (cheap), at a quiet hour.
- A change to a function is a migration (copy the function from `main`'s newest copy of it), tested with
  `node tools/release/xp.js` (and `rls.js`); apply it live late at night, or any time when it is a `create or replace`
  with no backfill.
- Every change keeps what students see and earn exactly the same (the suites compare totals).

## Done when

- [ ] Each of 1-5 measured on a throwaway copy, with the before and after in the PR.
- [ ] The ones worth doing shipped (each its own migration or widget change), the rest written here with why not.
- [ ] A readout from a busy evening after: the share of database time per call again, and whether any saves failed.

## Log

- 2026-11-18: written after the evening outage, with the numbers above.

## Outcome

Related: [database-load](2026-11-18-database-load.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[game-server](../reference/game-server.md) · [decisions](../decisions.md)
