// Fig: peri-implant health, mucositis and peri-implantitis (Periodontology S7, Dr. Kaur, Oct 29 class + slides).
// A buccolingual section through the ridge with a bone-level implant in place, drawn to one scale (15 px = 1 mm):
// a 4.1 x 10 mm tapered implant with its threads in bone, a transmucosal abutment, a cemented crown with its emergence
// profile, the buccal and lingual plates, and the peri-implant mucosa. A flexible plastic probe sits in the buccal
// sulcus and bends around the crown's height of contour, as a plastic implant probe does.
// The three 2017 World Workshop states, from the notes:
//   health: no inflammation, no bleeding or suppuration on gentle probing, probing depth at this implant's own baseline
//     (4 mm here: a healthy implant can probe over 3 mm when it sits deep under thick tissue), bone at the level left by
//     initial remodeling (about 2 mm below the platform in the first year, Dr. Kaur's number in class);
//   mucositis: red, swollen mucosa, profuse bleeding, plaque in the sulcus, a deeper probing depth from the swelling
//     (the margin rises and the probe goes further into inflamed tissue), bone unchanged;
//   peri-implantitis: the same plus suppuration and bone lost beyond the remodeling line, a crater around the implant
//     filled with inflamed soft tissue, plaque on the exposed threads.
// Soft-tissue dimensions are typical (about 2 mm of barrier epithelium and 1-1.5 mm of connective tissue above the
// bone); the exact depths are illustrative, not one patient's.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 15, W = 460, H = 400, CX = 228, PY = 182;

/* Catmull-Rom through mm points, sampled n steps per segment (dense points, so tissue boundaries can be shared) */
function piCR(p, n) {
  var o = [], N = p.length;
  for (var i = 0; i < N - 1; i++) {
    var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || p[i + 1];
    for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * t3),
              .5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * t3)]); }
  }
  o.push(p[N - 1]); return o;
}
/* mm points (x from the implant axis, y down from the platform) to a path in px */
function piD(D, p, close) {
  var o = "";
  for (var i = 0; i < p.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + p[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + p[i][1] * D.S) * 10) / 10;
  return o + (close ? "Z" : "");
}
/* the implant's thread-crest radius (mm): 4.1 mm at the collar, tapering toward the apex */
function piRo(y) { return y < .8 ? 2.05 : 2.05 - .32 * Math.min(1, (y - .8) / 8.4); }
/* half-width of the hard surface (crown, abutment, implant) at height y on the buccal (-1) or lingual (+1) side */
function piHw(y, side) {
  if (y >= 0) return piRo(y);
  if (y >= -2.5) return 2.05 + .25 * (-y / 2.5);
  if (side < 0) return 2.3 + 1.7 * Math.pow(Math.min(1, (-y - 2.5) / 2.1), 1.4);
  return 2.3 + 1.6 * Math.pow(Math.min(1, (-y - 2.5) / 3.7), 1.3);
}
/* one side of the bone (buccal -1, lingual +1) from the implant axis out over the crest and down the plate.
   b = 0: crest at the remodeling line, 2 mm below the platform; b = 1: a crater 3.5 mm deeper at the implant */
function piBone(b, side) {
  var k = side, L = side > 0, H = [2.0, 2.03, 2.08, 2.15, 2.3, 2.75, 4.0], P = L ? [5.5, 5.2, 4.4, 3.5, 2.95, 3.05, 4.0] : [5.5, 5.25, 4.5, 3.6, 3.05, 3.15, 4.0];
  var xs = L ? [2.05, 2.5, 2.95, 3.35, 3.95, 4.45, 4.85] : [2.05, 2.45, 2.85, 3.2, 3.6, 4.05, 4.4], pts = [[0, 2 + 3.5 * b]];
  for (var i = 0; i < xs.length; i++) pts.push([k * xs[i], H[i] + (P[i] - H[i]) * b]);
  pts.push([k * (L ? 5.5 : 5.0), 8], [k * (L ? 6.6 : 5.6), 12.5]);
  return piCR(pts, 5);
}

function piDyn(v, t, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var m = v.m, tip = v.tip, s = v.swell, crest = 2 + 3.5 * v.bone;
  var bB = piBone(v.bone, -1), bL = piBone(v.bone, 1), outline = bB.slice().reverse().concat(bL);
  /* bone: trabecular fill, marrow spaces, a cortical rim (its outer half sits under the mucosa) */
  o += '<g class="hot" data-info="Alveolar bone in section: the buccal and lingual plates, with marrow spaces inside. After loading, the crest remodels about 2 mm below the platform and levels off within about the first year: physiologic. Bone lost beyond that line is pathologic, and that is what makes it peri-implantitis.">';
  o += '<path class="pi-bone" d="' + piD(D, outline, true) + '"/>' + D.MARROW + '<path class="pi-cort" d="' + piD(D, outline, false) + '"/></g>';
  /* the probe: tip at the base of the sulcus or pocket, through the margin beside the crown, then bowed around the
     crown's height of contour (a plastic implant probe flexes) */
  var hwM = piHw(m, -1), T = [-(piRo(tip) + .22), tip], E = [-(hwM + .3), m], B0 = [E[0] - .55, m - .45];
  var pr = piCR([T, [(T[0] + E[0]) / 2, (T[1] + E[1]) / 2], E, B0, [-4.75, -5.6], [-5.6, -8], [-7.7, -13.5]], 8);
  /* the open sulcus (or pocket) between the probe and the abutment */
  var wedge = pr.slice(0, 17).reverse(); wedge.push([0, T[1]]); wedge.unshift([0, m]);
  /* mucosa: buccal (around the probe) and lingual, its inner side on the bone and against the abutment */
  var hwL = piHw(m, 1);
  var outB = piCR([[-7.0, 12.5], [-6.7 - .3 * s, 8], [-6.6 - .6 * s, 4], [-6.65 - .8 * s, 1.2], [-hwM - 1.75 - .6 * s, m + 1.5], [-hwM - .8 - .3 * s, m + .42], [E[0] - .25, m]], 6);
  var gumB = outB.concat([[T[0] - .27, T[1]], [0, T[1]]], bB);
  var outL = piCR([[7.9, 12.5], [7.1 + .3 * s, 8], [6.85 + .6 * s, 4], [6.8 + .8 * s, 1.2], [hwL + 1.65 + .6 * s, m + 1.5], [hwL + .75 + .3 * s, m + .42], [hwL + .04, m]], 6);
  var gumL = outL.concat([[0, m]], bL);
  var fill = 'style="fill:color-mix(in srgb, var(--pd-red) ' + Math.round(v.red * 78) + '%, var(--pd-gum))"';
  o += '<g class="hot" data-info="Peri-implant mucosa: about 2 mm of barrier epithelium lining the sulcus and 1-1.5 mm of connective tissue above the bone. Healthy: no change in color, no edema, no redness. Inflamed (mucositis, peri-implantitis): red and swollen, and the extra volume alone makes the pocket probe deeper.">';
  o += '<path class="pi-gum" ' + fill + ' d="' + piD(D, gumB, true) + '"/><path class="pi-gum" ' + fill + ' d="' + piD(D, gumL, true) + '"/></g>';
  o += '<path class="pi-sulc" d="' + piD(D, wedge, true) + '"/>';
  /* profuse bleeding fills the sulcus as you probe (drawn here, under the implant and crown) */
  if (v.bleed > .02) o += '<path class="pi-blood" opacity="' + f(.8 * v.bleed) + '" d="' + piD(D, wedge, true) + '"/>';
  /* reference lines: the platform and the line of initial remodeling (drawn before the implant hides their middle) */
  o += '<path class="pi-ref" d="M' + X(-4.05) + " " + Y(2) + "H" + X(-2) + "M" + X(2) + " " + Y(2) + "H" + X(7.75) + '"/><path class="pi-plat" d="M' + X(2) + " " + Y(0) + "H" + X(7.75) + '"/>';
  /* implant, abutment, crown (fixed geometry, built once) */
  o += D.IMPLANT;
  /* plaque biofilm on the abutment and the exposed implant surface in the sulcus or pocket */
  if (v.bio > .02) {
    var dep = m + .15 + v.bio, bb = [], bl = [];
    for (var y = m + .2; y <= dep; y += .2) { bb.push([-(piHw(y, -1) + .08), y]); bl.push([piHw(y, 1) + .08, y]); }
    if (bb.length > 1) o += '<g class="hot" data-info="Plaque biofilm on the abutment and, once bone is lost, on the exposed rough threads. Peri-implant disease starts from bacteria; the rough surface that osteoblasts love holds plaque just as well."><path class="pi-bio" opacity="' + f(Math.min(1, v.bio)) + '" d="' + piD(D, bb, false) + piD(D, bl, false) + '"/></g>';
  }
  o += '<g class="hot" data-info="Plastic implant probe, light force (about 0.25 N). It flexes around the crown\'s contour to reach the sulcus. Compare each reading with this implant\'s own baseline: a depth only grows from measurement error, swelling, or true bone loss."><path class="pi-probe" d="' + piD(D, pr, false) + '"/>';
  var acc = 0, next = 3;
  for (var i = 1; i < pr.length && next <= 9; i++) {
    var dx = pr[i][0] - pr[i - 1][0], dy = pr[i][1] - pr[i - 1][1], dl = Math.sqrt(dx * dx + dy * dy);
    if (acc + dl >= next) { var u = (next - acc) / dl, px = pr[i - 1][0] + dx * u, py = pr[i - 1][1] + dy * u, nx = -dy / dl * .25, ny = dx / dl * .25;
      o += '<path class="pi-mark" d="M' + X(px - nx) + " " + Y(py - ny) + "L" + X(px + nx) + " " + Y(py + ny) + '"/>'; next += 3; i--; continue; }
    acc += dl;
  }
  o += "</g>";
  /* bleeding at the buccal margin, suppuration from the lingual sulcus */
  if (v.bleed > .02) {
    var u2 = (t / 1700) % 1, a = outB[outB.length - 3], b2 = outB[outB.length - 9] || a;
    o += '<ellipse class="pi-blood" cx="' + X(E[0] - .1) + '" cy="' + Y(m - .1) + '" rx="' + f(6.5 * v.bleed) + '" ry="' + f(3.4 * v.bleed) + '"/>';
    o += '<path class="pi-blood" opacity="' + f(v.bleed * Math.min(1, (1 - u2) * 2.5, u2 * 8)) + '" d="M' + X(a[0] + (b2[0] - a[0]) * u2) + " " + Y(a[1] + (b2[1] - a[1]) * u2 - .3) + "q3 5 0 7q-3-2 0-7Z" + '"/>';
  }
  if (v.pus > .02) o += '<g class="hot" data-info="Suppuration (pus) from the pocket: a sign of active disease. Whatever the long-term plan, it needs a response now: debride, and at a deep site perhaps a local antibiotic."><ellipse class="pi-pus" cx="' + X(hwL + .22) + '" cy="' + Y(m - .18) + '" rx="' + f(5.5 * v.pus) + '" ry="' + f(3.6 * v.pus) + '"/></g>';
  /* measurements: the probing depth on the buccal, the remodeling and any bone loss on the lingual */
  var bx = -8.6, pd = Math.round((tip - m) * 2) / 2;
  o += '<path class="pi-guide" d="M' + X(bx) + " " + Y(m) + "H" + X(E[0] - .55) + "M" + X(bx) + " " + Y(tip) + "H" + X(T[0]) + '"/><circle class="pi-dot" cx="' + X(E[0] - .55) + '" cy="' + Y(m) + '" r="2"/><circle class="pi-dot pi-dot-tip" cx="' + X(T[0]) + '" cy="' + Y(tip) + '" r="2.2"/>';
  o += '<path class="pi-brk" d="M' + X(bx) + " " + Y(m) + "V" + Y(tip) + "M" + X(bx - .3) + " " + Y(m) + "H" + X(bx + .3) + "M" + X(bx - .3) + " " + Y(tip) + "H" + X(bx + .3) + '"/>';
  var my = (m + tip) / 2;
  o += '<text class="pi-t pi-pd" x="' + X(bx - .55) + '" y="' + Y(my) + '" text-anchor="end">PD ' + pd + " mm</text>";
  o += '<text class="pi-t pi-small" x="' + X(bx - .55) + '" y="' + f(D.PY + my * D.S + 14) + '" text-anchor="end">' + (pd > 4.2 ? "baseline 4" : "= baseline") + "</text>";
  var rx = 7.75;
  o += '<path class="pi-brk pi-brk-r" d="M' + X(rx) + " " + Y(0) + "V" + Y(2) + "M" + X(rx - .3) + " " + Y(0) + "H" + X(rx + .3) + "M" + X(rx - .3) + " " + Y(2) + "H" + X(rx + .3) + '"/>';
  o += '<text class="pi-t pi-small" x="' + X(rx + .55) + '" y="' + Y(-.25) + '">platform</text><text class="pi-t pi-small" x="' + X(rx + .55) + '" y="' + Y(1.05) + '">≈2 mm</text><text class="pi-t pi-small" x="' + X(rx + .55) + '" y="' + f(D.PY + 1.05 * D.S + 12) + '">remodeling</text>';
  if (v.bone > .05) {
    o += '<g opacity="' + f(Math.min(1, v.bone * 1.4)) + '"><path class="pi-ref pi-ref-loss" d="M' + X(2) + " " + Y(crest) + "H" + X(rx) + '"/><path class="pi-loss" d="M' + X(rx) + " " + Y(2) + "V" + Y(crest) + '"/>';
    o += '<text class="pi-t pi-lossT" x="' + X(rx + .55) + '" y="' + Y(2 + (crest - 2) / 2 - .05) + '">bone loss</text><text class="pi-t pi-lossT" x="' + X(rx + .55) + '" y="' + f(D.PY + (2 + (crest - 2) / 2 - .05) * D.S + 12) + '">beyond it</text></g>';
  }
  return o;
}

/* fixed geometry, built once: implant (threads in elevation, with the helix seen across its face), abutment, crown */
function implantSvg(D) {
  const L = [[-2.05, 0], [-2.05, .8]], R = [[2.05, 0], [2.05, .8], [piRo(1.05) - .42, 1.05]];
  for (let k = 0; k <= 8; k++) { const y = .8 + k; if (y > 9.05) break; L.push([-piRo(y), y]); if (y + .5 < 9.3) L.push([-(piRo(y + .5) - .42), y + .5]); }
  for (let k = 0; k <= 8; k++) { const y = 1.3 + k; if (y > 9.05) break; R.push([piRo(y), y]); if (y + .5 < 9.3) R.push([piRo(y + .5) - .42, y + .5]); }
  const apex = [[-1.42, 9.35], [-.95, 9.8], [0, 10.02], [.95, 9.8], [1.42, 9.35]];
  const body = L.concat(apex, R.slice().reverse());
  let helix = "";
  for (let k = 0; k <= 7; k++) { const y = .8 + k; helix += piD(D, [[-piRo(y), y], [piRo(y + .5), y + .5]], false); }
  const crownPts = [];
  for (let y = -2.5; y >= -4.6; y -= .35) crownPts.push([-piHw(y, -1), y]);
  crownPts.push([-3.95, -5.4], [-3.8, -6.6], [-3.4, -8.1], [-2.75, -9.5], [-2.2, -10.15], [-1.4, -9.9], [-.6, -9.2], [0, -9.02], [.6, -9.22], [1.35, -9.72], [2.05, -9.98], [2.7, -9.68], [3.35, -8.8], [3.75, -7.5]);
  for (let y = -6.2; y <= -2.5; y += .37) crownPts.push([piHw(y, 1), y]);
  crownPts.push([piHw(-2.5, 1), -2.5]);
  const crown = piCR(crownPts, 4);
  return `<g class="hot" data-info="Bone-level implant, 4.1 x 10 mm, tapered, its threads locked in bone. The surface is roughened so osteoblasts attach. Plaque attaches too, and no decontamination method (saline, chlorhexidine, citric acid, EDTA, laser) works better than another."><path class="pi-ti" d="${piD(D, body, true)}"/><path class="pi-helix" d="${helix}"/></g>`
    + `<g class="hot" data-info="Transmucosal abutment: it comes through the mucosa from the implant platform to the crown margin. How deep the implant sits and how tall the abutment is set how deep a healthy sulcus probes, which is why there is no 3 mm cutoff for implants."><path class="pi-abut" d="${piD(D, [[-2.05, 0], [-2.3, -2.5], [2.3, -2.5], [2.05, 0]], true)}"/></g>`
    + `<g class="hot" data-info="Cemented crown, its margin about 1 mm under the mucosa. Its bulge (the height of contour) is what makes an implant hard to probe straight down."><path class="pi-crown" d="${piD(D, crown, true)}"/></g>`;
}

/* marrow spaces, placed once where there is always bone (inside the plates, away from the implant and any crater) */
function marrowSvg(D) {
  let s = 11, o = "";
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const inB = (x, y) => { const xb = y < 4 ? -4.0 : -4.4 - 1.2 * (y - 4) / 8.5, xl = y < 4 ? 4.45 : 4.85 + 1.75 * (y - 4) / 8.5; return x > xb + 1.0 && x < xl - 1.0; };
  let n = 0;
  for (let i = 0; i < 400 && n < 46; i++) {
    const x = -5.4 + r() * 11.8, y = 3.1 + r() * 9.0;
    if (!inB(x, y) || (Math.abs(x) < 2.6 && y < 10.6) || (y < 6.2 && Math.abs(x) < 4.2)) continue;
    const rx = .2 + r() * .26, ry = .13 + r() * .17, a = Math.round(r() * 180);
    o += `<ellipse class="pi-marrow" cx="${(D.CX + x * D.S).toFixed(1)}" cy="${(D.PY + y * D.S).toFixed(1)}" rx="${(rx * D.S).toFixed(1)}" ry="${(ry * D.S).toFixed(1)}" transform="rotate(${a} ${(D.CX + x * D.S).toFixed(1)} ${(D.PY + y * D.S).toFixed(1)})"/>`;
    n++;
  }
  return o;
}

const D = {
  W, H, S, CX, PY,
  SC: {
    health: { name: "peri-implant health", red: 0, swell: 0, bleed: 0, pus: 0, bone: 0, bio: 0, m: -3.5, tip: .5,
      text: "Health: no signs of inflammation, no bleeding or suppuration on gentle probing, no increase in probing depth compared with previous exams, and no bone loss beyond the crestal changes from initial remodeling. This implant sits deep under thick tissue, so it probes 4 mm and is still healthy: it matches its own baseline." },
    muc: { name: "peri-implant mucositis", red: 1, swell: 1, bleed: 1, pus: 0, bone: 0, bio: 2.0, m: -4.3, tip: 1.2,
      text: "Mucositis, the implant's gingivitis: red, swollen mucosa, profuse (line or drop) bleeding and/or suppuration on gentle probing, and a deeper probing depth than at baseline. The pocket is deeper because the swollen tissue adds height and lets the probe in further, not because bone was lost: the bone still sits at the remodeling line. It is reversible, so treat it." },
    pi: { name: "peri-implantitis", red: 1, swell: .7, bleed: 1, pus: 1, bone: 1, bio: 7.6, m: -3.6, tip: 4.4,
      text: "Peri-implantitis: inflammation, bleeding and/or suppuration, increased probing depth, and bone loss beyond the crestal changes from initial remodeling, the one finding mucositis never has. The bone around the implant is lost as a crater, filled with inflamed tissue, and plaque coats the exposed threads. Suppuration means active disease: do something now." },
  },
};
D.MARROW = marrowSvg(D);
D.IMPLANT = implantSvg(D);

const START = { red: 0, swell: 0, bleed: 0, pus: 0, bone: 0, bio: 0, m: -3.5, tip: .5 };
const tag = (x, t) => `<text class="pi-t pi-tag" x="${x}" y="${H - 8}" text-anchor="middle">${t}</text>`;
const scale = `<path class="pi-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="pi-t pi-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const callouts = (() => {
  const X = (mm) => CX + mm * S, Y = (mm) => PY + mm * S;
  const c = (p, label, t, anchor) => { const ex = t[0] + (anchor === "end" ? 4 : -4), ey = t[1] - 4;
    return `<g class="am-callout"><path class="am-leader" d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}"/><circle class="am-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2"/><text class="am-label" x="${t[0]}" y="${t[1]}" text-anchor="${anchor}">${label}</text></g>`; };
  return c([X(-3.5), Y(-7.9)], "crown", [70, Y(-8.6)], "end") + c([X(-6.3), Y(-10)], "probe", [70, Y(-11.2)], "end")
    + c([X(-6.1), Y(5.5)], "mucosa", [70, Y(5.2)], "end") + c([X(-5.0), Y(10)], "bone", [70, Y(10.4)], "end")
    + c([X(2.2), Y(-1.4)], "abutment", [X(8.3), Y(-2.2)], "start") + c([X(1.86), Y(7.4)], "implant", [X(8.3), Y(7.6)], "start");
})();
const svg = figureSvg({ width: W, height: H, className: "pi-svg", label: "A buccolingual section through the ridge: a bone-level implant with its abutment and crown, the peri-implant mucosa, the buccal and lingual bone, and a plastic probe in the buccal sulcus. A bracket gives the probing depth; another marks the platform and the line about 2 mm below it left by initial remodeling.",
  body: `<g class="pi-dyn">${piDyn(START, 0, D)}</g>${callouts}${tag(CX - 5.3 * S, "BUCCAL")}${tag(CX + 6.2 * S, "LINGUAL")}${scale}` });
const plate = plateHtml({ fig: "S7 · Fig 1", title: "Health, mucositis, peri-implantitis", hint: "pick a state · tap a part", readout: "peri-implant health", body: `<div class="am-svg pi-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="State"><button type="button" class="am-btn" data-pistate="health" aria-pressed="true">Health</button><button type="button" class="am-btn" data-pistate="muc" aria-pressed="false">Mucositis</button><button type="button" class="am-btn" data-pistate="pi" aria-pressed="false">Peri-implantitis</button></div>
<div class="am-stats pi-stats"><span>Inflammation <b data-pi="infl"></b></span><span>Bleeding / suppuration <b data-pi="bop"></b></span><span>Probing depth <b data-pi="pd"></b></span><span>Bone <b data-pi="bone"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the crown, the abutment, the implant, the mucosa, the bone, the probe, the plaque or the pus.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The criteria are the 2017 World Workshop's (Dr. Kaur's slides); the ~2 mm of initial remodeling in the first year is what she said in class, since the slides give no number.</li>
<li>Drawn to one scale (the 5 mm bar): a 4.1 x 10 mm implant and soft tissue of typical height (about 2 mm of barrier epithelium and 1-1.5 mm of connective tissue above the bone). The 4 mm baseline, the probing depths and the shape of the crater are illustrative, not one patient's. Educational, not medical advice.</li></ul></details>`;

function piLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".pi-svg"), dyn = svg.querySelector(".pi-dyn"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var N = ["red", "swell", "bleed", "pus", "bone", "bio", "m", "tip"];
  var key = "health", v = {}, frame = 0, visible = true, t0 = performance.now(), last = t0;
  N.forEach(function (n) { v[n] = D.SC.health[n]; });
  var STAT = { health: ["none", "none", "4 mm = baseline", "at remodeling line"], muc: ["present", "profuse bleeding", "5.5 mm, deeper than baseline", "at remodeling line"], pi: ["present", "bleeding + pus", "8 mm, deeper than baseline", "lost beyond the line"] };
  function settled() { return N.every(function (n) { return Math.abs(v[n] - D.SC[key][n]) < .002; }); }
  function step(now) { var k = 1 - Math.exp(-Math.max(0, now - last) / 260); last = now; N.forEach(function (n) { v[n] += (D.SC[key][n] - v[n]) * (reduce.matches ? 1 : k); }); dyn.innerHTML = D.piDyn(v, reduce.matches ? 700 : now - t0, D); }
  function loop(now) { step(now); var moving = D.SC[key].bleed > 0 || !settled(); frame = visible && !reduce.matches && moving ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) { key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    ["infl", "bop", "pd", "bone"].forEach(function (n, i) { var el = root.querySelector('[data-pi="' + n + '"]'); if (el) el.textContent = STAT[k][i]; });
    root.querySelectorAll("[data-pistate]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-pistate") === k)); }); kick(); }
  root.querySelectorAll("[data-pistate]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-pistate")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("health");
}

const CSS = `
.anima .pi-box{max-width:560px;margin:0 auto}
.anima .pi-svg .pi-cort,.anima .pi-svg .pi-probe,.anima .pi-svg .pi-mark,.anima .pi-svg .pi-bio{vector-effect:none}
.anima .pi-svg .pi-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .pi-svg .pi-small{font-size:10.5px;fill:var(--anatomy-muted);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-pd{font-weight:700;font-size:12px;fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .pi-svg .pi-lossT{font-size:10.5px;font-weight:700;fill:var(--pd-red-line);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-bone{fill:var(--pd-bone);stroke:none}
.anima .pi-svg .pi-marrow{fill:color-mix(in srgb, var(--pd-bone-line) 26%, var(--pd-bone))}
.anima .pi-svg .pi-cort{fill:none;stroke:color-mix(in srgb, var(--pd-bone-line) 30%, var(--pd-bone));stroke-width:22;stroke-linejoin:round}
.anima .pi-svg .pi-gum{stroke:var(--pd-gum-line);stroke-width:1.2;stroke-linejoin:round}
.anima .pi-svg .pi-sulc{fill:color-mix(in srgb, var(--pd-gum-line) 28%, var(--surface));stroke:none}
.anima .pi-svg .pi-ti{fill:var(--pd-ti);stroke:var(--pd-ti-line);stroke-width:1.1;stroke-linejoin:round}
.anima .pi-svg .pi-helix{fill:none;stroke:var(--pd-ti-line);stroke-width:.9;opacity:.55}
.anima .pi-svg .pi-abut{fill:color-mix(in srgb, var(--pd-ti) 70%, var(--anatomy-top));stroke:var(--pd-ti-line);stroke-width:1.1}
.anima .pi-svg .pi-crown{fill:var(--pd-crown);stroke:var(--pd-crown-line);stroke-width:1.2;stroke-linejoin:round}
.anima .pi-svg .pi-ref{stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:5 4;fill:none}
.anima .pi-svg .pi-ref-loss{stroke:var(--pd-red-line)}
.anima .pi-svg .pi-plat{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 3;fill:none}
.anima .pi-svg .pi-brk{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3}
.anima .pi-svg .pi-brk-r{stroke:var(--anatomy-mid)}
.anima .pi-svg .pi-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;stroke-dasharray:2 2}
.anima .pi-svg .pi-probe{stroke:var(--pd-drug);stroke-width:7.5;stroke-linecap:round;stroke-linejoin:round;fill:none}
.anima .pi-svg .pi-mark{stroke:var(--surface);stroke-width:1.8}
.anima .pi-svg .pi-bio{fill:none;stroke:var(--pd-bug);stroke-width:4;stroke-linecap:round}
.anima .pi-svg .pi-dot{fill:var(--anatomy-dot)}
.anima .pi-svg .pi-dot-tip{fill:var(--surface);stroke:var(--anatomy-dot);stroke-width:1}
.anima .pi-svg .pi-blood{fill:var(--pd-blood)}
.anima .pi-svg .pi-pus{fill:var(--pd-pus);stroke:var(--pd-enz);stroke-width:1}
.anima .pi-svg .pi-loss{stroke:var(--pd-red-line);stroke-width:2.4}
.anima .pi-svg .pi-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
`;

export function pistates() {
  return { id: "pistates", lec: "implants-perio", title: "Peri-implant health, mucositis and peri-implantitis",
    caption: "One implant, drawn to scale in a section through the ridge, in its three 2017 states: what changes in the mucosa, the bleeding, the plaque, the probing depth, and the bone against the line of initial remodeling.",
    html: `<div class="anima" data-anima="pistates">${plate}${controls}${SOURCES}</div>`, css: CSS, live: piLive.toString(), helpers: [piCR, piD, piRo, piHw, piBone, piDyn], data: D };
}
