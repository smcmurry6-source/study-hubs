---
type: how-to
tags: [database, supabase, migrations, analytics]
---

# Run SQL on the live database without slowing the class

Every student's answer is saved through one small database on Supabase's Free plan (a shared CPU, up to 0.5 GB of memory:
[shared-infrastructure](../reference/shared-infrastructure.md)). Whatever else runs there takes that CPU from the saves. On
2026-11-18, the day before the Perio final, saves failed in bursts of 1 to 5 minutes each time something heavy ran: a
migration's 43 s transaction and 17 s backfill, the lessons audit's 11 and 13 s economy queries, the admin page's reads sent
all at once, a function timed in a loop ([the task](../tasks/done/2026-11-18-database-load.md)). This note says when and how to
run anything on the live database: a query through the Supabase connector or the SQL editor, a migration, a backfill.

## When the class is quiet: 1 to 5 am Central

The class's presence pings by hour of the day (`presence_hourly`, every hub since it began, read 2026-11-18): 270 to 450 an
hour from 1 to 5 am, the fewest at 3 am, against 1,500 to 3,900 an hour from 8 am to 9 pm (the most at 1 pm). The night
before an exam is never empty (9 to 18 people studied after midnight before each recent exam, `LESSONS.md`), but it is still
the quietest time there is. Leave 3:20 to 3:40 am to the nightly retention job (`sh-retention-nightly` at 3:23,
[analytics-retention](../reference/analytics-retention.md)). To read the hours again (a tiny table, nothing to wait for):

```sql
select hour_of_day, sum(ping_count) from presence_hourly group by 1 order by 1;
```

To run something then, a Claude Code cloud session schedules a message to itself for that hour (`send_later`), the way the
ping table's rewrite was set for 3:45 am on 2026-11-19; any other agent asks Sam to run it from the SQL editor. Late at night
is the same night, never after the exam ([ship-it-now](../rules/ship-it-now.md)): what can't wait goes in small batches
instead (below).

## Reading: one short query at a time, under a limit

Every query: the lessons audit's files (`tools/lessons-daily.sql`, `tools/economy.sql`, `tools/retro.sql`, each with a
note on what it costs), a look at the data, a check after a migration.

- **Give every call its own time limit.** The connector runs as `postgres` with a 2-minute `statement_timeout` (checked
  2026-11-18; visitors get 3 s), so a slow query holds a core for up to two minutes. Start each call with:

  ```sql
  set local statement_timeout = '5s';
  select ...;
  ```

  `set local` lasts for that call only. A query that stops at the limit ("canceling statement due to statement timeout")
  is never sent again at once or given a longer limit: split it (one hub, a shorter window, fewer people), or keep it for
  the quiet hours. If it is one the audit needs, go on without it and say so in the PR.
- **One query a call.** A call with several statements returns only the last one's result.
- **One call at a time.** Never several queries in parallel tool calls, and never one in a loop (a function timed person by
  person, a benchmark). Short queries sent together add up: two of 2026-11-18's bursts had nothing over 10 s in the logs.
- **Measure on a throwaway copy, not on the live database.** `tools/release/pg.js` builds one from `supabase/schema.sql`;
  fill it with made-up rows at the class's size and time the query there. The table sizes are a catalog read, cheap at any
  hour: `select relname, reltuples::bigint, pg_total_relation_size(oid) / 1048576 mb from pg_class where relnamespace =
  'public'::regnamespace and relkind = 'r' order by 3 desc;`. The copy is several times faster than the live server (an
  answer save: 5 to 7 ms there, about 150 ms live), so a query over a second there is a heavy one live.
  `explain` alone only plans the query (cheap); `explain analyze` runs it.
  For a change to the answer save, `node tools/release/bench-answers.js` does the whole comparison: the same made-up class
  on a copy with and without the pending migrations, every reply, wallet and table compared, then the answers timed
  (`--statements` adds the statements inside them). Run `vacuum analyze` after loading made-up rows into a copy of your own:
  plans made on empty tables' statistics can be many times slower.
- **Watch for a function in an inlined CTE.** PostgreSQL copies a CTE that is read once into the query that reads it, so
  a `stable` function there runs again for every column that uses its result. `as materialized` runs it once a row
  (`tools/economy.sql`'s E3: 4.7 s to 0.5 s on a copy, the same numbers).
- **The admin page's heavy reads are kept worked out** (`admin_cache`, `migration_v83.sql`): the data-quality report,
  Insights, each live hub's question health, the visitor totals, check-ins, clicks and features. Read the kept copy
  (`select computed_at, body from admin_cache where key = '<key>';`, the keys and the question-health query in
  [admin-operations](../reference/admin-operations.md)) instead of working one out again.
- **While saves are failing, read only the edge logs** (`query_logs`), which cost the database nothing.
  `pg_stat_statements` reports (10 to 14 s each on 2026-11-18) and `explain analyze` wait until it has recovered.

## Changing: migrations, backfills and data fixes

- **Any time:** a migration that only creates or replaces functions, adds a table, a policy or a grant: each takes a
  moment. Before applying, time it on a copy at the class's size: no statement should take over a second there.
- **Late at night, or in small batches:** anything that reads or writes many rows, or holds a lock for long. That means a
  backfill (an update or insert over the rows already there), a new index on a table the pages write, `vacuum full` or
  `cluster`, a constraint validated over a big table, a column's type changed.
  - **Keep the backfill out of the migration's transaction** when the new functions don't need it done first: apply the
    migration, then run the backfill at night or in batches. A whole-table update inside one migration is what made
    2026-11-18's 43 s transaction.
  - **A batch** is its own `execute_sql` call, under the same 5 s limit, of a few thousand rows that take well under a
    second on the copy. Send the next one only after the last has returned, until one changes nothing:

    ```sql
    set local statement_timeout = '5s';
    update public.<table> set <column> = <value>
    where id in (select id from public.<table> where <not done yet> order by id limit 2000);
    ```

  - **An index on a busy table** is `create index concurrently`, sent alone in its own call (it can't run inside a
    transaction, and a call with several statements is one). `migration_v71`'s two indexes were built that way while the
    class saved answers.
  - **An `alter table` on a table every answer or ping writes** (`personal_answers`, `xp_awards`, `answer_xp`,
    `xp_visitors`, `question_stats`, `question_choices`, `question_events`, `activity_pings`, `activity_hourly`,
    `activity_visits`) starts with `set local lock_timeout = '3s';`. It waits behind any query that holds the table, and
    every answer waits behind it; with the limit it gives up instead, and you try again.
- **A data fix runs when its PR merges, whatever the hour** (the After merge workflow, [after-a-merge](after-a-merge.md)).
  Keep it to what takes a second or two on the copy (the outage's time repair: 2,700 rows). A bigger one is a backfill:
  batches, or the quiet hours.
- Numbering a migration, `supabase/schema.sql` and the pending list: the [repo map](../reference/repo-map.md).

Related: [shared-infrastructure](../reference/shared-infrastructure.md) · [the database-load task](../tasks/done/2026-11-18-database-load.md) ·
[the optimization pass](../tasks/done/2026-11-18-database-optimization-pass.md) · [after-a-merge](after-a-merge.md) ·
[read-usage-data](read-usage-data.md) · [analytics-governance](../reference/analytics-governance.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md)
