// Fig: esthetic crown lengthening, step by step (Periodontology S9, from Dr. Abou-Arraj's Nov 12 live class: his
// Patient 1 and crown lengthening by type). The same labiolingual section through a maxillary central incisor as Fig 4
// (ape.mjs, 13 px = 1 mm), with the bone crest at the CEJ and a wide band of gingiva (Type 1B):
//   1. sound to bone: anesthetize and probe through the attachment to find the crest;
//   2. trim 2 mm of gingiva (submarginal incisions): the new margin now sits too close to the crest;
//   3. raise a full-thickness flap and remove 2 mm of bone, "the same amount of bone as soft tissue";
//   4. sutured back at the incisions; six months later the margin stays where it was put (sutures out at 1 week,
//      provisionals no sooner than 3 weeks, definitive restorations at 6 months).
// "Gingivectomy alone" leaves the bone: there is no room for the supracrestal attachment, and by six months the
// tissue has grown back almost to where it was.
// Positions in mm are illustrative except the lecture's 2 mm of gingiva and 2 mm of bone.
import { figureSvg, plateHtml } from "./shared.mjs";
import { apLerp, apF, apL, apBO, apIn, apTh, apP, apBand, apBone, staticSvg } from "./ape.mjs";

const S = 13, W = 416, H = 392, CX = 279, PY = 223.5, TOP = 15.6;

/* the soft tissue for one step: mucosa, keratinized gingiva, the MGJ, the ghosts of what was removed, the probe */
function clDyn(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (d) { return f(D.PY - d * D.S); };
  var P = D.STEPS[st.mode][st.step], B = D.BASE, c = P.crest, g = P.mgj, m = P.m, o = "", lab = [];
  /* a raised flap peels away from the bone, still attached at its base */
  var lift = function (pts) { return P.flap ? pts.map(function (p) { var u = Math.max(0, 1 - (p[1] - m) / (D.TOP * .78 - m)); return [p[0] - 1.9 * u * u, p[1]]; }) : pts; };
  var liftX = function (x, d) { return P.flap ? x - 1.9 * Math.pow(Math.max(0, 1 - (d - m) / (D.TOP * .78 - m)), 2) : x; };
  o += '<g class="hot" data-info="' + D.HOT.muc + '"><path class="cl-muc" d="' + apP(D, lift(apBand(g, D.TOP, c, g, false)), true) + '"/></g>';
  o += '<g class="hot" data-info="' + (P.flap ? D.HOT.flap : D.HOT.kg) + '"><path class="cl-kg" d="' + apP(D, lift(apBand(m, g, c, g, true)), true) + '"/>';
  var e = [], i;
  for (i = 0; i <= 30; i++) { var d = m + (g - m) * i / 30; e.push([apIn(d, c) - apTh(d, g) + .1, d]); }
  o += '<path class="cl-ker" d="' + apP(D, lift(e), false) + '"/></g>';
  if (P.boneGhost) {
    var gh = [[apF(B.crest), B.crest]], d0, d1;
    for (d0 = B.crest; d0 <= c + .8; d0 += .2) gh.push([apBO(d0, B.crest), d0]);
    for (d1 = c + .8; d1 >= c; d1 -= .2) gh.push([apBO(d1, c), d1]);
    o += '<g class="hot" data-info="' + D.HOT.boneGhost + '"><path class="cl-boneghost' + (P.flap ? "" : " over") + '" d="' + apP(D, gh, true) + '"/></g>';
    lab.push([D.TXT.boneGhost, apF((B.crest + c) / 2) - .35, (B.crest + c) / 2]);
  }
  /* the room above the bone: margin to crest, along the tooth (green when it is what it was, amber when too little) */
  if (!P.flap) {
    var rm = [], k;
    for (k = 0; k <= 20; k++) { var dr = (m - .4) + (c - m + .4) * k / 20; rm.push([apF(dr) - .02, dr]); }
    for (k = 20; k >= 0; k--) { var dq = (m - .4) + (c - m + .4) * k / 20; rm.push([apF(dq) - .5, dq]); }
    o += '<g class="hot" data-info="' + (P.short ? D.HOT.roomShort : D.HOT.room) + '"><path class="cl-room' + (P.short ? " short" : "") + '" d="' + apP(D, rm, true) + '"/></g>';
  }
  if (P.ghost) {
    o += '<g class="hot" data-info="' + D.HOT.ghost + '"><path class="cl-ghost" d="' + apP(D, apBand(B.m, B.m + 2 - .1, B.crest, B.mgj, true), true) + '"/></g>';
    lab.push([D.TXT.ghost, apF(B.m + .5) - .7, B.m + .5]);
  }
  if (P.cut != null) {
    var cx0 = apF(P.cut) - .05, cx1 = apIn(P.cut, c) - apTh(P.cut, g) - .25;
    o += '<g class="hot" data-info="' + D.HOT.cut + '"><path class="cl-cut" d="M' + X(cx1) + " " + Y(P.cut) + "H" + X(cx0) + '"/><circle class="cl-cutdot" cx="' + X(cx1) + '" cy="' + Y(P.cut) + '" r="2"/><circle class="cl-cutdot" cx="' + X(cx0) + '" cy="' + Y(P.cut) + '" r="2"/></g>';
    lab.push([D.TXT.cut, cx1 + .1, P.cut]);
  }
  /* the MGJ */
  var mi = apIn(g, c), mo = mi - apTh(g, g);
  o += '<path class="cl-mgj" d="M' + X(liftX(mo - .45, g)) + " " + Y(g) + "H" + X(liftX(mi - .05, g)) + '"/>';
  /* the margin, carried across to the clinical-crown bracket */
  if (!P.flap) {
    var mt = m - .55;
    o += '<path class="cl-guide" d="M' + X(apF(mt) + .1) + " " + Y(mt) + "H" + X(D.BX[0] + .4) + '"/><path class="cl-brk" d="M' + X(D.BX[0] - .35) + " " + Y(mt) + "H" + X(D.BX[0]) + "V" + Y(-10.5) + "H" + X(D.BX[0] - .35) + '"/>';
    o += '<text class="cl-t cl-rot" transform="translate(' + X(D.BX[0] + .95) + " " + Y((mt - 10.5) / 2) + ') rotate(-90)" text-anchor="middle">clinical crown</text>';
  }
  /* the probe, sounding through the attachment to the bone: a 0.4 mm shaft along the facial surface, 1 mm marks */
  if (P.probe != null) {
    var tip = P.probe, top = tip - 7.2, L = [], R = [], j;
    for (j = 0; j <= 24; j++) { var dp = top + (tip - top) * j / 24, xc = apF(dp) - .26; L.push([xc - .2, dp]); R.push([xc + .2, dp]); }
    var shape = L.concat([[apF(tip) - .26, tip + .22]], R.reverse());
    o += '<g class="hot" data-info="' + D.HOT.probe + '"><path class="cl-probe" d="' + apP(D, shape, true) + '"/>';
    for (j = 1; j <= 6; j++) { var dt = tip - j, xt = apF(dt) - .26; o += '<path class="cl-tick" d="M' + X(xt - .2) + " " + Y(dt) + "L" + X(xt + .2) + " " + Y(dt) + '"/>'; }
    o += "</g>";
    lab.push([D.TXT.probe, apF(-5.6) - .46, -5.6]);
  }
  /* labels: sorted from apical to coronal, one slot each, so no leaders cross */
  lab.push([D.TXT.muc, liftX(apIn(11.5, c) - apTh(11.5, g) / 2, 11.5), 11.5]);
  lab.push([D.TXT.mgj, liftX(mo - .1, g), g]);
  lab.push([D.TXT.crest[c > B.crest + .5 ? 1 : 0], apF(c) - .2, c + .2]);
  lab.push([P.flap ? D.TXT.flap : D.TXT.kg, liftX(apIn((m + g) / 2, c) - apTh((m + g) / 2, g) / 2, (m + g) / 2), (m + g) / 2]);
  if (!P.flap) lab.push([D.TXT.margin[P.mlab], (apF(m - .25) * 2 - apTh(m, g)) / 2, m - .3]);
  lab.sort(function (p, q) { return q[2] - p[2]; });
  lab.forEach(function (l, n) {
    var sy = 13.6 - n * 2.75, lines = l[0].split("|"), ty = sy + (lines.length - 1) * .42;
    o += '<path class="cl-lead" d="M' + X(l[1]) + " " + Y(l[2]) + "L" + X(-6.35) + " " + Y(sy) + '"/><circle class="cl-dot" cx="' + X(l[1]) + '" cy="' + Y(l[2]) + '" r="2.2"/>';
    o += '<text class="cl-t cl-lab" x="' + X(-6.6) + '" y="' + Y(ty - .3) + '" text-anchor="end">' + lines.map(function (s, q) { return '<tspan x="' + X(-6.6) + '" dy="' + (q ? "1.15em" : "0") + '">' + s + "</tspan>"; }).join("") + "</text>";
  });
  return o;
}
function clBoneSvg(st, D) { var P = D.STEPS[st.mode][st.step]; return '<g class="hot" data-info="' + D.HOT.bone + '"><path class="cl-bone" d="' + apP(D, apBone(D, P.crest), true) + '"/></g>'; }

const BASE = { m: -3, mgj: 2.6, crest: .35 };
const D = {
  W, H, S, CX, PY, TOP, BX: [7.2, 8.95], BASE,
  STEPS: {
    os: [
      { m: -3, mgj: 2.6, crest: .35, probe: .35, mlab: 0 },
      { m: -1, mgj: 2.6, crest: .35, ghost: true, short: true, mlab: 1 },
      { m: -1, mgj: 2.6, crest: 2.35, ghost: true, boneGhost: true, flap: true },
      { m: -1, mgj: 2.6, crest: 2.35, ghost: true, boneGhost: true, mlab: 2 },
    ],
    gv: [
      { m: -3, mgj: 2.6, crest: .35, probe: .35, mlab: 0 },
      { m: -1, mgj: 2.6, crest: .35, ghost: true, short: true, mlab: 1 },
      { m: -1, mgj: 2.6, crest: .35, ghost: true, short: true, mlab: 1 },
      { m: -2.6, mgj: 2.6, crest: .35, cut: -1, mlab: 3 },
    ],
  },
  STEP: { os: ["Sound to bone", "Trim 2 mm of gingiva", "Flap: 2 mm of bone off", "Six months later"], gv: ["Sound to bone", "Trim 2 mm of gingiva", "Leave the bone", "Six months later"] },
  OFF: { os: [["none", "none"], ["2 mm", "none"], ["2 mm", "2 mm"], ["2 mm", "2 mm"]], gv: [["none", "none"], ["2 mm", "none"], ["2 mm", "none"], ["2 mm, grown back", "none"]] },
  ROOM: { os: ["as it was", "too little", "being made", "kept, 2 mm apical"], gv: ["as it was", "too little", "too little", "back, by regrowth"] },
  TXT: {
    muc: "alveolar mucosa", mgj: "MGJ",
    crest: ["bone crest, at|about the CEJ", "bone crest,|2 mm apical"],
    kg: "gingiva", flap: "full-thickness|flap, raised",
    margin: ["gingival margin,|on the enamel", "new margin,|2 mm apical", "margin, stays|where it was put", "margin, grown|back"],
    ghost: "2 mm of gingiva|trimmed away", boneGhost: "2 mm of bone|removed", probe: "probe, sounding|to the bone", cut: "where it|was cut",
  },
  SUM: {
    os: [
      "Step 1. The teeth look short and the bone sits at or very close to the CEJ (Type 1B here). You can't see the crest, so numb the patient and sound to bone: push the probe through the attachment until it stops on bone. (A CBCT would show it too, but isn't typically taken for this.)",
      "Step 2. Trim the excess gingiva with submarginal incisions, 2 mm here. Up to now it looks like a gingivectomy, but the new margin sits far too close to the crest: there is no room for the attachment (connective tissue and junctional epithelium) above the bone.",
      "Step 3. Raise a full-thickness flap for access to the bone, and take off the same amount of bone as soft tissue: 2 mm of bone for 2 mm of gingiva. Ostectomy and osteoplasty blend it to a positive architecture. The soft and hard tissue keep their relationship, shifted apically.",
      "Step 4. The flap is sutured back at the incisions. Sutures out at 1 week, provisionals no sooner than 3 weeks, and the definitive restorations at 6 months, once the tissues, the attachment and the bone remodeling have settled. The margin stays where it was put.",
    ],
    gv: [
      "Step 1. The same tooth: short clinical crown, bone at or very close to the CEJ (Type 1B). Sounding to bone finds the crest.",
      "Step 2. Trim 2 mm of gingiva. The new margin sits far too close to the crest: there is no room for the attachment above the bone.",
      "Step 3. A gingivectomy alone leaves the bone where it is. That works only in Type 1A, where the bone sits 1.5-2 mm from the CEJ.",
      "Step 4. Six months later the tissue has grown back almost to where it was: with the bone at the CEJ, the attachment re-forms coronally. In Type 1B a gingivectomy alone is only a short-term fix; it needs the flap and osseous surgery.",
    ],
  },
  HOT: {
    tooth: "A maxillary central incisor in section. The anatomical crown runs from the incisal edge to the CEJ; the clinical crown is the part that shows above the gingiva.",
    kg: "Keratinized gingiva, from the gingival margin to the MGJ. A wide band, as in Type 1, can afford to be trimmed.",
    flap: "A full-thickness (mucoperiosteal) flap, lifted off the bone for access, then sutured back at the incisions.",
    muc: "Alveolar mucosa, beyond the MGJ.",
    bone: "The facial bone. Before surgery its crest sits at or very close to the CEJ.",
    ghost: "The 2 mm of gingiva trimmed away by the submarginal incisions.",
    boneGhost: "The 2 mm of bone removed (ostectomy), the same amount as the gingiva, so soft and hard tissue keep their relationship.",
    probe: "Sounding to bone: with the patient numb, the probe goes through the attachment and stops on the crest.",
    room: "The room between the margin and the bone crest, where the attachment (connective tissue and junctional epithelium) sits. Kept as it was, the margin stays put.",
    roomShort: "Too little room between the new margin and the bone for the attachment: left like this, the tissue grows back.",
    cut: "Where the margin was cut. With the bone left at the CEJ, the tissue grew back over it.",
  },
};
D.STATIC = staticSvg(D);

const scale = `<path class="cl-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="cl-t cl-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const tags = `<text class="cl-t cl-tag" x="${CX - 4.6 * S}" y="${PY + 10.4 * S}" text-anchor="middle">FACIAL</text><text class="cl-t cl-tag" x="${CX + 4.4 * S}" y="${PY + 10.4 * S}" text-anchor="middle">PALATAL</text>`;
const st0 = { mode: "os", step: 0 };
const svg = figureSvg({ width: W, height: H, className: "cl-svg", label: "A section through a maxillary central incisor with the bone crest at the CEJ, step by step through esthetic crown lengthening: sounding to bone, trimming 2 mm of gingiva, a full-thickness flap with 2 mm of bone removed, and the result at six months; or a gingivectomy alone, which grows back.",
  body: `<g class="cl-bonel">${clBoneSvg(st0, D)}</g>${D.STATIC}<g class="cl-dyn">${clDyn(st0, D)}</g>${tags}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 7", title: "Crown lengthening, step by step", hint: "step through", readout: "Step 1 · bone off", body: `<div class="am-svg cl-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Step">${[0, 1, 2, 3].map((n) => `<button type="button" class="am-btn" data-cls="${n}" aria-pressed="${n === 0}">${n + 1}. <span>${D.STEP.os[n]}</span></button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Approach"><button type="button" class="am-btn" data-clm="os" aria-pressed="true">With osseous surgery</button><button type="button" class="am-btn" data-clm="gv" aria-pressed="false">Gingivectomy alone</button></div>
<div class="am-stats"><span>Gingiva off <b data-cl="0"></b></span><span>Bone off <b data-cl="1"></b></span><span>Room above the bone <b data-cl="2"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the gingiva, the bone, the probe or the shaded room above the bone.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's Nov 12 live class: sounding to bone, a gingivectomy only in Type 1A, the flap and osseous surgery in 1B, "the same amount of bone as soft tissue" (2 mm for 2 mm, his rule of thumb), sutures out at 1 week, provisionals no sooner than 3 weeks and the definitive restorations at 6 months (his Patient 1).</li>
<li>Outside sources: the attachment above the crest follows Gargiulo, Wentz and Orban's supracrestal dimensions (J Periodontol 1961;32:261-7), and the coronal regrowth of soft tissue when too little room is left, over the following months, follows Brägger, Lauchenauer and Lang (J Clin Periodontol 1992;19:58-63) and Pontoriero and Carnevale (J Periodontol 2001;72:841-8). The tooth is Fig 4's (Wheeler's Dental Anatomy proportions).</li>
<li>A schematic, drawn to one scale (the 5 mm bar): only the 2 mm of gingiva and 2 mm of bone are the lecture's numbers; where the crest, MGJ and margin sit, how far the flap lifts and how far the tissue grows back are illustrative. Educational, not medical advice.</li></ul></details>`;

function clLive(root, D) {
  var svg = root.querySelector(".cl-svg"), dyn = svg.querySelector(".cl-dyn"), bonel = svg.querySelector(".cl-bonel"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { mode: "os", step: 0 };
  function draw() {
    bonel.innerHTML = D.clBoneSvg(st, D); dyn.innerHTML = D.clDyn(st, D);
    sum.textContent = D.SUM[st.mode][st.step];
    if (readout) readout.textContent = "Step " + (st.step + 1) + " · " + (st.mode === "os" ? "bone off" : "gingivectomy");
    var off = D.OFF[st.mode][st.step];
    root.querySelector('[data-cl="0"]').textContent = off[0]; root.querySelector('[data-cl="1"]').textContent = off[1]; root.querySelector('[data-cl="2"]').textContent = D.ROOM[st.mode][st.step];
    root.querySelectorAll("[data-cls]").forEach(function (x) { var n = +x.getAttribute("data-cls"); x.setAttribute("aria-pressed", String(n === st.step)); x.querySelector("span").textContent = D.STEP[st.mode][n]; });
    root.querySelectorAll("[data-clm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-clm") === st.mode)); });
  }
  root.querySelectorAll("[data-cls]").forEach(function (x) { x.addEventListener("click", function () { st.step = +x.getAttribute("data-cls"); draw(); }); });
  root.querySelectorAll("[data-clm]").forEach(function (x) { x.addEventListener("click", function () { st.mode = x.getAttribute("data-clm"); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .cl-box{max-width:520px;margin:0 auto}
.anima .cl-svg .cl-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .cl-svg .cl-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .cl-svg .cl-rot{fill:var(--anatomy-strong);font-weight:600;font-size:10.5px}
.anima .cl-svg .cl-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .cl-svg .cl-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .cl-svg .ap-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .cl-svg .ap-rot{fill:var(--anatomy-strong);font-weight:600;font-size:10.5px}
.anima .cl-svg .ap-on{font-size:10.5px;font-weight:600;fill:var(--ap-ink);paint-order:stroke;stroke:var(--ap-dentin);stroke-width:3px}
.anima .cl-svg .ap-dent{fill:var(--ap-dentin);stroke:var(--ap-line);stroke-width:1}
.anima .cl-svg .ap-enam{fill:var(--ap-enamel);stroke:var(--ap-line);stroke-width:.9;stroke-linejoin:round}
.anima .cl-svg .ap-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--ap-dentin));stroke:var(--pd-red-line);stroke-width:.6}
.anima .cl-svg .ap-kg,.anima .cl-svg .cl-kg{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1;stroke-linejoin:round}
.anima .cl-svg .ap-ker,.anima .cl-svg .cl-ker{fill:none;stroke:var(--pd-gum-line);stroke-width:2.4;stroke-linecap:round}
.anima .cl-svg .ap-guide,.anima .cl-svg .cl-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:2 3}
.anima .cl-svg .ap-brk,.anima .cl-svg .cl-brk{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3}
.anima .cl-svg .cl-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .cl-svg .cl-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .cl-svg .cl-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .cl-svg .cl-boneghost{fill:color-mix(in srgb, var(--pd-bone) 45%, transparent);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-dasharray:3 2.5}
.anima .cl-svg .cl-boneghost.over{fill:color-mix(in srgb, var(--pd-bone) 30%, transparent);stroke-width:1.3}
.anima .cl-svg .cl-muc{fill:var(--ap-muc);stroke:var(--pd-red-line);stroke-width:1;stroke-linejoin:round}
.anima .cl-svg .cl-ghost{fill:none;stroke:var(--pd-gum-line);stroke-width:1.2;stroke-dasharray:3 3}
.anima .cl-svg .cl-mgj{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:3 2}
.anima .cl-svg .cl-room{fill:color-mix(in srgb, var(--cl-ok) 45%, transparent);stroke:var(--cl-ok);stroke-width:.8}
.anima .cl-svg .cl-room.short{fill:color-mix(in srgb, var(--cl-short) 60%, transparent);stroke:var(--cl-short)}
.anima .cl-svg .cl-probe{fill:var(--cl-steel);stroke:var(--cl-steel-line);stroke-width:.8;stroke-linejoin:round}
.anima .cl-svg .cl-tick{fill:none;stroke:var(--cl-steel-line);stroke-width:1}
.anima .cl-svg .cl-cut{fill:none;stroke:var(--anatomy-strong);stroke-width:1.2;stroke-dasharray:3 2}
.anima .cl-svg .cl-cutdot{fill:var(--anatomy-strong)}
.anima .cl-svg .cl-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="clsteps"]{--ap-enamel:#fbf8f2;--ap-dentin:#dcc6a1;--ap-line:#a8916a;--ap-ink:#4a3b22;--ap-muc:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum));--cl-ok:#3f8f6c;--cl-short:#d08a12;--cl-steel:#c9d0d6;--cl-steel-line:#4d5964}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="clsteps"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b;--cl-ok:#6fc79c;--cl-short:#f0b24a;--cl-steel:#9aa5af;--cl-steel-line:#e3e8ec} }
:root[data-theme="dark"] .anima[data-anima="clsteps"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b;--cl-ok:#6fc79c;--cl-short:#f0b24a;--cl-steel:#9aa5af;--cl-steel-line:#e3e8ec}
`;

export function clsteps() {
  return { id: "clsteps", lec: "perio-plastic-esthetics", title: "Crown lengthening, step by step",
    caption: "Esthetic crown lengthening with the bone at the CEJ, as in his Patient 1: sound to bone, trim the gingiva, then take off as much bone as gingiva so the margin stays where it was put. Try a gingivectomy alone to see why it grows back. From the Nov 12 live class.",
    html: `<div class="anima" data-anima="clsteps">${plate}${controls}${SOURCES}</div>`, css: CSS, live: clLive.toString(), helpers: [apLerp, apF, apL, apBO, apIn, apTh, apP, apBand, apBone, clDyn, clBoneSvg], data: D };
}
