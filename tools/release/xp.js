#!/usr/bin/env node
// The game layer's server (migration_v54, vault/reference/game-server.md) on a throwaway PostgreSQL: supabase/schema.sql
// as it was before the redesign's release, with made-up history first, then the release's migrations (the part of
// schema.sql after its "the redesign's release" marker: tools/release/pg.js) and any still waiting, as the release ran them. Made-up visitors only; nothing here touches the live database. Checks:
//   - today's rules stay: every XP total, rank profile, board and the 600-a-day cap are the same after the migration,
//     and record_personal_answer still pays as before;
//   - the 63-step ladder: the Handpiece is today's 21 steps exactly, then the ModuPro and the Loupes;
//   - question keys: loading needs the secret; the server decides right or wrong (one choice, select all, order, self
//     graded, a page's older version), and unknown or retired ids earn nothing;
//   - XP with no daily cap: 10 / 2 / 1, three paying right (and wrong) answers per question a day, the speed limit
//     (2 seconds, 30 a minute), and every source: a day studied, the 20th answer, a finished mock, the
//     mastery medals and their double XP, Timmy Time minutes, a finished arcade game, a fixed report;
//   - a replayed call, a double tap and a linked device pay once, and the rebuild gives exactly what the live calls paid;
//   - "Is this your other device?" (name_shared, migration_v87) asks only about another device used in the last 21 days;
//   - Shiny Gold Crowns (from base XP, the grants since the switch, minus spending), the shop's rotation and seasons,
//     buy_item (a double tap, a replayed call, a balance too low, not on sale today, owned, one snack a day, boosts that
//     extend or wait for a medal's to end), equip_item, snack HP in Timmy's days, rare-costume sightings; the preview's purchases (buyCore) answer as
//     sh_buy does, and the rare costume of the day (widget/hub-timmy.js, widget/dash.js) never lands on a holiday or fall day;
//   - the idea board: names, limits, votes, reports, statuses with Inbox notes, an author's delete that removes the idea
//     completely, starter ideas, no visitor ids;
//   - the bootstrap with all of it, the Dark Matter unlock once per journey;
//   - the seasonal sets and the rank sets: the catalog is exactly tools/figures/site/sets.mjs; when each season's set is
//     on sale (sh_shop_seasons, 2026-2028); Halloween's set is everyone's; a rank set is owned at its rank and never
//     sold; two throwback days a month; the daily and weekly picks never hold a seasonal, gift or rank item;
//   - visiting: a board row's key opens that person's place and nothing else of theirs; everyone can be visited, with no
//     way to turn it off; Link my devices moves the place to the id that remains; Visit someone random (migration_v57)
//     goes through everyone in the class who customized their place, each once before anyone twice, never a plain
//     place, you or your linked device, never an id;
//   - Learn and Flashcards (migration_v56): a rating pays a flat 2 for a card's first three a day, under the answers'
//     speed limit; Study ahead and Learn's steps pay nothing; a replayed call, a double tap, a boost, the rebuild and Link
//     my devices; a rating never reaches the class's numbers, your answers or a day studied; get_my_cards;
//   - anon can't reach the private parts.
//   node tools/release/xp.js     (PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { throwaway } = require('./pg');
const KEYS = require('../xp/keys');
const ROOT = path.resolve(__dirname, '../..');
const SECRET = 'xp-test-secret';
const problems = [], notes = [];
let checks = 0;
function ok(cond, what){ checks++; if (!cond) problems.push(what); return !!cond; }
function eq(got, want, what){ return ok(JSON.stringify(got) === JSON.stringify(want), `${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); }

const db = throwaway(SECRET, { pending: false, beforeRelease: true }), { sql, q } = db;
const one = t => (sql(t)[0] || [])[0];
const num = t => Number(one(t));
const json = t => { const r = one(`select (${t})::text`); try { return JSON.parse(r); } catch (e) { throw new Error(`no JSON from ${t.slice(0, 120)}: ${r}`); } };
const rows = t => json(`select coalesce(json_agg(x), '[]') from (${t}) x`);
const anon = t => sql(`begin; set local role anon; ${t}; commit;`);
const anonJson = t => { const r = anon(`select (${t})::text`)[0][0]; return JSON.parse(r); };
function raises(fn, code, what){
  try { fn(); ok(false, `${what}: expected an error${code ? ' ' + code : ''}, got none`); }
  catch (e) { ok(!code || e.code === code, `${what}: expected ${code}, got ${e.code || e.message.split('\n')[0]}`); }
}
const S = q(SECRET);
/* a fixed test clock: 2030-03-04 12:00 Central (a Monday, no holiday, before the DST change) plus n seconds */
const T = n => `('2030-03-04 18:00:00+00'::timestamptz + make_interval(secs => ${n}))`;
const DAY = 86400;
const D0 = '2030-03-04';
function ans(v, qid, o){
  o = o || {};
  const picks = o.picks ? (o.picks.length ? `array[${o.picks.join(',')}]::int[]` : `'{}'::int[]`) : 'null';
  return json(`sh_answer(${o.now ? 'null' : T(o.at || 0)}, ${q(v)}, ${q(o.hub || 'xh')}, ${q(qid)}, ${o.choice == null ? 'null' : o.choice}, ${picks},
    ${o.self == null ? 'null' : o.self}, ${o.v == null ? 'null' : q(o.v)}, ${q(o.ctx || 'bank')}, ${o.req ? q(o.req) : 'null'},
    ${o.session ? q(o.session) + '::uuid' : 'null'}, ${o.claim == null ? 'null' : o.claim})`);
}
const xpOf = v => num(`select coalesce((select xp from xp_visitors where visitor_id = ${q(v)}), 0)`);
const award = (v, key, base) => num(`select sh_award(${q(v)}, ${q(key)}, 'report', 'xh', ${base}, 1, now())`);

try {
  /* ====================================================== made-up history under today's rules (before the migration) */
  // L1: 80 first-right answers on one day (800 raw, capped at 600) and a few on another; a Bronze medal and a trophy
  sql(`insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
         select 'xp-L1', 'xm', 'old' || g, true, '2026-10-01 15:00:00+00'::timestamptz + make_interval(secs => g * 30) from generate_series(1, 80) g;
       insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
         select 'xp-L1', 'xm', 'old' || g, g % 2 = 0, '2026-10-02 15:00:00+00'::timestamptz + make_interval(secs => g * 30) from generate_series(1, 6) g;
       insert into achievements (visitor_id, kind, hub, created_at) values ('xp-L1', 'mastery-bronze', 'xm', '2026-10-02 16:00:00+00'), ('xp-L1', 'owl', '', '2026-10-02 16:00:00+00');
       insert into visitor_names (visitor_id, display_name) values ('xp-L1', 'Made Up Molar');
       insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
         select 'xp-U', 'xh', 'old' || g, true, '2026-10-05 15:00:00+00'::timestamptz + make_interval(secs => g * 30) from generate_series(1, 25) g;
       insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
         select 'xp-PD', 'xh', 'old' || g, g < 3, ((date_trunc('day', now() at time zone 'America/Chicago') - interval '2 days' + interval '12 hours') at time zone 'America/Chicago')
           + make_interval(secs => g * 30) from generate_series(1, 3) g;`);
  const before = {
    xp: rows(`select visitor_id, xp, days, answers, correct, best_days from xp_visitors order by 1`),
    profile: json(`get_rank_profile('xp-L1')`),
    board: rows(`select * from get_rank_board(null, 10)`),
    trophies: rows(`select * from get_trophy_stats() order by kind`)
  };
  eq(before.xp.find(r => r.visitor_id === 'xp-L1').xp, 600 + 20 + (3 * 2 + 3 * 1) + 20, 'today\'s rules: L1 has 600 capped + 20 on day one, three repeats right (2), three wrong (1) + 20 on day two');
  const v1keys = Object.keys(json(`get_widget_bootstrap('xp-L1', 'xm')`)).sort();
  const pd0 = json(`get_widget_bootstrap('xp-PD', 'xh')->'pet_days'`);   // Timmy's days cover the last 70, so this history is recent
  ok(Array.isArray(pd0) && pd0.length === 1 && typeof pd0[0] === 'object' && pd0[0].attempts === 3 && pd0[0].correct === 2,
    `BUG-049 stays fixed in today's schema (v54 section 0, applied live 2026-11-06): Timmy's days are rows with their answers (${JSON.stringify(pd0).slice(0, 80)})`);

  /* ====================================================== the release: migration_v54 to v58 (the part of
     supabase/schema.sql after its "the redesign's release" marker), then any migration still waiting */
  db.applyRelease();
  const applied = db.applyPending();
  notes.push(`applied the release's migrations${applied.length ? ' and ' + applied.join(', ') : ''} on top of the schema as it was before them, with made-up history`);

  /* ---------- 1. today's rules stay ---------- */
  eq(rows(`select visitor_id, xp, days, answers, correct, best_days from xp_visitors order by 1`), before.xp, 'every XP total is the same after the migration');
  eq(json(`get_rank_profile('xp-L1')`), before.profile, 'get_rank_profile is the same after the migration');
  eq(rows(`select * from get_rank_board(null, 10)`), before.board, 'get_rank_board is the same after the migration');
  eq(rows(`select * from get_trophy_stats() order by kind`), before.trophies, 'get_trophy_stats is the same after the migration');
  sql(`select sh_xp_rebuild(array['xp-L1', 'xp-U'])`);
  eq(rows(`select visitor_id, xp, days, answers, correct, best_days from xp_visitors order by 1`), before.xp, 'the new rebuild gives today\'s totals for answers recorded the old way');
  eq(Object.keys(json(`get_widget_bootstrap('xp-L1', 'xm')`)).sort(), v1keys, 'today\'s bootstrap keeps its keys');
  const pd1 = json(`get_widget_bootstrap('xp-PD', 'xh')->'pet_days'`);
  eq(pd1, pd0, 'BUG-049: today\'s bootstrap sends the same rows of Timmy\'s days after the migration');
  // record_personal_answer after the switch: today's rules, the cap included
  anon(`select record_personal_answer('xp-L2', 'xh', 'leg' || g, true) from generate_series(1, 70) g`);
  eq(xpOf('xp-L2'), 620, 'record_personal_answer still caps answer XP at 600 a day after the migration (70 first-right answers: 600 + 20)');
  ok(num(`select count(*) from xp_awards where visitor_id = 'xp-L2'`) === 0, 'record_personal_answer pays no award rows');
  const bl = rows(`select visitor_id, xp, badges from game_baseline where visitor_id = 'xp-L1'`)[0];
  ok(bl && bl.xp === 649 && bl.badges.includes('mastery-bronze:xm') && bl.badges.includes('owl'), `the baseline holds L1's XP and badges at the switch (${JSON.stringify(bl)})`);
  notes.push('today\'s totals, profile, board, trophy rates and the 600 cap unchanged; the rebuild agrees');

  /* ---------- 2. the ladder ---------- */
  const floors = rows(`select g as step, (select step_at from sh_rank(sh_step_floor(g))) as a, sh_step_floor(g) as b from generate_series(0, 20) g`);
  ok(floors.every(r => r.a === r.b), 'the Handpiece journey\'s 21 step floors are today\'s sh_step_floor');
  const mism = num(`select count(*) from generate_series(0, 124999, 37) x where (select step from sh_rank(x)) <> sh_step(x) or (select tier from sh_rank(x)) <> sh_tier(x)`);
  eq(mism, 0, 'below 125,000 XP the new step and tier are today\'s (every 37th XP value)');
  eq(rows(`select r.* from (values (125000), (142857), (249999), (250000), (375000), (2000000)) v(x), sh_rank(v.x) r`).map(r => [r.journey, r.tier, r.level, r.step, r.next_at]),
    [[1, 0, 1, 21, 130952], [1, 1, 1, 24, 148809], [1, 6, 3, 41, 250000], [2, 0, 1, 42, 255952], [2, 6, 3, 62, null], [2, 6, 3, 62, null]],
    'ModuPro starts at 125,000 and Loupes at 250,000; Loupes Dark Matter III is the last step');
  eq(rows(`select r.step_at from generate_series(21, 41, 3) s, sh_rank((select (array[125000,142857,160714,178571,196429,214286,232143])[(s - 21) / 3 + 1])) r`).map(r => r.step_at).length, 7, 'seven ModuPro tiers');

  /* ---------- 3. question keys ---------- */
  const xhKeys = [];
  for (let i = 1; i <= 16; i++) xhKeys.push({ id: 'x' + i, kind: 'one', answer: [1] });
  xhKeys.push({ id: 'x17', kind: 'all', answer: [0, 2] }, { id: 'x18', kind: 'order', answer: [0, 1, 2] }, { id: 'x19', kind: 'self' },
    { id: 'x20', kind: 'one', answer: [1], counted: false });
  raises(() => anon(`select admin_load_question_keys('wrong', 'xh', ${q(JSON.stringify(xhKeys))}::jsonb)`), '28000', 'loading keys with a wrong secret');
  raises(() => anon(`select admin_load_question_keys(${S}, 'xh', '[{"id":"bad","kind":"one","answer":[1,2]}]'::jsonb)`), null, 'a one-choice key with two answers');
  eq(anonJson(`admin_load_question_keys(${S}, 'xh', ${q(JSON.stringify(xhKeys))}::jsonb)`).loaded, 20, 'twenty keys load with the secret');
  const xm = []; for (let i = 1; i <= 10; i++) xm.push({ id: 'm' + i, kind: 'one', answer: [0] }); xm.push({ id: 'm11', kind: 'one', answer: [0], counted: false });
  anon(`select admin_load_question_keys(${S}, 'xm', ${q(JSON.stringify(xm))}::jsonb)`);
  anon(`select admin_load_question_keys(${S}, 'xv', '[{"id":"v1","v":"old","kind":"one","answer":[1]},{"id":"v2","kind":"one","answer":[0]},{"id":"v3","kind":"one","answer":[0]}]'::jsonb)`);
  anon(`select admin_load_question_keys(${S}, 'xv', '[{"id":"v1","v":"new","kind":"one","answer":[3]},{"id":"v2","retired":true}]'::jsonb, true)`);
  eq(rows(`select qid, v, is_current, retired from question_keys where hub = 'xv' order by 1, 2`).map(r => [r.qid, r.v, r.is_current, r.retired]),
    [['v1', 'new', true, false], ['v1', 'old', false, false], ['v2', '', true, true], ['v3', '', true, true]], 'a new version becomes current, the old one stays; retired and missing ids are retired');
  eq(ans('xp-V', 'v1', { hub: 'xv', choice: 1, v: 'old', at: 0 }).correct, true, 'a page showing the old version is graded against the old key');
  eq(ans('xp-V', 'v1', { hub: 'xv', choice: 3, v: 'new', at: 10 }).correct, true, 'the new version against the new key');
  eq(ans('xp-V', 'v1', { hub: 'xv', choice: 3, v: 'unknown-v', at: 20 }).correct, true, 'an unknown version falls back to the current key');
  const ret = ans('xp-V', 'v2', { hub: 'xv', choice: 0, at: 30, claim: false });
  ok(ret.kind === 'one' && ret.correct === true && ret.xp > 0, `a retired id that still has its key is graded from it and pays (migration_v68; ${JSON.stringify(ret)})`);
  // a real bank through tools/xp/keys.js: the last hub on the engine by name that has one (Review of Systems' since 2026-11-19;
  // Heme & Endo Exam 3's before it; Occlusion's, then Perio's, until their pages came down), so the suite outlives any one hub's
  // page. Its multiple choice comes from the bank, and its select-all too when it has one; an ordering and a matching item (and a
  // select-all, for a bank without one) are made up here, through the same keyFor()
  const BANK_HUB = fs.readdirSync(path.join(ROOT, 'hubs')).sort().reverse().find(h => fs.existsSync(path.join(ROOT, 'hubs', h, 'content/questions.json')));
  if (!BANK_HUB) throw new Error('no hub on the engine has a content/questions.json for the keys test');
  const bankQs = JSON.parse(fs.readFileSync(path.join(ROOT, 'hubs', BANK_HUB, 'content/questions.json'), 'utf8'));
  const madeUp = [
    { id: 'xp-seq', lec: 'x', type: 'sequence', stem: 'Put these in order.', steps: ['First', 'Second', 'Third', 'Fourth'], ex: 'E' },
    { id: 'xp-match', lec: 'x', type: 'match', stem: 'Match each.', pairs: [['a', '1'], ['b', '2'], ['c', '3'], ['d', '4']], ex: 'E' },
  ].concat(bankQs.some(x => x.type === 'multi') ? [] : [
    /* a bank with no select-all item (Review of Systems, 2026-11-19) gets a made-up one, so the suite never depends on a hub having one */
    { id: 'xp-multi', lec: 'x', type: 'multi', stem: 'Select all that apply.', choices: ['A', 'B', 'C', 'D'], correct: [0, 2], ex: 'E' },
  ]);
  const occ = KEYS.keys(BANK_HUB).concat(madeUp.map(KEYS.keyFor));
  const loaded = anonJson(`admin_load_question_keys(${S}, ${q(BANK_HUB)}, ${q(JSON.stringify(occ))}::jsonb, true)`);
  ok(loaded.loaded === occ.filter(k => !k.retired).length && loaded.keys === loaded.loaded, `${BANK_HUB}'s ${loaded.loaded} keys load from its content JSON (${JSON.stringify(loaded)})`);
  const oq = bankQs.concat(madeUp);
  const om = oq.find(x => x.type === 'mcq'), omu = oq.find(x => x.type === 'multi'), os = oq.find(x => x.type === 'sequence');
  eq(ans('xp-O', om.id, { hub: BANK_HUB, choice: om.answer, v: KEYS.fp(KEYS.exported(om)), at: 0 }).xp, 10, 'a real bank\'s question answered right with its version: 10 XP');
  eq(ans('xp-O', omu.id, { hub: BANK_HUB, picks: omu.correct.slice().reverse(), at: 10 }).correct, true, 'a real bank\'s select-all answered right in any order');
  eq(ans('xp-O', os.id, { hub: BANK_HUB, picks: os.steps.map((s, i) => i), at: 20 }).correct, true, 'a sequence in its right order');
  eq(ans('xp-O', os.id, { hub: BANK_HUB, picks: os.steps.map((s, i) => i).reverse(), at: 30 }).correct, false, 'a sequence out of order');
  // a matching item is graded like an order (v64): each row's first pick, row k's own being k
  const omt = oq.find(x => x.type === 'match');
  eq(occ.find(k => k.id === omt.id).kind, 'order', 'tools/xp/keys.js lists a matching item as an order');
  const rowsRight = omt.pairs.map((p, i) => i), rowsWrong = rowsRight.map((v, i) => i === 0 ? 1 : i === 1 ? 0 : v);
  eq(ans('xp-O', omt.id, { hub: BANK_HUB, picks: rowsRight, at: 40 }).xp, 10, 'a matching item with every row right: 10 XP, not a self-graded 2');
  const mWrong = ans('xp-O2', omt.id, { hub: BANK_HUB, picks: rowsWrong, claim: true, at: 0 });
  ok(mWrong.correct === false && mWrong.xp === 1, `a matching item with two rows swapped is wrong, whatever the page claims (${JSON.stringify(mWrong)})`);
  const mOld = ans('xp-O3', omt.id, { hub: BANK_HUB, self: true, claim: true, at: 0 });
  ok(mOld.correct === true && mOld.kind === 'self' && mOld.xp === 2, `a page cached before v64 (no rows sent) is taken at its word and paid as self graded (${JSON.stringify(mOld)})`);
  notes.push(`keys: ${loaded.loaded} ${BANK_HUB} keys from tools/xp/keys.js (with a made-up ordering and matching item), versions, retired ids, matching graded by its rows`);

  /* ---------- 3b. the class's picks follow the version of the choices (migration_v66) ---------- */
  const picksOf = (hub, qid) => rows(`select choice, picks, v from question_choices where hub = ${q(hub)} and qid = ${q(qid)} order by choice`).map(r => [r.choice, r.picks, r.v]);
  const pastOf = (hub, qid) => rows(`select v, choice, picks from question_choices_past where hub = ${q(hub)} and qid = ${q(qid)} order by v, choice`).map(r => [r.v, r.choice, r.picks]);
  const loadXc = list => anonJson(`admin_load_question_keys(${S}, 'xc', ${q(JSON.stringify(list))}::jsonb)`);
  // picks counted before versions existed: c1 and c5 as the old pages counted them, c3's set aside as migration_v66 does
  sql(`insert into question_choices (hub, qid, choice, picks) values ('xc', 'c1', 0, 4), ('xc', 'c1', 1, 6), ('xc', 'c3', 2, 5), ('xc', 'c5', 0, 3), ('xc', 'c5', 2, 2);
       update question_choices set v = 'before' where hub = 'xc' and qid = 'c3';`);
  eq(picksOf('xc', 'c1'), [[0, 4, ''], [1, 6, '']], 'picks counted before versions have none');
  // keys loaded without a version (a keys.js before this change): nothing moves, a pick counts as it always did
  loadXc([{ id: 'c1', v: 'f1', kind: 'one', answer: [1] }]);
  ans('xp-CP', 'c1', { hub: 'xc', choice: 0, at: 0 });
  eq(picksOf('xc', 'c1'), [[0, 5, ''], [1, 6, '']], 'without a version a pick counts as before');
  const first = loadXc([{ id: 'c1', v: 'f1', kind: 'one', answer: [1], cv: 'a1' }, { id: 'c3', v: 'f3', kind: 'one', answer: [0], cv: 'c1' },
    { id: 'c4', v: 'f4', kind: 'one', answer: [2], cv: 'd1' }, { id: 'c5', v: 'f5', kind: 'all', answer: [0, 2], cv: 'e1' },
    { id: 'c6', v: 'f6', kind: 'order', answer: [0, 1], cv: 'zz' }]);
  eq(picksOf('xc', 'c1'), [[0, 5, 'a1'], [1, 6, 'a1']], 'the first version a question gets takes the picks counted before it');
  eq([picksOf('xc', 'c3'), pastOf('xc', 'c3')], [[], [['before', 2, 5]]], 'picks set aside by the migration move out when its keys load, kept in question_choices_past');
  eq(first.picks_restarted, 1, `the loader says how many questions' picks start again (${JSON.stringify(first)})`);
  eq(one(`select (cv = '')::text from question_keys where hub = 'xc' and qid = 'c6' and is_current`), 'true', 'only one-choice and select-all questions have a choice version');
  ans('xp-CP', 'c1', { hub: 'xc', choice: 1, v: 'f1', at: 10 });
  ans('xp-CP', 'c5', { hub: 'xc', picks: [0, 1], at: 20 });
  ans('xp-CP', 'c4', { hub: 'xc', choice: 2, at: 30 });
  eq([picksOf('xc', 'c1'), picksOf('xc', 'c5'), picksOf('xc', 'c4')],
    [[[0, 5, 'a1'], [1, 7, 'a1']], [[0, 4, 'e1'], [1, 1, 'e1'], [2, 2, 'e1']], [[2, 1, 'd1']]], 'answers through sh_answer stamp their picks with the current version (one choice, select all, a new question)');
  // an edit to the choices: the old version's picks move out and the new one starts from nothing
  const edit = loadXc([{ id: 'c1', v: 'f1b', kind: 'one', answer: [0], cv: 'a2' }]);
  eq([picksOf('xc', 'c1'), pastOf('xc', 'c1'), edit.picks_restarted], [[], [['a1', 0, 5], ['a1', 1, 7]], 1], 'new choices: the old picks move to question_choices_past');
  ans('xp-CP2', 'c1', { hub: 'xc', choice: 0, v: 'f1b', at: 0 });
  eq(picksOf('xc', 'c1'), [[0, 1, 'a2']], 'the new choices count from their first pick');
  // reloading the same keys moves nothing; a reload from an older keys.js (no cv) keeps the version
  eq(loadXc([{ id: 'c1', v: 'f1b', kind: 'one', answer: [0], cv: 'a2' }]).picks_restarted, 0, 'the same keys again: nothing moves');
  loadXc([{ id: 'c1', v: 'f1b', kind: 'one', answer: [0] }]);
  eq([one(`select cv from question_keys where hub = 'xc' and qid = 'c1' and is_current`), picksOf('xc', 'c1')], ['a2', [[0, 1, 'a2']]], 'a key loaded again without a version keeps its version and its picks');
  // the edit undone: its picks come back, the other version's go out
  loadXc([{ id: 'c1', v: 'f1', kind: 'one', answer: [1], cv: 'a1' }]);
  eq([picksOf('xc', 'c1'), pastOf('xc', 'c1')], [[[0, 5, 'a1'], [1, 7, 'a1']], [['a2', 0, 1]]], 'an edit undone: the old picks come back, the other version\'s are kept');
  // the backstop: picks of another version still in the table (a key changed outside the loader) move at the next pick
  sql(`update question_keys set cv = 'a3' where hub = 'xc' and qid = 'c1' and is_current`);
  anon(`select record_choice('xc', 'c1', 3)`);
  eq(picksOf('xc', 'c1'), [[3, 1, 'a3']], 'record_choice moves another version\'s picks before it counts its own');
  ok(num(`select coalesce(sum(picks), 0) from question_choices_past where hub = 'xc' and qid = 'c1' and v = 'a1'`) === 12, 'and keeps them');
  // a hub without keys (an old single-file page): no versions, as before
  anon(`select record_choice('xold', 'o1', 2); select record_choice('xold', 'o1', 2); select record_choices('xold', 'o2', array[0, 3])`);
  eq([picksOf('xold', 'o1'), picksOf('xold', 'o2')], [[[2, 2, '']], [[0, 1, ''], [3, 1, '']]], 'an old page\'s picks count as before');
  // the past and the helpers are closed to the public; the current picks stay open, as the cards read them
  raises(() => anon(`select * from question_choices_past`), '42501', 'anon can\'t read question_choices_past');
  raises(() => anon(`select sh_choices_to('xc', 'c1', 'zz')`), '42501', 'anon can\'t move a question\'s picks');
  raises(() => anon(`select sh_choice_version('xc', 'c1')`), '42501', 'anon can\'t run sh_choice_version');
  ok(anon(`select count(*) from question_choices where hub = 'xc'`)[0][0] > 0, 'anon still reads question_choices');
  raises(() => loadXc([{ id: 'c1', v: 'f1', kind: 'one', answer: [1], cv: 'Bad One' }]), null, 'a bad choice version is refused');
  // tools/xp/keys.js: the version changes with a choice, the order or the key, and not with the stem or the explanation
  const base = { id: 't', type: 'mcq', stem: 'S', choices: ['a', 'b', 'c'], answer: 1, ex: 'E', why: ['x', 'y', 'z'] }, CV = KEYS.choiceVersion;
  ok(CV(base) && CV(base) === CV({ ...base, stem: 'S2', ex: 'E2', why: ['p', 'q', 'r'] }), 'keys.js: a new stem, explanation or why keeps the version');
  ok(new Set([CV(base), CV({ ...base, choices: ['a', 'b', 'd'] }), CV({ ...base, choices: ['b', 'a', 'c'], answer: 0 }), CV({ ...base, answer: 2 })]).size === 4,
    'keys.js: a new choice, a new order or a new key changes the version');
  ok(CV({ ...base, type: 'multi', correct: [2, 0] }) === CV({ ...base, type: 'multi', correct: [0, 2] }) && CV({ id: 's', type: 'sequence', steps: ['a', 'b'] }) === '',
    'keys.js: a select-all\'s version doesn\'t depend on the order of its key; other kinds have none');
  ok(occ.filter(k => k.kind === 'one' || k.kind === 'all').every(k => /^[a-z0-9]{1,40}$/.test(k.cv)) && occ.filter(k => k.kind === 'order' || k.kind === 'self').every(k => !k.cv),
    'keys.js gives every one-choice and select-all key in the bank a version, and no other');
  notes.push('class picks: stamped with the version of the choices, moved out (and back) when it changes, set aside from before versions, closed past');

  /* ---------- 4. answers, the per-question limit and the speed limit ---------- */
  const seq = [];
  const A = (qid, o, want, label) => { const r = ans('xp-A', qid, o); seq.push(r); eq(r.xp, want, label); return r; };
  A('x1', { choice: 1, at: 0 }, 10, 'first right answer: 10');
  eq(xpOf('xp-A'), 30, 'with the day studied: 20 + 10');
  A('x1', { choice: 1, at: 5 }, 2, 'second right answer that day: 2');
  A('x1', { choice: 1, at: 10 }, 2, 'third: 2');
  /* migration_v68 (Sam: "Every right answer should give xp"): no limit a day and no speed limit on a right answer */
  const r4 = A('x1', { choice: 1, at: 15 }, 2, 'fourth right answer that day: 2 (migration_v68)');
  eq(r4.why, null, 'the fourth has no why');
  const fast = A('x2', { choice: 1, at: 16 }, 10, 'a right answer 1 second after the last: 10 (migration_v68)');
  eq(fast.why, null, 'nothing to say why');
  const fastMiss = A('x3', { choice: 0, at: 16.5 }, 0, 'a miss half a second after the last: nothing');
  eq(fastMiss.why, 'fast', 'it says why');
  ok(num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'x2'`) === 1 && num(`select attempts from question_stats where hub = 'xh' and qid = 'x2'`) >= 1, 'a fast answer still counts in your answers and the class stats');
  A('x3', { choice: 0, at: 20 }, 1, 'a wrong answer: 1');
  A('x3', { choice: 0, at: 25 }, 1, 'second wrong: 1');
  A('x3', { choice: 0, at: 30 }, 0, 'third wrong (the fast one was the first): nothing');
  A('x3', { choice: 0, at: 35 }, 0, 'fourth wrong answer that day: nothing');
  A('x17', { picks: [2, 0], at: 40 }, 10, 'select all, right in any order: 10');
  A('x17', { picks: [0], at: 45 }, 1, 'select all, one missing: wrong');
  A('x18', { picks: [0, 1, 2], at: 50 }, 10, 'put in order, right: 10');
  A('x18', { picks: [1, 0, 2], at: 55 }, 1, 'put in order, wrong: 1');
  A('x19', { self: true, at: 60 }, 2, 'self graded: a flat 2');
  A('x19', { self: false, at: 65 }, 2, 'self graded, missed: 2');
  A('x19', { self: true, at: 70 }, 2, 'self graded, third: 2');
  A('x19', { self: true, at: 75 }, 2, 'self graded, fourth that day, got it: 2 (migration_v68)');
  A('x19', { self: false, at: 77 }, 0, 'self graded, fifth that day, missed: nothing');
  const unk = ans('xp-A', 'nope', { choice: 1, claim: true, at: 80 });
  ok(unk.kind === 'unknown' && unk.xp === 0 && unk.correct === true, `an unknown id earns nothing, recorded with the page's verdict (${JSON.stringify(unk)})`);
  ok(num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'nope'`) === 1, 'an unknown id is still recorded');
  const bad = ans('xp-A', 'x4', { choice: 25, at: 85 });
  ok(bad.ok === false && num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'x4'`) === 0, 'a choice out of range is refused and records nothing');
  A('x1', { choice: 1, at: DAY }, 2, 'the next day, a question already right before: 2');
  ok(xpOf('xp-A') === 20 + 10 + 2 + 2 + 2 + 10 + 2 + 10 + 1 + 10 + 1 + 6 + 2 + 20 + 2, `A's total: two days studied plus every answer (${xpOf('xp-A')})`);
  // thirty a minute: 31 answers exactly 2 seconds apart; the 31st is the 31st in 60 seconds
  const w = [];
  for (let i = 0; i < 31; i++) w.push(ans('xp-W', 'x' + (1 + (i % 16)), { choice: 1, at: i * 2 }).xp);
  ok(w.every(x => x > 0), `31 right answers in a minute all pay (migration_v68; ${w.slice(28).join(',')})`);
  eq(ans('xp-W', 'x5', { choice: 0, at: 62 }).xp, 0, 'a miss as the 32nd in the last minute earns nothing');
  ok(ans('xp-W', 'x6', { choice: 0, at: 95 }).xp > 0, 'a miss pays again once the minute has room');
  notes.push('answers: 10 / 2 / 1, every right answer pays (no limit a day, no speed limit), misses three a day and 2 seconds and 30 a minute, self graded 2, unknown 0, retired graded from its key');

  /* ---------- 5. a replayed call and a double tap ---------- */
  const r1 = ans('xp-R', 'x3', { choice: 1, req: 'req-aaaa-0001', at: 0 });
  const r1b = ans('xp-R', 'x3', { choice: 1, req: 'req-aaaa-0001', at: 10 });
  ok(r1.xp === 10 && r1b.repeat === true && r1b.xp === 10, `a replayed call returns the first answer's result (${JSON.stringify(r1b)})`);
  eq([num(`select count(*) from personal_answers where visitor_id = 'xp-R'`), num(`select count(*) from xp_awards where visitor_id = 'xp-R'`), xpOf('xp-R')], [1, 1, 30],
    'a replayed call records and pays once');
  const dup = ans('xp-R2', 'x3', { choice: 1, req: 'req-aaaa-0001', at: 20 });
  ok(dup.ok === false && dup.error === 'dup' && num(`select count(*) from personal_answers where visitor_id = 'xp-R2'`) === 0, 'another visitor replaying the same request records nothing');
  const t1 = ans('xp-R', 'x4', { choice: 1, req: 'req-aaaa-0002', at: 30 }), t2 = ans('xp-R', 'x4', { choice: 1, req: 'req-aaaa-0003', at: 30.4 });
  ok(t1.xp === 10 && t2.xp === 0 && t2.why === 'fast', `a double tap (two requests 0.4 s apart) pays once (${t1.xp}, ${t2.xp}, ${t2.why})`);
  const p1 = anonJson(`record_answer_v2('xp-RP', 'xh', 'x5', 1, null, null, null, 'bank', 'pub-req-00001')`);
  const p2 = anonJson(`record_answer_v2('xp-RP', 'xh', 'x5', 1, null, null, null, 'bank', 'pub-req-00001')`);
  ok(p1.ok && p1.xp === 10 && p2.repeat && num(`select count(*) from personal_answers where visitor_id = 'xp-RP'`) === 1, 'record_answer_v2 as a visitor: once per request');
  notes.push('a replayed call, a request reused by someone else and a double tap pay once');

  /* ---------- 6. the other sources ---------- */
  // the day's 20th answer
  const g = [];
  for (let i = 0; i < 25; i++) g.push(ans('xp-G', 'x' + (1 + (i % 16)), { choice: 1, at: i * 5 }));
  ok(g[19].bonus.some(b => b.src === 'goal20' && b.xp === 30 * g[19].mult) && g.filter(r => r.bonus.some(b => b.src === 'goal20')).length === 1, 'the day\'s 20th answer pays +30 once');
  // no "A miss fixed" bonus any more (v78, Sam 2026-11-19): a miss from an earlier day, right today, pays the answer alone
  ans('xp-F', 'x5', { choice: 0, at: 0 });
  const fx = ans('xp-F', 'x5', { choice: 1, at: DAY });
  ok(fx.xp === 10 && !fx.bonus.some(b => b.src === 'fix'), `missed yesterday, right today: the answer's 10 XP and no "A miss fixed" bonus (${fx.xp}, ${JSON.stringify(fx.bonus)})`);
  ans('xp-F', 'x5', { choice: 0, at: 2 * DAY });
  ok(!ans('xp-F', 'x5', { choice: 1, at: 3 * DAY }).bonus.length, 'missed again, right again: no bonus');
  ans('xp-F', 'x6', { choice: 0, at: 3 * DAY + 10 });
  ok(!ans('xp-F', 'x6', { choice: 1, at: 3 * DAY + 20 }).bonus.length, 'missed and right the same day: no bonus');
  eq(num(`select count(*) from xp_awards where visitor_id = 'xp-F' and src = 'fix'`), 0, 'no fix award is written');
  // one paid before v78 (made here the way sh_answer paid it) stays through the rebuild below
  eq(num(`select sh_award('xp-F', 'fix:xh:x9', 'fix', 'xh', 5, 1, now() - interval '3 days')`), 5, 'a fix award from before v78');
  // a mock: its answers come in at the end, so each needs 2 seconds of mock time
  const m1 = one(`select sh_session_start(${T(0)}, 'xp-M', 'xh', 'mock', null)`);
  const mk = []; for (let i = 0; i < 12; i++) mk.push(ans('xp-M', 'x' + (i + 1), { choice: i % 4 ? 1 : 0, ctx: 'mock', session: m1, at: 30 + i * 0.1 }).xp);
  ok(mk.every(x => x > 0), `a mock's 12 answers sent at once after 30 seconds all pay (${mk.join(',')})`);
  ok(ans('xp-M', 'x1', { choice: 1, ctx: 'mock', session: m1, at: 31.3 }).xp === 0, 'the same question twice in one mock: the second pays nothing');
  const mf = json(`sh_session_finish(${T(32)}, 'xp-M', ${q(m1)}::uuid, null, 40)`);
  ok(mf.xp === 50 * mf.mult && mf.answers === 13 && mf.correct === 10, `a finished mock: +50 (doubled during a medal's boost) and the server's own count (${JSON.stringify(mf)})`);
  ok(num(`select count(*) from mock_scores where visitor_id = 'xp-M' and correct = 10 and total = 40`) === 1, 'the mock\'s score is saved from the server\'s count');
  ok(json(`sh_session_finish(${T(40)}, 'xp-M', ${q(m1)}::uuid, null, null)`).repeat === true, 'finishing it again: nothing new');
  const m2 = one(`select sh_session_start(${T(100)}, 'xp-M', 'xh', 'mock', null)`);
  const mk2 = []; for (let i = 0; i < 12; i++) mk2.push(ans('xp-M', 'x' + (i + 1), { choice: i % 3 ? 1 : 0, ctx: 'mock', session: m2, at: 110 + i * 0.1 }).xp);
  ok(mk2.every((x, i) => i % 3 ? x > 0 : i < 5 ? x > 0 : x === 0), `a mock sent in after 10 seconds: every right answer pays, a miss only among its first 5 (${mk2.join(',')})`);
  eq(json(`sh_session_finish(${T(120)}, 'xp-M', ${q(m2)}::uuid, null, null)`).xp, 0, 'a second mock in the same hub that day: no second +50');
  const m3 = one(`select sh_session_start(${T(0)}, 'xp-M3', 'xh', 'mock', null)`);
  for (let i = 0; i < 5; i++) ans('xp-M3', 'x' + (i + 1), { choice: 1, ctx: 'mock', session: m3, at: 60 + i });
  eq(json(`sh_session_finish(${T(70)}, 'xp-M3', ${q(m3)}::uuid, null, null)`).xp, 0, 'a mock with fewer than 10 answers: no +50');
  ok(ans('xp-M4', 'x1', { choice: 1, ctx: 'mock', session: m1, at: 200 }).xp === 10 && ans('xp-M4', 'x2', { choice: 0, ctx: 'mock', session: m1, at: 200.1 }).xp === 0,
    'someone else\'s mock gives no mock timing: the usual speed limit for a miss');
  // hub mastery medals and their double XP (hub xm: 10 counted questions and one review-only)
  const md = [];
  for (let i = 1; i <= 10; i++) md.push(ans('xp-D', 'm' + i, { hub: 'xm', choice: 0, at: i * 10 }));
  ok(md[4].medal && md[4].medal.kind === 'mastery-bronze' && md[4].medal.xp === 250, `50% of the bank right: Bronze, +250 (migration_v68; ${JSON.stringify(md[4].medal)})`);
  ok(md[5].mult === 2 && md[5].xp === 20, `the next answer is double XP (${md[5].mult}x, ${md[5].xp})`);
  ok(md[7].medal && md[7].medal.kind === 'mastery-silver' && md[7].mult === 2 && md[8].mult === 2, 'Silver during the boost: still 2x, never more');
  ok(md[8].medal && md[8].medal.kind === 'mastery-gold' && md[9].medal && md[9].medal.kind === 'mastery-crown' && md[9].medal.xp === 1000, 'Gold at 90%, the Crown at 100% (+1,000, migration_v68)');
  ok(num(`select count(*) from achievements where visitor_id = 'xp-D' and kind like 'mastery-%' and hub = 'xm'`) === 4, 'the medals are achievements, as the page records them today');
  const bEnd = one(`select max(ends_at) = ${T(100)} + interval '24 hours' from xp_boosts where visitor_id = 'xp-D'`);
  eq(bEnd, 't', 'each new medal restarts the 24 hours');
  eq(ans('xp-D', 'm11', { hub: 'xm', choice: 1, at: 200 }).medal, null, 'a review-only question doesn\'t move the medal');
  eq(ans('xp-D', 'm1', { hub: 'xm', choice: 0, at: 100 + DAY + 5 }).mult, 1, 'the boost is over 24 hours after the last medal');
  // no back pay: L1's Bronze in xm was reached before the switch
  const l1 = []; for (let i = 1; i <= 5; i++) l1.push(ans('xp-L1', 'm' + i, { hub: 'xm', choice: 0, at: 500 + i * 10 }));
  ok(l1.every(r => !r.medal) && num(`select count(*) from xp_boosts where visitor_id = 'xp-L1'`) === 0, 'a medal reached before the switch pays nothing and starts no boost');
  // a medal the page recorded itself after the switch is paid at the next answer
  anon(`select record_achievement('xp-D2', 'mastery-bronze', 'xm')`);
  const d2 = []; for (let i = 1; i <= 5; i++) d2.push(ans('xp-D2', 'm' + i, { hub: 'xm', choice: 0, at: 1000 + i * 10 }));
  ok(d2[4].medal && d2[4].medal.xp === 250, 'a Bronze recorded by today\'s page after the switch is paid when it\'s reached');
  // a medal won during a shop boost: the boost's unused time moves after the medal's 24 hours (migration_v63)
  sql(`insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at) values ('xp-DB', 'shop:t1', 'shop', 2, ${T(1990)}, ${T(1990 + 3600)})`);
  const mb1 = []; for (let i = 1; i <= 5; i++) mb1.push(ans('xp-DB', 'm' + i, { hub: 'xm', choice: 0, at: 2000 + i * 10 }));
  const mbM = mb1[4].medal, left = 3600 - 60;   // the boost ran 60 of its 3,600 seconds before the Bronze at 2050
  const since = (t, from) => num(`select extract(epoch from (${q(t)}::timestamptz - ${T(from)}))::int`);
  ok(mb1[0].mult === 2 && mbM && mbM.kind === 'mastery-bronze' && since(mbM.boost_until, 2050) === 86400 + left,
    `a medal during a shop boost: double XP lasts 24 hours and the boost's ${left} unused seconds (${JSON.stringify(mbM)})`);
  eq(rows(`select extract(epoch from starts_at - ${T(0)})::int || '-' || extract(epoch from ends_at - ${T(0)})::int as span from xp_boosts where visitor_id = 'xp-DB' and src = 'shop' order by starts_at`).map(r => r.span),
    ['1990-2050', `${2050 + 86400}-${2050 + 86400 + left}`], 'the boost keeps the part it ran and its rest starts as the medal\'s 24 hours end');
  eq([2050 + 86400 - 5, 2050 + 86400 + 100, 2050 + 86400 + left + 5].map(t => num(`select sh_xp_mult('xp-DB', ${T(t)})`)), [2, 2, 1], 'double XP through the medal\'s hours and then the boost\'s rest, then over');
  ok(Date.parse(json(`sh_boost_json('xp-DB', ${T(3000)})`).until) === Date.parse(mbM.boost_until), 'the running boost\'s "until" runs on through the moved boost');
  const mb2 = []; for (let i = 6; i <= 8; i++) mb2.push(ans('xp-DB', 'm' + i, { hub: 'xm', choice: 0, at: 2100 + i * 10 }));
  ok(mb2[2].medal && mb2[2].medal.kind === 'mastery-silver' && num(`select count(*) from xp_boosts where visitor_id = 'xp-DB' and src = 'shop' and ends_at > ${T(2180)}`) === 1
    && num(`select extract(epoch from ends_at - starts_at)::int from xp_boosts where visitor_id = 'xp-DB' and src = 'shop' and ends_at > ${T(2180)}`) === left
    && num(`select extract(epoch from min(starts_at) - ${T(2180)})::int from xp_boosts where visitor_id = 'xp-DB' and src = 'shop' and ends_at > ${T(2180)}`) === 86400,
    'a second medal moves the waiting boost again, whole, after its own 24 hours');
  const mbN = []; for (let i = 1; i <= 5; i++) mbN.push(ans('xp-DN', 'm' + i, { hub: 'xm', choice: 0, at: 3000 + i * 10 }));
  ok(mbN[4].medal && since(mbN[4].medal.boost_until, 3050) === 86400
    && num(`select count(*) from xp_boosts where visitor_id = 'xp-DN' and src = 'shop'`) === 0, 'a medal with no shop boost: 24 hours, as before');
  // the bowling egg's secret trophy (migration_v63)
  award('xp-BW', 'rep:flag:9034', 100);
  const bw1 = anon(`select record_achievement('xp-BW', 'bowling', '')`)[0][0], bw2 = anon(`select record_achievement('xp-BW', 'bowling', '')`)[0][0];
  ok(bw1 === 't' && bw2 === 'f' && json(`sh_wallet('xp-BW')`).trophies === 1, `the Bowling trophy is recorded once and pays 25 crowns as a trophy (${bw1}, ${bw2})`);
  ok(rows(`select n from get_trophy_stats() where kind = 'bowling'`).length === 1, 'and it has a share of the class');
  eq(anon(`select record_achievement('xp-BW', 'no-such-trophy', '')`)[0][0], 'f', 'a kind not on the list is still refused');
  // Timmy Time
  anon(`select admin_set_podcast_episode(${S}, 'xh', 'ep1', 600)`);
  raises(() => anon(`select admin_set_podcast_episode('wrong', 'xh', 'ep1', 600)`), '28000', 'setting an episode with a wrong secret');
  const pm = (m, at) => json(`sh_pod_minute(${T(at)}, 'xp-P', 'xh', 'ep1', ${m})`);
  eq(pm(0, 0).xp, 10, 'a minute of Timmy Time heard: 10');
  eq(pm(1, 10).why, 'fast', 'the next minute 10 seconds later: it waits');
  ok(pm(0, 40).repeat === true, 'the same minute again: nothing');
  eq(pm(1, 50).xp, 10, 'the next minute 50 seconds later (faster than 1x is fine): 10');
  eq(pm(10, 100).error, 'bad', 'a minute past the episode\'s end is refused');
  eq(json(`sh_pod_minute(${T(110)}, 'xp-P', 'xh', 'nope', 0)`).error, 'unknown', 'an unknown episode is refused');
  let pdone = 0; for (let m = 2; m <= 8; m++) pdone += pm(m, 100 + m * 30).done;
  eq(pdone, 100, 'hearing 9 of its 10 minutes finishes it: +100');
  eq(pm(9, 500).done, 0, 'finishing pays once');
  ok(anonJson(`pod_minute_v2('xp-P2', 'xh', 'ep1', 0)`).xp === 10, 'pod_minute_v2 as a visitor');
  // the arcade
  const a1 = one(`select sh_session_start(${T(0)}, 'xp-Q', 'xh', 'arcade', 'board')`);
  eq(json(`sh_session_finish(${T(5)}, 'xp-Q', ${q(a1)}::uuid, 900, null)`).xp, 0, 'a game finished 5 seconds after it started: no bonus');
  const a2 = one(`select sh_session_start(${T(10)}, 'xp-Q', 'xh', 'arcade', 'board')`);
  eq(json(`sh_session_finish(${T(45)}, 'xp-Q', ${q(a2)}::uuid, 1200, null)`).xp, 50, 'a game finished: +50');
  const a3 = one(`select sh_session_start(${T(60)}, 'xp-Q', 'xh', 'arcade', 'board')`);
  eq(json(`sh_session_finish(${T(100)}, 'xp-Q', ${q(a3)}::uuid, 1300, null)`).xp, 0, 'the same game again that day: no second bonus');
  const a4 = one(`select sh_session_start(${T(110)}, 'xp-Q', 'xh', 'arcade', 'cloze')`);
  eq(json(`sh_session_finish(${T(150)}, 'xp-Q', ${q(a4)}::uuid, 500, null)`).xp, 50, 'another game that day: +50');
  ok(!one(`select sh_session_start(${T(0)}, 'xp-Q', 'xh', 'arcade', 'not-a-game')`), 'an unknown game gets no session');
  const a5 = one(`select sh_session_start(${T(160)}, 'xp-Q', 'xh', 'arcade', 'stage')`);
  ok(!!a5 && json(`sh_session_finish(${T(200)}, 'xp-Q', ${q(a5)}::uuid, 24, null)`).xp === 50 && num(`select count(*) from arcade_scores where visitor_id = 'xp-Q' and game = 'stage'`) === 1,
    'Perio\'s Stage & Grade (v64) gets a session, its +50 and its score on the board');
  ok(num(`select count(*) from arcade_scores where visitor_id = 'xp-Q'`) >= 2, 'a finished game posts its score');
  ok(anonJson(`xp_session_finish('xp-Q', (select xp_session_start('xp-Q', 'xh', 'arcade', 'escape')))`).ok === true, 'xp_session_start and xp_session_finish as a visitor');
  // a fixed report, paid to the sender's linked id
  sql(`insert into visitor_links (alias_id, primary_id) values ('xp-S2', 'xp-S');
       insert into question_flags (hub, note, visitor_id) values ('xh', 'made-up report', 'xp-S2');
       insert into hub_suggestions (hub, note, visitor_id) values ('xh', 'made-up suggestion', 'xp-S');`);
  const fid = num(`select id from question_flags where visitor_id = 'xp-S2'`), sid = num(`select id from hub_suggestions where visitor_id = 'xp-S'`);
  raises(() => anon(`select admin_resolve_report_v2('wrong', 'flag', ${fid}, 'fixed')`), '28000', 'resolving with a wrong secret');
  eq(anonJson(`admin_resolve_report_v2(${S}, 'flag', ${fid}, 'fixed', 'The key was wrong; fixed.')`).xp, 100, 'a report resolved as Fixed: +100');
  eq(xpOf('xp-S'), 100, 'paid to the sender\'s primary id');
  eq(anonJson(`admin_resolve_report_v2(${S}, 'flag', ${fid}, 'fixed', null)`).xp, 0, 'Fixed again: once per report');
  eq(anonJson(`admin_resolve_report_v2(${S}, 'suggestion', ${sid}, 'no-change', 'Thanks!')`).xp, 0, 'No change needed: nothing');
  ok(one(`select resolved and reply = 'The key was wrong; fixed.' from question_flags where id = ${fid}`) === 't', 'the report is resolved with its reply, as today');
  const rep = anonJson(`(select json_agg(x) from get_reports_v2(${S}) x)`);
  ok(rep.some(r => r.kind === 'flag' && r.id === fid && r.outcome === 'fixed' && r.xp_paid) && rep.some(r => r.kind === 'suggestion' && r.outcome === 'no-change' && !r.xp_paid), 'get_reports_v2 shows each outcome and whether it paid');
  ok(anonJson(`(select json_agg(x) from get_my_inbox_v2('xp-S2') x)`).some(r => r.kind === 'flag' && r.outcome === 'fixed'), 'the sender\'s Inbox says Fixed');
  notes.push('sources: the 20th answer (no fixed-miss bonus since v78), mocks, medals with double XP (no back pay), Timmy Time, the arcade, fixed reports');

  /* ---------- 7. the rebuild gives what the live calls paid ---------- */
  const ids = ['xp-A', 'xp-W', 'xp-R', 'xp-G', 'xp-F', 'xp-M', 'xp-M3', 'xp-M4', 'xp-D', 'xp-D2', 'xp-P', 'xp-Q', 'xp-V', 'xp-O', 'xp-L1'];
  const arr = `array[${ids.map(q).join(',')}]`;
  const live = rows(`select visitor_id, key, xp, base from xp_awards where visitor_id = any(${arr}) and src in ('answer','goal20') order by 1, 2`);
  const replay = rows(`select visitor_id, key, xp, base from sh_xp_replay(${arr}) order by 1, 2`);
  eq(replay, live, `the replay matches every live answer and goal award (${live.length} rows)`);
  const xpLive = rows(`select visitor_id, xp, days, answers, correct from xp_visitors where visitor_id = any(${arr}) order by 1`);
  sql(`select sh_xp_rebuild(${arr})`);
  eq(rows(`select visitor_id, xp, days, answers, correct from xp_visitors where visitor_id = any(${arr}) order by 1`), xpLive, 'the rebuild gives every total the live calls gave');
  eq(num(`select count(*) from xp_awards where visitor_id = 'xp-F' and key = 'fix:xh:x9' and xp = 5`), 1, 'the rebuild keeps a fix award paid before v78 (nobody\'s XP or crowns go down)');
  notes.push(`rebuild = live: ${live.length} replayed awards over ${ids.length} visitors`);

  /* ---------- 8. Link my devices ---------- */
  ans('xp-K', 'x7', { choice: 1, at: 0 });
  ans('xp-K2', 'x7', { choice: 1, at: 100 });
  json(`sh_pod_minute(${T(0)}, 'xp-K', 'xh', 'ep1', 0)`); json(`sh_pod_minute(${T(200)}, 'xp-K2', 'xh', 'ep1', 0)`);
  const k1 = one(`select sh_session_start(${T(0)}, 'xp-K', 'xh', 'arcade', 'board')`), k2 = one(`select sh_session_start(${T(300)}, 'xp-K2', 'xh', 'arcade', 'board')`);
  json(`sh_session_finish(${T(40)}, 'xp-K', ${q(k1)}::uuid, null, null)`); json(`sh_session_finish(${T(340)}, 'xp-K2', ${q(k2)}::uuid, null, null)`);
  award('xp-K2', 'rep:flag:9001', 10000);
  eq([xpOf('xp-K'), xpOf('xp-K2')], [20 + 10 + 10 + 50 + 100, 20 + 10 + 10 + 50 + 100 + 10000], 'two devices before linking (each with the day\'s first game, migration_v68)');
  sql(`insert into pet_inventory (visitor_id, item_id, bought_at) values ('xp-K', 'bow-tie', now() - interval '2 days'), ('xp-K2', 'scrub-cap', now() - interval '1 day'), ('xp-K2', 'bow-tie', now() - interval '1 day');
       insert into pet_equipped (visitor_id, slot, item_id, set_at) values ('xp-K', 'outfit', 'bow-tie', now() - interval '2 hours'), ('xp-K2', 'outfit', 'scrub-cap', now() - interval '1 hour');
       insert into costume_log (visitor_id, costume, first_day) values ('xp-K2', 'pirate', current_date - 3);`);
  const kb = anonJson(`buy_item('xp-K2', 'apple', 'buy-k2-apple-1')`);
  ok(kb.ok, `the second device buys an apple (${JSON.stringify(kb)})`);
  const kvote = anonJson(`post_idea('xp-K', 'x', 'x', null, 'other')`);   // no name yet: refused, nothing written
  ok(kvote.error === 'name', 'an idea needs a name');
  const code = anon(`select create_link_code('xp-K')`)[0][0];
  eq(anon(`select redeem_link_code(${q(code)}, 'xp-K2')`)[0][0], 'xp-K', 'the second device links to the first');
  eq(num(`select count(*) from personal_answers where visitor_id = 'xp-K2'`) + num(`select count(*) from xp_awards where visitor_id = 'xp-K2'`) + num(`select count(*) from xp_visitors where visitor_id = 'xp-K2'`), 0,
    'nothing is left on the second id');
  eq(xpOf('xp-K'), 20 + 10 + 2 + 10 + 50 + 100 + 10000, 'linked: the question first right once (10 + 2), the minute, the game and the day\'s first game once a day, the report kept');
  const kx = xpOf('xp-K'); sql(`select sh_xp_rebuild(array['xp-K'])`); eq(xpOf('xp-K'), kx, 'rebuilding again changes nothing');
  eq(rows(`select item_id from pet_inventory where visitor_id = 'xp-K' order by 1`).map(r => r.item_id), ['bow-tie', 'scrub-cap'], 'the inventories merge');
  eq(one(`select item_id from pet_equipped where visitor_id = 'xp-K' and slot = 'outfit'`), 'scrub-cap', 'what\'s equipped: the newer choice wins');
  eq(num(`select count(*) from pet_purchases where visitor_id = 'xp-K'`), 1, 'the spending moves');
  const kw = json(`sh_wallet('xp-K')`);
  eq(kw.spent, 100, 'the linked wallet counts the spending');
  ok(rows(`select costume from costume_log where visitor_id = 'xp-K'`).length === 1, 'the costume log moves');
  notes.push('Link my devices: awards, the inventory, what\'s equipped, spending and the costume log merge; the rebuild is stable');

  /* ---------- 8a. "Is this your other device?" asks only about a device used in the last 3 weeks (migration_v87) ---------- */
  sql(`insert into visitor_names (visitor_id, display_name) values
         ('xp-NS1', 'Same Name'), ('xp-NS2', '  same NAME '), ('xp-NS3', 'Old Name'), ('xp-NS4', 'Old Name'),
         ('xp-NS5', 'Linked Name'), ('xp-NS6', 'Linked Name'), ('xp-NS7', 'Ghost Name'), ('xp-NS8', 'Ghost Name');
       insert into visitor_links (alias_id, primary_id) values ('xp-NS6', 'xp-NS6P');
       insert into activity_visits (visit_id, visitor_id, first_at, last_at) values
         ('ns-v1', 'xp-NS1', now() - interval '1 day', now() - interval '1 day'),
         ('ns-v2', 'xp-NS2', now() - interval '20 days', now() - interval '20 days'),
         ('ns-v3', 'xp-NS3', now() - interval '1 hour', now() - interval '1 hour'),
         ('ns-v4', 'xp-NS4', now() - interval '40 days', now() - interval '22 days'),
         ('ns-v6', 'xp-NS6P', now() - interval '1 hour', now() - interval '1 hour'),
         ('ns-v8', 'xp-NS8', now() - interval '1 hour', now() - interval '1 hour');`);
  const shared = (v, n) => anon(`select name_shared(${v === null ? 'null' : q(v)}, ${n === null ? 'null' : q(n)})`)[0][0] === 't';
  eq([shared('xp-NS1', 'Same Name'), shared('xp-NS2', 'same name')], [true, true], 'two devices with one name, both used lately, are asked about each other (case and spaces ignored)');
  eq([shared('xp-NS4', 'Old Name'), shared('xp-NS3', 'Old Name')], [true, false], 'the device in use is no longer asked about one last used 22 days ago; that one, if it is opened again, is asked about the one in use');
  eq(shared('xp-NS5', 'Linked Name'), true, 'a device linked to someone else counts by its person\'s visits (kept under the id it links to)');
  sql(`insert into visitor_links (alias_id, primary_id) values ('xp-NS5', 'xp-NS6P')`);
  eq(shared('xp-NS5', 'Linked Name'), false, 'once the two are linked, never');
  eq([shared('xp-NS8', 'Ghost Name'), shared('xp-NS7', 'Ghost Name')], [false, true], 'a device with no visits at all is never asked about');
  eq([shared(null, 'Same Name'), shared('xp-NS1', ''), shared('xp-NS1', null), shared('xp-NS1', 'x'.repeat(25)), shared('xp-NS9', 'Nobody Has This')],
    [false, false, false, false, false], 'no id, no name, a name over 24 characters or a name nobody else has: false');
  notes.push('"Is this your other device?" (name_shared): only about another device used in the last 21 days, never a linked one');

  /* ---------- 9. Shiny Gold Crowns ---------- */
  const dw = json(`sh_wallet('xp-D')`), dExtra = num(`select sum(xp - base) from xp_awards where visitor_id = 'xp-D'`);
  const dPrize = num(`select coalesce(sum(base), 0) from xp_awards where visitor_id = 'xp-D' and sh_is_prize(src)`);
  ok(dExtra > 0 && dPrize === 2525 && dw.from_xp === Math.floor((xpOf('xp-D') - dExtra - dPrize) / 2), `gold crowns from study XP only: a boost's extra earns none, and a prize (the four medals' 2,500, ten right in a row's 25) pays its own (${dw.from_xp}, extra ${dExtra}, prizes ${dPrize})`);
  eq([dw.medals, dw.trophies], [4, 0], 'four medals since the switch');
  eq([dw.prizes, dw.earned], [2525, dw.from_xp + dw.from_time + 2525 + 4 * 50 + 20 * dw.rankups], 'earned = 5 crowns per 10 study XP + hub time + a prize\'s XP in crowns (migration_v68) + 50 a medal + 20 a rank-up');
  const lw = json(`sh_wallet('xp-L1')`);
  ok(lw.from_xp === Math.floor((xpOf('xp-L1') - lw.prizes) / 2) && lw.prizes === (rows(`select coalesce(sum(base), 0)::int s from xp_awards where visitor_id = 'xp-L1' and sh_is_prize(src)`)[0] || {}).s && lw.medals === 0 && lw.trophies === 0 && lw.rankups === 0, `back pay: L1's XP from before the switch counts, its old medal and trophy don't (${JSON.stringify(lw)})`);
  award('xp-U', 'rep:flag:9002', 1300);
  anon(`select record_achievement('xp-U', 'owl', '')`);
  const uw = json(`sh_wallet('xp-U')`);
  ok(uw.rankups === 2 && uw.trophies === 1 && uw.earned === Math.floor((xpOf('xp-U') - 1300) / 2) + uw.from_time + 1300 + 2 * 20 + 25, `rank-ups and trophies since the switch: +20 and +25 each, a fixed report's XP in crowns (${JSON.stringify(uw)})`);
  // reaching Dark Matter (migration_v89, Sam: "reaching dark matter gets you 5000 crowns"): 5,000 for each journey's Dark
  // Matter, crowns only, and back pay for one reached before the award existed
  award('xp-DM', 'rep:flag:9101', 49000);
  const dm0 = json(`sh_wallet('xp-DM')`), dmX0 = xpOf('xp-DM');
  award('xp-DM', 'rep:flag:9102', 1500);
  const dm1 = json(`sh_wallet('xp-DM')`);
  eq([dm0.dark, dm1.dark, json(`sh_prizes()`).dark], [0, 1, 5000], 'the Handpiece\'s Dark Matter at 50,000 XP: one paid, and sh_prizes() says 5,000');
  eq([xpOf('xp-DM') - dmX0, dm1.earned - dm0.earned - 20 * (dm1.rankups - dm0.rankups)], [1500, 1500 + 5000], 'reaching it pays 5,000 crowns and no XP (the 1,500 XP a fixed report paid, as many crowns, and a rank-up\'s 20)');
  award('xp-DM', 'rep:flag:9103', 10);
  eq(json(`sh_wallet('xp-DM')`).dark, 1, 'once: more XP inside Dark Matter doesn\'t pay it again');
  // reaching a new journey (migration_v89, Sam: "we can upp modupro to 20,000 and then loupes to 30,000"): once each, crowns only
  award('xp-DM', 'rep:flag:9106', 124990 - xpOf('xp-DM'));
  const mp0 = json(`sh_wallet('xp-DM')`), mpX0 = xpOf('xp-DM');
  award('xp-DM', 'rep:flag:9107', 10);
  const mp1 = json(`sh_wallet('xp-DM')`);
  eq([mp0.modupro, mp1.modupro, json(`sh_prizes()`).modupro], [0, 1, 20000], 'the ModuPro at 125,000 XP: paid, and sh_prizes() says 20,000');
  eq([xpOf('xp-DM') - mpX0, mp1.earned - mp0.earned - 20 * (mp1.rankups - mp0.rankups) - 25 * (mp1.trophies - mp0.trophies)], [10, 10 + 20000], 'reaching it pays 20,000 crowns and no XP (beside the 10 XP, a rank-up\'s 20 and the journey trophy\'s 25)');
  award('xp-DM', 'rep:flag:9104', 232142 - xpOf('xp-DM'));
  award('xp-DM', 'rep:flag:9108', 249990 - xpOf('xp-DM'));
  const lp0 = json(`sh_wallet('xp-DM')`);
  award('xp-DM', 'rep:flag:9109', 10);
  const lp1 = json(`sh_wallet('xp-DM')`);
  eq([lp0.loupes, lp1.loupes, lp1.modupro, json(`sh_prizes()`).loupes], [0, 1, 1, 30000], 'the Loupes at 250,000 XP: paid, the ModuPro\'s not paid again, and sh_prizes() says 30,000');
  eq(lp1.earned - lp0.earned - 20 * (lp1.rankups - lp0.rankups) - 25 * (lp1.trophies - lp0.trophies), 10 + 30000, 'reaching them pays 30,000 crowns');
  award('xp-DM', 'rep:flag:9105', 357142 - xpOf('xp-DM'));
  const dm3 = json(`sh_wallet('xp-DM')`);
  ok(dm3.dark === 3 && dm3.modupro === 1 && dm3.loupes === 1 && dm3.earned === dm3.from_xp + dm3.from_time + dm3.prizes + 20 * dm3.rankups + 25 * dm3.trophies + 3 * 5000 + 20000 + 30000, `the ModuPro's Dark Matter at 232,142 and the Loupes' at 357,142: 15,000 in all, with 20,000 and 30,000 for the two journeys, once each (${JSON.stringify(dm3)})`);
  sql(`delete from xp_awards where visitor_id = 'xp-DM'; delete from xp_visitors where visitor_id = 'xp-DM'`);   // off the boards the later checks read
  notes.push('Dark Matter pays 5,000 crowns once per journey, the ModuPro 20,000 and the Loupes 30,000, crowns only, back pay included (migration_v89)');
  // hub time (migration_v68, Sam: "also 100 crowns per hour of hub time"): 25 seconds a ping, at most 100 crowns in a clock
  // hour (two tabs, or a script, can't pay more), the dashboard's and test rows never
  sql(`insert into activity_hourly (h, hub, section, visitor_id, n) values
    ('2026-11-10 14:00+00', 'xh', 'notes', 'xp-HT', 144), ('2026-11-10 15:00+00', 'xh', 'questions', 'xp-HT', 72),
    ('2026-11-10 16:00+00', 'xh', 'notes', 'xp-HT', 100), ('2026-11-10 16:00+00', 'xm', 'notes', 'xp-HT', 100),
    ('2026-11-10 17:00+00', '', 'home', 'xp-HT', 144), ('2026-11-10 17:00+00', 'zz-test', 'notes', 'xp-HT', 144)`);
  const tw = json(`sh_wallet('xp-HT')`);
  eq([tw.from_time, tw.earned, tw.balance], [250, 250, 250], 'hub time: an hour 100, half an hour 50, two hubs at once in one hour 100, the dashboard and test rows nothing');
  raises(() => anon(`select sh_time_crowns('xp-HT')`), null, 'anon can\'t run sh_time_crowns');
  notes.push('Shiny Gold Crowns: 5 per 10 study XP, 100 an hour of hub time (at most 100 in a clock hour), prizes 1:1, medals, trophies, rank-ups');

  /* ---------- 10. the shop ---------- */
  // seasons: in step with holidayId() and isFall() in widget/pet.js, every day of three years
  const petSrc = fs.readFileSync(path.join(ROOT, 'widget/pet.js'), 'utf8');
  const grab = name => { const i = petSrc.indexOf('function ' + name + '('); let j = petSrc.indexOf('{', i), depth = 0, k = j; for (; k < petSrc.length; k++) { if (petSrc[k] === '{') depth++; else if (petSrc[k] === '}' && --depth === 0) break; } return petSrc.slice(i, k + 1); };
  const jsSeason = new Function('day', 'var window = {}, ls = function(){ return null; }, centralDay = function(){ return day; };\n' + grab('holidayId') + '\n' + grab('isFall') + '\nreturn [holidayId() || null, isFall()];');
  const sqlSeasons = rows(`select to_char(d, 'YYYY-MM-DD') as d, sh_season(d::date) as s, sh_is_fall(d::date) as f from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d`);
  const off = sqlSeasons.filter(r => { const [s, f] = jsSeason(r.d); return s !== r.s || f !== r.f; });
  ok(off.length === 0, `sh_season and sh_is_fall match widget/pet.js on every day of 2026-2028 (${off.length} differ${off.length ? ', first ' + JSON.stringify(off[0]) + ' vs ' + JSON.stringify(jsSeason(off[0].d)) : ''})`);
  // Timmy's place draws spring, summer and fall by its own dates (seasonOn in widget/place.js): the shop's windows, every day of three years
  const placeSrc = fs.readFileSync(path.join(ROOT, 'widget/place.js'), 'utf8');
  const pi = placeSrc.indexOf('function seasonOn('), pj = placeSrc.indexOf('\n', pi);
  ok(pi > 0, 'widget/place.js has seasonOn');
  const placeSeason = new Function('day', placeSrc.slice(pi, pj) + '\nreturn seasonOn(day);');
  const shopSeasons = rows(`select to_char(d, 'YYYY-MM-DD') as d, array_to_string(array(select unnest(sh_shop_seasons(d::date)) intersect select unnest(array['spring', 'summer', 'fall'])), ',') as s from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d`);
  const offP = shopSeasons.filter(r => placeSeason(r.d) !== (r.s || ''));
  ok(shopSeasons.length > 1000 && offP.length === 0, `the place's spring, summer and fall match sh_shop_seasons on every day of 2026-2028 (${offP.length} differ${offP.length ? ', first ' + JSON.stringify(offP[0]) + ' vs ' + JSON.stringify(placeSeason(offP[0].d)) : ''})`);
  // the rotation
  const day0 = rows(`select * from sh_shop_day('${D0}') order by shelf, pos`), again = rows(`select * from sh_shop_day('${D0}') order by shelf, pos`);
  eq(again, day0, 'the same day gives the same shop');
  const sh = s => day0.filter(r => r.shelf === s).map(r => r.item_id);
  ok(sh('daily').length === 4 && sh('weekly').length === 3 && !sh('daily').some(x => sh('weekly').includes(x)), `4 daily and 3 weekly items, never the same (${sh('daily')} / ${sh('weekly')})`);
  const weeks = rows(`select d::date as d, array(select item_id from sh_shop_day(d::date) where shelf = 'weekly' order by pos) as w, array(select item_id from sh_shop_day(d::date) where shelf = 'daily' order by pos) as dl
                      from generate_series('${D0}'::date, '${D0}'::date + 6, interval '1 day') d`);
  ok(weeks.every(r => JSON.stringify(r.w) === JSON.stringify(weeks[0].w)), 'the weekly items stay all week (Monday to Sunday)');
  ok(new Set(weeks.map(r => JSON.stringify(r.dl))).size >= 5, 'the daily items change from day to day');
  const freq = rows(`select i.rarity, count(*)::float / count(distinct i.id) as per_item from generate_series('2030-01-01'::date, '2030-12-31'::date, interval '1 day') d
                     cross join lateral sh_shop_day(d::date) s join shop_items i on i.id = s.item_id where s.shelf = 'daily' group by 1`);
  const fr = Object.fromEntries(freq.map(r => [r.rarity, r.per_item]));
  ok(fr.common > fr.uncommon && fr.uncommon > fr.rare && fr.rare > fr.epic && fr.epic > (fr.legendary || 0), `rarer items come up less often (days a year per item: ${JSON.stringify(fr)})`);
  ok(rows(`select item_id from sh_shop_day('2026-10-15') where shelf = 'season'`).map(r => r.item_id).includes('pumpkin-lantern')
    && rows(`select item_id from sh_shop_day('2026-10-15') where shelf = 'season'`).map(r => r.item_id).includes('leaf-pile'), 'Halloween and fall items are on sale in October');
  eq(rows(`select item_id from sh_shop_day('2030-01-15') where shelf = 'season'`).length, 0, 'no seasonal items on a day without a season');
  ok(['apple', 'cheese-cube', 'floss', 'fluoride-rinse', 'boost-1h', 'boost-3h'].every(x => sh('always').includes(x)), 'snacks, floss and boosts are always on the shelf');
  // buying (as a visitor, today)
  const today = rows(`select * from sh_shop_day((now() at time zone 'America/Chicago')::date)`);
  const daily = today.filter(r => r.shelf === 'daily').map(r => r.item_id);
  const notToday = one(`select id from shop_items where active and rotates and season is null and kind not in ('snack','boost','costume') and not (id = any(${q('{' + today.map(r => r.item_id).join(',') + '}')}::text[])) order by id limit 1`);
  const buy = (v, item, req) => anonJson(`buy_item(${q(v)}, ${q(item)}, ${q(req)})`);
  const low = buy('xp-B', 'apple', 'buy-b-0000001');
  ok(low.error === 'balance' && num(`select count(*) from pet_purchases where visitor_id = 'xp-B'`) === 0, 'a balance too low buys nothing');
  award('xp-B', 'rep:flag:9003', 60000);
  const ap = buy('xp-B', 'apple', 'buy-b-0000002'), apr = buy('xp-B', 'apple', 'buy-b-0000002');
  ok(ap.ok && ap.hp === 10 && apr.repeat === true && num(`select count(*) from pet_purchases where visitor_id = 'xp-B'`) === 1, 'a replayed buy buys once');
  eq(buy('xp-B', 'apple', 'buy-b-0000003').error, 'today', 'one apple a day');
  ok(buy('xp-B', 'cheese-cube', 'buy-b-0000004').ok, 'another snack the same day');
  const pdays = rows(`select * from get_pet_days_v2('xp-B')`);
  ok(pdays.length === 1 && pdays[0].hp === 25 && pdays[0].attempts === 0, `the snacks' HP shows in Timmy's days, on a day without answers too (${JSON.stringify(pdays)})`);
  eq(buy('xp-B', notToday, 'buy-b-0000005').error, 'not-today', `an item not on sale today (${notToday})`);
  eq(buy('xp-B', 'no-such-item', 'buy-b-0000006').error, 'unknown', 'an unknown item');
  const tap1 = buy('xp-B', daily[0], 'buy-b-0000007'), tap2 = buy('xp-B', daily[0], 'buy-b-0000008');
  ok(tap1.ok && tap2.error === 'owned' && num(`select count(*) from pet_inventory where visitor_id = 'xp-B' and item_id = ${q(daily[0])}`) === 1, 'a double tap on something you keep: bought once');
  eq(buy('xp-B2', 'apple', 'buy-b-0000002').error, 'dup', 'someone else replaying a buy');
  const xpB = xpOf('xp-B'), rankB = json(`get_rank_profile_v2('xp-B')`).step;
  const wB = json(`sh_wallet('xp-B')`);
  ok(wB.spent === 100 + 150 + num(`select price from shop_items where id = ${q(daily[0])}`) && xpOf('xp-B') === xpB && json(`get_rank_profile_v2('xp-B')`).step === rankB, 'spending never lowers XP or rank');
  // boosts from the shop
  const b1 = buy('xp-B', 'boost-1h', 'buy-b-0000009');
  ok(b1.ok && b1.boost_until, 'a boost starts when bought');
  const bx = anonJson(`record_answer_v2('xp-B', 'xh', 'x9', 1, null, null, null, 'bank', 'buy-b-ans-0001')`);
  ok(bx.mult === 2 && bx.xp === 20, `an answer during it is double XP (${bx.mult}x, ${bx.xp})`);
  const b2 = buy('xp-B', 'boost-1h', 'buy-b-0000010');
  ok(b2.ok && num(`select extract(epoch from (${q(b2.boost_until)}::timestamptz - ${q(b1.boost_until)}::timestamptz))`) === 3600
    && num(`select count(*) from xp_boosts where visitor_id = 'xp-B' and src = 'shop'`) === 1, 'a second boost extends the first instead of stacking');
  sql(`insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at) values ('xp-B', 'mb:xh:1', 'medal', 2, now() - interval '1 minute', now() + interval '1 day')`);
  eq([num(`select count(*) from xp_boosts where visitor_id = 'xp-B' and starts_at < now() and ends_at > now()`), num(`select sh_xp_mult('xp-B', now())`)], [2, 2], 'a shop boost and a medal boost together: still 2x');
  // a boost bought during a medal's 24 hours waits for them to end, and the next one extends it (migration_v62)
  eq(['boost-1h', 'boost-3h'].map(id => one(`select rarity || ' ' || price from shop_items where id = ${q(id)}`)), ['common 150', 'uncommon 400'], 'the boosts cost 150 and 400 crowns');
  award('xp-Q', 'rep:flag:9032', 6000);
  sql(`insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at) values ('xp-Q', 'mb:xh:1', 'medal', 2, now() - interval '1 hour', now() + interval '23 hours')`);
  const mEnd = q(one(`select ends_at from xp_boosts where visitor_id = 'xp-Q' and src = 'medal'`)) + '::timestamptz';
  const qb1 = buy('xp-Q', 'boost-1h', 'buy-q-0000001');
  ok(qb1.ok && num(`select extract(epoch from (${q(qb1.boost_until)}::timestamptz - ${mEnd}))`) === 3600
    && num(`select count(*) from xp_boosts where visitor_id = 'xp-Q' and src = 'shop' and starts_at = ${mEnd}`) === 1, `a boost bought during a medal's 24 hours starts when they end (${JSON.stringify(qb1)})`);
  eq([`now() + interval '1 hour'`, `${mEnd} + interval '30 minutes'`, `${mEnd} + interval '61 minutes'`].map(t => num(`select sh_xp_mult('xp-Q', ${t})`)), [2, 2, 1],
    'double XP through the medal\'s hours, then the boost\'s hour, then over');
  const qb2 = buy('xp-Q', 'boost-3h', 'buy-q-0000002');
  ok(qb2.ok && num(`select extract(epoch from (${q(qb2.boost_until)}::timestamptz - ${mEnd}))`) === 4 * 3600
    && num(`select count(*) from xp_boosts where visitor_id = 'xp-Q' and src = 'shop'`) === 1, 'a second boost extends the one waiting');
  const qbj = json(`sh_boost_json('xp-Q', now())`);
  ok(qbj && qbj.mult === 2 && qbj.src === 'medal' && Date.parse(qbj.until) === Date.parse(qb2.boost_until), `the running boost's "until" runs on through the waiting one (${JSON.stringify(qbj)})`);
  const qbs = json(`get_my_shop('xp-Q')`);
  ok(qbs.boost && Date.parse(qbs.boost.until) === Date.parse(qb2.boost_until) && qbs.wallet.spent === 550, `the shop's boost and wallet (${JSON.stringify([qbs.boost, qbs.wallet.spent])})`);
  // equip
  sql(`insert into pet_inventory (visitor_id, item_id) values ('xp-B', 'garden'), ('xp-B', 'castle'), ('xp-B', 'porch'), ('xp-B', 'bowling-lane'), ('xp-B', 'mailbox') on conflict do nothing`);
  eq(anonJson(`equip_item('xp-B', 'outfit', 'white-coat')`).error, 'not-owned', 'equipping something not owned');
  eq(anonJson(`equip_item('xp-B', 'home', 'garden')`).error, 'slot', 'a yard item can\'t be the home');
  ok(anonJson(`equip_item('xp-B', 'home', 'castle')`).equipped.home === 'castle', 'move into the castle');
  anon(`select equip_item('xp-B', 'yard-left', 'garden')`);
  const ey = anonJson(`equip_item('xp-B', 'yard-front', 'garden')`).equipped;
  ok(ey['yard-front'] === 'garden' && !ey['yard-left'], 'a yard item moves from one spot to another');
  eq(anonJson(`equip_item('xp-B', 'yard-6', 'mailbox')`).error, 'bad', 'only the five yard spots the art draws');
  anon(`select equip_item('xp-B', 'yard-corner', 'mailbox')`);
  eq(anonJson(`equip_item('xp-B', 'yard-left', 'bowling-lane')`).error, 'slot', 'the bowling lane only in the side yard');
  const lane = anonJson(`equip_item('xp-B', 'yard-corner', 'bowling-lane')`).equipped;
  ok(lane['yard-side'] === 'bowling-lane' && !lane['yard-corner'], `the bowling lane takes the side yard and the front corner (${JSON.stringify(lane)})`);
  const unlane = anonJson(`equip_item('xp-B', 'yard-corner', 'mailbox')`).equipped;
  ok(unlane['yard-corner'] === 'mailbox' && !unlane['yard-side'], 'something in the front corner takes the lane away');
  ok(anonJson(`equip_item('xp-B', 'porch', 'porch')`).equipped.porch === 'porch' && anonJson(`equip_item('xp-B', 'chimney', 'porch')`).error === 'slot', 'an upgrade only in its own slot');
  ok(!('home' in anonJson(`equip_item('xp-B', 'home', null)`).equipped), 'back to the cottage');
  // the customizer (widget/place.js) shows a change before the server answers: its rules are equip_item's, step by step
  const apI = placeSrc.indexOf('function applied('), apJ = placeSrc.indexOf('\n  }\n', apI);
  ok(apI > 0 && apJ > apI, 'widget/place.js has applied()');
  const clientEquip = new Function('eq', 'slot', 'id', 'function copy(o){ var c = {}; Object.keys(o || {}).forEach(function(k){ c[k] = o[k]; }); return c; }\nfunction isWide(id){ return id === "bowling-lane"; }\n' + placeSrc.slice(apI, apJ + 4) + '\nreturn applied(eq, slot, id);');
  sql(`insert into pet_inventory (visitor_id, item_id) values ('xp-PL', 'garden'), ('xp-PL', 'castle'), ('xp-PL', 'porch'), ('xp-PL', 'bowling-lane'), ('xp-PL', 'mailbox') on conflict do nothing`);
  const sortKeys = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]]));
  let mineEq = {}; const offE = [];
  for (const [slot, item] of [['yard-left', 'garden'], ['yard-front', 'mailbox'], ['yard-right', 'garden'], ['yard-side', 'bowling-lane'], ['yard-corner', 'mailbox'], ['yard-side', 'bowling-lane'],
    ['yard-side', 'garden'], ['home', 'castle'], ['porch', 'porch'], ['yard-corner', 'mailbox'], ['yard-side', null], ['home', null], ['porch', null], ['yard-corner', null]]) {
    mineEq = clientEquip(mineEq, slot, item);
    const r = anonJson(`equip_item('xp-PL', ${q(slot)}, ${item ? q(item) : 'null'})`);
    if (!r.ok || sortKeys(r.equipped) !== sortKeys(mineEq)) offE.push(`${slot} ${item}: server ${JSON.stringify(r.equipped || r)} / client ${JSON.stringify(mineEq)}`);
  }
  ok(offE.length === 0 && Object.keys(mineEq).length === 0, `the customizer's rules match equip_item through 14 changes (${offE.length ? offE[0] : 'the yard, the wide lane, the home, an upgrade, clearing'})`);
  // rare costumes
  ok(anonJson(`record_costume_sighting('xp-B', 'pirate')`).first === true, 'a first sighting');
  ok(anonJson(`record_costume_sighting('xp-B', 'pirate')`).first === false, 'the same costume again');
  eq(anonJson(`record_costume_sighting('xp-B', 'chef')`).error, 'today', 'one new costume a day');
  eq(anonJson(`record_costume_sighting('xp-B', 'apple')`).error, 'bad', 'only costumes');
  ok(json(`get_my_shop('xp-B')`).items.some(i => i.id === 'pirate' && i.shelf === 'spotted'), 'a spotted costume is in that visitor\'s shop');
  ok(buy('xp-B', 'pirate', 'buy-b-0000011').ok && !json(`get_my_shop('xp-B')`).items.some(i => i.shelf === 'spotted'), 'bought, it leaves the Spotted shelf');
  ok(buy('xp-B3', 'pirate', 'buy-b3-000001').error !== undefined && buy('xp-B3', 'pirate', 'buy-b3-000001').error === 'not-today', 'someone who hasn\'t spotted it can\'t buy it');
  const gs = json(`get_my_shop('xp-B')`), g0 = json(`get_my_shop(null)`);
  ok(gs.wallet && gs.inventory.length >= 4 && gs.equipped['yard-front'] === 'garden' && gs.costumes.length === 1 && gs.snacks_today.length === 2 && gs.boost, 'get_my_shop has the wallet, things, what\'s equipped, costumes, today\'s snacks and the boost');
  ok(g0.wallet === null && g0.items.length >= 13 && g0.inventory.length === 0, 'without a visitor, just today\'s shop');
  raises(() => anon(`select admin_upsert_shop_item('wrong', '{"id":"x"}'::jsonb)`), '28000', 'editing the catalog with a wrong secret');
  raises(() => anon(`select admin_upsert_shop_item(${S}, '{"id":"too-cheap","name":"X","kind":"outfit","rarity":"legendary","price":100}'::jsonb)`), '23514', 'a price outside its rarity\'s band');
  ok(anonJson(`admin_upsert_shop_item(${S}, '{"id":"lab-goggles","name":"Lab goggles","kind":"outfit","rarity":"uncommon","price":260}'::jsonb)`) === true, 'a new item with the secret');
  notes.push('the shop: rotation, seasons (3 years against pet.js), buying, boosts, equipping, costumes');

  /* ---------- 11. the idea board ---------- */
  const post = (v, t, b, hub, cat, src, req) => anonJson(`post_idea(${q(v)}, ${q(t)}, ${q(b)}, ${hub == null ? 'null' : q(hub)}, ${q(cat)}, ${q(src || 'board')}, ${req ? q(req) : 'null'})`);
  eq(post('idea-vis-1', 'Study rooms', 'Answer together', 'xh', 'feature').error, 'name', 'no leaderboard name: asked for one');
  anon(`select set_display_name('idea-vis-1', 'Idea One'); select set_display_name('idea-vis-2', 'Idea Two'); select set_display_name('idea-vis-3', 'Idea Three'); select set_display_name('idea-vis-4', 'Idea Four'); select set_display_name('idea-vis-5', 'Idea Five')`);
  eq(post('idea-vis-1', 'Study rooms', '', 'nohub', 'feature').error, 'hub', 'a hub the server doesn\'t know');
  eq(post('idea-vis-1', 'Study rooms', '', 'xh', 'gamification').error, 'category', 'a category outside the list');
  eq(post('idea-vis-1', 'ab', '', 'xh', 'feature').error, 'title', 'a title too short');
  eq(post('idea-vis-1', 'Study rooms', 'x'.repeat(281), 'xh', 'feature').error, 'long', 'more than 280 characters');
  const i1 = post('idea-vis-1', 'Study   rooms', 'Answer the same questions together.', 'xh', 'feature', 'board', 'idea-req-0001');
  ok(i1.ok && i1.name === 'Idea One', 'posted at once under the leaderboard name');
  ok(post('idea-vis-1', 'Study rooms', '', 'xh', 'feature', 'board', 'idea-req-0001').repeat === true && num(`select count(*) from ideas where visitor_id = 'idea-vis-1'`) === 1, 'a replayed post posts once');
  eq(post('idea-vis-1', 'Another idea', '', null, 'fun').error, 'slow', 'one every 20 seconds');
  const back = () => sql(`update ideas set created_at = created_at - interval '30 seconds' where visitor_id = 'idea-vis-1'`);
  back(); ok(post('idea-vis-1', 'Another idea', '', null, 'fun', 'checkin').ok, 'a second idea, from a check-in');
  back(); ok(post('idea-vis-1', 'A third idea', '', null, 'look').ok, 'a third');
  back(); eq(post('idea-vis-1', 'A fourth idea', '', null, 'other').error, 'limit', 'three a day');
  ok(one(`select source from ideas where title = 'Another idea'`) === 'checkin', 'a check-in\'s idea is tagged as one');
  ok(post('idea-vis-2', 'Exam dates in my calendar', '', null, 'feature').ok, 'an idea for all hubs');
  const vote = (v, id, val) => anonJson(`vote_idea(${q(v)}, ${id}, ${val})`);
  vote('idea-vis-2', i1.id, 1); vote('idea-vis-3', i1.id, -1); vote('idea-vis-4', i1.id, 1);
  const vv = vote('idea-vis-4', i1.id, 0);
  eq([vv.up, vv.down], [1, 1], 'up and down votes; tapping again takes it back');
  vote('idea-vis-2', i1.id, 1);
  eq(num(`select count(*) from idea_votes where idea_id = ${i1.id} and visitor_id = 'idea-vis-2'`), 1, 'one vote per person');
  const board = anonJson(`get_ideas('idea-vis-2', 'top', null, null)`);
  const raw = JSON.stringify(board);
  ok(!/idea-vis-|xp-/.test(raw), 'the board never carries a visitor id');
  const mine = board.ideas.find(x => x.id === i1.id);
  ok(mine && mine.mine === 1 && mine.up === 1 && mine.down === 1 && mine.name === 'Idea One' && mine.title === 'Study rooms' && !mine.own, 'each idea: name, cleaned title, both counts, your vote');
  ok(anonJson(`get_ideas('idea-vis-1', 'top', null, null)`).ideas.find(x => x.id === i1.id).own === true, 'the author sees it as their own');
  const byHub = anonJson(`get_ideas(null, 'new', 'xh', null)`), allOnly = anonJson(`get_ideas(null, 'new', '', null)`), fun = anonJson(`get_ideas(null, 'new', null, 'fun')`);
  ok(byHub.ideas.some(x => x.hub === 'xh') && byHub.ideas.some(x => x.hub === null) && allOnly.ideas.every(x => x.hub === null) && fun.ideas.every(x => x.category === 'fun'), 'filters: a hub (with the all-hub ideas), only all hubs, a category');
  ok(byHub.hubs.xh === 1 && byHub.hubs[''] === 3 && byHub.categories.feature === 2, `the filters say how many each would show (${JSON.stringify(byHub.hubs)} ${JSON.stringify(byHub.categories)})`);
  eq(anonJson(`get_ideas(null, 'new', null, null)`).ideas[0].title, 'Exam dates in my calendar', 'New: newest first');
  ok(anonJson(`report_idea('idea-vis-1', ${i1.id})`) === false, 'you can\'t report your own idea');
  ['idea-vis-2', 'idea-vis-3', 'idea-vis-4'].forEach(v => anon(`select report_idea(${q(v)}, ${i1.id})`));
  ok(!anonJson(`get_ideas(null, 'top', null, null)`).ideas.some(x => x.id === i1.id), 'three reports hide it');
  raises(() => anon(`select admin_ideas('wrong')`), '28000', 'the admin list with a wrong secret');
  const ai = anonJson(`(select json_agg(x) from admin_ideas(${S}) x)`).find(x => x.id === i1.id);
  ok(ai && ai.reports === 3 && ai.hidden && ai.hidden_by === 'reports' && !/idea-vis-/.test(JSON.stringify(ai)), 'Sam sees it with its reports, no ids');
  anon(`select admin_set_idea(${S}, ${i1.id}, 'restore')`);
  anon(`select report_idea('idea-vis-5', ${i1.id})`);
  ok(anonJson(`get_ideas(null, 'top', null, null)`).ideas.some(x => x.id === i1.id), 'restored, an old report doesn\'t count again');
  const st = anonJson(`admin_set_idea(${S}, ${i1.id}, 'status', 'planned', 'On the list for December')`);
  eq(st.notified, 2, 'a new status notes the author and the up-voter, not the down-voter');
  const inb = anonJson(`(select json_agg(x) from get_my_inbox_v2('idea-vis-2') x)`).filter(x => x.kind === 'idea');
  ok(inb.length === 1 && inb[0].note === 'planned' && inb[0].message === 'On the list for December' && inb[0].title === 'Study rooms' && !inb[0].seen, 'it reaches the up-voter\'s Inbox');
  eq(anonJson(`(select coalesce(json_agg(x), '[]') from get_my_inbox_v2('idea-vis-3') x)`).filter(x => x.kind === 'idea'), [], 'not the down-voter\'s');
  ok(anonJson(`mark_idea_note_seen('idea-vis-2', ${inb[0].id})`) === true && anonJson(`(select json_agg(x) from get_my_inbox_v2('idea-vis-2') x)`).find(x => x.kind === 'idea').seen, 'marked seen');
  eq(anonJson(`admin_set_idea(${S}, ${i1.id}, 'status', 'planned', 'On the list for December')`).notified, 0, 'the same status again notes no one');
  anon(`select admin_set_idea(${S}, ${i1.id}, 'status', 'shipped', 'Live now')`);
  ok(anonJson(`get_ideas(null, 'shipped', null, null)`).ideas.some(x => x.id === i1.id) && !anonJson(`get_ideas(null, 'top', null, null)`).ideas.some(x => x.id === i1.id), 'Shipped moves it to the Shipped tab');
  ok(anonJson(`delete_my_idea('idea-vis-2', ${i1.id})`) === false, 'only the author deletes');
  const i3 = num(`select id from ideas where title = 'A third idea'`);
  vote('idea-vis-2', i3, 1); anon(`select report_idea('idea-vis-3', ${i3})`);
  eq(anonJson(`admin_set_idea(${S}, ${i3}, 'status', 'considering', 'Looking at it')`).notified, 2, 'a status on the idea about to go: the author and the up-voter are noted');
  const i3rows = () => ['ideas where id', 'idea_votes where idea_id', 'idea_reports where idea_id', 'idea_notes where idea_id'].map(t => num(`select count(*) from ${t} = ${i3}`));
  eq(i3rows(), [1, 1, 1, 2], 'before the delete: the idea, its vote, its report and its two notes');
  ok(anonJson(`delete_my_idea('idea-vis-1', ${i3})`) === true && !anonJson(`get_ideas(null, 'new', null, null)`).ideas.some(x => x.id === i3),
    'the author deletes their own: it leaves the board');
  eq(i3rows(), [0, 0, 0, 0], 'removed completely (Sam, 2026-11-11): its row, votes, reports and Inbox notes, nothing left behind');
  ok(!anonJson(`(select coalesce(json_agg(x), '[]') from get_my_inbox_v2('idea-vis-2') x)`).some(x => x.kind === 'idea' && x.title === 'A third idea'), 'its note leaves the up-voter\'s Inbox');
  ok(anonJson(`delete_my_idea('idea-vis-1', ${i3})`) === false, 'deleting it again does nothing');
  ok(!anonJson(`(select coalesce(json_agg(x), '[]') from admin_ideas(${S}) x)`).some(x => x.id === i3) && anonJson(`admin_set_idea(${S}, ${i3}, 'restore')`).error === 'unknown',
    'Sam can\'t see or bring back an idea its author deleted');
  ok(anonJson(`coalesce(vote_idea('idea-vis-4', ${i3}, 1), 'null'::jsonb)`) === null && anonJson(`report_idea('idea-vis-4', ${i3})`) === false && num(`select count(*) from idea_votes where idea_id = ${i3}`) === 0,
    'a vote or report on a deleted idea writes nothing');
  ok(post('idea-vis-1', 'A fifth idea', '', null, 'other').ok, 'a deleted idea no longer counts toward the day\'s three');
  const i5 = num(`select id from ideas where title = 'A fifth idea'`);
  ok(anonJson(`delete_my_idea('idea-vis-1', ${i5})`) === true && post('idea-vis-1', 'A sixth idea', '', null, 'other').ok, 'or toward the 20 seconds: deleted at once, the next one posts at once');
  sql(`update ideas set created_at = created_at - interval '30 seconds' where visitor_id = 'idea-vis-1'`);
  eq(post('idea-vis-1', 'A seventh idea', '', null, 'other').error, 'limit', 'three standing ideas still make the limit');
  raises(() => anon(`select admin_post_starter_idea('wrong', 'Timmy Tooth', 'Study rooms', '', null, 'feature')`), '28000', 'a starter idea with a wrong secret');
  const si = num(`select admin_post_starter_idea(${S}, 'Number thirty-one', 'Build my own mock', 'Pick the lectures, how many and the time.', null, 'feature')`);
  const sn = anonJson(`get_ideas(null, 'new', null, null)`).ideas.find(x => x.id === si);
  ok(sn && sn.name === 'Number thirty-one' && sn.source === 'starter' && num(`select count(*) from ideas where id = ${si} and visitor_id is null`) === 1, 'a starter idea by Timmy\'s neighbor, with no visitor');
  notes.push('the idea board: names, limits, filters and counts, votes, reports, statuses with Inbox notes, an author\'s delete that removes it completely, starter ideas');

  /* ---------- 12. the bootstrap, the Dark Matter unlock and the boards ---------- */
  const b2v = json(`get_widget_bootstrap_v2('xp-B', 'xh')`);
  ok(b2v.rank && b2v.rank.steps === 63 && b2v.rank.journey === 0 && b2v.rank.boost && b2v.shop && b2v.shop.wallet && Array.isArray(b2v.pet_days) && b2v.pet_days[0].hp === 25 && Array.isArray(b2v.answers),
    'the new bootstrap: the rank with its journey and boost, the shop and wallet, Timmy\'s days with snack HP, the answers');
  const b2n = json(`get_widget_bootstrap_v2(null, 'xh')`);
  ok(!b2n.rank && b2n.shop && !b2n.shop.wallet && !(b2n.answers || []).length, 'without a visitor: today\'s shop and nothing of anyone\'s');
  const t0 = Date.now(); for (let i = 0; i < 5; i++) one(`select get_widget_bootstrap('xp-B', 'xh')::text`); const tv1 = (Date.now() - t0) / 5;
  const t1b = Date.now(); for (let i = 0; i < 5; i++) one(`select get_widget_bootstrap_v2('xp-B', 'xh')::text`); const tv2 = (Date.now() - t1b) / 5;
  notes.push(`bootstrap round trip here: today's ${tv1.toFixed(0)} ms, the new one ${tv2.toFixed(0)} ms (psql included)`);
  award('xp-Z', 'rep:flag:9004', 49000);
  ok(anonJson(`mark_dark_unlock_seen('xp-Z', 0)`) === false, 'the Dark Matter unlock can\'t be marked before Dark Matter');
  award('xp-Z', 'rep:flag:9005', 2000);
  ok(anonJson(`mark_dark_unlock_seen('xp-Z', 0)`) === true && anonJson(`mark_dark_unlock_seen('xp-Z', 0)`) === false, 'marked once, ever');
  ok(anonJson(`mark_dark_unlock_seen('xp-Z', 1)`) === false, 'not the ModuPro\'s before its Dark Matter');
  eq(json(`get_rank_profile_v2('xp-Z')`).dark_seen, [0], 'the profile says which unlocks were seen');
  award('xp-Z', 'rep:flag:9006', 80000);
  const zp = json(`get_rank_profile_v2('xp-Z')`);
  ok(zp.journey === 1 && zp.tier === 0 && zp.badges.includes('journey-0'), `past 125,000: the ModuPro, and a trophy for the Handpiece (${zp.journey}, ${zp.tier})`);
  const ts = rows(`select * from get_trophy_stats_v2()`);
  ok(ts.some(r => r.kind === 'journey-0' && r.n === 1) && !ts.some(r => /^dark-seen/.test(r.kind)), 'trophy rates count the journey trophies, not the unlock marks');
  ok(json(`sh_wallet('xp-Z')`).trophies === 1, 'a journey finished is a trophy for the gold crowns');
  const rb = anonJson(`(select json_agg(x) from get_rank_board_v2('xp-Z', 5) x)`);
  ok(rb[0].journey === 1 && rb[0].is_me && !/xp-/.test(JSON.stringify(rb)), 'the rank board carries the journey, no ids');
  for (const [f, args] of [['get_leaderboard_v2', '10'], ['get_correct_streak_stats_v2', ''], ['get_arcade_leaderboard_v2', `'xh', 'board', 'xp-Q', 10`]]) {
    const r = anonJson(`(select coalesce(json_agg(x), '[]') from ${f}(${args}) x)`);
    ok(Array.isArray(r) && !/xp-/.test(JSON.stringify(r)) && (r.length === 0 || 'journey' in r[0]), `${f} carries the journey and no ids`);
  }
  notes.push('bootstrap v2, the Dark Matter unlock once per journey, journey trophies, the boards with journeys');

  /* ---------- 13. the seasonal sets, Halloween's gift set, the rank sets and throwback days (Sam, 2026-11-10) ---------- */
  // the catalog is exactly tools/figures/site/sets.mjs (an ES module, and this file is CommonJS: read it in a child process)
  const setsUrl = require('url').pathToFileURL(path.join(ROOT, 'tools/figures/site/sets.mjs')).href;
  const SETS = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { SEASONS, RANKS, COLLECTIONS, COSTUMES, allSetItems, allCollectionItems } from ${JSON.stringify(setsUrl)}; process.stdout.write(JSON.stringify({ seasons: SEASONS.map(s => s.k), gifts: SEASONS.filter(s => s.gift).map(s => s.k), ranks: RANKS.map(r => r.gtier), items: allSetItems(), colls: COLLECTIONS.map(c => c.k), coll: allCollectionItems(), costumes: COSTUMES.map(c => ({ id: c[0], name: c[1], rarity: c[2], price: c[3] })) }));`], { encoding: 'utf8' }));
  const byId = a => Object.fromEntries(a.map(r => [r.id, JSON.stringify(r)]));
  const wantSets = byId(SETS.items.map(i => ({ id: i.id, name: i.n, kind: i.kind, rarity: i.rarity, price: i.price, season: i.season || null, gift: !!i.gift, rank_tier: i.rank == null ? null : i.rank })));
  const gotSets = byId(rows(`select id, name, kind, rarity, price, season, gift, rank_tier from shop_items where season is not null or gift or rank_tier is not null`));
  const setDiff = [...new Set([...Object.keys(wantSets), ...Object.keys(gotSets)])].filter(id => wantSets[id] !== gotSets[id]).sort();
  ok(setDiff.length === 0 && SETS.items.length === 152, `the catalog's seasonal and rank rows are exactly allSetItems() of tools/figures/site/sets.mjs (${SETS.items.length} items; ${setDiff.length} differ${setDiff.length ? ': ' + setDiff.slice(0, 5).map(id => `${id} ${gotSets[id] || 'missing'} vs ${wantSets[id] || 'not in sets.mjs'}`).join('; ') : ''})`);
  // the year-round collections (migration_v65; Sam, 2026-11-18: "Go crazy"): exactly allCollectionItems(), every one in
  // the everyday rotation (season null, rotates), none a gift or a rank piece; and the ten rare costumes, as COSTUMES says
  const wantColl = byId(SETS.coll.map(i => ({ id: i.id, name: i.n, kind: i.kind, rarity: i.rarity, price: i.price, season: null, gift: false, rank_tier: null, rotates: true, shelf: false })));
  const gotColl = byId(rows(`select id, name, kind, rarity, price, season, gift, rank_tier, rotates, shelf from shop_items where id in (${SETS.coll.map(i => "'" + i.id + "'").join(', ')})`));
  const collDiff = Object.keys(wantColl).filter(id => wantColl[id] !== gotColl[id]).sort();
  ok(collDiff.length === 0 && SETS.coll.length === 48 && SETS.colls.length === 6, `the catalog's collection rows are exactly allCollectionItems() of sets.mjs, all in the rotation (${SETS.coll.length} items in ${SETS.colls.length} collections; ${collDiff.length} differ${collDiff.length ? ': ' + collDiff.slice(0, 5).map(id => `${id} ${gotColl[id] || 'missing'} vs ${wantColl[id]}`).join('; ') : ''})`);
  eq(rows(`select id, name, rarity, price from shop_items where kind = 'costume' order by id`), SETS.costumes.slice().sort((a, b) => a.id < b.id ? -1 : 1), 'the catalog\'s rare costumes are exactly COSTUMES of sets.mjs (ten, with their names, rarities and prices)');
  eq(num(`select count(*) from shop_items where id <> 'lab-goggles'`), 68 + SETS.coll.length + SETS.items.length, 'the catalog has 240 rows: 68 everyday ones (the rotation, the always-shelf, the ten rare costumes), 48 in the six collections, 112 seasonal and 12 rank');
  const perSeason = rows(`select season, count(*)::int as n, count(*) filter (where kind = 'home' and rarity = 'legendary')::int as h, count(*) filter (where kind = 'scene' and rarity = 'legendary')::int as s,
      string_agg(rarity, ',' order by price) filter (where kind = 'outfit') as o, string_agg(rarity, ',' order by price) filter (where kind = 'yard') as y, bool_or(rotates or shelf) as r, bool_and(gift) as g
    from shop_items where season is not null group by 1 order by 1`);
  eq(perSeason.map(r => r.season), SETS.seasons.slice().sort(), 'a set for each of the fourteen seasons in sets.mjs');
  ok(perSeason.every(r => r.n === 8 && r.h === 1 && r.s === 1 && r.o === 'rare,epic,legendary' && r.y === 'rare,epic,legendary' && !r.r),
    `every season's set: a Legendary home and scene, a Rare, Epic and Legendary outfit and yard thing, none in the rotation (${JSON.stringify(perSeason.find(r => r.n !== 8 || r.h !== 1 || r.s !== 1 || r.r) || '')})`);
  eq(perSeason.filter(r => r.g).map(r => r.season), SETS.gifts, 'only Halloween\'s set is a gift');
  eq(num(`select count(*) from shop_items where id in ('vampire-cape', 'pilgrim-hat', 'party-hat', 'clover-hat', 'bunny-ears', 'scarf', 'mint-fountain')`), 0, 'the old draft seasonal rows and the mint fountain are gone');
  eq(rows(`select name, kind, rarity, price, season from shop_items where id = 'mouthwash-fountain'`), [{ name: 'Mouthwash fountain', kind: 'yard', rarity: 'rare', price: 900, season: null }], 'the mouthwash fountain, under its new id');
  // the place's kit (widget/hub-art/place.js and its set files, what widget/place.js draws from) against the catalog:
  // every drawing is a catalog row of its kind, and every place piece in the catalog has a drawing (the five everyday
  // outfits and the five rare costumes were drawn in the shop's art session; a piece without one fails here)
  const kitCtx = { window: {} }; require('vm').createContext(kitCtx);
  require('vm').runInContext(fs.readFileSync(path.join(ROOT, 'widget/hub-art/place.js'), 'utf8'), kitCtx);
  for (const f of fs.readdirSync(path.join(ROOT, 'widget/hub-art/place')).sort()) require('vm').runInContext(fs.readFileSync(path.join(ROOT, 'widget/hub-art/place', f), 'utf8'), kitCtx);
  const KIT = kitCtx.window.SH_PLACE, kitIds = {};
  for (const [kind, list] of [['home', KIT.HOMES], ['scene', KIT.SCENES], ['yard', KIT.YARD], ['outfit', KIT.OUTFITS], ['upgrade', KIT.UPGRADES], ['upgrade', KIT.PAINTS]]) for (const x of list) if (x.id) kitIds[x.id] = kind === 'outfit' && x.costume ? 'costume' : kind;
  const placeRows = rows(`select id, kind from shop_items where kind in ('outfit', 'costume', 'home', 'scene', 'yard', 'upgrade') and id <> 'lab-goggles' order by id`), placeCat = Object.fromEntries(placeRows.map(r => [r.id, r.kind]));
  const noRow = Object.keys(kitIds).filter(id => placeCat[id] !== kitIds[id]), noArt = placeRows.filter(r => !kitIds[r.id]).map(r => r.id);
  ok(Object.keys(kitIds).length > 160 && noRow.length === 0, `every piece the place's kit draws is a catalog row of its kind (${Object.keys(kitIds).length} pieces${noRow.length ? ', not: ' + noRow : ''})`);
  eq(noArt, [], 'every place piece in the catalog has a drawing, the five everyday outfits included');
  // the rare costumes: each catalog row of kind costume is a kit outfit marked as a costume, with its three lines, and
  // the kit marks no other outfit as one
  const costumeRows = rows(`select id, rarity, price from shop_items where kind = 'costume' order by id`), kitOutfit = Object.fromEntries(KIT.OUTFITS.filter(o => o.id).map(o => [o.id, o]));
  eq(costumeRows.map(r => r.id), SETS.costumes.map(c => c.id).sort(), 'the catalog has the ten rare costumes');
  eq(costumeRows.filter(r => { const o = kitOutfit[r.id]; return !(o && o.costume && Array.isArray(o.say) && o.say.length === 3 && o.say.every(t => t && typeof t === 'string')); }).map(r => r.id), [], 'every rare costume is drawn, marked as a costume, and has its three lines');
  eq(KIT.OUTFITS.filter(o => o.costume).map(o => o.id).sort(), costumeRows.map(r => r.id), 'the kit marks only the catalog\'s costumes as costumes');
  // what the kit says an outfit or costume costs is what the catalog charges (the ten of the shop's art session)
  const tenRows = rows(`select id, rarity, price from shop_items where id in ('scrub-cap', 'bow-tie', 'safety-glasses', 'white-coat', 'graduation-cap') or kind = 'costume' order by id`);
  eq(tenRows.filter(r => { const o = kitOutfit[r.id]; return !o || String(o.rarity).toLowerCase() !== r.rarity || o.price !== r.price; }).map(r => r.id), [], 'the ten new outfits carry the catalog\'s rarity and price');
  // the shop's own art (widget/hub-art/shop.js): the coin, a frame for every rarity, and a thumbnail for every snack
  // and boost on the shelf, each with the catalog's name, rarity, price, HP and minutes
  const shopCtx = { window: {} }; require('vm').createContext(shopCtx);
  require('vm').runInContext(fs.readFileSync(path.join(ROOT, 'widget/hub-art/shop.js'), 'utf8'), shopCtx);
  const SHOPART = shopCtx.window.SH_SHOP_ART, shelfRows = rows(`select id, name, rarity, price, hp, boost_minutes from shop_items where kind in ('snack', 'boost') order by id`);
  const shelfArt = Object.fromEntries(SHOPART.ITEMS.map(x => [x.id, x]));
  eq(shelfRows.filter(r => { const x = shelfArt[r.id]; return !(x && SHOPART.thumb(r.id) && x.n === r.name && String(x.rarity).toLowerCase() === r.rarity && x.price === r.price && (x.hp || null) === r.hp && (x.minutes || null) === r.boost_minutes); }).map(r => r.id), [], `every snack and boost in the catalog has a thumbnail with its name, rarity, price, HP and minutes (${shelfRows.length} rows)`);
  eq(SHOPART.ITEMS.map(x => x.id).sort(), shelfRows.map(r => r.id), 'the shop\'s art draws no snack or boost the catalog doesn\'t sell');
  eq(rows(`select distinct rarity from shop_items order by rarity`).map(r => r.rarity).filter(k => !SHOPART.frame(k)), [], 'every rarity in the catalog has a card frame');
  ok(/<svg/.test(SHOPART.coin(16)) && /<svg/.test(SHOPART.coin(48)) && SHOPART.coinBody(true) !== SHOPART.coinBody(false), 'the Shiny Gold Crown is drawn, with its own cut for small sizes');
  const rankRows = rows(`select id, kind, price, rank_tier, rotates, shelf from shop_items where rank_tier is not null order by rank_tier, kind`);
  ok(rankRows.length === 40 && rankRows.every(r => r.price === 0 && !r.rotates && !r.shelf && ['outfit', 'yard'].includes(r.kind)) && JSON.stringify([...new Set(rankRows.map(r => r.rank_tier))]) === JSON.stringify(SETS.ranks),
    'forty rank items: an outfit and a yard thing for each full rank-up of the three journeys (the Handpiece\'s six, the ModuPro\'s and the Loupes\' seven each), price 0, on no shelf');
  raises(() => sql(`insert into shop_items (id, name, kind, rarity, price, rank_tier, rotates) values ('t-rank-priced', 'X', 'outfit', 'rare', 700, 3, false)`), '23514', 'a rank item with a price');
  raises(() => sql(`insert into shop_items (id, name, kind, rarity, price) values ('t-free', 'X', 'outfit', 'rare', 0)`), '23514', 'a price of 0 without a rank');
  raises(() => sql(`insert into shop_items (id, name, kind, rarity, price, rank_tier, rotates) values ('t-rank-home', 'X', 'home', 'rare', 0, 3, false)`), '23514', 'a rank item that isn\'t an outfit or a yard thing');
  raises(() => sql(`insert into shop_items (id, name, kind, rarity, price, rank_tier) values ('t-rank-rot', 'X', 'outfit', 'rare', 0, 3)`), '23514', 'a rank item in the rotation');
  raises(() => sql(`insert into shop_items (id, name, kind, rarity, price, season) values ('t-season', 'X', 'outfit', 'rare', 700, 'midwinter')`), '23514', 'a season the catalog doesn\'t know');

  // when each season's set is on sale. Easter: 2026-04-05, 2027-03-28, 2028-04-16; Fat Tuesday: 2026-02-17, 2027-02-09,
  // 2028-02-29; the fourth Thursday of November: 2026-11-26, 2027-11-25, 2028-11-23
  eq(rows(`select to_char(sh_easter(y), 'YYYY-MM-DD') as e from generate_series(2026, 2028) y`).map(r => r.e), ['2026-04-05', '2027-03-28', '2028-04-16'], 'Easter Sunday of 2026, 2027 and 2028');
  const SALE = [
    ['2026-01-01', 'newyear'], ['2026-01-02', 'newyear'], ['2026-01-03', ''], ['2026-02-07', ''], ['2026-02-08', 'valentine'], ['2026-02-10', 'valentine'],
    ['2026-02-11', 'mardigras,valentine'], ['2026-02-14', 'mardigras,valentine'], ['2026-02-15', 'mardigras'], ['2026-02-17', 'mardigras'], ['2026-02-18', ''],
    ['2026-03-29', 'spring'], ['2026-03-30', 'easter,spring'], ['2026-04-06', 'easter,spring'], ['2026-04-07', 'spring'],
    ['2026-05-31', 'spring'], ['2026-06-01', 'summer'], ['2026-06-27', 'summer'], ['2026-06-28', 'july4,summer'], ['2026-07-04', 'july4,summer'], ['2026-07-05', 'summer'],
    ['2026-09-21', 'summer'], ['2026-09-22', 'fall'], ['2026-09-30', 'fall'], ['2026-10-01', 'halloween,fall'], ['2026-10-31', 'halloween,fall'], ['2026-11-01', 'thanksgiving,fall'],
    ['2026-11-27', 'thanksgiving,fall'], ['2026-11-28', 'winter,fall'], ['2026-11-30', 'winter,fall'], ['2026-12-01', 'winter'], ['2026-12-26', 'winter'], ['2026-12-27', 'newyear'], ['2026-12-31', 'newyear'],
    ['2027-01-02', 'newyear'], ['2027-01-03', ''], ['2027-02-02', ''], ['2027-02-03', 'mardigras'], ['2027-02-07', 'mardigras'], ['2027-02-08', 'mardigras,valentine'],
    ['2027-02-09', 'mardigras,valentine'], ['2027-02-10', 'valentine'], ['2027-02-14', 'valentine'], ['2027-02-15', ''],
    ['2027-02-21', ''], ['2027-02-22', 'toothfairy'], ['2027-02-27', 'toothfairy'], ['2027-02-28', 'toothfairy,dentist'], ['2027-03-01', 'dentist'], ['2027-03-06', 'dentist'], ['2027-03-07', ''],
    ['2027-03-10', ''], ['2027-03-11', 'stpatrick'], ['2027-03-17', 'stpatrick'], ['2027-03-18', ''], ['2027-03-19', ''], ['2027-03-20', 'spring'], ['2027-03-21', 'spring'],
    ['2027-03-22', 'easter,spring'], ['2027-03-28', 'easter,spring'], ['2027-03-29', 'easter,spring'], ['2027-03-30', 'spring'],
    ['2027-11-26', 'thanksgiving,fall'], ['2027-11-27', 'winter,fall'],
    ['2028-02-22', 'toothfairy'], ['2028-02-23', 'mardigras,toothfairy'], ['2028-02-28', 'mardigras,toothfairy'], ['2028-02-29', 'mardigras,dentist'], ['2028-03-01', 'dentist'], ['2028-03-06', 'dentist'], ['2028-03-07', ''],
    ['2028-04-09', 'spring'], ['2028-04-10', 'easter,spring'], ['2028-04-17', 'easter,spring'], ['2028-04-18', 'spring'],
    ['2028-11-24', 'thanksgiving,fall'], ['2028-11-25', 'winter,fall'], ['2028-12-26', 'winter'], ['2028-12-27', 'newyear']
  ];
  const saleGot = Object.fromEntries(rows(`select d, array_to_string(sh_shop_seasons(d::date), ',') as s from unnest(array[${SALE.map(r => q(r[0])).join(',')}]) d`).map(r => [r.d, r.s]));
  const saleOff = SALE.filter(([d, s]) => saleGot[d] !== s);
  ok(saleOff.length === 0, `sh_shop_seasons on ${SALE.length} sample days of 2026-2028: each window's first and last day and the days outside it (${saleOff.length} differ${saleOff.length ? ': ' + saleOff.slice(0, 4).map(([d, s]) => `${d} got "${saleGot[d]}", expected "${s}"`).join('; ') : ''})`);
  const perYear = rows(`select s, array_agg(n order by y) as n from (select extract(year from d)::int as y, s, count(*)::int as n from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d
      cross join lateral unnest(sh_shop_seasons(d::date)) s group by 1, 2) z group by 1 order by 1`);
  eq(Object.fromEntries(perYear.map(r => [r.s, r.n.join(',')])), { dentist: '7,7,7', easter: '8,8,8', fall: '70,70,70', halloween: '31,31,31', july4: '7,7,7', mardigras: '7,7,7', newyear: '7,7,7', spring: '73,73,73',
    stpatrick: '7,7,7', summer: '113,113,113', thanksgiving: '27,26,24', toothfairy: '7,7,7', valentine: '7,7,7', winter: '29,30,32' }, 'the days each set is on sale in 2026, 2027 and 2028 (a short holiday: 7)');
  eq(num(`select count(*) from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d
          where (sh_season(d::date) is not null and not (sh_season(d::date) = any(sh_shop_seasons(d::date)))) or (sh_is_fall(d::date) <> ('fall' = any(sh_shop_seasons(d::date))))`), 0,
    'a holiday\'s set is on sale on every day Timmy dresses up for it, and the fall set exactly in the fall weeks (sh_season and sh_is_fall unchanged, as checked against widget/pet.js above)');
  eq(json(`to_jsonb(sh_shop_seasons(null))`), [], 'no day, no season');

  // three years of the shared shop, day by day, for the checks below. The catalog's rows joined it "today" (added_on's
  // default), so date them before the three years: a throwback only brings back a season that has run since then.
  sql(`update shop_items set added_on = '2025-01-01'`);
  sql(`create table xp_test_shop as select d::date as d, s.item_id, s.shelf, s.pos
       from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d cross join lateral sh_shop_day(d::date) s`);
  eq(num(`select count(*) from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') g where
          (select coalesce(array_agg(s.item_id order by s.item_id), '{}') from xp_test_shop s where s.d = g::date and s.shelf = 'season')
          is distinct from (select coalesce(array_agg(i.id order by i.id), '{}') from shop_items i where i.active and i.season = any(sh_shop_seasons(g::date)))`), 0,
    'on every day of 2026-2028 the season shelf is exactly the rows of the seasons on sale');
  eq(num(`select count(*) from (select d from xp_test_shop where shelf = 'season' group by d having count(*) <> 8 * cardinality(sh_shop_seasons(d))) z`), 0, 'eight items for each season on sale');
  eq(rows(`select i.season, s.pos from xp_test_shop s join shop_items i on i.id = s.item_id where s.d = '2027-02-28' and s.shelf = 'season' order by s.pos`).map(r => r.season).join(','),
    Array(8).fill('toothfairy').concat(Array(8).fill('dentist')).join(','), 'two sets at once (February 28): Tooth Fairy week\'s eight, then Dentist\'s Day\'s');
  eq(rows(`select shelf, count(*)::int as n from xp_test_shop where shelf in ('daily', 'weekly', 'always') group by 1 order by 1`).map(r => [r.shelf, r.n]), [['always', 6 * 1096], ['daily', 4 * 1096], ['weekly', 3 * 1096]],
    'every day of the three years has 4 daily items, 3 weekly ones and the always-shelf');
  eq(num(`select count(*) from xp_test_shop s join shop_items i on i.id = s.item_id where s.shelf in ('daily', 'weekly') and (i.season is not null or i.gift or i.rank_tier is not null)`), 0,
    'the daily and weekly picks never hold a seasonal, gift or rank item (three years)');
  eq(num(`select count(*) from xp_test_shop s join shop_items i on i.id = s.item_id where i.rank_tier is not null`), 0, 'a rank item is never on any shelf');
  eq(rows(`select s.shelf, count(distinct s.d)::int as days, count(distinct s.item_id)::int as items from xp_test_shop s join shop_items i on i.id = s.item_id where i.gift group by 1`), [{ shelf: 'season', days: 93, items: 8 }],
    'the gift set is listed only on the season shelf, in October');

  // throwback days
  const tbDays = rows(`select to_char(m, 'YYYY-MM') as m, sh_throwback_days(m::date) as days, (select count(*)::int from generate_series(m::date, (m + interval '1 month' - interval '1 day')::date, interval '1 day') g where sh_is_throwback(g::date)) as n
                       from generate_series('2026-01-01'::date, '2028-12-01'::date, interval '1 month') m`);
  ok(tbDays.length === 36 && tbDays.every(r => r.days.length === 2 && r.days[0] >= 1 && r.days[0] <= 14 && r.days[1] >= 15 && r.days[1] <= 28 && r.n === 2),
    `every month of 2026-2028 has exactly two throwback days, one in each half (${JSON.stringify(tbDays.find(r => r.n !== 2 || r.days.length !== 2) || tbDays[0])})`);
  ok(new Set(tbDays.map(r => r.days.join('-'))).size >= 20, 'the throwback days change from month to month');
  eq(rows(`select sh_throwback_days('2027-05-01') as a, sh_throwback_days('2027-05-31') as b`).map(r => JSON.stringify(r.a) === JSON.stringify(r.b)), [true], 'the same two days whichever day of the month asks');
  const tbShelf = rows(`select to_char(s.d, 'YYYY-MM') as m, count(distinct s.d)::int as days, count(*)::int as n, count(distinct (s.d, s.item_id))::int as items, bool_and(sh_is_throwback(s.d)) as on_day,
      count(*) filter (where i.season is null or i.gift or i.rank_tier is not null or i.season = any(sh_shop_seasons(s.d)))::int as bad
    from xp_test_shop s join shop_items i on i.id = s.item_id where s.shelf = 'throwback' group by 1 order by 1`);
  ok(tbShelf.length === 36 && tbShelf.every(r => r.days === 2 && r.n === 6 && r.items === 6 && r.on_day && r.bad === 0),
    `each throwback day's shelf: 3 seasonal items, none in season, none a gift, none a rank item (${JSON.stringify(tbShelf.find(r => r.days !== 2 || r.n !== 6 || r.bad) || tbShelf[0])})`);
  const tbMix = Object.fromEntries(rows(`select case when i.kind in ('home', 'scene') then 'place' else i.rarity end as c, count(*)::int as n
    from generate_series('2026-01-01'::date, '2045-12-31'::date, interval '1 day') d cross join lateral sh_throwback_items(d::date) t join shop_items i on i.id = t.item_id
    where sh_is_throwback(d::date) group by 1`).map(r => [r.c, r.n]));
  ok(tbMix.rare > tbMix.epic && tbMix.epic > tbMix.legendary && tbMix.legendary > tbMix.place && tbMix.place > 0,
    `on throwback days rarer items come back less often, and homes and scenes least (twenty years, 26 items of each: ${JSON.stringify(tbMix)})`);
  eq(rows(`select * from sh_throwback_items((select min(g)::date from generate_series('2027-06-01'::date, '2027-06-30'::date, interval '1 day') g where not sh_is_throwback(g::date)))`), [], 'no throwback shelf on any other day');
  // nothing is sold before its season's first run (Sam, 2026-11-10): with a catalog that opened on 2026-11-15, a
  // throwback can only bring back a season that has already been on sale since that day
  sql(`update shop_items set added_on = '2026-11-15'`);
  const early = rows(`select to_char(d, 'YYYY-MM-DD') as d, i.season from generate_series('2026-11-15'::date, '2027-11-14'::date, interval '1 day') d
      cross join lateral sh_throwback_items(d::date) t join shop_items i on i.id = t.item_id order by 1`);
  const firstRun = { thanksgiving: '2026-11-15', fall: '2026-11-15', winter: '2026-11-28', newyear: '2026-12-27', valentine: '2027-02-08', mardigras: '2027-02-03',
    toothfairy: '2027-02-22', dentist: '2027-02-28', stpatrick: '2027-03-11', spring: '2027-03-20', easter: '2027-03-22', summer: '2027-06-01', july4: '2027-06-28' };
  const tooSoon = early.filter(r => !firstRun[r.season] || r.d <= firstRun[r.season]);
  ok(early.length > 30 && tooSoon.length === 0, `in the catalog's first year no throwback item comes before its season's first run (${early.length} items; ${tooSoon.length} too soon${tooSoon.length ? ': ' + JSON.stringify(tooSoon[0]) : ''})`);
  const dec = [...new Set(early.filter(r => r.d >= '2026-12-01' && r.d <= '2026-12-14').map(r => r.season))].sort();
  ok(dec.length > 0 && dec.every(s => s === 'thanksgiving' || s === 'fall'), `December's first throwback day brings back only Thanksgiving and fall pieces (${dec.join(', ')})`);
  eq(num(`select count(*) from generate_series('2026-11-15'::date, '2027-03-21'::date, interval '1 day') d cross join lateral sh_shop_day(d::date) s
          join shop_items i on i.id = s.item_id where i.season = 'easter'`), 0, 'no Easter piece is on any shelf before Easter week first comes');
  ok(rows(`select sh_season_was_on('easter', '2026-11-15', '2028-04-01') as a, sh_season_was_on('easter', '2026-11-15', '2027-03-22') as b, sh_season_was_on('easter', '2027-03-30', '2028-04-09') as c`)
    .every(r => r.a === true && r.b === false && r.c === false), 'a season counts as run from the day after its first day on sale, across a long gap between Easters, and not before the catalog had it');
  sql(`update shop_items set added_on = '2025-01-01'`);

  // buying a seasonal item: in season, or on a throwback day when it's on that shelf
  const buyAt = (day, v, item, req) => json(`sh_buy(${q(day)}::date, ${q(v)}, ${q(item)}, ${q(req)})`);
  const offDay = (item, from) => one(`select to_char(g, 'YYYY-MM-DD') from generate_series(${q(from)}::date, ${q(from)}::date + 40, interval '1 day') g
    where not exists (select 1 from xp_test_shop s where s.d = g::date and s.item_id = ${q(item)}) order by 1 limit 1`);
  award('xp-T', 'rep:flag:9010', 120000);
  eq(buyAt(offDay('clover-patch', '2027-07-01'), 'xp-T', 'clover-patch', 'buy-t-0000001').error, 'not-today', 'a St. Patrick\'s item in July: not on sale');
  const inSeason = buyAt('2027-03-12', 'xp-T', 'clover-patch', 'buy-t-0000002');
  ok(inSeason.ok && inSeason.price === 700, `the same item in its week: bought at its price (${JSON.stringify(inSeason)})`);
  eq(buyAt(offDay('pot-of-gold', '2027-03-18'), 'xp-T', 'pot-of-gold', 'buy-t-0000003').error, 'not-today', 'the day its week ends, the rest of the set is off sale');
  const tb1 = rows(`select to_char(d, 'YYYY-MM-DD') as d, item_id, (select price from shop_items where id = item_id) as price from xp_test_shop where shelf = 'throwback' and d >= '2027-06-01' order by d, pos limit 1`)[0];
  eq(buyAt(offDay(tb1.item_id, tb1.d), 'xp-T', tb1.item_id, 'buy-t-0000004').error, 'not-today', `an out-of-season item (${tb1.item_id}) on a day that isn't a throwback day`);
  const tbBuy = buyAt(tb1.d, 'xp-T', tb1.item_id, 'buy-t-0000005');
  ok(tbBuy.ok && tbBuy.price === tb1.price && num(`select count(*) from pet_inventory where visitor_id = 'xp-T' and item_id = ${q(tb1.item_id)}`) === 1, `on a throwback day (${tb1.d}) it's on the Back for today shelf and sells at its usual price (${JSON.stringify(tbBuy)})`);
  const tbShop = json(`sh_my_shop(${q(tb1.d)}::date, 'xp-T')`);
  ok(tbShop.throwback === true && tbShop.items.filter(i => i.shelf === 'throwback').length === 3 && tbShop.items.find(i => i.id === tb1.item_id).owned === true, 'the shop that day says it\'s a throwback day and lists the three, the bought one as owned');
  eq(json(`sh_my_shop('2027-02-28'::date, null)`).seasons, ['toothfairy', 'dentist'], 'the shop names the seasons on sale');

  // Halloween's set is everyone's
  const giftIds = SETS.items.filter(i => i.gift).map(i => i.id).sort();
  eq(giftIds.length, 8, 'eight gift items in sets.mjs');
  eq(one(`select sh_owns('xp-N', 'haunted-manor')`), 't', 'someone brand new owns a Halloween item');
  const nShop = json(`sh_my_shop('2026-10-15'::date, 'xp-N')`);
  eq(nShop.inventory.map(i => i.id + ':' + i.how).sort(), giftIds.map(id => id + ':gift'), 'their things are the eight gifts, marked as gifts');
  ok(giftIds.every(id => nShop.items.some(i => i.id === id && i.shelf === 'season' && i.owned && i.gift)) && nShop.items.some(i => i.id === 'leaf-pile' && i.shelf === 'season' && !i.owned && !i.gift),
    'in October the season shelf lists the gift set as owned, beside fall\'s set, which is for sale');
  ok(anonJson(`equip_item('xp-N', 'home', 'haunted-manor')`).equipped.home === 'haunted-manor' && anonJson(`equip_item('xp-N', 'outfit', 'skeleton-suit')`).equipped.outfit === 'skeleton-suit', 'a gift can be put on by anyone');
  eq([buyAt('2026-10-15', 'xp-T', 'haunted-manor', 'buy-t-0000006').error, buyAt('2027-07-10', 'xp-T', 'haunted-manor', 'buy-t-0000007').error], ['owned', 'owned'], 'a gift can never be bought: it\'s already owned, in October or not');
  eq(num(`select count(*) from pet_inventory where item_id = any(${q('{' + giftIds.join(',') + '}')}::text[])`) + num(`select count(*) from pet_purchases where item_id = any(${q('{' + giftIds.join(',') + '}')}::text[])`), 0, 'no rows are written for a gift');

  // rank sets: earned by rank, never sold
  const shopOf = v => anonJson(`get_my_shop(${q(v)})`);
  const rk0 = shopOf('xp-RK');
  ok(rk0.locked.length === 40 && rk0.locked[0].rank_tier === 1 && rk0.locked[0].name && !rk0.inventory.some(i => i.how === 'rank'), 'before any rank-up: the forty rank items are listed as locked, each with its tier');
  eq(anonJson(`equip_item('xp-RK', 'outfit', 'rank-antique-outfit')`).error, 'not-owned', 'a rank item can\'t be put on below its rank');
  const rkBuy = anonJson(`buy_item('xp-RK', 'rank-antique-outfit', 'buy-rk-000001')`);
  ok(rkBuy.error === 'rank' && rkBuy.rank_tier === 1, `a rank item can't be bought (${JSON.stringify(rkBuy)})`);
  award('xp-RK', 'rep:flag:9011', 300);
  eq(num(`select gtier from sh_rank(${xpOf('xp-RK')})`), 1, '300 XP is the first full rank-up (Antique)');
  ok(anonJson(`equip_item('xp-RK', 'outfit', 'rank-antique-outfit')`).equipped.outfit === 'rank-antique-outfit' && anonJson(`equip_item('xp-RK', 'yard-left', 'rank-antique-yard')`).equipped['yard-left'] === 'rank-antique-yard',
    'at the rank, its outfit and its yard thing can be put on');
  eq(anonJson(`equip_item('xp-RK', 'outfit', 'rank-bronze-outfit')`).error, 'not-owned', 'the next rank\'s outfit is still locked');
  const rk1 = shopOf('xp-RK');
  eq(rk1.inventory.filter(i => i.how === 'rank').map(i => i.id).sort(), ['rank-antique-outfit', 'rank-antique-yard'], 'get_my_shop lists them as owned by rank');
  ok(rk1.locked.length === 38 && rk1.locked.every(i => i.rank_tier >= 2) && rk1.inventory.filter(i => i.how === 'gift').length === 8, 'and the thirty-eight still locked');
  eq([anonJson(`buy_item('xp-RK', 'rank-antique-outfit', 'buy-rk-000002')`).error, anonJson(`buy_item('xp-RK', 'rank-bronze-outfit', 'buy-rk-000003')`).error], ['owned', 'rank'], 'owned once reached; the next one still can\'t be bought');
  award('xp-RK', 'rep:flag:9012', 4700);
  eq(shopOf('xp-RK').inventory.filter(i => i.how === 'rank').length, 6, 'at Silver (5,000 XP): the sets of every rank passed, three in all');
  eq(num(`select count(*) from pet_inventory where visitor_id = 'xp-RK'`), 0, 'with no rows written');
  anon(`select equip_item('xp-RK', 'outfit', 'rank-silver-outfit')`);
  sql(`delete from xp_awards where visitor_id = 'xp-RK'; select sh_xp_rebuild(array['xp-RK'])`);
  ok(xpOf('xp-RK') === 0 && one(`select item_id from pet_equipped where visitor_id = 'xp-RK' and slot = 'outfit'`) === 'rank-silver-outfit' && anonJson(`equip_item('xp-RK', 'outfit', 'rank-silver-outfit')`).error === 'not-owned',
    'if XP ever drops below the rank, what is on stays on; it can\'t be put on again');
  ok(shopOf('xp-T').locked.length === 28 && shopOf('xp-T').locked.every(i => i.rank_tier >= 7) && shopOf('xp-T').inventory.filter(i => i.how === 'rank').length === 12 && shopOf('xp-T').inventory.some(i => i.how === 'bought' && i.id === 'clover-patch' && i.at), 'at the Handpiece\'s Dark Matter: all twelve of its sets, beside what was bought, and the later journeys\' 28 still locked');
  // the later journeys' sets (migration_v91): at each later tier an account owns that tier's set and not the next one's
  {
    const floor = g => num(`select min(x) from generate_series(0, 400000, 500) x where (select gtier from sh_rank(x)) >= ${g}`);
    let had = 0, bad = [];
    for (let g = 7; g <= 20; g++){
      const v = 'xp-RL' + g, need = floor(g);
      award(v, 'rep:flag:' + (9100 + g), need);
      const sh = shopOf(v), mine = new Set(sh.inventory.filter(i => i.how === 'rank').map(i => i.id)), r = SETS.items.filter(i => i.rank != null);
      const own = r.filter(i => i.rank === g).every(i => mine.has(i.id)), next = r.filter(i => i.rank === g + 1).some(i => mine.has(i.id));
      if (num(`select gtier from sh_rank(${xpOf(v)})`) !== g || !own || next || mine.size !== g * 2 || sh.locked.length !== 40 - g * 2) bad.push(g + ': ' + mine.size + ' owned, ' + sh.locked.length + ' locked');
      if (g === 7) had = anonJson(`equip_item(${q(v)}, 'outfit', 'rank-modu-stone-outfit')`).equipped.outfit === 'rank-modu-stone-outfit' && anonJson(`equip_item(${q(v)}, 'outfit', 'rank-modu-antique-outfit')`).error === 'not-owned';
    }
    eq(bad, [], 'at each tier of the ModuPro and the Loupes (7 to 20) an account owns that tier\'s set and every earlier one, and not the next');
    ok(had, 'at ModuPro Stone its outfit goes on, and ModuPro Antique\'s is still locked');
  }
  notes.push(`seasonal sets: the catalog matches sets.mjs (${SETS.items.length} rows), ${SALE.length} sample days of sh_shop_seasons, three years of shelves, throwback days, the gift set, the rank sets`);

  /* ---------- 13b. the shop's client (phase 4, part B): the preview's purchases, and the rare costume of the day ---------- */
  {
  // the preview answers buy_item with buyCore (tools/preview/runtime/preview.js): one list of purchases through it and
  // through sh_buy gives the same answers, in the server's order of checks (the preview's world is read from the server
  // before each call: what's on sale that day, what's owned, the balance, the end of the boosts running or waiting)
  const grabIn = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; let k = src.indexOf('{', i), depth = 0; for (; k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && --depth === 0) break; } return src.slice(i, k + 1); };
  const prevSrc = fs.readFileSync(path.join(ROOT, 'tools/preview/runtime/preview.js'), 'utf8');
  ok(!!grabIn(prevSrc, 'buyCore'), 'tools/preview/runtime/preview.js has buyCore');
  const buyCore = new Function('RealDate', grabIn(prevSrc, 'buyCore') + '\nreturn buyCore;')(Date);
  const CAT = Object.fromEntries(rows(`select id, kind, price, hp, boost_minutes, rank_tier from shop_items where active`).map(r => [r.id, r]));
  const PD = '2027-07-10', plog = [];
  const arr = l => q('{' + l.join(',') + '}') + '::text[]';
  const boostEndMs = v => { const t = one(`select (extract(epoch from max(ends_at)) * 1000)::bigint from xp_boosts where visitor_id = ${q(v)} and ends_at > now()`); return t ? Number(t) : null; };
  const world = v => ({ cat: CAT, log: plog, sale: rows(`select item_id from sh_shop_for(${q(v)}, ${q(PD)}::date)`).map(r => r.item_id),
    owns: id => one(`select sh_owns(${q(v)}, ${q(id)})`) === 't', balance: () => num(`select (sh_wallet(${q(v)})->>'balance')::int`),
    boost: () => boostEndMs(v), setBoost: () => {}, day: PD, now: Date.now() });
  award('xp-PV', 'rep:flag:9030', 20000); award('xp-PW', 'rep:flag:9031', 300);
  const pvSale = world('xp-PV').sale;
  const cheap = one(`select id from shop_items where id = any(${arr(pvSale)}) and kind not in ('snack', 'boost', 'costume') order by price, id limit 1`);
  const notOn = one(`select id from shop_items where active and rotates and season is null and rank_tier is null and not gift and kind not in ('snack', 'boost', 'costume') and not (id = any(${arr(pvSale)})) order by id limit 1`);
  const LIST = [
    ['xp-PV', cheap, 'pv-buy-000001', `a piece on sale (${cheap})`], ['xp-PV', cheap, 'pv-buy-000001', 'the same call again (a replay)'],
    ['xp-PV', cheap, 'pv-buy-000002', 'a double tap that made a new id: already owned'], ['xp-PV', 'apple', 'pv-buy-000003', 'a snack'],
    ['xp-PV', 'apple', 'pv-buy-000004', 'the same snack again that day'], ['xp-PV', 'cheese-cube', 'pv-buy-000005', 'another snack'],
    ['xp-PV', 'boost-1h', 'pv-buy-000006', 'a boost'], ['xp-PV', 'boost-1h', 'pv-buy-000007', 'a second boost, which extends the first'],
    ['xp-PV', 'boost-1h', 'pv-buy-000007', 'the second boost replayed'], ['xp-PV', notOn, 'pv-buy-000008', `a piece not on sale that day (${notOn})`],
    ['xp-PV', 'rank-dark-outfit', 'pv-buy-000009', 'a rank piece above the rank'], ['xp-PV', 'rank-antique-outfit', 'pv-buy-000010', 'a rank piece already reached'],
    ['xp-PV', 'no-such-item', 'pv-buy-000011', 'an unknown piece'], ['xp-PV', 'apple', 'short', 'a request id too short'], ['xp-PV', 'Apple!', 'pv-buy-000013', 'an item id that isn\'t one'],
    ['xp-PW', 'apple', 'pv-buy-000001', 'another visitor\'s request id'], ['xp-PW', 'apple', 'pv-buy-000012', 'a balance too low']];
  const strip = r => { const o = Object.assign({}, r); delete o.boost_until; return JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])); };
  const msOf = t => t == null ? null : new Date(t).getTime();
  const pOff = [];
  for (const [v, item, req, what] of LIST) {
    const js = buyCore(world(v), v, item, req), srv = json(`sh_buy(${q(PD)}::date, ${q(v)}, ${q(item)}, ${q(req)})`);
    const bu = [msOf(js.boost_until), msOf(srv.boost_until)];
    if (strip(js) !== strip(srv) || (bu[0] == null) !== (bu[1] == null) || (bu[0] != null && Math.abs(bu[0] - bu[1]) > 5000)) pOff.push(`${what}: preview ${JSON.stringify(js)}, server ${JSON.stringify(srv)}`);
  }
  ok(pOff.length === 0, `the preview's purchases answer as sh_buy does, ${LIST.length} calls (${pOff.length} differ${pOff.length ? ': ' + pOff.join(' | ') : ''})`);
  const answers = LIST.map(([v, item, req]) => json(`sh_buy(${q(PD)}::date, ${q(v)}, ${q(item)}, ${q(req)})`));
  ok(answers.filter(a => a.ok && !a.repeat).length === 0, 'the whole list sent again buys nothing more: every purchase that went through is a replay now');
  eq(num(`select count(*) from pet_purchases where visitor_id in ('xp-PV', 'xp-PW')`), plog.length, 'the server kept as many purchases as the preview\'s log');
  const bst = rows(`select ends_at - starts_at as len from xp_boosts where visitor_id = 'xp-PV' and src = 'shop'`);
  ok(bst.length === 1 && /02:00:00/.test(JSON.stringify(bst[0].len)), `two one-hour boosts make one boost of two hours (${JSON.stringify(bst)})`);

  // the rare costume of the day: widget/hub-timmy.js and widget/dash.js pick it the same way, from COSTUMES in sets.mjs's
  // order (widget/shop.js's SPOTS too), only the catalog's ten costumes, never on a holiday (sh_season, which section 10 checks against pet.js's holidayId) or in the fall weeks
  // (sh_is_fall), on about one day in twelve of the rest; every day of three years, for 60 made-up visitors
  const costumeFn = f => { const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), m = /var COSTUMES = \[[^\]]*\];/.exec(src); return m && grabIn(src, 'costumeOfDay') ? new Function(m[0] + '\n' + grabIn(src, 'costumeOfDay') + '\nreturn costumeOfDay;')() : null; };
  const cHub = costumeFn('widget/hub-timmy.js'), cDash = costumeFn('widget/dash.js');
  ok(!!cHub && !!cDash, 'widget/hub-timmy.js and widget/dash.js each have costumeOfDay and COSTUMES');
  if (cHub && cDash) {
    const five = rows(`select id from shop_items where kind = 'costume' and active order by id`).map(r => r.id);
    const days3 = rows(`select to_char(d, 'YYYY-MM-DD') as d, sh_season(d::date) as s, sh_is_fall(d::date) as f from generate_series('2026-11-12'::date, '2029-11-11'::date, interval '1 day') d`);
    const vis = Array.from({ length: 60 }, (_, i) => 'xp-costume-' + i.toString(36) + '-' + (i * 7919).toString(36));
    let open = 0, hits = 0; const seenC = new Set(), cOff = [];
    for (const r of days3) for (const v of vis) {
      const a = cHub(v, r.d, r.s || ''), b = cDash(v, r.d, r.s || '');
      if (a !== b) cOff.push(`${v} ${r.d}: hub ${a}, dashboard ${b}`);
      if (a && (r.s || r.f)) cOff.push(`${v} ${r.d}: ${a} on ${r.s || 'a fall day'}`);
      if (a && !five.includes(a)) cOff.push(`${v} ${r.d}: ${a} isn't a costume in the catalog`);
      if (!r.s && !r.f) { open++; if (a) { hits++; seenC.add(a); } }
    }
    const listOf = f => { const m = new RegExp('var ' + (f === 'widget/shop.js' ? 'SPOTS' : 'COSTUMES') + ' = (\\[[^\\]]*\\]);').exec(fs.readFileSync(path.join(ROOT, f), 'utf8')); return m ? JSON.parse(m[1]) : null; };
    eq(['widget/hub-timmy.js', 'widget/dash.js', 'widget/shop.js'].map(listOf), [0, 1, 2].map(() => SETS.costumes.map(c => c.id)), 'the hub, the dashboard and the shop name the ten costumes in sets.mjs\'s order');
    ok(five.length === 10 && cOff.length === 0, `the costume of the day: the hub's and the dashboard's agree, only the catalog's costumes, never on a holiday or a fall day (${days3.length} days x ${vis.length} visitors; ${cOff.length} wrong${cOff.length ? ': ' + cOff.slice(0, 3).join(' | ') : ''})`);
    ok(hits / open > 1 / 15 && hits / open < 1 / 10 && seenC.size === 10, `about one open day in twelve (${hits} of ${open}, 1 in ${(open / hits).toFixed(1)}), all ten turn up (${[...seenC].sort().join(', ')})`);
    ok(cHub('', '2027-07-10', '') === '' && cHub('xp-A', 'not-a-day', '') === '', 'no costume without a visitor or a day');
  }
  notes.push(`the shop's client: ${LIST.length} purchases through the preview's buyCore and sh_buy, the costume of the day over three years`);
  }

  /* ---------- 14. visiting someone's place from the boards ---------- */
  sql(`insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values
         ('xp-VS', 'xh', 'old1', true, ((date_trunc('day', now() at time zone 'America/Chicago') - interval '1 day' + interval '12 hours') at time zone 'America/Chicago')),
         ('xp-VS', 'xh', 'old2', true, now());
       insert into visitor_names (visitor_id, display_name) values ('xp-VS', 'Visit Subject');
       insert into correct_streaks (visitor_id, current_streak, best_streak) values ('xp-VS', 99999, 99999)
         on conflict (visitor_id) do update set current_streak = excluded.current_streak, best_streak = excluded.best_streak;
       insert into arcade_scores (hub, game, visitor_id, score) values ('xh', 'board', 'xp-VS', 999999), ('xh', 'board', 'xp-VA', 5);
       insert into achievements (visitor_id, kind, hub) values ('xp-VS', 'mastery-gold', 'xh');
       insert into pet_inventory (visitor_id, item_id) values ('xp-VS', 'castle'), ('xp-VS', 'night-sky'), ('xp-VS', 'garden'), ('xp-VS', 'porch'), ('xp-VS', 'paint-mint'), ('xp-VS', 'bow-tie');`);
  const vsPlace = { home: 'castle', scene: 'night-sky', 'yard-left': 'garden', 'yard-right': 'haunted-tree', porch: 'porch', paint: 'paint-mint', outfit: 'bow-tie' };
  for (const [slot, item] of Object.entries(vsPlace)) anon(`select equip_item('xp-VS', ${q(slot)}, ${q(item)})`);
  const boardRows = () => ({
    rank: anonJson(`(select coalesce(json_agg(x), '[]') from get_rank_board_v2('xp-VS', 50) x)`),
    streak: anonJson(`(select coalesce(json_agg(x), '[]') from get_leaderboard_v2(50) x)`),
    correct: anonJson(`(select coalesce(json_agg(x), '[]') from get_correct_streak_stats_v2() x)`),
    arcade: anonJson(`(select coalesce(json_agg(x), '[]') from get_arcade_leaderboard_v2('xh', 'board', 'xp-VS', 50) x)`)
  });
  const place = k => anonJson(`coalesce(get_place(${k == null ? 'null' : q(k)}), 'null'::jsonb)`);
  const sorted = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  const HEX = /^[0-9a-f]{24}$/;
  const b1v = boardRows(), vsRows = b => Object.entries(b).map(([n, r]) => [n, r.filter(x => x.display_name === 'Visit Subject')]);
  ok(vsRows(b1v).every(([, r]) => r.length >= 1), `the made-up visitor is on all four boards (${vsRows(b1v).map(([n, r]) => n + ' ' + r.length).join(', ')})`);
  const K = b1v.rank.find(x => x.is_me).visit;
  ok(HEX.test(K) && vsRows(b1v).every(([, r]) => r.every(x => x.visit === K)), `visiting is on by default: the same 24-character key on that person's row of every board (the caller's own row too)`);
  ok(Object.values(b1v).every(r => r.every(x => HEX.test(x.visit || ''))) && new Set(b1v.rank.map(x => x.visit)).size === b1v.rank.length, 'every row of every board has a key, a different one for each person');
  ok(!('visiting' in shopOf('xp-VS')) && num(`select count(*) from pg_proc where proname = 'set_visiting'`) === 0 && one(`select to_regclass('public.pet_visit_off') is null`) === 't',
    'no one can turn visiting off (Sam, 2026-11-11): no set_visiting, no list of who turned it off, no switch in get_my_shop');
  const pl = place(K), meRow = b1v.rank.find(x => x.is_me);
  eq(Object.keys(pl).sort(), ['equipped', 'flair', 'name', 'rank'], 'a place is a name, what stands in each slot, the rank and the mastery flair, and nothing else');
  eq(pl.name, 'Visit Subject', 'under the leaderboard name, as the boards show it');
  eq(sorted(pl.equipped), sorted(vsPlace), 'the home, scene, yard spots, upgrade, paint and outfit that person chose (a gift among them)');
  eq([sorted(pl.rank), pl.flair], [sorted({ journey: meRow.journey, tier: meRow.tier, level: meRow.level }), meRow.flair], 'the rank and the flair the board shows');
  ok(pl.flair === 'xh:3', `the flair is the hub medals (${pl.flair})`);
  const allIds = new Set(rows(`select visitor_id from xp_visitors union select visitor_id from visitor_names union select visitor_id from pet_equipped union select visitor_id from arcade_scores
                               union select visitor_id from correct_streaks union select visitor_id from personal_answers`).map(r => r.visitor_id));
  const NEVER = ['visitor_id', 'visitor', 'id', 'key', 'visit', 'xp', 'hp', 'snacks', 'snacks_today', 'streak', 'answers', 'correct', 'wallet', 'balance', 'inventory', 'costumes', 'boost', 'at', 'set_at',
    'bought_at', 'updated_at', 'day', 'days', 'last_seen', 'step', 'step_at', 'next_at', 'tier_at'];
  const leaks = o => { const bad = []; (function walk(x, k){
    if (k != null && (allIds.has(k) || NEVER.includes(k))) bad.push('key ' + k);
    if (typeof x === 'string' && (allIds.has(x) || /xp-|idea-vis-/.test(x) || /\d{4}-\d\d-\d\d|\d\d:\d\d/.test(x))) bad.push('value ' + x);
    if (typeof x === 'number' && !(Number.isInteger(x) && x >= 0 && x <= 6)) bad.push('number ' + x);
    if (x && typeof x === 'object') for (const [kk, vv] of Object.entries(x)) walk(vv, Array.isArray(x) ? null : kk);
  })(o, null); return bad; };
  ok(allIds.has('xp-VS') && allIds.size > 30 && leaks(pl).length === 0, `a place holds no visitor id, no XP, HP, streak, answers, wallet or inventory, and no date or time (${leaks(pl).join(', ')})`);
  ok(!/xp-|idea-vis-/.test(JSON.stringify(b1v)), 'the boards with their keys still carry no visitor id');
  const nameVA = one(`select anon_name('xp-VA')`), rowVA = b1v.arcade.find(x => x.display_name === nameVA), plVA = rowVA && place(rowVA.visit);
  ok(plVA && plVA.name === nameVA && sorted(plVA.equipped) === '[]' && plVA.rank.journey === 0 && plVA.rank.tier === 0 && plVA.rank.level === 1 && leaks(plVA).length === 0,
    'someone with only an arcade score and no chosen name: their generated name, an empty place, the first rank');
  ok(vsRows(boardRows()).every(([, r]) => r.every(x => x.visit === K)) && place(K).name === 'Visit Subject', 'asked again: the same key on every board, and it opens the same place');
  eq([place('0'.repeat(24)), place('xp-VS'), place('nope'), place(null), place(K.toUpperCase())], [null, null, null, null, null], 'an unknown key, a visitor id, a malformed key and no key all give nothing');
  // Link my devices: the place goes with everything else to the id that remains, and the other device's key opens nothing
  sql(`insert into arcade_scores (hub, game, visitor_id, score) values ('xh', 'board', 'xp-VL2', 7)`);
  const kVL = one(`select sh_visit_key('xp-VL')`), kVL2 = one(`select sh_visit_key('xp-VL2')`), nVL = one(`select anon_name('xp-VL')`);
  ok(place(kVL2) && place(kVL2).name === one(`select anon_name('xp-VL2')`) && place(kVL) === null, 'before linking: the second device has a place (its arcade score), the first none yet');
  const vc1 = anon(`select create_link_code('xp-VL')`)[0][0];
  eq(anon(`select redeem_link_code(${q(vc1)}, 'xp-VL2')`)[0][0], 'xp-VL', 'two devices link');
  const arcVL = boardRows().arcade.map(x => x.visit);
  ok(place(kVL2) === null && place(kVL) && place(kVL).name === nVL && arcVL.includes(kVL) && !arcVL.includes(kVL2),
    'linked: the arcade row and the place are under the id that remains; the other device\'s key opens nothing');
  ok(num(`select length(secret) from visit_secret`) >= 32 && num(`select count(*) from visit_secret`) === 1, 'one server-side secret behind the keys');
  notes.push('visiting: everyone, a key per board row, a place with only what it shows, no way to turn it off, unknown keys, Link my devices');

  /* ---------- 14a. Visit someone random, from the whole class (migration_v57) ---------- */
  {
  const rnd = (v, skip) => anonJson(`coalesce(get_random_place(${v == null ? 'null' : q(v)}, ${skip ? `array[${skip.map(q).join(',') || "''"}]::text[]` : 'null'}), 'null'::jsonb)`);
  // someone on no board who has made their place their own (an arcade score in a game no board here shows), and the
  // linked pair's remaining id with one thing chosen
  sql(`insert into arcade_scores (hub, game, visitor_id, score) values ('xr', 'other', 'xp-VR', 3);
       insert into pet_equipped (visitor_id, slot, item_id) values ('xp-VR', 'outfit', 'bow-tie'), ('xp-VL', 'home', 'castle')
         on conflict (visitor_id, slot) do update set item_id = excluded.item_id;`);
  const classOf = () => rows(`select z.visitor_id, sh_visit_key(z.visitor_id) as k, exists (select 1 from pet_equipped e where e.visitor_id = z.visitor_id) as mine
                         from (select visitor_id from xp_visitors union select visitor_id from correct_streaks union select visitor_id from arcade_scores) z
                         where not exists (select 1 from visitor_links l where l.alias_id = z.visitor_id)`);
  const everyone = classOf(), keyOf = Object.fromEntries(everyone.map(r => [r.k, r.visitor_id]));
  const others = everyone.filter(r => r.mine && r.visitor_id !== 'xp-VS'), plain = new Set(everyone.filter(r => !r.mine).map(r => r.k));
  const r1 = rnd('xp-VS'), { visit: r1k, ...r1p } = r1 || {};
  ok(r1 && HEX.test(r1k || '') && keyOf[r1k] && keyOf[r1k] !== 'xp-VS', `a random visit gives someone else's place and their key (${JSON.stringify(r1).slice(0, 120)})`);
  eq(Object.keys(r1 || {}).sort(), ['equipped', 'flair', 'name', 'rank', 'visit'], 'a random place is what get_place gives, and the visit key, nothing else');
  eq(sorted(r1p), sorted(place(r1k) || {}), 'the same place the key opens');
  ok(leaks(r1p).length === 0 && !/xp-|idea-vis-/.test(JSON.stringify(r1)), `no visitor id, XP, HP, date or time in it (${leaks(r1p).join(', ')})`);
  // the whole class who customized: skipping the keys already shown, a trip goes through each of them once before anyone
  // comes back, and a plain default place never comes up (Sam: "skip people with zero customization")
  const seen = [];
  for (let i = 0; i < Math.min(others.length + 1, 100); i++) { const r = rnd('xp-VS', seen); if (!r || seen.includes(r.visit)) break; seen.push(r.visit); }
  ok(others.length >= 3 && plain.size >= 10 && seen.length === others.length && seen.every(k => keyOf[k] && keyOf[k] !== 'xp-VS' && !plain.has(k)),
    `skipping the ones already seen, everyone else who customized comes up once (${seen.length} of ${others.length}), never the caller and never one of the ${plain.size} plain places`);
  const vrKey = one(`select sh_visit_key('xp-VR')`);
  ok(seen.includes(vrKey) && !Object.values(b1v).some(b => b.some(x => x.visit === vrKey)), 'someone on no board (the page couldn\'t have found them) is among them');
  const again = [];
  for (let i = 0; i < 30; i++) again.push(rnd('xp-VS', seen));
  ok(again.every(r => r && keyOf[r.visit] && keyOf[r.visit] !== 'xp-VS' && !plain.has(r.visit)), 'once everyone has been seen, it starts again rather than giving nothing, still never a plain place');
  // a slot set back to its default is no customization: with nothing left, that person no longer comes up
  anon(`select equip_item('xp-VR', 'outfit', null)`);
  const noVR = [];
  for (let i = 0; i < 40; i++) noVR.push(rnd('xp-VS').visit);
  ok(!noVR.includes(vrKey) && place(vrKey) && place(vrKey).name, 'after the last slot is set back to its default, that person isn\'t picked (a board row or key still opens their place)');
  // linked devices: the one that remains comes up, the other never does, and neither device is sent to itself
  const fromVL = new Set(), fromVL2 = new Set();
  for (let i = 0; i < 40; i++) { fromVL.add(rnd('xp-VL').visit); fromVL2.add(rnd('xp-VL2').visit); }
  ok(!fromVL.has(kVL) && !fromVL2.has(kVL) && !fromVL.has(kVL2) && !fromVL2.has(kVL2), 'linked devices: neither device is sent to its own place, nor to the device it linked');
  ok(rnd('xp-VS', seen.filter(k => k !== kVL)).visit === kVL, 'the id that remains after linking can be picked (it is the only one not yet seen)');
  const r0 = rnd(null), bad = [rnd('x'.repeat(81)), rnd('')];
  ok(r0 && keyOf[r0.visit] && !plain.has(r0.visit) && leaks((({ visit, ...p }) => p)(r0)).length === 0, 'without a visitor id: someone who customized, still without an id');
  eq(bad, [null, null], 'a malformed visitor id gives nothing');
  const junk = rnd('xp-VS', ['xp-VA', 'NOPE', '0'.repeat(24), K.toUpperCase()]);
  ok(junk && keyOf[junk.visit] && keyOf[junk.visit] !== 'xp-VS', 'visitor ids, malformed and unknown keys in the skip list are ignored');
  // no one else customized (the day of the release, before anyone has): nothing, for the page to say so
  sql(`create table xp_pe_save as select * from pet_equipped where visitor_id <> 'xp-VS'; delete from pet_equipped where visitor_id <> 'xp-VS';`);
  const none = [rnd('xp-VS'), rnd('xp-VS', seen)], onlyVS = rnd(null);
  sql(`insert into pet_equipped select * from xp_pe_save; drop table xp_pe_save;`);
  ok(none.every(r => r === null) && onlyVS && keyOf[onlyVS.visit] === 'xp-VS', 'with no one else customized: nothing for the caller (the only customized place is theirs), that one for no caller');
  ok(one(`select has_function_privilege('anon', 'public.get_random_place(text, text[])', 'execute')`) === 't' && one(`select provolatile from pg_proc where proname = 'get_random_place'`) === 'v',
    'anyone can ask (anon), and it is volatile (a new pick each time)');
  notes.push(`visit someone random: ${others.length} classmates who customized (of ${others.length + plain.size}), each once before anyone twice, never a plain place, the caller or a linked device, no id`);
  }

  /* ---------- 14b. Learn and Flashcards (migration_v56): ratings and Learn's steps ---------- */
  const card = (v, qid, what, o) => { o = o || {};
    return json(`sh_card(${T(o.at || 0)}, ${q(v)}, ${q(o.hub || 'xh')}, ${q(qid)}, ${q(what)}, ${o.ahead ? 'true' : 'false'}, ${o.req ? q(o.req) : 'null'}, ${o.seen == null ? 'null' : o.seen})`); };
  const CD = 9 * DAY;   // a day of its own, after the others
  const cls0 = rows(`select hub, qid, attempts, correct from question_stats where hub = 'xh' order by 2`), picks0 = num(`select coalesce(sum(picks), 0) from question_choices where hub = 'xh'`);
  const pa0 = num(`select count(*) from personal_answers`), ax0 = num(`select count(*) from answer_xp`);
  const c1 = card('xp-C', 'x1', 'good', { at: CD, req: 'card-c-0001' });
  ok(c1.ok && c1.xp === 2 && c1.base === 2 && c1.mult === 1 && c1.why === null && c1.total === 2, `a due or new card's rating pays a flat 2 (${JSON.stringify(c1)})`);
  const c234 = [card('xp-C', 'x1', 'again', { at: CD + 10 }), card('xp-C', 'x1', 'hard', { at: CD + 20 }), card('xp-C', 'x1', 'easy', { at: CD + 30 })];
  eq(c234.map(r => [r.xp, r.why]), [[2, null], [2, null], [0, 'repeat']], 'a card pays its first three ratings a Central day, then nothing');
  eq(card('xp-C', 'x2', 'good', { at: CD + 31 }).why, 'fast', 'a rating under 2 seconds after the last one pays nothing (the speed limit)');
  ans('xp-C', 'x3', { choice: 1, at: CD + 40 });
  eq(card('xp-C', 'x2', 'good', { at: CD + 41 }).why, 'fast', 'the speed limit counts answers too: a rating 1 second after an answer pays nothing');
  const ca = card('xp-C', 'x2', 'easy', { at: CD + 50, ahead: true });
  ok(ca.xp === 0 && ca.why === 'ahead', `Study ahead moves the schedule and pays nothing (${JSON.stringify(ca)})`);
  eq(card('xp-C', 'x2', 'good', { at: CD + 60 }).xp, 2, 'Study ahead\'s ratings don\'t count toward the card\'s three a day');
  const cl = card('xp-C', 'x4', 'learn-1', { at: CD + 70 });
  ok(cl.ok && cl.xp === 0 && cl.why === 'learn', `a Learn step is recorded and pays nothing (Learn's answers pay as answers) (${JSON.stringify(cl)})`);
  eq([card('xp-C', 'nope', 'good', { at: CD + 80 }).why, card('xp-C', 'v2', 'good', { hub: 'xv', at: CD + 90 }).why], ['unknown', 'retired'], 'an unknown or retired id is recorded and earns nothing');
  eq([card('xp-C', 'x5', 'maybe', { at: CD + 100 }).error, card('xp-C', 'x5', 'good', { hub: 'Bad Hub', at: CD + 110 }).error, card('xp-C', 'x5', 'good', { at: CD + 120, req: 'short' }).error], ['bad', 'bad', 'bad'],
    'a bad rating, hub or request id is refused');
  // a replayed call and a double tap
  const xC = xpOf('xp-C'), rows0 = num(`select count(*) from card_reviews where visitor_id = 'xp-C'`);
  const cr = card('xp-C', 'x1', 'good', { at: CD + 500, req: 'card-c-0001' });
  ok(cr.repeat === true && cr.xp === 2 && xpOf('xp-C') === xC && num(`select count(*) from card_reviews where visitor_id = 'xp-C'`) === rows0,
    `a replayed call returns the first answer, records nothing and pays nothing (${JSON.stringify(cr)})`);
  eq(card('xp-C2', 'x1', 'good', { at: CD + 510, req: 'card-c-0001' }).error, 'dup', 'another visitor reusing a request id is refused');
  eq(num(`select count(*) from card_reviews where visitor_id = 'xp-C2'`), 0, '... and nothing is written for them');
  const ctap1 = card('xp-C3', 'x6', 'good', { at: CD + 600, req: 'card-tap-0001' }), ctap2 = card('xp-C3', 'x6', 'good', { at: CD + 600, req: 'card-tap-0002' });
  eq([ctap1.xp, ctap2.xp, ctap2.why], [2, 0, 'fast'], 'a double tap (two ratings in the same second) pays once');
  // a boost doubles a card, as it does an answer
  sql(`insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at) values ('xp-C4', 'medal:test', 'medal', 2, ${T(CD - 100)}, ${T(CD + 3600)})`);
  const cb = card('xp-C4', 'x1', 'good', { at: CD });
  ok(cb.xp === 4 && cb.base === 2 && cb.mult === 2, `double XP doubles a card (${JSON.stringify(cb)})`);
  // the next Central day pays again
  eq(card('xp-C', 'x1', 'good', { at: CD + DAY }).xp, 2, 'the next day, a card pays again');
  // a rating is not an answer: nothing reaches the class's numbers, your answers or a day studied
  eq(rows(`select hub, qid, attempts, correct from question_stats where hub = 'xh' order by 2`).filter(r => r.qid !== 'x3'), cls0.filter(r => r.qid !== 'x3'), 'ratings never reach question_stats (x3 had a real answer)');
  eq(num(`select coalesce(sum(picks), 0) from question_choices where hub = 'xh'`) - picks0, 1, 'ratings never reach the class\'s picks (only the one real answer did)');
  eq([num(`select count(*) from personal_answers`) - pa0, num(`select count(*) from answer_xp`) - ax0], [1, 1], 'ratings never reach personal_answers or answer_xp');
  eq([num(`select count(*) from xp_days where visitor_id = 'xp-C3'`), num(`select coalesce((select days from xp_visitors where visitor_id = 'xp-C3'), 0)`)], [0, 0],
    'a day with only flashcards doesn\'t make a day studied on the server (no +20, not on the streak board)');
  // the rebuild keeps the card awards
  const xC1 = xpOf('xp-C'); sql(`select sh_xp_rebuild(array['xp-C'])`);
  eq(xpOf('xp-C'), xC1, 'the rebuild (a correction, Link my devices) keeps the card awards');
  eq(num(`select coalesce(sum(xp), 0) from xp_awards where visitor_id = 'xp-C' and src = 'card'`), num(`select coalesce(sum(xp), 0) from card_reviews where visitor_id = 'xp-C'`), 'every paid rating is one card award');
  // get_my_cards: your rows, this hub, oldest first, in the page's time
  card('xp-C5', 'x8', 'good', { at: CD + 1000, seen: Date.parse('2030-03-13T17:59:00Z') });
  card('xp-C5', 'x8', 'again', { at: CD + 1010, seen: Date.parse('2030-03-01T00:00:00Z') });
  card('xp-C5', 'x9', 'learn-2', { at: CD + 1020, req: 'card-c5-learn' });
  card('xp-C5', 'm1', 'hard', { hub: 'xm', at: CD + 1030 });
  const myCards = anonJson(`get_my_cards('xp-C5', 'xh')`);
  eq(myCards.map(r => [r[0], r[1], r[3], r[4]]), [['x8', 'again', 0, null], ['x8', 'good', 0, null], ['x9', 'learn-2', 0, 'card-c5-learn']],
    'get_my_cards: this hub\'s rows, oldest first by the page\'s time');
  ok(myCards[0][2] === Date.parse('2030-03-13T18:00:00Z') + 1010 * 1000 - 2 * DAY * 1000 && myCards[1][2] === Date.parse('2030-03-13T17:59:00Z'),
    `the page's time is kept within the last two days, never in the future (${myCards.map(r => new Date(r[2]).toISOString()).join(', ')})`);
  eq([anonJson(`get_my_cards('xp-C6', 'xh')`), anonJson(`get_my_cards(null, 'xh')`), anonJson(`get_my_cards('xp-C5', '')`)], [[], [], []], 'nobody else\'s rows, and nothing without a visitor or hub');
  // through the grants, as a page calls it
  const cAnon = anonJson(`record_card_v2('xp-C7', 'xh', 'x1', 'good', false, 'card-anon-0001', null)`);
  ok(cAnon.ok && cAnon.xp === 2, `anon can record a rating through record_card_v2 (${JSON.stringify(cAnon)})`);
  // Start over in Learn: one call resets a whole set, pays nothing, and comes back in the replay
  const xC7 = xpOf('xp-C7');
  eq(anon(`select reset_my_learn('xp-C7', 'xh', array['x1', 'x2', 'x2', 'x3'], null)`)[0][0], '3', 'reset_my_learn writes one learn-reset row per question (duplicates once)');
  eq([xpOf('xp-C7'), anonJson(`get_my_cards('xp-C7', 'xh')`).filter(r => r[1] === 'learn-reset').length], [xC7, 3], 'a reset pays nothing and is in get_my_cards');
  eq([anon(`select reset_my_learn('xp-C7', 'xh', '{}'::text[], null)`)[0][0], anon(`select reset_my_learn(null, 'xh', array['x1'], null)`)[0][0], anon(`select reset_my_learn('xp-C7', 'Bad Hub', array['x1'], null)`)[0][0]], ['0', '0', '0'],
    'an empty list, no visitor or a bad hub resets nothing');
  // Link my devices: the ratings and their XP go to the id that remains
  card('xp-CL', 'x1', 'good', { at: CD });
  card('xp-CL2', 'x1', 'good', { at: CD + 100 }); card('xp-CL2', 'x2', 'learn-1', { at: CD + 110 });
  eq([xpOf('xp-CL'), xpOf('xp-CL2')], [2, 2], 'two devices before linking');
  const ccode = anon(`select create_link_code('xp-CL')`)[0][0];
  eq(anon(`select redeem_link_code(${q(ccode)}, 'xp-CL2')`)[0][0], 'xp-CL', 'the two devices link');
  eq([num(`select count(*) from card_reviews where visitor_id = 'xp-CL2'`), anonJson(`get_my_cards('xp-CL', 'xh')`).length], [0, 3], 'linked: every rating and Learn step is under the id that remains');
  eq(xpOf('xp-CL'), 4, 'linked: both devices\' card XP (the same card twice in a day: still within its three)');
  notes.push('Learn and Flashcards: a flat 2 for a card\'s first three ratings a day, the shared speed limit, Study ahead and Learn steps pay nothing, a replay, a double tap, a boost, the rebuild, no class numbers or day studied, get_my_cards, Link my devices');
  // Learn's answers keep their own context (migration_v59) and pay exactly as the bank's; anything unknown is still `other`
  const ctxOf = v => one(`select x.ctx from answer_xp x join personal_answers a on a.id = x.answer_id where a.visitor_id = ${q(v)}`);
  const lA = ans('xp-LA', 'x1', { choice: 1, ctx: 'learn', at: CD + 3000 }), lB = ans('xp-LB', 'x1', { choice: 1, ctx: 'bank', at: CD + 3000 });
  ans('xp-LO', 'x1', { choice: 1, ctx: 'somewhere', at: CD + 3000 });
  eq([ctxOf('xp-LA'), ctxOf('xp-LB'), ctxOf('xp-LO')], ['learn', 'bank', 'other'], 'an answer in Learn is filed as learn, the bank\'s as bank, an unknown context as other');
  eq([lA.xp, lA.correct, lA.first], [lB.xp, lB.correct, lB.first], 'an answer in Learn pays exactly as the same answer in the bank');

  /* ---------- 14c. a survey or an exam check-in: 1,000 XP and 1,000 crowns, first submission of each (migration_v60, v61) ---------- */
  {
    const sid = num(`insert into surveys (slug, title, questions, active) values ('xp-sv', 'T', '[{"id":"a","kind":"text","prompt":"p"}]', true) returning id`);
    const sv = (v, a) => anonJson(`submit_survey_v2(${sid}, ${q(v)}, ${a === null ? 'null' : q(JSON.stringify(a))}::jsonb)`);
    const W0 = json(`sh_wallet('xp-SV')`), w0 = W0.balance, x0 = xpOf('xp-SV');
    eq(sv('xp-SV', null), { ok: true, xp: 0, crowns: 0 }, '"Later" on a survey pays nothing');
    eq(sv('xp-SV', { a: 'yes' }), { ok: true, xp: 1000, crowns: 1000 }, 'a survey answered: 1,000 XP and 1,000 crowns');
    const W1 = json(`sh_wallet('xp-SV')`);   /* the 1,000 XP can be a rank-up, which pays its own +20 */
    eq([xpOf('xp-SV') - x0, W1.balance - w0 - 20 * (W1.rankups - W0.rankups)], [1000, 1000], 'the XP and the wallet move by exactly the reward (its XP earns no crowns of its own)');
    eq(sv('xp-SV', { a: 'again' }).ok, false, 'a survey can\'t be answered twice');
    eq(anon(`select submit_survey(${sid}, 'xp-SV2', '{"a":"old page"}'::jsonb)`)[0][0], 't', 'the old name still answers true');
    eq(xpOf('xp-SV2'), 1000, 'and pays the same');
    // migration_v88: a survey asks each person once, across Link my devices (the pop-up after any row, the Inbox until an answer)
    const popup = v => anon(`select id from get_active_survey(${q(v)})`).map(r => Number(r[0]));
    const inbox = v => anon(`select id from get_my_survey(${q(v)})`).map(r => Number(r[0]));
    eq([popup('xp-SV9'), inbox('xp-SV9')], [[sid], [sid]], 'a new device is asked, and has it in the Inbox');
    eq([popup('xp-SV'), inbox('xp-SV')], [[], []], 'whoever answered is asked no more');
    eq(anon(`select redeem_link_code(${q(anon(`select create_link_code('xp-SV')`)[0][0])}, 'xp-SVc')`)[0][0], 'xp-SV', 'a device links to it');
    eq([popup('xp-SVc'), inbox('xp-SVc')], [[], []], 'a device still on the id linked away from isn\'t asked (it used to be)');
    eq(anon(`select redeem_link_code(${q(anon(`select create_link_code('xp-SVf')`)[0][0])}, 'xp-SVg')`)[0][0], 'xp-SVf', 'two devices that hadn\'t answered link');
    eq(sv('xp-SVg', { a: 'from the old id' }).ok, true, 'one answers under the id it was linked away from');
    eq([popup('xp-SVf'), inbox('xp-SVf')], [[], []], 'the other device isn\'t asked either (it used to be)');
    eq(sv('xp-SVd', null).ok, true, 'a device says Later');
    eq(anon(`select redeem_link_code(${q(anon(`select create_link_code('xp-SVd')`)[0][0])}, 'xp-SVe')`)[0][0], 'xp-SVd', 'and links another');
    sql(`insert into survey_responses (survey_id, visitor_id, answers) values (${sid}, 'xp-SVd2', null)`);
    sql(`insert into visitor_links (alias_id, primary_id) values ('xp-SVd2', 'xp-SVd')`);   /* a Later written under an alias id after the link */
    eq([popup('xp-SVe'), inbox('xp-SVe')], [[], [sid]], 'Later on one device stops the pop-up on the others, and it waits in the Inbox');
    eq([popup('xp-SVd2'), inbox('xp-SVd2')], [[], [sid]], 'the same from the alias id');
    eq([popup(''), inbox('')], [[sid], [sid]], 'an empty id is still asked, as before');
    // a check-in: the first for each hub and exam pays; a second, or one after an earlier check-in, doesn't
    const ex = `${one(`select (now() at time zone 'America/Chicago')::date`)} Final`;
    const ci = (v, hub, exam) => anonJson(`submit_exam_debrief_v2(${q(hub)}, ${q(exam)}, ${q(v)}, '{"ready":4}'::jsonb)`);
    sql(`insert into exam_debriefs (hub, exam, visitor_id, answers) values ('xh', ${q(ex)}, 'xp-CI0', '{"ready":3}')`);   // checked in before v60
    eq(ci('xp-CI', 'xh', ex), { ok: true, xp: 1000, crowns: 1000 }, 'a first check-in: 1,000 XP and 1,000 crowns');
    eq(ci('xp-CI', 'xh', ex), { ok: true, xp: 0, crowns: 0 }, 'a second check-in for the same exam is saved and pays nothing');
    eq(ci('xp-CI', 'xh2', ex).xp, 1000, 'another hub\'s check-in pays once too');
    eq(ci('xp-CI0', 'xh', ex), { ok: true, xp: 0, crowns: 0 }, 'someone who checked in before the reward existed gets nothing for checking in again');
    eq(anon(`select submit_exam_debrief('xh', '2099-01-01 Final', 'xp-CI', '{"ready":4}'::jsonb)`)[0][0], 'f', 'a check-in for an exam that hasn\'t happened is refused, as before');
    eq(json(`sh_wallet('xp-CI')`).rewards, 2, 'the wallet counts two rewards');
    // migration_v86: a closed check-in (checkinClosed in hubs.js, kept in exam_checkins_closed) is refused before anything is saved or paid
    sql(`insert into exam_checkins_closed (hub, exam_date) values ('xh3', ${q(ex.slice(0, 10))})`);
    eq(ci('xp-CI4', 'xh3', ex), { ok: false, closed: true }, 'a check-in for a closed exam is refused, and says so');
    eq(anon(`select submit_exam_debrief('xh3', ${q(ex)}, 'xp-CI4', '{"ready":4}'::jsonb)`)[0][0], 'f', 'the old name answers false for it');
    eq([num(`select count(*) from exam_debriefs where hub = 'xh3'`), xpOf('xp-CI4')], [0, 0], 'nothing saved, nothing paid');
    eq(ci('xp-CI4', 'xh', ex).xp, 1000, 'an open check-in still pays, for the same person on the same day');
    raises(() => anon(`select count(*) from exam_checkins_closed`), '42501', 'anon reads the closed check-ins');
    // a linked device: the reward was paid on one id, so the other's first check-in for that exam pays nothing
    const lc = anon(`select create_link_code('xp-CI')`)[0][0];
    eq(anon(`select redeem_link_code(${q(lc)}, 'xp-CI3')`)[0][0], 'xp-CI', 'a second device links');
    eq(ci('xp-CI3', 'xh', ex).xp, 0, 'the linked device\'s check-in for the same exam pays nothing');
    eq([json(`sh_wallet('xp-CI')`).rewards, num(`select count(*) from xp_awards where visitor_id = 'xp-CI' and src = 'checkin'`)], [2, 2], 'still two rewards after linking');
    const cxp = xpOf('xp-CI'); sql(`select sh_xp_rebuild(array['xp-CI'])`); eq(xpOf('xp-CI'), cxp, 'the rebuild keeps the rewards');
    raises(() => anon(`select sh_form_reward('x', 'survey:1', 'survey', '')`), '42501', 'anon pays itself a reward');
    // migration_v61's top-up: a reward paid at 500 (v60) becomes 1,000, its XP total moves by 500, the crowns stay 1,000, and a second run changes nothing
    eq(num(`select sh_award('xp-TU', 'survey:99', 'survey', '', 500, 1, now())`), 500, 'a reward paid at 500, as v60 did');
    const T0 = json(`sh_wallet('xp-TU')`), t0 = xpOf('xp-TU');
    const v61 = fs.readFileSync(path.join(ROOT, 'migration_v61.sql'), 'utf8');
    sql('begin;\n' + v61 + '\ncommit;');
    const T1 = json(`sh_wallet('xp-TU')`);
    eq([xpOf('xp-TU') - t0, json(`select json_build_array(base, xp) from xp_awards where visitor_id = 'xp-TU' and key = 'survey:99'`), T1.balance - T0.balance - 20 * (T1.rankups - T0.rankups)], [500, [1000, 1000], 0], 'the top-up: +500 XP, the row at 1,000, the crowns unchanged');
    sql('begin;\n' + v61 + '\ncommit;');
    eq(xpOf('xp-TU') - t0, 500, 'running the top-up again changes nothing');
    sql(`select sh_xp_rebuild(array['xp-TU'])`); eq(xpOf('xp-TU') - t0, 500, 'the rebuild agrees with the top-up');
    notes.push('a survey or check-in: 1,000 XP and 1,000 crowns once each, nothing for "Later", a second check-in, an earlier one, a linked device or a closed check-in; a survey asks each person once across linked devices (migration_v88)');
  }

  /* ---------- 14c. migration_v68: the crowns in every reply, and the prizes ---------- */
  {
    // a hub of 60 questions that count for nothing (no medals in the way): the run of right answers, the nuke, the record
    const xr = []; for (let i = 1; i <= 60; i++) xr.push({ id: 'r' + i, kind: 'one', answer: [0], counted: false });
    xr.push({ id: 'rs', kind: 'self', counted: false });
    anon(`select admin_load_question_keys(${S}, 'xr', ${q(JSON.stringify(xr))}::jsonb)`);
    const BASE = 40 * DAY;   // a day of its own
    const rq = i => 'r' + ((i % 60) + 1);
    const wal = v => json(`sh_wallet(${q(v)})`);
    // every reply carries the balance
    const a0 = ans('xp-RN', 'r1', { hub: 'xr', choice: 0, at: BASE });
    eq([typeof a0.crowns, a0.crowns], ['number', wal('xp-RN').balance], 'an answer\'s reply carries the crowns after it');
    // the run: 10, 25 and 50 right in a row pay 25, 100 and 250, once per run
    const runs = [a0];
    for (let i = 1; i < 50; i++) runs.push(ans('xp-RN', rq(i), { hub: 'xr', choice: 0, at: BASE + i * 3 }));
    const rowsPaid = runs.map((r, i) => (r.bonus || []).filter(b => b.src === 'row').map(b => (i + 1) + ':' + b.xp)).flat();
    eq(rowsPaid, ['10:25', '25:100', '50:250'], 'right in a row: 10, 25 and 50 pay 25, 100 and 250');
    // a self-graded card and a too-fast answer neither add nor break it; a wrong one ends it
    ans('xp-RN', 'rs', { hub: 'xr', self: false, at: BASE + 50 * 3 });
    ans('xp-RN', rq(50), { hub: 'xr', choice: 0, at: BASE + 50 * 3 + 0.5 });
    eq(num(`select n from xp_runs where visitor_id = 'xp-RN'`), 50, 'a self-graded miss and a too-fast answer leave the run at 50');
    // the same question right a 4th time today pays (every right answer does) but doesn't add to the run
    ans('xp-RQ', 'r1', { hub: 'xr', choice: 0, at: BASE }); ans('xp-RQ', 'r1', { hub: 'xr', choice: 0, at: BASE + 3 }); ans('xp-RQ', 'r1', { hub: 'xr', choice: 0, at: BASE + 6 });
    const r4 = ans('xp-RQ', 'r1', { hub: 'xr', choice: 0, at: BASE + 9 });
    eq([r4.xp, num(`select n from xp_runs where visitor_id = 'xp-RQ'`)], [2, 3], 'one question answered right a 4th time today: 2 XP, and the run stays at 3');
    // the nuke: nothing before 100, 10,000 XP and crowns at the launch after 100, once; 100 more for the next
    eq(json(`sh_launch_nuke(${T(BASE + 160)}, 'xp-RN', 'xr', 'Test')`).xp, 0, 'a launch before the run reaches 100 pays nothing');
    eq(num(`select count(*) from nuke_launches where visitor_id = 'xp-RN'`), 1, 'the launch is still logged for the admin page');
    sql(`update game_records set value = 130, run = null, visitor_id = null where kind = 'run'`);
    let t = BASE + 200; const more = [];
    for (let i = 50; i < 140; i++) more.push(ans('xp-RN', rq(i), { hub: 'xr', choice: 0, at: (t += 3) }));
    eq(num(`select n from xp_runs where visitor_id = 'xp-RN'`), 140, 'the run reaches 140');
    const x0 = xpOf('xp-RN'), w0 = wal('xp-RN');
    const nk = json(`sh_launch_nuke(${T(t + 5)}, 'xp-RN', 'xr', 'Test')`);
    const w1n = wal('xp-RN');
    eq([nk.xp, nk.won, xpOf('xp-RN') - x0, nk.crowns - w0.balance - 20 * (w1n.rankups - w0.rankups), nk.crowns], [10000, 10000, 10000, 10000, w1n.balance], 'launching after 100 in a row: 10,000 XP and 10,000 crowns (and a rank-up\'s 20), and the reply says so');
    eq(json(`sh_launch_nuke(${T(t + 6)}, 'xp-RN', 'xr', 'Test')`).xp, 0, 'a second launch from the same 100 pays nothing');
    // the class's record: passing it (130 here) pays 20,000 once per run, and the record follows the run
    const at = more.map((r, i) => (r.bonus || []).filter(b => b.src === 'alltime').map(b => (51 + i) + ':' + b.xp + ':' + b.was)).flat();
    eq(at, ['131:20000:130'], 'passing the class\'s longest run (130): 20,000 once, at 131');
    eq(json(`select json_build_array(value, visitor_id) from game_records where kind = 'run'`), [140, 'xp-RN'], 'the record follows the run up');
    // 100 more right, the next day (each question pays its first three right a day): a second nuke
    t = BASE + DAY;
    for (let i = 140; i < 240; i++) ans('xp-RN', rq(i), { hub: 'xr', choice: 0, at: (t += 3) });
    eq(json(`sh_launch_nuke(${T(t + 5)}, 'xp-RN', 'xr', 'Test')`).xp, 10000, '100 more right after a launch: another 10,000');
    // a miss ends the run; the next one must pass the record again (240 now) to pay, and a run under 100 never does
    ans('xp-RN', 'r1', { hub: 'xr', choice: 1, at: (t += 3) });
    eq(num(`select n from xp_runs where visitor_id = 'xp-RN'`), 0, 'a miss ends the run');
    sql(`update game_records set value = 20, run = null where kind = 'run'`);
    const low = []; for (let i = 0; i < 25; i++) low.push(ans('xp-RL', rq(i), { hub: 'xr', choice: 0, at: BASE + i * 3 }));
    ok(!low.some(r => (r.bonus || []).some(b => b.src === 'alltime')), 'passing a record of 20 pays nothing: the record prize starts at 100');
    notes.push('right in a row (10, 25, 50), the nuke (10,000 once per 100), the class\'s record (20,000 once per run), repeats and self-graded cards don\'t count');

    // the streak of days: 3 and 7 days in a row pay 100 and 300 at the day's first answer, once
    const sd = []; for (let d = 0; d < 8; d++) sd.push(ans('xp-SD', 'r1', { hub: 'xr', choice: 0, at: BASE + d * DAY + 7200 }));
    eq(sd.map(r => (r.bonus || []).filter(b => b.src === 'streak').map(b => b.n + ':' + b.xp).join('')), ['', '', '3:100', '', '', '', '7:300', ''], 'a streak of days: 3 days pay 100, 7 days 300');
    eq(ans('xp-SD', 'r2', { hub: 'xr', choice: 0, at: BASE + 6 * DAY + 7300 }).bonus.filter(b => b.src === 'streak').length, 0, 'the day\'s second answer pays no streak prize');

    // the daily ring: 5 a question of the goal, once per hub per day, when the answers reach it
    const ringAt = BASE + 20 * DAY;
    for (let i = 0; i < 19; i++) ans('xp-RG', rq(i), { hub: 'xr', choice: 0, at: ringAt + i * 3 });
    const rg1 = json(`sh_claim_ring(${T(ringAt + 100)}, 'xp-RG', 'xr', 20)`);
    eq([rg1.xp, rg1.why], [0, 'short'], 'the ring with 19 of 20: nothing yet');
    ans('xp-RG', rq(19), { hub: 'xr', choice: 0, at: ringAt + 120 });
    const rg2 = json(`sh_claim_ring(${T(ringAt + 130)}, 'xp-RG', 'xr', 20)`);
    eq([rg2.xp, rg2.won, rg2.crowns], [100, 100, wal('xp-RG').balance], 'the ring filled at 20: 100 XP and crowns');
    eq(json(`sh_claim_ring(${T(ringAt + 140)}, 'xp-RG', 'xr', 10)`).xp, 0, 'once a day, whatever the goal');
    eq(json(`sh_claim_ring(${T(ringAt + 140)}, 'xp-RG', 'xr', 15)`).error, 'bad', 'a goal the page doesn\'t offer is refused');

    // a Plaque Boss: the share of its HP, never more than the right answers in its window, once
    const bossAt = BASE + 22 * DAY, bossDay = num(`select 1`) && one(`select ((${T(bossAt)}) at time zone 'America/Chicago')::date`);
    const win = Math.floor(num(`select extract(hour from (${T(bossAt)}) at time zone 'America/Chicago')`) / 2), bid = bossDay + '|' + win;
    for (let i = 0; i < 10; i++) ans('xp-BS', rq(i), { hub: 'xr', choice: 0, at: bossAt + 60 + i * 3 });
    const bs = json(`sh_claim_boss(${T(bossAt + 200)}, 'xp-BS', 'xr', ${q(bid)}, 40, 40)`);
    eq([bs.damage, bs.xp], [12, 150], 'a boss: 40 damage claimed, 10 right answers (12 with crits) count: 12/40 of 500');
    eq(json(`sh_claim_boss(${T(bossAt + 210)}, 'xp-BS', 'xr', ${q(bid)}, 40, 40)`).xp, 0, 'once per boss');
    eq(json(`sh_claim_boss(${T(bossAt + 3 * 3600)}, 'xp-BS2', 'xr', ${q(bid)}, 5, 40)`).error, 'late', 'after its window: refused');
    eq(json(`sh_claim_boss(${T(bossAt + 200)}, 'xp-BS2', 'xr', ${q(bid)}, 5, 40)`).why, 'hits', 'no right answers in its window: nothing');

    // a lecture's notes: at least 60 seconds from opening to the end, 50 once per lecture
    const nAt = BASE + 24 * DAY;
    const rd = one(`select sh_notes_start(${T(nAt)}, 'xp-NT', 'xr', 'L1')`);
    const nd1 = json(`sh_notes_done(${T(nAt + 20)}, 'xp-NT', ${q(rd)}::uuid)`);
    eq([nd1.xp, nd1.why], [0, 'fast'], 'jumping to the end after 20 seconds: nothing');
    const nd2 = json(`sh_notes_done(${T(nAt + 90)}, 'xp-NT', ${q(rd)}::uuid)`);
    eq([nd2.xp, nd2.lec], [50, 'L1'], 'read to the end after 90 seconds: 50');
    eq(one(`select sh_notes_start(${T(nAt + 100)}, 'xp-NT', 'xr', 'L1') is null`), 't', 'a lecture already paid gives no read id');
    raises(() => anon(`select count(*) from notes_reads`), '42501', 'anon reads notes_reads directly');
    eq(json(`sh_notes_done(${T(nAt + 90)}, 'xp-NT2', ${q(rd)}::uuid)`).error, 'bad', 'someone else\'s read id is refused');

    // a name: 500 the first time, never for the made-up default name; the old call pays too
    const nm = anonJson(`set_display_name_v2('xp-NM', 'Prize Premolar')`);
    eq([nm.xp, nm.crowns], [500, wal('xp-NM').balance], 'choosing a name: 500 XP and crowns');
    eq(anonJson(`set_display_name_v2('xp-NM', 'Other Name')`).xp, 0, 'changing it again pays nothing');
    const dflt = one(`select anon_name('xp-NM2')`);
    eq(anonJson(`set_display_name_v2('xp-NM2', ${q(dflt)})`).xp, 0, 'saving the made-up default name pays nothing');
    anon(`select set_display_name('xp-NM3', 'Old Page Name')`);
    eq(num(`select coalesce(sum(base), 0) from xp_awards where visitor_id = 'xp-NM3' and src = 'name'`), 500, 'a name saved through the old call pays too');
    eq(wal('xp-NM').got.name, true, 'the wallet says the name prize is taken');

    // a visit: 50 once a day, never your own place or a linked device's
    const vAt = BASE + 26 * DAY, key = one(`select sh_visit_key('xp-RN')`);
    const vs = json(`sh_claim_visit(${T(vAt)}, 'xp-VI', ${q(key)})`);
    eq([vs.xp, vs.crowns], [50, wal('xp-VI').balance], 'visiting someone: 50 XP and crowns');
    eq(json(`sh_claim_visit(${T(vAt + 60)}, 'xp-VI', ${q(key)})`).xp, 0, 'once a day');
    eq(json(`sh_claim_visit(${T(vAt + DAY)}, 'xp-VI', ${q(key)})`).xp, 50, 'again the next day');
    eq(json(`sh_claim_visit(${T(vAt)}, 'xp-RN', ${q(key)})`).why, 'self', 'your own place pays nothing');
    eq(json(`sh_claim_visit(${T(vAt)}, 'xp-VI2', '000000000000000000000000')`).error, 'unknown', 'an unknown key is refused');

    // trophies: the ones held when v68 ran pay nothing; a new one pays 200 once
    const heldBefore = num(`select count(*) from prize_seen where visitor_id = 'xp-U' and key = 'trophy:owl'`);
    eq(heldBefore, 0, 'xp-U won Night Owl after the snapshot (in this test, after the migration)');
    const tr1 = anonJson(`claim_trophies_v2('xp-U')`);
    ok(tr1.won.includes('owl') && tr1.xp >= 200 && tr1.xp % 200 === 0, `a trophy won from now on: 200 XP and crowns (${JSON.stringify(tr1)})`);
    eq(anonJson(`claim_trophies_v2('xp-U')`).xp, 0, 'claiming again pays nothing');
    sql(`insert into prize_seen (visitor_id, key) values ('xp-TS', 'trophy:owl')`); anon(`select record_achievement('xp-TS', 'owl', '')`);
    ans('xp-TS', 'r1', { hub: 'xr', choice: 0, at: BASE });
    eq(anonJson(`claim_trophies_v2('xp-TS')`).won.includes('owl'), false, 'a trophy held when the migration ran pays nothing');

    // games: the day's first game 100 once; beating your best 50, the hub's top score 250, each once per game a day
    const gAt = BASE + 30 * DAY;
    sql(`insert into arcade_scores (hub, game, visitor_id, score, played_at) values ('xr', 'board', 'xp-GO', 500, now() - interval '1 day'), ('xr', 'board', 'xp-GM', 100, now() - interval '1 day')`);
    const g1 = one(`select sh_session_start(${T(gAt)}, 'xp-GM', 'xr', 'arcade', 'board')`);
    const gf1 = json(`sh_session_finish(${T(gAt + 30)}, 'xp-GM', ${q(g1)}::uuid, 200, null)`);
    eq([gf1.xp, gf1.game, gf1.pb, gf1.top, gf1.crowns], [50, 100, 50, 0, wal('xp-GM').balance], 'a game: 50 XP, the day\'s first game 100, a new personal best 50');
    sql(`update arcade_scores set played_at = now() - interval '1 hour' where visitor_id = 'xp-GM'`);
    const g2 = one(`select sh_session_start(${T(gAt + 60)}, 'xp-GM', 'xr', 'arcade', 'board')`);
    const gf2 = json(`sh_session_finish(${T(gAt + 90)}, 'xp-GM', ${q(g2)}::uuid, 900, null)`);
    eq([gf2.xp, gf2.game, gf2.pb, gf2.top], [0, 0, 0, 250], 'the same day: the hub\'s top score pays 250 (the personal best already paid today)');
    const g3 = one(`select sh_session_start(${T(gAt + 120)}, 'xp-GM', 'xr', 'arcade', 'board')`);
    const gf3 = json(`sh_session_finish(${T(gAt + 125)}, 'xp-GM', ${q(g3)}::uuid, 5000, null)`);
    eq([gf3.game, gf3.pb, gf3.top], [0, 0, 0], 'a game under 20 seconds pays no prize');

    // crowns for a prize equal its XP: a fixed report, a finished episode, a medal (crowns only for those paid before)
    const w1 = wal('xp-GM'); award('xp-GM', 'rep:flag:9100', 100);
    eq(wal('xp-GM').balance - w1.balance, 100, 'a fixed report: 100 crowns with its 100 XP');
    // the rebuild keeps every prize
    const keep = ['xp-RN', 'xp-SD', 'xp-RG', 'xp-GM'].map(xpOf);
    sql(`select sh_xp_rebuild(array['xp-RN', 'xp-SD', 'xp-RG', 'xp-GM'])`);
    eq(['xp-RN', 'xp-SD', 'xp-RG', 'xp-GM'].map(xpOf), keep, 'the rebuild keeps every prize');
    // the page's table of prizes says what the server pays
    const v3src = fs.readFileSync(path.join(ROOT, 'widget/v3.js'), 'utf8'), pm = /var PRIZES = (\{[^;]*\});/.exec(v3src);
    ok(pm, 'widget/v3.js has its PRIZES table');
    const canon = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));   /* jsonb sorts its keys its own way */
    if (pm) eq(canon(JSON.parse(pm[1].replace(/([{,]\s*)([a-z0-9]+):/g, '$1"$2":'))), canon(json(`sh_prizes()`)), 'widget/v3.js\'s PRIZES match sh_prizes()');
    for (const f of [`sh_run_step('x', 'xr', 1, true, now())`, `sh_streak_step('x', 'xr', current_date, now())`, `sh_launch_nuke(null, 'x', 'xr', 'x')`,
      `sh_claim_ring(null, 'x', 'xr', 20)`, `sh_claim_boss(null, 'x', 'xr', '2030-03-04|6', 1, 40)`, `sh_notes_start(null, 'x', 'xr', 'L1')`,
      `sh_name_prize('x', 'y')`, `sh_claim_visit(null, 'x', ${q(key)})`, `sh_crowns('x')`])
      raises(() => anon(`select ${f}`), '42501', `anon runs ${f.split('(')[0]}`);
    for (const tb of ['xp_runs', 'game_records', 'prize_seen']) raises(() => anon(`select count(*) from public.${tb}`), '42501', `anon reads ${tb} directly`);
    notes.push('v68 prizes: the streak of days, the daily ring, a boss\'s share, a lecture read, a name, a visit, trophies from now on, the day\'s first game and records, a fixed report\'s crowns, crowns in every reply, the rebuild keeps them');
  }

  /* ---------- 14b. the catch-up after the evening outage of 2026-11-18 (migration_v73) ----------
     A device sends the day's answers, right answers and XP it kept; the server pays what the missing ones would have,
     once, only for someone studying in that hub during the outage, within the answer rules and 3 a minute. */
  if (one(`select to_regprocedure('restore_outage_v2(text,text,integer,integer,integer,integer,boolean)') is not null`) === 't') {
    const R = (v, hub, n, r, x, goal, met) => json(`restore_outage_v2(${q(v)}, ${q(hub)}, ${n}, ${r}, ${x}, ${goal}, ${met})`);
    const pings = (v, hub, from, mins) => sql(`insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select ${q(v)}, ${q(v + '-visit')}, ${q(hub)}, 'questions/bank', ${q(from)}::timestamptz + make_interval(secs => g * 25) from generate_series(0, ${mins * 60 / 25}) g`);
    if (one(`select now() < '2026-11-22 06:00+00'`) === 't') {
      // OUT studied in xo through the outage (60 minutes); 5 of the day's answers saved (3 right), the device has 30 (20 right)
      pings('xp-OUT', 'xo', '2026-11-18 19:40+00', 60);
      sql(`insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
        select 'xp-OUT', 'xo', 'o' || g, g <= 3, '2026-11-18 19:00+00'::timestamptz + make_interval(secs => g * 60) from generate_series(1, 5) g`);
      for (let i = 1; i <= 5; i++) sql(`select sh_award('xp-OUT', 'a:out${i}', 'answer', 'xo', ${i <= 3 ? 10 : 1}, 1, '2026-11-18 19:00+00')`);
      const x0 = xpOf('xp-OUT'), w0 = json(`sh_wallet('xp-OUT')`);
      const r1 = R('xp-OUT', 'xo', 30, 20, 32 + 17 * 10 + 8, 20, true);
      ok(r1.ok && r1.n === 25 && r1.right === 17, `the catch-up counts 25 missing answers, 17 right (${JSON.stringify(r1).slice(0, 160)})`);
      eq(r1.answers, 178 + 30, 'their XP (10 a right one, 1 a miss) and the day\'s 20th answer (30), less what was saved');
      eq(r1.ring, 100, 'the daily ring the device met (5 a question of 20), which the saved answers alone didn\'t reach');
      eq(xpOf('xp-OUT') - x0, 308, 'XP goes up by what the reply says');
      const w1 = json(`sh_wallet('xp-OUT')`);
      ok(Math.abs(w1.from_xp - w0.from_xp - 104) <= 1 && w1.prizes - w0.prizes === 100,
        `crowns: one for 2 XP of answers, one for one of the ring (${w1.from_xp - w0.from_xp} and ${w1.prizes - w0.prizes})`);
      eq(num(`select n from xp_days where visitor_id = 'xp-OUT' and d = '2026-11-18'`), 30, 'the day counts the missing answers');
      const r2 = R('xp-OUT', 'xo', 30, 20, 210, 20, true);
      ok(r2.ok && r2.xp === 0 && r2.why === 'done' && xpOf('xp-OUT') - x0 === 308, 'a second call pays nothing');
      // NEW: only pings in the outage (10 minutes), nothing saved that day, two days studied before it
      pings('xp-NEW', 'xo', '2026-11-18 20:00+00', 10);
      sql(`insert into xp_days (visitor_id, d, n, c, raw) values ('xp-NEW', '2026-11-16', 5, 5, 0), ('xp-NEW', '2026-11-17', 5, 5, 0)`);
      const r3 = R('xp-NEW', 'xo', 400, 300, 4000, 20, false);
      ok(r3.ok && r3.n === 30 && r3.right === 30, `3 answers a minute at most: 30 for 10 minutes (${JSON.stringify(r3).slice(0, 160)})`);
      eq(r3.answers, 300 + 30 + 20, 'their XP within the rules, the 20th answer and the day\'s first answer (20)');
      ok(r3.ring === 0 && r3.day === true, 'no ring the device didn\'t meet; a new day');
      ok(Array.isArray(r3.bonus) && r3.bonus.some(b => b.src === 'streak' && b.n === 3), `the day keeps the streak: 3 days in a row pays (${JSON.stringify(r3.bonus)})`);
      eq(num(`select days from xp_visitors where visitor_id = 'xp-NEW'`), 3, 'days studied counts the day');
      // OFF wasn't studying in xo during the outage; ODD sends nonsense
      pings('xp-OFF', 'xo', '2026-11-18 22:00+00', 10);
      const r4 = R('xp-OFF', 'xo', 30, 20, 210, 20, true);
      ok(r4.ok && r4.xp === 0 && r4.why === 'none' && xpOf('xp-OFF') === 0, 'nothing for someone not studying in that hub during the outage');
      ok(R('xp-OUT', 'xo', 5, 9, 10, 20, true).error === 'bad' && R('xp-OUT', 'XO!', 5, 1, 10, 20, true).error === 'bad', 'more right than answers, or a bad hub: refused');
      // the rebuild (Link my devices) keeps it
      const keep = xpOf('xp-OUT'); sql(`select sh_xp_rebuild(array['xp-OUT'])`);
      ok(num(`select count(*) from xp_awards where visitor_id = 'xp-OUT' and src = 'restore'`) === 1 && num(`select count(*) from xp_awards where visitor_id = 'xp-OUT' and key = 'ring:xo:2026-11-18'`) === 1,
        `the rebuild keeps the catch-up's award and ring (XP ${keep} → ${xpOf('xp-OUT')})`);
      eq(anonJson(`restore_outage_v2('xp-OFF', 'xo', 1, 1, 10, 20, false)`).why, 'none', 'anon can ask (the page does)');
      notes.push('the outage catch-up (migration_v73): only someone studying in the hub then, 3 answers a minute, the rules\' XP, the 20th answer, the ring, the day and its streak, once, kept by the rebuild');
    } else {
      eq(R('xp-OUT', 'xo', 30, 20, 210, 20, true).error, 'closed', 'the outage catch-up is closed after 2026-11-21');
      notes.push('the outage catch-up (migration_v73) is closed (after 2026-11-21): only that is checked');
    }
  }

  /* ---------- 14d. collections (migration_v75; Sam, 2026-11-19: "completing a collection gives 1000 xp and 1000 crowns as a
     bonus"): each season's set, each year-round collection and the rare costumes; a finished one pays 1,000 XP and 1,000
     crowns once; one whose every piece is a gift (Halloween 2026's) pays nothing ---------- */
  if (one(`select to_regprocedure('claim_collections_v2(text)') is not null`) === 't') {
    // the catalog's collection column is exactly allCollectionItems() of sets.mjs
    const wantC = Object.fromEntries(SETS.coll.map(i => [i.id, i.collection]));
    const gotC = Object.fromEntries(rows(`select id, collection from shop_items where collection is not null`).map(r => [r.id, r.collection]));
    const cDiff = [...new Set([...Object.keys(wantC), ...Object.keys(gotC)])].filter(id => wantC[id] !== gotC[id]);
    ok(cDiff.length === 0 && Object.keys(gotC).length === 48, `shop_items.collection is exactly allCollectionItems() of sets.mjs (${Object.keys(gotC).length} rows; ${cDiff.length} differ${cDiff.length ? ': ' + cDiff.slice(0, 5).join(', ') : ''})`);
    raises(() => sql(`update shop_items set collection = 'dino' where id = 'pirate'`), '23514', 'a costume can\'t also be in a year-round collection');
    raises(() => sql(`update shop_items set collection = 'dino' where id = 'haunted-manor'`), '23514', 'a season\'s piece can\'t also be in a year-round collection');
    const C = v => anonJson(`get_my_collections(${q(v)})`), claim = v => anonJson(`claim_collections_v2(${q(v)})`);
    const of = (r, k) => (r.collections || []).find(c => c.k === k) || {};
    const c0 = C('xp-CL');
    eq([c0.ok, c0.pays, c0.collections.length], [true, 1000, SETS.seasons.length + SETS.colls.length + 1], 'every collection: the fourteen seasons\' sets, the six year-round collections and the rare costumes');
    eq(c0.collections.map(c => c.kind).filter((x, i, a) => a.indexOf(x) === i), ['season', 'collection', 'costumes'], 'the seasons first, then the year-round collections, then the costumes');
    eq([of(c0, 'costumes').n, of(c0, 'dino').n, of(c0, 'thanksgiving').n], [10, 8, 8], 'the costumes are ten, a set or a collection eight');
    eq([of(c0, 'halloween').have, of(c0, 'halloween').done, of(c0, 'halloween').pays], [8, true, false], 'Halloween 2026\'s set: everyone\'s, complete, and it pays nothing');
    ok(c0.collections.every(c => c.k === 'halloween' || (c.pays && c.have === 0 && !c.done && !c.paid)), 'a new visitor has nothing else, and every other collection pays');
    // seven of Dino valley's eight: nothing yet; the eighth: 1,000 XP and 1,000 crowns, once
    const dino = SETS.coll.filter(i => i.collection === 'dino').map(i => i.id);
    sql(`insert into pet_inventory (visitor_id, item_id) values ${dino.slice(0, 7).map(id => `('xp-CL', ${q(id)})`).join(', ')}`);
    eq([of(C('xp-CL'), 'dino').have, of(C('xp-CL'), 'dino').done], [7, false], 'seven of eight');
    const x0 = xpOf('xp-CL'), cl0 = claim('xp-CL');
    eq([cl0.ok, cl0.xp, cl0.won], [true, 0, []], 'a collection not finished pays nothing');
    sql(`insert into pet_inventory (visitor_id, item_id) values ('xp-CL', ${q(dino[7])})`);
    eq([of(C('xp-CL'), 'dino').done, of(C('xp-CL'), 'dino').paid], [true, false], 'the eighth piece: finished, not paid yet');
    const w0 = json(`sh_wallet('xp-CL')`), cl1 = claim('xp-CL'), w1 = json(`sh_wallet('xp-CL')`);
    eq([cl1.xp, cl1.won, cl1.src, of(cl1, 'dino').paid], [1000, ['dino'], 'collection', true], 'claiming it: 1,000 XP, and the list says it\'s paid');
    eq([xpOf('xp-CL') - x0, w1.balance - w0.balance - 20 * (w1.rankups - w0.rankups), w1.prizes - w0.prizes, cl1.crowns], [1000, 1000, 1000, w1.balance], '1,000 XP and 1,000 crowns (and a rank-up\'s 20 if the XP reaches one), and the reply carries the balance');
    eq(json(`get_rank_profile_v2('xp-CL')`).xp, xpOf('xp-CL'), 'the XP counts for the rank');
    eq([claim('xp-CL').xp, xpOf('xp-CL') - x0], [0, 1000], 'claiming again pays nothing');
    eq(num(`select count(*) from xp_awards where visitor_id = 'xp-CL' and key = 'collection:dino' and src = 'collection' and base = 1000 and xp = 1000`), 1, 'one prize row, never boosted');
    // the rare costumes: all ten, bought, is a collection too; two finished at once pay twice in one call
    const costumes = SETS.costumes.map(c => c.id), reef = SETS.coll.filter(i => i.collection === 'reef').map(i => i.id);
    sql(`insert into pet_inventory (visitor_id, item_id) values ${costumes.concat(reef).map(id => `('xp-CL', ${q(id)})`).join(', ')}`);
    const cl2 = claim('xp-CL');
    eq([cl2.xp, cl2.won.slice().sort()], [2000, ['costumes', 'reef']], 'two finished at once: both paid in one call');
    // a season's set: the eight pieces bought (Thanksgiving's)
    const tg = SETS.items.filter(i => i.season === 'thanksgiving').map(i => i.id);
    sql(`insert into pet_inventory (visitor_id, item_id) values ${tg.map(id => `('xp-CL', ${q(id)})`).join(', ')}`);
    eq(claim('xp-CL').won, ['thanksgiving'], 'a season\'s set, finished, pays');
    eq(num(`select count(*) from xp_awards where visitor_id = 'xp-CL' and src = 'collection'`), 4, 'four collections paid: never Halloween\'s gift');
    // the rebuild keeps them; Link my devices pays a collection once
    const kx = xpOf('xp-CL'); sql(`select sh_xp_rebuild(array['xp-CL'])`); eq(xpOf('xp-CL'), kx, 'the rebuild keeps the collection prizes');
    sql(`insert into pet_inventory (visitor_id, item_id) values ${dino.map(id => `('xp-CL2', ${q(id)})`).join(', ')}`);
    eq(claim('xp-CL2').xp, 1000, 'another device finishes Dino valley too, and is paid');
    const lc = anon(`select create_link_code('xp-CL')`)[0][0];
    eq(anon(`select redeem_link_code(${q(lc)}, 'xp-CL2')`)[0][0], 'xp-CL', 'the two devices link');
    eq([xpOf('xp-CL'), num(`select count(*) from xp_awards where visitor_id = 'xp-CL' and key = 'collection:dino'`), claim('xp-CL').xp], [kx, 1, 0], 'linked: Dino valley is paid once');
    // refusals and privileges
    eq([C('').error, claim('x'.repeat(81)).error], ['bad', 'bad'], 'a bad visitor id is refused');
    for (const f of [`sh_collections('xp-CL')`, `sh_collections_json('xp-CL')`]) raises(() => anon(`select ${f}`), '42501', `anon runs ${f.split('(')[0]}`);
    ok(!/xp-/.test(JSON.stringify(C('xp-CL'))) && !/xp-/.test(JSON.stringify(claim('xp-CL'))), 'neither reply carries a visitor id');
    notes.push('collections (migration_v75): 21 (14 sets, 6 year-round, the costumes), a finished one 1,000 XP and crowns once, Halloween\'s gift never, two at once, the rebuild and Link my devices');
  }

  /* ---------- 14e. more ways to earn crowns (migration_v92; Sam, 2026-11-20: "Yes and backpay"): the first Tooth Fairy
     250, the first Golden one 500, a Golden Probe won 300, a perfect mock 750, yesterday's misses all right 100, an idea
     shipped 500, the first day back after a week away 200; each one key, as many crowns as XP, never boosted ---------- */
  if (one(`select to_regprocedure('claim_misses_v2(text,text)') is not null`) === 't') {
    const P = json(`sh_prizes()`);
    eq([P.fairy, P.goldfairy, P.probe, P.perfect, P.misses, P.idea, P.back], [250, 500, 300, 750, 100, 500, 200], 'sh_prizes() has the seven new prizes');
    ok(['fairy', 'goldfairy', 'probe', 'perfect', 'misses', 'idea', 'back'].every(k => one(`select sh_is_prize(${q(k)})`) === 't'), 'each pays as many crowns as XP');
    // the Tooth Fairy: the first catch pays, a catch within the minute isn't one, a Golden one later pays its own once
    const fw0 = json(`sh_wallet('xp-TF')`), f1 = anonJson(`claim_fairy_v2('xh', 'xp-TF', false)`), fw1 = json(`sh_wallet('xp-TF')`);
    eq([f1.ok, f1.xp, f1.n, f1.src, fw1.prizes - fw0.prizes, f1.crowns], [true, 250, 1, 'fairy', 250, fw1.balance], 'the first Tooth Fairy: 250 XP and 250 crowns, and the reply carries the balance');
    eq([anonJson(`claim_fairy_v2('xh', 'xp-TF', true)`).xp, num(`select count(*) from egg_events where visitor_id = 'xp-TF'`)], [0, 1], 'a second catch within the minute isn\'t one');
    sql(`update egg_events set created_at = now() - interval '2 minutes' where visitor_id = 'xp-TF'`);
    const f2 = anonJson(`claim_fairy_v2('xh', 'xp-TF', true)`);
    eq([f2.xp, f2.n, f2.src, num(`select count(*) from egg_events where visitor_id = 'xp-TF' and qid = 'gold'`)], [500, 2, 'goldfairy', 1], 'the first Golden Tooth Fairy: 500, kept as gold');
    sql(`update egg_events set created_at = now() - interval '2 minutes' where visitor_id = 'xp-TF'`);
    eq([anonJson(`claim_fairy_v2('xh', 'xp-TF', true)`).xp, anon(`select record_fairy('xh', 'xp-TF')`)[0][0]], [0, '3'], 'a third catch, Golden or not, pays nothing; the old call still counts (a minute apart)');
    eq(Number(anon(`select record_fairy('xh', 'xp-TF2')`)[0][0]), 1, 'the old call (a cached page) counts the catch');
    eq(num(`select sum(base) from xp_awards where visitor_id = 'xp-TF2' and key = 'fairy' and src = 'fairy' and xp = base`), 250, 'and pays the first one too, never boosted');
    // the Golden Probe: the day's first claim on a hub pays, the second person nothing; the old call pays too
    const g1 = anonJson(`claim_golden_probe_v2('xh', 'xp-GP', 'x3')`), g2 = anonJson(`claim_golden_probe_v2('xh', 'xp-GP2', 'x3')`);
    eq([g1.first, g1.xp, g1.src, g2.first, g2.xp], [true, 300, 'probe', false, 0], 'the Golden Probe: the first in the class wins 300, the next nothing');
    eq([anon(`select claim_golden_probe('xm', 'xp-GP2', 'old1')`)[0][0], num(`select count(*) from xp_awards where visitor_id = 'xp-GP2' and key like 'probe:xm:%' and base = 300`)], ['t', 1], 'the old call (a cached page) wins and pays');
    eq(anonJson(`claim_golden_probe_v2('Bad Hub', 'xp-GP', 'x3')`).error, 'bad', 'a bad hub is refused');
    // a perfect mock: 20 questions, every one right, pays 750 once per hub; one with a miss, or cut short, doesn't
    anon(`select admin_load_question_keys(${S}, 'xq', ${q(JSON.stringify(Array.from({ length: 24 }, (_, i) => ({ id: 'y' + (i + 1), kind: 'one', answer: [1] }))))}::jsonb)`);
    const pm = one(`select sh_session_start(${T(0)}, 'xp-PM', 'xq', 'mock', null)`);
    for (let i = 0; i < 20; i++) ans('xp-PM', 'y' + (i + 1), { hub: 'xq', choice: 1, ctx: 'mock', session: pm, at: 60 + i * 0.1 });
    const pf = json(`sh_session_finish(${T(70)}, 'xp-PM', ${q(pm)}::uuid, null, 20)`);
    eq([pf.answers, pf.correct, pf.perfect], [20, 20, 750], 'twenty right of twenty: a perfect mock, 750');
    const pm2 = one(`select sh_session_start(${T(DAY)}, 'xp-PM', 'xq', 'mock', null)`);
    for (let i = 0; i < 20; i++) ans('xp-PM', 'y' + (i + 1), { hub: 'xq', choice: 1, ctx: 'mock', session: pm2, at: DAY + 60 + i * 0.1 });
    eq(json(`sh_session_finish(${T(DAY + 70)}, 'xp-PM', ${q(pm2)}::uuid, null, 20)`).perfect, 0, 'a second perfect mock in the same hub pays nothing');
    const pm3 = one(`select sh_session_start(${T(0)}, 'xp-PM3', 'xq', 'mock', null)`);
    for (let i = 0; i < 20; i++) ans('xp-PM3', 'y' + (i + 1), { hub: 'xq', choice: 1, ctx: 'mock', session: pm3, at: 60 + i * 0.1 });
    eq(json(`sh_session_finish(${T(70)}, 'xp-PM3', ${q(pm3)}::uuid, null, 40)`).perfect, 0, 'twenty right of a forty-question mock left unfinished: not perfect');
    const pm4 = one(`select sh_session_start(${T(0)}, 'xp-PM4', 'xq', 'mock', null)`);
    for (let i = 0; i < 20; i++) ans('xp-PM4', 'y' + (i + 1), { hub: 'xq', choice: i === 7 ? 0 : 1, ctx: 'mock', session: pm4, at: 60 + i * 0.1 });
    eq(json(`sh_session_finish(${T(70)}, 'xp-PM4', ${q(pm4)}::uuid, null, 20)`).perfect, 0, 'one miss: not perfect');
    eq(num(`select count(*) from xp_awards where key = 'perfect:xq' and xp = 750`), 1, 'one perfect-mock prize, never boosted');
    // the first day back after 7 or more days without studying: 200, once that day; 6 days away isn't a week
    ans('xp-BK', 'x1', { choice: 1, at: 0 });
    const bk6 = ans('xp-BK', 'x2', { choice: 1, at: 7 * DAY });
    ok(!bk6.bonus.some(b => b.src === 'back'), 'back after 6 days away: no prize');
    const bk = ans('xp-BK', 'x3', { choice: 1, at: 15 * DAY }), bk2 = ans('xp-BK', 'x4', { choice: 1, at: 15 * DAY + 60 });
    ok(bk.bonus.some(b => b.src === 'back' && b.xp === 200 && b.n === 7) && !bk2.bonus.some(b => b.src === 'back'), `back after 7 days away: 200 on the day's first answer, not the second (${JSON.stringify(bk.bonus)})`);
    ok(!ans('xp-BK2', 'x1', { choice: 1, at: 0 }).bonus.some(b => b.src === 'back'), 'a first day ever isn\'t a day back');
    // yesterday's misses all right (claim_misses_v2 reads the real clock): 3 missed yesterday, all right today
    const yday = `((date_trunc('day', now() at time zone 'America/Chicago') - interval '12 hours') at time zone 'America/Chicago')`;
    sql(`insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values
           ('xp-YM', 'xh', 'x1', false, ${yday}), ('xp-YM', 'xh', 'x2', false, ${yday}), ('xp-YM', 'xh', 'x3', false, ${yday}), ('xp-YM', 'xh', 'x4', true, ${yday}),
           ('xp-YM', 'xh', 'x1', true, now()), ('xp-YM', 'xh', 'x2', true, now());
         insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values ('xp-YM2', 'xh', 'x1', false, ${yday}), ('xp-YM2', 'xh', 'x2', false, ${yday}), ('xp-YM2', 'xh', 'x1', true, now()), ('xp-YM2', 'xh', 'x2', true, now());`);
    const ym = anonJson(`claim_misses_v2('xp-YM', 'xh')`);
    eq([ym.ok, ym.n, ym.left, ym.xp], [true, 3, 1, 0], 'one of yesterday\'s three misses still to do: nothing yet');
    sql(`insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values ('xp-YM', 'xh', 'x3', false, now()), ('xp-YM', 'xh', 'x3', true, now())`);
    const ym2 = anonJson(`claim_misses_v2('xp-YM', 'xh')`);
    eq([ym2.left, ym2.xp, ym2.src, anonJson(`claim_misses_v2('xp-YM', 'xh')`).xp], [0, 100, 'misses', 0], 'all three right today (one after a miss): 100, once');
    eq(anonJson(`claim_misses_v2('xp-YM2', 'xh')`).xp, 0, 'two misses yesterday: too few for the prize');
    eq(anonJson(`claim_misses_v2('xp-YM', 'Bad Hub')`).error, 'bad', 'a bad hub is refused');
    // an idea shipped pays its author (section 8 shipped 'Study rooms', posted by idea-vis-1); again pays nothing
    const iid = num(`select id from ideas where title = 'Study rooms'`);
    eq(num(`select count(*) from xp_awards where visitor_id = 'idea-vis-1' and key = 'idea:' || ${iid} and src = 'idea' and base = 500`), 1, 'the author of a shipped idea: 500');
    eq(anonJson(`admin_set_idea(${S}, ${iid}, 'status', 'shipped', 'Live now, really')`).paid, 0, 'shipped again: nothing more');
    // the back pay (section 4 of the migration), run twice: the first fairy, every probe won, each hub's first perfect mock,
    // to the primary id of a linked device; nothing twice
    sql(`insert into egg_events (kind, hub, visitor_id, created_at) values ('fairy', 'xh', 'xp-BF', now() - interval '9 days'), ('fairy', 'xh', 'xp-BF', now() - interval '8 days');
         insert into visitor_links (alias_id, primary_id) values ('xp-BFa', 'xp-BFp');
         insert into egg_events (kind, hub, visitor_id, qid, day, created_at) values ('golden', 'xz', 'xp-BFa', 'q1', current_date - 5, now() - interval '5 days'), ('golden', 'xz', 'xp-BFa', 'q1', current_date - 4, now() - interval '4 days');
         insert into mock_scores (visitor_id, hub, correct, total) values ('xp-BM', 'xh', 25, 25), ('xp-BM', 'xh', 30, 30), ('xp-BM', 'xm', 19, 19), ('xp-BM', 'xv', 24, 25);`);
    const back = fs.readFileSync(path.join(ROOT, 'migration_v92.sql'), 'utf8').split('4. back pay')[1];
    ok(back && back.includes('sh_award'), 'the migration has its back pay section');
    sql(back.slice(back.indexOf('\n'))); sql(back.slice(back.indexOf('\n')));
    eq([num(`select count(*) from xp_awards where visitor_id = 'xp-BF' and src = 'fairy'`), num(`select count(*) from xp_awards where visitor_id = 'xp-BFp' and src = 'probe'`),
        num(`select count(*) from xp_awards where visitor_id = 'xp-BFa'`), num(`select count(*) from xp_awards where visitor_id = 'xp-BM' and src = 'perfect'`),
        num(`select count(*) from xp_awards where visitor_id = 'xp-TF' and src = 'fairy'`)], [1, 2, 0, 1, 1],
      'back pay: one fairy, both probes (to the primary id), one perfect mock (20+, all right), nothing twice or again for someone paid live');
    eq(num(`select xp from xp_visitors where visitor_id = 'xp-BF'`), 250, 'the back pay is XP too');
    notes.push('more ways to earn crowns (migration_v92): the first Tooth Fairy and the first Golden one, a Golden Probe won, a perfect mock, yesterday\'s misses all right, an idea shipped, a day back after a week away, and the back pay, each once');
  }

  /* ---------- 14b. the awards' running totals (migration_v79): after everything above (answers, mocks, medals, cards,
     boosts, the rebuilds, Link my devices, deleted awards), each student's totals by kind are the sums of their awards ---------- */
  eq(rows(`select coalesce(a.visitor_id, t.visitor_id) as v, coalesce(a.src, t.src) as src, a.n as an, t.n as tn, a.base as ab, t.base as tb, a.xp as ax, t.xp as tx
           from (select visitor_id, src, count(*)::int n, sum(base)::int base, sum(xp)::int xp from xp_awards group by 1, 2) a
           full join (select * from xp_award_totals where n <> 0 or base <> 0 or xp <> 0) t using (visitor_id, src)
           where a.n is distinct from t.n or a.base is distinct from t.base or a.xp is distinct from t.xp`), [],
     'every running total equals the sum of its awards');
  notes.push(`the awards' running totals (migration_v79): ${num(`select count(*) from xp_award_totals`)} totals for ${num(`select count(*) from xp_awards`)} awards, all equal to the sums`);

  /* ---------- 14c. fewer calls from the page (migration_v82, the database optimization pass, phase 2) ---------- */
  if (one(`select to_regproc('public.get_class_numbers')`)) {
    // a card's class numbers in one call: the rows the two REST reads returned
    const cq = rows(`select distinct qid from question_stats where hub = 'xh' order by qid`).map(r => r.qid);
    const qa = `array[${cq.map(q).join(',') || "''"}]::text[]`;
    const cn = anonJson(`get_class_numbers('xh', ${qa}, ${qa})`);
    const byQ = a => JSON.stringify((a || []).map(r => 'choice' in r ? [r.qid, r.choice, r.picks] : [r.qid, r.attempts, r.correct]).sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)));
    ok(cq.length > 2 && byQ(cn.stats) === byQ(anonJson(`(select coalesce(json_agg(x), '[]') from (select qid, attempts, correct from question_stats where hub = 'xh' and qid = any(${qa})) x)`))
      && byQ(cn.choices) === byQ(anonJson(`(select coalesce(json_agg(x), '[]') from (select qid, choice, picks from question_choices where hub = 'xh' and qid = any(${qa})) x)`)),
      `get_class_numbers gives the rows question_stats and question_choices give (${cq.length} questions, ${(cn.choices || []).length} choice rows)`);
    eq(anonJson(`get_class_numbers('xh', ${qa}, null)`).choices, [], 'no choice questions asked, no choice rows');
    eq([anonJson(`get_class_numbers('Bad Hub', ${qa}, ${qa})`), anonJson(`get_class_numbers('xh', array(select 'q' || g from generate_series(1, 1001) g), null)`)].map(r => [r.stats, r.choices]),
      [[[], []], [[], []]], 'a bad hub or more than 1,000 questions gets nothing');
    // the three analytics batches in one call: the same rows as the three calls
    const QH = `'[{"q":"x1","v":"a1","k":"a","ms":4200,"ok":"1","n":1},{"q":"x2","k":"v","ms":900}]'::jsonb`, CL = `'[{"s":"bank","t":"#next","n":3},{"s":"notes","t":"tab=hy","n":1}]'::jsonb`, EV = `'[{"k":"view","n":1},{"k":"egg:timmy","n":2}]'::jsonb`;
    const tally = h => [`select count(*) from question_events where hub = '${h}'`, `select coalesce(sum(clicks), 0) from ui_clicks where hub = '${h}'`, `select coalesce(sum(n), 0) from feature_events where hub = '${h}'`, `select count(*) from ui_click_reach where hub = '${h}'`].map(num);
    anon(`select record_analytics('xa-one', 'xp-analytics-1', 'visit-an-1', ${QH}, ${CL}, ${EV})`);
    anon(`select record_qh('xa-three', 'xp-analytics-1', 'visit-an-1', ${QH}); select record_clicks('xa-three', 'xp-analytics-1', ${CL}); select record_events('xa-three', 'xp-analytics-1', ${EV})`);
    const t1 = tally('xa-one'), t3 = tally('xa-three');
    ok(t1.every(x => x > 0) && JSON.stringify(t1) === JSON.stringify(t3), `record_analytics writes what record_qh, record_clicks and record_events write (${JSON.stringify(t1)} / ${JSON.stringify(t3)})`);
    anon(`select record_analytics('xa-one', 'xp-analytics-1', null, null, ${CL}, '[]'::jsonb)`);
    ok(num(`select coalesce(sum(clicks), 0) from ui_clicks where hub = 'xa-one'`) === 8 && num(`select coalesce(sum(n), 0) from feature_events where hub = 'xa-one'`) === 3, 'one part alone (the dashboard: clicks and events, no question health)');
    anon(`select record_analytics('xa-one', 'xp-analytics-1', 'visit-an-1', '{"bad":1}'::jsonb, '"x"'::jsonb, null)`);
    ok(true, 'parts that aren\'t arrays are skipped without an error');
    // the shop's day, stored once for everyone: the same as working it out, cleared when the items change
    const TODAY = `(now() at time zone 'America/Chicago')::date`;
    one(`select sh_shop_days_fill()`);
    const same = d => one(`select (select coalesce(json_agg(x), '[]') from (select * from sh_shop_day(${d})) x)::text = (select coalesce(json_agg(x), '[]') from (select * from sh_shop_day_make(${d})) x)::text`) === 't';
    ok(num(`select count(distinct day) from shop_days`) === 2 && same(TODAY) && same(`${TODAY} + 1`), 'today and tomorrow are stored, the same picks in the same order as worked out');
    ok(same(`'2030-06-02'`), 'a day not stored is worked out as before');
    sql(`update shop_items set price = price where id = 'apple'`);
    eq(num(`select count(*) from shop_days`), 0, 'a change to the shop\'s items clears what is stored');
    eq(num(`select sh_shop_days_fill()`), 2, 'and the next fill stores today and tomorrow again');
    eq(num(`select sh_shop_days_fill()`), 0, 'a fill with both stored stores nothing');
    raises(() => anon(`select count(*) from public.shop_days`), '42501', 'anon reads shop_days directly');
    for (const f of [`sh_shop_day_make(current_date)`, `sh_shop_days_fill()`, `sh_shop_day(current_date)`]) raises(() => anon(`select ${f}`), '42501', `anon runs ${f.split('(')[0]}`);
    // the bootstrap: v1's keys with v1's values, then v2's own parts
    const drop = (o, ks) => { const c = Object.assign({}, o); ks.forEach(k => delete c[k]); return c; };
    for (const [v, h] of [['xp-B', 'xh'], ['xp-L1', 'xm'], ['xp-none', 'xh']]) {
      const b1 = json(`get_widget_bootstrap(${q(v)}, ${q(h)})`), b2 = json(`get_widget_bootstrap_v2(${q(v)}, ${q(h)})`);
      eq(Object.keys(b2).sort(), Object.keys(b1).concat(['shop', 'answers_id', 'answers_n', 'answers_part', 'name_custom']).filter((k, i, a) => a.indexOf(k) === i).sort(), `the bootstrap v2 for ${v} has v1's keys and the shop`);
      eq(JSON.stringify(drop(b2, ['rank', 'pet_days', 'inbox', 'shop', 'answers_id', 'answers_n', 'answers_part', 'name_custom'])), JSON.stringify(drop(b1, ['rank', 'pet_days', 'inbox'])), `the bootstrap v2 for ${v}: v1's parts, the same values`);
      // migration_v94: whether the name is one someone picked (visitor_names), so a linked device can drop its copy
      eq(b2.name_custom, num(`select count(*) from visitor_names where visitor_id = ${q(v)}`) > 0, `the bootstrap v2 for ${v} says whether its name was picked`);
      eq([b2.rank, b2.pet_days, b2.inbox], [json(`get_rank_profile_v2(${q(v)})`), json(`coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days_v2(${q(v)}) pd), '[]'::jsonb)`),
        json(`coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox_v2(${q(v)}) i), '[]'::jsonb)`)], `the bootstrap v2 for ${v}: the v2 rank, Timmy's days and Inbox`);
    }
    // v94: a name picked, then "Go back to a random name": the linked device reads name_custom false and the random name
    anon(`select set_display_name('xp-NC', 'Count Plaqula')`);
    eq(json(`get_widget_bootstrap_v2('xp-NC', 'xh')->'name_custom'`), true, 'a picked name: name_custom true');
    anon(`select clear_display_name('xp-NC')`);
    const nc = json(`get_widget_bootstrap_v2('xp-NC', 'xh')`);
    eq([nc.name_custom, nc.display_name], [false, json(`to_jsonb(anon_name('xp-NC'))`)], 'back to a random name: name_custom false, with the random name');
    // v84: the answers after the device's newest, and the bootstrap with the device's cursor
    {
      const all = json(`get_my_answers_since('xp-B', 'xh')`), cut = Math.max(0, all.answers.length - 3);
      eq([all.answers_part, JSON.stringify(all.answers)], [false, JSON.stringify(json(`get_my_answers('xp-B', 'xh')`))], 'get_my_answers_since without a cursor: get_my_answers, with the newest id and the count');
      const idCut = num(`select coalesce(max(id), 0) from (select id from personal_answers where visitor_id = 'xp-B' and hub = 'xh' order by id limit ${cut}) x`);
      const part = json(`get_my_answers_since('xp-B', 'xh', ${idCut}, ${cut})`);
      ok(part.answers_part === true && part.answers.length === all.answers_n - cut && part.answers_id === all.answers_id, `get_my_answers_since after the device's newest: only the ${all.answers_n - cut} after it`);
      eq(json(`get_my_answers_since('xp-B', 'xh', ${idCut}, ${cut + 1})`).answers_part, false, 'get_my_answers_since when the count doesn\'t add up (a link moved answers in): the whole history');
      const bc = json(`get_widget_bootstrap_v2('xp-B', 'xh', p_answers_after => ${all.answers_id}, p_answers_n => ${all.answers_n})`);
      eq([bc.answers_part, bc.answers.length, bc.answers_id], [true, 0, all.answers_id], 'the bootstrap with the device\'s cursor: no answers, the same id');
      raises(() => anon(`select sh_answers_since('xp-B', 'xh', 0, 0)`), '42501', 'anon runs sh_answers_since');
    }
    // get_my_answers: each answer as [question, seconds, right], oldest first, the newest 5,000
    const ga = json(`get_my_answers('xp-B', 'xh')`), want = json(`(select coalesce(json_agg(json_build_array(qid, t, c) order by t, id), '[]') from (select a.id, a.qid, floor(extract(epoch from a.answered_at))::bigint as t, case when a.correct then 1 else 0 end as c from personal_answers a where a.visitor_id = 'xp-B' and a.hub = 'xh' order by a.answered_at desc, a.id desc limit 5000) x)`);
    ok(ga.length > 0 && JSON.stringify(ga) === JSON.stringify(want), `get_my_answers: ${ga.length} answers as [question, seconds, right]`);
    eq([json(`get_my_answers(null, 'xh')`), json(`get_my_answers('xp-B', '')`)], [[], []], 'get_my_answers without a visitor or a hub: nothing');
    // the class name: an index on its base, the same name everywhere it's shown
    eq(num(`select count(*) from pg_indexes where indexname = 'correct_streaks_anon_base'`), 1, 'correct_streaks_anon_base is there');
    sql(`create function public.zz_anon_name_old(p_visitor_id text) returns text language sql stable set search_path = public as $f$
      with me as (select anon_name_base(p_visitor_id) as base, first_seen(p_visitor_id) as since)
      select me.base || case when exists (select 1 from correct_streaks c where c.visitor_id <> p_visitor_id and anon_name_base(c.visitor_id) = me.base
        and first_seen(c.visitor_id) is not null and (me.since is null or first_seen(c.visitor_id) < me.since
        or (first_seen(c.visitor_id) = me.since and c.visitor_id < p_visitor_id))) then ' ' || (10 + abs(hashtext(p_visitor_id || ':n')) % 90)::text else '' end from me; $f$`);
    const twin = sql(`with g as (select 'xp-NC-' || i as v, anon_name_base('xp-NC-' || i) as b from generate_series(1, 3000) i) select x.v, y.v from g x join g y on x.b = y.b and x.v < y.v order by 1, 2 limit 1`)[0];
    sql(`insert into correct_streaks (visitor_id) values (${q(twin[0])}), (${q(twin[1])}) on conflict do nothing;
         insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values (${q(twin[1])}, 'xn', 'n1', true, ${T(-DAY)}), (${q(twin[0])}, 'xn', 'n1', true, ${T(-DAY + 60)})`);
    const nm = rows(`select v, anon_name(v) as a, zz_anon_name_old(v) as b from (select visitor_id as v from correct_streaks union select 'xp-nobody') x`);
    const tw = nm.filter(r => r.v === twin[0] || r.v === twin[1]);
    ok(nm.length > 20 && nm.every(r => r.a === r.b) && tw.length === 2 && tw.find(r => r.v === twin[1]).a.split(' ').length === 2 && tw.find(r => r.v === twin[0]).a.split(' ').length === 3,
      `anon_name gives the names it gave (${nm.length} visitors, ${nm.filter(r => r.a !== r.b).length} differ; two sharing a name: the first keeps it plain, the later gets a number)`);
    sql(`drop function public.zz_anon_name_old(text)`);
    notes.push('fewer calls (migration_v82): class numbers in one call, the analytics in one call, the shop\'s day stored, the bootstrap built once, the answers, the class name by lookup');
  }

  /* ---------- 15. the private parts stay private ---------- */
  for (const t of ['xp_awards', 'xp_award_totals', 'xp_boosts', 'xp_sessions', 'answer_xp', 'question_keys', 'game_baseline', 'pet_purchases', 'pet_inventory', 'pet_equipped', 'ideas', 'idea_votes', 'shop_items', 'visit_secret', 'card_reviews'])
    raises(() => anon(`select count(*) from public.${t}`), '42501', `anon reads ${t} directly`);
  raises(() => anon(`update public.visit_secret set secret = 'x'`), '42501', 'anon writes visit_secret directly');
  for (const f of [`sh_answer(null, 'x', 'xh', 'x1', 1, null, null, null, null, null, null, null)`, `sh_award('x', 'k', 'report', 'xh', 100, 1, now())`,
    `sh_xp_replay(array['x'])`, `sh_wallet('xp-B')`, `sh_session_start(null, 'x', 'xh', 'mock', null)`, `sh_pod_minute(null, 'x', 'xh', 'ep1', 0)`,
    `sh_medal_check('x', 'xh', now())`, `sh_xp_mult('x', now())`, `sh_key('xh', 'x1', null)`,
    `sh_visit_key('xp-VS')`, `sh_card(null, 'x', 'xh', 'x1', 'good', false, null, null)`, `sh_owns('xp-B', 'castle')`, `sh_owned('xp-B')`, `sh_buy(null, 'xp-B', 'apple', 'buy-anon-0001')`, `sh_my_shop(null, 'xp-B')`, `sh_throwback_items(current_date)`])
    raises(() => anon(`select ${f}`), '42501', `anon runs ${f.split('(')[0]}`);
  eq([anon(`select sh_shop_seasons('2026-10-15')`)[0][0], anon(`select sh_is_throwback('2026-10-15') is not null`)[0][0], anon(`select cardinality(sh_throwback_days('2026-10-15'))`)[0][0]], ['{halloween,fall}', 't', '2'],
    'anon can ask which seasons are on sale and which days are throwback days (pure arithmetic on the calendar)');
} catch (e) {
  problems.push(`test run failed: ${e.message.split('\n').slice(0, 3).join(' | ')} (${(e.stack || '').split('\n').filter(l => /xp\.js:\d+/.test(l)).map(l => l.replace(/.*xp\.js:(\d+).*/, 'line $1')).join(' < ')})`.replace(/\s+\)$/, ')'));
}
db.stop();
notes.forEach(n => console.log('  ' + n));
console.log(`  ${checks} checks`);
if (problems.length) { console.error(`\n✗ XP and the game layer: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ XP and the game layer (migration_v54 on a throwaway copy) passed');
