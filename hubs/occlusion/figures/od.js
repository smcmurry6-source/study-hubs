/* od:kit begin (built from tools/figures/occlusion; edit there) */
/* ---------- DRAWING KIT + FIGURES (redrawn 2026-10-20) ----------
   One small kit draws every occlusal tooth, quadrant, fence post, cusp pathway and case image in this hub, all drawn
   for the hub from Dr. Givan's lectures and his "Help! What cusp hits where?" sheet (Occ Lec0), not copied from slides.
   Occlusal rows follow the help sheet's layout: upper teeth buccal side up, lower teeth buccal side down, mesial at the
   LEFT, which is the patient's RIGHT side (#6-#2 over #27-#31); side 'L' mirrors it (#11-#15 over #22-#18).
   Contacts per Angle class (CONTACTS) are read off the help sheet's Class I, II and III contact pictures (cusp-fossa).
   No SVG ids or url(#...) references, so every copy renders even when another copy sits in a hidden panel.
   A figure's key (FIGS[k].key, drawn by figKeyHTML) is folded under the notes and Review copies and opens in the
   explanation after answering; in-picture labels with class fg-hint (border names, the opposing cusp) hide while the figure
   sits above a question stem. */
window.OD = (function(){
  function f1(n){ return Math.round(n * 10) / 10; }
  /* smooth path through points (Catmull-Rom as cubic Bezier) */
  function smooth(pts, closed){
    var n = pts.length, d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]), last = closed ? n : n - 1;
    for(var i = 0; i < last; i++){
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if(!closed){ if(i === 0) p0 = p1; if(i + 2 >= n) p3 = p2; }
      d += ' C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function arrow(x1, y1, x2, y2, cls, head){
    head = head || 10;
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var bx = x2 - ux * head, by = y2 - uy * head, px = -uy * head * 0.55, py = ux * head * 0.55;
    return '<path class="' + cls + '" d="M' + f1(x1) + ' ' + f1(y1) + 'L' + f1(bx) + ' ' + f1(by) + '"/>' +
      '<path class="' + cls + '-head" d="M' + f1(x2) + ' ' + f1(y2) + 'L' + f1(bx + px) + ' ' + f1(by + py) + 'L' + f1(bx - px) + ' ' + f1(by - py) + 'Z"/>';
  }
  /* the same arrow over a casing in the page color, so it reads on the ivory teeth in both themes */
  function arrowC(x1, y1, x2, y2, cls, head){
    head = head || 10;
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var bx = x2 - ux * head, by = y2 - uy * head, px = -uy * head * 0.55, py = ux * head * 0.55;
    return '<path class="od-case" d="M' + f1(x1) + ' ' + f1(y1) + 'L' + f1(bx) + ' ' + f1(by) + '"/>' +
      '<path class="od-case-head" d="M' + f1(x2) + ' ' + f1(y2) + 'L' + f1(bx + px) + ' ' + f1(by + py) + 'L' + f1(bx - px) + ' ' + f1(by - py) + 'Z"/>' + arrow(x1, y1, x2, y2, cls, head);
  }
  function pin(x, y, t, cls){ return '<g class="fg-pin' + (cls ? ' ' + cls : '') + '"><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="11"/><text x="' + f1(x) + '" y="' + f1(y + 4) + '" text-anchor="middle">' + t + '</text></g>'; }
  function txt(x, y, t, cls, anchor){ return '<text class="' + (cls || 'fg-t') + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + t + '</text>'; }

  /* Occlusal outlines, normalized: x 0 = mesial -> 1 = distal, y 0 = buccal -> 1 = lingual. md/bl = crown size in mm
     (average values). cusps [x, y, r]; fossae are where opposing centric cusps land (cusp-fossa). */
  var SPEC = {
    maxC:   { md:7.5, bl:8,  out:[[.12,.22],[.45,0],[.88,.2],[.97,.5],[.75,.9],[.47,1],[.2,.9],[.02,.52]], cusps:{ T:[.46,.2,.16] }, fossae:{},
              ridges:[[[.13,.25],[.46,.2],[.86,.23]],[[.46,.22],[.47,.82]]], grooves:[], mr:[] },
    maxPM1: { md:7,   bl:9,  out:[[.18,.03],[.5,0],[.82,.03],[.97,.22],[1,.47],[.93,.74],[.73,.95],[.46,1],[.22,.93],[.05,.72],[0,.45],[.04,.2]],
              cusps:{ B:[.51,.22,.2], L:[.46,.79,.15] }, fossae:{ m:[.27,.48], d:[.73,.48] },
              grooves:[[[.07,.46],[.27,.48],[.5,.51],[.73,.48]],[[.27,.48],[.17,.3]],[[.27,.48],[.17,.66]],[[.73,.48],[.84,.31]],[[.73,.48],[.84,.65]]],
              mr:[[[.1,.26],[.08,.48],[.11,.7]],[[.9,.26],[.92,.48],[.89,.7]]] },
    maxPM2: { md:6.5, bl:9,  out:[[.2,.03],[.5,0],[.8,.03],[.97,.25],[1,.5],[.97,.75],[.8,.97],[.5,1],[.2,.97],[.03,.75],[0,.5],[.03,.25]],
              cusps:{ B:[.5,.22,.2], L:[.5,.79,.18] }, fossae:{ m:[.32,.5], d:[.68,.5] },
              grooves:[[[.32,.5],[.5,.51],[.68,.5]],[[.32,.5],[.22,.34]],[[.32,.5],[.22,.66]],[[.68,.5],[.78,.34]],[[.68,.5],[.78,.66]]],
              mr:[[[.1,.28],[.08,.5],[.1,.72]],[[.9,.28],[.92,.5],[.9,.72]]] },
    maxM1:  { md:10,  bl:11, out:[[.01,.1],[.2,0],[.36,.03],[.46,.07],[.62,.02],[.86,.05],[.96,.2],[1,.48],[.99,.74],[.92,.93],[.74,1],[.58,.94],[.38,1],[.18,.95],[.08,.76],[0,.42]],
              cusps:{ MB:[.26,.19,.17], DB:[.73,.21,.15], ML:[.34,.75,.21], DL:[.79,.8,.12] }, fossae:{ m:[.13,.44], c:[.45,.43], d:[.76,.6] },
              ridges:[[[.36,.72],[.55,.47],[.72,.24]]],
              grooves:[[[.13,.44],[.3,.47],[.45,.43]],[[.45,.43],[.46,.05]],[[.76,.6],[.66,.8],[.62,.97]],[[.76,.6],[.88,.48]]],
              mr:[[[.06,.22],[.04,.46],[.07,.68]],[[.92,.25],[.95,.46],[.9,.7]]] },
    maxM2:  { md:9,   bl:11, out:[[.04,.1],[.28,0],[.5,.06],[.75,.02],[.95,.15],[.99,.45],[.92,.74],[.74,.95],[.48,1],[.18,.9],[.02,.62],[0,.32]],
              cusps:{ MB:[.28,.19,.17], DB:[.74,.22,.14], ML:[.38,.75,.2], DL:[.76,.76,.1] }, fossae:{ m:[.14,.44], c:[.47,.44], d:[.74,.6] },
              ridges:[[[.4,.72],[.57,.48],[.72,.25]]],
              grooves:[[[.14,.44],[.32,.47],[.47,.44]],[[.47,.44],[.5,.06]],[[.74,.6],[.62,.8],[.56,.97]],[[.74,.6],[.87,.5]]],
              mr:[[[.07,.22],[.05,.46],[.08,.68]],[[.92,.27],[.94,.47],[.87,.7]]] },
    manC:   { md:7,   bl:7.5, out:[[.15,.2],[.45,0],[.85,.2],[.95,.5],[.75,.88],[.47,1],[.2,.88],[.03,.5]], cusps:{ T:[.46,.25,.16] }, fossae:{},
              ridges:[[[.15,.24],[.46,.25],[.84,.25]],[[.46,.27],[.47,.84]]], grooves:[], mr:[] },
    manPM1: { md:7,   bl:7.5, out:[[.15,.14],[.5,0],[.85,.14],[1,.45],[.88,.8],[.5,1],[.12,.8],[0,.45]],
              cusps:{ B:[.5,.32,.24], L:[.5,.85,.11] }, fossae:{ m:[.3,.62], d:[.7,.62] },
              ridges:[[[.5,.36],[.5,.82]]], grooves:[[[.3,.62],[.2,.5]],[[.3,.62],[.34,.8]],[[.7,.62],[.8,.5]]],
              mr:[[[.13,.42],[.16,.7]],[[.87,.42],[.84,.7]]] },
    manPM2: { md:7,   bl:8,  out:[[.12,.1],[.5,0],[.88,.1],[1,.45],[.95,.85],[.72,1],[.3,1],[.05,.85],[0,.45]],
              cusps:{ B:[.5,.28,.22], ML:[.3,.8,.13], DL:[.72,.82,.11] }, fossae:{ m:[.26,.5], d:[.74,.5] },
              grooves:[[[.26,.5],[.5,.57],[.74,.5]],[[.5,.57],[.52,.98]],[[.26,.5],[.16,.36]],[[.74,.5],[.84,.36]]],
              mr:[[[.1,.3],[.08,.55],[.12,.75]],[[.9,.3],[.92,.55],[.88,.75]]] },
    /* mandibular first molar: MB the widest buccal cusp, D the smallest; the mesiobuccal and lingual grooves meet the
       central groove at the central pit, the distobuccal groove leaves it farther distal and runs distobuccally */
    manM1:  { md:11,  bl:10.5, out:[[.04,.12],[.2,0],[.39,.05],[.57,0],[.76,.07],[.88,.1],[.97,.24],[1,.5],[.97,.8],[.85,.97],[.68,1],[.47,.97],[.25,1],[.08,.9],[0,.6],[0,.34]],
              cusps:{ MB:[.21,.21,.16], DB:[.57,.2,.14], D:[.87,.3,.1], ML:[.25,.8,.16], DL:[.7,.8,.14] }, fossae:{ m:[.11,.5], c:[.44,.52], d:[.86,.53] },
              grooves:[[[.11,.5],[.27,.54],[.44,.52],[.6,.5],[.72,.51],[.86,.53]],[[.44,.52],[.4,.05]],[[.72,.51],[.77,.07]],[[.44,.52],[.47,.97]]],
              mr:[[[.05,.28],[.04,.5],[.06,.74]],[[.95,.3],[.96,.52],[.94,.74]]] },
    manM2:  { md:10.5, bl:10, out:[[.04,.1],[.25,0],[.5,.04],[.75,0],[.96,.1],[1,.5],[.96,.9],[.75,1],[.5,.97],[.25,1],[.04,.9],[0,.5]],
              cusps:{ MB:[.25,.22,.16], DB:[.74,.22,.15], ML:[.26,.78,.16], DL:[.74,.78,.15] }, fossae:{ m:[.12,.5], c:[.5,.5], d:[.88,.5] },
              grooves:[[[.12,.5],[.5,.5],[.88,.5]],[[.5,.5],[.5,.04]],[[.5,.5],[.5,.97]]],
              mr:[[[.05,.27],[.04,.5],[.05,.73]],[[.95,.27],[.96,.5],[.95,.73]]] }
  };
  /* one tooth: o = { x, y, k (px per mm), flip (lower tooth: buccal down), mirror (left side: mesial right), cls } */
  function tooth(key, o){
    var s = SPEC[key], w = s.md * o.k, h = s.bl * o.k;
    function P(p){ return [o.x + (o.mirror ? 1 - p[0] : p[0]) * w, o.y + (o.flip ? 1 - p[1] : p[1]) * h]; }
    var g = '<g class="od-tooth' + (o.cls ? ' ' + o.cls : '') + '">';
    g += '<path class="od-crown" d="' + smooth(s.out.map(P), true) + '"/>';
    g += '<path class="od-rim" d="' + smooth(s.out.map(function(p){ return P([.5 + (p[0] - .5) * .9, .5 + (p[1] - .5) * .88]); }), true) + '"/>';
    Object.keys(s.cusps).forEach(function(c){ var v = s.cusps[c], p = P(v), r = v[2] * Math.min(w, h) * 1.25, q = P([v[0] + (.5 - v[0]) * .55, v[1] + (.5 - v[1]) * .7]);
      g += '<ellipse class="od-cusp" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + f1(r) + '" ry="' + f1(r * .86) + '"/>';
      g += '<path class="od-tri" d="M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + '"/>';
      g += '<circle class="od-tip" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + f1(Math.max(1.4, o.k * .22)) + '"/>'; });
    (s.ridges || []).forEach(function(r){ g += '<path class="od-ridge" d="' + smooth(r.map(P), false) + '"/>'; });
    (s.mr || []).forEach(function(r){ g += '<path class="od-mr" d="' + smooth(r.map(P), false) + '"/>'; });
    s.grooves.forEach(function(r){ g += '<path class="od-groove" d="' + smooth(r.map(P), false) + '"/>'; });
    Object.keys(s.fossae).forEach(function(f){ var p = P(s.fossae[f]); g += '<circle class="od-pit" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + f1(Math.max(1.2, o.k * .2)) + '"/>'; });
    g += '</g>';
    var pt = {};
    Object.keys(s.cusps).forEach(function(c){ pt[c] = P(s.cusps[c]); });
    Object.keys(s.fossae).forEach(function(f){ pt[f] = P(s.fossae[f]); });
    return { svg:g, pt:pt, x:o.x, y:o.y, w:w, h:h, cx:o.x + w / 2, cy:o.y + h / 2, P:P };
  }

  var ORDER = ['C', 'PM1', 'PM2', 'M1', 'M2'];
  var NUMS = { max:{ R:{ C:6, PM1:5, PM2:4, M1:3, M2:2 }, L:{ C:11, PM1:12, PM2:13, M1:14, M2:15 } },
               mand:{ R:{ C:27, PM1:28, PM2:29, M1:30, M2:31 }, L:{ C:22, PM1:21, PM2:20, M1:19, M2:18 } } };
  var TOOTH_NAME = { C:'canine', PM1:'first premolar', PM2:'second premolar', M1:'first molar', M2:'second molar' };
  var CUSP_NAME = { B:'buccal', L:'lingual', MB:'mesiobuccal', DB:'distobuccal', D:'distal', ML:'mesiolingual', DL:'distolingual', T:'cusp tip' };
  var FOSSA_NAME = { m:'mesial fossa', c:'central fossa', d:'distal fossa' };
  /* one row of a quadrant. o = { x0, yc, k, gap (mm), W (full width, for mirroring), cls:{ type:'class' },
     pos:{ C:mm, ... } (optional: each tooth's mesial edge in mm from x0, from fit(); otherwise the teeth follow each other) } */
  function row(arch, side, o){
    var x = o.x0, teeth = {}, svg = '';
    ORDER.forEach(function(t){
      var key = (arch === 'max' ? 'max' : 'man') + t, s = SPEC[key], w = s.md * o.k, h = s.bl * o.k;
      if(o.pos) x = o.x0 + o.pos[t] * o.k;
      var tx = side === 'L' ? o.W - x - w : x;
      var tt = tooth(key, { x:tx, y:o.yc - h / 2, k:o.k, flip:arch === 'mand', mirror:side === 'L', cls:(o.cls && o.cls[t]) || '' });
      tt.num = NUMS[arch][side][t]; tt.type = t; tt.arch = arch;
      teeth[t] = tt; svg += tt.svg;
      x += w + (o.gap == null ? .4 : o.gap) * o.k;
    });
    return { svg:svg, teeth:teeth, width:x - o.x0 };
  }
  /* Cusp-fossa contacts in MIP for the patient's right side, read off the help sheet's Class I, II and III fence posts with
     its anatomy rules: [cusp's arch, its tooth, cusp, opposing tooth, opposing fossa, also accepted]. "Also accepted" = the
     posterior contact on a maxillary molar, which the sheet calls "highly variable ... ranges from oblique ridge to distal
     fossa"; the contact map draws that range as a band. Class III leaves out #28 (it meets the canine) and #2's lingual
     cusps (they meet #32). Class III, #4: its lingual cusp goes to the MESIAL fossa of #30, as the help sheet's Class III
     contact picture draws it (the line ends mesial of #30's central fossa, checked 2026-11-04); real crown widths would
     put it nearer the central fossa, but the questions follow the sheet. */
  var CONTACTS = {
    1: [ ['mand','PM1','B','PM1','m'], ['mand','PM2','B','PM2','m'], ['mand','M1','MB','M1','m'], ['mand','M1','DB','M1','c','d'], ['mand','M2','MB','M2','m'], ['mand','M2','DB','M2','c','d'],
         ['max','PM1','L','PM1','d'], ['max','PM2','L','PM2','d'], ['max','M1','ML','M1','c'], ['max','M1','DL','M1','d'], ['max','M2','ML','M2','c'], ['max','M2','DL','M2','d'] ],
    2: [ ['mand','PM1','B','PM1','d'], ['mand','PM2','B','PM2','d'], ['mand','M1','MB','M1','c'], ['mand','M1','DB','M1','d'], ['mand','M2','MB','M2','c'], ['mand','M2','DB','M2','d'],
         ['max','PM1','L','PM1','m'], ['max','PM2','L','PM2','m'], ['max','M1','ML','M1','m'], ['max','M1','DL','M1','c'], ['max','M2','ML','M2','m'], ['max','M2','DL','M2','c'] ],
    3: [ ['mand','PM2','B','PM1','m'], ['mand','M1','MB','PM2','m'], ['mand','M1','DB','M1','m'], ['mand','M2','MB','M1','c','d'], ['mand','M2','DB','M2','m'],
         ['max','PM1','L','PM2','d'], ['max','PM2','L','M1','m'], ['max','M1','ML','M1','d'], ['max','M1','DL','M2','c'] ]
  };
  var ROMAN = { 1:'I', 2:'II', 3:'III' };
  function mdOf(arch, t){ return SPEC[(arch === 'max' ? 'max' : 'man') + t].md; }
  /* Each tooth placed so its contact lines run as straight across as real crown sizes allow: every tooth's mesial edge in
     mm (upper canine at 0), relaxed against its contacts with the gaps to its neighbors kept between 0.2 and 0.9 mm.
     Real crowns don't follow the fence post's equal steps (a premolar is wider than half a molar), so in Class II and III
     a couple of molar lines still lean. */
  var FIT = {};
  function fit(cls){
    if(FIT[cls]) return FIT[cls];
    var g0 = .4, gmin = .2, gmax = .9, pos = { max:{}, mand:{} }, C = CONTACTS[cls];
    ['max', 'mand'].forEach(function(a){ var x = 0; ORDER.forEach(function(t){ pos[a][t] = x; x += mdOf(a, t) + g0; }); });
    function at(a, t, f){ var s = SPEC[(a === 'max' ? 'max' : 'man') + t], p = s.cusps[f] || s.fossae[f]; return pos[a][t] + p[0] * s.md; }
    function res(c){
      var oa = c[0] === 'mand' ? 'max' : 'mand', cu = at(c[0], c[1], c[2]), fo = at(oa, c[3], c[4]);
      if(c[5]){ var f2 = at(oa, c[3], c[5]); fo = Math.max(Math.min(fo, f2), Math.min(Math.max(fo, f2), cu)); }
      return fo - cu;
    }
    var sh = 0; C.forEach(function(c){ sh += c[0] === 'mand' ? res(c) : -res(c); }); sh /= C.length;
    ORDER.forEach(function(t){ pos.mand[t] += sh; });
    for(var it = 0; it < 300; it++){
      ['mand', 'max'].forEach(function(a){
        ORDER.forEach(function(t, i){
          if(a === 'max' && t === 'C') return;
          var sum = 0, n = 0, w = .3;
          C.forEach(function(c){ if(c[0] === a && c[1] === t){ sum += res(c); n++; } else if(c[0] !== a && c[3] === t){ sum -= res(c); n++; } });
          if(i > 0){ var p = ORDER[i - 1]; sum += w * (g0 - (pos[a][t] - pos[a][p] - mdOf(a, p))); n += w; }
          if(i < ORDER.length - 1){ var q = ORDER[i + 1]; sum -= w * (g0 - (pos[a][q] - pos[a][t] - mdOf(a, t))); n += w; }
          pos[a][t] += .5 * sum / n;
        });
        for(var j = 1; j < ORDER.length; j++){ var p = ORDER[j - 1], t = ORDER[j], g = pos[a][t] - pos[a][p] - mdOf(a, p);
          if(g < gmin) pos[a][t] += gmin - g; else if(g > gmax) pos[a][t] -= g - gmax; }
      });
    }
    return (FIT[cls] = pos);
  }
  /* both rows. By default the lower row moves as one piece to its class position (dx: the mean over the lower cusps'
     contacts); with o.fit every tooth sits where fit() puts it and dx is 0. */
  function quad(cls, side, o){
    o = o || {}; var k = o.k || 8.5, W = o.W || 470, yMax = o.yMax || 70, yMand = o.yMand || 212, x0 = o.x0 || 30;
    var P = o.fit ? fit(cls) : null;
    var mx = row('max', side, { x0:x0, yc:yMax, k:k, W:W, cls:o.clsMax, pos:P && P.max });
    var mn = row('mand', side, { x0:x0, yc:yMand, k:k, W:W, cls:o.clsMand, pos:P && P.mand });
    var dx = 0, n = 0;
    if(!P){ CONTACTS[cls].forEach(function(c){ if(c[0] !== 'mand') return; dx += mx.teeth[c[3]].pt[c[4]][0] - mn.teeth[c[1]].pt[c[2]][0]; n++; }); dx = n ? dx / n : 0; }
    return { max:mx, mand:mn, dx:dx, k:k, W:W, side:side };
  }
  /* every contact as a line from the cusp tip to its fossa, over a casing in the page color so it reads on the teeth in
     both themes. A variable posterior contact (c[5]) gets a band from its first fossa to the second, and the line ends on
     the band under the cusp. opts.hl = the index of the contact to light up (drawn last; the others dim). */
  function contactLines(q, cls, opts){
    opts = opts || {}; var parts = [], last = '';
    CONTACTS[cls].forEach(function(c, i){
      var up = c[0] === 'max', toT = (up ? q.mand : q.max).teeth[c[3]], from = (up ? q.max : q.mand).teeth[c[1]].pt[c[2]], to = toT.pt[c[4]];
      var fx = from[0] + (up ? 0 : q.dx), tx = to[0] + (up ? q.dx : 0), ty = to[1];
      var on = opts.hl === i, dim = opts.hl != null && !on, cl = (up ? ' up' : '') + (on ? ' on' : '') + (dim ? ' dim' : ''), s = '';
      if(c[5]){
        var to2 = toT.pt[c[5]], x2 = to2[0] + (up ? q.dx : 0), u = Math.max(0, Math.min(1, (fx - tx) / ((x2 - tx) || 1)));
        s += '<path class="od-crange' + cl + '" d="M' + f1(tx) + ' ' + f1(ty) + 'L' + f1(x2) + ' ' + f1(to2[1]) + '"/>';
        ty += (to2[1] - ty) * u; tx += (x2 - tx) * u;
      }
      var d = 'M' + f1(fx) + ' ' + f1(from[1]) + 'L' + f1(tx) + ' ' + f1(ty), dc = (on ? ' on' : '') + (dim ? ' dim' : '');
      s += '<path class="od-ccase' + dc + '" d="' + d + '"/><path class="od-cline' + cl + '" d="' + d + '"/>' +
        '<circle class="od-cdot' + dc + '" cx="' + f1(fx) + '" cy="' + f1(from[1]) + '" r="3.4"/><circle class="od-cdot' + dc + '" cx="' + f1(tx) + '" cy="' + f1(ty) + '" r="3.4"/>';
      if(on) last = s; else parts.push(s);
    });
    return parts.join('') + last;
  }
  /* tooth numbers on one baseline above an upper row or below a lower row */
  function numLabels(r, y, below){
    var yy = null, s = '';
    ORDER.forEach(function(t){ var tt = r.teeth[t], v = below ? tt.y + tt.h + 15 : tt.y - 6; yy = yy == null ? v : below ? Math.max(yy, v) : Math.min(yy, v); });
    ORDER.forEach(function(t){ var tt = r.teeth[t]; s += txt(tt.cx, yy, '#' + tt.num, 'fg-t sm od-num', 'middle'); });
    return s;
  }

  /* Fence post as the help sheet draws it: one zigzag; maxillary cusps are the V's (labels above the line), mandibular
     cusps the peaks (labels below it); posts mark where one tooth ends and the next begins. Class II steps the lower row
     back one post, Class III brings it forward one. o = { u (one step), x0 (the first upper post), y (the line of peaks),
     hl:{ mand:'P2' }, hlMax:['P1'] } */
  var FP_UNITS = ['C', 'P1', 'P2', 'm-M1', 'd-M1', 'm-M2', 'd-M2'], FP_BOUND = [0, 1, 2, 3, 5, 7];
  function fencePost(cls, o){
    o = o || {}; var u = o.u || 46, amp = u * .5, post = u * .52, yT = o.y || post + 4, x0 = o.x0 == null ? 1.5 * u + 6 : o.x0;
    var sh = cls === 2 ? 1 : cls === 3 ? -1 : 0, hlM = o.hlMax || [], hlm = o.hl && o.hl.mand;
    var t0 = Math.min(-.5, sh - .5), t1 = Math.max(7.5, 7 + sh), pts = [], s = '';
    for(var t = t0; t <= t1 + 1e-6; t += .5) pts.push([x0 + t * u, Math.abs(t - Math.round(t)) < .01 ? yT : yT + amp]);
    s += '<path class="fp-zig" d="M' + pts.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + '"/>';
    FP_UNITS.forEach(function(lab, i){ var x = x0 + (i + .5) * u; if(hlM.indexOf(lab) > -1) s += '<path class="fp-peak" d="M' + f1(x - u / 2) + ' ' + f1(yT) + 'L' + f1(x) + ' ' + f1(yT + amp) + 'L' + f1(x + u / 2) + ' ' + f1(yT) + '"/>'; });
    FP_UNITS.forEach(function(lab, j){ var x = x0 + (j + sh) * u; if(hlm === lab) s += '<path class="fp-peak" d="M' + f1(x - u / 2) + ' ' + f1(yT + amp) + 'L' + f1(x) + ' ' + f1(yT) + 'L' + f1(x + u / 2) + ' ' + f1(yT + amp) + '"/>'; });
    FP_BOUND.forEach(function(b){ var x = x0 + b * u; s += '<path class="fp-post" d="M' + f1(x) + ' ' + f1(yT) + 'L' + f1(x) + ' ' + f1(yT - post) + '"/>'; });
    FP_BOUND.forEach(function(b){ var x = x0 + (b + sh - .5) * u; s += '<path class="fp-post low" d="M' + f1(x) + ' ' + f1(yT + amp) + 'L' + f1(x) + ' ' + f1(yT + amp + post) + '"/>'; });
    FP_UNITS.forEach(function(lab, i){ s += txt(x0 + (i + .5) * u, yT - 7, lab, 'fp-lab max' + (hlM.indexOf(lab) > -1 ? ' on' : ''), 'middle'); });
    FP_UNITS.forEach(function(lab, j){ s += txt(x0 + (j + sh) * u, yT + amp + 18, lab, 'fp-lab mand' + (hlm === lab ? ' on' : ''), 'middle'); });
    var xr = x0 + t1 * u + 8;
    s += txt(xr, yT - 7, 'upper', 'fp-lab max fp-row', 'start') + txt(xr, yT + amp + 18, 'lower', 'fp-lab mand fp-row', 'start');
    return { svg:s, w:xr + 46, h:yT + amp + post + 4, x0:x0, u:u };
  }
  function fencePostSVG(cls, o){ var f = fencePost(cls, o); return '<svg class="fp-svg" viewBox="0 0 ' + f1(f.w) + ' ' + f1(f.h) + '" role="img" aria-label="Fence post, Class ' + ROMAN[cls] + ': upper cusps are the V\'s, lower cusps the peaks">' + f.svg + '</svg>'; }
  /* the help sheet's contact map: the fence post on top; below it the right side's teeth in occlusal view (upper buccal
     side up, lower buccal side down), each placed by fit(), with every cusp-fossa contact drawn. The upper row stays in
     the same place for all three classes; only the lower row moves. */
  var CMAP = null;
  function cmapFrame(){
    if(CMAP) return CMAP;
    var lo = 0, hi = 0;
    [1, 2, 3].forEach(function(c){ var P = fit(c); ['max', 'mand'].forEach(function(a){ ORDER.forEach(function(t){ lo = Math.min(lo, P[a][t]); hi = Math.max(hi, P[a][t] + mdOf(a, t)); }); }); });
    return (CMAP = { lo:lo, hi:hi });
  }
  function contactMapSVG(cls, side){
    side = side || 'R';
    var k = 8.5, fr = cmapFrame(), x0 = 10 - fr.lo * k, xr = x0 + fr.hi * k + 10, W = xr + 50;
    var fp = fencePost(cls, { u:44 }), top = fp.h + 26;
    var yMax = top + 26 + 5.5 * k, yMand = yMax + 11 * k + 66;
    var q = quad(cls, side, { fit:true, k:k, x0:x0, W:W, yMax:yMax, yMand:yMand }), H = yMand + 5.5 * k + 28;
    function side3(y, name, a, b){ return txt(xr, y - 30, a, 'fg-t sm od-side') + txt(xr, y + 4, name, 'fg-t sm od-row') + txt(xr, y + 38, b, 'fg-t sm od-side'); }
    return '<svg class="cmap-fig" viewBox="0 0 ' + f1(W) + ' ' + f1(H) + '" role="img" aria-label="Class ' + ROMAN[cls] + ' fence post, then the right side\'s cusp-fossa contacts">' +
      '<g transform="translate(' + f1((W - fp.w) / 2) + ' 0)">' + fp.svg + '</g>' +
      '<path class="od-rule" d="M6 ' + f1(fp.h + 8) + 'L' + f1(W - 6) + ' ' + f1(fp.h + 8) + '"/>' +
      txt(6, fp.h + 24, 'The contacts on the teeth, right side, occlusal view', 'fg-t sm od-cap') +
      q.max.svg + numLabels(q.max, 0, false) + q.mand.svg + numLabels(q.mand, 0, true) + contactLines(q, cls) +
      side3(yMax, 'upper', 'buccal', 'lingual') + side3(yMand, 'lower', 'lingual', 'buccal') + '</svg>';
  }
  return { f1:f1, smooth:smooth, arrow:arrow, arrowC:arrowC, pin:pin, txt:txt, SPEC:SPEC, tooth:tooth, row:row, fit:fit, quad:quad, contactLines:contactLines, numLabels:numLabels,
    CONTACTS:CONTACTS, NUMS:NUMS, ORDER:ORDER, TOOTH_NAME:TOOTH_NAME, CUSP_NAME:CUSP_NAME, FOSSA_NAME:FOSSA_NAME, ROMAN:ROMAN,
    fencePost:fencePost, fencePostSVG:fencePostSVG, contactMapSVG:contactMapSVG, FP_UNITS:FP_UNITS };
})();

/* fence post + contact map with Class I / II / III tabs (notes and Review) */
window.cuspMapHTML = function cuspMapHTML(cls){
  cls = cls || 1;
  return '<figure class="fig-card cmap" data-cmap>' +
    '<h4>What cusp hits where: fence post and contacts</h4>' +
    '<div class="cmap-tabs" role="group" aria-label="Angle class">' + [1,2,3].map(function(c){ return '<button type="button" data-cmap-cls="'+c+'" aria-pressed="'+(c===cls)+'"'+(c===cls?' class="is-active"':'')+'>Class '+OD.ROMAN[c]+'</button>'; }).join('') + '</div>' +
    '<div class="cmap-svg">' + OD.contactMapSVG(cls, 'R') + '</div>' +
    '<p>' + CMAP_NOTE[cls] + '</p>' +
    '<p class="cmap-src">Cusp-fossa contacts in MIP for the right side, read off the help sheet\'s Class I, II and III fence posts. Each line joins a centric cusp to the fossa it sits in; red lines start on a lower cusp, blue on an upper one. A band on an upper molar is a posterior contact that can sit anywhere from the central fossa and oblique ridge back to the distal fossa. Real crowns don\'t follow the fence\'s equal steps, so a few molar lines lean. Want to drill it? Play "What cusp hits where?" at the top of the Question Bank.</p></figure>';
}
window.CMAP_NOTE = {
  1:'<b>Class I.</b> Upper premolars take their contacts in the MESIAL fossae, lower premolars in the DISTAL fossae. Each molar has an anterior and a posterior contact; anchor on the first molar\'s posterior contact (the DB cusp of #30 on #3, anywhere from the central fossa and oblique ridge back to the distal fossa) and step back: the MB cusp of #31 goes to the mesial fossa of #2.',
  2:'<b>Class II</b> steps the lower row back one post, and the premolar rule flips: upper premolars take contacts in their DISTAL fossae, lower premolars in their MESIAL fossae. #29\'s buccal cusp lands in the distal fossa of #4, #30\'s MB cusp in the central fossa of #3, and #3\'s ML cusp in the mesial fossa of #30.',
  3:'<b>Class III</b> brings the lower row forward one post. The premolar rule is the same as Class I (upper mesial, lower distal), one tooth over: #29\'s buccal cusp lands in the mesial fossa of #5, #30\'s MB cusp in the mesial fossa of #4, and #3\'s ML cusp in the distal fossa of #30.'
};
window.wireCuspMaps = function wireCuspMaps(root){
  if(!root || root.__cmap) return; root.__cmap = true;
  root.addEventListener('click', function(e){
    var b = e.target.closest('[data-cmap-cls]'); if(!b) return;
    var card = b.closest('[data-cmap]'), c = +b.getAttribute('data-cmap-cls');
    card.querySelectorAll('[data-cmap-cls]').forEach(function(x){ var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
    card.querySelector('.cmap-svg').innerHTML = OD.contactMapSVG(c, 'R');
    card.querySelector('p').innerHTML = CMAP_NOTE[c];
  });
}
window.caseImgHTML = function caseImgHTML(q){
  if(!q.pimg) return '';
  return '<div class="pimg-grid">' + q.pimg.map(function(k){ var c = CASE_IMG[k]; if(!c) return '';
    return '<figure class="pimg' + (c.wide ? ' wide' : '') + '"><figcaption><b>' + escHtml(c.kind) + '</b> · ' + escHtml(c.title) + '</figcaption>' + (c.svg || c.html) + (c.note ? '<div class="pimg-cap">' + escHtml(c.note) + '</div>' : '') + '</figure>'; }).join('') +
    '</div><div class="pimg-note">Drawn for this hub to show the findings; not a patient image.</div>';
}
/* ---------- "WHAT CUSP HITS WHERE?" (mini game at the top of the Question Bank, 2026-10-20) ----------
   Two modes, 10 rounds each, built on the help sheet's rules (OD.CONTACTS):
   - Contacts: a cusp on one arch is lit; tap the fossa it lands in on the other arch. Class I most often, II and III too,
     right and left sides. After each tap the lower row slides into its class position and the contact lines appear.
   - Movements: "What is the cusp and motion in this picture?" One tooth, one arrow from its MIP contact (the base of
     the arrow): name the movement first, then the cusp that made it (the help sheet's two-step method).
   Rounds are generated, not bank questions, so they don't count in class stats; the best score is kept in STATE.cusp. */
window.CUSP_GAME = (function(){
  var R = 10, st = null, host = null;
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function cname(arch, t, c, side){ return OD.CUSP_NAME[c] + ' cusp of #' + OD.NUMS[arch][side][t]; }
  function fname(arch, t, f, side){ return OD.FOSSA_NAME[f] + ' of #' + OD.NUMS[arch][side][t]; }
  function best(){ if(!STATE.cusp) STATE.cusp = { best:{ contacts:0, moves:0 }, plays:0 }; return STATE.cusp; }
  function classPick(){ var r = Math.random(); return r < .5 ? 1 : r < .75 ? 2 : 3; }
  /* ---- contacts ---- */
  function newContact(){
    var cls = classPick(), side = Math.random() < .6 ? 'R' : 'L', list = OD.CONTACTS[cls], c;
    do { c = pick(list); } while(st.last && st.last === cls + c.join());
    st.last = cls + c.join();
    return { mode:'contacts', cls:cls, side:side, c:c, done:false };
  }
  function contactSVG(rd, reveal){
    var o = { x0:40, k:8.2, yMax:72, yMand:214, W:480 }, q = OD.quad(rd.cls, rd.side, o), c = rd.c, from = c[0], to = from === 'mand' ? 'max' : 'mand';
    /* Before answering, both rows sit side by side, lined up at the canines (no hint). The reveal draws every tooth at that
       start and slides it to where the contact map puts it for this class (OD.fit; CUSP_GAME.draw sets the target
       transforms), then fades in the contact lines at the end positions. */
    var qf = reveal ? OD.quad(rd.cls, rd.side, { x0:o.x0, k:o.k, yMax:o.yMax, yMand:o.yMand, W:o.W, fit:true }) : null, lo = 1e9, hi = -1e9;
    if(qf) ['max', 'mand'].forEach(function(a){ OD.ORDER.forEach(function(t){ var tt = qf[a].teeth[t]; lo = Math.min(lo, tt.x); hi = Math.max(hi, tt.x + tt.w); }); });
    var shiftAll = qf ? (lo < 40 ? 40 - lo : hi > 474 ? 474 - hi : 0) : 0;
    function mv(a, t){ return qf ? OD.f1(qf[a].teeth[t].x - q[a].teeth[t].x) : '0'; }
    function grp(a, t, inner){ return '<g class="cg-t" data-to="' + mv(a, t) + '" style="transform:translateX(0px)">' + inner + '</g>'; }
    var teeth = '', hots = { max:'', mand:'' }, s = '';
    ['max', 'mand'].forEach(function(a){
      var r = q[a], below = a === 'mand', yy = null;
      OD.ORDER.forEach(function(t){ var tt = r.teeth[t], v = below ? tt.y + tt.h + 15 : tt.y - 6; yy = yy == null ? v : below ? Math.max(yy, v) : Math.min(yy, v); });
      OD.ORDER.forEach(function(t){
        var tt = r.teeth[t], h = '';
        teeth += grp(a, t, tt.svg + OD.txt(tt.cx, yy, '#' + tt.num, 'fg-t sm od-num', 'middle'));
        if(t === 'C' || a !== to) return;
        Object.keys(OD.SPEC[(a === 'max' ? 'max' : 'man') + t].fossae).forEach(function(f){
          var p = tt.pt[f], ok = t === c[3] && (f === c[4] || f === c[5]), chosen = rd.tap && rd.tap.t === t && rd.tap.f === f && rd.tap.a === a;
          h += '<circle class="cg-hot' + (rd.done ? (ok ? ' ok' : chosen ? ' bad' : '') : '') + '" data-cg-hot="' + a + ':' + t + ':' + f + '" cx="' + OD.f1(p[0]) + '" cy="' + OD.f1(p[1]) + '" r="11" tabindex="' + (rd.done ? -1 : 0) + '" role="button" aria-label="' + escHtml(fname(a, t, f, rd.side)) + '"/>';
        });
        hots[a] += grp(a, t, h);
      });
    });
    var sp = q[from].teeth[c[1]].pt[c[2]];
    var srcMark = grp(from, c[1], '<circle class="cg-src" cx="' + OD.f1(sp[0]) + '" cy="' + OD.f1(sp[1]) + '" r="9"/><circle class="cg-src-ring" cx="' + OD.f1(sp[0]) + '" cy="' + OD.f1(sp[1]) + '" r="15"/>');
    s += '<g class="cg-all" data-to="' + OD.f1(shiftAll) + '" style="transform:translateX(0px)">' + teeth + hots.mand + hots.max + srcMark;
    if(qf){ var hl = OD.CONTACTS[rd.cls].indexOf(c); s += '<g class="cg-lines">' + OD.contactLines(qf, rd.cls, { hl:hl }) + '</g>'; }
    s += '</g>';
    s += OD.txt(6, 76, 'Upper', 'fg-t sm') + OD.txt(6, 218, 'Lower', 'fg-t sm');
    return '<svg class="cg-svg" viewBox="0 0 480 280" role="img" aria-label="Upper and lower posterior teeth, occlusal views">' + s + '</svg>';
  }
  function contactExplain(rd){
    var c = rd.c, cls = rd.cls, from = c[0], to = from === 'mand' ? 'max' : 'mand';
    var right = fname(to, c[3], c[4], rd.side) + (c[5] ? ' (or as far back as the ' + OD.FOSSA_NAME[c[5]] + ': the help sheet calls this posterior contact "highly variable")' : '');
    var why = '';
    if(c[3].indexOf('PM') === 0) why = cls === 2 ? 'Class II flips the premolar rule: upper premolars take contacts in their DISTAL fossae, lower premolars in their MESIAL fossae.' : 'Class I and III premolars: upper contacts in the MESIAL fossae, lower contacts in the DISTAL fossae.';
    else why = 'Molars have an anterior and a posterior opposing contact. ' + (cls === 1 ? 'Anchor on the first molar\'s posterior contact (the DB cusp of #30 on #3) and step from there.' : cls === 2 ? 'In Class II everything steps back one post from Class I.' : 'In Class III everything comes forward one post from Class I.');
    return 'The <b>' + escHtml(cname(from, c[1], c[2], rd.side)) + '</b> lands in the <b>' + escHtml(right) + '</b>. ' + why + ' The fence post only shows which cusp comes closest; the anatomy (cusp-fossa) names the spot.';
  }
  /* ---- movements ---- */
  var MOVES = [['P','Protrusive'],['W','Working (laterotrusive)'],['NW','Non-working (mediotrusive)'],['R','Retrusive']];
  function newMove(){
    var arch = Math.random() < .5 ? 'max' : 'mand', side = Math.random() < .6 ? 'R' : 'L';
    /* a Class I contact landing on this arch */
    var list = OD.CONTACTS[1].filter(function(c){ return (c[0] === 'mand') === (arch === 'max') && c[3].indexOf('M') === 0; });
    var c = pick(list), mv = pick(['P','W','NW','R','P','W','NW']);
    return { mode:'moves', arch:arch, side:side, c:c, mv:mv, step:1, done:false };
  }
  function moveVec(arch, mv){
    /* tooth-relative unit vector [mesial+, buccal+] for the opposing cusp's path */
    var s15 = Math.sin(15 * Math.PI / 180), c15 = Math.cos(15 * Math.PI / 180), r = Math.SQRT1_2;
    if(arch === 'max') return { P:[1,0], W:[s15,c15], NW:[r,-r], R:[-.42,0] }[mv];
    return { P:[-1,0], W:[-s15,-c15], NW:[-r,r], R:[.42,0] }[mv];
  }
  function moveSVG(rd){
    var arch = rd.arch, key = (arch === 'max' ? 'max' : 'man') + rd.c[3], mirror = rd.side === 'L';
    var t = OD.tooth(key, { x:110, y:60, k:16, flip:arch === 'mand', mirror:mirror }), b = t.pt[rd.c[4]];
    var v = moveVec(arch, rd.mv), mx = mirror ? 1 : -1, by = arch === 'max' ? -1 : 1, L = 96;
    var e = [b[0] + v[0] * mx * L, b[1] + v[1] * by * L];
    var s = t.svg + '<circle class="od-ghost" cx="' + OD.f1(b[0]) + '" cy="' + OD.f1(b[1]) + '" r="11"/>' + OD.arrowC(b[0], b[1], e[0], e[1], 'fg-acc', 12) + '<circle class="fg-dot od-mip" cx="' + OD.f1(b[0]) + '" cy="' + OD.f1(b[1]) + '" r="5"/>';
    var top = arch === 'max' ? 'BUCCAL' : 'LINGUAL', bot = arch === 'max' ? 'PALATAL' : 'BUCCAL';
    s += OD.txt(t.cx, 34, top, 'fg-t', 'middle') + OD.txt(t.cx, 60 + t.h + 26, bot, 'fg-t', 'middle');
    s += OD.txt(mirror ? t.x + t.w + 14 : 8, t.cy + 4, 'MESIAL', 'fg-t sm') + OD.txt(mirror ? 8 : t.x + t.w + 14, t.cy + 4, 'DISTAL', 'fg-t sm');
    s += OD.txt(t.cx, 16, '#' + OD.NUMS[arch][rd.side][rd.c[3]] + ' (' + (arch === 'max' ? 'maxillary ' : 'mandibular ') + (rd.side === 'R' ? 'right ' : 'left ') + OD.TOOTH_NAME[rd.c[3]] + '), occlusal view', 'fg-t sm', 'middle');
    return '<svg class="cg-svg" viewBox="0 0 420 ' + OD.f1(60 + t.h + 40) + '" role="img" aria-label="Occlusal view of one tooth with a cusp pathway arrow">' + s + '</svg>';
  }
  function cuspChoices(rd){
    var c = rd.c, from = c[0], side = rd.side, right = cname(from, c[1], c[2], side);
    var pool = [];
    OD.CONTACTS[1].forEach(function(x){ if(x[0] === from && x.join() !== c.join()) pool.push(cname(from, x[1], x[2], side)); });
    /* a non-centric cusp of the same opposing tooth is the classic trap */
    var nonCentric = from === 'mand' ? (c[1].indexOf('M') === 0 ? 'ML' : 'L') : (c[1].indexOf('M') === 0 ? 'MB' : 'B');
    var opts = [right, cname(from, c[1], nonCentric, side)];
    pool = shuffled(pool.filter(function(p){ return opts.indexOf(p) === -1; }));
    while(opts.length < 4 && pool.length) opts.push(pool.shift());
    return { right:right, opts:shuffled(opts) };
  }
  function moveExplain(rd){
    var nm = MOVES.filter(function(m){ return m[0] === rd.mv; })[0][1];
    var rule = rd.arch === 'max' ? 'On an UPPER tooth you watch a lower cusp: protrusive runs mesial, working toward buccal (leaning a little mesial), non-working mesiopalatal, retrusive a short way distal.'
                                 : 'On a LOWER tooth you watch an upper cusp, so it all reverses: protrusive runs distal, working toward lingual (leaning a little distal), non-working distobuccal, retrusive a short way mesial.';
    return '<b>' + nm + '</b>, made by the <b>' + escHtml(cname(rd.c[0], rd.c[1], rd.c[2], rd.side)) + '</b> (in MIP it sits in the ' + escHtml(fname(rd.arch, rd.c[3], rd.c[4], rd.side)) + ', the base of the arrow). ' + rule;
  }
  /* ---- shell ---- */
  function start(mode){ st = { mode:mode, n:0, score:0, streak:0, rd:null, last:null }; next(); }
  function next(){ st.n++; st.rd = st.mode === 'contacts' ? newContact() : newMove(); if(st.rd.mode === 'moves') st.rd.choices = cuspChoices(st.rd); draw(); }
  function finish(){
    var b = best(); b.plays = (b.plays || 0) + 1; var isBest = st.score > (b.best[st.mode] || 0); if(isBest) b.best[st.mode] = st.score; saveState();
    host.innerHTML = '<div class="cg-card cg-end"><div class="cg-head"><b>What cusp hits where?</b><button type="button" class="cg-x" data-cg="close" aria-label="Close the game">' + '&times;' + '</button></div>' +
      '<p class="cg-big">' + st.score + ' / ' + R + '</p><p>' + (isBest ? 'New best for ' + (st.mode === 'contacts' ? 'Contacts' : 'Movements') + '.' : 'Best: ' + b.best[st.mode] + ' / ' + R + '.') + ' ' +
      (st.score >= 9 ? 'Board-ready.' : st.score >= 6 ? 'Solid. One more round locks it in.' : 'Open the fence post in the L1 notes, then try again.') + '</p>' +
      '<div class="cg-btns"><button type="button" class="btn primary" data-cg="again">Play again</button><button type="button" class="btn" data-cg="' + (st.mode === 'contacts' ? 'moves' : 'contacts') + '">Try ' + (st.mode === 'contacts' ? 'Movements' : 'Contacts') + '</button></div></div>';
  }
  function draw(){
    var rd = st.rd, h = '<div class="cg-card" data-cg-mode="' + st.mode + '"><div class="cg-head"><b>What cusp hits where?</b><span class="cg-meta">Round ' + st.n + ' / ' + R + ' · ' + st.score + ' right' + (st.streak >= 3 ? ' · ' + st.streak + ' in a row' : '') + '</span><button type="button" class="cg-x" data-cg="close" aria-label="Close the game">' + '&times;' + '</button></div>';
    if(rd.mode === 'contacts'){
      var c = rd.c;
      h += '<p class="cg-q"><span class="cg-tag">Class ' + OD.ROMAN[rd.cls] + ' · cusp-fossa</span> Where does the <b>' + escHtml(cname(c[0], c[1], c[2], rd.side)) + '</b> land? <span class="cg-sub">Tap the fossa on the ' + (c[0] === 'mand' ? 'upper' : 'lower') + ' teeth.</span></p>';
      h += '<div class="cg-stage">' + contactSVG(rd, rd.done) + '</div>';
      if(!rd.done) h += '<div class="cg-btns"><button type="button" class="btn" data-cg="hint" aria-expanded="' + (!!rd.hint) + '">' + (rd.hint ? 'Hide' : 'Show') + ' the Class ' + OD.ROMAN[rd.cls] + ' fence post</button></div>' + (rd.hint ? '<div class="cg-fp">' + OD.fencePostSVG(rd.cls, { u:40 }) + '</div>' : '');
      else h += '<div class="cg-fb ' + (rd.ok ? 'ok' : 'bad') + '"><b>' + (rd.ok ? 'Right.' : 'Not quite.') + '</b> ' + contactExplain(rd) + '</div><div class="cg-fp">' + OD.fencePostSVG(rd.cls, { u:40, hl:{ mand:c[0] === 'mand' ? fpUnit(c[1], c[2]) : null }, hlMax:c[0] === 'max' ? [fpUnit(c[1], c[2])] : [] }) + '</div>';
    } else {
      h += '<p class="cg-q"><span class="cg-tag">' + (rd.step === 1 ? 'Step 1 of 2' : 'Step 2 of 2') + '</span> ' + (rd.step === 1 ? 'Which movement does this arrow show?' : 'Which cusp makes this path?') + ' <span class="cg-sub">Class I. The MIP contact is at the base of the arrow.</span></p>';
      h += '<div class="cg-stage">' + moveSVG(rd) + '</div><div class="cg-opts">';
      if(rd.step === 1) h += MOVES.map(function(m){ var cls = rd.mvPick ? (m[0] === rd.mv ? ' ok' : m[0] === rd.mvPick ? ' bad' : '') : ''; return '<button type="button" class="qcard-choice' + cls + '" data-cg-mv="' + m[0] + '"' + (rd.mvPick ? ' disabled' : '') + '>' + m[1] + '</button>'; }).join('');
      else h += rd.choices.opts.map(function(o){ var cls = rd.cPick ? (o === rd.choices.right ? ' ok' : o === rd.cPick ? ' bad' : '') : ''; return '<button type="button" class="qcard-choice' + cls + '" data-cg-cusp="' + escHtml(o) + '"' + (rd.cPick ? ' disabled' : '') + '>' + escHtml(o) + '</button>'; }).join('');
      h += '</div>';
      if(rd.step === 1 && rd.mvPick) h += '<div class="cg-fb ' + (rd.mvPick === rd.mv ? 'ok' : 'bad') + '"><b>' + (rd.mvPick === rd.mv ? 'Right movement.' : 'Not that one.') + '</b> Now the cusp.</div>';
      if(rd.done){
        /* the round needs both steps; say which one missed, so a right cusp after a wrong movement doesn't read as marked wrong (report #28) */
        var mvOk = rd.mvPick === rd.mv, cOk = rd.cPick === rd.choices.right, mvName = function(k){ return MOVES.filter(function(m){ return m[0] === k; })[0][1]; };
        var verdict = rd.ok ? 'Both right.' : cOk ? 'Right cusp, but step 1 missed.' : mvOk ? 'Right movement, wrong cusp.' : 'Both missed.';
        var why = !mvOk ? ' The arrow shows <b>' + mvName(rd.mv) + '</b>, not ' + mvName(rd.mvPick) + '; a round counts when both steps are right.' : '';
        h += '<div class="cg-fb ' + (rd.ok ? 'ok' : 'bad') + '"><b>' + verdict + '</b>' + why + ' ' + moveExplain(rd) + '</div>';
      }
    }
    if(rd.done || (rd.mode === 'moves' && rd.step === 1 && rd.mvPick)) h += '<div class="cg-btns"><button type="button" class="btn primary" data-cg="' + (rd.mode === 'moves' && !rd.done ? 'step2' : 'next') + '">' + (rd.mode === 'moves' && !rd.done ? 'Next: the cusp' : st.n >= R ? 'See my score' : 'Next round') + '</button></div>';
    h += '</div>';
    host.innerHTML = h;
    var moving = host.querySelectorAll('.cg-svg [data-to]');
    if(moving.length) requestAnimationFrame(function(){ requestAnimationFrame(function(){ moving.forEach(function(g){ g.style.transform = 'translateX(' + g.getAttribute('data-to') + 'px)'; }); }); });
    var f = host.querySelector(rd.done ? '[data-cg="next"]' : rd.mode === 'contacts' ? '.cg-hot:not(.off)' : 'button:not([disabled])');
    if(f && st.focus){ try{ f.focus({ preventScroll:true }); }catch(e){} }
  }
  function fpUnit(t, c){ if(t === 'PM1') return 'P1'; if(t === 'PM2') return 'P2'; return (c === 'MB' || c === 'ML' ? 'm-' : 'd-') + t; }
  function grade(ok){ if(ok){ st.score++; st.streak++; } else st.streak = 0; }
  function onClick(e){
    var hot = e.target.closest('[data-cg-hot]'), btn = e.target.closest('[data-cg],[data-cg-mv],[data-cg-cusp]');
    if(!st && !btn) return;
    st && (st.focus = e.detail === 0);
    if(hot && st && st.rd.mode === 'contacts' && !st.rd.done && !hot.classList.contains('off')){
      var p = hot.getAttribute('data-cg-hot').split(':'), c = st.rd.c, to = c[0] === 'mand' ? 'max' : 'mand';
      st.rd.tap = { a:p[0], t:p[1], f:p[2] }; st.rd.ok = p[0] === to && p[1] === c[3] && (p[2] === c[4] || p[2] === c[5]); st.rd.done = true; grade(st.rd.ok); draw(); return;
    }
    if(!btn) return;
    var a = btn.getAttribute('data-cg');
    if(a === 'contacts' || a === 'moves'){ open(a); return; }
    if(a === 'close'){ st = null; renderLauncher(); return; }
    if(a === 'again'){ start(st.mode); return; }
    if(a === 'hint'){ st.rd.hint = !st.rd.hint; draw(); return; }
    if(a === 'next'){ if(st.n >= R) finish(); else next(); return; }
    if(a === 'step2'){ st.rd.step = 2; draw(); return; }
    if(btn.hasAttribute('data-cg-mv') && !st.rd.mvPick){ st.rd.mvPick = btn.getAttribute('data-cg-mv'); draw(); return; }
    if(btn.hasAttribute('data-cg-cusp') && !st.rd.cPick){ st.rd.cPick = btn.getAttribute('data-cg-cusp'); st.rd.ok = st.rd.mvPick === st.rd.mv && st.rd.cPick === st.rd.choices.right; st.rd.done = true; grade(st.rd.ok); draw(); }
  }
  function onKey(e){ var hot = e.target.closest && e.target.closest('[data-cg-hot]'); if(hot && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); hot.dispatchEvent(new MouseEvent('click', { bubbles:true })); } }
  function renderLauncher(){
    if(!host) return; var b = best();
    host.innerHTML = '<div class="cg-launch"><div class="cg-launch-t"><b>What cusp hits where?</b><span>Dr. Givan\'s help-sheet questions as a quick game: tap where a cusp lands (Class I, II and III), or name the movement and cusp in a pathway picture. 10 rounds.' +
      ((b.best.contacts || b.best.moves) ? ' Your best: Contacts ' + (b.best.contacts || 0) + '/10, Movements ' + (b.best.moves || 0) + '/10.' : '') + '</span></div>' +
      '<div class="cg-btns"><button type="button" class="btn primary" data-cg="contacts">Play: Contacts</button><button type="button" class="btn" data-cg="moves">Play: Movements</button></div></div>';
  }
  function open(mode){ start(mode); if(host) host.scrollIntoView({ block:'nearest' }); }
  function mount(el){ host = el; if(!el.__cg){ el.__cg = true; el.addEventListener('click', onClick); el.addEventListener('keydown', onKey); } if(st) draw(); else renderLauncher(); }
  return { mount:mount, open:open };
})();
/* od:kit end */
