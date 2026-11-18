-- v66 (2026-11-18): A/B versions of a question, recorded on every answer, and a question-health flag when they differ.
-- Sam, 2026-11-18: "Do the database change. They are A/B versions of questions", and, asked whether to split the class so
-- half see version B first: "Split the class". A hub with content/variants.json (Perio, #405) shows each question in two
-- versions, A (questions.json) and B (the reworded one). The page now picks the first version by device (a hash of the
-- device id and the question id, so about half the class starts on each) and alternates after (widget/hub.js worded()).
-- So each version's first tries come from a like half of the class, and they can be compared fairly.
--
-- 1. question_events.w: the version shown (0 = A, 1 = B; null on a page before this change or a hub without versions).
--    The answer's fingerprint (v) stays the original's, so the two versions are one question with one set of numbers.
-- 2. record_qh takes it as the item's 'w' (0 to 9). Otherwise exactly as migration_v51 wrote it.
-- 3. qh_report gets one more column, wordings: { "<w>": { n: people, c: right } } over first tries on this version.
--    Its return type changes, so the old one is renamed qh_report_v51 (kept, unused, locked like the rest) and the new one
--    created (nothing depends on it but get_question_health, whose plpgsql body names it at run time). A rename, not a
--    drop, so the connector applies it without asking. Otherwise exactly as v51 wrote it.
-- 4. qh_flags: a new flag, ab_gap ("Versions differ"), when the hardest and the easiest version (10+ people each) are 20
--    points or more apart and that is unlikely to be chance (z >= 1.96). Medium, like very_hard; a new code brings a
--    reviewed question back, as every new flag does. Otherwise exactly as v51 wrote it.
-- Nothing here changes grading, XP or what a student sees; it is read only on the admin page (behind the admin secret).
-- Applied to the live project on 2026-11-18 through the connector, in three parts (v65a_question_ab_record, v65b_question_ab_flag,
-- v65c_question_ab_report), before its PR merged: a page before this change sends no 'w', which records as null.
-- It was written as v65; main's v65 (the shop's cosmetics, #409) took the number first, so the file is v66 and the
-- live functions' comments still say migration_v65.
-- Tested on a throwaway copy of supabase/schema.sql (tools/release/admin-ops.js, section 5; rls.js).

alter table public.question_events add column if not exists w smallint;

create or replace function public.record_qh(p_hub text, p_visitor text, p_visit text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; c int := 0; x_q text; x_v text; x_k text; x_ctx text; x_qt text;
begin
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' or p_visitor is null or length(p_visitor) not between 8 and 80
     or p_visit is null or length(p_visit) not between 8 and 80 or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    c := c + 1; exit when c > 60;
    continue when jsonb_typeof(it) is distinct from 'object';
    x_q := it->>'q'; continue when x_q is null or x_q !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$';
    x_v := coalesce(it->>'v', ''); continue when x_v !~ '^[a-z0-9]{0,16}$';
    x_k := case it->>'k' when 'a' then 'answer' when 'v' then 'view' end; continue when x_k is null;
    x_ctx := lower(coalesce(it->>'c', '')); if x_ctx !~ '^[a-z0-9-]{0,16}$' then x_ctx := ''; end if;
    x_qt := lower(coalesce(it->>'t', '')); if x_qt !~ '^[a-z0-9:]{0,16}$' then x_qt := ''; end if;
    insert into question_events (hub, qid, v, visitor_id, visit_id, kind, ctx, try, prev, gap_min, correct, choice, ms, expl_ms, expl_acts, w)
    values (p_hub, x_q, x_v, p_visitor, p_visit, x_k, x_ctx,
      case when x_k = 'answer' then qh_int(it->>'n', 1, 9999) end,
      case when x_k = 'answer' then case it->>'p' when '1' then true when '0' then false end end,
      case when x_k = 'answer' then qh_int(it->>'g', 0, 525600) end,
      case when x_k = 'answer' then case it->>'ok' when '1' then true when '0' then false end end,
      case when x_k = 'answer' then qh_int(it->>'ch', 0, 19) end,
      qh_int(it->>'ms', 0, 3600000),
      case when x_k = 'answer' then qh_int(it->>'em', 0, 3600000) end,
      case when x_k = 'answer' then qh_int(it->>'ea', 0, 999) end,
      qh_int(it->>'w', 0, 9));
    if x_v <> '' then
      insert into question_versions (hub, qid, v, qt, nch, key) values (p_hub, x_q, x_v, x_qt, qh_int(it->>'nch', 1, 20), qh_int(it->>'key', 0, 19))
      on conflict (hub, qid, v) do update set last_seen = now(),
        qt = case when excluded.qt <> '' then excluded.qt else question_versions.qt end,
        nch = coalesce(excluded.nch, question_versions.nch), key = coalesce(excluded.key, question_versions.key);
    end if;
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;


create or replace function public.qh_flags(r jsonb)
returns jsonb language plpgsql immutable as $$
declare
  f jsonb := '[]'::jsonb; score int := 0; codes text[] := '{}'; rf text[] := '{}'; state text;
  st text := r->>'review_status';
  n1 int; c1 int; p1 numeric; src text;
  nch int := (r->>'nch')::int; key int := (r->>'key')::int; qt text := coalesce(r->>'qt', '');
  ch jsonb; tot int; kp int; twn int := 0; tw text; x record;
  du int; dl int; pu numeric; pl numeric; pp numeric; se numeric; dsrc text;
  nrm int; crm int; rsrc text;
  n int; m numeric; hm numeric; e int; a int; ha numeric;
  rs jsonb := coalesce(r->'reasons', '{}'::jsonb); dn int := coalesce((r->>'down')::int, 0); up int := coalesce((r->>'up')::int, 0);
  reason_hit boolean := false;
  wl text; wln int; wlc int; wh text; whn int; whc int;
begin
  -- 1. first-try accuracy: this version if it has 10+ people, else every answer ever (unreviewed questions only)
  if coalesce((r->>'n1')::int, 0) >= 10 then n1 := (r->>'n1')::int; c1 := (r->>'c1')::int; src := 'version';
  elsif st is null and coalesce((r->>'a_n1')::int, 0) >= 10 then n1 := (r->>'a_n1')::int; c1 := (r->>'a_c1')::int; src := 'all';
  end if;
  if src is not null then
    p1 := c1::numeric / n1;
    if qt like 'mcq%' and nch >= 2 and p1 < 1.0 / nch then
      f := f || jsonb_build_object('code', 'below_chance', 'sev', 'high', 'src', src, 'why',
        format('Below chance: %s%% right on the first try (%s people), less than guessing among %s choices (%s%%). Check the key.',
          round(100 * p1), n1, nch, round(100.0 / nch)));
    elsif p1 < 0.40 then
      f := f || jsonb_build_object('code', 'very_hard', 'sev', 'medium', 'src', src, 'why',
        format('Very hard: only %s%% right on the first try (%s people). Is the stem clear and the key right?', round(100 * p1), n1));
    end if;
  end if;

  -- 2. a wrong choice beats the key (multiple choice with a known key): first tries on this version, else all picks ever
  if key is not null then
    -- a missing count arrives as JSON null, not SQL null: only an object counts
    ch := case when jsonb_typeof(r->'choices') = 'object' then r->'choices' else '{}'::jsonb end; src := 'version';
    tot := (select coalesce(sum(value::int), 0) from jsonb_each_text(ch));
    if tot < 8 and st is null then
      ch := case when jsonb_typeof(r->'a_choices') = 'object' then r->'a_choices' else '{}'::jsonb end; src := 'all';
      tot := (select coalesce(sum(value::int), 0) from jsonb_each_text(ch)); end if;
    if tot >= (case src when 'version' then 8 else 12 end) then
      kp := coalesce((ch->>key::text)::int, 0);
      for x in select k, value::int as val from jsonb_each_text(ch) as t(k, value) where k <> key::text loop
        if x.val > twn then twn := x.val; tw := x.k; end if;
      end loop;
      if twn > kp and twn::numeric / tot >= 0.35 then
        f := f || jsonb_build_object('code', 'miskey', 'sev', 'high', 'src', src, 'choice', tw::int, 'why',
          format('Possible miskey: choice %s (as written) was picked by %s%%, the key by %s%% (%s %s).',
            tw::int + 1, round(100.0 * twn / tot), round(100.0 * kp / tot), tot, case src when 'version' then 'first tries' else 'picks, all tries' end));
      end if;
    end if;
  end if;

  -- 3. upside down: the stronger half of the class gets it right less often than the weaker half
  if coalesce((r->>'du')::int, 0) >= 8 and coalesce((r->>'dl')::int, 0) >= 8 then
    du := (r->>'du')::int; dl := (r->>'dl')::int; pu := (r->>'pu')::numeric; pl := (r->>'pl')::numeric; dsrc := 'version';
  elsif st is null and coalesce((r->>'a_du')::int, 0) >= 8 and coalesce((r->>'a_dl')::int, 0) >= 8 then
    du := (r->>'a_du')::int; dl := (r->>'a_dl')::int; pu := (r->>'a_pu')::numeric; pl := (r->>'a_pl')::numeric; dsrc := 'all';
  end if;
  -- a gap of 15 points or more that is also unlikely to be chance (z <= -1.65, one-sided 5%): small groups swing a lot
  if dsrc is not null then
    pp := (pu * du + pl * dl) / (du + dl);
    se := sqrt(pp * (1 - pp) * (1.0 / du + 1.0 / dl));
    if pu - pl <= -0.15 and se > 0 and (pu - pl) / se <= -1.65 then
      f := f || jsonb_build_object('code', 'upside_down', 'sev', 'high', 'src', dsrc, 'why',
        format('Stronger students miss it more: %s%% of the top half of the class got it right on the first try, %s%% of the bottom half (%s and %s people). Often a miskey or a trick of wording.',
          round(100 * pu), round(100 * pl), du, dl));
    end if;
  end if;

  -- 4. missed again after seeing the answer
  if coalesce((r->>'nrm')::int, 0) >= 6 then nrm := (r->>'nrm')::int; crm := (r->>'crm')::int; rsrc := 'version';
  elsif st is null and coalesce((r->>'a_nrm')::int, 0) >= 6 then nrm := (r->>'a_nrm')::int; crm := (r->>'a_crm')::int; rsrc := 'all';
  end if;
  if rsrc is not null and crm::numeric / nrm < 0.5 then
    f := f || jsonb_build_object('code', 'missed_again', 'sev', 'medium', 'src', rsrc, 'why',
      format('Missed again after seeing the answer: of %s people who missed it, only %s got it right the next time. The key, the explanation or the stem may be unclear.', nrm, crm));
  end if;

  -- 5. students' own feedback: open reports, and thumbs down with a reason (this version)
  if coalesce((r->>'reports_open')::int, 0) > 0 then
    f := f || jsonb_build_object('code', 'reported', 'sev', 'high', 'src', 'feedback', 'why',
      format('%s open report%s from students (Inbox).', r->>'reports_open', case when (r->>'reports_open')::int = 1 then '' else 's' end));
  end if;
  if coalesce((rs->>'wrong-key')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_wrong', 'sev', 'high', 'src', 'feedback', 'why', format('%s people say the answer looks wrong.', rs->>'wrong-key')); end if;
  if coalesce((rs->>'confusing')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_confusing', 'sev', 'medium', 'src', 'feedback', 'why', format('%s people say the wording is confusing.', rs->>'confusing')); end if;
  if coalesce((rs->>'not-in-notes')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_notes', 'sev', 'medium', 'src', 'feedback', 'why', format('%s people say it isn''t in the notes.', rs->>'not-in-notes')); end if;
  if coalesce((rs->>'explanation')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_explanation', 'sev', 'low', 'src', 'feedback', 'why', format('%s people say the explanation didn''t help.', rs->>'explanation')); end if;
  if coalesce((rs->>'giveaway')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_giveaway', 'sev', 'low', 'src', 'feedback', 'why', format('%s people say it gives the answer away.', rs->>'giveaway')); end if;
  if not reason_hit and dn >= 3 and dn::numeric / (dn + up) >= 0.5 then
    f := f || jsonb_build_object('code', 'disliked', 'sev', 'medium', 'src', 'feedback', 'why', format('%s of %s votes say it isn''t a good question.', dn, dn + up));
  end if;

  -- 6. time, abandonment and the explanation (this version only: these are new measurements)
  n := coalesce((r->>'nt')::int, 0); m := (r->>'med_ms')::numeric; hm := (r->>'hub_med_ms')::numeric;
  if n >= 8 and m >= 45000 and hm > 0 and m >= 2 * hm then
    f := f || jsonb_build_object('code', 'slow', 'sev', 'low', 'src', 'version', 'why',
      format('Slow: the median first try takes %s s, %s times the hub''s median for this kind of question (%s s). Long or confusing stem?',
        round(m / 1000), round(m / hm, 1), round(hm / 1000)));
  end if;
  e := coalesce((r->>'engaged')::int, 0); a := coalesce((r->>'abandoned')::int, 0); ha := (r->>'hub_abandon')::numeric;
  if e >= 10 and a::numeric / e >= 0.30 and (ha is null or a::numeric / e >= 2 * ha) then
    f := f || jsonb_build_object('code', 'abandoned', 'sev', 'low', 'src', 'version', 'why',
      format('Often left unanswered: %s of %s people who read it for 8 s or more moved on without answering (hub: %s%%).',
        a, e, coalesce(round(100 * ha)::text, '?')));
  end if;
  if coalesce((r->>'miss_n')::int, 0) >= 10 and (r->>'miss_quick')::numeric / (r->>'miss_n')::numeric >= 0.7 then
    f := f || jsonb_build_object('code', 'expl_skipped', 'sev', 'low', 'src', 'version', 'why',
      format('Explanation skipped: %s of %s who missed it left the explanation within 3 s. Too long, or not helpful?', r->>'miss_quick', r->>'miss_n'));
  end if;

  -- 8. A/B: the question's versions (A, questions.json; B, content/variants.json) compared on first tries. The class is
  -- split by device, so each version's first tries come from a like group (migration_v66): the hardest and the easiest
  -- with 10+ people each, 20 points apart or more and unlikely to be chance (two-sided 5%, z >= 1.96)
  if jsonb_typeof(r->'wordings') = 'object' then
    select wv.key, (wv.value->>'n')::int, (wv.value->>'c')::int into wl, wln, wlc from jsonb_each(r->'wordings') wv
      where (wv.value->>'n')::int >= 10 order by (wv.value->>'c')::numeric / (wv.value->>'n')::int, wv.key limit 1;
    select wv.key, (wv.value->>'n')::int, (wv.value->>'c')::int into wh, whn, whc from jsonb_each(r->'wordings') wv
      where (wv.value->>'n')::int >= 10 order by (wv.value->>'c')::numeric / (wv.value->>'n')::int desc, wv.key limit 1;
    if wl is not null and wh is not null and wl <> wh then
      pp := (wlc + whc)::numeric / (wln + whn);
      se := sqrt(pp * (1 - pp) * (1.0 / wln + 1.0 / whn));
      if whc::numeric / whn - wlc::numeric / wln >= 0.20 and se > 0 and (whc::numeric / whn - wlc::numeric / wln) / se >= 1.96 then
        f := f || jsonb_build_object('code', 'ab_gap', 'sev', 'medium', 'src', 'version', 'harder', wl::int, 'why',
          format('Versions differ: version %s gets %s%% right on a first try (%s people), version %s gets %s%% (%s people). The harder one may be unclear, or the easier one may give the answer away (A is questions.json, B is variants.json).',
            chr(65 + wl::int), round(100.0 * wlc / wln), wln, chr(65 + wh::int), round(100.0 * whc / whn), whn));
      end if;
    end if;
  end if;

  -- 7. class data under an id the hub no longer has (only known when the admin page passes the live ids)
  if (r->>'in_hub') = 'false' then
    f := f || jsonb_build_object('code', 'gone', 'sev', 'low', 'src', 'ids', 'why',
      'This id has class data but isn''t in the hub any more. Renamed or removed? Ids are permanent (tools/question-ids/).');
  end if;

  select coalesce(array_agg(j->>'code'), '{}'), coalesce(sum(case j->>'sev' when 'high' then 3 when 'medium' then 2 else 1 end), 0)
    into codes, score from jsonb_array_elements(f) j;
  if jsonb_typeof(r->'review_flags') = 'array' then
    rf := array(select jsonb_array_elements_text(r->'review_flags'));
  end if;
  state := case
    when st = 'fix' then case when r->>'review_v' = r->>'v' then 'todo' else 'changed' end
    when jsonb_array_length(f) = 0 then 'clear'
    when st in ('ok', 'fixed') and r->>'review_v' = r->>'v'
         and codes <@ rf then 'reviewed'
    else 'new' end;
  return jsonb_build_object('flags', f, 'score', score, 'state', state);
end;
$$;


alter function public.qh_report(text, integer, jsonb) rename to qh_report_v51;
create function public.qh_report(p_hub text, p_days integer default 120, p_current jsonb default null)
returns table(
  hub text, qid text, in_hub boolean, v text, versions integer, v_since timestamptz, qt text, nch integer, key integer,
  n1 integer, c1 integer, choices jsonb, nr integer, cr integer, nrm integer, crm integer,
  nt integer, med_ms integer, hub_med_ms integer, engaged integer, abandoned integer, hub_abandon numeric,
  answers integer, miss_n integer, miss_quick integer, expl_med_ms integer, expl_acts numeric,
  du integer, pu numeric, dl integer, pl numeric,
  a_n1 integer, a_c1 integer, a_nrm integer, a_crm integer, a_du integer, a_pu numeric, a_dl integer, a_pl numeric,
  a_attempts integer, a_correct integer, a_choices jsonb, wordings jsonb,
  up integer, down integer, reasons jsonb, reports_open integer, reports jsonb,
  review_status text, review_v text, review_flags text[], review_note text, review_at timestamptz,
  flags jsonb, score integer, state text)
language sql stable set search_path = public as $$
with
win as (select now() - make_interval(days => greatest(1, least(coalesce(p_days, 120), 730))) as since),
vers as (select qv.qid, qv.v, qv.qt, qv.nch, qv.key, qv.first_seen from question_versions qv where qv.hub = p_hub),
latest as (select distinct on (vers.qid) vers.* from vers order by vers.qid, vers.first_seen desc),
nv as (select vers.qid, count(*)::int n from vers group by vers.qid),
rep as (
  select substring(f.note from '  — question ([^ ]+)') qid, f.id, f.note, f.resolved, f.created_at, f.reply
  from question_flags f where f.hub = p_hub
),
uni as (
  select vers.qid from vers
  union select pa.qid from personal_answers pa where pa.hub = p_hub
  union select fb.qid from question_feedback fb where fb.hub = p_hub
  union select rep.qid from rep where rep.qid is not null
  union select rv.qid from question_reviews rv where rv.hub = p_hub
),
-- p_current values: the live fingerprint, or { v, key, nch, qt } (the admin page sends both, read off SH_EXPORT, so the
-- key and choice count are known before any version row exists)
pcur as (
  select u.qid,
    case jsonb_typeof(p_current->u.qid) when 'object' then p_current->u.qid->>'v' when 'string' then p_current->>u.qid end v,
    case when jsonb_typeof(p_current->u.qid->'qt') = 'string' then p_current->u.qid->>'qt' end qt,
    case when jsonb_typeof(p_current->u.qid->'nch') = 'number' then (p_current->u.qid->>'nch')::int end nch,
    case when jsonb_typeof(p_current->u.qid->'key') = 'number' then (p_current->u.qid->>'key')::int end key
  from uni u
),
cur as (
  select u.qid, coalesce(pc.v, l.v, '') v, coalesce(nv.n, 0) versions,
         coalesce(nullif(pc.qt, ''), nullif(m.qt, ''), l.qt, '') qt, coalesce(pc.nch, m.nch, l.nch)::int nch,
         coalesce(pc.key, m.key, l.key)::int key, m.first_seen v_since,
         case when p_current is null then null else p_current ? u.qid end in_hub
  from uni u join pcur pc on pc.qid = u.qid left join latest l on l.qid = u.qid left join nv on nv.qid = u.qid
  left join vers m on m.qid = u.qid and m.v = coalesce(pc.v, l.v)
),
ev as (
  select e.qid, e.kind, e.ctx, e.try, e.prev, e.correct, e.choice, e.ms, e.expl_ms, e.expl_acts, e.visit_id, e.at, e.w,
         coalesce(lk.primary_id, e.visitor_id) person
  from question_events e
  join cur c on c.qid = e.qid and c.v = e.v
  left join visitor_links lk on lk.alias_id = e.visitor_id
  where e.hub = p_hub and e.at > (select since from win)
),
ft as (select distinct on (ev.qid, ev.person) ev.qid, ev.person, ev.correct, ev.choice, ev.ms, ev.ctx
       from ev where ev.kind = 'answer' and ev.try = 1 order by ev.qid, ev.person, ev.at),
ft_agg as (
  select ft.qid, count(*)::int n1, count(*) filter (where ft.correct)::int c1,
    count(*) filter (where ft.ms is not null and ft.ctx <> 'mock')::int nt,
    (percentile_cont(0.5) within group (order by ft.ms) filter (where ft.ms is not null and ft.ctx <> 'mock'))::int med_ms
  from ft group by ft.qid
),
ft_ch as (select x.qid, jsonb_object_agg(x.choice::text, x.n) choices
          from (select ft.qid, ft.choice, count(*)::int n from ft where ft.choice is not null group by 1, 2) x group by x.qid),
-- A/B: each person's first try at the question, by the version they were shown (null w: a page before migration_v66)
ft_w as (
  select y.qid, jsonb_object_agg(y.w::text, jsonb_build_object('n', y.n, 'c', y.c)) wordings
  from (select z.qid, z.w, count(*)::int n, count(*) filter (where z.correct)::int c
        from (select distinct on (ev.qid, ev.person) ev.qid, ev.w, ev.correct from ev
              where ev.kind = 'answer' and ev.try = 1 order by ev.qid, ev.person, ev.at) z
        where z.w is not null group by 1, 2) y
  group by y.qid
),
hub_ms as (select c.qt, (percentile_cont(0.5) within group (order by ft.ms))::int m
           from ft join cur c on c.qid = ft.qid where ft.ms is not null and ft.ctx <> 'mock' group by c.qt),
r1 as (select distinct on (ev.qid, ev.person) ev.qid, ev.correct from ev where ev.kind = 'answer' and ev.try > 1 order by ev.qid, ev.person, ev.at),
rm as (select distinct on (ev.qid, ev.person) ev.qid, ev.correct from ev where ev.kind = 'answer' and ev.try > 1 and ev.prev = false order by ev.qid, ev.person, ev.at),
r_agg as (select r1.qid, count(*)::int nr, count(*) filter (where r1.correct)::int cr from r1 group by r1.qid),
rm_agg as (select rm.qid, count(*)::int nrm, count(*) filter (where rm.correct)::int crm from rm group by rm.qid),
vis as (
  select ev.qid, ev.person, coalesce(sum(ev.ms) filter (where ev.kind = 'view'), 0) vms, bool_or(ev.kind = 'answer') ans
  from ev where ev.ctx <> 'mock' group by ev.qid, ev.person, ev.visit_id
),
vis_p as (select vis.qid, vis.person, bool_or(vis.vms >= 8000 or vis.ans) eng, bool_or(vis.vms >= 8000 and not vis.ans) and not bool_or(vis.ans) ab
          from vis group by vis.qid, vis.person),
ab_agg as (select vis_p.qid, count(*) filter (where vis_p.eng)::int engaged, count(*) filter (where vis_p.ab)::int abandoned from vis_p group by vis_p.qid),
hub_ab as (select sum(ab_agg.abandoned)::numeric / nullif(sum(ab_agg.engaged), 0) r from ab_agg),
ex_agg as (
  select ev.qid, count(*)::int answers,
    count(*) filter (where not ev.correct and ev.expl_ms is not null)::int miss_n,
    count(*) filter (where not ev.correct and ev.expl_ms is not null and ev.expl_ms < 3000)::int miss_quick,
    (percentile_cont(0.5) within group (order by ev.expl_ms) filter (where not ev.correct and ev.expl_ms is not null))::int expl_med_ms,
    round(avg(ev.expl_acts) filter (where ev.expl_acts is not null), 2) expl_acts
  from ev where ev.kind = 'answer' and ev.ctx <> 'mock' group by ev.qid
),
pa as (
  select p.visitor_id person, p.qid, p.correct, p.answered_at,
    row_number() over (partition by p.visitor_id, p.qid order by p.answered_at, p.id) rn,
    lag(p.correct) over (partition by p.visitor_id, p.qid order by p.answered_at, p.id) prevc
  from personal_answers p where p.hub = p_hub
),
abil as (select pa.person, avg(pa.correct::int) acc from pa where pa.rn = 1 group by pa.person having count(*) >= 20),
abm as (select percentile_cont(0.5) within group (order by abil.acc) m from abil),
d_v as (
  select ft.qid,
    count(*) filter (where a.acc > abm.m)::int du, round(avg(ft.correct::int) filter (where a.acc > abm.m), 3) pu,
    count(*) filter (where a.acc <= abm.m)::int dl, round(avg(ft.correct::int) filter (where a.acc <= abm.m), 3) pl
  from ft join abil a on a.person = ft.person cross join abm group by ft.qid
),
pa_w as (select pa.* from pa where pa.answered_at > (select since from win)),
a_ft as (select pa_w.qid, count(*)::int a_n1, count(*) filter (where pa_w.correct)::int a_c1 from pa_w where pa_w.rn = 1 group by pa_w.qid),
a_rm as (select x.qid, count(*)::int a_nrm, count(*) filter (where x.correct)::int a_crm
         from (select distinct on (pa_w.qid, pa_w.person) pa_w.qid, pa_w.correct from pa_w where pa_w.prevc = false order by pa_w.qid, pa_w.person, pa_w.answered_at) x
         group by x.qid),
d_a as (
  select pa_w.qid,
    count(*) filter (where a.acc > abm.m)::int a_du, round(avg(pa_w.correct::int) filter (where a.acc > abm.m), 3) a_pu,
    count(*) filter (where a.acc <= abm.m)::int a_dl, round(avg(pa_w.correct::int) filter (where a.acc <= abm.m), 3) a_pl
  from pa_w join abil a on a.person = pa_w.person cross join abm where pa_w.rn = 1 group by pa_w.qid
),
a_ch as (select qc.qid, jsonb_object_agg(qc.choice::text, qc.picks) a_choices from question_choices qc where qc.hub = p_hub group by qc.qid),
a_st as (select qs.qid, qs.attempts, qs.correct from question_stats qs where qs.hub = p_hub),
fb as (
  select f.qid, count(*) filter (where f.vote = 1)::int up, count(*) filter (where f.vote = -1)::int down
  from question_feedback f join cur c on c.qid = f.qid and c.v = f.v where f.hub = p_hub group by f.qid
),
fbr as (
  select x.qid, jsonb_object_agg(x.reason, x.n) reasons
  from (select f.qid, f.reason, count(*)::int n from question_feedback f join cur c on c.qid = f.qid and c.v = f.v
        where f.hub = p_hub and f.vote = -1 and f.reason is not null group by 1, 2) x group by x.qid
),
rep_agg as (
  select rep.qid, count(*) filter (where not rep.resolved)::int reports_open,
    jsonb_agg(jsonb_build_object('id', rep.id, 'note', left(rep.note, 500), 'resolved', rep.resolved, 'at', rep.created_at,
      'reply', left(rep.reply, 300)) order by rep.created_at desc) reports
  from rep where rep.qid is not null group by rep.qid
),
base as (
  select p_hub hub, c.qid, c.in_hub, c.v, c.versions, c.v_since, c.qt, c.nch, c.key,
    fa.n1, fa.c1, fc.choices, ra.nr, ra.cr, rma.nrm, rma.crm,
    fa.nt, fa.med_ms, hm.m hub_med_ms, ab.engaged, ab.abandoned, round((select r from hub_ab), 3) hub_abandon,
    ex.answers, ex.miss_n, ex.miss_quick, ex.expl_med_ms, ex.expl_acts,
    dv.du, dv.pu, dv.dl, dv.pl,
    af.a_n1, af.a_c1, arm.a_nrm, arm.a_crm, da.a_du, da.a_pu, da.a_dl, da.a_pl,
    st.attempts a_attempts, st.correct a_correct, ach.a_choices, fw.wordings,
    coalesce(fb.up, 0) up, coalesce(fb.down, 0) down, coalesce(fbr.reasons, '{}'::jsonb) reasons,
    coalesce(rp.reports_open, 0) reports_open, coalesce(rp.reports, '[]'::jsonb) reports,
    rv.status review_status, rv.v review_v, rv.flags review_flags, rv.note review_note, rv.updated_at review_at
  from cur c
  left join ft_agg fa on fa.qid = c.qid left join ft_ch fc on fc.qid = c.qid left join hub_ms hm on hm.qt = c.qt
  left join r_agg ra on ra.qid = c.qid left join rm_agg rma on rma.qid = c.qid left join ab_agg ab on ab.qid = c.qid
  left join ex_agg ex on ex.qid = c.qid left join d_v dv on dv.qid = c.qid
  left join a_ft af on af.qid = c.qid left join a_rm arm on arm.qid = c.qid left join d_a da on da.qid = c.qid
  left join a_st st on st.qid = c.qid left join a_ch ach on ach.qid = c.qid left join ft_w fw on fw.qid = c.qid
  left join fb on fb.qid = c.qid left join fbr on fbr.qid = c.qid left join rep_agg rp on rp.qid = c.qid
  left join question_reviews rv on rv.hub = p_hub and rv.qid = c.qid
)
select b.*, (g.x->'flags') flags, (g.x->>'score')::int score, (g.x->>'state') state
from base b cross join lateral (select qh_flags(to_jsonb(b)) x) g
order by (g.x->>'score')::int desc, b.n1 desc nulls last, b.a_n1 desc nulls last, b.qid;
$$;

revoke all on function public.qh_flags(jsonb) from public, anon, authenticated;
revoke all on function public.qh_report(text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.qh_report_v51(text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_qh(text, text, text, jsonb) from public;
grant execute on function public.record_qh(text, text, text, jsonb) to anon, authenticated;
alter function public.qh_flags(jsonb) set search_path = public;
