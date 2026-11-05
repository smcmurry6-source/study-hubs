// Fig 3: "Primary or secondary? Read the labs" (L12 Endocrine Pathology Parts 1 and 2, Dr. Dababneh). One loop drawn
// left to right for four glands: the driver (pituitary TSH or ACTH, the kidney's renin, the blood calcium the
// parathyroids sense) -> the gland -> its hormone -> the target, with the negative feedback arcing back over the top.
// Pick a disease: the culprit is marked, the signals on each arrow speed up or die away, and the lab slip underneath
// gives the arrows (qualitative only: high, low, normal, never invented numbers) and the verdict. "Mystery case" hides
// the verdict and the culprit until you make the call. Different from Exam 1's hpa figure on purpose: a horizontal
// loop with a lab slip, four glands, and a guessing mode.
import { makeFig, f1, T, HOT } from "./shared.mjs";

function alBez(p, u) { var a = 1 - u; return [a * a * a * p[0] + 3 * a * a * u * p[2] + 3 * a * u * u * p[4] + u * u * u * p[6], a * a * a * p[1] + 3 * a * a * u * p[3] + 3 * a * u * u * p[5] + u * u * u * p[7]]; }
/* signal dots moving along a straight arrow or a cubic curve; how many and how fast follow the level (-1, 0, 1) */
function alDots(seg, lv, t, cls, curve) {
  var n = lv > 0 ? 6 : lv < 0 ? 1 : 3, per = lv > 0 ? 1500 : lv < 0 ? 3800 : 2400, o = "", k;
  for (k = 0; k < n; k++) {
    var u = t ? ((t / per + k / n) % 1) : (k + 0.5) / n, p = curve ? alBez(seg, u) : [seg[0] + (seg[2] - seg[0]) * u, seg[1] + (seg[3] - seg[1]) * u];
    var op = Math.min(1, u / 0.12, (1 - u) / 0.12) * (lv < 0 ? 0.55 : 1);
    o += cls === "al-fbp" ? '<rect class="al-fbp" x="' + f1(p[0] - 4) + '" y="' + f1(p[1] - 1.3) + '" width="8" height="2.6" rx="1" opacity="' + f1(op) + '"/>' : '<circle class="' + cls + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3.2" opacity="' + f1(op) + '"/>';
  }
  return o;
}
/* the little organ drawn inside each node */
function alIcon(k, x, y) {
  if (k === "pit") return '<path class="al-stalk" d="M' + (x + 2) + " " + (y - 24) + "C" + (x + 2) + " " + (y - 14) + " " + (x + 4) + " " + (y - 12) + " " + (x + 5) + " " + (y - 8) + '"/><ellipse class="al-org" cx="' + (x - 4) + '" cy="' + (y + 2) + '" rx="13" ry="10"/><ellipse class="al-org2" cx="' + (x + 10) + '" cy="' + (y + 1) + '" rx="7" ry="8"/>';
  if (k === "thy" || k === "para") {
    var lobes = '<ellipse class="' + (k === "para" ? "al-ghost" : "al-org") + '" cx="' + (x - 11) + '" cy="' + y + '" rx="8" ry="16" transform="rotate(-10 ' + (x - 11) + " " + y + ')"/><ellipse class="' + (k === "para" ? "al-ghost" : "al-org") + '" cx="' + (x + 11) + '" cy="' + y + '" rx="8" ry="16" transform="rotate(10 ' + (x + 11) + " " + y + ')"/><rect class="' + (k === "para" ? "al-ghost" : "al-org") + '" x="' + (x - 6) + '" y="' + (y + 3) + '" width="12" height="7" rx="3"/>';
    if (k === "thy") return lobes;
    return lobes + [[-12, -8], [-10, 9], [12, -8], [10, 9]].map(function (d) { return '<ellipse class="al-para" cx="' + (x + d[0]) + '" cy="' + (y + d[1]) + '" rx="4.2" ry="3.4"/>'; }).join("");
  }
  if (k === "adrC" || k === "adrA") return '<path class="al-kid" d="M' + (x - 15) + " " + (y + 6) + "C" + (x - 18) + " " + (y + 26) + " " + (x + 18) + " " + (y + 26) + " " + (x + 15) + " " + (y + 6) + "C" + (x + 8) + " " + (y + 10) + " " + (x - 8) + " " + (y + 10) + " " + (x - 15) + " " + (y + 6) + 'Z"/><path class="al-adr" d="M' + (x - 17) + " " + (y + 4) + "Q" + x + " " + (y - 30) + " " + (x + 17) + " " + (y + 4) + 'Z"/><path class="' + (k === "adrA" ? "al-zone al-zone-on" : "al-zone") + '" d="M' + (x - 14) + " " + (y + 2) + "Q" + x + " " + (y - 26) + " " + (x + 14) + " " + (y + 2) + '"/><path class="' + (k === "adrC" ? "al-zone al-zone-on" : "al-zone") + '" d="M' + (x - 10) + " " + (y + 2) + "Q" + x + " " + (y - 19) + " " + (x + 10) + " " + (y + 2) + '"/><path class="al-med" d="M' + (x - 6) + " " + (y + 3) + "Q" + x + " " + (y - 9) + " " + (x + 6) + " " + (y + 3) + 'Z"/>';
  if (k === "kid") return '<path class="al-kid" d="M' + (x - 3) + " " + (y - 19) + "C" + (x - 22) + " " + (y - 19) + " " + (x - 22) + " " + (y + 19) + " " + (x - 3) + " " + (y + 19) + "C" + (x + 9) + " " + (y + 19) + " " + (x + 11) + " " + (y + 8) + " " + (x + 5) + " " + (y + 3) + "C" + (x + 2) + " " + y + " " + (x + 2) + " " + y + " " + (x + 5) + " " + (y - 3) + "C" + (x + 11) + " " + (y - 8) + " " + (x + 9) + " " + (y - 19) + " " + (x - 3) + " " + (y - 19) + 'Z"/><circle class="al-jg" cx="' + (x + 2) + '" cy="' + y + '" r="3.2"/>';
  if (k === "ca") return '<rect class="al-vessel" x="' + (x - 25) + '" y="' + (y - 10) + '" width="50" height="20" rx="10"/>' + [-14, -4, 6, 15].map(function (d, i) { return '<circle class="al-ca" cx="' + (x + d) + '" cy="' + (y + (i % 2 ? 3 : -3)) + '" r="3"/>'; }).join("");
  if (k === "cells") return [[-11, -8], [10, -9], [0, 10]].map(function (d) { return '<circle class="al-cell" cx="' + (x + d[0]) + '" cy="' + (y + d[1]) + '" r="10"/><circle class="al-nuc" cx="' + (x + d[0] + 1) + '" cy="' + (y + d[1]) + '" r="3.6"/>'; }).join("");
  if (k === "tub") return '<path class="al-tube" d="M' + (x - 14) + " " + (y - 20) + "V" + (y + 8) + "A14 14 0 0 0 " + (x + 14) + " " + (y + 8) + "V" + (y - 20) + '"/><path class="al-tubel" d="M' + (x - 14) + " " + (y - 20) + "V" + (y + 8) + "A14 14 0 0 0 " + (x + 14) + " " + (y + 8) + "V" + (y - 20) + '"/>';
  if (k === "bone") return '<path class="al-bone" d="M' + (x - 16) + " " + (y - 4) + "H" + (x + 16) + "A6 6 0 1 1 " + (x + 20) + " " + (y - 13) + "A6 6 0 1 1 " + (x + 21) + " " + (y + 2) + "A6 6 0 1 1 " + (x + 16) + " " + (y + 4) + "H" + (x - 16) + "A6 6 0 1 1 " + (x - 21) + " " + (y + 2) + "A6 6 0 1 1 " + (x - 20) + " " + (y - 13) + "A6 6 0 1 1 " + (x - 16) + " " + (y - 4) + 'Z"/>';
  if (k === "lung") return '<path class="al-lung" d="M' + (x + 4) + " " + (y - 16) + "C" + (x - 10) + " " + (y - 16) + " " + (x - 16) + " " + (y + 2) + " " + (x - 14) + " " + (y + 14) + "C" + (x - 4) + " " + (y + 16) + " " + (x + 6) + " " + (y + 12) + " " + (x + 8) + " " + (y + 8) + "V" + (y - 12) + 'Z"/><circle class="al-tumor" cx="' + (x - 4) + '" cy="' + (y + 3) + '" r="4.4"/>';
  return "";
}
function alArrow(x1, y1, x2, y2, cls) { var a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a); return '<path class="' + cls + '" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(x2 - c * 6) + " " + f1(y2 - s * 6) + '"/><path class="' + cls + '-h" d="M' + f1(x2) + " " + f1(y2) + "L" + f1(x2 - c * 9 - s * 5) + " " + f1(y2 - s * 9 + c * 5) + "L" + f1(x2 - c * 9 + s * 5) + " " + f1(y2 - s * 9 - c * 5) + 'Z"/>'; }

function alRender(st, D) {
  var o = "", t = st.t || 0, G = D.G[st.g], Lz = D.LES[st.les], lv = Lz.lv, hide = st.mys && !st.guess, Y = 118, NX = [64, 240, 416], R = 34;
  var pulse = t ? 0.5 + 0.5 * Math.sin(t / 380) : 0.6;
  /* the feedback arc over the top, from the target back to the driver */
  var arc = [416, 82, 416, 24, 64, 24, 64, 82];
  o += HOT("Negative feedback: " + G.fbInfo, '<path class="al-fbarc' + (lv[2] < 0 ? " al-weak" : "") + '" d="M416 82C416 24 64 24 64 82"/>' + alArrow(64, 72, 64, 83, "al-fbh"));
  o += alDots(arc, lv[2], t, "al-fbp", true);
  o += '<circle class="al-minus" cx="240" cy="38.5" r="9"/><path class="al-minus-l" d="M235 38.5H245"/>';
  o += T(240, 20, Lz.fbTxt || G.fb, "s b al-fbt", "middle");
  /* forward arrows with their signals */
  var sigLv = lv[0], horLv = lv[1];
  o += HOT(G.sigInfo, alArrow(100, Y, 203, Y, "al-arr") + alDots([102, Y, 198, Y], sigLv, t, "al-sp", false)) + G.sig.split("|").reverse().map(function (s, i) { return T(151, Y - 12 - i * 14, s, "s b", "middle"); }).join("");
  o += HOT(G.horInfo, alArrow(276, Y, 379, Y, "al-arr") + alDots([278, Y, 374, Y], horLv, t, "al-hp", false)) + T(327, Y - 12, G.hor, "s b", "middle");
  /* the ectopic ACTH source */
  if (Lz.ect) {
    o += HOT("An ectopic tumor, here a lung cancer, making ACTH as a paraneoplastic effect: it ignores cortisol's feedback and drives both adrenals.", '<circle class="al-node al-on" cx="128" cy="216" r="21"/>' + alIcon("lung", 128, 216)) + alArrow(143, 201, 207, 133, "al-arr") + alDots([145, 199, 204, 137], 1, t, "al-sp", false) + T(150, 174, "ACTH", "s b", "end") + T(100, 220, "lung tumor", "s b", "end");
  }
  /* the three nodes */
  var keys = ["drv", "gl", "tg"];
  keys.forEach(function (k, i) {
    var x = NX[i], l = i < 2 ? lv[i] : (Lz.cul === "tg" ? -1 : 0), cls = "al-node" + (l > 0 ? " al-on" : l < 0 ? " al-off" : "");
    var halo = l > 0 ? '<circle class="al-halo" cx="' + x + '" cy="' + Y + '" r="' + f1(R + 3 + pulse * 4) + '" opacity="' + f1(0.35 + pulse * 0.4) + '"/>' : "";
    o += HOT(G.info[i], halo + '<circle class="' + cls + '" cx="' + x + '" cy="' + Y + '" r="' + R + '"/><g' + (l < 0 ? ' opacity=".45"' : "") + ">" + alIcon(G.icon[i], x, Y) + "</g>");
    o += T(x, Y + R + 18, G.name[i], "s b", "middle");
    if (G.sub[i]) o += T(x, Y + R + 32, G.sub[i], "s mut", "middle");
  });
  /* the culprit, hidden in a mystery case until the call is made */
  if (Lz.cul && !hide) {
    var ci = { drv: 0, gl: 1, tg: 2, ect: -1 }[Lz.cul], cx = ci < 0 ? 147 : NX[ci] + 25, cy = ci < 0 ? 232 : Y - 25;
    o += '<circle class="al-culr" cx="' + cx + '" cy="' + cy + '" r="' + f1(10 + pulse * 5) + '" opacity="' + f1(0.7 - pulse * 0.5) + '"/><circle class="al-cul" cx="' + cx + '" cy="' + cy + '" r="9"/><path class="al-bang" d="M' + cx + " " + (cy - 5) + "V" + (cy + 1.5) + '"/><circle class="al-bangd" cx="' + cx + '" cy="' + (cy + 5) + '" r="1.4"/>';
    if (ci >= 0 && Lz.cn) o += T(NX[ci], Y + R + (G.sub[ci] ? 46 : 32), Lz.cn, "s b bad", "middle");
    if (Lz.cul === "tg") o += '<path class="al-x" d="M370 108l14 20M384 108l-14 20"/>';
  }
  /* the lab slip */
  var SY = 262;
  o += '<rect class="al-slip" x="14" y="' + SY + '" width="452" height="158" rx="6"/><path class="al-rule" d="M14 ' + (SY + 28) + 'H466"/>';
  o += st.mys ? T(28, SY + 19, "Patient: " + Lz.clue, "s b", "start") : T(28, SY + 19, "LAB SLIP", "s b al-mono", "start") + T(104, SY + 19, Lz.title, "s b", "start");
  var labs = [[G.labs[0], Lz.labs[0], Lz.w0], [G.labs[1], Lz.labs[1], Lz.w1]];
  labs.forEach(function (b, i) {
    var x = 28 + i * 122, y = SY + 40, v = b[1], word = b[2] || (v > 0 ? "high" : v < 0 ? "low" : "normal");
    o += HOT(b[0] + ": " + word + ". " + (i === 0 ? "The gland's hormone." : "Its driver, read with it."), '<rect class="al-tile" x="' + x + '" y="' + y + '" width="112" height="76" rx="6"/>' + T(x + 56, y + 19, b[0], "s b", "middle") + '<text class="t al-big ' + (v > 0 ? "al-upc" : v < 0 ? "al-dnc" : "al-eqc") + '" x="' + (x + 56) + '" y="' + (y + 50) + '" text-anchor="middle">' + (v > 0 ? "▲" : v < 0 ? "▼" : "=") + "</text>" + T(x + 56, y + 68, word, "s", "middle"));
  });
  var chx = 28;
  if (Lz.extra) Lz.extra.forEach(function (e) {
    var y = SY + 126, v = e[1], w = Math.round(e[0].length * 7.3 + 34);
    o += HOT(e[0] + ": " + (v > 0 ? "high" : v < 0 ? "low" : "normal") + ".", '<rect class="al-chip" x="' + chx + '" y="' + y + '" width="' + w + '" height="24" rx="12"/><text class="t s b" x="' + (chx + 11) + '" y="' + (y + 16) + '">' + e[0] + ' <tspan class="' + (v > 0 ? "al-upc" : v < 0 ? "al-dnc" : "al-eqc") + '">' + (v > 0 ? "▲" : v < 0 ? "▼" : "=") + "</tspan></text>");
    chx += w + 8;
  });
  if (G.shared) o += T(28, SY + 142, G.shared, "s mut", "start");
  /* the verdict stamp */
  var K = D.KIND[Lz.kind], sc = hide ? "al-stq" : "al-st-" + Lz.kind;
  o += '<g transform="rotate(-5 370 ' + (SY + 77) + ')"><rect class="al-stamp ' + sc + '" x="290" y="' + (SY + 46) + '" width="160" height="62" rx="6"/>';
  o += hide ? T(370, SY + 80, "?", "al-stw al-stq-t", "middle") + T(370, SY + 98, "your call", "s al-stq-t", "middle") : T(370, SY + 76, K[0], "al-stw al-st-" + Lz.kind + "-t", "middle") + T(370, SY + 96, Lz.kind === "n" ? K[1] : Lz.sub || K[1], "s al-st-" + Lz.kind + "-t", "middle");
  o += "</g>";
  o += T(240, SY + 178, G.rule, "s b al-rulet", "middle");
  return o;
}
function alSay(st, D) {
  var Lz = D.LES[st.les], G = D.G[st.g], K = D.KIND[Lz.kind];
  if (st.mys && !st.guess) return ["Mystery case. The patient: " + Lz.clue + ". Read the lab slip together: is the problem in the gland itself (primary), or is something outside driving it (secondary)" + (st.g === "pth" ? ", or do the target organs ignore the hormone" : "") + "? Make your call with the buttons below.", "mystery: your call"];
  if (st.mys) { var ok = st.guess === Lz.kind; return [(ok ? "Right: " : "Not quite: ") + Lz.title + ". " + Lz.sum + " " + G.ruleLong, (ok ? "right: " : "answer: ") + K[0].toLowerCase()]; }
  return [(Lz.kind === "n" ? "" : Lz.title + ". ") + Lz.sum + (Lz.kind === "n" ? "" : " " + G.ruleLong), Lz.ro || K[0].toLowerCase()];
}
function alSet(st, k, D) {
  var ids = Object.keys(D.LES);
  if (k === "g") { st.les = st.g + "N"; st.mys = 0; st.guess = ""; }
  if (k === "les") { st.g = D.LES[st.les].g; st.mys = 0; st.guess = ""; }
  if (k === "mys") { var pool = ids.filter(function (i) { return D.LES[i].kind !== "n" && i !== st.les; }); st.les = pool[Math.floor(Math.random() * pool.length)]; st.g = D.LES[st.les].g; st.guess = ""; }
}

const D = {
  ANIM: true, ONSET: "alSet", INIT: { g: "thy", les: "graves", mys: 0, guess: "" },
  KIND: { n: ["NORMAL", "feedback in balance"], p: ["PRIMARY", "in the gland itself"], s: ["SECONDARY", "driven from outside"], t: ["TARGET", "the target ignores it"] },
  G: {
    thy: { name: ["pituitary", "thyroid", "body tissues"], sub: ["", "", "metabolism"], icon: ["pit", "thy", "cells"], sig: "TSH", hor: "T4, T3", fb: "T4 turns TSH down",
      labs: ["free T4", "TSH"], rule: "T4 and TSH opposite: primary · same way: secondary",
      ruleLong: "The rule: read T4 with TSH. Opposite directions, the thyroid itself (primary); the same direction, the pituitary (secondary). It works for any gland the pituitary talks to.",
      fbInfo: "T4 and T3 tell the pituitary to cut TSH. When the thyroid overproduces, TSH falls; when it fails, TSH climbs.",
      sigInfo: "TSH, thyroid-stimulating hormone, from the pituitary's thyrotrophs, drives the thyroid.", horInfo: "T4 and T3: thyroid hormone, which controls metabolism and energy.",
      info: ["The anterior pituitary: its thyrotrophs make TSH.", "The thyroid: its follicles make T4 and T3 when TSH asks.", "Body tissues: thyroid hormone sets the metabolic rate, so excess runs everything fast and deficiency slows it down."] },
    cor: { name: ["pituitary", "adrenal cortex", "tissues"], sub: ["", "zona fasciculata", "liver, fat"], icon: ["pit", "adrC", "cells"], sig: "ACTH", hor: "cortisol", fb: "cortisol turns ACTH down",
      labs: ["cortisol", "ACTH"], rule: "cortisol and ACTH opposite: primary · same way: secondary",
      ruleLong: "The rule, as with the thyroid: read cortisol with ACTH. Cortisol high and ACTH low, the adrenal (primary); both high, ACTH is the driver, from a pituitary tumor or an ectopic tumor (secondary).",
      fbInfo: "Cortisol tells the pituitary to stop making ACTH. A cortisol-making adrenal tumor therefore drives ACTH down.",
      sigInfo: "ACTH, adrenocorticotropic hormone, from the pituitary's corticotrophs, asks the adrenal cortex to release cortisol.", horInfo: "Cortisol: it inhibits glucose uptake by cells, promotes fat deposition and increases hepatic gluconeogenesis.",
      info: ["The anterior pituitary: its corticotrophs make ACTH.", "The adrenal cortex, middle layer (zona fasciculata, sugar): it makes cortisol when ACTH asks.", "Tissues: liver gluconeogenesis, fat deposition, less glucose taken up by cells. In excess: central obesity, moon face, buffalo hump, hyperglycemia, hypertension."] },
    ald: { name: ["kidney", "adrenal cortex", "kidney tubule"], sub: ["renin", "zona glomerulosa", "Na⁺ in, K⁺ out"], icon: ["kid", "adrA", "tub"], sig: "renin →|angiotensin II", hor: "aldosterone", fb: "salt and volume turn renin down",
      labs: ["aldosterone", "renin"], rule: "renin low: primary · renin high: secondary", shared: "both kinds: hypertension, fatigue, Na⁺ high, K⁺ low",
      ruleLong: "The rule: read aldosterone with renin. Renin low, the adrenal makes it on its own (primary); renin high, the kidney's renin is driving it (secondary). Both kinds share hypertension, fatigue, high sodium and low potassium.",
      fbInfo: "Aldosterone holds sodium and water, the volume rises and the kidney cuts its renin.",
      sigInfo: "Renin from the kidney acts on angiotensinogen to form angiotensin I; ACE turns it into angiotensin II, which stimulates aldosterone secretion.", horInfo: "Aldosterone: the kidney takes back sodium and dumps potassium. The major regulator of fluid volume.",
      info: ["The kidney releases renin when it isn't getting the blood it needs.", "The adrenal cortex, outer layer (zona glomerulosa, salt): it makes aldosterone.", "The kidney tubule: aldosterone makes it retain sodium and excrete potassium, so too much aldosterone means too much salt and high blood pressure."] },
    pth: { name: ["blood calcium", "parathyroids", "bone, kidney"], sub: ["", "4 glands", "Ca²⁺ in, PO₄ out"], icon: ["ca", "para", "bone"], sig: "low Ca²⁺", hor: "PTH", fb: "calcium rises: PTH switches off",
      labs: ["PTH", "calcium"], rule: "PTH and Ca both high: primary · Ca low: look outside",
      ruleLong: "The rule: read PTH with calcium. Both high, the gland ignores the calcium (primary); PTH high with calcium low, the low calcium drives it (secondary); PTH high but calcium still low and phosphate high, the target organs resist PTH (pseudohypoparathyroidism).",
      fbInfo: "When serum calcium falls the glands release PTH; as calcium rises, it switches them off.",
      sigInfo: "Falling serum calcium is the stimulus: the parathyroids sense it and release PTH.", horInfo: "PTH, parathyroid hormone: it takes back calcium and dumps phosphate.",
      info: ["Serum calcium, the signal the parathyroids watch.", "The four parathyroid glands behind the thyroid: they release PTH when calcium falls.", "Bone and kidney: PTH increases bone turnover (calcium out of bone), increases calcium reabsorption and decreases phosphate reabsorption in the kidney, and raises active vitamin D. Takes back calcium, dumps phosphate."] },
  },
  /* lv = [driver, gland, feedback] levels; labs = [gland's hormone, driver]; cul = where the problem is */
  LES: {
    thyN: { g: "thy", kind: "n", title: "Normal loop", lv: [0, 0, 0], labs: [0, 0], sum: "The normal loop: TSH from the pituitary drives the thyroid to make T4 and T3, and T4 turns TSH back down. Pick a disease, or try a mystery case.", ro: "normal loop" },
    graves: { g: "thy", kind: "p", title: "Graves disease", lv: [-1, 1, 1], labs: [1, -1], cul: "gl", cn: "stimulating antibody", fbTxt: "high T4 shuts TSH off", clue: "nervous, losing weight, heat intolerant",
      sum: "An IgG autoantibody stimulates the TSH receptor, so the thyroid overproduces on its own. The high T4 shuts TSH off by negative feedback: T4 high, TSH low. Opposite directions: primary, the thyroid itself.", ro: "primary · T4▲ TSH▼" },
    tshoma: { g: "thy", kind: "s", title: "TSH-secreting pituitary adenoma", lv: [1, 1, 1], labs: [1, 1], cul: "drv", cn: "TSH adenoma", fbTxt: "the tumor ignores the feedback", clue: "nervous, losing weight, heat intolerant",
      sum: "The pituitary overproduces TSH and the TSH drives the thyroid: T4 high, TSH high. Same direction: secondary, the pituitary.", ro: "secondary · T4▲ TSH▲" },
    hashi: { g: "thy", kind: "p", title: "Hashimoto thyroiditis", lv: [1, -1, -1], labs: [-1, 1], cul: "gl", cn: "autoimmune damage", fbTxt: "no brake left: TSH climbs", clue: "tired, cold intolerant, gaining weight",
      sum: "A chronic autoimmune thyroiditis, the most common cause of hypothyroidism in the US: lymphocytes shut down the follicles (in this lecture, antibodies block the TSH receptor). The thyroid fails, feedback is lost and the pituitary raises TSH: T4 low, TSH high. Opposite directions: primary.", ro: "primary · T4▼ TSH▲" },
    sheehan: { g: "thy", kind: "s", title: "Sheehan syndrome", lv: [-1, -1, -1], labs: [-1, -1], cul: "drv", cn: "necrosis", fbTxt: "the pituitary can't answer", clue: "tired, cold intolerant, gaining weight",
      sum: "Around delivery, a sudden drop in blood pressure cuts the pituitary's blood supply and the anterior pituitary shuts down. No TSH, so the thyroid isn't driven: T4 low, TSH low. Same direction: secondary.", ro: "secondary · T4▼ TSH▼" },
    corN: { g: "cor", kind: "n", title: "Normal loop", lv: [0, 0, 0], labs: [0, 0], sum: "The normal loop: ACTH from the pituitary asks the adrenal cortex (zona fasciculata) for cortisol, and cortisol turns ACTH back down. Pick a disease, or try a mystery case.", ro: "normal loop" },
    cpit: { g: "cor", kind: "s", title: "Pituitary tumor making ACTH", lv: [1, 1, 1], labs: [1, 1], cul: "drv", cn: "ACTH adenoma", fbTxt: "the tumor ignores the feedback", clue: "moon face, buffalo hump, central obesity",
      sum: "A corticotroph adenoma overproduces ACTH (Cushing disease), which drives both adrenal cortices into hyperplasia: cortisol high, ACTH high. Both high: secondary.", ro: "secondary · cort▲ ACTH▲" },
    cect: { g: "cor", kind: "s", title: "Ectopic ACTH (a lung cancer)", lv: [-1, 1, 1], labs: [1, 1], cul: "ect", ect: 1, fbTxt: "pituitary shut off; the tumor ignores it", clue: "moon face, buffalo hump, central obesity",
      sum: "A lung cancer makes ACTH as a paraneoplastic effect (just as some make ADH), and the ACTH drives the adrenals: cortisol high, ACTH high, the secondary pattern. The pituitary itself is shut off by the feedback, but the tumor doesn't listen. On these two tests it looks the same as a pituitary tumor; the lung mass tells them apart.", ro: "secondary · cort▲ ACTH▲" },
    cadr: { g: "cor", kind: "p", title: "Adrenal tumor making cortisol", lv: [-1, 1, 1], labs: [1, -1], cul: "gl", cn: "cortical tumor", fbTxt: "high cortisol shuts ACTH off", clue: "moon face, buffalo hump, central obesity",
      sum: "A tumor of the adrenal cortex makes cortisol itself. The extra cortisol feeds back and tells the pituitary to stop making ACTH: cortisol high, ACTH low. Primary.", ro: "primary · cort▲ ACTH▼" },
    addison: { g: "cor", kind: "p", title: "Addison disease", lv: [1, -1, -1], labs: [-1, 1], cul: "gl", cn: "whole cortex fails", fbTxt: "no brake left: ACTH climbs", clue: "weak, tired, low blood pressure, low glucose",
      extra: [["aldosterone", -1], ["Na⁺", -1], ["K⁺", 1], ["glucose", -1]],
      sum: "Chronic primary hypoadrenalism: the whole cortex fails (autoimmune in 60 to 70 percent), so there's no cortisol, no aldosterone and no androgens. Without aldosterone, sodium is low, potassium high and blood pressure low; without cortisol, glucose is low. With the cortex failing, feedback is lost and the pituitary keeps pushing: ACTH high. Primary.", ro: "primary · cort▼ ACTH▲" },
    csec: { g: "cor", kind: "s", title: "Pituitary failure (secondary hypoadrenalism)", lv: [-1, -1, -1], labs: [-1, -1], cul: "drv", cn: "no ACTH made", fbTxt: "the pituitary can't answer", clue: "weak, tired, low blood pressure, low glucose",
      sum: "When the failure is at the pituitary, there's no ACTH to drive the cortex: ACTH low and cortisol low. Same direction: secondary.", ro: "secondary · cort▼ ACTH▼" },
    aldN: { g: "ald", kind: "n", title: "Normal loop", lv: [0, 0, 0], labs: [0, 0], sum: "The normal loop: renin from the kidney forms angiotensin I, ACE turns it into angiotensin II, and angiotensin II stimulates aldosterone from the zona glomerulosa. Aldosterone takes back sodium and dumps potassium, and the extra salt and volume turn renin down.", ro: "normal loop" },
    conn: { g: "ald", kind: "p", title: "Conn syndrome (adrenal adenoma) or hyperplasia", lv: [-1, 1, 1], labs: [1, -1], cul: "gl", cn: "adenoma or hyperplasia", fbTxt: "salt and volume shut renin off", clue: "high blood pressure, fatigue, low potassium",
      sum: "Primary hyperaldosteronism starts in the adrenal: an adenoma (Conn syndrome) or adrenocortical hyperplasia. The aldosterone doesn't come from the renin-angiotensin system, so feedback shuts renin down: aldosterone high, renin low.", ro: "primary · aldo▲ renin▼" },
    ras: { g: "ald", kind: "s", title: "Renal artery stenosis or heart failure", lv: [1, 1, 1], labs: [1, 1], cul: "drv", cn: "low blood flow", fbTxt: "the starved kidney keeps asking", clue: "high blood pressure, fatigue, low potassium",
      sum: "Secondary hyperaldosteronism starts at the kidney: renal artery stenosis, or congestive heart failure with poor renal perfusion. The kidney isn't getting the blood it needs, so it overproduces renin, and renin drives aldosterone: aldosterone high, renin high.", ro: "secondary · aldo▲ renin▲" },
    rtum: { g: "ald", kind: "s", title: "Renin-secreting tumor", lv: [1, 1, 1], labs: [1, 1], cul: "drv", cn: "renin tumor", fbTxt: "the tumor ignores the feedback", clue: "high blood pressure, fatigue, low potassium",
      sum: "A renin-secreting tumor is another way to get the secondary pattern: renin high, aldosterone high.", ro: "secondary · aldo▲ renin▲" },
    pthN: { g: "pth", kind: "n", title: "Normal loop", lv: [0, 0, 0], labs: [0, 0], extra: [["PO₄", 0]], sum: "The normal loop: when serum calcium falls, the parathyroids release PTH. PTH takes back calcium (from bone, and at the kidney), dumps phosphate in the urine and raises active vitamin D; as calcium rises, it switches the glands off.", ro: "normal loop" },
    pad: { g: "pth", kind: "p", title: "Parathyroid adenoma", lv: [-1, 1, 1], labs: [1, 1], extra: [["PO₄", -1]], cul: "gl", cn: "adenoma", fbTxt: "high calcium should stop PTH: ignored", clue: "kidney stones; high calcium on a routine panel",
      sum: "Primary hyperparathyroidism: PTH inappropriately high for the calcium, with nothing driving it. An adenoma is the usual cause (80 to 90 percent), then hyperplasia, rarely carcinoma; the labs can't tell adenoma from hyperplasia. PTH takes back calcium and dumps phosphate: calcium high, phosphate low. Stones, bones and groans.", ro: "primary · PTH▲ Ca▲" },
    psec: { g: "pth", kind: "s", title: "Kidney failure or low vitamin D", lv: [1, 1, -1], labs: [1, -1], w1: "low or low-normal", cul: "drv", cn: "low Ca²⁺", fbTxt: "calcium stays low: no off switch", clue: "on dialysis for kidney failure",
      sum: "Secondary hyperparathyroidism: chronic hypocalcemia, most often from renal failure (also calcium or vitamin D deficiency), drives the glands, usually all of them, into hyperplasia: PTH high, calcium low or low-normal. Fix the cause and the glands settle.", ro: "secondary · PTH▲ Ca▼" },
    phypo: { g: "pth", kind: "p", title: "Hypoparathyroidism", lv: [1, -1, -1], labs: [-1, -1], extra: [["PO₄", 1]], cul: "gl", cn: "glands removed or absent", fbTxt: "low calcium calls; no gland answers", clue: "tingling; face twitches when the cheek is tapped",
      sum: "Too little PTH, from the glands themselves: removed with a thyroidectomy, absent in DiGeorge syndrome, or destroyed by autoimmunity. The kidney dumps calcium and keeps phosphate: calcium low, phosphate high. Tetany, Chvostek and Trousseau signs, dental root hypoplasia.", sub: "the gland fails", ro: "gland · PTH▼ Ca▼" },
    ppseudo: { g: "pth", kind: "t", title: "Pseudohypoparathyroidism", lv: [1, 1, -1], labs: [1, -1], extra: [["PO₄", 1]], cul: "tg", cn: "resists PTH", fbTxt: "the target doesn't respond", clue: "short stature, short metacarpals, low calcium",
      sum: "It looks like hypoparathyroidism (calcium low, phosphate high), but PTH is high: the target organs, such as the kidney, resist PTH, so the glands keep pushing. Short stature and short metacarpals and metatarsals. Rule out renal failure, malabsorption and vitamin D deficiency first.", ro: "target · PTH▲ Ca▼" },
  },
};

const CSS = `
.anima .axislab-svg .t{font-size:13px}
.anima .axislab-svg .t.s{font-size:12px}
.anima .axislab-svg .al-node{fill:var(--anatomy-face);stroke:var(--line-strong);stroke-width:1.4}
.anima .axislab-svg .al-node.al-on{stroke:var(--bx-hot);stroke-width:2}
.anima .axislab-svg .al-node.al-off{stroke-dasharray:4 3;fill:var(--anatomy-shade-1)}
.anima .axislab-svg .al-halo{fill:none;stroke:var(--bx-hot);stroke-width:2}
.anima .axislab-svg .al-org{fill:var(--bx-eosin);stroke:var(--bx-memb);stroke-width:1.1}
.anima .axislab-svg .al-org2{fill:var(--bx-cyto);stroke:var(--bx-memb);stroke-width:1.1}
.anima .axislab-svg .al-stalk{fill:none;stroke:var(--bx-memb);stroke-width:2.4;stroke-linecap:round}
.anima .axislab-svg .al-ghost{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 2}
.anima .axislab-svg .al-para{fill:var(--bx-gold-soft);stroke:var(--bx-glu);stroke-width:1.3}
.anima .axislab-svg .al-kid{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.1}
.anima .axislab-svg .al-jg{fill:var(--bx-violet)}
.anima .axislab-svg .al-adr{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .axislab-svg .al-zone{fill:none;stroke:var(--bx-gold);stroke-width:1;opacity:.5}
.anima .axislab-svg .al-zone.al-zone-on{stroke:var(--bx-hot);stroke-width:3;opacity:1}
.anima .axislab-svg .al-med{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .axislab-svg .al-vessel{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.1}
.anima .axislab-svg .al-ca{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1}
.anima .axislab-svg .al-cell{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .axislab-svg .al-nuc{fill:var(--bx-nuc)}
.anima .axislab-svg .al-tube{fill:none;stroke:var(--bx-cyto);stroke-width:9;stroke-linecap:round}
.anima .axislab-svg .al-tubel{fill:none;stroke:var(--bx-cyto-line);stroke-width:1;stroke-dasharray:2 3}
.anima .axislab-svg .al-bone{fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .axislab-svg .al-lung{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.1}
.anima .axislab-svg .al-tumor{fill:var(--bx-nuc)}
.anima .axislab-svg .al-arr{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6}
.anima .axislab-svg .al-arr-h{fill:var(--anatomy-mid)}
.anima .axislab-svg .al-sp{fill:var(--bx-violet)}
.anima .axislab-svg .al-hp{fill:var(--bx-hot)}
.anima .axislab-svg .al-fbarc{fill:none;stroke:var(--bx-inhib);stroke-width:1.6;stroke-dasharray:6 4}
.anima .axislab-svg .al-fbarc.al-weak{opacity:.4}
.anima .axislab-svg .al-fbh{fill:none;stroke:var(--bx-inhib);stroke-width:1.6}
.anima .axislab-svg .al-fbh-h{fill:var(--bx-inhib)}
.anima .axislab-svg .al-fbp{fill:var(--bx-inhib)}
.anima .axislab-svg .al-minus{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.6}
.anima .axislab-svg .al-minus-l{stroke:var(--bx-inhib);stroke-width:2.2;stroke-linecap:round}
.anima .axislab-svg .t.al-fbt{fill:var(--bx-inhib)}
.anima .axislab-svg .al-cul{fill:var(--bx-inhib)}
.anima .axislab-svg .al-culr{fill:none;stroke:var(--bx-inhib);stroke-width:2}
.anima .axislab-svg .al-bang{stroke:var(--surface);stroke-width:2.4;stroke-linecap:round}
.anima .axislab-svg .al-bangd{fill:var(--surface)}
.anima .axislab-svg .al-x{stroke:var(--bx-inhib);stroke-width:3;stroke-linecap:round}
.anima .axislab-svg .al-slip{fill:var(--anatomy-shade-3);stroke:var(--line-strong);stroke-width:1}
.anima .axislab-svg .al-rule{stroke:var(--line);stroke-width:1}
.anima .axislab-svg .t.al-mono{letter-spacing:.08em;fill:var(--anatomy-muted)}
.anima .axislab-svg .al-tile{fill:var(--surface);stroke:var(--line);stroke-width:1}
.anima .axislab-svg .al-chip{fill:var(--surface);stroke:var(--line);stroke-width:1}
.anima .axislab-svg .t.al-big{font-size:27px;font-weight:700}
.anima .axislab-svg .t.al-upc{fill:var(--bx-hot)}
.anima .axislab-svg .t.al-dnc{fill:var(--bx-blue)}
.anima .axislab-svg .t.al-eqc{fill:var(--anatomy-muted)}
.anima .axislab-svg .al-stamp{fill:none;stroke-width:2.6}
.anima .axislab-svg .t.al-stw{font-size:19px;font-weight:800;letter-spacing:.06em}
.anima .axislab-svg .al-st-p{stroke:var(--bx-ins)}.anima .axislab-svg .t.al-st-p-t{fill:var(--bx-ins)}
.anima .axislab-svg .al-st-s{stroke:var(--bx-violet)}.anima .axislab-svg .t.al-st-s-t{fill:var(--bx-violet)}
.anima .axislab-svg .al-st-t{stroke:var(--bx-glu)}.anima .axislab-svg .t.al-st-t-t{fill:var(--bx-glu)}
.anima .axislab-svg .al-st-n{stroke:var(--anatomy-lo)}.anima .axislab-svg .t.al-st-n-t{fill:var(--anatomy-muted)}
.anima .axislab-svg .al-stq{stroke:var(--anatomy-mid);stroke-dasharray:5 4}.anima .axislab-svg .t.al-stq-t{fill:var(--anatomy-mid)}
.anima .axislab-svg .t.al-rulet{fill:var(--anatomy-strong)}
.anima[data-anima="axislab"] .am-svg{max-width:560px}
.anima[data-anima="axislab"] .al-lbl{font:600 12px var(--font-mono);color:var(--ink-faint)}
.anima[data-anima="axislab"]:has([data-amk="g"][data-amv="thy"][aria-pressed="true"]) .al-row:not(.al-thy),
.anima[data-anima="axislab"]:has([data-amk="g"][data-amv="cor"][aria-pressed="true"]) .al-row:not(.al-cor),
.anima[data-anima="axislab"]:has([data-amk="g"][data-amv="ald"][aria-pressed="true"]) .al-row:not(.al-ald),
.anima[data-anima="axislab"]:has([data-amk="g"][data-amv="pth"][aria-pressed="true"]) .al-row:not(.al-pth),
.anima[data-anima="axislab"]:has([data-amk="mys"][aria-pressed="true"]) .al-row{display:none}
.anima[data-anima="axislab"] .al-guess{display:none}
.anima[data-anima="axislab"]:has([data-amk="mys"][aria-pressed="true"]) .al-guess{display:flex}
`;

const ROWS = {
  thy: [["thyN", "Normal"], ["graves", "Graves disease"], ["tshoma", "TSH-secreting adenoma"], ["hashi", "Hashimoto thyroiditis"], ["sheehan", "Sheehan syndrome"]],
  cor: [["corN", "Normal"], ["cpit", "Pituitary ACTH tumor"], ["cect", "Lung cancer making ACTH"], ["cadr", "Adrenal cortisol tumor"], ["addison", "Addison disease"], ["csec", "Pituitary failure"]],
  ald: [["aldN", "Normal"], ["conn", "Conn adenoma or hyperplasia"], ["ras", "Renal artery stenosis or CHF"], ["rtum", "Renin-secreting tumor"]],
  pth: [["pthN", "Normal"], ["pad", "Parathyroid adenoma"], ["psec", "Kidney failure, low vitamin D"], ["phypo", "Hypoparathyroidism"], ["ppseudo", "Pseudohypoparathyroidism"]],
};

export default function () {
  return makeFig({ id: "axislab", lec: "path2", fig: "Fig 3", short: "Read the labs", hint: "pick a disease",
    title: "Primary or secondary? Read the labs",
    caption: "One feedback loop, drawn left to right, for four glands: pick a disease and watch which signal runs high or dies away, then read the hormone with its driver on the lab slip. Try a mystery case and make the call yourself.",
    W: 480, H: 452, label: "A feedback loop from a driver (pituitary, kidney renin or blood calcium) to a gland, its hormone and its target, with negative feedback arcing back, and a lab slip showing whether each lab is high, low or normal and the verdict: primary, secondary or target resistance.",
    D, render: alRender, say: alSay, helpers: [alBez, alDots, alIcon, alArrow, alSet], css: CSS,
    controls: `<div class="am-controls" role="group" aria-label="Gland"><button type="button" class="am-btn" data-amk="g" data-amv="thy">Thyroid</button><button type="button" class="am-btn" data-amk="g" data-amv="cor">Cortisol</button><button type="button" class="am-btn" data-amk="g" data-amv="ald">Aldosterone</button><button type="button" class="am-btn" data-amk="g" data-amv="pth">Parathyroid</button><button type="button" class="am-btn" data-amk="mys" data-amv="1">Mystery case</button></div>
${Object.keys(ROWS).map((g) => `<div class="am-controls al-row al-${g}" role="group" aria-label="Disease">${ROWS[g].map((r) => `<button type="button" class="am-btn" data-amk="les" data-amv="${r[0]}">${r[1]}</button>`).join("")}</div>`).join("\n")}
<div class="am-controls al-guess" role="group" aria-label="Your call"><span class="al-lbl">Your call:</span><button type="button" class="am-btn" data-amk="guess" data-amv="p">In the gland (primary)</button><button type="button" class="am-btn" data-amk="guess" data-amv="s">Driven from outside (secondary)</button><button type="button" class="am-btn" data-amk="guess" data-amv="t">The target ignores it</button><button type="button" class="am-btn" data-amk="mys" data-amv="1">Next case</button></div>`,
    sources: [
      "From the L12 Part 1 and Part 2 recordings and slides (Dr. Dababneh): the primary versus secondary rule (\"T3, T4 high, TSH low, that's primary; both high, that's secondary,\" and the same for Cushing), the thyroid, Cushing, hyperaldosteronism and parathyroid patterns with their causes, Addison disease's labs, and pseudohypoparathyroidism as end-organ resistance.",
      "Arrows only (high, low, normal), as the lecture gives them: no lab values. Secondary hyperparathyroidism's phosphate isn't shown because the lecture doesn't give it. The loops are schematic: the hypothalamus is left out, the aldosterone loop is shortened to renin and angiotensin II, and the speed of the dots only says more or less, not how much.",
    ] });
}
