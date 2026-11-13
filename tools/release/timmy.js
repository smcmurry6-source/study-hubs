#!/usr/bin/env node
// Ask Timmy's database half (migration_v55, vault/reference/ask-timmy.md) on a throwaway PostgreSQL: supabase/schema.sql,
// then the migrations waiting for their release (supabase/pending-migrations.txt). Made-up visitors only; nothing here
// touches the live database. Checks:
//   - timmy_begin and timmy_finish: input limits, a chat started and continued, the last 10 messages replayed with the exact
//     text sent and answered, someone else's chat never continued;
//   - the limits: one question at a time, 40 a person a Central day (an answer that failed doesn't count), the site's daily
//     spend with what's in flight held against it, the off switch;
//   - a retried send: the same answer back with no new call, a stalled one asked again after 2 minutes, someone else's
//     request id refused;
//   - "Ask Timmy" only sees a question's key when this visitor answered it;
//   - the students' calls read and change only their own rows (history, thumbs, offers, reports); a report from the chat
//     is a usual report (the admin Inbox shows it, the reply goes back), once an answer, ten a person a day;
//   - anon can't run the function's two calls or read the tables; the admin reads need the secret and carry no visitor id;
//   - Link my devices moves the chats.
//   node tools/release/timmy.js     (PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
'use strict';
const { throwaway } = require('./pg');
const SECRET = 'timmy-test-secret';
const problems = [], notes = [];
let checks = 0;
function ok(cond, what){ checks++; if (!cond) problems.push(what); return !!cond; }
function eq(got, want, what){ return ok(JSON.stringify(got) === JSON.stringify(want), `${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); }

const db = throwaway(SECRET), { sql, q } = db;
const one = t => (sql(t)[0] || [])[0];
const json = t => { const r = one(`select (${t})::text`); try { return JSON.parse(r); } catch (e) { throw new Error(`no JSON from ${t.slice(0, 120)}: ${r}`); } };
const as = (role, t) => sql(`begin; set local role ${role}; ${t}; commit;`);
const asJson = (role, t) => JSON.parse(as(role, `select (${t})::text`)[0][0]);
const rows = (role, t) => asJson(role, `(select coalesce(json_agg(x), '[]') from (${t}) x)`);
function raises(fn, code, what){
  try { fn(); ok(false, `${what}: expected an error${code ? ' ' + code : ''}, got none`); }
  catch (e) { ok(!code || e.code === code, `${what}: expected ${code}, got ${e.code || e.message.split('\n')[0]}`); }
}
const S = q(SECRET);
let req = 0;
function begin(v, o){
  o = o || {};
  return asJson('service_role', `timmy_begin(${q(v)}, ${q(o.hub || 'th')}, ${o.chat ? q(o.chat) + '::uuid' : 'null'}, ${q(o.text == null ? 'What is CAL?' : o.text)},
    ${o.context === undefined ? `'{"view":"compendium/notes"}'::jsonb` : o.context === null ? 'null' : q(JSON.stringify(o.context)) + '::jsonb'},
    ${o.request === null ? 'null' : q(o.request || 'req-' + String(++req).padStart(6, '0'))}, ${o.qid ? q(o.qid) : 'null'})`);
}
function finish(mid, o){
  o = o || {};
  const reply = o.reply || { kind: o.kind || 'answer', paragraphs: [{ text: 'CAL is PD plus GR.', cites: [] }] };
  return Number(as('service_role', `select timmy_finish(${mid}, ${q(o.sent || '<student>q</student>')}, ${q(o.kind || 'answer')}, ${q(reply.paragraphs.map(p => p.text).join(' '))},
    ${q(JSON.stringify(reply))}::jsonb, ${o.raw === null ? 'null' : q(o.raw || '{"kind":"answer"}')}, ${o.ok || 0}, ${o.bad || 0}, ${o.unchecked ? q(JSON.stringify(o.unchecked)) + '::jsonb' : 'null'},
    ${o.offer ? q(o.offer) : 'null'}, 'claude-opus-5-5', 1000, 200, 70000, 0, ${o.cost == null ? 0.02 : o.cost}, 4000)`)[0][0]);
}
const age = (mid, mins) => sql(`update timmy_messages set created_at = now() - make_interval(mins => ${mins}) where id = ${mid}`);

try {
  notes.push(db.pending.length ? `applied ${db.pending.join(', ')} on top of supabase/schema.sql` : 'supabase/schema.sql has the game layer and Ask Timmy (no migration waiting)');

  /* ---------- 1. input ---------- */
  for (const [what, o] of [['no text', { text: '' }], ['1,001 characters', { text: 'x'.repeat(1001) }], ['a bad hub id', { hub: 'Perio!' }],
    ['a bad request id', { request: 'short' }], ['a context that is not an object', { context: [1, 2] }], ['a huge context', { context: { a: 'x'.repeat(7000) } }]])
    eq(begin('tv-A', o), { ok: false, error: 'bad' }, `timmy_begin refuses ${what}`);
  eq(asJson('service_role', `timmy_begin(null, 'th', null, 'hi', null)`), { ok: false, error: 'bad' }, 'timmy_begin refuses no visitor');

  /* ---------- 2. a chat ---------- */
  const b1 = begin('tv-A', { text: '  What is CAL?  ' });
  ok(b1.ok && b1.chat && b1.message && Array.isArray(b1.history) && b1.history.length === 0 && b1.answered === false, `a first question starts a chat with no history (${JSON.stringify(b1)})`);
  eq(one(`select text from timmy_messages where id = ${b1.message}`), 'What is CAL?', 'the question is stored trimmed');
  const t1 = finish(b1.message, { sent: '<page>{}</page>\n<student>What is CAL?</student>', raw: '{"kind":"answer","n":1}' });
  ok(t1 > b1.message, 'timmy_finish stores the answer');
  eq(finish(b1.message), t1, 'a second timmy_finish for the same question changes nothing and returns the first answer');
  eq(one(`select reserve_usd::text from timmy_messages where id = ${b1.message}`), '0.0000', 'the answer releases what the question held against the cap');
  const b2 = begin('tv-A', { chat: b1.chat, text: 'And GR?' });
  eq(b2.chat, b1.chat, 'a follow-up continues the chat');
  eq(b2.history.map(h => [h.who, h.sent || null, h.raw || null]), [['student', '<page>{}</page>\n<student>What is CAL?</student>', null], ['timmy', null, '{"kind":"answer","n":1}']],
    'the history replays the exact turn sent and the exact answer');
  finish(b2.message);
  for (let i = 0; i < 6; i++) { const b = begin('tv-A', { chat: b1.chat, text: 'more ' + i }); finish(b.message); }
  const b3 = begin('tv-A', { chat: b1.chat, text: 'the 9th' });
  eq(b3.history.length, 10, 'the history is the last 10 messages');
  eq(b3.history[9].who, 'timmy', 'oldest first, ending with the last answer');
  finish(b3.message);
  eq(Number(one(`select messages from timmy_chats where id = ${q(b1.chat)}`)), 18, 'the chat counts its messages');
  const bx = begin('tv-B', { chat: b1.chat, text: 'hijack' });
  ok(bx.ok && bx.chat !== b1.chat, 'someone else\'s chat id starts a new chat instead');
  finish(bx.message);
  const bh = begin('tv-A', { chat: b1.chat, hub: 'th2', text: 'other hub' });
  ok(bh.ok && bh.chat !== b1.chat, 'a chat id from another hub starts a new chat');
  finish(bh.message);

  /* ---------- 3. one at a time, retries ---------- */
  const r1 = begin('tv-C', { request: 'retry-000001' });
  eq(begin('tv-C', { text: 'another' }), { ok: false, error: 'busy' }, 'a second question while the first is being answered is busy');
  eq(begin('tv-C', { request: 'retry-000001' }), { ok: false, error: 'busy' }, 'the same send again while it is being answered is busy');
  const r1t = finish(r1.message, { reply: { kind: 'answer', paragraphs: [{ text: 'stored answer', cites: [] }] } });
  const rep = begin('tv-C', { request: 'retry-000001' });
  ok(rep.ok && rep.repeat && rep.message === r1t && rep.reply.paragraphs[0].text === 'stored answer', `a retried send gets the stored answer back (${JSON.stringify(rep)})`);
  eq(begin('tv-D', { request: 'retry-000001' }), { ok: false, error: 'bad' }, 'someone else\'s request id is refused');
  const st = begin('tv-C', { request: 'stall-000001' }); age(st.message, 3);
  const st2 = begin('tv-C', { request: 'stall-000001' });
  ok(st2.ok && !st2.repeat && st2.message !== st.message && one(`select count(*) from timmy_messages where id = ${st.message}`) === '0', 'a send that stalled over 2 minutes ago is asked again');
  finish(st2.message);
  const st3 = begin('tv-C', { text: 'stalled, no request id' }); age(st3.message, 3);
  const st4 = begin('tv-C', { text: 'after the stall' });
  ok(st4.ok, 'a question that stalled over 2 minutes ago no longer blocks the next');
  finish(st3.message, { kind: 'error', raw: null }); finish(st4.message);

  /* ---------- 4. 40 a day, the site's spend, the off switch ---------- */
  sql(`update timmy_config set per_visitor_day = 3`);
  for (let i = 0; i < 3; i++) { const b = begin('tv-L', { text: 'q' + i }); ok(b.ok, `question ${i + 1} of 3 is allowed`); finish(b.message, i === 0 ? { kind: 'error', raw: null } : {}); }
  const l4 = begin('tv-L', { text: 'q3' });
  ok(l4.ok, 'an answer that failed doesn\'t count toward the day');
  finish(l4.message);
  eq(begin('tv-L', { text: 'q4' }), { ok: false, error: 'limit' }, 'past the day\'s questions: limit');
  sql(`update timmy_messages set day = day - 1 where chat_id in (select id from timmy_chats where visitor_id = 'tv-L')`);
  ok(begin('tv-L', { text: 'tomorrow' }).ok, 'the limit is per Central day');
  sql(`update timmy_config set per_visitor_day = 40`);
  sql(`delete from timmy_messages; delete from timmy_chats;`);

  sql(`update timmy_config set day_cap_usd = 0.30`);   // reserve 0.08 a question in flight
  const c1 = begin('tv-S1'), c2 = begin('tv-S2'), c3 = begin('tv-S3');
  ok(c1.ok && c2.ok && c3.ok, 'three questions in flight fit under a $0.30 cap (3 x 0.08)');
  eq(begin('tv-S4'), { ok: false, error: 'cap' }, 'a fourth would pass the cap while three are in flight');
  finish(c1.message, { cost: 0.01 }); finish(c2.message, { cost: 0.01 });
  const c5 = begin('tv-S4');
  ok(c5.ok && Math.abs(c5.spent - 0.10) < 1e-9, `answers that cost less than held free room (${JSON.stringify(c5)})`);
  finish(c3.message, { cost: 0.25 });
  eq(begin('tv-S5'), { ok: false, error: 'cap' }, 'a day\'s cost at the cap stops new questions');
  age(c5.message, 6); sql(`update timmy_messages set reserve_usd = 0.08 where id = ${c5.message}`);
  sql(`update timmy_config set day_cap_usd = 0.36`);
  ok(begin('tv-S5').ok, 'a question stalled over 5 minutes no longer holds room under the cap');
  sql(`update timmy_config set day_cap_usd = 10, enabled = false`);
  eq(begin('tv-S6'), { ok: false, error: 'off' }, 'switched off: off');
  sql(`update timmy_config set enabled = true; delete from timmy_messages; delete from timmy_chats;`);
  notes.push('one question at a time, 40 a day (failed answers free), the daily spend with questions in flight, the off switch');

  /* ---------- 5. "Ask Timmy" sees a key only after this visitor answered ---------- */
  sql(`insert into personal_answers (visitor_id, hub, qid, correct) values ('tv-Q', 'th', 'q-7', false)`);
  let a = begin('tv-Q', { qid: 'q-7' }); eq(a.answered, true, 'answered: the visitor answered q-7'); finish(a.message);
  a = begin('tv-Q', { qid: 'q-8' }); eq(a.answered, false, 'not answered: q-8'); finish(a.message);
  a = begin('tv-R', { qid: 'q-7' }); eq(a.answered, false, 'someone else\'s answer doesn\'t count'); finish(a.message);
  a = begin('tv-Q', { qid: 'q-7', hub: 'dashboard' }); eq(a.answered, false, 'never on the dashboard'); finish(a.message);

  /* ---------- 6. the students' calls: own rows only ---------- */
  const h1 = begin('tv-H', { text: 'mine' });
  const h1t = finish(h1.message, { offer: 'report', reply: { kind: 'answer', paragraphs: [{ text: 'sorry', cites: [] }], offer: { kind: 'report', text: 'key wrong' } } });
  const hOther = begin('tv-H', { hub: 'th2', text: 'other hub' }); finish(hOther.message);
  const g1 = begin('tv-G', { text: 'theirs' }); const g1t = finish(g1.message, { offer: 'idea' });
  const hist = asJson('anon', `get_timmy_history('tv-H', 'th')`);
  ok(hist.length === 1 && hist[0].messages.length === 2 && hist[0].messages[0].text === 'mine' && hist[0].messages[1].reply.offer.kind === 'report',
    `get_timmy_history: the caller's chat on this hub only (${JSON.stringify(hist).slice(0, 200)})`);
  const keys = Object.keys(hist[0].messages[0]).sort();
  ok(!keys.includes('context') && !keys.includes('cost_usd') && !keys.includes('sent') && !keys.includes('raw'), `history carries no context, cost or prompt (${keys})`);
  eq(asJson('anon', `get_timmy_history(null, 'th')`), [], 'no visitor, no history');
  eq(asJson('anon', `get_timmy_history('tv-nobody', 'th')`), [], 'a visitor with no chats gets none');
  eq(as('anon', `select timmy_thumb('tv-H', ${h1t}, 1)`)[0][0], 't', 'a thumb on your own answer');
  eq(one(`select thumb from timmy_messages where id = ${h1t}`), '1', 'the thumb is stored');
  eq(as('anon', `select timmy_thumb('tv-H', ${h1t}, 0)`)[0][0], 't', 'taking a thumb back');
  eq(one(`select coalesce(thumb::text, 'none') from timmy_messages where id = ${h1t}`), 'none', 'the thumb is gone');
  eq(as('anon', `select timmy_thumb('tv-H', ${g1t}, -1)`)[0][0], 'f', 'no thumb on someone else\'s answer');
  eq(as('anon', `select timmy_thumb('tv-H', ${h1.message}, 1)`)[0][0], 'f', 'no thumb on a student\'s own message');
  eq(as('anon', `select timmy_thumb('tv-H', ${h1t}, 5)`)[0][0], 'f', 'a thumb is 1, -1 or 0');
  eq(as('anon', `select timmy_offer('tv-H', ${h1t}, 'posted')`)[0][0], 'f', 'a report offer can\'t be "posted"');
  eq(as('anon', `select timmy_offer('tv-H', ${h1t}, 'sent')`)[0][0], 't', 'a report offer sent');
  eq(as('anon', `select timmy_offer('tv-H', ${g1t}, 'dismissed')`)[0][0], 'f', 'no changing someone else\'s offer');
  eq(as('anon', `select timmy_offer('tv-G', ${g1t}, 'posted')`)[0][0], 't', 'an idea offer posted');
  eq(as('anon', `select timmy_offer('tv-H', ${hOther.message + 1}, 'dismissed')`)[0][0], 'f', 'an answer with no offer');
  eq(one(`select offer_action from timmy_messages where id = ${h1t}`), 'sent', 'what was done with the offer is stored');
  notes.push('history, thumbs and offers read and change only the caller\'s own rows');

  /* ---------- 6b. the chat's Report button ---------- */
  const rp = asJson('anon', `timmy_report('tv-H', 'th', ${h1t}, '  The   answer said the wrong nerve.  ', 'compendium/notes l3!<x>')`);
  ok(rp.ok && rp.id > 0 && !rp.repeat, `a report on your own answer (${JSON.stringify(rp)})`);
  const fl = sql(`select hub, note, visitor_id, resolved from question_flags where id = ${rp.id}`)[0];
  eq(fl, ['th', `The answer said the wrong nerve. — Timmy's answer ${h1t} · compendium/notesl3x`, 'tv-H', 'f'], 'it is a usual report: the Inbox shows it and the reply goes back to the sender');
  eq(sql(`select report_id::text, (reported_at is not null)::text from timmy_messages where id = ${h1t}`)[0], [String(rp.id), 'true'], 'the answer is marked reported');
  const again = asJson('anon', `timmy_report('tv-H', 'th', ${h1t}, 'again')`);
  ok(again.ok && again.id === rp.id && again.repeat === true, `reporting the same answer again returns the first report (${JSON.stringify(again)})`);
  eq(asJson('anon', `timmy_report('tv-G', 'th', ${h1t}, 'not mine')`), { ok: false, error: 'bad' }, 'no reporting someone else\'s answer');
  eq(asJson('anon', `timmy_report('tv-H', 'th', ${h1.message}, 'a student message')`), { ok: false, error: 'bad' }, 'only Timmy\'s messages can be reported');
  eq(asJson('anon', `timmy_report('tv-H', 'th', ${hOther.message + 1}, '   ')`), { ok: false, error: 'bad' }, 'a report needs words');
  eq(asJson('anon', `timmy_report('tv-H', 'th', ${hOther.message + 1}, ${q('x'.repeat(601))})`), { ok: false, error: 'bad' }, 'a report is at most 600 characters');
  const rn = asJson('anon', `timmy_report('tv-H', 'dashboard', null, 'Timmy kept napping')`);
  ok(rn.ok && one(`select note from question_flags where id = ${rn.id}`) === 'Timmy kept napping — Timmy' && one(`select hub from question_flags where id = ${rn.id}`) === 'dashboard',
    'a report with no answer to point at (he was napping) goes to the hub named');
  eq(asJson('anon', `timmy_report('tv-H', 'Bad Hub', null, 'x')`), { ok: false, error: 'bad' }, 'with no answer, the hub must be a real hub id');
  for (let i = 0; i < 8; i++) asJson('anon', `timmy_report('tv-H', 'th', null, 'report ${i}')`);
  eq(asJson('anon', `timmy_report('tv-H', 'th', null, 'the 11th')`), { ok: false, error: 'limit' }, 'ten Timmy reports a person a day');
  sql(`insert into question_flags (hub, note, visitor_id) values ('th', 'a usual question report — question q-1', 'tv-R')`);
  ok(asJson('anon', `timmy_report('tv-R', 'th', null, 'first')`).ok, 'usual question reports don\'t count toward Timmy\'s ten');
  sql(`update question_flags set resolved = true, resolved_at = now(), reply = 'Fixed, thanks!' where id = ${rp.id}`);
  const rr = rows('anon', `select * from admin_timmy_reported(${S}, 7)`);
  ok(rr.length === 1 && rr[0].message_id === h1t && rr[0].resolved === true && rr[0].report.startsWith('The answer said') && rr[0].answer === 'sorry' && !JSON.stringify(rr).includes('tv-H'),
    `admin_timmy_reported lists reported answers with the report, no visitor id (${JSON.stringify(rr).slice(0, 200)})`);
  raises(() => as('anon', `select * from admin_timmy_reported('wrong')`), '28000', 'admin_timmy_reported with a wrong secret');
  const rc = asJson('anon', `admin_timmy_chat(${S}, ${q(h1.chat)}::uuid)`);
  ok(rc.messages[1].report_id === rp.id && rc.messages[1].report.startsWith('The answer said'), 'the chat view shows the report on the answer');
  notes.push('Report: a usual report the Inbox shows and answers, own answers only, once an answer, ten a day, listed for the admin page');

  /* ---------- 7. closed to anon; admin reads need the secret, with no visitor id ---------- */
  raises(() => as('anon', `select timmy_begin('tv-X', 'th', null, 'hi', null)`), '42501', 'anon runs timmy_begin');
  raises(() => as('anon', `select timmy_finish(${h1.message}, 's', 'answer', 't', '{}'::jsonb, null)`), '42501', 'anon runs timmy_finish');
  raises(() => as('authenticated', `select timmy_begin('tv-X', 'th', null, 'hi', null)`), '42501', 'authenticated runs timmy_begin');
  for (const t of ['timmy_chats', 'timmy_messages', 'timmy_config']) raises(() => as('anon', `select count(*) from public.${t}`), '42501', `anon reads ${t}`);
  raises(() => as('anon', `update public.timmy_config set enabled = false`), '42501', 'anon switches Timmy off directly');
  raises(() => as('anon', `select * from admin_timmy_days('wrong')`), '28000', 'admin_timmy_days with a wrong secret');
  raises(() => as('anon', `select admin_timmy_config(null, false)`), '28000', 'admin_timmy_config with no secret');
  sql(`update timmy_messages set kind = 'not_covered', reply = '{"kind":"not_covered","closest":{"lec":"l3"}}'::jsonb where id = ${g1t};
       update timmy_messages set cites_ok = 2, cites_bad = 1, unchecked = '[{"id":"N1.2","quote":"made up"}]'::jsonb, thumb = -1 where id = ${h1t}`);
  const days = rows('anon', `select * from admin_timmy_days(${S}, 7)`);
  const th = days.find(d => d.hub === 'th');
  ok(th && th.questions === 5 && th.answers === 5 && th.people === 4 && th.not_covered === 1 && th.thumbs_down === 1 && th.cites_bad === 1 && th.offers === 2 && th.offers_taken === 2 && th.reported === 1,
    `admin_timmy_days counts by day and hub (${JSON.stringify(th)})`);
  const chats = rows('anon', `select * from admin_timmy_chats(${S}, 'th', 7, 50)`);
  ok(chats.length >= 4 && chats.every(c => !('visitor_id' in c)) && chats.some(c => c.first_question === 'mine'), `admin_timmy_chats lists chats without a visitor id (${JSON.stringify(chats[0])})`);
  const chat = asJson('anon', `admin_timmy_chat(${S}, ${q(h1.chat)}::uuid)`);
  ok(chat.messages.length === 2 && chat.messages[1].cites_bad === 1 && chat.messages[1].cost_usd > 0 && !JSON.stringify(chat).includes('tv-H'),
    `admin_timmy_chat shows one chat with what each message carried, no visitor id (${JSON.stringify(chat).slice(0, 160)})`);
  const nc = rows('anon', `select * from admin_timmy_not_covered(${S}, 7)`);
  ok(nc.length === 1 && nc[0].question === 'theirs' && nc[0].closest !== null, `admin_timmy_not_covered (${JSON.stringify(nc)})`);
  const un = rows('anon', `select * from admin_timmy_unchecked(${S}, 7)`);
  ok(un.length === 1 && un[0].unchecked[0].quote === 'made up', 'admin_timmy_unchecked lists the quotes that didn\'t check out');
  const cfg = asJson('anon', `admin_timmy_config(${S}, false, 12.5, 30)`);
  ok(cfg.enabled === false && Number(cfg.day_cap_usd) === 12.5 && cfg.per_visitor_day === 30 && cfg.spent_today > 0 && cfg.questions_today >= 6,
    `admin_timmy_config changes the settings and shows today's spend (${JSON.stringify(cfg)})`);
  const cfg2 = asJson('anon', `admin_timmy_config(${S})`);
  ok(cfg2.enabled === false && Number(cfg2.day_cap_usd) === 12.5, 'admin_timmy_config with no changes only reads');
  asJson('anon', `admin_timmy_config(${S}, true, 1000, 40)`);
  eq(Number(one(`select day_cap_usd from timmy_config`)), 100, 'the cap can\'t be set past $100 a day');
  sql(`update timmy_config set day_cap_usd = 10`);
  notes.push('anon can\'t run the function\'s calls or read the tables; admin reads need the secret and carry no visitor id');

  /* ---------- 8. Link my devices moves the chats ---------- */
  const k1 = begin('tv-P1', { text: 'from my phone' }); finish(k1.message);
  const k2 = begin('tv-P2', { text: 'from my laptop' }); finish(k2.message);
  const code = as('anon', `select create_link_code('tv-P1')`)[0][0];
  eq(as('anon', `select redeem_link_code(${q(code)}, 'tv-P2')`)[0][0], 'tv-P1', 'two devices link');
  const lh = asJson('anon', `get_timmy_history('tv-P1', 'th')`);
  ok(lh.length === 2 && one(`select count(*) from timmy_chats where visitor_id = 'tv-P2'`) === '0', 'linked: both devices\' chats are under the id that remains');
  const k3 = begin('tv-P1', { chat: k2.chat, text: 'continuing on the phone' });
  eq(k3.chat, k2.chat, 'the linked device\'s chat can be continued');
  finish(k3.message);
  notes.push('Link my devices moves the chats');
} catch (e) {
  problems.push(`test run failed: ${e.message.split('\n').slice(0, 3).join(' | ')} (${(e.stack || '').split('\n').filter(l => /timmy\.js:\d+/.test(l)).map(l => l.replace(/.*timmy\.js:(\d+).*/, 'line $1')).join(' < ')})`);
}
db.stop();
notes.forEach(n => console.log('  ' + n));
console.log(`  ${checks} checks`);
if (problems.length) { console.error(`\n✗ Ask Timmy's database: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ Ask Timmy\'s database (migration_v55 on a throwaway copy) passed');
