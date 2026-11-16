-- v59 (2026-11-16): time in Learn and in Flashcards, and the redesign's other sections, placed for the admin page; Learn's
-- answers keep their own context. The first migration after the redesign's release (vault/tasks/inbox.md had its two lines).
-- Sam: "i want to see where people spend the most time between the three" (the Question Bank, Learn and Flashcards), then
-- "yes do it. merge when ready". Written and tested on a throwaway copy of supabase/schema.sql (tools/release/rls.js,
-- admin-ops.js, xp.js); it changes two functions and nothing else (no table, no data, no grant).
--
-- 1. sh_surface(section) (migration_v49, the one home of the section-to-surface mapping) places:
--    - compendium/learn and compendium/cards, which the engine (widget/hub.js section()) sends from this release on while
--      the Question Bank is studied as Learn or as Flashcards: new surfaces `learn` and `cards`. Until now all three
--      were compendium/bank, so the Insights tab's "Where time goes" couldn't tell them apart.
--    - compendium/drill and compendium/misses (the bank's Daily drill and Yesterday's misses sets) as `drill`;
--      more/timmy (the Timmy Time page) as `podcast`; every other more/<page> as a new `more`. They read as `other`
--      since the release (sh_data_quality's unmapped_sections, the 2026-11-15 lessons audit). sh_surface runs when the
--      Insights queries run (no index or column keeps its result), so the days already recorded are placed too.
-- 2. sh_answer (migration_v54, behind record_answer_v2) keeps `learn` as the context of an answer given in Learn, which the
--    page already sends, instead of filing it as `other`. The context is only written to answer_xp.ctx: nothing reads it
--    to pay or check an answer, so what an answer pays doesn't change. The function is otherwise exactly as v54 wrote it.

create or replace function public.sh_surface(p_section text)
returns text language sql immutable parallel safe set search_path = public as $$
  select case
    when p_section is null or p_section = '' then 'unknown'
    when p_section ~ '^compendium/(bank|question-bank)(/|$)' then 'bank'
    when p_section ~ '^compendium/learn(/|$)' then 'learn'
    when p_section ~ '^compendium/(cards|flashcards)(/|$)' then 'cards'
    when p_section ~ '^(compendium/(notes|lecture-notes)|notes)(/|$)' then 'notes'
    when p_section ~ '^(compendium/(mock|mock-exam|mockexam)|mock|mockexam)(/|$)' then 'mock'
    when p_section ~ '^compendium/(cram|cram-sheet)(/|$)' then 'cram'
    when p_section ~ '^compendium/(hints|exam-hints)(/|$)' then 'hints'
    when p_section ~ '^compendium/weak' then 'weak-spots'
    when p_section ~ '^compendium/(recall|active-recall)(/|$)' then 'recall'
    when p_section ~ '^(home|compendium/(home|course-info|dashboard))(/|$)' then 'home'
    when p_section ~ '^review(/|$)' then 'review'
    when p_section ~ '^(drill|compendium/(drill|misses))(/|$)' then 'drill'
    when p_section ~ '^(arcade|game|quest)(/|$)' then 'arcade'
    when p_section ~ '^(podcast|more/timmy)(/|$)' then 'podcast'
    when p_section ~ '^more(/|$)' then 'more'
    when p_section ~ '^atlas(/|$)' then 'retired'
    else 'other' end
$$;
grant execute on function public.sh_surface(text) to anon, authenticated;

-- ---------- one answer, checked and paid by the server ----------
-- p_choice: the picked choice's authored index (one-choice questions); p_picks: the ticked indexes (select all) or the
-- order of the authored steps as placed (put in order); p_self: the student's own grade (recall cards, matching);
-- p_v: the question's version as shown; p_ctx: where it was answered (bank, drill, weak, misses, mock, arcade, check,
-- review, case, learn); p_request: a random id per answer, so a retried or replayed call records and pays once; p_session: the
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
revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
