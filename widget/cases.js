/* study-hubs: the dental case kit (window.shCases), shared by every hub's Patient Box questions.
   One case model -> a periodontal chart, a periapical radiograph and a drawn buccal view, all from the same numbers,
   plus derive() (the 2018 staging and grading, recession types, peri-implant states) and validate() (every number
   realistic and consistent with the others). Loaded by a hub with
     <link rel="stylesheet" href="../../widget/cases.css"> and <script src="../../widget/cases.js"></script>
   before the hub's own script; the hub keeps its cases in PCASES and calls shCases.pboxFigures(q, PCASES) from its
   pboxHTML. How to write a case: vault/how-to/draw-a-patient-box-case.md. CI: node tools/ci/cases.js.

   Anatomy: tooth sizes and shapes follow Wheeler's Dental Anatomy (average crown length, root length, mesiodistal
   width at the contacts and at the cervix; cusp count and position; contact heights; root number, trunk length and
   apical curvature). Charts follow the conventions of a standard probing chart; staging, grading, recession types,
   Glickman classes and peri-implant case definitions as the hubs teach them. Everything drawn is original SVG. */
(function(){
  'use strict';
  var I = {};
  function f1(v){ return +(+v).toFixed(1); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
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
  function poly(pts, open){ return 'M' + pts.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + (open ? '' : 'Z'); }
  function path(cls, pts, open, style){ return '<path class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' d="' + poly(pts, open) + '"/>'; }
  function txt(x, y, t, cls, anchor){ return '<text class="' + (cls || 'dc-t') + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>'; }
  function dot(cls, x, y, r){ return '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '"/>'; }

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

  /* ---------- the model's tooth record, with defaults ---------- */
  function tooth(spec, n){
    var t = (spec.t && spec.t[n]) || {}, z = [0, 0, 0], d = dims(n);
    function arr(o, s, def){ return o && o[s] ? o[s] : def.slice(); }
    var pd = t.pd || {}, rec = t.rec || {}, bop = t.bop || {}, pus = t.pus || {}, pl = t.plaque || {};
    /* defaults: a healthy sulcus of 2 mm whose base sits at the CEJ (the margin 2 mm coronal to it: recession -2, CAL 0) */
    var r = { n:String(n), d:d, missing:!!t.missing, implant:t.implant || null, mob:t.mob || 0, furc:t.furc || {},
      pd:{ f:arr(pd, 'f', [2, 2, 2]), l:arr(pd, 'l', [2, 2, 2]) }, rec:{ f:arr(rec, 'f', [-2, -2, -2]), l:arr(rec, 'l', [-2, -2, -2]) },
      bop:{ f:arr(bop, 'f', z), l:arr(bop, 'l', z) }, pus:{ f:arr(pus, 'f', z), l:arr(pus, 'l', z) }, plaque:{ f:arr(pl, 'f', z), l:arr(pl, 'l', z) },
      bone:t.bone || { m:0, d:0 }, vdef:t.vdef || {}, furcX:t.furcX || 0, calc:!!t.calc, crown:!!t.crown, endo:!!t.endo, amalgam:!!t.amalgam, halo:!!t.halo, raw:t };
    r.cal = { f:r.pd.f.map(function(p, i){ return p + r.rec.f[i]; }), l:r.pd.l.map(function(p, i){ return p + r.rec.l[i]; }) };
    return r;
  }
  function teethOf(spec){ return viewOrder(spec.teeth).map(function(n){ return tooth(spec, n); }); }
  /* radiographic bone level on one side, in mm from the CEJ (the crest sits 1.5 mm from the CEJ in health, so a
     percentage of root length below that; an implant's bone is given in mm below its platform) */
  function boneMM(t, side){ return t.implant ? (t.bone[side] || 0) : Math.max(1.5, (t.bone[side] || 0) / 100 * t.d.rl); }

  /* ---------- derived values: what the numbers add up to under the 2018 staging and grading tables ---------- */
  I.derive = function(spec){
    var ts = teethOf(spec), out = { maxCAL:{ v:-99 }, maxInterdental:{ v:-99 }, maxPD:{ v:-99 }, maxRBL:{ pct:0 }, vertical:0, furc:0, bop:0, sites:0, pus:0, impl:{} };
    ts.forEach(function(t){
      if(t.missing) return;
      if(t.implant){
        /* an implant is read against its baseline film (bone in mm below the platform; ~2 mm of crestal remodeling is
           expected), not staged: health, mucositis (inflamed, no loss beyond remodeling) or peri-implantitis (loss
           beyond it). With no baseline (2018 case definitions): bone 3 mm or more below the most coronal part of the
           implant and/or PD 6 mm or more with profuse bleeding = peri-implantitis. Meffert: ailing (static loss, no
           inflammation), failing (progressing, inflamed), failed (mobile, or a radiolucent line around it). */
        var im = t.implant, base = im.baseline, now = t.bone, infl = t.bop.f.concat(t.bop.l, t.pus.f, t.pus.l).some(Boolean), maxPD = Math.max.apply(null, t.pd.f.concat(t.pd.l));
        var beyond, progressing, dx;
        if(base){ beyond = Math.max((now.m || 0) - Math.max(base.m || 0, 2), (now.d || 0) - Math.max(base.d || 0, 2)); progressing = Math.max((now.m || 0) - (base.m || 0), (now.d || 0) - (base.d || 0)) > 0; }
        else { beyond = Math.max(now.m || 0, now.d || 0) - 3 + .01; progressing = beyond > 0; if(maxPD >= 6 && infl) beyond = Math.max(beyond, .01); }
        dx = t.mob || t.halo ? 'failed implant' : beyond > 0 && infl ? 'peri-implantitis' : infl ? 'peri-implant mucositis' : beyond > 0 ? 'bone loss without inflammation' : 'peri-implant health';
        out.impl[t.n] = { dx:dx, meffert: t.mob || t.halo ? 'failed' : progressing && infl ? 'failing' : beyond > 0 ? 'ailing' : 'healthy', lossBeyondRemodeling:+Math.max(0, beyond).toFixed(1), baseline:!!base };
        return;
      }
      ['f', 'l'].forEach(function(s){
        t.pd[s].forEach(function(p, i){
          out.sites++; if(t.bop[s][i]) out.bop++; if(t.pus[s][i]) out.pus++;
          if(p > out.maxPD.v) out.maxPD = { v:p, tooth:t.n, site:SITE_NAME[i], surface:s };
          var c = t.cal[s][i];
          if(c > out.maxCAL.v) out.maxCAL = { v:c, tooth:t.n, site:SITE_NAME[i], surface:s };
          if(i !== 1 && c > out.maxInterdental.v) out.maxInterdental = { v:c, tooth:t.n, site:SITE_NAME[i], surface:s };
        });
      });
      ['m', 'd'].forEach(function(side){ var b = t.bone[side] || 0; if(b > out.maxRBL.pct) out.maxRBL = { pct:b, tooth:t.n, side:side === 'm' ? 'mesial' : 'distal' };
        if((t.vdef[side] || 0) > out.vertical) out.vertical = t.vdef[side]; });
      var fc = Math.max(t.furc.f || 0, t.furc.l || 0, t.furcX || 0); if(fc > out.furc) out.furc = fc;
    });
    var m = spec.mouth || {};
    out.bopPct = out.sites ? Math.round(100 * out.bop / out.sites) : 0;
    /* severity: interdental CAL first (the gold standard), radiographic bone loss second; the worse one sets the stage */
    var cal = out.maxInterdental.v, rbl = out.maxRBL.pct;
    var sCAL = cal >= 5 ? 3 : cal >= 3 ? 2 : cal >= 1 ? 1 : 0, sRBL = rbl > 33 ? 3 : rbl >= 15 ? 2 : rbl > 0 ? 1 : 0;
    out.severity = Math.max(sCAL, sRBL);
    out.attachmentLoss = cal >= 1 || rbl > 0;
    out.triggers = [];
    if(out.maxPD.v >= 6) out.triggers.push('probing depth of 6 mm or more');
    if(out.vertical >= 3) out.triggers.push('vertical bone loss of 3 mm or more');
    if(out.furc >= 2) out.triggers.push('Class II or III furcation involvement');
    if(m.lost) out.triggers.push((m.lost >= 5 ? '5 or more' : '1 to 4') + ' teeth lost to periodontitis');
    var stage = out.severity;
    if(out.triggers.length) stage = Math.max(stage, 3);
    if(m.lost >= 5 || (m.stage4 && m.stage4.length)) stage = 4;
    out.stage = out.attachmentLoss ? stage : 0;
    out.ratio = spec.age ? +(rbl / spec.age).toFixed(2) : null;
    out.gradeByRatio = out.ratio == null ? 'B' : out.ratio < .25 ? 'A' : out.ratio > 1 ? 'C' : 'B';
    out.modifiers = [];
    if((spec.smoke || 0) >= 10) out.modifiers.push('smoking ' + spec.smoke + ' cigarettes a day');
    if((spec.hba1c || 0) >= 7) out.modifiers.push('HbA1c ' + spec.hba1c + '%');
    out.grade = out.modifiers.length ? 'C' : out.gradeByRatio;
    out.extentPct = m.teeth && m.involved != null ? Math.round(100 * m.involved / m.teeth) : null;
    out.extent = out.extentPct == null ? null : out.extentPct < 30 ? 'localized' : 'generalized';
    out.kind = !out.attachmentLoss ? (out.bopPct >= 10 ? 'gingivitis' : 'health') : 'periodontitis';
    out.dx = out.kind === 'periodontitis' ? (out.extent ? out.extent.charAt(0).toUpperCase() + out.extent.slice(1) + ' ' : '') + 'Stage ' + out.stage + ' Grade ' + out.grade + ' periodontitis' :
      out.kind === 'gingivitis' ? 'Gingivitis on an intact periodontium' : 'Clinical health';
    out.rt = {};
    ts.forEach(function(t){ if(t.missing || t.implant) return; var fr = t.rec.f[1], ip = Math.max(t.cal.f[0], t.cal.f[2], t.cal.l[0], t.cal.l[2]), fc = t.cal.f[1];
      if(fr > 0) out.rt[t.n] = ip <= 0 ? 'RT1' : ip <= fc ? 'RT2' : 'RT3'; });
    return out;
  };

  /* ---------- validate: every number realistic, and consistent with the others ----------
     Returns a list of problems (empty when the case holds up). The ranges are clinical: probing depths 0-12 mm,
     recession -5 (a margin 5 mm up the crown, a swollen pseudopocket) to 10, CAL never negative (a pocket base can't sit coronal to the CEJ),
     CAL within the root, bone loss as a share of root length, a furcation only on a molar and only once bone loss has
     reached the trunk, a Class III through and through, mobility rising with bone loss, implant bone within the
     implant's length and never above its baseline, ages, cigarettes and HbA1c in human ranges. The pocket base and
     the bone crest must agree: in a suprabony pocket the crest sits 0-3 mm apical to the pocket base, and a pocket
     base more than 1.5 mm apical to the crest needs a declared vertical defect that reaches it. */
  I.validate = function(spec){
    var P = [], ts;
    function bad(m){ P.push(m); }
    function num(v, lo, hi, what){ if(typeof v !== 'number' || isNaN(v)) bad(what + ' is not a number'); else if(v < lo || v > hi) bad(what + ' = ' + v + ' is outside ' + lo + '-' + hi); }
    if(!spec || !spec.teeth || !spec.teeth.length) return ['no teeth'];
    spec.teeth.forEach(function(n){ if(!(+n >= 1 && +n <= 32 && +n === Math.floor(+n))) bad('tooth ' + n + ' is not a universal number'); });
    var arch = spec.teeth.map(function(n){ return isUpper(n); });
    if(arch.some(Boolean) && !arch.every(Boolean)) bad('the teeth are not all in one arch');
    try { ts = teethOf(spec); } catch(e){ return ['teeth: ' + e.message]; }
    if(spec.age != null) num(spec.age, 12, 105, 'age');
    if(spec.smoke != null) num(spec.smoke, 0, 80, 'cigarettes a day');
    if(spec.hba1c != null) num(spec.hba1c, 4, 16, 'HbA1c');
    var m = spec.mouth;
    if(m){ if(m.teeth != null) num(m.teeth, 1, 32, 'teeth in the mouth'); if(m.involved != null){ num(m.involved, 0, 32, 'teeth involved'); if(m.teeth != null && m.involved > m.teeth) bad('more teeth involved than teeth in the mouth'); }
      if(m.lost != null){ num(m.lost, 0, 32, 'teeth lost'); if(m.teeth != null && m.lost + m.teeth > 32) bad('teeth lost + teeth present exceed 32'); } }
    var g = spec.gingiva || {};
    if(g.kt != null) num(g.kt, 0, 9, 'keratinized tissue width');
    if(g.edema != null) num(g.edema, 0, 1, 'edema');
    if(g.look && ['healthy', 'inflamed', 'fibrotic'].indexOf(g.look) < 0) bad('gingiva.look must be healthy, inflamed or fibrotic');
    ts.forEach(function(t){
      var w = '#' + t.n + ' ', raw = t.raw;
      Object.keys(raw).forEach(function(k){ if(['pd', 'rec', 'bop', 'pus', 'plaque', 'mob', 'furc', 'bone', 'vdef', 'furcX', 'calc', 'crown', 'endo', 'amalgam', 'implant', 'missing', 'halo', 'lift'].indexOf(k) < 0) bad(w + 'unknown field ' + k); });
      if(t.missing) return;
      if(t.mob != null) num(t.mob, 0, 3, w + 'mobility');
      ['f', 'l'].forEach(function(s){
        if(t.pd[s].length !== 3 || t.rec[s].length !== 3) bad(w + s + ': three sites per surface');
        t.pd[s].forEach(function(p, i){
          var site = w + (s === 'f' ? 'facial' : 'lingual') + ' ' + SITE_NAME[i] + ' ';
          num(p, 0, 12, site + 'probing depth'); if(p !== Math.round(p)) bad(site + 'probing depth is not a whole mm');
          var r = t.rec[s][i]; num(r, -5, 10, site + 'recession'); if(r !== Math.round(r)) bad(site + 'recession is not a whole mm');
          var c = p + r;
          if(c < 0) bad(site + 'CAL ' + c + ' is negative (the pocket base would sit coronal to the CEJ)');
          if(!t.implant && c > t.d.rl - 1) bad(site + 'CAL ' + c + ' runs past the root (' + t.d.rl + ' mm)');
          if(t.implant && c > t.implant.len - 1) bad(site + 'CAL ' + c + ' runs past the implant (' + t.implant.len + ' mm)');
          [['bop', t.bop], ['pus', t.pus], ['plaque', t.plaque]].forEach(function(e){ var v = e[1][s][i]; if(v !== 0 && v !== 1) bad(site + e[0] + ' must be 0 or 1'); });
          if(t.pus[s][i] && p < 4) bad(site + 'suppuration from a ' + p + ' mm site');
          if(t.pus[s][i] && !t.bop[s][i]) bad(site + 'suppuration without bleeding');
        });
      });
      if(t.implant){
        var im = t.implant;
        num(im.w, 3, 7, w + 'implant width'); num(im.len, 6, 18, w + 'implant length');
        ['m', 'd'].forEach(function(sd){ var b = t.bone[sd] || 0; num(b, 0, im.len - 1, w + 'implant bone loss ' + sd);
          if(im.baseline){ num(im.baseline[sd] || 0, 0, im.len - 1, w + 'baseline bone ' + sd); if(b < (im.baseline[sd] || 0)) bad(w + 'bone at ' + sd + ' is higher than at the baseline'); } });
        if(t.furc.f || t.furc.l || t.furcX) bad(w + 'an implant has no furcation');
        if(t.endo || t.amalgam || t.calc) bad(w + 'an implant has no root filling, amalgam or root calculus');
        if(t.mob && !t.halo) bad(w + 'a mobile implant has lost osseointegration: set halo:true so the film shows it');
        return;
      }
      if(t.halo) bad(w + 'halo is for implants');
      ['m', 'd'].forEach(function(sd){
        var pct = t.bone[sd] || 0; num(pct, 0, 90, w + 'bone loss ' + sd + ' (% of root length)');
        var vd = t.vdef[sd] || 0; num(vd, 0, 8, w + 'vertical defect ' + sd);
        var crest = boneMM(t, sd), si = sd === 'm' ? 0 : 2, cal = Math.max(t.cal.f[si], t.cal.l[si]);
        if(crest + vd > t.d.rl - 1) bad(w + 'the ' + sd + ' defect reaches the apex');
        if(cal > crest + vd + 1.5) bad(w + SITE_NAME[si] + ' pocket base (CAL ' + cal + ' mm) sits more than 1.5 mm below the bone (' + f1(crest + vd) + ' mm from the CEJ): add a vertical defect or less CAL');
        if(crest + vd > cal + 3.5 && cal > 0) bad(w + SITE_NAME[si] + ' bone (' + f1(crest + vd) + ' mm) sits more than 3.5 mm below the pocket base (CAL ' + cal + ' mm)');
        if(vd && cal < crest + vd - 1.5) bad(w + SITE_NAME[si] + ' vertical defect ' + vd + ' mm deeper than the pocket reaches');
      });
      var maxBone = Math.max(t.bone.m || 0, t.bone.d || 0);
      if(t.mob >= 2 && maxBone < 30) bad(w + 'mobility ' + t.mob + ' with only ' + maxBone + '% bone loss');
      if(t.mob === 3 && maxBone < 50) bad(w + 'mobility 3 needs severe bone loss');
      if(maxBone >= 70 && !t.mob) bad(w + maxBone + '% bone loss with no mobility');
      var fcs = [t.furc.f || 0, t.furc.l || 0];
      fcs.forEach(function(f){ num(f, 0, 3, w + 'furcation class'); });
      if((fcs[0] || fcs[1] || t.furcX) && !t.d.tr) bad(w + 'a furcation on a single-rooted tooth');
      if(t.d.tr){
        var fmax = Math.max(fcs[0], fcs[1]);
        if(fmax >= 1 && Math.max(boneMM(t, 'm'), boneMM(t, 'd')) < t.d.tr - 1.5 && !t.furcX) bad(w + 'a furcation involvement before bone loss has reached the root trunk (' + t.d.tr + ' mm)');
        if(fmax >= 2 && !t.furcX) bad(w + 'a Class II or III furcation should show on the film: set furcX');
        if(t.furcX > fmax) bad(w + 'the film shows more furcation loss (furcX ' + t.furcX + ') than the probe found (' + fmax + ')');
        if((fcs[0] === 3) !== (fcs[1] === 3) && !t.d.pal) bad(w + 'a Class III furcation is through and through: both surfaces');
      }
      if(t.endo && !(t.crown || t.amalgam)) bad(w + 'a root-filled tooth needs a restoration (crown or amalgam)');
    });
    return P;
  };

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

  /* ---------- the periodontal chart: an SVG strip per surface plus the numbers as a table ---------- */
  var CK = 5.2, CW = 46, CPAD_L = 34;
  /* one tooth drawn crown-up in a column, in chart px: the CEJ at y0, the crown above it, the root (or roots) below */
  function chartTooth(t, cx, y0, k, mr){
    var d = t.d, s = '', sg = mr ? -1 : 1;   /* mesial at -x in the outline; mirror when mesial faces right */
    function X(x){ return cx + sg * x * k; }
    if(t.implant){
      var hw = t.implant.w / 2 * k, len = t.implant.len * k, L = [], R = [], pitch = .9 * k, n = Math.floor((len - 1.5 * k) / pitch), i;
      L.push([cx - hw, y0]); R.push([cx + hw, y0]);
      for(i = 0; i < n; i++){ var yy = y0 + .8 * k + i * pitch; L.push([cx - hw, yy], [cx - hw - .3 * k, yy + pitch * .4], [cx - hw, yy + pitch * .75]); R.push([cx + hw, yy + pitch * .3], [cx + hw + .3 * k, yy + pitch * .65], [cx + hw, yy + pitch]); }
      L.push([cx - hw * .7, y0 + len]); R.push([cx + hw * .7, y0 + len]);
      s += path('dc-implant', L.concat(R.reverse()));
      if(!t.implant.cover) s += path('dc-crown dc-restored', dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), y0 - p[1] * k]; }));
      return s;
    }
    var back = mkBack(d, X, k, y0), roots = mkRoots(d, X, k, y0);
    if(back) s += path('dc-root dc-back', rootOutline(back, 0, y0, y0));
    roots.forEach(function(r){ s += path('dc-root', rootOutline(r, 0, y0, y0)); });
    if(d.tr){ var tp = trunkPts(roots, sg, 0, y0 - 1, y0 + d.tr * k, k); if(tp) s += path('dc-root dc-trunk', tp); }
    s += path('dc-crown' + (t.crown ? ' dc-restored' : ''), dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), y0 - p[1] * k]; }));
    if(t.amalgam) s += path('dc-amalgam', [[cx - d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .22 * k, y0 - d.ch * .62 * k], [cx - d.cw * .22 * k, y0 - d.ch * .62 * k]]);
    return s;
  }
  function furcMark(cls, x, y, r){
    var tri = [[x, y + r], [x - r, y - r * .7], [x + r, y - r * .7]];
    if(cls >= 3) return path('dc-furc dc-furc3', tri);
    var s = path('dc-furc', tri);
    if(cls === 2) s += path('dc-furc dc-furc3', [[x, y + r], [x - r / 2, y + r * .15], [x + r / 2, y + r * .15]]);
    return s;
  }
  /* one surface strip: pd/rec/bop/pus for surface sf ('f' or 'l'); upper arches are shown crowns down */
  function chartStrip(spec, ts, sf, o){
    var up = isUpper(ts[0].n), k = CK, n = ts.length, W = CPAD_L + n * CW + 8, top = 16, numsY = 12;
    var mmUp = 13, mmDown = 15, y0 = top + mmUp * k, H = y0 + mmDown * k + 22, s = '';
    var hide = o.hide || {};
    s += '<rect class="dc-paper" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
    for(var mm = -3; mm <= 12; mm++){ var gy = y0 + mm * k; s += '<path class="dc-grid' + (mm === 0 ? ' dc-cej' : mm % 5 === 0 ? ' dc-grid5' : '') + '" d="M' + CPAD_L + ' ' + f1(gy) + 'H' + (W - 8) + '"/>'; }
    [0, 5, 10].forEach(function(mm){ s += txt(CPAD_L - 4, y0 + mm * k + 3.5, mm === 0 ? 'CEJ' : mm + ' mm', 'dc-ax', 'end'); });
    var inner = '';
    ts.forEach(function(t, i){
      var cx = CPAD_L + i * CW + CW / 2, mr = mesialRight(t.n), so = siteOrder(t.n), sx = [cx - 14, cx, cx + 14];
      if(t.missing){ inner += '<path class="dc-x" d="M' + f1(cx - 10) + ' ' + f1(y0 - 24) + 'l20 20m0 -20l-20 20"/>'; return; }
      inner += chartTooth(t, cx, y0, k, mr);
      if(isMolar(t.n) && !hide.furc && (t.furc[sf] || 0) > 0) inner += furcMark(t.furc[sf], cx, y0 + t.d.tr * k + 2, 5);
      /* the gingival margin and the pocket base through the three sites (tooth terms m, c, d in viewer order); the
         middle site's CEJ sits where the cervical line dips */
      var gm = [], pb = [], dip = t.implant ? 0 : (t.d.cej || 0) * k;
      so.forEach(function(si, j){ var rec = t.rec[sf][si], pd = t.pd[sf][si], base = y0 + (si === 1 ? dip : 0); gm.push([sx[j], base + rec * k]); pb.push([sx[j], base + (rec + pd) * k]); });
      inner += path('dc-pocket', gm.concat(pb.slice().reverse()));
      inner += path('dc-gm', gm, true) + path('dc-pd', pb, true);
      so.forEach(function(si, j){ var p = pb[j];
        if(t.bop[sf][si]) inner += dot('dc-bop', p[0], p[1], 3.2);
        if(t.pus[sf][si]) inner += dot('dc-pus', p[0] + 5, p[1] - 3, 2.6); });
    });
    s += up ? '<g transform="translate(0 ' + f1(2 * y0) + ') scale(1 -1)">' + inner + '</g>' : inner;
    ts.forEach(function(t, i){ var cx = CPAD_L + i * CW + CW / 2;
      s += txt(cx, up ? H - 6 : numsY, '#' + t.n, 'dc-num', 'middle');
      if(!t.missing && !hide.mob) s += txt(cx, up ? numsY : H - 6, 'M' + t.mob, 'dc-mob', 'middle'); });
    var label = (sf === 'f' ? 'Facial' : 'Lingual') + ' surfaces, ' + (up ? 'upper' : 'lower') + ' ' + ts[0].n + ' to ' + ts[n - 1].n;
    return '<svg class="dc-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label + ': the probing chart drawn as lines; the numbers are in the table below') + '">' + s + '</svg>';
  }
  function chartTable(spec, ts, sf, o){
    var hide = o.hide || {};
    function cells(fn){ return ts.map(function(t){ if(t.missing) return '<td class="pc-miss">X</td>'; return '<td>' + fn(t) + '</td>'; }).join(''); }
    function sites(t, arr, mark){ return '<span class="pc-sites">' + siteOrder(t.n).map(function(si){ return '<span class="' + (mark && mark[si] ? 'bop' : '') + '">' + arr[si] + '</span>'; }).join('') + '</span>'; }
    var h = '<table class="pchart dc-table"><caption class="dc-cap">' + (sf === 'f' ? 'Facial' : 'Lingual') + ' surfaces: three sites per tooth, left to right as you look at the patient</caption><thead><tr><th scope="row">Tooth</th>' +
      ts.map(function(t){ return '<th scope="col">#' + t.n + (t.implant ? '<br><small>implant</small>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr><th scope="row">Probing depth</th>' + cells(function(t){ return sites(t, t.pd[sf], t.bop[sf]); }) + '</tr>';
    h += '<tr><th scope="row">Recession</th>' + cells(function(t){ return sites(t, t.rec[sf]); }) + '</tr>';
    if(!hide.cal) h += '<tr><th scope="row">CAL</th>' + cells(function(t){ return sites(t, t.cal[sf]); }) + '</tr>';
    if(ts.some(function(t){ return t.pus[sf].some(Boolean); })) h += '<tr><th scope="row">Suppuration</th>' + cells(function(t){ return siteOrder(t.n).map(function(si){ return t.pus[sf][si] ? '<span class="pc-flag">+</span>' : '<span>–</span>'; }).join(''); }) + '</tr>';
    if(ts.some(function(t){ return t.plaque[sf].some(Boolean); })) h += '<tr><th scope="row">Plaque</th>' + cells(function(t){ return siteOrder(t.n).map(function(si){ return t.plaque[sf][si] ? '<span class="pc-flag">+</span>' : '<span>–</span>'; }).join(''); }) + '</tr>';
    if(sf === 'f'){
      if(!hide.mob) h += '<tr><th scope="row">Mobility</th>' + cells(function(t){ return t.mob ? '<span class="pc-flag">' + t.mob + '</span>' : '0'; }) + '</tr>';
      if(!hide.furc && ts.some(function(t){ return isMolar(t.n) && !t.missing; })) h += '<tr><th scope="row">Furcation (Glickman)</th>' + cells(function(t){ if(!isMolar(t.n)) return '–'; var f = t.furc.f || 0, l = t.furc.l || 0; return (f ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][f] + '</span> facial' : '') + (f && l ? ', ' : '') + (l ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][l] + '</span> lingual' : '') || 'none'; }) + '</tr>';
    }
    return '<div class="pchart-wrap">' + h + '</tbody></table></div>';
  }
  I.chart = function(spec, o){
    o = o || {}; var ts = teethOf(spec), hide = o.hide || {}, s = '';
    var surfaces = o.lingual === false ? ['f'] : (spec.lingual === false ? ['f'] : ['f', 'l']);
    surfaces.forEach(function(sf){ s += chartStrip(spec, ts, sf, o) + chartTable(spec, ts, sf, o); });
    s += '<div class="pchart-key">Blue line: the gingival margin. Red line: the base of the pocket (probing depth below the margin). <span class="bop">Red dot</span>: bleeding on probing; yellow dot: suppuration. Recession is the CEJ to the margin, in mm; a negative number means the margin sits coronal to the CEJ.' +
      (hide.cal ? '' : ' CAL = probing depth + recession.') + ' M = mobility (0-3).' + (hide.furc ? '' : ' Furcation triangles: open = Class I, half filled = II, filled = III.') + '</div>';
    return s;
  };

  /* ---------- the radiograph ---------- */
  /* o: { t:type, x, k, occ, m (mirror: mesial faces right), bone:[mesial mm, distal mm] below the normal crest, implant,
     lift, funnel, pdl, lam, crown, endo, amalgam, calc, halo } */
  function xrTooth(o){
    var d = XT[o.t], k = o.k, sg = o.m ? -1 : 1, top = o.occ + (o.lift || 0) * k, cej = top + d.ch * k;
    function X(x){ return o.x + sg * x * k; }
    var cr = dense(crownMM(d), true, 6).map(function(p){ return [X(p[0]), cej - p[1] * k]; });
    var g = { o:o, d:d, k:k, x:o.x, cej:cej, top:top, sg:sg, X:X, crown:cr, roots:[] };
    var crestY = cej + 1.5 * k, bm = (o.bone && o.bone[0]) || 0, bd = (o.bone && o.bone[1]) || 0;
    g.crestM = crestY + bm * k; g.crestD = crestY + bd * k;
    if(o.implant) return g;
    g.roots = mkRoots(d, X, k, cej);
    g.back = mkBack(d, X, k, cej);
    return g;
  }
  function crestLR(g){ return g.sg > 0 ? [g.crestM, g.crestD] : [g.crestD, g.crestM]; }
  function socketSVG(g, dd, cls){
    if(g.o.implant) return '';
    var c = crestLR(g), s = '', fun = (g.o.funnel || 0) * g.k;
    g.roots.forEach(function(r){ s += path(cls, rootOutline(r, dd * g.k, c[0], c[1], fun)); });
    if(g.d.tr){ var y0 = Math.min(c[0], c[1]), tf = trunkPts(g.roots, g.sg, dd * g.k, y0, g.cej + g.d.tr * g.k, g.k); if(tf) s += path(cls, tf); }
    return s;
  }
  function toothSVG(g){
    var s = '', o = g.o, k = g.k, d = g.d;
    if(o.implant) return implantSVG(g);
    if(g.back) s += path('xr-dentin', rootOutline(g.back, 0, g.cej, g.cej), false, 'opacity:.5');
    s += path('xr-dentin', [[g.X(-d.cv / 2 + .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .1), g.cej + 2], [g.X(-d.cv / 2 + .1), g.cej + 2]]);
    g.roots.forEach(function(r){ s += path('xr-dentin', rootOutline(r, 0, g.cej, g.cej)); });
    if(d.tr){ var tp = trunkPts(g.roots, g.sg, 0, g.cej - 1, g.cej + d.tr * k, k); if(tp) s += path('xr-dentin', tp); }
    s += path('xr-enamel', g.crown);
    /* the enamel cap thins to nothing at the CEJ; dentin inside it */
    var E = (d.s === 'maxM' || d.s === 'manM1' || d.s === 'manM2') ? 1.5 : (d.s === 'maxP1' || d.s === 'maxP2' || d.s === 'manP1' || d.s === 'manP2') ? 1.3 : 1.0, cy = g.top + d.ch * .72 * k;
    var dej = g.crown.map(function(p){ var f = Math.max(0, Math.min(1, (g.cej - p[1]) / (d.ch * k))), th = E * k * Math.pow(f, .55), dx = g.x - p[0], dy = cy - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * th, p[1] + dy / L * th]; });
    s += path('xr-dentin', dej);
    s += pulpSVG(g);
    if(o.endo) s += endoSVG(g);
    if(o.amalgam) s += amalgamSVG(g);
    if(o.crown) s += crownSVG(g);
    if(o.calc) s += calcSVG(g);
    return s;
  }
  function pulpSVG(g){
    var k = g.k, d = g.d, s = '', X = g.X, c = g.cej;
    if(d.tr){
      var w = d.cv * .3, horns = d.s === 'manM1' ? [[-w * .8, 3.1], [w * .4, 2.9]] : [[-w * .7, 3.0], [w * .7, 2.8]];
      s += path('xr-pulp', dense([[X(-w), c + 1.4 * k], [X(-w - .25), c - .6 * k], [X(horns[0][0]), c - horns[0][1] * k], [X(0), c - 2.1 * k], [X(horns[1][0]), c - horns[1][1] * k], [X(w + .25), c - .6 * k], [X(w), c + 1.4 * k]], true, 6));
      g.roots.forEach(function(r){ var L = [], R = [], N = 10;
        for(var i = 0; i <= N; i++){ var t = .06 + .86 * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (.55 - .4 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
        s += path('xr-pulp', L.concat(R)); });
      return s;
    }
    var r = g.roots[0], horn = (d.s === 'maxC' || d.s === 'manC') ? .5 : (d.s.indexOf('P') > 0) ? .42 : .38, L2 = [], R2 = [], N2 = 14;
    for(var j = 0; j <= N2; j++){
      var tt = -horn * d.ch * k / r.len + (horn * d.ch * k / r.len + .93) * j / N2, yy = r.y0 + tt * r.len;
      var xx = tt < 0 ? r.a0 : rAx(r, tt);
      var hw2 = tt < 0 ? (1 - Math.pow(-tt / (horn * d.ch * k / r.len), 2)) * 1.05 * k : (.95 - .8 * Math.pow(tt, .7)) * k * .85;
      L2.push([xx - Math.max(.45, hw2), yy]); R2.unshift([xx + Math.max(.45, hw2), yy]);
    }
    return path('xr-pulp', dense(L2.concat(R2), true, 3));
  }
  /* a root canal filling: radiopaque gutta-percha down each canal to just short of the apex */
  function endoSVG(g){
    var s = '', k = g.k;
    g.roots.forEach(function(r){ var L = [], R = [], N = 10;
      for(var i = 0; i <= N; i++){ var t = .02 + .9 * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (.5 - .36 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
      s += path('xr-metal', L.concat(R)); });
    if(g.d.tr) s += path('xr-metal', [[g.X(-g.d.cv * .3), g.cej + 1.2 * k], [g.X(g.d.cv * .3), g.cej + 1.2 * k], [g.X(g.d.cv * .3), g.cej - .4 * k], [g.X(-g.d.cv * .3), g.cej - .4 * k]]);
    return s;
  }
  function amalgamSVG(g){
    var k = g.k, d = g.d;
    var occ = g.crown.filter(function(p){ return p[1] < g.top + d.ch * .42 * k; });
    var floor = g.top + d.ch * .5 * k, box = g.top + d.ch * .66 * k;
    occ = occ.map(function(p){ return [g.x + (p[0] - g.x) * .97, p[1] + .25 * k]; });
    var a = occ[0], b = occ[occ.length - 1];
    function at(p, f, y){ return [g.x + (p[0] - g.x) * f, y]; }
    return path('xr-metal', occ.concat([[b[0], box], at(b, .74, box + .2 * k), at(b, .62, floor), at(a, .62, floor), at(a, .74, box + .2 * k), [a[0], box]]));
  }
  /* a full-coverage crown: a metal (or metal-ceramic) cap that follows the crown outline down to a margin at the CEJ */
  function crownSVG(g){
    var k = g.k, inner = g.crown.map(function(p){ var dx = g.x - p[0], dy = (g.top + g.d.ch * .7 * k) - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * .9 * k, p[1] + dy / L * .9 * k]; });
    return path('xr-metal', g.crown.concat(inner.slice().reverse()), false, 'opacity:.92');
  }
  /* calculus: bright spurs on the proximal root surfaces just below the CEJ */
  function calcSVG(g){
    var k = g.k, s = '', r0 = g.roots[0], rN = g.roots[g.roots.length - 1];
    [[r0, -1], [rN, 1]].forEach(function(e){ var r = e[0], sg = e[1]; for(var i = 0; i < 3; i++){ var t = .08 + i * .09, x = rAx(r, t) + sg * rHw(r, t), y = r.y0 + t * r.len;
      s += path('xr-lam', [[x, y - .5 * k], [x + sg * (.7 + (i % 2) * .3) * k, y + .1 * k], [x, y + .7 * k]]); } });
    return s;
  }
  function implantSVG(g){
    var o = g.o, k = g.k, x = g.x, im = o.implant, hw = im.w / 2 * k, y0 = g.cej + 1.5 * k, len = im.len * k, s = '';
    var L = [], R = [], pitch = .8 * k, n = Math.floor((len - 1.2 * k) / pitch);
    L.push([x - hw, y0]); R.push([x + hw, y0]);
    for(var i = 0; i < n; i++){ var yy = y0 + .6 * k + i * pitch, taper = 1 - .18 * Math.pow(i / n, 2);
      L.push([x - hw * taper, yy], [x - hw * taper - .38 * k, yy + pitch * .35], [x - hw * taper, yy + pitch * .7]);
      R.push([x + hw * taper, yy + pitch * .3], [x + hw * taper + .38 * k, yy + pitch * .65], [x + hw * taper, yy + pitch]); }
    var yb = y0 + len, tip = hw * .72;
    L.push([x - tip, yb - .6 * k], [x - tip * .6, yb]); R.push([x + tip, yb - .6 * k], [x + tip * .6, yb]);
    /* excess cement left under the crown margin: a bright fleck on the mesial side, below the margin */
    if(im.cement && !o.cover) s += path('xr-metal', [[x - hw * .95 * g.sg - .1 * k * g.sg, y0 - .4 * k], [x - hw * 1.35 * g.sg, y0 - .1 * k], [x - hw * 1.25 * g.sg, y0 + .9 * k], [x - hw * .95 * g.sg, y0 + .7 * k]]);
    /* a failed implant: a radiolucent line all round it (fibrous tissue where bone should touch the threads) */
    if(o.halo) s += path('xr-pdl', [[x - hw - .9 * k, y0 - .2 * k], [x + hw + .9 * k, y0 - .2 * k], [x + tip + .9 * k, yb + .3 * k], [x - tip - .9 * k, yb + .3 * k]], false, 'opacity:.95');
    s += path('xr-metal', L.concat(R.reverse()));
    if(!o.cover){
      s += path('xr-metal', [[x - hw * .84, y0 + .1 * k], [x - hw * .74, y0 - 2.6 * k], [x + hw * .74, y0 - 2.6 * k], [x + hw * .84, y0 + .1 * k]]);
      var y1 = g.top + g.d.ch * .5 * k, ha = hw * .74, drop = (y0 - 1.1 * k) - g.cej;
      var cw = g.crown.map(function(p){ var f = Math.max(0, Math.min(1, (p[1] - y1) / (g.cej - y1))), e = f * f * (3 - 2 * f), dx = p[0] - x;
        return [x + dx * (1 - e) + (dx < 0 ? -ha : ha) * e, p[1] + e * drop]; });
      s += path('xr-crown', cw);
      s += path('xr-bore', [[x - .58 * k, y0 + 3 * k], [x - .58 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 1.9 * k], [x + .58 * k, y0 - 1.9 * k], [x + .58 * k, y0 + 3 * k]]);
      s += path('xr-metal', [[x - .42 * k, y0 + 2.8 * k], [x - .42 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 1.9 * k], [x + .42 * k, y0 - 1.9 * k], [x + .42 * k, y0 + 2.8 * k]]);
    } else {
      /* a cover screw: the implant sits submerged under the mucosa, its top flush with the crest */
      s += path('xr-metal', [[x - hw * .7, y0 + .1 * k], [x - hw * .5, y0 - .5 * k], [x + hw * .5, y0 - .5 * k], [x + hw * .7, y0 + .1 * k]]);
      s += path('xr-bore', [[x - .5 * k, y0 + 2.6 * k], [x - .5 * k, y0 + .2 * k], [x + .5 * k, y0 + .2 * k], [x + .5 * k, y0 + 2.6 * k]]);
    }
    return s;
  }
  /* bone up to the crest on each root surface, the septum between neighbors; an angular defect drops the crest beside
     its root to the defect's base while the septum keeps its height; a furcation lesion darkens the space between the
     roots below the trunk; trabeculae inside */
  function boneSVG(gs, w, yBottom, seed){
    var top = [], k = gs[0].k, extra = '';
    function side(g, right, y){
      if(g.o.implant) return g.x + (right ? 1 : -1) * (g.o.implant.w / 2 + .1) * k;
      var dd = ((g.o.pdl || .2) + (g.o.lam || .22)) * k, xs = g.roots.map(function(r){ var t = Math.max(0, (y - r.y0) / r.len); return rAx(r, t) + (right ? 1 : -1) * rHw(r, t); });
      return (right ? Math.max.apply(null, xs) + dd : Math.min.apply(null, xs) - dd);
    }
    gs.forEach(function(g, i){
      var c = crestLR(g), vd = g.o.vdef || [0, 0], vL = g.sg > 0 ? vd[0] : vd[1], vR = g.sg > 0 ? vd[1] : vd[0];
      var xl = side(g, false, c[0]), xr = side(g, true, c[1]);
      if(i === 0) top.push([-5, c[0] - .3 * k]);
      if(vL) top.push([xl - 1.6 * k, c[0] - .2 * k], [xl - .3 * k, c[0] + vL * k * .85]);
      top.push([xl, c[0] + vL * k], [g.x, Math.max(c[0] + vL * k, c[1] + vR * k) * .35 + Math.max(c[0], c[1]) * .65 + .4 * k], [xr, c[1] + vR * k]);
      if(vR) top.push([xr + .3 * k, c[1] + vR * k * .85], [xr + 1.6 * k, c[1] - .2 * k]);
      var nx = gs[i + 1];
      if(nx){ var cn = crestLR(nx), xn = side(nx, false, cn[0]);
        var lo = Math.min(c[1], cn[0]), px = c[1] > cn[0] + 2 ? xn - .9 * k : cn[0] > c[1] + 2 ? xr + .9 * k : (xr + xn) / 2;
        top.push([px, lo - .4 * k]); }
      else top.push([w + 5, c[1] - .3 * k]);
      if(g.d.tr && g.o.furcX && !g.o.implant){ var yf = g.cej + g.d.tr * k, dep = (g.o.furcX >= 3 ? 3.2 : g.o.furcX === 2 ? 2.2 : 1.1) * k, l = g.roots[0], r = g.roots[1];
        var tl = Math.max(0, (yf - l.y0) / l.len), tr = Math.max(0, (yf - r.y0) / r.len);
        var xa = rAx(l, tl) + rHw(l, tl) * .9, xb = rAx(r, tr) - rHw(r, tr) * .9;
        extra += path('xr-pdl', dense([[xa, yf - .4 * k], [xb, yf - .4 * k], [(xa + xb) / 2 + (xb - xa) * .22, yf + dep * .75], [(xa + xb) / 2, yf + dep], [(xa + xb) / 2 - (xb - xa) * .22, yf + dep * .75]], true, 4), false, 'opacity:.85'); }
    });
    var s = path('xr-bone', top.concat([[w + 5, yBottom], [-5, yBottom]]));
    function yTop(x){ for(var i = 1; i < top.length; i++) if(x <= top[i][0]){ var a = top[i - 1], b = top[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return top[top.length - 1][1]; }
    var r = rnd(seed), yMin = Math.min.apply(null, top.map(function(p){ return p[1]; }));
    for(var i = 0; i < 230; i++){ var cx = r() * w, cy = yMin + r() * (yBottom - yMin), rx = 1.5 + r() * 5, ry = 1 + r() * 2.6, a = Math.round(r() * 180), cl = r() < .55 ? 'xr-tb' : 'xr-tb2';
      if(cy < yTop(cx) + 3 || cy > yBottom - 2) continue;
      s += '<ellipse class="' + cl + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + a + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    s += path('xr-cortex', top.slice(1, -1), true);
    return s + extra;
  }
  function rowXR(list, x0, occ, k){
    var x = x0, gs = [];
    list.forEach(function(o){ var d = XT[o.t]; o.k = k; o.occ = occ; x += (o.gap || 0) * k; o.x = x + d.cw * k / 2; gs.push(xrTooth(o)); x += d.cw * k - .15 * k; });
    return gs;
  }
  function filmBG(gs, w, h, seed){
    var s = '<rect class="xr-soft" x="0" y="' + f1(gs[0].top - 1.2 * gs[0].k) + '" width="' + w + '" height="' + f1(h) + '"/>';
    s += boneSVG(gs, w, h + 60, seed);
    gs.forEach(function(g){ s += socketSVG(g, (g.o.pdl || .2) + (g.o.lam || .22), 'xr-lam'); });
    gs.forEach(function(g){ s += socketSVG(g, g.o.pdl || .2, 'xr-pdl'); });
    return s;
  }
  /* a periapical film of the case's teeth: bone levels, defects, furcations, restorations and implants from the model */
  I.film = function(spec, o){
    o = o || {}; var ts = teethOf(spec), up = isUpper(ts[0].n), k = o.k || 9;
    var list = [], seed = 0, width = 0, gapFirst = 0;
    ts.forEach(function(t, i){
      var d = t.d, mr = mesialRight(t.n), x = { t:typeOf(t.n), m:mr };
      seed += +t.n * (i + 3);
      width += d.cw;
      if(t.missing){ if(list.length) list[list.length - 1].gapAfter = d.cw; else gapFirst += d.cw; return; }
      /* bone loss % of root length -> mm below the normal crest (1.5 mm below the CEJ); an implant's bone is in mm
         below its platform, which sits at that crest line */
      var bm = t.implant ? (t.bone.m || 0) : Math.max(0, boneMM(t, 'm') - 1.5), bd = t.implant ? (t.bone.d || 0) : Math.max(0, boneMM(t, 'd') - 1.5);
      x.bone = [bm, bd]; x.vdef = [t.vdef.m || 0, t.vdef.d || 0]; x.furcX = t.furcX;
      x.crown = t.crown; x.endo = t.endo; x.amalgam = t.amalgam; x.calc = t.calc; x.lift = t.raw.lift || 0; x.halo = t.halo;
      if(t.mob >= 2) x.pdl = .34;
      if(t.implant){ x.implant = t.implant; x.cover = !!t.implant.cover; }
      list.push(x);
    });
    list.forEach(function(x, i){ if(i && list[i - 1].gapAfter) x.gap = list[i - 1].gapAfter; else if(!i && gapFirst) x.gap = gapFirst; });
    var w = Math.round(width * k + 48), h = o.h || Math.round(30 * k), gs = rowXR(list, 20, 2.6 * k, k);
    var inner = filmBG(gs, w, h, seed) + gs.map(toothSVG).join('');
    if(up) inner = '<g transform="translate(0 ' + h + ') scale(1 -1)">' + inner + '</g>';
    var label = o.aria || ('Periapical radiograph of ' + (up ? 'upper' : 'lower') + ' teeth ' + ts.map(function(t){ return '#' + t.n; }).join(', ') + (up ? ', shown crowns down' : ''));
    var dotP = up ? [w - 16, h - 9] : [w - 16, 9];
    return '<svg class="xr dc-film" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + inner + '<circle class="xr-dot" cx="' + dotP[0] + '" cy="' + dotP[1] + '" r="3"/></svg>';
  };

  /* ---------- the drawn buccal view ---------- */
  I.view = function(spec, o){
    o = o || {}; var ts = teethOf(spec), up = isUpper(ts[0].n), k = o.k || 8.2, g = spec.gingiva || {};
    var look = g.look || 'healthy', edema = g.edema != null ? g.edema : (look === 'inflamed' ? 1 : 0);
    var n = ts.length, w = 0; ts.forEach(function(t){ w += t.d.cw * k - .2 * k; });
    var W = Math.round(w + 60), H = 230, occ = up ? H - 62 : 62, dir = up ? -1 : 1;   /* occ: the incisal edges; dir +1 = roots go down (lower) */
    var s = '<rect class="io-bg" x="0" y="0" width="' + W + '" height="' + H + '" rx="14"/>';
    s += '<rect class="io-mucosa dc-mucosa' + (look === 'inflamed' ? ' dc-inflamed' : '') + '" x="0" y="' + (up ? 0 : occ) + '" width="' + W + '" height="' + (up ? occ + 10 : H - occ) + '"/>';
    var x = 30, cols = [];
    ts.forEach(function(t){ var d = t.d, mr = mesialRight(t.n), cx = x + d.cw * k / 2; cols.push({ t:t, cx:cx, d:d, mr:mr }); x += d.cw * k - .2 * k; });
    /* mucogingival junction: the attached gingiva is lighter; its width from the spec (mm), 4 by default */
    var kt = (g.kt != null ? g.kt : 4) * k, mgj = [];
    cols.forEach(function(c){ var cej = occ + dir * c.d.ch * k; mgj.push([c.cx - c.d.cw * k / 2, cej + dir * (kt + .6 * k)], [c.cx, cej + dir * (kt - .3 * k)]); });
    mgj.push([W + 5, mgj[mgj.length - 1][1]]); mgj.unshift([-5, mgj[0][1]]);
    var mg = dense(mgj, false, 5);
    s += path('io-gum dc-attached' + (look === 'inflamed' ? ' dc-inflamed' : look === 'fibrotic' ? ' dc-fibrotic' : ''), mg.concat([[W + 5, occ], [-5, occ]]));
    /* teeth: the labial crown outline, roots behind the gum (seen where there is recession) */
    cols.forEach(function(c){
      var d = c.d, sg = c.mr ? -1 : 1, cej = occ + dir * d.ch * k;
      if(c.t.missing || (c.t.implant && c.t.implant.cover)) return;
      function X(px){ return c.cx + sg * px * k; }
      if(!c.t.implant){
        var roots = mkRoots(d, X, k, cej).map(function(r){ return { a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:cej, len:dir * r.len }; });
        roots.forEach(function(r){ var pts = rootOutline({ a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:0, len:Math.abs(r.len) }, 0, 0, 0).map(function(p){ return [p[0], cej + dir * p[1]]; }); s += path('io-root', pts); });
        if(d.tr){ var tp = trunkPts(roots.map(function(r){ return { a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:0, len:Math.abs(r.len) }; }), sg, 0, -1, d.tr * k, k); if(tp) s += path('io-root', tp.map(function(p){ return [p[0], cej + dir * p[1]]; })); }
      }
      var cr = dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), cej - dir * p[1] * k]; });
      s += path('io-tooth' + (c.t.crown || c.t.implant ? ' pfm' : '') + (up ? '' : ' low'), cr);
      if(c.t.implant) s += path('io-margin', [[c.cx - d.cv / 2 * k, cej], [c.cx + d.cv / 2 * k, cej]], true);
    });
    /* the free gingiva: its margin follows recession at the three facial sites (negative recession: margin on the crown,
       swollen); papillae between teeth fill the embrasure, blunted when edematous; calculus and plaque along the margin */
    var edge = [], marks = '';
    cols.forEach(function(c, i){
      var d = c.d, cej = occ + dir * d.ch * k, so = siteOrder(c.t.n), sx = [c.cx - d.cw * .34 * k, c.cx, c.cx + d.cw * .34 * k];
      var left = c.cx - d.cw / 2 * k, right = c.cx + d.cw / 2 * k, pap = (edema ? 1.6 : 2.6) * k;
      if(c.t.missing || (c.t.implant && c.t.implant.cover)){ edge.push([left, cej + dir * 1.2 * k], [c.cx, cej + dir * 1.8 * k], [right, cej + dir * 1.2 * k]); return; }
      if(i === 0) edge.push([-6, cej - dir * pap * .35], [left - 6, cej - dir * pap * .5], [left, cej - dir * pap]);
      so.forEach(function(si, j){ var rec = c.t.rec.f[si], my = cej + dir * rec * k + (j === 1 ? dir * (c.d.cej || 0) * k : 0);
        var deepest = j === 1 && rec > 0 && rec > Math.max(c.t.rec.f[so[0]], c.t.rec.f[so[2]]);
        if(deepest) edge.push([sx[1] - d.cw * .2 * k, my - dir * .55 * k]);
        edge.push([sx[j], my]);
        if(deepest) edge.push([sx[1] + d.cw * .2 * k, my - dir * .55 * k]);
        if(c.t.bop.f[si]) marks += dot('dc-blood', sx[j], my + dir * 2.2, 2.4);
        if(c.t.pus.f[si]) marks += dot('dc-pusdrop', sx[j] + 4, my + dir * 5, 2.8);
        if(c.t.plaque.f[si]) marks += path('dc-plaque', [[sx[j] - 4, my - dir * .2 * k], [sx[j] + 4, my - dir * .2 * k], [sx[j] + 3, my - dir * 1.1 * k], [sx[j] - 3, my - dir * 1.0 * k]]); });
      if(c.t.calc) marks += path('dc-calc', [[left + 2, cej - dir * .3 * k], [left + 6, cej - dir * 1.4 * k], [left + 11, cej - dir * .4 * k]]) + path('dc-calc', [[right - 2, cej - dir * .3 * k], [right - 6, cej - dir * 1.5 * k], [right - 11, cej - dir * .5 * k]]);
      var nx = cols[i + 1];
      edge.push([right, cej - dir * pap]);
      if(nx && !nx.t.missing) edge.push([(right + nx.cx - nx.d.cw / 2 * k) / 2, cej - dir * pap * 1.1]);
      if(!nx) edge.push([right + 6, cej - dir * pap * .5], [W + 6, cej - dir * pap * .35]);
    });
    var e = dense(edge, false, 5), base = up ? -5 : H + 5;
    s += path('io-gum dc-free' + (look === 'inflamed' ? ' dc-inflamed' : look === 'fibrotic' ? ' dc-fibrotic' : ''), e.concat([[e[e.length - 1][0], base], [e[0][0], base]]));
    if(look !== 'inflamed' && g.stippling !== false){ var r = rnd(7 + n), cejM = 0; cols.forEach(function(c){ cejM += (occ + dir * c.d.ch * k) / n; });
      for(var i = 0; i < 70; i++){ var px = 20 + r() * (W - 40), py = cejM + dir * (.6 * k + r() * (kt - .8 * k)); s += dot('dc-stipple', px, py, .9); } }
    s += marks;
    cols.forEach(function(c){ s += txt(c.cx, up ? H - 10 : 18, '#' + c.t.n, 'io-lab', 'middle'); });
    var label = o.aria || ('Drawn ' + (up ? 'upper' : 'lower') + ' buccal view of ' + ts.map(function(t){ return '#' + t.n; }).join(', ') + ': the gingiva ' + (look === 'inflamed' ? 'red and swollen' : look === 'fibrotic' ? 'pale and fibrotic' : 'pink and stippled') + ', drawn from the chart');
    return '<svg class="io dc-view" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + s + '</svg>';
  };

  /* ---------- the figures a question shows: list = [{kind:'chart'|'film'|'view', title, note, hide, lingual}] ---------- */
  I.figures = function(spec, list){
    var out = '', kinds = { chart:'Periodontal chart', film:'Periapical radiograph', view:'Clinical view (drawn)' };
    (list || []).forEach(function(f){
      var body = f.kind === 'chart' ? I.chart(spec, f) : f.kind === 'film' ? I.film(spec, f) : f.kind === 'view' ? I.view(spec, f) : '';
      if(!body) return;
      out += '<figure class="pimg dc-fig' + (f.kind === 'chart' ? ' wide' : '') + '"><figcaption><b>' + esc(kinds[f.kind]) + '</b>' + (f.title ? ' · ' + esc(f.title) : '') + '</figcaption>' + body + (f.note ? '<div class="pimg-cap">' + esc(f.note) + '</div>' : '') + '</figure>';
    });
    if(!out) return '';
    return '<div class="pimg-grid dc-figs">' + out + '</div><div class="pimg-note dc-note">Drawn for this hub from the case\'s numbers to show the findings; not a patient image or a real radiograph. Tooth sizes and shapes are averages (Wheeler).</div>';
  };
  /* the hooks a hub calls: q.pcase names a case in its PCASES; q.pfig picks this question's pictures (and hides a row
     that would give its answer away); the case's box rows go in front of the question's own */
  I.pboxFigures = function(q, cases){ var c = q && q.pcase && cases && cases[q.pcase]; return c ? I.figures(c.spec, q.pfig || c.figs) : ''; };
  I.foldBox = function(questions, cases){ (questions || []).forEach(function(q){ var c = q.pcase && cases && cases[q.pcase]; if(c && !q._boxFolded){ q.pbox = (c.box || []).concat(q.pbox || []); q._boxFolded = true; } }); };
  /* "In the notes" buttons under an explanation: q.ref = [{ label, go }], go as window.SH_GOTO takes it */
  I.refHTML = function(q){
    if(!q || !q.ref || !q.ref.length) return '';
    return '<div class="qx-ref"><span class="qx-ref-lab">In the notes:</span>' + q.ref.filter(Boolean).map(function(r){ return '<button type="button" class="qx-ref-btn" data-go="' + esc(JSON.stringify(r.go || {})) + '">' + esc(r.label) + '</button>'; }).join('') + '</div>';
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.qx-ref-btn'); if(!b || !b.getAttribute('data-go')) return;
    var go; try { go = JSON.parse(b.getAttribute('data-go')); } catch(err){ return; }
    if(window.shTrack) window.shTrack('case:ref');
    if(window.SH_GOTO) window.SH_GOTO(go);
  });
  I.derivedText = function(spec){ return I.derive(spec).dx; };
  I.XT = XT;
  I._ = { teethOf:teethOf, viewOrder:viewOrder, typeOf:typeOf, siteOrder:siteOrder, crownMM:crownMM, rootsMM:rootsMM, boneMM:boneMM };
  window.shCases = I; window.DCASE = I;
})();
