-- v54 (2026-11-06): the game layer's server. Written and tested on a throwaway copy of supabase/schema.sql
-- (tools/release/rls.js, tools/release/xp.js); applied to the live project at the redesign's release, not before
-- (vault/tasks/2026-11-06-redesign-release.md). Until then it is listed in supabase/pending-migrations.txt.
--
-- Section 0 fixes today's bootstrap (BUG-049, vault/release/bug-log.md). It was applied to the live project on its own on
-- 2026-11-06 (Sam's OK) and is in supabase/schema.sql; at the release it changes nothing.
--
-- What it adds (the notes: vault/tasks/2026-11-06-redesign-progression-journeys.md, -redesign-timmy-shop.md,
-- -redesign-timmys-place.md, 2026-11-06-idea-board.md; how it works: vault/reference/game-server.md):
--   1. the switch time (game_config) and each visitor's baseline at the switch, so nothing is paid twice or back paid;
--   2. question_keys: the right answer of every question, so the server decides right or wrong;
--   3. XP without a daily cap, as award rows with a unique key (xp_awards), with the guardrails (a speed limit, three
--      paying right answers per question per day), every new source (the day's 20th answer, a fixed miss, a finished
--      mock, a hub mastery medal, Timmy Time minutes, a finished arcade game, a fixed report) and the double-XP boosts;
--      Link my devices (sh_xp_rebuild) replays it all;
--   4. the 63-step ladder (three journeys: Handpiece, ModuPro, Loupes), the rank profile, boards and leaderboards with it;
--   5. Shiny Gold Crowns (worked out from XP), the shop catalog and its rotation, buy_item, equip_item, the inventory,
--      HP from snacks and floss, the rare-costume log; and since 2026-11-10 (Sam's third round,
--      vault/tasks/2026-11-10-redesign-timmys-place-round-3.md): a full set for every season, on sale in its window
--      (sh_shop_seasons), Halloween's set as everyone's gift, a set earned at every full rank-up, two throwback days a
--      month, and visiting someone's place from the boards (get_place; no opt-out, Sam 2026-11-11);
--   6. the idea board (ideas, votes, reports, statuses with Inbox notes);
--   7. the bootstrap with all of it.
--
-- Beside today's functions, not instead of them: record_personal_answer, record_achievement, get_rank_profile,
-- get_widget_bootstrap, get_pet_days, get_my_inbox, set_report_resolved and the boards keep today's rules (the 600-a-day
-- cap included) for every page that still calls them. The new pages call the *_v2 functions and the new ones below.
-- Three of today's functions are replaced with versions that behave the same while the new tables are empty:
-- sh_xp_on_insert (skips the capped answer XP for a v2 answer, which is paid by its award instead), sh_xp_rebuild
-- (adds the award rows and replays the v2 answers) and redeem_link_code (also moves the new tables).
--
-- No XP back pay (Sam, 2026-11-06): answers recorded before the switch keep what they paid, and a medal reached before it
-- earns no XP or boost. The gold crowns follow all XP, old and new (the shop opens with what XP already earned); the
-- one-time grants (trophies, medals, rank-ups) count from the switch on.
--
-- Every new table has row-level security on and no policy: only the functions below reach them.

-- ====================================================================== 0. a fix for today's bootstrap (BUG-049)
-- migration_v53's get_widget_bootstrap sent Timmy's days as bare dates (["2026-11-06"]): to_jsonb(d) over a row aliased d
-- that also has a column d turns the column into JSON, not the row. widget/pet.js then read 0 answers for every day and
-- worked out HP from this device's own tally only. Same function, same signature, the alias renamed. Applied on its own
-- on 2026-11-06, so at the release this statement changes nothing.
create or replace function public.get_widget_bootstrap(
  p_visitor text,
  p_hub text default null,
  p_cavity_week text default null,
  p_episode text default null,
  p_include_pins boolean default false,
  p_dashboard boolean default false,
  p_luck_hub text default null,
  p_luck_date date default null,
  p_link_name text default null
)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  valid_visitor boolean := p_visitor is not null and length(p_visitor) between 1 and 80;
  valid_hub boolean := p_hub is not null and p_hub ~ '^[a-z0-9][a-z0-9-]{0,39}$';
begin
  if not valid_visitor then
    return jsonb_build_object('display_name', null, 'answers', '[]'::jsonb, 'pins', '[]'::jsonb,
      'inbox', '[]'::jsonb, 'survey', '[]'::jsonb, 'overrides', '[]'::jsonb,
      'pet_days', '[]'::jsonb, 'cavity', '[]'::jsonb, 'podcast', null,
      'dashboard_week', '[]'::jsonb, 'survey_popup', '[]'::jsonb, 'exam_luck', null,
      'recaps', '[]'::jsonb, 'golden', '[]'::jsonb, 'name_shared', false, 'rank', null, 'mastery', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'display_name', get_display_name(p_visitor),
    'answers', case when valid_hub then get_my_answers(p_visitor, p_hub) else '[]'::jsonb end,
    'pins', case when valid_hub and p_include_pins then get_my_pins(p_visitor, p_hub) else '[]'::jsonb end,
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox(p_visitor) i), '[]'::jsonb),
    'survey', coalesce((select jsonb_agg(to_jsonb(s) order by s.starts_at desc) from get_my_survey(p_visitor) s), '[]'::jsonb),
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.hub) from get_hub_overrides() o), '[]'::jsonb),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days(p_visitor) pd), '[]'::jsonb),
    'cavity', case when valid_hub and p_cavity_week ~ '^\d{4}-W\d{2}$' then
      coalesce((select jsonb_agg(to_jsonb(c) order by c.claimed_at) from get_cavity_week(p_hub, p_cavity_week) c), '[]'::jsonb)
      else '[]'::jsonb end,
    'podcast', case when valid_hub and length(coalesce(p_episode, '')) between 1 and 80
      then pod_feed(p_hub, p_episode, p_visitor) else null end,
    'dashboard_week', case when p_dashboard then coalesce((
      select jsonb_agg(jsonb_build_object('answer_date', x.answer_date, 'attempts', x.attempts, 'correct', x.correct) order by x.answer_date)
      from (
        select (a.answered_at at time zone 'America/Chicago')::date as answer_date,
          count(*)::integer as attempts, count(*) filter (where a.correct)::integer as correct
        from personal_answers a
        where a.visitor_id = p_visitor
          and (a.answered_at at time zone 'America/Chicago')::date >= (now() at time zone 'America/Chicago')::date - 13
        group by 1
      ) x
    ), '[]'::jsonb) else '[]'::jsonb end,
    'survey_popup', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(s) order by s.id) from get_active_survey(p_visitor) s
    ), '[]'::jsonb) else '[]'::jsonb end,
    'exam_luck', case when p_dashboard and length(coalesce(p_luck_hub, '')) between 1 and 40 and p_luck_date is not null
      then get_exam_luck(p_luck_hub, p_luck_date, p_visitor) else null end,
    'recaps', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(r) order by r.published_at desc) from get_published_recaps() r
    ), '[]'::jsonb) else '[]'::jsonb end,
    'golden', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(g) order by g.claimed_at) from get_golden_today() g
    ), '[]'::jsonb) else '[]'::jsonb end,
    'name_shared', case when length(btrim(coalesce(p_link_name, ''))) between 1 and 24
      then name_shared(p_visitor, p_link_name) else false end,
    'rank', get_rank_profile(p_visitor),
    'mastery', case when valid_hub then
      coalesce((select jsonb_agg(to_jsonb(m) order by m.hub) from get_hub_mastery(p_visitor) m), '[]'::jsonb)
      else '[]'::jsonb end
  );
end;
$$;

-- ====================================================================== 1. the switch and the baseline
create table if not exists public.game_config (
  id boolean primary key default true check (id),
  v2_at timestamptz not null default now()          -- when the new rules started (this migration ran)
);
insert into public.game_config (id, v2_at) values (true, now()) on conflict (id) do nothing;

-- what each visitor had at the switch: the gold-crown grants count trophies, medals and rank-ups beyond it
create table if not exists public.game_baseline (
  visitor_id text primary key,
  xp integer not null default 0,
  badges text[] not null default '{}',
  at timestamptz not null default now()
);

create or replace function public.sh_v2_at()
returns timestamptz language sql stable security definer set search_path = public as $$
  select coalesce((select v2_at from game_config where id), now());
$$;

-- ====================================================================== 2. the answer keys
-- One row per question version. kind: 'one' (one right choice), 'all' (select all: the set of right choices), 'order'
-- (put in order: the right order of the authored steps), 'self' (graded by the student: recall cards, matching).
-- answer holds authored choice indexes, as record_choice gets them. counted = false keeps a question out of the hub's
-- mastery medal (review-only questions, such as Heme & Endo Exam 2's Exam 1 Refresher). Loaded from the hubs' content at
-- the release (admin_load_question_keys); the client sends the version it showed (question health's fingerprint), so a
-- page cached before an edit is still graded against the key it showed.
create table if not exists public.question_keys (
  hub text not null,
  qid text not null,
  v text not null default '',
  kind text not null check (kind in ('one', 'all', 'order', 'self')),
  answer smallint[] not null default '{}',
  counted boolean not null default true,
  is_current boolean not null default true,
  retired boolean not null default false,
  loaded_at timestamptz not null default now(),
  primary key (hub, qid, v)
);
create unique index if not exists question_keys_current on public.question_keys (hub, qid) where is_current;

create or replace function public.sh_key(p_hub text, p_qid text, p_v text)
returns setof public.question_keys language sql stable security definer set search_path = public as $$
  select * from question_keys k
  where k.hub = p_hub and k.qid = p_qid and (k.v = coalesce(p_v, '') or k.is_current)
  order by (k.v = coalesce(p_v, '')) desc, k.is_current desc
  limit 1;
$$;

-- p_keys: [{"id": "q1", "v": "<fingerprint>", "kind": "one", "answer": [2], "counted": true}, {"id": "q9", "retired": true}]
-- p_retire_missing: a current key of this hub missing from p_keys is retired (its id is out of use for good).
create or replace function public.admin_load_question_keys(p_secret text, p_hub text, p_keys jsonb, p_retire_missing boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it jsonb; v_id text; v_v text; v_kind text; v_ans smallint[]; n_loaded int := 0; n_retired int := 0; k int; ids text[] := '{}';
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then raise exception 'bad hub id'; end if;
  if jsonb_typeof(p_keys) is distinct from 'array' then raise exception 'p_keys must be a JSON array'; end if;
  for it in select * from jsonb_array_elements(p_keys) loop
    v_id := it->>'id';
    if v_id is null or length(v_id) not between 1 and 80 then raise exception 'bad question id: %', left(coalesce(v_id, 'null'), 90); end if;
    ids := ids || v_id;
    if coalesce((it->>'retired')::boolean, false) then
      update question_keys set retired = true where hub = p_hub and qid = v_id and not retired;
      get diagnostics k = row_count; n_retired := n_retired + k;
      continue;
    end if;
    v_kind := it->>'kind';
    v_v := left(coalesce(it->>'v', ''), 40);
    v_ans := array(select x::smallint from jsonb_array_elements_text(coalesce(it->'answer', '[]'::jsonb)) x);
    if v_kind = 'one' and not (cardinality(v_ans) = 1 and v_ans[1] between 0 and 19) then raise exception '%: a one-choice key needs one answer', v_id; end if;
    if v_kind = 'all' and not (cardinality(v_ans) between 1 and 20 and (select bool_and(x between 0 and 19) and count(distinct x) = count(*) from unnest(v_ans) x))
      then raise exception '%: a select-all key needs distinct answers 0-19', v_id; end if;
    if v_kind = 'order' and not (cardinality(v_ans) between 2 and 20 and (select array_agg(x order by x) from unnest(v_ans) x) = (select array_agg(g::smallint) from generate_series(0, cardinality(v_ans) - 1) g))
      then raise exception '%: an order key is the steps 0..n-1 in their right order', v_id; end if;
    if v_kind = 'self' then v_ans := '{}'; end if;
    if v_kind is null or v_kind not in ('one', 'all', 'order', 'self') then raise exception '%: bad kind %', v_id, coalesce(v_kind, 'null'); end if;
    update question_keys set is_current = false where hub = p_hub and qid = v_id and v <> v_v and is_current;
    insert into question_keys (hub, qid, v, kind, answer, counted, is_current, retired, loaded_at)
      values (p_hub, v_id, v_v, v_kind, v_ans, coalesce((it->>'counted')::boolean, true), true, false, now())
      on conflict (hub, qid, v) do update set kind = excluded.kind, answer = excluded.answer, counted = excluded.counted,
        is_current = true, retired = false, loaded_at = now();
    n_loaded := n_loaded + 1;
  end loop;
  if p_retire_missing then
    update question_keys set retired = true where hub = p_hub and is_current and not retired and not (qid = any(ids));
    get diagnostics k = row_count; n_retired := n_retired + k;
  end if;
  return jsonb_build_object('hub', p_hub, 'loaded', n_loaded, 'retired', n_retired,
    'keys', (select count(*) from question_keys where hub = p_hub and is_current and not retired));
end;
$$;

-- ====================================================================== 3. XP: awards, boosts, sessions
-- Every XP payment after the switch is a row with a unique key, so a reload, a double tap or a replayed call can't pay
-- twice. xp = base * the boost multiplier at the time; base is what the gold crowns count.
create table if not exists public.xp_awards (
  visitor_id text not null,
  key text not null,
  src text not null check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report')),
  hub text not null default '',
  base integer not null check (base > 0),
  xp integer not null check (xp >= base),
  at timestamptz not null,
  d date not null,
  primary key (visitor_id, key)
);
create index if not exists xp_awards_src on public.xp_awards (visitor_id, src, at);

-- double XP: 24 hours on each new hub mastery medal ('medal'), or bought in the shop ('shop'); never more than 2x at once
create table if not exists public.xp_boosts (
  visitor_id text not null,
  key text not null,
  src text not null check (src in ('medal', 'shop')),
  mult smallint not null default 2 check (mult between 2 and 3),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  primary key (visitor_id, key)
);

-- a mock exam or an arcade game in progress, so its answers and its end can be checked
create table if not exists public.xp_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  hub text not null,
  kind text not null check (kind in ('mock', 'arcade')),
  game text,
  started_at timestamptz not null,
  finished_at timestamptz
);
create index if not exists xp_sessions_visitor on public.xp_sessions (visitor_id, started_at);

-- what the server knew about each answer recorded by record_answer_v2 (a personal_answers row without one is a
-- record_personal_answer answer, paid by today's capped rules)
create table if not exists public.answer_xp (
  answer_id bigint primary key references public.personal_answers (id) on delete cascade,
  request_id text,
  session_id uuid,
  ctx text not null,
  kind text not null check (kind in ('one', 'all', 'order', 'self', 'unknown', 'retired')),
  resp jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists answer_xp_request on public.answer_xp (request_id) where request_id is not null;
create index if not exists answer_xp_session on public.answer_xp (session_id) where session_id is not null;

-- the boost multiplier at a moment: a boost counts from just after it starts
create or replace function public.sh_xp_mult(p_visitor text, p_at timestamptz)
returns integer language sql stable security definer set search_path = public as $$
  select least(2, coalesce(max(b.mult), 1))::integer from xp_boosts b
  where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at;
$$;

create or replace function public.sh_boost_json(p_visitor text, p_at timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when count(*) = 0 then null else jsonb_build_object('mult', least(2, max(b.mult)), 'until', max(b.ends_at),
    'src', (array_agg(b.src order by b.ends_at desc))[1]) end
  from xp_boosts b where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at;
$$;

-- pays one award once; returns the XP paid (0 when the key was paid before)
create or replace function public.sh_award(p_visitor text, p_key text, p_src text, p_hub text, p_base integer, p_mult integer, p_at timestamptz)
returns integer language plpgsql security definer set search_path = public as $$
declare paid int := coalesce(p_base, 0) * greatest(1, coalesce(p_mult, 1));
begin
  if p_visitor is null or coalesce(p_base, 0) <= 0 then return 0; end if;
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    values (p_visitor, p_key, p_src, coalesce(p_hub, ''), p_base, paid, p_at, (p_at at time zone 'America/Chicago')::date)
    on conflict (visitor_id, key) do nothing;
  if not found then return 0; end if;
  insert into xp_visitors (visitor_id, xp) values (p_visitor, paid)
    on conflict (visitor_id) do update set xp = xp_visitors.xp + excluded.xp;
  return paid;
end;
$$;

-- ---------- today's answer trigger, with one change: a v2 answer (record_answer_v2 sets sh.xp_v2) adds no capped answer
-- XP, since its award pays it. It still counts toward the day (+20 once a day, as before), the totals and the pet days.
create or replace function public.sh_xp_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  seen_inserted integer;
  raw_delta integer;
  previous_raw integer := 0;
  answer_day date;
  is_new_day boolean := false;
  new_best_days integer := 0;
  xp_delta integer;
begin
  if new.visitor_id is null or new.hub is null or new.qid is null or new.correct is null then return null; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || new.visitor_id));

  insert into xp_seen (visitor_id, hub, qid, correct)
    values (new.visitor_id, new.hub, new.qid, new.correct)
    on conflict do nothing;
  get diagnostics seen_inserted = row_count;
  raw_delta := case when new.correct and seen_inserted = 1 then 10 when new.correct then 2 else 1 end;
  if current_setting('sh.xp_v2', true) = 'on' then raw_delta := 0; end if;   -- v54: paid by its award instead
  answer_day := (new.answered_at at time zone 'America/Chicago')::date;

  loop
    previous_raw := 0;
    select raw into previous_raw from xp_days
      where visitor_id = new.visitor_id and d = answer_day for update;
    if found then
      update xp_days set n = n + 1, c = c + case when new.correct then 1 else 0 end,
        raw = raw + raw_delta
      where visitor_id = new.visitor_id and d = answer_day;
      exit;
    end if;
    begin
      insert into xp_days (visitor_id, d, n, c, raw)
        values (new.visitor_id, answer_day, 1, case when new.correct then 1 else 0 end, raw_delta);
      is_new_day := true;
      previous_raw := 0;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  if is_new_day then
    select coalesce(max(len), 0)::integer into new_best_days from (
      select count(*)::integer as len from (
        select d, d - row_number() over (order by d)::integer as grp
        from xp_days where visitor_id = new.visitor_id
      ) islands group by grp
    ) runs;
  end if;
  xp_delta := least(previous_raw + raw_delta, 600) - least(previous_raw, 600)
    + case when is_new_day then 20 else 0 end;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    values (new.visitor_id, xp_delta, case when is_new_day then 1 else 0 end, 1,
      case when new.correct then 1 else 0 end, new_best_days)
    on conflict (visitor_id) do update set
      xp = xp_visitors.xp + excluded.xp,
      days = xp_visitors.days + excluded.days,
      answers = xp_visitors.answers + excluded.answers,
      correct = xp_visitors.correct + excluded.correct,
      best_days = greatest(xp_visitors.best_days, excluded.best_days);
  return null;
end;
$$;

-- ---------- the replay: what record_answer_v2 paid for each v2 answer, worked out again from the answers alone ----------
-- The same rules as sh_answer below, in one pass: the speed limit (2 seconds since your last answer, at most 30 in a
-- minute; a mock's answers instead need 2 seconds of mock time each), three paying right (and three paying wrong)
-- answers per question per day, 10 for a question's first right answer ever, the day's 20th answer, a fixed miss, and
-- the boost multiplier at the time. For one device it gives exactly what the live calls paid (tools/release/xp.js checks);
-- after Link my devices it gives what one device with both histories would have earned.
create or replace function public.sh_xp_replay(p_ids text[])
returns table(visitor_id text, key text, src text, hub text, base integer, xp integer, at timestamptz, d date)
language sql stable security definer set search_path = public as $$
  with pa as (
    select a.id, a.visitor_id, a.hub, a.qid, a.correct, a.answered_at as t,
      (a.answered_at at time zone 'America/Chicago')::date as d,
      x.answer_id is not null as v2, x.kind, x.session_id, s.kind as s_kind, s.started_at as s_start
    from personal_answers a
    left join answer_xp x on x.answer_id = a.id
    left join xp_sessions s on s.id = x.session_id
    where a.visitor_id = any(p_ids)
  ), w as (
    select pa.*,
      lag(pa.t) over (partition by pa.visitor_id order by pa.t, pa.id) as prev_t,
      count(*) filter (where coalesce(pa.s_kind, '') <> 'mock')
        over (partition by pa.visitor_id order by pa.t range between interval '60 seconds' preceding and current row) as n60,
      row_number() over (partition by pa.session_id order by pa.t, pa.id) as s_rank,
      row_number() over (partition by pa.session_id, pa.qid order by pa.t, pa.id) as s_qrank,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d, pa.correct order by pa.t, pa.id) as rn_same,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d order by pa.t, pa.id) as rn_all,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.correct order by pa.t, pa.id) as rn_ever,
      row_number() over (partition by pa.visitor_id, pa.d order by pa.t, pa.id) as pos_day,
      lag(pa.correct) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_c,
      lag(pa.d) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_d
    from pa
  ), e as (
    select w.*,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and case
        when w.s_kind = 'mock' then w.s_qrank = 1 and w.s_rank <= 300 and w.t - w.s_start >= w.s_rank * interval '2 seconds'
        else (w.prev_t is null or w.t - w.prev_t >= interval '2 seconds') and w.n60 <= 30 end, false) as ok,
      max(case when w.prev_d is distinct from w.d then case when w.prev_c then 1 when not w.prev_c then 0 end end)
        over (partition by w.visitor_id, w.hub, w.qid, w.d) as day_prev
    from w
  ), b as (
    select e.*,
      case when not e.ok then 0
        when e.kind = 'self' then case when e.rn_all <= 3 then 2 else 0 end
        when e.correct then case when e.rn_same <= 3 then case when e.rn_ever = 1 then 10 else 2 end else 0 end
        else case when e.rn_same <= 3 then 1 else 0 end end as base_xp,
      sh_xp_mult(e.visitor_id, e.t) as mult
    from e
  )
  select b.visitor_id, 'a:' || b.id, 'answer'::text, b.hub, b.base_xp, b.base_xp * b.mult, b.t, b.d from b where b.base_xp > 0
  union all
  select g.visitor_id, 'g20:' || g.d, 'goal20'::text, g.hub, 30, 30 * g.mult, g.t, g.d from (
    select distinct on (b.visitor_id, b.d) b.visitor_id, b.d, b.hub, b.mult, b.t from b
    where b.ok and b.pos_day >= 20 order by b.visitor_id, b.d, b.t, b.id) g
  union all
  select f.visitor_id, 'fix:' || f.hub || ':' || f.qid, 'fix'::text, f.hub, 5, 5 * f.mult, f.t, f.d from (
    select distinct on (b.visitor_id, b.hub, b.qid) b.visitor_id, b.hub, b.qid, b.mult, b.t, b.d from b
    where b.ok and b.correct and b.kind <> 'self' and b.day_prev = 0 order by b.visitor_id, b.hub, b.qid, b.t, b.id) f;
$$;

-- ---------- the rebuild (after a correction, a deletion or Link my devices): today's capped XP for the answers recorded the
-- old way, the replayed awards for the v2 answers, and every other award row as it stands.
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
    select visitor_id, d, count(*)::integer, count(*) filter (where correct)::integer,
      coalesce(sum(case when v2 then 0 when correct and rn = 1 then 10 when correct then 2 else 1 end), 0)::integer
    from pa group by 1, 2;

  delete from xp_awards where visitor_id = any(p_ids) and src in ('answer', 'goal20', 'fix');
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

-- ---------- a hub mastery medal, worked out from the server-checked answers ----------
-- The share of the hub's counted questions whose latest answer is right: Bronze 50%, Silver 75%, Gold 90%, Crown 100%.
-- Each new medal pays +100/+200/+300/+500 (not boosted) and starts 24 hours of double XP (a new medal during a boost
-- restarts the 24 hours). A medal reached before the switch pays nothing (no back pay).
create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[100, 200, 300, 500]; c timestamptz; paid int; total int := 0; newest int := 0;
begin
  select count(*) into bank from question_keys k where k.hub = p_hub and k.is_current and not k.retired and k.counted;
  if bank = 0 then return null; end if;
  select count(*) filter (where l.correct) into got from (
    select distinct on (a.qid) a.qid, a.correct from personal_answers a
    where a.visitor_id = p_visitor and a.hub = p_hub order by a.qid, a.answered_at desc, a.id desc
  ) l join question_keys k on k.hub = p_hub and k.qid = l.qid and k.is_current and not k.retired and k.counted;
  lvl := case when got >= bank then 4 when got * 10 >= bank * 9 then 3 when got * 4 >= bank * 3 then 2 when got * 2 >= bank then 1 else 0 end;
  for i in 1..lvl loop
    c := null;
    select a.created_at into c from achievements a where a.visitor_id = p_visitor and a.kind = kinds[i] and a.hub = p_hub;
    if c is not null and c < sh_v2_at() then continue; end if;
    if c is null then
      insert into achievements (visitor_id, kind, hub, created_at) values (p_visitor, kinds[i], p_hub, p_at) on conflict do nothing;
    end if;
    paid := sh_award(p_visitor, 'medal:' || p_hub || ':' || i, 'medal', p_hub, pays[i], 1, p_at);
    if paid > 0 then
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'mb:' || p_hub || ':' || i, 'medal', 2, p_at, p_at + interval '24 hours')
        on conflict (visitor_id, key) do nothing;
      total := total + paid; newest := i;
    end if;
  end loop;
  if newest = 0 then return null; end if;
  return jsonb_build_object('kind', kinds[newest], 'level', newest, 'xp', total, 'boost_until', p_at + interval '24 hours');
end;
$$;

-- ---------- one answer, checked and paid by the server ----------
-- p_choice: the picked choice's authored index (one-choice questions); p_picks: the ticked indexes (select all) or the
-- order of the authored steps as placed (put in order); p_self: the student's own grade (recall cards, matching);
-- p_v: the question's version as shown; p_ctx: where it was answered (bank, drill, weak, misses, mock, arcade, check,
-- review, case); p_request: a random id per answer, so a retried or replayed call records and pays once; p_session: the
-- mock or arcade game it belongs to (xp_session_start); p_claim: the page's own verdict, used only for a question the
-- server has no key for (recorded for class stats and your progress, never paid). p_at is null except in the tests.
create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int; dp boolean;
  speed_ok boolean := false; v_base int := 0; v_mult int := 1; paid int := 0; v_n int; why text; bonus jsonb := '[]'::jsonb;
  medal jsonb; v_resp jsonb; prev record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_picks is not null and (cardinality(p_picks) > 20 or exists (select 1 from unnest(p_picks) z where z is null or z not between 0 and 19)))
     or (p_choice is not null and p_choice not between 0 and 19) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  v_ctx := case when p_ctx in ('bank', 'drill', 'weak', 'misses', 'mock', 'arcade', 'check', 'review', 'case') then p_ctx else 'other' end;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());

  -- the same answer again (a retry, a reload, a replayed call): what it got the first time, nothing new
  if p_request is not null then
    select x.resp, a.visitor_id into prev from answer_xp x join personal_answers a on a.id = x.answer_id where x.request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;

  -- right or wrong, from the key
  select * into k from sh_key(p_hub, p_qid, p_v);
  v_kind := case when k.qid is null then 'unknown' when k.retired then 'retired' else k.kind end;
  if v_kind = 'one' then
    if p_choice is null and coalesce(cardinality(p_picks), 0) <> 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := coalesce(p_choice, p_picks[1]) = k.answer[1];
  elsif v_kind = 'all' then
    if p_picks is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := (select coalesce(array_agg(distinct z order by z), '{}') from unnest(p_picks) z)
               = (select array_agg(distinct z::int order by z::int) from unnest(k.answer) z);
  elsif v_kind = 'order' then
    v_correct := p_picks is not null and p_picks = k.answer::integer[];
  elsif v_kind = 'self' then
    v_correct := coalesce(p_self, p_claim, false);
  else
    v_correct := coalesce(p_claim, false);
  end if;

  -- the mock or arcade game it belongs to: this visitor's, this hub's, started within 6 hours, not finished long ago
  if p_session is not null then
    select * into s from xp_sessions where id = p_session and visitor_id = p_visitor and hub = p_hub
      and started_at <= v_at and started_at > v_at - interval '6 hours'
      and (finished_at is null or finished_at > v_at - interval '10 minutes');
    if found then
      s_ok := true;
      select count(*), coalesce(bool_or(a.qid = p_qid), false) into s_n, s_dup
        from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = p_session;
    end if;
  end if;

  -- record it as the four calls a page makes today do: class stats, the class's picks, the right-in-a-row streak, your answers
  perform record_answer(p_hub, p_qid, v_correct);
  if p_choice is not null then perform record_choice(p_hub, p_qid, p_choice);
  elsif p_picks is not null and v_kind <> 'order' then
    if cardinality(p_picks) = 1 and v_kind <> 'all' then perform record_choice(p_hub, p_qid, p_picks[1]);
    else perform record_choices(p_hub, p_qid, p_picks); end if;
  end if;
  perform record_correct_streak(p_visitor, v_correct);
  perform set_config('sh.xp_v2', 'on', true);
  insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values (p_visitor, p_hub, p_qid, v_correct, v_at)
    returning id into aid;
  perform set_config('sh.xp_v2', 'off', true);
  insert into answer_xp (answer_id, request_id, session_id, ctx, kind)
    values (aid, p_request, case when s_ok then p_session end, v_ctx, v_kind);
  dd := (v_at at time zone 'America/Chicago')::date;

  -- the guardrails: no key, no XP; then the speed limit
  if v_kind in ('one', 'all', 'order', 'self') then
    if s_ok and s.kind = 'mock' then
      speed_ok := not s_dup and s_n + 1 <= 300 and v_at - s.started_at >= (s_n + 1) * interval '2 seconds';
    else
      select max(a.answered_at) into prev_t from personal_answers a where a.visitor_id = p_visitor and a.id <> aid and a.answered_at <= v_at;
      select count(*) into n60 from personal_answers a
        left join answer_xp x on x.answer_id = a.id left join xp_sessions ss on ss.id = x.session_id
        where a.visitor_id = p_visitor and a.answered_at >= v_at - interval '60 seconds' and a.answered_at <= v_at
          and coalesce(ss.kind, '') <> 'mock';
      speed_ok := (prev_t is null or v_at - prev_t >= interval '2 seconds') and n60 <= 30;
    end if;
    if not speed_ok then why := 'fast'; end if;
  else
    why := v_kind;
  end if;

  if speed_ok then
    select count(*) filter (where a.correct = v_correct), count(*), count(*) filter (where a.correct)
      into rn_same, rn_all, v_n
      from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date = dd;
    if v_correct then select count(*) into rn_ever from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid and a.correct; end if;
    v_base := case when v_kind = 'self' then case when rn_all <= 3 then 2 else 0 end
                   when v_correct then case when rn_same <= 3 then case when rn_ever = 1 then 10 else 2 end else 0 end
                   else case when rn_same <= 3 then 1 else 0 end end;
    if v_base = 0 then why := 'repeat'; end if;
    v_mult := sh_xp_mult(p_visitor, v_at);
    paid := sh_award(p_visitor, 'a:' || aid, 'answer', p_hub, v_base, v_mult, v_at);
    -- the day's 20th answer
    select n into pos_day from xp_days where visitor_id = p_visitor and d = dd;
    if coalesce(pos_day, 0) >= 20 then
      v_n := sh_award(p_visitor, 'g20:' || dd, 'goal20', p_hub, 30, v_mult, v_at);
      if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'goal20', 'xp', v_n); end if;
    end if;
    -- a question missed the last time you answered it before today, right today
    if v_correct and v_kind <> 'self' then
      select a.correct into dp from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date < dd order by a.answered_at desc, a.id desc limit 1;
      if found and not dp then
        v_n := sh_award(p_visitor, 'fix:' || p_hub || ':' || p_qid, 'fix', p_hub, 5, v_mult, v_at);
        if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'fix', 'xp', v_n); end if;
      end if;
    end if;
  end if;
  if v_kind in ('one', 'all', 'order', 'self') then medal := sh_medal_check(p_visitor, p_hub, v_at); end if;

  v_resp := jsonb_build_object('ok', true, 'correct', v_correct, 'kind', v_kind, 'xp', paid, 'base', v_base, 'mult', v_mult,
    'first', v_correct and rn_ever = 1 and paid > 0, 'why', why, 'bonus', bonus, 'medal', medal,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor));
  update answer_xp set resp = v_resp where answer_id = aid;
  return v_resp;
end;
$$;

create or replace function public.record_answer_v2(p_visitor text, p_hub text, p_qid text, p_choice integer default null,
  p_picks integer[] default null, p_self boolean default null, p_v text default null, p_ctx text default null,
  p_request text default null, p_session uuid default null, p_claim boolean default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_answer(null, p_visitor, p_hub, p_qid, p_choice, p_picks, p_self, p_v, p_ctx, p_request, p_session, p_claim);
$$;

-- ---------- a mock exam or an arcade game: its start, then its end ----------
create or replace function public.sh_session_start(p_at timestamptz, p_visitor text, p_hub text, p_kind text, p_game text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); sid uuid;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_kind not in ('mock', 'arcade') then return null; end if;
  if p_kind = 'arcade' and coalesce(p_game, '') not in (
    'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross',
    'board', 'cloze', 'escape') then return null; end if;   -- the games submit_arcade_score takes
  if (select count(*) from xp_sessions where visitor_id = p_visitor and started_at > v_at - interval '1 day') >= 200 then return null; end if;
  insert into xp_sessions (visitor_id, hub, kind, game, started_at)
    values (p_visitor, p_hub, p_kind, case when p_kind = 'arcade' then p_game end, v_at) returning id into sid;
  return sid;
end;
$$;

-- a mock pays +50 once per hub per day when 10 or more of its answers were recorded, and saves its score (record_mock_score)
-- from the server's own count; a game pays +50 the first time that game is finished each day, at least 20 seconds after
-- it started, and posts its score (submit_arcade_score, with its own checks). Both are boosted.
create or replace function public.sh_session_finish(p_at timestamptz, p_visitor text, p_session uuid, p_score integer, p_total integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; s record; n int := 0; nc int := 0; paid int := 0; v_mult int; dd date;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_session is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  select * into s from xp_sessions where id = p_session and visitor_id = p_visitor for update;
  if not found or s.started_at > v_at or s.started_at < v_at - interval '6 hours' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', true, 'repeat', true, 'xp', 0); end if;
  update xp_sessions set finished_at = v_at where id = s.id;
  v_mult := sh_xp_mult(p_visitor, v_at);
  dd := (v_at at time zone 'America/Chicago')::date;
  if s.kind = 'mock' then
    select count(*), count(*) filter (where a.correct) into n, nc
      from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = s.id;
    if n >= 10 then paid := sh_award(p_visitor, 'mock:' || s.hub || ':' || dd, 'mock', s.hub, 50, v_mult, v_at); end if;
    if n > 0 then perform record_mock_score(p_visitor, s.hub, nc, least(300, greatest(n, coalesce(p_total, n)))); end if;
    return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult, 'answers', n, 'correct', nc);
  end if;
  if v_at - s.started_at >= interval '20 seconds' then
    paid := sh_award(p_visitor, 'arc:' || s.hub || ':' || s.game || ':' || dd, 'arcade', s.hub, 50, v_mult, v_at);
  end if;
  if p_score is not null then perform submit_arcade_score(p_visitor, s.hub, s.game, p_score); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult);
end;
$$;

create or replace function public.xp_session_start(p_visitor text, p_hub text, p_kind text, p_game text default null)
returns uuid language sql volatile security definer set search_path = public as $$
  select sh_session_start(null, p_visitor, p_hub, p_kind, p_game);
$$;
create or replace function public.xp_session_finish(p_visitor text, p_session uuid, p_score integer default null, p_total integer default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_session_finish(null, p_visitor, p_session, p_score, p_total);
$$;

-- ---------- Timmy Time: 10 XP per minute of an episode heard for the first time, +100 for finishing it ----------
-- The player reports each minute as it's heard (its index from 0). A minute counts once ever, at most one minute every
-- 25 seconds (2x speed with room), only within the episode's length; finishing is hearing 90% of its minutes.
create table if not exists public.podcast_episodes (
  hub text not null,
  episode text not null,
  seconds integer not null check (seconds between 60 and 14400),
  primary key (hub, episode)
);

create or replace function public.admin_set_podcast_episode(p_secret text, p_hub text, p_ep text, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' or p_ep !~ '^[a-z0-9][a-z0-9-]{0,59}$' or p_seconds not between 60 and 14400 then
    raise exception 'bad episode'; end if;
  insert into podcast_episodes (hub, episode, seconds) values (p_hub, p_ep, p_seconds)
    on conflict (hub, episode) do update set seconds = excluded.seconds;
  return true;
end;
$$;

create or replace function public.sh_pod_minute(p_at timestamptz, p_visitor text, p_hub text, p_ep text, p_minute integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; e record; mins int; last_at timestamptz; v_mult int; paid int := 0; done int := 0; heard int;
  pre text := 'pod:' || coalesce(p_hub, '') || ':' || coalesce(p_ep, '') || ':';
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_ep is null or p_minute is null then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select * into e from podcast_episodes where hub = p_hub and episode = p_ep;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  mins := ceil(e.seconds / 60.0)::int;
  if p_minute < 0 or p_minute >= mins then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  if exists (select 1 from xp_awards where visitor_id = p_visitor and key = pre || p_minute) then
    return jsonb_build_object('ok', true, 'xp', 0, 'repeat', true); end if;
  select max(at) into last_at from xp_awards where visitor_id = p_visitor and src = 'pod-min';
  if last_at is not null and v_at - last_at < interval '25 seconds' then return jsonb_build_object('ok', true, 'xp', 0, 'why', 'fast'); end if;
  v_mult := sh_xp_mult(p_visitor, v_at);
  paid := sh_award(p_visitor, pre || p_minute, 'pod-min', p_hub, 10, v_mult, v_at);
  select count(*) into heard from xp_awards where visitor_id = p_visitor and src = 'pod-min' and left(key, length(pre)) = pre;
  if heard >= ceil(mins * 0.9) then done := sh_award(p_visitor, 'pod-done:' || p_hub || ':' || p_ep, 'pod-done', p_hub, 100, v_mult, v_at); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'done', done, 'mult', v_mult, 'heard', heard, 'of', mins);
end;
$$;

create or replace function public.pod_minute_v2(p_visitor text, p_hub text, p_ep text, p_minute integer)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_pod_minute(null, p_visitor, p_hub, p_ep, p_minute);
$$;

-- ---------- a report or suggestion fixed: +100 to the person who sent it ----------
-- Sam resolves it on the admin page as "Fixed" (pays, once per report, to the sender's linked id) or "No change needed"
-- (pays nothing); "open" takes it back to unresolved (an award already paid stays). The reply reaches the sender as now.
create table if not exists public.report_outcomes (
  kind text not null check (kind in ('flag', 'suggestion')),
  report_id bigint not null,
  outcome text not null check (outcome in ('fixed', 'no-change')),
  set_at timestamptz not null default now(),
  primary key (kind, report_id)
);

create or replace function public.admin_resolve_report_v2(p_secret text, p_kind text, p_id bigint, p_outcome text, p_reply text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sender text; v_hub text; paid int := 0;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_kind not in ('flag', 'suggestion') or p_outcome not in ('fixed', 'no-change', 'open') then raise exception 'bad kind or outcome'; end if;
  if p_kind = 'flag' then select visitor_id, hub into sender, v_hub from question_flags where id = p_id;
  else select visitor_id, hub into sender, v_hub from hub_suggestions where id = p_id; end if;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  perform set_report_resolved(p_secret, p_kind, p_id, p_outcome <> 'open', p_reply);
  if p_outcome = 'open' then
    delete from report_outcomes where kind = p_kind and report_id = p_id;
    return jsonb_build_object('ok', true, 'outcome', 'open', 'xp', 0);
  end if;
  insert into report_outcomes (kind, report_id, outcome) values (p_kind, p_id, p_outcome)
    on conflict (kind, report_id) do update set outcome = excluded.outcome, set_at = now();
  if p_outcome = 'fixed' and sender is not null then
    sender := coalesce((select primary_id from visitor_links where alias_id = sender), sender);
    paid := sh_award(sender, 'rep:' || p_kind || ':' || p_id, 'report', v_hub, 100, 1, now());
  end if;
  return jsonb_build_object('ok', true, 'outcome', p_outcome, 'xp', paid);
end;
$$;

-- the admin page's Inbox, with each report's outcome and whether its XP was paid
create or replace function public.get_reports_v2(p_secret text)
returns table(kind text, id bigint, hub text, note text, resolved boolean, created_at timestamptz,
              reply text, resolved_at timestamptz, can_notify boolean, reply_seen_at timestamptz, outcome text, xp_paid boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select r.kind, r.id, r.hub, r.note, r.resolved, r.created_at, r.reply, r.resolved_at, r.can_notify, r.reply_seen_at, o.outcome,
    exists (select 1 from xp_awards w where w.src = 'report' and w.key = 'rep:' || r.kind || ':' || r.id)
  from get_reports(p_secret) r left join report_outcomes o on o.kind = r.kind and o.report_id = r.id
  order by r.created_at desc;
end;
$$;

-- ====================================================================== 4. the ladder: three journeys, 63 steps
-- Handpiece (0-125,000, exactly today's 21 steps), ModuPro (125,000-250,000) and Loupes (250,000-375,000), each seven
-- tiers (Stone ... Dark Matter) of three levels; the later two evenly spaced (about 17,900 a tier). The floors of every step:
create or replace function public.sh_rank(p_xp integer)
returns table(journey integer, tier integer, level integer, step integer, gtier integer, step_at integer, next_at integer, tier_at integer)
language sql immutable set search_path = public as $$
  with f as (select '{0,100,200,300,700,1100,1500,2666,3833,5000,7333,9666,12000,16333,20666,25000,33333,41666,50000,75000,100000,
    125000,130952,136904,142857,148809,154761,160714,166666,172618,178571,184523,190475,196428,202380,208332,214285,220237,226189,
    232142,238094,244047,250000,255952,261904,267857,273809,279761,285714,291666,297618,303571,309523,315475,321428,327380,333332,
    339285,345237,351189,357142,363094,369047,375000}'::integer[] as a),
  s as (select f.a, least(62, greatest(0, (select count(*)::integer from unnest(f.a[1:63]) z where z <= greatest(coalesce(p_xp, 0), 0)) - 1)) as st from f)
  select s.st / 21, (s.st % 21) / 3, s.st % 3 + 1, s.st, s.st / 3, s.a[s.st + 1], case when s.st < 62 then s.a[s.st + 2] end, s.a[(s.st / 3) * 3 + 1] from s;
$$;

-- today's profile, with the journey, its step on the 63-step ladder, the journey trophies (one per journey finished),
-- the boost running now, and which Dark Matter unlocks this visitor has seen
create or replace function public.get_rank_profile_v2(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p jsonb := get_rank_profile(p_visitor); v_xp int := coalesce((p->>'xp')::integer, 0); r record; b jsonb; j int; seen int[] := '{}';
begin
  select * into r from sh_rank(v_xp);
  b := coalesce(p->'badges', '[]'::jsonb);
  for j in 0..2 loop
    if v_xp >= 125000 * (j + 1) then b := b || to_jsonb('journey-' || j); end if;
  end loop;
  select coalesce(array_agg(substr(a.kind, 11)::integer order by a.kind), '{}') into seen
    from achievements a where a.visitor_id = p_visitor and a.kind like 'dark-seen-%';
  return p || jsonb_build_object('journey', r.journey, 'tier', r.tier, 'level', r.level, 'step', r.step, 'gtier', r.gtier,
    'step_at', r.step_at, 'next_at', r.next_at, 'tier_at', r.tier_at, 'steps', 63, 'badges', b,
    'boost', case when p_visitor is null then null else sh_boost_json(p_visitor, clock_timestamp()) end,
    'dark_seen', to_jsonb(seen));
end;
$$;

-- the Dark Matter unlock plays once per journey, ever: the page calls this when it has played it
create or replace function public.mark_dark_unlock_seen(p_visitor text, p_journey integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_journey not between 0 and 2 then return false; end if;
  select * into r from sh_rank(coalesce((select xp from xp_visitors where visitor_id = p_visitor), 0));
  if not (r.journey > p_journey or (r.journey = p_journey and r.tier >= 6)) then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, 'dark-seen-' || p_journey, '') on conflict do nothing;
  return found;
end;
$$;

-- Visiting (Sam, 2026-11-10: "Its on by default and you visit from the boards"; 2026-11-11: no one can turn it off). The
-- boards never give out a visitor id, so every row of the four boards below carries a visit key instead (`visit`): an
-- opaque digest of the person's id with a secret only the server holds. get_place(key) opens that person's place. The
-- secret is one random value made when this migration runs; nobody but the functions here can read it, so a key can't be
-- worked out from an id, or an id from a key.
create table if not exists public.visit_secret (
  id boolean primary key default true check (id),
  secret text not null
);
insert into public.visit_secret (id, secret)
  values (true, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (id) do nothing;

-- a person's visit key: 24 hex characters, the same every time. Private: only the functions in this file call it.
create or replace function public.sh_visit_key(p_visitor text)
returns text language sql stable security definer set search_path = public as $$
  select left(encode(sha256(convert_to(s.secret || ':' || p_visitor, 'UTF8')), 'hex'), 24) from visit_secret s where s.id;
$$;

-- what a board row carries: the person's key (everyone on a board has one: visiting can't be turned off)
create or replace function public.sh_visit_link(p_visitor text)
returns text language sql stable security definer set search_path = public as $$
  select case when p_visitor is null then null else sh_visit_key(p_visitor) end;
$$;

create or replace function public.get_rank_board_v2(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, journey integer, tier integer, level integer, step integer, is_me boolean, flair text, visit text)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from xp_visitors v),
  top as (select * from r where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor))
  select t.rnk, coalesce(vn.display_name, anon_name(t.visitor_id)), t.xp, k.journey, k.tier, k.level, k.step,
    (p_visitor is not null and t.visitor_id = p_visitor), sh_mastery_flair(t.visitor_id), sh_visit_link(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id cross join lateral sh_rank(t.xp) k
  order by t.rnk;
$$;

create or replace function public.get_leaderboard_v2(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with islands as (
    select x.visitor_id, x.d, x.d - (row_number() over (partition by x.visitor_id order by x.d))::int as grp from xp_days x
  ), streaks as (
    select i.visitor_id, count(*)::int as len, max(i.d) as last_day from islands i group by i.visitor_id, i.grp
  ), current_streaks as (
    select s.visitor_id, max(s.len) as streak from streaks s
    where s.last_day >= (now() at time zone 'America/Chicago')::date - 1 group by s.visitor_id
  ), top as (
    select cs.visitor_id, cs.streak, coalesce(v.answers, 0) as total_answered, coalesce(v.xp, 0) as xp
    from current_streaks cs left join xp_visitors v on v.visitor_id = cs.visitor_id
    where cs.streak >= 2
    order by cs.streak desc, 3 desc
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  select coalesce(vn.display_name, anon_name(t.visitor_id)), t.streak::int, t.total_answered::int,
    k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id), sh_visit_link(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id cross join lateral sh_rank(t.xp) k
  order by t.streak desc, t.total_answered desc;
end;
$$;

create or replace function public.get_correct_streak_stats_v2()
returns table(kind text, display_name text, streak integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with top as (
    (select 'active'::text as k, s.visitor_id, s.current_streak as n, 1 as ord
       from correct_streaks s where s.current_streak > 0 order by s.current_streak desc limit 1)
    union all
    (select 'record'::text, s.visitor_id, s.best_streak, 2
       from correct_streaks s where s.best_streak > 0 order by s.best_streak desc limit 1)
  )
  select t.k, coalesce(vn.display_name, anon_name(t.visitor_id)), t.n, k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id),
    sh_visit_link(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id
  left join xp_visitors v on v.visitor_id = t.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  order by t.ord;
end;
$$;

create or replace function public.get_arcade_leaderboard_v2(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
    (p_visitor is not null and r.visitor_id = p_visitor), k.journey, k.tier, k.level, k.step, sh_mastery_flair(r.visitor_id),
    sh_visit_link(r.visitor_id)
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join xp_visitors v on v.visitor_id = r.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

-- someone's place, opened with the visit key from a board row. Only what a place shows: the leaderboard name exactly as
-- the boards show it, what stands in each slot (the home, the scene, the five yard spots, the upgrades and paint, the
-- outfit), the rank (journey, tier, level) and the mastery flair the boards already show. Never the visitor id, XP as a
-- number, HP, snacks, the streak, answers, the wallet, the inventory, or any date or time. An unknown key gives null.
-- The search covers everyone a board can list.
create or replace function public.get_place(p_key text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text; k record;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{24}$' then return null; end if;
  select z.visitor_id into v from (
    select x.visitor_id from xp_visitors x
    union select c.visitor_id from correct_streaks c
    union select a.visitor_id from arcade_scores a
  ) z where sh_visit_key(z.visitor_id) = p_key limit 1;
  if v is null then return null; end if;
  select * into k from sh_rank(coalesce((select x.xp from xp_visitors x where x.visitor_id = v), 0));
  return jsonb_build_object(
    'name', coalesce((select vn.display_name from visitor_names vn where vn.visitor_id = v), anon_name(v)),
    'equipped', coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = v), '{}'::jsonb),
    'rank', jsonb_build_object('journey', k.journey, 'tier', k.tier, 'level', k.level),
    'flair', sh_mastery_flair(v));
end;
$$;

-- trophy rarity with the journey trophies, without the Dark Matter "seen" marks (they aren't trophies)
create or replace function public.get_trophy_stats_v2()
returns table(kind text, n integer, total integer)
language sql stable security definer set search_path = public as $$
  select t.kind, t.n, t.total from get_trophy_stats() t where t.kind not like 'dark-seen-%'
  union all
  select 'journey-' || j, count(*) filter (where v.xp >= 125000 * (j + 1))::integer, count(*)::integer
  from generate_series(0, 2) j cross join xp_visitors v group by j;
$$;

-- ====================================================================== 5. Shiny Gold Crowns and Timmy's shop
-- The catalog. kind: outfit (Timmy wears one at a time), costume (a rare costume: on sale to someone who has spotted it),
-- home, scene, yard (one of the five yard spots), upgrade (its own slot on the home), snack (HP at once), boost (double XP).
-- Prices follow the rarity's band. season: one of a season's set, on sale only in that season's window (sh_shop_seasons),
-- and now and then on a throwback day. wide: a yard item that takes two spots (the bowling lane: the side yard and the
-- front corner; tools/figures/site/place.mjs draws it).
-- gift: everyone owns it from the start, with no row in pet_inventory (Sam, 2026-11-10: "only Halloween 2026's set is free
-- for everyone"); it is never sold. rank_tier: one of a rank set (Sam: "timmy outfit and a decoration only. Do rank only"),
-- owned by everyone whose rank has reached that tier (sh_rank's gtier: 1 Antique ... 6 Dark Matter of the Handpiece, 7-13
-- the ModuPro, 14-20 the Loupes); earned, never sold, so its price is 0 and it is on no shelf.
create table if not exists public.shop_items (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  name text not null,
  kind text not null check (kind in ('outfit', 'costume', 'home', 'scene', 'yard', 'upgrade', 'snack', 'boost')),
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  price integer not null,
  season text check (season in ('halloween', 'thanksgiving', 'winter', 'newyear', 'mardigras', 'valentine', 'toothfairy', 'dentist',
    'stpatrick', 'easter', 'spring', 'july4', 'summer', 'fall')),
  slot text check (slot in ('windows', 'porch', 'chimney', 'flag', 'paint')),
  hp integer check (hp between 1 and 50),
  boost_minutes integer check (boost_minutes between 15 and 720),
  boost_mult smallint check (boost_mult between 2 and 3),
  shelf boolean not null default false,          -- always on sale (snacks, floss, boosts)
  rotates boolean not null default true,         -- can come up in the daily and weekly picks
  active boolean not null default true,
  sort integer not null default 0,
  wide boolean not null default false,
  gift boolean not null default false,           -- everyone owns it (Halloween 2026's set)
  rank_tier smallint check (rank_tier between 1 and 20),   -- owned from this global tier on (a rank set)
  added_on date not null default current_date,   -- the day it joined the catalog: a throwback needs its season to have run since
  check ((rank_tier is not null and price = 0) or (rank_tier is null and (
         (rarity = 'common' and price between 100 and 200) or (rarity = 'uncommon' and price between 250 and 500)
      or (rarity = 'rare' and price between 600 and 1200) or (rarity = 'epic' and price between 1500 and 3000)
      or (rarity = 'legendary' and price between 4000 and 8000)))),
  check (rank_tier is null or (kind in ('outfit', 'yard') and season is null and not gift and not shelf and not rotates)),
  check (not gift or kind not in ('snack', 'boost')),
  check ((kind = 'upgrade') = (slot is not null)),
  check ((kind = 'snack') = (hp is not null)),
  check ((kind = 'boost') = (boost_minutes is not null and boost_mult is not null)),
  check (not wide or kind = 'yard')
);

-- Everything bought, once per tap (request_id). Spending is the sum of price; it never lowers XP or rank.
create table if not exists public.pet_purchases (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  item_id text not null references public.shop_items (id),
  kind text not null,
  price integer not null check (price >= 0),
  hp integer,
  request_id text not null unique,
  bought_at timestamptz not null default now(),
  day date not null,
  resp jsonb
);
create index if not exists pet_purchases_visitor on public.pet_purchases (visitor_id, day);

-- what's owned for good (everything but snacks and boosts)
create table if not exists public.pet_inventory (
  visitor_id text not null,
  item_id text not null references public.shop_items (id),
  bought_at timestamptz not null default now(),
  primary key (visitor_id, item_id)
);

-- what Timmy wears and where his things stand, the same on every linked device. The five yard spots, as the art names
-- them: yard-left and yard-front by the path, yard-corner (the front corner), yard-side (the side yard), yard-right (the
-- back corner).
create table if not exists public.pet_equipped (
  visitor_id text not null,
  slot text not null check (slot in ('outfit', 'home', 'scene', 'yard-left', 'yard-front', 'yard-corner', 'yard-side',
    'yard-right', 'windows', 'porch', 'chimney', 'flag', 'paint')),
  item_id text not null references public.shop_items (id),
  set_at timestamptz not null default now(),
  primary key (visitor_id, slot)
);

-- the "you" panel's costume log: the first sighting of each rare costume (at most one new one a day)
create table if not exists public.costume_log (
  visitor_id text not null,
  costume text not null references public.shop_items (id),
  first_day date not null,
  primary key (visitor_id, costume)
);

-- Easter Sunday of a year (the Gregorian computus), for sh_season and sh_shop_seasons
create or replace function public.sh_easter(p_year integer)
returns date language plpgsql immutable set search_path = public as $$
declare y int := p_year; a int; b int; c int; dd int; e int; ff int; g int; h int; i int; k int; l int; mm int;
begin
  a := y % 19; b := y / 100; c := y % 100; dd := b / 4; e := b % 4; ff := (b + 8) / 25; g := (b - ff + 1) / 3;
  h := (19 * a + b - dd - g + 15) % 30; i := c / 4; k := c % 4; l := (32 + 2 * e + 2 * i - h - k) % 7; mm := (a + 11 * h + 22 * l) / 451;
  return make_date(y, (h + l - 7 * mm + 114) / 31, ((h + l - 7 * mm + 114) % 31) + 1);
end;
$$;

-- the holidays and the fall weeks by Central date, in step with holidayId() and isFall() in widget/pet.js: the days Timmy
-- dresses up by himself. (When a season's set is on sale is sh_shop_seasons, below: longer for the short holidays.)
create or replace function public.sh_season(p_day date)
returns text language plpgsql immutable set search_path = public as $$
declare y int := extract(year from p_day); m int := extract(month from p_day); x int := m * 100 + extract(day from p_day)::int;
  f date; tg_end date; easter date;
begin
  if x between 1001 and 1031 then return 'halloween'; end if;
  f := make_date(y, 11, 1);
  tg_end := f + ((4 - extract(dow from f)::int + 7) % 7) + 21 + 1;      -- the day after the fourth Thursday of November
  if m = 11 and p_day <= tg_end then return 'thanksgiving'; end if;
  if p_day > tg_end and x between 1101 and 1226 then return 'winter'; end if;
  if x = 1231 or x <= 102 then return 'newyear'; end if;
  if x between 210 and 214 then return 'valentine'; end if;
  if x = 306 then return 'dentist'; end if;
  if x between 314 and 317 then return 'stpatrick'; end if;
  easter := sh_easter(y);
  if p_day between easter - 6 and easter + 1 then return 'easter'; end if;
  return null;
end;
$$;
create or replace function public.sh_is_fall(p_day date)
returns boolean language sql immutable set search_path = public as $$
  select (extract(month from p_day) * 100 + extract(day from p_day)) between 922 and 1130;
$$;

-- every season whose set is on sale on a Central date (Sam, 2026-11-10); several can be on at once, the holidays first.
--   halloween Oct 1-31; thanksgiving Nov 1 to the day after the fourth Thursday; winter from the day after that to Dec 26
--   (these three as sh_season has them);
--   the short holidays for the 7 days ending on their last day: newyear Dec 27 - Jan 2, valentine Feb 8-14, toothfairy
--   Feb 22-28, dentist the 7 days ending Mar 6, stpatrick Mar 11-17, july4 Jun 28 - Jul 4, mardigras the 7 days ending on
--   Fat Tuesday (47 days before Easter);
--   easter from 6 days before Easter to the day after (as sh_season);
--   spring Mar 20 - May 31, summer Jun 1 - Sep 21, fall Sep 22 - Nov 30 (sh_is_fall).
create or replace function public.sh_shop_seasons(p_day date)
returns text[] language plpgsql immutable set search_path = public as $$
declare y int := extract(year from p_day); x int := extract(month from p_day)::int * 100 + extract(day from p_day)::int;
  f date := make_date(y, 11, 1); tg_end date; easter date := sh_easter(y); r text[] := '{}';
begin
  if p_day is null then return r; end if;
  tg_end := f + ((4 - extract(dow from f)::int + 7) % 7) + 21 + 1;      -- the day after the fourth Thursday of November
  if x between 1001 and 1031 then r := r || 'halloween'::text; end if;
  if x >= 1101 and p_day <= tg_end then r := r || 'thanksgiving'::text; end if;
  if p_day > tg_end and x <= 1226 then r := r || 'winter'::text; end if;
  if x >= 1227 or x <= 102 then r := r || 'newyear'::text; end if;
  if p_day between easter - 53 and easter - 47 then r := r || 'mardigras'::text; end if;
  if x between 208 and 214 then r := r || 'valentine'::text; end if;
  if x between 222 and 228 then r := r || 'toothfairy'::text; end if;
  if p_day between make_date(y, 3, 6) - 6 and make_date(y, 3, 6) then r := r || 'dentist'::text; end if;
  if x between 311 and 317 then r := r || 'stpatrick'::text; end if;
  if p_day between easter - 6 and easter + 1 then r := r || 'easter'::text; end if;
  if x between 628 and 704 then r := r || 'july4'::text; end if;
  if x between 320 and 531 then r := r || 'spring'::text; end if;
  if x between 601 and 921 then r := r || 'summer'::text; end if;
  if x between 922 and 1130 then r := r || 'fall'::text; end if;
  return r;
end;
$$;

-- throwback days (Sam, 2026-11-10: "two throwback days a month, the same for everyone"): one day in the month's first
-- half (the 1st to the 14th) and one in its second (the 15th to the 28th), worked out from the year and month alone.
create or replace function public.sh_throwback_days(p_day date)
returns integer[] language sql immutable set search_path = public as $$
  select array[1 + (('x' || '00000000' || substr(h.m, 1, 8))::bit(64)::bigint % 14)::integer,
               15 + (('x' || '00000000' || substr(h.m, 9, 8))::bit(64)::bigint % 14)::integer]
  from (select md5('throwback:' || extract(year from p_day)::integer || '-' || lpad(extract(month from p_day)::integer::text, 2, '0')) as m) h;
$$;
create or replace function public.sh_is_throwback(p_day date)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(extract(day from p_day)::integer = any(sh_throwback_days(p_day)), false);
$$;

-- the rotation, the same for everyone and worked out from the Central date: 3 weekly items (new every Monday), then 4 daily
-- ones (new at midnight, never one of the week's), each a weighted draw where rarer items come up less often; plus the sets
-- of the seasons on sale, a throwback day's three, and the shelf (snacks, floss, boosts). Deterministic: the same day gives
-- the same shop. The daily and weekly draws never hold a seasonal item, a gift or a rank item.
create or replace function public.sh_shop_pick(p_seed text, p_n integer, p_exclude text[])
returns table(item_id text, pos integer) language sql stable security definer set search_path = public as $$
  select z.id, (row_number() over (order by z.k, z.id))::integer from (
    select i.id, -ln((('x' || '00000000' || substr(md5(p_seed || ':' || i.id), 1, 8))::bit(64)::bigint + 0.5) / 4294967296.0)
      / case i.rarity when 'common' then 10 when 'uncommon' then 6 when 'rare' then 3 when 'epic' then 1.5 else 0.6 end as k
    from shop_items i
    where i.active and i.rotates and i.season is null and not i.gift and i.rank_tier is null
      and i.kind not in ('snack', 'boost', 'costume')
      and not (i.id = any(coalesce(p_exclude, '{}')))
  ) z order by z.k, z.id limit greatest(0, p_n);
$$;

-- has this season been on sale on some day from p_since up to the day before p_day? (Sam, 2026-11-10: holiday content
-- is never in the shop before its own dates, so a throwback can only bring back a season that has already had a run
-- since its items joined the catalog.) It looks back 400 days: more than the longest gap between two Easters' weeks.
create or replace function public.sh_season_was_on(p_season text, p_since date, p_day date)
returns boolean language sql stable set search_path = public as $$
  select exists (select 1 from generate_series(greatest(p_since, p_day - 400), p_day - 1, interval '1 day') g
                 where p_season = any(sh_shop_seasons(g::date)));
$$;

-- a throwback day's "Back for today" shelf: up to 3 seasonal items whose season is not on sale that day but has been
-- since the items joined the catalog (so nothing is sold before its season's first run), at their usual price.
-- The same weighted draw as the daily picks, seeded by the date; homes and scenes come up least (their weight is 0.4 of
-- their rarity's). Never a gift (everyone has it) or a rank item. No rows on any other day.
create or replace function public.sh_throwback_items(p_day date)
returns table(item_id text, pos integer) language sql stable security definer set search_path = public as $$
  select z.id, (row_number() over (order by z.k, z.id))::integer from (
    select i.id, -ln((('x' || '00000000' || substr(md5('throwback:' || p_day || ':' || i.id), 1, 8))::bit(64)::bigint + 0.5) / 4294967296.0)
      / (case i.rarity when 'common' then 10 when 'uncommon' then 6 when 'rare' then 3 when 'epic' then 1.5 else 0.6 end
         * case when i.kind in ('home', 'scene') then 0.4 else 1 end) as k
    from shop_items i
    where sh_is_throwback(p_day) and i.active and i.season is not null and not i.gift and i.rank_tier is null
      and i.kind not in ('snack', 'boost', 'costume') and not (i.season = any(sh_shop_seasons(p_day)))
      and (i.season, i.added_on) in (select s.season, s.added_on from (select distinct season, added_on from shop_items where season is not null) s
                                     where sh_season_was_on(s.season, s.added_on, p_day))
  ) z order by z.k, z.id limit 3;
$$;

create or replace function public.sh_shop_day(p_day date)
returns table(item_id text, shelf text, pos integer) language plpgsql stable security definer set search_path = public as $$
declare wk text[]; ssn text[] := sh_shop_seasons(p_day);
begin
  wk := array(select w.item_id from sh_shop_pick('week:' || date_trunc('week', p_day)::date, 3, null) w order by w.pos);
  return query
    select w.item_id, 'weekly'::text, w.pos::integer from unnest(wk) with ordinality w(item_id, pos)
    union all select d.item_id, 'daily', d.pos from sh_shop_pick('day:' || p_day, 4, wk) d
    union all select i.id, 'season', (row_number() over (order by array_position(ssn, i.season), i.sort, i.id))::integer from shop_items i
      where i.active and i.season = any(ssn)
    union all select t.item_id, 'throwback', t.pos from sh_throwback_items(p_day) t
    union all select i.id, 'always', (row_number() over (order by i.sort, i.id))::integer from shop_items i where i.active and i.shelf;
end;
$$;

-- What someone owns, decided in this one place: what they bought (a row in pet_inventory), every gift (Halloween 2026's
-- set, everyone's), and every rank item whose tier their rank has reached (so the sets of ranks already passed are theirs
-- with no rows written). Gifts and rank items count while they are active in the catalog. `how` says which: 'bought',
-- 'gift' or 'rank'; `at` is when it was bought (null for the other two).
create or replace function public.sh_owned(p_visitor text)
returns table(item_id text, how text, at timestamptz) language sql stable security definer set search_path = public as $$
  with me as (select (select k.gtier from sh_rank(coalesce((select x.xp from xp_visitors x where x.visitor_id = p_visitor), 0)) k) as g)
  select i.id, case when v.item_id is not null then 'bought' when i.gift then 'gift' else 'rank' end, v.bought_at
  from shop_items i cross join me
  left join pet_inventory v on v.visitor_id = p_visitor and v.item_id = i.id
  where p_visitor is not null
    and (v.item_id is not null or (i.active and (i.gift or (i.rank_tier is not null and i.rank_tier <= me.g))));
$$;
create or replace function public.sh_owns(p_visitor text, p_item text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from sh_owned(p_visitor) o where o.item_id = p_item);
$$;

-- one visitor's shop today: the shared one, plus one rare costume they've spotted and don't own yet ('spotted')
create or replace function public.sh_shop_for(p_visitor text, p_day date)
returns table(item_id text, shelf text, pos integer) language sql stable security definer set search_path = public as $$
  select * from sh_shop_day(p_day)
  union all
  select c.costume, 'spotted', 1 from costume_log c join shop_items i on i.id = c.costume and i.active
  where p_visitor is not null and c.visitor_id = p_visitor and not sh_owns(p_visitor, c.costume)
  order by 2, 3 limit 100;
$$;

-- Shiny Gold Crowns, worked out by the server: 1 per 10 XP of base XP (a boost's extra earns none), plus 25 per trophy,
-- 50 per mastery medal and 20 per rank-up reached since the switch; minus what was spent. Balance = earned - spent.
create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[]; m_now text[]; m_was text[];
  n_t int; n_m int; n_r int; earned int; spent int;
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  select coalesce(sum(a.xp - a.base), 0) into extra from xp_awards a where a.visitor_id = p_visitor;
  base_xp := greatest(0, v_xp - extra);
  select * into bl from game_baseline where visitor_id = p_visitor;
  badges := array(select jsonb_array_elements_text(coalesce(get_rank_profile_v2(p_visitor)->'badges', '[]'::jsonb)));
  t_now := array(select distinct split_part(b, ':', 1) from unnest(badges) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  t_was := array(select distinct split_part(b, ':', 1) from unnest(coalesce(bl.badges, '{}')) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  m_now := array(select b from unnest(badges) b where b like 'mastery-%:%');
  m_was := array(select b from unnest(coalesce(bl.badges, '{}')) b where b like 'mastery-%:%');
  n_t := (select count(*) from unnest(t_now) z where not (z = any(t_was)));
  n_m := (select count(*) from unnest(m_now) z where not (z = any(m_was)));
  n_r := greatest(0, (select gtier from sh_rank(v_xp)) - (select gtier from sh_rank(coalesce(bl.xp, 0))));
  earned := base_xp / 10 + 25 * n_t + 50 * n_m + 20 * n_r;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 10,
    'trophies', n_t, 'medals', n_m, 'rankups', n_r);
end;
$$;

-- one visitor's shop, wallet, things and what's on today; with no visitor, just today's shop. `seasons` are the sets on
-- sale today and `throwback` says whether today is a throwback day. `inventory` is everything owned, each with how it is
-- owned ('bought', 'gift' or 'rank'); `locked` lists the rank items not reached yet, with the tier that unlocks each
-- ("Unlocks at Silver").
-- sh_my_shop takes the Central date (the tests set it; null = today); get_my_shop is what a page calls.
create or replace function public.sh_my_shop(p_day date, p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); ok boolean := p_visitor is not null and length(p_visitor) between 1 and 80;
  v text := case when p_visitor is not null and length(p_visitor) between 1 and 80 then p_visitor end;
begin
  return jsonb_build_object(
    'day', dd,
    'seasons', to_jsonb(sh_shop_seasons(dd)),
    'throwback', sh_is_throwback(dd),
    'wallet', case when ok then sh_wallet(p_visitor) end,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'kind', i.kind, 'rarity', i.rarity, 'price', i.price,
        'season', i.season, 'slot', i.slot, 'hp', i.hp, 'boost_minutes', i.boost_minutes, 'boost_mult', i.boost_mult, 'shelf', s.shelf,
        'gift', i.gift, 'owned', o.item_id is not null)
        order by s.shelf, s.pos)
      from sh_shop_for(v, dd) s join shop_items i on i.id = s.item_id left join sh_owned(v) o on o.item_id = i.id), '[]'::jsonb),
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('id', o.item_id, 'at', o.at, 'how', o.how) order by o.at nulls last, o.item_id)
      from sh_owned(v) o), '[]'::jsonb),
    'locked', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'kind', i.kind, 'rarity', i.rarity, 'rank_tier', i.rank_tier)
        order by i.rank_tier, i.sort, i.id)
      from shop_items i where i.active and i.rank_tier is not null
        and not exists (select 1 from sh_owned(v) o where o.item_id = i.id)), '[]'::jsonb),
    'equipped', case when ok then coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = p_visitor), '{}'::jsonb) else '{}'::jsonb end,
    'costumes', case when ok then coalesce((select jsonb_agg(jsonb_build_object('id', c.costume, 'day', c.first_day) order by c.first_day, c.costume)
      from costume_log c where c.visitor_id = p_visitor), '[]'::jsonb) else '[]'::jsonb end,
    'snacks_today', case when ok then coalesce((select jsonb_agg(distinct p.item_id) from pet_purchases p
      where p.visitor_id = p_visitor and p.day = dd and p.kind = 'snack'), '[]'::jsonb) else '[]'::jsonb end,
    'boost', case when ok then sh_boost_json(p_visitor, clock_timestamp()) end);
end;
$$;
create or replace function public.get_my_shop(p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select sh_my_shop(null, p_visitor);
$$;

-- buy one thing: not owned already (outfits, costumes, the home's things; a gift is everyone's, so it can never be
-- bought), not a rank item (earned by rank, never sold), on sale today for this visitor (a shelf of sh_shop_for: daily,
-- weekly, a season on sale, a throwback day's three, the always-shelf, a spotted costume), at most one of each snack a
-- day, enough gold crowns. Idempotent on p_request (a double tap or a replayed call buys once). A snack's HP counts today
-- (get_pet_days_v2); a boost starts now, or extends the one running instead of stacking.
-- sh_buy takes the Central date (the tests set it; null = today); buy_item is what a page calls.
create or replace function public.sh_buy(p_day date, p_visitor text, p_item text, p_request text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it record; prev record; dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); w jsonb; bal int; pid bigint;
  v_resp jsonb; bst record; b_until timestamptz;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_item is null or p_item !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_request is null or p_request !~ '^[A-Za-z0-9_-]{8,64}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select visitor_id, resp into prev from pet_purchases where request_id = p_request;
  if found then
    if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
    return jsonb_build_object('ok', false, 'error', 'dup');
  end if;
  select * into it from shop_items where id = p_item and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if it.kind not in ('snack', 'boost') and sh_owns(p_visitor, p_item) then return jsonb_build_object('ok', false, 'error', 'owned'); end if;
  if it.rank_tier is not null then return jsonb_build_object('ok', false, 'error', 'rank', 'rank_tier', it.rank_tier); end if;
  if not exists (select 1 from sh_shop_for(p_visitor, dd) s where s.item_id = p_item) then return jsonb_build_object('ok', false, 'error', 'not-today'); end if;
  if it.kind = 'snack' and exists (select 1 from pet_purchases where visitor_id = p_visitor and item_id = p_item and day = dd) then
    return jsonb_build_object('ok', false, 'error', 'today'); end if;
  w := sh_wallet(p_visitor); bal := (w->>'balance')::integer;
  if bal < it.price then return jsonb_build_object('ok', false, 'error', 'balance', 'balance', bal, 'price', it.price); end if;
  insert into pet_purchases (visitor_id, item_id, kind, price, hp, request_id, day)
    values (p_visitor, p_item, it.kind, it.price, it.hp, p_request, dd) returning id into pid;
  if it.kind not in ('snack', 'boost') then
    insert into pet_inventory (visitor_id, item_id) values (p_visitor, p_item) on conflict do nothing;
  end if;
  if it.kind = 'boost' then
    select * into bst from xp_boosts where visitor_id = p_visitor and src = 'shop' and starts_at <= now() and ends_at > now()
      order by ends_at desc limit 1;
    if found then
      update xp_boosts set ends_at = ends_at + make_interval(mins => it.boost_minutes) where visitor_id = p_visitor and key = bst.key
        returning ends_at into b_until;
    else
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'shop:' || pid, 'shop', it.boost_mult, now(), now() + make_interval(mins => it.boost_minutes))
        returning ends_at into b_until;
    end if;
  end if;
  v_resp := jsonb_build_object('ok', true, 'item', p_item, 'kind', it.kind, 'price', it.price, 'balance', bal - it.price,
    'hp', it.hp, 'boost_until', b_until);
  update pet_purchases set resp = v_resp where id = pid;
  return v_resp;
end;
$$;

create or replace function public.buy_item(p_visitor text, p_item text, p_request text)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_buy(null, p_visitor, p_item, p_request);
$$;

-- wear an outfit, move into a home, pick a scene, put a yard item in one of the five spots, or fit an upgrade; p_item null
-- takes the slot back to the free default (no outfit, the cottage, the hill, an empty spot). Only what you own (sh_owns:
-- bought, a gift, or a rank item whose rank you've reached). A wide yard item (the bowling lane) always stands in the side
-- yard and takes the front corner too: it clears that spot, and putting something in the front corner takes the lane away.
-- If someone's XP ever drops below a rank (a rebuild after a correction), a rank item they already put on simply stays
-- on: nothing takes it off, they just can't put it on again until the rank is back.
create or replace function public.equip_item(p_visitor text, p_slot text, p_item text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it record; v_slot text := p_slot;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_slot is null or p_slot not in ('outfit', 'home', 'scene',
     'yard-left', 'yard-front', 'yard-corner', 'yard-side', 'yard-right', 'windows', 'porch', 'chimney', 'flag', 'paint') then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_item is null then
    delete from pet_equipped where visitor_id = p_visitor and slot = p_slot;
  else
    select i.* into it from shop_items i where i.id = p_item and sh_owns(p_visitor, p_item);
    if not found then return jsonb_build_object('ok', false, 'error', 'not-owned'); end if;
    if not ((p_slot = 'outfit' and it.kind in ('outfit', 'costume')) or (p_slot = it.kind and it.kind in ('home', 'scene'))
            or (p_slot like 'yard-%' and it.kind = 'yard') or (it.kind = 'upgrade' and p_slot = it.slot)) then
      return jsonb_build_object('ok', false, 'error', 'slot'); end if;
    if it.kind = 'yard' and it.wide then
      if p_slot not in ('yard-side', 'yard-corner') then return jsonb_build_object('ok', false, 'error', 'slot'); end if;
      v_slot := 'yard-side';
      delete from pet_equipped where visitor_id = p_visitor and slot = 'yard-corner';
    elsif p_slot = 'yard-corner' then
      delete from pet_equipped e using shop_items i
      where e.visitor_id = p_visitor and e.slot = 'yard-side' and i.id = e.item_id and i.wide;
    end if;
    if it.kind = 'yard' then delete from pet_equipped where visitor_id = p_visitor and item_id = p_item and slot <> v_slot; end if;
    insert into pet_equipped (visitor_id, slot, item_id, set_at) values (p_visitor, v_slot, p_item, clock_timestamp())
      on conflict (visitor_id, slot) do update set item_id = excluded.item_id, set_at = excluded.set_at;
  end if;
  return jsonb_build_object('ok', true, 'equipped',
    coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = p_visitor), '{}'::jsonb));
end;
$$;

-- a rare costume seen for the first time (the page picks the day's costume itself): into the costume log and that
-- visitor's shop; at most one new sighting a day, as he wears one costume a day
create or replace function public.record_costume_sighting(p_visitor text, p_costume text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare dd date := (now() at time zone 'America/Chicago')::date;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80
     or not exists (select 1 from shop_items where id = p_costume and kind = 'costume' and active) then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if exists (select 1 from costume_log where visitor_id = p_visitor and costume = p_costume) then
    return jsonb_build_object('ok', true, 'first', false); end if;
  if exists (select 1 from costume_log where visitor_id = p_visitor and first_day = dd) then
    return jsonb_build_object('ok', false, 'error', 'today'); end if;
  insert into costume_log (visitor_id, costume, first_day) values (p_visitor, p_costume, dd) on conflict do nothing;
  return jsonb_build_object('ok', true, 'first', true);
end;
$$;

-- the catalog is edited with this (or a later migration); p_item has the shop_items columns
create or replace function public.admin_upsert_shop_item(p_secret text, p_item jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if jsonb_typeof(p_item) is distinct from 'object' or coalesce(p_item->>'id', '') = '' then raise exception 'p_item needs an id'; end if;
  insert into shop_items (id, name, kind, rarity, price, season, slot, hp, boost_minutes, boost_mult, shelf, rotates, active, sort, wide,
    gift, rank_tier)
  values (p_item->>'id', p_item->>'name', p_item->>'kind', p_item->>'rarity', (p_item->>'price')::integer, p_item->>'season',
    p_item->>'slot', (p_item->>'hp')::integer, (p_item->>'boost_minutes')::integer, (p_item->>'boost_mult')::smallint,
    coalesce((p_item->>'shelf')::boolean, false),
    coalesce((p_item->>'rotates')::boolean, p_item->>'season' is null and p_item->>'rank_tier' is null),
    coalesce((p_item->>'active')::boolean, true), coalesce((p_item->>'sort')::integer, 0),
    coalesce((p_item->>'wide')::boolean, false), coalesce((p_item->>'gift')::boolean, false), (p_item->>'rank_tier')::smallint)
  on conflict (id) do update set name = excluded.name, kind = excluded.kind, rarity = excluded.rarity, price = excluded.price,
    season = excluded.season, slot = excluded.slot, hp = excluded.hp, boost_minutes = excluded.boost_minutes,
    boost_mult = excluded.boost_mult, shelf = excluded.shelf, rotates = excluded.rotates, active = excluded.active, sort = excluded.sort,
    wide = excluded.wide, gift = excluded.gift, rank_tier = excluded.rank_tier;
  return true;
end;
$$;

-- Timmy's days with the HP his snacks and floss gave that day (bought in the shop); the page adds it on that day
create or replace function public.get_pet_days_v2(p_visitor text)
returns table(d date, attempts integer, correct integer, hp integer)
language sql stable security definer set search_path = public as $$
  with a as (select g.d, g.attempts, g.correct from get_pet_days(p_visitor) g),
  s as (
    select p.day as d, sum(p.hp)::integer as hp from pet_purchases p
    where p.visitor_id = p_visitor and p.hp is not null and p.day > (now() at time zone 'America/Chicago')::date - 70
    group by p.day
  )
  select coalesce(a.d, s.d), coalesce(a.attempts, 0), coalesce(a.correct, 0), coalesce(s.hp, 0)
  from a full join s on s.d = a.d order by 1;
$$;

-- the starting catalog. Names, ids, rarities and prices follow the art (tools/figures/site/place.mjs: its HOMES, SCENES,
-- YARD, OUTFITS, PAINTS and UPGRADES name each piece's id here; Sam, 2026-11-06: the server's names follow the art).
-- The seasonal sets and the rank sets are the second statement below.
insert into public.shop_items (id, name, kind, rarity, price, season, slot, hp, boost_minutes, boost_mult, shelf, rotates, sort) values
  ('scrub-cap', 'Scrub cap', 'outfit', 'common', 150, null, null, null, null, null, false, true, 101),
  ('bow-tie', 'Bow tie', 'outfit', 'common', 120, null, null, null, null, null, false, true, 102),
  ('beanie', 'Beanie and scarf', 'outfit', 'common', 180, null, null, null, null, null, false, true, 103),
  ('safety-glasses', 'Safety glasses', 'outfit', 'uncommon', 300, null, null, null, null, null, false, true, 104),
  ('white-coat', 'White coat', 'outfit', 'uncommon', 450, null, null, null, null, null, false, true, 105),
  ('graduation-cap', 'Graduation cap', 'outfit', 'rare', 900, null, null, null, null, null, false, true, 106),
  ('sun-hat', 'Straw sun hat', 'outfit', 'common', 150, null, null, null, null, null, false, true, 107),
  ('ranger-hat', 'Ranger hat', 'outfit', 'uncommon', 300, null, null, null, null, null, false, true, 108),
  ('sunglasses-lei', 'Sunglasses and a lei', 'outfit', 'uncommon', 350, null, null, null, null, null, false, true, 109),
  ('captain-hat', 'Captain''s hat', 'outfit', 'rare', 800, null, null, null, null, null, false, true, 110),
  ('nightcap', 'Starry nightcap', 'outfit', 'rare', 900, null, null, null, null, null, false, true, 111),
  ('aviator-cap', 'Aviator cap and goggles', 'outfit', 'rare', 1000, null, null, null, null, null, false, true, 112),
  ('castle', 'Castle', 'home', 'legendary', 8000, null, null, null, null, null, false, true, 201),
  ('giant-mushroom', 'Giant mushroom', 'home', 'legendary', 6000, null, null, null, null, null, false, true, 202),
  ('treehouse', 'Treehouse', 'home', 'legendary', 5000, null, null, null, null, null, false, true, 203),
  ('lighthouse', 'Lighthouse', 'home', 'legendary', 7000, null, null, null, null, null, false, true, 204),
  ('observatory', 'Observatory', 'home', 'legendary', 7500, null, null, null, null, null, false, true, 205),
  ('beach-hut', 'Beach hut', 'home', 'epic', 2600, null, null, null, null, null, false, true, 206),
  ('igloo', 'Igloo', 'home', 'epic', 2200, null, null, null, null, null, false, true, 207),
  ('beach', 'Beach', 'scene', 'rare', 1000, null, null, null, null, null, false, true, 301),
  ('forest', 'Forest', 'scene', 'rare', 800, null, null, null, null, null, false, true, 302),
  ('snowy-mountain', 'Snowy mountain', 'scene', 'epic', 1800, null, null, null, null, null, false, true, 303),
  ('night-sky', 'Night sky', 'scene', 'epic', 2500, null, null, null, null, null, false, true, 304),
  ('clouds', 'Above the clouds', 'scene', 'epic', 2800, null, null, null, null, null, false, true, 305),
  ('mailbox', 'Mailbox', 'yard', 'common', 100, null, null, null, null, null, false, true, 401),
  ('garden', 'Garden', 'yard', 'uncommon', 300, null, null, null, null, null, false, true, 402),
  ('hammock', 'Hammock', 'yard', 'uncommon', 350, null, null, null, null, null, false, true, 403),
  ('doghouse', 'Doghouse', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 404),
  ('bowling-lane', 'Bowling lane', 'yard', 'rare', 1200, null, null, null, null, null, false, true, 405),
  ('swimming-pool', 'Swimming pool', 'yard', 'epic', 2000, null, null, null, null, null, false, true, 406),
  ('mouthwash-fountain', 'Mouthwash fountain', 'yard', 'rare', 900, null, null, null, null, null, false, true, 407),
  ('sandcastle', 'Sandcastle', 'yard', 'common', 150, null, null, null, null, null, false, true, 408),
  ('beach-umbrella', 'Beach umbrella', 'yard', 'uncommon', 350, null, null, null, null, null, false, true, 409),
  ('campfire', 'Campfire', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 410),
  ('hot-spring', 'Hot spring', 'yard', 'epic', 2200, null, null, null, null, null, false, true, 411),
  ('telescope', 'Telescope', 'yard', 'rare', 1000, null, null, null, null, null, false, true, 412),
  ('podcast-studio', 'Podcast studio', 'yard', 'epic', 2400, null, null, null, null, null, false, true, 413),
  ('fancy-windows', 'Fancy windows', 'upgrade', 'uncommon', 250, null, 'windows', null, null, null, false, true, 501),
  ('porch', 'Porch', 'upgrade', 'rare', 700, null, 'porch', null, null, null, false, true, 502),
  ('chimney', 'Chimney', 'upgrade', 'uncommon', 300, null, 'chimney', null, null, null, false, true, 503),
  ('flag', 'Timmy flag', 'upgrade', 'common', 120, null, 'flag', null, null, null, false, true, 504),
  ('paint-mint', 'Mint paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 505),
  ('paint-lilac', 'Lilac paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 506),
  ('paint-sky', 'Sky paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 507),
  ('paint-butter', 'Butter paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 508),
  ('paint-peach', 'Peach paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 509),
  ('apple', 'Apple', 'snack', 'common', 100, null, null, 10, null, null, true, false, 601),
  ('cheese-cube', 'Cheese cube', 'snack', 'common', 150, null, null, 15, null, null, true, false, 602),
  ('floss', 'Floss', 'snack', 'uncommon', 250, null, null, 25, null, null, true, false, 603),
  ('fluoride-rinse', 'Fluoride rinse', 'snack', 'uncommon', 400, null, null, 40, null, null, true, false, 604),
  ('boost-1h', 'Double XP for 1 hour', 'boost', 'rare', 600, null, null, null, 60, 2, true, false, 701),
  ('boost-3h', 'Double XP for 3 hours', 'boost', 'epic', 1500, null, null, null, 180, 2, true, false, 702),
  ('pirate', 'Pirate', 'costume', 'epic', 2000, null, null, null, null, null, false, false, 901),
  ('astronaut', 'Astronaut', 'costume', 'epic', 2500, null, null, null, null, null, false, false, 902),
  ('detective', 'Detective', 'costume', 'epic', 1800, null, null, null, null, null, false, false, 903),
  ('chef', 'Chef', 'costume', 'epic', 1500, null, null, null, null, null, false, false, 904),
  ('captain-enamel', 'Captain Enamel', 'costume', 'legendary', 4000, null, null, null, null, null, false, false, 905)
on conflict (id) do nothing;
update public.shop_items set wide = true where id = 'bowling-lane' and not wide;

-- The seasonal sets and the rank sets (Sam, 2026-11-10): exactly the pieces of tools/figures/site/sets.mjs (allSetItems()),
-- which the art draws by the same ids; tools/release/xp.js fails if the two differ. These rows are generated from that
-- file: change it, then these. A season's set is 1 home and 1 scene (both Legendary) and a Rare, an Epic and a Legendary
-- outfit and yard thing; Halloween's is everyone's gift. A rank set is an outfit and a yard thing for a full rank-up.
insert into public.shop_items (id, name, kind, rarity, price, season, gift, rank_tier, rotates, sort) values
  ('haunted-manor', 'Haunted manor', 'home', 'legendary', 6500, 'halloween', true, null, false, 1001),
  ('pumpkin-patch', 'Pumpkin patch at dusk', 'scene', 'legendary', 5000, 'halloween', true, null, false, 1002),
  ('floss-mummy', 'Floss mummy', 'outfit', 'rare', 800, 'halloween', true, null, false, 1003),
  ('bedsheet-ghost', 'Bedsheet ghost', 'outfit', 'epic', 1800, 'halloween', true, null, false, 1004),
  ('skeleton-suit', 'Skeleton suit', 'outfit', 'legendary', 4500, 'halloween', true, null, false, 1005),
  ('pumpkin-lantern', 'Pumpkin lanterns', 'yard', 'rare', 700, 'halloween', true, null, false, 1006),
  ('bubbling-cauldron', 'Bubbling cauldron', 'yard', 'epic', 1800, 'halloween', true, null, false, 1007),
  ('haunted-tree', 'Haunted tree', 'yard', 'legendary', 4200, 'halloween', true, null, false, 1008),
  ('harvest-barn', 'Harvest barn', 'home', 'legendary', 6000, 'thanksgiving', false, null, false, 1011),
  ('harvest-fields', 'Harvest fields', 'scene', 'legendary', 5000, 'thanksgiving', false, null, false, 1012),
  ('scarecrow-hat', 'Scarecrow hat', 'outfit', 'rare', 700, 'thanksgiving', false, null, false, 1013),
  ('football-helmet', 'Football helmet', 'outfit', 'epic', 1800, 'thanksgiving', false, null, false, 1014),
  ('parade-marshal', 'Parade grand marshal', 'outfit', 'legendary', 4500, 'thanksgiving', false, null, false, 1015),
  ('hay-bales', 'Hay bales', 'yard', 'rare', 700, 'thanksgiving', false, null, false, 1016),
  ('harvest-table', 'Harvest table', 'yard', 'epic', 2000, 'thanksgiving', false, null, false, 1017),
  ('turkey-balloon', 'Turkey parade balloon', 'yard', 'legendary', 4500, 'thanksgiving', false, null, false, 1018),
  ('log-cabin', 'Snowy log cabin', 'home', 'legendary', 6500, 'winter', false, null, false, 1021),
  ('aurora-lake', 'Frozen lake under the northern lights', 'scene', 'legendary', 5500, 'winter', false, null, false, 1022),
  ('ugly-sweater', 'Holiday sweater', 'outfit', 'rare', 700, 'winter', false, null, false, 1023),
  ('elf-suit', 'Elf suit', 'outfit', 'epic', 1800, 'winter', false, null, false, 1024),
  ('nutcracker', 'Nutcracker uniform', 'outfit', 'legendary', 4800, 'winter', false, null, false, 1025),
  ('snow-globe', 'Snow globe', 'yard', 'rare', 800, 'winter', false, null, false, 1026),
  ('ice-rink', 'Ice rink', 'yard', 'epic', 2200, 'winter', false, null, false, 1027),
  ('holiday-tree', 'Decorated tree', 'yard', 'legendary', 4500, 'winter', false, null, false, 1028),
  ('clock-tower', 'Clock tower', 'home', 'legendary', 7000, 'newyear', false, null, false, 1031),
  ('midnight-rooftops', 'Midnight rooftops', 'scene', 'legendary', 5500, 'newyear', false, null, false, 1032),
  ('sparkle-bow-tie', 'Sparkly bow tie', 'outfit', 'rare', 700, 'newyear', false, null, false, 1033),
  ('tuxedo', 'Tuxedo', 'outfit', 'epic', 2000, 'newyear', false, null, false, 1034),
  ('father-time', 'Father Time', 'outfit', 'legendary', 4500, 'newyear', false, null, false, 1035),
  ('confetti-cannon', 'Confetti cannon', 'yard', 'rare', 800, 'newyear', false, null, false, 1036),
  ('countdown-clock', 'Countdown clock', 'yard', 'epic', 2000, 'newyear', false, null, false, 1037),
  ('ball-drop', 'Midnight ball drop', 'yard', 'legendary', 4500, 'newyear', false, null, false, 1038),
  ('french-quarter', 'French Quarter townhouse', 'home', 'legendary', 7000, 'mardigras', false, null, false, 1041),
  ('parade-street', 'Parade street', 'scene', 'legendary', 5000, 'mardigras', false, null, false, 1042),
  ('bead-necklaces', 'Parade beads', 'outfit', 'rare', 700, 'mardigras', false, null, false, 1043),
  ('jester', 'Jester', 'outfit', 'epic', 1800, 'mardigras', false, null, false, 1044),
  ('carnival-king', 'Carnival king', 'outfit', 'legendary', 4500, 'mardigras', false, null, false, 1045),
  ('bead-tree', 'Bead tree', 'yard', 'rare', 700, 'mardigras', false, null, false, 1046),
  ('jazz-stand', 'Jazz stand', 'yard', 'epic', 1800, 'mardigras', false, null, false, 1047),
  ('parade-float', 'Parade float', 'yard', 'legendary', 4500, 'mardigras', false, null, false, 1048),
  ('heart-cottage', 'Heart cottage', 'home', 'legendary', 6000, 'valentine', false, null, false, 1051),
  ('rose-garden', 'Rose garden', 'scene', 'legendary', 5000, 'valentine', false, null, false, 1052),
  ('mail-cap', 'Love-letter mail cap', 'outfit', 'rare', 700, 'valentine', false, null, false, 1053),
  ('knight-of-hearts', 'Knight of hearts', 'outfit', 'epic', 1800, 'valentine', false, null, false, 1054),
  ('masquerade', 'Masquerade mask and cape', 'outfit', 'legendary', 4500, 'valentine', false, null, false, 1055),
  ('heart-balloon', 'Heart balloons', 'yard', 'rare', 700, 'valentine', false, null, false, 1056),
  ('swing-for-two', 'Swing for two', 'yard', 'epic', 1800, 'valentine', false, null, false, 1057),
  ('swan-pond', 'Swan pond', 'yard', 'legendary', 4500, 'valentine', false, null, false, 1058),
  ('pillow-palace', 'Pillow palace', 'home', 'legendary', 7000, 'toothfairy', false, null, false, 1061),
  ('fairy-glen', 'Moonlit fairy glen', 'scene', 'legendary', 5500, 'toothfairy', false, null, false, 1062),
  ('fairy-wand', 'Wand and tiara', 'outfit', 'rare', 800, 'toothfairy', false, null, false, 1063),
  ('fairy-wings', 'Fairy wings', 'outfit', 'epic', 2000, 'toothfairy', false, null, false, 1064),
  ('tooth-fairy', 'The Tooth Fairy', 'outfit', 'legendary', 5000, 'toothfairy', false, null, false, 1065),
  ('coin-pile', 'Pile of shiny coins', 'yard', 'rare', 800, 'toothfairy', false, null, false, 1066),
  ('tooth-pillow', 'Tooth pillow', 'yard', 'epic', 1800, 'toothfairy', false, null, false, 1067),
  ('fairy-ring', 'Fairy ring', 'yard', 'legendary', 4500, 'toothfairy', false, null, false, 1068),
  ('dental-office', 'Dental office', 'home', 'legendary', 7000, 'dentist', false, null, false, 1071),
  ('main-street', 'Main Street', 'scene', 'legendary', 5000, 'dentist', false, null, false, 1072),
  ('gold-mirror', 'Golden mouth mirror', 'outfit', 'rare', 900, 'dentist', false, null, false, 1073),
  ('surgical-scrubs', 'Surgical scrubs and mask', 'outfit', 'epic', 1800, 'dentist', false, null, false, 1074),
  ('dr-timmy', 'Dr. Timmy''s long white coat', 'outfit', 'legendary', 4500, 'dentist', false, null, false, 1075),
  ('dental-chair', 'Dental chair', 'yard', 'rare', 900, 'dentist', false, null, false, 1076),
  ('operatory-light', 'Operatory light and tray', 'yard', 'epic', 1800, 'dentist', false, null, false, 1077),
  ('molar-monument', 'Molar monument', 'yard', 'legendary', 4500, 'dentist', false, null, false, 1078),
  ('thatched-cottage', 'Thatched cottage', 'home', 'legendary', 6000, 'stpatrick', false, null, false, 1081),
  ('emerald-hills', 'Emerald hills', 'scene', 'legendary', 5000, 'stpatrick', false, null, false, 1082),
  ('flat-cap', 'Tweed flat cap', 'outfit', 'rare', 700, 'stpatrick', false, null, false, 1083),
  ('bagpiper', 'Bagpiper', 'outfit', 'epic', 1800, 'stpatrick', false, null, false, 1084),
  ('gold-buckle-suit', 'Gold-buckle suit', 'outfit', 'legendary', 4500, 'stpatrick', false, null, false, 1085),
  ('clover-patch', 'Clover patch', 'yard', 'rare', 700, 'stpatrick', false, null, false, 1086),
  ('wishing-well', 'Wishing well', 'yard', 'epic', 1800, 'stpatrick', false, null, false, 1087),
  ('pot-of-gold', 'Pot of gold', 'yard', 'legendary', 4500, 'stpatrick', false, null, false, 1088),
  ('egg-house', 'Painted egg house', 'home', 'legendary', 6000, 'easter', false, null, false, 1091),
  ('tulip-meadow', 'Tulip meadow', 'scene', 'legendary', 5000, 'easter', false, null, false, 1092),
  ('easter-bonnet', 'Easter bonnet', 'outfit', 'rare', 700, 'easter', false, null, false, 1093),
  ('egg-painter', 'Egg painter''s smock', 'outfit', 'epic', 1800, 'easter', false, null, false, 1094),
  ('bunny-suit', 'Bunny suit', 'outfit', 'legendary', 4500, 'easter', false, null, false, 1095),
  ('egg-basket', 'Giant egg basket', 'yard', 'rare', 700, 'easter', false, null, false, 1096),
  ('carrot-patch', 'Carrot patch', 'yard', 'epic', 1800, 'easter', false, null, false, 1097),
  ('chick-coop', 'Chick coop', 'yard', 'legendary', 4200, 'easter', false, null, false, 1098),
  ('flowerpot-house', 'Flowerpot house', 'home', 'legendary', 6000, 'spring', false, null, false, 1101),
  ('cherry-blossoms', 'Cherry blossom grove', 'scene', 'legendary', 5000, 'spring', false, null, false, 1102),
  ('rain-slicker', 'Raincoat and boots', 'outfit', 'rare', 700, 'spring', false, null, false, 1103),
  ('beekeeper', 'Beekeeper', 'outfit', 'epic', 1800, 'spring', false, null, false, 1104),
  ('butterfly-wings', 'Butterfly wings', 'outfit', 'legendary', 4500, 'spring', false, null, false, 1105),
  ('birdbath', 'Birdbath', 'yard', 'rare', 700, 'spring', false, null, false, 1106),
  ('beehives', 'Beehives', 'yard', 'epic', 1800, 'spring', false, null, false, 1107),
  ('greenhouse', 'Glass greenhouse', 'yard', 'legendary', 4500, 'spring', false, null, false, 1108),
  ('a-frame-cabin', 'A-frame cabin', 'home', 'legendary', 6000, 'july4', false, null, false, 1111),
  ('fairgrounds', 'Fairgrounds', 'scene', 'legendary', 5000, 'july4', false, null, false, 1112),
  ('stars-top-hat', 'Stars-and-stripes top hat', 'outfit', 'rare', 700, 'july4', false, null, false, 1113),
  ('drum-major', 'Drum major', 'outfit', 'epic', 1800, 'july4', false, null, false, 1114),
  ('lady-liberty', 'Lady Liberty', 'outfit', 'legendary', 4500, 'july4', false, null, false, 1115),
  ('picnic-blanket', 'Picnic blanket', 'yard', 'rare', 700, 'july4', false, null, false, 1116),
  ('fireworks-launcher', 'Fireworks launcher', 'yard', 'epic', 1800, 'july4', false, null, false, 1117),
  ('ferris-wheel', 'Little Ferris wheel', 'yard', 'legendary', 4500, 'july4', false, null, false, 1118),
  ('camper-van', 'Camper van', 'home', 'legendary', 6500, 'summer', false, null, false, 1121),
  ('summer-lake', 'Summer lake', 'scene', 'legendary', 5000, 'summer', false, null, false, 1122),
  ('snorkel', 'Snorkel and flippers', 'outfit', 'rare', 700, 'summer', false, null, false, 1123),
  ('lifeguard', 'Lifeguard', 'outfit', 'epic', 1800, 'summer', false, null, false, 1124),
  ('deep-sea-diver', 'Deep-sea diver', 'outfit', 'legendary', 4500, 'summer', false, null, false, 1125),
  ('lawn-sprinkler', 'Lawn sprinkler', 'yard', 'rare', 700, 'summer', false, null, false, 1126),
  ('barbecue-grill', 'Barbecue grill', 'yard', 'epic', 1800, 'summer', false, null, false, 1127),
  ('water-slide', 'Water slide', 'yard', 'legendary', 4500, 'summer', false, null, false, 1128),
  ('acorn-house', 'Acorn house', 'home', 'legendary', 6000, 'fall', false, null, false, 1131),
  ('autumn-woods', 'Autumn woods', 'scene', 'legendary', 5000, 'fall', false, null, false, 1132),
  ('flannel', 'Flannel and scarf', 'outfit', 'rare', 700, 'fall', false, null, false, 1133),
  ('fox-hood', 'Fox hood', 'outfit', 'epic', 1800, 'fall', false, null, false, 1134),
  ('tweed-professor', 'Tweed professor', 'outfit', 'legendary', 4500, 'fall', false, null, false, 1135),
  ('leaf-pile', 'Leaf pile', 'yard', 'rare', 700, 'fall', false, null, false, 1136),
  ('cider-stand', 'Apple cider stand', 'yard', 'epic', 1800, 'fall', false, null, false, 1137),
  ('apple-tree', 'Apple tree with a swing', 'yard', 'legendary', 4200, 'fall', false, null, false, 1138),
  ('rank-antique-outfit', 'Brass monocle and bowler', 'outfit', 'rare', 0, null, false, 1, false, 2001),
  ('rank-antique-yard', 'Treadle dental engine', 'yard', 'rare', 0, null, false, 1, false, 2002),
  ('rank-bronze-outfit', 'Bronze gladiator helmet', 'outfit', 'rare', 0, null, false, 2, false, 2003),
  ('rank-bronze-yard', 'Bronze bell', 'yard', 'rare', 0, null, false, 2, false, 2004),
  ('rank-silver-outfit', 'Silver knight''s helm', 'outfit', 'epic', 0, null, false, 3, false, 2005),
  ('rank-silver-yard', 'Silver trophy cup', 'yard', 'epic', 0, null, false, 3, false, 2006),
  ('rank-gold-outfit', 'Golden laurels and toga', 'outfit', 'epic', 0, null, false, 4, false, 2007),
  ('rank-gold-yard', 'Golden tooth statue', 'yard', 'epic', 0, null, false, 4, false, 2008),
  ('rank-diamond-outfit', 'Diamond shades and ice cape', 'outfit', 'legendary', 0, null, false, 5, false, 2009),
  ('rank-diamond-yard', 'Diamond geode', 'yard', 'legendary', 0, null, false, 5, false, 2010),
  ('rank-dark-outfit', 'Dark Matter cloak', 'outfit', 'legendary', 0, null, false, 6, false, 2011),
  ('rank-dark-yard', 'Dark Matter orb', 'yard', 'legendary', 0, null, false, 6, false, 2012)
on conflict (id) do nothing;

-- ====================================================================== 6. the idea board
-- Ideas show as soon as they're posted, under the poster's leaderboard name, with up and down votes. Each picks a hub (one
-- hub, or null for all hubs) and a category. Three reports hide one until Sam looks; Sam gives a status with one line on
-- why, and the author and everyone who voted it up get a note in their Inbox. Votes inform, they don't decide.
create table if not exists public.ideas (
  id bigint generated always as identity primary key,
  visitor_id text,                                   -- null for the starter ideas
  name text not null,
  title text not null,
  body text not null default '',
  hub text,                                          -- null: all hubs
  category text not null check (category in ('feature', 'better', 'content', 'fun', 'look', 'other')),
  source text not null check (source in ('board', 'suggest', 'checkin', 'starter')),
  request_id text unique,
  status text not null default 'open' check (status in ('open', 'considering', 'planned', 'shipped', 'not-doing')),
  status_note text,
  status_at timestamptz,
  hidden boolean not null default false,
  hidden_by text check (hidden_by in ('reports', 'admin')),
  restored_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ideas_visitor on public.ideas (visitor_id, created_at);
create table if not exists public.idea_votes (
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  val smallint not null check (val in (-1, 1)),
  at timestamptz not null default now(),
  primary key (idea_id, visitor_id)
);
create table if not exists public.idea_reports (
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, visitor_id)
);
create table if not exists public.idea_notes (
  id bigint generated always as identity primary key,
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
create index if not exists idea_notes_visitor on public.idea_notes (visitor_id, created_at);

-- { ok: true, id, name } or { ok: false, error: 'bad' | 'name' | 'title' | 'long' | 'hub' | 'category' | 'slow' | 'limit' | 'dup' }
create or replace function public.post_idea(p_visitor text, p_title text, p_body text, p_hub text, p_category text,
  p_source text default 'board', p_request text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g')); b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  h text := nullif(btrim(coalesce(p_hub, '')), ''); n text; prev record; iid bigint;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or coalesce(p_source, 'board') not in ('board', 'suggest', 'checkin')
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$') then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_request is not null then
    select id, visitor_id, name into prev from ideas where request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return jsonb_build_object('ok', true, 'id', prev.id, 'name', prev.name, 'repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;
  n := (select btrim(display_name) from visitor_names where visitor_id = p_visitor);
  if coalesce(n, '') = '' then return jsonb_build_object('ok', false, 'error', 'name'); end if;
  if length(t) < 3 or length(t) > 80 then return jsonb_build_object('ok', false, 'error', 'title'); end if;
  if length(b) > 280 then return jsonb_build_object('ok', false, 'error', 'long'); end if;
  if h is not null and (h !~ '^[a-z0-9][a-z0-9-]{0,39}$' or not exists (select 1 from question_keys k where k.hub = h)) then
    return jsonb_build_object('ok', false, 'error', 'hub'); end if;
  if p_category is null or p_category not in ('feature', 'better', 'content', 'fun', 'look', 'other') then
    return jsonb_build_object('ok', false, 'error', 'category'); end if;
  perform pg_advisory_xact_lock(hashtext('idea|' || p_visitor));
  if exists (select 1 from ideas where visitor_id = p_visitor and created_at > now() - interval '20 seconds') then
    return jsonb_build_object('ok', false, 'error', 'slow'); end if;
  if (select count(*) from ideas where visitor_id = p_visitor
      and (created_at at time zone 'America/Chicago')::date = (now() at time zone 'America/Chicago')::date) >= 3 then
    return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  insert into ideas (visitor_id, name, title, body, hub, category, source, request_id)
    values (p_visitor, left(n, 24), t, b, h, p_category, coalesce(p_source, 'board'), p_request) returning id into iid;
  return jsonb_build_object('ok', true, 'id', iid, 'name', left(n, 24));
end;
$$;

-- p_val: 1 up, -1 down, 0 take it back. Returns the new counts.
create or replace function public.vote_idea(p_visitor text, p_id bigint, p_val integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_val is null or p_val not in (-1, 0, 1)
     or not exists (select 1 from ideas where id = p_id and not hidden) then return null; end if;
  if p_val = 0 then delete from idea_votes where idea_id = p_id and visitor_id = p_visitor;
  else insert into idea_votes (idea_id, visitor_id, val) values (p_id, p_visitor, p_val)
    on conflict (idea_id, visitor_id) do update set val = excluded.val, at = now(); end if;
  return jsonb_build_object('up', (select count(*) from idea_votes where idea_id = p_id and val = 1),
    'down', (select count(*) from idea_votes where idea_id = p_id and val = -1), 'mine', p_val);
end;
$$;

-- anyone reports an idea once (not their own); the third reporter since Sam last restored it hides it
create or replace function public.report_idea(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare r timestamptz;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  select restored_at into r from ideas where id = p_id and not hidden and visitor_id is distinct from p_visitor;
  if not found then return false; end if;
  insert into idea_reports (idea_id, visitor_id) values (p_id, p_visitor) on conflict do nothing;
  if (select count(*) from idea_reports where idea_id = p_id and created_at > coalesce(r, '-infinity'::timestamptz)) >= 3 then
    update ideas set hidden = true, hidden_by = 'reports' where id = p_id and not hidden;
  end if;
  return true;
end;
$$;

-- the author's own delete removes the idea completely (Sam, 2026-11-11): the row goes, and with it (on delete cascade) its
-- votes, reports and Inbox notes. A deleted idea no longer counts toward the day's three or the 20 seconds.
create or replace function public.delete_my_idea(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return false; end if;
  delete from ideas where id = p_id and visitor_id = p_visitor;
  return found;
end;
$$;

-- the board: p_tab 'top' (by score), 'new' (newest) or 'shipped'; p_hub: null every idea, '' only the all-hubs ones, or a
-- hub (its ideas and the all-hubs ones); p_category: null or one. counts: how many each hub and category filter would show.
-- Never a visitor id: 'own' and 'mine' say what is the asking visitor's.
create or replace function public.get_ideas(p_visitor text, p_tab text default 'top', p_hub text default null, p_category text default null, p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = public as $$
  with v as (
    select i.*, coalesce((select count(*) from idea_votes x where x.idea_id = i.id and x.val = 1), 0)::integer as up,
      coalesce((select count(*) from idea_votes x where x.idea_id = i.id and x.val = -1), 0)::integer as down
    from ideas i
    where not i.hidden and case when p_tab = 'shipped' then i.status = 'shipped' else i.status <> 'shipped' end
  ), hubf as (
    select * from v where p_hub is null or (p_hub = '' and v.hub is null) or (p_hub <> '' and (v.hub = p_hub or v.hub is null))
  ), catf as (
    select * from v where p_category is null or v.category = p_category
  ), shown as (
    select * from hubf where p_category is null or hubf.category = p_category
  )
  select jsonb_build_object(
    'ideas', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'body', s.body, 'name', s.name, 'hub', s.hub,
        'category', s.category, 'source', s.source, 'status', s.status, 'note', s.status_note, 'status_at', s.status_at,
        'up', s.up, 'down', s.down, 'at', s.created_at,
        'own', p_visitor is not null and s.visitor_id = p_visitor,
        'mine', coalesce((select x.val from idea_votes x where x.idea_id = s.id and x.visitor_id = p_visitor), 0),
        'reported', exists (select 1 from idea_reports r where r.idea_id = s.id and r.visitor_id = p_visitor))
      order by case when p_tab = 'top' then s.up - s.down end desc nulls last,
               case when p_tab = 'shipped' then s.status_at end desc nulls last, s.created_at desc, s.id desc)
      from (select * from shown order by case when p_tab = 'top' then shown.up - shown.down end desc nulls last,
              case when p_tab = 'shipped' then shown.status_at end desc nulls last, shown.created_at desc, shown.id desc
            limit greatest(1, least(coalesce(p_limit, 50), 200))) s), '[]'::jsonb),
    'total', (select count(*) from shown),
    'hubs', coalesce((select jsonb_object_agg(coalesce(c.hub, ''), c.n) from (select catf.hub, count(*) as n from catf group by catf.hub) c), '{}'::jsonb),
    'categories', coalesce((select jsonb_object_agg(c.category, c.n) from (select hubf.category, count(*) as n from hubf group by hubf.category) c), '{}'::jsonb));
$$;

-- the admin page's Idea board (no visitor ids): every idea from the last p_days with its votes and reports
create or replace function public.admin_ideas(p_secret text, p_days integer default 90)
returns table(id bigint, hub text, category text, source text, name text, title text, body text, status text, status_note text,
  up bigint, down bigint, reports bigint, hidden boolean, hidden_by text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select i.id, i.hub, i.category, i.source, i.name, i.title, i.body, i.status, i.status_note,
      (select count(*) from idea_votes x where x.idea_id = i.id and x.val = 1),
      (select count(*) from idea_votes x where x.idea_id = i.id and x.val = -1),
      (select count(*) from idea_reports r where r.idea_id = i.id), i.hidden, i.hidden_by, i.created_at
    from ideas i where i.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 90), 400)))
    order by i.created_at desc limit 500;
end;
$$;

-- p_action: 'hide', 'restore' or 'status' (with p_status and one line on why). A new status notes the author and every
-- up-voter in their Inbox.
create or replace function public.admin_set_idea(p_secret text, p_id bigint, p_action text, p_status text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare i record; nn text := nullif(left(btrim(coalesce(p_note, '')), 200), ''); k int := 0;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into i from ideas where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if p_action = 'hide' then update ideas set hidden = true, hidden_by = 'admin' where id = p_id;
  elsif p_action = 'restore' then update ideas set hidden = false, hidden_by = null, restored_at = now() where id = p_id;
  elsif p_action = 'status' then
    if p_status is null or p_status not in ('open', 'considering', 'planned', 'shipped', 'not-doing') then raise exception 'bad status'; end if;
    if p_status is distinct from i.status or nn is distinct from i.status_note then
      update ideas set status = p_status, status_note = nn, status_at = now() where id = p_id;
      if p_status is distinct from i.status and p_status <> 'open' then
        insert into idea_notes (idea_id, visitor_id, status, note)
          select p_id, w.visitor_id, p_status, nn from (
            select i.visitor_id where i.visitor_id is not null
            union select x.visitor_id from idea_votes x where x.idea_id = p_id and x.val = 1) w;
        get diagnostics k = row_count;
      end if;
    end if;
  else raise exception 'bad action';
  end if;
  return jsonb_build_object('ok', true, 'notified', k);
end;
$$;

-- the starting ideas, posted at the release by Timmy and his neighbors (names as in tools/podcast/LORE.md), with no visitor
create or replace function public.admin_post_starter_idea(p_secret text, p_poster text, p_title text, p_body text, p_hub text, p_category text)
returns bigint language plpgsql security definer set search_path = public as $$
declare iid bigint; h text := nullif(btrim(coalesce(p_hub, '')), '');
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if length(btrim(coalesce(p_poster, ''))) not between 1 and 40 or length(btrim(coalesce(p_title, ''))) not between 3 and 80
     or length(coalesce(p_body, '')) > 280 then raise exception 'bad starter idea'; end if;
  insert into ideas (visitor_id, name, title, body, hub, category, source)
    values (null, btrim(p_poster), btrim(p_title), btrim(coalesce(p_body, '')), h, p_category, 'starter') returning id into iid;
  return iid;
end;
$$;

-- the Inbox with the idea notes, and each report's outcome ('fixed' says +100 XP was paid)
create or replace function public.get_my_inbox_v2(p_visitor text)
returns table(kind text, id bigint, hub text, title text, note text, message text, at timestamptz, seen boolean, expires_at timestamptz, outcome text)
language sql stable security definer set search_path = public as $$
  select * from (
    select i.kind, i.id, i.hub, i.title, i.note, i.message, i.at, i.seen, i.expires_at, o.outcome
      from get_my_inbox(p_visitor) i left join report_outcomes o on o.kind = i.kind and o.report_id = i.id
    union all
    select 'idea'::text, n.id, d.hub, d.title, n.status, n.note, n.created_at, n.seen_at is not null, null::timestamptz, null::text
      from idea_notes n join ideas d on d.id = n.idea_id
     where p_visitor is not null and n.visitor_id = p_visitor and n.created_at > now() - interval '90 days'
  ) r order by 7 desc limit 60;
$$;

create or replace function public.mark_idea_note_seen(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return false; end if;
  update idea_notes set seen_at = now() where id = p_id and visitor_id = p_visitor and seen_at is null;
  return found;
end;
$$;

-- ====================================================================== 7. Link my devices, and the bootstrap
-- Today's redeem_link_code (migration_v52), plus the new tables, moved before the answers so the answer trigger's rebuild
-- sees them: awards and boosts (a key both devices earned pays once), sessions, the baseline (added together), purchases
-- (spending adds up), the inventory (both devices' things), what's equipped (per slot, the newer choice wins), the costume
-- log, ideas, votes (the newer vote wins), reports and notes.
-- Then one rebuild for both ids.
create or replace function public.redeem_link_code(p_code text, p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare p text; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  if (select count(*) from link_attempts where visitor_id = p_visitor and tried_at > now() - interval '1 hour') >= 10 then return null; end if;
  insert into link_attempts (visitor_id) values (p_visitor);
  select visitor_id into p from link_codes where code = c and created_at > now() - interval '10 minutes';
  if p is null then return null; end if;
  delete from link_codes where code = c;
  if p = p_visitor then return p; end if;
  -- follow an existing chain so everything ends on one id
  p := coalesce((select primary_id from visitor_links where alias_id = p), p);

  -- the game layer (v54)
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    select p, key, src, hub, base, xp, at, d from xp_awards where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_awards where visitor_id = p_visitor;
  insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
    select p, key, src, mult, starts_at, ends_at from xp_boosts where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_boosts where visitor_id = p_visitor;
  update xp_sessions set visitor_id = p where visitor_id = p_visitor;
  insert into game_baseline (visitor_id, xp, badges, at)
    select p, xp, badges, at from game_baseline where visitor_id = p_visitor
    on conflict (visitor_id) do update set xp = game_baseline.xp + excluded.xp,
      badges = array(select distinct z from unnest(game_baseline.badges || excluded.badges) z order by 1);
  delete from game_baseline where visitor_id = p_visitor;
  update pet_purchases set visitor_id = p where visitor_id = p_visitor;
  insert into pet_inventory (visitor_id, item_id, bought_at)
    select p, item_id, bought_at from pet_inventory where visitor_id = p_visitor
    on conflict (visitor_id, item_id) do update set bought_at = least(pet_inventory.bought_at, excluded.bought_at);
  delete from pet_inventory where visitor_id = p_visitor;
  insert into pet_equipped (visitor_id, slot, item_id, set_at)
    select p, slot, item_id, set_at from pet_equipped where visitor_id = p_visitor
    on conflict (visitor_id, slot) do update set
      item_id = case when excluded.set_at > pet_equipped.set_at then excluded.item_id else pet_equipped.item_id end,
      set_at = greatest(pet_equipped.set_at, excluded.set_at);
  delete from pet_equipped where visitor_id = p_visitor;
  delete from pet_equipped e using pet_equipped e2                       -- a yard item now in two spots stays in the newer one
    where e.visitor_id = p and e2.visitor_id = p and e.item_id = e2.item_id and e.slot <> e2.slot
      and (e.set_at, e.slot) < (e2.set_at, e2.slot);
  insert into costume_log (visitor_id, costume, first_day)
    select p, costume, first_day from costume_log where visitor_id = p_visitor
    on conflict (visitor_id, costume) do update set first_day = least(costume_log.first_day, excluded.first_day);
  delete from costume_log where visitor_id = p_visitor;
  update ideas set visitor_id = p where visitor_id = p_visitor;
  insert into idea_votes (idea_id, visitor_id, val, at)
    select idea_id, p, val, at from idea_votes where visitor_id = p_visitor
    on conflict (idea_id, visitor_id) do update set val = case when excluded.at > idea_votes.at then excluded.val else idea_votes.val end,
      at = greatest(idea_votes.at, excluded.at);
  delete from idea_votes where visitor_id = p_visitor;
  insert into idea_reports (idea_id, visitor_id, created_at)
    select idea_id, p, created_at from idea_reports where visitor_id = p_visitor on conflict do nothing;
  delete from idea_reports where visitor_id = p_visitor;
  update idea_notes set visitor_id = p where visitor_id = p_visitor;

  update personal_answers set visitor_id = p where visitor_id = p_visitor;
  update arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update egg_events set visitor_id = p where visitor_id = p_visitor;
  -- time (v52): move the hour and visit rollups, then the raw pings with the rebuild trigger off, so hours whose raw
  -- pings the retention job already removed are kept
  insert into activity_hourly (h, hub, section, visitor_id, n)
    select h, hub, section, p, n from activity_hourly where visitor_id = p_visitor
    on conflict (h, hub, section, visitor_id) do update set n = activity_hourly.n + excluded.n;
  delete from activity_hourly where visitor_id = p_visitor;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    select visit_id, p, first_at, last_at from activity_visits where visitor_id = p_visitor
    on conflict (visit_id, visitor_id) do update set first_at = least(activity_visits.first_at, excluded.first_at),
      last_at = greatest(activity_visits.last_at, excluded.last_at);
  delete from activity_visits where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'on', true);
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'off', true);
  update nuke_launches set visitor_id = p where visitor_id = p_visitor;
  insert into achievements (visitor_id, kind, hub, created_at) select p, kind, hub, created_at from achievements where visitor_id = p_visitor on conflict do nothing;
  delete from achievements where visitor_id = p_visitor;
  insert into survey_responses (survey_id, visitor_id, answers, created_at) select survey_id, p, answers, created_at from survey_responses where visitor_id = p_visitor on conflict do nothing;
  delete from survey_responses where visitor_id = p_visitor;
  insert into ui_click_reach (day, hub, target, visitor_id) select day, hub, target, p from ui_click_reach where visitor_id = p_visitor on conflict do nothing;
  delete from ui_click_reach where visitor_id = p_visitor;
  insert into correct_streaks (visitor_id, current_streak, best_streak, updated_at)
    select p, current_streak, best_streak, updated_at from correct_streaks where visitor_id = p_visitor
    on conflict (visitor_id) do update set best_streak = greatest(correct_streaks.best_streak, excluded.best_streak),
      current_streak = case when excluded.updated_at > correct_streaks.updated_at then excluded.current_streak else correct_streaks.current_streak end,
      updated_at = greatest(correct_streaks.updated_at, excluded.updated_at);
  delete from correct_streaks where visitor_id = p_visitor;
  -- pinned questions (v46): per question, the newer change wins
  insert into question_pins (visitor_id, hub, qid, pinned, t)
    select p, hub, qid, pinned, t from question_pins where visitor_id = p_visitor
    on conflict (visitor_id, hub, qid) do update set pinned = case when excluded.t > question_pins.t then excluded.pinned else question_pins.pinned end,
      t = greatest(question_pins.t, excluded.t);
  delete from question_pins where visitor_id = p_visitor;
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  -- one rebuild for both ids, also when the second device had no answers (v54)
  perform sh_xp_rebuild(array[p, p_visitor]);
  return p;
end;
$$;

-- today's bootstrap, with the new rank (journey, 63 steps, boost, Dark Matter seen), Timmy's days with snack HP, the Inbox
-- with idea notes and outcomes, and the shop (wallet, inventory, what's equipped, today's shop, the costume log)
create or replace function public.get_widget_bootstrap_v2(
  p_visitor text,
  p_hub text default null,
  p_cavity_week text default null,
  p_episode text default null,
  p_include_pins boolean default false,
  p_dashboard boolean default false,
  p_luck_hub text default null,
  p_luck_date date default null,
  p_link_name text default null
)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare b jsonb := get_widget_bootstrap(p_visitor, p_hub, p_cavity_week, p_episode, p_include_pins, p_dashboard, p_luck_hub, p_luck_date, p_link_name);
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then
    return b || jsonb_build_object('shop', get_my_shop(null));
  end if;
  return b || jsonb_build_object(
    'rank', get_rank_profile_v2(p_visitor),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days_v2(p_visitor) pd), '[]'::jsonb),
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox_v2(p_visitor) i), '[]'::jsonb),
    'shop', get_my_shop(p_visitor));
end;
$$;

-- ====================================================================== 8. the baseline at the switch
insert into public.game_baseline (visitor_id, xp, badges)
  select v.visitor_id, coalesce(x.xp, 0),
    array(select jsonb_array_elements_text(coalesce(public.get_rank_profile(v.visitor_id)->'badges', '[]'::jsonb)))
  from (select visitor_id from public.xp_visitors union select visitor_id from public.achievements) v
  left join public.xp_visitors x on x.visitor_id = v.visitor_id
on conflict (visitor_id) do nothing;

-- ====================================================================== 9. row-level security and grants
alter table public.game_config enable row level security;
alter table public.game_baseline enable row level security;
alter table public.question_keys enable row level security;
alter table public.xp_awards enable row level security;
alter table public.xp_boosts enable row level security;
alter table public.xp_sessions enable row level security;
alter table public.answer_xp enable row level security;
alter table public.podcast_episodes enable row level security;
alter table public.report_outcomes enable row level security;
alter table public.shop_items enable row level security;
alter table public.pet_purchases enable row level security;
alter table public.pet_inventory enable row level security;
alter table public.pet_equipped enable row level security;
alter table public.costume_log enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.idea_reports enable row level security;
alter table public.idea_notes enable row level security;
alter table public.visit_secret enable row level security;
revoke all on table public.game_config, public.game_baseline, public.question_keys, public.xp_awards, public.xp_boosts,
  public.xp_sessions, public.answer_xp, public.podcast_episodes, public.report_outcomes, public.shop_items, public.pet_purchases,
  public.pet_inventory, public.pet_equipped, public.costume_log, public.ideas, public.idea_votes, public.idea_reports,
  public.idea_notes, public.visit_secret from public, anon, authenticated;

-- private helpers: only the functions above call them
revoke all on function public.sh_v2_at() from public, anon, authenticated;
revoke all on function public.sh_key(text, text, text) from public, anon, authenticated;
revoke all on function public.sh_xp_mult(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_boost_json(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_award(text, text, text, text, integer, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_xp_replay(text[]) from public, anon, authenticated;
revoke all on function public.sh_xp_rebuild(text[]) from public, anon, authenticated;
revoke all on function public.sh_medal_check(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
revoke all on function public.sh_session_start(timestamptz, text, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_session_finish(timestamptz, text, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.sh_pod_minute(timestamptz, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.sh_shop_pick(text, integer, text[]) from public, anon, authenticated;
revoke all on function public.sh_shop_day(date) from public, anon, authenticated;
revoke all on function public.sh_shop_for(text, date) from public, anon, authenticated;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;
revoke all on function public.sh_throwback_items(date) from public, anon, authenticated;
revoke all on function public.sh_season_was_on(text, date, date) from public, anon, authenticated;
revoke all on function public.sh_owned(text) from public, anon, authenticated;
revoke all on function public.sh_owns(text, text) from public, anon, authenticated;
revoke all on function public.sh_buy(date, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_my_shop(date, text) from public, anon, authenticated;
-- the visit key is made only inside the boards and get_place: nobody can ask for the key of an id
revoke all on function public.sh_visit_key(text) from public, anon, authenticated;
revoke all on function public.sh_visit_link(text) from public, anon, authenticated;

-- what pages call (sh_rank, sh_season, sh_is_fall, sh_easter, sh_shop_seasons, sh_throwback_days and sh_is_throwback are
-- pure arithmetic on the ladder and the calendar)
revoke all on function public.record_answer_v2(text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public;
grant execute on function public.record_answer_v2(text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) to anon, authenticated;
revoke all on function public.xp_session_start(text, text, text, text) from public;
grant execute on function public.xp_session_start(text, text, text, text) to anon, authenticated;
revoke all on function public.xp_session_finish(text, uuid, integer, integer) from public;
grant execute on function public.xp_session_finish(text, uuid, integer, integer) to anon, authenticated;
revoke all on function public.pod_minute_v2(text, text, text, integer) from public;
grant execute on function public.pod_minute_v2(text, text, text, integer) to anon, authenticated;
revoke all on function public.sh_rank(integer) from public;
grant execute on function public.sh_rank(integer) to anon, authenticated;
revoke all on function public.sh_season(date) from public;
grant execute on function public.sh_season(date) to anon, authenticated;
revoke all on function public.sh_is_fall(date) from public;
grant execute on function public.sh_is_fall(date) to anon, authenticated;
revoke all on function public.sh_easter(integer) from public;
grant execute on function public.sh_easter(integer) to anon, authenticated;
revoke all on function public.sh_shop_seasons(date) from public;
grant execute on function public.sh_shop_seasons(date) to anon, authenticated;
revoke all on function public.sh_throwback_days(date) from public;
grant execute on function public.sh_throwback_days(date) to anon, authenticated;
revoke all on function public.sh_is_throwback(date) from public;
grant execute on function public.sh_is_throwback(date) to anon, authenticated;
revoke all on function public.get_rank_profile_v2(text) from public;
grant execute on function public.get_rank_profile_v2(text) to anon, authenticated;
revoke all on function public.mark_dark_unlock_seen(text, integer) from public;
grant execute on function public.mark_dark_unlock_seen(text, integer) to anon, authenticated;
revoke all on function public.get_rank_board_v2(text, integer) from public;
grant execute on function public.get_rank_board_v2(text, integer) to anon, authenticated;
revoke all on function public.get_leaderboard_v2(integer) from public;
grant execute on function public.get_leaderboard_v2(integer) to anon, authenticated;
revoke all on function public.get_correct_streak_stats_v2() from public;
grant execute on function public.get_correct_streak_stats_v2() to anon, authenticated;
revoke all on function public.get_arcade_leaderboard_v2(text, text, text, integer) from public;
grant execute on function public.get_arcade_leaderboard_v2(text, text, text, integer) to anon, authenticated;
revoke all on function public.get_trophy_stats_v2() from public;
grant execute on function public.get_trophy_stats_v2() to anon, authenticated;
revoke all on function public.get_place(text) from public;
grant execute on function public.get_place(text) to anon, authenticated;
revoke all on function public.get_my_shop(text) from public;
grant execute on function public.get_my_shop(text) to anon, authenticated;
revoke all on function public.buy_item(text, text, text) from public;
grant execute on function public.buy_item(text, text, text) to anon, authenticated;
revoke all on function public.equip_item(text, text, text) from public;
grant execute on function public.equip_item(text, text, text) to anon, authenticated;
revoke all on function public.record_costume_sighting(text, text) from public;
grant execute on function public.record_costume_sighting(text, text) to anon, authenticated;
revoke all on function public.get_pet_days_v2(text) from public;
grant execute on function public.get_pet_days_v2(text) to anon, authenticated;
revoke all on function public.post_idea(text, text, text, text, text, text, text) from public;
grant execute on function public.post_idea(text, text, text, text, text, text, text) to anon, authenticated;
revoke all on function public.vote_idea(text, bigint, integer) from public;
grant execute on function public.vote_idea(text, bigint, integer) to anon, authenticated;
revoke all on function public.report_idea(text, bigint) from public;
grant execute on function public.report_idea(text, bigint) to anon, authenticated;
revoke all on function public.delete_my_idea(text, bigint) from public;
grant execute on function public.delete_my_idea(text, bigint) to anon, authenticated;
revoke all on function public.get_ideas(text, text, text, text, integer) from public;
grant execute on function public.get_ideas(text, text, text, text, integer) to anon, authenticated;
revoke all on function public.get_my_inbox_v2(text) from public;
grant execute on function public.get_my_inbox_v2(text) to anon, authenticated;
revoke all on function public.mark_idea_note_seen(text, bigint) from public;
grant execute on function public.mark_idea_note_seen(text, bigint) to anon, authenticated;
revoke all on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text) from public;
grant execute on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text) to anon, authenticated;
-- the admin page's, behind the admin secret
revoke all on function public.admin_load_question_keys(text, text, jsonb, boolean) from public;
grant execute on function public.admin_load_question_keys(text, text, jsonb, boolean) to anon, authenticated;
revoke all on function public.admin_set_podcast_episode(text, text, text, integer) from public;
grant execute on function public.admin_set_podcast_episode(text, text, text, integer) to anon, authenticated;
revoke all on function public.admin_resolve_report_v2(text, text, bigint, text, text) from public;
grant execute on function public.admin_resolve_report_v2(text, text, bigint, text, text) to anon, authenticated;
revoke all on function public.get_reports_v2(text) from public;
grant execute on function public.get_reports_v2(text) to anon, authenticated;
revoke all on function public.admin_upsert_shop_item(text, jsonb) from public;
grant execute on function public.admin_upsert_shop_item(text, jsonb) to anon, authenticated;
revoke all on function public.admin_ideas(text, integer) from public;
grant execute on function public.admin_ideas(text, integer) to anon, authenticated;
revoke all on function public.admin_set_idea(text, bigint, text, text, text) from public;
grant execute on function public.admin_set_idea(text, bigint, text, text, text) to anon, authenticated;
revoke all on function public.admin_post_starter_idea(text, text, text, text, text, text) from public;
grant execute on function public.admin_post_starter_idea(text, text, text, text, text, text) to anon, authenticated;
