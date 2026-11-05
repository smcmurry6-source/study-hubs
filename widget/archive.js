/* ============ HUB ARCHIVE STATE (shared) ============
   Which public state a hub is in right now: "live" (a card with an Open button), "archived" (a greyed card, no Open
   button, check-in buttons by the exam dates) or "hidden" (no card). Two inputs, in this order of precedence:

     1. A manual override from the admin page (review/, Hubs tab; table hub_archive_overrides, migration_v50):
        live, archived or hidden, in force until Sam sets the hub back to Automatic or until its end time (until).
     2. Automatic, from the dashboard's dates in index.html: a hub in HUBS archives at ARCHIVE_HOUR (10 pm) on the day
        of its last exam (an exam's archiveHour, or the hub's archiveOn {date, hour}, moves that), and its card is
        hidden CARD_DAYS (10) days later (hideCardOn moves that). A hub listed in ARCHIVED_HUBS is archived from the
        start and hidden at its card-removal time.

   An override in force always wins; when it ends or is cleared, the dates decide again. Nothing here deletes or moves
   anything: the hub's page and direct link, questions, analytics and progress stay, and check-ins follow the exam dates.
   Loaded by index.html (before its main script), review/index.html, and tested by tools/ci/archive.js (Node).
   widget/v3.js applies the same override rule to its "This hub is archived" notice. Reference:
   vault/reference/admin-operations.md. */
(function(root){
  "use strict";
  var STATES = ["live", "archived", "hidden"];
  var DEFAULTS = { archiveHour: 22, cardDays: 10 };
  function opt(o){ o = o || {}; return { archiveHour: o.archiveHour != null ? o.archiveHour : DEFAULTS.archiveHour, cardDays: o.cardDays != null ? o.cardDays : DEFAULTS.cardDays }; }
  function parseYmd(s){ var p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function examAt(x, hour){ var d = parseYmd(x.date); d.setHours(hour, 0, 0, 0); return d; }
  function lastExam(hub){
    return ((hub && hub.exams) || []).filter(function(x){ return x && x.date; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; })[0] || null;
  }
  /* when the dates archive a hub (null: never, e.g. no exam yet) */
  function archiveAt(hub, o){
    o = opt(o);
    if (hub.archiveOn && hub.archiveOn.date) { var d = parseYmd(hub.archiveOn.date); d.setHours(hub.archiveOn.hour != null ? hub.archiveOn.hour : o.archiveHour, 0, 0, 0); return d; }
    var x = lastExam(hub); return x ? examAt(x, x.archiveHour != null ? x.archiveHour : o.archiveHour) : null;
  }
  /* when the dates take the archived card off the dashboard (null: no date, so an archived hub shows no card) */
  function cardGoneAt(hub, o){
    o = opt(o);
    if (hub.hideCardOn && typeof hub.hideCardOn === "object") { var h = parseYmd(hub.hideCardOn.date); h.setHours(hub.hideCardOn.hour != null ? hub.hideCardOn.hour : 0, 0, 0, 0); return h; }
    if (hub.hideCardOn) return parseYmd(hub.hideCardOn);
    var a = archiveAt(hub, o); return a ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + o.cardDays, o.archiveHour) : null;
  }
  /* the state by the dates alone; listedArchived: the hub is in ARCHIVED_HUBS (moved there by hand in the code) */
  function autoState(hub, now, o, listedArchived){
    now = now || new Date();
    var gone = cardGoneAt(hub, o);
    if (!listedArchived) { var a = archiveAt(hub, o); if (!a || now < a) return "live"; }
    return gone && now < gone ? "archived" : "hidden";
  }
  /* an override row ({ state, until }) if it is in force at `now`, else null */
  function activeOverride(ov, now){
    if (!ov || STATES.indexOf(ov.state) < 0) return null;
    if (ov.until) { var u = new Date(ov.until); if (!isNaN(u) && (now || new Date()) >= u) return null; }
    return ov;
  }
  /* { state, source: "manual" | "auto", auto, until, archiveAt, cardGoneAt } */
  function resolve(hub, ov, now, o, listedArchived){
    now = now || new Date();
    var auto = autoState(hub, now, o, listedArchived), m = activeOverride(ov, now);
    return { state: m ? m.state : auto, source: m ? "manual" : "auto", auto: auto, until: m && m.until ? new Date(m.until) : null,
      archiveAt: listedArchived ? null : archiveAt(hub, o), cardGoneAt: cardGoneAt(hub, o) };
  }
  /* rows from get_hub_overrides() -> { hubId: row } */
  function index(rows){ var by = {}; (rows || []).forEach(function(r){ if (r && r.hub) by[r.hub] = { state: r.state, until: r.until || null }; }); return by; }

  /* the dashboard's copy of the overrides, so a returning visitor's first paint already has them
     (index.html refreshes it from get_hub_overrides on every load; widget/v3.js reads it when the network is slow) */
  var CACHE_KEY = "sh_hub_overrides", CACHE_DAYS = 7;
  function readCache(){
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!c || !Array.isArray(c.rows) || !(Date.now() - c.t < CACHE_DAYS * 864e5)) return null;
      return c.rows;
    } catch (e) { return null; }
  }
  function writeCache(rows){ try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows: rows || [] })); } catch (e) {} }

  /* the hubs from the dashboard's own source (index.html is the one home of hub dates): { hubs, archived, options }.
     review/ (Hubs tab) and tools/ci/archive.js read it this way, so the admin page shows the same schedule. */
  function literalAt(html, name){
    var start = html.indexOf("var " + name + " = ["); if (start < 0) return null;
    var i = html.indexOf("[", start), depth = 0, q = null;
    for (; i < html.length; i++) {
      var c = html[i];
      if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === "[") depth++;
      else if (c === "]" && --depth === 0) return html.slice(html.indexOf("[", start), i + 1);
    }
    return null;
  }
  function fromDashboardHtml(html){
    var h = literalAt(html, "HUBS"), a = literalAt(html, "ARCHIVED_HUBS");
    if (!h) throw new Error("no HUBS in the dashboard");
    var k = /var CHECKIN_HOUR = \d+, ARCHIVE_HOUR = (\d+), CARD_DAYS = (\d+);/.exec(html);
    /* the dashboard's own data literals (same origin, from this repo): plain objects, arrays and strings */
    function ev(src){ return Function('"use strict"; return (' + src + ');')(); }
    return { hubs: ev(h), archived: a ? ev(a) : [], options: k ? { archiveHour: Number(k[1]), cardDays: Number(k[2]) } : opt() };
  }

  var api = { STATES: STATES, fromDashboardHtml: fromDashboardHtml, DEFAULTS: DEFAULTS, parseYmd: parseYmd, lastExam: lastExam, archiveAt: archiveAt, cardGoneAt: cardGoneAt,
    autoState: autoState, activeOverride: activeOverride, resolve: resolve, index: index, readCache: readCache, writeCache: writeCache, CACHE_KEY: CACHE_KEY };
  root.shArchive = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
