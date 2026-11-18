/* The Desert ranch collection of Timmy's place (tools/figures/site/sets.mjs, COLLECTIONS, lists its eight pieces; the
   shop's catalog has the same rows): red rock mesas, saguaros, a windmill and the widest sky there is. One
   self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source into the files
   that draw it, so it may use nothing from outside itself but T. (packs/thanksgiving.mjs is the worked example and says
   what each kind of piece needs.)
   A generic Southwest ranch: adobe, wooden beams, cactus and a covered wagon, with no religious or tribal symbols.
   Never sugar (Timmy is a tooth). No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, D2 = T.D2, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var seg = T.seg, lumps = T.lumps, rng = T.rng;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  /* adobe: the lit wall, its shade, the parapet's top, the roof inside it */
  var ADB = { c: "#EBAE84", s: "#C98458", t: "#F6CFA8", r: "#D39A6C" };
  var VIGA = ["#8E5E3B", "#E2B887", "#A8744A"], WOOD = { top: K.woodLight, left: K.wood, right: K.woodShade }, THIN = { sw: 1.3, si: .8 };
  var CHILE = ["#D8322A", "#A8221F"], CACT = ["#6FAE5E", "#4F8C48", "#94CB7E"], CACTN = ["#3E6A50", "#2E5240", "#527E62"];
  function cact(o){ return o.night ? CACTN : CACT; }

  /* ------------------------------------------------------------------ shared drawing helpers --------------------- */
  /* points round a circle on the ground, each with its angle (degrees) */
  function arcP(cx, cy, r, a0, a1, n){ var out = []; for (var i = 0; i <= n; i++){ var a = a0 + (a1 - a0) * i / n, t = a * Math.PI / 180; out.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, a]); } return out; }
  /* a footprint b = [x0, y0, x1, y1] with rounded corners r = [right (x1, y0), front (x1, y1), left (x0, y1), back (x0, y0)]:
     the part you can see, from its left end round the front corner to its right end, each point with its facing */
  function frontPts(b, r){
    var x0 = b[0], y0 = b[1], x1 = b[2], y1 = b[3], out = [];
    out = out.concat(r[2] > 0 ? arcP(x0 + r[2], y1 - r[2], r[2], 135, 90, 3) : [[x0, y1, 90]]);
    out = out.concat(r[1] > 0 ? arcP(x1 - r[1], y1 - r[1], r[1], 90, 0, 6) : [[x1, y1, 90], [x1, y1, 0]]);
    out = out.concat(r[0] > 0 ? arcP(x1 - r[0], y0 + r[0], r[0], 0, -45, 3) : [[x1, y0, 0]]);
    return out;
  }
  function ringPts(b, r){
    var x0 = b[0], y0 = b[1], x1 = b[2], y1 = b[3], out = [];
    [[x1, y0, -1, 1, -90, r[0]], [x1, y1, -1, -1, 0, r[1]], [x0, y1, 1, -1, 90, r[2]], [x0, y0, 1, 1, 180, r[3]]].forEach(function(c){
      if (c[5] > 0) out = out.concat(arcP(c[0] + c[2] * c[5], c[1] + c[3] * c[5], c[5], c[4], c[4] + 90, 4)); else out.push([c[0], c[1]]);
    });
    return out;
  }
  function inset(b, r, k){ return { b: [b[0] + k, b[1] + k, b[2] - k, b[3] - k], r: r.map(function(q){ return q > 0 ? Math.max(.06, q - k) : 0; }) }; }
  function at3(list, z){ return list.map(function(q){ return [q[0], q[1], z]; }); }
  /* an adobe mass: thick walls with soft rounded corners, leaning in a little, a parapet and the flat roof inside it */
  function mass(b, z0, z1, r, o){
    o = o || {};
    var top = inset(b, r, .08), bo = frontPts(b, r), tp = frontPts(top.b, top.r), s = "", lit = [], sh = [], all = [];
    bo.forEach(function(q, i){ all.push(i); if (q[2] >= 45) lit.push(i); if (q[2] <= 45) sh.push(i); });
    var poly = function(ix){ return D(ix.map(function(i){ return [tp[i][0], tp[i][1], z1]; }).concat(ix.slice().reverse().map(function(i){ return [bo[i][0], bo[i][1], z0]; }))); };
    s += F(poly(lit), ADB.c) + F(poly(sh), ADB.s);
    /* a little weathering on the plaster: darker patches low down where the rain splashes */
    s += F(D(lit.map(function(i){ return [bo[i][0], bo[i][1], z0 + .32]; }).concat(lit.slice().reverse().map(function(i){ return [bo[i][0], bo[i][1], z0]; }))), "#C98A62", .3);
    s += O(poly(all));
    s += FO(D(at3(ringPts(top.b, top.r), z1)), o.snow ? "#FFFFFF" : ADB.t, 1.8);
    var inn = inset(top.b, top.r, .28);
    s += FO(D(at3(ringPts(inn.b, inn.r), z1 - .1)), o.snow ? "#EAF2FA" : ADB.r, 1.1);
    /* the mud roof's trowel marks */
    if (!o.snow && o.marks !== false){ var R = rng(Math.round(b[0] * 13 + b[1] * 7)), ib = inn.b; for (var i = 0; i < 5; i++){ var mx = ib[0] + .4 + R() * (ib[2] - ib[0] - 1.2), my = ib[1] + .3 + R() * (ib[3] - ib[1] - .6); s += L(D([[mx, my, z1 - .1], [mx + .5, my + .05, z1 - .1]], true), .9, "#B9805A", .6); } }
    return s;
  }
  /* a viga: a round roof beam's end poking out of a wall, along +y ("y") or +x ("x") */
  function viga(x, y, z, ax, len){
    var a = P(x, y, z), b = ax === "y" ? P(x, y + (len || .42), z) : P(x + (len || .42), y, z);
    return L(seg(a, b), 5.6) + L(seg(a, b), 3.4, VIGA[0]) + ell(b[0], b[1], 2.2, 2.4, VIGA[1], 1) + circ(b[0] + .2, b[1], .8, VIGA[2]);
  }
  /* a deep-set window: a painted frame on the wall, the jamb, the glass set back in the thick wall, a wooden lintel */
  function deepWin(face, plane, u0, u1, v0, v1, o, tr, shut){
    var on = face === "y" ? T.onY : T.onX, s = "", k = .2;
    s += FO(D(on(plane, T.rectUV(u0 - .13, u1 + .13, v0 - .12, v1 + .1))), tr.c, 1.4);
    s += FO(D(on(plane, T.rectUV(u0, u1, v0, v1))), face === "y" ? ADB.s : ADB.c, 1.1);
    var w = T.win(face, face === "y" ? plane - k : plane - k, u0, u1 - k, v0, v1 - k * .5, { night: o.night }); s += w.s;
    s += face === "y" ? box(u0 - .32, plane, v1 + .1, u1 - u0 + .64, .18, .2, WOOD, THIN) : box(plane, u0 - .32, v1 + .1, .18, u1 - u0 + .64, .2, WOOD, THIN);
    if (shut){
      var sw = (u1 - u0) * .5;
      [[u0 - .14 - sw, u0 - .14], [u1 + .14, u1 + .14 + sw]].forEach(function(q){
        s += FO(D(on(plane + (face === "y" ? .04 : .04), T.rectUV(q[0], q[1], v0 - .08, v1 + .06))), tr.c, 1.3) + L(D(on(plane + .04, [[q[0] + .08, (v0 + v1) / 2], [q[1] - .08, (v0 + v1) / 2]]), true), .9, tr.s) +
          L(D(on(plane + .04, [[(q[0] + q[1]) / 2, v0 + .1], [(q[0] + q[1]) / 2, v1 - .05]]), true), .8, tr.s, .8);
      });
    }
    return { s: s, lights: w.lights };
  }
  /* a string of dried red chiles (a ristra) hanging from (x, y) on screen, h long */
  function ristra(x, y, h, k){
    k = k || 1;
    var s = L("M" + f(x) + " " + f(y) + " v" + f(h), 1, "#8A6A3A"), n = Math.round(h / 2.6);
    for (var i = 0; i < n; i++){
      var t = i / (n - 1), yy = y + 2 + t * (h - 3), w = (1 - t * .55) * k, sd = i % 2 ? 1 : -1;
      s += '<path d="M' + f(x) + " " + f(yy) + " q" + f(sd * 3.6 * w) + " " + f(.6 * w) + " " + f(sd * 4.4 * w) + " " + f(4.2 * w) + " q" + f(-sd * 2.4 * w) + " " + f(-.6 * w) + " " + f(-sd * 4.4 * w) + " " + f(-4.2 * w) +
        ' z" fill="' + CHILE[i % 3 === 2 ? 1 : 0] + '" stroke="' + INK + '" stroke-width=".8"/>';
    }
    s += L("M" + f(x - 1.4) + " " + f(y + 1) + " h2.8", 1.2, "#5E8A3A");
    return s;
  }
  /* a saguaro in screen space: foot at (x, y), h tall; its arms are strokes with round ends, so they join the trunk */
  function saguaro(x, y, h, k, g, flip){
    var w = 6.2 * k, aw = w * .74, sd = flip ? -1 : 1, s = "";
    var ya = y - h * .48, yb = y - h * .64;
    var trunk = "M" + f(x) + " " + f(y + 1) + " V" + f(y - h + w / 2);
    var arms = "M" + f(x) + " " + f(ya) + " H" + f(x - sd * 5.4 * k) + " Q" + f(x - sd * 7.4 * k) + " " + f(ya) + " " + f(x - sd * 7.4 * k) + " " + f(ya - 2.4 * k) + " V" + f(ya - h * .27) +
      " M" + f(x) + " " + f(yb) + " H" + f(x + sd * 5 * k) + " Q" + f(x + sd * 7 * k) + " " + f(yb) + " " + f(x + sd * 7 * k) + " " + f(yb - 2.4 * k) + " V" + f(yb - h * .2);
    s += L(arms, aw + 3.2) + L(trunk, w + 3.2) + L(arms, aw, g[0]) + L(trunk, w, g[0]);
    s += L("M" + f(x + w * .27) + " " + f(y + 1) + " V" + f(y - h + w * .6), w * .34, g[1]);
    s += L("M" + f(x - w * .12) + " " + f(y) + " V" + f(y - h + w * .5) + " M" + f(x + w * .1) + " " + f(y) + " V" + f(y - h + w * .5), .7, g[1], .9);
    s += L("M" + f(x - w * .3) + " " + f(y - 2) + " V" + f(y - h + w * .7), .9, g[2], .9);
    return s;
  }
  /* a round barrel cactus, ribbed, in screen space: foot at (x, y), r wide */
  function barrel(x, y, r, g, crown){
    var top = y - r * 1.55;
    var d = "M" + f(x - r) + " " + f(y - r * .25) + " C" + f(x - r * 1.05) + " " + f(top - r * .1) + " " + f(x + r * 1.05) + " " + f(top - r * .1) + " " + f(x + r) + " " + f(y - r * .25) + " Q" + f(x + r * .9) + " " + f(y + r * .12) + " " + f(x) + " " + f(y + r * .14) + " Q" + f(x - r * .9) + " " + f(y + r * .12) + " " + f(x - r) + " " + f(y - r * .25) + " Z";
    var s = F(d, g[0]) + F("M" + f(x + r * .25) + " " + f(top + r * .2) + " C" + f(x + r * .9) + " " + f(top + r * .2) + " " + f(x + r * 1.05) + " " + f(y - r * .7) + " " + f(x + r) + " " + f(y - r * .25) + " Q" + f(x + r * .9) + " " + f(y + r * .12) + " " + f(x + r * .2) + " " + f(y + r * .14) + " Q" + f(x + r * .5) + " " + f(y - r * .6) + " " + f(x + r * .25) + " " + f(top + r * .2) + " Z", g[1]);
    [-.62, -.22, .22, .62].forEach(function(t){ s += L("M" + f(x + t * r * .35) + " " + f(top + r * .12) + " Q" + f(x + t * r * 1.2) + " " + f(y - r * .7) + " " + f(x + t * r * .9) + " " + f(y + r * .08), .8, g[1], .9); });
    for (var i = 0; i < 7; i++){ var t = -.7 + i * .23, sx = x + t * r * 1.05, sy = y - r * (.55 + .45 * Math.cos(t * 1.2)); s += L("M" + f(sx - 1) + " " + f(sy) + " l2 -1 M" + f(sx - 1) + " " + f(sy + 3) + " l2 -1", .7, "#FFF3C4"); }
    s += O(d, 1.4);
    if (crown) [-2.6, 0, 2.6].forEach(function(dx, j){ s += ell(x + dx, top + r * .12 + (j === 1 ? -.6 : 0), 1.7, 1.3, "#F2C230", .8); });
    return s;
  }
  /* a prickly pear paddle: an oval at (x, y) on screen, tipped a degrees, with spine dots */
  function paddle(x, y, w, h, a, g, fruit){
    var s = '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + f(a) + ')">' + ell(0, -h, w, h, g[0], 1.3) + '<path d="M' + f(w * .2) + " " + f(-h * 1.9) + " Q" + f(w * 1.05) + " " + f(-h) + " " + f(w * .2) + " " + f(-h * .1) + " Q" + f(w * .75) + " " + f(-h) + " " + f(w * .2) + " " + f(-h * 1.9) + ' Z" fill="' + g[1] + '"/>';
    [[-.45, -.6], [.2, -.45], [-.15, -1.1], [.5, -1.2], [-.5, -1.5], [.1, -1.7]].forEach(function(q){ s += circ(q[0] * w, h + q[1] * h - h, .55, "#FFF3C4"); });
    if (fruit) fruit.forEach(function(q){ s += ell(q * w, -h * 2 + .4, 1.5, 2, "#C2335F", .8); });
    return s + ell(0, -h, w, h, "none", 1.3).replace('fill="none"', 'fill="none"') + "</g>";
  }
  function sage(x, y, k, o){
    var c = o.night ? ["#5E6E5A", "#4B5948"] : o.snow ? ["#E9F0F6", "#CBD9E6"] : ["#AEB98F", "#8C9B74"], d = lumps(x, y - 3.4 * k, 6.4 * k, 11, 8, .62);
    return F(d, c[0]) + F(lumps(x + 1.6 * k, y - 2.6 * k, 4 * k, 13, 7, .55), c[1], .9) + O(d, 1.2) + L("M" + f(x - 2 * k) + " " + f(y + .4) + " l1 -3 M" + f(x + 2 * k) + " " + f(y + .4) + " l-.6 -2.6", .8, "#7A6A50");
  }
  function tumble(x, y, r, o){
    var c = o.night ? ["#8A7A5E", "#6E5E48"] : ["#DCBC82", "#A8844E"], cy = y - r, d = lumps(x, cy, r, 7, 10, .94), s = F(d, c[0], .7) + O(d, 1.2);
    s += L("M" + f(x - r * .7) + " " + f(cy) + " q" + f(r * .5) + " " + f(-r * .9) + " " + f(r * 1.1) + " " + f(-r * .3) + " M" + f(x - r * .4) + " " + f(cy + r * .6) + " q" + f(r * .2) + " " + f(-r * 1.2) + " " + f(r * 1) + " " + f(-r * 1.1) +
      " M" + f(x - r * .1) + " " + f(cy - r * .8) + " q" + f(r * .9) + " " + f(r * .4) + " " + f(r * .6) + " " + f(r * 1.3) + " M" + f(x - r * .8) + " " + f(cy + r * .2) + " q" + f(r * .8) + " " + f(r * .5) + " " + f(r * 1.5) + " " + f(-r * .2), .8, c[1]);
    return s;
  }
  function boulder(x, y, w, h, o){
    var c = o.night ? ["#8E5A5E", "#6E4650"] : ["#D9774B", "#B65B37"], d = "M" + f(x - w) + " " + f(y) + " Q" + f(x - w * 1.05) + " " + f(y - h) + " " + f(x - w * .2) + " " + f(y - h) + " Q" + f(x + w * .9) + " " + f(y - h * 1.05) + " " + f(x + w) + " " + f(y - h * .2) + " Q" + f(x + w) + " " + f(y + h * .25) + " " + f(x) + " " + f(y + h * .25) + " Q" + f(x - w * .8) + " " + f(y + h * .25) + " " + f(x - w) + " " + f(y) + " Z";
    return F(d, c[0]) + F("M" + f(x + w * .25) + " " + f(y - h * .95) + " Q" + f(x + w * .9) + " " + f(y - h * 1.05) + " " + f(x + w) + " " + f(y - h * .2) + " Q" + f(x + w) + " " + f(y + h * .25) + " " + f(x + w * .1) + " " + f(y + h * .25) + " Q" + f(x + w * .5) + " " + f(y - h * .3) + " " + f(x + w * .25) + " " + f(y - h * .95) + " Z", c[1]) + O(d, 1.3) +
      (o.snow ? F("M" + f(x - w * .9) + " " + f(y - h * .6) + " Q" + f(x - w * .7) + " " + f(y - h * 1.05) + " " + f(x) + " " + f(y - h) + " Q" + f(x + w * .7) + " " + f(y - h * 1.02) + " " + f(x + w * .85) + " " + f(y - h * .5) + " q" + f(-w * .9) + " " + f(-h * .2) + " " + f(-w * 1.75) + " " + f(-h * .1) + " z", "#FFFFFF") : "");
  }
  /* a lying cylinder (a barrel, a water tank) along x: ends at x0 and x1, round its middle (y, z), r: screen hull of both ends */
  function hull(pts){
    pts = pts.slice().sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
    var cr = function(o, a, b){ return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], hi = [], i;
    for (i = 0; i < pts.length; i++){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop(); lo.push(pts[i]); }
    for (i = pts.length - 1; i >= 0; i--){ while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], pts[i]) <= 0) hi.pop(); hi.push(pts[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function xRing(x, y, z, r, n, t0, t1){ var out = []; n = n || 20; t0 = t0 == null ? 0 : t0; t1 = t1 == null ? 360 : t1; for (var i = 0; i <= n; i++){ var t = (t0 + (t1 - t0) * i / n) * Math.PI / 180; out.push([x, y + Math.cos(t) * r, z + Math.sin(t) * r]); } return out; }
  function yRing(x, y, z, r, n, t0, t1){ var out = []; n = n || 20; t0 = t0 == null ? 0 : t0; t1 = t1 == null ? 360 : t1; for (var i = 0; i <= n; i++){ var t = (t0 + (t1 - t0) * i / n) * Math.PI / 180; out.push([x + Math.cos(t) * r, y, z + Math.sin(t) * r]); } return out; }

  /* ------------------------------------------------------------------ the home: an adobe ranch house ------------- */
  var homes = {
    "adobe-ranch": {
      note: "Thick round adobe walls, beams poking out under a flat roof, a shady porch and a tooth on the weathervane",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the roof", paint: "Trim paint: the door, the window frames, the shutters and the bench" },
      door: [5.5, 8.4], brush: [7.55, 9.15], statue: [3.15, 9.55], spots: { door: [6.45, 10.25] }, h: 7.8,
      eaves: [[2.8, 8.55, 3.1], [8.0, 8.55, 3.1]], foot: [2.6, 3.2, 9.6, 8.4], base: [[2.6, 8.4], [8.2, 8.4], [8.2, 7.95], [9.62, 7.95], [9.62, 3.6]], block: [2.4, 2.9, 9.8, 8.8],
      draw: function(o){
        var u = o.up, tr = (o.paint !== "cream" && T.BOLD[o.paint]) || { c: "#3FA9B5", s: "#2A808C" }, s = "", lights = "", w, i;
        var x0 = 2.6, x1 = 8.2, y0 = 3.2, y1 = 8.4, zA = 3.2, R = [.42, .42, .42, .42];
        /* the main house */
        s += mass([x0, y0, x1, y1], 0, zA, R, { snow: o.snow });
        /* the kiva chimney at the back, round, its smoke curling up */
        s += mass([6.95, 3.75, 7.75, 4.55], zA - .1, zA + 1.45, [.26, .26, .26, .26], { snow: o.snow, marks: false });
        var ct = P(7.35, 4.15, zA + 1.35); s += T.smoke(ct[0] + 1, ct[1] - 8);
        /* the upper room, set back on the roof */
        var cb = [3.0, 3.45, 5.65, 5.95], zC = 5.1;
        s += mass(cb, zA - .1, zC, [.36, .36, .36, .36], { snow: o.snow });
        w = deepWin("y", cb[3] - .04, 3.6, 4.5, 3.85, 4.65, o, tr); s += w.s; lights += w.lights;
        w = deepWin("x", cb[2] - .04, 4.15, 4.95, 3.85, 4.6, o, tr); s += w.s; lights += w.lights;
        [3.45, 4.2, 4.95].forEach(function(x){ s += viga(x, cb[3] - .1, zC - .32, "y", .38); });
        [3.95, 4.7, 5.4].forEach(function(y){ s += viga(cb[2] - .1, y, zC - .32, "x", .38); });
        /* the weathervane: a gold tooth rides the arrow, over the four little arms */
        var vb = P(4.3, 4.7, zC - .1), vt = [vb[0], vb[1] - 24];
        s += L("M" + f(vb[0]) + " " + f(vb[1]) + " V" + f(vt[1] - 2), 2.6) + L("M" + f(vb[0]) + " " + f(vb[1]) + " V" + f(vt[1] - 2), 1.1, "#8E98A3");
        var am = vb[1] - 10; s += L("M" + f(vb[0] - 6.4) + " " + f(am - 3.7) + " L" + f(vb[0] + 6.4) + " " + f(am + 3.7) + " M" + f(vb[0] + 6.4) + " " + f(am - 3.7) + " L" + f(vb[0] - 6.4) + " " + f(am + 3.7), 1.3);
        [[-6.4, -3.7], [6.4, 3.7], [6.4, -3.7], [-6.4, 3.7]].forEach(function(q){ s += circ(vb[0] + q[0], am + q[1], 1.3, K.gold, .8); });
        s += L("M" + f(vt[0] - 9) + " " + f(vt[1]) + " H" + f(vt[0] + 8), 1.6) + FO("M" + f(vt[0] + 11) + " " + f(vt[1]) + " l-4 -2.6 v5.2 z", INK, .5) + FO("M" + f(vt[0] - 9) + " " + f(vt[1]) + " l-3.4 -3.6 h3 l2.4 3.6 -2.4 3.6 h-3 z", K.gold, .9);
        s += T.tinyTooth(vt[0], vt[1] - 4.4, .62, K.gold);
        /* the front: vigas under the parapet, a deep window with shutters, the heavy door, another window */
        [3.05, 3.8, 4.55, 6.45, 7.2].forEach(function(x){ s += viga(x, y1 - .08, zA - .36, "y"); });
        w = deepWin("y", y1 - .04, 3.25, 4.05, 1.15, 2.15, o, tr, true); s += w.s; lights += w.lights;
        w = deepWin("y", y1 - .04, 6.75, 7.6, 1.15, 2.15, o, tr); s += w.s; lights += w.lights;
        /* the door, set back in the thick wall: the jamb shows down its left side */
        s += box(4.62, y1, 0, 1.76, .34, .1, { top: "#D9C7AE", left: "#BFA98C", right: "#A89276" }, THIN);
        s += FO(D(T.onY(y1 - .02, T.rectUV(4.92, 6.08, .1, 2.3))), "#B07A4E", 1.6);
        var dy = y1 - .24, dq = T.rectUV(4.92, 5.84, .1, 2.18), dw = function(pts){ return D(T.onY(dy, pts)); };
        s += FO(dw(dq), tr.c, 1.5);
        s += L(dw([[5.15, .14], [5.15, 2.14]]) .replace(" Z", "") + " " + dw([[5.38, .14], [5.38, 2.14]]).replace(" Z", "") + " " + dw([[5.61, .14], [5.61, 2.14]]).replace(" Z", ""), .9, tr.s);
        s += L(dw([[4.94, .62], [5.82, .62]]).replace(" Z", "") + " " + dw([[4.94, 1.72], [5.82, 1.72]]).replace(" Z", ""), 2.2, "#4A3E46");
        [[5.04, .62], [5.27, .62], [5.5, .62], [5.73, .62], [5.04, 1.72], [5.27, 1.72], [5.5, 1.72], [5.73, 1.72]].forEach(function(q){ var c = P(q[0], dy, q[1]); s += circ(c[0], c[1], .9, "#C9D1D9"); });
        var rg = P(5.66, dy, 1.15); s += '<circle cx="' + f(rg[0]) + '" cy="' + f(rg[1] + 2) + '" r="2" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' + circ(rg[0], rg[1], .9, INK);
        s += box(4.66, y1 - .06, 2.3, 1.7, .26, .24, WOOD, THIN);
        /* a clay pot with a little cactus by the door */
        var pt = P(6.45, y1 + .32, 0);
        s += FO("M" + f(pt[0] - 4.4) + " " + f(pt[1] - 7) + " h8.8 l-1.2 6.4 q-3.2 1.4 -6.4 0 z", "#C9603E", 1.2) + L("M" + f(pt[0] - 4.2) + " " + f(pt[1] - 5.6) + " h8.4", 1, "#9E4630") + barrel(pt[0], pt[1] - 7, 3.2, cact(o));
        /* the side: vigas, a window and a canal (the rain spout) */
        [3.85, 4.6, 5.35, 6.1, 6.85].forEach(function(y){ s += viga(x1 - .08, y, zA - .36, "x"); });
        w = deepWin("x", x1 - .04, 6.35, 7.25, 1.15, 2.1, o, tr); s += w.s; lights += w.lights;
        s += box(x1 - .1, 7.62, zA - .2, .6, .22, .12, { top: K.woodLight, left: K.wood, right: K.woodShade }, THIN);
        /* the porch down the side: a flagstone floor, posts with carved corbels, a beam and a flat roof of vigas */
        var px0 = x1 - .02, px1 = 9.62, py0 = 3.6, py1 = 7.95, pz = 2.55;
        s += box(px0, py0, 0, px1 - px0, py1 - py0, .12, { top: "#DCCAB0", left: "#C2AC8F", right: "#A89276" }, THIN);
        for (i = 1; i < 5; i++) s += L(D([[px0, py0 + i * .87, .12], [px1, py0 + i * .87 + (i % 2 ? .15 : -.1), .12]], true), .8, "#A89276");
        /* a bench against the wall */
        s += box(x1 + .02, 4.35, .55, .42, 1.6, .1, { top: tr.c, left: tr.c, right: tr.s }, THIN);
        [4.45, 5.85].forEach(function(y){ s += box(x1 + .08, y, .12, .3, .1, .43, { top: tr.s, left: tr.s, right: tr.s }, { sw: 1, si: .6 }); });
        var posts = [4.0, 5.95, 7.75];
        posts.forEach(function(y){ s += box(9.3, y - .11, .12, .22, .22, pz - .32, WOOD, THIN) + box(9.31, y - .34, pz - .36, .2, .68, .16, { top: K.woodLight, left: K.wood, right: VIGA[0] }, THIN); });
        s += box(9.24, py0 - .1, pz - .2, .3, py1 - py0 + .2, .22, { top: K.woodLight, left: K.wood, right: VIGA[0] }, THIN);
        s += box(px0, py0 - .15, pz + .02, px1 - px0 + .12, py1 - py0 + .3, .16, { top: o.snow ? "#FFFFFF" : ADB.r, left: K.wood, right: VIGA[0] }, { sw: 1.6, si: 1 });
        [4.1, 4.85, 5.6, 6.35, 7.1].forEach(function(y){ s += viga(9.7, y, pz - .02, "x", .26); });
        /* a lantern hangs under the porch roof */
        var ln = P(9.4, 5.0, pz - .2);
        s += L("M" + f(ln[0]) + " " + f(ln[1]) + " v3", 1.1) + FO("M" + f(ln[0] - 2.4) + " " + f(ln[1] + 3) + " h4.8 l-.6 6 h-3.6 z", o.night ? K.lit : "#FFF3C4", 1.1) + FO("M" + f(ln[0] - 3) + " " + f(ln[1] + 3.4) + " l3 -2.4 3 2.4 z", "#8E98A3", .9);
        if (o.night) lights += T.glowAt(ln[0], ln[1] + 6, 13) + FO("M" + f(ln[0] - 2.4) + " " + f(ln[1] + 3) + " h4.8 l-.6 6 h-3.6 z", K.litHot, 1.1);
        /* a ristra of dried red chiles on the front post */
        var rp = P(9.42, 7.98, pz - .3); s += ristra(rp[0], rp[1], 19, 1.05);
        /* the Timmy flag on the front corner of the roof */
        if (u.flag) s += T.flagOn(7.75, 7.95, zA - .05, 2.0);
        if (o.night) lights += T.firefly(132, 118, .4);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: red rock desert ---------------- */
  var scenes = {
    "red-rocks": T.hillScene({
      note: "Red mesas and saguaros under a sunset sky, and the whole Milky Way at night",
      path: "dirt", treeKind: "round", lamp: "lantern", skirt: "sand", grade: ["#FFB27A", .07], farLift: 0,
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#8E7A7E", "#806C72", "#705C64", "#574650"] : ["#F5DCAE", "#ECCB97", "#DDB07C", "#B98A58"]; },
      sky: function(o){
        if (o.night){
          var mw = F("M120 -20 Q230 26 390 52 L390 92 Q230 62 120 14 Z", "#E9E2FF", .09) + F("M130 -10 Q230 32 390 64 L390 80 Q232 50 130 4 Z", "#F4F0FF", .09);
          var R = rng(41), dots = ""; for (var i = 0; i < 46; i++){ var t = R(), x = 126 + t * 262, y = -6 + t * 66 + (R() - .5) * 26 - t * t * 10; dots += circ(x, y, R() < .2 ? .9 : .55, "#FFFFFF").replace("/>", ' opacity="' + (.45 + R() * .5).toFixed(2) + '"/>'); }
          return T.bands(["#141236", "#1C1848", "#26205A", "#332868", "#443274"], 0, 170) + mw + dots + T.starField(23, 34, 140) + T.moon(98, 36);
        }
        var hawk = L("M190 40 q4 -4 8 -1 q4 -3 8 1 M226 54 q3 -3 6 -.6 q3 -2.4 6 .6", 1.3, INK, .75);
        var streak = function(x, y, w){ return FO("M" + f(x) + " " + f(y) + " q" + f(w * .2) + " " + f(-5) + " " + f(w * .45) + " " + f(-3) + " q" + f(w * .25) + " " + f(-4) + " " + f(w * .55) + " " + f(1) + " q" + f(-w * .5) + " " + f(4) + " " + f(-w) + " " + f(2) + " z", "#FDE6DA", 1.1); };
        return T.bands(["#F2A585", "#F6B790", "#F9C79C", "#FBD7AC", "#FDE5C0"], 0, 170) + T.sun(82, 40) + streak(150, 62, 56) + streak(270, 40, 44) + T.cloud(322, 28, .72) + hawk;
      },
      far: function(o){
        var n = o.night, c = n ? { far: "#6E5878", m: "#8E5A62", ms: "#70444E", cap: "#A26E70", st: "#7A4A54" } : { far: "#F1B596", m: "#DE7A4E", ms: "#BE5C38", cap: "#EE9C6C", st: "#C4653F" }, s = "";
        var snowcap = function(d){ return o.snow ? F(d, "#FFFFFF") + L(d, 1, INK, .5) : ""; };
        /* the farthest mesas, pale with distance, just over the crest of the hill */
        s += FO("M150 96 L156 74 Q157.4 69 163 68.6 L232 68 Q237.6 68.4 239 73 L246 90 Q252 94 262 95 L262 100 Z", n ? "#5E4C6E" : "#EFC3AE", 1).replace('stroke-width="1"', 'stroke-width="1" stroke-opacity=".6"');
        /* a far pale mesa peeking between the near ones */
        s += FO("M112 130 L114 84 Q115 75.6 122 75 L170 74.4 Q176 75 177.4 80 L181 92 Q187 99 198 101 L198 140 Z", c.far, 1.2);
        s += L("M126 88 q-1 6 -2 10 M150 86 q1 6 0 12", .8, INK, .3) + snowcap("M114.4 80 Q115 75.6 122 75 L170 74.4 Q176 75 177 79 Q146 77 114.4 80 Z");
        /* the big mesa on the left: a cap rock, bands of red rock, gullies, a talus slope below */
        var big = "M26 150 L28 108 Q34 98 41 94 L44 85 Q45.4 79.4 51 79 L104 78.4 Q110 78.8 111.4 84 L114 94 Q121 105 138 112 L150 150 Z";
        s += F(big, c.m) + F("M104 78.4 Q110 78.8 111.4 84 L114 94 Q121 105 138 112 L150 150 L120 150 Q109 122 107 96 Z", c.ms);
        s += F("M42.6 90 L113 90.6 L114 94 L114.6 96 L41.6 95.4 Z", c.st, .75) + F("M40 101 L116.6 101 Q118 103 119.6 104.4 L36 104.4 Z", c.st, .55);
        s += F("M44 85 Q45.4 79.4 51 79 L104 78.4 Q110 78.8 111.4 84 Z", c.cap);
        s += L("M58 86 q-1 7 -3 13 M74 87 q1 7 -1 15 M90 86 q-1 6 0 14 M100 88 q1 6 0 10", .9, INK, .35) + O(big, 1.6) + snowcap("M44.4 84 Q45.4 79.4 51 79 L104 78.4 Q110 78.8 111 82.6 Q96 81 76 83.6 Q58 81 44.4 84 Z");
        /* a coyote on the mesa top at night, singing to the moon */
        if (n) s += '<g transform="translate(62 79.4) scale(1.5) translate(-62 -79.4)">' + FO("M60 79 l.8 -4.6 q.4 -3 3 -3.6 l1.6 -4.2 q1 -2 2.6 -1.4 l1 -3 1.2 2.8 q2 .8 1 3 l-1 3.4 q1.4 1.6 .8 5.6 h2.6 q-.6 -3 1.4 -4 q2 1 1 4 v2 z", "#2B2034", .8) + L("M65 71.6 q2.6 -1.4 3.6 -5.4 M61.6 76 q.4 -3 2.6 -4", .7, "#D9D2F0", .9) + "</g>";
        /* on the right: a tall butte and a long low mesa */
        var bt = "M280 150 Q287 118 292 106 L294.6 67 Q295.6 61 301 60.6 L318 60.4 Q323.6 61 324.4 67 L327 104 Q333 118 346 128 L346 150 Z";
        s += F(bt, c.m) + F("M318 60.4 Q323.6 61 324.4 67 L327 104 Q333 118 346 128 L346 150 L318 150 Q316 112 316.4 70 Z", c.ms);
        s += F("M294.2 74 L324.8 74 L325.4 79 L293.8 79 Z", c.st, .75) + F("M293.2 90 L325.8 90 L326.2 94 L293 94 Z", c.st, .55) + F("M294.6 67 Q295.6 61 301 60.6 L318 60.4 Q323.6 61 324.4 67 Z", c.cap);
        s += L("M302 70 q-1 8 -2 16 M311 72 q1 8 0 14", .9, INK, .35) + O(bt, 1.6) + snowcap("M294.8 65.4 Q295.6 61 301 60.6 L318 60.4 Q323.6 61 324.2 65.2 Q310 63.6 294.8 65.4 Z");
        var lo = "M330 150 L336 100 Q338 92 344 91.4 L404 90 V150 Z";
        s += F(lo, c.m) + F("M335 104 L404 103 V108 L334.4 109 Z", c.st, .7) + F("M336 100 Q338 92 344 91.4 L404 90 V96 L336.6 97 Z", c.cap) + O(lo, 1.6) + snowcap("M336.8 96 Q338 92 344 91.4 L404 90 V93 Q370 92.6 336.8 96 Z");
        return s;
      },
      flat: function(o, on){
        if (o.snow) return T.scatter(141, 10, on, function(sx, sy){ return ell(sx, sy, 2.2, 1.2, "#D6E4F1", 0); }).join("");
        var peb = o.night ? ["#7A635A", "#9C8478"] : ["#D9A57A", "#F7DDBA", "#C98A5E"];
        return T.scatter(141, 30, on, function(sx, sy, i){ return ell(sx, sy, 1.6 + (i % 3) * .5, 1, peb[i % peb.length], .6); }).join("") +
          T.scatter(142, 22, on, function(sx, sy){ return T.tuft(sx, sy, o.night ? "#5E6E5A" : "#9CAA7E", .8); }).join("") +
          T.scatter(143, 9, on, function(sx, sy, i){ return circ(sx, sy - 2, 1.6, o.night ? "#9C8FB0" : ["#F2C230", "#F28C28", "#FFFFFF"][i % 3], .6); }).join("");
      },
      props: function(o, on){
        /* set by hand round the yard, so the saguaros stand apart: [x, y on the plot, what, size] */
        var g = cact(o), out = [];
        [[-3.2, 12.6, 0, 40], [17.4, 4.2, 0, 44], [12.4, 19.6, 0, 38], [19.6, 11.4, 0, 34], [13.6, -2.4, 0, 26], [-2.8, 8.6, 3], [16.4, 15.6, 3],
          [3.2, 17.4, 1], [18.4, 8.4, 1], [8.2, 19.6, 2], [21, 6.4, 2], [16.4, .6, 4], [5.6, 19.4, 1]].forEach(function(q, i){
          var a = P(q[0], q[1], 0), sx = a[0], sy = a[1], k = q[2], s;
          if (!on(sx, sy, q[0], q[1])) return;
          if (k === 0) s = ell(sx + 1, sy + .6, 7, 2, o.night ? "#6E5852" : o.snow ? "#D6E4F1" : "#DDB07C", 0, .7) + saguaro(sx, sy, q[3], q[3] > 30 ? 1 : .8, g, i % 2) + (o.snow ? ell(sx, sy - q[3] + 1, 2.6, 1.1, "#FFFFFF", 0) : "");
          else if (k === 1) s = sage(sx, sy, 1.1, o) + sage(sx + 9, sy + 2, .8, o);
          else if (k === 2) s = boulder(sx, sy, 7, 6, o) + boulder(sx + 8, sy + 2, 4, 3.6, o);
          else if (k === 3) s = o.snow ? sage(sx, sy, 1, o) : tumble(sx, sy, 5.4, o);
          else s = barrel(sx, sy, 4.4, g, !o.snow) + barrel(sx + 7, sy + 1.6, 3, g, false) + sage(sx - 8, sy + 1, .7, o);
          out.push({ x: q[0], y: q[1], s: s });
        });
        return out;
      }
    })
  };

  /* ------------------------------------------------------------------ the yard ---------------------------------- */
  /* the windmill: its wheel faces down and to the left, the tail vane points back to the right */
  var WM = { c: [1.25, 1.2], top: 3.8, hub: [1.25 - .087 * .4, 1.2 + .996 * .4, 4.25], h: [.996, .087], d: [-.087, .996], r: 1.02 };
  function wheelPt(u, v){ return [WM.hub[0] + u * WM.h[0], WM.hub[1] + u * WM.h[1], WM.hub[2] + v]; }
  function wheelRing(r, n, a0, a1){ var out = []; n = n || 28; a0 = a0 || 0; a1 = a1 == null ? 360 : a1; for (var i = 0; i <= n; i++){ var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push(wheelPt(Math.cos(a) * r, Math.sin(a) * r)); } return out; }
  /* the wagon: a bed along x, the bonnet on hoops, big wheels behind and small in front */
  var WG = { x0: .38, x1: 3.12, y0: 1.15, y1: 2.45, zb: .7, zt: 1.32, yc: 1.8, rb: .72, rz: 1.08, fw: [.74, .5], rw: [2.72, .66], yn: 2.59, yf: 1.0 };
  function wagonWheel(cx, y, r, o, spin){
    var hubC = P(cx, y, r), s = "", i, rim = yRing(cx, y, r, r * .9, 24), tire = yRing(cx, y, r, r, 24);
    s += L(D(tire), 4.6) + L(D(tire), 2.6, "#5A5560") + L(D(rim), 2.6, o.night ? "#8A6A4E" : K.wood);
    var sp = ""; for (i = 0; i < 12; i++){ var a = (i * 30 + (spin || 0)) * Math.PI / 180, e = [cx + Math.cos(a) * r * .86, y, r + Math.sin(a) * r * .86], b = [cx + Math.cos(a) * r * .16, y, r + Math.sin(a) * r * .16]; sp += seg(P(b[0], b[1], b[2]), P(e[0], e[1], e[2])) + " "; }
    s += L(sp, 1.9) + L(sp, .8, o.night ? "#B9926A" : K.woodLight);
    s += ell(hubC[0], hubC[1], 3, 3.2, o.night ? "#8A6A4E" : K.wood, 1.2) + circ(hubC[0] + .3, hubC[1], 1.1, "#5A5560");
    return s;
  }
  var yard = {
    "cactus-garden": {
      note: "A barrel cactus, a prickly pear and a little saguaro in a bed of gravel and stones", spot: [3.35, 3.4],
      egg: { n: "The cactus garden", does: "the barrel cactus blooms", say: "It bloomed! Cacti save every drop of water. Water: my favorite drink too." }, anim: "tp-pop 2.4s",
      draw: function(o){
        var g = cact(o), c = P(1.8, 1.85, 0), s = ell(c[0] + 2, c[1] + 2, 32, 12, "#1B2A3A", 0, .1), i;
        var bed = lumps(c[0], c[1], 30, 17, 11, .55);
        var st = []; for (i = 0; i < 12; i++){ var a = i / 12 * Math.PI * 2; st.push([c[0] + Math.cos(a) * 30, c[1] + Math.sin(a) * 15.6]); }
        var stone = function(q, i){ return ell(q[0], q[1], 4.8, 3.2, o.snow ? "#E3ECF5" : i % 2 ? "#C9B7A0" : "#DDCDB6", 1.1) + (o.snow ? "" : L("M" + f(q[0] - 2.4) + " " + f(q[1] - 1.2) + " q2 -1.4 4 -.4", .8, "#FFFFFF", .7)); };
        st.forEach(function(q, i){ if (q[1] < c[1]) s += stone(q, i); });
        s += FO(bed, o.snow ? "#F7FBFF" : o.night ? "#B5A794" : "#ECDFC6", 1.4);
        if (!o.snow){ var R = rng(5); for (i = 0; i < 40; i++){ var gx = c[0] + (R() - .5) * 52, gy = c[1] + (R() - .5) * 26; if (((gx - c[0]) / 27) * ((gx - c[0]) / 27) + ((gy - c[1]) / 13.4) * ((gy - c[1]) / 13.4) < 1) s += circ(gx, gy, .7 + R() * .6, ["#C9B18E", "#F8F0DF", "#B59C7C"][i % 3]); } }
        /* the little saguaro at the back, the prickly pear on the left */
        var sg = P(2.55, .85, 0); s += saguaro(sg[0], sg[1], 30, .82, g);
        var pp = P(.75, 1.55, 0);
        s += paddle(pp[0], pp[1], 5.4, 6.6, -6, g) + paddle(pp[0] - 3, pp[1] - 11, 4.4, 5.6, -32, g, [.1]) + paddle(pp[0] + 4.4, pp[1] - 12, 4.6, 5.6, 26, g, [-.2, .5]) + paddle(pp[0] + 1, pp[1] - 22, 3.6, 4.4, 6, g, [0]);
        /* a round rock, a tiny agave, the barrel cactus out front */
        var rk = P(2.85, 2.0, 0); s += ell(rk[0], rk[1] - 2.6, 6.4, 4.6, o.night ? "#9C8478" : "#D9774B", 1.2) + F("M" + f(rk[0] + 1) + " " + f(rk[1] - 6.6) + " q5.6 .6 5.4 4 q-.4 2.4 -4 3 q2 -3.4 -1.4 -7 z", o.night ? "#7A635A" : "#B65B37");
        var ag = P(1.0, 2.75, 0); [[-6, -4], [-3, -7], [0, -8.4], [3, -7], [6, -4]].forEach(function(q){ s += FO("M" + f(ag[0] - 1.2) + " " + f(ag[1]) + " L" + f(ag[0] + q[0]) + " " + f(ag[1] + q[1]) + " L" + f(ag[0] + 1.2) + " " + f(ag[1]) + " Z", o.night ? "#5E7E78" : "#8FB8A8", .9); });
        var br = P(1.95, 2.55, 0); s += barrel(br[0], br[1], 7.8, g, true);
        st.forEach(function(q, i){ if (q[1] >= c[1]) s += stone(q, i); });
        if (o.snow) s += ell(br[0], br[1] - 11.4, 5, 1.8, "#FFFFFF", 0) + ell(sg[0], sg[1] - 30, 2.6, 1, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var br = P(1.95, 2.55, 0), x = br[0], y = br[1] - 12.4, s = "", i;
        for (i = 0; i < 9; i++){ var a = i / 9 * Math.PI * 2 - Math.PI / 2; s += '<ellipse cx="' + f(x + Math.cos(a) * 4.6) + '" cy="' + f(y - 3 + Math.sin(a) * 3.2) + '" rx="3.6" ry="2.2" transform="rotate(' + f(a * 180 / Math.PI) + " " + f(x + Math.cos(a) * 4.6) + " " + f(y - 3 + Math.sin(a) * 3.2) + ')" fill="' + (i % 2 ? "#F27BAA" : "#F79CC0") + '" stroke="' + INK + '" stroke-width="1"/>'; }
        s += circ(x, y - 3, 2.8, "#FFD5E4", .9) + circ(x - 1, y - 3.6, .7, "#F2C230") + circ(x + 1, y - 2.6, .7, "#F2C230") + circ(x + .5, y - 4.2, .6, "#F2C230") + circ(x - .6, y - 2, .6, "#F2C230");
        return s + T.dmStar(x + 9, y - 6, 2.6, "#FFFFFF", "") + T.dmStar(x - 8, y - 9, 2, "#F48FB8", "");
      }
    },
    "windmill-pump": {
      note: "A farm windmill on its lattice tower, pumping water into a round stock tank", spot: [3.4, 3.45],
      egg: { n: "The windmill", does: "the wind picks up: the wheel spins and water splashes into the tank", say: "Whoosh! Wind brings the water up from deep underground. Best drink there is for teeth." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 1.95, 0).concat([30, 11, "#1B2A3A", 0, .1])), cx = WM.c[0], cy = WM.c[1], zt = WM.top, i;
        var hw = function(z){ return .86 - (.86 - .2) * z / zt; }, leg = function(sx, sy, z){ var k = hw(z); return [cx + sx * k, cy + sy * k, z]; };
        var metal = o.night ? "#8E98A3" : "#C9D1D9", lv = [0, 1.3, 2.55, zt];
        var strut = function(a, b, w, c){ return L(D([a, b], true), w + 1.8) + L(D([a, b], true), w, c || metal); };
        var face = function(s0, s1, front){
          var out = "";
          for (var j = 0; j < 3; j++){
            var za = lv[j], zb = lv[j + 1];
            out += L(D([leg(s0[0], s0[1], za), leg(s1[0], s1[1], zb)], true) + D([leg(s1[0], s1[1], za), leg(s0[0], s0[1], zb)], true), front ? 1 : .8, INK, front ? .9 : .5);
            out += L(D([leg(s0[0], s0[1], zb), leg(s1[0], s1[1], zb)], true), front ? 1.3 : 1, INK, front ? 1 : .6);
          }
          return out;
        };
        /* the tail and the vane behind the wheel: a tooth painted on it */
        var hb = WM.hub, tail = function(t, v){ return [hb[0] - t * WM.d[0], hb[1] - t * WM.d[1], hb[2] + v]; };
        s += L(D([tail(0, 0), tail(2.0, .05)], true), 3.4) + L(D([tail(0, 0), tail(2.0, .05)], true), 1.6, metal);
        var vane = [tail(1.15, -.28), tail(2.15, -.42), tail(2.15, .56), tail(1.15, .32)];
        s += FO(D(vane), o.night ? "#A8404A" : "#D9483B", 1.4);
        var vc = P.apply(null, tail(1.66, .05)); s += T.tinyTooth(vc[0], vc[1], .62, "#FFFFFF");
        /* the tower: the far legs, the bracing, then the near legs */
        s += strut(leg(-1, -1, 0), leg(-1, -1, zt), 1.2) + face([-1, -1], [1, -1], false) + face([-1, -1], [-1, 1], false);
        s += strut(leg(1, -1, 0), leg(1, -1, zt), 1.4) + strut(leg(-1, 1, 0), leg(-1, 1, zt), 1.4);
        /* the pump rod down the middle, the pump and its spout over the tank */
        var pr = P(cx, cy, zt), pb = P(cx, cy, .95);
        s += L(seg(pr, pb), 1.2, INK, .8);
        s += cyl(cx, cy, 0, .12, .95, .1, "#7A8794", "#5E6A76", "#8E98A3", { sw: 1.2, si: .8 });
        var sp0 = P(cx, cy, .82), sp1 = P(2.32, 2.27, .82), sp2 = P(2.34, 2.29, .68);
        s += L(seg(sp0, sp1) + " L" + f(sp2[0]) + " " + f(sp2[1]), 3.2) + L(seg(sp0, sp1) + " L" + f(sp2[0]) + " " + f(sp2[1]), 1.6, "#7A8794");
        s += face([-1, 1], [1, 1], true) + face([1, -1], [1, 1], true) + strut(leg(1, 1, 0), leg(1, 1, zt), 1.5);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){ var b = P.apply(null, leg(q[0], q[1], 0)); s += ell(b[0], b[1], 2.6, 1.3, "#A9B3BE", .9); });
        /* the platform, the head and the wheel */
        s += box(cx - .32, cy - .32, zt, .64, .64, .08, WOOD, { sw: 1.2, si: .7 });
        s += box(cx - .2, cy - .26, zt + .08, .4, .52, .3, { top: "#B6BEC7", left: "#8E98A3", right: "#6E7884" }, { sw: 1.2, si: .7 });
        s += L(D([[cx, cy, hb[2]], hb], true), 3) + L(D([[cx, cy, hb[2]], hb], true), 1.4, "#8E98A3");
        var R0 = WM.r, ri = .36, bl = "";
        for (i = 0; i < 16; i++){
          var a = i * 22.5, q = function(r, da){ var t = (a + da) * Math.PI / 180; return wheelPt(Math.cos(t) * r, Math.sin(t) * r); };
          bl += FO(D([q(ri, -7), q(R0, -9.5), q(R0, 9.5), q(ri, 7)]), i % 2 ? (o.night ? "#9AA4AF" : "#DCE2E8") : (o.night ? "#7E8893" : "#B9C2CC"), .8);
        }
        s += bl + L(D(wheelRing(R0, 32)), 2.8) + L(D(wheelRing(R0, 32)), 1.2, metal) + L(D(wheelRing(ri, 16)), 1.4) + L(D(wheelRing(R0 * .68, 24)), .8, INK, .7);
        var hc = P.apply(null, hb); s += circ(hc[0], hc[1], 2.6, "#5E6A76", 1.1) + circ(hc[0] - .6, hc[1] - .6, .8, "#C9D1D9");
        /* the stock tank, galvanized, full of water */
        var tk = [2.78, 2.72], tr = .74, tz = .62, tt = P(tk[0], tk[1], tz);
        s += cyl(tk[0], tk[1], 0, tr, tz, tr, o.night ? "#9AA4AF" : "#C9D1D9", o.night ? "#7A8490" : "#A2ACB7", o.night ? "#AEB7C1" : "#E3E8ED", { sw: 1.8, si: 1 });
        for (i = 0; i < 9; i++){ var ta = (-20 + i * 22) * Math.PI / 180, a0 = P(tk[0] + Math.cos(ta) * tr, tk[1] + Math.sin(ta) * tr, .04), a1 = P(tk[0] + Math.cos(ta) * tr, tk[1] + Math.sin(ta) * tr, tz - .06); s += L(seg(a0, a1), .8, INK, .35); }
        s += ell(tt[0], tt[1] + .5, T.RX(tr) - 2.2, T.RY(tr) - 1.5, o.snow ? "#DCEFF8" : o.night ? "#3E7FA8" : K.water, 1);
        if (!o.snow) s += L("M" + f(tt[0] - 6) + " " + f(tt[1]) + " q3 -1.4 6 0 M" + f(tt[0] + 1) + " " + f(tt[1] + 2.4) + " q3 -1.4 6 0", 1, "#FFFFFF", .8);
        if (o.snow) s += ell(hc[0] - 2, hc[1] - 13, 3.4, 1.2, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var s = "", i;
        /* the wheel a blur, with speed arcs round it */
        s += F(D(wheelRing(WM.r * 1.06, 32)), "#EEF2F5", .8) + L(D(wheelRing(WM.r * 1.06, 32)), 1.4, INK, .6);
        for (i = 0; i < 4; i++) s += L(D(wheelRing(WM.r * (.42 + i * .17), 20, i * 40, i * 40 + 120), true), 1.1, INK, .5);
        s += L(D(wheelRing(WM.r * 1.3, 10, 200, 260), true) + D(wheelRing(WM.r * 1.3, 10, 20, 80), true), 1.6, INK, .8);
        var hc = P.apply(null, WM.hub); s += circ(hc[0], hc[1], 2.6, "#5E6A76", 1.1);
        /* water pours from the spout and splashes up out of the tank */
        var sp = P(2.34, 2.29, .68), wt = P(2.55, 2.5, .6), tt = P(2.78, 2.72, .62);
        s += L("M" + f(sp[0]) + " " + f(sp[1]) + " Q" + f(sp[0] + 1) + " " + f(sp[1] + 2) + " " + f(wt[0]) + " " + f(wt[1]), 3.4) + L("M" + f(sp[0]) + " " + f(sp[1]) + " Q" + f(sp[0] + 1) + " " + f(sp[1] + 2) + " " + f(wt[0]) + " " + f(wt[1]), 1.8, K.water);
        s += '<ellipse cx="' + f(tt[0]) + '" cy="' + f(tt[1] + .5) + '" rx="9" ry="4.2" fill="none" stroke="#FFFFFF" stroke-width="1.4"/>';
        [[-6, -9, 1.6], [-1, -13, 1.9], [5, -10, 1.5], [9, -6, 1.2], [-9, -4, 1.2], [2, -17, 1.1]].forEach(function(q){ s += circ(tt[0] + q[0], tt[1] + q[1], q[2], K.waterLight, .8); });
        return s;
      }
    },
    "covered-wagon": {
      note: "A wooden wagon with big spoked wheels, a canvas bonnet on its hoops and a water barrel at its side", spot: [3.4, 3.45],
      egg: { n: "The covered wagon", does: "a wheel turns and the canvas flaps in the wind", say: "Wagons, roll! Pack water and pack floss. That's all you need on the trail." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var W = WG, s = ell.apply(null, P(1.85, 1.9, 0).concat([31, 11, "#1B2A3A", 0, .1])), i, cv = o.night ? ["#D9D3C6", "#B8B0A0"] : ["#FFFDF6", "#E8E0CE"];
        /* the far wheels and the tongue, under the bed */
        s += wagonWheel(W.fw[0], W.yf, W.fw[1], o) + wagonWheel(W.rw[0], W.yf, W.rw[1], o);
        var tg0 = P(.8, W.yc, .45), tg1 = P(.06, W.yc, .1); s += L(seg(tg0, tg1), 4.4) + L(seg(tg0, tg1), 2.4, K.wood) + ell(tg1[0], tg1[1], 2.4, 1.6, "#5A5560", 1);
        var ax = function(x, z){ var a = P(x, W.yf, z), b = P(x, W.yn, z); return L(seg(a, b), 3.4) + L(seg(a, b), 1.6, K.woodShade); };
        s += ax(W.fw[0], W.fw[1]) + ax(W.rw[0], W.rw[1]);
        /* the wagon bed: boards, a brake lever */
        s += box(W.x0, W.y0, W.zb, W.x1 - W.x0, W.y1 - W.y0, W.zt - W.zb, { top: K.woodShade, left: K.wood, right: K.woodShade });
        s += L(D([[W.x0, W.y1, .91], [W.x1, W.y1, .91]], true) + D([[W.x0, W.y1, 1.12], [W.x1, W.y1, 1.12]], true) + D([[W.x1, W.y0, .91], [W.x1, W.y1, .91]], true) + D([[W.x1, W.y0, 1.12], [W.x1, W.y1, 1.12]], true), .8, K.woodShade, .9);
        [W.x0 + .55, 1.75, W.x1 - .55].forEach(function(x){ s += L(D([[x, W.y1, W.zb + .04], [x, W.y1, W.zt - .04]], true), 1.2, "#5A5560"); });
        /* the bonnet over its hoops, the ends flared out */
        var hoopX = [.3, .86, 1.42, 1.98, 2.54, 3.2], hoop = function(i, t0, t1, n){ var out = [], e = i === 0 ? -1 : i === hoopX.length - 1 ? 1 : 0; n = n || 14;
          for (var j = 0; j <= n; j++){ var t = (t0 + (t1 - t0) * j / n) * Math.PI / 180; out.push([hoopX[i] + e * .16 * Math.sin(t), W.yc + Math.cos(t) * W.rb, W.zt + Math.sin(t) * W.rz * (e ? 1.05 : 1)]); } return out; };
        var pts = []; hoopX.forEach(function(x, i){ hoop(i, 0, 180, 16).forEach(function(q){ pts.push(P(q[0], q[1], q[2])); }); });
        var hl = D2(hull(pts));
        s += F(hl, cv[0]);
        /* the shade on the canvas, low on its near side and toward the back */
        var shp = []; hoopX.forEach(function(x, i){ if (i) hoop(i, 0, 38, 4).forEach(function(q){ shp.push(P(q[0], q[1], q[2])); }); });
        s += F(D2(hull(shp)), cv[1], .8);
        for (i = 1; i < hoopX.length - 1; i++) s += L(D(hoop(i, 0, 120, 12), true), 1, o.night ? "#A8A090" : "#D6CCB6");
        s += O(hl, 1.8);
        /* the back end: the canvas drawn in round its opening */
        var rim = hoop(hoopX.length - 1, 0, 180, 18), rc = [hoopX[hoopX.length - 1] + .12, W.yc, W.zt + W.rz * .42];
        s += FO(D(rim), cv[1], 1.5);
        var op = []; for (i = 0; i <= 16; i++){ var t = i / 16 * Math.PI * 2; op.push([rc[0], rc[1] + Math.cos(t) * .26, rc[2] + Math.sin(t) * .3]); }
        s += FO(D(op), "#4A3550", 1.2);
        for (i = 0; i < 7; i++){ var t = (8 + i * 27) * Math.PI / 180, a = P(rc[0], rc[1] + Math.cos(t) * .3, rc[2] + Math.sin(t) * .34), b = P.apply(null, rim[Math.round(i * 18 / 6.6)]); s += L(seg(a, b), .8, o.night ? "#8E887C" : "#BFB6A2"); }
        /* the near wheels */
        s += wagonWheel(W.fw[0], W.yn, W.fw[1], o) + wagonWheel(W.rw[0], W.yn, W.rw[1], o);
        /* the water barrel, upright on a little shelf at its side, strapped on */
        var bc = [1.76, W.y1 + .32], bz0 = .46, bz1 = 1.34, br = .3, bw = o.night ? ["#B9926A", "#8A6A4E", "#C9A57E"] : ["#E2B887", "#C4915F", "#F2D3A8"];
        s += box(bc[0] - .36, W.y1, bz0 - .07, .72, .7, .07, WOOD, { sw: 1.1, si: .7 });
        s += cyl(bc[0], bc[1], bz0, br * .88, (bz0 + bz1) / 2, br, bw[0], bw[1], bw[0], { open: true, sw: 1.5 }) + cyl(bc[0], bc[1], (bz0 + bz1) / 2, br, bz1, br * .88, bw[0], bw[1], bw[2], { sw: 1.5, si: 1 });
        [bz0 + .15, bz1 - .14].forEach(function(z){ var pts = [], rz = br * (.88 + .12 * .34) - .01; for (var q = 0; q <= 12; q++){ var t = (-45 + q * 180 / 12) * Math.PI / 180; pts.push([bc[0] + Math.cos(t) * rz, bc[1] + Math.sin(t) * rz, z]); } s += L(D(pts, true), 1.2, "#6E6A74"); });
        [70, 110].forEach(function(dg){ var t = dg * Math.PI / 180, a0 = P(bc[0] + Math.cos(t) * br * .88, bc[1] + Math.sin(t) * br * .88, bz0 + .04), a1 = P(bc[0] + Math.cos(t) * br * 1.08, bc[1] + Math.sin(t) * br * 1.08, (bz0 + bz1) / 2), a2 = P(bc[0] + Math.cos(t) * br * .88, bc[1] + Math.sin(t) * br * .88, bz1 - .03); s += L("M" + f(a0[0]) + " " + f(a0[1]) + " Q" + f(a1[0]) + " " + f(a1[1]) + " " + f(a2[0]) + " " + f(a2[1]), .7, bw[1]); });
        var lid = P(bc[0], bc[1], bz1); s += circ(lid[0] + 1, lid[1], 1, bw[1], .7);
        if (o.snow) s += F(D2(hull(hoopX.map(function(x, i){ return hoop(i, 60, 120, 6); }).reduce(function(a, b){ return a.concat(b); }, []).map(function(q){ return P(q[0], q[1], q[2] + .04); }))), "#FFFFFF", .9);
        return s;
      },
      bits: function(o){
        var W = WG, c = P(W.rw[0], W.yn, W.rw[1]), s = "", i;
        /* the back wheel turns: a blur of spokes and two arcs to show which way */
        s += F(D(yRing(W.rw[0], W.yn, W.rw[1], W.rw[1] * .86, 24)), "#E2B887", .75) + wagonWheel(W.rw[0], W.yn, W.rw[1], o || {}, 15);
        s += L(D(yRing(W.rw[0], W.yn, W.rw[1], W.rw[1] * 1.25, 10, 100, 160), true) + D(yRing(W.rw[0], W.yn, W.rw[1], W.rw[1] * 1.25, 10, 280, 340), true), 1.6, INK, .8);
        /* the canvas flaps at the back, and the wind blows past */
        var top = P(3.36, W.yc, W.zt + W.rz * .95), lw = P(3.32, W.yc + .55, W.zt + .4);
        s += FO("M" + f(top[0]) + " " + f(top[1]) + " q8 -3 14 1 q5 3 10 0 q-3 6 -8 8 q-6 2 -10 -1 q-4 3 -" + f(top[0] + 6 - lw[0]) + " " + f(lw[1] - top[1] - 6) + " z", "#FFFDF6", 1.3);
        s += L("M" + f(top[0] + 4) + " " + f(top[1] + 3) + " q6 -2 10 1", .9, "#BFB6A2");
        s += L("M" + f(c[0] - 46) + " " + f(c[1] - 34) + " q10 -4 20 0 M" + f(c[0] - 40) + " " + f(c[1] - 24) + " q8 -3 16 0 M" + f(c[0] + 18) + " " + f(c[1] - 42) + " q8 -3 16 0", 1.3, "#FFFFFF", .9);
        return s;
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits ------------------------------- */
  var dotsIn = function(list, r, c){ return list.map(function(q){ return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (r || 1.8) + '" fill="' + (c || "#FFFFFF") + '"/>'; }).join(""); };
  var outfits = {
    "bandana": {
      note: "A red bandana with white dots, knotted at the side",
      face: p("M50 112 Q100 140 150 112 L152 124 Q128 138 116 142 L100 166 L84 142 Q72 138 48 124 Z", "#D8322A", O3) +
        '<path d="M52 118 Q100 144 148 118" fill="none" stroke="#A8221F" stroke-width="1.8"/>' +
        dotsIn([[60, 121], [72, 127], [86, 131], [114, 131], [128, 127], [140, 121], [92, 140], [108, 140], [100, 151], [96, 158], [104, 158], [79, 136], [121, 136]], 1.7) +
        dotsIn([[66, 126], [134, 126], [100, 136], [93, 147], [107, 147]], 1, "#FFFFFF") +
        p("M146 113 Q156 108 162 116 Q160 124 150 124 Q144 120 146 113 Z", "#D8322A", O3) +
        p("M156 120 Q168 122 176 134 Q166 134 158 128 Z", "#D8322A", O2) + p("M158 113 Q170 106 180 110 Q170 117 160 118 Z", "#D8322A", O2) +
        dotsIn([[153, 117], [168, 128], [171, 111]], 1.4),
      say: ["Howdy, partner! A bandana keeps out the dust. Floss keeps out the plaque.", "Red bandana, white smile. Matching set.", "Dusty trail ahead. Good thing I brushed."]
    },
    "cowboy-hat": {
      note: "A tan hat with a curled brim and a braided band",
      top: p("M20 18 C22 40 52 54 100 54 C148 54 178 40 180 18 C170 34 150 42 132 42 L68 42 C50 42 30 34 20 18 Z", "#C99A5E") +
        '<path d="M26 26 C36 40 60 47 100 47.6 C140 47 164 40 174 26" fill="none" stroke="#A87A44" stroke-width="2.2"/>' +
        p("M64 44 C60 22 66 2 82 -2 C90 -3 94 6 100 6 C106 6 110 -3 118 -2 C134 2 140 22 136 44 Q100 50 64 44 Z", "#DDB27A") +
        '<path d="M120 2 Q127 20 125 40 Q133 26 129 7 Z" fill="#C99A5E"/><path d="M100 8 Q98 22 100 35" fill="none" stroke="#B98A4E" stroke-width="2.2"/>' +
        '<path d="M80 6 Q86 14 84 24 M120 6 Q114 14 116 24" fill="none" stroke="#A87A44" stroke-width="2"/>' +
        p("M64.6 34 Q100 40 135.4 34 L136 43.6 Q100 50 64 43.6 Z", "#6B4A2B", O2) +
        (function(){ var s = ""; for (var i = 0; i < 12; i++){ var x = 68 + i * 5.6, y = 38.6 + Math.sin((x - 64) / 72 * Math.PI) * 2.8; s += '<path d="M' + f(x - 2) + " " + f(y + 2) + " l4 -4" + '" stroke="#C99A5E" stroke-width="1.8" stroke-linecap="round"/>'; } return s; })() +
        '<path d="M73 14 Q75 6 81 3" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".6"/>',
      say: ["Yeehaw! The fastest flosser in the West.", "Howdy! This hat's for shade. Enamel doesn't tan.", "Saddle up, partner. Ten questions before sundown."]
    },
    "sheriff-vest": {
      note: "A stitched leather vest with a gold star badge, a tooth in its middle",
      face: p("M50.6 108 Q62 103 76 109 L97 156.9 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 108 Z", "#8A5A3A", O3) +
        p("M149.4 108 Q138 103 124 109 L103 156.9 Q120 156 135 143 Q140 132 146.6 131 Q149.6 121 149.4 108 Z", "#8A5A3A", O3) +
        '<path d="M55 112 Q63 108 73 112 L91.6 151.6 M145 112 Q137 108 127 112 L108.4 151.6" fill="none" stroke="#E8C9A0" stroke-width="1.4" stroke-dasharray="3 2.4"/>' +
        p("M66 105.4 Q72 106 76 109 L81.6 121 Q73 117 66 105.4 Z", "#A87048", O2) + p("M134 105.4 Q128 106 124 109 L118.4 121 Q127 117 134 105.4 Z", "#A87048", O2) +
        '<path d="M58 138 h12" stroke="#5E3A22" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="88.6" cy="131" r="2" fill="#E8C9A0" stroke="' + INK + '" stroke-width="1.2"/><circle cx="93.2" cy="141.4" r="2" fill="#E8C9A0" stroke="' + INK + '" stroke-width="1.2"/>' +
        (function(){ var cx = 125, cy = 132, s = "", d = ""; for (var i = 0; i < 10; i++){ var a = Math.PI / 5 * i - Math.PI / 2, q = i % 2 ? 5.6 : 13; d += (i ? " L" : "M") + f(cx + q * Math.cos(a)) + " " + f(cy + q * Math.sin(a)); }
          s += '<path d="' + d + ' Z" fill="#F2C94C" stroke="' + INK + '" stroke-width="2"/>';
          for (i = 0; i < 5; i++){ var b = Math.PI * 2 / 5 * i - Math.PI / 2; s += '<circle cx="' + f(cx + 13.6 * Math.cos(b)) + '" cy="' + f(cy + 13.6 * Math.sin(b)) + '" r="2.4" fill="#F2C94C" stroke="' + INK + '" stroke-width="1.4"/>'; }
          s += '<circle cx="' + cx + '" cy="' + cy + '" r="5.6" fill="#FFF0B3" stroke="#C9971C" stroke-width="1.2"/>' + T.tinyTooth(cx, cy + .3, .74, "#FFFFFF");
          return s + '<path d="M' + (cx - 6) + " " + (cy - 4) + ' l2 -2.4" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>'; })(),
      say: ["There's a new sheriff in town. Plaque has till sundown to leave.", "Sheriff Timmy. This smile is under my protection.", "The star has a tooth on it. Law, order and floss."]
    }
  };

  return { k: "desert", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
