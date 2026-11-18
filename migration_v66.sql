-- v66 (2026-11-18): the class's picks on each choice follow the version of the question's choices.
-- The inbox (2026-11-04 evening lessons audit): "Class picks on each choice ignore question versions: question_choices is
-- keyed by position, so when an edit moves or rewrites choices, last week's percentages show beside a different choice."
-- Since the release, Perio's audits rewrote the choices of 169 of its questions (8 only moved: the same choices in a new
-- order) and Occlusion's 125, so on those cards the "% of the class picked it" counted picks of the old choices.
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js).
--
-- How it works now:
-- 1. A question's choices have a version (question_keys.cv): a fingerprint of its choices and its key, worked out by
--    tools/xp/keys.js and loaded with the answer keys after every merged change to a hub's questions. Only one-choice and
--    select-all questions have one. An edit to the stem, the explanation or a why doesn't change it; an edit to any choice,
--    their order or the key does.
-- 2. record_choice and record_choices stamp each pick with the current version of the question's choices
--    (question_choices.v). The page and sh_answer are unchanged: the server looks the version up itself.
-- 3. question_choices holds only the current version's counts, so nothing that reads it changes (the cards' percentages
--    in widget/v3.js and widget/hub-bank.js, the recap, question health, the admin page, the lessons and retro SQL).
--    When a question's choices get a new version, the old version's counts move to question_choices_past (closed to
--    the public; nothing is deleted), and the new version's start from nothing; if an edit is undone, its counts come
--    back. That happens when the keys are loaded (admin_load_question_keys) and, as a backstop, at the next pick.
-- 4. The picks counted before versions existed (v = '') are taken as the current version's the first time a question's
--    choices get a version, except for the questions whose choices changed since their hub's content JSON first shipped
--    (tools/xp/choice-history.js, from git: the 301 listed at the end, 169 Perio, 125 Occlusion and 7 Heme & Endo
--    Exam 3), whose old picks are set aside (v = 'before') and
--    moved to question_choices_past when their keys load. An edit made on an old single-file page before the redesign's
--    release can't be seen in git, so those picks are kept as they are, as they were shown until now.
-- Hubs without answer keys (the old single-file pages) have no versions and behave exactly as before.
-- It changes nothing a student sees until the keys are loaded with their versions (the After merge workflow does that
-- for every engine hub when tools/xp/keys.js changes); an older keys.js that sends no cv leaves every version as it is.
-- class % right (question_stats) is per question, not per choice, and stays as it is.

-- ---------------------------------------------------------------- tables
alter table public.question_keys add column if not exists cv text not null default '';
alter table public.question_choices add column if not exists v text not null default '';
create table if not exists public.question_choices_past (
  hub text not null,
  qid text not null,
  v text not null,                       -- the version of the choices these picks were made on ('before': unknown, older)
  choice integer not null,
  picks integer not null default 0,
  moved_at timestamptz not null default now(),
  primary key (hub, qid, v, choice)
);
alter table public.question_choices_past enable row level security;   -- no policies: only the functions below touch it
revoke all on table public.question_choices_past from anon, authenticated;

-- ---------------------------------------------------------------- the version and the move
-- the current version of a question's choices, '' when it has none (no key, a retired id, a key loaded without one)
create or replace function public.sh_choice_version(p_hub text, p_qid text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select k.cv from question_keys k where k.hub = p_hub and k.qid = p_qid and k.is_current and not k.retired limit 1), '');
$$;

-- Makes question_choices hold version p_cv's counts for a question: any other version's move to question_choices_past
-- (added to what is kept there), and p_cv's own come back if they were moved out before (an edit undone). Returns how many
-- rows moved out. A row moves in a delete ... returning, which only one of two racing answers gets, so nothing counts twice.
create or replace function public.sh_choices_to(p_hub text, p_qid text, p_cv text)
returns integer language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if coalesce(p_cv, '') = '' then return 0; end if;
  if exists (select 1 from question_choices where hub = p_hub and qid = p_qid and v <> p_cv) then
    with moved as (delete from question_choices where hub = p_hub and qid = p_qid and v <> p_cv returning hub, qid, v, choice, picks)
    insert into question_choices_past (hub, qid, v, choice, picks) select hub, qid, v, choice, picks from moved
    on conflict (hub, qid, v, choice) do update set picks = question_choices_past.picks + excluded.picks, moved_at = now();
    get diagnostics n = row_count;
  end if;
  if exists (select 1 from question_choices_past where hub = p_hub and qid = p_qid and v = p_cv) then
    with back as (delete from question_choices_past where hub = p_hub and qid = p_qid and v = p_cv returning hub, qid, v, choice, picks)
    insert into question_choices (hub, qid, choice, picks, v) select hub, qid, choice, picks, v from back
    on conflict (hub, qid, choice) do update set picks = question_choices.picks + excluded.picks, v = excluded.v;
  end if;
  return n;
end;
$$;
revoke all on function public.sh_choice_version(text, text) from public, anon, authenticated;
revoke all on function public.sh_choices_to(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- recording (public, as before)
create or replace function public.record_choice(p_hub text, p_qid text, p_choice integer)
returns void language plpgsql security definer set search_path = public as $$
declare v_cv text;
begin
  if p_hub is null or p_qid is null or p_choice is null or p_choice < 0 or p_choice > 9 then return; end if;
  v_cv := sh_choice_version(p_hub, p_qid);
  perform sh_choices_to(p_hub, p_qid, v_cv);
  insert into question_choices (hub, qid, choice, picks, v) values (p_hub, p_qid, p_choice, 1, v_cv)
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

-- select-all questions: one pick per ticked option (migration_v28)
create or replace function public.record_choices(p_hub text, p_qid text, p_choices integer[])
returns void language plpgsql security definer set search_path = public as $$
declare v_cv text;
begin
  if p_hub is null or p_qid is null or p_choices is null
     or cardinality(p_choices) = 0 or cardinality(p_choices) > 10 then return; end if;
  v_cv := sh_choice_version(p_hub, p_qid);
  perform sh_choices_to(p_hub, p_qid, v_cv);
  insert into question_choices (hub, qid, choice, picks, v)
  select p_hub, p_qid, c, 1, v_cv from (select distinct unnest(p_choices) c) x where c between 0 and 9
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

-- ---------------------------------------------------------------- loading the keys
-- p_keys: [{"id": "q1", "v": "<fingerprint>", "kind": "one", "answer": [2], "cv": "<choices' version>", "counted": true},
--          {"id": "q9", "retired": true}]
-- p_retire_missing: a current key of this hub missing from p_keys is retired (its id is out of use for good).
-- As migration_v54 wrote it, plus cv: stored with the key (a key loaded again without one keeps the one it had), and the
-- question's picks moved to that version (above). Returns picks_restarted: the questions whose picks start again.
create or replace function public.admin_load_question_keys(p_secret text, p_hub text, p_keys jsonb, p_retire_missing boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it jsonb; v_id text; v_v text; v_kind text; v_ans smallint[]; v_cv text; v_prev text; n_loaded int := 0; n_retired int := 0;
  n_restarted int := 0; k int; ids text[] := '{}';
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
    v_cv := coalesce(it->>'cv', '');
    if v_cv !~ '^[a-z0-9]{0,40}$' then raise exception '%: bad choice version', v_id; end if;
    v_ans := array(select x::smallint from jsonb_array_elements_text(coalesce(it->'answer', '[]'::jsonb)) x);
    if v_kind = 'one' and not (cardinality(v_ans) = 1 and v_ans[1] between 0 and 19) then raise exception '%: a one-choice key needs one answer', v_id; end if;
    if v_kind = 'all' and not (cardinality(v_ans) between 1 and 20 and (select bool_and(x between 0 and 19) and count(distinct x) = count(*) from unnest(v_ans) x))
      then raise exception '%: a select-all key needs distinct answers 0-19', v_id; end if;
    if v_kind = 'order' and not (cardinality(v_ans) between 2 and 20 and (select array_agg(x order by x) from unnest(v_ans) x) = (select array_agg(g::smallint) from generate_series(0, cardinality(v_ans) - 1) g))
      then raise exception '%: an order key is the steps 0..n-1 in their right order', v_id; end if;
    if v_kind = 'self' then v_ans := '{}'; end if;
    if v_kind is null or v_kind not in ('one', 'all', 'order', 'self') then raise exception '%: bad kind %', v_id, coalesce(v_kind, 'null'); end if;
    if v_kind not in ('one', 'all') then v_cv := ''; end if;
    v_prev := (select q.cv from question_keys q where q.hub = p_hub and q.qid = v_id and q.is_current limit 1);
    update question_keys set is_current = false where hub = p_hub and qid = v_id and v <> v_v and is_current;
    insert into question_keys (hub, qid, v, kind, answer, counted, is_current, retired, loaded_at, cv)
      values (p_hub, v_id, v_v, v_kind, v_ans, coalesce((it->>'counted')::boolean, true), true, false, now(), v_cv)
      on conflict (hub, qid, v) do update set kind = excluded.kind, answer = excluded.answer, counted = excluded.counted,
        is_current = true, retired = false, loaded_at = now(),
        cv = case when excluded.cv <> '' then excluded.cv else question_keys.cv end;
    if v_cv <> '' then
      -- the first version a question's choices get: the picks counted before versions existed are this version's
      -- (not the ones this migration set aside as 'before', whose choices changed in the meantime)
      if coalesce(v_prev, '') = '' then update question_choices set v = v_cv where hub = p_hub and qid = v_id and v = ''; end if;
      if sh_choices_to(p_hub, v_id, v_cv) > 0 then n_restarted := n_restarted + 1; end if;
    end if;
    n_loaded := n_loaded + 1;
  end loop;
  if p_retire_missing then
    update question_keys set retired = true where hub = p_hub and is_current and not retired and not (qid = any(ids));
    get diagnostics k = row_count; n_retired := n_retired + k;
  end if;
  return jsonb_build_object('hub', p_hub, 'loaded', n_loaded, 'retired', n_retired, 'picks_restarted', n_restarted,
    'keys', (select count(*) from question_keys where hub = p_hub and is_current and not retired));
end;
$$;
revoke all on function public.admin_load_question_keys(text, text, jsonb, boolean) from public;
grant execute on function public.admin_load_question_keys(text, text, jsonb, boolean) to anon, authenticated;

-- ---------------------------------------------------------------- the picks counted before versions, set aside
-- The questions whose choices (or key) changed since their hub's content JSON first shipped, from git
-- (node tools/xp/choice-history.js --sql, run on main as this was applied): their picks so far mix the old choices with
-- the new, so they are set aside and these questions' percentages start again when their keys load.
update public.question_choices set v = 'before' where v = '' and (hub, qid) in (values
  ('heme-endo-exam3', 'hi-tf-spleen-cm'),
  ('heme-endo-exam3', 'hi-ws-blood'),
  ('heme-endo-exam3', 'hi-ws-nucleus'),
  ('heme-endo-exam3', 'll-2s-bl'),
  ('heme-endo-exam3', 'll-multi-ebv'),
  ('heme-endo-exam3', 'll-num-secondary'),
  ('heme-endo-exam3', 'll-wf-hl'),
  ('occlusion', 'cc-envelope-fn'),
  ('occlusion', 'cs-dn-bal-records'),
  ('occlusion', 'cs-in-rehab-sci'),
  ('occlusion', 'cs-mo-brux-ask'),
  ('occlusion', 'cs-mo-brux-splint'),
  ('occlusion', 'cs-mo-eros-sign'),
  ('occlusion', 'cs-mo-mob-tx'),
  ('occlusion', 'cs-ot-fr-dx'),
  ('occlusion', 'cs-ot-pe-defect'),
  ('occlusion', 'cs-ot-pe-when'),
  ('occlusion', 'dn-acrylic'),
  ('occlusion', 'dn-bal-def'),
  ('occlusion', 'dn-chew'),
  ('occlusion', 'dn-cr'),
  ('occlusion', 'dn-fit'),
  ('occlusion', 'dn-flat-pro'),
  ('occlusion', 'dn-implant-why'),
  ('occlusion', 'dn-ling-ant'),
  ('occlusion', 'dn-m2'),
  ('occlusion', 'dn-md-length'),
  ('occlusion', 'dn-neutro-40'),
  ('occlusion', 'dn-num-3'),
  ('occlusion', 'dn-num-4'),
  ('occlusion', 'dn-partial'),
  ('occlusion', 'dn-resorb-mand'),
  ('occlusion', 'dn-ret-fluid'),
  ('occlusion', 'dn-reverse'),
  ('occlusion', 'dn-support-areas'),
  ('occlusion', 'dn-tongue'),
  ('occlusion', 'dn-wear'),
  ('occlusion', 'dn-wf-co'),
  ('occlusion', 'dn-wf-ling'),
  ('occlusion', 'in-30deg'),
  ('occlusion', 'in-3to5'),
  ('occlusion', 'in-cbd'),
  ('occlusion', 'in-indirect'),
  ('occlusion', 'in-interchange'),
  ('occlusion', 'in-kinematic'),
  ('occlusion', 'in-lab-errors'),
  ('occlusion', 'in-locator'),
  ('occlusion', 'in-nofb'),
  ('occlusion', 'in-nonadj-who'),
  ('occlusion', 'in-sel-poor'),
  ('occlusion', 'in-sel-strong'),
  ('occlusion', 'in-semi-records'),
  ('occlusion', 'in-vps-fit'),
  ('occlusion', 'in-vps-time'),
  ('occlusion', 'in-wf-artic'),
  ('occlusion', 'in-zirconia'),
  ('occlusion', 'mo-3mm'),
  ('occlusion', 'mo-abfraction'),
  ('occlusion', 'mo-acute-malocc'),
  ('occlusion', 'mo-brux-forces'),
  ('occlusion', 'mo-brux-o2'),
  ('occlusion', 'mo-brux-return'),
  ('occlusion', 'mo-brux-tx'),
  ('occlusion', 'mo-cause'),
  ('occlusion', 'mo-class2'),
  ('occlusion', 'mo-deep'),
  ('occlusion', 'mo-direction'),
  ('occlusion', 'mo-div1'),
  ('occlusion', 'mo-gerd'),
  ('occlusion', 'mo-goal1'),
  ('occlusion', 'mo-healing'),
  ('occlusion', 'mo-histo'),
  ('occlusion', 'mo-interf-equal'),
  ('occlusion', 'mo-lit-weak'),
  ('occlusion', 'mo-max-splint'),
  ('occlusion', 'mo-nccl-load'),
  ('occlusion', 'mo-new-medio'),
  ('occlusion', 'mo-num-1'),
  ('occlusion', 'mo-num-5'),
  ('occlusion', 'mo-num-6'),
  ('occlusion', 'mo-occupational'),
  ('occlusion', 'mo-orth-occ'),
  ('occlusion', 'mo-philosophy'),
  ('occlusion', 'mo-prophy'),
  ('occlusion', 'mo-redlight'),
  ('occlusion', 'mo-reflex'),
  ('occlusion', 'mo-regulated'),
  ('occlusion', 'mo-risk-load'),
  ('occlusion', 'mo-scallop'),
  ('occlusion', 'mo-screwdriver'),
  ('occlusion', 'mo-signs'),
  ('occlusion', 'mo-sleep'),
  ('occlusion', 'mo-soda'),
  ('occlusion', 'mo-tmd-def'),
  ('occlusion', 'mo-tmd-split'),
  ('occlusion', 'mo-tuesday'),
  ('occlusion', 'mo-wear-first'),
  ('occlusion', 'mo-wear-pain'),
  ('occlusion', 'mo-wf-mobility'),
  ('occlusion', 'mo-wf-tmd'),
  ('occlusion', 'mo-where'),
  ('occlusion', 'mo-ws-splint'),
  ('occlusion', 'nc-citric'),
  ('occlusion', 'nc-sel-acid'),
  ('occlusion', 'nc-sel-evid'),
  ('occlusion', 'nc-tension'),
  ('occlusion', 'nc-wf-1'),
  ('occlusion', 'nc-ws-2'),
  ('occlusion', 'ot-adapt'),
  ('occlusion', 'ot-anim-alone'),
  ('occlusion', 'ot-anim-ging'),
  ('occlusion', 'ot-anim-perio'),
  ('occlusion', 'ot-cause'),
  ('occlusion', 'ot-class3'),
  ('occlusion', 'ot-codestruct'),
  ('occlusion', 'ot-discrep'),
  ('occlusion', 'ot-fence'),
  ('occlusion', 'ot-fremitus'),
  ('occlusion', 'ot-heal'),
  ('occlusion', 'ot-histology'),
  ('occlusion', 'ot-initiate'),
  ('occlusion', 'ot-mob-dep'),
  ('occlusion', 'ot-oa-does'),
  ('occlusion', 'ot-sel-clin'),
  ('occlusion', 'ot-select'),
  ('occlusion', 'ot-stop'),
  ('occlusion', 'ot-timing'),
  ('occlusion', 'ot-trial'),
  ('occlusion', 'ot-wf-1'),
  ('occlusion', 'ot-wf-2'),
  ('occlusion', 'ot-ws-1'),
  ('occlusion', 'ot-ws-2'),
  ('perio', 'pc-b2'),
  ('perio', 'pc-e1'),
  ('perio', 'q1-03'),
  ('perio', 'q1-04'),
  ('perio', 'q1-13'),
  ('perio', 'q1-17'),
  ('perio', 'q1-18'),
  ('perio', 'q1-20'),
  ('perio', 'q1-22'),
  ('perio', 'q1-23'),
  ('perio', 'q1-27'),
  ('perio', 'q1-29'),
  ('perio', 'q1-32'),
  ('perio', 'q1-E04'),
  ('perio', 'q1-E06'),
  ('perio', 'q2-09'),
  ('perio', 'q2-13'),
  ('perio', 'q2-14'),
  ('perio', 'q2-17'),
  ('perio', 'q2-19'),
  ('perio', 'q2-20'),
  ('perio', 'q2-25'),
  ('perio', 'q2-27'),
  ('perio', 'q2-28'),
  ('perio', 'q2-E03'),
  ('perio', 'q2-F02'),
  ('perio', 'q2-M02'),
  ('perio', 'q2-P01'),
  ('perio', 'q2-S02'),
  ('perio', 'q3-01'),
  ('perio', 'q3-11'),
  ('perio', 'q3-12'),
  ('perio', 'q3-16'),
  ('perio', 'q3-19'),
  ('perio', 'q3-20'),
  ('perio', 'q3-22'),
  ('perio', 'q3-23'),
  ('perio', 'q3-26'),
  ('perio', 'q3-28'),
  ('perio', 'q3-30'),
  ('perio', 'q3-34'),
  ('perio', 'q3-35'),
  ('perio', 'q3-41'),
  ('perio', 'q3-44'),
  ('perio', 'q3-48'),
  ('perio', 'q3-E02'),
  ('perio', 'q3-E04'),
  ('perio', 'q3-P02'),
  ('perio', 'q4-06'),
  ('perio', 'q4-07'),
  ('perio', 'q4-14'),
  ('perio', 'q4-17'),
  ('perio', 'q4-21'),
  ('perio', 'q4-26'),
  ('perio', 'q4-30'),
  ('perio', 'q4-31'),
  ('perio', 'q4-37'),
  ('perio', 'q4-38'),
  ('perio', 'q4-43'),
  ('perio', 'q4-E04'),
  ('perio', 'q4-L08'),
  ('perio', 'q4-L12'),
  ('perio', 'q4-L17'),
  ('perio', 'q4-L18'),
  ('perio', 'q4-L19'),
  ('perio', 'q4-L24'),
  ('perio', 'q4-L29'),
  ('perio', 'q4-L34'),
  ('perio', 'q4-M05'),
  ('perio', 'q4-M06'),
  ('perio', 'q4-P05'),
  ('perio', 'q4-S02'),
  ('perio', 'q5-06'),
  ('perio', 'q5-07'),
  ('perio', 'q5-08'),
  ('perio', 'q5-E01'),
  ('perio', 'q5-E02'),
  ('perio', 'q5-E03'),
  ('perio', 'q5-E05'),
  ('perio', 'q5-L01'),
  ('perio', 'q5-L02'),
  ('perio', 'q5-L03'),
  ('perio', 'q5-L04'),
  ('perio', 'q5-L06'),
  ('perio', 'q5-L09'),
  ('perio', 'q5-L13'),
  ('perio', 'q5-L16'),
  ('perio', 'q5-L17'),
  ('perio', 'q5-L24'),
  ('perio', 'q5-L26'),
  ('perio', 'q5-L31'),
  ('perio', 'q5-L34'),
  ('perio', 'q5-L38'),
  ('perio', 'q5-L39'),
  ('perio', 'q5-L42'),
  ('perio', 'q5-L43'),
  ('perio', 'q5-L47'),
  ('perio', 'q5-L48'),
  ('perio', 'q5-P01'),
  ('perio', 'q5-P02'),
  ('perio', 'q5-P04'),
  ('perio', 'q5-R01'),
  ('perio', 'q5-R04'),
  ('perio', 'q5-R06'),
  ('perio', 'q5-R13'),
  ('perio', 'q5-R18'),
  ('perio', 'q5-R21'),
  ('perio', 'q5-R24'),
  ('perio', 'q5-S05'),
  ('perio', 'q6-01'),
  ('perio', 'q6-02'),
  ('perio', 'q6-03'),
  ('perio', 'q6-04'),
  ('perio', 'q6-05'),
  ('perio', 'q6-06'),
  ('perio', 'q6-07'),
  ('perio', 'q6-L18'),
  ('perio', 'q6-L29'),
  ('perio', 'q6-L31'),
  ('perio', 'q6-L32'),
  ('perio', 'q6-P04'),
  ('perio', 'q6-S01'),
  ('perio', 'q6-S03'),
  ('perio', 'q7-03'),
  ('perio', 'q7-05'),
  ('perio', 'q7-08'),
  ('perio', 'q7-L04'),
  ('perio', 'q7-L07'),
  ('perio', 'q7-L22'),
  ('perio', 'q7-L24'),
  ('perio', 'q7-P01'),
  ('perio', 'q7-P02'),
  ('perio', 'q8-01'),
  ('perio', 'q8-03'),
  ('perio', 'q8-06'),
  ('perio', 'q8-09'),
  ('perio', 'q8-13'),
  ('perio', 'q8-E01'),
  ('perio', 'q8-F01'),
  ('perio', 'q8-L02'),
  ('perio', 'q8-L08'),
  ('perio', 'q8-L19'),
  ('perio', 'q8-L20'),
  ('perio', 'q8-L22'),
  ('perio', 'q8-L31'),
  ('perio', 'q8-L42'),
  ('perio', 'q8-L43'),
  ('perio', 'q8-N03'),
  ('perio', 'q8-P01'),
  ('perio', 'q8-S01'),
  ('perio', 'q9-01'),
  ('perio', 'q9-02'),
  ('perio', 'q9-03'),
  ('perio', 'q9-04'),
  ('perio', 'q9-06'),
  ('perio', 'q9-07'),
  ('perio', 'q9-08'),
  ('perio', 'q9-L02'),
  ('perio', 'q9-L11'),
  ('perio', 'q9-L19'),
  ('perio', 'q9-L26'),
  ('perio', 'q9-L30'),
  ('perio', 'q9-L35'),
  ('perio', 'q9-L40'),
  ('perio', 'q9-L49'),
  ('perio', 'q9-L51'),
  ('perio', 'q9-M02'),
  ('perio', 'q9-S06'),
  ('perio', 'q9-S07')
);
