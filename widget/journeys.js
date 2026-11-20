/* The three journeys' scenes (redesign phase 4, part A; vault/tasks/2026-11-06-redesign-progression-journeys.md).
   Fetched by widget/ranks.js the first time one is needed, never with the page, and only on the redesign's pages
   (a v2 rank profile, migration_v54). Nothing here runs on a live hub.

     shJourneys.handoff(d, done)   a journey's Dark Matter III is done and the next object is handed over, once:
                                   d = { from, to } (journeys 0-2). "The ModuPro is yours."
     shJourneys.dark(d, done)      a journey's Dark Matter is reached, once per journey ever: d = { journey, position, of }
                                   (where the student stands in the class, if known). It shows the 5,000 crowns it pays.
     shJourneys.road(p)            the road ahead for the "you" panels, as markup: p is a v2 rank profile
     shJourneys.css()              adds the stylesheet (the scenes and the road share it)

   Both scenes are a dialog over the page: Esc closes them, Skip closes the hand-off and takes the Dark Matter unlock to
   its last frame (its reward stays on screen), the last button closes them, focus goes back where it was. Reduced motion
   gets the last frame, faded in, with nothing moving. They move transform and opacity only, but for the Dark Matter
   title's one sheen; the Dark Matter unlock's dust, burst, ring of light and coins are drawn on one canvas.
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

  /* the Diamond medallion's tremble as the pull builds: a shake that grows to a rattle */
  var TREMBLE = (function(){
    var k = "@keyframes shj-tremble{0%{transform:none}";
    for (var i = 1; i < 40; i++){
      var p = i / 40, a = .4 + 7 * p * p, sx = i % 2 ? 1 : -1, sy = i % 3 ? -1 : 1;
      k += (p * 100).toFixed(1) + "%{transform:translate(" + (sx * a).toFixed(1) + "px," + (sy * a * .7).toFixed(1) + "px) rotate(" + (sx * p * 3).toFixed(1) + "deg) scale(" + (1 + p * .08).toFixed(3) + ")}";
    }
    return k + "100%{transform:scale(1.08)}}";
  })();

  /* ---------- the stylesheet ---------- */
  var CSS = [
    ".shj{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden auto;padding:14px 16px;color:#F5F2F4;text-align:center;opacity:0;transition:opacity .4s ease;",
    "background:radial-gradient(120% 90% at 50% 8%,#2A1456 0%,#130A2B 52%,#05020C 100%);font-family:var(--font,system-ui,sans-serif);-webkit-tap-highlight-color:transparent}",
    ".shj.is-on{opacity:1}.shj.is-out{opacity:0;transition-duration:.28s}",
    /* sized by the scene, not the viewport: the large text sizes zoom the page, and vw and vh don't follow the zoom (a 320px
       phone at XX-Large has 221px for the scene, where 72vw is 230px). The design page's stills have no container, and
       there cqw and cqh are the viewport's. */
    ".shj:not(.shj-inline){container:shj / size}",
    ".shj *{box-sizing:border-box}",
    ".shj-sky{position:absolute;inset:0;width:100%;height:100%;opacity:.75;pointer-events:none}",
    ".shj-tw{animation:shj-tw 3.4s ease-in-out infinite;animation-delay:calc(var(--tw) * -.9s)}",
    "@keyframes shj-tw{0%,100%{opacity:1}50%{opacity:.25}}",
    ".shj-in{position:relative;display:grid;justify-items:center;gap:6px;width:min(720px,100%);margin:auto}",
    ".shj-stage{position:relative;display:grid;place-items:center;width:min(300px,100%,72cqw,34cqh);aspect-ratio:1;margin:2px 0 0}",
    ".shj-stage>*{grid-area:1/1}",
    ".shj-med{display:block;width:78%;aspect-ratio:1}.shj-med svg{display:block;width:100%;height:100%}",
    ".shj-eyebrow{margin:6px 0 0;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#C9B6F5}.shj-nw{white-space:nowrap}",
    ".shj-title{margin:0;font-size:clamp(28px,min(6.6cqw,7.4cqh),56px);line-height:1.06;font-weight:800;letter-spacing:-.01em;text-wrap:balance}",
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
    ".shj-hand .shj-stage{width:min(320px,100%,74cqw,31cqh)}",
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

    /* ----- the Dark Matter unlock: gravity pulls everything into the Diamond medallion, it collapses to a point, a beat
       of dark, and it detonates: shock waves, the sky, the Dark Matter medallion, its name letter by letter, the crowns.
       --bang is the detonation; everything after it is timed from it. ----- */
    ".shj-dark{background:#05020C;--jc:#7A3CFF;--jl:#C9B6F5;--jg:rgba(122,60,255,.62);--jr:rgba(190,160,255,.3)}",
    ".shj-d1{--jc:#D63CAA;--jl:#F5B6E3;--jg:rgba(230,90,200,.58);--jr:rgba(255,170,230,.28)}.shj-d2{--jc:#2FC9A8;--jl:#9FF3E0;--jg:rgba(70,220,190,.5);--jr:rgba(160,255,230,.26)}",
    ".shj-dark .shj-sky,.shj-dark .shj-neb{opacity:0;transform:scale(1.5)}",
    ".shj-dark.is-on .shj-sky{animation:shj-open 2.4s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--bang)}",
    ".shj-neb{position:absolute;inset:0;pointer-events:none}",
    ".shj-dark.is-on .shj-neb{animation:shj-open 3s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--bang)}",
    "@keyframes shj-open{from{opacity:0;transform:scale(1.5)}to{opacity:var(--sky,.8);transform:none}}",
    ".shj-d0 .shj-neb{background:radial-gradient(120% 90% at 50% 8%,#2A1456 0%,rgba(19,10,43,.6) 52%,rgba(5,2,12,0) 100%)}",
    ".shj-d1 .shj-neb{background:radial-gradient(70% 60% at 18% 30%,rgba(214,60,170,.55) 0%,rgba(214,60,170,0) 62%),radial-gradient(80% 70% at 86% 72%,rgba(50,110,255,.55) 0%,rgba(50,110,255,0) 64%)}",
    ".shj-d2 .shj-neb{background:linear-gradient(200deg,rgba(40,200,170,.36) 0%,rgba(40,200,170,0) 46%),radial-gradient(100% 80% at 50% 110%,rgba(60,90,220,.5) 0%,rgba(60,90,220,0) 60%)}",
    ".shj-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
    ".shj-dark .shj-stage{width:min(270px,100%,64cqw,29cqh)}",
    ".shj-dark.is-on .shj-stage{animation:shj-up 1s cubic-bezier(.65,0,.35,1) both;animation-delay:calc(var(--bang) + .3s)}",
    "@keyframes shj-up{from{transform:translateY(var(--dy,0px))}to{transform:none}}",
    ".shj-dark .shj-eyebrow{color:var(--jl)}",
    /* before: the pull */
    ".shj-pull{position:absolute;left:-30%;top:-30%;width:160%;height:160%;border-radius:50%;background:radial-gradient(circle,rgba(47,159,214,.6),rgba(47,159,214,0) 62%);opacity:0;pointer-events:none}",
    ".shj-dark.is-on .shj-pull{animation:shj-pull 2.9s ease-in .5s both}",
    "@keyframes shj-pull{0%{opacity:0;transform:scale(.7)}70%{opacity:1;transform:scale(1.3)}90%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(.1)}}",
    ".shj-lens{position:absolute;left:11%;top:11%;width:78%;height:78%;border-radius:50%;border:1.5px solid rgba(160,210,255,.75);opacity:0;pointer-events:none}",
    ".shj-dark.is-on .shj-lens{animation:shj-lens 1s cubic-bezier(.5,0,.75,0) 2 both;animation-delay:var(--at)}",
    "@keyframes shj-lens{0%{opacity:0;transform:scale(3.4)}35%{opacity:.6}100%{opacity:0;transform:scale(1)}}",
    ".shj-was{opacity:0}",
    ".shj-dark.is-on .shj-was{animation:shj-oldin .7s ease-out .2s both,shj-tremble 2.5s linear .9s,shj-implode .5s cubic-bezier(.7,0,.84,0) 3.3s forwards}",
    TREMBLE,
    "@keyframes shj-implode{0%{opacity:1;transform:scale(1.08)}100%{opacity:0;transform:scale(0) rotate(160deg)}}",
    ".shj-dark .shj-pre{bottom:-36px}.shj-dark.is-on .shj-pre{animation:shj-pre 2.7s ease both .5s}",
    ".shj-core{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 16px 6px #fff,0 0 54px 18px var(--jc);opacity:0;pointer-events:none}",
    ".shj-dark.is-on .shj-core{animation:shj-core .75s ease-in-out forwards;animation-delay:calc(var(--bang) - .7s)}",
    "@keyframes shj-core{0%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1)}55%{transform:scale(.55)}80%{opacity:1;transform:scale(1.5)}100%{opacity:0;transform:scale(4)}}",
    /* the detonation */
    ".shj-dark.is-on .shj-flash{animation:shj-flash2 1s ease-out both;animation-delay:var(--at)}",
    "@keyframes shj-flash2{0%{opacity:0}5%{opacity:1}28%{opacity:.3}100%{opacity:0}}",
    ".shj-wave{position:absolute;left:30%;top:30%;width:40%;height:40%;border-radius:50%;border:3px solid rgba(255,255,255,.92);opacity:0;pointer-events:none}",
    ".shj-wave.is-c{border:6px solid var(--jl)}.shj-wave.is-t{border-width:1.5px}",
    ".shj-dark.is-on .shj-wave{animation:shj-wave 1.6s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--at)}",
    "@keyframes shj-wave{0%{opacity:1;transform:scale(.2)}100%{opacity:0;transform:scale(9)}}",
    ".shj-dark.is-on .shj-in{animation:shj-quake .9s linear;animation-delay:var(--bang)}",
    "@keyframes shj-quake{0%,100%{transform:none}8%{transform:translate(-12px,8px)}16%{transform:translate(11px,-9px)}26%{transform:translate(-9px,-6px)}36%{transform:translate(8px,7px)}48%{transform:translate(-6px,3px)}60%{transform:translate(4px,-4px)}74%{transform:translate(-2px,2px)}86%{transform:translate(1px,-1px)}}",
    ".shj-dark .shj-rays{background:repeating-conic-gradient(from 0deg,var(--jr) 0deg 6deg,rgba(0,0,0,0) 6deg 18deg)}",
    ".shj-glow{position:absolute;left:-40%;top:-40%;width:180%;height:180%;border-radius:50%;background:radial-gradient(circle,var(--jg),rgba(0,0,0,0) 64%);opacity:0;pointer-events:none}",
    ".shj-dark.is-on .shj-glow{animation:shj-rayin 1s ease-out both,shj-breathe 3.6s ease-in-out infinite;animation-delay:var(--bang),calc(var(--bang) + 1s)}",
    "@keyframes shj-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}",
    ".shj-is{opacity:0}",
    ".shj-dark.is-on .shj-is{animation:shj-slam2 1.1s cubic-bezier(.16,1,.3,1) both,shj-float 6s ease-in-out infinite;animation-delay:calc(var(--bang) + .05s),calc(var(--bang) + 1.15s)}",
    "@keyframes shj-slam2{0%{opacity:0;transform:scale(3.2) rotate(-24deg)}40%{opacity:1}70%{transform:scale(.94) rotate(2deg)}100%{opacity:1;transform:none}}",
    ".shj-dark .shj-med{width:84%}",
    /* positioned, so the rays and the glow stay behind it in the still frame too (an animated transform did that by itself) */
    ".shj-dark .shj-was,.shj-dark .shj-is{position:relative}",
    ".shj-const{opacity:0}.shj-dark.is-on .shj-const{animation:shj-rayin 2s ease both;animation-delay:calc(var(--bang) + .8s)}",
    /* its name: each letter lands, then one sheen across it */
    ".shj-dmt{position:relative;isolation:isolate;font-size:clamp(40px,min(11cqw,9.4cqh),92px);letter-spacing:-.015em;color:#F6F1FF}",
    ".shj-dmt .shj-lt{display:inline-block;opacity:0}",
    ".shj-dark.is-on .shj-dmt .shj-lt{animation:shj-letter .9s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--at) + var(--i) * .06s)}",
    "@keyframes shj-letter{0%{opacity:0;transform:translateY(-.45em) scale(2.2)}55%{opacity:1}100%{opacity:1;transform:none}}",
    ".shj-tglow{position:absolute;left:-14%;right:-14%;top:-35%;bottom:-35%;z-index:-1;border-radius:50%;background:radial-gradient(closest-side,var(--jg),rgba(0,0,0,0));opacity:0;pointer-events:none}",
    ".shj-dark.is-on .shj-tglow{animation:shj-rayin 1.2s ease-out both;animation-delay:var(--at)}",
    ".shj-sheen{position:absolute;inset:0;color:transparent;background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,.95) 50%,rgba(255,255,255,0) 60%) no-repeat;background-size:300% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;pointer-events:none}",
    ".shj-dark.is-on .shj-sheen{animation:shj-sheen 1.3s ease-in-out both;animation-delay:var(--sh)}",
    "@keyframes shj-sheen{from{background-position:100% 0}to{background-position:0 0}}",
    /* the reward */
    ".shj-loot{display:grid;width:min(420px,100%);margin:12px 0 0;border-radius:20px;text-align:left;background:linear-gradient(180deg,rgba(255,214,120,.16),rgba(255,214,120,.05));box-shadow:inset 0 0 0 1.5px rgba(255,214,120,.6),0 18px 50px rgba(242,201,76,.16)}",
    ".shj-lrow{display:flex;align-items:center;gap:14px;padding:12px 18px;min-width:0}",
    ".shj-lrow+.shj-lrow{border-top:1px solid rgba(255,214,120,.22)}",
    ".shj-coin{flex:none;width:60px;height:60px;opacity:0}.shj-coin svg{display:block;width:100%;height:100%;overflow:visible}",
    ".shj-dark.is-on .shj-coin{animation:shj-coinin 1s cubic-bezier(.16,1,.3,1) both,shj-flip 4s ease-in-out infinite;animation-delay:var(--cn),calc(var(--cn) + 2.2s)}",
    "@keyframes shj-coinin{0%{opacity:0;transform:scale(.1) rotate(-220deg)}60%{opacity:1;transform:scale(1.3) rotate(12deg)}100%{opacity:1;transform:none}}",
    "@keyframes shj-flip{0%,72%,100%{transform:none}78%{transform:scaleX(.06)}84%{transform:scaleX(1)}90%{transform:scaleX(.06)}96%{transform:none}}",
    ".shj-dark.is-collect .shj-coin{animation:shj-collect .55s cubic-bezier(.5,0,.75,0) forwards}",
    "@keyframes shj-collect{to{opacity:0;transform:translateY(-55vh) scale(.5) rotate(40deg)}}",
    ".shj-amt{display:grid;gap:3px;min-width:0}",
    ".shj-num{font-size:clamp(30px,8cqw,40px);line-height:1;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.01em;color:#FFD866;background:linear-gradient(180deg,#FFF6D1 0%,#FFD866 45%,#E0A92A 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
    ".shj-amt small{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F5DFA0}",
    ".shj-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    ".shj-lplace{font-size:14px;line-height:1.4;color:#E6DDF0}.shj-lplace b{display:block;font-size:14px;color:#fff}",
    ".shj-hic{flex:none;display:grid;place-items:center;width:44px;height:44px;margin:0 8px;border-radius:12px;background:rgba(255,255,255,.08);color:var(--jl)}.shj-hic svg{width:26px;height:26px}",
    ".shj-tag{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:rgba(255,184,77,.18);color:#FFC86B;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;vertical-align:1px}",
    ".shj-dark .shj-go{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#FFF1C2,#F2C94C);color:#2A1A00;box-shadow:0 10px 30px rgba(242,201,76,.35)}",
    ".shj-dark .shj-go svg{width:24px;height:24px}",
    "@container shj (max-height:700px){.shj-dark .shj-lrow{padding:9px 14px}.shj-dark .shj-coin{width:48px;height:48px}.shj-dark .shj-loot{margin-top:8px}}",
    "@container shj (max-width:360px){.shj-dark .shj-lrow{gap:10px;padding:10px 12px}.shj-hic{margin:0 2px}}",
    "@container shj (max-height:600px){.shj-dark .shj-line{font-size:14px;line-height:1.4}.shj-dark .shj-lplace{font-size:13px}.shj-dark .shj-num{font-size:28px}.shj-dark .shj-go{margin-top:8px;min-height:44px}.shj-dark .shj-eyebrow{margin-top:2px}}",

    /* the last frame, at once: reduced motion, and the design page's stills */
    ".shj.is-still,.shj.is-still *{animation:none!important}",
    ".shj.is-still [data-at],.shj.is-still .shj-new,.shj.is-still .shj-is,.shj.is-still .shj-ahead li,.shj.is-still .shj-socknow svg,.shj.is-still .shj-sockdone>*,.shj.is-still .shj-lt,.shj.is-still .shj-coin{opacity:1;transform:none}",
    ".shj.is-still .shj-rays,.shj.is-still .shj-halo,.shj.is-still .shj-glow,.shj.is-still .shj-tglow{opacity:1}",
    ".shj.is-still .shj-sky,.shj.is-still .shj-neb{opacity:.8;transform:none}.shj.is-still .shj-const{opacity:1}",
    ".shj.is-still .shj-old,.shj.is-still .shj-was,.shj.is-still .shj-pull,.shj.is-still .shj-lens,.shj.is-still .shj-core,.shj.is-still .shj-wave,.shj.is-still .shj-cv,.shj.is-still .shj-sheen,.shj.is-still .shj-pre,.shj.is-still .shj-beam,.shj.is-still .shj-ring,.shj.is-still .shj-spark,.shj.is-still .shj-flash{display:none}",
    ".shj.shj-inline{position:relative;inset:auto;z-index:0;opacity:1;border-radius:16px;overflow:hidden;padding:26px 16px}",
    ".shj.shj-inline .shj-skip{display:none}.shj.shj-inline .shj-go{pointer-events:none}",
    "@media (max-width:520px){.shj-track li{width:86px;font-size:12px}.shj-ahead{gap:4px}.shj-ahead svg{width:32px;height:32px}.shj-ahead li{font-size:10px}.shj-line{font-size:15px}}",
    "@media (max-height:700px){.shj-line{font-size:15px}.shj-track li{font-size:12px}.shj-sock{width:40px;height:40px}.shj-sock svg.sh-rank-art{width:34px;height:34px}.shj-track li+li::before{top:19px}}",
    /* the same at the large text sizes, which zoom the page: the scene is narrower or shorter than the screen */
    "@container shj (max-width:520px){.shj-track li{width:86px;font-size:12px}.shj-ahead{gap:4px}.shj-ahead svg{width:32px;height:32px}.shj-ahead li{font-size:10px}.shj-line{font-size:15px}}",
    "@container shj (max-height:700px){.shj-line{font-size:15px}.shj-track li{font-size:12px}.shj-sock{width:40px;height:40px}.shj-sock svg.sh-rank-art{width:34px;height:34px}.shj-track li+li::before{top:19px}}",
    /* a phone: Skip sits over the right end of the hand-off's track, so the track starts below it; a phone at the large
       text sizes: the track shares the width, and the seven ranks wrap to a second row */
    "@container shj (max-width:420px){.shj-hand .shj-in{padding-top:46px}}",
    "@container shj (max-width:300px){.shj-track{justify-self:stretch}.shj-track li{flex:1 1 0;width:auto;min-width:0;font-size:11px}.shj-ahead{flex-wrap:wrap;row-gap:6px}}",

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
      if (opt.end) opt.end();
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
    /* opt.skip(): the scene jumps to its last frame instead (true when it did); opt.go(close): the last button's flourish */
    el.addEventListener("click", function(e){
      if (e.target.closest(".shj-skip")) { if (!(opt.skip && !still && opt.skip())) close(); }
      else if (e.target.closest(".shj-go")) { if (opt.go && !still) opt.go(close); else close(); }
    });
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
      '<p class="shj-eyebrow" data-at style="--at:' + (AT + .7) + 's"><span class="shj-nw">Journey ' + (to + 1) + ' of 3</span> · <span class="shj-nw">' + fmt(125000 * to) + " XP</span></p>" +
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

  /* ---------- the Dark Matter unlock (Sam, 2026-11-20: "make it significantly more epic and rewarding feeling"; it had
     looked like any other rank). About 8.5 seconds to the button:
       0.5-3.3 s  gravity: dust streams into the Diamond III medallion, a disk forms and spins up, rings close in on it, it
                  trembles harder and harder;
       3.3-4.3 s  it collapses into a point, and a beat of dark;
       4.3 s      the detonation (--bang): a flash, shock waves, the screen shakes, the journey's sky opens, the Dark Matter
                  medallion slams in with rays and a slow ring of light around it;
       4.6-5.6 s  the medallion rises from the middle of the screen to its place;
       5.5-7.6 s  "Dark Matter" letter by letter and a sheen across it, the line, then the reward: 5,000 Shiny Gold Crowns
                  counted up with a fountain of coins and a rain of them (migration_v88 pays them), and on the Handpiece the
                  rank's two Legendary pieces for Timmy's place;
       8.5 s      "Collect 5,000 crowns" (the coin flies up as it closes).
     Skip jumps to the last frame (the reward stays), Esc closes. Each journey has its own sky and colors. ---------- */
  var DARK_LINE = ["The casing goes dark and the stars come out.", "A nebula drifts between the teeth.", "A constellation, seen through both lenses."];
  var DM_PAL = [["#C9B6F5", "#9B6BFF", "#7A3CFF", "#E9DDFF", "#7FA0FF"], ["#F5B6E3", "#E65AC8", "#8FB0FF", "#3F74FF", "#FFD3F1"], ["#9FF3E0", "#46DCBE", "#7F98FF", "#D5FFF6", "#5BC0FF"]];
  /* the Shiny Gold Crown coin (widget/hub-art/shop.js draws it for the shop; the same outline here) */
  var CROWN_D = "M6.2 17.4 C4.5 14.3 3.5 10.9 4.3 8.1 C4.9 5.9 6.5 4.4 8.4 4.5 C10 4.6 10.8 6.1 12 6.1 C13.2 6.1 14 4.6 15.6 4.5 C17.5 4.4 19.1 5.9 19.7 8.1 C20.5 10.9 19.5 14.3 17.8 17.4 Z";
  var COIN = '<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round"><path d="' + CROWN_D + '" fill="#F2C94C" stroke="#3B2E3A" stroke-width="1.4"/>' +
    '<path d="M15.7 5.3 C17.4 5.5 18.6 6.7 19 8.4 C19.6 11 18.8 14.2 17.4 16.8 L14.9 16.4 C16.6 12.6 17.1 8.8 15.7 5.3 Z" fill="#C9971C"/><path d="M12 6.4 V9.6 M9.4 9 Q12 10.5 14.6 9" fill="none" stroke="#9C7414" stroke-width="1"/>' +
    '<ellipse cx="12" cy="17.5" rx="5.8" ry="2.3" fill="#8A6410" stroke="#3B2E3A" stroke-width="1.4"/><path d="M7.4 18.3 Q12 20.3 16.6 18.3 Q12 21 7.4 18.3 Z" fill="#C9971C"/>' +
    '<path d="M6.3 9.4 C6.5 7.8 7.2 6.8 8.1 6.3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/><path d="M8.6 9.6 Q9 11.2 10.6 11.6 Q9 12 8.6 13.6 Q8.2 12 6.6 11.6 Q8.2 11.2 8.6 9.6 Z" fill="#fff"/></svg>';
  var HOUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>';
  /* what reaching it pays (sh_prizes()'s dark, which widget/v3.js's PRIZES copies) */
  function darkCrowns(){ var P = window.shGame && window.shGame.prizes; return P && P.dark > 0 ? P.dark : 5000; }
  function darkHTML(d){
    var j = Math.max(0, Math.min(2, d.journey | 0)), B = 4.3, pays = darkCrowns();
    function at(x){ return (B + x).toFixed(2) + "s"; }
    var cons = j === 2 ? '<path class="shj-const" d="M120 150 L210 110 L300 170 L390 128 L470 200 M300 170 L282 268 M560 96 L640 150 L700 120" fill="none" stroke="#9FF3E0" stroke-opacity=".55" stroke-width="1.2"/>' : "";
    var i = 0, title = "Dark Matter".split(" ").map(function(w){
      return '<span class="shj-nw">' + w.split("").map(function(c){ return '<span class="shj-lt" style="--i:' + (i++) + '">' + c + "</span>"; }).join("") + "</span>";
    }).join(" ");
    var line = fmt(floorOf(j, 6)) + " XP. " + DARK_LINE[j] + (d.position && d.of ? " You’re #" + fmt(d.position) + " of " + fmt(d.of) + " in the class." : "");
    return '<span class="shj-neb"></span><svg class="shj-sky" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cons + stars(11 + j * 6, 150, 800, 600) + "</svg>" +
      '<canvas class="shj-cv" aria-hidden="true"></canvas>' +
      '<span class="shj-flash" style="--at:' + at(0) + '"></span>' +
      '<div class="shj-in"><div class="shj-stage">' +
        '<span class="shj-rays" style="--at:' + at(.1) + '"></span><span class="shj-glow"></span><span class="shj-pull"></span>' +
        '<span class="shj-lens" style="--at:.9s"></span><span class="shj-lens" style="--at:1.2s"></span><span class="shj-lens" style="--at:1.5s"></span>' +
        '<span class="shj-wave" style="--at:' + at(0) + '"></span><span class="shj-wave is-c" style="--at:' + at(.12) + '"></span><span class="shj-wave is-t" style="--at:' + at(.3) + '"></span>' +
        '<span class="shj-was" aria-hidden="true">' + med(j, 5, 200, { animate: true, level: 3 }) + "</span>" +
        '<p class="shj-pre" aria-hidden="true">Something is pulling at the ' + esc(JN[j]) + "…</p>" +
        '<span class="shj-core"></span>' +
        '<span class="shj-is">' + med(j, 6, 240, { animate: true, level: 1 }) + "</span></div>" +
      '<p class="shj-eyebrow" data-at style="--at:' + at(1.15) + '"><span class="shj-nw">' + esc(JN[j]) + '</span> · <span class="shj-nw">rank 7 of 7</span></p>' +
      '<h2 class="shj-title shj-dmt" aria-label="Dark Matter" style="--at:' + at(1.25) + ";--sh:" + at(2.4) + '"><span class="shj-tglow"></span><span aria-hidden="true">' + title + '</span><span class="shj-sheen" aria-hidden="true">Dark Matter</span></h2>' +
      '<p class="shj-line" data-at style="--at:' + at(1.9) + '">' + esc(line) + "</p>" +
      '<div class="shj-loot" data-at style="--at:' + at(2.4) + ";--cn:" + at(2.6) + '">' +
        '<div class="shj-lrow"><span class="shj-coin">' + COIN + '</span><span class="shj-amt"><b class="shj-num" aria-hidden="true">+' + fmt(pays) + '</b><span class="shj-sr">' + fmt(pays) + " </span><small>Shiny Gold Crowns</small></span></div>" +
        (j === 0 ? '<div class="shj-lrow shj-lplace" data-at style="--at:' + at(3.3) + '"><span class="shj-hic">' + HOUSE + "</span><span><b>For Timmy’s place<span class=\"shj-tag\">2 Legendary</span></b>The Dark Matter cloak and the Dark Matter orb.</span></div>" : "") +
      "</div>" +
      '<button type="button" class="shj-go" data-shj="go" data-at style="--at:' + at(4.2) + '">' + COIN + "Collect " + fmt(pays) + " crowns</button></div>";
  }
  /* the moving light: dust pulled in, the disk, the burst, the ring around the new medallion, shooting stars and the coins,
     all on one canvas (hundreds of moving points as page elements would each be a layer). null without a canvas. */
  function cosmos(el, j){
    var cv = el.querySelector(".shj-cv"), g = cv && cv.getContext ? cv.getContext("2d") : null;
    if (!g) return null;
    var pal = DM_PAL[j], dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, ps = [], ems = [], raf = 0, last = 0, dead = false;
    var C = { x: 0, y: 0, r: 90 }, disk = null, crown = null;
    try { crown = new Path2D(CROWN_D); } catch (e) {}
    var stage = el.querySelector(".shj-stage");
    /* where the medallion is now: the stage moves (it rises into place, the screen shakes), and the light follows it */
    function at(){ var st = stage.getBoundingClientRect(), c = cv.getBoundingClientRect(); C.x = st.left + st.width / 2 - c.left; C.y = st.top + st.height / 2 - c.top; C.r = st.width * .36; }
    function fit(){ W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); at(); }
    fit(); window.addEventListener("resize", fit);
    function rnd(a, b){ return a + Math.random() * (b - a); }
    function pick(a){ return a[Math.random() * a.length | 0]; }
    function go(){ if (!raf && !dead) raf = requestAnimationFrame(tick); }
    function tick(now){
      raf = 0; if (dead) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      ems = ems.filter(function(e){ return e(dt) !== false; });
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      at();
      if (disk) drawDisk(dt);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i]; p.age += dt;
        var u = p.age / p.life;
        if (u >= 1) { ps.splice(i, 1); continue; }
        move(p, u, dt); draw(p, u);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      if (ps.length || ems.length || disk) go(); else last = 0;
    }
    function move(p, u, dt){
      if (p.t === "pull") {
        var k = Math.pow(u, 1.6), r = p.r1 + (p.r0 - p.r1) * (1 - k), th = p.th + p.spin * k;
        p.px = p.x; p.py = p.y; p.x = C.x + Math.cos(th) * r; p.y = C.y + Math.sin(th) * r;
        if (p.px == null) { p.px = p.x; p.py = p.y; }
        return;
      }
      var d = Math.pow(p.drag || 1, dt * 60);
      p.vx *= d; p.vy = p.vy * d + (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
    }
    function draw(p, u){
      var a = p.t === "pull" ? Math.min(1, u * 5) * (u > .92 ? (1 - u) / .08 : 1) : p.t === "coin" ? (u > .85 ? (1 - u) / .15 : 1) : p.t === "shoot" ? Math.sin(Math.PI * u) : 1 - u * u;
      g.globalAlpha = a * (p.al || 1);
      if (p.t === "coin") { coin(p); return; }
      g.globalCompositeOperation = "lighter";
      if (p.t === "pull" || p.t === "streak" || p.t === "shoot") {
        var tx, ty, tl = p.t === "shoot" ? .1 : .045;
        if (p.t === "pull") { tx = p.x + (p.px - p.x) * 5; ty = p.y + (p.py - p.y) * 5; } else { tx = p.x - p.vx * tl; ty = p.y - p.vy * tl; }
        g.strokeStyle = p.c; g.lineWidth = p.s; g.lineCap = "round"; g.beginPath(); g.moveTo(tx, ty); g.lineTo(p.x, p.y); g.stroke();
      } else if (p.t === "star") {
        var s = p.s * (1 - u * .6);
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.beginPath();
        g.moveTo(0, -s); g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s); g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s);
        g.fill(); g.restore();
      } else {
        g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, Math.max(.4, p.s * (1 - u * .5)), 0, 6.2832); g.fill();
        g.globalAlpha *= .25; g.beginPath(); g.arc(p.x, p.y, p.s * 3, 0, 6.2832); g.fill();
      }
    }
    function coin(p){
      g.globalCompositeOperation = "source-over";
      var sx = Math.cos(p.flip + p.age * p.vf), s = p.s / 24;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(s * (.3 + .7 * Math.abs(sx)), s); g.translate(-12, -12);
      if (crown) {
        g.fillStyle = sx > 0 ? "#F2C94C" : "#D9A21F"; g.fill(crown); g.lineWidth = 1.6; g.strokeStyle = "#3B2E3A"; g.stroke(crown);
        g.fillStyle = "#8A6410"; g.beginPath(); g.ellipse(12, 17.5, 5.8, 2.3, 0, 0, 6.2832); g.fill(); g.stroke();
      } else { g.fillStyle = "#F2C94C"; g.beginPath(); g.arc(12, 12, 9, 0, 6.2832); g.fill(); }
      g.restore();
    }
    function makeDisk(n, r0, r1, w, sq, tilt){
      var parts = [];
      for (var i = 0; i < n; i++) parts.push({ a: rnd(0, 6.2832), rr: rnd(r0, r1), s: rnd(.6, 2.2), c: pick(pal), al: rnd(.35, 1) });
      return { parts: parts, w: w, sq: sq, tilt: tilt, k: .5, kTo: 1, al: 0, alTo: 1, rate: 1, spd: 1 };
    }
    function drawDisk(dt){
      var D = disk, e = Math.min(1, dt * D.rate * 3);
      D.k += (D.kTo - D.k) * e; D.al += (D.alTo - D.al) * Math.min(1, dt * D.rate * 2);
      var ct = Math.cos(D.tilt), st = Math.sin(D.tilt), R = C.r * D.k;
      g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (var i = 0; i < D.parts.length; i++) {
        var q = D.parts[i], w = D.w / Math.pow(q.rr, 1.5) * D.spd; q.a += w * dt;
        var r = q.rr * R, a0 = q.a - Math.min(.6, w * .08);
        var x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r * D.sq, x1 = Math.cos(q.a) * r, y1 = Math.sin(q.a) * r * D.sq;
        g.globalAlpha = Math.min(1, D.al * q.al); g.strokeStyle = q.c; g.lineWidth = q.s;
        g.beginPath(); g.moveTo(C.x + x0 * ct - y0 * st, C.y + x0 * st + y0 * ct); g.lineTo(C.x + x1 * ct - y1 * st, C.y + x1 * st + y1 * ct); g.stroke();
      }
    }
    function centerOf(n){ var b = n.getBoundingClientRect(), c = cv.getBoundingClientRect(); return { x: b.left + b.width / 2 - c.left, y: b.top + b.height / 2 - c.top }; }
    return {
      /* the dust: thicker and thicker for `sec` seconds, every grain in before the collapse */
      pull: function(sec){
        var t = 0;
        ems.push(function(dt){
          t += dt; if (t > sec) return false;
          var n = (60 + 280 * (t / sec) * (t / sec)) * dt, left = sec + .3 - t;
          while (n > 0) {
            if (n < 1 && Math.random() > n) break; n--;
            ps.push({ t: "pull", th: rnd(0, 6.2832), r0: Math.max(W, H) * rnd(.45, .8), r1: C.r * .25, spin: rnd(1.4, 2.8), life: Math.max(.3, Math.min(rnd(.9, 1.6), left)), age: 0, s: rnd(.7, 2.2), c: pick(pal), al: rnd(.5, 1) });
          }
        });
        go();
      },
      disk: function(){ disk = makeDisk(150, 1.15, 2.2, 2.4, .3, -.2); go(); },
      collapse: function(){ if (disk) { disk.kTo = 0; disk.rate = 3; disk.spd = 4; disk.alTo = 1.4; } },
      dark: function(){ ps.length = 0; disk = null; },
      burst: function(){
        for (var i = 0; i < 300; i++) {
          var a = rnd(0, 6.2832), v = rnd(220, 1500), r = Math.random(), t = r < .55 ? "streak" : r < .85 ? "dot" : "star";
          ps.push({ t: t, x: C.x, y: C.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: t === "streak" ? .93 : .95, life: rnd(.9, 2.2), age: 0,
            s: t === "star" ? rnd(4, 9) : t === "dot" ? rnd(1, 3.2) : rnd(1.2, 3), rot: rnd(0, 3), vr: rnd(-4, 4), c: i % 6 ? pick(pal) : "#FFFFFF" });
        }
        go();
      },
      ring: function(){ disk = makeDisk(120, 1.2, 2.3, .8, .28, -.22); disk.k = .3; disk.alTo = .85; go(); },
      shoot: function(){
        var left = Math.random() < .5, a = rnd(.25, .55), v = rnd(800, 1100);
        ps.push({ t: "shoot", x: left ? rnd(-40, W * .4) : rnd(W * .6, W + 40), y: rnd(-20, H * .3), vx: (left ? 1 : -1) * Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(.7, 1), age: 0, s: 1.6, c: "#FFFFFF", al: .9 });
        go();
      },
      coins: function(from, n, up){
        var o = centerOf(from);
        for (var i = 0; i < n; i++) ps.push({ t: "coin", x: o.x, y: o.y, vx: rnd(-1, 1) * (up ? 140 : 380), vy: up ? rnd(-1900, -1400) : rnd(-1150, -560), g: up ? 0 : 1500, drag: .995,
          life: up ? rnd(.5, .7) : rnd(1.6, 2.4), age: 0, s: rnd(18, 30), rot: rnd(-.4, .4), vr: rnd(-3, 3), flip: rnd(0, 6.28), vf: rnd(4, 9) });
        go();
      },
      /* crowns falling from the top of the screen, all across it */
      rain: function(n){
        for (var i = 0; i < n; i++) ps.push({ t: "coin", x: rnd(0, W), y: rnd(-260, -30), vx: rnd(-40, 40), vy: rnd(80, 260), g: 900, drag: .99,
          life: rnd(1.8, 2.8), age: 0, s: rnd(16, 28), rot: rnd(-.5, .5), vr: rnd(-2, 2), flip: rnd(0, 6.28), vf: rnd(3, 8) });
        go();
      },
      stop: function(){ dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; window.removeEventListener("resize", fit); }
    };
  }
  function dark(d, done, opt){
    d = d || {}; opt = opt || {};
    var j = Math.max(0, Math.min(2, d.journey | 0));
    function run(){
      var B = 4.3, pays = darkCrowns(), el = shell("shj-dark shj-d" + j, "Dark Matter unlocked", darkHTML(d));
      var timers = [], fx = null, settled = false, ticket = 0, collecting = false;
      var num = el.querySelector(".shj-num"), coinEl = el.querySelector(".shj-coin");
      el.style.setProperty("--bang", B + "s");
      function at(sec, f){ timers.push(setTimeout(f, sec * 1000)); }
      function stopAll(){ timers.forEach(clearTimeout); timers = []; ticket++; if (fx) { fx.stop(); fx = null; } }
      function count(ms){
        var mine = ++ticket, t0 = 0;
        (function f(now){
          if (mine !== ticket) return;
          if (!t0) t0 = now;
          var u = Math.min(1, (now - t0) / ms);
          num.textContent = "+" + fmt(Math.round(pays * (1 - Math.pow(1 - u, 3))));
          if (u < 1) requestAnimationFrame(f);
        })(performance.now());
      }
      open(el, { still: opt.still, focusAt: 8600, peakAt: B * 1000, detail: { kind: "dark", journey: j },
        /* Skip: straight to the last frame, so the reward is still seen; once it's there, Skip closes */
        skip: function(){
          if (settled) return false;
          settled = true; stopAll(); el.classList.add("is-still"); num.textContent = "+" + fmt(pays);
          var sk = el.querySelector(".shj-skip"); if (sk) sk.remove();
          try { el.querySelector(".shj-go").focus({ preventScroll: true }); } catch (e) {}
          return true;
        },
        go: function(close){
          if (collecting) return; collecting = true;
          if (!fx || el.classList.contains("is-still")) { close(); return; }
          el.classList.add("is-collect"); fx.coins(coinEl, 14, true); setTimeout(close, 520);
        },
        end: stopAll }, done);
      if (el.classList.contains("is-still")) return;   // reduced motion: the last frame, faded in
      var st = el.querySelector(".shj-stage").getBoundingClientRect();
      el.style.setProperty("--dy", Math.round(innerHeight / 2 - (st.top + st.height / 2)) + "px");
      fx = cosmos(el, j);
      num.textContent = "+0";
      if (fx) {
        at(.6, function(){ fx.pull(2.6); });
        at(1, function(){ fx.disk(); });
        at(3.3, function(){ fx.collapse(); });
        at(B - .55, function(){ fx.dark(); });
        at(B, function(){ fx.burst(); });
        at(B + .35, function(){ fx.ring(); });
        [1.6, 4.4, 7.1, 9.9, 13.2, 16.4].forEach(function(x){ at(B + x, function(){ fx.shoot(); }); });
        at(B + 2.7, function(){ fx.coins(coinEl, 26); fx.rain(40); });
        at(B + 4.1, function(){ fx.coins(coinEl, 16); });
      }
      at(B + 2.7, function(){ count(1400); });
      at(B + 4.2, function(){ settled = true; });
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
