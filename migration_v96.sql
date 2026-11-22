-- v96 (2026-11-22): an archived hub's answers packed away. Package 2 of vault/tasks/2026-11-22-sustainable-for-years.md;
-- Sam, 2026-11-22, "Okay all that is good to me" (vault/decisions.md) to (D): "30 days after a hub's page comes down, each
-- person's answers for it are packed into one summary row per hub, with nobody's XP, crowns, rank, trophies, medals or
-- leaderboard place moving". That is Sam's OK for these deletes of student rows (vault/rules/learner-data-privacy.md);
-- nothing else is deleted. Given up, as Sam agreed: the answer-by-answer detail of a hub nobody can open; if a hub ever came
-- back, people keep their XP but start its question progress over.
--
-- Each answer keeps about 1.3 KB for good (personal_answers, answer_xp, the answer's xp_awards row, xp_seen), and nearly all
-- of them belong to hubs whose pages are down. What reads them, and what keeps each number the same:
--   - XP, days studied, answers, right, the best run of days (xp_visitors) are stored and stay as they are. Only a rebuild
--     (Link my devices, or an answer corrected) works them out again, from xp_days, which it builds from the answers: the
--     packed answers' share of each day (answers, right, the capped XP of answers from before the release) is kept in the
--     summary row (day_rows), and the rebuild adds it. xp_days itself is not touched.
--   - The answers' XP awards (xp_awards src 'answer', one row an answer since the release) become one award row per person
--     per hub, key 'pack:<hub>:<the id it was packed under>', with the same base and paid XP. xp_award_totals (sh_wallet's
--     sums, migration_v79) keeps the same base and XP, so crowns stay the same to the crown; only its count of awards drops.
--     The rebuild keeps those rows, and keeps the day's 20th-answer award (goal20) of every day that had packed answers, as
--     it keeps the "A miss fixed" ones (migration_v78). Every other award (medals, mocks, games, minutes, reports, prizes)
--     is one row with its own key already and stays, so nothing pays twice.
--   - Rank, journey, trophies, medals and boards read xp_visitors, xp_days and achievements: unchanged.
--   - The class name (anon_name) orders two people with the same name by their first answer (first_seen): it reads the
--     summary's first answer too. Timmy's HP reads xp_days (unchanged) and the last 70 days' answers; packed answers are
--     over 30 days old, and the page draws HP from the last 60 days only, so it can't move.
--   - Mastery: the medals are achievements rows (kept); get_hub_mastery adds each packed hub's numbers from the summary.
--   - The admin page: the Insights tab's answer counts, the retries report, the data-quality drift check and the check-ins
--     compared with each person's answers read the summary too. A packed hub's question health is gone already (v95), and
--     its recap (get_hub_recap) and retrospective (tools/retro.sql) are made before its page comes down.
--
--   1. answers_packed (visitor, hub): answers, right, questions, first tries right, right on the latest try, days studied,
--      first and last answer, the medal reached, the XP and crowns the answers paid, each day's share (day_rows) and the
--      retries report's counts (retries). Admin-only, no policies, like every per-person table.
--   2. sh_pack_merge(a, b): adds two of those jsonb objects key by key (numbers, or arrays of numbers element by element).
--   3. sh_pack_answers(hub, before, max, apply): packs the hub's answers of each person whose newest answer there is older
--      than `before` (sh_pack_due: all of a person's answers on the hub together, never part of them), a person at a time
--      (the same per-person lock as an answer save), until at least `max` answers are done; refuses a hub not in hubs_down.
--      With apply false it only counts. The personal_answers delete runs with sh.packing on, so the delete trigger doesn't
--      rebuild anyone's XP; answer_xp goes with its answer (on delete cascade).
--   4. Linking devices moves the summary (a trigger on visitor_links, as v93's activity_time_kept), adding into the kept
--      id's row; the pack award rows move with the other awards (redeem_link_code), their keys distinct.
--   5. sh_xp_on_delete (skips while packing), sh_xp_rebuild (the packed days and awards), first_seen, get_hub_mastery,
--      sh_exam_debriefs, sh_insights, sh_insight_retries, sh_data_quality: supabase/schema.sql's newest copies, with the
--      summary added.
--   6. sh_retention_run: v95's body (supabase/schema.sql's newest copy), with the pack step after the down hubs' question
--      health: every hub down 30 days or more (hubs_down), each person whose newest answer there is more than 30 days old,
--      at most about 20,000 answers a night (whole people; the biggest has a few thousand). A dry run counts what is due.
--
-- Applying it: a table, four new functions, a trigger and eight replacements; nothing is read or rewritten, so any quiet
-- hour, one call. The packing itself is the nightly job's from then on; the first one (Genetics and Hepatobiliary, about
-- 12,000 answers, due at once) can be run by hand at 1-5 am Central, a call at a time:
--   select sh_pack_answers('genetics', now() - interval '30 days', 5000, true);
-- and checked with the queries at the end of this file. Then VACUUM FULL the four tables.

set local lock_timeout = '3s';

-- ====================================================================== 1. the summary
create table if not exists public.answers_packed (
  visitor_id text not null,
  hub text not null,
  answers int not null default 0,
  correct int not null default 0,
  questions int not null default 0,         -- questions answered (summed if two devices are linked later)
  firsts_correct int not null default 0,    -- questions right on the first try
  latest_correct int not null default 0,    -- questions right on the latest try (get_hub_mastery's latest_correct)
  days int not null default 0,              -- Central days with an answer here (the keys of day_rows)
  first_at timestamptz,
  last_at timestamptz,
  medal smallint not null default 0,        -- 0 none, 1 Bronze, 2 Silver, 3 Gold, 4 Crown (achievements keeps the medals)
  xp int not null default 0,                -- what the answers' awards paid (the pack award row holds the same)
  base int not null default 0,              -- their base XP, before boosts
  crowns int not null default 0,            -- base / 2: the crowns they paid (sh_wallet rounds the whole balance once)
  day_rows jsonb not null default '{}'::jsonb,   -- {"2026-09-10": [answers, right, capped XP of answers from before the release]}
  retries jsonb not null default '{}'::jsonb,    -- sh_insight_retries' counts for these answers
  packed_at timestamptz not null default now(),
  primary key (visitor_id, hub)
);
alter table public.answers_packed enable row level security;
revoke all on public.answers_packed from anon, authenticated;

-- ====================================================================== 2. adding two summaries' jsonb
create or replace function public.sh_pack_merge(a jsonb, b jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare r record; o jsonb := coalesce(a, '{}'::jsonb); x jsonb;
begin
  for r in select * from jsonb_each(coalesce(b, '{}'::jsonb)) loop
    x := o -> r.key;
    if jsonb_typeof(r.value) = 'null' then continue;                     -- a count that is null (none) adds nothing
    elsif x is null or jsonb_typeof(x) = 'null' then o := o || jsonb_build_object(r.key, r.value);
    elsif jsonb_typeof(r.value) = 'array' then
      o := jsonb_set(o, array[r.key], (select coalesce(jsonb_agg(coalesce((x ->> (i - 1))::bigint, 0) + coalesce((r.value ->> (i - 1))::bigint, 0) order by i), '[]'::jsonb)
        from generate_series(1, greatest(jsonb_array_length(x), jsonb_array_length(r.value))) i));
    else o := jsonb_set(o, array[r.key], to_jsonb((x #>> '{}')::bigint + (r.value #>> '{}')::bigint));
    end if;
  end loop;
  return o;
end;
$$;
revoke all on function public.sh_pack_merge(jsonb, jsonb) from public, anon, authenticated;

-- ====================================================================== 3. packing one hub's answers
-- who is due: a person's answers on the hub are packed all together, once the newest of them is older than the cutoff (an
-- answer a page sent late waits with the rest), so a hub's answers are never half packed and half kept for anyone, and
-- nothing that reads a question's first or latest answer (the replay's 10 XP for a first right answer, mastery) can see
-- only part of them
create or replace function public.sh_pack_due(p_hub text, p_before timestamptz)
returns table(visitor_id text, n bigint) language sql stable security definer set search_path = public as $$
  select a.visitor_id, count(*) from personal_answers a where a.hub = p_hub group by a.visitor_id having max(a.answered_at) < p_before;
$$;
revoke all on function public.sh_pack_due(text, timestamptz) from public, anon, authenticated;

create or replace function public.sh_pack_answers(p_hub text, p_before timestamptz, p_max integer default 20000, p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v text; n_people int := 0; n_ans bigint := 0; n_aw bigint := 0; k bigint; s record;
  t_xp int; t_base int; t_at timestamptz; t_d date; t_n int;
begin
  if not exists (select 1 from hubs_down d where d.hub = p_hub) then
    raise exception 'sh_pack_answers: % is not in hubs_down (its page is up)', p_hub;
  end if;
  if p_before is null then raise exception 'sh_pack_answers: no cutoff'; end if;   -- the nightly job passes now() - 30 days
  if not p_apply then
    select coalesce(sum(r.n), 0), count(*) into n_ans, n_people from sh_pack_due(p_hub, p_before) r;
    return jsonb_build_object('hub', p_hub, 'applied', false, 'people', n_people, 'answers', n_ans,
      'awards', (select count(*) from sh_pack_due(p_hub, p_before) r join personal_answers a on a.visitor_id = r.visitor_id and a.hub = p_hub
                 join xp_awards w on w.visitor_id = a.visitor_id and w.key = 'a:' || a.id));
  end if;
  perform set_config('sh.packing', 'on', true);
  for v in select r.visitor_id from sh_pack_due(p_hub, p_before) r order by 1 loop
    exit when n_ans >= coalesce(p_max, 20000);
    perform pg_advisory_xact_lock(hashtext('xp|' || v));   -- the same lock as an answer save and a rebuild
    create temp table if not exists sh_pack_rows (id bigint primary key, qid text, correct boolean, t timestamptz, v2 boolean) on commit drop;
    truncate sh_pack_rows;
    insert into sh_pack_rows
      select a.id, a.qid, a.correct, a.answered_at, exists (select 1 from answer_xp x where x.answer_id = a.id)
      from personal_answers a where a.visitor_id = v and a.hub = p_hub;
    -- each number as the readers work it out from the rows: sh_xp_rebuild's xp_days (rn per question and outcome, the
    -- release's answers paying nothing there), get_hub_mastery's latest try (the later id on a tie), sh_insight_retries
    with r as (
      select p.*, (p.t at time zone 'America/Chicago')::date as d,
        row_number() over (partition by p.qid, p.correct order by p.t) as rn,
        row_number() over (partition by p.qid order by p.t, p.id) as k1,
        row_number() over (partition by p.qid order by p.t desc, p.id desc) as kl,
        lag(p.correct) over (partition by p.qid order by p.t, p.id) as prev_ok,
        p.t - lag(p.t) over (partition by p.qid order by p.t, p.id) as gap,
        row_number() over (partition by p.qid order by p.t, p.id) as kr
      from sh_pack_rows p
    ), dd as (
      select r.d, count(*)::int as n, (count(*) filter (where r.correct))::int as c,
        coalesce(sum(case when r.v2 then 0 when r.correct and r.rn = 1 then 10 when r.correct then 2 else 1 end), 0)::int as raw
      from r group by r.d
    ), gg as (
      select case when gap < interval '10 minutes' then 1 when gap < interval '1 day' then 2 when gap < interval '3 days' then 3 else 4 end as ord,
        prev_ok, count(*) as n, sum(correct::int) as ok
      from r where kr > 1 group by 1, 2
    )
    select count(*)::int as answers, (count(*) filter (where r.correct))::int as correct, count(distinct r.qid)::int as questions,
      (count(*) filter (where r.k1 = 1 and r.correct))::int as firsts_correct, (count(*) filter (where r.kl = 1 and r.correct))::int as latest_correct,
      min(r.t) as first_at, max(r.t) as last_at,
      (select jsonb_object_agg(dd.d::text, jsonb_build_array(dd.n, dd.c, dd.raw)) from dd) as day_rows,
      jsonb_build_object(
        'first_tries', count(*) filter (where r.kr = 1), 'first_ok', count(*) filter (where r.kr = 1 and r.correct),
        'retries', count(*) filter (where r.kr > 1), 'retries_of_right', count(*) filter (where r.kr > 1 and r.prev_ok),
        'quick_retries_of_missed', count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap < interval '10 minutes'),
        -- (the report sums these, so a hub with no such retry reads null there: kept as null here too)
        'quick_retries_of_missed_ok', nullif(count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap < interval '10 minutes'), 0)
          * 0 + count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap < interval '10 minutes' and r.correct),
        'late_retries_of_missed', count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap >= interval '1 day'),
        'late_retries_of_missed_ok', nullif(count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap >= interval '1 day'), 0)
          * 0 + count(*) filter (where r.kr > 1 and not r.prev_ok and r.gap >= interval '1 day' and r.correct))
      || coalesce((select jsonb_object_agg('gap' || gg.ord || case when gg.prev_ok then 'r' else 'm' end, jsonb_build_array(gg.n, gg.ok)) from gg), '{}'::jsonb)
        as retries
      into s from r;
    select coalesce(sum(w.xp), 0)::int, coalesce(sum(w.base), 0)::int, max(w.at), max(w.d), count(*)::int
      into t_xp, t_base, t_at, t_d, t_n
      from xp_awards w join sh_pack_rows p on w.key = 'a:' || p.id where w.visitor_id = v and w.src = 'answer';
    insert into answers_packed as t (visitor_id, hub, answers, correct, questions, firsts_correct, latest_correct, days, first_at, last_at,
                                     medal, xp, base, crowns, day_rows, retries)
      values (v, p_hub, s.answers, s.correct, s.questions, s.firsts_correct, s.latest_correct,
              (select count(*) from jsonb_object_keys(s.day_rows)), s.first_at, s.last_at,
              coalesce((select max(case a.kind when 'mastery-bronze' then 1 when 'mastery-silver' then 2 when 'mastery-gold' then 3 when 'mastery-crown' then 4 end)
                        from achievements a where a.visitor_id = v and a.hub = p_hub and a.kind like 'mastery-%'), 0),
              t_xp, t_base, t_base / 2, s.day_rows, s.retries)
      on conflict (visitor_id, hub) do update set
        answers = t.answers + excluded.answers, correct = t.correct + excluded.correct, questions = t.questions + excluded.questions,
        firsts_correct = t.firsts_correct + excluded.firsts_correct, latest_correct = t.latest_correct + excluded.latest_correct,
        day_rows = sh_pack_merge(t.day_rows, excluded.day_rows),
        days = (select count(*) from jsonb_object_keys(sh_pack_merge(t.day_rows, excluded.day_rows))),
        first_at = least(t.first_at, excluded.first_at), last_at = greatest(t.last_at, excluded.last_at),
        medal = greatest(t.medal, excluded.medal), xp = t.xp + excluded.xp, base = t.base + excluded.base,
        crowns = (t.base + excluded.base) / 2, retries = sh_pack_merge(t.retries, excluded.retries), packed_at = now();
    -- the answers' awards: one row with the same base and paid XP (xp_award_totals moves by the difference: none in XP)
    if t_n > 0 and t_base > 0 then
      insert into xp_awards as w (visitor_id, key, src, hub, base, xp, at, d)
        values (v, 'pack:' || p_hub || ':' || v, 'answer', p_hub, t_base, t_xp, t_at, t_d)
        on conflict (visitor_id, key) do update set base = w.base + excluded.base, xp = w.xp + excluded.xp,
          at = greatest(w.at, excluded.at), d = greatest(w.d, excluded.d);
    end if;
    delete from xp_awards w using sh_pack_rows p where w.visitor_id = v and w.src = 'answer' and w.key = 'a:' || p.id;
    get diagnostics k = row_count; n_aw := n_aw + k;
    delete from personal_answers a using sh_pack_rows p where a.id = p.id;   -- answer_xp goes with it (on delete cascade)
    get diagnostics k = row_count; n_ans := n_ans + k;
    delete from xp_seen x where x.visitor_id = v and x.hub = p_hub;
    n_people := n_people + 1;
  end loop;
  perform set_config('sh.packing', 'off', true);
  return jsonb_build_object('hub', p_hub, 'applied', true, 'people', n_people, 'answers', n_ans, 'awards', n_aw,
    'left', (select count(*) from sh_pack_due(p_hub, p_before)));
end;
$$;
revoke all on function public.sh_pack_answers(text, timestamptz, integer, boolean) from public, anon, authenticated;

-- ====================================================================== 4. linking devices moves the summary
create or replace function public.sh_link_answers_packed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id = new.primary_id then return null; end if;
  insert into answers_packed as t (visitor_id, hub, answers, correct, questions, firsts_correct, latest_correct, days, first_at, last_at,
                                   medal, xp, base, crowns, day_rows, retries, packed_at)
    select new.primary_id, p.hub, p.answers, p.correct, p.questions, p.firsts_correct, p.latest_correct, p.days, p.first_at, p.last_at,
      p.medal, p.xp, p.base, p.crowns, p.day_rows, p.retries, p.packed_at
    from answers_packed p where p.visitor_id = new.alias_id
    on conflict (visitor_id, hub) do update set
      answers = t.answers + excluded.answers, correct = t.correct + excluded.correct, questions = t.questions + excluded.questions,
      firsts_correct = t.firsts_correct + excluded.firsts_correct, latest_correct = t.latest_correct + excluded.latest_correct,
      day_rows = sh_pack_merge(t.day_rows, excluded.day_rows),
      days = (select count(*) from jsonb_object_keys(sh_pack_merge(t.day_rows, excluded.day_rows))),
      first_at = least(t.first_at, excluded.first_at), last_at = greatest(t.last_at, excluded.last_at),
      medal = greatest(t.medal, excluded.medal), xp = t.xp + excluded.xp, base = t.base + excluded.base,
      crowns = (t.base + excluded.base) / 2, retries = sh_pack_merge(t.retries, excluded.retries),
      packed_at = greatest(t.packed_at, excluded.packed_at);
  delete from answers_packed where visitor_id = new.alias_id;
  return null;
end;
$$;
revoke all on function public.sh_link_answers_packed() from public, anon, authenticated;
drop trigger if exists visitor_links_answers_packed on public.visitor_links;
create trigger visitor_links_answers_packed after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_link_answers_packed();

-- ====================================================================== 5. the readers
-- ---------------------------------------------------------------- the delete trigger: no rebuild while packing
create or replace function public.sh_xp_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- v96: a packed hub's answers go without a rebuild (sh_pack_answers keeps every total itself)
  if current_setting('sh.packing', true) = 'on' then return null; end if;
  perform sh_xp_rebuild(array(select distinct visitor_id from old_rows where visitor_id is not null));
  return null;
end;
$$;

-- ---------------------------------------------------------------- the rebuild: the packed days and awards stay
create or replace function public.sh_xp_rebuild(p_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(cardinality(p_ids), 0) = 0 then return; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || x.visitor_id))
  from (select distinct unnest(p_ids) as visitor_id order by 1) x
  where x.visitor_id is not null;
  delete from xp_seen where visitor_id = any(p_ids);
  delete from xp_days where visitor_id = any(p_ids);
  delete from xp_visitors where visitor_id = any(p_ids);

  insert into xp_seen (visitor_id, hub, qid, correct)
    select distinct visitor_id, hub, qid, correct
    from personal_answers where visitor_id = any(p_ids);

  insert into xp_days (visitor_id, d, n, c, raw)
    with pa as (
      select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
        row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn,
        exists (select 1 from answer_xp x where x.answer_id = a.id) as v2
      from personal_answers a where a.visitor_id = any(p_ids)
    )
    , pd as (
      select visitor_id, d, count(*)::integer as n, (count(*) filter (where correct))::integer as c,
        coalesce(sum(case when v2 then 0 when correct and rn = 1 then 10 when correct then 2 else 1 end), 0)::integer as raw
      from pa group by 1, 2
      -- v96: each packed hub's share of the day (answers_packed.day_rows), added before the day's cap
      union all
      select p.visitor_id, e.key::date, (e.value->>0)::integer, (e.value->>1)::integer, (e.value->>2)::integer
      from answers_packed p cross join lateral jsonb_each(p.day_rows) e where p.visitor_id = any(p_ids)
    )
    select visitor_id, d, sum(n)::integer, sum(c)::integer, sum(raw)::integer from pd group by 1, 2;

  -- v78: the "A miss fixed" awards already paid stay as they were (the replay makes no new ones)
  -- v96: and so do a packed hub's: its answers' award row ('pack:...') and the 20th-answer award of every day it had answers
  -- (any of the ids': Link my devices moves the awards before the summary, and the answers' move rebuilds in between)
  delete from xp_awards w where w.visitor_id = any(p_ids) and w.src in ('answer', 'goal20') and w.key not like 'pack:%'
    and not (w.src = 'goal20' and exists (select 1 from answers_packed p where p.visitor_id = any(p_ids) and p.day_rows ? w.d::text));
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    select r.visitor_id, r.key, r.src, r.hub, r.base, r.xp, r.at, r.d from sh_xp_replay(p_ids) r
    on conflict (visitor_id, key) do nothing;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    with totals as (
      select visitor_id, sum(least(raw, 600) + 20)::integer as xp, count(*)::integer as days,
        sum(n)::integer as answers, sum(c)::integer as correct
      from xp_days where visitor_id = any(p_ids) group by visitor_id
    ), aw as (
      select visitor_id, sum(xp)::integer as xp from xp_awards where visitor_id = any(p_ids) group by visitor_id
    ), ids as (
      select visitor_id from totals union select visitor_id from aw
    ), islands as (
      select visitor_id, d, d - row_number() over (partition by visitor_id order by d)::integer as grp
      from xp_days where visitor_id = any(p_ids)
    ), best as (
      select visitor_id, max(len)::integer as best_days
      from (select visitor_id, grp, count(*)::integer as len from islands group by 1, 2) runs
      group by visitor_id
    )
    select i.visitor_id, coalesce(t.xp, 0) + coalesce(a.xp, 0), coalesce(t.days, 0), coalesce(t.answers, 0),
      coalesce(t.correct, 0), coalesce(b.best_days, 0)
    from ids i left join totals t using (visitor_id) left join aw a using (visitor_id) left join best b using (visitor_id);
end;
$$;

-- ---------------------------------------------------------------- the first answer, packed ones included
create or replace function public.first_seen(p_visitor_id text)
returns timestamptz language sql stable set search_path = public as $$
  -- v96: a packed hub's first answer too (anon_name orders two people with one name by it)
  select min(t) from (select min(answered_at) as t from personal_answers where visitor_id = p_visitor_id
                     union all select min(first_at) from answers_packed where visitor_id = p_visitor_id) x;
$$;

-- ---------------------------------------------------------------- a hub's mastery, packed hubs included
create or replace function public.get_hub_mastery(p_visitor text)
returns table(hub text, latest_correct integer, seen integer)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
    select z.hub, sum(z.lc)::int, sum(z.sn)::int from (
      select q.hub, count(*) filter (where l.correct) as lc, count(*) as sn
      from (select s.hub, s.qid from xp_seen s where s.visitor_id = p_visitor group by s.hub, s.qid) q
      cross join lateral (select a.correct from personal_answers a
                          where a.visitor_id = p_visitor and a.hub = q.hub and a.qid = q.qid
                          order by a.answered_at desc, a.id desc limit 1) l
      group by q.hub
      -- v96: a packed hub's numbers, as they were when it was packed
      union all
      -- (a hub brought back starts over: once there are answers there again, its packed numbers no longer count)
      select p.hub, p.latest_correct, p.questions from answers_packed p where p.visitor_id = p_visitor
        and not exists (select 1 from xp_seen s where s.visitor_id = p_visitor and s.hub = p.hub)
    ) z group by z.hub;
end;
$$;

-- ---------------------------------------------------------------- the check-ins against each person's answers
create or replace function public.sh_exam_debriefs()
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (
    with d as (select * from exam_debriefs e order by e.created_at desc, e.id desc limit 2000),
    who as (select distinct d.hub, d.visitor_id from d),
    t as (select w.hub, w.visitor_id, coalesce(sum(h.n), 0) * 25 / 60 as minutes
          from who w left join activity_hourly h on h.visitor_id = w.visitor_id and h.hub = w.hub
          group by w.hub, w.visitor_id),
    a0 as (select w.hub, w.visitor_id, count(pa.id) as n, count(pa.id) filter (where pa.correct) as c
          from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
          group by w.hub, w.visitor_id),
    -- v96: a packed hub's answers from its summary (the same answered and accuracy)
    a as (select a0.hub, a0.visitor_id, a0.n + coalesce(p.answers, 0) as answered,
                 round(100.0 * (a0.c + coalesce(p.correct, 0)) / nullif(a0.n + coalesce(p.answers, 0), 0), 0) as accuracy
          from a0 left join answers_packed p on p.visitor_id = a0.visitor_id and p.hub = a0.hub)
    select coalesce(jsonb_agg(jsonb_build_object('hub', d.hub, 'exam', d.exam, 'visitor_id', d.visitor_id, 'answers', d.answers,
        'created_at', d.created_at, 'minutes', t.minutes::bigint, 'answered', a.answered::bigint, 'accuracy', a.accuracy)
      order by d.created_at desc, d.id desc), '[]'::jsonb)
    from d
    join t on t.hub = d.hub and t.visitor_id = d.visitor_id
    join a on a.hub = d.hub and a.visitor_id = d.visitor_id);
end;
$$;

-- ---------------------------------------------------------------- the Insights tab's answer counts
create or replace function public.sh_insights(p_exams jsonb default '{}'::jsonb)
returns jsonb language sql stable set search_path = public as $$
with
ex as (
  select e.key as hub, (e.value #>> '{}')::date as exam
  from jsonb_each(case when jsonb_typeof(p_exams) = 'object' then p_exams else '{}'::jsonb end) e
  where jsonb_typeof(e.value) = 'string' and (e.value #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'),
-- map each distinct section once (sh_surface per row costs ~30 us x every hourly row); materialized (v83), or PostgreSQL
-- folds this into the join below and calls sh_surface once per hourly row after all (0.7 s of 1.1 on a copy)
secmap as materialized (select s.section, sh_surface(s.section) as surf from (select distinct section from activity_hourly) s),
h as (
  select a.hub, a.visitor_id, (a.h at time zone 'America/Chicago')::date as d, m.surf, a.n
  from activity_hourly a join secmap m on m.section = a.section where a.hub <> '' and a.hub !~ '^zz-'),
v as (
  select h.hub, h.visitor_id, count(distinct h.d) as days, sum(h.n) * 25 / 60.0 as mins,
    sum(h.n) filter (where h.d between ex.exam - 2 and ex.exam) * 25 / 60.0 as last3,
    sum(h.n) filter (where h.d <= ex.exam) * 25 / 60.0 as upto
  from h left join ex on ex.hub = h.hub group by h.hub, h.visitor_id),
-- v96: with each packed hub's answers from its summary
pa as (select hub, visitor_id, sum(n) as n from (
         select hub, visitor_id, count(*) as n from personal_answers group by hub, visitor_id
         union all select hub, visitor_id, answers from answers_packed) z group by hub, visitor_id),
span as (select hub, min(d) as first_day, max(d) as last_day from h group by hub),
qs as (select hub, sum(attempts) as attempts, sum(correct) as correct, count(*) as questions from question_stats group by hub),
mk as (select hub, count(*) as mocks, count(distinct visitor_id) as people, round(avg(100.0 * correct / nullif(total, 0))) as avg_pct
       from mock_scores group by hub),
card as (
  select v.hub,
    count(*) as people,
    count(*) filter (where coalesce(pa.n, 0) > 0) as answerers,
    count(*) filter (where coalesce(pa.n, 0) >= 50) as answered_50,
    count(*) filter (where v.days = 1) as one_day,
    count(*) filter (where v.days >= 3) as three_days,
    count(*) filter (where v.mins < 5) as under_5,
    round(percentile_cont(0.5) within group (order by v.mins)::numeric) as median_mins,
    round(percentile_cont(0.9) within group (order by v.mins)::numeric) as p90_mins,
    round(sum(v.mins)) as total_mins,
    round(100 * sum(v.last3) / nullif(sum(v.upto), 0)) as last3_pct,
    round(percentile_cont(0.5) within group (order by coalesce(pa.n, 0))::numeric) as median_answers
  from v left join pa on pa.hub = v.hub and pa.visitor_id = v.visitor_id group by v.hub),
hubs as (
  select jsonb_agg(jsonb_build_object(
    'hub', c.hub, 'exam', ex.exam, 'first_day', s.first_day, 'last_day', s.last_day,
    'people', c.people, 'answerers', c.answerers, 'answered_50', c.answered_50, 'one_day', c.one_day,
    'three_days', c.three_days, 'under_5', c.under_5, 'median_mins', c.median_mins, 'p90_mins', c.p90_mins,
    'total_mins', c.total_mins, 'median_answers', c.median_answers,
    'last3_pct', case when ex.exam <= (now() at time zone 'America/Chicago')::date then c.last3_pct end,
    'attempts', coalesce(qs.attempts, 0), 'correct', coalesce(qs.correct, 0), 'questions_seen', coalesce(qs.questions, 0),
    'mocks', coalesce(mk.mocks, 0), 'mock_people', coalesce(mk.people, 0), 'mock_avg_pct', mk.avg_pct
  ) order by c.total_mins desc) as j
  from card c join span s on s.hub = c.hub left join ex on ex.hub = c.hub
  left join qs on qs.hub = c.hub left join mk on mk.hub = c.hub),
surfaces as (
  select jsonb_agg(jsonb_build_object('hub', x.hub, 'surface', x.surf, 'mins', x.mins, 'people', x.people) order by x.hub, x.mins desc) as j
  from (select hub, surf, round(sum(n) * 25 / 60.0) as mins, count(distinct visitor_id) as people from h group by hub, surf) x),
features as (
  select jsonb_agg(to_jsonb(x) order by x.hub) as j from (
    select hub, min(day) as since,
      count(distinct visitor_id) filter (where kind = 'view') as viewers,
      count(distinct visitor_id) filter (where kind like 'fig-seen:%') as fig_seen,
      count(distinct visitor_id) filter (where kind like 'fig:%' or kind like 'fig-part:%') as fig_used,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:play$') as pod_play,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:q2$') as pod_half,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:q4$') as pod_end,
      count(distinct visitor_id) filter (where kind = 'tts:secs') as listen_people,
      coalesce(sum(n) filter (where kind = 'tts:secs'), 0) / 60 as listen_mins,
      count(distinct visitor_id) filter (where kind = 'pin:add') as pinners,
      count(distinct visitor_id) filter (where kind like 'hl:%') as highlighters,
      count(distinct visitor_id) filter (where kind = 'mmap:open') as mind_maps,
      count(distinct visitor_id) filter (where kind = 'notes-jump:shown') as find_in_notes,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:prompt$') as tour_prompted,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:start$') as tour_started,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:done$') as tour_done,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:decline$') as tour_declined,
      count(distinct visitor_id) filter (where kind like 'state:%') as settings_people,
      count(distinct visitor_id) filter (where kind in ('state:pet=off', 'state:pet=dash')) as pet_off,
      count(distinct visitor_id) filter (where kind = 'state:fx=off') as fx_off,
      count(distinct visitor_id) filter (where kind = 'state:eggs=off') as eggs_off
    from feature_events where hub <> '' and hub !~ '^zz-' group by hub) x),
rep as (
  select hub, created_at, resolved, resolved_at, reply from question_flags
  union all select coalesce(hub, ''), created_at, resolved, resolved_at, reply from hub_suggestions),
voice as (
  select jsonb_agg(to_jsonb(x) order by x.reports desc) as j from (
    select hub, count(*) as reports, count(*) filter (where not resolved) as open,
      count(*) filter (where reply is not null) as replied,
      round((percentile_cont(0.5) within group (order by extract(epoch from resolved_at - created_at) / 3600)
        filter (where resolved_at is not null))::numeric, 1) as median_hours_to_resolve,
      max(created_at)::date as last_report
    from rep group by hub) x),
db as (
  select distinct on (hub, exam, visitor_id) hub, exam, visitor_id, answers
  from exam_debriefs where hub !~ '^zz-' order by hub, exam, visitor_id, created_at desc),
checkins as (
  select jsonb_agg(to_jsonb(x) order by x.exam) as j from (
    select db.hub, db.exam, count(*) as people,
      round(percentile_cont(0.5) within group (order by coalesce(v.mins, 0))::numeric) as their_median_mins,
      (select c.median_mins from card c where c.hub = db.hub) as hub_median_mins,
      (select c.people from card c where c.hub = db.hub) as hub_people,
      round(avg((db.answers->>'ready')::numeric) filter (where db.answers->>'ready' ~ '^[1-5]$'), 1) as avg_ready,
      (select jsonb_object_agg(m.k, m.n) from (
         select d2.answers->>'match' as k, count(*) as n from db d2
         where d2.hub = db.hub and d2.exam = db.exam and coalesce(d2.answers->>'match', '') <> '' group by 1) m) as match
    from db left join v on v.hub = db.hub and v.visitor_id = db.visitor_id group by db.hub, db.exam) x),
surveys as (
  select jsonb_build_object('responses', count(*), 'declined', count(*) filter (where answers is null)) as j from survey_responses)
select jsonb_build_object(
  'generated_at', now(),
  'hubs', coalesce((select j from hubs), '[]'::jsonb),
  'surfaces', coalesce((select j from surfaces), '[]'::jsonb),
  'features', coalesce((select j from features), '[]'::jsonb),
  'voice', coalesce((select j from voice), '[]'::jsonb),
  'checkins', coalesce((select j from checkins), '[]'::jsonb),
  'surveys', (select j from surveys))
$$;

-- ---------------------------------------------------------------- the retries report
create or replace function public.sh_insight_retries()
returns jsonb language sql stable set search_path = public set work_mem = '64MB' as $$
with
r as (
  select hub, correct,
    lag(correct) over w as prev_ok,
    answered_at - lag(answered_at) over w as gap,
    row_number() over w as k
  from personal_answers where hub <> '' and hub !~ '^zz-'
  -- v96: the id breaks a tie (a mock's answers saved in the same instant), as the pack counts them
  window w as (partition by hub, visitor_id, qid order by answered_at, id)),
g as (
  select case when gap < interval '10 minutes' then 1 when gap < interval '1 day' then 2 when gap < interval '3 days' then 3 else 4 end as ord,
    prev_ok, count(*) as n, sum(correct::int) as ok
  from r where k > 1 group by 1, 2),
-- v96: the packed hubs' counts, kept in their summaries (answers_packed.retries)
pk as (select p.hub, p.retries from answers_packed p where p.hub <> '' and p.hub !~ '^zz-'),
g2 as (
  select ord, prev_ok, sum(n) as n, sum(ok) as ok from (
    select ord, prev_ok, n, ok from g
    union all
    select substr(e.key, 4, 1)::int, substr(e.key, 5, 1) = 'r', (e.value->>0)::bigint, (e.value->>1)::bigint
    from pk cross join lateral jsonb_each(pk.retries) e where e.key ~ '^gap[1-4][rm]$') z
  group by 1, 2),
hb as (
  select hub,
    count(*) filter (where k = 1) as first_tries, sum(correct::int) filter (where k = 1) as first_ok,
    count(*) filter (where k > 1) as retries,
    count(*) filter (where k > 1 and prev_ok) as retries_of_right,
    count(*) filter (where k > 1 and not prev_ok and gap < interval '10 minutes') as quick_retries_of_missed,
    sum(correct::int) filter (where k > 1 and not prev_ok and gap < interval '10 minutes') as quick_retries_of_missed_ok,
    count(*) filter (where k > 1 and not prev_ok and gap >= interval '1 day') as late_retries_of_missed,
    sum(correct::int) filter (where k > 1 and not prev_ok and gap >= interval '1 day') as late_retries_of_missed_ok
  from r group by hub),
hb2 as (
  select hub, sum(first_tries) as first_tries, sum(first_ok) as first_ok, sum(retries) as retries, sum(retries_of_right) as retries_of_right,
    sum(quick_retries_of_missed) as quick_retries_of_missed, sum(quick_retries_of_missed_ok) as quick_retries_of_missed_ok,
    sum(late_retries_of_missed) as late_retries_of_missed, sum(late_retries_of_missed_ok) as late_retries_of_missed_ok
  from (select * from hb
        union all
        select pk.hub, (pk.retries->>'first_tries')::bigint, (pk.retries->>'first_ok')::bigint, (pk.retries->>'retries')::bigint,
          (pk.retries->>'retries_of_right')::bigint, (pk.retries->>'quick_retries_of_missed')::bigint,
          (pk.retries->>'quick_retries_of_missed_ok')::bigint, (pk.retries->>'late_retries_of_missed')::bigint,
          (pk.retries->>'late_retries_of_missed_ok')::bigint
        from pk) z group by hub)
select jsonb_build_object(
  'by_gap', coalesce((select jsonb_agg(jsonb_build_object(
      'gap', (array['under 10 min', '10 min to 1 day', '1 to 3 days', '3+ days'])[g.ord],
      'after', case when g.prev_ok then 'right' else 'missed' end, 'n', g.n, 'ok', g.ok) order by g.prev_ok, g.ord) from g2 g), '[]'::jsonb),
  'by_hub', coalesce((select jsonb_agg(to_jsonb(hb) order by hb.first_tries desc) from hb2 hb), '[]'::jsonb))
$$;

-- ---------------------------------------------------------------- the data-quality drift check
create or replace function public.sh_data_quality()
returns jsonb language sql stable set search_path = public as $$
select jsonb_build_object(
  'generated_at', now(),
  -- when each source last wrote: a source that stops while pings keep coming is broken tracking, not quiet students
  'last_write', jsonb_build_object(
    'activity_pings', (select max(pinged_at) from activity_pings),
    'personal_answers', (select max(answered_at) from personal_answers),
    'ui_clicks', (select max(day) from ui_clicks),
    'feature_events', (select max(day) from feature_events where hub !~ '^zz-'),
    'search_terms', (select max(day) from search_terms),
    'mock_scores', (select max(created_at) from mock_scores),
    'exam_debriefs', (select max(created_at) from exam_debriefs),
    'survey_responses', (select max(created_at) from survey_responses),
    'question_flags', (select max(created_at) from question_flags)),
  -- rows from test hubs ('zz-...') or with no hub: exclude them, or delete them (vault/tasks retention note)
  'test_rows', jsonb_build_object(
    'feature_events', (select count(*) from feature_events where hub = '' or hub ~ '^zz-'),
    'ui_clicks', (select count(*) from ui_clicks where hub = '' or hub ~ '^zz-'),
    'activity_hourly', (select count(*) from activity_hourly where hub = '' or hub ~ '^zz-'),
    'personal_answers', (select count(*) from personal_answers where hub = '' or hub ~ '^zz-')),
  -- sections sh_surface() can't place: a new mode or sub-view to add to it, or no section at all (`offset 0`, v83: without it
  -- PostgreSQL tests sh_surface on every hourly row before the distinct, 0.7 s of 1.0 on a copy)
  'unmapped_sections', coalesce((select jsonb_agg(jsonb_build_object('hub', x.hub, 'section', x.section, 'pings', x.n,
      'last_day', x.last_day) order by x.n desc) from (
    select a.hub, a.section, sum(a.n) as n, max((a.h at time zone 'America/Chicago')::date) as last_day from activity_hourly a
    join (select s.section from (select distinct section from activity_hourly offset 0) s where sh_surface(s.section) in ('other', 'unknown')) u
      on u.section = a.section
    where a.hub <> '' and a.hub !~ '^zz-' group by 1, 2) x), '[]'::jsonb),
  -- every feature-event family, when it first and last fired: new ones need a row in vault/reference/event-taxonomy.md,
  -- and one that stopped firing while its feature is still up is broken tracking
  'event_families', coalesce((select jsonb_agg(jsonb_build_object('family', x.f, 'first_day', x.first_day,
      'last_day', x.last_day, 'people', x.people, 'kinds', x.kinds) order by x.first_day desc, x.f) from (
    select split_part(split_part(kind, ':', 1), '=', 1) as f, min(day) as first_day, max(day) as last_day,
      count(distinct visitor_id) as people, count(distinct kind) as kinds
    from feature_events where hub <> '' and hub !~ '^zz-' group by 1) x), '[]'::jsonb),
  -- active time counted twice: more than 144 pings (60 min) from one visitor in one hour, e.g. two hubs visible side by side
  'overcount', (select jsonb_build_object('visitor_hours', count(*), 'excess_minutes', coalesce(round(sum(x.t - 144) * 25 / 60.0), 0))
    from (select visitor_id, h, sum(n) as t from activity_hourly group by 1, 2 having sum(n) > 144) x),
  -- writes from a device id after it was linked to another (an old tab still open); they count as an extra person
  -- (one index probe per linked id: a join would scan all of activity_pings, ~2 s)
  'alias_writes', jsonb_build_object(
    'activity_pings', (select coalesce(sum((select count(*) from activity_pings p
                         where p.visitor_id = l.alias_id and p.pinged_at > l.linked_at + interval '1 minute')), 0) from visitor_links l),
    'personal_answers', (select coalesce(sum((select count(*) from personal_answers a
                           where a.visitor_id = l.alias_id and a.answered_at > l.linked_at + interval '1 minute')), 0) from visitor_links l)),
  'identity', jsonb_build_object(
    'visitor_ids', (select count(distinct visitor_id) from activity_visits),
    'linked_aliases', (select count(*) from visitor_links)),
  -- questions answered 20+ times with no picks in question_choices: "most popular wrong answer" can't be read for them
  'choices_missing', coalesce((select jsonb_agg(jsonb_build_object('hub', x.hub, 'answered_20', x.q20, 'no_choices', x.nc)
      order by x.nc desc) from (
    select s.hub, count(*) filter (where s.attempts >= 20) as q20,
      count(*) filter (where s.attempts >= 20 and not exists (select 1 from question_choices c where c.hub = s.hub and c.qid = s.qid)) as nc
    from question_stats s where s.hub <> '' and s.hub !~ '^zz-' group by s.hub) x where x.nc > 0), '[]'::jsonb),
  -- class-wide counters vs each person's rows: they are written by two separate calls and should agree within a few
  'stats_drift', coalesce((select jsonb_agg(jsonb_build_object('hub', q.hub, 'question_stats', q.att, 'personal_answers', coalesce(p.n, 0))
      order by abs(q.att - coalesce(p.n, 0)) desc) from (select hub, sum(attempts) as att from question_stats group by hub) q
    -- v96: with the packed hubs' answers from their summaries
    left join (select hub, sum(n) as n from (select hub, count(*) as n from personal_answers group by hub
                                             union all select hub, answers from answers_packed) z group by hub) p on p.hub = q.hub
    where abs(q.att - coalesce(p.n, 0)) > 5), '[]'::jsonb),
  'storage', jsonb_build_object(
    'database_mb', round(pg_database_size(current_database()) / 1048576.0),
    'pings_last_7_days', (select count(*) from activity_pings where pinged_at > now() - interval '7 days'),
    'answers_last_7_days', (select count(*) from personal_answers where answered_at > now() - interval '7 days'),
    'tables', (select jsonb_agg(jsonb_build_object('table', c.relname, 'mb', round(pg_total_relation_size(c.oid) / 1048576.0, 1),
        'rows', greatest(c.reltuples, 0)::bigint) order by pg_total_relation_size(c.oid) desc)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and pg_total_relation_size(c.oid) > 1048576)))
$$;

-- ====================================================================== 6. the retention job's pack step
create or replace function public.sh_retention_run(p_apply boolean default false)
returns jsonb language plpgsql set search_path = public as $$
declare
  c jsonb := '{}'::jsonb;
  k bigint;
  hd text;
  cut_pings timestamptz := now() - interval '3 days';   -- v74: 3 days (Sam, 2026-11-18), was 30
  cut_reach date := current_date - 30;                  -- v95: 30 days (Sam, 2026-11-22), was 90
  cut_events date := current_date - 60;                 -- v95: 60 days (Sam, 2026-11-22), was 180
  -- v93: the school year. Per-person time and question-health rows are kept 365 days, counted in whole Central days, so a
  -- day is collapsed all at once on the night it turns a year old (and an hour never splits across two runs).
  cut_year timestamptz := (((now() at time zone 'America/Chicago')::date - 365)::timestamp at time zone 'America/Chicago');
  -- v96: a hub's answers are packed once its page has been down 30 days, those more than 30 days old, 20,000 a night
  cut_pack timestamptz := now() - interval '30 days';
  due_day date := (now() at time zone 'America/Chicago')::date - 30;
  left_n bigint := 20000;
  pr jsonb;
  np bigint := 0;
begin
  -- raw pings older than 3 days, and test or blank-hub pings; their hours stay in activity_hourly / activity_visits
  if p_apply then
    perform set_config('sh.keep_rollups', 'on', true);
    delete from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
    get diagnostics k = row_count;
    perform set_config('sh.keep_rollups', 'off', true);
  else
    select count(*) into k from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
  end if;
  c := c || jsonb_build_object('activity_pings', k);

  -- v95: who tapped what, older than 30 days: day x page x target with people counts, then the per-person rows go
  -- (ui_clicks keeps the counts, with no ids)
  if p_apply then
    insert into ui_click_reach_daily (day, hub, target, people)
      select day, hub, target, count(*) from ui_click_reach          -- one row per visitor (the primary key)
      where day < cut_reach and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, target) do update set people = ui_click_reach_daily.people + excluded.people;
    delete from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; get diagnostics k = row_count;
  else select count(*) into k from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; end if;
  c := c || jsonb_build_object('ui_click_reach', k);

  -- feature events older than 60 days (v95; 180 before): day x page x kind with people counts, then the per-person rows go
  if p_apply then
    insert into feature_daily (day, hub, kind, people, n)
      select day, hub, kind, count(distinct visitor_id), sum(n) from feature_events
      where day < cut_events and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, kind) do update set people = feature_daily.people + excluded.people, n = feature_daily.n + excluded.n;
    delete from feature_events where day < cut_events or hub = '' or hub ~ '^zz-'; get diagnostics k = row_count;
  else select count(*) into k from feature_events where day < cut_events or hub = '' or hub ~ '^zz-'; end if;
  c := c || jsonb_build_object('feature_events', k);

  -- the other rollups and counters: test hubs and blank hubs only
  if p_apply then
    delete from activity_hourly where hub = '' or hub ~ '^zz-'; get diagnostics k = row_count; c := c || jsonb_build_object('activity_hourly_test', k);
    delete from ui_clicks where hub = '' or hub ~ '^zz-'; get diagnostics k = row_count; c := c || jsonb_build_object('ui_clicks_test', k);
  else
    c := c || jsonb_build_object('activity_hourly_test', (select count(*) from activity_hourly where hub = '' or hub ~ '^zz-'),
                                 'ui_clicks_test', (select count(*) from ui_clicks where hub = '' or hub ~ '^zz-'));
  end if;

  -- v93: hub time older than the school year. First what its hours paid in time crowns (sh_time_crowns: 100 crowns per
  -- hour of hub time, at most 144 pings a clock hour), kept per visitor as capped pings in activity_time_kept, so no
  -- balance moves; then hub x section x day totals with people counts and no ids (activity_daily); then the per-person
  -- hours go. Test and blank hubs pay nothing (the same filter as sh_time_crowns) and the test step above deletes them.
  if p_apply then
    insert into activity_time_kept (visitor_id, n)
      select t.visitor_id, sum(least(t.n, 144)) from
        (select visitor_id, h, sum(n) as n from activity_hourly
         where h < cut_year and hub <> '' and hub <> 'zz-test' group by 1, 2) t
      group by 1
      on conflict (visitor_id) do update set n = activity_time_kept.n + excluded.n, updated_at = now();
    insert into activity_daily (day, hub, section, people, n)
      select (h at time zone 'America/Chicago')::date, hub, section, count(distinct visitor_id), sum(n) from activity_hourly
      where h < cut_year and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, section) do update set people = activity_daily.people + excluded.people, n = activity_daily.n + excluded.n;
    delete from activity_hourly where h < cut_year; get diagnostics k = row_count;
  else select count(*) into k from activity_hourly where h < cut_year; end if;
  c := c || jsonb_build_object('activity_hourly_year', k);

  -- v93: visits that ended before the school year: visits and people per Central day (of the visit's start), no ids
  if p_apply then
    insert into activity_visits_daily (day, visits, people)
      select (first_at at time zone 'America/Chicago')::date, count(*), count(distinct visitor_id) from activity_visits
      where last_at < cut_year group by 1
      on conflict (day) do update set visits = activity_visits_daily.visits + excluded.visits,
        people = activity_visits_daily.people + excluded.people;
    delete from activity_visits where last_at < cut_year; get diagnostics k = row_count;
  else select count(*) into k from activity_visits where last_at < cut_year; end if;
  c := c || jsonb_build_object('activity_visits_year', k);

  -- v93: question health older than the school year (Sam, 2026-11-21: "Collapse after the year"): day x hub x question x
  -- version totals (answers, right, first tries and retries, unanswered reads, the picks, median times, people), no ids.
  -- Question health itself reads 120 days; question_stats and question_choices keep the all-time class totals already.
  -- Since v95 this only reaches a live hub's rows: a hub whose page is down is rolled up by the step after it.
  if p_apply then
    insert into question_events_daily (day, hub, qid, v, people, answers, correct, firsts, firsts_correct, retries,
                                       retries_correct, views, med_ms, med_expl_ms, choices)
      select d.day, d.hub, d.qid, d.v, d.people, d.answers, d.correct, d.firsts, d.firsts_correct, d.retries, d.retries_correct,
             d.views, d.med_ms, d.med_expl_ms,
             coalesce((select jsonb_object_agg(x.choice, x.n) from
                        (select e.choice::text as choice, count(*) as n from question_events e
                         where e.at < cut_year and e.kind = 'answer' and e.choice is not null
                           and (e.at at time zone 'America/Chicago')::date = d.day and e.hub = d.hub and e.qid = d.qid and e.v = d.v
                         group by 1) x), '{}'::jsonb)
      from (select (at at time zone 'America/Chicago')::date as day, hub, qid, v,
                   count(distinct visitor_id) as people,
                   count(*) filter (where kind = 'answer') as answers,
                   count(*) filter (where kind = 'answer' and correct) as correct,
                   count(*) filter (where kind = 'answer' and try = 1) as firsts,
                   count(*) filter (where kind = 'answer' and try = 1 and correct) as firsts_correct,
                   count(*) filter (where kind = 'answer' and try > 1) as retries,
                   count(*) filter (where kind = 'answer' and try > 1 and correct) as retries_correct,
                   count(*) filter (where kind = 'view') as views,
                   (percentile_cont(0.5) within group (order by ms) filter (where kind = 'answer'))::int as med_ms,
                   (percentile_cont(0.5) within group (order by expl_ms) filter (where kind = 'answer'))::int as med_expl_ms
            from question_events where at < cut_year and hub <> '' and hub !~ '^zz-' group by 1, 2, 3, 4) d
      on conflict (day, hub, qid, v) do update set
        people = question_events_daily.people + excluded.people, answers = question_events_daily.answers + excluded.answers,
        correct = question_events_daily.correct + excluded.correct, firsts = question_events_daily.firsts + excluded.firsts,
        firsts_correct = question_events_daily.firsts_correct + excluded.firsts_correct,
        retries = question_events_daily.retries + excluded.retries,
        retries_correct = question_events_daily.retries_correct + excluded.retries_correct,
        views = question_events_daily.views + excluded.views,
        med_ms = coalesce(question_events_daily.med_ms, excluded.med_ms),
        med_expl_ms = coalesce(question_events_daily.med_expl_ms, excluded.med_expl_ms),
        choices = (select coalesce(jsonb_object_agg(z.k, z.n), '{}'::jsonb) from
                    (select u.k, sum(u.n)::int as n from
                      (select key as k, value::int as n from jsonb_each_text(question_events_daily.choices)
                       union all select key, value::int from jsonb_each_text(excluded.choices)) u group by u.k) z);
    delete from question_events where at < cut_year; get diagnostics k = row_count;
  else select count(*) into k from question_events where at < cut_year; end if;
  c := c || jsonb_build_object('question_events_year', k);

  -- v95: question health of a hub whose page came down (Sam, 2026-11-22): rolled up the same way, then deleted, a hub at
  -- a time (hubs_down, written by the After merge workflow). Every night, for rows a page sent after it came down too.
  k := 0;
  for hd in select d.hub from hubs_down d where exists (select 1 from question_events e where e.hub = d.hub) order by d.day, d.hub loop
    if p_apply then k := k + sh_retention_hub_down(hd);
    else k := k + (select count(*) from question_events where hub = hd); end if;
  end loop;
  c := c || jsonb_build_object('question_events_down', k);

  -- v96: the answers of a hub whose page came down 30 or more days ago (Sam, 2026-11-22: "30 days after a hub's page comes
  -- down, each person's answers for it are packed into one summary row per hub"), a person at a time, at most about
  -- 20,000 answers a night (whole people), oldest hub first; nobody's XP, crowns, rank, trophies, medals or boards move.
  -- A dry run counts every answer due, past tonight's 20,000 too.
  k := 0;
  for hd in select d.hub from hubs_down d where d.day <= due_day
      and exists (select 1 from personal_answers a where a.hub = d.hub) order by d.day, d.hub loop
    if p_apply then
      exit when left_n <= 0;
      pr := sh_pack_answers(hd, cut_pack, left_n::int, true);
      k := k + (pr->>'answers')::bigint; np := np + (pr->>'people')::bigint; left_n := left_n - (pr->>'answers')::bigint;
    else
      select k + coalesce(sum(r.n), 0), np + count(*) into k, np from sh_pack_due(hd, cut_pack) r;
    end if;
  end loop;
  c := c || jsonb_build_object('answers_packed', k, 'answers_packed_people', np);

  -- reports and suggestions: the sender's id goes 120 days after the reply (the reply has reached their Inbox by then)
  if p_apply then
    update question_flags set visitor_id = null where visitor_id is not null and resolved and resolved_at < now() - interval '120 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('question_flags_ids', k);
    update hub_suggestions set visitor_id = null where visitor_id is not null and resolved and resolved_at < now() - interval '120 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('hub_suggestions_ids', k);
  else
    c := c || jsonb_build_object(
      'question_flags_ids', (select count(*) from question_flags where visitor_id is not null and resolved and resolved_at < now() - interval '120 days'),
      'hub_suggestions_ids', (select count(*) from hub_suggestions where visitor_id is not null and resolved and resolved_at < now() - interval '120 days'));
  end if;

  -- exam check-ins: compared with the person's own use only in that hub's retrospective; the id goes after a year
  if p_apply then
    update exam_debriefs set visitor_id = 'anon-' || id where visitor_id !~ '^anon-' and created_at < now() - interval '1 year';
    get diagnostics k = row_count;
  else select count(*) into k from exam_debriefs where visitor_id !~ '^anon-' and created_at < now() - interval '1 year'; end if;
  c := c || jsonb_build_object('exam_debriefs_ids', k);

  -- surveys: "No thanks" rows only stop a live survey asking twice; answers lose their id 90 days after it closed
  -- (closed = not active, or past ends_at; when it closed = ends_at, else its last response)
  if p_apply then
    delete from survey_responses r using surveys s where s.id = r.survey_id and r.answers is null
      and (not s.active or s.ends_at < now());
    get diagnostics k = row_count; c := c || jsonb_build_object('survey_declines', k);
    update survey_responses r set visitor_id = 'anon-' || r.id from surveys s
      where s.id = r.survey_id and r.answers is not null and r.visitor_id !~ '^anon-' and (not s.active or s.ends_at < now())
        and coalesce(s.ends_at, (select max(x.created_at) from survey_responses x where x.survey_id = s.id)) < now() - interval '90 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('survey_answer_ids', k);
  else
    c := c || jsonb_build_object(
      'survey_declines', (select count(*) from survey_responses r join surveys s on s.id = r.survey_id
                          where r.answers is null and (not s.active or s.ends_at < now())),
      'survey_answer_ids', (select count(*) from survey_responses r join surveys s on s.id = r.survey_id
                            where r.answers is not null and r.visitor_id !~ '^anon-' and (not s.active or s.ends_at < now())
                              and coalesce(s.ends_at, (select max(x.created_at) from survey_responses x where x.survey_id = s.id)) < now() - interval '90 days'));
  end if;

  -- the idea board: an idea hidden (by three reports, or by Sam) and not restored for 90 days goes, with its votes,
  -- reports and Inbox notes (they go with their idea: on delete cascade). Sam, 2026-11-11.
  if p_apply then delete from ideas where hidden and hidden_at < now() - interval '90 days'; get diagnostics k = row_count;
  else select count(*) into k from ideas where hidden and hidden_at < now() - interval '90 days'; end if;
  c := c || jsonb_build_object('ideas_hidden', k);

  -- device-link attempts: only the last hour is read (the rate limit)
  if p_apply then delete from link_attempts where tried_at < now() - interval '7 days'; get diagnostics k = row_count;
  else select count(*) into k from link_attempts where tried_at < now() - interval '7 days'; end if;
  c := c || jsonb_build_object('link_attempts', k);

  if p_apply then
    analyze activity_pings;
    insert into retention_runs (database_mb, counts) values (round(pg_database_size(current_database()) / 1048576.0, 1), c);
  end if;
  return jsonb_build_object('applied', p_apply, 'counts', c,
    'cutoffs', jsonb_build_object('activity_pings', cut_pings, 'ui_click_reach', cut_reach, 'feature_events', cut_events,
                                  'school_year', cut_year, 'answers_packed', cut_pack));
end;
$$;
revoke all on function public.sh_retention_run(boolean) from public, anon, authenticated;

-- ====================================================================== checks (run by hand, each alone, before and after a pack)
-- Every number is a total over the class, or a count of people whose number changed; nothing per person leaves the database.
-- Before the first pack, keep the class's totals in a scratch table (admin-only):
--   create table if not exists public.zz_pack_check as
--     select x.visitor_id, x.xp, x.days, x.answers, x.correct, x.best_days, (sh_wallet(x.visitor_id)->>'earned')::int as earned,
--            (select coalesce(sum(t.base), 0) from xp_award_totals t where t.visitor_id = x.visitor_id) as base,
--            (select coalesce(sum(t.xp), 0) from xp_award_totals t where t.visitor_id = x.visitor_id) as award_xp
--     from xp_visitors x;
--   alter table public.zz_pack_check enable row level security; revoke all on public.zz_pack_check from anon, authenticated;
-- After each pack, the people whose numbers moved (0 expected) and the class's totals before and after:
--   select count(*) filter (where z.xp is distinct from x.xp or z.days is distinct from x.days or z.answers is distinct from x.answers
--            or z.correct is distinct from x.correct or z.best_days is distinct from x.best_days) as xp_moved,
--          count(*) filter (where z.earned is distinct from (sh_wallet(z.visitor_id)->>'earned')::int) as crowns_moved,
--          count(*) filter (where z.base is distinct from (select coalesce(sum(t.base), 0) from xp_award_totals t where t.visitor_id = z.visitor_id)
--            or z.award_xp is distinct from (select coalesce(sum(t.xp), 0) from xp_award_totals t where t.visitor_id = z.visitor_id)) as awards_moved,
--          sum(z.xp) as xp_before, sum(x.xp) as xp_after
--   from zz_pack_check z left join xp_visitors x using (visitor_id);
-- The awards' running totals still equal their sums (v79's check; no rows):
--   select visitor_id, src from (select visitor_id, src, count(*) n, sum(base) b, sum(xp) x from xp_awards group by 1, 2) s
--   full join (select * from xp_award_totals where n <> 0 or base <> 0 or xp <> 0) t using (visitor_id, src)
--   where s.n is distinct from t.n or s.b is distinct from t.base or s.x is distinct from t.xp;
-- Every packed answer is in a summary: sum(answers_packed.answers) per hub, against the hub's count before (the dry run's).
-- Drop zz_pack_check when the last hub due is packed.
