// Fig: the emergence profile and its E, B and C zones (L4 Terminology, Dr. Chen). A labiolingual section of an implant
// crown in the upper central incisor's place (the PCD lab's #9), so the crown points down and coronal is down, as in
// the notes' "creep down (coronally)". From the platform: C zone, the first 1-1.5 mm, straight (the abutment); B zone,
// concave (the "running room"); E zone, the last 1 mm above the margin, convex most of the time. Shape the facial E zone:
// more concave and the margin creeps down (coronally), more convex and it moves up (apically). The palatal side follows
// a natural tooth's contour. Drawn at 30 px per mm for the zone heights; how far the margin moves is schematic.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

const MM = 30;
/* points along a quadratic or cubic Bezier, for contours the soft tissue has to follow */
function zoQ(a, c, b, n) { var r = [], i, t, u; for (i = 1; i <= n; i++) { t = i / n; u = 1 - t; r.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return r; }
function zoC(a, c1, c2, b, n) { var r = [], i, t, u; for (i = 1; i <= n; i++) { t = i / n; u = 1 - t; r.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]); } return r; }
/* the restoration's outline on one side, platform down to the bottom of the drawing, as absolute points;
   e: -1 concave .. +1 convex (facial E zone only) */
function zoSide(sg, e, D) {
  var cx = D.CX, P = D.P, mm = D.MM, cT = P + 1.25 * mm, bT = P + 2.8 * mm, eT = P + 3.8 * mm;
  function X(x) { return cx + sg * x; }
  var fac = sg < 0, p0 = [X(60), P], p1 = [X(60), cT], p2 = [X(fac ? 80 : 72), bT], p3 = fac ? [X(104), eT] : [X(90), eT - 3], pts = [p0, p1];
  /* B zone: concave, its control point pulled toward the implant axis */
  pts = pts.concat(D.zoQ(p1, [X(62), bT - 6], p2, 10));
  /* E zone: the facial follows the slider (control pushed out into the tissue = convex); the palatal is gently convex */
  var k = fac ? e : 0.4, mx = (p2[0] + p3[0]) / 2, my = (p2[1] + p3[1]) / 2;
  pts = pts.concat(D.zoQ(p2, [mx + sg * k * 12, my - k * 13], p3, 10));
  /* the crown below the margin: facial convex cervical third; palatal cingulum, then into the lingual fossa */
  if (fac) pts = pts.concat(D.zoC(p3, [X(112), eT + 40], [X(112), 330], [X(104), 400], 16));
  else pts = pts.concat(D.zoC(p3, [X(104), eT + 50], [X(96), 330], [X(70), 400], 16));
  return pts;
}
function zoRender(st, D) {
  var o = "", mm = D.MM, P = D.P, cx = D.CX, e = st.e, bT = P + 2.8 * mm, cT = P + 1.25 * mm, eT = P + 3.8 * mm;
  var fac = D.zoSide(-1, e, D), pal = D.zoSide(1, e, D);
  var mBase = eT, margin = eT - e * 16, mPal = eT - 3;
  function pathOf(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }).join(""); }
  function upTo(pts, y) { var r = [], i; for (i = 0; i < pts.length; i++) { if (pts[i][1] <= y) r.push(pts[i]); else { var a = pts[i - 1], b = pts[i], t = (y - a[1]) / (b[1] - a[1]); r.push([a[0] + t * (b[0] - a[0]), y]); break; } } return r; }
  /* bone above (upper jaw), the implant in it */
  var boneF = "M" + (cx - 150) + " 0L" + (cx - 122) + " " + (P - 6) + "Q" + (cx - 92) + " " + (P + 2) + " " + (cx - 60) + " " + P, boneP = "L" + (cx + 60) + " " + P + "Q" + (cx + 100) + " " + (P + 4) + " " + (cx + 136) + " " + (P + 4) + "L" + (cx + 230) + " 0Z";
  o += HOT("Bone. In the upper jaw it is above the implant: about 2 mm of facial bone (the plate the notes ask for), more on the palatal side.", '<path class="trab" d="' + boneF + boneP + '"/><path d="' + boneF + "M" + (cx + 60) + " " + P + "Q" + (cx + 100) + " " + (P + 4) + " " + (cx + 136) + " " + (P + 4) + "L" + (cx + 230) + ' 0" fill="none" stroke="var(--im-cort-line)" stroke-width="5" opacity=".55"/>');
  o += '<g transform="rotate(180 ' + cx + " " + f1(P / 2) + ')">' + HOT("The implant, in the bone above; its platform is where the emergence profile starts.", SCREW(cx, 0, 120, P, 8)) + "</g>";
  /* soft tissue, facial and palatal, hugging the restoration from the platform down to the margin */
  var fIn = upTo(fac, margin), pIn = upTo(pal, mPal), fm = fIn[fIn.length - 1], pm = pIn[pIn.length - 1];
  var facD = "M" + (cx - 150) + " 0L" + (cx - 122) + " " + (P - 6) + "Q" + (cx - 92) + " " + (P + 2) + " " + (cx - 60) + " " + P + pathOf(fIn).replace(/^M/, "L") + "Q" + f1(fm[0] - 12) + " " + f1(fm[1] + 8) + " " + f1(fm[0] - 34) + " " + f1(fm[1] - 8) + "Q" + f1(cx - 210) + " " + f1(P + 40) + " " + (cx - 250) + " 0Z";
  var palD = "M" + (cx + 230) + " 0L" + (cx + 136) + " " + (P + 4) + "Q" + (cx + 100) + " " + (P + 4) + " " + (cx + 60) + " " + P + pathOf(pIn).replace(/^M/, "L") + "Q" + f1(pm[0] + 12) + " " + f1(pm[1] + 8) + " " + f1(pm[0] + 36) + " " + f1(pm[1] - 10) + "Q" + f1(cx + 200) + " " + f1(P + 60) + " " + (cx + 260) + " 0Z";
  o += HOT("Facial peri-implant soft tissue. Its margin rests on the E zone: make the E zone more concave and it creeps down (coronally); more convex and it is pushed up (apically).", '<path class="gum" d="' + facD + '"/>');
  o += HOT("Palatal soft tissue: on the palatal side, follow the natural tooth's contour.", '<path class="gum" d="' + palD + '"/>');
  /* the restoration: custom abutment for the C and B zones, the crown from the B/E junction down */
  var facAb = [], palAb = [], facCr = [], palCr = [];
  fac.forEach(function (p) { (p[1] <= bT + 0.01 ? facAb : facCr).push(p); }); pal.forEach(function (p) { (p[1] <= bT + 0.01 ? palAb : palCr).push(p); });
  var crD = "M" + f1(facAb[facAb.length - 1][0]) + " " + f1(bT) + pathOf(facCr).replace(/^M/, "L") + pathOf(palCr.slice().reverse()).replace(/^M/, "L") + "L" + f1(palAb[palAb.length - 1][0]) + " " + f1(bT) + "Z";
  var abD = pathOf(facAb) + pathOf(palAb.slice().reverse()).replace(/^M/, "L") + "Z";
  o += HOT("Custom abutment: it sets the C zone (straight) and the B zone (concave preferred, to keep tissue volume).", '<path class="ti-hi" d="' + abD + '"/>');
  o += HOT("The crown. Its cervical part is the E zone, shaped from the cervical of the wax-up; below the margin is the visible crown (it runs on below the drawing).", '<path class="crown" d="' + crD + '"/>');
  /* zone brackets on the facial side, with the zone lines carried across the restoration */
  var bx = 132;
  function zb(y0, y1, s, info) { return HOT(info, '<path class="hotline" d="M' + bx + " " + f1(y0 + 1) + "L" + (bx + 6) + " " + f1(y0 + 1) + "L" + (bx + 6) + " " + f1(y1 - 1) + "L" + bx + " " + f1(y1 - 1) + '"/>' + T(bx - 4, (y0 + y1) / 2 + 5, s, "hot-t", "end")); }
  [cT, bT].forEach(function (y) { o += '<path class="lead" d="M' + (bx + 8) + " " + f1(y) + "H" + (cx + 150) + '" stroke-dasharray="2 4" opacity=".7"/>'; });
  o += zb(P, cT, "C zone", "C zone: the first 1-1.5 mm from the platform, kept straight, for the connective tissue's blood supply and for bone remodeling. Determined by the abutment.");
  o += zb(cT, bT, "B zone", "B zone: between C and E; variable, but concave is preferred, to keep tissue volume. The 'running room'.");
  o += zb(bT, eT, "E zone", "E zone: the last 1 mm under the gingival margin, the critical contour, convex most of the time; determined by esthetics. Other authors call B and C together the subcritical contour (straight to concave).");
  /* the margin with a straight E zone, and where it is now */
  o += '<path class="lead" d="M' + (bx + 8) + " " + f1(mBase) + "H" + f1(cx - 96) + '" stroke-dasharray="5 4"/>';
  if (Math.abs(margin - mBase) > 2) { var dir = margin > mBase ? 1 : -1; o += '<path d="M' + f1(fm[0] - 46) + " " + f1(mBase) + "V" + f1(margin - dir * 5) + '" stroke="var(--im-hot)" stroke-width="2"/><path d="M' + f1(fm[0] - 51) + " " + f1(margin - dir * 7) + "L" + f1(fm[0] - 46) + " " + f1(margin) + "L" + f1(fm[0] - 41) + " " + f1(margin - dir * 7) + 'Z" fill="var(--im-hot)"/>'; }
  o += T(24, mBase + 40, "dashed: the margin", "s mut", "start") + T(24, mBase + 55, "with a straight E zone", "s mut", "start");
  o += L(206, mBase + 96, "soft tissue margin", fm[0] - 2, fm[1] + 2, "end");
  o += L(cx + 186, P + 40, "platform", cx + 54, P, "start");
  o += T(70, 34, "facial", "b", "middle") + T(cx + 150, 300, "palatal:", "b", "start") + T(cx + 150, 317, "follows the", "s mut", "start") + T(cx + 150, 332, "natural tooth", "s mut", "start");
  o += T(24, 380, "upper jaw: coronal is down ↓", "s mut", "start");
  return o;
}
function zoSay(st) {
  var c = st.e, s = "Upper incisor, so coronal is down. From the platform: C zone straight, B zone concave, E zone at the margin. ";
  if (c < -0.2) s += "A more concave E zone (and even B zone) lets the margin creep down (coronally): use it to gain tissue, or when the implant is placed more buccally.";
  else if (c > 0.2) s += "A more convex E zone pushes the margin up (apically): use it when the margin is too low, or when the implant is more lingual.";
  else s += "This E zone is about straight; drag it toward concave or convex to see the margin move.";
  return [s, c < -0.2 ? "margin moves coronally" : c > 0.2 ? "margin moves apically" : "straight E zone"];
}
export function zones() {
  return makeFig({ id: "zones", lec: "terms", fig: "Fig 5", short: "Emergence profile", hint: "shape the E zone · hover a zone",
    title: "The emergence profile: E, B and C zones",
    caption: "An implant crown in an upper incisor's place, in section: the contour from the platform down to the soft tissue margin, zone by zone. Make the facial E zone concave or convex and watch the margin move.",
    W: 640, H: 400, label: "A labiolingual section of an upper incisor implant crown with the C, B and E zones marked on the facial side and the soft tissue margin.",
    D: { MM, P: 104, CX: 380, INIT: { e: 0.6 } }, render: zoRender, say: zoSay, helpers: [zoQ, zoC, zoSide],
    controls: `<div class="am-controls"><label class="am-slider"><span>concave</span><input type="range" min="-1" max="1" step="0.1" value="0.6" data-amk="e" aria-label="Facial E zone contour, concave to convex"><span>convex</span></label></div>`,
    sources: ["From the L4 notes (Dr. Chen), 'Emergence profile and the E, B and C zones': the contour between the platform and the soft tissue margin, set by the abutment or the crown; C zone the first 1-1.5 mm, straight; B zone concave preferred; E zone the last 1 mm under the margin, the critical contour, convex most of the time; to make the margin creep down (coronally), or for a buccal implant, make the E zone (even the B zone) more concave; to move it up (apically), or for a lingual implant, more convex; on the palatal side, follow the natural tooth.",
      "Drawn as an upper incisor (the PCD lab's #9), so coronal is down, as in the notes. Zone heights at 30 px per mm; the crown's shape and how far the margin moves are schematic, and splitting the restoration into a custom abutment (C and B) and a crown (E) is one common design, not the only one."] });
}
