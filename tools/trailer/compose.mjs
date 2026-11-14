/* The trailer's drawn layer: the studio, Timmy talking, the captions, the frame around the footage and the end card,
   rendered one frame at a time to out/overlay/f00000.png (1920 x 1080, see-through where the footage shows).

     node tools/trailer/compose.mjs                 every frame (after audio.py; about 5 minutes on 4 cores)
     node tools/trailer/compose.mjs --at 3.2,14,61  only these seconds, to out/stills/ (to look at while drawing)
     node tools/trailer/compose.mjs --from 0 --to 13   a stretch of it

   One page, no clocks: draw(t) sets every moving part from the time alone (out/timeline.json: when each caption is
   spoken, when each shot is on, how loud Timmy is on each frame), so a frame is the same however often it is rendered
   and the picture can't drift from the voice. cut.mjs lays the frames over the footage.

   What is on screen when:
   - the "studio" and "close" shots: the studio fills the frame. It opens close on Timmy and pulls back.
   - the feature shots: the footage plays in a framed screen; the studio shrinks to a round "booth cam" at the bottom
     left (the same drawing, so he keeps talking), with the caption beside it.
   - after his last word: the on-air lamp goes off, then the end card. */
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { studio, mouth, FACE, STYLE } from "./studio.mjs";
import { ICONS } from "../figures/site/icons.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(here, "out");
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = createRequire("/opt/")("playwright"); }

const TL = JSON.parse(fs.readFileSync(path.join(out, "timeline.json"), "utf8"));
/* the screen the footage plays in (cut.mjs puts the clips exactly here) and the booth cam */
export const SCREEN = { x: 160, y: 26, w: 1600, h: 900 };
const CAM = { x: 232, y: 1003, r: 62 };
const HOLE = ((x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`)(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 22);
const arg = (k) => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };

const font = pathToFileURL(path.join(root, "assets/fonts/nunito-sans-normal.woff2")).href;
const css = `
@font-face { font-family: "Nunito Sans"; src: url("${font}") format("woff2"); font-weight: 200 1000; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1920px; height: 1080px; overflow: hidden; background: transparent; font-family: "Nunito Sans", sans-serif; }
.sp-tint { fill: ${STYLE.RED}; } .sp-tint-line { stroke: ${STYLE.RED}; }
/* the feature shots' frame: a see-through screen in a dark booth wall */
#frame { position: absolute; inset: 0; }
#wallbg { position: absolute; inset: 0; background: #221a36; clip-path: path(evenodd, "M0 0 H1920 V1080 H0 Z ${HOLE}"); }
#ring { position: absolute; left: ${SCREEN.x - 7}px; top: ${SCREEN.y - 7}px; width: ${SCREEN.w + 14}px; height: ${SCREEN.h + 14}px; border-radius: 28px; border: 7px solid ${STYLE.INK};
  box-shadow: 0 0 0 5px #8A76D6, 0 0 0 10px ${STYLE.INK}, 0 18px 0 6px rgba(0,0,0,.28); }
#tiles { position: absolute; inset: 0; opacity: .55; }
#camring { position: absolute; left: ${CAM.x - CAM.r - 9}px; top: ${CAM.y - CAM.r - 9}px; width: ${CAM.r * 2 + 18}px; height: ${CAM.r * 2 + 18}px; border-radius: 50%;
  border: 7px solid ${STYLE.INK}; box-shadow: 0 0 0 5px #FFD95A, 0 0 0 10px ${STYLE.INK}; }
#live { position: absolute; left: ${CAM.x + 28}px; top: ${CAM.y + 40}px; width: 26px; height: 26px; border-radius: 50%; background: #FF5A5F; border: 6px solid ${STYLE.INK}; }
/* the studio: one drawing, moved by its camera and cut to a circle when it is the booth cam */
#studio { position: absolute; inset: 0; overflow: hidden; background: ${STYLE.WALL}; }
#studio svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
#cam { transform-origin: 0 0; }
#vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(24,12,40,.42) 100%); }
/* captions: the line being spoken, word for word */
.cap { position: absolute; color: #fff; font-weight: 800; letter-spacing: .1px; text-wrap: balance; }
#capS { left: 210px; right: 210px; bottom: 58px; display: flex; justify-content: center; }
#capS span { font-size: 50px; line-height: 1.22; text-align: center; padding: 16px 38px 18px; border-radius: 26px; background: rgba(30,20,48,.86); border: 5px solid ${STYLE.INK}; max-width: 1500px; }
#capF { left: ${CAM.x + CAM.r + 44}px; top: ${SCREEN.y + SCREEN.h + 22}px; width: ${SCREEN.x + SCREEN.w - (CAM.x + CAM.r + 44)}px; height: ${1080 - (SCREEN.y + SCREEN.h + 22) - 16}px; display: flex; align-items: center; }
#capF span { font-size: 43px; line-height: 1.2; }
/* the end card */
#end { position: absolute; inset: 0; background: #221a36; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; color: #fff; }
#end .mark { width: 150px; height: 150px; border-radius: 36px; background: ${STYLE.INK}; border: 6px solid #fff; display: grid; place-items: center; color: #fff; }
#end h1 { font-size: 112px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; }
#end p { font-size: 46px; font-weight: 700; color: #FFD95A; }
#end small { font-size: 38px; font-weight: 600; color: #cfc6e6; }
#black { position: absolute; inset: 0; background: #000; }
`;

/* a quiet field of foam tiles behind the screen, the booth's wall in the dark */
function tiles(){
  let s = "";
  for (let r = 0; r < 9; r++) for (let c = 0; c < 15; c++) s += `<rect x="${c * 128 + 4}" y="${r * 128 - 36}" width="120" height="120" rx="10" fill="${(r + c) % 2 ? "#2a2142" : "#261d3c"}" stroke="#18112a" stroke-width="3"/>`;
  return `<svg id="tiles" viewBox="0 0 1920 1080" width="1920" height="1080">${s}</svg>`;
}

const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<div id="frame"><div id="wallbg">${tiles()}</div><div id="ring"></div><div id="capF" class="cap"><span></span></div></div>
<div id="studio"><svg viewBox="0 0 1920 1080"><g id="cam">${studio()}</g></svg><div id="vig"></div></div>
<div id="camring"></div><div id="live"></div>
<div id="capS" class="cap"><span></span></div>
<div id="end"><div class="mark"><svg viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${ICONS.tooth.body}</svg></div>
  <h1>Study Hubs</h1><p>Rebuilt. Live now.</p><small>smcmurry6-source.github.io/study-hubs</small></div>
<div id="black"></div>`;

/* runs in the page: everything that moves, from the time alone */
function pageSetup(TL, FACE, CAM, INK, mouthSrc){
  var mouthAt = eval("(" + mouthSrc + ")");
  var $ = function(s){ return document.querySelector(s); }, all = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var clamp = function(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }, ease = function(x){ x = clamp(x); return x * x * (3 - 2 * x); }, lerp = function(a, b, k){ return a + (b - a) * k; };
  var shot = function(id){ return TL.shots.filter(function(s){ return s.id === id; })[0]; };
  var first = TL.shots[1].t0, close = shot("close").t0, lastWord = TL.cues[TL.cues.length - 1].t1;
  var lampOff = lastWord + 0.55, endAt = lastWord + 1.25;
  /* camera states: [scale, the scene point it looks at, where that point sits on screen] */
  var TIGHT = [2.25, FACE.x, FACE.y, 960, 500], WIDE = [1, 960, 540, 960, 540], BOOTH = [0.3, FACE.x, FACE.y - 26, CAM.x, CAM.y],
    FACED = [1, FACE.x, FACE.y - 26, FACE.x, FACE.y - 26], IRIS = CAM.r / 0.3;   // the wide view again, said from his face; the iris's size in the scene
  var mix = function(a, b, k){ return a.map(function(v, i){ return lerp(v, b[i], k); }); };
  /* blinks: about every three seconds, two frames shut */
  var blinks = []; for (var b = 1.4; b < TL.dur; b += 2.3 + ((b * 7.3) % 1.9)) blinks.push(b);
  /* a small gesture as he says "This is a trailer" and at the sign-off */
  var waves = [TL.cues[1].t0 + 0.1, TL.cues[TL.cues.length - 1].t0 + 0.9];
  var eyes = all("#cam .shpet-eye"), segs = all("#cam .tm-seg"), mouths = all("#cam .tm-mouth");
  eyes.forEach(function(e){ e.style.transformBox = "fill-box"; e.style.transformOrigin = "50% 55%"; });
  var arm = $("#cam .tm-arm-r"); arm.style.transformBox = "fill-box"; arm.style.transformOrigin = "0% 20%";
  var tim = $("#cam .tm-timmy"); tim.style.transformBox = "fill-box"; tim.style.transformOrigin = "50% 100%";

  window.draw = function(t){
    var f = Math.min(TL.mouth.length - 1, Math.max(0, Math.round(t * TL.fps))), m = TL.mouth[f], m3 = (TL.mouth[Math.max(0, f - 1)] + m + TL.mouth[Math.min(TL.mouth.length - 1, f + 1)]) / 3;
    /* where the studio is: full frame (k 0), the booth cam (k 1), or on its way. On the way it irises in on Timmy
       first (the circle closes, the camera holds), then the circle and the camera travel to the corner together, so
       the frame never shows past the edge of the drawing. */
    var k = clamp((t - first + 0.16) / 0.72) - clamp((t - close + 0.4) / 0.72);
    var a = ease(k / 0.55), b = ease((k - 0.55) / 0.45);
    var pull = ease((t - 2.6) / 7.5), push = ease((t - close - 1) / 6);
    var base = t > close ? mix(WIDE, [1.12, 960, 560, 960, 540], push) : mix(TIGHT, WIDE, pull);
    var c = b > 0 ? mix(FACED, BOOTH, b) : base;
    $("#cam").style.transform = "translate(" + (c[3] - c[0] * c[1]).toFixed(2) + "px," + (c[4] - c[0] * c[2]).toFixed(2) + "px) scale(" + c[0].toFixed(4) + ")";
    var r = b > 0 ? IRIS * c[0] : lerp(1150, IRIS, a), cx = b > 0 ? c[3] : lerp(960, FACED[3], a), cy = b > 0 ? c[4] : lerp(540, FACED[4], a);
    $("#studio").style.clipPath = k > 0.001 ? "circle(" + r.toFixed(1) + "px at " + cx.toFixed(1) + "px " + cy.toFixed(1) + "px)" : "none";
    $("#vig").style.opacity = 1 - k;
    $("#camring").style.opacity = $("#live").style.opacity = k > 0.985 ? 1 : 0;
    $("#live").style.transform = "scale(" + (0.82 + 0.18 * Math.abs(Math.sin(t * 2.4))).toFixed(3) + ")";

    /* Timmy: his mouth from his voice, a bob with it, blinks, the gesture */
    var open = m < 0.09 ? 0 : 0.18 + 0.82 * m, wob = Math.sin(t * 23.7) * 0.6 + Math.sin(t * 9.1) * 0.4, html = mouthAt(open, wob, INK);
    mouths.forEach(function(g){ g.innerHTML = html; });
    tim.style.transform = "translateY(" + (Math.sin(t * 2.1) * 1.1 - m3 * 1.6).toFixed(2) + "px) rotate(" + (Math.sin(t * 1.3) * 0.9).toFixed(2) + "deg)";
    var shut = blinks.some(function(b){ return t >= b && t < b + 0.1; });
    eyes.forEach(function(e){ e.style.transform = shut ? "scaleY(0.12)" : "none"; });
    var w = 0; waves.forEach(function(w0){ var x = (t - w0) / 1.5; if (x > 0 && x < 1) w = Math.sin(x * Math.PI) * (0.75 + 0.25 * Math.sin(x * Math.PI * 5)); });
    arm.style.transform = "rotate(" + (-w * 58).toFixed(1) + "deg)";

    /* the booth: the lamp comes on with a flicker and goes off after the sign-off; the meters follow his voice */
    var on = t > 0.55 && t < lampOff ? 1 : 0; if (t > 0.55 && t < 0.95) on = Math.sin(t * 70) > -0.2 ? 1 : 0.15;
    $("#cam .tm-lamp-on").style.opacity = on;
    $("#cam .tm-glow").style.opacity = on * (0.75 + 0.25 * Math.sin(t * 3.1));
    segs.forEach(function(s){ var lvl = (s.getAttribute("data-m") === "0" ? m : m3 * 0.9) * 8.4 + (on ? 0.6 : 0); s.style.opacity = +s.getAttribute("data-i") < lvl ? 1 : 0.22; });
    all("#cam .tm-steam").forEach(function(s){ s.style.transform = "translate(" + (Math.sin(t * 1.7) * 3).toFixed(1) + "px," + (-((t * 9) % 14)).toFixed(1) + "px)"; s.style.opacity = 1 - ((t * 9) % 14) / 14 * 0.7; });
    all("#cam .tm-cloud").forEach(function(s, i){ s.style.transform = "translateX(" + ((t * (i ? 5 : 8)) % 60 - 20).toFixed(1) + "px)"; });

    /* the caption: the line being spoken, from just before its first word until the next line (or a beat after) */
    var cue = null; TL.cues.forEach(function(q, i){ var nx = TL.cues[i + 1], until = Math.min(q.t1 + 0.45, nx ? nx.t0 - 0.08 : q.t1 + 0.45); if (t >= q.t0 - 0.08 && t < until) cue = q; });
    var inBooth = k > 0.5, a = cue ? clamp((t - (cue.t0 - 0.08)) / 0.14) : 0;
    [["#capS", !inBooth], ["#capF", inBooth]].forEach(function(p){
      var el = $(p[0]), sp = el.firstElementChild, show = cue && p[1];
      el.style.opacity = show ? a : 0; el.style.transform = "translateY(" + ((1 - a) * 14).toFixed(1) + "px)";
      if (show && sp.textContent !== cue.shown) sp.textContent = cue.shown;
    });

    /* the end card, then out */
    $("#end").style.opacity = ease((t - endAt) / 0.45);
    $("#black").style.opacity = Math.max(1 - ease(t / 0.5), ease((t - (TL.dur - 0.5)) / 0.45));
  };
}

async function main(){
  const at = arg("--at"), from = +(arg("--from") || 0), to = +(arg("--to") || TL.dur);
  const dir = path.join(out, at ? "stills" : "overlay");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(out, "compose.html");
  fs.writeFileSync(file, html);
  const frames = at ? at.split(",").map(Number).map((t) => ({ t, name: "t" + t.toFixed(2).replace(".", "_") + ".png" }))
    : Array.from({ length: Math.ceil(TL.dur * TL.fps) }, (_, i) => ({ t: i / TL.fps, name: "f" + String(i).padStart(5, "0") + ".png" })).filter((f) => f.t >= from && f.t < to);
  const browser = await pw.chromium.launch();
  const workers = at ? 1 : Math.max(1, Math.min(6, os.cpus().length));
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => { console.error("page error:", e.message); process.exitCode = 1; });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(`(${pageSetup.toString()})(${JSON.stringify(TL)}, ${JSON.stringify(FACE)}, ${JSON.stringify(CAM)}, ${JSON.stringify(STYLE.INK)}, ${JSON.stringify(mouth.toString())})`);
    while (next < frames.length) {
      const f = frames[next++];
      await page.evaluate((t) => window.draw(t), f.t);
      await page.screenshot({ path: path.join(dir, f.name), omitBackground: true });
      if (++done % 150 === 0) console.error(`  ${done} / ${frames.length} frames`);
    }
    await page.close();
  }));
  await browser.close();
  console.error(`${frames.length} frames -> ${dir}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
