/* ============ THE BOWLING EGG (widget/bowling.js, window.shBowl): redesign phase 4, part D ============
   Eight short clips like the odd cartoons a bowling alley's screens play after a strike or a spare, Timmy style: the
   pins are the Plaque crew and the ball is a giant sugar-free mint (vault/tasks/done/2026-11-06-redesign-bowling-egg.md).

   Only the redesign's pages load this file, and only on first use: the engine (widget/hub-rewards.js) fetches it the
   first time a run of first-try right answers reaches a strike, and Timmy's place (widget/place.js) the first time its
   bowling lane is tapped. Never with a page. It fetches the drawings itself, widget/hub-art/bowling.js
   (window.SH_BOWL, built from tools/figures/site/bowling.mjs), and keeps its styles here, so a clip costs two requests.

   shBowl.play(clip, { host, say, queue }) shows one clip as a small card: docked at the bottom of the screen (above the
     bar on a phone), or inside `host` (the place's full view). 3 to 5 seconds, gone by itself or at a tap; Esc or its
     close button from the keyboard. It takes no focus. With reduced motion it is the clip's last frame and its word.
     On the bar it waits its turn behind a rank-up, level or trophy card (window.shRankUp.scene), and it never shows
     during a mock (html.sh-mock-on), with the eggs off (sh_pref_eggs) or in Focus mode (sh_pref_focus).
   shBowl.random()   a clip for the lane, any of the eight, not the one just shown.
   shBowl.seen()     the clips seen on this device (sh_bowl_seen). All eight sets sh_bowl_trophy (the date), Timmy says
                     a line and the page hears sh:bowl-trophy. Nothing goes to the server for a sighting or the trophy:
                     the server's record_achievement doesn't take the kind yet (Sam's calls, 2026-11-12).
   shBowl.TROPHY     the secret trophy's words, for the trophy case; its drawing is medals.mjs's EGG_TROPHIES.bowling.

   Every play is counted as egg:bowling=<clip> (window.shTrack). The card's close button carries data-bowl="close",
   so click counts never pick up words.
   ============ */
(function(){
  "use strict";
  if (window.shBowl) return;
  var W = window, D = document, me = D.currentScript;
  var BASE = me && me.src ? me.src.replace(/[^\/]*(\?.*)?$/, "") : "widget/";
  var KEYS = ["panic", "conga", "floss", "rocket", "sweep", "neighbor", "turkey", "spare"], STRIKES = KEYS.slice(0, 6);
  var TROPHY = { k: "bowling", n: "Lane Legend", d: "Saw all eight bowling clips", secret: true,
    clue: "The alley’s screen plays something odd after a strike. There are eight." };
  var TROPHY_LINE = "That’s all eight bowling clips! Thirty-one watched every one. Well, until he fainted.";

  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function track(k){ try { if (W.shTrack) W.shTrack(k); } catch (e) {} }
  function reduced(){ try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  /* the eggs switch and Focus mode (Focus writes sh_pref_eggs off too; both are read, so an old Focus still counts) */
  function off(){ return ls("sh_pref_eggs") === "off" || ls("sh_pref_focus") === "on"; }
  function mockOn(){ return D.documentElement.classList.contains("sh-mock-on"); }
  function modalOpen(){ try { return !!D.querySelector("dialog[open]:modal"); } catch (e) { return !!D.querySelector("dialog[open]"); } }

  /* ---------- the drawings, once, on first use ---------- */
  var kitP = null;
  function kit(){
    if (W.SH_BOWL && W.SH_BOWL.render) return Promise.resolve(W.SH_BOWL);
    return kitP || (kitP = new Promise(function(res, rej){
      var s = D.createElement("script"); s.src = BASE + "hub-art/bowling.js"; s.async = true;
      s.onload = function(){ if (W.SH_BOWL && W.SH_BOWL.render) res(W.SH_BOWL); else { kitP = null; rej(new Error("no kit")); } };
      s.onerror = function(){ kitP = null; rej(new Error("hub-art/bowling.js")); };
      D.head.appendChild(s);
    }));
  }

  /* ---------- sightings, kept on this device ---------- */
  function seen(){
    var a = []; try { a = JSON.parse(ls("sh_bowl_seen") || "[]") || []; } catch (e) {}
    return Array.isArray(a) ? a.filter(function(k, i){ return KEYS.indexOf(k) > -1 && a.indexOf(k) === i; }) : [];
  }
  /* true when this sighting completes the eight */
  function sighted(k){
    var s = seen(); if (s.indexOf(k) > -1) return false;
    s.push(k); lsSet("sh_bowl_seen", JSON.stringify(s));
    if (s.length < KEYS.length || ls("sh_bowl_trophy")) return false;
    var d = new Date(); lsSet("sh_bowl_trophy", d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
    return true;
  }
  var last = "";
  function random(){ var pool = KEYS.filter(function(k){ return k !== last; }); return pool[Math.floor(Math.random() * pool.length)]; }

  /* ---------- the card ---------- */
  var CSS = [
    ".shb{position:fixed;z-index:10020;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:min(340px,calc(100vw - 32px));transform:translate(-50%,0);",
    "  opacity:1;transition:opacity .24s ease-out,transform .24s ease-out;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    ".shb.shb-in-host{position:absolute;bottom:14px;width:min(320px,calc(100% - 28px))}",
    ".shb.is-off{opacity:0;transform:translate(-50%,16px)}",
    ".shb-tv{position:relative;padding:8px;border-radius:16px;background:#2A2230;border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 32px rgba(20,12,24,.32)}",
    ".shb-screen{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#EFE6EE;container-type:inline-size}",
    ".shb-img{display:block;width:100%;height:100%}",
    /* the word: gold letters in Timmy's ink, with a solid ink copy just under them for depth (as on the design page) */
    ".shb-word{position:absolute;left:50%;top:42%;font:900 13cqw/1 system-ui,-apple-system,'Segoe UI',sans-serif;white-space:nowrap;pointer-events:none;",
    "  color:#FFF0B3;-webkit-text-stroke:.9cqw #3B2E3A;paint-order:stroke fill;isolation:isolate;transform:translate(-50%,-50%) scale(0);",
    "  animation:shb-word .5s cubic-bezier(.2,1.5,.4,1) both}",
    ".shb-word::before{content:attr(data-w);position:absolute;left:0;top:1.2cqw;z-index:-1;color:#3B2E3A}",
    ".shb.is-still .shb-word{animation:none;transform:translate(-50%,-50%) rotate(-3deg)}",
    "@keyframes shb-word{from{transform:translate(-50%,-50%) scale(0) rotate(-10deg)}to{transform:translate(-50%,-50%) scale(1) rotate(-3deg)}}",
    ".shb .shb-x{position:absolute;top:-10px;right:-10px;display:grid;place-items:center;width:32px;height:32px;padding:0;border-radius:50%;border:2px solid #fff;",
    "  background:#2A2230;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(20,12,24,.3)}",
    ".shb .shb-x:focus-visible{outline:3px solid #F2C94C;outline-offset:2px}",
    ".shb .shb-x svg{display:block}",
    ".shb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
    "@media (max-width:640px){.shb:not(.shb-in-host){bottom:calc(88px + env(safe-area-inset-bottom,0px))}}",
    "@media (prefers-reduced-motion:reduce){.shb{transition:opacity .2s}.shb.is-off{transform:translate(-50%,0)}.shb-word{animation:none;transform:translate(-50%,-50%) rotate(-3deg)}}"
  ].join("\n");
  function css(){ if (D.getElementById("shb-css")) return; var st = D.createElement("style"); st.id = "shb-css"; st.textContent = CSS; D.head.appendChild(st); }
  var X = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

  var cur = null, uid = 0;
  /* the clip as a picture with its motion inside it (its own document, so nothing on the page styles it); a new number
     each time, so it starts from the top */
  function picture(K, c, still){
    var svg = K.render(c.k, { still: still }).replace(/^(<svg[^>]*)>/, function(m, a){ return a + ' data-n="' + (++uid) + '"><style>' + K.css(c.k) + "</style>"; });
    return '<img class="shb-img" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '" alt="' + esc(c.alt + (still ? " (the last frame)" : "")) + '" decoding="async">';
  }
  function close(how){
    var v = cur; if (!v) return;
    cur = null; clearTimeout(v.t); clearTimeout(v.gone);
    D.removeEventListener("keydown", v.key, true);
    var done = function(){ if (v.el.parentNode) v.el.parentNode.removeChild(v.el); v.done(how || "time"); };
    if (reduced() || how === "replace") { done(); return; }
    v.el.classList.add("is-off"); v.gone = setTimeout(done, 260);
  }
  function show(K, k, o){
    return new Promise(function(res){
      var c = K.CLIPS.filter(function(x){ return x.k === k; })[0];
      if (!c) { res(false); return; }
      if (cur) close("replace");
      css();
      var still = !!(o.still || reduced()), host = o.host && o.host.isConnected ? o.host : null;
      var el = D.createElement("div");
      el.className = "shb" + (still ? " is-still" : "") + (host ? " shb-in-host" : "") + " is-off";
      el.setAttribute("role", "group"); el.setAttribute("aria-label", "Bowling clip: " + c.n);
      el.setAttribute("data-bowl", "card"); el.setAttribute("data-clip", c.k);
      el.innerHTML = '<div class="shb-tv"><div class="shb-screen">' + picture(K, c, still) +
        '<span class="shb-word" data-w="' + esc(c.word) + '" style="animation-delay:' + c.wordAt + "s;left:" + c.wordPos[0] + "%;top:" + c.wordPos[1] + '%" aria-hidden="true">' + esc(c.word) + "</span></div>" +
        '<button type="button" class="shb-x" data-bowl="close" aria-label="Close the bowling clip">' + X + "</button></div>" +
        '<p class="shb-sr" role="status"></p>';
      if (host) { if (getComputedStyle(host).position === "static") host.style.position = "relative"; host.appendChild(el); }
      else D.body.appendChild(el);
      void el.offsetWidth; el.classList.remove("is-off");
      setTimeout(function(){ var sr = el.querySelector(".shb-sr"); if (sr) sr.textContent = c.word + " " + c.n + ": " + c.note; }, 60);
      var v = cur = { el: el, k: c.k, t: 0, gone: 0, done: function(how){ res(true); if (o.onClose) o.onClose(how); } };
      var stay = still ? 4000 : Math.round(c.D * 1000) + 1100;
      var arm = function(ms){ clearTimeout(v.t); v.t = setTimeout(function(){ if (cur === v) close("time"); }, ms); };
      arm(stay);
      /* a tap anywhere on the card ends it; hovering or focusing it holds it, then it goes a moment after */
      el.addEventListener("click", function(e){ e.stopPropagation(); if (cur === v) close("tap"); });
      el.addEventListener("mouseenter", function(){ clearTimeout(v.t); });
      el.addEventListener("mouseleave", function(){ if (cur === v) arm(1500); });
      el.addEventListener("focusin", function(){ clearTimeout(v.t); });
      el.addEventListener("focusout", function(){ if (cur === v) arm(1500); });
      v.key = function(e){ if (e.key === "Escape" && cur === v) { e.preventDefault(); e.stopPropagation(); close("key"); } };
      D.addEventListener("keydown", v.key, true);
      last = c.k;
      track("egg:bowling=" + c.k);
      if (sighted(c.k)) {
        var say = o.say || function(t){ try { if (W.shPet && W.shPet.say) W.shPet.say(t, "do-hop", 6000); } catch (e) {} };
        setTimeout(function(){ say(TROPHY_LINE); }, still ? 600 : Math.round(c.D * 1000));
        try { D.dispatchEvent(new CustomEvent("sh:bowl-trophy", { detail: { k: TROPHY.k } })); } catch (e) {}
      }
    });
  }
  /* o: { host (an element to show it in, e.g. the place's stage), say (Timmy's voice there), queue (false: now),
     still, onClose(how) }. Resolves true once shown and closed, false when it didn't show. */
  function play(k, o){
    o = o || {};
    if (KEYS.indexOf(k) < 0) k = random();
    if (off()) return Promise.resolve(false);
    var go = function(){
      if (off() || (!o.host && (mockOn() || modalOpen()))) return Promise.resolve(false);
      return kit().then(function(K){ return show(K, k, o); }, function(){ return false; });
    };
    var R = W.shRankUp;
    if (o.queue === false || o.host || !R || !R.scene) return go();
    return new Promise(function(res){ R.scene(function(done){ go().then(function(r){ done(); res(r); }, function(){ done(); res(false); }); }); });
  }

  W.shBowl = { KEYS: KEYS, STRIKES: STRIKES, TROPHY: TROPHY, play: play, random: random, seen: seen, close: function(){ close("api"); },
    trophy: function(){ return !!ls("sh_bowl_trophy"); }, off: off, ready: kit,
    showing: function(){ return cur ? cur.k : ""; } };
})();
