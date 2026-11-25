/* study-hubs motion layer. widget/v3.js loads this in every hub and calls shFx.mount(window.shEggHooks).
   Small motion for the things that happen all the time, so studying feels responsive without slowing anyone down
   (the big moments, rank-ups, trophies and the mock results card, live in widget/rankup.js):

   - Answer feedback. Answer a question card and its explanation slides open: it watches for the card's .is-answered right
     after a tap inside that card, so cards drawn already answered (filters, mock results) stay still. The engine marks the
     choices itself (widget/hub.css); the marks this drew on the old pages' choices (.qcard-choice) came out on 2026-11-25.
   - Streak flame. From 3 right in a row (v3.js's session streak, sent as sh:streak) a flame in the bottom-right counts
     the run, with a ring filling toward 100 (the tactical nuke). It grows and changes color at 5, 10, 25, 50 and 100
     and fizzles out when the run breaks. Off with Settings -> Extras -> Streak flame; hidden on the mock exam tab and in the arcade.
   - Progress bars (.bar, the rank and mastery bars) fill from where they were, or from empty the first time they show,
     instead of jumping.
   - Switching modes, tabs and lectures fades the new content in.
   - Mock exams. On sh:mock-done ({ correct, total, byLec }) it asks widget/rankup.js for the results card, with this
     device's best score in the hub (sh_mock_best_<hub>).
   Reduced motion (or Settings -> Extras -> Answer animations off) keeps the results card and drops the rest. */
(function(){
  "use strict";
  if (window.shFx) return;
  var H = null;
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  /* Settings → Extras → Answer animations off works like reduced motion: the results card stays, motion goes */
  function still(){ return !!(RM && RM.matches) || pref("sh_pref_fx") === "off"; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function pref(k){ try { return localStorage.getItem(k) || "on"; } catch (e) { return "on"; } }
  function flameOn(){ return pref("sh_pref_flame") !== "off"; }
  function section(){ try { return String(H && H.section ? H.section() : "").toLowerCase(); } catch (e) { return ""; } }
  function anim(el, frames, opt){ if (!still() && el && el.animate) { try { return el.animate(frames, opt); } catch (e) {} } return null; }

  /* ---------- answer feedback: the explanation opens ---------- */
  var tap = null, pendEx = [], flushing = false;
  function gained(r, cls){
    return (" " + (r.target.getAttribute("class") || "") + " ").indexOf(" " + cls + " ") >= 0 && (" " + (r.oldValue || "") + " ").indexOf(" " + cls + " ") < 0;
  }
  function answerRec(r){
    var t = r.target;
    if (t.nodeType !== 1 || r.attributeName !== "class" || !tap.card.contains(t)) return;
    var ex = t.matches(".qcard") && gained(r, "is-answered") ? t.querySelector(".qcard-explain") : null;
    if (ex && pendEx.indexOf(ex) < 0) { pendEx.push(ex); schedule(); }
  }
  function schedule(){ if (!flushing) { flushing = true; requestAnimationFrame(flush); } }
  function flush(){
    flushing = false;
    var exs = pendEx; pendEx = [];
    exs.forEach(function(ex){ openExplain(ex, 0); });
  }
  /* the explanation grows open from nothing instead of appearing all at once */
  function openExplain(ex, delay){
    if (!ex || !ex.isConnected || !ex.offsetHeight || still() || !ex.animate) return;
    var cs = getComputedStyle(ex), h = ex.offsetHeight;
    if (cs.boxSizing !== "border-box") h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    anim(ex, [
      { height: "0px", paddingTop: "0px", paddingBottom: "0px", marginTop: "0px", opacity: 0, overflow: "hidden" },
      { height: Math.max(0, h) + "px", paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginTop: cs.marginTop, opacity: 1, overflow: "hidden" }
    ], { duration: 340, delay: delay || 0, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
  }

  /* ---------- progress bars ---------- */
  var BAR_SEL = ".bar > i, .sh-rank-bar > i, .sh-mastery-bar > i";
  var barMem = {};
  function barKey(bar){
    var host = bar.parentElement, row = host && host.parentElement, scope = bar.closest("[id]");
    var label = row ? (row.textContent || "").replace(/[\d%.,/·:()+\-]+/g, " ").replace(/\s+/g, " ").trim() : "";
    return (scope ? scope.id : "") + "|" + (host ? host.className : "") + "|" + (label.length <= 80 ? label : "");
  }
  /* every bar is measured first and animated after: an animation started between two measurements made the browser lay
     the page out again for the next bar, which on Home's progress (two bars a lecture, 140 on Review of Systems) blocked
     a slow phone for a third of a second (2026-11-20) */
  var barQ = [];
  function fillBars(nodes){
    var todo = [];
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n], bars = node.matches(BAR_SEL) ? [node] : node.querySelectorAll(BAR_SEL);
      for (var i = 0; i < bars.length; i++) {
        var bar = bars[i], to = bar.style.width;
        if (!to || to.indexOf("%") < 0 || !bar.getClientRects().length) continue;   // hidden: fill it when it shows
        var key = barKey(bar), from = Object.prototype.hasOwnProperty.call(barMem, key) ? barMem[key] : "0%";
        barMem[key] = to;
        if (from !== to) todo.push([bar, from, to, i]);
      }
    }
    todo.forEach(function(b){ anim(b[0], [{ width: b[1] }, { width: b[2] }], { duration: 900, delay: Math.min(b[3], 8) * 45, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }); });
  }

  /* ---------- view fades: modes, tabs, lectures ---------- */
  var NAV_ATTRS = ["data-mode", "data-sub", "data-lec", "data-go", "data-qs", "data-view"];
  var NAV_SEL = NAV_ATTRS.map(function(a){ return "[" + a + "]"; }).join(", ") + ', [role="tab"]';
  var NAV_SKIP = ".qcard, #shstat-root, .gm-stage, [data-overlay], .sh-mk, .sh-ru";
  var nav = null;
  function navClick(e){
    var b = e.target && e.target.closest ? e.target.closest(NAV_SEL) : null;
    if (!b || b.closest(NAV_SKIP)) return;
    var kind = '[role="tab"]';
    for (var i = 0; i < NAV_ATTRS.length; i++) if (b.hasAttribute(NAV_ATTRS[i])) { kind = "[" + NAV_ATTRS[i] + "]"; break; }
    nav = { added: [], shown: [], kind: kind };
    requestAnimationFrame(function(){ var n = nav; nav = null; if (n) fadeIn(n); });
  }
  function fadeIn(n){
    if (still()) return;
    var els = n.shown.length ? n.shown : n.added.filter(function(el, i){
      return n.added.indexOf(el) === i && el !== document.body && el.isConnected && !el.closest(NAV_SKIP) && el.offsetHeight >= 80;
    });
    if (!n.shown.length) {
      /* the largest redrawn area that doesn't hold the row of tabs that was tapped (so the tabs don't blink);
         if every redrawn area holds them, the innermost one */
      var rest = els.filter(function(el){ return !el.querySelector(n.kind); });
      els = rest.length ? rest.filter(function(el){ return !rest.some(function(o){ return o !== el && o.contains(el); }); })
        : els.filter(function(el){ return !els.some(function(o){ return o !== el && el.contains(o); }); });
    }
    els.forEach(function(el){ anim(el, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.3,1)" }); });
  }

  /* ---------- one observer for all three ---------- */
  function watch(){
    new MutationObserver(function(recs){
      var live = tap && performance.now() <= tap.until, fill = [];
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === "childList") {
          var any = false;
          for (var j = 0; j < r.addedNodes.length; j++) { var n = r.addedNodes[j]; if (n.nodeType === 1) { any = true; fill.push(n); } }
          if (any && nav && r.target.nodeType === 1) nav.added.push(r.target);
        } else if (r.attributeName === "hidden") {
          if (nav && !r.target.hidden) nav.shown.push(r.target);
          if (!r.target.hidden) fill.push(r.target);
        } else if (live) answerRec(r);
      }
      /* measured just before the next frame, once for everything added since: a page redrawn twice in a row (Home, then
         the synced answers) is laid out once, outside the script that drew it */
      if (fill.length) { if (!barQ.length) requestAnimationFrame(function(){ var q = barQ; barQ = []; fillBars(q); }); barQ.push.apply(barQ, fill); }
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "hidden"] });
    document.addEventListener("click", function(e){
      var c = e.target && e.target.closest ? e.target.closest(".qcard") : null;
      tap = c ? { card: c, until: performance.now() + 900 } : null;
      navClick(e);
    }, true);
    /* bars already on the page when this loads */
    fillBars([document.body]);
  }

  /* ---------- streak flame ---------- */
  var FIRE_O = "M12 21.5c3.9 0 6.5-2.6 6.5-6.1 0-3.7-2.6-5.7-3.7-9.1-.4 2-1.5 3.4-2.8 4 .2-2.9-1-5.7-3.5-7.3.3 3.4-3 5.9-3 10.1 0 3.8 2.6 8.4 6.5 8.4z";
  var FIRE_I = "M12 21c2 0 3.4-1.4 3.4-3.2 0-1.9-1.3-2.9-1.9-4.7-.4 1.3-1.1 1.9-1.8 2.2.1-1.6-.5-3-1.8-3.8.2 1.8-1.6 3.1-1.6 5.3 0 2.4 1.6 4.2 3.7 4.2z";
  var flame = null, flOut = 0;
  function flTier(n){ return n >= 100 ? 6 : n >= 50 ? 5 : n >= 25 ? 4 : n >= 10 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0; }
  function flameEl(){
    if (flame) return flame;
    flame = document.createElement("div");
    flame.id = "sh-flame"; flame.className = "sh-flame"; flame.setAttribute("aria-hidden", "true");
    flame.innerHTML = '<span class="sh-flame-ic"><svg class="sh-flame-ring" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="19.5"/><circle class="fg" cx="22" cy="22" r="19.5" pathLength="100"/></svg>' +
      '<svg class="sh-flame-fire" viewBox="0 0 24 24"><path class="o" d="' + FIRE_O + '"/><path class="i" d="' + FIRE_I + '"/></svg>' +
      '<i class="sh-flame-smoke"></i><i class="sh-flame-smoke"></i><i class="sh-flame-smoke"></i></span>' +
      '<span class="sh-flame-txt"><b class="sh-flame-n">0</b><small>in a row</small></span>';
    document.body.appendChild(flame);
    return flame;
  }
  function flameGrow(n, prev){
    var el = flameEl(), t = flTier(n), was = flTier(prev), shown = el.classList.contains("is-on") && !el.classList.contains("is-fizz");
    clearTimeout(flOut);
    el.classList.remove("is-fizz", "t1", "t2", "t3", "t4", "t5", "t6"); el.classList.add("t" + t);
    el.querySelector(".sh-flame-n").textContent = n;
    el.querySelector(".sh-flame-txt small").textContent = n >= 100 ? "nuke ready" : "in a row";
    el.querySelector(".sh-flame-ring .fg").style.strokeDashoffset = String(100 - Math.min(100, n));
    if (!shown) { el.classList.remove("is-on"); void el.offsetWidth; el.classList.add("is-on"); return; }
    anim(el.querySelector(".sh-flame-n"), [{ transform: "translateY(-3px) scale(1.4)" }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,1.5,.4,1)" });
    anim(el.querySelector(".sh-flame-fire"), [{ transform: "scale(1.25)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,1.5,.4,1)" });
    if (t > was) flameTierUp(el);
  }
  /* a new color: the ring flashes and sparks fly out of the flame */
  function flameTierUp(el){
    if (still()) return;
    var ic = el.querySelector(".sh-flame-ic"), c = getComputedStyle(el).getPropertyValue("--fo").trim() || "#FF7A1A";
    anim(el, [{ boxShadow: "0 0 0 0 " + c }, { boxShadow: "0 0 0 14px transparent" }], { duration: 800, easing: "ease-out" });
    for (var i = 0; i < 9; i++) {
      var s = document.createElement("i"), a = (i / 9) * Math.PI * 2 - Math.PI / 2, d = 26 + Math.random() * 16;
      s.className = "sh-flame-spark"; ic.appendChild(s);
      var an = anim(s, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + (Math.cos(a) * d).toFixed(1) + "px," + (Math.sin(a) * d).toFixed(1) + "px) scale(.2)", opacity: 0 }],
        { duration: 600 + Math.random() * 300, easing: "cubic-bezier(.1,.7,.3,1)" });
      if (an) an.onfinish = (function(x){ return function(){ x.remove(); }; })(s); else s.remove();
    }
  }
  function flameFizzle(){
    if (!flame || !flame.classList.contains("is-on")) return;
    var el = flame;
    el.classList.add("is-fizz");
    el.querySelector(".sh-flame-txt small").textContent = "run over";
    clearTimeout(flOut);
    flOut = setTimeout(function(){ el.classList.remove("is-on", "is-fizz"); }, still() ? 900 : 1500);
  }
  function flameHide(){ if (flame) { clearTimeout(flOut); flame.classList.remove("is-on", "is-fizz"); } }

  /* ---------- mock exam results ---------- */
  function showMissed(){
    setTimeout(function(){
      var b = document.getElementById("mockMissed");
      if (b) { if (b.getAttribute("aria-pressed") !== "true") b.click(); return; }
      var l = document.getElementById("examMissedList"), h = l && l.previousElementSibling;
      if (l) (h || l).scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
    }, 80);
  }
  function mockDone(e){
    var d = e.detail || {};
    if (!(d.total > 0) || !window.shRanks || !window.shRanks.celebrate) return;
    var key = "sh_mock_best_" + H.hub, prev = null, p = d.correct / d.total;
    try { var v = JSON.parse(ls(key) || "null"); if (v && typeof v.p === "number") prev = v.p; } catch (er) {}
    if (prev === null || p > prev) ls(key, JSON.stringify({ p: p, n: d.total, at: Date.now() }));
    window.shRanks.celebrate("mock", {
      correct: d.correct | 0, total: d.total | 0, prev: prev, quiet: pref("sh_pref_celebrate") === "off", missed: showMissed,
      hub: window.shRanks.hubName ? window.shRanks.hubName(H.hub) : "", byLec: Array.isArray(d.byLec) ? d.byLec : []
    });
  }

  function mount(hooks){
    if (H || !hooks) return;
    H = hooks;
    watch();
    document.addEventListener("sh:streak", function(e){
      var d = e.detail || {}, n = d.n | 0, prev = d.prev | 0;
      if (!flameOn()) { flameHide(); return; }
      if (n > prev) { if (n >= 3) flameGrow(n, prev); }
      else if (prev >= 3) flameFizzle();
    });
    document.addEventListener("sh:pref", function(){ if (!flameOn()) flameHide(); });
    /* like Timmy Tooth, the flame steps aside on the mock exam tab, and it stays off arcade boards and fullscreen */
    setInterval(function(){ if (flame) flame.classList.toggle("is-away", /(^|\/)(mock|arcade)/.test(section()) || !!document.fullscreenElement); }, 1500);
    document.addEventListener("sh:mock-done", mockDone);
  }
  window.shFx = { mount: mount };
})();
