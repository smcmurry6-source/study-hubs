/* ============ TIMMY ============
   Type T-I-M-M-Y anywhere on a page (outside a text field) and he arrives.
   Loaded directly by the dashboard and review pages, and injected into every
   hub by widget/v3.js. Fully self-contained and self-cleaning: every inline
   style it touches is saved and put back afterwards, and Esc ends it early.
   Like the eggs in widget/eggs.js: off with Settings → Surprises, never during a
   mock exam, also works typed into a hub's Search box (phones), and announces
   itself as "sh:egg-local" so the tooth buddy (widget/pet.js) can react. */
(function(){
  if (window.__timmyLoaded) return;
  window.__timmyLoaded = true;

  var CODE = "TIMMY", buf = "", running = false;
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function allowed(){
    try { if (localStorage.getItem("sh_pref_eggs") === "off") return false; } catch (e) {}
    try { var H = window.shEggHooks; if (H && H.section && /(^|\/)mock/.test(String(H.section() || ""))) return false; } catch (e) {}
    return true;
  }

  document.addEventListener("keydown", function(e){
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (running){ if (e.key === "Escape") finish(true); return; }
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toUpperCase()).slice(-CODE.length);
    if (buf === CODE){ buf = ""; if (allowed()) summon(); }
  }, true);
  /* the hub's Search box, same as the other magic words */
  document.addEventListener("input", function(e){
    var t = e.target;
    if (running || !t || t.id !== "shstat-search-input") return;
    if (String(t.value || "").trim().toUpperCase() === CODE && allowed()) summon();
  }, true);

  /* ---------- styles ---------- */
  var CSS = [
    "#tm-root{position:fixed;inset:0;z-index:2147483647;pointer-events:auto;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;overflow:hidden;transition:opacity .7s}",
    "#tm-root *{box-sizing:border-box}",
    ".tm-dim{position:absolute;inset:0;background:#05000f;opacity:0;transition:opacity 1.2s ease}",
    ".tm-stars{position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:screen;opacity:0;transition:opacity 1s}",
    ".tm-hue{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s;-webkit-backdrop-filter:hue-rotate(0deg) saturate(1.8);backdrop-filter:hue-rotate(0deg) saturate(1.8)}",
    ".tm-hue.on{opacity:1;animation:tm-hue 1.6s linear infinite}",
    "@keyframes tm-hue{from{-webkit-backdrop-filter:hue-rotate(0deg) saturate(1.8);backdrop-filter:hue-rotate(0deg) saturate(1.8)}to{-webkit-backdrop-filter:hue-rotate(360deg) saturate(1.8);backdrop-filter:hue-rotate(360deg) saturate(1.8)}}",
    ".tm-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}",
    ".tm-whisper{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);color:#d9c8ff;font:italic 600 clamp(18px,3.4vw,34px)/1.3 Georgia,serif;letter-spacing:.04em;text-align:center;width:min(90vw,900px);text-shadow:0 0 18px #7c3aed;transition:opacity .4s}",
    ".tm-whisper.glitch{animation:tm-glitch .12s steps(2) infinite}",
    "@keyframes tm-glitch{0%{transform:translate(-50%,-50%) skewX(0)}50%{transform:translate(calc(-50% + 3px),calc(-50% - 2px)) skewX(-8deg);text-shadow:-3px 0 #ff2a6d,3px 0 #05d9e8}}",
    ".tm-stage{position:absolute;left:50%;bottom:0;width:min(62vh,78vw);transform:translate(-50%,115%);will-change:transform}",
    ".tm-stage.up{transition:transform 1.3s cubic-bezier(.2,1.6,.4,1);transform:translate(-50%,-6%)}",
    ".tm-stage.dance .tm-big{animation:tm-dance .45s ease-in-out infinite alternate}",
    "@keyframes tm-dance{from{transform:rotate(-9deg) translateY(0)}to{transform:rotate(9deg) translateY(-6%)}}",
    ".tm-stage.spin .tm-big{animation:tm-spin .7s cubic-bezier(.3,1.5,.5,1)}",
    "@keyframes tm-spin{from{transform:rotate(0) scale(1)}50%{transform:rotate(200deg) scale(1.25)}to{transform:rotate(360deg) scale(1)}}",
    ".tm-big{display:block;width:100%;height:auto;cursor:pointer;filter:drop-shadow(0 0 40px rgba(255,200,60,.55))}",
    ".tm-mouth{transform-box:fill-box;transform-origin:50% 0;transition:transform .15s}",
    ".yell .tm-mouth{animation:tm-yell .09s linear infinite alternate}",
    "@keyframes tm-yell{from{transform:scale(1,1)}to{transform:scale(1.15,1.55)}}",
    ".tm-word{position:absolute;left:0;right:0;top:6vh;display:flex;justify-content:center;gap:1.2vw;pointer-events:none}",
    ".tm-word span{display:inline-block;font:900 clamp(56px,13vw,190px)/1 Impact,'Arial Black',sans-serif;color:#fff;-webkit-text-stroke:4px #1a0b2e;text-shadow:0 8px 0 #ff2a6d,0 16px 0 #7c3aed,0 0 60px #ffd23f;transform:scale(6) rotate(-30deg);opacity:0}",
    ".tm-word span.in{transition:transform .28s cubic-bezier(.2,1.8,.4,1),opacity .1s;transform:scale(1) rotate(0);opacity:1}",
    ".tm-word.wave span.in{animation:tm-wave .8s ease-in-out infinite}",
    "@keyframes tm-wave{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-18%) rotate(4deg)}}",
    ".tm-caption{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;text-align:center;color:#fff;width:min(92vw,820px);padding:22px 26px;border-radius:22px;background:rgba(20,6,40,.82);border:3px solid #ffd23f;box-shadow:0 0 0 6px rgba(255,42,109,.35),0 20px 80px rgba(0,0,0,.6);transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .3s;pointer-events:none}",
    ".tm-caption.in{opacity:1;transform:translate(-50%,-50%) scale(1)}",
    ".tm-caption b{display:block;font:900 clamp(22px,4.2vw,44px)/1.1 Impact,'Arial Black',sans-serif;letter-spacing:.03em;background:linear-gradient(90deg,#ffd23f,#ff2a6d,#05d9e8,#ffd23f);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:tm-grad 2s linear infinite}",
    "@keyframes tm-grad{to{background-position:300% 0}}",
    ".tm-caption small{display:block;margin-top:10px;font-size:clamp(13px,1.8vw,16px);color:#d9c8ff;opacity:.9}",
    ".tm-mini{position:absolute;top:-12vh;width:9vh;pointer-events:none}",
    ".tm-skip{position:absolute;right:16px;bottom:16px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.45);color:#fff;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer;opacity:.75}",
    ".tm-skip:hover{opacity:1}"
  ].join("\n");

  function injectCSS(){
    if (document.getElementById("tm-style")) return;
    var s = document.createElement("style"); s.id = "tm-style"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- the man himself ---------- */
  function timmySVG(cls){
    return '<svg class="' + cls + '" viewBox="0 0 200 232" aria-hidden="true">' +
      '<path d="M50 62 L60 16 L82 44 L100 6 L118 44 L140 16 L150 62 Z" fill="#ffd23f" stroke="#7a4a00" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="8" r="7" fill="#ff2a6d" stroke="#7a4a00" stroke-width="3"/>' +
      '<circle cx="60" cy="17" r="5" fill="#05d9e8" stroke="#7a4a00" stroke-width="3"/>' +
      '<circle cx="140" cy="17" r="5" fill="#05d9e8" stroke="#7a4a00" stroke-width="3"/>' +
      '<circle cx="100" cy="140" r="86" fill="#ffb84d" stroke="#6b3a00" stroke-width="6"/>' +
      '<ellipse cx="46" cy="166" rx="15" ry="9" fill="#ff6b8b" opacity=".6"/>' +
      '<ellipse cx="154" cy="166" rx="15" ry="9" fill="#ff6b8b" opacity=".6"/>' +
      '<path d="M44 86 Q68 70 90 88" fill="none" stroke="#6b3a00" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M110 88 Q132 70 156 86" fill="none" stroke="#6b3a00" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="70" cy="122" rx="25" ry="29" fill="#fff" stroke="#6b3a00" stroke-width="5"/>' +
      '<ellipse cx="130" cy="122" rx="25" ry="29" fill="#fff" stroke="#6b3a00" stroke-width="5"/>' +
      '<g class="tm-pupil" data-cx="70" data-cy="122"><circle cx="70" cy="126" r="12" fill="#1a0b2e"/><circle cx="74" cy="120" r="4.5" fill="#fff"/></g>' +
      '<g class="tm-pupil" data-cx="130" data-cy="122"><circle cx="130" cy="126" r="12" fill="#1a0b2e"/><circle cx="134" cy="120" r="4.5" fill="#fff"/></g>' +
      '<g class="tm-mouth"><path d="M60 168 Q100 222 140 168 Z" fill="#5a0f1f" stroke="#6b3a00" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="84" y="168" width="32" height="10" rx="2" fill="#fff"/>' +
      '<path d="M80 194 Q100 184 120 194 Q100 212 80 194 Z" fill="#ff5c7a"/></g>' +
      '</svg>';
  }

  /* ---------- sound (all synthesized, nothing to download) ---------- */
  var ac = null, master = null;
  function startAudio(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      if (!ac) ac = new AC();
      if (ac.state === "suspended") ac.resume();
      master = ac.createGain(); master.gain.value = .32; master.connect(ac.destination);
    }catch(e){ master = null; }
  }
  function stopAudio(){
    if (!ac || !master) return;
    try{ var m = master; m.gain.setTargetAtTime(0, ac.currentTime, .08); setTimeout(function(){ try{ m.disconnect(); }catch(e){} }, 600); }catch(e){}
    master = null;
  }
  function tone(type, f0, f1, at, dur, vol){
    if (!master) return;
    try{
      var t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
    }catch(e){}
  }
  function drone(dur){
    if (!master) return;
    try{
      var t = ac.currentTime, f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = "lowpass"; f.Q.value = 12; f.frequency.setValueAtTime(90, t); f.frequency.exponentialRampToValueAtTime(2400, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.55, t + dur * .9); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      f.connect(g); g.connect(master);
      [41.2, 41.7, 82.4, 61.7].forEach(function(hz){
        var o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(hz, t); o.frequency.exponentialRampToValueAtTime(hz * 1.5, t + dur);
        o.connect(f); o.start(t); o.stop(t + dur + .05);
      });
    }catch(e){}
  }
  function boom(){
    if (!master) return;
    try{
      var t = ac.currentTime, len = ac.sampleRate * 1.4, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = b; f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 1.1;
      n.connect(f); f.connect(g); g.connect(master); n.start(t);
    }catch(e){}
    tone("sine", 110, 28, 0, 1.3, 1);
  }
  var LETTER_NOTES = [523.25, 659.25, 783.99, 783.99, 1046.5];
  function partyLoop(bars){
    var seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880, 698.46], step = .11;
    for (var i = 0; i < bars * seq.length; i++){
      tone("square", seq[i % seq.length], 0, i * step, .1, .12);
      if (i % 4 === 0) tone("triangle", seq[i % seq.length] / 4, 0, i * step, .2, .3);
      if (i % 2 === 1) tone("sine", 180, 40, i * step, .08, .25);
    }
  }
  function sayTimmy(){
    try{
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance("TIMMY!"); u.pitch = 2; u.rate = .75; u.volume = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }catch(e){}
  }

  /* ---------- warp-speed starfield ---------- */
  function starfield(canvas){
    var ctx = canvas.getContext("2d"), W, H, speed = 1.5, raf = 0, stars = [], i;
    function size(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    function star(far){ return { x:(Math.random() - .5) * W * 2, y:(Math.random() - .5) * H * 2, z:far ? W : Math.random() * W, h:Math.random() * 360 }; }
    size();
    for (i = 0; i < 420; i++) stars.push(star(false));
    function frame(){
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(0, 0, W, H);
      speed = Math.min(speed * 1.025, 55);
      for (var k = 0; k < stars.length; k++){
        var s = stars[k], pz = s.z; s.z -= speed;
        if (s.z < 1){ stars[k] = star(true); continue; }
        var sx = W / 2 + s.x / s.z * W / 2, sy = H / 2 + s.y / s.z * W / 2;
        var px = W / 2 + s.x / pz * W / 2, py = H / 2 + s.y / pz * W / 2;
        ctx.strokeStyle = "hsl(" + s.h + ",100%,72%)"; ctx.lineWidth = Math.max(.5, (1 - s.z / W) * 4);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return function(){ cancelAnimationFrame(raf); };
  }

  /* ---------- the page falls apart (and is put back together) ---------- */
  function pickPieces(root){
    var out = [], vw = innerWidth, vh = innerHeight, maxA = vw * vh * .3;
    (function walk(el){
      for (var c = el.firstElementChild; c && out.length < 80; c = c.nextElementSibling){
        if (c === root || /^(SCRIPT|STYLE|LINK|META|NOSCRIPT|TEMPLATE|BR)$/.test(c.tagName)) continue;
        var cs = getComputedStyle(c);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        var r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw){ continue; }
        if (cs.display === "inline" || cs.display === "contents" || r.width < 10 || r.height < 10 || r.width * r.height > maxA){ walk(c); continue; }
        out.push({ el:c, r:r, t:c.style.transform, tr:c.style.transition, wc:c.style.willChange });
      }
    })(document.body);
    return out;
  }
  function crumble(pieces){
    var vw = innerWidth, vh = innerHeight, raf = 0, last = performance.now();
    pieces.forEach(function(p){
      p.x = 0; p.y = 0; p.rot = 0;
      p.vx = (Math.random() - .5) * 14; p.vy = -4 - Math.random() * 12; p.vr = (Math.random() - .5) * 18;
      p.floor = vh - p.r.bottom; p.minX = -p.r.left; p.maxX = vw - p.r.right;
      p.el.style.transition = "none"; p.el.style.willChange = "transform";
    });
    function frame(now){
      var dt = Math.min(2.5, (now - last) / 16.67); last = now;
      pieces.forEach(function(p){
        p.vy += .75 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.y > p.floor){ p.y = p.floor; p.vy *= -.42; p.vx *= .75; p.vr *= .6; }
        if (p.x < p.minX){ p.x = p.minX; p.vx = Math.abs(p.vx) * .6; }
        if (p.x > p.maxX){ p.x = p.maxX; p.vx = -Math.abs(p.vx) * .6; }
        p.el.style.transform = (p.t ? p.t + " " : "") + "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px) rotate(" + p.rot.toFixed(1) + "deg)";
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return function(){ cancelAnimationFrame(raf); };
  }
  function rebuild(pieces, instant){
    pieces.forEach(function(p, i){
      if (instant){ p.el.style.transition = p.tr; p.el.style.transform = p.t; p.el.style.willChange = p.wc; return; }
      p.el.style.transition = "transform 1.1s cubic-bezier(.3,1.4,.5,1) " + (i * 12) + "ms";
      p.el.style.transform = p.t || "none";
    });
    if (!instant) setTimeout(function(){ rebuild(pieces, true); }, 1300 + pieces.length * 12);
  }

  /* ---------- eyes follow you ---------- */
  function trackEyes(svg){
    var mx = -1, my = -1, moved = 0, raf = 0, pupils = svg.querySelectorAll(".tm-pupil");
    function onMove(e){ mx = e.clientX; my = e.clientY; moved = performance.now(); }
    addEventListener("pointermove", onMove);
    function frame(now){
      var r = svg.getBoundingClientRect(), sc = r.width / 200;
      for (var i = 0; i < pupils.length; i++){
        var g = pupils[i], cx = +g.getAttribute("data-cx"), cy = +g.getAttribute("data-cy"), dx, dy;
        if (now - moved < 1500 && mx >= 0){ dx = mx - (r.left + cx * sc); dy = my - (r.top + cy * sc); }
        else { dx = Math.cos(now / 260); dy = Math.sin(now / 260); }
        var d = Math.hypot(dx, dy) || 1, m = Math.min(11, d);
        g.setAttribute("transform", "translate(" + (dx / d * m).toFixed(2) + " " + (dy / d * m).toFixed(2) + ")");
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return function(){ cancelAnimationFrame(raf); removeEventListener("pointermove", onMove); };
  }

  /* ---------- it is raining Timmys ---------- */
  function rain(root, n){
    for (var i = 0; i < n; i++){
      (function(i){
        var w = document.createElement("div"); w.innerHTML = timmySVG("tm-mini-svg");
        var m = w.firstChild; m.setAttribute("class", "tm-mini");
        m.style.left = (Math.random() * 100) + "vw"; m.style.width = (5 + Math.random() * 9) + "vh";
        root.appendChild(m);
        var rot = (Math.random() - .5) * 1080, drift = (Math.random() - .5) * 30;
        var a = m.animate([{ transform:"translate(0,0) rotate(0)" }, { transform:"translate(" + drift + "vw,130vh) rotate(" + rot + "deg)" }],
          { duration:1800 + Math.random() * 2200, delay:i * 70, easing:"cubic-bezier(.4,0,.8,1)", fill:"both" });
        a.onfinish = function(){ m.remove(); };
      })(i);
    }
  }

  /* he means harm, but his curses are terrible: a different one each time he's summoned on this device */
  var CURSES = ["Any question you miss in the next hour is his fault, not yours.",
    "Your next wrong answer will feel slightly more wrong than usual.",
    "He will be watching you floss. Closely.",
    "Every cavity in the class this week is on him.",
    "Your coffee will be lukewarm. Forever. (Or until it cools down.)",
    "You will mix up mesial and distal exactly once today."];

  /* ---------- the show ---------- */
  var timers = [], cleanups = [], pieces = [], root = null;
  function at(ms, fn){ timers.push(setTimeout(fn, ms)); }

  function summon(){
    running = true; injectCSS(); startAudio();
    var n = 1; try{ n = (+localStorage.getItem("sh_timmy_count") || 0) + 1; localStorage.setItem("sh_timmy_count", String(n)); }catch(e){}

    root = document.createElement("div"); root.id = "tm-root";
    root.innerHTML =
      '<div class="tm-dim"></div><canvas class="tm-stars"></canvas><div class="tm-hue"></div>' +
      '<div class="tm-whisper"></div><div class="tm-stage">' + timmySVG("tm-big") + '</div>' +
      '<div class="tm-word"></div><div class="tm-caption"></div><div class="tm-flash"></div>' +
      '<button type="button" class="tm-skip">ESC TO ESCAPE TIMMY</button>';
    document.documentElement.appendChild(root);
    var q = function(s){ return root.querySelector(s); };
    var dim = q(".tm-dim"), stars = q(".tm-stars"), hue = q(".tm-hue"), whisper = q(".tm-whisper"),
        stage = q(".tm-stage"), big = q(".tm-big"), word = q(".tm-word"), caption = q(".tm-caption"), flash = q(".tm-flash");

    var block = function(e){ e.preventDefault(); };
    root.addEventListener("wheel", block, { passive:false });
    root.addEventListener("touchmove", block, { passive:false });
    q(".tm-skip").addEventListener("click", function(){ finish(true); });
    big.addEventListener("click", function(){
      stage.classList.remove("spin"); void stage.offsetWidth; stage.classList.add("spin");
      tone("square", 300, 1200, 0, .25, .2); sayTimmy();
      setTimeout(function(){ stage.classList.remove("spin"); }, 720);
    });
    cleanups.push(trackEyes(big));

    /* 0s — the room goes dark */
    requestAnimationFrame(function(){ dim.style.opacity = ".94"; });
    drone(2.7);
    var line = "you shouldn't have said his name.", k = 0;
    at(500, function type(){ whisper.textContent = line.slice(0, ++k); if (k < line.length) at(45, type); else whisper.classList.add("glitch"); });

    /* 2.7s — he breaks through */
    at(2700, function(){
      whisper.style.opacity = "0"; boom();
      flash.animate([{ opacity:1 }, { opacity:0 }], { duration:700, easing:"ease-out" });
      dim.style.transition = "opacity .25s"; dim.style.opacity = REDUCED ? ".8" : ".55";
      if (!REDUCED){
        pieces = pickPieces(root); cleanups.push(crumble(pieces));
        stars.style.opacity = "1"; cleanups.push(starfield(stars));
        root.animate([{ transform:"translate(0,0)" }, { transform:"translate(-14px,9px)" }, { transform:"translate(12px,-11px)" }, { transform:"translate(-8px,6px)" }, { transform:"translate(0,0)" }], { duration:500 });
      }
    });

    /* 4s — rising */
    at(4000, function(){ stage.classList.add("up"); tone("sawtooth", 80, 640, 0, 1.2, .25); });

    /* 5.3s — T. I. M. M. Y. */
    "TIMMY".split("").forEach(function(ch, i){
      at(5300 + i * 300, function(){
        var s = document.createElement("span"); s.textContent = ch; word.appendChild(s);
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ s.classList.add("in"); }); });
        tone("square", LETTER_NOTES[i], 0, 0, .22, .25); tone("sine", 140, 40, 0, .25, .5);
        if (!REDUCED) root.animate([{ transform:"translate(0,0)" }, { transform:"translate(" + (i % 2 ? 8 : -8) + "px,6px)" }, { transform:"translate(0,0)" }], { duration:160 });
      });
    });
    at(6900, function(){ stage.classList.add("yell"); sayTimmy(); tone("sawtooth", 220, 880, 0, .9, .2); });

    /* 7.8s — absolute chaos */
    at(7800, function(){
      stage.classList.remove("yell"); stage.classList.add("dance"); word.classList.add("wave");
      word.querySelectorAll("span").forEach(function(s, i){ s.style.animationDelay = (i * .1) + "s"; });
      hue.classList.add("on"); partyLoop(4);
      if (!REDUCED) rain(root, 60);
    });

    /* 11.4s — the curse (a useless one), and the page puts itself back together */
    at(11400, function(){
      hue.classList.remove("on");
      caption.innerHTML = "<b>TIMMY HAS CURSED THIS STUDY SESSION</b><small>" + CURSES[(n - 1) % CURSES.length] +
        " &middot; Timmy summoned " + n + (n === 1 ? " time" : " times") + " on this device. He will return.</small>";
      caption.classList.add("in");
      [1318.5, 1046.5, 783.99, 622.25, 523.25].forEach(function(f, i){ tone("triangle", f, 0, i * .11, .9, .22); });
      if (pieces.length){ cleanups.forEach(function(fn){ fn(); }); cleanups = [trackEyes(big)]; rebuild(pieces, false); pieces = []; }
    });

    /* 15s — gone, as if nothing happened */
    /* the tooth buddy gets his say once the overlay is gone */
    at(15000, function(){ finish(false); try{ document.dispatchEvent(new CustomEvent("sh:egg-local", { detail:{ t:"timmy", count:n } })); }catch(e){} });
  }

  function finish(early){
    if (!running) return;
    timers.forEach(clearTimeout); timers = [];
    cleanups.forEach(function(fn){ try{ fn(); }catch(e){} }); cleanups = [];
    if (pieces.length){ rebuild(pieces, true); pieces = []; }
    stopAudio();
    try{ if (early && window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}
    var r = root; root = null;
    if (r){ r.style.opacity = "0"; setTimeout(function(){ r.remove(); running = false; }, early ? 300 : 750); }
    else running = false;
  }
})();
