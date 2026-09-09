/* ============ SHARED STUDY-HUB WIDGET ============
   One file, loaded by every hub via:
     <script src="../../widget/v3.js" data-hub="..." data-answered-event="..." data-default-mode="..."></script>
   Editing this file updates every hub at once. Previously this whole thing was
   copy-pasted into each hub's HTML and re-spliced by hand on every change —
   that's what externalizing it here fixes.

   Each hub optionally publishes window.SH_EXPORT = { lectures:[{id,title}],
   questions:[{id,lec,text,hint}] } near the end of its own script, once its
   data is built. This widget reads it (if present) to show real question text
   in "Toughest questions" instead of raw ids, and to power the Search panel.
   Everything here still degrades gracefully if a hub hasn't published it. */
(function(){
  var thisScript = document.currentScript;
  var ds = (thisScript && thisScript.dataset) || {};
  var HUB = ds.hub || "";
  var ANSWERED_EVENT = ds.answeredEvent || (HUB + ":answered");
  var DEFAULT_MODE = ds.defaultMode || "compendium";
  var SB_URL = "https://thytmzsgymydbzcqdnix.supabase.co";
  var SB_KEY = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS";

  var supabase = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SB_URL, SB_KEY);
    }
  } catch (e) { /* stats layer is best-effort, never block the hub */ }

  /* ---------- back-to-index pill (was static markup per hub; now built here) ---------- */
  (function(){
    var a = document.createElement("a");
    a.id = "shhome-pill";
    a.href = "../../index.html";
    a.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3"/><path d="M7 4 3 8l4 4"/></svg><span>All hubs</span>';
    document.body.appendChild(a);
  })();

  /* ---------- text-to-speech (lecture reading panels) — independent of Supabase,
     so it still works even if the stats layer fails to init. Each hub's own
     render function inserts a .sh-tts-btn and wires it to window.shTTS.speak,
     looked up lazily at click time so load order never matters. ---------- */
  window.shTTS = (function(){
    var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
    var activeBtn = null;
    function setState(btn, state){
      if (!btn) return;
      btn.setAttribute("data-state", state);
      btn.setAttribute("aria-label", state === "playing" ? "Pause reading" : (state === "paused" ? "Resume reading" : "Listen to this"));
    }
    function stop(){
      if (synth) { try { synth.cancel(); } catch (e) {} }
      if (activeBtn) setState(activeBtn, "idle");
      activeBtn = null;
    }
    function speak(text, btn){
      if (!synth) return;
      if (activeBtn === btn) {
        if (synth.speaking && !synth.paused) { synth.pause(); setState(btn, "paused"); return; }
        if (synth.paused) { synth.resume(); setState(btn, "playing"); return; }
      }
      stop();
      text = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1;
      u.onend = function(){ if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; } };
      u.onerror = u.onend;
      activeBtn = btn;
      setState(btn, "playing");
      synth.speak(u);
    }
    return { supported: !!synth, speak: speak, stop: stop };
  })();

  /* ---------- per-question class-wide correctness — raw fetch, exposed the
     same way as shTTS so a hub's own qcard code can look it up lazily at
     click time, independent of load order and of the stats layer below. ---------- */
  window.shQuestionStats = function(qid, cb){
    fetch(SB_URL + "/rest/v1/question_stats?hub=eq." + encodeURIComponent(HUB) + "&qid=eq." + encodeURIComponent(qid) + "&select=attempts,correct", {
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }
    })
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(rows){
      var row = rows && rows[0];
      cb(row ? { attempts: row.attempts, correct: row.correct } : null);
    })
    .catch(function(){ cb(null); });
  };

  /* ---------- update-available banner — raw fetch (not the supabase client),
     so it still works even if createClient/realtime failed above. Every deploy
     logs a changelog row, so a fresh row appearing after this page loaded IS
     "an update was pushed" — piggybacks on that instead of a separate version file. ---------- */
  (function(){
    var POLL_MS = 4 * 60 * 1000;
    var baseline = null, toastEl = null;
    function ensureToast(){
      if (toastEl) return toastEl;
      toastEl = document.createElement("div");
      toastEl.className = "sh-update-toast";
      toastEl.innerHTML = '<span>This hub has been updated.</span><button type="button" class="sh-update-reload">Reload</button><button type="button" class="sh-update-dismiss" aria-label="Dismiss">&times;</button>';
      document.body.appendChild(toastEl);
      toastEl.querySelector(".sh-update-reload").addEventListener("click", function(){ location.reload(); });
      toastEl.querySelector(".sh-update-dismiss").addEventListener("click", function(){ toastEl.classList.remove("is-shown"); });
      return toastEl;
    }
    function check(){
      fetch(SB_URL + "/rest/v1/changelog?select=created_at&order=created_at.desc&limit=1", {
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }
      })
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){
        if (!rows || !rows.length) return;
        var latest = rows[0].created_at;
        if (baseline === null) { baseline = latest; return; }
        if (new Date(latest) > new Date(baseline)) { ensureToast().classList.add("is-shown"); }
      })
      .catch(function(){ /* best-effort — never break the hub */ });
    }
    check();
    setInterval(check, POLL_MS);
  })();

  if (!supabase) return;

  /* ---------- anonymous per-device visitor id (shared across all hubs, same origin) ---------- */
  function getVisitorId(){
    try {
      var k = "sh_visitor_id";
      var v = localStorage.getItem(k);
      if (!v) {
        v = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
        localStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return "anon-" + Math.random().toString(16).slice(2); }
  }
  var VISITOR_ID = getVisitorId();

  /* ---------- online-now presence ---------- */
  var presenceId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());
  var onlineCount = 1;
  var channel = supabase.channel("presence:" + HUB, { config: { presence: { key: presenceId } } });
  channel.on("presence", { event: "sync" }, function(){
    try {
      var state = channel.presenceState();
      onlineCount = Object.keys(state).length || 1;
    } catch (e) { onlineCount = 1; }
    renderOnline();
  });
  channel.subscribe(function(status){
    if (status === "SUBSCRIBED") {
      channel.track({ online_at: new Date().toISOString() });
      safeRpc("record_presence_ping", { p_hub: HUB });
    }
  });

  /* ---------- answer + mode tracking (fire-and-forget, never throws into the hub) ---------- */
  function safeRpc(fn, args){
    try { supabase.rpc(fn, args).then(function(){}, function(){}); } catch (e) {}
  }
  var sessionCorrectStreak = 0;
  document.addEventListener(ANSWERED_EVENT, function(e){
    var d = (e && e.detail) || {};
    var isCorrect = !!d.correct;
    safeRpc("record_answer", { p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
    safeRpc("record_personal_answer", { p_visitor: VISITOR_ID, p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
    if (isCorrect) {
      sessionCorrectStreak++;
      if (sessionCorrectStreak > 0 && sessionCorrectStreak % 5 === 0) {
        fireConfetti();
        showStreakToast(sessionCorrectStreak + " in a row! 🔥");
      }
    } else {
      sessionCorrectStreak = 0;
    }
  });
  var modeSwitchEl = document.getElementById("modeSwitch");
  var modeAttr = "mode";
  if (!modeSwitchEl) {
    var tabbarEl = document.querySelector("nav.tabbar, .tabbar");
    if (tabbarEl) { modeSwitchEl = tabbarEl; modeAttr = "tab"; }
  }
  if (modeSwitchEl) {
    modeSwitchEl.addEventListener("click", function(e){
      var t = e.target.closest("[data-" + modeAttr + "]");
      if (t && t.dataset && t.dataset[modeAttr]) safeRpc("record_mode_open", { p_hub: HUB, p_mode: t.dataset[modeAttr] });
    });
  }
  safeRpc("record_mode_open", { p_hub: HUB, p_mode: DEFAULT_MODE });

  /* ---------- confetti + streak toast ---------- */
  function showStreakToast(text){
    var t = document.createElement("div");
    t.className = "shstat-streaktoast";
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("is-shown"); });
    setTimeout(function(){
      t.classList.remove("is-shown");
      setTimeout(function(){ t.remove(); }, 300);
    }, 1600);
  }
  function fireConfetti(){
    var colors = ["#3ecf7e", "#f0806b", "#e8c15a", "#8fb4e8", "#c58fe8"];
    for (var i = 0; i < 26; i++){
      (function(i){
        var p = document.createElement("span");
        p.className = "shstat-confetti";
        var size = 6 + Math.random() * 5;
        p.style.width = size + "px";
        p.style.height = (size * 0.4) + "px";
        p.style.background = colors[i % colors.length];
        p.style.borderRadius = "1px";
        p.style.left = (Math.random() * window.innerWidth) + "px";
        p.style.top = "-16px";
        document.body.appendChild(p);
        var dx = (Math.random() - 0.5) * 160;
        var dy = window.innerHeight * (0.55 + Math.random() * 0.5);
        var rot = 180 + Math.random() * 540;
        if (p.animate){
          var anim = p.animate([
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg)", opacity: 0 }
          ], { duration: 1400 + Math.random() * 700, easing: "cubic-bezier(.15,.6,.4,1)" });
          anim.onfinish = function(){ p.remove(); };
        } else {
          setTimeout(function(){ p.remove(); }, 2000);
        }
      })(i);
    }
  }

  /* ---------- floating widget ---------- */
  var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
  var ICON_STATS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20V10"/><path d="M12 20V4"/><path d="M18 20v-7"/></svg>';
  var ICON_BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a6 6 0 0 0-4 10.6c.6.5.9 1.2 1 2h6c.1-.8.4-1.5 1-2A6 6 0 0 0 12 2Z"/></svg>';
  var ICON_FLAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V15"/></svg>';

  var backdrop = document.createElement("div");
  backdrop.id = "shstat-backdrop";
  document.body.appendChild(backdrop);

  var root = document.createElement("div");
  root.id = "shstat-root";
  root.innerHTML =
    '<div id="shstat-searchpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Search this hub</h5>' +
    '<input type="text" id="shstat-search-input" placeholder="Search lectures &amp; questions…">' +
    '<div id="shstat-search-results"><div class="shstat-empty">Type to search.</div></div>' +
    '</div>' +
    '<div id="shstat-suggestpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Suggest something</h5>' +
    '<textarea id="shstat-suggest-text" maxlength="500" placeholder="e.g. add a flashcard mode, more questions on lecture 3..."></textarea>' +
    '<div><button class="shstat-send" id="shstat-suggest-submit" type="button">Send</button></div>' +
    '<div class="shstat-flagmsg" id="shstat-suggest-msg"></div>' +
    '</div>' +
    '<div id="shstat-flagpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Report a typo or issue</h5>' +
    '<textarea id="shstat-flag-text" maxlength="500" placeholder="e.g. Q14 answer key looks off, typo in Lecture 3..."></textarea>' +
    '<div><button class="shstat-send" id="shstat-flag-submit" type="button">Send</button></div>' +
    '<div class="shstat-flagmsg" id="shstat-flag-msg"></div>' +
    '</div>' +
    '<div id="shstat-panel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<div class="shstat-sec"><h5>Your stats (this device)</h5><div id="shstat-mine"><div class="shstat-empty">Loading…</div></div>' +
    '<div class="shstat-name-row"><input type="text" id="shstat-name-input" maxlength="24" placeholder="Leaderboard name (optional)"><button id="shstat-name-save" type="button">Save</button></div>' +
    '<div class="shstat-namemsg" id="shstat-name-msg"></div></div>' +
    '<div class="shstat-sec"><h5>Toughest questions (class-wide)</h5><div id="shstat-tough"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Most opened</h5><div id="shstat-modes"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Busiest times</h5><div id="shstat-hist-wrap"><div class="shstat-empty">Loading…</div></div></div>' +
    '</div>' +
    '<div class="shstat-pillrow">' +
    '<button class="shstat-pill" id="shstat-online-pill" type="button"><span class="shstat-pill-icon shstat-pill-icon-dot"><span class="shstat-dot"></span></span><span class="shstat-pill-label"><span id="shstat-online-n">1</span> <span class="spl-full">studying now</span><span class="spl-short">live</span></span></button>' +
    '<button class="shstat-pill" id="shstat-search-pill" type="button"><span class="shstat-pill-icon">' + ICON_SEARCH + '</span><span class="shstat-pill-label">Search</span></button>' +
    '<button class="shstat-pill" id="shstat-stats-pill" type="button"><span class="shstat-pill-icon">' + ICON_STATS + '</span><span class="shstat-pill-label"><span class="spl-full">Class stats</span><span class="spl-short">Stats</span></span></button>' +
    '<button class="shstat-pill" id="shstat-suggest-pill" type="button"><span class="shstat-pill-icon">' + ICON_BULB + '</span><span class="shstat-pill-label"><span class="spl-full">Suggest something</span><span class="spl-short">Suggest</span></span></button>' +
    '<button class="shstat-pill" id="shstat-flag-pill" type="button"><span class="shstat-pill-icon">' + ICON_FLAG + '</span><span class="shstat-pill-label"><span class="spl-full">Flag issue</span><span class="spl-short">Flag</span></span></button>' +
    '</div>';
  document.body.appendChild(root);

  function renderOnline(){
    var n = document.getElementById("shstat-online-n");
    if (n) n.textContent = onlineCount;
  }

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }

  /* ---------- SH_EXPORT: each hub's own {lectures, questions} data, if published ---------- */
  function getExport(){
    var ex = window.SH_EXPORT;
    if (!ex || typeof ex !== "object") return { lectures: [], questions: [] };
    return { lectures: ex.lectures || [], questions: ex.questions || [] };
  }
  function lectureTitle(lecId){
    if (!lecId) return null;
    var ls = getExport().lectures;
    for (var i = 0; i < ls.length; i++) if (ls[i].id === lecId) return ls[i].title;
    // no SH_EXPORT lecture list published — fall back to humanizing the raw id
    return String(lecId).replace(/[-_]+/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function findQuestionMeta(qid){
    var qs = getExport().questions;
    for (var i = 0; i < qs.length; i++) if (qs[i].id === qid) return { text: qs[i].text, lec: qs[i].lec };
    // fall back to a hub's raw global QUESTIONS array, for any hub that hasn't
    // published SH_EXPORT yet — same lookup the original widget used.
    try {
      var bank = (typeof QUESTIONS !== "undefined") ? QUESTIONS : [];
      var q = bank.filter(function(x){ return x.id === qid; })[0];
      return q ? { text: (q.q || q.stem || null), lec: q.lec || null } : { text: null, lec: null };
    } catch (e) { return { text: null, lec: null }; }
  }

  function loadStats(){
    var toughEl = document.getElementById("shstat-tough");
    var modesEl = document.getElementById("shstat-modes");
    supabase.from("question_stats").select("qid,attempts,correct").eq("hub", HUB).then(function(res){
      var rows = (res && res.data) || [];
      rows = rows.filter(function(r){ return r.attempts >= 3; });
      rows.sort(function(a,b){ return (a.correct/a.attempts) - (b.correct/b.attempts); });
      rows = rows.slice(0, 10);
      if (!rows.length) { toughEl.innerHTML = '<div class="shstat-empty">Not enough answers yet — check back once the class has done some questions.</div>'; return; }
      var html = rows.map(function(r){
        var meta = findQuestionMeta(r.qid);
        var label = meta.text || r.qid;
        if (label.length > 76) label = label.slice(0, 74) + "…";
        var lecTitle = lectureTitle(meta.lec);
        var tag = lecTitle ? '<span class="shstat-tough-tag">' + esc(lecTitle) + '</span>' : '';
        var pct = Math.round((r.correct / r.attempts) * 100);
        var cls = pct < 50 ? "shstat-bad" : (pct >= 80 ? "shstat-ok" : "");
        return '<div class="shstat-row shstat-row-tough"><span class="shstat-label-wrap"><span class="shstat-label" title="' + esc(label) + '">' + esc(label) + '</span>' + tag + '</span><span class="shstat-val ' + cls + '">' + pct + '%<span class="shstat-attempts">(' + r.attempts + ')</span></span></div>';
      }).join("");
      toughEl.innerHTML = html;
    }, function(){ toughEl.innerHTML = '<div class="shstat-empty">Couldn&#39;t load stats right now.</div>'; });

    supabase.from("mode_stats").select("mode,opens").eq("hub", HUB).then(function(res){
      var rows = (res && res.data) || [];
      rows.sort(function(a,b){ return b.opens - a.opens; });
      if (!rows.length) { modesEl.innerHTML = '<div class="shstat-empty">No data yet.</div>'; return; }
      modesEl.innerHTML = rows.map(function(r){
        return '<div class="shstat-row"><span class="shstat-label">' + esc(r.mode) + '</span><span class="shstat-val">' + r.opens + '</span></div>';
      }).join("");
    }, function(){ modesEl.innerHTML = '<div class="shstat-empty">Couldn&#39;t load stats right now.</div>'; });
  }

  function loadPersonalStats(){
    var el = document.getElementById("shstat-mine");
    if (!el) return;
    supabase.rpc("get_personal_stats", { p_visitor: VISITOR_ID, p_hub: HUB }).then(function(res){
      var rows = (res && res.data) || [];
      if (!rows.length) { el.innerHTML = '<div class="shstat-empty">Answer a few questions and your stats show up here.</div>'; return; }
      var totalAttempts = 0, totalCorrect = 0;
      var dateSet = {};
      rows.forEach(function(r){
        totalAttempts += r.attempts;
        totalCorrect += r.correct;
        dateSet[r.answer_date] = true;
      });
      function fmt(d){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
      var cursor = new Date();
      cursor.setHours(0,0,0,0);
      if (!dateSet[fmt(cursor)]) cursor.setDate(cursor.getDate() - 1);
      var streak = 0;
      while (dateSet[fmt(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
      var pct = totalAttempts ? Math.round((totalCorrect/totalAttempts)*100) : 0;
      el.innerHTML =
        '<div class="shstat-row"><span class="shstat-label">Accuracy (' + totalAttempts + ' answered)</span><span class="shstat-val ' + (pct < 50 ? "shstat-bad" : (pct >= 80 ? "shstat-ok" : "")) + '">' + pct + '%</span></div>' +
        '<div class="shstat-row"><span class="shstat-label">Study streak</span><span class="shstat-val">' + streak + (streak === 1 ? ' day' : ' days') + '</span></div>';
    }, function(){ el.innerHTML = '<div class="shstat-empty">Couldn&#39;t load your stats right now.</div>'; });
  }

  function loadBusiestTimes(){
    var wrap = document.getElementById("shstat-hist-wrap");
    if (!wrap) return;
    supabase.from("presence_hourly").select("hour_of_day,ping_count").eq("hub", HUB).then(function(res){
      var rows = (res && res.data) || [];
      if (!rows.length) { wrap.innerHTML = '<div class="shstat-empty">Not enough activity yet.</div>'; return; }
      var byHour = {};
      rows.forEach(function(r){ byHour[r.hour_of_day] = r.ping_count; });
      var max = 0;
      for (var h = 0; h < 24; h++) max = Math.max(max, byHour[h] || 0);
      var bars = "";
      for (var h2 = 0; h2 < 24; h2++) {
        var v = byHour[h2] || 0;
        var pctH = max ? Math.max(3, Math.round((v/max)*100)) : 3;
        var label = (h2 === 0 ? "12a" : h2 < 12 ? h2+"a" : h2 === 12 ? "12p" : (h2-12)+"p");
        bars += '<div class="shstat-hbar" style="height:' + pctH + '%" title="' + label + ': ' + v + '"></div>';
      }
      wrap.innerHTML = '<div class="shstat-hist">' + bars + '</div><div class="shstat-hlabels"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>';
    }, function(){ wrap.innerHTML = '<div class="shstat-empty">Couldn&#39;t load this right now.</div>'; });
  }

  /* ---------- search (fully client-side, over window.SH_EXPORT — no network) ---------- */
  var searchInput = document.getElementById("shstat-search-input");
  var searchResults = document.getElementById("shstat-search-results");
  function runSearch(query){
    query = (query || "").trim().toLowerCase();
    if (!query) { searchResults.innerHTML = '<div class="shstat-empty">Type to search.</div>'; return; }
    var data = getExport();
    if (!data.lectures.length && !data.questions.length) {
      searchResults.innerHTML = '<div class="shstat-empty">Search isn&#39;t available for this hub yet.</div>';
      return;
    }
    var lecMatches = data.lectures.filter(function(l){ return (l.title || "").toLowerCase().indexOf(query) !== -1; }).slice(0, 8);
    var qMatches = data.questions.filter(function(q){ return (q.text || "").toLowerCase().indexOf(query) !== -1; }).slice(0, 12);
    if (!lecMatches.length && !qMatches.length) {
      searchResults.innerHTML = '<div class="shstat-empty">No matches for &#8220;' + esc(query) + '&#8221;.</div>';
      return;
    }
    var html = "";
    if (lecMatches.length) {
      html += '<div class="shstat-search-sec"><h5>Lectures</h5>' + lecMatches.map(function(l){
        return '<div class="shstat-search-lec">' + esc(l.title) + '</div>';
      }).join("") + '</div>';
    }
    if (qMatches.length) {
      html += '<div class="shstat-search-sec"><h5>Questions</h5>' + qMatches.map(function(q){
        var lecTitle = "";
        for (var i = 0; i < data.lectures.length; i++) if (data.lectures[i].id === q.lec) { lecTitle = data.lectures[i].title; break; }
        return '<div class="shstat-search-q" data-qid="' + esc(q.id) + '"><div class="sq-text">' + esc(q.text) + '</div>'
          + (lecTitle ? '<div class="sq-lec">' + esc(lecTitle) + ' — tap to reveal</div>' : '<div class="sq-lec">Tap to reveal</div>')
          + (q.hint ? '<div class="sq-hint">' + esc(q.hint) + '</div>' : '') + '</div>';
      }).join("") + '</div>';
    }
    searchResults.innerHTML = html;
  }
  if (searchInput) searchInput.addEventListener("input", function(){ runSearch(searchInput.value); });
  searchResults.addEventListener("click", function(e){
    var row = e.target.closest(".shstat-search-q");
    if (row) row.classList.toggle("is-open");
  });

  /* ---------- leaderboard display name (opt-in) ---------- */
  try {
    var savedName = localStorage.getItem("sh_display_name");
    var nameInputEl = document.getElementById("shstat-name-input");
    if (savedName && nameInputEl) nameInputEl.value = savedName;
  } catch (e) {}
  var nameSaveBtn = document.getElementById("shstat-name-save");
  if (nameSaveBtn) {
    nameSaveBtn.addEventListener("click", function(){
      var nameInput = document.getElementById("shstat-name-input");
      var nameMsg = document.getElementById("shstat-name-msg");
      var name = (nameInput.value || "").trim();
      if (!name) { nameMsg.textContent = "Type a name first."; return; }
      nameSaveBtn.disabled = true;
      nameMsg.textContent = "Saving…";
      safeRpc("set_display_name", { p_visitor: VISITOR_ID, p_name: name });
      try { localStorage.setItem("sh_display_name", name); } catch (e) {}
      setTimeout(function(){
        nameSaveBtn.disabled = false;
        nameMsg.textContent = "Saved — you'll show up on the leaderboard as \"" + name + "\".";
      }, 400);
    });
  }

  var panel = document.getElementById("shstat-panel");
  var flagPanel = document.getElementById("shstat-flagpanel");
  var suggestPanel = document.getElementById("shstat-suggestpanel");
  var searchPanel = document.getElementById("shstat-searchpanel");
  function closeOtherPanels(keep){
    if (keep !== panel) panel.classList.remove("is-open");
    if (keep !== flagPanel) flagPanel.classList.remove("is-open");
    if (keep !== suggestPanel) suggestPanel.classList.remove("is-open");
    if (keep !== searchPanel) searchPanel.classList.remove("is-open");
  }
  function updateSheetState(){
    var open = panel.classList.contains("is-open") || flagPanel.classList.contains("is-open") ||
      suggestPanel.classList.contains("is-open") || searchPanel.classList.contains("is-open");
    document.body.classList.toggle("sh-sheet-open", open);
  }
  backdrop.addEventListener("click", function(){
    closeOtherPanels(null);
    updateSheetState();
  });
  document.getElementById("shstat-stats-pill").addEventListener("click", function(){
    closeOtherPanels(panel);
    var open = panel.classList.toggle("is-open");
    if (open) { loadStats(); loadPersonalStats(); loadBusiestTimes(); }
    updateSheetState();
  });
  document.querySelector("#shstat-panel .shstat-close").addEventListener("click", function(){
    panel.classList.remove("is-open");
    updateSheetState();
  });

  document.getElementById("shstat-search-pill").addEventListener("click", function(){
    closeOtherPanels(searchPanel);
    var open = searchPanel.classList.toggle("is-open");
    if (open && searchInput) searchInput.focus();
    updateSheetState();
  });
  document.querySelector("#shstat-searchpanel .shstat-close").addEventListener("click", function(){
    searchPanel.classList.remove("is-open");
    updateSheetState();
  });

  document.getElementById("shstat-flag-pill").addEventListener("click", function(){
    closeOtherPanels(flagPanel);
    flagPanel.classList.toggle("is-open");
    updateSheetState();
  });
  document.querySelector("#shstat-flagpanel .shstat-close").addEventListener("click", function(){
    flagPanel.classList.remove("is-open");
    updateSheetState();
  });
  document.getElementById("shstat-flag-submit").addEventListener("click", function(){
    var ta = document.getElementById("shstat-flag-text");
    var msg = document.getElementById("shstat-flag-msg");
    var btn = document.getElementById("shstat-flag-submit");
    var text = (ta.value || "").trim();
    if (!text) { msg.textContent = "Type something first."; return; }
    btn.disabled = true;
    msg.textContent = "Sending…";
    supabase.from("question_flags").insert({ hub: HUB, note: text }).then(function(res){
      btn.disabled = false;
      if (res && res.error) { msg.textContent = "Couldn't send — try again later."; return; }
      ta.value = "";
      msg.textContent = "Thanks — sent!";
    }, function(){ btn.disabled = false; msg.textContent = "Couldn't send — try again later."; });
  });

  document.getElementById("shstat-suggest-pill").addEventListener("click", function(){
    closeOtherPanels(suggestPanel);
    suggestPanel.classList.toggle("is-open");
    updateSheetState();
  });
  document.querySelector("#shstat-suggestpanel .shstat-close").addEventListener("click", function(){
    suggestPanel.classList.remove("is-open");
    updateSheetState();
  });
  document.getElementById("shstat-suggest-submit").addEventListener("click", function(){
    var ta = document.getElementById("shstat-suggest-text");
    var msg = document.getElementById("shstat-suggest-msg");
    var btn = document.getElementById("shstat-suggest-submit");
    var text = (ta.value || "").trim();
    if (!text) { msg.textContent = "Type something first."; return; }
    btn.disabled = true;
    msg.textContent = "Sending…";
    supabase.from("hub_suggestions").insert({ hub: HUB, note: text }).then(function(res){
      btn.disabled = false;
      if (res && res.error) { msg.textContent = "Couldn't send — try again later."; return; }
      ta.value = "";
      msg.textContent = "Thanks — sent!";
    }, function(){ btn.disabled = false; msg.textContent = "Couldn't send — try again later."; });
  });
})();
