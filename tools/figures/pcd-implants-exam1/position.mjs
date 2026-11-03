// Fig: the ideal implant position (L4 Terminology, Dr. Chen). Proximal view: 1.5 mm from a natural tooth, 3 mm between
// two implants; closer than 3 mm, extra bone resorbs between them and the papilla is lost (black triangle). Section
// view: facial 2 mm from the bone border (the buccal bundle bone resorbs after extraction), lingual at least 1 mm,
// the platform 3-4 mm below the ideal buccal gingival margin; anterior implants go lingual, posterior ones mid-ridge.
// Distances drawn at 16 px per mm; the bone and papilla response is schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 16;
function poRender(st, D) {
  var o = "", mm = D.MM;
  if (st.view === "md") {
    var B = 230, iw = 4 * mm, td = st.td, gap = st.gap, x1 = 150 + td * mm + iw / 2, x2 = x1 + iw + gap * mm, toothR = 150;
    var loss = Math.max(0, 3 - gap) * 14, lossT = Math.max(0, 1.5 - td) * 10;
    /* bone: crest dips between the implants when they are too close */
    var mid = (x1 + x2) / 2, bd = "M10 " + B + "L" + f1(toothR + 6) + " " + B + "Q" + f1(toothR + td * mm / 2 + 4) + " " + f1(B + lossT) + " " + f1(x1 - iw / 2) + " " + f1(B + 4 + lossT * 0.6) + "L" + f1(x1 + iw / 2) + " " + (B + 4) + "Q" + f1(mid) + " " + f1(B - 10 + loss * 1.8) + " " + f1(x2 - iw / 2) + " " + (B + 4) + "L" + f1(x2 + iw / 2) + " " + (B + 4) + "Q" + f1(x2 + iw / 2 + 30) + " " + B + " 630 " + B + "V380H10Z";
    o += HOT("Crestal bone. Between two implants closer than 3 mm the extra bone resorbs, the soft tissue height drops and the papilla is lost.", '<path class="cort" d="' + bd + '"/>');
    /* soft tissue: papilla height follows the bone */
    var gm = B - 40, CT = 118, pTop = CT + 4 + loss * 2.2;
    o += HOT("Papilla between the implant crowns. It follows the bone under it.", '<path class="gum" d="M10 ' + gm + "L" + f1(toothR) + " " + gm + "L" + f1(x1 - iw / 2 - 6) + " " + (gm + 4) + "Q" + f1(mid) + " " + f1(2 * pTop - gm - 4) + " " + f1(x2 + iw / 2 + 6) + " " + (gm + 4) + "L630 " + gm + "V" + B + "H10Z" + '"/>');
    /* natural tooth */
    o += HOT("Natural tooth with its PDL: keep the implant 1.5 mm away, for the bone's blood supply and to stay off the PDL.", '<path class="dentin" d="M60 ' + (gm - 4) + "L" + toothR + " " + (gm - 4) + "L" + (toothR - 14) + " 372L76 372Z" + '"/><path class="enamel" d="M54 70Q105 52 156 70L' + toothR + " " + (gm - 4) + "L60 " + (gm - 4) + 'Z"/><path class="pdl" d="M' + toothR + " " + B + "L" + (toothR - 13) + ' 372"/>');
    [x1, x2].forEach(function (x, i) {
      o += HOT("Implant " + (i + 1) + ".", SCREW(x, B + 4, iw, 128, 8) + '<path class="ti-hi" d="M' + f1(x - iw / 2 + 6) + " " + (B + 4) + "L" + f1(x + iw / 2 - 6) + " " + (B + 4) + "L" + f1(x + iw / 2 + 4) + " " + (gm - 6) + "L" + f1(x - iw / 2 - 4) + " " + (gm - 6) + 'Z"/>');
      var cr = i === 0 ? "M" + f1(x - 40) + " 74Q" + f1(x) + " 58 " + f1(mid - 2) + " 74L" + f1(mid) + " " + CT + "L" + f1(x + 32) + " " + (gm - 6) + "L" + f1(x - 32) + " " + (gm - 6) + "Z"
        : "M" + f1(mid + 2) + " 74Q" + f1(x) + " 58 " + f1(x + 40) + " 74L" + f1(x + 32) + " " + (gm - 6) + "L" + f1(x - 32) + " " + (gm - 6) + "L" + f1(mid) + " " + CT + "Z";
      o += '<path class="crown" d="' + cr + '"/>';
    });
    /* black triangle: the open embrasure between the contact point and the papilla tip */
    if (pTop > CT + 8) { var e1 = mid + (x1 + 32 - mid) * (pTop - CT) / (gm - 6 - CT), e2 = mid + (x2 - 32 - mid) * (pTop - CT) / (gm - 6 - CT);
      o += '<path d="M' + f1(mid) + " " + CT + "L" + f1(e1) + " " + f1(pTop) + "L" + f1(e2) + " " + f1(pTop) + 'Z" fill="var(--anatomy-hi)" opacity=".85"/>' + L(mid + 90, 100, "black triangle", mid + 3, CT + 12, "start", "bad"); }
    o += DIM(toothR - 13 + 3 + 10, B + 60, x1 - iw / 2 + 2, B + 60, td + " mm", (toothR + x1 - iw / 2) / 2, B + 80, "middle");
    o += DIM(x1 + iw / 2 - 2, B + 100, x2 - iw / 2 + 2, B + 100, gap + " mm", mid, B + 120, "middle");
    o += T(105, 40, "tooth", "b", "middle") + T(x1, 44, "implant", "b", "middle") + T(x2, 44, "implant", "b", "middle");
  } else {
    var ant = st.site === "ant", Bc = 250, gmB = Bc - 70, cx = 320, w = 4 * mm, ridgeL = cx - 6.5 * mm, ridgeR = cx + 6.5 * mm;
    var ixx = ant ? ridgeL + 2 * mm + w / 2 + 6 : cx, plat = gmB + 3.5 * mm;
    if (ant) ixx = ridgeR - 1 * mm - w / 2 - 22;
    o += HOT("The alveolar ridge in section (facial on the left, lingual on the right).", '<path class="cort" d="M' + f1(ridgeL - 30) + " 380L" + f1(ridgeL) + " " + Bc + "Q" + cx + " " + (Bc - 16) + " " + f1(ridgeR) + " " + Bc + "L" + f1(ridgeR + 30) + ' 380Z"/>');
    o += HOT("Mucosa over the ridge. The ideal buccal gingival margin is copied from the neighboring tooth.", '<path class="gum" d="M' + f1(ridgeL - 40) + " 380L" + f1(ridgeL - 12) + " " + gmB + "Q" + cx + " " + (gmB - 20) + " " + f1(ridgeR + 12) + " " + gmB + "L" + f1(ridgeR + 40) + " 380L" + f1(ridgeR + 30) + " 380L" + f1(ridgeR) + " " + Bc + "Q" + cx + " " + (Bc - 16) + " " + f1(ridgeL) + " " + Bc + "L" + f1(ridgeL - 30) + ' 380Z"/>');
    o += HOT("The implant, platform 3-4 mm below the ideal buccal gingival margin: about 3 mm for the implant's biologic width, plus room to grow the emergence profile.", SCREW(ixx, plat, w, 120, 8));
    o += '<path class="lead" d="M' + f1(ridgeL - 60) + " " + gmB + "H" + f1(ridgeR + 70) + '" stroke-dasharray="4 3"/>' + T(ridgeR + 74, gmB + 4, "ideal buccal margin", "s");
    o += DIM(ixx + w / 2 + 40, gmB, ixx + w / 2 + 40, plat, "3-4 mm", ixx + w / 2 + 46, (gmB + plat) / 2 + 4, "start");
    var facB = ixx - w / 2 - ridgeL, linB = ridgeR - ixx - w / 2;
    o += DIM(ridgeL + 4, plat + 60, ixx - w / 2, plat + 60, (ant ? "2 mm+" : "1 mm+"), (ridgeL + ixx - w / 2) / 2, plat + 80, "middle");
    o += DIM(ixx + w / 2, plat + 100, ridgeR - 4, plat + 100, "1 mm+", (ixx + w / 2 + ridgeR) / 2, plat + 120, "middle");
    o += T(ridgeL - 50, 120, "facial", "b", "end") + T(ridgeR + 50, 120, "lingual", "b", "start");
    if (ant) o += L(ridgeL - 90, 210, "bundle bone resorbs", ridgeL + 6, Bc + 2, "end");
    o += T(cx, 40, ant ? "anterior: placed lingually (palatally)" : "posterior: middle of the ridge, over the central fossa", "b", "middle");
  }
  return o;
}
function poSay(st) {
  if (st.view === "md") {
    var s = "Proximal rules: 1.5 mm from a natural tooth, 3 mm between two implants. ";
    if (st.gap < 3) s += "At " + st.gap + " mm the extra bone between the implants resorbs, the soft tissue height drops and the papilla is lost: a black triangle, exposed threads. ";
    else s += "At " + st.gap + " mm the bone between the implants holds the papilla up. ";
    if (st.td < 1.5) s += "And " + st.td + " mm from the tooth is too close: it compromises the bone's blood supply and the PDL.";
    return [s, st.gap < 3 || st.td < 1.5 ? "too close" : "ok"];
  }
  return [st.site === "ant" ? "Anterior (and immediate placement): 2 mm from the facial bone border, because the buccal bundle bone always resorbs after extraction; at least 1 mm lingual. Anteriors go lingually: it makes a screw-retained design possible and avoids esthetic problems. A grayish tint in the buccal tissue can mean no bone covers the implant." : "Posterior: at the middle of the ridge, over the central fossa, where the bone is easier to maintain, at least 1 mm from the buccal and lingual borders. Not wide enough? Ridge augmentation.", st.site === "ant" ? "anterior" : "posterior"];
}
export function position() {
  return makeFig({ id: "position", lec: "terms", fig: "Fig 2", short: "Ideal implant position", hint: "drag the distances · switch views",
    title: "Where the implant goes: the distances",
    caption: "1.5 mm from a tooth, 3 mm between implants, 2 mm facial, 1 mm lingual, 3-4 mm below the margin. Push two implants too close and watch the papilla.",
    W: 640, H: 380, label: "The ideal implant position: a proximal view of a tooth and two implants, and a section through the ridge.",
    D: { MM, INIT: { view: "md", gap: 3, td: 1.5, site: "ant" } }, render: poRender, say: poSay,
    controls: `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-amk="view" data-amv="md">Proximal view</button><button type="button" class="am-btn" data-amk="view" data-amv="bl">Section: anterior vs posterior</button><button type="button" class="am-btn" data-amk="site" data-amv="ant">Anterior</button><button type="button" class="am-btn" data-amk="site" data-amv="post">Posterior</button></div>
<div class="am-controls"><label class="am-slider"><span>implant to implant</span><input type="range" min="1" max="5" step="0.5" value="3" data-amk="gap" aria-label="Distance between the implants in mm"><span>5 mm</span></label><label class="am-slider"><span>tooth to implant</span><input type="range" min="0.5" max="3" step="0.5" value="1.5" data-amk="td" aria-label="Distance from the tooth in mm"><span>3 mm</span></label></div>`,
    sources: ["Every distance is from the L4 notes (Dr. Chen), 'Ideal implant position': depth 3-4 mm below the ideal buccal gingival margin; 1.5 mm from a tooth; 3 mm between implants (papilla lost, black triangles); facial 2 mm (bundle bone), lingual at least 1 mm; anterior lingual, posterior mid-ridge.", "Drawn at 16 px per mm for the distances; how far the bone and papilla drop as implants get closer is schematic. The sliders work in the proximal view."] });
}
