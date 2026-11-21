// Fig: the ideal implant position (L4 Terminology, Dr. Chen). Proximal view: 1.5 mm from a natural tooth, 3 mm
// between two implants; closer than 3 mm, extra bone resorbs between them and the papilla is lost (black triangle).
// Section view: facial at least 2 mm from the bone border (the buccal bundle bone resorbs after extraction), lingual at
// least 1 mm, the platform 3-4 mm below the ideal buccal gingival margin; anterior implants go lingual (palatal),
// posterior ones mid-ridge. Every distance is drawn at 16 px per mm and measured where it is labeled (at the crest);
// the bone and papilla response to crowding is schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 16;
/* touching a slider means the proximal view; picking anterior or posterior means the section */
function poOnSet(st, k) { if (k === "gap" || k === "td") st.view = "md"; if (k === "site") st.view = "bl"; }
function poRender(st, D) {
  var o = "", mm = D.MM;
  if (st.view === "md") {
    var B = 230, iw = 4 * mm, ilen = 7 * mm, td = st.td, gap = st.gap, toothR = 150, x1 = toothR + td * mm + iw / 2, x2 = x1 + iw + gap * mm;
    var loss = Math.max(0, 3 - gap) * 14, lossT = Math.max(0, 1.5 - td) * 10, gm = B - 40, CT = 112, mid = (x1 + x2) / 2;
    function rootX(y) { return toothR - 13 * (y - B) / (372 - B); }
    /* bone: the crest dips between the implants when they are too close, and next to the tooth when the implant crowds it */
    var bd = "M10 " + B + "L" + f1(toothR + 2) + " " + B + "Q" + f1(toothR + td * mm / 2) + " " + f1(B + lossT) + " " + f1(x1 - iw / 2) + " " + f1(B + 2 + lossT * 0.6) + "L" + f1(x1 + iw / 2) + " " + (B + 2) + "Q" + f1(mid) + " " + f1(B - 8 + loss * 1.8) + " " + f1(x2 - iw / 2) + " " + (B + 2) + "L" + f1(x2 + iw / 2) + " " + (B + 2) + "Q" + f1(x2 + iw / 2 + 30) + " " + B + " 630 " + B + "V380H10Z";
    o += HOT("Crestal bone. Between two implants closer than 3 mm the extra bone resorbs, the soft tissue height drops and the papilla is lost.", '<path class="trab" d="' + bd + '"/>');
    var pTop = CT + 4 + loss * 2.4;
    o += HOT("Papillae: between the tooth and the implant, held up by the tooth's bone; between the two implant crowns, it follows the bone under it.", '<path class="gum" d="M10 ' + gm + "L" + f1(toothR) + " " + gm + "L152 " + f1(118 + lossT * 2) + "Q156 " + f1(104 + lossT * 2) + " 162 " + f1(116 + lossT * 2) + "L" + f1(x1 - iw / 2 - 6) + " " + (gm + 4) + "Q" + f1(mid) + " " + f1(2 * pTop - gm - 4) + " " + f1(x2 + iw / 2 + 6) + " " + (gm + 4) + "Q" + f1(x2 + iw / 2 + 40) + " " + gm + " 630 " + gm + "V" + B + "H10Z" + '"/>');
    o += HOT("Natural tooth with its PDL: keep the implant 1.5 mm away, for the bone's blood supply and to stay off the PDL.", '<path class="dentin" d="M60 ' + (gm - 4) + "L" + toothR + " " + (gm - 4) + "L" + (toothR - 13) + " 372L74 372Z" + '"/><path class="enamel" d="M54 72Q105 54 156 72Q160 96 156 104L' + toothR + " " + (gm - 4) + "L60 " + (gm - 4) + 'Z"/><path class="pdl" d="M' + toothR + " " + B + "L" + (toothR - 13) + ' 372"/>');
    [x1, x2].forEach(function (x, i) {
      o += HOT("Implant " + (i + 1) + ", 4 mm wide.", SCREW(x, B + 2, iw, ilen, 6) + '<path class="ti-hi" d="M' + f1(x - iw / 2 + 6) + " " + (B + 2) + "L" + f1(x + iw / 2 - 6) + " " + (B + 2) + "L" + f1(x + iw / 2 + 2) + " " + (gm - 6) + "L" + f1(x - iw / 2 - 2) + " " + (gm - 6) + 'Z"/>');
      /* crowns: the first touches the tooth's crown, the two implant crowns touch at the contact point (CT) */
      var cr = i === 0 ? "M157 80Q" + f1((157 + mid) / 2) + " 58 " + f1(mid - 2) + " 76L" + f1(mid) + " " + CT + "L" + f1(x + 32) + " " + (gm - 6) + "L" + f1(x - 30) + " " + (gm - 6) + "L157 104Z"
        : "M" + f1(mid + 2) + " 76Q" + f1(x + 6) + " 58 " + f1(x + 42) + " 76Q" + f1(x + 46) + " 96 " + f1(x + 38) + " 110L" + f1(x + 30) + " " + (gm - 6) + "L" + f1(x - 32) + " " + (gm - 6) + "L" + f1(mid) + " " + CT + "Z";
      o += '<path class="crown" d="' + cr + '"/>';
    });
    /* black triangle: the open embrasure between the contact point and the papilla tip */
    if (pTop > CT + 8) { var e1 = mid + (x1 + 32 - mid) * (pTop - CT) / (gm - 6 - CT), e2 = mid + (x2 - 32 - mid) * (pTop - CT) / (gm - 6 - CT);
      o += '<path d="M' + f1(mid) + " " + CT + "L" + f1(e1) + " " + f1(pTop) + "L" + f1(e2) + " " + f1(pTop) + 'Z" fill="var(--anatomy-hi)" opacity=".85"/>' + L(mid + 90, 100, "black triangle", mid + 3, CT + 12, "start", "bad"); }
    /* the two distances, measured just under the crest; their values in a row at the bottom */
    var dy = B + 16, a0 = rootX(dy), a1 = x1 - iw / 2, b0 = x1 + iw / 2, b1 = x2 - iw / 2, ok1 = td >= 1.5, ok2 = gap >= 3;
    o += DIM(a0, dy, a1, dy, "", 0, 0) + DIM(b0, dy, b1, dy, "", 0, 0);
    o += '<path class="lead" d="M' + f1((a0 + a1) / 2) + " " + (dy + 3) + "V352M" + f1((b0 + b1) / 2) + " " + (dy + 3) + 'V352"/>';
    o += T((a0 + a1) / 2, 366, td + " mm", ok1 ? "ok" : "bad", "middle") + T((a0 + a1) / 2, 380, "need 1.5", "s mut", "middle");
    o += T((b0 + b1) / 2, 366, gap + " mm", ok2 ? "ok" : "bad", "middle") + T((b0 + b1) / 2, 380, "need 3", "s mut", "middle");
    o += T(105, 40, "tooth", "b", "middle") + T(x1, 44, "implant", "b", "middle") + T(x2, 44, "implant", "b", "middle");
  } else {
    /* the ridge in section at its crest; facial on the left */
    var ant = st.site === "ant", Bc = 236, cx = 320, w = (ant ? 4 : 5) * mm, f = (ant ? 3 : 1.5) * mm, li = (ant ? 1 : 1.5) * mm, crest = f + w + li;
    var xF = cx - crest / 2, xL = cx + crest / 2, ixx = xF + f + w / 2, ilen = 120, margin = Bc - 3.5 * mm, soft = Bc - 3 * mm;
    var wallF = ant ? 26 : 44, wallL = ant ? 40 : 44;
    var ridge = "M" + f1(xF - wallF) + " 380L" + f1(xF) + " " + (Bc + 6) + "Q" + f1(xF) + " " + Bc + " " + f1(xF + 8) + " " + Bc + "H" + f1(xL - 8) + "Q" + f1(xL) + " " + Bc + " " + f1(xL) + " " + (Bc + 6) + "L" + f1(xL + wallL) + " 380Z";
    o += HOT("The mucosa over the ridge, about 3 mm thick here.", '<path class="gum" d="M' + f1(xF - wallF - 46) + " 380L" + f1(xF - 34) + " " + (soft + 10) + "Q" + f1(xF - 20) + " " + soft + " " + f1(xF + 10) + " " + soft + "H" + f1(xL - 10) + "Q" + f1(xL + 20) + " " + soft + " " + f1(xL + 34) + " " + (soft + 10) + "L" + f1(xL + wallL + 46) + ' 380Z"/>');
    o += HOT(ant ? "The anterior ridge in section: a thin facial plate. The buccal bundle bone always resorbs after an extraction, so keep at least 2 mm of bone facial to the implant." : "The posterior ridge in section, wider, with bone that is easier to maintain.", '<path class="trab" d="' + ridge + '"/><path d="M' + f1(xF - wallF) + " 380L" + f1(xF) + " " + (Bc + 6) + "Q" + f1(xF) + " " + Bc + " " + f1(xF + 8) + " " + Bc + "H" + f1(xL - 8) + "Q" + f1(xL) + " " + Bc + " " + f1(xL) + " " + (Bc + 6) + "L" + f1(xL + wallL) + ' 380" fill="none" stroke="var(--im-cort-line)" stroke-width="4" opacity=".6"/>');
    o += HOT("The implant, its platform at the crest, 3-4 mm below the ideal buccal gingival margin: about 3 mm for the implant's biologic width, plus room to grow the emergence profile.", SCREW(ixx, Bc, w, ilen, 8));
    /* the ideal margin (copied from the neighboring tooth) and the depth */
    o += '<path class="lead" d="M' + f1(xF - 110) + " " + f1(margin) + "H" + f1(xL + 130) + '" stroke-dasharray="4 3"/>' + T(xL + 134, margin + 4, "ideal buccal", "s", "start") + T(xL + 134, margin + 18, "gingival margin", "s", "start");
    o += '<path class="lead" d="M' + f1(ixx + w / 2 + 4) + " " + Bc + "H" + f1(xL + 92) + '" stroke-dasharray="2 3"/>';
    o += DIM(xL + 86, margin, xL + 86, Bc, "3-4 mm", xL + 92, (margin + Bc) / 2 + 14, "start");
    /* bone widths at the crest */
    var dy = Bc + 12, fOk = ant ? f >= 2 * mm : f >= 1 * mm;
    o += '<path class="dim" d="M' + f1(xF + 1) + " " + dy + "H" + f1(ixx - w / 2) + "M" + f1(ixx + w / 2) + " " + dy + "H" + f1(xL - 1) + '"/>';
    o += L(xF - 40, Bc + 44, (f / mm) + " mm", (xF + ixx - w / 2) / 2, dy, "end", "ok") + T(xF - 40, Bc + 59, ant ? "need 2+" : "need 1+", "s mut", "end");
    o += L(xL + 44, Bc + 44, (li / mm) + " mm", (ixx + w / 2 + xL) / 2, dy, "start", "ok") + T(xL + 44, Bc + 59, "need 1+", "s mut", "start");
    if (ant) o += L(xF - 52, Bc - 74, "bundle bone resorbs", xF + 3, Bc + 4, "end") + T(xF - 52, Bc - 59, "after extraction", "s mut", "end");
    o += T(xF - 120, 110, "facial", "b", "middle") + T(xL + 130, 110, ant ? "palatal" : "lingual", "b", "middle");
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
  return [st.site === "ant" ? "Anterior (and immediate placement): at least 2 mm from the facial bone border, because the buccal bundle bone always resorbs after extraction; at least 1 mm lingual. Anteriors go lingually (palatally): it makes a screw-retained design possible and avoids esthetic problems. A grayish tint in the buccal tissue can mean no bone covers the implant." : "Posterior: at the middle of the ridge, over the central fossa, where the bone is easier to maintain, at least 1 mm from the buccal and lingual borders. Not wide enough? Ridge augmentation.", st.site === "ant" ? "anterior" : "posterior"];
}
export function position() {
  return makeFig({ id: "position", lec: "terms", fig: "Fig 2", short: "Ideal implant position", hint: "drag the distances · switch views",
    title: "Where the implant goes: the distances",
    caption: "1.5 mm from a tooth, 3 mm between implants, 2 mm facial, 1 mm lingual, 3-4 mm below the margin. Push two implants too close and watch the papilla.",
    W: 640, H: 400, label: "The ideal implant position: a proximal view of a tooth and two implants, and a section through the ridge.",
    D: { MM, ONSET: "poOnSet", INIT: { view: "md", gap: 3, td: 1.5, site: "ant" } }, render: poRender, say: poSay, helpers: [poOnSet],
    controls: `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-amk="view" data-amv="md">Proximal view</button><button type="button" class="am-btn" data-amk="view" data-amv="bl">Section</button><button type="button" class="am-btn" data-amk="site" data-amv="ant">Anterior</button><button type="button" class="am-btn" data-amk="site" data-amv="post">Posterior</button></div>
<div class="am-controls"><label class="am-slider"><span>implant to implant</span><input type="range" min="1" max="5" step="0.5" value="3" data-amk="gap" aria-label="Distance between the implants in mm"><span>5 mm</span></label><label class="am-slider"><span>tooth to implant</span><input type="range" min="0.5" max="3" step="0.5" value="1.5" data-amk="td" aria-label="Distance from the tooth in mm"><span>3 mm</span></label></div>`,
    sources: ["Every rule is from the L4 notes (Dr. Chen), 'Ideal implant position': depth 3-4 mm below the ideal buccal gingival margin; 1.5 mm from a tooth; 3 mm between implants (papilla lost, black triangles, exposed threads); facial 2 mm (bundle bone), lingual at least 1 mm; anterior lingual, posterior mid-ridge.",
      "Drawn at 16 px per mm, and each distance is measured at the crest, where its label is. The section shows a 4 mm implant in an 8 mm anterior ridge (3 mm facial, 1 mm lingual) and a 5 mm implant in an 8 mm posterior ridge (1.5 mm each side); the ridge shapes and how far the bone and papilla drop as implants get closer are schematic. Drag a slider for the proximal view; pick Anterior or Posterior for the section."] });
}
