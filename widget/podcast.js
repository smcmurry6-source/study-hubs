/* Timmy Time (widget/podcast.js): a hub's audio review episode, hosted by Timmy Tooth.
   Loaded by v3.js. A hub opts in by defining, before v3.js runs:

     window.SH_PODCAST = { id, show, title, src, duration, blurb, chapters:[{ t, title }] }

   and putting <div data-sh-podcast></div> wherever the episode card should go (it is re-filled whenever the hub
   re-renders). One <audio> element lives on <body>, so playback survives tab and mode switches. While an episode is
   started and no card is on screen, a small player is pinned to the bottom (above the phone bar). Lock-screen controls
   through the Media Session API. Position is saved per device (sh_pod_pos:<hub>:<id>) and the speed in sh_pod_rate.
   The audio is fetched only when someone presses play (preload none): episodes are tens of MB.
   hubs/<id>/#timmy scrolls to the card (the dashboard links there). The widget menu gets a "Timmy Time" item.
   Built by tools/podcast/ (script, Kokoro voice, music and mastering). */
(function(){
  "use strict";
  var HUB = "", P = null, audio = null, dock = null, io = null, cardsSeen = 0, mounted = false, started = false, saveTimer = 0;
  var RATES = [1, 1.25, 1.5, 1.75, 2];
  var ART = '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<path class="tt-band" d="M12 33V27a20 20 0 0 1 40 0v6" fill="none" stroke-width="4" stroke-linecap="round"/>' +
    '<path class="tt-tooth" d="M20.5 15.5c3.4-3.8 7.4-2.8 11.5-.9 4.1-1.9 8.1-2.9 11.5.9 3.3 3.7 2.4 9.3-.2 13.8-1.7 3.1-2.5 7.2-3.2 11.6-.5 2.8-4 3.2-4.9.3l-1.5-5.6c-.5-1.8-2.9-1.8-3.4 0l-1.5 5.6c-.9 2.9-4.4 2.5-4.9-.3-.7-4.4-1.5-8.5-3.2-11.6-2.6-4.5-3.5-10.1-.2-13.8z" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<circle class="tt-eye" cx="27.5" cy="23.5" r="1.9"/><circle class="tt-eye" cx="36.5" cy="23.5" r="1.9"/>' +
    '<path class="tt-smile" d="M28.5 28.5c2 1.8 5 1.8 7 0" fill="none" stroke-width="2" stroke-linecap="round"/>' +
    '<rect class="tt-cup" x="7" y="29" width="10" height="15" rx="4"/><rect class="tt-cup" x="47" y="29" width="10" height="15" rx="4"/>' +
    '</svg>';
  var I_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  var I_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  var I_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><text x="12" y="15.5" text-anchor="middle" font-size="7.5" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">15</text></svg>';
  var I_FWD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/><text x="12" y="15.5" text-anchor="middle" font-size="7.5" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">30</text></svg>';

  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function fmt(s){ s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), h = Math.floor(m / 60); m %= 60; s %= 60;
    return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function posKey(){ return "sh_pod_pos:" + HUB + ":" + P.id; }
  function duration(){ return (audio && isFinite(audio.duration) && audio.duration > 0) ? audio.duration : (P.duration || 0); }
  function savedPos(){ var v = parseFloat(ls(posKey())); return isFinite(v) ? v : 0; }
  function position(){ return started ? audio.currentTime : savedPos(); }
  function isPlaying(){ return !!(audio && !audio.paused && !audio.ended); }
  function rate(){ var r = parseFloat(ls("sh_pod_rate")); return RATES.indexOf(r) >= 0 ? r : 1; }
  function chapterAt(t){ var c = 0; (P.chapters || []).forEach(function(ch, i){ if (t + 0.5 >= ch.t) c = i; }); return c; }
  function finished(){ return ls(posKey() + ":done") === "1"; }

  function ensureAudio(){
    if (audio) return audio;
    audio = document.createElement("audio");
    audio.preload = "none";
    audio.className = "sh-pod-audio";
    document.body.appendChild(audio);
    ["play", "pause", "ended", "ratechange"].forEach(function(ev){ audio.addEventListener(ev, refresh); });
    audio.addEventListener("pause", function(){ tick(true); });
    audio.addEventListener("timeupdate", function(){ tick(); });
    audio.addEventListener("ended", function(){ ls(posKey(), null); ls(posKey() + ":done", "1"); });
    audio.addEventListener("loadedmetadata", function(){ refresh(); });
    audio.addEventListener("error", function(){ setNote("The episode didn't load. Check your connection and try again."); refresh(); });
    return audio;
  }

  function load(){
    ensureAudio();
    if (started) return;
    started = true;
    audio.src = new URL(P.src, location.href).href;
    var at = finished() ? 0 : savedPos();
    if (at > 5) {
      var seekOnce = function(){ audio.removeEventListener("loadedmetadata", seekOnce); try { audio.currentTime = at; } catch (e) {} };
      audio.addEventListener("loadedmetadata", seekOnce);
    }
    audio.playbackRate = rate();
    mediaSession();
  }

  function play(){
    load();
    try { if (window.shTTS) window.shTTS.stop(); } catch (e) {}
    ls(posKey() + ":done", null);
    audio.playbackRate = rate();
    var p = audio.play();
    if (p && p.catch) p.catch(function(){ refresh(); });
  }
  function pause(){ if (audio) audio.pause(); }
  function toggle(){ if (isPlaying()) pause(); else play(); }
  function seekTo(t){
    load();
    var go = function(){ try { audio.currentTime = Math.max(0, Math.min(t, duration() - 0.5)); } catch (e) {} tick(true); };
    if (audio.readyState >= 1) go(); else audio.addEventListener("loadedmetadata", function f(){ audio.removeEventListener("loadedmetadata", f); go(); });
  }
  function skip(d){ seekTo(position() + d); if (!isPlaying()) play(); }

  /* ---------- the card(s) ---------- */
  function cardHTML(){
    var chapters = (P.chapters || []).map(function(ch, i){
      return '<li><button type="button" class="sh-pod-ch" data-pod-ch="' + i + '"><span class="sh-pod-ch-t">' + fmt(ch.t) + '</span><span class="sh-pod-ch-name">' + esc(ch.title) + '</span></button></li>';
    }).join("");
    return '<div class="sh-pod-card" id="timmy">' +
      '<div class="sh-pod-art">' + ART + '</div>' +
      '<div class="sh-pod-main">' +
        '<div class="sh-pod-kicker">' + esc(P.show || "Timmy Time") + ' <span>Podcast</span></div>' +
        '<div class="sh-pod-title">' + esc(P.title) + '</div>' +
        '<div class="sh-pod-meta">' + esc(P.blurb || "") + '</div>' +
        '<div class="sh-pod-controls">' +
          '<button type="button" class="sh-pod-play" data-pod="play">' + I_PLAY + '<span class="sh-pod-play-label">Play episode</span></button>' +
          '<button type="button" class="sh-pod-btn" data-pod="back" aria-label="Back 15 seconds">' + I_BACK + '</button>' +
          '<button type="button" class="sh-pod-btn" data-pod="fwd" aria-label="Forward 30 seconds">' + I_FWD + '</button>' +
          '<button type="button" class="sh-pod-btn sh-pod-rate" data-pod="rate" aria-label="Playback speed">1×</button>' +
          (chapters ? '<button type="button" class="sh-pod-btn sh-pod-chbtn" data-pod="chapters" aria-expanded="false">Chapters</button>' : '') +
        '</div>' +
        '<div class="sh-pod-progress"><input type="range" class="sh-pod-seek" min="0" max="1000" value="0" step="1" aria-label="Position in the episode"><span class="sh-pod-time"></span></div>' +
        '<div class="sh-pod-note" hidden></div>' +
        (chapters ? '<ol class="sh-pod-chapters" hidden>' + chapters + '</ol>' : '') +
      '</div></div>';
  }

  function wireCard(slot){
    slot.innerHTML = cardHTML();
    slot.setAttribute("data-sh-podcast-ready", "1");
    var card = slot.firstChild;
    card.addEventListener("click", function(e){
      var b = e.target.closest("[data-pod], [data-pod-ch]"); if (!b) return;
      var what = b.getAttribute("data-pod");
      if (b.hasAttribute("data-pod-ch")) { var ch = P.chapters[+b.getAttribute("data-pod-ch")]; seekTo(ch.t); if (!isPlaying()) play(); return; }
      if (what === "play") toggle();
      else if (what === "back") skip(-15);
      else if (what === "fwd") skip(30);
      else if (what === "rate") { var r = RATES[(RATES.indexOf(rate()) + 1) % RATES.length]; ls("sh_pod_rate", String(r)); if (audio) audio.playbackRate = r; refresh(); }
      else if (what === "chapters") { var ol = card.querySelector(".sh-pod-chapters"); ol.hidden = !ol.hidden; b.setAttribute("aria-expanded", ol.hidden ? "false" : "true"); }
    });
    wireSeek(card.querySelector(".sh-pod-seek"));
    if (io) io.observe(card);
    refresh();
  }

  function wireSeek(input){
    var dragging = false;
    input.addEventListener("input", function(){ dragging = true; var d = duration(); if (d) setTimes(+input.value / 1000 * d); });
    input.addEventListener("change", function(){ dragging = false; var d = duration(); if (d) seekTo(+input.value / 1000 * d); });
    input._dragging = function(){ return dragging; };
  }

  function setTimes(t){
    var d = duration();
    document.querySelectorAll(".sh-pod-time").forEach(function(el){ el.textContent = fmt(t) + " / " + fmt(d); });
    document.querySelectorAll(".sh-pod-dock-time").forEach(function(el){ el.textContent = "-" + fmt(Math.max(0, d - t)); });
  }

  function setNote(msg){
    document.querySelectorAll(".sh-pod-note").forEach(function(el){ el.textContent = msg || ""; el.hidden = !msg; });
  }

  function tick(force){
    var t = position(), d = duration();
    document.querySelectorAll(".sh-pod-seek").forEach(function(el){ if (!(el._dragging && el._dragging()) && d) el.value = Math.round(t / d * 1000); });
    setTimes(t);
    var c = chapterAt(t);
    document.querySelectorAll(".sh-pod-ch").forEach(function(el){ el.classList.toggle("is-now", started && +el.getAttribute("data-pod-ch") === c); });
    var name = (P.chapters && P.chapters[c]) ? P.chapters[c].title : "";
    document.querySelectorAll(".sh-pod-dock-sub").forEach(function(el){ el.textContent = name; });
    if (started && (force || Date.now() - saveTimer > 4000)) { saveTimer = Date.now(); if (t > 3 && !audio.ended) ls(posKey(), t.toFixed(1)); }
    if ("mediaSession" in navigator && started && d && navigator.mediaSession.setPositionState) {
      try { navigator.mediaSession.setPositionState({ duration: d, playbackRate: audio.playbackRate || 1, position: Math.min(t, d) }); } catch (e) {}
    }
  }

  function refresh(){
    if (!P) return;
    var playing = isPlaying(), t = position();
    var label = playing ? "Pause" : finished() ? "Play again" : t > 5 ? "Resume at " + fmt(t) : "Play episode";
    document.querySelectorAll(".sh-pod-play").forEach(function(b){
      b.innerHTML = (playing ? I_PAUSE : I_PLAY) + '<span class="sh-pod-play-label">' + esc(label) + '</span>';
      b.setAttribute("aria-label", playing ? "Pause Timmy Time" : label + ", Timmy Time");
    });
    document.querySelectorAll(".sh-pod-card").forEach(function(c){ c.classList.toggle("is-playing", playing); });
    document.querySelectorAll(".sh-pod-rate").forEach(function(b){ b.textContent = rate() + "×"; });
    if (dock) {
      dock.setAttribute("data-state", playing ? "playing" : "paused");
      dock.querySelector(".sh-pod-dock-play").innerHTML = playing ? I_PAUSE : I_PLAY;
      dock.querySelector(".sh-pod-dock-play").setAttribute("aria-label", playing ? "Pause" : "Play");
    }
    if ("mediaSession" in navigator && started) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    if (playing) setNote("");
    placeDock();
    tick();
  }

  /* ---------- the pinned player ---------- */
  function dockEl(){
    if (dock) return dock;
    dock = document.createElement("div");
    dock.className = "sh-pod-dock"; dock.hidden = true;
    dock.setAttribute("role", "region"); dock.setAttribute("aria-label", "Timmy Time player");
    dock.innerHTML =
      '<button type="button" class="sh-pod-dock-play" data-pod="dock-play" aria-label="Pause">' + I_PAUSE + '</button>' +
      '<div class="sh-pod-dock-mid">' +
        '<button type="button" class="sh-pod-dock-title" data-pod="dock-title" title="Go to the episode"><span class="sh-pod-dock-art">' + ART + '</span><b>' + esc(P.show || "Timmy Time") + '</b><span class="sh-pod-dock-sub"></span></button>' +
        '<input type="range" class="sh-pod-seek" min="0" max="1000" value="0" step="1" aria-label="Position in the episode">' +
      '</div>' +
      '<button type="button" class="sh-pod-dock-btn" data-pod="dock-back" aria-label="Back 15 seconds">' + I_BACK + '</button>' +
      '<span class="sh-pod-dock-time"></span>' +
      '<button type="button" class="sh-pod-dock-close" data-pod="dock-close" aria-label="Stop and close the player">&times;</button>';
    document.body.appendChild(dock);
    dock.addEventListener("click", function(e){
      var b = e.target.closest("[data-pod]"); if (!b) return;
      var what = b.getAttribute("data-pod");
      if (what === "dock-play") toggle();
      else if (what === "dock-back") skip(-15);
      else if (what === "dock-close") { pause(); dock.hidden = true; dock._closed = true; }
      else if (what === "dock-title") goToCard();
    });
    wireSeek(dock.querySelector(".sh-pod-seek"));
    return dock;
  }

  function placeDock(){
    if (!started) return;
    var d = dockEl();
    if (isPlaying()) d._closed = false;
    d.hidden = d._closed || cardsSeen > 0;
    document.documentElement.classList.toggle("sh-pod-docked", !d.hidden);
  }

  function goToCard(){
    var card = document.querySelector(".sh-pod-card");
    if (!card) return false;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("is-flash"); void card.offsetWidth; card.classList.add("is-flash");
    return true;
  }

  function mediaSession(){
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: P.title, artist: "Timmy Tooth", album: P.show || "Timmy Time",
        artwork: [192, 512].map(function(n){ return { src: new URL("../../assets/icon-" + n + ".png?v=2", location.href).href, sizes: n + "x" + n, type: "image/png" }; })
      });
      var ms = navigator.mediaSession;
      ms.setActionHandler("play", play);
      ms.setActionHandler("pause", pause);
      ms.setActionHandler("seekbackward", function(d){ skip(-((d && d.seekOffset) || 15)); });
      ms.setActionHandler("seekforward", function(d){ skip((d && d.seekOffset) || 30); });
      ms.setActionHandler("seekto", function(d){ if (d && d.seekTime != null) seekTo(d.seekTime); });
      ms.setActionHandler("previoustrack", function(){
        if (!P.chapters || !P.chapters.length) return;
        var t = position(), c = chapterAt(t);
        if (t - P.chapters[c].t < 3 && c > 0) c--;  /* like a CD player: start of this chapter, or the one before */
        seekTo(P.chapters[c].t);
      });
      ms.setActionHandler("nexttrack", function(){ var ch = P.chapters && P.chapters[chapterAt(position()) + 1]; if (ch) seekTo(ch.t); });
    } catch (e) {}
  }

  /* ---------- mounting ---------- */
  function fill(){
    document.querySelectorAll("[data-sh-podcast]:not([data-sh-podcast-ready])").forEach(wireCard);
  }

  function mount(hub){
    if (mounted) return; mounted = true;
    HUB = hub || "";
    P = window.SH_PODCAST;
    if (!P || !P.src) return;
    P.id = P.id || "episode";
    if ("IntersectionObserver" in window) {
      var vis = new Set();
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if (en.isIntersecting) vis.add(en.target); else vis.delete(en.target); });
        vis.forEach(function(el){ if (!el.isConnected) vis.delete(el); });
        cardsSeen = vis.size; placeDock();
      });
    }
    fill();
    new MutationObserver(function(){
      fill();
      if (io && cardsSeen && !document.querySelector(".sh-pod-card")) { cardsSeen = 0; placeDock(); }
    }).observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("[data-sh-podcast-open]").forEach(function(b){ b.hidden = false; });
    document.addEventListener("click", function(e){
      var b = e.target.closest("[data-sh-podcast-open]"); if (!b) return;
      if (!goToCard()) { play(); }
    });
    /* only one voice at a time: a lecture's Listen button pauses the episode */
    setInterval(function(){ try { if (isPlaying() && window.shTTS && window.shTTS.listening()) pause(); } catch (e) {} }, 700);
    window.addEventListener("pagehide", function(){ if (started) tick(true); });
    if (location.hash === "#timmy") setTimeout(goToCard, 350);
    refresh();
  }

  window.shPodcast = {
    mount: mount,
    playing: function(){ return isPlaying(); },
    id: function(){ return P && P.id; },
    play: function(){ if (P) play(); },
    pause: pause
  };
})();
