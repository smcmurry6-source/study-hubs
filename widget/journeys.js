/* The three journeys' scenes (redesign phase 4, part A; vault/tasks/2026-11-06-redesign-progression-journeys.md).
   Fetched by widget/ranks.js the first time one is needed, never with the page, and only on the redesign's pages
   (a v2 rank profile, migration_v54). Nothing here runs on a live hub.

     shJourneys.handoff(d, done)   a journey's Dark Matter III is done and the next object is handed over, once:
                                   d = { from, to } (journeys 0-2). "The ModuPro is yours."
     shJourneys.dark(d, done)      a journey's Dark Matter is reached, once per journey ever: d = { journey }
     shJourneys.road(p)            the road ahead for the "you" panels, as markup: p is a v2 rank profile
     shJourneys.css()              adds the stylesheet (the scenes and the road share it)

   Both scenes are a dialog over the page: Esc or Skip closes them, the last button closes them, focus goes back where
   it was. Reduced motion gets the last frame, faded in, with nothing moving. They move transform and opacity only.
   No sound yet: the site has no sound setting, and these stay silent until it has one (a to-do in the journeys note).
   The medallions are shRanks.artOf (the handpiece by ranks.js, the ModuPro and the loupes by widget/hub-art/journeys.js,
   which is fetched first). When a scene reaches its peak it sends "sh:journey-scene", and "sh:journey-scene-end" when it
   closes, so Timmy can say something on a hub's bar once the page is back. */
(function(){
  "use strict";
  if (window.shJourneys || !window.shRanks) return;
  var R = window.shRanks, T = R.TIERS, JN = R.JOURNEYS, ROMAN = ["I", "II", "III"];
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString("en-US"); }
  function reduced(){ try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function floorOf(j, t){ var K = window.SH_JOURNEY_ART; return K ? K.floor(j, t) : j ? Math.floor(125000 * j + t * 125000 / 7) : T[t].at; }
  function stars(seed, n, w, h){
    var s = "", x = seed;
    for (var i = 0; i < n; i++){
      x = (x * 9301 + 49297) % 233280; var cx = x / 233280 * w; x = (x * 9301 + 49297) % 233280; var cy = x / 233280 * h;
      s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (i % 7 === 0 ? 1.6 : i % 3 === 0 ? 1 : .6) + '" fill="#fff" opacity="' + (i % 4 ? .7 : 1) + '"' + (i % 5 === 0 ? ' class="shj-tw" style="--tw:' + (i % 4) + '"' : "") + "/>";
    }
    return s;
  }
  var LOCK = '<svg class="shj-lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8.4 10.5V8a3.6 3.6 0 0 1 7.2 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var CHECK = '<svg class="shj-check" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.4 12.4l3 3 6.2-6.6" fill="none" stroke="#150B2E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- the stylesheet ---------- */
  var CSS = [
    ".shj{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:auto;padding:14px 16px;color:#F5F2F4;text-align:center;opacity:0;transition:opacity .4s ease;",
    "background:radial-gradient(120% 90% at 50% 8%,#2A1456 0%,#130A2B 52%,#05020C 100%);font-family:var(--font,system-ui,sans-serif);-webkit-tap-highlight-color:transparent}",
    ".shj.is-on{opacity:1}.shj.is-out{opacity:0;transition-duration:.28s}",
    ".shj *{box-sizing:border-box}",
    ".shj-sky{position:absolute;inset:0;width:100%;height:100%;opacity:.75;pointer-events:none}",
    ".shj-tw{animation:shj-tw 3.4s ease-in-out infinite;animation-delay:calc(var(--tw) * -.9s)}",
    "@keyframes shj-tw{0%,100%{opacity:1}50%{opacity:.25}}",
    ".shj-in{position:relative;display:grid;justify-items:center;gap:6px;width:min(720px,100%);margin:auto}",
    ".shj-stage{position:relative;display:grid;place-items:center;width:min(300px,72vw,34vh);aspect-ratio:1;margin:2px 0 0}",
    ".shj-stage>*{grid-area:1/1}",
    ".shj-med{display:block;width:78%;aspect-ratio:1}.shj-med svg{display:block;width:100%;height:100%}",
    ".shj-eyebrow{margin:6px 0 0;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#C9B6F5}",
    ".shj-title{margin:0;font-size:clamp(28px,min(6.6vw,7.4vh),56px);line-height:1.06;font-weight:800;letter-spacing:-.01em;text-wrap:balance}",
    ".shj-line{margin:2px 0 0;max-width:44ch;font-size:16px;line-height:1.5;color:#D9D0E6;text-wrap:pretty}",
    ".shj-go{margin-top:10px;min-height:48px;padding:0 26px;border:0;border-radius:999px;background:#F5F2F4;color:#1B1220;font:inherit;font-size:16px;font-weight:800;cursor:pointer}",
    ".shj-go:focus-visible,.shj-skip:focus-visible{outline:3px solid #fff;outline-offset:3px}",
    ".shj-skip{position:fixed;top:14px;right:14px;min-height:40px;padding:0 16px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(10,5,20,.5);color:#F5F2F4;font:inherit;font-size:14px;font-weight:700;cursor:pointer}",
    /* what a scene reveals in turn: each piece waits for its --at, then rises */
    ".shj [data-at]{opacity:0;transform:translateY(14px)}",
    ".shj.is-on [data-at]{animation:shj-rise .7s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--at)}",
    "@keyframes shj-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    ".shj-ring{position:absolute;left:11%;top:11%;width:78%;height:78%;border-radius:50%;border:2px solid rgba(255,255,255,.8);opacity:0;pointer-events:none}",
    ".shj.is-on .shj-ring{animation:shj-ring 1.3s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--at)}",
    "@keyframes shj-ring{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(2.6)}}",
    ".shj-flash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none}",
    ".shj.is-on .shj-flash{animation:shj-flash .9s ease-out both;animation-delay:var(--at)}",
    "@keyframes shj-flash{0%{opacity:0}12%{opacity:.85}100%{opacity:0}}",

    /* ----- the hand-off ----- */
    ".shj-track{display:flex;align-items:flex-start;justify-content:center;gap:0;margin:0 0 2px;padding:0;list-style:none}",
    ".shj-track li{position:relative;display:grid;justify-items:center;gap:5px;width:104px;font-size:13px;font-weight:700;color:#B9ADCB}",
    ".shj-track li+li::before{content:'';position:absolute;top:22px;right:calc(50% + 28px);width:calc(100% - 56px);border-top:2px dashed rgba(255,255,255,.3)}",
    ".shj-track li.is-done+li::before{border-top:2px solid #C9B6F5}",
    ".shj-sock{position:relative;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 2px rgba(255,255,255,.22)}",
    ".shj-sock svg.sh-rank-art{width:40px;height:40px}",
    ".shj-track .is-done{color:#fff}.shj-track .is-now{color:#fff}",
    ".shj-track .is-now .shj-sock{box-shadow:inset 0 0 0 2px #fff,0 0 22px rgba(255,255,255,.5)}",
    ".shj-track .is-lock .shj-sock{color:#8E81A3}",
    ".shj-track .shj-lock{width:20px;height:20px}",
    ".shj-track .shj-check{position:absolute;right:-5px;bottom:-4px;width:18px;height:18px;color:#C9F5D6}",
    ".shj-hand .shj-stage{width:min(320px,74vw,31vh)}",
    ".shj-hand.is-on .shj-sky{animation:shj-warp 8s cubic-bezier(.16,1,.3,1) both}",
    "@keyframes shj-warp{from{transform:scale(1)}to{transform:scale(1.18)}}",
    ".shj-hand.is-on .shj-in{animation:shj-shake .55s linear;animation-delay:var(--slam)}",
    "@keyframes shj-shake{0%,100%{transform:none}15%{transform:translate(-7px,5px)}30%{transform:translate(6px,-5px)}45%{transform:translate(-5px,-3px)}60%{transform:translate(4px,3px)}80%{transform:translate(-2px,1px)}}",
    ".shj-rays{position:absolute;left:-65%;top:-65%;width:230%;height:230%;border-radius:50%;opacity:0;pointer-events:none;",
    "background:repeating-conic-gradient(from 0deg,rgba(255,236,170,.34) 0deg 7deg,rgba(255,236,170,0) 7deg 20deg);",
    "-webkit-mask:radial-gradient(circle,#000 0%,rgba(0,0,0,.55) 30%,transparent 62%);mask:radial-gradient(circle,#000 0%,rgba(0,0,0,.55) 30%,transparent 62%)}",
    ".shj.is-on .shj-rays{animation:shj-rayin 1.2s ease-out both,shj-spin 38s linear infinite;animation-delay:var(--at),var(--at)}",
    "@keyframes shj-rayin{from{opacity:0}to{opacity:1}}@keyframes shj-spin{to{transform:rotate(360deg)}}",
    ".shj-halo{position:absolute;left:-10%;top:-10%;width:120%;height:120%;border-radius:50%;background:radial-gradient(circle,rgba(255,244,200,.6),rgba(255,214,120,.18) 42%,rgba(255,214,120,0) 68%);opacity:0;pointer-events:none}",
    ".shj.is-on .shj-halo{animation:shj-rayin 1s ease-out both;animation-delay:var(--at)}",
    ".shj-beam{position:absolute;left:33%;bottom:50%;width:34%;height:300%;transform-origin:50% 100%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,246,214,.9) 50%,rgba(255,255,255,0));opacity:0;pointer-events:none}",
    ".shj.is-on .shj-beam{animation:shj-beam 1.5s ease-out both;animation-delay:var(--at)}",
    "@keyframes shj-beam{0%{opacity:0;transform:scaleX(.1)}22%{opacity:1;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1.5)}}",
    ".shj-old{opacity:0}.shj-old .shj-med{width:100%}",
    ".shj.is-on .shj-old{animation:shj-oldin .7s ease-out both,shj-charge 1.5s ease-in-out .7s forwards,shj-fly 1s cubic-bezier(.76,0,.24,1) var(--fly) forwards}",
    "@keyframes shj-oldin{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}",
    "@keyframes shj-charge{0%,100%{transform:scale(1)}30%{transform:scale(1.06) rotate(-2deg)}60%{transform:scale(1.1) rotate(2deg)}85%{transform:scale(1.04)}}",
    "@keyframes shj-fly{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translate(var(--ox),var(--oy)) scale(.16)}}",
    ".shj-pre{position:absolute;left:-60%;right:-60%;bottom:-30px;margin:0;font-size:17px;font-weight:700;color:#D9D0E6;opacity:0;white-space:nowrap}",
    ".shj.is-on .shj-pre{animation:shj-pre 2.4s ease both .5s}",
    "@keyframes shj-pre{0%{opacity:0}18%,80%{opacity:1}100%{opacity:0}}",
    ".shj-new{opacity:0;filter:drop-shadow(0 0 26px rgba(255,236,170,.5))}",
    ".shj.is-on .shj-new{animation:shj-slam .9s cubic-bezier(.16,1,.3,1) both,shj-float 5s ease-in-out infinite;animation-delay:var(--at),calc(var(--at) + .9s)}",
    "@keyframes shj-slam{0%{opacity:0;transform:scale(2.6)}55%{opacity:1}100%{opacity:1;transform:scale(1)}}",
    "@keyframes shj-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}",
    ".shj-new .shj-med{width:86%}",
    ".shj-spark{position:absolute;left:50%;top:50%;margin:-3px 0 0 -3px;width:7px;height:7px;border-radius:50%;background:#FFE9A8;opacity:0;pointer-events:none}",
    ".shj-spark:nth-child(3n){width:4px;height:4px;background:#fff}.shj-spark:nth-child(4n){background:#C9B6F5}",
    ".shj.is-on .shj-spark{animation:shj-spark 1.5s cubic-bezier(.16,1,.3,1) forwards;animation-delay:calc(var(--at) + var(--d))}",
    "@keyframes shj-spark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(.3)}}",
    ".shj-socknow svg{opacity:0}.shj.is-on .shj-socknow svg{animation:shj-rayin .5s ease both;animation-delay:var(--at)}",
    ".shj-sockdone>*{opacity:0}.shj.is-on .shj-sockdone>*{animation:shj-pop .6s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--land)}",
    "@keyframes shj-pop{0%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(1.25)}100%{opacity:1;transform:none}}",
    ".shj-ahead{display:flex;justify-content:center;gap:8px;margin:8px 0 0;padding:0;list-style:none}",
    ".shj-ahead li{display:grid;justify-items:center;gap:4px;font-size:11px;font-weight:700;color:#B9ADCB}",
    ".shj-ahead svg{width:38px;height:38px}",
    ".shj-ahead li{opacity:0}.shj.is-on .shj-ahead li{animation:shj-pop .55s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--at) + var(--i) * .09s)}",
    ".shj-ahead .is-now{color:#fff}",
    ".shj-aheadcap{margin:4px 0 0;font-size:13px;font-weight:700;color:#C9B6F5}",
    ".shj-chip{display:inline-flex;align-items:center;gap:8px;margin:6px 0 0;padding:5px 14px 5px 6px;border-radius:999px;background:rgba(255,255,255,.1);font-size:14px;font-weight:700}",
    ".shj-chip svg{width:30px;height:30px;background:#FBF7F4;border-radius:50%;padding:2px}",

    /* ----- the Dark Matter unlock ----- */
    ".shj-dark{background:#05020C}",
    ".shj-dark .shj-sky,.shj-dark .shj-neb{opacity:0;transform:scale(1.35)}",
    ".shj-dark.is-on .shj-sky{animation:shj-open 2.2s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--open)}",
    ".shj-neb{position:absolute;inset:0;pointer-events:none}",
    ".shj-dark.is-on .shj-neb{animation:shj-open 2.6s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--open)}",
    "@keyframes shj-open{from{opacity:0;transform:scale(1.35)}to{opacity:var(--sky,.8);transform:none}}",
    ".shj-d0 .shj-neb{background:radial-gradient(120% 90% at 50% 8%,#2A1456 0%,rgba(19,10,43,.6) 52%,rgba(5,2,12,0) 100%)}",
    ".shj-d1 .shj-neb{background:radial-gradient(70% 60% at 18% 30%,rgba(214,60,170,.55) 0%,rgba(214,60,170,0) 62%),radial-gradient(80% 70% at 86% 72%,rgba(50,110,255,.55) 0%,rgba(50,110,255,0) 64%)}",
    ".shj-d2 .shj-neb{background:linear-gradient(200deg,rgba(40,200,170,.36) 0%,rgba(40,200,170,0) 46%),radial-gradient(100% 80% at 50% 110%,rgba(60,90,220,.5) 0%,rgba(60,90,220,0) 60%)}",
    ".shj-d1 .shj-eyebrow{color:#F5B6E3}.shj-d2 .shj-eyebrow{color:#9FF3E0}",
    ".shj-glow{position:absolute;left:-25%;top:-25%;width:150%;height:150%;border-radius:50%;background:radial-gradient(circle,rgba(122,60,255,.6),rgba(122,60,255,0) 66%);opacity:0;pointer-events:none}",
    ".shj-d1 .shj-glow{background:radial-gradient(circle,rgba(230,90,200,.55),rgba(230,90,200,0) 66%)}",
    ".shj-d2 .shj-glow{background:radial-gradient(circle,rgba(70,220,190,.46),rgba(70,220,190,0) 66%)}",
    ".shj-dark.is-on .shj-glow{animation:shj-rayin 1.6s ease-out both;animation-delay:var(--open)}",
    ".shj-was{opacity:0}",
    ".shj-dark.is-on .shj-was{animation:shj-oldin .7s ease-out both,shj-dim 1.5s ease-in var(--dim) forwards}",
    "@keyframes shj-dim{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.96)}}",
    ".shj-void{position:absolute;left:17%;top:17%;width:66%;height:66%;border-radius:50%;background:radial-gradient(circle,#000 0%,#07030F 70%,rgba(7,3,15,0) 100%);opacity:0;transform:scale(.1)}",
    ".shj-dark.is-on .shj-void{animation:shj-void 2.6s ease-in-out var(--dim) both}",
    "@keyframes shj-void{0%{opacity:0;transform:scale(.1)}45%{opacity:1;transform:scale(1.08)}70%{opacity:1;transform:scale(1.08)}100%{opacity:0;transform:scale(1.2)}}",
    ".shj-is{opacity:0}",
    ".shj-dark.is-on .shj-is{animation:shj-emerge 1.6s cubic-bezier(.16,1,.3,1) both,shj-float 6s ease-in-out infinite;animation-delay:var(--emerge),calc(var(--emerge) + 1.6s)}",
    "@keyframes shj-emerge{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:none}}",
    ".shj-dark .shj-med{width:84%}",
    ".shj-const{opacity:0}.shj-dark.is-on .shj-const{animation:shj-rayin 2s ease both;animation-delay:calc(var(--open) + .8s)}",

    /* the last frame, at once: reduced motion, and the design page's stills */
    ".shj.is-still,.shj.is-still *{animation:none!important}",
    ".shj.is-still [data-at],.shj.is-still .shj-new,.shj.is-still .shj-is,.shj.is-still .shj-ahead li,.shj.is-still .shj-socknow svg,.shj.is-still .shj-sockdone>*{opacity:1;transform:none}",
    ".shj.is-still .shj-rays,.shj.is-still .shj-halo,.shj.is-still .shj-glow{opacity:1}",
    ".shj.is-still .shj-sky,.shj.is-still .shj-neb{opacity:.8;transform:none}.shj.is-still .shj-const{opacity:1}",
    ".shj.is-still .shj-old,.shj.is-still .shj-was,.shj.is-still .shj-void,.shj.is-still .shj-pre,.shj.is-still .shj-beam,.shj.is-still .shj-ring,.shj.is-still .shj-spark,.shj.is-still .shj-flash{display:none}",
    ".shj.shj-inline{position:relative;inset:auto;z-index:0;opacity:1;border-radius:16px;overflow:hidden;padding:26px 16px}",
    ".shj.shj-inline .shj-skip{display:none}.shj.shj-inline .shj-go{pointer-events:none}",
    "@media (max-width:520px){.shj-track li{width:86px;font-size:12px}.shj-ahead{gap:4px}.shj-ahead svg{width:32px;height:32px}.shj-ahead li{font-size:10px}.shj-line{font-size:15px}}",
    "@media (max-height:700px){.shj-line{font-size:15px}.shj-track li{font-size:12px}.shj-sock{width:40px;height:40px}.shj-sock svg.sh-rank-art{width:34px;height:34px}.shj-track li+li::before{top:19px}}",

    /* ----- the road ahead (the 'you' panels) ----- */
    ".shj-road{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0 0;padding:0;list-style:none}",
    ".shj-road li{display:grid;justify-items:center;align-content:start;gap:3px;padding:14px 8px 12px;border-radius:var(--r-row,14px);background:var(--row,#fff);text-align:center;min-width:0}",
    ".shj-road .shj-rmed{position:relative;display:grid;place-items:center;width:64px;height:64px}",
    ".shj-road .shj-rmed svg.sh-rank-art{width:64px;height:64px}",
    ".shj-road b{font-weight:var(--w-head,800)}",
    ".shj-road span{font-size:var(--fs-meta,13px);color:var(--muted,#685c66);overflow-wrap:anywhere}",
    ".shj-road .is-now{box-shadow:inset 0 0 0 2px var(--text,#3b2e3a)}",
    ".shj-road .is-lock svg.sh-rank-art{filter:grayscale(1) brightness(.62) contrast(.9);opacity:.5}",
    ".shj-road .shj-lock{position:absolute;right:-8px;bottom:-4px;width:26px;height:26px;padding:5px;border-radius:50%;background:var(--row,#fff);color:var(--text,#3b2e3a);box-shadow:0 0 0 1px var(--border,#e8e0e6)}",
    ".shj-road .shj-rtro{position:absolute;right:-10px;bottom:-6px;width:30px;height:30px;border-radius:50%;background:#FBF7F4;box-shadow:0 0 0 1px var(--border,#e8e0e6);padding:2px}",
    ".shj-road .shj-bar{display:block;width:min(160px,100%);height:6px;margin:4px 0 2px;border-radius:3px;background:var(--track,#e9e1e7);overflow:hidden}",
    ".shj-road .shj-bar i{display:block;height:100%;border-radius:3px;background:var(--gold,#e2a72e)}",
    "@media (max-width:520px){.shj-road{grid-template-columns:1fr}.shj-road li{grid-template-columns:64px 1fr;justify-items:start;text-align:left;column-gap:14px}.shj-road .shj-rmed{grid-row:1 / span 4}}"
  ].join("");
  function css(){
    if (document.getElementById("shj-css")) return;
    var st = document.createElement("style"); st.id = "shj-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- a scene's frame: the dialog, its keys, its close ---------- */
  function trophySvg(k){ var K = window.SH_JOURNEY_ART, t = K && K.trophies && K.trophies[k]; return t ? '<svg viewBox="0 0 64 64" aria-hidden="true">' + t.body + "</svg>" : ""; }
  function med(j, t, px, opt, cls){ return '<span class="shj-med ' + (cls || "") + '">' + R.artOf(j, t, px, opt) + "</span>"; }
  function open(el, opt, done){
    css();
    var still = !!opt.still || reduced(), prev = document.activeElement, closed = false, timers = [];
    if (still) el.classList.add("is-still");
    document.body.appendChild(el);
    function close(){
      if (closed) return; closed = true;
      timers.forEach(clearTimeout); document.removeEventListener("keydown", key, true);
      el.classList.add("is-out");
      setTimeout(function(){
        el.remove(); try { if (prev && prev.focus) prev.focus({ preventScroll: true }); } catch (e) {}
        try { document.dispatchEvent(new CustomEvent("sh:journey-scene-end", { detail: opt.detail })); } catch (e) {}
        if (done) done();
      }, 300);
    }
    function key(e){
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === "Tab") {   // two buttons: keep the focus inside the dialog
        var f = el.querySelectorAll("button"), a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    }
    document.addEventListener("keydown", key, true);
    el.addEventListener("click", function(e){ if (e.target.closest(".shj-go, .shj-skip")) close(); });
    requestAnimationFrame(function(){ el.classList.add("is-on"); });
    var go = el.querySelector(".shj-go");
    try { (still ? go : el).focus({ preventScroll: true }); } catch (e) {}
    if (!still && opt.focusAt) timers.push(setTimeout(function(){ try { if (!closed) go.focus({ preventScroll: true }); } catch (e) {} }, opt.focusAt));
    if (opt.peakAt != null) timers.push(setTimeout(function(){ try { document.dispatchEvent(new CustomEvent("sh:journey-scene", { detail: opt.detail })); } catch (e) {} }, still ? 200 : opt.peakAt));
    return close;
  }
  function shell(cls, label, inner){
    var el = document.createElement("div");
    el.className = "shj " + cls; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", label); el.tabIndex = -1;
    el.innerHTML = inner + '<button type="button" class="shj-skip" data-shj="skip">Skip</button>';
    return el;
  }

  /* ---------- the hand-off: the finished journey's Dark Matter medallion charges, flies up to its place on the road,
     a beam comes down and the next object lands in it; then its name, its seven ranks lighting in turn, the trophy ---------- */
  function handoffHTML(d){
    var from = Math.max(0, Math.min(1, d.from | 0)), to = Math.max(1, Math.min(2, d.to | 0)), name = JN[to], AT = 3.5;
    var track = [0, 1, 2].map(function(j){
      var st = j < to ? "is-done" : j === to ? "is-now" : "is-lock";
      return '<li class="' + st + '"><span class="shj-sock' + (j === from ? " shj-sockdone" : j === to ? " shj-socknow" : "") + '"' + (j === to ? ' style="--at:' + (AT + .5) + 's"' : "") + ">" +
        (j > to ? LOCK : R.artOf(j, j < to ? 6 : 0, 36) + (j < to ? CHECK : "")) + "</span>" + esc(JN[j]) + "</li>";
    }).join("");
    var sparks = "";
    for (var i = 0, x = 17; i < 34; i++){
      x = (x * 9301 + 49297) % 233280; var a = x / 233280 * Math.PI * 2; x = (x * 9301 + 49297) % 233280; var r = 120 + x / 233280 * 190;
      sparks += '<i class="shj-spark" style="--sx:' + Math.round(Math.cos(a) * r) + "px;--sy:" + Math.round(Math.sin(a) * r) + "px;--d:" + (i % 6 * .04).toFixed(2) + 's"></i>';
    }
    var ahead = T.map(function(t, i){ return '<li style="--i:' + i + '"' + (i ? "" : ' class="is-now"') + ">" + R.artOf(to, i, 36) + esc(t.name) + "</li>"; }).join("");
    var tro = trophySvg("journey-" + from);
    return '<svg class="shj-sky" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + stars(5, 120, 800, 600) + "</svg>" +
      '<span class="shj-flash" style="--at:' + AT + 's"></span>' +
      '<div class="shj-in" style="--slam:' + AT + 's">' +
      '<ol class="shj-track" aria-label="The three journeys" data-at style="--at:.2s;--land:3.1s">' + track + "</ol>" +
      '<div class="shj-stage" style="--at:' + AT + 's;--fly:2.3s">' +
        '<span class="shj-rays" style="--at:' + (AT + .2) + 's"></span><span class="shj-halo"></span><span class="shj-beam" style="--at:' + (AT - .5) + 's"></span>' +
        '<span class="shj-ring"></span><span class="shj-ring" style="--at:' + (AT + .25) + 's"></span>' +
        '<span class="shj-old" aria-hidden="true">' + med(from, 6, 200, { animate: true, level: 3 }) + "</span>" +
        '<p class="shj-pre" aria-hidden="true">Dark Matter III. The ' + esc(JN[from]) + " is finished.</p>" +
        '<span class="shj-new">' + med(to, 0, 240, { animate: true, level: 1 }) + "</span>" + sparks +
      "</div>" +
      '<p class="shj-eyebrow" data-at style="--at:' + (AT + .7) + 's">Journey ' + (to + 1) + " of 3 · " + fmt(125000 * to) + " XP</p>" +
      '<h2 class="shj-title" data-at style="--at:' + (AT + .85) + 's">The ' + esc(name) + (to === 2 ? " are yours." : " is yours.") + "</h2>" +
      '<p class="shj-line" data-at style="--at:' + (AT + 1.05) + 's">You finished the ' + esc(JN[from]) + ". Your XP, your trophies and everything you earned come with you.</p>" +
      '<ol class="shj-ahead" aria-label="Seven new ranks" style="--at:' + (AT + 1.5) + 's">' + ahead + "</ol>" +
      '<p class="shj-aheadcap" data-at style="--at:' + (AT + 2.2) + 's">Seven new ranks, Stone to Dark Matter</p>' +
      (tro ? '<p class="shj-chip" data-at style="--at:' + (AT + 2.5) + 's">' + tro + "Trophy won: " + esc(JN[from]) + " finished</p>" : "") +
      '<button type="button" class="shj-go" data-shj="go" data-at style="--at:' + (AT + 2.9) + 's">Begin the ' + esc(name) + "</button></div>";
  }
  function placeFly(el){
    /* where the old medallion flies: from the middle of the stage to its place on the road */
    var a = el.querySelector(".shj-old"), b = el.querySelector(".shj-sockdone");
    if (!a || !b) return;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    el.style.setProperty("--ox", Math.round(rb.left + rb.width / 2 - ra.left - ra.width / 2) + "px");
    el.style.setProperty("--oy", Math.round(rb.top + rb.height / 2 - ra.top - ra.height / 2) + "px");
  }
  function handoff(d, done, opt){
    d = d || {}; opt = opt || {};
    R.needJourneyArt(function(){
      var to = Math.max(1, Math.min(2, d.to | 0));
      var el = shell("shj-hand", "A new journey: the " + JN[to], handoffHTML(d));
      open(el, { still: opt.still, focusAt: 6400, peakAt: 3600, detail: { kind: "handoff", journey: to } }, done);
      placeFly(el);
    });
  }

  /* ---------- the Dark Matter unlock: the rank before it glows, its casing goes dark, the Dark Matter medallion comes
     out of the dark with its stars, and the sky opens behind it. Each journey has its own sky. ---------- */
  var DARK_LINE = ["The casing goes dark and the stars come out.", "A nebula drifts between the teeth.", "A constellation, seen through both lenses."];
  function darkHTML(d){
    var j = Math.max(0, Math.min(2, d.journey | 0));
    var cons = j === 2 ? '<path class="shj-const" d="M120 150 L210 110 L300 170 L390 128 L470 200 M300 170 L282 268 M560 96 L640 150 L700 120" fill="none" stroke="#9FF3E0" stroke-opacity=".55" stroke-width="1.2"/>' : "";
    return '<span class="shj-neb"></span><svg class="shj-sky" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cons + stars(11 + j * 6, 150, 800, 600) + "</svg>" +
      '<span class="shj-flash" style="--at:3.1s"></span>' +
      '<div class="shj-in"><div class="shj-stage" style="--dim:1.1s;--emerge:2.7s">' +
        '<span class="shj-glow"></span><span class="shj-ring" style="--at:3.1s"></span><span class="shj-ring" style="--at:3.4s"></span>' +
        '<span class="shj-was" aria-hidden="true">' + med(j, 5, 200, { animate: true, level: 3 }) + "</span>" +
        '<span class="shj-void"></span>' +
        '<span class="shj-is">' + med(j, 6, 240, { animate: true, level: 1 }) + "</span></div>" +
      '<p class="shj-eyebrow" data-at style="--at:3.6s">' + esc(JN[j]) + " · rank 7 of 7</p>" +
      '<h2 class="shj-title" data-at style="--at:3.75s">Dark Matter</h2>' +
      '<p class="shj-line" data-at style="--at:3.95s">' + fmt(floorOf(j, 6)) + " XP. " + DARK_LINE[j] + "</p>" +
      '<button type="button" class="shj-go" data-shj="go" data-at style="--at:4.6s">Keep going</button></div>';
  }
  function dark(d, done, opt){
    d = d || {}; opt = opt || {};
    var j = Math.max(0, Math.min(2, d.journey | 0));
    function run(){
      var el = shell("shj-dark shj-d" + j, "Dark Matter unlocked", darkHTML(d));
      el.style.setProperty("--open", "3.1s");
      open(el, { still: opt.still, focusAt: 4700, peakAt: 3200, detail: { kind: "dark", journey: j } }, done);
    }
    if (j > 0) R.needJourneyArt(run); else run();
  }

  /* ---------- the road ahead: where you are on the three journeys, the next object shown locked ---------- */
  function road(p){
    css();
    var j = p && p.journey > 0 ? Math.min(2, p.journey | 0) : 0, xp = p ? p.xp || 0 : 0, t = p ? Math.max(0, Math.min(6, p.tier | 0)) : 0, lv = p ? p.level || 1 : 1;
    return '<ol class="shj-road" aria-label="The three journeys">' + [0, 1, 2].map(function(k){
      var st = k < j ? "is-done" : k === j ? "is-now" : "is-lock", lo = 125000 * k, end = 125000 * (k + 1), tro = k < j ? trophySvg("journey-" + k) : "";
      var body = k < j ? "<span>Finished</span>"
        : k === j ? "<span>" + esc(T[t].name + " " + ROMAN[lv - 1]) + " · " + fmt(xp) + ' XP</span><span class="shj-bar"><i style="width:' + Math.max(2, Math.min(100, (xp - lo) / 1250)).toFixed(1) + '%"></i></span><span>' +
            (xp >= end ? "Finished" : fmt(end - xp) + " XP to " + (k < 2 ? "the " + JN[k + 1] : "the end")) + "</span>"
        : "<span>Starts at " + fmt(lo) + " XP</span>";
      return '<li class="' + st + '"><span class="shj-rmed">' + R.artOf(k, k < j ? 6 : k === j ? t : 0, 64, k === j ? { level: lv } : null) + (k > j ? LOCK : tro ? '<span class="shj-rtro">' + tro + "</span>" : "") + "</span><b>" + esc(JN[k]) + "</b>" + body + "</li>";
    }).join("") + "</ol>";
  }

  /* the last frame of a scene as a node that sits in a page (the design page's contact sheet) */
  function still(kind, d){
    css();
    var el = document.createElement("div");
    el.className = "shj shj-inline is-still is-on " + (kind === "dark" ? "shj-dark shj-d" + Math.max(0, Math.min(2, (d && d.journey) | 0)) : "shj-hand");
    el.innerHTML = kind === "dark" ? darkHTML(d || {}) : handoffHTML(d || {});
    return el;
  }

  window.shJourneys = { handoff: handoff, dark: dark, road: road, still: still, css: css };
})();
