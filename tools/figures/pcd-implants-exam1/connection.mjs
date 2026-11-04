// Fig: connections, platform switching and bone vs tissue level (L4 Terminology, Dr. Chen). External hex (female part
// in the abutment), internal (female part in the implant), conical (tapered surfaces, slope against slope, less
// microgap). Platform switching makes the abutment narrower than the implant, moving the microgap inward, away from the
// crestal bone. A tissue-level collar puts the microgap above the bone. The crestal bone response is qualitative, as the
// notes give it ("potentially less bone loss"); shapes are schematic.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

function coRender(st, D) {
  var o = "", cx = 320, B = 230, iw = 120, tl = st.lvl === "tissue", P = tl ? B - 26 : B, ps = st.ps, aw = ps ? 84 : iw, k = st.conn;
  /* bone loss near the microgap: more when the gap sits at the bone edge */
  var gapX = ps ? aw / 2 : iw / 2, risk = (tl ? 0 : 1) * (ps ? 0.45 : 1) * (k === "con" ? 0.55 : 1), dip = 26 * risk;
  var bd = "M10 " + B + "L" + f1(cx - iw / 2 - 50) + " " + B + "Q" + f1(cx - iw / 2 - 12) + " " + f1(B + dip * 0.4) + " " + f1(cx - iw / 2) + " " + f1(B + dip) + "L" + f1(cx + iw / 2) + " " + f1(B + dip) + "Q" + f1(cx + iw / 2 + 12) + " " + f1(B + dip * 0.4) + " " + f1(cx + iw / 2 + 50) + " " + B + "L630 " + B + "V380H10Z";
  o += HOT("Crestal bone. Micromovement and bacteria at the implant-abutment junction (the microgap) cost crestal bone; moving the gap away from the bone preserves bone height.", '<path class="cort" d="' + bd + '"/>');
  o += '<path class="gum" d="M10 ' + (B - 70) + "H" + f1(cx - aw / 2 - 2) + "V" + f1(P) + "H" + f1(cx + aw / 2 + 2) + "V" + (B - 70) + "H630V" + B + "L" + f1(cx + iw / 2 + 50) + " " + B + "Q" + f1(cx + iw / 2 + 12) + " " + f1(B + dip * 0.4) + " " + f1(cx + iw / 2) + " " + f1(B + dip) + "V" + f1(P) + "H" + f1(cx - iw / 2) + "V" + f1(B + dip) + "Q" + f1(cx - iw / 2 - 12) + " " + f1(B + dip * 0.4) + " " + f1(cx - iw / 2 - 50) + " " + B + 'H10Z"/>';
  o += HOT(tl ? "Tissue-level implant: a smooth, polished collar sits above the bone, in the soft tissue; the rough surface below is covered by bone." : "Bone-level implant: the platform sits at the bone, which leaves more room to contour the emergence profile.", SCREW(cx, P, iw, 380 - P, 14) + (tl ? '<path class="ti-hi" d="M' + f1(cx - iw / 2) + " " + B + "L" + f1(cx - iw / 2 - 6) + " " + f1(P) + "H" + f1(cx + iw / 2 + 6) + "L" + f1(cx + iw / 2) + " " + B + 'Z"/>' : ""));
  /* the implant's internal thread bore, which the abutment screw goes into */
  var bore = k === "ext" ? P : k === "int" ? P + 34 : P + 50;
  o += '<path d="M' + (cx - 7) + " " + f1(bore) + "V" + f1(P + 96) + "H" + (cx + 7) + "V" + f1(bore) + 'Z" fill="var(--anatomy-shade-0)" stroke="var(--im-ti-line)" stroke-width=".8"/>';
  /* the connection: where the female part is */
  if (k === "int") o += HOT("Internal connection: the female part is in the implant. More force on the implant itself, less microgap under force. Every implant used at the school is internal.", '<path d="M' + (cx - 30) + " " + f1(P) + "V" + f1(P + 34) + "H" + (cx + 30) + "V" + f1(P) + 'Z" fill="var(--anatomy-shade-0)" stroke="var(--im-ti-line)"/>');
  else if (k === "con") o += HOT("Conical connection: a kind of internal connection where the abutment's tapered surface meets the implant's, slope against slope (Morse taper). Less microgap, so less marginal bone loss and fewer prosthetic complications; survival about the same as internal non-conical.", '<path d="M' + (cx - 36) + " " + f1(P) + "L" + (cx - 16) + " " + f1(P + 50) + "H" + (cx + 16) + "L" + (cx + 36) + " " + f1(P) + 'Z" fill="var(--anatomy-shade-0)" stroke="var(--im-ti-line)"/>');
  /* abutment, with its male part for internal and conical */
  var top = B - 120, ab = "M" + f1(cx - aw / 2) + " " + f1(P) + "L" + f1(cx - aw / 2 - 6) + " " + top + "L" + f1(cx + aw / 2 + 6) + " " + top + "L" + f1(cx + aw / 2) + " " + f1(P) + "Z";
  if (k === "int") ab += "M" + (cx - 28) + " " + f1(P) + "V" + f1(P + 32) + "H" + (cx + 28) + "V" + f1(P) + "Z";
  if (k === "con") ab += "M" + (cx - 34) + " " + f1(P) + "L" + (cx - 15) + " " + f1(P + 48) + "H" + (cx + 15) + "L" + (cx + 34) + " " + f1(P) + "Z";
  o += HOT(ps ? "Platform switching: the abutment is narrower than the implant, so the junction moves inward and the soft tissue gains volume." : "Abutment as wide as the implant: the junction sits at the outer edge of the platform.", '<path class="ti-hi" d="' + ab + '"/>');
  /* external: the implant's hex stands up into a recess in the abutment */
  if (k === "ext") o += HOT("External connection: the implant has a hex sticking up and the female part is in the abutment. More force on the abutment and screw, so screws loosen more; more tolerant of divergent implants when splinted.", '<path class="ti" d="M' + (cx - 30) + " " + f1(P + 1) + "V" + f1(P - 14) + "H" + (cx + 30) + "V" + f1(P + 1) + 'Z"/>') + L(470, P - 24, "the implant's hex", cx + 28, P - 8, "start");
  /* the abutment screw: head on the abutment's inner seat, shank down into the implant's threads */
  var seat = k === "ext" ? P - 40 : P - 30, th = "";
  for (var ty = P + 56; ty < P + 92; ty += 6) th += "M" + (cx - 7) + " " + ty + "l14 3";
  o += '<path d="M' + (cx - 11) + " " + top + "V" + f1(seat - 12) + "H" + (cx + 11) + "V" + top + 'Z" fill="var(--anatomy-shade-0)" stroke="var(--im-ti-line)" stroke-width=".8"/>';
  o += HOT("Abutment screw: it runs down through the abutment and threads into the implant, clamping the two together. In an external connection more of the force falls on it, so it loosens more.", '<path class="ti" d="M' + (cx - 10) + " " + f1(seat - 12) + "H" + (cx + 10) + "V" + f1(seat) + "H" + (cx + 5) + "V" + f1(P + 92) + "H" + (cx - 5) + "V" + f1(seat) + "H" + (cx - 10) + 'Z"/><path d="' + th + '" stroke="var(--im-ti-line)" stroke-width="1"/>') + L(470, top + 30, "abutment screw", cx + 10, seat - 8, "start");
  /* microgap markers */
  [-1, 1].forEach(function (s) { o += '<circle cx="' + f1(cx + s * gapX) + '" cy="' + f1(P) + '" r="' + (k === "con" ? 4 : 6) + '" fill="none" stroke="var(--im-bad)" stroke-width="2"/>'; });
  o += L(500, P + 40, "microgap", cx + gapX + 4, P + 2, "start", "bad");
  o += L(150, B + 46, "crestal bone", cx - iw / 2 - 30, B + dip * 0.3 + 4, "end");
  return o;
}
function coSay(st) {
  var k = st.conn, s = { ext: "External: the implant's hex sticks up into the abutment. More force on the abutment and screw (screws loosen more), more tolerance of divergent implants when splinted.", int: "Internal: the abutment fits into the implant. More force on the implant, less microgap under force. All school implants are internal.", con: "Conical (internal): tapered surfaces, slope against slope. Less microgap, so less marginal bone loss and fewer prosthetic complications; survival about the same as internal non-conical." }[k];
  s += st.ps ? " Platform switching moves the microgap inward, away from the crestal bone." : "";
  s += st.lvl === "tissue" ? " Tissue level: the microgap sits above the bone (potentially less bone loss), but the collar takes about 1 mm, leaving about 2 mm to shape the emergence instead of 3." : " Bone level: more room to contour the emergence profile, potentially better esthetics.";
  return [s, (k === "ext" ? "external" : k === "int" ? "internal" : "conical") + (st.ps ? " · switched" : "") + " · " + st.lvl + " level"];
}
export function connection() {
  return makeFig({ id: "connection", lec: "terms", fig: "Fig 3", short: "Connections", hint: "pick a connection · toggle",
    title: "Connections, platform switching and the microgap",
    caption: "Where the implant meets the abutment, and why it matters to the bone. Compare external, internal and conical, switch the platform, and lift it to tissue level.",
    W: 640, H: 380, label: "An implant and abutment in section at the bone, showing the connection, the microgap and the crestal bone.",
    D: { INIT: { conn: "int", ps: false, lvl: "bone" } }, render: coRender, say: coSay,
    controls: `<div class="am-controls" role="group" aria-label="Connection"><button type="button" class="am-btn" data-amk="conn" data-amv="ext">External hex</button><button type="button" class="am-btn" data-amk="conn" data-amv="int">Internal</button><button type="button" class="am-btn" data-amk="conn" data-amv="con">Conical</button><button type="button" class="am-btn" data-amt="ps">Platform switching</button></div>
<div class="am-controls" role="group" aria-label="Level"><button type="button" class="am-btn" data-amk="lvl" data-amv="bone">Bone level</button><button type="button" class="am-btn" data-amk="lvl" data-amv="tissue">Tissue level</button></div>`,
    sources: ["From the L4 notes (Dr. Chen): external vs internal (where the female part is, force on the screw vs the implant, divergence when splinted, microgap); conical connection (slope against slope, less microgap and marginal bone loss, same survival); platform switching (narrower abutment, microgap inward, more soft tissue volume); tissue level vs bone level (about 1 mm collar, 2 vs 3 mm to shape the emergence).", "The bone change near the microgap is drawn only to show which way each choice pushes it ('potentially less bone loss'); the lecture gave no millimeters for it. Shapes are schematic."] });
}
