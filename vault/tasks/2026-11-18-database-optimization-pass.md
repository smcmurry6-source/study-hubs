---
type: task
status: in-progress
hub: site
created: 2026-11-18
requested-by: Sam
due:
waiting-on:
agent:
pr: https://github.com/smcmurry6-source/study-hubs/pull/444, https://github.com/smcmurry6-source/study-hubs/pull/457, https://github.com/smcmurry6-source/study-hubs/pull/459
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

## What was measured (2026-11-19, phase 1)

On a throwaway copy of `supabase/schema.sql` (`tools/release/pg.js`) with a made-up class of 200: 188,000 answers and
215,000 awards saved through the real `sh_answer`, 33,000 hourly rows and three days of pings; `pg_stat_statements` with
`track = all`, so every statement inside a call is timed. Three made-up students: heavy (8,000 answers), middling (3,300),
light (500). Milliseconds a call; the copy is many times faster than the live shared CPU, so read the ratios.

| Idea | Before | After | What was done |
|---|---|---|---|
| **1. The answer save** | 6.9 / 5.7 / 4.8 ms (heavy / middling / light) | 4.4 / 3.6 / 2.4 ms | **Shipped: `migration_v76.sql`.** 60-66% of every save was the crown balance in the reply, and most of that was planning: a SQL-language function that can't be inlined (ours all have their own `search_path`) is planned again on every call, and the balance called `sh_rank` three times, `sh_tier`, `sh_step`, `sh_step_floor`, `sh_visitor_xp` and `sh_boost_json` each answer (about 2.1 ms, the same for every student). 18 small functions are now PL/pgSQL (planned once a connection), with the same bodies. And the medal check (1.3-2 ms, on about one answer in three) is skipped while the student has answered under half the hub's bank right ever (`xp_seen`), when no medal can be due |
| 1, the same change elsewhere | card rating 1.16 ms; question-health batch of 10: 1.90 ms | 0.90 ms; 0.75 ms | `qh_int` ran as a planned SQL call nine times an item; `sh_key`, `sh_xp_mult`, `sh_boost_json` on every rating |
| **2. Page-load reads** | `get_rank_profile_v2` 1.4 ms; `get_hub_mastery` 7.9 / 2.5 / 0.8 ms; bootstrap 40 / 21 / 16 ms; `get_my_shop` 10 / 9 / 9 ms | 0.43 ms; 3.4 / 2.1 / 1.2 ms; 31 / 18 / 12 ms; 7 / 7 / 5 ms | **Shipped in v76.** The reads are already one call (the bootstrap carries the rank, mastery, shop, Timmy's days, answers and pins). What repeats is the rank and mastery, read again after every tenth answer (`widget/ranks.js`: 725 calls each in four hours, against 309 bootstraps): `get_hub_mastery` now looks up each question's latest answer instead of sorting every answer. Not done: the bootstrap is still 5 to 8 answers' worth (below) |
| **3. Pings** | 3 pings as 3 calls: 1.0 ms | as 1 call: 0.47 ms | **Shipped: `migration_v77.sql` and `widget/v3.js`.** A page holds its pings and sends them once a minute in one call (`record_activity_pings`), each with its age, so every row, hour and total is what it was: 58% fewer ping calls (pings were 18% of every request). A visit's first ping and a hidden page's last ones go at once |
| **4. The changelog read** | one read every 4 minutes a page (5% of requests) | one every 30 minutes a device | **Shipped: `widget/v3.js`, `widget/dash.js`.** The newest row's time is kept on the device and shared by every tab, hub and the dashboard; the "updated" banner comes at most half an hour after a deploy, not four minutes. Half an hour, not the hour first written here: it costs 80 more requests an hour for the whole class |
| **5. Fillfactor** | same-page (HOT) updates on the copy: 100% for `question_stats`, `question_choices`, `xp_visitors`, `xp_days`, `xp_runs`, `correct_streaks`, `activity_hourly`; 77% for `answer_xp` | 100% for `answer_xp` at fillfactor 80; no change in time or WAL | **Not worth it** (the live numbers agree: the Log). The pages already leave room: a dead row's space is reused on the next visit to its page. **But `activity_visits` was 0%**: every ping moves `last_at`, which has its own index (`activity_visits_last_idx`), so no update can stay on its page, and the table grows to 30 times its rows (7.5 MB for 320 visits on the copy). Without that index: 100%, 24% less WAL and 17% less time for the pings. Its one reader is the admin page's visitor summary. Dropping an index is not a `create or replace`, so it waits (below) |

Every answer-path change was checked the same way: 2,400 answers and 343 card ratings by six made-up students (three new
ones winning and losing medals in a small bank, boosts running, double taps, replayed requests) on two copies, one with
the migrations: identical replies and identical rows afterwards in every table an answer writes; and every converted
function compared with the old one over its whole input. The five database suites pass with both migrations pending.

**The live side, the evening before the Perio final** (edge logs, 2026-11-19 00:00-04:00 UTC, 6 to 10 pm Central, 70,000
requests): `record_activity_ping` 18.3%, `record_answer_v2` 11.1%, `question_stats` and `question_choices` 10.3% each
with 7.3% each of preflights, `record_qh` 6.8%, the changelog 5.1%, `record_clicks` 4.9%, `record_events` 3.1%,
`get_rank_profile_v2` and `get_hub_mastery` 1% each. A call that does nothing takes about 95 ms end to end at the median;
an answer 125 ms (95th percentile 870 ms), `get_hub_mastery` 242 ms, the bootstrap 445 ms.

## What was measured (2026-11-19, phase 2)

Live first, from the catalog (cheap, any hour; 9:40 am Central): `xp_awards` 62,894 rows for 91 students, the most 2,753
(the next seven 2,335 to 1,682), 696 student-and-kind pairs, not the 300,000 this note guessed; `answer_xp` 22,227 inserts
and 22,006 updates since the restart of 2026-11-18; `activity_visits` 8,788 visits, a 1.4 MB table with 6.1 MB of indexes
(4.7 MB of it `activity_visits_last_idx`), 39,443 updates, 6.6% in place; `xp_seen` 180,099 rows, a 29.9 MB table and a
24.8 MB primary key, 18 dead rows.
Then on two throwaway copies, **`node tools/release/bench-answers.js`**: the same made-up class (37,630 calls:
a heavy student with 7,950 awards, a middling one, a light one and 40 more, with mocks, arcade games, cards, replays and
double taps) on `supabase/schema.sql` (A) and with the pending migrations (B). Identical replies to all 37,630 calls,
identical wallets, identical rows in all 75 tables, every running total equal to its awards; then 200 more answers by each
of the three, A and B in turn, three rounds (ms an answer, its own transaction, psql included; the statements inside
them from a `--statements` run before v78 was in):

| Idea | Before (A) | After (B) | What was done |
|---|---|---|---|
| **The awards summed once** (with the next row) | heavy 3.81, middling 2.86, light 2.53; the wallet's sum 0.86 ms of every answer | 2.19, 2.12, 2.01; the sum 0.03 ms | **`migration_v79.sql`**: `xp_award_totals`, kept by statement-level triggers on `xp_awards` (an award insert 0.035 → 0.061 ms, about 60 bytes more log); the fill and the triggers in one transaction under a lock on `xp_awards`, so no award falls between them. A light student gains least (their sum was short) and loses nothing: 1.82-2.13 against 2.37-2.71 in the rounds. Link my devices' rebuild of the heavy student: 280-350 ms either way, the totals exact after |
| **`answer_xp` once an answer** | an insert and an update: 0.085 ms, 1,219 kB of log for 1,800 answers | one insert: 0.048 ms, 964 kB | **`migration_v80.sql`**: the row is inserted at the end with the reply. One row version an answer instead of two (no dead row left for vacuum) |
| **`activity_visits_last_idx`** | 300 visits pinged 60 times, a ping a transaction: 0% of the updates in place; the table 512 kB, its indexes 576 kB; 21 MB of log | 99.9% in place; 24 kB and 48 kB; 16 MB of log | **`migration_v81.sql`** drops it. The admin page's visitor summary without it, at the live size (9,000 visits): 30 days 3.4 ms either way (it reads by the visitor index), 1 day 0.4 → 2.1 ms (a scan of 1.4 MB), the same numbers |
| **`xp_seen`'s 52 MB** | live: 29.9 MB table + 24.8 MB index for 180,099 rows | the same rows fresh at the live widths: about 16 + 15 MB; `cluster` 0.35 s for 197,000 on the copy | **Rewrite it once, at night**: about 24 MB back. The table is twice what its rows need, most likely from the rebuilds of everyone that migrations ran (`sh_xp_rebuild` over every visitor, in v54 and v68: each deletes and copies every row). Link my devices' rebuilds bring some back, mostly to the index (60 rebuilds of a student on the copy: the table 17 → 19 MB, the index 16 → 23 MB; live, 65,125 rows deleted and added again in the 18 hours after the restart) |

On the copy, analyze after loading made-up rows: until the first `vacuum analyze` the medal check's plan read 30 times as
much (29 ms a check, not 1), which made the first timings meaningless. Live tables are analyzed by autovacuum.

## Done when

- [x] Each of 1-5 measured on a throwaway copy, with the before and after in the PR. **Done** (the table above).
- [x] The ones worth doing shipped (each its own migration or widget change), the rest written here with why not.
  **Done for phase 1:** `migration_v76.sql` (ideas 1 and 2), `migration_v77.sql` with `widget/v3.js` (idea 3),
  `widget/v3.js` and `widget/dash.js` (idea 4); idea 5 isn't worth doing. What the measuring found and this PR doesn't
  do is the next boxes.
- [ ] A readout from a busy evening after: the share of database time per call again, and whether any saves failed.
  The first evening after the merge with a class studying (Heme & Endo Exam 3's eve, Thu 2026-11-19, if it is merged by
  then): the edge logs any time, `pg_stat_statements` at a quiet hour. The "before" to compare with is in the Log
  (2026-11-19, 4:10 am). Phase 2's `migration_v79.sql` to `v82` went live at 12:10-12:13 pm Central that day (the Log), so
  that evening's numbers have them in too.

**Phase 2: found by the measuring, each needs more than a `create or replace` (apply after Fri 2026-11-20, 9:30 am, at night):**

- [x] **The awards summed once, not on every answer.** After v76 the largest part of a heavy student's answer is
  `sh_wallet` summing all their awards for the balance (1.7 of 4.4 ms at 9,000 awards; 0.6 ms at 3,000). A small table
  of running totals per visitor and kind, kept by a trigger on `xp_awards` (inserts, Link my devices' rebuild, deletes),
  makes it one row. A new table and a backfill of about 300,000 rows.
  **Done: `migration_v79.sql`** (phase 2's table above). The backfill is 63,000 awards (about 700 totals), so it is part of
  the migration: one transaction, under a 3 s `lock_timeout`, that fills the totals and adds the triggers while
  `xp_awards` takes no writes. Applied live: the box below.
- [x] **Drop `activity_visits_last_idx`** (idea 5's finding): every ping's update of the visit then stays on its page.
  Check the admin page's visitor summary (`where v.last_at >= since`) on a copy without it first; then rewrite the
  table once at night (`vacuum full public.activity_visits`), since it will have grown.
  **Done: checked and `migration_v81.sql`** (phase 2's table above: the summary's numbers the same, 0.4 to 2.1 ms at most).
  The rewrite is `cluster ... using activity_visits_pkey` (unlike `vacuum full`, it runs inside the connector's call). Applied
  live and rewritten: the box below. Since `migration_v83.sql` that summary is worked out ahead
  (`sh_visitor_summary`, at most every 15 minutes while the admin page is in use), so a slower scan without the index costs
  little ([database-load](2026-11-18-database-load.md)).
- [x] **The class's numbers on each card** (`question_stats` and `question_choices`, `widget/v3.js`): 20.6% of every
  request and another 14.6% of preflights, two reads a card. (Only 0.5% of the database's time, live: the gain is in
  requests, so it matters when the request limit or the connection count is what's tight.) The answer's reply could carry them (the save has just
  written both rows), or one call could read both. **Done, one call for both** (2026-11-19, phase 2, `migration_v82.sql`'s
  `get_class_numbers` with `widget/v3.js`): one request a card where there were two, the same rows, the same database
  time (0.08 ms either way for a card). Not in the answer's reply, which package 4 (the answer save) was working on at
  the same time (Sam's order). A database without the call gets the two reads, and the page doesn't ask again.
- [x] **The page's three analytics batches as one call** (`record_qh`, `record_clicks`, `record_events`: 14.8% of
  requests together): one flush, one call. **Done in the hubs** (phase 2: `migration_v82.sql`'s `record_analytics`,
  `widget/v3.js`'s `shAnalytics.send`, `widget/qhealth.js`; `widget/clicks.js` is unchanged and sends through a client
  `v3.js` gives it that hands its two calls to the batch): when one batch is due, the others go with it, in one call that
  hands each to its own function (the same rows: `tools/release/xp.js`); 1.6 ms of database time either way. A page
  that is leaving sends with keepalive, the three calls until the device has seen the new one work. **The dashboard still
  makes its two calls** (clicks, events): its page budget (`tools/release/budgets.json`, 345 KB) was at 345.4 KB on `main`,
  with no room for the code (the next box but one).
- [x] **The bootstrap** (31 / 18 / 12 ms on the copy after v76, 445 ms at the median live): the shop's picks of the day
  are worked out again for every visitor (about 5 ms; the same for everyone all day), `get_my_answers` builds up to
  5,000 rows of JSON (4-11 ms), and a visitor without a chosen name has their class name checked against everyone's
  (3.6 ms). **Done** (phase 2, `migration_v82.sql`): 38.7 / 26.9 / 19.4 → **22.5 / 13.8 / 10.2 ms** (heavy / middling /
  light, on phase 2's copy), the dashboard's 22.0 → 10.8 ms. The shop's day is kept in `shop_days` (2.1 → 0.04 ms;
  `get_my_shop` 11.3 / 5.9 / 5.7 → 4.7 / 3.7 / 4.7 ms), the v2 bootstrap no longer works out v1's rank, Timmy's days and
  Inbox only to replace them, the class name is a lookup on an index of its base (5-6.5 → 0.03-0.14 ms; 50 names on a
  board 15.9 → 11.1 ms) and `get_my_answers` is PL/pgSQL with its JSON built once (11.7 → 8.8 ms for 8,000 answers).
  Every value is what it was (below). Left: the answers themselves, the next box.
- [x] **Apply `migration_v82.sql`** (phase 2: the class's numbers, the analytics, the bootstrap): at night (1 to 5 am
  Central), not before Heme & Endo Exam 3 is over (Fri 2026-11-20, 9:30 am; Sam), after #457's v79 to v81 (the box
  "Phase 2 applied live" below; the same night is fine, one call at a time, or a later one). Fetch `main` first and check that
  nothing since has replaced `sh_shop_day`, `get_widget_bootstrap_v2`, `get_my_answers` or `anon_name`; md5-check their
  live bodies against `supabase/schema.sql`'s before, and the migration's after; check that pg_cron took the
  `sh-shop-days` job and `shop_days` holds today and tomorrow; then `get_class_numbers` and `record_analytics` through the
  API as a visitor. Append it to `supabase/schema.sql`, take its line out of `supabase/pending-migrations.txt`. Until it
  is applied, the pages ask for the two new calls once a page load and use the old ones (a 404 each).
  **Done** 2026-11-19, 12:13 pm Central, ahead of the exam at Sam's word ("the hubs are quiet right now. go ahead and run the
  migrations you were waiting on"): the Log.
- [ ] **The bootstrap's answers** (left by phase 2): `get_my_answers` is still most of a heavy student's bootstrap (8.8 of
  22.5 ms at 8,000 answers; 0.6 ms at 500) and is read again every 3 minutes a hub is open. The device could send the time
  of the newest answer it holds and get only those after it. `get_pet_days_v2` is the next (about 3 ms for the heaviest).
- [x] **`answer_xp` is written twice an answer** (the row, then its reply onto it): one insert at the end would halve
  that table's writes and dead rows. It moves the insert past the speed limit's count, which reads the row, so it needs
  care. **Done: `migration_v80.sql`.** The count joins the row only to leave out mock answers and runs only outside a mock,
  so it counts the answer either way (the file's header); the same replies and rows on the copy. Applied live: the box below.
- [x] **`xp_seen`'s size**: 52 MB for about 177,000 rows (2026-11-19; the second biggest table after
  `personal_answers`, 76 MB), found by the ping table's rewrite ([database-load](2026-11-18-database-load.md), its Log). Its
  rows are four short columns, so most of it is likely the primary key's index and space left by Link my devices'
  rebuilds: look at the table's and the index's sizes apart before deciding on a rewrite.
  **Looked at:** the table 29.9 MB and the index 24.8 MB, both about twice what the rows need. **Decided: rewrite it once at
  night** (`cluster public.xp_seen using xp_seen_pkey`), about 24 MB back (phase 2's table above). Done: the box below.
- [x] **The rank and mastery after every tenth answer** (`widget/ranks.js`): on the game layer the answer's reply
  already carries the XP total; the page could work out the hub's mastery from the answers it holds. **Done** (phase 2,
  no server part: `widget/v3.js`'s `shRankLocal`, which `widget/ranks.js` asks first; in `v3.js` because `ranks.js` also
  goes to the dashboard, whose page budget has no room): the XP comes from the replies and this hub's mastery from each
  question's last try (the bootstrap's answers, then every reply), so ten answers make no read. It still reads both when
  something it can't count may have changed: a new trophy sent from the page (`sh:trophy-sent`: the eggs, the bowling
  egg), a medal in a reply, the streak of days paying or a new day, 100 or 1,000 answers, a run that could reach 25 or
  100, a mock's or a game's answers, a question it has no last try for, a read short of the answers paid, and at least
  every 50 answers; with Stats open, on the old pages and without the bootstrap, as before. Timmy's three trophies and
  the arcade's 25 games send no signal: they show at the next read (at most 50 answers, Stats, or the next page).
  `tools/ci/quiet.js` checks both ways.
- [x] **Phase 2 applied live, at night after Heme & Endo Exam 3** (set for Sat 2026-11-21, 1:30 am Central, by the session of
  [#457](https://github.com/smcmurry6-source/study-hubs/pull/457)). First fetch `main`: if another migration took 79-81,
  renumber; a newer `sh_answer` than `migration_v78.sql`'s (applied 2026-11-19, which v80 is built on) means v80 is rebuilt on
  it (the same two changes, marked "v80") and tested again. Then one call at a time, nothing in parallel: `migration_v79.sql` (apply_migration) and the check at its end (no rows); v80;
  `drop index concurrently if exists public.activity_visits_last_idx;` alone; `cluster public.activity_visits using
  activity_visits_pkey;` and `cluster public.xp_seen using xp_seen_pkey;`, each under `set local lock_timeout = '3s'`, then
  `analyze` of both; the live bodies md5-checked against the files; the sizes after. Then v79-v81 appended to
  `supabase/schema.sql` and out of `supabase/pending-migrations.txt`, in the same PR.
  **Done** 2026-11-19, 12:10-12:13 pm Central, with v82, at Sam's word (the Log); the Saturday run was turned off.
- [x] **Room in the dashboard's page budget** (found by phase 2): the dashboard was at 345.4 of its 345 KB on `main`
  (2026-11-19, `tools/release/perf.js`), so a few hundred bytes more in `widget/rest.bundle.js` fail "Release tests".
  `widget/ranks.js`'s hub widget (`mount()`, about 360 lines: the rank card, the trophy case in Stats, Link my devices)
  goes to the dashboard in that bundle and never runs there; moving it to a file only hubs load (`hub-rest.bundle.js`)
  would free several KB. Then the dashboard's clicks and events can go in one `record_analytics` call too (phase 2
  left them as two calls for that reason).
  **Done** 2026-11-19 (the dashboard package, PR #466): `mount()` is `widget/ranks-hub.js`, in `hub-rest.bundle.js`
  (`rest.bundle.js` 131.3 → 125.4 KB gzipped), and the dashboard's clicks and events go in one `record_analytics` call
  (`widget/dash.js`); the dashboard measures 340 of its 346 KB, the budget unchanged.

## Log

- 2026-11-18: written after the evening outage, with the numbers above.
- 2026-11-19, phase 1 (Claude Code): ideas 1-5 measured on a throwaway copy (the table above); `migration_v76.sql`,
  `migration_v77.sql`, the pings sent together and the changelog kept on the device written and tested
  ([#444](https://github.com/smcmurry6-source/study-hubs/pull/444)).
- 2026-11-19, about 4:10 am Central (the quiet hour): Sam: "Merge". Before merging, the live steps this PR still owed,
  one call at a time:
  - **`pg_stat_statements`, read once** (since the restart of 2026-11-18, 20:57 UTC: 13 hours with the evening before
    the Perio final in them, 3,795 s of statements; this is the "before"): `record_answer_v2` 47.4% of the database's
    time (16,964 calls, 106 ms each on average), `get_hub_mastery` 9.6% (1,546 calls, 236 ms), `get_widget_bootstrap_v2`
    6.3% (559, 425 ms), `record_qh` 6.2% (9,863, 24 ms), `record_activity_ping` 6.0% (27,521, 8 ms), `record_clicks` 3.8%,
    `record_card_v2` 3.1% (2,100, 56 ms), `record_events` 2.1%, `get_my_answers` 1.5%, `get_rank_profile_v2` 1.4%. The
    class's numbers on each card (`question_stats`, `question_choices`) are 0.5% of the database's time together (0.6 ms a
    read) though they are a fifth of the requests: what they cost is the request, not the query.
  - **Same-page (HOT) updates live, since the restart:** 100% for `xp_visitors`, `xp_days`, `xp_runs`, `correct_streaks`
    and `question_stats`, 99.6% `question_choices`, 99.4% `activity_hourly`, 93.4% `answer_xp`, and **8.6% for
    `activity_visits`** (29,797 updates): the copy's picture, so idea 5 stays "not worth it" and the index stays on the
    Phase 2 list.
  - **`migration_v76.sql` and `migration_v77.sql` applied** through the connector (`create or replace` only). The 19 live
    bodies matched `supabase/schema.sql`'s (md5) before, and the migrations' after; grants, `security definer` and
    `search_path` unchanged; `record_activity_pings` answers through the API as a visitor (204). Both are in
    `supabase/schema.sql` now. Read back on the class's most active students (six together): balances, time crowns,
    boosts, rank profiles and hub mastery all answer. The mastery read for the longest answer history: 395 ms the old
    way, 113 ms the new (both with the pages in memory; the first read after a quiet night was slower, as the old one
    was). Nobody was answering at that hour (a few pings every five minutes), so the saves themselves are the next
    evening's readout (the open box).
- 2026-11-19, morning (Claude Code, phase 2, [#457](https://github.com/smcmurry6-source/study-hubs/pull/457)): Sam: "Apply
  nothing live before Heme & Endo Exam 3 is over (Fri Nov 20, 9:30 am); the backfill and the table rewrite at night (1 to 5
  am Central), one statement at a time." Read live only the catalog (the sizes in phase 2's table) and the edge logs (8:00 to
  9:30 am Central, Perio's final day: 2,045 answer saves, 8 failed, a median of 133 ms and a 95th percentile of 1,168 ms;
  the page's pings now arrive as `record_activity_pings`, 1,682 calls, v77's). Everything else on throwaway copies:
  `migration_v79.sql` (the running totals), `migration_v80.sql` (`answer_xp` once), `migration_v81.sql` (the index), listed
  in `supabase/pending-migrations.txt`; `tools/release/bench-answers.js`, the A/B run of phase 2's table, for the next
  phase; `tools/release/xp.js` checks the totals against the sums after all its scenarios. The readout is set for 1:30 am
  tonight and the live steps for Saturday night (the boxes).

- 2026-11-19, phase 2, fewer calls from the page (Claude Code, Sam's package, [#459](https://github.com/smcmurry6-source/study-hubs/pull/459)): `migration_v82.sql` (written as v79, renumbered at the merge: #457 took v79 to v81) with `widget/v3.js`,
  `widget/qhealth.js`, a two-line hook in `widget/ranks.js` and the trophy signal in `widget/eggs.js`. (A first version
  changed `widget/clicks.js`, `widget/pet.js` and more of `ranks.js`, 1.2 KB more for the dashboard: "Release tests"
  failed its 345 KB budget at 347 KB, so that code moved to `v3.js`, which only hubs load: 40 bytes more for the dashboard.)
  Measured on a new throwaway copy of `supabase/schema.sql` with a made-up class (2,123 visitors, 2,246 visitor-hub
  answer histories), the medians of many calls: the numbers in the four boxes above. Checked identical, old against new,
  on that copy: the shop over every day of 2026-2027, the class name of every visitor, every answer history, the
  bootstrap for 508 visitor and hub pairs, the class's numbers against the two reads, the analytics rows from one call
  against three, and the stored shop cleared by a change to `shop_items`; the expression index keeps the name's updates
  on their page (300 of 300). `tools/release/xp.js` (627 checks), `rls.js`, `admin-ops.js`, `retention.js` and `timmy.js`
  pass with it pending (and again with #457's v79 to v81 ahead of it after the merge); `tools/ci/quiet.js` checks the page side. Not applied live: the box above
  ([#459](https://github.com/smcmurry6-source/study-hubs/pull/459); phase 1 was #444).

- 2026-11-19, 12:07-12:20 pm Central (Claude Code): Sam: "the hubs are quiet right now. go ahead and run the migrations you
  were waiting on" (the morning's call was nothing live before the exam; this one moved it up). The class was quiet: 4 people
  in the last 10 minutes, 2 answers. One call at a time through the connector:
  - **Before:** the live bodies of `sh_wallet`, `sh_answer`, `sh_shop_day`, `get_widget_bootstrap_v2`, `get_my_answers`,
    `anon_name` and `anon_name_base` matched `supabase/schema.sql`'s newest copies (md5); none of the new functions existed.
    The three most active students' crown balances read; the database 349 MB.
  - **`migration_v79.sql`** (apply_migration, 12:10): the check at its end found no mismatch (703 totals, the four triggers
    on `xp_awards`); the three balances read again, every field the same; `sh_wallet` and `sh_award_totals_step` match the
    file (md5).
  - **`migration_v80.sql`** (12:11): `sh_answer` matches the file, still `security definer` with its `search_path`, not
    callable by visitors.
  - **`migration_v81.sql`**: `drop index concurrently if exists public.activity_visits_last_idx;` alone; then `cluster
    public.activity_visits using activity_visits_pkey;` and `cluster public.xp_seen using xp_seen_pkey;`, each under
    `lock_timeout 3s`, and `analyze` of both. **`xp_seen` 29.2 + 24.2 MB → 15.9 + 14.8 MB** (180,369 rows),
    `activity_visits` 1.4 + 6.0 MB → 1.1 + 1.0 MB, **the database 349 → 323 MB**.
  - **`migration_v82.sql`** (12:13, with `lock_timeout 3s` added at the top): all nine bodies match the file (md5); pg_cron
    has `sh-shop-days` (`7 * * * *`) beside the retention job; `shop_days` holds today and tomorrow (29 rows each), and the
    stored shop equals the worked-out one for both days; `correct_streaks_anon_base` and the `shop_items` trigger are there.
    Through the API as a visitor: `get_class_numbers` 200, the same rows as the two old reads for two questions;
    `record_analytics` with empty batches 204 (nothing written); `sh_wallet` still 401.
  - **The edge logs, 12:00-12:15:** no request failed (no 5xx). Two answers were slow but saved (2.9 s in the minute
    `sh_answer` was replaced, 2.2 s for the first bootstrap after v82, each the first call planning a new body); answers
    after it a median of 146 ms; the pages switched to `get_class_numbers` and `record_analytics` within a minute.
  - The scheduled run for Saturday 1:30 am (phase 2's live steps) was turned off; tonight's 1:30 am readout still runs.
  - `supabase/schema.sql` has v79-v82 appended; `supabase/pending-migrations.txt` lists none.
- 2026-11-19, the dashboard package (Claude Code, PR #466): room in the dashboard's budget. `widget/ranks.js`'s hub widget
  (`mount()`) moved to `widget/ranks-hub.js`, which `widget/v3.js` loads after `ranks.js` on a hub only (from
  `hub-rest.bundle.js` on the engine, by name on an old single-file page); `ranks.js` hands it what it draws with as
  `shRanks._hub`. The dashboard's clicks and events now go in one `record_analytics` call, its fallback the two calls when
  the function is missing. `node tools/release/perf.js --page index.html`: 345.4 → 340 KB of 346; Perio 877 → 878 KB.

## Outcome

So far (the task stays open for the boxes still unticked): phase 1's `migration_v76.sql` and `migration_v77.sql` are live,
and so is phase 2: `migration_v79.sql` to `v82` (the awards summed once, `answer_xp` written once, the visits' index gone,
fewer calls from the page and a lighter bootstrap), applied 2026-11-19 at noon, with `xp_seen` and `activity_visits`
rewritten. Left: the evening readout and the bootstrap's answers (room in the dashboard's budget: done, PR #466).

Related: [database-load](2026-11-18-database-load.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[game-server](../reference/game-server.md) · [decisions](../decisions.md) ·
[run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md)
