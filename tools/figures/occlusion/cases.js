/* ---------- CASE IMAGES (2026-10-20) ----------
   The patient cases show their findings as images: perio charts, periapical and TMJ radiographs, intraoral views,
   articulating-paper marks, mounted casts and a bite record. All drawn for this hub as illustrations (not patient
   photos or real radiographs); what they show follows the lectures. A question with pimg:['key', ...] draws these
   inside its Patient Box. Radiographs keep their own dark film colors in both themes. */
var CASE_IMG = (function(){
  var f1 = OD.f1, T = OD.txt, I = {};
  /* deterministic speckle for bone trabeculae */
  function rnd(seed){ var s = seed % 2147483647; if(s <= 0) s += 2147483646; return function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function trabeculae(x, y, w, h, seed, n){
    var r = rnd(seed), s = '';
    for(var i = 0; i < n; i++){ var cx = x + r() * w, cy = y + r() * h, rx = 2 + r() * 7, ry = 1.5 + r() * 4, a = Math.round(r() * 180);
      s += '<ellipse class="' + (r() < .55 ? 'xr-tb' : 'xr-tb2') + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + a + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    return s;
  }
  function film(w, h, inner, label){
    return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + inner + '<circle class="xr-dot" cx="18" cy="18" r="4"/></svg>';
  }
  /* one tooth on a film, drawn crown-up (a maxillary film flips the whole picture). o = { x (center), crest (alveolar
     crest y), kind:'molar'|'premolar'|'incisor'|'canine', pdl:'wide'|'funnel', lamina:'thick', bone (px of crestal bone
     lost around this tooth), resto:'amalgam'|'pfm', plunge (px a cusp rises above the plane), root (root length scale) } */
  var DIM = { molar:{ hw:42, rw:11, cr:58, rl:112 }, premolar:{ hw:24, rw:12, cr:58, rl:120 }, canine:{ hw:21, rw:12, cr:70, rl:150 }, incisor:{ hw:29, rw:13, cr:66, rl:122 } };
  function paTooth(o){
    var d = DIM[o.kind], x = o.x, cej = o.crest - 14, top = cej - d.cr, tip = cej + d.rl * (o.root || 1), s = '';
    var pdl = o.pdl === 'wide' ? 5 : 2.2, lam = o.lamina === 'thick' ? 6 : 2.2, bone = o.bone || 0;
    var roots = o.kind === 'molar' ? [[-22, -8, -.12], [22, 0, .1]] : [[0, 0, 0]];
    if(bone) s += '<path class="xr-defect" d="M' + f1(x - d.hw - 16) + ' ' + f1(o.crest - 6) + ' Q' + f1(x) + ' ' + f1(o.crest + bone * 1.25) + ' ' + f1(x + d.hw + 16) + ' ' + f1(o.crest - 6) + 'Z"/>';
    roots.forEach(function(rt){
      var bx = x + rt[0], t = tip + rt[1], lean = rt[2] * d.rl, b0 = o.crest + bone;
      function sock(k, fun){ return [[bx - d.rw - k - fun, b0], [bx - d.rw * .78 - k + lean * .5, t - 36], [bx + lean, t + k], [bx + d.rw * .78 + k + lean * .5, t - 36], [bx + d.rw + k + fun, b0]]; }
      var fun = o.pdl === 'funnel' ? 10 : 0;
      s += '<path class="xr-lam" d="' + OD.smooth(sock(pdl + lam, fun), false) + 'Z"/><path class="xr-pdl" d="' + OD.smooth(sock(pdl, fun * .8), false) + 'Z"/>';
    });
    roots.forEach(function(rt){
      var bx = x + rt[0], t = tip + rt[1], lean = rt[2] * d.rl;
      s += '<path class="xr-dentin" d="' + OD.smooth([[bx - d.rw, cej - 2], [bx - d.rw * .82 + lean * .5, t - 34], [bx + lean, t], [bx + d.rw * .82 + lean * .5, t - 34], [bx + d.rw, cej - 2]], false) + 'Z"/>';
      s += '<path class="xr-canal" d="' + OD.smooth([[bx, cej + 4], [bx + lean * .55, t - 30], [bx + lean, t - 6]], false) + '"/>';
    });
    var hw = d.hw, pl = o.plunge || 0, crown;
    if(o.kind === 'molar') crown = [[x - hw + 8, cej], [x - hw - 1, cej - 24], [x - hw + 2, top + 12], [x - hw * .5, top - 2], [x - 3, top + 9], [x + hw * .5, top - 2 - pl], [x + hw - 2, top + 12], [x + hw + 1, cej - 24], [x + hw - 8, cej]];
    else if(o.kind === 'premolar') crown = [[x - hw + 6, cej], [x - hw - 1, cej - 26], [x - hw + 5, top + 8], [x, top - 2], [x + hw - 5, top + 8], [x + hw + 1, cej - 26], [x + hw - 6, cej]];
    else if(o.kind === 'canine') crown = [[x - hw + 6, cej], [x - hw - 2, cej - 30], [x - hw + 6, top + 14], [x, top - 6], [x + hw - 6, top + 14], [x + hw + 2, cej - 30], [x + hw - 6, cej]];
    else crown = [[x - hw + 7, cej], [x - hw - 1, cej - 30], [x - hw + 1, top + 3], [x - hw + 6, top], [x + hw - 6, top], [x + hw - 1, top + 3], [x + hw + 1, cej - 30], [x + hw - 7, cej]];
    s += '<path class="xr-enamel" d="' + OD.smooth(crown, true) + '"/>';
    var inner = crown.map(function(p){ return [x + (p[0] - x) * .8, cej + (p[1] - cej) * .84]; });
    s += '<path class="xr-dentin" d="' + OD.smooth(inner, true) + '"/>';
    s += '<path class="xr-pulp" d="' + OD.smooth(o.kind === 'molar' ? [[x - 20, cej + 6], [x - 20, cej - 18], [x - 12, cej - 26], [x, cej - 22], [x + 12, cej - 26], [x + 20, cej - 18], [x + 20, cej + 6]] : [[x - 5, cej + 8], [x - 6, cej - 18], [x, cej - d.cr * .55], [x + 6, cej - 18], [x + 5, cej + 8]], true) + '"/>';
    if(o.resto === 'amalgam') s += '<path class="xr-metal" d="' + OD.smooth([[x - hw * .62, top + 6], [x - hw * .55, cej - 30], [x, cej - 24], [x + hw * .58, cej - 30], [x + hw * .62, top + 8], [x + hw * .3, top + 18 + (o.scoop || 0)], [x - hw * .3, top + 10]], true) + '"/>';
    if(o.resto === 'pfm') s += '<path class="xr-metal" d="' + OD.smooth(crown.map(function(p){ return [x + (p[0] - x) * .9, cej + (p[1] - cej) * .92]; }), true) + '"/>';
    return s;
  }
  function implant(x, crest, o){
    o = o || {}; var s = '', top = crest - 2, len = 116, cej = crest - 12;
    s += '<path class="xr-lam" style="opacity:.35" d="M' + f1(x - 16) + ' ' + f1(top) + 'L' + f1(x - 14) + ' ' + f1(top + len) + 'Q' + f1(x) + ' ' + f1(top + len + 10) + ' ' + f1(x + 14) + ' ' + f1(top + len) + 'L' + f1(x + 16) + ' ' + f1(top) + 'Z"/>';
    s += '<path class="xr-metal" d="M' + f1(x - 12) + ' ' + f1(top) + 'L' + f1(x - 11) + ' ' + f1(top + len - 6) + 'Q' + f1(x) + ' ' + f1(top + len + 4) + ' ' + f1(x + 11) + ' ' + f1(top + len - 6) + 'L' + f1(x + 12) + ' ' + f1(top) + 'Z"/>';
    for(var i = 0; i < 12; i++){ var y = top + 8 + i * 9.2; s += '<path class="xr-thread" d="M' + f1(x - 13) + ' ' + f1(y) + 'L' + f1(x + 13) + ' ' + f1(y + 4) + '"/>'; }
    s += '<path class="xr-metal" d="M' + f1(x - 8) + ' ' + f1(top) + 'L' + f1(x - 9) + ' ' + f1(cej - 4) + 'L' + f1(x + 9) + ' ' + f1(cej - 4) + 'L' + f1(x + 8) + ' ' + f1(top) + 'Z"/>';
    var hw = o.canine ? 21 : 40, cr = o.canine ? 70 : 58, t0 = cej - cr;
    s += '<path class="xr-crown" d="' + OD.smooth(o.canine ? [[x - 10, cej], [x - hw - 2, cej - 30], [x - hw + 6, t0 + 14], [x, t0 - 6], [x + hw - 6, t0 + 14], [x + hw + 2, cej - 30], [x + 10, cej]]
      : [[x - 14, cej], [x - hw - 1, cej - 24], [x - hw + 2, t0 + 12], [x - hw * .5, t0 - 2], [x - 3, t0 + 9], [x + hw * .5, t0 - 2], [x + hw - 2, t0 + 12], [x + hw + 1, cej - 24], [x + 14, cej]], true) + '"/>';
    return s;
  }
  /* periapical film. o.max = maxillary film (crowns point down); teeth = [ paTooth options | {implant:true,...} ] */
  function pa(w, h, crest, teeth, seed, label, o){
    o = o || {};
    var inner = '<path class="xr-bone" d="M0 ' + f1(crest) + ' L' + w + ' ' + f1(crest) + ' L' + w + ' ' + h + ' L0 ' + h + 'Z"/>' + trabeculae(4, crest + 4, w - 8, h - crest - 8, seed, 190);
    inner += teeth.map(function(t){ return t.implant ? implant(t.x, crest, t) : paTooth(Object.assign({ crest:crest }, t)); }).join('');
    if(o.max) inner = '<g transform="translate(0 ' + h + ') scale(1 -1)">' + inner + '</g>';
    return film(w, h, inner, label);
  }
  /* incisors overlap their neighbors on a film, so space them by crown width */
  I.paTrauma = { kind:'Periapical radiograph', title:'Maxillary centrals, #8 and #9',
    note:'Look at the dark line around each root (the PDL space) and the white line outside it (the lamina dura), next to the neighbors.',
    svg: pa(360, 300, 150, [{ x:42, kind:'incisor' }, { x:136, kind:'incisor', pdl:'funnel', lamina:'thick' }, { x:226, kind:'incisor', pdl:'funnel', lamina:'thick' }, { x:320, kind:'incisor' }], 11, 'Periapical radiograph of the maxillary central incisors', { max:true }) };
  I.paImplant30 = { kind:'Periapical radiograph', title:'#29, implant crown #30, #31',
    svg: pa(380, 300, 150, [{ x:58, kind:'premolar' }, { x:172, implant:true }, { x:300, kind:'molar' }], 23, 'Periapical radiograph with an implant crown between a premolar and a molar') };
  I.paImplant6 = { kind:'Periapical radiograph', title:'#5, implant crown #6, #7',
    svg: pa(360, 300, 146, [{ x:62, kind:'premolar' }, { x:170, implant:true, canine:true }, { x:276, kind:'incisor' }], 37, 'Periapical radiograph of an implant in the canine position', { max:true }) };
  I.paCanine6 = { kind:'Periapical radiograph', title:'#5, #6, #7',
    note:'Compare the bone level around #6 with its neighbors.',
    svg: pa(360, 300, 138, [{ x:64, kind:'premolar' }, { x:172, kind:'canine', bone:58 }, { x:278, kind:'incisor' }], 51, 'Periapical radiograph of the canine region', { max:true }) };
  I.bwOver = { kind:'Bitewing radiograph', title:'Right molars, #2-#3 over #30-#31',
    note:'Follow the plane of occlusion from the premolars back, and look at the distobuccal cusp of #30.',
    svg: (function(){
      var w = 420, h = 250, mid = 125, crest = mid + 2 + 58 + 14;
      function half(teeth, seed){ return '<path class="xr-bone" d="M0 ' + crest + ' L' + w + ' ' + crest + ' L' + w + ' ' + (h + 60) + ' L0 ' + (h + 60) + 'Z"/>' + trabeculae(2, crest + 2, w - 4, h - crest, seed, 50) + teeth.map(function(t){ return paTooth(Object.assign({ crest:crest }, t)); }).join(''); }
      /* both rows drawn crown-up; the upper one is flipped about the plane of occlusion so its crowns point down */
      var up = half([{ x:56, kind:'premolar' }, { x:162, kind:'molar', resto:'amalgam', scoop:14 }, { x:282, kind:'molar' }, { x:398, kind:'molar' }], 5);
      var lo = half([{ x:44, kind:'premolar' }, { x:150, kind:'molar', plunge:16 }, { x:270, kind:'molar' }, { x:386, kind:'molar' }], 6);
      var s = '<g transform="translate(0 ' + (2 * mid) + ') scale(1 -1)">' + up + '</g>' + lo;
      return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Bitewing radiograph of the right molars"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + s + T(18, 238, 'R', 'xr-lab') + '</svg>';
    })() };
  /* TMJ, lateral view (radiograph style): condyle position relative to fossa and eminence */
  function tmj(pos){
    var w = 380, h = 280, s = '<rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
    s += '<path class="xr-bone" d="M0 0 L380 0 L380 120 C330 120 300 104 270 128 C246 150 226 156 206 140 C180 118 170 74 140 70 C108 66 96 104 84 120 C70 140 30 138 0 132Z"/>';
    s += trabeculae(6, 6, 368, 90, 77, 90);
    s += '<ellipse class="xr-dark" cx="62" cy="92" rx="22" ry="18"/>' + T(48, 128, 'EAM', 'xr-lab');
    var cx = pos === 'seated' ? 140 : 296, cy = pos === 'seated' ? 92 : 130, ang = pos === 'seated' ? 0 : 30;
    s += '<g transform="rotate(' + ang + ' ' + cx + ' ' + cy + ')"><path class="xr-condyle" d="M' + (cx - 26) + ' ' + (cy + 8) + ' C' + (cx - 28) + ' ' + (cy - 22) + ' ' + (cx + 28) + ' ' + (cy - 22) + ' ' + (cx + 26) + ' ' + (cy + 8) + ' L' + (cx + 18) + ' ' + (cy + 150) + ' L' + (cx - 30) + ' ' + (cy + 150) + 'Z"/></g>';
    s += T(214, 126, 'articular eminence', 'xr-lab', 'middle') + T(150, 52, 'glenoid fossa', 'xr-lab', 'middle');
    return '<svg class="xr" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Lateral TMJ view">' + s + '<circle class="xr-dot" cx="18" cy="262" r="4"/></svg>';
  }
  I.tmjOpen = { kind:'TMJ radiograph, lateral view', title:'Right side, attempting to close', svg: tmj('front') };
  /* ---------- intraoral views (drawn) ---------- */
  function gums(w, h){ return '<rect class="io-bg" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>'; }
  /* frontal view (cheek retractors), first premolar to first premolar, patient's right on YOUR left.
     o = { ov: vertical overlap in px (5 px ~ 1 mm; negative = open), aob (incisors open, back teeth together, tongue),
     deep + retro + flare (Class II div 2), worn, c4 (Class IV composite at #8's mesioincisal corner), pfm (#6-#11 PFMs) } */
  function front(o){
    var w = 420, h = 250, mid = 210, occ = 124, s = gums(w, h);
    var U = [['8',-1,40,52],['9',1,40,52],['7',-1,31,44],['10',1,31,44],['6',-1,33,50],['11',1,33,50],['5',-1,28,40],['12',1,28,40]];
    var L = [['25',-1,25,38],['24',1,25,38],['26',-1,27,40],['23',1,27,40],['27',-1,31,46],['22',1,31,46],['28',-1,29,38],['21',1,29,38]];
    function lay(list, k){ var xl = mid, xr = mid; return list.map(function(t){ var wd = t[2] * k, x; if(t[1] < 0){ x = xl - wd - 1.5; xl = x; } else { x = xr + 1.5; xr = x + wd; } return { n:t[0], side:t[1], x:x, w:wd, h:t[3] }; }); }
    var K = 1.3; U.concat(L).forEach(function(t){ t[3] *= K; }); var up = lay(U, K), lo = lay(L, K * 1.08);
    function isInc(n){ return ['7','8','9','10','23','24','25','26'].indexOf(n) > -1; }
    function isCan(n){ return n === '6' || n === '11' || n === '22' || n === '27'; }
    function edgeUp(t){ return occ - (o.aob && isInc(t.n) ? 6 : 0); }
    function edgeLo(t){ var ov = o.ov == null ? 16 : o.ov; if(o.aob) ov = isInc(t.n) ? -24 : isCan(t.n) ? -8 : 10; return occ - ov; }
    function hUp(t){ return t.h * (o.worn ? (isInc(t.n) ? .7 : isCan(t.n) ? .78 : .92) : o.retro && (t.n === '8' || t.n === '9') ? .86 : 1); }
    function hLo(t){ return t.h * (o.worn ? (isInc(t.n) ? .74 : .84) : 1); }
    function crown(x, wd, yE, yC, up, pointy){
      var d = up ? 1 : -1, ht = Math.abs(yE - yC);
      return OD.smooth([[x + 3, yC], [x, yC + d * ht * .45], [x + 2, yE - d * 3], [x + wd * .5, yE + d * (pointy || 0)], [x + wd - 2, yE - d * 3], [x + wd, yC + d * ht * .45], [x + wd - 3, yC]], true);
    }
    var cU = edgeUp(up[0]) - hUp(up[0]), cL = edgeLo(lo[0]) + hLo(lo[0]);
    s += '<path class="io-gum" d="M8 8 L412 8 L412 ' + f1(cU + 26) + ' Q210 ' + f1(cU - 2) + ' 8 ' + f1(cU + 26) + 'Z"/>';
    s += '<path class="io-gum low" d="M8 242 L412 242 L412 ' + f1(cL - 22) + ' Q210 ' + f1(cL + 2) + ' 8 ' + f1(cL - 22) + 'Z"/>';
    if(o.aob) s += '<path class="io-tongue" d="M118 ' + (occ - 2) + ' Q210 ' + (occ - 14) + ' 302 ' + (occ - 2) + ' Q302 ' + (occ + 22) + ' 210 ' + (occ + 26) + ' Q118 ' + (occ + 22) + ' 118 ' + (occ - 2) + 'Z"/>';
    /* lower teeth first: the upper teeth overlap them in front */
    lo.forEach(function(t){ var yE = edgeLo(t), arc = Math.abs(t.x + t.w / 2 - mid) * .06; s += '<path class="io-tooth low' + (o.worn ? ' worn' : '') + '" d="' + crown(t.x, t.w, yE + arc * .3, yE + hLo(t) - arc, false, isCan(t.n) && !o.worn ? 5 : 0) + '"/>';
      if(o.worn && (isInc(t.n) || isCan(t.n))) s += '<ellipse class="io-dentin" cx="' + f1(t.x + t.w / 2) + '" cy="' + f1(yE + 3) + '" rx="' + f1(t.w * .26) + '" ry="1.8"/>'; });
    var order = up.slice().sort(function(a, b){ var r = function(n){ return n === '8' || n === '9' ? (o.flare ? 0 : 1) : n === '7' || n === '10' ? (o.flare ? 2 : 0) : -1; }; return r(a.n) - r(b.n); });
    order.forEach(function(t){
      var yE = edgeUp(t), arc = Math.abs(t.x + t.w / 2 - mid) * .06, yC = yE - hUp(t) + arc, lat = t.n === '7' || t.n === '10', cen = t.n === '8' || t.n === '9';
      var x = t.x + (o.flare && lat ? -t.side * 4 : 0), pfm = o.pfm && ['6','7','8','9','10','11'].indexOf(t.n) > -1;
      s += '<path class="io-tooth' + (o.worn ? ' worn' : '') + (pfm ? ' pfm' : '') + '" d="' + crown(x, t.w, yE - arc * .3, yC, true, isCan(t.n) && !o.worn ? 7 : 0) + '"/>';
      if(o.retro && cen) s += '<path class="io-shade" d="M' + f1(x + 4) + ' ' + f1(yE - 16) + ' L' + f1(x + t.w - 4) + ' ' + f1(yE - 16) + ' L' + f1(x + t.w - 3) + ' ' + f1(yE - 3) + ' L' + f1(x + 3) + ' ' + f1(yE - 3) + 'Z"/>';
      if(pfm) s += '<path class="io-margin" d="M' + f1(x + 3) + ' ' + f1(yC + 2) + ' Q' + f1(x + t.w / 2) + ' ' + f1(yC + 6) + ' ' + f1(x + t.w - 3) + ' ' + f1(yC + 2) + '"/>';
      if(o.worn && (cen || lat || isCan(t.n))) s += '<ellipse class="io-dentin" cx="' + f1(x + t.w / 2) + '" cy="' + f1(yE - 3) + '" rx="' + f1(t.w * .28) + '" ry="2"/>';
      if(o.c4 && t.n === '8'){ var xm = x + t.w; s += '<path class="io-comp" d="M' + f1(xm - 15) + ' ' + f1(yE - 2) + ' L' + f1(xm - 2) + ' ' + f1(yE - 20) + ' L' + f1(xm - 1) + ' ' + f1(yE - 3) + 'Z"/><path class="io-crack" d="M' + f1(xm - 15) + ' ' + f1(yE - 2) + ' L' + f1(xm - 2) + ' ' + f1(yE - 20) + '"/>'; }
    });
    s += T(10, 16, 'patient’s right', 'io-lab') + T(410, 16, 'patient’s left', 'io-lab', 'end');
    return '<svg class="io" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (o.aria || 'Frontal intraoral view') + '">' + s + '</svg>';
  }
  I.frontDiv2 = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:34, retro:true, flare:true, aria:'Frontal view: upper centrals tipped back covering most of the lower incisors, laterals flared' }) };
  I.frontAOB = { kind:'Intraoral photo (drawn)', title:'Frontal view, swallowing', svg: front({ aob:true, aria:'Frontal view: front teeth apart with the tongue between them while the back teeth touch' }) };
  I.frontE2E = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:0, c4:true, aria:'Frontal view: incisors meeting edge to edge; the mesioincisal corner of #8 is a composite with a fracture line' }) };
  I.frontWorn = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ ov:4, worn:true, aria:'Frontal view: incisors and canines worn flat and short, dentin showing on the edges' }) };
  I.frontPFM = { kind:'Intraoral photo (drawn)', title:'Frontal view in MIP', svg: front({ pfm:true, aria:'Frontal view: six upper anterior crowns with gray margins at the gums' }) };
  /* buccal (side) view of the right posterior teeth in MIP: molar relation and plane of occlusion */
  function buccal(o){
    var w = 440, h = 240, occ = 120, s = gums(w, h);
    s += '<path class="io-gum" d="M10 22 L430 22 L430 ' + (occ - 52) + ' L10 ' + (occ - 52) + 'Z"/><path class="io-gum low" d="M10 ' + (h - 22) + ' L430 ' + (h - 22) + ' L430 ' + (occ + 52) + ' L10 ' + (occ + 52) + 'Z"/>';
    /* upper: canine, PM1, PM2, M1, M2 from left (mesial) to right; lower shifted by o.shift px (Class II = positive = back) */
    var U = [['6',58,'C'],['5',48,'P'],['4',46,'P'],['3',72,'M'],['2',64,'M']], L = [['27',50,'C'],['28',48,'P'],['29',50,'P'],['30',78,'M'],['31',72,'M']];
    function crown(x, wd, kind, upper, plunge){
      var e = occ, r = upper ? occ - 60 : occ + 60, d = upper ? 1 : -1, pts;
      if(kind === 'M') pts = [[x, r], [x - 2, e - d * 24], [x + 3, e - d * 3], [x + wd * .25, e + d * 3], [x + wd * .5, e - d * 4], [x + wd * .75, e + d * (3 + (plunge || 0))], [x + wd - 3, e - d * 3], [x + wd + 2, e - d * 24], [x + wd, r]];
      else if(kind === 'P') pts = [[x, r], [x - 2, e - d * 24], [x + 4, e - d * 4], [x + wd * .5, e + d * 4], [x + wd - 4, e - d * 4], [x + wd + 2, e - d * 24], [x + wd, r]];
      else pts = [[x, r], [x - 3, e - d * 26], [x + 6, e - d * 8], [x + wd * .5, e + d * 9], [x + wd - 6, e - d * 8], [x + wd + 3, e - d * 26], [x + wd, r]];
      return pts;
    }
    var xu = 26, xl = 26 + (o.shift || 0), lowerSvg = '', upperSvg = '', marks = '';
    L.forEach(function(t){
      var pts = crown(xl, t[1], t[2], false, o.plunge && t[0] === '30' ? o.plunge : 0);
      lowerSvg += '<path class="io-tooth low" d="' + OD.smooth(pts, false) + 'Z"/>';
      if(t[0] === '30'){ lowerSvg += '<path class="io-groove" d="M' + f1(xl + t[1] * .4) + ' ' + f1(occ + 4) + ' L' + f1(xl + t[1] * .43) + ' ' + f1(occ + 34) + '"/>'; marks += '<circle class="io-mark2" cx="' + f1(xl + t[1] * .4) + '" cy="' + f1(occ + 6) + '" r="3.5"/>'; }
      xl += t[1] + 2;
    });
    U.forEach(function(t){
      var pts = crown(xu, t[1], t[2], true, 0);
      upperSvg += '<path class="io-tooth' + (o.resto3 && t[0] === '3' ? ' amalgam' : '') + '" d="' + OD.smooth(pts, false) + 'Z"/>';
      if(t[0] === '3') marks += '<circle class="io-mark" cx="' + f1(xu + t[1] * .25) + '" cy="' + f1(occ - 4) + '" r="4"/>';
      xu += t[1] + 2;
    });
    s += lowerSvg + upperSvg + marks;
    if(o.plane) s += '<path class="io-plane" d="M14 ' + occ + ' L426 ' + occ + '"/>';
    s += T(28, 16, 'mesial ←', 'io-lab') + T(380, 16, '→ distal', 'io-lab');
    (o.labels || []).forEach(function(l){ s += T(l[0], l[1], l[2], 'io-lab', 'middle'); });
    return '<svg class="io" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (o.aria || 'Right buccal view in MIP') + '">' + s + '</svg>';
  }
  I.buccalII = { kind:'Intraoral photo (drawn)', title:'Right buccal view in MIP', svg: buccal({ shift:30, aria:'Right buccal view: the blue dot marks the mesiobuccal cusp of #3, the red dot the buccal groove of #30', labels:[[170, 232, 'blue: MB cusp of #3   red: buccal groove of #30']] }) };
  I.buccalOver = { kind:'Intraoral photo (drawn)', title:'Right buccal view in MIP', svg: buccal({ shift:-12, plunge:16, plane:true, resto3:true, aria:'Right buccal view: the distobuccal cusp of #30 rises above the occlusal plane line into #3', labels:[[220, 232, 'dashed line: the plane of occlusion']] }) };
  /* ---------- articulating paper and shimstock on occlusal rows ---------- */
  /* marks: [ arch, toothType, kind, at ] kind 'blue' (MIP, closing) | 'red' (excursion streak from at[0] to at[1]) | 'wear' */
  function marksRow(arch, side, marks, o){
    o = o || {}; var k = o.k || 10, W = 470, r = OD.row(arch, side, { x0:o.x0 || 24, yc:o.yc || 80, k:k, W:W }), s = '<rect class="io-plate" x="0" y="0" width="' + W + '" height="' + (o.h || 160) + '" rx="14"/>' + r.svg;
    s += OD.numLabels(r, 0, arch === 'mand');
    function at(t, p){ var tt = r.teeth[t]; return typeof p === 'string' ? tt.pt[p] : tt.P(p); }
    marks.forEach(function(m){
      var t = m[0], kind = m[1];
      if(kind === 'blue'){ var p = at(t, m[2]); s += '<circle class="ap-blue' + (m[3] ? ' big' : '') + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (m[3] ? 9 : 5) + '"/>' + (m[3] ? '<circle class="ap-blue-ring" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="15"/>' : ''); }
      else if(kind === 'red'){ var a = at(t, m[2]), b = at(t, m[3]); s += '<path class="ap-red" d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]) + '"/>'; }
      else if(kind === 'wear'){ var c = at(t, m[2]); s += '<ellipse class="ap-wear" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" rx="' + (m[3] || 9) + '" ry="' + ((m[3] || 9) * .7) + '"/>'; }
      else if(kind === 'crack'){ var c1 = at(t, m[2]), c2 = at(t, m[3]); s += '<path class="ap-crack" d="M' + f1(c1[0]) + ' ' + f1(c1[1]) + 'L' + f1((c1[0] + c2[0]) / 2 + 3) + ' ' + f1((c1[1] + c2[1]) / 2 - 2) + 'L' + f1(c2[0]) + ' ' + f1(c2[1]) + '"/>'; }
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
    svg: marksRow('mand', 'L', [['M1','blue','c',1],['M1','blue','MB',1],['PM2','blue','B'],['M2','blue','MB'],['PM1','blue','B']], { yc:72, aria:'Lower left teeth with large dark marks on #19 and faint marks elsewhere' }) };
  I.marksWear = { note:'Gray = shiny, flat wear facets. The distolingual cusp of #2 is cracked. The big blue mark is the first contact when the jaw is guided closed with the joints seated.', kind:'Clinical findings (drawn)', title:'Upper right, occlusal view',
    svg: marksRow('max', 'R', [['M2','wear','ML',10],['M2','wear','DB',8],['M1','wear','ML',9],['C','wear','T',10],['M2','crack',[.62,.9],[.8,.58]],['M2','blue','m',1]], { aria:'Upper right teeth with wear facets, a cracked cusp on #2 and a first contact mark on #2' }) };
  /* ---------- periodontal chart (HTML: stays readable on phones) ----------
     rows: { teeth:['6',...], mob:[...], frem:[...], fac:[[3 depths],...], lin:[[3],...], rec:[...], bop:[[...],...], missing:['2',...] } */
  function chart(c){
    function cell(v, i, kind){ if(c.missing && c.missing.indexOf(c.teeth[i]) > -1) return '<td class="pc-miss">X</td>';
      if(kind === 'pd') return '<td class="pc-pd">' + v.map(function(n, j){ var b = c.bop && c.bop[i] && c.bop[i][j]; return '<span class="' + (n >= 5 ? 'deep' : '') + (b ? ' bop' : '') + '">' + n + '</span>'; }).join('') + '</td>';
      return '<td' + (v && v !== '0' && v !== '-' ? ' class="pc-flag"' : '') + '>' + (v == null ? '' : v) + '</td>'; }
    var h = '<div class="pchart-wrap"><table class="pchart"><thead><tr><th>Tooth</th>' + c.teeth.map(function(t){ return '<th>#' + t + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr><th>Mobility</th>' + c.mob.map(function(v, i){ return cell(String(v), i); }).join('') + '</tr>';
    if(c.frem) h += '<tr><th>Fremitus</th>' + c.frem.map(function(v, i){ return cell(v, i); }).join('') + '</tr>';
    h += '<tr><th>Probing, facial</th>' + c.fac.map(function(v, i){ return cell(v, i, 'pd'); }).join('') + '</tr>';
    h += '<tr><th>Probing, lingual</th>' + c.lin.map(function(v, i){ return cell(v, i, 'pd'); }).join('') + '</tr>';
    if(c.rec) h += '<tr><th>Recession</th>' + c.rec.map(function(v, i){ return cell(String(v), i); }).join('') + '</tr>';
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
  /* shimstock results (HTML table) */
  function shim(rows, note){ return '<div class="pchart-wrap"><table class="pchart shim"><thead><tr><th>Tooth</th><th>Light closure</th><th>Firm clench</th></tr></thead><tbody>' +
    rows.map(function(r){ return '<tr><th>#' + r[0] + '</th><td class="' + (r[1] === 'holds' ? 'sh-hold' : 'sh-pull') + '">' + r[1] + '</td><td class="' + (r[2] === 'holds' ? 'sh-hold' : 'sh-pull') + '">' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div>' + (note ? '<div class="pchart-key">' + note + '</div>' : ''); }
  I.shimImplant = { kind:'Shimstock test (12 µm)', title:'At delivery', html: shim([['29','holds','holds'],['30 (implant crown)','holds','holds'],['31','holds','holds']], 'Right lateral excursion with red articulating paper: a mark on the buccal incline of the implant crown\'s distobuccal cusp, along with the canine.') };
  I.shimUpright = { kind:'Shimstock test (12 µm)', title:'Sitting upright, tapping closed', html: shim([['18','pulls through','pulls through'],['19 (new MO composite)','holds','holds'],['20','pulls through','pulls through'],['21','pulls through','holds']]) };
  /* mounted casts, side view: o.mode 'cr' = closed on the centric latch until the first contact */
  I.castsCR = { kind:'Mounted diagnostic casts', title:'Right side, mounted in CR (centric latch locked)',
    svg: (function(){
      var w = 440, h = 250, s = '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
      s += '<rect class="ar-metal" x="60" y="20" width="330" height="22" rx="6"/><rect class="ar-metal" x="60" y="214" width="330" height="22" rx="6"/>';
      s += '<rect class="ar-metal" x="372" y="38" width="18" height="180"/><circle class="ar-joint" cx="381" cy="128" r="16"/><text class="fg-t sm" x="402" y="132">condyle</text>';
      s += '<rect class="ar-metal" x="58" y="40" width="8" height="64"/><rect class="ar-metal" x="40" y="194" width="44" height="10" rx="3"/><text class="fg-t sm" x="8" y="62">guide</text><text class="fg-t sm" x="8" y="74">pin</text>';
      s += '<path class="ar-stone" d="M90 42 L350 42 L350 92 L300 108 L90 104Z"/><path class="ar-stone" d="M90 212 L350 212 L350 160 L300 150 L90 156Z"/>';
      function row(y0, up){
        var x = 104, out = '';
        [[30,'I'],[30,'C'],[34,'P'],[34,'P'],[52,'M'],[52,'M']].forEach(function(t, i){
          var wd = t[0], e = up ? y0 : y0, r = up ? y0 - 28 : y0 + 28, d = up ? 1 : -1;
          var pts = t[1] === 'M' ? [[x, r], [x - 2, e - d * 12], [x + 4, e], [x + wd * .5, e - d * 3], [x + wd - 4, e], [x + wd + 2, e - d * 12], [x + wd, r]]
                                 : [[x, r], [x - 2, e - d * 12], [x + wd * .5, e + d * 3], [x + wd + 2, e - d * 12], [x + wd, r]];
          out += '<path class="io-tooth' + (up ? '' : ' low') + '" d="' + OD.smooth(pts, false) + 'Z"/>'; x += wd + 3;
        });
        return out;
      }
      /* closed in CR: the jaw rotates open around the condyle until the second molars touch, so the front is open */
      s += row(124, true);
      s += '<g transform="rotate(-3.2 381 128)">' + row(121, false) + '</g>';
      s += '<circle class="ap-blue big" cx="318" cy="127" r="6"/><circle class="ap-blue-ring" cx="318" cy="127" r="12"/>';
      s += '<path class="ar-metal" d="M62 104 L62 182" style="stroke-width:5"/><text class="fg-t sm" x="76" y="186">pin off the table</text>';
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Casts on an articulator in centric relation: the second molars touch first and the front teeth are apart">' + s + '</svg>';
    })() };
  /* bite registration, occlusal view of the record as it came back with the casts */
  I.recordFull = { kind:'Bite registration sent to the lab', title:'Occlusal view of the PVS record',
    svg: (function(){
      var w = 420, h = 250, s = '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
      s += '<path class="pv-body" d="M46 226 C24 120 70 26 210 22 C350 26 396 120 374 226 L322 226 C336 134 300 78 210 76 C120 78 84 134 98 226Z"/>';
      s += '<path class="pv-flash" d="M98 226 C84 134 120 78 210 76 C300 78 336 134 322 226 L292 226 C300 160 270 120 210 118 C150 120 120 160 128 226Z"/>';
      var r = rnd(9);
      for(var i = 0; i < 14; i++){ var a = Math.PI * (0.06 + i * 0.0632), cx = 210 - Math.cos(a) * 140, cy = 220 - Math.sin(a) * 160; s += '<ellipse class="pv-imp" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(9 + r() * 5) + '" ry="' + f1(6 + r() * 3) + '"/>'; }
      s += '<ellipse class="pv-prep" cx="98" cy="170" rx="14" ry="10"/>';
      s += T(210, 240, 'Full arch, untrimmed, with flash onto the palate', 'fg-t sm', 'middle') + T(98, 196, '#30 prep', 'fg-t sm', 'middle');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="A horseshoe PVS bite record covering every tooth with excess onto the palate">' + s + '</svg>';
    })() };
  /* "f" sound, side view of the lips and upper central */
  I.lipF = { kind:'Phonetics check (drawn)', title:'Patient says "fifty-five"',
    svg: (function(){
      var w = 380, h = 230, s = '<rect class="io-plate" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>';
      s += '<path class="io-lip" d="M90 40 C150 30 220 40 250 62 C262 72 258 86 240 90 C200 96 150 92 90 96Z"/>';
      s += '<path class="io-tooth" d="M170 60 C182 62 190 80 196 108 L204 146 C205 152 196 154 192 150 L174 120 C166 102 160 80 160 66Z"/>';
      s += '<path class="io-lip low" d="M80 150 C150 132 220 128 262 140 C276 146 276 166 258 174 C210 190 150 192 80 190Z"/>';
      s += '<path class="io-wet" d="M200 136 C226 134 248 136 262 142" />';
      s += '<path class="io-press" d="M188 146 C196 152 204 154 212 150"/>';
      s += T(296, 150, 'wet-dry line', 'fg-t sm') + T(214, 30, 'upper lip', 'fg-t sm') + T(240, 210, 'lower lip', 'fg-t sm') + T(100, 128, 'new crown #8', 'fg-t sm');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Side view: the incisal edge of the new crown presses into the lower lip inside the wet-dry line">' + s + '</svg>';
    })() };
  return I;
})();
function caseImgHTML(q){
  if(!q.pimg) return '';
  return '<div class="pimg-grid">' + q.pimg.map(function(k){ var c = CASE_IMG[k]; if(!c) return '';
    return '<figure class="pimg"><figcaption><b>' + escHtml(c.kind) + '</b> · ' + escHtml(c.title) + '</figcaption>' + (c.svg || c.html) + (c.note ? '<div class="pimg-cap">' + escHtml(c.note) + '</div>' : '') + '</figure>'; }).join('') +
    '</div><div class="pimg-note">Drawn for this hub to show the findings; not a patient image.</div>';
}
