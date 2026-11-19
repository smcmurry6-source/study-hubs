/* study-hubs: the reward card (Sam, 2026-11-18: "i want it to look much cooler and communicate that you just got xp and
   crowns better"): what a bonus or a prize paid, on a gold card over the bottom of the page (dropping in at the top on a
   phone), in place of the dark toast: what you did, then the XP and the crowns, counting up from 0, with a burst of
   confetti; the stars and coins then fly to the rank (or the wallet) when it closes. A tap closes it. With reduced motion
   it only fades in and out. Its styles come with it.

   A hub's engine runs it in hub.bundle.js (widget/hub-rewards.js batches the rewards of one reply and calls it); the
   dashboard fetches this file the first time a prize pays (the daily visit, the leaderboard name, a trophy), so its page
   budget doesn't carry it (2026-11-19).

   shPrize.show(lines, opts, env)
     lines: [{ t: what you did, xp, c: crowns, src, sub }]; opts: { sub, kind }
     env:   { star(), coin(): the drawings; badge(kind, c): the badge's art (optional); calm(): no motion;
              after: the element the card's host goes after (else the body); within: an open dialog to draw it in (a
              dialog sits above the page); top: px of the page's own bar, which a phone's card drops in under; target(): where the stars fly (optional) } */
(function(){
  "use strict";
  if (window.shPrize) return;
  function h(html){ var t = document.createElement("template"); t.innerHTML = String(html).trim(); return t.content.firstElementChild; }
  function $$(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString("en-US"); }
  var PRIZE_CSS =
    ".hx-prizes{--hxp-y:46px;position:fixed;z-index:45;left:50%;bottom:24px;transform:translateX(-50%);display:grid;gap:10px;width:min(420px,calc(100% - 32px));pointer-events:none}" +
    ".hx-prize .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
    ".hx-prize{position:relative;pointer-events:auto;cursor:pointer;font-family:var(--font);-webkit-tap-highlight-color:transparent}" +
    ".hxp-card{position:relative;overflow:hidden;display:grid;grid-template-columns:58px minmax(0,1fr);column-gap:12px;align-items:center;padding:12px 14px 15px 12px;" +
      "border-radius:18px;color:#3b2e3a;border:2px solid #3b2e3a;background:radial-gradient(130% 150% at 0% 0%,#fffbea 0%,#ffeeb3 46%,#ffd45e 100%);" +
      "box-shadow:0 4px 0 #3b2e3a,0 16px 36px rgba(201,151,28,.4);animation:hxp-in 560ms cubic-bezier(.34,1.56,.64,1) both}" +
    ".hxp-card::after{content:'';position:absolute;top:-30%;bottom:-30%;left:-45%;width:38%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.8),transparent);" +
      "transform:skewX(-18deg);animation:hxp-shine 1000ms 300ms ease-out both;pointer-events:none}" +
    ".hxp-badge{position:relative;width:58px;height:58px;display:grid;place-items:center;align-self:start}" +
    ".hxp-rays{position:absolute;inset:-16px;border-radius:50%;background:repeating-conic-gradient(rgba(255,255,255,.95) 0 9deg,transparent 9deg 22.5deg);" +
      "-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);animation:hxp-spin 10s linear infinite}" +
    ".hxp-badge::before{content:'';position:absolute;inset:3px;border-radius:50%;border:2px solid #3b2e3a;background:radial-gradient(circle at 34% 28%,#fffdf2,#f7d774 55%,#d9a62c)}" +
    ".hxp-badge svg{position:relative;width:38px;height:38px;animation:hxp-pop 640ms 120ms cubic-bezier(.34,1.8,.64,1) both}" +
    ".hxp-head{min-width:0}" +
    ".hxp-kick{display:block;font-size:11px;line-height:1.3;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8a5d00}" +
    ".hxp-title{display:block;font-size:17px;line-height:1.2;font-weight:900;overflow-wrap:anywhere}" +
    ".hxp-sub{display:block;margin-top:1px;font-size:13px;line-height:1.3;font-weight:700;color:#5a4858}" +
    ".hxp-loot{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}" +
    ".hxp-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 11px 2px 4px;border-radius:999px;background:#fff;border:2px solid #3b2e3a;box-shadow:0 2px 0 #3b2e3a;" +
      "animation:hxp-pop 520ms 200ms cubic-bezier(.34,1.8,.64,1) both}" +
    ".hxp-pill+.hxp-pill{animation-delay:360ms}" +
    ".hxp-pill svg{width:26px;height:26px;flex:none}" +
    ".hxp-pill b{font-size:19px;line-height:1.15;font-weight:900;font-variant-numeric:tabular-nums}" +
    ".hxp-pill small{font-size:13px;font-weight:800}" +
    ".hxp-pill.is-c b{color:#8a5d00}" +
    ".hxp-timer{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(59,46,58,.3);transform-origin:left;animation:hxp-time var(--hxp-ms,4500ms) linear both}" +
    ".hx-prize.out .hxp-card{animation:hxp-out 280ms ease-in both}.hx-prize.out .hxp-burst{display:none}" +
    ".hxp-burst{position:absolute;left:36px;top:34px;width:0;height:0;z-index:1;pointer-events:none}" +
    ".hxp-burst i{position:absolute;left:-4px;top:-6px;width:8px;height:12px;border-radius:2px;background:var(--c);opacity:0;animation:hxp-bit var(--t) var(--d) cubic-bezier(.2,.7,.4,1) both}" +
    ".hxp-burst i.is-art{left:-9px;top:-9px;width:18px;height:18px;background:none}.hxp-burst i svg{display:block;width:100%;height:100%}" +
    ".hxp-fly{position:fixed;z-index:60;left:0;top:0;width:24px;height:24px;pointer-events:none}.hxp-fly svg{display:block;width:100%;height:100%}" +
    "html.shx[data-theme=dark] .hxp-card{box-shadow:0 4px 0 #120d12,0 0 0 1px rgba(242,193,78,.5),0 16px 44px rgba(242,193,78,.28)}" +
    "@media (prefers-color-scheme:dark){html.shx:not([data-theme=light]) .hxp-card{box-shadow:0 4px 0 #120d12,0 0 0 1px rgba(242,193,78,.5),0 16px 44px rgba(242,193,78,.28)}}" +
    "@keyframes hxp-in{0%{opacity:0;transform:translateY(var(--hxp-y)) scale(.86) rotate(-2deg)}100%{opacity:1;transform:none}}" +
    "@keyframes hxp-out{to{opacity:0;transform:translateY(calc(var(--hxp-y) * .4)) scale(.95)}}" +
    "@keyframes hxp-shine{to{left:130%}}" +
    "@keyframes hxp-spin{to{transform:rotate(360deg)}}" +
    "@keyframes hxp-pop{0%{opacity:0;transform:scale(.2)}100%{opacity:1;transform:none}}" +
    "@keyframes hxp-time{from{transform:scaleX(1)}to{transform:scaleX(0)}}" +
    "@keyframes hxp-bit{0%{opacity:1;transform:translate(0,0) rotate(0) scale(.4)}35%{opacity:1;transform:translate(var(--x),var(--up)) rotate(calc(var(--r)*.4)) scale(1)}" +
      "100%{opacity:0;transform:translate(calc(var(--x)*1.25),calc(var(--up) + var(--fall))) rotate(var(--r)) scale(.85)}}" +
        "@media (prefers-reduced-motion:reduce){.hx-prize *,.hx-prize *::after{animation:none!important}}" +
    ".hx-prize.is-calm .hxp-card{animation:hxp-fade 240ms ease-out both}.hx-prize.is-calm .hxp-card *,.hx-prize.is-calm .hxp-card::after{animation:none}" +
    ".hx-prize.is-calm.out .hxp-card{animation:hxp-fadeout 240ms ease-in both}" +
    "@keyframes hxp-fade{from{opacity:0}to{opacity:1}}@keyframes hxp-fadeout{to{opacity:0}}" +
    "@media (max-width:640px){.hx-prizes{--hxp-y:-46px;bottom:auto;top:calc(env(safe-area-inset-top,0px) + var(--boss-h,0px) + var(--hxp-top,0px) + 10px);width:calc(100% - 24px)}" +
      ".hxp-card{grid-template-columns:48px minmax(0,1fr);column-gap:10px;padding:10px 12px 13px 10px}.hxp-badge{width:48px;height:48px}.hxp-badge svg{width:32px;height:32px}" +
      ".hxp-title{font-size:16px}.hxp-pill{padding-right:9px}.hxp-pill svg{width:22px;height:22px}.hxp-pill b{font-size:17px}.hxp-pill small{font-size:12px}.hxp-burst{left:30px;top:30px}}";
  function prizeStyles(){
    if (document.getElementById("hxPrizeCss")) return;
    var s = document.createElement("style"); s.id = "hxPrizeCss"; s.textContent = PRIZE_CSS; document.head.appendChild(s);
  }
  function show(lines, opts, env){
    env = env || {}; opts = opts || {};
    if (!lines || !lines.length || !env.star) return;
    prizeStyles();
    var starSvg = env.star, coinSvg = env.coin || env.star, calm = !!(env.calm && env.calm());
    var badgeArt = env.badge || function(kind, c){ return c > 0 ? coinSvg() : starSvg(); };
    /* its own place, beside the page's toasts (a hub's shell, env.after) or in the body: over the bottom of the page on a
       laptop, dropping in at the top on a phone (the tab bar, Timmy and the report button are at the bottom there) */
    var after = env.after, box = env.within || (after && after.parentNode) || document.body, host = null;
    $$(".hx-prizes").forEach(function(x){ if (x.parentNode === box) host = x; });
    if (!host) { host = h('<div class="hx-prizes"' + (env.top ? ' style="--hxp-top:' + (env.top | 0) + 'px"' : '') + '></div>'); if (!env.within && after && after.parentNode) box.insertBefore(host, after.nextSibling); else box.appendChild(host); }
    var xp = 0, c = 0;
    lines.forEach(function(l){ xp += l.xp | 0; c += l.c | 0; });
    var first = lines[0], kind = opts.kind || first.src || "", title = first.t + (/[.!?]$/.test(first.t) ? "" : "!");
    var sub = opts.sub || first.sub || lines.slice(1).map(function(l){ return l.t; }).join(" · ");
    var big = xp >= 1000 || kind === "medal" || kind === "nuke" || kind === "alltime", ms = big ? 6500 : 4800;
    var said = lines.map(function(l){ return l.t + (l.xp ? ": +" + fmt(l.xp) + " XP" + (l.c ? " and " + fmt(l.c) + " Shiny Gold Crowns" : "") : "") + (l.sub ? ". " + l.sub : ""); }).join(". ") + (opts.sub ? ". " + opts.sub : "") + ".";
    var bits = "";
    if (!calm) {
      var COLORS = ["#F2C94C", "#FF8FA3", "#7FD8A8", "#8FA6EC", "#C3A9F0", "#F7A83C"], N = big ? 26 : 16;
      for (var i = 0; i < N; i++) {
        var ang = (-90 + (Math.random() * 150 - 75)) * Math.PI / 180, dist = 70 + Math.random() * (big ? 170 : 110), art = i % 5 === 0 ? coinSvg() : i % 5 === 1 ? starSvg() : "";
        bits += '<i class="' + (art ? "is-art" : "") + '" style="--x:' + Math.round(Math.cos(ang) * dist * 1.3) + "px;--up:" + Math.round(Math.sin(ang) * dist) + "px;--fall:" +
          Math.round(120 + Math.random() * 160) + "px;--r:" + Math.round(Math.random() * 720 - 360) + "deg;--d:" + Math.round(120 + Math.random() * 260) + "ms;--t:" +
          Math.round(1100 + Math.random() * 700) + "ms;--c:" + COLORS[i % COLORS.length] + '">' + art + "</i>";
      }
    }
    var pill = function(cls, art, n, unit){ return '<span class="hxp-pill ' + cls + '">' + art + '<b data-to="' + n + '">+' + fmt(n) + "</b><small>" + unit + "</small></span>"; };
    var el = h('<div class="hx-prize' + (calm ? " is-calm" : "") + (big ? " is-big" : "") + '" role="status" data-kind="' + esc(kind) + '" style="--hxp-ms:' + ms + 'ms"><span class="sr">' + esc(said) + "</span>" +
      '<div class="hxp-card" aria-hidden="true"><span class="hxp-badge"><span class="hxp-rays"></span>' + badgeArt(kind, c) + "</span>" +
        '<span class="hxp-head"><span class="hxp-kick">' + (xp || c ? "You earned" : "Nice work") + '</span><b class="hxp-title">' + esc(title) + "</b>" + (sub ? '<span class="hxp-sub">' + esc(sub) + "</span>" : "") +
          (xp || c ? '<span class="hxp-loot">' + (xp ? pill("is-xp", starSvg(), xp, "XP") : "") + (c ? pill("is-c", coinSvg(), c, c === 1 ? "crown" : "crowns") : "") + "</span>" : "") + "</span>" +
        '<i class="hxp-timer"></i></div>' + (bits ? '<span class="hxp-burst" aria-hidden="true">' + bits + "</span>" : "") + "</div>");
    /* at most two cards at a time: an older one makes room */
    var cards = $$(".hx-prize:not(.out)", host); if (cards.length >= 2) shut(cards[0], true);
    host.appendChild(el);
    var done = false;
    function shut(node, quick){
      if (node.classList.contains("out")) return;
      node.classList.add("out");
      if (node === el) { done = true; if (!quick) fly(el, env, calm); }
      setTimeout(function(){ node.remove(); }, 300);
    }
    el.addEventListener("click", function(){ shut(el); });
    /* the numbers count up from 0, the crowns a beat after the XP */
    if (!calm) $$(".hxp-pill b", el).forEach(function(b, k){
      var to = +b.getAttribute("data-to") || 0, t0 = null, wait = 260 + k * 160, dur = Math.min(1100, 500 + to / 4);
      b.textContent = "+0";
      (function step(ts){
        if (!b.isConnected) return;
        if (ts !== undefined) { if (t0 === null) t0 = ts; var x = Math.min(1, Math.max(0, (ts - t0 - wait) / dur)), e = 1 - Math.pow(1 - x, 3); b.textContent = "+" + fmt(Math.round(to * e)); if (x >= 1) return; }
        requestAnimationFrame(step);
      })();
    });
    setTimeout(function(){ if (!done) shut(el); }, ms);
  }
  /* the stars and coins fly from the card's pills to the rank in the bar (env.target()), which bumps when they land */
  function fly(el, env, calm){
    var tgt = env.target ? env.target() : null, pills = $$(".hxp-pill svg", el);
    if (!tgt || !pills.length || calm || !document.body.animate) return;
    var tr = tgt.getBoundingClientRect(), land = 0;
    for (var i = 0; i < 6; i++) (function(i){
      var src = pills[i % pills.length], sr = src.getBoundingClientRect();
      if (!sr.width) return;
      var f = h('<span class="hxp-fly" aria-hidden="true">' + src.outerHTML + "</span>");
      document.body.appendChild(f);
      var x0 = sr.left, y0 = sr.top, dx = tr.left + tr.width / 2 - 12 - x0, dy = tr.top + tr.height / 2 - 12 - y0,
        mx = dx * .3 + (Math.random() * 120 - 60), my = Math.min(0, dy) * .4 - 40 - Math.random() * 60, dur = 700 + i * 40, delay = i * 55;
      land = Math.max(land, dur + delay);
      f.animate([{ transform: "translate(" + x0 + "px," + y0 + "px) scale(.7)", opacity: 0 },
        { transform: "translate(" + (x0 + mx) + "px," + (y0 + my) + "px) scale(1.15) rotate(" + (i % 2 ? 160 : -160) + "deg)", opacity: 1, offset: .45 },
        { transform: "translate(" + (x0 + dx) + "px," + (y0 + dy) + "px) scale(.35) rotate(" + (i % 2 ? 340 : -340) + "deg)", opacity: .9 }],
        { duration: dur, delay: delay, easing: "cubic-bezier(.45,0,.6,1)", fill: "both" }).onfinish = function(){ f.remove(); };
    })(i);
    setTimeout(function(){ tgt.classList.remove("bump"); void tgt.offsetWidth; tgt.classList.add("bump"); }, Math.min(land, 900));
  }
  window.shPrize = { show: show };
})();
