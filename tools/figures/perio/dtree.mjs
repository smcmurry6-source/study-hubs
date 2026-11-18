// Fig: the regeneration decision tree for intrabony defects (Periodontology S6, Dr. Geurs's class: "I think you should
// study it"). The AAP Regeneration Workshop's tree (Reynolds, 2015) as a flowchart you walk, every box in the
// notes' and the Review table's words:
//   address first (the patient): uncontrolled systemic conditions, tobacco use and other behavioral issues, inadequate
//   oral hygiene -> initial therapy and any occlusal trauma or mobility management -> assess the site ->
//   intrabony defect under 3 mm (not a regeneration case): PD 5 mm or less and no BOP, consider non-surgical
//   management; PD over 5 mm, consider osseous surgery;
//   3 mm or more: prognosis with treatment unfavorable, or poor to hopeless -> extraction and tooth replacement;
//   otherwise esthetic risk, weighed alongside (low: proceed; high: proceed only with the patient's acceptance, avoid a
//   GTR membrane, consider soft-tissue augmentation) -> defect configuration (3-wall > circumferential >= 2-wall >
//   1-wall; narrow > wide): 3-wall or circumferential under 2 mm wide, a bone graft, a GTR membrane or a biologic;
//   3 mm or wider, or 2-wall, a reinforced GTR membrane, a bone graft + GTR membrane or a bone graft + biologic;
//   1-wall, combination therapy or a cellular bone allograft.
// Two modes: "Walk it" (answer each box's question) and "Case" (the bank's #30 mesial case, q6-P04, step by step).
// Two layouts, worked out here at build time (lines wrapped with Nunito Sans's own advance widths): a narrow one, 330
// wide, for phones, and a wide one, 640 wide, from 600 px; the live code switches between them with a ResizeObserver.
import { figureSvg, plateHtml, esc } from "./shared.mjs";

/* ---- build time: Nunito Sans advance widths (em, measured in Chromium) for wrapping ---- */
const CH = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~≥·≤—’“”";
const AW = {
  400: "26,23,39,60,60,93,69,22,32,32,45,60,23,42,23,28,60,60,60,60,60,60,60,60,60,60,23,23,60,60,60,44,95,73,68,67,74,58,55,73,76,26,32,63,54,86,74,77,63,77,67,62,60,73,69,110,65,60,59,32,28,32,60,50,50,53,58,46,58,53,33,59,57,23,24,50,30,86,57,56,58,58,36,48,35,56,52,84,53,51,46,35,27,35,60,55,23,55,100,23,39,39",
  600: "26,24,42,60,60,94,71,23,34,34,45,60,24,43,24,30,60,60,60,60,60,60,60,60,60,60,24,24,60,60,60,45,95,74,68,68,75,59,55,73,77,27,34,64,55,86,74,78,64,78,68,62,61,73,70,111,66,61,60,33,30,33,60,50,50,54,59,47,59,54,35,59,58,24,25,52,31,87,58,57,59,59,37,48,37,57,52,85,53,52,47,37,28,37,60,55,24,55,100,24,42,42",
  700: "27,25,45,60,60,95,73,24,36,36,45,60,25,43,25,31,60,60,60,60,60,60,60,60,60,60,25,25,60,60,60,46,95,74,69,68,76,60,56,74,77,28,36,66,56,87,75,79,65,79,69,63,62,74,71,111,67,62,61,35,31,35,60,50,50,55,60,47,60,54,36,60,59,26,26,54,32,88,59,58,60,60,39,49,38,58,53,85,55,53,47,39,29,39,60,55,25,55,100,25,44,44",
};
const WT = {}; for (const k in AW) WT[k] = AW[k].split(",").map((v) => +v / 100);
const tw = (s, fs, wt) => [...s].reduce((n, c) => { const i = CH.indexOf(c); return n + (i < 0 ? 0.6 : WT[wt][i]) * fs; }, 0);
function wrap(s, max, fs, wt) {
  const out = []; let line = "";
  /* keep a number with its unit ("3 mm") and "+" with the word after it on one line */
  const words = []; for (const w of s.split(" ")) { const p = words[words.length - 1]; if (p && ((w === "mm" && /^[0-9]/.test(p)) || p === "+")) words[words.length - 1] = p + " " + w; else words.push(w); }
  for (const w of words) { const t = line ? line + " " + w : w; if (line && tw(t, fs, wt) > max) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line);
  return out;
}

/* type: head 13px bold, body 12px, actions 12px semibold; line heights; padding; the bullet's indent */
const M = { FS: { h: 13, b: 12, a: 12 }, WG: { h: 700, b: 400, a: 600 }, LH: { h: 16, b: 15, a: 15 }, PX: 9, PY: 8, BUL: 11 };
M.OFF = {}; for (const k of ["h", "b", "a"]) M.OFF[k] = +((M.LH[k] + 0.7 * M.FS[k]) / 2).toFixed(1);
const SAFE = 0.93; /* room for a fallback font before Nunito Sans has loaded */

/* every box's words: the notes' and the Review table's (head, body, actions; x = actions that use a GTR membrane) */
const T = {
  pt: { h: "Address first: the patient", b: "uncontrolled systemic conditions; tobacco use and other behavioral issues; inadequate oral hygiene" },
  init: { h: "Initial therapy", b: "and any occlusal trauma or mobility management" },
  site: { h: "Assess the site", b: "PD and CAL; bleeding on probing; mobility and fremitus; osseous architecture, clinical and radiographic; restorative, endodontic or orthodontic needs" },
  lt3: { h: "Intrabony defect under 3 mm", b: "not a regeneration case" },
  ns: { h: "PD 5 mm or less, no BOP", a: ["consider non-surgical management"] },
  os: { h: "PD over 5 mm", a: ["consider osseous surgery"] },
  ge3: { h: "Intrabony defect 3 mm or more" },
  prog: { h: "Prognosis with treatment" },
  ext: { h: "Unfavorable, or poor to hopeless", a: ["extraction and tooth replacement"] },
  es: { h: "Esthetic risk, weighed alongside" },
  esL: { h: "Low esthetic risk", b: "low smile line, thick biotype, full papilla, under 5 mm from the contact to the crest", a: ["proceed"] },
  esH: { h: "High esthetic risk", b: "high smile line, thin biotype, papilla loss, or over 6 mm from the contact to the crest", a: ["proceed only with the patient's acceptance", "avoid a GTR membrane", "consider soft-tissue augmentation"] },
  cfg: { h: "Defect configuration", b: "predictability: 3-wall > circumferential ≥ 2-wall > 1-wall; narrow > wide" },
  tA: { h: "3-wall or circumferential, under 2 mm wide", a: ["bone graft", "GTR membrane", "biologic"], x: [1] },
  tB: { h: "3-wall or circumferential 3 mm or wider, or 2-wall", a: ["reinforced GTR membrane", "bone graft + GTR membrane", "bone graft + biologic"], x: [0, 1] },
  tC: { h: "1-wall", a: ["combination therapy", "cellular bone allograft"] },
};
const KIND = { ns: "out", os: "out", ext: "out", tA: "out", tB: "out", tC: "out" };

const r1 = (n) => Math.round(n * 10) / 10;
/* a box at x, y, w: its wrapped lines and height. Stored as [x, y, w, h, head, body, actions], each its lines' lengths
   in characters, cut from the box's words in D.T at run time */
function mk(id, x, y, w) {
  const t = T[id], inner = (w - 2 * M.PX) * SAFE, e = (l) => l.map((s) => esc(s).length);
  const hd = wrap(t.h, inner, M.FS.h, M.WG.h), bd = t.b ? wrap(t.b, inner, M.FS.b, M.WG.b) : [];
  const ac = (t.a || []).map((s) => wrap(s, inner - M.BUL, M.FS.a, M.WG.a));
  const h = 2 * M.PY + hd.length * M.LH.h + (bd.length ? 2 + bd.length * M.LH.b : 0) + (ac.length ? 3 + ac.reduce((n, l) => n + l.length, 0) * M.LH.a : 0);
  return { id, x, y, w, h, cx: x + w / 2, b: y + h, row: [r1(x), r1(y), r1(w), r1(h), e(hd), e(bd), ac.map(e)] };
}
/* the y an arrow meets a box's side at: the middle of its first line */
const sideY = (n) => n.y + Math.min(n.h / 2, M.PY + M.LH.h / 2 + 1);

function layout(W, wide) {
  const m = 6, G = 24, fw = W - 2 * m, N = {}, E = [], TX = [];
  const put = (id, x, y, w) => (N[id] = mk(id, x, y, w));
  const down = (a, b) => E.push([a.id, b.id, `M${r1(a.cx)} ${r1(a.b)}V${r1(b.y)}`, [r1(a.cx), r1(b.y), "d"]]);
  /* a bus: down from a, across, and down into b */
  const bus = (a, b, yb) => E.push([a.id, b.id, `M${r1(a.cx)} ${r1(a.b)}V${r1(yb)}H${r1(b.cx)}V${r1(b.y)}`, [r1(b.cx), r1(b.y), "d"]]);
  /* a list: down a spine at sx from a, then right into b */
  const list = (a, b, sx) => E.push([a.id, b.id, `M${r1(sx)} ${r1(a.b)}V${r1(sideY(b))}H${r1(b.x)}`, [r1(b.x), r1(sideY(b)), "r"]]);
  const side = (a, b, dir) => { const y = sideY(a), x0 = dir === "l" ? a.x : a.x + a.w, x1 = dir === "l" ? b.x + b.w : b.x;
    E.push([a.id, b.id, `M${r1(x0)} ${r1(y)}H${r1(x1)}`, [r1(x1), r1(y), dir]]); };
  const sw = wide ? 440 : fw, sx = (W - sw) / 2, hg = wide ? 20 : 14, hw = (fw - hg) / 2, xL = m, xR = m + hw + hg;
  let y = m;
  const pt = put("pt", sx, y, sw); y = pt.b + G;
  const init = put("init", sx, y, sw); down(pt, init); y = init.b + G;
  const site = put("site", sx, y, sw); down(init, site); y = site.b + G + 6;
  let lt3, ge3, ns, os, prog, ext;
  if (wide) {
    /* under 3 mm on the left with its two outcomes side by side; 3 mm or more on the right, its prognosis beside the extraction */
    const cw = (hw - 12) / 2;
    lt3 = put("lt3", xL, y, hw); ge3 = put("ge3", xR, y, cw);
    const yk = Math.max(lt3.b, ge3.b) + G;
    ns = put("ns", xL, yk, cw); os = put("os", xL + cw + 12, yk, cw);
    prog = put("prog", xR, yk, cw); ext = put("ext", xR + cw + 12, yk, cw);
    const yb = lt3.b + (yk - lt3.b) / 2; bus(lt3, ns, yb); bus(lt3, os, yb);
    E.push([ge3.id, prog.id, `M${r1(ge3.cx)} ${r1(ge3.b)}V${r1(prog.y)}`, [r1(ge3.cx), r1(prog.y), "d"]]);
    side(prog, ext, "r");
  } else {
    /* under 3 mm on the left, its two outcomes listed below it; the 3 mm path runs down the right */
    lt3 = put("lt3", xL, y, hw); ge3 = put("ge3", xR, y, hw);
    ns = put("ns", xL + 22, lt3.b + 12, hw - 22); os = put("os", xL + 22, ns.b + 10, hw - 22);
    list(lt3, ns, xL + 11); list(lt3, os, xL + 11);
    const yp = Math.max(os.b, ge3.b) + G;
    prog = put("prog", xR, yp, hw); ext = put("ext", xL, yp, hw);
    down(ge3, prog); side(prog, ext, "l");
  }
  const ys = site.b + (lt3.y - site.b) / 2; bus(site, lt3, ys); bus(site, ge3, ys);
  y = Math.max(prog.b, ext.b, ns.b, os.b) + G + 4;
  const es = put("es", sx, y, sw);
  E.push([prog.id, es.id, `M${r1(prog.cx)} ${r1(prog.b)}V${r1(es.y)}`, [r1(prog.cx), r1(es.y), "d"]]);
  TX.push([r1(prog.cx + 7), r1(prog.b + (es.y - prog.b) / 2 + 4), "otherwise", "start", "prog", "es"]);
  y = es.b + G + 6;
  const esL = put("esL", xL, y, hw), esH = put("esH", xR, y, hw), yb1 = es.b + (y - es.b) / 2; bus(es, esL, yb1); bus(es, esH, yb1);
  const yeb = Math.max(esL.b, esH.b); y = yeb + G + 6;
  const cfg = put("cfg", sx, y, sw), yb2 = yeb + (y - yeb) / 2;
  E.push([esL.id, cfg.id, `M${r1(esL.cx)} ${r1(esL.b)}V${r1(yb2)}H${r1(cfg.cx)}V${r1(cfg.y)}`, [r1(cfg.cx), r1(cfg.y), "d"]]);
  E.push([esH.id, cfg.id, `M${r1(esH.cx)} ${r1(esH.b)}V${r1(yb2)}H${r1(cfg.cx)}V${r1(cfg.y)}`, [r1(cfg.cx), r1(cfg.y), "d"]]);
  let end;
  if (wide) {
    const tw3 = (fw - 28) / 3, yt = cfg.b + G + 6, yb = cfg.b + (yt - cfg.b) / 2;
    const ts = ["tA", "tB", "tC"].map((id, i) => put(id, m + i * (tw3 + 14), yt, tw3));
    ts.forEach((t) => bus(cfg, t, yb)); end = Math.max(...ts.map((t) => t.b));
  } else {
    let yt = cfg.b + 12;
    ["tA", "tB", "tC"].forEach((id) => { const t = put(id, m + 22, yt, fw - 22); list(cfg, t, m + 11); yt = t.b + 10; end = t.b; });
  }
  const Nr = {}; for (const k in N) Nr[k] = N[k].row;
  return { W, H: Math.ceil(end + m), N: Nr, E, T: TX };
}

const D = {
  M: { PX: M.PX, PY: M.PY, LH: M.LH, OFF: M.OFF, BUL: M.BUL },
  T: Object.fromEntries(Object.entries(T).map(([k, t]) => [k, [esc(t.h), esc(t.b || ""), (t.a || []).map(esc)]])),
  LN: layout(330, false), LW: layout(640, true),
  K: KIND, X: { tA: T.tA.x, tB: T.tB.x },
  /* each question: the box it sits at, the boxes it chooses between, and its answers:
     [button, boxes it lights, next question, why (null: the info of the box it lights), its label in the trail, stops here] */
  Q: {
    pt: { at: "pt", hi: ["init"], ask: "Start with the patient: are uncontrolled systemic conditions, tobacco use and other behavioral issues, and inadequate oral hygiene addressed?", o: [
      ["Addressed", ["pt", "init", "site"], "dep", "The patient comes first, and these are addressed. Then initial therapy, with any occlusal trauma or mobility management (a tooth that moves won't heal), and the site assessment: PD and CAL, bleeding on probing, mobility and fremitus, the osseous architecture clinically and on radiographs, and any restorative, endodontic or orthodontic work.", "Patient factors addressed"],
      ["Not yet", ["pt"], null, "Address them first. Uncontrolled systemic conditions, tobacco use and other behavioral issues, and inadequate oral hygiene come before any decision about the defect: the same factors ruled furcation regeneration out in Session 5.", "Patient factors not yet addressed", 1]] },
    dep: { at: "site", hi: ["lt3", "ge3"], ask: "How deep is the intrabony defect?", o: [
      ["Under 3 mm", ["lt3"], "pd", null, "Under 3 mm"],
      ["3 mm or more", ["prog", "ge3"], "prog", null, "3 mm or more"]] },
    pd: { at: "lt3", hi: ["ns", "os"], ask: "Under 3 mm: what are the probing depths?", o: [
      ["5 mm or less, no BOP", ["ns"], null, null, "PD 5 mm or less, no BOP"],
      ["Over 5 mm", ["os"], null, null, "PD over 5 mm"]] },
    prog: { at: "prog", hi: ["ext", "es"], ask: "Is the prognosis with treatment unfavorable, or poor to hopeless?", o: [
      ["Yes", ["ext"], null, null, "Unfavorable, or poor to hopeless"],
      ["No", ["es"], "es", "The prognosis allows it, so regeneration follows the defect, with the esthetic risk weighed alongside.", "Prognosis: otherwise"]] },
    es: { at: "es", hi: ["esL", "esH"], ask: "Esthetic risk, weighed alongside: low or high?", o: [
      ["Low", ["cfg", "esL"], "wall", null, "Low esthetic risk"],
      ["High", ["cfg", "esH"], "wall", null, "High esthetic risk"]] },
    wall: { at: "cfg", hi: ["tA", "tB", "tC"], ask: "Defect configuration: how many walls? (They're confirmed at surgery, once the defect is debrided.)", o: [
      ["3-wall or circumferential", [], "wid", "A 3-wall or circumferential defect: contained, so what you put in it stays there. Its width decides the rest.", "3-wall or circumferential"],
      ["2-wall", ["tB"], null, null, "2-wall"],
      ["1-wall", ["tC"], null, null, "1-wall"]] },
    wid: { at: "cfg", hi: ["tA", "tB"], ask: "How wide is the 3-wall or circumferential defect?", o: [
      ["Under 2 mm", ["tA"], null, null, "Under 2 mm wide"],
      ["3 mm or wider", ["tB"], null, null, "3 mm or wider"]] },
  },
  ESL: " Esthetic risk is low: proceed.",
  ESH: { tA: " With high esthetic risk: avoid the GTR membrane, which leaves a bone graft or a biologic; proceed only if the patient accepts the esthetic risk; consider soft-tissue augmentation.",
    tB: " With high esthetic risk: avoid a GTR membrane, which leaves a bone graft plus a biologic; proceed only if the patient accepts the esthetic risk; consider soft-tissue augmentation.",
    tC: " With high esthetic risk: avoid a GTR membrane, proceed only if the patient accepts the esthetic risk, and consider soft-tissue augmentation." },
  NAME: { pt: "address first", ns: "non-surgical management", os: "osseous surgery", ext: "extraction", tA: "graft, GTR or biologic", tB: "reinforced GTR or a graft combination", tC: "combination or cellular allograft" },
  INTRO: "The AAP Regeneration Workshop's decision tree (Reynolds, 2015), which Dr. Geurs told the class to study. What it says: understand your defect (how deep the pocket is, what the bony morphology is, how many walls it has), then choose the therapy. Answer each step and the path lights up.",
  CINTRO: "The #30 mesial case. Press Next step: each fact in the case lights the next box of the tree.",
  /* the case, step by step: [boxes it lights, the fact it reads (-1 none), the box it ends on, what it says] */
  CASE: [
    [["pt"], 0, "pt", "Nothing to address first: he doesn't smoke, and a full-mouth plaque score of 12% is 15% or less (low risk on the risk assessment)."],
    [["init", "site"], 2, "site", "The site: #30 mesial probes 7 mm with bleeding on probing, over a 5 mm intrabony defect."],
    [["ge3", "prog"], 2, "prog", "A 5 mm intrabony defect is 3 mm or more, so regeneration is on the table. (Under 3 mm, with a probing depth over 5 mm, it would have gone to osseous surgery.)"],
    [["es"], -1, "es", "Prognosis with treatment: nothing in the case makes it unfavorable, or poor to hopeless (a low-risk patient with a regenerable defect), so the tooth is kept, not extracted."],
    [["esL", "cfg"], 1, "cfg", "Low smile line, thick biotype: low esthetic risk, so proceed; a GTR membrane stays among the options."],
    [["tB"], 3, "tB", "At surgery, after debridement, it's a 2-wall defect (the walls are confirmed once the flap is raised). A 2-wall defect takes a reinforced GTR membrane, a bone graft plus a GTR membrane, or a bone graft plus a biologic. A biologic used on its own is for a narrow 3-wall or circumferential defect."],
  ],
  HOT: {
    pt: "The tree starts with the patient: address first uncontrolled systemic conditions, tobacco use and other behavioral issues, and inadequate oral hygiene. The same factors ruled furcation regeneration out in Session 5.",
    init: "Initial therapy, and any occlusal trauma or mobility management, come before the site is assessed. Mobility is not a good thing during healing: a tooth that moves won't heal.",
    site: "Assess the site: probing depth and CAL, bleeding on probing, mobility and fremitus, the osseous architecture clinically and on radiographs, and any restorative, endodontic or orthodontic work. You decide from clinical measurements and radiographs, not by raising a flap.",
    lt3: "An intrabony defect under 3 mm isn't a regeneration case: a shallow defect may regenerate, but other therapies may be more predictable for it.",
    ns: "Probing depths of 5 mm or less and no bleeding on probing: consider non-surgical management.",
    os: "Probing depths over 5 mm: consider osseous surgery, the resective therapy of Session 5. It takes what is there and makes it maintainable by eliminating the pocket.",
    ge3: "An intrabony defect of 3 mm or more: regeneration is on the table, if the prognosis allows it. Defects deeper than 3 mm with a radiographic defect angle of 25 degrees or less were reported to be the most amenable to conventional GTR-based regeneration.",
    prog: "If the prognosis with treatment is unfavorable, or poor to hopeless, the answer is extraction and tooth replacement. Otherwise regeneration follows the defect.",
    ext: "An unfavorable, or poor to hopeless, prognosis with treatment: extraction and tooth replacement. Short of that, keep the tooth: a natural tooth is almost always better than an implant, unless you can't keep the tooth.",
    es: "Esthetic risk is weighed alongside the defect: the smile line, the biotype, the papilla and the distance from the contact to the interproximal bone crest.",
    esL: "Low esthetic risk: a low smile line, a thick biotype, a full papilla, and under 5 mm from the contact to the interproximal bone crest. Proceed.",
    esH: "High esthetic risk: a high smile line, a thin biotype, papilla loss, or more than 6 mm from the contact to the crest. Proceed only if the patient accepts the esthetic risk, avoid a GTR membrane, and consider soft-tissue augmentation. Raising tissue off a tooth heals with a little recession, especially interproximally.",
    cfg: "The defect configuration: its walls and its width. The more walls, the more contained the defect: what you put in it stays there, and there is more bony surface to influence the wound. Narrow beats wide.",
    tA: "3-wall or circumferential, under 2 mm wide: narrow and contained, so a bone graft, a GTR membrane or a biologic each does well.",
    tB: "3-wall or circumferential and 3 mm or wider, or a 2-wall defect: a reinforced GTR membrane, a bone graft plus a GTR membrane, or a bone graft plus a biologic. A bone graft under a membrane holds the space, so the membrane can't collapse into the defect.",
    tC: "A 1-wall defect: combination therapy or a cellular bone allograft. Without walls, nothing holds up the flap or the clot, so a biologic alone has little space to work in; these defects usually get a graft as well, to support the soft tissue.",
  },
  FACTS: [["Patient", "58-year-old male, nonsmoker, FMPS 12%"], ["Smile", "Low smile line, thick biotype"], ["#30 mesial", "PD 7 mm, BOP; 5 mm intrabony defect"], ["At surgery", "A 2-wall defect after debridement"]],
};
/* the info texts double as the walk's explanations (plain text), so they must need no escaping in an attribute */
for (const k in D.HOT) if (esc(D.HOT[k]) !== D.HOT[k]) throw new Error("dtree: HOT." + k + " needs escaping");

/* ---- serialized: drawing ---- */
export function dtHead(x, y, d) {
  var a = d === "d" ? [x - 4.5, y - 8, x + 4.5, y - 8] : d === "r" ? [x - 8, y - 4.5, x - 8, y + 4.5] : [x + 8, y - 4.5, x + 8, y + 4.5];
  return "M" + x + " " + y + "L" + a[0] + " " + a[1] + "L" + a[2] + " " + a[3] + "Z";
}
export function dtDraw(L, st, D) {
  var o = "", M = D.M, f = function (n) { return Math.round(n * 10) / 10; };
  function cut(s, c) { var r = [], i = 0; c.forEach(function (n) { r.push(s.substr(i, n)); i += n + 1; }); return r; }
  function cls(id) { return (st.lit[id] ? " is-lit" : "") + (st.fresh[id] ? " is-new" : "") + (st.now === id ? " is-now" : "") + (st.opt[id] && !st.lit[id] ? " is-opt" : "") + (st.dim[id] ? " is-dim" : "") + (st.stop && id === "pt" ? " is-stop" : ""); }
  function eCls(a, b) { return st.lit[a] && st.lit[b] && !(st.stop && a === "pt") ? " is-lit" : st.now === a && st.opt[b] ? " is-opt" : st.dim[a] || st.dim[b] ? " is-dim" : ""; }
  /* the arrows, lit ones last so a shared segment shows lit */
  var es = L.E.map(function (e, i) { var c = eCls(e[0], e[1]); return [c === " is-lit" ? 2 : c === " is-opt" ? 1 : 0, i, c]; });
  es.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  es.forEach(function (x) { var e = L.E[x[1]], h = e[3]; o += '<path class="dt-e' + x[2] + '" d="' + e[2] + '"/><path class="dt-ah' + x[2] + '" d="' + D.dtHead(h[0], h[1], h[2]) + '"/>'; });
  L.T.forEach(function (t) { o += '<text class="dt-lab' + eCls(t[4], t[5]) + '" x="' + t[0] + '" y="' + t[1] + '" text-anchor="' + t[3] + '">' + t[2] + "</text>"; });
  /* the boxes: head, body, then the actions as a bulleted list */
  Object.keys(L.N).forEach(function (id) {
    var n = L.N[id], t = D.T[id], x = n[0] + M.PX, y = n[1] + M.PY, xs = D.X[id] || [];
    o += '<g class="hot dt-n dt-' + (D.K[id] || "q") + cls(id) + '" data-dt="' + id + '" data-info="' + D.HOT[id] + '"><rect class="dt-r" x="' + f(n[0]) + '" y="' + f(n[1]) + '" width="' + f(n[2]) + '" height="' + f(n[3]) + '" rx="9"/>';
    cut(t[0], n[4]).forEach(function (s) { o += '<text class="dt-h" x="' + f(x) + '" y="' + f(y + M.OFF.h) + '">' + s + "</text>"; y += M.LH.h; });
    if (n[5].length) y += 2;
    cut(t[1], n[5]).forEach(function (s) { o += '<text class="dt-b" x="' + f(x) + '" y="' + f(y + M.OFF.b) + '">' + s + "</text>"; y += M.LH.b; });
    if (n[6].length) y += 3;
    n[6].forEach(function (c, j) {
      var x2 = st.esH && xs.indexOf(j) > -1 ? " dt-x" : "";
      o += '<circle class="dt-bul" cx="' + f(x + 3) + '" cy="' + f(y + M.OFF.a - 4) + '" r="2.2"/>';
      cut(t[2][j], c).forEach(function (s) { o += '<text class="dt-a' + x2 + '" x="' + f(x + M.BUL) + '" y="' + f(y + M.OFF.a) + '">' + s + "</text>"; y += M.LH.a; });
    });
    o += "</g>";
  });
  return o + '<g class="dt-sts"></g>';
}

const svg = figureSvg({ width: D.LN.W, height: D.LN.H, className: "dt-svg", label: "The AAP Regeneration Workshop decision tree for intrabony defects as a flowchart: the patient first, initial therapy and the site assessment, then an intrabony defect under 3 mm (non-surgical management or osseous surgery, by the probing depth) or 3 mm or more (the prognosis, extraction, the esthetic risk, the defect configuration and the treatment for each).",
  body: `<g class="dt-dyn"></g>` });
const plate = plateHtml({ fig: "S6 · Fig 3", title: "The decision tree, step by step", hint: "answer each step · tap a box", readout: "start: the patient", body: `<div class="am-svg dt-box">${svg}</div>` });
const ANS = (q) => D.Q[q].o.map((o, i) => `<button type="button" class="am-btn" data-dta="${i}" aria-pressed="false">${esc(o[0])}</button>`).join("");
const RESET = `<button type="button" class="am-btn dt-reset" data-dtk="reset">Start over</button>`;
const controls = `<div class="am-controls" role="group" aria-label="Mode"><button type="button" class="am-btn" data-dtm="walk" aria-pressed="true">Walk it</button><button type="button" class="am-btn" data-dtm="case" aria-pressed="false">Case: #30 mesial</button></div>
<div class="dt-panel"><p class="dt-ask">${esc(D.Q.pt.ask)}</p>
<div class="am-controls dt-trail" role="group" aria-label="Your answers so far: tap one to change it" hidden></div>
<div class="am-controls dt-opts" role="group" aria-label="${esc(D.Q.pt.ask)}">${ANS("pt")}${RESET}</div>
<dl class="dt-case" hidden>${D.FACTS.map((r, i) => `<div data-dtf="${i}"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></div>
<p class="am-summary" aria-live="polite">${esc(D.INTRO)}</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Geurs's class, his slide deck and the class exam-review guide, as the notes give them: every box's words and numbers (the patient first; the site assessment; under 3 mm, with probing of 5 mm or less and no bleeding, or over 5 mm; 3 mm or more; the order of predictability; the prognosis; the treatment for each defect; low and high esthetic risk). He told the class to study the tree in the handout. The case is the question bank's #30 mesial case.</li>
<li>Outside sources: the tree is the AAP Regeneration Workshop's, for intrabony defects. Its consensus report (Reynolds MA, Kao RT, Camargo PM, et al. Periodontal regeneration - intrabony defects: a consensus report from the AAP Regeneration Workshop. J Periodontol 2015;86(2 Suppl):S105-S107) found that biologics give gains comparable to bone grafts and GTR, and named smoking and excessive tooth mobility as working against regeneration, which is why the patient and mobility come first. Its practical-applications paper (Reynolds MA, Kao RT, Nares S, et al. Periodontal regeneration - intrabony defects: practical applications from the AAP Regeneration Workshop. Clin Adv Periodontics 2015;5:21-29) sets out how to choose a regenerative approach for an intrabony defect: harder as the bony walls are lost, with combination therapy where the walls are missing.</li>
<li>Redrawn and simplified as one path you walk: esthetic risk, which the tree weighs alongside the defect, is asked before the defect configuration here. The branches are only the tree's: under 3 mm it names probing of 5 mm or less without bleeding, or over 5 mm, and it calls a 3-wall or circumferential defect narrow under 2 mm and wide at 3 mm or more. Striking the membrane options for high esthetic risk applies its "avoid a GTR membrane". The walls are confirmed at surgery, once the defect is debrided. Educational, not medical advice.</li></ul></details>`;

function dtLive(root, D) {
  var svg = root.querySelector(".dt-svg"), box = svg.parentNode, dyn = svg.querySelector(".dt-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"),
    ask = root.querySelector(".dt-ask"), trail = root.querySelector(".dt-trail"), opts = root.querySelector(".dt-opts"), facts = root.querySelector(".dt-case"), readout = root.querySelector("[data-readout]");
  var mode = "walk", hist = [], cs = 0, L = D.LN, fmt = D.dtDraw;
  var RESET = '<button type="button" class="am-btn dt-reset" data-dtk="reset">Start over</button>';
  function kids(id) { var o = []; L.E.forEach(function (e) { if (e[0] === id) o.push(e[1]); }); return o; }
  function below(seeds) { var seen = {}, q = seeds.slice(); while (q.length) { var k = q.shift(); if (seen[k]) continue; seen[k] = 1; q = q.concat(kids(k)); } return seen; }
  function state() {
    var st = { lit: {}, fresh: {}, opt: {}, dim: {}, now: "", stop: false, esH: false, q: "pt", last: null }, reach = null, i;
    if (mode === "walk") {
      hist.forEach(function (h) { var o = D.Q[h[0]].o[h[1]]; o[1].forEach(function (k) { st.lit[k] = 1; }); if (o[1].indexOf("esH") > -1) st.esH = true; if (o[5]) st.stop = true; st.q = o[2]; st.last = o; });
      if (st.last) st.last[1].forEach(function (k) { st.fresh[k] = 1; });
      if (st.q) { var Q = D.Q[st.q]; st.now = Q.at; Q.hi.forEach(function (k) { st.opt[k] = 1; }); if (hist.length) reach = below(Q.hi); } else reach = {};
    } else {
      for (i = 0; i < cs; i++) D.CASE[i][0].forEach(function (k) { st.lit[k] = 1; });
      if (cs) { D.CASE[cs - 1][0].forEach(function (k) { st.fresh[k] = 1; }); reach = cs < D.CASE.length ? below(kids(D.CASE[cs - 1][2])) : {}; }
    }
    if (reach) Object.keys(L.N).forEach(function (k) { if (!st.lit[k] && !reach[k] && k !== st.now) st.dim[k] = 1; });
    return st;
  }
  /* strike through the membrane options once high esthetic risk is chosen (measured, so the line fits the words) */
  function strike() {
    var g = dyn.querySelector(".dt-sts"), o = "";
    Array.prototype.forEach.call(dyn.querySelectorAll(".dt-x"), function (t) { var b; try { b = t.getBBox(); } catch (e) { return; }
      if (b && b.width) o += '<path class="dt-st" d="M' + (b.x - 1).toFixed(1) + " " + (b.y + b.height * 0.56).toFixed(1) + "h" + (b.width + 2).toFixed(1) + '"/>'; });
    if (g) g.innerHTML = o;
  }
  function draw(focus) {
    var st = state(), end = !st.q, t = st.last ? st.last[1][st.last[1].length - 1] : "";
    dyn.innerHTML = fmt(L, st, D); strike();
    root.querySelectorAll("[data-dtm]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-dtm") === mode)); });
    trail.hidden = mode !== "walk" || !hist.length; facts.hidden = mode !== "case";
    if (mode === "walk") {
      trail.innerHTML = hist.map(function (h, i) { return '<button type="button" class="am-btn" data-dtr="' + i + '" aria-pressed="true" title="Change this answer">' + D.Q[h[0]].o[h[1]][4] + "</button>"; }).join("");
      if (!end) { var Q = D.Q[st.q]; ask.textContent = Q.ask; opts.setAttribute("aria-label", Q.ask);
        opts.innerHTML = Q.o.map(function (o, i) { return '<button type="button" class="am-btn" data-dta="' + i + '" aria-pressed="false">' + o[0] + "</button>"; }).join("") + RESET; }
      else { ask.textContent = st.stop ? "Address them first, then start over." : "The end of this path. Tap an answer to change it, or start over."; opts.setAttribute("aria-label", "Start over"); opts.innerHTML = RESET; }
      var s = st.last ? st.last[3] || D.HOT[t] : D.INTRO;
      if (end && D.ESH[t]) s += st.esH ? D.ESH[t] : D.ESL;
      sum.textContent = s;
      if (readout) readout.textContent = !hist.length ? "start: the patient" : end ? D.NAME[t] || "" : "step " + (hist.length + 1);
    } else {
      ask.textContent = "Step through the #30 mesial case: each step reads one fact and lights the next box.";
      opts.setAttribute("aria-label", "Case steps");
      opts.innerHTML = '<button type="button" class="am-btn" data-dtk="next"' + (cs >= D.CASE.length ? " disabled" : "") + ">Next step</button>" + RESET;
      var c = cs ? D.CASE[cs - 1] : null;
      sum.textContent = c ? c[3] : D.CINTRO;
      facts.querySelectorAll("[data-dtf]").forEach(function (r) { r.classList.toggle("is-on", !!c && +r.getAttribute("data-dtf") === c[1]); });
      if (readout) readout.textContent = cs ? "case · step " + cs + " of " + D.CASE.length : "case: #30 mesial";
    }
    if (focus) { var b = opts.querySelector("button:not([disabled])"); if (b) b.focus(); }
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button"); if (!b || !root.contains(b)) return;
    var m = b.getAttribute("data-dtm"), a = b.getAttribute("data-dta"), r = b.getAttribute("data-dtr"), k = b.getAttribute("data-dtk");
    if (m) { if (m !== mode) { mode = m; hist = []; cs = 0; draw(false); } return; }
    if (a !== null) { var st = state(); if (st.q) { hist.push([st.q, +a]); draw(true); } return; }
    if (r !== null) { hist = hist.slice(0, +r); draw(true); return; }
    if (k === "reset") { hist = []; cs = 0; draw(true); return; }
    if (k === "next" && cs < D.CASE.length) { cs++; draw(true); }
  });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  /* the wide layout from 600 px across, the narrow one below */
  function fit() { var w = box.clientWidth; if (!w) return; var nl = w >= 600 ? D.LW : D.LN; if (nl === L && svg.getAttribute("data-dtw")) return; L = nl;
    svg.setAttribute("data-dtw", String(L.W)); svg.setAttribute("viewBox", "0 0 " + L.W + " " + L.H); svg.style.maxWidth = (L === D.LW ? 700 : 430) + "px"; draw(false); }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
  draw(false); fit();
}

const CSS = `
.anima .dt-box svg.dt-svg{margin:0 auto;max-width:430px}
.anima .dt-svg .dt-r{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.1;transition:fill .25s,stroke .25s}
.anima .dt-svg .dt-out .dt-r{fill:var(--dt-out)}
.anima .dt-svg .dt-h{fill:var(--anatomy-strong);font:700 13px var(--font-body)}
.anima .dt-svg .dt-b{fill:var(--anatomy-text);font:400 12px var(--font-body)}
.anima .dt-svg .dt-a{fill:var(--anatomy-strong);font:600 12px var(--font-body)}
.anima .dt-svg .dt-bul{fill:var(--anatomy-mid)}
.anima .dt-svg .dt-n{transition:opacity .25s}
.anima .dt-svg .is-opt .dt-r{stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:5 3}
.anima .dt-svg .is-lit .dt-r{fill:var(--dt-lit);stroke:var(--anatomy-lit);stroke-width:2.2;stroke-dasharray:none}
.anima .dt-svg .is-lit .dt-bul{fill:var(--anatomy-lit)}
.anima .dt-svg .is-now .dt-r{stroke:var(--anatomy-lit);stroke-width:2.6}
.anima .dt-svg .is-new .dt-r{stroke-width:3}
.anima .dt-svg .is-dim{opacity:.34}
.anima .dt-svg .is-stop .dt-r{fill:var(--dt-stop);stroke:var(--pd-red);stroke-width:2.6}
.anima .dt-svg .dt-e{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linejoin:round}
.anima .dt-svg .dt-ah{fill:var(--anatomy-mid)}
.anima .dt-svg .dt-e.is-opt{stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:5 3}
.anima .dt-svg .dt-ah.is-opt{fill:var(--anatomy-lit)}
.anima .dt-svg .dt-e.is-lit{stroke:var(--anatomy-lit);stroke-width:2.8}
.anima .dt-svg .dt-ah.is-lit{fill:var(--anatomy-lit)}
.anima .dt-svg .is-dim.dt-e,.anima .dt-svg .is-dim.dt-ah,.anima .dt-svg .dt-lab.is-dim{opacity:.3}
.anima .dt-svg .dt-lab{fill:var(--anatomy-muted);font:italic 600 12px var(--font-body);paint-order:stroke;stroke:var(--surface);stroke-width:4px;stroke-linejoin:round}
.anima .dt-svg .dt-lab.is-lit{fill:var(--anatomy-lit)}
.anima .dt-svg .dt-a.dt-x{fill:var(--anatomy-muted)}
.anima .dt-svg .dt-st{fill:none;stroke:var(--pd-red);stroke-width:1.7;stroke-linecap:round}
.anima .dt-panel{margin:4px 0 0}
.anima .dt-panel [hidden]{display:none}
.anima .dt-ask{font-weight:700;color:var(--ink);font-size:.95rem;line-height:1.45;margin:10px 0 2px}
.anima .dt-trail{gap:6px 8px;margin:8px 0 2px}
.anima .dt-trail .am-btn{font-size:.76rem;padding:3px 9px}
.anima .dt-opts{gap:8px 10px}
.anima .dt-opts .dt-reset{margin-left:auto;border-style:dashed}
.anima .dt-opts .am-btn[disabled]{opacity:.45;cursor:default}
.anima .dt-case{display:grid;gap:2px;margin:8px 0 2px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;font-size:.86rem;line-height:1.4}
.anima .dt-case > div{display:grid;grid-template-columns:6.5em 1fr;gap:8px;padding:3px 6px;border-radius:6px}
.anima .dt-case dt{font-weight:700;color:var(--ink)}
.anima .dt-case dd{margin:0;color:var(--ink-soft)}
.anima .dt-case .is-on{background:var(--accent-soft)}
.anima .dt-case .is-on dd{color:var(--ink)}
.anima[data-anima="dtree"]{--dt-out:#f8efe9;--dt-lit:color-mix(in srgb, var(--anatomy-lit) 13%, var(--anatomy-face));--dt-stop:color-mix(in srgb, var(--pd-red) 12%, var(--anatomy-face))}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="dtree"]{--dt-out:#33282c;--dt-lit:color-mix(in srgb, var(--anatomy-lit) 22%, var(--anatomy-face));--dt-stop:color-mix(in srgb, var(--pd-red) 24%, var(--anatomy-face))} }
:root[data-theme="dark"] .anima[data-anima="dtree"]{--dt-out:#33282c;--dt-lit:color-mix(in srgb, var(--anatomy-lit) 22%, var(--anatomy-face));--dt-stop:color-mix(in srgb, var(--pd-red) 24%, var(--anatomy-face))}
@media (prefers-reduced-motion: reduce){.anima .dt-svg .dt-r,.anima .dt-svg .dt-n{transition:none}}
`;

export function dtree() {
  return { id: "dtree", lec: "periodontal-regeneration", title: "The decision tree, step by step",
    caption: "The AAP Regeneration Workshop's decision tree for intrabony defects (Reynolds, 2015), the one Dr. Geurs told the class to study: the patient first, then the site, the defect's depth, the prognosis, the esthetic risk, and the walls and width to the treatment. Walk it, or follow the #30 case.",
    html: `<div class="anima" data-anima="dtree">${controls}${plate}<p class="am-info">Tap a box for more.</p>${SOURCES}</div>`, css: CSS, live: dtLive.toString(), helpers: [dtHead, dtDraw], data: D };
}
