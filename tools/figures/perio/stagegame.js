/* ---------- STAGE & GRADE (Perio's staging and grading game, 2026-11-17) ----------
   Sam: "add an interactive visualization/game for staging and grading using all of the criteria", "a mini game
   accessible on the home of perio hub, top of the question bank, and in the arcade". Two parts:
   - Play: ten made-up patients, each drawn (the mouth: the teeth with attachment loss, the worst tooth, the teeth lost;
     and a film of the worst tooth) with its findings listed. Call the stage, then the extent, then the grade; every
     answer lights up the finding that decided it and says why.
   - Explore: set every criterion yourself and watch the stage, the extent and the grade follow, with the reasons.
   The rules (rules() below) are Session 1's: its notes ("Staging and grading") and its Review tables (Staging, Grading,
   the full 2018 AAP/EFP tables). Interdental CAL is the gold standard, bone loss the second choice; a vertical defect of
   3 mm or more, a Class II or III furcation and any tooth lost to periodontitis force Stage 3; 5 or more teeth lost, or
   Stage 3 plus a need for complex rehabilitation, is Stage 4; localized under 30% of teeth, generalized 30% or more, or
   the molar/incisor pattern; the grade from direct evidence when there are records, else % bone loss / age (under 0.25
   A, 0.25-1.0 B, over 1.0 C), pushed up to C by more than 10 cigarettes a day or an HbA1c of 7% or higher.
   Sources for the drawings: the 2017 World Workshop staging and grading tables (Tonetti, Greenwell & Kornman, J Periodontol
   2018) for what each stage looks like on a film (bone loss as a share of the root, in thirds from the CEJ; the crest sits
   about 1 mm below the CEJ in health) and Glickman's furcation classes (a Class II lesion partway between the roots, a Class
   III through and through). The mouth is a chart of #2-#15 and #31-#18 (Universal numbers, as seen facing the patient), each
   tooth's facial outline drawn to its average crown width, crown height and root length (Wheeler's Dental Anatomy,
   Physiology and Occlusion, its table of measurements) with its own crown and roots (an incisor's edge, a canine's cusp,
   the molars' cusps and roots); the outlines are schematic, unlabeled, and only mark which teeth are involved.
   The cases are generated, not bank questions: they don't count in class stats, your answers or XP (in the arcade a
   finished game posts its score and gets the arcade's +50, like every game there). The generator never makes a case
   whose answer turns on something the class and the 2018 table state differently (exactly 10 cigarettes a day; a light
   smoker or controlled diabetes when everything else says Grade A; a probing depth of 6 mm in a Stage 2 mouth) or that
   sits on a line (a ratio near 0.25 or 1.0, close to 30% of the teeth). Explore follows the 2018 table there and says so.
   Mounted by the engine's Question Bank (SH_HUB.bank.cuspGame: the hook Occlusion's "What cusp hits where?" uses), by
   Home's link (#more/arcade/stage) and by the arcade (content/arcade.js, game "stage"). Built into
   hubs/perio/content/figures.js by tools/figures/perio/build.mjs; edit it here, then rebuild. */
var STAGE_GAME = (function(){
  var ROUNDS = 10;
  /* the chart's teeth, as seen facing the patient: #2-#15 above, #31-#18 below (third molars aren't drawn) */
  var UP = [2,3,4,5,6,7,8,9,10,11,12,13,14,15], LO = [31,30,29,28,27,26,25,24,23,22,21,20,19,18], ALL = UP.concat(LO);
  var MOLAR = [2,3,14,15,18,19,30,31], FIRST = [3,14,19,30], INC = [7,8,9,10,23,24,25,26], CAN = [6,11,22,27];
  function type(n){ return MOLAR.indexOf(n) > -1 ? "m" : INC.indexOf(n) > -1 ? "i" : CAN.indexOf(n) > -1 ? "c" : "p"; }
  /* each tooth's facial outline at its average size (Wheeler's Dental Anatomy's table of measurements, in mm): crown width,
     crown height, root length, and the cervical width as a share of the crown's; drawn at S px a mm. Only the chart uses it. */
  var S = 3.3, DIMS = {
    up: [null, ["inc", 8.5, 10.5, 13, .82], ["inc2", 6.5, 9, 13, .77], ["can", 7.5, 10, 17, .73], ["pm1", 7, 8.5, 14, .71], ["pm", 6.5, 8.5, 14, .77], ["um", 10, 7.5, 13, .8], ["um", 9, 7, 12, .78]],
    lo: [null, ["inc", 5, 9, 12.5, .7], ["inc", 5.5, 9.5, 14, .73], ["can", 7, 11, 16, .79], ["pm", 7, 8.5, 14, .71], ["pm", 7, 8, 14.5, .71], ["lm1", 11, 7.5, 14, .82], ["lm", 10.5, 7, 13, .76]]
  };
  function dims(n){ var up = n <= 16, pos = up ? (n <= 8 ? 9 - n : n - 8) : (n <= 24 ? 25 - n : n - 24), d = DIMS[up ? "up" : "lo"][pos];
    return { kind: d[0], w: d[1] * S, cr: d[2] * S, rt: d[3] * S, cv: d[4], up: up }; }
  function width(n){ return dims(n).w; }
  var ROMAN = ["", "I", "II", "III", "IV"];
  var CX = { mast: "masticatory dysfunction", mob: "secondary occlusal trauma (mobility degree 2 or more)", bite: "bite collapse, drifting and flaring",
    ridge: "a severe ridge defect", teeth: "fewer than 20 remaining teeth (10 opposing pairs)" };
  function esc(s){ return escHtml(String(s == null ? "" : s)); }
  function rnd(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function mix(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pl(n, one, many){ return n + " " + (n === 1 ? one : (many || one + "s")); }
  function list(a){ return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function saved(){ if (!STATE.stageGame || typeof STATE.stageGame !== "object") STATE.stageGame = { best: 0, plays: 0 }; return STATE.stageGame; }

  /* ---------- the rules: Session 1's notes and Review tables ---------- */
  function rules(c){
    var r = { perio: !c.ging, stage: 0, extent: "", grade: "", sw: [], sk: [], sd: "", ew: [], ek: [], ed: "", gw: [], gk: [], gd: "" };
    function stage(n, keys, line){ r.stage = n; r.sk = keys; r.sd = line; r.sw.push(line); }
    function grade(g, keys, line){ r.grade = g; r.gk = keys; r.gd = line; r.gw.push(line); }
    if (c.ging) {
      stage(0, ["pd", "cal", "rbl"], "Pockets of " + c.pd + " mm that bleed, but no attachment loss and no bone loss: gingival (pseudo) pockets, so it's gingivitis, not periodontitis. No stage, extent or grade. A deep probing depth alone never proves periodontitis.");
      return r;
    }
    /* severity: interdental CAL is the gold standard, bone loss on the film the second choice */
    var sev = c.cal >= 5 ? 3 : c.cal >= 3 ? 2 : 1, band = c.rbl > 33 ? 3 : c.rbl >= 15 ? 2 : 1;
    stage(sev, ["cal", "rbl"], "Worst interdental CAL " + c.cal + " mm (" + (sev === 3 ? "5 mm or more" : sev === 2 ? "3-4 mm" : "1-2 mm") + ") and " + c.rbl + "% bone loss (" +
      (c.rbl > 33 ? "into the middle third or beyond" : c.rbl >= 15 ? "coronal third, 15-33%" : "coronal third, under 15%") + "): Stage " + sev + " by severity." +
      (band !== sev ? " The film alone says Stage " + band + ", but interdental CAL is the gold standard." : ""));
    var trig = [];
    if (c.vert >= 3) trig.push(["vert", "a vertical defect of " + c.vert + " mm (3 mm or more)"]);
    if (c.furc >= 2) trig.push(["furc", "a Class " + ROMAN[c.furc] + " furcation"]);
    if (c.lost >= 1 && c.lost <= 4) trig.push(["lost", pl(c.lost, "tooth", "teeth") + " lost to periodontitis"]);
    var tl = list(trig.map(function(t){ return t[1]; }));
    if (trig.length && r.stage < 3) stage(3, trig.map(function(t){ return t[0]; }), cap(tl) + ": straight to Stage 3, whatever the CAL says.");
    else if (trig.length) r.sw.push(cap(tl) + ": Stage 3 findings too.");
    if (c.vert > 0 && c.vert < 3) r.sw.push("A vertical defect under 3 mm doesn't change the stage.");
    if (c.furc === 1) r.sw.push("A Class I furcation doesn't change the stage; only Class II or III does.");
    var cx = (c.cx || []).slice(); if (c.mob >= 2) cx.push("mob"); if (c.teeth < 20) cx.push("teeth");
    var cl = list(cx.map(function(k){ return CX[k]; }));
    if (c.lost >= 5) stage(4, ["lost"], pl(c.lost, "tooth", "teeth") + " lost to periodontitis (5 or more): Stage 4.");
    else if (cx.length && r.stage >= 3) stage(4, cx.map(function(k){ return k === "teeth" || k === "mob" ? k : "cx"; }), "Stage 3's CAL and bone loss, plus a need for complex rehabilitation because of " + cl + ": Stage 4. (Stage 3 and 4 share the same CAL and bone-loss cutoffs; tooth loss and this list tell them apart.)");
    else if (cx.length) r.sw.push(cap(cl) + " is on Stage 4's list, but that list only separates Stage 4 from Stage 3; in a Stage " + r.stage + " mouth it doesn't apply.");
    if (r.stage === 3) r.sw.push("No more than 4 teeth lost and no need for complex rehabilitation, so Stage 3, not 4.");
    if (c.pd >= 6 && r.stage < 3) r.sw.push("A " + c.pd + " mm pocket sits in Stage 3's column of the 2018 table, so some would call this Stage 3. The class's rule stages from CAL and bone loss plus the three findings that force Stage 3.");
    /* extent */
    if (c.mip) { r.extent = "mip"; r.ek = ["ext"]; r.ed = "Only the first molars and incisors are involved: the molar/incisor pattern, written in front of the stage instead of localized or generalized."; }
    else {
      var p = Math.round(c.affected / c.teeth * 100);
      r.extent = p >= 30 ? "gen" : "loc"; r.ek = ["ext"];
      r.ed = c.affected + " of " + c.teeth + " teeth have attachment loss (" + p + "%): " + (p >= 30 ? "30% or more is generalized." : "under 30% is localized.");
    }
    r.ew.push(r.ed);
    /* grade: start at B, move only with evidence */
    var ratio = c.rbl / c.age;
    if (c.direct != null) {
      var dg = c.direct === 0 ? "A" : c.direct < 2 ? "B" : "C";
      grade(dg, ["direct"], "Films from 5 years ago show " + (c.direct === 0 ? "no further bone loss" : c.direct + " mm more bone loss") + ". Direct evidence is the gold standard when records exist (" +
        (dg === "A" ? "no loss: A" : dg === "B" ? "under 2 mm: B" : "2 mm or more: C") + "): Grade " + dg + ".");
    } else {
      var rg = ratio < 0.25 ? "A" : ratio <= 1 ? "B" : "C";
      grade(rg, ["ratio", "rbl"], "No earlier records, so the indirect evidence: " + c.rbl + "% bone loss ÷ age " + c.age + " = " + ratio.toFixed(2) + " (under 0.25 is A, 0.25-1.0 is B, over 1.0 is C): Grade " + rg + ".");
    }
    if (c.pheno) { if (r.grade !== "C") grade("C", ["pheno"], "Destruction beyond what the biofilm explains (the 2018 table's case phenotype): Grade C."); else r.gw.push("Destruction beyond what the biofilm explains is a Grade C finding too."); }
    var up = [];
    if (c.smoke > 10) up.push(["smoke", "smoking " + c.smoke + " cigarettes a day (more than 10)"]);
    if (c.a1c != null && c.a1c >= 7) up.push(["a1c", "an HbA1c of " + c.a1c.toFixed(1) + "% (7% or higher)"]);
    var ul = cap(list(up.map(function(u){ return u[1]; })));
    if (up.length && r.grade !== "C") grade("C", up.map(function(u){ return u[0]; }), ul + " pushes it up to Grade C, whatever the " + (c.direct != null ? "records say." : "ratio says."));
    else if (up.length) r.gw.push(ul + " would push it to C anyway.");
    var light = [];
    if (c.smoke > 0 && c.smoke < 10) light.push(["smoke", "smoking " + c.smoke + " a day (under 10)"]);
    if (c.a1c != null && c.a1c < 7) light.push(["a1c", "diabetes with an HbA1c of " + c.a1c.toFixed(1) + "% (under 7%)"]);
    var ll = cap(list(light.map(function(u){ return u[1]; })));
    if (light.length && r.grade === "A") grade("B", light.map(function(u){ return u[0]; }), ll + " sits in the Grade B column of the 2018 table, so not A: Grade B. (The class's tables only list what pushes a grade to C.)");
    else if (light.length) r.gw.push(ll + " doesn't push it to C: only more than 10 a day, or an HbA1c of 7% or higher, does.");
    if (c.smoke === 10) r.gw.push("Exactly 10 a day: the 2018 table counts 10 or more toward C; the class said more than 10.");
    if (!c.smoke && c.a1c == null && !c.pheno) r.gw.push("No smoking and no diabetes: nothing pushes it up (the modifiers never move a grade down).");
    return r;
  }
  function diag(r){
    if (!r.perio) return "Gingivitis: not periodontitis";
    return (r.extent === "mip" ? "Molar/incisor pattern" : r.extent === "gen" ? "Generalized" : "Localized") + " Stage " + r.stage + ", Grade " + r.grade + " periodontitis";
  }

  /* ---------- made-up patients ---------- */
  var DECK = ["s1", "s2", "s3", "trig", "trig", "loss", "cx", "cx", "ging", "mip"];
  /* an age that gives a ratio well inside a grade's band (never near 0.25 or 1.0), or 0 when none fits */
  function ageFor(rbl, g){
    var lo = g === "A" ? 0.08 : g === "B" ? 0.34 : 1.12, hi = g === "A" ? 0.2 : g === "B" ? 0.88 : 2.4, ok = [];
    for (var a = 19; a <= 84; a++) { var x = rbl / a; if (x >= lo && x <= hi) ok.push(a); }
    return ok.length ? pick(ok) : 0;
  }
  function make(kind){
    var c = { kind: kind, ging: false, cal: 0, rbl: 0, pd: 0, lost: 0, vert: 0, furc: 0, mob: rnd(0, 1), cx: [], other: 0, mip: false, direct: null, smoke: 0, a1c: null, pheno: false, gen: Math.random() < .5 };
    if (kind === "ging") { c.ging = true; c.pd = rnd(4, 5); c.mob = 0; c.age = rnd(19, 45); c.bop = rnd(55, 85); }
    else if (kind === "s1") { c.cal = rnd(1, 2); c.rbl = rnd(10, 14); c.pd = rnd(3, 4); c.mob = 0; }
    else if (kind === "s2") { c.cal = rnd(3, 4); c.rbl = rnd(17, 30); c.pd = rnd(4, 5); }
    else if (kind === "s3") { c.cal = rnd(5, 7); c.rbl = rnd(36, 58); c.pd = rnd(6, 7); if (Math.random() < .4) c.furc = 1; }
    else if (kind === "trig") {
      c.cal = rnd(3, 4); c.rbl = rnd(18, 30); c.pd = 5;
      var t = pick(["vert", "furc", "lost"]);
      if (t === "vert") c.vert = rnd(3, 5); else if (t === "furc") c.furc = rnd(2, 3); else c.lost = rnd(1, 3);
    }
    else if (kind === "loss") { c.cal = rnd(6, 9); c.rbl = rnd(45, 70); c.pd = rnd(6, 9); c.lost = rnd(5, 7); c.gen = Math.random() < .7; }
    else if (kind === "cx") {
      c.cal = rnd(5, 8); c.rbl = rnd(38, 62); c.pd = rnd(6, 8); c.lost = rnd(0, 3); c.gen = Math.random() < .7;
      var k = pick(["mast", "mob", "bite", "ridge", "teeth"]);
      if (k === "mob") c.mob = 2; else if (k === "teeth") { c.lost = rnd(2, 4); c.other = 28 - c.lost - (19 - rnd(0, 1)); } else c.cx = [k];
      if (Math.random() < .35) c.furc = 2;
    }
    else if (kind === "mip") { c.mip = true; c.cal = rnd(5, 7); c.rbl = rnd(34, 48); c.pd = rnd(6, 7); c.age = rnd(16, 24); }
    /* the grade's evidence: the ratio, earlier films, or a modifier on a Grade B ratio */
    if (!c.ging && !c.mip) {
      var feas = ["A", "B", "C"].filter(function(g){ return ageFor(c.rbl, g); }), route = pick(["ratio", "ratio", "direct", "smoke", "a1c", "light"]);
      if (route !== "ratio" && route !== "direct" && feas.indexOf("B") < 0) route = "ratio";
      var g = route === "ratio" || route === "direct" ? pick(feas) : "B";
      c.age = ageFor(c.rbl, g);
      if (route === "direct") c.direct = g === "A" ? 0 : g === "B" ? 1 : rnd(3, 4);
      if (route === "smoke") c.smoke = pick([15, 20, 20, 25, 30]);
      if (route === "a1c") c.a1c = rnd(75, 98) / 10;
      if (route === "light") { if (Math.random() < .5) c.smoke = rnd(3, 6); else c.a1c = rnd(61, 68) / 10; }
    }
    /* the mouth: which teeth are lost, missing for other reasons, and involved */
    var chart = {}, lostT = [], otherT = [];
    ALL.forEach(function(n){ chart[n] = "ok"; });
    var present = mix(ALL).filter(function(n){
      if (lostT.length < c.lost && !(c.mip && (FIRST.indexOf(n) > -1 || INC.indexOf(n) > -1))) { lostT.push(n); chart[n] = "lost"; return false; }
      if (otherT.length < c.other) { otherT.push(n); chart[n] = "other"; return false; }
      return true;
    });
    c.teeth = present.length; lostT.sort(function(a, b){ return a - b; }); otherT.sort(function(a, b){ return a - b; });
    if (c.ging) { c.affected = 0; c.worst = pick(present.filter(function(n){ return type(n) !== "m"; })); }
    else if (c.mip) {
      var inv = mix(present.filter(function(n){ return FIRST.indexOf(n) > -1; })).slice(0, rnd(2, 4)).concat(mix(present.filter(function(n){ return INC.indexOf(n) > -1; })).slice(0, rnd(2, 5)));
      inv.forEach(function(n){ chart[n] = "inv"; }); c.affected = inv.length;
      c.worst = pick(inv.filter(function(n){ return FIRST.indexOf(n) > -1; }));
    } else {
      var n = c.gen ? Math.round(c.teeth * (0.36 + Math.random() * 0.45)) : Math.round(c.teeth * (0.1 + Math.random() * 0.14));
      n = Math.min(c.teeth, Math.max(2, n));
      var ord = present.slice(); if (c.furc >= 1) ord.sort(function(a, b){ return (type(b) === "m") - (type(a) === "m"); });
      var invd = ord.slice(0, n); invd.forEach(function(t){ chart[t] = "inv"; }); c.affected = n;
      /* a molar whose bone is down past its root trunk would show its furcation, so without one the worst tooth isn't a molar */
      c.worst = c.furc >= 1 ? invd.filter(function(t){ return type(t) === "m"; })[0] || invd[0] : c.rbl > 30 ? invd.filter(function(t){ return type(t) !== "m"; })[0] || invd[0] : invd[0];
    }
    if (c.furc && type(c.worst) !== "m") c.furc = 0;
    if (!c.ging) chart[c.worst] = "worst";
    c.chart = chart; c.lostT = lostT; c.otherT = otherT;
    c.site = pick(["mesial", "distal"]);
    return c;
  }
  /* a case whose extent doesn't sit near the 30% line */
  function deal(kind){
    for (var i = 0; i < 40; i++) {
      var c = make(kind);
      if (!c.ging && !c.mip) { var p = c.affected / c.teeth * 100; if (p > 25 && p < 35) continue; }
      if (!c.ging && !c.age) continue;
      return c;
    }
    return make("s2");
  }

  /* ---------- the drawings ---------- */
  function keyed(keys){ return function(k){ return keys && keys.indexOf(k) > -1 ? " is-key" : ""; }; }
  /* a tooth's facial outline in its own frame: x 0 (distal) to w (mesial), y 0 at the CEJ, the crown toward +y (the
     biting edge) and the root toward -y. Incisors have a straight incisal edge (the central's mesial corner sharp, the
     lateral's rounder), a canine one pointed cusp with the shorter slope mesial, a premolar one buccal cusp (the upper first
     premolar's root splits near its tip), an upper molar two buccal cusps and roots with the palatal root showing between
     them, a lower first molar three buccal cusps (mesiobuccal, distobuccal, distal) and a lower molar two roots, mesial and
     distal. The facial CEJ curves toward the root. */
  var OCC = {
    inc: [0, .72, "Q", .01, .97, .17, 1, "L", .9, 1, "Q", 1, 1, 1, .8],
    inc2: [0, .68, "Q", .02, .98, .25, 1, "L", .82, 1, "Q", 1, 1, 1, .76],
    can: [0, .55, "Q", .14, .86, .55, 1, "Q", .88, .9, 1, .68],
    pm1: [0, .6, "Q", .14, .9, .46, 1, "Q", .84, .92, 1, .64],
    pm: [0, .6, "Q", .15, .9, .5, 1, "Q", .86, .9, 1, .64],
    um: [0, .55, "Q", .02, .93, .26, .98, "Q", .42, .98, .5, .86, "Q", .57, .99, .74, 1, "Q", .97, .99, 1, .62],
    lm1: [0, .58, "Q", .01, .88, .13, .92, "Q", .21, .92, .26, .83, "Q", .31, .98, .45, .98, "Q", .56, .98, .6, .86, "Q", .65, 1, .79, 1, "Q", .98, 1, 1, .64],
    lm: [0, .56, "Q", .02, .94, .27, .98, "Q", .43, .98, .5, .87, "Q", .57, .99, .74, 1, "Q", .97, .99, 1, .62]
  };
  function toothShape(d){
    var W = d.w, C = d.cr, R = d.rt, xd = W * (1 - d.cv) / 2, xm = W - xd, o = OCC[d.kind], i = 2;
    function p(x, y){ return (Math.round(x * 10) / 10) + " " + (Math.round(y * 10) / 10); }
    var s = "M" + p(xd, 0) + " C" + p(xd - .06 * W, .3 * C) + " " + p(0, (o[1] - .3) * C) + " " + p(0, o[1] * C);
    while (i < o.length) {
      if (o[i] === "L") { s += " L" + p(o[i + 1] * W, o[i + 2] * C); i += 3; }
      else { s += " Q" + p(o[i + 1] * W, o[i + 2] * C) + " " + p(o[i + 3] * W, o[i + 4] * C); i += 5; }
    }
    var mc = o[o.length - 1];
    s += " C" + p(W, (mc - .3) * C) + " " + p(xm + .06 * W, .3 * C) + " " + p(xm, 0);
    /* the roots, from the mesial cervix round to the distal one. A root runs up its mesial side from (sx, sy), rounds its
       apex (ax, ay) and comes down its distal side to (ex, ey); a side that starts or ends at a furcation (fur) meets it
       level, so the furcation is a dome, not a spike */
    function root(sx, sy, ax, ay, ex, ey, rad, furS, furE){
      return " C" + (furS ? p(sx - furS, sy) : p(sx + .02 * W, sy + (ay - sy) * .4)) + " " + p(ax + rad + (sx - ax - rad) * .35, ay + rad + (sy - ay) * .22) + " " + p(ax + rad, ay + rad) +
        " C" + p(ax + rad, ay - rad * .45) + " " + p(ax - rad, ay - rad * .45) + " " + p(ax - rad, ay + rad) +
        " C" + p(ax - rad - (ax - rad - ex) * .35, ay + rad + (ey - ay) * .22) + " " + (furE ? p(ex + furE, ey) : p(ex - .02 * W, ey + (ay - ey) * .4)) + " " + p(ex, ey);
    }
    var back = "", k = d.kind, rad;
    if (k === "um") {
      rad = .07 * W;
      s += root(xm, 0, .75 * W, -.95 * R, .5 * W, -.3 * R, rad, 0, .1 * W) + root(.5 * W, -.3 * R, .25 * W, -.86 * R, xd, 0, rad, .1 * W, 0);
      back = "M" + p(.33 * W, -.2 * R) + " C" + p(.31 * W, -.65 * R) + " " + p(.4 * W, -.98 * R) + " " + p(.46 * W, -1.03 * R) +
        " Q" + p(.5 * W, -1.07 * R) + " " + p(.54 * W, -1.03 * R) + " C" + p(.6 * W, -.98 * R) + " " + p(.69 * W, -.65 * R) + " " + p(.67 * W, -.2 * R) + " Z";
    } else if (k === "lm" || k === "lm1") {
      rad = .07 * W;
      s += root(xm, 0, .7 * W, -R, .47 * W, -.27 * R, rad, 0, .1 * W) + root(.47 * W, -.27 * R, .21 * W, -.95 * R, xd, 0, rad, .1 * W, 0);
    } else if (k === "pm1") {
      rad = .07 * W;
      s += root(xm, 0, .63 * W, -R, .5 * W, -.64 * R, rad, 0, .05 * W) + root(.5 * W, -.64 * R, .37 * W, -.97 * R, xd, 0, rad, .05 * W, 0);
    } else s += root(xm, 0, .46 * W, -R, xd, 0, Math.max(1.6, .1 * W), 0, 0);
    var dip = (k === "inc" || k === "inc2" ? 1.5 : k === "can" ? 1.3 : k === "pm" || k === "pm1" ? 1 : .6) * S;
    return { d: s + " Z", back: back, cej: "M" + p(xd, 0) + " Q" + p(W / 2, -2 * dip) + " " + p(xm, 0) };
  }
  function mouthSVG(c, keys){
    /* the biting edges meet the middle band (upper at YU, lower at YL), the roots run out to the edges */
    var on = keyed(keys), gap = 2, YU = 105, YL = 141, H = 248, s = "";
    function r1(v){ return Math.round(v * 10) / 10; }
    function row(nums, top){
      var x = (440 - nums.reduce(function(a, n){ return a + width(n) + gap; }, -gap)) / 2;
      nums.forEach(function(n){
        var d = dims(n), w = d.w, st = c.chart[n], flip = top ? n >= 9 : n <= 24, sh = toothShape(d);
        var cej = top ? YU - d.cr : YL + d.cr, apex = top ? cej - d.rt : cej + d.rt, occ = top ? YU : YL;
        var cls = "stg-t stg-" + st + (st === "lost" ? on("lost") : st === "other" ? on("teeth") : st === "inv" || st === "worst" ? on("ext") : "");
        s += '<g class="' + cls + '"><title>#' + n + (st === "lost" ? ", lost to periodontitis" : st === "other" ? ", missing for another reason" : st === "inv" ? ", attachment loss" : st === "worst" ? ", the worst tooth" : "") + "</title>" +
          '<g transform="translate(' + r1(flip ? x + w : x) + " " + r1(cej) + ") scale(" + (flip ? -1 : 1) + " " + (top ? 1 : -1) + ')">' +
          (sh.back ? '<path class="stg-tt" d="' + sh.back + '"/>' : "") + '<path class="stg-tt" d="' + sh.d + '"/>' +
          (st === "lost" || st === "other" ? "" : '<path class="stg-cejl" d="' + sh.cej + '"/>') + "</g>";
        var y1 = Math.min(apex, occ) + 6, y2 = Math.max(apex, occ) - 6;
        if (st === "lost") s += '<path class="stg-x" d="M' + r1(x + 3) + " " + r1(y1) + "L" + r1(x + w - 3) + " " + r1(y2) + "M" + r1(x + w - 3) + " " + r1(y1) + "L" + r1(x + 3) + " " + r1(y2) + '"/>';
        if (st === "worst") { var py = top ? apex - 13 : apex + 13, tip = top ? apex - 4 : apex + 4;
          s += '<path class="stg-pin' + on("cal") + '" d="M' + r1(x + w / 2 - 6) + " " + r1(py) + "L" + r1(x + w / 2 + 6) + " " + r1(py) + "L" + r1(x + w / 2) + " " + r1(tip) + 'Z"/>'; }
        if (st === "worst" || st === "lost") s += '<text class="stg-num" x="' + r1(x + w / 2) + '" y="' + (top ? YU + 16 : YL - 6) + '" text-anchor="middle">' + n + "</text>";
        s += "</g>";
        x += w + gap;
      });
    }
    row(UP, true); row(LO, false);
    s += '<text class="stg-lab" x="10" y="128">R</text><text class="stg-lab" x="430" y="128" text-anchor="end">L</text>';
    return '<svg class="stg-mouth' + on("ext") + '" viewBox="0 0 440 ' + H + '" role="img" aria-label="' + esc(mouthLabel(c)) + '">' + s + "</svg>";
  }
  function mouthLabel(c){
    var a = "The mouth, upper teeth on top, as seen facing the patient: " + c.teeth + " teeth present";
    if (!c.ging) a += ", " + c.affected + " with attachment loss" + (c.mip ? " (first molars and incisors only)" : "") + ", the worst #" + c.worst;
    if (c.lostT.length) a += ", " + pl(c.lostT.length, "tooth", "teeth") + " lost to periodontitis (#" + c.lostT.join(", #") + ")";
    if (c.otherT.length) a += ", " + c.otherT.length + " missing for other reasons";
    return a + ".";
  }
  /* the worst tooth's film: the root runs from the CEJ (y 70) to the apex (y 262); bone loss is a share of that length */
  function filmSVG(c, keys){
    var on = keyed(keys), molar = type(c.worst) === "m", CEJ = 70, APEX = 262, L = APEX - CEJ, cx = 104, s = "";
    var crest = c.ging ? CEJ + 16 : CEJ + Math.max(16, c.rbl / 100 * L), vert = c.vert ? Math.min(c.vert * 16, 276 - crest) : 0;
    var rootX = molar ? cx - 46 : cx - 24;
    s += '<rect class="stg-bg" x="0" y="0" width="240" height="290" rx="12"/>';
    /* the bone, its crest at the bone level; a vertical defect is a wedge down the root on the near side */
    var d = "M6 " + crest + (vert ? " L" + (rootX - 34) + " " + crest + " L" + (rootX + 3) + " " + (crest + vert) + " L" + (rootX + 3) + " " + crest : "") + " L234 " + crest + " L234 284 L6 284 Z";
    s += '<path class="stg-bone" d="' + d + '"/>';
    for (var i = 0; i < 10; i++) { var tx = 12 + i * 23; s += '<path class="stg-trab" d="M' + tx + " 282 Q" + (tx + 12) + " " + Math.min(276, crest + 46 + (i % 3) * 20) + " " + (tx + 4) + " " + Math.min(280, crest + 16) + '"/>'; }
    /* the tooth: enamel brightest, then the root; a molar has two roots and a furcation */
    var root = molar
      ? "M" + (cx - 46) + " " + CEJ + " C" + (cx - 49) + " 150 " + (cx - 40) + " 222 " + (cx - 27) + " " + APEX + " C" + (cx - 18) + " " + (APEX - 6) + " " + (cx - 13) + " 166 " + (cx - 5) + " 138 L" + (cx + 5) + " 138 C" + (cx + 13) + " 166 " + (cx + 18) + " " + (APEX - 6) + " " + (cx + 27) + " " + APEX + " C" + (cx + 40) + " 222 " + (cx + 49) + " 150 " + (cx + 46) + " " + CEJ + " Z"
      : "M" + (cx - 24) + " " + CEJ + " C" + (cx - 26) + " 160 " + (cx - 14) + " 232 " + cx + " " + APEX + " C" + (cx + 14) + " 232 " + (cx + 26) + " 160 " + (cx + 24) + " " + CEJ + " Z";
    var crown = molar
      ? "M" + (cx - 46) + " " + CEJ + " L" + (cx - 52) + " 32 Q" + (cx - 50) + " 14 " + (cx - 30) + " 16 Q" + (cx - 14) + " 24 " + cx + " 18 Q" + (cx + 14) + " 24 " + (cx + 30) + " 16 Q" + (cx + 50) + " 14 " + (cx + 52) + " 32 L" + (cx + 46) + " " + CEJ + " Z"
      : "M" + (cx - 24) + " " + CEJ + " L" + (cx - 28) + " 28 Q" + cx + " 6 " + (cx + 28) + " 28 L" + (cx + 24) + " " + CEJ + " Z";
    s += '<path class="stg-root" d="' + root + '"/><path class="stg-crown" d="' + crown + '"/>';
    s += '<path class="stg-pulp" d="' + (molar ? "M" + (cx - 26) + " 58 Q" + cx + " 50 " + (cx + 26) + " 58 L" + (cx + 22) + " 118 L" + (cx - 22) + " 118 Z" : "M" + (cx - 7) + " 46 Q" + cx + " 40 " + (cx + 7) + " 46 L" + (cx + 3) + " 236 L" + (cx - 3) + " 236 Z") + '"/>';
    /* bone between the roots up to just under the fornix: a furcation still closed (none, or Class I) */
    if (molar && c.furc < 2 && crest > 144) { var hw = Math.min(16, 5 + (crest - 138) * 0.3); s += '<path class="stg-bone" d="M' + (cx - 6) + " 145 Q" + cx + " 140 " + (cx + 6) + " 145 L" + (cx + hw) + " " + crest + " L" + (cx - hw) + " " + crest + ' Z"/>'; }
    /* the furcation: Class II a radiolucency partway between the roots, Class III through and through */
    if (molar && c.furc >= 2) {
      var fd = c.furc === 3 ? Math.max(70, crest + 30 - 138) : 26;
      s += '<path class="stg-furc' + on("furc") + '" d="M' + (cx - 5) + " 139 L" + (cx + 5) + " 139 C" + (cx + 12) + " " + (150 + fd / 3) + " " + (cx + 15) + " " + (139 + fd * .8) + " " + (cx + 14) + " " + (139 + fd) + " Q" + cx + " " + (147 + fd) + " " + (cx - 14) + " " + (139 + fd) + " C" + (cx - 15) + " " + (139 + fd * .8) + " " + (cx - 12) + " " + (150 + fd / 3) + " " + (cx - 5) + ' 139 Z"/>';
      s += '<text class="stg-tag' + on("furc") + '" x="' + (cx + 18) + '" y="' + Math.round(139 + fd / 2 + 5) + '">Class ' + ROMAN[c.furc] + "</text>";
    }
    /* the root's thirds, from the CEJ to the apex */
    var t1 = CEJ + L / 3, t2 = CEJ + 2 * L / 3;
    s += '<g class="stg-thirds' + on("rbl") + '"><path d="M204 ' + CEJ + "V" + APEX + [CEJ, t1, t2, APEX].map(function(y){ return "M198 " + y + "H210"; }).join("") + '"/>' +
      '<text x="216" y="' + ((CEJ + t1) / 2 + 5) + '">C</text><text x="216" y="' + ((t1 + t2) / 2 + 5) + '">M</text><text x="216" y="' + ((t2 + APEX) / 2 + 5) + '">A</text></g>';
    s += '<path class="stg-cej" d="M' + (cx - 58) + " " + CEJ + "H194" + '"/><text class="stg-tag" x="' + (cx - 62) + '" y="' + (CEJ + 5) + '" text-anchor="end">CEJ</text>';
    s += '<path class="stg-crest' + on("rbl") + '" d="M6 ' + crest + "H194" + '"/>';
    s += '<text class="stg-tag' + on("rbl") + '" x="12" y="' + (crest - 7) + '">' + (c.ging ? "Normal bone" : c.rbl + "% bone loss") + "</text>";
    if (vert) s += '<path class="stg-vline' + on("vert") + '" d="M' + (rootX - 4) + " " + crest + "V" + (crest + vert) + '"/><text class="stg-tag' + on("vert") + '" x="12" y="' + Math.min(282, crest + vert + 18) + '">' + c.vert + " mm vertical</text>";
    return '<svg class="stg-film" viewBox="0 0 240 290" role="img" aria-label="' + esc(filmLabel(c)) + '">' + s + "</svg>";
  }
  function filmLabel(c){
    if (c.ging) return "A film of #" + c.worst + ": the bone crest at its normal level, about 1 mm below the CEJ.";
    return "A film of #" + c.worst + ", the worst tooth: " + c.rbl + "% bone loss, " + (c.rbl > 33 ? "into the middle third of the root" : "in the coronal third") +
      (c.vert ? ", a " + c.vert + " mm vertical defect" : "") + (c.furc >= 2 && type(c.worst) === "m" ? ", a Class " + ROMAN[c.furc] + " furcation" : "") + ".";
  }
  function factsHTML(c, keys){
    var on = keyed(keys);
    var row = function(k, label, val, x){ return '<div class="stg-f' + on(k) + (x || "") + '"><dt>' + label + "</dt><dd>" + esc(val) + "</dd></div>"; };
    var who = c.age + " years old · " + (c.smoke ? "smokes " + c.smoke + " cigarettes a day" : "doesn't smoke") + " · " + (c.a1c != null ? "type 2 diabetes, HbA1c " + c.a1c.toFixed(1) + "%" : "no diabetes");
    var h = '<dl class="stg-facts">' + row("who", "Patient", who, on("smoke") + on("a1c") + on("ratio"));
    if (c.ging) {
      h += row("pd", "Probing", "Pockets of " + c.pd + " mm at many sites; bleeding at " + c.bop + "% of sites") +
        row("cal", "Attachment", "No recession, and the CEJ can't be felt in the pockets: no attachment loss") +
        row("rbl", "Films", "Bone at its normal level everywhere");
    } else {
      h += row("cal", "Worst interdental CAL", c.cal + " mm, #" + c.worst + " " + c.site) +
        row("rbl", "Bone loss at #" + c.worst, c.rbl + "% of the root (" + (c.rbl > 33 ? "middle third" : "coronal third") + ")") +
        row("pd", "Deepest probing depth", c.pd + " mm") +
        row("vert", "Vertical defect", c.vert ? c.vert + " mm, #" + c.worst + " " + c.site : "None: horizontal bone loss") +
        row("furc", "Furcation", c.furc ? "Class " + ROMAN[c.furc] + " on #" + c.worst : "None") +
        row("lost", "Teeth lost to periodontitis", c.lostT.length ? c.lostT.length + " (#" + c.lostT.join(", #") + ")" : "None") +
        row("mob", "Mobility", c.mob ? "Up to degree " + c.mob : "None") +
        row("teeth", "Teeth present", c.teeth + " of 28" + (c.otherT.length ? " (" + c.otherT.length + " lost to caries or trauma)" : "")) +
        row("cx", "Function and ridges", c.cx.length ? cap(c.cx.map(function(k){ return CX[k]; }).join("; ")) : "Chews comfortably; no drifting or flaring; ridges fine") +
        row("ext", "Teeth with attachment loss", c.affected + " of " + c.teeth + (c.mip ? " (first molars and incisors)" : "")) +
        row("direct", "Earlier records", c.direct == null ? "None: a first visit" : c.direct === 0 ? "Films from 5 years ago: no bone loss since" : "Films from 5 years ago: " + c.direct + " mm more bone loss since");
    }
    return h + "</dl>";
  }
  function vizHTML(c, keys){
    return '<div class="stg-viz"><figure class="stg-fig"><figcaption>The mouth</figcaption>' + mouthSVG(c, keys) +
      '<p class="stg-legend"><span><i class="k-inv"></i>attachment loss</span><span><i class="k-worst"></i>worst tooth</span><span><i class="k-lost"></i>lost to periodontitis</span>' + (c.otherT.length ? '<span><i class="k-other"></i>lost to caries or trauma</span>' : "") + "</p></figure>" +
      '<figure class="stg-fig stg-filmfig"><figcaption>' + (c.ging ? "A film, #" + c.worst : "The worst tooth, #" + c.worst) + "</figcaption>" + filmSVG(c, keys) + "</figure></div>";
  }

  /* ---------- the game ---------- */
  var OPTS = {
    stage: [["0", "Not periodontitis"], ["1", "Stage 1"], ["2", "Stage 2"], ["3", "Stage 3"], ["4", "Stage 4"]],
    extent: [["loc", "Localized"], ["gen", "Generalized"], ["mip", "Molar/incisor pattern"]],
    grade: [["A", "Grade A"], ["B", "Grade B"], ["C", "Grade C"]]
  };
  var STEPS = [["stage", "1. The stage"], ["extent", "2. The extent"], ["grade", "3. The grade"]];
  function label(k, v){ var x = OPTS[k].filter(function(y){ return y[0] === v; })[0]; return x ? x[1] : v; }
  function mount(host, o){
    o = o || {};
    var st = null, root = null, EX = null;
    host.innerHTML = '<section class="stg' + (o.arcade ? " stg-in-arcade" : "") + '" aria-label="Stage and Grade">' +
      (o.arcade ? "" : '<div class="stg-head"><div class="stg-head-t"><h2 class="stg-title">Stage &amp; Grade</h2><p class="stg-sub">Ten made-up patients: call the stage, the extent and the grade the way Session 1 taught it. Or set every criterion yourself and watch the diagnosis follow.</p></div>' +
        '<div class="stg-tabs" role="group" aria-label="Stage and Grade"><button type="button" class="stg-tab" data-stg="play" aria-pressed="false">Play 10 cases</button><button type="button" class="stg-tab" data-stg="explore" aria-pressed="false">Explore the rules</button>' +
        '<button type="button" class="stg-tab stg-close" data-stg="close" hidden>Close</button></div></div>') +
      '<div class="stg-body"></div></section>';
    root = host.querySelector(".stg");
    root.addEventListener("click", click);
    root.addEventListener("input", input);
    function body(){ return root.querySelector(".stg-body"); }
    function tab(which){
      [].forEach.call(root.querySelectorAll(".stg-tab[data-stg]"), function(b){ if (b.getAttribute("data-stg") !== "close") b.setAttribute("aria-pressed", String(b.getAttribute("data-stg") === which)); });
      var x = root.querySelector('[data-stg="close"]'); if (x) x.hidden = !which;
      root.classList.toggle("is-open", !!which);
    }
    function intro(){
      tab(""); st = null;
      var s = saved();
      body().innerHTML = s.plays ? '<p class="stg-best">Your best: <b>' + s.best + "</b> of 400 · played " + pl(s.plays, "time") + "</p>" : "";
    }
    function start(){
      tab("play");
      var deck = mix(DECK); if (deck[0] === "ging" || deck[0] === "mip") deck.push(deck.shift());
      st = { mode: "play", i: 0, score: 0, right: 0, steps: 0, missed: [], deck: deck };
      if (o.onStart) o.onStart();
      deal1();
    }
    function deal1(){ st.c = deal(st.deck[st.i]); st.r = rules(st.c); st.a = {}; st.got = 0; st.keys = []; st.done = false; draw(false); }
    function rightOf(k){ return k === "stage" ? String(st.r.stage) : k === "extent" ? st.r.extent : st.r.grade; }
    function draw(focus){
      var c = st.c, r = st.r, a = st.a;
      var h = '<div class="stg-hud"><span>Case <b>' + (st.i + 1) + "</b> of " + ROUNDS + "</span><span>Score <b>" + st.score + "</b></span>" + (o.arcade ? "" : "<span>Best <b>" + saved().best + "</b></span>") + "</div>" +
        '<div class="stg-case">' + vizHTML(c, st.keys) + factsHTML(c, st.keys) + '</div><div class="stg-steps">';
      STEPS.forEach(function(s, k){
        var key = s[0], show = k === 0 || (r.perio && a[STEPS[k - 1][0]] != null);
        if (!show) return;
        var ans = a[key], right = rightOf(key);
        h += '<div class="stg-step" data-step="' + key + '"><h3>' + s[1] + '</h3><div class="stg-opts">' + OPTS[key].map(function(x){
          var cls = ans == null ? "" : x[0] === right ? " is-right" : x[0] === ans ? " is-wrong" : " is-off";
          return '<button type="button" class="stg-opt' + cls + '" data-pick="' + key + ":" + x[0] + '"' + (ans != null ? " disabled" : "") + ">" + x[1] + "</button>";
        }).join("") + "</div>" + (ans != null ? whyHTML(key) : "") + "</div>";
      });
      h += "</div>";
      if (st.done) h += '<div class="stg-done"><p class="stg-diag">' + esc(diag(r)) + "</p>" + (st.got === (r.perio ? 3 : 1) ? '<p class="stg-bonus">Every call right: +10</p>' : "") +
        '<button type="button" class="stg-btn stg-primary" data-stg="next">' + (st.i + 1 < ROUNDS ? "Next case" : "See your score") + "</button></div>";
      body().innerHTML = h;
      if (o.onScore) o.onScore(st.score);
      if (focus) { var f = body().querySelector(st.done ? '[data-stg="next"]' : ".stg-step:last-child .stg-opt:not([disabled])"); if (f) f.focus({ preventScroll: true }); }
    }
    function whyHTML(k){
      var r = st.r, ok = st.a[k] === rightOf(k), w = k === "stage" ? r.sw : k === "extent" ? r.ew : r.gw;
      return '<div class="stg-why ' + (ok ? "ok" : "no") + '" role="status"><p class="stg-verdict">' + (ok ? "Right: " : "Not quite. It's ") + esc(label(k, rightOf(k))) + "</p><ul>" + w.map(li).join("") + "</ul></div>";
    }
    function answer(k, v){
      if (!st || st.done || st.a[k] != null) return;
      var r = st.r, ok = v === rightOf(k);
      st.a[k] = v; st.steps++;
      st.keys = k === "stage" ? r.sk : k === "extent" ? r.ek : r.gk;
      if (ok) { st.got++; st.right++; st.score += r.perio ? 10 : 30; }
      else st.missed.push({ q: "Case " + (st.i + 1) + ", the " + k, a: label(k, rightOf(k)) + ". " + (k === "stage" ? r.sd : k === "extent" ? r.ed : r.gd) });
      if ((k === "stage" && !r.perio) || k === "grade") { st.done = true; if (st.got === (r.perio ? 3 : 1)) st.score += 10; }
      draw(true);
    }
    function next(){
      if (st.i + 1 >= ROUNDS) { end(); return; }
      st.i++; deal1();
      var top = root.querySelector(".stg-hud"); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start" });
      var f = body().querySelector(".stg-opt"); if (f) f.focus({ preventScroll: true });
    }
    function end(){
      var s = saved(), best = st.score > s.best; s.plays = (s.plays || 0) + 1; if (best) s.best = st.score; try { saveState(); } catch (e) {}
      var fin = st; st = null;
      if (o.onFinish) { body().innerHTML = '<div class="stg-end"><p class="stg-big">' + fin.score + " <small>of 400</small></p></div>"; o.onFinish(fin.score, fin.missed); return; }
      body().innerHTML = '<div class="stg-end"><p class="stg-big">' + fin.score + ' <small>of 400</small></p><p>' + (best ? "A new best. " : "Your best: " + s.best + ". ") + fin.right + " of " + fin.steps + " calls right.</p>" +
        (fin.missed.length ? '<div class="stg-missed"><h3>What you missed</h3><ul>' + fin.missed.map(function(m){ return "<li><b>" + esc(m.q) + ":</b> " + esc(m.a) + "</li>"; }).join("") + "</ul></div>" : "<p>Nothing missed.</p>") +
        '<div class="stg-row"><button type="button" class="stg-btn stg-primary" data-stg="play">Play again</button><button type="button" class="stg-btn" data-stg="explore">Explore the rules</button></div></div>';
      var f = body().querySelector('[data-stg="play"]'); if (f) f.focus({ preventScroll: true });
    }

    /* ---------- explore: every criterion, live ---------- */
    function explore(){
      tab("explore"); st = { mode: "explore" };
      if (!EX) EX = { age: 45, cal: 4, rbl: 25, pd: 5, lost: 0, vert: 0, furc: "0", mob: 1, cx: [], teeth: 28, pct: 40, mip: false, direct: "none", smoke: "0", a1c: "none", pheno: false };
      body().innerHTML = '<div class="stg-explore"><form class="stg-ctrl" onsubmit="return false">' +
        group("Severity", slider("cal", "Worst interdental CAL", 0, 10, "mm") + slider("rbl", "Bone loss at the worst tooth", 0, 80, "% of the root") + slider("pd", "Deepest probing depth", 2, 10, "mm")) +
        group("Findings that force Stage 3", slider("vert", "Vertical defect", 0, 6, "mm") + seg("furc", "Furcation", [["0", "None"], ["1", "Class I"], ["2", "Class II"], ["3", "Class III"]]) + slider("lost", "Teeth lost to periodontitis", 0, 8, "")) +
        group("Stage 4: complex rehabilitation", checks([["mast", "Masticatory dysfunction"], ["mob2", "Mobility degree 2 or more"], ["bite", "Bite collapse, drifting, flaring"], ["ridge", "Severe ridge defect"]]) + slider("teeth", "Teeth present", 12, 28, "of 28")) +
        group("Extent", slider("pct", "Teeth with attachment loss", 4, 100, "%") + checks([["mip", "Only first molars and incisors (molar/incisor pattern)"]])) +
        group("Grade", slider("age", "Age", 16, 85, "years") + seg("direct", "Films from 5 years ago", [["none", "None"], ["0", "No loss"], ["1", "Under 2 mm"], ["3", "2 mm or more"]]) +
          seg("smoke", "Smoking", [["0", "No"], ["5", "Under 10 a day"], ["10", "10 a day"], ["20", "More than 10"]]) + seg("a1c", "Diabetes", [["none", "No"], ["6.5", "HbA1c under 7%"], ["8", "HbA1c 7% or higher"]]) +
          checks([["pheno", "Destruction beyond what the biofilm explains (2018 table)"]])) +
        '</form><div class="stg-out" aria-live="polite"></div></div>';
      sync(); out();
    }
    function group(t, inner){ return '<fieldset class="stg-g"><legend>' + t + "</legend>" + inner + "</fieldset>"; }
    function slider(k, t, a, b, unit){ return '<label class="stg-sl"><span>' + t + ' <b data-v="' + k + '"></b> ' + unit + '</span><input type="range" min="' + a + '" max="' + b + '" step="1" data-x="' + k + '"></label>'; }
    function seg(k, t, opts){ return '<div class="stg-seg"><span id="stg-' + k + '">' + t + '</span><div role="group" aria-labelledby="stg-' + k + '">' + opts.map(function(x){ return '<button type="button" data-xs="' + k + ":" + x[0] + '" aria-pressed="false">' + x[1] + "</button>"; }).join("") + "</div></div>"; }
    function checks(opts){ return opts.map(function(x){ return '<label class="stg-ck"><input type="checkbox" data-xc="' + x[0] + '"><span>' + x[1] + "</span></label>"; }).join(""); }
    function sync(){
      var b = body();
      EX.teeth = Math.min(EX.teeth, 28 - EX.lost);
      [].forEach.call(b.querySelectorAll("[data-x]"), function(i){ var k = i.getAttribute("data-x"); i.value = EX[k]; var v = b.querySelector('[data-v="' + k + '"]'); if (v) v.textContent = EX[k]; });
      [].forEach.call(b.querySelectorAll("[data-xs]"), function(x){ var p = x.getAttribute("data-xs").split(":"); x.setAttribute("aria-pressed", String(String(EX[p[0]]) === p[1])); });
      [].forEach.call(b.querySelectorAll("[data-xc]"), function(x){ var k = x.getAttribute("data-xc"); x.checked = k === "mip" ? EX.mip : k === "pheno" ? EX.pheno : k === "mob2" ? EX.mob >= 2 : EX.cx.indexOf(k) > -1; });
    }
    /* the drawing for a built case: #19 is the worst tooth; teeth come off in a fixed order, and the teeth with
       attachment loss spread around the mouth in a fixed order too */
    var OFF = [31, 2, 15, 18, 13, 4, 29, 20, 12, 5, 28, 21, 3, 14, 30, 6, 11, 22, 27, 7, 10, 23, 26, 8, 9, 24, 25];
    var SPREAD = ALL.slice().sort(function(a, b){ return (a * 11) % 29 - (b * 11) % 29; });
    function exCase(){
      var ging = EX.cal === 0;
      var c = { ging: ging, cal: EX.cal, rbl: ging ? 0 : EX.rbl, pd: EX.pd, lost: EX.lost, vert: ging ? 0 : EX.vert, furc: ging ? 0 : +EX.furc, mob: EX.mob, cx: EX.cx.slice(), mip: EX.mip, age: EX.age,
        direct: EX.direct === "none" ? null : +EX.direct, smoke: +EX.smoke, a1c: EX.a1c === "none" ? null : +EX.a1c, pheno: EX.pheno, site: "distal", worst: 19, bop: 70 };
      var chart = {}, lostT = [], otherT = [], other = Math.max(0, 28 - EX.teeth - EX.lost);
      ALL.forEach(function(n){ chart[n] = "ok"; });
      OFF.forEach(function(n){ if (lostT.length < EX.lost) { lostT.push(n); chart[n] = "lost"; } else if (otherT.length < other) { otherT.push(n); chart[n] = "other"; } });
      var present = ALL.filter(function(n){ return chart[n] === "ok"; });
      c.teeth = present.length; c.lostT = lostT.sort(function(a, b){ return a - b; }); c.otherT = otherT;
      if (ging) c.affected = 0;
      else {
        chart[19] = "worst";
        if (c.mip) { var inv = present.filter(function(n){ return n !== 19 && (FIRST.indexOf(n) > -1 || INC.indexOf(n) > -1); }); inv.forEach(function(n){ chart[n] = "inv"; }); c.affected = inv.length + 1; }
        else { var n = Math.max(1, Math.round(c.teeth * EX.pct / 100)); SPREAD.filter(function(t){ return t !== 19 && chart[t] === "ok"; }).slice(0, n - 1).forEach(function(t){ chart[t] = "inv"; }); c.affected = n; }
      }
      c.chart = chart;
      return c;
    }
    function out(){
      var c = exCase(), r = rules(c), all = r.sk.concat(r.ek, r.gk), o2 = body().querySelector(".stg-out"); if (!o2) return;
      o2.innerHTML = '<p class="stg-diag">' + esc(diag(r)) + "</p>" + vizHTML(c, all) +
        '<div class="stg-whys"><h3>' + (r.perio ? "Why Stage " + r.stage : "Why it isn't periodontitis") + "</h3><ul>" + r.sw.map(li).join("") + "</ul>" +
        (r.perio ? "<h3>Why " + esc(label("extent", r.extent).toLowerCase()) + "</h3><ul>" + r.ew.map(li).join("") + "</ul><h3>Why Grade " + r.grade + "</h3><ul>" + r.gw.map(li).join("") + "</ul>" : "") + "</div>";
    }
    function li(x){ return "<li>" + esc(x) + "</li>"; }
    function input(e){
      var t = e.target; if (!st || st.mode !== "explore") return;
      if (t.hasAttribute("data-x")) { EX[t.getAttribute("data-x")] = +t.value; sync(); out(); }
      else if (t.hasAttribute("data-xc")) {
        var k = t.getAttribute("data-xc");
        if (k === "mip") EX.mip = t.checked; else if (k === "pheno") EX.pheno = t.checked; else if (k === "mob2") EX.mob = t.checked ? 2 : 1;
        else { var i = EX.cx.indexOf(k); if (t.checked && i < 0) EX.cx.push(k); if (!t.checked && i > -1) EX.cx.splice(i, 1); }
        out();
      }
    }
    function click(e){
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      var a = b.getAttribute("data-stg");
      if (a === "play") { start(); return; }
      if (a === "explore") { explore(); return; }
      if (a === "close") { intro(); return; }
      if (a === "next") { if (st) next(); return; }
      var p = b.getAttribute("data-pick"); if (p) { var q = p.split(":"); answer(q[0], q[1]); return; }
      var xs = b.getAttribute("data-xs"); if (xs && EX) { var x = xs.split(":"); EX[x[0]] = x[1]; sync(); out(); }
    }
    if (o.start === "play") start(); else if (o.start === "explore") explore(); else intro();
    return { play: start, explore: explore, stop: function(){ st = null; } };
  }
  return { mount: mount, rules: rules, make: deal, kinds: DECK };
})();
