/* ============ DAILY DRILL (loaded by widget/v3.js) ============
   A short set of questions each day, per hub, so what you've studied doesn't fade:
     1. questions due for spaced review (sh_srs_<hub>, kept by v3.js: a miss comes back the next
        day, a right answer after 1, 2, 4, then 7 days, never after the day before the exam), up to 6 of the 10;
     2. questions you missed before spaced review existed (your latest try on this device was wrong),
        up to 8 of the 10 together with (1);
     3. high-yield questions from lectures you've already studied: the ones the class gets wrong
        most (question_stats, 5+ attempts) and the ones the hub marks as high-yield (class quiz,
        exam-review guide...). No more than 3 from one lecture in this pass.
   Any shortfall is filled from what's left. The set is picked once a day and saved, so it doesn't
   change under you; "10 more" picks another set that skips everything already seen today.

   The hub supplies the questions and draws each card with its own renderer (so every question type,
   the explanation, class % and Report button look the way they do everywhere else):
     window.SH_DRILL = {
       pool(): [{ id, lec, last: true | false | null (your latest try on this device),
                  hy: "" or why it's high-yield, e.g. "On the class quiz" }],
       render(el, qid): draw that question's card into el, wired to the hub's own answer handler;
                        return false if the id is unknown
       scope: optional label (string or function), e.g. "Midterm scope: sessions 1-4"
     }
   Answers go through the hub's normal path (its answered event), so class stats, spaced review, XP
   and Weak Spots all update as usual. Any element with data-sh-drill opens the drill; so does
   opening a hub at #drill (the dashboard links there).

   This device only: sh_drill_<hub> = { day, items:[{id, why, note}], res:{qid: 1 | 0 | "s"},
   start (first item of the current set), done (the day's first set is finished), cheer };
   sh_drill_days = { "YYYY-MM-DD": 1 } for the drill streak (a finished set in any hub counts). ============ */
(function(){
  if (window.shDrill) return;
  var SIZE = 10;
  var H = null, HUB = "", KEY = "", DAYS_KEY = "sh_drill_days";
  var dlg = null, body = null, opener = null, isOpen = false, cur = -1, stats = null;

  function svg(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var IC_BOLT = svg('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>');
  var IC_CHECK = svg('<path d="m5 12.5 4.2 4.2L19 7"/>');
  var IC_X = svg('<path d="M7 7l10 10M17 7 7 17"/>');
  var IC_SKIP = svg('<path d="M6 12h12"/>');
  var IC_FLAME = svg('<path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.4-2.4-5.3-3.4-8.4-.4 1.9-1.4 3.1-2.6 3.7.2-2.7-.9-5.3-3.2-6.7.3 3.1-2.8 5.4-2.8 9.3C6 18.6 8.4 21 12 21z"/>');

  function hook(){ var d = window.SH_DRILL; return d && typeof d.pool === "function" && typeof d.render === "function" ? d : null; }
  function esc(s){ return H.esc(s); }
  function today(){ return H.day(0); }
  function lsGet(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function loadSet(){ var s = lsGet(KEY); return s && s.day === today() && Array.isArray(s.items) && s.items.length ? s : null; }
  function saveSet(s){ lsSet(KEY, s); }
  function pool(){ try { var p = hook().pool(); return Array.isArray(p) ? p.filter(function(x){ return x && x.id; }) : []; } catch (e) { return []; } }
  function scopeLabel(){ try { var s = hook().scope; return String((typeof s === "function" ? s() : s) || ""); } catch (e) { return ""; } }
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* the current set, minus any question that has left the bank since it was picked (res "x") */
  function round(s){ return s.items.slice(s.start || 0).filter(function(it){ return s.res[it.id] !== "x"; }); }
  function has(s, id){ var r = s.res[id]; return r === 1 || r === 0 || r === "s" || r === "x"; }
  function firstOpen(s){ for (var i = s.start || 0; i < s.items.length; i++) if (!has(s, s.items[i].id)) return i; return -1; }

  /* ---------- streak: consecutive days with a finished set, in any hub ---------- */
  function markDay(){
    var d = lsGet(DAYS_KEY) || {}; d[today()] = 1;
    var keys = Object.keys(d).sort(); while (keys.length > 120) delete d[keys.shift()];
    lsSet(DAYS_KEY, d);
  }
  function streak(){ var d = lsGet(DAYS_KEY) || {}, n = 0, off = d[today()] ? 0 : -1; while (d[H.day(off)]) { n++; off--; } return n; }

  /* ---------- class accuracy per question (anonymous totals, read once per page) ---------- */
  function loadStats(cb){
    if (stats || !H.supabase) { cb(); return; }
    var fired = false;
    function fin(){ if (!fired) { fired = true; cb(); } }
    setTimeout(fin, 2500);
    try {
      H.supabase.from("question_stats").select("qid,attempts,correct").eq("hub", HUB).then(function(res){
        var m = {}; ((res && res.data) || []).forEach(function(r){ m[r.qid] = r; });
        stats = m; fin();
      }, fin);
    } catch (e) { fin(); }
  }
  function acc(id){ var r = stats && stats[id]; return r && r.attempts >= 5 ? r.correct / r.attempts : null; }

  /* ---------- picking a set ---------- */
  function pick(n, skip){
    var P = pool(), srs = H.srs() || {}, t = today(), byId = {}, studied = {}, any = false;
    P.forEach(function(p){ byId[p.id] = p; if (p.last === true || p.last === false) { studied[p.lec] = 1; any = true; } });
    var due = Object.keys(srs).filter(function(id){ var r = srs[id]; return byId[id] && !skip[id] && r && r.due && r.due <= t; })
      .sort(function(a, b){ var x = srs[a], y = srs[b]; return x.due < y.due ? -1 : x.due > y.due ? 1 : (x.b || 0) - (y.b || 0); })
      .map(function(id){
        var b = srs[id].b || 0;
        return b ? { id: id, why: "due", note: "Spaced review: you got it right " + (b === 1 ? "last time" : "the last " + b + " times") }
                 : { id: id, why: "missed", note: "You missed this last time" };
      });
    var missed = shuffle(P.filter(function(p){ return p.last === false && !srs[p.id] && !skip[p.id]; }))
      .map(function(p){ return { id: p.id, why: "missed", note: "You missed this last time" }; });
    function hyItem(p){
      var a = acc(p.id);
      if (a !== null && a < .7) return { id: p.id, why: "hy", note: "High-yield: the class gets this right " + Math.round(a * 100) + "% of the time" };
      if (p.hy) return { id: p.id, why: "hy", note: "High-yield: " + p.hy };
      if (p.last === true) return { id: p.id, why: "fresh", note: "Keep it fresh: you got this right before" };
      return { id: p.id, why: "fresh", note: studied[p.lec] ? "Not tried yet, from a lecture you've studied" : "Not tried yet" };
    }
    function ranked(list){
      return list.map(function(p){ var a = acc(p.id); return { p: p, s: (a === null ? .22 : 1 - a) + (p.hy ? .2 : 0) + Math.random() * .15 }; })
        .sort(function(x, y){ return y.s - x.s; }).map(function(x){ return x.p; });
    }
    /* never in spaced review yet (those are either due above or scheduled for later) and not a known miss */
    var rest = P.filter(function(p){ return !skip[p.id] && !srs[p.id] && p.last !== false; });
    var near = ranked(rest.filter(function(p){ return !any || studied[p.lec]; }));
    var far = any ? ranked(rest.filter(function(p){ return !studied[p.lec]; })) : [];
    var perLec = {}, spread = near.filter(function(p){ perLec[p.lec] = (perLec[p.lec] || 0) + 1; return perLec[p.lec] <= 3; });
    var out = [], used = {};
    function take(list, max){ for (var i = 0; i < list.length && out.length < max; i++) if (!used[list[i].id]) { used[list[i].id] = 1; out.push(list[i]); } }
    take(due, Math.min(6, n));
    take(missed, Math.min(8, n));
    take(spread.map(hyItem), n);
    take(due, n); take(missed, n); take(near.map(hyItem), n); take(far.map(hyItem), n);
    return shuffle(out);
  }

  /* ---------- the dialog ---------- */
  function build(){
    dlg = document.createElement("div");
    dlg.id = "sh-drill"; dlg.className = "sh-drill"; dlg.hidden = true;
    dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true"); dlg.setAttribute("aria-labelledby", "shd-title");
    dlg.innerHTML = '<div class="shd-panel" tabindex="-1"></div>';
    document.body.appendChild(dlg);
    body = dlg.querySelector(".shd-panel");
    dlg.addEventListener("click", function(e){
      if (e.target === dlg) { close(); return; }
      var b = e.target.closest && e.target.closest("[data-shd]"); if (!b || !dlg.contains(b)) return;
      var act = b.getAttribute("data-shd");
      if (act === "close") close();
      else if (act === "start") { var s = loadSet(); if (s) showQ(s, Math.max(firstOpen(s), 0)); }
      else if (act === "skip") skip();
      else if (act === "next") next();
      else if (act === "more") more();
    });
  }
  function top(right){
    return '<div class="shd-top"><span class="shd-kicker">' + IC_BOLT + 'Daily drill</span>' + (right || '') +
      '<button type="button" class="shd-x" data-shd="close" aria-label="Close the daily drill">&times;</button></div>';
  }
  function streakLine(done){
    var n = streak(), counted = !!(lsGet(DAYS_KEY) || {})[today()];
    if (!n) return done ? '' : '<p class="shd-streak">' + IC_FLAME + 'Finish a set today to start a drill streak.</p>';
    if (done || counted) return '<p class="shd-streak">' + IC_FLAME + '<span><b>' + n + '-day</b> drill streak' + (n === 1 ? '. Come back tomorrow to keep it going.' : '. A set in any hub counts.') + '</span></p>';
    return '<p class="shd-streak">' + IC_FLAME + '<span><b>' + n + '-day</b> drill streak. Finish today\'s set to make it ' + (n + 1) + '.</span></p>';
  }
  function questionText(id){
    var ex = window.SH_EXPORT, qs = (ex && ex.questions) || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) { var t = String(qs[i].text || id); return t.length > 130 ? t.slice(0, 128) + "…" : t; }
    return id;
  }
  function focusPanel(){ try { body.focus({ preventScroll: true }); } catch (e) {} dlg.scrollTop = 0; }

  function showEmpty(){
    cur = -1;
    body.innerHTML = top() + '<h2 id="shd-title">Nothing to drill yet</h2>' +
      '<p class="shd-how">Answer some questions in this hub first. The ones you miss, and high-yield ones from the lectures you study, will show up here each day.</p>' +
      '<div class="shd-actions"><button type="button" class="shd-btn is-primary" data-shd="close">Close</button></div>';
  }
  function showIntro(s){
    cur = -1;
    var items = round(s), mix = {}, sc = scopeLabel();
    items.forEach(function(it){ mix[it.why] = (mix[it.why] || 0) + 1; });
    var rows = [["missed", "you missed last time"], ["due", "due for spaced review"], ["hy", "high-yield"], ["fresh", "to keep fresh"]]
      .filter(function(r){ return mix[r[0]]; })
      .map(function(r){ return '<li class="shd-mix-' + r[0] + '"><b>' + mix[r[0]] + '</b>' + r[1] + '</li>'; }).join("");
    body.innerHTML = top() +
      '<h2 id="shd-title">Today\'s drill</h2>' +
      '<p class="shd-lead">' + items.length + (items.length === 1 ? ' question' : ' questions') + ', about ' + Math.max(2, Math.round(items.length * .6)) + ' minutes' + (sc ? ' · ' + esc(sc) : '') + '</p>' +
      '<ul class="shd-mix">' + rows + '</ul>' +
      '<p class="shd-how">Miss one and it comes back tomorrow. Get it right and it comes back after 1, 2, 4, then 7 days, and never later than the day before the exam, so what you studied stays fresh. A new set is picked every day.</p>' +
      '<div class="shd-actions"><button type="button" class="shd-btn is-primary" data-shd="start">Start</button></div>' +
      streakLine(false);
  }
  function showQ(s, i){
    var it = s.items[i]; if (!it) { showDone(s); return; }
    cur = i;
    var items = round(s), total = items.length, pos = items.indexOf(it) + 1, answered = s.res[it.id] === 1 || s.res[it.id] === 0;
    var last = firstOpenAfter(s, i) < 0;
    body.innerHTML = top('<span class="shd-count">' + pos + ' of ' + total + '</span>') +
      '<div class="shd-bar" aria-hidden="true"><i style="width:' + Math.round(100 * countDone(s) / total) + '%"></i></div>' +
      '<h2 id="shd-title" class="shd-sr">Daily drill, question ' + pos + ' of ' + total + '</h2>' +
      '<div class="shd-why shd-why-' + it.why + '">' + esc(it.note) + '</div>' +
      '<div class="shd-card"></div>' +
      '<div class="shd-nav"><button type="button" class="shd-btn is-quiet" data-shd="skip"' + (answered ? ' hidden' : '') + '>Skip</button>' +
      '<button type="button" class="shd-btn is-primary" data-shd="next"' + (answered ? '' : ' hidden') + '>' + (last ? 'Finish' : 'Next') + '</button></div>';
    var ok = false;
    try { ok = hook().render(body.querySelector(".shd-card"), it.id) !== false; } catch (e) { ok = false; }
    if (!ok) { s.res[it.id] = "x"; finishCheck(s); saveSet(s); next(); return; }  /* no longer in the bank */
    focusPanel();
  }
  function countDone(s){ return round(s).filter(function(it){ return has(s, it.id); }).length; }
  function firstOpenAfter(s, i){
    for (var j = i + 1; j < s.items.length; j++) if (!has(s, s.items[j].id)) return j;
    for (j = s.start || 0; j < i; j++) if (!has(s, s.items[j].id)) return j;
    return -1;
  }
  function finishCheck(s){
    if (firstOpen(s) >= 0) return;
    if (!s.done) { s.done = true; markDay(); }
  }
  function next(){
    var s = loadSet(); if (!s) { close(); return; }
    var j = cur < 0 ? firstOpen(s) : firstOpenAfter(s, cur);
    if (j < 0) showDone(s); else showQ(s, j);
    refreshEntry();
  }
  function skip(){
    var s = loadSet(); if (!s || cur < 0) return;
    var id = s.items[cur].id; if (!has(s, id)) s.res[id] = "s";
    finishCheck(s); saveSet(s); next();
  }
  function showDone(s){
    cur = -1;
    var items = round(s), right = 0, wrong = 0, skipped = 0;
    items.forEach(function(it){ var r = s.res[it.id]; if (r === 1) right++; else if (r === 0) wrong++; else skipped++; });
    var extra = (s.start || 0) > 0;
    body.innerHTML = top() +
      '<div class="shd-done-mark">' + IC_CHECK + '</div>' +
      '<h2 id="shd-title">' + (extra ? 'Extra set done' : 'Drill done for today') + '</h2>' +
      '<p class="shd-lead">' + (right + wrong ? right + ' of ' + (right + wrong) + ' right' : 'All skipped') + (skipped && right + wrong ? ' · ' + skipped + ' skipped' : '') + '</p>' +
      '<p class="shd-how">' + (wrong ? (wrong === 1 ? 'The one you missed comes back tomorrow. ' : 'The ' + wrong + ' you missed come back tomorrow. ') : '') +
        (right ? 'The ones you got right come back in a day or two, a little later each time, and before the exam.' : '') + '</p>' +
      streakLine(true) +
      '<div class="shd-actions"><button type="button" class="shd-btn is-primary" data-shd="more">' + SIZE + ' more</button>' +
      '<button type="button" class="shd-btn" data-shd="close">Close</button></div>' +
      '<ol class="shd-results" aria-label="How you did">' + items.map(function(it){
        var r = s.res[it.id], cls = r === 1 ? "ok" : r === 0 ? "bad" : "skip";
        return '<li class="is-' + cls + '"><span class="shd-res-ic" role="img" aria-label="' + (r === 1 ? 'Right' : r === 0 ? 'Missed' : 'Skipped') + '">' + (r === 1 ? IC_CHECK : r === 0 ? IC_X : IC_SKIP) + '</span><span>' + esc(questionText(it.id)) + '</span></li>';
      }).join("") + '</ol>';
    if (s.cheer !== s.items.length && right + wrong) { s.cheer = s.items.length; saveSet(s); try { H.confetti(); } catch (e) {} }
    focusPanel();
  }
  function more(){
    var s = loadSet(); if (!s) return;
    var btn = body.querySelector('[data-shd="more"]'); if (btn) btn.disabled = true;
    loadStats(function(){
      var seen = {}; s.items.forEach(function(it){ seen[it.id] = 1; });
      var add = pick(SIZE, seen);
      if (!add.length) {
        if (btn) { btn.disabled = false; btn.hidden = true; }
        var how = body.querySelector(".shd-how"); if (how) how.textContent = "That's every question in scope for today. Come back tomorrow for a fresh set.";
        return;
      }
      s.start = s.items.length; s.items = s.items.concat(add); saveSet(s);
      showQ(s, s.start); refreshEntry();
    });
  }
  function route(s){
    if (!s) { showEmpty(); return; }
    var i = firstOpen(s);
    if (i < 0) showDone(s);
    else if (!(s.start || 0) && !countDone(s)) showIntro(s);
    else showQ(s, i);
  }

  function open(from){
    if (!hook() || isOpen) return;
    if (window.shCloseWidgetPanels) window.shCloseWidgetPanels();
    opener = from && from.focus ? from : document.activeElement;
    if (!dlg) build();
    dlg.hidden = false; isOpen = true;
    document.documentElement.classList.add("sh-drill-open");
    var s = loadSet();
    if (s) route(s);
    else {
      body.innerHTML = top() + '<p class="shd-lead" id="shd-title">Picking today\'s questions…</p>';
      loadStats(function(){
        if (!isOpen) return;
        var s2 = loadSet();
        if (!s2) { var items = pick(SIZE, {}); if (items.length) { s2 = { day: today(), items: items, res: {}, start: 0 }; saveSet(s2); } }
        route(s2);
        refreshEntry();
      });
    }
    focusPanel();
    refreshEntry();
  }
  function close(){
    if (!isOpen) return;
    isOpen = false; cur = -1; dlg.hidden = true; body.innerHTML = "";
    document.documentElement.classList.remove("sh-drill-open");
    refreshEntry();
    try { if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true }); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("sh:drill-close")); } catch (e) {}
  }

  function onAnswered(e){
    if (!isOpen || cur < 0) return;
    var s = loadSet(), d = (e && e.detail) || {}; if (!s) return;
    var it = s.items[cur];
    if (!it || String(d.qid) !== it.id || s.res[it.id] === 1 || s.res[it.id] === 0) return;
    s.res[it.id] = d.correct ? 1 : 0;
    finishCheck(s); saveSet(s);
    var sk = body.querySelector('[data-shd="skip"]'), nx = body.querySelector('[data-shd="next"]'), bar = body.querySelector(".shd-bar i");
    if (sk) sk.hidden = true;
    if (nx) nx.hidden = false;
    if (bar) bar.style.width = Math.round(100 * countDone(s) / round(s).length) + "%";
    refreshEntry();
  }

  /* ---------- entry points: the menu / phone-bar item and the desktop chip ---------- */
  function status(){
    var s = loadSet();
    if (s && s.done) return { state: "done" };
    if (s) return { state: "going", n: countDone(s), total: round(s).length };
    var srs = H.srs() || {}, t = today(), n = 0;
    pool().forEach(function(p){ var r = srs[p.id]; if (r && r.due && r.due <= t) n++; });
    return { state: "new", due: n };
  }
  function refreshEntry(){
    var pill = document.getElementById("shstat-drill-pill"), chip = document.getElementById("sh-drill-chip");
    if (!hook()) { if (pill) pill.hidden = true; if (chip) chip.hidden = true; return; }
    var st = status();
    if (pill) {
      pill.hidden = false;
      var badge = pill.querySelector(".shd-badge");
      if (badge) {
        badge.hidden = !(st.state === "going" || (st.state === "new" && st.due) || st.state === "done");
        badge.className = "shd-badge" + (st.state === "done" ? " is-done" : "");
        badge.innerHTML = st.state === "done" ? IC_CHECK : st.state === "going" ? st.n + "/" + st.total : String(st.due || "");
      }
      pill.setAttribute("aria-label", "Daily drill: " + (st.state === "done" ? "done for today" : st.state === "going" ? st.n + " of " + st.total + " done" : st.due ? st.due + " due for review" : "today's questions"));
    }
    if (chip) {
      chip.hidden = st.state === "done" || isOpen;
      var lab = chip.querySelector(".shd-chip-sub");
      if (lab) lab.textContent = st.state === "going" ? st.n + " of " + st.total : st.due ? st.due + " due" : SIZE + " questions";
    }
  }

  window.shDrill = {
    mount: function(hooks){
      if (H || !hooks) return;
      H = hooks; HUB = hooks.hub; KEY = "sh_drill_" + HUB;
      document.addEventListener(hooks.answeredEvent, onAnswered);
      document.addEventListener("click", function(e){
        var b = e.target.closest && e.target.closest("[data-sh-drill]");
        if (b) { e.preventDefault(); open(b); }
      });
      /* Esc closes the drill, unless a widget sheet (e.g. Report) is open on top of it: that closes first */
      document.addEventListener("keydown", function(e){
        if (!isOpen) return;
        if (e.key === "Escape") { if (!document.body.classList.contains("sh-sheet-open")) close(); return; }
        if (e.key === "Enter" && cur >= 0) {
          var t = e.target, tag = t && t.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (tag === "BUTTON" && !t.disabled && t !== body)) return;
          var nx = body.querySelector('[data-shd="next"]'); if (nx && !nx.hidden) { e.preventDefault(); next(); }
        }
      }, true);
      document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "visible") refreshEntry(); });
      refreshEntry();
      if (/^#drill$/.test(location.hash) && hook()) {
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
        setTimeout(function(){ open(); }, 350);
      }
    },
    open: open,
    close: close,
    isOpen: function(){ return isOpen; },
    status: function(){ return H && hook() ? status() : null; }
  };
})();
