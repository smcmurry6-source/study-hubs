// Fig: implantation in the decidualized endometrium (L17 Pregnancy and Lactation, Dr. Madison: "Implantation" and the
// two kinds of trophoblast). The endometrium in section under the uterine cavity: the surface epithelium, the stroma with
// its cells, two coiled glands and two spiral arteries. A blastocyst (trophoblasts around a fluid-filled cavity) comes
// down onto it in the lecture's three steps: attachment (adhesion molecules; the trophoblasts split into the inner
// cytotrophoblasts and the outer syncytiotrophoblast), invasion (the syncytiotrophoblast's protrusions secrete proteases
// and the blastocyst burrows into the stroma) and differentiation (with progesterone, the decidual reaction: stromal
// cells swell with glycogen into decidual cells, vessels multiply, the local immune response is damped, and the
// syncytiotrophoblast sends hCG and hPL into the mother's blood). "Hide names" turns the cell names into question marks.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 600, H = 496;
const P = { X0: 8, X1: 422, Y0: 20, Y1: 456, EP: 186, EB: 214, CX: 214, R: 72 };

function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
/* the glands' and arteries' center lines, by depth */
function imGx(k, y) { return [52, 378][k] + 8 * Math.sin((y - 214) / 27 * Math.PI) * (y > 224 ? 1 : (y - 186) / 38); }
function imAx(k, y) { return [104, 330][k] + 5.5 * Math.sin((452 - y) / 15 * Math.PI); }

/* ---------- build-time geometry ---------- */
function geo() {
  /* the surface epithelium: one row of columnar cells */
  const EPI = [];
  for (let x = 12, i = 0; x < 414; x += 11, i++) EPI.push([x, f1(0.3 + rnd(i + 3) * 0.6)]);
  /* glands: a coiled tube from the surface down */
  let GL = ["", ""], GLL = ["", ""], GN = ["", ""];
  for (let k = 0; k < 2; k++) {
    let p = "";
    for (let y = 200; y <= 430; y += 2) p += (p ? "L" : "M") + f1(imGx(k, y)) + " " + y;
    GL[k] = p; GLL[k] = "M" + f1(imGx(k, 186)) + " 184L" + f1(imGx(k, 192)) + " 192L" + p.slice(1);
    for (let y = 222; y <= 426; y += 8) { const x = imGx(k, y), s = (imGx(k, y + 1) - imGx(k, y - 1)) / 2, n = Math.hypot(1, s); GN[k] += '<circle class="im-gn" cx="' + f1(x + 9.6 / n) + '" cy="' + f1(y - 9.6 * s / n) + '" r="1.5"/><circle class="im-gn" cx="' + f1(x - 9.6 / n) + '" cy="' + f1(y + 9.6 * s / n) + '" r="1.5"/>'; }
  }
  /* spiral arteries rising from the deep endometrium, with two short branches under the epithelium */
  const AR = [0, 1].map((k) => { let p = ""; for (let y = 452; y >= 234; y -= 1.5) p += (p ? "L" : "M") + f1(imAx(k, y)) + " " + f1(y); const top = [imAx(k, 234), 234]; return p + "M" + f1(top[0]) + " " + top[1] + "Q" + f1(top[0] - 4) + " 224 " + f1(top[0] - 14) + " 222M" + f1(top[0]) + " " + top[1] + "Q" + f1(top[0] + 5) + " 224 " + f1(top[0] + 15) + " 221"; });
  /* small vessels: [x, y, size at rest, from step] */
  const VS = [[30, 272, 0.7, 0], [176, 440, 0.7, 0], [404, 260, 0.6, 1], [150, 340, 1, 3], [278, 346, 1, 3], [214, 382, 0.9, 3], [176, 428, 0.9, 3], [406, 384, 0.9, 3], [26, 340, 0.7, 2], [404, 328, 0.7, 2]];
  /* immune cells */
  const IM = [[132, 418], [252, 442], [302, 412], [404, 442], [26, 442]];
  /* stromal cells: a jittered grid, clear of glands, arteries, vessels and immune cells */
  const SC = [];
  let n = 0;
  for (let y = 228; y < 450; y += 27) for (let x = 20 + ((y / 27) % 2) * 14; x < 414; x += 29) {
    n++;
    const cx = x + (rnd(n) - 0.5) * 7, cy = y + (rnd(n + 50) - 0.5) * 6;
    if (cy > 446 || cx < 18 || cx > 412) continue;
    if (Math.abs(cx - imGx(0, cy)) < 26 || Math.abs(cx - imGx(1, cy)) < 26) continue;
    if (cy > 226 && (Math.abs(cx - imAx(0, cy)) < 18 || Math.abs(cx - imAx(1, cy)) < 18)) continue;
    if (VS.some((v) => Math.hypot(cx - v[0], cy - v[1]) < 22) || IM.some((v) => Math.hypot(cx - v[0], cy - v[1]) < 17)) continue;
    SC.push([f1(cx), f1(cy), f1((rnd(n + 9) - 0.5) * 70), n]);
  }
  return { EPI, GL, GLL, GN, AR, VS, IM, SC };
}

/* ---------- page helpers (serialized) ---------- */
function imAd(a, b) { var d = ((a - b) % 360 + 540) % 360 - 180; return d; }
/* the syncytiotrophoblast's thickness at angle th (degrees, 90 = straight down) at step s */
function imTf(th, s, D) {
  var zone = D.ZONE[s], dd = Math.abs(imAd(th, 90)), f = 0, i;
  if (!zone || dd >= zone) return 0;
  var base = D.T0[s] * Math.pow(Math.cos(dd / zone * Math.PI / 2), 0.6);
  for (i = 0; i < D.FING[s].length; i++) { var q = D.FING[s][i], z = imAd(th, q[0]) / q[2]; f += q[1] * Math.exp(-z * z); }
  return base + f * Math.min(1, base / 5);
}
function imSect(cx, cy, r0, r1, a0, a1) {
  var A = a0 * Math.PI / 180, B = a1 * Math.PI / 180, big = a1 - a0 > 180 ? 1 : 0;
  return "M" + f1(cx + r1 * Math.cos(A)) + " " + f1(cy + r1 * Math.sin(A)) + "A" + r1 + " " + r1 + " 0 " + big + " 1 " + f1(cx + r1 * Math.cos(B)) + " " + f1(cy + r1 * Math.sin(B)) + "L" + f1(cx + r0 * Math.cos(B)) + " " + f1(cy + r0 * Math.sin(B)) + "A" + r0 + " " + r0 + " 0 " + big + " 0 " + f1(cx + r0 * Math.cos(A)) + " " + f1(cy + r0 * Math.sin(A)) + "Z";
}
function imPol(cx, cy, r, th) { var a = th * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }

function imRender(st, D) {
  var s = Math.max(0, Math.min(3, Math.round(st.s))), q = !!st.quiz, o = "", i, k, x, y, a, p;
  st.s = s;
  var cx = D.P.CX, R = D.P.R, cy = D.CY[s], EP = D.P.EP, EB = D.P.EB;
  function nm(t, key) { return q && key ? "?" : t; }
  function inside(px, py, pad) { var dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), th = Math.atan2(dy, dx) * 180 / Math.PI; return dist < R + imTf(th, s, D) + (pad || 0); }
  /* ---- the frame: the cavity above, the stroma below ---- */
  o += T(14, 13, "THE ENDOMETRIUM IN SECTION · ABOUT 1 PIXEL PER MICROMETER", "im-h", "start");
  o += '<rect class="im-cav" x="' + D.P.X0 + '" y="' + D.P.Y0 + '" width="' + (D.P.X1 - D.P.X0) + '" height="' + (EP - D.P.Y0 + 6) + '" rx="10"/>';
  o += HOT("The endometrial stroma: connective tissue, its cells and matrix. From the luteal phase it is already more vascular and stores glycogen; implantation makes it decidualize further.", '<path class="im-str-bg" d="M' + D.P.X0 + " " + (EP + 4) + "H" + D.P.X1 + "V" + (D.P.Y1 - 10) + "Q" + D.P.X1 + " " + D.P.Y1 + " " + (D.P.X1 - 10) + " " + D.P.Y1 + "H" + (D.P.X0 + 10) + "Q" + D.P.X0 + " " + D.P.Y1 + " " + D.P.X0 + " " + (D.P.Y1 - 10) + 'Z"/>');
  o += T(20, 40, "uterine cavity", "im-l mut", "start");
  /* ---- vessels ---- */
  var ves = "", nves = "";
  D.G.VS.forEach(function (v) {
    if (s < v[3]) return;
    var sz = v[2] * (s === 3 ? 1.35 : s === 2 ? 1.1 : 1), rx = 7.5 * sz, ry = 5.2 * sz, g = '<ellipse class="im-vw" cx="' + v[0] + '" cy="' + v[1] + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"/><ellipse class="im-vl" cx="' + v[0] + '" cy="' + v[1] + '" rx="' + f1(rx - 2) + '" ry="' + f1(ry - 2) + '"/><circle class="im-rbc" cx="' + f1(v[0] - rx * 0.3) + '" cy="' + v[1] + '" r="' + f1(1.5 * sz) + '"/><circle class="im-rbc" cx="' + f1(v[0] + rx * 0.35) + '" cy="' + f1(v[1] - 0.6) + '" r="' + f1(1.4 * sz) + '"/>';
    if (v[3] === 3) nves += g; else ves += g;
  });
  o += HOT("Small vessels of the endometrium. The luteal phase widens the vessels and makes them more defined.", ves);
  if (nves) o += HOT("New and widened vessels: increased vascularity is one of the decidual changes.", nves);
  var art = "";
  for (k = 0; k < 2; k++) art += '<path class="im-aw" d="' + D.G.AR[k] + '"/><path class="im-al" d="' + D.G.AR[k] + '"/>';
  o += HOT("A spiral artery of the endometrium, bringing the mother's blood (and the corpus luteum's progesterone) into the stroma.", art);
  /* progesterone in the arteries at step 3 */
  if (s === 3) { var pg = ""; for (k = 0; k < 2; k++) for (y = 450; y > 246; y -= 22) pg += '<circle class="im-p4" cx="' + f1(imAx(k, y)) + '" cy="' + y + '" r="2"/>'; o += HOT("Progesterone in the mother's blood, from the corpus luteum (kept going by hCG): along with the blastocyst's paracrine factors, it amplifies the decidual reaction.", pg); }
  /* ---- immune cells ---- */
  var im = ""; D.G.IM.forEach(function (c) { im += '<circle class="im-imc' + (s === 3 ? " is-calm" : "") + '" cx="' + c[0] + '" cy="' + c[1] + '" r="5"/><circle class="im-imn" cx="' + f1(c[0] - 0.4) + '" cy="' + f1(c[1] - 0.3) + '" r="3.4"/>'; });
  o += HOT(s === 3 ? "Immune modulation, one of the decidual changes: a local suppression of the immune system, so it doesn't recognize the blastocyst as foreign and attack it." : "Immune cells in the endometrium. Decidualization will damp the local immune response so the blastocyst isn't attacked as foreign.", im);
  /* ---- stromal cells, turning into decidual cells ---- */
  var sc = "", dc = "", decT = null, scT = null, hcgT = null;
  D.G.SC.forEach(function (c) {
    if (inside(c[0], c[1], 9)) return;
    var dist = Math.hypot(c[0] - cx, c[1] - D.CY[3]), near = Math.max(0, Math.min(1, 1 - (dist - 96) / 150));
    var f = [0.1, 0.16 + 0.12 * near, 0.22 + 0.36 * near, 0.32 + 0.68 * near][s];
    var rx = 7.5 + 5.6 * f, ry = 2.8 + 8.8 * f, rot = c[2] * (1 - f), tr = ' transform="rotate(' + f1(rot) + " " + c[0] + " " + c[1] + ')"';
    var g = '<ellipse class="' + (f > 0.55 ? "im-dec" : "im-sc") + '" cx="' + c[0] + '" cy="' + c[1] + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"' + tr + "/>";
    if (f > 0.55) for (k = 0; k < 3; k++) { var va = (c[3] * 1.7 + k * 2.1); g += '<circle class="im-gly" cx="' + f1(c[0] + Math.cos(va) * rx * 0.55) + '" cy="' + f1(c[1] + Math.sin(va) * ry * 0.55) + '" r="' + f1(1.2 + f * 1.1) + '"/>'; }
    g += '<ellipse class="im-scn" cx="' + c[0] + '" cy="' + c[1] + '" rx="' + f1(4 - 1.6 * f) + '" ry="' + f1(1.4 + 1.1 * f) + '"' + tr + "/>";
    if (f > 0.55) { dc += g; var dd2 = Math.hypot(c[0] - 318, c[1] - 338); if (!decT || dd2 < decT[2]) decT = [c[0], c[1], dd2]; } else { sc += g; var ds2 = Math.hypot(c[0] - 400, c[1] - 366); if (!scT || ds2 < scT[2]) scT = [c[0], c[1], ds2]; }
  });
  o += HOT("Stromal cells of the endometrium, spindle-shaped. With progesterone and the blastocyst's signals they enlarge and store glycogen: the decidual reaction.", sc);
  if (dc) o += HOT("Decidual cells: endometrial cells that have enlarged and accumulated glycogen, stored in vacuoles around the implanting blastocyst. They nourish the embryo until the placenta forms.", dc);
  /* ---- the matrix the proteases have broken down ---- */
  var zone = D.ZONE[s];
  if (s >= 2) { var dg = ""; for (a = 90 - zone - 4; a <= 90 + zone + 4; a += 1) { p = imPol(cx, cy, R + imTf(a, s, D) + 7, a); dg += (dg ? "L" : "M") + f1(p[0]) + " " + f1(Math.max(EP + 2, p[1])); } for (a = 90 + zone + 4; a >= 90 - zone - 4; a -= 6) { p = imPol(cx, cy, R - 4, a); dg += "L" + f1(p[0]) + " " + f1(Math.max(EP + 2, p[1])); }
    o += HOT("Matrix broken down by the proteases, so the blastocyst burrows deeper into the stroma.", '<path class="im-dig" d="' + dg + 'Z"/>'); }
  /* ---- the surface epithelium ---- */
  var ep = "";
  D.G.EPI.forEach(function (c) {
    var xm = c[0] + 5.2;
    if (s >= 2 && inside(xm, EP + 6, 1)) return;
    if (s >= 2 && inside(xm, EB - 4, 1)) return;
    ep += '<rect class="im-epi" x="' + c[0] + '" y="' + EP + '" width="10.4" height="' + (EB - EP) + '" rx="2"/><ellipse class="im-epn" cx="' + f1(xm) + '" cy="' + f1(EB - 8 - c[1] * 3) + '" rx="2.2" ry="3.6"/>';
  });
  o += HOT("The surface epithelium of the endometrium, lining the uterine cavity: the blastocyst attaches to it, then the syncytiotrophoblast pushes through it.", ep);
  /* ---- glands, over the epithelium where they open ---- */
  var gl = "";
  for (k = 0; k < 2; k++) { gl += '<path class="im-gw0" d="' + D.G.GL[k] + '"/><path class="im-gw" d="' + D.G.GL[k] + '"/><path class="im-gl" d="' + D.G.GLL[k] + '"/>' + D.G.GN[k]; for (y = 232; y < 426; y += 17) gl += '<circle class="im-gs" cx="' + f1(imGx(k, y) + (y % 3) - 1) + '" cy="' + y + '" r="1.2"/>'; }
  o += HOT("A uterine gland, coiled and secreting in the luteal (secretory) phase.", gl);

  /* ================= the blastocyst ================= */
  var bl = "", cz = zone ? zone + 10 : 0, N = 28, cyto = "", tro = "";
  bl += '<circle class="im-bc" cx="' + cx + '" cy="' + cy + '" r="' + (R - 6) + '"/>';
  for (i = 0; i < N; i++) {
    var a0 = i * 360 / N - 90 + 360 / N / 2, a1 = a0 + 360 / N, am = (a0 + a1) / 2, inZ = cz && Math.abs(imAd(am, 90)) < cz;
    if (inZ) {
      for (k = 0; k < 2; k++) { var b0 = a0 + k * (a1 - a0) / 2, b1 = b0 + (a1 - a0) / 2, bm = (b0 + b1) / 2, np2 = imPol(cx, cy, R - 6.4, bm); cyto += '<path class="im-cyt" d="' + imSect(cx, cy, R - 12.5, R, b0, b1) + '"/><circle class="im-cytn" cx="' + f1(np2[0]) + '" cy="' + f1(np2[1]) + '" r="2.5"/>'; }
    } else {
      var np1 = imPol(cx, cy, R - 3.5, am);
      tro += '<path class="im-tro" d="' + imSect(cx, cy, R - 7, R, a0, a1) + '"/><ellipse class="im-tron" cx="' + f1(np1[0]) + '" cy="' + f1(np1[1]) + '" rx="4.2" ry="1.6" transform="rotate(' + f1(am + 90) + " " + f1(np1[0]) + " " + f1(np1[1]) + ')"/>';
    }
  }
  o += HOT("The blastocyst's fluid-filled cavity (the blastocoele). A blastocyst is many cells around this cavity; implantation happens at this stage.", bl);
  o += HOT(cz ? "Trophoblasts not yet in contact with the endometrium: a single layer of flattened cells." : "Trophoblasts: the outer layer of the blastocyst. They carry out implantation, and implantation is invasive: the blastocyst doesn't just stick to the wall, it has to \"set up shop\" and build a placenta.", tro);
  if (cyto) o += HOT("Cytotrophoblasts: the inner layer, the nurse cells. They nourish the early embryo and give it structure, and become part of the developing placenta. The lecture names no hormone for them.", cyto);
  /* the cells inside, at the pole that attaches (drawn, not named) */
  var icm = ""; [[70, R - 20], [83, R - 21], [96, R - 21], [109, R - 20], [76, R - 33], [90, R - 34], [103, R - 33], [90, R - 46]].forEach(function (c) { p = imPol(cx, cy, c[1] - (cz ? 4 : 0), c[0]); icm += '<circle class="im-icm" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="6.6"/><circle class="im-icmn" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="2.6"/>'; });
  o += HOT("Cells inside the blastocyst, at the pole that attaches first. They go on to form the embryo; the lecture doesn't cover them.", icm);
  o += T(cx, cy - 24, "fluid-filled", "im-in", "middle") + T(cx, cy - 10, "cavity", "im-in", "middle");
  /* the syncytiotrophoblast: one mass, many nuclei, no borders between cells */
  if (zone) {
    var sy = "", a2;
    for (a2 = 90 - zone; a2 <= 90 + zone + 1e-6; a2 += 0.5) { p = imPol(cx, cy, R + imTf(a2, s, D), a2); sy += (sy ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }
    for (a2 = 90 + zone; a2 >= 90 - zone - 1e-6; a2 -= 3) { p = imPol(cx, cy, R - 0.6, a2); sy += "L" + f1(p[0]) + " " + f1(p[1]); }
    var sn = "";
    for (i = 0; i < 70; i++) { var ta = 90 - zone + rnd(i + 17) * 2 * zone, tt = imTf(ta, s, D); if (tt < 5) continue; var rr = R + 2.5 + rnd(i + 91) * (tt - 5); p = imPol(cx, cy, rr, ta); sn += '<ellipse class="im-syn" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="2" ry="1.4" transform="rotate(' + f1(ta) + " " + f1(p[0]) + " " + f1(p[1]) + ')"/>'; }
    o += HOT("The syncytiotrophoblast: the invaders, one continuous mass with many nuclei and no borders between cells. They are adhesive, invasive and endocrine: long protrusions secrete proteases that break down the matrix, and they make hCG and human placental lactogen. They go on to help form the placenta.", '<path class="im-sy" d="' + sy + 'Z"/>' + sn);
  }
  /* adhesion molecules at the contact */
  if (s === 1) { var ad = ""; for (x = cx - 26; x <= cx + 26; x += 6.5) { var yy = EP + 1.2; ad += '<path class="im-adh" d="M' + f1(x) + " " + f1(yy + 3) + "V" + f1(yy) + "l-1.6 -2.2M" + f1(x) + " " + f1(yy) + "l1.6 -2.2" + '"/>'; } o += HOT("Adhesion molecules, on the trophoblasts and on the endometrial cells, bind the blastocyst firmly to the wall. Attachment signals the trophoblasts to differentiate. (You don't need their names.)", ad); }
  /* proteases at the protrusions' tips */
  if (s >= 2) { var pr = ""; D.FING[s].forEach(function (fq, j) { var tip = R + imTf(fq[0], s, D); for (k = 0; k < 5; k++) { var ang = fq[0] + (rnd(j * 7 + k) - 0.5) * 9, rad = tip + 2 + rnd(j * 5 + k + 40) * 8; p = imPol(cx, cy, rad, ang); if (p[1] > EP + 3) pr += '<circle class="im-pro" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="1.4"/>'; } }); o += HOT("Proteases, secreted by the syncytiotrophoblast's long protrusions: they break down the matrix, so the blastocyst burrows deeper into the endometrial stroma.", pr); }
  /* hCG and hPL toward the vessels, and the paracrine factors, at step 3 */
  if (s === 3) {
    var hc = "", tg = [[D.FING[3][1][0], imAx(1, 262) - 4, 262], [D.FING[3][2][0], 278, 346], [D.FING[3][6][0], imAx(0, 262) + 4, 262], [D.FING[3][5][0], 150, 340]];
    tg.forEach(function (t, j) { var tp = imPol(cx, cy, R + imTf(t[0], 3, D) - 2, t[0]); for (k = 1; k <= 4; k++) { var u = k / 5, hx = tp[0] + (t[1] - tp[0]) * u + (k % 2 ? 1.5 : -1.5), hy = tp[1] + (t[2] - tp[1]) * u; hc += '<circle class="im-hcg" cx="' + f1(hx) + '" cy="' + f1(hy) + '" r="1.9"/>'; if (j === 0 && k === 3) hcgT = [hx, hy]; } });
    o += HOT("hCG and human placental lactogen, made by the syncytiotrophoblast and secreted into the mother's blood. hCG (from about 8 days after ovulation) rescues the corpus luteum; hPL affects breast development and opposes insulin.", hc);
    var pf = ""; for (i = 0; i < 22; i++) { var fa = 90 - zone + rnd(i + 230) * 2 * zone, fr = R + imTf(fa, 3, D) + 14 + rnd(i + 260) * 30; p = imPol(cx, cy, fr, fa); if (p[1] > EB + 4) pf += '<circle class="im-par" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="1.3"/>'; }
    o += HOT("Paracrine factors from the blastocyst: along with progesterone, they amplify the decidual reaction around it.", pf);
  }
  o += '<rect class="im-frame" x="' + D.P.X0 + '" y="' + D.P.Y0 + '" width="' + (D.P.X1 - D.P.X0) + '" height="' + (D.P.Y1 - D.P.Y0) + '" rx="10"/>';

  /* ================= labels, in the column on the right ================= */
  var LX = 432, lab = [];
  function at(r, th) { return imPol(cx, cy, r, th); }
  var tb = at(R - 1, s === 3 ? -62 : -40), tt = at(R - 2, s === 3 ? -35 : -8);
  lab.push([46, "blastocyst", tb[0], tb[1], "b"]);
  lab.push([72, nm("trophoblasts", 1), tt[0], tt[1], "k"]);
  if (!s) lab.push([86, "(its outer layer)", null, null, "mut"]);
  if (s >= 1) { var cp = [null, at(R - 6.5, 50), at(R - 6.5, 32), at(R - 6.5, 8)][s]; lab.push([104, nm("cytotrophoblasts", 1), cp[0], cp[1], "k im-l-cy"]); lab.push([118, "(nurse cells)", null, null, "mut"]); }
  if (s >= 1) { var sp = [null, at(R + 3, 66), at(R + 8, 44), at(R + 8, 22)][s]; lab.push([146, nm("syncytiotrophoblast", 1), sp[0], sp[1], "k im-l-sy"]); lab.push([160, s === 1 ? "(forms at the contact)" : "(the invaders)", null, null, "mut"]); }
  if (s === 1) lab.push([180, "adhesion molecules", cx + 22, EP - 0.5, "im-l-ad"]);
  lab.push([203, "surface epithelium", 406, 199, ""]);
  if (s >= 2) { var ft = D.FING[s][0], tp2 = at(R + imTf(ft[0], s, D) + 4, ft[0]); lab.push([s === 3 ? 230 : 234, "proteases", tp2[0], tp2[1], "im-l-pr"]); }
  if (s === 3 && hcgT) { lab.push([262, "hCG, hPL →", hcgT[0], hcgT[1], "im-l-h"]); lab.push([276, "mother's blood", null, null, "im-l-h"]); }
  var gy = s === 3 ? 304 : 290; lab.push([gy, "uterine gland", imGx(1, gy + 4) + 13, gy + 4, ""]);
  if (s === 3 && decT) { lab.push([330, nm("decidual cells", 1), decT[0] + 3, decT[1], "k im-l-dc"]); lab.push([344, "(swollen with glycogen)", null, null, "mut"]); }
  else if (scT) lab.push([336, "stromal cells", scT[0] + 2, scT[1], ""]);
  lab.push([s === 3 ? 370 : 384, "spiral artery", imAx(1, s === 3 ? 374 : 388) + 4, s === 3 ? 374 : 388, ""]);
  if (s === 3) { lab.push([396, "new vessels", 414, 386, ""]); lab.push([420, "progesterone", imAx(1, 428) + 2, 428, "im-l-p"]); lab.push([446, "immune modulation", 409, 442, "im-l-im"]); }
  lab.forEach(function (l) {
    var cls = "im-l" + (l[4] ? " " + l[4] : "");
    if (l[2] === null) o += T(LX, l[0], l[1], cls, "start");
    else o += L(LX, l[0], l[1], l[2], l[3], "start", cls);
  });

  /* ================= the three steps ================= */
  for (i = 0; i <= 3; i++) {
    var bx = 12 + i * 147, on = i === s, done = i < s;
    o += HOT(D.STEPS[i][1], '<rect class="im-st' + (on ? " is-on" : done ? " is-done" : "") + '" x="' + bx + '" y="466" width="140" height="24" rx="12"/>' + T(bx + 70, 482, D.STEPS[i][0], "im-stt" + (on ? " is-on" : ""), "middle"));
  }
  return o;
}

function imSay(st, D) {
  var s = st.s, q = !!st.quiz;
  return [q ? "Hide names is on (" + D.STEPS[s][0].replace(/^\d · /, "") + "): name each part marked ?, then hover or tap it to check. Turn Hide names off to read about this step." : D.TXT[s], "step " + s + " of 3 · " + D.RO[s]];
}

export default function implant() {
  const G = geo();
  const D = {
    G, P, INIT: { s: 0, quiz: false }, STEPKEY: "s", STEPMAX: 3, PLAYMS: 3200,
    CY: [106, 108, 152, 204],
    /* the syncytiotrophoblast at each step: half-width of its zone (degrees from straight down), base thickness, and its
       protrusions [angle, length, width in degrees] */
    ZONE: [0, 30, 62, 104], T0: [0, 6, 13, 18],
    FING: [[], [], [[44, 22, 3.6], [66, 32, 3], [90, 28, 3.2], [113, 34, 3], [136, 22, 3.6]],
      [[12, 34, 3.2], [34, 48, 2.8], [58, 42, 2.9], [82, 52, 2.5], [102, 46, 2.7], [126, 50, 2.7], [150, 44, 3], [170, 32, 3.2]]],
    STEPS: [["the blastocyst", "The blastocyst arrives in the uterine cavity, about 4 days after ovulation, and implants 5 to 7 days after ovulation."],
      ["1 · attachment", "Step 1, attachment (adhesion): adhesion molecules bind the blastocyst to the wall, and the trophoblasts split into cytotrophoblasts and syncytiotrophoblasts."],
      ["2 · invasion", "Step 2, invasion: the syncytiotrophoblast's protrusions secrete proteases and the blastocyst burrows into the stroma."],
      ["3 · differentiation", "Step 3, blastocyst differentiation: with progesterone, the blastocyst's paracrine factors amplify the decidual reaction."]],
    TXT: [
      "The blastocyst in the uterine cavity: many cells around a fluid-filled cavity, its outer layer the trophoblasts, which carry out implantation. The endometrium is ready from the luteal phase (wider vessels, glycogen), under progesterone. Implantation happens 5 to 7 days after ovulation.",
      "Step 1, attachment (adhesion): adhesion molecules on the trophoblasts and on the endometrial cells bind the blastocyst firmly to the wall. Attachment signals the trophoblasts to differentiate into two populations: cytotrophoblasts, the inner nurse cells, and syncytiotrophoblasts, the invaders.",
      "Step 2, invasion: the syncytiotrophoblast sends out long protrusions that secrete proteases, which break down the matrix, so the blastocyst burrows deeper into the endometrial stroma. The cytotrophoblasts stay inside as the nurse cells that nourish the early embryo and give it structure.",
      "Step 3, blastocyst differentiation: the blastocyst's paracrine factors, along with progesterone, amplify the decidual reaction. Endometrial cells enlarge and fill with glycogen, becoming decidual cells that nourish the embryo until the placenta forms; vascularity increases and the local immune response is suppressed. The syncytiotrophoblast secretes hCG (from about 8 days after ovulation) and human placental lactogen into the mother's blood."],
    RO: ["the blastocyst arrives", "attachment", "invasion", "differentiation"],
  };
  return makeFig({
    id: "implant", lec: "preg", fig: "Fig 5", short: "Implantation", hint: "step · hover",
    title: "Implantation in the decidualized endometrium",
    caption: "Step the blastocyst through the lecture's three steps of implantation: attachment, invasion and differentiation. Watch the trophoblasts split into cytotrophoblasts and the invading syncytiotrophoblast, and the stroma around it turn into decidual cells. Hide names turns the cell names into a quiz.",
    W, H,
    label: "The endometrium in section under the uterine cavity, with its surface epithelium, stromal cells, two glands and two spiral arteries, and a blastocyst that attaches, invades with its syncytiotrophoblast and is surrounded by decidual cells and new vessels, step by step.",
    D, render: imRender, say: imSay, helpers: [rnd, imGx, imAx, imAd, imTf, imSect, imPol],
    controls: `<div class="am-controls"><label class="am-slider"><span>arrives</span><input type="range" min="0" max="3" step="1" value="0" data-amk="s" aria-label="Step of implantation"><span>3</span></label><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next step</button><button type="button" class="am-btn" data-amt="quiz" aria-pressed="false">Hide names</button></div>`,
    sources: [
      "From the L17 recording and slides (Dr. Madison): implantation at the blastocyst stage (many cells around a fluid-filled cavity, the outer layer trophoblasts); the blastocyst's adhesion molecules, proteases and hormones (chiefly hCG); decidualization (increased vascularity, increased glycogen in vacuoles around the implanting blastocyst, immune modulation); his slide's three steps: attachment, which signals the trophoblasts to differentiate into cytotrophoblasts (nurse cells that nourish the early embryo and give it structure) and syncytiotrophoblasts (the invaders); invasion by the syncytiotrophoblasts' long, protease-secreting protrusions; and blastocyst differentiation, its paracrine factors with progesterone amplifying the decidual reaction into decidual cells that nourish the embryo until the placenta forms. The syncytiotrophoblasts are adhesive, invasive and endocrine (hCG and human placental lactogen).",
      "For the drawing: Moore, Persaud and Torchia (The Developing Human) and Sadler (Langman's Medical Embryology) for the blastocyst attaching at the pole with its inner cells, the syncytiotrophoblast as one multinucleated mass with no cell borders outside the cytotrophoblast, and its protrusions eroding into the stroma; Gellersen and Brosens (Endocrine Reviews, 2014) for decidual cells as enlarged, rounded stromal cells laden with glycogen, the denser vessels, and the immune cells of the decidua; Junqueira's Basic Histology for the secretory endometrium (columnar surface epithelium, coiled glands, spiral arteries).",
      "Drawn at roughly 1 pixel per micrometer for the blastocyst (about 150 micrometers across) and the cells around it; glands and vessels are schematic. Not drawn: the zona pellucida, which the blastocyst sheds before it implants, and the later steps, when it sinks fully into the stroma and the epithelium closes over it. The cells inside the blastocyst are drawn but not named, and the adhesion molecules aren't named, as the lecture asks. Educational, not medical advice."],
    css: `
.anima[data-anima="implant"] .am-svg{max-width:640px}
.anima .implant-svg .im-h{font:600 11px var(--anatomy-mono);letter-spacing:.05em;fill:var(--anatomy-muted);stroke:none}
.anima .implant-svg .im-cav{fill:var(--bx-lumen)}
.anima .implant-svg .im-str-bg{fill:var(--bx-matrix)}
.anima .implant-svg .im-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .implant-svg .im-vw{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1}
.anima .implant-svg .im-vl{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--bx-blood-soft))}
.anima .implant-svg .im-rbc{fill:var(--bx-blood)}
.anima .implant-svg .im-aw{fill:none;stroke:var(--bx-blood);stroke-width:10;stroke-linecap:round;stroke-linejoin:round}
.anima .implant-svg .im-al{fill:none;stroke:var(--bx-blood-soft);stroke-width:7.6;stroke-linecap:round;stroke-linejoin:round}
.anima .implant-svg .im-p4{fill:var(--bx-gold);stroke:var(--bx-blood-soft);stroke-width:.6}
.anima .implant-svg .im-imc{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .implant-svg .im-imc.is-calm{stroke-dasharray:2 1.6;opacity:.75}
.anima .implant-svg .im-imn{fill:var(--bx-blue)}
.anima .implant-svg .im-sc{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .implant-svg .im-dec{fill:color-mix(in srgb,var(--bx-cyto) 55%,var(--bx-lumen));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .implant-svg .im-gly{fill:var(--bx-lumen);stroke:color-mix(in srgb,var(--bx-cyto-line) 60%,transparent);stroke-width:.5}
.anima .implant-svg .im-scn{fill:var(--bx-nuc)}
.anima .implant-svg .im-dig{fill:color-mix(in srgb,var(--bx-hot-soft) 70%,var(--bx-matrix));stroke:var(--bx-hot);stroke-width:.7;stroke-dasharray:2.5 2}
.anima .implant-svg .im-epi{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .implant-svg .im-epn{fill:var(--bx-nuc)}
.anima .implant-svg .im-gw0{fill:none;stroke:var(--bx-cyto-line);stroke-width:27;stroke-linecap:round;stroke-linejoin:round}
.anima .implant-svg .im-gw{fill:none;stroke:var(--bx-cyto);stroke-width:25;stroke-linecap:round;stroke-linejoin:round}
.anima .implant-svg .im-gl{fill:none;stroke:var(--bx-lumen);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
.anima .implant-svg .im-gn{fill:var(--bx-nuc)}
.anima .implant-svg .im-gs{fill:var(--bx-eosin)}
.anima .implant-svg .im-bc{fill:color-mix(in srgb,var(--bx-blue-soft) 45%,var(--bx-lumen))}
.anima .implant-svg .im-tro{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.9}
.anima .implant-svg .im-tron{fill:var(--bx-violet)}
.anima .implant-svg .im-cyt{fill:color-mix(in srgb,var(--bx-ins-soft) 70%,var(--bx-lumen));stroke:var(--bx-ins);stroke-width:1}
.anima .implant-svg .im-cytn{fill:var(--bx-ins)}
.anima .implant-svg .im-icm{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .implant-svg .im-icmn{fill:var(--bx-nuc);opacity:.8}
.anima .implant-svg .im-sy{fill:color-mix(in srgb,var(--bx-violet) 34%,var(--bx-violet-soft));stroke:var(--bx-violet);stroke-width:1.2;stroke-linejoin:round}
.anima .implant-svg .im-syn{fill:var(--bx-nuc-line)}
.anima .implant-svg .im-adh{fill:none;stroke:var(--bx-hot);stroke-width:1.1;stroke-linecap:round}
.anima .implant-svg .im-pro{fill:var(--bx-hot)}
.anima .implant-svg .im-hcg{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.5}
.anima .implant-svg .im-par{fill:var(--bx-violet)}
.anima .implant-svg .im-in{font:600 11px var(--anatomy-mono);fill:var(--anatomy-muted);stroke:none}
.anima .implant-svg .t.im-l{font-size:12px}
.anima .implant-svg .t.im-l.b,.anima .implant-svg .t.im-l.k{fill:var(--anatomy-strong);font-weight:700}
.anima .implant-svg .t.im-l-cy{fill:color-mix(in srgb,var(--bx-ins) 75%,var(--anatomy-strong))}
.anima .implant-svg .t.im-l-sy{fill:var(--bx-violet)}
.anima .implant-svg .t.im-l-dc{fill:var(--bx-cyto-line)}
.anima .implant-svg .t.im-l-ad,.anima .implant-svg .t.im-l-pr{fill:var(--bx-hot);font-weight:600}
.anima .implant-svg .t.im-l-h{fill:var(--bx-ins);font-weight:600}
.anima .implant-svg .t.im-l-p{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong));font-weight:600}
.anima .implant-svg .t.im-l-im{fill:var(--bx-blue);font-weight:600}
.anima .implant-svg .im-st{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.8}
.anima .implant-svg .im-st.is-done{fill:var(--anatomy-shade-2)}
.anima .implant-svg .im-st.is-on{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.anima .implant-svg .im-stt{font:11.5px var(--anatomy-mono);fill:var(--anatomy-text);stroke:none}
.anima .implant-svg .im-stt.is-on{fill:var(--accent-ink);font-weight:700}
@media (max-width:560px){.anima .implant-svg .im-h{font-size:12px}.anima .implant-svg .t.im-l{font-size:13.5px}.anima .implant-svg .im-stt{font-size:13px}.anima .implant-svg .im-in{font-size:12.5px}}
`,
  });
}
