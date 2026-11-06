#!/usr/bin/env node
// The game layer's server (migration_v54, vault/reference/game-server.md) on a throwaway PostgreSQL: supabase/schema.sql
// with made-up history first, then the migrations waiting for their release (supabase/pending-migrations.txt), as the
// release will run them. Made-up visitors only; nothing here touches the live database. Checks:
//   - today's rules stay: every XP total, rank profile, board and the 600-a-day cap are the same after the migration,
//     and record_personal_answer still pays as before;
//   - the 63-step ladder: the Handpiece is today's 21 steps exactly, then the ModuPro and the Loupes;
//   - question keys: loading needs the secret; the server decides right or wrong (one choice, select all, order, self
//     graded, a page's older version), and unknown or retired ids earn nothing;
//   - XP with no daily cap: 10 / 2 / 1, three paying right (and wrong) answers per question a day, the speed limit
//     (2 seconds, 30 a minute), and every source: a day studied, the 20th answer, a fixed miss, a finished mock, the
//     mastery medals and their double XP, Timmy Time minutes, a finished arcade game, a fixed report;
//   - a replayed call, a double tap and a linked device pay once, and the rebuild gives exactly what the live calls paid;
//   - Shiny Gold Crowns (from base XP, the grants since the switch, minus spending), the shop's rotation and seasons,
//     buy_item (a double tap, a replayed call, a balance too low, not on sale today, owned, one snack a day, boosts that
//     extend), equip_item, snack HP in Timmy's days, rare-costume sightings;
//   - the idea board: names, limits, votes, reports, statuses with Inbox notes, starter ideas, no visitor ids;
//   - the bootstrap with all of it, the Dark Matter unlock once per journey, and anon can't reach the private parts.
//   node tools/release/xp.js     (PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
'use strict';
const fs = require('fs'), path = require('path');
const { throwaway } = require('./pg');
const KEYS = require('../xp/keys');
const ROOT = path.resolve(__dirname, '../..');
const SECRET = 'xp-test-secret';
const problems = [], notes = [];
let checks = 0;
function ok(cond, what){ checks++; if (!cond) problems.push(what); return !!cond; }
function eq(got, want, what){ return ok(JSON.stringify(got) === JSON.stringify(want), `${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); }

const db = throwaway(SECRET, { pending: false }), { sql, q } = db;
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

  /* ====================================================== the release: the pending migrations */
  const applied = db.applyPending();
  notes.push(`applied ${applied.join(', ')} on top of supabase/schema.sql with made-up history`);

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
  const ret = ans('xp-V', 'v2', { hub: 'xv', choice: 0, at: 30, claim: true });
  ok(ret.kind === 'retired' && ret.xp === 0, `a retired id earns nothing (${JSON.stringify(ret)})`);
  // the real Occlusion bank through tools/xp/keys.js
  const occ = KEYS.keys('occlusion');
  const loaded = anonJson(`admin_load_question_keys(${S}, 'occlusion', ${q(JSON.stringify(occ))}::jsonb, true)`);
  ok(loaded.loaded === occ.filter(k => !k.retired).length && loaded.keys === loaded.loaded, `Occlusion's ${loaded.loaded} keys load from its content JSON (${JSON.stringify(loaded)})`);
  const oq = JSON.parse(fs.readFileSync(path.join(ROOT, 'hubs/occlusion/next/content/questions.json'), 'utf8'));
  const om = oq.find(x => x.type === 'mcq'), omu = oq.find(x => x.type === 'multi'), os = oq.find(x => x.type === 'sequence');
  eq(ans('xp-O', om.id, { hub: 'occlusion', choice: om.answer, v: KEYS.fp(KEYS.exported(om)), at: 0 }).xp, 10, 'an Occlusion question answered right with its version: 10 XP');
  eq(ans('xp-O', omu.id, { hub: 'occlusion', picks: omu.correct.slice().reverse(), at: 10 }).correct, true, 'an Occlusion select-all answered right in any order');
  eq(ans('xp-O', os.id, { hub: 'occlusion', picks: os.steps.map((s, i) => i), at: 20 }).correct, true, 'an Occlusion sequence in its right order');
  eq(ans('xp-O', os.id, { hub: 'occlusion', picks: os.steps.map((s, i) => i).reverse(), at: 30 }).correct, false, 'an Occlusion sequence out of order');
  notes.push(`keys: ${loaded.loaded} Occlusion keys from tools/xp/keys.js, versions, retired ids`);

  /* ---------- 4. answers, the per-question limit and the speed limit ---------- */
  const seq = [];
  const A = (qid, o, want, label) => { const r = ans('xp-A', qid, o); seq.push(r); eq(r.xp, want, label); return r; };
  A('x1', { choice: 1, at: 0 }, 10, 'first right answer: 10');
  eq(xpOf('xp-A'), 30, 'with the day studied: 20 + 10');
  A('x1', { choice: 1, at: 5 }, 2, 'second right answer that day: 2');
  A('x1', { choice: 1, at: 10 }, 2, 'third: 2');
  const r4 = A('x1', { choice: 1, at: 15 }, 0, 'fourth right answer that day: nothing');
  eq(r4.why, 'repeat', 'the fourth says why');
  const fast = A('x2', { choice: 1, at: 16 }, 0, 'an answer 1 second after the last: nothing');
  eq(fast.why, 'fast', 'it says why');
  ok(num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'x2'`) === 1 && num(`select attempts from question_stats where hub = 'xh' and qid = 'x2'`) >= 1, 'a fast answer still counts in your answers and the class stats');
  A('x3', { choice: 0, at: 20 }, 1, 'a wrong answer: 1');
  A('x3', { choice: 0, at: 25 }, 1, 'second wrong: 1');
  A('x3', { choice: 0, at: 30 }, 1, 'third wrong: 1');
  A('x3', { choice: 0, at: 35 }, 0, 'fourth wrong answer that day: nothing');
  A('x17', { picks: [2, 0], at: 40 }, 10, 'select all, right in any order: 10');
  A('x17', { picks: [0], at: 45 }, 1, 'select all, one missing: wrong');
  A('x18', { picks: [0, 1, 2], at: 50 }, 10, 'put in order, right: 10');
  A('x18', { picks: [1, 0, 2], at: 55 }, 1, 'put in order, wrong: 1');
  A('x19', { self: true, at: 60 }, 2, 'self graded: a flat 2');
  A('x19', { self: false, at: 65 }, 2, 'self graded, missed: 2');
  A('x19', { self: true, at: 70 }, 2, 'self graded, third: 2');
  A('x19', { self: true, at: 75 }, 0, 'self graded, fourth that day: nothing');
  const unk = ans('xp-A', 'nope', { choice: 1, claim: true, at: 80 });
  ok(unk.kind === 'unknown' && unk.xp === 0 && unk.correct === true, `an unknown id earns nothing, recorded with the page's verdict (${JSON.stringify(unk)})`);
  ok(num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'nope'`) === 1, 'an unknown id is still recorded');
  const bad = ans('xp-A', 'x4', { choice: 25, at: 85 });
  ok(bad.ok === false && num(`select count(*) from personal_answers where visitor_id = 'xp-A' and qid = 'x4'`) === 0, 'a choice out of range is refused and records nothing');
  A('x1', { choice: 1, at: DAY }, 2, 'the next day, a question already right before: 2');
  ok(xpOf('xp-A') === 20 + 10 + 2 + 2 + 3 + 10 + 1 + 10 + 1 + 6 + 20 + 2, `A's total: two days studied plus every answer (${xpOf('xp-A')})`);
  // thirty a minute: 31 answers exactly 2 seconds apart; the 31st is the 31st in 60 seconds
  const w = [];
  for (let i = 0; i < 31; i++) w.push(ans('xp-W', 'x' + (1 + (i % 16)), { choice: 1, at: i * 2 }).xp);
  ok(w.slice(0, 30).every(x => x > 0) && w[30] === 0, `the 31st answer in a minute earns nothing (${w.slice(28).join(',')})`);
  eq(ans('xp-W', 'x5', { choice: 1, at: 62 }).xp, 0, 'still 31 in the last minute two seconds later');
  ok(ans('xp-W', 'x6', { choice: 1, at: 95 }).xp > 0, 'pays again once the minute has room');
  notes.push('answers: 10 / 2 / 1, three a day each way, self graded 2, unknown and retired 0, 2 seconds and 30 a minute');

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
  // a fixed miss
  ans('xp-F', 'x5', { choice: 0, at: 0 });
  ok(ans('xp-F', 'x5', { choice: 1, at: DAY }).bonus.some(b => b.src === 'fix' && b.xp === 5), 'missed yesterday, right today: +5');
  ans('xp-F', 'x5', { choice: 0, at: 2 * DAY });
  ok(!ans('xp-F', 'x5', { choice: 1, at: 3 * DAY }).bonus.length, 'the same question fixed again: once per question');
  ans('xp-F', 'x6', { choice: 0, at: 3 * DAY + 10 });
  ok(!ans('xp-F', 'x6', { choice: 1, at: 3 * DAY + 20 }).bonus.length, 'missed and fixed the same day: no fix bonus');
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
  const mk2 = []; for (let i = 0; i < 12; i++) mk2.push(ans('xp-M', 'x' + (i + 1), { choice: 1, ctx: 'mock', session: m2, at: 110 + i * 0.1 }).xp);
  ok(mk2.slice(0, 5).every(x => x > 0) && mk2.slice(5).every(x => x === 0), `a mock sent in after 10 seconds: only its first 5 answers pay (${mk2.join(',')})`);
  eq(json(`sh_session_finish(${T(120)}, 'xp-M', ${q(m2)}::uuid, null, null)`).xp, 0, 'a second mock in the same hub that day: no second +50');
  const m3 = one(`select sh_session_start(${T(0)}, 'xp-M3', 'xh', 'mock', null)`);
  for (let i = 0; i < 5; i++) ans('xp-M3', 'x' + (i + 1), { choice: 1, ctx: 'mock', session: m3, at: 60 + i });
  eq(json(`sh_session_finish(${T(70)}, 'xp-M3', ${q(m3)}::uuid, null, null)`).xp, 0, 'a mock with fewer than 10 answers: no +50');
  ok(ans('xp-M4', 'x1', { choice: 1, ctx: 'mock', session: m1, at: 200 }).xp === 10 && ans('xp-M4', 'x2', { choice: 1, ctx: 'mock', session: m1, at: 200.1 }).xp === 0,
    'someone else\'s mock gives no mock timing: the usual speed limit');
  // hub mastery medals and their double XP (hub xm: 10 counted questions and one review-only)
  const md = [];
  for (let i = 1; i <= 10; i++) md.push(ans('xp-D', 'm' + i, { hub: 'xm', choice: 0, at: i * 10 }));
  ok(md[4].medal && md[4].medal.kind === 'mastery-bronze' && md[4].medal.xp === 100, `50% of the bank right: Bronze, +100 (${JSON.stringify(md[4].medal)})`);
  ok(md[5].mult === 2 && md[5].xp === 20, `the next answer is double XP (${md[5].mult}x, ${md[5].xp})`);
  ok(md[7].medal && md[7].medal.kind === 'mastery-silver' && md[7].mult === 2 && md[8].mult === 2, 'Silver during the boost: still 2x, never more');
  ok(md[8].medal && md[8].medal.kind === 'mastery-gold' && md[9].medal && md[9].medal.kind === 'mastery-crown' && md[9].medal.xp === 500, 'Gold at 90%, the Crown at 100% (+500)');
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
  ok(d2[4].medal && d2[4].medal.xp === 100, 'a Bronze recorded by today\'s page after the switch is paid when it\'s reached');
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
  notes.push('sources: the 20th answer, a fixed miss, mocks, medals with double XP (no back pay), Timmy Time, the arcade, fixed reports');

  /* ---------- 7. the rebuild gives what the live calls paid ---------- */
  const ids = ['xp-A', 'xp-W', 'xp-R', 'xp-G', 'xp-F', 'xp-M', 'xp-M3', 'xp-M4', 'xp-D', 'xp-D2', 'xp-P', 'xp-Q', 'xp-V', 'xp-O', 'xp-L1'];
  const arr = `array[${ids.map(q).join(',')}]`;
  const live = rows(`select visitor_id, key, xp, base from xp_awards where visitor_id = any(${arr}) and src in ('answer','goal20','fix') order by 1, 2`);
  const replay = rows(`select visitor_id, key, xp, base from sh_xp_replay(${arr}) order by 1, 2`);
  eq(replay, live, `the replay matches every live answer, goal and fix award (${live.length} rows)`);
  const xpLive = rows(`select visitor_id, xp, days, answers, correct from xp_visitors where visitor_id = any(${arr}) order by 1`);
  sql(`select sh_xp_rebuild(${arr})`);
  eq(rows(`select visitor_id, xp, days, answers, correct from xp_visitors where visitor_id = any(${arr}) order by 1`), xpLive, 'the rebuild gives every total the live calls gave');
  notes.push(`rebuild = live: ${live.length} replayed awards over ${ids.length} visitors`);

  /* ---------- 8. Link my devices ---------- */
  ans('xp-K', 'x7', { choice: 1, at: 0 });
  ans('xp-K2', 'x7', { choice: 1, at: 100 });
  json(`sh_pod_minute(${T(0)}, 'xp-K', 'xh', 'ep1', 0)`); json(`sh_pod_minute(${T(200)}, 'xp-K2', 'xh', 'ep1', 0)`);
  const k1 = one(`select sh_session_start(${T(0)}, 'xp-K', 'xh', 'arcade', 'board')`), k2 = one(`select sh_session_start(${T(300)}, 'xp-K2', 'xh', 'arcade', 'board')`);
  json(`sh_session_finish(${T(40)}, 'xp-K', ${q(k1)}::uuid, null, null)`); json(`sh_session_finish(${T(340)}, 'xp-K2', ${q(k2)}::uuid, null, null)`);
  award('xp-K2', 'rep:flag:9001', 10000);
  eq([xpOf('xp-K'), xpOf('xp-K2')], [20 + 10 + 10 + 50, 20 + 10 + 10 + 50 + 10000], 'two devices before linking');
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
  eq(xpOf('xp-K'), 20 + 10 + 2 + 10 + 50 + 10000, 'linked: the question first right once (10 + 2), the minute and the game once a day, the report kept');
  const kx = xpOf('xp-K'); sql(`select sh_xp_rebuild(array['xp-K'])`); eq(xpOf('xp-K'), kx, 'rebuilding again changes nothing');
  eq(rows(`select item_id from pet_inventory where visitor_id = 'xp-K' order by 1`).map(r => r.item_id), ['bow-tie', 'scrub-cap'], 'the inventories merge');
  eq(one(`select item_id from pet_equipped where visitor_id = 'xp-K' and slot = 'outfit'`), 'scrub-cap', 'what\'s equipped: the newer choice wins');
  eq(num(`select count(*) from pet_purchases where visitor_id = 'xp-K'`), 1, 'the spending moves');
  const kw = json(`sh_wallet('xp-K')`);
  eq(kw.spent, 100, 'the linked wallet counts the spending');
  ok(rows(`select costume from costume_log where visitor_id = 'xp-K'`).length === 1, 'the costume log moves');
  notes.push('Link my devices: awards, the inventory, what\'s equipped, spending and the costume log merge; the rebuild is stable');

  /* ---------- 9. Shiny Gold Crowns ---------- */
  const dw = json(`sh_wallet('xp-D')`), dExtra = num(`select sum(xp - base) from xp_awards where visitor_id = 'xp-D'`);
  ok(dExtra > 0 && dw.from_xp === Math.floor((xpOf('xp-D') - dExtra) / 10), `gold crowns from base XP only: a boost's extra earns none (${dw.from_xp}, extra ${dExtra})`);
  eq([dw.medals, dw.trophies], [4, 0], 'four medals since the switch');
  eq(dw.earned, dw.from_xp + 4 * 50 + 20 * dw.rankups, 'earned = base XP / 10 + 50 a medal + 20 a rank-up');
  const lw = json(`sh_wallet('xp-L1')`);
  ok(lw.from_xp === Math.floor(xpOf('xp-L1') / 10) && lw.medals === 0 && lw.trophies === 0 && lw.rankups === 0, `back pay: L1's XP from before the switch counts, its old medal and trophy don't (${JSON.stringify(lw)})`);
  award('xp-U', 'rep:flag:9002', 1300);
  anon(`select record_achievement('xp-U', 'owl', '')`);
  const uw = json(`sh_wallet('xp-U')`);
  ok(uw.rankups === 2 && uw.trophies === 1 && uw.earned === Math.floor(xpOf('xp-U') / 10) + 2 * 20 + 25, `rank-ups and trophies since the switch: +20 and +25 each (${JSON.stringify(uw)})`);

  /* ---------- 10. the shop ---------- */
  // seasons: in step with holidayId() and isFall() in widget/pet.js, every day of three years
  const petSrc = fs.readFileSync(path.join(ROOT, 'widget/pet.js'), 'utf8');
  const grab = name => { const i = petSrc.indexOf('function ' + name + '('); let j = petSrc.indexOf('{', i), depth = 0, k = j; for (; k < petSrc.length; k++) { if (petSrc[k] === '{') depth++; else if (petSrc[k] === '}' && --depth === 0) break; } return petSrc.slice(i, k + 1); };
  const jsSeason = new Function('day', 'var window = {}, ls = function(){ return null; }, centralDay = function(){ return day; };\n' + grab('holidayId') + '\n' + grab('isFall') + '\nreturn [holidayId() || null, isFall()];');
  const sqlSeasons = rows(`select to_char(d, 'YYYY-MM-DD') as d, sh_season(d::date) as s, sh_is_fall(d::date) as f from generate_series('2026-01-01'::date, '2028-12-31'::date, interval '1 day') d`);
  const off = sqlSeasons.filter(r => { const [s, f] = jsSeason(r.d); return s !== r.s || f !== r.f; });
  ok(off.length === 0, `sh_season and sh_is_fall match widget/pet.js on every day of 2026-2028 (${off.length} differ${off.length ? ', first ' + JSON.stringify(off[0]) + ' vs ' + JSON.stringify(jsSeason(off[0].d)) : ''})`);
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
  eq(rows(`select item_id from sh_shop_day('${D0}') where shelf = 'season'`).length, 0, 'no seasonal items on a day without a season');
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
  // equip
  sql(`insert into pet_inventory (visitor_id, item_id) values ('xp-B', 'garden'), ('xp-B', 'castle'), ('xp-B', 'porch') on conflict do nothing`);
  eq(anonJson(`equip_item('xp-B', 'outfit', 'white-coat')`).error, 'not-owned', 'equipping something not owned');
  eq(anonJson(`equip_item('xp-B', 'home', 'garden')`).error, 'slot', 'a yard item can\'t be the home');
  ok(anonJson(`equip_item('xp-B', 'home', 'castle')`).equipped.home === 'castle', 'move into the castle');
  anon(`select equip_item('xp-B', 'yard-1', 'garden')`);
  const ey = anonJson(`equip_item('xp-B', 'yard-3', 'garden')`).equipped;
  ok(ey['yard-3'] === 'garden' && !ey['yard-1'], 'a yard item moves from one spot to another');
  ok(anonJson(`equip_item('xp-B', 'porch', 'porch')`).equipped.porch === 'porch' && anonJson(`equip_item('xp-B', 'chimney', 'porch')`).error === 'slot', 'an upgrade only in its own slot');
  ok(!('home' in anonJson(`equip_item('xp-B', 'home', null)`).equipped), 'back to the cottage');
  // rare costumes
  ok(anonJson(`record_costume_sighting('xp-B', 'pirate')`).first === true, 'a first sighting');
  ok(anonJson(`record_costume_sighting('xp-B', 'pirate')`).first === false, 'the same costume again');
  eq(anonJson(`record_costume_sighting('xp-B', 'chef')`).error, 'today', 'one new costume a day');
  eq(anonJson(`record_costume_sighting('xp-B', 'apple')`).error, 'bad', 'only costumes');
  ok(json(`get_my_shop('xp-B')`).items.some(i => i.id === 'pirate' && i.shelf === 'spotted'), 'a spotted costume is in that visitor\'s shop');
  ok(buy('xp-B', 'pirate', 'buy-b-0000011').ok && !json(`get_my_shop('xp-B')`).items.some(i => i.shelf === 'spotted'), 'bought, it leaves the Spotted shelf');
  ok(buy('xp-B3', 'pirate', 'buy-b3-000001').error !== undefined && buy('xp-B3', 'pirate', 'buy-b3-000001').error === 'not-today', 'someone who hasn\'t spotted it can\'t buy it');
  const gs = json(`get_my_shop('xp-B')`), g0 = json(`get_my_shop(null)`);
  ok(gs.wallet && gs.inventory.length >= 4 && gs.equipped['yard-3'] === 'garden' && gs.costumes.length === 1 && gs.snacks_today.length === 2 && gs.boost, 'get_my_shop has the wallet, things, what\'s equipped, costumes, today\'s snacks and the boost');
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
  vote('idea-vis-2', i3, 1);
  ok(anonJson(`delete_my_idea('idea-vis-1', ${i3})`) === true && !anonJson(`get_ideas(null, 'new', null, null)`).ideas.some(x => x.id === i3)
    && one(`select title || name || body from ideas where id = ${i3}`) === undefined && num(`select count(*) from idea_votes where idea_id = ${i3}`) === 0,
    'the author deletes their own: its words, name and votes go');
  ok(!anonJson(`(select coalesce(json_agg(x), '[]') from admin_ideas(${S}) x)`).some(x => x.id === i3) && anonJson(`admin_set_idea(${S}, ${i3}, 'restore')`).error === 'unknown',
    'Sam can\'t see or bring back an idea its author deleted');
  sql(`update ideas set created_at = created_at - interval '30 seconds' where visitor_id = 'idea-vis-1'`);
  eq(post('idea-vis-1', 'A fifth idea', '', null, 'other').error, 'limit', 'a deleted idea still counts toward the day\'s three');
  raises(() => anon(`select admin_post_starter_idea('wrong', 'Timmy Tooth', 'Study rooms', '', null, 'feature')`), '28000', 'a starter idea with a wrong secret');
  const si = num(`select admin_post_starter_idea(${S}, 'Number thirty-one', 'Build my own mock', 'Pick the lectures, how many and the time.', null, 'feature')`);
  const sn = anonJson(`get_ideas(null, 'new', null, null)`).ideas.find(x => x.id === si);
  ok(sn && sn.name === 'Number thirty-one' && sn.source === 'starter' && num(`select count(*) from ideas where id = ${si} and visitor_id is null`) === 1, 'a starter idea by Timmy\'s neighbor, with no visitor');
  notes.push('the idea board: names, limits, filters and counts, votes, reports, statuses with Inbox notes, starter ideas');

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

  /* ---------- 13. the private parts stay private ---------- */
  for (const t of ['xp_awards', 'xp_boosts', 'xp_sessions', 'answer_xp', 'question_keys', 'game_baseline', 'pet_purchases', 'pet_inventory', 'pet_equipped', 'ideas', 'idea_votes', 'shop_items'])
    raises(() => anon(`select count(*) from public.${t}`), '42501', `anon reads ${t} directly`);
  for (const f of [`sh_answer(null, 'x', 'xh', 'x1', 1, null, null, null, null, null, null, null)`, `sh_award('x', 'k', 'report', 'xh', 100, 1, now())`,
    `sh_xp_replay(array['x'])`, `sh_wallet('xp-B')`, `sh_session_start(null, 'x', 'xh', 'mock', null)`, `sh_pod_minute(null, 'x', 'xh', 'ep1', 0)`,
    `sh_medal_check('x', 'xh', now())`, `sh_xp_mult('x', now())`, `sh_key('xh', 'x1', null)`])
    raises(() => anon(`select ${f}`), '42501', `anon runs ${f.split('(')[0]}`);
} catch (e) {
  problems.push(`test run failed: ${e.message.split('\n').slice(0, 3).join(' | ')} (${(e.stack || '').split('\n').filter(l => /xp\.js:\d+/.test(l)).map(l => l.replace(/.*xp\.js:(\d+).*/, 'line $1')).join(' < ')})`.replace(/\s+\)$/, ')'));
}
db.stop();
notes.forEach(n => console.log('  ' + n));
console.log(`  ${checks} checks`);
if (problems.length) { console.error(`\n✗ XP and the game layer: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ XP and the game layer (migration_v54 on a throwaway copy) passed');
