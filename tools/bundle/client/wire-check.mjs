#!/usr/bin/env node
// The slim client against the real server, next to the full client: same answers, same errors, and each sees the
// other's presence and broadcasts. Run it by hand after building a new client (build.mjs); it is not part of CI.
//   node tools/bundle/client/wire-check.mjs
// It never writes: two read-only functions, two reads of class totals (compared, never printed) and a presence topic
// with a random name that no page uses. It needs Node 22 (its own WebSocket) and network access to the project.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_ = "https://thytmzsgymydbzcqdnix.supabase.co", KEY = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS";   /* the site's public key, as in every page */
const vendor = fs.readdirSync(path.join(ROOT, "widget/vendor"));
const load = f => new Function(fs.readFileSync(path.join(ROOT, "widget/vendor", f), "utf8") + "\n;return supabase;")();
const fullFile = vendor.filter(f => /^supabase-\d/.test(f)).sort().pop(), liteFile = vendor.filter(f => /^supabase-lite-\d/.test(f)).sort().pop();
const A = load(fullFile).createClient(URL_, KEY), B = load(liteFile).createClient(URL_, KEY);
const out = [];
const ok = (name, pass, extra) => out.push((pass ? "  ok    " : "  FAIL  ") + name + (extra && !pass ? ": " + extra : ""));
const shape = r => JSON.stringify({ status: r.status, statusText: r.statusText, error: r.error ? { code: r.error.code, message: r.error.message } : null, rows: Array.isArray(r.data) ? r.data.length : typeof r.data });
const same = (a, b) => JSON.stringify(a.data) === JSON.stringify(b.data) && shape(a) === shape(b);
const wait = (f, ms) => new Promise(r => { const t0 = Date.now(); (function p(){ if (f() || Date.now() - t0 > ms) r(f()); else setTimeout(p, 100); })(); });

let a = await A.rpc("get_hub_overrides"), b = await B.rpc("get_hub_overrides");
ok("rpc(): a read-only function answers the same", same(a, b) && !b.error, shape(b));
a = await A.rpc("sh_no_such_function", { p_visitor: "x" }); b = await B.rpc("sh_no_such_function", { p_visitor: "x" });
ok("rpc(): a function that isn't there gives the same error (PGRST202, 404: what the pages test for)", same(a, b) && b.status === 404 && b.error && b.error.code === "PGRST202", shape(b));
a = await A.from("question_stats").select("qid,attempts,correct").eq("hub", "occlusion").in("qid", ["q1-01", "q1-02", "q1-03"]);
b = await B.from("question_stats").select("qid,attempts,correct").eq("hub", "occlusion").in("qid", ["q1-01", "q1-02", "q1-03"]);
ok("from().select().eq().in() answers the same", same(a, b) && !b.error, shape(b));
a = await A.from("mode_stats").select("mode,opens").eq("hub", "occlusion"); b = await B.from("mode_stats").select("mode,opens").eq("hub", "occlusion");
ok("from().select().eq() answers the same", same(a, b) && !b.error, shape(b));
ok("the client says where it points (widget/ask.js reads it)", B.supabaseUrl === URL_ && B.supabaseKey === KEY && String(B.functionsUrl) === URL_ + "/functions/v1");

const topic = "presence:__client-check-" + Math.random().toString(36).slice(2);
const seen = { a: "", b: "", castA: null, castB: null, stA: [], stB: [] };
const ca = A.channel(topic, { config: { presence: { key: "full" } } }), cb = B.channel(topic, { config: { presence: { key: "slim" } } });
ca.on("presence", { event: "sync" }, () => { seen.a = Object.keys(ca.presenceState()).sort().join(","); });
cb.on("presence", { event: "sync" }, () => { seen.b = Object.keys(cb.presenceState()).sort().join(","); });
ca.on("broadcast", { event: "egg" }, m => { seen.castA = m.payload; });
cb.on("broadcast", { event: "egg" }, m => { seen.castB = m.payload; });
ca.subscribe(s => { seen.stA.push(s); if (s === "SUBSCRIBED") ca.track({ online_at: new Date().toISOString(), fit: null }); });
cb.subscribe(s => { seen.stB.push(s); if (s === "SUBSCRIBED") cb.track({ online_at: new Date().toISOString(), fit: { hat: 1 } }); });
await wait(() => seen.a === "full,slim" && seen.b === "full,slim", 15000);
ok("subscribe(): SUBSCRIBED on both", seen.stA.includes("SUBSCRIBED") && seen.stB.includes("SUBSCRIBED"), seen.stA + " / " + seen.stB);
ok("presence: each client sees both", seen.a === "full,slim" && seen.b === "full,slim", seen.a + " / " + seen.b);
const st = ca.presenceState();
ok("presence: what the slim client tracks arrives whole", !!(st.slim && st.slim[0] && st.slim[0].fit && st.slim[0].fit.hat === 1 && st.slim[0].online_at));
cb.send({ type: "broadcast", event: "egg", payload: { t: "from-slim" } });
ca.send({ type: "broadcast", event: "egg", payload: { t: "from-full" } });
await wait(() => seen.castA && seen.castB, 8000);
ok("broadcast: slim to full and full to slim", !!(seen.castA && seen.castA.t === "from-slim" && seen.castB && seen.castB.t === "from-full"));
await cb.untrack(); await wait(() => seen.a === "full", 8000);
ok("untrack(): the full client sees the slim one leave", seen.a === "full", seen.a);
await B.removeChannel(cb); await A.removeChannel(ca);
const bad = out.filter(l => l.startsWith("  FAIL")).length;
console.log(`${bad ? "✗" : "✓"} ${liteFile} against the real server, beside ${fullFile}: ${out.length - bad} of ${out.length} checks\n` + out.join("\n"));
process.exit(bad ? 1 : 0);
