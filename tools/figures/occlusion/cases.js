/* ---------- CASE IMAGES (2026-10-20) ----------
   The patient cases show their findings as images: perio charts, periapical and TMJ radiographs, intraoral views,
   articulating-paper marks, mounted casts and a bite record. All drawn for this hub as illustrations (not patient
   photos or real radiographs); what they show follows the lectures. A question with pimg:['key', ...] draws these
   inside its Patient Box. Radiographs keep their own dark film colors in both themes. */
var CASE_IMG = (function(){
  var f1 = OD.f1, T = OD.txt, I = {};
  /* deterministic speckle for bone trabeculae */
  function rnd(seed){ var s = seed % 2147483647; if(s <= 0) s += 2147483646; return function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  /* Catmull-Rom through pts as a dense polyline (the same curve OD.smooth draws), so a shape can be measured and offset */
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

  /* ---------- radiographs ----------
     Teeth are drawn in mm from average dimensions (Wheeler): cw crown width at the contacts, cv width at the CEJ,
     ch crown height, rl root length, tr root trunk (CEJ to furcation). Crown outlines are written with the mesial
     surface at -x; m:true mirrors a tooth whose mesial surface faces right on the film. Films are drawn crown-up (a
     mandibular film as mounted) and a maxillary film is flipped top to bottom. Mounting is labial (ADA): the patient's
     right is on your left, so on a right-side film distal is at the left and mesial at the right. */
  var XT = {
    maxI1:{ cw:8.5, cv:7,   ch:10.5, rl:13,   cr:'inc'  },
    maxI2:{ cw:6.5, cv:5,   ch:9,    rl:13,   cr:'inc2' },
    maxC: { cw:7.5, cv:5.5, ch:10,   rl:17,   cr:'can'  },
    maxP1:{ cw:7,   cv:5,   ch:8.5,  rl:14,   cr:'pm'   },
    maxP2:{ cw:6.5, cv:5,   ch:8.5,  rl:14,   cr:'pm'   },
    maxM1:{ cw:10,  cv:8,   ch:7.5,  rl:12.5, cr:'mol', tr:4, pal:true },
    maxM2:{ cw:9,   cv:7,   ch:7,    rl:11.5, cr:'mol', tr:4.5, pal:true },
    manC: { cw:7,   cv:5.5, ch:11,   rl:16,   cr:'can'  },
    manP1:{ cw:7,   cv:5,   ch:8.5,  rl:14,   cr:'pm'   },
    manP2:{ cw:7,   cv:5,   ch:8,    rl:14.5, cr:'pm'   },
    manM1:{ cw:11,  cv:9,   ch:7.5,  rl:14,   cr:'mol3', tr:3 },
    manM2:{ cw:10.5,cv:8,   ch:7,    rl:13,   cr:'mol', tr:3.5 }
  };
  /* crown outline in mm: x across (mesial -x), y down from the occlusal plane (0) to the CEJ (ch). o.plunge raises the
     middle (distobuccal) cusp of a lower first molar above the plane. */
  function crownMM(d, o){
    var w = d.cw / 2, v = d.cv / 2, h = d.ch, pl = o.plunge || 0;
    if(d.cr === 'inc') return [[-v, h], [-w + .3, h * .56], [-w, h * .22], [-w + .2, .4], [-w + .75, 0], [w - 1.1, .1], [w - .3, .75], [w, h * .3], [w - .3, h * .58], [v, h]];
    if(d.cr === 'inc2') return [[-v, h], [-w + .3, h * .56], [-w, h * .26], [-w + .4, .6], [-w + 1.2, 0], [w - 1.6, .25], [w - .4, 1.3], [w, h * .34], [w - .3, h * .6], [v, h]];
    if(d.cr === 'can') return [[-v, h], [-w + .4, h * .56], [-w, h * .32], [-w + 1, h * .17], [-1.4, h * .075], [-.4, 0], [.7, h * .09], [w - 1, h * .24], [w, h * .4], [w - .4, h * .63], [v, h]];
    if(d.cr === 'pm') return [[-v, h], [-w + .35, h * .56], [-w, h * .3], [-w + 1, h * .1], [-.3, 0], [w - 1.1, h * .12], [w, h * .32], [w - .35, h * .58], [v, h]];
    if(d.cr === 'mol3') return [[-v, h], [-w + .4, h * .56], [-w, h * .3], [-w + .8, h * .08], [-w * .52, 0], [-w * .2, h * .13], [w * .14, -pl], [w * .44, h * .13], [w * .7, h * .05], [w - .5, h * .16], [w, h * .34], [w - .4, h * .58], [v, h]];
    return [[-v, h], [-w + .4, h * .56], [-w, h * .3], [-w + .8, h * .08], [-w * .46, 0], [w * .02, h * .14], [w * .48, .1], [w - .8, h * .1], [w, h * .32], [w - .4, h * .58], [v, h]];
  }
  /* roots in mm from the CEJ: [axis x at the CEJ, axis x at the apex, half-width at the CEJ, length]; mesial -x */
  function rootsMM(d){
    var v = d.cv / 2;
    if(d.cr === 'mol' || d.cr === 'mol3') return d.pal
      ? [[-v + 1.8, -v + 2.5, 1.8, d.rl], [v - 1.6, v - 2, 1.6, d.rl - 1.5]]
      : [[-v + 2.1, -v + 2.9, 2.1, d.rl], [v - 2, v - 1.6, 2, d.rl - 1]];
    return [[0, d.cr === 'inc' ? 0 : .7, v, d.rl]];
  }
  /* the root (offset dd mm outward: PDL, lamina dura) from yL/yR (px, its crest on each side) to the apex. fun = extra
     PDL width at the crest that fades over the coronal third (a funnel-shaped widening) */
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
  /* geometry of one tooth on a film. o = { t (XT key), x (center px), occ (y of the occlusal plane, px), k (px per mm),
     m (mesial faces right), lift (mm the tooth sits short of the plane), plunge, scoop:{ x, w, d } (mm), amalgam,
     bone:[mesial, distal] (mm of crestal bone lost), pdl, lam (mm), funnel (mm), implant:{ w, len }, implantCrown } */
  function xrTooth(o){
    var d = XT[o.t], k = o.k, sg = o.m ? -1 : 1, top = o.occ + (o.lift || 0) * k, cej = top + d.ch * k;
    function X(x){ return o.x + sg * x * k; }
    var cr = dense(crownMM(d, o), false, 6).map(function(p){
      var y = p[1];
      if(o.scoop && y < d.ch * .4){ var u = (p[0] - o.scoop.x) / o.scoop.w; y += o.scoop.d * Math.exp(-u * u); }
      return [X(p[0]), top + y * k];
    });
    var g = { o:o, d:d, k:k, x:o.x, cej:cej, top:top, sg:sg, X:X, crown:cr, roots:[] };
    /* the CEJ ends of the crown are its first and last points; the crown is closed along the CEJ */
    var crestY = cej + 1.5 * k, bm = (o.bone && o.bone[0]) || 0, bd = (o.bone && o.bone[1]) || 0;
    g.crestM = crestY + bm * k; g.crestD = crestY + bd * k;
    if(o.implant){
      g.crestM = g.crestD = crestY;
      return g;
    }
    rootsMM(d).forEach(function(r){ g.roots.push({ a0:X(r[0]), a1:X(r[1]), w0:r[2] * k, wa:.75 * k, y0:cej, len:r[3] * k }); });
    if(d.pal) g.pal = { a0:X(.2), a1:X(.6), w0:2 * k, wa:.85 * k, y0:cej, len:(d.rl + .5) * k };
    return g;
  }
  /* crest heights on the left / right of a tooth, in screen terms (mesial and distal swap when mirrored) */
  function crestLR(g){ return g.sg > 0 ? [g.crestM, g.crestD] : [g.crestD, g.crestM]; }
  function socketSVG(g, dd, cls){
    if(g.o.implant) return '';
    var c = crestLR(g), s = '', fun = (g.o.funnel || 0) * g.k;
    g.roots.forEach(function(r){ s += path(cls, rootOutline(r, dd * g.k, c[0], c[1], fun)); });
    if(g.d.tr){ var y0 = Math.min(c[0], c[1]), tf = trunkPts(g, dd * g.k, y0); if(tf) s += path(cls, tf); }
    return s;
  }
  /* the root trunk, CEJ (or crest) to the furcation: it follows the outer sides of the two roots, its floor arched */
  function trunkPts(g, dd, y0){
    var yf = g.cej + g.d.tr * g.k, l = g.roots[0], r = g.roots[1], L = g.sg > 0 ? l : r, R = g.sg > 0 ? r : l, pts = [], i;
    if(y0 >= yf) return null;
    function tOf(rt, y){ return Math.max(0, (y - rt.y0) / rt.len); }
    for(i = 0; i <= 4; i++){ var y = y0 + (yf - y0) * i / 4, t = tOf(L, y); pts.push([rAx(L, t) - rHw(L, t) - dd, y]); }
    var tl = tOf(L, yf), tr = tOf(R, yf), xa = rAx(L, tl) + rHw(L, tl) * .2, xb = rAx(R, tr) - rHw(R, tr) * .2;
    pts.push([xa, yf + dd], [(xa + xb) / 2, yf + dd - .5 * g.k], [xb, yf + dd]);
    for(i = 4; i >= 0; i--){ var y2 = y0 + (yf - y0) * i / 4, t2 = tOf(R, y2); pts.push([rAx(R, t2) + rHw(R, t2) + dd, y2]); }
    return pts;
  }
  function toothSVG(g){
    var s = '', o = g.o, k = g.k, d = g.d;
    if(o.implant) return implantSVG(g);
    if(g.pal) s += path('xr-dentin', rootOutline(g.pal, 0, g.cej, g.cej), false, 'opacity:.45');
    s += path('xr-dentin', [[g.X(-d.cv / 2 + .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .1), g.cej + 2], [g.X(-d.cv / 2 + .1), g.cej + 2]]);
    g.roots.forEach(function(r){ s += path('xr-dentin', rootOutline(r, 0, g.cej, g.cej)); });
    if(d.tr) s += path('xr-dentin', trunkPts(g, 0, g.cej - 1));
    /* enamel cap, then the dentin inside it (the DEJ), thinning to nothing at the CEJ */
    s += path('xr-enamel', g.crown);
    var E = (d.cr === 'mol' || d.cr === 'mol3') ? 1.5 : d.cr === 'pm' ? 1.3 : 1.0, cy = g.top + d.ch * .72 * k;
    var dej = g.crown.map(function(p){ var f = Math.max(0, Math.min(1, (g.cej - p[1]) / (d.ch * k))), th = E * k * Math.pow(f, .55), dx = g.x - p[0], dy = cy - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * th, p[1] + dy / L * th]; });
    var e0 = dej[0], e1 = dej[dej.length - 1];   /* carried a little below the CEJ so the enamel's lower edge leaves no seam */
    s += path('xr-dentin', dej.concat([[e1[0] + (g.x - e1[0]) * .04, g.cej + .8 * k], [e0[0] + (g.x - e0[0]) * .04, g.cej + .8 * k]]));
    s += pulpSVG(g);
    if(o.amalgam) s += amalgamSVG(g);
    return s;
  }
  function pulpSVG(g){
    var k = g.k, d = g.d, s = '', X = g.X, c = g.cej;
    if(d.tr){ /* chamber with horns under the cusps, canals down each root */
      var w = d.cv * .3, horns = d.cr === 'mol3' ? [[-w * .8, 3.1], [w * .4, 2.9]] : [[-w * .7, 3.0], [w * .7, 2.8]];
      s += path('xr-pulp', dense([[X(-w), c + 1.4 * k], [X(-w - .25), c - .6 * k], [X(horns[0][0]), c - horns[0][1] * k], [X(0), c - 2.1 * k], [X(horns[1][0]), c - horns[1][1] * k], [X(w + .25), c - .6 * k], [X(w), c + 1.4 * k]], true, 6));
      g.roots.forEach(function(r){ var L = [], R = [], N = 10;
        for(var i = 0; i <= N; i++){ var t = .06 + .86 * i / N, x = r.a0 + (r.a1 - r.a0) * Math.pow(t, 1.7), y = r.y0 + t * r.len, hw = (.55 - .4 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
        s += path('xr-pulp', L.concat(R)); });
      return s;
    }
    var r = g.roots[0], horn = d.cr === 'can' ? .5 : d.cr === 'pm' ? .42 : .38, L2 = [], R2 = [], N2 = 14;
    for(var j = 0; j <= N2; j++){
      var tt = -horn * d.ch * k / r.len + (horn * d.ch * k / r.len + .93) * j / N2, yy = r.y0 + tt * r.len;
      var xx = tt < 0 ? r.a0 : r.a0 + (r.a1 - r.a0) * Math.pow(tt, 1.7);
      var hw2 = tt < 0 ? (1 - Math.pow(-tt / (horn * d.ch * k / r.len), 2)) * 1.05 * k : (.95 - .8 * Math.pow(tt, .7)) * k * .85;
      L2.push([xx - Math.max(.45, hw2), yy]); R2.unshift([xx + Math.max(.45, hw2), yy]);
    }
    return path('xr-pulp', dense(L2.concat(R2), true, 3));
  }
  /* a large MOD amalgam: fills the occlusal third and both proximal boxes, its surface following the (scooped) crown */
  function amalgamSVG(g){
    var k = g.k, d = g.d, X = g.X, w = d.cw / 2;
    var occ = g.crown.filter(function(p){ return p[1] < g.top + d.ch * .42 * k; });
    var floor = g.top + d.ch * .5 * k, box = g.top + d.ch * .66 * k;
    occ = occ.map(function(p){ return [g.x + (p[0] - g.x) * .97, p[1] + .25 * k]; });
    var a = occ[0], b = occ[occ.length - 1];
    function at(p, f, y){ return [g.x + (p[0] - g.x) * f, y]; }
    var pts = occ.concat([[b[0], box], at(b, .74, box + .2 * k), at(b, .62, floor), at(a, .62, floor), at(a, .74, box + .2 * k), [a[0], box]]);
    return path('xr-metal', pts);
  }
  /* implant: threaded fixture with its platform at the crest, abutment and screw, and a crown whose cervical part narrows
     to the platform (emergence profile). No PDL and no lamina dura: bone meets the threads. */
  function implantSVG(g){
    var o = g.o, k = g.k, x = g.x, im = o.implant, hw = im.w / 2 * k, y0 = g.crestM, len = im.len * k, s = '';
    var L = [], R = [], pitch = .8 * k, n = Math.floor((len - 1.2 * k) / pitch);
    L.push([x - hw, y0]); R.push([x + hw, y0]);
    for(var i = 0; i < n; i++){ var yy = y0 + .6 * k + i * pitch, taper = 1 - .18 * Math.pow(i / n, 2);
      L.push([x - hw * taper, yy], [x - hw * taper - .38 * k, yy + pitch * .35], [x - hw * taper, yy + pitch * .7]);
      R.push([x + hw * taper, yy + pitch * .3], [x + hw * taper + .38 * k, yy + pitch * .65], [x + hw * taper, yy + pitch]); }
    var yb = y0 + len, tip = hw * .72;
    L.push([x - tip, yb - .6 * k], [x - tip * .6, yb]); R.push([x + tip, yb - .6 * k], [x + tip * .6, yb]);
    s += path('xr-metal', L.concat(R.reverse()));
    /* abutment */
    s += path('xr-metal', [[x - hw * .84, y0 + .1 * k], [x - hw * .74, y0 - 2.6 * k], [x + hw * .74, y0 - 2.6 * k], [x + hw * .84, y0 + .1 * k]]);
    /* crown: the tooth's outline, its cervical third pulled in to the platform */
    var y1 = g.top + g.d.ch * .5 * k, ha = hw * .74, drop = (y0 - 1.1 * k) - g.cej;
    var cw = g.crown.map(function(p){ var f = Math.max(0, Math.min(1, (p[1] - y1) / (g.cej - y1))), e = f * f * (3 - 2 * f), dx = p[0] - x;
      return [x + dx * (1 - e) + (dx < 0 ? -ha : ha) * e, p[1] + e * drop]; });
    s += path('xr-crown', cw);
    /* screw-retained: the access channel down to the abutment screw; the screw sits in its bore */
    if(o.screwAccess) s += path('xr-access', [[x - 1.2 * k, g.top + .9 * k], [x - .8 * k, y0 - 2.5 * k], [x + .8 * k, y0 - 2.5 * k], [x + 1.2 * k, g.top + .9 * k]]);
    s += path('xr-bore', [[x - .58 * k, y0 + 3 * k], [x - .58 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 1.9 * k], [x + .58 * k, y0 - 1.9 * k], [x + .58 * k, y0 + 3 * k]]);
    s += path('xr-metal', [[x - .42 * k, y0 + 2.8 * k], [x - .42 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 1.9 * k], [x + .42 * k, y0 - 1.9 * k], [x + .42 * k, y0 + 2.8 * k]]);
    return s;
  }
  /* bone: up to the crest between the teeth (a crest point on each root surface, the septum between), trabeculae inside */
  function boneSVG(gs, w, yBottom, seed){
    var top = [], k = gs[0].k;
    function side(g, right, y){ /* x where the bone meets this tooth's socket at height y */
      if(g.o.implant) return g.x + (right ? 1 : -1) * (g.o.implant.w / 2 + .1) * k;
      var dd = ((g.o.pdl || .2) + (g.o.lam || .22)) * k, xs = g.roots.map(function(r){ var t = Math.max(0, (y - r.y0) / r.len); return rAx(r, t) + (right ? 1 : -1) * rHw(r, t); });
      return (right ? Math.max.apply(null, xs) + dd : Math.min.apply(null, xs) - dd);
    }
    gs.forEach(function(g, i){
      var c = crestLR(g), xl = side(g, false, c[0]), xr = side(g, true, c[1]);
      if(i === 0) top.push([-5, c[0] - .3 * k]);
      top.push([xl, c[0]], [g.x, Math.max(c[0], c[1]) + .5 * k], [xr, c[1]]);
      var nx = gs[i + 1];
      if(nx){ var cn = crestLR(nx), xn = side(nx, false, cn[0]);
        /* the septum peaks at the healthier side when one neighbor has lost bone */
        var lo = Math.min(c[1], cn[0]), px = c[1] > cn[0] + 2 ? xn - .9 * k : cn[0] > c[1] + 2 ? xr + .9 * k : (xr + xn) / 2;
        top.push([px, lo - .4 * k]); }
      else top.push([w + 5, c[1] - .3 * k]);
    });
    var s = path('xr-bone', top.concat([[w + 5, yBottom], [-5, yBottom]]));
    function yTop(x){ for(var i = 1; i < top.length; i++) if(x <= top[i][0]){ var a = top[i - 1], b = top[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return top[top.length - 1][1]; }
    var r = rnd(seed), yMin = Math.min.apply(null, top.map(function(p){ return p[1]; }));
    for(var i = 0; i < 230; i++){ var cx = r() * w, cy = yMin + r() * (yBottom - yMin), rx = 1.5 + r() * 5, ry = 1 + r() * 2.6, a = Math.round(r() * 180), cl = r() < .55 ? 'xr-tb' : 'xr-tb2';
      if(cy < yTop(cx) + 3 || cy > yBottom - 2) continue;
      s += '<ellipse class="' + cl + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + a + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    s += path('xr-cortex', top.slice(1, -1), true);
    return s;
  }
  /* a row of teeth in contact, laid out from x0 (px) to the right: list = [ options without x ] */
  function rowXR(list, x0, occ, k, center){
    if(center){ x0 = center[1] - XT[list[center[0]].t].cw * k / 2; for(var j = 0; j < center[0]; j++) x0 -= XT[list[j].t].cw * k - .15 * k; }
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
  function filmTeeth(gs, w, h, seed){ return filmBG(gs, w, h, seed) + gs.map(toothSVG).join(''); }
  /* film: the identification dot sits at the occlusal edge, as it is placed in the mouth */
  function film(w, h, inner, label, dot){
    return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + inner + '<circle class="xr-dot" cx="' + dot[0] + '" cy="' + dot[1] + '" r="3"/></svg>';
  }
  /* periapical film: teeth crown-up from occ; o.max flips it (crowns down, as a maxillary film is mounted) */
  function pa(w, h, gs, seed, label, max){
    var inner = filmTeeth(gs, w, h, seed);
    if(max) inner = '<g transform="translate(0 ' + h + ') scale(1 -1)">' + inner + '</g>';
    return film(w, h, inner, label, max ? [w - 16, h - 9] : [w - 16, 9]);
  }
  /* maxillary centrals with the laterals and part of each canine; #8 sits left of the midline, so its mesial faces right */
  I.paTrauma = { kind:'Periapical radiograph', title:'Maxillary centrals, #8 and #9',
    note:'Look at the dark line around each root (the PDL space) and the white line outside it (the lamina dura), next to the neighbors.',
    svg: pa(360, 300, rowXR([{ t:'maxC', m:true, lift:.3 }, { t:'maxI2', m:true, lift:.8 }, { t:'maxI1', m:true, funnel:.7, pdl:.36, lam:.6 }, { t:'maxI1', funnel:.7, pdl:.36, lam:.6 }, { t:'maxI2', lift:.8 }, { t:'maxC', lift:.3 }], 0, 22, 9.4, [3, 180 + 40]), 11,
      'Periapical radiograph of the maxillary central incisors, #8 and #9, with the laterals', true) };
  /* lower right, labial mounting: #31 at the left, mesial facing right */
  I.paImplant30 = { kind:'Periapical radiograph', title:'Lower right: #31, implant crown #30, #29',
    svg: pa(380, 300, rowXR([{ t:'manM2', m:true, lift:.2 }, { t:'manM1', m:true, implant:{ w:5, len:10 }, screwAccess:true }, { t:'manP2', m:true }, { t:'manP1', m:true, lift:.2 }, { t:'manC', m:true, lift:-.3 }], 0, 30, 9, [1, 172]), 23,
      'Periapical radiograph of the lower right: #31, an implant crown on #30, and #29') };
  I.paImplant6 = { kind:'Periapical radiograph', title:'#5, implant crown #6, #7',
    svg: pa(360, 300, rowXR([{ t:'maxP2', m:true, lift:.6 }, { t:'maxP1', m:true, lift:.4 }, { t:'maxC', m:true, implant:{ w:4.1, len:13 } }, { t:'maxI2', m:true, lift:.7 }, { t:'maxI1', m:true }], 0, 22, 10.2, [2, 180]), 37,
      'Periapical radiograph of an implant crown in the right canine position, between #5 and #7', true) };
  I.paCanine6 = { kind:'Periapical radiograph', title:'#5, #6, #7',
    note:'Compare the bone level around #6 with its neighbors.',
    svg: pa(360, 300, rowXR([{ t:'maxM1', m:true, lift:.9 }, { t:'maxP2', m:true, lift:.6 }, { t:'maxP1', m:true, lift:.4 }, { t:'maxC', m:true, bone:[8, 8], pdl:.38, lam:.22 }, { t:'maxI2', m:true, lift:.7 }, { t:'maxI1', m:true }], 0, 18, 9, [3, 176]), 51,
      'Periapical radiograph of the right canine region: the bone around #6 is far below the level around #5 and #7', true) };
  /* bitewing, right side (distal at the left): #2-#5 over #31-#28. Class I: #3 sits about 2.5 mm distal to #30, so the
     distobuccal cusp of #30 meets #3's central fossa, here rising above the plane into a scooped-out amalgam. */
  I.bwOver = { kind:'Bitewing radiograph', title:'Right side, #2-#5 over #31-#28',
    note:'Follow the plane of occlusion from the premolars back, and look at the distobuccal cusp of #30.',
    svg: (function(){
      var w = 420, h = 250, mid = 124, k = 9;
      var lo = rowXR([{ t:'manM2', m:true, lift:.25 }, { t:'manM1', m:true, plunge:2 }, { t:'manP2', m:true, lift:.1 }, { t:'manP1', m:true, lift:.3 }, { t:'manC', m:true, lift:-.2 }], 36, mid - .45 * k, k);
      var x3 = lo[1].x + lo[1].d.cw * k / 2 - 2.5 * k - XT.maxM1.cw * k / 2;   /* #3's mesial surface 2.5 mm distal to #30's */
      var up = rowXR([{ t:'maxM2', m:true, lift:.25 }, { t:'maxM1', m:true, amalgam:true }, { t:'maxP2', m:true, lift:.1 }, { t:'maxP1', m:true, lift:.3 }, { t:'maxC', m:true, lift:.2 }], x3 - XT.maxM1.cw * k / 2 - XT.maxM2.cw * k + .15 * k, mid - .45 * k, k);
      /* the scoop sits where the plunging cusp of #30 meets #3 (in #3's own mm, mesial -x) */
      var xs = (lo[1].X(XT.manM1.cw / 2 * .14) - up[1].x) / (up[1].sg * k);
      up[1].o.scoop = { x:xs, w:1.8, d:2.9 }; up[1] = xrTooth(up[1].o);
      var flip = '<g transform="translate(0 ' + (2 * mid) + ') scale(1 -1)">';
      var s = filmBG(lo, w, h, 6) + flip + filmBG(up, w, 2 * mid, 5) + '</g>' + lo.map(toothSVG).join('') + flip + up.map(toothSVG).join('') + '</g>';
      return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Bitewing radiograph of the right side: the distobuccal cusp of #30 rises above the plane of occlusion into a scooped amalgam on #3"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + s + '<circle class="xr-dot" cx="12" cy="' + mid + '" r="3"/></svg>';
    })() };
  /* TMJ, lateral view (radiograph style), face to the right; mm from the roof of the glenoid fossa, y down. The temporal
     bone's articular surface runs from the postglenoid process up into the fossa, down the posterior slope of the
     articular eminence to its crest, and forward under the articular tubercle. In an open lock the mandible is rotated
     wide open and the condyle has slid over the crest: it sits in front of and above it, and the fossa is empty. */
  function tmj(){
    var w = 380, h = 280, k = 8.4, ox = 150, oy = 72;
    function P(p){ return [ox + p[0] * k, oy + p[1] * k]; }
    var s = '<rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/><rect class="xr-soft" x="0" y="0" width="' + w + '" height="' + h + '"/>';
    var surf = [[-20, 10.4], [-16.5, 9.6], [-11.5, 9.4], [-8.4, 8.8], [-6.7, 6.6], [-5.3, 3.8], [-3.3, 1.2], [0, 0], [3, .8], [5.8, 3.2], [8.4, 6.2], [10.3, 7.7], [12, 7.8], [14.2, 6.6], [17.2, 5.1], [21, 4.4], [27, 4.3]];
    var top = dense(surf, false, 6).map(P);
    s += path('xr-bone', top.concat([[w + 5, top[top.length - 1][1]], [w + 5, -5], [-5, -5], [-5, top[0][1]]]));
    var r = rnd(77), i;
    function yTop(x){ for(var j = 1; j < top.length; j++) if(x <= top[j][0]){ var a = top[j - 1], b = top[j]; return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1); } return top[top.length - 1][1]; }
    for(i = 0; i < 120; i++){ var cx = r() * w, cy = r() * 150, rx = 1.5 + r() * 5, ry = 1 + r() * 2.6;
      if(cy > yTop(cx) - 4) continue;
      s += '<ellipse class="' + (r() < .55 ? 'xr-tb' : 'xr-tb2') + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + Math.round(r() * 180) + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    s += path('xr-cortex', top, true);
    /* external acoustic meatus, behind the postglenoid process */
    var e = P([-13.4, 3.6]);
    s += '<ellipse class="xr-dark" cx="' + f1(e[0]) + '" cy="' + f1(e[1]) + '" rx="' + f1(3.4 * k) + '" ry="' + f1(3.9 * k) + '"/>';
    /* mandible drawn closed (head center at 0,0), then rotated open 32 degrees about the head and moved forward */
    var mand = [[-4, 1.7], [-4.4, 0], [-3.5, -2.3], [-1.2, -3.5], [1.5, -3.4], [3.7, -2.2], [4.4, .1], [3.6, 2.2], [2.8, 4.6], [3.4, 7.6], [5.6, 10.6], [9.4, 12.6], [13.6, 11.6], [17.6, 7], [21, -.8], [23, 2.6], [23.4, 11], [22.6, 24], [21.5, 40], [-5.6, 42], [-4.9, 30], [-3.9, 18], [-3.2, 9.4], [-3.3, 5]];
    var ang = 32 * Math.PI / 180, hc = [17.4, 9.5];
    function rot(p){ return [hc[0] + p[0] * Math.cos(ang) - p[1] * Math.sin(ang), hc[1] + p[0] * Math.sin(ang) + p[1] * Math.cos(ang)]; }
    s += path('xr-mand', dense(mand, true, 6).map(function(p){ return P(rot(p)); }));
    /* condylar head: a denser cap of cortical bone */
    s += path('xr-head', dense([[-4, 1.7], [-4.4, 0], [-3.5, -2.3], [-1.2, -3.5], [1.5, -3.4], [3.7, -2.2], [4.4, .1], [3.6, 2.2]], false, 6).map(function(p){ return P(rot(p)); }), true);
    function lab(p, t, anchor){ var q = P(p); return T(q[0], q[1], t, 'xr-lab', anchor); }
    function lead(a, b){ var p = P(a), q = P(b); return '<path class="xr-lead" d="M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + '"/><circle class="xr-lead-dot" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="2"/>'; }
    s += lab([-13.4, 4.9], 'ear canal', 'middle') + lab([-.4, 4.4], 'glenoid fossa', 'middle');
    s += lead([8.4, 9.7], [11, 7.75]) + lab([8.6, 11], 'articular eminence', 'end');
    s += lead([20.6, 15.4], [19.5, 12.4]) + lab([20, 17], 'condyle');
    return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Lateral TMJ view: the condyle sits in front of the articular eminence and the glenoid fossa is empty">' + s + '</svg>';
  }
  I.tmjOpen = { kind:'TMJ radiograph, lateral view', title:'Right side, attempting to close', svg: tmj() };
  /* ---------- intraoral views (drawn) ---------- */
  function gums(w, h){ return '<rect class="io-bg" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>'; }
  /* frontal view with cheek retractors, patient's right on YOUR left. Labial crown outlines in mm (mesial -x, y from the
     incisal edge up to the cervical line and on under the gum); f foreshortens the teeth that turn away around the arch.
     o = { ov: vertical overlap of the incisors in mm (normal 2-3; 0 edge to edge), aob (incisors apart, back teeth
     together, tongue between), div2 (retroclined centrals behind labially flared laterals), worn, c4 (Class IV composite
     at #8's mesioincisal corner), pfm (#6-#11 PFM crowns with gray margins) } */
  var FT = {
    I1:{ cw:8.5, cv:7, ch:10.5, s:'inc' }, I2:{ cw:6.5, cv:5, ch:9, s:'inc2' }, C:{ cw:7.5, cv:5.5, ch:10, s:'can', f:.8 }, P1:{ cw:7, cv:5, ch:8.5, s:'pm', f:.55 }, P2:{ cw:6.5, cv:5, ch:8, s:'pm', f:.36 },
    i1:{ cw:5, cv:3.5, ch:9, s:'linc' }, i2:{ cw:5.5, cv:4, ch:9.5, s:'linc' }, c:{ cw:7, cv:5.5, ch:11, s:'can', f:.8 }, p1:{ cw:7, cv:5, ch:8.5, s:'pm', f:.55 }, p2:{ cw:7, cv:5, ch:8, s:'pm', f:.36 }
  };
  function labialMM(d, flat){
    var w = d.cw / 2, v = d.cv / 2, h = d.ch, H = h + 3, a = [[-v, H], [-v - .15, h]], z = [[v + .15, h], [v, H]];
    if(flat || d.s === 'linc') return a.concat([[-w + .2, h * .5], [-w, h * .18], [-w + .15, .25], [-w + .5, 0], [w - .5, 0], [w - .15, .25], [w, h * .18], [w - .2, h * .5]], z);
    if(d.s === 'inc') return a.concat([[-w + .25, h * .5], [-w, h * .2], [-w + .12, h * .05], [-w + .7, 0], [w - 1.2, .15], [w - .3, h * .08], [w, h * .25], [w - .25, h * .52]], z);
    if(d.s === 'inc2') return a.concat([[-w + .25, h * .52], [-w, h * .24], [-w + .4, h * .07], [-w + 1.2, 0], [w - 1.7, .3], [w - .4, h * .13], [w, h * .3], [w - .25, h * .55]], z);
    if(d.s === 'can') return a.concat([[-w + .35, h * .55], [-w, h * .3], [-w + 1, h * .15], [-1.2, h * .06], [-.35, 0], [.6, h * .08], [w - 1, h * .22], [w, h * .38], [w - .35, h * .6]], z);
    return a.concat([[-w + .3, h * .55], [-w, h * .3], [-w + 1, h * .1], [-.2, 0], [w - 1, h * .12], [w, h * .32], [w - .3, h * .56]], z);
  }
  function front(o){
    var w = 420, h = 250, mid = 210, occ = 126, k = 6.6, s = gums(w, h);
    var ov = o.ov == null ? 2.5 : o.ov;
    /* upper teeth from the midline out: [key, number on the patient's right, on the left, edge offset (mm above the plane)] */
    var U = [['I1', 8, 9, 0], ['I2', 7, 10, .8], ['C', 6, 11, .2], ['P1', 5, 12, 1], ['P2', 4, 13, 1.6]];
    var L = [['i1', 25, 24, ov], ['i2', 26, 23, ov], ['c', 27, 22, ov * .7 + .4], ['p1', 28, 21, 1.8], ['p2', 29, 20, 2.4]];
    if(o.aob){ L[0][3] = L[1][3] = -3.6; L[2][3] = -.9; U[0][3] = U[1][3] = .3; }
    /* division 2: the centrals tip back, so their edges sit higher and their crowns look shorter; the overlap is measured
       from those edges */
    if(o.div2){ U[0][3] = 1.2; U[1][3] = .4; L[0][3] = L[1][3] = 1.2 + ov; L[2][3] = 4.6; }
    var hScale = function(key){ return o.worn ? ({ I1:.7, I2:.72, C:.8, i1:.76, i2:.76, c:.84 })[key] || 1 : o.div2 && key === 'I1' ? .88 : 1; };
    function lay(list, upper){
      var out = [];
      [-1, 1].forEach(function(side){
        var x = mid + side * (upper ? .1 : .05) * k;
        list.forEach(function(t){
          var d = FT[t[0]], f = d.f || 1, wd = d.cw * f * k, hs = hScale(t[0]), cx = x + side * wd / 2;
          /* side -1 is the patient's right: its mesial surface faces the midline, to the right */
          var edge = occ + (upper ? -t[3] : -t[3]) * k, flat = o.worn && t[0] !== 'P1' && t[0] !== 'P2' && t[0] !== 'p1' && t[0] !== 'p2';
          var mm = labialMM(d, flat).map(function(p){ return [p[0], p[1] * hs]; });
          var rot = o.div2 && t[0] === 'I2' ? -side * 6 : 0, sh = o.div2 && t[0] === 'I2' ? -side * .8 * k : 0;
          function P(p){ var x0 = side * p[0] * f * k, y0 = (upper ? -1 : 1) * p[1] * k, a = rot * Math.PI / 180, cy = (upper ? -1 : 1) * d.ch * hs * k;
            var xr = x0 * Math.cos(a) - (y0 - cy) * Math.sin(a), yr = x0 * Math.sin(a) + (y0 - cy) * Math.cos(a) + cy;
            return [cx + sh + xr, edge + yr]; }
          var pts = dense(mm, false, 6).map(P);
          out.push({ key:t[0], num:side < 0 ? t[1] : t[2], side:side, d:{ ch:d.ch * hs }, cx:cx + sh, xm:side < 0 ? x - wd : x, xd:side < 0 ? x : x + wd, cerv:edge + (upper ? -1 : 1) * d.ch * hs * k,
            edge:edge, pts:pts, P:P, mm:mm, f:f, hs:hs });
          x += side * (wd - .1 * k);
        });
      });
      return out;
    }
    var up = lay(U, true), lo = lay(L, false);
    function byX(a, b){ return a.cx - b.cx; }
    function gumRow(list){ return list.slice().sort(byX).map(function(t){ return { xm:t.xm, xd:t.xd, cx:t.cx, cerv:t.cerv, d:t.d }; }); }
    if(o.aob) s += '<path class="io-tongue" d="M128 ' + (occ + 3) + ' Q210 ' + (occ - 10) + ' 292 ' + (occ + 3) + ' Q292 ' + (occ + 30) + ' 210 ' + (occ + 34) + ' Q128 ' + (occ + 30) + ' 128 ' + (occ + 3) + 'Z"/>';
    /* lower teeth and their gum first: the upper teeth overlap them in front */
    lo.forEach(function(t){ s += path('io-tooth low' + (o.worn ? ' worn' : ''), t.pts);
      if(o.worn && /^(i1|i2|c)$/.test(t.key)) s += '<ellipse class="io-dentin" cx="' + f1(t.cx) + '" cy="' + f1(t.edge + 1.6) + '" rx="' + f1(FT[t.key].cw * t.f * k * .27) + '" ry="1.7"/>'; });
    s += gumSVG(gumRow(lo), false, h + 6, 'io-gum low', k, 120);
    /* upper: back teeth first; normally the laterals sit behind the centrals, in division 2 the flared laterals sit in front */
    var rank = function(t){ return t.key === 'I1' ? (o.div2 ? 3 : 4) : t.key === 'I2' ? (o.div2 ? 4 : 3) : t.key === 'C' ? 2 : t.key === 'P1' ? 1 : 0; };
    up.slice().sort(function(a, b){ return rank(a) - rank(b); }).forEach(function(t){
      var pfm = o.pfm && /^(I1|I2|C)$/.test(t.key);
      s += path('io-tooth' + (o.worn ? ' worn' : '') + (pfm ? ' pfm' : ''), t.pts);
      if(o.div2 && t.key === 'I1'){ /* the incisal part of a retroclined central turns away from you: darker, foreshortened */
        var cut = t.mm.filter(function(p){ return p[1] <= t.d.ch * .42 / t.hs * t.hs; });
        s += path('io-shade', dense(cut, false, 6).map(t.P)); }
      if(o.worn && /^(I1|I2|C)$/.test(t.key)) s += '<ellipse class="io-dentin" cx="' + f1(t.cx) + '" cy="' + f1(t.edge - 1.8) + '" rx="' + f1(FT[t.key].cw * t.f * k * .28) + '" ry="1.9"/>';
      if(o.c4 && t.num === 8){ var w8 = FT.I1.cw / 2, comp = [[-w8 + .05, 3.3], [-w8 + .12, .5], [-w8 + .7, 0], [-w8 + 3.3, .1]];
        s += path('io-comp', comp.map(t.P)) + path('io-crack', [[-w8 + 3.3, .1], [-w8 + 2.2, 1.4], [-w8 + 1, 2.6], [-w8 + .05, 3.3]].map(t.P), true); }
    });
    /* PFM margins: a gray metal collar just short of the gum margin (the gum, drawn next, hides its ends) */
    if(o.pfm) up.forEach(function(t){ if(!/^(I1|I2|C)$/.test(t.key)) return; var m = [], d = FT[t.key], v = d.cv / 2;
      for(var i = 0; i <= 10; i++){ var x = -v * 1.05 + v * 2.1 * i / 10; m.push([x, d.ch + .15 - .5 * Math.pow(Math.abs(x / v), 2)]); }
      s += path('io-margin', m.map(t.P), true); });
    s += gumSVG(gumRow(up), true, 24, 'io-gum', k, 120);
    s += T(12, 16, 'patient’s right', 'io-lab') + T(w - 12, 16, 'patient’s left', 'io-lab', 'end');
    return '<svg class="io" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (o.aria || 'Frontal intraoral view') + '">' + s + '</svg>';
  }
  I.frontDiv2 = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:7, div2:true, aria:'Frontal view: upper centrals tipped back and covering most of the lower incisors, laterals flared out in front of them' }) };
  I.frontAOB = { kind:'Intraoral photo (drawn)', title:'Frontal view, swallowing', svg: front({ aob:true, aria:'Frontal view: front teeth apart with the tongue between them while the back teeth touch' }) };
  I.frontE2E = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:0, c4:true, aria:'Frontal view: incisors meeting edge to edge; the mesioincisal corner of #8 is a composite with a fracture line' }) };
  I.frontWorn = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:1, worn:true, aria:'Frontal view: incisors and canines worn flat and short, dentin showing on the edges' }) };
  I.frontPFM = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ pfm:true, aria:'Frontal view: six upper anterior crowns with gray margins at the gums' }) };
  /* ---------- side views of the teeth (buccal photo, mounted casts) ----------
     Buccal crown outlines in mm (Wheeler averages), mesial at -x, y from the cusp tips (0) to the cervical line (ch) and
     on under the gum. Upper molars show two buccal cusps with the buccal groove between them; the lower first molar
     three (mesiobuccal, distobuccal, distal), its buccal groove between the first two. f foreshortens a tooth that turns
     away around the arch. */
  var BT = {
    I2:{ cw:6.5, cv:5, ch:9, f:.5, k:'I' }, C:{ cw:7.5, cv:5.5, ch:10, f:.8, k:'C' }, P1:{ cw:7, cv:5, ch:8.5, k:'P' }, P2:{ cw:6.5, cv:5, ch:8, k:'P' }, M1:{ cw:10, cv:8, ch:7.5, k:'M' }, M2:{ cw:9, cv:7, ch:7, k:'M' },
    i2:{ cw:5.5, cv:4, ch:9.5, f:.5, k:'I' }, c:{ cw:7, cv:5.5, ch:11, f:.8, k:'C' }, p1:{ cw:7, cv:5, ch:8.5, k:'P' }, p2:{ cw:7, cv:5, ch:8, k:'P' }, m1:{ cw:11, cv:9, ch:7.5, k:'M3' }, m2:{ cw:10.5, cv:8, ch:7, k:'M' }
  };
  function sideMM(d){
    var w = d.cw / 2, v = d.cv / 2, h = d.ch, H = h + 3, g = [], cusp = {};
    var base = [[-w + .4, h * .56], [-w, h * .3]], tail = [[w, h * .33], [w - .4, h * .58], [v + .2, h], [v, H]], P;
    if(d.k === 'I') P = [[-v, H], [-v - .2, h], [-w + .3, h * .55], [-w, h * .2], [-w + .5, 0], [w - .9, .2], [w - .2, h * .25], [w - .3, h * .55], [v + .2, h], [v, H]];
    else if(d.k === 'C'){ P = [[-v, H], [-v - .2, h]].concat(base, [[-w + 1, h * .17], [-1.4, h * .075], [-.4, 0], [.7, h * .09], [w - 1, h * .24]], tail); cusp.T = [-.4, 0]; }
    else if(d.k === 'P'){ P = [[-v, H], [-v - .2, h]].concat(base, [[-w + 1, h * .1], [-.3, 0], [w - 1.1, h * .12]], tail); cusp.B = [-.3, 0]; }
    else if(d.k === 'M3'){ P = [[-v, H], [-v - .2, h]].concat(base, [[-w + .8, h * .08], [-w * .52, 0], [-w * .2, h * .15], [w * .12, .1], [w * .42, h * .13], [w * .68, h * .06], [w - .5, h * .16]], tail);
      g = [[[-w * .2, h * .15], [-w * .17, h * .55]], [[w * .42, h * .13], [w * .44, h * .42]]]; cusp = { MB:[-w * .52, 0], DB:[w * .12, .1], D:[w * .68, h * .06], bg:[-w * .2, h * .15] }; }
    else { P = [[-v, H], [-v - .2, h]].concat(base, [[-w + .8, h * .08], [-w * .46, 0], [-w * .14, h * .07], [w * .03, h * .16], [w * .24, h * .06], [w * .5, .15], [w - .8, h * .1]], tail);
      g = [[[w * .03, h * .16], [w * .06, h * .55]]]; cusp = { MB:[-w * .46, 0], DB:[w * .5, .15], bg:[w * .03, h * .16] }; }
    return { out:P, grooves:g, cusp:cusp };
  }
  /* a row of teeth in contact from the most mesial one: o = { list:[{ t, num, lift (mm short of the plane) }], xm (screen x
     of the first tooth's mesial surface), occ (y of the plane), k, upper, mirror (mesial faces right) } */
  function sideRow(o){
    var dir = o.mirror ? -1 : 1, xm = o.xm, k = o.k, out = [];
    o.list.forEach(function(t){
      var d = BT[t.t], f = d.f || 1, cx = xm + dir * d.cw * f / 2 * k, s = sideMM(d), top = o.occ + (o.upper ? -1 : 1) * (t.lift || 0) * k;
      function P(p){ return [cx + dir * p[0] * f * k, top + (o.upper ? -1 : 1) * p[1] * k]; }
      out.push({ t:t, d:d, cx:cx, P:P, pts:dense(s.out, false, 6).map(P), grooves:s.grooves.map(function(gr){ return gr.map(P); }), cusp:s.cusp,
        xm:xm, xd:xm + dir * d.cw * f * k, cerv:top + (o.upper ? -1 : 1) * d.ch * k });
      xm += dir * (d.cw * f - .12) * k;
    });
    return out;
  }
  function toothRowSVG(row, cls){ return row.map(function(t){ return path(cls, t.pts) + t.grooves.map(function(g){ return path('io-groove', g, true); }).join(''); }).join(''); }
  /* the gum over a row: the margin runs fairly flat across each tooth (zenith a little distal of center) and rises
     steeply into a narrow papilla that fills the embrasure up to about 1 mm short of the contact */
  function gumSVG(row, upper, yEdge, cls, k, ext){
    var dir = upper ? -1 : 1, pts = [], n = row.length, i;
    function pap(t){ return Math.min(t.d.ch * .52, 4.6) * k; }
    function tip(i){ /* papilla at the mesial surface of row[i] (shared with row[i - 1]) */
      var t = row[i], p = row[i - 1]; return p ? [t.xm, (t.cerv + p.cerv) / 2 - dir * Math.min(pap(t), pap(p))] : [t.xm, t.cerv - dir * pap(t)]; }
    var e0 = row[0].xm + (row[0].xm > row[0].xd ? 1 : -1) * (ext || 1.5 * k);
    pts.push([e0, row[0].cerv - dir * pap(row[0]) * .2]);
    for(i = 0; i < n; i++){
      var t = row[i], a = t.xm, b = t.xd, c = t.cerv, P = pap(t);
      pts.push(tip(i), [a + (b - a) * .1, c - dir * P * .5], [a + (b - a) * .3, c + dir * .05 * k], [t.cx + (b - a) * .05, c + dir * .45 * k], [b - (b - a) * .3, c + dir * .05 * k], [b - (b - a) * .1, c - dir * P * .5]);
    }
    var last = row[n - 1];
    pts.push([last.xd, last.cerv - dir * pap(last)], [last.xd + (last.xd > last.xm ? 1 : -1) * (ext || 1.5 * k), last.cerv - dir * pap(last) * .2]);
    var edge = dense(pts, false, 5), f = edge[0], l = edge[edge.length - 1];
    return path(cls, edge.concat([[l[0], yEdge], [f[0], yEdge]]));
  }
  function dot(cls, p, r){ return '<circle class="' + cls + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + r + '"/>'; }
  /* buccal photo of the patient's right side in MIP: seen from the right, mesial (the front of the mouth) is at the RIGHT.
     o.cls = Angle class: in Class I the mesiobuccal cusp of #3 sits in the buccal groove of #30 (#3's mesial surface about
     2.5 mm distal to #30's); Class II full cusp puts the lower arch about 4.75 mm further distal, so the cusp sits in the
     embrasure between #29 and #30. */
  function buccal(o){
    var w = 440, h = 250, occ = 128, k = 8.6, s = gums(w, h);
    var up = [{ t:'I2', num:7, lift:.8 }, { t:'C', num:6 }, { t:'P1', num:5, lift:.15 }, { t:'P2', num:4, lift:.2 }, { t:'M1', num:3 }, { t:'M2', num:2, lift:.3 }];
    var lo = [{ t:'i2', num:26 }, { t:'c', num:27, lift:-.3 }, { t:'p1', num:28, lift:.1 }, { t:'p2', num:29 }, { t:'m1', num:30 }, { t:'m2', num:31, lift:.2 }];
    var ov = .75, cOv = o.canineOverlap || 1.6;
    up[0].lift -= cOv - ov; up[1].lift = -(cOv - ov); lo[0].lift = -(cOv - ov); lo[1].lift = -(cOv - ov) - .2;
    function widthTo(list, n){ var x = 0; for(var i = 0; i < n; i++) x += (BT[list[i].t].cw * (BT[list[i].t].f || 1) - .12); return x; }
    var x3 = 236, x30 = x3 + (o.cls === 2 ? -2.25 : 2.5) * k;   /* mesial surfaces of #3 and #30 */
    var U = sideRow({ list:up, xm:x3 + widthTo(up, 4) * k, occ:occ + ov * k, k:k, upper:true, mirror:true });
    var L = sideRow({ list:lo, xm:x30 + widthTo(lo, 4) * k, occ:occ - ov * k, k:k, upper:false, mirror:true });
    s += toothRowSVG(L, 'io-tooth low') + gumSVG(L, false, h - 26, 'io-gum low', k, 90);
    s += toothRowSVG(U, 'io-tooth') + gumSVG(U, true, 26, 'io-gum', k, 90);
    var m3 = U[4], m30 = L[4];
    var blue = m3.P([m3.cusp.MB[0], 1.4]), red = m30.P([m30.cusp.bg[0] + .1, 2.6]);
    s += dot('io-mark', blue, 4.2) + dot('io-mark2', red, 4.2);
    s += T(14, 18, '← distal', 'io-lab') + T(w - 14, 18, 'mesial →', 'io-lab', 'end');
    s += T(m3.cx, 18, '#3', 'io-lab', 'middle') + T(m30.cx, h - 10, '#30', 'io-lab', 'middle');
    return '<svg class="io" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (o.aria || 'Right buccal view in MIP') + '">' + s + '</svg>';
  }
  I.buccalII = { kind:'Intraoral photo (drawn)', title:'Right buccal view in MIP',
    note:'Blue dot: the mesiobuccal cusp of #3. Red dot: the buccal groove of #30.',
    svg: buccal({ cls:2, canineOverlap:3.4, aria:'Right buccal view in MIP, front of the mouth at the right: the blue dot marks the mesiobuccal cusp of #3, the red dot the buccal groove of #30' }) };
  /* ---------- articulating paper and shimstock on occlusal rows ---------- */
  /* marks: [ toothType, kind, at, ... ] kind 'blue' (MIP, closing; 1 = big and dark, 'faint' = a light, small mark) |
     'red' (excursion streak from at to the next point) | 'wear' (a flat, shiny facet; then its size) | 'crack' (a list of
     points, drawn jagged) | 'comp' (a restoration's outline, a list of points); points are in the tooth's own frame */
  function marksRow(arch, side, marks, o){
    o = o || {}; var k = o.k || 10, W = 470, r = OD.row(arch, side, { x0:o.x0 || 24, yc:o.yc || 80, k:k, W:W }), s = '<rect class="io-plate" x="0" y="0" width="' + W + '" height="' + (o.h || 160) + '" rx="14"/>' + r.svg;
    s += OD.numLabels(r, 0, arch === 'mand');
    function at(t, p){ var tt = r.teeth[t]; return typeof p === 'string' ? tt.pt[p] : tt.P(p); }
    marks.forEach(function(m){
      var t = m[0], kind = m[1];
      if(kind === 'blue'){ var p = at(t, m[2]), big = m[3] === 1, faint = m[3] === 'faint';
        s += '<circle class="ap-blue' + (big ? ' big' : faint ? ' faint' : '') + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (big ? 9 : faint ? 3.6 : 5) + '"/>' + (big ? '<circle class="ap-blue-ring" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="15"/>' : ''); }
      else if(kind === 'red'){ var a = at(t, m[2]), b = at(t, m[3]); s += '<path class="ap-red" d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]) + '"/>'; }
      else if(kind === 'wear'){ var c = at(t, m[2]), rw = m[3] || 9;
        s += '<ellipse class="ap-wear" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" rx="' + rw + '" ry="' + f1(rw * .7) + '"/><ellipse class="ap-gloss" cx="' + f1(c[0] - rw * .3) + '" cy="' + f1(c[1] - rw * .25) + '" rx="' + f1(rw * .38) + '" ry="' + f1(rw * .18) + '"/>'; }
      else if(kind === 'crack'){ var cp = m[2].map(function(q){ return at(t, q); }), cd = 'M' + cp.map(function(q){ return f1(q[0]) + ' ' + f1(q[1]); }).join('L');
        s += '<path class="ap-crack-halo" d="' + cd + '"/><path class="ap-crack" d="' + cd + '"/>'; }
      else if(kind === 'comp') s += '<path class="ap-comp" d="' + OD.smooth(m[2].map(function(q){ return at(t, q); }), true) + '"/>';
    });
    (o.labels || []).forEach(function(l){ s += T(l[0], l[1], l[2], 'fg-t sm', l[3] || 'start'); });
    return '<svg viewBox="0 0 ' + W + ' ' + (o.h || 160) + '" role="img" aria-label="' + (o.aria || 'Occlusal view with articulating paper marks') + '">' + s + '</svg>';
  }
  I.marksNW3 = { note:'Blue = tapping closed in MIP. Red = marks made in a LEFT lateral excursion.', kind:'Articulating paper', title:'#3 after the new crown (blue = closing, red = excursions)',
    svg: marksRow('max', 'R', [['M1','blue','m'],['M1','blue','c'],['M1','blue','ML'],['PM2','blue','m'],['M2','blue','m'],['M2','blue','c'],['PM1','blue','m'],
      ['M1','red',[.36,.68],[.46,.5]]], { aria:'Upper right teeth #6 to #2 with blue closing marks and one red excursion streak on #3' }) };
  I.marksPro = { note:'Upper left quadrant, #11 to #15. Blue = closing in MIP. Red = the patient sliding straight forward to edge to edge.', kind:'Articulating paper', title:'Upper left, protrusion (red) over closing (blue)',
    svg: marksRow('max', 'L', [['M1','blue','m'],['M1','blue','c'],['M2','blue','m'],['M2','blue','c'],['PM2','blue','m'],['PM1','blue','m'],
      ['M2','red',[.54,.7],[.42,.73]], ['M2','red',[.88,.72],[.78,.75]], ['M1','red',[.5,.7],[.38,.72]]], { aria:'Upper left teeth with red protrusive streaks on the molars' }) };
  I.marksUpright = { note:'Lower left quadrant, #22 to #18, marked while he taps closed sitting up. The big dark marks are on the new MO composite on #19.', kind:'Shimstock and articulating paper', title:'Lower left, sitting upright',
    svg: marksRow('mand', 'L', [['M1','comp',[[.02,.3],[.2,.28],[.27,.4],[.4,.42],[.5,.37],[.61,.44],[.59,.61],[.48,.65],[.36,.6],[.27,.62],[.2,.73],[.03,.72]]],
      ['M1','blue','c',1],['M1','blue','m',1],['PM2','blue','B','faint'],['M2','blue','MB','faint'],['PM1','blue','B','faint']], { yc:72, aria:'Lower left teeth: two large dark marks on the MO composite of #19 and only faint marks on the other teeth' }) };
  I.marksWear = { note:'Gray = shiny, flat wear facets. The distolingual cusp of #2 is cracked. The big blue mark is the first contact when the jaw is guided closed with the joints seated.', kind:'Clinical findings (drawn)', title:'Upper right, occlusal view',
    svg: marksRow('max', 'R', [['M2','wear','ML',10],['M2','wear','DB',8],['M1','wear','ML',9],['C','wear','T',10],['M2','crack',[[.97,.52],[.91,.57],[.9,.63],[.85,.66],[.84,.72],[.8,.75],[.81,.81],[.77,.86],[.76,.93]]],['M2','blue','m',1]], { aria:'Upper right teeth with wear facets, a cracked cusp on #2 and a first contact mark on #2' }) };
  /* ---------- periodontal chart (HTML: stays readable on phones) ----------
     rows: { teeth:['6',...], mob:[...], frem:[...], fac:[[3 depths],...], lin:[[3],...], rec:[...], bop:[[...],...], missing:['2',...] } */
  function chart(c){
    /* one column per tooth; a run of missing teeth shares one column ("#2-5") so a long arch still fits a phone */
    var cols = [];
    c.teeth.forEach(function(t, i){ var miss = !!(c.missing && c.missing.indexOf(t) > -1), last = cols[cols.length - 1];
      if(miss && last && last.miss && +c.teeth[last.j] + 1 === +t) last.j = i; else cols.push({ i:i, j:i, miss:miss }); });
    function cell(arr, col, kind){ if(col.miss) return '<td class="pc-miss">X</td>';
      var v = arr[col.i], i = col.i;
      if(kind === 'pd') return '<td class="pc-pd">' + v.map(function(n, j){ var b = c.bop && c.bop[i] && c.bop[i][j]; return '<span class="' + (n >= 5 ? 'deep' : '') + (b ? ' bop' : '') + '">' + n + '</span>'; }).join('') + '</td>';
      v = v == null ? '' : String(v);
      return '<td' + (v && v !== '0' && v !== '-' ? ' class="pc-flag"' : '') + '>' + v + '</td>'; }
    function row(label, arr, kind){ return '<tr><th>' + label + '</th>' + cols.map(function(col){ return cell(arr, col, kind); }).join('') + '</tr>'; }
    var h = '<div class="pchart-wrap"><table class="pchart"><thead><tr><th>Tooth</th>' + cols.map(function(col){ return '<th>#' + c.teeth[col.i] + (col.j > col.i ? '-' + c.teeth[col.j] : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += row('Mobility', c.mob);
    if(c.frem) h += row('Fremitus', c.frem);
    h += row('Probing, facial', c.fac, 'pd') + row('Probing, lingual', c.lin, 'pd');
    if(c.rec) h += row('Recession', c.rec);
    h += '</tbody></table></div><div class="pchart-key">Depths in mm, three sites per surface; <span class="deep">5+</span> in bold, <span class="bop">red</span> = bleeding on probing. Mobility 0-3; fremitus + = vibration felt when the patient taps or grinds.</div>';
    return h;
  }
  I.chartTrauma = { kind:'Periodontal chart', title:'Maxillary anteriors', html: chart({ teeth:['6','7','8','9','10','11'], mob:[0,0,1,1,0,0], frem:['-','-','+','+','-','-'],
    fac:[[2,1,2],[2,2,2],[2,1,3],[3,1,2],[2,2,2],[2,1,2]], lin:[[2,2,3],[2,2,2],[3,2,3],[3,2,3],[2,2,2],[3,2,2]], rec:[0,0,0,0,0,0] }) };
  I.chartSlide = { kind:'Periodontal chart', title:'Right molars', html: chart({ teeth:['2','3','30','31'], mob:[0,0,0,1], frem:['+','-','-','+'],
    fac:[[3,2,3],[2,2,3],[3,2,2],[3,2,3]], lin:[[3,2,3],[3,2,2],[2,2,3],[3,3,3]], rec:[0,0,0,1] }) };
  I.chartCanine = { kind:'Periodontal chart', title:'Upper right', html: chart({ teeth:['3','4','5','6','7','8'], mob:[0,0,0,2,0,0],
    fac:[[3,2,3],[2,2,3],[3,2,3],[6,4,6],[2,2,3],[2,1,2]], lin:[[3,2,3],[3,2,3],[3,2,3],[7,5,6],[3,2,2],[2,2,2]], bop:[null,null,null,[1,0,1],null,null], rec:[0,0,0,3,0,0] }) };
  I.chartSDA = { kind:'Periodontal chart', title:'Upper arch (X = missing)', html: chart({ teeth:['2','3','4','5','6','7','8','9','10','11','12','13','14','15'], missing:['2','3','4','5','12','13','14','15'],
    mob:[0,0,0,0,1,2,2,2,2,1,0,0,0,0], fac:[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[3,2,3],[3,2,4],[4,3,4],[4,3,4],[3,2,4],[3,2,3],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    lin:[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[3,2,3],[4,3,4],[4,3,5],[5,3,4],[4,3,4],[3,2,3],[0,0,0],[0,0,0],[0,0,0],[0,0,0]], rec:[0,0,0,0,1,1,2,2,1,1,0,0,0,0] }) };
  /* charts of six or more teeth take the whole width of the Patient Box */
  ['chartTrauma', 'chartCanine', 'chartSDA'].forEach(function(k){ I[k].wide = true; });
  /* shimstock results (HTML table) */
  function shim(rows, note){ return '<div class="pchart-wrap"><table class="pchart shim"><thead><tr><th>Tooth</th><th>Light closure</th><th>Firm clench</th></tr></thead><tbody>' +
    rows.map(function(r){ return '<tr><th>#' + r[0] + '</th><td class="' + (r[1] === 'holds' ? 'sh-hold' : 'sh-pull') + '">' + r[1] + '</td><td class="' + (r[2] === 'holds' ? 'sh-hold' : 'sh-pull') + '">' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div>' + (note ? '<div class="pchart-key">' + note + '</div>' : ''); }
  I.shimImplant = { kind:'Shimstock test (12 µm)', title:'At delivery', html: shim([['29','holds','holds'],['30 (implant crown)','holds','holds'],['31','holds','holds']], 'Right lateral excursion with red articulating paper: a mark on the buccal incline of the implant crown\'s distobuccal cusp, along with the canine.') };
  I.shimUpright = { kind:'Shimstock test (12 µm)', title:'Sitting upright, tapping closed', html: shim([['18','pulls through','pulls through'],['19 (new MO composite)','holds','holds'],['20','pulls through','pulls through'],['21','pulls through','holds']]) };
  /* mounted casts, seen from the patient's right: the condyles (the hinge) at the back on the left, the incisal pin and
     table at the front on the right. Closed on the centric latch, the upper member hinges shut until the first tooth
     contact, here the second molars; every tooth in front of them is apart and the pin stands off the table. */
  I.castsCR = { kind:'Mounted diagnostic casts', title:'Right side, mounted in CR (centric latch locked)',
    svg: (function(){
      var w = 440, h = 250, k = 6.3, occ = 132, hinge = [50, 100], ang = -3.4, pinX = 404;
      var s = '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
      function rotP(p){ var a = ang * Math.PI / 180, dx = p[0] - hinge[0], dy = p[1] - hinge[1]; return [hinge[0] + dx * Math.cos(a) - dy * Math.sin(a), hinge[1] + dx * Math.sin(a) + dy * Math.cos(a)]; }
      var up = [{ t:'I2', num:7, lift:.4 }, { t:'C', num:6, lift:-.3 }, { t:'P1', num:5 }, { t:'P2', num:4 }, { t:'M1', num:3 }, { t:'M2', num:2 }];
      var lo = [{ t:'i2', num:26, lift:-.2 }, { t:'c', num:27, lift:-.3 }, { t:'p1', num:28 }, { t:'p2', num:29 }, { t:'m1', num:30 }, { t:'m2', num:31 }];
      function widthOf(list){ var x = 0; list.forEach(function(t){ x += BT[t.t].cw * (BT[t.t].f || 1) - .12; }); return x; }
      var x0 = 112, xmU = x0 + widthOf(up) * k, xmL = xmU + 1.2 * k;
      var L = sideRow({ list:lo, xm:xmL, occ:occ, k:k, upper:false, mirror:true });
      /* place the upper teeth so that, once the upper member is hinged shut, #2 just meets #31 */
      var probe = sideRow({ list:up, xm:xmU, occ:occ, k:k, upper:true, mirror:true }), maxY = -1e9;
      probe[5].pts.forEach(function(p){ maxY = Math.max(maxY, rotP(p)[1]); });
      var U = sideRow({ list:up, xm:xmU, occ:occ + (occ - maxY) + .3 * k, k:k, upper:true, mirror:true });
      var xa = Math.min(L[5].xd, U[5].xd) - 10, xb = Math.max(L[0].xm, U[0].xm) + 10;
      /* lower member: base, back pillar carrying the condylar ball, incisal table on its post */
      s += '<rect class="ar-metal" x="22" y="218" width="404" height="15" rx="5"/><rect class="ar-metal" x="40" y="' + hinge[1] + '" width="20" height="' + (218 - hinge[1]) + '"/>';
      s += '<rect class="ar-metal" x="' + (pinX - 6) + '" y="196" width="12" height="22"/><rect class="ar-metal" x="' + (pinX - 26) + '" y="188" width="50" height="9" rx="2"/>';
      /* lower cast: teeth, the stone around their necks, then the mounting plaster */
      s += toothRowSVG(L, 'ar-tooth low') + gumSVG(L, false, 206, 'ar-stone', k, 10);
      s += '<path class="ar-stone2" d="M' + f1(xa) + ' 219 L' + f1(xb) + ' 219 L' + f1(xb) + ' 198 Q' + f1((xa + xb) / 2) + ' 192 ' + f1(xa) + ' 198Z"/>';
      /* upper member, hinged shut about the condyle */
      var g = '<rect class="ar-metal" x="34" y="16" width="' + (pinX + 18 - 34) + '" height="17" rx="5"/><rect class="ar-metal" x="40" y="31" width="20" height="' + (hinge[1] - 42) + '"/>';
      g += '<rect class="ar-metal" x="' + (pinX - 4) + '" y="28" width="8" height="' + (188 - 28) + '"/>';
      g += toothRowSVG(U, 'ar-tooth') + gumSVG(U, true, 50, 'ar-stone', k, 10);
      g += '<path class="ar-stone2" d="M' + f1(xa) + ' 32 L' + f1(xb) + ' 32 L' + f1(xb) + ' 54 Q' + f1((xa + xb) / 2) + ' 60 ' + f1(xa) + ' 54Z"/>';
      g += '<path class="ar-housing" d="M30 ' + (hinge[1] - 17) + ' L70 ' + (hinge[1] - 17) + ' L70 ' + (hinge[1] + 3) + ' Q50 ' + (hinge[1] - 7) + ' 30 ' + (hinge[1] + 3) + 'Z"/>';
      s += '<g transform="rotate(' + ang + ' ' + hinge[0] + ' ' + hinge[1] + ')">' + g + '</g>';
      s += '<circle class="ar-joint" cx="' + hinge[0] + '" cy="' + hinge[1] + '" r="10"/>';
      /* the first contact */
      var u2 = U[5], l2 = L[5], c2 = rotP(u2.P([u2.cusp.MB[0], 0]));
      s += '<circle class="ap-blue big" cx="' + f1(c2[0]) + '" cy="' + f1(occ + .1 * k) + '" r="5"/><circle class="ap-blue-ring" cx="' + f1(c2[0]) + '" cy="' + f1(occ + .1 * k) + '" r="10"/>';
      s += T(76, 94, 'condyle', 'fg-t sm') + T(w - 10, 246, 'incisal pin, off its table', 'fg-t sm', 'end');
      s += T(u2.cx, 47, '#2', 'fg-t sm', 'middle') + T(l2.cx, 213, '#31', 'fg-t sm', 'middle');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Casts on an articulator in centric relation, seen from the right: the second molars touch first, the teeth in front of them are apart and the incisal pin stands off its table">' + s + '</svg>';
    })() };
  /* bite registration as it came back with the casts, seen from its lower side (the patient's right on your left, the
     front at the top): a print of every lower tooth, the smooth, deep print of the #30 preparation, and excess that ran
     past the teeth onto the soft tissue, never trimmed */
  I.recordFull = { kind:'Bite registration sent to the lab', title:'Occlusal view of the PVS record',
    svg: (function(){
      var w = 420, h = 250, s = '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
      var arch = dense([[84, 240], [88, 184], [100, 130], [126, 86], [164, 56], [210, 46], [256, 56], [294, 86], [320, 130], [332, 184], [336, 240]], false, 14);
      var len = [0]; for(var i = 1; i < arch.length; i++){ var dx = arch[i][0] - arch[i - 1][0], dy = arch[i][1] - arch[i - 1][1]; len.push(len[i - 1] + Math.sqrt(dx * dx + dy * dy)); }
      var L = len[len.length - 1];
      function at(d){ for(var j = 1; j < len.length; j++) if(d <= len[j]){ var t = (d - len[j - 1]) / (len[j] - len[j - 1]), a = arch[j - 1], b = arch[j], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        return { x:a[0] + (b[0] - a[0]) * t, y:a[1] + (b[1] - a[1]) * t, a:ang }; } var e = arch[arch.length - 1]; return { x:e[0], y:e[1], a:-Math.PI / 2 }; }
      /* the band of material, about 13 mm wide, and the untrimmed excess spreading inside the arch */
      function off(d, o){ var p = at(d); return [p.x + Math.sin(p.a) * o, p.y - Math.cos(p.a) * o]; }
      var outer = [], inner = [], flash = [], N = 60, r = rnd(9);
      for(i = 0; i <= N; i++){ var d = L * i / N; outer.push(off(d, 25)); inner.push(off(d, -23)); flash.push(off(d, -23 - (20 + 34 * Math.sin(Math.PI * i / N)) - r() * 9)); }
      s += path('pv-flash', dense(flash, false, 3).concat(inner.slice().reverse()));
      s += path('pv-body', dense(outer, false, 3).concat(inner.slice().reverse()));
      /* tooth prints from #31 (your lower left) round to #18; widths in mm, scaled to the arch */
      var T2 = [['m', 10.5], ['prep', 11], ['p', 7], ['p', 7], ['c', 7], ['i', 5.5], ['i', 5], ['i', 5], ['i', 5.5], ['c', 7], ['p', 7], ['p', 7], ['m', 11], ['m', 10.5]];
      var tot = T2.reduce(function(a, t){ return a + t[1]; }, 0), sc = (L - 16) / tot, d0 = 8, prep;
      T2.forEach(function(t){
        var mid = d0 + t[1] * sc / 2, p = at(mid), deg = p.a * 180 / Math.PI, hw = t[1] * sc / 2 - 1.2, tr = ' transform="rotate(' + f1(deg) + ' ' + f1(p.x) + ' ' + f1(p.y) + ')"';
        if(t[0] === 'm') s += '<rect class="pv-imp"' + tr + ' x="' + f1(p.x - hw) + '" y="' + f1(p.y - 15) + '" width="' + f1(2 * hw) + '" height="30" rx="9"/>' +
          [[-.5, -7], [.5, -7], [0, -6], [-.5, 7], [.5, 7]].map(function(c){ return '<circle class="pv-pit"' + tr + ' cx="' + f1(p.x + c[0] * hw) + '" cy="' + f1(p.y + c[1]) + '" r="2.4"/>'; }).join('');
        else if(t[0] === 'prep'){ s += '<rect class="pv-prep"' + tr + ' x="' + f1(p.x - hw + 1) + '" y="' + f1(p.y - 13) + '" width="' + f1(2 * hw - 2) + '" height="26" rx="8"/>'; prep = p; }
        else if(t[0] === 'p') s += '<ellipse class="pv-imp"' + tr + ' cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" rx="' + f1(hw) + '" ry="13"/><circle class="pv-pit" cx="' + f1(p.x - Math.sin(p.a) * 5) + '" cy="' + f1(p.y + Math.cos(p.a) * 5) + '" r="2.4"/>';
        else if(t[0] === 'c') s += '<ellipse class="pv-imp"' + tr + ' cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" rx="' + f1(hw) + '" ry="9"/><circle class="pv-pit" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="2.6"/>';
        else s += '<ellipse class="pv-imp"' + tr + ' cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" rx="' + f1(hw) + '" ry="3.2"/>';
        d0 += t[1] * sc;
      });
      s += '<path class="pv-lead" d="M' + f1(prep.x - 14) + ' ' + f1(prep.y + 6) + 'L40 ' + f1(prep.y + 32) + '"/><circle class="pv-lead-dot" cx="' + f1(prep.x - 14) + '" cy="' + f1(prep.y + 6) + '" r="2"/>';
      s += T(10, prep.y + 46, '#30 prep', 'fg-t sm');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="A horseshoe PVS bite record with a print of every lower tooth and the #30 preparation, and untrimmed excess spreading inside the arch onto the soft tissue">' + s + '</svg>';
    })() };
  /* "f" sound, a section through the midline, face to the right: the upper central's incisal edge on the lower lip.
     Lightly on the wet-dry line is right; here the edge presses a dent into the lip just inside that line. */
  I.lipF = { kind:'Phonetics check (drawn)', title:'Patient says "fifty-five"',
    svg: (function(){
      var w = 380, h = 230, k = 5, s = '';
      function frame(E, deg){ var a = deg * Math.PI / 180, du = [-Math.sin(a), -Math.cos(a)], dv = [Math.cos(a), -Math.sin(a)];
        return function(p){ return [E[0] + (p[0] * du[0] + p[1] * dv[0]) * k, E[1] + (p[0] * du[1] + p[1] * dv[1]) * k]; }; }
      /* upper central: u along the tooth from its incisal edge toward the apex, v toward the lip (mm); about 20 degrees
         proclined. Lower central: the same with the tooth pointing down, about 25 degrees proclined. */
      var UP = frame([236, 140], 20), LO = function(p){ var f = frame([221, 151], 180 - 25); var q = f([p[0], -p[1]]); return q; };
      var upT = [[0, .5], [1.5, 1.4], [4, 2.3], [7, 2.9], [10.5, 3.1], [13, 3], [17, 2.4], [21, 1.3], [23.2, .3], [23.5, 0], [23.2, -.4], [21, -1.4], [17, -2.6], [13, -3.3], [10, -3.6], [9, -4], [7.5, -3.6], [5.5, -2], [3, -1.1], [1, -.5], [0, -.4]];
      var loT = [[0, .4], [2, 1.2], [5, 2], [9, 2.6], [12, 2.5], [16, 1.8], [20, .9], [21.5, 0], [20, -.9], [16, -2], [12, -2.9], [8.5, -3.2], [7, -3.3], [4.5, -2], [2, -.9], [0, -.4]];
      /* palate and premaxilla (mucosa over bone), the lower alveolar process, the oral cavity behind */
      s += path('io-mouth', [[8, 40], [140, 42], [170, 50], [200, 80], [214, 100], [218, 150], [222, 236], [8, 236]]);
      s += path('io-tongue', dense([[8, 150], [70, 128], [150, 122], [196, 140], [206, 170], [200, 236], [8, 236]], false, 6));
      s += path('io-mucosa', dense([[-4, 40], [140, 42], [168, 52], UP([18, -8.5]), UP([13, -5.4]), UP([10, -3.6]), UP([10.5, 3.1]), UP([13, 4.6]), UP([19, 5.4]), UP([27, 6.6]), [238, -6], [-4, -6]], false, 4));
      s += path('io-bone', dense([[-4, 30], [138, 32], [160, 40], UP([20, -7.4]), UP([15.5, -4.9]), UP([12.6, -3.9]), UP([12, 3.6]), UP([16, 4]), UP([22, 4.5]), UP([30, 5.4]), [-4, -6]], false, 4));
      s += path('io-mucosa', dense([LO([8.5, -3.2]), LO([12, -4.6]), LO([20, -6]), LO([28, -7]), [150, 236], [240, 236], LO([22, 4.4]), LO([13, 3.8]), LO([9, 2.6])], false, 4));
      s += path('io-bone', dense([LO([11, -3.4]), LO([16, -4.2]), LO([26, -5.4]), [170, 236], [228, 236], LO([24, 3.6]), LO([15, 3.2]), LO([10.6, 2.8])], false, 4));
      /* the teeth: root (in its socket), then the crown */
      function toothSVG2(F, pts, ce){ var all = dense(pts.map(F), true, 5), crown = dense(pts.slice(0, ce[0] + 1).concat(pts.slice(ce[1])).map(F), true, 5);
        return path('io-root', all) + path('io-tooth', crown); }
      s += toothSVG2(LO, loT, [3, 11]);
      s += toothSVG2(UP, upT, [4, 14]);
      /* lips: skin above and below, the red of the lips; the lower lip curls up under the upper edge and is dented by it */
      s += path('io-skin', dense([UP([27, 6.9]), UP([20, 5.8]), UP([13, 4.9]), UP([8, 3.6]), UP([5.5, 3.6]), [252, 124], [266, 131], [302, 129], [324, 116], [332, 98], [322, 68], [308, 30], [300, -6], [232, -6]], false, 5));
      s += path('io-lip', dense([[248, 120], [266, 131], [302, 129], [324, 116], [333, 96], [318, 92], [286, 106], [258, 112]], true, 5));
      var dent = [[222, 151.5], [224, 146.5], [227, 141.4], [230.5, 139.2], [233.5, 139.8], [236, 140.7], [238.8, 140.3], [241.5, 137.4], [246, 134.6], [252, 133.4], [262, 133.1], [278, 133.9], [292, 137.4], [301, 145.5], [304, 157], [299, 172], [288, 187], [290, 203], [302, 220], [306, 236]];
      s += path('io-skin', dense(dent.concat([[226, 236], LO([16, 3.6]), LO([9, 3]), LO([4, 2]), LO([1, 1])]), false, 5));
      s += path('io-lip low', dense(dent.slice(0, 16).concat([[284, 176], [262, 172], [236, 166], LO([3, 1.9]), LO([1, 1])]), false, 5));
      /* where the edge presses into the lip */
      s += path('io-press', dense([[231.5, 139.4], [233.5, 139.9], [236, 140.8], [238.8, 140.4], [240.6, 138.6]], false, 5), true);
      /* the anatomy sits 50 px left so the labels have the right-hand margin */
      var X = -50;
      function lab(y, t, tx, ty){ return '<path class="io-lead" d="M296 ' + (y - 4) + 'L' + (tx + X) + ' ' + ty + '"/><circle class="io-lead-dot" cx="' + (tx + X) + '" cy="' + ty + '" r="2.2"/>' + T(300, y, t, 'fg-t sm'); }
      var labels = lab(48, 'upper lip', 318, 70) + lab(102, 'provisional #8', 241, 131) + lab(152, 'wet-dry line', 262, 133.1) + lab(204, 'lower lip', 294, 192);
      return '<svg class="io" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Section through the lips and the upper central incisor: the incisal edge of the provisional crown presses a dent into the lower lip just inside the wet-dry line">' +
        '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/><g transform="translate(' + X + ' 0)">' + s + '</g>' + labels + '</svg>';
    })() };
  return I;
})();
function caseImgHTML(q){
  if(!q.pimg) return '';
  return '<div class="pimg-grid">' + q.pimg.map(function(k){ var c = CASE_IMG[k]; if(!c) return '';
    return '<figure class="pimg' + (c.wide ? ' wide' : '') + '"><figcaption><b>' + escHtml(c.kind) + '</b> · ' + escHtml(c.title) + '</figcaption>' + (c.svg || c.html) + (c.note ? '<div class="pimg-cap">' + escHtml(c.note) + '</div>' : '') + '</figure>'; }).join('') +
    '</div><div class="pimg-note">Drawn for this hub to show the findings; not a patient image.</div>';
}
