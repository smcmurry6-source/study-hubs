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
     toward +y), for a figure that draws a tooth at its own scale.

   Sources (they make the shapes and numbers right; no text or image is copied): Nelson SJ, Wheeler's Dental Anatomy,
   Physiology and Occlusion (crown and root lengths, widths at the contacts and the cervix, cusp count and position,
   contact heights, root number, names and curvature, root trunks); Newman and Carranza's Clinical Periodontology
   (furcation entrances and where each is probed from; the maxillary first premolar's mesial and distal entrances about
   8 mm from the CEJ; the crest about 1.5-2 mm below the CEJ in health); White and Pharoah's Oral Radiology (which films
   show which teeth: bitewings for the posterior teeth, a maxillary premolar's furcation rarely seen on a film).
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
  T.all = function(){ var a = []; for(var i = 1; i <= 32; i++) a.push(catalogue(i)); return a; };
  if(typeof module === 'object' && module.exports) module.exports = T;
  if(typeof window !== 'undefined') window.SH_TEETH = T;
})();
