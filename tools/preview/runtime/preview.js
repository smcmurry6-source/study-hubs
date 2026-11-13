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
    ovr: "sh_preview_overrides_v1",   /* hub archive overrides: site-wide, kept when the test account changes */
    timmyFrom: "sh_preview_timmy_from" };   /* the day this test account started: the preview's "redesign went live" for widget/pet.js */
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

  /* ---------- 2. query parameters: ?persona=<id>, ?now=<local datetime>, ?now=real, ?xp=<number> ---------- */
  var params = new URLSearchParams(location.search), cleaned = false;
  function persona(id){ for (var i = 0; i < PERSONAS.length; i++) if (PERSONAS[i].id === id) return PERSONAS[i]; return null; }
  if (params.has("now")) {
    var nv = params.get("now");
    if (nv === "real" || nv === "") clearNow(); else setNow(nv);
    params.delete("now"); cleaned = true;
  }
  var wantPersona = params.get("persona");
  if (wantPersona != null) { params.delete("persona"); cleaned = true; }
  /* ?xp=<n>: put the test account at that much XP, to stand just under a rank-up, the hand-off at 125,000 or a Dark
     Matter unlock (the game layer's journeys); it also forgets which unlocks were seen */
  var wantXp = params.get("xp");
  if (wantXp != null) { params.delete("xp"); cleaned = true; }
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
    /* Everyone has Timmy (the redesign's pages): a Timmy born on or after the day the redesign goes live starts at 100 HP.
       Here that day is the day this test account started, so "new" meets him at 100 and the others keep their history. */
    lsSet(K.timmyFrom, centralDay(realNow() + OFFSET));
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

  function centralDay(t){ try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new RealDate(t)); } catch (e) { return new RealDate(t).toISOString().slice(0, 10); } }
  var stored = lsGet(K.persona);
  if (wantPersona != null || !stored || !persona(stored)) applyPersona(wantPersona || stored || "returning");
  /* widget/pet.js's FULL_FROM reads this in a preview (tools/preview/transform.js rewrites its line) */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lsGet(K.timmyFrom) || "")) lsSet(K.timmyFrom, centralDay(realNow() + OFFSET));
  window.SH_PREVIEW_TIMMY_FROM = lsGet(K.timmyFrom);
  var P = persona(lsGet(K.persona)) || PERSONAS[0] || { id: "none", name: "None", visitor: "preview-visitor" };
  var db = jget(K.db, null);
  if (!db || db.v !== 1 || db.visitor !== P.visitor) { db = freshDb(P); jset(K.db, db); }
  function save(){ jset(K.db, db); }
  if (wantXp != null && isFinite(+wantXp)) { db.xp = Math.max(0, Math.min(400000, Math.floor(+wantXp))); db.xp2 = 0; db.dark = []; save(); }

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
  /* a made-up person's visit key on the boards and at get_place (the server's is a digest of the id; this one of the name) */
  function visitKeyOf(n){ var k = ""; for (var j = 0; j < 3; j++) k += ("00000000" + (hash(n + "|visit" + j) >>> 0).toString(16)).slice(-8); return k; }
  var FAKE_NAMES = ["Fixture Fluoride", "Sample Sealant", "Test Tubercle", "Mock Mandible", "Dummy Dentin", "Stub Sulcus", "Placeholder Pulp", "Example Enamel", "Synthetic Cingulum", "Trial Torus", "Pretend Papilla", "Model Mesial"];
  /* the made-up classmates' XP, the same on every board and at their place (visiting): the first is past the Handpiece,
     in the ModuPro journey; the rest climb the Handpiece */
  function fakeXp(n){ var i = FAKE_NAMES.indexOf(n); return i === 0 ? 134000 - hash(n) % 900 : 52000 - i * 4100 - (hash(n) % 900); }
  /* the mastery medal three of them show, on the game layer's boards and at their place (get_place). One each: a row
     with two or more draws widget/ranks.js's "+1" medal button, whose name leaves the "+1" out (BUG-112, left for the
     release), and the accessibility suite would stop on it */
  var FAKE_FLAIR = { "Fixture Fluoride": "perio:4", "Sample Sealant": "heme-endo-exam2:1", "Test Tubercle": "occlusion:2" };
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
    function one(hub, title, color, exam, people, minutes, answers, correct, tough){
      var byDay = [], byHour = [];
      for (var i = 9; i >= 0; i--) { var d = new Date(exam + "T12:00:00"); d.setDate(d.getDate() - i); byDay.push({ d: d.toISOString().slice(0, 10), minutes: Math.round(minutes * (10 - i) / 55) }); }
      for (var h = 0; h < 24; h++) byHour.push(h < 6 ? 2 : h < 12 ? 9 + h : h < 18 ? 14 + (h % 5) * 3 : 60 - Math.abs(20 - h) * 9);
      return { hub: hub, title: title, color: color, names: false, footnote: "Preview: made-up totals",
        question: tough ? { text: "A made-up question stands in here for the one the class missed most.", answer: "A made-up answer" } : null,
        data: { hub: hub, people: people, minutes: minutes, answers: answers, correct: correct, first_day: byDay[0].d, last_day: exam, exam_day: exam,
          by_day: byDay, by_hour: byHour, toughest: tough ? [{ qid: "pv-tough", attempts: 52, correct: 16 }] : [], night_before: Math.round(minutes * .18), night_before_people: Math.round(people * .8), after_midnight: 6, regulars: Math.round(people * .6) } };
    }
    return [one("pcd-implants-exam1", "PCD Implants Exam 1", "#2f6f84", "2026-11-06", 58, 9120, 21480, 14820),
            one("heme-endo-exam1", "Heme & Endo Exam 1", "#a83232", "2026-10-30", 61, 11340, 26950, 17790, true)];
  }
  /* the account's starting XP, plus a little for each answer given in this preview (the server's real rule is per day) */
  function myXp(){ var extra = 0; allAnswers().forEach(function(a){ if (!a[4]) extra += a[3] ? 3 : 1; }); return (db.xp || 0) + extra + (db.xp2 || 0); }

  /* ---------- the game layer's answers, ladder and sessions (migration_v54), as the server does them, on the fixtures.
     The 63 steps' floors are sh_rank's own list; an answer is graded where the page's export has its key (one choice),
     paid by the same rules (10, 2, 1; a self-graded card 2; three right and three wrong a question a day; the day's 20th
     answer; a miss fixed; a medal and its 24 hours of double XP) and its award kept in db.xp2. ---------- */
  var F2 = [0, 100, 200, 300, 700, 1100, 1500, 2666, 3833, 5000, 7333, 9666, 12000, 16333, 20666, 25000, 33333, 41666, 50000, 75000, 100000,
    125000, 130952, 136904, 142857, 148809, 154761, 160714, 166666, 172618, 178571, 184523, 190475, 196428, 202380, 208332, 214285, 220237, 226189,
    232142, 238094, 244047, 250000, 255952, 261904, 267857, 273809, 279761, 285714, 291666, 297618, 303571, 309523, 315475, 321428, 327380, 333332,
    339285, 345237, 351189, 357142, 363094, 369047, 375000];
  function rank2(xp){
    var st = 0; for (var i = 0; i < 63; i++) if (F2[i] <= xp) st = i;
    return { journey: Math.floor(st / 21), tier: Math.floor(st % 21 / 3), level: st % 3 + 1, step: st, gtier: Math.floor(st / 3), step_at: F2[st], next_at: st < 62 ? F2[st + 1] : null, tier_at: F2[Math.floor(st / 3) * 3], steps: 63 };
  }
  /* the running boost (sh_boost_json): a medal's 24 hours (db.boost) or the shop's (db.sboost), whichever ends later */
  function boost2(t){
    var b = db.boost && new RealDate(db.boost.until).getTime() > t ? { mult: 2, until: db.boost.until, src: db.boost.src } : null;
    var s = db.sboost && new RealDate(db.sboost).getTime() > t ? { mult: 2, until: db.sboost, src: "shop" } : null;
    return b && s ? (new RealDate(s.until).getTime() > new RealDate(b.until).getTime() ? s : b) : b || s;
  }
  function profile2(v){
    var p = rpc("get_rank_profile", { p_visitor: v }).data, r = rank2(p.xp || 0), k;
    for (k in r) p[k] = r[k];
    p.badges = (p.badges || []).slice();
    for (var j = 0; j < 3; j++) if ((p.xp || 0) >= 125000 * (j + 1)) p.badges.push("journey-" + j);
    p.boost = v === db.visitor ? boost2(now()) : null;
    p.dark_seen = v === db.visitor ? (db.dark || []).slice() : [];
    return p;
  }
  /* ---------- Timmy's place and shop (redesign phase 4, parts B and C): the catalog, the inventory, the rotation, the
     wallet, buy_item and equip_item, as migration_v54 writes them ----------
     The catalog is the migration's own (tools/preview/transform.js reads its two inserts into SH_PREVIEW_CONFIG.shop), so
     the shelves sell exactly what the server will. What each test account owns is made up here: Halloween's set
     (everyone's, a gift), the rank sets up to the account's rank (earned), what it "bought" before (PLACE_BOUGHT) and what
     it buys in this preview (db.buys). The rotation is the server's rules with a made-up draw: a different four and three
     than the real shop would pick, never anything the real shop couldn't sell that day. */
  var PLACE_CAT = {};
  (function(){
    var sc = C.shop || {}, cols = sc.cols || [], rows = sc.rows || [];
    rows.forEach(function(r){ var o = {}; cols.forEach(function(k, i){ o[k] = r[i]; }); o.rank = o.rank_tier; PLACE_CAT[o.id] = o; });
    if (rows.length) return;
    /* no catalog in the config (an older build): the place's own pieces, as before */
    ("haunted-manor:home pumpkin-patch:scene floss-mummy:outfit bedsheet-ghost:outfit skeleton-suit:outfit pumpkin-lantern:yard bubbling-cauldron:yard haunted-tree:yard").split(" ")
      .forEach(function(x){ var q = x.split(":"); PLACE_CAT[q[0]] = { id: q[0], kind: q[1], gift: true }; });
    ["antique", "bronze", "silver", "gold", "diamond", "dark"].forEach(function(r, i){ PLACE_CAT["rank-" + r + "-outfit"] = { id: "rank-" + r + "-outfit", kind: "outfit", rank: i + 1, rank_tier: i + 1 }; PLACE_CAT["rank-" + r + "-yard"] = { id: "rank-" + r + "-yard", kind: "yard", rank: i + 1, rank_tier: i + 1 }; });
  })();
  var PLACE_OLD = ("castle giant-mushroom treehouse lighthouse beach forest clouds night-sky garden swimming-pool hammock mouthwash-fountain doghouse bowling-lane mailbox campfire telescope podcast-studio " +
    "sun-hat ranger-hat sunglasses-lei captain-hat aviator-cap fancy-windows porch chimney flag paint-mint paint-sky paint-lilac harvest-barn harvest-fields hay-bales scarecrow-hat ice-rink elf-suit").split(" ");
  var PLACE_BOUGHT = {
    "new": [], "missed": [],
    "returning": ["garden", "mailbox", "sun-hat", "chimney", "paint-mint"],
    "archived": ["giant-mushroom", "forest", "campfire", "ranger-hat", "hammock"],
    "admin": ["treehouse", "beach", "swimming-pool", "sunglasses-lei", "flag"],
    "high-xp": PLACE_OLD.filter(function(k){ return PLACE_CAT[k] && !PLACE_CAT[k].gift && !PLACE_CAT[k].rank; })
  };
  var PLACE_START = {
    "returning": { "yard-left": "garden", "yard-front": "mailbox", chimney: "chimney", outfit: "sun-hat" },
    "archived": { home: "giant-mushroom", scene: "forest", "yard-right": "campfire", outfit: "ranger-hat" },
    "admin": { home: "treehouse", "yard-left": "swimming-pool" },
    "high-xp": { home: "castle", scene: "clouds", "yard-left": "mouthwash-fountain", "yard-right": "telescope", "yard-side": "bowling-lane", "yard-front": "podcast-studio", outfit: "rank-gold-outfit", flag: "flag", porch: "porch" }
  };
  /* the made-up classmates' places, by their place in FAKE_NAMES (the fifth, Dummy Dentin, can't be read): each a
     different home, scene, yard and outfit from the catalog, only pieces they could own (a gift, a set's piece, a rank
     piece their rank has reached), the first a ModuPro with the Handpiece's Dark Matter pieces. Some wear nothing, as
     on the server when no outfit is on. */
  var FAKE_PLACES = [
    { home: "castle", scene: "night-sky", "yard-left": "telescope", "yard-front": "rank-dark-yard", "yard-side": "bowling-lane", "yard-right": "podcast-studio", outfit: "rank-dark-outfit", flag: "flag", chimney: "chimney", paint: "paint-lilac" },
    { home: "lighthouse", scene: "beach", "yard-left": "sandcastle", "yard-front": "beach-umbrella", "yard-right": "hammock", outfit: "captain-hat", porch: "porch", paint: "paint-sky" },
    { home: "igloo", scene: "snowy-mountain", "yard-left": "hot-spring", "yard-right": "campfire", outfit: "beanie", windows: "fancy-windows" },
    { home: "treehouse", scene: "forest", "yard-left": "doghouse", "yard-front": "mailbox", "yard-right": "fairy-ring", outfit: "tooth-fairy" },
    null,
    { home: "observatory", scene: "clouds", "yard-left": "mouthwash-fountain", outfit: "astronaut", paint: "paint-butter" },
    { home: "giant-mushroom", scene: "forest", "yard-left": "garden", "yard-right": "swimming-pool", outfit: "chef", paint: "paint-peach" },
    { home: "haunted-manor", scene: "pumpkin-patch", "yard-left": "pumpkin-lantern", "yard-right": "haunted-tree", outfit: "floss-mummy" },
    {},
    { home: "harvest-barn", scene: "harvest-fields", "yard-left": "hay-bales", "yard-front": "turkey-balloon", outfit: "scarecrow-hat", paint: "paint-mint" },
    { home: "beach-hut", scene: "beach", "yard-left": "lawn-sprinkler", "yard-right": "barbecue-grill", outfit: "sunglasses-lei" },
    { scene: "snowy-mountain", "yard-left": "rank-silver-yard", outfit: "white-coat" }
  ];
  /* what each test account has earned in Shiny Gold Crowns before this preview (Sam's spec: new 0, returning about 300,
     missed about 80 so a purchase is refused for its balance, high-XP about 20,000); answers here add 1 for every 10 XP */
  var WALLET_START = { "new": 0, returning: 300, missed: 80, "high-xp": 20000, archived: 1500, admin: 5000 };
  function placeOwned(v){
    var own = {}, g = rank2(rpc("get_rank_profile", { p_visitor: v }).data.xp || 0).gtier;
    Object.keys(PLACE_CAT).forEach(function(k){ var c = PLACE_CAT[k]; if (c.gift) own[k] = "gift"; else if (c.rank && c.rank <= g) own[k] = "rank"; });
    if (v === db.visitor) {
      (PLACE_BOUGHT[db.persona] || []).forEach(function(k){ own[k] = "bought"; });
      (db.buys || []).forEach(function(b){ var c = PLACE_CAT[b.item]; if (c && c.kind !== "snack" && c.kind !== "boost") own[b.item] = "bought"; });
    }
    return own;
  }
  function placeEquipped(){
    if (!db.equip) { db.equip = {}; var st = PLACE_START[db.persona] || {}, own = placeOwned(db.visitor); Object.keys(st).forEach(function(k){ if (own[st[k]]) db.equip[k] = st[k]; }); }
    return db.equip;
  }
  function wallet2(v){
    if (!v || v !== db.visitor) return null;
    var earned = (WALLET_START[db.persona] || 0) + Math.floor((db.xp2 || 0) / 10), spent = 0;
    (db.buys || []).forEach(function(b){ spent += b.price || 0; });
    return { earned: earned, spent: spent, balance: earned - spent, from_xp: earned, trophies: 0, medals: 0, rankups: 0 };
  }
  /* the server's calendar (sh_shop_seasons): every season whose set is on sale that Central day */
  function easterOf(y){ var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return RealDate.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1); }
  function shopSeasons(dd){
    var p = dd.split("-"), y = +p[0], x = +p[1] * 100 + +p[2], t = RealDate.UTC(y, +p[1] - 1, +p[2]), D1 = 864e5, r = [];
    var f = new RealDate(RealDate.UTC(y, 10, 1)).getUTCDay(), tgEnd = RealDate.UTC(y, 10, 1 + ((4 - f + 7) % 7) + 21 + 1), ea = easterOf(y), den = RealDate.UTC(y, 2, 6);
    if (x >= 1001 && x <= 1031) r.push("halloween");
    if (x >= 1101 && t <= tgEnd) r.push("thanksgiving");
    if (t > tgEnd && x <= 1226 && x >= 1101) r.push("winter");
    if (x >= 1227 || x <= 102) r.push("newyear");
    if (t >= ea - 53 * D1 && t <= ea - 47 * D1) r.push("mardigras");
    if (x >= 208 && x <= 214) r.push("valentine");
    if (x >= 222 && x <= 228) r.push("toothfairy");
    if (t >= den - 6 * D1 && t <= den) r.push("dentist");
    if (x >= 311 && x <= 317) r.push("stpatrick");
    if (t >= ea - 6 * D1 && t <= ea + D1) r.push("easter");
    if (x >= 628 && x <= 704) r.push("july4");
    if (x >= 320 && x <= 531) r.push("spring");
    if (x >= 601 && x <= 921) r.push("summer");
    if (x >= 922 && x <= 1130) r.push("fall");
    return r;
  }
  var RAR_W = { common: 10, uncommon: 6, rare: 3, epic: 1.5, legendary: .6 };
  function shopPick(seed, n, ok, w){
    return Object.keys(PLACE_CAT).filter(function(id){ return ok(PLACE_CAT[id]); })
      .map(function(id){ var c = PLACE_CAT[id]; return { id: id, k: -Math.log(((hash(seed + ":" + id) >>> 0) + .5) / 4294967296) / (RAR_W[c.rarity] || .6) / (w ? w(c) : 1) }; })
      .sort(function(a, b){ return a.k - b.k || (a.id < b.id ? -1 : 1); }).slice(0, n).map(function(x){ return x.id; });
  }
  function everyday(c){ return c.rotates !== false && !c.season && !c.gift && !c.rank && c.kind !== "snack" && c.kind !== "boost" && c.kind !== "costume"; }
  function isThrowback(dd){ var p = dd.split("-"), hm = hash("throwback:" + p[0] + "-" + p[1]) >>> 0; return +p[2] === 1 + hm % 14 || +p[2] === 15 + (hm >>> 8) % 14; }
  /* one day's shop for this visitor (sh_shop_for): [{ id, shelf, pos }] */
  function shopDay(v, dd){
    var p = dd.split("-"), wd = new RealDate(RealDate.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay(), mon = new RealDate(RealDate.UTC(+p[0], +p[1] - 1, +p[2] - ((wd + 6) % 7))).toISOString().slice(0, 10);
    var seasons = shopSeasons(dd), out = [], push = function(list, shelf){ list.forEach(function(id, i){ out.push({ id: id, shelf: shelf, pos: i + 1 }); }); };
    var week = shopPick("week:" + mon, 3, everyday);
    push(week, "weekly");
    push(shopPick("day:" + dd, 4, function(c){ return everyday(c) && week.indexOf(c.id) < 0; }), "daily");
    push(Object.keys(PLACE_CAT).filter(function(id){ return seasons.indexOf(PLACE_CAT[id].season) >= 0; })
      .sort(function(a, b){ var A = PLACE_CAT[a], B = PLACE_CAT[b]; return seasons.indexOf(A.season) - seasons.indexOf(B.season) || (A.sort || 0) - (B.sort || 0) || (a < b ? -1 : 1); }), "season");
    if (isThrowback(dd)) push(shopPick("throwback:" + dd, 3, function(c){ return c.season && seasons.indexOf(c.season) < 0 && !c.gift && !c.rank && c.kind !== "snack" && c.kind !== "boost" && c.kind !== "costume"; },
      function(c){ return c.kind === "home" || c.kind === "scene" ? .4 : 1; }), "throwback");
    push(Object.keys(PLACE_CAT).filter(function(id){ return PLACE_CAT[id].shelf; }).sort(function(a, b){ return (PLACE_CAT[a].sort || 0) - (PLACE_CAT[b].sort || 0); }), "always");
    if (v && v === db.visitor) { var own = placeOwned(v); (db.costumes || []).forEach(function(c){ if (PLACE_CAT[c.id] && !own[c.id]) out.push({ id: c.id, shelf: "spotted", pos: 1 }); }); }
    return { seasons: seasons, throwback: isThrowback(dd), items: out };
  }
  function shopBoost(t){ var b = db.sboost; return b && new RealDate(b).getTime() > t ? new RealDate(b).getTime() : null; }
  function shop2(v){
    var mine = v && v === db.visitor, own = v ? placeOwned(v) : {}, eq = {}, dd = day(now()), sd = shopDay(v, dd);
    if (mine) { var e = placeEquipped(); Object.keys(e).forEach(function(k){ eq[k] = e[k]; }); }
    var ORDER = ["always", "daily", "season", "spotted", "throwback", "weekly"];
    var items = sd.items.slice().sort(function(a, b){ return ORDER.indexOf(a.shelf) - ORDER.indexOf(b.shelf) || a.pos - b.pos; }).map(function(s){
      var c = PLACE_CAT[s.id] || {};
      return { id: s.id, name: c.name || s.id, kind: c.kind, rarity: c.rarity, price: c.price, season: c.season || null, slot: c.slot || null, hp: c.hp == null ? null : c.hp,
        boost_minutes: c.boost_minutes == null ? null : c.boost_minutes, boost_mult: c.boost_mult == null ? null : c.boost_mult, shelf: s.shelf, gift: !!c.gift, owned: !!own[s.id] };
    });
    var at = function(k){ var b = (db.buys || []).filter(function(x){ return x.item === k; })[0]; return b ? b.at : own[k] === "bought" ? iso(now() - 864e5 * 3) : null; };
    return { day: dd, seasons: sd.seasons, throwback: sd.throwback, wallet: wallet2(v), items: items,
      inventory: Object.keys(own).map(function(k){ return { id: k, at: at(k), how: own[k] }; }).sort(function(a, b){ return (a.at ? 0 : 1) - (b.at ? 0 : 1) || (a.at < b.at ? -1 : a.at > b.at ? 1 : 0) || (a.id < b.id ? -1 : 1); }),
      locked: Object.keys(PLACE_CAT).filter(function(k){ return PLACE_CAT[k].rank && !own[k]; }).sort(function(a, b){ return PLACE_CAT[a].rank - PLACE_CAT[b].rank || (PLACE_CAT[a].sort || 0) - (PLACE_CAT[b].sort || 0); })
        .map(function(k){ var c = PLACE_CAT[k]; return { id: k, name: c.name || k, kind: c.kind, rarity: c.rarity || (c.rank < 3 ? "rare" : c.rank < 5 ? "epic" : "legendary"), rank_tier: c.rank }; }),
      equipped: eq, costumes: mine ? (db.costumes || []).map(function(c){ return { id: c.id, day: c.day }; }) : [],
      snacks_today: mine ? (db.buys || []).filter(function(b){ return b.kind === "snack" && b.day === dd; }).map(function(b){ return b.item; }).filter(function(x, i, a){ return a.indexOf(x) === i; }) : [],
      boost: mine ? boost2(now()) : null };
  }
  /* buy_item, check for check in the server's order (sh_buy): a bad call, a replay (the same answer again, marked) or
     someone else's request id, an unknown item, owned already, a rank item, not on sale today, a second snack of a kind
     today, the balance. A world `w` says what the server knows; tools/release/xp.js runs this same function against
     sh_buy through one list of purchases. */
  function buyCore(w, v, item, req){
    if (!v || String(v).length > 80 || !item || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(item) || !req || !/^[A-Za-z0-9_-]{8,64}$/.test(req)) return { ok: false, error: "bad" };
    var prev = null; w.log.forEach(function(p){ if (p.req === req) prev = p; });
    if (prev) { if (prev.v !== v) return { ok: false, error: "dup" }; var rep = {}; Object.keys(prev.resp || {}).forEach(function(k){ rep[k] = prev.resp[k]; }); rep.repeat = true; return rep; }
    var it = w.cat[item];
    if (!it) return { ok: false, error: "unknown" };
    if (it.kind !== "snack" && it.kind !== "boost" && w.owns(item)) return { ok: false, error: "owned" };
    if (it.rank_tier != null) return { ok: false, error: "rank", rank_tier: it.rank_tier };
    if (w.sale.indexOf(item) < 0) return { ok: false, error: "not-today" };
    if (it.kind === "snack" && w.log.some(function(p){ return p.v === v && p.item === item && p.day === w.day; })) return { ok: false, error: "today" };
    var bal = w.balance();
    if (bal < it.price) return { ok: false, error: "balance", balance: bal, price: it.price };
    var until = null;
    if (it.kind === "boost") { var b = w.boost(); until = (b || w.now) + it.boost_minutes * 60000; w.setBoost(until); }
    var resp = { ok: true, item: item, kind: it.kind, price: it.price, balance: bal - it.price, hp: it.hp == null ? null : it.hp, boost_until: until == null ? null : new RealDate(until).toISOString() };
    w.log.push({ req: req, v: v, item: item, kind: it.kind, price: it.price, hp: it.hp == null ? null : it.hp, day: w.day, at: new RealDate(w.now).toISOString(), resp: resp });
    return resp;
  }
  function buy2(v, item, req){
    if (!v || v !== db.visitor) return buyCore({ cat: PLACE_CAT, log: [], sale: [], owns: function(){ return false; }, balance: function(){ return 0; }, boost: function(){ return null; }, setBoost: function(){}, day: day(now()), now: now() }, v, item, req);
    db.buys = db.buys || [];
    var t = now(), res = buyCore({ cat: PLACE_CAT, log: db.buys, sale: shopDay(v, day(t)).items.map(function(x){ return x.id; }), owns: function(id){ return !!placeOwned(v)[id]; },
      balance: function(){ return wallet2(v).balance; }, boost: function(){ return shopBoost(t); }, setBoost: function(ms){ db.sboost = iso(ms); }, day: day(t), now: t }, v, item, req);
    save();
    return res;
  }
  /* record_costume_sighting: one new costume a day, logged once, and it joins that visitor's shop until bought */
  function sight2(v, c){
    var it = PLACE_CAT[c];
    if (!v || String(v).length > 80 || !it || it.kind !== "costume") return { ok: false, error: "bad" };
    if (v !== db.visitor) return { ok: true, first: true };
    db.costumes = db.costumes || [];
    if (db.costumes.some(function(x){ return x.id === c; })) return { ok: true, first: false };
    var dd = day(now());
    if (db.costumes.some(function(x){ return x.day === dd; })) return { ok: false, error: "today" };
    db.costumes.push({ id: c, day: dd }); save();
    return { ok: true, first: true };
  }
  /* Timmy's days with the HP his snacks gave each day (get_pet_days_v2; the bootstrap's pet_days the same) */
  function petDays2(t){
    var by = {};
    bootstrapPetDays(t).forEach(function(r){ by[r.d] = { d: r.d, attempts: r.attempts, correct: r.correct, hp: 0 }; });
    (db.buys || []).forEach(function(b){ if (b.hp == null || t - new RealDate(b.day + "T12:00:00").getTime() > 70 * 864e5) return; var r = by[b.day] || (by[b.day] = { d: b.day, attempts: 0, correct: 0, hp: 0 }); r.hp += b.hp; });
    return Object.keys(by).sort().map(function(k){ return by[k]; });
  }
  /* equip_item, line for line as the migration has it: the slot must be one of the thirteen, the piece owned and of the
     slot's kind; the lane always stands in the side yard and clears the front corner; a piece in the front corner
     takes the lane away; a yard piece stands in one spot at a time */
  var PLACE_SLOTS = ["outfit", "home", "scene", "yard-left", "yard-front", "yard-corner", "yard-side", "yard-right", "windows", "porch", "chimney", "flag", "paint"];
  function equip2(v, slot, item){
    if (!v || v !== db.visitor || PLACE_SLOTS.indexOf(slot) < 0) return { ok: false, error: "bad" };
    var eq = placeEquipped(), it = item == null ? null : PLACE_CAT[item], sl = slot;
    if (item == null) delete eq[slot];
    else {
      if (!it || !placeOwned(v)[item]) return { ok: false, error: "not-owned" };
      var yardSlot = slot.indexOf("yard-") === 0;
      if (!((slot === "outfit" && (it.kind === "outfit" || it.kind === "costume")) || (slot === it.kind && (it.kind === "home" || it.kind === "scene")) || (yardSlot && it.kind === "yard") || (it.kind === "upgrade" && slot === it.slot))) return { ok: false, error: "slot" };
      if (it.kind === "yard" && it.wide) { if (slot !== "yard-side" && slot !== "yard-corner") return { ok: false, error: "slot" }; sl = "yard-side"; delete eq["yard-corner"]; }
      else if (slot === "yard-corner" && eq["yard-side"] && PLACE_CAT[eq["yard-side"]] && PLACE_CAT[eq["yard-side"]].wide) delete eq["yard-side"];
      if (it.kind === "yard") Object.keys(eq).forEach(function(k){ if (eq[k] === item && k !== sl) delete eq[k]; });
      eq[sl] = item;
    }
    save();
    var out = {}; Object.keys(eq).forEach(function(k){ out[k] = eq[k]; });
    return { ok: true, equipped: out };
  }
  function medalLevel(hub){
    var E = hubExport(hub), bank = E ? E.questions.length : 0, last = {}; if (!bank) return 0;
    (db.answers[hub] || []).forEach(function(r){ last[r[0]] = r[2]; });
    var got = Object.keys(last).filter(function(q){ return last[q]; }).length;
    return got >= bank ? 4 : got * 10 >= bank * 9 ? 3 : got * 4 >= bank * 3 ? 2 : got * 2 >= bank ? 1 : 0;
  }
  function answer2(a, t){
    var hub = a.p_hub, qid = String(a.p_qid || ""), E = hubExport(hub), q = null;
    if (a.p_visitor !== db.visitor || !qid) return { ok: false, error: "bad" };
    db.reqs = db.reqs || {};
    if (a.p_request && db.reqs[a.p_request]) { var again = {}, k0; for (k0 in db.reqs[a.p_request]) again[k0] = db.reqs[a.p_request][k0]; again.repeat = true; return again; }
    if (E) for (var i = 0; i < E.questions.length; i++) if (E.questions[i].id === qid) { q = E.questions[i]; break; }
    var picks = Array.isArray(a.p_picks) ? a.p_picks : null, kind, correct;
    if (!q) { kind = "unknown"; correct = !!a.p_claim; }
    else if (q.choices && typeof q.answer === "number") {
      if (a.p_choice == null && !(picks && picks.length === 1)) return { ok: false, error: "bad" };
      kind = "one"; correct = (a.p_choice != null ? a.p_choice : picks[0]) === q.answer;
    } else if (q.choices) { if (!picks) return { ok: false, error: "bad" }; kind = "all"; correct = !!a.p_claim; }
    else if (a.p_self != null) { kind = "self"; correct = !!a.p_self; }
    else if (picks) { kind = "order"; correct = picks.every(function(x, n){ return x === n; }); }
    else { kind = "self"; correct = !!a.p_claim; }
    answersFor(hub);
    var rows = db.answers[hub] = db.answers[hub] || [], dd = day(t), sess = a.p_session && db.sess && db.sess[a.p_session], sOk = !!(sess && sess.hub === hub && !sess.done && t - sess.t0 < 6 * 3600e3);
    if (db.medals == null) db.medals = {};
    if (db.medals[hub] == null) db.medals[hub] = medalLevel(hub);   // reached before the switch: no XP, no boost
    var today = allAnswers().filter(function(r){ return day(r[2] * 1000) === dd; }).length, lastT = db.lastAns || 0, before = null;
    rows.forEach(function(r){ if (r[0] === qid && day(r[1] * 1000) < dd) before = r[2]; });
    /* recorded as the four calls of today */
    rows.push([qid, Math.floor(t / 1000), correct ? 1 : 0, 2]);   /* 4th = paid by its award, not by myXp's 3 or 1 */
    var ck = hub + "|" + qid, c = db.cls[ck] || (db.cls[ck] = [0, 0]); c[0]++; if (correct) c[1]++;
    if (a.p_choice != null) { var kc = ck + "|" + a.p_choice; db.picks[kc] = (db.picks[kc] || 0) + 1; }
    else if (picks && kind !== "order") picks.forEach(function(ch){ var kk = ck + "|" + ch; db.picks[kk] = (db.picks[kk] || 0) + 1; });
    db.lastAns = t; db.xp2 = db.xp2 || 0;
    if (!today) db.xp2 += 20;   // the day studied, as today's trigger pays it
    var why = null, base = 0, mult = 1, paid = 0, bonus = [], medal = null, speed = false;
    if (kind === "unknown") why = kind;
    else {
      if (sOk && sess.kind === "mock") { speed = !sess.q[qid] && t - sess.t0 >= (sess.n + 1) * 2000; }
      else speed = !lastT || t - lastT >= 2000;
      if (!speed) why = "fast";
    }
    if (sOk) { sess.q[qid] = 1; sess.n++; if (correct) sess.c++; }
    if (speed) {
      var same = 0, all = 0, ever = 0;
      rows.forEach(function(r){ if (r[0] !== qid) return; if (r[2]) ever++; if (day(r[1] * 1000) === dd) { all++; if (!!r[2] === correct) same++; } });
      base = kind === "self" ? (all <= 3 ? 2 : 0) : correct ? (same <= 3 ? (ever === 1 ? 10 : 2) : 0) : (same <= 3 ? 1 : 0);
      if (!base) why = "repeat";
      mult = boost2(t) ? 2 : 1; paid = base * mult; db.xp2 += paid;
      db.g20 = db.g20 || {};
      if (today + 1 >= 20 && !db.g20[dd]) { db.g20[dd] = 1; db.xp2 += 30 * mult; bonus.push({ src: "goal20", xp: 30 * mult }); }
      db.fix = db.fix || {};
      if (correct && kind !== "self" && before === 0 && !db.fix[ck]) { db.fix[ck] = 1; db.xp2 += 5 * mult; bonus.push({ src: "fix", xp: 5 * mult }); }
    }
    if (kind !== "unknown") {
      var lvl = medalLevel(hub), pays = [0, 100, 200, 300, 500], got = 0;
      for (var m = db.medals[hub] + 1; m <= lvl; m++) got += pays[m];
      if (got) {
        db.medals[hub] = lvl; db.xp2 += got; db.boost = { until: iso(t + 864e5), src: "medal" };
        medal = { kind: ["", "mastery-bronze", "mastery-silver", "mastery-gold", "mastery-crown"][lvl], level: lvl, xp: got, boost_until: iso(t + 864e5) };
      }
    }
    var resp = { ok: true, correct: correct, kind: kind, xp: paid, base: base, mult: mult, first: correct && paid > 0 && base === 10, why: why, bonus: bonus, medal: medal, boost: boost2(t), total: 0 };
    resp.total = myXp();
    if (a.p_request) { var ids = Object.keys(db.reqs); if (ids.length > 300) db.reqs = {}; db.reqs[a.p_request] = resp; }
    save();
    return resp;
  }
  /* Learn and Flashcards (migration_v56): a rating or Learn step, as sh_card answers it. Ratings pay a flat 2 for a card's
     first three a day (Study ahead's and Learn's pay nothing), behind the same 2-second limit as answers; no day bonus. */
  var CARD_WHAT = ["again", "hard", "good", "easy", "learn-0", "learn-1", "learn-2", "learn-reset"];
  function cardRows(){ return db.cards2 || (db.cards2 = []); }
  function card2(a, t){
    var hub = a.p_hub, qid = String(a.p_qid || ""), what = a.p_what, req = a.p_request || null, E = hubExport(hub), q = null;
    if (!a.p_visitor || !hub || !qid || CARD_WHAT.indexOf(what) < 0 || (req && !/^[A-Za-z0-9_-]{8,64}$/.test(req))) return { ok: false, error: "bad" };
    var rows = cardRows(), rating = what.indexOf("learn") !== 0, ahead = rating && !!a.p_ahead, i;
    if (req) for (i = 0; i < rows.length; i++) if (rows[i].req === req) {
      if (rows[i].v !== a.p_visitor) return { ok: false, error: "dup" };
      var again = {}, k0; for (k0 in rows[i].resp) again[k0] = rows[i].resp[k0]; again.repeat = true; return again;
    }
    var seen = t; if (a.p_seen != null && isFinite(+a.p_seen)) seen = Math.min(t, Math.max(t - 2 * 864e5, +a.p_seen));
    var row = { v: a.p_visitor, hub: hub, qid: qid, what: what, ahead: ahead, t: t, seen: seen, req: req, xp: 0, resp: null };
    var mine = rows.filter(function(r){ return r.v === a.p_visitor && r.what.indexOf("learn") !== 0; });
    rows.push(row);
    var why = null, base = 0, mult = 1, paid = 0;
    if (!rating) why = "learn";
    else if (ahead) why = "ahead";
    else {
      if (E) for (i = 0; i < E.questions.length; i++) if (E.questions[i].id === qid) { q = E.questions[i]; break; }
      if (!q) why = "unknown";
      else {
        var lastC = mine.length ? mine[mine.length - 1].t : 0, lastA = a.p_visitor === db.visitor ? db.lastAns || 0 : 0;
        var n60 = mine.filter(function(r){ return r.t >= t - 60e3; }).length + 1;
        if ((lastA && t - lastA < 2000) || (lastC && t - lastC < 2000) || n60 > 30) why = "fast";
        else {
          var dd = day(t), n = mine.filter(function(r){ return r.hub === hub && r.qid === qid && !r.ahead && day(r.t) === dd; }).length + 1;
          base = n <= 3 ? 2 : 0; if (!base) why = "repeat";
          mult = boost2(t) ? 2 : 1; paid = base * mult;
          if (a.p_visitor === db.visitor) db.xp2 = (db.xp2 || 0) + paid;
        }
      }
    }
    row.xp = paid;
    row.resp = { ok: true, xp: paid, base: base, mult: mult, why: why, boost: boost2(t), total: a.p_visitor === db.visitor ? myXp() : 0 };
    if (rows.length > 5000) rows.splice(0, rows.length - 5000);
    save();
    return row.resp;
  }
  function resetLearn2(a, t){
    var ids = Array.isArray(a.p_qids) ? a.p_qids.map(String).filter(function(x){ return x && x.length <= 80; }) : [];
    if (!a.p_visitor || !a.p_hub || !ids.length || ids.length > 2000) return 0;
    var seen = t; if (a.p_seen != null && isFinite(+a.p_seen)) seen = Math.min(t, Math.max(t - 2 * 864e5, +a.p_seen));
    var uniq = ids.filter(function(x, i){ return ids.indexOf(x) === i; });
    uniq.forEach(function(qid){ cardRows().push({ v: a.p_visitor, hub: a.p_hub, qid: qid, what: "learn-reset", ahead: false, t: t, seen: seen, req: null, xp: 0, resp: { ok: true, xp: 0, why: "learn" } }); });
    save();
    return uniq.length;
  }
  function myCards2(a){
    if (!a.p_visitor || !a.p_hub) return [];
    return cardRows().filter(function(r){ return r.v === a.p_visitor && r.hub === a.p_hub; })
      .sort(function(x, y){ return x.seen - y.seen; }).slice(-20000)
      .map(function(r){ return [r.qid, r.what, Math.floor(r.seen), r.ahead ? 1 : 0, r.req]; });
  }
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
                   { kind: "suggestion", id: 8802, hub: "dashboard", note: "Fixture suggestion: a dark mode for the arcade.", resolved: false, created_at: iso(t - 2 * d), reply: null, resolved_at: null, can_notify: true, reply_seen_at: null }])
          .concat(timmyReportRows(t));
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
  /* ---------- the idea board (widget/ideas.js; its server is migration_v54, not applied until the redesign's release):
     made-up ideas, with what this test account posts, votes, reports and deletes kept in its own preview data. The
     answers follow the real functions (post_idea's checks and limits, get_ideas' tabs, filters and counts, three
     reports hide an idea, a new status leaves a note in the Inbox). None of the release's starter ideas is here. */
  var IDEA_CATS = ["feature", "better", "content", "fun", "look", "other"];
  var IDEA_FIX = [
    [6001, FAKE_NAMES[0], "Fixture idea: show how long each question took", "Next to the class average, so I can see where I'm slow.", null, "feature", "board", 14, 2, 0, 6],
    [6002, "Timmy Tooth", "Fixture starter: name the lecture on every missed question", "So it's clear at a glance which lecture to go back to.", null, "better", "starter", 9, 1, 0, 9],
    [6003, FAKE_NAMES[1], "Fixture idea: more radiograph questions", "The ones with a picture are the closest to the real thing.", "perio", "content", "checkin", 11, 0, 0, 4],
    [6004, FAKE_NAMES[2], "Fixture idea: a darker dark mode", "", null, "look", "board", 5, 6, 2, 3],
    [6005, FAKE_NAMES[3], "Fixture idea: a two-player arcade round", "Race a classmate through ten questions.", "occlusion", "fun", "board", 17, 1, 0, 12],
    [6006, FAKE_NAMES[4], "Fixture idea: bigger buttons in the mock", "They're easy to miss on a phone.", null, "better", "suggest", 21, 0, 0, 20],
    [6007, FAKE_NAMES[5], "Fixture idea: a search box on the cram sheet", "", "heme-endo-exam2", "feature", "board", 8, 0, 0, 2],
    [6008, FAKE_NAMES[6], "Fixture idea: hidden by three reports", "A fixture post to restore or keep hidden.", null, "other", "board", 1, 4, 3, 5],
    [6009, "Number thirty-one", "Fixture starter: a trophy for a week of drills", "Seven Daily Drills in a row.", null, "fun", "starter", 6, 3, 0, 9],
    [6010, FAKE_NAMES[7], "Fixture idea: the drawings in the question explanations too", "", "pcd-implants-exam1", "content", "board", 4, 0, 0, 1]
  ];
  var IDEA_SET = { 6005: ["planned", "Fixture note: after the redesign ships."], 6006: ["shipped", "Fixture note: built last week."], 6007: ["considering", null], 6008: ["open", null, true, "reports"] };
  function ideaDb(){
    if (!db.ideaPosts) { db.ideaPosts = []; db.ideaVotes = {}; db.ideaReports = {}; db.ideaAdmin = {}; db.ideaNotes = []; db.ideaGone = {}; }
    return db;
  }
  function ideaAll(t){
    ideaDb();
    var d = 864e5, rows = IDEA_FIX.map(function(f){
      var st = IDEA_SET[f[0]] || ["open", null];
      return { id: f[0], visitor: null, name: f[1], title: f[2], body: f[3], hub: f[4], category: f[5], source: f[6], up0: f[7], down0: f[8], reports0: f[9], at: iso(t - f[10] * d),
        status: st[0], note: st[1], status_at: st[0] === "open" ? null : iso(t - d), hidden: !!st[2], hidden_by: st[3] || null };
    }).concat(db.ideaPosts.map(function(p){ return { id: p.id, visitor: db.visitor, name: p.name, title: p.title, body: p.body, hub: p.hub, category: p.category, source: p.source, up0: 0, down0: 0, reports0: 0, at: p.at, status: "open", note: null, status_at: null, hidden: false, hidden_by: null }; }));
    return rows.filter(function(r){ return !db.ideaGone[r.id]; }).map(function(r){
      var ad = db.ideaAdmin[r.id]; if (ad) Object.keys(ad).forEach(function(k){ r[k] = ad[k]; });
      var mine = +db.ideaVotes[r.id] || 0; r.mine = mine; r.up = r.up0 + (mine === 1 ? 1 : 0); r.down = r.down0 + (mine === -1 ? 1 : 0);
      r.reported = !!db.ideaReports[r.id]; r.reports = r.reports0 + (r.reported ? 1 : 0);
      if (!ad && r.reports >= 3) { r.hidden = true; r.hidden_by = "reports"; }
      return r;
    });
  }
  function ideaBoard(a, t){
    var tab = a.p_tab || "top", hub = a.p_hub, cat = a.p_category || null, me = a.p_visitor;
    var v = ideaAll(t).filter(function(r){ return !r.hidden && (tab === "shipped" ? r.status === "shipped" : r.status !== "shipped"); });
    var hubf = v.filter(function(r){ return hub == null || (hub === "" ? !r.hub : (r.hub === hub || !r.hub)); });
    var catf = v.filter(function(r){ return !cat || r.category === cat; });
    var shown = hubf.filter(function(r){ return !cat || r.category === cat; });
    shown.sort(function(x, y){
      if (tab === "top" && (y.up - y.down) !== (x.up - x.down)) return (y.up - y.down) - (x.up - x.down);
      if (tab === "shipped" && x.status_at !== y.status_at) return x.status_at < y.status_at ? 1 : -1;
      return x.at < y.at ? 1 : x.at > y.at ? -1 : y.id - x.id;
    });
    var hubs = {}, cats = {};
    catf.forEach(function(r){ var k = r.hub || ""; hubs[k] = (hubs[k] || 0) + 1; });
    hubf.forEach(function(r){ cats[r.category] = (cats[r.category] || 0) + 1; });
    return { ideas: shown.slice(0, Math.max(1, Math.min(+a.p_limit || 50, 200))).map(function(r){
        return { id: r.id, title: r.title, body: r.body, name: r.name, hub: r.hub, category: r.category, source: r.source, status: r.status, note: r.note, status_at: r.status_at,
          up: r.up, down: r.down, at: r.at, own: !!me && r.visitor === me, mine: me === db.visitor ? r.mine : 0, reported: me === db.visitor && r.reported }; }),
      total: shown.length, hubs: hubs, categories: cats };
  }
  function ideaPost(a, t){
    ideaDb();
    var no = function(e){ return { data: { ok: false, error: e } }; };
    var title = String(a.p_title || "").replace(/\s+/g, " ").trim(), body = String(a.p_body || "").replace(/\s+/g, " ").trim(), hub = String(a.p_hub || "").trim() || null;
    if (!a.p_visitor || ["board", "suggest", "checkin"].indexOf(a.p_source || "board") < 0 || (a.p_request != null && !/^[A-Za-z0-9_-]{8,64}$/.test(a.p_request))) return no("bad");
    var prev = db.ideaPosts.filter(function(p){ return a.p_request && p.request === a.p_request; })[0];
    if (prev) return { data: { ok: true, id: prev.id, name: prev.name, repeat: true } };
    if (a.p_visitor !== db.visitor || !String(db.name || "").trim()) return no("name");
    if (title.length < 3 || title.length > 80) return no("title");
    if (body.length > 280) return no("long");
    if (hub && !/^[a-z0-9][a-z0-9-]{0,39}$/.test(hub)) return no("hub");
    if (IDEA_CATS.indexOf(a.p_category) < 0) return no("category");
    if (db.ideaPosts.some(function(p){ var age = t - Date.parse(p.at); return age >= 0 && age < 20000; })) return no("slow");
    if (db.ideaPosts.filter(function(p){ return day(Date.parse(p.at)) === day(t); }).length >= 3) return no("limit");
    var row = { id: 6500 + (db.ideaSeq = (db.ideaSeq || 0) + 1), name: String(db.name).trim().slice(0, 24), title: title, body: body, hub: hub, category: a.p_category, source: a.p_source || "board", request: a.p_request || null, at: iso(t) };
    db.ideaPosts.push(row); save();
    return { write: true, data: { ok: true, id: row.id, name: row.name } };
  }
  function ideaRpc(fn, a, t){
    var id = +a.p_id, row;
    switch (fn) {
      case "get_ideas": return { data: ideaBoard(a, t) };
      case "post_idea": return ideaPost(a, t);
      case "vote_idea":
        row = ideaAll(t).filter(function(r){ return r.id === id && !r.hidden; })[0];
        if (!row || a.p_visitor !== db.visitor || [-1, 0, 1].indexOf(a.p_val) < 0) return { data: null };
        if (a.p_val) db.ideaVotes[id] = a.p_val; else delete db.ideaVotes[id];
        save(); return { write: true, data: { up: row.up0 + (a.p_val === 1 ? 1 : 0), down: row.down0 + (a.p_val === -1 ? 1 : 0), mine: a.p_val } };
      case "report_idea":
        row = ideaAll(t).filter(function(r){ return r.id === id && !r.hidden && r.visitor !== a.p_visitor; })[0];
        if (!row || a.p_visitor !== db.visitor) return { data: false };
        db.ideaReports[id] = 1; save(); return { write: true, data: true };
      case "delete_my_idea":
        ideaDb(); row = db.ideaPosts.filter(function(p){ return p.id === id; })[0];
        if (!row || a.p_visitor !== db.visitor) return { data: false };
        db.ideaPosts = db.ideaPosts.filter(function(p){ return p.id !== id; }); delete db.ideaVotes[id]; delete db.ideaAdmin[id];
        db.ideaNotes = db.ideaNotes.filter(function(n){ return n.idea !== id; }); save(); return { write: true, data: true };
      case "get_my_inbox_v2": return { data: bootstrapInbox(a.p_visitor).concat(ideaNotes(a.p_visitor)) };
      case "mark_idea_note_seen": ideaDb(); db.ideaNotes.forEach(function(n){ if (n.id === id) n.seen = true; }); save(); return { write: true, data: true };
    }
    return null;
  }
  function ideaNotes(v){ ideaDb(); return v === db.visitor ? db.ideaNotes.map(function(n){ return { kind: "idea", id: n.id, hub: n.hub, title: n.title, note: n.status, message: n.note, at: n.at, seen: !!n.seen, expires_at: null, outcome: null }; }) : []; }
  /* the admin page's Idea board: every idea with its votes and reports, hide and restore, a status with one line on why */
  function ideaAdmin(fn, a, t){
    if (fn === "admin_ideas") return { data: ideaAll(t).sort(function(x, y){ return x.at < y.at ? 1 : -1; }).map(function(r){
      return { id: r.id, hub: r.hub, category: r.category, source: r.source, name: r.name, title: r.title, body: r.body, status: r.status, status_note: r.note, up: r.up, down: r.down, reports: r.reports, hidden: r.hidden, hidden_by: r.hidden_by, created_at: r.at }; }) };
    if (fn === "admin_post_starter_idea") return { write: true, data: 6900 };
    if (fn !== "admin_set_idea") return null;
    var row = ideaAll(t).filter(function(r){ return r.id === +a.p_id; })[0], k = 0;
    if (!row) return { data: { ok: false, error: "unknown" } };
    var ad = db.ideaAdmin[row.id] || (db.ideaAdmin[row.id] = { hidden: row.hidden, hidden_by: row.hidden_by, status: row.status, note: row.note, status_at: row.status_at });
    if (a.p_action === "hide") { ad.hidden = true; ad.hidden_by = "admin"; }
    else if (a.p_action === "restore") { ad.hidden = false; ad.hidden_by = null; delete db.ideaReports[row.id]; }
    else if (a.p_action === "status" && ["open", "considering", "planned", "shipped", "not-doing"].indexOf(a.p_status) >= 0) {
      var nn = String(a.p_note || "").trim().slice(0, 200) || null, changed = a.p_status !== row.status;
      ad.status = a.p_status; ad.note = nn; ad.status_at = iso(t);
      if (changed && a.p_status !== "open") {
        /* the author and everyone who voted it up: this test account, when it is one of them, plus the made-up voters */
        k = row.up0 + (row.visitor ? 1 : 0) + (row.mine === 1 && row.visitor !== db.visitor ? 1 : 0);
        if (row.visitor === db.visitor || row.mine === 1) db.ideaNotes.unshift({ id: 9700 + db.ideaNotes.length, idea: row.id, hub: row.hub, title: row.title, status: a.p_status, note: nn, at: iso(t), seen: false });
      }
    } else return { error: { status: 400, code: "P0001", message: "bad action" } };
    save(); return { write: true, data: { ok: true, notified: k } };
  }

  /* ---------- Ask Timmy (the `timmy` Edge Function and migration_v55's calls, from the redesign's release). A preview
     never calls the function or the model: these canned answers show each kind of reply (an answer with "From the notes"
     links into the hub's own notes, a plan from the student's progress, "not covered", a declined quiz question, a
     drafted report or idea, a nap), and every one says it's the preview's. Type "nap" to see him napping. ---------- */
  function timmyDb(){ if (!db.timmy) db.timmy = { chats: [], mseq: 7000 }; return db.timmy; }
  var timmyContent = {};
  function timmyHub(hub){
    if (!timmyContent[hub]) {
      var base = ROOT + "hubs/" + hub + "/next/content/";
      timmyContent[hub] = Promise.all([realFetch(base + "core.json").then(function(r){ return r.json(); }), realFetch(base + "notes.json").then(function(r){ return r.json(); })])
        .then(function(x){ return { core: x[0], notes: x[1] }; }, function(){ delete timmyContent[hub]; return null; });
    }
    return timmyContent[hub];
  }
  function timmyParas(html){
    var t = document.createElement("template"); t.innerHTML = html || "";
    return Array.prototype.map.call(t.content.querySelectorAll("p, li, h3, h4"), function(e, k){ return { k: k, text: String(e.textContent || "").replace(/\s+/g, " ").trim() }; });
  }
  function timmyUuid(){ var h = "0123456789abcdef", s = ""; for (var i = 0; i < 32; i++) s += h[Math.floor(Math.random() * 16)]; return s.slice(0, 8) + "-" + s.slice(8, 12) + "-4" + s.slice(13, 16) + "-a" + s.slice(17, 20) + "-" + s.slice(20); }
  function timmyReply(a){
    var text = String(a.text || "").trim(), low = text.toLowerCase(), dash = a.hub === "dashboard", plain = a.voice === "plain";
    var ctx = a.context || {}, hub = dash ? (Array.isArray(a.hubs) && a.hubs[0]) || "" : a.hub;
    var tail = { text: "(This is the preview's canned answer. On the live site " + (plain ? "the answer is written" : "Timmy writes his own") + " from the notes.)", cites: [] };
    if (/(^|\/)mock(\/|$)/.test(String(ctx.view || ""))) return Promise.resolve({ ok: true, kind: "paused", paragraphs: [{ text: plain ? "Ask the hub is paused during a mock exam." : "No help from me during a mock exam: it's your test. I'll be here when you finish.", cites: [] }], offer: null, go: null, closest: null });
    if (/^nap$/i.test(text)) return Promise.resolve({ ok: true, limited: "limit", kind: "limit", paragraphs: [{ text: plain ? "You've reached today's 40 questions. Ask again tomorrow; the notes are a tap away." : "That's my 40 questions for today, and I'm napping. The notes are right where you left them. Ask me again tomorrow.", cites: [] }], offer: null, go: null, closest: null });
    return (hub ? timmyHub(hub) : Promise.resolve(null)).then(function(H){
      var lecs = H && H.core && H.core.lectures || [], L = lecs.filter(function(l){ return l.id === ctx.lec; })[0] || lecs.filter(function(l){ return H.notes.full[l.id]; })[0] || null;
      var label = function(l){ return l ? (l.label || "L" + l.num) : ""; };
      var paras = L ? timmyParas(H.notes.full[L.id]) : [], P0 = null;
      if (ctx.lec === (L && L.id) && Number.isInteger(ctx.k)) P0 = paras.filter(function(x){ return x.k >= ctx.k && x.text.length > 40; })[0];
      P0 = P0 || paras.filter(function(x){ return x.text.length > 60; })[0] || null;
      var quote = P0 ? P0.text.split(" ").slice(0, 10).join(" ") : "";
      var cite = P0 ? [{ id: "N1." + P0.k, hub: hub, kind: "notes", label: label(L) + " notes", quote: quote, go: { v: "notes", lec: L.id, k: P0.k } }] : [];
      var r = { kind: "answer", paragraphs: [], offer: null, go: null, closest: null };
      var me = plain ? "" : "Great question. ";
      if (/\b(quiz|canvas|take-?home)\b/.test(low)) { r.kind = "quiz_declined"; r.paragraphs = [{ text: plain ? "That reads like a graded quiz question, so it won't be answered here. The notes on it are a tap away." : "That sounds like a graded quiz question, and I can't help with those. I'm happy to go over the notes on the topic once it's closed.", cites: [] }]; }
      else if (a.ask && a.ask.qid) { r.paragraphs = [{ text: me + "Here's the idea behind that one, in a few lines, with where it is in the notes.", cites: [] }, { text: P0 ? P0.text.slice(0, 220) : "The notes for that lecture explain it.", cites: cite }];
        r.paragraphs[0].cites = [{ id: "Q", hub: a.hub, kind: "question", label: "This question", quote: "", go: { v: "bank", q: a.ask.qid } }]; r.go = L ? { v: "practice", hub: hub, lec: L.id } : null; }
      else if (/broken|bug|typo|wrong key|doesn.?t work|won.?t load|report/.test(low)) { r.paragraphs = [{ text: plain ? "Sorry about that. Want to send it to Sam as a report?" : "Oof, sorry about that. Want me to write it up for Sam as a report?", cites: [] }];
        r.offer = { kind: "report", text: text.slice(0, 400), qid: null }; }
      else if (/\bidea\b|would be (cool|nice|great|helpful)|\bwish\b|you should add|could you add/.test(low)) { r.paragraphs = [{ text: plain ? "That could help others too. Post it on the idea board?" : "Ooh, I like it. Want to put it on the idea board so the class can vote?", cites: [] }];
        r.offer = { kind: "idea", title: text.replace(/[.!?]+$/, "").slice(0, 70), body: "", hub: dash ? "" : a.hub, category: "feature" }; }
      else if (/tonight|today|next|where should i start/.test(low)) {
        var pr = (a.progress && a.progress.lectures) || [], pick = pr.slice().sort(function(x, y){ return (y.missed - x.missed) || ((x.answered / (x.questions || 1)) - (y.answered / (y.questions || 1))); })[0];
        var PL = pick ? lecs.filter(function(l){ return l.id === pick.lec; })[0] : L;
        r.paragraphs = [{ text: pick ? "Start with " + label(PL) + (PL ? " " + String(PL.title).split(":")[0] : "") + (pick.missed ? ": you've missed " + pick.missed + " there on your latest tries." : pick.answered ? ": you've tried " + pick.answered + " of its " + pick.questions + " questions so far." : ": you haven't tried its " + pick.questions + " questions yet.") : "Start with the first lecture's notes, then its questions.", cites: [] },
          { text: "Read its notes first, then practice its questions until the misses are gone. Finish with the Daily drill.", cites: cite }];
        r.go = PL ? { v: "practice", hub: pick ? pick.hub || hub : hub, lec: PL.id } : { v: "drill", hub: dash ? hub : a.hub }; }
      else if (/dragon|weather|football|recipe|movie/.test(low)) { r.kind = "not_covered"; r.paragraphs = [{ text: plain ? "The notes don't cover that." : "My notes don't cover that one. Ask me about the lectures?", cites: [] }];
        r.closest = L ? { hub: hub, lec: L.id, label: label(L), title: L.title } : null; }
      else { r.paragraphs = [{ text: me + (P0 ? "The notes put it this way: " + P0.text.slice(0, 260) : "The notes cover it in the lectures."), cites: cite }]; if (L && P0) r.go = { v: "notes", hub: hub, lec: L.id, k: P0.k }; }
      r.paragraphs.push(tail);
      /* the chat, kept in this browser like every other preview save, so Past chats and the thumbs work */
      var T = timmyDb(), c = a.chat ? T.chats.filter(function(x){ return x.id === a.chat; })[0] : null, at = iso(now());
      if (!c) { c = { id: timmyUuid(), hub: a.hub, started: at, last: at, messages: [] }; T.chats.unshift(c); }
      c.last = at; c.messages.push({ id: ++T.mseq, who: "student", text: text, at: at });
      var mid = ++T.mseq; c.messages.push({ id: mid, who: "timmy", text: r.paragraphs.map(function(x){ return x.text; }).join("\n\n"), reply: r, kind: r.kind, thumb: null, offer: r.offer ? r.offer.kind : null, offer_action: null, at: at });
      save();
      return Object.assign({ ok: true, chat: c.id, message: mid }, r);
    });
  }
  function timmyRpc(fn, a){
    if (!/^(get_timmy_history|timmy_thumb|timmy_offer|timmy_report)$/.test(fn)) return null;
    var T = timmyDb(), find = function(id){ var out = null; T.chats.forEach(function(c){ c.messages.forEach(function(m){ if (m.id === id) out = { c: c, m: m }; }); }); return out; };
    if (fn === "get_timmy_history") return { data: T.chats.filter(function(c){ return c.hub === a.p_hub; }).sort(function(x, y){ return x.last < y.last ? 1 : -1; }).slice(0, Math.max(1, Math.min(a.p_limit || 10, 20))) };
    var f = a.p_message != null ? find(a.p_message) : null;
    if (fn === "timmy_thumb") { if (f) f.m.thumb = a.p_val ? a.p_val : null; save(); return { write: true, data: !!f }; }
    if (fn === "timmy_offer") { if (f) f.m.offer_action = a.p_action; save(); return { write: true, data: !!f }; }
    var note = String(a.p_note || "").trim();
    if (!note) return { data: { ok: false, error: "bad" } };
    var id = 8000 + db.flags.length;
    db.flags.push({ id: id, hub: f ? f.c.hub : a.p_hub, note: note.slice(0, 600) + " — Timmy" + (f ? "'s answer " + a.p_message : "") + (a.p_section ? " · " + a.p_section : ""), at: iso(now()) });
    if (f) f.m.report_id = id;
    save(); return { write: true, data: { ok: true, id: id } };
  }

  /* ---------- the admin page's Timmy tab (migration_v55's admin_timmy_* calls, from the redesign's release) ----------
     Made-up chats, shaped exactly as the functions return them: no visitor id anywhere, timestamps written the way
     PostgREST writes them, Timmy's checked answer in `reply` as the function stored it, the closest lecture as the text
     `reply->>'closest'` gives. The quotes are real lines of the three new hubs' notes; the questions and answers around
     them are made up. One chat carries markup in what the student typed, in Timmy's answer and in a quote, so the page is
     seen drawing it as text. The settings live in this account's fixture database; a Timmy report resolved in the Inbox
     shows as resolved here. The numbers by day are made up on their own (a few hundred questions a month). */
  var TM_CHAT_ID = "7e1e0000-0000-4000-a000-0000000000";
  function pgts(ms){ return iso(ms).replace("Z", "+00:00"); }
  /* jsonb's text form: keys by length, then bytes; ", " and ": " between them */
  function jsonbText(v){
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(jsonbText).join(", ") + "]";
    return "{" + Object.keys(v).sort(function(a, b){ return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0); }).map(function(k){ return JSON.stringify(k) + ": " + jsonbText(v[k]); }).join(", ") + "}";
  }
  function timmyFixtures(t){
    var D = 864e5, H = 36e5, M = 6e4, chats = [], mid = 7100;
    function note(hub, n, lec, k, label, quote, dash){ return { id: (dash ? hub + ":" : "") + "N" + n + "." + k, hub: hub, kind: "notes", label: label, quote: quote, go: { v: "notes", lec: lec, k: k } }; }
    function ctx(view, lec, k, more){ var c = { view: view, lec: lec || null, k: k == null ? null : k, voice: "timmy" }; Object.keys(more || {}).forEach(function(x){ c[x] = more[x]; }); return c; }
    function say(kind, paras, more){ var r = { kind: kind, paragraphs: paras.map(function(p){ return { text: p[0], cites: p[1] || [] }; }), offer: null, go: null, closest: null }; Object.keys(more || {}).forEach(function(x){ r[x] = more[x]; }); return r; }
    function chat(hub, ago, turns){
      var at = t - ago, c = { id: TM_CHAT_ID + ("0" + (chats.length + 1)).slice(-2), hub: hub, started: pgts(at), last: null, messages: [] };
      turns.forEach(function(u, i){
        var s = at + i * 4 * M, r = u.reply, failed = r.kind === "error", tok = failed ? [null, null, null, null] : u.tok || [1100, 340, 76800, 0];
        var cost = failed ? 0 : Math.round((tok[0] * 4 + tok[1] * 20 + tok[2] * 0.2 + tok[3] * 8)) / 1e6, ok = 0;
        r.paragraphs.forEach(function(p){ ok += p.cites.length; });
        c.messages.push({ id: ++mid, who: "student", text: u.ask, kind: null, context: u.ctx, reply: null, cites_ok: null, cites_bad: null, unchecked: null,
          offer: null, offer_action: null, thumb: null, report_id: null, reported_at: null, report: null, model: null, input_tokens: null, output_tokens: null,
          cache_read_tokens: null, cache_write_tokens: null, cost_usd: null, ms: null, at: pgts(s) });
        var tid = ++mid, rep = u.report ? db.tmResolved && db.tmResolved[u.report.id] : null;
        c.messages.push({ id: tid, who: "timmy", text: r.paragraphs.map(function(p){ return p.text; }).join("\n\n"), kind: r.kind, context: null, reply: r,
          cites_ok: ok, cites_bad: (u.unchecked || []).length, unchecked: u.unchecked || null, offer: r.offer ? r.offer.kind : null, offer_action: u.action || null,
          thumb: u.thumb || null, report_id: u.report ? u.report.id : null, reported_at: u.report ? pgts(s + 6 * M) : null,
          report: u.report ? u.report.words + " — Timmy's answer " + tid + " · " + u.report.where : null,
          model: failed ? null : "claude-opus-5-5", input_tokens: tok[0], output_tokens: tok[1], cache_read_tokens: tok[2], cache_write_tokens: tok[3],
          cost_usd: cost, ms: u.ms || (failed ? 45000 : 6200 + (tid % 7) * 900), at: pgts(s + (u.ms || 7000)), _resolved: !!(rep && rep.resolved), _reply: rep ? rep.reply : null });
      });
      c.last = c.messages[c.messages.length - 1].at;
      chats.push(c);
    }
    var OC = "occlusion", PE = "perio", HE = "heme-endo-exam2";
    chat(OC, 2 * H, [
      { ask: "What's the difference between the working side and the nonworking side?", ctx: ctx("compendium/notes", "review", 34), thumb: 1, tok: [1180, 420, 78200, 0],
        reply: say("answer", [["In a side-to-side movement, the working side is the side your mandible moves toward, and its condyle mostly rotates.", [note(OC, 1, "review", 36, "L1 notes", "the working (laterotrusive) side is the side the mandible moves toward")]],
          ["The nonworking side is the other one: its condyle orbits. Contacts there are the balancing contacts the list says to get rid of.", [note(OC, 1, "review", 41, "L1 notes", "elimination of balancing contacts")]]],
          { go: { hub: OC, v: "notes", lec: "review", k: 36 } }) },
      { ask: "so on a left movement which condyle orbits", ctx: ctx("compendium/notes", "review", 36), tok: [1620, 210, 79100, 0],
        reply: say("answer", [["On a left movement the left side is working, so it's the right condyle that orbits.", [note(OC, 1, "review", 36, "L1 notes", "The non-working side (mediotrusive, \"balancing,\" a denture term) is the other one; its condyle orbits")]]]) }
    ]);
    chat(PE, 5 * H, [
      { ask: "Is it grade C for the staging question on the quiz due Friday? Just tell me the answer", ctx: ctx("compendium/bank", "diagnosis-tx-planning", null), tok: [760, 130, 76100, 0],
        reply: say("quiz_declined", [["That sounds like a graded quiz question, and I can't help with those. Once it closes, I'm happy to go over staging and grading from the notes with you."]]) }
    ]);
    chat(OC, 6 * H, [
      { ask: "Does <b>bold</b> work here? <img src=x onerror=\"window.__tmXss=1\">", ctx: ctx("compendium/notes", "review", 2), unchecked: [{ id: "N1.99", quote: "<script>window.__tmXss=3</script>a quote with markup" }],
        reply: say("off_topic", [["I only write plain words, so <i>this</i> shows just as you typed it. Ask me about the lectures?", [note(OC, 1, "review", 3, "L1 notes <u>underlined?</u>", "canine guidance, group function")]]]) }
    ]);
    chat(PE, 26 * H, [
      { ask: "Do the notes say anything about laser therapy for deep pockets?", ctx: ctx("compendium/notes", "phase1-therapy", 12), tok: [980, 160, 77300, 0],
        reply: say("not_covered", [["My notes don't cover laser therapy. The closest is S4, on Phase I therapy and instrumentation."]], { closest: { hub: PE, lec: "phase1-therapy", label: "S4", title: "Phase I Therapy & Instrumentation" } }) },
      { ask: "ok what's the low dose doxycycline one called", ctx: ctx("compendium/notes", "antibiotics-host-mod", 50), thumb: 1, tok: [1400, 260, 78000, 0],
        reply: say("answer", [["That's Periostat: the first drug by mouth approved for host modulation, a low dose of doxycycline used alongside scaling and root planing.", [note(PE, 8, "antibiotics-host-mod", 55, "S8 notes", "a low, sub-antimicrobial dose of doxycycline")]]],
          { go: { hub: PE, v: "notes", lec: "antibiotics-host-mod", k: 55 } }) }
    ]);
    chat(HE, 27 * H, [
      { ask: "Why is it “Metformin”?", ctx: ctx("compendium/bank", "dmpharm", null, { ask: { qid: "dm-first-line", right: false, picks: [2] } }), tok: [2300, 380, 77600, 0],
        unchecked: [{ id: "N1.58", quote: "metformin is never given with kidney disease" }],
        reply: say("answer", [["You picked a sulfonylurea, but for a newly diagnosed, otherwise healthy patient the first-line drug is metformin.", [{ id: "Q", hub: HE, kind: "question", label: "This question", quote: "first-line", go: { v: "bank", q: "dm-first-line" } }]],
          ["It won't push a normal glucose any lower, so its risk of hypoglycemia is very low.", [note(HE, 1, "dmpharm", 57, "L11 notes", "metformin has no effect in normoglycemic states")]]],
          { go: { v: "practice", hub: HE, lec: "dmpharm" } }) },
      { ask: "I think the explanation on this one names the wrong drug", ctx: ctx("compendium/bank", "dmpharm", null), action: "sent", tok: [2600, 190, 79900, 0],
        reply: say("answer", [["If the explanation names a different drug than the key, that's worth fixing. Want me to write it up for Sam as a report?"]],
          { offer: { kind: "report", text: "The explanation for this question names a different drug than the key (metformin).", qid: "dm-first-line" } }) }
    ]);
    chat(HE, 30 * H, [
      { ask: "How long does metformin's stomach upset last?", ctx: ctx("compendium/notes", "dmpharm", 56), thumb: -1, tok: [1250, 150, 77900, 0],
        unchecked: [{ id: "N1.58", quote: "fades in a day or two" }], report: { id: 8811, words: "He said a day or two, but the notes say one or two weeks.", where: "compendium/notes" },
        reply: say("answer", [["The stomach upset usually fades in a day or two."]]) }
    ]);
    chat("dashboard", 2 * D, [
      { ask: "What should I study tonight?", ctx: { view: "dashboard", lec: null, k: null, voice: "timmy", hubs: [HE, OC, PE], progress: { lectures: 27 } }, thumb: 1, tok: [1900, 380, 0, 231000],
        reply: say("answer", [["Start with L11, Pharmacology of Diabetes Mellitus: you've missed 6 there on your latest tries.", []],
          ["Read its notes on metformin first, then practice L11 until the misses are gone.", [note(HE, 1, "dmpharm", 55, "L11 notes", "it is still the first-line drug for newly diagnosed type 2 diabetes", true)]]],
          { go: { v: "practice", hub: HE, lec: "dmpharm" } }) }
    ]);
    chat(OC, 3 * D, [
      { ask: "It would be cool if the arcade had a timed round for cusp pathways", ctx: ctx("arcade/lobby", null, null), action: "posted", tok: [900, 240, 76400, 0],
        reply: say("answer", [["Ooh, I like it. Want to put it on the idea board so the class can vote?"]],
          { offer: { kind: "idea", title: "A timed round for cusp pathways", body: "A round against the clock: working, nonworking and protrusive pathways.", hub: OC, category: "fun" } }) }
    ]);
    chat(OC, 3 * D + 5 * H, [
      { ask: "Explain canine guidance simply", ctx: ctx("compendium/notes", "review", 3, { voice: "plain" }), reply: say("error", [["Something went wrong. Try again in a minute."]]) },
      { ask: "Explain canine guidance simply", ctx: ctx("compendium/notes", "review", 3, { voice: "plain" }), tok: [1500, 230, 78300, 0],
        reply: say("answer", [["With canine guidance, the canines take a side-to-side movement on their own and lift the back teeth apart.", [note(OC, 1, "review", 3, "L1 notes", "canine guidance, group function")]]]) }
    ]);
    chat(PE, 4 * D, [
      { ask: "I'm so stressed about the final I can't focus on anything", ctx: ctx("home/dashboard", null, null), thumb: 1, tok: [820, 150, 76000, 0],
        reply: say("support", [["That's a lot to carry before a final, and it makes sense. Take a short break, then pick one small piece, like one lecture's High yield."],
          ["If it ever feels like more than stress, UAB's student counseling is there for you, and you can call or text 988 any time."]]) }
    ]);
    return chats;
  }
  function timmyAdmin(fn, a, t){
    if (!/^admin_timmy_/.test(fn)) return null;
    var D = 864e5, today = day(t), days = Math.max(1, Math.min(Number(a.p_days) || 30, 400)), chats = timmyFixtures(t);
    var inDays = function(d){ return Math.round((new RealDate(today + "T12:00").getTime() - new RealDate(d + "T12:00").getTime()) / D) < days; };
    var tim = []; chats.forEach(function(c){ c.messages.forEach(function(m, i){ if (m.who === "timmy") tim.push({ c: c, m: m, s: c.messages[i - 1] }); }); });
    tim.sort(function(x, y){ return y.m.id - x.m.id; });
    var mday = function(m){ return day(new RealDate(m.at).getTime()); }, clean = function(m){ var o = {}; Object.keys(m).forEach(function(k){ if (k[0] !== "_") o[k] = m[k]; }); return o; };
    if (fn === "admin_timmy_days") {
      var out = [], HUBS = ["occlusion", "perio", "heme-endo-exam2", "dashboard"];
      for (var i = 0; i < Math.min(days, 45); i++) HUBS.forEach(function(h, hi){
        var x = hash(h + "|" + i), d = day(t - i * D);
        if (h === "dashboard" && x % 3 === 0) return;
        if (h === "heme-endo-exam2" && i > 20) return;
        var people = 2 + x % 7 + (hi === 0 ? 2 : 0) + (i < 3 ? 3 : 0), q = people + (x >>> 4) % (people + 1), ans = q - (x % 11 === 0 ? 1 : 0);
        var cost = Math.round((q * 0.043 + ((x >>> 8) % 3 === 0 ? 0 : 0.62) + (h === "dashboard" && (x >>> 8) % 2 ? 1.2 : 0)) * 1e4) / 1e4;
        out.push({ day: d, hub: h, people: people, questions: q, answers: ans, cost_usd: cost, not_covered: Math.round(ans * 0.06 + (x >>> 3) % 2),
          quiz_declined: (x >>> 5) % 3 === 0 ? 1 : 0, hint_declined: (x >>> 6) % 4 === 0 ? 1 : 0, errors: q - ans, thumbs_up: Math.round(ans * 0.22), thumbs_down: (x >>> 7) % 4 === 0 ? 1 : 0,
          cites_ok: Math.round(ans * 2.4), cites_bad: (x >>> 9) % 5 === 0 ? 1 : 0, offers: (x >>> 10) % 3, offers_taken: (x >>> 10) % 3 ? 1 : 0, reported: (x >>> 11) % 7 === 0 ? 1 : 0 });
      });
      return { data: out.filter(function(r){ return inDays(r.day); }) };
    }
    if (fn === "admin_timmy_chats") {
      var lim = Math.max(1, Math.min(Number(a.p_limit) || 100, 500));
      return { data: chats.filter(function(c){ return (!a.p_hub || c.hub === a.p_hub) && new RealDate(c.last).getTime() > t - days * D; })
        .sort(function(x, y){ return x.last < y.last ? 1 : -1; }).slice(0, lim).map(function(c){
          var kinds = {}, cost = 0, down = 0;
          c.messages.forEach(function(m){ if (m.kind) kinds[m.kind] = 1; cost += Number(m.cost_usd) || 0; if (m.thumb === -1) down++; });
          return { id: c.id, hub: c.hub, started_at: c.started, last_at: c.last, messages: c.messages.length,
            first_question: c.messages[0].text.slice(0, 200), kinds: Object.keys(kinds).sort(), thumbs_down: down, cost_usd: Math.round(cost * 1e4) / 1e4 };
        }) };
    }
    if (fn === "admin_timmy_chat") {
      var c = chats.filter(function(x){ return x.id === a.p_chat; })[0];
      return { data: c ? { id: c.id, hub: c.hub, started: c.started, last: c.last, messages: c.messages.map(clean) } : null };
    }
    if (fn === "admin_timmy_not_covered") return { data: tim.filter(function(x){ return x.m.kind === "not_covered" && inDays(mday(x.m)); }).map(function(x){
      return { message_id: x.m.id, chat_id: x.c.id, hub: x.c.hub, day: mday(x.m), question: x.s.text, closest: x.m.reply.closest ? jsonbText(x.m.reply.closest) : null }; }) };
    if (fn === "admin_timmy_unchecked") return { data: tim.filter(function(x){ return x.m.cites_bad > 0 && inDays(mday(x.m)); }).map(function(x){
      return { message_id: x.m.id, chat_id: x.c.id, hub: x.c.hub, day: mday(x.m), unchecked: x.m.unchecked }; }) };
    if (fn === "admin_timmy_reported") return { data: tim.filter(function(x){ return x.m.report_id && new RealDate(x.m.reported_at).getTime() > t - days * D; })
      .sort(function(x, y){ return x.m.reported_at < y.m.reported_at ? 1 : -1; }).map(function(x){
        return { message_id: x.m.id, chat_id: x.c.id, hub: x.c.hub, day: mday(x.m), kind: x.m.kind, answer: x.m.text.slice(0, 400), report_id: x.m.report_id,
          report: x.m.report, resolved: x.m._resolved, reported_at: x.m.reported_at }; }) };
    if (fn === "admin_timmy_config") {
      var cfg = db.timmyCfg || { enabled: true, day_cap_usd: 10, per_visitor_day: 40, reserve_usd: 0.08, updated_at: pgts(t - 3 * D) }, write = false;
      if (a.p_enabled != null || a.p_day_cap_usd != null || a.p_per_visitor_day != null) {
        if (a.p_enabled != null) cfg.enabled = !!a.p_enabled;
        if (a.p_day_cap_usd != null) cfg.day_cap_usd = Math.round(Math.max(0, Math.min(Number(a.p_day_cap_usd), 100)) * 100) / 100;
        if (a.p_per_visitor_day != null) cfg.per_visitor_day = Math.max(0, Math.min(Math.round(Number(a.p_per_visitor_day)), 500));
        cfg.updated_at = pgts(t); db.timmyCfg = cfg; save(); write = true;
      }
      var todays = timmyAdmin("admin_timmy_days", { p_days: 1 }, t).data;
      return { write: write, data: { enabled: cfg.enabled, day_cap_usd: cfg.day_cap_usd, per_visitor_day: cfg.per_visitor_day, reserve_usd: cfg.reserve_usd, updated_at: cfg.updated_at,
        spent_today: Math.round(todays.reduce(function(s, r){ return s + r.cost_usd; }, 0) * 1e4) / 1e4, questions_today: todays.reduce(function(s, r){ return s + r.questions; }, 0) } };
    }
    return { error: { status: 404, code: "PGRST202", message: "Could not find the function public." + fn + " in the schema cache" } };
  }
  /* the Inbox lists a Timmy report like any report (question_flags); resolving it there shows on the Timmy tab */
  function timmyReportRows(t){
    var out = [];
    timmyFixtures(t).forEach(function(c){ c.messages.forEach(function(m){ if (m.report_id) out.push({ kind: "flag", id: m.report_id, hub: c.hub, note: m.report, resolved: m._resolved,
      created_at: iso(new RealDate(m.reported_at).getTime()), reply: m._reply || null, resolved_at: null, can_notify: true, reply_seen_at: null }); }); });
    return out;
  }

  function rpc(fn, a){
    a = a || {};
    /* the database before a migration: the preview's settings (sh_preview_ui) can list function-name prefixes that answer
       as the live database does before their migration is applied, e.g. { "missing": ["admin_timmy_"] } until the release */
    var missing = jget(K.ui, {}).missing;
    if (Array.isArray(missing) && missing.some(function(p){ return p && fn.indexOf(p) === 0; }))
      return { error: { status: 404, code: "PGRST202", message: "Could not find the function public." + fn + " in the schema cache" } };
    if (ADMIN_FNS.test(fn)) {
      if (a.p_secret !== C.adminSecret) return unauthorized();
      var ideaOp = ideaAdmin(fn, a, now());
      if (ideaOp) return ideaOp;
      var ops = adminOps(fn, a);
      if (ops) return ops;
      var tmA = timmyAdmin(fn, a, now());
      if (tmA) { if (tmA.write) save(); return tmA; }
      if (/^(admin_|set_report_resolved)/.test(fn) && fn !== "admin_pod_comments") {
        if (fn === "set_report_resolved") db.flags.concat(db.suggestions).forEach(function(r){ if (r.id === a.p_id) { r.resolved = a.p_resolved; r.reply = a.p_reply; } });
        if (fn === "set_report_resolved" && a.p_kind === "flag" && timmyReportRows(now()).some(function(r){ return r.id === a.p_id; })) {
          db.tmResolved = db.tmResolved || {}; db.tmResolved[a.p_id] = { resolved: !!a.p_resolved, reply: a.p_reply || null }; }
        if (fn === "admin_hide_pod_comment") { db.podHidden = db.podHidden || {}; db.podHidden[a.p_id] = !!a.p_hidden; }
        if (fn === "admin_post_notice") db.notices.push({ title: a.p_title, message: a.p_message, at: iso(now()) });
        if (fn === "admin_review_question") { db.qhReviews = db.qhReviews || {}; var rk0 = a.p_hub + "|" + a.p_qid;
          if (!a.p_status) delete db.qhReviews[rk0]; else db.qhReviews[rk0] = { status: a.p_status, v: a.p_v, flags: a.p_flags || [], note: a.p_note || null, at: iso(now()) }; }
        save(); return { write: true, data: null };
      }
      return { data: fn === "get_question_health" ? qhFixture(a.p_hub, a.p_current) : synthAdmin(fn) };
    }
    var v = a.p_visitor, hub = a.p_hub, t = now();
    var tm = timmyRpc(fn, a); if (tm) return tm;
    /* the game layer's functions (migration_v54: written, tested, and not applied until the redesign's release). The new
       dashboard (widget/dash.js) calls them as <name>_v2, so the preview answers them from today's fixtures plus what
       v54 adds to a row: the rank on the 63-step ladder (journey, tier, level, step: from the row's XP, or a made-up
       classmate's own XP on the boards that don't show it), the medals of the two that have them, and a visit key (made
       up here; the real one is a digest only the server can make, the same for a person on every board). */
    if (/^get_(widget_bootstrap|rank_profile|rank_board|leaderboard|arcade_leaderboard)_v2$/.test(fn)) {
      if (fn === "get_rank_profile_v2") return { data: profile2(v) };
      var d2 = rpc(fn.slice(0, -3), a).data;
      var vkey = visitKeyOf;
      if (Array.isArray(d2)) d2 = d2.map(function(r){
        var o2 = {}; Object.keys(r).forEach(function(k){ o2[k] = r[k]; }); o2.journey = 0; o2.visit = vkey(r.display_name);
        /* a board row with XP stands where the 63-step ladder puts it (your own row, past the Handpiece); a made-up
           classmate on a board without XP stands where their own XP does, as the server's sh_rank(xp) puts everyone */
        var fx = typeof r.xp === "number" && r.tier != null ? r.xp : !r.is_me && FAKE_NAMES.indexOf(r.display_name) >= 0 ? fakeXp(r.display_name) : null;
        if (fx != null) { var rr = rank2(fx); o2.journey = rr.journey; o2.tier = rr.tier; o2.level = rr.level; o2.step = rr.step; }
        if (!r.is_me && FAKE_FLAIR[r.display_name]) o2.flair = FAKE_FLAIR[r.display_name];
        return o2; });
      else if (d2 && d2.rank) { d2.rank = profile2(v); if (Array.isArray(d2.inbox)) d2.inbox = d2.inbox.concat(ideaNotes(v)); d2.shop = shop2(v);
        if (Array.isArray(d2.pet_days)) d2.pet_days = petDays2(t); }
      return { data: d2 };
    }
    /* Timmy's place (phase 4, part C): what this account owns and where it stands, as migration_v54 answers it */
    if (fn === "get_my_shop") return { data: shop2(v) };
    if (fn === "equip_item") return { write: v === db.visitor, data: equip2(v, a.p_slot, a.p_item) };
    if (fn === "get_pet_days_v2") return { data: v === db.visitor ? petDays2(t) : [] };
    /* the shop (phase 4, part B): buying and the rare costumes' log */
    if (fn === "buy_item") return { write: v === db.visitor, data: buy2(v, a.p_item, a.p_request) };
    if (fn === "record_costume_sighting") return { write: v === db.visitor, data: sight2(v, a.p_costume) };
    if (fn === "record_answer_v2") return { write: true, data: answer2(a, t) };
    /* Learn and Flashcards (migration_v56) */
    if (fn === "record_card_v2") return { write: true, data: card2(a, t) };
    if (fn === "reset_my_learn") return { write: true, data: resetLearn2(a, t) };
    if (fn === "get_my_cards") return { data: v === db.visitor ? myCards2(a) : [] };
    if (fn === "mark_dark_unlock_seen") { if (v === db.visitor) { db.dark = db.dark || []; if (db.dark.indexOf(a.p_journey) < 0) db.dark.push(a.p_journey); save(); } return { write: true, data: true }; }
    if (fn === "xp_session_start") {
      if (v !== db.visitor) return { data: null };
      var sid = "00000000-0000-4000-8000-" + ("000000000000" + (hash(String(t) + "|" + hub) >>> 0).toString(16)).slice(-12);
      db.sess = db.sess || {}; db.sess[sid] = { hub: hub, kind: a.p_kind, t0: t, n: 0, c: 0, q: {}, done: false }; save();
      return { write: true, data: sid };
    }
    if (fn === "xp_session_finish") {
      var ss = db.sess && db.sess[a.p_session];
      if (v !== db.visitor || !ss) return { data: { ok: false, error: "bad" } };
      if (ss.done) return { data: { ok: true, repeat: true, xp: 0 } };
      ss.done = true; db.mockDay = db.mockDay || {};
      var mk = ss.hub + "|" + day(t), mm = boost2(t) ? 2 : 1, got2 = 0;
      if (ss.kind === "mock" && ss.n >= 10 && !db.mockDay[mk]) { db.mockDay[mk] = 1; got2 = 50 * mm; db.xp2 = (db.xp2 || 0) + got2; }
      save();
      return { write: true, data: { ok: true, xp: got2, mult: mm, answers: ss.n, correct: ss.c } };
    }
    /* someone's place (visiting, and the dashboard's stage, where the top three stand as their own Timmys), as
       migration_v54's get_place answers it: the name as the boards show it, what stands in each slot, the rank (journey,
       tier, level) and the medals, never an id, XP, HP or a date. Each made-up classmate has a place of their own from the
       kit's pieces (FAKE_PLACES), the first in the ModuPro journey; one place can't be read (null), on purpose, for the
       plain Timmy on the stage and the "couldn't be opened" line. Your own key opens your own place. */
    if (fn === "get_place") {
      var pk = String(a.p_key || ""), who = -1, vk = visitKeyOf;
      if (!/^[0-9a-f]{24}$/.test(pk)) return { data: null };
      var myName = db.name || "You (preview)";
      if (pk === vk(myName)) { var mp = profile2(db.visitor), meq = {}, pe = placeEquipped(); Object.keys(pe).forEach(function(k){ meq[k] = pe[k]; });
        return { data: { name: myName, equipped: meq, rank: { journey: mp.journey, tier: mp.tier, level: mp.level }, flair: null } }; }
      FAKE_NAMES.forEach(function(nm, i){ if (vk(nm) === pk) who = i; });
      if (who < 0 || who === 4) return { data: null };
      var fr = rank2(fakeXp(FAKE_NAMES[who])), feq = {}, fp = FAKE_PLACES[who] || {};
      Object.keys(fp).forEach(function(k){ feq[k] = fp[k]; });
      return { data: { name: FAKE_NAMES[who], equipped: feq, rank: { journey: fr.journey, tier: fr.tier, level: fr.level }, flair: FAKE_FLAIR[FAKE_NAMES[who]] || null } };
    }
    /* migration_v57's get_random_place (Visit someone random, from the whole class): anyone in the made-up class but you
       (and the one place that can't be read), the ones whose keys aren't in p_skip first, as get_place answers them, with
       the key. Every made-up classmate is in it, the ones the board on the screen leaves out too */
    if (fn === "get_random_place") {
      var sk = Array.isArray(a.p_skip) ? a.p_skip : [], pool = FAKE_NAMES.filter(function(nm, i){ return i !== 4; }),
        fresh = pool.filter(function(nm){ return sk.indexOf(visitKeyOf(nm)) < 0; }), from = fresh.length ? fresh : pool,
        pick = from[Math.floor(Math.random() * from.length)], rp = rpc("get_place", { p_key: visitKeyOf(pick) }).data;
      return { data: rp ? Object.assign({}, rp, { visit: visitKeyOf(pick) }) : null };
    }
    var ideaAns = ideaRpc(fn, a, t);
    if (ideaAns) return ideaAns;
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
          position: xp > fakeXp(FAKE_NAMES[0]) ? 1 : xp > 50000 ? 2 : xp > 2000 ? 9 : 31, of: 64, badges: (db.badges || []).concat(db.achievements) } };
      }
      case "get_rank_board": {
        var me = myXp(), rows = FAKE_NAMES.slice(0, 10).map(function(n){ return { display_name: n, xp: fakeXp(n), is_me: false }; });
        rows.push({ display_name: db.name || "You (preview)", xp: me, is_me: true });
        rows.sort(function(x, y){ return y.xp - x.xp; });
        /* the top ten, and your own row below them as the server keeps it (rnk <= limit or the caller's own row) */
        return { data: rows.map(function(r, i){ var tr2 = tierOf(r.xp); return { rnk: i + 1, display_name: r.display_name, xp: r.xp, tier: tr2, level: stepOf(r.xp) - tr2 * 3 + 1, is_me: r.is_me, flair: null }; })
          .filter(function(r){ return r.rnk <= (a.p_limit || 10) || (r.is_me && !!a.p_visitor); }) };
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
    /* Ask Timmy's function: a canned answer after a moment's "thinking" (above) */
    if (p === "/functions/v1/timmy" && method === "POST") {
      logEntry("write", "timmy (canned answer)", { hub: args.hub, voice: args.voice, view: args.context && args.context.view });
      return timmyReply(args).then(function(d){ return new Promise(function(ok){ setTimeout(function(){ ok(respond(200, d)); }, speed === "slow" ? 4000 : 1200); }); });
    }
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
     out. The first one stands in for a hub tab of your own: he stays, wears what your Timmy wears and is remembered the
     way a hub tab remembers itself ("sh_presence_mine", widget/v3.js), so the room tags him "You". Nothing here is
     anyone's real presence. */
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
          var hubs = D.hubs(), by = {}, list = [], me = {};
          crowd.forEach(function(p){
            var h = hubs[[0, 0, 1, 0, 2, 1][p.slot % 6] % hubs.length], fit = p.fit; if (!h) return;
            if (p.slot === 1) { me[h.id + "/" + p.key] = Date.now(); try { fit = (window.shPet && window.shPet.fit && window.shPet.fit()) || ""; } catch (e) { fit = ""; } }
            by[h.id] = (by[h.id] || 0) + 1; list.push({ key: p.key, hub: h.id, fit: fit });
          });
          try { localStorage.setItem("sh_presence_mine", JSON.stringify(me)); } catch (e) {}
          D.setLive(by, list);
        }
      } catch (e) {}
    }
    setTimeout(send, 1200);
    setInterval(function(){
      var r = Math.random();
      if (crowd.length <= 4 || (r < .55 && crowd.length < 16)) add(); else crowd.splice(1 + Math.floor(Math.random() * (crowd.length - 1)), 1);
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
