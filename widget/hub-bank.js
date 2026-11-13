/* ============ THE HUB ENGINE, part: the question card and the bank (widget/hub-bank.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds the
   question card (every format, its feedback, the whys and the class's picks) and the Questions view: the bank, its
   filter panel and presets (the Daily drill, Yesterday's misses, Weak spots) and the mock exam.

   The names it takes from the core are listed first; anything of the core's that changes after the page loads is read
   as HX.<name> (HX.CORE, HX.QS, HX.FIG); what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).bank = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var C = HX.C, HUB = HX.HUB, docEl = HX.docEl, $ = HX.$, $$ = HX.$$, esc = HX.esc, h = HX.h, pl = HX.pl,
    shuffled = HX.shuffled, seeded = HX.seeded, track = HX.track, ls = HX.ls, icon = HX.icon, mark = HX.mark,
    STATE = HX.STATE, ansOf = HX.ansOf, saveNow = HX.saveNow, saveState = HX.saveState, QBY = HX.QBY, QBL = HX.QBL,
    LBY = HX.LBY, lecLabel = HX.lecLabel, lecName = HX.lecName, lc = HX.lc, lecDot = HX.lecDot, lecChip = HX.lecChip,
    isExamLec = HX.isExamLec, isReview = HX.isReview, needQuestions = HX.needQuestions, needFigures = HX.needFigures,
    needsFig = HX.needsFig, parse = HX.parse, go = HX.go, lecProgress = HX.lecProgress, srsMisses = HX.srsMisses,
    offlineHTML = HX.offlineHTML, tip = HX.tip, whenWidget = HX.whenWidget;

  /* ======================= the question card ======================= */
  var RETRY_GAP = 5, uid = 0;
  function choiceOrder(q){ var idx = q.choices.map(function(c, i){ return i; }); return q.fmt === "2stmt" || q.fmt === "tf" || q.fmt === "numbered" ? idx : shuffled(idx); }
  function srcLabel(q){ return (HX.CORE.srcLabel || {})[q.src] || q.src || ""; }
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
    var set = q.pcase ? HX.IDX.filter(function(r){ return QBY[r.id] && QBY[r.id].pcase === q.pcase; }) : [];
    var at = set.map(function(r){ return r.id; }).indexOf(q.id);
    return '<div class="pbox"><p class="pbox-head">' + icon("notes", 18) + "<span>Patient box</span>" + (set.length > 1 ? '<span class="note">Same patient · ' + (at + 1) + " of " + set.length + "</span>" : "") + "</p><dl>" +
      q.pbox.map(function(r){ return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" + (HX.FIG && q.pimg ? '<div class="pbox-img">' + HX.FIG.caseImgHTML(q) + "</div>" : "") +
      (q.pcase && HX.CORE.pcases && window.shCases ? window.shCases.pboxFigures(q, HX.CORE.pcases) : "") + "</div>";
  }
  function figHTML(q){ var f = HX.FIG && q.img && !q.imgAfter && HX.FIG.FIGS[q.img]; return f ? '<figure class="qfig" aria-label="' + esc(f.title) + '">' + f.svg + "</figure>" : ""; }
  function figKeyHTML(f, open){ return f.key ? '<details class="fig-key"' + (open ? " open" : "") + "><summary>" + (open ? "Key" : "Show the key") + "</summary><dl>" + f.key.map(function(k){ return "<dt>" + esc(k[0]) + "</dt><dd>" + esc(k[1]) + "</dd>"; }).join("") + "</dl></details>" : ""; }
  function figAfterHTML(q){ var f = HX.FIG && q.img && HX.FIG.FIGS[q.img]; return f && (q.imgAfter || f.key) ? '<figure class="qfig qfig-after" aria-label="' + esc(f.title) + '">' + f.svg + figKeyHTML(f, true) + "</figure>" : ""; }

  function card(q, o){
    o = o || {};
    var id = "q" + (++uid), multi = q.type === "multi", tf = q.fmt === "tf";
    var seen = ansOf(q.id);
    var status = o.retry ? '<span class="qc-flag">' + icon("retry", 14) + "Again: you missed this a few questions ago</span>" : o.note ? '<span class="qc-flag">' + esc(o.note) + "</span>" :
      seen ? '<span class="qc-last ' + (seen.last ? "ok" : "no") + '">Last time: ' + (seen.last ? "right" : "missed") + "</span>" : "";
    var el = h('<article class="qcard qc' + lc(q.lec) + (o.retry ? " is-retry" : "") + '" data-qid="' + esc(q.id) + '" data-qtype="' + q.type + '" data-fmt="' + esc(q.fmt || q.type) + '" data-ctx="' + esc(o.ctx || "bank") + '" aria-labelledby="' + id + 'h"></article>');
    var head = '<header class="qc-head"><span class="qc-meta"><span class="qc-lec" id="' + id + 'h">' + (o.num ? "Question " + o.num + " · " : "") + lecChip(q.lec) + "</span>" + likelyTag(q) + status + '</span><span class="qcard-top qc-tools"></span></header>';
    var body = "", hide = !!o.hide && q.type === "mcq";
    if (q.type === "mcq" || multi) {
      var order = multi ? shuffled(q.choices.map(function(c, i){ return i; })) : choiceOrder(q);
      /* Learn's second step (widget/study-modes.js): the stem alone first, then the choices on request, still graded by the key */
      body = (hide ? '<div class="qc-go qc-think" data-thinkrow><button class="btn btn-primary" type="button" data-showch>' + icon("questions", 18) + 'Show the choices</button><span class="note">Think of your answer first, then show the choices.</span></div>' : "") +
        '<ul class="qc-choices' + (tf ? " qc-tf" : "") + '"' + (hide ? " hidden" : "") + '>' + order.map(function(i){
        return '<li><button class="ch' + (multi ? " has-box" : "") + '" type="button" data-i="' + i + '" aria-pressed="false">' + (multi ? mark("box") : "") + '<span class="txt">' + esc(q.choices[i]) + '</span><span class="pct num" aria-hidden="true"></span><span class="st-ic" aria-hidden="true"></span><span class="share" aria-hidden="true"></span></button></li>';
      }).join("") + "</ul>" +
      (multi ? '<div class="qc-go"><button class="btn btn-primary" type="button" data-check disabled>Check my answer</button><span class="note">Select every right answer, then check. Partial credit.</span></div>' : "");
    } else if (q.type === "sequence") {
      body = '<p class="note qc-hint">Tap the steps in order, first to last.</p><ul class="qc-choices qc-seq">' + shuffled(q.steps.map(function(s, i){ return i; })).map(function(i){
        return '<li><button class="ch" type="button" data-step="' + i + '">' + '<span class="ord num" aria-hidden="true"></span><span class="txt">' + esc(q.steps[i]) + "</span></button></li>"; }).join("") + "</ul>" +
        '<div class="qc-go" data-seqtools hidden><button class="btn btn-text" type="button" data-undo>' + icon("retry", 18) + 'Undo last step</button><button class="btn btn-text" type="button" data-clear>Start over</button></div>';
    } else if (q.type === "recall") {
      /* a self-graded card (Perio's recall items): say it, show the answer, then mark yourself */
      body = '<div class="qc-recall"><p class="qc-ans" hidden><b>Answer:</b> ' + esc(q.answer) + '</p><div class="qc-go" data-reveal-row><button class="btn btn-primary" type="button" data-reveal>Show the answer</button><span class="note">Answer it in your head first.</span></div>' +
        '<div class="qc-go" data-grade-row hidden><button class="btn" type="button" data-grade="1">' + icon("check", 18) + 'I had it right</button><button class="btn" type="button" data-grade="0">' + icon("cross", 18) + "I missed it</button></div></div>";
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
    var multi = q.type === "multi", picked = [], seqP = [], match = { sel: null, done: 0, err: 0 }, self = false;
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
      if (b.hasAttribute("data-showch")) { var row = $("[data-thinkrow]", el), ul = $(".qc-choices", el); if (ul) ul.hidden = false; if (row) row.remove(); var f0 = $(".ch", el); if (f0) f0.focus(); return; }
      if (b.hasAttribute("data-reveal")) { $(".qc-ans", el).hidden = false; $("[data-reveal-row]", el).hidden = true; $("[data-grade-row]", el).hidden = false; var g = $("[data-grade]", el); if (g) g.focus(); return; }
      if (b.hasAttribute("data-grade")) { self = b.getAttribute("data-grade") === "1"; $("[data-grade-row]", el).hidden = true; answer(b); return; }
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
        rec = HX.recordAnswer(q.id, q.lec, right, o.ctx, picked[0]);
      } else if (multi) {
        var hits = picked.filter(function(i){ return q.correct.indexOf(i) > -1; }).length;
        score = Math.max(0, (hits - (picked.length - hits)) / q.correct.length); right = score === 1;
        $$(".ch", el).forEach(function(b){ var i = +b.getAttribute("data-i"), good = q.correct.indexOf(i) > -1, pk = picked.indexOf(i) > -1; paintChoice(b, good && pk ? "right" : pk ? "wrong" : good ? "missed" : "", pk, "box"); });
        if (!right && score > 0) partial = "Partly right: " + Math.round(score * 100) + "% credit";
        $(".qc-go", el).hidden = true;
        rec = HX.recordAnswer(q.id, q.lec, right, o.ctx, null, picked);
      } else if (q.type === "sequence") {
        var inPlace = seqP.filter(function(v, i){ return v === i; }).length; right = inPlace === q.steps.length;
        $$("[data-step]", el).forEach(function(b){ var i = +b.getAttribute("data-step"); b.classList.remove("is-on"); b.classList.add(seqP.indexOf(i) === i ? "is-right" : "is-wrong"); });
        if (!right) partial = "Not quite: " + inPlace + " of " + q.steps.length + " in the right spot";
        $("[data-seqtools]", el).hidden = true;
        rec = HX.recordAnswer(q.id, q.lec, right, o.ctx, null, null, { order: seqP });   // the server grades the order as placed
      } else if (q.type === "recall") {
        right = self; if (!right) partial = "You marked it missed";
        rec = HX.recordAnswer(q.id, q.lec, right, o.ctx);
      } else {
        right = match.err === 0; if (!right) partial = "Matched, with " + pl(match.err, "wrong try", "wrong tries");
        rec = HX.recordAnswer(q.id, q.lec, right, o.ctx);
      }
      result(el, q, right, partial, rec.xp, picked, o);
      if (o.onAnswer) o.onAnswer(el, q, right);
      HX.reward(from, right, rec);
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
  /* plain: a flashcard's back (widget/study-modes.js), where nothing was picked: the right ones marked, no "Your pick" */
  function whyHTML(q, picks, opened, plain){
    if (!q.why || !q.choices) return "";
    var multi = q.type === "multi", ok = function(i){ return multi ? q.correct.indexOf(i) > -1 : i === q.answer; };
    var idx = q.choices.map(function(c, i){ return i; }).sort(function(a, b){ return (ok(b) ? 1 : 0) - (ok(a) ? 1 : 0) || a - b; });
    var open = {}; (opened || picks || []).forEach(function(i){ open[i] = 1; });
    if (!plain) idx.forEach(function(i){ if (multi && ok(i) && (picks || []).indexOf(i) < 0) open[i] = 1; });
    /* folded until tapped, as on the live hubs (Sam, 2026-11-06: open, it took up too much of the screen); inside, your pick is open */
    return '<details class="why"><summary class="why-bar"><span>Why each choice</span><span class="chev">' + icon("chevron", 16) + "</span></summary>" + idx.map(function(i){
      var pk = !plain && (picks || []).indexOf(i) > -1, st = ok(i) ? (plain || pk || !multi ? "right" : "missed") : pk ? "wrong" : "";
      var tag = pk ? "Your pick" : !plain && multi && ok(i) ? "You missed this one" : "";
      return "<details" + (open[i] ? " open" : "") + '><summary><span class="tick ' + (st === "wrong" ? "no" : st ? "ok" : "") + '">' + (st ? icon(st === "wrong" ? "cross" : "check", 18) : "") + "</span><span>" + esc(q.choices[i]) +
        (tag ? ' <span class="tag">· ' + tag + "</span>" : "") + '</span><span class="chev">' + icon("chevron", 16) + "</span></summary><p>" + esc(q.why[i]) + "</p></details>";
    }).join("") + "</details>";
  }
  function result(el, q, right, partial, xp, picks, o){
    o = o || {};
    var res = $(".qc-result", el);
    var verdict = right ? '<p class="verdict ok">' + icon("check", 26) + 'Right<span class="xp num">+' + xp + " XP</span></p>"
      : partial ? '<p class="verdict part">' + icon("goal", 26) + esc(partial) + '<span class="xp num">+' + xp + " XP</span></p>"
      : '<p class="verdict no">' + icon("cross", 26) + 'Not quite<span class="xp num">+' + xp + " XP</span></p>";
    var order = q.type === "sequence" ? '<ol class="qc-order">' + q.steps.map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" : "";
    var pairs = q.type === "match" ? '<dl class="qc-pairs">' + q.pairs.map(function(p){ return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("") + "</dl>" : "";
    res.innerHTML = verdict + figAfterHTML(q) + order + pairs + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" +
      (q.cue && !right ? '<p class="qc-cue">' + icon("hints", 18) + "<span><b>Remember it:</b> " + esc(q.cue) + "</span></p>" : "") +
      (q.ref && window.shCases && window.shCases.refHTML ? window.shCases.refHTML(q) : "") +
      whyHTML(q, q.type === "mcq" || q.type === "multi" ? picks : null) +
      '<p class="qc-class note" data-classnote hidden></p>' +
      /* Learn asks again by itself, so its cards have no "Try it again" */
      '<div class="qc-after">' + (o.noAgain ? "" : '<button class="btn" type="button" data-again>' + icon("retry", 18) + '<span class="l-long">Try it again</span><span class="l-short">Retry</span></button>') +
      /* Ask Timmy about it, now that it's answered (widget/ask.js; hub-timmy.js opens the chat with the question attached) */
      (HX.askOn && HX.askOn() ? '<button class="btn" type="button" data-ask-q="card">' + icon("comment", 18) + "<span>" + esc(HX.askLabel()) + "</span></button>" : "") + "</div>";
    res.hidden = false;
    /* one row under the answer (Sam, 2026-11-06): Try it again, Ask Timmy, then the shared widget's "Find this in the notes"
       (on a miss; it replaced the "Notes for <lecture>" link) and "Good question?", moved in beside it as they arrive */
    var after = $(".qc-after", res);
    var gather = function(){ $$(":scope > .sh-nj, :scope > .sh-qrate", res).forEach(function(n){ after.appendChild(n); }); };
    gather();
    if (window.MutationObserver) { var mo = new MutationObserver(gather); mo.observe(res, { childList: true }); setTimeout(function(){ mo.disconnect(); }, 4000); }
    var ag = $("[data-again]", res); if (ag) ag.addEventListener("click", function(){ var n = card(q, { ctx: el.getAttribute("data-ctx") }); el.replaceWith(n); var f = $(".ch", n); if (f) f.focus(); track("bank:again"); });
    var ak = $("[data-ask-q]", res); if (ak) ak.addEventListener("click", function(){ HX.askAbout(q, right, picks); });
    if (HX.FIG && HX.FIG.ANIMA) { try { HX.FIG.ANIMA.mount(res); } catch (e) {} }
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

  /* ======================= Questions: the bank, its panel, its presets ======================= */
  var SHOW = [["all", "All"], ["unseen", "Not answered yet"], ["missed", "Missed last time"], ["pinned", "Pinned"]];
  /* Only: the High likelihood toggle, on top of any Show chip (Sam, 2026-11-06). A hub may add its own (SH_HUB.bank.only,
     [[key, label]], the key a question property), one on at a time. A Show "likely" saved before then becomes the toggle. */
  /* A toggle may name its own test: [key, label, { prop, lec }] shows the questions whose `prop` is set in that lecture
     only (Heme & Endo Exam 2's Exam 1 High likelihood: likely, in the Refresher), and turning it on ticks that lecture if it
     isn't ticked, then unticks it again when the toggle goes off (STATE.ui.qE1auto, as on the live hub). */
  var LIKELY = [["likely", "High likelihood"]].concat((C.bank && C.bank.only) || []);
  function isLk(k){ return LIKELY.some(function(x){ return x[0] === k; }); }
  function lkSpec(k){ for (var i = 0; i < LIKELY.length; i++) if (LIKELY[i][0] === k) return LIKELY[i][2] || null; return null; }
  function lkHas(q, k){ var sp = lkSpec(k); return sp ? !!q[sp.prop || "likely"] && (!sp.lec || q.lec === sp.lec) : !!q[k]; }
  /* turn a toggle on (k) or off (""): its lecture ticked for it, or unticked again when the toggle had ticked it */
  function setLk(k){
    var was = lkSpec(STATE.ui.qlikely), sp = lkSpec(k);
    if (STATE.ui.qE1auto && was && was.lec && (!sp || sp.lec !== was.lec)) { STATE.ui.qlec = lecValue(lecIds().filter(function(id){ return id !== was.lec; })); STATE.ui.qE1auto = false; }
    STATE.ui.qlikely = k;
    if (sp && sp.lec && LBY[sp.lec] && lecIds().indexOf(sp.lec) === -1) { STATE.ui.qlec = lecValue(lecIds().concat([sp.lec])); STATE.ui.qE1auto = true; }
  }
  function normShow(){
    if (isLk(STATE.ui.qstatus)) { STATE.ui.qlikely = STATE.ui.qstatus; STATE.ui.qstatus = "all"; }
    if (STATE.ui.qlikely && !isLk(STATE.ui.qlikely)) STATE.ui.qlikely = "";
  }
  function bankReset(){ STATE.ui.qset = ""; STATE.ui.qlec = "all"; STATE.ui.qE1auto = false; STATE.ui.qstatus = "all"; STATE.ui.qlikely = ""; STATE.ui.qfmt = "all"; STATE.ui.qsrc = "all"; }
  var SETS = [["drill", "Daily drill"], ["misses", "Yesterday's misses"], ["weak", "Weak spots"], ["mock", "Mock exam"]];
  var FMTS = [["recall", "Recall (self-graded)"], ["2stmt", "Two statements"], ["tf", "True or false"], ["numbered", "Numbered statements"], ["which", "Which statement is true"], ["whichf", "Which statement is false"], ["except", "EXCEPT / NOT"], ["pbox", "Patient Box cases"], ["img", "Diagram questions"], ["multi", "Select all that apply"], ["match", "Matching"], ["sequence", "Put in order"]];
  var PAGE = 20, bankSearch = "";
  function isFmt(q, fm){ return fm === "pbox" ? !!q.pbox : fm === "img" ? !!q.img : (fm === "multi" || fm === "match" || fm === "sequence" || fm === "recall") ? q.type === fm : q.fmt === fm; }
  function labelOf(list, k){ for (var i = 0; i < list.length; i++) if (list[i][0] === k) return list[i][1]; return k; }
  function presetOf(){ var s = parse()[1]; return SETS.some(function(x){ return x[0] === s; }) ? s : s === "missed" ? "" : ""; }
  function pins(){ try { return window.shPins ? window.shPins.list() : JSON.parse(ls("sh_pins_" + HUB) || "[]"); } catch (e) { return []; } }
  /* the bank's default lectures ("all"): every lecture but the review-only ones */
  function bankAll(){ return HX.LECS.filter(function(l){ return !isReview(l.id); }).map(function(l){ return l.id; }); }
  function isDefaultLecs(ids){ var d = bankAll(); return ids.length === d.length && d.every(function(id){ return ids.indexOf(id) > -1; }); }
  function lecValue(ids){ return isDefaultLecs(ids) ? "all" : ids; }
  function lecIds(){
    var v = STATE.ui.qlec;
    if (v === "final" || v === "midterm") return HX.LECS.filter(function(l){ return l.exam === v; }).map(function(l){ return l.id; });
    if (Array.isArray(v)) return v.filter(function(id){ return LBY[id]; });
    if (v && v !== "all" && LBY[v]) return [v];
    return bankAll();
  }
  /* the lecture picker's words: "All lectures", or the hub's own when it has review-only ones (SH_HUB.review) */
  function lecSummary(picked){
    var R = C.review || {}, n = function(t){ return String(t).replace("{n}", bankAll().length); };
    if (isDefaultLecs(picked)) return n(R.all || "All lectures");
    if (picked.length === HX.LECS.length) return n(R.allPlus || "All lectures");
    if (!picked.length) return "No lectures";
    return picked.length === 1 ? lecName(picked[0]) : picked.map(function(id){ return lecLabel(LBY[id]); }).join(", ");
  }
  function filtered(o){
    o = o || {};
    var s = (o.search != null ? o.search : bankSearch).toLowerCase().trim(), on = {}, pin = {};
    normShow();
    var st = o.st || STATE.ui.qstatus || "all", lk = "lk" in o ? o.lk : STATE.ui.qlikely || "", fm = o.fm || STATE.ui.qfmt || "all", src = o.src || STATE.ui.qsrc || "all";
    lecIds().forEach(function(id){ on[id] = 1; });
    var sp = "lk" in o && o.lk ? lkSpec(o.lk) : null; if (sp && sp.lec) on[sp.lec] = 1; /* a toggle's count: tapping it ticks its lecture */
    if (st === "pinned") pins().forEach(function(id){ pin[id] = 1; });
    return HX.QS.filter(function(q){
      if (!on[q.lec]) return false;
      if (st === "pinned" && !pin[q.id]) return false;
      if (lk && !lkHas(q, lk)) return false;
      if (src !== "all" && q.src !== src) return false;
      if (fm !== "all" && !isFmt(q, fm)) return false;
      var seen = ansOf(q.id);
      if (st === "unseen" && seen) return false;
      if (st === "missed" && !(seen && seen.last === false)) return false;
      if (s) { var hay = (q.stem + " " + (q.choices || q.steps || []).join(" ") + " " + (q.pairs ? q.pairs.map(function(p){ return p.join(" "); }).join(" ") : "") + " " + q.ex + " " + (q.pbox ? q.pbox.map(function(r){ return r.join(" "); }).join(" ") : "")).toLowerCase(); if (hay.indexOf(s) === -1) return false; }
      return true;
    });
  }
  function ordered(list){
    if (STATE.ui.qorder === "random") return seeded(list, STATE.ui.qseed || 1);
    var pos = {}; HX.LECS.forEach(function(l, i){ pos[l.id] = i; });
    return list.slice().sort(function(a, b){ return pos[a.lec] - pos[b.lec]; });
  }
  function renderQuestions(el, s){
    if (s === "missed") { STATE.ui.qset = ""; STATE.ui.qstatus = "missed"; STATE.ui.qlikely = ""; STATE.ui.qlec = "all"; saveState(); history.replaceState(null, "", "#questions"); s = ""; }
    if (HX.SESSION.hp0 === null) HX.SESSION.hp0 = HX.petHp();
    el.innerHTML = '<div class="hx-page bank"><p class="note loading">Loading the questions…</p></div>';
    needQuestions().then(function(){ if (HX.view === "questions") drawQuestions(el, s); }).catch(function(){ el.innerHTML = offlineHTML("the questions"); });
  }
  var LIST = null;
  /* ---------- Study as: Questions, Learn or Flashcards (vault/tasks/2026-11-06-redesign-learn-and-flashcards.md). The
     panel picks which questions, the toggle picks how; saved in STATE.ui.qview like the panel. Learn and Flashcards are
     widget/study-modes.js and .css, fetched the first time either is opened (nothing new loads with the page). The mock
     is always questions: the toggle isn't drawn on it. ---------- */
  var VIEWS = [["questions", "Questions", "questions"], ["learn", "Learn", "learn"], ["cards", "Flashcards", "cards"]];
  function qview(){ var v = STATE.ui.qview; return v === "learn" || v === "cards" ? v : "questions"; }
  function viewHTML(){
    var v = qview();
    return '<div class="studyas" role="group" aria-labelledby="saL"><span class="lab" id="saL">Study as</span><span class="seg seg-study">' +
      VIEWS.map(function(x){ return '<button type="button" data-qview="' + x[0] + '" aria-pressed="' + (v === x[0]) + '">' + icon(x[2], 18) + "<span>" + x[1] + "</span></button>"; }).join("") + "</span></div>";
  }
  function drawQuestions(el, preset){
    var title = preset ? labelOf(SETS, preset) : "Questions";
    el.innerHTML = '<div class="hx-page bank"><div class="bank-head"><h1>' + esc(title) + "</h1></div>" +
      '<div class="bank-grid"><div class="bank-main">' + (preset === "mock" ? "" : viewHTML()) + panelHTML(preset) + '<div class="qsum" aria-live="polite"></div><div class="qlist" id="qlist"></div></div>' +
      '<aside class="bank-side" aria-label="Today">' + HX.todayPanel() + "</aside></div></div>";
    wirePanel(el, preset);
    $$("[data-qview]", el).forEach(function(b){ b.addEventListener("click", function(){
      var v = b.getAttribute("data-qview"); if (v === qview()) return;
      STATE.ui.qview = v; saveState(); track("bank:view=" + v); drawQuestions(el, preset);
      var nb = $('[data-qview="' + v + '"]', el); if (nb) nb.focus();
    }); });
    if (preset === "mock") { drawMock($("#qlist", el), el); return; }
    fill(el, preset);
    var v = qview();
    if (v === "learn") tip(el, "learn", "Learn asks each question until you get it right twice. Your progress is saved.");
    else if (v === "cards") tip(el, "cards", "Flip the card, then say how well you knew it. It comes back when you're about to forget it.");
    else tip(el, "bank", "Your filters and the set you pick are remembered next time; the tags under the panel show what's on.");
  }
  /* Learn and Flashcards, on first use: the module and its stylesheet together, then the set the panel picked */
  var SM = null, smLoad = null;
  function cssReady(href){
    return new Promise(function(res){
      var have = $('link[href="' + href + '"]'); if (have) { res(); return; }
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.onload = res; l.onerror = res;
      document.head.appendChild(l);
    });
  }
  function study(){
    var L = LIST; if (!L) return;
    var kind = qview();
    L.host.innerHTML = '<p class="note loading">' + (kind === "learn" ? "Getting Learn ready…" : "Shuffling the flashcards…") + "</p>";
    if (!smLoad) smLoad = Promise.all([HX.loadScript(HX.WIDGET + "study-modes.js"), cssReady(HX.WIDGET + "study-modes.css")]).then(function(){
      if (!SM && window.SH_STUDY) SM = window.SH_STUDY(HX);
      if (!SM) throw new Error("study-modes.js");
      return SM;
    });
    smLoad.then(function(M){
      if (LIST !== L || !L.host.isConnected) return;
      return (L.items.some(needsFig) ? needFigures() : Promise.resolve()).then(function(){ if (LIST === L && L.host.isConnected) M[kind](L); });
    }).catch(function(){
      smLoad = null;
      if (!L.host.isConnected) return;
      L.host.innerHTML = emptyHTML(kind === "learn" ? "Learn couldn't open" : "Flashcards couldn't open", "Check the connection and try again, or study these as questions.", '<button class="btn btn-primary" type="button" data-qview-back>Study as questions</button>');
      $("[data-qview-back]", L.host).addEventListener("click", function(){ STATE.ui.qview = "questions"; saveState(); drawQuestions(L.el, L.preset); });
    });
  }
  /* the list the panel picked, shown the way the toggle says */
  function show(){ if (qview() === "questions") page(); else study(); }
  function panelHTML(preset){
    var picked = lecIds(), sum = lecSummary(picked);
    normShow();
    var lkChip = function(k, lab){ var on = !preset && STATE.ui.qlikely === k; return '<button class="chip chip-tog" type="button" data-lk="' + k + '" aria-pressed="' + on + '"><span class="box" aria-hidden="true">' + icon("check", 14) + "</span>" + esc(lab) + ' <span class="n num">' + filtered({ lk: k }).length + "</span></button>"; };
    var showChip = function(k, lab){ var n = filtered({ st: k }).length; return '<button class="chip" type="button" data-show="' + k + '" aria-pressed="' + (!preset && (STATE.ui.qstatus || "all") === k) + '">' + esc(lab) + ' <span class="n num">' + n + "</span></button>"; };
    var setCount = { drill: "", misses: srsMisses().length, weak: weakList().length, mock: mockTotal() };
    var setChip = function(k, lab){ return '<a class="chip" href="#questions/' + k + '" data-set="' + k + '"' + (preset === k ? ' aria-current="page"' : "") + ">" + icon(k === "misses" ? "misses" : k, 16) + esc(lab) + (setCount[k] !== "" ? ' <span class="n num">' + setCount[k] + "</span>" : "") + "</a>"; };
    var fmts = FMTS.filter(function(f){ return HX.QS.some(function(q){ return isFmt(q, f[0]); }); });
    var srcs = Object.keys(HX.CORE.srcLabel || {}).filter(function(k){ return HX.QS.some(function(q){ return q.src === k; }); });
    var more = (STATE.ui.qfmt && STATE.ui.qfmt !== "all" ? 1 : 0) + (STATE.ui.qsrc && STATE.ui.qsrc !== "all" ? 1 : 0);
    return '<div class="qbar panel' + (preset ? " is-set" : "") + '" role="search" aria-label="Filter the questions">' +
      '<div class="qbar-row">' +
        '<div class="lp"><span class="lab" id="lpL">Lectures</span><button class="btn lp-btn" type="button" aria-expanded="false" aria-labelledby="lpL lpS" data-lp><span id="lpS">' + esc(sum) + "</span>" + icon("chevron", 16, "rot") + "</button>" +
          '<div class="lp-pop" hidden><div class="lp-acts"><button class="btn btn-text" type="button" data-lpall>' + esc((C.review || {}).allBtn || "All lectures") + '</button><button class="btn btn-text" type="button" data-lpnone>Untick all</button></div>' + ((C.review || {}).help ? '<p class="note lp-help">' + esc(C.review.help) + "</p>" : "") + "<ul>" +
          HX.LECS.map(function(l){ var on = picked.indexOf(l.id) > -1; return '<li><label><input type="checkbox" value="' + esc(l.id) + '"' + (on ? " checked" : "") + ">" + lecDot(l.id) + "<span>" + esc(lecName(l.id)) + '</span></label><button class="btn btn-text" type="button" data-only="' + esc(l.id) + '" aria-label="Only ' + esc(lecLabel(l)) + '">Only</button></li>'; }).join("") +
          "</ul></div></div>" +
        '<label class="search"><span class="sr">Search the questions</span>' + icon("search", 18) + '<input type="search" placeholder="Search the questions" value="' + esc(bankSearch) + '" data-search></label>' +
      "</div>" +
      '<div class="qbar-row chips"><span class="lab">Show</span><span class="chipset">' + SHOW.map(function(x){ return showChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row chips only"><span class="lab">Only</span><span class="chipset" role="group" aria-label="Only">' + LIKELY.map(function(x){ return lkChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row chips"><span class="lab">Sets</span><span class="chipset">' + SETS.map(function(x){ return setChip(x[0], x[1]); }).join("") + "</span></div>" +
      '<div class="qbar-row">' + (qview() === "questions" ? '<span class="lab">Order</span><span class="seg" role="group" aria-label="Order"><button type="button" data-order="in" aria-pressed="' + (STATE.ui.qorder !== "random") + '">In order</button><button type="button" data-order="random" aria-pressed="' + (STATE.ui.qorder === "random") + '">' + icon("shuffle", 16) + "Random</button></span>" : "") +
        '<details class="morefil"' + (STATE.ui.qmore ? " open" : "") + '><summary class="btn btn-text">' + icon("filter", 16) + "More filters" + (more ? ' <span class="badge num">' + more + " on</span>" : "") + "</summary>" +
        '<div class="morefil-body"><p class="lab">Question type</p><span class="chipset">' + [["all", "Any type"]].concat(fmts).map(function(f){ var n = f[0] === "all" ? "" : ' <span class="n num">' + filtered({ fm: f[0] }).length + "</span>"; return '<button class="chip" type="button" data-fmt="' + f[0] + '" aria-pressed="' + ((STATE.ui.qfmt || "all") === f[0]) + '">' + esc(f[1]) + n + "</button>"; }).join("") + "</span>" +
        '<p class="lab">Where it\'s from</p><span class="chipset">' + [["all", "Anywhere"]].concat(srcs.map(function(k){ return [k, HX.CORE.srcLabel[k]]; })).map(function(f){ return '<button class="chip" type="button" data-src="' + esc(f[0]) + '" aria-pressed="' + ((STATE.ui.qsrc || "all") === f[0]) + '">' + esc(f[1]) + "</button>"; }).join("") + "</span></div></details></div>" +
      "</div>";
  }
  function wirePanel(el, preset){
    var bar = $(".qbar", el), pop = $(".lp-pop", el), btn = $("[data-lp]", el);
    function redraw(k){ if (k) track("bank:" + k); STATE.ui.qset = ""; saveState(); if (preset) go("questions"); else drawQuestions(el, ""); }
    btn.addEventListener("click", function(){ var on = pop.hidden; pop.hidden = !on; btn.setAttribute("aria-expanded", String(on)); });
    document.addEventListener("click", function away(e){ if (!el.isConnected) { document.removeEventListener("click", away); return; } if (!pop.hidden && !e.target.closest(".lp")) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    pop.addEventListener("change", function(){ var ids = $$("input:checked", pop).map(function(c){ return c.value; }); STATE.ui.qlec = lecValue(ids); STATE.ui.qE1auto = false; saveState(); $("#lpS", el).textContent = lecSummary(ids); clearTimeout(pop.__t); pop.__t = setTimeout(function(){ if (!pop.hidden) { pop.hidden = true; } redraw("lec-pick"); }, 900); });
    $$("[data-only]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qlec = b.getAttribute("data-only"); STATE.ui.qE1auto = false; redraw("lec-only"); }); });
    $("[data-lpall]", el).addEventListener("click", function(){ STATE.ui.qlec = "all"; STATE.ui.qE1auto = false; redraw("lec-all"); });
    $("[data-lpnone]", el).addEventListener("click", function(){ $$("input", pop).forEach(function(c){ c.checked = false; }); STATE.ui.qlec = []; STATE.ui.qE1auto = false; saveState(); $("#lpS", el).textContent = "No lectures"; });
    $$("[data-show]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qstatus = b.getAttribute("data-show"); redraw("show=" + STATE.ui.qstatus); }); });
    $$("[data-lk]", el).forEach(function(b){ b.addEventListener("click", function(){ var k = b.getAttribute("data-lk"); setLk(!preset && STATE.ui.qlikely === k ? "" : k); redraw("show=" + (STATE.ui.qlikely || k + "-off")); }); });
    $$("[data-order]", el).forEach(function(b){ b.addEventListener("click", function(){ var o = b.getAttribute("data-order"); if (o === "random") STATE.ui.qseed = Math.floor(Math.random() * 2e9) + 1; STATE.ui.qorder = o; redraw("order=" + o); }); });
    $$("[data-fmt]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qfmt = b.getAttribute("data-fmt"); STATE.ui.qmore = 1; redraw("type=" + STATE.ui.qfmt); }); });
    $$("[data-src]", el).forEach(function(b){ b.addEventListener("click", function(){ STATE.ui.qsrc = b.getAttribute("data-src"); STATE.ui.qmore = 1; redraw("src=" + STATE.ui.qsrc); }); });
    $$("[data-set]", el).forEach(function(a){ a.addEventListener("click", function(){ track("bank:set=" + a.getAttribute("data-set")); }); });
    var mf = $(".morefil", el); mf.addEventListener("toggle", function(){ STATE.ui.qmore = mf.open ? 1 : 0; saveState(); if (mf.open) track("bank:more"); });
    var sb = $("[data-search]", el), st = 0;
    sb.addEventListener("input", function(){ bankSearch = sb.value; clearTimeout(st); st = setTimeout(function(){ if (preset) { STATE.ui.qset = ""; go("questions"); return; } fill(el, ""); track("bank:search"); }, 280); });
  }
  function weakList(){
    var rows = HX.LECS.map(lecProgress).filter(function(r){ return r.a >= 3; }).sort(function(a, b){ return a.pct - b.pct; });
    if (!HX.QS) return [];
    var out = [];
    rows.forEach(function(r){ (QBL[r.l.id] || []).forEach(function(x){ var s = ansOf(x.id); if (s && s.last === false) out.push(QBY[x.id]); }); });
    if (rows[0]) shuffled((QBL[rows[0].l.id] || []).filter(function(x){ return !ansOf(x.id); })).slice(0, 10).forEach(function(x){ out.push(QBY[x.id]); });
    return out.filter(Boolean);
  }
  function fill(el, preset){
    var host = $("#qlist", el), sumEl = $(".qsum", el);
    host.innerHTML = ""; LIST = { el: el, host: host, items: [], shown: 0, ctx: preset || "bank", notes: {}, preset: preset || "", all: 0 };
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
          LIST.items = (qview() === "questions" ? items.filter(function(it){ return !(s.res[it.id] === 1 || s.res[it.id] === 0); }) : items).map(function(it){ return QBY[it.id]; });
          if (!LIST.items.length) { host.innerHTML = drillDoneHTML(); wireDrillDone(el); return; }
          show();
        });
      });
      return;
    }
    if (preset === "misses") {
      var ids = srsMisses();
      LIST.items = ids.map(function(id){ return QBY[id]; }).filter(Boolean);
      sumEl.innerHTML = LIST.items.length ? '<p class="sumline"><b class="num">' + LIST.items.length + "</b> you missed yesterday and haven't tried again.</p>" : "";
      if (!LIST.items.length) { host.innerHTML = emptyHTML("No misses from yesterday", "Either you didn't miss any or you've already tried them again.", '<a class="btn" href="#questions" data-showset="missed">Every question you missed last time</a>'); wireEmpty(el); return; }
      show(); return;
    }
    if (preset === "weak") {
      var rows = HX.LECS.map(lecProgress).filter(function(r){ return r.a >= 3; }).sort(function(a, b){ return a.pct - b.pct; });
      LIST.items = weakList();
      sumEl.innerHTML = rows.length ? '<div class="weak-rows"><p class="lab">Your lectures by how much you get right</p><ul>' + rows.slice(0, 6).map(function(r){ return '<li class="' + lc(r.l.id).trim() + '"><span>' + lecDot(r.l.id) + esc(lecName(r.l.id)) + '</span><span class="bar"><i class="right" style="width:' + r.pct + '%"></i></span><span class="num">' + r.pct + "%</span></li>"; }).join("") + '</ul></div><p class="sumline">The questions you missed last time, weakest lecture first, then ' + (rows[0] ? "new ones from " + esc(lecLabel(rows[0].l)) : "new ones") + ".</p>" : "";
      if (!LIST.items.length) { host.innerHTML = emptyHTML("No weak spots yet", "Answer at least 3 questions from a lecture and it shows up here, ranked by how much you get right.", '<a class="btn btn-primary" href="#questions">Practice questions</a>'); return; }
      show(); return;
    }
    var all = HX.QS.filter(function(q){ return !isReview(q.lec); }).length, list = ordered(filtered());
    LIST.items = list; LIST.all = all;
    sumEl.innerHTML = summaryHTML(list, all);
    $$("[data-tagoff]", sumEl).forEach(function(b){ b.addEventListener("click", function(){ var k = b.getAttribute("data-tagoff"); if (k === "lec") { STATE.ui.qlec = "all"; STATE.ui.qE1auto = false; } if (k === "show") STATE.ui.qstatus = "all"; if (k === "lk") setLk(""); if (k === "fmt") STATE.ui.qfmt = "all"; if (k === "src") STATE.ui.qsrc = "all"; if (k === "search") bankSearch = ""; saveState(); track("bank:tag-off=" + k); drawQuestions(el, ""); }); });
    var ca = $("[data-clearall]", sumEl); if (ca) ca.addEventListener("click", function(){ bankReset(); bankSearch = ""; saveState(); track("bank:clear"); drawQuestions(el, ""); });
    if (!list.length) { host.innerHTML = emptyHTML("Nothing matches", emptyWhy(), '<button class="btn btn-primary" type="button" data-clearall>Show all ' + all + " questions</button>"); $("[data-clearall]", host).addEventListener("click", function(){ bankReset(); bankSearch = ""; saveState(); track("bank:clear"); drawQuestions(el, ""); }); return; }
    show();
  }
  function summaryHTML(list, all){
    var tags = [], picked = lecIds(), R = C.review || {};
    /* review-only questions are counted apart from the bank's total, as on the live hub: "of N" + "n Exam 1 review" */
    var nRev = list.filter(function(q){ return isReview(q.lec); }).length, n = list.length - nRev;
    if (!isDefaultLecs(picked)) tags.push(["lec", picked.length === 1 ? lecName(picked[0]) : picked.length === HX.LECS.length && R.tag ? R.tag : picked.length + " lectures"]);
    if (STATE.ui.qstatus && STATE.ui.qstatus !== "all") tags.push(["show", labelOf(SHOW, STATE.ui.qstatus)]);
    if (STATE.ui.qlikely) tags.push(["lk", labelOf(LIKELY, STATE.ui.qlikely)]);
    if (STATE.ui.qfmt && STATE.ui.qfmt !== "all") tags.push(["fmt", labelOf(FMTS, STATE.ui.qfmt)]);
    if (STATE.ui.qsrc && STATE.ui.qsrc !== "all") tags.push(["src", (HX.CORE.srcLabel || {})[STATE.ui.qsrc] || STATE.ui.qsrc]);
    if (bankSearch.trim()) tags.push(["search", "“" + bankSearch.trim() + "”"]);
    var line = !n && nRev ? 'Showing <b class="num">' + nRev + "</b> " + esc(R.count || "review") + " question" + (nRev === 1 ? "" : "s") :
      'Showing <b class="num">' + n + "</b> of " + all + " questions" + (nRev ? ' + <b class="num">' + nRev + "</b> " + esc(R.count || "review") : "");
    return '<p class="sumline">' + line + (STATE.ui.qorder === "random" ? ", in random order" : "") + "</p>" +
      (tags.length ? '<span class="tags">' + tags.map(function(t){ return '<button class="tagx" type="button" data-tagoff="' + t[0] + '" aria-label="Remove the filter ' + esc(t[1]) + '">' + esc(t[1]) + icon("close", 14) + "</button>"; }).join("") + '<button class="btn btn-text" type="button" data-clearall>Clear all</button></span>' : "");
  }
  /* what's in the way when the bank shows nothing, in the live hubs' words */
  function emptyWhy(){
    var st = STATE.ui.qstatus || "all", lk = STATE.ui.qlikely ? labelOf(LIKELY, STATE.ui.qlikely) + " " : "";
    var only = !(STATE.ui.qfmt && STATE.ui.qfmt !== "all") && !(STATE.ui.qsrc && STATE.ui.qsrc !== "all") && !bankSearch.trim();
    if (!lecIds().length) return "No lectures are ticked, so there is nothing to show.";
    var sp = lkSpec(STATE.ui.qlikely); if (sp && sp.lec && LBY[sp.lec] && lecIds().indexOf(sp.lec) === -1) return labelOf(LIKELY, STATE.ui.qlikely) + " questions are in " + lecName(sp.lec) + ", which isn't ticked under Lectures.";
    if (st === "pinned" && !pins().length) return "No pinned questions yet. Tap Pin on any question to save it here.";
    if (st === "missed" && only) return lk ? "You haven't missed any " + lk + "questions in these lectures. Questions you get wrong come back here." : "Nothing missed in these lectures. Questions you get wrong come back here.";
    if (st === "unseen" && only) return "You have answered every " + lk + "question here. Try Missed last time, or another lecture.";
    return "Those filters together leave no questions.";
  }
  function emptyHTML(t, p, act){ return '<div class="empty panel"><h2>' + esc(t) + "</h2><p>" + esc(p) + "</p>" + (act || "") + "</div>"; }
  function wireEmpty(el){ $$("[data-showset]", el).forEach(function(a){ a.addEventListener("click", function(){ STATE.ui.qstatus = a.getAttribute("data-showset"); STATE.ui.qlikely = ""; STATE.ui.qlec = "all"; STATE.ui.qE1auto = false; saveState(); }); }); }
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

  /* ---------- the mock: a preset of the bank that runs as a timed set with no feedback, then its results ---------- */
  /* the exam-format mock (core.mock.format, Perio's EXAM_FORMAT): so many Patient Box, select-all and ordering items, the
     rest multiple choice, drawn round-robin across the exam's lectures instead of by a per-lecture blueprint */
  function mockFormat(){ return (HX.CORE.mock || {}).format || null; }
  function mockTotal(){ var f = mockFormat(); if (f) return f.total; var b = (HX.CORE.mock || {}).blueprint || {}; return Object.keys(b).reduce(function(n, k){ return n + b[k]; }, 0); }
  /* a blueprint key is a lecture id or a group the exam counts together (core.mock.groups, the live hub's EXAM_GROUPS:
     Heme & Endo Exam 2's L12a and L12b share their 9) */
  function mockLecs(k){ return ((HX.CORE.mock || {}).groups || {})[k] || [k]; }
  function mockLecIds(){ if (mockFormat()) return HX.LECS.filter(function(l){ return isExamLec(l.id); }).map(function(l){ return l.id; }); var bp = (HX.CORE.mock || {}).blueprint || {}; return Object.keys(bp).reduce(function(a, k){ return a.concat(mockLecs(k)); }, []); }
  function formatMock(){
    var f = mockFormat(), all = HX.IDX.filter(function(r){ return isExamLec(r.lec); }).map(function(r){ return QBY[r.id]; }).filter(Boolean);
    var fresh = function(q){ var r = ansOf(q.id); return !r || r.last === false; };
    /* round-robin across the lectures, each lecture's unseen and missed questions first */
    function rr(qs, n){
      var by = {}; qs.forEach(function(q){ (by[q.lec] = by[q.lec] || []).push(q); });
      Object.keys(by).forEach(function(k){ var a = shuffled(by[k]); by[k] = a.filter(fresh).concat(a.filter(function(q){ return !fresh(q); })); });
      var keys = shuffled(Object.keys(by)), out = [];
      while (out.length < n && keys.some(function(k){ return by[k].length; })) keys.forEach(function(k){ if (out.length < n && by[k].length) out.push(by[k].shift()); });
      return out;
    }
    var pb = rr(all.filter(function(q){ return q.pbox && q.type === "mcq"; }), f.pbox || 0);
    var mu = rr(all.filter(function(q){ return q.type === "multi" && !q.pbox; }), f.multi || 0);
    var od = rr(all.filter(function(q){ return q.type === "sequence" && q.steps.length > 2; }), f.order || 0);
    var mc = rr(all.filter(function(q){ return q.type === "mcq" && !q.pbox; }), f.total - pb.length - mu.length - od.length);
    var order = {}, oc = {};
    pb.concat(mc).forEach(function(q){ order[q.id] = choiceOrder(q); });
    mu.forEach(function(q){ order[q.id] = shuffled(q.choices.map(function(c, k){ return k; })); });
    /* the exam's ordering item: one pick among orderings, near misses (two neighbors swapped, the reverse) beside the right one */
    od.forEach(function(q){
      var key = function(a){ return a.join(" → "); }, right = key(q.steps), seen = {}, alts = []; seen[right] = 1;
      shuffled(q.steps.slice(0, -1).map(function(x, i){ var a = q.steps.slice(); a[i] = q.steps[i + 1]; a[i + 1] = q.steps[i]; return a; }).concat([q.steps.slice().reverse()]))
        .forEach(function(a){ var k = key(a); if (!seen[k] && alts.length < 3) { seen[k] = 1; alts.push(k); } });
      oc[q.id] = { stem: String(q.stem).replace(/^Put /, "Select the right order: ").replace(/ in order(,|\.)/, "$1"), choices: [right].concat(alts), answer: 0 };
      order[q.id] = shuffled(oc[q.id].choices.map(function(c, k){ return k; }));
    });
    STATE.mock = { ids: shuffled(pb.concat(mu, od, mc).map(function(q){ return q.id; })), t0: Date.now(), picks: {}, order: order, oc: oc, res: {}, pts: {}, submitted: false };
    saveNow(); mockSession();
  }
  function buildMock(){
    if (mockFormat()) return formatMock();
    var ids = [], bp = HX.CORE.mock.blueprint, lo = HX.CORE.mock.likelyOnly || {};
    Object.keys(bp).forEach(function(lec){
      var pool = mockLecs(lec).reduce(function(a, l){ return a.concat(QBL[l] || []); }, []).map(function(r){ return QBY[r.id]; }).filter(function(q){ return q && q.type === "mcq"; });
      /* a lecture in core.mock.likelyOnly gives only its High likelihood questions, drawn at random (Heme & Endo Exam 2's
         five Exam 1 questions, Sam, 2026-11-10); none, and it falls back to the whole lecture */
      var hl = lo[lec] ? pool.filter(function(q){ return q.likely; }) : [];
      if (hl.length) { shuffled(hl).slice(0, bp[lec]).forEach(function(q){ ids.push(q.id); }); return; }
      var fresh = shuffled(pool.filter(function(q){ var r = ansOf(q.id); return !r || r.last === false; }));
      var rest = shuffled(pool.filter(function(q){ return fresh.indexOf(q) === -1; }));
      fresh.concat(rest).slice(0, bp[lec]).forEach(function(q){ ids.push(q.id); });
    });
    var order = {}; ids.forEach(function(id){ order[id] = choiceOrder(QBY[id]); });
    STATE.mock = { ids: shuffled(ids), t0: Date.now(), picks: {}, order: order, res: {}, submitted: false };
    saveNow(); mockSession();
  }
  /* the game layer (widget/v3.js, shGame): the server pays a mock's answers, which arrive together at the end, and its
     +50 only inside a session it started when the mock did, and saves the score itself when the session is finished.
     A session lasts six hours; a mock handed in later is recorded the way the live hubs do it. */
  function mockSession(){
    var m = STATE.mock, G = window.shGame;
    if (!m || !G || !G.startSession) return;
    G.startSession("mock").then(function(id){ if (id && STATE.mock === m && !m.submitted) { m.sid = id; saveState(); } });
  }
  function mockSid(m){ return m.sid && window.shGame && window.shGame.finishSession && Date.now() - m.t0 < 5.9 * 3600e3 ? m.sid : null; }
  var mockTimer = 0;
  function drawMock(host, el){
    clearInterval(mockTimer);
    var m = STATE.mock, total = mockTotal(), lim = HX.CORE.mock.limit || 0, X = C.mock || {};
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
    var F = !!mockFormat(), oc = m.oc || {}, pts = m.pts || {};
    var has = function(id){ var p = m.picks[id]; return Array.isArray(p) ? p.length > 0 : p !== undefined && p !== null; };
    var picked = m.ids.filter(has).length, correct = m.submitted ? m.ids.filter(function(id){ return m.res[id]; }).length : 0;
    /* the format mock scores select-all items with partial credit, so its total is in points */
    var points = m.ids.reduce(function(n, id){ return n + (pts[id] || 0); }, 0), p1 = function(x){ return String(Math.round(x * 10) / 10); };
    var top = '<div class="mock-bar panel"><span class="clock num" data-clock>' + icon("clock", 18) + "0:00</span>" +
      (m.submitted ? '<span class="score num">' + (F ? "<b>" + p1(points) + " of " + m.ids.length + "</b> points · " + Math.round(points / m.ids.length * 100) + "%" : "<b>" + correct + " of " + m.ids.length + "</b> right · " + Math.round(correct / m.ids.length * 100) + "%") + "</span>" +
        '<button class="btn" type="button" data-onlymissed aria-pressed="' + !!m.onlyMissed + '">' + (m.onlyMissed ? "Show every question" : "Show only the misses") + "</button>"
        : '<span class="num" data-prog>' + picked + " of " + m.ids.length + ' answered</span><button class="btn btn-primary" type="button" data-submit>Submit the exam</button>') +
      '<button class="btn btn-text" type="button" data-newmock>New mock</button></div>';
    var byLec = m.submitted ? '<div class="panel"><h2>By lecture</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Lecture</th><th scope="col" class="r">Right</th><th scope="col" class="r">Score</th></tr></thead><tbody>' + mockLecIds().map(function(lec){
      var qs = m.ids.filter(function(id){ return QBY[id] && QBY[id].lec === lec; }), c = F ? qs.reduce(function(n, id){ return n + (pts[id] || 0); }, 0) : qs.filter(function(id){ return m.res[id]; }).length;
      if (F && !qs.length) return "";
      return '<tr><th scope="row">' + lecDot(lec) + esc(lecName(lec)) + '</th><td class="r num">' + (F ? p1(c) : c) + " of " + qs.length + '</td><td class="r num">' + (qs.length ? Math.round(c / qs.length * 100) : 0) + "%</td></tr>"; }).join("") + "</tbody></table></div></div>" : "";
    host.innerHTML = top + byLec;
    m.ids.forEach(function(id, i){
      var q = QBY[id]; if (!q) return;
      if (m.submitted && m.onlyMissed && m.res[id]) return;
      var o2 = oc[id], multi = q.type === "multi", choices = o2 ? o2.choices : q.choices, ans = o2 ? o2.answer : q.answer;
      var pick = id in m.picks ? m.picks[id] : null, picks = multi ? (pick || []) : [], order = (m.order && m.order[id]) || choices.map(function(c, k){ return k; });
      var none = multi ? !picks.length : pick === null, pp = pts[id] || 0;
      var el2 = h('<article class="qcard qc' + lc(q.lec) + (m.submitted ? " is-answered" : "") + '" data-qid="' + esc(q.id) + '" data-qtype="' + (multi ? "multi" : "mcq") + '" data-ctx="mock" aria-labelledby="mk' + i + '"></article>');
      el2.innerHTML = '<header class="qc-head"><span class="qc-meta"><span class="qc-lec" id="mk' + i + '">Question ' + (i + 1) + " · " + lecChip(q.lec) + "</span>" + (multi ? '<span class="qc-flag">Select all that apply · partial credit</span>' : o2 ? '<span class="qc-flag">Ordering</span>' : "") + '</span><span class="qcard-top qc-tools"></span></header>' + figHTML(q) + pboxHTML(q) + stemHTML(o2 ? { stem: o2.stem } : q) +
        '<ul class="qc-choices' + (q.fmt === "tf" ? " qc-tf" : "") + '">' + order.map(function(k){
          var on = multi ? picks.indexOf(k) > -1 : k === pick, good = multi ? q.correct.indexOf(k) > -1 : k === ans;
          var st = m.submitted ? (good && (on || !multi) ? "right" : on ? "wrong" : good ? "missed" : "") : "";
          return '<li><button class="ch' + (multi ? " has-box" : "") + (st === "right" ? " is-right" : st === "wrong" ? " is-wrong" : st === "missed" ? " is-missed" : "") + '" type="button" data-mock-pick="' + k + '" aria-pressed="' + on + '"' + (m.submitted ? ' aria-disabled="true"' : "") + ">" + (multi ? mark("box", m.submitted ? (st === "missed" ? "missed" : st) : "") : "") + '<span class="txt">' + esc(choices[k]) + '</span><span class="st-ic" aria-hidden="true">' + (st && !multi ? icon(st === "wrong" ? "cross" : "check", 20) : "") + "</span></button></li>"; }).join("") + "</ul>" +
        (m.submitted ? '<section class="qc-result qcard-explain" data-role="explain"><p class="verdict ' + (none ? "no" : m.res[id] ? "ok" : F && pp > 0 ? "part" : "no") + '">' + icon(m.res[id] ? "check" : F && pp > 0 ? "goal" : "cross", 26) + (none ? "Not answered" : m.res[id] ? "Right" : F && pp > 0 ? "Partly right: " + Math.round(pp * 100) + "% credit" : "Missed") + "</p>" + figAfterHTML(q) +
          (o2 ? '<ol class="qc-order">' + q.steps.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" : "") + '<p class="qc-ex">' + esc(q.ex || "") + "</p>" + (o2 ? "" : whyHTML(q, multi ? picks : none ? [] : [pick])) + "</section>" : '<section class="qcard-explain" data-role="explain" hidden></section>');
      host.appendChild(el2);
    });
    if (!m.submitted) host.appendChild(h('<div class="mock-foot panel"><span class="num" data-prog>' + picked + " of " + m.ids.length + ' answered</span><button class="btn btn-primary" type="button" data-submit>Submit the exam</button></div>'));
    host.onclick = function(e){
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-mock-pick") && !m.submitted) {
        var c = b.closest(".qcard"), id = c.getAttribute("data-qid"), k = +b.getAttribute("data-mock-pick");
        if (QBY[id] && QBY[id].type === "multi") {
          var arr = Array.isArray(m.picks[id]) ? m.picks[id] : [], at = arr.indexOf(k);
          if (at > -1) arr.splice(at, 1); else arr.push(k);
          m.picks[id] = arr; b.setAttribute("aria-pressed", String(at < 0));
        } else { m.picks[id] = k; $$("[data-mock-pick]", c).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); }
        saveState();
        $$("[data-prog]", host).forEach(function(p){ p.textContent = m.ids.filter(has).length + " of " + m.ids.length + " answered"; });
        $$("[data-submit][data-confirm]", host).forEach(function(s){ s.removeAttribute("data-confirm"); s.textContent = "Submit the exam"; });
      } else if (b.hasAttribute("data-submit")) {
        var left = m.ids.length - m.ids.filter(has).length;
        if (left > 0 && !b.getAttribute("data-confirm")) { b.setAttribute("data-confirm", "1"); b.textContent = left + " unanswered: submit anyway?"; return; }
        m.submitted = true; m.tEnd = Date.now(); m.res = {}; m.pts = pts = {};
        var sid = mockSid(m);
        m.ids.forEach(function(id){
          var q = QBY[id]; if (!q) return;
          if (q.type === "multi") {
            var pk = Array.isArray(m.picks[id]) ? m.picks[id] : [], hit = pk.filter(function(i){ return q.correct.indexOf(i) > -1; }).length;
            pts[id] = pk.length ? Math.max(0, (hit - (pk.length - hit)) / q.correct.length) : 0; m.res[id] = pts[id] === 1;
            if (pk.length) HX.recordAnswer(q.id, q.lec, m.res[id], "mock", null, pk, { session: sid });
            return;
          }
          var ok = has(id) && m.picks[id] === (oc[id] ? oc[id].answer : q.answer); m.res[id] = ok; pts[id] = ok ? 1 : 0;
          /* an ordering item is one pick among orderings here; the server grades a sequence by its order, so the right
             pick sends the steps in order and any other pick sends two of them swapped */
          var seq = oc[id] && q.steps ? q.steps.map(function(x, k){ return ok ? k : k === 0 ? 1 : k === 1 ? 0 : k; }) : null;
          if (has(id)) HX.recordAnswer(q.id, q.lec, ok, "mock", oc[id] ? null : m.picks[id], null, { session: sid, order: seq });
        });
        var nRight = m.ids.filter(function(id){ return m.res[id]; }).length;
        var byL = mockLecIds().map(function(lec){ var qs = m.ids.filter(function(id){ return QBY[id] && QBY[id].lec === lec; }); return { label: lecName(lec), correct: qs.filter(function(id){ return m.res[id]; }).length, total: qs.length }; });
        document.dispatchEvent(new CustomEvent("sh:mock-done", { detail: { correct: nRight, total: m.ids.length, byLec: byL, session: sid } }));
        if (sid) window.shGame.finishSession(sid, nRight, m.ids.length);
        saveNow(); HX.paintMeters(); track("mock:submit"); drawMock(host, el); window.scrollTo(0, 0);
      } else if (b.hasAttribute("data-onlymissed")) { m.onlyMissed = !m.onlyMissed; saveState(); drawMock(host, el); }
      else if (b.hasAttribute("data-newmock")) { STATE.mock = null; saveState(); drawMock(host, el); }
    };
    var clock = $("[data-clock]", host);
    function tick(){ if (!clock.isConnected) { clearInterval(mockTimer); return; } var sec = Math.floor(((m.tEnd || Date.now()) - m.t0) / 1000); clock.innerHTML = icon("clock", 18) + Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0") + " of " + Math.floor(lim / 60) + ":" + String(lim % 60).padStart(2, "0"); clock.classList.toggle("is-over", sec > lim); }
    tick(); if (!m.submitted) mockTimer = setInterval(tick, 1000);
    if (HX.FIG && HX.FIG.ANIMA) { try { HX.FIG.ANIMA.mount(host); } catch (e) {} }
  }

  /* what the other files call from here */
  HX.figKeyHTML = figKeyHTML; HX.card = card; HX.bankReset = bankReset; HX.presetOf = presetOf;
  /* for Learn and Flashcards (widget/study-modes.js): the card's parts, the bank's order and the bank to redraw */
  HX.qParts = { choiceOrder: choiceOrder, stemHTML: stemHTML, pboxHTML: pboxHTML, figHTML: figHTML, figAfterHTML: figAfterHTML, whyHTML: whyHTML, likelyTag: likelyTag, emptyHTML: emptyHTML };
  HX.drawQuestions = drawQuestions; HX.qview = qview;
  HX.lecValue = lecValue; HX.filtered = filtered; HX.renderQuestions = renderQuestions; HX.mockTotal = mockTotal;
  Object.defineProperty(HX, "bankSearch", { get: function(){ return bankSearch; }, set: function(v){ bankSearch = v; }, enumerable: true });
};
