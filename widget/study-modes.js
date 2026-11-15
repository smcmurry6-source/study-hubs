/* ============ THE HUB ENGINE, on first use: Learn and Flashcards (widget/study-modes.js + study-modes.css) ============
   The Question Bank's "Study as" toggle (widget/hub-bank.js, viewHTML and study()) picks how the questions the filter
   panel chose are studied: as questions (the bank's own cards), in Learn (rounds of 7 until each is mastered, like
   Quizlet's Learn) or as Flashcards (flip and rate, scheduled to come back, like Anki). This file is fetched the first
   time Learn or Flashcards is opened, never with the page. What was decided and why:
   vault/tasks/2026-11-06-redesign-learn-and-flashcards.md; the server: migration_v56.sql and
   vault/reference/game-server.md ("Learn and Flashcards").

   - Learn's answers are answers: the bank's card (HX.card, ctx "learn"), so they count everywhere a bank answer does.
     Each question's step is kept here (STATE.learn.q[id]: 0 being learned, 1 right once, 2 mastered).
   - A flashcard's rating is not an answer: it never reaches the class's numbers, your answers or question health. The
     schedule is STATE.cards[id] (d due, i interval in days, e ease, k Goods in a row while learning, l lapses, s state:
     L learning, R review, X relearning), worked out by sched() below, Anki's steps squeezed to fit a hub's week and never
     past exam eve.
   - Every rating and Learn step also goes to the server (record_card_v2, reset_my_learn), queued in STATE.cardq until it
     arrives, and the first time this opens on a page load, get_my_cards brings the rows from your other devices and the
     same sched() replays them. Until the database has migration_v56 (the redesign's release), it all stays on the device.
   - Both run as a session over the whole screen (Sam, 2026-11-13: "more like it does on quizlet"): the bank keeps a
     launcher (what's picked, how far along, Start), and Start opens a layer with its own top row (Close, how far along,
     today's goal and XP), one card at a time in the middle. Escape or Close goes back to the bank.
   Every button here carries a fixed data-sm name, so click counts never record a question's words. ============ */
(function(){
  "use strict";
  window.SH_STUDY = function(HX){
    var $ = HX.$, $$ = HX.$$, esc = HX.esc, h = HX.h, pl = HX.pl, fmt = HX.fmt, icon = HX.icon, track = HX.track, ls = HX.ls,
      STATE = HX.STATE, saveState = HX.saveState, saveNow = HX.saveNow, QBY = HX.QBY, lc = HX.lc, lecChip = HX.lecChip,
      shuffled = HX.shuffled, ymd = HX.ymd, reduced = HX.reduced, HUB = HX.HUB, P = HX.qParts;
    var MIN = 60000, HOUR = 3600000, DAY = 86400000;

    /* ======================= time: Central study days, starting at 4 am ======================= */
    var CT = null;
    try { CT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }); } catch (e) { CT = null; }
    function ctParts(t){
      if (!CT) { var d = new Date(t - 6 * HOUR); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours() }; }
      var o = {}; CT.formatToParts(new Date(t)).forEach(function(p){ o[p.type] = p.value; });
      return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24 };
    }
    /* 4:00 am Central on the calendar day y-m-d (the clocks change at 2 am, so 4 am is always on the hour) */
    function fourAm(y, m, d){
      var g = Date.UTC(y, m - 1, d, 10);   // 4 am CST
      return g - (ctParts(g).h - 4) * HOUR;  // an hour earlier in CDT
    }
    /* the study day t falls in (it runs 4 am to 4 am, so a 1 am session is still the night before), as a day number */
    function dayNo(t){ var p = ctParts(t - 4 * HOUR); return Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY); }
    /* the start of the study day n days after the one t falls in */
    function dayStart(t, n){ var p = ctParts(t - 4 * HOUR), u = new Date(Date.UTC(p.y, p.m - 1, p.d + (n || 0))); return fourAm(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate()); }
    /* exam eve: the start of the day before the exam (Sam, 2026-11-06: every rated card comes back then); no exam date, no cap */
    function eve(){
      var E = HX.EXAM; if (!E || !E.date) return 0;
      var p = String(E.date).split("-").map(Number); if (p.length !== 3) return 0;
      var u = new Date(Date.UTC(p[0], p[1] - 1, p[2] - 1));
      return fourAm(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate());
    }

    /* ======================= the schedule (Anki's, squeezed to fit the hub) =======================
       New or being learned: Again 1 min, Hard 6 min, Good 10 min (the second Good in a row: tomorrow), Easy tomorrow.
       In review every n days: Again 10 min and ease -0.2 (back to being learned), Hard n x 1.2 and ease -0.15, Good n x
       ease, Easy n x ease x 1.3 and ease +0.15. New cards start at ease 2.5, never below 1.3. A next date after exam eve
       becomes exam eve. Pure: the replay of another device's ratings runs the same steps. */
    function sched(c0, r, t){
      var c = c0 ? { d: c0.d, i: c0.i || 0, e: c0.e || 2.5, k: c0.k || 0, l: c0.l || 0, s: c0.s || "L", n: c0.n || 0 } : { d: 0, i: 0, e: 2.5, k: 0, l: 0, s: "L", n: 0 };
      var due;
      if (c.s === "R") {
        var n = Math.max(1, c.i || 1), ni;
        if (r === "again") { c.e = Math.max(1.3, c.e - 0.2); c.l++; c.s = "X"; c.k = 0; due = t + 10 * MIN; }
        else {
          if (r === "hard") { ni = Math.max(1, Math.round(n * 1.2)); c.e = Math.max(1.3, c.e - 0.15); }
          else if (r === "good") ni = Math.max(n + 1, Math.round(n * c.e));
          else { ni = Math.max(n + 2, Math.round(n * c.e * 1.3)); c.e = c.e + 0.15; }
          c.i = ni; due = dayStart(t, ni);
        }
      } else {
        if (r === "again") { c.k = 0; due = t + MIN; }
        else if (r === "hard") due = t + 6 * MIN;
        else if (r === "good" && c.k < 1) { c.k = 1; due = t + 10 * MIN; }
        else { c.s = "R"; c.k = 0; c.i = 1; due = dayStart(t, 1); }
      }
      var ev = eve(); if (ev && t < ev && due > ev) due = ev;
      c.e = Math.round(c.e * 100) / 100; c.d = due; c.n++;
      return c;
    }
    /* when a rating would bring the card back, in words */
    function inWords(due, t){
      var m = Math.round((due - t) / MIN);
      if (m < 60) return Math.max(1, m) + " min";
      var dd = dayNo(due) - dayNo(t);
      if (dd <= 0) return m < 120 ? "1 hr" : Math.round(m / 60) + " hr";
      return dd === 1 ? "Tomorrow" : "In " + dd + " days";
    }
    function clock(t){ return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase(); }

    /* ======================= what's saved, and the server ======================= */
    function cards(){ var c = STATE.cards; if (!c || typeof c !== "object" || Array.isArray(c)) c = STATE.cards = {}; return c; }
    function learnStore(){ var l = STATE.learn; if (!l || typeof l !== "object" || !l.q) l = STATE.learn = { r: 0, q: {} }; return l; }
    function queue(){ if (!Array.isArray(STATE.cardq)) STATE.cardq = []; return STATE.cardq; }
    function reqId(){ var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", s = "sm"; for (var i = 0; i < 18; i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; }
    /* automated browsers (the tests) send and fetch nothing, as widget/v3.js does; the preview's runtime says it isn't one */
    function automated(){ try { return !!navigator.webdriver; } catch (e) { return false; } }
    function missing(res){ var e = res && res.error; return !!e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(String(e.message || ""))); }
    var SRV = null, sending = false, pulled = false;
    /* one event: [qid, what, when (ms), ahead (1/0), request id] or, for Start over, ["*", "learn-reset", when, 0, null, [qids]] */
    function enqueue(ev){ var Q = queue(); Q.push(ev); if (Q.length > 3000) Q.splice(0, Q.length - 3000); saveNow(); flush(); }
    function flush(){
      if (sending || SRV === false || automated()) return;
      var Q = queue(), S = window.shSupabase, v = ls("sh_visitor_id");
      if (!Q.length || !S || !v) return;
      var ev = Q[0]; sending = true;
      var call;
      try {
        call = ev[1] === "learn-reset" ? S.rpc("reset_my_learn", { p_visitor: v, p_hub: HUB, p_qids: ev[5], p_seen: ev[2] })
          : S.rpc("record_card_v2", { p_visitor: v, p_hub: HUB, p_qid: ev[0], p_what: ev[1], p_ahead: !!ev[3], p_request: ev[4], p_seen: ev[2] });
      } catch (e) { sending = false; return; }
      call.then(function(res){
        sending = false;
        if (missing(res)) { SRV = false; return; }
        if (!res || res.error) return;   // try again with the next rating, or the next time this opens
        var i = queue().indexOf(ev); if (i > -1) queue().splice(i, 1);
        saveState();
        var r = res.data;
        if (r && typeof r === "object" && r.ok) document.dispatchEvent(new CustomEvent("sh:card-paid", { detail: { qid: ev[0], req: ev[4], res: r } }));
        flush();
      }, function(){ sending = false; });
    }
    /* your rows from every device, replayed with sched(): the schedule and Learn's steps, rebuilt */
    function pull(done){
      if (pulled || automated()) { done(false); return; }
      HX.whenWidget("shSupabase", function(S){
        var v = ls("sh_visitor_id");
        if (!S || !v) { done(false); return; }
        try {
          S.rpc("get_my_cards", { p_visitor: v, p_hub: HUB }).then(function(res){
            if (missing(res)) { SRV = false; done(false); return; }
            if (!res || res.error || !Array.isArray(res.data)) { done(false); return; }
            pulled = true; SRV = true;
            var changed = rebuild(res.data); flush(); done(changed);
          }, function(){ done(false); });
        } catch (e) { done(false); }
      });
    }
    function rebuild(rows){
      var known = {}, evs = [];
      rows.forEach(function(r){ if (!Array.isArray(r) || !r[0]) return; if (r[4]) known[r[4]] = 1; evs.push({ q: String(r[0]), w: String(r[1]), t: +r[2] || 0, a: !!r[3] }); });
      queue().forEach(function(e){
        if (e[1] === "learn-reset") (e[5] || []).forEach(function(id){ evs.push({ q: id, w: "learn-reset", t: e[2] }); });
        else if (!e[4] || !known[e[4]]) evs.push({ q: e[0], w: e[1], t: e[2], a: !!e[3] });
      });
      evs.sort(function(a, b){ return a.t - b.t; });
      var C = {}, L = {}, days = {};
      evs.forEach(function(e){
        if (e.w.indexOf("learn-") === 0) { if (e.w === "learn-reset") delete L[e.q]; else L[e.q] = Math.max(0, Math.min(2, +e.w.slice(6) || 0)); return; }
        if (["again", "hard", "good", "easy"].indexOf(e.w) < 0) return;
        C[e.q] = sched(C[e.q], e.w, e.t);
        days[ymd(new Date(e.t))] = 1;
      });
      var before = JSON.stringify([cards(), learnStore().q]);
      STATE.cards = C; learnStore().q = L;
      /* a day with only flashcards counts toward the streak on every device (Sam, 2026-11-12) */
      Object.keys(days).forEach(function(d){
        if (HX.ANSWERED) { if (STATE.activeDates && !STATE.activeDates[d]) STATE.activeDates[d] = true; }
        else if (Array.isArray(STATE.days) && STATE.days.indexOf(d) === -1) STATE.days.push(d);
      });
      saveState();
      return before !== JSON.stringify([C, L]);
    }

    /* ======================= the parts both use ======================= */
    /* questions that can be recalled without their choices: one-answer questions whose stem doesn't lean on them (no
       "which of the following", EXCEPT, NOT, true/false, statements...). The rest show their choices (Flashcards) and
       need two rights in different rounds (Learn). */
    var LEANS = /\b(which|the following|following|except|not|least|true|false|statements?|above|below|these|those|all of|none of|best describes?|correct|incorrect|both|neither)\b/i;
    function hideable(q){ return q.type === "mcq" && ["tf", "2stmt", "numbered", "which", "whichf", "except"].indexOf(q.fmt) < 0 && !LEANS.test(String(q.stem || "")); }
    function inBankOrder(items){
      var pos = {}, seen = {}; HX.LECS.forEach(function(l, i){ pos[l.id] = i; });
      return items.filter(function(q){ if (!q || seen[q.id]) return false; seen[q.id] = 1; return true; })
        .map(function(q, i){ return [q, i]; }).sort(function(a, b){ return (pos[a[0].lec] - pos[b[0].lec]) || (a[1] - b[1]); }).map(function(x){ return x[0]; });
    }
    function sumline(L, html){
      var q = $(".qsum", L.el); if (!q) return;
      var s = $(".sumline", q); if (!s) { s = h('<p class="sumline"></p>'); q.insertBefore(s, q.firstChild); }
      s.innerHTML = html;
    }
    function setName(L){ var S = { drill: "Daily drill", misses: "Yesterday's misses", weak: "Weak spots" }; return S[L.preset] || ""; }
    function countUp(root){
      $$("[data-count]", root).forEach(function(n){ var to = +n.getAttribute("data-count"); if (reduced || !to) return; var t0 = performance.now();
        (function step(t){ var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); n.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); })(t0); });
    }
    function emptyHTML(t, p, act){ return P.emptyHTML(t, p, act); }

    /* ======================= the session: a layer over the hub ======================= */
    var FOCUS = null;
    function openFocus(kind, title, onClose){
      if (FOCUS) FOCUS.close(true);
      var shell = document.querySelector(".hx") || document.body;
      var root = h('<div class="sm sm-focus sm-' + kind + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<header class="sm-top"><button class="sm-x" type="button" data-sm="exit" aria-label="Close ' + esc(title) + '">' + icon("cross", 20) + "</button>" +
        '<div class="sm-topmid" data-smtop></div>' +
        '<div class="sm-topr"><span class="hx-meter" data-goalm></span><span class="hx-meter" id="smXp" data-xpm></span></div></header>' +
        '<div class="sm-body" data-smbody><div class="sm-col" data-smcol></div></div></div>');
      shell.appendChild(root);
      document.documentElement.classList.add("sm-open");
      var F = { root: root, top: $("[data-smtop]", root), body: $("[data-smbody]", root), col: $("[data-smcol]", root), kind: kind, closed: false, onKey: null };
      function inside(){ var a = document.activeElement; return !a || a === document.body || root.contains(a); }
      function key(e){
        if (F.closed || document.querySelector("dialog[open]") || !inside()) return;
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); F.close(); return; }
        if (e.key === "Tab") {   // Tab stays in the session
          var f = $$("a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex='-1'])", root).filter(function(n){ return n.offsetParent !== null; });
          if (!f.length) return;
          var a = document.activeElement, first = f[0], lastEl = f[f.length - 1];
          if (e.shiftKey && (a === first || !root.contains(a))) { e.preventDefault(); lastEl.focus(); }
          else if (!e.shiftKey && (a === lastEl || !root.contains(a))) { e.preventDefault(); first.focus(); }
          return;
        }
        if (F.onKey) F.onKey(e);
      }
      function moved(){ F.close(true); }
      F.close = function(quiet){
        if (F.closed) return; F.closed = true;
        document.removeEventListener("keydown", key, true); window.removeEventListener("hashchange", moved);
        document.documentElement.classList.remove("sm-open");
        if (FOCUS === F) FOCUS = null;
        if (reduced || quiet) root.remove(); else { root.classList.add("is-leaving"); setTimeout(function(){ root.remove(); }, 200); }
        if (F.onClose) F.onClose();
        if (onClose) onClose(!!quiet);
      };
      document.addEventListener("keydown", key, true); window.addEventListener("hashchange", moved);
      $("[data-sm=exit]", root).addEventListener("click", function(){ F.close(); });
      if (HX.paintMeters) { try { HX.paintMeters(); } catch (e) {} }
      FOCUS = F; return F;
    }
    /* the launcher's button, and what the bank does when the session closes: the launcher again, with the numbers as they are now */
    function launch(L, kind, title, html, run, draw){
      L.host.innerHTML = '<section class="panel sm sm-launch sm-launch-' + kind + '" aria-label="' + esc(title) + '">' + html + "</section>";
      var b = $("[data-sm=start]", L.host);
      if (b) b.addEventListener("click", function(){
        track(kind + ":start");
        var F = openFocus(kind, title, function(quiet){
          if (!L.host.isConnected) return;
          draw();
          if (!quiet) { var again = $("[data-sm=start]", L.host) || $("[data-sm]", L.host); if (again) again.focus({ preventScroll: true }); }
        });
        run(F);
      });
    }

    /* ======================= Learn ======================= */
    /* what makes it feel good (Sam, 2026-11-12: "similar progress bar filling animations and such so it is very
       satisfying to use like quizlet"): the overall bar is drawn once and its fills grow (a shine runs along it when a
       question is mastered), its numbers count to their new value, the round's track fills a step per answer, a right
       answer gets a word of praise and a streak, Mastered pops, the round's end fills the bar from where the round began
       and lists what you did, and all mastered ends in a burst. With motion off, only the end states. */
    var PRAISE = ["Nice!", "You got it", "Right on", "Nailed it", "Exactly", "That's it", "Well done", "Spot on"];
    function tween(el, from, to, suffix){
      if (!el) return; suffix = suffix || "";
      if (reduced || from === to || !isFinite(from)) { el.textContent = fmt(to) + suffix; return; }
      var t0 = performance.now(), my = el.__tw = {};
      (function step(t){ if (el.__tw !== my) return; var k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(from + (to - from) * e)) + suffix; if (k < 1) requestAnimationFrame(step); })(t0);
    }
    function replay(el, cls){ if (!el || reduced) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    function burstHTML(n, big){
      var out = '<span class="sm-burst' + (big ? " is-big" : "") + '" aria-hidden="true">';
      for (var i = 0; i < n; i++) out += '<i style="--a:' + Math.round(i * 360 / n + (i % 2 ? 9 : -9)) + "deg;--d:" + (big ? 70 + (i * 37 % 60) : 26 + (i * 13 % 14)) + "px;--c:" + (i % 4) + '"></i>';
      return out + "</span>";
    }
    function autoOn(){ return STATE.ui.smAuto !== 0; }
    function learn(L){
      var items = inBankOrder(L.items), S = learnStore();
      function stepOf(id){ var s = S.q[id]; return s === 1 || s === 2 ? s : s === 0 ? 0 : -1; }
      function counts(){ var c = { fresh: 0, learning: 0, done: 0, half: 0 }; items.forEach(function(q){ var s = stepOf(q.id); if (s < 0) c.fresh++; else if (s === 2) c.done++; else { c.learning++; if (s === 1) c.half++; } }); return c; }
      /* how far along: a question right once is halfway, mastered is all the way (a miss is back at the start) */
      function pctOf(c){ return items.length ? Math.round((c.half + 2 * c.done) / (2 * items.length) * 100) : 0; }
      function w(x){ return (Math.round(x / (items.length || 1) * 1000) / 10) + "%"; }
      function resetAll(){
        var ids = items.map(function(q){ return q.id; });
        ids.forEach(function(id){ delete S.q[id]; }); saveState();
        for (var i = 0; i < ids.length; i += 2000) enqueue(["*", "learn-reset", Date.now(), 0, null, ids.slice(i, i + 2000)]);
        track("learn:start-over");
      }
      /* the launcher, in the bank: how far along these questions are, and Start */
      function drawLaunch(){
        var c = counts(), all = c.done === items.length, begun = c.done + c.learning > 0;
        sumline(L, setName(L) ? "Learning the <b class=\"num\">" + fmt(items.length) + "</b> in " + esc(setName(L)) : "Learning <b class=\"num\">" + fmt(items.length) + "</b> of " + fmt(L.all || items.length) + " questions");
        launch(L, "learn", "Learn",
          '<div class="sm-launch-head"><span class="sm-launch-ic" aria-hidden="true">' + icon("learn", 26) + '</span><div><h2>Learn</h2><p class="note">' +
            (all ? "Every one of these is mastered." : "Rounds of 7, one question at a time. A question is mastered once you've had it right twice.") + "</p></div></div>" +
          '<div class="sm-prog"><div class="sm-prog-top"><p class="sm-pct"><b class="num">' + pctOf(c) + '%</b> of the way</p><p class="sm-of note"><span class="num">' + fmt(c.done) + " of " + fmt(items.length) + " mastered</span></p></div>" +
          '<div class="sm-bar" role="img" aria-label="' + c.done + " mastered, " + c.learning + " learning, " + c.fresh + ' not started"><i class="b-done" style="width:' + w(c.done) + '"></i><i class="b-learn" style="width:' + w(c.learning) + '"></i></div>' +
          '<ul class="sm-legend"><li><i class="k-new" aria-hidden="true"></i><b class="num">' + fmt(c.fresh) + '</b> Not started</li><li><i class="k-learn" aria-hidden="true"></i><b class="num">' + fmt(c.learning) + '</b> Learning</li><li><i class="k-done" aria-hidden="true"></i><b class="num">' + fmt(c.done) + "</b> Mastered</li></ul></div>" +
          '<div class="qc-go sm-launch-go">' + (all ? '<button class="btn btn-primary" type="button" data-sm="tocards">' + icon("cards", 18) + 'Flashcards for these</button><button class="btn" type="button" data-sm="reset">' + icon("retry", 18) + "Start over</button>"
            : '<button class="btn btn-primary sm-start" type="button" data-sm="start">' + (begun ? "Keep learning" : "Start learning") + icon("chevron", 18) + "</button>" + (begun ? '<button class="btn btn-text" type="button" data-sm="reset">Start over</button>' : "")) + "</div>",
          function(F){ run(F); }, drawLaunch);
        var rb = $("[data-sm=reset]", L.host), tc = $("[data-sm=tocards]", L.host);
        if (rb) rb.addEventListener("click", function(){ resetAll(); drawLaunch(); var s = $("[data-sm=start]", L.host); if (s) s.focus({ preventScroll: true }); });
        if (tc) tc.addEventListener("click", function(){ STATE.ui.qview = "cards"; saveState(); track("bank:view=cards"); HX.drawQuestions(L.el, L.preset); });
      }
      if (!items.length) { L.host.innerHTML = emptyHTML("Nothing to learn here", "These filters leave no questions. Change them above, or clear them."); return; }
      drawLaunch();
      /* rows from your other devices: the launcher follows (an open session keeps its own bar up to date) */
      pull(function(changed){ if (changed && L.host.isConnected && !FOCUS) drawLaunch(); });

      function run(F){
      var R = null, last = null, autoT = 0;
      F.top.innerHTML = '<div class="sm-prog" data-smprog></div>';
      F.col.innerHTML = '<div class="sm-round" data-smround hidden></div><div class="sm-stage" data-smstage aria-live="polite"></div>';
      var prog = $("[data-smprog]", F.root), roundEl = $("[data-smround]", F.root), stage = $("[data-smstage]", F.root);
      F.onClose = function(){ clearTimeout(autoT); };
      /* the keys: 1 to 6 pick a choice, as on Quizlet; Enter or Space on Next is the button's own */
      F.onKey = function(e){
        if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return;
        var t = e.target, tag = t && t.tagName; if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        var card = $(".qcard", stage); if (!card || card.classList.contains("is-answered") || card.classList.contains("is-skipped")) return;
        var ul = $(".qc-choices", card); if (!ul || ul.hidden) return;
        var b = $$(".ch[data-i]", ul)[+e.key - 1]; if (b && !b.disabled) { e.preventDefault(); b.click(); }
      };
      /* the overall bar: drawn once, then only its widths and numbers change, so it fills instead of jumping */
      function paintProg(){
        var c = counts(), fresh = !$("[data-bar]", prog);
        /* in the session's top row: the percent, the bar, how many are mastered */
        if (fresh) prog.innerHTML = '<b class="sm-pctn num" data-pct>0%</b>' +
          '<div class="sm-bar" data-bar role="img"><i class="b-done" data-fill="done" style="width:0"></i><i class="b-learn" data-fill="learning" style="width:0"></i></div>' +
          '<span class="sm-ofn"><b class="num" data-n="done">0</b><span class="num" data-of></span></span>';
        var bar = $("[data-bar]", prog), from = last || (reduced ? c : { fresh: c.fresh + c.learning + c.done, learning: 0, done: 0, half: 0 });
        bar.setAttribute("aria-label", c.done + " mastered, " + c.learning + " learning, " + c.fresh + " not started");
        var set = function(){ $('[data-fill="done"]', prog).style.width = w(c.done); $('[data-fill="learning"]', prog).style.width = w(c.learning); };
        if (fresh && !reduced) requestAnimationFrame(function(){ requestAnimationFrame(set); }); else set();
        ["fresh", "learning", "done"].forEach(function(k){ tween($('[data-n="' + k + '"]', prog), from[k], c[k]); });
        tween($("[data-pct]", prog), pctOf(from), pctOf(c), "%");
        $("[data-of]", prog).innerHTML = " / " + fmt(items.length) + '<span class="sm-ofw"> mastered</span>';
        if (last && c.done > last.done) { replay(bar, "is-shine"); replay($('[data-n="done"]', prog), "is-bump"); }
        if (last && pctOf(c) > pctOf(last)) replay($("[data-pct]", prog), "is-bump");
        last = c;
        return c;
      }
      /* the round's track: a step for each question asked (a miss adds one at the end, for its second try) */
      function paintRound(){
        if (!R) { roundEl.hidden = true; return; }
        roundEl.hidden = false;
        if (!$("[data-steps]", roundEl)) roundEl.innerHTML = '<p class="sm-where"><b>Round ' + R.no + '</b><span class="num" data-at></span><span class="sm-streak" data-streak hidden>' + icon("flame", 16) + '<span class="num"></span></span>' +
          '<button class="sm-auto" type="button" data-sm="auto" aria-pressed="' + autoOn() + '" title="After a right answer, go to the next question by itself"><i aria-hidden="true"></i>Auto-next</button></p><ol class="sm-steps" data-steps aria-hidden="true"></ol>';
        var au = $("[data-sm=auto]", roundEl);
        if (au && !au.__w) { au.__w = 1; au.addEventListener("click", function(){ STATE.ui.smAuto = autoOn() ? 0 : 1; saveState(); au.setAttribute("aria-pressed", autoOn()); track("learn:auto=" + (autoOn() ? "on" : "off")); if (!autoOn()) stopAuto(); }); }
        var ol = $("[data-steps]", roundEl);
        while (ol.children.length < R.slots.length) ol.appendChild(h("<li></li>"));
        R.slots.forEach(function(sl, i){ var li = ol.children[i], cls = "is-" + sl.st + (sl.again ? " is-again" : ""); if (li.className !== cls) li.className = cls; });
        var done = R.slots.filter(function(sl){ return sl.st === "right" || sl.st === "miss"; }).length;
        $("[data-at]", roundEl).textContent = " · " + Math.min(done + 1, R.slots.length) + " of " + R.slots.length;
        var st = $("[data-streak]", roundEl), on = R.streak >= 3;
        if (on) { $(".num", st).textContent = R.streak + " in a row"; if (st.hidden) { st.hidden = false; replay(st, "is-bump"); } else replay(st, "is-bump"); } else st.hidden = true;
      }
      /* a round: up to 7, the questions still being learned first, then new ones in the bank's order */
      function newRound(){
        var learning = items.filter(function(q){ var s = stepOf(q.id); return s === 0 || s === 1; }), fresh = items.filter(function(q){ return stepOf(q.id) < 0; });
        var pick = learning.concat(fresh).slice(0, 7);
        if (!pick.length) { allDone(); return; }
        S.r = (S.r | 0) + 1; saveState();
        var c = counts();
        R = { no: S.r, slots: pick.map(function(q){ return { q: q, st: "todo" }; }), queue: pick.map(function(q, i){ return i; }), right: 0, streak: 0, best: 0, start: c, log: [] };
        roundEl.innerHTML = "";
        next();
      }
      function next(){
        clearTimeout(autoT);
        if (!R) return;
        if (!R.queue.length) { roundDone(); return; }
        var i = R.queue.shift(), sl = R.slots[i], q = sl.q;
        sl.st = "now"; R.cur = i; paintRound();
        var s = stepOf(q.id), second = s === 1, hide = second && hideable(q);
        stage.innerHTML = "";
        var el = HX.card(q, { ctx: "learn", noAgain: true, hide: hide, note: sl.again ? "Second try" : second ? (hide ? "Once more to master it: recall it first" : "Once more to master it") : (s === 0 ? "Still learning this one" : ""), onAnswer: answered });
        stage.appendChild(el);
        /* "Don't know?": the answer, with no guess recorded; the question comes back like a miss */
        if (q.type === "mcq") {
          var dk = h('<p class="sm-dk" data-dk><button class="btn btn-text" type="button" data-sm="dontknow">Don\u2019t know?</button><span class="note sm-keys">Keys 1 to ' + Math.min(9, q.choices.length) + " pick a choice</span></p>");
          var res0 = $(".qc-result", el); if (res0) el.insertBefore(dk, res0); else el.appendChild(dk);
          $("[data-sm=dontknow]", dk).addEventListener("click", function(){ skip(el, q); });
        }
        var f = $("[data-showch]", el) || $(".ch", el) || $("[data-reveal]", el);
        if (f) f.focus({ preventScroll: true });
        F.body.scrollTop = 0;
      }
      function stopAuto(){ clearTimeout(autoT); autoT = 0; var b = $(".sm-next .is-auto", stage); if (b) b.classList.remove("is-auto"); }
      function skip(el, q){
        var sl = R.slots[R.cur]; if (!sl || el.classList.contains("is-answered") || el.classList.contains("is-skipped")) return;
        el.classList.add("is-skipped");
        var think = $("[data-thinkrow]", el), ul = $(".qc-choices", el); if (think) think.remove(); if (ul) ul.hidden = false;
        $$(".ch", el).forEach(function(b){ b.disabled = true; if (+b.getAttribute("data-i") === q.answer) { b.classList.add("is-key"); $(".txt", b).insertAdjacentHTML("beforeend", '<span class="sr">, the answer</span>'); } });
        R.streak = 0;
        if (!R.slots.some(function(x){ return x.again && x.q.id === q.id; })) { R.slots.push({ q: q, st: "todo", again: true }); R.queue.push(R.slots.length - 1); }
        sl.st = "miss"; R.log.push({ q: q, right: false, first: !sl.again, done: false });
        S.q[q.id] = 0; saveState();
        enqueue([q.id, "learn-0", Date.now(), 0, reqId()]);
        track("learn:dont-know");
        paintProg(); paintRound();
        var res = $(".qc-result", el);
        if (res) { res.innerHTML = '<p class="verdict part">' + icon("hints", 26) + "Here\u2019s the answer</p>" + P.figAfterHTML(q) + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" +
          (q.cue ? '<p class="qc-cue">' + icon("hints", 18) + "<span><b>Remember it:</b> " + esc(q.cue) + "</span></p>" : "") + P.whyHTML(q, null, null, true); res.hidden = false; }
        nextRow(el, q, false, 0);
      }
      /* Next and the praise above a phone's tab bar and clear of the corner buttons (Ask Timmy, the streak chip) */
      function showRow(row){ row.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
      function answered(el, q, right){
        var s = stepOf(q.id), ns, sl = R.slots[R.cur], first = !sl.again;
        if (right) { ns = s === 1 ? 2 : 1; R.right++; R.streak++; R.best = Math.max(R.best, R.streak); }
        else { ns = 0; R.streak = 0; if (!R.slots.some(function(x){ return x.again && x.q.id === q.id; })) { R.slots.push({ q: q, st: "todo", again: true }); R.queue.push(R.slots.length - 1); } }   // back at the end of this round (once), and in the next one
        sl.st = right ? "right" : "miss";
        R.log.push({ q: q, right: right, first: first, done: ns === 2 });
        S.q[q.id] = ns; saveState();
        enqueue([q.id, "learn-" + ns, Date.now(), 0, reqId()]);
        paintProg(); paintRound();
        nextRow(el, q, right, ns);
      }
      function nextRow(el, q, right, ns){
        var dk = $("[data-dk]", el); if (dk) dk.remove();
        var res = $(".qc-result", el), word = PRAISE[(R.right + q.id.length) % PRAISE.length];
        var tag = ns === 2 ? '<span class="sm-tag is-done is-pop">' + burstHTML(10) + icon("check", 16) + "Mastered</span>"
          : right ? '<span class="sm-tag is-right is-pop">' + esc(word) + '</span><span class="note sm-sub">' + (hideable(q) ? "Once more, without the choices, and it's mastered" : "Once more in a later round and it's mastered") + "</span>"
          : '<span class="sm-tag">Comes back ' + (R.queue.length ? "at the end of this round" : "next round") + "</span>";
        var row = h('<div class="qc-go sm-next"><button class="btn btn-primary" type="button" data-sm="next">' + (R.queue.length ? "Next" : "Finish the round") + icon("chevron", 16) + "</button>" + tag + "</div>");
        /* right under "Right" / "Not quite", so Next and the praise are in view; the explanation follows for whoever wants it */
        var verdict = res && $(".verdict", res);
        if (verdict) verdict.insertAdjacentElement("afterend", row); else (res || el).appendChild(row);
        var b = $("[data-sm=next]", row); b.addEventListener("click", next);
        setTimeout(function(){ if (!b.isConnected) return; b.focus({ preventScroll: true }); showRow(row); }, 0);
        /* a right answer moves on by itself, as on Quizlet, unless you touch the card (to read why) or turned Auto-next off */
        if (right && autoOn()) {
          b.classList.add("is-auto");
          autoT = setTimeout(function(){ if (b.isConnected && b.classList.contains("is-auto")) next(); }, 1700);
          var stop = function(e){ if (e.type === "keydown" && (e.key === "Enter" || e.key === " ")) return; if (e.target && e.target.closest && e.target.closest("[data-sm=next]")) return; stopAuto(); };
          ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function(t){ el.addEventListener(t, stop, { passive: true }); });
        }
      }
      function roundDone(){
        var c = paintProg(), left = c.fresh + c.learning, a = pctOf(R.start), z = pctOf(c), gained = c.done - R.start.done;
        track("learn:round-done");
        R.slots.forEach(function(sl){ if (sl.st === "now") sl.st = "todo"; }); paintRound();
        if (!left) { R = null; paintRound(); allDone(); return; }
        var seen = {}, list = R.log.filter(function(x){ if (seen[x.q.id]) return false; seen[x.q.id] = 1; return true; }).map(function(x){
          var later = R.log.filter(function(y){ return y.q.id === x.q.id; }), fixed = !x.right && later.some(function(y){ return y.right; }), done = later.some(function(y){ return y.done; });
          var cls = x.right ? "is-right" : fixed ? "is-fixed" : "is-miss";
          return '<li class="' + cls + '">' + icon(x.right || fixed ? "check" : "retry", 16) + '<span class="t">' + esc(String(x.q.stem || "").replace(/\s+/g, " ").slice(0, 140)) + "</span>" + (done ? '<span class="sm-tag is-done">Mastered</span>' : fixed ? '<span class="sm-tag">Second try</span>' : "") + "</li>"; }).join("");
        stage.innerHTML = '<section class="recap sm-end enter" aria-label="Round done"><h2>Round ' + R.no + " done</h2>" +
          '<div class="sm-endbar"><p><b class="num" data-endpct>' + (reduced ? z : a) + "%</b> of the way" + (gained > 0 ? ' <span class="sm-gain num">+' + gained + " mastered</span>" : z > a ? ' <span class="sm-gain num">+' + (z - a) + "%</span>" : "") + "</p>" +
          '<div class="sm-bar"><i class="b-done" data-endfill="done" style="width:' + w((reduced ? c : R.start).done) + '"></i><i class="b-learn" data-endfill="learning" style="width:' + w((reduced ? c : R.start).learning) + '"></i></div></div>' +
          '<div class="figs"><div><b class="num" data-count="' + R.right + '">' + R.right + "</b><span>right this round</span></div>" +
          '<div><b class="num" data-count="' + R.best + '">' + R.best + "</b><span>best streak</span></div>" +
          '<div><b class="num" data-count="' + left + '">' + fmt(left) + "</b><span>left to master</span></div></div>" +
          '<ol class="sm-list">' + list + "</ol>" +
          '<div class="qc-go"><button class="btn btn-primary" type="button" data-sm="round">Next round' + icon("chevron", 16) + '</button><button class="btn" type="button" data-sm="break">Take a break</button></div>' +
          '<p class="note sm-saved">Your progress is saved, here and on your other devices.</p></section>';
        countUp(stage);
        if (!reduced) setTimeout(function(){ var f = $('[data-endfill="done"]', stage), g = $('[data-endfill="learning"]', stage); if (!f) return;
          f.style.width = w(c.done); g.style.width = w(c.learning); tween($("[data-endpct]", stage), a, z, "%"); }, 250);
        $$(".sm-list li", stage).forEach(function(li, i){ li.style.setProperty("--i", i); });
        $("[data-sm=round]", stage).addEventListener("click", newRound);
        $("[data-sm=break]", stage).addEventListener("click", function(){ F.close(); });
        $("[data-sm=round]", stage).focus({ preventScroll: true });
        F.body.scrollTop = 0;
        R = null; roundEl.hidden = true;
      }
      function allDone(){
        var n = items.length;
        track("learn:all-mastered");
        if (HX.say) HX.say(n > 1 ? "All " + n + " mastered! Look at you." : "Mastered! Look at you.", "do-hop");
        roundEl.hidden = true;
        stage.innerHTML = '<section class="recap sm-done enter" aria-label="All mastered">' + (reduced ? "" : burstHTML(22, true)) + "<h2>" + (n === 1 ? "Mastered" : "You mastered all " + fmt(n)) + "</h2>" +
          "<p>Each one right twice, the second time " + (items.some(hideable) ? "without the choices when it could be." : "in a later round.") + " Flashcards bring them back before you forget them.</p>" +
          '<div class="qc-go"><button class="btn btn-primary" type="button" data-sm="tocards">' + icon("cards", 18) + 'Flashcards for these</button><button class="btn" type="button" data-sm="reset">' + icon("retry", 18) + "Start over</button></div></section>";
        replay($("[data-bar]", prog), "is-shine");
        $("[data-sm=tocards]", stage).addEventListener("click", function(){ F.close(true); STATE.ui.qview = "cards"; saveState(); track("bank:view=cards"); HX.drawQuestions(L.el, L.preset); });
        $("[data-sm=reset]", stage).addEventListener("click", function(){ resetAll(); paintProg(); newRound(); });
        $("[data-sm=tocards]", stage).focus({ preventScroll: true });
        F.body.scrollTop = 0;
      }
      paintProg(); newRound();
      }
    }

    /* ======================= Flashcards ======================= */
    var KEYS = ["again", "hard", "good", "easy"], NAMES = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };
    var current = null;   // the flashcard on screen, for the keys
    function deckOf(items, now){
      var C = cards(), due = [], learning = [], fresh = [], later = [];
      items.forEach(function(q){ var c = C[q.id]; if (!c) fresh.push(q); else if (c.d <= now) due.push(q); else if (c.s !== "R") learning.push(q); else later.push(q); });
      due.sort(function(a, b){ return C[a.id].d - C[b.id].d; });   // most overdue first
      return { due: due, learning: learning, fresh: fresh, later: later };
    }
    function flashcards(L){
      var items = inBankOrder(L.items);
      function countsHTML(D){ return '<li class="c-due"><b class="num">' + fmt(D.due.length) + "</b><span>Due<span class=\"sm-w\"> now</span></span></li><li class=\"c-learn\"><b class=\"num\">" + fmt(D.learning.length) + "</b><span>Learning</span></li><li class=\"c-new\"><b class=\"num\">" + fmt(D.fresh.length) + "</b><span>New</span></li>"; }
      function sum(D){ sumline(L, '<b class="num">' + fmt(items.length) + "</b> " + (items.length === 1 ? "card" : "cards") + (setName(L) ? " in " + esc(setName(L)) : "") + ': <b class="num">' + fmt(D.due.length) + "</b> due now"); }
      /* the launcher, in the bank: what's due, and Study */
      function drawLaunch(){
        var D = deckOf(items, Date.now()), n = D.due.length + Math.min(D.fresh.length, 20);
        sum(D);
        launch(L, "cards", "Flashcards",
          '<div class="sm-launch-head"><span class="sm-launch-ic" aria-hidden="true">' + icon("cards", 26) + '</span><div><h2>Flashcards</h2><p class="note">Flip the card, then say how well you knew it. Each one comes back when you\u2019re about to forget it.</p></div></div>' +
          '<ul class="sm-counts" aria-label="This deck">' + countsHTML(D) + "</ul>" +
          '<div class="qc-go sm-launch-go"><button class="btn btn-primary sm-start" type="button" data-sm="start">' + (n ? "Study " + fmt(n) + (n === 1 ? " card" : " cards") : "Open the deck") + icon("chevron", 18) + "</button></div>",
          function(F){ run(F); }, drawLaunch);
      }
      if (!items.length) { L.host.innerHTML = emptyHTML("No cards here", "These filters leave no questions. Change them above, or clear them."); return; }
      drawLaunch();
      pull(function(changed){ if (changed && L.host.isConnected && !FOCUS) drawLaunch(); });

      function run(F){
      var newLeft = 20, ahead = null, timer = 0, sess = { n: 0, again: 0, hard: 0, good: 0, easy: 0 };
      F.top.innerHTML = '<ul class="sm-counts" data-smcounts aria-label="This deck"></ul>';
      F.col.innerHTML = '<div class="sm-stage" data-smstage aria-live="polite"></div>';
      var countsEl = $("[data-smcounts]", F.root), stage = $("[data-smstage]", F.root);
      F.onClose = function(){ clearTimeout(timer); current = null; };
      function paintCounts(D){
        D = D || deckOf(items, Date.now());
        countsEl.innerHTML = countsHTML(D);
        sum(D);
        return D;
      }
      function pick(){
        var now = Date.now(), D = paintCounts();
        if (ahead && ahead.length) { var q0 = ahead.shift(); return { q: q0, ahead: true }; }
        ahead = null;
        if (D.due.length) return { q: D.due[0], ahead: false };
        if (D.fresh.length && newLeft > 0) return { q: D.fresh[0], ahead: false };
        return null;
      }
      function next(){
        clearTimeout(timer);
        var p = pick();
        if (!p) { caughtUp(); return; }
        draw(p.q, p.ahead);
      }
      function caughtUp(){
        var D = deckOf(items, Date.now()), C = cards(), soon = D.learning.concat(D.later).sort(function(a, b){ return C[a.id].d - C[b.id].d; });
        var nextAt = soon.length ? C[soon[0].id].d : 0;
        current = null;
        track("cards:caught-up");
        var KEYN = ["again", "hard", "good", "easy"];
        var sessHTML = !sess.n ? "" : '<div class="sm-sess"><p><b class="num" data-count="' + sess.n + '">' + fmt(sess.n) + "</b> " + (sess.n === 1 ? "card" : "cards") + " this session</p>" +
          '<div class="sm-sessbar" role="img" aria-label="' + KEYN.map(function(k){ return NAMES[k] + " " + sess[k]; }).join(", ") + '">' + KEYN.map(function(k){ return sess[k] ? '<i class="s-' + k + '" style="flex:' + sess[k] + '"></i>' : ""; }).join("") + "</div>" +
          '<ul class="sm-sesskey">' + KEYN.map(function(k){ return '<li><i class="s-' + k + '" aria-hidden="true"></i>' + NAMES[k] + ' <b class="num">' + sess[k] + "</b></li>"; }).join("") + "</ul></div>";
        stage.innerHTML = '<section class="recap sm-caught enter" aria-label="All caught up"><h2>All caught up</h2>' + sessHTML + "<p>" +
          (nextAt ? "The next card is back " + (dayNo(nextAt) === dayNo(Date.now()) ? "at " + clock(nextAt) : dayNo(nextAt) - dayNo(Date.now()) === 1 ? "tomorrow at " + clock(nextAt) : "on " + new Date(nextAt).toLocaleDateString("en-US", { weekday: "long" }) + " at " + clock(nextAt)) + "." : D.fresh.length ? "You've seen today's new cards." : "Nothing here is scheduled yet.") +
          "</p><div class=\"qc-go\">" + (D.fresh.length ? '<button class="btn btn-primary" type="button" data-sm="new">Study new cards <span class="num">(' + fmt(D.fresh.length) + ")</span></button>" : "") +
          (soon.length ? '<button class="btn' + (D.fresh.length ? "" : " btn-primary") + '" type="button" data-sm="ahead">Study ahead</button>' : "") +
          '<button class="btn' + (D.fresh.length || soon.length ? "" : " btn-primary") + '" type="button" data-sm="done">Done</button></div>' +
          (soon.length ? '<p class="note">Study ahead brings the soonest cards forward. They move on your schedule but earn no XP.</p>' : "") + "</section>";
        var nb = $("[data-sm=new]", stage), ab = $("[data-sm=ahead]", stage);
        if (nb) nb.addEventListener("click", function(){ newLeft = 20; track("cards:new"); next(); });
        if (ab) ab.addEventListener("click", function(){ ahead = soon.slice(0, 10); track("cards:ahead"); next(); });
        var db = $("[data-sm=done]", stage); db.addEventListener("click", function(){ F.close(); });
        countUp(stage);
        var f = nb || ab || db; if (f) f.focus({ preventScroll: true });
        F.body.scrollTop = 0;
        /* a card back within the half hour (a learning step): it comes up by itself while the deck is open */
        if (nextAt && nextAt - Date.now() < 30 * MIN) timer = setTimeout(function(){ if (stage.isConnected && !current) next(); }, Math.max(1000, nextAt - Date.now() + 500));
      }
      function draw(q, isAhead){
        var C = cards(), c = C[q.id], now = Date.now(), state = !c ? "New" : isAhead ? "Ahead of schedule" : c.s === "R" ? "Due for review" : "Learning";
        var hide = hideable(q), uid = "fc" + Math.floor(Math.random() * 1e9);
        var el = h('<article class="qc fcard' + lc(q.lec) + '" data-fqid="' + esc(q.id) + '" aria-labelledby="' + uid + 'h"></article>');
        var head = '<header class="qc-head"><span class="qc-meta"><span class="qc-lec" id="' + uid + 'h">' + lecChip(q.lec) + "</span>" + P.likelyTag(q) + '<span class="fc-state">' + esc(state) + '</span></span><span class="qc-tools fc-tools"></span></header>';
        var body = '<div class="fc-front" data-face>' + P.figHTML(q) + P.pboxHTML(q) + P.stemHTML(q) + frontChoices(q, hide) + "</div>";
        el.innerHTML = head + '<div class="fc-turn">' + body + '<div class="fc-back" data-back hidden></div></div>' +
          '<div class="qc-go fc-flip" data-fliprow><button class="btn btn-primary" type="button" data-sm="flip">' + icon("retry", 18) + 'Flip the card</button><span class="note fc-key">Space flips it. Then 1 to 4 rate it, or \u2190 Again and \u2192 Good.</span><span class="note fc-tap">Tap the card to flip it. Then swipe left for Again, right for Good.</span></div>' +
          '<div class="fc-rate" data-raterow hidden role="group" aria-label="How well did you know it?"><p class="fc-rate-q">How well did you know it?</p><div class="fc-rate-btns">' +
          KEYS.map(function(r, i){ return '<button class="btn fc-r r-' + r + '" type="button" data-sm="' + r + '"><b>' + NAMES[r] + '</b><small class="num">' + esc(inWords(sched(c, r, now).d, now)) + '</small><kbd class="fc-key" aria-hidden="true">' + (i + 1) + "</kbd></button>"; }).join("") + "</div></div>";
        tools(el, q);
        stage.innerHTML = ""; stage.appendChild(el);
        if (HX.FIG && HX.FIG.ANIMA) { try { HX.FIG.ANIMA.mount(el); } catch (e) {} }
        current = { el: el, q: q, ahead: isAhead, flipped: false, at: now };
        el.addEventListener("click", function(e){
          var b = e.target.closest("button");
          if (b && el.contains(b)) {
            var k = b.getAttribute("data-sm");
            if (k === "flip") flip();
            else if (k === "choices") { var ul = $(".fc-choices", el); if (ul) ul.hidden = false; b.remove(); }
            else if (KEYS.indexOf(k) > -1) rate(k, b);
            return;
          }
          /* a tap on the front turns it over too (not on a link, a figure's key or the patient box's own controls) */
          if (!current || current.flipped || e.target.closest("a, details, summary, input, label, .sh-nj, .sh-qrate")) return;
          if (e.target.closest("[data-face]")) flip();
        });
        var fb = $("[data-sm=flip]", el); if (fb) fb.focus({ preventScroll: true });
        F.body.scrollTop = 0;
        swipe(el);
      }
      /* a turned-over card follows a finger: past a third of the way left it's Again, right it's Good (as on Quizlet) */
      function swipe(el){
        var x0 = 0, y0 = 0, on = false, drag = false, id = null;
        var lab = h('<span class="fc-swipe" aria-hidden="true"></span>'); el.appendChild(lab);
        function end(commit){
          if (!on) return; on = false;
          var dx = drag ? parseFloat(el.getAttribute("data-dx")) || 0 : 0, far = Math.abs(dx) > Math.min(110, el.offsetWidth / 3);
          el.removeAttribute("data-dx"); el.classList.remove("is-drag", "to-good", "to-again");
          if (commit && drag && far && current && current.el === el && current.flipped) {
            var r = dx > 0 ? "good" : "again";
            if (!reduced) { el.style.transition = "transform 180ms ease-in, opacity 180ms ease-in"; el.style.transform = "translateX(" + (dx > 0 ? 120 : -120) + "%) rotate(" + (dx > 0 ? 8 : -8) + "deg)"; el.style.opacity = "0"; }
            track("cards:swipe"); rate(r, $('[data-sm="' + r + '"]', el));
          } else { el.style.transition = reduced ? "" : "transform 180ms var(--ease-out)"; el.style.transform = ""; }
          drag = false;
        }
        el.addEventListener("pointerdown", function(e){
          if (e.pointerType !== "touch" || !current || current.el !== el || !current.flipped || e.target.closest("button, a, summary, input, label")) return;
          on = true; drag = false; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; el.style.transition = "";
        });
        el.addEventListener("pointermove", function(e){
          if (!on || e.pointerId !== id) return;
          var dx = e.clientX - x0, dy = e.clientY - y0;
          if (!drag) { if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.5) { if (Math.abs(dy) > 24) on = false; return; } drag = true; el.classList.add("is-drag"); }
          el.setAttribute("data-dx", dx);
          el.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 40) + "deg)";
          el.classList.toggle("to-good", dx > 40); el.classList.toggle("to-again", dx < -40);
          lab.textContent = dx > 0 ? "Good" : "Again";
        });
        el.addEventListener("pointerup", function(e){ if (e.pointerId === id) end(true); });
        el.addEventListener("pointercancel", function(e){ if (e.pointerId === id) end(false); });
      }
      function frontChoices(q, hide){
        var idx = (q.choices || []).map(function(x, i){ return i; });
        if (q.type === "mcq" || q.type === "multi") {
          var order = q.type === "multi" ? shuffled(idx) : P.choiceOrder(q);
          return (q.type === "multi" ? '<p class="note fc-hint">Select all that apply.</p>' : "") +
            '<ul class="fc-choices' + (q.fmt === "tf" ? " is-tf" : "") + '"' + (hide ? " hidden" : "") + ">" + order.map(function(i){ return '<li data-i="' + i + '">' + esc(q.choices[i]) + "</li>"; }).join("") + "</ul>" +
            (hide ? '<button class="btn btn-text fc-showch" type="button" data-sm="choices">' + icon("chevron", 16) + "Show the choices</button>" : "");
        }
        if (q.type === "sequence") return '<p class="note fc-hint">Put these in order, first to last.</p><ul class="fc-choices">' + shuffled(q.steps.map(function(s, i){ return i; })).map(function(i){ return "<li>" + esc(q.steps[i]) + "</li>"; }).join("") + "</ul>";
        if (q.type === "match") return '<p class="note fc-hint">Match each one on the left with its partner.</p><div class="fc-match"><ul>' + shuffled(q.pairs.map(function(p, i){ return i; })).map(function(i){ return "<li>" + esc(q.pairs[i][0]) + "</li>"; }).join("") +
          "</ul><ul>" + shuffled(q.pairs.map(function(p, i){ return i; })).map(function(i){ return "<li>" + esc(q.pairs[i][1]) + "</li>"; }).join("") + "</ul></div>";
        return "";   // a recall card: the stem alone
      }
      function answerHTML(q){
        var head = function(t){ return '<p class="fc-ans-h">' + icon("check", 20) + "<span>" + t + "</span></p>"; };
        if (q.type === "mcq") return '<div class="fc-ans">' + head("Answer") + '<p class="fc-ans-t">' + esc(q.choices[q.answer]) + "</p></div>";
        if (q.type === "multi") return '<div class="fc-ans">' + head(q.correct.length === 1 ? "The one right answer" : "Every right answer") + '<ul class="fc-ans-l">' + q.correct.map(function(i){ return "<li>" + esc(q.choices[i]) + "</li>"; }).join("") + "</ul></div>";
        if (q.type === "sequence") return '<div class="fc-ans">' + head("In order") + '<ol class="qc-order">' + q.steps.map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>";
        if (q.type === "match") return '<div class="fc-ans">' + head("The pairs") + '<dl class="qc-pairs">' + q.pairs.map(function(p){ return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("") + "</dl></div>";
        return '<div class="fc-ans">' + head("Answer") + '<p class="fc-ans-t">' + esc(q.answer || "") + "</p></div>";
      }
      function tools(el, q){
        var host = $(".fc-tools", el);
        if (window.SH_PINS && window.shPins) {
          var pb = h('<button type="button" class="sh-qpin" data-sm="pin"></button>'); pb.__qid = q.id;
          var paint = function(on){ pb.classList.toggle("is-on", on); pb.setAttribute("aria-pressed", on ? "true" : "false"); pb.innerHTML = icon("pin", 16) + (on ? "Pinned" : "Pin"); pb.title = on ? "Unpin this question" : "Pin this question to your Pinned list"; };
          paint(window.shPins.has(q.id));
          pb.addEventListener("click", function(ev){ ev.stopPropagation(); paint(window.shPins.toggle(q.id)); });
          host.appendChild(pb);
        }
        if (window.shOpenFlag) {
          var rb = h('<button type="button" class="sh-qflag" data-sm="report" aria-label="Report a problem with this question">' + icon("report", 16) + "Report</button>");
          rb.addEventListener("click", function(ev){ ev.stopPropagation(); window.shOpenFlag(q.id); });
          host.appendChild(rb);
        }
      }
      function flip(){
        var cur = current; if (!cur || cur.flipped) return;
        cur.flipped = true;
        var el = cur.el, q = cur.q, turn = $(".fc-turn", el);
        var show = function(){
          var ul = $(".fc-choices", el), sc = $("[data-sm=choices]", el);
          if (sc) sc.remove();
          /* choices you never opened stay folded: the answer alone is the back of the card */
          if (ul && ul.hidden) ul.remove();
          else if (ul && (q.type === "mcq" || q.type === "multi")) {
            ul.classList.add("is-answered");
            $$("li", ul).forEach(function(li){ var i = +li.getAttribute("data-i"), key = q.type === "multi" ? q.correct.indexOf(i) > -1 : i === q.answer; if (key) { li.classList.add("is-key"); li.insertAdjacentHTML("afterbegin", icon("check", 18)); li.insertAdjacentHTML("beforeend", '<span class="sr"> (right)</span>'); } });
          } else if (ul) ul.classList.add("is-answered");
          var back = $("[data-back]", el);
          back.innerHTML = answerHTML(q) + '<section class="qcard-explain fc-ex" data-role="explain">' + P.figAfterHTML(q) + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" +
            (q.cue ? '<p class="qc-cue">' + icon("hints", 18) + "<span><b>Remember it:</b> " + esc(q.cue) + "</span></p>" : "") +
            (q.ref && window.shCases && window.shCases.refHTML ? window.shCases.refHTML(q) : "") + P.whyHTML(q, null, null, true) + "</section>";
          back.hidden = false;
          $("[data-fliprow]", el).hidden = true; $("[data-raterow]", el).hidden = false;
          var ex = $(".fc-ex", el);
          if (window.shQH && window.shQH.rate) { try { window.shQH.rate(ex, q.id); } catch (e) {} }
          if (window.shNoteJump) { try { window.shNoteJump(el, q.id); } catch (e) {} }
          if (HX.FIG && HX.FIG.ANIMA) { try { HX.FIG.ANIMA.mount(back); } catch (e) {} }
          var g = $("[data-sm=good]", el); if (g) g.focus({ preventScroll: true });
          /* the answer in view; the ratings stay at the bottom of the screen while the card is longer than it (study-modes.css) */
          var an = $(".fc-ans", el); if (an) an.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
        };
        if (reduced || !turn.animate) { show(); el.classList.add("is-flipped"); if (!reduced || !turn.animate) return; turn.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 160 }); return; }
        /* the card turns over: a quarter turn, the answer, then back to face you */
        var a = turn.animate([{ transform: "perspective(1400px) rotateX(0deg)" }, { transform: "perspective(1400px) rotateX(88deg)" }], { duration: 170, easing: "cubic-bezier(0.5, 0, 0.75, 0)" });
        a.onfinish = function(){ show(); el.classList.add("is-flipped"); turn.animate([{ transform: "perspective(1400px) rotateX(-88deg)" }, { transform: "perspective(1400px) rotateX(0deg)" }], { duration: 230, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }); };
      }
      function rate(r, from){
        var cur = current; if (!cur || !cur.flipped) return;
        current = null;
        var q = cur.q, C = cards(), now = Date.now(), c0 = C[q.id], pays = !cur.ahead && (!c0 || c0.d <= now), req = reqId();
        if (!c0) newLeft--;
        sess.n++; sess[r]++;
        C[q.id] = sched(c0, r, now);
        var rec = HX.recordCard(q.id, r, pays, req);
        enqueue([q.id, r, now, cur.ahead ? 1 : 0, req]);
        HX.reward(from, null, rec);
        $$(".fc-r", cur.el).forEach(function(b){ b.disabled = true; b.classList.toggle("is-picked", b === from); });
        setTimeout(function(){ if (stage.isConnected) next(); }, reduced ? 0 : 280);
      }
      next();
      }
    }

    /* the keys on a laptop: Space turns it over, 1 to 4 rate it, and the arrows are Again (left) and Good (right) */
    document.addEventListener("keydown", function(e){
      var cur = current;
      if (!cur || !cur.el.isConnected || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable) || document.querySelector("dialog[open]")) return;
      if (!cur.flipped && (e.key === " " || e.key === "Spacebar")) {
        if (t && t.closest && t.closest("button, a, summary") && !t.closest("[data-sm=flip]")) return;
        e.preventDefault(); var fb = $("[data-sm=flip]", cur.el); if (fb) fb.click();
      } else if (cur.flipped && (/^[1-4]$/.test(e.key) || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        var r = e.key === "ArrowLeft" ? "again" : e.key === "ArrowRight" ? "good" : KEYS[+e.key - 1];
        e.preventDefault(); var b = $('[data-sm="' + r + '"]', cur.el); if (b && !b.disabled) b.click();
      }
    });
    /* rows waiting from an earlier visit go out now */
    setTimeout(flush, 0);

    return { learn: learn, cards: flashcards, sched: sched, inWords: inWords, hideable: hideable, rebuild: rebuild, dayStart: dayStart };
  };
})();
