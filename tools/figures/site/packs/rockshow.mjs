/* The Rock show collection of Timmy's place (tools/figures/site/sets.mjs, COLLECTIONS, lists its eight pieces; the
   shop's catalog has the same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS)
   and pastes its source into tools/preview/design/place.js, so it may use nothing from outside itself but T.
   Structure: packs/thanksgiving.mjs.

   Black, red, teal and lightning yellow: a record shop with a giant record on its roof, a festival field with the stage
   lit up at night, a band tee, a leather jacket and an electric guitar, an amp stack, a drum kit and a little stage.
   Every logo is a tooth; no brands, no band names, no lettering. No ids, gradients, filters, text, images or emoji. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var JET = ["#4A4452", "#3A3542", "#2A2631"], RED = ["#E5484D", "#B8323A"], TEAL = ["#2FB3AE", "#1F8783"], YEL = ["#FFD23F", "#E0A91C"], PINK = ["#F25CA2", "#C93C80"];
  var CHROME = ["#E3E7EB", "#B9C2CC"], CYM = ["#F0C752", "#C99A26"], HEAD = "#F7F1E6", WHT = "#FFFDF6";
  function m(x, y){ return f(x) + " " + f(y); }
  /* a lightning bolt in screen space, about 10k tall, its middle at (x, y) */
  function bolt(x, y, k, fill, sw){
    k = k || 1;
    var q = function(a, b){ return m(x + a * k, y + b * k); };
    return FO("M" + q(1.6, -5.4) + " L" + q(-2.8, .6) + " L" + q(-.2, .6) + " L" + q(-1.8, 5.4) + " L" + q(2.8, -1) + " L" + q(.2, -1) + " Z", fill || YEL[0], sw == null ? .9 : sw);
  }
  /* an eighth note in screen space */
  function note(x, y, two, col){
    return ell(x, y, 2.3, 1.7, col || INK, col ? .9 : 0) + L("M" + m(x + 2, y) + " v-7.4" + (two ? " l5.4 -1.4 v7.4" : " q3 .8 3.2 3.6"), 1.4) + (two ? ell(x + 5.4, y - 1.4, 2.3, 1.7, col || INK, col ? .9 : 0) : "");
  }
  /* points round a circle on a wall plane (face "y": the plane y = pl, u along x; face "x": x = pl, u along y) */
  function ring(face, pl, uc, vc, r, n, a0, a1){
    var out = [], k = n || 28, s0 = a0 == null ? 0 : a0, s1 = a1 == null ? 360 : a1;
    for (var i = 0; i <= k; i++){ if (i === k && s1 - s0 >= 360) break; var t = (s0 + (s1 - s0) * i / k) * Math.PI / 180, u = uc + Math.cos(t) * r, v = vc + Math.sin(t) * r; out.push(face === "y" ? [u, pl, v] : [pl, u, v]); }
    return out;
  }
  /* a drawing made in screen units on a wall: face "y" (the wall turned left, the plane y = pl) or "x" (turned right,
     x = pl), its local origin at (u, v) on that wall, local x along the wall, local y down it */
  function onWall(face, pl, u, v, svg, k){
    var c = face === "y" ? P(u, pl, v) : P(pl, u, v);
    return '<g transform="matrix(' + (face === "y" ? ".866 .5" : ".866 -.5") + " 0 1 " + m(c[0], c[1]) + ')"' + ">" + (k ? '<g transform="scale(' + k + ')">' + svg + "</g>" : svg) + "</g>";
  }
  /* a small electric guitar standing up, neck to the top, about 44 tall (a sign, a guitar on a stand) */
  function upGuitar(body, guard){
    var s = '<path d="M-1.7 -1 V-23 H1.7 V-1 Z" fill="#C98E58" stroke="' + INK + '" stroke-width="1.6"/><path d="M-1 -2 V-22.4 H1 V-2 Z" fill="#6B4128"/>' +
      '<path d="M-2.4 -22.4 L-3.2 -29.6 Q0 -31.6 3.2 -29.6 L2.4 -22.4 Z" fill="#2B2630" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<path d="M-3.4 -24.4 h-1.6 M-3.6 -27.4 h-1.6 M3.4 -24.4 h1.6 M3.6 -27.4 h1.6" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M-2.6 -1.6 C-3 -6 -5.6 -8.4 -7.2 -6.2 C-9.8 -2.6 -9.4 1.8 -7.6 4.4 C-10.6 7.6 -10 13.6 -5.6 15.4 C-2 16.8 2 16.8 5.6 15.4 C10 13.6 10.6 7.6 7.6 4.4 C9.4 1.8 9.6 -2.4 8 -5 C6.6 -7.4 3.6 -6.2 2.6 -1.6 Z" fill="' + body + '" stroke="' + INK + '" stroke-width="1.8"/>' +
      '<path d="M1 3 C4 3 7.4 5 7.4 9 C7.4 12.4 4 14 1 12.6 Z" fill="' + (guard || WHT) + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M-2.6 3.4 h5.2 M-2.6 7 h5.2" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/><path d="M-2 10.8 h4" stroke="#D5DBE1" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M-.5 -21 V10.4 M.5 -21 V10.4" stroke="#F4F4F4" stroke-width=".35" opacity=".9"/>' +
      '<path d="M-6.4 -3 C-6.4 -5 -5.4 -6 -4.6 -6" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>';
    return s;
  }
  /* the convex hull of screen points, as a closed path */
  function hull(pts){
    pts = pts.slice().sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
    var cr = function(o, a, c){ return (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]); }, lo = [], hi = [], i;
    for (i = 0; i < pts.length; i++){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop(); lo.push(pts[i]); }
    for (i = pts.length - 1; i >= 0; i--){ while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], pts[i]) <= 0) hi.pop(); hi.push(pts[i]); }
    return T.D2 ? T.D2(lo.slice(0, -1).concat(hi.slice(0, -1))) : "M" + lo.slice(0, -1).concat(hi.slice(0, -1)).map(function(q){ return m(q[0], q[1]); }).join(" L") + " Z";
  }
  /* a line in two strokes, ink under color */
  function rod(d, w, col){ return L(d, w + 1.6) + L(d, w, col); }
  /* a coiled cable from screen point a to b, n loops of radius r */
  function coil(a, b, n, r){
    var d = "", k = n * 14;
    for (var i = 0; i <= k; i++){ var t = i / k, th = t * n * Math.PI * 2, x = a[0] + (b[0] - a[0]) * t - Math.sin(th) * r, y = a[1] + (b[1] - a[1]) * t + (1 - Math.cos(th)) * r * .55; d += (i ? " L" : "M") + m(x, y); }
    return d;
  }
  /* a string of pennants in screen space from (x0, y0) to (x1, y1), sagging; lit bulbs between them at night */
  function bunting(x0, y0, x1, y1, sag, n, night, k){
    k = k || 1;
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + sag, s = L("M" + m(x0, y0) + " Q" + m(cx, cy) + " " + m(x1, y1), .9 * k, INK, .85), cols = night ? ["#B3466A", "#C9A83E", "#2E8C88", "#7A5CB0"] : [PINK[0], YEL[0], TEAL[0], "#9B7BE0"], i;
    var at = function(t){ var a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; return [a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]; };
    for (i = 0; i < n; i++){
      var A = at((i + .15) / n), B = at((i + .85) / n), C = at((i + .5) / n);
      s += FO("M" + m(A[0], A[1]) + " L" + m(B[0], B[1]) + " L" + m(C[0], C[1] + 5.4 * k) + " Z", cols[i % 4], .7 * k);
      if (night && i){ var Q = at(i / n); s += circ(Q[0], Q[1] + .6, 3.6 * k, "#FFE9A8", 0).replace("/>", ' opacity=".35"/>') + circ(Q[0], Q[1] + .6, 1.3 * k, "#FFF6CF", .5); }
    }
    return s;
  }
  /* a little dome tent in screen space, its door flap open */
  function tent(x, y, w, col, night){
    var h = w * .62, c = night ? [col[2], col[3]] : [col[0], col[1]];
    var d = "M" + m(x - w / 2, y) + " Q" + m(x - w / 2, y - h * 1.3) + " " + m(x, y - h) + " Q" + m(x + w / 2, y - h * 1.3) + " " + m(x + w / 2, y) + " Z";
    return ell(x + 2, y + .6, w * .62, w * .16, "#1B2A3A", 0, .12) + FO(d, c[0], 1.2) + F("M" + m(x + w * .1, y - h * 1.02) + " Q" + m(x + w / 2, y - h * 1.3) + " " + m(x + w / 2, y) + " L" + m(x + w * .22, y) + " Z", c[1], .9) +
      FO("M" + m(x - w * .16, y) + " Q" + m(x - w * .06, y - h * .7) + " " + m(x + w * .02, y - h * .74) + " Q" + m(x + w * .1, y - h * .5) + " " + m(x + w * .16, y) + " Z", night ? "#FFD98A" : "#3B2E3A", .9) +
      L("M" + m(x - w * .3, y - h * .52) + " Q" + m(x, y - h * 1.04) + " " + m(x + w * .3, y - h * .52), .7, INK, .45);
  }

  /* ------------------------------------------------------------------ the home: a record shop ---------------------- */
  /* a record sleeve, s px square, its art in white on its color; rec: a record peeking out of it, its label that color */
  function sleeve(sz, col, art, rec){
    var h = sz / 2, s = "";
    if (rec) s += circ(h * .55, -h * .1, h * .92, "#1E1A24", .8) + circ(h * .55, -h * .1, h * .3, rec, 0);
    s += '<path d="M' + m(-h, -h) + " h" + f(sz) + " v" + f(sz) + " h" + f(-sz) + ' z" fill="' + col + '" stroke="' + INK + '" stroke-width=".9"/>';
    if (art === "dot") s += circ(0, 0, h * .56, "#FFFFFF", .7) + circ(0, 0, h * .18, col, 0);
    else if (art === "bolt") s += bolt(0, 0, h * .17, YEL[0], .7);
    else if (art === "stripe") s += L("M" + m(-h, -h * .3) + " h" + f(sz) + " M" + m(-h, h * .3) + " h" + f(sz), 1.3, "#FFFFFF", .9);
    else if (art === "tooth") s += T.tinyTooth(0, .3, h * .19, "#FFFFFF");
    else if (art === "star") s += T.star5(0, 0, h * .62, "#FFFFFF");
    else if (art === "tri") s += FO("M" + m(-h * .55, h * .45) + " L" + m(0, -h * .55) + " L" + m(h * .55, h * .45) + " Z", "#FFFFFF", .7);
    else if (art === "wave") s += L("M" + m(-h * .7, 0) + " q" + m(h * .35, -h * .6) + " " + m(h * .7, 0) + " q" + m(h * .35, h * .6) + " " + m(h * .7, 0), 1.3, "#FFFFFF");
    return s;
  }
  var homes = {
    "record-shop": {
      note: "A two-story record shop: a giant record on the roof, striped awnings, sleeves in the window and a guitar sign",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the roof", paint: "Shopfront paint" },
      door: [5.5, 8.4], brush: [7.6, 9.2], statue: [3.1, 9.6], spots: { door: [6.45, 10.25] }, h: 11.4,
      eaves: [[2.65, 8.55, 6.5], [8.35, 8.55, 6.5]], foot: [2.8, 3.6, 8.2, 8.4], base: [[2.8, 8.4], [8.2, 8.4], [8.2, 3.6]], block: [2.6, 3.4, 8.5, 8.9],
      draw: function(o){
        var u = o.up, pk = o.paint && o.paint !== "cream" ? o.paint : "";
        var wp = pk && T.PAINTS[pk] ? T.PAINTS[pk] : { c: "#E9876B", s: "#C4664F" }, ac = pk && T.BOLD[pk] ? T.BOLD[pk] : { c: TEAL[0], s: TEAL[1] }, s = "", lights = "";
        var x0 = 2.8, x1 = 8.2, y0 = 3.6, y1 = 8.4, zf0 = 3.3, zf1 = 3.95, zw = 6.5, i, z, q;
        var onY = function(a, b, c, d, pl){ return D(T.onY(pl == null ? y1 : pl, T.rectUV(a, b, c, d))); };
        var onX = function(a, b, c, d, pl){ return D(T.onX(pl == null ? x1 : pl, T.rectUV(a, b, c, d))); };
        /* the walls, the shaded side first, with brick courses */
        s += FO(D([[x1, y0, 0], [x1, y1, 0], [x1, y1, zw], [x1, y0, zw]]), wp.s);
        for (z = .36; z < zw - .1; z += .36) s += L(D([[x1, y0, z], [x1, y1, z]], true), .6, INK, .13);
        s += FO(D([[x0, y1, 0], [x1, y1, 0], [x1, y1, zw], [x0, y1, zw]]), wp.c);
        for (z = .36; z < zw - .1; z += .36) s += L(D([[x0, y1, z], [x1, y1, z]], true), .6, INK, .11);
        s += L(D([[x1, y1, .05], [x1, y1, zw]], true), 1.4, "#FFFFFF", .35);
        /* the side wall: gig posters, pasted up a little crooked, and a window upstairs */
        var poster = function(w, h, col, art, tilt){
          var g = '<g transform="rotate(' + tilt + ')"><path d="M' + m(-w / 2, -h / 2) + " h" + f(w) + " v" + f(h) + " h" + f(-w) + ' z" fill="' + col + '" stroke="' + INK + '" stroke-width="1.2"/>';
          if (art === 0) g += circ(0, -h * .14, w * .26, YEL[0], .8) + L("M" + m(-w * .3, h * .26) + " h" + f(w * .6) + " M" + m(-w * .3, h * .38) + " h" + f(w * .4), 1.1, "#FFFFFF", .9);
          else if (art === 1) g += bolt(0, -h * .04, w * .12, RED[0], .8);
          else if (art === 2) g += T.star5(0, -h * .08, w * .34, YEL[0]) + L("M" + m(-w * .3, h * .32) + " h" + f(w * .6), 1.1, "#FFFFFF", .9);
          else g += T.tinyTooth(0, -h * .1, w * .065, "#FFFFFF") + L("M" + m(-w * .3, h * .3) + " h" + f(w * .6), 1.4, RED[0]);
          return g + '<circle cx="0" cy="' + f(-h / 2 + 1.2) + '" r=".7" fill="' + INK + '"/></g>';
        };
        [[4.45, 1.25, 10, 14, PINK[0], 0, -3], [5.55, 1.45, 9, 15, YEL[0], 1, 2], [6.6, 1.15, 10, 13, "#9B7BE0", 2, -2], [7.65, 1.5, 9, 13, "#3B3644", 3, 3]].forEach(function(t){ s += onWall("x", x1, t[0], t[1], poster(t[2], t[3], t[4], t[5], t[6])); });
        var w = T.win("x", x1, 4.35, 5.55, 4.5, 5.85, { night: o.night }); s += w.s; lights += w.lights;
        /* the fascia over the shopfront, round the corner: a tooth between two notes */
        s += FO(onX(y0, y1 + .04, zf0, zf1, x1 + .03), ac.s, 1.3) + FO(onY(x0 - .04, x1 + .03, zf0, zf1, y1 + .04), ac.c, 1.4);
        s += onWall("y", y1 + .04, 5.5, (zf0 + zf1) / 2, T.tinyTooth(0, .4, .66, "#FFFFFF") + note(-11, 2.4, true, "#FFFFFF") + note(9, 2.6, false, "#FFFFFF") + circ(-26, 0, .9, YEL[0], .5) + circ(24, 0, .9, YEL[0], .5));
        s += onWall("x", x1 + .03, 6.0, (zf0 + zf1) / 2, note(-6, 2.4, true, "#FFFFFF") + circ(8, 0, .9, YEL[0], .5) + circ(-16, 0, .9, YEL[0], .5));
        /* the shop windows: record sleeves on a shelf, lit at night */
        var shop = function(a, b, v0, v1, list){
          var g = FO(onY(a - .1, b + .1, v0 - .1, v1 + .1), WHT, 1.5) + FO(onY(a, b, v0, v1), o.night ? K.lit : "#463C55", 1.1);
          g += L(D(T.onY(y1, [[a, v0 + .32], [b, v0 + .32]]), true), 1.6, "#8A6A4A");
          list.forEach(function(t){ g += onWall("y", y1, t[0], t[1], sleeve(t[2], t[3], t[4], t[5])); });
          if (!o.night) g += T.HI(D(T.onY(y1, [[a + .12, v1 - .25], [a + .5, v1 - .62]]), true), 1.4);
          return g;
        };
        s += shop(3.0, 4.7, .35, 2.35, [[3.34, 1.66, 6.4, "#9B7BE0", "stripe"], [3.95, 1.62, 6.4, PINK[0], "dot", RED[0]], [4.48, 1.66, 4.4, TEAL[0], "wave"],
          [3.28, .98, 6.4, YEL[0], "bolt"], [3.92, .98, 6.4, RED[0], "tooth"], [4.48, .98, 6.4, "#3FA7E0", "star"]]);
        s += shop(6.4, 7.9, .9, 2.35, [[6.72, 1.84, 6, TEAL[0], "tri", YEL[0]], [7.4, 1.86, 5.6, PINK[0], "star"], [6.75, 1.46, 6.2, YEL[0], "dot"], [7.42, 1.48, 6.2, "#3ECF9E", "wave"]]);
        if (o.night){ q = P(3.6, y1, 1.4); lights += T.glowAt(q[0], q[1], 11); q = P(7.3, y1, 1.7); lights += T.glowAt(q[0], q[1], 9); }
        /* the door, a round window in it, its step and a lamp over it */
        s += FO(onY(4.95, 6.05, 0, 2.62), WHT, 1.5) + FO(onY(5.05, 5.95, 0, 2.52), ac.s, 1.4);
        s += L(onY(5.2, 5.8, .25, 1.05), .8, INK, .4);
        var pw = T.porthole("y", y1, 5.5, 1.72, .27, { night: o.night }); s += pw.s;
        if (o.night){ q = P(5.5, y1, 1.72); lights += T.glowAt(q[0], q[1], 4.6); }
        q = P(5.82, y1, 1.12); s += circ(q[0], q[1], 1, CHROME[0], .8);
        s += box(4.85, y1, 0, 1.3, .42, .14, { top: "#E6E1EA", left: K.stone, right: K.stoneShade }, { sw: 1.3, si: .8 });
        q = P(5.5, y1 + .05, 3.02); s += L("M" + m(q[0], q[1] - 1) + " v2.4", 1.1) + FO("M" + m(q[0] - 2.4, q[1] + 1.4) + " h4.8 l-1 3 h-2.8 z", o.night ? K.lit : "#FFE9A8", .9);
        if (o.night) lights += T.glowAt(q[0], q[1] + 3, 6);
        /* striped awnings over both windows, scalloped along the front */
        var awning = function(a, b){
          var zt = 3.26, zb = 3.0, yo = y1 + .52, n = Math.max(3, Math.round((b - a) / .3)), ww = (b - a) / n, g = "", k;
          for (k = 0; k < n; k++) g += F(D([[a + k * ww, y1, zt], [a + (k + 1) * ww, y1, zt], [a + (k + 1) * ww, yo, zb], [a + k * ww, yo, zb]]), k % 2 ? WHT : ac.c);
          if (o.snow) g += F(D([[a, y1, zt], [b, y1, zt], [b, y1 + .34, zt - .17], [a, y1 + .34, zt - .17]]), "#FFFFFF");
          g += O(D([[a, y1, zt], [b, y1, zt], [b, yo, zb], [a, yo, zb]]), 1.4);
          g += FO(D([[b, y1, zt], [b, yo, zb], [b, yo, zb - .26], [b, y1, zb - .05]]), ac.s, 1.2);
          for (k = 0; k < n; k++){
            var A = P(a + k * ww, yo, zb), B = P(a + (k + 1) * ww, yo, zb);
            g += FO("M" + m(A[0], A[1]) + " L" + m(B[0], B[1]) + " L" + m(B[0], B[1] + 2.4) + " Q" + m((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 5.8) + " " + m(A[0], A[1] + 2.4) + " Z", k % 2 ? WHT : ac.c, 1);
          }
          return g;
        };
        s += awning(2.9, 4.82) + awning(6.28, 8.04);
        /* upstairs: two windows with sills, a round record sign between them */
        [[3.55, 4.75], [6.25, 7.45]].forEach(function(t){
          var ww = T.win("y", y1, t[0], t[1], 4.5, 5.95, { night: o.night }); s += ww.s; lights += ww.lights;
          s += box(t[0] - .12, y1, 4.32, t[1] - t[0] + .24, .18, .12, { top: WHT, left: WHT, right: "#E3DCCB" }, { sw: 1.1, si: .7 });
        });
        q = P(5.5, y1, 5.2); s += circ(q[0], q[1], 6.4, "#1E1A24", 1.3) + circ(q[0], q[1], 4.3, "none", 0).replace('fill="none"', 'fill="none" stroke="#4E4858" stroke-width=".8"') + circ(q[0], q[1], 2.2, RED[0], .7) + circ(q[0], q[1], .5, INK);
        /* the cornice and the flat roof */
        s += box(x0 - .15, y0 - .15, zw, x1 - x0 + .3, y1 - y0 + .3, .3, { top: o.snow ? "#FFFFFF" : "#5E5566", left: WHT, right: "#E3DCCB" }, { sw: 1.6, si: 1 });
        if (o.snow) s += L(D([[x0, y0 + .1, zw + .3], [x1 - .1, y0 + .1, zw + .3]], true), 1, "#DCEAF6");
        /* a flag, or a vent, at the back corner */
        if (u.flag) s += T.flagOn(7.8, 4.0, zw + .3, 2.0);
        else s += cyl(7.7, 4.1, zw + .3, .2, zw + .85, .2, CHROME[0], CHROME[1], "#8E98A3", { sw: 1.3, si: .8 });
        /* the guitar sign on its bracket off the side wall, hung in the plane y = ys */
        var ys = 7.55, gu = 9.05, arm = [[x1, ys, 6.42], [9.5, ys, 6.42]];
        s += rod(D(arm, true), 1.6, "#3B2E3A") + rod(D([[x1, ys, 5.75], [8.8, ys, 6.42]], true), 1, "#3B2E3A");
        q = P(gu, ys, 6.42); var q2 = P(gu, ys, 6.2); s += L("M" + m(q[0], q[1]) + " L" + m(q2[0], q2[1]), 1.1);
        s += onWall("y", ys, gu, 5.0, upGuitar(YEL[0], RED[0]), .64);
        /* the giant record on the roof, on two struts */
        var rc = [5.5, 6.25, 9.15], R = 2.25;
        [4.55, 6.45].forEach(function(t){ s += box(t - .08, rc[1] - .3, zw + .3, .16, .16, 1.9, { top: "#8E98A3", left: CHROME[0], right: CHROME[1] }, { sw: 1.1, si: .6 }); });
        s += L(D([[4.5, rc[1] - .25, zw + 1.0], [6.5, rc[1] - .25, zw + 1.0]], true), 2.6) + L(D([[4.5, rc[1] - .25, zw + 1.0], [6.5, rc[1] - .25, zw + 1.0]], true), 1.2, CHROME[1]);
        s += FO(D(ring("y", rc[1] - .16, rc[0], rc[2], R, 36)), "#141118", 1.6);
        s += FO(D(ring("y", rc[1], rc[0], rc[2], R, 36)), "#25212B", 1.8);
        [1.95, 1.7, 1.45, 1.2].forEach(function(r, k){ s += L(D(ring("y", rc[1], rc[0], rc[2], r, 30)), .7, k % 2 ? "#3E3946" : "#4E4858"); });
        s += L(D(ring("y", rc[1], rc[0], rc[2], 1.85, 12, 110, 170), true), 2.2, "#FFFFFF", .32) + L(D(ring("y", rc[1], rc[0], rc[2], 1.45, 8, 120, 160), true), 1.6, "#FFFFFF", .22);
        s += FO(D(ring("y", rc[1], rc[0], rc[2], .82, 24)), o.night ? "#FF7A9C" : RED[0], 1.2) + F(D(ring("y", rc[1], rc[0], rc[2], .58, 20)), o.night ? "#FFC2D2" : "#FF8F93");
        q = P(rc[0], rc[1], rc[2]); s += T.tinyTooth(q[0], q[1] - 1.6, .62, "#FFFFFF") + circ(q[0], q[1] + 4.2, .9, "#141118");
        if (o.snow){ var top = ring("y", rc[1] + .02, rc[0], rc[2], R + .06, 14, 32, 148), bot = ring("y", rc[1] + .02, rc[0], rc[2], R - .34, 14, 148, 32); s += FO(D(top.concat(bot)), "#FFFFFF", 1.1); }
        if (o.night){
          var nr = D(ring("y", rc[1], rc[0], rc[2], R + .1, 36));
          lights += L(nr, 6, "#FF5FB0", .35) + L(nr, 1.6, "#FFC2E4") + T.glowAt(q[0], q[1], 12);
          lights += T.firefly(130, 150, .3) + T.firefly(272, 128, 1.4);
        }
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: a festival field ------------------ */
  var HT = T.HILL_TOP, SDX = -22, SDY = -10;     // the stage is drawn round x 326 and moved here, clear of the picture's edge
  function stage(o){ return T.T(SDX, SDY, stageAt(o)); }
  function stageAt(o){
    var nt = o.night, s = "", i, x;
    var blk = nt ? "#1E1B26" : "#2E2A36", blk2 = nt ? "#2E2A38" : "#45404F", tr = nt ? "#8E98A3" : "#C9D1D9";
    /* the canopy and the backdrop */
    s += FO("M286 56 Q326 30 366 56 Z", nt ? "#3A3448" : "#5E5566", 1.4) + L("M296 50 Q326 36 356 50", 1, "#FFFFFF", .3);
    s += FO("M306 60 H346 V96 H306 Z", nt ? "#7A4FC8" : "#7A4FC0", 1.2) + bolt(326, 76, 1.9, nt ? "#FFF3B0" : YEL[0], 1);
    if (nt) s += F("M300 62 L352 62 L366 98 L286 98 Z", "#FFE9A8", .16) + F("M326 62 L346 98 L306 98 Z", "#FFFFFF", .12);
    /* the truss: two towers and the beam across */
    [[296, 302], [350, 356]].forEach(function(t){
      s += L("M" + t[0] + " 100 V54 M" + t[1] + " 100 V54", 1.2, INK) + L("M" + t[0] + " 100 V54 M" + t[1] + " 100 V54", .6, tr);
      var d = ""; for (var y = 100; y > 56; y -= 5) d += "M" + t[0] + " " + y + " L" + t[1] + " " + (y - 2.5) + " L" + t[0] + " " + (y - 5);
      s += L(d, .5, INK, .7);
    });
    var bd = ""; for (x = 292; x < 360; x += 4) bd += "M" + x + " 59 L" + (x + 2) + " 54 L" + (x + 4) + " 59";
    s += L("M290 54 H362 M290 59 H362", 1.4) + L("M290 54 H362 M290 59 H362", .6, tr) + L(bd, .5, INK, .7);
    /* banners hanging inside the towers, lights on the beam */
    s += FO("M304 60 h7 v18 l-3.5 -3 -3.5 3 z", PINK[0], .9) + FO("M341 60 h7 v18 l-3.5 -3 -3.5 3 z", TEAL[0], .9);
    for (i = 0; i < 6; i++) s += circ(298 + i * 11, 61.4, 1.7, nt ? ["#FFE9A8", "#FFB3DA", "#A8F0EC"][i % 3] : "#3B2E3A", .5);
    /* the speaker towers either side */
    [[276, 290], [362, 376]].forEach(function(t){
      for (var k = 0; k < 3; k++){ var y0 = 102 - (k + 1) * 11; s += FO("M" + t[0] + " " + y0 + " H" + t[1] + " V" + (y0 + 11) + " H" + t[0] + " Z", blk, 1) + circ((t[0] + t[1]) / 2, y0 + 5.5, 3.4, blk2, .6) + circ((t[0] + t[1]) / 2, y0 + 5.5, 1.2, "#6B6275"); }
    });
    /* the deck, and the band on it */
    s += FO("M292 96 H360 V106 H292 Z", blk, 1.2) + F("M292 96 H360 V98 H292 Z", nt ? "#4A4458" : "#6B6275");
    s += circ(316, 89, 2, nt ? "#C9B0E8" : "#FFD9C2", .5) + L("M316 91 v5", 1.6, INK) + L("M313 93 l7 -1.6", 1.4, RED[0]);
    s += ell(332, 92, 4, 3, nt ? "#C9C1B4" : "#F7F1E6", .6) + L("M327 88 h10", .8, CYM[0]) + circ(337, 89, 2, nt ? "#C9B0E8" : "#FFE27A", .5) + L("M337 91 v5", 1.6, INK);
    return s;
  }
  function crowd(o){
    var R = T.rng(77), s = "", cols = o.night ? ["#B9A0D8", "#8FC9C6", "#D9A0B8", "#C9C08E", "#E6E0EA"] : ["#F2735E", "#FFD23F", TEAL[0], "#9B7BE0", "#FFFFFF", PINK[0]];
    for (var row = 0; row < 7; row++) for (var x = 246 + (row % 2) * 1.8; x < 372; x += 3.4){
      var y = 98 + row * 3.4 + R() * 1.4, xx = x + R() * 1.2;
      if (y > HT(xx) - 1.4) continue;
      s += circ(xx, y, 1.3, cols[(row * 7 + Math.round(x)) % cols.length], 0);
      if (R() < .16) s += L("M" + m(xx, y - 1) + " l" + (R() < .5 ? -1.4 : 1.4) + " -3", .8, cols[(row + 2) % cols.length]);
      if (o.night && R() < .1) s += circ(xx, y - 3.4, 1.8, "#FFE9A8", 0).replace("/>", ' opacity=".5"/>');
    }
    return s;
  }
  var scenes = {
    "festival-field": T.hillScene({ farLift: 0,
      note: "A festival field: a big stage with speaker towers, pennant bunting and tents; the stage lights sweep the sky at night",
      path: "dirt", treeKind: "round", lamp: "lantern", grade: ["#FFD6EC", .05],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#4F8460", "#467855", "#3D6B4B", "#2F5A3D"] : ["#ADD98C", "#9CCD7C", "#88BE6A", "#68A352"]; },
      sky: function(o){
        if (o.night){
          var s = T.bands(["#170F3A", "#21164E", "#2E1F64", "#41297A"], 0, 300) + T.starField(17, 20, 110);
          /* the stage lights fan up into the sky */
          [[298, -40, "#FF6FB5"], [309, -20, "#FFE9A8"], [320, -4, "#7FF0E4"], [331, 12, "#FFE9A8"], [342, 28, "#7FF0E4"], [353, 44, "#FF6FB5"]].forEach(function(b){
            var a = b[1] * Math.PI / 180, len = 130, w = .09, bx = b[0] + SDX, by = 58 + SDY, x1 = bx + Math.sin(a - w) * len, y1 = by - Math.cos(a - w) * len, x2 = bx + Math.sin(a + w) * len, y2 = by - Math.cos(a + w) * len;
            s += F("M" + m(bx - 1.5, by) + " L" + m(x1, y1) + " L" + m(x2, y2) + " L" + m(bx + 1.5, by) + " Z", b[2], .24);
          });
          return s + T.moon(78, 40);
        }
        return T.bands(["#A9DCF7", "#BDE5F9", "#D2EEFB", "#E7F6FC"], 0, 300) + T.sun(76, 42) + T.cloud(242, 16, .66) + T.cloud(146, 18, .55);
      },
      far: function(o){
        var c = o.snow ? ["#EEF5FB", "#DCEAF6"] : o.night ? ["#3D6A52", "#345C47"] : ["#C4E6A8", "#B0DA92"], s = "";
        s += F("M0 124 Q60 104 130 112 Q200 92 280 104 Q330 92 400 100 V300 H0 Z", c[0]) + L("M0 124 Q60 104 130 112 Q200 92 280 104 Q330 92 400 100", 1.4, INK, .5);
        /* tents on the far left, bunting to the stage */
        var tc = [[TEAL[0], TEAL[1], "#2E7C78", "#22605D"], ["#F28C28", "#C96A12", "#A86A3A", "#86522C"], [PINK[0], PINK[1], "#A04A78", "#7E3A5E"], [YEL[0], YEL[1], "#B59A3A", "#8E7A2C"]];
        [[54, 118, 16, 0], [76, 114, 13, 2], [96, 110, 12, 3], [64, 124, 14, 1]].forEach(function(t){ s += tent(t[0], t[1], t[2], tc[t[3]], o.night); });
        s += L("M48 112 V80 M118 104 V76", 2.4) + L("M48 112 V80 M118 104 V76", 1.1, WHT) + bunting(48, 81, 118, 77, 9, 7, o.night, .8);
        s += stage(o);
        s += crowd(o);
        return s;
      },
      flat: function(o, on){
        if (o.snow) return "";
        var tc = o.night ? "#3B6E48" : "#68A352";
        return T.scatter(161, 36, on, function(sx, sy){ return T.tuft(sx, sy, tc, .8); }).join("") +
          T.scatter(162, 16, on, function(sx, sy, i){ return circ(sx, sy, 1.8, o.night ? "#9C8FB0" : ["#FFFFFF", "#FFE27A", "#FF8FB1", "#B08CFF"][i % 4], .7); }).join("") +
          T.scatter(163, 10, on, function(sx, sy, i){ return '<path d="M' + m(sx, sy) + ' l2.6 .9 -.9 2.6 -2.6 -.9 z" fill="' + (o.night ? ["#A8577A", "#C9C08E", "#4F8A88"] : [PINK[0], YEL[0], TEAL[0]])[i % 3] + '"/>'; }).join("");
      },
      props: function(o, on){
        var tc = [[TEAL[0], TEAL[1], "#2E7C78", "#22605D"], ["#F28C28", "#C96A12", "#A86A3A", "#86522C"], [PINK[0], PINK[1], "#A04A78", "#7E3A5E"], ["#9B7BE0", "#6E50B8", "#5E4A8A", "#4A3A6E"]];
        return T.scatter(164, 9, on, function(sx, sy, i, R, x, y){
          var k = i % 3, s;
          if (k === 0) s = tent(sx, sy, 22, tc[(i / 3 | 0) % 4], o.night);
          else if (k === 1) s = L("M" + m(sx - 13, sy) + " v-17 M" + m(sx + 13, sy + 3) + " v-17", 2.6) + L("M" + m(sx - 13, sy) + " v-17 M" + m(sx + 13, sy + 3) + " v-17", 1.2, WHT) + bunting(sx - 13, sy - 16.4, sx + 13, sy - 13.4, 3, 5, o.night, .9);
          else {
            /* a feather flag on its pole */
            var col = [PINK, TEAL, YEL, RED][(i / 3 | 0) % 4], fl = "M" + m(sx, sy - 4) + " V" + f(sy - 30) + " Q" + m(sx + 8, sy - 31) + " " + m(sx + 8, sy - 22) + " Q" + m(sx + 7, sy - 12) + " " + m(sx, sy - 6) + " Z";
            s = ell(sx + 1, sy, 4, 1.4, "#1B2A3A", 0, .12) + L("M" + m(sx, sy) + " V" + f(sy - 31), 2.4) + L("M" + m(sx, sy) + " V" + f(sy - 31), 1, "#D5DBE1") +
              G("tp-flag", FO(fl, o.night ? col[1] : col[0], 1) + L("M" + m(sx + 2.4, sy - 27) + " Q" + m(sx + 5.4, sy - 22) + " " + m(sx + 3, sy - 10), 1.4, WHT, .8));
          }
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  /* grille cloth on a front (+y) face: a weave of thin lines */
  function grille(a, b, y, v0, v1, col){
    var s = FO(D(T.onY(y, T.rectUV(a, b, v0, v1))), col || "#7A6C62", 1), d = "", t;
    for (t = v0 + .1; t < v1 - .02; t += .1) d += D(T.onY(y, [[a, t], [b, t]]), true);
    for (t = a + .1; t < b - .02; t += .1) d += D(T.onY(y, [[t, v0], [t, v1]]), true);
    return s + L(d, .45, "#5A4E48", .55);
  }
  /* a lattice truss between two points on the yard, its cross-section spanned by e1 and e2 (the faces shown) */
  function truss(a, b, e1, e2, n, col){
    var add = function(p, e, k){ return [p[0] + e[0] * k, p[1] + e[1] * k, p[2] + e[2] * k]; }, mix = function(t, e, k){ return add([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], e, k); };
    var e12 = [e1[0] + e2[0], e1[1] + e2[1], e1[2] + e2[2]], chords = "", zig1 = [], zig2 = [], i;
    [[0, 0, 0], e1, e2, e12].forEach(function(e){ chords += D([add(a, e, 1), add(b, e, 1)], true); });
    for (i = 0; i <= n; i++){ zig1.push(i % 2 ? mix(i / n, e12, 1) : mix(i / n, e1, 1)); zig2.push(i % 2 ? mix(i / n, e12, 1) : mix(i / n, e2, 1)); }
    var zz = D(zig1, true) + D(zig2, true);
    return L(chords, 2.4) + L(zz, 1.6) + L(chords, 1.1, col) + L(zz, .7, col);
  }
  /* how far to turn a spotlight hung at screen point c so it points at the little stage's mic */
  function aim(c){ var mk = P(1.7, 1.75, .9); return -Math.atan2(mk[0] - c[0], mk[1] - c[1]) * 180 / Math.PI; }
  var yard = {
    "amp-stack": {
      note: "Two stacked guitar amps: grille cloth, a row of knobs and a cable coiled out to a pedal", spot: [3.3, 3.4],
      egg: { n: "The amp stack", does: "it thumps and sound waves ripple out", say: "Turn it up! Then turn it down a bit. Look after your ears like you look after me." }, anim: "tp-pop 2.4s",
      draw: function(o){
        var s = ell.apply(null, P(1.8, 1.7, 0).concat([26, 9, "#1B2A3A", 0, .1])), X0 = .75, Y0 = .9, W = 2.0, Dp = 1.1, H1 = 1.7, yf = Y0 + Dp, i, q;
        var tol = { top: JET[0], left: JET[1], right: JET[2] };
        /* the cabinet: grille cloth, metal corners, a tooth badge */
        s += box(X0, Y0, 0, W, Dp, H1, tol);
        s += grille(X0 + .13, X0 + W - .13, yf, .14, H1 - .14);
        [[X0, .0], [X0 + W, .0], [X0, H1], [X0 + W, H1]].forEach(function(c){ var u0 = c[0] === X0 ? X0 : X0 + W - .2, v0 = c[1] ? H1 - .2 : 0; s += FO(D(T.onY(yf, T.rectUV(u0, u0 + .2, v0, v0 + .2))), CHROME[0], .8); });
        q = P(X0 + .45, yf, H1 - .42); s += T.tinyTooth(q[0], q[1], .5, WHT);
        if (o.snow) s += F(D([[X0, Y0, H1], [X0 + W, Y0, H1], [X0 + W, yf, H1], [X0, yf, H1]]), "#FFFFFF");
        /* the head on top: a gold panel with a row of knobs, a red jewel, its own grille, a handle */
        var hx = X0 + .14, hy = Y0 + .12, hw = W - .28, hd = Dp - .2, hz = H1, hh = .95, yh = hy + hd;
        s += box(hx, hy, hz, hw, hd, hh, tol);
        s += grille(hx + .1, hx + hw - .1, yh, hz + .1, hz + .5, "#8A7A6E");
        s += FO(D(T.onY(yh, T.rectUV(hx + .08, hx + hw - .08, hz + .58, hz + .86))), CYM[0], 1);
        for (i = 0; i < 6; i++){ q = P(hx + .26 + i * .21, yh, hz + .72); s += circ(q[0], q[1], 1.35, "#1E1A24", .5) + L("M" + m(q[0], q[1]) + " l.4 -1", .6, "#FFFFFF"); }
        q = P(hx + hw - .22, yh, hz + .72); s += circ(q[0], q[1], 1.3, o.night ? "#FF8A8A" : RED[0], .6);
        var h0 = P(hx + .55, hy + hd / 2, hz + hh), h1 = P(hx + hw - .55, hy + hd / 2, hz + hh);
        s += L("M" + m(h0[0], h0[1]) + " q" + m((h1[0] - h0[0]) / 2, -4) + " " + m(h1[0] - h0[0], h1[1] - h0[1]), 3.4) + L("M" + m(h0[0], h0[1]) + " q" + m((h1[0] - h0[0]) / 2, -4) + " " + m(h1[0] - h0[0], h1[1] - h0[1]), 1.6, "#5E5566");
        if (o.snow) s += F(D([[hx, hy, hz + hh], [hx + hw, hy, hz + hh], [hx + hw, yh, hz + hh], [hx, yh, hz + hh]]), "#FFFFFF");
        /* the cable from the jack to a pedal on the grass, coiled */
        var j = P(X0 + W - .28, yf + .02, H1 - .3), g0 = P(X0 + W - .1, yf + .45, 0), ped = P(.95, 2.75, .2);
        s += L("M" + m(j[0], j[1]) + " Q" + m(j[0] + 4, j[1] + 8) + " " + m(g0[0], g0[1]), 2.4) + L("M" + m(j[0], j[1]) + " Q" + m(j[0] + 4, j[1] + 8) + " " + m(g0[0], g0[1]), 1, RED[0]);
        var cd = coil(g0, [ped[0] + 6, ped[1] + 1], 4, 1.7); s += L(cd, 2.4) + L(cd, 1, RED[0]);
        s += box(.55, 2.45, 0, .55, .62, .2, { top: "#9DE36A", left: "#7CC74A", right: "#5A9A32" }, { sw: 1.3, si: .8 });
        q = P(.82, 2.85, .2); s += circ(q[0], q[1], 1.5, CHROME[0], .8); q = P(.72, 2.6, .2); s += circ(q[0], q[1], .9, "#1E1A24", .5);
        return s;
      },
      lights: function(){ var q = P(.89 + 2.0 - .28 - .22, 1.02 + .9 - .2 + .2, 1.7 + .72); return T.glowAt(q[0], q[1], 6); },
      bits: function(){
        var s = "", i;
        /* rings of sound off the cabinet and the head, one after another */
        [[P(1.75, 2.0, .85), [15, 21, 27], 148, 212], [P(1.75, 1.92, 2.05), [13, 18], 156, 204]].forEach(function(w, j){
          w[1].forEach(function(r, n){
            var d = "";
            for (var k = 0; k <= 10; k++){ var a = (w[2] + (w[3] - w[2]) * k / 10) * Math.PI / 180; d += (k ? " L" : "M") + m(w[0][0] + Math.cos(a) * r, w[0][1] + Math.sin(a) * r * .9); }
            s += '<g class="tp-twinkle" style="animation-delay:' + f(n * .28 + j * .14) + 's">' + L(d, 3.2) + L(d, 1.6, n % 2 ? TEAL[0] : YEL[0]) + "</g>";
          });
        });
        var b0 = P(.75, 2.0, .05), b1 = P(2.75, .9, .05);
        s += L("M" + m(b0[0] - 3, b0[1] - 2) + " l-4 1 M" + m(b0[0] - 2, b0[1] + 2) + " l-4 2.6 M" + m(b1[0] + 3, b1[1] - 1) + " l4.4 -.6 M" + m(b1[0] + 2, b1[1] + 3) + " l4 1.8", 1.6);
        var t = P(2.2, 1.3, 3.0); return s + note(t[0] + 6, t[1] - 4, false, YEL[0]) + note(t[0] - 10, t[1] - 10, true, TEAL[0]);
      }
    },
    "drum-kit": {
      note: "A drum kit: a bass drum with a tooth on its head, two toms, a snare, a floor tom, a hi-hat, a cymbal and sticks", spot: [3.35, 3.4],
      egg: { n: "The drum kit", does: "the sticks bounce and the cymbal shakes", say: "Ba-dum-tss! Why do molars keep the beat? Great roots, steady rhythm." }, anim: "tp-jump 1.8s",
      draw: function(o){
        var s = ell.apply(null, P(1.8, 1.8, 0).concat([30, 10, "#1B2A3A", 0, .1])), sh = [TEAL[0], TEAL[1]], hd = o.snow ? "#FFFFFF" : HEAD, q, i;
        var stand = function(x, y, z){ var b = P(x, y, 0), t = P(x, y, z); return L("M" + m(b[0] - 4, b[1] + 1.4) + " L" + m(b[0], b[1] - 4) + " L" + m(b[0] + 4, b[1] + 1.4) + " M" + m(b[0], b[1] + 2) + " L" + m(b[0], b[1] - 4), 1.3) + rod("M" + m(b[0], b[1] - 3) + " L" + m(t[0], t[1]), 1, CHROME[1]); };
        var cymbal = function(x, y, z, r, tilt){ var c = P(x, y, z), rx = T.RX(r), ry = T.RY(r) * .8; return '<g transform="translate(' + m(c[0], c[1]) + ") rotate(" + tilt + ')">' + ell(0, .8, rx, ry, CYM[1], 1.2) + ell(0, 0, rx, ry, CYM[0], 1.2) + ell(0, 0, rx * .62, ry * .62, "none", 0).replace('fill="none"', 'fill="none" stroke="' + CYM[1] + '" stroke-width=".7"') + ell(0, -.6, rx * .2, ry * .3, CYM[1], .8) + L("M" + m(-rx * .7, -ry * .2) + " q" + m(rx * .2, -ry * .5) + " " + m(rx * .5, -ry * .62), 1, "#FFF6CF", .8) + "</g>"; };
        /* the hi-hat at the back left, the crash at the back right */
        s += stand(.4, 1.25, 1.95) + cymbal(.4, 1.25, 1.84, .42, -4) + cymbal(.4, 1.25, 1.98, .42, -4);
        s += stand(2.95, .65, 2.6) + cymbal(2.95, .65, 2.62, .56, -14);
        /* the bass drum, lying on its side, its front head toward us with a tooth on it */
        var bx = 1.7, yb = 1.3, yfr = 2.15, bz = .78, br = .76;
        var back = ring("y", yb, bx, bz, br, 28).map(function(t){ return P(t[0], t[1], t[2]); }), front = ring("y", yfr, bx, bz, br, 28).map(function(t){ return P(t[0], t[1], t[2]); });
        s += FO(hull(back.concat(front)), sh[1], 1.6) + F(hull(back.concat(front.filter(function(t, k){ return k < 8 || k > 21; }))), sh[0], .9);
        s += FO(D(ring("y", yfr, bx, bz, br, 28)), CHROME[0], 1.5) + FO(D(ring("y", yfr + .01, bx, bz, br - .1, 28)), hd, 1.1);
        q = P(bx, yfr, bz); s += circ(q[0], q[1], 6.2, RED[0], 1) + T.tinyTooth(q[0], q[1] + .4, .78, "#FFFFFF");
        for (i = 0; i < 8; i++){ var lp = ring("y", yfr - .2, bx, bz, br + .02, 8)[i]; var lq = P(lp[0], lp[1], lp[2]); s += circ(lq[0], lq[1], .9, CHROME[0], .5); }
        var sp1 = P(bx - .55, yfr - .1, .35), sp2 = P(bx + .55, yfr - .1, .35);
        s += L("M" + m(sp1[0], sp1[1]) + " l-4 6 M" + m(sp2[0], sp2[1]) + " l4 6", 1.4);
        /* the toms on top, the floor tom on its legs */
        s += L(D([[1.7, 1.7, 1.5], [1.7, 1.7, 1.8]], true), 2.4) + L(D([[1.7, 1.7, 1.5], [1.7, 1.7, 1.8]], true), 1, CHROME[1]);
        s += cyl(1.32, 1.62, 1.62, .36, 2.0, .36, sh[0], sh[1], hd, { sw: 1.4, si: 1 }) + cyl(2.12, 1.56, 1.66, .38, 2.06, .38, sh[0], sh[1], hd, { sw: 1.4, si: 1 });
        [[2.75, 1.65], [3.35, 1.75], [3.0, 2.35]].forEach(function(t){ var a = P(t[0], t[1], .45), b = P(t[0] + (t[0] - 3.02) * .2, t[1] + (t[1] - 1.92) * .2, 0); s += rod("M" + m(a[0], a[1]) + " L" + m(b[0], b[1]), .9, CHROME[1]); });
        s += cyl(3.02, 1.92, .45, .46, 1.3, .46, sh[0], sh[1], hd, { sw: 1.5, si: 1 });
        q = P(3.02, 1.92, .88); s += L("M" + m(q[0] - T.RX(.46), q[1]) + " q" + m(T.RX(.46), 5) + " " + m(T.RX(.46) * 2, 0), .9, CHROME[0]);
        /* the snare out front on its stand, two sticks lying across it */
        var sn = [.85, 2.75];
        s += stand(sn[0], sn[1], .95) + cyl(sn[0], sn[1], .95, .4, 1.22, .4, CHROME[0], CHROME[1], hd, { sw: 1.4, si: 1 });
        q = P(sn[0], sn[1], 1.22);
        s += rod("M" + m(q[0] - 7, q[1] - 1.6) + " L" + m(q[0] + 7, q[1] + 2.2), 1.3, K.woodLight) + rod("M" + m(q[0] - 6, q[1] + 2.4) + " L" + m(q[0] + 6.4, q[1] - 2.2), 1.3, K.woodLight);
        if (o.snow) s += ell(q[0], q[1] - .4, 4, 1.6, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var q = P(.85, 2.75, 1.22), c = P(2.95, .65, 2.62), s = "";
        /* the sticks bounce up off the snare, spinning */
        s += rod("M" + m(q[0] - 9, q[1] - 11) + " L" + m(q[0] - 3, q[1] - 27), 1.6, K.woodLight) + circ(q[0] - 3, q[1] - 27, 1.4, K.woodLight, .8);
        s += rod("M" + m(q[0] + 4, q[1] - 12) + " L" + m(q[0] + 14, q[1] - 25), 1.6, K.woodLight) + circ(q[0] + 14, q[1] - 25, 1.4, K.woodLight, .8);
        s += L("M" + m(q[0] - 12, q[1] - 22) + " q-3 4 -1 8 M" + m(q[0] + 18, q[1] - 18) + " q3 4 0 8", 1.2, INK, .8);
        s += L("M" + m(q[0] - 8, q[1] - 4) + " l-3.4 -2 M" + m(q[0] + 8, q[1] - 4) + " l3.4 -2 M" + m(q[0], q[1] - 6) + " v-3.4", 1.4);
        s += '<g class="tp-twinkle">' + L("M" + m(c[0] - 13, c[1] - 6) + " q-3 5 0 10 M" + m(c[0] - 17, c[1] - 8) + " q-4 7 0 14 M" + m(c[0] + 13, c[1] - 8) + " q3 5 0 10 M" + m(c[0] + 17, c[1] - 10) + " q4 7 0 14", 1.6) + "</g>";
        return s + T.dmStar(c[0] + 4, c[1] - 12, 4, YEL[0], "") + T.dmStar(c[0] - 6, c[1] - 15, 2.6, "#FFFFFF", "");
      }
    },
    "tour-stage": {
      note: "A little stage under a truss frame: two spotlights, a backdrop with a tooth on it, a mic stand and a monitor speaker", spot: [3.4, 3.45],
      egg: { n: "The little stage", does: "the lights sweep and confetti falls", say: "Thank you, good night! Brush before bed, and I'll see you at the encore." }, anim: "tp-pop 2.8s",
      draw: function(o){
        var s = ell.apply(null, P(1.75, 1.6, 0).concat([32, 11, "#1B2A3A", 0, .1])), X0 = .2, Y0 = .25, W = 2.9, Dp = 2.4, H = .55, yf = Y0 + Dp, tr = o.night ? "#AEB8C2" : "#D5DBE1", i, q;
        /* the back towers and the beam across, the backdrop hanging from it */
        var tw = .22, zt = 3.4, e1 = [tw, 0, 0], e2 = [0, tw, 0];
        s += truss([X0 + .1, Y0 + .1, H], [X0 + .1, Y0 + .1, zt], e1, e2, 12, tr) + truss([X0 + W - .32, Y0 + .1, H], [X0 + W - .32, Y0 + .1, zt], e1, e2, 12, tr);
        s += FO(D(T.onY(Y0 + .4, T.rectUV(X0 + .5, X0 + W - .5, H + .9, zt - .05))), o.night ? "#B0407A" : PINK[0], 1.4);
        s += L(D(T.onY(Y0 + .4, [[X0 + .5, H + 1.05], [X0 + W - .5, H + 1.05]]), true), 1.2, PINK[1]);
        q = P(X0 + W / 2, Y0 + .4, (H + .9 + zt) / 2 + .1); s += T.tinyTooth(q[0] - 3.4, q[1] + .6, 1.35, "#FFFFFF") + bolt(q[0] + 6.6, q[1] + .4, 1.3, YEL[0], .9);
        s += truss([X0 + .1, Y0 + .1, zt], [X0 + W - .1, Y0 + .1, zt], [0, tw, 0], [0, 0, tw], 16, tr);
        /* the deck: a black skirt, a board floor, a row of bulbs along its edge */
        s += box(X0, Y0, 0, W, Dp, H, { top: o.snow ? "#FFFFFF" : "#8A6A52", left: JET[1], right: JET[2] });
        if (!o.snow) for (i = 1; i < 7; i++) s += L(D([[X0 + i * W / 7, Y0, H], [X0 + i * W / 7, yf, H]], true), .7, "#6B4F3C", .8);
        for (i = 0; i < 9; i++){ q = P(X0 + .18 + i * (W - .36) / 8, yf, H - .17); s += circ(q[0], q[1], 1.15, o.night ? K.litHot : "#FFF3C4", .5); }
        /* steps up the side */
        s += box(X0 + W, 1.45, 0, .44, .8, .19, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.2, si: .8 }) + box(X0 + W, 1.45, .19, .22, .8, .18, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.2, si: .8 });
        /* a guitar on its stand, stage left */
        q = P(.72, 1.25, H); s += L("M" + m(q[0] - 3, q[1] + 1) + " L" + m(q[0], q[1] - 7) + " L" + m(q[0] + 3, q[1] + 1), 1.2);
        s += onWall("y", 1.25, .72, H + .82, upGuitar(RED[0]), .5);
        /* the mic stand and its cable */
        var mb = P(1.7, 1.75, H), mt = P(1.7, 1.75, H + 1.7);
        s += L("M" + m(mb[0] - 3.4, mb[1] + 1.2) + " L" + m(mb[0], mb[1] - 2.4) + " L" + m(mb[0] + 3.4, mb[1] + 1.2), 1.3) + rod("M" + m(mb[0], mb[1] - 2) + " L" + m(mt[0], mt[1]), 1, CHROME[1]);
        s += '<g transform="translate(' + m(mt[0], mt[1]) + ') rotate(24)">' + FO("M-1.3 -1 h2.6 v5.4 q-1.3 1 -2.6 0 z", "#2E2A36", .9) + ell(0, -2.6, 2.1, 2.5, CHROME[0], 1) + L("M-1.4 -3.2 h2.8 M-1.6 -2 h3.2", .5, INK, .6) + "</g>";
        s += L("M" + m(mt[0] + 1, mt[1] + 5) + " q2 14 -1 " + f(mb[1] - mt[1] - 3) + " q6 3 12 1", 1.1, INK, .85);
        /* the monitor wedge at the front edge, its grille turned up to the singer */
        var a = 1.3, b = 2.1, w0 = 2.0, w1 = 2.55, zb = H, zl = H + .22, zh = H + .5;
        s += FO(D([[b, w0, zb], [b, w1, zb], [b, w1, zh], [b, w0, zl]]), JET[2], 1.3) + FO(D([[a, w1, zb], [b, w1, zb], [b, w1, zh], [a, w1, zh]]), JET[1], 1.3);
        s += FO(D([[a, w0, zl], [b, w0, zl], [b, w1, zh], [a, w1, zh]]), JET[0], 1.3);
        var gd = ""; for (i = 1; i < 6; i++) gd += D([[a + .08, w0 + (w1 - w0) * i / 6, zl + (zh - zl) * i / 6], [b - .08, w0 + (w1 - w0) * i / 6, zl + (zh - zl) * i / 6]], true);
        s += L(gd, .7, "#8A7A6E");
        /* the spotlights clamped to the beam, aimed at the mic */
        var spot = function(x){ var c = P(x, Y0 + .32, zt - .05), rot = aim(c); return L("M" + m(c[0], c[1] - 2) + " v3", 1.4) + '<g transform="translate(' + m(c[0], c[1] + 1.4) + ") rotate(" + rot + ')">' + L("M-3 -.6 q3 -2.8 6 0", 1.2) + FO("M-2.3 0 h4.6 l.7 6 h-6 z", "#2E2A36", 1.1) + ell(0, 6, 3, 1.2, o.night ? K.litHot : "#FFF0B3", .9) + "</g>"; };
        s += spot(X0 + .55) + spot(X0 + W - .55);
        if (o.snow) s += F(D([[X0 + .1, Y0 + .1, zt + tw], [X0 + W - .1, Y0 + .1, zt + tw], [X0 + W - .1, Y0 + .1 + tw, zt + tw], [X0 + .1, Y0 + .1 + tw, zt + tw]]), "#FFFFFF");
        return s;
      },
      lights: function(){
        var s = "", i, q, X0 = .2, W = 2.9, Y0 = .25, zt = 3.4;
        for (i = 0; i < 9; i += 2){ q = P(X0 + .18 + i * (W - .36) / 8, Y0 + 2.4, .38); s += T.glowAt(q[0], q[1], 5); }
        [X0 + .55, X0 + W - .55].forEach(function(x){ q = P(x, Y0 + .32, zt); s += T.glowAt(q[0], q[1] + 7, 6); });
        return s;
      },
      bits: function(){
        var X0 = .2, W = 2.9, Y0 = .25, zt = 3.4, s = "", R = T.rng(31), i;
        [[X0 + .55, 0, "#FFF3B0", 0], [X0 + W - .55, 0, "#FFB3DA", .5]].forEach(function(t){
          var c = P(t[0], Y0 + .32, zt - .05), mk = P(1.7, 1.75, .55), len = Math.sqrt(Math.pow(mk[0] - c[0], 2) + Math.pow(mk[1] - c[1], 2)) + 2;
          s += '<g transform="translate(' + m(c[0], c[1] + 1.4) + ") rotate(" + f(aim(c)) + ')"><path d="M0 6 L-8 ' + f(len) + " L8 " + f(len) + ' Z" fill="' + t[2] + '" opacity=".45" style="transform-box:fill-box;transform-origin:50% 0;animation:tp-flutter 1.4s ease-in-out infinite;animation-delay:' + t[3] + 's"/></g>';
        });
        var top = P(1.7, 1.4, zt + .4), cols = [PINK[0], YEL[0], TEAL[0], "#FFFFFF", RED[0], "#9B7BE0"];
        for (i = 0; i < 16; i++){ var x = top[0] - 30 + R() * 60, y = top[1] - 6 + R() * 26; s += '<path class="tp-flake" style="animation-delay:' + f(i * .17) + 's" d="M' + m(x, y) + ' l2.6 1 -1 2.6 -2.6 -1 z" fill="' + cols[i % cols.length] + '"/>'; }
        return s;
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var HEM = "Q149.6 121 146.6 131 Q140 132 135 143 Q120 156 100 157 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 110";
  var ln = function(d, col, w, op){ return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : "") + "/>"; };
  var sleeves = function(col){ return p("M57 101 C50 99 43 100 38.6 105 L43.6 123 C48 120 52 118 57 118 Z", col, O3) + p("M143 101 C150 99 157 100 161.4 105 L156.4 123 C152 120 148 118 143 118 Z", col, O3); };
  var TEE = "#2B2630", TEEL = "#4A4452", LEA = "#2A2530", LAP = "#443D50", LEAH = "#7C7492";
  /* the guitar, drawn with its neck along +x from a body at the origin */
  var guitar = function(col, shade){
    return p("M14 -4 H86 V4 H14 Z", "#C98E58", O2) + '<path d="M16 -3 H86 V3 H16 Z" fill="#6B4128"/>' + ln("M26 -3 V3 M36 -3 V3 M45 -3 V3 M53 -3 V3 M61 -3 V3 M68 -3 V3 M75 -3 V3 M81 -3 V3", "#D9DFE5", .9) +
      '<circle cx="40.6" cy="0" r="1.1" fill="#FFFDF6"/><circle cx="57" cy="0" r="1.1" fill="#FFFDF6"/><circle cx="71.6" cy="0" r="1.1" fill="#FFFDF6"/>' +
      p("M85 -5 L104 -9 Q110 -9 109 -3 L106 6 Q105 8 102 7.6 L85 5 Z", "#2B2630", O2) + T.tinyTooth(98, -.4, .5, "#FFFFFF") +
      [[90, -7.6], [96, -8.8], [102, -9.8]].map(function(t){ return '<circle cx="' + t[0] + '" cy="' + (t[1] - 2) + '" r="2" fill="' + CHROME[0] + '" stroke="' + INK + '" stroke-width="1.2"/>'; }).join("") +
      p("M-28 -2 C-30 -16 -16 -22 -6 -15 C0 -11 6 -12 10 -17 C14 -22 25 -21 22 -12 C19 -7 15 -4 15 1 C15 6 19 9 22 13 C25 19 15 23 8 18 C2 14 -6 15 -12 18 C-24 23 -30 12 -28 -2 Z", col, O3) +
      '<path d="M-12 18 C-6 15 2 14 8 18 C11 20 15 21 18 19.6 C14 23 8 21 4 19 C-1 17 -7 18 -12 20 Z" fill="' + shade + '"/>' +
      p("M-20 6 C-14 10 -4 8 4 11 C8 13 12 10 10 6 L8 -6 L-6 -6 Q-12 -1 -20 6 Z", WHT, O2) +
      '<path d="M-24 -6 C-22 -12 -16 -15 -10 -13" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
      p("M-2 -4.6 h4 v9.2 h-4 z", "#2B2630", O2.replace("2.2", "1.4")) + p("M6 -4.6 h4 v9.2 h-4 z", "#2B2630", O2.replace("2.2", "1.4")) + p("M-12 -4 h3.4 v8 h-3.4 z", CHROME[0], O2.replace("2.2", "1.4")) +
      ln("M-10 -2 H86 M-10 0 H86 M-10 2 H86", "#F4F4F4", .5, .85) +
      '<circle cx="-14" cy="11" r="2.1" fill="' + CHROME[0] + '" stroke="' + INK + '" stroke-width="1.2"/><circle cx="-7.6" cy="13" r="2.1" fill="' + CHROME[0] + '" stroke="' + INK + '" stroke-width="1.2"/>';
  };
  var outfits = {
    "band-tee": {
      note: "A black band tee with a tooth-and-lightning-bolt print",
      face: sleeves(TEE) + ln("M41.6 108.6 L45.6 121.4 M158.4 108.6 L154.4 121.4", TEEL, 1.8) + p("M50.6 110 Q100 124 149.4 110 " + HEM + " Z", TEE, O3) +
        ln("M66 114.8 Q100 129 134 114.8", TEEL, 2.6) + ln("M57 126 Q62 134 70 140", TEEL, 2.2) + ln("M131 147 Q137 141 140 134", TEEL, 1.8, .8) +
        '<circle cx="100" cy="139.6" r="14.4" fill="' + RED[0] + '" ' + O2 + '/><circle cx="100" cy="139.6" r="11.4" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity=".7"/>' +
        T.tinyTooth(100, 139.4, 1.92, "#FFFFFF") + '<g transform="translate(101 140) rotate(14)">' + bolt(0, 0, 2.5, YEL[0], 1.6) + "</g>",
      say: ["My favorite band? The Wisdom Teeth. They always show up late.", "Tooth and lightning. It's a whole look.", "Front row, every show. Earplugs in: look after your ears too."]
    },
    "leather-jacket": {
      note: "A black leather jacket with silver zips, a big collar and two enamel pins, one a tiny tooth",
      face: sleeves(LEA) + ln("M40.6 112 L44.4 121 M159.4 112 L155.6 121", CHROME[0], 1.8) + ln("M44 104.4 Q49 102.6 54 103.6 M156 104.4 Q151 102.6 146 103.6", LEAH, 2, .9) +
        p("M84 114 Q100 124 116 114 L104 150 L96 150 Z", "#F4F1EC", O2) + ln("M90 119 Q100 125 110 119", "#D9D2C6", 1.6) +
        p("M50.6 110 Q66 107 84 114 L97 157 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 110 Z", LEA, O3) +
        p("M149.4 110 Q134 107 116 114 L103 157 Q120 156 135 143 Q140 132 146.6 131 Q149.6 121 149.4 110 Z", LEA, O3) +
        /* the big collar folded back, its edges catching the light */
        p("M52 109 Q66 105.6 84 113 L90.4 133 L80 135 L64 119 Z", LAP, O3) + p("M148 109 Q134 105.6 116 113 L109.6 133 L120 135 L136 119 Z", LAP, O3) +
        ln("M56 110.4 Q68 107.6 82 113.6", LEAH, 2) + ln("M144 110.4 Q132 107.6 118 113.6", LEAH, 2) +
        /* the zips: down the front edges, across the pockets, at the cuffs */
        ln("M91.6 136 L97 155.4 M108.4 136 L103 155.4", CHROME[0], 1.8) + ln("M91.6 136 L97 155.4 M108.4 136 L103 155.4", INK, .6, .5) +
        ln("M58 137 L73 129.6 M142 137 L127 129.6", INK, 3.6) + ln("M58 137 L73 129.6 M142 137 L127 129.6", CHROME[0], 1.8) +
        p("M72.4 128.4 l3.4 -1 1.2 4.4 -3.4 1 z", CHROME[0], 'stroke="' + INK + '" stroke-width="1.1"') + p("M127.6 128.4 l-3.4 -1 -1.2 4.4 3.4 1 z", CHROME[0], 'stroke="' + INK + '" stroke-width="1.1"') +
        ln("M62 147 Q70 152 80 153", LEAH, 2, .8) + ln("M146 125 Q147 131 145 136", LEAH, 2, .7) +
        /* the enamel pins on the collar: a tooth, a lightning bolt */
        '<circle cx="70.6" cy="119" r="7.2" fill="' + RED[0] + '" ' + O2 + "/>" + T.tinyTooth(70.6, 119.4, 1.18, "#FFFFFF") +
        '<g transform="translate(128.6 120.4) rotate(12)">' + bolt(0, 0, 2.05, YEL[0], 1.8) + "</g>",
      say: ["Leather jacket on. Too cool for cavities.", "These pins? One for every checkup I aced.", "Zip it up. Like the cap on your toothpaste."]
    },
    "electric-guitar": {
      note: "A red electric guitar on a strap across his body, a white pickguard, a pick in his hand",
      back: ln("M47 156 Q40 132 52 106", INK, 8) + ln("M47 156 Q40 132 52 106", "#3B2E3A", 4.4),
      face: ln("M86 133 Q118 122 152 104", INK, 8.4) + ln("M86 133 Q118 122 152 104", "#3B2E3A", 4.8) + ln("M92 130.6 l4 -1.4 M104 126.4 l4 -1.4 M116 122 l4 -1.6 M128 117 l4 -1.8 M140 111 l4 -2", YEL[0], 1.6) +
        '<g transform="translate(72 146) rotate(-24)">' + guitar(RED[0], RED[1]) + "</g>" +
        /* the pick, in his other hand */
        p("M30 116 Q36 112 40 117 Q37 124 33 125 Q29 121 30 116 Z", TEAL[0], O2) + T.tinyTooth(35, 118.6, .36, "#FFFFFF"),
      say: ["Two minutes of brushing, two minutes of shredding.", "I only know three chords: brush, floss, rinse.", "Rock on. Then rinse."]
    }
  };

  return { k: "rockshow", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
