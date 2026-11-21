/* study-hubs: the tooth library (window.SH_TEETH in a browser, module.exports in Node). One file, read by the dental case
   kit (widget/cases.js, the Patient Box cases) in the browser and imported by the figure builds in Node
   (tools/figures/site/arcade.mjs; any tools/figures/* or anima figure that draws a tooth), so a drawn figure of a tooth
   and a case use the same outline, roots, furcations and landmarks and can't disagree (Patient Box v2, Sam 2026-11-06:
   "Figures pull from the tooth catalogue too"; vault/tasks/2026-11-06-patient-box-v2-modular-cases.md).

   What it holds, for all 32 permanent teeth (universal numbering):
   - XT: Wheeler's averages for the 16 tooth types (mm) and crownMM / rootsMM / backRootMM, the facial-view outlines;
   - rAx, rHw, rootOutline, trunkPts, mkRoots, mkBack: the root geometry every drawing shares;
   - tooth(n): the catalogue entry: name, arch, side, type, surfaces, roots by name, furcation entrances (where each is
     probed from), the root trunk, the six probing sites, landmarks (the CEJ, the contacts, the crest 1.5 mm below the
     CEJ in health, as the kit draws it) and the films that show it (periapical; bitewing for premolars and molars);
   - outlineMM(n): one tooth's crown, roots and back root as point lists in mm (mesial at -x, the CEJ at y = 0, the crown
     toward +y), for a figure that draws a tooth at its own scale;
   - inside the crown: enamelMM / dejPts (the enamel thinning to the CEJ), hornsMM / pulpPts (the pulp chamber, its horns and
     canals); restoMM / cariesMM (a restoration or a carious lesion by surface, as a film shows it); archMM (where each tooth
     sits along the unrolled arch, for the bitewings and the full-mouth series).

   Sources (they make the shapes and numbers right; no text or image is copied): Nelson SJ, Wheeler's Dental Anatomy,
   Physiology and Occlusion (crown and root lengths, widths at the contacts and the cervix, cusp count and position,
   contact heights, root number, names and curvature, root trunks); Newman and Carranza's Clinical Periodontology
   (furcation entrances and where each is probed from; the maxillary first premolar's mesial and distal entrances about
   8 mm from the CEJ; the crest about 1.5-2 mm below the CEJ in health); White and Pharoah's Oral Radiology (which films
   show which teeth: bitewings for the posterior teeth, a maxillary premolar's furcation rarely seen on a film; how caries and
   restorations look on a film); Sturdevant's Art and Science of Operative Dentistry (preparation outlines by
   class: the proximal box's gingival floor and axial wall, the Class III, IV and V outlines, rounded internal line angles,
   inlay and onlay walls and cusp reduction). Patient Box v2.1 (2026-11-21) adds restoParts (a restoration's outline, with an
   overhang or an open margin), recurMM (recurrent caries under a margin), prepMM and PREP (a crown's preparation by material:
   margin width, axial and occlusal reduction, for gold, PFM, zirconia, lithium disilicate and stainless steel crowns),
   ponticMM (a pontic's outline, ridge lap) and the curve helpers (crownLoop, onSide, sideArc, overArc, fillet, shrink):
   restorations follow the crown's own outer surface, so a filling meets it exactly. Its sources: Rosenstiel, Land and
   Fujimoto's Contemporary Fixed Prosthodontics (reduction and margins by crown material, posts and cores, pontic design);
   Cohen's Pathways of the Pulp (fill length and quality, post space, separated instruments, cracked teeth and root fractures).
   Everything drawn from it is original SVG. CI: node tools/ci/cases.js. */
(function(){
  'use strict';
  var T = {};
  function rnd(seed){ var s = seed % 2147483647; if(s <= 0) s += 2147483646; return function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  /* Catmull-Rom smoothing; a point listed twice keeps a sharp corner (an incisal angle, a cusp tip, a groove) */
  function dense(pts, closed, per){
    per = per || 8; var n = pts.length, out = [], last = closed ? n : n - 1;
    for(var i = 0; i < last; i++){
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if(!closed){ if(i === 0) p0 = p1; if(i + 2 >= n) p3 = p2; }
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for(var j = 0; j < per; j++){ var t = j / per, u = 1 - t;
        out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]); }
    }
    if(!closed) out.push(pts[n - 1]);
    return out;
  }

  /* ---------- the tooth catalog (Wheeler averages, mm) ----------
     cw: mesiodistal width at the contacts; cv: at the cervix; ch: crown length; rl: root length (the longest root);
     tr: root trunk, CEJ to the facial furcation; cej: how far the facial cervical line dips toward the apex at the
     middle of the tooth (anteriors curve most, molars least); roots: see rootsMM. */
  var XT = {
    maxI1:{ cw:8.5, cv:7,   ch:10.5, rl:13,   s:'maxI1', cej:.7 },
    maxI2:{ cw:6.5, cv:5,   ch:9,    rl:13,   s:'maxI2', cej:.6 },
    maxC: { cw:7.5, cv:5.5, ch:10,   rl:17,   s:'maxC',  cej:.6 },
    maxP1:{ cw:7,   cv:5,   ch:8.5,  rl:14,   s:'maxP1', cej:.4, bif:true },
    maxP2:{ cw:6.5, cv:5,   ch:8.5,  rl:14,   s:'maxP2', cej:.4 },
    maxM1:{ cw:10,  cv:8,   ch:7.5,  rl:12.5, s:'maxM',  cej:.3, tr:4,   pal:true },
    maxM2:{ cw:9,   cv:7,   ch:7,    rl:11.5, s:'maxM',  cej:.3, tr:4.5, pal:true, close:true },
    maxM3:{ cw:8.5, cv:6.5, ch:6.5,  rl:11,   s:'maxM',  cej:.3, tr:5,   pal:true, close:true },
    manI1:{ cw:5,   cv:3.5, ch:9,    rl:12.5, s:'manI1', cej:.5 },
    manI2:{ cw:5.5, cv:4,   ch:9.5,  rl:14,   s:'manI2', cej:.5 },
    manC: { cw:7,   cv:5.5, ch:11,   rl:16,   s:'manC',  cej:.6 },
    manP1:{ cw:7,   cv:5,   ch:8.5,  rl:14,   s:'manP1', cej:.4 },
    manP2:{ cw:7,   cv:5,   ch:8,    rl:14.5, s:'manP2', cej:.4 },
    manM1:{ cw:11,  cv:9,   ch:7.5,  rl:14,   s:'manM1', cej:.3, tr:3 },
    manM2:{ cw:10.5,cv:8,   ch:7,    rl:13,   s:'manM2', cej:.3, tr:3.5, close:true },
    manM3:{ cw:10,  cv:7.5, ch:7,    rl:11,   s:'manM2', cej:.3, tr:4,   close:true }
  };
  var POS = ['I1', 'I2', 'C', 'P1', 'P2', 'M1', 'M2', 'M3'];
  function isUpper(n){ return +n <= 16; }
  /* 1 = central incisor, 8 = third molar, counted from the midline */
  function posOf(n){ n = +n; return n <= 8 ? 9 - n : n <= 16 ? n - 8 : n <= 24 ? 25 - n : n - 24; }
  function typeOf(n){ return (isUpper(n) ? 'max' : 'man') + POS[posOf(n) - 1]; }
  function dims(n){ return XT[typeOf(n)]; }
  /* on the patient's right (#1-8, #25-32) mesial faces the viewer's right, because the midline is at the center */
  function mesialRight(n){ n = +n; return n <= 8 || n >= 25; }
  function isMolar(n){ return posOf(n) >= 6; }
  /* viewer order, left to right: upper numbers ascend, lower numbers descend (the patient's right on your left) */
  function viewOrder(teeth){ var a = teeth.map(String); return a.sort(function(x, y){ return isUpper(x) ? +x - +y : +y - +x; }); }
  /* a tooth's three sites, in tooth terms [mesial, middle, distal], put in viewer order left to right */
  function siteOrder(n){ return mesialRight(n) ? [2, 1, 0] : [0, 1, 2]; }
  var SITE_NAME = ['mesial', 'middle', 'distal'];

  /* ---------- crown outlines (facial view, mm): mesial at -x, the cervix at y = 0, the incisal edge at y = ch ----------
     Each list runs from the mesial cervical corner up the mesial side, across the incisal edge or cusps and down the
     distal side to the distal cervical corner. Contact heights, cusp positions and angle shapes follow Wheeler:
     maxillary central: mesioincisal angle sharp, distoincisal rounded, mesial contact in the incisal third, distal at
     the junction of incisal and middle thirds; lateral: more rounded; canine: cusp tip a little mesial of center with a
     shorter mesial cusp ridge; first premolar: buccal cusp tip a little distal of center (its mesial ridge is the long
     one); maxillary molars: two buccal cusps, mesiobuccal the larger, with a buccal groove between; mandibular first
     molar: three buccal cusps (mesiobuccal, distobuccal, distal, each smaller) and two buccal grooves; mandibular
     second molar: two buccal cusps; mandibular incisors: narrow, symmetric, sharp incisal angles; mandibular canine:
     long and narrow, the mesial outline nearly straight with the root. */
  function crownMM(d){
    var w = d.cw / 2, v = d.cv / 2, h = d.ch, s = d.s, p;
    if(s === 'maxI1') p = [[-v, 0], [-v - .15, h * .12], [-w + .35, h * .45], [-w, h * .78], [-w + .1, h * .96], [-w + .1, h * .96], [-w + .6, h], [w - 1.4, h * .985], [w - .35, h * .9], [w, h * .68], [w - .3, h * .42], [v + .1, h * .1], [v, 0]];
    else if(s === 'maxI2') p = [[-v, 0], [-v - .1, h * .12], [-w + .3, h * .5], [-w, h * .78], [-w + .25, h * .95], [-w + .9, h], [w - 1.7, h * .97], [w - .5, h * .86], [w, h * .62], [w - .3, h * .4], [v + .1, h * .1], [v, 0]];
    else if(s === 'maxC') p = [[-v, 0], [-v - .2, h * .15], [-w + .3, h * .45], [-w, h * .67], [-w + .3, h * .84], [-.35, h], [w - .45, h * .74], [w, h * .55], [w - .3, h * .35], [v + .1, h * .1], [v, 0]];
    else if(s === 'maxP1') p = [[-v, 0], [-v - .25, h * .2], [-w + .2, h * .45], [-w, h * .62], [-w + .4, h * .82], [.3, h], [w - .4, h * .8], [w, h * .62], [w - .2, h * .45], [v + .25, h * .2], [v, 0]];
    else if(s === 'maxP2') p = [[-v, 0], [-v - .25, h * .2], [-w + .2, h * .45], [-w, h * .62], [-w + .5, h * .86], [0, h * .97], [w - .5, h * .86], [w, h * .62], [w - .2, h * .45], [v + .25, h * .2], [v, 0]];
    else if(s === 'maxM') p = [[-v, 0], [-v - .4, h * .2], [-w + .2, h * .45], [-w, h * .62], [-w + .3, h * .84], [-w * .5, h], [-.05, h * .87], [-.05, h * .87], [w * .45, h * .96], [w - .3, h * .82], [w, h * .6], [w - .2, h * .42], [v + .4, h * .2], [v, 0]];
    else if(s === 'manM1') p = [[-v, 0], [-v - .4, h * .2], [-w + .2, h * .45], [-w, h * .62], [-w + .3, h * .84], [-w * .58, h], [-w * .27, h * .87], [-w * .27, h * .87], [w * .05, h * .97], [w * .33, h * .85], [w * .33, h * .85], [w * .6, h * .9], [w - .25, h * .78], [w, h * .58], [w - .2, h * .42], [v + .4, h * .2], [v, 0]];
    else if(s === 'manM2') p = [[-v, 0], [-v - .4, h * .2], [-w + .2, h * .45], [-w, h * .62], [-w + .3, h * .84], [-w * .48, h], [0, h * .87], [0, h * .87], [w * .46, h * .98], [w - .3, h * .82], [w, h * .6], [w - .2, h * .42], [v + .4, h * .2], [v, 0]];
    else if(s === 'manI1') p = [[-v, 0], [-v - .1, h * .15], [-w + .2, h * .55], [-w, h * .88], [-w + .1, h], [-w + .1, h], [w - .1, h], [w - .1, h], [w, h * .88], [w - .2, h * .55], [v + .1, h * .15], [v, 0]];
    else if(s === 'manI2') p = [[-v, 0], [-v - .1, h * .15], [-w + .2, h * .55], [-w, h * .88], [-w + .1, h], [-w + .1, h], [w - .25, h * .97], [w, h * .84], [w - .2, h * .55], [v + .1, h * .15], [v, 0]];
    else if(s === 'manC') p = [[-v, 0], [-v - .15, h * .3], [-w + .1, h * .62], [-w, h * .75], [-w + .3, h * .9], [-.3, h], [w - .5, h * .8], [w, h * .55], [w - .3, h * .3], [v + .1, h * .1], [v, 0]];
    else if(s === 'manP1') p = [[-v, 0], [-v - .3, h * .2], [-w + .2, h * .45], [-w, h * .6], [-w + .4, h * .8], [-.2, h], [w - .4, h * .8], [w, h * .6], [w - .2, h * .45], [v + .3, h * .2], [v, 0]];
    else p = [[-v, 0], [-v - .3, h * .2], [-w + .2, h * .45], [-w, h * .6], [-w + .6, h * .86], [0, h * .95], [w - .6, h * .86], [w, h * .6], [w - .2, h * .45], [v + .3, h * .2], [v, 0]];
    /* the cervical line dips toward the apex at the middle of the facial surface */
    var c = d.cej || 0;
    return p.concat([[v * .55, -c * .8], [0, -c], [-v * .55, -c * .8]]);
  }
  /* roots (facial view, mm): [x at the cervix, x at the apex, half width at the cervix, length], mesial at -x. Single
     roots taper to a rounded apex that tilts distally (anteriors most, the canine's the longest root in the mouth).
     Maxillary molars: mesiobuccal (broad, bends distally at the apex) and distobuccal (narrower) roots that diverge
     on the first molar and run closer on the second and third, with the palatal root behind them; maxillary first
     premolar: buccal and palatal roots, seen one behind the other on a film; mandibular molars: a broad mesial root
     and a narrower distal root, both curving distally, well apart on the first molar and closer on the second. */
  function rootsMM(d){
    var v = d.cv / 2, s = d.s;
    if(s === 'maxM' || s === 'manM1' || s === 'manM2'){
      if(d.pal) return d.close ? [[-v + 1.8, -v + 1.4, 1.8, d.rl], [v - 1.5, v - .8, 1.5, d.rl - 1]] : [[-v + 1.9, -v + .9, 1.9, d.rl], [v - 1.5, v - .4, 1.5, d.rl - 1]];
      return d.close ? [[-v + 2.1, -v + 2.9, 2.1, d.rl], [v - 1.8, v - 1, 1.8, d.rl - .8]] : [[-v + 2.3, -v + 2.6, 2.3, d.rl], [v - 1.9, v - .9, 1.9, d.rl - 1]];
    }
    if(s === 'maxC' || s === 'manC') return [[0, 1.2, v, d.rl]];
    if(s === 'maxI1' || s === 'manI1') return [[0, .5, v, d.rl]];
    if(s === 'maxI2' || s === 'manI2') return [[0, 1, v, d.rl]];
    return [[0, .6, v, d.rl]];
  }
  /* a root behind the others: the palatal root of a maxillary molar (long, centered, flaring palatally so it shows
     between the buccal roots) or of a first premolar (a second apex beside the buccal one) */
  function backRootMM(d){
    if(d.pal) return [.2, .8, 2.1, d.rl + .5];
    if(d.bif) return [.6, 1.5, 1.9, d.rl - .5];
    return null;
  }


  /* ---------- root geometry shared by the chart, the film and the view (px) ----------
     r: { a0, a1 (x at the cervix and the apex), w0 (half width at the cervix), wa (at the apex), y0, len } */
  function rAx(r, t){ return r.a0 + (r.a1 - r.a0) * Math.pow(t, 1.7); }
  function rHw(r, t){ return r.w0 + (r.wa - r.w0) * Math.pow(t, .92); }
  function rootOutline(r, dd, yL, yR, fun){
    var L = [], R = [], N = 16;
    function ax(t){ return rAx(r, t); }
    function hw(t){ return rHw(r, t); }
    function ex(t){ return fun ? fun * Math.pow(Math.max(0, 1 - t / .4), 1.5) : 0; }
    var tL = Math.min(.9, Math.max(0, (yL - r.y0) / r.len)), tR = Math.min(.9, Math.max(0, (yR - r.y0) / r.len)), i, t;
    for(i = 0; i <= N; i++){ t = tL + (1 - tL) * i / N; L.push([ax(t) - hw(t) - dd - ex(t), r.y0 + t * r.len]); }
    var cx = ax(1), cy = r.y0 + r.len, rr = r.wa + dd;
    for(i = 1; i < 8; i++){ var th = Math.PI - i * Math.PI / 8; L.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
    for(i = N; i >= 0; i--){ t = tR + (1 - tR) * i / N; R.push([ax(t) + hw(t) + dd + ex(t), r.y0 + t * r.len]); }
    return L.concat(R);
  }
  function mkRoots(d, X, k, cej){
    return rootsMM(d).map(function(r){ return { a0:X(r[0]), a1:X(r[1]), w0:r[2] * k, wa:.75 * k, y0:cej, len:r[3] * k }; });
  }
  function mkBack(d, X, k, cej){ var b = backRootMM(d); return b ? { a0:X(b[0]), a1:X(b[1]), w0:b[2] * k, wa:.8 * k, y0:cej, len:b[3] * k } : null; }
  /* the root trunk between two roots, from y0 down to the furcation (the arch between the roots) */
  function trunkPts(roots, sg, dd, y0, yf, k){
    var l = roots[0], r = roots[1], L = sg > 0 ? l : r, R = sg > 0 ? r : l, pts = [], i;
    if(y0 >= yf) return null;
    function tOf(rt, y){ return Math.max(0, (y - rt.y0) / rt.len); }
    for(i = 0; i <= 4; i++){ var y = y0 + (yf - y0) * i / 4, t = tOf(L, y); pts.push([rAx(L, t) - rHw(L, t) - dd, y]); }
    var tl = tOf(L, yf), tr = tOf(R, yf), xa = rAx(L, tl) + rHw(L, tl) * .2, xb = rAx(R, tr) - rHw(R, tr) * .2;
    pts.push([xa, yf + dd], [(xa + xb) / 2, yf + dd - .5 * k], [xb, yf + dd]);
    for(i = 4; i >= 0; i--){ var y2 = y0 + (yf - y0) * i / 4, t2 = tOf(R, y2); pts.push([rAx(R, t2) + rHw(R, t2) + dd, y2]); }
    return pts;
  }

  /* ---------- inside the crown: the enamel, the pulp (px, crowns up: the CEJ at cej, the cusps above it) ----------
     Enamel (Wheeler): thickest over the cusps (about 2.5 mm on a molar, 2 on a premolar, 1 on an incisor's labial face; drawn a
     little thinner, as a film's projection shows it) and thinning to nothing at the CEJ. The pulp: on a molar a chamber with two
     horns under the cusps, its roof about 2 mm and its horns about 3 mm above the CEJ, its floor just above the furcation, one
     canal a root; on a single-rooted tooth one chamber and canal, the horn a share of the crown height (canine .5, premolar
     .42, incisor .38) above the CEJ. The case kit's films and the figures (the arcade's Stage & Grade molar) both draw these. */
  function enamelMM(d){ return (d.s === 'maxM' || d.s === 'manM1' || d.s === 'manM2') ? 1.5 : (d.s === 'maxP1' || d.s === 'maxP2' || d.s === 'manP1' || d.s === 'manP2') ? 1.3 : 1.0; }
  /* the dentinoenamel junction: the crown outline (px) moved inward by the enamel's thickness at each height */
  function dejPts(crown, d, x, top, cej, k){
    var E = enamelMM(d), cy = top + d.ch * .72 * k;
    return crown.map(function(p){ var f = Math.max(0, Math.min(1, (cej - p[1]) / (d.ch * k))), th = E * k * Math.pow(f, .55), dx = x - p[0], dy = cy - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * th, p[1] + dy / L * th]; });
  }
  /* the pulp horns (mm: mesial at -x, height above the CEJ), where a deep lesion heads */
  function hornsMM(d){
    if(d.tr){ var w = d.cv * .3; return d.s === 'manM1' ? [[-w * .8, 3.1], [w * .4, 2.9]] : [[-w * .7, 3.0], [w * .7, 2.8]]; }
    var h = ((d.s === 'maxC' || d.s === 'manC') ? .5 : (d.s.indexOf('P') > 0) ? .42 : .38) * d.ch;
    return [[-.45, h - .3], [.45, h - .3]];
  }
  /* the pulp as closed point lists (px): X maps mm to px across, k px a mm, c the CEJ's y, roots from mkRoots */
  function pulpPts(d, X, k, c, roots){
    var out = [];
    if(d.tr){
      var w = d.cv * .3, horns = hornsMM(d);
      out.push(dense([[X(-w), c + 1.4 * k], [X(-w - .25), c - .6 * k], [X(horns[0][0]), c - horns[0][1] * k], [X(0), c - 2.1 * k], [X(horns[1][0]), c - horns[1][1] * k], [X(w + .25), c - .6 * k], [X(w), c + 1.4 * k]], true, 6));
      roots.forEach(function(r){ var L = [], R = [], N = 10;
        for(var i = 0; i <= N; i++){ var t = .06 + .86 * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (.55 - .4 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
        out.push(L.concat(R)); });
      return out;
    }
    var r = roots[0], horn = (d.s === 'maxC' || d.s === 'manC') ? .5 : (d.s.indexOf('P') > 0) ? .42 : .38, L2 = [], R2 = [], N2 = 14;
    for(var j = 0; j <= N2; j++){
      var tt = -horn * d.ch * k / r.len + (horn * d.ch * k / r.len + .93) * j / N2, yy = r.y0 + tt * r.len;
      var xx = tt < 0 ? r.a0 : rAx(r, tt);
      var hw2 = tt < 0 ? (1 - Math.pow(-tt / (horn * d.ch * k / r.len), 2)) * 1.05 * k : (.95 - .8 * Math.pow(tt, .7)) * k * .85;
      L2.push([xx - Math.max(.45, hw2), yy]); R2.unshift([xx + Math.max(.45, hw2), yy]);
    }
    out.push(dense(L2.concat(R2), true, 3));
    return out;
  }

  /* ---------- restorations and caries on a tooth, by surface (mm: mesial at -x, the cervix at y = 0, the crown toward +y) ----------
     What a film shows of them (White and Pharoah; preparation outlines after Sturdevant's). Patient Box v2.1 (Sam, 2026-11-21:
     "when theres a filling, the lines dont look clean and accurate") draws each one from the crown's own dense outline, so a
     restoration meets the tooth's surface exactly, with no gap and no overshoot:
     - occlusal (Class I): in the middle of the crown, its walls about 2 mm in from the proximal surfaces (the marginal ridges
       kept), slightly divergent toward the occlusal, a flat pulpal floor about 1.9 mm under the marginal ridges, its top the
       central fossa running under the cusp tips (the cusps of both sides still project over it);
     - proximal (Class II): a box whose outer edge is the proximal surface itself, from a flat gingival floor about 2.8 mm under
       the contact up to the marginal ridge, its axial wall about 1.5 mm (molar) or 1.3 mm (premolar) in; MOD has both;
     - occlusal-facial or -lingual: a narrow extension down the groove; facial or lingual alone (Class V): a rounded band over
       the cervical third whose lower edge follows the cervical line;
     - incisor or canine: proximal (Class III) a rounded shape at the contact, its outer edge the proximal surface; with the
       incisal edge (Class IV) it takes the incisal angle, its inner edge an oblique bevel; incisal alone a band;
     - inlay (gold or ceramic): Class II's outline with walls that diverge occlusally (it is drawn out of its preparation);
       onlay: the boxes plus every cusp, reduced along their own inclines (gold 1.5 mm, ceramic 1.8 mm); veneer: a shell over the labial face,
       short of the cervical line, to the incisal edge.
     Internal line angles are rounded (r 0.3 mm; composite 0.45, a rounder, more conservative preparation). */
  function sideAt(pts, y, sg){
    var best = null;
    for(var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i + 1) % pts.length];
      if(a[1] === b[1] || (a[1] - y) * (b[1] - y) > 0) continue;
      var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      if(best == null || (sg < 0 ? x < best : x > best)) best = x; }
    return best == null ? 0 : best;
  }
  function topAt(pts, x){
    var best = null;
    for(var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i + 1) % pts.length];
      if(a[0] === b[0] || (a[0] - x) * (b[0] - x) > 0) continue;
      var y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      if(best == null || y > best) best = y; }
    return best == null ? 0 : best;
  }
  function ellipseMM(cx, cy, rx, ry){ var p = []; for(var i = 0; i < 18; i++){ var a = i / 18 * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
  /* the crown's outline as the films draw it (per points a span) and iv, the index of its distal cervical corner: C[0..iv] is
     the outer surface from the mesial cervical corner over the crown to the distal one; the rest is the cervical line */
  function crownLoop(d, per){ var C = dense(crownMM(d), true, per || 6), v = d.cv / 2, iv = 0;
    C.forEach(function(p, i){ if(Math.abs(p[0] - v) + Math.abs(p[1]) < Math.abs(C[iv][0] - v) + Math.abs(C[iv][1])) iv = i; });
    return { C:C, iv:iv, d:d }; }
  /* the point on the outer surface at height y on side sg (-1 mesial, +1 distal), found walking up from the cervical corner, and
     the index of the first outline point past it toward the top */
  function onSide(L, sg, y){
    var C = L.C, i, a, b, t;
    if(sg < 0){ for(i = 0; i < L.iv; i++){ a = C[i]; b = C[i + 1]; if(a[1] <= y && b[1] > y){ t = (y - a[1]) / (b[1] - a[1]); return { p:[a[0] + (b[0] - a[0]) * t, y], i:i + 1 }; } } return { p:C[L.iv >> 1].slice(), i:(L.iv >> 1) + 1 }; }
    for(i = L.iv; i > 0; i--){ a = C[i]; b = C[i - 1]; if(a[1] <= y && b[1] > y){ t = (y - a[1]) / (b[1] - a[1]); return { p:[a[0] + (b[0] - a[0]) * t, y], i:i - 1 }; } }
    return { p:C[L.iv >> 1].slice(), i:(L.iv >> 1) - 1 };
  }
  /* the outer surface, exactly: up one side from y0 to y1 (sideArc), or from the mesial side at ym over the crown and down to
     the distal side at yd (overArc) */
  function sideArc(L, sg, y0, y1){
    var a = onSide(L, sg, y0), b = onSide(L, sg, y1), out = [a.p], j;
    if(sg < 0) for(j = a.i; j < b.i; j++) out.push(L.C[j]); else for(j = a.i; j > b.i; j--) out.push(L.C[j]);
    out.push(b.p); return out;
  }
  function overArc(L, ym, yd){ var a = onSide(L, -1, ym), b = onSide(L, 1, yd); return [a.p].concat(L.C.slice(a.i, b.i + 1), [b.p]); }
  /* from the side point at height y0 on side sg, along the surface over the top until x reaches xEnd (a Class IV's incisal
     reach), exactly on the outline */
  function arcTo(L, sg, y0, xEnd){
    var C = L.C, a = onSide(L, sg, y0), out = [a.p], j = a.i, n = C.length, prev = a.p;
    for(var m = 0; m < n; m++, j += sg < 0 ? 1 : -1){ var p = C[(j + n) % n];
      if((sg < 0 && p[0] >= xEnd) || (sg > 0 && p[0] <= xEnd)){ var t = (xEnd - prev[0]) / ((p[0] - prev[0]) || 1); out.push([xEnd, prev[1] + (p[1] - prev[1]) * t]); return out; }
      out.push(p); prev = p; }
    return out;
  }
  /* round the inside corners of an open chain (its two ends are kept, they sit on the outline): each corner becomes a
     quadratic curve r mm long on either side */
  function fillet(pts, r, n){
    n = n || 5; var out = [pts[0]];
    for(var i = 1; i < pts.length - 1; i++){ var p = pts[i], a = pts[i - 1], b = pts[i + 1];
      var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), rr = Math.min(r, la / 2, lb / 2);
      if(rr < .01){ out.push(p); continue; }
      var s = [p[0] + (a[0] - p[0]) / la * rr, p[1] + (a[1] - p[1]) / la * rr], e = [p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr];
      for(var j = 0; j <= n; j++){ var t = j / n, u = 1 - t; out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]); } }
    out.push(pts[pts.length - 1]); return out;
  }
  function filletClosed(pts, r){ var n = pts.length, ext = [pts[n - 1]].concat(pts, [pts[0]]); return fillet(ext, r).slice(1, -1); }
  /* a closed chain's points moved toward (0, cy) by th(p) mm each, then smoothed (a preparation or a coping inside a crown) */
  function shrink(pts, cy, th, passes){
    var out = pts.map(function(p){ var dx = -p[0], dy = cy - p[1], l = Math.hypot(dx, dy) || 1, t = th(p); return [p[0] + dx / l * t, p[1] + dy / l * t]; });
    for(var k = 0; k < (passes == null ? 3 : passes); k++) out = out.map(function(p, i){ if(i === 0 || i === out.length - 1) return p; var a = out[i - 1], b = out[i + 1]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4]; });
    return out;
  }
  /* the geometry a posterior restoration and the lesions beside it share */
  function postGeom(type, o){
    var d = XT[type], L = crownLoop(d, o && o.per), C = L.C, h = d.ch, molar = POS.indexOf(type.slice(3)) >= 5, ct = CONTACT[type];
    var mr = molar ? 1.2 : 1.3, G = { d:d, L:L, C:C, h:h, molar:molar, yMR:h - mr };
    G.pf = G.yMR - (molar ? 1.9 : 1.8);
    G.ax = molar ? 1.5 : 1.3;
    G.side = function(y, sg){ return sideAt(C, y, sg); };
    G.gy = function(sg){ return Math.max(.9, ct[sg < 0 ? 0 : 1] * h - 2.8); };
    G.axX = function(sg, y){ return G.side(G.gy(sg), sg) - sg * G.ax; };
    G.oX = function(sg){ return G.side(G.yMR, sg) - sg * (molar ? 2.1 : 1.9); };
    return G;
  }
  /* the central fossa from (x0, y0) to (x1, y1): a shallow curve a little deeper at its middle, kept under the outline */
  function fossa(C, x0, y0, x1, y1, dip){
    var out = [];
    for(var i = 1; i < 10; i++){ var t = i / 10, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - (dip == null ? .35 : dip) * Math.sin(Math.PI * t);
      out.push([x, Math.min(y, topAt(C, x) - .3)]); }
    return out;
  }
  /* one restoration's shapes: { shapes, gaps, lines } in mm (lines: an inlay's or onlay's inner outline, the walls and floors
     of its preparation, where its cement shows). o: { per, mat, type ('direct' | 'inlay' | 'onlay' | 'veneer'), overhang
     ('m' | 'd' | 'md': excess past the proximal contour at the gingival margin), open (the same: a gap between the
     restoration and the gingival floor) } */
  function restoParts(type, surfaces, o){
    o = o || {}; var d = XT[type], h = d.ch, s = String(surfaces || '').toUpperCase(), pos = POS.indexOf(type.slice(3)), ant = pos <= 2;
    var hasM = s.indexOf('M') >= 0, hasD = s.indexOf('D') >= 0, fac = /[BFL]/.test(s), kind = o.type || 'direct';
    var r = o.mat === 'composite' ? .45 : .3, out = { shapes:[], gaps:[], lines:[] };
    var L = crownLoop(d, o.per), C = L.C, v = d.cv / 2, c = d.cej || 0;
    function cervical(){ var hw = d.cv * .36; return filletClosed([[-hw, 3.0], [0, 3.15], [hw, 3.0], [hw + .1, 1.2], [hw * .5, 1.0 - c * .45], [-hw * .5, 1.0 - c * .45], [-hw - .1, 1.2]], .55); }
    if(kind === 'veneer'){
      /* a labial shell: the crown's own outline from just above the cervical line to the incisal edge, drawn in a little at the
         proximal surfaces (it stops short of the contacts' lingual half), the lower margin following the cervical line */
      var a = overArc(L, .7, .7).map(function(p){ var f = Math.min(1, Math.max(0, (Math.abs(p[0]) - d.cw * .25) / (d.cw * .25))); return [p[0] - Math.sign(p[0]) * .3 * f, p[1]]; });
      out.shapes.push(a.concat(dense([[v - .3, .7], [v * .5, .55 - c * .6], [-v * .5, .55 - c * .6], [-v + .3, .7]], false, 4).slice(1, -1)));
      return out;
    }
    if(ant){
      var inc = s.indexOf('I') >= 0;
      [[-1, hasM], [1, hasD]].forEach(function(e){ var sg = e[0]; if(!e[1]) return;
        var lo = h * (inc ? .45 : .32), hi = h * .74, sd = function(y){ return sideAt(C, y, sg); };
        if(inc){ var xEnd = sg * (d.cw / 2) - sg * d.cw * .45, w4 = arcTo(L, sg, lo, xEnd), last = w4[w4.length - 1];
          out.shapes.push(w4.concat(dense([last, [last[0] + sg * .15, h - 1.4], [sd(h * .62) - sg * 1.7, h * .62], [sd(lo) - sg * .9, lo + .35], [sd(lo), lo]], false, 5).slice(1, -1))); }
        else { var w3 = sideArc(L, sg, lo, hi), mid = (lo + hi) / 2;
          out.shapes.push(w3.concat(dense([w3[w3.length - 1], [sd(hi) - sg * .95, hi - .3], [sd(mid) - sg * 1.75, mid], [sd(lo) - sg * .95, lo + .3], w3[0]], false, 5).slice(1, -1))); }
      });
      if(inc && !hasM && !hasD){ var band = overArc(L, h - 1.1, h - 1.1); out.shapes.push(band.concat(dense([band[band.length - 1], [d.cw * .2, h - 1.25], [-d.cw * .2, h - 1.25], band[0]], false, 4).slice(1, -1))); }
      if(fac) out.shapes.push(cervical());
      return out;
    }
    var G = postGeom(type, o), side = G.side, yMR = G.yMR, pf = G.pf, inlay = kind === 'inlay' || kind === 'onlay';
    var ta = inlay ? .45 : 0, hasO = s.indexOf('O') >= 0 || (hasM && hasD) || kind === 'onlay';
    var oh = String(o.overhang || ''), op = String(o.open || '');
    function gyE(sg){ return G.gy(sg) + (op.indexOf(sg < 0 ? 'm' : 'd') >= 0 ? .4 : 0); }
    /* the side of a box, from its gingival floor up to yTop, with the overhang's ledge where there is one. pre runs from the
       floor's outer corner to where the box's side starts: an overhang (excess past the proximal contour at the gingival margin,
       White and Pharoah) is a spur about .5 mm proud of the surface at the floor, hanging about .9 mm over the surface below it
       and tapering onto it, its outer face rounded (it rests on the tooth, so its inner edge is the surface itself) */
    function boxUp(sg, yTop){
      var g = gyE(sg), hasLedge = oh.indexOf(sg < 0 ? 'm' : 'd') >= 0;
      if(!hasLedge) return { pts:sideArc(L, sg, g, yTop), pre:[] };
      var U = g + .7, lo = Math.max(.05, g - .9), sx = function(y){ return side(y, sg); };
      var face = dense([[sx(lo), lo], [sx(g - .5) + sg * .24, g - .5], [sx(g - .05) + sg * .5, g - .05], [sx(g + .35) + sg * .3, g + .35], [sx(U), U]], false, 4);
      return { pts:sideArc(L, sg, U, yTop), pre:sideArc(L, sg, g, lo).concat(face.slice(1, -1)) };
    }
    function floorIn(sg){ var g = gyE(sg); return [[G.axX(sg), g], [G.axX(sg) - sg * ta, pf]]; }
    if(kind === 'onlay'){
      /* the cusps reduced along their inclines, the boxes as an inlay's: gold 1.5 mm (Sturdevant's: 1.5 mm over the functional
         cusps, 1.0 over the others; a film shows the deeper), ceramic 1.8 mm (lithium disilicate's 1.5-2.0 mm occlusal reduction) */
      var rd = o.mat === 'gold' ? 1.5 : 1.8;
      var ym = hasM ? gyE(-1) : h - 2.3, yd = hasD ? gyE(1) : h - 2.3, top = overArc(L, ym, yd);
      var xa = hasM ? G.axX(-1) + ta : top[0][0] + .15, xb = hasD ? G.axX(1) - ta : top[top.length - 1][0] - .15, red = [];
      for(var i = 0; i <= 12; i++){ var x = xb + (xa - xb) * i / 12; red.push([x, topAt(C, x) - rd]); }
      red = shrink(red, 0, function(){ return 0; }, 3);
      var inner = (hasD ? [[G.axX(1), gyE(1)]] : []).concat(red, hasM ? [[G.axX(-1), gyE(-1)]] : []);
      var lin = fillet([top[top.length - 1]].concat(inner, [top[0]]), r);
      out.shapes.push(top.concat(lin.slice(1, -1))); out.lines.push(lin);
    } else if(hasO){
      var P = [], pre = [];
      if(hasM){ var bm = boxUp(-1, yMR); pre = bm.pre; P = P.concat(bm.pts); }
      else P.push([G.oX(-1), yMR - .15]);
      var a0 = P[P.length - 1], dEnd = hasD ? onSide(L, 1, yMR).p : [G.oX(1), yMR - .15];
      P = P.concat(fossa(C, a0[0], a0[1], dEnd[0], dEnd[1]));
      var chain;
      if(hasD){ var bd = boxUp(1, yMR), dp = bd.pts.slice().reverse(); P = P.concat(dp, bd.pre.slice().reverse()); chain = [P[P.length - 1]].concat(floorIn(1)); }
      else { P.push(dEnd); chain = [dEnd, [G.oX(1) - .3, pf]]; }
      chain = chain.concat(hasM ? floorIn(-1).reverse() : [[G.oX(-1) + .3, pf]]);
      chain.push(hasM ? (pre.length ? pre[0] : P[0]) : P[0]);
      P = pre.concat(P);
      var fc = fillet(chain, r);
      out.shapes.push(P.concat(fc.slice(1, -1))); if(inlay) out.lines.push(fc);
    } else [[-1, hasM], [1, hasD]].forEach(function(e){ var sg = e[0]; if(!e[1]) return;
      /* a proximal box alone (a slot): the box up to the marginal ridge, its occlusal edge turned in along the ridge */
      var bx = boxUp(sg, yMR), top2 = bx.pts[bx.pts.length - 1], g = gyE(sg);
      var ch = [top2, [top2[0] - sg * (G.ax + .3), top2[1] - .2], [G.axX(sg) - sg * ta, g + .4], [G.axX(sg), g], bx.pre.length ? bx.pre[0] : bx.pts[0]];
      var fs = fillet(ch, r);
      out.shapes.push(bx.pre.concat(bx.pts, fs.slice(1, -1))); if(inlay) out.lines.push(fs); });
    /* the groove extension (OB, OL) or a Class V alone */
    if(fac) out.shapes.push(hasO ? filletClosed([[-.6, pf + .4], [.6, pf + .4], [.55, h * .4], [-.55, h * .4]], .5) : cervical());
    /* an open margin: the restoration stands .4 mm off its gingival floor; the gap between, from the proximal surface to the
       axial wall, is dark (drawn under the restoration, which covers its top edge) */
    [[-1, 'm'], [1, 'd']].forEach(function(e){ var sg = e[0]; if(op.indexOf(e[1]) < 0 || !(sg < 0 ? hasM : hasD)) return;
      var g = G.gy(sg), ax = G.axX(sg);
      out.gaps.push(sideArc(L, sg, g, g + .5).concat([[ax - sg * .05, g + .5], [ax - sg * .05, g]])); });
    return out;
  }
  function restoMM(type, surfaces, o){ return restoParts(type, surfaces, o).shapes; }
  /* recurrent (secondary) caries at a restoration's margin on surface M or D, as a film shows it (White and Pharoah): a
     radiolucency in the tooth beside the margin, the tooth's own surface its outer edge. Posterior: a rounded shadow under the
     outer part of the box's gingival floor (enamel: a small notch there; dentin: the whole floor, then a band up the axial
     wall; pulp: the band wider, heading for the pulp). Incisor or canine (o.inc: the restoration takes the incisal angle):
     the same at a Class III or IV's cervical edge. Drawn under the restoration, which covers its upper part. (At a crown's
     margin the lesion is on the root, apical to the crown: the case kit draws it there.) */
  function recurMM(type, surface, depth, o){
    o = o || {}; var sg = String(surface).toUpperCase() === 'M' ? -1 : 1, d = XT[type], L = crownLoop(d, o.per), h = d.ch;
    var ant = POS.indexOf(type.slice(3)) <= 2, sd = function(y){ return sideAt(L.C, y, sg); }, g, ax;
    if(ant){ g = h * (o.inc ? .45 : .32); ax = sd(g + .3) - sg * .95; }
    else { var G = postGeom(type, o); g = G.gy(sg); ax = G.axX(sg); }
    var w = Math.abs(sd(g) - ax), q = function(y, f){ return sd(y) - sg * f; }, bot, top, inner;
    if(depth === 'enamel'){ bot = g - .6; top = g + .5; inner = [[q(g - .42, .2), g - .42], [q(g - .1, .42), g - .1], [q(g, w * .4), g + .1], [q(top, w * .4), top]]; }
    else if(depth === 'pulp'){ bot = g - 1.45; top = g + 1.5; inner = [[q(g - 1.2, .3), g - 1.25], [q(g, w * .6), g - 1.1], [ax - sg * .4, g - .7], [ax - sg * .9, g - .1], [ax - sg, g + .6], [ax - sg * .5, g + 1.2], [ax + sg * .2, top]]; }
    else { bot = g - 1.15; top = g + .9; inner = [[q(g - .9, .25), g - .95], [q(g, w * .55), g - .8], [ax - sg * .15, g - .5], [ax - sg * .35, g], [ax - sg * .25, g + .5], [ax + sg * .2, top]]; }
    bot = Math.max(.1, bot);
    var outer = sideArc(L, sg, bot, top).reverse();
    return [outer.concat(dense([outer[outer.length - 1]].concat(inner, [outer[0]]), false, 5).slice(1, -1))];
  }
  /* a full crown's preparation (Rosenstiel's reductions): the outline moved in by the axial reduction at the sides and the
     occlusal (incisal) one at the top, a shoulder or chamfer of `margin` mm at the cervical line, smoothed the way a
     preparation's cusps are flattened. Returns { arc, poly }: arc from the mesial margin over the top to the distal margin,
     poly closed along the cervical line. */
  var PREP = { gold:{ m:.5, ax:1.0, occ:1.5 }, pfm:{ m:1.0, ax:1.4, occ:2.0 }, zirconia:{ m:.6, ax:1.0, occ:1.0 }, lithium:{ m:1.0, ax:1.1, occ:1.6 }, ssc:{ m:.1, ax:.5, occ:1.2 } };
  function prepMM(type, kind, o){
    o = o || {}; var d = XT[type], L = crownLoop(d, o.per), C = L.C, h = d.ch, P = PREP[kind] || PREP.gold, v = d.cv / 2, c = d.cej || 0;
    var ext = o.extra || 0, col = o.collar;
    /* o.extra: that much less reduction (a coping o.extra mm outside the preparation); o.collar: none below that height (a
       metal collar reaching the surface at the margin) */
    function th(p){ var y = p[1], a = Math.min(1, Math.max(0, y / 2.2)), b = Math.min(1, Math.max(0, (y - (h - 2.6)) / 1.8)); a = a * a * (3 - 2 * a); b = b * b * (3 - 2 * b);
      var c2 = col == null ? 1 : Math.min(1, Math.max(0, (y - col + .4) / .7));
      return Math.max(0, P.m + (P.ax - P.m) * a + (P.occ - P.ax) * b - ext) * c2; }
    var arc = shrink(C.slice(0, L.iv + 1), h * .42, th, 4);
    var m = col != null ? 0 : Math.max(0, P.m - ext);
    arc[0] = [-v + m, 0]; arc[arc.length - 1] = [v - m, 0];
    var bottom = dense([[v - m, 0], [(v - m) * .55, -c * .8], [0, -c], [-(v - m) * .55, -c * .8], [-v + m, 0]], false, 3).slice(1, -1);
    return { arc:arc, poly:arc.concat(bottom), L:L };
  }
  /* a pontic (a fixed bridge's replacement tooth): the crown's outline with its cervical end a convex ridge-lap resting on the
     ridge about 1 mm past the neighbors' CEJ, narrower there than a tooth's cervix */
  function ponticMM(type, o){
    var d = XT[type], L = crownLoop(d, o && o.per), v = d.cv / 2, arc = L.C.slice(0, L.iv + 1);
    return arc.concat(dense([[v, 0], [v * .7, -.75], [0, -1.05], [-v * .7, -.75], [-v, 0]], false, 4).slice(1, -1));
  }
  /* caries as a film shows it (White and Pharoah): a proximal lesion starts just cervical to the contact as a triangle in the
     enamel, its base on the surface and its point toward the DEJ (enamel); once in the dentin it spreads along the DEJ and a
     second, broader triangle points toward the pulp (dentin: into its outer half; pulp: reaching the horn). Occlusal caries
     shows only once it is in the dentin, a band under the enamel of the central fossa; a facial or lingual lesion is a round
     shadow over the cervical third, fainter because sound tooth lies in front of it. Returns [{ pts, face }] in mm. */
  function cariesMM(type, surface, depth){
    var d = XT[type], L = crownLoop(d), C = L.C, h = d.ch, E = enamelMM(d), out = [], s = String(surface || '').toUpperCase();
    var pos = POS.indexOf(type.slice(3)), horns = hornsMM(d);
    function th(y){ return E * Math.pow(Math.max(0, Math.min(1, y / h)), .55); }
    function side(y, sg){ return sideAt(C, y, sg); }
    if(s === 'M' || s === 'D'){
      var sg = s === 'M' ? -1 : 1, yc = CONTACT[type][sg < 0 ? 0 : 1] * h - .7, xs = side(yc, sg), t0 = th(yc);
      var top = [side(yc + .75, sg) + sg * .05, yc + .75], bot = [side(yc - .75, sg) + sg * .05, yc - .75];
      if(depth === 'enamel'){ out.push({ pts:[top, [xs - sg * .7 * t0, yc + .08], [xs - sg * .72 * t0, yc - .08], bot] }); return out; }
      var dej = function(y){ return side(y, sg) - sg * th(y); }, hn = horns[sg < 0 ? 0 : 1];
      var mx = dej(yc), tx = hn[0] + sg * (pos >= 5 ? .1 : .25), ty = hn[1] + .15, f = depth === 'pulp' ? 1 : .42;
      var apex = [mx + (tx - mx) * f, yc + (ty - yc) * f];
      out.push({ pts:[top, [dej(yc + .2), yc + .2], [dej(yc + 1.25), yc + 1.25], [mx + (apex[0] - mx) * .55, yc + (apex[1] - yc) * .55 + .45], apex,
        [mx + (apex[0] - mx) * .55, yc + (apex[1] - yc) * .55 - .45], [dej(yc - 1.25), yc - 1.25], [dej(yc - .2), yc - .2], bot] });
    } else if(s === 'O' || s === 'I'){
      if(depth === 'enamel') return out;
      var g = topAt(C, 0), yd = g - E * .95, hw = d.cw * (pos >= 5 ? .2 : .17), bottom = depth === 'pulp' ? Math.min(horns[0][1], horns[1][1]) + .1 : yd - 1.4;
      out.push({ pts:[[-hw, yd + .05], [-hw * .4, yd + .25], [hw * .4, yd + .25], [hw, yd + .05], [hw * .7, (yd + bottom) / 2 + .2], [hw * .25, bottom], [-hw * .25, bottom], [-hw * .7, (yd + bottom) / 2 + .2]] });
    } else {
      var r = depth === 'enamel' ? [.8, .55] : depth === 'dentin' ? [1.25, .95] : [1.6, 1.25];
      out.push({ pts:ellipseMM(0, h * .24, r[0], r[1]), face:true });
    }
    return out;
  }
  /* where each tooth sits along its arch, unrolled, in mm (Wheeler's widths at the contacts, the contacts overlapping .15 mm
     as the films draw them): [left, right] as you face the patient, the midline at 0 and the patient's right at -x. occl:
     move the upper canine and the teeth behind it 1.5 mm toward the midline, so on a bitewing each upper tooth meets its namesake and the tooth distal
     to it, as in a Class I occlusion (the upper canine's tip in the embrasure between the lower canine and first premolar,
     the upper first molar's mesiobuccal cusp over the lower first molar's buccal groove). */
  function archMM(n, occl){
    n = +n; var up = isUpper(n), p = posOf(n), a = 0;
    for(var q = 1; q < p; q++) a += XT[(up ? 'max' : 'man') + POS[q - 1]].cw - .15;
    if(occl && up && p >= 3) a -= 1.5;
    var w = XT[typeOf(n)].cw;
    return mesialRight(n) ? [-(a + w), -a] : [a, a + w];
  }


  /* ---------- the catalogue: one entry per tooth ---------- */
  var SIDE_WORD = { 1:'right', 2:'left', 3:'left', 4:'right' };
  var POS_NAME = ['central incisor', 'lateral incisor', 'canine', 'first premolar', 'second premolar', 'first molar', 'second molar', 'third molar'];
  /* roots by name and furcation entrances, per type. An entrance: [name, the surface it is probed from ('f' facial or
     'l' lingual, the case model's two surfaces), whether a film shows it]. Maxillary molars: buccal (from the buccal),
     mesial and distal (both probed from the palatal, the mesial entrance nearer the palatal side); mandibular molars:
     buccal and lingual; a two-rooted maxillary first premolar: mesial and distal, reached from either side at the line
     angles and almost never seen on a film, its roots one behind the other. */
  var ROOTS = {
    maxI1:['single'], maxI2:['single'], maxC:['single'], maxP1:['buccal', 'palatal'], maxP2:['single'],
    maxM1:['mesiobuccal', 'distobuccal', 'palatal'], maxM2:['mesiobuccal', 'distobuccal', 'palatal'], maxM3:['mesiobuccal', 'distobuccal', 'palatal'],
    manI1:['single'], manI2:['single'], manC:['single'], manP1:['single'], manP2:['single'],
    manM1:['mesial', 'distal'], manM2:['mesial', 'distal'], manM3:['mesial', 'distal']
  };
  var FURC = {
    maxP1:{ trunk:8, entrances:[['mesial', 'f', false], ['distal', 'f', false], ['mesial', 'l', false], ['distal', 'l', false]] },
    maxM:{ entrances:[['buccal', 'f', true], ['mesial', 'l', true], ['distal', 'l', true]] },
    manM:{ entrances:[['buccal', 'f', true], ['lingual', 'l', true]] }
  };
  /* contact heights (Wheeler), as a share of the crown from the cervix: incisal or occlusal third ~ .8, the junction of
     the incisal and middle thirds ~ .67, the middle third ~ .5 */
  var CONTACT = {
    maxI1:[.8, .67], maxI2:[.67, .55], maxC:[.67, .5], maxP1:[.6, .55], maxP2:[.6, .55], maxM1:[.6, .5], maxM2:[.55, .5], maxM3:[.5, .5],
    manI1:[.85, .85], manI2:[.85, .8], manC:[.8, .6], manP1:[.6, .55], manP2:[.6, .6], manM1:[.65, .55], manM2:[.6, .55], manM3:[.55, .5]
  };
  function quadOf(n){ n = +n; return n <= 8 ? 1 : n <= 16 ? 2 : n <= 24 ? 3 : 4; }
  function isPosterior(n){ return posOf(n) >= 4; }
  function isAnterior(n){ return posOf(n) <= 3; }
  function catalogue(n){
    n = +n;
    if(!(n >= 1 && n <= 32 && n === Math.floor(n))) return null;
    var type = typeOf(n), d = XT[type], up = isUpper(n), pos = posOf(n), post = pos >= 4;
    var fz = FURC[type] || (pos >= 6 ? FURC[up ? 'maxM' : 'manM'] : null);
    var F = post ? 'B' : 'F';
    return {
      n:String(n), type:type, name:(up ? 'maxillary' : 'mandibular') + ' ' + SIDE_WORD[quadOf(n)] + ' ' + POS_NAME[pos - 1],
      arch:up ? 'upper' : 'lower', quadrant:quadOf(n), side:SIDE_WORD[quadOf(n)], pos:pos, dims:d,
      /* surfaces, the odontogram's five: mesial, occlusal (incisal on an anterior), distal, facial (buccal on a posterior,
         labial on an anterior) and lingual (palatal on an upper) */
      surfaces:['M', post ? 'O' : 'I', 'D', F, 'L'],
      surfaceNames:{ M:'mesial', O:'occlusal', I:'incisal', D:'distal', B:'buccal', F:'labial', L:up ? 'palatal' : 'lingual' },
      roots:ROOTS[type].slice(),
      furcations:fz ? fz.entrances.map(function(e){ return { entrance:e[0], from:e[1], film:e[2] }; }) : [],
      trunk:fz ? (fz.trunk || d.tr) : null,
      /* the six probing sites, in tooth terms: facial mesial, middle, distal; lingual mesial, middle, distal */
      sites:['f-m', 'f-mid', 'f-d', 'l-m', 'l-mid', 'l-d'],
      landmarks:{ cejDip:d.cej, crest:1.5, contacts:{ m:CONTACT[type][0], d:CONTACT[type][1] }, crown:d.ch, root:d.rl },
      films:post ? ['periapical', 'bitewing'] : ['periapical']
    };
  }
  /* one tooth's drawing in mm: crown, roots (and the root behind them) as closed point lists; mesial at -x, the CEJ at
     y = 0, the crown toward +y, the roots toward -y. mirror: mesial at +x. */
  function outlineMM(n, o){
    o = o || {}; var d = typeof n === 'string' && XT[n] ? XT[n] : XT[typeOf(n)], sg = o.mirror ? -1 : 1, per = o.per || 6;
    function X(x){ return sg * x; }
    var crown = dense(crownMM(d), true, per).map(function(p){ return [sg * p[0], p[1]]; });
    var roots = mkRoots(d, X, 1, 0), back = mkBack(d, X, 1, 0);
    var flip = function(pts){ return pts.map(function(p){ return [p[0], -p[1]]; }); };
    return { dims:d, crown:crown, roots:roots.map(function(r){ return flip(rootOutline(r, 0, 0, 0)); }),
      back:back ? flip(rootOutline(back, 0, 0, 0)) : null,
      trunk:d.tr ? flip(trunkPts(roots, sg, 0, -1, d.tr, 1) || []) : null, furcation:d.tr ? -d.tr : null, crest:-1.5 };
  }

  T.XT = XT; T.POS = POS; T.SITE_NAME = SITE_NAME;
  T.dense = dense; T.rnd = rnd; T.crownMM = crownMM; T.rootsMM = rootsMM; T.backRootMM = backRootMM;
  T.rAx = rAx; T.rHw = rHw; T.rootOutline = rootOutline; T.mkRoots = mkRoots; T.mkBack = mkBack; T.trunkPts = trunkPts;
  T.isUpper = isUpper; T.posOf = posOf; T.typeOf = typeOf; T.dims = dims; T.mesialRight = mesialRight; T.isMolar = isMolar;
  T.isPosterior = isPosterior; T.isAnterior = isAnterior; T.quadOf = quadOf; T.viewOrder = viewOrder; T.siteOrder = siteOrder;
  T.tooth = catalogue; T.outlineMM = outlineMM;
  T.enamelMM = enamelMM; T.dejPts = dejPts; T.hornsMM = hornsMM; T.pulpPts = pulpPts; T.CONTACT = CONTACT;
  T.sideAt = sideAt; T.topAt = topAt; T.restoMM = restoMM; T.restoParts = restoParts; T.recurMM = recurMM; T.prepMM = prepMM; T.ponticMM = ponticMM; T.PREP = PREP;
  T.crownLoop = crownLoop; T.onSide = onSide; T.sideArc = sideArc; T.overArc = overArc; T.fillet = fillet; T.filletClosed = filletClosed; T.shrink = shrink; T.cariesMM = cariesMM; T.archMM = archMM;
  T.all = function(){ var a = []; for(var i = 1; i <= 32; i++) a.push(catalogue(i)); return a; };
  if(typeof module === 'object' && module.exports) module.exports = T;
  if(typeof window !== 'undefined') window.SH_TEETH = T;
})();
