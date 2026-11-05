// Fig 4: congenital adrenal hyperplasia on the adrenal steroid pathway (L12 Endocrine Pathology Part 2, Dr. Dababneh).
// Cholesterol is converted step by step into aldosterone, cortisol or androgens; the three columns are drawn in the
// three zones (glomerulosa, salt; fasciculata, sugar; reticularis, sex) with 17-hydroxylase on the steps across and
// 21-hydroxylase on the steps down, the layout of the classic pathway chart he showed. Only what the lecture names is
// labeled (cholesterol, aldosterone, cortisol, androgens and testosterone, the two enzymes, "precursors with
// mineralocorticoid activity"); the intermediates are unlabeled dots. Steps: normal, the enzyme missing, pile-up and
// shunt, cortisol low so ACTH rises (hyperplasia), then glucocorticoid treatment closing the feedback loop.
import { makeFig, f1, T, HOT } from "./shared.mjs";

/* how much flows down each edge for this deficiency and step: cholesterol in, split evenly at each branch; a blocked
   step carries nothing, and from step 2 on what piles up in front of it is shunted to the open branches */
function cahFlow(st, D) {
  var s = +st.s, def = String(st.def), acth = s === 3 ? 2 : s === 4 ? 0.7 : 1, blk = {}, f = {}, inflow = { C0: acth };
  if (s >= 1) (def === "21" ? ["a2a3", "b2b3"] : ["a1b1", "a2b2"]).forEach(function (e) { blk[e] = 1; });
  D.ORDER.forEach(function (n) {
    var outs = D.OUT[n] || [], open = outs.filter(function (e) { return !blk[e]; }), v = inflow[n] || 0;
    var share = s >= 2 ? (open.length ? v / open.length : 0) : (outs.length ? v / outs.length : 0);
    outs.forEach(function (e) { var to = D.E[e][1]; f[e] = blk[e] ? 0 : share; inflow[to] = (inflow[to] || 0) + f[e]; });
  });
  return { f: f, inflow: inflow, blk: blk, acth: acth };
}
function cahDots(x1, y1, x2, y2, v, t) {
  if (v <= 0) return "";
  var n = Math.max(1, Math.round(v * 8)), per = 2600, o = "", k;
  for (k = 0; k < n; k++) { var u = t ? ((t / per + k / n) % 1) : (k + 0.5) / n, op = Math.min(1, u / 0.15, (1 - u) / 0.15); o += '<circle class="ch-p" cx="' + f1(x1 + (x2 - x1) * u) + '" cy="' + f1(y1 + (y2 - y1) * u) + '" r="2.4" opacity="' + f1(op) + '"/>'; }
  return o;
}
function cahBadge(x, y, up, big) { return '<g class="' + (up ? "ch-up" : "ch-dn") + '"><circle cx="' + x + '" cy="' + y + '" r="' + (big ? 10 : 8.5) + '"/><path d="' + (up ? "M" + (x - 4.5) + " " + (y + 2.5) + "L" + x + " " + (y - 3.5) + "L" + (x + 4.5) + " " + (y + 2.5) : "M" + (x - 4.5) + " " + (y - 2.5) + "L" + x + " " + (y + 3.5) + "L" + (x + 4.5) + " " + (y - 2.5)) + 'Z"/></g>'; }

function cahRender(st, D) {
  var o = "", t = st.t || 0, s = +st.s, def = String(st.def), F = cahFlow(st, D), N = D.N, pulse = t ? 0.5 + 0.5 * Math.sin(t / 420) : 0.6;
  var bx0 = 16, bx1 = 408, by0 = 74, by1 = 342, hyper = s === 3;
  /* the adrenal cortex box with its three zones, outside to inside */
  if (hyper) o += '<rect class="ch-halo" x="' + (bx0 - 4) + '" y="' + (by0 - 4) + '" width="' + (bx1 - bx0 + 8) + '" height="' + (by1 - by0 + 8) + '" rx="14" opacity="' + f1(0.35 + pulse * 0.5) + '"/>';
  D.ZONES.forEach(function (z, i) {
    o += HOT(z[3], '<rect class="ch-zone ch-z' + i + '" x="' + z[0] + '" y="' + by0 + '" width="' + (z[1] - z[0]) + '" height="' + (by1 - by0) + '"/>') + T((z[0] + z[1]) / 2, by0 + 17, z[2], "s b", "middle") + T((z[0] + z[1]) / 2, by0 + 31, ["salt", "sugar", "sex"][i], "s mut", "middle");
  });
  o += '<rect class="ch-box' + (hyper ? " ch-box-on" : "") + '" x="' + bx0 + '" y="' + by0 + '" width="' + (bx1 - bx0) + '" height="' + (by1 - by0) + '" rx="10"/>';
  if (hyper) o += T(344, 326, "hyperplasia", "s b ch-hot", "middle");
  /* edges: arrows, enzyme marks, flow dots */
  Object.keys(D.E).forEach(function (id) {
    var e = D.E[id], a = N[e[0]], b = N[e[1]], hz = a[1] === b[1], blk = F.blk[id], v = F.f[id] || 0;
    var x1 = a[0] + (hz ? (a[2] ? 14 : 8) : 0), y1 = a[1] + (hz ? 0 : (a[2] ? 10 : 8)), x2 = b[0] - (hz ? (b[2] ? 50 : 9) : 0), y2 = b[1] - (hz ? 0 : (b[2] ? 12 : 9));
    var cls = "ch-e" + (v > 0 ? "" : " ch-e-off") + (e[2] ? " ch-enz" + e[2] : "");
    var head = hz ? "M" + x2 + " " + y2 + "l-7 -4v8z" : "M" + x2 + " " + y2 + "l-4 -7h8z";
    o += HOT(e[3], '<path class="' + cls + '" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(hz ? x2 - 6 : x2) + " " + f1(hz ? y2 : y2 - 6) + '"/><path class="ch-eh' + (v > 0 ? "" : " ch-e-off") + '" d="' + head + '"/>');
    o += cahDots(x1, y1, x2, y2, v, t);
    if (blk) { var mx = (x1 + x2) / 2, my = (y1 + y2) / 2; o += '<path class="ch-blk" d="M' + (mx - 7) + " " + (my - 7) + "l14 14M" + (mx + 7) + " " + (my - 7) + 'l-14 14"/>'; }
  });
  /* enzyme labels where they act */
  D.ENZ.forEach(function (z) { var on = s >= 1 && z[3] === def; o += T(z[0], z[1], z[2], "s b ch-enzt" + z[3] + (on ? " ch-enzbad" : ""), z[4]); });
  /* nodes: unlabeled intermediates, labeled products */
  Object.keys(N).forEach(function (id) {
    var n = N[id], inn = F.inflow[id] || 0, outs = D.OUT[id] || [], piled = s >= 1 && outs.some(function (e) { return F.blk[e]; }), dead = inn <= 0.001;
    if (def === "17" && s >= 2 && (id === "a3" || id === "a4")) piled = true;
    var info = D.INFO[id] || "A precursor step on the way to the hormones; the lecture doesn't ask you to name it.";
    if (!n[2]) {
      var r = piled && s >= 2 ? 8 + pulse * 2.5 : 6;
      o += HOT(info, (piled && s >= 2 ? '<circle class="ch-pile" cx="' + n[0] + '" cy="' + n[1] + '" r="' + f1(r + 5) + '" opacity="' + f1(0.25 + pulse * 0.4) + '"/>' : "") + '<circle class="ch-n' + (dead ? " ch-dead" : "") + (piled ? " ch-piled" : "") + '" cx="' + n[0] + '" cy="' + n[1] + '" r="' + f1(r) + '"/>');
    } else {
      var w = n[3].length * 7.6 + 22;
      o += HOT(info, '<rect class="ch-prod ch-prod-' + id + (dead ? " ch-dead" : "") + '" x="' + f1(n[0] - w / 2) + '" y="' + (n[1] - 11) + '" width="' + f1(w) + '" height="22" rx="11"/>' + T(n[0], n[1] + 4.5, n[3], "s b" + (dead ? " mut" : ""), "middle"));
    }
  });
  o += T(344, 278, "→ testosterone", "s", "middle") + T(344, 292, "in peripheral", "s mut", "middle") + T(344, 306, "tissues", "s mut", "middle");
  /* labels for the pile-up and the shunt */
  if (s >= 2 && def === "21") o += T(279, 191, "shunt", "s b ch-hot", "middle") + T(279, 155, "shunt", "s b ch-hot", "middle");
  if (s >= 2 && def === "17") o += T(96, 272, "pile-up", "s b ch-hot", "start");
  /* product level badges */
  if (s >= 1) {
    o += cahBadge(N.COR[0] + 44, N.COR[1], false);
    if (def === "21") { o += cahBadge(N.ALD[0] + 58, N.ALD[1], false); if (s >= 2) o += cahBadge(N.AND[0] + 54, N.AND[1], true, s === 3); }
    else o += cahBadge(N.AND[0] + 54, N.AND[1], false);
  }
  /* the pituitary, ACTH into the cortex, cortisol's feedback back up */
  var PX = 440, PY = 46, FX = 468, fbOn = s === 0 || s === 4;
  o += HOT("The pituitary: ACTH drives the whole adrenal cortical pathway. Cortisol tells it to cut ACTH.", (s === 3 ? '<circle class="ch-halo2" cx="' + PX + '" cy="' + PY + '" r="' + f1(22 + pulse * 4) + '" opacity="' + f1(0.3 + pulse * 0.5) + '"/>' : "") + '<circle class="ch-pit" cx="' + PX + '" cy="' + PY + '" r="18"/><ellipse class="ch-pito" cx="' + (PX - 3) + '" cy="' + (PY + 2) + '" rx="9" ry="7"/><ellipse class="ch-pito2" cx="' + (PX + 7) + '" cy="' + (PY + 1) + '" rx="5" ry="6"/>') + T(PX, PY - 24, "pituitary", "s b", "middle");
  o += HOT("ACTH: it drives the whole adrenal cortical pathway. With cortisol missing, nothing turns it down, so it climbs and the cortex grows (hyperplasia).", '<path class="ch-acth" d="M' + (PX - 13) + " " + (PY + 12) + "L404 80" + '"/><path class="ch-acthh" d="M400 84l2 -9l7 6z"/>') + cahDots(PX - 13, PY + 12, 406, 78, F.acth * 0.5, t) + T(430, 96, "ACTH", "s b", "start");
  if (s === 3) o += cahBadge(444, 112, true, true);
  if (s === 4) o += cahBadge(444, 112, false);
  o += HOT("Negative feedback: cortisol turns ACTH down. In CAH there is little cortisol, so the brake is gone; a glucocorticoid pill puts it back.", '<path class="ch-fb' + (fbOn ? "" : " ch-fb-off") + '" d="M' + N.COR[0] + " " + (N.COR[1] + 12) + "V334H" + FX + "V" + PY + "H" + (PX + 26) + '"/><path class="ch-fbh' + (fbOn ? "" : " ch-fb-off") + '" d="M' + (PX + 19) + " " + PY + "l7 -4v8z" + '"/><circle class="ch-minus' + (fbOn ? "" : " ch-fb-off") + '" cx="' + FX + '" cy="160" r="8"/><path class="ch-minusl' + (fbOn ? "" : " ch-fb-off") + '" d="M' + (FX - 4) + " 160H" + (FX + 4) + '"/>');
  if (s === 4) o += HOT("Treatment for every form: a glucocorticoid. It does cortisol's job of telling the pituitary to cut ACTH, so the whole pathway quiets down.", '<g transform="rotate(-60 ' + FX + ' 290)"><rect class="ch-pill" x="' + (FX - 13) + '" y="283" width="26" height="14" rx="7"/><path class="ch-pill2" d="M' + FX + " 283V297" + '"/></g>') + '<text class="t s b ch-ok" transform="rotate(-90 456 268)" x="456" y="268" text-anchor="middle">glucocorticoid</text>';
  /* the patient panel */
  var lines = D.TXT[s === 0 ? "n" : def][s === 0 ? 0 : s];
  o += '<rect class="ch-panel" x="16" y="352" width="448" height="84" rx="8"/>';
  lines.forEach(function (l, i) { o += T(30, 372 + i * 17, l, i === 0 ? "s b" : "s", "start"); });
  return o;
}
function cahSay(st, D) {
  var s = +st.s, k = s === 0 ? "n" : st.def;
  return [D.SUMS[k][s === 0 ? 0 : s], s === 0 ? "normal pathway" : D.RO[st.def][s]];
}

const D = {
  ANIM: true, STEPKEY: "s", STEPMAX: 4, PLAYMS: 3200, INIT: { def: "21", s: 0 },
  /* nodes: [x, y, product?, label] */
  N: {
    C0: [82, 126, 1, "cholesterol"],
    a1: [82, 162], a2: [82, 198], a3: [82, 250], a4: [82, 286], ALD: [82, 322, 1, "aldosterone"],
    b1: [214, 162], b2: [214, 198], b3: [214, 250], COR: [214, 286, 1, "cortisol"],
    c1: [344, 162], c2: [344, 198], AND: [344, 250, 1, "androgens"],
  },
  /* edges: [from, to, enzyme the lecture names, hover] */
  E: {
    C0a1: ["C0", "a1", "", "Cholesterol enters the pathway."],
    a1a2: ["a1", "a2", "", "A step toward the mineralocorticoids."],
    a2a3: ["a2", "a3", "21", "21-hydroxylase: needed on the way to aldosterone."],
    a3a4: ["a3", "a4", "", "A step toward aldosterone."],
    a4ALD: ["a4", "ALD", "", "The last step to aldosterone."],
    a1b1: ["a1", "b1", "17", "17-hydroxylase: the step across, toward cortisol and the androgens."],
    a2b2: ["a2", "b2", "17", "17-hydroxylase: the step across, toward cortisol and the androgens."],
    b1b2: ["b1", "b2", "", "A step toward the glucocorticoids."],
    b2b3: ["b2", "b3", "21", "21-hydroxylase: needed on the way to cortisol."],
    b3COR: ["b3", "COR", "", "The last step to cortisol."],
    b1c1: ["b1", "c1", "", "The next step toward the androgens."],
    b2c2: ["b2", "c2", "", "The next step toward the androgens."],
    c1c2: ["c1", "c2", "", "A step toward the androgens."],
    c2AND: ["c2", "AND", "", "The adrenal androgens, converted to testosterone in peripheral tissues."],
  },
  ORDER: ["C0", "a1", "a2", "a3", "a4", "b1", "b2", "b3", "c1", "c2"],
  OUT: { C0: ["C0a1"], a1: ["a1a2", "a1b1"], a2: ["a2a3", "a2b2"], a3: ["a3a4"], a4: ["a4ALD"], b1: ["b1b2", "b1c1"], b2: ["b2b3", "b2c2"], b3: ["b3COR"], c1: ["c1c2"], c2: ["c2AND"] },
  /* enzyme labels: [x, y, text, which, anchor] */
  ENZ: [[94, 232, "21-hydroxylase", "21", "start"], [226, 232, "21-hydroxylase", "21", "start"], [148, 155, "17-hydroxylase", "17", "middle"], [148, 191, "17-hydroxylase", "17", "middle"]],
  ZONES: [[16, 148, "glomerulosa", "Zona glomerulosa, the outer layer: mineralocorticoids, mainly aldosterone (salt)."], [148, 280, "fasciculata", "Zona fasciculata, the middle layer: glucocorticoids, mainly cortisol (sugar)."], [280, 408, "reticularis", "Zona reticularis, the inner layer: mainly androgens (sex)."]],
  INFO: {
    C0: "Cholesterol: every adrenal steroid is made from it, step by step, with a different enzyme at each step.",
    ALD: "Aldosterone, the mineralocorticoid: the kidney takes back sodium and dumps potassium. In 21-hydroxylase deficiency it can't be made, and about a third of patients waste sodium.",
    COR: "Cortisol, the glucocorticoid. Every form of CAH is a defect in an enzyme of cortisol synthesis, so these patients are short of cortisol.",
    AND: "Adrenal androgens, converted to testosterone in peripheral tissues; they accentuate male characteristics. Too many in 21-hydroxylase deficiency, too few in 17-hydroxylase deficiency.",
    a3: "A precursor with mineralocorticoid activity: in 17-hydroxylase deficiency these accumulate and cause sodium retention and hypertension.",
    a4: "A precursor with mineralocorticoid activity: in 17-hydroxylase deficiency these accumulate and cause sodium retention and hypertension.",
  },
  TXT: {
    n: [["Normal: ACTH drives all three paths from cholesterol,", "and cortisol turns ACTH back down."]],
    "21": [null,
      ["21-hydroxylase missing (the most common form):", "no route to aldosterone or to cortisol."],
      ["Pile-up, shunted to the androgens: androgen excess.", "clitoral hypertrophy, pseudohermaphroditism,", "oligomenorrhea, acne, hirsutism, precocious puberty", "about 1 in 3 also waste sodium (no aldosterone)"],
      ["Cortisol low, so nothing brakes ACTH: ACTH rises,", "the cortex grows (hyperplasia) and makes", "even more androgens."],
      ["Treat with glucocorticoids: the pituitary cuts ACTH,", "the pathway quiets down and the androgen", "excess eases."]],
    "17": [null,
      ["17-hydroxylase missing (less common):", "no route across to cortisol or the androgens."],
      ["Androgen deficiency: no secondary sex characteristics", "in females, pseudohermaphroditism in males.", "Precursors with mineralocorticoid activity pile up:", "sodium retention and hypertension."],
      ["Cortisol low, so nothing brakes ACTH: ACTH rises,", "the cortex grows (hyperplasia) and the", "precursors build up further."],
      ["Treat with glucocorticoids: the pituitary cuts ACTH", "and the whole pathway quiets down."]],
  },
  SUMS: {
    n: ["The normal adrenal cortex: cholesterol is converted step by step into aldosterone (zona glomerulosa, salt), cortisol (zona fasciculata, sugar) or androgens (zona reticularis, sex), with a different enzyme at each step. ACTH from the pituitary drives the whole pathway, and cortisol turns ACTH down. Congenital adrenal hyperplasia is a group of autosomal recessive defects in an enzyme of cortisol synthesis: pick 21- or 17-hydroxylase and press Next."],
    "21": [null,
      "21-hydroxylase deficiency, the most common form (several variants). The steps down to the mineralocorticoids and the glucocorticoids need 21-hydroxylase, so there is no route to aldosterone or to cortisol.",
      "When one enzyme is missing, the steps before it pile up and the pathway shifts toward whatever can still be made: here, everything goes to the androgens. Androgen excess: clitoral hypertrophy, pseudohermaphroditism, oligomenorrhea, acne, hirsutism and precocious puberty. About one third also waste sodium, from aldosterone deficiency.",
      "These patients are short of cortisol, so the brake on ACTH is gone. ACTH climbs, drives the whole cortex into hyperplasia (the H in CAH) and pushes even more down the only open path, to the androgens.",
      "The treatment for all forms is glucocorticoids, and it uses negative feedback: the drug tells the pituitary to cut ACTH, the hormone that drives the whole adrenal cortical pathway, so the pathway quiets down and the symptoms of androgen excess ease."],
    "17": [null,
      "17-hydroxylase deficiency, the less common form. 17-hydroxylase makes the steps across, from the mineralocorticoid path toward cortisol and the androgens, so neither cortisol nor the androgens can be made.",
      "Androgen deficiency: no secondary sex characteristics in females and pseudohermaphroditism in males. With the way across closed, precursors with mineralocorticoid activity accumulate, so the patient has sodium retention and hypertension.",
      "Short of cortisol here too, so nothing brakes ACTH: it climbs, the cortex grows (hyperplasia) and the precursors with mineralocorticoid activity build up further.",
      "The treatment is the same for all forms: glucocorticoids. The pituitary cuts ACTH and the whole pathway quiets down."],
  },
  RO: { "21": [null, "21-OH: blocked", "cortisol▼ aldo▼ andro▲", "ACTH▲ hyperplasia", "treated: ACTH▼"], "17": [null, "17-OH: blocked", "cortisol▼ andro▼ Na⁺ kept", "ACTH▲ hyperplasia", "treated: ACTH▼"] },
};

const CSS = `
.anima .cah-svg .t{font-size:13px}
.anima .cah-svg .t.s{font-size:12px}
.anima .cah-svg .ch-zone{stroke:none}
.anima .cah-svg .ch-z0{fill:var(--bx-gold-soft);opacity:.55}
.anima .cah-svg .ch-z1{fill:var(--bx-gold-soft);opacity:.85}
.anima .cah-svg .ch-z2{fill:var(--bx-cyto);opacity:.45}
.anima .cah-svg .ch-box{fill:none;stroke:var(--bx-gold);stroke-width:1.6}
.anima .cah-svg .ch-box.ch-box-on{stroke:var(--bx-hot);stroke-width:3}
.anima .cah-svg .ch-halo,.anima .cah-svg .ch-halo2{fill:none;stroke:var(--bx-hot);stroke-width:2.5}
.anima .cah-svg .ch-e{fill:none;stroke:var(--anatomy-mid);stroke-width:1.5}
.anima .cah-svg .ch-e.ch-enz21{stroke:var(--bx-blue);stroke-width:2.2}
.anima .cah-svg .ch-e.ch-enz17{stroke:var(--bx-violet);stroke-width:2.2}
.anima .cah-svg .ch-eh{fill:var(--anatomy-mid)}
.anima .cah-svg .ch-e-off{opacity:.25}
.anima .cah-svg .ch-p{fill:var(--bx-glu)}
.anima .cah-svg .ch-blk{stroke:var(--bx-inhib);stroke-width:3.2;stroke-linecap:round}
.anima .cah-svg .t.ch-enzt21{fill:var(--bx-blue)}
.anima .cah-svg .t.ch-enzt17{fill:var(--bx-violet)}
.anima .cah-svg .t.ch-enzbad{fill:var(--bx-inhib)}
.anima .cah-svg .ch-n{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .cah-svg .ch-n.ch-piled{fill:var(--bx-glu-soft);stroke:var(--bx-glu);stroke-width:2}
.anima .cah-svg .ch-pile{fill:none;stroke:var(--bx-glu);stroke-width:2}
.anima .cah-svg .ch-dead{opacity:.35}
.anima .cah-svg .ch-prod{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .cah-svg .ch-prod-ALD{stroke:var(--bx-ins);stroke-width:2}
.anima .cah-svg .ch-prod-COR{stroke:var(--bx-gold);stroke-width:2}
.anima .cah-svg .ch-prod-AND{stroke:var(--bx-violet);stroke-width:2}
.anima .cah-svg .ch-up circle{fill:var(--bx-hot)}
.anima .cah-svg .ch-dn circle{fill:var(--bx-blue)}
.anima .cah-svg .ch-up path,.anima .cah-svg .ch-dn path{fill:var(--surface)}
.anima .cah-svg .t.ch-hot{fill:var(--bx-hot)}
.anima .cah-svg .t.ch-ok{fill:var(--bx-stim)}
.anima .cah-svg .ch-pit{fill:var(--anatomy-face);stroke:var(--line-strong);stroke-width:1.3}
.anima .cah-svg .ch-pito{fill:var(--bx-eosin);stroke:var(--bx-memb);stroke-width:1}
.anima .cah-svg .ch-pito2{fill:var(--bx-cyto);stroke:var(--bx-memb);stroke-width:1}
.anima .cah-svg .ch-acth{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6}
.anima .cah-svg .ch-acthh{fill:var(--anatomy-mid)}
.anima .cah-svg .ch-fb{fill:none;stroke:var(--bx-inhib);stroke-width:1.6;stroke-dasharray:6 4}
.anima .cah-svg .ch-fbh{fill:var(--bx-inhib)}
.anima .cah-svg .ch-minus{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.5}
.anima .cah-svg .ch-minusl{stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .cah-svg .ch-fb-off{opacity:.25}
.anima .cah-svg .ch-pill{fill:var(--bx-ins-soft);stroke:var(--bx-stim);stroke-width:1.4}
.anima .cah-svg .ch-pill2{stroke:var(--bx-stim);stroke-width:1.2}
.anima .cah-svg .ch-panel{fill:var(--anatomy-shade-3);stroke:var(--line);stroke-width:1}
.anima[data-anima="cah"] .am-svg{max-width:560px}
`;

export default function () {
  return makeFig({ id: "cah", lec: "path2", fig: "Fig 4", short: "CAH on the pathway", hint: "pick an enzyme",
    title: "Congenital adrenal hyperplasia: where the pathway breaks",
    caption: "The adrenal steroid pathway across the three zones of the cortex, outer zone on the left: 17-hydroxylase makes the steps across, 21-hydroxylase the steps down. Pick a missing enzyme and step through what piles up, where it goes, why ACTH rises, and how glucocorticoids fix it.",
    W: 480, H: 444, label: "The adrenal steroid pathway from cholesterol to aldosterone, cortisol and androgens across the zona glomerulosa, fasciculata and reticularis, with 21-hydroxylase and 17-hydroxylase steps, ACTH from the pituitary and cortisol feedback.",
    D, render: cahRender, say: cahSay, helpers: [cahFlow, cahDots, cahBadge], css: CSS,
    controls: `<div class="am-controls" role="group" aria-label="Missing enzyme"><button type="button" class="am-btn" data-amk="def" data-amv="21">21-hydroxylase deficiency</button><button type="button" class="am-btn" data-amk="def" data-amv="17">17-hydroxylase deficiency</button></div>
<div class="am-controls" role="group" aria-label="Step"><button type="button" class="am-btn" data-amk="s" data-amv="0">1. Normal</button><button type="button" class="am-btn" data-amk="s" data-amv="1">2. Enzyme missing</button><button type="button" class="am-btn" data-amk="s" data-amv="2">3. Pile-up</button><button type="button" class="am-btn" data-amk="s" data-amv="3">4. ACTH rises</button><button type="button" class="am-btn" data-amk="s" data-amv="4">5. Treat</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: [
      "From the L12 Part 2 recording and slides (Dr. Dababneh): the three zones (salt, sugar, sex); CAH as autosomal recessive defects in an enzyme of cortisol synthesis; the pile-up and shift when one enzyme is missing; 21-hydroxylase deficiency (most common; androgen excess, salt wasting in about a third) and 17-hydroxylase deficiency (androgen deficiency; precursors with mineralocorticoid activity, sodium retention, hypertension); and glucocorticoid treatment through negative feedback on ACTH.",
      "For the layout only: the classic adrenal steroid chart (mineralocorticoid, glucocorticoid and androgen columns, 17-hydroxylase across, 21-hydroxylase down), as in standard physiology and pathology texts. He showed the full chart but teaches only the two blocks, so the intermediates are unlabeled dots. Simplified: the columns are drawn as the three zones, the step from the cortisol column to the androgens is drawn but not named, the lecture doesn't say what happens to aldosterone itself in 17-hydroxylase deficiency, and the dots show more or less flow, not amounts.",
    ] });
}
