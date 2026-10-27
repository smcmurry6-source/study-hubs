/* Study hubs: shared arcade games (widget/games.js; styles in widget/games.css, which this file links itself).
   A hub's arcade loads this file and starts a game with  window.shGames.make(id, g, C)  → { mount(panel), stop() }.

   Games: board  (Showdown: a quiz board, one column per lecture, Daily Doubles and a Final wager)
          cloze  (Mind the Gap: type the bolded term blanked out of a sentence from the hub's own notes)
          escape (Operatory Escape: point-and-click escape room; questions unlock the four digits of the door code)
          smile  (Million-Dollar Smile: 12-rung quiz ladder with lifelines; moved here from Perio)
          cross  (Cross-Section: a fresh mini crossword every game; moved here from Perio)

   g = { id, name, color } from the hub's GAMES list.
   C = the hub's arcade context:
     A                          the hub's STATE.arcade ({ best, plays, muted, scope })
     SFX                        { good, bad, tick, over, win }
     bankPool(scope)            single-answer MCQs { id, lec, stem, choices, answer, ex } with no picture or Patient Box;
                                scope is 'all', a lecture id, or 'missed' (questions whose last answer was wrong)
     termPool(scope, filter)    crossword words { w:'UPPERCASE', c:'clue', lec }
     notes(scope)               [{ lec, html }] the lecture notes, read for Mind the Gap
     scopeSelectHTML(kind, min) the "Questions from" <select data-scope> (kind 'bank' | 'terms' | 'cloze')
     currentScope(root)         its value
     shell(g, o)                game chrome: o = { hud:[keys], select, stage, keys }, stage holds [data-stage]
     setHud(root, o)            fill [data-hud] values (lives as [n, max])
     introHTML(g, text, btn)    the start overlay (its button carries data-start)
     finish(g, root, score, missed, extra)   best score, leaderboard post and the game-over overlay
     record(q, correct, choiceIdx)            the hub's answer choke point (class stats, Weak Spots, streaks)
     lecName(lecId)             short label, e.g. "L2 · TMJ Anatomy" or "S3 · Risk Assessment"
     lecOrder                   lecture ids in course order
     skin                       the hub's own look and story for these games (smile:{ bg } swaps the drawn grin for a painted stage) (standing rule: every hub's arcade looks
                                like that hub, never a copy of another hub's). { id, board:{ dd, final, intro },
                                cloze:{ intro, placeholder }, escape:{ intro, room, item:{ name, found, reveal },
                                spots:{ <id>:{ label, flavor, locked, text } }, scene(api) or parts:{ <part>(api) } } }.
                                Every game's root gets data-sg-skin="<id>", so the hub's own CSS can restyle it.
                                Anything left out falls back to the plain defaults below. */
(function(){
  "use strict";
  if (window.shGames) return;
  var me = document.currentScript;
  if (!document.querySelector("link[data-sh-games]")) {
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.setAttribute("data-sh-games", "");
    link.href = me && me.src ? new URL("games.css", me.src).href : "../../widget/games.css";
    document.head.appendChild(link);
  }

  /* ---------- helpers ---------- */
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function shuffled(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function norm(s){ return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9µ]+/g, ""); }
  function lev(a, b){
    if (Math.abs(a.length - b.length) > 2) return 3;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++){
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  function clock(s){ s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function money(n){ return (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString(); }
  function track(what){ try { if (window.shTrack) window.shTrack("arcade:" + what); } catch (e) {} }
  var LETTERS = ["A", "B", "C", "D"];
  function skinOf(C, game){ return (C.skin && C.skin[game]) || {}; }
  function tagSkin(C, root){ root.setAttribute("data-sg-skin", (C.skin && C.skin.id) || "default"); }
  /* pull shuffled items without repeats until the pool runs dry, then reshuffle */
  function dealer(items){ var deck = []; return function(){ if (!deck.length) deck = shuffled(items); return deck.pop(); }; }
  /* MCQ with its choices shuffled into lettered options: { q, opts:[{ text, idx }], right } */
  function dealMCQ(q, n){
    var wrong = shuffled(q.choices.map(function(c, i){ return i; }).filter(function(i){ return i !== q.answer; })).slice(0, (n || 4) - 1);
    var order = shuffled([q.answer].concat(wrong));
    return { q:q, opts:order.map(function(i){ return { text:q.choices[i], idx:i }; }), right:order.indexOf(q.answer) };
  }
  function stillMounted(root){ return root && document.body.contains(root); }
  function typingIn(e){ var t = e.target; return t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA"); }

  /* ---------- cloze items: the bolded key terms in a hub's notes, each with the sentence it sits in ---------- */
  var STOP = {};
  ("no not and or nor yes right left more less most least never always only all none both first last before after every any same " +
   "different higher lower increase decrease increases decreases true false can cannot does do is are was were opposite also " +
   "one two three four five many few each either neither must should will may might better feel free pull health intact closest " +
   "single deep flat positive negative superior inferior").split(" ").forEach(function(w){ STOP[w] = 1; });
  ["both sides", "one side", "notes section", "not constant"].forEach(function(w){ STOP[w] = 1; });
  function okTerm(t){
    if (t.length < 3 || t.length > 36) return false;
    if (t.split(" ").length > 4) return false;
    if (!/[a-z]/i.test(t) || /["?“”]/.test(t) || /^\d+[.)]?$/.test(t)) return false;
    var low = t.toLowerCase();
    if (STOP[low] || /^(a|an|the|not|never|avoid|before|after) /.test(low)) return false;
    if (t.indexOf(" ") < 0 && /(ed|ly)$/.test(low)) return false;     /* single emphasis words: "maintained", "anteriorly" */
    return true;
  }
  function sentencesOf(text){ return (text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || []).map(function(s){ return s.trim(); }); }
  var clozeCache = {};
  function buildCloze(lec, html){
    var d = document.createElement("div"); d.innerHTML = html;
    var items = [], seen = {};
    Array.prototype.forEach.call(d.querySelectorAll("p, li"), function(el){
      if (el.closest(".tested, [data-sh-noread], table")) return;   /* the "What's tested" box lists topics, not sentences */
      var sents = sentencesOf(el.textContent.replace(/\s+/g, " ").trim());
      Array.prototype.forEach.call(el.querySelectorAll("b, strong"), function(b){
        var raw = b.textContent.replace(/\s+/g, " ").trim();
        if (/:$/.test(raw)) return;                                   /* run-in labels like "Posterior implants:" */
        var t = raw.replace(/[.,;]+$/, "");
        if (!okTerm(t)) return;
        var k = norm(t); if (!k || seen[k]) return;
        var low = t.toLowerCase(), s = sents.filter(function(x){ return x.toLowerCase().indexOf(low) > -1; })[0];
        if (!s || s.length < 40 || s.length > 280 || s.length - t.length < 28) return;
        seen[k] = 1;
        items.push({ lec:lec, term:t, text:s });
      });
    });
    return items;
  }
  function clozePool(notes){
    var out = [];
    (notes || []).forEach(function(n){
      var key = n.lec + ":" + (n.html || "").length;
      if (!clozeCache[key]) clozeCache[key] = buildCloze(n.lec, n.html || "");
      out = out.concat(clozeCache[key]);
    });
    return out;
  }
  /* the sentence with every copy of the term swapped for `blank` */
  function blanked(item, blank){
    var low = item.text.toLowerCase(), t = item.term.toLowerCase(), out = "", i = 0, j;
    while ((j = low.indexOf(t, i)) > -1){ out += esc(item.text.slice(i, j)) + blank; i = j + t.length; }
    return out + esc(item.text.slice(i));
  }
  function variants(term){
    var v = [term], noPar = term.replace(/\s*\([^)]*\)/g, "").trim();
    if (noPar && noPar !== term) v.push(noPar);
    return v.map(norm).filter(Boolean);
  }
  /* 2 = exact, 1 = close enough (a typo or a plural), 0 = wrong */
  function grade(input, term){
    var a = norm(input); if (!a) return 0;
    var vs = variants(term);
    for (var i = 0; i < vs.length; i++){
      var v = vs[i];
      if (a === v) return 2;
      if (a + "s" === v || a === v + "s" || a + "es" === v || a === v + "es") return 1;
      var tol = v.length >= 12 ? 2 : v.length >= 6 ? 1 : 0;
      if (tol && lev(a, v) <= tol) return 1;
    }
    return 0;
  }
  /* letter boxes for a term, the first `shown` letters filled in */
  function slotsHTML(term, shown){
    var n = 0;
    return '<span class="sg-slots" aria-label="' + term.replace(/[^ ]/g, "").length + ' spaces">' + term.split("").map(function(ch){
      if (ch === " ") return '<span class="sg-sgap"></span>';
      if (!/[a-z0-9µ]/i.test(ch)) return '<span class="sg-spunct">' + esc(ch) + "</span>";
      var on = n++ < shown;
      return '<span class="sg-slot' + (on ? " on" : "") + '">' + (on ? esc(ch) : "") + "</span>";
    }).join("") + "</span>";
  }
  function letterCount(term){ return term.replace(/[^a-z0-9µ]/gi, "").length; }

  /* =================================================================== SHOWDOWN (quiz board) */
  function Board(g, C){
    var VALUES = [100, 200, 300, 400, 500], SECS = 20, SECS_BIG = 30;
    var K = skinOf(C, "board"), DD = K.dd || "Daily Double", FINAL = K.final || "Final round";
    var root, stage, body, S, running = false, timer = null;
    function build(){
      var scope = C.currentScope(root), pool = C.bankPool(scope), note = "";
      if (pool.length < 15){ pool = C.bankPool("all"); note = scope === "missed" ? "Not enough missed questions yet, so this board mixes in the whole bank." : ""; }
      var by = {}; pool.forEach(function(q){ (by[q.lec] = by[q.lec] || []).push(q); });
      var lecs = Object.keys(by).filter(function(l){ return by[l].length >= 5; }), cols = [];
      if (lecs.length >= 3){
        lecs = shuffled(lecs).slice(0, 5).sort(function(a, b){ return C.lecOrder.indexOf(a) - C.lecOrder.indexOf(b); });
        lecs.forEach(function(l){ cols.push({ name:C.lecName(l), qs:shuffled(by[l]).slice(0, 5) }); });
      } else {
        var deck = shuffled(pool), n = Math.min(5, Math.floor(deck.length / 5)), one = lecs.length === 1 && Object.keys(by).length === 1;
        for (var i = 0; i < n; i++) cols.push({ name:(one ? C.lecName(lecs[0]) + " · " : "Mix ") + "ABCDE"[i], qs:deck.slice(i * 5, i * 5 + 5) });
      }
      var used = {}; cols.forEach(function(c){ c.qs.forEach(function(q){ used[q.id] = 1; }); });
      S.cols = cols; S.rest = pool.filter(function(q){ return !used[q.id]; }); S.note = note;
      S.tiles = cols.map(function(c){ return c.qs.map(function(q, r){ return { q:q, v:VALUES[r], done:false }; }); });
      var spots = []; S.tiles.forEach(function(col, ci){ col.forEach(function(t, r){ if (r > 0) spots.push(t); }); });
      shuffled(spots).slice(0, 2).forEach(function(t){ t.dd = true; });
      S.left = cols.length * 5;
      /* easiest question at $100: sort each column by how often the class gets it right */
      if (window.shGetClassStats){
        var ids = pool.map(function(q){ return q.id; });
        window.shGetClassStats(ids, function(by2){
          S.stats = by2 || {};
          if (!running || S.opened) return;
          S.tiles.forEach(function(col){
            var qs = col.map(function(t){ return t.q; }).sort(function(a, b){ return pct(b) - pct(a); });
            col.forEach(function(t, r){ t.q = qs[r]; });
          });
        });
      }
    }
    function pct(q){ var r = S.stats && S.stats[q.id]; return r && r.total >= 3 ? r.correct / r.total : 0.6; }
    function hud(){ C.setHud(root, { score:money(S.score), tiles:S.left }); }
    function boardView(){
      stopTimer(); S.view = "board";
      var n = S.cols.length, h = '<div class="sg-board" style="grid-template-columns:repeat(' + n + ',minmax(0,1fr))">';
      S.cols.forEach(function(c){ h += '<div class="sg-cat">' + esc(c.name) + "</div>"; });
      for (var r = 0; r < 5; r++) for (var ci = 0; ci < n; ci++){
        var t = S.tiles[ci][r];
        h += t.done ? '<div class="sg-tile done ' + (t.ok ? "ok" : "bad") + '" aria-label="answered"><span>' + (t.ok ? "✓" : "✗") + "</span></div>"
                    : '<button type="button" class="sg-tile" data-t="' + ci + "," + r + '"><span>$' + t.v + "</span></button>";
      }
      h += "</div>";
      var cleared = S.cols.length * 5 - S.left, canFinal = cleared >= 10 || S.left === 0;
      h += '<div class="sg-board-foot"><span>' + (S.note ? esc(S.note) + " " : "") + "Pick a tile. Right adds its value, wrong takes it away. Two tiles hide a " + esc(DD) + ".</span>" +
        '<button type="button" class="gm-btn alt" data-final' + (canFinal ? "" : " disabled") + ">" + (S.left === 0 ? esc(FINAL) : canFinal ? "Skip to " + esc(FINAL.toLowerCase()) : esc(FINAL) + " after 10 tiles") + "</button></div>";
      body.innerHTML = h; hud();
      if (S.left === 0) finalView();
    }
    function startTimer(secs, onOut){
      stopTimer();
      var t0 = Date.now(), bar = body.querySelector("[data-bar]");
      timer = setInterval(function(){
        if (!running){ stopTimer(); return; }
        var left = secs - (Date.now() - t0) / 1000;
        if (bar) bar.style.setProperty("--p", Math.max(0, left / secs));
        var lab = body.querySelector("[data-left]"); if (lab) lab.textContent = Math.max(0, Math.ceil(left));
        if (left <= 0){ stopTimer(); onOut(); }
      }, 100);
    }
    function stopTimer(){ clearInterval(timer); timer = null; }
    function clueView(t, cat, wager, isFinal){
      S.view = "clue"; S.cur = { t:t, deal:dealMCQ(t.q, 4), wager:wager, isFinal:isFinal, done:false };
      var d = S.cur.deal, stake = wager != null ? wager : t.v, secs = wager != null ? SECS_BIG : SECS;
      body.innerHTML = '<div class="sg-clue"><div class="sg-clue-top"><span>' + esc(cat) + " · " + (isFinal ? FINAL + ", wager " : wager != null ? DD + ", wager " : "") + money(stake) +
        '</span><span class="sg-clock"><b data-left>' + secs + '</b>s</span></div><div class="sg-bar"><i data-bar style="--p:1"></i></div>' +
        '<div class="sg-clue-q">' + esc(d.q.stem) + '</div><div class="sg-choices">' + d.opts.map(function(o, i){
          return '<button type="button" class="sg-choice" data-c="' + i + '"><b>' + LETTERS[i] + "</b><span>" + esc(o.text) + "</span></button>"; }).join("") +
        '</div><div class="sg-after" data-after></div></div>';
      startTimer(secs, function(){ answer(-1); });
    }
    function answer(i){
      var cur = S.cur; if (!cur || cur.done) return;
      cur.done = true; stopTimer();
      var d = cur.deal, ok = i === d.right, stake = cur.wager != null ? cur.wager : cur.t.v;
      if (i > -1) C.record(d.q, ok, d.opts[i].idx);
      S.asked++; if (ok) S.right++;
      if (ok){ S.score += stake; C.SFX.good(); }
      else { if (i > -1) S.score -= stake; C.SFX.bad(); S.missed.push({ q:d.q.stem, a:d.q.choices[d.q.answer] }); }
      if (!cur.isFinal){ cur.t.done = true; cur.t.ok = ok; S.left--; }
      var btns = body.querySelectorAll("[data-c]");
      Array.prototype.forEach.call(btns, function(b, k){ b.disabled = true; if (k === d.right) b.classList.add("right"); else if (k === i) b.classList.add("wrong"); });
      var msg = ok ? "<b class=\"ok\">Right! +" + money(stake) + "</b>" : (i < 0 ? "<b class=\"bad\">Time's up.</b> " : "<b class=\"bad\">Not this time. −" + money(stake) + ".</b> ") + "The answer: <b>" + esc(d.opts[d.right].text) + "</b>.";
      body.querySelector("[data-after]").innerHTML = "<p>" + msg + "</p>" + (d.q.ex ? '<p class="sg-ex">' + esc(d.q.ex) + "</p>" : "") +
        '<div class="gm-row"><button type="button" class="gm-btn" data-next>' + (cur.isFinal ? "See your score" : "Back to the board") + "</button></div>";
      hud();
      var nb = body.querySelector("[data-next]"); if (nb) nb.focus({ preventScroll:true });
    }
    function wagerView(t, cat, isFinal){
      S.view = "wager";
      var max = isFinal ? Math.max(0, S.score) : Math.max(S.score, 500), min = isFinal ? 0 : 5, start = Math.min(max, Math.max(min, Math.round(max / 2 / 5) * 5));
      if (isFinal && max === 0){ clueView(t, cat, 0, true); return; }
      S.wagerFor = { t:t, cat:cat, isFinal:isFinal };
      body.innerHTML = '<div class="sg-wager"><h3>' + esc(isFinal ? FINAL : DD + "!") + "</h3><p>Category: <b>" + esc(cat) + "</b></p>" +
        "<p>" + (isFinal ? "Wager any part of your " + money(S.score) + "." : "Wager up to " + money(max) + ". You get " + SECS_BIG + " seconds.") + "</p>" +
        '<input type="range" min="' + min + '" max="' + max + '" step="5" value="' + start + '" data-wager-range aria-label="Wager">' +
        '<div class="sg-wager-amt" data-wager-amt>' + money(start) + "</div>" +
        '<div class="gm-row"><button type="button" class="gm-btn alt" data-wager-set="' + min + '">Min</button><button type="button" class="gm-btn alt" data-wager-set="' + max + '">All in</button><button type="button" class="gm-btn" data-wager-go>Lock it in</button></div></div>';
      var rng = body.querySelector("[data-wager-range]");
      rng.addEventListener("input", function(){ body.querySelector("[data-wager-amt]").textContent = money(+rng.value); });
    }
    function finalView(){
      var rest = S.rest.length ? S.rest : S.cols.reduce(function(a, c){ return a.concat(c.qs); }, []);
      var q = rest.slice().sort(function(a, b){ return pct(a) - pct(b); }).slice(0, 6);
      q = pick(q);
      wagerView({ q:q, v:0 }, C.lecName(q.lec), true);
    }
    function end(){
      running = false; stopTimer();
      C.finish(g, root, Math.max(0, S.score), S.missed, { title:S.score > 0 ? "Final score" : "Game over", win:S.score > 0, note:S.right + " of " + S.asked + " right" + (S.score < 0 ? " · you finished below $0" : "") });
    }
    function begin(){
      var ov = stage.querySelector("[data-overlay]"); if (ov) ov.remove();
      S = { score:0, asked:0, right:0, missed:[], opened:0 }; running = true;
      build(); boardView(); track("board:start");
    }
    function onClick(e){
      if (e.target.closest("[data-start]")){ begin(); return; }
      if (!running) return;
      var tb = e.target.closest("[data-t]");
      if (tb && S.view === "board"){
        var p = tb.getAttribute("data-t").split(","), t = S.tiles[+p[0]][+p[1]]; S.opened++;
        if (t.dd){ C.SFX.win(); wagerView(t, S.cols[+p[0]].name, false); } else clueView(t, S.cols[+p[0]].name);
        return;
      }
      var c = e.target.closest("[data-c]"); if (c && S.view === "clue"){ answer(+c.getAttribute("data-c")); return; }
      if (e.target.closest("[data-next]")){ if (S.cur && S.cur.isFinal) end(); else boardView(); return; }
      if (e.target.closest("[data-final]")){ finalView(); return; }
      var ws = e.target.closest("[data-wager-set]"); if (ws){ var r = body.querySelector("[data-wager-range]"); r.value = ws.getAttribute("data-wager-set"); r.dispatchEvent(new Event("input")); return; }
      if (e.target.closest("[data-wager-go]")){ var w = S.wagerFor, amt = +body.querySelector("[data-wager-range]").value; clueView(w.t, w.cat, amt, w.isFinal); }
    }
    function kd(e){
      if (!running || !stillMounted(root) || typingIn(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      var n = parseInt(e.key, 10);
      if (S.view === "clue" && n >= 1 && n <= 4){ e.preventDefault(); answer(n - 1); }
    }
    return {
      mount:function(panel){
        panel.innerHTML = C.shell(g, { hud:["score", "tiles"], select:C.scopeSelectHTML("bank", 15), stage:'<div class="gm-stage sg-stage" data-stage><div class="sg-body" data-body></div></div>',
          keys:"Tap a tile · answer with <kbd>1</kbd>-<kbd>4</kbd> · questions run 20 s (30 s on a wager)" });
        root = panel.querySelector(".gm"); stage = root.querySelector("[data-stage]"); body = root.querySelector("[data-body]");
        S = { score:0, left:25 }; hud();
        tagSkin(C, root);
        stage.insertAdjacentHTML("beforeend", C.introHTML(g, K.intro || "A quiz board: one column per lecture, five tiles each from <b>$100</b> (the one the class gets right most) to <b>$500</b> (the toughest). Right adds the tile's value, wrong takes it away. Two tiles hide a <b>" + esc(DD) + "</b> where you set the stakes, and the <b>" + esc(FINAL) + "</b> lets you wager everything on one hard question.", K.start || "Deal the board"));
        stage.addEventListener("click", onClick);
        document.addEventListener("keydown", kd);
      },
      stop:function(){ running = false; stopTimer(); document.removeEventListener("keydown", kd); }
    };
  }

  /* =================================================================== MIND THE GAP (cloze typing) */
  function Gap(g, C){
    var root, stage, body, S, running = false, timer = null, K = skinOf(C, "cloze");
    function pool(){
      var p = clozePool(C.notes(C.currentScope(root)));
      if (p.length < 6) p = clozePool(C.notes("all"));
      return p;
    }
    function limit(){ return Math.max(16, 32 - S.n); }   /* the clock tightens as you go */
    function hud(){ C.setHud(root, { score:S.score, lives:[S.lives, 3], streak:S.streak }); }
    function next(){
      if (!S.deck.length) S.deck = shuffled(pool());
      S.item = S.deck.pop(); S.hints = 0; S.tries = 0; S.busy = false; S.t0 = Date.now(); S.secs = limit();
      render(); startTimer();
    }
    function render(note){
      var it = S.item;
      body.innerHTML = '<div class="sg-gap"><div class="sg-clue-top"><span>' + esc(C.lecName(it.lec)) + " · card " + (S.n + 1) + '</span><span class="sg-clock"><b data-left>' + S.secs + '</b>s</span></div><div class="sg-bar"><i data-bar style="--p:1"></i></div>' +
        '<p class="sg-gap-text">' + blanked(it, '<span class="sg-blank">' + slotsHTML(it.term, S.hints) + "</span>") + "</p>" +
        '<form class="sg-gap-form" data-form autocomplete="off"><input class="sg-input" data-input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Type the missing term" placeholder="' + esc(K.placeholder || "Type the missing term") + '">' +
        '<button type="submit" class="gm-btn">Enter</button></form>' +
        '<div class="gm-row"><button type="button" class="gm-btn alt" data-hint' + (S.hints >= letterCount(it.term) - 1 ? " disabled" : "") + '>Show a letter (−25)</button><button type="button" class="gm-btn alt" data-skip>Give up</button></div>' +
        '<div class="sg-msg" data-msg>' + (note || letterCount(it.term) + " letters" + (it.term.indexOf(" ") > -1 ? ", " + it.term.split(" ").length + " words" : "")) + "</div></div>";
      var inp = body.querySelector("[data-input]"); try { inp.focus({ preventScroll:true }); } catch (e) { inp.focus(); }
    }
    function startTimer(){
      clearInterval(timer);
      timer = setInterval(function(){
        if (!running || S.busy) return;
        var left = S.secs - (Date.now() - S.t0) / 1000, bar = body.querySelector("[data-bar]"), lab = body.querySelector("[data-left]");
        if (bar) bar.style.setProperty("--p", Math.max(0, left / S.secs));
        if (lab) lab.textContent = Math.max(0, Math.ceil(left));
        if (left <= 0) fail("Time's up.");
      }, 100);
    }
    function reveal(cls, msg){
      S.busy = true;
      var it = S.item, p = body.querySelector(".sg-gap-text");
      if (p) p.innerHTML = blanked(it, '<mark class="sg-mark ' + cls + '">' + esc(it.term) + "</mark>");
      var m = body.querySelector("[data-msg]"); if (m) m.innerHTML = msg;
      body.querySelectorAll("button, input").forEach(function(b){ b.disabled = true; });
    }
    function submit(){
      if (S.busy) return;
      var inp = body.querySelector("[data-input]"), val = inp.value, it = S.item;
      if (!val.trim()) return;
      var gr = grade(val, it.term);
      if (gr){
        var left = Math.max(0, S.secs - (Date.now() - S.t0) / 1000);
        var pts = Math.max(20, 100 + Math.round(left * 5) - S.hints * 25 + Math.min(S.streak, 10) * 10);
        S.score += pts; S.streak++; S.n++; C.SFX.good(); hud();
        reveal("ok", (gr === 2 ? "<b class=\"ok\">Right!</b>" : "<b class=\"ok\">Close enough.</b> It's spelled <b>" + esc(it.term) + "</b>.") + " +" + pts);
        setTimeout(function(){ if (running) next(); }, gr === 2 ? 1300 : 2200);
        return;
      }
      S.tries++; C.SFX.bad();
      if (S.tries >= 2){ fail("Not quite."); return; }
      inp.value = ""; inp.classList.remove("gm-shake"); void inp.offsetWidth; inp.classList.add("gm-shake");
      var m = body.querySelector("[data-msg]"); if (m) m.innerHTML = "<b class=\"bad\">Not quite.</b> One more try" + (S.hints < letterCount(it.term) - 1 ? ", or show a letter." : ".");
    }
    function fail(why){
      if (S.busy) return;
      S.lives--; S.streak = 0; S.n++; C.SFX.bad(); hud();
      S.missed.push({ q:S.item.text.replace(new RegExp(S.item.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "____"), a:S.item.term });
      reveal("bad", "<b class=\"bad\">" + esc(why) + "</b> The missing term was <b>" + esc(S.item.term) + "</b>.");
      setTimeout(function(){ if (!running) return; if (S.lives <= 0) end(); else next(); }, 2400);
    }
    function end(){
      running = false; clearInterval(timer);
      var filled = S.n - S.missed.length;
      C.finish(g, root, S.score, S.missed, { note:filled + " gap" + (filled === 1 ? "" : "s") + " filled" });
    }
    function begin(){
      var ov = stage.querySelector("[data-overlay]"); if (ov) ov.remove();
      var p = pool(); if (!p.length){ body.innerHTML = '<p class="sg-msg">No notes to draw from yet.</p>'; return; }
      S = { score:0, lives:3, streak:0, n:0, missed:[], deck:shuffled(p) }; running = true; hud(); next(); track("cloze:start");
    }
    return {
      mount:function(panel){
        panel.innerHTML = C.shell(g, { hud:["score", "lives", "streak"], select:C.scopeSelectHTML("cloze", 6), stage:'<div class="gm-stage sg-stage" data-stage><div class="sg-body" data-body></div></div>',
          keys:"Type the term and press <kbd>Enter</kbd> · typos of a letter or two still count · the clock tightens each card" });
        root = panel.querySelector(".gm"); stage = root.querySelector("[data-stage]"); body = root.querySelector("[data-body]");
        S = { score:0, lives:3, streak:0 }; hud();
        tagSkin(C, root);
        stage.insertAdjacentHTML("beforeend", C.introHTML(g, K.intro || "Fill-in-the-blank, Anki cloze style. Each card is a sentence straight from the lecture notes with a <b>key term</b> taken out. Type it in before the clock runs down. The boxes show how many letters it has; showing a letter costs points. Two wrong tries, a give-up or the clock costs a life, and you have three.", K.start || "Start typing"));
        stage.addEventListener("click", function(e){
          if (e.target.closest("[data-start]")){ begin(); return; }
          if (!running || S.busy) return;
          if (e.target.closest("[data-hint]")){ if (S.hints < letterCount(S.item.term) - 1){ S.hints++; var v = body.querySelector("[data-input]").value; render(); body.querySelector("[data-input]").value = v; } return; }
          if (e.target.closest("[data-skip]")) fail("You gave up on this one.");
        });
        stage.addEventListener("submit", function(e){ if (e.target.closest("[data-form]")){ e.preventDefault(); if (running) submit(); } });
      },
      stop:function(){ running = false; clearInterval(timer); }
    };
  }

  /* =================================================================== OPERATORY ESCAPE (point-and-click escape room) */
  var SLOT_COLORS = [["blue", "#4FB6F0"], ["pink", "#FF6FA3"], ["gold", "#FFC93C"], ["green", "#3DD39B"]];
  /* The plain room. A hub replaces it with its own: skin.escape.scene(api) draws the whole room, or skin.escape.parts
     swaps single parts (room, clock, decor, xray, poster, door, monitor, chair, chart, cabinet, drawer, sink).
     Every hotspot is api.spot(id, x, y, w, h, inner); the clock hand is api.hand(cx, cy, attrs). */
  var BASE_PARTS = {
    room:function(){ return '<rect width="800" height="450" fill="#cfe1e8"/><rect y="0" width="800" height="18" fill="#b9cfd8"/>' +
        '<rect y="372" width="800" height="78" fill="#8fa6b2"/><path d="M0 372H800" stroke="#6f8794" stroke-width="4"/>' +
        [80, 200, 320, 440, 560, 680].map(function(x){ return '<path d="M' + x + ' 372L' + (x - 40) + ' 450" stroke="#7d95a1" stroke-width="2"/>'; }).join("") +
        '<path d="M0 410H800" stroke="#7d95a1" stroke-width="2"/>'; },
    clock:function(a){ return '<g aria-hidden="true"><circle cx="262" cy="62" r="27" fill="#fffdf6" stroke="#2c3e50" stroke-width="5"/>' + [0, 1, 2, 3].map(function(i){ return '<rect x="260" y="38" width="4" height="7" fill="#2c3e50" transform="rotate(' + (i * 90) + ' 262 62)"/>'; }).join("") +
        a.hand(262, 62, 'x="260" y="42" width="4" height="22" rx="2" fill="#e8475f"') + '<circle cx="262" cy="62" r="4" fill="#2c3e50"/></g>'; },
    decor:function(){ return '<g aria-hidden="true"><path d="M400 0V40L338 104" stroke="#6b7c88" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="330" cy="114" rx="36" ry="17" fill="#e6edf1" stroke="#4d5d69" stroke-width="4"/><ellipse cx="330" cy="120" rx="22" ry="7" fill="#fff6c4"/></g>'; },
    xray:function(a){ var lit = a.solved.xray;
      return a.spot("xray", 28, 34, 184, 124, '<rect x="34" y="40" width="172" height="112" rx="6" fill="#e9eef2" stroke="#4d5d69" stroke-width="4"/><rect x="44" y="50" width="152" height="92" rx="3" fill="' + (lit ? "#f6fbff" : "#2f3d48") + '"/>' +
        (lit ? '<rect x="56" y="58" width="128" height="76" fill="#1e2a33"/>' + [72, 98, 124, 150].map(function(x){ return '<path d="M' + x + ' 72c-8 0-10 8-9 16 1 9 3 26 6 36 2 6 6 6 7 0 1-6 2-10 4-10s3 4 4 10c1 6 5 6 7 0 3-10 5-27 6-36 1-8-1-16-9-16-5 0-6 3-11 3s-6-3-11-3z" fill="#c9d6de" opacity=".85"/>'; }).join("") + a.digit("xray", 182, 64, 15)
             : '<text x="120" y="102" text-anchor="middle" font-size="13" fill="#7f93a1" font-weight="700">VIEW BOX OFF</text>')); },
    poster:function(a){ return a.spot("poster", 446, 34, 132, 152, '<rect x="452" y="40" width="120" height="140" fill="#fff6dc" stroke="#c9b27a" stroke-width="3"/><circle cx="462" cy="48" r="4" fill="#e8475f"/><circle cx="562" cy="48" r="4" fill="#e8475f"/>' +
        '<text x="512" y="72" text-anchor="middle" font-size="15" font-weight="900" fill="#2c3e50">BRUSH</text><text x="512" y="90" text-anchor="middle" font-size="12" font-weight="800" fill="#e8475f">2 MIN · 2× A DAY</text>' +
        '<path d="M496 106c6 0 9 3 16 3s10-3 16-3c9 0 13 7 13 15 0 10-6 14-7 25-1 9-3 17-8 17-6 0-6-15-14-15s-8 15-14 15c-5 0-7-8-8-17-1-11-7-15-7-25 0-8 4-15 13-15z" fill="#fff" stroke="#2c3e50" stroke-width="3"/>' +
        (a.solved.poster ? '<rect x="452" y="40" width="120" height="140" fill="#3a5cff" opacity=".18"/>' + a.digit("poster", 512, 140, 22) : "")); },
    door:function(a){ return a.spot("door", 636, 36, 148, 340, '<rect x="676" y="42" width="72" height="24" rx="4" fill="#163b2a"/><text x="712" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="#58f29a">EXIT</text>' +
        '<rect x="650" y="74" width="122" height="298" fill="#8a6a4f" stroke="#5c4330" stroke-width="5"/><rect x="666" y="92" width="90" height="110" fill="none" stroke="#6e523c" stroke-width="4"/><rect x="666" y="220" width="90" height="130" fill="none" stroke="#6e523c" stroke-width="4"/>' +
        '<rect x="728" y="196" width="34" height="50" rx="5" fill="#2c3e50"/>' + a.keypad(735, 208, 20, 18, 6) + '<circle cx="745" cy="262" r="7" fill="#e3c26a" stroke="#5c4330" stroke-width="2"/>'); },
    monitor:function(a){ var on = a.solved.monitor;
      return a.spot("monitor", 30, 196, 160, 214, '<rect x="104" y="296" width="12" height="96" fill="#6b7c88"/><rect x="72" y="388" width="76" height="12" rx="5" fill="#4d5d69"/><circle cx="80" cy="404" r="6" fill="#2c3e50"/><circle cx="140" cy="404" r="6" fill="#2c3e50"/>' +
        '<rect x="38" y="204" width="144" height="94" rx="6" fill="#2c3e50"/><rect x="46" y="212" width="128" height="76" rx="3" fill="' + (on ? "#0f3d2c" : "#0b2030") + '"/>' +
        (on ? '<text x="98" y="244" text-anchor="middle" font-size="12" font-weight="800" fill="#58f29a">ACCESS OK</text>' + a.digit("monitor", 146, 262, 15)
            : '<text x="110" y="240" text-anchor="middle" font-size="11" font-weight="700" fill="#7fd1ff">LOCKED</text><rect x="66" y="252" width="88" height="16" rx="3" fill="#163248" stroke="#7fd1ff" stroke-width="1.5"/><text x="74" y="264" font-size="11" fill="#7fd1ff">••••_</text>')); },
    chair:function(){ return '<g aria-hidden="true"><rect x="262" y="352" width="34" height="34" fill="#6b7c88"/><ellipse cx="279" cy="392" rx="58" ry="10" fill="#4d5d69"/>' +
        '<path d="M214 226c-8 2-10 10-6 18l38 100c4 9 10 12 20 12h120c14 0 18-6 18-14 0-9-6-14-18-14H280z" fill="#2f9e98" stroke="#1f6e69" stroke-width="4"/>' +
        '<path d="M400 336l40 26c6 4 6 12-2 13l-38-6z" fill="#2f9e98" stroke="#1f6e69" stroke-width="4"/><rect x="200" y="206" width="30" height="24" rx="10" fill="#2f9e98" stroke="#1f6e69" stroke-width="4"/></g>'; },
    chart:function(a){ return a.spot("chart", 296, 292, 76, 62, '<g transform="rotate(-8 334 322)"><rect x="306" y="300" width="56" height="44" rx="4" fill="#a87b4f"/><rect x="311" y="304" width="46" height="37" fill="#fff"/><rect x="326" y="296" width="16" height="8" rx="2" fill="#6b7c88"/>' +
        [314, 321, 328].map(function(y){ return '<rect x="316" y="' + y + '" width="' + (y === 328 ? 20 : 34) + '" height="3" fill="#9fb0bc"/>'; }).join("") + "</g>" + (a.solved.chart ? a.digit("chart", 360, 334, 14) : "")); },
    cabinet:function(){ return '<g aria-hidden="true"><rect x="452" y="262" width="164" height="112" fill="#e9eef2" stroke="#4d5d69" stroke-width="4"/><rect x="446" y="252" width="176" height="14" rx="3" fill="#b9c7cf" stroke="#4d5d69" stroke-width="3"/>' +
        '<rect x="460" y="316" width="72" height="50" fill="none" stroke="#9fb0bc" stroke-width="3"/><rect x="536" y="316" width="72" height="50" fill="none" stroke="#9fb0bc" stroke-width="3"/><rect x="490" y="338" width="12" height="4" rx="2" fill="#6b7c88"/><rect x="566" y="338" width="12" height="4" rx="2" fill="#6b7c88"/></g>'; },
    drawer:function(a){ var open = a.solved.drawer;
      return a.spot("drawer", 454, 270, 160, 42, '<rect x="460" y="274" width="148" height="34" fill="' + (open ? "#d7e2e8" : "#f4f7f9") + '" stroke="#9fb0bc" stroke-width="3"/><rect x="522" y="288" width="24" height="5" rx="2" fill="#6b7c88"/>' +
        (open ? "" : a.padlock(588, 284)) + a.check("drawer", 604, 274)); },
    sink:function(a){ return a.spot("sink", 560, 206, 66, 58, '<path d="M574 252h40l-4 -10h-32z" fill="#cdd8de" stroke="#4d5d69" stroke-width="3"/><path d="M594 242v-24h12v8" stroke="#6b7c88" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<rect x="566" y="214" width="20" height="18" fill="#ffe680" transform="rotate(-10 576 223)"/>'); }
  };
  var PART_ORDER = ["room", "clock", "decor", "xray", "poster", "door", "monitor", "chair", "chart", "cabinet", "drawer", "sink"];
  function baseScene(a, parts){
    parts = parts || {};
    return PART_ORDER.map(function(k){ return (parts[k] || BASE_PARTS[k])(a); }).join("");
  }
  var ESCAPE_TEXT = {
    room:"the operatory",
    intro:"Your last patient just left and the operatory door locked behind them. The keypad wants a <b>four-digit code</b>, one digit per colored slot, and the digits are hidden around the room. Tap things to look at them; most are locked behind a question from the bank.",
    item:{ name:"Curing light", found:"The padlock pops open. Inside: a <b>curing light</b>. Now where would blue light help?",
           reveal:"You sweep the curing light across the poster. Blue light, and a number glows through:" },
    spots:{
      xray:{ label:"X-ray viewer", flavor:"The view box is dark, and its switch has a question taped over it. Answer it to turn the light on." },
      monitor:{ label:"Computer", flavor:"The computer wants a password. The hint on the screen is a sentence with a word missing." },
      chart:{ label:"Patient chart", flavor:"Your last patient's chart. A sticky note on the clipboard asks a question. Answer it and the note flips over." },
      drawer:{ label:"Cabinet drawer", flavor:"The top drawer is padlocked. The lock's dial is labeled with one question." },
      poster:{ label:"Poster", locked:"An old oral-hygiene poster. In the corner the paper looks a little shiny, as if something was written there that you can't see." },
      sink:{ label:"Sink", text:"<p>The faucet drips. A yellow sticky note on the mirror reads:</p><p class=\"sg-note\">“A curing light shows more than resin. Try it on the walls.”</p>" },
      door:{ label:"Door", text:"A keypad with four colored slots. Find a digit for each color around the room." }
    }
  };
  var SLOT_COLORS = [["blue", "#4FB6F0"], ["pink", "#FF6FA3"], ["gold", "#FFC93C"], ["green", "#3DD39B"]];
  function Escape(g, C){
    var TIME = 360, PENALTY = 20;
    var root, stage, scene, panelEl, inv, S, running = false, timer = null, draw = null, gaps = null;
    var K = skinOf(C, "escape"), KS = K.spots || {}, ITEM = {};
    ["name", "found", "reveal"].forEach(function(k){ ITEM[k] = (K.item && K.item[k]) || ESCAPE_TEXT.item[k]; });
    var SPOTS = {
      xray:   { kind:"mcq",   digit:true },
      monitor:{ kind:"typed", digit:true },
      chart:  { kind:"mcq",   digit:true },
      drawer: { kind:"mcq",   item:"light" },
      poster: { kind:"light", digit:true },
      sink:   { kind:"note" },
      door:   { kind:"door" }
    };
    Object.keys(SPOTS).forEach(function(id){ var d = ESCAPE_TEXT.spots[id], o = KS[id] || {}; ["label", "flavor", "locked", "text"].forEach(function(k){ SPOTS[id][k] = o[k] || d[k]; }); });
    var ORDER = ["xray", "monitor", "chart", "drawer", "poster", "sink", "door"];
    function left(){ return Math.max(0, S.deadline - Date.now()) / 1000; }
    function hud(){ C.setHud(root, { time:clock(left()), locks:S.found + "/4" }); }
    function newRoom(){
      var colors = shuffled(SLOT_COLORS), digitSpots = shuffled(["xray", "monitor", "chart", "poster"]);
      S.code = colors.map(function(){ return Math.floor(Math.random() * 10); });
      S.slotOf = {}; digitSpots.forEach(function(id, i){ S.slotOf[id] = i; });   /* which slot (and color) each spot's digit fills */
      S.colors = colors; S.solved = {}; S.items = {}; S.firstTry = 0; S.found = 0; S.wrongs = 0;
    }
    function digitBadge(id, x, y, r){
      var k = S.slotOf[id], c = S.colors[k][1];
      return '<g class="sg-digit"><circle cx="' + x + '" cy="' + y + '" r="' + (r || 17) + '" fill="' + c + '" stroke="#10202e" stroke-width="3"/><text x="' + x + '" y="' + (y + 7) + '" text-anchor="middle" font-size="' + ((r || 17) + 3) + '" font-weight="800" fill="#10202e">' + S.code[k] + "</text></g>";
    }
    function check(id, x, y){ return S.solved[id] && !SPOTS[id].digit ? '<g><circle cx="' + x + '" cy="' + y + '" r="11" fill="#3DD39B" stroke="#10202e" stroke-width="2.5"/><path d="M' + (x - 5) + " " + y + "l3.5 3.5 6-7" + '" stroke="#10202e" stroke-width="3" fill="none" stroke-linecap="round"/></g>' : ""; }
    function handAngle(){ return -(left() / 60 / 6) * 360; }
    var API = {
      get solved(){ return S.solved; }, get items(){ return S.items; }, get colors(){ return S.colors; }, get code(){ return S.code; },
      slotColor:function(id){ return S.colors[S.slotOf[id]][1]; }, digitOf:function(id){ return S.code[S.slotOf[id]]; },
      digit:digitBadge, check:check,
      spot:function(id, x, y, w, h, inner){ return '<g class="sg-spot" data-spot="' + id + '" tabindex="0" role="button" aria-label="' + esc(SPOTS[id].label) + '"><rect class="sg-hit" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8"/>' + inner + "</g>"; },
      hand:function(cx, cy, attrs){ return '<rect data-hand data-cx="' + cx + '" data-cy="' + cy + '" ' + attrs + ' transform="rotate(' + handAngle() + " " + cx + " " + cy + ')"/>'; },
      keypad:function(x, y, dx, dy, r){ return S.colors.map(function(c, i){ return '<circle cx="' + (x + (i % 2) * dx) + '" cy="' + (y + Math.floor(i / 2) * dy) + '" r="' + r + '" fill="' + c[1] + '"/>'; }).join(""); },
      padlock:function(x, y){ return '<g transform="translate(' + x + " " + y + ')"><rect x="-8" y="0" width="16" height="13" rx="2" fill="#e3c26a" stroke="#5c4330" stroke-width="2"/><path d="M-5 0v-4a5 5 0 0 1 10 0v4" stroke="#5c4330" stroke-width="2.5" fill="none"/></g>'; }
    };
    API.base = function(parts){ return baseScene(API, parts); };
    function sceneSVG(){
      return '<svg viewBox="0 0 800 450" class="sg-scene-svg" role="img" aria-label="' + esc("A locked room: " + (K.room || ESCAPE_TEXT.room)) + '">' + (K.scene ? K.scene(API) : baseScene(API, K.parts)) + "</svg>";
    }
    function invHTML(){
      return '<div class="sg-inv"><span class="sg-inv-lab">Door code</span>' + S.colors.map(function(c, i){
        var who = Object.keys(S.slotOf).filter(function(id){ return S.slotOf[id] === i; })[0], got = S.solved[who];
        return '<span class="sg-code" style="--k:' + c[1] + '" title="' + c[0] + '">' + (got ? S.code[i] : "?") + "</span>";
      }).join("") + '<span class="sg-inv-lab">Items</span>' + (S.items.light ? '<span class="sg-item">' + esc(ITEM.name) + '</span>' : '<span class="sg-item empty">none yet</span>') +
        '</div><div class="sg-spotlist" role="group" aria-label="Look at">' + ORDER.map(function(id){ return '<button type="button" class="sg-spotbtn' + (S.solved[id] ? " done" : "") + '" data-spot="' + id + '">' + esc(SPOTS[id].label) + "</button>"; }).join("") + "</div>";
    }
    function paint(){ scene.innerHTML = sceneSVG(); inv.innerHTML = invHTML(); hud(); }
    function closePanel(){ panelEl.hidden = true; panelEl.innerHTML = ""; S.open = null; }
    function openPanel(title, html){
      panelEl.innerHTML = '<div class="sg-esc-card"><div class="sg-esc-head"><h3>' + esc(title) + '</h3><button type="button" class="gm-btn alt" data-close>Step back</button></div>' + html + "</div>";
      panelEl.hidden = false;
      var f = panelEl.querySelector("input, [data-c]"); if (f) try { f.focus({ preventScroll:true }); } catch (e) {}
    }
    function look(id){
      if (!running) return;
      var sp = SPOTS[id]; S.open = id; C.SFX.tick();
      if (id === "sink"){ openPanel(sp.label, sp.text); return; }
      if (id === "door") return doorPanel();
      if (S.solved[id]){
        openPanel(sp.label, "<p>" + (sp.digit ? "Already solved. Its digit is <b style=\"color:" + S.colors[S.slotOf[id]][1] + "\">" + S.code[S.slotOf[id]] + "</b>, for the " + S.colors[S.slotOf[id]][0] + " slot on the door." : "Empty now. You already took the " + esc(ITEM.name.toLowerCase()) + ".") + "</p>");
        return;
      }
      if (id === "poster"){
        if (!S.items.light){ openPanel(sp.label, "<p>" + sp.locked + "</p>"); return; }
        S.solved.poster = true; S.found++; C.SFX.win(); paint();
        openPanel(sp.label, "<p>" + ITEM.reveal + " <b style=\"color:" + S.colors[S.slotOf.poster][1] + "\">" + S.code[S.slotOf.poster] + "</b> for the " + S.colors[S.slotOf.poster][0] + " slot.</p>");
        return;
      }
      if (sp.kind === "typed") return typedPanel(id);
      mcqPanel(id);
    }
    function mcqPanel(id, note){
      var d = dealMCQ(draw(), 4); S.deal = d; S.tries = S.tries || {};
      openPanel(SPOTS[id].label, (note || "<p>" + SPOTS[id].flavor + "</p>") + '<div class="sg-esc-q"><span class="sg-esc-lec">' + esc(C.lecName(d.q.lec)) + "</span>" + esc(d.q.stem) + "</div>" +
        '<div class="sg-choices">' + d.opts.map(function(o, i){ return '<button type="button" class="sg-choice" data-c="' + i + '"><b>' + LETTERS[i] + "</b><span>" + esc(o.text) + "</span></button>"; }).join("") + '</div><div data-after></div>');
    }
    function solve(id){
      S.solved[id] = true;
      if (!S.tries[id]) S.firstTry++;
      if (SPOTS[id].digit) S.found++;
      if (SPOTS[id].item) S.items[SPOTS[id].item] = true;
      C.SFX.win(); paint();
    }
    function penalize(){ S.deadline -= PENALTY * 1000; S.wrongs++; hud(); var t = root.querySelector('[data-hud="time"]'); if (t){ t.classList.remove("gm-shake"); void t.offsetWidth; t.classList.add("gm-shake"); } }
    function mcqAnswer(i){
      var id = S.open, d = S.deal; if (!d || d.done) return; d.done = true;
      var ok = i === d.right; C.record(d.q, ok, d.opts[i].idx);
      panelEl.querySelectorAll("[data-c]").forEach(function(b, k){ b.disabled = true; if (k === d.right) b.classList.add("right"); else if (k === i) b.classList.add("wrong"); });
      var after = panelEl.querySelector("[data-after]");
      if (ok){
        solve(id);
        var got = SPOTS[id].digit ? "It clicks. A digit: <b style=\"color:" + S.colors[S.slotOf[id]][1] + "\">" + S.code[S.slotOf[id]] + "</b>, for the " + S.colors[S.slotOf[id]][0] + " slot on the door." : ITEM.found;
        after.innerHTML = '<p><b class="ok">Right.</b> ' + got + "</p>" + (d.q.ex ? '<p class="sg-ex">' + esc(d.q.ex) + "</p>" : "") + '<div class="gm-row"><button type="button" class="gm-btn" data-close>Keep looking</button></div>';
      } else {
        S.tries[id] = (S.tries[id] || 0) + 1; C.SFX.bad(); penalize();
        S.missed.push({ q:d.q.stem, a:d.q.choices[d.q.answer] });
        after.innerHTML = '<p><b class="bad">Wrong, −' + PENALTY + ' s.</b> The answer: <b>' + esc(d.opts[d.right].text) + "</b>.</p>" + (d.q.ex ? '<p class="sg-ex">' + esc(d.q.ex) + "</p>" : "") + '<div class="gm-row"><button type="button" class="gm-btn" data-retry>Try another question</button></div>';
      }
      var b = after.querySelector("button"); if (b) b.focus({ preventScroll:true });
    }
    function typedPanel(id, note){
      if (!gaps || !gaps.length){ mcqPanel(id); return; }
      S.gap = pick(gaps); S.gapTries = 0;
      openPanel(SPOTS[id].label, (note || "<p>" + SPOTS[id].flavor + "</p>") + '<div class="sg-esc-q"><span class="sg-esc-lec">' + esc(C.lecName(S.gap.lec)) + "</span>" + blanked(S.gap, '<span class="sg-blank">' + slotsHTML(S.gap.term, 1) + "</span>") + "</div>" +
        '<form class="sg-gap-form" data-pw autocomplete="off"><input class="sg-input" data-input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Password" placeholder="Password"><button type="submit" class="gm-btn">Log in</button></form><div data-after></div>');
    }
    function typedAnswer(){
      var inp = panelEl.querySelector("[data-input]"), it = S.gap; if (!inp || !it || S.solved.monitor) return;
      var after = panelEl.querySelector("[data-after]");
      if (grade(inp.value, it.term)){
        solve("monitor"); inp.disabled = true;
        after.innerHTML = '<p><b class="ok">Access granted.</b> The screen shows a digit: <b style="color:' + S.colors[S.slotOf.monitor][1] + '">' + S.code[S.slotOf.monitor] + "</b>, for the " + S.colors[S.slotOf.monitor][0] + ' slot on the door.</p><div class="gm-row"><button type="button" class="gm-btn" data-close>Keep looking</button></div>';
        return;
      }
      S.gapTries++; S.tries.monitor = (S.tries.monitor || 0) + 1; C.SFX.bad(); penalize();
      if (S.gapTries >= 2){
        S.missed.push({ q:it.text.replace(new RegExp(it.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "____"), a:it.term });
        after.innerHTML = '<p><b class="bad">Locked out, −' + PENALTY + " s.</b> The password was <b>" + esc(it.term) + '</b>. The computer picks a new one.</p><div class="gm-row"><button type="button" class="gm-btn" data-retry>New password hint</button></div>';
        inp.disabled = true;
      } else { inp.value = ""; after.innerHTML = '<p><b class="bad">Wrong password, −' + PENALTY + " s.</b> One more try.</p>"; }
    }
    function doorPanel(){
      openPanel(SPOTS.door.label, "<p>" + SPOTS.door.text + "</p>" +
        '<form class="sg-door" data-door autocomplete="off">' + S.colors.map(function(c, i){
          var who = Object.keys(S.slotOf).filter(function(id){ return S.slotOf[id] === i; })[0];
          return '<input class="sg-door-in" style="--k:' + c[1] + '" data-slot="' + i + '" inputmode="numeric" pattern="[0-9]" maxlength="1" aria-label="' + c[0] + ' digit" value="' + (S.solved[who] ? S.code[i] : "") + '">';
        }).join("") + '<button type="submit" class="gm-btn">Open</button></form><div data-after></div>');
    }
    function tryDoor(){
      var ins = panelEl.querySelectorAll("[data-slot]"), code = Array.prototype.map.call(ins, function(x){ return x.value.trim(); });
      var after = panelEl.querySelector("[data-after]");
      if (code.join("") === S.code.join("")) return escape();
      C.SFX.bad(); penalize();
      after.innerHTML = '<p><b class="bad">Buzz. Wrong code, −' + PENALTY + " s.</b> " + (S.found < 4 ? "You still have " + (4 - S.found) + " digit" + (4 - S.found === 1 ? "" : "s") + " to find." : "Match each digit to its color.") + "</p>";
    }
    function escape(){
      running = false; clearInterval(timer); closePanel();
      var secs = Math.round(left()), score = 1000 + secs * 5 + S.firstTry * 100;
      track("escape:win");
      C.finish(g, root, score, S.missed, { title:"You escaped!", win:true, note:"With " + clock(secs) + " to spare · " + S.wrongs + " wrong answer" + (S.wrongs === 1 ? "" : "s") });
    }
    function timeUp(){
      running = false; clearInterval(timer); closePanel();
      C.finish(g, root, S.found * 100 + (S.solved.drawer ? 50 : 0), S.missed, { title:"Time's up", note:"You found " + S.found + " of 4 digits. The code was " + S.code.join("") + "." });
    }
    function begin(){
      var ov = stage.querySelector("[data-overlay]"); if (ov) ov.remove();
      var scope = C.currentScope(root), pool = C.bankPool(scope);
      if (pool.length < 8) pool = C.bankPool("all");
      draw = dealer(pool);
      gaps = clozePool(C.notes(scope)); if (gaps.length < 3) gaps = clozePool(C.notes("all"));
      S = { missed:[], tries:{} }; newRoom(); S.deadline = Date.now() + TIME * 1000; running = true;
      paint(); track("escape:start");
      clearInterval(timer);
      timer = setInterval(function(){
        if (!running) return;
        hud();
        var h = scene.querySelector("[data-hand]"); if (h) h.setAttribute("transform", "rotate(" + handAngle() + " " + h.getAttribute("data-cx") + " " + h.getAttribute("data-cy") + ")");
        if (left() <= 0) timeUp();
      }, 500);
    }
    return {
      mount:function(panel){
        panel.innerHTML = C.shell(g, { hud:["time", "locks"], select:C.scopeSelectHTML("bank", 8),
          stage:'<div class="gm-stage sg-stage sg-escape" data-stage><div class="sg-scene" data-scene></div><div class="sg-esc-panel" data-panel hidden></div><div data-inv></div></div>',
          keys:"Tap anything in the room to look at it · every wrong answer costs " + PENALTY + " seconds" });
        root = panel.querySelector(".gm"); stage = root.querySelector("[data-stage]"); scene = root.querySelector("[data-scene]"); panelEl = root.querySelector("[data-panel]"); inv = root.querySelector("[data-inv]");
        S = { solved:{}, items:{}, found:0, missed:[], tries:{}, deadline:Date.now() + TIME * 1000 }; newRoom();
        scene.innerHTML = sceneSVG(); C.setHud(root, { time:clock(TIME), locks:"0/4" }); tagSkin(C, root);
        stage.insertAdjacentHTML("beforeend", C.introHTML(g, (K.intro || ESCAPE_TEXT.intro) + " You have <b>6 minutes</b>, and every wrong answer costs " + PENALTY + " seconds.", K.start || "Start the clock"));
        stage.addEventListener("click", function(e){
          if (e.target.closest("[data-start]")){ begin(); return; }
          if (!running) return;
          if (e.target.closest("[data-close]")){ closePanel(); return; }
          if (e.target.closest("[data-retry]")){ if (S.open === "monitor") typedPanel("monitor", "<p>A new password hint appears.</p>"); else mcqPanel(S.open, "<p>A new question appears.</p>"); return; }
          var c = e.target.closest("[data-c]"); if (c && !panelEl.hidden){ mcqAnswer(+c.getAttribute("data-c")); return; }
          var sp = e.target.closest("[data-spot]"); if (sp && (panelEl.hidden || sp.closest("[data-inv]"))){ look(sp.getAttribute("data-spot")); }
        });
        stage.addEventListener("keydown", function(e){
          var sp = e.target.closest && e.target.closest("g[data-spot]");
          if (sp && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); look(sp.getAttribute("data-spot")); }
          if (e.key === "Escape" && !panelEl.hidden) closePanel();
          var din = e.target.closest && e.target.closest("[data-slot]");
          if (din && /^[0-9]$/.test(e.key)){ e.preventDefault(); din.value = e.key; var nx = din.nextElementSibling; if (nx && nx.hasAttribute("data-slot")) nx.focus(); }
        });
        stage.addEventListener("submit", function(e){
          e.preventDefault(); if (!running) return;
          if (e.target.closest("[data-door]")) tryDoor();
          else if (e.target.closest("[data-pw]")) typedAnswer();
        });
      },
      stop:function(){ running = false; clearInterval(timer); }
    };
  }

  /* =================================================================== CROSS-SECTION (mini crossword) */
  function normWord(s){ return String(s || "").toUpperCase().replace(/[^A-Z]/g, ""); }
  function Cross(g, C){
    var root, stage, S, running = false, hidden, clockT = 0;
    function build(words){
      var best = null;
      for (var attempt = 0; attempt < 40; attempt++){
        var list = shuffled(words).slice(0, 16), G = {}, placed = [];
        var get = function(x, y){ return G[x + "," + y]; };
        var canPlace = function(w, x, y, dir){
          var dx = dir === "A" ? 1 : 0, dy = dir === "D" ? 1 : 0, cross = 0;
          if (get(x - dx, y - dy) || get(x + dx * w.length, y + dy * w.length)) return -1;
          for (var i = 0; i < w.length; i++){
            var cx = x + dx * i, cy = y + dy * i, ch = get(cx, cy);
            if (ch){ if (ch !== w[i]) return -1; cross++; }
            else if (get(cx + dy, cy + dx) || get(cx - dy, cy - dx)) return -1;
          }
          return cross;
        };
        var put = function(t, x, y, dir){ var dx = dir === "A" ? 1 : 0, dy = dir === "D" ? 1 : 0; for (var i = 0; i < t.w.length; i++) G[(x + dx * i) + "," + (y + dy * i)] = t.w[i]; placed.push({ t:t, x:x, y:y, dir:dir }); };
        put(list[0], 0, 0, "A");
        for (var k = 1; k < list.length && placed.length < 9; k++){
          var t = list[k], w = t.w, opts = [];
          Object.keys(G).forEach(function(key){
            var p = key.split(","), gx = +p[0], gy = +p[1], ch = G[key];
            for (var i = 0; i < w.length; i++){ if (w[i] !== ch) continue;
              ["A", "D"].forEach(function(dir){ var x = dir === "A" ? gx - i : gx, y = dir === "D" ? gy - i : gy, c = canPlace(w, x, y, dir); if (c > 0) opts.push({ x:x, y:y, dir:dir, c:c }); }); }
          });
          if (!opts.length) continue;
          opts.sort(function(a, b){ return b.c - a.c; });
          var o = opts[Math.floor(Math.random() * Math.min(3, opts.length))];
          var xs = Object.keys(G).map(function(k2){ return +k2.split(",")[0]; }).concat([o.x, o.dir === "A" ? o.x + w.length - 1 : o.x]);
          var ys = Object.keys(G).map(function(k2){ return +k2.split(",")[1]; }).concat([o.y, o.dir === "D" ? o.y + w.length - 1 : o.y]);
          if (Math.max.apply(null, xs) - Math.min.apply(null, xs) > 12 || Math.max.apply(null, ys) - Math.min.apply(null, ys) > 11) continue;
          put(t, o.x, o.y, o.dir);
        }
        if (!best || placed.length > best.placed.length) best = { placed:placed, G:G };
        if (placed.length >= 8) break;
      }
      var xs2 = [], ys2 = [];
      Object.keys(best.G).forEach(function(k){ var p = k.split(","); xs2.push(+p[0]); ys2.push(+p[1]); });
      var minX = Math.min.apply(null, xs2), minY = Math.min.apply(null, ys2);
      var W = Math.max.apply(null, xs2) - minX + 1, H = Math.max.apply(null, ys2) - minY + 1;
      var sol = {}; Object.keys(best.G).forEach(function(k){ var p = k.split(","); sol[(+p[0] - minX) + "," + (+p[1] - minY)] = best.G[k]; });
      var entries = best.placed.map(function(p){ return { t:p.t, x:p.x - minX, y:p.y - minY, dir:p.dir }; });
      var starts = {}; entries.forEach(function(e){ starts[e.x + "," + e.y] = 1; });
      var num = 0, nums = {};
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (starts[x + "," + y]) nums[x + "," + y] = ++num;
      entries.forEach(function(e){ e.n = nums[e.x + "," + e.y]; });
      entries.sort(function(a, b){ return a.n - b.n; });
      return { W:W, H:H, sol:sol, entries:entries, nums:nums };
    }
    function cellsOf(e){ var out = []; for (var i = 0; i < e.t.w.length; i++) out.push(e.dir === "A" ? (e.x + i) + "," + e.y : e.x + "," + (e.y + i)); return out; }
    function fits(t){ return t.w.length >= 3 && t.w.length <= 11; }
    function newPuzzle(){
      var words = C.termPool(C.currentScope(root), fits);
      if (words.length < 8) words = C.termPool("all", fits);
      S.P = build(words); S.fill = {}; S.marks = {}; S.cur = 0; S.pos = 0; S.pen = 0; S.start = Date.now(); render();
    }
    function curEntry(){ return S.P.entries[S.cur]; }
    function render(){
      var P = S.P, e = curEntry(), wc = cellsOf(e), at = wc[S.pos];
      var grid = "";
      for (var y = 0; y < P.H; y++) for (var x = 0; x < P.W; x++){
        var k = x + "," + y;
        if (!P.sol[k]){ grid += '<div class="cx-cell"></div>'; continue; }
        var cls = "cx-cell on" + (wc.indexOf(k) > -1 ? " word" : "") + (k === at ? " cur" : "") + (S.marks[k] ? " " + S.marks[k] : "");
        grid += '<div class="' + cls + '" data-cx="' + k + '">' + (P.nums[k] ? "<em>" + P.nums[k] + "</em>" : "") + "<span>" + (S.fill[k] || "") + "</span></div>";
      }
      function clueList(dir){ return P.entries.map(function(en, i){ if (en.dir !== dir) return ""; var done = cellsOf(en).every(function(k){ return S.fill[k] === P.sol[k]; }); return '<li><button type="button" class="cx-clue' + (i === S.cur ? " cur" : "") + (done ? " done" : "") + '" data-clue="' + i + '"><b>' + en.n + "</b>" + esc(en.t.c) + "</button></li>"; }).join(""); }
      root.querySelector("[data-body]").innerHTML = '<div><div class="cx-grid" style="grid-template-columns:repeat(' + P.W + ',auto)">' + grid + "</div>" +
        '<div class="cx-tools"><button type="button" class="gm-btn alt" data-cx-act="check">Check (−25)</button><button type="button" class="gm-btn alt" data-cx-act="letter">Reveal letter (−15)</button><button type="button" class="gm-btn alt" data-cx-act="word">Reveal word</button></div></div>' +
        '<div style="min-width:0"><div class="cx-cur">' + e.n + (e.dir === "A" ? " Across" : " Down") + " · " + esc(e.t.c) + '</div><div class="cx-clues"><div><h4>Across</h4><ol>' + clueList("A") + "</ol></div><div><h4>Down</h4><ol>" + clueList("D") + "</ol></div></div></div>";
    }
    function hud(){ C.setHud(root, { score:S.total, words:S.P ? S.P.entries.length : 0, time:S.start ? Math.floor((Date.now() - S.start) / 1000) + "s" : "0s" }); }
    function focusHidden(){ try { hidden.focus({ preventScroll:true }); } catch (e) { hidden.focus(); } }
    function select(i, pos){ S.cur = i; S.pos = pos || 0; var wc = cellsOf(curEntry()); while (S.pos < wc.length - 1 && S.fill[wc[S.pos]] && pos === undefined) S.pos++; render(); focusHidden(); }
    function typeLetter(L){
      var wc = cellsOf(curEntry()), k = wc[S.pos]; S.fill[k] = L; delete S.marks[k];
      if (S.pos < wc.length - 1) S.pos++;
      else { var nxt = S.P.entries.findIndex(function(en, i){ return i > S.cur && cellsOf(en).some(function(c){ return !S.fill[c]; }); }); if (nxt > -1){ select(nxt); return; } }
      render(); checkDone();
    }
    function back(){ var wc = cellsOf(curEntry()), k = wc[S.pos]; if (S.fill[k]) delete S.fill[k]; else if (S.pos > 0){ S.pos--; delete S.fill[wc[S.pos]]; } render(); }
    function checkDone(){
      var all = Object.keys(S.P.sol).every(function(k){ return S.fill[k] === S.P.sol[k]; });
      if (!all) return;
      var secs = Math.round((Date.now() - S.start) / 1000), n = S.P.entries.length, earned = n - (S.revealed || 0);
      var pts = Math.max(0, earned * 120 + Math.round(Math.max(0, 480 - secs) * earned / n) - S.pen);
      S.total += pts; running = false; clearInterval(clockT); C.SFX.win(); hud();
      Object.keys(S.P.sol).forEach(function(k){ S.marks[k] = "ok"; }); render();
      C.finish(g, root, S.total, S.missed, { title:"Solved!", win:earned === n, note:n + " words in " + secs + "s" + (S.revealed ? " · " + S.revealed + " revealed" : "") + (S.pen ? " · penalties −" + S.pen : "") });
    }
    function act(a){
      var P = S.P, e = curEntry(), wc = cellsOf(e);
      if (a === "check"){ S.pen += 25; Object.keys(S.fill).forEach(function(k){ S.marks[k] = S.fill[k] === P.sol[k] ? "ok" : "bad"; }); C.SFX.tick(); }
      if (a === "letter"){ var k = wc[S.pos]; S.pen += 15; S.fill[k] = P.sol[k]; S.marks[k] = "ok"; }
      if (a === "word"){ if (wc.every(function(k3){ return S.fill[k3] === P.sol[k3]; })) return; S.revealed = (S.revealed || 0) + 1; wc.forEach(function(k2){ S.fill[k2] = P.sol[k2]; S.marks[k2] = "ok"; }); S.missed.push({ q:e.t.c, a:e.t.w }); }
      render(); checkDone(); focusHidden();
    }
    function begin(){ var ov = stage.querySelector("[data-overlay]"); if (ov) ov.remove(); S = { total:0, missed:[] }; running = true; newPuzzle(); hud(); clearInterval(clockT); clockT = setInterval(function(){ if (running) hud(); }, 1000); focusHidden(); }
    function kd(e){
      if (!running || !stillMounted(root)) return;
      if (e.target && e.target.tagName === "SELECT") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var wc = cellsOf(curEntry());
      if (/^[a-zA-Z]$/.test(e.key)){ e.preventDefault(); typeLetter(e.key.toUpperCase()); }
      else if (e.key === "Backspace"){ e.preventDefault(); back(); }
      else if (e.key === "Tab" || e.key === "Enter"){ e.preventDefault(); select((S.cur + (e.shiftKey ? S.P.entries.length - 1 : 1)) % S.P.entries.length); }
      else if (e.key === "ArrowRight" || e.key === "ArrowDown"){ e.preventDefault(); if (S.pos < wc.length - 1){ S.pos++; render(); } }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp"){ e.preventDefault(); if (S.pos > 0){ S.pos--; render(); } }
    }
    return {
      mount:function(panel){
        panel.innerHTML = C.shell(g, { hud:["score", "words", "time"], select:C.scopeSelectHTML("terms", 8), stage:'<div class="gm-stage cx-stage" data-stage><input class="cx-hidden" data-hidden autocapitalize="characters" autocomplete="off" aria-label="Crossword input"><div class="cx-body" data-body style="display:contents"></div></div>', keys:"Type to fill · <kbd>Tab</kbd> next clue · <kbd>Backspace</kbd> erase · tap a square or clue to jump" });
        root = panel.querySelector(".gm"); stage = root.querySelector("[data-stage]"); hidden = root.querySelector("[data-hidden]");
        S = { total:0, missed:[] }; tagSkin(C, root);
        stage.insertAdjacentHTML("beforeend", C.introHTML(g, "A new mini crossword from the course terms every game. Fill every square; the faster you finish, the bigger the time bonus. Checking and revealing letters costs points.", "New puzzle"));
        stage.addEventListener("click", function(e){
          if (e.target.closest("[data-start]")){ begin(); return; }
          if (!running) return;
          var cl = e.target.closest("[data-clue]"); if (cl){ select(+cl.getAttribute("data-clue")); return; }
          var a = e.target.closest("[data-cx-act]"); if (a){ act(a.getAttribute("data-cx-act")); return; }
          var c = e.target.closest("[data-cx]");
          if (c){
            var k = c.getAttribute("data-cx"), cands = [];
            S.P.entries.forEach(function(en, i){ var p = cellsOf(en).indexOf(k); if (p > -1) cands.push({ i:i, p:p }); });
            var curHas = cands.filter(function(x){ return x.i === S.cur; })[0];
            var choice = curHas && cands.length > 1 && cellsOf(curEntry())[S.pos] === k ? cands.filter(function(x){ return x.i !== S.cur; })[0] : (curHas || cands[0]);
            if (choice) select(choice.i, choice.p);
          }
        });
        hidden.addEventListener("input", function(){ var v = normWord(hidden.value); hidden.value = ""; if (!running) return; v.split("").forEach(typeLetter); });
        document.addEventListener("keydown", kd);
      },
      stop:function(){ running = false; clearInterval(clockT); document.removeEventListener("keydown", kd); }
    };
  }

  /* The show's grin: lips, gums, two rows of teeth and a gold tooth that sparkles. o = { lips, lipsDark, gum, gold, inside } */
  var grinSeq = 0;
  function grinSVG(o, cls, goldOn){
    var id = "sg-grin-" + (++grinSeq), t = "", i, x, w, gold = o.gold || "#FFD84D";
    var upper = [[46, 15], [62, 16], [79, 18], [98, 21], [120, 21], [142, 18], [161, 16], [178, 15]];
    for (i = 0; i < upper.length; i++){
      x = upper[i][0]; w = upper[i][1];
      var isGold = i === 5, h = i === 3 || i === 4 ? 25 : i === 2 || i === 5 ? 22 : 19;
      t += '<rect x="' + x + '" y="40" width="' + (w - 1.5) + '" height="' + h + '" rx="5" fill="' + (isGold ? (goldOn ? "url(#" + id + "-g)" : "#fffdf6") : "#fffdf6") + '" stroke="' + (isGold && goldOn ? "#b8860b" : "#d9cfc0") + '" stroke-width="1.4"/>';
    }
    for (i = 0; i < 7; i++) t += '<rect x="' + (60 + i * 18) + '" y="' + (78 - Math.abs(i - 3) * 1.5) + '" width="16.5" height="16" rx="4" fill="#f4ede0" stroke="#d9cfc0" stroke-width="1.2"/>';
    return '<svg class="' + (cls || "") + '" viewBox="0 0 240 120" aria-hidden="true"><defs><clipPath id="' + id + '"><path d="M34 46C80 34 160 34 206 46C188 96 52 96 34 46Z"/></clipPath>' +
      '<linearGradient id="' + id + '-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="' + gold + '"/><stop offset="1" stop-color="#c8920e"/></linearGradient></defs>' +
      '<path d="M14 44C44 22 92 26 120 34 148 26 196 22 226 44 206 110 34 110 14 44Z" fill="' + (o.lips || "#FF6FA3") + '"/>' +
      '<path d="M14 44C44 22 92 26 120 34 148 26 196 22 226 44 196 40 160 32 120 40 80 32 44 40 14 44Z" fill="' + (o.lipsDark || "#d94c84") + '"/>' +
      '<path d="M34 46C80 34 160 34 206 46C188 96 52 96 34 46Z" fill="' + (o.inside || "#4a1028") + '"/>' +
      '<g clip-path="url(#' + id + ')"><path d="M30 36H210V46C160 38 80 38 30 46Z" fill="' + (o.gum || "#ff9fbd") + '"/>' + t + '<ellipse cx="120" cy="96" rx="44" ry="12" fill="#e2557f"/></g>' +
      '<ellipse cx="120" cy="96" rx="40" ry="5" fill="#fff" opacity=".28"/>' +
      (goldOn ? '<path class="sg-spark" d="M152 18l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="' + gold + '" stroke="#fff" stroke-width="1"/><circle class="sg-spark" cx="170" cy="30" r="2.5" fill="#fff"/>' : "") + "</svg>";
  }
  /* o.bg: a painted stage (the hub's own art, e.g. img/smile-stage.webp) that replaces the drawn grin */
  function marqueeHTML(o, title, sub, goldOn){
    if (o.bg) return '<div class="ms-banner ms-banner--art" style="background-image:url(&quot;' + esc(o.bg) + '&quot;)">' +
      '<div class="ms-title"><b>' + esc(title) + "</b><span>" + sub + "</span></div></div>";
    return '<div class="ms-banner">' + grinSVG(o, "ms-grin", goldOn) +
      '<div class="ms-title"><b>' + esc(title) + "</b><span>" + sub + "</span></div></div>";
  }

  /* =================================================================== MILLION-DOLLAR SMILE (quiz ladder)
     12 rungs, safe havens at $1,000 and $32,000, three lifelines (50:50, Ask the Class, Swap). */
  function Smile(g, C){
    var LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000], SAFE = [4, 9];
    var root, stage, S, running = false, draw, K = skinOf(C, "smile");
    function banked(){ return S.rung > 0 ? LADDER[S.rung - 1] : 0; }
    function safeAmount(){ var s = 0; SAFE.forEach(function(i){ if (S.rung > i) s = LADDER[i]; }); return s; }
    function ladderHTML(){ return '<ol class="ms-ladder">' + LADDER.map(function(v, i){ return '<li class="' + (SAFE.indexOf(i) > -1 ? "safe " : "") + (i === S.rung ? "on" : i < S.rung ? "done" : "") + '"><span>' + (i + 1) + "</span><span>" + money(v) + "</span></li>"; }).join("") + "</ol>"; }
    function newQ(){ S.deal = dealMCQ(draw(), 4); S.gone = []; S.locked = -1; S.note = ""; render(); }
    function render(){
      var d = S.deal;
      root.querySelector("[data-body]").innerHTML = '<div class="ms-main">' + marqueeHTML(K, K.title || g.name, "Playing for <b>" + money(LADDER[S.rung]) + "</b>" + (safeAmount() ? " · safe: " + money(safeAmount()) : ""), S.rung >= 5) + '<div class="ms-life">' +
        '<button type="button" class="ms-lifebtn" data-life="fifty"' + (S.used.fifty ? " disabled" : "") + ">50:50</button>" +
        '<button type="button" class="ms-lifebtn" data-life="class"' + (S.used["class"] ? " disabled" : "") + ">Ask the class</button>" +
        '<button type="button" class="ms-lifebtn" data-life="swap"' + (S.used.swap ? " disabled" : "") + ">Swap question</button>" +
        '<button type="button" class="ms-lifebtn ms-walk" data-walk' + (S.rung === 0 ? " disabled" : "") + ">Walk away with " + money(banked()) + "</button></div>" +
        '<div class="ms-q"><div class="ms-for">FOR ' + money(LADDER[S.rung]) + " · " + esc(C.lecName(d.q.lec)) + "</div>" + esc(d.q.stem) + "</div>" +
        '<div class="ms-opts">' + d.opts.map(function(o, i){ return '<button type="button" class="ms-opt' + (S.gone.indexOf(i) > -1 ? " gone" : "") + (S.locked === i ? " locked" : "") + '" data-ms="' + i + '"><b>' + LETTERS[i] + ":</b><span>" + esc(o.text) + "</span></button>"; }).join("") + "</div>" +
        '<div class="ms-note" data-note>' + S.note + "</div></div>" + ladderHTML();
    }
    function hud(){ C.setHud(root, { score:money(banked()), rung:(S.rung + 1) + "/12" }); }
    function lock(i){
      if (S.locked > -1 || S.gone.indexOf(i) > -1) return;
      S.locked = i; render(); C.SFX.tick();
      var d = S.deal;
      setTimeout(function(){
        if (!running) return;
        var ok = i === d.right;
        C.record(d.q, ok, d.opts[i].idx);
        var btns = root.querySelectorAll("[data-ms]");
        btns[d.right].classList.remove("locked"); btns[d.right].classList.add("right");
        if (ok){
          C.SFX.good(); S.rung++; hud();
          if (S.rung >= LADDER.length){ setTimeout(function(){ end(LADDER[LADDER.length - 1], true); }, 1000); return; }
          var note = root.querySelector("[data-note]"); if (note) note.innerHTML = "<b>Correct!</b> " + (SAFE.indexOf(S.rung - 1) > -1 ? money(LADDER[S.rung - 1]) + " is now safe. " : "") + (d.q.ex ? esc(d.q.ex) : "");
          setTimeout(function(){ if (running) newQ(); }, d.q.ex ? 2600 : 1400);
        } else {
          C.SFX.bad(); S.missed.push({ q:d.q.stem, a:d.q.choices[d.q.answer] });
          var n2 = root.querySelector("[data-note]"); if (n2) n2.innerHTML = "The answer was <b>" + esc(d.opts[d.right].text) + "</b>. You leave with " + money(safeAmount()) + ".";
          setTimeout(function(){ end(safeAmount(), false); }, 2600);
        }
      }, 1100);
    }
    function lifeline(k){
      if (S.used[k] || S.locked > -1) return;
      S.used[k] = true; var d = S.deal;
      if (k === "fifty"){
        S.gone = shuffled([0, 1, 2, 3].filter(function(i){ return i !== d.right; })).slice(0, 2);
        S.note = "Two wrong answers removed."; render();
      } else if (k === "swap"){
        newQ(); S.note = "Fresh question, same rung."; render();
      } else if (k === "class"){
        var wrong = [0, 1, 2, 3].filter(function(i){ return i !== d.right && S.gone.indexOf(i) === -1; });
        if (wrong.length > 1) S.gone.push(pick(wrong));
        S.note = "The class rules one answer out. Checking how classmates did on this question…"; render();
        var qid = d.q.id;
        if (window.shGetClassStats) window.shGetClassStats([qid], function(by){
          if (!running || S.deal.q.id !== qid) return;
          var r = by[qid];
          S.note = "The class rules one answer out. " + (r && r.total ? "<b>" + Math.round(100 * r.correct / r.total) + "%</b> of classmates got this one right (n=" + r.total + ")." : "Not enough class data on this question yet.");
          var n = root.querySelector("[data-note]"); if (n) n.innerHTML = S.note;
        });
      }
    }
    function begin(){
      var ov = stage.querySelector("[data-overlay]"); if (ov) ov.remove();
      var pool = C.bankPool(C.currentScope(root)); if (pool.length < 12) pool = C.bankPool("all");
      draw = dealer(pool);
      S = { rung:0, used:{}, missed:[] }; running = true; hud(); newQ();
    }
    function end(amount, win){ running = false; C.finish(g, root, amount, S.missed, win ? { title:"Million-dollar smile!", win:true, note:"You climbed all 12 rungs." } : { title:S.walked ? "You walked away" : "Game over", note:"You reached rung " + (S.rung + 1) + " of 12." }); }
    function kd(e){ if (!running || !stillMounted(root) || typingIn(e)) return; var n = parseInt(e.key, 10); if (n >= 1 && n <= 4){ e.preventDefault(); lock(n - 1); } }
    return {
      mount:function(panel){
        panel.innerHTML = C.shell(g, { hud:["score", "rung"], select:C.scopeSelectHTML("bank", 12), stage:'<div class="gm-stage" data-stage><div class="ms-stage" data-body style="min-height:430px"></div></div>', keys:"Tap an answer to lock it in · <kbd>1</kbd>-<kbd>4</kbd> also work" });
        root = panel.querySelector(".gm"); stage = root.querySelector("[data-stage]");
        S = { rung:0, used:{} }; hud(); tagSkin(C, root);
        root.querySelector("[data-body]").innerHTML = '<div class="ms-main">' + marqueeHTML(K, K.title || g.name, "Twelve questions to <b>$125,000</b>", true) + "</div>";
        stage.insertAdjacentHTML("beforeend", C.introHTML(g, "Twelve questions from the bank stand between you and <b>$125,000</b>. Miss one and you drop to your last safe haven ($1,000 or $32,000). Three lifelines: <b>50:50</b>, <b>Ask the class</b> (rules one answer out and shows how classmates did) and <b>Swap</b>. You can walk away with your winnings any time.", "Let's play"));
        stage.addEventListener("click", function(e){
          if (e.target.closest("[data-start]")){ begin(); return; }
          if (!running) return;
          var o = e.target.closest("[data-ms]"); if (o){ lock(+o.getAttribute("data-ms")); return; }
          var lf = e.target.closest("[data-life]"); if (lf){ lifeline(lf.getAttribute("data-life")); return; }
          if (e.target.closest("[data-walk]") && S.locked < 0 && S.rung > 0){ S.walked = true; end(banked(), false); }
        });
        document.addEventListener("keydown", kd);
      },
      stop:function(){ running = false; document.removeEventListener("keydown", kd); }
    };
  }

  var MAKERS = { board:Board, cloze:Gap, escape:Escape, cross:Cross, smile:Smile };
  window.shGames = {
    ids:Object.keys(MAKERS),
    make:function(id, g, C){ return MAKERS[id] ? MAKERS[id](g, C) : null; },
    clozePool:clozePool,
    grade:grade
  };
})();
