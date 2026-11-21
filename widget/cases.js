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
  var TL = window.SH_TEETH;
  if(!TL) throw new Error('widget/cases.js needs widget/teeth.js (window.SH_TEETH) loaded first');
  var dense = TL.dense, rnd = TL.rnd;
  function poly(pts, open){ return 'M' + pts.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + (open ? '' : 'Z'); }
  function path(cls, pts, open, style){ return '<path class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' d="' + poly(pts, open) + '"/>'; }
  function txt(x, y, t, cls, anchor){ return '<text class="' + (cls || 'dc-t') + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>'; }
  function dot(cls, x, y, r){ return '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '"/>'; }

  /* ---------- the teeth: the tooth library (widget/teeth.js, window.SH_TEETH), shared with the figure builds ----------
     Wheeler's sizes and outlines for the 16 types (XT, crownMM, rootsMM, backRootMM), the numbering helpers and one
     catalogue entry per tooth (surfaces, roots, furcation entrances, root trunk, sites, landmarks, films). */
  var XT = TL.XT, POS = TL.POS, isUpper = TL.isUpper, posOf = TL.posOf, typeOf = TL.typeOf, dims = TL.dims, mesialRight = TL.mesialRight,
    isMolar = TL.isMolar, viewOrder = TL.viewOrder, siteOrder = TL.siteOrder, SITE_NAME = TL.SITE_NAME,
    crownMM = TL.crownMM, rootsMM = TL.rootsMM, backRootMM = TL.backRootMM, CAT = TL.tooth;
  function hasFurc(n){ var c = CAT(n); return !!(c && c.furcations.length); }
  /* ---------- modules (Patient Box v2): a case assembled from a few choices, the per-tooth numbers written from them ----------
     spec.modules is a list applied in order, then spec.t (the per-tooth numbers, as in v1) is laid over the result
     field by field, so an author can still set one number by hand. Each module:
       { m:'missing', teeth:[...] }                                  the teeth are gone (the odontogram's X)
       { m:'restoration', tooth, surfaces:'MOD', material }          amalgam | composite | gold | crown (crown: all surfaces)
       { m:'caries', tooth, surface:'D', depth }                     enamel | dentin | pulp
       { m:'endo', tooth, fill:true, lesion:mm }                     a root canal filling and/or a periapical radiolucency
       { m:'bone', teeth:[...], percent, pattern, defect, side, rec, swell, furc, mob }
           percent: bone loss as a share of the root (a number, or { tooth:percent }); pattern 'horizontal' (default) or
           'vertical' with defect (mm) on side 'm' or 'd'. It writes the bone, the vertical defect and, at all six sites,
           the CAL that agrees with the crest (the pocket base about 1 mm coronal to it, Newman and Carranza), the
           recession (rec, facial mm at the middle site, default 0; the lingual one less) and the probing depth (CAL minus
           recession, at least 2 mm; swell mm of pseudopocket adds to it). Furcations follow the bone past the root trunk
           (Class I within 1.5 mm of it, II from 1.5 mm past, III from 4 mm past, both entrances of a mandibular molar;
           the film shows II and III on a molar), and mobility follows the bone (1 from 55%, 2 from 70%), unless furc:false
           or mob is given.
       { m:'bop', rate:.3, teeth }, { m:'pus', ... }, { m:'plaque', ... }   that share of the sites, the deepest first
       { m:'recession', teeth:[...], mm }                           facial recession at the middle site, the pocket 1 mm
     The record keeps everything else (age, smoke, hba1c, cc, mouth, gingiva), and the box rows, every view and the key
     are drawn from it. */
  var MAT = ['amalgam', 'composite', 'gold', 'crown'], DEPTH = ['enamel', 'dentin', 'pulp'];
  function toothKeys(t){ return Object.keys(t || {}).filter(function(k){ return /^\d+$/.test(k) && +k >= 1 && +k <= 32; }); }
  function ensure(t, n){ n = String(n); if(!t[n]) t[n] = {}; return t[n]; }
  function list(v){ return Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]; }
  function normSurf(n, s){ var c = CAT(n); return String(s || '').toUpperCase().split('').map(function(x){ if(!c) return x; if(x === 'B' || x === 'F') return c.surfaces[3]; if(x === 'O' || x === 'I') return c.surfaces[1]; return x; }).join(''); }
  function boneModule(t, md, probs){
    list(md.teeth).forEach(function(n){
      var c = CAT(n); if(!c){ probs.push('bone: tooth ' + n + ' is not a universal number'); return; }
      var pct = typeof md.percent === 'object' && md.percent ? (md.percent[n] || 0) : (md.percent || 0), d = c.dims, r = ensure(t, n);
      var vert = md.pattern === 'vertical', side = md.side === 'd' ? 'd' : 'm', vd = vert ? (md.defect || 0) : 0;
      r.bone = { m:pct, d:pct }; r.vdef = vert ? (side === 'm' ? { m:vd } : { d:vd }) : {};
      function crest(sd){ return Math.max(1.5, pct / 100 * d.rl) + (r.vdef[sd] || 0); }
      var cm = crest('m'), cd = crest('d'), base = Math.max(1.5, pct / 100 * d.rl);
      var calI = function(cr){ return pct || vd ? Math.max(0, Math.round(cr - 1)) : 0; };
      var calMid = pct ? Math.max(0, Math.round(base - 1.5)) : 0;
      var recF = md.rec || 0, recL = Math.max(0, recF - 1), sw = md.swell || 0;
      r.pd = {}; r.rec = {};
      ['f', 'l'].forEach(function(s){
        var R = s === 'f' ? recF : recL, cals = [calI(cm), calMid, calI(cd)], recs = [Math.max(0, R - 1), R, Math.max(0, R - 1)];
        r.pd[s] = []; r.rec[s] = [];
        cals.forEach(function(cal, i){
          var rec = cal === 0 && recs[i] === 0 ? -2 : recs[i], pd = cal - rec;
          if(pd < 2){ pd = 2; rec = cal - 2; }
          pd += sw; rec -= sw;
          r.pd[s].push(pd); r.rec[s].push(rec);
        });
      });
      if(md.furc !== false && c.furcations.length && c.trunk){
        var past = base - c.trunk;
        var cls = past < -1.5 ? 0 : past < 1.5 ? 1 : past < 4 ? 2 : 3;
        if(cls){ r.furc = { f:cls, l:cls }; var onFilm = c.furcations.some(function(e){ return e.film; }); r.furcX = onFilm && cls >= 2 ? cls : 0; }
      }
      if(md.mob != null) r.mob = md.mob; else r.mob = pct >= 70 ? 2 : pct >= 55 ? 1 : 0;
    });
  }
  /* bleeding, suppuration or plaque at a share of the sites (of md.teeth, or of every tooth in the case), the deepest first */
  function siteModule(t, md, spec, field){
    var teeth = md.teeth ? list(md.teeth) : allNums(spec, t), sites = [];
    teeth.forEach(function(n){ var r = t[n] || {}; if(r.missing || r.implant) return; var pd = r.pd || {};
      ['f', 'l'].forEach(function(s){ [0, 1, 2].forEach(function(i){ sites.push({ n:n, s:s, i:i, pd:(pd[s] || [2, 2, 2])[i] }); }); }); });
    sites.sort(function(a, b){ return b.pd - a.pd || (+a.n - +b.n) || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0) || a.i - b.i; });
    var k = Math.round((md.rate || 0) * sites.length);
    if(field === 'pus') sites = sites.filter(function(x){ return x.pd >= 4; });
    sites.slice(0, k).forEach(function(x){ var r = ensure(t, x.n); r[field] = r[field] || {}; r[field][x.s] = r[field][x.s] || [0, 0, 0]; r[field][x.s][x.i] = 1;
      if(field === 'pus'){ r.bop = r.bop || {}; r.bop[x.s] = r.bop[x.s] || [0, 0, 0]; r.bop[x.s][x.i] = 1; } });
  }
  function allNums(spec, t){
    var seen = {}, out = [];
    (spec.teeth || []).concat(toothKeys(t || spec.t)).forEach(function(n){ n = String(n); if(!seen[n]){ seen[n] = 1; out.push(n); } });
    return out.sort(function(a, b){ return +a - +b; });
  }
  function expand(spec){
    if(!spec || !spec.modules) return spec;
    var t = {}, probs = [];
    spec.modules.forEach(function(md, i){
      var w = 'module ' + (i + 1) + ' (' + md.m + '): ';
      if(md.m === 'missing') list(md.teeth).forEach(function(n){ ensure(t, n).missing = true; });
      else if(md.m === 'restoration'){
        var r = ensure(t, md.tooth), mat = md.material || 'amalgam';
        if(MAT.indexOf(mat) < 0) probs.push(w + 'material must be ' + MAT.join(', '));
        if(mat === 'crown') r.crown = true;
        else { (r.resto = r.resto || []).push({ s:normSurf(md.tooth, md.surfaces), mat:mat }); if(mat === 'amalgam' || mat === 'gold') r.amalgam = true; }
      }
      else if(md.m === 'caries'){ var rc = ensure(t, md.tooth); (rc.caries = rc.caries || []).push({ s:normSurf(md.tooth, md.surface), depth:md.depth || 'dentin' }); }
      else if(md.m === 'endo'){ var re = ensure(t, md.tooth); if(md.fill !== false) re.endo = true; if(md.lesion) re.lesion = md.lesion; }
      else if(md.m === 'bone') boneModule(t, md, probs);
      else if(md.m === 'bop' || md.m === 'pus' || md.m === 'plaque') siteModule(t, md, spec, md.m);
      else if(md.m === 'recession') list(md.teeth).forEach(function(n){ var r = ensure(t, n), mm = md.mm || 0; r.rec = r.rec || {}; r.pd = r.pd || {};
        r.rec.f = (r.rec.f || [-2, -2, -2]).slice(); r.pd.f = (r.pd.f || [2, 2, 2]).slice(); var cal = r.pd.f[1] + r.rec.f[1]; r.rec.f[1] = Math.max(mm, 0); r.pd.f[1] = Math.max(1, cal - mm); });
      else probs.push(w + 'unknown module');
    });
    /* the author's own numbers win, field by field */
    Object.keys(spec.t || {}).forEach(function(n){
      var own = spec.t[n]; if(!own) return; var r = ensure(t, n);
      Object.keys(own).forEach(function(k){ r[k] = own[k]; });
    });
    var out = {}; Object.keys(spec).forEach(function(k){ out[k] = spec[k]; });
    out.t = t; out._moduleProblems = probs; delete out.modules;
    return out;
  }
  var CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
  function prep(spec){
    if(!spec || !spec.modules) return spec;
    if(CACHE && CACHE.has(spec)) return CACHE.get(spec);
    var e = expand(spec); if(CACHE) CACHE.set(spec, e); return e;
  }
  I.expand = function(spec){ return prep(spec); };

  /* ---------- the model's tooth record, with defaults ---------- */
  function tooth(spec, n){
    var t = (spec.t && spec.t[n]) || {}, z = [0, 0, 0], d = dims(n);
    function arr(o, s, def){ return o && o[s] ? o[s] : def.slice(); }
    var pd = t.pd || {}, rec = t.rec || {}, bop = t.bop || {}, pus = t.pus || {}, pl = t.plaque || {};
    /* defaults: a healthy sulcus of 2 mm whose base sits at the CEJ (the margin 2 mm coronal to it: recession -2, CAL 0) */
    var r = { n:String(n), d:d, missing:!!t.missing, implant:t.implant || null, mob:t.mob || 0, furc:t.furc || {},
      pd:{ f:arr(pd, 'f', [2, 2, 2]), l:arr(pd, 'l', [2, 2, 2]) }, rec:{ f:arr(rec, 'f', [-2, -2, -2]), l:arr(rec, 'l', [-2, -2, -2]) },
      bop:{ f:arr(bop, 'f', z), l:arr(bop, 'l', z) }, pus:{ f:arr(pus, 'f', z), l:arr(pus, 'l', z) }, plaque:{ f:arr(pl, 'f', z), l:arr(pl, 'l', z) },
      bone:t.bone || { m:0, d:0 }, vdef:t.vdef || {}, furcX:t.furcX || 0, calc:!!t.calc, crown:!!t.crown, endo:!!t.endo, amalgam:!!t.amalgam, halo:!!t.halo,
      resto:t.resto || [], caries:t.caries || [], lesion:t.lesion || 0, raw:t };
    r.cal = { f:r.pd.f.map(function(p, i){ return p + r.rec.f[i]; }), l:r.pd.l.map(function(p, i){ return p + r.rec.l[i]; }) };
    return r;
  }
  /* the teeth a view shows (its own list, or the case's), in viewer order; allOf: every tooth the case says anything about */
  function teethOf(spec, teeth){ return viewOrder(teeth || spec.teeth).map(function(n){ return tooth(spec, n); }); }
  function allOf(spec){ var a = allNums(spec), up = a.filter(isUpper), lo = a.filter(function(n){ return !isUpper(n); });
    return viewOrder(up).concat(viewOrder(lo)).map(function(n){ return tooth(spec, n); }); }
  /* radiographic bone level on one side, in mm from the CEJ (the crest sits 1.5 mm from the CEJ in health, so a
     percentage of root length below that; an implant's bone is given in mm below its platform) */
  function boneMM(t, side){ return t.implant ? (t.bone[side] || 0) : Math.max(1.5, (t.bone[side] || 0) / 100 * t.d.rl); }

  /* ---------- derived values: what the numbers add up to under the 2018 staging and grading tables ---------- */
  I.derive = function(spec){
    spec = prep(spec);
    var ts = allOf(spec), out = { maxCAL:{ v:-99 }, maxInterdental:{ v:-99 }, maxPD:{ v:-99 }, maxRBL:{ pct:0 }, vertical:0, furc:0, bop:0, sites:0, pus:0, impl:{} };
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
        if((t.vdef[side] || 0) > out.vertical){ out.vertical = t.vdef[side]; out.verticalTooth = t.n; } });
      var fc = Math.max(t.furc.f || 0, t.furc.l || 0, t.furcX || 0); if(fc > out.furc){ out.furc = fc; out.furcTooth = t.n; }
    });
    var m = spec.mouth || {};
    out.bopPct = out.sites ? Math.round(100 * out.bop / out.sites) : 0;
    /* severity: interdental CAL first (the gold standard), radiographic bone loss second; the worse one sets the stage */
    var cal = out.maxInterdental.v, rbl = out.maxRBL.pct;
    var sCAL = cal >= 5 ? 3 : cal >= 3 ? 2 : cal >= 1 ? 1 : 0, sRBL = rbl > 33 ? 3 : rbl >= 15 ? 2 : rbl > 0 ? 1 : 0;
    out.severity = Math.max(sCAL, sRBL); out.sCAL = sCAL; out.sRBL = sRBL;
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
    spec = prep(spec);
    var P = (spec && spec._moduleProblems || []).slice(), ts;
    function bad(m){ P.push(m); }
    function num(v, lo, hi, what){ if(typeof v !== 'number' || isNaN(v)) bad(what + ' is not a number'); else if(v < lo || v > hi) bad(what + ' = ' + v + ' is outside ' + lo + '-' + hi); }
    if(!spec || !spec.teeth || !spec.teeth.length) return ['no teeth'];
    spec.teeth.forEach(function(n){ if(!(+n >= 1 && +n <= 32 && +n === Math.floor(+n))) bad('tooth ' + n + ' is not a universal number'); });
    var arch = spec.teeth.map(function(n){ return isUpper(n); });
    if(arch.some(Boolean) && !arch.every(Boolean)) bad('the teeth are not all in one arch');
    toothKeys(spec.t).forEach(function(n){ if(spec.teeth.map(String).indexOf(n) < 0 && !spec.full) bad('#' + n + ' has numbers but is not in teeth (list it, or set full:true for a full-mouth case)'); });
    try { ts = allOf(spec); } catch(e){ return ['teeth: ' + e.message]; }
    if(spec.age != null) num(spec.age, 12, 105, 'age');
    if(spec.smoke != null) num(spec.smoke, 0, 80, 'cigarettes a day');
    if(spec.hba1c != null) num(spec.hba1c, 4, 16, 'HbA1c');
    var m = spec.mouth;
    if(m){ if(m.teeth != null) num(m.teeth, 1, 32, 'teeth in the mouth'); if(m.involved != null){ num(m.involved, 0, 32, 'teeth involved'); if(m.teeth != null && m.involved > m.teeth) bad('more teeth involved than teeth in the mouth'); }
      if(m.lost != null){ num(m.lost, 0, 32, 'teeth lost'); if(m.teeth != null && m.lost + m.teeth > 32) bad('teeth lost + teeth present exceed 32'); } }
    if(spec.full){
      /* a full-mouth case: the box's counts must be the record's */
      var gone = 0, inv = 0;
      for(var j = 1; j <= 32; j++){ var tj = tooth(spec, String(j)); if(tj.missing){ gone++; continue; } if(tj.implant) continue;
        if(Math.max(tj.cal.f[0], tj.cal.f[2], tj.cal.l[0], tj.cal.l[2]) >= 1 || (tj.bone.m || 0) > 0 || (tj.bone.d || 0) > 0) inv++; }
      if(!m || m.teeth == null) bad('a full-mouth case gives mouth.teeth');
      else if(m.teeth !== 32 - gone) bad('mouth.teeth = ' + m.teeth + ', but the record has ' + (32 - gone) + ' teeth present');
      if(m && m.involved != null && m.involved !== inv) bad('mouth.involved = ' + m.involved + ', but ' + inv + ' teeth in the record have attachment or bone loss');
      if(m && m.lost != null && m.lost > gone) bad('mouth.lost = ' + m.lost + ', but only ' + gone + ' teeth are missing');
    }
    var g = spec.gingiva || {};
    if(g.kt != null) num(g.kt, 0, 9, 'keratinized tissue width');
    if(g.edema != null) num(g.edema, 0, 1, 'edema');
    if(g.look && ['healthy', 'inflamed', 'fibrotic'].indexOf(g.look) < 0) bad('gingiva.look must be healthy, inflamed or fibrotic');
    ts.forEach(function(t){
      var w = '#' + t.n + ' ', raw = t.raw;
      Object.keys(raw).forEach(function(k){ if(['pd', 'rec', 'bop', 'pus', 'plaque', 'mob', 'furc', 'bone', 'vdef', 'furcX', 'calc', 'crown', 'endo', 'amalgam', 'implant', 'missing', 'halo', 'lift', 'resto', 'caries', 'lesion'].indexOf(k) < 0) bad(w + 'unknown field ' + k); });
      /* impossible combinations: nothing on a missing tooth; nothing of a tooth's own on an implant */
      if(t.missing){
        [['resto', t.resto.length], ['crown', t.crown], ['amalgam', t.amalgam], ['caries', t.caries.length], ['endo', t.endo], ['periapical lesion', t.lesion], ['furcation', t.furc.f || t.furc.l || t.furcX], ['implant', t.implant], ['calculus', t.calc]].forEach(function(e){ if(e[1]) bad(w + 'a missing tooth has ' + (e[0] === 'resto' ? 'a restoration' : e[0] === 'caries' ? 'caries' : 'a ' + e[0])); });
        return;
      }
      var cat = CAT(t.n);
      t.resto.forEach(function(r){ if(!r || MAT.indexOf(r.mat) < 0 || r.mat === 'crown') bad(w + 'a restoration\'s material must be amalgam, composite or gold (a crown is crown:true)');
        String(r && r.s || '').split('').forEach(function(x){ if(cat.surfaces.indexOf(x) < 0) bad(w + 'restoration surface ' + x + ' is not one of this tooth\'s (' + cat.surfaces.join('') + ')'); });
        if(!r || !r.s) bad(w + 'a restoration with no surfaces'); });
      t.caries.forEach(function(c){ if(!c || cat.surfaces.indexOf(c.s) < 0) bad(w + 'caries surface ' + (c && c.s) + ' is not one of this tooth\'s (' + cat.surfaces.join('') + ')');
        if(c && DEPTH.indexOf(c.depth) < 0) bad(w + 'caries depth must be ' + DEPTH.join(', '));
        if(c && t.crown) bad(w + 'caries under a full crown can\'t be charted by surface'); });
      if(t.lesion) num(t.lesion, 1, 15, w + 'periapical lesion (mm across)');
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
        if(t.endo || t.amalgam || t.calc || t.resto.length || t.caries.length || t.lesion) bad(w + 'an implant and a root in one site: an implant has no root filling, restoration, caries, periapical lesion or root calculus');
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
      Object.keys(t.furc).forEach(function(s){ if(s !== 'f' && s !== 'l') bad(w + 'furcation surface ' + s + ' must be f or l'); });
      var fe = cat.furcations, filmF = fe.some(function(e){ return e.film; });
      if((fcs[0] || fcs[1] || t.furcX) && !fe.length) bad(w + 'a furcation on a tooth with no furcation (' + cat.roots.join(', ') + ' root' + (cat.roots.length > 1 ? 's' : '') + ')');
      [['f', fcs[0]], ['l', fcs[1]]].forEach(function(e){ if(e[1] && fe.length && !fe.some(function(x){ return x.from === e[0]; })) bad(w + 'no furcation entrance is probed from the ' + (e[0] === 'f' ? 'facial' : 'lingual')); });
      if(t.furcX && fe.length && !filmF) bad(w + 'furcX: a film doesn\'t show this tooth\'s furcation (its roots overlap)');
      if(fe.length){
        var fmax = Math.max(fcs[0], fcs[1]), trk = cat.trunk;
        if(fmax >= 1 && Math.max(boneMM(t, 'm'), boneMM(t, 'd')) < trk - 1.5 && !t.furcX) bad(w + 'a furcation involvement before bone loss has reached the root trunk (' + trk + ' mm)');
        if(fmax >= 2 && !t.furcX && filmF) bad(w + 'a Class II or III furcation should show on the film: set furcX');
        if(t.furcX > fmax) bad(w + 'the film shows more furcation loss (furcX ' + t.furcX + ') than the probe found (' + fmax + ')');
        if((fcs[0] === 3) !== (fcs[1] === 3) && !t.d.pal) bad(w + 'a Class III furcation is through and through: both surfaces');
      }
      if(t.endo && !(t.crown || t.amalgam || t.resto.length)) bad(w + 'a root-filled tooth needs a restoration (a crown, or a restoration over the access)');
    });
    return P;
  };

  /* ---------- root geometry shared by the chart, the film and the view: the tooth library's (widget/teeth.js) ---------- */
  var rAx = TL.rAx, rHw = TL.rHw, rootOutline = TL.rootOutline, mkRoots = TL.mkRoots, mkBack = TL.mkBack, trunkPts = TL.trunkPts;
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
    /* restorations by surface (Patient Box v2's resto, the library's outline); a v1 tooth with only amalgam:true keeps its box */
    if(t.resto.length) t.resto.forEach(function(r){ var cls = 'dc-amalgam' + (r.mat === 'composite' ? ' dc-comp' : r.mat === 'gold' ? ' dc-gold' : '');
      TL.restoMM(typeOf(t.n), r.s).forEach(function(p){ s += path(cls, p.map(function(q){ return [X(q[0]), y0 - q[1] * k]; })); }); });
    else if(t.amalgam) s += path('dc-amalgam', [[cx - d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .22 * k, y0 - d.ch * .62 * k], [cx - d.cw * .22 * k, y0 - d.ch * .62 * k]]);
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
      if(hasFurc(t.n) && !hide.furc && (t.furc[sf] || 0) > 0) inner += furcMark(t.furc[sf], cx, y0 + CAT(t.n).trunk * k + 2, 5);
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
      if(!hide.furc && ts.some(function(t){ return !t.missing && (isMolar(t.n) || (hasFurc(t.n) && (t.furc.f || t.furc.l))); })) h += '<tr><th scope="row">Furcation (Glickman)</th>' + cells(function(t){ if(!hasFurc(t.n)) return '–'; var f = t.furc.f || 0, l = t.furc.l || 0; return (f ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][f] + '</span> facial' : '') + (f && l ? ', ' : '') + (l ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][l] + '</span> lingual' : '') || 'none'; }) + '</tr>';
    }
    return '<div class="pchart-wrap">' + h + '</tbody></table></div>';
  }
  /* a chart with both surfaces says so above each strip and at the top: the two strips look alike, and with the label only
     in the table's caption under each one, a student read them as two charts from two visits (Perio report #61, 2026-11-18) */
  function sideHead(sf, up){
    return '<p class="dc-side dc-side-' + sf + '"><b>' + (sf === 'f' ? 'Facial' : up ? 'Lingual (palatal)' : 'Lingual') + '</b> · the ' +
      (sf === 'f' ? 'cheek and lip' : up ? 'palate' : 'tongue') + ' side</p>';
  }
  I.chart = function(spec, o){
    spec = prep(spec); o = o || {}; var ts = teethOf(spec, o.teeth), hide = o.hide || {}, s = '';
    var surfaces = o.lingual === false ? ['f'] : (spec.lingual === false ? ['f'] : ['f', 'l']), two = surfaces.length > 1, up = isUpper(ts[0].n);
    if(two) s += '<p class="dc-sides">One chart from one visit: the facial side of these teeth, then the lingual side of the same teeth.</p>';
    surfaces.forEach(function(sf){ s += (two ? '<div class="dc-surf">' + sideHead(sf, up) : '') + chartStrip(spec, ts, sf, o) + chartTable(spec, ts, sf, o) + (two ? '</div>' : ''); });
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
    /* the enamel cap thins to nothing at the CEJ; dentin inside it (the library's DEJ). Under a full crown the tooth was
       prepared: no enamel is left, only the dentin core inside the crown's shell */
    if(o.crown) s += path('xr-dentin', g.crown);
    else { s += path('xr-enamel', g.crown); s += path('xr-dentin', TL.dejPts(g.crown, d, g.x, g.top, g.cej, k)); }
    s += pulpSVG(g);
    if(o.endo) s += endoSVG(g);
    /* restorations by surface (Patient Box v2's resto); a v1 tooth with only amalgam:true keeps its occlusal box */
    if(o.resto && o.resto.length) s += o.resto.map(function(r){ return restoSVG(g, r); }).join('');
    else if(o.amalgam) s += amalgamSVG(g);
    if(o.caries) s += cariesSVG(g);
    if(o.crown) s += crownSVG(g);
    if(o.calc) s += calcSVG(g);
    return s;
  }
  /* the pulp (the library's outline); in a root-filled tooth the chamber and canals are filled: a core in the chamber,
     gutta-percha down the canals (endoSVG draws it over), so no dark pulp space is left */
  function pulpSVG(g){
    var cls = g.o.endo ? 'xr-core' : 'xr-pulp';
    return TL.pulpPts(g.d, g.X, g.k, g.cej, g.roots).map(function(p){ return path(cls, p); }).join('');
  }
  /* a restoration's outline by its surfaces (the library's restoMM): metal for amalgam and gold, a lower radiopacity close to
     enamel's, with a crisp edge, for composite */
  function restoSVG(g, r){
    var cls = r.mat === 'composite' ? 'xr-comp' : 'xr-metal';
    return TL.restoMM(g.o.t, r.s).map(function(p){ return path(cls, p.map(function(q){ return [g.X(q[0]), g.cej - q[1] * g.k]; })); }).join('');
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
  /* caries on a film (White and Pharoah), the library's cariesMM: a proximal lesion just cervical to the contact, a triangle
     in the enamel pointing at the DEJ, then (dentin, pulp) spreading along the DEJ with a second triangle toward the pulp;
     an occlusal lesion only once it is in the dentin; a facial or lingual one a fainter round shadow at the cervical third */
  function cariesSVG(g){
    return g.o.caries.map(function(c){ return TL.cariesMM(g.o.t, c.s, c.depth).map(function(sh){
      return path('xr-car' + (sh.face ? ' xr-car-f' : ''), sh.pts.map(function(q){ return [g.X(q[0]), g.cej - q[1] * g.k]; })); }).join(''); }).join('');
  }
  /* a full-coverage crown: a metal (or metal-ceramic) cap that follows the crown outline down to a margin at the CEJ */
  function crownSVG(g){
    var k = g.k, inner = g.crown.map(function(p){ var dx = g.x - p[0], dy = (g.top + g.d.ch * .7 * k) - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * .9 * k, p[1] + dy / L * .9 * k]; });
    return path('xr-metal', g.crown.concat(inner.slice().reverse()), false, 'opacity:.92');
  }
  /* calculus: bright spurs on the proximal root surfaces just below the CEJ, on the outer side of the leftmost and the
     rightmost root (a mirrored tooth, mesial on the right, lists its mesial root first: the spurs go on the proximal
     surfaces, never into the furcation) */
  function calcSVG(g){
    var k = g.k, s = '', a = g.roots[0], b = g.roots[g.roots.length - 1], r0 = a.a0 <= b.a0 ? a : b, rN = r0 === a ? b : a;
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
  function boneSVG(gs, w, yBottom, seed, tb){
    var top = [], k = gs[0].k, extra = '';
    function side(g, right, y){
      if(g.o.implant) return g.x + (right ? 1 : -1) * (g.o.implant.w / 2 + .1) * k;
      var dd = ((g.o.pdl || .2) + (g.o.lam || .22)) * k, xs = g.roots.map(function(r){ var t = Math.max(0, (y - r.y0) / r.len); return rAx(r, t) + (right ? 1 : -1) * rHw(r, t); });
      return (right ? Math.max.apply(null, xs) + dd : Math.min.apply(null, xs) - dd);
    }
    gs.forEach(function(g, i){
      var c = crestLR(g), vd = g.o.vdef || [0, 0], vL = g.sg > 0 ? vd[0] : vd[1], vR = g.sg > 0 ? vd[1] : vd[0];
      var xl = side(g, false, c[0]), xr = side(g, true, c[1]);
      /* the bone runs past the film's edge (a tooth cut by the edge of a series film starts left of it) */
      if(i === 0) top.push([Math.min(-5, xl - 2.5 * k), c[0] - .3 * k]);
      if(vL) top.push([xl - 1.6 * k, c[0] - .2 * k], [xl - .3 * k, c[0] + vL * k * .85]);
      top.push([xl, c[0] + vL * k], [g.x, Math.max(c[0] + vL * k, c[1] + vR * k) * .35 + Math.max(c[0], c[1]) * .65 + .4 * k], [xr, c[1] + vR * k]);
      if(vR) top.push([xr + .3 * k, c[1] + vR * k * .85], [xr + 1.6 * k, c[1] - .2 * k]);
      var nx = gs[i + 1];
      if(nx){ var cn = crestLR(nx), xn = side(nx, false, cn[0]);
        var lo = Math.min(c[1], cn[0]), px = c[1] > cn[0] + 2 ? xn - .9 * k : cn[0] > c[1] + 2 ? xr + .9 * k : (xr + xn) / 2;
        top.push([px, lo - .4 * k]); }
      else top.push([Math.max(w + 5, xr + 2.5 * k), c[1] - .3 * k]);
      if(g.d.tr && g.o.furcX && !g.o.implant){ var yf = g.cej + g.d.tr * k, dep = (g.o.furcX >= 3 ? 3.2 : g.o.furcX === 2 ? 2.2 : 1.1) * k, l = g.roots[0], r = g.roots[1];
        var tl = Math.max(0, (yf - l.y0) / l.len), tr = Math.max(0, (yf - r.y0) / r.len);
        var xa = rAx(l, tl) + rHw(l, tl) * .9, xb = rAx(r, tr) - rHw(r, tr) * .9;
        extra += path('xr-pdl', dense([[xa, yf - .4 * k], [xb, yf - .4 * k], [(xa + xb) / 2 + (xb - xa) * .22, yf + dep * .75], [(xa + xb) / 2, yf + dep], [(xa + xb) / 2 - (xb - xa) * .22, yf + dep * .75]], true, 4), false, 'opacity:.85'); }
    });
    var s = path('xr-bone', top.concat([[top[top.length - 1][0], yBottom], [top[0][0], yBottom]]));
    function yTop(x){ for(var i = 1; i < top.length; i++) if(x <= top[i][0]){ var a = top[i - 1], b = top[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return top[top.length - 1][1]; }
    var r = rnd(seed), yMin = Math.min.apply(null, top.map(function(p){ return p[1]; }));
    for(var i = 0; i < (tb || 230); i++){ var cx = r() * w, cy = yMin + r() * (yBottom - yMin), rx = 1.5 + r() * 5, ry = 1 + r() * 2.6, a = Math.round(r() * 180), cl = r() < .55 ? 'xr-tb' : 'xr-tb2';
      if(cy < yTop(cx) + 3 || cy > yBottom - 2) continue;
      s += '<ellipse class="' + cl + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + a + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    s += path('xr-cortex', top.slice(1, -1), true);
    return s + extra;
  }
  function rowXR(list, x0, occ, k){
    var x = x0, gs = [];
    /* o.at: the tooth's left edge in px, from its place along the arch (the bitewings and the series' films); otherwise
       the teeth follow one another, a missing tooth's width left as a gap */
    list.forEach(function(o){ var d = XT[o.t]; o.k = k; o.occ = occ; if(o.at != null) x = o.at; else x += (o.gap || 0) * k; o.x = x + d.cw * k / 2; gs.push(xrTooth(o)); x += d.cw * k - .15 * k; });
    return gs;
  }
  function filmBG(gs, w, h, seed, tb){
    var s = '<rect class="xr-soft" x="0" y="' + f1(gs[0].top - 1.2 * gs[0].k) + '" width="' + w + '" height="' + f1(h) + '"/>';
    s += boneSVG(gs, w, h + 60, seed, tb);
    gs.forEach(function(g){ s += socketSVG(g, (g.o.pdl || .2) + (g.o.lam || .22), 'xr-lam'); });
    gs.forEach(function(g){ s += socketSVG(g, g.o.pdl || .2, 'xr-pdl'); });
    /* a periapical lesion (apical periodontitis; Cohen's Pathways of the Pulp, White and Pharoah): the PDL space widens
       down the apical third and opens into a round radiolucency around the apex, the lamina dura gone there; darker at
       its middle and fading into the bone at its edge (the cortical plates still lie over it, so it is not as dark as soft
       tissue). The apex sits inside it. */
    gs.forEach(function(g){ if(!g.o.lesion || g.o.implant) return; var rr = g.o.lesion / 2 * g.k, pdl = g.o.pdl || .2;
      g.roots.forEach(function(r){
        /* the PDL space, normal at the root's middle, widening smoothly to about .9 mm at the apex */
        var L = [], R = [], N = 12, i, t, wd;
        for(i = 0; i <= N; i++){ t = .5 + .5 * i / N; wd = (pdl + .7 * Math.pow((t - .5) / .5, 1.6)) * g.k; L.push([rAx(r, t) - rHw(r, t) - wd, r.y0 + t * r.len]); R.unshift([rAx(r, t) + rHw(r, t) + wd, r.y0 + t * r.len]); }
        var ax = rAx(r, 1), ay = r.y0 + r.len, ar = r.wa + (pdl + .7) * g.k;
        for(i = 1; i < 8; i++){ var th = Math.PI - i * Math.PI / 8; L.push([ax + Math.cos(th) * ar, ay + Math.sin(th) * ar]); }
        s += path('xr-pdl xr-apdl', L.concat(R));
        var cy = ay + rr * .22;
        [1.25, 1.1, .95, .8, .65].forEach(function(f){ s += '<ellipse class="xr-lesion" cx="' + f1(ax) + '" cy="' + f1(cy) + '" rx="' + f1(rr * f) + '" ry="' + f1(rr * .86 * f) + '"/>'; });
      }); });
    return s;
  }
  /* a periapical film of the case's teeth: bone levels, defects, furcations, restorations and implants from the model */
  /* one row of a film: the teeth in viewer order, crowns up, the occlusal edges at occ; { inner (bg + teeth), bg, teeth, w, h,
     up, ts }. A film of an upper row is flipped crowns down by its caller. o.tb: how many trabeculae (fewer on the small films
     of a series); o.at(n): a tooth's left edge in px, from its place along the arch (a missing one then leaves its own
     space); o.w: the film's width */
  function filmRow(spec, teeth, k, occ, h, o){
    o = o || {}; var ts = teethOf(spec, teeth), up = isUpper(ts[0].n);
    var list = [], seed = 0, width = 0, gapFirst = 0;
    ts.forEach(function(t, i){
      var d = t.d, mr = mesialRight(t.n), x = { t:typeOf(t.n), m:mr, n:t.n };
      seed += +t.n * (i + 3);
      width += d.cw;
      if(o.at) x.at = o.at(t.n);
      if(t.missing){ if(o.at) return; if(list.length) list[list.length - 1].gapAfter = (list[list.length - 1].gapAfter || 0) + d.cw; else gapFirst += d.cw; return; }
      /* bone loss % of root length -> mm below the normal crest (1.5 mm below the CEJ); an implant's bone is in mm
         below its platform, which sits at that crest line */
      var bm = t.implant ? (t.bone.m || 0) : Math.max(0, boneMM(t, 'm') - 1.5), bd = t.implant ? (t.bone.d || 0) : Math.max(0, boneMM(t, 'd') - 1.5);
      x.bone = [bm, bd]; x.vdef = [t.vdef.m || 0, t.vdef.d || 0]; x.furcX = t.furcX;
      x.crown = t.crown; x.endo = t.endo; x.amalgam = t.amalgam; x.calc = t.calc; x.lift = t.raw.lift || 0; x.halo = t.halo;
      if(t.resto.length) x.resto = t.resto; if(t.caries.length) x.caries = t.caries; if(t.lesion) x.lesion = t.lesion;
      if(t.mob >= 2) x.pdl = .34;
      if(t.implant){ x.implant = t.implant; x.cover = !!t.implant.cover; }
      list.push(x);
    });
    list.forEach(function(x, i){ if(i && list[i - 1].gapAfter) x.gap = list[i - 1].gapAfter; else if(!i && gapFirst) x.gap = gapFirst; });
    var w = o.w || Math.round(width * k + 48);
    if(!list.length){ var empty = '<rect class="xr-soft" x="0" y="0" width="' + w + '" height="' + h + '"/><rect class="xr-bone" x="0" y="' + f1(occ + 9 * k) + '" width="' + w + '" height="' + h + '"/>';
      return { inner:empty, bg:empty, teeth:'', w:w, h:h, up:up, ts:ts }; }
    var gs = rowXR(list, 20, occ, k), bg = filmBG(gs, w, h, seed, o.tb), teethSVG = gs.map(toothSVG).join('');
    /* bg and teeth apart too: a bitewing lays both rows' backgrounds down before either row's teeth, so the cusps meet */
    return { inner:bg + teethSVG, bg:bg, teeth:teethSVG, w:w, h:h, up:up, ts:ts };
  }
  function filmSVG(cls, w, h, label, inner, dotTop){
    var dotP = dotTop ? [w - 16, 9] : [w - 16, h - 9];
    return '<svg class="xr dc-film' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + inner + '<circle class="xr-dot" cx="' + dotP[0] + '" cy="' + dotP[1] + '" r="3"/></svg>';
  }
  function names(ts){ return ts.map(function(t){ return '#' + t.n; }).join(', '); }
  /* a periapical film of the case's teeth (or the figure's): bone levels, defects, furcations, restorations, caries,
     periapical lesions and implants from the model */
  I.film = function(spec, o){
    spec = prep(spec); o = o || {}; var k = o.k || 9, h = o.h || Math.round(30 * k);
    var R = filmRow(spec, o.teeth, k, 2.6 * k, h, o), inner = R.inner;
    if(R.up) inner = '<g transform="translate(0 ' + h + ') scale(1 -1)">' + inner + '</g>';
    var label = o.aria || ('Periapical radiograph of ' + (R.up ? 'upper' : 'lower') + ' teeth ' + names(R.ts) + (R.up ? ', shown crowns down' : ''));
    return filmSVG('', R.w, h, label, inner, !R.up);
  };
  /* a bitewing (White and Pharoah): the crowns of both arches of one side on one horizontal film with the teeth closed on
     the bite tab (the tab itself is radiolucent and doesn't show), the bone crest of both arches and the roots' cervical
     third; the posterior teeth only, for proximal caries and the crest, not the apices. Each tooth sits at its place along
     the arch (the library's archMM, the upper arch set for a Class I occlusion), so the upper and lower contacts are
     staggered and the cusps interdigitate across the occlusal plane; the soft tissue and bone run the film's whole width.
     On a full-mouth case the teeth on either side of the listed ones show where the film's edge cuts them; on a case that
     lists only its own teeth the film stops at them. o.win: the film's span along the arch in mm; o.teeth: upper and lower
     premolars and molars of one side, e.g. ['2','3','4','5','28','29','30','31'] */
  var BW_H = 30.5, PA_POST = [36, 30.5], PA_ANT = [23, 37], PA_OCC = 2.5;
  function inWindow(win, upper, occl){
    var out = [], a = upper ? 1 : 17;
    for(var n = a; n < a + 16; n++){ var sp = TL.archMM(n, occl); if(sp[1] > win[0] + .4 && sp[0] < win[1] - .4) out.push(String(n)); }
    return out;
  }
  function bitewingInner(spec, teeth, k, tb, o){
    o = o || {};
    var up = teeth.filter(isUpper), lo = teeth.filter(function(n){ return !isUpper(n); }), hb = Math.round(BW_H / 2 * k), occ = -.25 * k;   /* the cusps overlap about .5 mm across the plane */
    var win = o.win;
    if(!win){ var a = Infinity, b = -Infinity;
      teeth.forEach(function(n){ var sp = TL.archMM(n, true); a = Math.min(a, sp[0]); b = Math.max(b, sp[1]); });
      var m = Math.max(1.5, (31 - (b - a)) / 2); win = [a - m, b + m]; }
    var w = Math.round((win[1] - win[0]) * k), all = spec.full || o.all;
    function row(list, upper){
      var ts = all ? inWindow(win, upper, true) : list;
      return filmRow(spec, ts.length ? ts : list, k, occ, hb, { tb:tb, w:w, at:function(n){ return (TL.archMM(n, true)[0] - win[0]) * k; } });
    }
    var U = row(up, true), L = row(lo, false), flip = '<g transform="translate(0 ' + hb + ') scale(1 -1)">', down = '<g transform="translate(0 ' + hb + ')">';
    var inner = flip + U.bg + '</g>' + down + L.bg + '</g>' + flip + U.teeth + '</g>' + down + L.teeth + '</g>';
    return { inner:inner, w:w, h:2 * hb, ts:teethOf(spec, up).concat(teethOf(spec, lo)) };
  }
  I.bitewing = function(spec, o){
    spec = prep(spec); o = o || {}; var k = o.k || 9, teeth = (o.teeth || spec.teeth).map(String);
    var B = bitewingInner(spec, teeth, k, o.tb);
    var label = o.aria || ('Bitewing radiograph of ' + names(B.ts) + ': the upper crowns above, the lower below, the teeth closed together, the bone crest on both');
    return filmSVG('dc-bw', B.w, B.h, label, B.inner, true);
  };
  /* a full-mouth series as it is mounted (the patient's right on your left, as if facing the patient): 14 periapicals and 4
     bitewings. Each film is a window onto its arch at true size: posterior periapicals and the bitewings landscape (36 by
     30.5 mm, a size 2 film's proportions), anterior periapicals portrait (23 by 37 mm), the crowns 2.5 mm from the occlusal edge and the apices well inside it.
     The windows overlap as a real series' do: the molar film from the second premolar back, the premolar film from the
     canine to the first molar, the canine film the lateral to the first premolar, the incisor film across the midline; the
     molar bitewing from the second premolars back, the premolar bitewing from the canines. Upper films on top, crowns down,
     their occlusal edges toward the middle; the bitewings under the posterior films; lower films below. A film's edge cuts
     the teeth it only partly covers. Every tooth comes from the record (a full-mouth case: one the case says nothing about
     is healthy). */
  function paWins(upper){
    var c = function(n){ var sp = TL.archMM(n); return (sp[0] + sp[1]) / 2; }, P = upper ? ['4', '6'] : ['29', '27'], pw = PA_POST[0], aw = PA_ANT[0];
    var p2 = c(P[0]), cn = c(P[1]);
    var right = [[p2 - pw, p2, 1], [cn + 1 - pw, cn + 1, 1], [cn - aw / 2, cn + aw / 2, 0]];
    var mid = [[-aw / 2, aw / 2, 0]], left = right.map(function(x){ return [-x[1], -x[0], x[2]]; }).reverse();
    return right.concat(mid, left);
  }
  function bwWins(){
    var c = function(n){ var sp = TL.archMM(n, true); return (sp[0] + sp[1]) / 2; }, pw = PA_POST[0], p2 = c('4'), cn = c('6');
    var right = [[p2 - pw, p2], [cn + 2 - pw, cn + 2]];
    return right.concat(right.map(function(x){ return [-x[1], -x[0]]; }).reverse());
  }
  /* rounded film corners over a nested film (an inner svg clips to a square): the mount's color outside each arc */
  function corners(w, h, r){
    return '<path class="dc-mount" d="M0 0H' + r + 'A' + r + ' ' + r + ' 0 0 0 0 ' + r + 'Z M' + w + ' 0V' + r + 'A' + r + ' ' + r + ' 0 0 0 ' + (w - r) + ' 0Z M' + w + ' ' + h + 'H' + (w - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + w + ' ' + (h - r) + 'Z M0 ' + h + 'V' + (h - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + r + ' ' + h + 'Z"/>';
  }
  I.fmx = function(spec, o){
    spec = prep(spec); o = o || {}; var k = 6, M = 4, G = 3, s = '';
    var colW = [PA_POST[0], PA_POST[0], PA_ANT[0], PA_ANT[0], PA_ANT[0], PA_POST[0], PA_POST[0]], colX = [], x = M;
    colW.forEach(function(cw){ colX.push(x); x += cw + G; });
    var W = x - G + M, rowH = PA_ANT[1], y1 = M, y2 = y1 + rowH + G, y3 = y2 + BW_H + G, H = y3 + rowH + M;
    function film(xmm, ymm, wpx, hpx, inner, cls){
      return '<svg class="' + cls + '" x="' + f1(xmm * k) + '" y="' + f1(ymm * k) + '" width="' + wpx + '" height="' + hpx + '" viewBox="0 0 ' + wpx + ' ' + hpx + '"><rect class="xr-film" x="0" y="0" width="' + wpx + '" height="' + hpx + '"/>' + inner + corners(wpx, hpx, 12) + '</svg>';
    }
    [true, false].forEach(function(upper){
      paWins(upper).forEach(function(win, i){
        var fs = win[2] ? PA_POST : PA_ANT, wpx = Math.round(fs[0] * k), hpx = Math.round(fs[1] * k);
        var R = filmRow(spec, inWindow(win, upper), k, PA_OCC * k, hpx, { tb:70, w:wpx, at:function(n){ return (TL.archMM(n)[0] - win[0]) * k; } });
        var inner = upper ? '<g transform="translate(0 ' + hpx + ') scale(1 -1)">' + R.inner + '</g>' : R.inner;
        /* upper films sit on the middle (their occlusal edges down), lower films hang from it */
        s += film(colX[i], upper ? y1 + rowH - fs[1] : y3, wpx, hpx, inner, 'dc-pa');
      });
    });
    bwWins().forEach(function(win, i){
      var B = bitewingInner(spec, [], k, 50, { win:win, all:true }), col = [0, 1, 5, 6][i];
      s += film(colX[col], y2, B.w, B.h, B.inner, 'dc-bwc');
    });
    /* the mount's orientation marks, in the space between the premolar bitewings */
    var mx0 = colX[2] * k, mx1 = (colX[4] + colW[4]) * k, my = (y2 + BW_H / 2) * k;
    s += txt(mx0 + 10, my + 9, 'R', 'dc-mlab') + txt(mx1 - 10, my + 9, 'L', 'dc-mlab', 'end') +
      txt((mx0 + mx1) / 2, my - 4, 'Patient\'s right on your left', 'dc-mnote', 'middle') + txt((mx0 + mx1) / 2, my + 14, 'Upper films above, lower below', 'dc-mnote', 'middle');
    var label = o.aria || 'Full-mouth series: 14 periapical films and 4 bitewings, mounted with the patient\'s right on your left; upper films on top with their crowns down, the bitewings under the back teeth\'s films, lower films below';
    return '<svg class="xr dc-film dc-fmx" viewBox="0 0 ' + f1(W * k) + ' ' + f1(H * k) + '" role="img" aria-label="' + esc(label) + '"><rect class="dc-mount" x="0" y="0" width="' + f1(W * k) + '" height="' + f1(H * k) + '" rx="14"/>' + s + '</svg>';
  };

  /* ---------- the odontogram: the whole mouth, each tooth as five surfaces ----------
     Upper teeth #1-16 across the top, lower #32-17 across the bottom, the patient's right on your left; each tooth's facial
     surface toward the outside of the chart (up for the upper row, down for the lower), its mesial toward the midline, and
     what belongs to the root drawn outside the box, toward the apex, as on an anatomic chart: a root canal filling a line
     up the root, a periapical lesion a ring at its end, an implant a screw. Restorations fill their surfaces by material,
     caries is red with a hatch (so it never rests on color alone), a crown rings the tooth and shades all five surfaces, a
     missing tooth is crossed out. Two layouts from the same marks: a row an arch, or a row a quadrant at twice the size,
     and the page shows the one that fits its width (cases.css: a phone gets the quadrants). Furcations and mobility are
     left to the chart. */
  var OD = { cw:28, r:10, q:4.4, pad:14, row:52 };
  /* diagonal hatch lines clipped to a convex polygon (no pattern fill: the drawings carry no ids) */
  function hatch(poly, gap){
    var cs = poly.map(function(p){ return p[0] - p[1]; }), lo = Math.min.apply(null, cs), hi = Math.max.apply(null, cs), d = '';
    for(var c = lo + gap / 2; c < hi; c += gap){
      var hits = [];
      for(var i = 0; i < poly.length; i++){ var a = poly[i], b = poly[(i + 1) % poly.length], fa = a[0] - a[1] - c, fb = b[0] - b[1] - c;
        if(fa === fb || fa * fb > 0) continue; var t = fa / (fa - fb); hits.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      if(hits.length >= 2){ hits.sort(function(p, q){ return p[0] - q[0]; }); var u = hits[0], v = hits[hits.length - 1];
        if(Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) > .8) d += 'M' + f1(u[0]) + ' ' + f1(u[1]) + 'L' + f1(v[0]) + ' ' + f1(v[1]); }
    }
    return d ? '<path class="dc-o-hatch" d="' + d + '"/>' : '';
  }
  /* one tooth: its box centered at cx, top at y0 (an upper tooth: the number and the root side above the box) */
  function odoTooth(spec, n, cx, y0, up){
    var t = tooth(spec, n), r = OD.r, q = OD.q, out = '', fy = up ? -1 : 1, mx = mesialRight(n) ? 1 : -1;
    var cy = up ? y0 + 42 : y0 + r, edge = up ? cy - r : cy + r, dir = up ? -1 : 1;   /* edge: the box's root side; dir: toward the apex */
    out += txt(cx, up ? y0 + 9 : y0 + 49, n, 'dc-onum', 'middle');
    var P = { O:[[cx - q, cy - q], [cx + q, cy - q], [cx + q, cy + q], [cx - q, cy + q]],
      F:[[cx - r, cy + fy * r], [cx + r, cy + fy * r], [cx + q, cy + fy * q], [cx - q, cy + fy * q]],
      L:[[cx - r, cy - fy * r], [cx + r, cy - fy * r], [cx + q, cy - fy * q], [cx - q, cy - fy * q]],
      M:[[cx + mx * r, cy - r], [cx + mx * r, cy + r], [cx + mx * q, cy + q], [cx + mx * q, cy - q]],
      D:[[cx - mx * r, cy - r], [cx - mx * r, cy + r], [cx - mx * q, cy + q], [cx - mx * q, cy - q]] };
    function key(x){ return x === 'B' ? 'F' : x === 'I' ? 'O' : x; }
    var fill = {}, car = {};
    t.resto.forEach(function(rs){ rs.s.split('').forEach(function(x){ fill[key(x)] = 'dc-o-' + rs.mat; }); });
    t.caries.forEach(function(cr){ car[key(cr.s)] = cr.depth; });
    if(t.missing){
      ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-gone', P[x]); });
      return out + '<path class="dc-ox" d="M' + f1(cx - r - 1) + ' ' + f1(cy - r - 1) + 'l' + (2 * r + 2) + ' ' + (2 * r + 2) + 'm0 ' + (-2 * r - 2) + 'l' + (-2 * r - 2) + ' ' + (2 * r + 2) + '"/>';
    }
    var crowned = t.crown || t.implant;
    ['O', 'F', 'L', 'M', 'D'].forEach(function(x){
      out += path('dc-osurf' + (crowned ? ' dc-o-crowned' : '') + (fill[x] ? ' ' + fill[x] : '') + (car[x] ? ' dc-o-caries' : ''), P[x]);
      if(car[x]) out += hatch(P[x], 2.8); });
    if(crowned) out += '<rect class="dc-o-crown" x="' + f1(cx - r - 2) + '" y="' + f1(cy - r - 2) + '" width="' + (2 * r + 4) + '" height="' + (2 * r + 4) + '" rx="3.5"/>';
    if(t.implant){ var sy = edge + dir * 3;
      out += '<path class="dc-o-impl" d="M' + f1(cx) + ' ' + f1(sy) + 'v' + f1(dir * 11) + '"/><path class="dc-o-impl dc-o-thread" d="' +
        [0, 3.5, 7, 10.5].map(function(dy, i){ var hw = 4.2 - i * .7; return 'M' + f1(cx - hw) + ' ' + f1(sy + dir * dy) + 'h' + f1(2 * hw); }).join('') + '"/>'; }
    if(t.endo) out += '<path class="dc-o-endo" d="M' + f1(cx) + ' ' + f1(edge + dir * 2) + 'v' + f1(dir * 11) + '"/>';
    if(t.lesion){
      if(!t.endo) out += '<path class="dc-o-root" d="M' + f1(cx) + ' ' + f1(edge + dir * 2) + 'v' + f1(dir * 11) + '"/>';
      out += dot('dc-o-lesion', cx, edge + dir * 15.6, 3.1);
    }
    return out;
  }
  function odoRow(spec, nums, x0, y0, up){ var s = ''; nums.forEach(function(n, i){ s += odoTooth(spec, String(n), x0 + i * OD.cw + OD.cw / 2, y0, up); }); return s; }
  function range(a, b){ var o = []; if(a <= b) for(var i = a; i <= b; i++) o.push(i); else for(var j = a; j >= b; j--) o.push(j); return o; }
  I.odontogram = function(spec, o){
    spec = prep(spec); o = o || {}; var cw = OD.cw, pad = OD.pad, R = OD.row;
    var label = o.aria || 'Odontogram of the whole mouth: each tooth drawn as five surfaces; missing teeth crossed out; restorations, caries, crowns, implants, root canal fillings and periapical lesions marked';
    /* wide: one row an arch */
    var W = 16 * cw + 2 * pad, gapY = 14, H = 2 * R + gapY + 6, mid = 3 + R + gapY / 2, w = '';
    w += '<rect class="dc-paper" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
    w += '<path class="dc-mid" d="M' + (W / 2) + ' 4V' + (H - 4) + 'M' + (pad + 4) + ' ' + mid + 'H' + (W - pad - 4) + '"/>';
    w += txt(pad / 2 + 1, mid + 3.5, 'R', 'dc-oside', 'middle') + txt(W - pad / 2 - 1, mid + 3.5, 'L', 'dc-oside', 'middle');
    w += odoRow(spec, range(1, 16), pad, 3, true) + odoRow(spec, range(32, 17), pad, 3 + R + gapY, false);
    var wide = '<svg class="dc-odo dc-odo-w" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + w + '</svg>';
    /* narrow: a row a quadrant, each named at its outer end, the midline marked at its inner end */
    var Wn = 8 * cw + 2 * pad, lab = 12, rows = [['Upper right', range(1, 8), true, 'r'], ['Upper left', range(9, 16), true, 'l'], ['Lower right', range(32, 25), false, 'r'], ['Lower left', range(24, 17), false, 'l']];
    var y = 2, n = '', ys = [];
    rows.forEach(function(rw, i){
      if(i === 2) y += 8;
      var right = rw[3] === 'r', midX = right ? Wn - pad + 1 : pad - 1;
      n += txt(right ? pad : Wn - pad, y + 9, rw[0], 'dc-oq', right ? 'start' : 'end') + txt(right ? Wn - pad : pad, y + 9, 'midline', 'dc-oqm', right ? 'end' : 'start');
      ys.push(y + lab);
      n += '<path class="dc-mid" d="M' + midX + ' ' + (y + lab + 2) + 'V' + (y + lab + R - 2) + '"/>';
      n += odoRow(spec, rw[1], pad, y + lab, rw[2]);
      y += lab + R + 9;
    });
    var Hn = y - 3, occl = (ys[1] + R + ys[2] - lab) / 2;
    var narrow = '<svg class="dc-odo dc-odo-n" viewBox="0 0 ' + Wn + ' ' + Hn + '" role="img" aria-label="' + esc(label + ', one quadrant to a row') + '">' +
      '<rect class="dc-paper" x="0" y="0" width="' + Wn + '" height="' + Hn + '" rx="10"/><path class="dc-mid" d="M' + pad + ' ' + f1(occl) + 'H' + (Wn - pad) + '"/>' + n + '</svg>';
    return '<div class="dc-ow">' + wide + narrow + odoKey() + odoText(spec) + '</div>';
  };
  /* the key, drawn with the chart's own marks */
  function odoKey(){
    var sq = [[2, 2], [14, 2], [14, 14], [2, 14]];
    function k(inner, label){ return '<span class="dc-ok"><svg class="dc-oks" viewBox="0 0 16 16" aria-hidden="true">' + inner + '</svg>' + label + '</span>'; }
    return '<div class="pchart-key dc-okey">' +
      k(path('dc-osurf dc-o-amalgam', sq), 'amalgam') + k(path('dc-osurf dc-o-composite', sq), 'composite') + k(path('dc-osurf dc-o-gold', sq), 'gold') +
      k(path('dc-osurf dc-o-caries', sq) + hatch(sq, 3.2), 'caries') +
      k(path('dc-osurf dc-o-crowned', [[4, 4], [12, 4], [12, 12], [4, 12]]) + '<rect class="dc-o-crown" x="1.5" y="1.5" width="13" height="13" rx="2.5"/>', 'crown') +
      k('<path class="dc-o-endo" d="M8 1.5V14.5"/>', 'root canal filling') +
      k('<path class="dc-o-root" d="M8 1V8"/>' + dot('dc-o-lesion', 8, 11.5, 3.1), 'periapical lesion') +
      k('<path class="dc-o-impl" d="M8 1.5V14.5"/><path class="dc-o-impl dc-o-thread" d="M3.5 3h9M4.3 6.5h7.4M5 10h6M5.8 13.5h4.4"/>', 'implant') +
      k('<path class="dc-ox" d="M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5"/>', 'missing') +
      '<span class="dc-okey-t">Upper teeth on top. Each tooth\'s facial side faces out and its mesial the midline; the marks beyond a tooth sit on its root, toward the apex. The patient\'s right is on your left.</span></div>';
  }
  /* the same record as text, for a screen reader and for anyone who can't read the small squares */
  function odoText(spec){
    var miss = [], notes = [];
    for(var n = 1; n <= 32; n++){ var t = tooth(spec, String(n)), c = CAT(n), bits = [];
      if(t.missing){ miss.push('#' + n); continue; }
      if(t.implant) bits.push('implant');
      if(t.crown) bits.push('crown');
      t.resto.forEach(function(r){ bits.push(r.s + ' ' + r.mat); });
      t.caries.forEach(function(r){ bits.push('caries ' + r.s + ' (' + r.depth + ')'); });
      if(t.endo) bits.push('root canal filling');
      if(t.lesion) bits.push('periapical lesion');
      if(bits.length) notes.push('#' + n + ': ' + bits.join(', '));
    }
    return '<details class="dc-otext"><summary>The chart as text</summary><p>' + (miss.length ? 'Missing: ' + miss.join(', ') + '. ' : 'No teeth missing. ') + esc(notes.join('; ')) + (notes.length ? '.' : '') + '</p></details>';
  }

  /* ---------- the drawn buccal view ---------- */
  I.view = function(spec, o){
    spec = prep(spec); o = o || {}; var ts = teethOf(spec, o.teeth), up = isUpper(ts[0].n), k = o.k || 8.2, g = spec.gingiva || {};
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

  /* ---------- the figures a question shows: list = [{kind, title, note, hide, lingual, teeth}] ----------
     kind: chart | film | view (one arch: the case's teeth, or the figure's own teeth), bitewing (the premolars and molars
     of one side, both arches), fmx (the full-mouth series) or odontogram (the whole mouth) */
  var KINDS = { chart:'Periodontal chart', film:'Periapical radiograph', view:'Clinical view (drawn)', bitewing:'Bitewing radiograph', fmx:'Full-mouth series', odontogram:'Odontogram' };
  var WIDE = { chart:1, fmx:1, odontogram:1 };
  I.KINDS = Object.keys(KINDS);
  I.figures = function(spec, list){
    spec = prep(spec);
    var out = '';
    (list || []).forEach(function(f){
      var body = f.kind === 'chart' ? I.chart(spec, f) : f.kind === 'film' ? I.film(spec, f) : f.kind === 'view' ? I.view(spec, f) :
        f.kind === 'bitewing' ? I.bitewing(spec, f) : f.kind === 'fmx' ? I.fmx(spec, f) : f.kind === 'odontogram' ? I.odontogram(spec, f) : '';
      if(!body) return;
      /* the series stays at a size its films can be read at, and scrolls sideways on a phone */
      if(f.kind === 'fmx') body = '<div class="dc-scroll">' + body + '</div><p class="dc-scroll-hint">Scroll sideways for the whole series.</p>';
      out += '<figure class="pimg dc-fig' + (WIDE[f.kind] ? ' wide' : '') + '"><figcaption><b>' + esc(KINDS[f.kind]) + '</b>' + (f.title ? ' · ' + esc(f.title) : '') + '</figcaption>' + body + (f.note ? '<div class="pimg-cap">' + esc(f.note) + '</div>' : '') + '</figure>';
    });
    if(!out) return '';
    return '<div class="pimg-grid dc-figs">' + out + '</div><div class="pimg-note dc-note">Drawn for this hub from the case\'s numbers to show the findings; not a patient image or a real radiograph. Tooth sizes and shapes are averages (Wheeler).</div>';
  };

  /* ---------- the Patient Box rows, from the same record ----------
     A case with no box of its own gets these, so the age, smoking, HbA1c and teeth a question shows are the numbers the
     key was worked out from. spec: age, sex ('woman' | 'man'), smoke (cigarettes a day; 0 = doesn't smoke), hba1c,
     medical, cc (the chief complaint, in the patient's words), mouth.teeth / lost / involved. */
  I.rows = function(spec){
    spec = prep(spec); var r = [], m = spec.mouth || {};
    if(spec.age != null) r.push(['Patient', spec.age + '-year-old ' + (spec.sex || 'patient')]);
    if(spec.cc) r.push(['Chief complaint', '"' + spec.cc + '"']);
    if(spec.medical) r.push(['Medical history', spec.medical]);
    if(spec.hba1c != null) r.push(['HbA1c', spec.hba1c + '%']);
    if(spec.smoke != null) r.push(['Tobacco', spec.smoke ? spec.smoke + ' cigarettes a day' : 'Does not smoke']);
    if(m.teeth != null) r.push(['Teeth', m.teeth + ' present' + (m.lost ? '; ' + m.lost + ' lost to periodontitis' : m.lost === 0 ? '; none lost to periodontitis' : '')]);
    if(m.involved != null && m.teeth != null) r.push(['Teeth involved', m.involved + ' of ' + m.teeth + ' have attachment loss']);
    if(m.stage4 && m.stage4.length) r.push(['Also', m.stage4.join('; ')]);
    return r;
  };
  I.caseRows = function(c){ return c ? (c.box || I.rows(c.spec)) : []; };

  /* ---------- checks on what a question shows ---------- */
  function present(spec, teeth){ return (teeth || []).map(String).filter(function(n){ return !tooth(spec, n).missing; }); }
  function figTeeth(spec, f){
    if(f.kind === 'fmx' || f.kind === 'odontogram'){ var a = []; for(var i = 1; i <= 32; i++) a.push(String(i)); return a; }
    return (f.teeth || spec.teeth || []).map(String);
  }
  /* the pictures themselves: known kinds, one arch where a view needs one, a bitewing only of premolars and molars and of
     both arches, and a full-mouth view that agrees with the counts the box gives */
  I.checkFigs = function(spec, figs){
    spec = prep(spec); var P = [], m = spec.mouth || {};
    (figs || []).forEach(function(f, i){
      var w = 'figure ' + (i + 1) + ' (' + f.kind + '): ';
      if(!KINDS[f.kind]){ P.push(w + 'unknown picture kind'); return; }
      Object.keys(f.hide || {}).forEach(function(h){ if(['cal', 'furc', 'mob'].indexOf(h) < 0) P.push(w + 'hide.' + h + ' is not something a chart can hide'); });
      var ts = figTeeth(spec, f);
      ts.forEach(function(n){ if(!CAT(n)) P.push(w + 'tooth ' + n + ' is not a universal number'); });
      if(f.kind === 'chart' || f.kind === 'film' || f.kind === 'view'){
        var a = ts.map(isUpper); if(a.some(Boolean) && !a.every(Boolean)) P.push(w + 'the teeth are not all in one arch');
        if(!present(spec, ts).length) P.push(w + 'every tooth in it is missing');
      }
      if(f.kind === 'bitewing'){
        ts.forEach(function(n){ var c = CAT(n); if(c && c.films.indexOf('bitewing') < 0) P.push(w + 'a bitewing of #' + n + ' (the ' + c.name + '): bitewings show premolars and molars'); });
        if(!ts.some(isUpper) || ts.every(isUpper)) P.push(w + 'a bitewing shows both arches: list upper and lower teeth');
        var sides = ts.map(function(n){ return CAT(n) && CAT(n).side; }); if(sides.some(function(x){ return x !== sides[0]; })) P.push(w + 'a bitewing shows one side');
      }
      if(f.kind === 'fmx' || f.kind === 'odontogram'){
        var gone = 0; for(var j = 1; j <= 32; j++) if(tooth(spec, String(j)).missing) gone++;
        if(!spec.full) P.push(w + 'a full-mouth view needs full:true and every tooth in the record (missing ones by the missing module)');
        if(m.teeth != null && m.teeth !== 32 - gone) P.push(w + 'the box says ' + m.teeth + ' teeth present; the record has ' + (32 - gone));
        if(m.lost != null && m.lost > gone) P.push(w + m.lost + ' teeth lost to periodontitis, but only ' + gone + ' are missing');
      }
    });
    return P;
  };
  /* answerable from what's shown: each question says what its key rests on (q.rests: stage, grade, extent, rt, furc, impl,
     kind), and this fails when the figures and rows it shows don't include it. The twin of hide, which stops a picture
     from giving the answer away. */
  var RESTS = ['stage', 'grade', 'extent', 'rt', 'furc', 'impl', 'kind'];
  I.RESTS = RESTS;
  I.answerable = function(spec, figs, rows, rests){
    spec = prep(spec); figs = figs || []; rows = rows || []; var P = [], D = I.derive(spec), m = spec.mouth || {};
    var rowText = rows.map(function(r){ return r.join(': '); }).join(' | ');
    function row(re){ return re.test(rowText); }
    function inFig(kinds, n, test){ return figs.some(function(f){ return kinds.indexOf(f.kind) >= 0 && figTeeth(spec, f).indexOf(String(n)) >= 0 && (!test || test(f)); }); }
    function chart(n, test){ return inFig(['chart'], n, test); }
    function film(n){ return inFig(['film', 'bitewing', 'fmx'], n); }
    var anyChart = figs.some(function(f){ return f.kind === 'chart'; });
    (rests || []).forEach(function(k){
      if(RESTS.indexOf(k) < 0){ P.push('rests: "' + k + '" is not one of ' + RESTS.join(', ')); return; }
      if(k === 'kind' && !anyChart) P.push('kind: health, gingivitis or periodontitis needs the chart (CAL and bleeding)');
      if(k === 'stage'){
        if(D.kind !== 'periodontitis'){ if(!anyChart) P.push('stage: no attachment loss is only seen on the chart, and none is shown'); return; }
        var sev = (D.sCAL === D.severity && chart(D.maxInterdental.tooth)) || (D.sRBL === D.severity && D.maxRBL.tooth && film(D.maxRBL.tooth));
        if(!sev) P.push('stage: the severity rests on interdental CAL at #' + D.maxInterdental.tooth + ' (' + D.maxInterdental.v + ' mm) or bone loss at #' + (D.maxRBL.tooth || '?') + ' (' + D.maxRBL.pct + '%), and neither is shown');
        if(D.stage === 4 && (m.lost >= 5 || (m.stage4 && m.stage4.length))){
          if(!row(/lost|stage 4|bite|chewing|ridge|mobil|drift|flar/i)) P.push('stage: Stage 4 rests on teeth lost or the complexity it adds, and no row gives it');
        } else if(D.stage > D.severity){
          var shown = (D.maxPD.v >= 6 && chart(D.maxPD.tooth)) || (D.vertical >= 3 && film(D.verticalTooth)) ||
            (D.furc >= 2 && (chart(D.furcTooth, function(f){ return !(f.hide && f.hide.furc); }) || (film(D.furcTooth) && tooth(spec, D.furcTooth).furcX >= 2))) ||
            (m.lost && row(/lost/i));
          if(!shown) P.push('stage: Stage ' + D.stage + ' rests on ' + D.triggers.join(' or ') + ', and none of it is shown');
        }
      }
      if(k === 'grade'){
        var smokeRow = row(/tobacco|smok|cigar/i), a1cRow = row(/hba1c|a1c|glyc|diabet/i);
        if(D.modifiers.length){
          if(!(((spec.smoke || 0) >= 10 && smokeRow) || ((spec.hba1c || 0) >= 7 && a1cRow))) P.push('grade: Grade C rests on ' + D.modifiers.join(' or ') + ', and no row gives it');
        } else {
          if(D.maxRBL.pct > 0 && !film(D.maxRBL.tooth)) P.push('grade: the grade rests on bone loss for age, and the film of #' + D.maxRBL.tooth + ' is not shown');
          if(!row(/patient|age|year-old/i)) P.push('grade: the grade rests on bone loss for age, and no row gives the age');
          if(spec.smoke != null && !smokeRow) P.push('grade: no row says whether the patient smokes, so Grade C can\'t be ruled out');
          if(spec.hba1c != null && !a1cRow) P.push('grade: no row gives the HbA1c, so Grade C can\'t be ruled out');
        }
      }
      if(k === 'extent' && !row(/involv|extent|of \d+ teeth/i)) P.push('extent: localized or generalized rests on how many teeth are involved, and no row gives it');
      if(k === 'rt') Object.keys(D.rt).forEach(function(n){ if(!chart(n)) P.push('rt: the recession type of #' + n + ' needs its chart (facial recession and interdental CAL)'); });
      if(k === 'furc' && D.furc && !(chart(D.furcTooth, function(f){ return !(f.hide && f.hide.furc); }) || (film(D.furcTooth) && tooth(spec, D.furcTooth).furcX))) P.push('furc: the furcation of #' + D.furcTooth + ' is not shown');
      if(k === 'impl') Object.keys(D.impl).forEach(function(n){ if(!film(n)) P.push('impl: the implant at #' + n + ' needs its film'); });
    });
    return P;
  };
  /* the numbers an explanation quotes: q.says = { maxInterdental:7, stage:3, ... }; each must be what the record gives and
     must appear in the question's text, so the explanation can't drift from the picture */
  I.got = function(spec){
    var d = I.derive(spec);
    return { kind:d.kind, stage:d.stage, grade:d.grade, extent:d.extent, dx:d.dx, rt:d.rt, impl:d.impl, triggers:d.triggers, ratio:d.ratio,
      maxInterdental:d.maxInterdental.v, maxRBL:d.maxRBL.pct, maxPD:d.maxPD.v, bopPct:d.bopPct, extentPct:d.extentPct };
  };
  I.checkSays = function(spec, q){
    var P = [], g = I.got(spec), text = [q.stem, q.ex, q.why, q.choices, q.exp].map(function(x){ return x == null ? '' : typeof x === 'string' ? x : JSON.stringify(x); }).join(' ');
    Object.keys(q.says || {}).forEach(function(k){
      var v = q.says[k];
      if(!(k in g)){ P.push('says.' + k + ': not something the record works out'); return; }
      if(JSON.stringify(g[k]) !== JSON.stringify(v)) P.push('says.' + k + ': the text quotes ' + JSON.stringify(v) + ', the record gives ' + JSON.stringify(g[k]));
      var sv = String(v), re = typeof v === 'number' ? new RegExp('(^|[^0-9.])' + sv.replace('.', '\\.') + '($|[^0-9])') : null;
      if(re ? !re.test(text) : text.toLowerCase().indexOf(sv.toLowerCase()) < 0) P.push('says.' + k + ': ' + sv + ' is not in the question\'s text');
    });
    return P;
  };
  /* the hooks a hub calls: q.pcase names a case in its PCASES; q.pfig picks this question's pictures (and hides a row
     that would give its answer away); the case's box rows (its own, or the record's) go in front of the question's own */
  I.pboxFigures = function(q, cases){ var c = q && q.pcase && cases && cases[q.pcase]; return c ? I.figures(c.spec, q.pfig || c.figs) : ''; };
  I.boxRows = function(q, cases){ var c = q && q.pcase && cases && cases[q.pcase]; return (c && !q._boxFolded ? I.caseRows(c) : []).concat(q && q.pbox || []); };
  I.foldBox = function(questions, cases){ (questions || []).forEach(function(q){ var c = q.pcase && cases && cases[q.pcase]; if(c && !q._boxFolded){ q.pbox = I.caseRows(c).concat(q.pbox || []); q._boxFolded = true; } }); };
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
  I.teeth = TL;
  I._ = { teethOf:teethOf, expand:expand, viewOrder:viewOrder, typeOf:typeOf, siteOrder:siteOrder, crownMM:crownMM, rootsMM:rootsMM, boneMM:boneMM };
  window.shCases = I; window.DCASE = I;
})();
