/* ============ THE HUB ENGINE, part: the rewards (widget/hub-rewards.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what an
   answer earns and where it shows: the one answer path (recordAnswer: the daily goal, the streak, achievements, XP as
   the server counts it, the bowling egg's run), the rank from the server's profile, the meters on the bar, the XP flying to the rank, the
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
     grades and pays, and this file shows XP by the new rules; only when the call is found missing does everything here
     count XP the old way (10, 2 and 1, capped at 600 a day). A page that wants it counts by the new rules while it is
     still asking (shGame.live()): on 2026-11-18, with the bootstrap timed out in a busy minute, the page counted by the old
     cap until the first answer's reply came back, and right answers the server paid 10 showed "+0 XP" on the card. */
  function v2(){ var G = window.shGame; return !!(G && (G.live ? G.live() : G.v2 && G.v2())); }
  function boost(){ var G = window.shGame; return v2() && G.boost ? G.boost() : null; }
  /* how the server grades each kind of question (tools/xp/keys.js): one choice and select-all from the picks, a
     sequence from the order as placed, matching from each row's first pick (graded like an order since 2026-11-17),
     recall cards by the student's own grade */
  var KIND = { sequence: "order", match: "order", recall: "self" };

  /* ---------- the one answer path: the live hub's recordAnswer, plus the daily goal and the rewards ---------- */
  var SESSION = { n: 0, r: 0, xp: 0, miss: {}, since: 0, recapAt: 0, hp0: null, k: 0, again: 0, kSince: 0, againAt: 0 };
  function todayRec(){
    var d = day(0), x = STATE.nx.days[d];
    /* q (each question's right and wrong answers today, for the three-a-day rule) and cq (each flashcard's paying ratings
       today) are kept for today only; k counts today's flashcard ratings */
    if (!x) { Object.keys(STATE.nx.days).forEach(function(k){ delete STATE.nx.days[k].q; delete STATE.nx.days[k].cq; }); x = STATE.nx.days[d] = { n: 0, r: 0, xp: 0 }; }
    return x;
  }
  /* today's goal counts answers and flashcards (Sam, 2026-11-06: flashcards count toward the ring and the streak, not as
     answers) */
  function doneToday(t){ t = t || todayRec(); return t.n + (t.k || 0); }
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
      if (ok) { got[a.id] = ANSWERED ? true : day(0); if (!quiet) toast(a.name, "achv"); }
    });
  }
  /* XP as the server counts it. On the live rules (widget/ranks.js, "How XP works"): 10 the first time you get a
     question right, 2 for any other right answer, 1 for a miss, 20 for every day you study; answer XP is capped at 600
     a day. On the game layer: the same 10, 2 and 1 with no cap, a self-graded card a flat 2, every right answer paying
     (migration_v68, Sam: "Every right answer should give xp") and a question's first three misses a day, all of it doubled
     while a boost runs. This is the
     page's guess, shown at once; the server's own figure follows and corrects it (sh:answer-paid, below). */
  function xpFor(qid, correct, self){
    var s = ansOf(qid), t = todayRec();
    if (!v2()) { var x = correct ? (s && s.c > 0 ? 2 : 10) : 1; return Math.max(0, Math.min(x, 600 - t.xp)); }
    var q = (t.q || {})[qid] || [0, 0], b = boost();
    var base = self ? (correct || q[0] + q[1] < 3 ? 2 : 0) : correct ? (s && s.c > 0 ? 2 : 10) : (q[1] < 3 ? 1 : 0);
    return base * (b ? b.mult || 2 : 1);
  }
  /* the arcade game being played: its session on the game layer (widget/games.js), which its answers carry */
  function arcSession(){ var G = window.shGames; return G && G.session ? G.session() : null; }
  /* more: { order: a sequence's steps as placed (authored indexes), session: the mock's session; an arcade answer takes
     the running game's } */
  function recordAnswer(qid, lecId, correct, ctx, choice, picks, more){
    var qq = QBY[qid], kind = qq ? KIND[qq.type] || "" : "", game = v2();
    var xp = xpFor(qid, correct, kind === "self"), t = todayRec(), first = !t.n, mult = game && boost() ? 2 : 1;
    putAnswer(qid, lecId, correct);
    t.n++; if (correct) t.r++; t.xp += xp;
    if (game) { var tq = t.q || (t.q = {}), c = tq[qid] || (tq[qid] = [0, 0]); c[correct ? 0 : 1]++; PEND.push({ qid: qid, xp: xp, at: Date.now() }); }
    var met = false; if (!t.met && doneToday(t) >= goal()) { t.met = 1; met = true; }
    if (ctx !== "mock" && ctx !== "arcade") { SESSION.n++; if (correct) SESSION.r++; else SESSION.miss[lecId] = (SESSION.miss[lecId] || 0) + 1; SESSION.xp += xp; }
    achievements();
    saveNow();
    if (ctx === "drill" && window.shDrill && window.shDrill.mark) { try { window.shDrill.mark(qid, correct); } catch (e) {} }
    bowlRun(qid, correct, ctx);
    more = more || {};
    document.dispatchEvent(new CustomEvent(EVT, { detail: { qid: qid, lec: lecId, correct: !!correct, ctx: ctx || "bank", choice: (typeof choice === "number" ? choice : null), picks: (Array.isArray(picks) && picks.length ? picks.slice() : null),
      self: kind === "self", order: (kind === "order" && Array.isArray(more.order) ? more.order.slice() : null), session: more.session || (ctx === "arcade" ? arcSession() : null) || null } }));
    RANK.local += xp + (first ? 20 : 0);
    return { xp: xp, met: met, dayBonus: first, mult: mult };
  }
  /* ---------- the bowling egg (phase 4, part D; vault/tasks/done/2026-11-06-redesign-bowling-egg.md) ----------
     A run of first-try right answers, kept on the device across hubs and reloads (sh_bowl_run). An answer counts when it
     is the first to that question on this device today (sh_bowl_today), on a card outside the mock and the arcade: right
     adds one, wrong puts the run at 0, a second try does neither. At 50 and at 100 a strike clip, one of the six; at 150
     the turkey, and the run starts again. The clip plays a moment after the verdict, from widget/bowling.js, fetched
     then (never with the page); it waits behind a rank-up or trophy card. Nothing at all with the eggs off or in Focus
     mode. No XP and nothing on the server (Sam, 2026-11-12). */
  function bowlRun(qid, correct, ctx){
    if (ctx === "mock" || ctx === "arcade" || ls("sh_pref_eggs") === "off" || ls("sh_pref_focus") === "on") return;
    var d = day(0), key = HX.HUB + ":" + qid, t = null;
    try { t = JSON.parse(ls("sh_bowl_today") || "null"); } catch (e) {}
    if (!t || t.d !== d || !Array.isArray(t.q)) t = { d: d, q: [] };
    if (t.q.indexOf(key) > -1) return;
    t.q.push(key); ls("sh_bowl_today", JSON.stringify(t));
    var n = correct ? (parseInt(ls("sh_bowl_run"), 10) || 0) + 1 : 0, turkey = n >= 150, strike = n === 50 || n === 100;
    ls("sh_bowl_run", String(turkey ? 0 : n));
    if (!turkey && !strike) return;
    setTimeout(function(){
      HX.loadScript(HX.WIDGET + "bowling.js").then(function(){
        var B = window.shBowl; if (B) B.play(turkey ? "turkey" : B.STRIKES[Math.floor(Math.random() * B.STRIKES.length)]);
      }, function(){});
    }, reduced ? 400 : 1200);
  }
  /* a flashcard's rating (widget/study-modes.js): not an answer, so nothing here touches your answers, the class's numbers
     or question health. It counts toward today's goal and the streak, and pays a flat 2 for a card that was due or new,
     for a card's first three ratings a day (record_card_v2, migration_v56, which the module sends; its reply comes back
     as sh:card-paid). pays: the card was due or new (not Study ahead). */
  var CPEND = {};
  function recordCard(qid, what, pays, req){
    var t = todayRec(), cq = t.cq || (t.cq = {}), n = cq[qid] || 0, b = boost(), d = day(0);
    var xp = v2() && pays && n < 3 ? 2 * (b ? b.mult || 2 : 1) : 0;   // no game layer on the server: nothing pays a rating
    if (pays) cq[qid] = n + 1;
    t.k = (t.k || 0) + 1; t.xp += xp;
    /* a day you studied, for the streak, as an answer marks it */
    if (HX.ANSWERED) { STATE.activeDates[d] = true; STATE.lastActiveDate = d; } else if (STATE.days.indexOf(d) === -1) STATE.days.push(d);
    var met = false; if (!t.met && doneToday(t) >= goal()) { t.met = 1; met = true; }
    SESSION.k++; if (what === "again") SESSION.again++; SESSION.xp += xp;
    if (req && xp) CPEND[req] = { xp: xp, at: Date.now() };
    RANK.local += xp;
    saveNow();
    return { xp: xp, met: met, dayBonus: false, mult: b ? 2 : 1 };
  }
  /* what the server paid for a rating: the total it holds wins, and a guess it didn't pay comes off today's figure */
  document.addEventListener("sh:card-paid", function(e){
    var d = e.detail || {}, r = d.res; if (!r || r.repeat || !r.ok) return;
    var g = d.req && CPEND[d.req]; if (g) delete CPEND[d.req];
    var off = (r.xp | 0) - (g ? g.xp : r.xp | 0), t = todayRec();
    if (off) { t.xp = Math.max(0, t.xp + off); SESSION.xp = Math.max(0, SESSION.xp + off); saveState(); }
    if (RANK.p && typeof r.total === "number") { RANK.p.xp = Math.max(RANK.p.xp || 0, r.total); RANK.local = pendSum() + Object.keys(CPEND).reduce(function(n, k){ return Date.now() - CPEND[k].at < 20000 ? n + CPEND[k].xp : n; }, 0); }
    if (off || boostShown !== !!boost()) paintMeters();
  });
  /* what the server paid for an answer (widget/v3.js sends it on): the total it holds replaces the page's sum, an
     answer that paid something other than the guess corrects today's figure, and what the page can't know by itself is
     said out loud: the day's 20th answer, a medal with its double XP ("A miss fixed" was taken out, Sam 2026-11-19, migration_v78) */
  var PEND = [], BONUS = { goal20: "20 answers today" }, MEDAL = ["", "Bronze", "Silver", "Gold", "Crown"];
  function pendSum(){ var cut = Date.now() - 20000; PEND = PEND.filter(function(x){ return x.at > cut; }); return PEND.reduce(function(n, x){ return n + x.xp; }, 0); }
  /* a prize's name (widget/v3.js prizeName), for the reward card; an older cached v3.js has only prizeText */
  function prizeName(src, d){
    var G = window.shGame;
    if (G && G.prizeName) return G.prizeName(src, d);
    return G && G.prizeText ? String(G.prizeText(src, 1, d)).split(": +")[0] : "Bonus";
  }
  /* the crowns study XP pays (sh_wallet: 5 for every 10, from the XP before a boost doubles it, counted on the total), shown
     only when that is exact: an even XP before the boost */
  function studyCrowns(xp, mult){
    var b = (xp | 0) / ((mult | 0) || 1);
    return b > 0 && b === Math.floor(b) && b % 2 === 0 ? b / 2 : 0;
  }
  /* the card shows the page's guess at once (widget/hub-bank.js result()); when the server paid something else, the
     newest answered card of that question says what it paid */
  function paidOnCard(qid, was, xp){
    var n = $$(".qcard .qc-result .verdict .xp").filter(function(x){ var c = x.closest(".qcard"); return c && c.getAttribute("data-qid") === qid; }).pop();
    if (n && n.textContent === "+" + was + " XP") n.textContent = "+" + xp + " XP";
  }
  document.addEventListener("sh:answer-paid", function(e){
    var d = e.detail || {}, r = d.res; if (!r || r.repeat) return;
    /* the page's guess for this very answer (a reply can be missing: an answer recorded the old way, or lost offline) */
    var at = -1; PEND.some(function(x, i){ if (x.qid === d.qid) { at = i; return true; } return false; });
    var guess = at > -1 ? PEND.splice(at, 1)[0] : null, t = todayRec(), extra = 0, won = [];
    /* the day's bonuses (study XP, boosted like the answer) and the prizes an answer can win (migration_v68: right in a row,
       a streak of days, the class's record), which pay as many crowns as XP */
    (Array.isArray(r.bonus) ? r.bonus : []).forEach(function(b){
      if (!b || !(b.xp > 0)) return;
      extra += b.xp;
      if (BONUS[b.src]) won.push({ t: BONUS[b.src], xp: b.xp, c: studyCrowns(b.xp, r.mult) });
      else won.push({ t: prizeName(b.src, b), xp: b.xp, c: b.xp, src: b.src });
    });
    var off = (r.xp | 0) - (guess ? guess.xp : r.xp | 0) + extra;
    if (guess && (r.xp | 0) !== guess.xp) paidOnCard(d.qid, guess.xp, r.xp | 0);
    if (off) { t.xp = Math.max(0, t.xp + off); if (d.ctx !== "mock" && d.ctx !== "arcade") SESSION.xp = Math.max(0, SESSION.xp + off); saveState(); }
    if (RANK.p && typeof r.total === "number") { RANK.p.xp = Math.max(RANK.p.xp || 0, r.total); RANK.local = pendSum(); }
    if (r.medal && r.medal.level) {
      /* a medal pays its XP as a prize, and 50 crowns more for the medal itself (sh_wallet) */
      won.unshift({ t: (MEDAL[r.medal.level] || "A") + " medal", xp: r.medal.xp | 0, c: (r.medal.xp | 0) + 50, src: "medal", sub: "And double XP for 24 hours" });
      HX.say("Double XP for a day. Go!", "do-hop");
    }
    if (won.length && d.ctx !== "mock") prizeCard(won);
    if (off || extra || r.medal || boostShown !== !!boost()) paintMeters();
    ringClaim();
  });
  /* ---------- prizes (migration_v68): what the server paid outside an answer ----------
     widget/v3.js sends sh:prize for a prize call's reply (the daily ring, a boss's share, a lecture read, the nuke, a name,
     trophies, a game's prizes): its XP joins today's and the rank's, and it's shown on the reward card. The crowns come as
     sh:crowns. */
  document.addEventListener("sh:prize", function(e){
    var d = e.detail || {}; if (!(d.xp > 0)) return;
    var w = HX.wallet ? HX.wallet() : null; if (d.src === "name" && w && w.got) w.got.name = true;   /* Settings stops offering it */
    todayRec().xp += d.xp; RANK.local += d.xp; saveState();
    if (d.src === "ring") {
      /* the daily ring is today's goal: one card for both, with what it paid (reward() waits for it) */
      ringShown = Date.now();
      if (goalWait) { clearTimeout(goalWait); goalWait = 0; }
      prizeCard([{ t: "Today's goal met", xp: d.xp, c: d.xp, src: "ring" }], { sub: goalSub(), kind: "goal" });
    } else prizeCard([{ t: prizeName(d.src, d.res || {}), xp: d.xp, c: d.xp, src: d.src }]);
    if (d.src === "nuke" || d.src === "boss" || d.src === "top") HX.say(d.src === "nuke" ? "Ten thousand! Go spend it." : "Nice hit!", "do-hop");
    paintMeters();
  });

  /* ---------- the reward card (Sam, 2026-11-18: "i want it to look much cooler and communicate that you just got xp and
     crowns better"): what an answer's bonuses, a prize, today's goal, a finished mock or game and Timmy Time pay comes up
     as a gold card over the bottom of the page, in place of the dark toast: what you did, then the XP and the crowns,
     counting up from 0, with a burst of confetti; the stars and coins then fly to the rank in the bar. A tap closes it.
     Rewards that arrive together (a game's +50, its first-game prize and a new best) make one card with their totals.
     With reduced motion it only fades in and out. The card itself is widget/prize.js (window.shPrize, in hub.bundle.js),
     which the dashboard fetches for its own prizes. ---------- */
  /* still: reduced motion, Answer animations off or Focus mode (hub.js sets hx-still) */
  function calmNow(){ return reduced || document.documentElement.classList.contains("hx-still"); }
  function starSvg(){ return artSvg(A.xp || "", "0 0 24 24", "", ""); }
  function coinSvg(){ return HX.shopCoin ? HX.shopCoin(26) : starSvg(); }
  /* what fills the badge: a streak's flame, else the coin (it paid crowns) or the star */
  function badgeArt(kind, c){
    if (kind === "streak") return flame(Math.max(3, streakDays()), "");
    return c > 0 ? coinSvg() : starSvg();
  }
  var prizeBatch = null, ringShown = 0, goalWait = 0;
  /* the card takes a list of what was won ([{ t, xp, c, src, sub }]) and draws it after a moment, so rewards that come
     from the same reply share one card */
  function prizeCard(lines, opts){
    opts = opts || {};
    if (!prizeBatch) { prizeBatch = { lines: [], opts: opts }; setTimeout(function(){ var b = prizeBatch; prizeBatch = null; whenFree(function(){ drawPrize(b.lines, b.opts); }); }, 260); }
    else if (opts.sub || opts.kind) prizeBatch.opts = opts;
    Array.prototype.push.apply(prizeBatch.lines, lines);
  }
  /* a card waits while a mock exam is being taken (its Submit button is up), as the rank-up and trophy cards do */
  function whenFree(run, tries){
    if (document.querySelector(".mock-bar [data-submit]") && (tries | 0) < 900) { setTimeout(function(){ whenFree(run, (tries | 0) + 1); }, 2000); return; }
    run();
  }
  function drawPrize(lines, opts){
    var toasts = $("#hxToast"); if (!lines.length || !toasts || !window.shPrize) return;
    window.shPrize.show(lines, opts, { star: starSvg, coin: coinSvg, badge: badgeArt, calm: calmNow, after: toasts,
      target: function(){ return [$("#hxRank"), $("#hxXp")].filter(visible)[0]; } });
  }
  /* today's goal, as the goal card says it: "20 questions · 8 days in a row" */
  function goalSub(){ var n = streakDays(), what = todayRec().k ? " questions and flashcards" : " questions"; return goal() + what + (n > 1 ? " · " + pl(n, "day") + " in a row" : ""); }
  /* is the daily ring's prize on its way (the game layer is there and it hasn't paid today)? */
  function ringDue(){ var G = window.shGame; return v2() && !!(G && G.claim) && ls("sh_ring_" + HX.HUB) !== day(0); }
  /* the daily ring (your goal of 10 to 50 a day, Settings): filled, the server pays 5 XP and crowns a question of it, once
     per hub a day, after checking the day's answers there. Asked after an answer's reply, so that answer is counted. */
  var ringAsked = "";
  function ringClaim(){
    var G = window.shGame, t = todayRec(), d = day(0), key = "sh_ring_" + HX.HUB;
    if (!v2() || !G || !G.claim || !t.met || ringAsked === d || ls(key) === d) return;
    ringAsked = d;
    G.claim("claim_ring_v2", { p_visitor: ls("sh_visitor_id"), p_hub: HX.HUB, p_goal: goal() }, "ring").then(function(r){
      if (r && r.ok && (r.xp > 0 || r.repeat) && r.why !== "short") ls(key, d);
      else ringAsked = "";   /* the server counted fewer (another device's answers still on their way): ask after the next */
    });
  }
  /* ---------- the evening outage of 2026-11-18 (migration_v73; vault/tasks/2026-11-18-database-load.md) ----------
     From about 1:35 to 3:05 pm Central that Wednesday most answers didn't reach the database. This page kept the day's
     answers, right answers and XP (STATE.nx.days), so once, on a visit before 11-22, it sends those numbers and the server
     pays what the missing ones would have (restore_outage_v2: only for someone studying in this hub then, within the answer
     rules), with the ring and the day for the streak. Asked a few seconds after the page opens, never while the database is
     struggling (window.shDb), and again on the next visit if it couldn't be asked. */
  var OUTAGE = "2026-11-18";
  function restoreOutage(tries){
    var G = window.shGame, t = STATE.nx && STATE.nx.days ? STATE.nx.days[OUTAGE] : null, key = "sh_restore_" + OUTAGE + "_" + HX.HUB;
    if (!t || !(t.n > 0) || ls(key) || Date.now() > Date.parse("2026-11-22T06:00:00Z")) return;
    if (!v2() || !G || !G.ask || (window.shDb && window.shDb.busy())) { if (tries < 6) setTimeout(function(){ restoreOutage(tries + 1); }, 20000); return; }
    G.ask("restore_outage_v2", { p_visitor: ls("sh_visitor_id"), p_hub: HX.HUB, p_n: t.n | 0, p_r: t.r | 0, p_xp: Math.max(0, Math.round(t.xp || 0)),
      p_goal: goal(), p_met: !!t.met }).then(function(r){
      if (!r || typeof r !== "object" || (r.ok === false && r.error !== "closed")) return;   /* not asked: the next visit asks */
      ls(key, "1");
      if (!(r.ok && r.xp > 0)) return;
      var a = r.answers | 0, c = (r.xp | 0) - a + Math.floor(a / 2);   /* answer XP pays a crown for 2 XP; the ring and streak prizes one for one */
      if (G.setCrowns) G.setCrowns(r.crowns);
      RANK.local += r.xp; saveState();
      prizeCard([{ t: "Saved from Wednesday's outage", xp: r.xp, c: c, src: "restore",
        sub: r.n + (r.n === 1 ? " answer" : " answers") + " that didn't save on Wednesday afternoon" }]);
      paintMeters();
    });
  }
  setTimeout(function(){ restoreOutage(0); }, 6000);
  /* the crowns after a reply (sh:crowns from widget/v3.js): the shop's wallet takes them (widget/hub-timmy.js), and a gain
     pops up a coin by the rank pill, so they're seen going up while you answer */
  document.addEventListener("sh:crowns", function(e){
    /* the balance before: the shop's wallet, or (no shop: its bootstrap timed out) the last reply's, which v3.js sends */
    var d = e.detail || {}, was = HX.hasShop && HX.hasShop() && HX.wallet ? HX.wallet() : null, before = was ? was.balance : d.was;
    if (HX.setWallet) HX.setWallet(d.balance);
    if (typeof before === "number" && d.balance > before) {
      crownPop(d.balance - before);
      /* the crowns earned today on this page, for the Today card's crowns tile */
      var t = todayRec(); t.c = (t.c || 0) + (d.balance - before); saveState();
    }
    paintMeters();
  });
  function crownPop(n){
    var to = [$("#hxRank"), $("#hxXp")].filter(visible)[0];
    if (!to || reduced || !HX.shopCoin) return;
    var b = to.getBoundingClientRect(), el = h('<span class="crownpop" aria-hidden="true">' + HX.shopCoin(18) + "+" + fmt(n) + "</span>");
    document.body.appendChild(el);
    var x = b.left + b.width / 2 - el.offsetWidth / 2, y = b.bottom + 6;
    var anim = el.animate([
      { transform: "translate(" + x + "px," + y + "px) scale(.6)", opacity: 0 },
      { transform: "translate(" + x + "px," + (y + 4) + "px) scale(1.08)", opacity: 1, offset: .2 },
      { transform: "translate(" + x + "px," + (y + 6) + "px) scale(1)", opacity: 1, offset: .75 },
      { transform: "translate(" + x + "px," + (y + 16) + "px) scale(.9)", opacity: 0 }
    ], { duration: 1600, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    anim.onfinish = function(){ el.remove(); };
  }
  /* a finished mock's +50 (the server pays it once per hub per day, with 10 or more answers), and a finished arcade
     game's (each game once a day, 20 seconds or more after it started; widget/games.js knows which sessions are games) */
  document.addEventListener("sh:session-paid", function(e){
    var d = e.detail || {}, r = d.res; if (!r || !(r.xp > 0)) return;
    var G = window.shGames, run = G && G.ran ? G.ran(d.session) : null;
    /* a game's finish held in a busy minute and sent by a later page (widget/v3.js, sessionHold) comes with its kind and
       game, but that page never ran it */
    var arc = !!run || d.kind === "arcade", gid = run ? run.game : arc ? d.game : null;
    /* the game's name as this page's lobby shows it (SH_HUB.arcade.games), not the live hub's skin ("THE YELLOW BODY") */
    var mine = gid ? (((HX.C || {}).arcade || {}).games || []).filter(function(g){ return g.id === gid; })[0] : null;
    todayRec().xp += r.xp; RANK.local += r.xp; saveState();
    /* study XP: 5 crowns for every 10 before a boost (the reply says the multiplier) */
    prizeCard([{ t: (arc ? (mine && mine.name) || (run && run.name) || "Arcade game" : "Mock exam") + " finished", xp: r.xp, c: studyCrowns(r.xp, r.mult), src: arc ? "arcade" : "mock" }]);
    paintMeters();
  });
  /* Timmy Time (widget/podcast.js): what a minute heard paid (10, or nothing: heard before, too soon, a boost doubles it)
     and the +100 for finishing the episode, as the server counted them. The pill takes them at once; finishing is said. */
  document.addEventListener("sh:pod-paid", function(e){
    var r = (e.detail || {}).res; if (!r || r.ok === false || r.repeat) return;
    var G = window.shGame; if (G && G.setCrowns) G.setCrowns(r.crowns);
    var x = (r.xp | 0) + (r.done | 0); if (!(x > 0)) return;
    todayRec().xp += x; RANK.local += x; saveState();
    if (r.done > 0) prizeCard([{ t: prizeName("pod-done", {}), xp: r.done, c: r.done, src: "pod-done" }]);
    paintMeters();
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
    return '<span class="xboost"><i aria-hidden="true">2x</i><span class="sr">Double XP. </span><span class="xb-t">' + left(ms) + '<span class="sr"> left. </span></span></span>';
  }
  document.addEventListener("sh:rank-profile", function(e){
    var d = e.detail || {}; if (!d.profile) return;
    RANK.p = d.profile; RANK.local = 0; PEND = []; RANK.mastery = d.mastery || null;
    if (d.profile.boost !== undefined && window.shGame && window.shGame.setBoost) window.shGame.setBoost(d.profile.boost);
    paintMeters();
    HX.petFromBadges(d.profile.badges || []);
  });
  /* The rank pill gives way when the bar has no room for it (a long hub name, a six-digit XP, a narrow laptop): it
     drops its name first, then its number, down to the medallion alone. Both stay in its spoken name. If the bar is
     still too wide (a hub name as long as "Heme & Endo Exam 3" between 1,101 and about 1,200 px, BUG-083), the hub's
     name folds to its emblem, still read out, and the pill gets its number back when there's room for it again.
     Past that (a larger text size on a laptop: the setting zooms the page, which hub.css's 1,100 px breakpoint can't
     see), the meters move to the strip under the bar, as they do on a tablet. Checked on every paint, when the window
     changes size, when the live count changes and when the fonts arrive. The strip itself is only switched once the
     answer is known (it is below the bar, so the bar measures the same without it), so the page never jumps. */
  function fitPill(){
    var rk = $("#hxRank"), bar = $("#hxBar"), hx = HX.shell; if (!rk || !bar || !hx) return;
    var over = function(){ return bar.scrollWidth > bar.clientWidth + 1; }, strip = false;
    rk.classList.remove("is-tight", "is-tighter"); bar.classList.remove("is-cramped", "no-meters");
    if (visible(rk) && over()) {
      rk.classList.add("is-tight");
      if (over()) rk.classList.add("is-tighter");
      if (over()) { bar.classList.add("is-cramped"); rk.classList.remove("is-tighter"); if (over()) rk.classList.add("is-tighter"); }
      if (over()) { bar.classList.add("no-meters"); strip = true; }
    }
    if (hx.classList.contains("is-strip") !== strip) hx.classList.toggle("is-strip", strip);
  }
  var fitAsked = false;
  function fitSoon(){ if (fitAsked) return; fitAsked = true; requestAnimationFrame(function(){ fitAsked = false; fitPill(); }); }
  window.addEventListener("resize", fitSoon);
  document.addEventListener("sh:online", fitSoon);   /* hub.js repaints the live count first; this measures after it */
  try { document.fonts.ready.then(fitSoon); } catch (e) {}
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
    var dn = doneToday(t), what = t.k ? " questions and flashcards today" : " questions today";
    $$("[data-goalm]").forEach(function(m){ m.innerHTML = ring(dn, g) + '<span class="num" aria-hidden="true">' + Math.min(dn, 999) + '<span class="fold"> of </span><span class="unfold">/</span>' + g + '</span><span class="sr">' + Math.min(dn, 999) + " of " + g + what + "</span>"; });
    var x = rankXp(), rk = $("#hxRank"), chip = boostChip();
    /* past the Handpiece the name starts with the journey ("ModuPro Gold II"); a tight bar shows the medallion and
       "Gold II" and keeps the journey for screen readers (hub.css) */
    var nm = rankName(), R = window.shRanks, jn = RANK.p && RANK.p.journey > 0 && R && R.JOURNEYS ? (R.JOURNEYS[RANK.p.journey | 0] || "") + " " : "";
    var nameHTML = jn.length > 1 && nm.indexOf(jn) === 0 ? '<span class="jn">' + esc(jn) + "</span>" + esc(nm.slice(jn.length)) : esc(nm);
    /* its spoken name is its visible text with a few hidden words around it (axe: the label must contain what's shown) */
    if (rk) rk.innerHTML = '<span class="hp" aria-hidden="true">' + rankArt() + '</span><span class="sr">Your rank: </span><b>' + nameHTML + '</b><span class="sr">, </span><span class="xpn num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + "</span> XP" + (x === null ? " today" : "") + '</span><span class="sr">. </span>' + chip + '<span class="sr">Open your stats</span>';
    $$("[data-xpm]").forEach(function(m){ m.innerHTML = artSvg(A.xp || "", "0 0 24 24", "xpi") + '<span class="num"><span data-xp>' + (x === null ? "+" + fmt(t.xp) : fmt(x)) + '</span><span class="fold-xp"> XP</span></span>' + (boostShown ? '<i class="x2" aria-hidden="true">2x</i><span class="sr">Double XP is on</span>' : ""); });
    $$("[data-today]").forEach(function(p){ p.outerHTML = todayPanel(); });
    fitSoon();   /* measured before the next frame, once however many paints come first (each one laid the page out, 2026-11-20) */
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
    if (right !== null) HX.timmyReact(right);
    setTimeout(function(){
      paintMeters();
      if (rec.met) {
        var what = todayRec().k ? "" : " questions";
        $$("[data-streakm] .flame").forEach(function(f){ f.classList.add("grow-in"); });
        HX.say("Goal met! " + goal() + (what || " today") + (what ? " today." : "."), "do-hop");
        /* the reward card: when the daily ring's prize is on its way, it waits for it (up to 5 seconds) so the card says
           what the goal paid; a card the ring already brought isn't drawn twice */
        var plain = function(){ goalWait = 0; if (Date.now() - ringShown > 8000) prizeCard([{ t: "Today's goal met", xp: 0, c: 0, src: "goal" }], { sub: goalSub(), kind: "goal" }); };
        if (ringDue()) { if (goalWait) clearTimeout(goalWait); goalWait = setTimeout(plain, 5000); }
        else plain();
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
    var t = todayRec(), g = goal(), n = streakDays(), dn = doneToday(t), left = Math.max(0, g - dn), hp = HX.petHp(), T = AH.tint || { ink: "#6B5A68", light: "#ECE6EA" }, w = HX.wallet ? HX.wallet() : null;
    var cap = dn >= g ? "Goal met for today." : left === g ? "Your goal today: " + g + " questions or flashcards. One keeps your streak going." : left + " more meets today's goal.";
    /* what filling the ring pays (migration_v68): 5 XP and crowns a question of the goal */
    var G = window.shGame, ringPay = G && G.live && G.live() && G.prizes ? G.prizes.ring * g : 0;
    if (ringPay) cap += dn >= g ? " +" + fmt(ringPay) + " XP and " + fmt(ringPay) + " crowns." : " Fill the ring for +" + fmt(ringPay) + " XP and " + fmt(ringPay) + " crowns.";
    return '<div class="panel today" data-today><div class="today-head"><div><h2>Today</h2><p class="today-date">' + esc(dateLabel(day(0), { weekday: "long", month: "long", day: "numeric" })) + "</p></div>" +
        spot("today", { tint: T.ink, light: T.light, line: T.ink }, "today-art") + "</div>" +
      '<div class="big-ring"><div class="teeth-wrap">' + teethRing(dn, g) + '<p class="ring-num"><b class="num">' + fmt(dn) + '</b><span>of ' + g + '</span><span class="sr">' + (t.k ? " questions and flashcards today" : " questions today") + '</span></p></div><p class="ring-cap">' + esc(cap) + "</p></div>" +
      '<ul class="today-stats">' +
        '<li class="ts-flame">' + flame(n, "ts-art") + '<span><b class="num">' + (n ? pl(n, "day") : "Not yet") + "</b><small>Streak</small></span></li>" +
        '<li class="ts-xp">' + artSvg(A.xp, "0 0 24 24", "ts-art", "") + '<span><b class="num">+' + fmt(t.xp) + "</b><small>XP today</small></span></li>" +
        '<li class="ts-right">' + icon("check", 26) + '<span><b class="num">' + fmt(t.r || 0) + " of " + fmt(t.n) + "</b><small>Right today</small></span></li>" +
        (t.k ? '<li class="ts-cards">' + icon("cards", 26) + '<span><b class="num">' + fmt(t.k) + "</b><small>" + (t.k === 1 ? "Flashcard" : "Flashcards") + " today</small></span></li>" : "") +
        /* the Shiny Gold Crowns you have (Sam, 2026-11-17), from the page's bootstrap, the shop's replies and every paying
           reply (migration_v68), and what this page saw you earn today: a tap opens the shop */
        (w ? '<li class="ts-crowns"><a href="#more/shop"' + (w.earned ? ' title="' + fmt(w.earned) + ' Shiny Gold Crowns earned in all"' : "") + ">" + HX.shopCoin(30) + '<span><b class="num">' + fmt(w.balance) + "</b><small>" + (w.balance === 1 ? "Gold crown" : "Gold crowns") + '<span class="sr"> to spend in Timmy’s shop</span></small>' +
          (t.c > 0 ? '<small class="ts-plus">+' + fmt(t.c) + " today</small>" : "") + "</span></a></li>" : "") +
      "</ul>" +
      (hp !== null ? '<p class="today-pet">' + icon("tooth", 18) + "<span>Timmy has <b class=\"num\">" + hp + " HP</b></span></p>" : "") + "</div>";
  }
  /* the session recap: when you leave the questions with 5 or more answered since the last one (Sam, 2026-11-06: never
     mid-practice) */
  function recapDue(){ var n = SESSION.n - SESSION.since, k = SESSION.k - SESSION.kSince; return n + k >= 5 ? { n: n, r: SESSION.r - (SESSION.rAt || 0), xp: SESSION.xp - (SESSION.xpAt || 0), miss: Object.assign({}, SESSION.miss), k: k, again: SESSION.again - SESSION.againAt } : null; }
  function markRecap(){ SESSION.since = SESSION.n; SESSION.rAt = SESSION.r; SESSION.xpAt = SESSION.xp; SESSION.miss = {}; SESSION.kSince = SESSION.k; SESSION.againAt = SESSION.again; }
  function recapHTML(d){
    var hp = HX.petHp(), hpd = hp !== null && SESSION.hp0 !== null ? hp - SESSION.hp0 : null, n = streakDays();
    var next = Object.keys(d.miss).sort(function(a, b){ return d.miss[b] - d.miss[a]; }).slice(0, 2);
    var k = d.k || 0, head = d.n && k ? pl(d.n, "question") + " and " + pl(k, "flashcard") : k ? pl(k, "flashcard") : pl(d.n, "question");
    return '<section class="recap enter" aria-label="Session recap"><h2>That was ' + head + "</h2><div class=\"figs\">" +
      (d.n ? '<div><b class="num" data-count="' + d.r + '">' + d.r + "</b><span>right of " + d.n + "</span></div>" : "") +
      (k ? '<div><b class="num" data-count="' + k + '">' + k + "</b><span>" + (k === 1 ? "card" : "cards") + " rated, " + (d.again || 0) + " Again</span></div>" : "") +
      '<div><b class="num" data-count="' + d.xp + '" data-plus>+' + d.xp + "</b><span>XP this session</span></div>" +
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
  HX.achievements = achievements; HX.recordAnswer = recordAnswer; HX.recordCard = recordCard; HX.doneToday = doneToday; HX.RANK = RANK; HX.rankName = rankName;
  HX.rankXp = rankXp; HX.rankArt = rankArt; HX.gameOn = v2; HX.boost = boost; HX.paintMeters = paintMeters; HX.reward = reward; HX.todayPanel = todayPanel;
  HX.recapDue = recapDue; HX.showLeftRecap = showLeftRecap;
};
