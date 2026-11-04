// Fig: screw-retained or cement-retained? (L5 Prefabricated abutments, Dr. Chavali; L4 Terminology for the 7 mm count
// and angled screw channels). A buccolingual section of a lower molar implant crown in occlusion with the upper molar.
// Drag the interocclusal clearance checked on the mounted casts: 5 mm or less, screw-retained is the only choice; above
// 5 mm either works, unless the implant emerges so far facially that the access hole would come through the buccal and
// show, and then cement-retained on an angled (or custom) abutment. Drawn at 14 px per mm for the clearance and the soft
// tissue; the tooth, crown, abutment and screw shapes are schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 14;
/* where a ray from p along u leaves a closed polygon (largest t), or null */
function reExit(poly, p, u) {
  var best = null, i;
  for (i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], den = u[0] * ey - u[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    var wx = a[0] - p[0], wy = a[1] - p[1], t = (wx * ey - wy * ex) / den, s = (wx * u[1] - wy * u[0]) / den;
    if (t > 0 && s >= 0 && s <= 1 && (best === null || t > best)) best = t;
  }
  return best;
}
function reState(st) { return st.sp <= 5 ? "must" : st.fac ? "cement" : "either"; }
function reRender(st, D) {
  var o = "", mm = D.MM, sp = st.sp, fac = st.fac, cx = 380, G = 200, P = G + 3 * mm, opp = G - sp * mm, ilen = 140;
  var mode = D.reState(st), ang = fac ? -20 : 0, ar = ang * Math.PI / 180, ca = Math.cos(ar), sa = Math.sin(ar);
  var A = [cx, P], Pc = [cx, P], u = [sa, -ca], n = [ca, sa];
  var rot = 'transform="rotate(' + ang + " " + A[0] + " " + A[1] + ')"';
  o += HOT("Bone of the posterior ridge.", '<path class="trab" d="M10 ' + P + 'H630V400H10Z"/><path class="cort" d="M10 ' + P + 'H630V' + (P + 8) + 'H10Z"/>');
  o += HOT("Soft tissue over the ridge, about 3 mm thick here.", '<path class="gum" d="M10 ' + (G + 4) + "Q" + cx + " " + (G - 6) + " 630 " + (G + 4) + "V" + P + 'H10Z"/>');
  o += "<g " + rot + ">" + HOT(fac ? "The implant emerges toward the buccal (facial): its long axis, and any screw channel along it, points out through the buccal side of the crown." : "The implant along the crown's long axis: a screw channel along it comes out through the occlusal surface.", SCREW(cx, P, 70, ilen, 10)) + "</g>";
  /* the upper molar, cusps down, in occlusion */
  var cj = opp - 7 * mm, up = [[cx - 40, Math.min(0, cj - 60)], [cx - 50, cj], [cx - 64, cj + 30], [cx - 68, opp - 30], [cx - 62, opp + 4], [cx - 36, opp - 10], [cx - 4, opp + 6], [cx + 36, opp - 16], [cx + 52, opp - 34], [cx + 56, cj + 34], [cx + 46, cj], [cx + 36, Math.min(0, cj - 60)]];
  o += HOT("The opposing upper molar, in occlusion.", '<path class="enamel" d="M' + up.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + 'Z"/>');
  /* the implant crown, upright in the arch whatever the implant's angle; its base is the (tilted) platform */
  var H = G - opp, pl = [Pc[0] - 35 * n[0], Pc[1] - 35 * n[1]], pr = [Pc[0] + 35 * n[0], Pc[1] + 35 * n[1]];
  var cr = [pl, [cx - 54, G], [cx - 62, G - 0.35 * H], [cx - 56, opp + 10], [cx - 36, opp - 6], [cx - 18, opp + 6], [cx - 4, opp + 10], [cx + 12, opp + 6], [cx + 30, opp - 2], [cx + 52, opp + 12], [cx + 60, G - 0.55 * H], [cx + 52, G], pr];
  var tEx = D.reExit(cr, Pc, u), ex = [Pc[0] + tEx * u[0], Pc[1] + tEx * u[1]], exitBuccal = ex[0] < cx - 40;
  var crownD = "M" + cr.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Z";
  if (mode === "cement") {
    /* angled abutment: collar along the implant, upper part turned back upright; the crown cemented over it */
    var ct = [Pc[0] + 42 * u[0], Pc[1] + 42 * u[1]], ux = cx - 6, top = opp + 2 * mm;
    o += HOT("Cement-retained crown: one piece of porcelain or zirconia over the abutment, cemented on. No access hole. Cement pushed under the margin and left behind raises the peri-implantitis risk.", '<path class="crown" d="' + crownD + '"/>');
    o += HOT("Angled abutment: its collar follows the implant, its upper part is turned back toward the crown's axis, so the crown can be cemented upright.", "<g " + rot + '><path class="ti-hi" d="M' + (cx - 35) + " " + P + "L" + (cx - 39) + " " + (P - 42) + "H" + (cx + 39) + "L" + (cx + 35) + " " + P + 'Z"/></g><path class="ti-hi" d="M' + f1(ct[0] - 37) + " " + f1(ct[1] + 13) + "L" + f1(ux - 30) + " " + f1(top) + "Q" + f1(ux) + " " + f1(top - 6) + " " + f1(ux + 30) + " " + f1(top) + "L" + f1(ct[0] + 37) + " " + f1(ct[1] - 13) + 'Z" stroke="var(--im-hot)" stroke-width="2"/>');
    o += '<path d="M' + f1(Pc[0] + 30 * u[0]) + " " + f1(Pc[1] + 30 * u[1]) + "L" + f1(ex[0]) + " " + f1(ex[1]) + '" stroke="var(--im-bad)" stroke-width="2" stroke-dasharray="5 4"/><circle cx="' + f1(ex[0]) + '" cy="' + f1(ex[1]) + '" r="7" fill="none" stroke="var(--im-bad)" stroke-width="2"/>';
    o += L(170, ex[1] - 8, "a screw hole", ex[0] - 6, ex[1] - 1, "end", "bad") + T(170, ex[1] + 7, "would show here", "bad", "end");
    o += L(170, G - 6, "cement line", (ct[0] - 37 + ux - 30) / 2, (ct[1] + 13 + top) / 2, "end");
  } else {
    /* one-piece screw-retained crown on a titanium base, the abutment screw down the channel */
    o += HOT("Screw-retained crown: abutment and crown are one unit, screwed into the implant through a hole in the crown. No cement, so no cement-related peri-implantitis risk.", '<path class="crown" d="' + crownD + '"/>');
    var chTop = tEx - 3, plug = 1.6 * mm;
    o += "<g " + rot + '><path class="ti-hi" d="M' + (cx - 32) + " " + P + "V" + (P - 20) + "H" + (cx + 32) + "V" + P + 'Z"/>' +
      '<path d="M' + (cx - 11) + " " + (P - 26) + "V" + f1(P - chTop) + "H" + (cx + 11) + "V" + (P - 26) + 'Z" fill="var(--surface)" stroke="var(--anatomy-mid)" stroke-dasharray="3 2"/>' +
      '<path d="M' + (cx - 11) + " " + f1(P - chTop) + "V" + f1(P - chTop + plug) + "H" + (cx + 11) + "V" + f1(P - chTop) + 'Z" fill="var(--im-crown-line)" opacity=".55"/>' +
      HOT("Abutment screw: tightened through the access channel into the implant's internal threads (to the system's torque).", '<path class="ti" d="M' + (cx - 10) + " " + (P - 34) + "H" + (cx + 10) + "V" + (P - 24) + "H" + (cx + 5) + "V" + (P + 42) + "H" + (cx - 5) + "V" + (P - 24) + "H" + (cx - 10) + 'Z"/>') + "</g>";
    o += L(160, G - 80, "access channel", Pc[0] + 70 * u[0] - 11, Pc[1] + 70 * u[1], "end") + L(160, P + 30, "abutment screw", Pc[0] - 30 * u[0] - 5, Pc[1] - 30 * u[1], "end");
    if (exitBuccal) o += '<circle cx="' + f1(ex[0]) + '" cy="' + f1(ex[1]) + '" r="8" fill="none" stroke="var(--im-bad)" stroke-width="2"/>' + L(160, ex[1] + 18, "the hole shows", ex[0] - 8, ex[1], "end", "bad");
  }
  o += DIM(cx + 110, opp, cx + 110, G, sp + " mm", cx + 118, (opp + G) / 2 + 4, "start");
  o += T(cx + 118, (opp + G) / 2 + 20, "clearance", "s mut", "start") + T(cx + 118, (opp + G) / 2 + 35, "on the casts", "s mut", "start");
  o += T(30, P + 96, "buccal (cheek)", "b", "start") + T(612, P + 96, "lingual", "b", "end");
  var verdict = mode === "must" ? ["Screw-retained: no choice", "bad"] : mode === "cement" ? ["Cement-retained", "hot-t"] : ["Either: screw or cement", "ok"];
  o += T(24, 34, verdict[0], verdict[1], "start");
  return o;
}
function reSay(st) {
  var sp = st.sp, m = st.sp <= 5 ? "must" : st.fac ? "cement" : "either";
  if (m === "must") return ["'This is an exam question': with " + sp + " mm of interocclusal space (5 mm or less) you must do screw-retained; you have no choice, because a cement-retained crown needs a minimum of 5 mm of clearance." + (st.fac ? " The access hole would come out through the buccal; the terminology lecture's way to keep screw retention on a facial implant is an angled screw channel." : ""), "screw-retained"];
  if (m === "cement") return ["Above 5 mm either would fit, but this implant emerges so far facially that a screw access hole would come through the buccal and show, so you must use cement-retained, on an angled prefabricated or a custom abutment that pulls the angulation back.", "cement-retained"];
  return ["Above 5 mm you can do either. Screw-retained has no cement, so no cement-related peri-implantitis risk; cement-retained is often more esthetic. (The terminology lecture's 7 mm counts from the bone, including about 3 mm of biologic width; Dr. Chavali's 5 mm is checked on the mounted casts.)", "either"];
}
export function retention() {
  return makeFig({ id: "retention", lec: "prefab", fig: "Fig 1", short: "Screw or cement?", hint: "drag the clearance · tilt the implant",
    title: "Screw-retained or cement-retained?",
    caption: "Dr. Chavali's exam rule in one drawing: a lower molar implant crown in section, cheek on the left. Drag the interocclusal clearance, then tilt the implant toward the facial.",
    W: 640, H: 400, label: "A buccolingual section of a lower molar implant crown in occlusion with the upper molar, with the interocclusal clearance marked.",
    D: { MM, INIT: { sp: 4, fac: false } }, render: reRender, say: reSay, helpers: [reExit, reState],
    controls: `<div class="am-controls"><label class="am-slider"><span>3 mm</span><input type="range" min="3" max="10" step="0.5" value="4" data-amk="sp" aria-label="Interocclusal clearance in mm"><span>10 mm</span></label><button type="button" class="am-btn" data-amt="fac">Implant emerges facially</button></div>`,
    sources: ["From the L5 notes (Dr. Chavali): 5 mm or less, screw-retained, 'you have no choice'; above 5 mm either, unless the access hole would come through the facial or buccal and show, then cement-retained on an angled prefabricated or custom abutment; peri-implantitis risk much higher with cement; a cement-retained crown needs at least 5 mm. From the L4 notes: the 7 mm count from the bone, one-piece screw-retained crowns, and angled screw channels for a facial implant.",
      "Drawn at 14 px per mm for the clearance and the soft tissue; the clearance is measured from the soft tissue to the opposing tooth, as on the casts. The teeth, crown, abutment, screw and the 20-degree tilt are schematic."] });
}
