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

  /* ---------- reserve top clearance so the fixed "All hubs" pill / name badge
     never sits on top of each hub's own sticky header/title. Every hub uses
     exactly one <header> element for its top bar (position:sticky;top:0), so
     that's the one hub-agnostic anchor point we push down + re-pin, rather
     than hand-tuning per-hub CSS. Re-measured on resize (mobile breakpoint
     changes pill size) and whenever the name badge's visibility changes. ---------- */
  function reserveTopClearance(){
    try{
      var bottom = 0;
      ["shhome-pill","shname-badge"].forEach(function(id){
        var el = document.getElementById(id);
        if(el && !el.hidden){
          var r = el.getBoundingClientRect();
          if(r.bottom > bottom) bottom = r.bottom;
        }
      });
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
    }catch(e){ /* purely cosmetic, never block the hub */ }
  }
  window.shReserveTopClearance = reserveTopClearance;
  reserveTopClearance();
  window.addEventListener("resize", (function(){
    var t = null;
    return function(){ clearTimeout(t); t = setTimeout(reserveTopClearance, 150); };
  })());

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
    function playAudioFile(container, btn, audioUrl){
      var audio = new Audio(audioUrl);
      audio.preload = "auto";
      audio.addEventListener("ended", function(){
        if (activeAudioEl === audio) activeAudioEl = null;
        if (activeBtn === btn) { setState(btn, "idle"); activeBtn = null; }
      });
      audio.addEventListener("error", function(){
        if (activeAudioEl === audio) activeAudioEl = null;
        if (activeBtn === btn) activeBtn = null;
        if (btn) btn.removeAttribute("data-sh-tts-audio");
        speakWithSynth(container, btn);
      });
      activeBtn = btn;
      activeAudioEl = audio;
      setState(btn, "playing");
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function(){
          if (activeAudioEl === audio) activeAudioEl = null;
          if (btn) btn.removeAttribute("data-sh-tts-audio");
          speakWithSynth(container, btn);
        });
      }
    }

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

    return { supported: !!synth, speak: speak, stop: stop };
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
  var FONT_STACKS = {
    serif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  };
  var SIZE_ZOOM = { small: 0.9, "default": 1, large: 1.15, xlarge: 1.3 };

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
  window.shName = currentName;
  window.shGreet = function(text){
    var n = currentName();
    return n ? (text + ", " + n) : text;
  };

  var nameBadge = document.createElement("button");
  nameBadge.id = "shname-badge";
  nameBadge.type = "button";
  nameBadge.hidden = true;
  document.body.appendChild(nameBadge);
  function renderNameBadge(){
    var n = currentName();
    if (n) { nameBadge.textContent = "Hi, " + n; nameBadge.hidden = false; }
    else { nameBadge.hidden = true; }
    if (window.shReserveTopClearance) window.shReserveTopClearance();
  }
  renderNameBadge();
  nameBadge.addEventListener("click", function(){ if (window.shOpenSettings) window.shOpenSettings(); });

  // Welcome-back toast for a returning, named visitor — once per page load,
  // a beat after load so it doesn't collide with anything else appearing.
  (function(){
    var visits = (parseInt(prefGet(SH_VISITS_KEY, "0"), 10) || 0) + 1;
    prefSet(SH_VISITS_KEY, String(visits));
    var n = currentName();
    if (visits > 1 && n) {
      setTimeout(function(){ showStreakToast("Welcome back, " + n + " 👋"); }, 900);
    }
  })();

  /* ---------- background music (procedural — no external audio files, so
     there's nothing to host or license. Web Audio only starts from a real
     user gesture per browser autoplay rules, so this only ever plays when
     triggered from a click — see the Settings panel wiring below. ---------- */
  var shMusic = (function(){
    var ctx = null, master = null, nodes = [];
    function ensureCtx(){
      if (ctx) return ctx;
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = (parseInt(prefGet(SH_VOLUME_KEY, "35"), 10) / 100) * 0.35;
      master.connect(ctx.destination);
      return ctx;
    }
    function stopAll(){
      nodes.forEach(function(n){ try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
      nodes = [];
    }
    function playPad(){
      var c = ensureCtx(); if (!c) return;
      stopAll();
      [110, 165, 220].forEach(function(f, i){
        var osc = c.createOscillator();
        osc.type = "sine"; osc.frequency.value = f;
        var lfo = c.createOscillator();
        lfo.type = "sine"; lfo.frequency.value = 0.05 + i * 0.02;
        var lfoGain = c.createGain(); lfoGain.gain.value = 3;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
        var g = c.createGain(); g.gain.value = 0.5 / 3;
        osc.connect(g); g.connect(master);
        osc.start(); lfo.start();
        nodes.push(osc, lfo);
      });
    }
    function playRain(){
      var c = ensureCtx(); if (!c) return;
      stopAll();
      var bufferSize = 2 * c.sampleRate;
      var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      var noise = c.createBufferSource();
      noise.buffer = buffer; noise.loop = true;
      var filter = c.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 1200; filter.Q.value = 0.6;
      var g = c.createGain(); g.gain.value = 0.6;
      noise.connect(filter); filter.connect(g); g.connect(master);
      noise.start();
      nodes.push(noise);
    }
    function playWaves(){
      var c = ensureCtx(); if (!c) return;
      stopAll();
      var bufferSize = 2 * c.sampleRate;
      var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      var noise = c.createBufferSource();
      noise.buffer = buffer; noise.loop = true;
      var filter = c.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 500; filter.Q.value = 0.7;
      var lfo = c.createOscillator();
      lfo.type = "sine"; lfo.frequency.value = 0.09; // slow swell, ~11s per wave
      var lfoGain = c.createGain(); lfoGain.gain.value = 350;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      var g = c.createGain(); g.gain.value = 0.55;
      noise.connect(filter); filter.connect(g); g.connect(master);
      noise.start(); lfo.start();
      nodes.push(noise, lfo);
    }
    function playLofi(){
      var c = ensureCtx(); if (!c) return;
      stopAll();
      var chords = [
        [220.00, 261.63, 329.63],
        [196.00, 246.94, 293.66],
        [174.61, 220.00, 261.63],
        [196.00, 246.94, 311.13]
      ];
      var chordLen = 3.4;
      var chordGain = c.createGain(); chordGain.gain.value = 0.22; chordGain.connect(master);
      var step = 0;
      function scheduleChord(){
        var freqs = chords[step % chords.length];
        var startAt = c.currentTime + 0.05;
        freqs.forEach(function(f){
          var osc = c.createOscillator();
          osc.type = "triangle"; osc.frequency.value = f;
          var env = c.createGain(); env.gain.value = 0;
          osc.connect(env); env.connect(chordGain);
          env.gain.setValueAtTime(0, startAt);
          env.gain.linearRampToValueAtTime(1, startAt + 0.8);
          env.gain.linearRampToValueAtTime(0, startAt + chordLen);
          osc.start(startAt); osc.stop(startAt + chordLen + 0.1);
          nodes.push(osc);
        });
        step++;
      }
      scheduleChord();
      var timer = setInterval(scheduleChord, chordLen * 1000);
      nodes.push({ stop: function(){ clearInterval(timer); }, disconnect: function(){} });
    }
    function playFocus(){
      var c = ensureCtx(); if (!c) return;
      stopAll();
      if (!c.createStereoPanner) { playPad(); return; } // graceful fallback if unsupported
      var left = c.createOscillator(); left.type = "sine"; left.frequency.value = 190;
      var right = c.createOscillator(); right.type = "sine"; right.frequency.value = 200; // ~10Hz beat
      var panL = c.createStereoPanner(); panL.pan.value = -1;
      var panR = c.createStereoPanner(); panR.pan.value = 1;
      var g = c.createGain(); g.gain.value = 0.18;
      left.connect(panL); panL.connect(g);
      right.connect(panR); panR.connect(g);
      g.connect(master);
      left.start(); right.start();
      nodes.push(left, right);
    }
    function setTrack(track){
      if (track === "off") { stopAll(); return; }
      if (!ensureCtx()) return;
      if (ctx.state === "suspended") { ctx.resume().catch(function(){}); }
      if (track === "pad") playPad();
      else if (track === "rain") playRain();
      else if (track === "waves") playWaves();
      else if (track === "lofi") playLofi();
      else if (track === "focus") playFocus();
    }
    function setVolume(v){ if (master) master.gain.value = v * 0.35; }
    return { setTrack: setTrack, setVolume: setVolume };
  })();

  /* ---------- per-question class-wide correctness — one fetch for the whole
     hub, cached, instead of one request per question. Exposed the same way
     as shTTS so a hub's own qcard code can use it independent of load order
     and of the stats layer below. shQuestionStats(qid, cb) resolves from the
     cache (fetching it once, lazily, on first call); shFillClassData(container)
     auto-populates every [data-role="classdata-result"] under a container —
     no click needed. ---------- */
  var questionStatsCache = null; // null = not fetched yet; {} (or filled) once loaded
  var questionStatsPromise = null;
  function loadQuestionStats(){
    if (questionStatsCache) return Promise.resolve(questionStatsCache);
    if (questionStatsPromise) return questionStatsPromise;
    questionStatsPromise = fetch(SB_URL + "/rest/v1/question_stats?hub=eq." + encodeURIComponent(HUB) + "&select=qid,attempts,correct", {
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }
    })
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(rows){
      var map = {};
      (rows || []).forEach(function(r){ map[r.qid] = { attempts: r.attempts, correct: r.correct }; });
      questionStatsCache = map;
      return map;
    })
    .catch(function(){ questionStatsCache = {}; return questionStatsCache; });
    return questionStatsPromise;
  }
  window.shQuestionStats = function(qid, cb){
    loadQuestionStats().then(function(map){ cb(map[qid] || null); });
  };
  window.shFillClassData = function(container){
    if (!container) return;
    var els = container.querySelectorAll('[data-role="classdata-result"]');
    if (!els.length) return;
    loadQuestionStats().then(function(map){
      els.forEach(function(el){
        var card = el.closest('[data-qid]');
        var qid = card && card.getAttribute('data-qid');
        var stats = qid ? map[qid] : null;
        if (!stats || stats.attempts < 3) {
          el.textContent = 'Not enough class answers yet.';
          el.className = 'qcard-classdata-result';
          return;
        }
        var pct = Math.round((stats.correct / stats.attempts) * 100);
        el.textContent = pct + '% correct class-wide (' + stats.attempts + ' answered)';
        el.className = 'qcard-classdata-result ' + (pct < 50 ? 'is-bad' : (pct >= 80 ? 'is-ok' : ''));
      });
    });
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

  /* ---------- visit/section time tracking (best-effort analytics for the
     admin review page only — never affects the hub itself). One ping right
     away, then every PING_INTERVAL_MS while the tab is actually visible
     (paused when backgrounded, so an idle tab doesn't inflate the numbers).
     "section" reads the universal #modeSwitch [data-mode] convention every
     hub already uses, so this needs zero per-hub changes to work. ---------- */
  var VISIT_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("visit-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  var PING_INTERVAL_MS = 25000;
  function currentSection(){
    try {
      var active = document.querySelector('#modeSwitch [aria-selected="true"]');
      return (active && active.getAttribute("data-mode")) || "";
    } catch (e) { return ""; }
  }
  function pingActivity(){
    safeRpc("record_activity_ping", { p_visitor: VISITOR_ID, p_visit: VISIT_ID, p_hub: HUB, p_section: currentSection() });
  }
  var activityTimer = null;
  function startActivityPing(){
    if (activityTimer) return;
    pingActivity();
    activityTimer = setInterval(pingActivity, PING_INTERVAL_MS);
  }
  function stopActivityPing(){
    if (activityTimer) { clearInterval(activityTimer); activityTimer = null; }
  }
  if (document.visibilityState !== "hidden") startActivityPing();
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "hidden") stopActivityPing();
    else startActivityPing();
  });

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
        showStreakToast(shGreet(sessionCorrectStreak + " in a row") + "! 🔥");
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
  var ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

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
    '</div></div>' +
    '<div class="shset-row"><label>Background music</label>' +
    '<div class="shset-seg" data-pref="music">' +
    '<button type="button" data-val="off">Off</button>' +
    '<button type="button" data-val="pad">Ambient</button>' +
    '<button type="button" data-val="rain">Soft rain</button>' +
    '<button type="button" data-val="waves">Ocean waves</button>' +
    '<button type="button" data-val="lofi">Lo-fi keys</button>' +
    '<button type="button" data-val="focus">Focus tone</button>' +
    '</div>' +
    '<input type="range" id="shset-volume" min="0" max="100">' +
    '<div class="shset-hint">Browsers block audio from autoplaying — reopen Settings each visit to resume it.</div>' +
    '</div>' +
    '</div>' +
    '<div class="shstat-pillrow">' +
    '<button class="shstat-pill" id="shstat-online-pill" type="button"><span class="shstat-pill-icon shstat-pill-icon-dot"><span class="shstat-dot"></span></span><span class="shstat-pill-label"><span id="shstat-online-n">1</span> <span class="spl-full">studying now</span><span class="spl-short">live</span></span></button>' +
    '<button class="shstat-pill" id="shstat-search-pill" type="button"><span class="shstat-pill-icon">' + ICON_SEARCH + '</span><span class="shstat-pill-label">Search</span></button>' +
    '<button class="shstat-pill" id="shstat-stats-pill" type="button"><span class="shstat-pill-icon">' + ICON_STATS + '</span><span class="shstat-pill-label"><span class="spl-full">Class stats</span><span class="spl-short">Stats</span></span></button>' +
    '<button class="shstat-pill" id="shstat-suggest-pill" type="button"><span class="shstat-pill-icon">' + ICON_BULB + '</span><span class="shstat-pill-label"><span class="spl-full">Suggest something</span><span class="spl-short">Suggest</span></span></button>' +
    '<button class="shstat-pill" id="shstat-flag-pill" type="button"><span class="shstat-pill-icon">' + ICON_FLAG + '</span><span class="shstat-pill-label"><span class="spl-full">Flag issue</span><span class="spl-short">Flag</span></span></button>' +
    '<button class="shstat-pill" id="shstat-settings-pill" type="button"><span class="shstat-pill-icon">' + ICON_GEAR + '</span><span class="shstat-pill-label"><span class="spl-full">Settings</span><span class="spl-short">Settings</span></span></button>' +
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
      renderNameBadge();
      var settingsInput = document.getElementById("shset-name-input");
      if (settingsInput) settingsInput.value = name;
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

  /* ---------- settings panel ---------- */
  function syncSettingsSegUI(){
    document.querySelectorAll(".shset-seg").forEach(function(seg){
      var pref = seg.getAttribute("data-pref");
      var key = pref === "font" ? SH_FONT_KEY : pref === "size" ? SH_SIZE_KEY : SH_MUSIC_KEY;
      var cur = prefGet(key, pref === "music" ? "off" : "default");
      seg.querySelectorAll("button").forEach(function(b){
        b.classList.toggle("is-active", b.getAttribute("data-val") === cur);
      });
    });
    var volEl = document.getElementById("shset-volume");
    if (volEl) volEl.value = prefGet(SH_VOLUME_KEY, "35");
  }
  function syncSettingsUI(){
    var nInput = document.getElementById("shset-name-input");
    if (nInput) nInput.value = currentName();
    syncSettingsSegUI();
  }
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
      if (!name) { nameMsg.textContent = "Type a name first."; return; }
      setNameSaveBtn.disabled = true;
      nameMsg.textContent = "Saving…";
      safeRpc("set_display_name", { p_visitor: VISITOR_ID, p_name: name });
      prefSet(SH_NAME_KEY, name);
      renderNameBadge();
      var otherInput = document.getElementById("shstat-name-input");
      if (otherInput) otherInput.value = name;
      setTimeout(function(){
        setNameSaveBtn.disabled = false;
        nameMsg.textContent = "Saved — hi, " + name + "!";
      }, 400);
    });
  }
})();
