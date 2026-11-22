/* The dashboard (the redesign's, live since its release; vault/tasks/2026-11-05-redesign-phase-3-dashboard.md). Loaded by
   index.html inside widget/dash.bundle.js (tools/bundle/build.mjs: edit this file, then rebuild).

   What it draws, on the hub engine's design system (widget/hub.css, with widget/dash.css for the layout):
   - the hubs as tabs (emblem, tint, days to the exam), the next exam's first, and under them that hub's stage: its
     masthead scene, the countdown on a tile with a bead for each day left, your progress ring, Start studying, the
     Daily drill, and along its foot Timmy Time and exam-day luck; then its check-ins and What's new (the hub's and the
     site's latest changes as cards on a timeline, with what the hub covers behind "About this hub");
   - one "you" card: your name, Timmy's house (widget/pet.js draws it; Timmy's place takes that spot in phase 4), your
     handpiece rank, mastery medals, day streak and the week as dots. Ask Timmy (widget/ask.js) is "Ask me" in his house,
     or an "Ask the hub" button in #askSpot when he isn't there; on the dashboard he answers from every live hub;
   - the class: who is studying right now (the live count and a chip for each hub someone is in), then the board
     (ranks or study streaks) with the top three on a podium; on the game layer a row opens that person's Timmy's place
     (visiting, phase 4);
   - the idea board (widget/ideas.js draws it in #ideas once the board's server is there), then past hubs: each
     finished exam's recap as a live infographic, with the closed hubs' open exam check-ins above it (a closed hub has
     no card of its own: Sam, 2026-11-14).
   No arcade scores and no "When people study" chart (Sam, 2026-11-11). What's new went with them and came back on
   2026-11-17 (one line) and 2026-11-19 (its own box under the stage); it and a hub's "Updated" label read the changelog.
   The check-in, survey, name, luck and archive logic is the live dashboard's own, moved here unchanged.

   Its data is hubs.js (window.SH_DASH_DATA), where a hub is added, dated or archived.
   The game layer's functions (migration_v54) are called as <name>_v2, with no fallback to the functions from before it
   (they came out 2026-11-19 and 2026-11-21). */
(function(){
  "use strict";
  if (window.shDash) return;
  var D = window.SH_DASH_DATA; if (!D) return;
  var C = window.SH_DASH || {}, A = window.SH_HUB_ART || { icons: {}, flame: {}, spots: {} }, DA = window.SH_DASH_ART || { tints: {}, emblems: {} };
  var ROOT = C.root || "./", WIDGET = C.widget || (ROOT + "widget/");
  var SB_URL = "https://thytmzsgymydbzcqdnix.supabase.co";
  var SB_KEY = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS";
  var docEl = document.documentElement;
  docEl.classList.add("shx", "sh-dash");

  /* ---------- the data (hubs.js) ---------- */
  var CLASSES = D.classes, HUBS = D.hubs.slice(), ARCHIVED_HUBS = D.archived.slice(), HUB_LABEL = D.labels || {};
  var CHECKIN_HOUR = D.checkinHour, ARCHIVE_HOUR = D.archiveHour, CARD_DAYS = D.cardDays, DEBRIEF_DAYS = D.debriefDays;

  /* ---------- helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function q(sel, el){ return (el || document).querySelector(sel); }
  function qa(sel, el){ return [].slice.call((el || document).querySelectorAll(sel)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ls(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  function pad(n){ return String(n).padStart(2, "0"); }
  function ymd(d){ return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dayStart(d){ var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function parseYmd(s){ var p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function daysUntil(s){ return Math.round((parseYmd(s) - dayStart(new Date())) / 864e5); }
  function relDay(date){
    var n = Math.round((dayStart(new Date()) - dayStart(date)) / 864e5);
    if (n <= 0) return "today"; if (n === 1) return "yesterday"; if (n < 7) return n + " days ago";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function longDate(s){ return parseYmd(s).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
  function shortDate(s){ return parseYmd(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  function hourLabel(h){ return h === 0 ? "12 am" : h < 12 ? h + " am" : h === 12 ? "12 pm" : (h - 12) + " pm"; }
  function num(n){ return Number(n || 0).toLocaleString(); }
  function reduced(){ return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function track(t){ try{ if (window.shTrack) window.shTrack(t); }catch(e){} }
  /* the sticker toast (widget/toast.js, ahead of this file in dash.bundle.js): toast(msg, kind) or toast(msg, { kind, title, icon }) */
  function toast(msg, o){
    if (window.shToast) return window.shToast(msg, o);
    var host = q(".hx-toasts") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "hx-toasts" }));
    var t = document.createElement("div"); t.className = "hx-toast"; t.setAttribute("role", "status"); t.textContent = msg; host.appendChild(t);
    setTimeout(function(){ t.classList.add("out"); setTimeout(function(){ t.remove(); }, 300); }, 3200);
  }

  /* ---------- the drawings (widget/hub-art.js: the icon set, the flame, Home's spot art; widget/hub-art/dash.js: every
     hub's tint and emblem; a hub's masthead comes from its own art file when its tab is opened) ---------- */
  /* the die on "Visit someone random", as the design page draws it (round 3) */
  var DICE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="#fff" stroke="currentColor" stroke-width="2"/>' +
    '<circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/></svg>';
  function icon(k, px, cls){
    var b = A.icons && A.icons[k] ? A.icons[k].body : ""; px = px || 20;
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>";
  }
  /* a still drawing goes on the page as an image: its own document, so its ids never collide */
  function img(svg, alt, cls, vb){
    if (vb) svg = '<svg viewBox="' + vb + '">' + svg + "</svg>";
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return '<img class="' + (cls || "") + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '" alt="' + esc(alt || "") + '" decoding="async">';
  }
  function tintOf(id){ return DA.tints[id] || DA.tints.generic || { ink: "#6B5A68", mid: "#A897A4", light: "#ECE6EA", dark: "#C4B3C0" }; }
  function tintVars(id){ var t = tintOf(id); return "--hub:" + t.ink + ";--hub-mid:" + t.mid + ";--hub-light:" + t.light + ";--hub-dark:" + t.dark + ";"; }
  function emblem(id, cls){
    var t = tintOf(id), e = DA.emblems[id] || DA.emblems.generic || { body: "" };
    return img('<circle cx="32" cy="32" r="31" fill="' + t.light + '"/><g transform="translate(6.4 6.4) scale(.8)">' + e.body + "</g>", "", cls, "0 0 64 64");
  }
  function flame(n, cls){
    var lvl = n >= 30 ? 5 : n >= 10 ? 4 : n >= 7 ? 3 : n >= 3 ? 2 : 1;
    return '<svg class="flame' + (n ? "" : " is-cold") + (cls ? " " + cls : "") + '" viewBox="0 0 40 48" aria-hidden="true" focusable="false">' + ((A.flame || {})[lvl] || "") + "</svg>";
  }
  function spot(k, col, cls){
    var S = (A.spots || {})[k]; if (!S) return "";
    var b = S.body.replace(/class="sp-tint"/g, 'fill="' + col.tint + '"').replace(/class="sp-tint-light"/g, 'fill="' + col.light + '"').replace(/class="sp-tint-line"/g, 'stroke="' + col.line + '"');
    return img(b, "", cls, S.vb);
  }
  /* exam-day luck's four-leaf clover, drawn as a sticker (2026-11-19, Sam: "do the art too"): one heart-shaped leaf, its
     point at the middle, four times over: the ink outline underneath, the green on top, a vein and a shine on each */
  var CLOVER = (function(){
    var LF = "M16 15.5C12.6 13.4 10.2 10.4 11.6 7.6C12.8 5.4 15.4 5.6 16 8.2C16.6 5.6 19.2 5.4 20.4 7.6C21.8 10.4 19.4 13.4 16 15.5Z";
    function each(f){ return [0, 90, 180, 270].map(function(r){ return f(' transform="rotate(' + r + ' 16 16)"'); }).join(""); }
    function leaf(t){ return '<path d="' + LF + '"' + t + "/>"; }
    var STEM = '<path d="M17 17Q19 24 25 28" fill="none" stroke-linecap="round" stroke=';
    return '<svg class="ic" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" focusable="false">' + STEM + '"#3b2e3a" stroke-width="3.4"/>' + STEM + '"#2f9e5f" stroke-width="1.4"/>' +
      '<g stroke="#3b2e3a" stroke-width="3" stroke-linejoin="round">' + each(leaf) + '</g><g fill="#4cc27f">' + each(leaf) + '<circle cx="16" cy="16" r="2"/></g>' +
      '<g fill="none" stroke="#25804f" stroke-linecap="round">' + each(function(t){ return '<path d="M16 14.6V9.6"' + t + "/>"; }) + "</g>" +
      '<g fill="#fff" opacity=".75">' + each(function(t){ return '<ellipse cx="13.4" cy="9" rx="1.1" ry=".7"' + t + "/>"; }) + "</g></svg>";
  })();
  var SPARK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 1L9.6 6.4L15 8L9.6 9.6L8 15L6.4 9.6L1 8L6.4 6.4Z" fill="#ffe08a" stroke="#3b2e3a" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  var MASTS = {};
  function loadScriptOnce(src){
    return new Promise(function(resolve, reject){
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }
  /* a hub's masthead scene: its own art file sets window.SH_HUB_ART_HUB, read right after it loads, one at a time */
  var mastQueue = Promise.resolve();
  function masthead(id){
    if (MASTS[id]) return Promise.resolve(MASTS[id]);
    var file = DA.emblems[id] ? id : "generic";
    mastQueue = mastQueue.then(function(){
      if (MASTS[id]) return MASTS[id];
      return loadScriptOnce(WIDGET + "hub-art/" + file + ".js").then(function(){
        var H = window.SH_HUB_ART_HUB;
        if (H && H.hub === file && H.masthead) MASTS[id] = H.masthead;
        return MASTS[id] || null;
      }, function(){ return null; });
    });
    return mastQueue;
  }

  /* ---------- theme and text size: the keys every hub uses ---------- */
  var SIZES = [["small", "Small", .9], ["default", "Default", 1], ["large", "Large", 1.15], ["xlarge", "X-Large", 1.3], ["xxlarge", "XX-Large", 1.45]];
  function applyTheme(t){ if (t === "light" || t === "dark") docEl.setAttribute("data-theme", t); else docEl.removeAttribute("data-theme"); }
  function applySize(){ var z = (SIZES.filter(function(s){ return s[0] === (ls("sh_pref_size") || "default"); })[0] || [0, 0, 1])[2]; docEl.style.zoom = z === 1 ? "" : z; }
  applyTheme(ls("sh_theme") || ""); applySize();

  /* ---------- live, archived or hidden (the live dashboard's rules: widget/archive.js decides from the dates in
     hubs.js plus any override set on the admin page; without it the dates alone decide) ---------- */
  function examAt(x, hour){ var d = parseYmd(x.date); d.setHours(hour, 0, 0, 0); return d; }
  function lastExam(hub){ return (hub.exams || []).filter(function(x){ return x.date; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; })[0] || null; }
  function archiveAt(hub){
    if (hub.archiveOn && hub.archiveOn.date){ var d = parseYmd(hub.archiveOn.date); d.setHours(hub.archiveOn.hour != null ? hub.archiveOn.hour : ARCHIVE_HOUR, 0, 0, 0); return d; }
    var x = lastExam(hub); return x ? examAt(x, x.archiveHour != null ? x.archiveHour : ARCHIVE_HOUR) : null;
  }
  function cardGoneAt(hub){
    if (hub.hideCardOn && typeof hub.hideCardOn === "object"){ var h = parseYmd(hub.hideCardOn.date); h.setHours(hub.hideCardOn.hour != null ? hub.hideCardOn.hour : 0, 0, 0, 0); return h; }
    if (hub.hideCardOn) return parseYmd(hub.hideCardOn);
    var a = archiveAt(hub); return a ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + CARD_DAYS, ARCHIVE_HOUR) : null;
  }
  var HUBS_SRC = HUBS.slice(), ARCHIVED_SRC = ARCHIVED_HUBS.slice(), HUB_STATE = {}, OVERRIDES = {};
  try { if (window.shArchive) OVERRIDES = window.shArchive.index(window.shArchive.readCache()); } catch (e) {}
  function stateOf(h, listed){
    if (window.shArchive) return window.shArchive.resolve(h, OVERRIDES[h.id], new Date(), { archiveHour: ARCHIVE_HOUR, cardDays: CARD_DAYS }, listed);
    var a = archiveAt(h), g = cardGoneAt(h), now = new Date();
    var st = !listed && (!a || now < a) ? "live" : (g && now < g ? "archived" : "hidden");
    return { state: st, source: "auto", auto: st };
  }
  function partitionHubs(){
    var live = [], rest = [], sig = [];
    [[HUBS_SRC, false], [ARCHIVED_SRC, true]].forEach(function(src){
      src[0].forEach(function(h){ var r = stateOf(h, src[1]); HUB_STATE[h.id] = r; (r.state === "live" ? live : rest).push(h); sig.push(h.id + ":" + r.state); });
    });
    HUBS = live; ARCHIVED_HUBS = rest;
    return sig.join(",");
  }
  var hubSig = partitionHubs();

  /* ---------- where a hub opens: the engine's routes ---------- */
  function hubHref(hub, part){
    var base = ROOT + "hubs/" + hub.id + "/";
    if (part === "drill") return base + "#questions/drill";
    if (part === "timmy") return base + "#more/timmy";
    return base;
  }
  function hubName(hub){ return HUB_LABEL[hub.id] || tintOf(hub.id).name || hub.title; }

  /* ---------- your progress, read straight from each hub's own saved state (same site, so the dashboard can see it).
     Handles both state shapes the hubs use; anything unrecognized shows "not started". ---------- */
  function readProgress(hub){
    var raw = ls(hub.stateKey); if (!raw) return null;
    try{
      var s = JSON.parse(raw), seen = 0, answered = 0, pct = 0, label = "", days = [];
      if (s.seen && typeof s.seen === "object"){
        seen = Object.keys(s.seen).length; answered = +s.totalAnswered || 0;
        pct = answered ? Math.round((+s.totalCorrect || 0) / answered * 100) : 0;
        label = "right across " + num(answered) + (answered === 1 ? " answer" : " answers");
        days = Array.isArray(s.days) ? s.days : [];
      } else if (s.answered && typeof s.answered === "object"){
        var ids = Object.keys(s.answered), right = 0;
        ids.forEach(function(k){ if (s.answered[k] && s.answered[k].lastCorrect) right++; });
        seen = ids.length; answered = +s.totalSeen || 0;
        pct = seen ? Math.round(right / seen * 100) : 0;
        label = "right on your latest try";
        days = s.activeDates ? Object.keys(s.activeDates) : [];
      }
      if (!answered && !seen) return null;
      return { seen: seen, answered: answered, pct: pct, pctLabel: label, days: days, best: +s.bestStreak || 0 };
    }catch(e){ return null; }
  }
  var LAST = (function(){ try{ return JSON.parse(ls("sh_dash_last") || "null"); }catch(e){ return null; } })();
  /* Daily drill (widget/drill.js) on this device: today's set is sh_drill_<hub>, questions due for review are in sh_srs_<hub> */
  function drillStatus(hub){
    var t = ymd(new Date()), s = null, due = 0;
    try{ s = JSON.parse(ls("sh_drill_" + hub.id) || "null"); }catch(e){}
    if (s && s.day === t && s.items && s.items.length){
      if (s.done) return { state: "done" };
      var n = s.items.filter(function(it){ return s.res && s.res[it.id] !== undefined; }).length;
      return { state: "going", n: n, total: s.items.length };
    }
    try{ var srs = JSON.parse(ls("sh_srs_" + hub.id) || "{}") || {}; Object.keys(srs).forEach(function(k){ if (srs[k] && srs[k].due && srs[k].due <= t) due++; }); }catch(e){}
    return { state: "new", due: due };
  }
  function drillHTML(hub){
    var d = drillStatus(hub);
    return '<a class="btn dx-drill" href="' + esc(hubHref(hub, "drill")) + '" data-hub="' + esc(hub.id) + '" data-drill>' + icon(d.state === "done" ? "check" : "drill", 18) +
      (d.state === "done" ? "Drill done today" : d.state === "going" ? "Daily drill · " + d.n + " of " + d.total : "Daily drill" + (d.due ? " · " + d.due + " due" : "")) + "</a>";
  }

  /* ---------- exams ---------- */
  function nextExam(hub){
    return (hub.exams || []).filter(function(e){ return daysUntil(e.date) >= 0; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; })[0] || null;
  }
  function daysText(d){ return d === 0 ? "today" : d === 1 ? "tomorrow" : "in " + d + " days"; }
  /* the tabs' order: the next exam first, hubs with no exam ahead last */
  function tabOrder(){
    return HUBS.map(function(h, i){ var x = nextExam(h); return { hub: h, exam: x, d: x ? daysUntil(x.date) : 1e6 + i }; }).sort(function(a, b){ return a.d - b.d; });
  }
  var selected = null;   /* the open tab's hub id; a visit always starts on the next exam's */
  function defaultTab(order){
    if (!order.length) return null;
    if (order[0].exam) return order[0].hub.id;
    var last = LAST && order.filter(function(o){ return o.hub.id === LAST.id; })[0];
    return (last || order[0]).hub.id;
  }

  /* ---------- the shell ---------- */
  var localName = ls("sh_display_name") || "", randomName = "", VISITOR = ls("sh_visitor_id");
  var root = document.createElement("div");
  root.className = "hx dx"; root.id = "dx";
  root.innerHTML =
    '<a class="hx-skip" href="#hubs">Skip to the hubs</a>' +
    '<header class="dx-bar">' +
      '<h1 class="dx-brand"><span class="dx-mark" aria-hidden="true">' + icon("tooth", 22) + '</span><span class="dx-word">Study Hubs</span></h1>' +
      '<span class="dx-live" title="People with a hub open right now"><i class="dx-dot" aria-hidden="true"></i><b class="num" id="liveCount">–</b> <span class="dx-fold">studying now</span></span>' +
      '<span class="grow"></span>' +
      '<a class="dx-meter" id="dxStreak" href="#you" hidden></a>' +
      '<a class="dx-rank" id="dxRank" href="#you" hidden></a>' +
      '<button class="dx-ib" id="inboxBtn" type="button" aria-label="Inbox" title="Inbox" data-sh-inbox>' + icon("inbox", 22) + "</button>" +
      '<button class="dx-ib" id="setBtn" type="button" aria-label="Settings" title="Settings">' + icon("settings", 22) + "</button>" +
      '<div class="dx-menuwrap"><button class="dx-ib" id="menuBtn" type="button" aria-label="More" title="More" aria-haspopup="true" aria-expanded="false" aria-controls="dxMenu">' + icon("menu", 22) + "</button>" +
        '<ul class="dx-menu" id="dxMenu" hidden>' +
          '<li><a id="aboutBtn" href="' + esc(C.about || ROOT + "about/") + '">' + icon("about", 20) + "<span><b>About the hubs</b><small>Every feature, trophy and easter egg</small></span></a></li>" +
          '<li><button type="button" id="tourBtn">' + icon("tour", 20) + "<span><b>Take the tour</b><small>A minute, on the real buttons</small></span></button></li>" +
          '<li><button type="button" id="themeBtn"></button></li>' +
        "</ul></div>" +
    "</header>" +
    '<main class="dx-page" id="dxMain">' +
      '<section class="dx-hubs" id="hubs" aria-labelledby="hubsH"><h2 class="sr" id="hubsH">Your hubs</h2><div id="hubTabs"></div><div id="hubPanel"></div></section>' +
      '<div class="dx-cols">' +
        '<section class="panel dx-you" id="you" aria-labelledby="youH">' +
          '<div class="dx-youhead"><h2 id="youH">You</h2><p class="dx-name" id="youName"></p></div>' +
          '<div id="petHome" hidden></div>' +
          '<div class="dx-ask" id="askSpot" hidden></div>' +
          '<div class="dx-rankcard" id="meRank"></div>' +
          '<div class="dx-wallet" id="youShop" hidden></div>' +
          '<ul class="dx-stats" id="youStats"></ul>' +
        "</section>" +
        '<section class="panel dx-class" id="class" aria-labelledby="classH">' +
          '<h2 id="classH">The class</h2>' +
          /* who has a hub open this minute */
          '<div class="dx-now" id="now" role="group" aria-labelledby="nowH">' +
            '<h3 class="sr" id="nowH">Studying right now</h3>' +
            /* the drawn classroom goes in here once its art and Timmy have loaded (syncRoom); the count and the hubs then sit on its board */
            '<div class="dx-room" id="room" aria-hidden="true"></div><p class="dx-hall" id="nowHall" hidden></p><div class="dx-mes" id="nowMe" aria-hidden="true"></div>' +
            '<div class="dx-now-board" id="nowBoard">' +
              '<p class="dx-now-num"><i class="dx-pulse" aria-hidden="true"></i><b class="num" id="nowCount">–</b><span>studying right now</span></p>' +
              '<ul class="dx-now-hubs" id="nowHubs"></ul>' +
            "</div>" +
          "</div>" +
          '<div class="dx-classhead"><h3 id="boardH">Leaderboard</h3>' +
            '<span class="seg" role="group" aria-label="Leaderboard" id="boardSeg">' +
              [["ranks", "Ranks"], ["streaks", "Study streaks"]].map(function(b, i){ return '<button type="button" data-board="' + b[0] + '" aria-pressed="' + (i === 0) + '">' + b[1] + "</button>"; }).join("") +
            "</span></div>" +
          '<p class="note" id="boardNote"></p>' +
          '<div id="board" aria-live="polite"><p class="note">Loading…</p></div>' +
          /* Visit someone random: one of the board's rows (the tour, below); shown when the board has someone to visit */
          '<p class="dx-rand" id="visitRand" hidden><button type="button" data-dash="visit-random">' + DICE + '<span>Visit someone random</span></button><span class="dx-vearn" hidden></span><span class="dx-rmsg" role="status"></span></p>' +
          '<p class="dx-line" id="goldenLine" hidden></p>' +
        "</section>" +
      "</div>" +
      /* the road: every rank of the Handpiece, then the ModuPro, then the Loupes, with where you stand (Sam, 2026-11-13:
         "the rank progression should be displayed better from each rank to the modupro and loupes") */
      '<section class="dx-section dx-roadsec" id="road" aria-labelledby="roadH" hidden></section>' +
      /* the idea board (vault/tasks/2026-11-06-idea-board.md): widget/ideas.js draws into this section and unhides it */
      '<section class="dx-section" id="ideas" data-sh-ideas hidden></section>' +
      '<section class="dx-section" id="past" aria-labelledby="pastH" hidden>' +
        '<h2 id="pastH">Past hubs</h2><p class="note" id="pastNote"></p>' +
        /* every open exam check-in in one place (Sam, 2026-11-13: "grouped together, available"), for every closed hub */
        '<div class="dx-checkins" id="checkins" hidden></div>' +
        '<div class="dx-past">' +
          '<div class="rc" id="rc" hidden><div class="rc-chips" id="rcChips" role="tablist" aria-label="Finished exams"></div><div class="rc-body tinted" id="rcBody" role="tabpanel"></div></div>' +
        "</div>" +
      "</section>" +
      '<footer class="dx-foot"><p>Bookmark this page, not a hub: new hubs show up here as each exam gets close.</p>' +
        '<p>Built by Sam for the D2 class at UAB · <a href="' + esc(C.about || ROOT + "about/") + '">About the hubs</a> · <a href="' + esc(C.review || ROOT + "review/") + '">Review</a></p></footer>' +
    "</main>";
  document.body.appendChild(root);

  /* ---------- the bar's menu and the theme ---------- */
  function themeNow(){ var t = ls("sh_theme"); return t === "light" || t === "dark" ? t : ""; }
  function paintTheme(){
    var t = themeNow(), dark = t === "dark" || (!t && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    $("themeBtn").innerHTML = icon(dark ? "sun" : "moon", 20) + "<span><b>" + (dark ? "Light theme" : "Dark theme") + "</b><small>" + (t ? "Every hub follows it" : "Now matching your device") + "</small></span>";
  }
  paintTheme();
  function menu(open){
    var m = $("dxMenu"), b = $("menuBtn"); m.hidden = !open; b.setAttribute("aria-expanded", String(!!open));
    if (open) { var f = q("a, button", m); if (f) f.focus(); }
  }
  $("menuBtn").addEventListener("click", function(e){ e.stopPropagation(); menu($("dxMenu").hidden); });
  document.addEventListener("click", function(e){ if (!$("dxMenu").hidden && !e.target.closest(".dx-menuwrap")) menu(false); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !$("dxMenu").hidden) { menu(false); $("menuBtn").focus(); } });
  $("themeBtn").addEventListener("click", function(){
    var dark = docEl.getAttribute("data-theme") === "dark" || (!themeNow() && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    var t = dark ? "light" : "dark"; lsSet("sh_theme", t); applyTheme(t); paintTheme(); track("pref:theme=" + t);
  });

  /* ---------- the hub tabs and the open hub's panel ---------- */
  function tabSub(o){
    if (!o.exam) return (o.hub.exams || []).length ? "Exams finished" : "No exam date yet";
    return (o.exam.label || "Exam") + " " + daysText(o.d);
  }
  function renderTabs(){
    var order = tabOrder(), el = $("hubTabs");
    if (!selected || !order.some(function(o){ return o.hub.id === selected; })) selected = defaultTab(order);
    if (!order.length){
      el.innerHTML = "";
      $("hubPanel").innerHTML = '<div class="dx-empty panel"><h3>No hubs are live right now</h3><p>New ones appear here as each exam gets close. Same link, nothing to download again.</p></div>';
      return;
    }
    el.innerHTML = '<div class="dx-tabs" role="tablist" aria-label="Hubs">' + order.map(function(o){
      var on = o.hub.id === selected;
      return '<button type="button" class="dx-tab tinted" role="tab" id="tab-' + esc(o.hub.id) + '" aria-controls="hubPanel" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + esc(o.hub.id) + '" style="' + tintVars(o.hub.id) + '">' +
        emblem(o.hub.id, "dx-emb") + "<span><b>" + esc(hubName(o.hub)) + "</b><small>" + esc(tabSub(o)) + "</small></span></button>";
    }).join("") + "</div>";
    renderPanel();
  }
  $("hubTabs").addEventListener("click", function(e){
    var b = e.target.closest("[data-tab]"); if (!b || b.getAttribute("data-tab") === selected) return;
    var ids = tabOrder().map(function(o){ return o.hub.id; }), from = ids.indexOf(selected);
    selected = b.getAttribute("data-tab"); track("dash:tab=" + selected); renderTabs(); var n = $("tab-" + selected); if (n) n.focus();
    /* the hub's panel slides in from the side its tab is on (widget/hub.css, .is-entering) */
    var pn = $("hubPanel");
    if (pn && !still()) { pn.classList.remove("is-entering"); void pn.offsetWidth; pn.style.setProperty("--from", ids.indexOf(selected) > from ? "22px" : "-22px"); pn.classList.add("is-entering"); }
  });
  $("hubTabs").addEventListener("keydown", function(e){
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    var tabs = qa("[data-tab]", $("hubTabs")), i = tabs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    var n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[n].click();
  });

  /* exam-day luck: the day before and the morning of the open hub's next exam, one tap per person (migration_v27) */
  var luckFor = null, luckData = {}, luckSb = null;
  function luckTime(d){ return d === 1 || (d === 0 && new Date().getHours() < 14); }
  function luckKey(){ return luckFor ? luckFor.hub + "|" + luckFor.date : ""; }
  function drawLuck(){
    var el = $("heroLuck"); if (!el || !luckFor) return;
    var r = luckData[luckKey()] || { count: 0, mine: false, recent: [] }, n = r.count || 0;
    var names = (r.recent || []).slice(0, 3).map(esc).join(", ");
    /* a tile at the foot of the stage, beside Timmy Time (2026-11-19: it was a full-width row); the exam's name is the
       stage's title just above it, so the tile doesn't repeat it */
    el.setAttribute("aria-label", "Exam-day luck for " + luckFor.name);
    el.setAttribute("role", "group");
    /* the art: a big faint clover in the tile's corner, two small ones and a sparkle bobbing around the button */
    el.innerHTML = '<span class="dx-luck-bg" aria-hidden="true">' + CLOVER + '</span><div class="dx-luck-in"><p class="dx-luck-txt">' +
      (n ? '<b><span class="num">' + num(n) + "</span>" + (n === 1 ? " classmate" : " classmates") + " sent luck</b><small>" + (names ? "Latest: " + names + (n > 3 ? " and more" : "") : "for " + esc(luckFor.name)) + "</small>"
         : "<b>" + (luckFor.d === 0 ? "Exam day!" : "Exam tomorrow!") + "</b><small>Be the first to send the class some luck</small>") + "</p>" +
      /* a chunky game button (Sam, 2026-11-19: "redo the send luck button"): the clover on a gold coin, a shine across
         it, pressed into its shadow when tapped; gold once your luck is sent */
      '<span class="dx-luck-go"><button type="button" class="hero-luck-btn' + (r.mine ? " is-sent" : "") + '"' + (r.mine ? " disabled" : "") + '><span class="dx-luck-coin">' + CLOVER + "</span>" +
        (r.mine ? "Luck sent!" : "Send luck") + '</button><i class="dx-lf dx-lf1">' + CLOVER + '</i><i class="dx-lf dx-lf2">' + CLOVER + '</i><i class="dx-lf dx-lf3">' + SPARK + "</i></span></div>";
  }
  function loadLuck(){
    if (!luckSb || !luckFor) return;
    var k = luckKey();
    luckSb.rpc("get_exam_luck", { p_hub: luckFor.hub, p_date: luckFor.date, p_visitor: VISITOR || null }).then(function(res){
      if (res && res.data && luckKey() === k){ luckData[k] = res.data; drawLuck(); }
    }, function(){});
  }
  function luckBurst(el){
    if (reduced()) return;
    for (var i = 0; i < 7; i++){
      var b = document.createElement("span"), a = -Math.PI / 2 + (Math.random() - .5) * 2.2, r = 50 + Math.random() * 60;
      b.className = "dx-luck-burst"; b.innerHTML = CLOVER;
      b.style.setProperty("--dx", Math.round(Math.cos(a) * r) + "px"); b.style.setProperty("--dy", Math.round(Math.sin(a) * r) + "px");
      b.style.setProperty("--rot", Math.round((Math.random() - .5) * 180) + "deg");
      el.appendChild(b); setTimeout(function(x){ return function(){ x.remove(); }; }(b), 1200);
    }
  }
  document.addEventListener("click", function(e){
    var btn = e.target.closest(".hero-luck-btn"); if (!btn || btn.disabled || !luckFor) return;
    var k = luckKey(), r = luckData[k] || { count: 0, mine: false, recent: [] };
    luckData[k] = { count: (r.count || 0) + 1, mine: true, recent: r.recent || [] };
    var el = $("heroLuck"); drawLuck(); if (el) { luckBurst(el); var nb = q(".hero-luck-btn", el); if (nb && !still()) nb.classList.add("is-pop"); }
    if (luckSb) luckSb.rpc("send_exam_luck", { p_visitor: surveyVisitor(), p_hub: luckFor.hub, p_date: luckFor.date }).then(function(res){
      if (res && res.data && luckKey() === k){ luckData[k] = res.data; drawLuck(); }
    }, function(){});
  });
  setInterval(function(){ if (!document.hidden) loadLuck(); }, 90 * 1000);

  /* the countdown flips like a departure board: through each day that has passed since your last visit (and live at
     midnight), or in from blank when nothing changed. The last number shown is kept in sh_dash_flap. */
  var flapShown = {};
  function heroFlap(hub, exam){
    var el = q("#hubPanel .flap"); if (!el) return;
    var to = el.getAttribute("data-flap"), k = hub.id + "|" + exam.date, seen = null;
    try{ seen = JSON.parse(ls("sh_dash_flap") || "null"); }catch(e){}
    /* only the next exam's number is remembered, as on the live dashboard */
    var order = tabOrder(); if (order[0] && order[0].hub.id === hub.id) lsSet("sh_dash_flap", JSON.stringify({ k: k, v: to }));
    var again = flapShown[k] === to; flapShown[k] = to;
    if (again || !el.animate || reduced()) return;
    var from = seen && seen.k === k && String(seen.v) !== to ? String(seen.v) : "", steps = [];
    var a = parseInt(from, 10), b = to === "Today" ? 0 : parseInt(to, 10);
    if (!isNaN(a) && !isNaN(b) && a > b + 1 && a - b <= 8) for (var v = a - 1; v > b; v--) steps.push(v === 0 ? "Today" : String(v));
    steps.push(to);
    var cur = from, i = 0, half = steps.length > 1 ? 120 : 190;
    (function next(){
      if (!el.isConnected) return;
      if (i >= steps.length){ el.textContent = to; return; }
      var nx = steps[i++];
      el.innerHTML = '<span class="flap-l flap-top">' + esc(nx) + '</span><span class="flap-l flap-bot">' + esc(cur) + '</span>' +
        '<span class="flap-l flap-fold">' + esc(cur) + '</span><span class="flap-l flap-unfold">' + esc(nx) + "</span>";
      q(".flap-fold", el).animate([{ transform: "rotateX(0deg)", opacity: 1 }, { transform: "rotateX(-90deg)", opacity: .55 }], { duration: half, easing: "ease-in", fill: "forwards" });
      q(".flap-unfold", el).animate([{ transform: "rotateX(90deg)", opacity: .55 }, { transform: "rotateX(0deg)", opacity: 1 }],
        { duration: half * 1.3, delay: half, easing: "cubic-bezier(.3,1.6,.6,1)", fill: "both" }).onfinish = function(){ cur = nx; next(); };
    })();
  }

  var liveBy = {}, people = [];
  /* One entry for each hub tab open in the class: { key, hub, fit }. fit is what that person's Timmy wears ("" for none):
     "<holiday>:<outfit>" (widget/pet.js fit()) or a shop outfit's id. It comes from another browser, so it is only ever
     matched against the outfits this page has, never written into the page. No name and no id comes with it. */
  function cleanFit(f){ f = String(f == null ? "" : f); return /^[a-z0-9]{1,20}:[a-z0-9-]{1,30}$/.test(f) || /^[a-z0-9-]{1,40}$/.test(f) ? f : ""; }
  function setPeople(hub, list){
    var keep = {}, out = [];
    list.forEach(function(p){ keep[p.key] = p; });
    people.forEach(function(p){ if (p.hub !== hub) out.push(p); else if (keep[p.key]) { out.push(keep[p.key]); delete keep[p.key]; } });
    list.forEach(function(p){ if (keep[p.key]) out.push(p); });
    people = out; liveBy[hub] = list.length;
  }
  /* the count in the bar and the tile in the class panel: the total, and a chip for each hub someone is in */
  function paintNow(){
    var t = 0; Object.keys(liveBy).forEach(function(k){ t += liveBy[k] || 0; });
    $("liveCount").textContent = t; $("nowCount").textContent = t;
    /* busiest first: the room's board has space for three */
    var live = HUBS.filter(function(h){ return liveBy[h.id]; }).sort(function(x, y){ return liveBy[y.id] - liveBy[x.id]; });
    $("nowHubs").innerHTML = live.length ? live.map(function(h){
      return "<li>" + emblem(h.id, "dx-emb") + '<span><b class="num">' + liveBy[h.id] + '</b><span class="dx-in"> in ' + esc(hubName(h)) + "</span></span></li>";
    }).join("") : '<li class="is-none">Nobody has a hub open this minute. Be the first.</li>';
    $("now").classList.toggle("is-live", t > 0);
    syncRoom();
  }

  /* ---------- the class's room (Sam, 2026-11-11): the studying-now tile as a drawn classroom. A Timmy for each person
     studying, in what theirs is wearing, at a desk whose front is their hub's color; they hop in from the door and jump
     into a desk, and get up and leave. The room, desks and door are widget/hub-art/class.js (tools/figures/site/
     classroom.mjs); Timmy is widget/pet.js art(). Without either, or in Focus mode, the tile stays the plain count. ---------- */
  var CA = null;            /* window.SH_CLASS_ART, once widget/hub-art/class.js has loaded */
  var rm = null;            /* the room as drawn: { w, h, night, rows, seats, order, at: { key: seat }, fits: { key: fit }, geo, door } */
  function still(){ return reduced() || ls("sh_pref_fx") === "off"; }
  /* the pop-ups' and pages' entrances (widget/hub.css, "motion") follow the same switch */
  function paintStill(){ document.documentElement.classList.toggle("hx-still", still()); }
  paintStill(); document.addEventListener("sh:pref", paintStill);
  function roomReady(){ return !!(CA && CA.room && window.shPet && window.shPet.art && !focusOn()); }
  function hashOf(k){ var h = 0; k = String(k); for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0; return Math.abs(h); }
  var outfitsAsked = {};
  /* the shop's outfits load only when someone is wearing one: widget/hub-art/outfits.js (the everyday ones and the
     rank outfits), then hub-art/outfits/costumes.js, seasons.js or collections.js for the rest */
  function wantOutfits(set){
    var file = set ? "outfits/" + set + ".js" : "outfits.js";
    if (outfitsAsked[file]) return; outfitsAsked[file] = 1;
    var el = document.createElement("script"); el.src = WIDGET + "hub-art/" + file; el.async = true;
    el.onload = function(){ rm = null; syncRoom(); paintBoard(); };
    document.head.appendChild(el);
  }
  /* the inside of a Timmy drawing in someone's outfit. Always healthy: nobody sees someone else's Timmy's health. */
  function timmyArt(fit, mood){
    var P = window.shPet, O = window.SH_OUTFITS, svg;
    fit = cleanFit(fit);
    svg = P.art({ hp: 100, mood: mood || "happy", hat: "" }, 200);
    /* "<holiday>:<outfit>" is what a page from before the release still sends (he dressed himself for holidays then):
       those drawings are gone, so that Timmy sits with nothing on */
    if (fit && fit.indexOf(":") < 0) {
      if (O && Object.prototype.hasOwnProperty.call(O.parts, fit)) svg = O.dress(svg, fit);
      else if (!O) wantOutfits();
      else if (O.where && O.where[fit] && !(O.got && O.got[O.where[fit]])) wantOutfits(O.where[fit]);
    }
    return String(svg).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  }
  function timmyBox(box, fit, mood){
    return '<svg x="' + box.x + '" y="' + box.y + '" width="' + box.w + '" height="' + box.h + '" viewBox="0 -30 200 262" overflow="visible">' + timmyArt(fit, mood) + "</svg>";
  }
  function tintKey(hub){ return DA.tints[hub] ? hub : "generic"; }
  /* most are happy at their desks; now and then one has nodded off */
  function seated(p){
    var h = hashOf(p.key), mood = h % 12 === 7 ? "sleep" : h % 5 === 3 ? "ok" : "happy";
    return '<g class="rm-bob" style="animation-delay:-' + (h % 32) / 10 + 's">' + timmyBox(CA.room.SEAT, p.fit, mood) + "</g>";
  }
  function seatEl(i){ return q('.rm-seat[data-seat="' + i + '"]', $("room")); }
  /* Which Timmy is yours: a hub tab keeps its own presence key in this browser while it is open (widget/v3.js,
     "sh_presence_mine"), so the desk with that key gets a "You" plate on its front (where its hub's tooth is, so it
     covers nobody), on this screen only. Nobody else's is told apart. */
  function mineKeys(){ try { var m = JSON.parse(localStorage.getItem("sh_presence_mine") || "{}"); return m && typeof m === "object" ? m : {}; } catch (e) { return {}; } }
  function has(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  /* yours first, so a full room never leaves you in the hall */
  function mineFirst(list){ var m = mineKeys(); return list.filter(function(p){ return has(m, p.key); }).concat(list.filter(function(p){ return !has(m, p.key); })); }
  function paintMe(){
    var host = $("nowMe"); if (!host) return;
    var mine = mineKeys(), s = "";
    if (rm) Object.keys(rm.at).forEach(function(k){
      if (!has(mine, k)) return;
      var st = rm.seats[rm.at[k]], el = seatEl(rm.at[k]);
      if (!st || !el || !q(".rm-tim", el).firstChild) return;      /* still on his way in */
      s += '<span class="dx-me" style="left:' + Math.round(st.x) + "px;top:" + Math.round(st.y - 5.4 * st.s) + 'px">You</span>';
    });
    if (host.innerHTML !== s) host.innerHTML = s;
  }
  /* the count and the hubs sit on the room's board (b: its place in the drawing), or back in the plain tile (null) */
  function placeBoard(b){
    var el = $("nowBoard"); if (!el) return;
    ["left", "top", "width", "height"].forEach(function(k, i){ el.style[k] = b ? [b.x, b.y, b.w, b.h][i] + "px" : ""; });
    $("now").classList.toggle("is-tight", !!b && b.w < 190);   /* a narrow board: the hubs get a line of their own */
  }
  /* when every desk is taken, a sign by the door says how many more there are */
  function paintHall(){
    var el = $("nowHall"); if (!el) return;
    var more = rm ? people.length - rm.seats.length : 0;
    el.hidden = more <= 0; el.textContent = more > 0 ? "+" + more + " in the hall" : "";
    if (rm && rm.geo) el.style.top = Math.round(rm.geo.door.y + rm.geo.door.h * .42) + "px";
  }
  function buildRoom(o, seats, rows){
    var R = CA.room, g = R.geo(o);
    /* desks fill from the front row's middle outward */
    var order = seats.map(function(st, i){ return i; }).sort(function(x, y){ return (seats[y].row - seats[x].row) || (Math.abs(seats[x].x - o.w * .45) - Math.abs(seats[y].x - o.w * .45)); });
    var at = {}, fits = {}, bySeat = {}, s;
    mineFirst(people).slice(0, seats.length).forEach(function(p, i){ at[p.key] = order[i]; fits[p.key] = p.fit; bySeat[order[i]] = p; });
    s = '<g class="rm-bg">' + R.room(o) + '</g><g class="rm-dooropen">' + R.door({ w: o.w, h: o.h, night: o.night, open: true }) + R.plant(o) + "</g>";
    for (var r = 0; r < rows; r++) {
      s += '<g class="rm-row">';
      for (var i = 0; i < seats.length; i++) {
        var st = seats[i], p = bySeat[i]; if (st.row !== r) continue;
        s += '<g class="rm-seat" data-seat="' + i + '" data-fit="' + (p ? p.fit : "") + '" transform="translate(' + st.x + " " + st.y + ") scale(" + st.s + ')">' + R.chair() +
          '<g class="rm-tim">' + (p ? seated(p) : "") + '</g><g class="rm-desk">' + R.desk(p ? tintKey(p.hub) : null, p ? hashOf(p.key) % 4 : null) + "</g></g>";
      }
      s += "</g>";
    }
    s += '<g class="rm-walk"></g>';
    $("room").innerHTML = '<svg viewBox="0 0 ' + o.w + " " + o.h + '" width="' + o.w + '" height="' + o.h + '" focusable="false">' + s + "</svg>";
    rm = { w: o.w, h: o.h, night: o.night, rows: rows, seats: seats, order: order, at: at, fits: fits, geo: g, door: 0 };
    $("now").classList.add("has-room"); $("now").classList.toggle("is-still", still());
    placeBoard(g.board); paintHall(); paintMe();
  }
  /* the door stands open while anyone is in the doorway */
  function doorOpen(d){ if (!rm) return; rm.door = Math.max(0, rm.door + d); var el = q(".rm-dooropen", $("room")); if (el) el.style.opacity = rm.door ? "1" : "0"; }
  /* a Timmy on his way: in from the door, down the aisle in hops to his row, then one jump into the desk (leaving runs
     the same way backwards). n staggers a few at once; done runs when he gets there. */
  function walk(fit, i, leaving, n, done){
    var R = CA.room, my = rm, st = rm.seats[i], g = rm.geo, layer = q(".rm-walk", $("room")); if (!layer) { if (done) done(); return; }
    var d0 = { x: g.door.x + g.door.w / 2, y: g.wall + 3, k: st.s * .86 }, ai = { x: g.door.x + g.door.w / 2 - 4, y: Math.min(rm.h - 3, st.y + 2), k: st.s }, se = { x: st.x, y: st.y - 7.1 * st.s, k: st.s };
    var pts = [], j, t;
    for (j = 0; j <= 12; j++) { t = j / 12; pts.push([d0.x + (ai.x - d0.x) * t, d0.y + (ai.y - d0.y) * t - Math.abs(Math.sin(t * Math.PI * 3)) * 6, d0.k + (ai.k - d0.k) * t]); }
    for (j = 1; j <= 12; j++) { t = j / 12; pts.push([ai.x + (se.x - ai.x) * t, ai.y + (se.y - ai.y) * t - Math.sin(t * Math.PI) * 30, st.s]); }
    if (leaving) pts.reverse();
    var frames = pts.map(function(c){ return { transform: "translate(" + c[0].toFixed(1) + "px," + c[1].toFixed(1) + "px) scale(" + c[2].toFixed(3) + ")" }; });
    var el = document.createElementNS("http://www.w3.org/2000/svg", "g");
    el.setAttribute("class", "rm-walker"); el.innerHTML = timmyBox(R.STAND, fit, "happy");
    el.style.transform = frames[0].transform; el.style.opacity = "0"; layer.appendChild(el);
    setTimeout(function(){
      if (rm !== my || !el.isConnected || !el.animate) { el.remove(); if (done) done(); return; }
      var hop = 1100, jump = 800, total = hop + jump;
      el.style.opacity = "1";
      /* coming in, the door is open for the first steps; going out, for the last */
      setTimeout(function(){ if (rm === my) doorOpen(1); }, leaving ? jump : 0);
      setTimeout(function(){ if (rm === my) doorOpen(-1); }, leaving ? total + 200 : 700);
      el.animate(frames, { duration: total, easing: "linear", fill: "forwards" }).onfinish = function(){ el.remove(); if (done) done(); };
    }, (n || 0) * 450);
  }
  /* nobody walks while the room rests (off screen, mid-scroll, behind a window): they are just there, or gone */
  function roomResting(){ var n = $("now"); return !!n && (n.classList.contains("is-rest") || n.classList.contains("is-away")); }
  function arrive(p, i, quiet, n){
    function sit(){
      var el = seatEl(i); if (!rm || rm.at[p.key] !== i || !el) return;
      el.setAttribute("data-fit", p.fit);
      q(".rm-tim", el).innerHTML = seated(p); q(".rm-desk", el).innerHTML = CA.room.desk(tintKey(p.hub), hashOf(p.key) % 4);
      if (!quiet && q(".rm-tim", el).animate) q(".rm-tim", el).animate([{ transform: "translateY(-4px) scale(.96, 1.06)" }, { transform: "translateY(1px) scale(1.05, .94)" }, { transform: "none" }], { duration: 340, easing: "ease-out" });
      paintMe();
    }
    if (quiet || roomResting()) sit(); else walk(p.fit, i, false, n, sit);
  }
  function depart(i, quiet, n){
    var el = seatEl(i); if (!el) return;
    var tim = q(".rm-tim", el), was = !!tim.firstChild, fit = cleanFit(el.getAttribute("data-fit"));
    tim.innerHTML = ""; el.setAttribute("data-fit", ""); q(".rm-desk", el).innerHTML = CA.room.desk(null, null);
    if (!quiet && was && !roomResting()) walk(fit, i, true, n, null);
  }
  /* bring the room in line with who is studying: draw it, redraw it for a new size, time of day or number of rows, or
     walk the comings and goings in and out */
  function syncRoom(){
    var now = $("now"), host = $("room"); if (!now || !host) return;
    if (!roomReady()) { if (rm) { rm = null; host.innerHTML = ""; now.classList.remove("has-room"); placeBoard(null); paintHall(); paintMe(); } return; }
    var w = Math.round(now.clientWidth), hr = new Date().getHours(); if (w < 220) return;
    var o = { w: w, h: w < 480 ? 170 : 150, n: people.length, night: hr >= 19 || hr < 6 }, R = CA.room, seats = R.seats(o), rows = seats[seats.length - 1].row + 1;
    /* rows are added as soon as they're needed, and taken away only once there are two desks to spare without them */
    if (rm && rm.w === o.w && rows < rm.rows && seats.length < people.length + 2) { o.rows = rm.rows; seats = R.seats(o); rows = rm.rows; }
    if (!rm || rm.w !== o.w || rm.night !== o.night || rm.rows !== rows || rm.seats.length !== seats.length) { buildRoom(o, seats, rows); return; }
    var here = {}, taken = {}, n = 0;
    people.forEach(function(p){ here[p.key] = p; });
    var gone = Object.keys(rm.at).filter(function(k){ return !here[k]; }), came = mineFirst(people.filter(function(p){ return rm.at[p.key] == null; }));
    var quiet = still() || document.hidden || gone.length + came.length > 6;
    now.classList.toggle("is-still", still());
    gone.forEach(function(k){ var i = rm.at[k]; delete rm.at[k]; delete rm.fits[k]; depart(i, quiet, n++); });
    Object.keys(rm.at).forEach(function(k){ taken[rm.at[k]] = 1; });
    came.forEach(function(p){
      var i = rm.order.filter(function(x){ return !taken[x]; })[0]; if (i == null) return;      /* no desk left: in the hall */
      taken[i] = 1; rm.at[p.key] = i; rm.fits[p.key] = p.fit; arrive(p, i, quiet, n++);
    });
    /* someone changed what their Timmy wears */
    people.forEach(function(p){ var i = rm.at[p.key]; if (i != null && rm.fits[p.key] !== p.fit) { rm.fits[p.key] = p.fit; arrive(p, i, true, 0); } });
    paintHall(); paintMe();
  }
  function liveLine(hub){
    var n = liveBy[hub.id];
    return n ? '<i class="dx-dot" aria-hidden="true"></i><b class="num">' + n + "</b> studying " + esc(hubName(hub)) + " right now" : "";
  }
  /* the days left as beads: today first, the exam last (the hub's emblem). Up to two weeks out. */
  function trackHTML(hub, x, d){
    if (!x || d == null || d < 1 || d > 14) return "";
    var s = "";
    for (var i = 0; i <= d; i++) s += '<li class="' + (i === 0 ? "is-today" : i === d ? "is-exam" : "") + '">' + (i === d ? emblem(hub.id, "dx-emb") : "") + "</li>";
    return '<div class="dx-track" aria-hidden="true"><ol>' + s + "</ol><p><span>Today</span><span>" + esc(shortDate(x.date)) + "</span></p></div>";
  }
  /* your progress in the open hub, as a ring */
  var RING = 2 * Math.PI * 34;
  function ringHTML(hub){
    var p = readProgress(hub), pct = p ? p.pct : 0;
    return '<div class="dx-ring" role="img" aria-label="' + (p ? pct + "% " + esc(p.pctLabel) + ", " + num(p.seen) + " questions tried" : "No questions tried in this hub yet") + '">' +
      '<span class="dx-ring-dial"><svg viewBox="0 0 80 80" aria-hidden="true" focusable="false"><circle class="trk" cx="40" cy="40" r="34"/>' +
        '<circle class="arc" cx="40" cy="40" r="34" stroke-dasharray="' + RING.toFixed(1) + '" stroke-dashoffset="' + RING.toFixed(1) + '" data-to="' + (RING * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
        '<span class="dx-ring-in"><b class="num">' + (p ? pct + "%" : "0") + "</b><small>" + (p ? "right" : "tried") + "</small></span></span>" +
      '<span class="dx-ring-cap">' + (p ? '<b class="num">' + num(p.seen) + "</b> " + (p.seen === 1 ? "question" : "questions") + " tried" + (p.best ? "<br>Best run " + p.best : "")
        : "Your progress in this hub shows here") + "</span></div>";
  }
  /* Timmy Time: a hub's audio review episode (hub.podcast = { name, sub }), on the hub's color with the host in headphones */
  /* what the episode pays (migration_v68): 10 XP and 5 crowns a minute heard, then 100 of each for finishing it; the
     minutes come from the card's "48 min" */
  function podEarn(hub){
    var m = /(\d+)\s*min/.exec(hub.podcast.sub || ""), mins = m ? +m[1] : 0;
    return '<span class="dx-pod-earn">' + (mins ? "Up to +" + num(mins * 10 + 100) + " XP and " + num(mins * 5 + 100) + " crowns" : "Earns XP and crowns as you listen") + "</span>";
  }
  function podHTML(hub){
    if (!hub.podcast) return "";
    /* animated as on a hub's Home (Sam, 2026-11-13: "animated like i had it before"): Timmy bobs in his headphones,
       notes float over him and a little equalizer plays; still when motion is off */
    var col = { tint: "#F2C94C", light: "#FFFFFF", line: "#F2C94C" };
    /* part of the hub's stage since 2026-11-19 (Sam: "make the timmy time card a part of the hub blast"): a strip along
       its foot, Timmy on the air at the left, Listen at the right */
    return '<a class="dx-pod' + (still() || focusOn() ? " is-still" : "") + '" href="' + esc(hubHref(hub, "timmy")) + '" data-hub="' + esc(hub.id) + '" data-pod="dash">' +
      '<span class="dx-pod-art" aria-hidden="true">' + spot("notes", col, "pm-notes") + spot("timmyTime", col, "pm-timmy") + "</span>" +
      '<span class="dx-pod-txt"><b>' + esc(hub.podcast.name) + ' <span class="pm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></b><small>' + esc(hub.podcast.sub) + '</small>' + podEarn(hub) + "</span>" +
      '<span class="dx-pod-go">' + icon("play", 16) + "Listen</span></a>";
  }
  /* the foot of the stage: Timmy Time and, the day before an exam and its morning, exam-day luck beside it */
  function dockHTML(hub, x, d){
    var pod = podHTML(hub), luck = x && luckTime(d) ? '<div class="dx-luck" id="heroLuck"></div>' : "";
    return pod || luck ? '<div class="dx-dock' + (pod && luck ? " has-both" : "") + '">' + pod + luck + "</div>" : "";
  }

  /* What's new (Sam, 2026-11-19: "make the whats new box take up that space between the hub card and the you and
     leaderboard cards and look super cool"): the open hub's and the whole site's latest changes as cards on a timeline,
     newest first, on a night field of the hub's color. Changes since this device last saw the hub's box wear "New"
     (sh_news_seen, kept on the device: the newest change seen, per hub; on a first visit, the last day's). The hub's
     description opens from "About this hub" in its header. applyUpdated fills the cards from the changelog. */
  var MEGAPHONE = '<svg class="dx-wn-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke="#3B2E3A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M25 41 L29 53 Q30 56 33 55 L36 54 Q38 53 37 50 L34 42" fill="#fff"/>' +
    '<path d="M15 27 L40 15 Q45 13 45 19 L45 45 Q45 51 40 49 L15 37 Z" fill="#F2C94C"/>' +
    '<ellipse cx="45" cy="32" rx="5" ry="15" fill="#FFE08A"/><rect x="8" y="27" width="8" height="10" rx="2.5" fill="#fff"/></g>' +
    '<g class="dx-wn-waves" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M54 24 Q57 32 54 40"/><path d="M59 18 Q64 32 59 46"/></g>' +
    '<path class="dx-wn-spark" d="M10 8 L11.5 12.5 L16 14 L11.5 15.5 L10 20 L8.5 15.5 L4 14 L8.5 12.5 Z" fill="#FFE08A"/></svg>';
  function newsHTML(hub){
    return '<section class="dx-wn tinted is-empty" data-news="' + esc(hub.id) + '" aria-labelledby="wnH" style="' + tintVars(hub.id) + '">' +
      '<div class="dx-wn-head">' + MEGAPHONE +
        '<div class="dx-wn-tx"><h3 id="wnH">What\'s new</h3><p><span class="updated" data-updated="' + esc(hub.updated || "") + '" data-hub="' + esc(hub.id) + '">' + (hub.updated ? "Updated " + esc(relDay(parseYmd(hub.updated))) : "") + "</span>" +
          "<span>" + esc(hubName(hub)) + " and every hub</span></p></div>" +
        (hub.desc ? '<details class="dx-wn-about"><summary>' + icon("about", 18) + "<span>About this hub</span>" + icon("chevron", 16) + '</summary><p class="dx-desc"><b>' + esc(hub.title) + ".</b> " + esc(hub.desc) + "</p></details>" : "") +
        '<p class="dx-wn-n" hidden></p>' +
        '<p class="dx-wn-nav"><button type="button" class="dx-wn-btn" data-wn="-1" aria-label="Newer changes" disabled>' + icon("chevron", 20) + '</button><button type="button" class="dx-wn-btn" data-wn="1" aria-label="Older changes">' + icon("chevron", 20) + "</button></p>" +
      "</div>" +
      '<div class="dx-wn-rail" tabindex="0" role="region" aria-label="The latest changes"><ol></ol></div>' +
    "</section>";
  }
  /* a change's first clause in bold, when it has a short one ("Five new diagrams in the Session 6 notes: ...") */
  function lede(s){
    s = String(s); var i = s.indexOf(": "), j = s.indexOf(". "), k = i > 0 && i <= 90 ? i + 1 : j > 0 && j <= 90 ? j + 1 : 0;
    return k ? "<b>" + esc(s.slice(0, k)) + "</b>" + esc(s.slice(k)) : esc(s);
  }
  function agoText(t){
    var m = Math.round((Date.now() - t) / 6e4);
    if (m < 2) return "Just now"; if (m < 60) return m + " minutes ago";
    var h = Math.round(m / 60); if (h < 24) return h === 1 ? "An hour ago" : h + " hours ago";
    var r = relDay(new Date(t)); return r.charAt(0).toUpperCase() + r.slice(1);
  }
  var NEWS_SEEN = (function(){ try { return JSON.parse(ls("sh_news_seen") || "{}") || {}; } catch (e) { return {}; } })();
  function drawNews(box){
    var id = box.getAttribute("data-news"), hub = HUBS.filter(function(h){ return h.id === id; })[0] || { id: id, title: "" };
    var mine = logRows.filter(function(r){ var t = logHubs(r); return t.indexOf(id) > -1 || t.indexOf("all") > -1; }).slice(0, 6);
    box.classList.toggle("is-empty", !mine.length);
    if (!mine.length) return;
    var prev = Date.parse(NEWS_SEEN[id] || ""), cut = isFinite(prev) ? prev : Date.now() - 864e5, fresh = 0;
    q(".dx-wn-rail ol", box).innerHTML = mine.map(function(r, i){
      var t = Date.parse(r.created_at), isNew = t > cut, all = logHubs(r).indexOf("all") > -1; if (isNew) fresh++;
      /* the time, New and the hub's tag sit on the timeline's line, so a card is only its words (Sam, 2026-11-19: "make
         it a bit thinner"); a long one shows three lines and a More button */
      return '<li class="dx-wn-item' + (i === 0 ? " is-lead" : "") + (isNew ? " is-new" : "") + (all ? " is-all" : "") + '" style="--i:' + i + '">' +
        '<p class="dx-wn-when"><i aria-hidden="true"></i><span>' + (isNew ? "<b>New</b> · " : "") + esc(agoText(t)) + "</span>" +
          '<span class="dx-wn-tag">' + (all ? icon("tooth", 14) + "Every hub" : emblem(id, "dx-emb") + esc(hubName(hub))) + "</span></p>" +
        '<div class="dx-wn-card"><p class="dx-wn-msg">' + lede(r.message) + "</p></div></li>";
    }).join("");
    qa(".dx-wn-msg", box).forEach(function(m){
      if (m.scrollHeight > m.clientHeight + 2) m.insertAdjacentHTML("afterend", '<button type="button" class="dx-wn-more" aria-expanded="false">More</button>');
    });
    var n = q(".dx-wn-n", box); n.hidden = !fresh;
    n.innerHTML = fresh ? '<b class="num">' + fresh + "</b> new<span> since your last visit</span>" : "";
    /* the newest change this device has now seen, for next time */
    var seen = {}; try { seen = JSON.parse(ls("sh_news_seen") || "{}") || {}; } catch (e) {}
    seen[id] = mine[0].created_at; lsSet("sh_news_seen", JSON.stringify(seen));
    newsNav(box);
  }
  /* the arrows move the timeline a card at a time and grey out at either end */
  function newsNav(box){
    var rail = q(".dx-wn-rail", box), btns = qa("[data-wn]", box);
    function ends(){ var mx = rail.scrollWidth - rail.clientWidth - 2; btns[0].disabled = rail.scrollLeft <= 2; btns[1].disabled = rail.scrollLeft >= mx; q(".dx-wn-nav", box).hidden = mx <= 0; }
    if (!box._ends) {
      var raf = 0; rail.addEventListener("scroll", function(){ if (!raf) raf = requestAnimationFrame(function(){ raf = 0; ends(); }); }, { passive: true });
      rail.addEventListener("click", function(e){
        var b = e.target.closest(".dx-wn-more"); if (!b) return;
        var open = b.closest(".dx-wn-card").classList.toggle("is-open");
        b.textContent = open ? "Less" : "More"; b.setAttribute("aria-expanded", String(open));
      });
      btns.forEach(function(b){ b.addEventListener("click", function(){
        var li = q(".dx-wn-item", rail), w = li ? li.getBoundingClientRect().width + 16 : rail.clientWidth * .8;
        rail.scrollBy({ left: Number(b.getAttribute("data-wn")) * w, behavior: still() ? "auto" : "smooth" }); track("news:more");
      }); });
    }
    box._ends = ends; ends();
  }
  window.addEventListener("resize", function(){ qa("[data-news]").forEach(function(b){ if (b._ends) b._ends(); }); });
  function checkinButtonsHTML(hub){
    return pastExams(hub, false).map(function(x){
      return '<button type="button" class="btn dx-checkin" data-checkin="' + esc(hub.id) + '" data-exam="' + esc(x.date) + '">' + icon("comment", 18) + "Check in on " + esc(x.name || hub.title) + "</button>";
    }).join("");
  }
  function renderPanel(){
    var hub = HUBS.filter(function(h){ return h.id === selected; })[0], el = $("hubPanel"); if (!hub) return;
    var x = nextExam(hub), d = x ? daysUntil(x.date) : null, cls = CLASSES[hub.cls] || {}, p = readProgress(hub);
    var others = (hub.exams || []).filter(function(e){ return e !== x && e.date; });
    var opened = LAST && LAST.id === hub.id ? relDay(new Date(LAST.t)) : null, checks = checkinButtonsHTML(hub);
    el.className = "dx-hub tinted"; el.setAttribute("style", tintVars(hub.id));
    el.setAttribute("role", "tabpanel"); el.setAttribute("aria-labelledby", "tab-" + hub.id); el.setAttribute("data-hub", hub.id);
    el.innerHTML =
      '<div class="dx-stage">' +
        '<button type="button" class="dx-scene" data-egg="' + esc(hub.cls) + '" aria-label="' + esc(cls.name || hub.title) + ' (tap for a surprise)"><span class="dx-scene-in" id="hubScene"></span></button>' +
        '<div class="dx-stagebody">' +
          '<div class="dx-exam">' +
            '<p class="dx-when">' + esc(x ? longDate(x.date) + " · " + (x.code || hub.code) : hub.code) + "</p>" +
            '<h3 class="dx-title">' + esc(x ? x.name : hub.title) + "</h3>" +
            '<div class="dx-countrow">' +
              (x ? '<p class="dx-count"><b class="num flap" data-flap="' + (d === 0 ? "Today" : d) + '">' + (d === 0 ? "Today" : d) + "</b>" + (d === 0 ? "" : " <span>" + (d === 1 ? "day to go" : "days to go") + "</span>") + "</p>"
                 : '<p class="dx-count dx-count-none"><span>' + esc(opened ? "You last opened this " + opened : "No exam ahead in this hub") + "</span></p>") +
              trackHTML(hub, x, d) +
            "</div>" +
            '<p class="dx-livehub" id="hubLive">' + liveLine(hub) + "</p>" +
            /* the hub's other exams, under the countdown (they were on the card under the stage until 2026-11-19) */
            (others.length ? '<ul class="dx-exams">' + others.map(function(e){ var dd = daysUntil(e.date); return "<li><b>" + esc(e.label || "Exam") + "</b> " + esc(shortDate(e.date)) + " · " + (dd < 0 ? "done" : esc(daysText(dd))) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>" +
          '<div class="dx-go">' + ringHTML(hub) +
            '<div class="dx-actions"><a class="btn btn-primary dx-start" href="' + esc(hubHref(hub)) + '" data-hub="' + esc(hub.id) + '">' + (p ? "Continue studying" : "Start studying") + icon("chevron", 18) + "</a>" + drillHTML(hub) + "</div>" +
          "</div>" +
        "</div>" +
        dockHTML(hub, x, d) +
      "</div>" +
      (checks ? '<div class="dx-checks">' + checks + "</div>" : "") +
      newsHTML(hub);
    /* the scene: the hub's masthead, drawn once its art file is in */
    masthead(hub.id).then(function(M){
      var s = $("hubScene"); if (!s || selected !== hub.id || !M) return;
      s.innerHTML = img(M.body, M.label || "", "dx-mast", "0 0 600 200");
    });
    if (x) heroFlap(hub, x);
    luckFor = x && luckTime(d) ? { hub: hub.id, date: x.date, name: x.name, d: d } : null;
    drawLuck(); loadLuck();
    applyUpdated();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ var arc = q(".dx-ring .arc", el); if (arc) arc.style.strokeDashoffset = arc.getAttribute("data-to"); }); });
  }
  /* the class's easter egg, on the hub's scene (the live dashboard has it on the class icon) */
  document.addEventListener("click", function(e){
    var btn = e.target.closest(".dx-scene[data-egg]"); if (!btn) return;
    var c = CLASSES[btn.getAttribute("data-egg")]; if (!c || !c.egg) return;
    btn.classList.remove("is-active"); void btn.offsetWidth; btn.classList.add("is-active");
    toast(c.egg, "egg");
  });
  /* remember what was opened last */
  document.addEventListener("click", function(e){
    var a = e.target.closest("a[data-hub]"); if (!a) return;
    lsSet("sh_dash_last", JSON.stringify({ id: a.getAttribute("data-hub"), t: Date.now() }));
  });
  /* coming back from a hub (the back button restores this page as it was): redraw the open hub */
  window.addEventListener("pageshow", function(e){ if (e.persisted) { renderPanel(); renderYouStats(); } });

  /* ---------- hubs that closed: no card of their own (Sam, 2026-11-14: "dont seem to be for anything. They can be
     removed"). A closed hub is in Past hubs through its exam check-in, while that is open, and its recap. ---------- */
  function renderArchived(){ renderCheckins(); showPast(); }
  /* the exam check-ins that are open, newest exam first: a closed hub's stay here for 60 days (debriefDays). One that was sent from this device says so and can't be sent twice by mistake. */
  function openCheckins(){
    var out = [];
    HUBS_SRC.concat(ARCHIVED_SRC).forEach(function(h){
      if (HUB_STATE[h.id] && HUB_STATE[h.id].state === "live") return;   /* a live hub's is on its own panel */
      pastExams(h, false).forEach(function(x){ out.push({ hub: h, x: x, sent: !!ls("sh_debrief_sent_" + h.id + "_" + x.date) }); });
    });
    return out.sort(function(a, b){ return a.x.date < b.x.date ? 1 : -1; });
  }
  function renderCheckins(){
    var el = $("checkins"), list = openCheckins(), todo = list.filter(function(c){ return !c.sent; }).length;
    el.hidden = !list.length;
    if (!list.length) { el.innerHTML = ""; return; }
    el.innerHTML = '<div class="dx-ck-head">' + icon("comment", 22) + '<div><h3>Exam check-ins</h3><p class="note">' +
      (todo ? "How did " + (todo === 1 ? "it" : "they") + " go? Two minutes each, and the answers shape the next hubs." : "All sent. Thank you: they shape the next hubs.") + "</p></div>" +
      (todo ? '<span class="dx-ck-n num" aria-hidden="true">' + todo + " open</span>" : "") + "</div>" +
      '<ul class="dx-ck-list">' + list.map(function(c){
        var when = parseYmd(c.x.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        var inner = emblem(c.hub.id, "dx-emb") + "<span><b>" + esc(c.x.name || c.hub.title) + "</b><small>Exam on " + esc(when) + "</small></span>";
        return '<li class="tinted" style="' + tintVars(c.hub.id) + '">' + (c.sent
          ? '<span class="dx-ck is-sent">' + inner + '<span class="dx-ck-go">' + icon("check", 16) + "Sent</span></span>"
          : '<button type="button" class="dx-ck" data-checkin="' + esc(c.hub.id) + '" data-exam="' + esc(c.x.date) + '">' + inner + '<span class="dx-ck-go">Check in' + icon("chevron", 16) + "</span></button>") + "</li>";
      }).join("") + "</ul>";
  }
  function showPast(){
    var rec = !$("rc").hidden;
    $("past").hidden = !rec && $("checkins").hidden;
    $("pastNote").textContent = rec ? "How the class studied for each exam that's done." : "Hubs that closed after their exam.";
  }

  /* ---------- the visitor: a random per-browser id, made on first need ---------- */
  function surveyVisitor(){
    if (VISITOR) return VISITOR;
    try{
      VISITOR = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
      localStorage.setItem("sh_visitor_id", VISITOR);
    }catch(e){}
    return VISITOR;
  }

  /* ====================================================================
     EXAM CHECK-INS AND SURVEYS: the live dashboard's own code (index.html), moved here at the release with the idea
     board's tick in the check-in (below). Since 2026-11-17 both open in a window in the middle of the screen, with the
     reward on it and Timmy looking over its top edge (Sam: "make the check in and survey prompt more interesting and also
     advertise that it earns you 1000xp and 1000 gold crowns. make it take up the center of the screen and a window. have
     timmy peek over the top of the window").
     ==================================================================== */
  /* the reward the server pays for the first answer to each survey and each hub's exam check-in (migration_v60, v61) */
  var FORM_XP = 1000, FORM_CROWNS = 1000;
  function coinSvg(px){ return '<svg class="survey-coin" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + SHOP_COIN + "</svg>"; }
  function starSvg(px){ return '<svg class="survey-star" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true" focusable="false"><path d="M12 2.6 L14.4 9.6 L21.4 12 L14.4 14.4 L12 21.4 L9.6 14.4 L2.6 12 L9.6 9.6 Z" fill="#F2C94C" stroke="#3B2E3A" stroke-width="2" stroke-linejoin="round"/></svg>'; }
  /* the reward as two tiles on gold, before anything is sent ("Send it and earn") */
  function lootHtml(lead, xp, crowns){
    return '<div class="survey-loot"><p class="survey-loot-lead">' + lead + '</p><p class="survey-tiles">' +
      '<span class="survey-tile is-xp">' + starSvg(30) + '<span><b class="num">+' + num(xp) + "</b><small>XP</small></span></span>" +
      '<span class="sr"> and </span><span class="survey-tile is-crowns">' + coinSvg(30) + '<span><b class="num">+' + num(crowns) + "</b><small>Shiny Gold Crowns</small></span></span></p></div>";
  }
  function thanksHtml(title, text){ return '<div class="survey-done" role="status"><h3>' + title + '</h3><p class="survey-thanks">' + text + "</p></div>"; }

  /* The thank-you when a reward was paid (Sam, 2026-11-17: "the thank you stage should show that you earned the crowns
     and xp. make it do a super epic and cool animation so people feel good for doing these"): a gold sunburst turning
     behind it, a shockwave, crowns, stars and confetti bursting out of the window, "You earned" with the two tiles
     popping in and their numbers counting up to what was paid, and Timmy jumping up over the edge to cheer. Collect (or
     the ×, Escape, or 12 seconds) closes it, and the crowns and stars fly out of the tiles into your rank in the bar,
     which glows as they land; then the page reads your XP and crowns again (rewardPaid), so a rank-up card comes after,
     not on top. With reduced motion or "Answer animations" off: the same thank-you, still. */
  function celebrate(W, r, text, extra, sb){
    var calm = still(), bits = "", COLORS = ["#F2C94C", "#FF8FA3", "#7FD8A8", "#8FA6EC", "#C3A9F0", "#F7A83C"], flown = false;
    if (!calm) for (var i = 0; i < 28; i++) {
      var ang = (-90 + (Math.random() * 160 - 80)) * Math.PI / 180, dist = 150 + Math.random() * 190, art = i % 4 === 0 ? coinSvg(22) : i % 4 === 1 ? starSvg(18) : "";
      bits += '<i class="' + (art ? "is-art" : "is-bit") + '" style="--x:' + Math.round(Math.cos(ang) * dist) + "px;--up:" + Math.round(Math.sin(ang) * dist * .8) + "px;--fall:" +
        Math.round(240 + Math.random() * 260) + "px;--r:" + Math.round(Math.random() * 900 - 450) + "deg;--d:" + Math.round(80 + Math.random() * 380) + "ms;--t:" +
        Math.round(1500 + Math.random() * 900) + "ms;--c:" + COLORS[i % COLORS.length] + '">' + art + "</i>";
    }
    W.set('<div class="survey-done survey-cele" role="status"><span class="sr">You earned ' + num(r.xp) + " XP and " + num(r.crowns) + " Shiny Gold Crowns. Thank you!</span>" +
      '<span class="survey-raysbox" aria-hidden="true"><span class="survey-rays"></span></span>' +
      '<span class="survey-wave" aria-hidden="true"></span><span class="survey-confetti" aria-hidden="true">' + bits + "</span>" +
      '<h3 aria-hidden="true">Thank you!</h3><p class="survey-cele-lead" aria-hidden="true">You earned</p>' +
      '<div class="survey-bigs" aria-hidden="true">' +
        '<span class="survey-big is-xp">' + starSvg(46) + '<b class="num" data-to="' + r.xp + '">+' + num(r.xp) + "</b><small>XP</small></span>" +
        '<span class="survey-big is-crowns">' + coinSvg(46) + '<b class="num" data-to="' + r.crowns + '">+' + num(r.crowns) + "</b><small>Shiny Gold Crowns</small></span></div>" +
      '<p class="survey-thanks">' + text + "</p>" + (extra || "") +
      '<button type="button" class="btn btn-primary survey-collect">' + coinSvg(20) + "Collect</button></div>");
    W.say("Ka-ching! You earned it!"); W.cheer();
    var btn = q(".survey-collect", W.body);
    try { btn.focus({ preventScroll: true }); } catch (e) {}
    btn.addEventListener("click", function(){ W.close(); });
    /* the numbers count up from 0, the crowns a beat after the XP */
    if (!calm && window.requestAnimationFrame) Array.prototype.forEach.call(W.body.querySelectorAll(".survey-big b"), function(b, k){
      var to = +b.getAttribute("data-to") || 0, t0 = null, wait = 420 + k * 200, dur = 1200;
      b.textContent = "+0";
      function step(ts){
        if (!b.isConnected) return;
        if (t0 == null) t0 = ts;
        var x = Math.min(1, Math.max(0, (ts - t0 - wait) / dur)), e = 1 - Math.pow(1 - x, 3);
        b.textContent = "+" + num(Math.round(to * e));
        if (x < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    /* closing, however it closes: the crowns and stars fly to your rank in the bar, then the page reads the reward */
    W.closed = function(){
      if (flown) return; flown = true;
      var tgt = document.getElementById("dxRank"), tr = tgt && !tgt.hidden && tgt.getBoundingClientRect(), icons = W.body.querySelectorAll(".survey-big > svg"), land = 0;
      if (!calm && tr && tr.width && icons.length === 2 && document.body.animate) {
        for (var i = 0; i < 12; i++) (function(i){
          var src = icons[i % 2], sr = src.getBoundingClientRect(), f = document.createElement("span");
          f.className = "survey-flyer"; f.setAttribute("aria-hidden", "true"); f.innerHTML = src.outerHTML;
          f.style.left = sr.left + "px"; f.style.top = sr.top + "px"; f.style.width = sr.width + "px"; f.style.height = sr.height + "px";
          root.appendChild(f);
          var dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2), dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2),
            mx = dx * .35 + (Math.random() * 160 - 80), my = Math.min(0, dy) * .45 - 60 - Math.random() * 80, ms = 760 + i * 30, delay = i * 60;
          land = Math.max(land, ms + delay);
          f.animate([{ transform: "translate(0,0) scale(.6) rotate(0deg)", opacity: 0 }, { transform: "translate(" + mx + "px," + my + "px) scale(1.1) rotate(" + (i % 2 ? 200 : -200) + "deg)", opacity: 1, offset: .45 },
            { transform: "translate(" + dx + "px," + dy + "px) scale(.3) rotate(" + (i % 2 ? 360 : -360) + "deg)", opacity: .9 }],
            { duration: ms, delay: delay, easing: "cubic-bezier(.45,0,.6,1)", fill: "both" }).onfinish = function(){ f.remove(); };
        })(i);
        setTimeout(function(){ tgt.classList.remove("is-gain"); void tgt.offsetWidth; tgt.classList.add("is-gain"); setTimeout(function(){ tgt.classList.remove("is-gain"); }, 1300); }, Math.min(land, 900));
      }
      setTimeout(function(){ rewardPaid(sb, r); }, land + 150);
    };
    W.timer(function(){ W.close(); }, 12000);
  }
  /* Timmy over the window's top edge (none with him or the extras off): his drawing, in what he wears at his place, cut
     at the edge, and his hands drawn again on top of it, holding on. Both in his own 200 x 262 frame, so they line up. */
  var PEEK_HANDS = '<svg class="survey-hands" viewBox="0 -30 200 262" aria-hidden="true" focusable="false">' +
    '<g fill="#FBF7EE" stroke="#3B2E3A" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M19 124 C18 116 25 110 34 110 C43 110 50 116 49 124 C49 129 47 133 43 133 C41 135 37 135 35 133 C33 135 29 135 27 133 C23 133 19 129 19 124 Z"/>' +
    '<path d="M181 124 C182 116 175 110 166 110 C157 110 150 116 151 124 C151 129 153 133 157 133 C159 135 163 135 165 133 C167 135 171 135 173 133 C177 133 181 129 181 124 Z"/></g>' +
    '<g fill="none" stroke="#3B2E3A" stroke-width="2.6" stroke-linecap="round"><path d="M27.5 126 V132 M35 126 V132.5 M42.5 126 V132 M172.5 126 V132 M165 126 V132.5 M157.5 126 V132"/></g>' +
    '<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M26 117 C28 114 31 113 34 113 M174 117 C172 114 169 113 166 113"/></g></svg>';
  function peekHtml(){
    var P = window.shPet, t = "";
    if (!P || !P.art || focusOn() || ls("sh_pref_pet") === "off") return "";
    try { t = String(P.art({ hp: 100, mood: "happy" }, 200)); } catch (e) { return ""; }
    return '<div class="survey-peek" aria-hidden="true"><div class="survey-tim"><div class="survey-timin">' + t + "</div></div>" + PEEK_HANDS + "</div>" +
      '<p class="survey-say" aria-hidden="true"></p>';
  }

  /* The window both open in: the middle of the screen over the dimmed page, a title bar (the hub's tint for a check-in,
     gold for a survey) and Timmy over its top edge, with a line for each step. It keeps the keyboard while it is open
     and gives the focus back when it closes. o = { label, bar (the title bar's inside, markup), hub (its tint; none for
     gold), closeLabel, dismiss() (the ×, Escape or a tap on the dimmed page) }. Returns { box (the section.survey the rest
     of the page looks for), win, body, set(html), say(line), cheer(), timer(fn, ms), close(now), closed (a hook run as
     it closes) }. */
  var formNow = null;
  /* The pop-ups never open over another window (a classmate's place, the shop, a rank-up card, a dialog): a <dialog>
     opened with showModal sits above everything, so the check-in would open hidden under it and take its Escape. They
     wait for it to close, looking every 1.5 s for up to five minutes, then leave it for the next visit. */
  function whenUncovered(fn, n){
    n = n || 0;
    if (!lifeCovered()) { fn(); return; }
    if (n < 200) setTimeout(function(){ whenUncovered(fn, n + 1); }, 1500);
  }
  function formWindow(o){
    if (formNow) formNow.close(true);
    var back = document.activeElement, peek = peekHtml(), shut = false;
    var box = document.createElement("section");
    box.className = "survey" + (peek ? " has-peek" : "");
    box.innerHTML = '<div class="survey-win' + (o.hub ? " tinted" : " is-gold") + '" role="dialog" aria-modal="true" aria-label="' + esc(o.label) + '" tabindex="-1"' +
      (o.hub ? ' data-hub="' + esc(o.hub) + '" style="' + tintVars(o.hub) + '"' : "") + ">" + peek +
      '<div class="survey-bar">' + o.bar + '<button type="button" class="survey-x" aria-label="' + esc(o.closeLabel || "Close") + '">' + icon("close", 20) + "</button></div>" +
      '<div class="survey-body"></div></div>';
    root.appendChild(box);
    var win = q(".survey-win", box), body = q(".survey-body", box), bubble = q(".survey-say", box);
    function hold(){ if (!win.contains(document.activeElement)) try { win.focus({ preventScroll: true }); } catch (e) {} }
    function key(e){
      if (e.key === "Escape") { e.preventDefault(); o.dismiss(); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(win.querySelectorAll("button, textarea, input, select, a[href]"), function(el){ return !el.disabled && el.offsetParent !== null; });
      if (!f.length) { e.preventDefault(); return; }
      var at = document.activeElement;
      if (e.shiftKey && (at === f[0] || at === win || !win.contains(at))) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (at === f[f.length - 1] || !win.contains(at))) { e.preventDefault(); f[0].focus(); }
    }
    document.addEventListener("keydown", key);
    box.addEventListener("click", function(e){ if (e.target === box || e.target.closest(".survey-x")) o.dismiss(); });
    requestAnimationFrame(function(){ box.classList.add("is-shown"); hold(); });
    var tmr = null;
    var W = {
      box: box, win: win, body: body, closed: null,
      /* one timer for the window (an auto-close): a new one replaces the last, and closing clears it */
      timer: function(fn, ms){ clearTimeout(tmr); tmr = setTimeout(fn, ms); },
      set: function(html){ body.innerHTML = html; hold(); },
      say: function(t){
        if (!bubble || !t || bubble.textContent === t) return;
        var first = !bubble.textContent;
        bubble.textContent = t;
        if (first) return;
        bubble.classList.remove("is-new"); void bubble.offsetWidth; bubble.classList.add("is-new");
      },
      cheer: function(){ var p = q(".survey-peek", box); if (p) { p.classList.remove("is-cheer"); void p.offsetWidth; p.classList.add("is-cheer"); } },
      close: function(now){
        if (shut) return; shut = true;
        clearTimeout(tmr);
        if (formNow === W) formNow = null;
        if (W.closed) try { W.closed(); } catch (e) {}
        document.removeEventListener("keydown", key);
        if (now) box.remove();
        else { box.classList.remove("is-shown"); setTimeout(function(){ box.remove(); }, 320); }
        try { if (back && back.focus && back !== document.body && document.contains(back)) back.focus({ preventScroll: true }); } catch (e) {}
      }
    };
    formNow = W;
    return W;
  }

  /* Exam check-in (exam_debriefs, migration_v23/v24). After an exam, anyone with progress in that hub gets the
     check-in as a pop-up once, on their first visit after it, however late. Every hub (live or archived) with a
     finished exam keeps a "Check in" button, so people can send more than one. Answers are read back when the hub
     is archived, to improve the next ones (see LESSONS.md). */
  var DEBRIEF_QS = [
    { id:"ready", kind:"scale", prompt:"How ready did you feel walking in?", ends:["Not ready","Very ready"] },
    { id:"went", kind:"choice", prompt:"How did it go?", options:["Better than I expected","About what I expected","Worse than I expected"] },
    { id:"match", kind:"choice", prompt:"How did the hub's questions compare with the real exam?", options:["Hub was harder","About right","Hub was easier","Exam asked different things"] },
    { id:"missed", kind:"text", prompt:"What could the hub have done better?",
      note:"Please don't write out exam questions or answers: the honor code keeps exam content private." }
  ];
  var debriefSb = null;
  /* exams whose check-in is open, newest first: the card button from the exam's checkinHour (default CHECKIN_HOUR) on exam day, the pop-up from the
     exam's promptHour (default ARCHIVE_HOUR), neither before checkinFrom ({date, hour}) if it is set; both until DEBRIEF_DAYS after it */
  function pastExams(hub, forPopup){
    var now = new Date();
    return (hub.exams || []).filter(function(x){
      var hour = forPopup ? (x.promptHour != null ? x.promptHour : ARCHIVE_HOUR) : (x.checkinHour != null ? x.checkinHour : CHECKIN_HOUR);
      if (x.checkinUntil && now >= examAt({ date:x.checkinUntil.date }, x.checkinUntil.hour != null ? x.checkinUntil.hour : ARCHIVE_HOUR)) return false;
      /* checkinFrom holds the button and the pop-up until a later day, e.g. when the course bans discussing the exam until a date */
      if (x.checkinFrom && now < examAt({ date:x.checkinFrom.date }, x.checkinFrom.hour != null ? x.checkinFrom.hour : 0)) return false;
      return x.date && !x.checkinClosed && now >= examAt(x, hour) && -daysUntil(x.date) <= DEBRIEF_DAYS;
    })
      .sort(function(a, b){ return a.date < b.date ? 1 : -1; });
  }
  function debriefHub(id){ return HUBS.concat(ARCHIVED_HUBS).filter(function(h){ return h.id === id; })[0]; }
  /* the pop-up: the newest finished exam this device studied for that it hasn't been shown yet, or, once per round, one
     whose exam has askAgain in hubs.js ("<round>") that this device showed and never sent: whoever said no gets it again
     (Sam, 2026-11-17: "lets push this new prompt to anyone who has said no on the occlusion final check in"). A no isn't
     recorded anywhere else, so the device decides. */
  function autoDebrief(){
    var best = null;
    HUBS.concat(ARCHIVED_HUBS).forEach(function(h){
      if (!readProgress(h)) return;
      pastExams(h, true).forEach(function(x){
        var k = h.id + "_" + x.date, again = false;
        if (ls("sh_debrief_" + k)) {
          if (!x.askAgain || ls("sh_debrief_sent_" + k) || ls("sh_debrief_again_" + k + "_" + x.askAgain)) return;
          again = true;
        }
        if (!best || x.date > best.x.date) best = { h:h, x:x, again:again };
      });
    });
    if (!best) return false;
    openDebrief(best.h, best.x, best.again);
    return true;
  }
  /* an exam's extraQs (e.g. Occlusion's diagram ratings) go just before the closing text question, which stays last */
  function debriefQs(x){ var n = DEBRIEF_QS.length - 1; return DEBRIEF_QS.slice(0, n).concat(x.extraQs || [], DEBRIEF_QS.slice(n)); }
  /* One question per step so the window stays short on any screen instead of scrolling: a bar fills toward the crown
     coin at its end, and Timmy has a line for each. Tapping a choice moves on by itself; the text question at the end
     has Send. Every question is optional. */
  function openDebrief(hub, x, again){
    var me = surveyVisitor();
    if (!me) return;
    lsSet("sh_debrief_" + hub.id + "_" + x.date, "1");   /* shown = seen; the card button stays for later */
    /* seen now, by the pop-up or the button, counts as this askAgain round's showing too, so a device that first sees it
       after the round was set isn't asked a second time on its next visit */
    if (x.askAgain) lsSet("sh_debrief_again_" + hub.id + "_" + x.date + "_" + x.askAgain, "1");
    var QS = debriefQs(x), answers = {}, examId = x.date + " " + (x.label || "Exam"), step = 0, last = QS.length - 1, timer = null;
    /* the server pays for the first check-in for this exam; one already sent from this device had it, so it isn't offered */
    var pays = !ls("sh_debrief_sent_" + hub.id + "_" + x.date);
    /* the idea board's tick under "What could the hub have done better?" (widget/ideas.js, Sam 2026-11-06): ticked to
       start, it shows the answer as the post it would make (a title, the text cut to 280, its kind) and posts it under
       the writer's leaderboard name when the check-in is sent. Unticked, the answer stays private, as before. The tick
       draws nothing until the board is up, and what it holds (ideaPost) outlives a Back and Next. */
    var ideaTick = null, ideaPost = {};
    var W = formWindow({ label: "Exam check-in", hub: hub.id, dismiss: function(){ close(); },
      bar: emblem(hub.id, "survey-emb") + '<span class="survey-title"><b>Exam check-in</b><small>' + esc(x.name || hub.title) + "</small></span>" });
    var box = W.box;
    /* what Timmy says over the window, step by step */
    function line(q){
      if (step === last) return pays ? "Last one! Send it and the crowns are yours." : "Last one. What could I have done better?";
      if (step === 0) return pays ? (again ? "Me again! " : "Psst! ") + "A few quick taps and " + num(FORM_CROWNS) + " crowns are yours." : "Back again? I'm all ears.";
      if (q.id === "went") return "So? How did it go?";
      if (q.id === "match") return "Did my questions look like the real thing?";
      return pays ? "Almost there. The crowns are close!" : "Almost there!";
    }
    function render(){
      var q = QS[step], v = answers[q.id];
      var h = '<div class="survey-prog"><span class="survey-count">Question ' + (step + 1) + " of " + QS.length + "</span>" +
        '<span class="survey-meter" aria-hidden="true">' + QS.map(function(_, i){ return "<i" + (i <= step ? ' class="on"' : "") + "></i>"; }).join("") + "</span>" +
        (pays ? '<span class="survey-prize' + (step === last ? " is-near" : "") + '" aria-hidden="true">' + coinSvg(20) + "</span>" : "") + "</div>";
      if (step === 0) h += '<h3>How did ' + esc(x.name || hub.title) + ' go?</h3>' +
        '<p class="survey-why">What you say here, along with how everyone used the hub, goes to the AI that builds these hubs, so the ones for your next exams come out better.</p>' +
        (pays ? lootHtml("Send it and earn", FORM_XP, FORM_CROWNS) : "");
      h += '<div class="survey-q" data-sq="' + q.id + '" data-kind="' + q.kind + '"><p' + (step ? ' class="debrief-prompt"' : '') + '>' + esc(q.prompt) + '</p>';
      if (q.kind === "text") h += (q.note ? '<p class="survey-why">' + esc(q.note) + '</p>' : '') +
        '<textarea maxlength="600" aria-label="' + esc(q.prompt) + '">' + esc(v || "") + '</textarea>' +
        (q.id === "missed" ? '<div data-idea-tick></div><p class="survey-why debrief-warn" role="alert"></p>' : '');
      else if (q.kind === "scale") {
        h += '<div class="survey-opts survey-scale">';
        for (var n = 1; n <= 5; n++) h += '<button type="button" class="survey-opt" aria-pressed="' + (v === n) + '" data-sv="' + n + '">' + n + '</button>';
        h += '</div><div class="survey-scale-ends' + (q.ends.length > 2 ? ' survey-scale-ends3' : '') + '">' + q.ends.map(function(e){ return '<span>' + esc(e) + '</span>'; }).join("") + '</div>';
        /* none: a button under the scale for "I didn't use it", saved as "none" so it never counts in the average */
        if (q.none) h += '<div class="survey-opts debrief-list debrief-none"><button type="button" class="survey-opt" aria-pressed="' + (v === "none") + '" data-sv="none">' + esc(q.none) + '</button></div>';
      } else if (q.kind === "multi") h += '<div class="survey-opts debrief-list debrief-multi" role="group" aria-label="' + esc(q.prompt) + '">' + q.options.map(function(o){ return '<button type="button" class="survey-opt" aria-pressed="' + (!!v && v.indexOf(o) >= 0) + '" data-sv="' + esc(o) + '">' + esc(o) + '</button>'; }).join("") + '</div>';
      else h += '<div class="survey-opts debrief-list">' + q.options.map(function(o){ return '<button type="button" class="survey-opt" aria-pressed="' + (v === o) + '" data-sv="' + esc(o) + '">' + esc(o) + '</button>'; }).join("") + '</div>';
      h += '</div><div class="survey-foot"><button type="button" class="survey-skip" data-act="' + (step ? 'back' : 'close') + '">' + (step ? 'Back' : 'Not now') + '</button>';
      if (step < last) h += '<button type="button" class="btn ' + (v != null ? 'btn-primary' : 'btn-quiet') + '" data-act="next">' + (v != null ? 'Next' : 'Skip') + '</button>';
      else h += '<button type="button" class="btn btn-primary survey-send" data-act="send">Send</button>';
      W.set(h + '</div>');
      W.say(line(q));
      /* an idea from a check-in is for its hub; one the server holds no answer keys for (an old single-file hub's)
         goes in as an idea for all hubs (widget/ideas.js sends it again without the hub) */
      var th = box.querySelector("[data-idea-tick]");
      ideaTick = th && window.shIdeas && debriefSb ? window.shIdeas.tick(th, { sb: debriefSb, hub: hub.id, hubName: hubName(hub), source: "checkin", checked: true, category: "content", state: ideaPost, nameHint: function(){ return randomName; } }) : null;
      refresh();
      var t = box.querySelector("textarea"); if (t && step && window.matchMedia && matchMedia("(hover:hover)").matches) setTimeout(function(){ try{ t.focus({ preventScroll:true }); }catch(e){} }, 60);
    }
    function refresh(){
      var t = box.querySelector("textarea"), send = box.querySelector(".survey-send");
      if (t){ var v = t.value.trim(); if (v) answers.missed = v.slice(0, 600); else delete answers.missed; if (ideaTick) ideaTick.sync(v); }
      if (send) send.disabled = !Object.keys(answers).length;
    }
    function go(n){ clearTimeout(timer); step = Math.max(0, Math.min(last, n)); render(); }
    function close(){ clearTimeout(timer); W.close(); }
    render();
    box.addEventListener("input", refresh);
    box.addEventListener("click", function(e){
      var opt = e.target.closest(".survey-opt");
      if (opt){
        var q = QS[step], on = opt.getAttribute("aria-pressed") !== "true", sv = opt.getAttribute("data-sv");
        /* tick any: toggles in place and waits for Next; the q.only choice ("None of these") clears the others and the others clear it */
        if (q.kind === "multi"){
          opt.setAttribute("aria-pressed", String(on));
          if (on && q.only) box.querySelectorAll(".survey-opt").forEach(function(b){ if (b !== opt && (sv === q.only || b.getAttribute("data-sv") === q.only)) b.setAttribute("aria-pressed", "false"); });
          var picked = Array.prototype.map.call(box.querySelectorAll('.survey-opt[aria-pressed="true"]'), function(b){ return b.getAttribute("data-sv"); });
          if (picked.length) answers[q.id] = picked; else delete answers[q.id];
          var nx = box.querySelector('[data-act="next"]');
          if (nx){ nx.className = "btn " + (picked.length ? "btn-primary" : "btn-quiet"); nx.textContent = picked.length ? "Next" : "Skip"; }
          return;
        }
        box.querySelectorAll(".survey-opt").forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
        opt.setAttribute("aria-pressed", String(on));
        if (on) answers[q.id] = q.kind === "scale" && sv !== "none" ? +sv : sv;
        else delete answers[q.id];
        clearTimeout(timer);
        if (on) timer = setTimeout(function(){ go(step + 1); }, 320); else render();
        return;
      }
      var act = e.target.closest("[data-act]"); if (!act) return;
      var a = act.getAttribute("data-act");
      if (a === "close") close();
      else if (a === "back") go(step - 1);
      else if (a === "next") go(step + 1);
      else if (a === "send" && !act.disabled){
        refresh();
        /* the tick: a ticked answer needs a name and a title before anything is sent; an unticked one is counted */
        var tk = ideaTick, toBoard = !!(tk && tk.on()), warn = box.querySelector(".debrief-warn");
        if (toBoard) { var bad = tk.check(); if (bad) { if (warn) warn.textContent = bad; return; } }
        else if (tk && tk.shown() && answers.missed) track("ideas:checkin-private");
        act.disabled = true;
        var failed = function(){
          W.set(thanksHtml("That didn't save.", "Please try again in a minute from the hub on this page."));
          W.say("Uh oh. Try me again in a minute?");
          setTimeout(close, 4000);
        };
        if (!debriefSb) { failed(); return; }
        sendForm(debriefSb, "submit_exam_debrief", { p_hub:hub.id, p_exam:examId, p_visitor:me, p_answers:answers }).then(function(r){
          /* closed on the server (migration_v86) after this page loaded its hubs.js */
          if (!r.ok && r.closed) {
            W.set(thanksHtml("This check-in is closed.", "Thanks for wanting to help! It isn't taking answers any more."));
            W.say("This one's closed. Thanks anyway!");
            setTimeout(close, 4000); return;
          }
          if (!r.ok) { failed(); return; }
          lsSet("sh_debrief_sent_" + hub.id + "_" + x.date, "1"); renderCheckins();
          var text = "Thought of something else? Check in again any time from the hub on this page.";
          function done(more, ms){
            if (r.xp > 0) { celebrate(W, r, text, more, debriefSb); return; }
            W.set(thanksHtml("Thank you!", text) + (more || ""));
            W.say("Thank you! That helps a lot.");
            setTimeout(close, ms);
          }
          if (!toBoard) { done("", 3600); return; }
          /* the check-in is in; now the post. If it doesn't go up (three ideas today, say), the check-in still counts */
          tk.post().then(function(p){
            done('<p class="survey-why">' + (p.ok ? "Your idea is on the idea board." : "Your check-in was sent, but the idea didn\'t post. " + esc(p.msg || "")) + "</p>", p.ok ? 3600 : 7000);
          }, function(){ done("", 3600); });
        }, failed);
      }
    });
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-checkin]"); if (!b) return;
    var hub = debriefHub(b.getAttribute("data-checkin")), x = hub && (hub.exams || []).filter(function(z){ return z.date === b.getAttribute("data-exam"); })[0];
    if (hub && x) openDebrief(hub, x);
  });
  function startSurvey(sb, bootstrap){
    var me = surveyVisitor();
    if (!me) return;
    /* Ask again: a survey in hubs.js's surveyAgain ({ "<survey id>": "<round>" }) comes back as a pop-up once per round for
       anyone who said "Later" to it (Sam, 2026-11-17: "lets push this new prompt to anyone who has said no on ... the new
       survey"). Saying Later leaves a row, so get_active_survey (survey_popup) skips them; get_my_survey (the Inbox's
       `survey`) still has it until it's answered, on whichever device they said no. */
    var AGAIN = D.surveyAgain || {};
    function again(list){
      var sv = (Array.isArray(list) ? list : []).filter(function(x){ return x && AGAIN[x.id] && !ls("sh_survey_again_" + x.id + "_" + AGAIN[x.id]); })[0];
      return sv ? [sv] : null;
    }
    function show(rows, re){
      var sv = rows && rows[0];
      if (!sv || (!re && ls("sh_survey_done_" + sv.id))) return;
      var qs = Array.isArray(sv.questions) ? sv.questions.slice(0, 5) : [];
      if (!qs.length) return;
      if (document.querySelector(".survey")) return;   /* a check-in opened from a card is already up: the survey waits for the next visit */
      if (lifeCovered()) { whenUncovered(function(){ show(rows, re); }); return; }   /* the answer came while a window was open */
      if (re) lsSet("sh_survey_again_" + sv.id + "_" + AGAIN[sv.id], "1");
      var answers = {}, sent = false;
      /* "Later" (the button, the ×, Escape or a tap on the dimmed page) stops the pop-up; the survey waits in the Inbox */
      var W = formWindow({ label: "Quick survey", closeLabel: "Later", dismiss: function(){ if (sent) W.close(); else done(null, false); },
        bar: '<span class="survey-emb survey-emb-ic">' + icon("comment", 20) + '</span><span class="survey-title"><b>Quick survey</b><small>' +
          (qs.length === 1 ? "1 question" : qs.length + " questions") + "</small></span>" });
      var box = W.box;
      var h = '<h3>' + esc(sv.title) + '</h3>' + lootHtml("Send it and earn", FORM_XP, FORM_CROWNS);
      qs.forEach(function(q, qi){
        var id = String(q.id || ("q" + (qi + 1)));
        h += '<div class="survey-q" data-sq="' + esc(id) + '" data-kind="' + esc(q.kind || "choice") + '"><p>' + esc(q.prompt || "") + '</p>';
        if (q.kind === "text") h += '<textarea maxlength="600" aria-label="' + esc(q.prompt || "Your answer") + '"></textarea>';
        else if (q.kind === "scale") {
          h += '<div class="survey-opts survey-scale">';
          for (var n = 1; n <= 5; n++) h += '<button type="button" class="survey-opt" aria-pressed="false" data-sv="' + n + '">' + n + '</button>';
          h += '</div><div class="survey-scale-ends"><span>' + esc((q.ends && q.ends[0]) || "Not at all") + '</span><span>' + esc((q.ends && q.ends[1]) || "Very") + '</span></div>';
        } else {
          h += '<div class="survey-opts">' + (q.options || []).map(function(o){ return '<button type="button" class="survey-opt" aria-pressed="false" data-sv="' + esc(o) + '">' + esc(o) + '</button>'; }).join("") +
            (q.other ? '<button type="button" class="survey-opt" aria-pressed="false" data-sv="Other" data-other>Other</button>' : '') + '</div>';
          // "other": true adds an Other option whose text box opens when it is picked (saved as <id>_other)
          if (q.other) h += '<textarea class="survey-other" maxlength="300" hidden aria-label="Other: type your answer" placeholder="Type your answer"></textarea>';
        }
        h += '</div>';
      });
      h += '<div class="survey-foot"><button type="button" class="survey-skip">Later</button><button type="button" class="btn btn-primary survey-send" disabled>Send</button></div>';
      /* once per person (Sam, 2026-11-20): the server counts linked devices as one (migration_v88), but two devices never
         linked are two people to it, so this one offers Link my devices. Either way round, the link brings the answer along. */
      h += '<p class="survey-why survey-linknote">Already answered it on another device? <button type="button" class="survey-link">Link this device</button> and it won’t ask again.</p>';
      W.set(h);
      W.say(re ? "Me again! There are still " + num(FORM_CROWNS) + " crowns in it for you." : "Got a minute? I pay in crowns.");
      var send = box.querySelector(".survey-send");
      function refresh(){
        box.querySelectorAll("textarea").forEach(function(t){
          var id = t.closest(".survey-q").getAttribute("data-sq"), other = t.classList.contains("survey-other");
          if (other) id += "_other";
          var v = other && t.hidden ? "" : t.value.trim();
          if (v) answers[id] = v.slice(0, other ? 300 : 600); else delete answers[id];
        });
        send.disabled = !Object.keys(answers).length;
      }
      function done(payload, thanks){
        sent = true;
        try{ localStorage.setItem("sh_survey_done_" + sv.id, "1"); }catch(e){}
        /* "Later" (null) stops the pop-up, but the survey waits in the Inbox (widget/replies.js) until it's answered */
        sendForm(sb, "submit_survey", { p_survey:sv.id, p_visitor:me, p_answers:payload }).then(function(r){
          if (window.shReplies && window.shReplies.refresh) window.shReplies.refresh();
          /* the reward arrives after the thank-you is drawn: the celebration takes its place if the window is still up */
          if (thanks && r.xp > 0 && box.isConnected) celebrate(W, r, "This goes straight into what gets built next.", "", sb);
          else rewardPaid(sb, r);
        }, function(){});
        if (!thanks){
          W.set(thanksHtml("Saved to your Inbox.", "Answer it there anytime. The " + num(FORM_XP) + " XP and " + num(FORM_CROWNS) + " crowns wait with it."));
          W.say("No rush. It'll be in your Inbox.");
          W.timer(function(){ W.close(); }, 2600);
          return;
        }
        W.set(thanksHtml("Thank you!", "This goes straight into what gets built next."));
        W.say("Thank you!");
        W.timer(function(){ W.close(); }, 5500);
      }
      box.addEventListener("input", refresh);
      /* answered from the Inbox while this window is still open */
      document.addEventListener("sh:survey-done", function(e){
        if (e.detail && e.detail.id === sv.id && box.isConnected) { sent = true; W.close(); }
      });
      box.addEventListener("click", function(e){
        var opt = e.target.closest(".survey-opt");
        if (opt){
          var q = opt.closest(".survey-q"), id = q.getAttribute("data-sq"), multi = q.getAttribute("data-kind") === "multi";
          var on = opt.getAttribute("aria-pressed") !== "true";
          if (!multi) q.querySelectorAll(".survey-opt").forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
          opt.setAttribute("aria-pressed", String(on));
          var otherBox = q.querySelector(".survey-other");
          if (otherBox){
            otherBox.hidden = !q.querySelector('.survey-opt[data-other][aria-pressed="true"]');
            if (!otherBox.hidden && opt.hasAttribute("data-other")) otherBox.focus();
          }
          var picked = Array.prototype.map.call(q.querySelectorAll('.survey-opt[aria-pressed="true"]'), function(b){ return b.getAttribute("data-sv"); });
          if (!picked.length) delete answers[id];
          else answers[id] = multi ? picked : (q.getAttribute("data-kind") === "scale" ? +picked[0] : picked[0]);
          refresh(); return;
        }
        if (sent) return;
        /* nothing is recorded: if the devices don't get linked, the pop-up is back next visit */
        if (e.target.closest(".survey-link")) { sent = true; W.close(true); openLink($("greetLink") || $("greetEdit"), "survey"); return; }
        if (e.target.closest(".survey-skip")) done(null, false);
        else if (e.target.closest(".survey-send") && !send.disabled) done(answers, true);
      });
    }
    function remote(){
      sb.rpc("get_active_survey", { p_visitor:me }).then(function(res){
        var rows = res && !res.error ? res.data : null;
        if (rows && rows.length) { show(rows); return; }
        if (Object.keys(AGAIN).length) sb.rpc("get_my_survey", { p_visitor:me }).then(function(r){ var a = again(r && !r.error ? r.data : null); if (a) show(a, true); }, function(){});
      }, function(){});
    }
    if (bootstrap && typeof bootstrap.then === "function") {
      bootstrap.then(function(data){
        if (!data || !Array.isArray(data.survey_popup)) { remote(); return; }
        if (data.survey_popup.length) show(data.survey_popup);
        else { var a = again(data.survey); if (a) show(a, true); }
      }, remote);
    } else remote();
  }

  /* ====================================================================
     DIALOGS: your name, Settings
     ==================================================================== */
  function dialog(labelId, html, back){
    var d = document.createElement("div"); d.className = "dx-dlg";
    d.innerHTML = '<div class="dx-dlgcard" role="dialog" aria-modal="true" aria-labelledby="' + labelId + '"><button class="dx-ib dx-x" type="button" aria-label="Close">' + icon("close", 20) + "</button>" + html + "</div>";
    root.appendChild(d);
    function close(){ d.remove(); document.removeEventListener("keydown", key); try{ if (back) back.focus(); }catch(e){} }
    function key(e){ if (e.key === "Escape") close(); }
    document.addEventListener("keydown", key);
    d.addEventListener("click", function(e){ if (e.target === d || e.target.closest(".dx-x")) close(); });
    setTimeout(function(){ try{ (q("input", d) || q(".dx-x", d)).focus(); }catch(e){} }, 30);
    return { el: d, close: close };
  }
  var nameSb = null;
  /* The server keeps one name for linked devices (they share an id); this device keeps a copy (sh_display_name). The
     same as a hub's (widget/v3.js): a name picked here is marked unsaved until the server answers, so a page that loads
     before it's saved sends it again; otherwise a name changed on a linked device comes in with the bootstrap and this
     device takes it (nameFromServer). */
  var NAME_UNSAVED = "sh_name_unsaved";
  function sendName(v){
    lsSet(NAME_UNSAVED, v);
    if (!nameSb) return;
    function answered(){ if (ls(NAME_UNSAVED) === v) lsSet(NAME_UNSAVED, null); }
    function old(){ nameSb.rpc("set_display_name", { p_visitor: VISITOR, p_name: v }).then(function(r){ if (r && (!r.error || (r.status >= 400 && r.status < 500))) answered(); }, function(){}); }
    /* the first name chosen pays 500 XP and crowns (set_display_name_v2, migration_v68); the old call when it isn't there */
    dashPrize(nameSb, "set_display_name_v2", { p_visitor: VISITOR, p_name: v }, "name").then(function(r){ if (!r || r.missing) old(); else answered(); });
  }
  /* the bootstrap's display_name, asked with this device's name `asked`: take it when this device has a name of its own
     that differs, unless this device's rename is still unsaved (sent again) or newer than the ask. When it is the random
     one (`custom` false, the bootstrap's name_custom, migration_v94: the linked device went back to a random name), drop
     this device's copy and show the random one. */
  function nameFromServer(server, asked, custom){
    server = String(server || "").trim().slice(0, 24);
    if (!server || !localName || localName !== (asked || "")) return;
    var unsaved = ls(NAME_UNSAVED);
    if (unsaved === localName && server !== localName) { sendName(localName); return; }
    if (unsaved !== null) lsSet(NAME_UNSAVED, null);
    if (custom === false) { localName = ""; randomName = server; lsSet("sh_display_name", null); paintName(); nameChanged(); return; }
    if (server === localName) return;
    localName = server; lsSet("sh_display_name", server); paintName(); nameChanged();
  }
  function paintName(){
    var name = localName || randomName;
    $("youName").innerHTML = (name ? "<b>" + esc(name) + "</b>" : "<b>No name yet</b>") +
      ' <button type="button" class="btn btn-text dx-rename" id="greetEdit" title="Change the name classmates see on the leaderboards">' + (localName ? "Change name" : "Pick your name") + "</button>" +
      '<button type="button" class="btn btn-text dx-rename" id="greetLink" title="Share one rank, streak and progress with your phone, tablet or laptop">Link my devices</button>';
  }
  /* Link my devices (widget/linkask.js), beside every name button (Sam, 2026-11-18: "link my device is nowhere to be
     found"). It comes with the shared widgets just after the page is drawn, so a tap before they're in waits for them. */
  function openLink(back, from){
    var t0 = Date.now();
    (function go(){
      if (window.shLinkAsk && window.shLinkAsk.link) { window.shLinkAsk.link({ back: back, from: from }); return; }
      if (Date.now() - t0 > 8000) { toast("Couldn’t open Link my devices. Are you online?", "err"); return; }
      setTimeout(go, 200);
    })();
  }
  function openNameEditor(){
    surveyVisitor();
    var dlg = dialog("nameH",
      '<h2 id="nameH">Your name</h2><p class="note">This is how classmates see you on the leaderboards, streak boards and ranks, in every hub.' +
      (!localName && randomName ? " Right now you have a random one: <b>" + esc(randomName) + "</b>." : "") + "</p>" +
      '<form class="dx-nameform"><input type="text" maxlength="24" autocomplete="nickname" enterkeyhint="done" aria-label="Your name" placeholder="Pick a name" value="' + esc(localName) + '"><button class="btn btn-primary" type="submit">Save</button></form>' +
      '<p class="note dx-namemsg" aria-live="polite"></p>' +
      (localName ? '<button class="btn btn-text dx-namereset" type="button">Go back to a random name</button>' : '<p class="note">Up to 24 characters. You can change it any time.</p>') +
      '<p class="note dx-namelink">Using the hubs on another device too? <button class="btn btn-text" type="button" data-namelink>Link my devices</button></p>', $("greetEdit"));
    var d = dlg.el, input = q("input", d), msg = q(".dx-namemsg", d);
    setTimeout(function(){ try{ input.select(); }catch(e){} }, 40);
    d.addEventListener("click", function(e){
      if (e.target.closest("[data-namelink]")) { dlg.close(); openLink($("greetLink") || $("greetEdit"), "name"); return; }
      if (!e.target.closest(".dx-namereset")) return;
      localName = ""; lsSet("sh_display_name", null); lsSet(NAME_UNSAVED, null); track("name:reset"); nameChanged();
      if (nameSb) nameSb.rpc("clear_display_name", { p_visitor: VISITOR }).then(function(r){ if (r && r.data){ randomName = r.data; paintName(); } }, function(){});
      paintName(); dlg.close();
    });
    q("form", d).addEventListener("submit", function(e){
      e.preventDefault();
      var v = input.value.trim().slice(0, 24);
      if (!v){ msg.textContent = "Type a name first."; input.focus(); return; }
      sendName(v);
      track("name:set");
      localName = v; lsSet("sh_display_name", v); paintName(); nameChanged();
      /* another, unlinked device already uses this name: ask whether it's theirs (widget/linkask.js) */
      if (window.shLinkAsk) window.shLinkAsk.check(v);
      msg.textContent = "Saved. Hi, " + v + "!";
      setTimeout(dlg.close, 700);
    });
  }
  paintName();
  $("youName").addEventListener("click", function(e){
    if (e.target.closest("#greetEdit")) openNameEditor();
    else if (e.target.closest("#greetLink")) openLink($("greetLink"), "you");
  });
  /* the name changed here: say so (the idea board shows who you post as). A name picked in the idea board's form says
     so the same way, and this page takes it. */
  var nameTold = false;
  function nameChanged(){ nameTold = true; try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: localName } })); } catch (e) {} nameTold = false; }
  document.addEventListener("sh:name", function(e){ if (nameTold) return; localName = String(e && e.detail && e.detail.name || "").slice(0, 24); paintName(); });

  /* Settings: the same keys the hubs' Settings keep (widget/hub.js and widget/v3.js: keep the three lists in step), so a
     change here shows in every hub. The font choice, background music and the accent metal are cut (plan, 4.6). */
  var EXTRAS = [
    ["sh_pref_pet", "Timmy Tooth", "Your cartoon tooth buddy: ask him about the notes. Right answers and study streaks keep him healthy. Off, an Ask button takes his place.", [["on", "Everywhere"], ["dash", "Dashboard only"], ["off", "Off"]]],
    ["sh_pref_eggs", "Hidden secrets", "Holidays, magic words and the other easter eggs. Clues are in each hub's trophy case."],
    ["sh_pref_boss", "Plaque bosses", "A boss the whole class fights with right answers when 5+ people are online."],
    ["sh_pref_fairy", "Tooth Fairy", "Flies across the page now and then. Catch her for the fairy board."],
    ["sh_pref_probe", "Golden Probe", "One question a day is golden. First to get it right wins."],
    ["sh_pref_nuke", "Tactical nukes", "100 right in a row unlocks a strike. Mine only: you won't see classmates' strikes.", [["on", "On"], ["mine", "Mine only"], ["off", "Off"]]],
    ["sh_pref_celebrate", "Rank-up and trophy cards", "The rank-up cutscene, level-up, trophy and medal cards."],
    ["sh_pref_cheers", "Streak cheers", "Confetti and a toast every 5 right in a row."],
    ["sh_pref_flame", "Streak flame", "The flame in the corner that counts your run from 3 right in a row."],
    ["sh_pref_fx", "Answer animations", "Pops, shakes, sweeps and fades. Off keeps the check and X marks."]
  ];
  function prefSet(k, v){ lsSet(k, v); try { document.dispatchEvent(new CustomEvent("sh:pref", { detail: { key: k, val: v } })); } catch (e) {} }
  function seg(key, opts, cur){ return '<span class="seg" role="group" data-key="' + esc(key) + '">' + opts.map(function(o){ return '<button type="button" data-val="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + "</button>"; }).join("") + "</span>"; }
  /* Focus mode (Sam, 2026-11-06): one switch that turns every extra off, and back to what you had. Same keys as widget/hub.js. */
  var FOCUS_KEYS = EXTRAS.map(function(x){ return x[0]; });
  function focusOn(){ return ls("sh_pref_focus") === "on"; }
  function setFocus(on){
    if (on === focusOn()) return;
    if (on) {
      var prev = {}; FOCUS_KEYS.forEach(function(k){ prev[k] = ls(k) || "on"; });
      lsSet("sh_pref_focus_prev", JSON.stringify(prev));
      FOCUS_KEYS.forEach(function(k){ prefSet(k, "off"); });
    } else {
      var back = {}; try { back = JSON.parse(ls("sh_pref_focus_prev") || "{}") || {}; } catch (e) {}
      FOCUS_KEYS.forEach(function(k){ prefSet(k, back[k] || "on"); });
      lsSet("sh_pref_focus_prev", null);
    }
    prefSet("sh_pref_focus", on ? "on" : "off");
  }
  function focusRowHTML(){
    var on = focusOn();
    return '<div class="focus-row"><span class="focus-art" aria-hidden="true">' + icon("goal", 30) + "</span><div><b>Focus mode</b><small>" +
      (on ? "On: Timmy and every extra are off. Turn it off to bring back what you had." : "Turns Timmy and every extra off in one tap: just the notes and the questions.") + "</small></div>" +
      '<button class="btn' + (on ? " btn-primary" : "") + ' focus-btn" type="button" role="switch" aria-checked="' + on + '" data-focus>' + (on ? "On" : "Off") + "</button></div>";
  }
  function openSettings(){
    var extrasHTML = function(){ return EXTRAS.map(function(x){ return '<div class="set-row"><div><b>' + esc(x[1]) + "</b><small>" + esc(x[2]) + "</small></div>" + seg(x[0], x[3] || [["on", "On"], ["off", "Off"]], ls(x[0]) || "on") + "</div>"; }).join(""); };
    var dlg = dialog("setH", '<h2 id="setH">Settings</h2><p class="note">Saved on this device and used in every hub.</p><div class="settings">' +
      '<section class="panel focus-panel' + (focusOn() ? " is-on" : "") + '" aria-label="Focus mode">' + focusRowHTML() + "</section>" +
      '<section class="panel" aria-labelledby="stH"><h3 id="stH">Look</h3>' +
        '<div class="set-row"><div><b>Theme</b><small>Every hub and the dashboard follow it.</small></div>' + seg("theme", [["light", "Light"], ["dark", "Dark"], ["", "Match my device"]], themeNow()) + "</div>" +
        '<div class="set-row"><div><b>Text size</b><small>Makes everything bigger or smaller.</small></div>' + seg("size", SIZES, ls("sh_pref_size") || "default") + "</div>" +
        '<div class="set-row"><div><b>Your name</b><small>What classmates see on the leaderboards' + (localName || randomName ? ": " + esc(localName || randomName) : "") + '.</small></div><button class="btn" type="button" data-name>Change your name</button></div>' +
        '<div class="set-row"><div><b>Link my devices</b><small>One rank, streak, trophy case and question progress on your phone, tablet and laptop.</small></div><button class="btn" type="button" data-link>Link my devices</button></div></section>' +
      '<section class="panel" aria-labelledby="sxH"><h3 id="sxH">Timmy and the extras</h3><p class="note">The fun stuff that isn\'t studying, in every hub.</p><div data-extras>' + extrasHTML() + "</div></section></div>", $("setBtn"));
    var body = dlg.el; body.classList.add("dx-dlg-wide");
    function paintFocus(){ var fp = q(".focus-panel", body); fp.classList.toggle("is-on", focusOn()); fp.innerHTML = focusRowHTML(); }
    body.addEventListener("click", function(e){
      if (e.target.closest("[data-focus]")) {
        var on = !focusOn(); setFocus(on); paintFocus(); q("[data-extras]", body).innerHTML = extrasHTML();
        track("settings:focus=" + (on ? "on" : "off")); toast(on ? "Every extra is off." : "Your extras are back.", { kind: "focus", title: on ? "Focus mode is on" : "Focus mode is off" });
        if (window.shPet) window.shPet.refresh();
        q("[data-focus]", body).focus(); return;
      }
      if (e.target.closest("[data-name]")) { dlg.close(); openNameEditor(); return; }
      if (e.target.closest("[data-link]")) { dlg.close(); openLink($("setBtn"), "settings"); return; }
      var b = e.target.closest(".seg [data-val]"); if (!b) return;
      var k = b.parentNode.getAttribute("data-key"), v = b.getAttribute("data-val");
      qa("[data-val]", b.parentNode).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
      if (k === "theme") { lsSet("sh_theme", v); applyTheme(v); paintTheme(); }
      else if (k === "size") { prefSet("sh_pref_size", v); applySize(); }
      else {
        prefSet(k, v);
        /* turning one extra back on ends focus mode; the others stay off */
        if (v !== "off" && focusOn()) { prefSet("sh_pref_focus", "off"); lsSet("sh_pref_focus_prev", null); paintFocus(); }
        if (k === "sh_pref_pet" && window.shPet) window.shPet.refresh();
      }
      track("pref:" + k.replace(/^sh_pref_/, "") + "=" + (v || "auto"));
    });
  }
  $("setBtn").addEventListener("click", openSettings);

  /* ====================================================================
     THE "YOU" CARD: your rank, mastery and streak (Timmy's house is drawn into #petHome by widget/pet.js)
     ==================================================================== */
  var myRank = null, weekBy = null, weekSource = "local";
  /* the journeys (migration_v54's _v2 profile and boards carry `journey`: 0 the Handpiece, 1 the ModuPro, 2 the
     Loupes): a rank's name, medallion and mini for whichever object it is on. The later objects' drawings
     (widget/hub-art/journeys.js) load only when someone on the page is past the Handpiece, and the page paints again. */
  function jTier(r){ return Math.max(0, Math.min(6, r.tier | 0)); }   // a row or a profile with no tier yet is Stone
  function jName(r, lv){ var R = window.shRanks; return R.nameOf && r.journey > 0 ? R.nameOf({ journey: r.journey, tier: jTier(r), level: lv }) : R.rankName(jTier(r), lv); }
  function jArt(r, px, opt){ var R = window.shRanks; return R.artOf && r.journey > 0 ? R.artOf(r.journey, jTier(r), px, opt) : R.art(jTier(r), px, opt); }
  function jMini(r, lv){ var R = window.shRanks; return R.miniOf && r.journey > 0 ? R.miniOf(r.journey, jTier(r), lv) : R.mini(jTier(r), lv); }
  var jAsked = false;
  function jNeed(rows, again){
    var R = window.shRanks;
    if (jAsked || window.SH_JOURNEY_ART || !R || !R.needJourneyArt || !rows.some(function(r){ return r && r.journey > 0; })) return;
    jAsked = true; R.needJourneyArt(function(K){ if (K) again(); });
  }
  /* flat rays behind the medallion (no gradient), turning slowly */
  function heroRays(){
    var d = "", n = 14;
    for (var i = 0; i < n; i++) { var a0 = i / n * Math.PI * 2, a1 = a0 + Math.PI / n * .9; d += "M0 0L" + (Math.cos(a0) * 120).toFixed(1) + " " + (Math.sin(a0) * 120).toFixed(1) + "L" + (Math.cos(a1) * 120).toFixed(1) + " " + (Math.sin(a1) * 120).toFixed(1) + "Z"; }
    return '<svg viewBox="-100 -100 200 200" focusable="false"><path d="' + d + '" fill="currentColor"/></svg>';
  }
  /* The road. Three journeys of seven ranks (each rank has levels I, II and III): the Handpiece from 0 XP, the ModuPro
     from 125,000 and the Loupes from 250,000. The ranks you've passed are lit, yours is marked with its level, and a
     journey you haven't reached shows what it takes. The later objects' drawings load when the road comes near the screen. */
  var roadP = null, roadSeen = false;
  function roadFloor(j, i){ var R = window.shRanks, K = window.SH_JOURNEY_ART; return j === 0 ? R.TIERS[i].at : K && K.floor ? K.floor(j, i) : 125000 * j + Math.floor(i * 3 * 125000 / 21); }
  function renderRoad(p){
    var R = window.shRanks, el = $("road"); if (!R || !el || !R.TIERS) return;
    roadP = p = p || roadP || { xp: 0, tier: 0, level: 1, journey: 0 };
    var K = window.SH_JOURNEY_ART, JN = R.JOURNEYS || ["Handpiece"], mj = Math.max(0, Math.min(JN.length - 1, p.journey | 0)), mt = jTier(p), lv = p.level || 1, xp = p.xp || 0, ROMAN = ["I", "II", "III"];
    var open = el.__open != null ? el.__open : mj;
    el.hidden = false;
    el.innerHTML = '<div class="dx-roadbox"><div class="dx-roadhead"><div><h2 id="roadH">The road</h2><p class="dx-roadsub">Seven ranks, Stone to Dark Matter, three times over: the Handpiece, then the ModuPro, then the Loupes.</p></div>' +
        '<p class="dx-roadme"><span>You are</span><b>' + esc(jName(p, lv)) + '</b><span class="num">' + num(xp) + " XP</span></p></div>" +
      '<ol class="dx-road">' + JN.map(function(name, j){
        var st = j < mj ? "is-done" : j === mj ? "is-now" : "is-lock", lo = 125000 * j, hi = 125000 * (j + 1), drawn = j === 0 || !!K;
        var fill = j < mj ? 100 : j > mj ? 0 : Math.max(0, Math.min(100, ((mt + (lv - 1) / 3 + .5) / 7) * 100));
        return '<li class="dx-jr ' + st + (open === j ? " is-open" : "") + '">' +
          '<button type="button" class="dx-jr-head" data-dash="road-journey" data-j="' + j + '" aria-expanded="' + (open === j) + '">' +
            '<span class="dx-jr-n num" aria-hidden="true">' + (j + 1) + '</span><span class="dx-jr-art" aria-hidden="true">' + (drawn ? jArt({ journey: j, tier: j < mj ? 6 : j === mj ? mt : 6 }, 64, { animate: false, level: j === mj ? lv : 3 }) : "") + "</span>" +
            '<span class="dx-jr-tx"><b>The ' + esc(name) + '</b><small class="num">' + (j < mj ? "Finished" : j === mj ? num(Math.max(0, hi - xp)) + " XP to " + (j < JN.length - 1 ? "the " + JN[j + 1] : "the end of the road") : "Starts at " + num(lo) + " XP") + "</small></span>" +
            '<span class="dx-jr-chip">' + (j < mj ? icon("check", 16) + "Done" : j === mj ? "You are here" : "Locked") + "</span>" + icon("chevron", 18, "rot") + "</button>" +
          '<div class="dx-jr-body"' + (open === j ? "" : " hidden") + '><ol class="dx-steps" style="--fill:' + fill.toFixed(1) + '%">' + R.TIERS.map(function(t, i){
            var cls = j < mj || (j === mj && i < mt) ? "is-past" : j === mj && i === mt ? "is-me" : "is-ahead";
            return '<li class="' + cls + '"><span class="dx-step-art">' + (drawn ? jArt({ journey: j, tier: i }, 56, { animate: false, level: cls === "is-me" ? lv : cls === "is-past" ? 3 : 0 }) : "") + "</span><b>" + esc(t.name) + "</b>" +
              '<span class="dx-step-xp num">' + (roadFloor(j, i) ? num(roadFloor(j, i)) + " XP" : "Start") + "</span>" +
              (cls === "is-me" ? '<span class="dx-step-lv" aria-label="Level ' + lv + ' of 3">' + ROMAN.map(function(r, n){ return "<i" + (n < lv ? ' class="on"' : "") + ">" + r + "</i>"; }).join("") + "</span>" : "") + "</li>";
          }).join("") + "</ol>" +
          '<p class="dx-jr-end">' + (j < JN.length - 1 ? "Finish Dark Matter III at " + num(hi) + " XP and you are handed the " + esc(JN[j + 1]) + ": the same seven ranks, on a new instrument."
            : "Dark Matter III on the Loupes, at " + num(hi) + " XP, is the end of the road.") + "</p></div></li>";
      }).join("") + "</ol></div>";
    if (!el.__on) {
      el.__on = true;
      el.addEventListener("click", function(e){
        var b = e.target.closest && e.target.closest('[data-dash="road-journey"]'); if (!b) return;
        var j = +b.getAttribute("data-j"); el.__open = el.__open === j || (el.__open == null && j === mj) ? -1 : j; renderRoad();
        var again = q('[data-j="' + j + '"]', el); if (again) try { again.focus({ preventScroll: true }); } catch (err) {}
      });
      /* the ModuPro's and the Loupes' drawings: fetched once, when the road is near the screen */
      var need = function(){ if (roadSeen || !R.needJourneyArt) return; roadSeen = true; R.needJourneyArt(function(k){ if (k) renderRoad(); }); };
      if (window.IntersectionObserver) { var io = new IntersectionObserver(function(es){ if (es.some(function(x){ return x.isIntersecting; })) { io.disconnect(); need(); } }, { rootMargin: "200px 0px" }); io.observe(el); } else need();
    }
  }
  function renderMyRank(p){
    var R = window.shRanks, el = $("meRank"); if (!R || !el) return;
    p = p || { xp: 0, tier: 0, level: 1, step: 0, step_at: 0, next_at: 100 };
    var t = p.tier || 0, lv = p.level || 1, step = p.step != null ? p.step : t * 3, xp = p.xp || 0;
    var at = p.step_at != null ? p.step_at : 0, next = p.next_at, pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1;
    /* the next step's name: on a v2 profile the steps run 0 to 62, 21 a journey */
    var ns = step + 1, nextName = next ? jName({ journey: Math.floor(ns / 21), tier: Math.floor(ns % 21 / 3) }, ns % 3 + 1) : "";
    jNeed([p], function(){ renderMyRank(myRank || p); });
    var medals = R.flair && R.flairFromBadges && R.flairFromBadges(p.badges) ? R.flair(R.flairFromBadges(p.badges), { list: true }) : "";
    var nxt = next ? { journey: Math.floor(ns / 21), tier: Math.floor(ns % 21 / 3) } : null;
    el.className = "dx-rankcard dx-hero" + (still() ? " is-still" : "");
    el.innerHTML = '<div class="dx-heroglow" aria-hidden="true">' + heroRays() + "</div>" +
      '<div class="dx-rankart">' + jArt(p, 96, { level: lv }) + "</div>" +
      '<div class="dx-rankbody"><p class="dx-rankeyebrow">Your rank' + (p.position ? ' <span class="dx-pos num">#' + p.position + " of " + p.of + "</span>" : "") + "</p>" +
      '<p class="dx-rankname"><b>' + esc(jName(p, lv)) + "</b></p>" +
      '<p class="dx-xp"><b class="num" data-xp="' + xp + '">' + num(xp) + "</b> XP</p></div>" +
      '<div class="dx-heroroad"><div class="dx-bar2 dx-rankbar" role="progressbar" aria-label="Progress to ' + esc(nextName || "the top") + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct * 100) + '"><i style="width:0%"></i></div>' +
        (nxt ? '<span class="dx-nextart" aria-hidden="true">' + jArt(nxt, 44, { animate: false, level: ns % 3 + 1 }) + "</span>" : "") +
      '<p class="dx-heronote">' + (!xp ? "Answer a question in any hub to start earning XP." : next ? '<b class="num">' + num(next - xp) + " XP</b> to " + esc(nextName) : "The highest rank there is.") + "</p></div>" +
      (medals ? '<div class="dx-medals"><span class="note">Mastery</span>' + medals + "</div>" : "") +
      '<div class="dx-heroact">' +
      /* the trophy case (widget/trophies.js, phase 4 session 6), in a dialog */
      (R.trophyCase ? (function(n){ return '<button type="button" class="btn dx-tro" data-dx="trophies">' + icon("trophy", 18) + 'Trophy case <span class="num">' + n.won + " of " + n.of + "</span></button>"; })(R.caseCount(p.badges)) : "") +
      '<a class="btn dx-roadlink" href="#road">The road ahead' + icon("chevron", 16) + "</a></div>";
    /* the XP counts up the first time it is seen, unless motion is off */
    if (!still() && xp && el.__xp !== xp) { var xe = q("[data-xp]", el), t0 = null; el.__xp = xp;
      (function tick(t){ if (!xe.isConnected) return; if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); xe.textContent = num(Math.round(xp * e)); if (k < 1) requestAnimationFrame(tick); })(performance.now()); }
    renderRoad(p);
    if (!el.__tro) { el.__tro = true; el.addEventListener("click", function(e){ var b = e.target.closest && e.target.closest('[data-dx="trophies"]'); if (b) openTrophies(b); }); }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ var i = q(".dx-rankbar i", el); if (i) i.style.width = (pct * 100).toFixed(1) + "%"; }); });
    var pill = $("dxRank");
    pill.innerHTML = '<span class="sr">Your rank: ' + esc(jName(p, lv)) + ", " + num(xp) + ' XP</span><span class="dx-seen" aria-hidden="true">' + jMini(p, lv) + "<b>" + esc(jName(p, lv)) + '</b><span class="num dx-fold">' + num(xp) + " XP</span></span>";
    pill.hidden = false;
  }
  /* the trophy case in a dialog: the rank, the showcase and the cabinet (widget/trophies.js and its drawings, fetched on
     the first open); Leaderboards closes it on the class's boards */
  function openTrophies(back){
    var R = window.shRanks; if (!R || !R.trophyCase) return;
    var dlg = dialog("tcH", '<h2 id="tcH">Trophy case</h2><div class="dx-tc"><p class="note">Opening the trophy case…</p></div>', back);
    dlg.el.classList.add("sht-dlg");
    var host = q(".dx-tc", dlg.el);
    R.trophyCase(function(T){
      if (!host.isConnected) return;
      if (!T) { host.innerHTML = '<p class="note">The trophy case loads when you’re online.</p>'; return; }
      T.mount(host, { profile: myRank, sb: boardSb, onBoards: function(){ dlg.close(); var c = $("class"); if (c) try { c.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { c.scrollIntoView(); } } });
    });
  }
  /* ------------------------------------------------------------
     TIMMY'S PLACE in the "you" card (widget/place.js, phase 4 part C). Everyone has Timmy, and his place takes the
     house picture's spot: widget/pet.js still draws the card (his name, HP bar, status and the three buttons) and
     isn't changed, and this puts the place over its picture. The page is at its request budget, so the renderer and
     its kit never load with it: the card shows the still place.js kept on this device (sh_place_still) and the live
     place loads on the first scroll, tap or key, or when the picture is opened. With no still yet, the house
     picture stays until the place has drawn.
  ------------------------------------------------------------ */
  var PLACE = { sb: null, boot: null, load: null, wake: false, open: false };
  function placeHost(){
    var scene = q("#petHome .shpet-scene"); if (!scene) return null;
    var host = q(".tpc-host", scene);
    if (host) return host;
    host = document.createElement("div"); host.className = "tpc-host";
    scene.insertBefore(host, scene.firstChild);
    var still = ls("sh_place_still");
    if (still && still.slice(0, 4) === "<svg") {
      host.innerHTML = '<button type="button" class="tpc" data-tp="open" aria-label="Timmy’s place. Open it"><img alt="" decoding="async" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(still) + '"></button>';
      scene.classList.add("has-place");
      placeAt(scene, String(ls("sh_place_still_at") || "").split(","));
    }
    /* a tap before the renderer is here: fetch it, then open (place.js takes the button's taps once it has drawn) */
    host.addEventListener("click", function(e){ var b = e.target.closest(".tpc"); if (!b || b.__tp) return; PLACE.open = true; placeLoad(); });
    if (window.shPlace) placeDraw(); else if (PLACE.wake) placeLoad();
    return host;
  }
  /* where the top of Timmy's head is in the picture (percent across, percent down): pet.js's bubble hangs from there */
  function placeAt(scene, at){
    var x = +(at && at[0]), y = +(at && at[1]);
    if (!(x >= 0 && x <= 100 && y >= 0 && y <= 100)) return;
    scene.style.setProperty("--tp-x", x + "%"); scene.style.setProperty("--tp-y", y + "%");
  }
  function placeDraw(){
    var host = placeHost(), P = window.shPlace; if (!host || !P) return;
    P.card(host, { label: false, onDraw: function(btn, at){
      var scene = host.parentNode; if (scene) { scene.classList.add("has-place"); placeAt(scene, at); }
      if (PLACE.open) { PLACE.open = false; P.open(); }
    } });
  }
  function placeLoad(){
    if (PLACE.load) return PLACE.load;
    PLACE.load = loadScriptOnce(WIDGET + "place.js").then(function(){
      var set = function(d){
        if (!window.shPlace) return;
        window.shPlace.setup({ sb: PLACE.sb, visitor: VISITOR || null, shop: d && d.shop, profile: myRank, tints: (window.SH_DASH_ART || {}).tints });
        placeDraw();
      };
      return PLACE.boot ? PLACE.boot.then(set, function(){ set(null); }) : set(null);
    }, function(){ PLACE.load = null; });   /* resolves either way: a visit checks window.shPlace */
    return PLACE.load;
  }
  function placeStart(sb, boot){
    PLACE.sb = sb; PLACE.boot = boot;
    var home = $("petHome"); if (!home) return;
    /* pet.js writes the card again when Timmy is turned back on, renamed or refreshed: put the place back each time */
    if (window.MutationObserver) new MutationObserver(function(){ placeHost(); }).observe(home, { childList: true });
    placeHost();
    var woke = function(){
      ["scroll", "pointerdown", "keydown", "touchstart"].forEach(function(n){ window.removeEventListener(n, woke, true); });
      PLACE.wake = true; if (q("#petHome .shpet-scene")) placeLoad();
      weekWake();
    };
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach(function(n){ window.addEventListener(n, woke, { capture: true, passive: true }); });
  }

  /* ------------------------------------------------------------
     TIMMY'S SHOP on the "you" card (widget/shop.js, phase 4 part B): your Shiny Gold Crowns and a Shop button, once the
     page's bootstrap carries a shop (the game layer, migration_v54). The balance is the server's (the bootstrap, then
     every read and purchase the shop makes: "sh:shop"); no counter ticks here. The coin is one small drawing copied
     from widget/hub-art/shop.js (coinBody(true)), and the shop itself is fetched on the button's first tap, so the
     page's requests don't change. Also here: the rare costume of the day (the same function as widget/hub-timmy.js).
  ------------------------------------------------------------ */
  var SHOP = { sb: null, shop: null };
  var SHOP_COIN = '<path d="M6.2 17.4 C4.5 14.3 3.5 10.9 4.3 8.1 C4.9 5.9 6.5 4.4 8.4 4.5 C10 4.6 10.8 6.1 12 6.1 C13.2 6.1 14 4.6 15.6 4.5 C17.5 4.4 19.1 5.9 19.7 8.1 C20.5 10.9 19.5 14.3 17.8 17.4 Z" fill="#F2C94C" stroke="#3B2E3A" stroke-width="2.1"/><path d="M15.9 5.6 C17.4 5.9 18.4 6.9 18.8 8.4 C19.4 10.9 18.6 13.9 17.3 16.4 L15.2 16.2 C16.8 12.6 17.2 9 15.9 5.6 Z" fill="#C9971C"/><path d="M12 6.6 V10" fill="none" stroke="#8A6410" stroke-width="1.5"/><ellipse cx="12" cy="17.6" rx="5.6" ry="2.5" fill="#8A6410" stroke="#3B2E3A" stroke-width="2.1"/><path d="M6.6 10.6 C6.6 8.6 7.3 7.3 8.4 6.7" stroke="#fff" stroke-width="1.9" fill="none" opacity=".85"/>';
  function ctDay(){ try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date()); } catch (e) { return ""; } }
  function drawWallet(){
    var el = $("youShop"); if (!el) return;
    var sh = SHOP.shop, bal = sh && sh.wallet ? sh.wallet.balance : null;
    if (bal == null) { el.hidden = true; return; }
    var dot = ls("sh_shop_dot") === ctDay(), had = el.contains(document.activeElement);
    el.innerHTML = '<p class="dx-coinnum"><svg viewBox="0 0 24 24" width="22" height="22" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + SHOP_COIN + '</svg><span class="dx-cointx"><b class="num">' + num(bal) + "</b><span>Shiny Gold Crowns</span></span></p>" +
      '<span class="dx-walletbtns"><button type="button" class="btn dx-collbtn" data-dash="collections">Collections</button>' +
      '<button type="button" class="btn dx-shopbtn" data-dash="shop">Timmy’s shop' + (dot ? '<i class="dx-dot dx-shopdot" aria-hidden="true"></i><span class="sr"> (a rare costume came in)</span>' : "") + "</button></span>";
    el.hidden = false;
    var btn = q(".dx-shopbtn", el); btn.addEventListener("click", openShop);
    q(".dx-collbtn", el).addEventListener("click", openCollections);
    /* a purchase redraws the row while the shop is open: the shop hands focus back to this button when it closes */
    if (had || SHOP.open) btn.focus({ preventScroll: true });
  }
  /* Collections (migration_v75): every holiday set, year-round collection and rare costume with what you have of each,
     drawn by Timmy's place (widget/place.js) over itself; closing it comes back here */
  function openCollections(){
    var back = function(){ var b = q(".dx-collbtn"); if (b) b.focus({ preventScroll: true }); };
    placeLoad().then(function(){ if (!window.shPlace) throw new Error("no place"); window.shPlace.open({ collections: true, onClose: back }); })
      .then(null, function(){ toast("Your collections didn't open. Try again in a moment.", "err"); });
  }
  /* the weekly pennants: Timmy's place opens on them (widget/place.js); closing it comes back here */
  function openPennants(){
    var back = function(){ var b = q('[data-dash="pennants"]'); if (b) b.focus({ preventScroll: true }); };
    placeLoad().then(function(){ if (!window.shPlace) throw new Error("no place"); window.shPlace.open({ pennants: true, onClose: back }); })
      .then(null, function(){ toast("Your pennants didn't open. Try again in a moment.", "err"); });
  }
  document.addEventListener("click", function(e){ var b = e.target.closest && e.target.closest('[data-dash="pennants"]'); if (b) { weekWake(); openPennants(); } });
  function openShop(){
    loadScriptOnce(WIDGET + "shop.js").then(function(){
      if (!window.shShop) throw new Error("no shop");
      window.shShop.setup({ sb: SHOP.sb, visitor: VISITOR || null, shop: SHOP.shop, profile: myRank });
      SHOP.open = true;
      window.shShop.open({ onClose: function(){ SHOP.open = false; var b = q(".dx-shopbtn"); if (b) b.focus({ preventScroll: true }); } });
    }).then(null, function(){ toast("The shop didn't open. Try again in a moment.", "err"); });
  }
  document.addEventListener("sh:shop", function(e){ var sh = e.detail && e.detail.shop; if (sh && sh.wallet) { SHOP.shop = sh; drawWallet(); visitEarn(); } });
  /* ---------- prizes (migration_v68): a reply that pays carries the balance after it, and the prize says what it paid
     (a visit, a name, trophies: widget/ranks.js sends theirs as sh:crowns and sh:prize) ---------- */
  function setCrowns(n){
    var w = SHOP.shop && SHOP.shop.wallet; if (!w || typeof n !== "number" || !isFinite(n)) return;
    if (n > w.balance) w.earned = (w.earned || 0) + (n - w.balance);
    w.balance = n; drawWallet();
  }
  var PRIZE_SAYS = { visit: "Visiting a classmate's Timmy", name: "Your leaderboard name", trophy: "New trophy" };
  function prizeLine(src, xp){ return (PRIZE_SAYS[src] || "Bonus") + ": +" + num(xp) + " XP and " + num(xp) + " crowns"; }
  document.addEventListener("sh:crowns", function(e){ var d = e.detail || {}; setCrowns(d.balance); });
  /* a prize comes up on the hubs' gold reward card (widget/prize.js, fetched the first time one pays: the page's budget
     has no room for it; 2026-11-19), over an open dialog when one is (a visit pays inside Timmy's place), a toast only
     if the card can't be fetched */
  function prizeShow(d){
    var text = d.text || prizeLine(d.src, d.xp), P = window.shPrize;
    if (!P) { loadScriptOnce(WIDGET + "prize.js").then(function(){ if (window.shPrize) prizeShow(d); else toast(text, { kind: "achv", title: "You earned" }); }, function(){ toast(text, { kind: "achv", title: "You earned" }); }); return; }
    var open = document.querySelectorAll("dialog[open]"), dlg = open.length ? open[open.length - 1] : null;
    P.show([{ t: String(text).split(": +")[0], xp: d.xp, c: d.xp, src: d.src }], {}, { star: function(){ return starSvg(26); }, coin: function(){ return coinSvg(26); },
      calm: reduced, within: dlg, top: dlg ? 0 : 56, target: function(){ var w = q(".dx-coinnum svg"), r = w && w.getBoundingClientRect(); return !dlg && r && r.width && r.bottom > 0 && r.top < innerHeight ? w : null; } });
  }
  document.addEventListener("sh:prize", function(e){ var d = e.detail || {}; if (d.xp > 0) prizeShow(d); });
  /* one prize call with the page's own client: { missing: true } when the database doesn't have it yet */
  function dashPrize(sb, fn, args, src){
    var bot = false; try { bot = !!navigator.webdriver; } catch (e) {}
    if (!sb || bot) return Promise.resolve(null);
    return sb.rpc(fn, args).then(function(res){
      var e = res && res.error;
      if (e && (e.code === "PGRST202" || e.code === "42883" || res.status === 404)) return { missing: true };
      var r = res && !e ? res.data : null;
      if (!r || typeof r !== "object" || r.ok === false) return r;
      setCrowns(r.crowns);
      if (r.xp > 0) try { document.dispatchEvent(new CustomEvent("sh:prize", { detail: { src: src, xp: r.xp, text: prizeLine(src, r.xp), res: r } })); } catch (x) {}
      if (src === "name" && SHOP.shop && SHOP.shop.wallet && SHOP.shop.wallet.got) SHOP.shop.wallet.got.name = true;
      return r;
    }, function(){ return null; });
  }
  /* visiting someone else's Timmy pays 50 XP and crowns once a day (claim_visit_v2): asked once a day per device, and the
     offer under "Visit someone random" says so until it's taken */
  function visitPays(){ var w = SHOP.shop && SHOP.shop.wallet; return w && w.pays && w.pays.visit ? w.pays.visit : 0; }
  function visitTaken(){ var w = SHOP.shop && SHOP.shop.wallet; return ls("sh_visit_paid") === ctDay() || !!(w && w.got && w.got.visit); }
  function visitEarn(){
    var el = q(".dx-vearn"), n = visitPays(); if (!el) return;
    el.hidden = !n || visitTaken();
    if (n) el.textContent = "Visit someone today: +" + num(n) + " XP and " + num(n) + " crowns";
  }
  function visitPaid(key){
    if (!VISITOR || !key || visitTaken() || !visitPays()) return;
    lsSet("sh_visit_paid", ctDay());
    dashPrize(SHOP.sb || boardSb, "claim_visit_v2", { p_visitor: VISITOR, p_key: key }, "visit").then(function(r){
      if (!r || r.missing || r.ok === false) lsSet("sh_visit_paid", null);
      visitEarn();
    });
  }
  /* the rare costume of the day: from the visitor id and the Central day, on about one day in twelve with no holiday
     (widget/pet.js's holidayId()) outside the fall weeks (September 22 to November 30). The same as hub-timmy.js's. */
  var COSTUMES = ["pirate", "astronaut", "detective", "chef", "captain-enamel", "wizard", "robot", "firefighter", "shark", "dragon"];
  function costumeOfDay(visitor, day, holiday){
    if (!visitor || !/^\d{4}-\d{2}-\d{2}$/.test(day || "") || holiday) return "";
    var x = +day.slice(5, 7) * 100 + +day.slice(8, 10); if (x >= 922 && x <= 1130) return "";
    var s = visitor + "|costume|" + day, h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = h >>> 0;
    return h % 12 === 0 ? COSTUMES[Math.floor(h / 12) % COSTUMES.length] : "";
  }
  function shopStart(sb, boot){
    SHOP.sb = sb;
    if (!sb || !VISITOR || !boot || !boot.then) return;
    boot.then(function(d){
      if (!d || !d.shop || !d.shop.wallet) return;
      SHOP.shop = d.shop; drawWallet();
      var P = window.shPet, day = ctDay(), hol = "";
      if (!P || !day) return;
      try { hol = P.holidayId ? P.holidayId() : ""; } catch (e) { return; }
      var c = costumeOfDay(VISITOR, day, hol);
      if (!c || (d.shop.costumes || []).some(function(x){ return x && x.id === c; }) || ls("sh_costume_asked") === day) return;
      lsSet("sh_costume_asked", day);
      sb.rpc("record_costume_sighting", { p_visitor: VISITOR, p_costume: c }).then(function(r){
        var a = r && !r.error && r.data;
        if (!a || !a.ok || !a.first) return;
        lsSet("sh_shop_dot", day); track("shop:spotted"); drawWallet();
        setTimeout(function(){ try { if (P.say) P.say("Something rare came in at the shop today: the " + (c === "captain-enamel" ? "Captain Enamel" : c) + " costume. It’s on the Spotted shelf.", "do-hop", 6000); } catch (e) {} }, 2500);
      }, function(){});
    }, function(){});
  }

  /* your own rank: the card, Timmy's flair and the rank-up celebration. It rides in the page bootstrap. */
  function applyMyRank(p){
    myRank = p; renderMyRank(p);
    /* the rank-up cards, and on the game layer the hand-off and the Dark Matter unlock (seen: the unlock is marked
       played on the server, once ever) */
    var bot = false; try { bot = !!navigator.webdriver; } catch (e) {}
    if (window.shRanks && window.shRanks.track) window.shRanks.track(p, { seen: function(j){ if (boardSb && VISITOR && !bot) boardSb.rpc("mark_dark_unlock_seen", { p_visitor: VISITOR, p_journey: j }).then(function(){}, function(){}); },
      /* a trophy won from now on pays 200 XP and crowns (migration_v68, widget/ranks.js asks when the profile shows a new one) */
      claim: boardSb && VISITOR && !bot ? function(fn, args){ return boardSb.rpc(fn, Object.assign({ p_visitor: VISITOR }, args)).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; }); } : null });
    else lsSet("sh_rank_tier", String(p.tier || 0));
    if (window.shRanks && window.shRanks.flairFromBadges){ lsSet("sh_rank_flair", window.shRanks.flairFromBadges(p.badges)); }
    if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(p.badges);
    try{ document.dispatchEvent(new CustomEvent("sh:rank")); }catch(e){}
    if (window.shPlace) { window.shPlace.setup({ profile: p }); window.shPlace.repaint(); }
  }
  function loadMyRank(sb){
    if (!VISITOR){ renderMyRank(null); return; }
    rpc2(sb, "get_rank_profile", { p_visitor: VISITOR }).then(function(r){ if (r && r.data) applyMyRank(r.data); else renderMyRank(null); }, function(){ renderMyRank(null); });
  }
  /* the day streak and this week's answers: the server's two weeks across every hub when it's in, else the days each
     hub saved on this device. Not studied yet today: the streak counts back from yesterday. */
  function localDays(){
    var by = {};
    HUBS.concat(ARCHIVED_HUBS).forEach(function(h){ var p = readProgress(h); if (p) p.days.forEach(function(d){ by[d] = by[d] || { a: 0, c: 0 }; }); });
    return by;
  }
  /* the weekly pennant (idea board #6, migration_v98): 50 questions from Monday to Sunday, in any hub, and Timmy gets that
     week's pennant. Where it stands is widget/pet.js's (shPet.week: his days from the bootstrap and this device), drawn with
     window.SH_PENNANT (in this page's bundle, hub-art.js); the class count and the pennants earned come from the server,
     asked once the page is first scrolled or tapped (weekWake), at most every 30 minutes. A tap opens Timmy's place. */
  var weekWoke = false;
  function pennantStat(){
    var P = window.shPet, K = window.SH_PENNANT; if (!P || !P.week || !K || focusOn()) return "";
    var w = P.week(weekWoke), got = w.done, d = K.design(w.week), n = Math.min(w.n, 999);
    var all = w.pennants.length, what = got ? "This week’s is yours: " + num(n) + " questions since Monday" :
      w.n >= w.goal ? "Your pennant is on its way" : (d ? d.name + "’s pennant" : "This week’s pennant") + ", " + Math.max(0, w.goal - w.n) + " to go by Sunday";
    return '<li class="dx-stat s-pennant' + (got ? " is-got" : "") + '"><button type="button" data-dash="pennants">' + K.svg(w.week, 46, { dim: !got }) +
      "<span>" + (got ? '<b class="num">' + num(all) + "</b> " + (all === 1 ? "pennant" : "pennants") : '<b class="num">' + num(Math.min(n, w.goal)) + "</b> of " + w.goal) + "<small>" + esc(what) + "</small>" +
      (w.cls ? '<small class="dx-pclass">' + num(w.cls) + " in the class have theirs this week</small>" : "") + "</span></button></li>";
  }
  function weekWake(){
    if (weekWoke) return; weekWoke = true;
    if (window.shPet && window.shPet.week) window.shPet.week(true);
  }
  document.addEventListener("sh:week", function(){ if ($("youStats")) renderYouStats(); });
  function renderYouStats(){
    var by = weekBy || localDays(), today = dayStart(new Date()), keys = [], a7 = 0, c7 = 0;
    for (var i = 0; i < 60; i++){ var d = new Date(today); d.setDate(d.getDate() - i); keys.push(ymd(d)); }
    var streak = 0, j = by[keys[0]] ? 0 : 1;
    while (j < keys.length && by[keys[j]]) { streak++; j++; }
    keys.slice(0, 7).forEach(function(k){ if (by[k]) { a7 += by[k].a || 0; c7 += by[k].c || 0; } });
    var pct7 = a7 ? Math.round(c7 / a7 * 100) : 0;
    var week = keys.slice(0, 7).reverse(), on7 = week.filter(function(k){ return by[k]; }).length;
    var dots = '<span class="dx-week" aria-hidden="true">' + week.map(function(k, i){
      return '<i class="' + (by[k] ? "on" : "") + (i === 6 ? " today" : "") + '">' + "SMTWTFS".charAt(parseYmd(k).getDay()) + "</i>"; }).join("") + "</span>";
    $("youStats").innerHTML =
      '<li class="dx-stat s-flame">' + flame(streak) + '<span><b class="num">' + streak + "</b> " + (streak === 1 ? "day" : "days") + "<small>" + (streak ? "Study streak" : "Answer one question to start a streak") + "</small></span>" +
        dots + '<span class="sr">You studied on ' + on7 + " of the last 7 days.</span></li>" +
      (weekSource === "server" ? '<li class="dx-stat s-week"><span><b class="num">' + num(a7) + "</b> " + (a7 === 1 ? "answer" : "answers") + "<small>This week" + (a7 ? ", " + pct7 + "% right" : "") + "</small></span>" +
        /* how many of the week's answers were right, as a ring */
        (a7 ? '<span class="dx-wring" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" class="t"/><circle cx="22" cy="22" r="18" class="v" pathLength="100" stroke-dasharray="' + pct7 + ' 100" transform="rotate(-90 22 22)"/></svg><b class="num">' + pct7 + "</b></span>" : "") + "</li>" : "") +
      pennantStat();
    var m = $("dxStreak");
    /* read out in full whatever the bar has room to show (the words fold away on a phone) */
    m.innerHTML = '<span class="sr">Your study streak: ' + streak + (streak === 1 ? " day" : " days") + '</span><span class="dx-seen" aria-hidden="true">' + flame(streak) + '<b class="num">' + streak + '</b><span class="dx-fold">' + (streak === 1 ? "day" : "days") + "</span></span>";
    m.hidden = false;
  }

  /* ====================================================================
     SUPABASE: everything below is best-effort; the page works without it
     ==================================================================== */
  function rest(path){
    return fetch(SB_URL + "/rest/v1/" + path, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } }).then(function(r){ return r.ok ? r.json() : null; });
  }
  /* a survey or a check-in (migration_v60): the _v2 call answers { ok, xp, crowns } with the reward it paid (1,000 XP since migration_v61, and 1,000
     crowns, once per survey and per hub's exam check-in). Resolves { ok, xp, crowns }. (The fallbacks to the calls from
     before the game layer, migration_v54, came out with the old single-file hub pages, 2026-11-19.) */
  function sendForm(sb, name, args){
    return sb.rpc(name + "_v2", args).then(function(r){
      var d = !r.error && r.data && typeof r.data === "object" ? r.data : null;
      return { ok: !!(d && d.ok), xp: d && d.xp | 0, crowns: d && d.crowns | 0, closed: !!(d && d.closed) };
    });
  }
  /* a reward was paid (the window celebrates it: celebrate): the "you" card's XP and crowns read again from the server */
  function rewardPaid(sb, r){
    if (!r || !(r.xp > 0) || !sb || !VISITOR) return;
    loadMyRank(sb);
    sb.rpc("get_my_shop", { p_visitor: VISITOR }).then(function(x){
      if (x && !x.error && x.data && x.data.wallet) try { document.dispatchEvent(new CustomEvent("sh:shop", { detail: { shop: x.data } })); } catch (e) {}
    }, function(){});
  }
  /* a survey answered in the Inbox (widget/replies.js) paid a reward: read the card's XP and crowns again */
  document.addEventListener("sh:reward", function(e){ rewardPaid(debriefSb || boardSb, e.detail); });
  /* the game layer's call (<name>_v2, migration_v54) */
  function rpc2(sb, name, args){ return sb.rpc(name + "_v2", args); }
  function dashboardBootstrap(sb){
    var boot = { data: null, ready: Promise.resolve(null), linkName: localName || "" };
    if (!sb || !VISITOR) { window.shBootstrap = boot; return boot; }
    try {
      boot.ready = rpc2(sb, "get_widget_bootstrap", {
        p_visitor: VISITOR, p_hub: null, p_cavity_week: null, p_episode: null, p_include_pins: false, p_dashboard: true,
        p_luck_hub: luckFor ? luckFor.hub : null, p_luck_date: luckFor ? luckFor.date : null, p_link_name: boot.linkName || null
      }).then(function(r){
        if (!r || r.error || !r.data || typeof r.data !== "object") return null;
        boot.data = r.data;
        /* first, so Timmy's hello and the "you" card already have a name changed on a linked device */
        try { nameFromServer(r.data.display_name, boot.linkName, r.data.name_custom); } catch (e) {}
        return boot.data;
      }, function(){ return null; });
    } catch (e) {}
    window.shBootstrap = boot;
    return boot;
  }
  /* a panel's data loads when the panel is first on screen (or focused), not with the page */
  function whenPanelOpens(panel, work){
    if (!panel || typeof work !== "function") return;
    var done = false, observer = null;
    function open(){ if (done) return; done = true; if (observer) observer.disconnect(); panel.removeEventListener("focusin", open); panel.removeEventListener("pointerdown", open); work(); }
    if (window.IntersectionObserver) {
      observer = new IntersectionObserver(function(entries){ if (entries.some(function(x){ return x.isIntersecting; })) open(); }, { rootMargin: "80px 0px" });
      observer.observe(panel);
    } else open();
    panel.addEventListener("focusin", open); panel.addEventListener("pointerdown", open);
  }

  /* ---------- the class board: ranks or study streaks (one at a time), the top three on a podium ---------- */
  var boardSb = null, boardNow = "ranks", boardOpen = false;
  var BOARD_NOTE = {
    ranks: "XP from every hub: 10 for a new question right, 2 for a repeat, 1 for trying, 20 per day studied. Every rank has levels I, II and III.",
    streaks: "Days in a row with at least one answer."
  };
  function rankMini(r){ return window.shRanks && r.tier != null ? jMini(r, r.level) : ""; }
  /* a row's name with its mastery medals (`flair`). On a row with a visit key the name is the button that visits that
     person's place (visiting, below): one fixed name for the click count (data-dash="visit"), never the person's, and
     the button stretches over the whole row in CSS, so the row's place, rank and number still read as text */
  function nameFlair(r, extra){
    var f = window.shRanks && window.shRanks.flair ? window.shRanks.flair(r.flair, { who: r.display_name }) : "", t = esc(r.display_name) + (extra || "");
    if (!visitKey(r)) return '<span class="nm-t">' + t + "</span>" + f;
    return '<button type="button" class="nm-t dx-visit" data-dash="visit" aria-label="' + (r.is_me ? t + ": open your place" : esc("Visit " + r.display_name + "’s place")) + '">' + t + "</button>" + f;
  }
  function visitAttr(r){ var k = visitKey(r); return k ? ' data-visit="' + k + '"' : ""; }
  /* a row carries its visit key (the _v2 boards, migration_v54) as data-visit: a tap opens that person's Timmy's place.
     pct: its bar against first place (0 to 1) */
  function rowHTML(r, place, mid, val, unit, pct){
    return "<li" + (r.is_me ? ' class="me"' : "") + visitAttr(r) + '><span class="rk num">' + place + '</span><span class="nm">' + rankMini(r) + nameFlair(r, r.is_me ? " (you)" : "") + "</span>" +
      '<span class="lvl">' + esc(mid || "") + '</span><span class="dx-vs" aria-hidden="true"><i style="width:' + Math.max(2, Math.min(100, Math.round((pct || 0) * 100))) + '%"></i></span>' +
      '<span class="val num">' + val + "<small>" + unit + "</small></span></li>";
  }
  /* the top three: their names and numbers under the stage (first in the middle, by CSS order), everyone after them in the list */
  function podiumHTML(rows, art, val, mid){
    return '<ol class="dx-podium">' + rows.slice(0, 3).map(function(r, i){
      return '<li class="p' + (i + 1) + (r.is_me ? " me" : "") + '"' + visitAttr(r) + '><span class="dx-step"><span class="sr">Place </span><b class="num">' + (i + 1) + '</b></span><span class="dx-win-who">' + art(r) + "</span>" +
        '<span class="dx-win-txt"><span class="nm">' + nameFlair(r, r.is_me ? " (you)" : "") + '</span><span class="dx-win-sub">' + (mid ? '<span class="mid">' + esc(mid(r)) + "</span>" : "") + '<span class="val num">' + val(r) + "</span></span></span></li>";
    }).join("") + "</ol>";
  }
  /* the stage (widget/hub-art/class.js, tools/figures/site/stage.mjs): curtains, lights, the three blocks, and each
     winner's Timmy on top in what theirs is wearing (fits: the top three's outfits, "" for a plain Timmy). The drawing is
     hidden from screen readers; a tap on a winner's Timmy is a tap on their name's button under the stage (visiting) */
  function stageSvg(w, rows, fits){
    var S = CA.stage, h = w < 480 ? 262 : 300, fl = h - 44, cx = w / 2, k = w < 480 ? .74 : 1, pw = Math.min(150, w * .3), gap = Math.min(170, w * .31);
    var s = S.stage({ w: w, h: h }), fla = (A.flame || {})[5] || (A.flame || {})[3] || "";
    if (w > 560) [-1, 1].forEach(function(d){ s += S.G(cx + d * (gap + pw / 2 + 44), fl + 8, 1, S.torch(74) + '<svg x="-20" y="-108" width="40" height="48" viewBox="0 0 40 48" overflow="visible">' + fla + "</svg>"); });
    [{ p: 2, x: cx - gap, h: 74 * k, tw: 68 * k }, { p: 1, x: cx, h: 108 * k, tw: 82 * k }, { p: 3, x: cx + gap, h: 54 * k, tw: 64 * k }].forEach(function(b){
      var th = b.tw * 1.31, top = fl + 10 - b.h;
      s += S.G(b.x, fl + 10, 1, S.pedestal(b.p, pw, b.h));
      if (window.shPet && window.shPet.art && rows[b.p - 1]) s += '<g class="st-win st-win' + b.p + (visitKey(rows[b.p - 1]) ? " can-visit" : "") + '" data-p="' + b.p + '"><svg x="' + (b.x - b.tw / 2).toFixed(1) + '" y="' + (top - th * (256 / 262) + 2).toFixed(1) + '" width="' + b.tw.toFixed(1) + '" height="' + th.toFixed(1) +
        '" viewBox="0 -30 200 262" overflow="visible">' + timmyArt(fits[b.p - 1] || "", "happy") + "</svg></g>";
      if (b.p === 1) s += '<g class="st-crown">' + S.G(b.x, top - th - 6, .78 * k, S.crown()) + "</g>" + S.spark(b.x - 62 * k, top - 52, 7) + S.spark(b.x + 66 * k, top - 76, 9) + S.spark(b.x + 52 * k, top - 12, 5, "#fff");
    });
    s += '<g class="st-confetti">' + S.confetti({ w: w, h: h }) + "</g>";
    return '<svg class="dx-set" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true" focusable="false">' + s + "</svg>";
  }
  function boardMsg(msg){ boardData = null; $("visitRand").hidden = true; $("board").innerHTML = '<p class="note">' + esc(msg || "Couldn't reach the class data just now. Reload to try again.") + "</p>"; }
  var boardData = null;      /* the board as last loaded: { which, rows, fits } (painted again when the page's width changes) */
  function paintBoard(){
    var d = boardData, R = window.shRanks; if (!d || d.which !== boardNow) return;
    var rows = d.rows, ranks = d.which === "ranks", pod = rows.length >= 3, rest = pod ? rows.slice(3) : rows, w = Math.round($("board").clientWidth);
    var first = Math.max(1, ranks ? +rows[0].xp || 0 : +rows[0].streak || 0);
    var set = pod && CA && CA.stage && w >= 240 ? stageSvg(w, rows, d.fits || []) : "";
    $("board").innerHTML = '<div class="dx-arena' + (set ? " has-set" : "") + (still() ? " is-still" : "") + '" data-w="' + w + '">' + set +
      (pod ? (ranks ? podiumHTML(rows, function(r){ return jArt(r, 72, { animate: false, level: r.level || R.levelFor(r.xp) }); }, function(r){ return num(r.xp) + "<small>XP</small>"; }, function(r){ return jName(r, r.level || R.levelFor(r.xp)); })
        : podiumHTML(rows, function(r){ return flame(r.streak); }, function(r){ return r.streak + "<small>" + (r.streak === 1 ? "day" : "days") + "</small>"; })) : "") +
      (rest.length ? '<ol class="dx-board"' + (pod ? ' start="4"' : "") + ">" + rest.map(function(r, i){
        return ranks ? rowHTML(r, r.rnk, jName(r, r.level || R.levelFor(r.xp)), num(r.xp), "XP", (+r.xp || 0) / first)
          : rowHTML(r, i + (pod ? 4 : 1), "", r.streak, r.streak === 1 ? "day" : "days", (+r.streak || 0) / first);
      }).join("") + "</ol>" : "") + "</div>";
    lifeStage();
    if (d.say) visitSay(d.say.key, d.say.msg, true);
    $("visitRand").hidden = !visitList().length; visitEarn();
  }
  /* what the top three's Timmys wear: each one's place says (get_place, migration_v54), through the visit key on their
     row. A place that can't be read gives a plain Timmy. The answer is kept
     for a visit (getPlace), so a tap on one of the top three doesn't ask again. */
  function loadFits(sb, d){
    if (!sb) return;
    d.rows.slice(0, 3).forEach(function(r, i){
      var k = visitKey(r); if (!k) return;
      getPlace(sb, k).then(function(p){
        var f = cleanFit(p && p.equipped.outfit);
        if (f && boardData === d) { d.fits[i] = f; paintBoard(); }
      }, function(){});
    });
  }

  /* ---------- VISITING (phase 4, session 4; vault/tasks/2026-11-12-redesign-visiting.md). A row on the boards, or one of
     the stage's top three, opens that person's Timmy's place. The row's visit key (data-visit: 24 hex characters on every
     _v2 board row, a digest only the server can make) asks get_place for what a place shows: the leaderboard name, what
     stands in each slot, the rank (journey, tier, level) and the medals, never an id, XP, HP or a date. widget/place.js
     draws it as a visit (shPlace.open({ place })): the name in the title, Timmy drawn well, no HP and no Customize, in
     the leaderboard's theater look. Your own row ("<name> (you): open your place", its visible text first) opens your
     own place, as the card does. Without the game layer a row has no key and isn't a button. A key that opens nothing
     (null) or a call that fails puts one plain line on the row and changes nothing else. ---------- */
  var VISIT_RE = /^[0-9a-f]{24}$/, PLACES = {}, visiting = "", TOP = null;
  function visitKey(r){ return r && typeof r.visit === "string" && VISIT_RE.test(r.visit) ? r.visit : ""; }
  /* the top ten's number badge (Sam, 2026-11-13: "the people in the top ten should also get a special number badge next to
     their name when you visit them"): a visit key's place on the Ranks board, 1 to 10, from that board's rows (TOP, kept
     whenever it's drawn, or asked for once when a visit starts from the other board). widget/place.js draws it */
  function topFrom(rows){ var t = {}; (rows || []).forEach(function(r){ var k = visitKey(r), n = Math.floor(+r.rnk || 0); if (k && n >= 1 && n <= 10) t[k] = n; }); return t; }
  function topTen(){
    if (TOP) return Promise.resolve(TOP);
    return rpc2(boardSb, "get_rank_board", { p_visitor: VISITOR || null, p_limit: 10 }).then(function(res){
      if (res && !res.error && Array.isArray(res.data)) TOP = topFrom(res.data);
      return TOP || {};
    }, function(){ return {}; });
  }
  function withTop(p, key, top){ if (!p) return p; var c = {}; Object.keys(p).forEach(function(k){ c[k] = p[k]; }); c.top = top[key] || 0; return c; }
  function placeTop(key){ return Promise.all([getPlace(boardSb, key), topTen()]).then(function(a){ return withTop(a[0], key, a[1]); }); }
  /* someone's place, asked once a page (the stage's outfits and a visit share the answer); a call that fails isn't kept.
     Only what a place shows goes on: the slots as strings, the rank as numbers, the name and medals as text */
  function placeOf(d){
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    var eq = {}, e = d.equipped && typeof d.equipped === "object" ? d.equipped : {}, rk = d.rank && typeof d.rank === "object" ? d.rank : null;
    Object.keys(e).forEach(function(k){ if (typeof e[k] === "string" && /^[a-z0-9-]{1,40}$/.test(k)) eq[k] = e[k]; });
    return { name: String(d.name == null ? "" : d.name), equipped: eq, flair: typeof d.flair === "string" ? d.flair : "",
      rank: rk ? { journey: +rk.journey || 0, tier: +rk.tier || 0, level: +rk.level || 1 } : null };
  }
  function getPlace(sb, key){
    if (PLACES[key]) return PLACES[key];
    var p = PLACES[key] = sb.rpc("get_place", { p_key: key }).then(function(res){
      if (!res || res.error) throw new Error("get_place");
      return placeOf(res.data);
    });
    p.then(null, function(){ if (PLACES[key] === p) delete PLACES[key]; });
    return p;
  }
  /* the plain line on a row whose place couldn't be opened (kept with the board, so a repaint puts it back) */
  function visitSay(key, msg, again){
    qa(".dx-vmsg", $("board")).forEach(function(n){ n.parentNode.classList.remove("has-vmsg"); n.parentNode.removeChild(n); });
    if (boardData) boardData.say = msg ? { key: key, msg: msg } : null;
    var li = msg && VISIT_RE.test(key) ? q('[data-visit="' + key + '"]', $("board")) : null; if (!li) return;
    var line = document.createElement("span"); line.className = "dx-vmsg"; line.setAttribute("role", "status");
    li.appendChild(line); li.classList.add("has-vmsg");
    if (again) line.textContent = msg; else setTimeout(function(){ line.textContent = msg; }, 60);   /* filled after it's on the page, so it's read out */
  }
  function visitBusy(key, on){
    var li = q('[data-visit="' + key + '"]', $("board")), b = li && q(".dx-visit", li);
    if (li) li.classList.toggle("is-busy", on);
    if (b) { if (on) b.setAttribute("aria-busy", "true"); else b.removeAttribute("aria-busy"); }
  }
  /* closing the place gives focus back to the row (the board may have been drawn again while the place was open) */
  function visitBack(key){
    var b = q('[data-visit="' + key + '"] .dx-visit', $("board"));
    if (b && document.activeElement !== b) try { b.focus(); } catch (e) {}
  }
  /* the tour (Sam, 2026-11-13: "build the random visit and next/back", round 3's design page): a visit carries the board it
     came from, so the place's arrows go to the next or the last person on it and "Back to mine" goes home. Only names and
     ranks go to the place; the keys stay here, and load(i) asks get_place for the i-th. */
  function visitList(){ return (boardData && boardData.rows || []).filter(function(r){ return visitKey(r) && !r.is_me; }); }
  function visitNav(key){
    var rows = visitList(), keys = rows.map(visitKey), at = keys.indexOf(key), R = window.shRanks;
    if (at < 0) return null;
    return { at: at, keys: keys,
      list: rows.map(function(r){ return { name: String(r.display_name == null ? "" : r.display_name), rank: { journey: +r.journey || 0, tier: +r.tier || 0, level: +r.level || (R && R.levelFor ? R.levelFor(r.xp) : 1) } }; }),
      load: function(i){ return keys[i] ? placeTop(keys[i]) : Promise.reject(new Error("key")); } };
  }
  function visit(key, me, from){
    if (!VISIT_RE.test(key) || visiting || !boardSb) return;
    visiting = key; visitSay(key, ""); visitBusy(key, true);
    var done = function(){ visiting = ""; visitBusy(key, false); };
    var fail = function(){ done(); visitSay(key, "That place couldn’t be opened just now."); };
    var nav = me ? null : visitNav(key);
    /* closing gives focus back: to the random button for a random visit, else to the row of the last place (or your own row, home) */
    var back = function(where){
      var mine = where === "home" && q("li.me .dx-visit", $("board")), rb = from === "random" && q("button", $("visitRand"));
      if (rb && !rb.closest("[hidden]")) { try { rb.focus(); } catch (e) {} return; }
      if (mine) { try { mine.focus(); } catch (e) {} return; }
      visitBack(nav && typeof where === "number" && nav.keys[where] ? nav.keys[where] : key);
    };
    if (me) {
      placeLoad().then(function(){ done(); if (window.shPlace) window.shPlace.open({ onClose: back }); else fail(); }, fail);
      return;
    }
    Promise.all([placeTop(key), placeLoad()]).then(function(a){
      if (!a[0] || !window.shPlace) { fail(); return; }
      done(); window.shPlace.open({ place: a[0], onClose: back, nav: nav ? { at: nav.at, list: nav.list, load: nav.load } : null });
      visitPaid(key);
    }, fail);
  }
  /* "Visit someone random" (Sam, 2026-11-13: "i want random to be for the whole class", then "skip people with zero
     customization"): migration_v57's get_random_place picks on the server from everyone whose place has at least one
     thing chosen, never you or your linked device, and gives their place with its key (never an id). The trip keeps the
     keys it has shown and sends them back (p_skip), so the class comes round once before anyone twice; the place's
     Previous goes back through the trip and Next past the last asks again (nav.more). Nobody customized yet (null): one
     plain line under the button. Without the function (before the release) or when it fails, one of the board's rows
     whose place has something chosen, as a board tour. */
  function getRandom(skip){
    return boardSb.rpc("get_random_place", { p_visitor: VISITOR || null, p_skip: skip.slice(-100) }).then(function(res){
      if (!res || res.error) throw new Error("get_random_place");
      var d = res.data, k = d && typeof d.visit === "string" && VISIT_RE.test(d.visit) ? d.visit : "", p = k && placeOf(d);
      if (!p) return null;
      PLACES[k] = Promise.resolve(p);
      return { key: k, place: p };
    });
  }
  function customized(p){ return !!(p && p.equipped && Object.keys(p.equipped).length); }
  function randSay(msg){ var m = q(".dx-rmsg", $("visitRand")); if (m) { m.textContent = ""; if (msg) setTimeout(function(){ m.textContent = msg; }, 60); } }
  function visitRandom(){
    var rb = q("button", $("visitRand"));
    if (visiting || !boardSb || !rb) return;
    var none = function(){ randSay("No one else has decorated their place yet. Check back soon."); };
    /* the board's rows from a random one on, asking get_place in turn until a place has something chosen */
    var fromBoard = function(){
      var rows = visitList(), n = rows.length, at = Math.floor(Math.random() * n), i = 0;
      var next = function(){
        if (i >= n) { none(); return; }
        var k = visitKey(rows[(at + i++) % n]);
        getPlace(boardSb, k).then(function(p){ if (customized(p)) visit(k, false, "random"); else next(); }, next);
      };
      next();
    };
    randSay(""); visiting = "random"; rb.setAttribute("aria-busy", "true");
    var done = function(){ visiting = ""; rb.removeAttribute("aria-busy"); };
    var keys = [], list = [], add = function(r){ keys.push(r.key); list.push({ name: r.place.name, rank: r.place.rank }); return keys.length - 1; };
    var back = function(){ if (!rb.closest("[hidden]")) try { rb.focus(); } catch (e) {} };
    Promise.all([getRandom([]), placeLoad(), topTen()]).then(function(a){
      done();
      if (!a[0]) { none(); return; }
      if (!window.shPlace) { fromBoard(); return; }
      add(a[0]); visitPaid(a[0].key);
      window.shPlace.open({ place: withTop(a[0].place, a[0].key, a[2]), onClose: back, nav: { at: 0, list: list,
        load: function(i){ return keys[i] ? placeTop(keys[i]) : Promise.reject(new Error("key")); },
        more: function(){ return getRandom(keys).then(function(r){ if (!r) throw new Error("none"); return add(r); }); } } });
    }, function(){ done(); fromBoard(); });
  }
  $("visitRand").addEventListener("click", function(e){ if (e.target.closest("button")) visitRandom(); });
  $("board").addEventListener("click", function(e){
    var b = e.target.closest(".dx-visit"), w = !b && e.target.closest(".st-win.can-visit");
    /* a winner's Timmy on the stage is their name's button under it */
    if (w) { var nb = q(".dx-podium .p" + w.getAttribute("data-p") + " .dx-visit", $("board")); if (nb) nb.click(); return; }
    var li = b && b.closest("[data-visit]"); if (!li) return;
    visit(li.getAttribute("data-visit"), li.classList.contains("me"));
  });
  function drawBoard(){
    var sb = boardSb, which = boardNow;
    $("boardNote").textContent = BOARD_NOTE[which]; $("boardNote").hidden = !BOARD_NOTE[which];
    if (!sb) { boardMsg(); return; }
    if (!boardData || boardData.which !== which) $("board").innerHTML = '<p class="note">Loading…</p>';
    if (which === "ranks") {
      rpc2(sb, "get_rank_board", { p_visitor: VISITOR || null, p_limit: 10 }).then(function(res){
        if (boardNow !== which) return;
        if (!res || res.error) { boardMsg(); return; }   /* not reached is not the same as nobody ranked */
        var rows = res.data || [], R = window.shRanks;
        if (!rows.length || !R){ boardMsg("No ranks yet. Answer a question in any hub to get your first handpiece."); return; }
        boardData = { which: which, rows: rows, fits: [] }; TOP = topFrom(rows); paintBoard(); loadFits(sb, boardData);
        var me = rows.filter(function(r){ return r.is_me; })[0];
        jNeed(rows, function(){ if (boardData && boardData.rows === rows) paintBoard(); });
      }, function(){ if (boardNow === which) boardMsg(); });
    } else if (which === "streaks") {
      rpc2(sb, "get_leaderboard", { p_limit: 8 }).then(function(res){
        if (boardNow !== which) return;
        if (!res || res.error) { boardMsg(); return; }
        var rows = res.data || [];
        if (!rows.length){ boardMsg("No streaks yet. Answer questions two days in a row to start one."); return; }
        boardData = { which: which, rows: rows, fits: [] }; paintBoard(); loadFits(sb, boardData);
        jNeed(rows, function(){ if (boardData && boardData.rows === rows) paintBoard(); });
      }, function(){ if (boardNow === which) boardMsg(); });
    }
  }
  $("boardSeg").addEventListener("click", function(e){
    var b = e.target.closest("[data-board]"); if (!b || b.getAttribute("data-board") === boardNow) return;
    boardNow = b.getAttribute("data-board"); track("dash:board=" + boardNow);
    qa("[data-board]", $("boardSeg")).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
    boardOpen = true; drawBoard();
  });

  /* ---------- hub recaps: how the class studied for each finished exam (published from the admin page), as a live
     infographic: one hub at a time, its numbers counting up and its hours-per-day chart drawing itself when it comes
     into view. "Save image" draws the shareable picture with widget/recap.js, loaded only then. Totals only: no names. ---------- */
  function loadRecaps(sb, bootstrap){
    function show(rows){ rows = Array.isArray(rows) ? rows.filter(function(r){ return r && r.data; }) : []; if (rows.length) startRecaps(rows); }
    function remote(){ sb.rpc("get_published_recaps").then(function(res){ show(res && !res.error ? res.data : null); }, function(){}); }
    bootstrap.then(function(data){ if (data && Array.isArray(data.recaps)) show(data.recaps); else remote(); }, remote);
  }
  function recapDay(s, long){ return parseYmd(String(s).slice(0, 10)).toLocaleDateString(undefined, long ? { weekday: "long", month: "long", day: "numeric" } : { month: "short", day: "numeric" }); }
  /* every day from the first to the exam (or the last day studied), with its minutes */
  function recapDays(d){
    var by = {}, out = [], end = String(d.exam_day || d.last_day || "").slice(0, 10), cur = parseYmd(String(d.first_day || end).slice(0, 10)), guard = 0;
    (d.by_day || []).forEach(function(r){ by[String(r.d).slice(0, 10)] = +r.minutes || 0; });
    if (!end) return out;
    while (ymd(cur) <= end && guard++ < 60) { out.push({ d: ymd(cur), m: by[ymd(cur)] || 0 }); cur.setDate(cur.getDate() + 1); }
    return out;
  }
  function saveRecap(row, btn){
    btn.disabled = true;
    /* the image is set in the site's own typeface, the one self-hosted file every page here already has (the live
       dashboard's image fetches Fraunces and Work Sans from Google Fonts): its weights are made ready before drawing */
    var FACE = "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
    var fonts = function(){ return document.fonts ? Promise.race([
      Promise.all(["500 20px 'Nunito Sans'", "600 40px 'Nunito Sans'", "700 20px 'Nunito Sans'"].map(function(f){ return document.fonts.load(f); })),
      new Promise(function(r){ setTimeout(r, 2500); })]).catch(function(){}) : Promise.resolve(); };
    loadScriptOnce(WIDGET + "recap.js").then(fonts).then(function(){
      var c = document.createElement("canvas");
      window.shRecap.draw(c, row.data, { title: row.title, color: row.color, names: row.names, question: row.question, footnote: row.footnote, font: FACE });
      var a = document.createElement("a"); a.href = c.toDataURL("image/png");
      a.download = row.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + "-recap.png";
      document.body.appendChild(a); a.click(); a.remove(); track("recap:save");
    }).then(function(){ btn.disabled = false; }, function(){ btn.disabled = false; toast("The image didn't load. Try again in a moment.", "err"); });
  }
  /* the recap's drawings (widget/hub-art/class.js: tools/figures/site/recap.mjs and six trophy drawings): hours per day
     as drawn columns with the exam day's flag and Timmy climbing them, and the classmates as a crowd of teeth. Drawn at
     the card's own width, and again when it changes. Without the art the card is its numbers and words. */
  var rcRow = null;
  function rcIcon(k){
    /* inline, not an image: the drawings have no ids, and six more images were six more requests */
    var b = k === "flame" ? (A.flame || {})[3] : CA && CA.recapIcons && CA.recapIcons[k];
    return b ? '<svg class="rc-ic" viewBox="' + (k === "flame" ? "0 0 40 48" : "0 0 64 64") + '" aria-hidden="true" focusable="false">' + b + "</svg>" : "";
  }
  function recapClimber(){
    var P = window.shPet; if (!P || !P.art || focusOn() || ls("sh_pref_pet") === "off") return "";
    var svg = String(P.art({ hp: 100, mood: "happy", hat: "" }, 200)), o = CA.recapHat;
    if (o && o.back) svg = svg.replace(/(<ellipse cx="100" cy="226"[^>]*\/>)/, "$1" + '<g class="shpet-back">' + o.back + "</g>");
    if (o) svg = svg.replace(/<\/g><\/svg>\s*$/, (o.face ? '<g class="shpet-garb">' + o.face + "</g>" : "") + (o.top ? '<g class="shpet-hat">' + o.top + "</g>" : "") + "</g></svg>");
    return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  }
  function recapArt(again){
    var row = rcRow, body = $("rcBody"); if (!row || !body || !CA || !CA.recap) return;
    var d = row.data, days = recapDays(d), plot = $("rcPlot"), crowd = $("rcCrowd"), t = tintOf(row.hub);
    body.classList.toggle("is-redraw", !!again);
    if (plot && days.length) {
      var w = Math.round(plot.clientWidth), h = w < 360 ? 132 : 150;
      if (w >= 120) {
        var ex = d.exam_day ? days.map(function(x){ return x.d; }).indexOf(String(d.exam_day).slice(0, 10)) : -1, pk = 0, ci = -1;
        days.forEach(function(x, k){ if (x.m > days[pk].m) pk = k; });
        var b = CA.recap.bars({ w: w, h: h, days: days.map(function(x){ return x.m / 60; }), tint: t, exam: ex }), far = (w - 20) / days.length < 34 ? 3 : 2;
        /* Timmy stands on the tallest column that is clear of the peak's label and the flag */
        days.forEach(function(x, k){ if (!x.m || k === ex || Math.abs(k - pk) < far) return; if (ci < 0 || x.m > days[ci].m) ci = k; });
        var tw = Math.min(30, b.bw + 6), tim = ci >= 0 && b.bw >= 12 ? recapClimber() : "", top = b.tops[pk];
        var left = Math.max(0, Math.min(w - 46, pk === ex ? top[0] - 46 : top[0] - 21));
        plot.innerHTML = '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" overflow="visible" aria-hidden="true" focusable="false">' + b.svg +
          (tim ? '<svg class="rk-tim" x="' + (b.tops[ci][0] - tw / 2).toFixed(1) + '" y="' + (b.tops[ci][1] - tw * 1.31 * (256 / 262) + 1).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="' + (tw * 1.31).toFixed(1) + '" viewBox="0 -30 200 262" overflow="visible">' + tim + "</svg>" : "") + "</svg>" +
          (days[pk].m ? '<span class="rc-peak num" style="left:' + Math.round(left) + "px;top:" + Math.round(Math.max(0, top[1] - 25)) + 'px">' + num(Math.round(days[pk].m / 60)) + " h</span>" : "");
      }
    }
    if (crowd && +d.people > 0) {
      var cw = Math.round(crowd.clientWidth);
      if (cw >= 100) { var c = CA.recap.crowd({ n: Math.min(+d.people, 160), w: cw, tint: t, size: 1.15 }); crowd.innerHTML = '<svg viewBox="0 0 ' + cw + " " + c.h + '" width="' + cw + '" height="' + c.h + '" focusable="false">' + c.svg + "</svg>"; }
    }
  }
  function startRecaps(rows){
    var chips = $("rcChips"), body = $("rcBody"), wrap = $("rc"), cur = -1, seen = false, playT = 0;
    chips.innerHTML = rows.map(function(r, i){
      return '<button type="button" role="tab" class="rc-chip tinted" style="' + tintVars(r.hub) + '" id="rc-tab-' + i + '" data-rc="' + i + '" aria-selected="false" aria-controls="rcBody" tabindex="-1">' +
        emblem(r.hub, "dx-emb") + "<span><b>" + esc(r.title) + "</b>" + (r.data.exam_day ? "<small>" + esc(recapDay(r.data.exam_day)) + "</small>" : "") + "</span></button>";
    }).join("");
    chips.hidden = rows.length < 2;
    /* numbers count up and bars grow; with reduced motion they are simply there */
    function play(){
      var still = reduced();
      qa("[data-count]", body).forEach(function(el){
        var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "";
        if (still || !to) { el.textContent = num(to) + suf; return; }
        var t0 = null, ms = 900;
        (function step(t){ if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = num(Math.round(to * e)) + suf; if (k < 1) requestAnimationFrame(step); })(performance.now());
      });
      body.classList.add("is-in");
      /* once the bars have grown they stay still (Sam, 2026-11-17: "shouldnt reset every time you scroll"): the page rests
         its pictures while it scrolls (.is-rest takes their animations away), which started the bars over from zero.
         .is-played leaves them drawn until another hub's recap is shown. */
      clearTimeout(playT); playT = setTimeout(function(){ body.classList.add("is-played"); }, 1600);
    }
    function show(i){
      i = (i + rows.length) % rows.length; if (i === cur) return; cur = i;
      var row = rows[i], d = row.data, acc = d.answers ? Math.round(d.correct / d.answers * 100) : 0, days = recapDays(d);
      var max = days.reduce(function(a, b){ return Math.max(a, b.m); }, 1), peak = days.reduce(function(a, b){ return b.m > a.m ? b : a; }, days[0] || { m: 0 });
      var byHour = d.by_hour || [], ph = 0; byHour.forEach(function(v, k){ if (v > byHour[ph]) ph = k; });
      var facts = [];
      if (d.answers) facts.push(["right", '<b class="num" data-count="' + acc + '" data-suffix="%">' + acc + "%</b> right", "of " + num(d.answers) + " answers"]);
      if (d.night_before) facts.push(["flame", '<b class="num">' + num(Math.round(d.night_before / 60)) + " h</b> the day before", "from " + num(d.night_before_people) + " people"]);
      if (byHour.length) facts.push(["prime", '<b class="num">' + esc(hourLabel(ph)) + "</b> prime time", "the busiest hour"]);
      if (d.after_midnight) facts.push(["owls", '<b class="num">' + num(d.after_midnight) + "</b> night owl" + (d.after_midnight === 1 ? "" : "s"), "after midnight"]);
      if (d.regulars) facts.push(["regulars", '<b class="num">' + num(d.regulars) + "</b> regular" + (d.regulars === 1 ? "" : "s"), "3 or more days"]);
      var tq = (d.toughest || [])[0], qq = row.question, hrs = Math.round((d.minutes || 0) / 60);
      clearTimeout(playT); body.classList.remove("is-in", "is-played"); body.setAttribute("style", tintVars(row.hub)); body.setAttribute("aria-labelledby", "rc-tab-" + i);
      body.innerHTML =
        '<div class="rc-head">' + emblem(row.hub, "dx-emb") + "<div><h3>" + esc(row.title) + '</h3><p class="note">' +
          (d.exam_day ? "Exam " + esc(recapDay(d.exam_day, true)) : "") + (d.first_day && (d.exam_day || d.last_day) ? " · studied " + esc(recapDay(d.first_day)) + " to " + esc(recapDay(d.exam_day || d.last_day)) : "") + "</p></div>" +
          '<button type="button" class="btn rc-save" id="rcSave">Save image</button></div>' +
        '<div class="rc-main">' +
          '<p class="rc-big">' + rcIcon("hours") + '<span><b class="num" data-count="' + hrs + '">' + num(hrs) + "</b><span>hours studied together</span></span></p>" +
          '<div class="rc-crowd"><div class="rc-crowd-art" id="rcCrowd" aria-hidden="true"></div><p><b class="num" data-count="' + (+d.people || 0) + '">' + num(d.people) + "</b> classmates</p></div>" +
          (days.length ? '<div class="rc-chart"><h4>Hours per day</h4>' +
            '<div class="rc-plot" id="rcPlot" role="img" aria-label="Hours studied each day, as a bar graph. The most: ' + num(Math.round(peak.m / 60)) + " hours on " + esc(recapDay(peak.d)) + '."></div>' +
            '<p class="rc-x" aria-hidden="true"><span>' + esc(recapDay(days[0].d)) + "</span><span>" + (d.exam_day ? "Exam day" : esc(recapDay(days[days.length - 1].d))) + "</span></p></div>" : "") +
        "</div>" +
        (facts.length ? '<ul class="rc-facts">' + facts.map(function(f){ return "<li>" + rcIcon(f[0]) + "<p>" + f[1] + "<small>" + esc(f[2]) + "</small></p></li>"; }).join("") + "</ul>" : "") +
        (tq && tq.attempts && qq && qq.text ? '<div class="rc-tough">' + rcIcon("tough") + '<div><h4>The one that got us</h4><p class="rc-tough-q">' + esc(qq.text) + "</p>" +
          (qq.answer ? '<p class="rc-tough-a">Answer: ' + esc(qq.answer) + "</p>" : "") + '</div><p class="rc-tough-n"><b class="num">' + Math.round(tq.correct / tq.attempts * 100) + "%</b> right</p></div>" : "") +
        (row.footnote ? '<p class="note rc-foot">' + esc(row.footnote) + "</p>" : "");
      rcRow = row; recapArt(false);
      qa("[data-rc]", chips).forEach(function(b){ var on = +b.getAttribute("data-rc") === i; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
      $("rcSave").addEventListener("click", function(e){ saveRecap(row, e.currentTarget); });
      if (seen) requestAnimationFrame(function(){ requestAnimationFrame(play); });
    }
    chips.addEventListener("click", function(e){ var b = e.target.closest("[data-rc]"); if (b) { track("recap:hub"); show(+b.getAttribute("data-rc")); } });
    chips.addEventListener("keydown", function(e){
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault(); show(cur + (e.key === "ArrowRight" ? 1 : -1)); var b = q('[data-rc="' + cur + '"]', chips); if (b) b.focus();
    });
    wrap.hidden = false; showPast(); show(0);
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function(es){ if (es.some(function(x){ return x.isIntersecting; })) { io.disconnect(); seen = true; play(); } }, { threshold: .2 });
      io.observe(body);
    } else { seen = true; play(); }
  }

  /* ---------- the hubs' states: archive overrides from the admin page (widget/archive.js, migration_v50) ---------- */
  var ovSb, ovAt;
  function redraw(){ renderTabs(); renderArchived(); renderYouStats(); }
  function applyHubStates(){
    var sig = partitionHubs();
    if (sig === hubSig) return;
    hubSig = sig; redraw();
  }
  function loadOverrides(sb, bootstrap){
    if (!sb || !window.shArchive) return;
    ovSb = sb; ovAt = Date.now();
    function apply(rows){
      if (!Array.isArray(rows)) return;   /* before a migration or offline: keep what we have */
      window.shArchive.writeCache(rows);
      OVERRIDES = window.shArchive.index(rows);
      applyHubStates();
    }
    function remote(){ sb.rpc("get_hub_overrides").then(function(r){ apply(r && !r.error ? r.data : null); }, function(){}); }
    if (bootstrap && typeof bootstrap.then === "function") bootstrap.then(function(data){ if (data && Array.isArray(data.overrides)) apply(data.overrides); else remote(); }, remote);
    else remote();
  }
  /* back on the tab after a while: check again (one small request, at most every 5 minutes) */
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "visible" && ovSb && Date.now() - ovAt > 5 * 60 * 1000) loadOverrides(ovSb); });

  /* ---------- each hub's "Updated", from the changelog every deploy logs to, and its What's new (the long list went on
     2026-11-11; Sam brought it back as one line on 2026-11-17, then as its own box under the stage on 2026-11-19) ---------- */
  var latestBy = null, logRows = [];
  /* a changelog row's hubs ("all", one hub, or a comma list; empty is the whole site) */
  function logHubs(r){ var t = String(r.hub || "").toLowerCase().split(/[,\s]+/).filter(Boolean); return t.length ? t : ["all"]; }
  function applyUpdated(){
    if (!latestBy) return;
    qa(".updated[data-hub]").forEach(function(el){
      var best = latestBy[el.getAttribute("data-hub")] || null;
      if (latestBy.all && (!best || latestBy.all > best)) best = latestBy.all;
      if (best) el.textContent = "Updated " + relDay(new Date(best));
    });
    /* What's new: the hub's and the whole site's latest changes (drawNews) */
    qa("[data-news]").forEach(drawNews);
  }
  function loadChangelog(){
    rest("changelog?select=hub,message,created_at&order=created_at.desc&limit=40").then(function(rows){
      if (!rows || !rows.length) return;
      /* the freshest entry per hub drives its "Updated" (a row's hub can be "all" or a comma list) */
      keepLatest(rows[0].created_at);
      latestBy = {};
      rows.forEach(function(r){ String(r.hub || "").toLowerCase().split(/[,\s]+/).filter(Boolean).forEach(function(t){ if (!latestBy[t] || r.created_at > latestBy[t]) latestBy[t] = r.created_at; }); });
      logRows = rows.filter(function(r){ return r && typeof r.message === "string" && r.message.trim(); });
      applyUpdated();
    }).catch(function(){});
  }
  /* The newest changelog row's time, kept on the device for half an hour and shared with every hub's page
     (widget/v3.js reads and writes the same key; 2026-11-19, the database optimization pass): the watcher below still
     looks every four minutes, but asks the database only when what the device has is older than that. Its first look
     waits for loadChangelog's answer, which is kept the same way, so a dashboard load reads the changelog once. */
  var KEEP_KEY = "sh_changelog_seen";
  function keepLatest(at){ try { localStorage.setItem(KEEP_KEY, JSON.stringify({ t: Date.now(), at: at })); } catch (e) {} }
  function keptLatest(){ try { var k = JSON.parse(localStorage.getItem(KEEP_KEY)), d = Date.now() - k.t; return d >= 0 && d < 18e5 && typeof k.at === "string" ? k.at : null; } catch (e) { return null; } }
  /* "this page was updated", for tabs left open */
  function watchUpdates(){
    var baseline = null, shown = false;
    function show(){
      if (shown) return; shown = true;
      toast("A newer version of the hubs is live.", { kind: "update", sticky: true, action: { label: "Reload", run: function(){ location.reload(); } } });
    }
    function take(latest){
      if (baseline === null){ baseline = latest; return; }
      if (new Date(latest) > new Date(baseline)) show();
    }
    function check(){
      var have = keptLatest();
      if (have) { take(have); return; }
      rest("changelog?select=created_at&order=created_at.desc&limit=1").then(function(rows){
        if (!rows || !rows.length) return;
        keepLatest(rows[0].created_at);
        take(rows[0].created_at);
      }).catch(function(){});
    }
    setTimeout(check, 9000); setInterval(check, 4 * 60 * 1000);
  }

  /* ---------- the tour (widget/tour.js): no question on arrival; "Take the tour" in the menu runs it, with this page's own steps ---------- */
  function petOn(){ return (ls("sh_pref_pet") || "on") !== "off"; }
  window.SH_TOUR = { prompt: false, steps: function(o){
    var S = [{ title: "Welcome to Study Hubs", body: "<p>A quick look at this page, on the real buttons. It takes under a minute, and each hub has its own tour inside it.</p><p>Use <b>Next</b> and <b>Back</b> (or the arrow keys). Start it again any time from the menu at the top.</p>" }];
    if (HUBS.length) {
      S.push({ el: ".dx-tabs", title: "Your hubs", body: "<p>One tab per hub, the next exam's first. Each shows how many days are left.</p>" });
      S.push({ el: ".dx-stage", title: "The next exam", body: "<p>The countdown with a bead for each day left, <b>Start studying</b>, the <b>Daily drill</b> and a ring for how far you've got in this hub. Along the bottom: the hub's <b>Timmy Time</b> episode when it has one, and the day before an exam, <b>Send luck</b> to the class. After an exam, <b>Check in</b> shows up under it.</p>" });
      S.push({ el: ".dx-wn", title: "What's new", body: "<p>The latest changes to this hub and to every hub, newest first. The ones since your last visit say <b>New</b>. <b>About this hub</b> opens what the hub covers.</p>" });
    }
    S.push({ el: "#you", title: "You", body: "<p>The name classmates see, your handpiece rank and XP from every hub, your mastery medals and your study streak." + (petOn() ? " Timmy Tooth lives here once you've met him: study and he stays healthy." : "") + "</p>" });
    S.push({ el: "#class", title: "The class", body: "<p>How many classmates have a hub open this minute and which hubs they're in. Under it, the top ten by XP or the longest study streaks, the first three on the podium, with every rank from Stone to Dark Matter folded underneath.</p>" });
    if (o.visible($("ideas"))) S.push({ el: "#ideas", title: "The idea board", body: "<p>Ideas for the hubs, from the class. Vote the ones you'd use up or down, or post your own: it shows right away under your name, with the hub it's for and what kind of idea it is.</p>" });
    if (o.visible($("past"))) S.push({ el: "#past", title: "Past hubs", body: "<p>How the class studied for each exam that's done: the hours, the people, the busiest day. <b>Save image</b> keeps a picture of it. A hub that just closed keeps its check-in here.</p>" });
    S.push({ el: "#inboxBtn", title: "Inbox", body: "<p>Replies to your reports and suggestions, notices to the whole class and the occasional short survey. A number on it means something new.</p>" });
    S.push({ el: "#setBtn", title: "Settings", body: "<p>Focus mode, the theme, text size, your name, <b>Link my devices</b> (your phone and laptop count as one you), Timmy and the extras. Set them once here and every hub follows.</p>" });
    S.push({ el: "#menuBtn", title: "About and this tour", body: "<p>The full guide to every feature, trophy and easter egg, the light or dark switch, and this tour.</p>", last: true });
    return S;
  } };
  function tourIdle(fn){ if (window.shTour) window.shTour.whenIdle(fn); else fn(); }
  $("tourBtn").addEventListener("click", function(){
    menu(false);
    loadScriptOnce(WIDGET + "tour.js").then(function(){ if (window.shTour) window.shTour.start(); }, function(){ toast("The tour didn't load. Try again in a moment.", "err"); });
  });

  /* ---------- first paint: everything that needs no network ---------- */
  renderTabs(); renderArchived(); renderYouStats();

  /* ====================================================================
     THE CLASS'S DATA
     ==================================================================== */
  function startClassData(){
    var sb = null;
    try{ if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SB_URL, SB_KEY); }catch(e){}
    /* the anonymous visitor exists before the one load-time request, so a first visit gets the same bootstrap as a returning one */
    VISITOR = surveyVisitor();
    var bootstrap = dashboardBootstrap(sb);
    /* Ask Timmy (widget/ask.js), before Timmy so his house has its "Ask me": on the dashboard he answers from every live
       hub (Sam, 2026-11-12: "timmy doesnt ask what hub when on the dashboard"); a link opens that hub's page at it */
    if (window.shAsk) window.shAsk.mount({ where: "dashboard", sb: sb, name: "Study Hubs", about: C.about || ROOT + "about/",
      section: function(){ return "dashboard"; },
      hubs: function(){ return HUBS.map(function(h){ return { id: h.id, name: hubName(h), stateKey: h.stateKey, content: ROOT + "hubs/" + h.id + "/content/" }; }); },
      href: function(id){ var h = HUBS.concat(ARCHIVED_HUBS).filter(function(x){ return x.id === id; })[0]; return h ? hubHref(h) : ""; },
      spot: function(){ return $("askSpot"); } });
    /* Timmy (widget/pet.js) lives in the "you" card. Everyone has Timmy (Ask Timmy, part 4): no adoption and no
       introduction, and he wears what's on at his place (the v2 bootstrap's shop), nothing when nothing is. */
    if (window.shPet) {
      window.shPet.mount({ where: "dashboard", sb: sb, visitor: VISITOR,
        name: function(){ return localName || randomName; },
        home: function(){ return $("petHome"); }, bootstrap: bootstrap.ready });
    }
    placeStart(sb, bootstrap.ready);
    shopStart(sb, bootstrap.ready);
    if (!sb){ renderMyRank(null); whenPanelOpens($("class"), function(){ boardOpen = true; drawBoard(); }); return; }
    nameSb = sb; luckSb = sb; debriefSb = sb; boardSb = sb;
    /* the idea board (widget/ideas.js): its section stays hidden until its first load says the board is up (its
       server is migration_v54). An idea can be for a live hub or all hubs; an archived hub's ideas keep its name. */
    if (window.shIdeas) window.shIdeas.mount($("ideas"), { sb: sb,
      /* the live hubs (the server takes an idea's hub from the hubs whose answer keys it holds; "All hubs" is always there) */
      hubs: function(){ return HUBS.map(function(h){ return { id: h.id, name: hubName(h) }; }); },
      name: function(id){ var h = debriefHub(id); return h ? hubName(h) : HUB_LABEL[id] || ""; },
      tint: tintVars, editName: openNameEditor, nameHint: function(){ return randomName; },
      onReady: function(ok){ $("ideas").hidden = !ok; } });
    loadOverrides(sb, bootstrap.ready);
    loadRecaps(sb, bootstrap.ready);
    loadChangelog(); watchUpdates();
    bootstrap.ready.then(function(data){
      if (data && Object.prototype.hasOwnProperty.call(data, "exam_luck")) { if (data.exam_luck && luckKey()) luckData[luckKey()] = data.exam_luck; drawLuck(); }
      else loadLuck();
    }, loadLuck);
    if (!localName){
      var remoteName = function(){ sb.rpc("get_display_name", { p_visitor: VISITOR }).then(function(r){ if (r && r.data){ randomName = r.data; paintName(); } }, function(){}); };
      bootstrap.ready.then(function(data){ if (data && data.display_name) { randomName = data.display_name; paintName(); } else remoteName(); }, remoteName);
    }
    /* your two weeks, across every hub, ride in the bootstrap: the streak and this week's answers */
    bootstrap.ready.then(function(data){
      if (!data || !Array.isArray(data.dashboard_week)) return;
      var by = localDays();
      data.dashboard_week.forEach(function(r){ var k = String(r.answer_date).slice(0, 10); by[k] = by[k] || { a: 0, c: 0 }; by[k].a += +r.attempts || 0; by[k].c += +r.correct || 0; });
      weekBy = by; weekSource = "server"; renderYouStats();
    }, function(){});
    /* your rank */
    bootstrap.ready.then(function(data){ if (data && data.rank && typeof data.rank === "object") applyMyRank(data.rank); else loadMyRank(sb); }, function(){ loadMyRank(sb); });

    /* the live count, per hub and in all (listen only, never counted ourselves) */
    var watcher = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());
    HUBS.forEach(function(h){
      var hub = h.id;
      try{
        var ch = sb.channel("presence:" + hub, { config: { presence: { key: "dash-" + watcher + "-" + hub } } });
        ch.on("presence", { event: "sync" }, function(){
          try{
            var ps = ch.presenceState();
            setPeople(hub, Object.keys(ps).map(function(k){ var m = ps[k] && ps[k][0]; return { key: hub + "/" + k, hub: hub, fit: cleanFit(m && m.fit) }; }));
          }catch(e){ setPeople(hub, []); }
          paintNow();
          var line = $("hubLive"); if (line && selected === hub) line.innerHTML = liveLine(h);
        });
        ch.subscribe();
      }catch(e){}
    });
    setTimeout(function(){ if ($("liveCount").textContent === "–") paintNow(); }, 6000);

    /* what gets clicked (widget/clicks.js), report replies and notices (widget/replies.js), "is this your other device?" (widget/linkask.js) */
    /* its clicks and events in one record_analytics call (migration_v82), as a hub sends them: clicks.js's flush asks for
       record_events, then record_clicks, in one go; the two calls of before when the function is missing (2026-11-19) */
    var anOut = null, anOne = true;
    function anSend(a){
      function no(){}
      if (!anOne) { if (a.p_events) sb.rpc("record_events", { p_hub: a.p_hub, p_visitor: a.p_visitor, p_items: a.p_events }).then(no, no); if (a.p_clicks) sb.rpc("record_clicks", { p_hub: a.p_hub, p_visitor: a.p_visitor, p_items: a.p_clicks }).then(no, no); return; }
      sb.rpc("record_analytics", a).then(function(r){ var e = r && r.error; if (e && (e.code === "PGRST202" || /could not find the function/i.test(e.message || ""))) { anOne = false; anSend(a); } }, no);
    }
    var anSb = { rpc: function(fn, a){
      var k = fn === "record_clicks" ? "p_clicks" : fn === "record_events" ? "p_events" : "";
      if (!k) return sb.rpc(fn, a);
      if (!anOut) { anOut = { p_hub: a.p_hub, p_visitor: a.p_visitor || VISITOR || null }; Promise.resolve().then(function(){ var x = anOut; anOut = null; anSend(x); }); }
      anOut[k] = a.p_items;
      return Promise.resolve({ data: null, error: null });
    } };
    if (window.shClicks) window.shClicks.start({ sb: anSb, hub: "dashboard", visitor: VISITOR, section: function(){ return "dashboard"; } });
    if (window.shReplies) window.shReplies.start({ sb: sb, visitor: VISITOR || null, hub: "dashboard", bootstrap: bootstrap.ready });
    if (window.shLinkAsk) window.shLinkAsk.start({ sb: sb, hub: "dashboard", bootstrap: bootstrap.ready, bootstrapName: bootstrap.linkName });

    /* after an exam, its check-in takes the survey's place for that visit; both wait while the tour is on screen */
    /* one thing at a time at the bottom of the screen: the check-in or a survey waits while a reply to your report
       (widget/replies.js) is still showing, up to five minutes */
    var held = 0;
    function askNext(){
      if (q(".sh-reply") && held++ < 200) { setTimeout(askNext, 1500); return; }
      tourIdle(function(){ whenUncovered(function(){ if (!autoDebrief()) startSurvey(sb, bootstrap.ready); }); });
    }
    setTimeout(askNext, 4000);

    /* Golden Probe (an easter egg in the hubs): who found today's, per hub */
    function showGolden(rows){
      rows = Array.isArray(rows) ? rows : [];
      if (!rows.length) return;
      var el = $("goldenLine");
      el.innerHTML = icon("trophy", 18) + "<span><b>Today's Golden Probe.</b> " + HUBS.map(function(h){
        var r = rows.filter(function(x){ return x.hub === h.id; })[0];
        return esc(hubName(h)) + ": " + (r ? "found by <b>" + esc(r.display_name) + "</b>" : "still hidden");
      }).join(" · ") + "</span>";
      el.hidden = false;
    }
    function remoteGolden(){ sb.rpc("get_golden_today").then(function(res){ showGolden(res && !res.error ? res.data : null); }, function(){}); }
    bootstrap.ready.then(function(data){ if (data && Array.isArray(data.golden)) showGolden(data.golden); else remoteGolden(); }, remoteGolden);

    /* the class board */
    whenPanelOpens($("class"), function(){ if (!boardOpen) { boardOpen = true; drawBoard(); } });
  }
  /* The page is drawn from this device's own data first. The class's data and the shared widgets (ranks, Timmy, the
     Inbox, click counts) come after, in this order, so the first screen doesn't wait for them on a slow phone. A page
     that lists one of them itself is left alone. */
  var LATE = ["clicks.js", "replies.js", "linkask.js", "ranks.js", "ask.js", "pet.js", "timmy.js", "ideas.js"];
  /* They arrive in one file, widget/rest.bundle.js (tools/bundle/build.mjs: the database client, which runs as it
     loads, and the widgets a hub's page shares with this one, each held until it is run here), beside the one file of
     drawings that is this page's alone (the room and the stage). */
  function loadLate(done){
    var left = 2;
    function one(){
      if (--left) return;
      var B = window.SH_BUNDLE;
      LATE.forEach(function(f){ try { if (B) B.run(f); } catch (e) { setTimeout(function(){ throw e; }, 0); } });   /* one that fails doesn't stop the rest */
      done();
    }
    loadScriptOnce(WIDGET + "rest.bundle.js").then(one, one);
    loadScriptOnce(WIDGET + "hub-art/class.js").then(one, one);
  }
  /* The drawn pictures move when you arrive at them, not all the time (Sam, 2026-11-14: "scrolling and things are kind
     of sluggish and jittery"). Anything that moves inside a drawing (the stage's confetti and lights, the classroom's
     Timmys, the road, the board's Timmy, the picture of Timmy's place) makes the browser redraw that picture and
     rebuild the page's layers on every frame, and about 130 of them ran the whole time, wherever the page was
     scrolled. So each such part of the page rests (.is-rest: dash.css and place.css hold what moves inside it) and
     comes alive for LIFE ms when it comes on screen, when a scroll ends on it and under a mouse. It rests at once when
     a scroll or a touch starts, while a window is open over the page and when it leaves the screen. What costs
     nothing keeps moving while it is on screen: the Timmy Time card, the rays, the rank bar's shine and a crown's glint
     are moved by the compositor. Off screen (.is-away) nothing moves at all. */
  var LIFE = 8000, life = { io: null, parts: [], scrolling: false, st: 0, tt: 0, stage: null };
  function lifeCovered(){ return !!q('dialog[open], [aria-modal="true"]'); }
  /* the picture of Timmy's place is drawn in a shadow root, which a rule out here can't reach: it is told by itself */
  function lifeMark(p, rest){
    p.el.classList.toggle("is-rest", rest);
    if (p.el.id === "you") [].forEach.call(p.el.querySelectorAll(".tpc-live"), function(x){ x.classList.toggle("is-rest", rest); });
  }
  function lifeRest(p){ clearTimeout(p.t); p.t = 0; lifeMark(p, true); }
  function lifeWake(p){
    if (!p.on || life.scrolling || lifeCovered()) return;
    clearTimeout(p.t); lifeMark(p, false);
    p.t = setTimeout(function(){ lifeRest(p); }, LIFE);
  }
  function lifeHold(){ life.parts.forEach(function(p){ if (p.t) lifeRest(p); }); }
  function lifePart(el){
    var p = { el: el, on: false, t: 0 };
    el.classList.add("is-rest"); life.parts.push(p); life.io.observe(el);
    el.addEventListener("mouseenter", function(){ lifeWake(p); });
    return p;
  }
  function lifeWatch(){
    if (!window.IntersectionObserver) return;
    life.io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        e.target.classList.toggle("is-away", !e.isIntersecting);
        var p = life.parts.filter(function(x){ return x.el === e.target; })[0]; if (!p) return;
        p.on = e.isIntersecting; if (p.on) lifeWake(p); else lifeRest(p);
      });
    });
    ["you", "now", "road", "ideas", "past"].forEach(function(id){ var el = $(id); if (el) lifePart(el); });
    /* these two have nothing that rests, only what stops off screen (.is-away): the Timmy Time card, the board's rows */
    ["hubs", "board"].forEach(function(id){ var el = $(id); if (el) life.io.observe(el); });
    lifeStage();
    window.addEventListener("scroll", function(){
      if (!life.scrolling) { life.scrolling = true; lifeHold(); }
      clearTimeout(life.st);
      life.st = setTimeout(function(){ life.scrolling = false; life.parts.forEach(lifeWake); }, 220);
    }, { passive: true });
    document.addEventListener("touchstart", lifeHold, { passive: true });
    /* a tap that scrolled nothing: the pictures come back */
    document.addEventListener("touchend", function(){
      clearTimeout(life.tt); life.tt = setTimeout(function(){ if (!life.scrolling) life.parts.forEach(lifeWake); }, 500);
    }, { passive: true });
    /* a window opened over the page (most open on a click; one that had to be fetched first is added to the body
       later) or closed */
    document.addEventListener("click", function(){ setTimeout(function(){ if (lifeCovered()) lifeHold(); }, 80); }, true);
    if (window.MutationObserver) new MutationObserver(function(){ if (lifeCovered()) lifeHold(); }).observe(document.body, { childList: true });
    document.addEventListener("close", function(){ setTimeout(function(){ life.parts.forEach(lifeWake); }, 320); }, true);
  }
  /* the stage is drawn again with every board, so its picture is watched by itself (the list under it is tall: the
     stage is often off screen while the list is on it) */
  function lifeStage(){
    if (!life.io) return;
    var el = q(".dx-set", $("board"));
    if (life.stage && life.stage.el === el) return;
    if (life.stage) { life.io.unobserve(life.stage.el); clearTimeout(life.stage.t); life.parts = life.parts.filter(function(x){ return x !== life.stage; }); }
    life.stage = el ? lifePart(el) : null;
  }
  function afterDraw(){
    lifeWatch();
    loadLate(function(){
      CA = window.SH_CLASS_ART || null;
      startClassData(); syncRoom();
      /* the room and the stage are drawn to the pixel, so they are drawn again when their width changes */
      if (window.ResizeObserver) {
        var rt = 0;
        new ResizeObserver(function(){
          clearTimeout(rt);
          rt = setTimeout(function(){ syncRoom(); var ar = q(".dx-arena", $("board")); if (ar && Math.abs(+ar.getAttribute("data-w") - $("board").clientWidth) > 4) paintBoard(); }, 120);
        }).observe($("class"));
      }
      document.addEventListener("sh:pref", function(){ syncRoom(); paintBoard(); recapArt(true); });
      /* a hub tab of yours opened or closed */
      window.addEventListener("storage", function(e){ if (e.key === "sh_presence_mine") paintMe(); });
      if (window.ResizeObserver && $("rcBody")) {
        var rcW = 0, rcT = 0;
        /* the width comes from the entry: measuring here would lay the page out in the middle of the browser's own
           pass, and when that changes a size (a stylesheet still loading) WebKit reports a ResizeObserver loop (BUG-078) */
        new ResizeObserver(function(es){
          var w = es && es[0] ? Math.round(es[0].contentRect.width) : 0; if (!w || Math.abs(w - rcW) < 4) return;
          var first = !rcW; rcW = w; if (first) return;
          clearTimeout(rcT); rcT = setTimeout(function(){ recapArt(true); }, 120);
        }).observe($("rcBody"));
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", afterDraw); else afterDraw();

  /* offline copy of the dashboard and hubs (sw.js); best-effort */
  if ("serviceWorker" in navigator && window.isSecureContext) { try { navigator.serviceWorker.register(ROOT + "sw.js"); } catch (e) {} }

  /* refresh the countdowns if the tab stays open past midnight, and apply an archive time or an override's end that
     passes while the page is open */
  var dayKey = ymd(new Date());
  setInterval(function(){
    if (ymd(new Date()) !== dayKey){ dayKey = ymd(new Date()); hubSig = partitionHubs(); redraw(); }
    else applyHubStates();
    syncRoom();      /* the room's windows go dark at 7 pm and light at 6 am */
  }, 60 * 1000);

  /* setLive({ hubId: n }, [{ key, hub, fit }]) paints who is studying from outside: the preview uses it, since realtime
     has no fixture there. Without the list, each hub gets n plain Timmys. */
  function setLive(by, list){
    by = by && typeof by === "object" ? by : {};
    liveBy = {};
    HUBS.forEach(function(h){
      var mine = Array.isArray(list) ? list.filter(function(p){ return p && p.hub === h.id; }).map(function(p){ return { key: h.id + "/" + String(p.key), hub: h.id, fit: cleanFit(p.fit) }; }) : null;
      if (!mine) { mine = []; for (var i = 0; i < (+by[h.id] || 0); i++) mine.push({ key: h.id + "/#" + i, hub: h.id, fit: "" }); }
      setPeople(h.id, mine);
    });
    paintNow();
    var hub = HUBS.filter(function(h){ return h.id === selected; })[0], line = $("hubLive"); if (hub && line) line.innerHTML = liveLine(hub);
  }
  window.shDash = { redraw: redraw, hubs: function(){ return HUBS.slice(); }, tint: tintVars, icon: icon, setLive: setLive };
})();
