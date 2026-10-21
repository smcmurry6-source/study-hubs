// Fig: swallowing, stage by stage (Occlusion L3, "Part 2: swallowing"). A midline side view, patient facing right:
// nasal cavity, hard and soft palate, tongue, incisors and lips, pharynx, epiglottis, hyoid, trachea (in front) and
// esophagus (behind), with the cervical spine for orientation. Step through the three stages as the notes give them;
// a toggle swaps the adult somatic swallow (teeth together in MIP, the elevators holding the mandible) for the
// visceral (infantile) swallow (tongue pushed forward between the arches to brace the mandible), which, if
// over-retained, displaces the teeth anteriorly, e.g. an anterior open bite. Numbers are only the notes' own (about
// 66.5 lb for about 683 ms, 590 swallows a day, stages 1 + 2 about a second, stage 3 6-7 s). The anatomy is schematic:
// shapes are drawn for clarity, not traced from imaging.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 420, H = 430;
/* keyframes: each a set of points; the live figure blends them by stage (0 rest .. 1 end of stage 1 .. 2 .. 3) */
const D = {
  W, H,
  /* tongue: tip, dorsum (front to back), base, then the floor back to the tip */
  TONGUE: [
    /* rest: bolus on the dorsum in a groove */ [[340, 196], [326, 186], [305, 178], [284, 186], [262, 182], [240, 186], [222, 200], [210, 222], [208, 248], [214, 268], [250, 282], [300, 276], [334, 250], [346, 214]],
    /* end of stage 1: pressed to the palate front to back, the base thrust back */ [[338, 190], [326, 166], [305, 160], [284, 160], [262, 162], [238, 168], [214, 184], [200, 214], [200, 244], [210, 268], [250, 280], [300, 274], [334, 248], [344, 212]],
    /* stage 2: held up and back while the bolus passes */ [[338, 190], [326, 166], [305, 160], [284, 160], [262, 162], [238, 167], [212, 182], [196, 212], [196, 242], [210, 266], [250, 278], [300, 272], [334, 246], [344, 212]],
    /* stage 3: relaxes */ [[340, 196], [326, 184], [305, 176], [284, 180], [262, 180], [240, 184], [222, 198], [210, 222], [208, 248], [214, 268], [250, 282], [300, 276], [334, 250], [346, 214]],
  ],
  /* the visceral swallow: the tongue tip forward between the incisors in stages 0-2 */
  TIPV: [[366, 197], [356, 186]],
  /* soft palate: hangs at rest, rises to seal the nasopharynx in stage 2 */
  VELUM: [[[236, 152], [214, 160], [196, 176], [190, 192], [198, 196], [212, 182], [236, 166]], [[236, 152], [212, 150], [186, 148], [178, 152], [184, 160], [212, 162], [236, 166]]],
  /* epiglottis: upright behind the tongue base, tips back over the laryngeal inlet in stage 2 */
  EPI: [[[214, 296], [206, 270], [204, 248], [210, 252], [214, 272], [220, 294]], [[214, 296], [204, 290], [186, 286], [188, 280], [206, 282], [220, 292]]],
  HYOID: [[248, 292], [258, 280]],
  /* bolus path: on the tongue, into the oropharynx (end of stage 1), down past the epiglottis into the esophagus (end of
     stage 2), down the esophagus (stage 3) */
  BOLUS: [[[286, 176], [252, 172], [222, 188], [200, 214]], [[200, 214], [188, 246], [182, 278], [182, 314]], [[182, 314], [182, 350], [182, 390], [182, 440]]],
  STAGES: [
    "Ready: the food is chewed and the bolus is on the tongue. The not-necessarily-conscious decision to swallow depends on the fineness of the food, the intensity of taste extracted and the lubrication of the bolus.",
    "Stage 1 (voluntary): the tongue separates the food and presses the bolus lightly against the palate, tongue tip behind the incisors; lips sealed, teeth closed; a reflex wave pushes the bolus back into the pharynx.",
    "Stage 2: pharyngeal constrictor peristalsis carries the bolus to the esophagus. The soft palate rises and seals the nasal passage, the epiglottis closes over the trachea, and the Eustachian tube openings open (normally closed). Stages 1 + 2 take about a second.",
    "Stage 3: peristalsis carries the bolus down the esophagus to the cardiac sphincter, which relaxes into the stomach: 6-7 seconds. The upper esophagus has some voluntary control, to return food for more chewing.",
  ],
};

function swLerp(A, B, u) { return A.map(function (p, i) { return [p[0] + (B[i][0] - p[0]) * u, p[1] + (B[i][1] - p[1]) * u]; }); }
/* where things are at stage position s (0..3) */
function swState(s, visceral, D) {
  var T = D.TONGUE, k = Math.min(2, Math.floor(s)), u = s - k, tongue = s >= 3 ? T[3] : swLerp(T[k], T[k + 1], u);
  if (visceral && s < 2.5) { tongue = tongue.slice(); var w = s < 2 ? 1 : 1 - (s - 2) / 0.5; tongue[0] = [tongue[0][0] + (D.TIPV[0][0] - tongue[0][0]) * w, tongue[0][1] + (D.TIPV[0][1] - tongue[0][1]) * w]; tongue[1] = [tongue[1][0] + (D.TIPV[1][0] - tongue[1][0]) * w, tongue[1][1] + (D.TIPV[1][1] - tongue[1][1]) * w]; }
  /* the soft palate starts rising late in stage 1, up through stage 2, back down in stage 3 */
  var v = s < 0.6 ? 0 : s < 1.2 ? (s - 0.6) / 0.6 : s < 2.2 ? 1 : s < 2.8 ? 1 - (s - 2.2) / 0.6 : 0;
  var e = s < 1 ? 0 : s < 1.3 ? (s - 1) / 0.3 : s < 2 ? 1 : s < 2.4 ? 1 - (s - 2) / 0.4 : 0;
  var b = D.BOLUS, seg = Math.min(2, Math.floor(s)), bu = s - seg, path = b[seg], n = path.length - 1, i = Math.min(n - 1, Math.floor(bu * n)), f = bu * n - i;
  var bolus = s >= 3 ? null : [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
  return { tongue: tongue, velum: swLerp(D.VELUM[0], D.VELUM[1], v), epi: swLerp(D.EPI[0], D.EPI[1], e), hy: e, open: e > 0.5, bolus: bolus, jaw: visceral && s < 2.5 ? 7 : 0 };
}

function swSvg(s, visceral, D) {
  var S = swState(s, visceral, D), f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function C(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function tx(x, y, t, cls, a) { return '<text class="sw-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function lab(t, x, y, px, py, a, k) { return '<path class="sw-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="sw-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, k || "", a); }
  var hy = S.hy, lift = [10 * hy, -12 * hy], jaw = S.jaw;
  /* head and neck profile (soft tissue) */
  o += '<path class="sw-skin" d="' + C([[120, 40], [300, 36], [372, 70], [394, 118], [408, 140], [388, 150], [384, 166], [380, 188 + jaw / 2], [384, 212 + jaw], [376, 238 + jaw], [366, 268 + jaw], [330, 292], [290, 304], [268, 360], [262, 428], [110, 428], [100, 240]]) + '"/>';
  /* cervical vertebrae */
  for (var v = 0; v < 6; v++) o += '<rect class="sw-bone" x="122" y="' + (110 + v * 52) + '" width="34" height="42" rx="6"/>';
  /* airway: nasal cavity, pharynx and the trachea (moves up with the larynx) */
  o += '<path class="sw-air" d="' + C([[172, 84], [250, 80], [330, 92], [380, 120], [388, 140], [370, 148], [300, 146], [240, 146], [200, 144], [180, 150], [176, 200], [176, 280], [178, 300], [200 + lift[0], 306 + lift[1]], [200 + lift[0], 330 + lift[1]], [226 + lift[0], 330 + lift[1]], [228 + lift[0], 296 + lift[1]], [222, 276], [214, 236], [222, 196], [240, 186], [300, 180], [348, 186], [356, 190], [340, 160], [300, 152], [240, 152], [196, 156], [174, 120]]) + '"/>';
  o += '<path class="sw-air" d="M' + f(200 + lift[0]) + " " + f(320 + lift[1]) + "L" + f(204 + lift[0] * 0.4) + " 430L234 430L" + f(228 + lift[0]) + " " + f(320 + lift[1]) + 'Z"/>';
  /* trachea rings */
  for (var r = 0; r < 4; r++) { var ry = 344 + r * 22 + lift[1] * (1 - r / 4); o += '<path class="sw-ring" d="M' + f(202 + lift[0] * 0.6) + " " + f(ry) + "L" + f(230 + lift[0] * 0.6) + " " + f(ry) + '"/>'; }
  /* esophagus: closed tube behind the trachea, opening around the bolus */
  var bw = S.bolus && S.bolus[1] > 300 ? S.bolus : null;
  o += '<path class="sw-eso" d="M172 300L172 430M194 300L194 430"/>';
  if (bw) o += '<ellipse class="sw-air" cx="183" cy="' + f(bw[1]) + '" rx="10" ry="16"/>';
  /* hard palate and its incisors */
  o += '<path class="sw-bone hot" data-info="Hard palate: the bolus is pressed against it in stage 1." d="' + C([[236, 150], [300, 146], [352, 148], [366, 156], [354, 162], [300, 158], [238, 160]]) + '"/>';
  o += '<path class="sw-tooth" d="' + C([[352, 156], [366, 156], [372, 188], [364, 194], [356, 184]]) + '"/>';
  /* soft palate */
  o += '<path class="sw-soft hot" data-info="Soft palate (velum): rises in stage 2 to seal off the nasal passage." d="' + C(S.velum) + '"/>';
  /* Eustachian tube opening on the nasopharynx wall */
  o += '<ellipse class="sw-et' + (S.open ? " is-open" : "") + ' hot" data-info="Eustachian tube opening: normally closed, it opens during stage 2." cx="196" cy="122" rx="6" ry="' + (S.open ? 6 : 2.5) + '"/>';
  /* mandible symphysis, lower incisor, lips (moved down a little when the teeth are apart) */
  o += '<g transform="translate(0 ' + jaw + ')"><path class="sw-bone" d="' + C([[338, 214], [356, 206], [364, 230], [362, 262], [348, 276], [330, 270], [326, 240]]) + '"/>';
  o += '<path class="sw-tooth" d="' + C([[348, 214], [356, 190], [362, 190], [362, 212], [356, 220]]) + '"/></g>';
  o += '<path class="sw-lip" d="' + C([[368, 150], [384, 160], [384, 186 + jaw / 2], [372, 190 + jaw / 2], [366, 172]]) + '"/><path class="sw-lip" d="' + C([[366, 194 + jaw], [382, 192 + jaw / 2], [386, 214 + jaw], [372, 222 + jaw], [364, 210 + jaw]]) + '"/>';
  /* tongue */
  o += '<path class="sw-tongue hot" data-info="The tongue: in stage 1 it presses the bolus against the palate from front to back and thrusts it into the pharynx. In the visceral (infantile) swallow its tip pushes forward between the arches to brace the mandible." d="' + C(S.tongue) + '"/>';
  /* hyoid and epiglottis (with the larynx) */
  var H0 = D.HYOID, hp = [H0[0][0] + (H0[1][0] - H0[0][0]) * hy, H0[0][1] + (H0[1][1] - H0[0][1]) * hy];
  o += '<ellipse class="sw-bone hot" data-info="Hyoid: pulled up and forward in stage 2, lifting the larynx under the epiglottis. Stabilizing the mandible is what lets the hyoid move." cx="' + f(hp[0]) + '" cy="' + f(hp[1]) + '" rx="12" ry="5"/>';
  o += '<path class="sw-cart hot" data-info="Epiglottis: closes over the trachea in stage 2 so the bolus goes down the esophagus." d="' + C(S.epi) + '"/>';
  /* bolus */
  if (S.bolus) o += '<circle class="sw-bolus" cx="' + f(S.bolus[0]) + '" cy="' + f(S.bolus[1]) + '" r="9"/>';
  /* labels */
  o += lab("nasal cavity", 300, 72, 300, 110, "start", "sw-mut");
  o += lab("hard palate", 410, 108, 330, 152, "end");
  o += lab("soft palate", 180, 60, (S.velum[2][0] + S.velum[5][0]) / 2, (S.velum[2][1] + S.velum[5][1]) / 2, "start");
  o += lab("tongue", 300, 230, 290, 210, "middle");
  o += lab("epiglottis", 120, 262, (S.epi[1][0] + S.epi[2][0]) / 2, (S.epi[1][1] + S.epi[2][1]) / 2, "end");
  o += lab("hyoid", 300, 322, hp[0] + 8, hp[1] + 2, "start");
  o += lab("trachea", 250, 400, 222, 392, "start");
  o += lab("esophagus", 120, 410, 176, 404, "end");
  o += lab("pharynx", 120, 210, 178, 210, "end");
  if (S.open) o += tx(206, 127, "Eustachian tube opens", "sw-key");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "sw-svg", label: "Midline side view of the mouth and throat, patient facing right: nasal cavity, palate, tongue, pharynx, epiglottis, hyoid, trachea and esophagus, with a bolus.", body: swSvg(0, false, D) });
const plate = plateHtml({ fig: "Fig 9", title: "Swallowing", hint: "step through the stages", readout: "ready", body: `<div class="am-svg sw-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>ready</span><input type="range" min="0" max="300" step="1" value="0" aria-label="Swallowing stage, from ready to the end of stage 3"><span>stage 3</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-swstep="-1">Back</button><button type="button" class="am-btn" data-swstep="1">Next stage</button><button type="button" class="am-btn" data-swplay aria-pressed="false">Swallow</button></div>
<div class="am-controls" role="group" aria-label="Swallow type"><button type="button" class="am-btn" data-swmode="s" aria-pressed="true">Somatic (adult)</button><button type="button" class="am-btn" data-swmode="v" aria-pressed="false">Visceral (infantile)</button></div>
<div class="am-stats"><span><b>Force</b> <em>about 66.5 lb for about 683 ms, in ICP (7.8 lb more than chewing)</em></span><span><b>How often</b> <em>about 590 a day: 146 at meals, 394 awake between meals, 50 asleep</em></span><span><b>Timing</b> <em>stages 1 + 2 about 1 s; stage 3 6-7 s</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the tongue, the soft palate, the epiglottis, the hyoid or the Eustachian tube opening.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The three stages, the somatic and visceral swallows, and every number are from the L3 notes (Dr. Givan). Swallowing contacts are heavy and long and happen in ICP, not a retruded position as once thought.</li>
<li>The drawing is a schematic midline section: shapes are drawn for clarity, not traced from imaging (swallowing is studied by videofluoroscopic swallowing study, dynamic MRI and, historically, cinefluorography). The Eustachian tube opening is on the side wall of the nasopharynx, shown here as a mark.</li></ul></details>`;

function swLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sw-svg"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-swplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = 0, tgt = 0, vis = false, frame = 0, last = 0, playing = false;
  function draw() {
    svg.innerHTML = D.swSvg(s, vis, D);
    var k = s <= 0 ? 0 : Math.min(3, Math.ceil(s - 1e-6));
    var t = D.STAGES[k];
    if (vis) t = (k === 1 || k === 0 ? "Visceral (infantile) swallow: instead of the teeth meeting in MIP, the tongue pushes forward between the arches to brace the mandible. Normal until the posterior teeth erupt (and when swallowing liquids); over-retained, it displaces teeth anteriorly, e.g. an anterior open bite. " : "") + t.replace("lips sealed, teeth closed", "here the teeth stay apart with the tongue between them");
    else if (k === 0) t = "Somatic (adult) swallow: the teeth come together in MIP and the elevators hold the mandible there; stabilizing the mandible is what matters most, so the hyoid can move. " + t;
    if (sum.textContent !== t) sum.textContent = t;
    if (readout) readout.textContent = k === 0 ? "ready" : "stage " + k;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) {
    var dt = Math.min(64, now - (last || now)); last = now;
    /* stages 1 + 2 take about a second in life; slowed down here so they can be followed */
    var sp = playing ? (s < 2 ? 0.0006 : 0.0009) : 0.0025;
    s = tgt > s ? Math.min(tgt, s + dt * sp) : Math.max(tgt, s - dt * sp);
    slider.value = Math.round(s * 100); draw();
    if (s !== tgt) frame = requestAnimationFrame(tick); else if (playing) stop();
  }
  function go(to) { tgt = Math.max(0, Math.min(3, to)); cancelAnimationFrame(frame); if (reduce.matches) { s = tgt; slider.value = Math.round(s * 100); draw(); return; } last = 0; frame = requestAnimationFrame(tick); }
  root.querySelectorAll("[data-swstep]").forEach(function (b) { b.addEventListener("click", function () { stop(); var d = +b.getAttribute("data-swstep"); go(d > 0 ? Math.floor(s + 1e-6) + 1 : Math.ceil(s - 1e-6) - 1); }); });
  play.addEventListener("click", function () { if (playing) { stop(); return; } if (s >= 3) { s = 0; } playing = true; play.setAttribute("aria-pressed", "true"); go(3); });
  slider.addEventListener("input", function () { stop(); cancelAnimationFrame(frame); s = tgt = +slider.value / 100; draw(); });
  root.querySelectorAll("[data-swmode]").forEach(function (b) { b.addEventListener("click", function () { vis = b.getAttribute("data-swmode") === "v"; root.querySelectorAll("[data-swmode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .sw-box{max-width:460px;margin:0 auto}
.anima .sw-svg .sw-t{fill:var(--anatomy-text);font:14px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .sw-svg .sw-mut{fill:var(--anatomy-muted)}
.anima .sw-svg .sw-key{fill:var(--anatomy-lit);font-weight:600;font-size:12px}
.anima .sw-svg .sw-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .sw-svg .sw-dot{fill:var(--anatomy-dot)}
.anima .sw-svg .sw-skin{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1}
.anima .sw-svg .sw-air{fill:var(--tm-air);opacity:.16;stroke:none}
.anima .sw-svg .sw-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1}
.anima .sw-svg .sw-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1}
.anima .sw-svg .sw-soft{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:1}
.anima .sw-svg .sw-lip{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:1}
.anima .sw-svg .sw-tongue{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:1.2}
.anima .sw-svg .sw-cart{fill:var(--tm-cart);stroke:var(--anatomy-hi);stroke-width:1}
.anima .sw-svg .sw-ring{stroke:var(--tm-cart);stroke-width:3;stroke-linecap:round}
.anima .sw-svg .sw-eso{fill:none;stroke:var(--tm-muscle-fib);stroke-width:2}
.anima .sw-svg .sw-et{fill:var(--tm-air);stroke:var(--anatomy-hi);stroke-width:1}
.anima .sw-svg .sw-et.is-open{fill:var(--anatomy-lit)}
.anima .sw-svg .sw-bolus{fill:#c9a23a;stroke:#8a6d1f;stroke-width:1.2}
`;

export function swallow() {
  return {
    id: "swallow", lec: "function",
    title: "Swallowing, stage by stage",
    caption: "Step through the three stages of a swallow in a midline view of the mouth and throat, and compare the adult somatic swallow (teeth together in MIP) with the visceral (infantile) swallow, tongue forward between the arches.",
    html: `<div class="anima" data-anima="swallow">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: swLive.toString(),
    helpers: [swLerp, swState, swSvg],
    data: D,
  };
}
