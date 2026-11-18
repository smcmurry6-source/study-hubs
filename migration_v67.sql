-- v67 (2026-11-18): sh_answer with both of yesterday's changes to it.
-- Two sessions changed sh_answer on 2026-11-17 and both called their migration v64. The first (migration_v64, matching items
-- graded as an order) added one branch: an 'order' answer that comes with no order, from a page cached before matching
-- items were graded that way, is graded by the student's word and paid as a self-graded answer (a flat 2), not recorded as
-- wrong. The second (migration_v66, crowns and prizes; "Every right answer should give xp") was applied after it, on
-- 2026-11-18, and replaced the function from an older copy without that branch. This puts the branch back into v66's
-- sh_answer; nothing else changes. Answers recorded in between: a cached page's matching answer was recorded as wrong and
-- paid nothing (none expected: those pages refresh themselves; the check under "Applied" below counted them).
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js).

create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int; dp boolean;
  speed_ok boolean := false; right_ok boolean := false; v_base int := 0; v_mult int := 1; paid int := 0; v_n int; why text; bonus jsonb := '[]'::jsonb;
  medal jsonb; v_resp jsonb; prev record; day_n int; tap boolean := false;
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
    -- a question missed the last time you answered it before today, right today
    if v_correct and v_kind <> 'self' then
      select a.correct into dp from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date < dd order by a.answered_at desc, a.id desc limit 1;
      if found and not dp then
        v_n := sh_award(p_visitor, 'fix:' || p_hub || ':' || p_qid, 'fix', p_hub, 5, v_mult, v_at);
        if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'fix', 'xp', v_n); end if;
      end if;
    end if;
    -- v66: the run of right answers in a row (graded from a key), with its prizes. Only within the speed limit and a
    -- question's first three right answers of the day: a 4th, or one under 2 seconds, pays but neither adds nor breaks it
    if speed_ok and v_kind in ('one', 'all', 'order') and (rn_same <= 3 or not v_correct) then
      bonus := bonus || sh_run_step(p_visitor, p_hub, aid, v_correct, v_at);
    end if;
  end if;
  -- v66: the day's first answer moves the streak of days studied
  select n into day_n from xp_days where visitor_id = p_visitor and d = dd;
  if coalesce(day_n, 0) = 1 then bonus := bonus || sh_streak_step(p_visitor, p_hub, dd, v_at); end if;
  if v_kind in ('one', 'all', 'order', 'self') then medal := sh_medal_check(p_visitor, p_hub, v_at); end if;

  v_resp := jsonb_build_object('ok', true, 'correct', v_correct, 'kind', v_kind, 'xp', paid, 'base', v_base, 'mult', v_mult,
    'first', v_correct and rn_ever = 1 and paid > 0, 'why', why, 'bonus', bonus, 'medal', medal,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor),
    'crowns', sh_crowns(p_visitor));
  update answer_xp set resp = v_resp where answer_id = aid;
  return v_resp;
end;
$$;

revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
