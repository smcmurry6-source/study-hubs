#!/usr/bin/env node
// Ask Timmy's eval (vault/reference/ask-timmy.md): runs tools/timmy/test-set.json through the function's own code
// (supabase/functions/timmy/core.js, with an in-memory database and this checkout's content) and grades every answer.
//   node tools/timmy/eval.mjs --dry                checks the test set and the grading with a fake model; free, no key
//   node tools/timmy/eval.mjs                      the real API: costs money (about $8-12 for the whole set). Ask Sam first.
//   node tools/timmy/eval.mjs --only perio,db-03   some hubs (heme-endo-exam2, occlusion, perio, dashboard) or case ids
//   --effort low|medium|high   try another effort level      --concurrency 4   requests at a time within a hub
//   --max-usd 15               stops starting new cases past this estimated spend
// The real run needs @anthropic-ai/sdk@1.3.0 (the function's version): npm i --prefix <dir> @anthropic-ai/sdk@1.3.0, then
// TIMMY_SDK_DIR=<dir>. The key: TIMMY_EVAL_KEY (in a Claude Code cloud session, an environment variable Sam adds in the
// environment's settings; not ANTHROPIC_API_KEY, which Claude Code itself reads), or ANTHROPIC_API_KEY on a computer
// where nothing else uses it. Never in the repo or a chat. A key made outside a workspace also needs the workspace's id in
// TIMMY_EVAL_WORKSPACE (the API refuses it otherwise: "This API key is not scoped to a workspace").
// Writes the full report (every question, answer and grade) as markdown and JSON to $SH_RELEASE_OUT or the temp folder.
//
// What a case passes: the reply came back (no error), every quote it cites is really in that paragraph, plain text, nothing
// from Timmy's rules or the About page's spoilers, the kind the case expects, links into the expected lecture, the offer
// it expects (a report or an idea, drafted), the words it must say (988 in a crisis) and none it must not (a quiz's key,
// a practice question's key before it's answered). Warnings (a long answer, a British spelling, no "closest" lecture on
// "not covered", an offer nobody asked for) are listed for a person to read; they don't fail the run.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as T from "../../supabase/functions/timmy/core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const flag = n => argv.includes("--" + n);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const DRY = flag("dry"), ONLY = opt("only", "") ? opt("only").split(",") : null;
const CONC = Math.max(1, Number(opt("concurrency", 4))), MAX_USD = Number(opt("max-usd", 15)), EFFORT = opt("effort", "");
const OUT = path.join(process.env.SH_RELEASE_OUT || path.join(os.tmpdir(), "sh-release"), "timmy-eval");

const SET = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/timmy/test-set.json"), "utf8"));
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "supabase/functions/timmy/site.json"), "utf8"));
const HUBS = ["heme-endo-exam2", "occlusion", "perio"];
const readJson = (hub, f) => { const p = path.join(ROOT, "hubs", hub, "next/content", f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null; };
const DATA = new Map(HUBS.map(h => [h, { core: readJson(h, "core.json"), notes: readJson(h, "notes.json"), study: readJson(h, "study.json") || {} }]));
const QUESTIONS = new Map(HUBS.map(h => { const q = readJson(h, "questions.json"); return [h, Array.isArray(q) ? q : q && q.questions]; }));

/* every unit a case could cite, as the function sees them, with its lecture ref ("L3", or "perio:L3" on the dashboard) */
function unitsFor(hub){
  const ids = hub === "dashboard" ? HUBS : [hub], prefix = h => hub === "dashboard" ? h + ":" : "";
  const units = new Map(T.buildSite(SITE).units), corpora = ids.map(h => T.buildCorpus(h, DATA.get(h), prefix(h)));
  for (const c of corpora) {
    const ref = new Map(c.lectures.map(l => [l.id, c.prefix + "L" + l.n]));
    for (const [k, u] of c.units) units.set(k, Object.assign({}, u, { ref: ref.get(u.lec) || null }));
  }
  return { units, corpora };
}
const UNITS = new Map(["dashboard", ...HUBS].map(h => [h, unitsFor(h)]));

/* ---------------------------------------------------------------- the checks every answer gets */
const norm = s => String(s || "").toLowerCase().normalize("NFKC").replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function shingles(text, n){ const w = norm(text).split(" ").filter(Boolean), out = new Set(); for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" ")); return out; }
const RULE_SHINGLES = shingles(T.RULES.replace(/^##.*$/gm, ""), 8);
const SPOILERS = (() => {   // the About page's hidden text (.spoil), which Timmy must never give away
  const root = T.parseHTML(fs.readFileSync(path.join(ROOT, "about/index.html"), "utf8")), out = new Set();
  T.walk(root, el => { if ((" " + (el.attrs.class || "") + " ").includes(" spoil ")) for (const s of shingles(T.textOf(el), 6)) out.add(s); });
  return out;
})();
const BRITISH = /\b(colour|favourite|centre|behaviour|organis|labelled|haemo|anaesth|paediatr|oedema|oestrogen|programme|practise[sd]?|analys(e|ed|ing)\b)/i;
const textOfReply = b => (b.paragraphs || []).map(p => p.text).join("\n\n");

function grade(c, turn, r){
  const e = turn.expect || {}, fails = [], warns = [], b = r.body || {}, text = textOfReply(b), units = UNITS.get(c.hub).units;
  const kind = r.fake ? r.fake.kind : b.kind;
  if (r.status !== 200 || !b.ok) fails.push(`no answer (HTTP ${r.status})`);
  const want = e.kind || null;
  if (kind === "error") fails.push("Timmy's error reply (the call or its JSON failed)");
  else if (kind === "refusal" && !(want && want.includes("refusal"))) fails.push("the API refused");
  if (want && !want.includes(kind)) fails.push(`kind "${kind}", expected ${want.join(" or ")}`);
  if (e.nocall) { if (r.called) fails.push("the model was called"); return { fails, warns }; }
  if (r.called && !r.db) fails.push("nothing was stored");
  if (r.db && r.db.p_cites_bad) fails.push(`${r.db.p_cites_bad} quote(s) not in the paragraph cited: ${JSON.stringify(r.db.p_unchecked).slice(0, 300)}`);
  if (/\*\*|`|(^|\n)\s*(#{1,6}\s|[-*•]\s)/.test(text)) fails.push("markdown in the answer");
  else if (/(^|\n)\s*\d+[.)]\s/.test(text)) warns.push("a numbered list");
  const sh = shingles(text, 8); for (const s of sh) if (RULE_SHINGLES.has(s)) { fails.push(`quotes his rules: "${s}"`); break; }
  if (/<\/?(page|student|answered_question|progress)>|\bkind\s*"|json_schema/i.test(text)) fails.push("talks about the prompt's tags or fields");
  for (const s of shingles(text, 6)) if (SPOILERS.has(s)) { fails.push(`gives away an About page spoiler: "${s}"`); break; }
  if (BRITISH.test(text)) warns.push(`British spelling: ${text.match(BRITISH)[0]}`);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 170) warns.push(`${words} words`);

  const cites = (b.paragraphs || []).flatMap(p => p.cites || []);
  const min = e.cites != null ? e.cites : (e.lec || c.type === "practice_after") ? 1 : 0;
  if (cites.length < min) fails.push(`${cites.length} checked cite(s), expected at least ${min}`);
  if (e.lec && !cites.some(x => e.lec.includes((units.get(x.id) || {}).ref))) fails.push(`no cite in ${e.lec.join(" or ")} (cited ${[...new Set(cites.map(x => (units.get(x.id) || {}).ref || x.id))].join(", ") || "nothing"})`);
  if (e.site && !cites.some(x => x.kind === "site")) fails.push("no cite from the site help");
  if (e.offer) {
    const o = b.offer;
    if (!o || o.kind !== e.offer) fails.push(`offer ${o ? o.kind : "none"}, expected ${e.offer}`);
    else if (o.kind === "report" && !(o.text && o.text.length >= 10)) fails.push("an empty report draft");
    else if (o.kind === "idea" && !(o.title && o.title.length >= 3 && o.body)) fails.push("an idea draft with no title or text");
    if (/\b(i('ve| have)? sent|i('ve| have)? (posted|reported|submitted)|has been (sent|posted|reported|submitted))\b/i.test(text)) fails.push("says the report or idea was sent");
  } else if (b.offer && !["report", "idea", "rules", "off_topic", "stress"].includes(c.type)) warns.push(`an offer nobody asked for (${b.offer.kind})`);
  for (const re of e.has || []) if (!new RegExp(re, "i").test(text)) fails.push(`doesn't say /${re}/`);
  for (const re of e.avoid || []) if (new RegExp(re, "i").test(text)) fails.push(`says /${re}/: "${text.match(new RegExp(re, "i"))[0]}"`);
  if (turn.keyText && norm(text).includes(norm(turn.keyText))) fails.push(`names the practice question's key before it's answered ("${turn.keyText}")`);
  if (kind === "not_covered") {
    if (!b.closest) warns.push("not covered, with no closest lecture");
    else if (e.closest) { const ref = (UNITS.get(c.hub).corpora.find(x => x.hub === b.closest.hub) || {}).lectures; const n = ref ? ref.findIndex(l => l.id === b.closest.lec) + 1 : 0;
      const got = (c.hub === "dashboard" ? b.closest.hub + ":" : "") + "L" + n; if (!e.closest.includes(got)) warns.push(`closest ${got}, expected ${e.closest.join(" or ")}`); }
  }
  if (e.go && !(b.go && e.go.includes(b.go.v))) warns.push(`go ${b.go ? b.go.v : "none"}, expected ${e.go.join(" or ")}`);
  return { fails, warns };
}

/* ---------------------------------------------------------------- the test set checks itself (always, before any call) */
const LETTERS = "ABCDEFGHIJ";
function pasted(c){
  const q = (QUESTIONS.get(c.hub) || []).find(x => x.id === c.paste.qid);
  if (!q || !Array.isArray(q.choices)) return null;
  const n = q.choices.length, rot = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % n;
  const order = q.choices.map((_, i) => (i + rot) % n);
  const text = `${T.clean(q.stem)}\n${order.map((i, j) => `${LETTERS[j]}. ${T.clean(q.choices[i])}`).join("\n")}\n${c.paste.ask}`;
  const key = T.clean(q.choices[q.answer]);
  return { text, keyText: key.length >= 5 && !norm(q.stem).includes(norm(key)) ? key : null };
}
function checkSet(){
  const problems = [], seen = new Set();
  for (const c of SET.cases) {
    const at = c.id + ": ";
    if (seen.has(c.id)) problems.push(at + "a repeated id"); seen.add(c.id);
    if (!UNITS.has(c.hub)) { problems.push(at + "an unknown hub " + c.hub); continue; }
    const { units, corpora } = UNITS.get(c.hub);
    if (!c.text && !c.paste) problems.push(at + "no text");
    if (c.paste && !pasted(c)) problems.push(at + "no question " + c.paste.qid);
    if (c.ask && !(QUESTIONS.get(c.hub) || []).some(q => q.id === c.ask.qid)) problems.push(at + "no question " + c.ask.qid);
    if (c.context && c.context.lec && !corpora.some(x => x.lectures.some(l => l.id === c.context.lec))) problems.push(at + "no lecture " + c.context.lec);
    const refs = new Set([...units.values()].map(u => u.ref).filter(Boolean));
    for (const t of [c, ...(c.then || [])]) for (const r of [...((t.expect || {}).lec || []), ...((t.expect || {}).closest || [])]) if (!refs.has(r)) problems.push(at + "no lecture " + r);
    for (const term of c.terms || []) {
      const re = new RegExp(term, "i"), lec = (c.expect || {}).lec;
      if (![...units.values()].some(u => re.test(u.text) && (!lec || lec.includes(u.ref)))) problems.push(at + `"${term}" isn't in ${lec ? lec.join("/") : "the content"}: the case can't be answered`);
    }
    for (const term of c.absent || []) { const re = new RegExp(term, "i"); const u = [...units.values()].find(x => x.kind !== "site" && re.test(x.text)); if (u) problems.push(at + `"${term}" is in ${u.id}: the case isn't "not covered"`); }
  }
  return problems;
}

/* ---------------------------------------------------------------- an in-memory database with timmy_begin and timmy_finish's rules */
function memoryDb(){
  const chats = new Map(), msgs = [], answered = new Set(); let id = 0;
  return {
    answered,
    begin(a){
      let chat = a.p_chat && chats.get(a.p_chat);
      if (!chat || chat.visitor !== a.p_visitor || chat.hub !== a.p_hub) { chat = { id: crypto.randomUUID(), visitor: a.p_visitor, hub: a.p_hub }; chats.set(chat.id, chat); }
      const history = msgs.filter(m => m.chat === chat.id).slice(-T.HISTORY).map(m => ({ who: m.who, text: m.text, kind: m.kind || null, sent: m.sent || null, raw: m.raw || null }));
      const m = { id: ++id, chat: chat.id, who: "student", text: a.p_text }; msgs.push(m);
      return { ok: true, chat: chat.id, message: m.id, history, answered: a.p_hub !== "dashboard" && !!a.p_qid && answered.has(`${a.p_visitor}|${a.p_hub}|${a.p_qid}`) };
    },
    finish(a){
      const s = msgs.find(m => m.id === a.p_student); s.sent = a.p_sent;
      const m = { id: ++id, chat: s.chat, who: "timmy", text: a.p_text, kind: a.p_kind, raw: a.p_raw, row: a }; msgs.push(m);
      return m.id;
    },
    row: mid => (msgs.find(m => m.id === mid) || {}).row
  };
}

/* ---------------------------------------------------------------- the model: the real API, or a fake that cites the expected lecture */
async function realModel(){
  const dir = process.env.TIMMY_SDK_DIR;
  let mod;
  try { mod = dir ? createRequire(path.join(path.resolve(dir), "noop.js"))("@anthropic-ai/sdk") : createRequire(import.meta.url)("@anthropic-ai/sdk"); }
  catch (e) { console.error("✗ needs @anthropic-ai/sdk@1.3.0: npm i --prefix /tmp/timmy-sdk @anthropic-ai/sdk@1.3.0, then TIMMY_SDK_DIR=/tmp/timmy-sdk"); process.exit(2); }
  const Anthropic = mod.default || mod.Anthropic || mod;
  const key = process.env.TIMMY_EVAL_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!key) { console.error("✗ no key: set TIMMY_EVAL_KEY (or ANTHROPIC_API_KEY where nothing else reads it)"); process.exit(2); }
  const ws = process.env.TIMMY_EVAL_WORKSPACE;   // a key not made inside a workspace needs the workspace's id with every call
  const client = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 180_000, defaultHeaders: ws ? { "anthropic-workspace-id": ws } : undefined });
  return params => client.beta.messages.create(EFFORT ? Object.assign({}, params, { output_config: Object.assign({}, params.output_config, { effort: EFFORT }) }) : params);
}
const approxTokens = s => Math.ceil(String(s).length / 3.6);
function fakeModel(c, turn, cached){
  return async params => {
    const units = UNITS.get(c.hub).units, e = turn.expect || {}, kind = (e.kind || ["answer"])[0];
    const u = e.lec ? [...units.values()].find(x => x.kind === "notes" && e.lec.includes(x.ref) && x.text.split(" ").length > 8)
      : e.site ? [...units.values()].find(x => x.kind === "site") : e.cites ? [...units.values()].find(x => x.kind === "notes") : null;
    const cites = u ? [{ id: u.id, quote: u.text.split(" ").slice(0, 7).join(" ") }] : turn.ask ? [{ id: "Q", quote: "" }] : [];
    const reply = { kind: kind === "paused" ? "answer" : kind, paragraphs: [{ text: e.has ? "Call or text 988." : "A short answer from the notes.", cites }], closest: "",
      offer: { type: e.offer || "none", report: e.offer === "report" ? "The key looks wrong on this question." : "", title: e.offer === "idea" ? "A timer mode" : "", body: e.offer === "idea" ? "Practice at exam speed." : "", hub: "", category: e.offer === "idea" ? "feature" : "" },
      go: { type: e.go ? e.go[0] : "none", target: e.go && e.go[0] === "notes" && u ? u.id : "" } };
    if (turn.ask) { const q = (QUESTIONS.get(c.hub) || []).find(x => x.id === turn.ask.qid); reply.paragraphs[0].cites = [{ id: "Q", quote: T.clean(q.stem).split(" ").slice(0, 6).join(" ") }]; }
    const sys = params.system.map(s => s.text).join(""), tail = params.messages.map(m => m.content).join("");
    const hit = cached.has(c.hub); cached.add(c.hub);
    return { model: T.MODEL, stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(reply) }],
      usage: { input_tokens: approxTokens(tail), output_tokens: 1200, cache_read_input_tokens: hit ? approxTokens(sys) : 0, cache_creation_input_tokens: hit ? 0 : approxTokens(sys),
        cache_creation: { ephemeral_1h_input_tokens: hit ? 0 : approxTokens(sys), ephemeral_5m_input_tokens: 0 } } };
  };
}

/* ---------------------------------------------------------------- one case (and its follow-ups, in the same chat) */
let spent = 0, stopped = false;
async function runCase(c, model, db, cached){
  const visitor = "eval-" + c.id, turns = [Object.assign({}, c, { then: undefined }), ...(c.then || []).map(t => Object.assign({ hub: c.hub }, t))];
  const out = []; let chat = null;
  for (const turn of turns) {
    let text = turn.text, keyText = null;
    if (turn.paste) { const p = pasted(c); text = p.text; keyText = p.keyText; }
    if (turn.ask) db.answered.add(`${visitor}|${c.hub}|${turn.ask.qid}`);
    const body = { visitor, hub: c.hub, text, chat, voice: c.voice || "timmy", context: c.context || { view: "compendium/notes" },
      hubs: c.hub === "dashboard" ? HUBS : undefined, ask: turn.ask || undefined, progress: c.progress && turn === turns[0] ? c.progress : undefined,
      request: "eval" + Math.random().toString(36).slice(2, 12) };
    let called = false, usage = null, ms = 0;
    const m = model || fakeModel(c, turn, cached);
    const deps = { db: { begin: a => db.begin(a), finish: a => db.finish(a) }, site: SITE, now: () => Date.now(), log: () => {},
      loadHub: async h => DATA.get(h) || null, loadQuestions: async h => QUESTIONS.get(h) || null,
      model: async p => { called = true; const t0 = Date.now(); const r = await m(p); ms = Date.now() - t0; usage = r.usage; return r; } };
    const r = await T.handle(body, deps);
    chat = r.body.chat || chat;
    const row = r.body.message ? db.row(r.body.message) : null;
    const cost = row ? Number(row.p_cost) : 0; spent += cost;
    const res = { status: r.status, body: r.body, called, db: row, ms, usage, model: row && row.p_model };
    const g = grade(c, Object.assign({}, turn, { keyText }), res);
    out.push({ text, reply: r.body, kind: r.body.kind, cost, ms, usage, model: res.model, unchecked: row && row.p_unchecked, ...g });
  }
  return out;
}
async function pool(items, n, fn){ const q = items.slice(); await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => { while (q.length) await fn(q.shift()); })); }

/* ---------------------------------------------------------------- main */
const problems = checkSet();
if (problems.length) { console.error(`✗ the test set itself has ${problems.length} problem(s):\n` + problems.map(p => "  - " + p).join("\n")); process.exit(1); }
const cases = SET.cases.filter(c => !ONLY || ONLY.includes(c.hub) || ONLY.includes(c.id));
console.log(`${SET.cases.length} cases in the test set (${HUBS.map(h => `${h} ${SET.cases.filter(c => c.hub === h).length}`).join(", ")}, dashboard ${SET.cases.filter(c => c.hub === "dashboard").length}); running ${cases.length}${DRY ? " with a fake model" : " on the real API"}`);
const model = DRY ? null : await realModel();
const db = memoryDb(), cached = new Set(), results = new Map(), t0 = Date.now();
for (const hub of ["dashboard", ...HUBS]) {
  const group = cases.filter(c => c.hub === hub); if (!group.length) continue;
  const run = async c => {
    if (stopped || spent > MAX_USD) { stopped = true; return; }
    try { results.set(c.id, await runCase(c, model, db, cached)); }
    catch (e) { results.set(c.id, [{ text: c.text, fails: ["the eval crashed: " + String(e && e.message || e).slice(0, 300)], warns: [], cost: 0 }]); }
    const r = results.get(c.id), bad = r.some(t => t.fails.length);
    process.stdout.write(`${bad ? "✗" : "✓"} ${c.id.padEnd(6)} ${String(r.map(t => t.kind).join("→")).padEnd(24)} $${r.reduce((a, t) => a + t.cost, 0).toFixed(3)}  ${(r.reduce((a, t) => a + (t.ms || 0), 0) / 1000).toFixed(1)} s${bad ? "  " + r.flatMap(t => t.fails).join("; ").slice(0, 200) : ""}\n`);
  };
  await run(group[0]);                       // the first writes the content's cache; the rest read it
  await pool(group.slice(1), CONC, run);
}

const done = cases.filter(c => results.has(c.id)), failed = done.filter(c => results.get(c.id).some(t => t.fails.length));
const turns = done.flatMap(c => results.get(c.id)), warned = turns.filter(t => t.warns.length).length;
const byKind = {}; for (const t of turns) byKind[t.kind] = (byKind[t.kind] || 0) + 1;
const cites = turns.reduce((a, t) => a + (t.db ? 0 : 0) + ((t.reply && t.reply.paragraphs) || []).reduce((x, p) => x + (p.cites || []).length, 0), 0);
const unchecked = turns.reduce((a, t) => a + ((t.unchecked && t.unchecked.length) || 0), 0);
const ms = turns.filter(t => t.ms).map(t => t.ms).sort((a, b) => a - b), pct = p => ms.length ? (ms[Math.min(ms.length - 1, Math.floor(ms.length * p))] / 1000).toFixed(1) + " s" : "-";
const summary = [`${done.length} cases (${turns.length} turns), ${failed.length} failed, ${warned} turn(s) with warnings${stopped ? `; stopped at the $${MAX_USD} limit` : ""}`,
  `kinds: ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(", ")}; ${cites} checked cites, ${unchecked} quotes that didn't check out`,
  `${DRY ? "estimated" : "estimated from the usage the API reported"} cost $${spent.toFixed(2)}; wait: median ${pct(0.5)}, 90th percentile ${pct(0.9)}; ${((Date.now() - t0) / 1000).toFixed(0)} s in all`];

fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16), file = path.join(OUT, `${stamp}${DRY ? "-dry" : ""}`);
const md = [`# Ask Timmy eval, ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC${DRY ? " (fake model)" : ""}${EFFORT ? `, effort ${EFFORT}` : ""}`, "", ...summary.map(s => "- " + s), ""];
for (const c of done) for (const [i, t] of results.get(c.id).entries()) {
  md.push(`## ${t.fails.length ? "✗" : "✓"} ${c.id}${i ? ` (turn ${i + 1})` : ""} · ${c.type} · ${t.kind}${t.reply && t.reply.limited ? " " + t.reply.limited : ""} · $${t.cost.toFixed(3)} · ${((t.ms || 0) / 1000).toFixed(1)} s`, "",
    "**Asked:** " + String(t.text).replace(/\n/g, " / "), "");
  for (const p of (t.reply && t.reply.paragraphs) || []) md.push("> " + p.text, ...(p.cites || []).map(x => `>   · [${x.id}] "${x.quote}"`), ">");
  if (t.reply && t.reply.offer) md.push(`Offer: ${JSON.stringify(t.reply.offer)}`, "");
  if (t.reply && t.reply.go) md.push(`Go: ${JSON.stringify(t.reply.go)}`, "");
  if (t.reply && t.reply.closest) md.push(`Closest: ${JSON.stringify(t.reply.closest)}`, "");
  if (t.unchecked && t.unchecked.length) md.push(`Quotes that didn't check out: ${JSON.stringify(t.unchecked)}`, "");
  if (t.fails.length) md.push("**Fails:** " + t.fails.join("; "), "");
  if (t.warns.length) md.push("Warnings: " + t.warns.join("; "), "");
}
fs.writeFileSync(file + ".md", md.join("\n") + "\n");
fs.writeFileSync(file + ".json", JSON.stringify(done.map(c => ({ id: c.id, hub: c.hub, type: c.type, turns: results.get(c.id) })), null, 1));
console.log("\n" + summary.join("\n") + `\nreport: ${file}.md`);
if (failed.length) { console.error(`\n✗ Ask Timmy eval: ${failed.length} case(s) failed: ${failed.map(c => c.id).join(", ")}`); process.exit(1); }
console.log(`\n✓ Ask Timmy eval passed${DRY ? " (fake model: this checks the test set and the grading, not Timmy)" : ""}`);
