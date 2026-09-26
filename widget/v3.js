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

  /* ---------- back-to-index button ----------
     Prefers a slot each hub's own sticky header/ribbon markup provides
     (#sh-ribbon-back) so the button sits inline with content that's already
     there, instead of a second fixed bar stacked above it -- that separate
     bar pushed every hub's own header down by its own height just to show
     one link. Falls back to the old fixed #sh-topbar bar (plus the
     reserveTopClearance dance below) for any hub that hasn't added the slot
     yet, so nothing breaks if one is ever added without it. ---------- */
  var BACK_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3"/><path d="M7 4 3 8l4 4"/></svg>';
  var ribbonBack = document.getElementById("sh-ribbon-back");
  var usingRibbon = !!ribbonBack;
  if (usingRibbon) {
    ribbonBack.innerHTML = BACK_ICON;
    if (!ribbonBack.getAttribute("href")) ribbonBack.setAttribute("href", "../../index.html");
  } else {
    var topbar = document.createElement("div");
    topbar.id = "sh-topbar";
    document.body.appendChild(topbar);
    (function(){
      var a = document.createElement("a");
      a.id = "shhome-pill";
      a.href = "../../index.html";
      a.innerHTML = BACK_ICON + '<span>All hubs</span>';
      topbar.appendChild(a);
    })();
  }

  /* ---------- reserve top clearance so the fixed "All hubs" pill / name badge
     never sits on top of each hub's own sticky header/title. Every hub uses
     exactly one <header> element for its top bar (position:sticky;top:0), so
     that's the one hub-agnostic anchor point we push down + re-pin, rather
     than hand-tuning per-hub CSS. Re-measured on resize (mobile breakpoint
     changes pill size) and whenever the name badge's visibility changes.

     Pushing the header's sticky offset down opens up a plain top:0..clearance
     band that the header's own box no longer covers. Once the header is
     actually stuck (scrolled), whatever page content is passing underneath
     keeps painting through that band behind the fixed pill/badge — a solid
     backdrop the same color as the page fixes it, so it reads as one
     continuous bar instead of scrolled content bleeding through above the
     header. ---------- */
  function reserveTopClearance(){
    if (usingRibbon) return; // back button + name badge live in the hub's own ribbon -- nothing fixed to reserve space for
    try{
      var bar = document.getElementById("sh-topbar");
      if(!bar) return;
      var bottom = bar.getBoundingClientRect().bottom;
      if(bottom <= 0) return;
      var clearance = Math.ceil(bottom + 10);
      var styleEl = document.getElementById("sh-top-clearance-style");
      if(!styleEl){
        styleEl = document.createElement("style");
        styleEl.id = "sh-top-clearance-style";
        document.head.appendChild(styleEl);
      }
      var header = document.querySelector("header");
      var headerRule = "";
      if(header && getComputedStyle(header).position === "sticky"){
        headerRule = "header{top:" + clearance + "px !important;}";
      }
      styleEl.textContent = "body{padding-top:" + clearance + "px;}" + headerRule;

      var backdrop = document.getElementById("sh-top-backdrop");
      if(!backdrop){
        backdrop = document.createElement("div");
        backdrop.id = "sh-top-backdrop";
        document.body.appendChild(backdrop);
      }
      var pageBg = getComputedStyle(document.body).backgroundColor;
      backdrop.style.cssText = "position:fixed;top:0;left:0;right:0;height:" + clearance +
        "px;background:" + pageBg + ";z-index:9998;pointer-events:none;";
    }catch(e){ /* purely cosmetic, never block the hub */ }
  }
  window.shReserveTopClearance = reserveTopClearance;
  reserveTopClearance();
  window.addEventListener("resize", (function(){
    var t = null;
    return function(){ clearTimeout(t); t = setTimeout(reserveTopClearance, 150); };
  })());
  /* a light/dark ("nightshift") toggle flips a class on <body> in every hub;
     re-measure so the backdrop color picks up the new background instead of
     staying stuck on whatever theme was active on page load. */
  try{
    new MutationObserver((function(){
      var t = null;
      return function(){ clearTimeout(t); t = setTimeout(reserveTopClearance, 50); };
    })()).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }catch(e){}

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
  window.shTTS = (function(){
    var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
    var activeBtn = null, activeWords = null, wordCursor = -1;
    var activeAudioEl = null;
    var bestVoice = null;
    var VOICE_PREF_KEY = "sh_tts_voice_name";
    var pickers = [];

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
        if (activeBtn === btn && activeWords) {
          var resumeIdx = Math.max(wordCursor, 0);
          if (synth) { try { synth.cancel(); } catch (e) {} }
          speakFrom(activeWords, resumeIdx, btn);
        }
      });
      btn.insertAdjacentElement("afterend", select);
      pickers.push(select);
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
      if (synth) { try { synth.cancel(); } catch (e) {} }
      if (activeBtn) setState(activeBtn, "idle");
      clearHighlight();
      activeBtn = null; activeWords = null; wordCursor = -1;
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
        } else if (node.nodeType === 1 && !/^(SCRIPT|STYLE)$/i.test(node.tagName)) {
          Array.prototype.slice.call(node.childNodes).forEach(walk);
        }
      }
      Array.prototype.slice.call(container.childNodes).forEach(walk);
      return words;
    }

    function speakFrom(words, startIdx, btn, voiceOverride){
      if (!synth) return;
      var text = words.slice(startIdx).map(function(w){ return w.text; }).join(" ").replace(/\s+/g, " ").trim();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1;
      var chosenVoice = voiceOverride !== undefined ? voiceOverride : bestVoice;
      if (chosenVoice) u.voice = chosenVoice;
      wordCursor = startIdx - 1;
      var handledError = false;
      u.onboundary = function(ev){
        if (ev.name && ev.name !== "word") return;
        wordCursor++;
        clearHighlight();
        var w = words[wordCursor];
        if (w) w.el.classList.add("sh-tts-active");
      };
      u.onend = function(){
        if (handledError) return;
        if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; clearHighlight(); }
      };
      // Some cloud-backed voices ("Online"/"Natural") can silently fail if
      // their network call doesn't go through. Rather than going dead with
      // no sound and no feedback, retry once on a plain local voice so
      // something is always audible.
      u.onerror = function(){
        handledError = true;
        var fallback = pickFallbackVoice();
        if (fallback && (!chosenVoice || chosenVoice.name !== fallback.name)) {
          speakFrom(words, startIdx, btn, fallback);
          return;
        }
        if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; clearHighlight(); }
      };
      activeBtn = btn;
      activeWords = words;
      setState(btn, "playing");
      synth.speak(u);
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
        w.el.addEventListener("click", function(){
          if (synth) { try { synth.cancel(); } catch (e) {} }
          speakFrom(words, i, btn);
        });
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
    var RATE_KEY = "sh_tts_rate", POS_PREFIX = "sh_tts_pos:";
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
        '<select class="sh-tts-rate" aria-label="Playback speed"><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select>';
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
      var dragging = false, lastSave = 0;
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
        var now = Date.now(); if (now - lastSave > 4000) { lastSave = now; savePos(audioUrl, audio.currentTime); }
      });
      audio.addEventListener("pause", function(){ savePos(audioUrl, audio.currentTime); if (activeAudioEl === audio && activeBtn === btn) setState(btn, "paused"); });
      audio.addEventListener("play", function(){ if (activeAudioEl === audio && activeBtn === btn) setState(btn, "playing"); });
      seek.oninput = function(){ dragging = true; if (audio.duration) time.textContent = fmtTime(seek.value / 1000 * audio.duration) + " / " + fmtTime(audio.duration); };
      seek.onchange = function(){ dragging = false; if (audio.duration) { audio.currentTime = seek.value / 1000 * audio.duration; savePos(audioUrl, audio.currentTime); } };
      player.querySelectorAll("[data-skip]").forEach(function(b){ b.onclick = function(){ if (audio.duration) audio.currentTime = Math.min(audio.duration - 1, Math.max(0, audio.currentTime + (+b.getAttribute("data-skip")))); paint(); }; });
      rateSel.onchange = function(){ var r = parseFloat(rateSel.value) || 1; audio.playbackRate = r; try { localStorage.setItem(RATE_KEY, String(r)); } catch (e) {} };
      audio.addEventListener("ended", function(){
        savePos(audioUrl, 0);
        if (activeAudioEl === audio) activeAudioEl = null;
        if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; }
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
    function prefGetSafe(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }

    // Public entry point. audioUrl is optional — pass it when a hub has a
    // pre-generated narration file for the content currently shown in
    // container; omit it (or pass a falsy value) to use the browser's own
    // voice, unchanged from before.
    function speak(container, btn, audioUrl){
      if (!container) return;
      if (activeBtn === btn) {
        if (activeAudioEl) {
          if (activeAudioEl.paused) { activeAudioEl.play(); setState(btn, "playing"); }
          else { activeAudioEl.pause(); setState(btn, "paused"); }
          return;
        }
        if (synth && activeWords) {
          if (synth.speaking && !synth.paused) { synth.pause(); setState(btn, "paused"); return; }
          if (synth.paused) { synth.resume(); setState(btn, "playing"); return; }
        }
      }
      stop();
      if (audioUrl) { playAudioFile(container, btn, audioUrl); return; }
      speakWithSynth(container, btn);
    }

    /* true while a lecture is being read aloud (pre-recorded narration or the browser voice) */
    function listening(){ return !!(activeAudioEl && !activeAudioEl.paused && !activeAudioEl.ended) || !!(synth && synth.speaking && !synth.paused); }
    return { supported: !!synth, speak: speak, stop: stop, listening: listening };
  })();

  /* ---------- universal settings: font, text size, screen name — applied
     immediately (independent of Supabase) so a returning visitor's choices
     take effect on load, not just after opening the Settings panel. Each hub
     already exposes --font-body/--font-display/--font-mono as root CSS custom
     properties (the shared design-token pattern), so remapping --font-body
     here reaches every hub without touching their own stylesheets. ---------- */
  var SH_FONT_KEY = "sh_pref_font";
  var SH_SIZE_KEY = "sh_pref_size";
  var SH_MUSIC_KEY = "sh_pref_music";
  var SH_VOLUME_KEY = "sh_pref_volume";
  var SH_NAME_KEY = "sh_display_name";
  var SH_VISITS_KEY = "sh_visit_count";
  var SH_NUKE_PREF_KEY = "sh_pref_nuke_alerts";
  var NUKE_STREAK_THRESHOLD = 100;
  var NUKE_IMG_BASE = (function(){
    try { return new URL("img/", thisScript.src).href; } catch (e) { return "img/"; }
  })();
  var NUKE_VID_BASE = (function(){
    try { return new URL("vid/", thisScript.src).href; } catch (e) { return "vid/"; }
  })();
  var FONT_STACKS = {
    serif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  };
  var SIZE_ZOOM = { small: 0.9, "default": 1, large: 1.15, xlarge: 1.3, xxlarge: 1.45 };

  function prefGet(key, fallback){
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function prefSet(key, val){ try { localStorage.setItem(key, val); } catch (e) {} }

  function applyFontPref(){
    var stack = FONT_STACKS[prefGet(SH_FONT_KEY, "default")];
    if (stack) document.documentElement.style.setProperty("--font-body", stack);
    else document.documentElement.style.removeProperty("--font-body");
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
  /* ---------- spaced review ("Due today"): a missed question comes back tomorrow; a correct
     one comes back after 1, 3, 7, 14, then 30 days. Stored per hub on this device. ---------- */
  var SRS_KEY = "sh_srs_" + HUB, SRS_STEPS = [1, 3, 7, 14, 30];
  function srsDay(offset){ var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + (offset || 0)); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function srsLoad(){ try { return JSON.parse(localStorage.getItem(SRS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function srsRecord(qid, correct){
    if (!qid) return;
    var all = srsLoad(), r = all[qid] || { b: 0 };
    if (correct) { r.b = Math.min(r.b + 1, SRS_STEPS.length); r.due = srsDay(SRS_STEPS[r.b - 1]); }
    else { r.b = 0; r.due = srsDay(1); }
    all[qid] = r;
    try { localStorage.setItem(SRS_KEY, JSON.stringify(all)); } catch (e) {}
  }
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
     A hub's "X% of the class got this right" placeholder (every hub that
     has one just says "Loading class data..." forever and nothing ever
     fills it in -- there was no code anywhere that fetched it). Two-part
     API so each hub keeps its own card markup/classnames:

     - window.shGetClassStats(qids, cb) -- low-level: cb receives a
       {qid: {total, correct}} map. Calls made within a short window all
       get coalesced into one get_question_class_stats RPC instead of one
       round trip per question.
     - window.shWireClassStats(cardSelector) -- high-level: pass the CSS
       selector for a hub's own question-card wrapper (must carry
       data-qid) and this finds every [data-role="classdata-result"]
       inside matching cards -- present ones now, future ones via a
       MutationObserver so it keeps working as more cards render (quiz
       bank, search results, wherever) -- and fills each in. ---------- */
  var classStatsPending = [];
  var classStatsCallbacks = [];
  var classStatsTimer = null;
  function flushClassStats(){
    var qids = classStatsPending, cbs = classStatsCallbacks;
    classStatsPending = []; classStatsCallbacks = [];
    var unique = qids.filter(function(v, i, a){ return a.indexOf(v) === i; });
    if (!supabase || !unique.length) { cbs.forEach(function(cb){ cb({}); }); return; }
    /* question_stats(hub,qid,attempts,correct) already exists and is already
       read anonymously elsewhere (the "Toughest questions" panel above) --
       reuse it rather than adding a new table/RPC for the same data. */
    supabase.from("question_stats").select("qid,attempts,correct").eq("hub", HUB).in("qid", unique).then(function(res){
      var byQid = {};
      ((res && res.data) || []).forEach(function(r){ byQid[r.qid] = { total: r.attempts, correct: r.correct }; });
      cbs.forEach(function(cb){ cb(byQid); });
    }, function(){ cbs.forEach(function(cb){ cb({}); }); });
  }
  window.shGetClassStats = function(qids, cb){
    if (!qids || !qids.length || typeof cb !== "function") return;
    classStatsPending = classStatsPending.concat(qids);
    classStatsCallbacks.push(cb);
    clearTimeout(classStatsTimer);
    classStatsTimer = setTimeout(flushClassStats, 150);
  };
  /* a small Report button on every question card; it opens the flag panel already
     tagged with that question's id, so reports arrive with context */
  var FLAG_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V4"/><path d="M6 4.5c3.5-2 6.5 2 10 0v8c-3.5 2-6.5-2-10 0"/></svg>';
  var pendingFlagQid = null;
  function addFlagButton(card){
    if (card.__shFlagBtn) return; card.__shFlagBtn = true;
    var qid = card.getAttribute("data-qid"); if (!qid) return;
    var top = card.querySelector(".qcard-top") || card;
    var b = document.createElement("button");
    b.type = "button"; b.className = "sh-qflag"; b.innerHTML = FLAG_ICON_SM + "Report";
    b.setAttribute("aria-label", "Report a problem with this question");
    b.addEventListener("click", function(ev){ ev.stopPropagation(); if (window.shOpenFlag) window.shOpenFlag(qid); });
    top.appendChild(b);
  }
  window.shWireClassStats = function(cardSelector){
    // Dedup key is the *element*, not the qid: the same question re-appears
    // in fresh card instances all the time (switching a filter, revisiting a
    // tab, the same question turning up again in the game) since most views
    // replace a container's innerHTML wholesale rather than reusing nodes.
    // Keying "seen" on qid alone marked the question done forever after its
    // very first render anywhere on the page, so every later re-render of
    // that same question got silently skipped and sat stuck on
    // "Loading class data..." -- which is exactly what was reported.
    function handleCard(card){
      addFlagButton(card);
      var qid = card.getAttribute("data-qid");
      var el = card.querySelector('[data-role="classdata-result"]');
      if (!qid || !el || el.__shClassDataWired) return;
      el.__shClassDataWired = true;
      window.shGetClassStats([qid], function(byQid){
        var r = byQid[qid];
        if (!r || !r.total) { el.textContent = "Not enough class data yet"; return; }
        var pct = Math.round((r.correct / r.total) * 100);
        el.textContent = pct + "% of the class got this right (n=" + r.total + ")";
        el.classList.remove("is-ok", "is-bad");
        if (pct >= 70) el.classList.add("is-ok");
        else if (pct < 50) el.classList.add("is-bad");
      });
    }
    try {
      document.querySelectorAll(cardSelector).forEach(handleCard);
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          (m.addedNodes || []).forEach(function(node){
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(cardSelector)) handleCard(node);
            if (node.querySelectorAll) node.querySelectorAll(cardSelector).forEach(handleCard);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* cosmetic-only feature, never block the hub */ }
  };

  /* ---------- your name: always shown in the top bar (custom, or the random class name such as
     "Gleaming Molar"), with a pencil. Tapping it opens a small editor right there; the Settings and
     Stats name boxes use the same save/reset code. ---------- */
  var nameBadge = document.getElementById("sh-ribbon-name");
  if (!nameBadge) {
    nameBadge = document.createElement("button");
    nameBadge.id = "shname-badge";
    nameBadge.type = "button";
    nameBadge.hidden = true;
    (document.getElementById("sh-topbar") || document.body).appendChild(nameBadge);
  }
  nameBadge.classList.add("sh-name-edit");
  var PENCIL_SVG = '<svg class="sh-name-pencil" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  function renderNameBadge(){
    var n = currentName() || resolvedAnonName;
    if (n) {
      nameBadge.innerHTML = '<span class="sh-name-text">' + esc(n) + '</span>' + PENCIL_SVG;
      nameBadge.title = "Change the name classmates see on the leaderboards";
      nameBadge.setAttribute("aria-label", "Your name: " + n + ". Change it");
      nameBadge.hidden = false;
    } else { nameBadge.hidden = true; }
    if (window.shReserveTopClearance) window.shReserveTopClearance();
  }
  function syncNameInputs(){
    var n = currentName();
    ["shset-name-input", "shstat-name-input"].forEach(function(id){
      var el = document.getElementById(id); if (!el) return;
      el.value = n;
      if (resolvedAnonName) el.placeholder = "Right now you're " + resolvedAnonName;
    });
  }
  function saveName(name){
    name = String(name || "").trim().slice(0, 24);
    if (!name) return false;
    safeRpc("set_display_name", { p_visitor: VISITOR_ID, p_name: name });
    prefSet(SH_NAME_KEY, name);
    renderNameBadge(); syncNameInputs();
    try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: name } })); } catch (e) {}
    return true;
  }
  function resetName(){
    try { localStorage.removeItem(SH_NAME_KEY); } catch (e) {}
    if (supabase) try {
      supabase.rpc("clear_display_name", { p_visitor: VISITOR_ID }).then(function(res){
        if (res && !res.error && res.data) { resolvedAnonName = res.data; renderNameBadge(); syncNameInputs(); }
      }, function(){});
    } catch (e) {}
    renderNameBadge(); syncNameInputs();
    try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: "" } })); } catch (e) {}
  }
  var nameDlg = null;
  function closeNameEditor(){ if (nameDlg) { nameDlg.remove(); nameDlg = null; } }
  function openNameEditor(){
    closeNameEditor();
    var custom = currentName();
    nameDlg = document.createElement("div");
    nameDlg.className = "sh-name-dlg";
    nameDlg.innerHTML = '<div class="sh-name-card" role="dialog" aria-modal="true" aria-labelledby="sh-name-h">' +
      '<button class="sh-name-x" type="button" aria-label="Close">&times;</button>' +
      '<h4 id="sh-name-h">Your name</h4>' +
      '<p>This is how classmates see you on the leaderboards, streak boards and ranks, in every hub.' +
      (custom ? '' : (resolvedAnonName ? ' Right now you have a random one: <b>' + esc(resolvedAnonName) + '</b>.' : '')) + '</p>' +
      '<form class="sh-name-form"><input type="text" maxlength="24" autocomplete="nickname" enterkeyhint="done" placeholder="Pick a name" value="' + esc(custom) + '">' +
      '<button type="submit">Save</button></form>' +
      '<div class="sh-name-msg" aria-live="polite"></div>' +
      (custom ? '<button class="sh-name-reset" type="button">Go back to a random name</button>' : '<div class="sh-name-hint">Up to 24 characters. You can change it any time.</div>') +
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
  renderNameBadge();
  nameBadge.addEventListener("click", openNameEditor);

  // Welcome-back toast for a returning, named visitor — once per page load,
  // a beat after load so it doesn't collide with anything else appearing.
  (function(){
    var visits = (parseInt(prefGet(SH_VISITS_KEY, "0"), 10) || 0) + 1;
    prefSet(SH_VISITS_KEY, String(visits));
    var n = currentName();
    if (visits > 1 && n) {
      setTimeout(function(){ showStreakToast("Welcome back, " + n); }, 900);
    }
  })();

  /* ---------- background music (procedural — no external audio files, so
     there's nothing to host or license. Web Audio only starts from a real
     user gesture per browser autoplay rules, so this only ever plays when
     triggered from a click — see the Settings panel wiring below. ---------- */
  var shMusic = (function(){
    // Real recorded tracks (widget/audio/*.mp3) played through <audio> elements,
    // replacing the earlier oscillator-synthesized options. AUDIO_BASE is derived
    // from this script's own resolved URL (not the hub page's URL) so it works
    // the same from every hub regardless of folder depth.
    var AUDIO_BASE = (function(){
      try { return new URL("audio/", thisScript.src).href; } catch (e) { return "audio/"; }
    })();
    var TRACKS = {
      rain: "rain.mp3",
      waves: "waves.mp3",
      cafe: "cafe.mp3",
      lofi: "lofi.mp3",
      piano: "piano.mp3"
    };
    var els = {}; // one <audio> element per track, created lazily and reused
    var current = null;
    var volume = (parseInt(prefGet(SH_VOLUME_KEY, "35"), 10) / 100) * 0.85;
    function elFor(track){
      if (els[track]) return els[track];
      var a = new Audio(AUDIO_BASE + TRACKS[track]);
      a.loop = true;
      a.preload = "none";
      a.volume = volume;
      els[track] = a;
      return a;
    }
    function stopAll(){
      Object.keys(els).forEach(function(t){
        try { els[t].pause(); els[t].currentTime = 0; } catch (e) {}
      });
      current = null;
    }
    function setTrack(track){
      if (track === "off" || !TRACKS[track]) { stopAll(); return; }
      if (current === track && !els[track].paused) return;
      stopAll();
      var a = elFor(track);
      try { a.currentTime = 0; } catch (e) {}
      var p = a.play();
      if (p && p.catch) p.catch(function(){}); // autoplay-policy rejection is fine -- setTrack always runs inside a user gesture here, so the next click retries cleanly
      current = track;
    }
    function setVolume(v){
      volume = v * 0.85;
      Object.keys(els).forEach(function(t){ els[t].volume = volume; });
    }
    return { setTrack: setTrack, setVolume: setVolume };
  })();

  /* ---------- tactical-nuke sound effects (widget/sfx/*.mp3) — same
     script-relative-URL pattern as the background-music tracks above, so it
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

  /* No early return here when supabase-js is missing (CDN blocked, offline): search, settings,
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

  /* ---------- resolved display name: the same deterministic dentistry-
     themed name (e.g. "Gleaming Molar") the leaderboard/nuke-analytics/
     correct-streak stats already fall back to when a visitor never opted
     into a custom name -- fetched once so the nuke banner can use it
     instead of the generic word "Someone". Always resolves well before
     NUKE_STREAK_THRESHOLD correct answers could realistically happen. ---------- */
  var resolvedAnonName = "";
  if (supabase) try {
    supabase.rpc("get_display_name", { p_visitor: VISITOR_ID }).then(function(res){
      if (res && !res.error && res.data) { resolvedAnonName = res.data; renderNameBadge(); syncNameInputs(); try { document.dispatchEvent(new CustomEvent("sh:name", { detail: {} })); } catch (e) {} }
    }, function(){});
  } catch (e) {}
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
    if (prefGet(SH_NUKE_PREF_KEY, "on") !== "on") return;
    var payload = (msg && msg.payload) || {};
    playNukeSequence(payload.name || "Someone");
  });
  channel.subscribe(function(status){
    if (status === "SUBSCRIBED") {
      channel.track({ online_at: new Date().toISOString() });
      safeRpc("record_presence_ping", { p_hub: HUB });
    }
  });
  }

  /* ---------- answer + mode tracking (fire-and-forget, never throws into the hub) ---------- */
  function safeRpc(fn, args){
    if (!supabase) return;
    try { supabase.rpc(fn, args).then(function(){}, function(){}); } catch (e) {}
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
     the tab is hidden; on hide, a section holding at least half a ping's
     worth is rounded up so short stints aren't systematically dropped. */
  var TICK_MS = 1000;
  /* Idle rule: after 15 minutes with no input (tap, click, key, scroll) time stops counting until
     the next input, unless a lecture is playing in Listen. A visible tab left open on a desk
     used to count as study time for as long as it sat there. */
  var IDLE_MS = 15 * 60 * 1000;
  var lastInput = Date.now();
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll", "mousemove"].forEach(function(ev){
    window.addEventListener(ev, function(){ lastInput = Date.now(); }, { passive: true, capture: true });
  });
  function isIdle(now){
    if (now - lastInput < IDLE_MS) return false;
    try { if (window.shTTS && window.shTTS.listening && window.shTTS.listening()) { lastInput = now; return false; } } catch (e) {}
    return true;
  }
  var sectionBank = {};
  var tickTimer = null;
  var lastTick = 0;
  function pingActivity(section){
    safeRpc("record_activity_ping", { p_visitor: VISITOR_ID, p_visit: VISIT_ID, p_hub: HUB, p_section: section });
  }
  function tick(){
    var now = Date.now();
    var dt = Math.min(now - lastTick, 5 * TICK_MS); /* cap so a frozen/sleeping tab can't dump minutes into one section */
    lastTick = now;
    if (isIdle(now)) return;
    var sec = currentSection();
    sectionBank[sec] = (sectionBank[sec] || 0) + dt;
    if (sectionBank[sec] >= PING_INTERVAL_MS) {
      sectionBank[sec] -= PING_INTERVAL_MS;
      pingActivity(sec);
    }
  }
  function flushBank(){
    Object.keys(sectionBank).forEach(function(sec){
      if (sectionBank[sec] >= PING_INTERVAL_MS / 2) pingActivity(sec);
      sectionBank[sec] = 0;
    });
  }
  var firstPingSent = false;
  function startActivityPing(){
    if (tickTimer) return;
    if (!firstPingSent) {
      firstPingSent = true;
      var startSec = currentSection();
      pingActivity(startSec);
      sectionBank[startSec] = -PING_INTERVAL_MS;
    }
    lastTick = Date.now();
    tickTimer = setInterval(tick, TICK_MS);
  }
  function stopActivityPing(){
    if (!tickTimer) return;
    clearInterval(tickTimer); tickTimer = null;
    tick();
    flushBank();
  }
  /* start a moment after load so the hub's own scripts have rendered their
     initial tabs -- otherwise the first (pre-credited) ping is labelled with
     the bare mode ("compendium") and the real sub-view double-counts. */
  var trackingArmed = false;
  setTimeout(function(){
    trackingArmed = true;
    if (document.visibilityState !== "hidden") startActivityPing();
  }, 1500);
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "hidden") stopActivityPing();
    else if (trackingArmed) startActivityPing();
  });
  window.addEventListener("pagehide", stopActivityPing);

  var sessionCorrectStreak = 0;
  var nukeReady = false;
  document.addEventListener(ANSWERED_EVENT, function(e){
    var d = (e && e.detail) || {};
    var isCorrect = !!d.correct;
    srsRecord(String(d.qid || ""), isCorrect);
    safeRpc("record_answer", { p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
    /* which option was picked (its authored index, 0 = the key), for the admin page's
       "most popular wrong answer"; hubs send it for bank and mock-exam MCQs */
    if (typeof d.choice === "number") safeRpc("record_choice", { p_hub: HUB, p_qid: String(d.qid || ""), p_choice: d.choice });
    safeRpc("record_personal_answer", { p_visitor: VISITOR_ID, p_hub: HUB, p_qid: String(d.qid || ""), p_correct: isCorrect });
    safeRpc("record_correct_streak", { p_visitor: VISITOR_ID, p_correct: isCorrect });
    if (isCorrect) {
      sessionCorrectStreak++;
      if (sessionCorrectStreak > 0 && sessionCorrectStreak % 5 === 0) {
        fireConfetti();
        showStreakToast(shGreet(sessionCorrectStreak + " in a row") + "!", ICON_FLAME);
      }
      if (sessionCorrectStreak >= NUKE_STREAK_THRESHOLD && !nukeReady) {
        nukeReady = true;
        showNukeBadge();
        showStreakToast(shGreet("Tactical nuke ready"), '<span class="sh-nuke-icon sh-nuke-icon-sm"></span>');
      }
    } else {
      sessionCorrectStreak = 0;
    }
  });
  if (modeSwitchEl) {
    modeSwitchEl.addEventListener("click", function(e){
      var t = e.target.closest("[data-" + modeAttr + "]");
      if (t && t.dataset && t.dataset[modeAttr]) safeRpc("record_mode_open", { p_hub: HUB, p_mode: t.dataset[modeAttr] });
    });
  }
  safeRpc("record_mode_open", { p_hub: HUB, p_mode: DEFAULT_MODE });

  /* ---------- confetti + streak toast ---------- */
  function showStreakToast(text, iconHTML){
    var t = document.createElement("div");
    t.className = "shstat-streaktoast";
    t.textContent = text;
    if (iconHTML) t.insertAdjacentHTML("afterbegin", '<span class="shstat-toast-ic">' + iconHTML + '</span>');
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
    nukeBadgeEl.innerHTML = '<span class="sh-nuke-icon sh-nuke-icon-md" aria-hidden="true"></span><span class="sh-nuke-badge-label">Tactical Nuke Ready</span>';
    nukeBadgeEl.setAttribute("aria-label", "Tactical nuke ready -- tap to call it in");
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
    safeRpc("record_nuke_launch", { p_hub: HUB, p_visitor: VISITOR_ID, p_name: name });
    try { if (channel) channel.send({ type: "broadcast", event: "nuke", payload: { name: name } }); } catch (e) {}
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
    // so a fixed key colour stopped matching and the lit-up screen showed as a pale
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

  /* ---------- floating widget ---------- */
  /* drawn to match the hubs' own icon sets: 24px grid, 1.8 stroke, round caps */
  function shIcon(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICON_SEARCH = shIcon('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>');
  var ICON_STATS = shIcon('<rect x="4" y="12" width="4" height="8" rx="1.2"/><rect x="10" y="5" width="4" height="15" rx="1.2"/><rect x="16" y="9" width="4" height="11" rx="1.2"/>');
  var ICON_BULB = shIcon('<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h0a2 2 0 0 1-2-2z"/><path d="M12 7.5v5M9.5 10h5"/>');
  var ICON_FLAG = shIcon('<path d="M6 21V4"/><path d="M6 4.5c3.5-2 6.5 2 10 0v8c-3.5 2-6.5-2-10 0"/>');
  var ICON_GEAR = shIcon('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>');
  var ICON_MORE = shIcon('<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>');
  /* the site's mark: the four class ring bands, as on the dashboard wordmark */
  var ICON_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="3" height="14" rx="1.5" fill="#C28A2E"/><rect x="8.6" y="5" width="3" height="14" rx="1.5" fill="#C85A7C"/><rect x="13.2" y="5" width="3" height="14" rx="1.5" fill="#2E8A80"/><rect x="17.8" y="5" width="3" height="14" rx="1.5" fill="#C06544"/></svg>';
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
    '<div class="shstat-namemsg" id="shstat-name-msg"></div></div>' +
    '<div class="shstat-sec"><h5>Toughest questions (class-wide)</h5><div id="shstat-tough"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Most opened</h5><div id="shstat-modes"><div class="shstat-empty">Loading…</div></div></div>' +
    '<div class="shstat-sec"><h5>Busiest times</h5><div id="shstat-hist-wrap"><div class="shstat-empty">Loading…</div></div></div>' +
    '</div>' +
    '<div id="shstat-settingspanel"><button class="shstat-close" type="button" aria-label="Close">&times;</button>' +
    '<h5>Settings</h5>' +
    '<div class="shset-row"><label>Screen name</label>' +
    '<div class="shstat-name-row"><input type="text" id="shset-name-input" maxlength="24" placeholder="What should we call you?"><button id="shset-name-save" type="button">Save</button></div>' +
    '<div class="shstat-namemsg" id="shset-name-msg"></div></div>' +
    '<div class="shset-row"><label>Reading font</label>' +
    '<div class="shset-seg" data-pref="font">' +
    '<button type="button" data-val="default">Default</button>' +
    '<button type="button" data-val="serif">Serif</button>' +
    '<button type="button" data-val="sans">Sans</button>' +
    '</div></div>' +
    '<div class="shset-row"><label>Text size</label>' +
    '<div class="shset-seg" data-pref="size">' +
    '<button type="button" data-val="small">Small</button>' +
    '<button type="button" data-val="default">Default</button>' +
    '<button type="button" data-val="large">Large</button>' +
    '<button type="button" data-val="xlarge">X-Large</button>' +
    '<button type="button" data-val="xxlarge">XX-Large</button>' +
    '</div></div>' +
    '<div class="shset-row"><label>Background music</label>' +
    '<div class="shset-seg" data-pref="music">' +
    '<button type="button" data-val="off">Off</button>' +
    '<button type="button" data-val="rain">Soft rain</button>' +
    '<button type="button" data-val="waves">Ocean waves</button>' +
    '<button type="button" data-val="cafe">Coffee shop</button>' +
    '<button type="button" data-val="lofi">Lo-fi keys</button>' +
    '<button type="button" data-val="piano">Piano</button>' +
    '</div>' +
    '<input type="range" id="shset-volume" min="0" max="100" aria-label="Music volume">' +
    '<div class="shset-hint">Browsers block audio from autoplaying — reopen Settings each visit to resume it.</div>' +
    '</div>' +
    '<div class="shset-row"><label>Surprises</label>' +
    '<div class="shset-seg" data-pref="eggs">' +
    '<button type="button" data-val="on">On</button>' +
    '<button type="button" data-val="off">Off</button>' +
    '</div>' +
    '<div class="shset-hint">Little hidden extras around the hubs, including a few you share live with classmates. Stuck? The trophy case in Stats has clues. They never appear during a mock exam.</div>' +
    '</div>' +
    '<div class="shset-row"><label>Tactical nuke alerts</label>' +
    '<div class="shset-seg" data-pref="nuke">' +
    '<button type="button" data-val="on">On</button>' +
    '<button type="button" data-val="off">Off</button>' +
    '</div>' +
    '<div class="shset-hint">Get ' + NUKE_STREAK_THRESHOLD + ' questions right in a row to unlock a tactical nuke you can call in. Turn this off to skip seeing other people\'s strikes (yours will still work).</div>' +
    '</div>' +
    '</div>' +
    /* Desktop: one launcher button that opens this menu. Phones: the menu is a three-item
       bottom bar (Search, Stats, More) and More opens the rest as a small sheet. */
    '<div class="shstat-pillrow" id="shstat-menu">' +
      '<button class="shstat-pill shm-primary" id="shstat-search-pill" type="button"><span class="shstat-pill-icon">' + ICON_SEARCH + '</span><span class="shstat-pill-label">Search</span></button>' +
      '<button class="shstat-pill shm-primary" id="shstat-stats-pill" type="button"><span class="shstat-pill-icon">' + ICON_STATS + '</span><span class="shstat-pill-label"><span class="spl-full">Class stats</span><span class="spl-short">Stats</span></span></button>' +
      '<button class="shstat-pill shm-more" id="shstat-more-pill" type="button" aria-expanded="false"><span class="shstat-pill-icon">' + ICON_MORE + '</span><span class="shstat-pill-label">More</span></button>' +
      '<div class="shm-group">' +
        '<div class="shm-live" id="shstat-online-pill"><span class="shstat-dot"></span><span><b id="shstat-online-n">1</b> studying now</span></div>' +
        '<button class="shstat-pill" id="shstat-settings-pill" type="button"><span class="shstat-pill-icon">' + ICON_GEAR + '</span><span class="shstat-pill-label">Settings</span></button>' +
        '<button class="shstat-pill" id="shstat-suggest-pill" type="button"><span class="shstat-pill-icon">' + ICON_BULB + '</span><span class="shstat-pill-label">Suggest something</span></button>' +
        '<button class="shstat-pill" id="shstat-flag-pill" type="button"><span class="shstat-pill-icon">' + ICON_FLAG + '</span><span class="shstat-pill-label">Report an issue</span></button>' +
      '</div>' +
    '</div>' +
    '<button class="shstat-launch" id="shstat-launch" type="button" aria-expanded="false" aria-controls="shstat-menu" aria-label="Study tools: search, class stats, settings">' + ICON_MARK + '<span class="shl-live"><span class="shstat-dot"></span><span id="shstat-launch-n">1</span></span></button>';
  document.body.appendChild(root);

  function renderOnline(){
    var n = document.getElementById("shstat-online-n");
    if (n) n.textContent = onlineCount;
    var n2 = document.getElementById("shstat-launch-n");
    if (n2) n2.textContent = onlineCount;
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
  var SEARCH_GROUPS = ["Notes", "Review", "Exam hints", "Cram sheet", "Questions"];
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
  var settingsPanel = document.getElementById("shstat-settingspanel");
  function closeOtherPanels(keep){
    if (keep !== panel) panel.classList.remove("is-open");
    if (keep !== flagPanel) flagPanel.classList.remove("is-open");
    if (keep !== suggestPanel) suggestPanel.classList.remove("is-open");
    if (keep !== searchPanel) searchPanel.classList.remove("is-open");
    if (keep !== settingsPanel) settingsPanel.classList.remove("is-open");
  }
  function updateSheetState(){
    var open = panel.classList.contains("is-open") || flagPanel.classList.contains("is-open") ||
      suggestPanel.classList.contains("is-open") || searchPanel.classList.contains("is-open") ||
      settingsPanel.classList.contains("is-open");
    document.body.classList.toggle("sh-sheet-open", open);
  }
  /* launcher (desktop) and More (phones) */
  var launchBtn = document.getElementById("shstat-launch"), moreBtn = document.getElementById("shstat-more-pill");
  function setMenu(open){ root.classList.toggle("is-menu-open", open); launchBtn.setAttribute("aria-expanded", String(open)); if (!open) setMore(false); }
  function setMore(open){ root.classList.toggle("is-more-open", open); document.body.classList.toggle("sh-more-open", open); moreBtn.setAttribute("aria-expanded", String(open)); }
  launchBtn.addEventListener("click", function(){ var open = !root.classList.contains("is-menu-open"); if (open) { closeOtherPanels(null); updateSheetState(); } setMenu(open); });
  moreBtn.addEventListener("click", function(){ setMore(!root.classList.contains("is-more-open")); });
  /* picking a tool closes the menu; its panel opens in its place */
  root.querySelectorAll("#shstat-menu .shstat-pill:not(.shm-more)").forEach(function(b){ b.addEventListener("click", function(){ setMenu(false); }); });
  document.addEventListener("click", function(e){ if (!root.contains(e.target)) setMenu(false); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") { setMenu(false); closeOtherPanels(null); updateSheetState(); } });

  backdrop.addEventListener("click", function(){
    setMenu(false);
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

  function setFlagContext(qid){
    pendingFlagQid = qid || null;
    var ctx = document.getElementById("shstat-flag-ctx");
    if (!ctx) return;
    if (!qid) { ctx.textContent = ""; return; }
    var meta = findQuestionMeta(qid), t = meta.text || "";
    ctx.textContent = "About question " + qid + (t ? ": " + (t.length > 110 ? t.slice(0, 108) + "…" : t) : "");
  }
  window.shOpenFlag = function(qid){
    closeOtherPanels(flagPanel);
    setFlagContext(qid);
    document.getElementById("shstat-flag-msg").textContent = "";
    flagPanel.classList.add("is-open");
    updateSheetState();
    var ta = document.getElementById("shstat-flag-text"); if (ta) ta.focus();
  };
  document.getElementById("shstat-flag-pill").addEventListener("click", function(){
    setFlagContext(null);
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
    if (!supabase) { msg.textContent = "Couldn't send — try again later."; return; }
    btn.disabled = true;
    msg.textContent = "Sending…";
    /* where the student was, so the report can be found: [question id] and the current section */
    var where = [];
    if (pendingFlagQid) where.push("question " + pendingFlagQid);
    var sec = currentSection(); if (sec) where.push(sec);
    var note = (text + (where.length ? "  — " + where.join(" · ") : "")).slice(0, 700);
    supabase.from("question_flags").insert({ hub: HUB, note: note }).then(function(res){
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
    if (!supabase) { msg.textContent = "Couldn't send — try again later."; return; }
    btn.disabled = true;
    msg.textContent = "Sending…";
    supabase.from("hub_suggestions").insert({ hub: HUB, note: text }).then(function(res){
      btn.disabled = false;
      if (res && res.error) { msg.textContent = "Couldn't send — try again later."; return; }
      ta.value = "";
      msg.textContent = "Thanks — sent!";
    }, function(){ btn.disabled = false; msg.textContent = "Couldn't send — try again later."; });
  });

  /* ---------- settings panel ---------- */
  var SEG_PREF_MAP = {
    font: { key: SH_FONT_KEY, def: "default" },
    size: { key: SH_SIZE_KEY, def: "default" },
    music: { key: SH_MUSIC_KEY, def: "off" },
    nuke: { key: SH_NUKE_PREF_KEY, def: "on" },
    eggs: { key: "sh_pref_eggs", def: "on" }
  };
  function syncSettingsSegUI(){
    document.querySelectorAll(".shset-seg").forEach(function(seg){
      var pref = seg.getAttribute("data-pref");
      var map = SEG_PREF_MAP[pref];
      if (!map) return;
      var cur = prefGet(map.key, map.def);
      seg.querySelectorAll("button").forEach(function(b){
        b.classList.toggle("is-active", b.getAttribute("data-val") === cur);
      });
    });
    var volEl = document.getElementById("shset-volume");
    if (volEl) volEl.value = prefGet(SH_VOLUME_KEY, "35");
  }
  function syncSettingsUI(){
    syncNameInputs();
    syncSettingsSegUI();
  }
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

  window.shOpenSettings = function(){
    closeOtherPanels(settingsPanel);
    settingsPanel.classList.add("is-open");
    updateSheetState();
    syncSettingsUI();
    var savedTrack = prefGet(SH_MUSIC_KEY, "off");
    if (savedTrack !== "off") shMusic.setTrack(savedTrack); // resume within this click's user-gesture window
  };
  document.getElementById("shstat-settings-pill").addEventListener("click", function(){
    if (settingsPanel.classList.contains("is-open")) {
      settingsPanel.classList.remove("is-open");
      updateSheetState();
    } else {
      window.shOpenSettings();
    }
  });
  document.querySelector("#shstat-settingspanel .shstat-close").addEventListener("click", function(){
    settingsPanel.classList.remove("is-open");
    updateSheetState();
  });
  document.querySelectorAll(".shset-seg").forEach(function(seg){
    seg.addEventListener("click", function(e){
      var btn = e.target.closest("button[data-val]");
      if (!btn) return;
      var pref = seg.getAttribute("data-pref");
      var val = btn.getAttribute("data-val");
      if (pref === "font") { prefSet(SH_FONT_KEY, val); applyFontPref(); }
      else if (pref === "size") { prefSet(SH_SIZE_KEY, val); applySizePref(); }
      else if (pref === "music") { prefSet(SH_MUSIC_KEY, val); shMusic.setTrack(val); }
      else if (pref === "nuke") { prefSet(SH_NUKE_PREF_KEY, val); }
      else if (pref === "eggs") { prefSet("sh_pref_eggs", val); }
      syncSettingsSegUI();
    });
  });
  var settingsVolumeEl = document.getElementById("shset-volume");
  if (settingsVolumeEl) {
    settingsVolumeEl.addEventListener("input", function(){
      prefSet(SH_VOLUME_KEY, settingsVolumeEl.value);
      shMusic.setVolume(parseInt(settingsVolumeEl.value, 10) / 100);
    });
  }
  var setNameSaveBtn = document.getElementById("shset-name-save");
  if (setNameSaveBtn) {
    setNameSaveBtn.addEventListener("click", function(){
      var nameInput = document.getElementById("shset-name-input");
      var nameMsg = document.getElementById("shset-name-msg");
      var name = (nameInput.value || "").trim();
      if (!saveName(name)) { nameMsg.textContent = "Type a name first."; return; }
      nameMsg.textContent = "Saved. Hi, " + name + "!";
    });
  }
  /* ---------- easter eggs live in widget/eggs.js; these are the hooks they use ---------- */
  window.shEggHooks = {
    hub: HUB, answeredEvent: ANSWERED_EVENT, visitor: VISITOR_ID, supabase: supabase,
    send: function(payload){ try { if (channel) channel.send({ type: "broadcast", event: "egg", payload: payload }); } catch (e) {} },
    name: displayName, section: currentSection, online: function(){ return onlineCount; },
    toast: showStreakToast, confetti: fireConfetti, prefGet: prefGet, prefSet: prefSet, esc: esc,
    statsPanel: function(){ return document.getElementById("shstat-panel"); }
  };
  if (!EXPORT_ONLY) {
    var eggScript = document.createElement("script");
    eggScript.src = new URL("eggs.js", thisScript.src).href; eggScript.async = true;
    document.head.appendChild(eggScript);
  }
  /* handpiece ranks, trophies, accent unlocks, link my devices (widget/ranks.js) */
  if (!EXPORT_ONLY) {
    var rankScript = document.createElement("script");
    rankScript.src = new URL("ranks.js", thisScript.src).href; rankScript.async = true;
    rankScript.onload = function(){ if (window.shRanks) window.shRanks.mount(window.shEggHooks); };
    document.head.appendChild(rankScript);
  }
  /* click analytics (widget/clicks.js): what people use, for improving each hub */
  if (!EXPORT_ONLY && supabase) {
    var clickScript = document.createElement("script");
    clickScript.src = new URL("clicks.js", thisScript.src).href; clickScript.async = true;
    clickScript.onload = function(){ if (window.shClicks) window.shClicks.start({ sb: supabase, hub: HUB, visitor: VISITOR_ID, section: currentSection }); };
    document.head.appendChild(clickScript);
  }
})();
