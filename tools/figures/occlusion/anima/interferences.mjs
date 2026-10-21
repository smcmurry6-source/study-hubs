// Fig: working and non-working interferences (Occlusion L1, eccentric movements and contacts).
// Tab 1: the right first molars cut front to back (frontal section, buccal on the left), the same section as the static
// `inclines` figure (tools/figures/occlusion/od.js; the outlines below are copied from it). A slider moves the lower molar
// toward the cheek (a right move: the right side is working) or toward the tongue (a left move: the right side is
// non-working). Tab 2: the same molars from the cheek side (sagittal, mesial at the left) in a protrusive move.
// One model drives both: the lower tooth slides by dx and, where the teeth meet, rides down the opposing incline just
// far enough not to pass through it (ixRide, from sampled crown profiles). The incline pairs the help sheet names for that
// movement light up (working: 2 with 6 and 4 with 5; non-working: 1 with 3; protrusive: maxillary distal inclines with
// mandibular mesial inclines) and a spark marks where the model has them touching. Distances are schematic (drawing px);
// the figure shows which inclines face each other, not how far a jaw moves.
import { figureSvg, plateHtml, f1, smooth } from "./shared.mjs";

/* frontal section, from od.js F.inclines (help sheet "Draw this"); the maxillary buccal cusp sits a little longer here
   ([90,148],[100,168] instead of [90,142],[101,160]) so that, as on the help sheet, 4 meets 5 at the end of a working move */
const MX = [[96,8],[84,34],[72,72],[78,112],[90,148],[100,168],[126,150],[150,128],[176,146],[204,170],[234,160],[256,128],[266,86],[258,44],[244,8]];
const MD = [[132,318],[118,286],[104,242],[106,200],[118,172],[130,156],[150,136],[178,160],[205,178],[232,160],[262,140],[276,160],[282,204],[276,252],[262,288],[252,318]];
const FR_INCL = {
  max: { 5: [[100,168],[150,128]], 1: [[150,128],[204,170]], 2: [[204,170],[252,124]] },
  mand: { 4: [[150,136],[110,190]], 3: [[150,136],[205,178]], 6: [[205,178],[262,140]] },
};
const FR_PIN = { 1: [188,141], 2: [219,137], 3: [173,169], 4: [147,159], 5: [118,133], 6: [241,170] };

/* sagittal (buccal view) of #3 over #30 in Class I, mesial at the left: the MB cusp of #3 over the buccal groove of #30,
   the DB cusp of #3 over the distobuccal groove. Schematic crowns with their buccal roots. */
const SU = [[112,146],[122,154],[134,161],[152,153],[166,142],[180,152],[194,160],[210,155],[232,148],[246,142],[256,128],[254,106],[246,90],
  [244,70],[238,44],[230,24],[220,20],[212,28],[208,52],[202,70],[190,72],[178,68],[172,46],[166,26],[156,18],[146,24],[140,48],[134,72],[128,90],[118,108],[110,126]];
const SL = [[70,168],[86,156],[102,150],[118,157],[134,168],[150,157],[164,151],[180,158],[194,169],[208,161],[220,157],[232,161],[242,168],[252,182],[254,202],[246,224],
  [242,250],[236,280],[226,302],[214,302],[208,276],[202,250],[188,238],[172,240],[162,252],[154,282],[144,304],[130,306],[118,284],[108,254],[98,226],[84,206],[72,188]];
const SA_INCL = {
  max: { mbd: [[134,161],[166,142]], dbd: [[194,160],[232,148]] },
  mand: { dbm: [[134,168],[164,151]], dm: [[194,169],[220,157]] },
};

/* sample a closed Catmull-Rom outline (the same curve as smooth()) and keep, per pixel column, the lowest point of the
   upper tooth (its occlusal edge) or the highest of the lower tooth */
function bez(pts, n) {
  const N = pts.length, out = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < n; k++) { const t = k / n, s = 1 - t;
      out.push([s*s*s*p1[0] + 3*s*s*t*c1[0] + 3*s*t*t*c2[0] + t*t*t*p2[0], s*s*s*p1[1] + 3*s*s*t*c1[1] + 3*s*t*t*c2[1] + t*t*t*p2[1]]); }
  }
  return out;
}
function profile(pts, bottom, yLim) {
  const m = {};
  for (const [x, y] of bez(pts, 80)) { if (bottom ? y < yLim : y > yLim) continue; const k = Math.round(x); if (m[k] === undefined || (bottom ? y > m[k] : y < m[k])) m[k] = y; }
  const ks = Object.keys(m).map(Number), x0 = Math.min(...ks), x1 = Math.max(...ks), a = [];
  for (let x = x0; x <= x1; x++) a.push(m[x] === undefined ? null : f1(m[x]));
  return { x0, v: a };
}

const D = {
  fr: { up: profile(MX, true, 100), lo: profile(MD, false, 220), max: 36, tol: 1.6, lift: 0.75,
    pairs: { work: [[2, 6], [4, 5]], non: [[1, 3]] } },
  sa: { up: profile(SU, true, 120), lo: profile(SL, false, 190), max: 32, tol: 1.4, lift: 0.75,
    pairs: { pro: [["mbd", "dbm"], ["dbd", "dm"]] } },
};
/* where the lower tooth sits when slid by dx: dy (down, from MIP) and the columns where the teeth touch */
function ixRide(view, dx, guided, D) {
  var V = D[view], up = V.up, lo = V.lo, i, best = Infinity, g = [];
  function gapAt(sh) { var m = Infinity; for (var j = 0; j < up.v.length; j++) { var x = up.x0 + j, u = up.v[j], k = Math.round(x - sh) - lo.x0, l = lo.v[k]; if (u == null || l == null || k < 0) continue; var d = l - u; if (d < m) m = d; } return m; }
  var g0 = V.g0 != null ? V.g0 : (V.g0 = gapAt(0));
  for (i = 0; i < up.v.length; i++) { var x = up.x0 + i, u = up.v[i], k = Math.round(x - dx) - lo.x0, l = lo.v[k]; if (u == null || l == null || k < 0) continue; var d = l - u; g.push([x, d]); if (d < best) best = d; }
  var ride = Math.max(0, g0 - best), lift = guided ? 4 + Math.abs(dx) * V.lift : 0, dy = ride + lift, pts = [];
  if (!guided && Math.abs(dx) > 1.5) g.forEach(function (p) { if (p[1] - best < V.tol) pts.push(p[0]); });
  /* group touching columns into contact spots (centers) */
  var spots = [], run = [];
  pts.forEach(function (x, n) { if (run.length && x - run[run.length - 1] > 2) { spots.push(run); run = []; } run.push(x); if (n === pts.length - 1) spots.push(run); });
  return { dy: dy, spots: spots.map(function (r) { var xm = (r[0] + r[r.length - 1]) / 2, j = Math.round(xm) - up.x0; return [xm, up.v[j]]; }) };
}

const seg = (a, b, cls, extra = "") => `<path class="${cls}"${extra} d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/>`;
const T = (x, y, t, cls = "ix-t", anchor = "") => `<text class="${cls}" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ""}>${t}</text>`;
const pin = (p, t) => `<g class="ix-pin" data-i="${t}"><circle cx="${p[0]}" cy="${p[1]}" r="10"/><text x="${p[0]}" y="${p[1] + 4}" text-anchor="middle">${t}</text></g>`;

/* frontal svg: the lower tooth and its inclines live in .ix-low, which the live code translates */
const frBody = [
  `<path class="od-sec" d="${smooth(MX, true)}"/><path class="od-cej" d="M84 36 Q170 44 258 40"/>`,
  ...Object.entries(FR_INCL.max).map(([k, [a, b]]) => seg(a, b, "fg-incl max ix-inc", ` data-i="${k}"`)),
  `<g class="ix-low"><path class="od-sec low" d="${smooth(MD, true)}"/><path class="od-cej" d="M118 286 Q190 278 262 288"/>`,
  ...Object.entries(FR_INCL.mand).map(([k, [a, b]]) => seg(a, b, "fg-incl mand ix-inc", ` data-i="${k}"`)),
  ...[3, 4, 6].map((k) => pin(FR_PIN[k], k)), `<path class="ix-dir" d="M0 0"/></g>`,
  ...[1, 2, 5].map((k) => pin(FR_PIN[k], k)),
  `<g class="ix-sparks"></g>`,
  T(270, 26, "Maxillary #3", "ix-t sm") + T(4, 300, "Mandibular", "ix-t sm") + T(4, 314, "#30", "ix-t sm"),
  T(4, 96, "BUCCAL", "ix-t sm") + T(4, 110, "(cheek)", "ix-t sm") + T(290, 96, "LINGUAL", "ix-t sm") + T(290, 110, "(tongue)", "ix-t sm"),
].join("");
const frSvg = figureSvg({ width: 380, height: 348, className: "ix-svg ix-fr",
  label: "Frontal section through the right first molars, #3 above and #30 below, buccal on the left. Upper inclines 1, 2 and 5 are blue; lower inclines 3, 4 and 6 are red. A slider moves the lower molar toward the cheek or the tongue and lights the inclines that can collide.",
  body: frBody });

const saBody = [
  `<path class="od-sec" d="${smooth(SU, true)}"/>`,
  ...Object.entries(SA_INCL.max).map(([k, [a, b]]) => seg(a, b, "fg-incl max ix-inc", ` data-i="${k}"`)),
  `<g class="ix-low"><path class="od-sec low" d="${smooth(SL, true)}"/>`,
  ...Object.entries(SA_INCL.mand).map(([k, [a, b]]) => seg(a, b, "fg-incl mand ix-inc", ` data-i="${k}"`)), `<path class="ix-dir" d="M0 0"/></g>`,
  `<g class="ix-sparks"></g>`,
  T(272, 40, "Maxillary #3", "ix-t sm") + T(272, 54, "MB · DB cusps", "ix-t sm ix-mut") + T(268, 270, "Mandibular #30", "ix-t sm") + T(268, 284, "MB · DB · D cusps", "ix-t sm ix-mut"),
  T(4, 120, "MESIAL", "ix-t sm") + T(4, 134, "(front)", "ix-t sm") + T(376, 120, "DISTAL", "ix-t sm", "end"),
].join("");
const saSvg = figureSvg({ width: 380, height: 340, className: "ix-svg ix-sa",
  label: "The right first molars seen from the cheek side, mesial at the left: #3 above with its mesiobuccal and distobuccal cusps, #30 below with three buccal cusps. The distal inclines of the upper cusps are blue and the mesial inclines of the lower cusps red. A slider slides the lower molar forward.",
  body: saBody });

const plate = plateHtml({ fig: "Fig 3", title: "Interferences", hint: "slide the lower molar", readout: "MIP",
  body: `<div class="am-svg ix-box" data-ixv="fr">${frSvg}</div><div class="am-svg ix-box" data-ixv="sa" hidden>${saSvg}</div>` });

const controls = `<div class="am-controls ix-tabs" role="tablist" aria-label="View"><button type="button" class="am-btn" role="tab" data-ixtab="fr" aria-pressed="true" aria-selected="true">Side to side (front view)</button><button type="button" class="am-btn" role="tab" data-ixtab="sa" aria-pressed="false" aria-selected="false">Protrusive (side view)</button></div>
<div class="ix-ctl" data-ixv="fr"><label class="am-slider"><span>cheek</span><input type="range" data-s="fr" min="-100" max="100" step="1" value="0" aria-label="Move the lower molar toward the cheek (right move) or the tongue (left move)"><span>tongue</span></label>
<div class="am-controls"><button type="button" class="am-btn" data-ixgo="-100">Right move (right side working)</button><button type="button" class="am-btn" data-ixgo="0">MIP</button><button type="button" class="am-btn" data-ixgo="100">Left move (right side non-working)</button></div></div>
<div class="ix-ctl" data-ixv="sa" hidden><label class="am-slider"><span>MIP</span><input type="range" data-s="sa" min="0" max="100" step="1" value="0" aria-label="Slide the lower molar forward (protrusive)"><span>forward</span></label>
<div class="am-controls"><button type="button" class="am-btn" data-ixgo="0">MIP</button><button type="button" class="am-btn" data-ixgo="100">Protrude</button></div></div>
<div class="am-controls"><button type="button" class="am-btn ix-guide" aria-pressed="false">Let the guidance lift the teeth apart</button></div>
<div class="am-stats" aria-live="polite"><span><b>Movement</b> <em data-r="move">none: teeth in MIP</em></span><span><b>Inclines that can collide</b> <em data-r="pair">none yet</em></span></div>
<p class="am-summary" aria-live="polite"></p>`;

const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L1 notes and Dr. Givan's help sheet method: draw the molars in MIP, then move the mandibular tooth in your mind's eye. Right molars, left move (right side non-working): the facial incline of the maxillary palatal cusp (1) meets the lingual incline of the mandibular buccal cusp (3). Right move (working): the lingual incline of the maxillary palatal cusp (2) meets the buccal incline of the mandibular lingual cusp (6), and the facial incline of the mandibular buccal cusp (4) meets the lingual incline of the maxillary buccal cusp (5), an interference if unwanted, group function if wanted. Protrusive: the distal inclines of the maxillary cusps meet the mesial inclines of the mandibular cusps.</li>
<li>The front view is the same section as the "Right first molars in MIP" figure; the side view is a schematic Class I buccal view (the MB cusp of #3 over the buccal groove of #30). In the model the lower tooth slides and rides down whatever it touches, so a spark shows each pair it has touching. On the working side 2 and 6 touch first and 4 and 5 join them at the end of the move (the maxillary buccal cusp is drawn slightly longer than in the static section for that); with shorter buccal cusps or steeper guidance, 4 and 5 would stay apart.</li>
<li>Movements are drawn as a pure slide in one plane, with schematic distances. In the mouth the condyles move too: the non-working condyle comes down the eminence, and canine or anterior guidance and Christensen's phenomenon (the space opening between the back teeth as the condyle drops in protrusion) normally lift the posterior teeth apart. "Let the guidance lift the teeth apart" shows that: no contact, no interference.</li></ul></details>`;

function ixLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var NS = "http://www.w3.org/2000/svg", view = "fr", guided = false;
  var tgt = { fr: 0, sa: 0 }, cur = { fr: 0, sa: 0 }, frame = 0, last = 0;
  var svg = { fr: root.querySelector(".ix-fr"), sa: root.querySelector(".ix-sa") };
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var readout = root.querySelector("[data-readout]"), sum = root.querySelector(".am-summary"), guideBtn = root.querySelector(".ix-guide");
  var NAME = { 1: "facial incline of the maxillary palatal cusp", 2: "lingual incline of the maxillary palatal cusp", 3: "lingual incline of the mandibular buccal cusp",
    4: "facial incline of the mandibular buccal cusp", 5: "lingual incline of the maxillary buccal cusp", 6: "buccal incline of the mandibular lingual cusp",
    mbd: "distal incline of the MB cusp of #3", dbd: "distal incline of the DB cusp of #3", dbm: "mesial incline of the DB cusp of #30", dm: "mesial incline of the distal cusp of #30" };
  function f(v) { return Math.round(v * 10) / 10; }
  function kind(v, x) { if (Math.abs(x) < 1.5) return null; return v === "sa" ? "pro" : x < 0 ? "work" : "non"; }
  function dxOf(v, s) { return v === "fr" ? s / 100 * D.fr.max : -s / 100 * D.sa.max; }
  function draw(v) {
    var s = svg[v], x = dxOf(v, cur[v]), R = D.ixRide(v, x, guided, D), k = kind(v, x), lit = {};
    s.querySelector(".ix-low").setAttribute("transform", "translate(" + f(x) + " " + f(R.dy) + ")");
    var pairs = k ? D[v].pairs[k] : [];
    pairs.forEach(function (p) { lit[p[0]] = lit[p[1]] = 1; });
    Array.prototype.forEach.call(s.querySelectorAll("[data-i]"), function (e) { var on = !!lit[e.getAttribute("data-i")]; e.classList.toggle("is-lit", on); e.classList.toggle("is-dim", !!k && !on); });
    var sp = s.querySelector(".ix-sparks"), h = "";
    R.spots.forEach(function (p) { h += '<circle class="ix-spark" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="6"/><circle class="ix-spark-c" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.4"/>'; });
    sp.innerHTML = h;
    /* direction arrow above the lower tooth */
    var dir = s.querySelector(".ix-dir");
    if (k) { var y = v === "fr" ? 250 : 200, x0 = v === "fr" ? 190 : 162, L = 26, sg = x < 0 ? -1 : 1, e = x0 + sg * L;
      dir.setAttribute("d", "M" + (x0 - sg * L) + " " + y + "L" + e + " " + y + "M" + e + " " + y + "L" + (e - sg * 8) + " " + (y - 5) + "M" + e + " " + y + "L" + (e - sg * 8) + " " + (y + 5)); }
    else dir.setAttribute("d", "M0 0");
    if (v !== view) return;
    var MOVE = { work: "right move: the right side is working (lower molar toward the cheek)", non: "left move: the right side is non-working (lower molar toward the tongue)", pro: "protrusive: the lower molar slides forward (mesial)" };
    rs.move.textContent = k ? MOVE[k] : "none: teeth in MIP";
    rs.pair.textContent = k ? pairs.map(function (p) { return v === "fr" ? p[0] + " with " + p[1] : NAME[p[0]].replace(" of #3", "") + " (#3) with " + NAME[p[1]].replace(" of #30", "") + " (#30)"; }).join("; ") : "none yet";
    if (readout) readout.textContent = !k ? "MIP" : guided ? "guided apart" : R.spots.length ? (R.spots.length > 1 ? R.spots.length + " contacts" : "1 contact") : "apart";
    var t;
    if (!k) t = v === "fr" ? "The right molars in MIP, cut front to back: cheek on the left, tongue on the right. Upper inclines are blue, lower ones red. Slide the lower molar toward the cheek (a right move) or the tongue (a left move) and watch which inclines run into each other." :
      "The same molars from the cheek side, mesial at the left. Slide the lower molar forward, as in protrusion, and watch which inclines meet.";
    else if (guided) t = k === "pro" ? "With the incisors guiding and the condyle coming down the eminence, the back teeth separate as the jaw moves forward (Christensen's phenomenon), so the inclines never touch: no protrusive interference." :
      "Canine (or anterior) guidance lifts the back teeth apart, so these inclines never touch. That is the goal: posterior teeth disengaged in every excursion, no interferences.";
    else if (k === "work") t = "Right working move: the lower molar slides toward the cheek. Its lingual cusp's buccal incline (6) runs into the lingual incline of the upper palatal cusp (2), and by the end of the move its buccal cusp's facial incline (4) meets the lingual incline of the upper buccal cusp (5). Wanted, that is group function; unwanted, a working interference.";
    else if (k === "non") t = "Left move, so the right side is non-working: the lower molar slides toward the tongue (the right condyle orbits forward, down and in). The lingual incline of its buccal cusp (3) rides up the facial incline of the upper palatal cusp (1): a non-working (balancing) interference.";
    else t = "Protrusive: the lower molar slides mesially under the upper one, so the MESIAL inclines of the mandibular cusps run into the DISTAL inclines of the maxillary cusps. If the back teeth don't separate, those are the contacts.";
    if (sum.textContent !== t) sum.textContent = t;
  }
  function tick(now) {
    frame = 0; if (!root.isConnected) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now, more = false;
    ["fr", "sa"].forEach(function (v) { var d = tgt[v] - cur[v]; if (Math.abs(d) < .3) { if (cur[v] !== tgt[v]) { cur[v] = tgt[v]; draw(v); } return; } cur[v] += d * Math.min(1, dt * 7); draw(v); more = true; });
    if (more) frame = requestAnimationFrame(tick);
  }
  var more = false;
  function go(v, s, instant) { tgt[v] = s; if (instant || reduce.matches) { cur[v] = s; draw(v); return; } last = 0; if (!frame) frame = requestAnimationFrame(tick); }
  root.querySelectorAll("input[data-s]").forEach(function (inp) { inp.addEventListener("input", function () { go(inp.getAttribute("data-s"), +inp.value, true); }); });
  root.querySelectorAll("[data-ixgo]").forEach(function (b) { b.addEventListener("click", function () { var v = b.closest("[data-ixv]").getAttribute("data-ixv"), s = +b.getAttribute("data-ixgo"); root.querySelector('input[data-s="' + v + '"]').value = s; go(v, s); }); });
  root.querySelectorAll("[data-ixtab]").forEach(function (b) { b.addEventListener("click", function () {
    view = b.getAttribute("data-ixtab");
    root.querySelectorAll("[data-ixtab]").forEach(function (x) { var on = x === b; x.setAttribute("aria-pressed", String(on)); x.setAttribute("aria-selected", String(on)); });
    root.querySelectorAll("[data-ixv]").forEach(function (x) { if (x.classList.contains("ix-box") || x.classList.contains("ix-ctl")) x.hidden = x.getAttribute("data-ixv") !== view; });
    draw(view);
  }); });
  guideBtn.addEventListener("click", function () { guided = !guided; guideBtn.setAttribute("aria-pressed", String(guided)); draw("fr"); draw("sa"); });
  draw("sa"); draw("fr");
}

const CSS = `
.anima .ix-box{max-width:460px;margin:0 auto}
.anima .ix-svg .ix-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .ix-svg .ix-t.sm{font-size:10.5px}
.anima .ix-svg .ix-mut{fill:var(--anatomy-muted)}
.anima .ix-inc{transition:opacity .2s,stroke-width .2s}
.anima .ix-inc.is-dim{opacity:.28}
.anima .ix-inc.is-lit{stroke-width:7.5}
.anima .ix-pin circle{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ix-pin text{fill:var(--anatomy-strong);font:600 11px var(--anatomy-mono)}
.anima .ix-pin.is-lit circle{stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .ix-pin.is-dim{opacity:.45}
.anima .ix-spark{fill:var(--anatomy-lit);opacity:.28}
.anima .ix-spark-c{fill:var(--anatomy-lit)}
.anima .ix-dir{fill:none;stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.anima .ix-tabs .am-btn{white-space:nowrap}
@media (prefers-reduced-motion:reduce){.anima .ix-inc{transition:none}}
`;

export function interferences() {
  return {
    id: "interferences", lec: "review",
    title: "Working and non-working interferences",
    caption: "Slide the lower right molar toward the cheek (a right move) or the tongue (a left move) and the inclines that can collide light up and name themselves; the side view does the same for protrusion.",
    html: `<div class="anima" data-anima="interferences">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: ixLive.toString(),
    helpers: [ixRide],
    data: D,
  };
}
