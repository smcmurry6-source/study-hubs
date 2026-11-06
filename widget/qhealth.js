/* ============ QUESTION HEALTH (loaded by widget/v3.js; vault/reference/question-health.md) ============
   Measures how each question behaves, so the admin page (review/ -> Question health) can flag likely problems for
   Sam to look at. Nothing here, or on the server, ever changes or hides a question: flags are for review only.

   Per question card (.qcard[data-qid], in the bank, the drill, Weak Spots, the mock):
     - time before answering: active time while it is the card being read (the visible card nearest the reading line,
       or the one last tapped), only while the tab is visible and someone has touched, scrolled or typed in the last
       2 minutes;
     - abandonment: stretches of 3 s or more on a card that wasn't answered ('view' rows; the server counts a person who
       read it 8 s or more and never answered it);
     - the answer: which try it is for this person (their history comes from the progress sync, get_my_answers),
       their previous result and how long ago, the choice, right or wrong;
     - the explanation: active time on the card after answering, and taps inside the explanation;
     - feedback: "Good question?" thumbs under the explanation, with a reason on a thumbs down (qh_vote). "Something
       else" opens the Report panel, as before.
   Every row carries the question's version: a fingerprint of what the hub exports for it (SH_EXPORT.questions: stem,
   choices, key, explanation), so an edited question starts fresh numbers. fp() is also used by review/.
   Rows go out in batches to record_qh (migration_v51): every 30 s, at 20 rows, and when the tab is hidden. Automated
   browsers send nothing. ============ */
(function(){
  if (window.shQH) return;

  /* ---------- version fingerprint: 53-bit string hash (cyrb53) of the exported question, minus id and lecture ---------- */
  function hash(str){
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function fp(q){
    if (!q || typeof q !== "object") return "";
    var keys = Object.keys(q).filter(function(k){ return k !== "id" && k !== "lec"; }).sort();
    return hash(JSON.stringify(keys.map(function(k){ return [k, q[k] === undefined ? null : q[k]]; })));
  }
  var NUM_CHOICE = /^\d+( only| and \d+ only|(, \d+)+ and \d+)$/;
  /* mcq, mcq:tf, mcq:2stmt, mcq:num, multi, match, sequence, recall: lets the server compare like with like */
  function kindOf(q, cardType){
    var t = cardType || (q && Array.isArray(q.correct) ? "multi" : q && q.choices && q.answer != null ? "mcq" : "");
    if (t !== "mcq" || !q) return t;
    var s = String(q.text || "");
    if (/^\s*true or false/i.test(s)) return "mcq:tf";
    if (/^\s*read the two statements/i.test(s)) return "mcq:2stmt";
    if ((q.choices || []).length && q.choices.every(function(c){ return NUM_CHOICE.test(String(c)); })) return "mcq:num";
    return "mcq";
  }

  var meta = null;
  function metaOf(qid){
    if (!meta) {
      var qs = window.SH_EXPORT && window.SH_EXPORT.questions;
      if (!Array.isArray(qs)) return null;
      meta = {};
      qs.forEach(function(q){ if (q && q.id) meta[q.id] = { q: q, v: fp(q) }; });
    }
    return meta[qid] || null;
  }

  window.shQH = { fp: fp, kindOf: kindOf, version: function(qid){ var m = metaOf(qid); return m ? m.v : ""; }, mount: mount };

  /* ---------- tracking ---------- */
  var H = null, HUB = "", ON = false;
  var TICK = 1000, IDLE = 120000, VIEW_MIN = 3000, PRE_CAP = 600000, EXPL_CAP = 300000;
  var tracked = [], visible = new Set(), io = null, focus = null, lastTick = 0, lastInput = Date.now(), inputCard = null, inputAt = 0;
  var queue = [], sess = {};
  var RATE_KEY = "", rates = null;

  function now(){ return Date.now(); }
  function st(card){
    if (card.__shQh) return card.__shQh;
    var qid = card.getAttribute("data-qid") || "";
    var mock = !!card.querySelector("[data-mock-pick], [data-mock-multi], [data-exam-choice]");
    return (card.__shQh = {
      qid: qid, type: card.getAttribute("data-qtype") || "",
      ctx: mock ? "mock" : card.getAttribute("data-ctx") || (card.closest(".shd-panel") ? "drill" : ""),
      pre: 0, seg: 0, answered: false, at: 0, expl: 0, acts: 0, rec: null, away: 0
    });
  }
  function revealed(card){
    return card.classList.contains("is-answered") || !!card.querySelector(".qcard-explain.shown") ||
      !!card.querySelector(".qcard-choice.is-correct, .qcard-choice.is-wrong, .qcard-choice.is-missed-right, .qcard-choice[data-state]");
  }
  function track(card){
    if (!card || card.__shQhOn || !card.getAttribute("data-qid")) return;
    card.__shQhOn = true;
    var s = st(card);
    tracked.push(card);
    if (io) io.observe(card);
    /* drawn already answered (mock results): no timing, but the rating row */
    if (revealed(card)) { s.answered = true; s.late = true; addRating(card); }
  }
  function scan(root){
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(".qcard[data-qid]")) track(root);
    if (root.querySelectorAll) root.querySelectorAll(".qcard[data-qid]").forEach(track);
  }

  /* the card being read: one tapped in the last 20 s if it's still on screen, else the visible card nearest the
     reading line that isn't covered (a dialog or sheet on top) */
  function pickFocus(){
    var t = now();
    if (inputCard && t - inputAt < 20000 && visible.has(inputCard) && inputCard.isConnected) return inputCard;
    var line = innerHeight * 0.4, best = null, bestD = 1e9;
    visible.forEach(function(card){
      if (!card.isConnected) return;
      var r = card.getBoundingClientRect();
      var vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (vis < Math.min(r.height * 0.5, innerHeight * 0.3)) return;
      var d = r.top <= line && r.bottom >= line ? 0 : Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
      if (d < bestD) {
        var y = Math.max(r.top, 0) + vis / 2, x = r.left + Math.min(r.width / 2, 60);
        var hit = document.elementFromPoint(Math.max(1, x), Math.max(1, Math.min(y, innerHeight - 1)));
        if (hit && card.contains(hit)) { best = card; bestD = d; }
      }
    });
    return best;
  }
  function tick(){
    var t = now(), dt = Math.min(t - lastTick, 2 * TICK); lastTick = t;
    /* cards that left the page: close what they had open */
    for (var i = tracked.length - 1; i >= 0; i--) {
      var c = tracked[i];
      if (!c.isConnected) { leave(c, true); tracked.splice(i, 1); visible.delete(c); if (io) io.unobserve(c); c.__shQhOn = false; }
    }
    if (document.visibilityState === "hidden" || t - lastInput > IDLE) { switchFocus(null); return; }
    var f = pickFocus();
    switchFocus(f);
    if (f) {
      var s = st(f);
      if (!s.answered) { s.pre = Math.min(s.pre + dt, PRE_CAP); s.seg += dt; }
      else if (s.rec && t - s.at < EXPL_CAP) s.expl += dt;
    }
    /* an answered card the reader has been away from for 4 s, or that has been open 5 minutes, is finished */
    tracked.forEach(function(c){
      var s = c.__shQh; if (!s || !s.rec) return;
      if (c === f) { s.away = 0; return; }
      s.away += dt;
      if (s.away >= 4000 || t - s.at >= EXPL_CAP) finish(c);
    });
  }
  function switchFocus(f){
    if (f === focus) return;
    if (focus) leave(focus, false);
    focus = f;
  }
  /* the reader moved off a card: an unanswered stretch of 3 s or more is a 'view' row */
  function leave(card, gone){
    var s = card.__shQh; if (!s) return;
    if (!s.answered && s.seg >= VIEW_MIN) push({ q: s.qid, v: verOf(s.qid), k: "v", c: s.ctx, t: kindOf(qOf(s.qid), s.type), ms: Math.round(s.seg) });
    s.seg = 0;
    if (gone && s.rec) finish(card);
  }
  function qOf(qid){ var m = metaOf(qid); return m ? m.q : null; }
  function verOf(qid){ var m = metaOf(qid); return m ? m.v : ""; }

  /* the hub's answered event: find the card it came from (revealed, not counted yet) */
  function onAnswered(e){
    var d = (e && e.detail) || {}, qid = String(d.qid || "");
    if (!qid) return;
    var t = now(), prior = priorOf(qid);
    (sess[qid] || (sess[qid] = [])).push({ t: t, ok: !!d.correct });
    setTimeout(function(){
      var card = null, cands = [];
      try {
        var sel = '.qcard[data-qid="' + (window.CSS && CSS.escape ? CSS.escape(qid) : qid.replace(/"/g, '\\"')) + '"]';
        document.querySelectorAll(sel).forEach(function(c){ var s = st(c); if (!s.answered && revealed(c)) cands.push(c); });
      } catch (err) {}
      card = cands.indexOf(focus) >= 0 ? focus : cands.sort(function(a, b){ return st(b).pre - st(a).pre; })[0] || null;
      var s = card ? st(card) : null, q = qOf(qid);
      var ctx = String(d.ctx || (s && s.ctx) || "").toLowerCase();
      var rec = { q: qid, v: verOf(qid), k: "a", c: ctx, t: kindOf(q, (s && s.type) || ""), ok: d.correct ? 1 : 0 };
      if (prior) { rec.n = prior.n + 1; if (prior.n) { rec.p = prior.last ? 1 : 0; rec.g = Math.round((t - prior.t) / 60000); } }
      if (typeof d.choice === "number") rec.ch = d.choice;
      if (q && Array.isArray(q.choices)) rec.nch = q.choices.length;
      if (q && typeof q.answer === "number") rec.key = q.answer;
      if (s && ctx !== "mock" && s.pre >= 500) rec.ms = Math.round(s.pre);
      if (!card || ctx === "mock") { push(rec); if (card) { s.answered = true; addRating(card); } return; }
      if (s.rec) finish(card);
      s.answered = true; s.at = now(); s.expl = 0; s.acts = 0; s.away = 0; s.seg = 0; s.rec = rec;
      if (focus !== card) focus = card;
      addRating(card);
    }, 0);
  }
  function finish(card){
    var s = card.__shQh; if (!s || !s.rec) return;
    var rec = s.rec; s.rec = null;
    rec.em = Math.round(s.expl); rec.ea = s.acts;
    push(rec);
  }
  /* this person's earlier tries: the server history from the last progress sync plus answers since; null until the
     sync has come back (the server then leaves the try out of first-try and retry numbers) */
  function priorOf(qid){
    var hist = H.hist && H.hist();
    if (!hist) return null;
    var h = hist[qid], n = h ? h.n : 0, last = h ? h.last : null, lt = h ? h.t : 0;
    (sess[qid] || []).forEach(function(a){ if (a.t > lt + 1500) { n++; last = a.ok; lt = a.t; } });
    return { n: n, last: last, t: lt };
  }

  function push(rec){
    queue.push(rec);
    if (queue.length >= 20) flush(false);
  }
  function flush(leaving){
    if (!queue.length || !ON) return;
    var items = queue.splice(0, 60);
    var body = JSON.stringify({ p_hub: HUB, p_visitor: H.visitor, p_visit: H.visit, p_items: items });
    try {
      fetch(H.sbUrl + "/rest/v1/rpc/record_qh", {
        method: "POST", keepalive: !!leaving && body.length < 60000,
        headers: { "Content-Type": "application/json", apikey: H.sbKey, Authorization: "Bearer " + H.sbKey },
        body: body
      }).then(function(){}, function(){});
    } catch (e) {}
    if (queue.length) flush(leaving);
  }
  function closeAll(){
    tracked.forEach(function(c){ leave(c, false); if (c.__shQh && c.__shQh.rec) finish(c); });
    focus = null;
    flush(true);
  }

  /* ---------- "Good question?" under the explanation ---------- */
  var THUMB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9z"/><path d="M7 11l4-7c1.4 0 2.4 1.1 2.1 2.5L12.5 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/></svg>';
  var REASONS = [["wrong-key", "The answer looks wrong"], ["confusing", "Wording is confusing"], ["not-in-notes", "Not in the notes"],
    ["explanation", "Explanation didn't help"], ["giveaway", "Gives the answer away"]];
  function loadRates(){
    if (rates) return rates;
    try { rates = JSON.parse(localStorage.getItem(RATE_KEY) || "{}") || {}; } catch (e) { rates = {}; }
    return rates;
  }
  function saveRate(qid, val){
    var r = loadRates();
    if (val) r[qid] = val; else delete r[qid];
    var ks = Object.keys(r); if (ks.length > 3000) ks.slice(0, ks.length - 3000).forEach(function(k){ delete r[k]; });
    try { localStorage.setItem(RATE_KEY, JSON.stringify(r)); } catch (e) {}
  }
  function mine(qid){ var x = loadRates()[qid]; return x && x[2] === verOf(qid) ? x : null; }
  function addRating(card){
    if (!ON || card.__shQhRate) return;
    var ex = card.querySelector('[data-role="explain"]') || card.querySelector(".qcard-explain");
    if (!ex) return;
    card.__shQhRate = true;
    var qid = card.getAttribute("data-qid");
    var box = document.createElement("div");
    box.className = "sh-qrate"; box.setAttribute("data-sh-noread", "");
    box.innerHTML = '<span class="sh-qrate-q">Good question?</span>' +
      '<button type="button" class="sh-qrate-b" data-qrate="1" aria-pressed="false" title="A good question">' + THUMB + '<span class="sh-cp-sr">Yes, a good question</span></button>' +
      '<button type="button" class="sh-qrate-b sh-qrate-down" data-qrate="-1" aria-pressed="false" title="Something\'s off">' + THUMB + '<span class="sh-cp-sr">No, something is off</span></button>' +
      '<span class="sh-qrate-msg" aria-live="polite"></span>' +
      '<div class="sh-qrate-why" hidden><span class="sh-qrate-whyq">What\'s off?</span>' +
        REASONS.map(function(r){ return '<button type="button" class="sh-qrate-r" data-qwhy="' + r[0] + '" aria-pressed="false">' + r[1] + '</button>'; }).join("") +
        '<button type="button" class="sh-qrate-r sh-qrate-other" data-qwhy="other">Something else: report it</button></div>';
    ex.appendChild(box);
    paint(box, qid);
    box.addEventListener("click", function(ev){
      ev.stopPropagation();
      var b = ev.target.closest("button"); if (!b) return;
      var cur = mine(qid), v = verOf(qid);
      if (b.hasAttribute("data-qrate")) {
        var val = +b.getAttribute("data-qrate");
        if (cur && cur[0] === val) { send(qid, v, 0, null); saveRate(qid, null); tk("qrate:undo"); }
        else { send(qid, v, val, null); saveRate(qid, [val, null, v]); tk(val > 0 ? "qrate:up" : "qrate:down"); }
      } else if (b.hasAttribute("data-qwhy")) {
        var why = b.getAttribute("data-qwhy");
        if (why === "other") { if (window.shOpenFlag) window.shOpenFlag(qid); tk("qrate:why=other"); return; }
        var r = cur && cur[1] === why ? null : why;
        send(qid, v, -1, r); saveRate(qid, [-1, r, v]); tk("qrate:why=" + (r || "none"));
      }
      document.querySelectorAll(".qcard[data-qid] .sh-qrate").forEach(function(o){
        var c = o.closest(".qcard"); if (c && c.getAttribute("data-qid") === qid) paint(o, qid, o === box);
      });
    });
  }
  function paint(box, qid, justNow){
    var cur = mine(qid), val = cur ? cur[0] : 0, why = cur ? cur[1] : null;
    box.querySelectorAll("[data-qrate]").forEach(function(b){ b.setAttribute("aria-pressed", String(+b.getAttribute("data-qrate") === val)); });
    box.querySelectorAll("[data-qwhy]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-qwhy") === why)); });
    box.querySelector(".sh-qrate-why").hidden = val !== -1;
    var msg = box.querySelector(".sh-qrate-msg");
    msg.textContent = !justNow ? "" : val === 1 ? "Thanks!" : val === -1 ? (why ? "Thanks. Flagged questions get checked against the notes." : "Thanks. What's off?") : "";
  }
  function send(qid, v, vote, reason){
    if (!H.supabase || H.automated) return;
    try { H.supabase.rpc("qh_vote", { p_hub: HUB, p_qid: qid, p_v: v, p_visitor: H.visitor, p_vote: vote, p_reason: reason }).then(function(){}, function(){}); } catch (e) {}
  }
  function tk(k){ try { if (window.shTrack) window.shTrack(k); } catch (e) {} }

  /* ---------- mount ---------- */
  function mount(hooks){
    if (H || !hooks || !hooks.hub) return;
    H = hooks; HUB = hooks.hub; RATE_KEY = "sh_qrate_" + HUB;
    ON = !!(hooks.sbUrl && hooks.sbKey && hooks.visitor && hooks.visit) && !hooks.automated;
    if (!ON) return;
    try {
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
      }, { threshold: [0, 0.01] });
    } catch (e) { io = null; }
    scan(document.body);
    try {
      new MutationObserver(function(muts){
        muts.forEach(function(m){ (m.addedNodes || []).forEach(scan); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    document.addEventListener(hooks.answeredEvent, onAnswered);
    function input(e){
      lastInput = now();
      var c = e && e.target && e.target.closest && e.target.closest(".qcard[data-qid]");
      if (c && e.type !== "scroll") { inputCard = c; inputAt = lastInput; track(c); }
      /* a tap inside an answered card's explanation (not the rating row) */
      if (c && e.type === "click" && c.__shQh && c.__shQh.rec && e.target.closest('[data-role="explain"], .qcard-explain') && !e.target.closest(".sh-qrate")) c.__shQh.acts++;
    }
    ["pointerdown", "keydown", "wheel", "touchstart", "click"].forEach(function(t){ document.addEventListener(t, input, { capture: true, passive: true }); });
    window.addEventListener("scroll", input, { passive: true, capture: true });
    lastTick = now();
    setInterval(tick, TICK);
    if (window.shAnalytics && typeof window.shAnalytics.register === "function") window.shAnalytics.register("qhealth", function(){ flush(false); }, 30000);
    else setInterval(function(){ flush(false); }, 30000); /* standalone fallback */
    document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") closeAll(); else lastTick = now(); });
    window.addEventListener("pagehide", closeAll);
  }
})();
