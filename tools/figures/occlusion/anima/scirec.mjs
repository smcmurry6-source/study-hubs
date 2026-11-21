// Fig 13: why protrusive records are preferred for setting the SCI (Occlusion L6, "Eccentric records"). Left, the joint
// from the side (the patient facing left): the condyle slides forward and down the posterior slope of the articular
// eminence at the patient's angle; beside that path, the steeper path a lateral record reads (down the medial wall) and
// the angle the articulator is set to. Right, an upper and a lower molar restored on that articulator, in buccal view:
// their cusp inclines are as steep as the setting, so they just clear when the jaw moves along that angle. Then the
// lower molar moves forward and down along the patient's real path. Built shallower than the patient, the protrusive
// inclines (the upper's distal, the lower's mesial) separate: disclusion. Built steeper (from a lateral record), they run
// into each other: an interference. The angles 20 and 30 degrees and the 20-60 degree range (commonly 35-40) are the
// notes'; the lateral path is drawn steeper with no number (the notes give none).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 346;
const D = {
  W, H, LAT: 10, /* schematic: how much steeper the lateral record's reading is drawn */
  J: [200, 96], R: 17, G: 3, /* the seated condyle's center and radius in the joint panel, the joint space */
  RUNJ: 44, SLOPE: 72, RAY: 126, /* px the condyle travels, the eminence's posterior slope, the paths drawn */
  BX0: 18, BX1: 268, /* the joint panel's left edge and the bone's right edge */
  CW: 24, XA: 340, YC: 146, KX: 290, /* the molars: half a cusp's width, the upper molar's mesial end, the occlusal plane; their key */
  CROWN: 26, ROOT_U: 50, ROOT_L: 46, /* px from the marginal ridges to the cervical line, and the roots */
};

function scModel(P, set, D) {
  var S = set === "prot" ? P : set === "lat" ? P + D.LAT : set === "a30" ? 30 : 20;
  var r = Math.PI / 180, slope = Math.tan(P * r) - Math.tan(S * r);
  return { P: P, S: S, slope: slope, out: slope > 0.02 ? "clear" : slope < -0.005 ? "hit" : "match" };
}

function scSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", m = D.scModel(st.P, st.set, D), r = Math.PI / 180, u = st.u;
  function tx(x, y, t, cls, a) { return '<text class="sc-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function P2(p) { return f(p[0]) + " " + f(p[1]); }
  function poly(pts) { return "M" + pts.map(P2).join("L") + "Z"; }
  function add(p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k]; }
  function dir(a) { return [-Math.cos(a * r), Math.sin(a * r)]; } /* forward (left) and down at a degrees */
  /* corner cutting on a closed outline; a point [x, y, 1] stays sharp (cusp tips, the cervical line, arcs) */
  function round(pts, it) {
    var a = pts;
    for (var k = 0; k < it; k++) {
      var out = [], nn = a.length;
      for (var i = 0; i < nn; i++) {
        var v = a[i], pv = a[(i - 1 + nn) % nn], nv = a[(i + 1) % nn];
        if (v[2]) { out.push(v); continue; }
        out.push([v[0] + (pv[0] - v[0]) * 0.25, v[1] + (pv[1] - v[1]) * 0.25], [v[0] + (nv[0] - v[0]) * 0.25, v[1] + (nv[1] - v[1]) * 0.25]);
      }
      a = out;
    }
    return a;
  }
  /* ---- the joint (patient facing left) ---- */
  var J = D.J, R = D.R, RG = D.R + D.G, d = dir(m.P), n = [-Math.sin(m.P * r), -Math.cos(m.P * r)];
  var an = Math.atan2(n[1], n[0]), T0 = add(J, n, RG), T1 = add(T0, d, D.SLOPE), cr = add(T1, d, 9);
  /* the anterior slope climbs forward from the crest to the arch's lower border */
  var yA = J[1] + 8, T2 = [cr[0] - Math.max(5, cr[1] - yA) / Math.tan(44 * r), yA];
  /* the temporal bone, cut off above: behind, the postglenoid process; the fossa's roof over the condyle; the eminence's
     posterior slope at the patient's angle, its crest and anterior slope; forward, the arch's lower border */
  var bone = [[D.BX1, 40, 1], [D.BX1, J[1] - 12], [J[0] + RG + 22, J[1] - 9], [J[0] + RG + 10, J[1] + 2], [J[0] + RG + 6, J[1] + 11], [J[0] + RG + 1, J[1] + 7], [J[0] + RG, J[1], 1]];
  for (var k = 1; k <= 14; k++) { var a = an * k / 14; bone.push([J[0] + RG * Math.cos(a), J[1] + RG * Math.sin(a), 1]); }
  bone.push([T1[0], T1[1], 1], cr, T2, [D.BX0 + 34, yA + 1], [D.BX0, yA - 1, 1], [D.BX0, 44, 1], [70, 39], [130, 45], [190, 37], [236, 43]);
  o += '<path class="sc-bone hot" data-info="The articular eminence of the temporal bone, with the glenoid fossa behind it. In protrusion the condyle slides forward and down the eminence\'s posterior slope; that slope is the patient\'s sagittal condylar inclination (SCI)." d="' + poly(round(bone, 3)) + '"/>';
  /* the condyle and the top of the ramus, slid u of the way down the path; the seated condyle dashed */
  var cu = add(J, d, u * D.RUNJ), cd = [];
  for (k = 0; k <= 12; k++) { var b = (22 - k * 222 / 12) * r; cd.push([cu[0] + R * Math.cos(b), cu[1] + R * Math.sin(b), 1]); }
  cd.push([cu[0] - 13, cu[1] + 14], [cu[0] - 9, cu[1] + 25], [cu[0] - 15, cu[1] + 46], [cu[0] - 24, cu[1] + 62], [cu[0] - 27, cu[1] + 70, 1], [cu[0] - 6, cu[1] + 67], [cu[0] + 15, cu[1] + 72, 1], [cu[0] + 14, cu[1] + 48], [cu[0] + 12, cu[1] + 27]);
  if (u > 0.01) o += '<circle class="sc-condyle-ghost" cx="' + f(J[0]) + '" cy="' + f(J[1]) + '" r="' + R + '"/>';
  o += '<path class="sc-condyle hot" data-info="The condyle, seated in CR (dashed); in protrusion it slides forward and down the eminence, along the patient\'s path." d="' + poly(round(cd, 3)) + '"/>';
  /* the horizontal reference and the three paths from the seated condyle */
  o += '<path class="sc-hz" d="M' + f(J[0] + 40) + " " + J[1] + "L" + D.BX0 + " " + J[1] + '"/>' + tx(D.BX0 + 6, J[1] - 6, "horizontal reference", "sc-cap", "start");
  [[m.P + D.LAT, "sc-path-lat", 0], [m.P, "sc-path-pat", 0], [m.S, "sc-path-art", 10]].forEach(function (ry) { o += '<path class="' + ry[1] + '" d="M' + P2(J) + "L" + P2(add(J, dir(ry[0]), D.RAY + ry[2])) + '"/>'; });
  /* the patient's angle to the reference */
  var ar = 54, a1 = add(J, [-1, 0], ar), a2 = add(J, d, ar), am = add(J, dir(m.P / 2), ar + 13);
  o += '<path class="sc-ang" d="M' + P2(a1) + "A" + ar + " " + ar + " 0 0 0 " + P2(a2) + '"/>' + tx(am[0], am[1] + 4, m.P + "°", "sc-pat", "middle");
  /* key */
  var ky = 270;
  o += '<path class="sc-path-pat" d="M' + D.BX0 + " " + (ky - 4) + 'h22"/>' + tx(D.BX0 + 28, ky, "patient's path: " + m.P + "°", "sc-key sc-pat", "start");
  o += '<path class="sc-path-lat" d="M' + D.BX0 + " " + (ky + 13) + 'h22"/>' + tx(D.BX0 + 28, ky + 17, "lateral record reads steeper", "sc-key sc-lat", "start");
  o += '<path class="sc-path-art" d="M' + D.BX0 + " " + (ky + 30) + 'h22"/>' + tx(D.BX0 + 28, ky + 34, "articulator: " + (st.set === "lat" ? "lateral reading" : st.set === "prot" ? m.S + "° (same)" : m.S + "°"), "sc-key sc-art", "start");
  o += tx(D.BX0, D.H - 8, "both views from the side, the patient facing left (← anterior)", "sc-cap", "start");

  /* ---- an upper and a lower molar built on the articulator, buccal view, mesial on the left: each cusp incline is as
     steep as the setting S, so over w (half a cusp's width) it rises w·tan S from a cusp tip to the groove ---- */
  var w = D.CW, xa = D.XA, yc = D.YC, tS = Math.tan(m.S * r), tP = Math.tan(m.P * r), h = w * tS / 2;
  /* in the mouth the lower molar moves along the patient's path, until its cusp tip has gone half a cusp forward */
  var run = w * u, mv = [-run, run * tP];
  /* x0: the mesial end; s: 1 upper (roots up), -1 lower; v runs from the occlusal plane toward the roots */
  function molar(x0, s, RL, v0) {
    var L = 4 * w, cv = h + D.CROWN, Y = function (v) { return yc - s * v; };
    var cw = function (p) { return [x0 + p[0] + v0[0], Y(p[1]) + v0[1], p[2]]; };
    var c = [[0, h], [w, -h, 1], [2 * w, h, 1], [3 * w, -h, 1], [L, h], [L + 2, h + 7], [L + 1.5, h + 15], [L - 2, h + 22], [L - 8, cv, 1], [2 * w, cv + 2], [8, cv, 1], [2, h + 22], [-1.5, h + 15], [-2, h + 7]];
    /* two roots below the cervical line, tapering to rounded apices, the furcation a little way down */
    var t = [[8, 0, 1], [6.5, 10], [7.5, 24], [10, RL - 12], [13, RL - 3], [15, RL - 0.8], [17.5, RL], [20, RL - 0.8], [22, RL - 3], [26, RL - 14], [30, 28], [34, 18], [38, 13], [43, 11.5]];
    t = t.concat([[2 * w, 11]], t.slice().reverse().map(function (p) { return [L - p[0], p[1], p[2]]; }), [[2 * w, -6, 1]]);
    var q = function (p) { return cw([p[0], cv + p[1], p[2]]); };
    var out = { crown: round(c.map(cw), 3), root: round(t.map(q), 3) };
    return out;
  }
  /* Class I: the lower molar sits half a cusp mesial, its cusp tips in the upper's buccal groove and embrasures */
  var U = molar(xa, 1, D.ROOT_U, [0, 0]), Lo = molar(xa - w, -1, D.ROOT_L, mv);
  o += '<g class="hot" data-info="Upper molar, built on the articulator: its cusp inclines are as steep as the condylar setting, so its cusp height and fossa depth follow the SCI it was built to."><path class="sc-root" d="' + poly(U.root) + '"/><path class="sc-tooth" d="' + poly(U.crown) + '"/></g>';
  o += '<g class="hot" data-info="Lower molar, built on the same articulator. In the mouth it moves forward and down with the mandible along the patient\'s own path; its cusps\' mesial inclines slide on the upper molar\'s distal inclines."><path class="sc-root" d="' + poly(Lo.root) + '"/><path class="sc-tooth" d="' + poly(Lo.crown) + '"/></g>';
  /* the upper crown's outline again, so its cusps show where the lower crown runs into them */
  o += '<path class="sc-ol" d="' + poly(U.crown) + '"/>';
  /* from the upper's groove: its distal incline, built at S, and the path the lower cusp tip takes, at P. The wedge
     between them is the space the move opens (green) or the upper tooth the cusp has to cut through (red) */
  var i1 = [xa + 2 * w, yc - h], i0 = [xa + w, yc + h], ti = add(i1, mv, 1), qi = [ti[0], i1[1] + run * tS];
  o += '<g class="hot" data-info="The blue incline was built at the articulator\'s angle; the dark line is the path the lower cusp tip actually takes in this patient. If the incline is steeper than the path, the cusp runs into the upper tooth: an interference. If it is shallower, the teeth separate: disclusion.">';
  o += '<path class="sc-incline" d="M' + P2(i1) + "L" + P2(i0) + '"/>';
  if (run > 1 && Math.abs(m.P - m.S) > 0.4) o += '<path class="' + (m.out === "hit" ? "sc-overlap" : "sc-space") + '" d="' + poly([i1, qi, ti]) + '"/>';
  /* where the lower cusp is inside the upper one: its cusp triangle clipped by the upper mesial cusp's */
  if (m.out === "hit" && run > 1) {
    var clip = function (sub, win) {
      for (var j = 0; j < win.length && sub.length; j++) {
        var A = win[j], B = win[(j + 1) % win.length], inn = function (p) { return (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]) >= 0; }, res = [];
        for (var i = 0; i < sub.length; i++) {
          var p = sub[i], q = sub[(i + 1) % sub.length], ip = inn(p), iq = inn(q);
          if (ip) res.push(p);
          if (ip !== iq) { var dx = q[0] - p[0], dy = q[1] - p[1], den = (B[0] - A[0]) * dy - (B[1] - A[1]) * dx, k = ((B[1] - A[1]) * (p[0] - A[0]) - (B[0] - A[0]) * (p[1] - A[1])) / den; res.push([p[0] + dx * k, p[1] + dy * k]); }
        }
        sub = res;
      }
      return sub;
    };
    var ov = clip([ti, [ti[0] + w, ti[1] + 2 * h], [ti[0] - w, ti[1] + 2 * h]], [i0, [xa, yc - h], i1]);
    if (ov.length > 2) o += '<path class="sc-hitzone" d="' + poly(ov) + '"/>';
  }
  if (run > 1) o += '<path class="sc-cusp" d="M' + P2(i1) + "L" + P2(ti) + '"/>';
  o += '<circle class="sc-tip" cx="' + f(ti[0]) + '" cy="' + f(ti[1]) + '" r="2.4"/></g>';
  /* labels, the key and the result */
  function two(x, y, a, b) { return '<text class="sc-t sc-cap" x="' + f(x) + '" y="' + f(y) + '"><tspan x="' + f(x) + '">' + a + '</tspan><tspan x="' + f(x) + '" dy="1.15em">' + b + "</tspan></text>"; }
  o += two(xa + 4 * w + 8, yc - h - D.CROWN - 8, "upper", "molar") + two(xa + 3 * w + 8 + mv[0], yc + h + D.CROWN + 12 + mv[1], "lower", "molar");
  var kx = D.KX, k2 = D.H - 42;
  o += '<path class="sc-incline" d="M' + kx + " " + (k2 - 4) + 'h22"/>' + tx(kx + 28, k2, "upper incline: " + (st.set === "lat" ? "steeper" : m.S + "°"), "sc-key sc-art", "start");
  o += '<path class="sc-cusp" d="M' + kx + " " + (k2 + 12) + 'h22"/>' + tx(kx + 28, k2 + 16, "lower cusp's path: " + m.P + "°", "sc-key sc-pat", "start");
  var res = u < 0.05 ? ["closed: the inclines touch", "sc-match"] : m.out === "clear" ? ["discludes in the mouth", "sc-clear"] : m.out === "hit" ? ["interference in the mouth", "sc-hit"] : ["glides: just matches", "sc-match"];
  o += tx(xa + 2 * w, 22, res[0], "sc-res " + res[1], "middle");
  return o;
}

const TEXT = {
  prot: "Set from a protrusive record: the articulator copies the patient's eminence, so the crowns' inclines match the path they will travel in the mouth. One record sets both sides, and contacts it avoids in protrusion are also avoided in right and left laterotrusion.",
  lat: "Set from a lateral record: that record measures the path down the medial wall, which is steeper than the eminence. Crowns built for the steeper angle get taller cusps and steeper inclines than the patient's protrusive path can clear, so they hit in the mouth. That's why protrusive records are preferred.",
  a30: "Arbitrary 30°: most patients' protrusive angles run about 20-60°, commonly 35-40°, so crowns built at 30° are shallower than most patients and still disclude, while keeping decent anatomy.",
  a20: "Arbitrary 20°: it discludes almost everyone, but the cusps come out too shallow (\"I don't like it\"): poor anatomy and chewing efficiency. 30° is the usual compromise.",
};

const svg = figureSvg({ width: W, height: H, className: "sc-svg", label: "Left, the condyle's protrusive path down the eminence, a steeper lateral reading and the articulator's setting; right, an upper and a lower molar built at that setting meeting the patient's real path.", body: scSvg({ P: 38, set: "prot", u: 1 }, Object.assign({ scModel }, D)) });
const plate = plateHtml({ fig: "Fig 13", title: "Which SCI to build to", hint: "pick a setting · protrude", readout: "patient 38° · set 38°", body: `<div class="am-svg sc-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>patient 20°</span><input type="range" min="20" max="60" step="1" value="38" aria-label="The patient's eminence angle"><span>60°</span></label></div>
<div class="am-controls" role="group" aria-label="Articulator setting"><button type="button" class="am-btn" data-scset="prot" aria-pressed="true">From a protrusive record</button><button type="button" class="am-btn" data-scset="lat" aria-pressed="false">From a lateral record</button><button type="button" class="am-btn" data-scset="a30" aria-pressed="false">Arbitrary 30°</button><button type="button" class="am-btn" data-scset="a20" aria-pressed="false">Arbitrary 20°</button><button type="button" class="am-btn" data-scplay>Protrude</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the eminence, the condyle, a molar or the blue incline.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slides and the 10/22 recording): SCI controls posterior disclusion and cusp height; a protrusive record sets both sides and is preferred because the lateral record's SCI (down the medial wall) is steeper; arbitrary settings of 20-30° are common for fixed work, with 30° working because most patients are steeper (about 20-60°, commonly 35-40°) and 20° making the cusps too shallow. If the articulator is shallower than the patient, the patient just gets more disclusion; if it is steeper, the restoration may hit.</li>
<li>Schematic: the molars' buccal cusps are a regular zigzag whose inclines are exactly as steep as the setting, measured from the same horizontal reference as the condylar path, and only the condylar guidance acts (no anterior guidance), so the lower molar's cusp tip moves along the patient's condylar angle. The incline shown is the upper's distal-facing one, which the lower cusp's mesial-facing incline slides on. Real cusps are shorter and rounder; the cusps here grow taller with the setting to show that the SCI sets cusp height. The lateral reading is drawn 10° steeper only to show "steeper" (the notes give no number). Educational, not clinical guidance.</li></ul></details>`;

function scLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sc-svg"), slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), play = root.querySelector("[data-scplay]");
  var st = { P: 38, set: "prot", u: 1 }, raf = 0;
  function draw() {
    svg.innerHTML = D.scSvg(st, D);
    var m = D.scModel(st.P, st.set, D), txt = D.TEXT[st.set];
    if ((st.set === "a30" || st.set === "a20") && m.out === "hit") txt = "Arbitrary " + m.S + "° on a patient flatter than " + m.S + "°: the crowns are steeper than this patient's eminence, so they hit. That's rare: most patients are steeper (about 20-60°, commonly 35-40°).";
    else if ((st.set === "a30" || st.set === "a20") && m.out === "match") txt = "Arbitrary " + m.S + "° on a patient whose eminence is also " + m.S + "°: the crowns' inclines just match the path, gliding with no disclusion to spare. Steeper patients, the usual case, get disclusion.";
    sum.textContent = txt;
    if (readout) readout.textContent = "patient " + st.P + "° · set " + (st.set === "lat" ? "steeper" : m.S + "°");
  }
  function protrude() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; draw(); return; }
    var t0 = performance.now();
    function step(now) { st.u = Math.min(1, (now - t0) / 1600); draw(); if (st.u < 1) raf = requestAnimationFrame(step); }
    st.u = 0; raf = requestAnimationFrame(step);
  }
  slider.addEventListener("input", function () { st.P = +slider.value; draw(); });
  root.querySelectorAll("[data-scset]").forEach(function (b) { b.addEventListener("click", function () { st.set = b.getAttribute("data-scset"); root.querySelectorAll("[data-scset]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); protrude(); }); });
  play.addEventListener("click", protrude);
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .sc-box{max-width:580px;margin:0 auto}
.anima .sc-svg .sc-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .sc-svg .sc-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .sc-svg .sc-key{font-size:11px}
.anima .sc-svg .sc-pat{fill:var(--anatomy-hi);font-weight:600}
.anima .sc-svg .sc-lat{fill:var(--tm-vessel)}
.anima .sc-svg .sc-art{fill:var(--anatomy-lit);font-weight:600}
.anima .sc-svg .sc-res{font-size:12.5px;font-weight:700}
.anima .sc-svg .sc-clear{fill:#2f8a5b}
.anima .sc-svg .sc-hit{fill:var(--tm-vessel)}
.anima .sc-svg .sc-match{fill:var(--anatomy-hi)}
@media (max-width:560px){.anima .sc-svg .sc-t{font-size:13.5px}.anima .sc-svg .sc-cap,.anima .sc-svg .sc-key{font-size:12.5px}.anima .sc-svg .sc-res{font-size:14px}}
.anima .sc-svg .sc-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1.2;stroke-linejoin:round}
.anima .sc-svg .sc-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round}
.anima .sc-svg .sc-condyle-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:4 3;vector-effect:none}
.anima .sc-svg .sc-hz{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 3;vector-effect:none}
.anima .sc-svg .sc-ang{fill:none;stroke:var(--anatomy-hi);stroke-width:1}
.anima .sc-svg .sc-path-pat{fill:none;stroke:var(--anatomy-hi);stroke-width:2.2;stroke-linecap:round}
.anima .sc-svg .sc-path-lat{fill:none;stroke:var(--tm-vessel);stroke-width:1.6;stroke-dasharray:5 4;vector-effect:none}
.anima .sc-svg .sc-path-art{fill:none;stroke:var(--anatomy-lit);stroke-width:2.2;stroke-dasharray:2 3;stroke-linecap:round;vector-effect:none}
.anima .sc-svg .sc-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round}
.anima .sc-svg .sc-root{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .sc-svg .sc-ol{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round;pointer-events:none}
.anima .sc-svg .sc-incline{fill:none;stroke:var(--anatomy-lit);stroke-width:3.4;stroke-linecap:round}
.anima .sc-svg .sc-cusp{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linecap:round}
.anima .sc-svg .sc-cusp-head{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.anima .sc-svg .sc-tip{fill:var(--anatomy-hi)}
.anima .sc-svg .sc-space{fill:#2f8a5b;opacity:.45}
.anima .sc-svg .sc-overlap{fill:var(--tm-vessel);opacity:.35}
.anima .sc-svg .sc-hitzone{fill:var(--tm-vessel);opacity:.85}
`;

export function scirec() {
  return {
    id: "scirec", lec: "instruments",
    title: "Why protrusive records are preferred",
    caption: "Set the articulator from a protrusive record, a lateral record, or an arbitrary 30° or 20°, then protrude the patient's jaw along their real eminence and see whether molars built there disclude or hit.",
    html: `<div class="anima" data-anima="scirec">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: scLive.toString(),
    helpers: [scModel, scSvg],
    data: Object.assign({ TEXT }, D),
  };
}
