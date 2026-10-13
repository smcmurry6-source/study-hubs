/* study-hubs rank-up celebrations. widget/ranks.js loads this file the first time it's needed (shRanks.track, in a hub
   or on the dashboard), so a normal visit doesn't download it.

   shRankUp.tier(d)  -> a new rank (Silver -> Gold): a full-screen cutscene. Letterbox bars close in while the old
                        medallion shakes and light streams into it, it flickers between old and new, then a white flash,
                        shockwave rings and a burst of sparks reveal the new medallion in front of turning light rays.
                        "RANK UP" slams in with the new name, the old -> new rank, and what it unlocked (accent metal,
                        Timmy Tooth's house, the next goal). Embers drift up until "Let's go", Esc or a tap outside.
                        A tap during the build-up skips straight to the reveal.
   shRankUp.level(d) -> a new level inside a rank (Gold I -> Gold II): a smaller card drops in at the top, flips the
                        medallion like a coin, rolls the numeral, fills that level's segment and throws a few sparks.
                        It doesn't block the page and goes away by itself.
   d = { from, fromLevel, to, level, xp, next_at, position, of } (the profile fields are optional).
   Both bring their own CSS (the dashboard doesn't load widget/v3.css) and a short synthesized sound.
   Reduced motion keeps the cards and fades and drops the shake, flash, flip and particles. */
(function(){
  "use strict";
  if (window.shRankUp || !window.shRanks) return;
  var R = window.shRanks, T = R.TIERS, ROMAN = ["I", "II", "III"];

  /* sparks (c), the glow behind the medal, and the metallic name gradient (n) per rank, made for a dark backdrop */
  var PAL = {
    stone:   { c: ["#E8E2D6", "#BDB6AB", "#FFFFFF", "#9A9489"], glow: "#D9D2C5", n: ["#9A9489", "#F7F3EC", "#BDB6AB"] },
    antique: { c: ["#EBD39A", "#C69A4A", "#FFF1D0", "#D39A55"], glow: "#E2AE62", n: ["#B4813F", "#FBE6B4", "#C99A50"] },
    bronze:  { c: ["#FFB77A", "#E09A5E", "#FFE0BE", "#F08C4A"], glow: "#FF9A52", n: ["#C47A3E", "#FFDDBD", "#E09A5E"] },
    silver:  { c: ["#FFFFFF", "#DDEBFA", "#B6BEC7", "#E4E9EE"], glow: "#BFD8FF", n: ["#9AA6B3", "#FFFFFF", "#C3CDD8"] },
    gold:    { c: ["#FFE08A", "#F6CD55", "#FFF6CF", "#FFB800"], glow: "#FFC233", n: ["#D9A21A", "#FFF4C4", "#F6CD55"] },
    diamond: { c: ["#9EE6FF", "#FFFFFF", "#5AB6E6", "#CBEFFF"], glow: "#4FD0FF", n: ["#4DB5E8", "#EAFBFF", "#8FDCFA"] },
    dark:    { c: ["#B57BFF", "#FF7AE0", "#44C8FF", "#FFFFFF"], glow: "#8A4DFF", n: ["#A77BFF", "#FFB0EE", "#6FD8FF"] }
  };
  /* what each rank adds to Timmy Tooth's house (UPGRADES in widget/pet.js) */
  var HOUSE = ["", "a picket fence", "a bronze mailbox", "a garden lamppost", "gold trim and a gold door", "diamond windows", "a night sky of its own"];

  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString("en-US"); }
  function rgba(hex, a){ var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
  function reduced(){ try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function vars(el, key){
    var P = PAL[key];
    el.style.setProperty("--ru-c", P.glow);
    el.style.setProperty("--ru-g80", rgba(P.glow, .8)); el.style.setProperty("--ru-g55", rgba(P.glow, .55));
    el.style.setProperty("--ru-g35", rgba(P.glow, .35)); el.style.setProperty("--ru-g18", rgba(P.glow, .18));
    el.style.setProperty("--ru-n1", P.n[0]); el.style.setProperty("--ru-n2", P.n[1]); el.style.setProperty("--ru-n3", P.n[2]);
  }
  /* what comes after this rank and level */
  function nextLine(d){
    var step = d.to * 3 + (d.level || 1) - 1;
    if (step >= 20) return "The highest rank there is.";
    var nm = R.rankName(Math.floor((step + 1) / 3), (step + 1) % 3 + 1);
    if (d.next_at != null && d.xp != null && d.next_at > d.xp) return "<b>" + fmt(d.next_at - d.xp) + " XP</b> to " + esc(nm);
    return "Next up: " + esc(nm);
  }

  /* ---------- CSS (injected once) ---------- */
  var CSS =
    '.sh-ru{position:fixed; inset:0; z-index:10040; overflow:hidden; color:#fff; opacity:0; transition:opacity .35s; -webkit-tap-highlight-color:transparent;' +
    '  font-family:var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); --ru-m:180px;}' +
    '.sh-ru *{box-sizing:border-box;}' +
    '.sh-ru.is-on{opacity:1;} .sh-ru.is-out{opacity:0; transition:opacity .45s;}' +
    '.sh-ru-bg{position:absolute; inset:0; background:radial-gradient(65% 55% at 50% 42%, var(--ru-g18), transparent 72%), radial-gradient(120% 90% at 50% 40%, #120D1E, #040209);}' +
    '.sh-ru-cv{position:absolute; inset:0; width:100%; height:100%; pointer-events:none;}' +
    '.sh-ru-fx{position:absolute; inset:0; overflow:hidden; pointer-events:none;}' +
    '.sh-ru-fxc{position:absolute; left:var(--cx, 50%); top:var(--cy, 45%); width:0; height:0;}' +
    '.sh-ru-rays{position:absolute; left:-750px; top:-750px; width:1500px; height:1500px; opacity:0; transition:opacity 1.2s .1s;' +
    '  -webkit-mask:radial-gradient(closest-side, #000 6%, rgba(0,0,0,.5) 32%, transparent 70%); mask:radial-gradient(closest-side, #000 6%, rgba(0,0,0,.5) 32%, transparent 70%);}' +
    '.sh-ru-rays i{position:absolute; inset:0; border-radius:50%; background:repeating-conic-gradient(from 0deg, var(--ru-g55) 0deg 5deg, transparent 5deg 15deg); animation:sh-ru-spin 40s linear infinite;}' +
    '.sh-ru-rays i + i{background:repeating-conic-gradient(from 7deg, rgba(255,255,255,.22) 0deg 2.5deg, transparent 2.5deg 22.5deg); animation-duration:64s; animation-direction:reverse;}' +
    '.sh-ru.is-boom .sh-ru-rays{opacity:1;}' +
    '.sh-ru-halo{position:absolute; left:-230px; top:-230px; width:460px; height:460px; border-radius:50%; opacity:.15; transform:scale(.5);' +
    '  background:radial-gradient(closest-side, var(--ru-g80), var(--ru-g35) 45%, transparent 72%);}' +
    '.sh-ru.is-boom .sh-ru-halo{animation:sh-ru-pulse 2.6s ease-in-out infinite;}' +
    '.sh-ru-ring{position:absolute; left:-100px; top:-100px; width:200px; height:200px; border-radius:50%; border:8px solid var(--ru-c); opacity:0;' +
    '  box-shadow:0 0 34px var(--ru-g80), inset 0 0 26px var(--ru-g55);}' +
    '.sh-ru-bars i{position:absolute; left:0; right:0; height:46px; background:#000; transition:transform .7s cubic-bezier(.2,.8,.2,1); pointer-events:none;}' +
    '.sh-ru-bars i:first-child{top:0; transform:translateY(-100%);} .sh-ru-bars i:last-child{bottom:0; transform:translateY(100%);}' +
    '.sh-ru.is-charging .sh-ru-bars i{transform:none;}' +
    '.sh-ru-flash{position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(circle at 50% 45%, #fff 0%, #fff 35%, var(--ru-n2) 100%);}' +
    '.sh-ru-stage{position:absolute; inset:0; display:flex; overflow-y:auto; padding:58px 16px 30px;}' +
    '.sh-ru-in{margin:auto; display:flex; flex-direction:column; align-items:center; text-align:center; width:100%; max-width:460px;}' +
    '.sh-ru-medal{position:relative; flex:none; width:var(--ru-m); height:var(--ru-m);}' +
    '.sh-ru.is-revealed .sh-ru-medal{animation:sh-ru-float 4.2s ease-in-out 1.2s infinite;}' +
    '.sh-ru-face{position:absolute; inset:0; will-change:transform;}' +
    '.sh-ru-face svg{display:block; width:100%; height:100%; filter:drop-shadow(0 14px 30px rgba(0,0,0,.55));}' +
    '.sh-ru-new{opacity:0;}' +
    '.sh-ru-glare{position:absolute; inset:-14%; border-radius:50%; opacity:0; pointer-events:none;' +
    '  background:radial-gradient(closest-side, #fff 0%, rgba(255,255,255,.9) 38%, var(--ru-g35) 62%, transparent 75%);}' +
    '.sh-ru-hint{margin-top:30px; font-size:15px; font-weight:600; letter-spacing:.02em; color:rgba(255,255,255,.82); opacity:0; animation:sh-ru-up .6s .35s both;}' +
    '.sh-ru-hint span{display:inline-block; animation:sh-ru-dots 1.2s steps(4) infinite; overflow:hidden; vertical-align:bottom; width:1.1em; text-align:left;}' +
    '.sh-ru.is-revealed .sh-ru-hint{display:none;}' +
    '.sh-ru-text{display:none; margin-top:20px; width:100%;}' +
    '.sh-ru.is-revealed .sh-ru-text{display:block;}' +
    '.sh-ru-title{margin:0; font:900 58px/1 "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing:.05em; white-space:nowrap;' +
    '  text-shadow:0 0 18px var(--ru-g80), 0 0 46px var(--ru-g55), 0 5px 0 rgba(0,0,0,.35);}' +
    '.sh-ru-title span{display:inline-block; opacity:0; animation:sh-ru-slam .6s cubic-bezier(.2,1.5,.4,1) both; animation-delay:calc(var(--i) * 50ms);}' +
    '.sh-ru-mt{background:linear-gradient(100deg, var(--ru-n1) 0%, var(--ru-n2) 45%, var(--ru-n1) 55%, var(--ru-n3) 100%); background-size:220% 100%;' +
    '  -webkit-background-clip:text; background-clip:text; color:transparent; animation:sh-ru-sheen 3.6s linear infinite;}' +
    '.sh-ru-name{display:block; margin:10px 0 0; font:400 40px/1.1 var(--font-display, Georgia, "Times New Roman", serif);}' +
    '.sh-ru-namewrap{opacity:0; animation:sh-ru-up .6s .45s both; filter:drop-shadow(0 2px 12px rgba(0,0,0,.6)) drop-shadow(0 0 18px var(--ru-g35));}' +
    '.sh-ru-from{display:inline-flex; align-items:center; gap:9px; margin-top:10px; padding:5px 13px 5px 6px; border-radius:99px; font-size:13.5px; color:rgba(255,255,255,.88);' +
    '  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); opacity:0; animation:sh-ru-up .55s .6s both;}' +
    '.sh-ru-from svg{width:26px; height:26px; display:block;} .sh-ru-from span{display:inline-flex; align-items:center; gap:6px;}' +
    '.sh-ru-from .sh-ru-arw{opacity:.65;}' +
    '.sh-ru-stat{margin-top:8px; font-size:13px; color:rgba(255,255,255,.7); opacity:0; animation:sh-ru-up .55s .7s both;}' +
    '.sh-ru-stat b{color:#fff; font-variant-numeric:tabular-nums;}' +
    '.sh-ru-unl{list-style:none; margin:16px auto 0; padding:0; display:grid; gap:8px; text-align:left; max-width:380px;}' +
    '.sh-ru-unl li{display:flex; align-items:center; gap:12px; padding:9px 12px; border-radius:14px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);' +
    '  font-size:13.5px; line-height:1.35; color:rgba(255,255,255,.86); opacity:0; animation:sh-ru-left .5s both; animation-delay:calc(.85s + var(--i) * .13s);}' +
    '.sh-ru-unl b{display:block; font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:var(--ru-n2);}' +
    '.sh-ru-ic{flex:none; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(255,255,255,.08) center/cover;' +
    '  box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);} .sh-ru-ic svg{width:30px; height:30px; display:block;}' +
    '.sh-ru-go{margin-top:20px; font:inherit; font-size:15px; font-weight:800; letter-spacing:.02em; padding:12px 36px; border-radius:99px; border:0; cursor:pointer; color:#17110A;' +
    '  background:linear-gradient(180deg, var(--ru-n2), var(--ru-c)); box-shadow:inset 0 0 0 1px rgba(255,255,255,.35), 0 10px 30px var(--ru-g55); opacity:0; animation:sh-ru-up .5s 1.35s both;}' +
    '.sh-ru-go:focus-visible{outline:3px solid #fff; outline-offset:3px;}' +
    '@media (max-width:520px){ .sh-ru{--ru-m:150px;} .sh-ru-title{font-size:44px;} .sh-ru-name{font-size:33px;} }' +
    '@media (max-height:700px){ .sh-ru{--ru-m:130px;} .sh-ru-title{font-size:40px;} .sh-ru-name{font-size:30px; margin-top:6px;} .sh-ru-unl{margin-top:12px; gap:6px;}' +
    '  .sh-ru-unl li{padding:7px 10px;} .sh-ru-go{margin-top:14px;} .sh-ru-stage{padding-top:30px; padding-bottom:20px;} }' +
    '@keyframes sh-ru-spin{to{transform:rotate(360deg);}}' +
    '@keyframes sh-ru-pulse{0%,100%{opacity:.75; transform:scale(1.25);} 50%{opacity:1; transform:scale(1.42);}}' +
    '@keyframes sh-ru-float{0%,100%{transform:translateY(0);} 50%{transform:translateY(-7px);}}' +
    '@keyframes sh-ru-up{from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;}}' +
    '@keyframes sh-ru-left{from{opacity:0; transform:translateX(-18px);} to{opacity:1; transform:none;}}' +
    '@keyframes sh-ru-slam{0%{opacity:0; transform:translateY(-34px) scale(2.8); filter:blur(8px);} 55%{opacity:1; filter:blur(0);} 100%{opacity:1; transform:none; filter:none;}}' +
    '@keyframes sh-ru-sheen{to{background-position:-220% 0;}}' +
    '@keyframes sh-ru-dots{from{width:0;} to{width:1.1em;}}' +
    /* the level-up card */
    '.sh-ru-lv{position:fixed; z-index:10030; left:0; right:0; top:12%; margin:0 auto; width:min(380px, calc(100% - 32px)); display:flex; align-items:center; gap:14px;' +
    '  padding:14px 18px 14px 14px; border-radius:22px; overflow:hidden; color:#fff; cursor:pointer; text-align:left; -webkit-tap-highlight-color:transparent;' +
    '  font-family:var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);' +
    '  background:radial-gradient(120% 150% at 0% 50%, var(--ru-g35), transparent 62%), linear-gradient(160deg, #221E2A, #0E0C13);' +
    '  border:1px solid var(--ru-g55); box-shadow:0 18px 50px -12px rgba(0,0,0,.6), 0 0 42px -8px var(--ru-g55);}' +
    '.sh-ru-lv *{box-sizing:border-box;}' +
    '.sh-ru-lv-medal{position:relative; flex:none; width:78px; height:78px; perspective:420px;}' +
    '.sh-ru-lv-coin{width:100%; height:100%; transform-style:preserve-3d;} .sh-ru-lv-coin svg{display:block; width:100%; height:100%; filter:drop-shadow(0 6px 12px rgba(0,0,0,.5));}' +
    '.sh-ru-lv-ring{position:absolute; inset:0; border-radius:50%; border:3px solid var(--ru-c); opacity:0; pointer-events:none; box-shadow:0 0 16px var(--ru-g80);}' +
    '.sh-ru-lv-body{flex:1; min-width:0;}' +
    '.sh-ru-lv-eye{font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--ru-n2);}' +
    '.sh-ru-lv-name{display:flex; align-items:baseline; gap:.28em; margin-top:2px; font:400 27px/1.15 var(--font-display, Georgia, "Times New Roman", serif);}' +
    '.sh-ru-roll{position:relative; display:inline-block; overflow:hidden; line-height:1.15;}' +
    '.sh-ru-roll i{visibility:hidden; font-style:normal;}' +
    '.sh-ru-roll b{position:absolute; left:0; top:0; font-weight:inherit; transition:transform .5s cubic-bezier(.2,1.4,.4,1);}' +
    '.sh-ru-roll .n{transform:translateY(105%);}' +
    '.sh-ru-lv.is-landed .sh-ru-roll .o{transform:translateY(-105%);} .sh-ru-lv.is-landed .sh-ru-roll .n{transform:none;}' +
    '.sh-ru-pips{display:flex; gap:5px; margin:9px 0 7px; max-width:200px;}' +
    '.sh-ru-pips i{position:relative; flex:1; height:6px; border-radius:99px; overflow:hidden; background:rgba(255,255,255,.16); transition:box-shadow .4s;}' +
    '.sh-ru-pips b{position:absolute; inset:0; border-radius:inherit; transform-origin:left; transform:scaleX(0); background:linear-gradient(90deg, var(--ru-n1), var(--ru-n2));}' +
    '.sh-ru-pips .on b{transform:none;} .sh-ru-pips .new b{transition:transform .65s .12s cubic-bezier(.2,.8,.2,1);}' +
    '.sh-ru-lv.is-landed .sh-ru-pips .new b{transform:none;} .sh-ru-lv.is-landed .sh-ru-pips .new{box-shadow:0 0 14px var(--ru-g80);}' +
    '.sh-ru-lv-next{font-size:12.5px; color:rgba(255,255,255,.72);} .sh-ru-lv-next b{color:#fff;}' +
    '.sh-ru-lv-shine{position:absolute; top:-20%; bottom:-20%; left:-30%; width:22%; pointer-events:none; opacity:0;' +
    '  background:linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent); transform:skewX(-20deg);}' +
    '.sh-ru-fly{position:fixed; inset:0; z-index:10031; width:100%; height:100%; pointer-events:none;}' +
    '@media (prefers-reduced-motion: reduce){ .sh-ru *, .sh-ru-lv *{animation-duration:.01ms !important; animation-iteration-count:1 !important; animation-delay:0s !important; transition-duration:.01ms !important; transition-delay:0s !important;}' +
    '  .sh-ru-rays i{animation:none !important;} }';
  function css(){
    if (document.getElementById("sh-ru-css")) return;
    var s = document.createElement("style"); s.id = "sh-ru-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- sparks: a small canvas particle system ---------- */
  function Sparks(cv, glow){
    var g = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, ps = [], ems = [], raf = 0, last = 0, dead = false;
    function fit(){ W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    fit(); window.addEventListener("resize", fit);
    function go(){ if (!raf && !dead) raf = requestAnimationFrame(tick); }
    function tick(now){
      raf = 0; if (dead) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      ems = ems.filter(function(e){ return e(dt) !== false; });
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i]; p.age += dt;
        var u = p.age / p.life;
        if (u >= 1) { ps.splice(i, 1); continue; }
        if (p.type === "in") {
          var r = p.r0 * (1 - Math.pow(u, 1.7)), th = p.th + p.spin * u;
          p.px = p.x; p.py = p.y; p.x = p.c.x + Math.cos(th) * r; p.y = p.c.y + Math.sin(th) * r;
          if (p.px == null) { p.px = p.x; p.py = p.y; }
        } else {
          var k = Math.pow(p.drag, dt * 60);
          p.vx *= k; p.vy = p.vy * k + p.g * dt;
          if (p.type === "conf") p.vx += Math.sin(p.age * 3 + p.ph) * 40 * dt;
          if (p.sway) p.vx += Math.sin(p.age * 1.7 + p.ph) * p.sway * dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        }
        draw(p, u);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      if (ps.length || ems.length) go(); else last = 0;
    }
    function draw(p, u){
      var a = p.type === "in" ? Math.min(1, u * 4) * (u > .9 ? (1 - u) * 10 : 1) : p.type === "ember" ? Math.sin(Math.PI * u) : u < .7 ? 1 : (1 - u) / .3;
      g.globalAlpha = a * (p.alpha || 1);
      g.globalCompositeOperation = glow && p.type !== "conf" ? "lighter" : "source-over";
      if (p.type === "streak" || p.type === "in") {
        var tx = p.type === "in" ? p.x + (p.px - p.x) * 4 : p.x - p.vx * .035, ty = p.type === "in" ? p.y + (p.py - p.y) * 4 : p.y - p.vy * .035;
        g.strokeStyle = p.color; g.lineWidth = p.size; g.lineCap = "round";
        g.beginPath(); g.moveTo(tx, ty); g.lineTo(p.x, p.y); g.stroke();
      } else if (p.type === "dot" || p.type === "ember") {
        g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, Math.max(.3, p.size * (1 - u * .4)), 0, 6.2832); g.fill();
        if (glow) { g.globalAlpha = a * .22; g.beginPath(); g.arc(p.x, p.y, p.size * 3.2, 0, 6.2832); g.fill(); }
      } else if (p.type === "star") {
        var s = p.size * (u < .15 ? u / .15 : 1 - (u - .15) * .7);
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.color; g.beginPath();
        g.moveTo(0, -s); g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s); g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s);
        g.fill(); g.restore();
      } else if (p.type === "conf") {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(Math.cos(p.age * p.flip), 1);
        g.fillStyle = p.color; g.fillRect(-p.size / 2, -p.size * .22, p.size, p.size * .44); g.restore();
      }
    }
    function add(p){
      p.age = 0; p.rot = p.rot || Math.random() * 6.28; p.vr = p.vr || 0; p.drag = p.drag || 1; p.g = p.g || 0; p.ph = Math.random() * 6.28;
      ps.push(p); go();
    }
    return {
      /* center of an element in canvas coordinates (the text-size setting zooms the page, so scale from the rect) */
      at: function(el){
        var cr = cv.getBoundingClientRect(), r = el.getBoundingClientRect(), s = cr.width ? W / cr.width : 1;
        return { x: (r.left + r.width / 2 - cr.left) * s, y: (r.top + r.height / 2 - cr.top) * s };
      },
      burst: function(x, y, n, o){
        for (var i = 0; i < n; i++) {
          var an = Math.random() * 6.2832, sp = rnd(o.min, o.max);
          add({ type: pick(o.types), x: x + Math.cos(an) * (o.r || 0), y: y + Math.sin(an) * (o.r || 0), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp,
            life: rnd(o.life[0], o.life[1]), size: rnd(o.size[0], o.size[1]), color: pick(o.colors), drag: o.drag, g: o.g, vr: rnd(-6, 6), flip: rnd(4, 10) });
        }
      },
      /* light streaming into a point, faster and denser as u goes 0 -> 1 */
      inward: function(c, colors, dur){
        var t = 0, acc = 0, R0 = Math.max(W, H) * .62;
        ems.push(function(dt){
          t += dt; var u = Math.min(1, t / dur);
          acc += (50 + 420 * u * u) * dt;
          while (acc >= 1) {
            acc--;
            add({ type: "in", c: c, th: Math.random() * 6.2832, r0: R0 * rnd(.55, 1), spin: rnd(.5, 1.3) * (Math.random() < .5 ? -1 : 1),
              life: rnd(.55, 1.1) * (1.2 - u * .5), size: rnd(1, 2.6), color: pick(colors), alpha: rnd(.5, 1) });
          }
          return t < dur;
        });
      },
      rain: function(colors, dur){
        var t = 0, acc = 0;
        ems.push(function(dt){
          t += dt; acc += 70 * dt;
          while (acc >= 1) { acc--; add({ type: "conf", x: rnd(0, W), y: -12, vx: rnd(-50, 50), vy: rnd(60, 220), g: 170, drag: .985, life: rnd(3.5, 5), size: rnd(7, 13), color: pick(colors), vr: rnd(-4, 4), flip: rnd(3, 9) }); }
          return t < dur;
        });
      },
      embers: function(colors){
        var acc = 0, on = true;
        ems.push(function(dt){
          acc += 16 * dt;
          while (acc >= 1) { acc--; add({ type: "ember", x: rnd(0, W), y: H + 8, vx: rnd(-10, 10), vy: rnd(-40, -110), g: -6, drag: .998, sway: 18, life: rnd(4, 7), size: rnd(1, 2.8), color: pick(colors) }); }
          return on;
        });
        return function(){ on = false; };
      },
      stop: function(){ ems = []; },
      drop: function(type){ ps = ps.filter(function(p){ return p.type !== type; }); },
      kill: function(){ dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; ps = []; ems = []; window.removeEventListener("resize", fit); }
    };
  }

  /* ---------- sound: all synthesized, nothing to download ---------- */
  var ac = null;
  function audio(){
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      if (!ac || ac.state === "closed") ac = new AC();
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function bus(a, vol){ var g = a.createGain(); g.gain.value = vol; g.connect(a.destination); return g; }
  function noise(a, secs){
    var len = Math.max(1, Math.ceil(a.sampleRate * secs)), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var n = a.createBufferSource(); n.buffer = b; return n;
  }
  function env(a, g, t, vol, attack, dur){ g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
  function bell(a, dest, f, t, dur, vol){
    [[f, "triangle", vol], [f * 2.01, "sine", vol * .35], [f * 3.98, "sine", vol * .12]].forEach(function(x){
      var o = a.createOscillator(), g = a.createGain(); o.type = x[1]; o.frequency.value = x[0];
      env(a, g, t, x[2], .008, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
    });
  }
  function brass(a, dest, f, t, dur, vol){
    var lp = a.createBiquadFilter(), g = a.createGain();
    lp.type = "lowpass"; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(3400, t + .07); lp.frequency.exponentialRampToValueAtTime(1300, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .035);
    g.gain.exponentialRampToValueAtTime(vol * .55, t + dur * .45); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    lp.connect(g); g.connect(dest);
    [-7, 7].forEach(function(c){ var o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); o.stop(t + dur + .05); });
  }
  /* the build-up: filtered noise and two saws climbing two octaves; returns a stop() for when the build-up is skipped */
  function sfxRiser(secs){
    var a = audio(); if (!a) return function(){};
    try {
      var m = bus(a, .2), t0 = a.currentTime + .03, tf = t0 + secs;
      var n = noise(a, secs + .1), bp = a.createBiquadFilter(), ng = a.createGain();
      bp.type = "bandpass"; bp.Q.value = 2.5; bp.frequency.setValueAtTime(260, t0); bp.frequency.exponentialRampToValueAtTime(7500, tf);
      ng.gain.setValueAtTime(.0001, t0); ng.gain.exponentialRampToValueAtTime(.55, tf - .04); ng.gain.linearRampToValueAtTime(0, tf);
      n.connect(bp); bp.connect(ng); ng.connect(m); n.start(t0); n.stop(tf + .05);
      [110, 164.8].forEach(function(hz){
        var o = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(hz, t0); o.frequency.exponentialRampToValueAtTime(hz * 4, tf);
        lp.type = "lowpass"; lp.frequency.setValueAtTime(280, t0); lp.frequency.exponentialRampToValueAtTime(4200, tf);
        lfo.frequency.setValueAtTime(5, t0); lfo.frequency.exponentialRampToValueAtTime(22, tf); lg.gain.value = .045;
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.11, tf - .04); g.gain.linearRampToValueAtTime(0, tf);
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(lp); lp.connect(g); g.connect(m); o.start(t0); o.stop(tf + .05); lfo.start(t0); lfo.stop(tf + .05);
      });
      return function(){ try { m.gain.setTargetAtTime(0, a.currentTime, .03); } catch (e) {} };
    } catch (e) { return function(){}; }
  }
  /* the hit and the fanfare: a sub drop, a noise crash, a quick G-C-E-G and a held C major chord with shimmer on top */
  function sfxFanfare(big){
    var a = audio(); if (!a) return;
    try {
      var m = bus(a, .2), t = a.currentTime + .02;
      if (big) {
        var o = a.createOscillator(), og = a.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.1);
        env(a, og, t, .9, .01, 1.2); o.connect(og); og.connect(m); o.start(t); o.stop(t + 1.25);
        var n = noise(a, 1.4), lp = a.createBiquadFilter(), ng = a.createGain();
        lp.type = "lowpass"; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(400, t + 1.2);
        env(a, ng, t, .5, .005, 1.3); n.connect(lp); lp.connect(ng); ng.connect(m); n.start(t); n.stop(t + 1.4);
      }
      [392, 523.25, 659.25, 783.99].forEach(function(f, i){ brass(a, m, f, t + .05 + i * .09, .24, .085); });
      [261.63, 523.25, 659.25, 783.99, 1046.5].forEach(function(f){ brass(a, m, f, t + .43, 2.6, .06); });
      var sh = [1046.5, 1318.5, 1568, 2093, 2637, 3136];
      for (var i = 0; i < 14; i++) bell(a, m, pick(sh), t + .5 + i * .14 + Math.random() * .05, .5, .03);
    } catch (e) {}
  }
  function sfxLevel(){
    var a = audio(); if (!a) return;
    try {
      var m = bus(a, .18), t = a.currentTime + .02;
      bell(a, m, 1046.5, t, .8, .32); bell(a, m, 1568, t + .1, 1, .32); bell(a, m, 2093, t + .2, 1.3, .24);
      [3136, 2637, 3951].forEach(function(f, i){ bell(a, m, f, t + .32 + i * .07, .4, .07); });
    } catch (e) {}
  }

  /* ---------- the full rank-up cutscene ---------- */
  var IC_HOUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>';
  var IC_CROWN = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>';
  function unlocks(d){
    var to = T[d.to], out = [];
    if (R.ACCENTS && R.ACCENTS[to.key] && R.accentTex) {
      out.push('<span class="sh-ru-ic" style="background-image:url(\'' + R.accentTex(to.key) + '\')"></span><span><b>New accent</b>' + esc(to.name) +
        ' metal for your buttons, switches and progress bars. Pick it in Settings.</span>');
    }
    if (HOUSE[d.to] && ls("sh_pet_born") && ls("sh_pref_pet") !== "off") {
      out.push('<span class="sh-ru-ic" style="color:var(--ru-n2)">' + IC_HOUSE + '</span><span><b>Timmy\'s house</b>Timmy Tooth\'s house gets ' + HOUSE[d.to] + '.</span>');
    }
    if (d.to < 6) {
      var nx = T[d.to + 1];
      out.push('<span class="sh-ru-ic">' + R.art(d.to + 1, 30) + '</span><span><b>Next rank</b>' + esc(nx.name) + ' at ' + fmt(nx.at) + ' XP' +
        (d.xp != null && nx.at > d.xp ? ' (' + fmt(nx.at - d.xp) + ' to go)' : '') + '.</span>');
    } else {
      out.push('<span class="sh-ru-ic" style="color:var(--ru-n2)">' + IC_CROWN + '</span><span><b>The top</b>Dark Matter is the highest rank there is.</span>');
    }
    return out.map(function(h, i){ return '<li style="--i:' + i + '">' + h + '</li>'; }).join("");
  }

  var open = null;
  function tier(d){
    css();
    if (open) open(true);
    var to = T[d.to], key = to.key, P = PAL[key], lvl = d.level || 1, fromLvl = d.fromLevel || 3, still = reduced();
    var name = R.rankName(d.to, lvl), title = d.to >= 6 ? "MAX RANK" : "RANK UP";
    var el = document.createElement("div");
    el.className = "sh-ru"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "New rank: " + name); el.tabIndex = -1;
    vars(el, key);
    el.innerHTML = '<div class="sh-ru-bg"></div><canvas class="sh-ru-cv" aria-hidden="true"></canvas>' +
      '<div class="sh-ru-fx" aria-hidden="true"><div class="sh-ru-fxc"><div class="sh-ru-rays"><i></i><i></i></div><div class="sh-ru-halo"></div></div></div>' +
      '<div class="sh-ru-stage"><div class="sh-ru-in">' +
        '<div class="sh-ru-medal"><div class="sh-ru-face sh-ru-old">' + R.art(d.from, 200, { level: fromLvl }) + '</div>' +
        '<div class="sh-ru-face sh-ru-new">' + R.art(d.to, 200, { animate: true, level: lvl }) + '</div><div class="sh-ru-glare"></div></div>' +
        '<div class="sh-ru-hint">Something\'s happening to your handpiece<span>...</span></div>' +
        '<div class="sh-ru-text">' +
          '<h2 class="sh-ru-title" aria-label="' + title + '">' + title.split("").map(function(c, i){ return '<span aria-hidden="true" style="--i:' + i + '">' + (c === " " ? "&nbsp;" : c) + '</span>'; }).join("") + '</h2>' +
          '<div class="sh-ru-namewrap"><span class="sh-ru-name sh-ru-mt">' + esc(name) + '</span></div>' +
          '<div class="sh-ru-from"><span>' + R.art(d.from, 26) + esc(R.rankName(d.from, fromLvl)) + '</span><span class="sh-ru-arw" aria-label="to">&rarr;</span><span>' + R.art(d.to, 26) + esc(name) + '</span></div>' +
          (d.xp != null ? '<div class="sh-ru-stat"><b>' + fmt(d.xp) + '</b> XP' + (d.position ? ' · #' + fmt(d.position) + ' of ' + fmt(d.of) + ' in the class' : '') + '</div>' : '') +
          '<ul class="sh-ru-unl">' + unlocks(d) + '</ul>' +
          '<button type="button" class="sh-ru-go">Let\'s go</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="sh-ru-bars" aria-hidden="true"><i></i><i></i></div><div class="sh-ru-flash" aria-hidden="true"></div>';
    document.body.appendChild(el);
    function q(s){ return el.querySelector(s); }
    var sp = still ? null : Sparks(q(".sh-ru-cv"), true), medal = q(".sh-ru-medal"), fxc = q(".sh-ru-fxc"), inn = q(".sh-ru-in");
    var faceOld = q(".sh-ru-old"), faceNew = q(".sh-ru-new"), glare = q(".sh-ru-glare"), halo = q(".sh-ru-halo");
    var prevFocus = document.activeElement, timers = [], raf = 0, closed = false, phase = "charge", stopRiser = function(){}, stopEmbers = function(){};
    var colors = P.c.concat([P.glow]);
    function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
    /* keep the rays, halo and rings centered on the medal */
    function place(){
      var er = el.getBoundingClientRect(), mr = medal.getBoundingClientRect(), s = er.width ? el.clientWidth / er.width : 1;
      el.style.setProperty("--cx", ((mr.left + mr.width / 2 - er.left) * s) + "px");
      el.style.setProperty("--cy", ((mr.top + mr.height / 2 - er.top) * s) + "px");
    }
    place(); window.addEventListener("resize", place);
    try { el.focus({ preventScroll: true }); } catch (e) {}
    requestAnimationFrame(function(){ el.classList.add("is-on"); });

    function close(now){
      if (closed) return; closed = true;
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); stopRiser(); stopEmbers();
      document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", place);
      if (open === close) open = null;
      if (sp) sp.stop();
      el.classList.add("is-out");
      setTimeout(function(){ if (sp) sp.kill(); el.remove(); }, now ? 0 : 480);
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) { try { prevFocus.focus({ preventScroll: true }); } catch (e) {} }
    }
    open = close;
    function onKey(e){
      if (e.key === "Escape") { e.preventDefault(); if (phase === "charge") boom(); else close(); }
      else if (e.key === "Tab" && phase === "done") { e.preventDefault(); q(".sh-ru-go").focus(); }
    }
    document.addEventListener("keydown", onKey, true);
    el.addEventListener("click", function(e){
      if (phase === "charge") { boom(); return; }
      if (phase === "done" && (e.target.closest(".sh-ru-go") || !e.target.closest(".sh-ru-text, .sh-ru-medal"))) close();
    });

    function reveal(){
      if (closed) return;
      var r0 = medal.getBoundingClientRect();
      el.classList.add("is-revealed");
      var r1 = medal.getBoundingClientRect(), er = el.getBoundingClientRect(), dy = (r0.top - r1.top) * (er.width ? el.clientWidth / er.width : 1);
      place();
      if (dy && !still && medal.animate) {
        var k = [{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], o = { duration: 750, easing: "cubic-bezier(.2,.9,.2,1)" };
        medal.animate(k, o); fxc.animate(k, o);
      }
      later(function(){ phase = "done"; try { q(".sh-ru-go").focus({ preventScroll: true }); } catch (e) {} }, still ? 0 : 1300);
    }
    function boom(){
      if (closed || phase !== "charge") return;
      phase = "boom"; cancelAnimationFrame(raf); stopRiser();
      el.classList.remove("is-charging"); el.classList.add("is-boom");
      faceOld.remove(); faceNew.style.opacity = 1; faceNew.style.transform = "";
      halo.style.opacity = ""; halo.style.transform = "";
      sfxFanfare(!still);
      if (still) { glare.style.opacity = 0; halo.style.opacity = ".8"; halo.style.transform = "scale(1.3)"; reveal(); return; }
      glare.style.opacity = 0;
      glare.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: "ease-out" });
      q(".sh-ru-flash").animate([{ opacity: 0 }, { opacity: 1, offset: .06 }, { opacity: 0 }], { duration: 1000, easing: "ease-out" });
      faceNew.animate([{ transform: "scale(.3)" }, { transform: "scale(1.24)", offset: .5 }, { transform: "scale(.95)", offset: .78 }, { transform: "none" }],
        { duration: 900, easing: "cubic-bezier(.2,.8,.3,1)" });
      var sh = [], i;
      for (i = 0; i < 9; i++) { var a = 16 * (1 - i / 9); sh.push({ transform: "translate(" + rnd(-a, a).toFixed(1) + "px," + rnd(-a, a).toFixed(1) + "px)" }); }
      sh.push({ transform: "none" });
      inn.animate(sh, { duration: 520, easing: "linear" });
      [0, 130, 280].forEach(function(delay, j){
        var r = document.createElement("i"); r.className = "sh-ru-ring"; fxc.appendChild(r);
        var an = r.animate([{ transform: "scale(.45)", opacity: .95, borderWidth: "12px" }, { transform: "scale(" + (4.2 + j * 1.6) + ")", opacity: 0, borderWidth: "1px" }],
          { duration: 1100 + j * 260, delay: delay, easing: "cubic-bezier(.1,.7,.3,1)", fill: "both" });
        an.onfinish = function(){ r.remove(); };
      });
      var c = sp.at(medal);
      sp.stop(); sp.drop("in");
      sp.burst(c.x, c.y, 150, { min: 380, max: 1300, types: ["streak", "streak", "streak", "dot"], colors: colors.concat(["#FFFFFF"]), drag: .9, g: 240, life: [.7, 1.7], size: [1.4, 3.4], r: 30 });
      sp.burst(c.x, c.y, 34, { min: 60, max: 420, types: ["star"], colors: colors.concat(["#FFFFFF"]), drag: .93, g: 30, life: [1.1, 2.3], size: [4, 10], r: 40 });
      later(function(){ sp.rain(colors.concat(["#FFFFFF"]), 2.4); }, 250);
      stopEmbers = sp.embers(colors);
      later(reveal, 600);
    }

    if (still) { later(boom, 60); return; }
    /* the build-up */
    el.classList.add("is-charging");
    var CH = 2.8, t0 = performance.now(), mc = null;
    stopRiser = sfxRiser(CH);
    function charge(now){
      if (closed || phase !== "charge") return;
      var u = Math.min(1, (now - t0) / (CH * 1000)), amp = 1 + 10 * u * u * u;
      var tr = "translate(" + rnd(-amp, amp).toFixed(1) + "px," + rnd(-amp, amp).toFixed(1) + "px) rotate(" + (rnd(-amp, amp) * .5).toFixed(1) + "deg) scale(" + (1 + u * .08).toFixed(3) + ")";
      faceOld.style.transform = tr; faceNew.style.transform = tr;
      /* the last stretch flickers between the old medallion and the new one, faster and faster */
      faceNew.style.opacity = u > .58 ? (Math.floor(Math.pow((u - .58) / .42, 1.5) * 18) % 2 ? 1 : 0) : 0;
      glare.style.opacity = (Math.pow(u, 2.4) * .9).toFixed(3);
      halo.style.opacity = (.15 + u * .85).toFixed(3); halo.style.transform = "scale(" + (.5 + u * 1.05).toFixed(3) + ")";
      if (!mc) { mc = sp.at(medal); sp.inward(mc, colors.concat(["#FFFFFF"]), CH); }
      if (u < 1) raf = requestAnimationFrame(charge); else boom();
    }
    later(function(){ raf = requestAnimationFrame(charge); }, 350);
  }

  /* ---------- the level-up card ---------- */
  var lvClose = null;
  function level(d){
    css();
    if (lvClose) lvClose(true);
    var t = T[d.to], key = t.key, P = PAL[key], lv = d.level || 2, old = d.fromLevel && d.fromLevel < lv ? d.fromLevel : Math.max(1, lv - 1), still = reduced();
    var o = ROMAN[old - 1], n = ROMAN[lv - 1];
    var el = document.createElement("div");
    el.className = "sh-ru-lv"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); el.setAttribute("aria-label", "Level up: " + R.rankName(d.to, lv));
    vars(el, key);
    el.innerHTML = '<div class="sh-ru-lv-medal" aria-hidden="true"><i class="sh-ru-lv-ring"></i><i class="sh-ru-lv-ring"></i><div class="sh-ru-lv-coin">' + R.art(d.to, 80, { level: old }) + '</div></div>' +
      '<div class="sh-ru-lv-body" aria-hidden="true"><div class="sh-ru-lv-eye">Level up</div>' +
      '<div class="sh-ru-lv-name"><span class="sh-ru-mt">' + esc(t.name) + '</span><span class="sh-ru-roll"><i>' + (o.length > n.length ? o : n) + '</i>' +
      '<b class="o sh-ru-mt">' + o + '</b><b class="n sh-ru-mt">' + n + '</b></span></div>' +
      '<div class="sh-ru-pips">' + [1, 2, 3].map(function(i){ return '<i class="' + (i <= old ? "on" : i <= lv ? "new" : "") + '"><b></b></i>'; }).join("") + '</div>' +
      '<div class="sh-ru-lv-next">' + nextLine(d) + '</div></div><i class="sh-ru-lv-shine" aria-hidden="true"></i>';
    document.body.appendChild(el);
    var cv = null, sp = null, timers = [], closed = false;
    if (!still) { cv = document.createElement("canvas"); cv.className = "sh-ru-fly"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv); sp = Sparks(cv, false); }
    function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
    function close(now){
      if (closed) return; closed = true; timers.forEach(clearTimeout);
      if (lvClose === close) lvClose = null;
      var done = function(){ el.remove(); };
      if (now || still || !el.animate) done();
      else el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-14px) scale(.97)" }], { duration: 320, easing: "ease-in", fill: "forwards" }).onfinish = done;
      if (sp) setTimeout(function(){ sp.kill(); cv.remove(); }, now ? 0 : 1600);
    }
    lvClose = close;
    el.addEventListener("click", function(){ close(); });
    var coin = el.querySelector(".sh-ru-lv-coin");
    function land(){
      if (closed) return;
      coin.innerHTML = R.art(d.to, 80, { animate: true, level: lv });
      el.classList.add("is-landed");
      sfxLevel();
      if (!still) {
        el.querySelectorAll(".sh-ru-lv-ring").forEach(function(r, i){
          r.animate([{ transform: "scale(.9)", opacity: .95 }, { transform: "scale(" + (1.9 + i * .5) + ")", opacity: 0 }], { duration: 750 + i * 200, delay: i * 110, easing: "cubic-bezier(.1,.7,.3,1)", fill: "both" });
        });
        el.querySelector(".sh-ru-lv-shine").animate([{ opacity: 1, transform: "skewX(-20deg) translateX(0)" }, { opacity: 1, transform: "skewX(-20deg) translateX(720%)" }],
          { duration: 900, delay: 120, easing: "cubic-bezier(.3,.6,.3,1)", fill: "both" });
        var c = sp.at(coin), cols = P.c.concat([P.n[0], P.glow]);
        sp.burst(c.x, c.y, 44, { min: 140, max: 560, types: ["streak", "star", "dot"], colors: cols, drag: .92, g: 380, life: [.6, 1.25], size: [1.6, 5], r: 26 });
      }
      later(close, 5200);
    }
    if (still || !el.animate) { land(); return; }
    el.animate([{ opacity: 0, transform: "translateY(-30px) scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 480, easing: "cubic-bezier(.2,1.3,.4,1)", fill: "both" });
    /* flip like a coin: spin up to edge-on, swap in the new numeral, land face up */
    var a1 = coin.animate([{ transform: "rotateY(0deg) scale(1)" }, { transform: "rotateY(630deg) scale(1.16)" }], { duration: 720, delay: 260, easing: "cubic-bezier(.5,0,.9,.55)", fill: "forwards" });
    a1.onfinish = function(){
      if (closed) return;
      var a2 = coin.animate([{ transform: "rotateY(270deg) scale(1.16)" }, { transform: "rotateY(360deg) scale(1.28)", offset: .45 }, { transform: "rotateY(360deg) scale(1)" }],
        { duration: 560, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" });
      a2.onfinish = function(){ a1.cancel(); a2.cancel(); };
      land();
    };
  }

  window.shRankUp = { tier: tier, level: level };
})();
