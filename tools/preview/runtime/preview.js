/* ============ STUDY HUBS PREVIEW RUNTIME ============
   Loaded first in <head> of every page of a preview, and only there: the live site never references this file.
   tools/preview/transform.js injects it and puts window.SH_PREVIEW_CONFIG above it. RELEASE_TEST_PLAN.md says why.

   What it does:
     - Guard: any fetch, XHR, beacon, WebSocket or EventSource aimed at the production Supabase project (or any other
       supabase.co project that isn't the configured staging one) is refused, logged and counted in the ribbon.
       The page's CSP and the rewritten URLs already stop it; this is the layer that tells you it happened.
     - Fixtures: in fixture mode the rewritten Supabase host (fixtures.preview.invalid) is answered right here, the way
       PostgREST would answer it, from synthetic data in this browser's localStorage. Nothing leaves the browser.
     - Test accounts (personas), time travel, a "class data" speed switch (normal, slow, unreachable) and a write log
       of everything the page tried to save, in a small panel opened from the Preview button.
   window.__shPreview is the handle the automated tests use (tools/ci/preview.js, tools/release/*.js). */
(function(){
  "use strict";
  if (window.__shPreview) return;
  var C = window.SH_PREVIEW_CONFIG || {};
  var PERSONAS = C.personas || [];
  var K = { db: "sh_preview_db_v1", log: "sh_preview_log_v1", persona: "sh_preview_persona", now: "sh_preview_now", ui: "sh_preview_ui", blocked: "sh_preview_blocked" };
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function jget(k, d){ try { var v = JSON.parse(lsGet(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var ui = {};
  var script = document.currentScript;
  var ROOT = script && script.src ? script.src.replace(/__preview\/preview\.js(\?.*)?$/, "") : location.origin + "/";
  document.documentElement.setAttribute("data-sh-preview", C.data || "fixture");

  /* ---------- 1. time travel: ?now=2026-11-19T21:00 (local time), kept until "Back to now" ---------- */
  var RealDate = Date, realNow = RealDate.now.bind(RealDate);
  function nowOffset(){ var o = Number(jget(K.now, { offset: 0 }).offset); return isFinite(o) ? o : 0; }
  function setNow(local){
    var t = new RealDate(local).getTime();
    if (!isFinite(t)) return false;
    jset(K.now, { offset: t - realNow(), set: local });
    return true;
  }
  function clearNow(){ lsSet(K.now, null); }

  /* ---------- 2. query parameters: ?persona=<id>, ?now=<local datetime>, ?now=real ---------- */
  var params = new URLSearchParams(location.search), cleaned = false;
  function persona(id){ for (var i = 0; i < PERSONAS.length; i++) if (PERSONAS[i].id === id) return PERSONAS[i]; return null; }
  if (params.has("now")) {
    var nv = params.get("now");
    if (nv === "real" || nv === "") clearNow(); else setNow(nv);
    params.delete("now"); cleaned = true;
  }
  var wantPersona = params.get("persona");
  if (wantPersona != null) { params.delete("persona"); cleaned = true; }
  if (cleaned) { try { history.replaceState(history.state, "", location.pathname + (params.toString() ? "?" + params : "") + location.hash); } catch (e) {} }

  var OFFSET = nowOffset();
  if (OFFSET) {
    var shifted = function(){ return realNow() + OFFSET; };
    /* a Proxy keeps `x instanceof Date`, Date.UTC, Date.parse and the prototype exactly as they were */
    window.Date = new Proxy(RealDate, {
      construct: function(T, args, nt){ return args.length ? Reflect.construct(T, args, nt) : Reflect.construct(T, [shifted()], nt); },
      apply: function(){ return new RealDate(shifted()).toString(); },
      get: function(T, p){ return p === "now" ? shifted : Reflect.get(T, p); }
    });
  }

  /* ---------- 3. test accounts ---------- */
  function applyPersona(id){
    var p = persona(id) || persona("returning") || PERSONAS[0];
    if (!p) return;
    var keep = {}; [K.now, K.ui, K.log, K.blocked].forEach(function(k){ keep[k] = lsGet(k); });
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    Object.keys(keep).forEach(function(k){ lsSet(k, keep[k]); });
    lsSet("sh_visitor_id", p.visitor);
    if (p.skipTour) { lsSet("sh_tour", "no"); lsSet("sh_tour_hub", "no"); }
    if (p.admin && C.adminSecret) { try { sessionStorage.setItem("sh_admin_secret", C.adminSecret); } catch (e) {} }
    lsSet(K.persona, p.id);
    jset(K.db, freshDb(p));
    logEntry("persona", "switched to " + p.name, {});
  }
  function freshDb(p){
    var inbox = (p.inbox || []).map(function(m, i){
      var at = new RealDate(realNow() + OFFSET - (m.daysAgo || 0) * 864e5).toISOString();
      return { kind: m.kind || "flag", id: 9000 + i, hub: m.hub || null, title: m.title || null, note: m.note || null, message: m.message || null, at: at, seen: false, expires_at: null };
    });
    return { v: 1, persona: p.id, visitor: p.visitor, name: p.displayName || null, xp: p.xp || 0, badges: p.badges || [], answers: {}, gen: {}, hubMeta: {},
      pins: {}, inbox: inbox, cls: {}, picks: {}, flags: [], suggestions: [], comments: {}, reactions: {}, arcade: {}, surveys: {}, notices: [], achievements: [], links: {} };
  }

  /* ---------- 4. the write log ---------- */
  var MAX_LOG = 300;
  function logEntry(kind, name, detail){
    var log = jget(K.log, []);
    log.push({ t: new RealDate(realNow()).toISOString(), page: location.pathname.replace(/^.*?(hubs\/[^/]+\/|review\/|about\/|$)/, "$1") || "dashboard", kind: kind, name: name, detail: brief(detail) });
    if (log.length > MAX_LOG) log = log.slice(-MAX_LOG);
    jset(K.log, log);
    if (ui.refresh) ui.refresh();
  }
  function brief(d){
    try { var s = JSON.stringify(d); return s && s.length > 240 ? s.slice(0, 237) + "..." : s; } catch (e) { return String(d); }
  }

  var stored = lsGet(K.persona);
  if (wantPersona != null || !stored || !persona(stored)) applyPersona(wantPersona || stored || "returning");
  var P = persona(lsGet(K.persona)) || PERSONAS[0] || { id: "none", name: "None", visitor: "preview-visitor" };
  var db = jget(K.db, null);
  if (!db || db.v !== 1 || db.visitor !== P.visitor) { db = freshDb(P); jset(K.db, db); }
  function save(){ jset(K.db, db); }

  /* ---------- 5. the guard ---------- */
  var blocked = Number(lsGet(K.blocked) || 0);
  function classify(raw){
    var u; try { u = new URL(raw, location.href); } catch (e) { return { v: "pass" }; }
    var h = u.hostname.toLowerCase();
    if (h === C.fixtureHost) return { v: "fixture", u: u };
    if (C.stagingHost && h === C.stagingHost) return { v: "pass", u: u };
    if (/(^|\.)supabase\.(co|in|net)$/.test(h)) return { v: "blocked", u: u };   /* production, or any project but staging */
    return { v: "pass", u: u };
  }
  function block(u, how){
    blocked++; lsSet(K.blocked, String(blocked));
    logEntry("blocked", how + " " + u.host + u.pathname, {});
    try { console.error("[preview] blocked a " + how + " to " + u.host + ": a preview never talks to production"); } catch (e) {}
  }
  /* pretend automated browsers are people: in a preview every write path should run, since none reaches production
     (widget/v3.js skips record_* when navigator.webdriver is set, to keep test runs out of the live analytics) */
  try { Object.defineProperty(Navigator.prototype, "webdriver", { get: function(){ return false; }, configurable: true }); } catch (e) {}

  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function(input, init){
    var url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
    var c = classify(url);
    if (c.v === "blocked") { block(c.u, "fetch"); return Promise.reject(new TypeError("Blocked by the preview: " + c.u.host + " is not allowed here")); }
    if (c.v === "fixture") {
      var method = (init && init.method) || (input && input.method) || "GET";
      var bodyP = init && init.body != null ? Promise.resolve(String(init.body)) : input && typeof input.clone === "function" && method !== "GET" ? input.clone().text() : Promise.resolve("");
      return bodyP.then(function(body){ return fixtureResponse(c.u, method.toUpperCase(), body); });
    }
    return realFetch(input, init);
  };
  if (window.XMLHttpRequest) {
    var xopen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m, url){
      var c = classify(url);
      if (c.v !== "pass") { if (c.v === "blocked") block(c.u, "XHR"); else logEntry("read", "XHR " + c.u.pathname, {}); throw new Error("Blocked by the preview"); }
      return xopen.apply(this, arguments);
    };
  }
  if (navigator.sendBeacon) {
    var beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data){
      var c = classify(url);
      if (c.v === "blocked") { block(c.u, "beacon"); return false; }
      if (c.v === "fixture") { logEntry("write", "beacon " + c.u.pathname, {}); return true; }
      return beacon(url, data);
    };
  }
  function FakeSocket(url){ this.url = url; this.readyState = 0; this.protocol = ""; this.extensions = ""; this.bufferedAmount = 0; this.binaryType = "blob"; }
  FakeSocket.prototype = { send: function(){}, close: function(){ this.readyState = 3; }, addEventListener: function(){}, removeEventListener: function(){}, dispatchEvent: function(){ return true; } };
  FakeSocket.CONNECTING = 0; FakeSocket.OPEN = 1; FakeSocket.CLOSING = 2; FakeSocket.CLOSED = 3;
  var wsLogged = false;
  if (window.WebSocket) {
    var RealWS = window.WebSocket;
    var WS = function(url, protocols){
      var c = classify(String(url).replace(/^ws/, "http"));
      if (c.v === "blocked") { block(c.u, "WebSocket"); return new FakeSocket(url); }
      /* realtime (who's online, nukes, bosses) has no fixture: it stays "connecting" and the page falls back to 1 online */
      if (c.v === "fixture") { if (!wsLogged) { wsLogged = true; logEntry("read", "realtime (not simulated)", {}); } return new FakeSocket(url); }
      return protocols !== undefined ? new RealWS(url, protocols) : new RealWS(url);
    };
    WS.prototype = RealWS.prototype; WS.CONNECTING = 0; WS.OPEN = 1; WS.CLOSING = 2; WS.CLOSED = 3;
    window.WebSocket = WS;
  }
  if (window.EventSource) {
    var RealES = window.EventSource;
    window.EventSource = function(url, o){ var c = classify(url); if (c.v !== "pass") { if (c.v === "blocked") block(c.u, "EventSource"); throw new Error("Blocked by the preview"); } return new RealES(url, o); };
    window.EventSource.prototype = RealES.prototype;
  }
  document.addEventListener("securitypolicyviolation", function(e){
    if (/^(connect|img|media)-src/.test(e.violatedDirective || e.effectiveDirective || "")) {
      blocked++; lsSet(K.blocked, String(blocked)); logEntry("blocked", "CSP " + e.blockedURI, {});
    }
  });

  /* ---------- 6. narration a hosted preview left out comes from the live site's static copy (plain GETs) ---------- */
  var AUD = C.audio || { mode: "local" };
  if (AUD.mode === "remote" && C.liveSite) {
    var included = {}; (AUD.included || []).forEach(function(p){ included[p] = 1; });
    var mapMedia = function(src){
      try {
        var u = new URL(src, location.href);
        if (u.href.indexOf(ROOT) !== 0) return src;
        var rel = u.href.slice(ROOT.length).split(/[?#]/)[0];
        if (!/\.(mp3|mp4|webm)$/i.test(rel) || included[rel]) return src;
        return C.liveSite + rel;
      } catch (e) { return src; }
    };
    var srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
    if (srcDesc && srcDesc.set) Object.defineProperty(HTMLMediaElement.prototype, "src", { get: srcDesc.get, set: function(v){ srcDesc.set.call(this, mapMedia(v)); }, configurable: true });
    var RealAudio = window.Audio;
    window.Audio = function(src){ return src === undefined ? new RealAudio() : new RealAudio(mapMedia(src)); };
    window.Audio.prototype = RealAudio.prototype;
    var setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(n, v){
      if (String(n).toLowerCase() === "src" && (this instanceof HTMLMediaElement || this instanceof HTMLSourceElement)) v = mapMedia(v);
      return setAttr.call(this, n, v);
    };
  }

  /* ---------- 7. fixture data: answers PostgREST-style requests from synthetic data ---------- */
  function hash(s){ var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function now(){ return Date.now(); }
  function iso(ms){ return new RealDate(ms).toISOString(); }
  function day(ms){ var d = new RealDate(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var FAKE_NAMES = ["Fixture Fluoride", "Sample Sealant", "Test Tubercle", "Mock Mandible", "Dummy Dentin", "Stub Sulcus", "Placeholder Pulp", "Example Enamel", "Synthetic Cingulum", "Trial Torus", "Pretend Papilla", "Model Mesial"];
  var TIER_AT = [0, 300, 1500, 5000, 12000, 25000, 50000, 125000];
  function tierOf(xp){ var t = 0; for (var i = 0; i < 7; i++) if (xp >= TIER_AT[i]) t = i; return t; }
  function stepOf(xp){ var t = tierOf(xp), lo = TIER_AT[t], hi = TIER_AT[t + 1]; return Math.min(20, t * 3 + Math.min(2, Math.floor((xp - lo) * 3 / (hi - lo)))); }
  function stepAt(st){ var t = Math.floor(Math.min(st, 20) / 3), lo = TIER_AT[t], hi = TIER_AT[t + 1]; return lo + Math.floor((hi - lo) * (st - t * 3) / 3); }

  function hubExport(hub){
    var E = window.SH_EXPORT;
    if (!E || !Array.isArray(E.questions) || location.pathname.indexOf("/hubs/" + hub + "/") < 0) return null;
    return E;
  }
  function hubArchived(E){
    var last = null;
    (E.exams || []).forEach(function(x){
      if (!x || !x.date) return; var p = String(x.date).split("-").map(Number);
      var d = new RealDate(p[0], p[1] - 1, p[2], x.archiveHour != null ? x.archiveHour : 22).getTime();
      if (last === null || d > last) last = d;
    });
    if (E.archiveOn && E.archiveOn.date) { var q = String(E.archiveOn.date).split("-").map(Number); last = new RealDate(q[0], q[1] - 1, q[2], E.archiveOn.hour != null ? E.archiveOn.hour : 22).getTime(); }
    return last !== null && now() >= last;
  }
  function spec(archived){ var a = P.answers || {}; return archived ? a.archived : a.live; }
  function answersFor(hub){
    if (!db.gen[hub]) {
      var E = hubExport(hub);
      if (!E) return db.answers[hub] || [];
      var archived = hubArchived(E), s = spec(archived), rows = db.answers[hub] || [], r = rng(hash(P.id + "|" + hub));
      db.hubMeta[hub] = { archived: archived, n: E.questions.length };
      if (s) {
        var span = Math.max(1, s.days || 1) * 864e5, start = now() - span;
        E.questions.forEach(function(q){
          if (!q || !q.id || r() >= s.share) return;
          var tries = 1 + Math.floor(r() * 3), t = start + r() * span * 0.9;
          for (var i = 0; i < tries; i++) {
            var ok = i === tries - 1 ? r() < s.accuracy : r() < s.accuracy * 0.6;
            rows.push([q.id, Math.floor(t / 1000), ok ? 1 : 0, 1]); t += r() * span * 0.1 / tries;   /* 4th = generated: no extra XP */
          }
        });
        rows.sort(function(a, b){ return a[1] - b[1]; });
      }
      db.answers[hub] = rows; db.gen[hub] = 1;
      if (P.pins && !db.pins[hub]) { db.pins[hub] = {}; rows.slice(-P.pins).forEach(function(x){ db.pins[hub][x[0]] = [1, x[1] * 1000]; }); }
      save();
    }
    return db.answers[hub] || [];
  }
  function allAnswers(){ var out = []; Object.keys(db.answers).forEach(function(h){ (db.answers[h] || []).forEach(function(a){ out.push([h, a[0], a[1], a[2], a[3]]); }); }); return out; }
  /* the account's starting XP, plus a little for each answer given in this preview (the server's real rule is per day) */
  function myXp(){ var extra = 0; allAnswers().forEach(function(a){ if (!a[4]) extra += a[3] ? 3 : 1; }); return (db.xp || 0) + extra; }
  function classStat(hub, qid){
    var h = hash(hub + "|" + qid), attempts = 12 + h % 49, correct = Math.round(attempts * (0.35 + (h >>> 8) % 61 / 100));
    var d = db.cls[hub + "|" + qid]; if (d) { attempts += d[0]; correct += d[1]; }
    return { qid: qid, attempts: attempts, correct: correct };
  }
  function choiceRows(hub, qid){
    var E = hubExport(hub), q = null;
    if (E) for (var i = 0; i < E.questions.length; i++) if (E.questions[i].id === qid) { q = E.questions[i]; break; }
    var n = q && Array.isArray(q.choices) ? q.choices.length : 4, key = q && typeof q.answer === "number" ? q.answer : 0, st = classStat(hub, qid), rows = [];
    var wrong = st.attempts - st.correct, h = hash("c|" + hub + qid);
    for (var c = 0; c < n; c++) {
      var picks = c === key ? st.correct : Math.max(0, Math.round(wrong * (((h >>> (c * 3)) & 7) + 1) / (n * 4.5)));
      var extra = db.picks[hub + "|" + qid + "|" + c] || 0;
      rows.push({ qid: qid, choice: c, picks: picks + extra });
    }
    return rows;
  }

  var ADMIN_FNS = /^(admin_|get_reports$|get_visitor_|get_nuke_(summary|by_hub|recent|unlocks)$|get_click_summary$|get_survey_results$|get_exam_debriefs$|get_search_terms$|get_feature_events$|set_report_resolved$|get_hub_recap$|get_insights$|get_insight_retries$|get_data_quality$)/;
  function unauthorized(){ return { error: { status: 401, code: "28000", message: "unauthorized" } }; }
  function synthAdmin(fn){
    var d = 864e5, t = now();
    switch (fn) {
      case "get_visitor_summary": return [{ unique_visitors: 64, total_visits: 410, avg_visit_minutes: 17.5 }];
      case "get_visitor_by_hub": return ["occlusion", "perio", "pcd-implants-exam1", "special-patient-care"].map(function(h, i){ return { hub: h, unique_visitors: 40 - i * 6, total_visits: 200 - i * 30, total_minutes: 1800 - i * 250 }; });
      case "get_reports":
        return db.flags.map(function(f){ return { kind: "flag", id: f.id, hub: f.hub, note: f.note, resolved: !!f.resolved, created_at: f.at, reply: f.reply || null, resolved_at: f.resolved_at || null, can_notify: true, reply_seen_at: null }; })
          .concat(db.suggestions.map(function(s){ return { kind: "suggestion", id: s.id, hub: s.hub, note: s.note, resolved: !!s.resolved, created_at: s.at, reply: s.reply || null, resolved_at: null, can_notify: true, reply_seen_at: null }; }))
          .concat([{ kind: "flag", id: 8801, hub: "occlusion", note: "Fixture report: choice B and C read the same.", resolved: false, created_at: iso(t - d), reply: null, resolved_at: null, can_notify: true, reply_seen_at: null },
                   { kind: "suggestion", id: 8802, hub: "dashboard", note: "Fixture suggestion: a dark mode for the arcade.", resolved: false, created_at: iso(t - 2 * d), reply: null, resolved_at: null, can_notify: true, reply_seen_at: null }]);
      case "admin_pod_comments": return [{ id: 7701, hub: "pcd-implants-exam1", ep: "timmy-time", name: "Sample Sealant", body: "Fixture comment to hide or restore.", at: iso(t - d), hidden: false, reports: 1 }];
      case "get_insights": case "get_insight_retries": case "get_data_quality": return synthInsights(fn, t, d);
      default: return [];
    }
  }
  /* the admin page's Insights tab (migration_v49): every number made up, shaped like the real responses; a few cross
     their thresholds on purpose so the flags and decision lists show, and one hub has too few people to be listed */
  function synthInsights(fn, t, d){
    var H = [["special-patient-care", 14, 5, 9], ["pcd-implants-exam1", 58, 2, 3], ["occlusion", 96, -14, 28], ["perio", 88, -34, 52], ["heme-endo-exam1", 72, -5, 20], ["genetics", 3, -60, 70]];
    function ex(o){ return day(t + o * d); }
    if (fn === "get_insight_retries") return {
      by_gap: [["under 10 min", "missed", 900, 790], ["under 10 min", "right", 160, 151], ["10 min to 1 day", "missed", 700, 570], ["10 min to 1 day", "right", 1400, 1316],
               ["1 to 3 days", "missed", 260, 190], ["1 to 3 days", "right", 900, 830], ["3+ days", "missed", 80, 55], ["3+ days", "right", 300, 272]].map(function(r){ return { gap: r[0], after: r[1], n: r[2], ok: r[3] }; }),
      by_hub: H.map(function(h, i){ var n = h[1] * 60; return { hub: h[0], first_tries: n, first_ok: Math.round(n * (0.86 - i * 0.02)), retries: h[1] * 25, retries_of_right: Math.round(h[1] * 25 * (0.35 + i * 0.06)),
        quick_retries_of_missed: h[1] * 3, quick_retries_of_missed_ok: Math.round(h[1] * 2.6), late_retries_of_missed: h[1], late_retries_of_missed_ok: Math.round(h[1] * 0.72) }; }) };
    if (fn === "get_data_quality") return {
      generated_at: iso(t), last_write: { activity_pings: iso(t - 3e5), personal_answers: iso(t - 6e5), ui_clicks: iso(t - 4e5), feature_events: iso(t - 9e5), search_terms: iso(t - 9 * d), exam_debriefs: iso(t - 5 * d), mock_scores: iso(t - d), question_flags: iso(t - 2 * d), survey_responses: iso(t - 20 * d) },
      test_rows: { activity_hourly: 12, feature_events: 0, personal_answers: 4, ui_clicks: 0 },
      unmapped_sections: [{ hub: "occlusion", section: "compendium/new-view", pings: 40, last_day: ex(-2) }],
      event_families: [{ family: "pod", kinds: 6, people: 30, first_day: ex(-15), last_day: ex(0) }, { family: "sample-new", kinds: 2, people: 8, first_day: ex(-3), last_day: ex(0) }, { family: "old-thing", kinds: 1, people: 6, first_day: ex(-40), last_day: ex(-20) }],
      overcount: { visitor_hours: 14, excess_minutes: 95 }, alias_writes: { activity_pings: 120, personal_answers: 40 }, identity: { visitor_ids: 410, linked_aliases: 22 },
      choices_missing: [{ hub: "heme-endo-exam1", no_choices: 3, answered_20: 140 }], stats_drift: [],
      storage: { database_mb: 210, pings_last_7_days: 52000, answers_last_7_days: 21000, tables: [{ table: "activity_pings", mb: 120, rows: 300000 }, { table: "personal_answers", mb: 30, rows: 130000 }, { table: "xp_seen", mb: 18, rows: 120000 }, { table: "ui_click_reach", mb: 9, rows: 40000 }] } };
    var hubs = H.map(function(h, i){ var p = h[1]; return { hub: h[0], exam: ex(h[2]), first_day: ex(Math.min(h[2], 0) - h[3]), last_day: ex(Math.min(0, h[2])), people: p, answerers: Math.round(p * (i ? 0.66 + i * 0.03 : 0.4)),
      answered_50: Math.round(p * 0.4), one_day: Math.round(p * 0.35), three_days: Math.round(p * (0.22 + i * 0.05)), under_5: Math.round(p * (i ? 0.18 + (i % 2) * 0.16 : 0.45)), median_mins: 25 + i * 15, p90_mins: 180 + i * 60, total_mins: p * (40 + i * 15),
      median_answers: 18 + i * 12, questions_seen: 300, attempts: p * 60, correct: p * 48, last3_pct: h[2] <= 0 ? 60 + i * 5 : null, mocks: Math.round(p * 0.3), mock_people: Math.round(p * 0.2), mock_avg_pct: 70 + i }; });
    var SF = [["notes", 0.38, 0.9], ["bank", 0.3, 0.75], ["home", 0.08, 0.95], ["mock", 0.06, 0.3], ["hints", 0.05, 0.35], ["cram", 0.05, 0.3], ["drill", 0.03, 0.12], ["podcast", 0.02, 0.1], ["arcade", 0.03, 0.12]], surfaces = [];
    hubs.forEach(function(h){ SF.forEach(function(f){ surfaces.push({ hub: h.hub, surface: f[0], mins: Math.round(h.total_mins * f[1]), people: Math.round(h.people * f[2]) }); }); });
    return { generated_at: iso(t), hubs: hubs, surfaces: surfaces,
      features: [{ hub: "dashboard", since: ex(-15), viewers: 120 }].concat(hubs.slice(0, 5)).map(function(h, i){ var v = h.viewers || h.people; return { hub: h.hub, since: ex(-15), viewers: v,
        tour_prompted: Math.round(v * 0.8), tour_started: Math.round(v * 0.1), tour_done: Math.round(v * 0.07), tour_declined: Math.round(v * 0.5), pod_play: i === 2 ? 20 : 0, pod_half: i === 2 ? 11 : 0, pod_end: i === 2 ? 6 : 0,
        listen_people: i ? 4 : 0, listen_mins: i ? 30 : 0, fig_seen: i ? Math.round(v * 0.6) : 0, fig_used: i ? Math.round(v * 0.4) : 0, highlighters: i ? Math.round(v * 0.1) : 0, pinners: i ? Math.round(v * 0.08) : 0,
        find_in_notes: i ? Math.round(v * 0.15) : 0, mind_maps: i ? 3 : 0, settings_people: Math.round(v * 0.9), pet_off: Math.round(v * 0.1), fx_off: Math.round(v * 0.02), eggs_off: 0 }; }),
      voice: [{ hub: "occlusion", reports: 30, open: 2, replied: 26, median_hours_to_resolve: 9, last_report: ex(-1) }, { hub: "perio", reports: 18, open: 0, replied: 18, median_hours_to_resolve: 14, last_report: ex(-6) }, { hub: null, reports: 7, open: 1, replied: 5, median_hours_to_resolve: 30, last_report: ex(-3) }],
      checkins: [{ hub: "occlusion", exam: ex(-14), people: 12, hub_people: 96, their_median_mins: 190, hub_median_mins: 55, avg_ready: 3.6, match: { "About right": 8, "Easier": 3, "Harder": 1 } },
                 { hub: "perio", exam: ex(-34), people: 22, hub_people: 88, their_median_mins: 120, hub_median_mins: 70, avg_ready: 3.9, match: { "About right": 15, "Harder": 7 } }],
      surveys: { responses: 60, declined: 25 } };
  }
  function rpc(fn, a){
    a = a || {};
    if (ADMIN_FNS.test(fn)) {
      if (a.p_secret !== C.adminSecret) return unauthorized();
      if (/^(admin_|set_report_resolved)/.test(fn)) {
        if (fn === "set_report_resolved") db.flags.concat(db.suggestions).forEach(function(r){ if (r.id === a.p_id) { r.resolved = a.p_resolved; r.reply = a.p_reply; } });
        if (fn === "admin_post_notice") db.notices.push({ title: a.p_title, message: a.p_message, at: iso(now()) });
        save(); return { write: true, data: null };
      }
      return { data: synthAdmin(fn) };
    }
    var v = a.p_visitor, hub = a.p_hub, t = now();
    switch (fn) {
      case "get_display_name": return { data: v === db.visitor ? db.name : null };
      case "set_display_name": if (v === db.visitor) { db.name = a.p_name; save(); } return { write: true, data: null };
      case "clear_display_name": if (v === db.visitor) { db.name = null; save(); } return { write: true, data: null };
      case "get_my_answers": return { data: v === db.visitor ? answersFor(hub) : [] };
      case "record_personal_answer":
        if (v === db.visitor) { answersFor(hub); (db.answers[hub] = db.answers[hub] || []).push([String(a.p_qid), Math.floor(t / 1000), a.p_correct ? 1 : 0]); save(); }
        return { write: true, data: null };
      case "record_answer": { var k = hub + "|" + a.p_qid, c = db.cls[k] || (db.cls[k] = [0, 0]); c[0]++; if (a.p_correct) c[1]++; save(); return { write: true, data: null }; }
      case "record_choice": { var kc = hub + "|" + a.p_qid + "|" + a.p_choice; db.picks[kc] = (db.picks[kc] || 0) + 1; save(); return { write: true, data: null }; }
      case "record_choices": (a.p_choices || a.p_picks || []).forEach(function(ch){ var kk = hub + "|" + a.p_qid + "|" + ch; db.picks[kk] = (db.picks[kk] || 0) + 1; }); save(); return { write: true, data: null };
      case "get_personal_stats": {
        var by = {}; answersFor(hub).forEach(function(r){ var dd = day(r[1] * 1000), x = by[dd] || (by[dd] = { answer_date: dd, attempts: 0, correct: 0 }); x.attempts++; x.correct += r[2]; });
        return { data: Object.keys(by).sort().map(function(k){ return by[k]; }) };
      }
      case "get_pet_days": {
        var byd = {}; allAnswers().forEach(function(r){ if (t - r[2] * 1000 > 70 * 864e5) return; var dd = day(r[2] * 1000), x = byd[dd] || (byd[dd] = { d: dd, attempts: 0, correct: 0 }); x.attempts++; x.correct += r[3]; });
        return { data: Object.keys(byd).sort().map(function(k){ return byd[k]; }) };
      }
      case "get_hub_mastery": {
        var hubs = {}; Object.keys(db.answers).forEach(function(h){ var last = {}; db.answers[h].forEach(function(r){ last[r[0]] = r[2]; });
          var ks = Object.keys(last); hubs[h] = { hub: h, seen: ks.length, latest_correct: ks.filter(function(q){ return last[q]; }).length }; });
        return { data: Object.keys(hubs).map(function(h){ return hubs[h]; }) };
      }
      case "get_rank_profile": {
        if (v !== db.visitor) return { data: { xp: 0, tier: 0, level: 1, step: 0, step_at: 0, next_at: 100, answers: 0, correct: 0, days: 0, badges: [] } };
        var xp = myXp(), st = stepOf(xp), tr = tierOf(xp), all = allAnswers(), days = {}; all.forEach(function(r){ days[day(r[2] * 1000)] = 1; });
        return { data: { xp: xp, tier: tr, level: st - tr * 3 + 1, step: st, step_at: stepAt(st), next_at: st < 20 ? stepAt(st + 1) : null, tier_at: TIER_AT[tr],
          answers: all.length, correct: all.filter(function(r){ return r[3]; }).length, days: Object.keys(days).length, best_days: Object.keys(days).length, best_run: 12,
          position: xp > 50000 ? 1 : xp > 2000 ? 9 : 31, of: 64, badges: (db.badges || []).concat(db.achievements) } };
      }
      case "get_rank_board": {
        var me = myXp(), rows = FAKE_NAMES.slice(0, 10).map(function(n, i){ return { display_name: n, xp: 52000 - i * 4100 - (hash(n) % 900), is_me: false }; });
        rows.push({ display_name: db.name || "You (preview)", xp: me, is_me: true });
        rows.sort(function(x, y){ return y.xp - x.xp; });
        return { data: rows.map(function(r, i){ var tr2 = tierOf(r.xp); return { rnk: i + 1, display_name: r.display_name, xp: r.xp, tier: tr2, level: stepOf(r.xp) - tr2 * 3 + 1, is_me: r.is_me, flair: null }; }).slice(0, a.p_limit || 10) };
      }
      case "get_leaderboard": return { data: FAKE_NAMES.slice(0, 8).map(function(n, i){ return { display_name: n, streak: 14 - i, total_answered: 900 - i * 70, tier: Math.max(0, 5 - i), level: 1 + i % 3, flair: null }; }) };
      case "get_arcade_leaderboard": {
        var key = hub + "|" + a.p_game, mine = db.arcade[key] || [];
        var board = FAKE_NAMES.slice(0, 6).map(function(n, i){ return { display_name: n, best: 4200 - i * 500, plays: 12 - i, is_me: false }; });
        if (mine.length) board.push({ display_name: db.name || "You (preview)", best: Math.max.apply(null, mine), plays: mine.length, is_me: true });
        board.sort(function(x, y){ return y.best - x.best; });
        return { data: board.map(function(r, i){ r.rnk = i + 1; return r; }).slice(0, a.p_limit || 10) };
      }
      case "submit_arcade_score": (db.arcade[hub + "|" + a.p_game] = db.arcade[hub + "|" + a.p_game] || []).push(Number(a.p_score) || 0); save(); return { write: true, data: null };
      case "get_my_pins": {
        if (v !== db.visitor) return { data: [] };
        answersFor(hub); var pm = db.pins[hub] || {};
        return { data: Object.keys(pm).map(function(q){ return [q, pm[q][0], pm[q][1]]; }) };
      }
      case "set_pins":
        if (v === db.visitor) { var pins = db.pins[hub] || (db.pins[hub] = {}); (a.p_pins || []).forEach(function(r){ if (Array.isArray(r) && r[0]) pins[r[0]] = [r[1] ? 1 : 0, +r[2] || 0]; }); save(); }
        return { write: true, data: null };
      case "get_my_inbox": return { data: v === db.visitor ? db.inbox.concat(db.notices.map(function(n, i){ return { kind: "notice", id: 9500 + i, hub: null, title: n.title, note: null, message: n.message, at: n.at, seen: false, expires_at: null }; })) : [] };
      case "mark_reply_seen": db.inbox.forEach(function(m){ if (m.id === a.p_id) m.seen = true; }); save(); return { write: true, data: null };
      case "get_active_survey": case "get_my_survey":
        if (!P.survey || db.surveys.answered) return { data: [] };
        return { data: [{ id: 501, title: "Preview survey (fixture)", starts_at: iso(t - 864e5), questions: [
          { id: "q1", kind: "scale", prompt: "How useful was the Daily Drill this week?", ends: ["Not useful", "Very useful"] },
          { id: "q2", kind: "choice", prompt: "Where do you study most?", options: ["Phone", "Laptop", "Tablet"] },
          { id: "q3", kind: "text", prompt: "Anything we should add before the next exam?" }] }] };
      case "submit_survey": db.surveys.answered = a; save(); return { write: true, data: null };
      case "pod_feed": {
        var pk = hub + "|" + a.p_ep, cm = db.comments[pk] || [], rx = db.reactions[pk] || { likes: 7, dislikes: 1, mine: null };
        return { data: { likes: rx.likes, dislikes: rx.dislikes, mine: rx.mine, comments: [
          { id: 7001, name: "Sample Sealant", body: "Fixture comment: the part on osseointegration finally clicked.", at: iso(t - 2 * 864e5), mine: false, reported: false },
          { id: 7002, name: "Mock Mandible", body: "Fixture comment: listened on the bus, twice.", at: iso(t - 864e5), mine: false, reported: false }].concat(cm) } };
      }
      case "pod_react": {
        var rk = hub + "|" + a.p_ep, r0 = db.reactions[rk] || (db.reactions[rk] = { likes: 7, dislikes: 1, mine: null }), vote = a.p_vote || a.p_kind || null;
        if (r0.mine === "like") r0.likes--; if (r0.mine === "dislike") r0.dislikes--;
        r0.mine = vote === r0.mine ? null : vote; if (r0.mine === "like") r0.likes++; if (r0.mine === "dislike") r0.dislikes++;
        save(); return { write: true, data: { likes: r0.likes, dislikes: r0.dislikes, mine: r0.mine } };
      }
      case "pod_comment": { var ck = hub + "|" + a.p_ep, row = { id: 7100 + (db.comments[ck] || []).length, name: db.name || "You (preview)", body: String(a.p_body || "").slice(0, 280), at: iso(t), mine: true, reported: false };
        (db.comments[ck] = db.comments[ck] || []).push(row); save(); return { write: true, data: row }; }
      case "pod_delete_comment": Object.keys(db.comments).forEach(function(k){ db.comments[k] = db.comments[k].filter(function(r){ return r.id !== a.p_id; }); }); save(); return { write: true, data: true };
      case "create_link_code": return { write: true, data: "PREV-" + String(hash(db.visitor) % 9000 + 1000) };
      case "redeem_link_code": return { write: true, data: null };
      case "record_achievement": if (a.p_kind && db.achievements.indexOf(a.p_kind) < 0) { db.achievements.push(a.p_kind + (hub ? ":" + hub : "")); save(); } return { write: true, data: null };
      case "get_published_recaps": case "get_golden_today": case "get_correct_streak_stats": case "get_trophy_stats": case "get_fairy_board": case "get_cavity_week": return { data: [] };
    }
    if (/^get_/.test(fn)) return { data: [] };
    return { write: true, data: null };
  }

  function parseList(s){
    var out = [], cur = "", q = false;
    for (var i = 0; i < s.length; i++) { var ch = s[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
      if (ch === "\\" && q) { cur += s[++i]; continue; }
      cur += ch; }
    out.push(cur); return out;
  }
  function table(name, u){
    var f = {}; u.searchParams.forEach(function(v, k){ if (k !== "select" && k !== "order" && k !== "limit" && k !== "offset") f[k] = v; });
    var hub = f.hub && /^eq\./.test(f.hub) ? f.hub.slice(3) : null;
    var ids = f.qid && /^in\.\(/.test(f.qid) ? parseList(f.qid.slice(4, -1)) : null, t = now();
    function qids(){ if (ids) return ids; var E = hub && hubExport(hub); return E ? E.questions.map(function(q){ return q.id; }) : []; }
    switch (name) {
      case "question_stats": return qids().map(function(q){ var s = classStat(hub, q); s.hub = hub; return s; });
      case "question_choices": var rows = []; qids().forEach(function(q){ rows = rows.concat(choiceRows(hub, q)); }); return rows;
      case "mode_stats": return ["home", "compendium", "bank", "mock", "arcade", "listen"].map(function(m, i){ return { mode: m, opens: 300 - i * 45 }; });
      case "presence_hourly": var hrs = []; for (var h = 0; h < 24; h++) hrs.push({ hour_of_day: h, ping_count: Math.round(40 + 160 * Math.max(0, Math.sin((h - 6) / 24 * 2 * Math.PI))) }); return hrs;
      case "changelog":
        var built = C.builtAt || iso(t);
        if (u.searchParams.get("limit") === "1") return [{ created_at: built }];
        return [{ hub: null, message: "Preview of " + (C.label || "this branch") + " (fixture changelog: the live site's entries aren't loaded).", created_at: built },
                { hub: "occlusion", message: "Fixture entry: a sample change to show how the list looks.", created_at: iso(t - 3 * 864e5) }];
      default: return [];
    }
  }
  var LATENCY = { normal: 60, slow: 2000, down: 0 };
  function fixtureResponse(u, method, body){
    var p = u.pathname, speed = (jget(K.ui, {}).speed) || "normal", res;
    function respond(status, data){
      var txt = status === 204 || data === undefined ? null : JSON.stringify(data);
      return new Response(txt, { status: status, headers: { "Content-Type": "application/json; charset=utf-8", "X-Preview-Fixture": "1" } });
    }
    if (speed === "down") { logEntry("read", "class data unreachable (simulated) " + p, {}); return Promise.reject(new TypeError("Failed to fetch (simulated by the preview)")); }
    var args = {}; try { args = body ? JSON.parse(body) : {}; } catch (e) {}
    var m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(p), tm = /^\/rest\/v1\/([a-z0-9_]+)$/.exec(p);
    if (m) {
      var r = rpc(m[1], args);
      logEntry(r.error ? "denied" : r.write ? "write" : "read", m[1], r.write || r.error ? args : {});
      res = r.error ? respond(r.error.status, { code: r.error.code, message: r.error.message, details: null, hint: null }) : r.data === null || r.data === undefined ? respond(200, null) : respond(200, r.data);
    } else if (tm && method === "GET") {
      logEntry("read", tm[1], {}); res = respond(200, table(tm[1], u));
    } else if (tm && method === "POST") {
      var row = Array.isArray(args) ? args[0] : args, t = now();
      if (tm[1] === "question_flags") db.flags.push({ id: 8000 + db.flags.length, hub: row.hub, note: row.note, at: iso(t) });
      if (tm[1] === "hub_suggestions") db.suggestions.push({ id: 8500 + db.suggestions.length, hub: row.hub, note: row.note, at: iso(t) });
      save(); logEntry("write", "insert " + tm[1], row); res = respond(201, undefined);
    } else if (tm) {
      logEntry("write", method.toLowerCase() + " " + tm[1], args); res = respond(204, undefined);
    } else if (/^\/realtime\/v1\/api\/broadcast/.test(p)) {
      logEntry("write", "broadcast", args); res = respond(202, undefined);
    } else if (/^\/auth\/v1\//.test(p)) {
      res = respond(200, {});
    } else {
      logEntry("read", "unknown fixture path " + p, {}); res = respond(404, { message: "not in the preview fixtures" });
    }
    return new Promise(function(ok){ setTimeout(function(){ ok(res); }, LATENCY[speed] || 60); });
  }

  /* ---------- 8. the ribbon and panel ---------- */
  function el(tag, attrs, html){ var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function(k){ e.setAttribute(k, attrs[k]); }); if (html != null) e.innerHTML = html; return e; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CSS = [
    ".shpv-frame{position:fixed;inset:0;border:3px dashed #c2410c;pointer-events:none;z-index:2147483646}",
    ".shpv-pill{position:fixed;left:12px;bottom:12px;z-index:2147483647;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:22px;border:2px solid #7c2d12;background:#c2410c;color:#fff;font:600 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)}",
    ".shpv-pill:focus-visible,.shpv-panel button:focus-visible,.shpv-panel select:focus-visible,.shpv-panel input:focus-visible,.shpv-panel summary:focus-visible{outline:3px solid #2563eb;outline-offset:2px}",
    ".shpv-pill.is-alert{background:#b91c1c;border-color:#450a0a}",
    ".shpv-pill.is-min{padding:0;width:44px;justify-content:center}",
    ".shpv-pill.is-min .shpv-pill-text{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}",
    "@media (max-width:700px){.shpv-pill{bottom:calc(76px + env(safe-area-inset-bottom,0px))}}",
    ".shpv-panel{position:fixed;left:12px;bottom:64px;z-index:2147483647;width:min(400px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;padding:16px;border-radius:12px;border:2px solid #c2410c;background:#fff;color:#1a1a1a;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);text-align:left}",
    "@media (max-width:700px){.shpv-panel{bottom:calc(128px + env(safe-area-inset-bottom,0px));max-height:calc(100vh - 150px)}}",
    ".shpv-panel h2{margin:0 0 4px;font-size:16px;color:inherit}.shpv-panel p{margin:6px 0}.shpv-panel label{display:block;font-weight:600;margin:12px 0 4px}",
    ".shpv-panel select,.shpv-panel input{width:100%;min-height:40px;font:inherit;padding:6px 8px;border:1px solid #6b7280;border-radius:8px;background:#fff;color:#1a1a1a;box-sizing:border-box}",
    ".shpv-panel button{min-height:40px;margin:6px 6px 0 0;padding:6px 12px;font:inherit;font-weight:600;border-radius:8px;border:1px solid #7c2d12;background:#fff7ed;color:#7c2d12;cursor:pointer}",
    ".shpv-panel .shpv-x{position:absolute;top:8px;right:8px;margin:0;min-width:40px;border-color:transparent;background:transparent;font-size:20px}",
    ".shpv-muted{color:#4b5563;font-size:13px}.shpv-bad{color:#b91c1c;font-weight:700}.shpv-ok{color:#166534;font-weight:600}",
    ".shpv-log{margin:6px 0 0;padding-left:20px;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-word}",
    ".shpv-log .k-blocked,.shpv-log .k-denied{color:#b91c1c}.shpv-log .k-write{color:#1d4ed8}",
    "@media (prefers-color-scheme:dark){.shpv-panel,.shpv-panel select,.shpv-panel input{background:#1f1f1f;color:#f3f3f3}.shpv-panel button{background:#3b1d0e;color:#fed7aa;border-color:#fb923c}.shpv-muted{color:#cbd5e1}.shpv-bad{color:#fca5a5}.shpv-ok{color:#86efac}.shpv-log .k-write{color:#93c5fd}.shpv-log .k-blocked,.shpv-log .k-denied{color:#fca5a5}}",
    "@media print{.shpv-frame,.shpv-pill,.shpv-panel{display:none}}"
  ].join("\n");
  function mount(){
    if (document.getElementById("shpv-pill")) return;
    document.head.appendChild(el("style", { id: "shpv-style" }, CSS));
    var st = jget(K.ui, {});
    document.body.appendChild(el("div", { "class": "shpv-frame", "aria-hidden": "true" }));
    var pill = el("button", { id: "shpv-pill", type: "button", "class": "shpv-pill" + (st.min ? " is-min" : ""), "aria-expanded": "false", "aria-controls": "shpv-panel" });
    pill.innerHTML = '<span aria-hidden="true">&#9888;</span><span class="shpv-pill-text">Preview · ' + esc(P.name) + '</span>';
    pill.setAttribute("aria-label", "Preview, not the live site. Test account: " + P.name + ". Open preview controls.");
    document.body.appendChild(pill);
    var panel = el("div", { id: "shpv-panel", "class": "shpv-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "shpv-title", hidden: "" });
    document.body.appendChild(panel);
    var nowSet = jget(K.now, null), isReview = /\/review\//.test(location.pathname);
    panel.innerHTML =
      '<button type="button" class="shpv-x" data-pv="close" aria-label="Close preview controls">&times;</button>' +
      '<h2 id="shpv-title">Preview of ' + esc(C.label || "this branch") + '</h2>' +
      '<p><b>Not the live site.</b> Nothing you do here reaches the class: answers, names, reports, comments and admin actions stay in this browser' + (C.data === "staging" ? ' and the staging database' : '') + '.</p>' +
      '<p class="shpv-muted">' + esc(C.ref || "") + (C.sha ? ' @ ' + esc(C.sha.slice(0, 7)) : '') + ' · built ' + esc((C.builtAt || "").replace("T", " ").slice(0, 16)) + ' UTC · class data: ' + (C.data === "staging" ? "staging database" : "fixtures (made-up data)") + '</p>' +
      '<p role="status" aria-live="polite" id="shpv-status"></p>' +
      (isReview && C.adminSecret ? '<p>Admin secret for this preview: <code>' + esc(C.adminSecret) + '</code>. <b>Never type the real admin secret into a preview.</b></p>' : '') +
      '<label for="shpv-persona">Test account</label><select id="shpv-persona">' + PERSONAS.map(function(p){ return '<option value="' + esc(p.id) + '"' + (p.id === P.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>' +
      '<p class="shpv-muted" id="shpv-summary"></p>' +
      '<button type="button" data-pv="persona">Switch to this account (resets its data)</button>' +
      '<label for="shpv-now">Pretend it\'s</label><input id="shpv-now" type="datetime-local" step="60" value="' + esc(nowSet && nowSet.set ? nowSet.set : "") + '">' +
      '<p class="shpv-muted">' + (OFFSET ? 'Time travel is on: the page thinks it is ' + esc(new RealDate(realNow() + OFFSET).toLocaleString()) + '.' : 'The real date and time.') + '</p>' +
      '<button type="button" data-pv="now">Apply and reload</button><button type="button" data-pv="realnow">Back to now</button>' + (P.suggestNow ? '<button type="button" data-pv="suggest">Use ' + esc(P.suggestNow.replace("T", " ")) + '</button>' : '') +
      '<label for="shpv-speed">Class data</label><select id="shpv-speed"><option value="normal">Normal</option><option value="slow">Slow (2 seconds per request)</option><option value="down">Unreachable</option></select>' +
      '<details id="shpv-logbox"><summary>What this site tried to save</summary><ol class="shpv-log" id="shpv-log" reversed></ol>' +
      '<button type="button" data-pv="copylog">Copy the log</button><button type="button" data-pv="clearlog">Clear the log</button></details>' +
      '<button type="button" data-pv="reset">Reset this account</button><button type="button" data-pv="min">' + (st.min ? "Show the label" : "Shrink this button") + '</button>';
    var sel = panel.querySelector("#shpv-persona"), sum = panel.querySelector("#shpv-summary"), speed = panel.querySelector("#shpv-speed");
    speed.value = st.speed || "normal";
    function showSummary(){ var p = persona(sel.value); sum.textContent = p ? p.summary : ""; }
    sel.addEventListener("change", showSummary); showSummary();
    speed.addEventListener("change", function(){ var s = jget(K.ui, {}); s.speed = speed.value; jset(K.ui, s); refresh(); });
    function open(on){
      panel.hidden = !on; pill.setAttribute("aria-expanded", String(on));
      if (on) { refresh(); var f = panel.querySelector("#shpv-persona"); if (f) f.focus(); } else pill.focus();
    }
    pill.addEventListener("click", function(){ open(panel.hidden); });
    panel.addEventListener("keydown", function(e){ if (e.key === "Escape") { e.stopPropagation(); open(false); } });
    panel.addEventListener("click", function(e){
      var b = e.target.closest("[data-pv]"); if (!b) return;
      var a = b.getAttribute("data-pv");
      if (a === "close") open(false);
      else if (a === "persona") { applyPersona(sel.value); location.reload(); }
      else if (a === "reset") { applyPersona(P.id); location.reload(); }
      else if (a === "now") { var v = panel.querySelector("#shpv-now").value; if (v && setNow(v)) location.reload(); }
      else if (a === "suggest") { setNow(P.suggestNow); location.reload(); }
      else if (a === "realnow") { clearNow(); location.reload(); }
      else if (a === "clearlog") { lsSet(K.log, null); lsSet(K.blocked, null); blocked = 0; refresh(); }
      else if (a === "copylog") { try { navigator.clipboard.writeText(JSON.stringify(jget(K.log, []), null, 1)); b.textContent = "Copied"; } catch (err) {} }
      else if (a === "min") { var s = jget(K.ui, {}); s.min = !s.min; jset(K.ui, s); pill.classList.toggle("is-min", s.min); b.textContent = s.min ? "Show the label" : "Shrink this button"; }
    });
    function refresh(){
      var log = jget(K.log, []), writes = log.filter(function(x){ return x.kind === "write"; }).length;
      pill.classList.toggle("is-alert", blocked > 0);
      var s = panel.querySelector("#shpv-status");
      s.innerHTML = blocked > 0 ? '<span class="shpv-bad">' + blocked + ' request' + (blocked === 1 ? '' : 's') + ' to production blocked. Report this: it is a bug.</span>'
        : '<span class="shpv-ok">No request has reached production.</span> ' + writes + ' save' + (writes === 1 ? '' : 's') + ' kept in this browser.';
      if (!panel.hidden) panel.querySelector("#shpv-log").innerHTML = log.slice(-60).reverse().map(function(x){
        return '<li class="k-' + esc(x.kind) + '">' + esc(x.t.slice(11, 19)) + ' ' + esc(x.kind) + ' <b>' + esc(x.name) + '</b> <span class="shpv-muted">' + esc(x.page) + '</span>' + (x.detail && x.detail !== "{}" ? ' ' + esc(x.detail) : '') + '</li>';
      }).join("");
    }
    ui.refresh = refresh; refresh();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();

  window.__shPreview = {
    config: C, persona: P, root: ROOT,
    log: function(){ return jget(K.log, []); }, blocked: function(){ return blocked; }, db: function(){ return db; },
    applyPersona: applyPersona, setNow: setNow, clearNow: clearNow, rpc: rpc
  };
})();
