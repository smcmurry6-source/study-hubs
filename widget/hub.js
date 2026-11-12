/* ============ THE HUB ENGINE (widget/hub.js + widget/hub.css): the redesign, phase 1 ============
   One engine for every redesigned hub. Only the new versions load it (hubs/<id>/next/): nothing links to them, and
   outside a preview their page sends the visitor to the live hub. The live hubs keep widget/v3.js and their own code
   until the redesign is released all at once (vault/tasks/2026-11-06-redesign-release.md).

   A hub's page is configuration (window.SH_HUB), its art (widget/hub-art/<hub>.js: tint, emblem, masthead, built by
   tools/figures/site/build.mjs) and its content, in files next to it (content/), written from the live hub by
   tools/hub-next/build.mjs (CI's --check fails when they're stale):
     core.json       lectures, exams, dates, likely topics, the mock's blueprint, the podcast, the question index
     questions.json  the bank;  notes.json  the notes at both levels and High yield;  study.json  hints, cram, review charts
     figures.js/css  the drawn figures and case pictures;  arcade.js/css  the arcade's games and its skin
   Only core.json comes before the first screen; the rest loads in the background or when a view needs it.

   It keeps everything progress is keyed on: the hub id, the question ids, the hub's own state key (the same shape as
   the live hub's STATE) and its answered event (the same detail as the live recordAnswer), so everyone's answers, XP,
   ranks, pins, spaced review and question health carry over at the release. Then it loads widget/v3.js like any hub.

   The engine is four files, loaded by each hub's page in this order (all deferred, this one last):
     widget/hub-rewards.js  what an answer earns: the answer path, XP, the rank, the bar's meters, Today, the recap
     widget/hub-timmy.js    what the engine asks of Timmy (widget/pet.js)
     widget/hub-bank.js     the question card, the bank with its panel and presets, the mock
     widget/hub.js          the core: helpers, drawings, state, content, the frame, routing, Home, Notes, More, boot
   A part registers itself in window.SH_HUB_PARTS; the core runs each one just before it boots and hands it HX, the
   one object the four share (see "the parts", at the end of this file). No part runs without the core.

   Views, as hash routes: #home · #notes/<lecture> · #questions[/drill|misses|weak|mock] · #more[/<page>]
   ============ */
(function(){
  "use strict";
  if (window.shHub) return;
  var C = window.SH_HUB || {}, A = window.SH_HUB_ART || { icons: {}, flame: {} }, AH = window.SH_HUB_ART_HUB || {};
  var HUB = C.hub || "hub", EVT = C.answeredEvent || (HUB + ":answered"), BASE = C.content || "content/";
  var WIDGET = C.widget || "../../../widget/", ASSETS = C.assets || "../";
  var docEl = document.documentElement;
  var reduced = false; try { reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  docEl.classList.add("shx");
  docEl.setAttribute("data-hx-hub", HUB);   /* the hub's tint on the page root too, for the shared widget's tokens (hub.css) */

  /* ---------- small helpers ---------- */
  function $(s, el){ return (el || document).querySelector(s); }
  function $$(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function h(html){ var t = document.createElement("template"); t.innerHTML = String(html).trim(); return t.content.firstElementChild; }
  function fmt(n){ return Number(n || 0).toLocaleString("en-US"); }
  function pl(n, one, many){ return fmt(n) + " " + (n === 1 ? one : (many || one + "s")); }
  function ymd(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function day(off){ var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (off || 0)); return ymd(d); }
  function calDays(iso){ var p = String(iso).split("-").map(Number), t = new Date(p[0], p[1] - 1, p[2]), n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((t - n) / 864e5); }
  function dateLabel(iso, o){ var p = String(iso).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2], 12).toLocaleDateString("en-US", o || { weekday: "short", month: "short", day: "numeric" }); }
  function timeLabel(hm){ if (!hm) return ""; var p = hm.split(":").map(Number), ap = p[0] >= 12 ? "pm" : "am", hr = p[0] % 12 || 12; return hr + (p[1] ? ":" + String(p[1]).padStart(2, "0") : "") + " " + ap; }
  function shuffled(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function seeded(arr, seed){ var a = arr.slice(), s = (seed | 0) || 1; function r(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; } for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function track(k){ try { if (window.shTrack) window.shTrack(k); } catch (e) {} }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function visible(el){ if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== "hidden"; }
  function toast(msg){
    var host = $("#hxToast"); if (!host) return;
    var t = h('<div class="hx-toast" role="status">' + esc(msg) + "</div>"); host.appendChild(t);
    setTimeout(function(){ t.classList.add("out"); setTimeout(function(){ t.remove(); }, 300); }, 2600);
  }

  /* ---------- the drawings (widget/hub-art.js and widget/hub-art/<hub>.js) ---------- */
  function icon(k, px, cls){
    var b = A.icons && A.icons[k] ? A.icons[k].body : ""; px = px || 20;
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>";
  }
  function artSvg(inner, vb, cls, label){ return '<svg class="' + (cls || "") + '" viewBox="' + vb + '" ' + (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + ' focusable="false">' + inner + "</svg>"; }
  /* Home's spot art (tools/figures/site/spots.mjs), as an image like every still drawing; its tint parts take the colors
     given ({ tint, light, line }), since an image can't read the page's CSS */
  function spot(k, col, cls){
    var S = (A.spots || {})[k]; if (!S) return "";
    var b = S.body.replace(/class="sp-tint"/g, 'fill="' + col.tint + '"').replace(/class="sp-tint-light"/g, 'fill="' + col.light + '"').replace(/class="sp-tint-line"/g, 'stroke="' + col.line + '"');
    return img(b, "", cls, S.vb);
  }
  /* a still drawing goes on the page as an image: its own document, so its ids never collide */
  function img(svg, alt, cls, vb){
    if (vb) svg = '<svg viewBox="' + vb + '">' + svg + "</svg>";
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return '<img class="' + (cls || "") + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '" alt="' + esc(alt || "") + '" decoding="async">';
  }
  function emblem(cls){
    var t = AH.tint || {}, e = AH.emblem || { body: "", label: "" };
    return img('<circle cx="32" cy="32" r="31" fill="' + (t.light || "#ece6ea") + '"/><g transform="translate(6.4 6.4) scale(.8)">' + e.body + "</g>", "", cls, "0 0 64 64");
  }
  function flameLevel(n){ return n >= 7 ? 3 : n >= 3 ? 2 : 1; }
  function flame(n, cls){ return artSvg(A.flame[flameLevel(n)] || "", "0 0 40 48", "flame" + (n ? "" : " is-cold") + (cls ? " " + cls : ""), ""); }
  function ring(done, of, cls){
    var r = 15, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, of ? done / of : 0));
    return '<svg class="ring' + (cls ? " " + cls : "") + (done >= of ? " is-met" : "") + '" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><circle class="tr" cx="18" cy="18" r="' + r + '"/>' +
      '<circle class="pr" cx="18" cy="18" r="' + r + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg>';
  }
  /* the select-all box (the other formats are plain rows, as on the live hubs): it ticks when picked; once answered
     it fills with a tick (right) or a cross (wrong), or goes dashed with a tick (a right answer you didn't tick) */
  var BOX = "M7.5 4.6c4.3-.3 8.9-.3 13.1 0 1.8.1 2.8 1.1 2.9 2.9.2 4.3.2 8.7 0 13-.1 1.8-1.2 2.8-3 2.9-4.3.3-8.7.3-13 0-1.8-.1-2.8-1.1-2.9-2.9-.3-4.3-.3-8.7 0-13 .1-1.8 1.1-2.8 2.9-2.9Z";
  var TICK = "M9 14.6l3.6 3.6 7-8.4", CROSS = "M10.2 10.2l7.6 7.6M17.8 10.2l-7.6 7.6";
  function mark(kind, state){
    var o = '<svg class="mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">', line = function(d, c){ return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'; };
    if (state === "right" || state === "wrong") return o + '<path d="' + BOX + '" fill="currentColor"/>' + line(state === "right" ? TICK : CROSS, "var(--on-mark)") + "</svg>";
    if (state === "missed") return o + '<path d="' + BOX + '" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>' + line(TICK, "currentColor") + "</svg>";
    return o + '<path d="' + BOX + '" fill="none" stroke="currentColor" stroke-width="2"/><g class="on">' + line(TICK, "currentColor") + "</g></svg>";
  }

  /* ---------- state: the live hub's own (same key, shape and merge), so a returning student's progress is here ---------- */
  var STATE_KEY = C.stateKey;
  /* The live hub's state shape (SH_HUB.stateShape): "seen", Occlusion's and Heme & Endo Exam 2's (seen {n, c, last},
     totalAnswered, lecStats, days, ach), or "answered", Perio's own engine (answered {correct, seen, lastCorrect}, totalSeen,
     totalCorrect counting each question once, the first time it's right, activeDates, achievements; the dashboard reads
     it as it is). The engine reads and writes answers only through ansOf(), putAnswer(), studyDayList() and achMap(), so
     the saved object keeps its own shape and the live page could still read it after a rollback. */
  var ANSWERED = C.stateShape === "answered";
  function defaultState(){
    if (ANSWERED) return { answered: {}, streak: 0, bestStreak: 0, totalCorrect: 0, totalSeen: 0, achievements: {}, theme: null, lastActiveDate: null, activeDates: {},
      ui: { mode: "home", view: "lecture-notes", lec: C.firstLec || "", review: "all", level: "full", sub: "notes", group: "", recall: false, qlec: "all", qsrc: "all", qstatus: "all", qlikely: "" },
      arcade: { best: {}, plays: {}, muted: false } };
    return { v: 1, seen: {}, streak: 0, bestStreak: 0, totalCorrect: 0, totalAnswered: 0, lecStats: {}, days: [], ach: {}, read: {},
      ui: { mode: "home", sub: "notes", lec: C.firstLec || "", level: "full", group: "", recall: false, qlec: "all", qsrc: "all", qstatus: "all", qlikely: "" },
      arcade: { best: { sort: 0, board: 0, escape: 0, cloze: 0, smile: 0, cross: 0 }, plays: { sort: 0, board: 0, escape: 0, cloze: 0, smile: 0, cross: 0 }, muted: false, scope: "all", sortSet: "mix", snakeLec: "all", stackSet: "mix", matchSet: "mix", hangLec: "all", blastLec: "all", searchLec: "all", whackSet: "mix" } };
  }
  function loadState(){
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        Object.keys(s).forEach(function(k){
          if (s[k] && typeof s[k] === "object" && !Array.isArray(s[k]) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
            Object.keys(s[k]).forEach(function(k2){
              if (s[k][k2] && typeof s[k][k2] === "object" && !Array.isArray(s[k][k2]) && base[k][k2] && typeof base[k][k2] === "object") base[k][k2] = Object.assign(base[k][k2], s[k][k2]);
              else base[k][k2] = s[k][k2];
            });
          } else base[k] = s[k];
        });
      }
    } catch (e) {}
    return base;
  }
  var STATE = loadState();
  /* Perio kept its bank's filters in ui.qbank: carry them into the engine's once (qbankIn marks it; not a default, since
     defaults are merged into saved state) */
  if (ANSWERED && STATE.ui.qbank && !STATE.ui.qbankIn) {
    var qb = STATE.ui.qbank;
    if (qb.lec) STATE.ui.qlec = qb.lec;
    if (qb.status) STATE.ui.qstatus = qb.status === "new" ? "unseen" : qb.status === "likely" ? "all" : qb.status;
    STATE.ui.qlikely = qb.likely === "likely" || qb.status === "likely" ? "likely" : "";
    if (qb.type) STATE.ui.qfmt = qb.type === "mcq" ? "all" : qb.type;
    if (qb.src) STATE.ui.qsrc = qb.src;
    STATE.ui.qbankIn = 1;
  }
  /* one answer record, the same in both shapes: n tries, c times right (Perio: 1 once right), last (the latest try) */
  function ansOf(id){
    if (!ANSWERED) return STATE.seen[id];
    var a = STATE.answered[id]; if (!a) return undefined;
    return { n: a.seen || 0, c: a.correct ? 1 : 0, last: typeof a.lastCorrect === "boolean" ? a.lastCorrect : !!a.correct };
  }
  function studyDayList(){ return ANSWERED ? Object.keys(STATE.activeDates || {}) : (STATE.days || []); }
  function achMap(){ return ANSWERED ? STATE.achievements : STATE.ach; }
  /* the answer itself, in the hub's own shape (the live recordAnswer's bookkeeping) */
  function putAnswer(qid, lecId, correct){
    var d = day(0);
    if (ANSWERED) {
      var a = STATE.answered[qid] || { correct: false, seen: 0, lastCorrect: null };
      a.seen++; a.lastCorrect = !!correct;
      if (correct && !a.correct) { a.correct = true; STATE.totalCorrect++; }
      STATE.answered[qid] = a; STATE.totalSeen++;
      STATE.activeDates[d] = true; STATE.lastActiveDate = d;
    } else {
      var s = STATE.seen[qid] || { n: 0, c: 0, last: null };
      s.n++; if (correct) s.c++; s.last = !!correct; STATE.seen[qid] = s;
      STATE.totalAnswered++; if (correct) STATE.totalCorrect++;
      var lsx = STATE.lecStats[lecId] || { a: 0, c: 0 }; lsx.a++; if (correct) lsx.c++; STATE.lecStats[lecId] = lsx;
      if (STATE.days.indexOf(d) === -1) STATE.days.push(d);
    }
    if (correct) { STATE.streak++; if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak; } else STATE.streak = 0;
  }
  /* the engine's own part (not in defaultState: it marks when this device first used the new hub, and the merge would
     otherwise always reset it). goal: the daily goal; days: per day, answers, right, XP and whether the goal was met */
  if (!STATE.nx || typeof STATE.nx !== "object") STATE.nx = { since: day(0), goal: 20, days: {}, tips: {} };
  STATE.nx.days = STATE.nx.days || {}; STATE.nx.tips = STATE.nx.tips || {}; STATE.nx.goal = STATE.nx.goal || 20;
  var saveT = 0;
  function saveNow(){ clearTimeout(saveT); saveT = 0; try { localStorage.setItem(STATE_KEY, JSON.stringify(STATE)); } catch (e) {} }
  function saveState(){ clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") saveNow(); });

  /* ---------- the content ---------- */
  var CORE = null, QS = null, QBY = {}, QBL = {}, LECS = [], LBY = {}, IDX = [], NOTES = null, STUDY = null, FIG = null, ARC = null;
  var EXAM = null, EXAM_LECS = {}, REVIEW = {};
  var memo = {};
  function getJSON(name){
    return memo[name] || (memo[name] = fetch(BASE + name).then(function(r){ if (!r.ok) throw new Error(name + " " + r.status); return r.json(); })
      .catch(function(e){ delete memo[name]; throw e; }));
  }
  function loadScript(src){
    return memo[src] || (memo[src] = new Promise(function(res, rej){ var s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = function(){ delete memo[src]; rej(new Error(src)); }; document.head.appendChild(s); }));
  }
  function loadCss(href){ if (memo[href]) return; memo[href] = 1; var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); }
  function lecLabel(l){ return l ? (l.label || ("L" + l.num)) : ""; }
  function shortTitle(l){ return l ? String(l.title).split(":")[0] : ""; }
  function lecName(id){ var l = LBY[id]; return l ? lecLabel(l) + " · " + shortTitle(l) : id; }
  /* each lecture's own color (Sam, 2026-11-11: "more color ... to distinguish each lecture from one another so its easier
     to tell where questions come from and also which lectures youve done in the lecture notes"): set in setCore from the
     lecture's place in the hub, so it is the same everywhere (question cards, the notes, Home, the bank's picker, hints,
     the cram sheet, the mock, stats); a review-only lecture is grey. hub.css draws .lc-0 to .lc-9 and .lc-x. */
  var LCOL = {};
  function lc(id){ return " lc lc-" + (LCOL[id] || "x"); }
  function lecDot(id){ return '<i class="ld' + lc(id) + '" aria-hidden="true"></i>'; }
  function lecChip(id, text){ return '<span class="lchip' + lc(id) + '"><i class="ld" aria-hidden="true"></i>' + esc(text === undefined ? lecName(id) : text) + "</span>"; }
  /* a lecture's notes marked done: by its button at the end of the notes, or by reading to the end (on this device) */
  /* a heading for one lecture: its colored badge, then its short title (the badge's label read out once, by the sr text) */
  function lecHead(l){ return lecBadge(l, "lb-s") + '<span class="sr">' + esc(lecLabel(l)) + " · </span><span>" + esc(shortTitle(l)) + "</span>"; }
  function isRead(id){ return !!(STATE.read || {})[id]; }
  function isExamLec(id){ return !!EXAM_LECS[id]; }
  /* review-only lectures (core.reviewOnly, the live hub's COUNT_SKIP; Heme & Endo Exam 2's Exam 1 Refresher, Sam, 2026-11-06):
     on the exam, but kept for review, so they're out of every total (Home's readiness and "you haven't tried", Where to
     next, the bank's "of N" and, through SH_EXPORT.uncounted, the mastery medal) and out of the bank until ticked
     (Sam, 2026-11-10). Their answers still count for XP and streaks, and the drill, mock and search still use them. */
  function isReview(id){ return !!REVIEW[id]; }
  function hasReview(){ return Object.keys(REVIEW).length > 0; }
  function setCore(c){
    CORE = c; LECS = c.lectures || []; LECS.forEach(function(l){ LBY[l.id] = l; QBL[l.id] = []; });
    IDX = (c.index || []).map(function(r){ return { id: r[0], lec: r[1], likely: !!r[2], src: r[3] || "" }; });
    IDX.forEach(function(r){ (QBL[r.lec] = QBL[r.lec] || []).push(r); });
    EXAM = (c.exams || []).filter(function(x){ return x.id === C.exam; })[0] || (c.exams || [])[c.exams.length - 1] || null;
    (c.reviewOnly || []).forEach(function(id){ REVIEW[id] = 1; });
    LECS.forEach(function(l){ if ((!C.exam || l.exam === C.exam) && !REVIEW[l.id]) EXAM_LECS[l.id] = 1; });
    var nc = 0; LECS.forEach(function(l){ LCOL[l.id] = REVIEW[l.id] ? "x" : String(nc++ % 10); });
    if (!LBY[STATE.ui.lec]) STATE.ui.lec = (LECS.filter(function(l){ return isExamLec(l.id); })[0] || LECS[0] || {}).id;
  }
  function needQuestions(){
    return getJSON("questions.json").then(function(q){
      if (!QS) {
        QS = q; QS.forEach(function(x){ QBY[x.id] = x; });
        exportQuestions();
      }
      return QS;
    });
  }
  function needNotes(){ return getJSON("notes.json").then(function(n){ NOTES = n; return n; }); }
  function needStudy(){ return getJSON("study.json").then(function(s){ STUDY = s; return s; }); }
  function needFigures(){
    loadCss(BASE + "figures.css");
    if (CORE.pcases) loadCss(WIDGET + "cases.css");
    return Promise.all([loadScript(BASE + "figures.js"), CORE.pcases ? loadScript(WIDGET + "cases.js") : null]).then(function(){
      if (!FIG && window.SH_FIGURES) FIG = window.SH_FIGURES({ esc: esc, shuffled: shuffled, save: saveState, state: STATE });
      return FIG;
    });
  }
  function needsFig(q){ return !!(q && (q.img || q.pimg || q.pcase)); }

  /* ---------- the frame: the bar (top on a laptop, bottom on a phone, Timmy on it), the views ---------- */
  var VIEWS = [["home", "Home"], ["notes", "Notes"], ["questions", "Questions"], ["more", "More"]];
  var shell = null, view = "", sub = "";
  function buildShell(){
    var name = esc(C.name || HUB);
    document.body.innerHTML = "";
    shell = h('<div class="hx" data-hub="' + esc(HUB) + '"></div>');
    shell.innerHTML =
      '<a class="hx-skip" href="#main">Skip to the page</a>' +
      '<header class="hx-bar" id="hxBar">' +
        '<a id="sh-ribbon-back" class="hx-back" href="' + esc(C.back || "../../../index.html") + '" aria-label="All hubs"></a>' +
        '<a class="hx-name" href="#home">' + emblem("hx-emb") + "<span>" + name + "</span></a>" +
        '<nav class="hx-tabs" id="modeSwitch" aria-label="' + name + '">' + VIEWS.map(function(v){
          return '<a class="hx-tab" href="#' + v[0] + '" data-mode="' + v[0] + '">' + icon(v[0], 22) + "<span>" + v[1] + "</span></a>"; }).join("") + "</nav>" +
        '<span class="hx-meters" aria-label="Today">' +
          '<span class="hx-meter hx-live" data-livem title="Studying ' + name + ' right now, you included"></span>' +
          '<span class="hx-meter" data-streakm title="Your streak"></span>' +
          '<span class="hx-meter" data-goalm title="Today\'s goal"></span>' +
          '<a class="hx-rank" id="hxRank" href="#more/stats"></a>' +
        "</span>" +
        '<button class="hx-search" type="button" data-search-open aria-label="Search this hub">' + icon("search", 20) + "</button>" +
        '<a class="hx-set" href="#more/settings" aria-label="Settings">' + icon("settings", 22) + '<span class="lbl">Settings</span></a>' +
      "</header>" +
      '<div class="hx-strip" id="hxStrip" aria-label="Today"><span class="hx-meter" data-streakm></span><span class="hx-meter" data-goalm></span><span class="hx-meter hx-live" data-livem></span><span class="hx-meter" id="hxXp" data-xpm></span><button class="hx-search" type="button" data-search-open aria-label="Search this hub">' + icon("search", 20) + "</button></div>" +
      '<main class="hx-main" id="main" tabindex="-1">' + VIEWS.map(function(v){ return '<section class="hx-view" data-view="' + v[0] + '" data-mode-panel="' + v[0] + '" hidden></section>'; }).join("") + "</main>" +
      '<div class="hx-toasts" id="hxToast" aria-live="polite"></div>';
    document.body.appendChild(shell);
    shell.addEventListener("click", function(e){
      if (!e.target.closest("[data-search-open]")) return;
      var p = document.getElementById("shstat-search-pill");
      if (p) { p.click(); track("bar:search"); } else toast("Search is still loading. Try again in a moment.");
    });
    HX.paintMeters();
  }
  /* how many are studying this hub right now, you included (Sam, 2026-11-06: "a live study count everyone can see"):
     the shared widget's presence channel, the same count the live hubs show on their widget button; a total, nothing
     about who */
  var LIVE = 0;
  function liveNow(){ if (LIVE) return LIVE; try { return (window.shEggHooks && window.shEggHooks.online && window.shEggHooks.online()) || 1; } catch (e) { return 1; } }
  function paintLive(){
    var n = liveNow(), name = esc(C.name || HUB);
    $$("[data-livem]").forEach(function(m){ m.innerHTML = '<span class="live-dot" aria-hidden="true"></span><span class="num" aria-hidden="true">' + fmt(n) + '<span class="fold-live"> studying now</span></span><span class="sr">' + fmt(n) + " studying " + name + " now</span>"; });
    $$("[data-liveline]").forEach(function(m){ m.innerHTML = '<span class="live-dot" aria-hidden="true"></span><span><b class="num">' + fmt(n) + "</b> " + (n === 1 ? "studying " + name + " right now: you" : "studying " + name + " right now, you included") + "</span>"; });
  }
  /* the decorations' motion (Timmy Time bobbing, a tooth popping in) stops with reduced motion or Answer animations off
     (Focus mode turns that off too) */
  function paintStill(){ document.documentElement.classList.toggle("hx-still", reduced || ls("sh_pref_fx") === "off"); }
  paintStill(); document.addEventListener("sh:pref", paintStill);
  document.addEventListener("sh:online", function(e){ var n = +(e && e.detail && e.detail.n) || 0; if (n > 0 && n !== LIVE) { LIVE = n; paintLive(); } });

  /* ---------- routing ---------- */
  function parse(){
    var hsh = (location.hash || "").replace(/^#/, ""), parts = hsh.split("/");
    if (parts[0] === "timmy") return ["more", "timmy"];
    if (parts[0] === "drill") return ["questions", "drill"];
    if (VIEWS.some(function(v){ return v[0] === parts[0]; })) return [parts[0], parts.slice(1).join("/")];
    return ["home", ""];
  }
  var leaving = null;
  function route(){
    var r = parse(), v = r[0], s = r[1];
    if (window.shTTS && view === "notes" && (v !== "notes" || s !== sub)) { try { window.shTTS.stop(); } catch (e) {} }
    if (view === "questions" && v !== "questions") leaving = HX.recapDue();
    if (view === "more" && sub === "arcade" && ARC && (v !== "more" || s !== "arcade")) { try { ARC.arcade.stopAll(); } catch (e) {} }
    view = v; sub = s;
    var setOn = v === "more" && s === "settings", gear = $(".hx-set");
    if (gear) { if (setOn) gear.setAttribute("aria-current", "page"); else gear.removeAttribute("aria-current"); }
    $$("#modeSwitch [data-mode]").forEach(function(a){ var on = a.getAttribute("data-mode") === v && !setOn; a.classList.toggle("is-active", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $$(".hx-view").forEach(function(p){ p.hidden = p.getAttribute("data-view") !== v; });
    docEl.classList.toggle("sh-mock-on", false);
    var el = $('.hx-view[data-view="' + v + '"]');
    STATE.ui.mode = v; saveState();
    try { ({ home: renderHome, notes: renderNotes, questions: HX.renderQuestions, more: renderMore })[v](el, s); } catch (e) { el.innerHTML = '<div class="hx-page"><h1>Something went wrong</h1><p class="note">' + esc(e.message) + "</p></div>"; if (window.console) console.error(e); }
    if (leaving) { HX.showLeftRecap(el, leaving); leaving = null; }
  }
  function go(hash, keep){
    if (("#" + hash) === location.hash) { route(); }
    else location.hash = hash;
    if (!keep) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function(){ route(); window.scrollTo(0, 0); });
  function section(){
    if (view === "home") return "home/dashboard";
    if (view === "notes") return "compendium/notes";
    if (view === "questions") { var p = HX.presetOf(); return "compendium/" + (p === "mock" ? "mock" : p === "weak" ? "weak" : p === "drill" ? "drill" : p === "misses" ? "misses" : "bank"); }
    if (view === "more") {
      if (sub === "arcade") return "arcade/" + (ARC && ARC.arcade.current() || "lobby");
      if (sub === "side") return "review/side";
      if (sub === "hints" || sub === "cram") return "compendium/" + sub;
      return "more/" + (sub || "menu");
    }
    return view;
  }

  /* ======================= Home ======================= */
  function examStart(){ return EXAM && EXAM.time ? new Date(EXAM.date + "T" + EXAM.time + ":00") : EXAM ? new Date(EXAM.date + "T00:00:00") : null; }
  function examEnd(){ return EXAM && EXAM.closes ? new Date(EXAM.date + "T" + EXAM.closes + ":00") : EXAM ? new Date(EXAM.date + "T23:59:00") : null; }
  function countHTML(){
    if (!EXAM) return '<p class="count"><b>Soon</b><span>the countdown starts once the date is set</span></p>';
    var now = new Date(), s = examStart(), e = examEnd(), d = calDays(EXAM.date);
    if (now >= e) return '<p class="count"><b>Done</b><span>Tell the class how it went with Check in on the dashboard.</span></p>';
    if (now >= s) return '<p class="count is-live"><b>On now</b><span>Good luck! It closes at ' + esc(timeLabel(EXAM.closes)) + ".</span></p>";
    if (d > 1) return '<p class="count" role="timer"><b class="num">' + d + "</b><span>days to go</span></p>";
    var ms = s - now, hr = Math.floor(ms / 36e5), mi = Math.floor(ms % 36e5 / 6e4);
    return '<p class="count" role="timer"><b class="num">' + (hr ? hr + " h " : "") + mi + " min</b><span>" + (d === 1 ? "until tomorrow's exam" : "until it starts") + "</span></p>";
  }
  function lecStat(id){
    if (!ANSWERED) return STATE.lecStats[id] || { a: 0, c: 0 };
    var a = 0; (QBL[id] || []).forEach(function(q){ var r = ansOf(q.id); if (r) a += r.n; });
    return { a: a, c: 0 };
  }
  function lecProgress(l){
    var tried = 0, right = 0, missed = 0, qs = QBL[l.id] || [];
    qs.forEach(function(q){ var s = ansOf(q.id); if (s) { tried++; if (s.last) right++; else missed++; } });
    /* accuracy over every answer; Perio's shape keeps no per-lecture totals, so it's right on the latest try */
    var st = lecStat(l.id);
    if (ANSWERED) return { l: l, total: qs.length, tried: tried, right: right, missed: missed, a: st.a, pct: tried ? Math.round(right / tried * 100) : null };
    return { l: l, total: qs.length, tried: tried, right: right, missed: missed, a: st.a, pct: st.a ? Math.round(st.c / st.a * 100) : null };
  }
  function srsMisses(){
    var all = {}; try { all = JSON.parse(ls("sh_srs_" + HUB) || "{}") || {}; } catch (e) {}
    var y = day(-1); return Object.keys(all).filter(function(id){ var r = all[id]; return r && r.t === y && !r.b && QBL[(IDX.filter(function(x){ return x.id === id; })[0] || {}).lec]; });
  }
  var homeTimer = 0;
  function renderHome(el){
    clearInterval(homeTimer);
    var X = C.home || {}, rows = LECS.map(lecProgress), fin = rows.filter(function(r){ return isExamLec(r.l.id); });
    var total = fin.reduce(function(n, r){ return n + r.total; }, 0), right = fin.reduce(function(n, r){ return n + r.right; }, 0);
    var left = IDX.filter(function(q){ return !ansOf(q.id) && isExamLec(q.lec); }).length;
    var cont = LBY[STATE.ui.lec] || LECS[0], d = EXAM ? calDays(EXAM.date) : null, M = AH.masthead || { body: "", label: "" };
    var mis = srsMisses().length, examWeek = d !== null && d >= 0 && d <= 7;
    var pod = CORE.podcast;
    var q = function(href, ic, title, sub, cls){ return '<a class="ql' + (cls ? " " + cls : "") + '" href="' + href + '"' + (cls === "is-primary" ? " data-home-practice" : "") + ">" + icon(ic, 22) + "<span><b>" + esc(title) + "</b><small>" + esc(sub) + "</small></span></a>"; };
    var html = '<div class="hx-page home">' +
      '<div class="home-top">' +
        '<figure class="mast">' + img(M.body, M.label, "", "0 0 600 200") + "</figure>" +
        '<div class="examcard">' +
          '<p class="exam-when">' + esc(X.when || (EXAM ? dateLabel(EXAM.date, { weekday: "long", month: "long", day: "numeric" }) + (EXAM.time ? " · " + timeLabel(EXAM.time) + (EXAM.closes ? " to " + timeLabel(EXAM.closes) : "") : "") : "")) + "</p>" +
          "<h1>" + esc(X.title || C.name) + "</h1>" +
          '<div id="hxCount">' + countHTML() + "</div>" +
          '<p class="live-line" data-liveline></p>' +
          (X.chips ? '<p class="exam-facts">' + X.chips.map(esc).join(" · ") + "</p>" : "") +
        "</div>" +
        '<nav class="quick' + (pod ? " has-pod" : "") + '" aria-label="Start studying">' +
          q("#questions", "questions", "Practice questions", pl(left, "question") + " for the exam you haven't tried", "is-primary") +
          q("#questions/drill", "drill", "Daily drill", "Misses and high-yield, a few minutes") +
          q("#notes/" + esc(cont.id), "notes", "Notes", lecLabel(cont) + " " + shortTitle(cont)) +
          q("#questions/mock", "mock", "Mock exam", pl(HX.mockTotal(), "question") + ", timed") +
          q("#more/hints", "hints", "Exam hints", "What " + (X.prof || "the professor") + " said to know") +
          q("#more/cram", "cram", "Cram sheet", "Every lecture on one page") +
          (pod ? podMiniHTML(pod) : "") +
        "</nav>" +
      "</div>" +
      (X.notice ? '<p class="notice">' + icon("notes", 20) + "<span><b>" + esc(X.notice[0]) + "</b> " + esc(X.notice[1]) + "</span></p>" : "") +
      '<div class="home-grid">' +
        '<section class="panel next" aria-labelledby="hnH"><h2 id="hnH">Where to next</h2>' + nextHTML(rows, mis, examWeek) + "</section>" +
        HX.todayPanel() +
        '<section class="panel lecs" aria-labelledby="hlH"><h2 id="hlH">Your progress by lecture</h2><p class="note">How much of each lecture\'s bank you\'ve tried; the solid part is right on your latest try. ' + right + " of " + total + " for the exam right so far.</p>" + lecsHTML(fin.concat(rows.filter(function(r){ return !isExamLec(r.l.id); }))) + "</section>" +
        '<div class="home-side">' +
          '<section class="panel" aria-labelledby="htH"><h2 id="htH">Course timeline</h2>' + timelineHTML() + "</section>" +
        "</div>" +
      "</div></div>";
    el.innerHTML = html;
    /* Home's way into the bank starts fresh: the exam's lectures, not answered yet, High likelihood off (the rule) */
    $$("[data-home-practice]", el).forEach(function(a){ a.addEventListener("click", function(){ var ex = LECS.filter(function(l){ return isExamLec(l.id); }).map(function(l){ return l.id; }); HX.bankReset(); STATE.ui.qlec = ex.length ? HX.lecValue(ex) : "all"; STATE.ui.qstatus = "unseen"; HX.bankSearch = ""; saveState(); }); });
    paintLive();
    homeTimer = setInterval(function(){ var c = $("#hxCount"); if (!c || !c.isConnected || view !== "home") { clearInterval(homeTimer); return; } c.innerHTML = countHTML(); }, 30000);
    tip(el, "home", "Your daily goal is the ring in the bar: " + HX.goal() + " questions a day. The flame counts the days in a row you study. Change the goal in More, Settings.");
  }
  function nextHTML(rows, mis, examWeek){
    var fin = rows.filter(function(r){ return isExamLec(r.l.id); }), out = [];
    var started = fin.filter(function(r){ return r.a >= 5; }).sort(function(a, b){ return a.pct - b.pct; });
    var fresh = fin.filter(function(r){ return !r.tried; });
    var missedFin = fin.reduce(function(n, r){ return n + r.missed; }, 0);
    var row = function(title, sub, href, label, primary){ return "<li><span><b>" + esc(title) + "</b><small>" + esc(sub) + '</small></span><a class="btn' + (primary ? " btn-primary" : "") + '" href="' + href + '">' + esc(label) + "</a></li>"; };
    if (mis && examWeek) out.push(row("Yesterday's misses: " + pl(mis, "question"), "Missed yesterday and not tried again yet", "#questions/misses", "Retry them", true));
    if (started.length && started[0].pct < 80) { var w = started[0]; out.push(row("Your weakest lecture: " + lecName(w.l.id), w.pct + "% right over " + pl(w.a, "answer"), "#questions/weak", "Weak spots", !out.length)); }
    if (missedFin) out.push(row(pl(missedFin, "question") + " you missed last time", "Try them again while they're fresh", "#questions/missed", "Retry"));
    if (fresh.length) { var f = fresh[0]; out.push(row("Not started: " + lecName(f.l.id), fresh.length > 1 ? (fresh.length - 1) + " more not started yet" : "On the exam", "#notes/" + esc(f.l.id), "Read the notes")); }
    if (!out.length) out.push(row("Every lecture started and no misses waiting", "Take the mock to check yourself", "#questions/mock", "Mock exam", true));
    return '<ul class="rows">' + out.join("") + "</ul>";
  }
  function lecsHTML(rows){
    var last = null, X = C.home || {};
    return '<ul class="lec-rows">' + rows.map(function(r){
      var tw = r.total ? Math.round(r.tried / r.total * 100) : 0, rw = r.total ? Math.round(r.right / r.total * 100) : 0, grp = isExamLec(r.l.id) ? "on" : "off", head = "";
      if (grp !== last) { head = '<li class="grp">' + esc(grp === "on" ? (X.onExam || "On the exam") : (X.offExam || "Earlier lectures")) + "</li>"; last = grp; }
      return head + '<li class="' + lc(r.l.id).trim() + '">' + lecBadge(r.l, "lb-s") + '<div class="lr-main"><p><b><span class="sr">' + esc(lecLabel(r.l)) + " · </span>" + esc(shortTitle(r.l)) + "</b>" + (isRead(r.l.id) ? ' <span class="read-tag">' + icon("check", 14) + "Notes done</span>" : "") + '</p><span class="bar" role="img" aria-label="' + r.tried + " of " + r.total + " tried, " + r.right + ' right"><i class="tried" style="width:' + tw + '%"></i><i class="right" style="width:' + rw + '%"></i></span>' +
        '<p class="note num">' + r.tried + " of " + r.total + " tried" + (r.pct !== null ? " · " + r.pct + "% of answers right" : "") + "</p></div>" +
        '<span class="lr-acts"><a class="btn btn-text" href="#notes/' + esc(r.l.id) + '" aria-label="Notes for ' + esc(lecLabel(r.l)) + (isRead(r.l.id) ? ", done" : "") + '">Notes</a><a class="btn btn-text" href="#questions" data-lecq="' + esc(r.l.id) + '" aria-label="Questions for ' + esc(lecLabel(r.l)) + '">Questions</a></span></li>';
    }).join("") + "</ul>";
  }
  function timelineHTML(){
    var t = day(0);
    return '<ol class="tl">' + (CORE.courseDates || []).map(function(e){
      var when = e.date < t ? "past" : e.date === t ? "today" : "future";
      return '<li class="tl-' + when + (e.kind ? " tl-" + e.kind : "") + '"><span class="tl-date num">' + esc(dateLabel(e.date)) + (when === "today" ? " · today" : "") + '</span><span class="tl-what">' + esc(e.label) + "</span></li>";
    }).join("") + "</ol>";
  }
  /* Timmy Time on Home, among the quick starts so it's on the first screen (Sam, 2026-11-06: "animated and visible
     without scrolling down"): the hub's color, Timmy in headphones bobbing to the music (spots.mjs), the notes drifting up
     and a little equalizer. Still when motion is off (reduced motion, Answer animations off, Focus mode). */
  var POD_COL = { tint: "#F2C94C", light: "#FFFFFF", line: "#F2C94C" };
  function podMiniHTML(pod){
    var min = pod.duration ? Math.round(pod.duration / 60) : 0;
    return '<a class="ql ql-pod" href="#more/timmy">' +
      '<span class="pm-text"><b>Timmy Time <span class="pm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></b><small>' + esc(pod.title || "The audio review") + "</small>" +
      '<span class="pm-play">' + icon("play", 16) + "Listen" + (min ? '<span class="pm-min"> · ' + min + " min</span>" : "") + "</span></span>" +
      '<span class="pm-art" aria-hidden="true">' + spot("notes", POD_COL, "pm-notes") + spot("timmyTime", POD_COL, "pm-timmy") + "</span></a>";
  }

  /* ======================= Notes ======================= */
  function renderNotes(el, s){
    var lec = LBY[s] || LBY[STATE.ui.lec] || LECS[0];
    STATE.ui.lec = lec.id; saveState();
    el.innerHTML = '<div class="hx-page notes"><p class="note loading">Loading the notes…</p></div>';
    Promise.all([needNotes(), needStudy(), needQuestions()]).then(function(){ drawNotes(el, lec); }).catch(function(){ el.innerHTML = offlineHTML("the notes"); });
  }
  function offlineHTML(what){ return '<div class="hx-page"><h1>Not loaded yet</h1><p>Couldn\'t load ' + esc(what) + '. Check your connection, then <a href="">reload</a>.</p></div>'; }
  /* the notes' lecture list: the exam's lectures first, under the exam's date; each with its number in its own color (filled,
     with a check, once its notes are done), how much of its bank you've tried (the bar: tried, and right on your latest
     try) and your accuracy */
  function lecListHTML(lec){
    var X = C.notes || {};
    var groups = [["on", LECS.filter(function(l){ return isExamLec(l.id); })], ["off", LECS.filter(function(l){ return !isExamLec(l.id); })]].filter(function(g){ return g[1].length; });
    return '<nav class="lec-list" aria-label="Lectures"><button class="lec-pick btn" type="button" aria-expanded="false" data-lecpick>' + lecBadge(lec) +
      '<span class="lp-t"><b>' + esc(shortTitle(lec)) + "</b><small>" + esc(lecLabel(lec)) + " · change lecture</small></span>" + icon("chevron", 18, "rot") + "</button><ul>" +
      groups.map(function(g){
        var on = g[0] === "on";
        return '<li class="grp grp-' + g[0] + '"><b>' + esc(on ? (X.onExam || "On the exam") : (X.offExam || "Earlier lectures")) + "</b><span>" +
          esc(on ? (EXAM ? (EXAM.label || "The exam") + ", " + dateLabel(EXAM.date, { weekday: "long", month: "long", day: "numeric" }) : "") : (X.offNote || "For review")) + "</span></li>" + g[1].map(function(l){ return lecItemHTML(l, l.id === lec.id); }).join("");
      }).join("") + "</ul></nav>";
  }
  function drawNotes(el, lec){
    if (view !== "notes") return;
    /* three reading levels: As taught, Plain English and High yield (Sam, 2026-11-12: "only explains the high likelihood/high
       yield points that are hinted to be tested"): the lecture's predicted topics, each with the paragraphs of its notes that
       teach it and the professor's takeaways, built by tools/hub-next/high-yield.mjs into notes.json's hy. A lecture without
       predicted topics has no High yield, and shows As taught when that level is picked. */
    var X = C.notes || {}, hasPlain = !!(NOTES.plain || {})[lec.id], hasHy = !!(NOTES.hy || {})[lec.id];
    var level = hasPlain && STATE.ui.level === "plain" ? "plain" : hasHy && STATE.ui.level === "hy" ? "hy" : "full", hy = level === "hy";
    var text = (level === "plain" ? NOTES.plain : hy ? NOTES.hy : NOTES.full)[lec.id], nq = (QBL[lec.id] || []).length;
    var nTopics = hy ? (CORE.likelyTopics || []).filter(function(t){ return t.lec === lec.id; }).length : 0;
    var nLikely = (QBL[lec.id] || []).filter(function(r){ return r.likely; }).length;
    /* High yield has no recorded narration yet (vault/tasks/2026-11-12-high-yield-narration.md): Listen reads it in the
       device's voice, which can't drift from the text */
    var mp3 = hy ? "" : ASSETS + "audio/" + lec.id + "-" + level + ".mp3";
    var list = lecListHTML(lec);
    var sub = String(lec.title).split(":").slice(1).join(":").trim();
    var group = (STUDY.review || []).filter(function(g){ return g.lec === lec.id; })[0];
    var art = '<article class="reading' + lc(lec.id) + '" id="lec-' + esc(lec.id) + '">' +
      '<h1 class="rd-title">' + lecBadge(lec, "lb-h") + '<span class="sr">' + esc(lecLabel(lec)) + " · </span><span>" + esc(shortTitle(lec)) + "</span></h1>" + (sub ? '<p class="sub">' + esc(sub) + "</p>" : "") +
      '<p class="note">' + esc(lec.who) + " · " + (lec.status === "taught" ? "recording and slides" : "slides only") + " · " + pl(nq, "question") + "</p>" +
      (lec.note ? '<p class="note lec-note">' + lec.note + "</p>" : "") +
      '<div class="toolbar" role="toolbar" aria-label="Notes tools">' +
        (text ? '<button type="button" class="btn sh-tts-btn" id="sh-tts-btn"' + (mp3 ? ' data-sh-tts-audio="1"' : ' title="Read aloud in your device\'s voice"') + ' aria-label="Listen to these notes">' + icon("listen", 18) + '<span class="sh-tts-label-play">Listen</span><span class="sh-tts-label-pause">Pause</span></button>' +
          '<button type="button" class="btn btn-text follow-btn" data-follow hidden aria-pressed="' + followOn() + '" title="Highlight each word as it is read">' + icon("highlight", 18) + "Follow along</button>" : "") +
        (hasPlain || hasHy ? '<span class="seg" role="group" aria-label="Reading level"><button type="button" data-level="full" aria-pressed="' + (level === "full") + '">As taught</button>' +
          (hasPlain ? '<button type="button" data-level="plain" aria-pressed="' + (level === "plain") + '">Plain English</button>' : "") +
          (hasHy ? '<button type="button" data-level="hy" aria-pressed="' + hy + '">High yield</button>' : "") + "</span>" : "") +
        '<button type="button" class="btn" data-mmap aria-expanded="false">' + icon("mindmap", 18) + "Mind map</button>" +
        '<button type="button" class="btn btn-text" data-report-notes>' + icon("report", 18) + "Report a mistake</button>" +
        '<span class="note tool-tip">' + icon("highlight", 18) + "Select text to highlight it</span>" +
      "</div>" +
      '<div class="mmap" hidden></div>' +
      (hy ? '<p class="note hy-intro">' + icon("hints", 18) + "<span>Only what's most likely on the exam: " + pl(nTopics, "predicted topic") + ", strongest evidence first, each with the part of the notes that teaches it. <b>As taught</b> has everything.</span></p>" : "") +
      '<div class="reading-prose' + (hy ? " hy" : "") + '">' + (text || "<p>Notes coming soon.</p>") + "</div>" +
      '<section class="lec-figs" hidden aria-labelledby="lfH"><h2 id="lfH">Diagrams</h2><div class="fig-grid"></div></section>' +
      (group && !hy ? '<section class="charts" aria-labelledby="lcH"><h2 id="lcH">Charts for this lecture</h2><p class="note">' + esc(group.blurb || "") + "</p>" + group.sections.map(function(sec, i){ return (sec.part ? '<h3 class="part">' + esc(sec.part) + "</h3>" : "") + sectionHTML(sec); }).join("") + "</section>" : "") +
      '<section class="check" aria-labelledby="ckH"><h2 id="ckH">Check yourself</h2><p class="note">Three questions from this lecture. Answers count like anywhere else.</p><div class="qlist" data-check></div></section>' +
      '<nav class="foot-acts" aria-label="Next">' + readBtnHTML(lec) + (hy && nLikely ? '<a class="btn btn-primary" href="#questions" data-lecq="' + esc(lec.id) + '" data-lqlk>' + icon("questions", 18) + "Practice the " + fmt(nLikely) + " High likelihood questions</a>" :
        '<a class="btn btn-primary" href="#questions" data-lecq="' + esc(lec.id) + '">' + icon("questions", 18) + "Practice " + esc(lecLabel(lec)) + " questions</a>") +
        '<a class="btn" href="#more/cram" data-cram="' + esc(lec.id) + '">' + icon("cram", 18) + "Cram bullets</a></nav>" +
      footNavHTML(lec) +
      '<p class="foot-report"><button class="btn btn-text" type="button" data-report-notes>' + icon("report", 18) + "Report a mistake in these notes</button></p>" +
      "</article>";
    el.innerHTML = '<div class="hx-page notes"><div class="notes-grid">' + list + art + "</div></div>";
    /* figures: in the notes next to the paragraph they explain, the rest under them (the live hub's FIG_PLACE) */
    var prose = $(".reading-prose", el), needF = (CORE.figByLec || {})[lec.id] && CORE.figByLec[lec.id].length;
    /* in High yield, only the figures that go with a paragraph it shows (placed by As taught's anchors), none left over */
    if (needF || (group && !hy)) needFigures().then(function(){ if (!prose.isConnected) return; placeFigs(prose, lec.id, hy ? "full" : level, hy ? null : $(".lec-figs", el)); $$(".charts [data-figs]", el).forEach(function(b){ b.innerHTML = b.getAttribute("data-figs").split(",").map(figCardHTML).join(""); }); try { FIG.wireCuspMaps(el); FIG.ANIMA.mount(el); } catch (e) {} }).catch(function(){});
    checkYourself($("[data-check]", el), lec);
    $$("[data-level]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.level = b.getAttribute("data-level"); saveState(); track("notes:level=" + STATE.ui.level); drawNotes(el, lec); }); });
    wireLecPick(el);
    var mm = $("[data-mmap]", el); mm.addEventListener("click", function(){
      var c = $(".mmap", el), open = mm.getAttribute("aria-expanded") === "true";
      if (!open && !c.dataset.done && window.shMindMap) { window.shMindMap.render(c, mindMapFor(lec), { accent: "var(--hub)" }); c.dataset.done = "1"; }
      c.hidden = open; mm.setAttribute("aria-expanded", String(!open)); track("notes:mindmap");
    });
    var tts = $("#sh-tts-btn", el);
    if (tts) tts.addEventListener("click", function(){ if (window.shTTS) window.shTTS.speak(prose, tts, mp3); });
    var fb = $("[data-follow]", el);
    if (fb) { fb.addEventListener("click", function(){ var on = !followOn(); ls("sh_pref_follow", on ? null : "off"); fb.setAttribute("aria-pressed", String(on)); track("notes:follow=" + (on ? "on" : "off")); follow.pref(); }); if (mp3) follow.reattach(prose, mp3); }
    /* a mistake in the notes goes to Sam's Inbox with the lecture attached (the shared widget's report form) */
    $$("[data-report-notes]", el).forEach(function(b){ b.addEventListener("click", function(){
      track("notes:report"); if (window.shOpenFlag) window.shOpenFlag({ lec: lec.id, label: lecLabel(lec) + " " + shortTitle(lec) }); else toast("The report form is still loading. Try again in a moment.");
    }); });
    $$("[data-lecnav]", el).forEach(function(a){ a.addEventListener("click", function(){ track("notes:" + a.getAttribute("data-lecnav")); }); });
    wireLecLinks(el);
    wireRead(el, lec, hy);   // reading High yield to its end doesn't mark the whole lecture's notes done
    /* the first visit's tip sits under the toolbar; while it shows, the toolbar's short "Select text to highlight it" hides (hub.css) */
    tip(el, "notes", "Select any words in the notes to highlight them; they stay on this device.", $(".reading > .toolbar", el));
  }
  /* ======================= Follow along: the word being read ======================= */
  /* While Listen plays a lecture's narration, the word being read is highlighted in the notes, and the sentence around it
     more softly (a survey idea, approved by Sam 2026-11-11: "highlight the words being read when listening to the lecture
     notes voiceover"). The times come from hubs/<hub>/audio/<lecture>-<level>.words.json beside the mp3, made by
     tools/narration_words.py (and by tools/narrate.py whenever it renders). The highlight is a CSS Custom Highlight
     (::highlight(sh-read) in hub.css), so the notes' text and the student's own highlights are never touched; a browser
     without it simply doesn't highlight. The page scrolls to keep the word in view while the reader is following (the word
     was on screen), but not for 6 seconds after they scroll, and never to pull them back from elsewhere in the notes; a
     seek moves the page to the new place. "Follow along" in the toolbar turns it off (sh_pref_follow, this device). */
  function followOn(){ return ls("sh_pref_follow") !== "off"; }
  var follow = (function(){
    var OK = !!(window.CSS && CSS.highlights && typeof window.Highlight === "function");
    var BLOCK = /^(P|LI|H1|H2|H3|H4|H5|H6|DIV|TD|TH|TR|TABLE|THEAD|TBODY|UL|OL|DL|DT|DD|BLOCKQUOTE|SECTION|ARTICLE|ASIDE|FIGURE|FIGCAPTION|DETAILS|SUMMARY|BR|HR)$/;
    var SKIP = /^(SCRIPT|STYLE|SVG|BUTTON|TEMPLATE|NOSCRIPT)$/;
    var F = null, wordHL = null, lineHL = null, userAt = 0, cache = {};
    function key(w){ var k = String(w).toLowerCase().replace(/[^0-9a-z]/g, ""); return k || String(w); }
    /* the notes' words in reading order, as narrate.py reads the HTML: whitespace and block edges split words, inline
       tags don't (so "Ca<sup>2+</sup>" is one word); figures placed in the notes (data-sh-noread) aren't read */
    function domWords(root){
      var out = [], cur = null, blk = 0;
      function end(){ if (cur) { out.push(cur); cur = null; } }
      (function walk(n){
        for (var c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === 3) {
            var re = /\S+|\s+/g, m;
            while ((m = re.exec(c.data))) {
              if (/^\s/.test(m[0])) { end(); continue; }
              if (!cur) cur = { a: c, ai: m.index, blk: blk, text: "" };
              cur.b = c; cur.bi = m.index + m[0].length; cur.text += m[0];
            }
          } else if (c.nodeType === 1) {
            var tag = c.tagName.toUpperCase();
            if (SKIP.test(tag) || c.hasAttribute("data-sh-noread")) { end(); continue; }
            var b = BLOCK.test(tag);
            if (b) { end(); blk++; }
            walk(c);
            if (b) { end(); blk++; }
          }
        }
      })(root);
      end();
      return out;
    }
    /* each narrated word -> the same word on the page: in order, looking a little ahead, a match two words long when it
       skips anything (the narration leaves out table headers and adds nothing the page doesn't show) */
    function build(){
      var dw = domWords(F.root), dk = dw.map(function(d){ return key(d.text); }), fw = F.w, map = new Array(fw.length), j = 0;
      for (var i = 0; i < fw.length; i++) {
        var k = key(fw[i]), next = i + 1 < fw.length ? key(fw[i + 1]) : null, hit = -1;
        for (var d = 0; d < 60 && j + d < dk.length; d++) {
          if (dk[j + d] === k && (d === 0 || next === null || dk[j + d + 1] === next)) { hit = j + d; break; }
        }
        map[i] = hit; if (hit >= 0) j = hit + 1;
      }
      /* sentences: runs of words in one block, ending at . ! or ? ("Oxytocin: labor contractions" stays one) */
      var sent = new Array(fw.length), sid = 0, prevBlk = -1;
      for (i = 0; i < fw.length; i++) {
        var blk = map[i] >= 0 ? dw[map[i]].blk : prevBlk;
        if (blk !== prevBlk && i) sid++;
        sent[i] = sid; prevBlk = blk;
        if (/[.!?]["”')\]]*$/.test(fw[i])) sid++;
      }
      F.dw = dw; F.map = map; F.sent = sent; F.dirty = false; F.cur = -2;
    }
    function rangeOf(a, b){
      var r = document.createRange();
      try { r.setStart(a.a, a.ai); r.setEnd(b.b, b.bi); } catch (e) { return null; }
      return r;
    }
    function clear(){ if (!OK) return; try { CSS.highlights.delete("sh-read"); CSS.highlights.delete("sh-read-line"); } catch (e) {} wordHL = lineHL = null; }
    /* the last word that has started by time t (hundredths), or -1 */
    function at(t){ var T = F.t, lo = 0, hi = F.w.length - 1, ans = -1; while (lo <= hi) { var m = (lo + hi) >> 1; if (T[2 * m] <= t) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; }
    function paint(i, jump){
      F.cur = i;
      var dwi = i >= 0 ? F.map[i] : -1;
      while (i >= 0 && dwi < 0 && i > 0) { i--; dwi = F.map[i]; }   // a word the page doesn't show: stay on the one before
      if (dwi < 0) { clear(); return; }
      var w = F.dw[dwi], r = rangeOf(w, w); if (!r) { F.dirty = true; return; }
      var s0 = i, s1 = i, sid = F.sent[i];
      while (s0 > 0 && F.sent[s0 - 1] === sid) s0--;
      while (s1 < F.w.length - 1 && F.sent[s1 + 1] === sid) s1++;
      while (s0 < i && F.map[s0] < 0) s0++;
      while (s1 > i && F.map[s1] < 0) s1--;
      var lr = rangeOf(F.dw[F.map[s0]], F.dw[F.map[s1]]);
      try {
        wordHL = new Highlight(r); CSS.highlights.set("sh-read", wordHL);
        if (lr) { lineHL = new Highlight(lr); CSS.highlights.set("sh-read-line", lineHL); }
      } catch (e) {}
      keepInView(r, jump);
    }
    function keepInView(r, jump){
      var b = r.getBoundingClientRect(); if (!b.height && !b.width) return;
      var vh = innerHeight, top = 96, bottom = vh - 150, was = F.seen;
      F.seen = b.bottom > 0 && b.top < vh;
      if (!jump && (Date.now() - userAt < 6000 || !was)) return;   // the reader scrolled, or is reading elsewhere
      if (b.top >= top && b.bottom <= bottom) return;
      try { scrollTo({ top: Math.max(0, scrollY + b.top - vh * 0.33), behavior: reduced ? "auto" : "smooth" }); } catch (e) { scrollTo(0, scrollY + b.top - vh * 0.33); }
      F.seen = true;
    }
    function tick(){
      F && (F.raf = 0);
      if (!F || !F.on || !F.w) return;   // off, or its timings still loading
      if (!F.root.isConnected) { detach(); return; }
      if (F.dirty) build();
      var i = at(F.audio.currentTime * 100 + 4);
      if (i !== F.cur) paint(i, F.jump); F.jump = false;
      if (!F.audio.paused && !F.audio.ended) F.raf = requestAnimationFrame(tick);
    }
    function kick(){ if (F && F.on && !F.raf) F.raf = requestAnimationFrame(tick); }
    function detach(){
      if (!F) return;
      if (F.raf) cancelAnimationFrame(F.raf);
      if (F.mo) F.mo.disconnect();
      F.off.forEach(function(x){ F.audio.removeEventListener(x[0], x[1]); });
      F = null; clear();
    }
    function load(url){
      if (!cache[url]) cache[url] = fetch(url, { cache: "no-cache" }).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
      return cache[url];
    }
    function attach(audio, root, url){
      detach();
      if (!OK || !audio || !root || !/\.mp3(\?|$)/.test(url || "") || !root.closest(".reading")) return;
      var wurl = url.replace(/\.mp3(\?.*)?$/, ".words.json");
      var me = F = { audio: audio, root: root, url: wurl, on: followOn(), raf: 0, cur: -2, dirty: true, jump: true, seen: true, off: [] };
      load(wurl).then(function(d){
        if (F !== me || !d || d.v !== 1 || !d.w || !d.t) return;
        var w = String(d.w).split(" ");
        if (w.length * 2 !== d.t.length) return;
        function ready(){ if (F !== me) return; if (audio.duration && isFinite(audio.duration) && Math.abs(audio.duration - d.dur) > 2) { detach(); return; } me.w = w; me.t = d.t; show(true); kick(); }   // a words file made from another mp3 is never shown
        if (audio.readyState >= 1) ready(); else audio.addEventListener("loadedmetadata", ready, { once: true });
        function on(x, f){ audio.addEventListener(x, f); me.off.push([x, f]); }
        on("play", kick); on("seeked", function(){ if (F === me) { me.jump = true; me.cur = -2; kick(); } });
        on("ended", function(){ if (F === me) clear(); });
        on("error", function(){ if (F === me) detach(); });   // the browser voice takes over, with its own highlight
        me.mo = new MutationObserver(function(){ if (F === me) { me.dirty = true; kick(); } });   // figures placed, a highlight added
        me.mo.observe(root, { childList: true, subtree: true, characterData: true });
      }).catch(function(){ show(false); });
    }
    function show(on){ var b = F && F.root.closest(".reading") ? $("[data-follow]", F.root.closest(".reading")) : null; if (b) b.hidden = !on; }
    ["wheel", "touchmove", "keydown"].forEach(function(x){ addEventListener(x, function(e){ if (x !== "keydown" || /^(Arrow|Page|Home|End| )/.test(e.key)) userAt = Date.now(); }, { passive: true }); });
    document.addEventListener("sh:tts-audio", function(e){ var d = e.detail || {}; attach(d.audio, d.container, d.url); });
    document.addEventListener("sh:tts-stop", function(){ if (F && !(window.shTTS && window.shTTS.audio && window.shTTS.audio() === F.audio)) detach(); });
    return {
      /* the toolbar's toggle changed */
      pref: function(){ if (!F) return; F.on = followOn(); if (F.on) { F.cur = -2; F.jump = true; kick(); } else clear(); },
      /* the notes were drawn again while the narration plays (a lecture's own page): follow the new text if it's the same file */
      reattach: function(root, mp3){ var a = window.shTTS && window.shTTS.audio && window.shTTS.audio(); if (a && F && F.audio === a && !F.root.isConnected && F.url === mp3.replace(/\.mp3$/, ".words.json")) attach(a, root, mp3); }
    };
  })();

  function wireLecPick(el){ var pick = $("[data-lecpick]", el); if (pick) pick.addEventListener("click", function(){ var on = pick.getAttribute("aria-expanded") !== "true"; pick.setAttribute("aria-expanded", String(on)); }); }
  /* "Notes done" (Sam, 2026-11-11: see "which lectures youve done in the lecture notes"): the button at the end of a lecture's
     notes marks it, and reading to the end marks it too once the lecture has been open a minute (so jumping to the bottom
     doesn't). Tapping the button again takes it back. Saved on this device, like highlights; the lecture's badge fills in
     its color, with a check, in the notes' list, on Home and in the headings. */
  var READ_AFTER = 60000;
  function readBtnHTML(lec){ var on = isRead(lec.id); return '<button class="btn btn-done' + (on ? " is-on" : "") + '" type="button" data-read aria-pressed="' + on + '">' + icon("check", 18) + "<span>" + (on ? "Notes done" : "Mark notes as done") + "</span></button>"; }
  function setRead(el, lec, on, how){
    STATE.read = STATE.read || {};
    if (on) STATE.read[lec.id] = day(0); else delete STATE.read[lec.id];
    saveState(); track("notes:" + (on ? "done" : "undone") + (how ? "-" + how : ""));
    var b = $("[data-read]", el); if (b) b.outerHTML = readBtnHTML(lec);
    var nav = $(".lec-list", el); if (nav) { nav.outerHTML = lecListHTML(lec); wireLecPick(el); }
    var t = $(".rd-title .lb", el); if (t) t.outerHTML = lecBadge(lec, "lb-h");
    wireReadBtn(el, lec);
  }
  function wireReadBtn(el, lec){ var b = $("[data-read]", el); if (b) b.addEventListener("click", function(){ setRead(el, lec, !isRead(lec.id), ""); }); }
  function wireRead(el, lec, manual){
    wireReadBtn(el, lec);
    var end = $(".foot-acts", el), opened = Date.now(), seen = false, timer = null;
    if (manual || !end || isRead(lec.id) || !("IntersectionObserver" in window)) return;
    var auto = function(){ if (end.isConnected && seen && !isRead(lec.id) && view === "notes") setRead(el, lec, true, "auto"); };
    var io = new IntersectionObserver(function(es){
      if (!end.isConnected) { io.disconnect(); clearTimeout(timer); return; }
      seen = es.some(function(e){ return e.isIntersecting; });
      clearTimeout(timer);
      if (!seen) return;
      var left = READ_AFTER - (Date.now() - opened);
      if (left <= 0) { io.disconnect(); auto(); } else timer = setTimeout(function(){ if (seen) { io.disconnect(); auto(); } }, left);
    });
    io.observe(end);
  }
  /* the previous and next lecture, at the end of every lecture's notes (Sam, 2026-11-06), in the order they were taught */
  function footNavHTML(lec){
    var i = LECS.indexOf(lec), prev = LECS[i - 1], next = LECS[i + 1];
    var link = function(l, k){ return '<a class="btn fn-' + k + lc(l.id) + '" href="#notes/' + esc(l.id) + '" data-lecnav="' + k + '">' + (k === "prev" ? icon("chevron", 20, "flip") : "") +
      "<span><small>" + (k === "prev" ? "Previous lecture" : "Next lecture") + "</small><b>" + esc(lecLabel(l) + " · " + shortTitle(l)) + "</b></span>" + (k === "next" ? icon("chevron", 20) : "") + "</a>"; };
    if (!prev && !next) return "";
    return '<nav class="foot-nav" aria-label="Other lectures">' + (prev ? link(prev, "prev") : "") + (next ? link(next, "next") : "") + "</nav>";
  }
  function lecBadge(l, cls){ var rd = isRead(l.id); return '<span class="lb num' + lc(l.id) + (cls ? " " + cls : "") + (isExamLec(l.id) ? " is-on" : "") + (rd ? " is-read" : "") + '" aria-hidden="true">' + esc(lecLabel(l)) + (rd ? '<span class="lb-ck">' + icon("check", 12) + "</span>" : "") + "</span>"; }
  function lecItemHTML(l, cur){
    var r = lecProgress(l), tw = r.total ? Math.round(r.tried / r.total * 100) : 0, rw = r.total ? Math.round(r.right / r.total * 100) : 0;
    var rd = isRead(l.id), sub = !r.tried ? (rd ? "Notes done · " + pl(r.total, "question") + " to try" : "Not started · " + pl(r.total, "question")) : (rd ? "Notes done · " : "") + r.tried + " of " + r.total + " tried" + (r.pct !== null && r.a >= 3 ? " · " + r.pct + "% right" : "");
    return '<li><a class="lec-item' + lc(l.id) + (rd ? " is-read" : "") + '" href="#notes/' + esc(l.id) + '"' + (cur ? ' aria-current="page"' : "") + ">" + lecBadge(l) +
      '<span class="lt"><b>' + esc(shortTitle(l)) + '</b><small class="num">' + esc(sub) + "</small>" +
      '<span class="bar" aria-hidden="true"><i class="tried" style="width:' + tw + '%"></i><i class="right" style="width:' + rw + '%"></i></span></span>' +
      '<span class="sr">' + esc(lecLabel(l)) + (rd ? ", notes done" : "") + (cur ? ", open now" : "") + "</span></a></li>";
  }
  function mindMapFor(lec){
    var d = document.createElement("div"); d.innerHTML = NOTES.full[lec.id] || "";
    var branches = [], cur = { label: null, children: [] }, seen = {};
    Array.prototype.forEach.call(d.children, function(el){
      if (/^H[34]$/.test(el.tagName)) { if (cur.label && cur.children.length) branches.push(cur); cur = { label: el.textContent.trim(), children: [] }; return; }
      if (!cur.label) return;
      Array.prototype.forEach.call(el.querySelectorAll("b, strong"), function(x){ var t = x.textContent.trim(), k = t.toLowerCase(); if (t.length < 2 || t.length > 38 || seen[k] || cur.children.length >= 6) return; seen[k] = 1; cur.children.push({ label: t }); });
    });
    if (cur.label && cur.children.length) branches.push(cur);
    return { label: lecLabel(lec) + " " + lec.title, children: branches };
  }
  function figCardHTML(key){
    if (!FIG) return "";
    if (key === "cuspMap") return FIG.cuspMapHTML(1);
    if (FIG.ANIMA.meta(key)) return '<div class="fig-anima">' + FIG.ANIMA.html(key) + "</div>";
    var f = FIG.FIGS[key]; return f ? '<figure class="fig-card"><h4>' + esc(f.title) + "</h4>" + f.svg + "<p>" + esc(f.caption) + "</p>" + HX.figKeyHTML(f) + "</figure>" : "";
  }
  function placeFigs(prose, lecId, level, rest){
    var placed = {}, kids = Array.prototype.slice.call(prose.children);
    function norm(t){ return String(t || "").replace(/\s+/g, " ").trim(); }
    (FIG.FIG_PLACE[lecId] || []).forEach(function(p){
      var at = p[level] || p.full, el = null, i;
      for (i = 0; i < kids.length; i++) { if (norm(kids[i].textContent).indexOf(at) === 0) { el = kids[i]; break; } }
      if (!el) return;
      if (p.end || /^H[1-6]$/.test(el.tagName)) { var j = kids.indexOf(el) + 1; while (j < kids.length && !/^H[1-6]$/.test(kids[j].tagName)) j++; el = kids[j - 1]; }
      var keys = p.widget ? [p.widget] : p.figs, box = document.createElement("div");
      box.className = "lec-fig-inline"; box.setAttribute("data-sh-noread", "");
      box.innerHTML = keys.every(function(k){ return FIG.ANIMA.meta(k); }) ? keys.map(figCardHTML).join("") : '<div class="fig-grid">' + keys.map(figCardHTML).join("") + "</div>";
      var after = el; while (after.nextElementSibling && after.nextElementSibling.classList.contains("lec-fig-inline")) after = after.nextElementSibling;
      after.parentNode.insertBefore(box, after.nextSibling);
      keys.forEach(function(k){ placed[k] = 1; });
    });
    var left = ((CORE.figByLec || {})[lecId] || []).filter(function(k){ return !placed[k] && !(k === "fence" && placed.cuspMap); });
    if (rest && left.length) { rest.hidden = false; $(".fig-grid", rest).innerHTML = left.map(figCardHTML).join(""); }
  }
  /* the side-by-side charts (the live hub's Review groups), drawn in the notes of their lecture and on More's Side by side */
  function sectionHTML(sec){
    var inner = "";
    if (sec.type === "cards") inner = '<div class="cards">' + sec.items.map(function(c){ return '<div class="rv-card"><h4>' + esc(c.name) + "</h4>" + (c.sub ? '<p class="note">' + esc(c.sub) + "</p>" : "") + "<dl>" + c.facts.map(function(f){ return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("") + "</dl>" + (c.tip ? '<p class="rv-tip">' + esc(c.tip) + "</p>" : "") + "</div>"; }).join("") + "</div>";
    else if (sec.type === "table") inner = '<div class="tbl-wrap" tabindex="0"><table><thead><tr>' + sec.head.map(function(x){ return '<th scope="col">' + esc(x) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      sec.rows.map(function(r){ return "<tr>" + r.map(function(c, i){ return (i ? "<td>" : '<th scope="row">') + esc(sec.head[i] === "Lecture" && LBY[c] ? lecName(c) : c) + (i ? "</td>" : "</th>"); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    else if (sec.type === "html") inner = '<div class="rv-html">' + sec.html + "</div>";
    else if (sec.type === "list") inner = '<ul class="rv-list">' + sec.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    else if (sec.type === "figs") inner = '<div class="figs-slot" data-figs="' + esc(sec.figs.join(",")) + '"></div>';
    else if (sec.type === "flows") inner = '<div class="flows">' + (STUDY.sequences || []).filter(function(s){ return !sec.lec || s.lec === sec.lec; }).map(function(s){ return '<div class="flow"><h4>' + esc(s.title) + "</h4><ol>" + s.steps.map(function(st){ return "<li>" + esc(st) + "</li>"; }).join("") + "</ol></div>"; }).join("") + "</div>";
    return '<section class="rv-section">' + (sec.title ? "<h3>" + esc(sec.title) + "</h3>" : "") + inner + "</section>";
  }
  function checkYourself(host, lec){
    /* three per lecture: the likely ones first, then ones you haven't tried or missed */
    var pool = (QBL[lec.id] || []).map(function(r){ return QBY[r.id]; }).filter(function(q){ return q && (q.type === "mcq" || q.type === "multi"); });
    var score = function(q){ var s = ansOf(q.id); return (q.likely ? 0 : 2) + (s ? (s.last ? 3 : 1) : 0) + Math.random(); };
    var pick = pool.map(function(q){ return [score(q), q]; }).sort(function(a, b){ return a[0] - b[0]; }).slice(0, 3).map(function(x){ return x[1]; });
    var need = pick.some(needsFig);
    (need ? needFigures() : Promise.resolve()).then(function(){ if (!host.isConnected) return; pick.forEach(function(q){ host.appendChild(HX.card(q, { ctx: "check" })); }); });
  }
  function wireLecLinks(el){
    /* High yield's button opens the lecture's High likelihood questions (the bank's toggle on), the others the whole lecture */
    $$("[data-lecq]", el).forEach(function(a){ a.addEventListener("click", function(){ var lk = a.hasAttribute("data-lqlk"); STATE.ui.qset = ""; STATE.ui.qlec = a.getAttribute("data-lecq"); STATE.ui.qstatus = "all"; STATE.ui.qlikely = lk ? "likely" : ""; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; saveState(); track("notes:practice" + (lk ? "-likely" : "")); }); });
    $$("[data-cram]", el).forEach(function(a){ a.addEventListener("click", function(){ setTimeout(function(){ var c = document.getElementById("cram-" + a.getAttribute("data-cram")); if (c) c.scrollIntoView({ block: "start" }); }, 80); }); });
  }

  /* ======================= More ======================= */
  var MORE = [
    ["timmy", "podcast", "Timmy Time", "The audio review, with likes and comments"],
    ["hints", "hints", "Exam hints", "What the professor said would be tested, and the most likely questions"],
    ["cram", "cram", "Cram sheet", "Every lecture on one page, for the night before"],
    ["side", "sidebyside", "Side by side", "The charts that compare across lectures"],
    ["arcade", "arcade", "Arcade", "Games built on the material, with class high scores"],
    ["stats", "stats", "Stats and trophies", "Your answers, your rank, the trophy case and the leaderboards"],
    ["settings", "settings", "Settings", "Theme, text size, your daily goal, Timmy and the extras"]
  ];
  /* pages in More that aren't tiles: the idea board is a row under "Talk to us" */
  var MORE_ROWS = [["ideas", "thumbup", "Idea board", "Ideas for the hubs from the class: vote on them, or post your own"]];
  function renderMore(el, s){
    var page = MORE.concat(MORE_ROWS).filter(function(m){ return m[0] === s; })[0];
    if (!page) { drawMoreMenu(el); return; }
    var back = '<a class="btn btn-text back" href="#more">' + icon("chevron", 18, "flip") + "More</a>";
    el.innerHTML = '<div class="hx-page more-page">' + back + "<h1>" + esc(page[2]) + '</h1><div class="more-body"><p class="note loading">Loading…</p></div></div>';
    var body = $(".more-body", el);
    ({ timmy: moreTimmy, hints: moreHints, cram: moreCram, side: moreSide, arcade: moreArcade, stats: moreStats, settings: moreSettings, ideas: moreIdeas })[s](body);
  }
  /* More (Sam, 2026-11-06: "can use a spice up"): one tile per part, each on its own field of color with its drawing and
     a line of what's in it; Timmy Time is the big one, its host in headphones. Talk to us stays a list. */
  var MORE_FIELD = { timmy: "hub", hints: "sun", cram: "mint", side: "lilac", arcade: "peach", stats: "sun", settings: "plain" };
  function moreMeta(k){
    var pod = CORE.podcast, X = C.arcade || {}, x = HX.rankXp();
    return ({
      timmy: pod ? Math.round((pod.duration || 0) / 60) + " min" + (pod.chapters ? " · " + pl(pod.chapters.length, "chapter") : "") : "",
      hints: pl((CORE.likelyTopics || []).length, "likely topic"),
      cram: pl(LECS.length, "lecture"),
      side: "Across every lecture",
      arcade: pl((X.games || []).length, "game"),
      stats: HX.rankName() + (x === null ? "" : " · " + fmt(x) + " XP"),
      settings: focusOn() ? "Focus mode is on" : "Daily goal: " + pl(HX.goal(), "question")
    })[k] || "";
  }
  function drawMoreMenu(el){
    var pod = CORE.podcast;
    var tile = function(m){
      var f = MORE_FIELD[m[0]] || "plain", big = m[0] === "timmy";
      var art = big ? spot("notes", POD_COL, "mt-notes") + spot("timmyTime", POD_COL, "mt-timmy") : icon(m[1], 40);
      return '<li class="mt f-' + f + (big ? " is-big" : "") + '"><a href="#more/' + m[0] + '"><span class="mt-art" aria-hidden="true">' + art + '</span><span class="mt-text"><b>' + esc(m[2]) + "</b><small>" + esc(m[3]) + "</small>" +
        '<span class="mt-meta num">' + esc(moreMeta(m[0])) + "</span></span>" + icon("chevron", 20) + "</a></li>";
    };
    el.innerHTML = '<div class="hx-page more"><h1>More</h1><p class="more-lede">Everything past the notes and the questions: the review, the games, your stats and your settings.</p>' +
      '<nav aria-label="Study and play"><ul class="more-tiles">' + MORE.filter(function(m){ return (m[0] !== "timmy" || pod) && (m[0] !== "side" || !CORE.noSide); }).map(tile).join("") + "</ul></nav>" +
      '<section class="panel menu talk" aria-labelledby="mwH"><h2 id="mwH">Talk to us</h2><ul class="rows">' +
        MORE_ROWS.map(function(m){ return '<li><a href="#more/' + m[0] + '">' + icon(m[1], 22) + "<span><b>" + esc(m[2]) + "</b><small>" + esc(m[3]) + "</small></span>" + icon("chevron", 18) + "</a></li>"; }).join("") +
        '<li><button type="button" data-sh-inbox>' + icon("inbox", 22) + "<span><b>Inbox</b><small>Replies to what you report or suggest, and notices to the class</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-open="suggest">' + icon("comment", 22) + "<span><b>Suggest something</b><small>An idea for this hub or the site</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-open="flag">' + icon("report", 22) + "<span><b>Report an issue</b><small>A typo, a wrong key, something broken</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-tour>' + icon("tour", 22) + "<span><b>Take the tour</b><small>Two minutes, on the real buttons</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><a href="' + esc(C.about || "../../../about/") + '">' + icon("about", 22) + "<span><b>About</b><small>Every feature, trophy and easter egg</small></span>" + icon("chevron", 18) + "</a></li>" +
        '<li><a href="' + esc(C.back || "../../../index.html") + '">' + icon("home", 22) + "<span><b>All hubs</b><small>Back to the dashboard</small></span>" + icon("chevron", 18) + "</a></li>" +
      "</ul></section></div>";
    $$("[data-open]", el).forEach(function(b){ b.addEventListener("click", function(){
      var k = b.getAttribute("data-open"); if (k === "flag" && window.shOpenFlag) { window.shOpenFlag(); return; }
      var open = function(){ var p = document.getElementById("shstat-" + k + "-pill"); if (p) p.click(); };
      /* the Suggest box's "Also post it on the idea board" tick is the idea board's (widget/ideas.js): load it first */
      if (k === "suggest") loadScript(WIDGET + "ideas.js").then(open, open); else open();
    }); });
    var t = $("[data-tour]", el); t.addEventListener("click", function(){ track("more:tour"); startTour(); });
  }
  /* the idea board (widget/ideas.js, the same board as the dashboard's): it opens on this hub's ideas and the ones for
     all hubs, and a new idea starts on this hub. Its server comes with the redesign's release (migration_v54). */
  function moreIdeas(body){
    var shut = function(){ body.innerHTML = '<p class="note">The idea board isn\'t open yet. For now, <b>Suggest something</b> (under More) reaches Sam.</p>'; };
    loadScript(WIDGET + "ideas.js").then(function(){
      whenWidget("shSupabase", function(sb){
        if (!body.isConnected || view !== "more" || sub !== "ideas") return;
        if (!sb || !window.shIdeas) { shut(); return; }
        body.innerHTML = "<div></div>";
        window.shIdeas.mount(body.firstChild, { sb: sb, hub: HUB, heading: false, level: "h2", page: 8,
          hubs: function(){ return [{ id: HUB, name: C.name || HUB }]; },
          name: function(id){ return id === HUB ? (C.name || "") : ""; },
          editName: function(){ if (window.shEditName) window.shEditName(); },
          onReady: function(ok){ if (!ok && body.isConnected) shut(); } });
      });
    }, shut);
  }
  function moreTimmy(body){
    if (!CORE.podcast) { body.innerHTML = "<p>No episode for this hub yet.</p>"; return; }
    body.innerHTML = '<div class="pod-slot" data-sh-podcast></div>';
    var slot = $(".pod-slot", body);
    if (slot.hasAttribute("data-sh-podcast-ready")) { podDress(slot); return; }
    var mo = new MutationObserver(function(){ if (slot.hasAttribute("data-sh-podcast-ready")) { mo.disconnect(); podDress(slot); } });
    mo.observe(slot, { attributes: true, attributeFilter: ["data-sh-podcast-ready"] });
  }
  /* Timmy Time's player, redesigned (Sam, 2026-11-11): the shared player (widget/podcast.js, the same on every hub) fills
     the slot; the engine then lays it out as one page: the episode on a field of the hub's color with Timmy in headphones
     (he bobs while it plays), the play controls and a progress bar on it; then the chapters as a track list (always open,
     two columns on a wide screen, the one playing marked), then what the class thinks. Only the layout and the drawing change: every control, vote
     and comment is the shared player's own, so it works and counts the same as on the live hubs. */
  function podDress(slot){
    var card = $(".sh-pod-card", slot); if (!card || card.classList.contains("pod-x")) return;
    var main = $(".sh-pod-main", card), art = $(".sh-pod-art", card), social = $(".sh-pod-social", card), chs = $(".sh-pod-chapters", card);
    if (!main || !art) return;
    card.classList.add("pod-x");
    art.innerHTML = spot("notes", POD_COL, "pa-notes") + spot("timmyTime", POD_COL, "pa-timmy");
    art.setAttribute("aria-hidden", "true");
    var title = $(".sh-pod-title", main); if (title) { title.setAttribute("role", "heading"); title.setAttribute("aria-level", "2"); }
    var seek = $(".sh-pod-progress .sh-pod-seek", main);
    if (seek) { var bar = document.createElement("span"); bar.className = "pod-bar"; bar.innerHTML = '<i class="pod-fill" aria-hidden="true"></i>'; seek.parentNode.insertBefore(bar, seek); bar.appendChild(seek); }
    var hero = document.createElement("div"); hero.className = "pod-hero";
    card.insertBefore(hero, card.firstChild); hero.appendChild(main); hero.appendChild(art);
    var cols = document.createElement("div"); cols.className = "pod-cols";
    if (chs) {
      chs.hidden = false; chs.style.setProperty("--rows", Math.ceil($$(".sh-pod-ch", chs).length / 2));
      $$(".sh-pod-ch", chs).forEach(function(b){ b.insertAdjacentHTML("beforeend", '<span class="pod-eq" aria-hidden="true"><i></i><i></i><i></i></span>'); });
      var sec = document.createElement("section"); sec.className = "panel pod-chs"; sec.setAttribute("aria-labelledby", "podChH");
      sec.innerHTML = '<h2 id="podChH">Chapters</h2><p class="note">Tap one to jump there.</p>'; sec.appendChild(chs); cols.appendChild(sec);
    }
    if (social) {
      social.classList.add("panel"); social.setAttribute("aria-labelledby", "podSoH"); social.setAttribute("role", "region");
      social.insertAdjacentHTML("afterbegin", '<h2 id="podSoH">What the class thinks</h2>'); cols.appendChild(social);
    }
    card.appendChild(cols);
    podSync();
  }
  /* the progress bar's filled part follows the player's own slider (the shared player moves the slider; the media events
     don't bubble, so they're caught on the way down) */
  function podSync(){
    requestAnimationFrame(function(){ $$(".pod-bar").forEach(function(b){ var s = b.querySelector(".sh-pod-seek"); if (s) b.style.setProperty("--p", String(+s.value / 1000)); }); });
  }
  ["timeupdate", "seeked", "loadedmetadata", "ended", "input", "change"].forEach(function(t){
    document.addEventListener(t, function(e){ var x = e.target; if (x && x.classList && (x.classList.contains("sh-pod-seek") || x.tagName === "AUDIO")) podSync(); }, true);
  });
  function moreHints(body){
    needStudy().then(function(){ needQuestions().then(function(){
      var X = C.hints || {}, hints = STUDY.hints || [];
      var html = (X.banner ? '<p class="notice">' + icon("clock", 20) + "<span>" + esc(X.banner) + "</span></p>" : "") + likelyHTML(X) +
        '<section class="panel" aria-labelledby="hqH"><h2 id="hqH">' + esc(X.words || "In " + (X.prof || "the professor") + "'s words") + "</h2><p class=\"note\">" + esc(X.wordsNote || "Direct quotes from the recordings where something was flagged to know, or waved off.") + "</p>" +
        LECS.map(function(l){ var items = hints.filter(function(x){ return x.lec === l.id; }); if (!items.length) return "";
          return '<div class="hint-group' + lc(l.id) + '"><h3>' + lecHead(l) + ' <a class="btn btn-text" href="#notes/' + esc(l.id) + '">Notes</a></h3>' + items.map(function(x){
            /* a focus list came from the class, not a recording, so it has no quotation marks (as on the live hub) */
            var said = x.kind !== "focus";
            return '<figure class="hint' + (said ? "" : " is-focus") + '"><blockquote>' + (said ? "“" : "") + esc(x.quote) + (said ? "”" : "") + '</blockquote><figcaption><span class="kind ' + esc(x.kind) + '">' + (x.kind === "deemphasize" ? "Less likely" : x.kind === "focus" ? "Focus list" : "Know this") + "</span>" + esc(x.take) + "</figcaption></figure>"; }).join("") + "</div>"; }).join("") + "</section>";
      body.innerHTML = html;
      $$("[data-likely]", body).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qset = ""; STATE.ui.qlec = b.getAttribute("data-likely"); STATE.ui.qstatus = "all"; STATE.ui.qlikely = "likely"; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; saveState(); track("hints:likely-practice"); go("questions"); }); });
    }); }).catch(function(){ body.innerHTML = "<p>Couldn't load the hints. Check your connection.</p>"; });
  }
  function likelyHTML(X){
    var T = CORE.likelyTopics || [], counts = CORE.examCounts || {};
    return '<section class="panel likely-box" aria-labelledby="lkH"><h2 id="lkH">Most likely questions</h2><p class="note">' + esc(X.likely || "Each lecture's predicted topics, strongest evidence first.") + '</p><div class="likely-grid">' + LECS.map(function(l){
      var ts = T.filter(function(t){ return t.lec === l.id; }); if (!ts.length) return "";
      var grp = CORE.mock && CORE.mock.groups ? Object.keys(CORE.mock.groups).filter(function(k){ return CORE.mock.groups[k].indexOf(l.id) > -1; })[0] : null;
      var cnt = grp && counts[grp] ? counts[grp] + " on the exam for " + CORE.mock.groups[grp].map(function(id){ return lecLabel(LBY[id]); }).join(" and ") + " together" : counts[l.id] ? counts[l.id] + " on the exam" : pl(ts.length, "predicted topic");
      return '<div class="likely-lec' + lc(l.id) + '"><h3>' + lecHead(l) + ' <span class="note">' + esc(cnt) + "</span></h3><ol>" +
        ts.map(function(t){ return "<li>" + esc(t.t) + ' <span class="note">' + esc(t.basis) + "</span></li>"; }).join("") +
        '</ol><button class="btn" type="button" data-likely="' + esc(l.id) + '">Practice these (' + ts.reduce(function(k, t){ return k + t.ids.length; }, 0) + ")</button></div>";
    }).join("") + "</div></section>";
  }
  function moreCram(body){
    needStudy().then(function(){
      body.innerHTML = '<div class="cram-grid">' + LECS.map(function(l){ var c = (STUDY.cram || {})[l.id] || []; if (!c.length) return "";
        return '<section class="panel cram' + lc(l.id) + '" id="cram-' + esc(l.id) + '" aria-labelledby="cr' + esc(l.id) + '"><h2 id="cr' + esc(l.id) + '">' + lecHead(l) + "</h2><ul>" + c.map(function(b){ return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>"; }).join("") + "</div>";
    }).catch(function(){ body.innerHTML = "<p>Couldn't load the cram sheet.</p>"; });
  }
  function moreSide(body){
    needStudy().then(function(){
      var groups = (STUDY.review || []).filter(function(g){ return !g.lec; });
      body.innerHTML = groups.map(function(g){ return '<section class="charts panel" aria-label="' + esc(g.title) + '">' + (g.blurb ? '<p class="note">' + esc(g.blurb) + "</p>" : "") + g.sections.map(sectionHTML).join("") + "</section>"; }).join("") +
        '<p class="note">Each lecture\'s own charts sit under its notes: <a href="#notes">open the notes</a>.</p>';
      if ($("[data-figs]", body)) needFigures().then(function(){ $$("[data-figs]", body).forEach(function(b){ b.innerHTML = b.getAttribute("data-figs").split(",").map(figCardHTML).join(""); }); try { FIG.wireCuspMaps(body); FIG.ANIMA.mount(body); } catch (e) {} });
    });
  }
  /* the arcade: every game in the lobby (Sam, 2026-11-06; one game up front before), Sam's pick first; the games and
     their skin are the hub's own (arcade.js, from the live hub), so only the lobby is drawn here */
  function needArcade(){
    loadCss(WIDGET + "games.css"); loadCss(BASE + "arcade.css");
    return Promise.all([needQuestions(), needNotes(), needStudy(), loadScript(WIDGET + "games.js"), loadScript(BASE + "arcade.js")]).then(function(){
      if (!ARC && window.SH_ARCADE) ARC = window.SH_ARCADE({ esc: esc, state: STATE, save: saveState, toast: toast, questions: QS, lectures: LECS, lectureById: LBY, shuffled: shuffled,
        record: HX.recordAnswer, lecLabel: lecLabel, lc: lc, sortSets: STUDY.sortSets || [], readings: NOTES.full, review: STUDY.review || [] });
      /* Perio's arcade names them start / stop (Occlusion's and Heme & Endo's: startGame / stopAll) */
      var A0 = ARC && ARC.arcade;
      if (A0 && !A0.startGame && A0.start) ARC.arcade = { startGame: A0.start, stopAll: A0.stop, current: A0.current };
      return ARC;
    });
  }
  var GAME_INFO = {};
  function moreArcade(body){
    body.innerHTML = '<p class="note loading">Loading the arcade…</p>';
    needArcade().then(function(){
      var X = C.arcade || {}, first = X.first || "sort", games = (X.games || []).slice();
      var by = {}; games.forEach(function(g){ by[g.id] = g; GAME_INFO[g.id] = g; });
      var best = STATE.arcade.best || {}, plays = STATE.arcade.plays || {};
      games.sort(function(a, b){ return (b.id === first) - (a.id === first); });
      /* each game's own drawing (tools/figures/site/arcade.mjs), or its icon where a hub has none yet */
      var GA = AH.games || {};
      var art = function(g){ return GA[g.id] ? '<span class="game-pic">' + img(GA[g.id].body, "", "", AH.gamesViewBox) + "</span>" : '<span class="game-art" aria-hidden="true">' + icon(g.icon || "arcade", 30) + "</span>"; };
      var tile = function(g, k){ return '<li class="game c' + (k % 4) + (g.id === first ? " is-first" : "") + (GA[g.id] ? " has-pic" : "") + '">' + art(g) + '<div><h2>' + esc(g.name) + "</h2><p>" + esc(g.desc) + '</p><p class="note num">Your best: ' + fmt(best[g.id] || 0) + " · played " + pl(plays[g.id] || 0, "time") + '</p></div><button class="btn' + (g.id === first ? " btn-primary" : "") + '" type="button" data-game="' + esc(g.id) + '">' + icon("play", 18) + "Play</button></li>"; };
      body.innerHTML = '<div class="arcade-lobby"><ul class="ar-grid">' + games.map(tile).join("") + "</ul>" +
        '<p class="note">' + esc(X.how || "") + "</p></div>" +
        '<div id="panel-arcade" class="arcade-stage" hidden></div>';
      var stage = $("#panel-arcade", body), lobby = $(".arcade-lobby", body);
      function back(){ try { ARC.arcade.stopAll(); } catch (e) {} stage.hidden = true; stage.innerHTML = ""; lobby.hidden = false; }
      $$("[data-game]", body).forEach(function(b){ b.addEventListener("click", function(){ lobby.hidden = true; stage.hidden = false; track("arcade:open=" + b.getAttribute("data-game")); ARC.arcade.startGame(b.getAttribute("data-game")); stage.scrollIntoView({ block: "start" }); }); });
      /* the games' own Back buttons go to this lobby, not the live hub's */
      stage.addEventListener("click", function(e){ if (e.target.closest("[data-back]")) { e.stopPropagation(); e.preventDefault(); back(); } }, true);
    }).catch(function(e){ body.innerHTML = "<p>Couldn't load the arcade. Check your connection.</p>"; if (window.console) console.error(e); });
  }
  /* the rank comes from the server after the page is up, and again as you answer: Stats shows it as it changes */
  document.addEventListener("sh:rank-profile", function(){ setTimeout(function(){ var g = $(".more-body .stats-grid"); if (g && g.parentNode) moreStats(g.parentNode); }, 0); });
  function moreStats(body){
    var rows = LECS.map(lecProgress), answered = ANSWERED ? STATE.totalSeen : STATE.totalAnswered, rightN = STATE.totalCorrect, acc = answered ? Math.round(STATE.totalCorrect / answered * 100) : null;
    /* Perio's shape counts each question once, the first time it's right: show right on the latest try instead */
    if (ANSWERED) { var tr = 0, rt = 0; Object.keys(STATE.answered).forEach(function(id){ var r = ansOf(id); if (r) { tr++; if (r.last) rt++; } }); rightN = rt; acc = tr ? Math.round(rt / tr * 100) : null; }
    var x = HX.rankXp(), p = HX.RANK.p, days = Object.keys(HX.goalDays()).length, game = HX.gameOn() && p && p.journey != null;
    body.innerHTML = '<div class="stats-grid">' +
      '<section class="panel" aria-labelledby="srH"><h2 id="srH">Your rank</h2><div class="rank-big"><span class="hp" data-rankart="64" aria-hidden="true">' + HX.rankArt(64) + "</span><div><p class=\"rank-name\">" + esc(HX.rankName()) + '</p><p class="num">' + (x === null ? "+" + fmt(HX.todayRec().xp) + " XP today" : fmt(x) + " XP" + (p && p.next_at && p.next_at > x ? " · " + fmt(p.next_at - x) + " to the next level" : "")) + "</p></div></div>" +
        (game ? '<div data-road></div><p class="note">10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss and 20 for every day you study. A question pays its first three right and its first three wrong answers a day. More comes from the day\'s 20th answer, fixing a miss, a finished mock exam and every mastery medal, which also starts 24 hours of double XP.</p>'
          : '<p class="note">10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss and 20 for every day you study (answer XP tops out at 600 a day).</p>') +
        '<button class="btn" type="button" data-open-stats>' + icon("trophy", 18) + "Trophies and leaderboards</button></section>" +
      '<section class="panel" aria-labelledby="ssH"><h2 id="ssH">Your answers</h2><dl class="kv">' +
        "<div><dt>Answered</dt><dd class=\"num\">" + fmt(answered) + "</dd></div><div><dt>" + (ANSWERED ? "Right on the latest try" : "Right") + "</dt><dd class=\"num\">" + fmt(rightN) + (acc !== null ? " · " + acc + "%" : "") + "</dd></div>" +
        "<div><dt>Best run</dt><dd class=\"num\">" + pl(STATE.bestStreak, "right in a row", "right in a row") + "</dd></div><div><dt>Days goal met</dt><dd class=\"num\">" + fmt(days) + "</dd></div>" +
        "<div><dt>Achievements</dt><dd class=\"num\">" + Object.keys(achMap() || {}).length + " of " + (CORE.achievements || []).length + "</dd></div></dl></section>" +
      '<section class="panel wide" aria-labelledby="slH"><h2 id="slH">By lecture</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Lecture</th><th scope="col" class="r">Tried</th><th scope="col" class="r">Right now</th><th scope="col" class="r">Accuracy</th></tr></thead><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + lecDot(r.l.id) + esc(lecName(r.l.id)) + '</th><td class="r num">' + r.tried + " of " + r.total + '</td><td class="r num">' + r.right + '</td><td class="r num">' + (r.pct === null ? "–" : r.pct + "%") + "</td></tr>"; }).join("") + "</tbody></table></div></section>" +
      '<section class="panel wide" aria-labelledby="saH"><h2 id="saH">Achievements</h2><ul class="ach">' + (CORE.achievements || []).map(function(a){ var got = achMap()[a.id]; return '<li class="' + (got ? "got" : "") + '">' + icon(got ? "check" : "goal", 20) + "<span><b>" + esc(a.name) + "</b><small>" + esc(a.desc) + (typeof got === "string" ? " · " + esc(dateLabel(got)) : "") + "</small></span></li>"; }).join("") + "</ul></section>" +
      "</div>";
    $("[data-open-stats]", body).addEventListener("click", function(){ var b = document.getElementById("shstat-stats-pill"); if (b) b.click(); track("more:trophies"); });
    /* the road ahead: the three journeys, where you are on yours and what the next one is (widget/journeys.js, loaded here) */
    var road = $("[data-road]", body);
    if (road && window.shRanks && window.shRanks.journeys) window.shRanks.journeys(function(J){
      if (!J || !road.isConnected) return;
      var q = {}, k; for (k in p) q[k] = p[k]; q.xp = x === null ? p.xp || 0 : x;
      road.innerHTML = '<h3 class="road-h">The road ahead</h3>' + J.road(q);
    });
  }
  /* Settings: the cuts (font, background music, accent metal) are gone; text size and theme stay, plus the goal.
     The extras use the same keys as widget/v3.js (EXTRAS) and the dashboard: keep the three in step. */
  var EXTRAS = [
    ["sh_pref_pet", "Timmy Tooth", "Your cartoon tooth buddy, on the bar. He hides during mock exams.", [["on", "On"], ["dash", "Dashboard only"], ["off", "Off"]]],
    ["sh_pref_eggs", "Hidden secrets", "Holidays, magic words and the other easter eggs. Clues are in the trophy case."],
    ["sh_pref_boss", "Plaque bosses", "A boss the whole class fights with right answers when 5+ people are online."],
    ["sh_pref_fairy", "Tooth Fairy", "Flies across the page now and then. Catch her for the fairy board."],
    ["sh_pref_probe", "Golden Probe", "One question a day is golden. First to get it right wins."],
    ["sh_pref_arch", "Full Arch chart", "A 32-tooth chart in the corner that fills as you answer right."],
    ["sh_pref_nuke", "Tactical nukes", "100 right in a row unlocks a strike. Mine only: you won't see classmates' strikes.", [["on", "On"], ["mine", "Mine only"], ["off", "Off"]]],
    ["sh_pref_celebrate", "Rank-up and trophy cards", "The rank-up cutscene, level-up, trophy and medal cards."],
    ["sh_pref_cheers", "Streak cheers", "Confetti and a toast every 5 right in a row."],
    ["sh_pref_fx", "Answer animations", "Pops, shakes, sweeps and fades. Off keeps the check and X marks."]
  ];
  var SIZES = [["small", "Small", .9], ["default", "Default", 1], ["large", "Large", 1.15], ["xlarge", "X-Large", 1.3], ["xxlarge", "XX-Large", 1.45]];
  function prefSet(k, v){ ls(k, v); try { document.dispatchEvent(new CustomEvent("sh:pref", { detail: { key: k, val: v } })); } catch (e) {} }
  function seg(key, opts, cur){ return '<span class="seg" role="group" data-key="' + esc(key) + '">' + opts.map(function(o){ return '<button type="button" data-val="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + "</button>"; }).join("") + "</span>"; }
  /* Focus mode (Sam, 2026-11-06): one switch that turns every extra off, and back to what you had when you turn it off.
     It writes the same keys as each extra's own switch, so every hub and the dashboard follow it. */
  var FOCUS_KEYS = EXTRAS.map(function(x){ return x[0]; }).concat(["sh_pref_flame"]);
  function focusOn(){ return ls("sh_pref_focus") === "on"; }
  function setFocus(on){
    if (on === focusOn()) return;
    if (on) {
      var prev = {}; FOCUS_KEYS.forEach(function(k){ prev[k] = ls(k) || "on"; });
      ls("sh_pref_focus_prev", JSON.stringify(prev));
      FOCUS_KEYS.forEach(function(k){ prefSet(k, "off"); });
    } else {
      var back = {}; try { back = JSON.parse(ls("sh_pref_focus_prev") || "{}") || {}; } catch (e) {}
      FOCUS_KEYS.forEach(function(k){ prefSet(k, back[k] || "on"); });
      ls("sh_pref_focus_prev", null);
    }
    prefSet("sh_pref_focus", on ? "on" : "off");
  }
  function focusRowHTML(){
    var on = focusOn();
    return '<div class="focus-row"><span class="focus-art" aria-hidden="true">' + icon("goal", 30) + '</span><div><b>Focus mode</b><small>' +
      (on ? "On: Timmy and every extra are off. Turn it off to bring back what you had." : "Turns Timmy and every extra off in one tap: just the notes and the questions.") + "</small></div>" +
      '<button class="btn' + (on ? " btn-primary" : "") + ' focus-btn" type="button" role="switch" aria-checked="' + on + '" data-focus>' + (on ? "On" : "Off") + "</button></div>";
  }
  function moreSettings(body){
    var theme = ls("sh_theme") || "", size = ls("sh_pref_size") || "default";
    var extrasHTML = function(){ return EXTRAS.map(function(x){ return '<div class="set-row"><div><b>' + esc(x[1]) + "</b><small>" + esc(x[2]) + "</small></div>" + seg(x[0], x[3] || [["on", "On"], ["off", "Off"]], ls(x[0]) || "on") + "</div>"; }).join(""); };
    body.innerHTML = '<div class="settings">' +
      '<section class="panel focus-panel' + (focusOn() ? " is-on" : "") + '" aria-label="Focus mode">' + focusRowHTML() + "</section>" +
      '<section class="panel" aria-labelledby="stH"><h2 id="stH">Look</h2>' +
        '<div class="set-row"><div><b>Theme</b><small>Every hub and the dashboard follow it.</small></div>' + seg("theme", [["light", "Light"], ["dark", "Dark"], ["", "Match my device"]], theme) + "</div>" +
        '<div class="set-row"><div><b>Text size</b><small>Makes everything bigger or smaller.</small></div>' + seg("size", SIZES, size) + "</div></section>" +
      '<section class="panel" aria-labelledby="sgH"><h2 id="sgH">Your daily goal</h2>' +
        '<div class="set-row"><div><b>Questions a day</b><small>The ring in the bar fills as you answer, right or wrong. Your streak counts any day you answer a question.</small></div>' + seg("goal", [["10", "10"], ["20", "20"], ["30", "30"], ["40", "40"], ["50", "50"]], String(HX.goal())) + "</div>" +
        (window.shEditName ? '<div class="set-row"><div><b>Your name</b><small>What classmates see on the leaderboards' + (window.shNameNow && window.shNameNow() ? ": " + esc(window.shNameNow()) : "") + '.</small></div><button class="btn" type="button" data-name>Change your name</button></div>' : "") + "</section>" +
      '<section class="panel" aria-labelledby="sxH"><h2 id="sxH">Timmy and the extras</h2><p class="note">The fun stuff that isn\'t studying. None of it shows during a mock exam.</p><div data-extras>' +
        extrasHTML() + "</div></section></div>";
    function paintFocus(){ var fp = $(".focus-panel", body); fp.classList.toggle("is-on", focusOn()); fp.innerHTML = focusRowHTML(); }
    body.addEventListener("click", function(e){
      if (e.target.closest("[data-focus]")) {
        var on = !focusOn(); setFocus(on); paintFocus(); $("[data-extras]", body).innerHTML = extrasHTML();
        track("settings:focus=" + (on ? "on" : "off")); toast(on ? "Focus mode is on. Every extra is off." : "Focus mode is off. Your extras are back.");
        $("[data-focus]", body).focus(); return;
      }
      var b = e.target.closest(".seg [data-val]"); if (b) {
        var k = b.parentNode.getAttribute("data-key"), v = b.getAttribute("data-val");
        $$("[data-val]", b.parentNode).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
        if (k === "theme") { ls("sh_theme", v); applyTheme(v); }
        else if (k === "size") { prefSet("sh_pref_size", v); docEl.style.zoom = (SIZES.filter(function(s){ return s[0] === v; })[0] || [0, 0, 1])[2]; }
        else if (k === "goal") { STATE.nx.goal = +v; var t = HX.todayRec(); if (!t.met && t.n >= +v) t.met = 1; saveNow(); HX.paintMeters(); }
        else {
          prefSet(k, v);
          /* turning one extra back on ends focus mode; the others stay off */
          if (v !== "off" && focusOn()) { prefSet("sh_pref_focus", "off"); ls("sh_pref_focus_prev", null); paintFocus(); }
        }
        track("settings:" + k + "=" + v);
        return;
      }
      if (e.target.closest("[data-name]") && window.shEditName) window.shEditName();
    });
  }
  function applyTheme(t){ if (t === "light" || t === "dark") docEl.setAttribute("data-theme", t); else docEl.removeAttribute("data-theme"); }

  /* one-line tips, the first time a part is seen (the arrival tour is cut; the full tour is in More) */
  /* a first-visit tip, under the page's title, or after `after` when the title isn't the page's own child
     (the notes: their one grid holds the title, so the tip goes under the toolbar, above the text it's about) */
  function tip(el, k, text, after){
    if (STATE.nx.tips[k]) return;
    var t = h('<p class="tipline" role="note">' + icon("hints", 18) + "<span>" + esc(text) + '</span><button class="btn btn-text" type="button">Got it</button></p>');
    $("button", t).addEventListener("click", function(){ STATE.nx.tips[k] = 1; saveState(); t.remove(); });
    var page = $(".hx-page", el); if (!page) return;
    var h1 = $("h1", page); (after || (h1 && h1.parentNode === page ? h1 : page.firstElementChild)).insertAdjacentElement("afterend", t);
  }

  /* ======================= the shared widget ======================= */
  function exportQuestions(){
    var ex = window.SH_EXPORT;
    /* the same shape as the live hub's export: question health fingerprints it, so a question keeps its version */
    /* CORE.exportCase (Perio's): the live hub put the Patient Box rows before the stem and listed a multi's keys */
    var xc = !!CORE.exportCase;
    ex.questions = QS.map(function(q){
      var hint = q.type === "mcq" ? q.choices[q.answer] : q.type === "multi" ? q.correct.map(function(k){ return q.choices[k]; }).join("; ") : q.type === "sequence" ? q.steps.join(" → ") : q.type === "match" ? q.pairs.map(function(p){ return p.join(": "); }).join("; ") : (q.answer || "");
      if (q.ex) hint = hint ? hint + " — " + q.ex : q.ex;
      var o = { id: q.id, lec: q.lec, text: (xc && q.pbox ? q.pbox.map(function(r){ return r.join(": "); }).join(". ") + ". " : "") + q.stem, hint: hint, choices: q.choices || null, answer: (q.type === "mcq" ? q.answer : null) };
      if (xc) o.correct = q.type === "multi" ? q.correct : null;
      return o;
    });
  }
  function exportSections(){
    var out = [], frag = function(html){ var d = document.createElement("div"); d.innerHTML = html || ""; return d; }, clean = function(t){ return String(t || "").replace(/\s+/g, " ").trim(); };
    LECS.forEach(function(l){
      var where = lecLabel(l) + " " + l.title;
      Array.prototype.forEach.call(frag(NOTES.full[l.id]).querySelectorAll("p, li, h3, h4"), function(el, k){ var t = clean(el.textContent); if (t.length > 2) out.push({ kind: "Notes", where: where, text: t, lec: l.id, go: { v: "notes", lec: l.id, k: k } }); });
      if (STUDY) ((STUDY.cram || {})[l.id] || []).forEach(function(b){ out.push({ kind: "Cram sheet", where: where, text: b, lec: l.id, go: { v: "cram", lec: l.id } }); });
    });
    /* every Review table row (each lecture's charts sit under its notes; Perio's live search found them too) */
    if (STUDY) (STUDY.review || []).forEach(function(g){ var t = ""; (g.sections || []).forEach(function(sec){
      t = sec.title || t;
      var rows = sec.type === "table" ? sec.rows.map(function(r){ return r.join(" · "); }) : sec.type === "html" ? Array.prototype.map.call(frag(sec.html).querySelectorAll("tr, li"), function(el){ return Array.prototype.map.call(el.tagName === "TR" ? el.children : [el], function(c){ return c.textContent; }).join(" · "); }) : [];
      rows.forEach(function(r){ r = clean(r); if (r.length > 2) out.push({ kind: "Review tables", where: (LBY[g.lec] ? lecLabel(LBY[g.lec]) + " · " : "") + t, text: r, lec: g.lec || "", go: { v: "review", lec: g.lec || "", t: t } }); });
    }); });
    if (STUDY) (STUDY.hints || []).forEach(function(x){ var l = LBY[x.lec]; out.push({ kind: "Exam hints", where: l ? lecLabel(l) + " " + l.title : "", text: clean(x.quote + " " + x.take), lec: x.lec, go: { v: "hints", lec: x.lec } }); });
    window.SH_EXPORT.sections = out;
    if (STUDY) window.SH_EXPORT.hints = (STUDY.hints || []).map(function(x){ return { lec: x.lec, quote: x.quote }; });
  }
  function flashIn(fn){ setTimeout(function(){ var el = fn(); if (el && window.shFlash) window.shFlash(el); }, 120); }
  window.SH_GOTO = function(g){
    if (!g) return;
    if (g.v === "notes") { STATE.ui.level = "full"; go("notes/" + g.lec);
      var t0 = Date.now(); (function wait(){ var p = $(".reading-prose"); if (p && p.closest("#lec-" + g.lec)) flashIn(function(){ return Array.prototype.filter.call(p.querySelectorAll("p, li, h3, h4"), function(el){ return !el.closest("[data-sh-noread]"); })[g.k]; }); else if (Date.now() - t0 < 5000) setTimeout(wait, 100); })(); }
    else if (g.v === "cram") { go("more/cram"); setTimeout(function(){ var c = document.getElementById("cram-" + g.lec); if (c && window.shFlash) window.shFlash(c); }, 600); }
    else if (g.v === "hints") go("more/hints");
    else if (g.v === "review") {
      if (!g.lec || !LBY[g.lec]) { go("more/side"); return; }
      /* a lecture's chart: open its notes and flash the chart by its title */
      go("notes/" + g.lec);
      var t1 = Date.now(); (function wait(){ var hd = $$(".charts .rv-section h3").filter(function(x){ return x.textContent === g.t; })[0]; if (hd) flashIn(function(){ return hd.closest(".rv-section"); }); else if (Date.now() - t1 < 5000) setTimeout(wait, 150); })();
    }
    else if (g.v === "bank") {
      HX.bankReset(); HX.bankSearch = g.q || "";
      /* a search that finds a review-only question ticks every lecture, so the jump lands on it (as on the live hub) */
      if (hasReview() && QS && HX.bankSearch) { STATE.ui.qlec = LECS.map(function(l){ return l.id; }); if (!HX.filtered().some(function(q){ return isReview(q.lec); })) STATE.ui.qlec = "all"; }
      saveState(); go("questions");
    }
  };
  var LOADED = Date.now();
  window.SH_SYNC = {
    merge: function(byQid, days){
      var changed = false, added = 0, lecOf = {};
      IDX.forEach(function(r){ lecOf[r.id] = r.lec; });
      Object.keys(byQid).forEach(function(id){
        var lec = lecOf[id]; if (!lec) return;
        var sv = byQid[id], s = ansOf(id) || { n: 0, c: 0, last: null };
        if (sv.n <= s.n) return;
        var dn = sv.n - s.n, dc = Math.max(0, sv.c - s.c);
        if (!s.n) added++;
        if (ANSWERED) {
          /* as the live Perio merges: more tries win; right once on any device counts once */
          var a = STATE.answered[id] || { correct: false, seen: 0, lastCorrect: null };
          STATE.totalSeen += dn;
          if (sv.c > 0 && !a.correct) { a.correct = true; STATE.totalCorrect += 1; }
          a.seen = sv.n; a.lastCorrect = sv.last; STATE.answered[id] = a;
        } else {
          STATE.totalAnswered += dn; STATE.totalCorrect += dc;
          var lsx = STATE.lecStats[lec] || { a: 0, c: 0 }; lsx.a += dn; lsx.c += dc; STATE.lecStats[lec] = lsx;
          STATE.seen[id] = { n: sv.n, c: Math.max(sv.c, s.c), last: sv.last };
        }
        changed = true;
      });
      (days || []).forEach(function(d){
        if (ANSWERED) { if (!STATE.activeDates[d]) { STATE.activeDates[d] = true; changed = true; } }
        else if (STATE.days.indexOf(d) === -1) { STATE.days.push(d); changed = true; }
      });
      if (!changed) return;
      if (!ANSWERED) STATE.days.sort(); HX.achievements(true); saveNow(); HX.paintMeters();
      if (added) toast("Synced " + pl(added, "question") + " from your other devices");
      /* Home, or a bank not yet answered in, redraws with the merged answers (its counts and Missed last time) */
      if (Date.now() - LOADED < 8000 && (view === "home" || (view === "questions" && !HX.SESSION.n && !parse()[1] && !(document.activeElement && document.activeElement.matches("input, textarea"))))) route();
    }
  };
  window.SH_DRILL = {
    pool: function(){ return IDX.filter(function(q){ return isExamLec(q.lec) || isReview(q.lec); }).map(function(q){ var s = ansOf(q.id); return { id: q.id, lec: q.lec, last: s ? !!s.last : null, hy: (CORE.drillHy || {})[q.src] || "" }; }); },
    render: function(el, qid){ var q = QBY[qid]; if (!q) return false; el.innerHTML = ""; el.appendChild(HX.card(q, { ctx: "drill" })); return true; }
  };
  window.SH_PINS = true;
  window.SH_SECTION = section;
  window.SH_TOUR = { prompt: false, steps: tourSteps };
  /* the tour's script loads when it's started (widget/v3.js), not with the page */
  function startTour(){
    if (window.shTour) return window.shTour.start();
    if (window.shLoadTour) window.shLoadTour(function(){ if (window.shTour) window.shTour.start(); });
    else toast("The tour is still loading. Try again in a moment.");
  }
  function tourSteps(o){
    var press = function(hash){ return function(){ if (location.hash !== "#" + hash) location.hash = hash; }; };
    return [
      { title: "Welcome to " + (C.name || "this hub"), body: "<p>A quick look at where everything is, on the real buttons. It switches pages for you and takes about a minute.</p>" },
      { el: "#modeSwitch", title: "Four pages", body: "<ul><li><b>Home</b>: the countdown, where to go next and your progress.</li><li><b>Notes</b>: every lecture, to read or listen to, with its charts and three questions to check yourself.</li><li><b>Questions</b>: the whole bank, plus the daily drill, yesterday's misses, weak spots and the mock.</li><li><b>More</b>: Timmy Time, hints, the cram sheet, the arcade, stats and settings.</li></ul>" },
      { el: function(){ return [].slice.call(document.querySelectorAll("[data-goalm]")).filter(o.visible)[0]; }, title: "Your daily goal", body: "<p>The ring fills toward " + HX.goal() + " questions a day, and the flame counts the days in a row you study. Change the goal in More, Settings.</p>" },
      { el: function(){ return [document.getElementById("hxRank"), document.getElementById("hxXp")].filter(o.visible)[0]; }, title: "XP and your rank", body: "<p>Every answer earns XP, and it flies up here. Tap it for your stats and trophies.</p>" },
      { el: ".hx-set", title: "Settings", body: "<p>Theme, text size, your daily goal, Timmy and the extras.</p>" },
      { el: ".shpet-home", title: "Timmy", body: "<p>Timmy Tooth, in the corner, cheers when you get one right and when you meet your goal. Tap him for a joke.</p>" },
      { before: press("questions"), wait: 600, el: ".qbar", title: "The question bank", body: "<p>Pick lectures, what to show and the order here. The sets underneath are the daily drill, yesterday's misses, your weak spots and the timed mock.</p>" },
      { before: press("home"), wait: 400, el: ".quick", title: "Start here", body: "<p>One tap to practice, the drill, your notes, the mock and the rest.</p>", last: true }
    ];
  }

  function whenWidget(name, cb){ var t0 = Date.now(); (function poll(){ if (window[name]) { cb(window[name]); return; } if (Date.now() - t0 > 12000) { cb(null); return; } setTimeout(poll, 250); })(); }
  function startWidget(){
    if (window.__shxWidget) return; window.__shxWidget = true;
    /* the shared widget's stylesheet comes with it, after the first screen, ahead of hub.css so hub.css still wins */
    if (!document.querySelector('link[href$="widget/v3.css"]')) {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = WIDGET + "v3.css";
      var mine = document.querySelector('link[href$="widget/hub.css"]');
      if (mine) mine.parentNode.insertBefore(css, mine); else document.head.appendChild(css);
    }
    var sb = document.createElement("script"); sb.src = WIDGET + "vendor/supabase-2.117.2.js";
    sb.onload = sb.onerror = function(){
      var s = document.createElement("script");
      s.src = WIDGET + "v3.js"; s.setAttribute("data-hub", HUB); s.setAttribute("data-answered-event", EVT); s.setAttribute("data-default-mode", "home");
      /* the game layer: v3.js asks the database for it and works as on the live hubs until it is there */
      s.setAttribute("data-game", "v2");
      s.onload = function(){
        /* Report and Pin on every card, as on the live hubs (the class picks are the engine's own: classPicks) */
        if (window.shWireClassStats) window.shWireClassStats(".qcard[data-qid]");
        var boot = window.shBootstrap && window.shBootstrap.ready;
        if (boot && boot.then) boot.then(function(d){ if (d && d.rank && typeof d.rank === "object" && !HX.RANK.p) { HX.RANK.p = d.rank; HX.paintMeters(); } });
        whenWidget("shRanks", function(){ HX.paintMeters(); });
        whenWidget("shPet", function(){ setTimeout(function(){ if (HX.SESSION.hp0 === null) HX.SESSION.hp0 = HX.petHp(); }, 1500); });
      };
      document.body.appendChild(s);
    };
    document.body.appendChild(sb);
  }

  /* ======================= boot ======================= */
  function boot(){
    applyTheme(ls("sh_theme") || "");
    var z = (SIZES.filter(function(s){ return s[0] === (ls("sh_pref_size") || "default"); })[0] || [0, 0, 1])[2]; if (z !== 1) docEl.style.zoom = z;
    if (location.hash === "#drill") history.replaceState(null, "", "#questions/drill");
    buildShell();
    var main = $(".hx-view[data-view=home]"); main.hidden = false; main.innerHTML = '<div class="hx-page"><p class="note loading">Loading…</p></div>';
    getJSON("core.json").then(function(c){
      setCore(c);
      window.SH_EXPORT = { lectures: LECS.map(function(l){ return { id: l.id, title: lecLabel(l) + " " + l.title, who: l.who, status: l.status }; }), exams: (c.exams || []).map(function(x){ return { label: x.label, date: x.date }; }), sections: [], hints: [] };
      /* review-only questions left out of the mastery medal (widget/ranks.js), as on the live hub */
      if (hasReview()) window.SH_EXPORT.uncounted = function(){ var n = 0, right = 0; IDX.forEach(function(q){ if (!isReview(q.lec)) return; n++; var s = ansOf(q.id); if (s && s.last) right++; }); return { n: n, right: right }; };
      if (c.podcast) window.SH_PODCAST = Object.assign({}, c.podcast, { src: ASSETS + c.podcast.src });
      route();
      /* the rest of the content in the background, then the shared widget (it needs the notes for its search and eggs) */
      var idle = window.requestIdleCallback || function(f){ setTimeout(f, 300); };
      idle(function(){
        needNotes().then(function(){ return needStudy().catch(function(){}); }).then(function(){ exportSections(); }).catch(function(){}).then(startWidget);
        needQuestions().catch(function(){});
      });
    }).catch(function(e){ main.innerHTML = offlineHTML("this hub"); if (window.console) console.error(e); });
  }

  /* ======================= the parts =======================
     The other three files (see the top of this one) share this closure through HX:
     - what is here and never replaced after the page loads (helpers, drawings, STATE, the lookups) a part takes
       under its own name, in the list at its top: add a name here and there to use another one;
     - what is replaced later (the content, once it arrives; the view) a part reads as HX.CORE, HX.QS, HX.view;
     - what a part has for the other files it puts on HX at its end, and the others call it as HX.card(...).
     Each part runs once, here, in this order, before the page boots. */
  var HX = {
    C: C, A: A, AH: AH, HUB: HUB, EVT: EVT, BASE: BASE, WIDGET: WIDGET, ASSETS: ASSETS, docEl: docEl,
    reduced: reduced, $: $, $$: $$, esc: esc, h: h, fmt: fmt, pl: pl, ymd: ymd, day: day, calDays: calDays,
    dateLabel: dateLabel, timeLabel: timeLabel, shuffled: shuffled, seeded: seeded, track: track, ls: ls,
    visible: visible, toast: toast, icon: icon, artSvg: artSvg, spot: spot, img: img, emblem: emblem,
    flameLevel: flameLevel, flame: flame, ring: ring, mark: mark, ANSWERED: ANSWERED, STATE: STATE, ansOf: ansOf,
    studyDayList: studyDayList, achMap: achMap, putAnswer: putAnswer, saveNow: saveNow, saveState: saveState,
    QBY: QBY, QBL: QBL, LBY: LBY, EXAM_LECS: EXAM_LECS, REVIEW: REVIEW, loadScript: loadScript, loadCss: loadCss,
    lecLabel: lecLabel, shortTitle: shortTitle, lecName: lecName, LCOL: LCOL, lc: lc, lecDot: lecDot,
    lecChip: lecChip, lecHead: lecHead, isRead: isRead, isExamLec: isExamLec, isReview: isReview,
    hasReview: hasReview, needQuestions: needQuestions, needNotes: needNotes, needStudy: needStudy,
    needFigures: needFigures, needsFig: needsFig, liveNow: liveNow, paintLive: paintLive, parse: parse, route: route,
    go: go, section: section, lecStat: lecStat, lecProgress: lecProgress, srsMisses: srsMisses,
    offlineHTML: offlineHTML, tip: tip, whenWidget: whenWidget
  };
  [["CORE", function(){ return CORE; }], ["QS", function(){ return QS; }], ["LECS", function(){ return LECS; }],
    ["IDX", function(){ return IDX; }], ["NOTES", function(){ return NOTES; }],
    ["STUDY", function(){ return STUDY; }], ["FIG", function(){ return FIG; }], ["ARC", function(){ return ARC; }],
    ["EXAM", function(){ return EXAM; }], ["shell", function(){ return shell; }],
    ["view", function(){ return view; }], ["sub", function(){ return sub; }]
  ].forEach(function(p){ Object.defineProperty(HX, p[0], { get: p[1], enumerable: true }); });
  var PARTS = window.SH_HUB_PARTS || {};
  ["rewards", "timmy", "bank"].forEach(function(k){
    if (!PARTS[k]) throw new Error("widget/hub-" + k + ".js is not loaded: the page loads it before widget/hub.js");
    PARTS[k](HX);
  });
  window.shHub = { go: go, state: function(){ return STATE; }, card: function(id){ var q = QBY[id]; return q ? HX.card(q, {}) : null; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
