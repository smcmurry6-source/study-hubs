// Fig: excessive gingival display, finding the cause (Periodontology S9, from Dr. Abou-Arraj's slides and the
// exam-review guide; the live class that covers it isn't posted yet). A frontal schematic of the smile, in mm from
// subnasale (6.5 px = 1 mm), with the slide checklist's norms as the controls:
//   upper lip length at rest 20-22 mm (women), 22-24 mm (men), under 20 mm a short upper lip;
//   lip mobility on a full smile 6-8 mm, over 8 mm hypermobile;
//   equal facial thirds, an increased lower third suggesting vertical maxillary excess;
//   short clinical crowns (altered passive eruption);
//   the gingival line (centrals and canines level, laterals 1 mm coronal) and the golden proportion
//   (central 1.618 : lateral 1 : visible canine 0.618).
// Each cause maps to the slide table's treatment. The geometry (where the incisal edge sits, how far each cause moves
// the teeth or the lip) is illustrative; only the checklist's numbers are shown as numbers.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 6.5, W = 462, H = 372, CX = 196, PY = 72.5;
const TW = [8.6, 5.3, 3.3]; // central, lateral, visible canine: 1.618 : 1 : 0.618 of the lateral

/* the mouth: where the teeth, the margins and the lips sit for this state (mm, y down from subnasale) */
function egModel(st) {
  var yi = 23.5 + (st.vme ? 4 : 0), crown = st.ape ? 7.5 : 10.5, yg = yi - crown, sm = st.view === "smile";
  var lip = sm ? st.L - st.M : st.L, hw = sm ? 24.5 : 21, lo0 = sm ? yi + 1.4 : yi + .8, cy = lip + 1.2;
  return { yi: yi, yg: yg, crown: crown, sm: sm, lip: lip, hw: hw, lo0: lo0, cy: cy };
}
function egUp(M, x) { var q = Math.min(1, (x / M.hw) * (x / M.hw)); return M.lip + (M.cy - M.lip) * q; }
function egLo(M, x) { var q = Math.min(1, (x / M.hw) * (x / M.hw)); return M.lo0 - (M.lo0 - M.cy) * q; }
function egP(D, pts, close) { var o = ""; for (var i = 0; i < pts.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + pts[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + pts[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* one tooth's outline (right side; sg = -1 mirrors it): x0-x1 wide, zenith z hidden under the gingiva, edge or cusp tip e */
function egTooth(x0, x1, z, e, kind, sg) {
  var w = x1 - x0, p;
  if (kind === "k" || kind === "p") { var tip = x0 + w * (kind === "k" ? .38 : .5), b = kind === "k" ? 2.4 : 1.6;
    p = [[x0 + .15, z - 2], [x0 + .08, e - b - .4], [x0 + .25, e - b + .3], [tip - .5, e - .2], [tip, e], [tip + .5, e - .3], [x1 - .25, e - b - .3], [x1 - .1, e - b - .9], [x1 - .22, z - 2]]; }
  else { var r = kind === "c" ? .9 : 1.4;
    p = [[x0 + .12, z - 2], [x0 + .05, e - 1.0], [x0 + .15, e - .3], [x0 + .7, e], [x1 - r - .3, e - .06], [x1 - r * .45, e - r * .25], [x1 - .12, e - r - .2], [x1 - .3, z - 2]]; }
  return p.map(function (q) { return [q[0] * sg, q[1]]; });
}
function egDyn(st, D) {
  var M = egModel(st), o = "", f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var i, j, x, up = [], lo = [];
  for (i = 0; i <= 40; i++) { x = -M.hw + 2 * M.hw * i / 40; up.push([x, egUp(M, x)]); }
  for (i = 40; i >= 0; i--) { x = -M.hw + 2 * M.hw * i / 40; lo.push([x, egLo(M, x)]); }
  var open = up.concat(lo);
  o += '<path class="eg-mouth" d="' + egP(D, open, true) + '"/>';
  /* teeth: [x0, x1, zenith, edge, kind] on the right; mirrored on the left */
  var T = [], x0 = .06, sp = [[D.TW[0], 0, 0, "c"], [D.TW[1], 1, -.8, "l"], [D.TW[2], 0, -.2, "k"], [3.3, .6, -1.6, "p"]];
  for (i = 0; i < sp.length; i++) { T.push([x0, x0 + sp[i][0], M.yg + sp[i][1], M.yi + sp[i][2], sp[i][3]]); x0 += sp[i][0] + .06; }
  var teeth = "";
  [1, -1].forEach(function (sg) { T.forEach(function (t) { teeth += '<path class="eg-tooth' + (t[4] === "p" ? " eg-pm" : "") + '" d="' + egP(D, egTooth(t[0], t[1], t[2], t[3], t[4], sg), true) + '"/>'; }); });
  o += '<g class="hot" data-info="' + D.HOT.teeth + '">' + teeth + "</g>";
  /* the gingiva, scalloped: a zenith over each tooth, a papilla between neighbors */
  var edge = [], pap = function (za, zb) { return Math.max(za, zb) + .36 * M.crown; };
  [1, -1].forEach(function (sg) {
    var side = [];
    for (j = 0; j < T.length; j++) {
      var t = T[j], pl = j === 0 ? pap(T[0][2], T[0][2]) : pap(T[j - 1][2], t[2]), pr = j === T.length - 1 ? t[2] + 2.2 : pap(t[2], T[j + 1][2]), xz = t[0] + (t[1] - t[0]) * (t[4] === "c" ? .55 : .5);
      for (i = 0; i <= 10; i++) { var u = i / 10, xx = t[0] + (xz - t[0]) * u, tt = 1 - u; side.push([xx * sg, t[2] + (pl - t[2]) * tt * tt]); }
      for (i = 1; i <= 10; i++) { var v = i / 10, xr = xz + (t[1] - xz) * v; side.push([xr * sg, t[2] + (pr - t[2]) * v * v]); }
    }
    if (sg > 0) edge = side; else edge = side.reverse().concat(edge);
  });
  var gTop = M.yg - 14, gum = [[-22.5, gTop], [22.5, gTop], [22.5, edge[edge.length - 1][1]]].concat(edge.slice().reverse()).concat([[-22.5, edge[0][1]]]);
  o += '<g class="hot" data-info="' + D.HOT.gum + '"><path class="eg-gum" d="' + egP(D, gum, true) + '"/></g>';
  /* the face, with the mouth open in it, and the lips */
  var fx = 28.5, ft = -9, fb = 41, r = 3;
  var face = "M" + X(-fx + r) + " " + Y(ft) + "H" + X(fx - r) + "Q" + X(fx) + " " + Y(ft) + " " + X(fx) + " " + Y(ft + r) + "V" + Y(fb - r) + "Q" + X(fx) + " " + Y(fb) + " " + X(fx - r) + " " + Y(fb) + "H" + X(-fx + r) + "Q" + X(-fx) + " " + Y(fb) + " " + X(-fx) + " " + Y(fb - r) + "V" + Y(ft + r) + "Q" + X(-fx) + " " + Y(ft) + " " + X(-fx + r) + " " + Y(ft) + "Z";
  o += '<path class="eg-skin" fill-rule="evenodd" d="' + face + egP(D, open, true) + '"/>';
  var vb = M.sm ? 4.2 : 6.5, lb = M.sm ? 7 : 9, uv = [], lv = [];
  for (i = 0; i <= 40; i++) { x = -M.hw + 2 * M.hw * i / 40; var q = (x / M.hw) * (x / M.hw), ax = Math.abs(x); uv.push([x, egUp(M, x) - (vb * (1 - .75 * q) + .8 * Math.exp(-(ax - 5) * (ax - 5) / 6) - .6 * Math.exp(-x * x / 2.5))]); }
  for (i = 40; i >= 0; i--) { x = -M.hw + 2 * M.hw * i / 40; var q2 = (x / M.hw) * (x / M.hw); lv.push([x, egLo(M, x) + lb * (1 - .8 * q2)]); }
  o += '<g class="hot" data-info="' + D.HOT.lip + '"><path class="eg-lip" d="' + egP(D, up.concat(uv.reverse()), true) + '"/><path class="eg-lip" d="' + egP(D, lo.slice().reverse().concat(lv), true) + '"/></g>';
  /* the nose's base and subnasale, where the lip length is measured from */
  o += '<path class="eg-nose" d="' + egP(D, [[-15.5, -9], [-15.8, -4.5], [-14.6, -1.6], [-11.6, -.4], [-6.5, -.9], [-2.6, -.6], [0, 0], [2.6, -.6], [6.5, -.9], [11.6, -.4], [14.6, -1.6], [15.8, -4.5], [15.5, -9]], false) + '"/>';
  o += '<ellipse class="eg-nostril" cx="' + X(-6.4) + '" cy="' + Y(-2.6) + '" rx="' + f(3.3 * D.S) + '" ry="' + f(1.35 * D.S) + '" transform="rotate(8 ' + X(-6.4) + " " + Y(-2.6) + ')"/><ellipse class="eg-nostril" cx="' + X(6.4) + '" cy="' + Y(-2.6) + '" rx="' + f(3.3 * D.S) + '" ry="' + f(1.35 * D.S) + '" transform="rotate(-8 ' + X(6.4) + " " + Y(-2.6) + ')"/>';
  o += '<circle class="eg-dot" cx="' + X(0) + '" cy="' + Y(0) + '" r="2.4"/><text class="eg-t eg-on" x="' + X(1.4) + '" y="' + Y(2.6) + '">subnasale</text>';
  /* the measurements: lip length at rest (left), lip mobility on a smile (right) */
  var bl = -26.5, br = 26.5;
  o += '<path class="eg-guide" d="M' + X(bl) + " " + Y(0) + "H" + X(-.6) + '"/>';
  o += '<path class="eg-guide" d="M' + X(bl) + " " + Y(st.L) + "H" + X(M.sm ? 0 : -M.hw) + '"/>';
  o += '<path class="eg-brk" d="M' + X(bl + .6) + " " + Y(0) + "H" + X(bl) + "V" + Y(st.L) + "H" + X(bl + .6) + '"/><text class="eg-t eg-rot" transform="translate(' + X(bl - 1.3) + " " + Y(st.L / 2) + ') rotate(-90)" text-anchor="middle">upper lip at rest ' + st.L + " mm</text>";
  if (M.sm) {
    o += '<path class="eg-ghost" d="M' + X(-21) + " " + Y(st.L + 1.2) + "Q" + X(0) + " " + Y(st.L - 1.2) + " " + X(21) + " " + Y(st.L + 1.2) + '"/>';
    o += '<path class="eg-guide" d="M' + X(M.hw - 1) + " " + Y(M.lip) + "H" + X(br) + "M" + X(21) + " " + Y(st.L) + "H" + X(br) + '"/>';
    o += '<path class="eg-brk" d="M' + X(br - .6) + " " + Y(M.lip) + "H" + X(br) + "V" + Y(st.L) + "H" + X(br - .6) + '"/><text class="eg-t eg-rot" transform="translate(' + X(br + 2.0) + " " + Y((M.lip + st.L) / 2) + ') rotate(-90)" text-anchor="middle">lip mobility ' + st.M + " mm</text>";
  }
  /* the facial thirds */
  var ix = 408, t0 = 52, sg3 = 40, sl = st.vme ? 52 : 40, lv3 = [t0, t0 + sg3, t0 + 2 * sg3, t0 + 2 * sg3 + sl];
  o += '<g class="hot" data-info="' + D.HOT.thirds + '"><path class="eg-third" d="M' + ix + " " + lv3[0] + "V" + lv3[2] + '"/><path class="eg-third' + (st.vme ? " eg-bad" : "") + '" d="M' + ix + " " + lv3[2] + "V" + lv3[3] + '"/>';
  lv3.forEach(function (yy) { o += '<path class="eg-third" d="M' + (ix - 5) + " " + yy + "h10" + '"/>'; });
  o += '<text class="eg-t eg-small" x="' + (ix + 9) + '" y="' + (t0 + sg3 / 2 + 4) + '">upper</text><text class="eg-t eg-small" x="' + (ix + 9) + '" y="' + (t0 + sg3 * 1.5 + 4) + '">middle</text><text class="eg-t eg-small' + (st.vme ? " eg-badt" : "") + '" x="' + (ix + 9) + '" y="' + (t0 + 2 * sg3 + sl / 2 + (st.vme ? -2 : 4)) + '">lower' + (st.vme ? '<tspan x="' + (ix + 9) + '" dy="1.2em">longer</tspan>' : "") + "</text></g>";
  return o;
}
function egFind(st, D) {
  var F = [];
  if (st.ape) F.push(D.CAUSE.ape); if (st.vme) F.push(D.CAUSE.vme); if (st.L < 20) F.push(D.CAUSE.short); if (st.M > 8) F.push(D.CAUSE.hyper);
  return F;
}

const tagText = `<text class="eg-t eg-tag" x="414" y="26" text-anchor="middle">FACIAL</text><text class="eg-t eg-tag" x="414" y="38" text-anchor="middle">THIRDS</text>`;
const D = {
  W, H, S, CX, PY, TW,
  CAUSE: {
    ape: ["short clinical crowns", "altered passive eruption", "crown lengthening and restorative therapy"],
    vme: ["an increased lower facial third", "vertical maxillary excess", "orthodontics, orthognathic surgery; periodontics may be required"],
    short: ["an upper lip under 20 mm", "a short upper lip", "no good options"],
    hyper: ["lip mobility over 8 mm", "a hypermobile upper lip", "lip repositioning surgery or Botox"],
  },
  PRE: { normal: {}, ape: { ape: true }, vme: { vme: true }, short: { L: 18 }, hyper: { M: 10 }, several: { ape: true, M: 10 } },
  HOT: {
    teeth: "The maxillary anterior teeth, at the golden proportion seen from the front (central 1.618 : lateral 1 : visible canine 0.618). The centrals' and canines' gingival margins are level; the laterals' sit 1 mm coronal.",
    gum: "The gingiva. How much of it shows on a full smile depends on where the teeth and their margins sit and how high the lip rises.",
    lip: "The upper lip: its length at rest is measured from subnasale (20-22 mm for women, 22-24 mm for men; under 20 mm is short), and its mobility is how far it rises on a full smile (6-8 mm; over 8 mm is hypermobile).",
    thirds: "The facial thirds should be equal. An increased lower facial third suggests vertical maxillary excess.",
  },
};

const st0 = { view: "smile", sex: "F", L: 21, M: 7, ape: false, vme: false };
const scale = `<path class="eg-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="eg-t eg-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const svg = figureSvg({ width: W, height: H, className: "eg-svg", label: "A frontal schematic of a smile: the upper lip, the maxillary anterior teeth and their gingiva, with the upper lip's length at rest and its mobility on a full smile measured, and the facial thirds beside it.",
  body: `<g class="eg-dyn">${egDyn(st0, D)}</g>${tagText}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 5", title: "A gummy smile: find the cause", hint: "change one · read the cause", readout: "full smile · no cause", body: `<div class="am-svg eg-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-egv="rest" aria-pressed="false">At rest</button><button type="button" class="am-btn" data-egv="smile" aria-pressed="true">Full smile</button><button type="button" class="am-btn" data-egs="F" aria-pressed="true">Woman</button><button type="button" class="am-btn" data-egs="M" aria-pressed="false">Man</button></div>
<div class="am-controls" role="group" aria-label="Try a cause"><button type="button" class="am-btn" data-egp="normal">Normal</button><button type="button" class="am-btn" data-egp="ape">Short crowns</button><button type="button" class="am-btn" data-egp="vme">Long lower third</button><button type="button" class="am-btn" data-egp="short">Short lip</button><button type="button" class="am-btn" data-egp="hyper">Hypermobile lip</button><button type="button" class="am-btn" data-egp="several">Two at once</button></div>
<div class="am-controls"><label class="am-slider">Upper lip at rest <input type="range" min="16" max="26" step="0.5" value="21" data-egl aria-label="Upper lip length at rest, in millimeters"><b data-egl-out></b></label></div>
<div class="am-controls"><label class="am-slider">Lip mobility <input type="range" min="4" max="12" step="0.5" value="7" data-egm aria-label="Upper lip mobility on a full smile, in millimeters"><b data-egm-out></b></label></div>
<div class="am-controls" role="group" aria-label="Face and teeth"><button type="button" class="am-btn" data-egt aria-pressed="false">Lower facial third increased</button><button type="button" class="am-btn" data-egc aria-pressed="false">Short clinical crowns</button></div>
<div class="am-stats"><span>Cause <b data-eg="0"></b></span><span>Treatment <b data-eg="1"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the lip, the gingiva, the teeth or the facial thirds.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's slides and the notes (the live class that covers this part of S9 isn't posted yet): the esthetic checklist's norms (lip length, lip mobility, the facial thirds, the gingival line, the golden proportion), the causes of excessive gingival display and the treatment for each.</li>
<li>Outside sources: the lip measured from subnasale at rest and in a full smile, and the way each cause shows more gingiva (teeth that sit lower with a longer maxilla, a lip that rises further or starts higher, crowns covered by gingiva), follow Garber and Salama (Periodontol 2000 1996;11:18-28) and Silberberg, Goldstein and Smidt (Quintessence Int 2009;40:809-18); the golden proportion seen from the front follows Levin (J Prosthet Dent 1978;40:244-52). They settled how each control moves the picture.</li>
<li>A schematic, drawn to one scale (the 5 mm bar) from subnasale down: where the incisal edge sits, how far a longer lower third moves the teeth (4 mm here) and how much short crowns hide (3 mm) are illustrative. The figure doesn't set a cut-off for a gummy smile. Educational, not medical advice.</li></ul></details>`;

function egLive(root, D) {
  var svg = root.querySelector(".eg-svg"), dyn = svg.querySelector(".eg-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var lIn = root.querySelector("[data-egl]"), mIn = root.querySelector("[data-egm]"), lOut = root.querySelector("[data-egl-out]"), mOut = root.querySelector("[data-egm-out]");
  var st = { view: "smile", sex: "F", L: 21, M: 7, ape: false, vme: false };
  function lipNote() { var L = st.L; if (L < 20) return "short (under 20)"; var lo = st.sex === "F" ? 20 : 22, hi = lo + 2, w = st.sex === "F" ? "women" : "men"; return L >= lo && L <= hi ? "normal for " + w + " (" + lo + "-" + hi + ")" : (L < lo ? "below" : "above") + " the range for " + w + " (" + lo + "-" + hi + ")"; }
  function mobNote() { var M = st.M; return M > 8 ? "hypermobile (over 8)" : M >= 6 ? "normal (6-8)" : "below the normal 6-8"; }
  function draw() {
    dyn.innerHTML = D.egDyn(st, D);
    lIn.value = st.L; mIn.value = st.M; lOut.textContent = st.L + " mm · " + lipNote(); mOut.textContent = st.M + " mm · " + mobNote();
    var F = D.egFind(st, D), a = root.querySelector('[data-eg="0"]'), b = root.querySelector('[data-eg="1"]'), t;
    if (a) a.textContent = F.length ? F.map(function (c) { return c[1]; }).join(" + ") : "none found";
    if (b) b.textContent = F.length > 1 ? "a combination of therapies" : F.length ? F[0][2] : "none needed";
    if (!F.length) t = "Nothing out of range: equal thirds, crowns of normal proportions, and a lip of normal length and mobility." + (st.view === "smile" ? " Little or no gingiva shows on a full smile." : " Switch to Full smile to see how much gingiva the lip uncovers.");
    else t = F.map(function (c) { return c[0].charAt(0).toUpperCase() + c[0].slice(1) + " points to " + c[1] + "."; }).join(" ") + (F.length > 1 ? " Several causes: a combination of therapies, each cause treated with its own (" + F.map(function (c) { return c[2]; }).join("; ") + ")." : " Treatment: " + F[0][2] + ".") + (st.view === "rest" ? " Switch to Full smile to see the gingiva it shows." : "");
    sum.textContent = t;
    if (readout) readout.textContent = (st.view === "smile" ? "full smile" : "at rest") + " · " + (F.length ? F.length + " cause" + (F.length > 1 ? "s" : "") : "no cause");
    root.querySelectorAll("[data-egv]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-egv") === st.view)); });
    root.querySelectorAll("[data-egs]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-egs") === st.sex)); });
    root.querySelector("[data-egt]").setAttribute("aria-pressed", String(st.vme)); root.querySelector("[data-egc]").setAttribute("aria-pressed", String(st.ape));
  }
  root.querySelectorAll("[data-egv]").forEach(function (x) { x.addEventListener("click", function () { st.view = x.getAttribute("data-egv"); draw(); }); });
  root.querySelectorAll("[data-egs]").forEach(function (x) { x.addEventListener("click", function () { st.sex = x.getAttribute("data-egs"); st.L = st.sex === "F" ? 21 : 23; draw(); }); });
  root.querySelectorAll("[data-egp]").forEach(function (x) { x.addEventListener("click", function () { var p = D.PRE[x.getAttribute("data-egp")]; st.view = "smile"; st.ape = !!p.ape; st.vme = !!p.vme; st.L = p.L || (st.sex === "F" ? 21 : 23); st.M = p.M || 7; draw(); }); });
  lIn.addEventListener("input", function () { st.L = +lIn.value; draw(); }); mIn.addEventListener("input", function () { st.M = +mIn.value; draw(); });
  root.querySelector("[data-egt]").addEventListener("click", function () { st.vme = !st.vme; draw(); });
  root.querySelector("[data-egc]").addEventListener("click", function () { st.ape = !st.ape; draw(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .eg-box{max-width:560px;margin:0 auto}
.anima .eg-svg .eg-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .eg-svg .eg-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .eg-svg .eg-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .eg-svg .eg-rot{font-size:10.5px;font-weight:600;fill:var(--eg-ink);paint-order:stroke;stroke:var(--eg-skin);stroke-width:3px}
.anima .eg-svg .eg-on{font-size:10.5px;fill:var(--eg-ink)}
.anima .eg-svg .eg-dot{fill:var(--eg-ink)}
.anima .eg-svg .eg-skin{fill:var(--eg-skin);stroke:var(--eg-skin-line);stroke-width:1}
.anima .eg-svg .eg-nose{fill:none;stroke:var(--eg-skin-line);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.anima .eg-svg .eg-nostril{fill:var(--eg-nostril)}
.anima .eg-svg .eg-mouth{fill:var(--eg-mouth)}
.anima .eg-svg .eg-lip{fill:var(--eg-lip);stroke:var(--eg-lip-line);stroke-width:1;stroke-linejoin:round}
.anima .eg-svg .eg-gum{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1;stroke-linejoin:round}
.anima .eg-svg .eg-tooth{fill:var(--eg-enamel);stroke:var(--eg-tooth-line);stroke-width:1;stroke-linejoin:round}
.anima .eg-svg .eg-pm{fill:var(--eg-shade)}
.anima .eg-svg .eg-ghost{fill:none;stroke:var(--eg-ink);stroke-width:1.2;stroke-dasharray:4 3;opacity:.75}
.anima .eg-svg .eg-guide{fill:none;stroke:var(--eg-ink);stroke-width:.8;stroke-dasharray:2 3;opacity:.7}
.anima .eg-svg .eg-brk{fill:none;stroke:var(--eg-ink);stroke-width:1.4}
.anima .eg-svg .eg-third{fill:none;stroke:var(--anatomy-strong);stroke-width:1.4}
.anima .eg-svg .eg-bad{stroke:var(--pd-red-line);stroke-width:2.2}
.anima .eg-svg .eg-badt{fill:var(--pd-red-line);font-weight:600}
.anima .eg-svg .eg-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="egd"]{--eg-skin:#efd8c4;--eg-skin-line:#b8937a;--eg-nostril:#8a6553;--eg-ink:#3f2c22;--eg-lip:#cf7d86;--eg-lip-line:#a2525d;--eg-mouth:#3a242c;--eg-enamel:#fbf8f2;--eg-tooth-line:#a99f8c;--eg-shade:#b8ad9c}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="egd"]{--eg-skin:#8a6f5e;--eg-skin-line:#5a4537;--eg-nostril:#3d2b22;--eg-ink:#1d140f;--eg-lip:#a5525e;--eg-lip-line:#6e2f39;--eg-mouth:#120b0e;--eg-enamel:#e4ddd0;--eg-tooth-line:#8f8676;--eg-shade:#8c8273} }
:root[data-theme="dark"] .anima[data-anima="egd"]{--eg-skin:#8a6f5e;--eg-skin-line:#5a4537;--eg-nostril:#3d2b22;--eg-ink:#1d140f;--eg-lip:#a5525e;--eg-lip-line:#6e2f39;--eg-mouth:#120b0e;--eg-enamel:#e4ddd0;--eg-tooth-line:#8f8676;--eg-shade:#8c8273}
`;

export function egd() {
  return { id: "egd", lec: "perio-plastic-esthetics", title: "A gummy smile: find the cause",
    caption: "Excessive gingival display has several causes, and each has its own treatment. Change one finding at a time (the lip, the lower facial third, the crowns) and read which cause it points to. From the slides; the live class isn't posted yet.",
    html: `<div class="anima" data-anima="egd">${plate}${controls}${SOURCES}</div>`, css: CSS, live: egLive.toString(), helpers: [egModel, egUp, egLo, egP, egTooth, egDyn, egFind], data: D };
}
