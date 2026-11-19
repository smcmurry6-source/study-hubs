-- v78 (2026-11-19): no more "A miss fixed" bonus. Sam: "we can just take out the miss fixed bonus alltogether".
-- It paid +5 XP (doubled by a boost) the first time a question missed on an earlier day was answered right, once per
-- question, and since the reward card (2026-11-18) each one came up as a gold card with confetti, which fired on nearly
-- every right answer in Yesterday's misses, Missed last time and the drill.
--   1. sh_answer no longer pays it. Every other part of an answer's pay is the same: 10 or 2 XP a right answer, 1 a miss,
--      the day's 20th answer, the runs, the streaks, the medals.
--   2. sh_xp_replay no longer works it out, and sh_xp_rebuild (Link my devices, an edited or deleted answer) keeps the
--      'fix' awards already paid instead of replaying them: nobody's XP or crowns go down
--      (vault/rules/earn-rates-stay-enjoyable.md: "Never take crowns back"). The replay's three windows that only the
--      bonus read (prev_c, prev_d, day_prev) come out with it.
-- The 'fix' source stays in xp_awards' check for the rows already there. Only functions are replaced: nothing reads or
-- writes rows, so it can be applied at any hour (vault/how-to/run-sql-on-the-live-database.md).
-- sh_answer is v72's, sh_xp_replay v68's and sh_xp_rebuild v54's (all three md5-checked against the live bodies on
-- 2026-11-19), each with the change marked "v78". Tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js).

create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int;
  speed_ok boolean := false; right_ok boolean := false; v_base int := 0; v_mult int := 1; paid int := 0; v_n int; why text; bonus jsonb := '[]'::jsonb;
  medal jsonb; v_resp jsonb; prev record; day_n int; tap boolean := false; was_right boolean;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_picks is not null and (cardinality(p_picks) > 20 or exists (select 1 from unnest(p_picks) z where z is null or z not between 0 and 19)))
     or (p_choice is not null and p_choice not between 0 and 19) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  v_ctx := case when p_ctx in ('bank', 'drill', 'weak', 'misses', 'mock', 'arcade', 'check', 'review', 'case', 'learn') then p_ctx else 'other' end;
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
  -- v66: a retired question that still has its key is graded from it (Sam: "Every right answer should give xp")
  v_kind := case when k.qid is null then 'unknown'
                 when k.retired and k.kind <> 'self' and coalesce(cardinality(k.answer), 0) = 0 then 'retired' else k.kind end;
  if v_kind = 'one' then
    if p_choice is null and coalesce(cardinality(p_picks), 0) <> 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := coalesce(p_choice, p_picks[1]) = k.answer[1];
  elsif v_kind = 'all' then
    if p_picks is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := (select coalesce(array_agg(distinct z order by z), '{}') from unnest(p_picks) z)
               = (select array_agg(distinct z::int order by z::int) from unnest(k.answer) z);
  elsif v_kind = 'order' and p_picks is null then
    -- (v64, matching items) no order sent: a page cached before matching items were graded as an order. The student's word,
    -- paid as self. (v67: put back; migration_v66 had left it out.)
    v_kind := 'self';
    v_correct := coalesce(p_self, p_claim, false);
  elsif v_kind = 'order' then
    v_correct := p_picks = k.answer::integer[];
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
    -- v66 (Sam, 2026-11-17: "Every right answer should give xp"): a right answer always pays, however fast and however
    -- often that day; only the same question twice in one mock (one answer sent twice) doesn't. The speed limit and the
    -- three a day still hold for misses, and for the runs of right answers in a row (the nuke's 100 among them).
    -- a double tap: the same question again within 2 seconds of answering it is one answer sent twice
    select a.hub = p_hub and a.qid = p_qid and v_at - a.answered_at < interval '2 seconds' into tap
      from personal_answers a where a.visitor_id = p_visitor and a.id <> aid and a.answered_at <= v_at
      order by a.answered_at desc, a.id desc limit 1;
    right_ok := v_correct and not coalesce(tap, false) and not (s_ok and s.kind = 'mock' and s_dup);
    if not speed_ok and not right_ok then why := 'fast'; end if;
  else
    why := v_kind;
  end if;

  select count(*) filter (where a.correct = v_correct), count(*), count(*) filter (where a.correct)
    into rn_same, rn_all, v_n
    from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
      and (a.answered_at at time zone 'America/Chicago')::date = dd;
  if speed_ok or right_ok then
    if v_correct then select count(*) into rn_ever from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid and a.correct; end if;
    v_base := case when right_ok then case when v_kind = 'self' or rn_ever > 1 then 2 else 10 end
                   when v_kind = 'self' then case when rn_all <= 3 then 2 else 0 end
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
    -- v78: no "A miss fixed" bonus any more (Sam, 2026-11-19)
    -- v66: the run of right answers in a row (graded from a key), with its prizes. Only within the speed limit and a
    -- question's first three right answers of the day: a 4th, or one under 2 seconds, pays but neither adds nor breaks it
    if speed_ok and v_kind in ('one', 'all', 'order') and (rn_same <= 3 or not v_correct) then
      bonus := bonus || sh_run_step(p_visitor, p_hub, aid, v_correct, v_at);
    end if;
  end if;
  -- v66: the day's first answer moves the streak of days studied
  select n into day_n from xp_days where visitor_id = p_visitor and d = dd;
  if coalesce(day_n, 0) = 1 then bonus := bonus || sh_streak_step(p_visitor, p_hub, dd, v_at); end if;
  -- v72: a new medal needs one more question whose latest answer is right, so only a right answer to a question whose
  -- answer before it wasn't right (or that had none) can reach one; every other answer skips the count of the whole hub
  if v_kind in ('one', 'all', 'order', 'self') and v_correct then
    select a.correct into was_right from personal_answers a
      where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid and a.id <> aid
      order by a.answered_at desc, a.id desc limit 1;
    if not coalesce(was_right, false) then medal := sh_medal_check(p_visitor, p_hub, v_at); end if;
  end if;

  v_resp := jsonb_build_object('ok', true, 'correct', v_correct, 'kind', v_kind, 'xp', paid, 'base', v_base, 'mult', v_mult,
    'first', v_correct and rn_ever = 1 and paid > 0, 'why', why, 'bonus', bonus, 'medal', medal,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor),
    'crowns', sh_crowns(p_visitor));
  update answer_xp set resp = v_resp where answer_id = aid;
  return v_resp;
end;
$$;

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
      lag(pa.hub || '|' || pa.qid) over (partition by pa.visitor_id order by pa.t, pa.id) as prev_hq,
      count(*) filter (where coalesce(pa.s_kind, '') <> 'mock')
        over (partition by pa.visitor_id order by pa.t range between interval '60 seconds' preceding and current row) as n60,
      row_number() over (partition by pa.session_id order by pa.t, pa.id) as s_rank,
      row_number() over (partition by pa.session_id, pa.qid order by pa.t, pa.id) as s_qrank,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d, pa.correct order by pa.t, pa.id) as rn_same,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d order by pa.t, pa.id) as rn_all,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.correct order by pa.t, pa.id) as rn_ever,
      row_number() over (partition by pa.visitor_id, pa.d order by pa.t, pa.id) as pos_day
    from pa
  ), e0 as (
    select w.*,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and case
        when w.s_kind = 'mock' then w.s_qrank = 1 and w.s_rank <= 300 and w.t - w.s_start >= w.s_rank * interval '2 seconds'
        else (w.prev_t is null or w.t - w.prev_t >= interval '2 seconds') and w.n60 <= 30 end, false) as g_ok,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and w.correct
        and not coalesce(w.prev_hq = w.hub || '|' || w.qid and w.t - w.prev_t < interval '2 seconds', false)
        and (w.s_kind is distinct from 'mock' or w.s_qrank = 1), false) as r_ok
    from w
  ), e as (
    select e0.*, e0.g_ok or e0.r_ok as ok from e0
  ), b as (
    select e.*,
      case when e.r_ok then case when e.kind = 'self' or e.rn_ever > 1 then 2 else 10 end
        when not e.g_ok then 0
        when e.kind = 'self' then case when e.rn_all <= 3 then 2 else 0 end
        else case when e.rn_same <= 3 then 1 else 0 end end as base_xp,
      sh_xp_mult(e.visitor_id, e.t) as mult
    from e
  )
  select b.visitor_id, 'a:' || b.id, 'answer'::text, b.hub, b.base_xp, b.base_xp * b.mult, b.t, b.d from b where b.base_xp > 0
  union all
  select g.visitor_id, 'g20:' || g.d, 'goal20'::text, g.hub, 30, 30 * g.mult, g.t, g.d from (
    select distinct on (b.visitor_id, b.d) b.visitor_id, b.d, b.hub, b.mult, b.t from b
    where b.ok and b.pos_day >= 20 order by b.visitor_id, b.d, b.t, b.id) g;
$$;

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

  -- v78: the "A miss fixed" awards already paid stay as they were (the replay makes no new ones)
  delete from xp_awards where visitor_id = any(p_ids) and src in ('answer', 'goal20');
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

revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
revoke all on function public.sh_xp_replay(text[]) from public, anon, authenticated;
revoke all on function public.sh_xp_rebuild(text[]) from public, anon, authenticated;
