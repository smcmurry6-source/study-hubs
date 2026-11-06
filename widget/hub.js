/* ============ THE HUB ENGINE (widget/hub.js + widget/hub.css): the redesign, phase 1 ============
   One engine for every redesigned hub. Only the new versions load it (hubs/<id>/next/): nothing links to them, and
   outside a preview their page sends the visitor to the live hub. The live hubs keep widget/v3.js and their own code
   until the redesign is released all at once (vault/tasks/2026-11-06-redesign-release.md).

   A hub's page is configuration (window.SH_HUB), its art (widget/hub-art/<hub>.js: tint, emblem, masthead, built by
   tools/figures/site/build.mjs) and its content, in files next to it (content/), written from the live hub by
   tools/hub-next/build.mjs (CI's --check fails when they're stale):
     core.json       lectures, exams, dates, likely topics, the mock's blueprint, the podcast, the question index
     questions.json  the bank;  notes.json  the notes at both levels;  study.json  hints, cram, review charts
     figures.js/css  the drawn figures and case pictures;  arcade.js/css  the arcade's games and its skin
   Only core.json comes before the first screen; the rest loads in the background or when a view needs it.

   It keeps everything progress is keyed on: the hub id, the question ids, the hub's own state key (the same shape as
   the live hub's STATE) and its answered event (the same detail as the live recordAnswer), so everyone's answers, XP,
   ranks, pins, spaced review and question health carry over at the release. Then it loads widget/v3.js like any hub.

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
  function defaultState(){
    return { v: 1, seen: {}, streak: 0, bestStreak: 0, totalCorrect: 0, totalAnswered: 0, lecStats: {}, days: [], ach: {},
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
  var EXAM = null, EXAM_LECS = {};
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
  function isExamLec(id){ return !!EXAM_LECS[id]; }
  function setCore(c){
    CORE = c; LECS = c.lectures || []; LECS.forEach(function(l){ LBY[l.id] = l; QBL[l.id] = []; });
    IDX = (c.index || []).map(function(r){ return { id: r[0], lec: r[1], likely: !!r[2], src: r[3] || "" }; });
    IDX.forEach(function(r){ (QBL[r.lec] = QBL[r.lec] || []).push(r); });
    EXAM = (c.exams || []).filter(function(x){ return x.id === C.exam; })[0] || (c.exams || [])[c.exams.length - 1] || null;
    LECS.forEach(function(l){ if (!C.exam || l.exam === C.exam) EXAM_LECS[l.id] = 1; });
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

  /* ---------- the one answer path: the live hub's recordAnswer, plus the daily goal and the rewards ---------- */
  var SESSION = { n: 0, r: 0, xp: 0, miss: {}, since: 0, recapAt: 0, hp0: null };
  function todayRec(){ var d = day(0), x = STATE.nx.days[d]; if (!x) x = STATE.nx.days[d] = { n: 0, r: 0, xp: 0 }; return x; }
  function goal(){ return STATE.nx.goal || 20; }
  function goalDays(){
    var on = {}; Object.keys(STATE.nx.days).forEach(function(k){ if (STATE.nx.days[k].met) on[k] = 1; });
    return on;
  }
  /* the streak counts the days you studied (answered at least one question), as on the live hubs (Sam, 2026-11-06): the
     goal ring is today's target, and missing it doesn't break the streak. STATE.days is the live hub's own list, so
     nobody's streak changes at the release. Not studied yet today: it counts back from yesterday. */
  function studyDays(){ var on = {}; (STATE.days || []).forEach(function(k){ on[k] = 1; }); return on; }
  function streakDays(){
    var on = studyDays(), n = 0, off = on[day(0)] ? 0 : -1;
    while (on[day(off)]) { n++; off--; }
    return n;
  }
  function achievements(quiet){
    (CORE.achievements || []).forEach(function(a){
      if (STATE.ach[a.id]) return;
      var c = a.cond, ok = false;
      if (c.type === "totalCorrect") ok = STATE.totalCorrect >= c.n;
      else if (c.type === "streak") ok = STATE.streak >= c.n;
      else if (c.type === "lecPct") { var st = STATE.lecStats[c.lec]; ok = !!(st && st.a >= c.min && (st.c / st.a) * 100 >= c.pct); }
      else if (c.type === "allSeen") ok = IDX.every(function(q){ return STATE.seen[q.id]; });
      if (ok) { STATE.ach[a.id] = day(0); if (!quiet) toast("Achievement: " + a.name); }
    });
  }
  /* XP as the server counts it (widget/ranks.js, "How XP works"): 10 the first time you get a question right, 2 for any
     other right answer, 1 for a miss, 20 for every day you study; answer XP is capped at 600 a day */
  function xpFor(qid, correct){
    var s = STATE.seen[qid], t = todayRec(), x = correct ? (s && s.c > 0 ? 2 : 10) : 1;
    return Math.max(0, Math.min(x, 600 - t.xp));
  }
  function recordAnswer(qid, lecId, correct, ctx, choice, picks){
    var xp = xpFor(qid, correct), t = todayRec(), first = !t.n;
    var s = STATE.seen[qid] || { n: 0, c: 0, last: null };
    s.n++; if (correct) s.c++; s.last = !!correct; STATE.seen[qid] = s;
    STATE.totalAnswered++;
    if (correct) { STATE.totalCorrect++; STATE.streak++; if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak; } else STATE.streak = 0;
    var lsx = STATE.lecStats[lecId] || { a: 0, c: 0 }; lsx.a++; if (correct) lsx.c++; STATE.lecStats[lecId] = lsx;
    var d = day(0); if (STATE.days.indexOf(d) === -1) STATE.days.push(d);
    t.n++; if (correct) t.r++; t.xp += xp;
    var met = false; if (!t.met && t.n >= goal()) { t.met = 1; met = true; }
    if (ctx !== "mock" && ctx !== "arcade") { SESSION.n++; if (correct) SESSION.r++; else SESSION.miss[lecId] = (SESSION.miss[lecId] || 0) + 1; SESSION.xp += xp; }
    achievements();
    saveNow();
    if (ctx === "drill" && window.shDrill && window.shDrill.mark) { try { window.shDrill.mark(qid, correct); } catch (e) {} }
    document.dispatchEvent(new CustomEvent(EVT, { detail: { qid: qid, lec: lecId, correct: !!correct, ctx: ctx || "bank", choice: (typeof choice === "number" ? choice : null), picks: (Array.isArray(picks) && picks.length ? picks.slice() : null) } }));
    RANK.local += xp + (first ? 20 : 0);
    return { xp: xp, met: met, dayBonus: first };
  }

  /* ---------- rank: the server's profile (the page bootstrap, then widget/ranks.js every 10 answers) plus what you
     earned since it came ---------- */
  var RANK = { p: null, local: 0, mastery: null };
  function rankName(){
    var R = window.shRanks, p = RANK.p, t = p ? p.tier || 0 : +(ls("sh_rank_tier") || 0);
    if (R && R.rankName) return R.rankName(t, p ? p.level || 1 : 0);
    var names = ["Stone", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Dark Matter"];
    return names[t] || "Stone";
  }
  function rankXp(){ return RANK.p ? (RANK.p.xp || 0) + RANK.local : null; }
  function rankArt(){
    var R = window.shRanks, t = RANK.p ? RANK.p.tier || 0 : +(ls("sh_rank_tier") || 0);
    return R && R.art ? R.art(t, 30) : "";
  }
  document.addEventListener("sh:rank-profile", function(e){
    var d = e.detail || {}; if (!d.profile) return;
    RANK.p = d.profile; RANK.local = 0; RANK.mastery = d.mastery || null; paintMeters();
    /* Timmy loads only once he's adopted (widget/v3.js): adopted on another device shows up here as a badge */
    var b = d.profile.badges || [];
    if (!window.shPet && window.shLoadPet && b.some(function(x){ return String(x).split(":")[0] === "pet-adopt"; }))
      window.shLoadPet(function(){ if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(b); });
  });

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
    paintMeters();
  }
  function paintMeters(){
    if (!shell) return;
    var n = streakDays(), t = todayRec(), g = goal();
    $$("[data-streakm]").forEach(function(m){ m.innerHTML = flame(n) + '<span class="num" aria-hidden="true">' + (n ? n + '<span class="fold"> ' + (n === 1 ? "day" : "days") + "</span>" : '<span class="fold">No streak</span><span class="unfold">0</span>') + '</span><span class="sr">' + (n ? pl(n, "day") + " in a row studied" : "No streak yet") + "</span>"; });
    $$("[data-goalm]").forEach(function(m){ m.innerHTML = ring(t.n, g) + '<span class="num" aria-hidden="true">' + Math.min(t.n, 999) + '<span class="fold"> of </span><span class="unfold">/</span>' + g + '</span><span class="sr">' + Math.min(t.n, 999) + " of " + g + ' questions today</span>'; });
    var x = rankXp(), rk = $("#hxRank");
    /* its spoken name is its visible text with a few hidden words around it (axe: the label must contain what's shown) */
    if (rk) rk.innerHTML = '<span class="hp" aria-hidden="true">' + rankArt() + '</span><span class="sr">Your rank: </span><b>' + esc(rankName()) + '</b><span class="sr">, </span><span class="xpn num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + "</span> XP" + (x === null ? " today" : "") + '</span><span class="sr">. Open your stats</span>';
    $$("[data-xpm]").forEach(function(m){ m.innerHTML = artSvg(A.xp || "", "0 0 24 24", "xpi") + '<span class="num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + '</span><span class="fold-xp"> XP</span></span>'; });
    $$("[data-today]").forEach(function(p){ p.outerHTML = todayPanel(); });
    paintLive();
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
    if (view === "questions" && v !== "questions") leaving = recapDue();
    if (view === "more" && sub === "arcade" && ARC && (v !== "more" || s !== "arcade")) { try { ARC.arcade.stopAll(); } catch (e) {} }
    view = v; sub = s;
    var setOn = v === "more" && s === "settings", gear = $(".hx-set");
    if (gear) { if (setOn) gear.setAttribute("aria-current", "page"); else gear.removeAttribute("aria-current"); }
    $$("#modeSwitch [data-mode]").forEach(function(a){ var on = a.getAttribute("data-mode") === v && !setOn; a.classList.toggle("is-active", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $$(".hx-view").forEach(function(p){ p.hidden = p.getAttribute("data-view") !== v; });
    docEl.classList.toggle("sh-mock-on", false);
    var el = $('.hx-view[data-view="' + v + '"]');
    STATE.ui.mode = v; saveState();
    try { ({ home: renderHome, notes: renderNotes, questions: renderQuestions, more: renderMore })[v](el, s); } catch (e) { el.innerHTML = '<div class="hx-page"><h1>Something went wrong</h1><p class="note">' + esc(e.message) + "</p></div>"; if (window.console) console.error(e); }
    if (leaving) { showLeftRecap(el, leaving); leaving = null; }
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
    if (view === "questions") { var p = presetOf(); return "compendium/" + (p === "mock" ? "mock" : p === "weak" ? "weak" : p === "drill" ? "drill" : p === "misses" ? "misses" : "bank"); }
    if (view === "more") {
      if (sub === "arcade") return "arcade/" + (ARC && ARC.arcade.current() || "lobby");
      if (sub === "side") return "review/side";
      if (sub === "hints" || sub === "cram") return "compendium/" + sub;
      return "more/" + (sub || "menu");
    }
    return view;
  }

  /* ======================= the question card ======================= */
  var RETRY_GAP = 5, uid = 0;
  function choiceOrder(q){ var idx = q.choices.map(function(c, i){ return i; }); return q.fmt === "2stmt" || q.fmt === "tf" || q.fmt === "numbered" ? idx : shuffled(idx); }
  function srcLabel(q){ return (CORE.srcLabel || {})[q.src] || q.src || ""; }
  function likelyTag(q){ return q.likely ? '<span class="likely" title="' + esc(q.likely.t ? "Predicted topic: " + q.likely.t : "") + '">' + icon("hints", 14) + "High likelihood</span>" : ""; }
  function stemHTML(q){
    var s = String(q.stem || "");
    if (q.fmt === "2stmt" || q.fmt === "numbered") {
      var lines = s.split("\n"), lead = [], stm = [];
      lines.forEach(function(L){ var m = /^\s*(\d+)\.\s+(.*)$/.exec(L); if (m) stm.push([m[1], m[2]]); else if (!stm.length) lead.push(L); else if (stm.length) stm[stm.length - 1][1] += " " + L; });
      return '<p class="qc-stem">' + esc(lead.join(" ").trim()) + '</p><ol class="qc-stmts">' + stm.map(function(x){ return "<li><b>" + x[0] + "</b><span>" + esc(x[1]) + "</span></li>"; }).join("") + "</ol>";
    }
    return '<p class="qc-stem">' + esc(s) + "</p>";
  }
  function pboxHTML(q){
    if (!q.pbox) return "";
    var set = q.pcase ? IDX.filter(function(r){ return QBY[r.id] && QBY[r.id].pcase === q.pcase; }) : [];
    var at = set.map(function(r){ return r.id; }).indexOf(q.id);
    return '<div class="pbox"><p class="pbox-head">' + icon("notes", 18) + "<span>Patient box</span>" + (set.length > 1 ? '<span class="note">Same patient · ' + (at + 1) + " of " + set.length + "</span>" : "") + "</p><dl>" +
      q.pbox.map(function(r){ return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" + (FIG && q.pimg ? '<div class="pbox-img">' + FIG.caseImgHTML(q) + "</div>" : "") +
      (q.pcase && CORE.pcases && window.shCases ? window.shCases.pboxFigures(q, CORE.pcases) : "") + "</div>";
  }
  function figHTML(q){ var f = FIG && q.img && !q.imgAfter && FIG.FIGS[q.img]; return f ? '<figure class="qfig" aria-label="' + esc(f.title) + '">' + f.svg + "</figure>" : ""; }
  function figKeyHTML(f, open){ return f.key ? '<details class="fig-key"' + (open ? " open" : "") + "><summary>" + (open ? "Key" : "Show the key") + "</summary><dl>" + f.key.map(function(k){ return "<dt>" + esc(k[0]) + "</dt><dd>" + esc(k[1]) + "</dd>"; }).join("") + "</dl></details>" : ""; }
  function figAfterHTML(q){ var f = FIG && q.img && FIG.FIGS[q.img]; return f && (q.imgAfter || f.key) ? '<figure class="qfig qfig-after" aria-label="' + esc(f.title) + '">' + f.svg + figKeyHTML(f, true) + "</figure>" : ""; }

  function card(q, o){
    o = o || {};
    var id = "q" + (++uid), multi = q.type === "multi", tf = q.fmt === "tf";
    var seen = STATE.seen[q.id];
    var status = o.retry ? '<span class="qc-flag">' + icon("retry", 14) + "Again: you missed this a few questions ago</span>" : o.note ? '<span class="qc-flag">' + esc(o.note) + "</span>" :
      seen ? '<span class="qc-last ' + (seen.last ? "ok" : "no") + '">Last time: ' + (seen.last ? "right" : "missed") + "</span>" : "";
    var el = h('<article class="qcard qc' + (o.retry ? " is-retry" : "") + '" data-qid="' + esc(q.id) + '" data-qtype="' + q.type + '" data-fmt="' + esc(q.fmt || q.type) + '" data-ctx="' + esc(o.ctx || "bank") + '" aria-labelledby="' + id + 'h"></article>');
    var head = '<header class="qc-head"><span class="qc-meta"><span class="qc-lec" id="' + id + 'h">' + (o.num ? "Question " + o.num + " · " : "") + esc(lecName(q.lec)) + "</span>" + likelyTag(q) + status + '</span><span class="qcard-top qc-tools"></span></header>';
    var body = "";
    if (q.type === "mcq" || multi) {
      var order = multi ? shuffled(q.choices.map(function(c, i){ return i; })) : choiceOrder(q);
      body = '<ul class="qc-choices' + (tf ? " qc-tf" : "") + '">' + order.map(function(i){
        return '<li><button class="ch' + (multi ? " has-box" : "") + '" type="button" data-i="' + i + '" aria-pressed="false">' + (multi ? mark("box") : "") + '<span class="txt">' + esc(q.choices[i]) + '</span><span class="pct num" aria-hidden="true"></span><span class="st-ic" aria-hidden="true"></span><span class="share" aria-hidden="true"></span></button></li>';
      }).join("") + "</ul>" +
      (multi ? '<div class="qc-go"><button class="btn btn-primary" type="button" data-check disabled>Check my answer</button><span class="note">Select every right answer, then check. Partial credit.</span></div>' : "");
    } else if (q.type === "sequence") {
      body = '<p class="note qc-hint">Tap the steps in order, first to last.</p><ul class="qc-choices qc-seq">' + shuffled(q.steps.map(function(s, i){ return i; })).map(function(i){
        return '<li><button class="ch" type="button" data-step="' + i + '">' + '<span class="ord num" aria-hidden="true"></span><span class="txt">' + esc(q.steps[i]) + "</span></button></li>"; }).join("") + "</ul>" +
        '<div class="qc-go" data-seqtools hidden><button class="btn btn-text" type="button" data-undo>' + icon("retry", 18) + 'Undo last step</button><button class="btn btn-text" type="button" data-clear>Start over</button></div>';
    } else if (q.type === "match") {
      var L = shuffled(q.pairs.map(function(p, i){ return i; })), R = shuffled(q.pairs.map(function(p, i){ return i; }));
      body = '<p class="note qc-hint">Tap an item on the left, then its partner on the right.</p><div class="qc-match"><ul>' + L.map(function(i){ return '<li><button class="ch" type="button" data-side="l" data-pair="' + i + '"><span class="txt">' + esc(q.pairs[i][0]) + "</span></button></li>"; }).join("") +
        "</ul><ul>" + R.map(function(i){ return '<li><button class="ch" type="button" data-side="r" data-pair="' + i + '"><span class="txt">' + esc(q.pairs[i][1]) + "</span></button></li>"; }).join("") + "</ul></div>";
    }
    el.innerHTML = head + figHTML(q) + pboxHTML(q) + stemHTML(q) + body + '<section class="qc-result qcard-explain" data-role="explain" hidden aria-live="polite"></section>';
    wireCard(el, q, o);
    return el;
  }
  function wireCard(el, q, o){
    var multi = q.type === "multi", picked = [], seqP = [], match = { sel: null, done: 0, err: 0 };
    el.addEventListener("click", function(e){
      var b = e.target.closest("button"); if (!b || !el.contains(b) || el.classList.contains("is-answered")) return;
      if (b.hasAttribute("data-i")) {
        var i = +b.getAttribute("data-i");
        if (multi) {
          var k = picked.indexOf(i); if (k > -1) picked.splice(k, 1); else picked.push(i);
          b.setAttribute("aria-pressed", k > -1 ? "false" : "true");
          $("[data-check]", el).disabled = !picked.length; return;
        }
        picked = [i]; b.setAttribute("aria-pressed", "true"); answer(b); return;
      }
      if (b.hasAttribute("data-check")) { if (picked.length) answer(b); return; }
      if (b.hasAttribute("data-step")) {
        var si = +b.getAttribute("data-step"); seqP.push(si); b.disabled = true; b.classList.add("is-on"); $(".ord", b).textContent = seqP.length;
        $("[data-seqtools]", el).hidden = false;
        if (seqP.length === q.steps.length) answer(b);
        return;
      }
      if (b.hasAttribute("data-undo") || b.hasAttribute("data-clear")) {
        var drop = b.hasAttribute("data-clear") ? seqP.splice(0) : seqP.splice(-1);
        drop.forEach(function(x){ var s = $('[data-step="' + x + '"]', el); s.disabled = false; s.classList.remove("is-on"); $(".ord", s).textContent = ""; });
        $("[data-seqtools]", el).hidden = !seqP.length; return;
      }
      if (b.hasAttribute("data-side")) {
        if (b.classList.contains("is-matched")) return;
        var p = +b.getAttribute("data-pair");
        if (b.getAttribute("data-side") === "l") { $$('[data-side="l"]', el).forEach(function(x){ x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); match.sel = p; return; }
        if (match.sel === null) return;
        var left = $('[data-side="l"][data-pair="' + match.sel + '"]', el);
        if (p === match.sel) { [b, left].forEach(function(x){ x.classList.add("is-matched"); x.disabled = true; x.setAttribute("aria-pressed", "false"); }); match.done++; match.sel = null; if (match.done === q.pairs.length) answer(b); }
        else { match.err++; b.classList.remove("is-shake"); void b.offsetWidth; b.classList.add("is-shake"); }
      }
    });
    function answer(from){
      el.classList.add("is-answered");
      var right = false, score = 0, partial = "", rec;
      if (q.type === "mcq") {
        right = picked[0] === q.answer;
        $$(".ch", el).forEach(function(b){ var i = +b.getAttribute("data-i"), st = i === q.answer ? "right" : i === picked[0] ? "wrong" : ""; paintChoice(b, st, i === picked[0], "ring"); });
        rec = recordAnswer(q.id, q.lec, right, o.ctx, picked[0]);
      } else if (multi) {
        var hits = picked.filter(function(i){ return q.correct.indexOf(i) > -1; }).length;
        score = Math.max(0, (hits - (picked.length - hits)) / q.correct.length); right = score === 1;
        $$(".ch", el).forEach(function(b){ var i = +b.getAttribute("data-i"), good = q.correct.indexOf(i) > -1, pk = picked.indexOf(i) > -1; paintChoice(b, good && pk ? "right" : pk ? "wrong" : good ? "missed" : "", pk, "box"); });
        if (!right && score > 0) partial = "Partly right: " + Math.round(score * 100) + "% credit";
        $(".qc-go", el).hidden = true;
        rec = recordAnswer(q.id, q.lec, right, o.ctx, null, picked);
      } else if (q.type === "sequence") {
        var inPlace = seqP.filter(function(v, i){ return v === i; }).length; right = inPlace === q.steps.length;
        $$("[data-step]", el).forEach(function(b){ var i = +b.getAttribute("data-step"); b.classList.remove("is-on"); b.classList.add(seqP.indexOf(i) === i ? "is-right" : "is-wrong"); });
        if (!right) partial = "Not quite: " + inPlace + " of " + q.steps.length + " in the right spot";
        $("[data-seqtools]", el).hidden = true;
        rec = recordAnswer(q.id, q.lec, right, o.ctx);
      } else {
        right = match.err === 0; if (!right) partial = "Matched, with " + pl(match.err, "wrong try", "wrong tries");
        rec = recordAnswer(q.id, q.lec, right, o.ctx);
      }
      result(el, q, right, partial, rec.xp, picked);
      if (o.onAnswer) o.onAnswer(el, q, right);
      reward(from, right, rec);
      classPicks(el, q, picked);
    }
  }
  function paintChoice(b, st, isPick, kind){
    if (st) b.classList.add(st === "right" ? "is-right" : st === "wrong" ? "is-wrong" : "is-missed");
    var bx = b.querySelector(".mark"); if (st && bx) bx.outerHTML = mark(kind, st);
    var si = b.querySelector(".st-ic"); if (si && st) si.innerHTML = icon(st === "wrong" ? "cross" : "check", 20);
    var said = st === "right" ? (isPick ? "right, your pick" : "right") : st === "wrong" ? "your pick, wrong" : st === "missed" ? "right, not picked" : "";
    if (said) b.querySelector(".txt").insertAdjacentHTML("beforeend", '<span class="sr">, ' + said + "</span>");
    b.setAttribute("aria-disabled", "true");
  }
  function whyHTML(q, picks, opened){
    if (!q.why || !q.choices) return "";
    var multi = q.type === "multi", ok = function(i){ return multi ? q.correct.indexOf(i) > -1 : i === q.answer; };
    var idx = q.choices.map(function(c, i){ return i; }).sort(function(a, b){ return (ok(b) ? 1 : 0) - (ok(a) ? 1 : 0) || a - b; });
    var open = {}; (opened || picks || []).forEach(function(i){ open[i] = 1; });
    idx.forEach(function(i){ if (multi && ok(i) && (picks || []).indexOf(i) < 0) open[i] = 1; });
    /* folded until tapped, as on the live hubs (Sam, 2026-11-06: open, it took up too much of the screen); inside, your pick is open */
    return '<details class="why"><summary class="why-bar"><span>Why each choice</span><span class="chev">' + icon("chevron", 16) + "</span></summary>" + idx.map(function(i){
      var pk = (picks || []).indexOf(i) > -1, st = ok(i) ? (pk || !multi ? "right" : "missed") : pk ? "wrong" : "";
      var tag = pk ? "Your pick" : multi && ok(i) ? "You missed this one" : "";
      return "<details" + (open[i] ? " open" : "") + '><summary><span class="tick ' + (st === "wrong" ? "no" : st ? "ok" : "") + '">' + (st ? icon(st === "wrong" ? "cross" : "check", 18) : "") + "</span><span>" + esc(q.choices[i]) +
        (tag ? ' <span class="tag">· ' + tag + "</span>" : "") + '</span><span class="chev">' + icon("chevron", 16) + "</span></summary><p>" + esc(q.why[i]) + "</p></details>";
    }).join("") + "</details>";
  }
  function result(el, q, right, partial, xp, picks){
    var res = $(".qc-result", el);
    var verdict = right ? '<p class="verdict ok">' + icon("check", 26) + 'Right<span class="xp num">+' + xp + " XP</span></p>"
      : partial ? '<p class="verdict part">' + icon("goal", 26) + esc(partial) + '<span class="xp num">+' + xp + " XP</span></p>"
      : '<p class="verdict no">' + icon("cross", 26) + 'Not quite<span class="xp num">+' + xp + " XP</span></p>";
    var order = q.type === "sequence" ? '<ol class="qc-order">' + q.steps.map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" : "";
    var pairs = q.type === "match" ? '<dl class="qc-pairs">' + q.pairs.map(function(p){ return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("") + "</dl>" : "";
    res.innerHTML = verdict + figAfterHTML(q) + order + pairs + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" +
      (q.cue && !right ? '<p class="qc-cue">' + icon("hints", 18) + "<span><b>Remember it:</b> " + esc(q.cue) + "</span></p>" : "") +
      whyHTML(q, q.type === "mcq" || q.type === "multi" ? picks : null) +
      '<p class="qc-class note" data-classnote hidden></p>' +
      '<div class="qc-after"><button class="btn" type="button" data-again>' + icon("retry", 18) + '<span class="l-long">Try it again</span><span class="l-short">Retry</span></button></div>';
    res.hidden = false;
    /* one row under the answer (Sam, 2026-11-06): Try it again, then the shared widget's "Find this in the notes" (on a
       miss; it replaced the "Notes for <lecture>" link) and "Good question?", moved in beside it as they arrive */
    var after = $(".qc-after", res);
    var gather = function(){ $$(":scope > .sh-nj, :scope > .sh-qrate", res).forEach(function(n){ after.appendChild(n); }); };
    gather();
    if (window.MutationObserver) { var mo = new MutationObserver(gather); mo.observe(res, { childList: true }); setTimeout(function(){ mo.disconnect(); }, 4000); }
    $("[data-again]", res).addEventListener("click", function(){ var n = card(q, { ctx: el.getAttribute("data-ctx") }); el.replaceWith(n); var f = $(".ch", n); if (f) f.focus(); track("bank:again"); });
    if (FIG && FIG.ANIMA) { try { FIG.ANIMA.mount(res); } catch (e) {} }
  }
  /* the class's picks beside each choice (question_choices through the widget's shGetClassStats; from 2 answers) */
  function classPicks(el, q, picks){
    if ((q.type !== "mcq" && q.type !== "multi") || !window.shGetClassStats) return;
    window.shGetClassStats([q.id], function(by){
      var r = by[q.id]; if (!r || !r.choices || !el.isConnected) return;
      var multi = q.type === "multi", counts = {}, sum = 0, max = 0;
      q.choices.forEach(function(c, i){ counts[i] = (+r.choices[i] || 0) + (picks.indexOf(i) > -1 ? 1 : 0); sum += counts[i]; max = Math.max(max, counts[i]); });
      var total = multi ? Math.max((+r.total || 0) + 1, max) : sum;
      if (total < 2) return;
      $$(".ch", el).forEach(function(b){
        var i = +b.getAttribute("data-i"), p = Math.round(100 * counts[i] / total);
        var pc = $(".pct", b); pc.innerHTML = p + '%<span class="sr"> of the class ' + (multi ? "ticked" : "picked") + " it</span>"; pc.removeAttribute("aria-hidden");
        var sh = $(".share", b); requestAnimationFrame(function(){ sh.style.width = p + "%"; });
      });
      el.classList.add("has-picks");
      var n = $("[data-classnote]", el); if (n) { n.textContent = "The % beside each choice is how often the class " + (multi ? "ticked" : "picked") + " it (" + pl(total, "answer") + ", yours included)."; n.hidden = false; }
    }, true);
  }

  /* ---------- the rewards on every answer: XP to the rank, Timmy on the bar, the goal ring, the flame, the recap ---------- */
  var reactT = 0;
  function reward(from, right, rec){
    var target = [$("#hxRank"), $("#hxXp")].filter(visible)[0] || null;
    flyXp(from, target, rec.xp, function(){
      $$("[data-xp]").forEach(function(n){ var to = rankXp(); countUp(n, to === null ? todayRec().xp : to, to === null); });
      if (target) { target.classList.remove("bump"); void target.offsetWidth; target.classList.add("bump"); }
    });
    var tim = $(".shpet-home .shpet-btn");
    if (tim && !reduced) { clearTimeout(reactT); tim.classList.remove("hx-cheer", "hx-flinch"); void tim.offsetWidth; tim.classList.add(right ? "hx-cheer" : "hx-flinch"); reactT = setTimeout(function(){ tim.classList.remove("hx-cheer", "hx-flinch"); }, 1500); }
    setTimeout(function(){
      paintMeters();
      if (rec.met) {
        var n = streakDays();
        $$("[data-streakm] .flame").forEach(function(f){ f.classList.add("grow-in"); });
        say("Goal met! " + goal() + " questions today.", "do-hop");
        toast("Today's goal is met: " + goal() + " questions." + (n > 1 ? " Your streak is " + pl(n, "day") + "." : ""));
      }
    }, reduced ? 0 : 650);
  }
  function say(t, move){ try { if (window.shPet && window.shPet.say) window.shPet.say(t, move, 5000); } catch (e) {} }
  function flyXp(from, to, xp, done){
    if (!from || !to || reduced || !xp) { done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = h('<span class="xpfly" aria-hidden="true">' + artSvg(A.xp || "", "0 0 24 24", "") + "+" + xp + "</span>");
    document.body.appendChild(n);
    var w = n.offsetWidth, hh = n.offsetHeight;
    var x0 = a.left + Math.max(8, Math.min(a.width - w - 12, 64)), y0 = a.top + a.height / 2 - hh / 2, x1 = b.left + b.width / 2 - w / 2, y1 = b.top + b.height / 2 - hh / 2;
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 80;
    var anim = n.animate([
      { transform: "translate(" + x0 + "px," + y0 + "px) scale(.6)", opacity: 0 },
      { transform: "translate(" + x0 + "px," + (y0 - 18) + "px) scale(1.1)", opacity: 1, offset: .18 },
      { transform: "translate(" + mx + "px," + my + "px) scale(1)", opacity: 1, offset: .6 },
      { transform: "translate(" + x1 + "px," + y1 + "px) scale(.5)", opacity: .2 }
    ], { duration: 950, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    anim.onfinish = function(){ n.remove(); done(); };
  }
  function countUp(n, to, plus){
    var from = +String(n.textContent).replace(/[^\d]/g, "") || 0;
    if (reduced || from === to) { n.textContent = (plus ? "+" : "") + fmt(to); return; }
    var t0 = performance.now();
    (function step(t){ var k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3); n.textContent = (plus ? "+" : "") + fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  function petHp(){ try { return window.shPet && window.shPet.hp ? window.shPet.hp() : null; } catch (e) { return null; } }
  /* Today's goal as a ring of 20 teeth, a child's full set (Sam, 2026-11-06: "a more visually interesting progress
     circle"). Each tooth is a twentieth of the goal (one question at the default 20) and fills in the hub's color as you
     answer; a tooth partly done is tinted. A thin arc inside shows the exact share. The tooth that just filled pops in. */
  var TOOTH = "M-5 -3C-5.5 -7-3.5-7.8-1.8-7C-.8-6.6.8-6.6 1.8-7C3.5-7.8 5.5-7 5-3C4.7-.5 4 1.5 3.2 5C2.8 7 1.4 7.4 1 5.4L.4 2.6C.2 2-.2 2-.4 2.6L-1 5.4C-1.4 7.4-2.8 7-3.2 5C-4 1.5-4.7-.5-5-3Z";
  var teethShown = -1;
  function teethRing(done, of){
    var N = 20, f = of ? Math.min(1, done / of) * N : 0, on = Math.floor(f), r = 33, c = 2 * Math.PI * r, out = "";
    for (var k = 0; k < N; k++){
      var s = k < on ? "is-on" : k < f ? "is-part" : "";
      if (k < on && teethShown >= 0 && k >= teethShown) s += " is-new";
      out += '<g transform="rotate(' + (k * 360 / N) + ' 60 60) translate(60 13)"><g class="tooth' + (s ? " " + s : "") + '"><path d="' + TOOTH + '"/>' + (k < on ? '<path class="shine" d="M-3.1-4.4C-2.7-5.6-1.7-5.9-.9-5.6"/>' : "") + "</g></g>";
    }
    teethShown = on;
    return '<svg class="teeth' + (of && done >= of ? " is-met" : "") + '" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<circle class="t-track" cx="60" cy="60" r="' + r + '"/><circle class="t-arc" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - (of ? Math.min(1, done / of) : 0))).toFixed(2) + '"/>' +
      out + "</svg>";
  }
  function todayPanel(){
    var t = todayRec(), g = goal(), n = streakDays(), left = Math.max(0, g - t.n), hp = petHp(), T = AH.tint || { ink: "#6B5A68", light: "#ECE6EA" };
    var cap = t.n >= g ? "Goal met for today." : left === g ? "Your goal today: " + g + " questions. One answer keeps your streak going." : pl(left, "more question") + " meets today's goal.";
    return '<div class="panel today" data-today><div class="today-head"><div><h2>Today</h2><p class="today-date">' + esc(dateLabel(day(0), { weekday: "long", month: "long", day: "numeric" })) + "</p></div>" +
        spot("today", { tint: T.ink, light: T.light, line: T.ink }, "today-art") + "</div>" +
      '<div class="big-ring"><div class="teeth-wrap">' + teethRing(t.n, g) + '<p class="ring-num"><b class="num">' + fmt(t.n) + '</b><span>of ' + g + '</span><span class="sr"> questions today</span></p></div><p class="ring-cap">' + esc(cap) + "</p></div>" +
      '<ul class="today-stats">' +
        '<li class="ts-flame">' + flame(n, "ts-art") + '<span><b class="num">' + (n ? pl(n, "day") : "Not yet") + "</b><small>Streak</small></span></li>" +
        '<li class="ts-xp">' + artSvg(A.xp, "0 0 24 24", "ts-art", "") + '<span><b class="num">+' + fmt(t.xp) + "</b><small>XP today</small></span></li>" +
        '<li class="ts-right">' + icon("check", 26) + '<span><b class="num">' + fmt(t.r || 0) + " of " + fmt(t.n) + "</b><small>Right today</small></span></li>" +
      "</ul>" +
      (hp !== null ? '<p class="today-pet">' + icon("tooth", 18) + "<span>Timmy has <b class=\"num\">" + hp + " HP</b></span></p>" : "") + "</div>";
  }
  /* the session recap: when you leave the questions with 5 or more answered since the last one (Sam, 2026-11-06: never
     mid-practice) */
  function recapDue(){ var n = SESSION.n - SESSION.since; return n >= 5 ? { n: n, r: SESSION.r - (SESSION.rAt || 0), xp: SESSION.xp - (SESSION.xpAt || 0), miss: Object.assign({}, SESSION.miss) } : null; }
  function markRecap(){ SESSION.since = SESSION.n; SESSION.rAt = SESSION.r; SESSION.xpAt = SESSION.xp; SESSION.miss = {}; }
  function recapHTML(d){
    var hp = petHp(), hpd = hp !== null && SESSION.hp0 !== null ? hp - SESSION.hp0 : null, n = streakDays();
    var next = Object.keys(d.miss).sort(function(a, b){ return d.miss[b] - d.miss[a]; }).slice(0, 2);
    return '<section class="recap enter" aria-label="Session recap"><h2>That was ' + pl(d.n, "question") + "</h2><div class=\"figs\">" +
      '<div><b class="num" data-count="' + d.r + '">' + d.r + "</b><span>right of " + d.n + '</span></div><div><b class="num" data-count="' + d.xp + '" data-plus>+' + d.xp + "</b><span>XP this session</span></div>" +
      (hpd !== null ? '<div><b class="num">' + (hpd >= 0 ? "+" : "") + hpd + "</b><span>Timmy's HP, now " + hp + "</span></div>" : "") +
      '<div><b class="num">' + (n ? pl(n, "day") : "Day one") + "</b><span>streak</span></div></div>" +
      (next.length ? '<div class="next"><h3>Look at these next</h3><ul>' + next.map(function(id){ return '<li><a href="#notes/' + esc(id) + '">' + esc(lecName(id)) + '</a> <span class="num">' + pl(d.miss[id], "miss", "misses") + "</span></li>"; }).join("") + "</ul></div>" : "") +
      '<div class="qc-go"><button class="btn btn-primary" type="button" data-recap="go">Keep going</button>' + (next.length ? '<button class="btn" type="button" data-recap="miss" data-lecs="' + esc(next.join(",")) + '">Practice the misses</button>' : "") + "</div></section>";
  }
  function wireRecap(node){
    $$("[data-count]", node).forEach(function(n){ var to = +n.getAttribute("data-count"), plus = n.hasAttribute("data-plus"); if (reduced) return; var t0 = performance.now();
      (function step(t){ var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); n.textContent = (plus ? "+" : "") + Math.round(to * e); if (k < 1) requestAnimationFrame(step); })(t0); });
    node.addEventListener("click", function(e){
      var b = e.target.closest("[data-recap]"); if (!b) return;
      if (b.getAttribute("data-recap") === "miss") { STATE.ui.qset = ""; STATE.ui.qlec = b.getAttribute("data-lecs").split(","); STATE.ui.qstatus = "missed"; STATE.ui.qlikely = ""; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; saveState(); track("recap:misses"); go("questions"); }
      else { node.remove(); track("recap:keep"); }
    });
  }
  function showLeftRecap(el, d){
    markRecap();
    var n = h(recapHTML(d)); n.classList.add("recap-top");
    var at = $(".hx-page", el) || el; at.insertBefore(n, at.firstChild); wireRecap(n);
    track("recap:left");
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
  function lecProgress(l){
    var tried = 0, right = 0, missed = 0, qs = QBL[l.id] || [];
    qs.forEach(function(q){ var s = STATE.seen[q.id]; if (s) { tried++; if (s.last) right++; else missed++; } });
    var st = STATE.lecStats[l.id] || { a: 0, c: 0 };
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
    var left = IDX.filter(function(q){ return !STATE.seen[q.id] && isExamLec(q.lec); }).length;
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
          q("#questions/mock", "mock", "Mock exam", pl(mockTotal(), "question") + ", timed") +
          q("#more/hints", "hints", "Exam hints", "What " + (X.prof || "the professor") + " said to know") +
          q("#more/cram", "cram", "Cram sheet", "Every lecture on one page") +
          (pod ? podMiniHTML(pod) : "") +
        "</nav>" +
      "</div>" +
      (X.notice ? '<p class="notice">' + icon("notes", 20) + "<span><b>" + esc(X.notice[0]) + "</b> " + esc(X.notice[1]) + "</span></p>" : "") +
      '<div class="home-grid">' +
        '<section class="panel next" aria-labelledby="hnH"><h2 id="hnH">Where to next</h2>' + nextHTML(rows, mis, examWeek) + "</section>" +
        todayPanel() +
        '<section class="panel lecs" aria-labelledby="hlH"><h2 id="hlH">Your progress by lecture</h2><p class="note">How much of each lecture\'s bank you\'ve tried; the solid part is right on your latest try. ' + right + " of " + total + " for the exam right so far.</p>" + lecsHTML(fin.concat(rows.filter(function(r){ return !isExamLec(r.l.id); }))) + "</section>" +
        '<div class="home-side">' +
          '<section class="panel" aria-labelledby="htH"><h2 id="htH">Course timeline</h2>' + timelineHTML() + "</section>" +
        "</div>" +
      "</div></div>";
    el.innerHTML = html;
    /* Home's way into the bank starts fresh: the exam's lectures, not answered yet, High likelihood off (the rule) */
    $$("[data-home-practice]", el).forEach(function(a){ a.addEventListener("click", function(){ var ex = LECS.filter(function(l){ return isExamLec(l.id); }).map(function(l){ return l.id; }); bankReset(); STATE.ui.qlec = ex.length && ex.length < LECS.length ? ex : "all"; STATE.ui.qstatus = "unseen"; bankSearch = ""; saveState(); }); });
    paintLive();
    homeTimer = setInterval(function(){ var c = $("#hxCount"); if (!c || !c.isConnected || view !== "home") { clearInterval(homeTimer); return; } c.innerHTML = countHTML(); }, 30000);
    tip(el, "home", "Your daily goal is the ring in the bar: " + goal() + " questions a day. The flame counts the days in a row you study. Change the goal in More, Settings.");
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
      return head + '<li><div class="lr-main"><p><b>' + esc(lecLabel(r.l)) + "</b> " + esc(shortTitle(r.l)) + '</p><span class="bar" role="img" aria-label="' + r.tried + " of " + r.total + " tried, " + r.right + ' right"><i class="tried" style="width:' + tw + '%"></i><i class="right" style="width:' + rw + '%"></i></span>' +
        '<p class="note num">' + r.tried + " of " + r.total + " tried" + (r.pct !== null ? " · " + r.pct + "% of answers right" : "") + "</p></div>" +
        '<span class="lr-acts"><a class="btn btn-text" href="#notes/' + esc(r.l.id) + '" aria-label="Notes for ' + esc(lecLabel(r.l)) + '">Notes</a><a class="btn btn-text" href="#questions" data-lecq="' + esc(r.l.id) + '" aria-label="Questions for ' + esc(lecLabel(r.l)) + '">Questions</a></span></li>';
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
  function drawNotes(el, lec){
    if (view !== "notes") return;
    var X = C.notes || {}, hasPlain = !!(NOTES.plain || {})[lec.id], level = hasPlain && STATE.ui.level === "plain" ? "plain" : "full";
    var text = (level === "plain" ? NOTES.plain : NOTES.full)[lec.id], nq = (QBL[lec.id] || []).length, last = null;
    /* the lecture list: the exam's lectures first, under the exam's date; each with its number, how much of its bank
       you've tried (the bar: tried, and right on your latest try) and your accuracy */
    var groups = [["on", LECS.filter(function(l){ return isExamLec(l.id); })], ["off", LECS.filter(function(l){ return !isExamLec(l.id); })]].filter(function(g){ return g[1].length; });
    var list = '<nav class="lec-list" aria-label="Lectures"><button class="lec-pick btn" type="button" aria-expanded="false" data-lecpick>' + lecBadge(lec) +
      '<span class="lp-t"><b>' + esc(shortTitle(lec)) + "</b><small>" + esc(lecLabel(lec)) + " · change lecture</small></span>" + icon("chevron", 18, "rot") + "</button><ul>" +
      groups.map(function(g){
        var on = g[0] === "on";
        return '<li class="grp grp-' + g[0] + '"><b>' + esc(on ? (X.onExam || "On the exam") : (X.offExam || "Earlier lectures")) + "</b><span>" +
          esc(on ? (EXAM ? (EXAM.label || "The exam") + ", " + dateLabel(EXAM.date, { weekday: "long", month: "long", day: "numeric" }) : "") : (X.offNote || "For review")) + "</span></li>" + g[1].map(function(l){ return lecItemHTML(l, l.id === lec.id); }).join("");
      }).join("") + "</ul></nav>";
    var sub = String(lec.title).split(":").slice(1).join(":").trim();
    var group = (STUDY.review || []).filter(function(g){ return g.lec === lec.id; })[0];
    var art = '<article class="reading" id="lec-' + esc(lec.id) + '">' +
      "<h1>" + esc(lecLabel(lec) + " · " + shortTitle(lec)) + "</h1>" + (sub ? '<p class="sub">' + esc(sub) + "</p>" : "") +
      '<p class="note">' + esc(lec.who) + " · " + (lec.status === "taught" ? "recording and slides" : "slides only") + " · " + pl(nq, "question") + "</p>" +
      '<div class="toolbar" role="toolbar" aria-label="Notes tools">' +
        (text ? '<button type="button" class="btn sh-tts-btn" id="sh-tts-btn" data-sh-tts-audio="1" aria-label="Listen to these notes">' + icon("listen", 18) + '<span class="sh-tts-label-play">Listen</span><span class="sh-tts-label-pause">Pause</span></button>' : "") +
        (hasPlain ? '<span class="seg" role="group" aria-label="Reading level"><button type="button" data-level="full" aria-pressed="' + (level === "full") + '">As taught</button><button type="button" data-level="plain" aria-pressed="' + (level === "plain") + '">Plain English</button></span>' : "") +
        '<button type="button" class="btn" data-mmap aria-expanded="false">' + icon("mindmap", 18) + "Mind map</button>" +
        '<button type="button" class="btn btn-text" data-report-notes>' + icon("report", 18) + "Report a mistake</button>" +
        '<span class="note tool-tip">' + icon("highlight", 18) + "Select text to highlight it</span>" +
      "</div>" +
      '<div class="mmap" hidden></div>' +
      '<div class="reading-prose">' + (text || "<p>Notes coming soon.</p>") + "</div>" +
      '<section class="lec-figs" hidden aria-labelledby="lfH"><h2 id="lfH">Diagrams</h2><div class="fig-grid"></div></section>' +
      (group ? '<section class="charts" aria-labelledby="lcH"><h2 id="lcH">Charts for this lecture</h2><p class="note">' + esc(group.blurb || "") + "</p>" + group.sections.map(function(sec, i){ return (sec.part ? '<h3 class="part">' + esc(sec.part) + "</h3>" : "") + sectionHTML(sec); }).join("") + "</section>" : "") +
      '<section class="check" aria-labelledby="ckH"><h2 id="ckH">Check yourself</h2><p class="note">Three questions from this lecture. Answers count like anywhere else.</p><div class="qlist" data-check></div></section>' +
      '<nav class="foot-acts" aria-label="Next"><a class="btn btn-primary" href="#questions" data-lecq="' + esc(lec.id) + '">' + icon("questions", 18) + "Practice " + esc(lecLabel(lec)) + " questions</a>" +
        '<a class="btn" href="#more/cram" data-cram="' + esc(lec.id) + '">' + icon("cram", 18) + "Cram bullets</a></nav>" +
      footNavHTML(lec) +
      '<p class="foot-report"><button class="btn btn-text" type="button" data-report-notes>' + icon("report", 18) + "Report a mistake in these notes</button></p>" +
      "</article>";
    el.innerHTML = '<div class="hx-page notes"><div class="notes-grid">' + list + art + "</div></div>";
    /* figures: in the notes next to the paragraph they explain, the rest under them (the live hub's FIG_PLACE) */
    var prose = $(".reading-prose", el), needF = (CORE.figByLec || {})[lec.id] && CORE.figByLec[lec.id].length;
    if (needF || group) needFigures().then(function(){ if (!prose.isConnected) return; placeFigs(prose, lec.id, level, $(".lec-figs", el)); $$(".charts [data-figs]", el).forEach(function(b){ b.innerHTML = b.getAttribute("data-figs").split(",").map(figCardHTML).join(""); }); try { FIG.wireCuspMaps(el); FIG.ANIMA.mount(el); } catch (e) {} }).catch(function(){});
    checkYourself($("[data-check]", el), lec);
    $$("[data-level]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.level = b.getAttribute("data-level"); saveState(); track("notes:level=" + STATE.ui.level); drawNotes(el, lec); }); });
    var pick = $("[data-lecpick]", el); pick.addEventListener("click", function(){ var on = pick.getAttribute("aria-expanded") !== "true"; pick.setAttribute("aria-expanded", String(on)); });
    var mm = $("[data-mmap]", el); mm.addEventListener("click", function(){
      var c = $(".mmap", el), open = mm.getAttribute("aria-expanded") === "true";
      if (!open && !c.dataset.done && window.shMindMap) { window.shMindMap.render(c, mindMapFor(lec), { accent: "var(--hub)" }); c.dataset.done = "1"; }
      c.hidden = open; mm.setAttribute("aria-expanded", String(!open)); track("notes:mindmap");
    });
    var tts = $("#sh-tts-btn", el);
    if (tts) tts.addEventListener("click", function(){ if (window.shTTS) window.shTTS.speak(prose, tts, ASSETS + "audio/" + lec.id + "-" + level + ".mp3"); });
    /* a mistake in the notes goes to Sam's Inbox with the lecture attached (the shared widget's report form) */
    $$("[data-report-notes]", el).forEach(function(b){ b.addEventListener("click", function(){
      track("notes:report"); if (window.shOpenFlag) window.shOpenFlag({ lec: lec.id, label: lecLabel(lec) + " " + shortTitle(lec) }); else toast("The report form is still loading. Try again in a moment.");
    }); });
    $$("[data-lecnav]", el).forEach(function(a){ a.addEventListener("click", function(){ track("notes:" + a.getAttribute("data-lecnav")); }); });
    wireLecLinks(el);
    /* the first visit's tip sits under the toolbar; while it shows, the toolbar's short "Select text to highlight it" hides (hub.css) */
    tip(el, "notes", "Select any words in the notes to highlight them; they stay on this device.", $(".reading > .toolbar", el));
  }
  /* the previous and next lecture, at the end of every lecture's notes (Sam, 2026-11-06), in the order they were taught */
  function footNavHTML(lec){
    var i = LECS.indexOf(lec), prev = LECS[i - 1], next = LECS[i + 1];
    var link = function(l, k){ return '<a class="btn fn-' + k + '" href="#notes/' + esc(l.id) + '" data-lecnav="' + k + '">' + (k === "prev" ? icon("chevron", 20, "flip") : "") +
      "<span><small>" + (k === "prev" ? "Previous lecture" : "Next lecture") + "</small><b>" + esc(lecLabel(l) + " · " + shortTitle(l)) + "</b></span>" + (k === "next" ? icon("chevron", 20) : "") + "</a>"; };
    if (!prev && !next) return "";
    return '<nav class="foot-nav" aria-label="Other lectures">' + (prev ? link(prev, "prev") : "") + (next ? link(next, "next") : "") + "</nav>";
  }
  function lecBadge(l){ return '<span class="lb num' + (isExamLec(l.id) ? " is-on" : "") + '" aria-hidden="true">' + esc(lecLabel(l)) + "</span>"; }
  function lecItemHTML(l, cur){
    var r = lecProgress(l), tw = r.total ? Math.round(r.tried / r.total * 100) : 0, rw = r.total ? Math.round(r.right / r.total * 100) : 0;
    var sub = !r.tried ? "Not started · " + pl(r.total, "question") : r.tried + " of " + r.total + " tried" + (r.pct !== null && r.a >= 3 ? " · " + r.pct + "% right" : "");
    return '<li><a class="lec-item" href="#notes/' + esc(l.id) + '"' + (cur ? ' aria-current="page"' : "") + ">" + lecBadge(l) +
      '<span class="lt"><b>' + esc(shortTitle(l)) + '</b><small class="num">' + esc(sub) + "</small>" +
      '<span class="bar" aria-hidden="true"><i class="tried" style="width:' + tw + '%"></i><i class="right" style="width:' + rw + '%"></i></span></span>' +
      '<span class="sr">' + esc(lecLabel(l)) + (cur ? ", open now" : "") + "</span></a></li>";
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
    var f = FIG.FIGS[key]; return f ? '<figure class="fig-card"><h4>' + esc(f.title) + "</h4>" + f.svg + "<p>" + esc(f.caption) + "</p>" + figKeyHTML(f) + "</figure>" : "";
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
    else if (sec.type === "list") inner = '<ul class="rv-list">' + sec.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    else if (sec.type === "figs") inner = '<div class="figs-slot" data-figs="' + esc(sec.figs.join(",")) + '"></div>';
    else if (sec.type === "flows") inner = '<div class="flows">' + (STUDY.sequences || []).filter(function(s){ return !sec.lec || s.lec === sec.lec; }).map(function(s){ return '<div class="flow"><h4>' + esc(s.title) + "</h4><ol>" + s.steps.map(function(st){ return "<li>" + esc(st) + "</li>"; }).join("") + "</ol></div>"; }).join("") + "</div>";
    return '<section class="rv-section">' + (sec.title ? "<h3>" + esc(sec.title) + "</h3>" : "") + inner + "</section>";
  }
  function checkYourself(host, lec){
    /* three per lecture: the likely ones first, then ones you haven't tried or missed */
    var pool = (QBL[lec.id] || []).map(function(r){ return QBY[r.id]; }).filter(function(q){ return q && (q.type === "mcq" || q.type === "multi"); });
    var score = function(q){ var s = STATE.seen[q.id]; return (q.likely ? 0 : 2) + (s ? (s.last ? 3 : 1) : 0) + Math.random(); };
    var pick = pool.map(function(q){ return [score(q), q]; }).sort(function(a, b){ return a[0] - b[0]; }).slice(0, 3).map(function(x){ return x[1]; });
    var need = pick.some(needsFig);
    (need ? needFigures() : Promise.resolve()).then(function(){ if (!host.isConnected) return; pick.forEach(function(q){ host.appendChild(card(q, { ctx: "check" })); }); });
  }
  function wireLecLinks(el){
    $$("[data-lecq]", el).forEach(function(a){ a.addEventListener("click", function(){ STATE.ui.qset = ""; STATE.ui.qlec = a.getAttribute("data-lecq"); STATE.ui.qstatus = "all"; STATE.ui.qlikely = ""; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; saveState(); track("notes:practice"); }); });
    $$("[data-cram]", el).forEach(function(a){ a.addEventListener("click", function(){ setTimeout(function(){ var c = document.getElementById("cram-" + a.getAttribute("data-cram")); if (c) c.scrollIntoView({ block: "start" }); }, 80); }); });
  }

  /* ======================= Questions: the bank, its panel, its presets ======================= */
  var SHOW = [["all", "All"], ["unseen", "Not answered yet"], ["missed", "Missed last time"], ["pinned", "Pinned"]];
  /* Only: the High likelihood toggle, on top of any Show chip (Sam, 2026-11-06). A hub may add its own (SH_HUB.bank.only,
     [[key, label]], the key a question property), one on at a time. A Show "likely" saved before then becomes the toggle. */
  var LIKELY = [["likely", "High likelihood"]].concat((C.bank && C.bank.only) || []);
  function isLk(k){ return LIKELY.some(function(x){ return x[0] === k; }); }
  function normShow(){
    if (isLk(STATE.ui.qstatus)) { STATE.ui.qlikely = STATE.ui.qstatus; STATE.ui.qstatus = "all"; }
    if (STATE.ui.qlikely && !isLk(STATE.ui.qlikely)) STATE.ui.qlikely = "";
  }
  function bankReset(){ STATE.ui.qset = ""; STATE.ui.qlec = "all"; STATE.ui.qstatus = "all"; STATE.ui.qlikely = ""; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; }
  var SETS = [["drill", "Daily drill"], ["misses", "Yesterday's misses"], ["weak", "Weak spots"], ["mock", "Mock exam"]];
  var FMTS = [["2stmt", "Two statements"], ["tf", "True or false"], ["numbered", "Numbered statements"], ["except", "EXCEPT / NOT"], ["pbox", "Patient Box cases"], ["img", "Diagram questions"], ["multi", "Select all that apply"], ["match", "Matching"], ["sequence", "Put in order"]];
  var PAGE = 20, bankSearch = "";
  function isFmt(q, fm){ return fm === "pbox" ? !!q.pbox : fm === "img" ? !!q.img : (fm === "multi" || fm === "match" || fm === "sequence") ? q.type === fm : q.fmt === fm; }
  function labelOf(list, k){ for (var i = 0; i < list.length; i++) if (list[i][0] === k) return list[i][1]; return k; }
  function presetOf(){ var s = parse()[1]; return SETS.some(function(x){ return x[0] === s; }) ? s : s === "missed" ? "" : ""; }
  function pins(){ try { return window.shPins ? window.shPins.list() : JSON.parse(ls("sh_pins_" + HUB) || "[]"); } catch (e) { return []; } }
  function lecIds(){
    var v = STATE.ui.qlec;
    if (v === "final" || v === "midterm") return LECS.filter(function(l){ return l.exam === v; }).map(function(l){ return l.id; });
    if (Array.isArray(v)) return v.filter(function(id){ return LBY[id]; });
    if (v && v !== "all" && LBY[v]) return [v];
    return LECS.map(function(l){ return l.id; });
  }
  function filtered(o){
    o = o || {};
    var s = (o.search != null ? o.search : bankSearch).toLowerCase().trim(), on = {}, pin = {};
    normShow();
    var st = o.st || STATE.ui.qstatus || "all", lk = "lk" in o ? o.lk : STATE.ui.qlikely || "", fm = o.fm || STATE.ui.qfmt || "all", src = o.src || STATE.ui.qsrc || "all";
    lecIds().forEach(function(id){ on[id] = 1; });
    if (st === "pinned") pins().forEach(function(id){ pin[id] = 1; });
    return QS.filter(function(q){
      if (!on[q.lec]) return false;
      if (st === "pinned" && !pin[q.id]) return false;
      if (lk && !q[lk]) return false;
      if (src !== "all" && q.src !== src) return false;
      if (fm !== "all" && !isFmt(q, fm)) return false;
      var seen = STATE.seen[q.id];
      if (st === "unseen" && seen) return false;
      if (st === "missed" && !(seen && seen.last === false)) return false;
      if (s) { var hay = (q.stem + " " + (q.choices || q.steps || []).join(" ") + " " + (q.pairs ? q.pairs.map(function(p){ return p.join(" "); }).join(" ") : "") + " " + q.ex + " " + (q.pbox ? q.pbox.map(function(r){ return r.join(" "); }).join(" ") : "")).toLowerCase(); if (hay.indexOf(s) === -1) return false; }
      return true;
    });
  }
  function ordered(list){
    if (STATE.ui.qorder === "random") return seeded(list, STATE.ui.qseed || 1);
    var pos = {}; LECS.forEach(function(l, i){ pos[l.id] = i; });
    return list.slice().sort(function(a, b){ return pos[a.lec] - pos[b.lec]; });
  }
  function renderQuestions(el, s){
    if (s === "missed") { STATE.ui.qset = ""; STATE.ui.qstatus = "missed"; STATE.ui.qlikely = ""; STATE.ui.qlec = "all"; saveState(); history.replaceState(null, "", "#questions"); s = ""; }
    if (SESSION.hp0 === null) SESSION.hp0 = petHp();
    el.innerHTML = '<div class="hx-page bank"><p class="note loading">Loading the questions…</p></div>';
    needQuestions().then(function(){ if (view === "questions") drawQuestions(el, s); }).catch(function(){ el.innerHTML = offlineHTML("the questions"); });
  }
  var LIST = null;
  function drawQuestions(el, preset){
    var title = preset ? labelOf(SETS, preset) : "Questions";
    el.innerHTML = '<div class="hx-page bank"><div class="bank-head"><h1>' + esc(title) + "</h1></div>" +
      '<div class="bank-grid"><div class="bank-main">' + panelHTML(preset) + '<div class="qsum" aria-live="polite"></div><div class="qlist" id="qlist"></div></div>' +
      '<aside class="bank-side" aria-label="Today">' + todayPanel() + "</aside></div></div>";
    wirePanel(el, preset);
    if (preset === "mock") { drawMock($("#qlist", el), el); return; }
    fill(el, preset);
    tip(el, "bank", "Your filters and the set you pick are remembered next time; the tags under the panel show what's on.");
  }
  function panelHTML(preset){
    var picked = lecIds(), all = LECS.length, sum = picked.length === all ? "All lectures" : picked.length === 1 ? lecName(picked[0]) : picked.map(function(id){ return lecLabel(LBY[id]); }).join(", ");
    normShow();
    var lkChip = function(k, lab){ var on = !preset && STATE.ui.qlikely === k; return '<button class="chip chip-tog" type="button" data-lk="' + k + '" aria-pressed="' + on + '"><span class="box" aria-hidden="true">' + icon("check", 14) + "</span>" + esc(lab) + ' <span class="n num">' + filtered({ lk: k }).length + "</span></button>"; };
    var showChip = function(k, lab){ var n = filtered({ st: k }).length; return '<button class="chip" type="button" data-show="' + k + '" aria-pressed="' + (!preset && (STATE.ui.qstatus || "all") === k) + '">' + esc(lab) + ' <span class="n num">' + n + "</span></button>"; };
    var setCount = { drill: "", misses: srsMisses().length, weak: weakList().length, mock: mockTotal() };
    var setChip = function(k, lab){ return '<a class="chip" href="#questions/' + k + '" data-set="' + k + '"' + (preset === k ? ' aria-current="page"' : "") + ">" + icon(k === "misses" ? "misses" : k, 16) + esc(lab) + (setCount[k] !== "" ? ' <span class="n num">' + setCount[k] + "</span>" : "") + "</a>"; };
    var fmts = FMTS.filter(function(f){ return QS.some(function(q){ return isFmt(q, f[0]); }); });
    var srcs = Object.keys(CORE.srcLabel || {}).filter(function(k){ return QS.some(function(q){ return q.src === k; }); });
    var more = (STATE.ui.qfmt && STATE.ui.qfmt !== "all" ? 1 : 0) + (STATE.ui.qsrc && STATE.ui.qsrc !== "all" ? 1 : 0);
    return '<div class="qbar panel' + (preset ? " is-set" : "") + '" role="search" aria-label="Filter the questions">' +
      '<div class="qbar-row">' +
        '<div class="lp"><span class="lab" id="lpL">Lectures</span><button class="btn lp-btn" type="button" aria-expanded="false" aria-labelledby="lpL lpS" data-lp><span id="lpS">' + esc(sum) + "</span>" + icon("chevron", 16, "rot") + "</button>" +
          '<div class="lp-pop" hidden><div class="lp-acts"><button class="btn btn-text" type="button" data-lpall>All lectures</button><button class="btn btn-text" type="button" data-lpnone>Untick all</button></div><ul>' +
          LECS.map(function(l){ var on = picked.indexOf(l.id) > -1; return '<li><label><input type="checkbox" value="' + esc(l.id) + '"' + (on ? " checked" : "") + "><span>" + esc(lecName(l.id)) + '</span></label><button class="btn btn-text" type="button" data-only="' + esc(l.id) + '" aria-label="Only ' + esc(lecLabel(l)) + '">Only</button></li>'; }).join("") +
          "</ul></div></div>" +
        '<label class="search"><span class="sr">Search the questions</span>' + icon("search", 18) + '<input type="search" placeholder="Search the questions" value="' + esc(bankSearch) + '" data-search></label>' +
      "</div>" +
      '<div class="qbar-row chips"><span class="lab">Show</span><span class="chipset">' + SHOW.map(function(x){ return showChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row chips only"><span class="lab">Only</span><span class="chipset" role="group" aria-label="Only">' + LIKELY.map(function(x){ return lkChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row chips"><span class="lab">Sets</span><span class="chipset">' + SETS.map(function(x){ return setChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row"><span class="lab">Order</span><span class="seg" role="group" aria-label="Order"><button type="button" data-order="in" aria-pressed="' + (STATE.ui.qorder !== "random") + '">In order</button><button type="button" data-order="random" aria-pressed="' + (STATE.ui.qorder === "random") + '">' + icon("shuffle", 16) + "Random</button></span>" +
        '<details class="morefil"' + (STATE.ui.qmore ? " open" : "") + '><summary class="btn btn-text">' + icon("filter", 16) + "More filters" + (more ? ' <span class="badge num">' + more + " on</span>" : "") + "</summary>" +
        '<div class="morefil-body"><p class="lab">Question type</p><span class="chipset">' + [["all", "Any type"]].concat(fmts).map(function(f){ var n = f[0] === "all" ? "" : ' <span class="n num">' + filtered({ fm: f[0] }).length + "</span>"; return '<button class="chip" type="button" data-fmt="' + f[0] + '" aria-pressed="' + ((STATE.ui.qfmt || "all") === f[0]) + '">' + esc(f[1]) + n + "</button>"; }).join("") + "</span>" +
        '<p class="lab">Where it\'s from</p><span class="chipset">' + [["all", "Anywhere"]].concat(srcs.map(function(k){ return [k, CORE.srcLabel[k]]; })).map(function(f){ return '<button class="chip" type="button" data-src="' + esc(f[0]) + '" aria-pressed="' + ((STATE.ui.qsrc || "all") === f[0]) + '">' + esc(f[1]) + "</button>"; }).join("") + "</span></div></details></div>" +
      "</div>";
  }
  function wirePanel(el, preset){
    var bar = $(".qbar", el), pop = $(".lp-pop", el), btn = $("[data-lp]", el);
    function redraw(k){ if (k) track("bank:" + k); STATE.ui.qset = ""; saveState(); if (preset) go("questions"); else drawQuestions(el, ""); }
    btn.addEventListener("click", function(){ var on = pop.hidden; pop.hidden = !on; btn.setAttribute("aria-expanded", String(on)); });
    document.addEventListener("click", function away(e){ if (!el.isConnected) { document.removeEventListener("click", away); return; } if (!pop.hidden && !e.target.closest(".lp")) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    pop.addEventListener("change", function(){ var ids = $$("input:checked", pop).map(function(c){ return c.value; }); STATE.ui.qlec = ids.length === LECS.length ? "all" : ids; saveState(); $("#lpS", el).textContent = ids.length === LECS.length ? "All lectures" : ids.length ? ids.map(function(id){ return lecLabel(LBY[id]); }).join(", ") : "No lectures"; clearTimeout(pop.__t); pop.__t = setTimeout(function(){ if (!pop.hidden) { pop.hidden = true; } redraw("lec-pick"); }, 900); });
    $$("[data-only]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qlec = b.getAttribute("data-only"); redraw("lec-only"); }); });
    $("[data-lpall]", el).addEventListener("click", function(){ STATE.ui.qlec = "all"; redraw("lec-all"); });
    $("[data-lpnone]", el).addEventListener("click", function(){ $$("input", pop).forEach(function(c){ c.checked = false; }); STATE.ui.qlec = []; saveState(); $("#lpS", el).textContent = "No lectures"; });
    $$("[data-show]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qstatus = b.getAttribute("data-show"); redraw("show=" + STATE.ui.qstatus); }); });
    $$("[data-lk]", el).forEach(function(b){ b.addEventListener("click", function(){ var k = b.getAttribute("data-lk"); STATE.ui.qlikely = !preset && STATE.ui.qlikely === k ? "" : k; redraw("show=" + (STATE.ui.qlikely || k + "-off")); }); });
    $$("[data-order]", el).forEach(function(b){ b.addEventListener("click", function(){ var o = b.getAttribute("data-order"); if (o === "random") STATE.ui.qseed = Math.floor(Math.random() * 2e9) + 1; STATE.ui.qorder = o; redraw("order=" + o); }); });
    $$("[data-fmt]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qfmt = b.getAttribute("data-fmt"); STATE.ui.qmore = 1; redraw("type=" + STATE.ui.qfmt); }); });
    $$("[data-src]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qsrc = b.getAttribute("data-src"); STATE.ui.qmore = 1; redraw("src=" + STATE.ui.qsrc); }); });
    $$("[data-set]", el).forEach(function(a){ a.addEventListener("click", function(){ track("bank:set=" + a.getAttribute("data-set")); }); });
    var mf = $(".morefil", el); mf.addEventListener("toggle", function(){ STATE.ui.qmore = mf.open ? 1 : 0; saveState(); if (mf.open) track("bank:more"); });
    var sb = $("[data-search]", el), st = 0;
    sb.addEventListener("input", function(){ bankSearch = sb.value; clearTimeout(st); st = setTimeout(function(){ if (preset) { STATE.ui.qset = ""; go("questions"); return; } fill(el, ""); track("bank:search"); }, 280); });
  }
  function weakList(){
    var rows = LECS.map(lecProgress).filter(function(r){ return r.a >= 3; }).sort(function(a, b){ return a.pct - b.pct; });
    if (!QS) return [];
    var out = [];
    rows.forEach(function(r){ (QBL[r.l.id] || []).forEach(function(x){ var s = STATE.seen[x.id]; if (s && s.last === false) out.push(QBY[x.id]); }); });
    if (rows[0]) shuffled((QBL[rows[0].l.id] || []).filter(function(x){ return !STATE.seen[x.id]; })).slice(0, 10).forEach(function(x){ out.push(QBY[x.id]); });
    return out.filter(Boolean);
  }
  function fill(el, preset){
    var host = $("#qlist", el), sumEl = $(".qsum", el);
    host.innerHTML = ""; LIST = { el: el, host: host, items: [], shown: 0, ctx: preset || "bank", notes: {} };
    if (preset === "drill") {
      sumEl.innerHTML = '<p class="note">Picking today\'s questions…</p>';
      whenWidget("shDrill", function(D){
        if (!D || !D.set) { sumEl.innerHTML = '<p class="note">The drill needs the class connection. Try again in a moment.</p>'; return; }
        D.set(function(s){
          if (!host.isConnected) return;
          if (!s) { sumEl.innerHTML = '<p class="note">Nothing to drill yet: answer a few questions first.</p>'; return; }
          var items = s.items.slice(s.start || 0).filter(function(it){ return QBY[it.id] && s.res[it.id] !== "x"; });
          var done = items.filter(function(it){ return s.res[it.id] === 1 || s.res[it.id] === 0; }).length;
          sumEl.innerHTML = '<p class="sumline"><b class="num">' + done + " of " + items.length + "</b> done today. Spaced review first, then your misses and the high-yield ones.</p>";
          items.forEach(function(it){ LIST.notes[it.id] = it.note; });
          LIST.items = items.filter(function(it){ return !(s.res[it.id] === 1 || s.res[it.id] === 0); }).map(function(it){ return QBY[it.id]; });
          if (!LIST.items.length) { host.innerHTML = drillDoneHTML(); wireDrillDone(el); return; }
          page();
        });
      });
      return;
    }
    if (preset === "misses") {
      var ids = srsMisses();
      LIST.items = ids.map(function(id){ return QBY[id]; }).filter(Boolean);
      sumEl.innerHTML = LIST.items.length ? '<p class="sumline"><b class="num">' + LIST.items.length + "</b> you missed yesterday and haven't tried again.</p>" : "";
      if (!LIST.items.length) { host.innerHTML = emptyHTML("No misses from yesterday", "Either you didn't miss any or you've already tried them again.", '<a class="btn" href="#questions" data-showset="missed">Every question you missed last time</a>'); wireEmpty(el); return; }
      page(); return;
    }
    if (preset === "weak") {
      var rows = LECS.map(lecProgress).filter(function(r){ return r.a >= 3; }).sort(function(a, b){ return a.pct - b.pct; });
      LIST.items = weakList();
      sumEl.innerHTML = rows.length ? '<div class="weak-rows"><p class="lab">Your lectures by how much you get right</p><ul>' + rows.slice(0, 6).map(function(r){ return '<li><span>' + esc(lecName(r.l.id)) + '</span><span class="bar"><i class="right" style="width:' + r.pct + '%"></i></span><span class="num">' + r.pct + "%</span></li>"; }).join("") + '</ul></div><p class="sumline">The questions you missed last time, weakest lecture first, then ' + (rows[0] ? "new ones from " + esc(lecLabel(rows[0].l)) : "new ones") + ".</p>" : "";
      if (!LIST.items.length) { host.innerHTML = emptyHTML("No weak spots yet", "Answer at least 3 questions from a lecture and it shows up here, ranked by how much you get right.", '<a class="btn btn-primary" href="#questions">Practice questions</a>'); return; }
      page(); return;
    }
    var all = QS.length, list = ordered(filtered());
    LIST.items = list;
    sumEl.innerHTML = summaryHTML(list.length, all);
    $$("[data-tagoff]", sumEl).forEach(function(b){ b.addEventListener("click", function(){ var k = b.getAttribute("data-tagoff"); if (k === "lec") STATE.ui.qlec = "all"; if (k === "show") STATE.ui.qstatus = "all"; if (k === "lk") STATE.ui.qlikely = ""; if (k === "fmt") STATE.ui.qfmt = "all"; if (k === "src") STATE.ui.qsrc = "all"; if (k === "search") bankSearch = ""; saveState(); track("bank:tag-off=" + k); drawQuestions(el, ""); }); });
    var ca = $("[data-clearall]", sumEl); if (ca) ca.addEventListener("click", function(){ bankReset(); bankSearch = ""; saveState(); track("bank:clear"); drawQuestions(el, ""); });
    if (!list.length) { host.innerHTML = emptyHTML("Nothing matches", emptyWhy(), '<button class="btn btn-primary" type="button" data-clearall>Show all ' + all + " questions</button>"); $("[data-clearall]", host).addEventListener("click", function(){ bankReset(); bankSearch = ""; saveState(); track("bank:clear"); drawQuestions(el, ""); }); return; }
    page();
  }
  function summaryHTML(n, all){
    var tags = [], picked = lecIds();
    if (picked.length !== LECS.length) tags.push(["lec", picked.length === 1 ? lecName(picked[0]) : picked.length + " lectures"]);
    if (STATE.ui.qstatus && STATE.ui.qstatus !== "all") tags.push(["show", labelOf(SHOW, STATE.ui.qstatus)]);
    if (STATE.ui.qlikely) tags.push(["lk", labelOf(LIKELY, STATE.ui.qlikely)]);
    if (STATE.ui.qfmt && STATE.ui.qfmt !== "all") tags.push(["fmt", labelOf(FMTS, STATE.ui.qfmt)]);
    if (STATE.ui.qsrc && STATE.ui.qsrc !== "all") tags.push(["src", (CORE.srcLabel || {})[STATE.ui.qsrc] || STATE.ui.qsrc]);
    if (bankSearch.trim()) tags.push(["search", "“" + bankSearch.trim() + "”"]);
    return '<p class="sumline">Showing <b class="num">' + n + "</b> of " + all + " questions" + (STATE.ui.qorder === "random" ? ", in random order" : "") + "</p>" +
      (tags.length ? '<span class="tags">' + tags.map(function(t){ return '<button class="tagx" type="button" data-tagoff="' + t[0] + '" aria-label="Remove the filter ' + esc(t[1]) + '">' + esc(t[1]) + icon("close", 14) + "</button>"; }).join("") + '<button class="btn btn-text" type="button" data-clearall>Clear all</button></span>' : "");
  }
  /* what's in the way when the bank shows nothing, in the live hubs' words */
  function emptyWhy(){
    var st = STATE.ui.qstatus || "all", lk = STATE.ui.qlikely ? labelOf(LIKELY, STATE.ui.qlikely) + " " : "";
    var only = !(STATE.ui.qfmt && STATE.ui.qfmt !== "all") && !(STATE.ui.qsrc && STATE.ui.qsrc !== "all") && !bankSearch.trim();
    if (!lecIds().length) return "No lectures are ticked, so there is nothing to show.";
    if (st === "pinned" && !pins().length) return "No pinned questions yet. Tap Pin on any question to save it here.";
    if (st === "missed" && only) return lk ? "You haven't missed any " + lk + "questions in these lectures. Questions you get wrong come back here." : "Nothing missed in these lectures. Questions you get wrong come back here.";
    if (st === "unseen" && only) return "You have answered every " + lk + "question here. Try Missed last time, or another lecture.";
    return "Those filters together leave no questions.";
  }
  function emptyHTML(t, p, act){ return '<div class="empty panel"><h2>' + esc(t) + "</h2><p>" + esc(p) + "</p>" + (act || "") + "</div>"; }
  function wireEmpty(el){ $$("[data-showset]", el).forEach(function(a){ a.addEventListener("click", function(){ STATE.ui.qstatus = a.getAttribute("data-showset"); STATE.ui.qlikely = ""; STATE.ui.qlec = "all"; saveState(); }); }); }
  /* twenty cards, then the next twenty load by themselves as you reach the end */
  var io = null;
  function page(){
    var L = LIST; if (!L) return;
    var next = L.items.slice(L.shown, L.shown + PAGE);
    if (!next.length) return;
    (next.some(needsFig) ? needFigures() : Promise.resolve()).then(function(){
      if (LIST !== L || !L.host.isConnected) return;
      var old = $(".sentinel", L.host); if (old) old.remove();
      next.forEach(function(q){ L.host.appendChild(card(q, { ctx: L.ctx, note: L.notes[q.id], onAnswer: onBankAnswer })); });
      L.shown += next.length;
      if (L.shown < L.items.length) {
        var s = h('<div class="sentinel"><button class="btn" type="button">Next ' + Math.min(PAGE, L.items.length - L.shown) + " questions</button></div>");
        $("button", s).addEventListener("click", page);
        L.host.appendChild(s);
        if ("IntersectionObserver" in window) { if (io) io.disconnect(); io = new IntersectionObserver(function(es){ if (es.some(function(e){ return e.isIntersecting; })) { io.disconnect(); page(); } }, { rootMargin: "600px 0px" }); io.observe(s); }
      } else if (L.ctx === "bank") L.host.appendChild(h('<p class="note end">That\'s all ' + L.items.length + " for these filters.</p>"));
    });
  }
  function onBankAnswer(cardEl, q, right){
    var L = LIST; if (!L) return;
    if (!right && (L.ctx === "bank" || L.ctx === "weak" || L.ctx === "misses")) {
      var after = cardEl, k = 0; while (after.nextElementSibling && after.nextElementSibling.classList.contains("qcard") && k < RETRY_GAP) { after = after.nextElementSibling; k++; }
      var again = card(q, { ctx: L.ctx, retry: true, onAnswer: onBankAnswer });
      after.parentNode.insertBefore(again, after.nextSibling);
    }
    if (cardEl.classList.contains("is-retry")) track("bank:retry-" + (right ? "right" : "missed"));
    if (L.ctx === "drill") {
      setTimeout(function(){
        var D = window.shDrill; if (!D || !D.set) return;
        D.set(function(s){ if (!s || !L.host.isConnected) return; var items = s.items.slice(s.start || 0).filter(function(it){ return QBY[it.id] && s.res[it.id] !== "x"; }), done = items.filter(function(it){ return s.res[it.id] === 1 || s.res[it.id] === 0; }).length;
          var sl = $(".qsum .sumline", L.el); if (sl) sl.innerHTML = '<b class="num">' + done + " of " + items.length + "</b> done today.";
          if (done === items.length && !$(".drill-done", L.host)) { L.host.appendChild(h(drillDoneHTML())); wireDrillDone(L.el); } });
      }, 50);
    }
  }
  function drillDoneHTML(){
    var n = window.shDrill && window.shDrill.streak ? window.shDrill.streak() : 0;
    return '<div class="empty panel drill-done"><h2>That\'s today\'s drill</h2><p>' + (n > 1 ? "Your drill streak is " + pl(n, "day") + ". " : "") + 'Want more? Each set skips what you\'ve already seen today.</p><div class="qc-go">' +
      [10, 20, 30].map(function(n){ return '<button class="btn' + (n === 10 ? " btn-primary" : "") + '" type="button" data-more="' + n + '">' + n + " more</button>"; }).join("") + "</div></div>";
  }
  function wireDrillDone(el){ $$("[data-more]", el).forEach(function(b){ b.addEventListener("click", function(){ var n = +b.getAttribute("data-more"); window.shDrill.more(n, function(){ drawQuestions(el, "drill"); }); }); }); }
  function whenWidget(name, cb){ var t0 = Date.now(); (function poll(){ if (window[name]) { cb(window[name]); return; } if (Date.now() - t0 > 12000) { cb(null); return; } setTimeout(poll, 250); })(); }

  /* ---------- the mock: a preset of the bank that runs as a timed set with no feedback, then its results ---------- */
  function mockTotal(){ var b = (CORE.mock || {}).blueprint || {}; return Object.keys(b).reduce(function(n, k){ return n + b[k]; }, 0); }
  function buildMock(){
    var ids = [], bp = CORE.mock.blueprint;
    Object.keys(bp).forEach(function(lec){
      var pool = (QBL[lec] || []).map(function(r){ return QBY[r.id]; }).filter(function(q){ return q && q.type === "mcq"; });
      var fresh = shuffled(pool.filter(function(q){ return !STATE.seen[q.id] || STATE.seen[q.id].last === false; }));
      var rest = shuffled(pool.filter(function(q){ return fresh.indexOf(q) === -1; }));
      fresh.concat(rest).slice(0, bp[lec]).forEach(function(q){ ids.push(q.id); });
    });
    var order = {}; ids.forEach(function(id){ order[id] = choiceOrder(QBY[id]); });
    STATE.mock = { ids: shuffled(ids), t0: Date.now(), picks: {}, order: order, res: {}, submitted: false };
    saveNow();
  }
  var mockTimer = 0;
  function drawMock(host, el){
    clearInterval(mockTimer);
    var m = STATE.mock, total = mockTotal(), lim = CORE.mock.limit || 0, X = C.mock || {};
    $(".qsum", el).innerHTML = "";
    if (m && !m.picks) { if (m.ids && Object.keys(m.res || {}).length >= m.ids.length) { m.picks = {}; m.submitted = true; } else STATE.mock = m = null; saveState(); }
    if (!m || !m.ids || !m.ids.length) {
      host.innerHTML = '<div class="panel mock-intro"><h2>' + pl(total, "question") + ", " + Math.round(lim / 60) + " minutes</h2><p>" + esc(X.blurb || "") + '</p><p class="note">' + esc(X.how || "It runs like the exam: pick an answer for every question with no feedback, then submit to see your score by lecture and go over each one.") + " A reload keeps your place.</p>" +
        '<div class="qc-go"><button class="btn btn-primary" type="button" data-mockstart>' + icon("mock", 18) + "Start the mock</button></div></div>";
      $("[data-mockstart]", host).addEventListener("click", function(){ buildMock(); track("mock:start"); drawMock(host, el); });
      return;
    }
    docEl.classList.toggle("sh-mock-on", !m.submitted);
    var need = m.ids.some(function(id){ return needsFig(QBY[id]); });
    (need ? needFigures() : Promise.resolve()).then(function(){ if (host.isConnected) mockList(host, el, m, total, lim); });
  }
  function mockList(host, el, m, total, lim){
    var picked = Object.keys(m.picks).length, correct = m.submitted ? m.ids.filter(function(id){ return m.res[id]; }).length : 0;
    var bp = CORE.mock.blueprint;
    var top = '<div class="mock-bar panel"><span class="clock num" data-clock>' + icon("clock", 18) + "0:00</span>" +
      (m.submitted ? '<span class="score num"><b>' + correct + " of " + m.ids.length + "</b> right · " + Math.round(correct / m.ids.length * 100) + "%</span>" +
        '<button class="btn" type="button" data-onlymissed aria-pressed="' + !!m.onlyMissed + '">' + (m.onlyMissed ? "Show every question" : "Show only the misses") + "</button>"
        : '<span class="num" data-prog>' + picked + " of " + m.ids.length + ' answered</span><button class="btn btn-primary" type="button" data-submit>Submit the exam</button>') +
      '<button class="btn btn-text" type="button" data-newmock>New mock</button></div>';
    var byLec = m.submitted ? '<div class="panel"><h2>By lecture</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Lecture</th><th scope="col" class="r">Right</th><th scope="col" class="r">Score</th></tr></thead><tbody>' + Object.keys(bp).map(function(lec){
      var qs = m.ids.filter(function(id){ return QBY[id] && QBY[id].lec === lec; }), c = qs.filter(function(id){ return m.res[id]; }).length;
      return '<tr><th scope="row">' + esc(lecName(lec)) + '</th><td class="r num">' + c + " of " + qs.length + '</td><td class="r num">' + (qs.length ? Math.round(c / qs.length * 100) : 0) + "%</td></tr>"; }).join("") + "</tbody></table></div></div>" : "";
    host.innerHTML = top + byLec;
    m.ids.forEach(function(id, i){
      var q = QBY[id]; if (!q) return;
      if (m.submitted && m.onlyMissed && m.res[id]) return;
      var pick = id in m.picks ? m.picks[id] : null, order = (m.order && m.order[id]) || q.choices.map(function(c, k){ return k; });
      var el2 = h('<article class="qcard qc' + (m.submitted ? " is-answered" : "") + '" data-qid="' + esc(q.id) + '" data-qtype="mcq" data-ctx="mock" aria-labelledby="mk' + i + '"></article>');
      el2.innerHTML = '<header class="qc-head"><span class="qc-meta"><span class="qc-lec" id="mk' + i + '">Question ' + (i + 1) + " · " + esc(lecName(q.lec)) + '</span></span><span class="qcard-top qc-tools"></span></header>' + figHTML(q) + pboxHTML(q) + stemHTML(q) +
        '<ul class="qc-choices' + (q.fmt === "tf" ? " qc-tf" : "") + '">' + order.map(function(k){
          var st = m.submitted ? (k === q.answer ? "right" : k === pick ? "wrong" : "") : "";
          return '<li><button class="ch' + (st === "right" ? " is-right" : st === "wrong" ? " is-wrong" : "") + '" type="button" data-mock-pick="' + k + '" aria-pressed="' + (k === pick) + '"' + (m.submitted ? ' aria-disabled="true"' : "") + ">" + '<span class="txt">' + esc(q.choices[k]) + '</span><span class="st-ic" aria-hidden="true">' + (st ? icon(st === "wrong" ? "cross" : "check", 20) : "") + "</span></button></li>"; }).join("") + "</ul>" +
        (m.submitted ? '<section class="qc-result qcard-explain" data-role="explain"><p class="verdict ' + (pick === null ? "no" : m.res[id] ? "ok" : "no") + '">' + icon(m.res[id] ? "check" : "cross", 26) + (pick === null ? "Not answered" : m.res[id] ? "Right" : "Missed") + "</p>" + figAfterHTML(q) + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" + whyHTML(q, pick === null ? [] : [pick]) + "</section>" : '<section class="qcard-explain" data-role="explain" hidden></section>');
      host.appendChild(el2);
    });
    if (!m.submitted) host.appendChild(h('<div class="mock-foot panel"><span class="num" data-prog>' + picked + " of " + m.ids.length + ' answered</span><button class="btn btn-primary" type="button" data-submit>Submit the exam</button></div>'));
    host.onclick = function(e){
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-mock-pick") && !m.submitted) {
        var c = b.closest(".qcard"), id = c.getAttribute("data-qid");
        m.picks[id] = +b.getAttribute("data-mock-pick"); saveState();
        $$("[data-mock-pick]", c).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
        $$("[data-prog]", host).forEach(function(p){ p.textContent = Object.keys(m.picks).length + " of " + m.ids.length + " answered"; });
        $$("[data-submit][data-confirm]", host).forEach(function(s){ s.removeAttribute("data-confirm"); s.textContent = "Submit the exam"; });
      } else if (b.hasAttribute("data-submit")) {
        var left = m.ids.length - Object.keys(m.picks).length;
        if (left > 0 && !b.getAttribute("data-confirm")) { b.setAttribute("data-confirm", "1"); b.textContent = left + " unanswered: submit anyway?"; return; }
        m.submitted = true; m.tEnd = Date.now(); m.res = {};
        m.ids.forEach(function(id){ var q = QBY[id]; if (!q) return; var ok = (id in m.picks) && m.picks[id] === q.answer; m.res[id] = ok; if (id in m.picks) recordAnswer(q.id, q.lec, ok, "mock", m.picks[id]); });
        var nRight = m.ids.filter(function(id){ return m.res[id]; }).length;
        var byL = Object.keys(bp).map(function(lec){ var qs = m.ids.filter(function(id){ return QBY[id] && QBY[id].lec === lec; }); return { label: lecName(lec), correct: qs.filter(function(id){ return m.res[id]; }).length, total: qs.length }; });
        document.dispatchEvent(new CustomEvent("sh:mock-done", { detail: { correct: nRight, total: m.ids.length, byLec: byL } }));
        saveNow(); paintMeters(); track("mock:submit"); drawMock(host, el); window.scrollTo(0, 0);
      } else if (b.hasAttribute("data-onlymissed")) { m.onlyMissed = !m.onlyMissed; saveState(); drawMock(host, el); }
      else if (b.hasAttribute("data-newmock")) { STATE.mock = null; saveState(); drawMock(host, el); }
    };
    var clock = $("[data-clock]", host);
    function tick(){ if (!clock.isConnected) { clearInterval(mockTimer); return; } var sec = Math.floor(((m.tEnd || Date.now()) - m.t0) / 1000); clock.innerHTML = icon("clock", 18) + Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0") + " of " + Math.floor(lim / 60) + ":" + String(lim % 60).padStart(2, "0"); clock.classList.toggle("is-over", sec > lim); }
    tick(); if (!m.submitted) mockTimer = setInterval(tick, 1000);
    if (FIG && FIG.ANIMA) { try { FIG.ANIMA.mount(host); } catch (e) {} }
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
  function renderMore(el, s){
    var page = MORE.filter(function(m){ return m[0] === s; })[0];
    if (!page) { drawMoreMenu(el); return; }
    var back = '<a class="btn btn-text back" href="#more">' + icon("chevron", 18, "flip") + "More</a>";
    el.innerHTML = '<div class="hx-page more-page">' + back + "<h1>" + esc(page[2]) + '</h1><div class="more-body"><p class="note loading">Loading…</p></div></div>';
    var body = $(".more-body", el);
    ({ timmy: moreTimmy, hints: moreHints, cram: moreCram, side: moreSide, arcade: moreArcade, stats: moreStats, settings: moreSettings })[s](body);
  }
  /* More (Sam, 2026-11-06: "can use a spice up"): one tile per part, each on its own field of color with its drawing and
     a line of what's in it; Timmy Time is the big one, its host in headphones. Talk to us stays a list. */
  var MORE_FIELD = { timmy: "hub", hints: "sun", cram: "mint", side: "lilac", arcade: "peach", stats: "sun", settings: "plain" };
  function moreMeta(k){
    var pod = CORE.podcast, X = C.arcade || {}, x = rankXp();
    return ({
      timmy: pod ? Math.round((pod.duration || 0) / 60) + " min" + (pod.chapters ? " · " + pl(pod.chapters.length, "chapter") : "") : "",
      hints: pl((CORE.likelyTopics || []).length, "likely topic"),
      cram: pl(LECS.length, "lecture"),
      side: "Across every lecture",
      arcade: pl((X.games || []).length, "game"),
      stats: rankName() + (x === null ? "" : " · " + fmt(x) + " XP"),
      settings: focusOn() ? "Focus mode is on" : "Daily goal: " + pl(goal(), "question")
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
      '<nav aria-label="Study and play"><ul class="more-tiles">' + MORE.filter(function(m){ return m[0] !== "timmy" || pod; }).map(tile).join("") + "</ul></nav>" +
      '<section class="panel menu talk" aria-labelledby="mwH"><h2 id="mwH">Talk to us</h2><ul class="rows">' +
        '<li><button type="button" data-sh-inbox>' + icon("inbox", 22) + "<span><b>Inbox</b><small>Replies to what you report or suggest, and notices to the class</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-open="suggest">' + icon("comment", 22) + "<span><b>Suggest something</b><small>An idea for this hub or the site</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-open="flag">' + icon("report", 22) + "<span><b>Report an issue</b><small>A typo, a wrong key, something broken</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><button type="button" data-tour>' + icon("tour", 22) + "<span><b>Take the tour</b><small>Two minutes, on the real buttons</small></span>" + icon("chevron", 18) + "</button></li>" +
        '<li><a href="' + esc(C.about || "../../../about/") + '">' + icon("about", 22) + "<span><b>About</b><small>Every feature, trophy and easter egg</small></span>" + icon("chevron", 18) + "</a></li>" +
        '<li><a href="' + esc(C.back || "../../../index.html") + '">' + icon("home", 22) + "<span><b>All hubs</b><small>Back to the dashboard</small></span>" + icon("chevron", 18) + "</a></li>" +
      "</ul></section></div>";
    $$("[data-open]", el).forEach(function(b){ b.addEventListener("click", function(){ var k = b.getAttribute("data-open"); if (k === "flag" && window.shOpenFlag) { window.shOpenFlag(); return; } var p = document.getElementById("shstat-" + k + "-pill"); if (p) p.click(); }); });
    var t = $("[data-tour]", el); t.addEventListener("click", function(){ track("more:tour"); startTour(); });
  }
  function moreTimmy(body){
    var pod = CORE.podcast;
    body.innerHTML = pod ? '<div class="pod-slot" data-sh-podcast></div><p class="note">' + esc(pod.blurb || "") + "</p>" : "<p>No episode for this hub yet.</p>";
  }
  function moreHints(body){
    needStudy().then(function(){ needQuestions().then(function(){
      var X = C.hints || {}, hints = STUDY.hints || [];
      var html = (X.banner ? '<p class="notice">' + icon("clock", 20) + "<span>" + esc(X.banner) + "</span></p>" : "") + likelyHTML(X) +
        '<section class="panel" aria-labelledby="hqH"><h2 id="hqH">In ' + esc(X.prof || "the professor") + "'s words</h2><p class=\"note\">Direct quotes from the recordings where something was flagged to know, or waved off.</p>" +
        LECS.map(function(l){ var items = hints.filter(function(x){ return x.lec === l.id; }); if (!items.length) return "";
          return '<div class="hint-group"><h3>' + esc(lecName(l.id)) + ' <a class="btn btn-text" href="#notes/' + esc(l.id) + '">Notes</a></h3>' + items.map(function(x){
            return '<figure class="hint"><blockquote>“' + esc(x.quote) + '”</blockquote><figcaption><span class="kind ' + esc(x.kind) + '">' + (x.kind === "deemphasize" ? "Less likely" : "Know this") + "</span>" + esc(x.take) + "</figcaption></figure>"; }).join("") + "</div>"; }).join("") + "</section>";
      body.innerHTML = html;
      $$("[data-likely]", body).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qset = ""; STATE.ui.qlec = b.getAttribute("data-likely"); STATE.ui.qstatus = "all"; STATE.ui.qlikely = "likely"; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; saveState(); track("hints:likely-practice"); go("questions"); }); });
    }); }).catch(function(){ body.innerHTML = "<p>Couldn't load the hints. Check your connection.</p>"; });
  }
  function likelyHTML(X){
    var T = CORE.likelyTopics || [], counts = CORE.examCounts || {};
    return '<section class="panel likely-box" aria-labelledby="lkH"><h2 id="lkH">Most likely questions</h2><p class="note">' + esc(X.likely || "Each lecture's predicted topics, strongest evidence first.") + '</p><div class="likely-grid">' + LECS.map(function(l){
      var ts = T.filter(function(t){ return t.lec === l.id; }); if (!ts.length) return "";
      return '<div class="likely-lec"><h3>' + esc(lecName(l.id)) + ' <span class="note">' + (counts[l.id] ? counts[l.id] + " on the exam" : pl(ts.length, "predicted topic")) + "</span></h3><ol>" +
        ts.map(function(t){ return "<li>" + esc(t.t) + ' <span class="note">' + esc(t.basis) + "</span></li>"; }).join("") +
        '</ol><button class="btn" type="button" data-likely="' + esc(l.id) + '">Practice these (' + ts.reduce(function(k, t){ return k + t.ids.length; }, 0) + ")</button></div>";
    }).join("") + "</div></section>";
  }
  function moreCram(body){
    needStudy().then(function(){
      body.innerHTML = '<div class="cram-grid">' + LECS.map(function(l){ var c = (STUDY.cram || {})[l.id] || []; if (!c.length) return "";
        return '<section class="panel cram" id="cram-' + esc(l.id) + '" aria-labelledby="cr' + esc(l.id) + '"><h2 id="cr' + esc(l.id) + '">' + esc(lecName(l.id)) + "</h2><ul>" + c.map(function(b){ return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>"; }).join("") + "</div>";
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
        record: recordAnswer, lecLabel: lecLabel, sortSets: STUDY.sortSets || [], readings: NOTES.full, review: STUDY.review || [] });
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
  function moreStats(body){
    var acc = STATE.totalAnswered ? Math.round(STATE.totalCorrect / STATE.totalAnswered * 100) : null, rows = LECS.map(lecProgress);
    var x = rankXp(), p = RANK.p, days = Object.keys(goalDays()).length;
    body.innerHTML = '<div class="stats-grid">' +
      '<section class="panel" aria-labelledby="srH"><h2 id="srH">Your rank</h2><div class="rank-big"><span class="hp" aria-hidden="true">' + (window.shRanks ? window.shRanks.art(p ? p.tier || 0 : +(ls("sh_rank_tier") || 0), 64) : "") + "</span><div><p class=\"rank-name\">" + esc(rankName()) + '</p><p class="num">' + (x === null ? "+" + fmt(todayRec().xp) + " XP today" : fmt(x) + " XP" + (p && p.next_at ? " · " + fmt(p.next_at - x) + " to the next level" : "")) + "</p></div></div>" +
        '<p class="note">10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss and 20 for every day you study (answer XP tops out at 600 a day).</p>' +
        '<button class="btn" type="button" data-open-stats>' + icon("trophy", 18) + "Trophies and leaderboards</button></section>" +
      '<section class="panel" aria-labelledby="ssH"><h2 id="ssH">Your answers</h2><dl class="kv">' +
        "<div><dt>Answered</dt><dd class=\"num\">" + fmt(STATE.totalAnswered) + "</dd></div><div><dt>Right</dt><dd class=\"num\">" + fmt(STATE.totalCorrect) + (acc !== null ? " · " + acc + "%" : "") + "</dd></div>" +
        "<div><dt>Best run</dt><dd class=\"num\">" + pl(STATE.bestStreak, "right in a row", "right in a row") + "</dd></div><div><dt>Days goal met</dt><dd class=\"num\">" + fmt(days) + "</dd></div>" +
        "<div><dt>Achievements</dt><dd class=\"num\">" + Object.keys(STATE.ach || {}).length + " of " + (CORE.achievements || []).length + "</dd></div></dl></section>" +
      '<section class="panel wide" aria-labelledby="slH"><h2 id="slH">By lecture</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Lecture</th><th scope="col" class="r">Tried</th><th scope="col" class="r">Right now</th><th scope="col" class="r">Accuracy</th></tr></thead><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + esc(lecName(r.l.id)) + '</th><td class="r num">' + r.tried + " of " + r.total + '</td><td class="r num">' + r.right + '</td><td class="r num">' + (r.pct === null ? "–" : r.pct + "%") + "</td></tr>"; }).join("") + "</tbody></table></div></section>" +
      '<section class="panel wide" aria-labelledby="saH"><h2 id="saH">Achievements</h2><ul class="ach">' + (CORE.achievements || []).map(function(a){ var got = STATE.ach[a.id]; return '<li class="' + (got ? "got" : "") + '">' + icon(got ? "check" : "goal", 20) + "<span><b>" + esc(a.name) + "</b><small>" + esc(a.desc) + (got ? " · " + esc(dateLabel(got)) : "") + "</small></span></li>"; }).join("") + "</ul></section>" +
      "</div>";
    $("[data-open-stats]", body).addEventListener("click", function(){ var b = document.getElementById("shstat-stats-pill"); if (b) b.click(); track("more:trophies"); });
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
        '<div class="set-row"><div><b>Questions a day</b><small>The ring in the bar fills as you answer, right or wrong. Your streak counts any day you answer a question.</small></div>' + seg("goal", [["10", "10"], ["20", "20"], ["30", "30"], ["40", "40"], ["50", "50"]], String(goal())) + "</div>" +
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
        else if (k === "goal") { STATE.nx.goal = +v; var t = todayRec(); if (!t.met && t.n >= +v) t.met = 1; saveNow(); paintMeters(); }
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
    ex.questions = QS.map(function(q){
      var hint = q.type === "mcq" ? q.choices[q.answer] : q.type === "multi" ? q.correct.map(function(k){ return q.choices[k]; }).join("; ") : q.type === "sequence" ? q.steps.join(" → ") : q.pairs.map(function(p){ return p.join(": "); }).join("; ");
      if (q.ex) hint += " — " + q.ex;
      return { id: q.id, lec: q.lec, text: q.stem, hint: hint, choices: q.choices || null, answer: (q.type === "mcq" ? q.answer : null) };
    });
  }
  function exportSections(){
    var out = [], frag = function(html){ var d = document.createElement("div"); d.innerHTML = html || ""; return d; }, clean = function(t){ return String(t || "").replace(/\s+/g, " ").trim(); };
    LECS.forEach(function(l){
      var where = lecLabel(l) + " " + l.title;
      Array.prototype.forEach.call(frag(NOTES.full[l.id]).querySelectorAll("p, li, h3, h4"), function(el, k){ var t = clean(el.textContent); if (t.length > 2) out.push({ kind: "Notes", where: where, text: t, lec: l.id, go: { v: "notes", lec: l.id, k: k } }); });
      if (STUDY) ((STUDY.cram || {})[l.id] || []).forEach(function(b){ out.push({ kind: "Cram sheet", where: where, text: b, lec: l.id, go: { v: "cram", lec: l.id } }); });
    });
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
    else if (g.v === "review") go("more/side");
    else if (g.v === "bank") { bankReset(); bankSearch = g.q || ""; saveState(); go("questions"); }
  };
  var LOADED = Date.now();
  window.SH_SYNC = {
    merge: function(byQid, days){
      var changed = false, added = 0, lecOf = {};
      IDX.forEach(function(r){ lecOf[r.id] = r.lec; });
      Object.keys(byQid).forEach(function(id){
        var lec = lecOf[id]; if (!lec) return;
        var sv = byQid[id], s = STATE.seen[id] || { n: 0, c: 0, last: null };
        if (sv.n <= s.n) return;
        var dn = sv.n - s.n, dc = Math.max(0, sv.c - s.c);
        if (!s.n) added++;
        STATE.totalAnswered += dn; STATE.totalCorrect += dc;
        var lsx = STATE.lecStats[lec] || { a: 0, c: 0 }; lsx.a += dn; lsx.c += dc; STATE.lecStats[lec] = lsx;
        STATE.seen[id] = { n: sv.n, c: Math.max(sv.c, s.c), last: sv.last };
        changed = true;
      });
      (days || []).forEach(function(d){ if (STATE.days.indexOf(d) === -1) { STATE.days.push(d); changed = true; } });
      if (!changed) return;
      STATE.days.sort(); achievements(true); saveNow(); paintMeters();
      if (added) toast("Synced " + pl(added, "question") + " from your other devices");
      /* Home, or a bank not yet answered in, redraws with the merged answers (its counts and Missed last time) */
      if (Date.now() - LOADED < 8000 && (view === "home" || (view === "questions" && !SESSION.n && !parse()[1] && !(document.activeElement && document.activeElement.matches("input, textarea"))))) route();
    }
  };
  window.SH_DRILL = {
    pool: function(){ return IDX.filter(function(q){ return isExamLec(q.lec); }).map(function(q){ var s = STATE.seen[q.id]; return { id: q.id, lec: q.lec, last: s ? !!s.last : null, hy: (CORE.drillHy || {})[q.src] || "" }; }); },
    render: function(el, qid){ var q = QBY[qid]; if (!q) return false; el.innerHTML = ""; el.appendChild(card(q, { ctx: "drill" })); return true; }
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
      { el: function(){ return [].slice.call(document.querySelectorAll("[data-goalm]")).filter(o.visible)[0]; }, title: "Your daily goal", body: "<p>The ring fills toward " + goal() + " questions a day, and the flame counts the days in a row you study. Change the goal in More, Settings.</p>" },
      { el: function(){ return [document.getElementById("hxRank"), document.getElementById("hxXp")].filter(o.visible)[0]; }, title: "XP and your rank", body: "<p>Every answer earns XP, and it flies up here. Tap it for your stats and trophies.</p>" },
      { el: ".hx-set", title: "Settings", body: "<p>Theme, text size, your daily goal, Timmy and the extras.</p>" },
      { el: ".shpet-home", title: "Timmy", body: "<p>Timmy Tooth, in the corner, cheers when you get one right and when you meet your goal. Tap him for a joke.</p>" },
      { before: press("questions"), wait: 600, el: ".qbar", title: "The question bank", body: "<p>Pick lectures, what to show and the order here. The sets underneath are the daily drill, yesterday's misses, your weak spots and the timed mock.</p>" },
      { before: press("home"), wait: 400, el: ".quick", title: "Start here", body: "<p>One tap to practice, the drill, your notes, the mock and the rest.</p>", last: true }
    ];
  }

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
      s.onload = function(){
        /* Report and Pin on every card, as on the live hubs (the class picks are the engine's own: classPicks) */
        if (window.shWireClassStats) window.shWireClassStats(".qcard[data-qid]");
        var boot = window.shBootstrap && window.shBootstrap.ready;
        if (boot && boot.then) boot.then(function(d){ if (d && d.rank && typeof d.rank === "object" && !RANK.p) { RANK.p = d.rank; paintMeters(); } });
        whenWidget("shRanks", function(){ paintMeters(); });
        whenWidget("shPet", function(){ setTimeout(function(){ if (SESSION.hp0 === null) SESSION.hp0 = petHp(); }, 1500); });
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
  window.shHub = { go: go, state: function(){ return STATE; }, card: function(id){ var q = QBY[id]; return q ? card(q, {}) : null; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
