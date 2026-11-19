---
type: task
status: in-progress
hub: site
created: 2026-11-18
requested-by: Sam
due:
waiting-on:
agent:
pr: https://github.com/smcmurry6-source/study-hubs/pull/459
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

## Done when

- [x] Each of 1-5 measured on a throwaway copy, with the before and after in the PR. **Done** (the table above).
- [x] The ones worth doing shipped (each its own migration or widget change), the rest written here with why not.
  **Done for phase 1:** `migration_v76.sql` (ideas 1 and 2), `migration_v77.sql` with `widget/v3.js` (idea 3),
  `widget/v3.js` and `widget/dash.js` (idea 4); idea 5 isn't worth doing. What the measuring found and this PR doesn't
  do is the next boxes.
- [ ] A readout from a busy evening after: the share of database time per call again, and whether any saves failed.
  The first evening after the merge with a class studying (Heme & Endo Exam 3's eve, Thu 2026-11-19, if it is merged by
  then): the edge logs any time, `pg_stat_statements` at a quiet hour. The "before" to compare with is in the Log
  (2026-11-19, 4:10 am).

**Phase 2: found by the measuring, each needs more than a `create or replace` (apply after Fri 2026-11-20, 9:30 am, at night):**

- [ ] **The awards summed once, not on every answer.** After v76 the largest part of a heavy student's answer is
  `sh_wallet` summing all their awards for the balance (1.7 of 4.4 ms at 9,000 awards; 0.6 ms at 3,000). A small table
  of running totals per visitor and kind, kept by a trigger on `xp_awards` (inserts, Link my devices' rebuild, deletes),
  makes it one row. A new table and a backfill of about 300,000 rows.
- [ ] **Drop `activity_visits_last_idx`** (idea 5's finding): every ping's update of the visit then stays on its page.
  Check the admin page's visitor summary (`where v.last_at >= since`) on a copy without it first; then rewrite the
  table once at night (`vacuum full public.activity_visits`), since it will have grown.
- [x] **The class's numbers on each card** (`question_stats` and `question_choices`, `widget/v3.js`): 20.6% of every
  request and another 14.6% of preflights, two reads a card. (Only 0.5% of the database's time, live: the gain is in
  requests, so it matters when the request limit or the connection count is what's tight.) The answer's reply could carry them (the save has just
  written both rows), or one call could read both. **Done, one call for both** (2026-11-19, phase 2, `migration_v79.sql`'s
  `get_class_numbers` with `widget/v3.js`): one request a card where there were two, the same rows, the same database
  time (0.08 ms either way for a card). Not in the answer's reply, which package 4 (the answer save) was working on at
  the same time (Sam's order). A database without the call gets the two reads, and the page doesn't ask again.
- [x] **The page's three analytics batches as one call** (`record_qh`, `record_clicks`, `record_events`: 14.8% of
  requests together): one flush, one call. **Done in the hubs** (phase 2: `migration_v79.sql`'s `record_analytics`,
  `widget/v3.js`'s `shAnalytics.send`, `widget/qhealth.js`; `widget/clicks.js` is unchanged and sends through a client
  `v3.js` gives it that hands its two calls to the batch): when one batch is due, the others go with it, in one call that
  hands each to its own function (the same rows: `tools/release/xp.js`); 1.6 ms of database time either way. A page
  that is leaving sends with keepalive, the three calls until the device has seen the new one work. **The dashboard still
  makes its two calls** (clicks, events): its page budget (`tools/release/budgets.json`, 345 KB) was at 345.4 KB on `main`,
  with no room for the code (the next box but one).
- [x] **The bootstrap** (31 / 18 / 12 ms on the copy after v76, 445 ms at the median live): the shop's picks of the day
  are worked out again for every visitor (about 5 ms; the same for everyone all day), `get_my_answers` builds up to
  5,000 rows of JSON (4-11 ms), and a visitor without a chosen name has their class name checked against everyone's
  (3.6 ms). **Done** (phase 2, `migration_v79.sql`): 38.7 / 26.9 / 19.4 → **22.5 / 13.8 / 10.2 ms** (heavy / middling /
  light, on phase 2's copy), the dashboard's 22.0 → 10.8 ms. The shop's day is kept in `shop_days` (2.1 → 0.04 ms;
  `get_my_shop` 11.3 / 5.9 / 5.7 → 4.7 / 3.7 / 4.7 ms), the v2 bootstrap no longer works out v1's rank, Timmy's days and
  Inbox only to replace them, the class name is a lookup on an index of its base (5-6.5 → 0.03-0.14 ms; 50 names on a
  board 15.9 → 11.1 ms) and `get_my_answers` is PL/pgSQL with its JSON built once (11.7 → 8.8 ms for 8,000 answers).
  Every value is what it was (below). Left: the answers themselves, the next box.
- [ ] **Apply `migration_v79.sql`** (phase 2: the class's numbers, the analytics, the bootstrap): at night (1 to 5 am
  Central), not before Heme & Endo Exam 3 is over (Fri 2026-11-20, 9:30 am; Sam). Fetch `main` first and check that
  nothing since has replaced `sh_shop_day`, `get_widget_bootstrap_v2`, `get_my_answers` or `anon_name`; md5-check their
  live bodies against `supabase/schema.sql`'s before, and the migration's after; check that pg_cron took the
  `sh-shop-days` job and `shop_days` holds today and tomorrow; then `get_class_numbers` and `record_analytics` through the
  API as a visitor. Append it to `supabase/schema.sql`, take its line out of `supabase/pending-migrations.txt`. Until it
  is applied, the pages ask for the two new calls once a page load and use the old ones (a 404 each).
- [ ] **The bootstrap's answers** (left by phase 2): `get_my_answers` is still most of a heavy student's bootstrap (8.8 of
  22.5 ms at 8,000 answers; 0.6 ms at 500) and is read again every 3 minutes a hub is open. The device could send the time
  of the newest answer it holds and get only those after it. `get_pet_days_v2` is the next (about 3 ms for the heaviest).
- [ ] **`answer_xp` is written twice an answer** (the row, then its reply onto it): one insert at the end would halve
  that table's writes and dead rows. It moves the insert past the speed limit's count, which reads the row, so it needs
  care.
- [ ] **`xp_seen`'s size**: 52 MB for about 177,000 rows (2026-11-19; the second biggest table after
  `personal_answers`, 76 MB), found by the ping table's rewrite ([database-load](2026-11-18-database-load.md), its Log). Its
  rows are four short columns, so most of it is likely the primary key's index and space left by Link my devices'
  rebuilds: look at the table's and the index's sizes apart before deciding on a rewrite.
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
- [ ] **Room in the dashboard's page budget** (found by phase 2): the dashboard was at 345.4 of its 345 KB on `main`
  (2026-11-19, `tools/release/perf.js`), so a few hundred bytes more in `widget/rest.bundle.js` fail "Release tests".
  `widget/ranks.js`'s hub widget (`mount()`, about 360 lines: the rank card, the trophy case in Stats, Link my devices)
  goes to the dashboard in that bundle and never runs there; moving it to a file only hubs load (`hub-rest.bundle.js`)
  would free several KB. Then the dashboard's clicks and events can go in one `record_analytics` call too (phase 2
  left them as two calls for that reason).

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

- 2026-11-19, phase 2, fewer calls from the page (Claude Code, Sam's package, [#459](https://github.com/smcmurry6-source/study-hubs/pull/459)): `migration_v79.sql` with `widget/v3.js`,
  `widget/qhealth.js`, a two-line hook in `widget/ranks.js` and the trophy signal in `widget/eggs.js`. (A first version
  changed `widget/clicks.js`, `widget/pet.js` and more of `ranks.js`, 1.2 KB more for the dashboard: "Release tests"
  failed its 345 KB budget at 347 KB, so that code moved to `v3.js`, which only hubs load: 40 bytes more for the dashboard.)
  Measured on a new throwaway copy of `supabase/schema.sql` with a made-up class (2,123 visitors, 2,246 visitor-hub
  answer histories), the medians of many calls: the numbers in the four boxes above. Checked identical, old against new,
  on that copy: the shop over every day of 2026-2027, the class name of every visitor, every answer history, the
  bootstrap for 508 visitor and hub pairs, the class's numbers against the two reads, the analytics rows from one call
  against three, and the stored shop cleared by a change to `shop_items`; the expression index keeps the name's updates
  on their page (300 of 300). `tools/release/xp.js` (627 checks), `rls.js`, `admin-ops.js`, `retention.js` and `timmy.js`
  pass with v79 pending; `tools/ci/quiet.js` checks the page side. Not applied live: the box above
  ([#459](https://github.com/smcmurry6-source/study-hubs/pull/459); phase 1 was #444).

## Outcome

So far (the task stays open for the boxes still unticked): phase 1's `migration_v76.sql` and `migration_v77.sql` are live;
phase 2's fewer calls from the page (the four boxes ticked 2026-11-19) are `migration_v79.sql`, waiting to be applied at
night after Fri 2026-11-20, 9:30 am, and page changes that work with or without it.

Related: [database-load](2026-11-18-database-load.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[game-server](../reference/game-server.md) · [decisions](../decisions.md) ·
[run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md)
