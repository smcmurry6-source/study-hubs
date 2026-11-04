// Fig: periodontal vs peri-implant attachment (L2 Introduction, Dr. Chavali; L8 Surgery, Dr. Geisinger). A tooth and
// an implant side by side in section, each in its own block of bone. The tooth: enamel, dentin, pulp, cementum, a PDL
// whose fibers insert into cementum and bone, gingival fibers inserting into the cementum above the bone, the junctional
// epithelium on the enamel ending at the CEJ, and the sulcus. The implant: bone directly on titanium (ankylosis), an
// abutment through the mucosa, a long barrier epithelium on the titanium and a connective tissue zone whose fibers run
// parallel to the abutment and circular around it (cut across in this section), none inserting.
// The soft tissue layers are drawn to one scale (22 px per mm) from the averages behind the lecture's two numbers:
// tooth (Gargiulo 1961) sulcus 0.69, JE 0.97, connective tissue 1.07 mm, biologic width 2.04 mm; implant (Cochran 1997)
// sulcus 0.16, JE 1.88, connective tissue 1.05 mm, 3.08 mm including the sulcus (the L2 table's wording).
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 22, BONE = 262;
/* the tooth's half-width at height y (crown outline above the CEJ, tapering root below) */
function atToothHw(y, cej) {
  if (y >= cej) return 42 - 14 * (y - cej) / (400 - cej);
  if (y >= 132) return 42 + 10 * Math.pow((cej - y) / (cej - 132), 0.6);
  return 52 - 12 * Math.pow((132 - y) / 36, 2);
}
function atRender(st, D) {
  var o = "", hl = st.hl, mm = D.MM, B = D.BONE, tx = 160, ix = 480, i, y;
  function op(k) { return hl === "none" || hl === k ? "" : ' opacity=".3"'; }
  var cej = B - 1.07 * mm, jeT = B - 2.04 * mm, gmT = B - 2.73 * mm;       /* tooth: CEJ, top of JE, gingival margin */
  var ctI = B - 1.05 * mm, jeI = B - 2.93 * mm, gmI = B - 3.08 * mm;       /* implant: top of CT zone, top of JE, mucosal margin */
  function hw(yy) { return D.atToothHw(yy, cej); }
  /* ---- bone: one block for each, cortical crest over trabecular bone ---- */
  function boneBlock(x0, x1) {
    var s = '<path class="trab" d="M' + x0 + " " + B + "H" + x1 + "V396H" + x0 + 'Z"/>';
    for (var k = 0; k < 9; k++) s += '<ellipse class="marrow" cx="' + f1(x0 + 22 + ((k * 61) % (x1 - x0 - 40))) + '" cy="' + f1(B + 36 + ((k * 23) % 90)) + '" rx="' + (7 + (k % 3) * 2) + '" ry="5"/>';
    return s + '<path class="cort" d="M' + x0 + " " + B + "H" + x1 + "V" + (B + 8) + "H" + x0 + 'Z"/>';
  }
  o += HOT("Alveolar bone around the tooth. A periodontal ligament separates the root from the bone; the socket is lined by a thin cortical plate (lamina dura).", '<g' + op("bone") + ">" + boneBlock(10, 300) + "</g>");
  o += HOT("Bone around the implant: it lies directly on the titanium threads. That is osseointegration, a functional ankylosis: no PDL, so no mechanoreceptors and no physiological mobility.", '<g' + op("bone") + ">" + boneBlock(340, 630) + "</g>");
  /* ---- the tooth ---- */
  var outL = [], outR = [];
  for (y = 96; y <= 396; y += 6) { outL.push([tx - hw(y), y]); outR.push([tx + hw(y), y]); }
  function poly(pts) { return pts.map(function (p, k) { return (k ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }).join(""); }
  /* PDL band (socket) and lamina dura, below the crest */
  var pdlL = "", pdlR = "";
  for (y = B; y <= 396; y += 6) { pdlL += (pdlL ? "L" : "M") + f1(tx - hw(y) - 3) + " " + y; pdlR += (pdlR ? "L" : "M") + f1(tx + hw(y) + 3) + " " + y; }
  o += HOT("Periodontal ligament: about 0.2 mm of fibers between cementum and bone, with mechanoreceptors (proprioception). An implant has none.", '<g' + op("fibers") + '><path class="pdl" d="' + pdlL + '" stroke-width="6"/><path class="pdl" d="' + pdlR + '" stroke-width="6"/><path d="' + pdlL + '" fill="none" stroke="var(--im-cort-line)" stroke-width="1.6" transform="translate(-3 0)"/><path d="' + pdlR + '" fill="none" stroke="var(--im-cort-line)" stroke-width="1.6" transform="translate(3 0)"/></g>');
  /* PDL fibers: oblique, from bone down to cementum */
  var fb = "";
  for (y = B + 14; y < 392; y += 12) { var a = hw(y); fb += "M" + f1(tx - a - 6) + " " + (y - 4) + "L" + f1(tx - a) + " " + (y + 2) + "M" + f1(tx + a + 6) + " " + (y - 4) + "L" + f1(tx + a) + " " + (y + 2); }
  o += '<path class="fib" d="' + fb + '"' + op("fibers") + "/>";
  /* crown (enamel over dentin), root dentin, pulp, cementum */
  var cL = outL.filter(function (p) { return p[1] <= cej; }), cR = outR.filter(function (p) { return p[1] <= cej; });
  var enamelD = "M" + f1(tx - hw(cej)) + " " + f1(cej) + cL.slice().reverse().map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + "Q" + f1(tx - 12) + " 86 " + tx + " 94Q" + f1(tx + 12) + " 86 " + f1(cR[0][0]) + " " + f1(cR[0][1]) + cR.map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + "L" + f1(tx + hw(cej)) + " " + f1(cej) + "Z";
  var dej = [], dejR = [];
  for (y = 112; y <= cej; y += 6) { var t = (y - 112) / (cej - 112), ins = 10 * (1 - t) + 0.5; dej.push([tx - hw(y) + ins, y]); dejR.push([tx + hw(y) - ins, y]); }
  var rootL = outL.filter(function (p) { return p[1] > cej; }), rootR = outR.filter(function (p) { return p[1] > cej; });
  var dentinD = "M" + f1(dej[0][0]) + " " + f1(dej[0][1]) + "Q" + tx + " 104 " + f1(dejR[0][0]) + " " + f1(dejR[0][1]) + dejR.map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + rootR.map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + "L" + f1(tx + hw(400)) + " 400L" + f1(tx - hw(400)) + " 400" + rootL.slice().reverse().map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + dej.slice().reverse().map(function (p) { return "L" + f1(p[0]) + " " + f1(p[1]); }).join("") + "Z";
  o += HOT("Crown: enamel over dentin. In health the junctional epithelium attaches to the enamel, and its lower end sits at the cementoenamel junction (CEJ).", '<path class="enamel" d="' + enamelD + '"/>');
  o += HOT("Dentin, with the pulp inside. The root is covered by cementum, which the PDL fibers and the gingival fibers insert into.", '<path class="dentin" d="' + dentinD + '"/><path d="M' + (tx - 20) + " 156Q" + (tx - 18) + " 136 " + (tx - 10) + " 146Q" + tx + " 140 " + (tx + 10) + " 146Q" + (tx + 18) + " 136 " + (tx + 20) + " 156L" + (tx + 12) + " " + f1(cej) + "L" + (tx + 5) + " 400H" + (tx - 5) + "L" + (tx - 12) + " " + f1(cej) + 'Z"" fill="var(--im-marrow)" stroke="var(--im-pdl)" stroke-width=".8"/>');
  o += '<path d="' + poly(rootL) + poly(rootR) + '" fill="none" stroke="var(--im-dentin-line)" stroke-width="2.2" opacity=".75"/>';
  o += '<path d="M' + f1(tx - hw(cej) - 4) + " " + f1(cej) + "h8M" + f1(tx + hw(cej) - 4) + " " + f1(cej) + 'h8" stroke="var(--anatomy-hi)" stroke-width="1"/>';
  /* gingiva, both sides: outer surface, rounded free margin, sulcus gap above the JE */
  function ging(sg, x0) {
    var s = "M" + x0 + " " + f1(gmT + 6) + "Q" + f1(tx + sg * (hw(gmT) + 30)) + " " + f1(gmT + 4) + " " + f1(tx + sg * (hw(gmT) + 6)) + " " + f1(gmT - 1);
    s += "Q" + f1(tx + sg * (hw(gmT) + 3)) + " " + f1(gmT + 2) + " " + f1(tx + sg * (hw(jeT) + 2.5)) + " " + f1(jeT);
    for (var yy = jeT + 4; yy <= B; yy += 4) s += "L" + f1(tx + sg * hw(yy)) + " " + f1(yy);
    return s + "L" + x0 + " " + B + "Z";
  }
  o += HOT("Gingiva: a core of connective tissue covered by epithelium. Its fibers run perpendicular to the tooth and insert into the cementum (12 groups in all).", '<path class="gum" d="' + ging(-1, 10) + '"/><path class="gum" d="' + ging(1, 300) + '"/>');
  /* gingival (dentogingival) fibers: from the cementum between the CEJ and the crest, fanning into the gingiva */
  var gf = "";
  for (i = 0; i < 4; i++) { y = cej + 3 + i * 5.5; var a2 = hw(y); gf += "M" + f1(tx - a2) + " " + f1(y) + "L" + f1(tx - a2 - 30) + " " + f1(y - 10 + i * 4) + "M" + f1(tx + a2) + " " + f1(y) + "L" + f1(tx + a2 + 30) + " " + f1(y - 10 + i * 4); }
  o += '<path class="fib" d="' + gf + '"' + op("fibers") + "/>";
  /* junctional epithelium: a wedge on the enamel from the bottom of the sulcus down to the CEJ */
  function je(sg) { return "M" + f1(tx + sg * hw(jeT)) + " " + f1(jeT) + "L" + f1(tx + sg * (hw(jeT) + 7)) + " " + f1(jeT) + "L" + f1(tx + sg * (hw(cej) + 1.5)) + " " + f1(cej) + "L" + f1(tx + sg * hw(cej)) + " " + f1(cej) + "Z"; }
  o += HOT("Junctional epithelium: about 1 mm (0.97 mm on average), attached to the enamel by hemidesmosomes along its whole length; it comes from the reduced enamel epithelium. Its lower end is at the CEJ.", '<path class="epi" d="' + je(-1) + je(1) + '"' + op("epi") + "/>");
  /* ---- the implant ---- */
  var abB = 38, abT = 46, cm = gmI - 6;
  o += HOT("Implant body: titanium, threaded, in direct contact with bone. No PDL and no cementum, so no fibers can insert.", SCREW(ix, B, 88, 396 - B, 8));
  o += HOT("Abutment: titanium, from the implant platform through the mucosa. The mucosa's barrier epithelium and connective tissue lie on it.", '<path class="ti-hi" d="M' + (ix - abB) + " " + B + "L" + (ix + abB) + " " + B + "L" + (ix + abT) + " " + f1(cm) + "L" + (ix - abT) + " " + f1(cm) + 'Z"/>');
  o += HOT("Implant crown on the abutment, its margin at the mucosa.", '<path class="crown" d="M' + (ix - abT) + " " + f1(cm) + "L" + (ix - 52) + " 132Q" + (ix - 52) + " 98 " + (ix - 30) + " 96Q" + ix + " 88 " + (ix + 30) + " 96Q" + (ix + 52) + " 98 " + (ix + 52) + " 132L" + (ix + abT) + " " + f1(cm) + 'Z"/>');
  function abX(yy) { return abB + (abT - abB) * (B - yy) / (B - cm); }
  function muc(sg, x0) {
    var s = "M" + x0 + " " + f1(gmI + 6) + "Q" + f1(ix + sg * (abX(gmI) + 30)) + " " + f1(gmI + 4) + " " + f1(ix + sg * (abX(gmI) + 5)) + " " + f1(gmI - 1);
    s += "Q" + f1(ix + sg * (abX(gmI) + 2)) + " " + f1(gmI + 2) + " " + f1(ix + sg * (abX(jeI) + 1.5)) + " " + f1(jeI);
    for (var yy = jeI + 4; yy <= B; yy += 4) s += "L" + f1(ix + sg * abX(yy)) + " " + f1(yy);
    return s + "L" + x0 + " " + B + "Z";
  }
  o += HOT("Peri-implant mucosa: a core of connective tissue covered by epithelium, about 3-4 mm tall in health.", '<path class="gum" d="' + muc(-1, 340) + '"/><path class="gum" d="' + muc(1, 630) + '"/>');
  /* parallel fibers along the abutment, and circular fibers cut across (dots) a little farther out */
  var pf = "", cf = "";
  [-1, 1].forEach(function (sg) {
    [4, 8].forEach(function (d) { pf += "M" + f1(ix + sg * (abX(B - 2) + d)) + " " + (B - 2) + "L" + f1(ix + sg * (abX(ctI + 2) + d)) + " " + f1(ctI + 2); });
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) cf += '<circle cx="' + f1(ix + sg * (abX(B) + 13 + c * 7 + (r % 2) * 3)) + '" cy="' + f1(B - 5 - r * 6.5) + '" r="1.5"/>';
  });
  o += HOT("Connective tissue zone, about 1 mm: fibers run parallel to the abutment and circular around it (here cut across, so they show as dots). None insert into the titanium, so the seal is weaker than a tooth's. More collagen, fewer fibroblasts.", '<g' + op("fibers") + '><path class="fib" d="' + pf + '"/><g fill="var(--im-fiber)">' + cf + "</g></g>");
  /* barrier (junctional) epithelium on the titanium, from the sulcus down to the connective tissue zone */
  function be(sg) { return "M" + f1(ix + sg * abX(jeI)) + " " + f1(jeI) + "L" + f1(ix + sg * (abX(jeI) + 7)) + " " + f1(jeI) + "L" + f1(ix + sg * (abX(ctI) + 1.5)) + " " + f1(ctI) + "L" + f1(ix + sg * abX(ctI)) + " " + f1(ctI) + "Z"; }
  o += HOT("Barrier epithelium, like the junctional epithelium of gingiva but longer: about 1.88 mm, attached to the titanium by hemidesmosomes only in its apical third, and coming from the adjacent oral epithelium. The L8 notes give 1.5-2 mm. A long epithelium breaks down more easily over time.", '<path class="epi" d="' + be(-1) + be(1) + '"' + op("epi") + "/>");
  /* ---- labels ---- */
  o += T(tx, 28, "Tooth", "b", "middle") + T(ix, 28, "Implant", "b", "middle");
  o += L(228, 62, "fibers insert into cementum", tx + hw(cej + 8) + 22, cej + 4, "start");
  o += L(412, 130, "parallel + circular,", ix - abX(B - 8) - 20, B - 8, "end") + T(412, 145, "none insert", "", "end");
  o += L(64, B + 64, "PDL", tx - hw(B + 60) - 3, B + 58, "end");
  o += L(560, B + 48, "bone on", ix + 47, B + 40, "start") + T(560, B + 63, "titanium,", "", "start") + T(560, B + 78, "no PDL", "", "start");
  if (st.bw) {
    /* each side's layers, to scale */
    function stack(x, sg, ys, labs) { var s = "", k; for (k = 0; k < ys.length - 1; k++) { s += '<path class="dim" d="M' + f1(x) + " " + f1(ys[k] + 1) + "L" + f1(x) + " " + f1(ys[k + 1] - 1) + "M" + f1(x - 3) + " " + f1(ys[k] + 1) + "h6M" + f1(x - 3) + " " + f1(ys[k + 1] - 1) + 'h6"/>'; if (labs[k]) s += T(x + sg * 6, (ys[k] + ys[k + 1]) / 2 + 4 + (labs[k][1] || 0), labs[k][0], "hot-t s", sg > 0 ? "start" : "end"); } return s; }
    o += stack(98, -1, [gmT, jeT, cej, B], [["sulcus 0.69", -9], ["JE 0.97"], ["CT 1.07", 2]]);
    o += stack(538, 1, [gmI, jeI, ctI, B], [["sulcus 0.16", -9], ["JE 1.88"], ["CT 1.05", 2]]);
    o += DIM(288, jeT, 288, B, "2.04", 282, B - 26, "end") + T(282, B - 12, "mm", "hot-t s", "end");
    o += DIM(352, gmI, 352, B, "3.08", 358, B - 40, "start") + T(358, B - 26, "mm", "hot-t s", "start");
  }
  return o;
}
function atSay(st) {
  var s = {
    none: "Tooth and implant side by side, soft tissue layers to scale. Around the tooth the fibers insert into the cementum; around the implant they run parallel and circular, and none insert. Biologic width averages 2.04 mm at a tooth (junctional epithelium plus connective tissue) and 3.08 mm at a healthy implant (including its sulcus): about 1 mm more.",
    fibers: "Fibers: the tooth has a PDL whose fibers insert into cementum and bone, and gingival fibers (12 groups) perpendicular to the tooth, inserting into the cementum. The implant has no PDL and no cementum: 2 groups of fibers, parallel and circular to the abutment, none inserting, so the seal is weaker.",
    epi: "Epithelium: a tooth's junctional epithelium is about 1 mm, on the enamel, with hemidesmosomes along its whole length. The implant's barrier epithelium is longer (about 1.5-2 mm), on the titanium, with hemidesmosomes only in its apical third, above about 1 mm of connective tissue; that long epithelium breaks down more easily.",
    bone: "Bone: the tooth hangs in its socket from the PDL, so it can move a little. The implant is held by ankylosis (osseointegration), bone directly on titanium: rigid, no orthodontic movement, and no mechanoreceptors, so a patient can't feel overload the way a tooth does."
  }[st.hl];
  return [s, st.bw ? "2.04 vs 3.08 mm" : st.hl === "none" ? "tooth vs implant" : st.hl];
}
export function attach() {
  return makeFig({ id: "attach", lec: "intro", fig: "Fig 1", short: "Tooth vs implant", hint: "pick a layer · hover a part",
    title: "Periodontal vs peri-implant attachment",
    caption: "A tooth and an implant in section: what holds each one, where the fibers run and how tall each soft tissue layer is (to scale). Pick a layer and show the biologic width.",
    W: 640, H: 400, label: "Section of a tooth and an implant side by side, with bone, gingiva, fibers, epithelium and biologic width.",
    D: { MM, BONE, INIT: { hl: "none", bw: true } }, render: atRender, say: atSay, helpers: [atToothHw],
    controls: `<div class="am-controls" role="group" aria-label="Layer"><button type="button" class="am-btn" data-amk="hl" data-amv="none">Everything</button><button type="button" class="am-btn" data-amk="hl" data-amv="fibers">Fibers</button><button type="button" class="am-btn" data-amk="hl" data-amv="epi">Epithelium</button><button type="button" class="am-btn" data-amk="hl" data-amv="bone">Bone</button><button type="button" class="am-btn" data-amt="bw">Biologic width</button></div>`,
    sources: ["From the L2 notes (Dr. Chavali): the periodontal vs peri-implant table (junctional epithelium on enamel vs titanium, hemidesmosomes, 12 fiber groups inserting vs 2 groups, parallel and circular, none inserting; PDL vs osseointegration); biologic width 2.04 mm at a tooth and 3.08 mm, including the sulcus, at a healthy implant. From the L8 notes (Dr. Geisinger): the barrier epithelium about 1.5-2 mm, the connective tissue zone about 1-1.5 mm, mucosa about 3-4 mm tall.",
      "The layers are drawn to one scale (22 px per mm) from the averages behind those two numbers: at the tooth, sulcus 0.69, junctional epithelium 0.97 and connective tissue 1.07 mm (Gargiulo, Wentz and Orban, J Periodontol 1961); at the implant, sulcus 0.16, junctional epithelium 1.88 and connective tissue 1.05 mm (Cochran et al., J Periodontol 1997). The crown, root, pulp, implant and PDL widths are schematic, and the tooth's root runs on below the drawing."] });
}
