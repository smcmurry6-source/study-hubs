/* The new dashboard (redesign phase 3, vault/tasks/2026-11-05-redesign-phase-3-dashboard.md). Loaded only by
   next/index.html, the page built beside the live dashboard (index.html) until the redesign is released: outside a preview
   that page sends the visitor to the live dashboard, so nothing here reaches the class before then.

   What it draws, on the hub engine's design system (widget/hub.css, with widget/dash.css for the layout):
   - the hubs as tabs (emblem, tint, days to the exam), the next exam's first, and under them that hub's panel: its
     masthead scene, the countdown, Start studying, the Daily drill, Timmy Time, exam-day luck, your progress, check-ins;
   - one "you" card: your name, Timmy's house (widget/pet.js draws it; Timmy's place takes that spot in phase 4), your
     handpiece rank, mastery medals and day streak;
   - the class board (ranks, study streaks, arcade high scores) with When people study as a line under it;
   - the idea board's slot (widget/ideas.js fills #ideas), hub recaps and archived hubs, What's new.
   The check-in, survey, name, luck, archive and changelog logic is the live dashboard's own, moved here unchanged.

   Its data is next/hubs.js (window.SH_DASH_DATA), written from index.html by tools/dash-next/build.mjs until the release.
   The game layer's functions (migration_v54, not applied until the release) are called as <name>_v2 with today's function
   as the fallback, so the page works before and after the migration; a preview answers both from fixtures. */
(function(){
  "use strict";
  if (window.shDash) return;
  var D = window.SH_DASH_DATA; if (!D) return;
  var C = window.SH_DASH || {}, A = window.SH_HUB_ART || { icons: {}, flame: {}, spots: {} }, DA = window.SH_DASH_ART || { tints: {}, emblems: {} };
  var ROOT = C.root || "../", WIDGET = C.widget || (ROOT + "widget/");
  var SB_URL = "https://thytmzsgymydbzcqdnix.supabase.co";
  var SB_KEY = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS";
  var docEl = document.documentElement;
  docEl.classList.add("shx", "sh-dash");

  /* ---------- the data (next/hubs.js) ---------- */
  var CLASSES = D.classes, HUBS = D.hubs.slice(), ARCHIVED_HUBS = D.archived.slice(), HUB_LABEL = D.labels || {}, ARCADES = D.arcades || [];
  var CHECKIN_HOUR = D.checkinHour, ARCHIVE_HOUR = D.archiveHour, CARD_DAYS = D.cardDays, DEBRIEF_DAYS = D.debriefDays;
  var NEXT = {}; (D.next || []).forEach(function(id){ NEXT[id] = 1; });

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
  function toast(msg){
    var host = q(".hx-toasts") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "hx-toasts" }));
    var t = document.createElement("div"); t.className = "hx-toast"; t.setAttribute("role", "status"); t.textContent = msg; host.appendChild(t);
    setTimeout(function(){ t.classList.add("out"); setTimeout(function(){ t.remove(); }, 300); }, 2600);
  }

  /* ---------- the drawings (widget/hub-art.js: the icon set, the flame, Home's spot art; widget/hub-art/dash.js: every
     hub's tint and emblem; a hub's masthead comes from its own art file when its tab is opened) ---------- */
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
    var lvl = n >= 7 ? 3 : n >= 3 ? 2 : 1;
    return '<svg class="flame' + (n ? "" : " is-cold") + (cls ? " " + cls : "") + '" viewBox="0 0 40 48" aria-hidden="true" focusable="false">' + ((A.flame || {})[lvl] || "") + "</svg>";
  }
  function spot(k, col, cls){
    var S = (A.spots || {})[k]; if (!S) return "";
    var b = S.body.replace(/class="sp-tint"/g, 'fill="' + col.tint + '"').replace(/class="sp-tint-light"/g, 'fill="' + col.light + '"').replace(/class="sp-tint-line"/g, 'stroke="' + col.line + '"');
    return img(b, "", cls, S.vb);
  }
  /* exam-day luck's clover, the live dashboard's own mark */
  var CLOVER = '<svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 11c-1.5-3-5.5-3.5-5.5-.5S10 13 12 11zM12 11c3-1.5 3.5-5.5.5-5.5S10 9 12 11zM12 11c1.5 3 5.5 3.5 5.5.5S14 9 12 11zM12 11c-3 1.5-3.5 5.5-.5 5.5S14 13 12 11z"/><path d="M12 11c0 4 1 7 3 10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
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
     next/hubs.js plus any override set on the admin page; without it the dates alone decide) ---------- */
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
  function shownArchived(){ return ARCHIVED_HUBS.filter(function(h){ return HUB_STATE[h.id] && HUB_STATE[h.id].state === "archived"; }); }

  /* ---------- where a hub opens: its new version when it has one (hubs/<id>/next/), with that version's own routes ---------- */
  function hubHref(hub, part){
    var isNew = !!NEXT[hub.id], base = ROOT + "hubs/" + hub.id + "/" + (isNew ? "next/" : "");
    if (part === "drill") return base + (isNew ? "#questions/drill" : "#drill");
    if (part === "timmy") return base + (isNew ? "#more/timmy" : "#timmy");
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
          '<div class="dx-porch"><p class="note" id="petPerch">Timmy Tooth wants to meet you. Tap him.</p></div>' +
          '<div id="petHome" hidden></div>' +
          '<div class="dx-rankcard" id="meRank"></div>' +
          '<ul class="dx-stats" id="youStats"></ul>' +
        "</section>" +
        '<section class="panel dx-class" id="class" aria-labelledby="classH">' +
          '<div class="dx-classhead"><h2 id="classH">The class</h2>' +
            '<span class="seg" role="group" aria-label="Class board" id="boardSeg">' +
              [["ranks", "Ranks"], ["streaks", "Study streaks"], ["arcade", "Arcade"]].map(function(b, i){ return '<button type="button" data-board="' + b[0] + '" aria-pressed="' + (i === 0) + '">' + b[1] + "</button>"; }).join("") +
            "</span></div>" +
          '<p class="note" id="boardNote"></p>' +
          '<div class="dx-arcpick" id="arcadePick" hidden></div>' +
          '<div id="board" aria-live="polite"><p class="note">Loading…</p></div>' +
          '<details class="dx-ladder" id="ladderFold" hidden><summary>' + icon("chevron", 18, "rot") + "Every rank, Stone to Dark Matter</summary><div class=\"dx-rungs\" id=\"rankLadder\"></div></details>" +
          '<p class="dx-line" id="hoursLine" hidden></p>' +
          '<p class="dx-line" id="goldenLine" hidden></p>' +
        "</section>" +
      "</div>" +
      /* the idea board (vault/tasks/2026-11-06-idea-board.md): widget/ideas.js draws into this section and unhides it */
      '<section class="dx-section" id="ideas" data-sh-ideas hidden></section>' +
      '<section class="dx-section" id="past" aria-labelledby="pastH" hidden>' +
        '<h2 id="pastH">Past hubs</h2><p class="note" id="pastNote"></p>' +
        '<div class="dx-past">' +
          '<div class="rcs" id="rcs" hidden>' +
            '<div class="rcs-stage" id="rcsStage" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Hub recaps. Use the arrow keys to switch."></div>' +
            '<div class="rcs-side"><h3 class="rcs-title" id="rcsTitle"></h3><p class="rcs-sub" id="rcsSub" aria-live="polite"></p>' +
              '<div class="rcs-ctl"><button class="dx-ib" id="rcsPrev" type="button" aria-label="Previous recap">' + icon("chevron", 20, "flip") + '</button><span class="note num" id="rcsCount"></span>' +
              '<button class="dx-ib" id="rcsNext" type="button" aria-label="Next recap">' + icon("chevron", 20) + '</button><a class="btn" id="rcsSave" download>Save image</a></div>' +
              '<ul class="rcs-list" id="rcsList"></ul></div>' +
          "</div>" +
          '<ul class="dx-archived" id="archived"></ul>' +
        "</div>" +
      "</section>" +
      '<section class="dx-section" id="changelog" aria-labelledby="newH" hidden>' +
        '<h2 id="newH">What\'s new</h2><p class="note">Every update goes live at this same link.</p>' +
        '<ol class="dx-tl is-collapsed" id="timeline"></ol><button class="btn" id="tlMore" type="button" hidden>Show earlier updates</button>' +
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
    selected = b.getAttribute("data-tab"); track("dash:tab=" + selected); renderTabs(); var n = $("tab-" + selected); if (n) n.focus();
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
    el.innerHTML = CLOVER + '<div class="dx-luck-txt">' +
      (n ? "<b>" + n + (n === 1 ? " classmate" : " classmates") + "</b> sent luck for " + esc(luckFor.name) + (names ? "<small>Latest: " + names + (n > 3 ? " and more" : "") + "</small>" : "")
         : "<b>" + (luckFor.d === 0 ? "Exam day." : "Exam tomorrow.") + "</b> Send the class some luck for " + esc(luckFor.name) + ".") + "</div>" +
      '<button type="button" class="btn hero-luck-btn"' + (r.mine ? " disabled>Luck sent" : ">Send luck") + "</button>";
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
    var el = $("heroLuck"); drawLuck(); if (el) luckBurst(el);
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

  var liveBy = {};
  function liveLine(hub){
    var n = liveBy[hub.id];
    return n ? '<i class="dx-dot" aria-hidden="true"></i><b class="num">' + n + "</b> studying " + esc(hubName(hub)) + " right now" : "";
  }
  /* your progress in the open hub: a line and a bar under the buttons; nothing when this device has no answers in it yet */
  function progressHTML(hub){
    var p = readProgress(hub); if (!p) return "";
    return '<div class="dx-prog"><p class="note"><b class="num">' + num(p.seen) + "</b> " + (p.seen === 1 ? "question" : "questions") + ' tried · <b class="num">' + p.pct + "%</b> " + esc(p.pctLabel) + (p.best ? " · best run " + p.best : "") + "</p>" +
      '<div class="dx-bar2" role="img" aria-label="' + p.pct + '% ' + esc(p.pctLabel) + '"><i data-w="' + p.pct + '"></i></div></div>';
  }
  /* Timmy Time: a hub's audio review episode (hub.podcast = { name, sub }), on the hub's color with the host in headphones */
  function podHTML(hub){
    if (!hub.podcast) return "";
    var t = tintOf(hub.id);
    return '<a class="dx-card dx-pod" href="' + esc(hubHref(hub, "timmy")) + '" data-hub="' + esc(hub.id) + '" data-pod="dash">' +
      '<span class="dx-pod-txt"><b>' + esc(hub.podcast.name) + '</b><small>' + esc(hub.podcast.sub) + '</small><span class="dx-pod-go">' + icon("play", 16) + "Listen</span></span>" +
      spot("timmyTime", { tint: t.mid, light: t.light, line: t.dark }, "dx-pod-art") + "</a>";
  }
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
      '<div class="dx-hero">' +
        '<button type="button" class="dx-scene" data-egg="' + esc(hub.cls) + '" aria-label="' + esc(cls.name || hub.title) + ' (tap for a surprise)"><span class="dx-scene-in" id="hubScene"></span></button>' +
        '<div class="dx-exam">' +
          '<p class="dx-when">' + esc(x ? longDate(x.date) + " · " + (x.code || hub.code) : hub.code) + "</p>" +
          '<h3 class="dx-title">' + esc(x ? x.name : hub.title) + "</h3>" +
          (x ? '<p class="dx-count"><b class="num flap" data-flap="' + (d === 0 ? "Today" : d) + '">' + (d === 0 ? "Today" : d) + "</b>" + (d === 0 ? "" : " <span>" + (d === 1 ? "day to go" : "days to go") + "</span>") + "</p>"
             : '<p class="dx-count dx-count-none"><span>' + esc(opened ? "You last opened this " + opened : "No exam ahead in this hub") + "</span></p>") +
          '<p class="dx-livehub" id="hubLive">' + liveLine(hub) + "</p>" +
          '<div class="dx-actions"><a class="btn btn-primary dx-start" href="' + esc(hubHref(hub)) + '" data-hub="' + esc(hub.id) + '">' + (p ? "Continue studying" : "Start studying") + icon("chevron", 18) + "</a>" + drillHTML(hub) + "</div>" +
          progressHTML(hub) +
          (x && luckTime(d) ? '<div class="dx-luck" id="heroLuck"></div>' : "") +
        "</div>" +
      "</div>" +
      '<div class="dx-hubrow">' + podHTML(hub) +
        '<div class="dx-card dx-about"><h3>' + esc(hub.title) + "</h3>" +
          (others.length ? '<ul class="dx-exams">' + others.map(function(e){ var dd = daysUntil(e.date); return "<li><b>" + esc(e.label || "Exam") + "</b> " + esc(shortDate(e.date)) + " · " + (dd < 0 ? "done" : esc(daysText(dd))) + "</li>"; }).join("") + "</ul>" : "") +
          '<p class="dx-desc clamp" id="hubDesc">' + esc(hub.desc || "") + '</p><button class="btn btn-text dx-more" type="button" data-more aria-expanded="false">Read more</button>' +
          '<p class="note updated" data-updated="' + esc(hub.updated || "") + '" data-hub="' + esc(hub.id) + '">' + (hub.updated ? "Updated " + esc(relDay(parseYmd(hub.updated))) : "") + "</p>" +
        "</div>" +
      "</div>" +
      (checks ? '<div class="dx-checks">' + checks + "</div>" : "");
    /* the scene: the hub's masthead, drawn once its art file is in */
    masthead(hub.id).then(function(M){
      var s = $("hubScene"); if (!s || selected !== hub.id || !M) return;
      s.innerHTML = img(M.body, M.label || "", "dx-mast", "0 0 600 200");
    });
    var desc = $("hubDesc"), more = q("[data-more]", el);
    if (desc.scrollHeight <= desc.clientHeight + 2) more.remove();
    else more.addEventListener("click", function(){ var c = desc.classList.toggle("clamp"); more.textContent = c ? "Read more" : "Show less"; more.setAttribute("aria-expanded", String(!c)); });
    if (x) heroFlap(hub, x);
    luckFor = x && luckTime(d) ? { hub: hub.id, date: x.date, name: x.name, d: d } : null;
    drawLuck(); loadLuck();
    applyUpdated();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ qa(".dx-bar2 i[data-w]", el).forEach(function(i){ i.style.width = i.getAttribute("data-w") + "%"; }); }); });
  }
  /* the class's easter egg, on the hub's scene (the live dashboard has it on the class icon) */
  document.addEventListener("click", function(e){
    var btn = e.target.closest(".dx-scene[data-egg]"); if (!btn) return;
    var c = CLASSES[btn.getAttribute("data-egg")]; if (!c || !c.egg) return;
    btn.classList.remove("is-active"); void btn.offsetWidth; btn.classList.add("is-active");
    toast(c.egg);
  });
  /* remember what was opened last */
  document.addEventListener("click", function(e){
    var a = e.target.closest("a[data-hub]"); if (!a) return;
    lsSet("sh_dash_last", JSON.stringify({ id: a.getAttribute("data-hub"), t: Date.now() }));
  });
  /* coming back from a hub (the back button restores this page as it was): redraw the open hub */
  window.addEventListener("pageshow", function(e){ if (e.persisted) { renderPanel(); renderYouStats(); } });

  /* ---------- archived hubs: a short card each, with the check-in ---------- */
  function renderArchived(){
    var list = shownArchived();
    $("archived").innerHTML = list.map(function(hub){
      var p = readProgress(hub), last = lastExam(hub);
      return '<li class="dx-arch tinted" style="' + tintVars(hub.id) + '">' + emblem(hub.id, "dx-emb") + "<div><h3>" + esc(hub.title) + '</h3><p class="note">' +
        (last && daysUntil(last.date) < 0 ? "Closed after the exam on " + esc(parseYmd(last.date).toLocaleDateString(undefined, { month: "long", day: "numeric" })) + ". Tell us how it went: it shapes the next hubs."
          : "Archived for now. Your progress on it is kept.") + (p ? " You tried " + num(p.seen) + (p.seen === 1 ? " question" : " questions") + " here." : "") + "</p>" + checkinButtonsHTML(hub) + "</div></li>";
    }).join("");
    showPast();
  }
  function showPast(){
    var arch = !!$("archived").children.length, rec = !$("rcs").hidden;
    $("past").hidden = !arch && !rec;
    $("pastNote").textContent = rec ? "How the class studied for each exam that's done" + (arch ? ", and the hubs that just closed." : ".") : "Hubs that closed after their exam.";
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
     EXAM CHECK-INS AND SURVEYS: the live dashboard's own code (index.html), moved here unchanged except for its
     buttons' classes. Keep the two in step until the release.
     ==================================================================== */
  /* Exam check-in (exam_debriefs, migration_v23/v24). After an exam, anyone with progress in that hub gets the
     check-in as a pop-up once, on their first visit after it, however late. Every hub (live or archived) with a
     finished exam keeps a "Check in" button, so people can send more than one. Answers are read back when the hub
     is archived, to improve the next ones (see LESSONS.md). */
  var DEBRIEF_QS = [
    { id:"ready", kind:"scale", prompt:"How ready did you feel walking in?", ends:["Not ready","Very ready"] },
    { id:"went", kind:"choice", prompt:"How did it go?", options:["Better than I expected","About what I expected","Worse than I expected"] },
    { id:"match", kind:"choice", prompt:"How did the hub's questions compare with the real exam?", options:["Hub was harder","About right","Hub was easier","Exam asked different things"] },
    { id:"missed", kind:"text", prompt:"Anything the hub could do better?",
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
  /* the pop-up: the newest finished exam this device studied for that it hasn't been shown yet */
  function autoDebrief(){
    var best = null;
    HUBS.concat(ARCHIVED_HUBS).forEach(function(h){
      if (!readProgress(h)) return;
      pastExams(h, true).forEach(function(x){
        if (ls("sh_debrief_" + h.id + "_" + x.date)) return;
        if (!best || x.date > best.x.date) best = { h:h, x:x };
      });
    });
    if (!best) return false;
    openDebrief(best.h, best.x);
    return true;
  }
  /* an exam's extraQs (e.g. Occlusion's diagram ratings) go just before the closing text question, which stays last */
  function debriefQs(x){ var n = DEBRIEF_QS.length - 1; return DEBRIEF_QS.slice(0, n).concat(x.extraQs || [], DEBRIEF_QS.slice(n)); }
  /* One question per step (with a progress bar) so the card stays short on any screen instead of scrolling.
     Tapping a choice moves on by itself; the text question at the end has Send. Every question is optional. */
  function openDebrief(hub, x){
    var me = surveyVisitor();
    if (!me) return;
    lsSet("sh_debrief_" + hub.id + "_" + x.date, "1");   /* shown = seen; the card button stays for later */
    var old = document.querySelector(".survey"); if (old) old.remove();
    var QS = debriefQs(x), answers = {}, examId = x.date + " " + (x.label || "Exam"), step = 0, last = QS.length - 1, timer = null;
    var box = document.createElement("section");
    box.className = "survey debrief"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Exam check-in");
    root.appendChild(box);
    function render(){
      var q = QS[step], v = answers[q.id], h = '<button type="button" class="survey-x" aria-label="Close">×</button>' +
        '<div class="survey-eyebrow">Exam check-in · ' + (step + 1) + ' of ' + QS.length + '</div>' +
        '<div class="debrief-steps" aria-hidden="true">' + QS.map(function(_, i){ return '<i' + (i <= step ? ' class="on"' : '') + '></i>'; }).join("") + '</div>';
      if (step === 0) h += '<h3>How did ' + esc(x.name || hub.title) + ' go?</h3>' +
        '<p class="survey-why">What you say here, along with how everyone used the hub, goes to the AI that builds these hubs, so the ones for your next exams come out better.</p>';
      h += '<div class="survey-q" data-sq="' + q.id + '" data-kind="' + q.kind + '"><p' + (step ? ' class="debrief-prompt"' : '') + '>' + esc(q.prompt) + '</p>';
      if (q.kind === "text") h += '<textarea maxlength="600" aria-label="' + esc(q.prompt) + '" placeholder="e.g. more on suture types, more EXCEPT questions">' + esc(v || "") + '</textarea>' +
        (q.note ? '<p class="survey-why">' + esc(q.note) + '</p>' : '');
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
      box.innerHTML = h + '</div>';
      refresh();
      var t = box.querySelector("textarea"); if (t && step && window.matchMedia && matchMedia("(hover:hover)").matches) setTimeout(function(){ try{ t.focus({ preventScroll:true }); }catch(e){} }, 60);
    }
    function refresh(){
      var t = box.querySelector("textarea"), send = box.querySelector(".survey-send");
      if (t){ var v = t.value.trim(); if (v) answers.missed = v.slice(0, 600); else delete answers.missed; }
      if (send) send.disabled = !Object.keys(answers).length;
    }
    function go(n){ clearTimeout(timer); step = Math.max(0, Math.min(last, n)); render(); }
    function close(){ clearTimeout(timer); box.classList.remove("is-shown"); setTimeout(function(){ box.remove(); }, 350); }
    render();
    requestAnimationFrame(function(){ box.classList.add("is-shown"); });
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
      if (e.target.closest(".survey-x")) { close(); return; }
      var act = e.target.closest("[data-act]"); if (!act) return;
      var a = act.getAttribute("data-act");
      if (a === "close") close();
      else if (a === "back") go(step - 1);
      else if (a === "next") go(step + 1);
      else if (a === "send" && !act.disabled){
        refresh();
        var thanks = '<div class="survey-eyebrow">Exam check-in</div><p class="survey-thanks"><b>Thank you!</b> Thought of something else? Check in again any time from the hub on this page.</p>';
        var failed = '<div class="survey-eyebrow">Exam check-in</div><p class="survey-thanks"><b>That didn\'t save.</b> Please try again in a minute from the hub on this page.</p>';
        act.disabled = true;
        if (!debriefSb) { box.innerHTML = failed; setTimeout(close, 4000); return; }
        debriefSb.rpc("submit_exam_debrief", { p_hub:hub.id, p_exam:examId, p_visitor:me, p_answers:answers }).then(function(r){
          box.innerHTML = (!r.error && r.data === true) ? thanks : failed; setTimeout(close, 3600);
        }, function(){ box.innerHTML = failed; setTimeout(close, 4000); });
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
    function show(rows){
      var sv = rows && rows[0];
      if (!sv || ls("sh_survey_done_" + sv.id)) return;
      var qs = Array.isArray(sv.questions) ? sv.questions.slice(0, 5) : [];
      if (!qs.length) return;
      if (document.querySelector(".survey")) return;   /* a check-in opened from a card is already up: the survey waits for the next visit */
      var answers = {};
      var box = document.createElement("section");
      box.className = "survey"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Quick survey");
      var h = '<button type="button" class="survey-x" aria-label="Later">×</button><div class="survey-eyebrow">Quick survey · ' +
        (qs.length === 1 ? "1 question" : qs.length + " questions") + '</div><h3>' + esc(sv.title) + '</h3>';
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
      box.innerHTML = h;
      root.appendChild(box);
      requestAnimationFrame(function(){ box.classList.add("is-shown"); });
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
        try{ localStorage.setItem("sh_survey_done_" + sv.id, "1"); }catch(e){}
        /* "Later" (null) stops the pop-up, but the survey waits in the Inbox (widget/replies.js) until it's answered */
        sb.rpc("submit_survey", { p_survey:sv.id, p_visitor:me, p_answers:payload }).then(function(){
          if (window.shReplies && window.shReplies.refresh) window.shReplies.refresh();
        }, function(){});
        if (!thanks){
          box.innerHTML = '<div class="survey-eyebrow">Quick survey</div><p class="survey-thanks"><b>Saved to your Inbox.</b> Answer it there anytime.</p>';
          setTimeout(function(){ box.classList.remove("is-shown"); setTimeout(function(){ box.remove(); }, 350); }, 2200);
          return;
        }
        box.innerHTML = '<div class="survey-eyebrow">Quick survey</div><p class="survey-thanks"><b>Thank you!</b> This goes straight into what gets built next.</p>';
        setTimeout(function(){ box.classList.remove("is-shown"); setTimeout(function(){ box.remove(); }, 350); }, 2600);
      }
      box.addEventListener("input", refresh);
      /* answered from the Inbox while this card is still open */
      document.addEventListener("sh:survey-done", function(e){
        if (e.detail && e.detail.id === sv.id && box.isConnected){ box.classList.remove("is-shown"); setTimeout(function(){ box.remove(); }, 350); }
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
        if (e.target.closest(".survey-x, .survey-skip")) done(null, false);
        else if (e.target.closest(".survey-send") && !send.disabled) done(answers, true);
      });
    }
    function remote(){ sb.rpc("get_active_survey", { p_visitor:me }).then(function(res){ show(res && !res.error ? res.data : null); }, function(){}); }
    if (bootstrap && typeof bootstrap.then === "function") {
      bootstrap.then(function(data){ if (data && Array.isArray(data.survey_popup)) show(data.survey_popup); else remote(); }, remote);
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
  function paintName(){
    var name = localName || randomName;
    $("youName").innerHTML = (name ? "<b>" + esc(name) + "</b>" : "<b>No name yet</b>") +
      ' <button type="button" class="btn btn-text dx-rename" id="greetEdit" title="Change the name classmates see on the leaderboards">' + (localName ? "Change name" : "Pick your name") + "</button>";
  }
  function openNameEditor(){
    surveyVisitor();
    var dlg = dialog("nameH",
      '<h2 id="nameH">Your name</h2><p class="note">This is how classmates see you on the leaderboards, streak boards and ranks, in every hub.' +
      (!localName && randomName ? " Right now you have a random one: <b>" + esc(randomName) + "</b>." : "") + "</p>" +
      '<form class="dx-nameform"><input type="text" maxlength="24" autocomplete="nickname" enterkeyhint="done" aria-label="Your name" placeholder="Pick a name" value="' + esc(localName) + '"><button class="btn btn-primary" type="submit">Save</button></form>' +
      '<p class="note dx-namemsg" aria-live="polite"></p>' +
      (localName ? '<button class="btn btn-text dx-namereset" type="button">Go back to a random name</button>' : '<p class="note">Up to 24 characters. You can change it any time.</p>'), $("greetEdit"));
    var d = dlg.el, input = q("input", d), msg = q(".dx-namemsg", d);
    setTimeout(function(){ try{ input.select(); }catch(e){} }, 40);
    d.addEventListener("click", function(e){
      if (!e.target.closest(".dx-namereset")) return;
      localName = ""; lsSet("sh_display_name", null); track("name:reset");
      if (nameSb) nameSb.rpc("clear_display_name", { p_visitor: VISITOR }).then(function(r){ if (r && r.data){ randomName = r.data; paintName(); } }, function(){});
      paintName(); dlg.close();
    });
    q("form", d).addEventListener("submit", function(e){
      e.preventDefault();
      var v = input.value.trim().slice(0, 24);
      if (!v){ msg.textContent = "Type a name first."; input.focus(); return; }
      if (nameSb) nameSb.rpc("set_display_name", { p_visitor: VISITOR, p_name: v }).then(function(){}, function(){});
      track("name:set");
      localName = v; lsSet("sh_display_name", v); paintName();
      /* another, unlinked device already uses this name: ask whether it's theirs (widget/linkask.js) */
      if (window.shLinkAsk) window.shLinkAsk.check(v);
      msg.textContent = "Saved. Hi, " + v + "!";
      setTimeout(dlg.close, 700);
    });
  }
  paintName();
  $("youName").addEventListener("click", function(e){ if (e.target.closest("#greetEdit")) openNameEditor(); });

  /* Settings: the same keys the hubs' Settings keep (widget/hub.js and widget/v3.js: keep the three lists in step), so a
     change here shows in every hub. The font choice, background music and the accent metal are cut (plan, 4.6). */
  var EXTRAS = [
    ["sh_pref_pet", "Timmy Tooth", "Your cartoon tooth buddy. Right answers and study streaks keep him healthy.", [["on", "Everywhere"], ["dash", "Dashboard only"], ["off", "Off"]]],
    ["sh_pref_eggs", "Hidden secrets", "Holidays, magic words and the other easter eggs. Clues are in each hub's trophy case."],
    ["sh_pref_boss", "Plaque bosses", "A boss the whole class fights with right answers when 5+ people are online."],
    ["sh_pref_fairy", "Tooth Fairy", "Flies across the page now and then. Catch her for the fairy board."],
    ["sh_pref_probe", "Golden Probe", "One question a day is golden. First to get it right wins."],
    ["sh_pref_arch", "Full Arch chart", "A 32-tooth chart in the corner that fills as you answer right."],
    ["sh_pref_nuke", "Tactical nukes", "100 right in a row unlocks a strike. Mine only: you won't see classmates' strikes.", [["on", "On"], ["mine", "Mine only"], ["off", "Off"]]],
    ["sh_pref_celebrate", "Rank-up and trophy cards", "The rank-up cutscene, level-up, trophy and medal cards."],
    ["sh_pref_cheers", "Streak cheers", "Confetti and a toast every 5 right in a row."],
    ["sh_pref_fx", "Answer animations", "Pops, shakes, sweeps and fades. Off keeps the check and X marks."]
  ];
  function prefSet(k, v){ lsSet(k, v); try { document.dispatchEvent(new CustomEvent("sh:pref", { detail: { key: k, val: v } })); } catch (e) {} }
  function seg(key, opts, cur){ return '<span class="seg" role="group" data-key="' + esc(key) + '">' + opts.map(function(o){ return '<button type="button" data-val="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + "</button>"; }).join("") + "</span>"; }
  /* Focus mode (Sam, 2026-11-06): one switch that turns every extra off, and back to what you had. Same keys as widget/hub.js. */
  var FOCUS_KEYS = EXTRAS.map(function(x){ return x[0]; }).concat(["sh_pref_flame"]);
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
        '<div class="set-row"><div><b>Your name</b><small>What classmates see on the leaderboards' + (localName || randomName ? ": " + esc(localName || randomName) : "") + '.</small></div><button class="btn" type="button" data-name>Change your name</button></div></section>' +
      '<section class="panel" aria-labelledby="sxH"><h3 id="sxH">Timmy and the extras</h3><p class="note">The fun stuff that isn\'t studying, in every hub.</p><div data-extras>' + extrasHTML() + "</div></section></div>", $("setBtn"));
    var body = dlg.el; body.classList.add("dx-dlg-wide");
    function paintFocus(){ var fp = q(".focus-panel", body); fp.classList.toggle("is-on", focusOn()); fp.innerHTML = focusRowHTML(); }
    body.addEventListener("click", function(e){
      if (e.target.closest("[data-focus]")) {
        var on = !focusOn(); setFocus(on); paintFocus(); q("[data-extras]", body).innerHTML = extrasHTML();
        track("settings:focus=" + (on ? "on" : "off")); toast(on ? "Focus mode is on. Every extra is off." : "Focus mode is off. Your extras are back.");
        if (window.shPet) window.shPet.refresh();
        q("[data-focus]", body).focus(); return;
      }
      if (e.target.closest("[data-name]")) { dlg.close(); openNameEditor(); return; }
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
  function renderMyRank(p){
    var R = window.shRanks, el = $("meRank"); if (!R || !el) return;
    p = p || { xp: 0, tier: 0, level: 1, step: 0, step_at: 0, next_at: 100 };
    var t = p.tier || 0, lv = p.level || 1, step = p.step != null ? p.step : t * 3, xp = p.xp || 0;
    var at = p.step_at != null ? p.step_at : 0, next = p.next_at, pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1;
    var nextName = next ? R.rankName(Math.floor((step + 1) / 3), (step + 1) % 3 + 1) : "";
    var medals = R.flair && R.flairFromBadges && R.flairFromBadges(p.badges) ? R.flair(R.flairFromBadges(p.badges), { list: true }) : "";
    el.innerHTML = '<div class="dx-rankart">' + R.art(t, 64, { level: lv }) + "</div>" +
      '<div class="dx-rankbody"><p class="dx-rankname"><b>' + esc(R.rankName(t, lv)) + '</b><span class="num">' + num(xp) + " XP" + (p.position ? " · #" + p.position + " of " + p.of : "") + "</span></p>" +
      '<div class="dx-bar2 dx-rankbar" role="progressbar" aria-label="Progress to ' + esc(nextName || "the top") + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct * 100) + '"><i style="width:0%"></i></div>' +
      '<p class="note">' + (!xp ? "Answer a question in any hub to start earning XP." : next ? '<b class="num">' + num(next - xp) + " XP</b> to " + esc(nextName) : "The highest rank there is.") + "</p></div>" +
      (medals ? '<div class="dx-medals"><span class="note">Mastery</span>' + medals + "</div>" : "");
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ var i = q(".dx-rankbar i", el); if (i) i.style.width = (pct * 100).toFixed(1) + "%"; }); });
    var pill = $("dxRank");
    pill.innerHTML = '<span class="sr">Your rank: ' + esc(R.rankName(t, lv)) + ", " + num(xp) + ' XP</span><span class="dx-seen" aria-hidden="true">' + R.mini(t, lv) + "<b>" + esc(R.rankName(t, lv)) + '</b><span class="num dx-fold">' + num(xp) + " XP</span></span>";
    pill.hidden = false;
  }
  /* your own rank: the card, Timmy's flair and the rank-up celebration. It rides in the page bootstrap. */
  function applyMyRank(p){
    myRank = p; renderMyRank(p);
    if (window.shRanks && window.shRanks.track) window.shRanks.track(p); else lsSet("sh_rank_tier", String(p.tier || 0));
    if (window.shRanks && window.shRanks.flairFromBadges){ lsSet("sh_rank_flair", window.shRanks.flairFromBadges(p.badges)); }
    if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(p.badges);
    try{ document.dispatchEvent(new CustomEvent("sh:rank")); }catch(e){}
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
  function renderYouStats(){
    var by = weekBy || localDays(), today = dayStart(new Date()), keys = [], a7 = 0, c7 = 0;
    for (var i = 0; i < 60; i++){ var d = new Date(today); d.setDate(d.getDate() - i); keys.push(ymd(d)); }
    var streak = 0, j = by[keys[0]] ? 0 : 1;
    while (j < keys.length && by[keys[j]]) { streak++; j++; }
    keys.slice(0, 7).forEach(function(k){ if (by[k]) { a7 += by[k].a || 0; c7 += by[k].c || 0; } });
    $("youStats").innerHTML =
      '<li class="dx-stat s-flame">' + flame(streak) + '<span><b class="num">' + streak + "</b> " + (streak === 1 ? "day" : "days") + "<small>" + (streak ? "Study streak" : "Answer one question to start a streak") + "</small></span></li>" +
      (weekSource === "server" ? '<li class="dx-stat"><span><b class="num">' + num(a7) + "</b> " + (a7 === 1 ? "answer" : "answers") + "<small>This week" + (a7 ? ", " + Math.round(c7 / a7 * 100) + "% right" : "") + "</small></span></li>" : "");
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
  /* the game layer's function when the database has it (<name>_v2, migration_v54), today's otherwise */
  var V2 = C.v2 === false ? false : null;
  function missing(r){ var e = r && r.error; return !!e && (e.code === "PGRST202" || e.code === "42883" || r.status === 404 || /could not find the function|does not exist/i.test(e.message || "")); }
  function rpc2(sb, name, args){
    if (V2 === false) return sb.rpc(name, args);
    return sb.rpc(name + "_v2", args).then(function(r){
      if (missing(r)) { V2 = false; return sb.rpc(name, args); }
      V2 = true; return r;
    }, function(){ return sb.rpc(name, args); });
  }
  function dashboardBootstrap(sb){
    var boot = { data: null, ready: Promise.resolve(null), linkName: localName || "" };
    if (!sb || !VISITOR) { window.shBootstrap = boot; return boot; }
    try {
      boot.ready = rpc2(sb, "get_widget_bootstrap", {
        p_visitor: VISITOR, p_hub: null, p_cavity_week: null, p_episode: null, p_include_pins: false, p_dashboard: true,
        p_luck_hub: luckFor ? luckFor.hub : null, p_luck_date: luckFor ? luckFor.date : null, p_link_name: boot.linkName || null
      }).then(function(r){
        if (!r || r.error || !r.data || typeof r.data !== "object") return null;
        boot.data = r.data; return boot.data;
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

  /* ---------- the class board: ranks, study streaks, arcade high scores (one at a time) ---------- */
  var boardSb = null, boardNow = "ranks", boardOpen = false;
  var BOARD_NOTE = {
    ranks: "XP from every hub: 10 for a new question right, 2 for a repeat, 1 for trying, 20 per day studied. Every rank has levels I, II and III.",
    streaks: "Days in a row with at least one answer.",
    arcade: ""
  };
  function rankMini(t, lv){ return window.shRanks && t != null ? window.shRanks.mini(t, lv) : ""; }
  /* a row's name with its mastery medals (`flair`) */
  function nameFlair(r, extra){
    var f = window.shRanks && window.shRanks.flair ? window.shRanks.flair(r.flair, { who: r.display_name }) : "";
    return '<span class="nm-t">' + esc(r.display_name) + (extra || "") + "</span>" + f;
  }
  /* a row carries its visit key (the _v2 boards, migration_v54) as data-visit: Timmy's place (phase 4) opens from it */
  function rowHTML(r, place, mid, val, unit){
    return "<li" + (r.is_me ? ' class="me"' : "") + (r.visit ? ' data-visit="' + esc(r.visit) + '"' : "") + '><span class="rk num">' + place + '</span><span class="nm">' + rankMini(r.tier, r.level) + nameFlair(r, r.is_me ? " (you)" : "") + "</span>" +
      (mid ? '<span class="lvl">' + esc(mid) + "</span>" : "") + '<span class="val num">' + val + "<small>" + unit + "</small></span></li>";
  }
  function boardMsg(msg){ $("board").innerHTML = '<p class="note">' + esc(msg || "Couldn't reach the class data just now. Reload to try again.") + "</p>"; }
  function drawBoard(){
    var sb = boardSb, which = boardNow;
    $("boardNote").textContent = BOARD_NOTE[which]; $("boardNote").hidden = !BOARD_NOTE[which];
    $("arcadePick").hidden = which !== "arcade"; $("ladderFold").hidden = which !== "ranks" || !window.shRanks;
    if (!sb) { boardMsg(); return; }
    $("board").innerHTML = '<p class="note">Loading…</p>';
    if (which === "ranks") {
      rpc2(sb, "get_rank_board", { p_visitor: VISITOR || null, p_limit: 10 }).then(function(res){
        if (boardNow !== which) return;
        var rows = (res && res.data) || [], R = window.shRanks;
        if (!rows.length || !R){ boardMsg("No ranks yet. Answer a question in any hub to get your first handpiece."); return; }
        $("board").innerHTML = '<ol class="dx-board">' + rows.map(function(r){ return rowHTML(r, r.rnk, R.rankName(r.tier, r.level || R.levelFor(r.xp)), num(r.xp), "XP"); }).join("") + "</ol>";
        var me = rows.filter(function(r){ return r.is_me; })[0];
        $("rankLadder").innerHTML = R.TIERS.map(function(t, i){
          var mine = me && me.tier === i;
          return '<div class="dx-rung' + (mine ? " me" : "") + '">' + R.art(i, 56, { animate: false, level: mine ? (me.level || R.levelFor(me.xp)) : 0 }) + "<b>" + esc(t.name) + '</b><span class="note num">' + (i ? num(t.at) + " XP" : "Start") + (mine ? " · you" : "") + "</span></div>";
        }).join("");
      }, function(){ if (boardNow === which) boardMsg(); });
    } else if (which === "streaks") {
      rpc2(sb, "get_leaderboard", { p_limit: 8 }).then(function(res){
        if (boardNow !== which) return;
        var rows = (res && res.data) || [];
        if (!rows.length){ boardMsg("No streaks yet. Answer questions two days in a row to start one."); return; }
        $("board").innerHTML = '<ol class="dx-board">' + rows.map(function(r, i){ return rowHTML(r, i + 1, "", r.streak, r.streak === 1 ? "day" : "days"); }).join("") + "</ol>";
      }, function(){ if (boardNow === which) boardMsg(); });
    } else drawArcade();
  }
  function drawArcade(){
    var sb = boardSb, hk = "sh_dash_arcade_hub", key = "sh_dash_arcade_game", pick = $("arcadePick");
    if (!ARCADES.length) { boardMsg("No arcade scores yet."); return; }
    var hubSel = ls(hk) || (selected && ARCADES.some(function(a){ return a.hub === selected; }) ? selected : ARCADES[0].hub);
    if (!ARCADES.some(function(a){ return a.hub === hubSel; })) hubSel = ARCADES[0].hub;
    var a = ARCADES.filter(function(x){ return x.hub === hubSel; })[0], game = ls(key + ":" + a.hub) || a.games[0][0];
    if (!a.games.some(function(g){ return g[0] === game; })) game = a.games[0][0];
    var name = a.games.filter(function(g){ return g[0] === game; })[0][1], money = (a.money || []).indexOf(game) > -1;
    pick.innerHTML = '<label class="dx-pick"><span>Arcade</span><span class="dx-select"><select id="arcHub" aria-label="Arcade">' + ARCADES.map(function(x){ return '<option value="' + esc(x.hub) + '"' + (x.hub === hubSel ? " selected" : "") + ">" + esc(x.title) + "</option>"; }).join("") + "</select>" + icon("chevron", 18, "rot") + "</span></label>" +
      '<label class="dx-pick"><span>Game</span><span class="dx-select"><select id="arcGame" aria-label="Arcade game">' + a.games.map(function(g){ return '<option value="' + esc(g[0]) + '"' + (g[0] === game ? " selected" : "") + ">" + esc(g[1]) + "</option>"; }).join("") + "</select>" + icon("chevron", 18, "rot") + "</span></label>";
    $("arcHub").addEventListener("change", function(e){ lsSet(hk, e.target.value); drawBoard(); });
    $("arcGame").addEventListener("change", function(e){ lsSet(key + ":" + a.hub, e.target.value); drawBoard(); });
    rpc2(sb, "get_arcade_leaderboard", { p_hub: a.hub, p_game: game, p_visitor: VISITOR || null, p_limit: 5 }).then(function(res){
      if (boardNow !== "arcade") return;
      var rows = (res && res.data) || [];
      if (!rows.length){ boardMsg("No " + name + " scores yet. Finish a game in the hub's Arcade to claim first place."); return; }
      $("board").innerHTML = '<ol class="dx-board">' + rows.map(function(r){ return rowHTML(r, r.rnk, "", (money ? "$" : "") + num(r.best), r.plays + (r.plays == 1 ? " play" : " plays")); }).join("") + "</ol>";
    }, function(){ if (boardNow === "arcade") boardMsg(); });
  }
  $("boardSeg").addEventListener("click", function(e){
    var b = e.target.closest("[data-board]"); if (!b || b.getAttribute("data-board") === boardNow) return;
    boardNow = b.getAttribute("data-board"); track("dash:board=" + boardNow);
    qa("[data-board]", $("boardSeg")).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
    boardOpen = true; drawBoard();
  });

  /* ---------- hub recaps: archived hubs' recap images (published from the admin page), drawn with widget/recap.js and
     played as a slideshow ---------- */
  function loadRecaps(sb, bootstrap){
    function show(rows){
      rows = Array.isArray(rows) ? rows : [];
      if (!rows.length) return;
      if (!document.getElementById("recapFonts")) {
        var l = document.createElement("link"); l.id = "recapFonts"; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Work+Sans:wght@500;600;700&display=swap";
        document.head.appendChild(l);
      }
      var fonts = function(){ return document.fonts ? Promise.race([
        Promise.all(["600 40px Fraunces", "500 20px 'Work Sans'", "600 20px 'Work Sans'", "700 20px 'Work Sans'"].map(function(f){ return document.fonts.load(f); })),
        new Promise(function(r){ setTimeout(r, 2500); })]).catch(function(){}) : Promise.resolve(); };
      loadScriptOnce(WIDGET + "recap.js").then(fonts).then(function(){ startRecapShow(rows); }, function(){});
    }
    function remote(){ sb.rpc("get_published_recaps").then(function(res){ show(res && !res.error ? res.data : null); }, function(){}); }
    bootstrap.then(function(data){ if (data && Array.isArray(data.recaps)) show(data.recaps); else remote(); }, remote);
  }
  function startRecapShow(rows){
    var R = window.shRecap; if (!R || !rows.length) return;
    var stage = $("rcsStage"), list = $("rcsList"), wrap = $("rcs"), ms = 8000, cur = -1, paused = 0, hidden = false, still = reduced();
    var slides = rows.map(function(row){
      var c = document.createElement("canvas");
      R.draw(c, row.data, { title: row.title, color: row.color, names: row.names, question: row.question, footnote: row.footnote });
      var im = new Image(), d = row.data || {};
      im.className = "rcs-slide"; im.decoding = "async"; im.draggable = false;
      im.alt = row.title + " recap: " + num(Math.round((d.minutes || 0) / 60)) + " hours studied by " + (d.people || 0) + " classmates, " +
        num(d.answers) + " questions answered, " + (d.answers ? Math.round(d.correct / d.answers * 100) : 0) + "% correct.";
      im.src = c.toDataURL("image/png");
      im.dataset.ratio = c.height / c.width;
      im.setAttribute("aria-hidden", "true");
      stage.appendChild(im);
      return { row: row, img: im };
    });
    list.innerHTML = slides.map(function(s, i){
      var d = s.row.data || {};
      return '<li><button type="button" data-rc="' + i + '"><span class="dot" style="background:' + esc(s.row.color || "#999") + '"></span>' + esc(s.row.title) +
        '<span class="when">' + (d.exam_day ? esc(parseYmd(String(d.exam_day).slice(0, 10)).toLocaleDateString(undefined, { month: "short", day: "numeric" })) : "") + '</span><span class="bar"></span></button></li>';
    }).join("");
    wrap.style.setProperty("--rcs-ms", ms + "ms");
    var single = slides.length < 2;
    $("rcsPrev").hidden = $("rcsNext").hidden = $("rcsCount").hidden = single; list.hidden = single;
    function fit(){ var s = slides[cur]; if (s && stage.clientWidth) stage.style.height = Math.round(stage.clientWidth * +s.img.dataset.ratio) + "px"; }
    function go(i, dir){
      i = (i + slides.length) % slides.length; if (i === cur) return;
      var prev = slides[cur], next = slides[i];
      if (dir === undefined) dir = i > cur ? 1 : -1;
      /* park the incoming slide on the side it enters from, then let both transition */
      next.img.classList.remove("is-before", "is-active");
      if (dir < 0) next.img.classList.add("is-before");
      void next.img.offsetWidth;
      if (prev) { prev.img.classList.remove("is-active"); prev.img.classList.toggle("is-before", dir > 0); prev.img.setAttribute("aria-hidden", "true"); }
      next.img.classList.remove("is-before"); next.img.classList.add("is-active"); next.img.removeAttribute("aria-hidden");
      cur = i; fit();
      var d = next.row.data || {}, acc = d.answers ? Math.round(d.correct / d.answers * 100) : 0;
      $("rcsCount").textContent = (i + 1) + " of " + slides.length;
      $("rcsTitle").textContent = next.row.title;
      $("rcsSub").innerHTML = "<b>" + num(Math.round((d.minutes || 0) / 60)) + " hours</b> studied by <b>" + (d.people || 0) + " classmates</b>, " +
        "<b>" + num(d.answers) + "</b> questions answered at <b>" + acc + "%</b>." +
        (d.exam_day ? " Exam " + esc(parseYmd(String(d.exam_day).slice(0, 10)).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })) + "." : "");
      var save = $("rcsSave"); save.href = next.img.src; save.setAttribute("download", next.row.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + "-recap.png");
      qa("[data-rc]", list).forEach(function(b){
        var on = +b.getAttribute("data-rc") === i; b.setAttribute("aria-current", on ? "true" : "false");
        var bar = q(".bar", b); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
      });
      if (still && !single) restartTimer();
    }
    /* autoplay: the active list item's bar animates for 8 s; when it finishes, advance. Hover, focus or a hidden tab pause it. */
    var rmTimer = null;
    function restartTimer(){ clearTimeout(rmTimer); if (!paused && !hidden) rmTimer = setTimeout(function(){ go(cur + 1, 1); }, ms); }
    list.addEventListener("animationend", function(e){ if (e.animationName === "rcsTimer" && !still) go(cur + 1, 1); });
    function setPaused(){ wrap.classList.toggle("is-paused", paused > 0 || hidden); if (still) { if (paused || hidden) clearTimeout(rmTimer); else restartTimer(); } }
    wrap.addEventListener("mouseenter", function(){ paused++; setPaused(); });
    wrap.addEventListener("mouseleave", function(){ paused = Math.max(0, paused - 1); setPaused(); });
    wrap.addEventListener("focusin", function(){ paused++; setPaused(); });
    wrap.addEventListener("focusout", function(){ paused = Math.max(0, paused - 1); setPaused(); });
    document.addEventListener("visibilitychange", function(){ hidden = document.hidden; setPaused(); });
    $("rcsPrev").addEventListener("click", function(){ go(cur - 1, -1); });
    $("rcsNext").addEventListener("click", function(){ go(cur + 1, 1); });
    list.addEventListener("click", function(e){ var b = e.target.closest("[data-rc]"); if (b) go(+b.getAttribute("data-rc")); });
    stage.addEventListener("keydown", function(e){
      if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1, 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1, -1); }
    });
    /* swipe on phones */
    var sx = null;
    stage.addEventListener("pointerdown", function(e){ sx = e.clientX; });
    stage.addEventListener("pointerup", function(e){ if (sx === null || single) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
    window.addEventListener("resize", fit);
    wrap.hidden = false; showPast();
    go(0, 1);
    if (single) wrap.classList.add("is-paused");
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

  /* ---------- What's new, and each hub's "Updated", from the changelog every deploy logs to ---------- */
  var latestBy = null;
  function applyUpdated(){
    if (!latestBy) return;
    qa(".updated[data-hub]").forEach(function(el){
      var best = latestBy[el.getAttribute("data-hub")] || null;
      if (latestBy.all && (!best || latestBy.all > best)) best = latestBy.all;
      if (best) el.textContent = "Updated " + relDay(new Date(best));
    });
  }
  function loadChangelog(){
    rest("changelog?select=hub,message,created_at&order=created_at.desc&limit=40").then(function(rows){
      if (!rows || !rows.length) return;
      /* the freshest entry per hub drives its "Updated" (a row's hub can be "all" or a comma list) */
      latestBy = {};
      rows.forEach(function(r){ String(r.hub || "").toLowerCase().split(/[,\s]+/).filter(Boolean).forEach(function(t){ if (!latestBy[t] || r.created_at > latestBy[t]) latestBy[t] = r.created_at; }); });
      applyUpdated();
      /* the timeline, grouped by calendar day */
      var order = [], groups = {};
      rows.slice(0, 20).forEach(function(r){
        var d = new Date(r.created_at), k = ymd(d);
        if (!groups[k]){ groups[k] = { date: d, items: [] }; order.push(k); }
        var tok = String(r.hub || "").toLowerCase();
        var badge = HUB_LABEL[tok] ? '<span class="dx-tag tinted" style="' + tintVars(tok) + '">' + esc(HUB_LABEL[tok]) + "</span>" : "";
        groups[k].items.push("<li>" + badge + esc(r.message) + "</li>");
      });
      var tl = $("timeline");
      tl.innerHTML = order.map(function(k){
        var g = groups[k], rel = relDay(g.date);
        var label = (rel === "today" || rel === "yesterday") ? rel.charAt(0).toUpperCase() + rel.slice(1) : g.date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return '<li class="dx-day"><h3 class="dx-date">' + esc(label) + '</h3><ul class="dx-items">' + g.items.join("") + "</ul></li>";
      }).join("");
      $("changelog").hidden = false;
      var more = $("tlMore");
      if (order.length > 2){
        more.hidden = false;
        more.addEventListener("click", function(){ var c = tl.classList.toggle("is-collapsed"); more.textContent = c ? "Show earlier updates" : "Show fewer"; });
      }
    }).catch(function(){});
  }
  /* "this page was updated", for tabs left open */
  function watchUpdates(){
    var baseline = null, shown = false;
    function show(){
      if (shown) return; shown = true;
      var t = document.createElement("div"); t.className = "dx-update"; t.setAttribute("role", "status");
      t.innerHTML = '<span>A newer version of the hubs is live.</span><button type="button" class="btn btn-primary" data-reload>Reload</button><button type="button" class="dx-ib" aria-label="Dismiss" data-dismiss>' + icon("close", 18) + "</button>";
      root.appendChild(t);
      q("[data-reload]", t).addEventListener("click", function(){ location.reload(); });
      q("[data-dismiss]", t).addEventListener("click", function(){ t.remove(); });
    }
    function check(){
      rest("changelog?select=created_at&order=created_at.desc&limit=1").then(function(rows){
        if (!rows || !rows.length) return;
        if (baseline === null){ baseline = rows[0].created_at; return; }
        if (new Date(rows[0].created_at) > new Date(baseline)) show();
      }).catch(function(){});
    }
    check(); setInterval(check, 4 * 60 * 1000);
  }

  /* ---------- the tour (widget/tour.js): no question on arrival; "Take the tour" in the menu runs it, with this page's own steps ---------- */
  function petOn(){ return (ls("sh_pref_pet") || "on") !== "off"; }
  window.SH_TOUR = { prompt: false, steps: function(o){
    var S = [{ title: "Welcome to Study Hubs", body: "<p>A quick look at this page, on the real buttons. It takes under a minute, and each hub has its own tour inside it.</p><p>Use <b>Next</b> and <b>Back</b> (or the arrow keys). Start it again any time from the menu at the top.</p>" }];
    if (HUBS.length) {
      S.push({ el: ".dx-tabs", title: "Your hubs", body: "<p>One tab per hub, the next exam's first. Each shows how many days are left.</p>" });
      S.push({ el: ".dx-hero", title: "The next exam", body: "<p>The countdown, <b>Start studying</b>, the <b>Daily drill</b> and how far you've got in this hub. The day before an exam you can send the class some luck from here.</p>" });
      S.push({ el: ".dx-hubrow", title: "What's in this hub", body: "<p>What the hub covers, its other exams and its Timmy Time episode when it has one. After an exam, <b>Check in</b> shows up under it.</p>" });
    }
    S.push({ el: "#you", title: "You", body: "<p>The name classmates see, your handpiece rank and XP from every hub, your mastery medals and your study streak." + (petOn() ? " Timmy Tooth lives here once you've met him: study and he stays healthy." : "") + "</p>" });
    S.push({ el: "#class", title: "The class", body: "<p>The top ten by XP, the longest study streaks and the arcade high scores, with when the class studies most underneath.</p>" });
    if (o.visible($("ideas"))) S.push({ el: "#ideas", title: "The idea board", body: "<p>Post an idea for the hubs and vote on your classmates'.</p>" });
    if (o.visible($("past"))) S.push({ el: "#past", title: "Past hubs", body: "<p>A recap of how the class studied for each exam that's done, and the check-in for a hub that just closed.</p>" });
    S.push({ el: "#inboxBtn", title: "Inbox", body: "<p>Replies to your reports and suggestions, notices to the whole class and the occasional short survey. A number on it means something new.</p>" });
    S.push({ el: "#setBtn", title: "Settings", body: "<p>Focus mode, the theme, text size, your name, Timmy and the extras. Set them once here and every hub follows.</p>" });
    S.push({ el: "#menuBtn", title: "About and this tour", body: "<p>The full guide to every feature, trophy and easter egg, the light or dark switch, and this tour.</p>", last: true });
    return S;
  } };
  function tourIdle(fn){ if (window.shTour) window.shTour.whenIdle(fn); else fn(); }
  $("tourBtn").addEventListener("click", function(){
    menu(false);
    loadScriptOnce(WIDGET + "tour.js").then(function(){ if (window.shTour) window.shTour.start(); }, function(){ toast("The tour didn't load. Try again in a moment."); });
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
    /* Timmy (widget/pet.js): until he's adopted he waits on the "you" card's porch (dash.css shows it only while he's
       there), then he lives in the card. He places himself once and on a resize, so tell him when the page above him
       changes height (another hub's tab, a card that loads). */
    if (window.shPet) {
      window.shPet.mount({ where: "dashboard", sb: sb, visitor: VISITOR,
        name: function(){ return localName || randomName; },
        perch: function(){ return $("petPerch"); },
        home: function(){ return $("petHome"); }, bootstrap: bootstrap.ready });
      if (window.ResizeObserver) {
        var nudge = 0;
        new ResizeObserver(function(){
          if (!q(".shpet-perch")) return;
          clearTimeout(nudge); nudge = setTimeout(function(){ try { window.dispatchEvent(new Event("resize")); } catch (e) {} }, 60);
        }).observe($("hubs"));
      }
    }
    if (!sb){ renderMyRank(null); whenPanelOpens($("class"), function(){ boardOpen = true; drawBoard(); }); return; }
    nameSb = sb; luckSb = sb; debriefSb = sb; boardSb = sb;
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
          try{ liveBy[hub] = Object.keys(ch.presenceState()).length || 0; }catch(e){ liveBy[hub] = 0; }
          var t = 0; Object.keys(liveBy).forEach(function(k){ t += liveBy[k] || 0; }); $("liveCount").textContent = t;
          var line = $("hubLive"); if (line && selected === hub) line.innerHTML = liveLine(h);
        });
        ch.subscribe();
      }catch(e){}
    });
    setTimeout(function(){ if ($("liveCount").textContent === "–") $("liveCount").textContent = "0"; }, 6000);

    /* what gets clicked (widget/clicks.js), report replies and notices (widget/replies.js), "is this your other device?" (widget/linkask.js) */
    if (window.shClicks) window.shClicks.start({ sb: sb, hub: "dashboard", visitor: VISITOR, section: function(){ return "dashboard"; } });
    if (window.shReplies) window.shReplies.start({ sb: sb, visitor: VISITOR || null, hub: "dashboard", bootstrap: bootstrap.ready });
    if (window.shLinkAsk) window.shLinkAsk.start({ sb: sb, hub: "dashboard", bootstrap: bootstrap.ready, bootstrapName: bootstrap.linkName });

    /* after an exam, its check-in takes the survey's place for that visit; both wait while the tour is on screen */
    /* one thing at a time at the bottom of the screen: the check-in or a survey waits while a reply to your report
       (widget/replies.js) is still showing, up to five minutes */
    var held = 0;
    function askNext(){
      if (q(".sh-reply") && held++ < 200) { setTimeout(askNext, 1500); return; }
      tourIdle(function(){ if (!autoDebrief()) startSurvey(sb, bootstrap.ready); });
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

    /* the class board, and when people study as a line under it */
    whenPanelOpens($("class"), function(){
      if (!boardOpen) { boardOpen = true; drawBoard(); }
      sb.from("presence_hourly").select("hour_of_day,ping_count").then(function(res){
        var rows = (res && res.data) || []; if (!rows.length) return;
        var by = {}, max = 0, peak = 0, nowH = new Date().getHours();
        rows.forEach(function(r){ by[r.hour_of_day] = (by[r.hour_of_day] || 0) + r.ping_count; });
        for (var h = 0; h < 24; h++){ if ((by[h] || 0) > max){ max = by[h]; peak = h; } }
        if (!max) return;
        var share = Math.round((by[nowH] || 0) / max * 100), el = $("hoursLine");
        el.innerHTML = icon("clock", 18) + "<span><b>When people study.</b> Busiest around <b>" + hourLabel(peak) + "</b>" +
          (nowH === peak ? ", which is right now." : "; right now runs at " + share + "% of that.") + "</span>";
        el.hidden = false;
      }, function(){});
    });
  }
  /* The page is drawn from this device's own data first. The class's data and the shared widgets (ranks, Timmy, the
     Inbox, click counts) come after, in this order, so the first screen doesn't wait for them on a slow phone. A page
     that lists one of them itself is left alone. */
  var LATE = ["vendor/supabase-2.117.2.js", "clicks.js", "replies.js", "linkask.js", "ranks.js", "pet.js", "timmy.js"];
  function loadLate(done){
    var need = LATE.filter(function(f){ return !q('script[src$="' + f + '"]'); }), left = need.length;
    if (!left) { done(); return; }
    need.forEach(function(f){
      var s = document.createElement("script"); s.src = WIDGET + f; s.async = false;   /* in order, as they were on the page */
      s.onload = s.onerror = function(){ if (!--left) done(); };
      document.head.appendChild(s);
    });
  }
  function afterDraw(){ loadLate(startClassData); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", afterDraw); else afterDraw();

  /* offline copy of the dashboard and hubs (sw.js); best-effort */
  if ("serviceWorker" in navigator && window.isSecureContext) { try { navigator.serviceWorker.register(ROOT + "sw.js"); } catch (e) {} }

  /* refresh the countdowns if the tab stays open past midnight, and apply an archive time or an override's end that
     passes while the page is open */
  var dayKey = ymd(new Date());
  setInterval(function(){
    if (ymd(new Date()) !== dayKey){ dayKey = ymd(new Date()); hubSig = partitionHubs(); redraw(); }
    else applyHubStates();
  }, 60 * 1000);

  window.shDash = { redraw: redraw, hubs: function(){ return HUBS.slice(); }, tint: tintVars, icon: icon };
})();
