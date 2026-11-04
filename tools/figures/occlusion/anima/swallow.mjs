// Fig: swallowing, stage by stage (Occlusion L3, "Part 2: swallowing"). A midsagittal section of the head and neck,
// patient facing right: the skull base over the nasal cavity (with the middle and inferior conchae), the hard palate
// with the upper incisor, the soft palate and uvula, the tongue (tip behind the lower incisors, base facing the
// oropharynx, root on the hyoid), the mandibular symphysis with the lower incisor, the lips, the pharynx with its
// constrictor wall in front of the cervical spine (C1-C7), the epiglottis and the larynx (thyroid, cricoid and
// arytenoid cartilages), the hyoid, the trachea in front and the esophagus behind. Step through the three stages as the
// notes give them: stage 1, the tongue presses the bolus against the palate front to back, tip behind the incisors, lips
// sealed and teeth closed; stage 2, the soft palate rises against the posterior pharyngeal wall, the hyoid and larynx
// rise and move forward, the epiglottis folds over the laryngeal inlet, the Eustachian tube openings open and the
// constrictors carry the bolus into the esophagus; stage 3, down the esophagus. A toggle swaps the adult somatic swallow
// (teeth together in MIP, the elevators holding the mandible) for the visceral (infantile) swallow (teeth apart, tongue
// forward between the arches to brace the mandible), which, if over-retained, displaces the teeth anteriorly, e.g. an
// anterior open bite. Numbers are only the notes' own (about 66.5 lb for about 683 ms, 590 swallows a day, stages
// 1 + 2 about a second, stage 3 6-7 s). About 2.3 px per mm; the shapes are drawn for clarity, not traced from imaging.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 420, H = 430;
const D = {
  W, H,
  /* tongue outline: 0 tip, 1-6 the domed dorsum front to back, 7-10 base (facing the oropharynx) down to the
     vallecula, 11 root on the hyoid, 12-13 floor of the mouth, 14 genial tubercle (where the genioglossus fans out
     from), 15 the underside over the floor of the mouth, 16 under the tip.
     REST: the bolus in a groove on the dorsum; UP: pressed against the palate front to back, tip on the ridge behind
     the upper incisors, base thrust back (end of stage 1); HOLD: held up and back while the bolus passes (stage 2);
     RELAX: back down (stage 3) */
  T_REST: [[356, 199], [349, 186], [335, 176], [314, 170], [292, 170.5], [268, 169], [250, 172], [236, 181], [227, 198], [224, 222], [227, 248], [244, 280], [284, 283], [320, 270], [338, 247], [333, 226], [345, 209]],
  T_UP: [[355, 184], [349, 170], [334, 161], [314, 159.5], [292, 159.5], [268, 159.5], [250, 160], [234, 166], [222, 184], [216, 208], [217, 240], [244, 280], [284, 283], [320, 270], [338, 247], [333, 226], [347, 197]],
  T_HOLD: [[355, 184], [349, 170], [334, 161], [314, 159.5], [292, 159.5], [268, 159.5], [250, 160], [232, 166], [219, 184], [212, 208], [213, 240], [244, 280], [284, 283], [320, 270], [338, 247], [333, 226], [347, 197]],
  T_RELAX: [[356, 199], [349, 186], [335, 175], [314, 169], [292, 168.5], [268, 168.5], [250, 172], [236, 181], [227, 198], [224, 222], [227, 248], [244, 280], [284, 283], [320, 270], [338, 247], [333, 226], [345, 209]],
  /* the visceral swallow: teeth apart (jaw down 12 px, about 5 mm), tongue tip forward between the incisors
     ([point, x, y] for the tip, the dorsum behind it and the underside of the tip) */
  TIPV: [[0, 378, 199], [1, 366, 190], [16, 368, 207]], JAWV: 12,
  /* soft palate: hangs from the posterior nasal spine at rest; in stage 2 rises and seals against the posterior wall */
  VELUM: [[[238, 149], [226, 152], [214, 162], [206, 176], [202, 190], [207, 195], [213, 188], [221, 174], [231, 163], [241, 158]],
    [[238, 149], [224, 146], [207, 142], [191, 140], [183.5, 145], [186, 152], [202, 155], [218, 157], [230, 158], [241, 158]]],
  /* epiglottis, in the larynx's frame: upright behind the tongue base at rest, folded back over the inlet in stage 2 */
  EPI: [[[238, 305], [230, 287], [222, 268], [214, 252], [209.5, 240], [205.5, 243], [210, 256], [218, 272], [226, 290], [233, 306]],
    [[238, 305], [232, 293], [224, 285], [212, 281], [199, 283], [198, 288], [212, 287], [223, 291], [229, 298], [233, 306]]],
  HYOID: [[252, 289], [262, 277]], LIFT: [8, -14],
  /* bolus path: back along the dorsum and into the oropharynx (stage 1), past the epiglottis into the esophagus
     (stage 2), down the esophagus (stage 3) */
  BOLUS: [[[292, 164.5], [266, 164.5], [240, 168], [216, 184], [197, 204]], [[196, 204], [192, 236], [190, 268], [190, 300], [190, 332], [189, 356]], [[189, 356], [189, 392], [189, 446]]],
  STAGES: [
    "Ready: the food is chewed and the bolus is on the tongue. The not-necessarily-conscious decision to swallow depends on the fineness of the food, the intensity of taste extracted and the lubrication of the bolus.",
    "Stage 1 (voluntary): the tongue separates the food and presses the bolus lightly against the palate, tongue tip behind the incisors; lips sealed, teeth closed; a reflex wave pushes the bolus back into the pharynx.",
    "Stage 2: pharyngeal constrictor peristalsis carries the bolus to the esophagus. The soft palate rises and seals the nasal passage, the epiglottis closes over the trachea, and the Eustachian tube openings open (normally closed). Stages 1 + 2 take about a second.",
    "Stage 3: peristalsis carries the bolus down the esophagus to the cardiac sphincter, which relaxes into the stomach: 6-7 seconds. The upper esophagus has some voluntary control, to return food for more chewing.",
  ],
};

function swLerp(A, B, u) { return A.map(function (p, i) { return [p[0] + (B[i][0] - p[0]) * u, p[1] + (B[i][1] - p[1]) * u]; }); }
/* where things are at stage position s (0..3) */
function swState(s, visceral, D) {
  function ss(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function along(path, u) { var n = path.length - 1, i = Math.min(n - 1, Math.floor(u * n)), f = u * n - i; return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]; }
  var b = D.BOLUS, seg = Math.min(2, Math.floor(s)), bolus = s >= 3 ? null : along(b[seg], s - seg);
  var tongue;
  if (s <= 1) {
    /* stage 1 is a wave: the front of the tongue rises to the palate first and the dorsum follows the bolus back */
    var g = ss(s / 0.25), bx = bolus ? bolus[0] : 0, R = D.T_REST, U = D.T_UP;
    tongue = R.map(function (p, i) {
      var q = i === 16 ? R[0] : p, w = i <= 6 || i === 16 ? Math.min(g, ss((q[0] - bx - 2) / 14)) : i <= 10 ? ss((s - 0.55) / 0.45) : 0;
      return [p[0] + (U[i][0] - p[0]) * w, p[1] + (U[i][1] - p[1]) * w];
    });
  } else if (s <= 2) tongue = swLerp(D.T_UP, D.T_HOLD, ss((s - 1) / 0.3));
  else tongue = swLerp(D.T_HOLD, D.T_RELAX, ss((s - 2) / 0.7));
  /* the jaw: teeth together in the somatic swallow; apart, tongue forward, in the visceral swallow (until it relaxes) */
  var wv = visceral ? (s < 2.3 ? 1 : 1 - ss((s - 2.3) / 0.5)) : 0, jaw = D.JAWV * wv;
  tongue = tongue.map(function (p, i) { return i >= 14 ? [p[0], p[1] + jaw] : i === 13 ? [p[0], p[1] + jaw / 2] : p; });
  if (wv > 0) D.TIPV.forEach(function (t) { var p = tongue[t[0]]; tongue[t[0]] = [p[0] + (t[1] - p[0]) * wv, p[1] + (t[2] - p[1]) * wv]; });
  /* the soft palate starts rising late in stage 1, up through stage 2, back down in stage 3 */
  var v = s < 0.6 ? 0 : s < 1.2 ? ss((s - 0.6) / 0.6) : s < 2.2 ? 1 : 1 - ss((s - 2.2) / 0.6);
  /* hyoid and larynx rise and come forward, and the epiglottis folds down, as the bolus reaches the pharynx */
  var e = s < 0.9 ? 0 : s < 1.3 ? ss((s - 0.9) / 0.4) : s < 2 ? 1 : 1 - ss((s - 2) / 0.45);
  /* the tongue's root sits on the hyoid and rises with it */
  var lx = D.LIFT[0] * e, ly = D.LIFT[1] * e;
  tongue = tongue.map(function (p, i) { var k = i === 11 ? 1 : i === 12 || i === 10 ? 0.5 : 0; return k ? [p[0] + lx * k, p[1] + ly * k] : p; });
  return { tongue: tongue, velum: swLerp(D.VELUM[0], D.VELUM[1], v), epi: swLerp(D.EPI[0], D.EPI[1], e), hy: e, open: e > 0.5, bolus: bolus, jaw: jaw };
}

function swSvg(s, visceral, D) {
  var S = swState(s, visceral, D), f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function C(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function O(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n - 1; i++) { var p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < n ? i + 2 : i + 1];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d; }
  function mv(pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }
  function tx(x, y, t, cls, a) { return '<text class="sw-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function lab(t, x, y, px, py, a, k) { var lx = a === "end" ? x + 3 : a === "start" ? x - 3 : x, ly = a === "middle" ? y + 4 : y - 4;
    return '<path class="sw-lead" d="M' + f(lx) + " " + f(ly) + "L" + f(px) + " " + f(py) + '"/><circle class="sw-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, k || "", a); }
  function hot(info, inner) { return '<g class="hot" data-info="' + info + '">' + inner + "</g>"; }
  var hy = S.hy, L = [D.LIFT[0] * hy, D.LIFT[1] * hy], jaw = S.jaw;
  /* soft tissue of the head and neck, with the face in profile */
  o += '<path class="sw-skin" d="M104 0L356 0' + O([[356, 0], [366, 22], [372, 44], [368, 60], [384, 84], [399, 102], [410, 114], [404, 124], [390, 130], [393, 141], [397, 152], [392, 168 + jaw / 2], [396, 180 + jaw], [392, 195 + jaw], [383, 206 + jaw], [390, 226 + jaw], [392, 240 + jaw], [380, 260 + jaw], [350, 272 + jaw], [318, 278], [298, 287], [292, 322], [290, 380], [290, 430]]).replace(/^M[^C]*/, "") + "L104 430" + O([[104, 430], [98, 300], [98, 120], [104, 0]]).replace(/^M[^C]*/, "") + 'Z"/>';
  /* skull base (frontal and nasal bones, sphenoid, clivus) over the cranial cavity */
  o += '<path class="sw-brain" d="M106 0L352 0L360 30L362 48L340 47L300 45L262 47L236 55L212 65L194 77L176 90L158 100L138 106L104 104Z"/>';
  o += '<path class="sw-bone" d="M352 0L358 0' + O([[358, 0], [366, 24], [368, 50], [372, 64], [380, 78]]).replace(/^M[^C]*/, "") + O([[380, 78], [366, 71], [340, 67], [300, 65], [262, 67], [240, 75], [222, 85], [204, 97], [190, 109], [174, 118], [156, 123], [134, 120], [104, 116]]).replace(/^M[^C]*/, "") + "L104 104" + O([[104, 104], [138, 106], [158, 100], [176, 90], [194, 77], [212, 65], [236, 55], [262, 47], [300, 45], [340, 47], [362, 48], [360, 30], [352, 0]]).replace(/^M[^C]*/, "") + 'Z"/>';
  /* air: nasal cavity, nasopharynx, oral cavity, oropharynx and laryngopharynx (the structures are drawn over it) */
  o += '<path class="sw-air" d="' + C([[396, 126], [388, 110], [377, 89], [368, 72], [340, 68], [300, 66], [262, 68], [240, 76], [222, 86], [204, 98], [190, 110], [183, 123], [182, 160], [182, 210], [182, 260], [182, 310], [182, 352], [210, 352], [210.5, 304], [212, 300], [234, 297], [241, 286], [240, 262], [235, 232], [230, 206], [234, 190], [252, 182], [300, 182], [340, 184], [352, 190], [356, 177], [354, 166], [340, 161], [300, 160], [241, 160], [238, 150], [300, 148], [350, 146], [362, 140], [384, 130]]) + '"/>';
  /* nasal conchae on the lateral wall */
  o += '<path class="sw-concha" d="' + C([[352, 96], [336, 90], [312, 89], [294, 94], [292, 101], [310, 100], [334, 101], [350, 103]]) + '"/>';
  o += '<path class="sw-concha" d="' + C([[358, 116], [340, 109], [310, 108], [286, 113], [282, 121], [300, 123], [330, 123], [354, 124]]) + '"/>';
  /* cervical spine: the anterior arch of C1, C2 with the dens, C3-C7 */
  o += '<ellipse class="sw-bone" cx="146" cy="136" rx="9" ry="7"/>';
  o += '<path class="sw-bone" d="M122 152L124 132Q130 124 136 132L138 152Q150 150 156 154L156 200Q156 206 150 206L124 206Q118 206 118 200L118 158Q118 153 122 152Z"/>';
  for (var vb = 0; vb < 5; vb++) { var vy = 216 + vb * 42; o += '<rect class="sw-bone" x="118" y="' + vy + '" width="38" height="32" rx="5"/>'; }
  /* pharyngeal constrictor wall, continuing as the esophagus below the larynx (collapsed, opening around the bolus) */
  o += '<path class="sw-wall hot" data-info="Pharynx: its constrictor muscles squeeze the bolus down in a peristaltic wave (stage 2); below the larynx it continues as the esophagus." d="M190 108' + O([[190, 108], [175, 120], [174, 200], [173, 300], [174, 360], [174, 430]]).replace(/^M[^C]*/, "") + "L182 430L182 352" + O([[182, 352], [182, 300], [182, 210], [183, 123], [196, 104]]).replace(/^M[^C]*/, "") + 'Z"/>';
  var bE = S.bolus && S.bolus[1] > 340 ? S.bolus : null;
  o += '<path class="sw-wall hot" data-info="Esophagus: behind the trachea, a collapsed muscular tube that opens around the bolus; peristalsis carries it to the stomach in 6-7 s (stage 3)." d="M196 352L196 430L205 430L205 356Z"/>';
  o += '<path class="sw-lumen" d="M189 354L189 ' + (bE ? f(bE[1] - 9) + "M189 " + f(bE[1] + 9) + "L189 430" : "430") + '"/>';
  /* hyoid and larynx: they rise and come forward together in stage 2 */
  var H0 = D.HYOID, hp = [H0[0][0] + (H0[1][0] - H0[0][0]) * hy, H0[0][1] + (H0[1][1] - H0[0][1]) * hy];
  o += '<g transform="translate(' + f(L[0]) + " " + f(L[1]) + ')">';
  o += '<path class="sw-air" d="M212 302L238 300L238 356L238 450L206 450L206 356L212 330Z"/>';
  o += '<path class="sw-cart hot" data-info="Larynx: the thyroid cartilage in front, the cricoid ring below it and the arytenoids behind; it rises under the epiglottis in stage 2." d="M241 296L249 300L249 336L243 341L240 336L241 302Z"/>';
  o += '<path class="sw-cart" d="M240 344L246 345L246 355L238 356Z"/><path class="sw-cart" d="M204 300L212 304L213 318L215 354L205 356Z"/>';
  for (var r = 0; r < 7; r++) o += '<ellipse class="sw-cart" cx="240" cy="' + (364 + r * 12) + '" rx="3" ry="4"/>';
  o += '<path class="sw-fold" d="M205 356L205 450"/></g>';
  /* floor of the mouth (geniohyoid): from the genial tubercle to the hyoid */
  o += '<path class="sw-floor" d="' + C([[338, 256 + jaw], [334, 266 + jaw], [300, 280 + jaw / 2], [hp[0] + 4, hp[1] + 7], [hp[0] + 2, hp[1] - 2], [300, 272 + jaw / 2]]) + '"/>';
  /* epiglottis and the aryepiglottic fold, the rim of the laryngeal inlet */
  var EP = mv(S.epi, L[0], L[1]);
  o += '<path class="sw-fold" d="M' + f(EP[7][0]) + " " + f(EP[7][1]) + "Q" + f(206 + L[0]) + " " + f(282 + L[1]) + " " + f(205 + L[0]) + " " + f(301 + L[1]) + '"/>';
  o += '<path class="sw-cart hot" data-info="Epiglottis: closes over the laryngeal inlet in stage 2 so the bolus goes down the esophagus, not the trachea." d="' + C(EP) + '"/>';
  /* lips */
  o += '<path class="sw-lip" d="' + C([[389, 132], [394, 144], [398, 154], [394, 166 + jaw / 2], [384, 171 + jaw / 3], [374, 168], [368, 158], [367, 146], [376, 136]]) + '"/>';
  o += '<path class="sw-lip" d="' + C(mv([[386, 173], [396, 182], [396, 194], [388, 204], [376, 207], [371, 202], [372, 190], [377, 178]], 0, jaw)) + '"/>';
  /* tongue */
  o += '<path class="sw-tongue hot" data-info="The tongue: in stage 1 it presses the bolus against the palate from front to back and thrusts it into the pharynx. In the visceral (infantile) swallow its tip pushes forward between the arches to brace the mandible." d="' + C(S.tongue) + '"/>';
  /* genioglossus fibers fanning from the genial tubercle into the dorsum */
  var T = S.tongue, G0 = [T[14][0] - 9.5, T[14][1] - 5];
  for (var k = 2; k <= 9; k++) o += '<path class="sw-fib" d="M' + f(G0[0] + (T[k][0] - G0[0]) * 0.08) + " " + f(G0[1] + (T[k][1] - G0[1]) * 0.08) + "L" + f(G0[0] + (T[k][0] - G0[0]) * 0.86) + " " + f(G0[1] + (T[k][1] - G0[1]) * 0.86) + '"/>';
  o += '<ellipse class="sw-bone hot" data-info="Hyoid: pulled up and forward in stage 2, lifting the larynx under the epiglottis. Stabilizing the mandible is what lets the hyoid move." cx="' + f(hp[0]) + '" cy="' + f(hp[1]) + '" rx="9" ry="5" transform="rotate(-18 ' + f(hp[0]) + " " + f(hp[1]) + ')"/>';
  /* soft palate and uvula */
  o += '<path class="sw-soft hot" data-info="Soft palate (velum) and uvula: in stage 2 it rises and seals the nasopharynx against the posterior pharyngeal wall." d="' + C(S.velum) + '"/>';
  /* hard palate with the premaxilla, and the upper incisor */
  o += '<path class="sw-bone hot" data-info="Hard palate: the bolus is pressed against it in stage 1." d="' + C([[238, 149], [300, 147], [340, 145], [356, 141], [362, 147], [364, 160], [362, 171], [354, 169], [346, 162], [320, 158], [280, 158], [241, 158]]) + '"/>';
  o += '<path class="sw-tooth" d="' + C([[351, 139], [358, 150], [364, 168], [370, 182], [373.5, 196], [369, 197.5], [362, 187], [357, 175], [355, 165], [349, 151]]) + '"/>';
  /* mandibular symphysis and lower incisor (lowered with the jaw in the visceral swallow) */
  o += '<g transform="translate(0 ' + f(jaw) + ')"><path class="sw-bone" d="' + C([[371, 210], [372, 220], [377, 236], [373, 254], [361, 264], [348, 262], [337, 252], [339, 236], [345, 222], [354, 210]]) + '"/>';
  o += '<path class="sw-tooth" d="' + C([[365, 191], [368, 199], [369.5, 210], [367, 226], [358, 241], [354, 227], [356, 210], [359, 200]]) + '"/></g>';
  /* Eustachian tube opening on the lateral wall of the nasopharynx (torus tubarius around it) */
  o += '<g class="hot" data-info="Eustachian tube opening, on the side wall of the nasopharynx: normally closed, it opens during stage 2."><ellipse class="sw-torus" cx="210" cy="126" rx="10" ry="8"/><ellipse class="sw-et' + (S.open ? " is-open" : "") + '" cx="210" cy="126" rx="4.5" ry="' + (S.open ? 5 : 1.6) + '"/></g>';
  /* bolus */
  if (S.bolus) o += '<circle class="sw-bolus" cx="' + f(S.bolus[0]) + '" cy="' + f(S.bolus[1]) + '" r="6"/>';
  /* labels */
  var vm = [(S.velum[3][0] + S.velum[6][0]) / 2, (S.velum[3][1] + S.velum[6][1]) / 2];
  o += lab("nasal cavity", 316, 32, 316, 80, "middle", "sw-mut");
  o += tx(300, 141, "hard palate", "sw-in", "middle");
  o += lab("Eustachian", 98, 106, 202, 126, "end", S.open ? "sw-key" : "") + tx(98, 121, S.open ? "tube opens" : "tube", S.open ? "sw-key" : "", "end");
  o += lab("soft palate", 98, 168, vm[0], vm[1], "end");
  o += lab("pharynx", 98, 230, 190, 228, "end");
  o += lab("epiglottis", 98, 262, (EP[2][0] + EP[7][0]) / 2, (EP[2][1] + EP[7][1]) / 2, "end");
  o += lab("esophagus", 98, 404, 190, 404, "end");
  o += tx(292, 252, "tongue", "sw-in", "middle");
  o += lab("hyoid", 306, 300, hp[0] + 7, hp[1] + 2, "start");
  o += lab("larynx", 306, 332, 247 + L[0], 322 + L[1], "start");
  o += lab("trachea", 306, 394, 228 + L[0], 394 + L[1], "start");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "sw-svg", label: "Midsagittal section of the head and neck, patient facing right: nasal cavity, hard and soft palate, tongue, incisors and lips, pharynx in front of the cervical spine, epiglottis, hyoid, larynx, trachea in front and esophagus behind, with a bolus on the tongue.", body: swSvg(0, false, D) });
const plate = plateHtml({ fig: "Fig 9", title: "Swallowing", hint: "step through the stages", readout: "ready", body: `<div class="am-svg sw-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>ready</span><input type="range" min="0" max="300" step="1" value="0" aria-label="Swallowing stage, from ready to the end of stage 3"><span>stage 3</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-swstep="-1">Back</button><button type="button" class="am-btn" data-swstep="1">Next stage</button><button type="button" class="am-btn" data-swplay aria-pressed="false">Swallow</button></div>
<div class="am-controls" role="group" aria-label="Swallow type"><button type="button" class="am-btn" data-swmode="s" aria-pressed="true">Somatic (adult)</button><button type="button" class="am-btn" data-swmode="v" aria-pressed="false">Visceral (infantile)</button></div>
<div class="am-stats"><span><b>Force</b> <em>about 66.5 lb for about 683 ms, in ICP (7.8 lb more than chewing)</em></span><span><b>How often</b> <em>about 590 a day: 146 at meals, 394 awake between meals, 50 asleep</em></span><span><b>Timing</b> <em>stages 1 + 2 about 1 s; stage 3 6-7 s</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the tongue, the soft palate, the epiglottis, the hyoid, the larynx, the pharynx or the Eustachian tube opening.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The three stages, the somatic and visceral swallows, and every number are from the L3 notes (Dr. Givan). Swallowing contacts are heavy and long and happen in ICP, not a retruded position as once thought.</li>
<li>The drawing is a schematic midline section: shapes are drawn for clarity, not traced from imaging (swallowing is studied by videofluoroscopic swallowing study, dynamic MRI and, historically, cinefluorography). The timing is slowed so the stages can be followed. The Eustachian tube opening and the conchae are on the side wall, shown as if seen through the midline; in life the bolus passes on either side of the epiglottis, here drawn behind it.</li></ul></details>`;

function swLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sw-svg"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-swplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = 0, tgt = 0, vis = false, frame = 0, last = 0, playing = false;
  function draw() {
    svg.innerHTML = D.swSvg(s, vis, D);
    var k = s <= 0 ? 0 : Math.min(3, Math.ceil(s - 1e-6));
    var t = D.STAGES[k];
    if (vis) t = (k === 1 || k === 0 ? "Visceral (infantile) swallow: instead of the teeth meeting in MIP, the tongue pushes forward between the arches to brace the mandible. Normal until the posterior teeth erupt (and when swallowing liquids); over-retained, it displaces teeth anteriorly, e.g. an anterior open bite. " : "") + t.replace("lips sealed, teeth closed", "here the teeth stay apart with the tongue between them");
    else if (k === 0) t = "Somatic (adult) swallow: the teeth come together in MIP and the elevators hold the mandible there; stabilizing the mandible is what matters most, so the hyoid can move. " + t;
    if (sum.textContent !== t) sum.textContent = t;
    if (readout) readout.textContent = k === 0 ? "ready" : "stage " + k;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) {
    var dt = Math.min(64, now - (last || now)); last = now;
    /* stages 1 + 2 take about a second in life; slowed down here so they can be followed */
    var sp = playing ? (s < 2 ? 0.0006 : 0.0009) : 0.0025;
    s = tgt > s ? Math.min(tgt, s + dt * sp) : Math.max(tgt, s - dt * sp);
    slider.value = Math.round(s * 100); draw();
    if (s !== tgt) frame = requestAnimationFrame(tick); else if (playing) stop();
  }
  function go(to) { tgt = Math.max(0, Math.min(3, to)); cancelAnimationFrame(frame); if (reduce.matches) { s = tgt; slider.value = Math.round(s * 100); draw(); return; } last = 0; frame = requestAnimationFrame(tick); }
  root.querySelectorAll("[data-swstep]").forEach(function (b) { b.addEventListener("click", function () { stop(); var d = +b.getAttribute("data-swstep"); go(d > 0 ? Math.floor(s + 1e-6) + 1 : Math.ceil(s - 1e-6) - 1); }); });
  play.addEventListener("click", function () { if (playing) { stop(); return; } if (s >= 3) { s = 0; } playing = true; play.setAttribute("aria-pressed", "true"); go(3); });
  slider.addEventListener("input", function () { stop(); cancelAnimationFrame(frame); s = tgt = +slider.value / 100; draw(); });
  root.querySelectorAll("[data-swmode]").forEach(function (b) { b.addEventListener("click", function () { vis = b.getAttribute("data-swmode") === "v"; root.querySelectorAll("[data-swmode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .sw-box{max-width:460px;margin:0 auto}
.anima .sw-svg{--sw-soft:#f1e8df;--sw-air:#e3e9ee;--sw-brain:#ece2df}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .sw-svg{--sw-soft:#2b2a31;--sw-air:#1b1f29;--sw-brain:#302c33} }
:root[data-theme="dark"] .anima .sw-svg{--sw-soft:#2b2a31;--sw-air:#1b1f29;--sw-brain:#302c33}
.anima .sw-svg .sw-t{fill:var(--anatomy-text);font:12.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .sw-svg .sw-mut{fill:var(--anatomy-muted)}
.anima .sw-svg .sw-in{fill:var(--anatomy-strong);stroke:none}
.anima .sw-svg .sw-key{fill:var(--anatomy-lit);font-weight:600}
.anima .sw-svg .sw-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .sw-svg .sw-dot{fill:var(--anatomy-dot)}
.anima .sw-svg .sw-skin{fill:var(--sw-soft);stroke:var(--anatomy-mid);stroke-width:1}
.anima .sw-svg .sw-brain{fill:var(--sw-brain);stroke:none}
.anima .sw-svg .sw-air{fill:var(--sw-air);stroke:none}
.anima .sw-svg .sw-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .sw-svg .sw-concha{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:.8;opacity:.75}
.anima .sw-svg .sw-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1;stroke-linejoin:round}
.anima .sw-svg .sw-soft{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:1;stroke-linejoin:round}
.anima .sw-svg .sw-lip{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:1}
.anima .sw-svg .sw-tongue{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:1.2;stroke-linejoin:round}
.anima .sw-svg .sw-fib{fill:none;stroke:var(--tm-muscle-fib);stroke-width:.7;stroke-linecap:round;opacity:.35;pointer-events:none}
.anima .sw-svg .sw-floor{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:.8;opacity:.7}
.anima .sw-svg .sw-wall{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:.8;opacity:.55}
.anima .sw-svg .sw-lumen{fill:none;stroke:var(--tm-muscle-fib);stroke-width:1}
.anima .sw-svg .sw-cart{fill:var(--tm-cart);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .sw-svg .sw-fold{fill:none;stroke:var(--tm-muscle-fib);stroke-width:1.2;stroke-linecap:round}
.anima .sw-svg .sw-torus{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:.8}
.anima .sw-svg .sw-et{fill:var(--tm-air);stroke:var(--anatomy-hi);stroke-width:1}
.anima .sw-svg .sw-et.is-open{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.anima .sw-svg .sw-bolus{fill:#c9a23a;stroke:#8a6d1f;stroke-width:1.2}
`;

export function swallow() {
  return {
    id: "swallow", lec: "function",
    title: "Swallowing, stage by stage",
    caption: "Step through the three stages of a swallow in a midline view of the mouth and throat, and compare the adult somatic swallow (teeth together in MIP) with the visceral (infantile) swallow, tongue forward between the arches.",
    html: `<div class="anima" data-anima="swallow">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: swLive.toString(),
    helpers: [swLerp, swState, swSvg],
    data: D,
  };
}
