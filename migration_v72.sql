-- v72 (2026-11-18): saving an answer costs about a quarter of what it did for the class's most active students.
-- On 2026-11-18, the day before the Perio final, answer saves failed in bursts all afternoon (19:35-20:10 UTC: about half of
-- them), with statement timeouts spread over cheap statements. The project is on the Free plan, whose shared CPU runs at
-- full speed only while it has burst left; under a day of the class studying it ran out, and every statement took many
-- times longer. On a throwaway copy with a made-up student of 8,000 answers (3,100 awards), one answer took 20.5 ms, and
-- 19 ms of it was two parts that migration_v68 (the crowns, the same day) and the medals run on every answer:
--   1. sh_wallet, for the balance every reply carries (13 ms): summing the student's awards called sh_is_prize once an
--      award (a SQL function with its own search_path is never inlined). Now the awards are summed by kind first.
--   2. sh_medal_check (5.7 ms): the latest answer to every question of the hub, on every answer, right or wrong, read
--      from every answer the student ever gave there. A medal can only be reached when an answer turns a question's
--      latest answer right, so now only those answers check (sh_answer), and the check looks up the latest answer to each
--      of the hub's counted questions on the index v71 added (1.6 ms).
-- After: 5.1 ms for that student's wrong answer, 6.8 ms for a right one that checks for a medal, 3.4 ms for a light
-- student's (4.1 before); every student's balance the same before and after.
-- Nothing else changes: the same balance, the same medals, the same replies. sh_wallet and sh_medal_check are v68's and
-- sh_answer is v69's (all three md5-checked against the live bodies on 2026-11-18), each with the one change marked "v72".
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js).

create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; prize_xp int; prize_c int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[];
  m_now text[]; m_was text[]; n_t int; n_m int; n_r int; earned int; spent int; dd date := (now() at time zone 'America/Chicago')::date;
  t_c int := sh_time_crowns(p_visitor);
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  -- v72: summed by kind first, so sh_is_prize runs once a kind (about 20), not once an award (thousands); the same totals
  select coalesce(sum(g.e), 0), coalesce(sum(g.b) filter (where sh_is_prize(g.src)), 0),
         coalesce(sum(g.n) filter (where g.src in ('survey', 'checkin')), 0),
         coalesce(sum(g.b) filter (where sh_is_prize(g.src) and g.src not in ('survey', 'checkin')), 0)
    into extra, prize_xp, n_f, prize_c
    from (select a.src, sum(a.xp - a.base) as e, sum(a.base) as b, count(*) as n from xp_awards a where a.visitor_id = p_visitor group by a.src) g;
  base_xp := greatest(0, v_xp - extra - prize_xp);
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
  earned := base_xp / 2 + t_c + prize_c + 1000 * n_f + 25 * n_t + 50 * n_m + 20 * n_r;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 2, 'from_time', t_c,
    'prizes', prize_c + 1000 * n_f, 'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'rewards', n_f, 'pays', sh_prizes(),
    'got', jsonb_build_object(
      'name', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'name'),
      'visit', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || dd),
      'game', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'game:' || dd)));
end;
$$;

create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int; dp boolean;
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

create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[250, 500, 750, 1000]; c timestamptz; paid int; total int := 0; newest int := 0; b_end timestamptz;
begin
  select count(*) into bank from question_keys k where k.hub = p_hub and k.is_current and not k.retired and k.counted;
  if bank = 0 then return null; end if;
  -- v72: the latest answer to each counted question, one index lookup a question (personal_answers_visitor_q, v71), in place
  -- of reading every answer the student ever gave in the hub (thousands for the most active); the same count
  select count(*) filter (where l.correct) into got
    from question_keys k
    cross join lateral (select a.correct from personal_answers a
                        where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = k.qid
                        order by a.answered_at desc, a.id desc limit 1) l
    where k.hub = p_hub and k.is_current and not k.retired and k.counted;
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
  b_end := sh_boost_bump(p_visitor, p_at);   -- v63: bought double XP moves after the medal's 24 hours
  return jsonb_build_object('kind', kinds[newest], 'level', newest, 'xp', total,
    'boost_until', greatest(p_at + interval '24 hours', b_end));
end;
$$;

revoke all on function public.sh_wallet(text) from public, anon, authenticated;
revoke all on function public.sh_medal_check(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
