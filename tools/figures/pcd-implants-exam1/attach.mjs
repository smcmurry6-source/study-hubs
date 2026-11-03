// Fig: periodontal vs peri-implant attachment (L2 Introduction, Dr. Chavali; L8 Surgery, Dr. Geisinger). A tooth and
// an implant side by side in section: the tooth's PDL with fibers inserting into cementum, its junctional epithelium
// and connective tissue; the implant's bone directly on titanium (ankylosis), its longer barrier epithelium and
// connective tissue adhesion zone with fibers running parallel and circular, none inserting. Biologic width 2.04 vs
// 3.08 mm, drawn to one scale (22 px per mm). Shapes are schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 22, BONE = 262;
function atRender(st, D) {
  var o = "", hl = st.hl, mm = D.MM, B = D.BONE;
  function op(k) { return hl === "none" || hl === k ? "" : ' opacity=".35"'; }
  /* bone across both, with marrow spaces */
  o += HOT("Alveolar bone. Around the tooth a periodontal ligament separates root and bone; around the implant the bone touches the titanium directly: osseointegration, a functional ankylosis.", '<path class="cort" d="M10 ' + B + 'H630V396H10Z"' + op("bone") + '/><path class="trab" d="M24 ' + (B + 14) + 'H616V396H24Z"' + op("bone") + '/>');
  for (var i = 0; i < 18; i++) o += '<ellipse class="marrow" cx="' + (40 + i * 33) + '" cy="' + (B + 40 + (i % 3) * 30) + '" rx="9" ry="6"' + op("bone") + "/>";
  /* gingiva / mucosa */
  o += HOT("Gingiva around the tooth, peri-implant mucosa around the implant: a core of connective tissue covered by epithelium.", '<path class="gum" d="M10 ' + (B - 70) + 'Q60 ' + (B - 82) + " 120 " + (B - 70) + "L120 " + B + "H10Z" + '"/><path class="gum" d="M200 ' + (B - 70) + "Q260 " + (B - 82) + " 300 " + (B - 70) + "L300 " + B + "H200Z" + '"/><path class="gum" d="M340 ' + (B - 84) + "Q380 " + (B - 92) + " 432 " + (B - 82) + "L432 " + B + "H340Z" + '"/><path class="gum" d="M528 ' + (B - 82) + "Q580 " + (B - 92) + " 630 " + (B - 84) + "L630 " + B + "H528Z" + '"/>');
  /* ---- tooth (x 120-200) ---- */
  var cej = B - 2.04 * mm - 26; /* gingival margin ~26 px above the attachment */
  o += HOT("Tooth root: dentin covered by cementum, which the PDL fibers insert into.", '<path class="dentin" d="M122 ' + (cej + 6) + "L198 " + (cej + 6) + "L188 392L132 392Z" + '"/>');
  o += HOT("Crown: enamel over dentin. The junctional epithelium attaches at the cementoenamel junction.", '<path class="enamel" d="M116 60Q160 40 204 60L200 ' + (cej + 6) + "L120 " + (cej + 6) + 'Z"/>');
  /* PDL with fibers into cementum */
  o += HOT("Periodontal ligament: fibers between cementum and bone, with mechanoreceptors (proprioception). An implant has none.", '<path class="pdl" d="M124 ' + (B + 2) + 'L134 392M196 ' + (B + 2) + 'L186 392"' + op("fibers") + "/>");
  for (var y = B + 10; y < 388; y += 13) { var k = (y - B) / (392 - B), xl = 124 + 10 * k, xr = 196 - 10 * k; o += '<path class="fib" d="M' + f1(xl - 7) + " " + (y + 4) + "L" + f1(xl + 2) + " " + y + "M" + f1(xr + 7) + " " + (y + 4) + "L" + f1(xr - 2) + " " + y + '"' + op("fibers") + "/>"; }
  /* gingival fibers perpendicular into the root, above the bone */
  var jeTop = cej - 4, jeBot = B - 1.0 * mm;
  for (var y2 = jeBot + 4; y2 < B - 2; y2 += 6) o += '<path class="fib" d="M98 ' + y2 + "L121 " + y2 + "M222 " + y2 + "L199 " + y2 + '"' + op("fibers") + "/>";
  o += HOT("Junctional epithelium: attaches to the tooth at the CEJ. Around a tooth the attachment is about 2.04 mm (about 1 mm of epithelium and 1 mm of connective tissue).", '<path class="epi" d="M114 ' + jeTop + "L121 " + jeTop + "L121 " + jeBot + "L114 " + jeBot + "ZM206 " + jeTop + "L199 " + jeTop + "L199 " + jeBot + "L206 " + jeBot + 'Z"' + op("epi") + "/>");
  /* ---- implant (x 432-528) ---- */
  var ix = 480, mTop = B - 3.08 * mm - 10, beBot = B - 1.3 * mm;
  o += HOT("Implant body: titanium, threaded, in direct contact with bone. No PDL and no cementum, so no fibers can insert.", SCREW(ix, B - 2, 70, 392 - B + 2, 10));
  o += HOT("Abutment: connects the implant to the crown and passes through the mucosa.", '<path class="ti-hi" d="M452 ' + (B - 2) + "L508 " + (B - 2) + "L520 " + (mTop - 8) + "L440 " + (mTop - 8) + 'Z"/>');
  o += HOT("Implant crown on the abutment.", '<path class="crown" d="M428 62Q480 42 532 62L524 ' + (mTop - 8) + "L436 " + (mTop - 8) + 'Z"/>');
  /* fibers parallel (lines along the abutment) and circular (ellipses around it) */
  for (var y3 = beBot + 4; y3 < B - 3; y3 += 7) { var w = 44 + (y3 - beBot) * 0.2; o += '<ellipse class="fib" cx="' + ix + '" cy="' + y3 + '" rx="' + f1(w) + '" ry="2.6"' + op("fibers") + "/>"; }
  o += '<path class="fib" d="M427 ' + (beBot + 2) + "L429 " + (B - 2) + "M533 " + (beBot + 2) + "L531 " + (B - 2) + "M420 " + (beBot + 2) + "L421 " + (B - 2) + "M540 " + (beBot + 2) + "L539 " + (B - 2) + '"' + op("fibers") + "/>";
  o += HOT("Sulcular epithelium with a thin barrier epithelium, like the junctional epithelium of gingiva, about 1.5-2 mm. This long epithelium breaks down more easily over time.", '<path class="epi" d="M428 ' + mTop + "L438 " + mTop + "L446 " + beBot + "L436 " + beBot + "ZM532 " + mTop + "L522 " + mTop + "L514 " + beBot + "L524 " + beBot + 'Z"' + op("epi") + "/>");
  /* labels */
  o += T(160, 30, "Tooth", "b", "middle") + T(480, 30, "Implant", "b", "middle");
  o += L(34, B + 52, "PDL", 128, B + 60, "start") + L(12, B - 40, "gingival fibers", 100, B - 12, "start");
  o += L(612, B - 40, "parallel + circular fibers", 534, B - 12, "end");
  o += L(612, B + 52, "bone on titanium", 515, B + 40, "end");
  o += L(232, jeTop - 46, "junctional epithelium", 206, jeTop + 10, "start");
  o += L(612, mTop - 22, "barrier epithelium", 528, mTop + 14, "end");
  if (st.bw) {
    o += DIM(232, B - 2.04 * mm, 232, B, "2.04 mm", 238, B - 2.04 * mm + 14, "start");
    o += DIM(404, B - 3.08 * mm, 404, B, "3.08 mm", 398, B - 3.08 * mm + 6, "end");
    o += T(398, B - 3.08 * mm + 20, "about 1 mm more", "hot-t s", "end");
    o += '<path class="dim" d="M398 ' + f1(beBot) + 'L410 ' + f1(beBot) + '"/>';
  }
  return o;
}
function atSay(st) {
  var s = {
    none: "Tooth and implant side by side. Around the tooth, fibers run from the gingiva and the bone into the cementum. Around the implant the fibers run parallel and circular, and none insert. Biologic width averages 2.04 mm at a tooth and 3.08 mm at a healthy implant.",
    fibers: "Fibers: the tooth has a PDL whose fibers insert into cementum, and gingival fibers that run into the root. The implant has no PDL and no cementum: its fibers run parallel and circular to the abutment, so the seal is weaker.",
    epi: "Epithelium: a tooth's junctional epithelium is about 1 mm. The implant's sulcular and barrier epithelium is longer, about 1.5-2 mm, above a 1-1.5 mm connective tissue adhesion zone; that long epithelium breaks down more easily.",
    bone: "Bone: the implant is held by ankylosis (osseointegration), bone directly on titanium. With no PDL there are no mechanoreceptors, so a patient can't feel overload the way a tooth does."
  }[st.hl];
  return [s, st.bw ? "2.04 vs 3.08 mm" : st.hl === "none" ? "tooth vs implant" : st.hl];
}
export function attach() {
  return makeFig({ id: "attach", lec: "intro", fig: "Fig 1", short: "Tooth vs implant", hint: "pick a layer · hover a part",
    title: "Periodontal vs peri-implant attachment",
    caption: "A tooth and an implant in section: what holds each one, where the fibers run and how long the soft tissue seal is. Pick a layer and show the biologic width.",
    W: 640, H: 400, label: "Section of a tooth and an implant side by side, with bone, gingiva, fibers, epithelium and biologic width.",
    D: { MM, BONE, INIT: { hl: "none", bw: true } }, render: atRender, say: atSay,
    controls: `<div class="am-controls" role="group" aria-label="Layer"><button type="button" class="am-btn" data-amk="hl" data-amv="none">Everything</button><button type="button" class="am-btn" data-amk="hl" data-amv="fibers">Fibers</button><button type="button" class="am-btn" data-amk="hl" data-amv="epi">Epithelium</button><button type="button" class="am-btn" data-amk="hl" data-amv="bone">Bone</button><button type="button" class="am-btn" data-amt="bw">Biologic width</button></div>`,
    sources: ["From the L2 notes (Dr. Chavali): fibers parallel and circular, none inserting; ankylosis, no PDL; biologic width 2.04 mm at a tooth, 3.08 mm at a healthy implant. From the L8 notes (Dr. Geisinger): the barrier epithelium about 1.5-2 mm and the connective tissue adhesion zone about 1-1.5 mm.", "Drawn to one scale (22 px per mm) for the soft tissue heights; the crown, root and implant shapes and the PDL width are schematic."] });
}
