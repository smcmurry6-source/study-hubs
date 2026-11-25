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
  /* data-audio="off": an archived hub whose narration and Timmy Time came off the site to keep it under GitHub Pages'
     1 GB limit (vault/rules/archived-hubs-drop-their-audio.md). Listen reads with the device's own voice, Timmy Time
     isn't mounted, and v3.css hides the hub's Timmy Time links (html.sh-audio-off). */
  var AUDIO_OFF = ds.audio === "off";
  if (AUDIO_OFF) try { document.documentElement.classList.add("sh-audio-off"); } catch (e) {}
  /* The game layer's server (migration_v54, applied at the redesign's release; vault/reference/game-server.md): one call
     per answer that the server grades and pays, the journeys' rank profile, mock sessions. Every page that loads this file
     is a hub on the engine (widget/hub.js still writes data-game="v2" on the tag), so it is always asked for: the
     fallbacks to the calls from before it came out on 2026-11-21, with the last old single-file hub pages gone
     (2026-11-19). on: null until the bootstrap shows the journeys' rank, then true. */
  var GAME = { on: null, boost: null };
  function rpcMissing(r){ var e = r && r.error; return !!e && (e.code === "PGRST202" || e.code === "42883" || r.status === 404 || /could not find the function|does not exist/i.test(e.message || "")); }
  var SB_URL = "https://thytmzsgymydbzcqdnix.supabase.co";
  var SB_KEY = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS";

  var supabase = null;
  /* ?sh_export=1: the admin page loads a hub in a hidden frame only to read SH_EXPORT.
     No presence, pings or answers from that copy. */
  var EXPORT_ONLY = /[?&]sh_export=1\b/.test(location.search);
  try {
    if (!EXPORT_ONLY && window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SB_URL, SB_KEY);
    }
  } catch (e) { /* stats layer is best-effort, never block the hub */ }
  /* offline copy of the hubs (sw.js at the site root, next to the widget folder); best-effort */
  if (!EXPORT_ONLY && "serviceWorker" in navigator && window.isSecureContext) {
    try { navigator.serviceWorker.register(new URL("../sw.js", thisScript.src).href, { scope: new URL("../", thisScript.src).href }); } catch (e) {}
  }
  /* shared with the hubs' own arcades so a page never builds a second client */
  window.shSupabase = supabase;

  /* ---------- back to the dashboard: the hub's bar has the slot (#sh-ribbon-back, widget/hub.js); this draws its arrow.
     The old pages' fixed top bar (#sh-topbar) and the clearance it reserved came out on 2026-11-25. ---------- */
  var BACK_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3"/><path d="M7 4 3 8l4 4"/></svg>';
  var ribbonBack = document.getElementById("sh-ribbon-back");
  if (ribbonBack) {
    ribbonBack.innerHTML = BACK_ICON;
    if (!ribbonBack.getAttribute("href")) ribbonBack.setAttribute("href", "../../index.html");
  }

  /* ---------- text-to-speech (lecture reading panels) — independent of Supabase,
     so it still works even if the stats layer fails to init. Each hub's own
     render function inserts a .sh-tts-btn and wires it to window.shTTS.speak,
     looked up lazily at click time so load order never matters.

     speak(container, btn) takes the actual reading-panel DOM element (not
     plain text): it wraps each word in a <span class="sh-tts-word">, drives
     the utterance off that same word list so it can highlight the word
     being spoken (via the utterance's boundary events) and — since the Web
     Speech API can't seek within an utterance — lets a click on any word
     cancel and re-speak from that word onward, which is what gives the
     "click a word to resume from there" behavior.

     Voice choice: the browser's own default voice (often a dated local
     "SAPI" voice on Windows) is what sounded robotic. There's no good way to
     add a real neural TTS API here without a server to hold its key — any
     key embedded in a public static site is a key anyone can lift and abuse.
     Instead this picks the best already-installed voice at no extra cost:
     Chrome/Edge ship free cloud-backed "Natural"/"Online" voices alongside
     the classic ones, just never selected by default. ---------- */
  /* feature events go through widget/clicks.js (window.shTrack); it may load after us, so look it up each time */
  function shTrackSafe(k, n){ try { if (window.shTrack) window.shTrack(k, n); } catch (e) {} }
  window.shTTS = (function(){
    var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
    var activeBtn = null, activeWords = null, wordCursor = -1;
    var activeAudioEl = null;
    var bestVoice = null;
    var VOICE_PREF_KEY = "sh_tts_voice_name";
    var pickers = [];
    /* one speed for both readers: the recording player's select and the device voice's (BUG-199), saved as sh_tts_rate */
    var RATE_KEY = "sh_tts_rate", RATES = [1, 1.25, 1.5, 1.75, 2];
    var RATE_OPTS = RATES.map(function(r){ return '<option value="' + r + '">' + r + "×</option>"; }).join("");
    function rateNow(){ var r = parseFloat(prefGetSafe(RATE_KEY)); return RATES.indexOf(r) >= 0 ? r : 1; }

    function scoreVoice(v){
      var n = v.name || "";
      var s = 0;
      if (/natural|online/i.test(n)) s += 100;
      if (/neural|enhanced|premium/i.test(n)) s += 80;
      if (/google/i.test(n)) s += 40;
      if (/^en-US/i.test(v.lang)) s += 20; else if (/^en/i.test(v.lang)) s += 10;
      if (v.localService === false) s += 5;
      return s;
    }
    function pickBestVoice(){
      if (!synth) return null;
      var voices = synth.getVoices() || [];
      if (!voices.length) return null;
      var saved = getSavedVoiceName();
      if (saved) {
        var m = voices.filter(function(v){ return v.name === saved; })[0];
        if (m) return m;
      }
      return voices.slice().sort(function(a, b){ return scoreVoice(b) - scoreVoice(a); })[0] || null;
    }
    function getSavedVoiceName(){
      try { return localStorage.getItem(VOICE_PREF_KEY) || ""; } catch (e) { return ""; }
    }
    function saveVoiceName(name){
      try { localStorage.setItem(VOICE_PREF_KEY, name); } catch (e) {}
    }
    // Fallback voice used when the preferred/picked voice errors out (this
    // happens with some cloud-backed "Online"/"Natural" voices when the
    // network call behind them fails) so playback never goes silently dead.
    function pickFallbackVoice(){
      if (!synth) return null;
      var voices = synth.getVoices() || [];
      if (!voices.length) return null;
      var def = voices.filter(function(v){ return v.default; })[0];
      if (def) return def;
      var local = voices.filter(function(v){ return v.localService; })[0];
      return local || voices[0];
    }
    function buildPickerOptions(select){
      if (!synth) return;
      var voices = synth.getVoices() || [];
      if (!voices.length) return;
      var english = voices.filter(function(v){ return /^en/i.test(v.lang); });
      var list = english.length ? english : voices;
      var cur = bestVoice;
      var prevValue = select.value;
      select.innerHTML = "";
      list.forEach(function(v){
        var opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = v.name.replace(/^Microsoft /, "").replace(/ - English.*$/, "").replace(/^Google /, "");
        select.appendChild(opt);
      });
      var toSelect = list.some(function(v){ return v.name === prevValue; }) ? prevValue : (cur && cur.name);
      if (toSelect) select.value = toSelect;
    }
    function ensureVoicePicker(btn){
      if (!btn || btn.__shVoicePicker || !synth) return;
      // Buttons backed by a pre-generated audio file don't use the browser's
      // voice list at all, so the picker would be confusing there (changing
      // it wouldn't do anything). It's skipped for those — unless the audio
      // file fails to load, at which point the error handler below clears
      // this flag and falls back to the normal synth path, picker included.
      if (btn.getAttribute && btn.getAttribute("data-sh-tts-audio") === "1") return;
      btn.__shVoicePicker = true;
      var select = document.createElement("select");
      select.className = "sh-tts-voice-picker";
      select.title = "Reading voice";
      select.setAttribute("aria-label", "Reading voice");
      buildPickerOptions(select);
      select.addEventListener("click", function(ev){ ev.stopPropagation(); });
      select.addEventListener("change", function(){
        var voices = synth.getVoices() || [];
        var chosen = voices.filter(function(v){ return v.name === select.value; })[0];
        if (!chosen) return;
        saveVoiceName(chosen.name);
        bestVoice = chosen;
        if (vs && vs.btn === btn) { vs.voice = chosen; vs.retried = false; if (!vs.paused) again(vs); }
      });
      btn.insertAdjacentElement("afterend", select);
      pickers.push(select);
      /* the device voice's speed (BUG-199): the recording player's 1x to 2x select, as the utterance's rate. A change
         takes effect at once: the voice starts again from the word it reached, at the new speed. */
      var rate = document.createElement("select");
      rate.className = "sh-tts-rate sh-tts-voice-rate";
      rate.title = "Reading speed";
      rate.setAttribute("aria-label", "Reading speed");
      rate.innerHTML = RATE_OPTS;
      rate.value = String(rateNow());
      rate.addEventListener("click", function(ev){ ev.stopPropagation(); });
      rate.addEventListener("change", function(){
        var r = parseFloat(rate.value) || 1;
        try { localStorage.setItem(RATE_KEY, String(r)); } catch (e) {}
        if (vs && vs.btn === btn && !vs.paused) again(vs);
      });
      select.insertAdjacentElement("afterend", rate);
    }
    function scanForButtons(){
      var btns = document.querySelectorAll(".sh-tts-btn");
      for (var i = 0; i < btns.length; i++) ensureVoicePicker(btns[i]);
    }
    if (synth) {
      bestVoice = pickBestVoice();
      synth.onvoiceschanged = function(){
        bestVoice = pickBestVoice();
        pickers.forEach(buildPickerOptions);
        scanForButtons();
      };
    }
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scanForButtons);
      } else {
        scanForButtons();
      }
      if (typeof MutationObserver !== "undefined") {
        try {
          new MutationObserver(scanForButtons).observe(document.documentElement, { childList: true, subtree: true });
        } catch (e) {}
      }
    }

    function setState(btn, state){
      if (!btn) return;
      setTimeout(dockSync, 0);
      btn.setAttribute("data-state", state);
      btn.setAttribute("aria-label", state === "playing" ? "Pause reading" : (state === "paused" ? "Resume reading" : "Listen to this"));
    }
    function clearHighlight(){
      if (activeWords) activeWords.forEach(function(w){ w.el.classList.remove("sh-tts-active"); });
    }
    function stop(){
      if (activeAudioEl) {
        try { activeAudioEl.pause(); } catch (e) {}
        activeAudioEl = null;
      }
      if (vs) { drop(vs); vs = null; }
      hush();
      if (activeBtn) setState(activeBtn, "idle");
      clearHighlight();
      activeBtn = null; activeWords = null; wordCursor = -1;
      dockSync();
      try { document.dispatchEvent(new CustomEvent("sh:tts-stop")); } catch (e) {}   // the read-along (widget/hub.js) lets go
    }

    // Wrap each word of a container's text in its own span so it can be
    // highlighted and clicked. Re-entrant: if the container's content was
    // already wrapped (and hasn't been re-rendered since), reuses those
    // spans rather than nesting new ones inside them.
    function wrapWords(container){
      var existing = container.querySelectorAll(".sh-tts-word");
      if (existing.length) {
        return Array.prototype.map.call(existing, function(el){ return { el: el, text: el.textContent }; });
      }
      var words = [];
      function walk(node){
        if (node.nodeType === 3) {
          var parts = node.nodeValue.split(/(\s+)/);
          if (parts.length <= 1) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement("span");
            span.className = "sh-tts-word";
            span.textContent = part;
            frag.appendChild(span);
            words.push({ el: span, text: part });
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && !/^(SCRIPT|STYLE)$/i.test(node.tagName) && !node.hasAttribute("data-sh-noread")) {
          // figures placed inside the notes carry data-sh-noread: they are not part of the narrated text
          Array.prototype.slice.call(node.childNodes).forEach(walk);
        }
      }
      Array.prototype.slice.call(container.childNodes).forEach(walk);
      return words;
    }

    /* The device's voice (BUG-199, 2026-11-24): a hub without recordings reads with the browser's speech synthesis.
       It speaks a sentence or so at a time, one piece after another. One utterance for a whole part (Review of Systems'
       As taught runs to 27,000 characters) is what Chrome's network voices cut off or fail on, and a short first piece
       starts sooner after a tapped word. Pause cancels and Resume speaks again from the word it reached (Android's
       pause() doesn't hold, and pause/resume across pieces would be ours anyway). A speak() right after a cancel()
       waits a moment, which iOS Safari can otherwise drop. An error tries the piece once more on a plain local voice,
       then moves on to the next piece; three in a row, or one that never starts, stop it with a toast that says so.
       Speed is the recording player's select (rateNow(), the utterance's rate). Logged: tts:voice-error=<code> and
       tts:secs (seconds spoken, times the speed, as a recording's are content seconds), tts:end at the last word. */
    var vs = null, hushAt = 0, litEl = null;   // the voice's session; when we last cut speech off; the word lit now
    var SOFT = 120, HARD = 200;   // a piece's length in characters: it ends at a comma past SOFT, anywhere past HARD (about 12 s at 1x)
    var ABBR = /^(?:[a-z]\.){1,3}$|^(?:e\.g|i\.e|vs|cf|dr|mr|mrs|ms|st|fig|figs|approx|no)\.$/i;
    var BLOCKS = "p,li,h1,h2,h3,h4,h5,h6,td,th,dt,dd,blockquote,figcaption,caption,summary,pre,div,section,article";
    var START_MS = 7000;   // a piece that hasn't started by then counts as an error ("no-start")
    function hush(){
      if (!synth) return;
      try { if (synth.speaking || synth.pending || synth.paused) hushAt = Date.now(); synth.cancel(); } catch (e) {}
    }
    function blockOf(w){ if (!("blk" in w)) w.blk = w.el.closest ? w.el.closest(BLOCKS) : null; return w.blk; }
    /* where the piece starting at word s ends (exclusive): a sentence's end, a block's end (a heading, a list item, a
       table cell), or a comma, colon, semicolon or dash once it's long */
    function pieceEnd(words, s){
      var len = 0, j = s;
      for (; j < words.length - 1; j++) {
        var t = words[j].text; len += t.length + 1;
        if (/[.!?]["'”’)\]]*$/.test(t) && !ABBR.test(t)) break;
        if (blockOf(words[j]) !== blockOf(words[j + 1])) break;
        if (len >= HARD || (len >= SOFT && /[,;:–—]["'”’)\]]*$/.test(t))) break;
      }
      return j + 1;
    }
    function lastAtOrBefore(offs, c){ var lo = 0, hi = offs.length - 1; while (lo < hi) { var m = (lo + hi + 1) >> 1; if (offs[m] <= c) lo = m; else hi = m - 1; } return lo; }
    function mark(sess, i){
      wordCursor = i;
      if (litEl) litEl.classList.remove("sh-tts-active");
      var w = sess.words[i];
      litEl = w ? w.el : null;
      if (w) {
        w.el.classList.add("sh-tts-active");
        /* a folded topic of the notes opens as the voice reaches it (widget/hub.js foldTopics) */
        if (w.el.closest && w.el.closest("[hidden]")) { try { w.el.dispatchEvent(new CustomEvent("sh:reveal", { bubbles: true })); } catch (e) {} }
      }
      dockProgress(sess.words.length ? (i + 1) / sess.words.length : 0, "");
    }
    /* seconds heard on this piece so far (feature events: tts:secs, at 1x like a recording's) */
    function heard(sess){
      if (!sess.t0) return;
      var secs = (Date.now() - sess.t0) / 1000;
      sess.t0 = 0;
      var n = Math.round(secs * (sess.rate || 1) * 10) / 10;
      if (n > 0 && secs < 120) shTrackSafe("tts:secs", n);   // never a 0: shTrack counts it as 1
    }
    /* let go of the piece being spoken: its events are ignored from here on */
    function drop(sess){ heard(sess); clearTimeout(sess.timer); sess.u = null; }
    /* the word the voice is on, or the piece's first if it hasn't said one yet */
    function here(sess){ return wordCursor >= sess.at && wordCursor < sess.end ? wordCursor : sess.at; }
    function again(sess){ sess.at = here(sess); drop(sess); hush(); speakPiece(sess); }
    function speakPiece(sess){
      if (vs !== sess || sess.paused) return;
      var words = sess.words, s = sess.at, e, text, offs;
      for (;;) {
        if (s >= words.length) { endVoice(sess); return; }
        e = pieceEnd(words, s); text = ""; offs = [];
        for (var k = s; k < e; k++) { if (text) text += " "; offs.push(text.length); text += words[k].text; }
        if (/[0-9A-Za-z\u00C0-\u024F\u0370-\u03FF]/.test(text)) break;   // a piece of only bullets or dashes is skipped
        s = e;
      }
      sess.at = s; sess.end = e; sess.rate = rateNow();
      var u = new SpeechSynthesisUtterance(text), started = false;
      u.rate = sess.rate; u.pitch = 1;
      if (sess.voice) { u.voice = sess.voice; if (sess.voice.lang) u.lang = sess.voice.lang; }
      sess.u = u;   // held here, or Chrome can collect it before its end event
      function mine(){ return vs === sess && sess.u === u; }
      u.onstart = function(){
        if (!mine()) return;
        started = true; sess.fails = 0; sess.t0 = Date.now(); clearTimeout(sess.timer);
        mark(sess, s);
      };
      u.onboundary = function(ev){
        if (!mine() || (ev.name && ev.name !== "word")) return;
        var i = typeof ev.charIndex === "number" ? lastAtOrBefore(offs, ev.charIndex) : wordCursor - s + 1;
        mark(sess, s + Math.max(0, Math.min(i, e - s - 1)));
      };
      u.onend = function(){
        if (!mine()) return;
        drop(sess);
        sess.at = e; speakPiece(sess);
      };
      u.onerror = function(ev){
        if (!mine()) return;
        drop(sess);
        failed(sess, ev && ev.error);
      };
      mark(sess, s);
      function go(){
        if (!mine()) return;
        try { if (synth.paused) synth.resume(); synth.speak(u); } catch (er) { drop(sess); failed(sess, "speak"); return; }
        sess.timer = setTimeout(function(){ if (mine() && !started) { drop(sess); hush(); failed(sess, "no-start"); } }, START_MS);
      }
      /* straight away when nothing was just cut off (iOS lets the first speak() through only inside the tap) */
      var wait = 150 - (Date.now() - hushAt);
      if (wait > 0) setTimeout(go, wait); else go();
    }
    function failed(sess, code){
      code = String(code || "unknown").toLowerCase().replace(/[^a-z-]+/g, "").slice(0, 24) || "unknown";
      shTrackSafe("tts:voice-error=" + code);
      /* not ours (ours are dropped before they arrive): another app took the audio, or the browser wants a tap */
      if (code === "interrupted" || code === "canceled" || code === "not-allowed") { pauseVoice(sess); return; }
      sess.fails++;
      var fb = pickFallbackVoice();
      if (!sess.retried && fb && (!sess.voice || sess.voice.name !== fb.name)) { sess.retried = true; sess.voice = fb; speakPiece(sess); return; }
      if (sess.fails >= 3 || code === "no-start") { endVoice(sess, true); return; }
      sess.at = sess.end; speakPiece(sess);   // move on to the next piece
    }
    function pauseVoice(sess){
      sess.at = here(sess); drop(sess); sess.paused = true; hush();
      if (activeBtn === sess.btn) setState(sess.btn, "paused");
    }
    function resumeVoice(sess){
      sess.paused = false; sess.fails = 0;
      if (activeBtn === sess.btn) setState(sess.btn, "playing");
      speakPiece(sess);
    }
    function endVoice(sess, broke){
      drop(sess);
      if (vs === sess) vs = null;
      if (!broke) shTrackSafe("tts:end");
      if (activeBtn === sess.btn) { setState(sess.btn, "idle"); activeBtn = null; clearHighlight(); activeWords = null; wordCursor = -1; dockSync(); }
      if (broke) try { if (window.shToast) window.shToast("Your device's voice didn't read this. Pick another voice in the list next to Listen and try again.", { kind: "err", title: "Couldn't read aloud" }); } catch (e) {}
    }
    function speakFrom(words, startIdx, btn){
      if (!synth) return;
      if (vs) drop(vs);
      hush();
      var sess = vs = { words: words, btn: btn, at: Math.max(0, startIdx || 0), end: 0, voice: bestVoice, fails: 0, retried: false, paused: false, u: null, t0: 0, timer: 0, rate: 1 };
      activeBtn = btn; activeWords = words; wordCursor = sess.at - 1;
      setState(btn, "playing");
      speakPiece(sess);
    }

    function speakWithSynth(container, btn){
      if (!synth || !container) return;
      ensureVoicePicker(btn);
      stop();
      var words = wrapWords(container);
      if (!words.length) return;
      words.forEach(function(w, i){
        if (w.el.__shTTSWired) return;
        w.el.__shTTSWired = true;
        /* a tapped word: the voice starts again from it */
        w.el.addEventListener("click", function(){ speakFrom(words, i, btn); });
      });
      speakFrom(words, 0, btn);
    }

    // Pre-generated-audio path (Kokoro-narrated mp3s for hubs that have
    // them). No per-word highlighting here — there's no boundary-event
    // equivalent for a static audio file — just play/pause/resume of the
    // file, using the same button + state machine as the synth path. If the
    // file 404s or otherwise fails to play, this drops back to the browser
    // voice (speakWithSynth) so Listen never just goes silent.
    /* Player strip for pre-generated narration: seek bar, 15 s back / forward, speed, and the
       position remembered per file (localStorage) so a long lecture resumes where you stopped.
       Lock-screen / headphone controls come from the Media Session API where supported. */
    var POS_PREFIX = "sh_tts_pos:";
    function fmtTime(sec){ sec = Math.max(0, Math.floor(sec || 0)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
    function savedPos(url){ try { return parseFloat(localStorage.getItem(POS_PREFIX + url)) || 0; } catch (e) { return 0; } }
    function savePos(url, t){ try { if (t > 0) localStorage.setItem(POS_PREFIX + url, String(Math.floor(t))); else localStorage.removeItem(POS_PREFIX + url); } catch (e) {} }
    function ensurePlayer(btn){
      if (btn.__shPlayer && btn.__shPlayer.isConnected) return btn.__shPlayer;
      var el = document.createElement("div");
      el.className = "sh-tts-player";
      el.innerHTML =
        '<button type="button" class="sh-tts-skip" data-skip="-15" aria-label="Back 15 seconds">−15</button>' +
        '<input type="range" class="sh-tts-seek" min="0" max="1000" value="0" step="1" aria-label="Position in the narration">' +
        '<button type="button" class="sh-tts-skip" data-skip="15" aria-label="Forward 15 seconds">+15</button>' +
        '<span class="sh-tts-time">0:00</span>' +
        '<select class="sh-tts-rate" aria-label="Playback speed">' + RATE_OPTS + "</select>";
      var row = btn.parentNode;
      (row && row.parentNode ? row.parentNode : btn.parentNode).insertBefore(el, row && row.nextSibling);
      btn.__shPlayer = el;
      return el;
    }
    function playAudioFile(container, btn, audioUrl){
      var audio = new Audio(audioUrl);
      audio.preload = "auto";
      var rate = parseFloat(prefGetSafe(RATE_KEY)) || 1;
      audio.playbackRate = rate; audio.defaultPlaybackRate = rate;
      var player = ensurePlayer(btn), seek = player.querySelector(".sh-tts-seek"), time = player.querySelector(".sh-tts-time"), rateSel = player.querySelector(".sh-tts-rate");
      rateSel.value = String(rate);
      player.hidden = false;
      var dragging = false, lastSave = 0, lastT = null;
      audio.addEventListener("seeking", function(){ lastT = null; });
      function paint(){
        if (!audio.duration || !isFinite(audio.duration)) return;
        if (!dragging) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
        time.textContent = fmtTime(audio.currentTime) + " / " + fmtTime(audio.duration);
      }
      audio.addEventListener("loadedmetadata", function(){
        var at = savedPos(audioUrl);
        if (at > 5 && at < audio.duration - 10) { try { audio.currentTime = at; } catch (e) {} }
        paint();
      });
      audio.addEventListener("timeupdate", function(){
        paint();
        /* seconds of narration heard (content time; seeks don't count) */
        if (lastT !== null && !audio.paused) { var dt = audio.currentTime - lastT; if (dt > 0 && dt < 3) shTrackSafe("tts:secs", dt); }
        lastT = audio.currentTime;
        if (activeAudioEl === audio && audio.duration) dockProgress(audio.currentTime / audio.duration, fmtTime(audio.currentTime) + " / " + fmtTime(audio.duration));
        var now = Date.now(); if (now - lastSave > 4000) { lastSave = now; savePos(audioUrl, audio.currentTime); }
      });
      audio.addEventListener("pause", function(){ savePos(audioUrl, audio.currentTime); if (activeAudioEl === audio && activeBtn === btn) setState(btn, "paused"); });
      audio.addEventListener("play", function(){
        if (activeAudioEl === audio && activeBtn === btn) setState(btn, "playing");
        /* study time counts narration heard with the screen off: a play from the lock screen starts its clock again */
        try { document.dispatchEvent(new CustomEvent("sh:audio-play")); } catch (e) {}
      });
      seek.oninput = function(){ dragging = true; if (audio.duration) time.textContent = fmtTime(seek.value / 1000 * audio.duration) + " / " + fmtTime(audio.duration); };
      seek.onchange = function(){ dragging = false; if (audio.duration) { audio.currentTime = seek.value / 1000 * audio.duration; savePos(audioUrl, audio.currentTime); } };
      player.querySelectorAll("[data-skip]").forEach(function(b){ b.onclick = function(){ if (audio.duration) audio.currentTime = Math.min(audio.duration - 1, Math.max(0, audio.currentTime + (+b.getAttribute("data-skip")))); paint(); }; });
      rateSel.onchange = function(){ var r = parseFloat(rateSel.value) || 1; audio.playbackRate = r; try { localStorage.setItem(RATE_KEY, String(r)); } catch (e) {} };
      audio.addEventListener("ended", function(){
        shTrackSafe("tts:end");
        savePos(audioUrl, 0);
        if (activeAudioEl === audio) activeAudioEl = null;
        if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; }
        dockSync();
      });
      audio.addEventListener("error", function(){
        if (activeAudioEl === audio) activeAudioEl = null;
        if (activeBtn === btn) activeBtn = null;
        player.hidden = true;
        if (btn) btn.removeAttribute("data-sh-tts-audio");
        speakWithSynth(container, btn);
      });
      if ("mediaSession" in navigator) {
        try {
          var head = btn.closest("article, section");
          var h = head && head.querySelector("h2, h1");
          navigator.mediaSession.metadata = new MediaMetadata({ title: h ? h.textContent.trim().slice(0, 90) : document.title, artist: "Study Hubs", album: document.title });
          navigator.mediaSession.setActionHandler("play", function(){ audio.play(); });
          navigator.mediaSession.setActionHandler("pause", function(){ audio.pause(); });
          navigator.mediaSession.setActionHandler("seekbackward", function(){ audio.currentTime = Math.max(0, audio.currentTime - 15); });
          navigator.mediaSession.setActionHandler("seekforward", function(){ audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15); });
        } catch (e) {}
      }
      activeBtn = btn;
      activeAudioEl = audio;
      setState(btn, "playing");
      /* the redesign's read-along (widget/hub.js) follows this audio to highlight each word as it's read */
      try { document.dispatchEvent(new CustomEvent("sh:tts-audio", { detail: { audio: audio, container: container, url: audioUrl } })); } catch (e) {}
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function(){
          if (activeAudioEl === audio) activeAudioEl = null;
          player.hidden = true;
          if (btn) btn.removeAttribute("data-sh-tts-audio");
          speakWithSynth(container, btn);
        });
      }
    }

    /* Floating Listen dock (student suggestion #4, 2026-10-15): while a lecture is being read aloud and its own Listen
       button and player have scrolled out of view, a small bar pinned to the bottom of the screen keeps play/pause, the
       progress (seekable for narration files), the time and a stop button in reach. Tapping the title scrolls back. */
    var cur = null, dock = null, anchorSeen = true, io = null, ioTarget = null;
    function dockEl(){
      if (dock) return dock;
      dock = document.createElement("div");
      dock.className = "sh-tts-dock"; dock.hidden = true;
      dock.setAttribute("role", "region"); dock.setAttribute("aria-label", "Narration controls");
      dock.innerHTML =
        '<button type="button" class="sh-tts-dock-play" aria-label="Pause reading"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="i-play" d="M8 5.5v13l10.5-6.5z"/></svg></button>' +
        '<div class="sh-tts-dock-mid"><button type="button" class="sh-tts-dock-title" title="Back to the notes"></button>' +
        '<input type="range" class="sh-tts-dock-seek" min="0" max="1000" value="0" step="1" aria-label="Position in the narration"></div>' +
        '<span class="sh-tts-dock-time"></span>' +
        '<button type="button" class="sh-tts-dock-close" aria-label="Stop reading">&times;</button>';
      dock.querySelector(".sh-tts-dock-play").onclick = function(){ if (cur && activeBtn) speak(cur.container, cur.btn, cur.url); };
      dock.querySelector(".sh-tts-dock-close").onclick = function(){ stop(); };
      dock.querySelector(".sh-tts-dock-title").onclick = function(){
        var t = cur && cur.btn && cur.btn.isConnected ? cur.btn : null;
        if (t) try { t.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { t.scrollIntoView(); }
      };
      var seek = dock.querySelector(".sh-tts-dock-seek");
      seek.onchange = function(){
        var a = activeAudioEl;
        if (a && a.duration) a.currentTime = seek.value / 1000 * a.duration;
      };
      seek.oninput = function(){ dock.__drag = true; };
      seek.addEventListener("change", function(){ dock.__drag = false; });
      document.body.appendChild(dock);
      return dock;
    }
    function dockProgress(frac, label){
      if (!dock || dock.hidden) return;
      var seek = dock.querySelector(".sh-tts-dock-seek");
      if (!dock.__drag) seek.value = String(Math.round(Math.max(0, Math.min(1, frac)) * 1000));
      dock.querySelector(".sh-tts-dock-time").textContent = label || "";
    }
    function watchAnchor(btn){
      var target = btn ? (btn.closest(".reading-tools, .sh-tts-row") || btn) : null;
      if (target === ioTarget) return;
      if (io) { try { io.disconnect(); } catch (e) {} }
      ioTarget = target; anchorSeen = true;
      if (!target || typeof IntersectionObserver === "undefined") return;
      io = new IntersectionObserver(function(entries){
        anchorSeen = entries.some(function(e){ return e.isIntersecting; });
        dockSync();
      });
      io.observe(target);
      if (btn.__shPlayer) io.observe(btn.__shPlayer);
    }
    function dockSync(){
      if (typeof document === "undefined" || !document.body) return;
      var on = !!(activeBtn && cur && cur.btn === activeBtn);
      if (on) watchAnchor(activeBtn);
      var gone = on && !activeBtn.isConnected;
      var show = on && (!anchorSeen || gone);
      if (!show) { if (dock) dock.hidden = true; return; }
      var d = dockEl();
      var playing = activeBtn.getAttribute("data-state") === "playing";
      d.setAttribute("data-state", playing ? "playing" : "paused");
      d.querySelector(".sh-tts-dock-play").setAttribute("aria-label", playing ? "Pause reading" : "Resume reading");
      var head = cur.container && cur.container.closest ? cur.container.closest("article, section, .reading, .notes") : null;
      var h = head && head.querySelector("h1, h2, h3");
      var title = "";
      if (h) { var hc = h.cloneNode(true); Array.prototype.forEach.call(hc.querySelectorAll("[class*=badge],[class*=chip],[class*=pill],[class*=status],[class*=tag],[aria-hidden=true]"), function(x){ x.remove(); }); title = hc.textContent.replace(/\s+/g, " ").trim(); }
      d.querySelector(".sh-tts-dock-title").textContent = title || "Lecture notes";
      var seek = d.querySelector(".sh-tts-dock-seek");
      seek.disabled = !activeAudioEl;
      if (activeAudioEl && activeAudioEl.duration) dockProgress(activeAudioEl.currentTime / activeAudioEl.duration, fmtTime(activeAudioEl.currentTime) + " / " + fmtTime(activeAudioEl.duration));
      d.hidden = false;
    }
    function prefGetSafe(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }

    // Public entry point. audioUrl is optional — pass it when a hub has a
    // pre-generated narration file for the content currently shown in
    // container; omit it (or pass a falsy value) to use the browser's own
    // voice, unchanged from before.
    function speak(container, btn, audioUrl){
      if (!container) return;
      /* an archived hub's narration files are gone: read with the device's voice (voice picker included) */
      if (AUDIO_OFF) { audioUrl = ""; if (btn && btn.removeAttribute) btn.removeAttribute("data-sh-tts-audio"); }
      cur ={ container: container, btn: btn, url: audioUrl || "" };
      if (activeBtn === btn) {
        if (activeAudioEl) {
          if (activeAudioEl.paused) { activeAudioEl.play(); setState(btn, "playing"); }
          else { activeAudioEl.pause(); setState(btn, "paused"); }
          return;
        }
        if (vs && vs.btn === btn) { if (vs.paused) resumeVoice(vs); else pauseVoice(vs); return; }
      }
      stop();
      /* feature events (widget/clicks.js, migration_v37): who starts narration, at which level, for which lecture */
      var file = audioUrl ? String(audioUrl).split("/").pop().replace(/\.mp3.*$/, "") : "";
      shTrackSafe("tts:start-" + (!audioUrl ? "voice" : /-plain$/.test(file) ? "plain" : "full"));
      if (file) shTrackSafe("tts:lec=" + file);
      if (audioUrl) { playAudioFile(container, btn, audioUrl); return; }
      speakWithSynth(container, btn);
    }

    /* true while a lecture is being read aloud (pre-recorded narration or the browser voice) */
    function listening(){ return !!(activeAudioEl && !activeAudioEl.paused && !activeAudioEl.ended) || !!(vs && !vs.paused); }
    /* the narration file playing now, if any (read-only: the read-along highlight in widget/hub.js reads its time) */
    function audioEl(){ return activeAudioEl; }
    return { supported: !!synth, speak: speak, stop: stop, listening: listening, audio: audioEl };
  })();

  /* ---------- the settings this file still applies: text size and the screen name, on load (the hub's Settings page,
     widget/hub.js, changes them; the old Settings panel, with its font and background music, came out on 2026-11-25) ---------- */
  var SH_FONT_KEY = "sh_pref_font";
  var SH_SIZE_KEY = "sh_pref_size";
  var SH_NAME_KEY = "sh_display_name";
  var SH_VISITS_KEY = "sh_visit_count";
  var SH_NUKE_PREF_KEY = "sh_pref_nuke";   // on | mine (no classmates' strikes) | off (was sh_pref_nuke_alerts on/off)
  var NUKE_STREAK_THRESHOLD = 100;
  var NUKE_IMG_BASE = (function(){
    try { return new URL("img/", thisScript.src).href; } catch (e) { return "img/"; }
  })();
  var NUKE_VID_BASE = (function(){
    try { return new URL("vid/", thisScript.src).href; } catch (e) { return "vid/"; }
  })();
  var SIZE_ZOOM = { small: 0.9, "default": 1, large: 1.15, xlarge: 1.3, xxlarge: 1.45 };

  function prefGet(key, fallback){
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function prefSet(key, val){
    try { localStorage.setItem(key, val); } catch (e) {}
    /* eggs.js (holiday theme) and pet.js (tooth buddy on/off) follow settings live */
    try { document.dispatchEvent(new CustomEvent("sh:pref", { detail: { key: key, val: val } })); } catch (e) {}
  }

  /* ---------- Extras: everything optional, each with its own switch on the hub's Settings page (widget/hub.js, EXTRAS) and
     the dashboard's (widget/dash.js, EXTRAS), with the same keys. sh_pref_eggs ("Hidden secrets") now covers only the easter
     eggs that have no switch of their own. ---------- */
  /* one time: Surprises off used to hide the bosses, fairy, probe, flame and the celebration cards, and
     nuke alerts off meant "mine only"; carry both over to the new switches */
  (function(){
    if (prefGet("sh_pref_extras_v", "") === "1") return;
    try {
      if (localStorage.getItem("sh_pref_eggs") === "off")
        ["sh_pref_boss", "sh_pref_fairy", "sh_pref_probe", "sh_pref_celebrate", "sh_pref_flame"].forEach(function(k){
          if (localStorage.getItem(k) === null) localStorage.setItem(k, "off");
        });
      if (localStorage.getItem("sh_pref_nuke_alerts") === "off" && localStorage.getItem("sh_pref_nuke") === null) localStorage.setItem("sh_pref_nuke", "mine");
      localStorage.setItem("sh_pref_extras_v", "1");
    } catch (e) {}
  })();
  function extraOn(key){ return prefGet(key, "on") !== "off"; }
  function nukePref(){ return prefGet(SH_NUKE_PREF_KEY, "on"); }

  /* Font was cut from Settings on 2026-11-05, and a font saved before then is no longer applied (Sam, 2026-11-24: "For font,
     stop applying"): forget a saved one, as ranks-hub.js does the accent metal, and leave --font-body to the page */
  function applyFontPref(){
    try { localStorage.removeItem(SH_FONT_KEY); } catch (e) {}
    document.documentElement.style.removeProperty("--font-body");
  }
  function applySizePref(){
    var z = SIZE_ZOOM[prefGet(SH_SIZE_KEY, "default")] || 1;
    document.documentElement.style.zoom = z;
  }
  applyFontPref();
  applySizePref();

  function currentName(){
    try { return (localStorage.getItem(SH_NAME_KEY) || "").trim(); } catch (e) { return ""; }
  }
  /* ---------- spaced review (feeds the Daily Drill, widget/drill.js). Hubs are live for about a week
     before their exam, so the gaps are short: a missed question comes back tomorrow; a right one after
     1, 2, 4, then 7 days, and never later than the day before the hub's next exam (SH_EXPORT.exams).
     Only the first right answer of the day moves a question along, so answering it twice in one sitting
     doesn't push it out. Stored per hub on this device: { qid: { b: right answers in a row, due, t: last day } } ---------- */
  var SRS_KEY = "sh_srs_" + HUB, SRS_STEPS = [1, 2, 4, 7];
  function srsDay(offset){ var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + (offset || 0)); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function srsLoad(){ try { return JSON.parse(localStorage.getItem(SRS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  /* the day before the next exam still ahead (from tomorrow on), or "" */
  function srsExamEve(){
    var ex = (window.SH_EXPORT && window.SH_EXPORT.exams) || [], tomorrow = srsDay(1), eve = "";
    ex.forEach(function(x){
      var p = String((x && x.date) || "").split("-").map(Number); if (p.length !== 3 || !p[0]) return;
      var d = new Date(p[0], p[1] - 1, p[2] - 1), e = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
      if (e >= tomorrow && (!eve || e < eve)) eve = e;
    });
    return eve;
  }
  /* true on the (local) day of any of this hub's exams (SH_EXPORT.exams) */
  function isExamDay(){
    var today = srsDay(0);
    return ((window.SH_EXPORT && window.SH_EXPORT.exams) || []).some(function(x){ return x && x.date === today; });
  }
  function srsDue(b){ var due = srsDay(b ? SRS_STEPS[b - 1] : 1), eve = srsExamEve(); return eve && due > eve ? eve : due; }
  function srsRecord(qid, correct){
    if (!qid) return;
    var all = srsLoad(), r = all[qid] || { b: 0 }, today = srsDay(0);
    if (correct) {
      if (r.t === today && r.b) return;
      r.b = Math.min(r.b + 1, SRS_STEPS.length);
    } else r.b = 0;
    r.due = srsDue(r.b); r.t = today;
    all[qid] = r;
    try { localStorage.setItem(SRS_KEY, JSON.stringify(all)); } catch (e) {}
  }
  /* once per hub: pull in reviews scheduled under the old 1/3/7/14/30-day gaps */
  (function(){
    try {
      if (localStorage.getItem(SRS_KEY + "_v") === "2") return;
      var all = srsLoad();
      Object.keys(all).forEach(function(k){
        var r = all[k]; if (!r) return;
        r.b = Math.min(r.b || 0, SRS_STEPS.length);
        var max = srsDue(r.b); if (r.due && r.due > max) r.due = max;
      });
      localStorage.setItem(SRS_KEY, JSON.stringify(all));
      localStorage.setItem(SRS_KEY + "_v", "2");
    } catch (e) {}
  })();
  /* question ids due today or earlier, most-overdue first */
  window.shSrsDue = function(){
    var all = srsLoad(), today = srsDay(0);
    return Object.keys(all).filter(function(k){ return all[k].due && all[k].due <= today; })
      .sort(function(a, b){ return all[a].due < all[b].due ? -1 : all[a].due > all[b].due ? 1 : all[a].b - all[b].b; });
  };
  window.shName = currentName;
  /* scroll something into view and pulse it, used when search jumps to a result */
  window.shFlash = function(el){
    if (!el) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); } catch (e) { el.scrollIntoView(); }
    el.classList.remove("sh-search-flash"); void el.offsetWidth; el.classList.add("sh-search-flash");
    setTimeout(function(){ el.classList.remove("sh-search-flash"); }, 1900);
  };
  window.shGreet = function(text){
    var n = currentName();
    return n ? (text + ", " + n) : text;
  };

  /* ---------- class performance stats (aggregate, anonymous, batched) ----------
     window.shGetClassStats(qids, cb, withChoices): cb receives a {qid: {total, correct}} map (plus choices: {authored
     index: picks} with withChoices). Calls made within a short window are coalesced into one request instead of one round
     trip per question. The engine draws the class's % and the picks beside each choice from it (widget/hub-bank.js,
     classPicks); the old pages' own painting of them came out on 2026-11-25. ---------- */
  var classStatsPending = [];
  var classStatsCallbacks = [];
  var classChoicesPending = [];
  var classStatsTimer = null;
  function uniq(a){ return a.filter(function(v, i){ return a.indexOf(v) === i; }); }
  /* a Supabase query as a promise that never rejects (null on failure) */
  function settle(q){ return new Promise(function(res){ try { q.then(res, function(){ res(null); }); } catch (e) { res(null); } }); }
  /* One call for both (2026-11-19, the database optimization pass, phase 2): get_class_numbers (migration_v82) returns
     the question_stats and question_choices rows the two reads below return, so a card costs one request (and one
     preflight) instead of two; the two reads were a fifth of every request the class made. A database without it gets
     the two reads, as before. */
  var classOne = true;
  function flushClassStats(){
    var qids = classStatsPending, cbs = classStatsCallbacks, want = uniq(classChoicesPending);
    classStatsPending = []; classStatsCallbacks = []; classChoicesPending = [];
    var unique = uniq(qids);
    /* in a quiet spell (safeRpc, above) the cards go without the class's numbers */
    if (!supabase || !unique.length || dbBusy()) { cbs.forEach(function(cb){ cb({}); }); return; }
    if (classOne) { classNumbers(unique, want, cbs); return; }
    classReads(unique, want, cbs);
  }
  function classNumbers(unique, want, cbs){
    var parts = [];
    for (var i = 0; i < unique.length; i += 1000) (function(qs){   /* the server takes up to 1,000 a call */
      var set = {}; qs.forEach(function(q){ set[q] = 1; });
      parts.push(settle(supabase.rpc("get_class_numbers", { p_hub: HUB, p_qids: qs, p_choices: want.filter(function(q){ return set[q]; }) })));
    })(unique.slice(i, i + 1000));
    Promise.all(parts).then(function(all){
      if (all.some(rpcMissing)) { classOne = false; classReads(unique, want, cbs); return; }
      var byQid = {}, ok = all.every(function(r){ return r && !r.error && r.data && typeof r.data === "object"; });
      if (ok) {
        all.forEach(function(r){ (r.data.stats || []).forEach(function(s){ byQid[s.qid] = { total: s.attempts, correct: s.correct }; }); });
        want.forEach(function(q){ (byQid[q] = byQid[q] || { total: 0, correct: 0 }).choices = {}; });
        all.forEach(function(r){ (r.data.choices || []).forEach(function(c){ var b = byQid[c.qid]; if (b && b.choices) b.choices[c.choice] = c.picks; }); });
      }
      cbs.forEach(function(cb){ try { cb(byQid); } catch (e) {} });
    });
  }
  function classReads(unique, want, cbs){
    /* question_stats(hub,qid,attempts,correct) already exists and is already
       read anonymously elsewhere (the "Toughest questions" panel above) --
       reuse it rather than adding a new table/RPC for the same data. */
    var jobs = [settle(supabase.from("question_stats").select("qid,attempts,correct").eq("hub", HUB).in("qid", unique))];
    /* per-choice picks (question_choices, by authored index) only for the cards that show them; 100 questions per
       request keeps each answer under the API's 1000-row cap */
    for (var i = 0; i < want.length; i += 100) jobs.push(settle(supabase.from("question_choices").select("qid,choice,picks").eq("hub", HUB).in("qid", want.slice(i, i + 100))));
    Promise.all(jobs).then(function(all){
      var byQid = {}, res = all[0];
      if (res && !res.error) (res.data || []).forEach(function(r){ byQid[r.qid] = { total: r.attempts, correct: r.correct }; });
      var choicesOk = all.slice(1).every(function(r){ return r && !r.error; });
      if (choicesOk) want.forEach(function(q){ (byQid[q] = byQid[q] || { total: 0, correct: 0 }).choices = {}; });
      all.slice(1).forEach(function(r){
        ((r && r.data) || []).forEach(function(c){ var b = byQid[c.qid]; if (b && b.choices) b.choices[c.choice] = c.picks; });
      });
      cbs.forEach(function(cb){ try { cb(byQid); } catch (e) {} });
    });
  }
  /* withChoices: also fetch how often each choice was picked, as byQid[qid].choices = {authored index: picks} */
  window.shGetClassStats = function(qids, cb, withChoices){
    if (!qids || !qids.length || typeof cb !== "function") return;
    classStatsPending = classStatsPending.concat(qids);
    if (withChoices) classChoicesPending = classChoicesPending.concat(qids);
    classStatsCallbacks.push(cb);
    clearTimeout(classStatsTimer);
    classStatsTimer = setTimeout(flushClassStats, 150);
  };
  /* a small Report button on every question card; it opens the flag panel already
     tagged with that question's id, so reports arrive with context */
  var FLAG_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V4"/><path d="M6 4.5c3.5-2 6.5 2 10 0v8c-3.5 2-6.5-2-10 0"/></svg>';
  var pendingFlagQid = null, pendingFlagLec = null, pendingFlagW = -1, pendingFlagOrd = "";
  function addFlagButton(card){
    if (card.__shFlagBtn) return; card.__shFlagBtn = true;
    var qid = card.getAttribute("data-qid"); if (!qid) return;
    var top = card;
    var b = document.createElement("button");
    b.type = "button"; b.className = "sh-qflag"; b.innerHTML = FLAG_ICON_SM + "Report";
    b.setAttribute("aria-label", "Report a problem with this question");
    /* the version on screen of a question that comes in versions (the engine's data-wording: 0 = A, 1 = B; none: -1)
       goes with the report, so it can be found */
    /* and a statement item's order on screen (data-order "3142": shown statement j is the item's statement 3, 1, 4, 2;
       widget/statements.js), so "statement 3" in the report can be read against the bank */
    b.addEventListener("click", function(ev){ ev.stopPropagation(); if (window.shOpenFlag) window.shOpenFlag(qid, card.hasAttribute("data-wording") ? +card.getAttribute("data-wording") || 0 : -1, card.getAttribute("data-order") || ""); });
    if (window.SH_PINS) addPinButton(card, top, qid);
    top.appendChild(b);
  }
  /* ---------- pinned questions: a Pin button beside Report, in hubs that define window.SH_PINS (their Question Bank
     filters by it). Kept in sh_pins_<hub> (an array of qids, newest first, which the hubs read) and synced across devices
     (migration_v46: set_pins / get_my_pins, moved by Link my devices). sh_pins_t_<hub> holds each question's latest
     change {qid: [1|0, epoch ms]}, so an unpin on one device beats an older pin on another. Every card of the same
     question updates together, and "sh:pins" {qid, pinned, count, synced} tells the hub. ---------- */
  var PIN_KEY = "sh_pins_" + HUB, PIN_T_KEY = "sh_pins_t_" + HUB;
  var PIN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 15v6"/></svg>';
  function readPins(){ try { var a = JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function readPinTimes(){ try { var o = JSON.parse(localStorage.getItem(PIN_T_KEY) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function writePins(a, times){ try { localStorage.setItem(PIN_KEY, JSON.stringify(a)); localStorage.setItem(PIN_T_KEY, JSON.stringify(times)); } catch (e) {} }
  function paintPin(b, on){ b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); b.innerHTML = PIN_ICON + (on ? "Pinned" : "Pin"); b.title = on ? "Unpin this question" : "Pin this question to your Pinned list"; }
  function repaintPins(){ var a = readPins(); document.querySelectorAll(".sh-qpin").forEach(function(b){ paintPin(b, a.indexOf(b.__qid) !== -1); }); }
  function sendPins(rows){
    if (!supabase || AUTOMATED || !rows.length) return;
    try { supabase.rpc("set_pins", { p_visitor: VISITOR_ID, p_hub: HUB, p_pins: rows.slice(0, 500) }).then(function(){}, function(){}); } catch (e) {}
  }
  function mergePins(rows){
    var a = readPins(), times = readPinTimes(), srv = {}, up = [], now = Date.now(), before = a.join("|");
    a.forEach(function(q){ if (!times[q] || !times[q][0]) times[q] = [1, now]; });
    rows.forEach(function(r){ if (Array.isArray(r) && r[0]) srv[r[0]] = [r[1] ? 1 : 0, +r[2] || 0]; });
    Object.keys(times).forEach(function(q){ var m = times[q], x = srv[q]; if (!x || m[1] > x[1]) up.push([q, m[0], m[1]]); });
    Object.keys(srv).forEach(function(q){ var x = srv[q], m = times[q]; if (!m || x[1] > m[1]) times[q] = x; });
    var on = Object.keys(times).filter(function(q){ return times[q][0]; });
    /* keep this device's order, newer pins from elsewhere in front */
    var kept = a.filter(function(q){ return times[q] && times[q][0]; });
    var added = on.filter(function(q){ return kept.indexOf(q) === -1; }).sort(function(x, y){ return times[y][1] - times[x][1]; });
    a = added.concat(kept);
    writePins(a, times); sendPins(up);
    if (a.join("|") !== before) {
      repaintPins();
      try { document.dispatchEvent(new CustomEvent("sh:pins", { detail: { qid: null, pinned: null, count: a.length, synced: true } })); } catch (e) {}
    }
  }
  window.shPins = {
    list: readPins,
    has: function(qid){ return readPins().indexOf(qid) !== -1; },
    count: function(){ return readPins().length; },
    toggle: function(qid){
      var a = readPins(), times = readPinTimes(), i = a.indexOf(qid), on = i === -1, t = Date.now();
      if (on) a.unshift(qid); else a.splice(i, 1);
      times[qid] = [on ? 1 : 0, t];
      writePins(a, times); repaintPins(); sendPins([[qid, on ? 1 : 0, t]]);
      shTrackSafe(on ? "pin:add" : "pin:remove");
      try { document.dispatchEvent(new CustomEvent("sh:pins", { detail: { qid: qid, pinned: on, count: a.length } })); } catch (e) {}
      return on;
    },
    /* merge with the server's copy: per question the newer change wins; pins made before sync existed count as new */
    sync: function(rows){
      if (!window.SH_PINS) return;
      if (Array.isArray(rows)) { mergePins(rows); return; }
      if (!supabase || AUTOMATED) return;
      try {
        supabase.rpc("get_my_pins", { p_visitor: VISITOR_ID, p_hub: HUB }).then(function(res){
          if (!res || res.error || !Array.isArray(res.data)) return;
          mergePins(res.data);
        }, function(){});
      } catch (e) {}
    }
  };
  function addPinButton(card, top, qid){
    var b = document.createElement("button");
    b.type = "button"; b.className = "sh-qpin"; b.__qid = qid;
    paintPin(b, window.shPins.has(qid));
    b.addEventListener("click", function(ev){ ev.stopPropagation(); window.shPins.toggle(qid); });
    top.appendChild(b);
  }
  /* Report and Pin on every question card (cardSelector: ".qcard[data-qid]", widget/hub.js): the cards on the page now,
     and every one drawn later. The name is from when it also filled in the old pages' class numbers. */
  window.shWireClassStats = function(cardSelector){
    try {
      document.querySelectorAll(cardSelector).forEach(addFlagButton);
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          (m.addedNodes || []).forEach(function(node){
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(cardSelector)) addFlagButton(node);
            if (node.querySelectorAll) node.querySelectorAll(cardSelector).forEach(addFlagButton);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* cosmetic-only feature, never block the hub */ }
  };

  /* ---------- your name: the custom one, or the random class name such as "Gleaming Molar". The hub's Settings page and
     the Class stats panel change it (window.shEditName opens the small editor; the Stats panel's box saves through the
     same code). The old pages' name badge in their top bar came out on 2026-11-25. ---------- */
  /* the Class stats panel's name box */
  function syncNameInputs(){
    var el = document.getElementById("shstat-name-input"); if (!el) return;
    el.value = currentName();
    if (resolvedAnonName) el.placeholder = "Right now you're " + resolvedAnonName;
  }
  /* The server keeps one name for linked devices (they share an id), and each device keeps a copy (sh_display_name).
     A name picked here is marked unsaved (sh_name_unsaved) until the server has answered, so a page that loads while it
     isn't saved sends it again, instead of taking the server's older one (nameFromServer, below). */
  var SH_NAME_UNSAVED = "sh_name_unsaved";
  function sendName(name){
    try { localStorage.setItem(SH_NAME_UNSAVED, name); } catch (e) {}
    function answered(){ try { if (localStorage.getItem(SH_NAME_UNSAVED) === name) localStorage.removeItem(SH_NAME_UNSAVED); } catch (e) {} }
    function old(){
      if (!supabase) return;
      try { supabase.rpc("set_display_name", { p_visitor: VISITOR_ID, p_name: name }).then(function(res){ if (dbFailed(res)) dbFail(); else answered(); }, function(){ dbFail(); }); } catch (e) {}
    }
    /* the first name chosen pays 500 XP and crowns (set_display_name_v2, migration_v68); the old call otherwise */
    claimPrize("set_display_name_v2", { p_visitor: VISITOR_ID, p_name: name }, "name").then(function(r){ if (!r || r.missing) old(); else answered(); });
  }
  function saveName(name){
    name = String(name || "").trim().slice(0, 24);
    if (!name) return false;
    sendName(name);
    shTrackSafe("name:set");
    prefSet(SH_NAME_KEY, name);
    syncNameInputs();
    try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: name } })); } catch (e) {}
    /* another, unlinked device already uses this name: ask whether it's theirs (widget/linkask.js) */
    if (window.shLinkAsk) window.shLinkAsk.check(name);
    return true;
  }
  function resetName(){
    try { localStorage.removeItem(SH_NAME_KEY); localStorage.removeItem(SH_NAME_UNSAVED); } catch (e) {}
    shTrackSafe("name:reset");
    if (supabase) try {
      supabase.rpc("clear_display_name", { p_visitor: VISITOR_ID }).then(function(res){
        if (res && !res.error && res.data) { resolvedAnonName = res.data; syncNameInputs(); }
      }, function(){});
    } catch (e) {}
    syncNameInputs();
    try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: "" } })); } catch (e) {}
  }
  var nameDlg = null, nameBack = null;
  function closeNameEditor(){ if (nameDlg) { nameDlg.remove(); nameDlg = null; } }
  function openNameEditor(){
    closeNameEditor();
    nameBack = document.activeElement;
    var custom = currentName();
    nameDlg = document.createElement("div");
    nameDlg.className = "sh-name-dlg";
    nameDlg.innerHTML = '<div class="sh-name-card" role="dialog" aria-modal="true" aria-labelledby="sh-name-h">' +
      '<button class="sh-name-x" type="button" aria-label="Close">&times;</button>' +
      '<h4 id="sh-name-h">Your name</h4>' +
      '<p>This is how classmates see you on the leaderboards, streak boards and ranks, in every hub. A name you picked also shows under Studying now while you have a hub open; a random one doesn’t.' +
      (custom ? '' : (resolvedAnonName ? ' Right now you have a random one: <b>' + esc(resolvedAnonName) + '</b>.' : '')) + '</p>' +
      '<form class="sh-name-form"><input type="text" maxlength="24" autocomplete="nickname" enterkeyhint="done" placeholder="Pick a name" value="' + esc(custom) + '">' +
      '<button type="submit">Save</button></form>' +
      '<div class="sh-name-msg" aria-live="polite"></div>' +
      (custom ? '<button class="sh-name-reset" type="button">Go back to a random name</button>' : '<div class="sh-name-hint">Up to 24 characters. You can change it any time.</div>') +
      '<div class="sh-name-link">Using the hubs on another device too? <button type="button" class="sh-name-linkbtn" data-sh-link="name">Link my devices</button></div>' +
      '</div>';
    document.body.appendChild(nameDlg);
    var input = nameDlg.querySelector("input"), msg = nameDlg.querySelector(".sh-name-msg");
    setTimeout(function(){ try { input.focus(); input.select(); } catch (e) {} }, 30);
    nameDlg.addEventListener("click", function(e){
      if (e.target === nameDlg || e.target.closest(".sh-name-x")) { closeNameEditor(); return; }
      if (e.target.closest(".sh-name-reset")) { resetName(); closeNameEditor(); }
    });
    nameDlg.addEventListener("keydown", function(e){ if (e.key === "Escape") closeNameEditor(); });
    nameDlg.querySelector("form").addEventListener("submit", function(e){
      e.preventDefault();
      var v = input.value.trim();
      if (!v) { msg.textContent = "Type a name first."; input.focus(); return; }
      saveName(v);
      msg.textContent = "Saved. Hi, " + v + "!";
      setTimeout(closeNameEditor, 700);
    });
  }
  window.shEditName = openNameEditor;
  window.shNameNow = function(){ return currentName() || resolvedAnonName || ""; };
  /* Link my devices (widget/linkask.js, loaded below), beside every place a name is changed (Sam, 2026-11-18: "link my
     device is nowhere to be found"): any [data-sh-link="<where>"] button opens it. From the name window, that closes
     first and focus goes back to what opened it. */
  document.addEventListener("click", function(e){
    var b = e.target && e.target.closest && e.target.closest("[data-sh-link]"); if (!b) return;
    var from = b.getAttribute("data-sh-link") || "", back = b;
    if (nameDlg && nameDlg.contains(b)) { back = (nameBack && nameBack.isConnected) ? nameBack : null; closeNameEditor(); }
    var t0 = Date.now();
    (function go(){
      if (window.shLinkAsk && window.shLinkAsk.link) { window.shLinkAsk.link({ back: back, from: from }); return; }
      if (Date.now() - t0 > 8000) { showStreakToast("Couldn’t open Link my devices. Are you online?", null, { kind: "err" }); return; }
      setTimeout(go, 200);
    })();
  });

  // Welcome-back toast for a returning, named visitor — once per page load,
  // a beat after load so it doesn't collide with anything else appearing.
  // It waits for the bootstrap (at most 3 s), which brings a name changed on a linked device.
  (function(){
    var visits = (parseInt(prefGet(SH_VISITS_KEY, "0"), 10) || 0) + 1;
    prefSet(SH_VISITS_KEY, String(visits));
    if (visits < 2 || !currentName()) return;
    var t0 = Date.now(), said = false;
    function say(){
      if (said) return; said = true;
      setTimeout(function(){
        var n = currentName(); if (!n) return;
        showStreakToast("Good to see you, " + n + ".", null, { kind: "hi", ms: 3400 });
      }, Math.max(0, 900 - (Date.now() - t0)));
    }
    /* the bootstrap is asked for further down this file: wait a tick, so nameFromServer runs first */
    setTimeout(function(){ if (bootstrap && bootstrap.ready) bootstrap.ready.then(say, say); setTimeout(say, 3000); }, 0);
  })();

  /* ---------- tactical-nuke sound effects (widget/sfx/*.mp3), from a URL relative to this script, so it
     works from every hub regardless of folder depth. One-shot clips, not
     loops: each play() call rewinds and re-triggers so a rapid re-arm still
     sounds right. ---------- */
  var shNukeSfx = (function(){
    var SFX_BASE = (function(){
      try { return new URL("sfx/", thisScript.src).href; } catch (e) { return "sfx/"; }
    })();
    /* nuke-countdown.mp3 is the countdown video's own soundtrack, pulled out as a file: the video
       has to stay muted to autoplay (and its .webm, which Chrome prefers, has no audio at all) */
    var FILES = { unlock: "nuke-unlock.mp3", launch: "nuke-launch.mp3", blast: "nuke-blast.mp3", countdown: "nuke-countdown.mp3" };
    var els = {};
    function elFor(name){
      if (els[name]) return els[name];
      var a = new Audio(SFX_BASE + FILES[name]);
      a.preload = "auto";
      els[name] = a;
      return a;
    }
    function stop(name){ try { if (els[name]) els[name].pause(); } catch (e) {} }
    function play(name, from){
      try {
        var a = elFor(name);
        a.currentTime = from || 0;
        var p = a.play();
        if (p && p.catch) p.catch(function(){}); // autoplay-policy rejection is fine -- every call site is inside a user gesture (or the ANSWERED_EVENT dispatch that follows one)
      } catch (e) {}
    }
    return { play: play, stop: stop, preload: function(name){ try { elFor(name).load(); } catch (e) {} } };
  })();

  /* ---------- update-available notice — raw fetch (not the supabase client),
     so it still works even if createClient/realtime failed above. Every deploy
     logs a changelog row, so a fresh row appearing after this page loaded IS
     "an update was pushed" — piggybacks on that instead of a separate version file. ---------- */
  (function(){
    var POLL_MS = 4 * 60 * 1000;
    /* The newest row's time is kept on the device for half an hour (2026-11-19, the database optimization pass), shared
       by every tab, hub and the dashboard (widget/dash.js reads and writes the same key): the page still looks every
       four minutes, but asks the database only when what the device has is older than that. This read was 5% of every
       request the class made. The notice comes at most half an hour after a deploy instead of four minutes. */
    var KEEP_MS = 30 * 60 * 1000, KEEP_KEY = "sh_changelog_seen";
    var baseline = null, toastEl = null;
    function kept(){
      try {
        var k = JSON.parse(localStorage.getItem(KEEP_KEY) || "null"), now = Date.now();
        return k && typeof k.at === "string" && typeof k.t === "number" && k.t <= now && now - k.t < KEEP_MS ? k.at : null;
      } catch (e) { return null; }
    }
    function take(latest){
      if (baseline === null) { baseline = latest; return; }
      if (!(new Date(latest) > new Date(baseline))) return;
      /* a sticker toast that stays until it's closed (widget/toast.js, in the engine's bundle); once per page */
      if (window.shToast && !toastEl) toastEl = window.shToast("This hub has been updated.", { kind: "update", sticky: true, action: { label: "Reload", run: function(){ location.reload(); } } });
    }
    function check(){
      var have = kept();
      if (have) { take(have); return; }
      fetch(SB_URL + "/rest/v1/changelog?select=created_at&order=created_at.desc&limit=1", {
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }
      })
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){
        if (!rows || !rows.length) return;
        var latest = rows[0].created_at;
        try { localStorage.setItem(KEEP_KEY, JSON.stringify({ t: Date.now(), at: latest })); } catch (e) {}
        take(latest);
      })
      .catch(function(){ /* best-effort — never break the hub */ });
    }
    check();
    setInterval(check, POLL_MS);
  })();

  /* No early return here when supabase-js is missing (CDN blocked, offline): search,
     mind maps and the panels below are local and must keep working. Every network call
     below checks `supabase` itself. */

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
  function cavityWeek(){
    try {
      var parts = {}, f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" });
      f.formatToParts(new Date()).forEach(function(x){ parts[x.type] = x.value; });
      var d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day)), day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
      var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)), week = Math.ceil(((d - y0) / 864e5 + 1) / 7);
      return d.getUTCFullYear() + "-W" + (week < 10 ? "0" : "") + week;
    } catch (e) { return null; }
  }
  /* Eggs only ask about this week's cavity when this hub has a taught Notes
     section that could contain one and this device has not already found it.
     Preserve that guard when including its read in the page bootstrap. */
  function cavityWeekForBootstrap(){
    var week = cavityWeek();
    if (!week) return null;
    try { if (localStorage.getItem("sh_egg_cavity_" + HUB) === week) return null; } catch (e) {}
    var ex = window.SH_EXPORT || {}, taught = {};
    (ex.lectures || []).forEach(function(l){ if (!l.status || l.status === "taught") taught[l.id] = 1; });
    return (ex.sections || []).some(function(s){ return /^notes$/i.test(s.kind || "") && taught[s.lec] && String(s.text || "").replace(/\s+/g, " ").trim().length >= 140; }) ? week : null;
  }

  /* ---------- page bootstrap ----------
     The widget's quiet, per-visitor reads used to fan out into separate requests
     as each optional module arrived. Keep their existing response shapes, but get
     them in one safe RPC at page start. Expensive rank, mastery, trophy and board
     data intentionally do not belong here: those still wait for the Stats panel.
     `ready` resolves to null only while an older database migration is being
     rolled out or the network is unavailable; individual modules retain their
     one-shot fallback so an offline hub never breaks. */
  var bootstrap = { data: null, ready: Promise.resolve(null), linkName: currentName() };
  /* this hub's answer history kept on the device (migration_v84): {v: visitor, id: the newest answer's id, n: how many the
     server had, a: [[qid, seconds, 1 or 0], ...], the newest 5,000, oldest first}. Written only from a reply that carries
     answers_id, so a database without v84 is never sent the cursor. The device sends id and n and gets only the answers
     after id (answers_part); when the count doesn't add up (Link my devices moved older answers in), the whole history. */
  var ANS_KEY = "sh_answers_hist:" + HUB, ansOff = false;
  function ansLoad(){
    if (ansOff) return null;
    try {
      var r = JSON.parse(localStorage.getItem(ANS_KEY) || "null");
      if (r && r.v === VISITOR_ID && Array.isArray(r.a) && isFinite(r.id) && isFinite(r.n) && r.id >= 0 && r.n >= 0) return r;
    } catch (e) {}
    return null;
  }
  function ansDrop(){ try { localStorage.removeItem(ANS_KEY); } catch (e) {} }
  /* data: a bootstrap or get_my_answers_since reply; sent: the copy whose cursor was sent (or null). Leaves data.answers as
     the whole history (the device's copy with the new answers after it), or takes it away when it can't be trusted. */
  function ansAbsorb(data, sent){
    if (!data || typeof data !== "object" || !Array.isArray(data.answers)) return data;
    if (data.answers_part === true) {
      if (!sent) { delete data.answers; ansDrop(); return data; }
      /* every new answer has a larger id than the copy's, so at the same second it goes after them: the server's order */
      var all = sent.a.concat(data.answers), idx = all.map(function(r, i){ return i; });
      idx.sort(function(x, y){ return ((all[x] && all[x][1]) - (all[y] && all[y][1])) || x - y; });
      data.answers = idx.map(function(i){ return all[i]; }).slice(-5000);
    }
    if (data.answers_id != null && isFinite(data.answers_id) && isFinite(data.answers_n)) {
      try { localStorage.setItem(ANS_KEY, JSON.stringify({ v: VISITOR_ID, id: Number(data.answers_id), n: Number(data.answers_n), a: data.answers })); }
      catch (e) { ansDrop(); }
    }
    return data;
  }
  if (supabase && !EXPORT_ONLY) {
    try {
      var bootArgs = {
        p_visitor: VISITOR_ID,
        p_hub: HUB,
        p_cavity_week: cavityWeekForBootstrap(),
        p_episode: !AUDIO_OFF && window.SH_PODCAST && window.SH_PODCAST.id ? window.SH_PODCAST.id : null,
        p_include_pins: !!window.SH_PINS,
        p_link_name: bootstrap.linkName || null
      };
      /* the v2 bootstrap (with the journeys' rank and the answers saved since the device's newest) */
      var ansSent = ansLoad(), v2Args = bootArgs;
      if (ansSent) v2Args = Object.assign({ p_answers_after: ansSent.id, p_answers_n: ansSent.n }, bootArgs);
      function bootV2(args){
        return supabase.rpc("get_widget_bootstrap_v2", args).then(function(res){
          /* a database without v84 doesn't know the cursor: ask again without it */
          if (rpcMissing(res) && args !== bootArgs) { ansSent = null; ansOff = true; ansDrop(); return bootV2(bootArgs); }
          return res;
        });
      }
      bootstrap.ready = bootV2(v2Args).then(function(res){
        if (!res || res.error || !res.data || typeof res.data !== "object") return null;
        bootstrap.data = ansAbsorb(res.data, ansSent);
        var rk = res.data.rank;
        if (GAME.on === null && rk && rk.journey != null) { GAME.on = true; GAME.boost = rk.boost || null; }
        return bootstrap.data;
      }, function(){ return null; });
    } catch (e) { bootstrap.ready = Promise.resolve(null); }
  }
  window.shBootstrap = bootstrap;

  /* ---------- shared analytics flush ----------
     Click and question-health batches register with this one clock instead of
     each creating a page-level interval. The activity ticker below measures
     foreground time; it is not a network flush timer.
     One call for the three batches (2026-11-19, the database optimization pass, phase 2): question health
     (widget/qhealth.js), clicks and feature events (widget/clicks.js) hand their batches to send() instead of each
     calling its own function, and they go out together in one record_analytics call (migration_v82). When one of them is
     due (its timer, its size, the page being hidden), the others hand over what they hold too, so a page makes one call
     where it made up to three (the three were 14.8% of every request). The rows are the same. The quiet spell holds them
     as before. A database without record_analytics gets the three calls; a page that is leaving (hidden or closed) sends
     with keepalive, the three calls until this device has seen record_analytics work (sh_rpc_analytics). */
  (function(){
    var jobs = {}, timer = null, out = { qh: [], clicks: [], events: [] }, postT = null, gathering = false, one = null;
    try { if (localStorage.getItem("sh_rpc_analytics") === "1") one = true; } catch (e) {}
    function now(){ return Date.now(); }
    /* leaving: the page is being hidden or closed (each job's leave(), when it has one, then one call with keepalive) */
    function run(force, leaving){
      var t = now(), due = [];
      Object.keys(jobs).forEach(function(k){ var j = jobs[k]; if (j && (force || t >= j.next)) due.push(j); });
      if (!due.length && !held()) return;
      /* one is due: the others go with it */
      if (due.length) due = Object.keys(jobs).map(function(k){ return jobs[k]; });
      gathering = true;
      due.forEach(function(j){ j.next = t + j.every; try { (leaving && j.leave ? j.leave : j.flush)(); } catch (e) {} });
      gathering = false;
      post(!!leaving);
    }
    function held(){ return out.qh.length + out.clicks.length + out.events.length > 0; }
    function send(kind, items, leaving){
      if (!out[kind] || !items || !items.length) return;
      Array.prototype.push.apply(out[kind], items);
      if (gathering) return;
      if (leaving) { run(true, true); return; }
      if (!postT) postT = setTimeout(function(){ postT = null; run(true, false); }, 0);
    }
    function headers(){ return { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" }; }
    function beacon(fn, args){
      var body = JSON.stringify(args);
      try { fetch(SB_URL + "/rest/v1/rpc/" + fn, { method: "POST", keepalive: body.length < 60000, headers: headers(), body: body }).catch(function(){}); } catch (e) {}
    }
    /* the three calls of before (a database without record_analytics, or a page leaving before it knows) */
    function apart(a, leaving){
      var calls = [];
      if (a.p_qh.length) calls.push(["record_qh", { p_hub: a.p_hub, p_visitor: a.p_visitor, p_visit: a.p_visit, p_items: a.p_qh }]);
      if (a.p_events.length) calls.push(["record_events", { p_hub: a.p_hub, p_visitor: a.p_visitor, p_items: a.p_events }]);
      if (a.p_clicks.length) calls.push(["record_clicks", { p_hub: a.p_hub, p_visitor: a.p_visitor, p_items: a.p_clicks }]);
      calls.forEach(function(c){
        if (leaving && window.fetch) { beacon(c[0], c[1]); return; }
        try { supabase.rpc(c[0], c[1]).then(function(){}, function(){}); } catch (e) {}
      });
    }
    function post(leaving){
      if (postT && leaving) { clearTimeout(postT); postT = null; }
      if (!held()) return;
      if (!supabase || AUTOMATED) { out = { qh: [], clicks: [], events: [] }; return; }
      if (!leaving && dbBusy()) return;   /* held until the spell is over; a page leaving sends what it was handed (question health's rows, as before) */
      while (held()) {
        /* each part as much as its function takes in one call */
        var a = { p_hub: HUB, p_visitor: VISITOR_ID, p_visit: VISIT_ID, p_qh: out.qh.splice(0, 60), p_clicks: out.clicks.splice(0, 80), p_events: out.events.splice(0, 40) };
        if (one === false || (one === null && leaving)) { apart(a, leaving); continue; }
        if (leaving && window.fetch) { beacon("record_analytics", a); continue; }
        (function(a){
          try {
            supabase.rpc("record_analytics", a).then(function(res){
              if (rpcMissing(res)) { one = false; try { localStorage.removeItem("sh_rpc_analytics"); } catch (e) {} apart(a, false); return; }
              if (res && !res.error) { if (one !== true) { one = true; try { localStorage.setItem("sh_rpc_analytics", "1"); } catch (e) {} } }
              else if (dbFailed(res)) dbFail();
            }, function(){ dbFail(); });
          } catch (e) {}
        })(a);
      }
    }
    function arm(){ if (!timer) timer = setInterval(function(){ run(false); }, 15000); }
    window.shAnalytics = {
      /* leave (optional): what the job does when the page is leaving, in place of flush */
      register: function(key, flush, every, leave){
        if (!key || typeof flush !== "function") return function(){};
        jobs[String(key)] = { flush: flush, leave: typeof leave === "function" ? leave : null, every: Math.max(1000, Number(every) || 30000), next: now() + Math.max(1000, Number(every) || 30000) };
        arm();
        return function(){ delete jobs[String(key)]; };
      },
      flush: function(){ run(true); },
      /* a batch for the one call: kind "qh" (record_qh's items), "clicks" (record_clicks's) or "events" (record_events's) */
      send: send
    };
    document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") run(true, true); });
    window.addEventListener("pagehide", function(){ run(true, true); });
  })();

  /* ---------- resolved display name: the same deterministic dentistry-
     themed name (e.g. "Gleaming Molar") the leaderboard/nuke-analytics/
     correct-streak stats already fall back to when a visitor never opted
     into a custom name -- fetched once so the nuke banner can use it
     instead of the generic word "Someone". Always resolves well before
     NUKE_STREAK_THRESHOLD correct answers could realistically happen. ---------- */
  var resolvedAnonName = "";
  /* A name changed on a linked device (Sam, 2026-11-21: "it's still saying welcome Count Plaqula"): linked devices share
     an id, so the server's name (the bootstrap's display_name) is theirs, and a device that has a name of its own takes
     the server's when they differ. Not when this device's own rename hasn't reached the server (sh_name_unsaved: it is
     sent again) or was made after the bootstrap was asked. A device with no name of its own keeps showing the server's
     as it always has. When the server's is the random one (the bootstrap's name_custom false, migration_v94: the linked
     device went back to a random name), this device drops its copy too. Returns the name taken ("" for the random one),
     or null when this device keeps its own. */
  function nameFromServer(server, asked, custom){
    server = String(server || "").trim().slice(0, 24);
    var mine = currentName(), unsaved = null;
    if (!server || !mine || mine !== (asked || "")) return null;
    try { unsaved = localStorage.getItem(SH_NAME_UNSAVED); } catch (e) {}
    if (unsaved === mine && server !== mine) { sendName(mine); return null; }
    if (unsaved !== null) try { localStorage.removeItem(SH_NAME_UNSAVED); } catch (e) {}
    if (custom === false) { try { localStorage.removeItem(SH_NAME_KEY); } catch (e) {} return ""; }
    if (server === mine) return null;
    try { localStorage.setItem(SH_NAME_KEY, server); } catch (e) {}
    return server;
  }
  bootstrap.ready.then(function(data){
    var took = data ? nameFromServer(data.display_name, bootstrap.linkName, data.name_custom) : null;
    if (data && data.display_name) { resolvedAnonName = data.display_name; syncNameInputs(); try { document.dispatchEvent(new CustomEvent("sh:name", { detail: took !== null ? { name: took } : {} })); } catch (e) {} return; }
    /* Compatibility while the migration is being deployed; current schemas use
       the bootstrap field above and make no second eager read. */
    if (supabase) try { supabase.rpc("get_display_name", { p_visitor: VISITOR_ID }).then(function(res){
      if (res && !res.error && res.data) { resolvedAnonName = res.data; syncNameInputs(); try { document.dispatchEvent(new CustomEvent("sh:name", { detail: {} })); } catch (e) {} }
    }, function(){}); } catch (e) {}
  });
  function displayName(){ return currentName() || resolvedAnonName || "Someone"; }

  /* ---------- online-now presence ---------- */
  var presenceId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());
  var onlineCount = 1;
  var channel = supabase ? supabase.channel("presence:" + HUB, { config: { presence: { key: presenceId } } }) : null;
  if (channel) {
  channel.on("presence", { event: "sync" }, function(){
    try {
      var state = channel.presenceState();
      onlineCount = Object.keys(state).length || 1;
    } catch (e) { onlineCount = 1; }
    renderOnline();
  });
  channel.on("broadcast", { event: "egg" }, function(msg){
    document.dispatchEvent(new CustomEvent("sh:egg", { detail: (msg && msg.payload) || {} }));
  });
  channel.on("broadcast", { event: "nuke" }, function(msg){
    if (nukePref() !== "on") return;
    if (isExamDay()) return;
    var payload = (msg && msg.payload) || {};
    playNukeSequence(payload.name || "Someone");
  });
  channel.subscribe(function(status){
    if (status === "SUBSCRIBED") {
      presenceOn = true; trackPresence();
      safeRpc("record_presence_ping", { p_hub: HUB });
    }
  });
  }
  /* What this visitor's Timmy is wearing goes out with the presence, and nothing else about them: no name, no id
     (Sam, 2026-11-11: the new dashboard's classroom draws a Timmy for each person studying, dressed as theirs). Sent
     again when Timmy arrives (widget/pet.js loads late) or a setting changes what he wears. */
  var presenceOn = false, trackedFit = null;
  /* The dashboard's classroom tags your own Timmy "You", on your own screen only (Sam, 2026-11-11: "Mark your timmy").
     For that, this tab's presence key (random, new on every page load) is kept in this browser while the tab is open
     and taken out when it closes. It is never sent anywhere it didn't already go, and it is no use on another device. */
  function rememberMine(on){
    try {
      var m = null, now = Date.now(), out = {};
      try { m = JSON.parse(localStorage.getItem("sh_presence_mine") || "{}"); } catch (e) {}
      if (!m || typeof m !== "object") m = {};
      Object.keys(m).filter(function(k){ return now - m[k] < 1728e5; }).sort(function(a, b){ return m[b] - m[a]; }).slice(0, 7).forEach(function(k){ out[k] = m[k]; });
      if (on) out[HUB + "/" + presenceId] = now; else delete out[HUB + "/" + presenceId];
      localStorage.setItem("sh_presence_mine", JSON.stringify(out));
    } catch (e) {}
  }
  window.addEventListener("pagehide", function(){ if (trackedFit != null) rememberMine(false); });
  window.addEventListener("pageshow", function(e){ if (e.persisted && trackedFit != null) rememberMine(true); });
  function fitNow(){ try { return (window.shPet && window.shPet.fit && window.shPet.fit()) || ""; } catch (e) { return ""; } }
  function trackPresence(){
    if (!channel || !presenceOn || AUTOMATED) return;
    var f = fitNow(); if (f === trackedFit) return;
    trackedFit = f; rememberMine(true);
    try { channel.track({ online_at: new Date().toISOString(), fit: f }); } catch (e) {}
  }
  document.addEventListener("sh:pref", function(){ setTimeout(trackPresence, 50); });
  /* everyone has Timmy (the redesign's hubs): what he wears changed at his place, or came in with the page's bootstrap */
  document.addEventListener("sh:pet-fit", function(){ setTimeout(trackPresence, 50); });

  /* ---------- answer + mode tracking (fire-and-forget, never throws into the hub) ---------- */
  /* Automated browsers (Playwright, Puppeteer, Selenium: navigator.webdriver) don't count in the analytics: sessions that
     test or screenshot the live site made a new visitor per page and inflated people and bounce counts (LESSONS.md). */
  var AUTOMATED = (function(){ try { return !!navigator.webdriver; } catch (e) { return false; } })();
  window.shAutomated = AUTOMATED;
  /* ---------- a struggling database: a quiet spell (2026-11-18) ----------
     That afternoon the database (the Free plan's shared CPU) stopped keeping up for over an hour, and every page kept
     sending: each failed answer was tried again on its own timer, which doubled the answer calls while 9 in 10 failed,
     with the page's analytics on top. Now a call the server fails (a 5xx, or no answer at all) starts a quiet spell on
     this page: 30 s, doubling to 5 minutes while failures go on, each page a little early or late so a class doesn't
     come back at once. A saved answer ends it; otherwise it runs out. In a quiet spell answers wait in one line and go
     one at a time (answerV2 below), clicks, events and question health keep their batches for later (clicks.js,
     qhealth.js), mode opens, presence and searches are skipped, and cards don't fetch the class's numbers. Study time
     and what a student does on purpose (a name, a pin, a purchase) still go. window.shDb, for the other files. */
  var DB = { until: 0, n: 0 };
  function dbBusy(){ return !!DB && Date.now() < DB.until; }
  function dbFail(){
    DB.n = Math.min(DB.n + 1, 5);
    var ms = Math.min(300000, 30000 * Math.pow(2, DB.n - 1));
    DB.until = Date.now() + Math.round(ms * (0.75 + Math.random() * 0.5));
  }
  function dbOk(){ DB.n = 0; DB.until = 0; }
  /* a reply the server failed: an error with a 5xx status or none (the network, a timeout) */
  function dbFailed(res){ return !res || (!!res.error && (!res.status || res.status >= 500)); }
  window.shDb = { busy: dbBusy, fail: dbFail, ok: dbOk, failed: dbFailed };
  var QUIET = { record_mode_open: 1, record_presence_ping: 1, record_search: 1 };
  function safeRpc(fn, args){
    if (!supabase) return;
    if (AUTOMATED && /^record_/.test(fn)) return;
    if (QUIET[fn] && dbBusy()) return;
    try { supabase.rpc(fn, args).then(function(res){ if (dbFailed(res)) dbFail(); }, function(){ dbFail(); }); } catch (e) {}
  }

  /* ---------- visit/section time tracking (best-effort analytics for the
     admin review page only — never affects the hub itself). One ping right
     away, then every PING_INTERVAL_MS while the tab is actually visible
     (paused when backgrounded, so an idle tab doesn't inflate the numbers).
     "section" reads the universal #modeSwitch [data-mode] convention every
     hub already uses, so this needs zero per-hub changes to work. ---------- */
  var VISIT_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("visit-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  var PING_INTERVAL_MS = 25000;
  /* every hub's top-level nav uses one of two conventions: #modeSwitch
     with data-mode (most hubs), or a plain nav.tabbar/.tabbar with data-tab
     (gi-exam1). Detect once and share it with the mode-open click tracker
     below so section-tracking and mode-open-tracking can never disagree
     about which element/attribute is the source of truth. */
  var modeSwitchEl = document.getElementById("modeSwitch");
  var modeAttr = "mode";
  if (!modeSwitchEl) {
    var tabbarEl = document.querySelector("nav.tabbar, .tabbar");
    if (tabbarEl) { modeSwitchEl = tabbarEl; modeAttr = "tab"; }
  }
  /* Section = "<mode>/<sub-view>", e.g. "compendium/quiz" or
     "compendium/notes". Mode is the active #modeSwitch button, matched by
     aria-selected="true" OR an is-active/active class (hepatobiliary only
     ever set the class, so every minute there used to log as
     "(unspecified)"). Sub-view is the first *visible* active tab outside
     the mode switch that carries one of the hub nav attributes below
     (perio data-view, msk data-sub/data-group, hepatobiliary-style
     data-ctab/data-gtab/data-dtab). A hub can override all of this by
     defining window.SH_SECTION = function(){ return "mode/sub"; }. */
  var SUB_ATTRS = ["view", "sub", "ctab", "gtab", "dtab", "tab", "group", "section", "pane", "panel"];
  var SUB_SELECTOR = SUB_ATTRS.map(function(a){ return "[data-" + a + "]"; }).join(",");
  function isActiveEl(el){
    if (!el) return false;
    if (el.getAttribute("aria-selected") === "true") return true;
    var c = el.classList;
    return !!(c && (c.contains("is-active") || c.contains("active")));
  }
  function isVisible(el){
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }
  function subAttrValue(el){
    for (var i = 0; i < SUB_ATTRS.length; i++) {
      var v = el.getAttribute("data-" + SUB_ATTRS[i]);
      if (v) return v;
    }
    return "";
  }
  function currentMode(){
    if (!modeSwitchEl) return "";
    var btns = modeSwitchEl.querySelectorAll("[data-" + modeAttr + "]");
    for (var i = 0; i < btns.length; i++) {
      if (isActiveEl(btns[i])) return btns[i].getAttribute("data-" + modeAttr) || "";
    }
    return "";
  }
  function currentSubView(){
    var els = document.querySelectorAll(SUB_SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (modeSwitchEl && modeSwitchEl.contains(el)) continue;
      if (!isActiveEl(el) || !isVisible(el)) continue;
      var v = subAttrValue(el);
      if (v) return v;
    }
    return "";
  }
  function currentSection(){
    try {
      if (window.shPodcast && window.shPodcast.playing()) return "podcast/" + window.shPodcast.id();
      if (typeof window.SH_SECTION === "function") {
        var custom = window.SH_SECTION();
        if (custom) return String(custom).slice(0, 80);
      }
      var mode = currentMode();
      var sub = currentSubView();
      if (!mode) return sub;
      return sub && sub !== mode ? (mode + "/" + sub).slice(0, 80) : mode;
    } catch (e) { return ""; }
  }
  window.shCurrentSection = currentSection;

  /* Each activity ping is worth PING_INTERVAL_MS of study time, so instead
     of sampling "whatever section happens to be open at the 25s mark" (which
     credited a whole 25s to the wrong section whenever someone switched
     between pings), time is accumulated per section every second and a ping
     is sent for a section only once it has actually banked a full 25s. The
     first ping still goes out on load (so a short visit is still counted as
     a visit) and is pre-credited against the starting section. Paused while
     the tab is hidden, unless narration or Timmy Time is playing (below); on
     a pause, a section holding at least half a ping's worth is rounded up so
     short stints aren't systematically dropped. */
  var TICK_MS = 1000;
  /* Idle rule: after 15 minutes with no input (tap, click, key, scroll) time stops counting until
     the next input, unless a lecture is playing in Listen or a Timmy Time episode is playing. A visible tab left open on a desk
     used to count as study time for as long as it sat there. */
  var IDLE_MS = 15 * 60 * 1000;
  var lastInput = Date.now();
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll", "mousemove"].forEach(function(ev){
    window.addEventListener(ev, function(){ lastInput = Date.now(); }, { passive: true, capture: true });
  });
  function isIdle(now){
    if (now - lastInput < IDLE_MS) return false;
    try { if (window.shTTS && window.shTTS.listening && window.shTTS.listening()) { lastInput = now; return false; } } catch (e) {}
    try { if (window.shPodcast && window.shPodcast.playing()) { lastInput = now; return false; } } catch (e) {}
    return true;
  }
  var sectionBank = {};
  var tickTimer = null;
  var lastTick = 0;
  /* The pings go out together (2026-11-19, the database optimization pass): each is still 25 s of one section, counted
     as before, but a page holds them and sends what it has once a minute in one call (record_activity_pings,
     migration_v77), each with how long ago it was counted, so the server saves it at that time. One call every 25 s
     was 18% of every request the class made. A visit's first ping goes at once (a short visit still counts, and the
     admin page's "studying now" sees it), and so does whatever is held when the page is hidden or closed. A database
     without the new call (or a page that can't tell) gets one call a ping, as before. */
  var PING_SEND_MS = 60000, pingHeld = [], pingTimer = null, pingsTogether = true;
  function pingOne(section){
    safeRpc("record_activity_ping", { p_visitor: VISITOR_ID, p_visit: VISIT_ID, p_hub: HUB, p_section: section });
  }
  /* leaving: true when the page is being hidden or closed, when a call may not outlive the page: it goes with
     keepalive, which the browser finishes after the page is gone */
  function sendPings(leaving){
    if (pingTimer) { clearTimeout(pingTimer); pingTimer = null; }
    if (!pingHeld.length) return;
    var now = Date.now(), held = pingHeld.splice(0, pingHeld.length);
    if (!supabase || AUTOMATED) return;
    if (!pingsTogether) { held.forEach(function(p){ pingOne(p.s); }); return; }
    for (var i = 0; i < held.length; i += 12) (function(part){   /* 12 a call: the server takes no more */
      var args = { p_visitor: VISITOR_ID, p_visit: VISIT_ID, p_hub: HUB,
        p_items: part.map(function(p){ return { s: p.s, a: Math.max(0, Math.min(300, Math.round((now - p.t) / 1000))) }; }) };
      try {
        if (leaving && window.fetch) {
          fetch(SB_URL + "/rest/v1/rpc/record_activity_pings", { method: "POST", keepalive: true, body: JSON.stringify(args),
            headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" } }).catch(function(){});
          return;
        }
        supabase.rpc("record_activity_pings", args).then(function(res){
          if (rpcMissing(res)) { pingsTogether = false; part.forEach(function(p){ pingOne(p.s); }); }
          else if (dbFailed(res)) dbFail();
        }, function(){ dbFail(); });
      } catch (e) {}
    })(held.slice(i, i + 12));
  }
  function pingActivity(section, now){
    if (!pingsTogether) { pingOne(section); return; }
    pingHeld.push({ s: section, t: Date.now() });
    if (now) sendPings();
    else if (!pingTimer) pingTimer = setTimeout(sendPings, PING_SEND_MS);
  }
  /* Listening with the screen off (Sam, 2026-11-18: "add that study time tracking"): a lecture's narration or a Timmy
     Time episode that keeps playing while the tab is hidden or the phone is locked counts as study time, for as long as
     it plays. Hidden, the time comes from the audio's own clock (how far it played, at its speed), not from the timer:
     a hidden or locked page's timers run late or not at all, so a tick that comes minutes late still credits what was
     heard, and nothing more. Nothing playing, the timer stops; something starting again from the lock screen or the
     headphones ("sh:audio-play", sent by both players) starts it again. The device's voice has no clock to read, so
     it counts the way a visible tab does, while it speaks. */
  var bg = false, bgEl = null, bgT = 0;
  function playingAudio(){
    var a = null;
    try { a = window.shTTS && window.shTTS.audio && window.shTTS.audio(); } catch (e) { a = null; }
    if (a && !a.paused && !a.ended) return a;
    try { a = window.shPodcast && window.shPodcast.audio && window.shPodcast.audio(); } catch (e) { a = null; }
    return a && !a.paused && !a.ended ? a : null;
  }
  function listeningNow(){
    try { if (window.shTTS && window.shTTS.listening && window.shTTS.listening()) return true; } catch (e) {}
    try { if (window.shPodcast && window.shPodcast.playing && window.shPodcast.playing()) return true; } catch (e) {}
    return false;
  }
  function follow(){ bgEl = playingAudio(); bgT = bgEl ? (bgEl.currentTime || 0) : 0; }
  /* ms heard since the last look, by the clock of the audio followed then (even if it has since ended or paused) */
  function heardMs(){
    var ms = 0;
    if (bgEl) { var t = bgEl.currentTime || 0; if (t > bgT) ms = (t - bgT) / (bgEl.playbackRate || 1) * 1000; }
    follow();
    return ms;
  }
  function credit(dt){
    var sec = currentSection();
    sectionBank[sec] = (sectionBank[sec] || 0) + dt;
    while (sectionBank[sec] >= PING_INTERVAL_MS) {
      sectionBank[sec] -= PING_INTERVAL_MS;
      pingActivity(sec);
    }
  }
  function tick(){
    var now = Date.now(), raw = now - lastTick;
    lastTick = now;
    if (bg) {
      var ms = heardMs();
      if (!bgEl && !ms && listeningNow()) ms = 5 * TICK_MS;   /* the device's voice */
      if (ms > 0) credit(Math.min(raw, ms));
      if (!bgEl && !listeningNow()) pauseBackground();
      return;
    }
    if (isIdle(now)) return;
    credit(Math.min(raw, 5 * TICK_MS)); /* cap so a frozen/sleeping tab can't dump minutes into one section */
  }
  function flushBank(){
    Object.keys(sectionBank).forEach(function(sec){
      if (sectionBank[sec] >= PING_INTERVAL_MS / 2) pingActivity(sec);
      sectionBank[sec] = 0;
    });
    sendPings(true);   /* the page is being hidden or closed: whatever is held goes now */
  }
  var firstPingSent = false;
  function startActivityPing(){
    if (tickTimer) return;
    if (!firstPingSent) {
      firstPingSent = true;
      var startSec = currentSection();
      pingActivity(startSec, true);
      sectionBank[startSec] = -PING_INTERVAL_MS;
    }
    lastTick = Date.now();
    tickTimer = setInterval(tick, TICK_MS);
  }
  function stopActivityPing(){
    if (!tickTimer) return;
    tick();
    clearInterval(tickTimer); tickTimer = null;
    flushBank();
  }
  function pauseBackground(){
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    flushBank();
  }
  /* start a moment after load so the hub's own scripts have rendered their
     initial tabs -- otherwise the first (pre-credited) ping is labeled with
     the bare mode ("compendium") and the real sub-view double-counts. */
  var trackingArmed = false;
  setTimeout(function(){
    trackingArmed = true;
    if (document.visibilityState !== "hidden") startActivityPing();
  }, 1500);
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "hidden") {
      if (!trackingArmed || bg) return;
      if (tickTimer) tick();   /* the last of the visible time */
      bg = true; follow();
      if (!bgEl && !listeningNow()) pauseBackground();
      else if (!tickTimer) startActivityPing();
    } else if (trackingArmed) {
      if (bg && tickTimer) tick();   /* what was heard while hidden, before the visible rules take over */
      bg = false; bgEl = null;
      startActivityPing();
    }
  });
  document.addEventListener("sh:audio-play", function(){
    if (bg && !tickTimer) { follow(); startActivityPing(); }
  });
  window.addEventListener("pagehide", stopActivityPing);

  /* an answer, recorded the way every live hub does it: the class's stats, the class's picks, your answers, your run */
  function answerToday(d, isCorrect){
    /* Learn's typed answer is yours only: never the class's stats or picks (migration_v102 does the same on the server) */
    if (d.ctx !== "typed") {
      safeRpc("record_answer", { p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
      /* which option was picked (its authored index, 0 = the key), for the admin page's
         "most popular wrong answer"; hubs send it for bank and mock-exam MCQs */
      if (typeof d.choice === "number") safeRpc("record_choice", { p_hub: HUB, p_qid: String(d.qid || ""), p_choice: d.choice });
      /* select-all questions: every option ticked (authored indexes), one row per option in question_choices */
      else if (Array.isArray(d.picks) && d.picks.length) safeRpc("record_choices", { p_hub: HUB, p_qid: String(d.qid || ""), p_choices: d.picks });
    }
    safeRpc("record_personal_answer", { p_visitor: VISITOR_ID, p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
    safeRpc("record_correct_streak", { p_visitor: VISITOR_ID, p_correct: isCorrect });
  }
  /* the game layer's answer (record_answer_v2): one call that records all of the above, grades the answer from the
     server's key and pays it. The page sends what was picked (a choice, the ticked choices, the order as placed, or
     the student's own grade), the question's version, where it was answered and a random id, so a retried call
     records and pays once. What comes back goes out as sh:answer-paid for the engine (widget/hub-rewards.js): the XP
     paid, the day's bonuses, a new medal and its double XP, the total. The answer goes by the old calls only when the
     server can't grade what was sent (a one-choice question with no pick index: an older arcade game). Automated browsers record nothing, as today. */
  var gamePending = {}, sessionInfo = {}, lineSeq = 0;
  function gameId(){
    var a = new Uint8Array(16), out = "", abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < 16; j++) out += abc[a[j] & 63];
    return out;
  }
  function answerV2(d, isCorrect){
    if (!supabase || AUTOMATED) return;
    var qid = String(d.qid || ""), order = Array.isArray(d.order) ? d.order : null;
    var args = {
      p_visitor: VISITOR_ID, p_hub: HUB, p_qid: qid,
      p_choice: typeof d.choice === "number" ? d.choice : null,
      p_picks: order || (Array.isArray(d.picks) && d.picks.length ? d.picks : null),
      p_self: d.self ? isCorrect : null,
      p_v: (window.shQH && window.shQH.version && window.shQH.version(qid)) || null,
      p_ctx: d.ctx || null, p_request: gameId(), p_session: d.session || null, p_claim: isCorrect
    };
    var slim = { qid: qid, ctx: d.ctx || "", choice: args.p_choice, picks: Array.isArray(d.picks) && d.picks.length ? d.picks : null };
    /* a mock's or a game's answers hold up its results, so they go at once and try twice, soon; its session is finished
       only once they have all arrived (finishSession). One that fails all three (a busy minute) joins the line below like
       any other answer, with its session (2026-11-19: until then it was lost, and with it the mock's score, its +50 and
       the answers' XP), and the session's finish waits behind it in the line (sessionHold) */
    if (d.session) {
      slim.session = d.session;
      var tries = 0, waits = [4000, 10000], job = { args: args, d: slim, c: isCorrect, at: Date.now(), seq: ++lineSeq, tries: 0, n: 0 };
      var go = function(){
        return sendAnswer(job).then(function(again){
          if (!again) return;
          job.n++;
          if (tries >= waits.length) { lineAdd(job); return; }
          var ms = Math.round(waits[tries++] * (0.75 + Math.random() * 0.5));
          return new Promise(function(ok){ setTimeout(ok, ms); }).then(go);
        });
      };
      (gamePending[d.session] = gamePending[d.session] || []).push(go());
      return;
    }
    /* every other answer joins the line (below) */
    answerLine.push({ args: args, d: slim, c: isCorrect, at: Date.now(), tries: 0, n: 0 });
    lineNext();
  }
  /* a mock's or a game's answer out of its quick tries: into the line in the order it was answered (not ahead of the one
     being sent) */
  function lineAdd(job){
    var i = answerLine.length, min = lineSent && answerLine[0] === lineSent ? 1 : 0;
    while (i > min && (answerLine[i - 1].at > job.at || (answerLine[i - 1].at === job.at && (answerLine[i - 1].seq | 0) > job.seq))) i--;
    answerLine.splice(i, 0, job);
    lineNext();
  }
  /* what came back for an answer goes out as sh:answer-paid for the engine */
  function answerPaid(job, r){
    if (r.boost !== undefined) GAME.boost = r.boost || null;
    if (!r.repeat) setCrowns(r.crowns);   /* the balance after this answer (migration_v68) */
    rlPaid(job.d, r);
    try { document.dispatchEvent(new CustomEvent("sh:answer-paid", { detail: { qid: String(job.d.qid || ""), ctx: job.d.ctx || "", session: job.d.session || null, res: r } })); } catch (e) {}
  }
  /* one try of an answer ({ args, d, c }); true when the server failed it and it should go again (the same id, which
     can't record or pay twice). A session's held finish ({ f: 1, ... }, sessionHold below) goes through here too. */
  function sendAnswer(job){
    if (job.f) return sendFinish(job);
    var call;
    try { call = supabase.rpc("record_answer_v2", job.args); } catch (e) { return Promise.resolve(false); }
    return call.then(function(res){
      if (res && res.error) {
        if (dbFailed(res)) { dbFail(); return true; }
        return false;
      }
      dbOk();
      var r = res && res.data;
      if (!r || typeof r !== "object") return false;
      if (r.ok === false) { if (r.error === "bad") answerToday(job.d, job.c); return false; }
      GAME.on = true;
      answerPaid(job, r);
      return false;
    }, function(){ dbFail(); return true; });
  }
  /* the answers waiting to be saved, oldest first, one at a time. A failed one stays at the front and goes again when
     the quiet spell ends (safeRpc's note: 30 s, doubling to 5 minutes), up to 8 tries (about 20 minutes); the answers
     behind it wait their turn, so a struggling database gets one call at a time from this page, not one per answer.
     (Until 2026-11-18 each answer retried on its own timer, four times in three minutes.)
     A backlog goes out spaced as it was answered, up to 2.1 s apart: the server stamps an answer when it arrives, and a
     miss within 2 s of the answer before it pays nothing and doesn't count toward a run of right answers in a row
     (sh_answer's speed limit). Answered 2 s apart or more, as nearly every answer is, it goes at once. */
  /* lineSent: the answer on its way to the server; lineLast: the last try's { at: when it was answered, done: when it came back } */
  var answerLine = [], lineOn = false, lineSent = null, lineLast = null;
  function lineNext(){
    if (lineOn) return;
    while (answerLine.length && lineTaken(answerLine[0])) answerLine.shift();
    if (!answerLine.length) return;
    lineOn = true;
    var job = answerLine[0], wait = DB.until - Date.now();
    /* a held finish whose session still has an answer kept on the device (out of this page's tries): kept with it, so
       the next page sends the answer first and then the finish */
    if (job.f && sessionKept(job.args.p_session)) { answerLine.shift(); job.n++; keepPark(job); lineNext(); return; }
    if (lineLast) wait = Math.max(wait, Math.min(2100, job.at >= lineLast.at ? job.at - lineLast.at : 2100) - (Date.now() - lineLast.done));
    if (wait > 0) { setTimeout(function(){ lineOn = false; lineNext(); }, wait + 50); return; }
    lineSent = job;
    sendAnswer(job).then(function(again){
      lineSent = null; lineLast = { at: job.at, done: Date.now() };
      if (again) job.n++;
      if (again && ++job.tries < 8 && !job.gone) { /* it stays at the front */ }
      else {
        answerLine.shift();
        if (again && !job.gone) keepPark(job);    /* out of tries: kept on the device for the next page (below) */
        else if (job.kept) keepDrop(job);          /* saved while kept: no page needs to send it again */
      }
      lineOn = false; lineNext();
    }, function(){ lineSent = null; answerLine.shift(); lineOn = false; lineNext(); });
  }
  /* ---------- answers kept on the device (2026-11-19; vault/tasks/2026-11-18-database-load.md) ----------
     The line lives in the page, so until now an answer still waiting in it was lost when the tab closed. Now, when the
     page is hidden (a tab or app switched away from, the screen locked, the tab closed: the last moment a page can count
     on), the answers still waiting are written to the device (sh_answers_kept:<hub>), and when it shows again it takes
     back the ones still there. A page of the same hub that opens meanwhile, or later, takes them all: it sends them in
     its own line, oldest first, with the same request ids, so an answer that did reach the server (the reply lost as the
     tab closed) records and pays nothing new. A page that finds its answers taken drops them: the other page sends them.
     Two pages can still send one now and then (a race of milliseconds), which the request id makes harmless. An answer
     out of its 8 tries is kept the same way, for the next page. Kept answers wait 3 days at most and get 24 tries in all;
     the server stamps each when it arrives (that day's goal, streak and medals; it pays as it would have). A mock's or a
     game's answer joins the line once its three quick tries fail, and is kept like the rest; its session's finish then
     waits behind it in the line, and is kept with it (sessionHold): the next page sends the answers, then the finish (the
     server takes a session's answers and its finish for 6 hours after it started). Nothing is kept on a page off the
     game layer. */
  var KEEP_KEY = "sh_answers_kept:" + HUB, KEEP_MS = 3 * 864e5, KEEP_TRIES = 24, KEEP_MAX = 300;
  function keepOn(){ return !!supabase && !AUTOMATED && !!HUB; }
  function keepRead(){
    var a = null;
    try { a = JSON.parse(localStorage.getItem(KEEP_KEY) || "null"); } catch (e) {}
    var cut = Date.now() - KEEP_MS;
    return (Array.isArray(a) ? a : []).filter(function(e){
      return e && e.a && typeof e.a === "object" && typeof e.a.p_request === "string" && e.d && typeof e.at === "number" && e.at > cut && (e.n | 0) < KEEP_TRIES;
    });
  }
  function keepWrite(list){
    try {
      if (!list.length) localStorage.removeItem(KEEP_KEY);
      else localStorage.setItem(KEEP_KEY, JSON.stringify(list.slice(-KEEP_MAX)));
      return true;
    } catch (e) { return false; }
  }
  function keepEntry(job){ var e = { a: job.args, d: job.d, c: !!job.c, at: job.at, n: job.n | 0 }; if (job.f) e.f = 1; return e; }
  function keepIn(list, job){ return list.some(function(e){ return e.a.p_request === job.args.p_request; }); }
  function keepOut(list, job){ return list.filter(function(e){ return e.a.p_request !== job.args.p_request; }); }
  /* kept while this page was hidden, and taken since by another page of this hub (it sends it) */
  function lineTaken(job){
    if (!job.gone && job.kept && !keepIn(keepRead(), job)) job.gone = true;
    return !!job.gone;
  }
  function keepDrop(job){ job.kept = false; var list = keepRead(); if (keepIn(list, job)) keepWrite(keepOut(list, job)); }
  /* out of this page's tries: onto the device for the next page, or off it for good after 24 in all */
  function keepPark(job){
    if (!keepOn()) return;
    var list = keepOut(keepRead(), job);
    if (job.n < KEEP_TRIES) list.push(keepEntry(job));
    keepWrite(list.sort(function(x, y){ return x.at - y.at; }));
    job.kept = false;
  }
  /* the page goes out of sight: the answers still waiting, onto the device */
  function keepLine(){
    if (!keepOn()) return;
    var jobs = answerLine.filter(function(j){ return !j.gone; });
    if (!jobs.length) return;
    var list = keptOthers(keepRead(), jobs).concat(jobs.map(keepEntry)).sort(function(x, y){ return x.at - y.at; });
    if (keepWrite(list)) jobs.forEach(function(j){ j.kept = true; });
  }
  function keptOthers(list, jobs){ return list.filter(function(e){ return !jobs.some(function(j){ return j.args.p_request === e.a.p_request; }); }); }
  /* the page is in sight (it opened, or it shows again): its own kept answers back from the device, and every other kept
     answer of this hub into its line */
  function keepClaim(){
    if (!keepOn() || document.visibilityState === "hidden") return;
    var list = keepRead(), mine = {}, add = [];
    answerLine.forEach(function(j){ mine[j.args.p_request] = j; });
    list.forEach(function(e){
      var j = mine[e.a.p_request];
      if (j) { j.kept = false; return; }
      e.a.p_visitor = VISITOR_ID;   /* the device's id now (a linked device takes the id it was linked to) */
      var j2 = { args: e.a, d: e.d, c: !!e.c, at: e.at, tries: 0, n: e.n | 0 }; if (e.f) j2.f = 1;
      add.push(j2);
    });
    answerLine.forEach(function(j){ if (j.kept) { j.kept = false; j.gone = true; } });
    if (!list.length && !add.length) return;
    keepWrite([]);
    if (add.length) {
      /* older than anything answered on this page: they go first, after the one being sent */
      answerLine.splice.apply(answerLine, [lineSent && answerLine[0] === lineSent ? 1 : 0, 0].concat(add.sort(function(x, y){ return x.at - y.at; })));
    }
    lineNext();
  }
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") keepLine(); else keepClaim(); });
  window.addEventListener("pagehide", keepLine);
  window.addEventListener("pageshow", function(e){ if (e && e.persisted) keepClaim(); });
  /* a new page: once its bootstrap has answered (or not), it sends what an earlier page kept */
  if (supabase && !AUTOMATED && HUB) bootstrap.ready.then(function(){ setTimeout(keepClaim, 2500); }, function(){ setTimeout(keepClaim, 2500); });
  /* the bowling egg's secret trophy: widget/bowling.js keeps it on the device that saw all eight clips (sh_bowl_trophy);
     the server takes the kind since migration_v63, so it is sent once, when it is won or at the next page load (the
     trophy then pays its 25 crowns and counts in the class's share). sh_bowl_trophy_sent marks it sent. */
  function sendBowlTrophy(){
    try { if (!supabase || !localStorage.getItem("sh_bowl_trophy") || localStorage.getItem("sh_bowl_trophy_sent")) return; } catch (e) { return; }
    try {
      supabase.rpc("record_achievement", { p_visitor: VISITOR_ID, p_kind: "bowling", p_hub: HUB || "" }).then(function(res){
        if (res && !res.error) try { localStorage.setItem("sh_bowl_trophy_sent", "1"); if (res.data === true) document.dispatchEvent(new CustomEvent("sh:trophy-sent")); } catch (e) {}
      }, function(){});
    } catch (e) {}
  }
  document.addEventListener("sh:bowl-trophy", sendBowlTrophy);
  setTimeout(sendBowlTrophy, 5000);
  /* ---------- prizes (migration_v68, vault/reference/game-server.md) ----------
     What each prize pays in XP, with as many Shiny Gold Crowns (study XP pays 5 crowns per 10). The server's sh_prizes()
     says the same and tools/release/xp.js checks the two match. ring is per question of the daily goal; streak and row
     are [reached, pays]; medal is Bronze to Crown. The cards that offer a prize read it from here (window.shGame.prizes). */
  var PRIZES = { name: 500, ring: 5, boss: 500, nuke: 10000, alltime: 20000, notes: 50, trophy: 200, visit: 50, game: 100, pb: 50, top: 250, report: 100, collection: 1000, dark: 5000, modupro: 20000, loupes: 30000, fairy: 250, goldfairy: 500, probe: 300, perfect: 750, misses: 100, idea: 500, back: 200, week: 500, streak: [[3, 100], [7, 300], [14, 700], [30, 1500], [60, 3000], [100, 5000]], row: [[10, 25], [25, 100], [50, 250]], medal: [250, 500, 750, 1000] };
  function fmtN(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  /* what a prize is called ("Daily goal done"), for the engine's reward card (widget/hub-rewards.js), and what it says
     when it's paid: "Daily goal done: +100 XP and 100 crowns" */
  function prizeName(src, d){
    d = d || {};
    var won = Array.isArray(d.won) ? d.won.length : 0;
    return { name: "Your leaderboard name", ring: "Daily goal done", boss: "Your share of the Plaque Boss", nuke: "Tactical nuke launched",
      alltime: "New all-time record, " + (d.n || "") + " right in a row", notes: "Notes read to the end", trophy: won > 1 ? won + " new trophies" : "New trophy",
      visit: "Visiting a classmate's Timmy", game: "First game today", pb: "New personal best", top: "Top score in this hub", report: "Report fixed",
      row: (d.n || "") + " right in a row", streak: (d.n || "") + " days in a row", medal: "Hub medal", "pod-done": "Timmy Time finished",
      collection: won > 1 ? won + " collections finished" : "Collection finished",
      fairy: "First Tooth Fairy caught", goldfairy: "First Golden Tooth Fairy caught", probe: "Today's Golden Probe", perfect: "A perfect mock",
      misses: "Yesterday's misses, all right", idea: "Your idea shipped", back: "Welcome back", week: "This week's pennant",
      eve: "The class beat the Midnight Plaque" + (d.n ? ": your " + d.n + (d.n === 1 ? " hit" : " hits") : "") }[src] || "Bonus";
  }
  function prizeText(src, xp, d){
    return prizeName(src, d) + ": +" + fmtN(xp) + " XP and " + fmtN(xp) + (xp === 1 ? " crown" : " crowns");
  }
  /* the crowns: every reply that pays carries the balance after it (migration_v68), which goes out as sh:crowns for
     whatever shows it (Home's Today card, More's shop tile, the shop) */
  var CROWNS = null;
  function setCrowns(n){
    if (typeof n !== "number" || !isFinite(n)) return;
    var was = CROWNS; CROWNS = n;
    try { document.dispatchEvent(new CustomEvent("sh:crowns", { detail: { balance: n, was: was } })); } catch (e) {}
  }
  /* a prize paid: sh:prize { src, xp, text, res } for the engine to add to the day and say (widget/hub-rewards.js) */
  function prizeWon(src, xp, d){
    if (!(xp > 0)) return;
    try { document.dispatchEvent(new CustomEvent("sh:prize", { detail: { src: src, xp: xp, text: prizeText(src, xp, d), res: d || null } })); } catch (e) {}
  }
  /* one prize call (claim_ring_v2, claim_boss_v2, notes_done_v2, launch_nuke_v2, ...): what it paid goes out as sh:prize
     (after `delay` ms, for the nuke's countdown), the balance as sh:crowns. Answers { missing: true } when the database
     doesn't have the function yet, so a caller can do what it did before; null when it couldn't be asked. */
  function claimPrize(fn, args, src, delay){
    if (!supabase || AUTOMATED) return Promise.resolve(null);
    var call; try { call = supabase.rpc(fn, args); } catch (e) { return Promise.resolve(null); }
    return call.then(function(res){
      if (rpcMissing(res)) return { missing: true };
      var r = res && !res.error && res.data !== undefined ? res.data : null;
      if (!r || typeof r !== "object" || r.ok === false) return r;
      setCrowns(r.crowns);
      if (r.xp > 0) { if (delay) setTimeout(function(){ prizeWon(src || r.src, r.xp, r); }, delay); else prizeWon(src || r.src, r.xp, r); }
      return r;
    }, function(){ return null; });
  }
  /* for the engine: is the game layer there, the running boost, and a mock's session (the server pays a mock's
     answers and its +50 only inside one, and saves the mock's score itself when it is finished) */
  window.shGame = {
    prizes: PRIZES, prizeText: prizeText, prizeName: prizeName, claim: claimPrize, setCrowns: setCrowns, crowns: function(){ return CROWNS; },
    /* whether to offer prizes on the page: always, since every page is on the game layer (before the bootstrap answers,
       v2() is still false; a card drawn then still says what it pays) */
    live: function(){ return true; },
    /* a plain rpc that answers a value (notes_start_v2's read id), or null */
    ask: function(fn, args){
      if (!supabase || AUTOMATED) return Promise.resolve(null);
      try { return supabase.rpc(fn, args).then(function(res){ return res && !res.error ? res.data : null; }, function(){ return null; }); } catch (e) { return Promise.resolve(null); }
    },
    want: true,
    v2: function(){ return GAME.on === true; },
    boost: function(){ var b = GAME.boost; return b && b.until && new Date(b.until).getTime() > Date.now() ? b : null; },
    setBoost: function(b){ GAME.boost = b || null; },
    startSession: function(kind, game){
      if (!supabase || AUTOMATED) return Promise.resolve(null);
      try {
        return supabase.rpc("xp_session_start", { p_visitor: VISITOR_ID, p_hub: HUB, p_kind: kind, p_game: game || null }).then(function(res){
          var id = res && !res.error && typeof res.data === "string" ? res.data : null;
          if (id) sessionInfo[id] = { kind: kind, game: game || null };
          return id;
        }, function(){ return null; });
      } catch (e) { return Promise.resolve(null); }
    },
    finishSession: function(id, score, total){
      if (!supabase || AUTOMATED || !id) return Promise.resolve(null);
      var wait = gamePending[id] || []; delete gamePending[id];
      var info = sessionInfo[id] || {};
      var args = { p_visitor: VISITOR_ID, p_session: id, p_score: score == null ? null : score, p_total: total == null ? null : total };
      return Promise.all(wait).then(function(){
        /* an answer of this session still in the line (a busy minute): the finish waits behind it ({ held: true } now,
           sh:session-paid and the prizes when it's paid, on this page or the next) */
        if (sessionWaiting(id)) { sessionHold(args, info); return { ok: true, held: true }; }
        return supabase.rpc("xp_session_finish", args).then(function(res){
          var r = res && !res.error && res.data && typeof res.data === "object" ? res.data : null;
          finishPaid(id, info, r);
          return r;
        });
      }).then(null, function(){ return null; });
    }
  };
  /* what a finished session paid: sh:session-paid for the engine's card (kind: "mock" or "arcade", for a finish sent by
     a later page, which doesn't know the game), and a game's prizes (migration_v68): the day's first game, a personal
     best, the hub's top score */
  function finishPaid(id, info, r){
    if (!r || !r.ok) return;
    try { document.dispatchEvent(new CustomEvent("sh:session-paid", { detail: { session: id, kind: info.kind || "mock", game: info.game || null, res: r } })); } catch (e) {}
    setCrowns(r.crowns); prizeWon("game", r.game, r); prizeWon("pb", r.pb, r); prizeWon("top", r.top, r); prizeWon("perfect", r.perfect, r);
  }
  /* ---------- a session's finish held behind its answers (2026-11-19) ----------
     The server counts a mock's answers when it is finished (its score, and its +50 from 10 answers), so a finish must
     never reach it before an answer still waiting. It goes in the line, behind them, as one more job ({ f: 1 }), and is
     kept on the device with them when the page is hidden or they run out of tries (keepPark). */
  function sessionWaiting(id){
    return answerLine.some(function(j){ return !j.f && !j.gone && j.args.p_session === id; }) || sessionKept(id);
  }
  function sessionKept(id){ return keepRead().some(function(e){ return !e.f && e.a.p_session === id; }); }
  function sessionHold(args, info){
    var a = {}, k; for (k in args) a[k] = args[k];
    a.p_request = gameId();   /* the job's own id, for the device's list; not sent */
    answerLine.push({ f: 1, args: a, d: { session: a.p_session, kind: info.kind || "mock", game: info.game || null }, c: false, at: Date.now(), tries: 0, n: 0 });
    lineNext();
  }
  function sendFinish(job){
    var a = job.args, call;
    try { call = supabase.rpc("xp_session_finish", { p_visitor: a.p_visitor, p_session: a.p_session, p_score: a.p_score, p_total: a.p_total }); } catch (e) { return Promise.resolve(false); }
    return call.then(function(res){
      if (res && res.error) { if (dbFailed(res)) { dbFail(); return true; } return false; }
      dbOk();
      var r = res && res.data && typeof res.data === "object" ? res.data : null;
      finishPaid(a.p_session, job.d || {}, r);
      return false;
    }, function(){ dbFail(); return true; });
  }

  var sessionCorrectStreak = 0;
  var nukeReady = false;
  document.addEventListener(ANSWERED_EVENT, function(e){
    var d = (e && e.detail) || {};
    var isCorrect = !!d.correct;
    srsRecord(String(d.qid || ""), isCorrect);
    answerV2(d, isCorrect);
    var prevStreak = sessionCorrectStreak;
    if (isCorrect) {
      sessionCorrectStreak++;
      if (sessionCorrectStreak > 0 && sessionCorrectStreak % 5 === 0 && extraOn("sh_pref_cheers")) {
        fireConfetti();
        showStreakToast(shGreet(sessionCorrectStreak + " in a row") + "!", ICON_FLAME, { kind: "streak", ms: 3200 });
      }
      if (sessionCorrectStreak >= NUKE_STREAK_THRESHOLD && !nukeReady && nukePref() !== "off") {
        nukeReady = true;
        safeRpc("record_nuke_unlock", { p_hub: HUB, p_visitor: VISITOR_ID });
        showNukeBadge();
        showStreakToast(shGreet("Tactical nuke ready"), '<span class="sh-nuke-icon sh-nuke-icon-sm"></span>', { kind: "nuke", title: "100 right in a row" });
      }
    } else {
      sessionCorrectStreak = 0;
    }
    /* the streak flame (widget/fx.js) follows this same in-page run */
    try { document.dispatchEvent(new CustomEvent("sh:streak", { detail: { n: sessionCorrectStreak, prev: prevStreak } })); } catch (e) {}
  });
  /* ---------- progress sync across devices (migration_v34) ----------
     Every answer is saved per person in personal_answers (above), and "Link my devices" moves a device's rows
     onto the linked id, so the server holds the whole history. The page bootstrap carries the first
     history read; later returns from the background use get_my_answers and
       1. hands each question's totals to the hub's window.SH_SYNC.merge(byQid, days) to fold into its own
          saved progress (the hub keeps whichever copy has more tries, so nothing local is lost), and
       2. replays the history into spaced review (sh_srs_<hub>), so the Daily Drill sees misses from every device.
     byQid = { qid: { n: tries, c: right, last: latest try right?, t: latest try (ms) } }; days = local dates. */
  var syncAnsweredNow = {}, lastSync = 0, syncBusy = false, bootstrapSyncPending = true;
  /* the server history as of the last sync, for question health (widget/qhealth.js): {qid: {n, c, last, t}}; null until a
     sync has come back, so a try is never called a first try just because the history hadn't arrived */
  var qhHist = null;
  document.addEventListener(ANSWERED_EVENT, function(e){ var q = e && e.detail && e.detail.qid; if (q && syncBusy) syncAnsweredNow[String(q)] = 1; });
  function localDay(ms){ var d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function addDays(day, n){ var p = day.split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2] + n); return localDay(d.getTime()); }
  function applySync(rows){
    var byQid = {}, hist = {}, daySet = {};
    rows.forEach(function(r){
      if (!Array.isArray(r) || r.length < 3) return;
      var q = String(r[0]), ms = Number(r[1]) * 1000, ok = r[2] === 1 || r[2] === true;
      if (!q || !isFinite(ms)) return;
      var s = byQid[q] || (byQid[q] = { n: 0, c: 0, last: null, t: 0 });
      s.n++; if (ok) s.c++; s.last = ok; s.t = ms;
      (hist[q] || (hist[q] = [])).push([localDay(ms), ok]);
      daySet[localDay(ms)] = 1;
    });
    qhHist = {}; Object.keys(byQid).forEach(function(q){ qhHist[q] = byQid[q]; });
    /* spaced review: same rules as srsRecord, replayed over the full history */
    try {
      var all = srsLoad(), eve = srsExamEve(), changed = false, known = null;
      if (window.SH_EXPORT && Array.isArray(window.SH_EXPORT.questions)) { known = {}; window.SH_EXPORT.questions.forEach(function(x){ if (x && x.id) known[x.id] = 1; }); }
      Object.keys(hist).forEach(function(q){
        if (syncAnsweredNow[q] || (known && !known[q])) return;
        var r = { b: 0 };
        hist[q].forEach(function(h){
          if (h[1]) { if (r.t === h[0] && r.b) return; r.b = Math.min(r.b + 1, SRS_STEPS.length); } else r.b = 0;
          r.t = h[0];
        });
        var cur = all[q];
        if (cur && cur.t && cur.t > r.t) return;
        r.due = addDays(r.t, r.b ? SRS_STEPS[r.b - 1] : 1);
        if (eve && r.due > eve && r.due > srsDay(0)) r.due = eve < srsDay(0) ? srsDay(0) : eve;
        if (!cur || cur.b !== r.b || cur.due !== r.due || cur.t !== r.t) { all[q] = r; changed = true; }
      });
      if (changed) localStorage.setItem(SRS_KEY, JSON.stringify(all));
    } catch (e) {}
    var sync = window.SH_SYNC;
    if (sync && typeof sync.merge === "function") {
      Object.keys(syncAnsweredNow).forEach(function(q){ delete byQid[q]; });
      try { sync.merge(byQid, Object.keys(daySet).sort()); } catch (e) { if (window.console) console.warn("SH_SYNC.merge failed", e); }
    }
  }
  function finishProgressSync(rows){
    syncBusy = false;
    if (Array.isArray(rows)) { if (rows.length) applySync(rows); else if (!qhHist) qhHist = {}; }
  }
  function syncProgressRemote(){
    window.shPins.sync();
    var kept = ansLoad();
    if (kept) {
      /* only the answers after the device's newest (migration_v84); the old read if the database doesn't have it */
      try {
        supabase.rpc("get_my_answers_since", { p_visitor: VISITOR_ID, p_hub: HUB, p_after: kept.id, p_n: kept.n }).then(function(res){
          if (rpcMissing(res)) { ansOff = true; ansDrop(); return syncAllAnswers(); }
          var d = res && !res.error ? ansAbsorb(res.data, kept) : null;
          finishProgressSync(d && Array.isArray(d.answers) ? d.answers : null);
        }, function(){ finishProgressSync(null); });
      } catch (e) { finishProgressSync(null); }
      return;
    }
    syncAllAnswers();
  }
  function syncAllAnswers(){
    try {
      supabase.rpc("get_my_answers", { p_visitor: VISITOR_ID, p_hub: HUB }).then(function(res){
        finishProgressSync(res && !res.error ? res.data : null);
      }, function(){ finishProgressSync(null); });
    } catch (e) { finishProgressSync(null); }
  }
  function syncProgress(){
    if (!supabase || syncBusy || EXPORT_ONLY) return;
    syncBusy = true; syncAnsweredNow = {}; lastSync = Date.now();
    if (bootstrapSyncPending) {
      bootstrapSyncPending = false;
      bootstrap.ready.then(function(data){
        if (data && Array.isArray(data.answers)) {
          if (Array.isArray(data.pins)) window.shPins.sync(data.pins); else window.shPins.sync();
          finishProgressSync(data.answers);
        } else syncProgressRemote();
      }, syncProgressRemote);
      return;
    }
    syncProgressRemote();
  }
  window.shSyncProgress = syncProgress;
  setTimeout(syncProgress, 300);
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "visible" && Date.now() - lastSync > 3 * 60 * 1000) syncProgress();
  });

  if (modeSwitchEl) {
    modeSwitchEl.addEventListener("click", function(e){
      var t = e.target.closest("[data-" + modeAttr + "]");
      if (t && t.dataset && t.dataset[modeAttr]) safeRpc("record_mode_open", { p_hub: HUB, p_mode: t.dataset[modeAttr] });
    });
  }
  safeRpc("record_mode_open", { p_hub: HUB, p_mode: DEFAULT_MODE });

  /* ---------- confetti + streak toast ---------- */
  /* the sticker toast (widget/toast.js, window.shToast, which runs first in the engine's bundle; 2026-11-20):
     showStreakToast(text, icon, { kind, title, ms }). The old pages' dark pill came out on 2026-11-25. */
  function showStreakToast(text, iconHTML, o){
    if (!window.shToast) return;
    o = o || {};
    window.shToast(text, { kind: o.kind, title: o.title, icon: iconHTML || undefined, ms: o.ms });
  }
  function fireConfetti(){
    /* a holiday (widget/eggs.js) swaps the colors and the paper strips for little shapes (candy corn, leaves, snow...) */
    var theme = window.shConfettiTheme;
    var colors = (theme && theme.colors) || ["#3ecf7e", "#f0806b", "#e8c15a", "#8fb4e8", "#c58fe8"];
    for (var i = 0; i < 26; i++){
      (function(i){
        var p = document.createElement("span");
        p.className = "shstat-confetti";
        var size = 6 + Math.random() * 5;
        if (theme && theme.svg) {
          size = 13 + Math.random() * 7;
          p.style.width = size + "px"; p.style.height = size + "px";
          p.style.color = colors[i % colors.length];
          p.innerHTML = theme.svg;
        } else {
          p.style.width = size + "px";
          p.style.height = (size * 0.4) + "px";
          p.style.background = colors[i % colors.length];
        }
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

  /* ---------- tactical nuke: earned after NUKE_STREAK_THRESHOLD correct
     answers in a row (session-only streak, resets on reload -- separate
     from the persisted correct_streaks table above, which tracks a
     longer-running per-visitor streak for the dashboard and never gates
     this badge). Broadcasts over the same per-hub presence channel
     everyone already joins, so the countdown/blast plays live for
     everyone currently on THIS hub. Each launch is also logged (see
     record_nuke_launch below) for the admin review page's nuke-analytics
     section -- fire-and-forget via safeRpc, never blocks the effect. ---------- */
  var nukeBadgeEl = null;
  var nukeArmed = false;
  var nukeArmedTimer = null;

  function showNukeBadge(){
    if (nukeBadgeEl) return;
    shNukeSfx.play("unlock");
    shNukeSfx.preload("countdown");
    nukeBadgeEl = document.createElement("button");
    nukeBadgeEl.type = "button";
    nukeBadgeEl.id = "sh-nuke-badge";
    var prize = fmtN(PRIZES.nuke);
    nukeBadgeEl.innerHTML = '<span class="sh-nuke-icon sh-nuke-icon-md" aria-hidden="true"></span><span class="sh-nuke-badge-label">Tactical Nuke Ready</span>' +
      (prize ? '<span class="sh-nuke-badge-prize" aria-hidden="true">+' + prize + "<i> XP and crowns</i></span>" : "");
    nukeBadgeEl.setAttribute("aria-label", "Tactical nuke ready" + (prize ? ", worth " + prize + " XP and " + prize + " crowns" : "") + " -- tap to call it in");
    document.body.appendChild(nukeBadgeEl);
    requestAnimationFrame(function(){ if (nukeBadgeEl) nukeBadgeEl.classList.add("is-shown"); });
    nukeBadgeEl.addEventListener("click", handleNukeBadgeClick);
  }
  function hideNukeBadge(){
    if (!nukeBadgeEl) return;
    var el = nukeBadgeEl;
    nukeBadgeEl = null;
    nukeArmed = false;
    clearTimeout(nukeArmedTimer);
    el.classList.remove("is-shown");
    setTimeout(function(){ el.remove(); }, 300);
  }
  /* switched off in Settings while the badge is up: put it away (the streak still counts) */
  document.addEventListener("sh:pref", function(e){
    if (e.detail && e.detail.key === SH_NUKE_PREF_KEY && e.detail.val === "off") { hideNukeBadge(); nukeReady = false; }
  });
  function handleNukeBadgeClick(){
    if (!nukeBadgeEl) return;
    if (!nukeArmed) {
      nukeArmed = true;
      nukeBadgeEl.classList.add("is-armed");
      nukeBadgeEl.querySelector(".sh-nuke-badge-label").textContent = "Confirm strike?";
      clearTimeout(nukeArmedTimer);
      nukeArmedTimer = setTimeout(function(){
        if (!nukeBadgeEl) return;
        nukeArmed = false;
        nukeBadgeEl.classList.remove("is-armed");
        nukeBadgeEl.querySelector(".sh-nuke-badge-label").textContent = "Tactical Nuke Ready";
      }, 4000);
      return;
    }
    clearTimeout(nukeArmedTimer);
    launchNuke();
  }
  function launchNuke(){
    var name = displayName();
    hideNukeBadge();
    sessionCorrectStreak = 0;
    nukeReady = false;
    shNukeSfx.play("launch");
    /* the launch pays 10,000 XP and crowns when the server's own run reached 100 (launch_nuke_v2, migration_v68; it logs
       the launch too), said once the strike has played; without it, the launch is logged as before */
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    claimPrize("launch_nuke_v2", { p_visitor: VISITOR_ID, p_hub: HUB, p_name: name }, "nuke", reduce ? 5000 : 16000).then(function(r){
      if (!r || r.missing) safeRpc("record_nuke_launch", { p_hub: HUB, p_visitor: VISITOR_ID, p_name: name });
    });
    // On exam day the strike plays only for the person who launched it, so classmates cramming aren't interrupted.
    if (!isExamDay()) { try { if (channel) channel.send({ type: "broadcast", event: "nuke", payload: { name: name } }); } catch (e) {} }
    playNukeSequence(name);
  }
  function playNukeSequence(name){
    var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Non-reduced-motion's countdown is paced to match the real length of the
    // countdown-fx video below (baked-in 10.0 -> 0.0 digits, ending in its own
    // flash around the 13s mark) so our timer and its on-screen numbers reach
    // zero together without needing to distort its playback rate.
    var startAt = reduceMotion ? 3 : 13;
    document.body.classList.add("sh-nuke-active");
    var overlay = document.createElement("div");
    overlay.className = "sh-nuke-overlay";
    overlay.innerHTML =
      '<div class="sh-nuke-banner"><span class="sh-nuke-icon sh-nuke-icon-sm" aria-hidden="true"></span><span>' + esc(name) + ' has called in a tactical strike</span></div>' +
      '<div class="sh-nuke-stage">' +
        '<img class="sh-nuke-photo sh-nuke-photo-cloud" src="' + NUKE_IMG_BASE + 'nuke-cloud.webp" alt="" aria-hidden="true">' +
        '<video class="sh-nuke-photo sh-nuke-video" muted playsinline preload="auto" aria-hidden="true"><source src="' + NUKE_VID_BASE + 'nuke-blast-cloud.webm" type="video/webm"><source src="' + NUKE_VID_BASE + 'nuke-blast-cloud.mp4" type="video/mp4"></video>' +
        (reduceMotion ?
          '<div class="sh-nuke-countdown"><span class="sh-nuke-icon sh-nuke-icon-lg" aria-hidden="true"></span><span class="sh-nuke-count">' + startAt.toFixed(2) + '</span></div>' :
          '<div class="sh-nuke-countdown sh-nuke-countdown-fx">' +
            '<canvas class="sh-nuke-countdown-canvas" aria-hidden="true"></canvas>' +
            '<video class="sh-nuke-countdown-video" muted playsinline preload="auto"><source src="' + NUKE_VID_BASE + 'nuke-countdown-fx.webm" type="video/webm"><source src="' + NUKE_VID_BASE + 'nuke-countdown-fx.mp4" type="video/mp4"></video>' +
          '</div>') +
      '</div>' +
      '<div class="sh-nuke-flash" aria-hidden="true"></div>' +
      '<div class="sh-nuke-aftermath">Direct hit. Back to studying.</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.classList.add("is-shown"); });

    var countEl = overlay.querySelector(".sh-nuke-count");
    var photoCloud = overlay.querySelector(".sh-nuke-photo-cloud");
    var blastVideo = overlay.querySelector(".sh-nuke-video");
    var flashEl = overlay.querySelector(".sh-nuke-flash");
    var cdCanvas = overlay.querySelector(".sh-nuke-countdown-canvas");
    var cdVideo = overlay.querySelector(".sh-nuke-countdown-video");
    var countdownStart = null;
    var blastFired = false;

    /* countdown audio: the full 13 s track, or its last 3 s for the short reduced-motion version */
    shNukeSfx.play("countdown", reduceMotion ? 10 : 0);
    if (!reduceMotion && cdVideo) {
      runNukeCountdownKeyCanvas(cdCanvas, cdVideo);
      var cdPlay = cdVideo.play();
      if (cdPlay && cdPlay.catch) cdPlay.catch(function(){});
    }

    function countdownFrame(ts){
      if (!overlay.isConnected) return;
      if (countdownStart === null) countdownStart = ts;
      var remaining = Math.max(0, startAt - (ts - countdownStart) / 1000);
      if (countEl) countEl.textContent = remaining.toFixed(2);
      if (remaining > 0) {
        requestAnimationFrame(countdownFrame);
      } else if (!blastFired) {
        blastFired = true;
        triggerBlast();
      }
    }
    requestAnimationFrame(countdownFrame);

    function triggerBlast(){
      overlay.classList.add("is-blast");
      shNukeSfx.stop("countdown");
      shNukeSfx.play("blast");
      if (cdVideo) { try { cdVideo.pause(); } catch (e) {} }
      if (reduceMotion) {
        photoCloud.classList.add("is-shown");
      } else {
        overlay.classList.add("is-shaking");
        // Whole screen snaps to solid white the instant the countdown hits zero,
        // then fades away ~150ms later to reveal the real explosion video, which
        // is already rolling (from t=0) behind the white the whole time.
        flashEl.classList.add("is-flash");
        blastVideo.currentTime = 0;
        var playPromise = blastVideo.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function(){
            // Autoplay blocked for some reason -- fall back to the static cloud still.
            photoCloud.classList.add("is-shown");
          });
        }
        setTimeout(function(){
          flashEl.classList.add("is-fading");
          blastVideo.classList.add("is-shown");
        }, 150);
      }
      var holdMs = reduceMotion ? 900 : 7800;
      setTimeout(function(){
        overlay.classList.add("is-fading");
        setTimeout(function(){
          if (overlay.parentNode) overlay.remove();
          document.body.classList.remove("sh-nuke-active");
        }, 1000);
      }, holdMs);
    }
  }

  /* ---------- countdown-fx chroma key: the countdown video (a real, spinning,
     glowing radiation-icon countdown graphic Sam supplied, green-screened,
     ending in its own flash around the 13s mark) is drawn to a small canvas
     frame-by-frame, with the green screen keyed out to transparent live in
     JS (getImageData/putImageData) so it composites over the page like any
     other UI chrome rather than needing alpha-channel video support, which
     isn't reliable across real browsers. Runs only outside reduced motion;
     the reduced-motion path never touches this and shows plain text instead. ---------- */
  function runNukeCountdownKeyCanvas(canvas, video){
    if (!canvas || !video) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssSize = 200;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    // Tight crop around the icon+number in the 640x360 source, established by
    // sampling the non-green bounding box across several frames.
    var SRC_X = 176, SRC_Y = 47, SRC_W = 280, SRC_H = 280;
    var KEY_R = 0, KEY_G = 215, KEY_B = 0, TOL = 70, SOFT = 50;
    // From ~12.25 s the clip whites out on its own, lightening the green toward white,
    // so a fixed key color stopped matching and the lit-up screen showed as a pale
    // square around the icon until the blast at 13 s. Each frame is keyed against its
    // own background instead (sampled at the four corners), and as it whitens the icon
    // swells into this soft white disc, handing off to the full-screen flash.
    var cw = canvas.width, ch = canvas.height;
    var corners = [(3 * cw + 3) * 4, (3 * cw + cw - 4) * 4, ((ch - 4) * cw + 3) * 4, ((ch - 4) * cw + cw - 4) * 4];
    var disc = new Float32Array(cw * ch);
    for (var py = 0; py < ch; py++) {
      for (var px = 0; px < cw; px++) {
        var rr = Math.sqrt(Math.pow(px - cw / 2 + 0.5, 2) + Math.pow(py - ch / 2 + 0.5, 2)) / cw;
        var t = Math.max(0, Math.min(1, (rr - 0.36) / 0.14));
        disc[py * cw + px] = 1 - t * t * (3 - 2 * t);
      }
    }

    function tick(){
      if (!canvas.isConnected) return;
      if (video.paused || video.ended || video.readyState < 2) {
        requestAnimationFrame(tick);
        return;
      }
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, SRC_X, SRC_Y, SRC_W, SRC_H, 0, 0, canvas.width, canvas.height);
        var frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var d = frame.data;
        var kr = KEY_R, kg = KEY_G, kb = KEY_B, sr = 0, sg = 0, sb = 0;
        for (var c = 0; c < 4; c++) {
          var ci = corners[c];
          sr += d[ci]; sg += d[ci + 1]; sb += d[ci + 2];
        }
        // corners agree = plain background; otherwise keep the default key
        var spread = 0;
        for (var c2 = 0; c2 < 4; c2++) {
          var cj = corners[c2];
          spread = Math.max(spread, Math.abs(d[cj] - sr / 4), Math.abs(d[cj + 1] - sg / 4), Math.abs(d[cj + 2] - sb / 4));
        }
        if (spread < 20) { kr = sr / 4; kg = sg / 4; kb = sb / 4; }
        var wash = Math.min(kr, kb) / 255; // 0 on the green screen, 1 once the clip is white
        var despill = 0.6 + 0.4 * wash;
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          var dr = r - kr, dg = g - kg, db = b - kb;
          var dist = Math.sqrt(dr * dr + dg * dg + db * db);
          var alpha = Math.max(0, Math.min(1, (dist - TOL) / SOFT));
          if (wash > 0.01) alpha = Math.max(alpha, wash * disc[i >> 2]);
          var excessG = Math.max(0, g - Math.max(r, b));
          d[i + 1] = g - excessG * despill;
          d[i + 3] = Math.round(alpha * 255);
        }
        ctx.putImageData(frame, 0, 0);
      } catch (e) {}
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- the widget's panels: Search, Suggest, Report and Class stats ----------
     They open from the hub's own buttons (widget/hub.js: the bar's search button, More, Stats and trophies) through
     window.shWidgetPanel and window.shOpenFlag. The old pages' launcher and its menu, the phone bar and its More sheet, the
     inbox and tour buttons in their top bar, the top-bar fitter and the old Settings panel came out on 2026-11-25. */
  /* drawn to match the hubs' own icon sets: 24px grid, 1.8 stroke, round caps */
  function shIcon(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICON_FLAME = shIcon('<path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.4-2.4-5.3-3.4-8.4-.4 1.9-1.4 3.1-2.6 3.7.2-2.7-.9-5.3-3.2-6.7.3 3.1-2.8 5.4-2.8 9.3C6 18.6 8.4 21 12 21z"/>');

  var backdrop = document.createElement("div");
  backdrop.id = "shstat-backdrop";
  document.body.appendChild(backdrop);

  var root = document.createElement("div");
  root.id = "shstat-root";
  root.innerHTML =
    '<div id="shstat-searchpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Search this hub</h5>' +
    '<input type="text" id="shstat-search-input" placeholder="Search notes, tables, hints, questions…">' +
    '<div id="shstat-search-results"><div class="shstat-empty">Search the notes, review tables, exam hints, cram sheet and questions.</div></div>' +
    '</div>' +
    '<div id="shstat-suggestpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Suggest something</h5>' +
    '<textarea id="shstat-suggest-text" maxlength="500" placeholder="e.g. add a flashcard mode, more questions on lecture 3..."></textarea>' +
    '<div id="shstat-suggest-ideas"></div>' +
    '<div><button class="shstat-send" id="shstat-suggest-submit" type="button">Send</button></div>' +
    '<div class="shstat-flagmsg" id="shstat-suggest-msg"></div>' +
    '</div>' +
    '<div id="shstat-flagpanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Report a typo or issue</h5>' +
    '<div class="shstat-flagctx" id="shstat-flag-ctx"></div>' +
    '<textarea id="shstat-flag-text" maxlength="500" placeholder="e.g. Q14 answer key looks off, typo in Lecture 3..."></textarea>' +
    '<div><button class="shstat-send" id="shstat-flag-submit" type="button">Send</button></div>' +
    '<div class="shstat-flagmsg" id="shstat-flag-msg"></div>' +
    '</div>' +
    '<div id="shstat-panel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<div class="shstat-sec"><h5>Your stats (this device)</h5><div id="shstat-mine"><div class="shstat-empty">Loading…</div></div>' +
    '<div class="shstat-name-row"><input type="text" id="shstat-name-input" maxlength="24" placeholder="Leaderboard name (optional)"><button id="shstat-name-save" type="button">Save</button></div>' +
    '<div class="shstat-namemsg" id="shstat-name-msg"></div>' +
    '<button type="button" class="sh-name-linkbtn shstat-linkbtn" data-sh-link="stats">Link my devices</button></div>' +
    '<div class="shstat-sec"><h5>Toughest questions (class-wide)</h5><div id="shstat-tough"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Most opened</h5><div id="shstat-modes"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Busiest times</h5><div id="shstat-hist-wrap"><div class="shstat-empty">Loading…</div></div></div>' +
    '</div>';
  document.body.appendChild(root);

  function renderOnline(){
    /* the hub shows the count in its own bar (widget/hub.js) */
    try { document.dispatchEvent(new CustomEvent("sh:online", { detail: { n: onlineCount } })); } catch (e) {}
  }

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  /* ---------- SH_EXPORT: each hub's own {lectures, questions} data, if published ---------- */
  function getExport(){
    var ex = window.SH_EXPORT;
    if (!ex || typeof ex !== "object") return { lectures: [], questions: [], sections: [] };
    return { lectures: ex.lectures || [], questions: ex.questions || [], sections: ex.sections || [] };
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

  /* ---------- "Find this in the notes" after a missed question (2026-11-04, from /reddit-scout's first run) ----------
     When the student misses a question they just answered on a card, a button under the explanation opens the notes
     paragraph that best matches it, right there in the card, with a jump into the notes through the hub's own
     window.SH_GOTO (the jump the widget's search uses). The match is BM25 over that lecture's note paragraphs in
     SH_EXPORT.sections, with the right answer counting most, then the explanation, then the stem (SH_EXPORT.questions'
     hint is "answer — explanation"). Weak matches get no button: a wrong passage is worse than none. Only a card the
     student just tapped gets one, so the mock exam's submit and the arcade never do. Tracked: notes-jump:shown, :none,
     :show, :open. */
  var NJ_MIN_SCORE = 14, NJ_MIN_CHARS = 50;
  var NJ_STOP = {};
  ("a about above after again against all also an and any are as at be because been before being below between both but by can " +
   "could did do does doing down during each either few for from further had has have having here how if in into is it its itself " +
   "just more most much must no nor not now of off on once only or other our out over own same should so some such than that the " +
   "their them then there these they this those through to too under until up very was we were what when where which while who whom " +
   "why will with within without would you your one two three four five first second third true false statement statements read " +
   "following choice choices answer answers correct incorrect best least likely except none neither option options question " +
   "describes described describe given called known used uses using may might often usually typically commonly etc").split(" ")
    .forEach(function(w){ NJ_STOP[w] = 1; });
  function njStem(w){
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 5 && /(sses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /[^s]s$/.test(w)) return w.slice(0, -1);
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /ly$/.test(w)) return w.slice(0, -2);
    return w;
  }
  function njTokens(t){
    var out = [];
    (String(t || "").toLowerCase().match(/[a-z0-9]+/g) || []).forEach(function(w){
      if (NJ_STOP[w] || (w.length < 3 && !/\d/.test(w))) return;
      out.push(njStem(w));
    });
    return out;
  }
  var njIndexes = {}, njQuestions = null;
  function njIndex(lec){
    if (njIndexes[lec]) return njIndexes[lec];
    var docs = getExport().sections.filter(function(s){
      return s && s.kind === "Notes" && s.lec === lec && s.go && s.go.v === "notes" && String(s.text || "").length >= NJ_MIN_CHARS;
    }).map(function(s){
      var tf = {}, n = 0;
      njTokens(s.text).forEach(function(t){ tf[t] = (tf[t] || 0) + 1; n++; });
      return { s: s, tf: tf, n: n };
    });
    var df = {}, total = 0;
    docs.forEach(function(d){ total += d.n; Object.keys(d.tf).forEach(function(t){ df[t] = (df[t] || 0) + 1; }); });
    return (njIndexes[lec] = { docs: docs, df: df, avg: docs.length ? total / docs.length : 1 });
  }
  function njQuestion(qid){
    if (!njQuestions) { njQuestions = {}; getExport().questions.forEach(function(q){ if (q && q.id) njQuestions[q.id] = q; }); }
    return njQuestions[qid] || null;
  }
  function njBest(q){
    if (!q || !q.lec) return null;
    var ix = njIndex(q.lec); if (!ix.docs.length) return null;
    var hint = String(q.hint || ""), cut = hint.indexOf(" — ");
    var parts = cut > -1 ? [[hint.slice(0, cut), 2], [hint.slice(cut + 3), 1.5]] : [[hint, 1.5]];
    parts.push([q.text, 1]);
    var qw = {};
    parts.forEach(function(p){ njTokens(p[0]).forEach(function(t){ var w = /^\d+$/.test(t) ? p[1] / 3 : p[1]; qw[t] = Math.max(qw[t] || 0, w); }); });
    var N = ix.docs.length, k1 = 1.2, b = 0.75, top = null;
    ix.docs.forEach(function(d){
      var sc = 0, hits = [];
      Object.keys(qw).forEach(function(t){
        var f = d.tf[t]; if (!f) return;
        var idf = Math.log(1 + (N - ix.df[t] + 0.5) / (ix.df[t] + 0.5));
        var part = qw[t] * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.n / ix.avg));
        sc += part;
        hits.push([t, part]);
      });
      if (!top || sc > top.score) top = { score: sc, hits: hits, s: d.s };
    });
    if (!top) return null;
    /* the words that carry the match, most telling first; only these few get marked in the excerpt */
    var words = top.hits.filter(function(h){ return !/^\d+$/.test(h[0]); })
      .sort(function(x, y){ return y[1] - x[1]; }).map(function(h){ return h[0]; });
    return words.length >= 2 && top.score >= NJ_MIN_SCORE ? { s: top.s, hits: words.slice(0, 6) } : null;
  }
  /* the paragraph, escaped, with the first place each of the telling words appears marked */
  function njMarked(text, hits){
    var on = {}; hits.forEach(function(t){ on[t] = 1; });
    return String(text || "").split(/([A-Za-z0-9]+)/).map(function(part, i){
      if (i % 2 === 0) return esc(part);
      var w = part.toLowerCase(), t = njStem(w);
      if (w.length < 3 || NJ_STOP[w] || on[t] !== 1) return esc(part);
      on[t] = 2;
      return "<mark>" + esc(part) + "</mark>";
    }).join("");
  }
  var NJ_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>';
  function njAttach(card, qid){
    var ex = card.querySelector(".qcard-explain");
    if (!ex || ex.querySelector(".sh-nj")) return;
    var q = njQuestion(qid), m = null;
    try { m = njBest(q); } catch (e) { m = null; }
    if (!m) { shTrackSafe("notes-jump:none"); return; }
    var where = lectureTitle(q.lec) || "";
    var wrap = document.createElement("div");
    wrap.className = "sh-nj";
    wrap.setAttribute("data-sh-noread", "");
    wrap.innerHTML = '<button type="button" class="sh-nj-btn" data-sh-notejump="show" aria-expanded="false">' + NJ_ICON + '<span>Find this in the notes</span></button>' +
      '<div class="sh-nj-box" hidden><div class="sh-nj-where">' + esc(where) + (where ? " · " : "") + 'Notes</div>' +
      '<p class="sh-nj-text">' + njMarked(m.s.text, m.hits) + '</p>' +
      '<button type="button" class="sh-nj-open" data-sh-notejump="open">Open this in the notes</button></div>';
    var btn = wrap.querySelector(".sh-nj-btn"), box = wrap.querySelector(".sh-nj-box");
    btn.addEventListener("click", function(ev){
      ev.stopPropagation();
      var open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) shTrackSafe("notes-jump:show");
    });
    wrap.querySelector(".sh-nj-open").addEventListener("click", function(ev){
      ev.stopPropagation();
      shTrackSafe("notes-jump:open");
      try { if (window.shCloseWidgetPanels) window.shCloseWidgetPanels(); } catch (e) {}
      try { window.SH_GOTO(m.s.go); } catch (e) {}
    });
    ex.appendChild(wrap);
    shTrackSafe("notes-jump:shown");
  }
  /* the card the student last tapped or typed in; answering a card fires the hub's answered event inside that tap */
  var njCard = null;
  function njNote(e){ var c = e.target && e.target.closest ? e.target.closest(".qcard[data-qid]") : null; njCard = c; }
  document.addEventListener("click", njNote, true);
  document.addEventListener("keydown", njNote, true);
  document.addEventListener(ANSWERED_EVENT, function(e){
    var d = (e && e.detail) || {};
    if (d.correct || d.ctx === "mock" || d.ctx === "arcade" || typeof window.SH_GOTO !== "function") return;
    var qid = String(d.qid || ""), card = njCard;
    if (!qid || !card || card.getAttribute("data-qid") !== qid) return;
    setTimeout(function(){ if (card.isConnected) njAttach(card, qid); }, 0);
  });
  /* the redesign's flashcards (widget/study-modes.js): a card's back isn't a question card and has no answer to miss, so the
     page asks for "Find this in the notes" itself, in the element's .qcard-explain. Nothing on a live hub calls it. */
  window.shNoteJump = function(el, qid){ if (el && qid && typeof window.SH_GOTO === "function") njAttach(el, String(qid)); };

  function loadStats(){
    var toughEl = document.getElementById("shstat-tough");
    var modesEl = document.getElementById("shstat-modes");
    if (!supabase) { toughEl.innerHTML = modesEl.innerHTML = '<div class="shstat-empty">Class data isn&#39;t reachable right now.</div>'; return; }
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
    if (!supabase) { el.innerHTML = '<div class="shstat-empty">Your stats aren&#39;t reachable right now.</div>'; return; }
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
    if (!supabase) { wrap.innerHTML = '<div class="shstat-empty">Not reachable right now.</div>'; return; }
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
  /* Searches everything a hub publishes in SH_EXPORT: note paragraphs, review rows, exam hints,
     cram lines (SH_EXPORT.sections) and questions. Every word typed must appear. A result
     jumps to its place in the hub through window.SH_GOTO. */
  var SEARCH_GROUPS = ["Study guide", "Notes", "Review", "Exam hints", "Cram sheet", "Questions"];   // "Study guide": a hub on the engine with one (widget/hub.js, drawGuide)
  var searchHits = [];
  function reEsc(w){ return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function snippet(text, terms){
    var t = String(text || ""), low = t.toLowerCase(), at = -1;
    terms.forEach(function(w){ var k = low.indexOf(w); if (k !== -1 && (at === -1 || k < at)) at = k; });
    var start = Math.max(0, at - 60), out = t.slice(start, start + 170);
    out = (start > 0 ? "…" : "") + out + (start + 170 < t.length ? "…" : "");
    var html = esc(out);
    terms.forEach(function(w){ if (w.length > 1) html = html.replace(new RegExp("(" + reEsc(esc(w)) + ")", "ig"), "<mark>$1</mark>"); });
    return html;
  }
  function runSearch(query){
    var raw = (query || "").trim();
    if (!raw) { searchResults.innerHTML = '<div class="shstat-empty">Search the notes, review tables, exam hints, cram sheet and questions.</div>'; return; }
    var data = getExport();
    if (!data.lectures.length && !data.questions.length && !data.sections.length) {
      searchResults.innerHTML = '<div class="shstat-empty">Search isn&#39;t available for this hub yet.</div>';
      return;
    }
    var terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
    function hit(t){ t = String(t || "").toLowerCase(); return terms.every(function(w){ return t.indexOf(w) !== -1; }); }
    var byKind = {};
    data.sections.forEach(function(e){ if (hit((e.title || "") + " " + e.text)) (byKind[e.kind] = byKind[e.kind] || []).push(e); });
    data.questions.forEach(function(q){
      if (!hit(q.text + " " + (q.hint || ""))) return;
      (byKind.Questions = byKind.Questions || []).push({ kind: "Questions", where: lectureTitle(q.lec) || "", text: q.text, title: "", q: q, go: { v: "bank", q: raw } });
    });
    searchHits = []; var html = "", total = 0;
    SEARCH_GROUPS.forEach(function(kind){
      var list = byKind[kind]; if (!list || !list.length) return;
      total += list.length;
      var cap = kind === "Questions" ? 10 : 8;
      html += '<div class="shstat-search-sec"><h5>' + esc(kind) + ' · ' + list.length + '</h5>' + list.slice(0, cap).map(function(e){
        var i = searchHits.push(e) - 1;
        return '<button type="button" class="shstat-search-hit" data-hit="' + i + '">' +
          (e.title ? '<span class="sh-hit-title">' + snippet(e.title, terms) + '</span>' : '') +
          '<span class="sh-hit-snip">' + snippet(e.text, terms) + '</span>' +
          (e.where ? '<span class="sh-hit-where">' + esc(e.where) + '</span>' : '') + '</button>';
      }).join("") + (list.length > cap ? '<div class="shstat-empty">' + (list.length - cap) + ' more. Add a word to narrow it down.</div>' : '') + '</div>';
    });
    searchResults.innerHTML = total ? html : '<div class="shstat-empty">No matches for &#8220;' + esc(raw) + '&#8221;.</div>';
    logSearch(raw, total);
  }
  /* What people search for, once they stop typing (search_terms, migration_v23): terms with 0 results are
     content the hub is missing, which is read back when the hub is archived. Each term once per page load. */
  var searchLogTimer = null, searchLogged = {};
  function logSearch(raw, total){
    clearTimeout(searchLogTimer);
    var term = raw.toLowerCase().replace(/\s+/g, " ").trim();
    if (term.length < 3 || term.length > 60 || searchLogged[term]) return;
    searchLogTimer = setTimeout(function(){
      searchLogged[term] = 1;
      safeRpc("record_search", { p_hub: HUB, p_term: term, p_hits: total });
    }, 1500);
  }
  var searchTimer = null;
  if (searchInput) searchInput.addEventListener("input", function(){ clearTimeout(searchTimer); searchTimer = setTimeout(function(){ runSearch(searchInput.value); }, 110); });
  searchResults.addEventListener("click", function(e){
    var b = e.target.closest("[data-hit]"); if (!b) return;
    var h = searchHits[+b.getAttribute("data-hit")]; if (!h) return;
    if (typeof window.SH_GOTO === "function") {
      searchPanel.classList.remove("is-open"); updateSheetState();
      try { window.SH_GOTO(h.go); } catch (err) {}
    }
  });

  /* ---------- leaderboard display name (the Stats panel box) ---------- */
  syncNameInputs();
  var nameSaveBtn = document.getElementById("shstat-name-save");
  if (nameSaveBtn) {
    nameSaveBtn.addEventListener("click", function(){
      var nameInput = document.getElementById("shstat-name-input");
      var nameMsg = document.getElementById("shstat-name-msg");
      var name = (nameInput.value || "").trim();
      if (!saveName(name)) { nameMsg.textContent = "Type a name first."; return; }
      nameMsg.textContent = "Saved. You'll show up on the leaderboard as \"" + name + "\".";
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
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") { closeOtherPanels(null); updateSheetState(); } });

  backdrop.addEventListener("click", function(){
    closeOtherPanels(null);
    updateSheetState();
  });
  /* the Inbox, the tour and "Open this in the notes" close any panel first */
  window.shCloseWidgetPanels = function(){ closeOtherPanels(null); updateSheetState(); };
  /* window.shWidgetPanel("search" | "stats" | "suggest"): the hub's buttons open a panel with it (widget/hub.js). It opens
     the panel, or closes it if it's open, as the old launcher's buttons did; until 2026-11-25 the hub clicked those
     (hidden) buttons. Opening Class stats reads its numbers and tells widget/ranks-hub.js (sh:stats-open), which draws the
     rank in it. */
  var PANEL_OPEN = {
    stats: function(){
      closeOtherPanels(panel);
      var open = panel.classList.toggle("is-open");
      if (open) { loadStats(); loadPersonalStats(); loadBusiestTimes(); }
      updateSheetState();
      if (open) try { document.dispatchEvent(new CustomEvent("sh:stats-open")); } catch (e) {}
    },
    search: function(){
      closeOtherPanels(searchPanel);
      var open = searchPanel.classList.toggle("is-open");
      if (open && searchInput) searchInput.focus();
      updateSheetState();
    },
    suggest: function(){
      closeOtherPanels(suggestPanel);
      suggestPanel.classList.toggle("is-open");
      updateSheetState();
      var tk = suggestTickNow(); if (tk) tk.sync(document.getElementById("shstat-suggest-text").value);
    }
  };
  window.shWidgetPanel = function(k){ if (PANEL_OPEN[k]) PANEL_OPEN[k](); };
  document.querySelector("#shstat-panel .shstat-close").addEventListener("click", function(){
    panel.classList.remove("is-open");
    updateSheetState();
  });
  document.querySelector("#shstat-searchpanel .shstat-close").addEventListener("click", function(){
    searchPanel.classList.remove("is-open");
    updateSheetState();
  });

  /* qid is a question id, or { lec, label } for a lecture's notes (the Report button under each lecture's notes) */
  function setFlagContext(qid, w, ord){
    pendingFlagLec = qid && typeof qid === "object" ? qid : null;
    pendingFlagQid = pendingFlagLec ? null : (qid || null);
    pendingFlagW = pendingFlagQid && w >= 0 ? w : -1;
    pendingFlagOrd = pendingFlagQid && /^[1-5]{2,5}$/.test(ord || "") ? ord : "";
    var ctx = document.getElementById("shstat-flag-ctx");
    if (!ctx) return;
    if (pendingFlagLec) { ctx.textContent = "About the notes for " + (pendingFlagLec.label || pendingFlagLec.lec); return; }
    if (!qid) { ctx.textContent = ""; return; }
    var meta = findQuestionMeta(qid), t = meta.text || "";
    if (pendingFlagW > 0 || pendingFlagOrd) { var cs = document.querySelector('.qcard[data-qid="' + String(qid).replace(/"/g, "") + '"]' + (pendingFlagOrd ? "[data-order]" : "[data-wording]") + " .qc-stem"); t = cs ? cs.textContent : t; }
    ctx.textContent = "About question " + qid + flagVersion() + (t ? ": " + (t.length > 110 ? t.slice(0, 108) + "…" : t) : "");
  }
  /* A/B: " (version B)" for a question that comes in versions, nothing for one that doesn't (Sam, 2026-11-18: the letter is
     the differentiator, on the card and in a report) */
  function flagVersion(){ return pendingFlagW >= 0 ? " (version " + ("ABCDEF".charAt(pendingFlagW) || "A") + ")" : ""; }
  window.shOpenFlag = function(qid, w, ord){
    closeOtherPanels(flagPanel);
    setFlagContext(qid, w, ord);
    document.getElementById("shstat-flag-msg").textContent = "";
    flagPanel.classList.add("is-open");
    updateSheetState();
    var ta = document.getElementById("shstat-flag-text"); if (ta) ta.focus();
  };
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
    if (!supabase) { msg.textContent = "Couldn't send — try again later."; return; }
    btn.disabled = true;
    msg.textContent = "Sending…";
    /* where the student was, so the report can be found: [question id] and the current section */
    var where = [];
    if (pendingFlagQid) where.push("question " + pendingFlagQid + flagVersion() + (pendingFlagOrd ? " (statements shown in the order " + pendingFlagOrd.split("").join(", ") + ")" : ""));
    if (pendingFlagLec) where.push("lecture notes " + (pendingFlagLec.label ? pendingFlagLec.label + " (" + pendingFlagLec.lec + ")" : pendingFlagLec.lec));
    var sec = currentSection(); if (sec) where.push(sec);
    var note = (text + (where.length ? "  — " + where.join(" · ") : "")).slice(0, 700);
    supabase.from("question_flags").insert({ hub: HUB, note: note, visitor_id: VISITOR_ID }).then(function(res){
      btn.disabled = false;
      if (res && res.error) { msg.textContent = "Couldn't send — try again later."; return; }
      ta.value = "";
      msg.textContent = "Thanks — sent!";
    }, function(){ btn.disabled = false; msg.textContent = "Couldn't send — try again later."; });
  });

  /* "Also post it on the idea board" (widget/ideas.js, part of the redesign): only where that file is loaded, which
     the redesigned hubs do when Suggest opens, and it draws nothing until the board's server is there. On a live hub
     window.shIdeas doesn't exist, so the Suggest box is what it always was: private, to Sam. Unticked to start. */
  var suggestTick = null;
  function suggestTickNow(){
    if (!suggestTick && window.shIdeas && window.shIdeas.tick && supabase) {
      try { suggestTick = window.shIdeas.tick(document.getElementById("shstat-suggest-ideas"), { sb: supabase, hub: HUB, source: "suggest", checked: false }); } catch (e) {}
    }
    return suggestTick;
  }
  document.getElementById("shstat-suggest-text").addEventListener("input", function(e){ var tk = suggestTickNow(); if (tk) tk.sync(e.target.value); });
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
    if (!supabase) { msg.textContent = "Couldn't send — try again later."; return; }
    /* ticked for the idea board: it needs a name, a title and a kind before anything is sent */
    var tk = suggestTickNow(), toBoard = !!(tk && tk.on());
    if (toBoard) { var bad = tk.check(); if (bad) { msg.textContent = bad; return; } }
    btn.disabled = true;
    msg.textContent = "Sending…";
    supabase.from("hub_suggestions").insert({ hub: HUB, note: text, visitor_id: VISITOR_ID }).then(function(res){
      btn.disabled = false;
      if (res && res.error) { msg.textContent = "Couldn't send — try again later."; return; }
      ta.value = "";
      msg.textContent = "Thanks — sent!";
      if (toBoard) tk.post().then(function(p){
        msg.textContent = p.ok ? "Thanks — sent, and it's on the idea board." : "Thanks — sent to Sam. It didn't go on the idea board: " + (p.msg || "try again later.");
        tk.sync("");
      }, function(){});
      else if (tk) tk.sync("");
    }, function(){ btn.disabled = false; msg.textContent = "Couldn't send — try again later."; });
  });

  /* ====================================================================
     MIND MAP -- a generic, data-driven hierarchical diagram renderer
     shared by every hub. A hub supplies a plain tree of
     {label, children:[...]} nodes (any depth) plus an optional accent
     color expression (e.g. "var(--gold)"), and this lays it out
     left-to-right and draws it as one inline SVG -- no per-lecture
     hand-built markup, no hardcoded positions. Root at the left, leaves
     at the right, each node's vertical slot sized by how many leaves
     its subtree has so siblings never overlap.
     ==================================================================== */
  window.shMindMap = {
    render: function(container, tree, opts){
      if (!container || !tree || !tree.label) return;
      shTrackSafe("mmap:open");
      opts = opts || {};
      var COL_W = opts.colWidth || 210;
      var ROW_GAP = opts.rowGap || 14;
      var PAD_X = 16, PAD_Y = 14;
      var CHARS_PER_LINE = 20, MAX_LINES = 3, LINE_H = 14;

      function wrapLabel(text){
        var words = String(text).split(/\s+/);
        var lines = [], cur = "";
        words.forEach(function(w){
          var next = cur ? cur + " " + w : w;
          if (next.length > CHARS_PER_LINE && cur) { lines.push(cur); cur = w; }
          else cur = next;
        });
        if (cur) lines.push(cur);
        if (lines.length > MAX_LINES) {
          lines = lines.slice(0, MAX_LINES);
          lines[MAX_LINES - 1] = lines[MAX_LINES - 1].replace(/\s*\S*$/, "") + "…";
        }
        return lines;
      }
      // Shared by layout() (vertical spacing) and nodeBoxHTML (actual rect height) so a
      // wrapped 3-line label always gets a tall enough row slot -- previously layout() used
      // a fixed row height while nodeBoxHTML sized the box to line count, so any label
      // wrapping to 2-3 lines produced a box taller than its row and it visually spilled
      // into the next node down.
      function boxHeightFor(lines){ return Math.max(30, lines.length * LINE_H + 14); }

      var rowCursor = 0;
      var maxDepth = 0;
      var nodeList = [];
      function layout(node, depth, parentXRight){
        maxDepth = Math.max(maxDepth, depth);
        node.__lines = wrapLabel(node.label);
        node.__depth = depth;
        node.__x = depth * COL_W + PAD_X;
        var kids = node.children || [];
        if (!kids.length) {
          var boxH = boxHeightFor(node.__lines);
          node.__y = rowCursor + boxH / 2 + PAD_Y;
          rowCursor += boxH + ROW_GAP;
        } else {
          kids.forEach(function(c){ layout(c, depth + 1); });
          node.__y = (kids[0].__y + kids[kids.length - 1].__y) / 2;
        }
        nodeList.push(node);
      }
      layout(tree, 0);

      var width = (maxDepth + 1) * COL_W + PAD_X * 2 + 140;
      var height = Math.max(rowCursor - ROW_GAP, 30) + PAD_Y * 2;

      function nodeBoxHTML(node){
        var lineCount = node.__lines.length;
        var boxH = boxHeightFor(node.__lines);
        var boxW = Math.min(COL_W - 26, 20 + Math.max.apply(null, node.__lines.map(function(l){ return l.length; })) * 6.4);
        boxW = Math.max(boxW, 64);
        var cls = "sh-mmap-node" + (node.__depth === 0 ? " sh-mmap-node-root" : (node.children && node.children.length ? " sh-mmap-node-branch" : " sh-mmap-node-leaf"));
        var x = node.__x, y = node.__y;
        var rectY = y - boxH / 2;
        var textY = y - ((lineCount - 1) * LINE_H) / 2 + 4;
        var tspans = node.__lines.map(function(line, i){
          return '<tspan x="' + (x + boxW / 2) + '" y="' + (textY + i * LINE_H) + '">' + escMM(line) + '</tspan>';
        }).join("");
        node.__boxW = boxW; node.__boxH = boxH;
        return '<rect class="' + cls + '" x="' + x + '" y="' + rectY + '" width="' + boxW + '" height="' + boxH + '" rx="' + (node.__depth === 0 ? 12 : 9) + '"></rect>' +
          '<text class="sh-mmap-label" text-anchor="middle">' + tspans + '</text>';
      }
      function escMM(s){ return String(s == null ? "" : s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }

      // nodeBoxHTML (below) sets __boxW/__boxH on every node as it runs, so
      // links are collected AFTER that pass, once every box's real width is known.
      var nodesSVG = nodeList.map(nodeBoxHTML).join("");
      var linksSVG = "";
      (function collectLinks(node){
        (node.children || []).forEach(function(c){
          var x1 = node.__x + node.__boxW, y1 = node.__y;
          var x2 = c.__x, y2 = c.__y;
          var midX = (x1 + x2) / 2;
          linksSVG += '<path class="sh-mmap-link" d="M' + x1 + ',' + y1 + ' C' + midX + ',' + y1 + ' ' + midX + ',' + y2 + ' ' + x2 + ',' + y2 + '"></path>';
          collectLinks(c);
        });
      })(tree);

      var accent = opts.accent || "var(--ink)";
      container.innerHTML = '<div class="sh-mmap-scroll">' +
        '<svg class="sh-mmap-svg" viewBox="0 0 ' + width + ' ' + height + '" style="min-width:' + Math.max(width, 480) + 'px; --mmap-accent:' + accent + ';">' +
        linksSVG + nodesSVG +
        '</svg></div>';
    }
  };

  /* ---------- the rank and mastery after every tenth answer, worked out on the page (2026-11-19) ----------
     The database optimization pass, phase 2. widget/ranks.js read get_rank_profile_v2 and get_hub_mastery again after
     every tenth answer: two reads every ten answers, from every student. On the game layer each answer's reply carries
     the XP total, and the page knows each question's last try (the bootstrap's answers, then every reply), so
     shRankLocal(profile, rows) works out what those reads would say: the profile with the new XP, double XP, answers and
     right answers, and this hub's mastery row. It says null, and ranks.js reads as before, when something it can't count
     may have changed: a new trophy sent from this page (sh:trophy-sent: widget/eggs.js, the bowling egg), a medal in a
     reply, the streak of days paying, a new Central day, 100 or 1,000 answers, a run of right answers that could reach 25
     or 100, a mock's or a game's answers, a question with no known last try (more than the bootstrap's 5,000 answers), a
     read short of the answers paid, and at least every 50 answers. Every read (sh:rank-profile with its rows) is the new
     base. It lives here, not in ranks.js, because ranks.js goes to the dashboard too, whose page budget has no room. */
  var RL = { hist: null, full: false, row: null, base: null, n: 0, right: 0, miss: false, run: 0, paid: 0, dirty: true, total: 0, boost: undefined, day: "", mine: false };
  function rlDay(){ try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date()); } catch (e) { return ""; } }
  bootstrap.ready.then(function(data){
    if (!data || !Array.isArray(data.answers) || !Array.isArray(data.mastery)) return;
    RL.hist = {}; data.answers.forEach(function(a){ if (Array.isArray(a)) RL.hist[String(a[0])] = !!a[2]; });
    RL.full = data.answers.length < 5000;
  }, function(){});
  document.addEventListener("sh:rank-profile", function(e){
    var d = e.detail || {}, p = d.profile;
    if (RL.mine) { RL.mine = false; return; }   /* shRankLocal's own answer, not a read */
    if (!p || p.journey == null) return;
    var rows = Array.isArray(d.rows) ? d.rows : null, row = rows && rows.filter(function(r){ return r.hub === HUB; })[0];
    /* a read whose count of answers is short of what this page has seen paid may have missed one: the next tenth reads */
    var missed = RL.base ? (p.answers | 0) < RL.base.answers + RL.n : RL.paid > 0;
    if (rows) RL.row = { latest_correct: row ? row.latest_correct | 0 : 0, seen: row ? row.seen | 0 : 0 };
    RL.base = { answers: p.answers | 0, correct: p.correct | 0, best_run: p.best_run | 0 };
    RL.total = p.xp | 0; RL.boost = undefined; RL.n = 0; RL.right = 0; RL.miss = false; RL.run = 0; RL.day = rlDay();
    RL.dirty = missed || !rows;
  });
  document.addEventListener("sh:trophy-sent", function(){ RL.dirty = true; });
  /* an answer's reply: the XP total, the double XP, the answers and runs, the question's last try */
  function rlPaid(d, r){
    if (!r || r.repeat || r.ok === false) return;
    RL.paid++;
    if (typeof r.total === "number") RL.total = Math.max(RL.total, r.total);
    if (r.boost !== undefined) RL.boost = r.boost;
    var c = r.correct === true, q = String((d && d.qid) || "");
    RL.n++; if (c) { RL.right++; RL.run++; } else { RL.miss = true; RL.run = 0; }
    if (r.medal || d.session || d.ctx === "mock" || d.ctx === "arcade" ||
        (Array.isArray(r.bonus) && r.bonus.some(function(b){ return b && b.src === "streak"; }))) RL.dirty = true;
    if (!RL.hist || !RL.row || !q) { RL.dirty = true; return; }
    var was = RL.hist[q];
    if (was === undefined) { if (!RL.full) RL.dirty = true; else { RL.row.seen++; if (c) RL.row.latest_correct++; } }
    else if (was !== c) RL.row.latest_correct += c ? 1 : -1;
    RL.hist[q] = c;
  }
  window.shRankLocal = function(p, rows){
    if (GAME.on !== true || !p || p.journey == null || !RL.hist || !RL.row || !RL.base) return null;
    if (RL.dirty || RL.n >= 50 || RL.day !== rlDay()) return null;
    var B = RL.base, a = B.answers + RL.n, can = RL.miss ? RL.run : B.best_run + RL.run;
    if ((B.answers < 100 && a >= 100) || (B.answers < 1000 && a >= 1000)) return null;
    if ((B.best_run < 25 && can >= 25) || (B.best_run < 100 && can >= 100)) return null;
    var q = {}, k; for (k in p) q[k] = p[k];
    q.xp = Math.max(p.xp | 0, RL.total); q.answers = a; q.correct = B.correct + RL.right;
    if (RL.boost !== undefined) q.boost = RL.boost;
    RL.mine = true;
    return [q, (rows || []).filter(function(r){ return r.hub !== HUB; }).concat([{ hub: HUB, latest_correct: RL.row.latest_correct, seen: RL.row.seen }])];
  };

  /* ---------- easter eggs live in widget/eggs.js; these are the hooks they use ---------- */
  window.shEggHooks = {
    hub: HUB, answeredEvent: ANSWERED_EVENT, visitor: VISITOR_ID, supabase: supabase, bootstrap: bootstrap.ready,
    v2: function(){ return GAME.on === true; },
    /* always true (shGame.live): every page is on the game layer, also before the page knows, as when its bootstrap
       timed out in a busy minute */
    live: function(){ return true; },
    send: function(payload){ try { if (channel) channel.send({ type: "broadcast", event: "egg", payload: payload }); } catch (e) {} },
    name: displayName, section: currentSection, online: function(){ return onlineCount; },
    toast: showStreakToast, confetti: fireConfetti, prefGet: prefGet, prefSet: prefSet, esc: esc,
    statsPanel: function(){ return document.getElementById("shstat-panel"); },
    srs: srsLoad, day: srsDay
  };
  /* The widget's other files: each its own <script> beside this one, or run from a redesigned page's bundle
     (window.SH_BUNDLE, tools/bundle/build.mjs). then: once it has run; fail: it couldn't be fetched. */
  function widgetFile(file, then, fail){
    var B = window.SH_BUNDLE;
    if (B && B.has(file)) { setTimeout(function(){ try { B.run(file); } finally { if (then) then(); } }, 0); return; }
    var s = document.createElement("script");
    s.src = new URL(file, thisScript.src).href; s.async = true;
    if (then) s.onload = then;
    if (fail) s.onerror = fail;
    document.head.appendChild(s);
  }
  if (!EXPORT_ONLY) widgetFile("eggs.js");
  /* handpiece ranks, trophies, accent unlocks, link my devices: widget/ranks.js (the art and lists, shared with the
     dashboard) and widget/ranks-hub.js (the hub widget, shRanks.mount: a hub's only, 2026-11-19) */
  if (!EXPORT_ONLY) widgetFile("ranks.js", function(){
    if (window.shRanks) widgetFile("ranks-hub.js", function(){ if (window.shRanks.mount) window.shRanks.mount(window.shEggHooks); });
  });
  /* tooth buddy (widget/pet.js): Timmy Tooth, in the bottom-left corner. Everyone has Timmy (the redesign's release):
     he loads for everyone, with no adoption, and wears what's on at his place (the v2 bootstrap's shop; on an old
     single-file hub, which has no shop, the outfit kept on the device). */
  var petLoading = false;
  function loadPet(then){
    if (window.shPet) { if (then) then(); return; }
    if (petLoading || EXPORT_ONLY) return;
    petLoading = true;
    widgetFile("pet.js", function(){ if (window.shPet) window.shPet.mount({ where: "hub", H: window.shEggHooks, bootstrap: bootstrap.ready }); trackPresence(); if (then) then(); });
  }
  window.shLoadPet = loadPet;
  if (!EXPORT_ONLY) loadPet();
  /* TIMMY (widget/timmy.js): type his name anywhere for a 15-second show */
  if (!EXPORT_ONLY && !window.__timmyLoaded) widgetFile("timmy.js");
  /* motion (widget/fx.js): answer feedback, the streak flame, bar fills, view fades, the exam-day countdown pill and the mock results card */
  if (!EXPORT_ONLY) widgetFile("fx.js", function(){ if (window.shFx) window.shFx.mount(window.shEggHooks); });
  /* highlighter (widget/highlight.js): select text in the lecture notes to highlight it, saved on this device */
  if (!EXPORT_ONLY) widgetFile("highlight.js", function(){ if (window.shHighlight) window.shHighlight.mount(HUB); });
  /* Timmy Time (widget/podcast.js): a hub's audio review episode, if the hub defines window.SH_PODCAST
     (not on an archived hub whose audio came off: data-audio="off") */
  if (!EXPORT_ONLY && window.SH_PODCAST && !AUDIO_OFF) widgetFile("podcast.js", function(){ if (window.shPodcast) window.shPodcast.mount(HUB); });
  /* question health (widget/qhealth.js): time on each question, abandonment, the explanation, tries and the "Good question?"
     thumbs, sent to record_qh / qh_vote for the admin page's Question health tab (migration_v51). Flags are for review only. */
  if (!EXPORT_ONLY) widgetFile("qhealth.js", function(){
    if (window.shQH) window.shQH.mount({ hub: HUB, answeredEvent: ANSWERED_EVENT, visitor: VISITOR_ID, visit: VISIT_ID, supabase: supabase,
      sbUrl: supabase ? SB_URL : "", sbKey: SB_KEY, automated: AUTOMATED, hist: function(){ return qhHist; } });
  });
  /* guided tour (widget/tour.js): a hub that never asks on arrival (SH_TOUR.prompt === false: every hub on the engine) loads
     it when the tour is started (window.shLoadTour, from More's "Take the tour"). The old pages' Tour buttons
     ([data-sh-tour]) came out on 2026-11-25. */
  var tourLoading = false;
  function loadTour(then){
    if (window.shTour) { if (then) then(); return; }
    if (tourLoading || EXPORT_ONLY) return;
    tourLoading = true;
    widgetFile("tour.js", function(){ tourLoading = false; if (window.shTour) window.shTour.mount({ where: "hub", hub: HUB, section: currentSection }); if (then) then(); },
      function(){ tourLoading = false; });
  }
  window.shLoadTour = loadTour;
  if (!EXPORT_ONLY && !(window.SH_TOUR && window.SH_TOUR.prompt === false)) loadTour();
  /* daily drill (widget/drill.js): today's set, from what you missed, what's due and high-yield questions, which the hub
     shows as a set of its Question Bank (#questions/drill) */
  if (!EXPORT_ONLY) widgetFile("drill.js", function(){ if (window.shDrill) window.shDrill.mount(window.shEggHooks); });
  /* archived notice: the dashboard archives a hub at 10 pm on the day of its last exam (index.html, ARCHIVE_HOUR; an exam's
     archiveHour overrides it, e.g. 24 for one due at 11:59 pm; SH_EXPORT.archiveOn can override the date for a temporary reopen);
     a hub page still reachable after that says so once per visit, with a way back to the dashboard.
     An override set on the admin page (review/, Hubs tab; get_hub_overrides, migration_v50) wins over the dates while it is
     in force, the same rule as widget/archive.js: archived or hidden shows the notice, live doesn't. If the network is slow
     (3 s) the dashboard's last copy of the overrides decides, else the dates. */
  (function(){
    if (EXPORT_ONLY) return;
    var last = null;
    ((window.SH_EXPORT && window.SH_EXPORT.exams) || []).forEach(function(x){
      var p = String((x && x.date) || "").split("-").map(Number); if (p.length !== 3 || !p[0]) return;
      var d = new Date(p[0], p[1] - 1, p[2], x.archiveHour != null ? x.archiveHour : 22);
      if (!last || d > last.at) last = { at: d, x: x };
    });
    var archiveOn = window.SH_EXPORT && window.SH_EXPORT.archiveOn;
    if (archiveOn && archiveOn.date){
      var p = String(archiveOn.date).split("-").map(Number);
      if (p.length === 3 && p[0]){
        var d = new Date(p[0], p[1] - 1, p[2], archiveOn.hour != null ? archiveOn.hour : 22);
        if (!last || d > last.at) last = { at: d, x: last && last.x ? last.x : { label:"exam" } };
      }
    }
    var byDates = !!(last && new Date() >= last.at);
    try { if (sessionStorage.getItem("sh_archived_seen_" + HUB)) return; } catch (e) {}
    var OV_KEY = "sh_hub_overrides";
    function overrideIn(rows){
      var o = null; (rows || []).forEach(function(r){ if (r && r.hub === HUB) o = r; });
      if (!o || ["live", "archived", "hidden"].indexOf(o.state) < 0) return null;
      if (o.until && new Date() >= new Date(o.until)) return null;
      return o;
    }
    function cached(){ try { var c = JSON.parse(localStorage.getItem(OV_KEY) || "null"); return c && Array.isArray(c.rows) && Date.now() - c.t < 7 * 864e5 ? c.rows : null; } catch (e) { return null; } }
    var decided = false;
    function decide(rows){
      if (decided) return; decided = true;
      var o = overrideIn(rows);
      if (!(o ? o.state !== "live" : byDates)) return;
      try { sessionStorage.setItem("sh_archived_seen_" + HUB, "1"); } catch (e) {}
      var early = !byDates;   /* archived by hand before its last exam passed */
      if (document.body) show(early); else document.addEventListener("DOMContentLoaded", function(){ show(early); });
    }
    if (supabase) {
      var wait = setTimeout(function(){ decide(cached()); }, 3000);
      function useRows(rows){
        clearTimeout(wait);
        if (Array.isArray(rows)) { try { localStorage.setItem(OV_KEY, JSON.stringify({ t: Date.now(), rows: rows })); } catch (e) {} decide(rows); }
        else decide(cached());
      }
      function fallback(){
        /* when the bootstrap (get_widget_bootstrap_v2, which carries them) didn't answer, as in a busy minute */
        try { supabase.rpc("get_hub_overrides").then(function(r){ useRows(r && !r.error ? r.data : null); }, function(){ useRows(null); }); } catch (e) { useRows(null); }
      }
      bootstrap.ready.then(function(data){
        if (data && Array.isArray(data.overrides)) useRows(data.overrides); else fallback();
      }, fallback);
    } else decide(cached());
    function show(early){
      var box = document.createElement("div");
      box.className = "sh-archived"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "This hub is archived");
      box.innerHTML = '<div class="sh-archived-card"><b>This hub is archived</b>' +
        (early || !last
          ? '<p>Everything still works if you want to look back, but it isn\u2019t being updated right now.</p>'
          : '<p>It closed after ' + esc(/^exam\b/i.test(last.x.label || "") ? last.x.label : "the " + (last.x.label || "exam")) + ' on ' + esc(last.at.toLocaleDateString(undefined, { month: "long", day: "numeric" })) +
            '. Everything still works if you want to look back, but it is no longer updated. Tell us how the exam went from the dashboard.</p>') +
        '<div class="sh-archived-foot"><button type="button" class="sh-archived-stay">Keep browsing</button>' +
        '<a class="sh-archived-go" href="' + new URL("../", thisScript.src).href + '">Go to the dashboard</a></div></div>';
      box.addEventListener("click", function(e){ if (e.target === box || e.target.closest(".sh-archived-stay")) box.remove(); });
      document.body.appendChild(box);
    }
  })();
  /* ---------- lecture notes: drawn figures that fit on screen with their controls (Sam, 2026-11-03). --sh-vh (the screen
     height in the page's zoomed px; the text-size setting zooms <html>, where 100vh overshoots) lets widget/hub.css and
     v3.css size the figures and the notes' lecture list. The old pages' lecture pager (Previous / Next and Report under
     their .notes-layout) and its measuring of their top bar came out on 2026-11-25: the engine draws its own
     (widget/hub.js). ---------- */
  if (!EXPORT_ONLY) (function(){
    var root = document.documentElement;
    function zoom(){ try { return parseFloat(getComputedStyle(root).zoom) || parseFloat(root.style.zoom) || 1; } catch (e) { return 1; } }
    /* write only what changed: a write makes the browser lay the page out again (a slow phone felt it after Home, 2026-11-20) */
    function setVar(k, v){ if (root.style.getPropertyValue(k) !== v) root.style.setProperty(k, v); }
    function fit(){
      setVar("--sh-vh", (window.innerHeight / zoom()) + "px");
      fitFigs();
    }
    /* A drawn figure with controls (.anima: figure.iso-figure, then .am-controls and readouts) stays pinned under the top bar
       while its controls and explanation scroll up beside it, so the picture and what you change are on screen together.
       Only on wide screens, only when the picture fits in about 70% of the screen (v3.css caps the drawing's height). */
    function fitFigs(){
      var all = document.querySelectorAll(".anima"); if (!all.length) return;
      var wide = window.matchMedia("(min-width: 861px)").matches;
      var room = window.innerHeight / zoom();
      all.forEach(function(a){
        var figs = a.querySelectorAll(":scope > figure.iso-figure"), ctl = a.querySelector(":scope > .am-controls");
        var f = figs.length === 1 && ctl ? figs[0] : null;
        a.querySelectorAll(":scope > figure.sh-fig-pin").forEach(function(x){ if (x !== f) x.classList.remove("sh-fig-pin"); });
        if (!f) return;
        f.classList.remove("sh-fig-pin");
        var ok = wide && f.offsetHeight > 0 && f.offsetHeight <= room * 0.7 && a.offsetHeight > f.offsetHeight + 60;
        f.classList.toggle("sh-fig-pin", ok);
      });
    }
    var queued = false, lastFigs = [];
    function scan(){
      queued = false;
      /* re-measure figures only when the set on the page changed (the page changes a lot: clocks, timers, animations) */
      var figs = Array.prototype.slice.call(document.querySelectorAll(".anima"));
      if (figs.length !== lastFigs.length || figs.some(function(f, i){ return f !== lastFigs[i]; })) { lastFigs = figs; fitFigs(); }
    }
    function queue(){ if (!queued) { queued = true; requestAnimationFrame(scan); } }
    function start(){
      fit(); scan();
      new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
      window.addEventListener("resize", fit);
      /* a tab or mode switch can show figures that were already on the page, hidden */
      document.addEventListener("click", function(){ setTimeout(fitFigs, 80); }, true);
      document.addEventListener("sh:pref", function(){ setTimeout(fit, 30); });
    }
    /* in the next frame, not in the script that loads the widget: fit() measures, and with v3.css just put in that laid the
       whole page out inside this script (about 65 ms of its 190 on perf.js's slow phone, 2026-11-20); in a frame the browser
       lays the page out once anyway (a tab opened in the background runs it when it's first shown) */
    function soon(){ if (window.requestAnimationFrame) requestAnimationFrame(start); else start(); }
    if (document.body) soon(); else document.addEventListener("DOMContentLoaded", soon);
  })();
  /* click analytics (widget/clicks.js): what people use, for improving each hub */
  /* the clicks and events go with question health's rows in one call (shAnalytics.send, migration_v82): widget/clicks.js
     sends through the client it is given, and here that client hands its two calls to the batch. (clicks.js itself is
     unchanged: it goes to the dashboard too, which still makes its two calls; its page budget had no room.) */
  var clicksSb = !supabase ? null : { rpc: function(fn, a){
    if ((fn === "record_clicks" || fn === "record_events") && a && Array.isArray(a.p_items)) { window.shAnalytics.send(fn === "record_clicks" ? "clicks" : "events", a.p_items); return Promise.resolve({ data: null, error: null }); }
    return supabase.rpc(fn, a);
  } };
  if (!EXPORT_ONLY && supabase) widgetFile("clicks.js", function(){ if (window.shClicks) window.shClicks.start({ sb: clicksSb, hub: HUB, visitor: VISITOR_ID, section: currentSection }); });
  /* replies (widget/replies.js): tells someone once when their report or suggestion has been dealt with, plus notices to everyone */
  if (!EXPORT_ONLY && supabase) widgetFile("replies.js", function(){ if (window.shReplies) window.shReplies.start({ sb: supabase, visitor: VISITOR_ID, hub: HUB, bootstrap: bootstrap.ready }); });
  /* "Is this your other device?" (widget/linkask.js): offers to link devices that use the same name */
  if (!EXPORT_ONLY && supabase) widgetFile("linkask.js", function(){ if (window.shLinkAsk) window.shLinkAsk.start({ sb: supabase, hub: HUB, section: currentSection, bootstrap: bootstrap.ready, bootstrapName: bootstrap.linkName }); });
})();
