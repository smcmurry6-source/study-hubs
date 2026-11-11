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
  var K = { db: "sh_preview_db_v1", log: "sh_preview_log_v1", persona: "sh_preview_persona", now: "sh_preview_now", ui: "sh_preview_ui", blocked: "sh_preview_blocked",
    ovr: "sh_preview_overrides_v1" };   /* hub archive overrides: site-wide, kept when the test account changes */
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
    var keep = {}; [K.now, K.ui, K.log, K.blocked, K.ovr].forEach(function(k){ keep[k] = lsGet(k); });
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    Object.keys(keep).forEach(function(k){ lsSet(k, keep[k]); });
    lsSet("sh_visitor_id", p.visitor);
    if (p.skipTour) { lsSet("sh_tour", "no"); lsSet("sh_tour_hub", "no"); }
    /* Timmy adopted that many days ago, so he shows on the hubs as for a student who adopted him (the new hubs load
       him only once he's adopted) */
    if (p.petDaysAgo != null) lsSet("sh_pet_born", new RealDate(realNow() + OFFSET - p.petDaysAgo * 864e5).toISOString().slice(0, 10));
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
  /* Keep the bootstrap response assembled from the same fixture shapes as its
     individual RPCs. This lets preview exercise the one-round-trip path without
     giving it a second, subtly different model of learner data. */
  function bootstrapPins(v, hub){
    if (v !== db.visitor) return [];
    answersFor(hub); var pm = db.pins[hub] || {};
    return Object.keys(pm).map(function(q){ return [q, pm[q][0], pm[q][1]]; });
  }
  function bootstrapInbox(v){
    return v === db.visitor ? db.inbox.concat(db.notices.map(function(n, i){
      return { kind: "notice", id: 9500 + i, hub: null, title: n.title, note: null, message: n.message, at: n.at, seen: false, expires_at: null };
    })) : [];
  }
  function bootstrapSurvey(t){
    if (!P.survey || db.surveys.answered) return [];
    return [{ id: 501, title: "Preview survey (fixture)", starts_at: iso(t - 864e5), questions: [
      { id: "q1", kind: "scale", prompt: "How useful was the Daily Drill this week?", ends: ["Not useful", "Very useful"] },
      { id: "q2", kind: "choice", prompt: "Where do you study most?", options: ["Phone", "Laptop", "Tablet"] },
      { id: "q3", kind: "text", prompt: "Anything we should add before the next exam?" }] }];
  }
  function bootstrapPetDays(t){
    var byd = {};
    allAnswers().forEach(function(r){
      if (t - r[2] * 1000 > 70 * 864e5) return;
      var dd = day(r[2] * 1000), x = byd[dd] || (byd[dd] = { d: dd, attempts: 0, correct: 0 });
      x.attempts++; x.correct += r[3];
    });
    return Object.keys(byd).sort().map(function(k){ return byd[k]; });
  }
  function bootstrapPodcast(hub, ep, t){
    if (!ep) return null;
    var pk = hub + "|" + ep, cm = db.comments[pk] || [], rx = db.reactions[pk] || { likes: 7, dislikes: 1, mine: null };
    return { likes: rx.likes, dislikes: rx.dislikes, mine: rx.mine, comments: [
      { id: 7001, name: "Sample Sealant", body: "Fixture comment: the part on osseointegration finally clicked.", at: iso(t - 2 * 864e5), mine: false, reported: false },
      { id: 7002, name: "Mock Mandible", body: "Fixture comment: listened on the bus, twice.", at: iso(t - 864e5), mine: false, reported: false }].concat(cm) };
  }
  function bootstrapWeek(){
    var by = {};
    allAnswers().forEach(function(r){
      var d = day(r[2] * 1000), x = by[d] || (by[d] = { answer_date: d, attempts: 0, correct: 0 });
      x.attempts++; x.correct += r[3];
    });
    return Object.keys(by).sort().map(function(k){ return by[k]; });
  }
  function widgetBootstrap(a, t){
    var v = a.p_visitor, hub = a.p_hub, ep = a.p_episode || a.p_ep || a.p_podcast;
    var dashboard = !!a.p_dashboard;
    if (v !== db.visitor) return { display_name: null, answers: [], pins: [], inbox: [], survey: [], overrides: [], pet_days: [], cavity: [], podcast: null, dashboard_week: [], survey_popup: [], exam_luck: null, recaps: [], golden: [], name_shared: false, rank: null, mastery: [] };
    var answers = answersFor(hub);
    return {
      display_name: db.name,
      answers: answers,
      pins: a.p_include_pins ? bootstrapPins(v, hub) : [],
      inbox: bootstrapInbox(v),
      survey: bootstrapSurvey(t),
      overrides: ovrStore().rows.filter(function(r){ return ovrActive(r, t); }).map(function(r){ return { hub: r.hub, state: r.state, until: r.until }; }),
      pet_days: bootstrapPetDays(t),
      cavity: [],
      podcast: bootstrapPodcast(hub, ep, t),
      dashboard_week: dashboard ? bootstrapWeek() : [],
      survey_popup: dashboard ? bootstrapSurvey(t) : [],
      exam_luck: dashboard && a.p_luck_hub && a.p_luck_date ? { count: 0, mine: false, recent: [] } : null,
      recaps: dashboard ? recapFixtures() : [],
      golden: [],
      name_shared: false,
      /* your own rank and mastery ride in the bootstrap too (Sam, 2026-11-06); same fixtures as the single calls */
      rank: rpc("get_rank_profile", { p_visitor: v }).data,
      mastery: hub ? rpc("get_hub_mastery", { p_visitor: v }).data : []
    };
  }
  /* two published recaps for the dashboard's slideshow: made-up totals in the shape get_hub_recap returns (the live
     site's are drawn from the class's real totals, which a preview never loads) */
  function recapFixtures(){
    function one(hub, title, color, exam, people, minutes, answers, correct){
      var byDay = [], byHour = [];
      for (var i = 9; i >= 0; i--) { var d = new Date(exam + "T12:00:00"); d.setDate(d.getDate() - i); byDay.push({ d: d.toISOString().slice(0, 10), minutes: Math.round(minutes * (10 - i) / 55) }); }
      for (var h = 0; h < 24; h++) byHour.push(h < 6 ? 2 : h < 12 ? 9 + h : h < 18 ? 14 + (h % 5) * 3 : 60 - Math.abs(20 - h) * 9);
      return { hub: hub, title: title, color: color, names: false, question: null, footnote: "Preview: made-up totals",
        data: { hub: hub, people: people, minutes: minutes, answers: answers, correct: correct, first_day: byDay[0].d, last_day: exam, exam_day: exam,
          by_day: byDay, by_hour: byHour, night_before: Math.round(minutes * .18), night_before_people: Math.round(people * .8), after_midnight: 6, regulars: Math.round(people * .6) } };
    }
    return [one("pcd-implants-exam1", "PCD Implants Exam 1", "#2f6f84", "2026-11-06", 58, 9120, 21480, 14820),
            one("heme-endo-exam1", "Heme & Endo Exam 1", "#a83232", "2026-10-30", 61, 11340, 26950, 17790)];
  }
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

  /* Question health (migration_v51, vault/reference/question-health.md): made-up flags on a few of the hub's real ids,
     one of each kind, plus an id that isn't in the hub. The admin page sends every live question as p_current; Sam's
     calls (admin_review_question) are kept in the fixtures, so the states move the way they do live. */
  var QH_KINDS = [
    { code: "miskey", sev: "high", mcq: true, why: "Possible miskey: choice %c (as written) was picked by 46%, the key by 19% (26 first tries).", also: { code: "below_chance", sev: "high", why: "Below chance: 19% right on the first try (26 people), less than guessing among 4 choices (25%). Check the key." } },
    { code: "upside_down", sev: "high", why: "Stronger students miss it more: 41% of the top half of the class got it right on the first try, 72% of the bottom half (17 and 18 people). Often a miskey or a trick of wording." },
    { code: "reported", sev: "high", why: "1 open report from students (Inbox).", report: "Fixture report: I think two of the choices say the same thing." },
    { code: "very_hard", sev: "medium", why: "Very hard: only 33% right on the first try (21 people). Is the stem clear and the key right?", also: { code: "missed_again", sev: "medium", why: "Missed again after seeing the answer: of 9 people who missed it, only 3 got it right the next time. The key, the explanation or the stem may be unclear." } },
    { code: "voted_confusing", sev: "medium", why: "3 people say the wording is confusing." },
    { code: "slow", sev: "low", why: "Slow: the median first try takes 71 s, 2.6 times the hub's median for this kind of question (27 s). Long or confusing stem?" },
    { code: "abandoned", sev: "low", why: "Often left unanswered: 6 of 14 people who read it for 8 s or more moved on without answering (hub: 9%)." },
    { code: "expl_skipped", sev: "low", why: "Explanation skipped: 9 of 11 who missed it left the explanation within 3 s. Too long, or not helpful?" }];
  function qhFixture(hub, cur){
    var reviews = db.qhReviews || {}, t = now(), out = [];
    var ids = Object.keys(cur && typeof cur === "object" ? cur : {}).sort(function(x, y){ return hash(hub + "|" + x) - hash(hub + "|" + y); });
    function info(q){ var c = cur[q]; return c && typeof c === "object" ? c : { v: String(c || "") }; }
    var mcq = ids.filter(function(q){ var c = info(q); return /^mcq/.test(c.qt || "") && typeof c.key === "number" && c.nch >= 3; });
    var used = {};
    QH_KINDS.forEach(function(k, i){
      var pool = k.mcq ? mcq : ids, q = null;
      for (var j = 0; j < pool.length; j++) if (!used[pool[j]]) { q = pool[j]; break; }
      if (!q) return; used[q] = 1;
      var c = info(q), h = hash("qh|" + hub + q), n1 = k.mcq ? 26 : k.code === "very_hard" ? 21 : 14 + h % 20, c1 = k.mcq ? 5 : Math.round(n1 * (k.code === "very_hard" ? 0.33 : 0.55));
      var flags = [{ code: k.code, sev: k.sev, src: k.code === "reported" || /^voted/.test(k.code) ? "feedback" : "version", why: k.why.replace("%c", String(((c.key || 0) + 1) % (c.nch || 4) + 1)) }];
      if (k.mcq) flags[0].choice = ((c.key || 0) + 1) % (c.nch || 4);
      if (k.also) flags.push({ code: k.also.code, sev: k.also.sev, src: "version", why: k.also.why });
      var choices = null;
      if (typeof c.key === "number" && c.nch) { choices = {}; var rest = n1 - c1 - (k.mcq ? 12 : 0), others = [];
        for (var x = 0; x < c.nch; x++) if (x !== c.key && !(k.mcq && x === flags[0].choice)) others.push(x);
        others.forEach(function(o, oi){ choices[o] = oi === others.length - 1 ? rest : Math.floor(rest / others.length); rest -= oi === others.length - 1 ? 0 : choices[o]; });
        choices[c.key] = c1; if (k.mcq) choices[flags[0].choice] = 12; }
      out.push({ hub: hub, qid: q, in_hub: true, v: c.v || "", versions: 1 + (i === 3 ? 1 : 0), v_since: iso(t - (20 + i) * 864e5), qt: c.qt || "", nch: c.nch || null, key: typeof c.key === "number" ? c.key : null,
        n1: n1, c1: c1, choices: choices, nr: n1 + 9, cr: c1 + 5, nrm: 9, crm: 3, nt: n1, med_ms: k.code === "slow" ? 71000 : 22000 + h % 12000, hub_med_ms: 27000, engaged: 14, abandoned: k.code === "abandoned" ? 6 : 1, hub_abandon: 0.09,
        answers: n1 + 9, miss_n: n1 - c1, miss_quick: k.code === "expl_skipped" ? 9 : 2, expl_med_ms: 6400, expl_acts: 0.2, du: 17, pu: 0.41, dl: 18, pl: 0.72,
        a_n1: null, a_c1: null, a_nrm: null, a_crm: null, a_du: null, a_pu: null, a_dl: null, a_pl: null, a_attempts: null, a_correct: null, a_choices: null,
        up: 2, down: k.code === "voted_confusing" ? 3 : 0, reasons: k.code === "voted_confusing" ? { confusing: 3 } : {}, reports_open: k.report ? 1 : 0,
        reports: k.report ? [{ id: 8900 + i, note: k.report, resolved: false, at: iso(t - 864e5), reply: null }] : null, flags: flags, score: flags.reduce(function(s, f){ return s + (f.sev === "high" ? 3 : f.sev === "medium" ? 2 : 1); }, 0) });
    });
    out.push({ hub: hub, qid: "fixture-renamed-id", in_hub: false, v: "old", versions: 1, v_since: iso(t - 40 * 864e5), qt: "mcq", nch: 4, key: 1, n1: 30, c1: 21, choices: null, up: 0, down: 0, reasons: {}, reports_open: 0, reports: null,
      flags: [{ code: "gone", sev: "low", src: "ids", why: "This id has class data but isn't in the hub any more. Renamed or removed? Ids are permanent (tools/question-ids/)." }], score: 1 });
    out.forEach(function(r){
      var rv = reviews[hub + "|" + r.qid], codes = r.flags.map(function(f){ return f.code; });
      r.review_status = rv ? rv.status : null; r.review_v = rv ? rv.v : null; r.review_flags = rv ? rv.flags : null; r.review_note = rv ? rv.note : null; r.review_at = rv ? rv.at : null;
      r.state = rv && rv.status === "fix" ? (rv.v === r.v ? "todo" : "changed")
        : rv && (rv.status === "ok" || rv.status === "fixed") && rv.v === r.v && codes.every(function(cd){ return (rv.flags || []).indexOf(cd) >= 0; }) ? "reviewed" : "new";
    });
    return out.sort(function(x, y){ return y.score - x.score; });
  }

  var ADMIN_FNS = /^(admin_|get_reports$|get_visitor_|get_nuke_(summary|by_hub|recent|unlocks)$|get_click_summary$|get_survey_results$|get_exam_debriefs$|get_search_terms$|get_feature_events$|set_report_resolved$|get_hub_recap$|get_insights$|get_insight_retries$|get_data_quality$|get_question_health$)/;
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
      case "admin_pod_comments": return [{ id: 7701, hub: "pcd-implants-exam1", ep: "timmy-time", name: "Sample Sealant", body: "Fixture comment to hide or restore.", created_at: iso(t - d), hidden: !!(db.podHidden || {})[7701], hidden_by: (db.podHidden || {})[7701] ? "admin" : null, reports: 1 },
        { id: 7702, hub: "occlusion", ep: "timmy-time", name: "Test Tubercle", body: "Fixture comment: the Bennett part finally clicked.", created_at: iso(t - 3 * d), hidden: false, hidden_by: null, reports: 0 }];
      /* the admin page's other views, so each one has something to show in a preview (made-up numbers) */
      case "get_visitor_by_section": {
        var secs = { occlusion: ["home/dashboard", "bank/practice", "compendium/l3", "mock/exam", "arcade/showdown", "notes/l1"],
                     perio: ["home/dashboard", "bank/practice", "notes/s6", "review/staging", "mock/exam"],
                     "pcd-implants-exam1": ["home/dashboard", "notes/l1", "bank/practice", "listen/timmy-time"],
                     "special-patient-care": ["bank/practice", "notes/l2", "home/dashboard"] }, out = [];
        Object.keys(secs).forEach(function(h, hi){ secs[h].forEach(function(sec, i){ out.push({ hub: h, section: sec, unique_visitors: 30 - hi * 4 - i * 3, total_minutes: Math.round((620 - hi * 90) / (i + 1.4)) }); }); });
        return out;
      }
      case "get_click_summary": {
        var tg = ["mode=bank", "mode=mock", "#bankShow-likely", "mode=notes", "widget:#shSearch", ".qcard-next", "mode=arcade", "#homeDrill"], outc = [];
        ["occlusion", "perio", "dashboard"].forEach(function(h, hi){ tg.forEach(function(x, i){ if (h === "dashboard" && i > 3) return; outc.push({ hub: h, target: h === "dashboard" ? ["open:occlusion", "open:perio", "about", "inbox"][i] : x, section: i % 2 ? "bank/practice" : "home/dashboard", clicks: Math.round((480 - hi * 120) / (i + 1)), people: Math.max(2, 34 - hi * 6 - i * 3) }); }); });
        return outc;
      }
      case "get_feature_events": return [
        { hub: "occlusion", kind: "view", people: 41, total: 690 }, { hub: "perio", kind: "view", people: 35, total: 510 },
        { hub: "occlusion", kind: "tts:start-full", people: 14, total: 52 }, { hub: "occlusion", kind: "tts:secs", people: 14, total: 9200 },
        { hub: "pcd-implants-exam1", kind: "pod:timmy-time:play", people: 11, total: 19 }, { hub: "pcd-implants-exam1", kind: "pod:timmy-time:q4", people: 6, total: 6 },
        { hub: "dashboard", kind: "egg:timmy-start", people: 4, total: 5 }, { hub: "occlusion", kind: "fig-seen:angle-classes", people: 22, total: 61 },
        { hub: "dashboard", kind: "name:set", people: 9, total: 9 }];
      case "get_search_terms": return [
        { hub: "occlusion", term: "bennett angle", searches: 14, hits: 6 }, { hub: "perio", term: "staging", searches: 11, hits: 9 },
        { hub: "occlusion", term: "curve of spee", searches: 8, hits: 3 }, { hub: "perio", term: "furcation grade", searches: 6, hits: 0 },
        { hub: "pcd-implants-exam1", term: "abutment", searches: 5, hits: 4 }, { hub: "occlusion", term: "fixture search with no result", searches: 3, hits: 0 }];
      case "get_nuke_summary": return [{ total_launches: 12, unique_launchers: 7 }];
      case "get_nuke_by_hub": return [{ hub: "occlusion", launches: 8 }, { hub: "perio", launches: 4 }];
      case "get_nuke_unlocks": return [{ hub: "occlusion", unlocks: 15, unused: 6 }, { hub: "perio", unlocks: 7, unused: 3 }];
      case "get_nuke_recent": return FAKE_NAMES.slice(0, 4).map(function(n, i){ return { display_name: n, hub: i % 2 ? "perio" : "occlusion", launched_at: iso(t - (i + 1) * 5 * 36e5) }; });
      case "get_insights": case "get_insight_retries": case "get_data_quality": return synthInsights(fn, t, d);
      default: return [];
    }
  }
  /* ---------- admin operations (migration_v50): live presence, hub archive overrides, newest-first check-ins ----------
     Overrides live in their own key (K.ovr), shared by every test account, so an admin can archive a hub on review/
     and a student account sees it on the dashboard. Check-ins and surveys arrive deliberately out of order (and with the
     newest group first by time but not by name), so the admin page's own sorting is what gets tested. */
  function ovrStore(){ var o = jget(K.ovr, null); if (!o || !Array.isArray(o.rows) || !Array.isArray(o.log)) o = { rows: [], log: [], seq: 0 }; return o; }
  function ovrActive(r, t){ return !r.until || new RealDate(r.until).getTime() > t; }
  function ovrVersion(r){ return String(Math.floor(new RealDate(r.set_at).getTime() * 1000)); }
  var ARCH_STATES = ["live", "archived", "hidden"];
  function adminOps(fn, a){
    var t = now(), o, i, cur, row;
    switch (fn) {
      case "admin_live_presence": {
        var min = Math.max(1, Math.min(15, Number(a.p_minutes) || 3));
        var hubs = [
          { hub: "occlusion", people: 3, names: ["Fixture Fluoride", "Mock Mandible", "Sample Sealant"] },
          { hub: "perio", people: 2, names: ["Dummy Dentin", "Sample Sealant"] },
          { hub: "pcd-implants-exam1", people: 1, names: [db.name || "Preview Admin"] }
        ];
        return { data: { minutes: min, as_of: iso(t), total: 5, hubs: hubs } };
      }
      case "admin_hub_overrides":
        o = ovrStore();
        return { data: o.rows.map(function(r){ var act = ovrActive(r, t); return { hub: r.hub, state: r.state, until: r.until, note: r.note, set_at: r.set_at, active: act, version: act ? ovrVersion(r) : "auto" }; }) };
      case "admin_hub_archive_log":
        o = ovrStore();
        return { data: o.log.slice().sort(function(x, y){ return (y.at < x.at ? -1 : y.at > x.at ? 1 : 0) || y.id - x.id; }).slice(0, Math.max(1, Math.min(200, Number(a.p_limit) || 50))) };
      case "admin_set_hub_archive": {
        var bad = function(msg, code){ return { error: { status: 400, code: code || "22023", message: msg } }; };
        if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(String(a.p_hub || ""))) return bad("bad hub id");
        if (a.p_state !== "auto" && ARCH_STATES.indexOf(a.p_state) < 0) return bad("bad state");
        var until = a.p_state === "auto" || !a.p_until ? null : new RealDate(a.p_until).toISOString();
        if (until && (new RealDate(until).getTime() <= t || new RealDate(until).getTime() > t + 400 * 864e5)) return bad("end time must be in the future, within 400 days");
        var note = String(a.p_note || "").trim() || null;
        if (note && note.length > 300) return bad("note is over 300 characters");
        o = ovrStore();
        for (i = 0; i < o.rows.length; i++) if (o.rows[i].hub === a.p_hub) cur = o.rows[i];
        var inForce = cur && ovrActive(cur, t), oldState = inForce ? cur.state : "auto", oldUntil = inForce ? cur.until : null, version = inForce ? ovrVersion(cur) : "auto";
        if (a.p_expect != null && a.p_expect !== version) return { error: { status: 409, code: "40001", message: "conflict: this hub was changed since the page loaded" } };
        if (a.p_state === oldState && (until || null) === (oldUntil || null)) return { data: { hub: a.p_hub, state: oldState, until: oldUntil, changed: false, version: version } };
        o.rows = o.rows.filter(function(r){ return r.hub !== a.p_hub; });
        if (a.p_state !== "auto") { row = { hub: a.p_hub, state: a.p_state, until: until, note: note, set_at: iso(t) }; o.rows.push(row); }
        o.seq = (o.seq || 0) + 1;
        o.log.push({ id: o.seq, hub: a.p_hub, old_state: oldState, old_until: oldUntil, new_state: a.p_state, new_until: until, note: note, at: iso(t) });
        jset(K.ovr, o);
        return { write: true, data: { hub: a.p_hub, state: a.p_state, until: until, changed: true, version: row ? ovrVersion(row) : "auto" } };
      }
      case "get_exam_debriefs": {
        var h = 36e5, mk = function(hub, exam, who, ago, ready, went, match, missed, more){ var a = { ready: ready, went: went, match: match, missed: missed };
          Object.keys(more || {}).forEach(function(k){ a[k] = more[k]; });
          return { hub: hub, exam: exam, visitor_id: "fixture-" + who, created_at: iso(t - ago),
          answers: a, minutes: 40 + (hash(who) % 300), answered: 30 + (hash(who + hub) % 400), accuracy: 55 + (hash(hub + who) % 40) }; };
        /* by time the groups go Heme & Endo (1 h ago), PCD Implants (5 h), Occlusion (2 days), Perio (20 days); by name they
           would go the other way round, and the rows inside each group arrive oldest first */
        return { data: [
          mk("perio", "2026-10-01 Midterm", "p1", 20 * 24 * h, 3, "About as expected", "About right", "Fixture: more staging pictures."),
          mk("occlusion", "2026-10-21 Midterm", "o2", 9 * 24 * h, 4, "Better than expected", "About right", "Fixture: more casts with contacts."),
          mk("occlusion", "2026-10-21 Midterm", "o1", 2 * 24 * h, 2, "Worse than expected", "Exam asked different things", "Fixture: the articulator settings."),
          mk("pcd-implants-exam1", "2026-11-06 Exam", "i2", 6 * h, 3, "Worse than expected", "Hub was easier", "Fixture: more CBCT questions.",
            { pbox_better: "none", diagrams: 4, helped: ["Why each choice", "Timmy Time"], changes: "Fine, I hardly noticed" }),
          mk("pcd-implants-exam1", "2026-11-06 Exam", "i1", 5 * h, 4, "About as expected", "About right", "Fixture: more abutment pictures.",
            { pbox_better: 4, diagrams: 5, helped: ["How the class answered each choice", "Why each choice", "High likelihood questions"], changes: "Good: keep improving it right up to the exam" }),
          mk("heme-endo-exam1", "2026-10-30 Exam", "e2", 3 * 24 * h, 3, "About as expected", "About right", "Fixture: the calcium drugs table."),
          mk("heme-endo-exam1", "2026-10-30 Exam", "e1", 1 * h, 5, "Better than expected", "About right", "Fixture: nothing, it was great.")
        ] };
      }
      case "get_survey_results":
        return { data: [
          { survey_id: 41, slug: "fixture-round-1", title: "Fixture survey, round 1 (older)", active: false, created_at: iso(t - 30 * 864e5), responses: 2, skipped: 1,
            questions: [{ id: "q1", kind: "choice", prompt: "Where do you study most?", options: ["Phone", "Laptop", "Tablet"] }], answers: [{ q1: "Laptop" }, { q1: "Phone" }] },
          { survey_id: 42, slug: "fixture-round-2", title: "Fixture survey, round 2 (newer)", active: true, created_at: iso(t - 2 * 864e5), responses: 3, skipped: 0,
            questions: [{ id: "q1", kind: "scale", prompt: "How useful was the Daily Drill?" }, { id: "q2", kind: "text", prompt: "Anything to add?" }],
            answers: [{ q1: 5, q2: "Fixture: newest answer." }, { q1: 4, q2: "Fixture: middle answer." }, { q1: 3, q2: "Fixture: oldest answer." }] }
        ] };
    }
    return null;
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
      storage: { database_mb: 210, pings_last_7_days: 52000, answers_last_7_days: 21000, tables: [{ table: "activity_pings", mb: 120, rows: 300000 }, { table: "personal_answers", mb: 30, rows: 130000 }, { table: "xp_seen", mb: 18, rows: 120000 }, { table: "ui_click_reach", mb: 9, rows: 40000 }] },
      // the retention job's last two runs (migration_v52; made-up counts, a week apart)
      retention: { schedule: "23 9 * * 0", runs: [
        { ran_at: iso(t - 2 * 86400000), database_mb: 201.4, counts: { activity_pings: 21400, ui_click_reach: 0, feature_events: 0, survey_declines: 6, survey_answer_ids: 0, exam_debriefs_ids: 0, question_flags_ids: 0, hub_suggestions_ids: 0, link_attempts: 3, activity_hourly_test: 0, ui_clicks_test: 0 } },
        { ran_at: iso(t - 9 * 86400000), database_mb: 199.6, counts: { activity_pings: 89000, ui_click_reach: 0, feature_events: 3, survey_declines: 80, survey_answer_ids: 0, exam_debriefs_ids: 0, question_flags_ids: 0, hub_suggestions_ids: 0, link_attempts: 14, activity_hourly_test: 0, ui_clicks_test: 0 } }] } };
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
      var ops = adminOps(fn, a);
      if (ops) return ops;
      if (/^(admin_|set_report_resolved)/.test(fn) && fn !== "admin_pod_comments") {
        if (fn === "set_report_resolved") db.flags.concat(db.suggestions).forEach(function(r){ if (r.id === a.p_id) { r.resolved = a.p_resolved; r.reply = a.p_reply; } });
        if (fn === "admin_hide_pod_comment") { db.podHidden = db.podHidden || {}; db.podHidden[a.p_id] = !!a.p_hidden; }
        if (fn === "admin_post_notice") db.notices.push({ title: a.p_title, message: a.p_message, at: iso(now()) });
        if (fn === "admin_review_question") { db.qhReviews = db.qhReviews || {}; var rk0 = a.p_hub + "|" + a.p_qid;
          if (!a.p_status) delete db.qhReviews[rk0]; else db.qhReviews[rk0] = { status: a.p_status, v: a.p_v, flags: a.p_flags || [], note: a.p_note || null, at: iso(now()) }; }
        save(); return { write: true, data: null };
      }
      return { data: fn === "get_question_health" ? qhFixture(a.p_hub, a.p_current) : synthAdmin(fn) };
    }
    var v = a.p_visitor, hub = a.p_hub, t = now();
    /* the game layer's functions (migration_v54: written, tested, and not applied until the redesign's release). The new
       dashboard (widget/dash.js) calls them as <name>_v2, so the preview answers them from today's fixtures plus what
       v54 adds to a row: the journey (0, the Handpiece) and a visit key (made up here; the real one is a digest only
       the server can make). The shop and Timmy's place get their fixtures with phase 4. */
    if (/^get_(widget_bootstrap|rank_profile|rank_board|leaderboard|arcade_leaderboard)_v2$/.test(fn)) {
      var d2 = rpc(fn.slice(0, -3), a).data;
      var vkey = function(n){ var k = ""; for (var i = 0; i < 3; i++) k += ("00000000" + (hash(n + "|visit" + i) >>> 0).toString(16)).slice(-8); return k; };
      if (Array.isArray(d2)) d2 = d2.map(function(r){ var o2 = {}; Object.keys(r).forEach(function(k){ o2[k] = r[k]; }); o2.journey = 0; o2.visit = vkey(r.display_name); return o2; });
      else if (d2 && d2.rank) d2.rank.journey = 0;
      else if (d2 && fn === "get_rank_profile_v2") d2.journey = 0;
      return { data: d2 };
    }
    /* someone's place, for the dashboard's stage (the top three stand on it as their own Timmys): only the outfit here,
       the rest of a place gets its fixtures with phase 4. One made-up classmate has visiting off. */
    if (fn === "get_place") {
      var pk = String(a.p_key || ""), who = -1;
      FAKE_NAMES.forEach(function(nm, i){ var k = ""; for (var j = 0; j < 3; j++) k += ("00000000" + (hash(nm + "|visit" + j) >>> 0).toString(16)).slice(-8); if (k === pk) who = i; });
      if (who < 0 || who === 4) return { data: null };
      return { data: { name: FAKE_NAMES[who], equipped: { outfit: ["rank-dark-outfit", "captain-hat", "tooth-fairy", "tuxedo"][who % 4] }, rank: { journey: 0, tier: 5, level: 1 }, flair: null } };
    }
    switch (fn) {
      case "get_hub_overrides": return { data: ovrStore().rows.filter(function(r){ return ovrActive(r, t); }).map(function(r){ return { hub: r.hub, state: r.state, until: r.until }; }) };
      case "get_widget_bootstrap": return { data: widgetBootstrap(a, t) };
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
        return { data: bootstrapPetDays(t) };
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
        return { data: bootstrapPins(v, hub) };
      }
      case "set_pins":
        if (v === db.visitor) { var pins = db.pins[hub] || (db.pins[hub] = {}); (a.p_pins || []).forEach(function(r){ if (Array.isArray(r) && r[0]) pins[r[0]] = [r[1] ? 1 : 0, +r[2] || 0]; }); save(); }
        return { write: true, data: null };
      case "get_my_inbox": return { data: bootstrapInbox(v) };
      case "mark_reply_seen": db.inbox.forEach(function(m){ if (m.id === a.p_id) m.seen = true; }); save(); return { write: true, data: null };
      case "get_active_survey": case "get_my_survey": return { data: bootstrapSurvey(t) };
      case "submit_survey": db.surveys.answered = a; save(); return { write: true, data: null };
      /* the exam check-in shows "Thank you" only on true, as the live function returns */
      case "submit_exam_debrief": (db.debriefs = db.debriefs || []).push(a); save(); return { write: true, data: true };
      case "pod_feed": {
        return { data: bootstrapPodcast(hub, a.p_ep, t) };
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
      case "get_published_recaps": return { data: recapFixtures() };
      case "get_golden_today": case "get_correct_streak_stats": case "get_trophy_stats": case "get_fairy_board": case "get_cavity_week": return { data: [] };
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
    /* the admin page reads these tables whole (no hub): a few real question ids from three live hubs, made-up numbers */
    var ADMIN_Q = { occlusion: ["rv-occl-artic", "rv-slide-pct", "rv-christensen", "rv-posselt", "fp-pm1b", "rv-2s-angle", "an-compound"],
                    perio: ["q1-01", "q1-30", "q2-24", "q3-19", "q3-46", "q4-23"], "special-patient-care": ["in-def", "in-medicaid", "bg-never", "bg-benef", "ds-age"] };
    function wholeTable(fn){ var out = []; Object.keys(ADMIN_Q).forEach(function(h){ ADMIN_Q[h].forEach(function(q){ out = out.concat(fn(h, q)); }); }); return out; }
    switch (name) {
      case "question_stats": if (!hub && !ids) return wholeTable(function(h, q){ var s = classStat(h, q); s.hub = h; return [s]; });
        return qids().map(function(q){ var s = classStat(hub, q); s.hub = hub; return s; });
      case "question_choices": if (!hub && !ids) return wholeTable(function(h, q){ return choiceRows(h, q).map(function(r){ r.hub = h; return r; }); });
        var rows = []; qids().forEach(function(q){ rows = rows.concat(choiceRows(hub, q)); }); return rows;
      case "mode_stats": return (hub ? [hub] : ["occlusion", "perio"]).reduce(function(o, h, hi){ return o.concat(["home", "compendium", "bank", "mock", "arcade", "listen"].map(function(m, i){ return { hub: h, mode: m, opens: 300 - i * 45 - hi * 60 }; })); }, []);
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
    ".shpv-pill{position:fixed;left:12px;bottom:12px;z-index:2147483647;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:22px;border:2px solid #7c2d12;background:#c2410c;color:#fff;font:600 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer}",
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
    /* the new hubs: Timmy has the bottom-left corner and the reply pop-up the bottom-right, so on a laptop the pill sits
       above Timmy; on a phone it's a round button on the right, clear of his speech bubble */
    "html.shx .shpv-pill{bottom:110px}html.shx .shpv-panel{bottom:162px;max-height:calc(100vh - 180px)}",
    "@media (max-width:700px){html.shx .shpv-pill{left:auto;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));padding:0;width:44px;justify-content:center}" +
      "html.shx .shpv-pill .shpv-pill-text{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}" +
      "html.shx .shpv-panel{left:auto;right:12px;bottom:calc(136px + env(safe-area-inset-bottom,0px));max-height:calc(100vh - 160px)}}",
    "@media print{.shpv-frame,.shpv-pill,.shpv-panel{display:none}}"
  ].join("\n");
  /* who's studying now: realtime has no fixture, so the redesigned hubs' live count (the sh:online event widget/v3.js
     sends) gets a made-up number that drifts a little, as a real class would; nothing on the live hubs listens for it */
  /* a made-up class for the studying-now count. The redesigned dashboard (widget/dash.js) draws each one as a Timmy in
     a classroom, so each has an outfit (the shop's ids, a holiday look, or none) and, every few seconds, one walks in or
     out. Nothing here is anyone's real presence. */
  var FAKE_FITS = ["captain-hat", "", "tuxedo", "thanksgiving:turkey", "football-helmet", "", "sun-hat", "dr-timmy", "", "elf-suit", "fox-hood", "", "tooth-fairy",
    "beanie", "ranger-hat", "", "skeleton-suit", "aviator-cap", "surgical-scrubs", "", "jester", "nightcap", "flannel", "", "lifeguard", "bunny-suit"];
  function fakeOnline(){
    var seq = 0, crowd = [];
    function add(){ seq++; crowd.push({ key: "pv" + seq, fit: FAKE_FITS[seq % FAKE_FITS.length], slot: seq }); }
    for (var i = 0; i < 9; i++) add();
    function send(){
      var n = crowd.length;
      try { document.dispatchEvent(new CustomEvent("sh:online", { detail: { n: n, preview: true } })); } catch (e) {}
      /* the dashboard shows the count hub by hub: spread the made-up class over its live hubs, most in the first */
      try {
        var D = window.shDash;
        if (D && D.setLive && D.hubs) {
          var hubs = D.hubs(), by = {}, list = [];
          crowd.forEach(function(p){ var h = hubs[[0, 0, 1, 0, 2, 1][p.slot % 6] % hubs.length]; if (!h) return; by[h.id] = (by[h.id] || 0) + 1; list.push({ key: p.key, hub: h.id, fit: p.fit }); });
          D.setLive(by, list);
        }
      } catch (e) {}
    }
    setTimeout(send, 1200);
    setInterval(function(){
      var r = Math.random();
      if (crowd.length <= 4 || (r < .55 && crowd.length < 16)) add(); else crowd.splice(Math.floor(Math.random() * crowd.length), 1);
      send();
    }, /\/next\/(index\.html)?$/.test(location.pathname) && !/\/hubs\//.test(location.pathname) ? 7000 : 20000);
  }
  function mount(){
    if (document.getElementById("shpv-pill")) return;
    fakeOnline();
    document.head.appendChild(el("style", { id: "shpv-style" }, CSS));
    var st = jget(K.ui, {});
    document.body.appendChild(el("div", { "class": "shpv-frame", "aria-hidden": "true" }));
    var pill = el("button", { id: "shpv-pill", type: "button", "class": "shpv-pill" + (st.min ? " is-min" : ""), "aria-expanded": "false", "aria-controls": "shpv-panel" });
    pill.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17.2v.1"/></svg><span class="shpv-pill-text">Preview · ' + esc(P.name) + '</span>';
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
