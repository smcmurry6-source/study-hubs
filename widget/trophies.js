/* study-hubs: the trophy case on the design system (redesign phase 4, session 6; Sam's yes to the contact sheet,
   2026-11-13). The redesign's pages only: a new hub's More, "Stats and trophies" (widget/hub.js) and the new dashboard's
   "you" card (widget/dash.js) fetch it through shRanks.trophyCase(cb), which brings the drawings first
   (widget/hub-art/trophies.js, window.SH_TROPHY_ART); it loads its own stylesheet (widget/trophies.css,
   shRanks.trophyCss). Nothing loads it with a page.

   window.shTrophies.mount(el, options) draws, in el:
   - the rank: the medallion in front of turning rays, the rank's name in flat metal, the level, the XP to the next step
     and, on the game layer, the road ahead (shJourneys.road, fetched by shRanks.journeys);
   - the showcase: one trophy on a gold stand, with its name, what it was for and the class's share. It opens on your
     rarest trophy (or the next one to win) and shows whichever you tap;
   - the cabinet: Won by studying, The journeys, Secrets (27 trophies, 16 of them secret: shRanks.TROPHIES on the
     redesign) and, only for someone who earned it, Full Arch on a shelf of its own, "Full Arch (retired)".
   A trophy won: its drawing, lit. Not won: dimmed, with what earns it. A secret not found: its silhouette and its
   riddle, never its name (not in the page, not in a label). Bowling is won on this device (sh_bowl_trophy) and the
   server has no share for it. Mounting again on the same element redraws it and keeps the trophy picked.
   options = { profile (the rank profile, v2 or not; badges are the trophies won), stats (kind -> { n, total }; read
   with shRanks.trophyStats when left out), sb (a Supabase client for that), onBoards (shows a Leaderboards button) }.
   Every button carries a fixed data-sht value first, so click counts never record which trophy was tapped. */
(function(){
  "use strict";
  if (window.shTrophies || !window.shRanks) return;
  var R = window.shRanks, INK = "#3B2E3A", ROMAN = ["I", "II", "III"];
  var METAL = ["stone", "antique", "bronze", "silver", "gold", "diamond", "dark"];
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString("en-US"); }

  /* ---------- the list: shRanks.TROPHIES on the redesign (Full Arch out, the journeys and Bowling in) ---------- */
  function groups(){
    var T = R.TROPHIES;
    return {
      study: T.filter(function(t){ return !t.secret && !t.scene; }),
      journeys: T.filter(function(t){ return t.scene; }),
      secrets: T.filter(function(t){ return t.secret; })
    };
  }
  function meta(k){ return R.TROPHIES.concat(R.RETIRED || []).filter(function(t){ return t.k === k; })[0] || null; }
  function isRetired(k){ return (R.RETIRED || []).some(function(t){ return t.k === k; }); }
  function earnedOf(p){
    var e = {}; ((p && p.badges) || []).forEach(function(b){ e[String(b).split(":")[0]] = 1; });
    R.TROPHIES.forEach(function(t){ if (t.device && ls(t.device)) e[t.k] = 1; });
    return e;
  }
  function shareOf(st, k){
    if (isRetired(k)) return null;
    var s = st.stats && st.stats[k]; if (!s || !s.total) return null;
    var p = s.n / s.total * 100;
    return { n: s.n, total: s.total, p: p, label: !s.n ? "Nobody yet" : p < 1 ? "Under 1%" : Math.round(p) + "%" };
  }
  function stateOf(st, k){ var t = meta(k); return st.earned[k] ? "won" : t && t.secret ? "secret" : "open"; }

  /* ---------- the drawings ---------- */
  function svg(k, sil){
    var A = window.SH_TROPHY_ART, t = A && A[k]; if (!t) return "";
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + (sil ? t.sil || "" : t.body) + "</svg>";
  }
  /* rays behind the stand or the medallion: flat wedges, no gradient */
  function rays(n, color, op){
    var s = "", i, a, b;
    for (i = 0; i < n; i++) {
      a = i * 2 * Math.PI / (n * 2); b = (i * 2 + 1) * Math.PI / (n * 2);
      s += "M100 100L" + (100 + Math.cos(a) * 150).toFixed(1) + " " + (100 + Math.sin(a) * 150).toFixed(1) + "L" + (100 + Math.cos(b) * 150).toFixed(1) + " " + (100 + Math.sin(b) * 150).toFixed(1) + "Z";
    }
    return '<svg class="sht-rays" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="' + s + '" fill="' + color + '" opacity="' + op + '"/></svg>';
  }
  /* the showcase's stand: a gold drum on a step */
  var STAND = '<svg class="sht-stand" viewBox="0 0 200 64" aria-hidden="true" focusable="false">' +
    '<path d="M18 40 H182 V52 C182 57 176 60 168 60 H32 C24 60 18 57 18 52Z" fill="#C9971C" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="40" rx="82" ry="12" fill="#E2B13C" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M40 22 H160 V34 C160 38 134 42 100 42 C66 42 40 38 40 34Z" fill="#D9A21A" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="22" rx="60" ry="9" fill="#F6CD55" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M58 21 C70 17 88 15.5 104 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>';

  /* ---------- a trophy on a shelf ---------- */
  function label(st, k){
    var t = meta(k), s = stateOf(st, k), sh = shareOf(st, k);
    if (s === "secret") return "Secret trophy, not found yet. Clue: " + t.clue + (sh && sh.n ? " Found by " + sh.label + " of the class." : "");
    if (isRetired(k)) return t.n + " (retired), won. " + t.d + ".";
    return t.n + (s === "won" ? ", won. " : ", not won yet. ") + t.d + "." + (sh ? " " + (sh.n ? sh.label + " of the class has it." : "Nobody has it yet.") : "");
  }
  function slot(st, k){
    var t = meta(k), s = stateOf(st, k), sel = k === st.sel;
    return '<li><button type="button" data-sht="trophy" data-k="' + esc(k) + '" class="sht-tro is-' + s + (sel ? " is-sel" : "") + '" aria-pressed="' + sel + '" aria-label="' + esc(label(st, k)) + '">' +
      (s === "won" ? '<span class="sht-lamp" aria-hidden="true"></span>' : "") +
      '<span class="sht-obj" aria-hidden="true">' + svg(k, s === "secret") + "</span>" +
      '<span class="sht-pl" aria-hidden="true"><span class="sht-plate">' + (s === "secret" ? "Secret" : esc(isRetired(k) ? t.n + " (retired)" : t.n)) + "</span></span></button></li>";
  }
  function shelf(st, title, list, cls){
    var keys = list.map(function(t){ return t.k; }), won = keys.filter(function(k){ return st.earned[k]; }).length, retired = cls === "is-retired";
    return '<section class="sht-shelf ' + (cls || "") + '">' +
      '<h3 class="sht-shelf-h">' + esc(title) + (retired ? "" : ' <span class="num">' + won + " of " + keys.length + '<span class="sr"> won</span></span>') + "</h3>" +
      '<ul class="sht-row n' + keys.length + '">' + keys.map(function(k){ return slot(st, k); }).join("") + "</ul></section>";
  }

  /* ---------- the showcase: the trophy picked ---------- */
  function showcase(st){
    var k = st.sel, t = meta(k); if (!t) return "";
    var s = stateOf(st, k), sh = shareOf(st, k), retired = isRetired(k), secret = s === "secret";
    var tag = st.why || (s === "won" ? "Won" : secret ? "Secret" : "Not won yet");
    return '<div class="sht-show is-' + s + '"><div class="sht-show-art" aria-hidden="true">' + rays(18, s === "won" ? "#F6CD55" : "#B9ADB6", s === "won" ? .55 : .3) +
      '<span class="sht-show-obj">' + svg(k, secret) + "</span>" + STAND + "</div>" +
      '<div class="sht-show-tx"><span class="sht-tag">' + esc(tag) + "</span>" +
      "<h3>" + (secret ? "A secret trophy" : esc(retired ? t.n + " (retired)" : t.n)) + "</h3>" +
      '<p class="sht-show-d">' + esc(secret ? t.clue : retired ? "You filled all 32 teeth of the arch. The chart is gone; the trophy stays yours." : t.d + ".") + "</p>" +
      (sh ? '<div class="sht-meter"><p><b class="num">' + esc(sh.label) + "</b>" + (sh.n ? " of the class " + (secret ? "has found it" : "has it") : "") + "</p>" +
        '<span class="sht-mbar" aria-hidden="true"><i style="width:' + Math.max(sh.n ? 2 : 0, Math.min(100, sh.p)).toFixed(1) + '%"></i></span></div>'
        : k === "bowling" && s === "won" ? '<div class="sht-meter"><p>Won on this device.</p></div>' : "") +
      "</div></div>";
  }
  /* what the showcase opens on: your rarest trophy, or the next one to win */
  function pick(st){
    var g = groups(), all = g.study.concat(g.journeys, g.secrets).map(function(t){ return t.k; });
    var won = all.filter(function(k){ return st.earned[k]; });
    if (won.length) {
      won.sort(function(a, b){ var x = shareOf(st, a), y = shareOf(st, b); return (x ? x.p : 101) - (y ? y.p : 101); });
      return [won[0], "Your rarest"];
    }
    return [all.filter(function(k){ return !st.earned[k] && !meta(k).secret; })[0] || all[0], "Next up"];
  }

  /* ---------- the rank ---------- */
  function rankHTML(st){
    var p = st.profile;
    if (!p) return '<section class="panel sht-rank no-road" aria-labelledby="shtRankH"><div class="sht-me"><div class="sht-mebody"><p class="sht-kicker">Your rank</p>' +
      '<h2 id="shtRankH" class="sht-rname">Not loaded yet</h2><p class="sht-next">Your rank, XP and trophies load when you’re online.</p></div></div></section>';
    var v2 = p.journey != null, j = v2 ? Math.max(0, Math.min(2, p.journey | 0)) : 0, t = Math.max(0, Math.min(6, p.tier | 0)), lv = p.level || 1;
    var step = p.step != null ? p.step : t * 3 + lv - 1, xp = p.xp || 0, next = p.next_at, at = p.step_at != null ? p.step_at : 0;
    var pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1, ns = step + 1;
    var name = v2 ? R.nameOf(p) : R.rankName(t, lv);
    var nextName = !next ? "" : v2 ? R.nameOf({ journey: Math.floor(ns / 21), tier: Math.floor(ns % 21 / 3), level: ns % 3 + 1 }) : R.rankName(Math.floor(ns / 3), ns % 3 + 1);
    var note = v2 ? "10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss and 20 for every day you study. A question pays its first three right and its first three wrong answers a day. More comes from the day’s 20th answer, fixing a miss, a finished mock exam and every mastery medal, which also starts 24 hours of double XP."
      : "10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss and 20 for every day you study (answer XP tops out at 600 a day).";
    return '<section class="panel sht-rank' + (v2 ? "" : " no-road") + '" data-metal="' + METAL[t] + '" aria-labelledby="shtRankH">' +
      '<div class="sht-me"><span class="sht-medal" aria-hidden="true">' + rays(20, "var(--metal)", .2) + '<span class="sht-medal-art" data-sht-medal>' + R.artOf(j, t, 152, { animate: true, level: lv }) + "</span></span>" +
      '<div class="sht-mebody"><p class="sht-kicker">Your rank</p><h2 id="shtRankH" class="sht-rname"><span class="sr">Your rank: </span>' + esc(name) + "</h2>" +
      '<p class="sht-lv"><span class="sht-pips" aria-hidden="true">' + [1, 2, 3].map(function(i){ return '<i class="' + (i <= lv ? "on" : "") + '"></i>'; }).join("") + "</span>" +
      "<span>Level " + ROMAN[lv - 1] + " of III</span></p>" +
      '<p class="sht-xp num"><b>' + fmt(xp) + " XP</b>" + (p.position ? " · #" + fmt(p.position) + " of " + fmt(p.of) + " in the class" : "") + "</p>" +
      '<div class="sht-bar" role="progressbar" aria-label="Progress to ' + esc(nextName || "the top") + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct * 100) + '"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
      '<p class="sht-next">' + (next ? '<b class="num">' + fmt(next - xp) + " XP</b> to " + esc(nextName) : "The highest rank there is.") + "</p></div></div>" +
      (v2 ? '<div class="sht-road" data-sht-road><h3>The road ahead</h3><div data-sht-roadin></div></div>' : "") +
      '<div class="sht-foot"><p class="note">' + note + "</p>" +
      (st.onBoards ? '<button class="btn" type="button" data-sht="boards">Leaderboards</button>' : "") + "</div></section>";
  }

  /* ---------- the case ---------- */
  function caseHTML(st){
    var g = groups(), all = g.study.concat(g.journeys, g.secrets);
    var won = all.filter(function(t){ return st.earned[t.k]; }).length, found = g.secrets.filter(function(t){ return st.earned[t.k]; }).length;
    var kept = (R.RETIRED || []).filter(function(t){ return st.earned[t.k]; });
    return '<section class="sht-case" aria-labelledby="shtCaseH"><h2 id="shtCaseH" class="sr">Trophy case: ' + won + " of " + all.length + " won, " + found + " of " + g.secrets.length + " secrets found</h2>" +
      '<div class="sht-showwrap" aria-live="polite">' + showcase(st) + "</div>" +
      '<div class="sht-cab"><div class="sht-crown"><span class="sht-plaque" aria-hidden="true"><b>Trophy case</b><span class="num">' + won + " of " + all.length + " · " + found + " of " + g.secrets.length + " secrets</span></span></div>" +
      '<div class="sht-bay"><i class="sht-glint g1" aria-hidden="true"></i><i class="sht-glint g2" aria-hidden="true"></i>' +
      shelf(st, "Won by studying", g.study) + shelf(st, "The journeys", g.journeys, "is-journeys") + shelf(st, "Secrets", g.secrets) +
      (kept.length ? shelf(st, "Retired", kept, "is-retired") : "") +
      '</div><div class="sht-base" aria-hidden="true"></div></div></section>';
  }

  function draw(el){
    var st = el.__sht;
    st.earned = earnedOf(st.profile);
    /* until a trophy is tapped, the showcase follows the data (the shares change which one is rarest) */
    if (st.auto || !st.sel || !meta(st.sel) || (isRetired(st.sel) && !st.earned[st.sel])) { var pk = pick(st); st.sel = pk[0]; st.why = pk[1]; st.auto = true; }
    var f = document.activeElement, fk = f && el.contains(f) && f.getAttribute ? f.getAttribute("data-sht") + "|" + (f.getAttribute("data-k") || "") : "";
    el.innerHTML = '<div class="sht">' + rankHTML(st) + caseHTML(st) + "</div>";
    if (fk) { var back = el.querySelector('[data-sht="' + fk.split("|")[0] + '"]' + (fk.split("|")[1] ? '[data-k="' + fk.split("|")[1] + '"]' : "")); if (back) try { back.focus({ preventScroll: true }); } catch (e) {} }
    road(el);
  }
  /* the road ahead and a later journey's medallion: widget/journeys.js and its drawings, fetched once */
  function road(el){
    var st = el.__sht, p = st.profile; if (!p || p.journey == null || !R.journeys) return;
    R.journeys(function(J){
      if (!el.isConnected || el.__sht !== st) return;
      var m = el.querySelector("[data-sht-medal]");
      if (m && (p.journey | 0) > 0) m.innerHTML = R.artOf(p.journey | 0, p.tier | 0, 152, { animate: true, level: p.level || 1 });
      var r = el.querySelector("[data-sht-roadin]");
      if (r && J && J.road) r.innerHTML = J.road(p); else if (r) r.parentNode.hidden = true;
    });
  }
  /* the showcase and the pressed trophy, without drawing the rest again */
  function select(el, k){
    var st = el.__sht; if (!meta(k)) return;
    st.sel = k; st.why = ""; st.auto = false;
    var wrap = el.querySelector(".sht-showwrap"); if (wrap) wrap.innerHTML = showcase(st);
    el.querySelectorAll('[data-sht="trophy"]').forEach(function(b){ var on = b.getAttribute("data-k") === k; b.classList.toggle("is-sel", on); b.setAttribute("aria-pressed", String(on)); });
  }

  function mount(el, o){
    if (!el) return;
    o = o || {};
    var first = !el.__sht, st = el.__sht || (el.__sht = { sel: "", why: "" });
    st.profile = o.profile || null; st.onBoards = typeof o.onBoards === "function" ? o.onBoards : null;
    if (o.stats) st.stats = o.stats;
    if (first) {
      el.addEventListener("click", function(e){
        var b = e.target.closest && e.target.closest("[data-sht]"); if (!b || !el.contains(b)) return;
        var what = b.getAttribute("data-sht");
        if (what === "trophy") select(el, b.getAttribute("data-k"));
        else if (what === "boards" && el.__sht.onBoards) el.__sht.onBoards();
      });
      el.innerHTML = '<p class="sht-wait">Opening the trophy case…</p>';
    }
    /* the stylesheet first, so nothing shows unstyled */
    (R.trophyCss || function(f){ f(); })(function(){
      if (el.__sht !== st) return;
      draw(el);
      if (!o.stats && R.trophyStats) R.trophyStats(function(d){ if (d && el.isConnected && el.__sht === st && st.stats !== d) { st.stats = d; draw(el); } }, o.sb);
    });
  }
  /* Bowling is won on the device, maybe while the case is open */
  document.addEventListener("sh:bowl-trophy", function(){
    document.querySelectorAll(".sht").forEach(function(c){ var el = c.parentNode; if (el && el.__sht) draw(el); });
  });

  window.shTrophies = { mount: mount };
})();
