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
var OD = (function(){
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

/* ---------- FIGURES ----------
   A question with img:'<key>' draws the figure above its stem (figHTML) without its key; after answering, the
   explanation shows it again with the key open (figAfterHTML). imgAfter:true keeps it out of the question entirely.
   FIG_PLACE puts each figure inside the lecture notes next to the paragraph it explains. */
var FIGS = (function(){
  var A = OD.arrow, T = OD.txt, f1 = OD.f1, F = {};
  /* cusp pathways: on an upper tooth you watch a lower cusp (protrusive mesial, working buccal and a little mesial,
     non-working mesiopalatal, retrusive distal and short); on a lower tooth everything reverses. Arrow angles follow the
     help sheet's pathway pictures; the working path leans about 15 degrees toward the protrusive path. */
  function paths(arch){
    var max = arch === 'max', t = OD.tooth(max ? 'maxM1' : 'manM1', { x:96, y:max ? 52 : 58, k:max ? 18 : 16.5, flip:!max }), b = t.pt.c;
    var mes = -1, buc = max ? -1 : 1, s = '';
    var r15 = 15 * Math.PI / 180;
    var P = [b[0] + mes * (max ? 100 : -100), b[1]];
    var W = max ? [b[0] + mes * 104 * Math.sin(r15), b[1] + buc * 104 * Math.cos(r15)] : [b[0] - mes * 100 * Math.sin(r15), b[1] - buc * 100 * Math.cos(r15)];
    var NW = max ? [b[0] + mes * 80, b[1] - buc * 80] : [b[0] - mes * 78, b[1] + buc * 78];
    var R = [b[0] - (max ? mes : -mes) * 40, b[1]];
    s += t.svg;
    Object.keys(t.pt).forEach(function(c){ if(OD.CUSP_NAME[c] && c !== 'B' && c !== 'L') s += T(t.pt[c][0], t.pt[c][1] + 4, c, 'fg-t sm od-cl', 'middle'); });
    s += '<circle class="od-ghost" cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" r="11"/>';
    /* the opposing cusp's name sits in the one quadrant no arrow crosses (below-right on #3, below-left on #30) */
    s += T(b[0] + (max ? 15 : -15), b[1] + 27, max ? 'DB of #30' : 'ML of #3', 'fg-t sm od-onT fg-hint', max ? 'start' : 'end');
    s += OD.arrowC(b[0], b[1], P[0], P[1], 'fg-acc', 11) + OD.arrowC(b[0], b[1], W[0], W[1], 'fg-acc', 11) + OD.arrowC(b[0], b[1], NW[0], NW[1], 'fg-acc', 11) + OD.arrowC(b[0], b[1], R[0], R[1], 'fg-acc', 11);
    s += '<circle class="fg-dot od-mip" cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" r="5"/>';
    function lab(p, l, dx, dy){ return OD.pin(p[0] + dx, p[1] + dy, l); }
    s += lab(P, 'A', max ? -13 : 13, -14) + lab(W, 'B', max ? -16 : 16, max ? -6 : 6) + lab(NW, 'C', max ? -12 : 12, max ? 12 : -12) + lab(R, 'D', max ? 14 : -14, -14);
    var top = max ? 'BUCCAL' : 'LINGUAL', bot = max ? 'PALATAL' : 'BUCCAL';
    s += T(t.cx, 22, top, 'fg-t', 'middle') + T(t.cx, (max ? 52 + t.h : 58 + t.h) + 28, bot, 'fg-t', 'middle') +
      T(8, t.cy + 4, 'MESIAL', 'fg-t sm') + T(t.x + t.w + 26, t.cy + 4, 'DISTAL', 'fg-t sm');
    return '<svg viewBox="0 0 380 ' + f1((max ? 52 : 58) + t.h + 40) + '" role="img" aria-label="' + (max ? 'Maxillary right first molar #3' : 'Mandibular right first molar #30') + ', occlusal view, with cusp pathway arrows A to D">' + s + '</svg>';
  }
  F.pathMax = { title:'Cusp pathways on #3 (maxillary right first molar)',
    caption:'Occlusal view, buccal at the top, mesial at the left. The dot is the MIP contact: the distobuccal cusp of #30 sitting in the central fossa (Class I). Each arrow is the path that lower cusp takes across #3 in one movement; the MIP contact is at the BASE of the arrow (help sheet). Retrusion is only about a millimeter, so its arrow is short.',
    svg: paths('max'), key:[['A','Protrusive: toward mesial'],['B','Laterotrusive (working): toward buccal, leaning a little mesial'],['C','Mediotrusive (non-working): toward mesiopalatal'],['D','Retrusive: toward distal (short)']] };
  F.pathMand = { title:'Cusp pathways on #30 (mandibular right first molar)',
    caption:'Occlusal view, lingual at the top, buccal at the bottom, mesial at the left (the help sheet\'s layout for lower teeth). The dot is the MIP contact: the mesiolingual cusp of #3 in the central fossa. On a LOWER tooth you watch an UPPER cusp, so every path reverses: "if I\'m looking at the mandibular arch and the mandible is sliding forward, the contacts are going toward the posterior."',
    svg: paths('mand'), key:[['A','Protrusive: toward distal'],['B','Laterotrusive (working): toward lingual, leaning a little distal'],['C','Mediotrusive (non-working): toward distobuccal'],['D','Retrusive: toward mesial (short)']] };

  /* frontal section of the right first molars in MIP (help sheet "Draw this"): buccal on the left. The anima figure
     `interferences` copies these two outlines. Each colored incline is the crown outline itself between two of its points
     (the same Catmull-Rom spline as OD.smooth), so it lies exactly on the crown; numbers sit inside the crown that owns
     the incline. Labels on the teeth use the tooth ink (od-onT), which doesn't change with the theme. */
  (function(){
    var mx = [[96,8],[84,34],[72,72],[78,112],[90,142],[101,160],[126,150],[150,128],[176,146],[204,170],[234,160],[256,128],[266,86],[258,44],[244,8]];
    var md = [[132,318],[118,286],[104,242],[106,200],[118,172],[130,156],[150,136],[178,160],[205,178],[232,160],[262,140],[276,160],[282,204],[276,252],[262,288],[252,318]];
    function along(pts, i, j, cls){
      var n = pts.length, d = 'M' + pts[i][0] + ' ' + pts[i][1];
      for(var a = i; a < j; a++){
        var p0 = pts[(a - 1 + n) % n], p1 = pts[a], p2 = pts[(a + 1) % n], p3 = pts[(a + 2) % n];
        d += ' C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + p2[0] + ' ' + p2[1];
      }
      return '<path class="' + cls + '" d="' + d + '"/>';
    }
    function lab2(x, y, a, b){ return T(x, y, a, 'fg-t sm od-onT', 'middle') + T(x, y + 12, b, 'fg-t sm od-onT', 'middle'); }
    var s = '<path class="od-sec" d="' + OD.smooth(mx, true) + '"/><path class="od-sec low" d="' + OD.smooth(md, true) + '"/>' +
      '<path class="od-cej" d="M84 36 Q170 44 258 40"/><path class="od-cej" d="M118 286 Q190 278 262 288"/>' +
      along(mx, 5, 7, 'fg-incl max') + along(mx, 7, 9, 'fg-incl max') + along(mx, 9, 11, 'fg-incl max') +
      along(md, 4, 6, 'fg-incl mand') + along(md, 6, 8, 'fg-incl mand') + along(md, 8, 10, 'fg-incl mand') +
      OD.pin(186,135,'1') + OD.pin(222,152,'2') + OD.pin(170,172,'3') + OD.pin(140,165,'4') + OD.pin(118,134,'5') + OD.pin(240,172,'6') +
      lab2(104,98,'buccal','cusp') + lab2(220,98,'palatal','cusp') + lab2(146,214,'buccal','cusp') + lab2(242,214,'lingual','cusp') +
      T(270,26,'Maxillary #3','fg-t sm') + T(286,300,'Mandibular #30','fg-t sm') +
      T(2,174,'BUCCAL','fg-t sm') + T(2,188,'(cheek)','fg-t sm') + T(296,174,'LINGUAL','fg-t sm') + T(296,188,'(tongue)','fg-t sm');
    F.inclines = { title:'Right first molars in MIP, frontal section',
      caption:'Cut through #3 and #30 and seen from the front: buccal (cheek) on the left, lingual (tongue) on the right. Upper inclines are blue, lower inclines red. To find an interference, picture the LOWER tooth moving: toward the cheek in a right working move, toward the tongue when the right side is non-working (a left move).',
      svg:'<svg viewBox="0 0 380 324" role="img" aria-label="Frontal section of the right first molars with inclines numbered 1 to 6">' + s + '</svg>',
      key:[['1','Facial incline of the maxillary palatal cusp: its inner slope, facing the cheek'],['2','Lingual incline of the maxillary palatal cusp: its outer slope, facing the palate'],
        ['3','Lingual incline of the mandibular buccal cusp (inner slope)'],['4','Facial incline of the mandibular buccal cusp (outer slope)'],
        ['5','Lingual incline of the maxillary buccal cusp (inner slope)'],['6','Buccal incline of the mandibular lingual cusp (inner slope)'],
        ['Names','An incline is named for the side it faces, not for its cusp: so a palatal cusp has a facial incline'],
        ['1 + 3','Meet in a LEFT move, when the right side is non-working'],['2 + 6','Meet in a RIGHT move, when the right side is working'],
        ['4 + 5','Also in a right move: an interference, or group function if you wanted it']] };
  })();

  /* Posselt's envelope, sagittal. The anima figure `envelope` copies this outline and the A-F points. A to E is the hinge
     arc with the condyles seated (it keeps heading down and back), and the border turns forward at E, where translation
     starts, so E is the envelope's most posterior point. Not to scale: front to back is stretched. */
  F.envSag = { title:'Envelope of motion, sagittal view',
    caption:'Traced at the lower central incisor, patient facing right. Opening borders are set by ligaments and joint anatomy; the superior border by the teeth. Chewing happens in the small teardrop under MICP. Not to scale: front to back is stretched.',
    svg: '<svg viewBox="0 0 360 384" role="img" aria-label="Sagittal envelope of motion with points A to F">' +
      '<path class="fg-soft" d="M112 40 C92 72 98 118 118 124 C138 118 136 72 112 40Z"/>' +
      '<path class="fg-line" d="M90 60 L112 40 L160 72 L178 74 L196 64 L235 64"/>' +
      '<path class="fg-line" d="M90 60 C88 100 90 146 80 170 C90 230 104 296 130 340"/>' +
      '<path class="fg-line" d="M130 340 C220 300 270 190 235 64"/>' +
      '<text class="fg-t" x="262" y="16">Anterior</text>' + A(262, 24, 340, 24, 'fg-acc', 9) +
      '<text class="fg-t sm fg-hint" x="6" y="112">20-25 mm</text><text class="fg-t sm fg-hint" x="6" y="124">(rotation)</text><text class="fg-t fg-hint" x="150" y="374">40-60 mm opening</text>' +
      '<text class="fg-t sm fg-hint" x="196" y="56">superior contact border</text><text class="fg-t sm fg-hint" x="16" y="260">posterior</text><text class="fg-t sm fg-hint" x="16" y="272">opening</text><text class="fg-t sm fg-hint" x="16" y="284">border</text>' +
      '<text class="fg-t sm fg-hint" x="232" y="250">anterior</text><text class="fg-t sm fg-hint" x="232" y="262">opening</text><text class="fg-t sm fg-hint" x="232" y="274">border</text><text class="fg-t sm fg-hint" x="122" y="142">chewing</text>' +
      [[90,60],[112,40],[160,72],[235,64],[80,170],[130,340]].map(function(p){ return '<circle class="fg-dot od-pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3.6"/>'; }).join('') +
      OD.pin(76,60,'A') + OD.pin(112,22,'B') + OD.pin(160,92,'C') + OD.pin(252,72,'D') + OD.pin(64,172,'E') + OD.pin(130,358,'F') + '</svg>' , key:[['A','Centric relation (CR); a tooth contact here is centric occlusion (CO)'],['B','Maximum intercuspation (MICP), up and forward from CO'],['C','Incisors edge to edge, at the end of the anterior guidance'],['D','Maximum protrusion'],['E','End of pure rotation, about 20-25 mm'],['F','Maximum opening, about 40-60 mm (rotation plus translation)'],['A-E-F','Posterior opening border'],['F-D','Anterior opening border'],['A-B-C-D','Superior contact border (the teeth)']] };
  F.envHoriz = { title:'Envelope of motion, horizontal view',
    caption:'Seen from above at the incisor point, drawn as on Dr. Givan\'s slide: the patient faces the bottom of the page, so the patient\'s left is on your right. The top (back) apex is centric relation; the bottom (front) apex is maximum protrusion.',
    svg: '<svg viewBox="0 0 360 300" role="img" aria-label="Horizontal envelope of motion seen from above, anterior at the bottom, patient\'s left on the right, borders A to D">' +
      '<path class="fg-line" d="M180 50 L280 110 L180 240 L80 110 Z"/>' +
      '<circle class="fg-dot" cx="180" cy="50" r="5"/><text class="fg-t" x="192" y="38">CR</text><circle class="fg-dot" cx="180" cy="240" r="4"/>' +
      '<text class="fg-t" x="150" y="290">Anterior</text><text class="fg-t sm fg-hint" x="190" y="262">max protrusion</text>' +
      '<text class="fg-t" x="6" y="150">Patient&#8217;s</text><text class="fg-t" x="6" y="166">RIGHT</text>' +
      '<text class="fg-t" x="290" y="150">Patient&#8217;s</text><text class="fg-t" x="290" y="166">LEFT</text>' +
      OD.pin(242,64,'A') + OD.pin(248,188,'B') + OD.pin(112,188,'C') + OD.pin(118,64,'D') + '</svg>' , key:[['A','Left lateral'],['B','Left lateral with protrusion'],['C','Right lateral with protrusion'],['D','Right lateral']] };
  F.envFront = { title:'Envelope of motion, frontal view',
    caption:'Seen from the front, so the patient\'s left is on YOUR right; A to D run round the shape as Dr. Givan numbers them 1 to 4. The top point is the intercuspal position; PP, the postural position, sits about 2-4 mm below it.',
    svg: '<svg viewBox="0 0 360 330" role="img" aria-label="Frontal envelope of motion with borders A to D and PP">' +
      '<path class="fg-line" d="M180 40 L270 98 C268 180 230 250 180 296 C130 250 92 180 90 98 Z"/>' +
      '<circle class="fg-dot" cx="180" cy="40" r="5"/><text class="fg-t" x="192" y="34">ICP</text>' +
      '<circle class="fg-dot" cx="180" cy="56" r="4"/><text class="fg-t" x="180" y="82" text-anchor="middle">PP</text><text class="fg-t sm fg-hint" x="150" y="318">max opening</text>' +
      '<text class="fg-t" x="8" y="150">Patient&#8217;s</text><text class="fg-t" x="8" y="166">RIGHT</text><text class="fg-t" x="288" y="150">Patient&#8217;s</text><text class="fg-t" x="288" y="166">LEFT</text>' +
      OD.pin(238,58,'A') + OD.pin(268,206,'B') + OD.pin(92,206,'C') + OD.pin(122,58,'D') + '</svg>' , key:[['A','Left lateral superior'],['B','Left lateral opening'],['C','Right lateral opening'],['D','Right lateral superior'],['PP','Postural position, about 2-4 mm below MICP (not the clinical rest position, about 8 mm down)']] };
  F.fence = { title:'The fence post, Class I',
    caption:'Drawn the way the help sheet draws it, anterior at the left. Upper cusps are the V\'s, lower cusps the peaks; the posts mark where one tooth ends and the next begins. In Class I each lower cusp sits a half step in front (mesial) of its upper partner. It shows which cusp comes CLOSEST, not the anatomy: the questions are cusp-fossa.',
    svg: OD.fencePostSVG(1, { x0:29 }), key:[['Read it','Lower P2 points at the post between upper P1 and P2: by the premolar rule it lands in the MESIAL fossa of the upper second premolar (#29 on #4)'],['Class II','Lower row one post back'],['Class III','Lower row one post forward']] };
  return F;
})();
/* figures placed inside the notes: after the paragraph or heading whose text starts with `at` (both reading levels) */
var FIG_PLACE = {
  review: [
    { full:'Guidance and the goals of ideal occlusion', plain:'Guidance and the ideal', figs:['guidance'] },
    { full:'MIP, centric occlusion and centric relation', plain:'Three positions people confuse', figs:['crslide'] },
    { full:'What cusp hits where: the fence post', plain:'Which cusp hits where', end:true, widget:'cuspMap' },
    { full:'Help sheet method for interferences', plain:'To figure out which slopes touch', figs:['inclines'] },
    { full:'Help sheet method for interferences', plain:'To figure out which slopes touch', figs:['interferences'] },
    { full:'Cusp pathways:', plain:'To figure out which slopes touch', figs:['pathMax','pathMand','cuspmotion'] },
    { full:'The determinants of posterior morphology', plain:'How tall can back cusps be?', figs:['cuspheight'] },
    { full:'Sagittal view, tracing', plain:'The envelope of motion', end:true, figs:['envSag'] },
    { full:'Horizontal view (from above)', plain:'The envelope of motion', end:true, figs:['envHoriz','envFront'] },
    { full:'Horizontal view (from above)', plain:'The envelope of motion', end:true, figs:['envelope'] }
  ],
  applying: [
    { full:'Schemes and guidance', plain:'Guidance and MIP', figs:['guidance'] },
    { full:'Implants', plain:'Implants', figs:['implant'] }
  ],
  function: [
    { full:'Part 2: swallowing', plain:'Swallowing', figs:['swallow'] }
  ],
  anatomy: [
    { full:'The disc is attached front and back', plain:'The jaw joint', figs:['tmj'] },
    { full:'The exam slide: muscles for each movement', plain:'The exam chart', figs:['muscles'] }
  ],
  instruments: [
    { full:'The facebow transfer', plain:'The facebow', figs:['mounterr'] },
    { full:'Eccentric records and programming the articulator', plain:'Forward and side records', figs:['scirec', 'bennett'] },
    { full:'Fully adjustable articulators', plain:'Fully adjustable', figs:['hingearc'] }
  ],
  malocclusion: [
    { full:'How a functional disturbance develops', plain:'How a problem starts', figs:['tolerance'] },
    { full:'Orthopedic instability:', plain:'The catch:', figs:['stability'] },
    { full:'Full coverage covers all the teeth', plain:'An upper splint has a flat back surface', figs:['splints'] },
    { full:'The rule of thirds simplifies', plain:'Most irreversible dental work', figs:['thirds'] },
    { full:'Noncarious cervical lesions', plain:'Notches at the gumline', figs:['erosion'] }
  ],
  dentures: [
    { full:'Denture teeth are generally set near where the ridge is', plain:'How the bone shrinks.', figs:['resorb'] },
    { full:'Support, stability and retention', plain:'Support, stability and retention', figs:['ssr'] },
    { full:'Both balanced and non-balanced work well', plain:'The three setups', figs:['schemes'] },
    { full:'Tooth forms compared', plain:'Tooth shapes.', figs:['toothforms'] }
  ],
  nccl: [
    { full:'His analogy: push on a stop sign.', plain:'A push on the slope of a cusp', figs:['abfract'] },
    { full:'Cupped-out cusp tips.', plain:'Cavities are acid too', figs:['cupping'] },
    { full:'Vomiting (bulimia', plain:'Cavities are acid too', figs:['erosion9'] },
    { full:'pH and buffering capacity sound', plain:'Buffering capacity is how much saliva', figs:['buffer'] }
  ],
  occtrauma: [
    { full:'Why can a normal force', plain:'Primary: too much force', figs:['otsupport'] },
    { full:'A jiggling force comes from one side', plain:'A one-way (unilateral) push', figs:['otjiggle'] },
    { full:'Measuring it:', plain:'To check, rock the tooth', figs:['otmobility'] }
  ]
};
var FIG_BY_LEC = { review:['fence','envSag','envHoriz','envFront','pathMax','pathMand','cuspmotion','inclines','interferences','cuspheight','envelope','crslide','guidance'], applying:['guidance','implant'], function:['swallow'], anatomy:['tmj','muscles'], instruments:['mounterr','scirec','bennett','hingearc'], malocclusion:['tolerance','stability','splints','thirds','erosion'], dentures:['resorb','ssr','schemes','toothforms'], nccl:['abfract','cupping','erosion9','buffer'], occtrauma:['otsupport','otjiggle','otmobility'] };
/* fence post + contact map with Class I / II / III tabs (notes and Review) */
function cuspMapHTML(cls){
  cls = cls || 1;
  return '<figure class="fig-card cmap" data-cmap>' +
    '<h4>What cusp hits where: fence post and contacts</h4>' +
    '<div class="cmap-tabs" role="group" aria-label="Angle class">' + [1,2,3].map(function(c){ return '<button type="button" data-cmap-cls="'+c+'" aria-pressed="'+(c===cls)+'"'+(c===cls?' class="is-active"':'')+'>Class '+OD.ROMAN[c]+'</button>'; }).join('') + '</div>' +
    '<div class="cmap-svg">' + OD.contactMapSVG(cls, 'R') + '</div>' +
    '<p>' + CMAP_NOTE[cls] + '</p>' +
    '<p class="cmap-src">Cusp-fossa contacts in MIP for the right side, read off the help sheet\'s Class I, II and III fence posts. Each line joins a centric cusp to the fossa it sits in; red lines start on a lower cusp, blue on an upper one. A band on an upper molar is a posterior contact that can sit anywhere from the central fossa and oblique ridge back to the distal fossa. Real crowns don\'t follow the fence\'s equal steps, so a few molar lines lean. Want to drill it? Play "What cusp hits where?" at the top of the Question Bank.</p></figure>';
}
var CMAP_NOTE = {
  1:'<b>Class I.</b> Upper premolars take their contacts in the MESIAL fossae, lower premolars in the DISTAL fossae. Each molar has an anterior and a posterior contact; anchor on the first molar\'s posterior contact (the DB cusp of #30 on #3, anywhere from the central fossa and oblique ridge back to the distal fossa) and step back: the MB cusp of #31 goes to the mesial fossa of #2.',
  2:'<b>Class II</b> steps the lower row back one post, and the premolar rule flips: upper premolars take contacts in their DISTAL fossae, lower premolars in their MESIAL fossae. #29\'s buccal cusp lands in the distal fossa of #4, #30\'s MB cusp in the central fossa of #3, and #3\'s ML cusp in the mesial fossa of #30.',
  3:'<b>Class III</b> brings the lower row forward one post. The premolar rule is the same as Class I (upper mesial, lower distal), one tooth over: #29\'s buccal cusp lands in the mesial fossa of #5, #30\'s MB cusp in the mesial fossa of #4, and #3\'s ML cusp in the distal fossa of #30.'
};
function wireCuspMaps(root){
  if(!root || root.__cmap) return; root.__cmap = true;
  root.addEventListener('click', function(e){
    var b = e.target.closest('[data-cmap-cls]'); if(!b) return;
    var card = b.closest('[data-cmap]'), c = +b.getAttribute('data-cmap-cls');
    card.querySelectorAll('[data-cmap-cls]').forEach(function(x){ var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
    card.querySelector('.cmap-svg').innerHTML = OD.contactMapSVG(c, 'R');
    card.querySelector('p').innerHTML = CMAP_NOTE[c];
  });
}
