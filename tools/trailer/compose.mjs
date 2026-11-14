/* The trailer's picture: every frame drawn in one page and saved to out/frames/f00000.jpg (1920 x 1080).

     node tools/trailer/compose.mjs                 every frame (after audio.py and record.mjs; about 8 minutes on 4 cores)
     node tools/trailer/compose.mjs --at 3.2,14,61  only these seconds, to out/stills/ (to look at while drawing)
     node tools/trailer/compose.mjs --from 0 --to 13   a stretch of it

   One page, no clocks: draw(t) sets every moving part from the time alone (out/timeline.json: when each caption is
   spoken, when each shot is on, how loud Timmy is on each frame; out/footage/<shot>.cam.json: where the camera looks),
   so a frame is the same however often it is rendered and the picture can't drift from the voice. cut.mjs adds the sound.

   What is on screen when:
   - the cold open: black, the ON AIR lamp flickers on in the dark, the camera drops to Timmy as the lights come up,
     then pulls back through the studio while he talks. Letterboxed, the wall soft behind him.
   - the title card ("Rebuilt.") on the music's first hit.
   - the feature shots: a chapter card wipes across, then the recorded page plays on a screen the camera pushes in on
     (record.mjs's K.cam), with Timmy talking in a round booth cam and his line beside him.
   - the sign-off back in the studio; the lamp goes off; the end card on the last chord. */
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { studio, timmy, mouth, FACE, DOWN, STYLE } from "./studio.mjs";
import { CHAPTERS } from "./shots.mjs";
import { ICONS } from "../figures/site/icons.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(here, "out");
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = createRequire("/opt/")("playwright"); }

const TL = JSON.parse(fs.readFileSync(path.join(out, "timeline.json"), "utf8"));
const arg = (k) => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const BAR = 132;                                   // the letterbox bars in the studio (2.39 : 1)
const PIP = { x: 150, y: 944, r: 94 };             // Timmy's booth cam over the feature shots
const FOOT = { w: 1280, h: 720, k: 2 };            // the recorded window, and how many frame pixels per window pixel
const AY = 452;                                    // where on the frame the camera puts what it looks at (above the caption)

/* the camera's moves for each feature shot, from record.mjs (none yet: the screen stays empty) */
const CAMS = {};
for (const s of TL.shots) {
  const f = path.join(out, "footage", s.id + ".cam.json");
  if (fs.existsSync(f)) CAMS[s.id] = JSON.parse(fs.readFileSync(f, "utf8"));
}

const font = pathToFileURL(path.join(root, "assets/fonts/nunito-sans-normal.woff2")).href;
const PLUM = "#1b1330", GOLD = "#FFD95A";
const css = `
@font-face { font-family: "Nunito Sans"; src: url("${font}") format("woff2"); font-weight: 200 1000; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; font-family: "Nunito Sans", sans-serif; }
.sp-tint { fill: ${STYLE.RED}; } .sp-tint-line { stroke: ${STYLE.RED}; }
.full { position: absolute; inset: 0; overflow: hidden; }
.tiles { position: absolute; inset: 0; }
/* the feature shots: a dark stage, the recorded screen on it, a scrim under the caption */
#stage { background: radial-gradient(ellipse at 50% 38%, #3b2a6b 0%, #251a45 45%, ${PLUM} 100%); }
#stage .tiles { opacity: .28; }
#tintglow { position: absolute; left: 260px; top: 60px; width: 1400px; height: 900px; border-radius: 50%; filter: blur(120px); opacity: .22; }
#persp { position: absolute; inset: 0; perspective: 2600px; perspective-origin: 960px 470px; }
#scr { position: absolute; left: 0; top: 0; width: ${FOOT.w * FOOT.k}px; height: ${FOOT.h * FOOT.k}px; transform-origin: 0 0; border-radius: 26px; overflow: hidden; background: #fff;
  box-shadow: 0 0 0 7px ${STYLE.INK}, 0 0 0 11px rgba(255,255,255,.16), 0 70px 150px 20px rgba(6,2,18,.62); }
#foot { display: block; width: 100%; height: 100%; }
#scrim { position: absolute; left: 0; right: 0; bottom: 0; height: 380px; background: linear-gradient(to top, rgba(22,14,40,.98) 0, rgba(22,14,40,.97) 215px, rgba(22,14,40,.7) 270px, rgba(22,14,40,0) 100%); }
/* the studio: one drawing, moved by its camera and cut to a circle when it is the booth cam */
#studio { background: ${STYLE.WALL}; }
#studio svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
#cam { transform-origin: 0 0; }
#vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 48%, rgba(14,6,28,.6) 100%); }
#pipring { position: absolute; left: ${PIP.x - PIP.r - 10}px; top: ${PIP.y - PIP.r - 10}px; width: ${PIP.r * 2 + 20}px; height: ${PIP.r * 2 + 20}px; border-radius: 50%;
  border: 8px solid ${STYLE.INK}; box-shadow: 0 0 0 6px ${GOLD}, 0 0 0 12px ${STYLE.INK}, 0 14px 40px 8px rgba(6,2,18,.55); }
#live { position: absolute; left: ${PIP.x + 50}px; top: ${PIP.y + 56}px; width: 34px; height: 34px; border-radius: 50%; background: #FF5A5F; border: 7px solid ${STYLE.INK}; }
.bar { position: absolute; left: 0; right: 0; height: ${BAR}px; background: #000; }
#barT { top: 0; transform-origin: 50% 0; } #barB { bottom: 0; transform-origin: 50% 100%; }
/* the caption: the line being spoken, word for word */
#cap { position: absolute; display: flex; align-items: center; color: #fff; font-weight: 800; letter-spacing: .1px; text-wrap: balance; }
#cap span { text-shadow: 0 3px 14px rgba(8,3,20,.75); }
#cap.s { left: 160px; right: 160px; bottom: 0; height: ${BAR}px; justify-content: center; text-align: center; }
#cap.s span { font-size: 50px; line-height: 1.2; }
#cap.f { left: ${PIP.x + PIP.r + 46}px; right: 110px; top: ${PIP.y - 88}px; height: 176px; }
#cap.f span { font-size: 47px; line-height: 1.2; }
/* the title card and the end card */
.card { background: radial-gradient(ellipse at 50% 46%, #45307f 0%, #2a1d50 42%, ${PLUM} 100%); color: #fff; }
.card .tiles { opacity: .3; }
.cw { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
#title .kick { font-size: 46px; font-weight: 900; color: ${GOLD}; text-transform: uppercase; margin-bottom: 6px; }
#title .big { font-size: 330px; font-weight: 1000; line-height: 1.02; letter-spacing: -8px; overflow: hidden; padding: 0 30px 14px; white-space: nowrap; text-shadow: 0 12px 0 rgba(8,3,20,.45); }
#title .big span, #end h1 span { display: inline-block; }
#title .ul { height: 26px; width: 1180px; border-radius: 13px; background: ${GOLD}; transform-origin: 0 50%; margin-top: 4px; }
#end .mark { width: 170px; height: 170px; border-radius: 42px; background: ${STYLE.INK}; border: 7px solid #fff; display: grid; place-items: center; box-shadow: 0 14px 0 rgba(8,3,20,.4); }
#end h1 { font-size: 176px; font-weight: 1000; letter-spacing: -4px; line-height: 1.05; margin-top: 30px; overflow: hidden; padding: 0 20px 8px; white-space: nowrap; text-shadow: 0 9px 0 rgba(8,3,20,.45); }
#end p { font-size: 58px; font-weight: 800; color: ${GOLD}; margin-top: 4px; }
#end .url { font-size: 40px; font-weight: 700; margin-top: 44px; padding: 16px 40px 18px; border-radius: 50px; background: rgba(255,255,255,.1); border: 3px solid rgba(255,255,255,.3); }
#endtim { position: absolute; right: 30px; bottom: -105px; width: 400px; height: 524px; overflow: visible; transform-origin: 50% 100%; }
.conf { position: absolute; inset: 0; }
.conf i { position: absolute; left: 0; top: 0; display: block; border: 5px solid ${STYLE.INK}; }
/* the chapter card: two slanted panels and a name */
#sting .pn { position: absolute; top: -10%; height: 120%; left: -25%; width: 150%; }
#sting .ink { background: ${STYLE.INK}; }
#sting .lab { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${STYLE.INK}; }
#sting .n { font-size: 50px; font-weight: 900; padding: 4px 30px 6px; border-radius: 40px; background: ${STYLE.INK}; margin-bottom: 14px; letter-spacing: 2px; }
#sting .nm { font-weight: 1000; text-transform: uppercase; letter-spacing: -3px; line-height: .98; text-align: center; white-space: pre; }
#flash { background: #fff; } #black { background: #000; }
`;

/* a field of foam tiles, the booth's wall in the dark, behind the cards and the screen */
function tiles(){
  let s = "";
  for (let r = 0; r < 9; r++) for (let c = 0; c < 15; c++) s += `<rect x="${c * 128 + 4}" y="${r * 128 - 36}" width="120" height="120" rx="12" fill="${(r + c) % 2 ? "#3a2c68" : "#33265e"}" stroke="#160d2c" stroke-width="3"/>`;
  return `<svg class="tiles" viewBox="0 0 1920 1080" width="1920" height="1080">${s}</svg>`;
}
const letters = (w) => w.split("").map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("");
const mark = (px) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${ICONS.tooth.body}</svg>`;

const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<div id="stage" class="full">${tiles()}<div id="tintglow"></div><div id="persp"><div id="scr"><img id="foot" alt=""></div></div><div id="scrim"></div></div>
<div id="studio" class="full"><svg viewBox="0 0 1920 1080"><g id="cam">${studio()}</g></svg><div id="vig"></div></div>
<div id="pipring"></div><div id="live"></div>
<div id="barT" class="bar"></div><div id="barB" class="bar"></div>
<div id="cap"><span></span></div>
<div id="title" class="full card">${tiles()}<div class="conf"></div><div class="cw"><div class="kick">Study Hubs</div><div class="big">${letters("Rebuilt.")}</div><div class="ul"></div></div></div>
<div id="end" class="full card">${tiles()}<div class="conf"></div><svg id="endtim" viewBox="0 -30 200 262">${timmy("b")}</svg>
  <div class="cw"><div class="mark">${mark(110)}</div><h1>${letters("Study Hubs")}</h1><p>Rebuilt. Live now.</p><div class="url">smcmurry6-source.github.io/study-hubs</div></div></div>
<div id="sting" class="full"><div class="pn ink"></div><div class="pn tint"></div><div class="lab"><span class="n"></span><span class="nm"></span></div></div>
<div id="flash" class="full"></div><div id="black" class="full"></div>`;

/* runs in the page: everything that moves, from the time alone */
function pageSetup(TL, CAMS, CH, G){
  var mouthAt = eval("(" + G.mouth + ")"), FACE = G.FACE, PIP = G.PIP, INK = G.INK, AY = G.AY, W = 1920, H = 1080;
  var $ = function(s){ return document.querySelector(s); }, all = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var clamp = function(x, a, b){ a = a == null ? 0 : a; b = b == null ? 1 : b; return x < a ? a : x > b ? b : x; }, lerp = function(a, b, k){ return a + (b - a) * k; };
  var io = function(x){ x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }, eout = function(x){ x = clamp(x); return 1 - Math.pow(1 - x, 3); }, ein = function(x){ x = clamp(x); return x * x * x; };
  var back = function(x){ x = clamp(x); var c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var mix = function(a, b, k){ return a.map(function(v, i){ return lerp(v, b[i], k); }); };
  var rnd = function(i, j){ var x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
  var shot = function(id){ return TL.shots.filter(function(s){ return s.id === id; })[0]; };
  var feats = TL.shots.filter(function(s){ return s.id !== "studio" && s.id !== "close"; });
  var T0 = TL.title.t0, T1 = TL.title.t1, close = shot("close").t0, lastWord = TL.cues[TL.cues.length - 1].t1, END = TL.endCard;

  /* the studio camera's states: [scale, the scene point it looks at, where that point sits on the frame] */
  var LAMP = [1.9, 960, G.lampY, 960, 520], TIGHT = [2.25, FACE.x, FACE.y, 960, 512], WIDE = [1, 960, 540, 960, 540], CLOSE = [1.13, 960, 580, 960, 540];
  var IRIS = 212, BOOTH = [PIP.r / IRIS, FACE.x, FACE.y - 26, PIP.x, PIP.y];
  var blinks = []; for (var b = 4.3; b < TL.dur; b += 2.3 + ((b * 7.3) % 1.9)) blinks.push(b);
  var waves = [TL.cues[1].t0 + 0.1, TL.cues[TL.cues.length - 1].t0 + 0.9];
  var eyes = all("#cam .shpet-eye, #endtim .shpet-eye"), segs = all("#cam .tm-seg"), mouths = all("#cam .tm-mouth"), motes = all("#cam .tm-mote");
  eyes.forEach(function(e){ e.style.transformBox = "fill-box"; e.style.transformOrigin = "50% 55%"; });
  var arms = all("#cam .tm-arm-r, #endtim .tm-arm-r"); arms.forEach(function(a){ a.style.transformBox = "fill-box"; a.style.transformOrigin = "0% 20%"; });
  var tim = $("#cam .tm-timmy"); tim.style.transformBox = "fill-box"; tim.style.transformOrigin = "50% 100%";
  var backs = all("#cam .st-back, #cam .st-lamp");

  /* confetti for the two cards: ink-lined bits in the site's colors, thrown from the middle */
  var COL = ["#FFD95A", "#F7A3BA", "#8FD0F2", "#9BE3B8", "#FFB86B", "#FFFDF6", "#E5484D", "#8A76D6"];
  all(".conf").forEach(function(box, bi){
    for (var i = 0; i < 54; i++) { var e = document.createElement("i"), s = 16 + rnd(i, bi) * 26, kind = i % 3; e.style.width = s + "px"; e.style.height = (kind === 1 ? s * 0.45 : s) + "px"; e.style.borderRadius = kind === 0 ? "50%" : "5px"; e.style.background = COL[(i + bi) % COL.length]; box.appendChild(e); }
  });
  function confetti(box, u, bi){
    var kids = box.children, f = 1 - Math.exp(-3.2 * u);
    for (var i = 0; i < kids.length; i++) {
      var a = rnd(i, bi + 7) * Math.PI * 2, v = 520 + rnd(i, bi + 3) * 900, x = 960 + Math.cos(a) * v * f * 1.25, y = 520 + Math.sin(a) * v * f * 0.8 + 260 * u * u;
      kids[i].style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + ((rnd(i, bi) - 0.5) * 900 * f).toFixed(0) + "deg)";
      kids[i].style.opacity = u <= 0 ? 0 : clamp(1.6 - u * 0.75);
    }
  }
  function rise(spans, u, start, step){ spans.forEach(function(s, i){ var k = back((u - start - i * step) / 0.34); s.style.transform = "translateY(" + ((1 - k) * 118).toFixed(1) + "%)"; }); }
  var tBig = all("#title .big span"), eBig = all("#end h1 span");

  /* the screen's camera: [x, y of the window point it looks at, zoom (frame px per window px), tilt, where on the frame] */
  var FLOAT = [G.FOOT.w / 2, G.FOOT.h / 2, 1.12, 1, 436];
  function aim(ev){
    if (ev.float || !ev.box) return FLOAT;
    var b = ev.box, Z = clamp(Math.min(W * 0.84 / b[2], 800 * 0.84 / b[3]), 1.5, ev.max || 2.3);
    var cy = b[3] * Z > 800 ? b[1] + (AY - 34) / Z : b[1] + b[3] / 2;       // too tall to fit: keep its top in view
    return [clamp(b[0] + b[2] / 2, W / 2 / Z, G.FOOT.w - W / 2 / Z), clamp(cy, AY / Z, G.FOOT.h - (G.LOW - AY) / Z), Z, 0, AY];   // the page never goes under the caption
  }
  Object.keys(CAMS).forEach(function(id){ CAMS[id].cams.forEach(function(ev){ ev.s = aim(ev); }); });
  function screenCam(id, tc){
    var evs = (CAMS[id] || { cams: [] }).cams, s = FLOAT, since = tc;
    for (var i = 0; i < evs.length; i++) { var e = evs[i]; if (tc < e.t) break; s = mix(s, e.s, e.dur > 0 ? io((tc - e.t) / e.dur) : 1); since = tc - e.t - e.dur; }
    s = s.slice(); s[2] *= 1 + 0.014 * clamp(since, 0, 4);                   // never quite still: a slow push
    return s;
  }
  var foot = $("#foot"), footSrc = "";

  window.draw = async function(t){
    var fi = Math.min(TL.mouth.length - 1, Math.max(0, Math.round(t * TL.fps))), m = TL.mouth[fi], m3 = (TL.mouth[Math.max(0, fi - 1)] + m + TL.mouth[Math.min(TL.mouth.length - 1, fi + 1)]) / 3;
    var inTitle = t >= T0 && t < T1, inFeat = t >= T1 && t < close, inEnd = t >= END, inStudio = !inTitle && !inFeat && !inEnd;
    var cur = null; feats.forEach(function(s){ if (t >= s.t0) cur = s; });

    /* ---- the feature shot's screen ---- */
    $("#stage").style.display = inFeat ? "" : "none";
    if (inFeat) {
      var cam = CAMS[cur.id], tc = t - cur.t0;
      if (cam && cam.frames) {
        var src = "footage/" + cur.id + "/" + String(clamp(Math.round(tc * TL.fps) + 1, 1, cam.frames)).padStart(5, "0") + ".jpg";
        if (src !== footSrc) { foot.src = footSrc = src; try { await foot.decode(); } catch (e) {} }
        foot.style.visibility = "";
      } else foot.style.visibility = "hidden";
      var s = screenCam(cur.id, tc), k = G.FOOT.k, sway = s[3];
      $("#scr").style.transform = "translate(960px," + s[4].toFixed(2) + "px) rotateY(" + (sway * (-8 + 1.6 * Math.sin(t * 0.7))).toFixed(3) + "deg) rotateX(" + (sway * (3.2 + 0.8 * Math.sin(t * 0.9))).toFixed(3) + "deg) scale(" + (s[2] / k).toFixed(5) + ") translate(" + (-s[0] * k).toFixed(2) + "px," + (-s[1] * k).toFixed(2) + "px)";
      $("#scrim").style.opacity = 1 - s[3];
      $("#tintglow").style.background = (CH[cur.id] || {}).tint || "#8A76D6";
    }

    /* ---- the studio: the whole frame, or the booth cam ---- */
    $("#studio").style.display = inStudio || inFeat ? "" : "none";
    var c, foc = 1, pip = inFeat ? back((t - feats[0].t0 - 0.3) / 0.45) : 0;
    if (inFeat) c = BOOTH;
    else if (t < T0) { var drop = io((t - 1.2) / 0.8); foc = drop; c = mix(mix(mix(LAMP, [2.02, 960, G.lampY, 960, 520], clamp(t / 1.3)), TIGHT, drop), WIDE, io((t - 3.4) / (T0 - 0.25 - 3.4))); }
    else c = mix(WIDE, CLOSE, io((t - close) / (END - close + 1)));
    var sx = inFeat ? 0 : Math.sin(t * 0.7) * 5, sy = inFeat ? 0 : Math.sin(t * 0.9 + 1) * 3.5;
    $("#cam").style.transform = "translate(" + (c[3] - c[0] * c[1] + sx).toFixed(2) + "px," + (c[4] - c[0] * c[2] + sy).toFixed(2) + "px) scale(" + c[0].toFixed(4) + ")";
    $("#studio").style.clipPath = inFeat ? "circle(" + (PIP.r * pip).toFixed(1) + "px at " + PIP.x + "px " + PIP.y + "px)" : "none";
    var blur = inFeat ? 0 : foc * Math.max(0, c[0] - 1.08) * 4.6;
    backs.forEach(function(g){ g.style.filter = blur > 0.15 ? "blur(" + blur.toFixed(2) + "px)" : "none"; });
    $("#vig").style.opacity = inFeat ? 0 : 1;
    $("#pipring").style.display = $("#live").style.display = inFeat && pip > 0 ? "" : "none";
    $("#pipring").style.transform = "scale(" + pip.toFixed(3) + ")";
    $("#live").style.transform = "scale(" + (pip * (0.82 + 0.18 * Math.abs(Math.sin(t * 2.4)))).toFixed(3) + ")";
    var bars = t < T0 ? 1 : t >= close && !inEnd ? eout((t - close - 0.2) / 0.5) : 0;
    $("#barT").style.transform = $("#barB").style.transform = "scaleY(" + bars.toFixed(3) + ")";

    /* Timmy: his mouth from his voice, a bob with it, blinks, a gesture */
    var open = m < 0.09 ? 0 : 0.18 + 0.82 * m, wob = Math.sin(t * 23.7) * 0.6 + Math.sin(t * 9.1) * 0.4, mh = mouthAt(open, wob, INK);
    mouths.forEach(function(g){ g.innerHTML = mh; });
    tim.style.transform = "translateY(" + (Math.sin(t * 2.1) * 1.1 - m3 * 1.6).toFixed(2) + "px) rotate(" + (Math.sin(t * 1.3) * 0.9).toFixed(2) + "deg)";
    var shut = blinks.some(function(b){ return t >= b && t < b + 0.1; });
    eyes.forEach(function(e){ e.style.transform = shut ? "scaleY(0.12)" : "none"; });
    var w = 0; waves.concat([END + 1.5]).forEach(function(w0){ var x = (t - w0) / 1.5; if (x > 0 && x < 1) w = Math.sin(x * Math.PI) * (0.75 + 0.25 * Math.sin(x * Math.PI * 5)); });
    arms.forEach(function(a){ a.style.transform = "rotate(" + (-w * 58).toFixed(1) + "deg)"; });

    /* the light: dark until the lamp has flickered on and the room's lights come up; down again after the sign-off */
    var up = io((t - 1.3) / 0.65), down = t > TL.lampOff ? io((t - TL.lampOff) / 0.4) : 0, dark = inFeat ? 0 : Math.max(0.94 * (1 - up), 0.66 * down), lit = 1 - dark / 0.94;
    var on = t > TL.lampOn && t < TL.lampOff ? 1 : 0; if (on && t < TL.lampOn + 0.42) on = Math.sin(t * 70) > -0.2 ? 1 : 0.12;
    $("#cam .tm-dark").style.opacity = dark;
    $("#cam .tm-lamp-on").style.opacity = on;
    $("#cam .tm-glow").style.opacity = on * (0.75 + 0.25 * Math.sin(t * 3.1));
    $("#cam .tm-spill").style.opacity = on * lerp(0.62, 0.2, lit) * (0.94 + 0.06 * Math.sin(t * 3.1));
    $("#cam .tm-key").style.opacity = 0.62 * lit;
    $("#cam .tm-shaft").style.opacity = 0.34 * lit;
    motes.forEach(function(d, i){ var ph = (t * (0.035 + 0.02 * rnd(i, 1)) + rnd(i, 2)) % 1; d.style.transform = "translate(" + (Math.sin(t * 0.5 + i) * 14 + ph * 50).toFixed(1) + "px," + (ph * 90 - 45).toFixed(1) + "px)"; d.style.opacity = lit * 0.55 * Math.sin(ph * Math.PI) * (0.6 + 0.4 * Math.sin(t * 1.7 + i * 2.1)); });
    segs.forEach(function(sg){ var lvl = (sg.getAttribute("data-m") === "0" ? m : m3 * 0.9) * 8.4 + (on ? 0.6 : 0); sg.style.opacity = +sg.getAttribute("data-i") < lvl ? 1 : 0.22; });
    all("#cam .tm-steam").forEach(function(sm){ sm.style.transform = "translate(" + (Math.sin(t * 1.7) * 3).toFixed(1) + "px," + (-((t * 9) % 14)).toFixed(1) + "px)"; sm.style.opacity = 1 - ((t * 9) % 14) / 14 * 0.7; });
    all("#cam .tm-cloud").forEach(function(cl, i){ cl.style.transform = "translateX(" + ((t * (i ? 5 : 8)) % 60 - 20).toFixed(1) + "px)"; });

    /* the caption: the line being spoken, from just before its first word until the next line (or a beat after) */
    var cue = null; TL.cues.forEach(function(q, i){ var nx = TL.cues[i + 1], until = Math.min(q.t1 + 0.4, nx ? nx.t0 - 0.08 : q.t1 + 0.4); if (t >= q.t0 - 0.08 && t < until) cue = q; });
    var cap = $("#cap"), sp = cap.firstElementChild, ca = cue && !inTitle && !inEnd ? clamp((t - (cue.t0 - 0.08)) / 0.16) : 0;
    cap.className = inFeat ? "f" : "s"; cap.style.opacity = ca; cap.style.transform = "translateY(" + ((1 - eout(ca)) * 16).toFixed(1) + "px)";
    if (cue && sp.textContent !== cue.shown) sp.textContent = cue.shown;

    /* the title card */
    $("#title").style.display = inTitle ? "" : "none";
    if (inTitle) {
      var u = t - T0;
      $("#title .cw").style.transform = "scale(" + (lerp(1.09, 1, eout(u / 0.3)) + 0.022 * u).toFixed(4) + ")";
      $("#title .kick").style.opacity = clamp(u / 0.2); $("#title .kick").style.letterSpacing = lerp(40, 16, eout(u / 0.5)).toFixed(1) + "px";
      rise(tBig, u, 0.03, 0.035);
      $("#title .ul").style.transform = "scaleX(" + eout((u - 0.36) / 0.34).toFixed(4) + ")";
      confetti($("#title .conf"), u, 0);
    }

    /* the end card */
    $("#end").style.display = inEnd ? "" : "none";
    if (inEnd) {
      var v = t - END;
      $("#end .cw").style.transform = "scale(" + (1 + 0.012 * v).toFixed(4) + ")";
      $("#end .mark").style.transform = "scale(" + back(v / 0.4).toFixed(4) + ") rotate(" + ((1 - eout(v / 0.5)) * -14).toFixed(2) + "deg)";
      rise(eBig, v, 0.14, 0.03);
      var p = $("#end p"), ur = $("#end .url"), pk = eout((v - 0.62) / 0.35), uk = eout((v - 0.95) / 0.35);
      p.style.opacity = pk; p.style.transform = "translateY(" + ((1 - pk) * 22).toFixed(1) + "px)";
      ur.style.opacity = uk; ur.style.transform = "translateY(" + ((1 - uk) * 22).toFixed(1) + "px)";
      $("#endtim").style.transform = "translateY(" + ((1 - back((v - 1.05) / 0.55)) * 460).toFixed(1) + "px) rotate(" + (-9 + Math.sin(v * 2) * 1.5).toFixed(2) + "deg)";
      confetti($("#end .conf"), v, 1);
    }

    /* the chapter card across each cut */
    var st = null; TL.shots.slice(1).forEach(function(s){ if (Math.abs(t - s.t0) < 0.56) st = s; });
    $("#sting").style.display = st ? "" : "none";
    if (st) {
      var x = t - st.t0, ch = CH[st.id] || { n: "", name: "", tint: "#8A76D6" };
      var pos = function(a, b){ return (-110 * (1 - eout((x + a) / 0.26)) + 110 * ein((x - b) / 0.26)).toFixed(2); };
      $("#sting .ink").style.transform = "translateX(" + pos(0.5, 0.24) + "%) skewX(-12deg)";
      var tp = $("#sting .tint"); tp.style.background = ch.tint; tp.style.transform = "translateX(" + pos(0.42, 0.16) + "%) skewX(-12deg)";
      var lab = $("#sting .lab"), li = eout((x + 0.36) / 0.2), lo = ein((x - 0.15) / 0.2), nm = $("#sting .nm"), n = $("#sting .n");
      if (nm.textContent !== ch.name) { nm.textContent = ch.name; n.textContent = ch.n; n.style.color = ch.tint; n.style.display = ch.n ? "" : "none";
        var lines = ch.name.split("\n"), longest = Math.max.apply(null, lines.map(function(l){ return l.length; }));
        nm.style.fontSize = Math.min(lines.length > 1 ? 168 : 200, 1700 / (Math.max(1, longest) * 0.66)).toFixed(0) + "px"; }
      lab.style.opacity = li * (1 - lo); lab.style.transform = "translateX(" + (-110 * (1 - li) + 150 * lo).toFixed(1) + "px)";
    }

    /* a flash on the two hits, and in and out of black */
    $("#flash").style.opacity = Math.max(t >= T0 ? 0.8 * (1 - clamp((t - T0) / 0.16)) : 0, t >= END ? 0.8 * (1 - clamp((t - END) / 0.16)) : 0);
    $("#black").style.opacity = Math.max(1 - clamp((t - 0.25) / 0.3), io((t - (TL.dur - 0.7)) / 0.6));
  };
}

async function main(){
  const at = arg("--at"), from = +(arg("--from") || 0), to = +(arg("--to") || TL.dur);
  const dir = path.join(out, at ? "stills" : "frames");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(out, "compose.html");
  fs.writeFileSync(file, html);
  const G = { mouth: mouth.toString(), FACE, PIP, INK: STYLE.INK, AY, FOOT, LOW: 846, lampY: 118 + DOWN };
  const frames = at ? at.split(",").map(Number).map((t) => ({ t, name: "t" + t.toFixed(2).replace(".", "_") + ".jpg" }))
    : Array.from({ length: Math.ceil(TL.dur * TL.fps) }, (_, i) => ({ t: i / TL.fps, name: "f" + String(i).padStart(5, "0") + ".jpg" })).filter((f) => f.t >= from && f.t < to);
  const browser = await pw.chromium.launch();
  const workers = at ? 1 : Math.max(1, Math.min(6, os.cpus().length));
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => { console.error("page error:", e.message); process.exitCode = 1; });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(`(${pageSetup.toString()})(${JSON.stringify(TL)}, ${JSON.stringify(CAMS)}, ${JSON.stringify(CHAPTERS)}, ${JSON.stringify(G)})`);
    while (next < frames.length) {
      const f = frames[next++];
      await page.evaluate((t) => window.draw(t), f.t);
      await page.screenshot({ path: path.join(dir, f.name), type: "jpeg", quality: 95 });
      if (++done % 150 === 0) console.error(`  ${done} / ${frames.length} frames`);
    }
    await page.close();
  }));
  await browser.close();
  console.error(`${frames.length} frames -> ${dir}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
