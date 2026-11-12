/* ============ THE HUB ENGINE, part: the rewards (widget/hub-rewards.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what an
   answer earns and where it shows: the one answer path (recordAnswer: the daily goal, the streak, achievements, XP as
   the server counts it), the rank from the server's profile, the meters on the bar, the XP flying to the rank, the
   ring of teeth and the Today panel, and the session recap card.

   The names it takes from the core are listed first; anything of the core's that changes after the page loads is read
   as HX.<name> (HX.CORE, HX.IDX); what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).rewards = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var A = HX.A, AH = HX.AH, EVT = HX.EVT, reduced = HX.reduced, $ = HX.$, $$ = HX.$$, esc = HX.esc, h = HX.h,
    fmt = HX.fmt, pl = HX.pl, day = HX.day, dateLabel = HX.dateLabel, track = HX.track, ls = HX.ls,
    visible = HX.visible, toast = HX.toast, icon = HX.icon, artSvg = HX.artSvg, spot = HX.spot, flame = HX.flame,
    ring = HX.ring, ANSWERED = HX.ANSWERED, STATE = HX.STATE, ansOf = HX.ansOf, studyDayList = HX.studyDayList,
    achMap = HX.achMap, putAnswer = HX.putAnswer, saveNow = HX.saveNow, saveState = HX.saveState, QBL = HX.QBL,
    lecName = HX.lecName, lecDot = HX.lecDot, paintLive = HX.paintLive, go = HX.go, lecStat = HX.lecStat, QBY = HX.QBY;

  /* ---------- the game layer (migration_v54, at the redesign's release; vault/reference/game-server.md) ----------
     widget/v3.js knows whether the database has it (window.shGame). When it does, an answer is one call the server
     grades and pays, and this file shows XP by the new rules; until then, and whenever the call isn't there,
     everything here counts XP the way the live hubs do. */
  function v2(){ var G = window.shGame; return !!(G && G.v2 && G.v2()); }
  function boost(){ var G = window.shGame; return v2() && G.boost ? G.boost() : null; }
  /* how the server grades each kind of question (tools/xp/keys.js): one choice and select-all from the picks, a
     sequence from the order as placed, recall cards and matching by the student's own grade */
  var KIND = { sequence: "order", recall: "self", match: "self" };

  /* ---------- the one answer path: the live hub's recordAnswer, plus the daily goal and the rewards ---------- */
  var SESSION = { n: 0, r: 0, xp: 0, miss: {}, since: 0, recapAt: 0, hp0: null };
  function todayRec(){
    var d = day(0), x = STATE.nx.days[d];
    /* q (each question's right and wrong answers today, for the three-a-day rule) is kept for today only */
    if (!x) { Object.keys(STATE.nx.days).forEach(function(k){ delete STATE.nx.days[k].q; }); x = STATE.nx.days[d] = { n: 0, r: 0, xp: 0 }; }
    return x;
  }
  function goal(){ return STATE.nx.goal || 20; }
  function goalDays(){
    var on = {}; Object.keys(STATE.nx.days).forEach(function(k){ if (STATE.nx.days[k].met) on[k] = 1; });
    return on;
  }
  /* the streak counts the days you studied (answered at least one question), as on the live hubs (Sam, 2026-11-06): the
     goal ring is today's target, and missing it doesn't break the streak. STATE.days is the live hub's own list, so
     nobody's streak changes at the release. Not studied yet today: it counts back from yesterday. */
  function studyDays(){ var on = {}; studyDayList().forEach(function(k){ on[k] = 1; }); return on; }
  function streakDays(){
    var on = studyDays(), n = 0, off = on[day(0)] ? 0 : -1;
    while (on[day(off)]) { n++; off--; }
    return n;
  }
  function achievements(quiet){
    var got = achMap();
    (HX.CORE.achievements || []).forEach(function(a){
      if (got[a.id]) return;
      var c = a.cond, ok = false;
      if (c.type === "totalCorrect") ok = STATE.totalCorrect >= c.n;
      else if (c.type === "streak") ok = STATE.streak >= c.n;
      else if (c.type === "lecPct") { var st = lecStat(c.lec); ok = !!(st && st.a >= c.min && (st.c / st.a) * 100 >= c.pct); }
      else if (c.type === "allSeen") ok = HX.IDX.every(function(q){ return ansOf(q.id); });
      /* every question of a lecture right at least once (Perio's "Session n Mastered") */
      else if (c.type === "lecRight") { var lq = QBL[c.lec] || []; ok = lq.length > 0 && lq.filter(function(q){ var r = ansOf(q.id); return r && r.c > 0; }).length * 100 >= (c.pct || 100) * lq.length; }
      if (ok) { got[a.id] = ANSWERED ? true : day(0); if (!quiet) toast("Achievement: " + a.name); }
    });
  }
  /* XP as the server counts it. On the live rules (widget/ranks.js, "How XP works"): 10 the first time you get a
     question right, 2 for any other right answer, 1 for a miss, 20 for every day you study; answer XP is capped at 600
     a day. On the game layer: the same 10, 2 and 1 with no cap, a self-graded card a flat 2, each question paying
     its first three right and its first three wrong answers a day, all of it doubled while a boost runs. This is the
     page's guess, shown at once; the server's own figure follows and corrects it (sh:answer-paid, below). */
  function xpFor(qid, correct, self){
    var s = ansOf(qid), t = todayRec();
    if (!v2()) { var x = correct ? (s && s.c > 0 ? 2 : 10) : 1; return Math.max(0, Math.min(x, 600 - t.xp)); }
    var q = (t.q || {})[qid] || [0, 0], b = boost();
    var base = self ? (q[0] + q[1] < 3 ? 2 : 0) : correct ? (q[0] < 3 ? (s && s.c > 0 ? 2 : 10) : 0) : (q[1] < 3 ? 1 : 0);
    return base * (b ? b.mult || 2 : 1);
  }
  /* more: { order: a sequence's steps as placed (authored indexes), session: the mock's session } */
  function recordAnswer(qid, lecId, correct, ctx, choice, picks, more){
    var qq = QBY[qid], kind = qq ? KIND[qq.type] || "" : "", game = v2();
    var xp = xpFor(qid, correct, kind === "self"), t = todayRec(), first = !t.n, mult = game && boost() ? 2 : 1;
    putAnswer(qid, lecId, correct);
    t.n++; if (correct) t.r++; t.xp += xp;
    if (game) { var tq = t.q || (t.q = {}), c = tq[qid] || (tq[qid] = [0, 0]); c[correct ? 0 : 1]++; PEND.push({ qid: qid, xp: xp, at: Date.now() }); }
    var met = false; if (!t.met && t.n >= goal()) { t.met = 1; met = true; }
    if (ctx !== "mock" && ctx !== "arcade") { SESSION.n++; if (correct) SESSION.r++; else SESSION.miss[lecId] = (SESSION.miss[lecId] || 0) + 1; SESSION.xp += xp; }
    achievements();
    saveNow();
    if (ctx === "drill" && window.shDrill && window.shDrill.mark) { try { window.shDrill.mark(qid, correct); } catch (e) {} }
    more = more || {};
    document.dispatchEvent(new CustomEvent(EVT, { detail: { qid: qid, lec: lecId, correct: !!correct, ctx: ctx || "bank", choice: (typeof choice === "number" ? choice : null), picks: (Array.isArray(picks) && picks.length ? picks.slice() : null),
      self: kind === "self", order: (kind === "order" && Array.isArray(more.order) ? more.order.slice() : null), session: more.session || null } }));
    RANK.local += xp + (first ? 20 : 0);
    return { xp: xp, met: met, dayBonus: first, mult: mult };
  }
  /* what the server paid for an answer (widget/v3.js sends it on): the total it holds replaces the page's sum, an
     answer that paid something other than the guess corrects today's figure, and what the page can't know by itself is
     said out loud: the day's 20th answer, a miss fixed, a medal with its double XP */
  var PEND = [], BONUS = { goal20: "20 answers today", fix: "A miss fixed" }, MEDAL = ["", "Bronze", "Silver", "Gold", "Crown"];
  function pendSum(){ var cut = Date.now() - 20000; PEND = PEND.filter(function(x){ return x.at > cut; }); return PEND.reduce(function(n, x){ return n + x.xp; }, 0); }
  document.addEventListener("sh:answer-paid", function(e){
    var d = e.detail || {}, r = d.res; if (!r || r.repeat) return;
    /* the page's guess for this very answer (a reply can be missing: an answer recorded the old way, or lost offline) */
    var at = -1; PEND.some(function(x, i){ if (x.qid === d.qid) { at = i; return true; } return false; });
    var guess = at > -1 ? PEND.splice(at, 1)[0] : null, t = todayRec(), extra = 0, said = [];
    (Array.isArray(r.bonus) ? r.bonus : []).forEach(function(b){ if (b && b.xp > 0) { extra += b.xp; if (BONUS[b.src]) said.push(BONUS[b.src] + ": +" + b.xp + " XP"); } });
    var off = (r.xp | 0) - (guess ? guess.xp : r.xp | 0) + extra;
    if (off) { t.xp = Math.max(0, t.xp + off); if (d.ctx !== "mock" && d.ctx !== "arcade") SESSION.xp = Math.max(0, SESSION.xp + off); saveState(); }
    if (RANK.p && typeof r.total === "number") { RANK.p.xp = Math.max(RANK.p.xp || 0, r.total); RANK.local = pendSum(); }
    if (r.medal && r.medal.level) {
      said.push((MEDAL[r.medal.level] || "A medal") + " medal: +" + fmt(r.medal.xp | 0) + " XP, and double XP for 24 hours");
      HX.say("Double XP for a day. Go!", "do-hop");
    }
    if (said.length && d.ctx !== "mock") toast(said.join(". ") + ".");
    if (off || extra || r.medal || boostShown !== !!boost()) paintMeters();
  });
  /* a finished mock's +50 (the server pays it once per hub per day, with 10 or more answers) */
  document.addEventListener("sh:session-paid", function(e){
    var r = (e.detail || {}).res; if (!r || !(r.xp > 0)) return;
    todayRec().xp += r.xp; RANK.local += r.xp; saveState();
    toast("Mock exam finished: +" + r.xp + " XP."); paintMeters();
  });

  /* ---------- rank: the server's profile (the page bootstrap, then widget/ranks.js every 10 answers) plus what you
     earned since it came ---------- */
  var RANK = { p: null, local: 0, mastery: null };
  function rankName(){
    var R = window.shRanks, p = RANK.p, t = p ? p.tier || 0 : +(ls("sh_rank_tier") || 0);
    if (R && R.nameOf && p) return R.nameOf(p);   // "Gold II" on the Handpiece, "ModuPro Gold II" after it
    if (R && R.rankName) return R.rankName(t, p ? p.level || 1 : 0);
    var names = ["Stone", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Dark Matter"];
    return names[t] || "Stone";
  }
  function rankXp(){ return RANK.p ? (RANK.p.xp || 0) + RANK.local : null; }
  /* the rank's medallion at a size: the handpiece, or the journey's object once its drawings have come (they load the
     first time someone past the Handpiece opens a page, and the pill is painted again when they arrive) */
  var artAsked = false;
  function rankArt(px){
    var R = window.shRanks, p = RANK.p, t = p ? p.tier || 0 : +(ls("sh_rank_tier") || 0), j = p ? p.journey | 0 : 0;
    if (!R || !R.art) return "";
    if (j > 0 && R.artOf) {
      if (window.SH_JOURNEY_ART) return R.artOf(j, t, px || 30);
      if (!artAsked && R.needJourneyArt) { artAsked = true; R.needJourneyArt(function(K){ if (K) paintMeters(); }); }
      return R.art(6, px || 30);   // until then, the Handpiece as it was left: Dark Matter
    }
    return R.art(t, px || 30);
  }
  /* double XP: its chip on the rank pill, with the time left; the pill's spoken name says it too */
  var boostShown = false, boostTimer = 0;
  function left(ms){ var m = Math.max(1, Math.round(ms / 60000)); return m >= 90 ? Math.round(m / 60) + " h" : m >= 60 ? "1 h" : m + " min"; }
  function boostChip(){
    var b = boost(); boostShown = !!b;
    clearTimeout(boostTimer);
    if (!b) return "";
    var ms = new Date(b.until).getTime() - Date.now();
    /* repaint when the label would change, and once more when it ends */
    boostTimer = setTimeout(paintMeters, Math.min(ms + 500, ms > 5400000 ? 600000 : 60000));
    return '<span class="xboost"><i aria-hidden="true">2x</i><span class="sr">Double XP, </span><span class="xb-t">' + left(ms) + '</span><span class="sr"> left. </span></span>';
  }
  document.addEventListener("sh:rank-profile", function(e){
    var d = e.detail || {}; if (!d.profile) return;
    RANK.p = d.profile; RANK.local = 0; PEND = []; RANK.mastery = d.mastery || null;
    if (d.profile.boost !== undefined && window.shGame && window.shGame.setBoost) window.shGame.setBoost(d.profile.boost);
    paintMeters();
    HX.petFromBadges(d.profile.badges || []);
  });
  /* a journey's scene has closed (widget/journeys.js): Timmy has the last word, and the pill shows the new rank */
  document.addEventListener("sh:journey-scene-end", function(e){
    var d = e.detail || {}, R = window.shRanks, name = R && R.JOURNEYS ? R.JOURNEYS[d.journey | 0] : "";
    paintMeters();
    if (d.kind === "handoff") HX.say(name ? "The " + name + "! A whole new climb." : "A whole new climb!", "do-hop");
    else if (d.kind === "dark") HX.say("Dark Matter. You earned that one.", "do-hop");
  });
  /* the meters on the bar and the strip: the streak, today's goal, the rank and its XP (the bar itself is the core's
     buildShell), and every Today panel on the page */
  function paintMeters(){
    if (!HX.shell) return;
    var n = streakDays(), t = todayRec(), g = goal();
    $$("[data-streakm]").forEach(function(m){ m.innerHTML = flame(n) + '<span class="num" aria-hidden="true">' + (n ? n + '<span class="fold"> ' + (n === 1 ? "day" : "days") + "</span>" : '<span class="fold">No streak</span><span class="unfold">0</span>') + '</span><span class="sr">' + (n ? pl(n, "day") + " in a row studied" : "No streak yet") + "</span>"; });
    $$("[data-goalm]").forEach(function(m){ m.innerHTML = ring(t.n, g) + '<span class="num" aria-hidden="true">' + Math.min(t.n, 999) + '<span class="fold"> of </span><span class="unfold">/</span>' + g + '</span><span class="sr">' + Math.min(t.n, 999) + " of " + g + ' questions today</span>'; });
    var x = rankXp(), rk = $("#hxRank"), chip = boostChip();
    /* its spoken name is its visible text with a few hidden words around it (axe: the label must contain what's shown) */
    if (rk) rk.innerHTML = '<span class="hp" aria-hidden="true">' + rankArt() + '</span><span class="sr">Your rank: </span><b>' + esc(rankName()) + '</b><span class="sr">, </span><span class="xpn num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + "</span> XP" + (x === null ? " today" : "") + '</span><span class="sr">. </span>' + chip + '<span class="sr">Open your stats</span>';
    $$("[data-xpm]").forEach(function(m){ m.innerHTML = artSvg(A.xp || "", "0 0 24 24", "xpi") + '<span class="num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + '</span><span class="fold-xp"> XP</span></span>' + (boostShown ? '<i class="x2" aria-hidden="true">2x</i><span class="sr">Double XP is on</span>' : ""); });
    $$("[data-today]").forEach(function(p){ p.outerHTML = todayPanel(); });
    /* any other medallion of your rank on the page (More, Stats), at its own size */
    $$("[data-rankart]").forEach(function(n){ n.innerHTML = rankArt(+n.getAttribute("data-rankart") || 30); });
    paintLive();
  }

  /* ---------- the rewards on every answer: XP to the rank, Timmy on the bar, the goal ring, the flame, the recap ---------- */
  function reward(from, right, rec){
    var target = [$("#hxRank"), $("#hxXp")].filter(visible)[0] || null;
    flyXp(from, target, rec.xp, rec.mult > 1, function(){
      $$("[data-xp]").forEach(function(n){ var to = rankXp(); countUp(n, to === null ? todayRec().xp : to, to === null); });
      if (target) { target.classList.remove("bump"); void target.offsetWidth; target.classList.add("bump"); }
    });
    HX.timmyReact(right);
    setTimeout(function(){
      paintMeters();
      if (rec.met) {
        var n = streakDays();
        $$("[data-streakm] .flame").forEach(function(f){ f.classList.add("grow-in"); });
        HX.say("Goal met! " + goal() + " questions today.", "do-hop");
        toast("Today's goal is met: " + goal() + " questions." + (n > 1 ? " Your streak is " + pl(n, "day") + "." : ""));
      }
    }, reduced ? 0 : 650);
  }
  function flyXp(from, to, xp, doubled, done){
    if (!from || !to || reduced || !xp) { done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = h('<span class="xpfly" aria-hidden="true">' + artSvg(A.xp || "", "0 0 24 24", "") + "+" + xp + (doubled ? '<i class="x2">2x</i>' : "") + "</span>");
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
    var t = todayRec(), g = goal(), n = streakDays(), left = Math.max(0, g - t.n), hp = HX.petHp(), T = AH.tint || { ink: "#6B5A68", light: "#ECE6EA" };
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
    var hp = HX.petHp(), hpd = hp !== null && SESSION.hp0 !== null ? hp - SESSION.hp0 : null, n = streakDays();
    var next = Object.keys(d.miss).sort(function(a, b){ return d.miss[b] - d.miss[a]; }).slice(0, 2);
    return '<section class="recap enter" aria-label="Session recap"><h2>That was ' + pl(d.n, "question") + "</h2><div class=\"figs\">" +
      '<div><b class="num" data-count="' + d.r + '">' + d.r + "</b><span>right of " + d.n + '</span></div><div><b class="num" data-count="' + d.xp + '" data-plus>+' + d.xp + "</b><span>XP this session</span></div>" +
      (hpd !== null ? '<div><b class="num">' + (hpd >= 0 ? "+" : "") + hpd + "</b><span>Timmy's HP, now " + hp + "</span></div>" : "") +
      '<div><b class="num">' + (n ? pl(n, "day") : "Day one") + "</b><span>streak</span></div></div>" +
      (next.length ? '<div class="next"><h3>Look at these next</h3><ul>' + next.map(function(id){ return '<li><a href="#notes/' + esc(id) + '">' + lecDot(id) + esc(lecName(id)) + '</a> <span class="num">' + pl(d.miss[id], "miss", "misses") + "</span></li>"; }).join("") + "</ul></div>" : "") +
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

  /* what the other files call from here */
  HX.SESSION = SESSION; HX.todayRec = todayRec; HX.goal = goal; HX.goalDays = goalDays;
  HX.achievements = achievements; HX.recordAnswer = recordAnswer; HX.RANK = RANK; HX.rankName = rankName;
  HX.rankXp = rankXp; HX.rankArt = rankArt; HX.gameOn = v2; HX.boost = boost; HX.paintMeters = paintMeters; HX.reward = reward; HX.todayPanel = todayPanel;
  HX.recapDue = recapDue; HX.showLeftRecap = showLeftRecap;
};
