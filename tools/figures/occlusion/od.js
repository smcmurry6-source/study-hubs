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
    maxM1:  { md:10,  bl:11, out:[[.01,.1],[.2,0],[.38,.03],[.5,.07],[.66,.02],[.86,.05],[.96,.2],[1,.48],[.99,.74],[.92,.93],[.74,1],[.58,.94],[.38,1],[.18,.95],[.08,.76],[0,.42]],
              cusps:{ MB:[.26,.19,.17], DB:[.73,.21,.15], ML:[.34,.75,.21], DL:[.79,.8,.12] }, fossae:{ m:[.13,.44], c:[.45,.43], d:[.76,.6] },
              ridges:[[[.36,.72],[.55,.47],[.72,.24]]],
              grooves:[[[.13,.44],[.3,.47],[.45,.43]],[[.45,.43],[.5,.05]],[[.76,.6],[.66,.8],[.62,.97]],[[.76,.6],[.88,.48]]],
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
    manM1:  { md:11,  bl:10.5, out:[[.04,.12],[.18,0],[.34,.05],[.5,0],[.67,.06],[.84,.08],[.97,.22],[1,.5],[.97,.8],[.85,.97],[.68,1],[.47,.97],[.25,1],[.08,.9],[0,.6],[0,.34]],
              cusps:{ MB:[.18,.21,.15], DB:[.5,.19,.14], D:[.84,.27,.1], ML:[.24,.8,.16], DL:[.68,.8,.15] }, fossae:{ m:[.12,.5], c:[.46,.52], d:[.87,.52] },
              grooves:[[[.12,.5],[.3,.53],[.46,.52],[.67,.5],[.87,.52]],[[.3,.53],[.34,.05]],[[.67,.5],[.68,.06]],[[.46,.52],[.47,.97]]],
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
  /* one row of a quadrant. o = { x0, yc, k, gap (mm), W (full width, for mirroring), cls:{ type:'class' } } */
  function row(arch, side, o){
    var x = o.x0, teeth = {}, svg = '';
    ORDER.forEach(function(t){
      var key = (arch === 'max' ? 'max' : 'man') + t, s = SPEC[key], w = s.md * o.k, h = s.bl * o.k;
      var tx = side === 'L' ? o.W - x - w : x;
      var tt = tooth(key, { x:tx, y:o.yc - h / 2, k:o.k, flip:arch === 'mand', mirror:side === 'L', cls:(o.cls && o.cls[t]) || '' });
      tt.num = NUMS[arch][side][t]; tt.type = t; tt.arch = arch;
      teeth[t] = tt; svg += tt.svg;
      x += w + (o.gap == null ? .4 : o.gap) * o.k;
    });
    return { svg:svg, teeth:teeth, width:x - o.x0 };
  }
  /* Cusp-fossa contacts in MIP for the patient's right side, from the help sheet's Class I, II and III pictures:
     [cusp's arch, its tooth, cusp, opposing tooth, opposing fossa, also accepted]. "Also accepted" = the posterior contact
     on a maxillary molar, which the sheet calls "highly variable ... ranges from oblique ridge to distal fossa".
     Class III leaves out #28 (it meets the canine) and #2's lingual cusps (they meet #32). */
  var CONTACTS = {
    1: [ ['mand','PM1','B','PM1','m'], ['mand','PM2','B','PM2','m'], ['mand','M1','MB','M1','m'], ['mand','M1','DB','M1','c','d'], ['mand','M2','MB','M2','m'], ['mand','M2','DB','M2','c','d'],
         ['max','PM1','L','PM1','d'], ['max','PM2','L','PM2','d'], ['max','M1','ML','M1','c'], ['max','M1','DL','M1','d'], ['max','M2','ML','M2','c'], ['max','M2','DL','M2','d'] ],
    2: [ ['mand','PM1','B','PM1','d'], ['mand','PM2','B','PM2','d'], ['mand','M1','MB','M1','c'], ['mand','M1','DB','M1','d'], ['mand','M2','MB','M2','c'], ['mand','M2','DB','M2','d'],
         ['max','PM1','L','PM1','m'], ['max','PM2','L','PM2','m'], ['max','M1','ML','M1','m'], ['max','M1','DL','M1','c'], ['max','M2','ML','M2','m'], ['max','M2','DL','M2','c'] ],
    3: [ ['mand','PM2','B','PM1','m'], ['mand','M1','MB','PM2','m'], ['mand','M1','DB','M1','m'], ['mand','M2','MB','M1','c','d'], ['mand','M2','DB','M2','m'],
         ['max','PM1','L','PM2','d'], ['max','PM2','L','M1','m'], ['max','M1','ML','M1','d'], ['max','M1','DL','M2','c'] ]
  };
  var ROMAN = { 1:'I', 2:'II', 3:'III' };
  /* both rows with the lower row shifted to its class position (lines near vertical); returns the svg and geometry */
  function quad(cls, side, o){
    o = o || {}; var k = o.k || 8.5, W = o.W || 470, yMax = o.yMax || 70, yMand = o.yMand || 212;
    var mx = row('max', side, { x0:o.x0 || 30, yc:yMax, k:k, W:W, cls:o.clsMax });
    var md = row('mand', side, { x0:o.x0 || 30, yc:yMand, k:k, W:W, cls:o.clsMand });
    var dx = 0, n = 0;
    CONTACTS[cls].forEach(function(c){ if(c[0] !== 'mand') return; dx += mx.teeth[c[3]].pt[c[4]][0] - md.teeth[c[1]].pt[c[2]][0]; n++; });
    dx = n ? dx / n : 0;
    return { max:mx, mand:md, dx:dx, k:k, W:W, side:side };
  }
  function contactLines(q, cls, opts){
    opts = opts || {}; var s = '';
    CONTACTS[cls].forEach(function(c, i){
      var from = (c[0] === 'mand' ? q.mand : q.max).teeth[c[1]].pt[c[2]], to = (c[0] === 'mand' ? q.max : q.mand).teeth[c[3]].pt[c[4]];
      var fx = from[0] + (c[0] === 'mand' ? q.dx : 0), tx = to[0] + (c[0] === 'mand' ? 0 : q.dx);
      var on = opts.hl === i;
      s += '<path class="od-cline' + (c[0] === 'max' ? ' up' : '') + (on ? ' on' : '') + (opts.hl != null && !on ? ' dim' : '') + '" d="M' + f1(fx) + ' ' + f1(from[1]) + 'L' + f1(tx) + ' ' + f1(to[1]) + '"/>' +
        '<circle class="od-cdot' + (on ? ' on' : '') + '" cx="' + f1(fx) + '" cy="' + f1(from[1]) + '" r="3.4"/><circle class="od-cdot' + (on ? ' on' : '') + '" cx="' + f1(tx) + '" cy="' + f1(to[1]) + '" r="3.4"/>';
    });
    return s;
  }
  function numLabels(r, y, below){
    var s = ''; ORDER.forEach(function(t){ var tt = r.teeth[t]; s += txt(tt.cx, below ? tt.y + tt.h + 15 : tt.y - 6, '#' + tt.num, 'fg-t sm od-num', 'middle'); }); return s;
  }

  /* Fence post as the help sheet draws it: one zigzag; maxillary cusps are the V's (labels above), mandibular cusps the
     peaks (labels below); posts mark where one tooth ends and the next begins. Class II steps the lower row back one post,
     Class III brings it forward one. o = { u, x0, y, hl:{ mand:'P2' }, hlMax:['P1','P2'] } */
  var FP_UNITS = ['C', 'P1', 'P2', 'm-M1', 'd-M1', 'm-M2', 'd-M2'], FP_BOUND = [0, 1, 2, 3, 5, 7];
  function fencePost(cls, o){
    o = o || {}; var u = o.u || 46, yT = o.y || 44, amp = u * .52, x0 = o.x0 || 70;
    var sh = cls === 2 ? 1 : cls === 3 ? -1 : 0;
    var t0 = Math.min(-.5, sh - .5), t1 = Math.max(7.5, 7 + sh), pts = [];
    for(var t = t0; t <= t1 + 1e-6; t += .5) pts.push([x0 + t * u, Math.abs(t - Math.round(t)) < .01 ? yT : yT + amp]);
    var s = '<path class="fp-zig" d="M' + pts.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + '"/>';
    FP_BOUND.forEach(function(b){ var x = x0 + b * u; s += '<path class="fp-post" d="M' + f1(x) + ' ' + f1(yT) + 'L' + f1(x) + ' ' + f1(yT - amp * .9) + '"/>'; });
    FP_BOUND.forEach(function(b){ var x = x0 + (b + sh - .5) * u; s += '<path class="fp-post low" d="M' + f1(x) + ' ' + f1(yT + amp) + 'L' + f1(x) + ' ' + f1(yT + amp * 1.9) + '"/>'; });
    FP_UNITS.forEach(function(lab, i){ var on = (o.hlMax || []).indexOf(lab) > -1; s += txt(x0 + (i + .5) * u, yT + amp * .3, lab, 'fp-lab max' + (on ? ' on' : ''), 'middle'); });
    FP_UNITS.forEach(function(lab, j){ var x = x0 + (j + sh) * u, on = o.hl && o.hl.mand === lab;
      if(on) s += '<path class="fp-peak" d="M' + f1(x - u / 2) + ' ' + f1(yT + amp) + 'L' + f1(x) + ' ' + f1(yT) + 'L' + f1(x + u / 2) + ' ' + f1(yT + amp) + '"/>';
      s += txt(x, yT + amp * .92, lab, 'fp-lab mand' + (on ? ' on' : ''), 'middle'); });
    s += txt(x0 + t1 * u + 12, yT + amp * .3, 'Maxillary', 'fg-t sm', 'start') + txt(x0 + t1 * u + 12, yT + amp * .95, 'Mandibular', 'fg-t sm', 'start');
    return { svg:s, w:x0 + t1 * u + 96, h:yT + amp * 2 + 8, x0:x0, u:u };
  }
  function fencePostSVG(cls, o){ var f = fencePost(cls, o); return '<svg viewBox="0 0 ' + f1(f.w) + ' ' + f1(f.h) + '" role="img" aria-label="Fence post, Class ' + ROMAN[cls] + '">' + f.svg + '</svg>'; }
  /* the help sheet's contact map: fence post on top, the two rows below with every cusp-fossa contact drawn */
  function contactMapSVG(cls, side){
    var fp = fencePost(cls, { u:42, x0:66, y:36 });
    var top = fp.h + 14, q = quad(cls, side || 'R', { yMax:top + 60, yMand:top + 196 });
    var shift = Math.min(0, q.dx), W = Math.max(q.W, fp.w), H = top + 262;
    return '<svg viewBox="0 0 ' + f1(W) + ' ' + f1(H) + '" role="img" aria-label="Class ' + ROMAN[cls] + ' fence post and cusp-fossa contacts">' + fp.svg +
      '<g transform="translate(' + f1(-shift) + ' 0)">' + q.max.svg + numLabels(q.max, 0, false) +
      '<g transform="translate(' + f1(q.dx) + ' 0)">' + q.mand.svg + numLabels(q.mand, 0, true) + '</g>' + contactLines(q, cls) + '</g>' +
      txt(8, top + 64, 'Upper', 'fg-t sm') + txt(8, top + 200, 'Lower', 'fg-t sm') + '</svg>';
  }
  return { f1:f1, smooth:smooth, arrow:arrow, pin:pin, txt:txt, SPEC:SPEC, tooth:tooth, row:row, quad:quad, contactLines:contactLines, numLabels:numLabels,
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
    s += A(b[0], b[1], P[0], P[1], 'fg-acc', 11) + A(b[0], b[1], W[0], W[1], 'fg-acc', 11) + A(b[0], b[1], NW[0], NW[1], 'fg-acc', 11) + A(b[0], b[1], R[0], R[1], 'fg-acc', 11);
    s += '<circle class="fg-dot" cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" r="5"/>';
    function lab(p, l, dx, dy){ return OD.pin(p[0] + dx, p[1] + dy, l); }
    s += lab(P, 'A', max ? -13 : 13, max ? -14 : -14) + lab(W, 'B', max ? -16 : 16, max ? -6 : 6) + lab(NW, 'C', max ? -12 : 12, max ? 12 : -12) + lab(R, 'D', max ? 14 : -14, -14);
    var top = max ? 'BUCCAL' : 'LINGUAL', bot = max ? 'PALATAL' : 'BUCCAL';
    s += T(t.cx, 22, top, 'fg-t', 'middle') + T(t.cx, (max ? 52 + t.h : 58 + t.h) + 28, bot, 'fg-t', 'middle') +
      T(8, t.cy + 4, 'MESIAL', 'fg-t sm') + T(t.x + t.w + 26, t.cy + 4, 'DISTAL', 'fg-t sm');
    s += T(b[0] + 14, b[1] + 26, max ? 'DB of #30' : 'ML of #3', 'fg-t sm fg-hint');
    return '<svg viewBox="0 0 380 ' + f1((max ? 52 : 58) + t.h + 40) + '" role="img" aria-label="' + (max ? 'Maxillary right first molar #3' : 'Mandibular right first molar #30') + ', occlusal view, with cusp pathway arrows A to D">' + s + '</svg>';
  }
  F.pathMax = { title:'Cusp pathways on #3 (maxillary right first molar)',
    caption:'Occlusal view, buccal at the top, mesial at the left. The dot is the MIP contact: the distobuccal cusp of #30 sitting in the central fossa (Class I). Each arrow is the path that lower cusp takes across #3 in one movement; the MIP contact is at the BASE of the arrow (help sheet). Retrusion is only about a millimeter, so its arrow is short.',
    svg: paths('max'), key:[['A','Protrusive: toward mesial'],['B','Laterotrusive (working): toward buccal, leaning a little mesial'],['C','Mediotrusive (non-working): toward mesiopalatal'],['D','Retrusive: toward distal (short)']] };
  F.pathMand = { title:'Cusp pathways on #30 (mandibular right first molar)',
    caption:'Occlusal view, lingual at the top, buccal at the bottom, mesial at the left (the help sheet\'s layout for lower teeth). The dot is the MIP contact: the mesiolingual cusp of #3 in the central fossa. On a LOWER tooth you watch an UPPER cusp, so every path reverses: "if I\'m looking at the mandibular arch and the mandible is sliding forward, the contacts are going toward the posterior."',
    svg: paths('mand'), key:[['A','Protrusive: toward distal'],['B','Laterotrusive (working): toward lingual, leaning a little distal'],['C','Mediotrusive (non-working): toward distobuccal'],['D','Retrusive: toward mesial (short)']] };

  /* frontal section of the right first molars in MIP (help sheet "Draw this"): buccal on the left */
  (function(){
    var mx = [[96,8],[84,34],[72,72],[78,112],[90,142],[101,160],[126,150],[150,128],[176,146],[204,170],[234,160],[256,128],[266,86],[258,44],[244,8]];
    var md = [[132,318],[118,286],[104,242],[106,200],[118,172],[130,156],[150,136],[178,160],[205,178],[232,160],[262,140],[276,160],[282,204],[276,252],[262,288],[252,318]];
    function seg(a, b, cls){ return '<path class="' + cls + '" d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '"/>'; }
    var s = '<path class="od-sec" d="' + OD.smooth(mx, true) + '"/><path class="od-sec low" d="' + OD.smooth(md, true) + '"/>' +
      '<path class="od-cej" d="M84 36 Q170 44 258 40"/><path class="od-cej" d="M118 286 Q190 278 262 288"/>' +
      seg([150,128],[204,170],'fg-incl max') + seg([204,170],[252,124],'fg-incl max') + seg([101,160],[150,128],'fg-incl max') +
      seg([150,136],[205,178],'fg-incl mand') + seg([150,136],[110,190],'fg-incl mand') + seg([205,178],[262,140],'fg-incl mand') +
      OD.pin(188,141,'1') + OD.pin(219,137,'2') + OD.pin(173,169,'3') + OD.pin(147,159,'4') + OD.pin(118,133,'5') + OD.pin(241,170,'6') +
      T(88,108,'buccal','fg-t sm') + T(88,120,'cusp','fg-t sm') + T(212,86,'palatal','fg-t sm') + T(212,98,'cusp','fg-t sm') +
      T(118,232,'buccal','fg-t sm') + T(118,244,'cusp','fg-t sm') + T(222,232,'lingual','fg-t sm') + T(222,244,'cusp','fg-t sm') +
      T(270,26,'Maxillary #3','fg-t sm') + T(286,300,'Mandibular #30','fg-t sm') +
      T(2,178,'BUCCAL','fg-t sm') + T(296,178,'LINGUAL','fg-t sm') + T(296,192,'(tongue)','fg-t sm');
    F.inclines = { title:'Right first molars in MIP, frontal section',
      caption:'Cut through #3 and #30 and seen from the front: buccal (cheek) on the left, lingual (tongue) on the right. Upper inclines are blue, lower inclines red. To find an interference, picture the LOWER tooth moving: toward the cheek in a right working move, toward the tongue when the right side is non-working (a left move).',
      svg:'<svg viewBox="0 0 380 324" role="img" aria-label="Frontal section of the right first molars with inclines numbered 1 to 6">' + s + '</svg>' , key:[['1','Facial incline of the maxillary palatal cusp'],['2','Lingual incline of the maxillary palatal cusp'],['3','Lingual incline of the mandibular buccal cusp'],['4','Facial incline of the mandibular buccal cusp'],['5','Lingual incline of the maxillary buccal cusp'],['6','Buccal incline of the mandibular lingual cusp'],['Left move (right side non-working)','1 meets 3'],['Right move (working)','2 meets 6, and 4 meets 5 (an interference, or group function if you wanted it)']] };
  })();

  F.envSag = { title:'Envelope of motion, sagittal view',
    caption:'Traced at the lower central incisor, patient facing right. Opening borders are set by ligaments and joint anatomy; the superior border by the teeth. Chewing happens in the small teardrop under MICP.',
    svg: '<svg viewBox="0 0 360 384" role="img" aria-label="Sagittal envelope of motion with points A to F">' +
      '<path class="fg-soft" d="M112 40 C92 72 98 118 118 124 C138 118 136 72 112 40Z"/>' +
      '<path class="fg-line" d="M90 60 L112 40 L160 72 L178 74 L196 64 L235 64"/>' +
      '<path class="fg-line" d="M90 60 C80 100 76 140 80 170 C86 240 104 300 130 340"/>' +
      '<path class="fg-line" d="M130 340 C220 300 270 190 235 64"/>' +
      '<text class="fg-t" x="262" y="16">Anterior</text>' + A(262, 24, 340, 24, 'fg-acc', 9) +
      '<text class="fg-t sm" x="6" y="112">20-25 mm</text><text class="fg-t sm" x="6" y="124">(rotation)</text><text class="fg-t" x="150" y="374">40-60 mm opening</text>' +
      '<text class="fg-t sm fg-hint" x="196" y="56">superior contact border</text><text class="fg-t sm fg-hint" x="16" y="260">posterior</text><text class="fg-t sm fg-hint" x="16" y="272">opening</text><text class="fg-t sm fg-hint" x="16" y="284">border</text>' +
      '<text class="fg-t sm fg-hint" x="232" y="250">anterior</text><text class="fg-t sm fg-hint" x="232" y="262">opening</text><text class="fg-t sm fg-hint" x="232" y="274">border</text><text class="fg-t sm fg-hint" x="122" y="142">chewing</text>' +
      OD.pin(76,60,'A') + OD.pin(112,22,'B') + OD.pin(160,92,'C') + OD.pin(252,72,'D') + OD.pin(64,172,'E') + OD.pin(130,358,'F') + '</svg>' , key:[['A','Centric relation (CR); a tooth contact here is centric occlusion (CO)'],['B','Maximum intercuspation (MICP), up and forward from CO'],['C','Incisors edge to edge, at the end of the anterior guidance'],['D','Maximum protrusion'],['E','End of pure rotation, about 20-25 mm'],['F','Maximum opening, about 40-60 mm (rotation plus translation)'],['A-E-F','Posterior opening border'],['F-D','Anterior opening border'],['A-B-C-D','Superior contact border (the teeth)']] };
  F.envHoriz = { title:'Envelope of motion, horizontal view',
    caption:'Seen from above at the incisor point, anterior at the top, so the patient\'s left is on your left. The back apex is centric relation; the front apex is maximum protrusion.',
    svg: '<svg viewBox="0 0 360 300" role="img" aria-label="Horizontal envelope of motion with borders A to D">' +
      '<path class="fg-line" d="M180 250 L80 190 L180 60 L280 190 Z"/>' +
      '<circle class="fg-dot" cx="180" cy="250" r="5"/><text class="fg-t" x="192" y="272">CR</text><circle class="fg-dot" cx="180" cy="60" r="4"/>' +
      '<text class="fg-t" x="150" y="40">Anterior</text><text class="fg-t sm fg-hint" x="190" y="58">max protrusion</text>' +
      '<text class="fg-t" x="6" y="150">Patient&#8217;s</text><text class="fg-t" x="6" y="166">LEFT</text>' +
      '<text class="fg-t" x="290" y="150">Patient&#8217;s</text><text class="fg-t" x="290" y="166">RIGHT</text>' +
      OD.pin(118,236,'A') + OD.pin(112,112,'B') + OD.pin(248,112,'C') + OD.pin(242,236,'D') + '</svg>' , key:[['A','Left lateral'],['B','Left lateral with protrusion'],['C','Right lateral with protrusion'],['D','Right lateral']] };
  F.envFront = { title:'Envelope of motion, frontal view',
    caption:'Seen from the front, so the patient\'s left is on YOUR right. The top point is the intercuspal position; PP, the postural position, sits about 2-4 mm below it.',
    svg: '<svg viewBox="0 0 360 330" role="img" aria-label="Frontal envelope of motion with borders A to D and PP">' +
      '<path class="fg-line" d="M180 40 L270 98 C268 180 230 250 180 296 C130 250 92 180 90 98 Z"/>' +
      '<circle class="fg-dot" cx="180" cy="40" r="5"/><text class="fg-t" x="192" y="34">ICP</text>' +
      '<circle class="fg-dot" cx="180" cy="56" r="4"/><text class="fg-t" x="190" y="66">PP</text><text class="fg-t sm fg-hint" x="150" y="318">max opening</text>' +
      '<text class="fg-t" x="8" y="150">Patient&#8217;s</text><text class="fg-t" x="8" y="166">RIGHT</text><text class="fg-t" x="288" y="150">Patient&#8217;s</text><text class="fg-t" x="288" y="166">LEFT</text>' +
      OD.pin(238,58,'A') + OD.pin(268,206,'B') + OD.pin(122,58,'C') + OD.pin(92,206,'D') + '</svg>' , key:[['A','Left lateral superior'],['B','Left lateral opening'],['C','Right lateral superior'],['D','Right lateral opening'],['PP','Postural position, about 2-4 mm below MICP (not the clinical rest position, about 8 mm down)']] };
  F.fence = { title:'The fence post, Class I',
    caption:'Drawn the way the help sheet draws it, anterior at the left. Upper cusps are the V\'s, lower cusps the peaks; the posts mark where one tooth ends and the next begins. In Class I each lower cusp sits a half step in front (mesial) of its upper partner. It shows which cusp comes CLOSEST, not the anatomy: the questions are cusp-fossa.',
    svg: OD.fencePostSVG(1), key:[['Read it','Lower P2 points at the post between upper P1 and P2: by the premolar rule it lands in the MESIAL fossa of the upper second premolar (#29 on #4)'],['Class II','Lower row one post back'],['Class III','Lower row one post forward']] };
  return F;
})();
/* figures placed inside the notes: after the paragraph or heading whose text starts with `at` (both reading levels) */
var FIG_PLACE = {
  review: [
    { full:'What cusp hits where: the fence post', plain:'Which cusp hits where', end:true, widget:'cuspMap' },
    { full:'Help sheet method for interferences', plain:'To figure out which slopes touch', figs:['inclines'] },
    { full:'Cusp pathways:', plain:'To figure out which slopes touch', figs:['pathMax','pathMand','cuspmotion'] },
    { full:'Sagittal view, tracing', plain:'The envelope of motion', end:true, figs:['envSag'] },
    { full:'Horizontal view (from above)', plain:'The envelope of motion', end:true, figs:['envHoriz','envFront'] }
  ],
  anatomy: [
    { full:'The disc is attached front and back', plain:'The jaw joint', figs:['tmj'] }
  ]
};
var FIG_BY_LEC = { review:['fence','envSag','envHoriz','envFront','pathMax','pathMand','cuspmotion','inclines'], anatomy:['tmj'] };
/* fence post + contact map with Class I / II / III tabs (notes and Review) */
function cuspMapHTML(cls){
  cls = cls || 1;
  return '<figure class="fig-card cmap" data-cmap>' +
    '<h4>What cusp hits where: fence post and contacts</h4>' +
    '<div class="cmap-tabs" role="group" aria-label="Angle class">' + [1,2,3].map(function(c){ return '<button type="button" data-cmap-cls="'+c+'" aria-pressed="'+(c===cls)+'"'+(c===cls?' class="is-active"':'')+'>Class '+OD.ROMAN[c]+'</button>'; }).join('') + '</div>' +
    '<div class="cmap-svg">' + OD.contactMapSVG(cls, 'R') + '</div>' +
    '<p>' + CMAP_NOTE[cls] + '</p>' +
    '<p class="cmap-src">Cusp-fossa contacts in MIP for the right side, read off the help sheet\'s Class I, II and III pictures. Each line joins a centric cusp to the fossa it sits in. Want to drill it? Play "What cusp hits where?" at the top of the Question Bank.</p></figure>';
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
