/* The Moon base collection of Timmy's place (tools/figures/site/sets.mjs, COLLECTIONS, lists its eight pieces; the shop's
   catalog has the same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and
   pastes its source into the files that draw it, so it may use nothing from outside itself but T.

   The pieces: a habitat dome with an airlock (its round hatch is the door), a tube to a little module, solar wings and a
   blinking antenna; the lunar plains (gray regolith and craters under a black sky, the Earth hanging over the far crater
   rims: by day the sun is up, small and bright, and the ground is bright; by night the Earth is full and lights the
   ground blue); an antenna headband, a gold space visor and a jetpack for Timmy; a six-wheeled rover, a satellite dish
   and a rocket on its pad.
   Flat fills and ink outlines, light from the top left; no ids, gradients, filters, text, images or emoji. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, D2 = T.D2, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, HI = T.HI, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK, RX = T.RX, RY = T.RY;
  var p = T.p, O2 = T.O2, O3 = T.O3, O4 = T.O4, DEG = Math.PI / 180;
  var WHITE = ["#F4F6FA", "#D5DBE4", "#B9C2CF"], METAL = ["#D5DBE1", "#A9B3BE", "#8E98A3"], PANEL = ["#3F6FD0", "#2E57AE", "#7FA6EE"], GOLD = ["#F2C94C", "#C9971C", "#FFE9A8"];

  /* ------------------------------------------------------------------ geometry helpers ------------------------------ */
  /* the convex hull of screen points (a cylinder lying on its side is the hull of its two end circles) */
  function hull(pts){
    pts = pts.slice().sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
    var cr = function(o, a, b){ return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], hi = [], i;
    for (i = 0; i < pts.length; i++){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop(); lo.push(pts[i]); }
    for (i = pts.length - 1; i >= 0; i--){ while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], pts[i]) <= 0) hi.pop(); hi.push(pts[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  /* points round a circle in 3D: center c, unit vectors a and b in its plane, from angle t0 to t1 (degrees) */
  function ring(c, a, b, r, t0, t1, n){
    t0 = t0 == null ? 0 : t0; t1 = t1 == null ? 360 : t1; n = n || 24;
    var out = [];
    for (var i = 0; i <= n; i++){ var t = (t0 + (t1 - t0) * i / n) * DEG, u = Math.cos(t) * r, v = Math.sin(t) * r; out.push([c[0] + u * a[0] + v * b[0], c[1] + u * a[1] + v * b[1], c[2] + u * a[2] + v * b[2]]); }
    return out;
  }
  function norm(v){ var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  /* a cylinder lying along x or y (a tube, an airlock, a wheel): its outline is the hull of its end circles; the shade
     is the band of its side turned away from the light (sh: [from, to] in degrees round the axis) */
  function tube(ax, a0, a1, o2, zc, R, c, sh){
    var pt = function(t, ph){ var u = R * Math.cos(ph * DEG), w = zc + R * Math.sin(ph * DEG); return ax === "y" ? P(o2 + u, t, w) : P(t, o2 + u, w); };
    var all = [], i, band = [];
    for (i = 0; i < 36; i++){ all.push(pt(a0, i * 10)); all.push(pt(a1, i * 10)); }
    sh = sh || (ax === "y" ? [-45, 25] : [-45, -12]);
    for (i = sh[0]; i <= sh[1]; i += 5) band.push(pt(a1, i));
    for (i = sh[1]; i >= sh[0]; i -= 5) band.push(pt(a0, i));
    var hd = D2(hull(all));
    return F(hd, c[0]) + F(D2(band), c[1]) + O(hd, c[2] || 1.8);
  }
  /* a painted band round a lying cylinder, from a to b along its axis: only the strip we see */
  function tubeBand(ax, a, b, o2, zc, R, c){
    var arc = function(t, p0, p1){ var l = []; for (var ph = p0; p1 > p0 ? ph <= p1 : ph >= p1; ph += p1 > p0 ? 9 : -9){ var u = R * Math.cos(ph * DEG), w = zc + R * Math.sin(ph * DEG); l.push(ax === "y" ? [o2 + u, t, w] : [t, o2 + u, w]); } return l; };
    var strip = arc(a, -45, 135).concat(arc(b, 135, -45)), sh = arc(a, -45, 27).concat(arc(b, 27, -45));
    return F(D(strip), c[0]) + F(D(sh), c[1]) + L(D(arc(a, -45, 135), true) + D(arc(b, -45, 135), true), 1.2);
  }
  /* the visible half of a ring round a lying cylinder (a seam, a band) */
  function tubeRing(ax, t, o2, zc, R){ var l = []; for (var ph = -45; ph <= 135; ph += 9){ var u = R * Math.cos(ph * DEG), w = zc + R * Math.sin(ph * DEG); l.push(ax === "y" ? [o2 + u, t, w] : [t, o2 + u, w]); } return D(l, true); }
  /* a point on a dome (half ellipsoid, rim radius r at z0, h tall) at angle a round it and height t (0 rim, 1 top),
     with the surface's two directions there (round it, and up it) */
  function onDome(cx, cy, z0, r, h, a, t){
    var rr = r * Math.sqrt(1 - t * t), ca = Math.cos(a * DEG), sa = Math.sin(a * DEG), k = -r * t / Math.sqrt(1 - t * t);
    return { c: [cx + rr * ca, cy + rr * sa, z0 + h * t], e1: [-sa, ca, 0], e2: norm([k * ca, k * sa, h]) };
  }
  function domeSeams(cx, cy, z0, r, h, col, skip){
    var s = "";
    [.36, .7].forEach(function(t){ var rr = r * Math.sqrt(1 - t * t), l = []; for (var a = -42; a <= 132; a += 6) l.push([cx + rr * Math.cos(a * DEG), cy + rr * Math.sin(a * DEG), z0 + h * t]); s += L(D(l, true), 1, col, .75); });
    [-22, 12, 46, 104].forEach(function(a){ if (skip && skip(a)) return; var l = []; for (var t = 0; t <= 1.0001; t += .1){ var rr = r * Math.sqrt(Math.max(0, 1 - t * t)); l.push([cx + rr * Math.cos(a * DEG), cy + rr * Math.sin(a * DEG), z0 + h * t]); } s += L(D(l, true), 1, col, .75); });
    return s;
  }
  /* a round porthole on a curved wall: a brass rim, the glass (lit at night) */
  function port(q, r, night, rim){
    var outer = D(ring(q.c, q.e1, q.e2, r + .1, 0, 360, 20)), glass = D(ring(q.c, q.e1, q.e2, r, 0, 360, 20)), c = P(q.c[0], q.c[1], q.c[2]);
    var s = FO(outer, rim || "#E8BE45", 1.3) + FO(glass, night ? K.lit : "#2E3A5C", 1.1);
    if (!night) s += L("M" + f(c[0] - r * 4) + " " + f(c[1] - r * 1.4) + " l" + f(r * 3) + " " + f(-r * 3), 1.3, "#BFE7FA");
    return { s: s, at: c, lights: night ? T.glowAt(c[0], c[1], 6 + r * 6) + FO(glass, K.lit, 1.1) : "" };
  }
  /* a flat quad in 3D: center, half-sizes along u and v */
  function quad(c, u, v, a, b){ return [[c[0] - u[0] * a - v[0] * b, c[1] - u[1] * a - v[1] * b, c[2] - u[2] * a - v[2] * b], [c[0] + u[0] * a - v[0] * b, c[1] + u[1] * a - v[1] * b, c[2] + u[2] * a - v[2] * b],
    [c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b], [c[0] - u[0] * a + v[0] * b, c[1] - u[1] * a + v[1] * b, c[2] - u[2] * a + v[2] * b]]; }
  function lerp3(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  /* a solar panel: blue cells in a silver frame */
  function solar(c, u, v, a, b, nu, nv){
    var q = quad(c, u, v, a, b), s = F(D(q), PANEL[0]), i;
    for (i = 1; i < nu; i++){ var t = i / nu; s += L(D([lerp3(q[0], q[1], t), lerp3(q[3], q[2], t)], true), .9, PANEL[2], .8); }
    for (i = 1; i < nv; i++){ t = i / nv; s += L(D([lerp3(q[0], q[3], t), lerp3(q[1], q[2], t)], true), .9, PANEL[2], .8); }
    s += F(D([lerp3(q[0], q[3], .55), lerp3(q[1], q[2], .55), lerp3(q[1], q[2], .75), lerp3(q[0], q[3], .75)]), "#FFFFFF", .14);
    return s + L(D(q), 2.6, METAL[0]) + O(D(q), 1.4);
  }
  function beacon(x, y, r, c){ return circ(x, y, r, c || "#FF5A5A", 1.1).replace("/>", ' class="tp-twinkle"/>') + circ(x - r * .35, y - r * .35, r * .3, "#FFFFFF"); }

  /* ------------------------------------------------------------------ the home: a moon base dome ------------------- */
  var DM = { cx: 5.0, cy: 5.3, r: 2.9, z0: .42, h: 3.0 }, AL = { x: 5.5, y0: 7.5, y1: 9.3, zc: 1.2, R: 1.1 }, MOD = { x: 8.95, y: 3.0, r: .85, h: 1.5 };
  var homes = {
    "moon-dome": {
      note: "A white habitat dome with an airlock, a tube to a little module, solar wings and a blinking antenna",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "A ring of portholes", porch: "Airlock steps and running lights", flag: "A Timmy flag on the module", paint: "Dome color" },
      door: [5.5, 9.3], brush: [8.3, 9.35], statue: [2.85, 9.9], spots: { door: [6.45, 10.0] }, h: 6.0,
      eaves: [[2.85, 7.45, 2.4], [7.15, 3.15, 2.4], 6], round: [DM.cx, DM.cy, 3.0],
      base: T.arcPts(MOD.x, MOD.y, MOD.r, -45, 150, 5).concat(T.arcPts(DM.cx, DM.cy, DM.r + .05, -40, 135, 14)), gap: [[1.9, 6.3, 7.1, 10.8]],
      block: [2.0, .8, 9.8, 9.5],
      draw: function(o){
        var u = o.up, pp = T.PAINTS[o.paint], bb = T.BOLD[o.paint], tint = o.paint && o.paint !== "cream";
        var dc = tint && pp ? [pp.c, pp.s] : [WHITE[0], WHITE[1]], tr = tint && bb ? [bb.c, bb.s] : ["#3FA7E0", "#2378B0"];
        var s = "", lights = "", cx = DM.cx, cy = DM.cy, r = DM.r, z0 = DM.z0, h = DM.h, w, q, a;
        /* nothing glows where Timmy stands at the door (the lights are drawn over him) */
        var lit = function(pw){ var c = pw.at; if (!(c[0] > 144 && c[0] < 192 && c[1] > 126 && c[1] < 182)) lights += pw.lights; };
        /* the solar wings, behind everything: a mast, a boom and two panels turned up to the sun */
        var mx = 8.5, my = 1.05, mz = 3.3, mf = P(mx, my, 0), mt = P(mx, my, mz + .2), vU = norm([0, -.5, .87]);
        s += ell(mf[0] + 2, mf[1] + 1, 9, 3, "#1B2A3A", 0, .12) + box(mx - .25, my - .25, 0, .5, .5, .25, { top: METAL[0], left: METAL[1], right: METAL[2] }, { sw: 1.2, si: .8 });
        s += L(T.seg(mf, mt), 4.4) + L(T.seg(mf, mt), 2.2, METAL[1]);
        s += L(D([[mx - 1.65, my, mz], [mx + 1.65, my, mz]], true), 3.6) + L(D([[mx - 1.65, my, mz], [mx + 1.65, my, mz]], true), 1.6, METAL[0]);
        s += solar([mx - .95, my, mz], [1, 0, 0], vU, .7, .62, 4, 2) + solar([mx + .95, my, mz], [1, 0, 0], vU, .7, .62, 4, 2);
        s += box(mx - .14, my - .14, mz - .16, .28, .28, .34, { top: METAL[0], left: METAL[0], right: METAL[1] }, { sw: 1.2, si: .8 });
        /* the main dome on its trim band; the band's little lights come on with the porch */
        s += cyl(cx, cy, 0, r + .06, z0, r + .06, tr[0], tr[1], tr[0], { open: true });
        for (a = -36; a <= 132; a += 12){
          q = P(cx + (r + .06) * Math.cos(a * DEG), cy + (r + .06) * Math.sin(a * DEG), z0 * .5);
          if (u.porch){ s += circ(q[0], q[1], 1.3, o.night ? K.litHot : "#FFF3C4", .7); lit({ at: q, lights: circ(q[0], q[1], 4, K.glow, 0).replace("/>", ' opacity=".35"/>') + circ(q[0], q[1], 1.3, K.litHot, .7) }); }
          else s += circ(q[0], q[1], .9, "#FFFFFF", 0);
        }
        s += T.dome(cx, cy, z0, r, h, dc[0], dc[1]);
        s += domeSeams(cx, cy, z0, r, h, INK, function(a){ return a > 92 && a < 108; });
        /* the tooth on the dome, high on the side the sun lights */
        /* the greenhouse window low on the dome's front, a row of greens growing behind it */
        var dp = function(a, t){ return onDome(cx, cy, z0, r, h, a, t).c; }, gl = [], ga, gt, G0 = -4, G1 = 34, T0 = .06, T1 = .36;
        for (ga = G0; ga <= G1; ga += 4) gl.push(dp(ga, T0));
        for (gt = 1; gt <= 6; gt++) gl.push(dp(G1, T0 + (T1 - T0) * gt / 6));
        for (ga = G1 - 4; ga >= G0; ga -= 4) gl.push(dp(ga, T1));
        for (gt = 5; gt >= 1; gt--) gl.push(dp(G0, T0 + (T1 - T0) * gt / 6));
        var gd = D(gl), greens = function(night){
          var out = F(D([dp(G0, T0), dp(G1, T0), dp(G1, T0 + .07), dp(G0, T0 + .07)]), night ? "#5A3A2A" : "#B07A4E");
          [0, 8, 16, 24].forEach(function(a, i){ var q = dp(a + 3, T0 + .07); out += FO(T.lumps(q[0], q[1] - 3.8, 4.2, 70 + i, 6, .9), night ? "#2F5A3A" : (i % 2 ? "#8FD37A" : "#6CBF5E"), .9) + (i % 2 ? "" : L("M" + f(q[0] - 1) + " " + f(q[1] - 3) + " q1.2 -2.6 3 -2.4", 1, night ? "#244A2E" : "#3E8E45")); });
          return out;
        };
        s += FO(gd, o.night ? K.lit : "#5A72A8", 1.6) + greens(o.night);
        [8, 21].forEach(function(a){ s += L(D([dp(a, T0), dp(a, T0 + .1), dp(a, T0 + .2), dp(a, T1)], true), 1.3, METAL[1]); });
        s += L(D([dp(G0, .25), dp(8, .25), dp(21, .25), dp(G1, .25)], true), 1.3, METAL[1]) + O(gd, 1.6);
        if (!o.night) s += L(D([dp(G0 + 4, T1 - .05), dp(G0 + 9, T0 + .1)], true), 1.6, "#BFE7FA", .9);
        else { var gc = P.apply(null, dp(15, .22)); lights += T.glowAt(gc[0], gc[1], 16) + FO(gd, K.lit, 1.6) + greens(true); }
        var em = onDome(cx, cy, z0, r, h, 100, .72), ec = P(em.c[0], em.c[1], em.c[2]);
        s += FO(D(ring(em.c, em.e1, em.e2, .74, 0, 360, 20)), tr[0], 1.4) + T.tinyTooth(ec[0], ec[1] + .6, .78, "#FFFFFF");
        /* portholes round it */
        var ports = [[130, .35, .3], [-5, .62, .28]];
        if (u.windows) ports = ports.concat([[40, .6, .25], [110, .47, .24], [18, .86, .2]]);
        ports.forEach(function(pt){ var pw = port(onDome(cx, cy, z0, r, h, pt[0], pt[1]), pt[2], o.night); s += pw.s; lit(pw); });
        if (o.snow) s += T.snowDome(cx, cy, z0, r, h, .5);
        /* the antenna on top, its light blinking */
        var at0 = P(cx - .1, cy - .1, z0 + h), at1 = [at0[0], at0[1] - 26];
        s += L(T.seg(at0, at1), 4) + L(T.seg(at0, at1), 2, METAL[0]) + L("M" + f(at1[0] - 6) + " " + f(at1[1] + 9) + " h12 M" + f(at1[0] - 4) + " " + f(at1[1] + 15) + " h8", 3.2) + L("M" + f(at1[0] - 6) + " " + f(at1[1] + 9) + " h12 M" + f(at1[0] - 4) + " " + f(at1[1] + 15) + " h8", 1.4, METAL[0]);
        s += beacon(at1[0], at1[1] - 2, 2.8);
        if (o.night) lights += circ(at1[0], at1[1] - 2, 9, "#FF6B6B", 0).replace("/>", ' opacity=".3"/>');
        /* the tube to the little module, a collar where it leaves the dome */
        var ty = MOD.y + .05, tz = .95;
        s += tube("x", 6.75, 8.25, ty, tz, .42, [METAL[0], METAL[1]]) + tubeBand("x", 7.0, 7.16, ty, tz, .42, tr);
        s += L(tubeRing("x", 7.6, ty, tz, .42), .9, INK, .5);
        /* the little module: a can with a cap, a porthole, and a flag or a little dish on top */
        q = P(MOD.x, MOD.y, 0); s += ell(q[0] + 2, q[1] + 1, RX(MOD.r) + 2, RY(MOD.r) + 1, "#1B2A3A", 0, .12);
        s += cyl(MOD.x, MOD.y, 0, MOD.r, MOD.h, MOD.r, dc[0], dc[1], dc[0], { open: true }) + L(D(T.arcPts(MOD.x, MOD.y, MOD.r, -45, 135, 12).map(function(t){ return [t[0], t[1], .5]; }), true), 1, INK, .45);
        s += cyl(MOD.x, MOD.y, MOD.h - .2, MOD.r + .05, MOD.h, MOD.r + .05, tr[0], tr[1], tr[0], { open: true }) + T.dome(MOD.x, MOD.y, MOD.h, MOD.r, .55, dc[0], dc[1]);
        if (o.snow) s += T.snowDome(MOD.x, MOD.y, MOD.h, MOD.r, .55, .5);
        var mp = function(an, rr){ var c = an * DEG; return port({ c: [MOD.x + MOD.r * Math.cos(c), MOD.y + MOD.r * Math.sin(c), .95], e1: [-Math.sin(c), Math.cos(c), 0], e2: [0, 0, 1] }, rr, o.night); };
        w = mp(112, .27); s += w.s; lit(w);
        if (u.windows){ w = mp(30, .23); s += w.s; lit(w); }
        if (u.flag) s += T.flagOn(MOD.x, MOD.y, MOD.h + .5, 1.9);
        else {
          q = P(MOD.x, MOD.y, MOD.h + .52); s += L("M" + f(q[0]) + " " + f(q[1]) + " v-7", 2.6) + L("M" + f(q[0]) + " " + f(q[1]) + " v-7", 1.2, METAL[0]);
          s += '<g transform="translate(' + f(q[0]) + " " + f(q[1] - 8) + ') rotate(-28)">' + FO("M-6 -1 Q0 7 6 -1 Z", METAL[0], 1.3) + L("M0 2 l0 -6", 1.1) + circ(0, -4.4, 1, INK) + "</g>";
        }
        /* the airlock: a short metal drum out of the dome on two feet, its round hatch the front door */
        var x = AL.x, zc = AL.zc, R = AL.R, y1 = AL.y1, FR = { top: METAL[1], left: METAL[1], right: METAL[2] };
        s += ell.apply(null, P(x + .3, y1 - .5, 0).concat([RX(1.3), 5, "#1B2A3A", 0, .14]));
        s += box(x - .85, 8.1, 0, .3, 1.0, .22, FR, { sw: 1.1, si: .7 }) + box(x + .55, 8.1, 0, .3, 1.0, .22, FR, { sw: 1.1, si: .7 });
        s += tube("y", AL.y0, AL.y0 + .22, x, zc, R + .12, [tr[0], tr[1], 1.4]) + tube("y", AL.y0 + .1, y1, x, zc, R, [METAL[0], METAL[1]]);
        s += tubeBand("y", 8.4, 8.66, x, zc, R, tr);
        var hp = function(rr, t0, t1, n){ return ring([x, y1, zc], [1, 0, 0], [0, 0, 1], rr, t0, t1, n || 28); };
        s += FO(D(hp(R, 0, 360)), "#E6EAEF", 1.6) + FO(D(hp(.96, 0, 360)), METAL[2], 1.3) + FO(D(hp(.8, 0, 360)), tr[0], 1.4);
        s += F(D(hp(.8, -70, 20, 8).concat(hp(.6, 20, -70, 8))), tr[1], .9);
        for (a = 0; a < 360; a += 45){ q = P(x + Math.cos(a * DEG) * 1.03, y1, zc + Math.sin(a * DEG) * 1.03); s += circ(q[0], q[1], .9, INK); }
        /* the hatch's porthole (lit inside at night, no glow: Timmy stands in front of it) and its wheel */
        w = port({ c: [x, y1 + .01, zc + .3], e1: [1, 0, 0], e2: [0, 0, 1] }, .27, o.night, METAL[0]); s += w.s;
        var wh = ring([x, y1 + .02, zc - .3], [1, 0, 0], [0, 0, 1], .26, 0, 360, 16), wc = P(x, y1 + .02, zc - .3);
        s += L(D(wh), 2.8) + L(D(wh), 1.3, GOLD[0]) + L("M" + f(wc[0] - 2.4) + " " + f(wc[1] - 1.4) + " l4.8 2.8 M" + f(wc[0]) + " " + f(wc[1] - 2.8) + " v5.6", 1.2, INK) + circ(wc[0], wc[1], .9, GOLD[1]);
        /* the step under the hatch, or steps with handrails */
        var ST = { top: METAL[0], left: METAL[1], right: METAL[2] };
        if (u.porch){
          s += box(x - .7, y1, 0, 1.4, .55, .4, ST, { sw: 1.3, si: .8 }) + box(x - .7, y1 + .55, 0, 1.4, .45, .2, ST, { sw: 1.3, si: .8 });
          [x - .78, x + .78].forEach(function(xx){ var r0 = P(xx, y1 + 1.0, .2), r1 = P(xx, y1 + .05, 1.0), r2 = P(xx, y1 + 1.0, .95); s += L(T.seg(r0, r2) + " " + T.seg(r2, r1), 2.6) + L(T.seg(r0, r2) + " " + T.seg(r2, r1), 1.2, GOLD[0]); });
        } else s += box(x - .55, y1, 0, 1.1, .42, .3, ST, { sw: 1.3, si: .8 });
        if (o.snow) s += ell.apply(null, P(x, y1 - .7, zc + R + .02).concat([9, 2.4, "#FFFFFF", 1]));
        if (o.night) lights += T.dmStar(150, 58, 2.6, "#FFFFFF", "tp-twinkle", .3);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: the lunar plains ------------------- */
  /* the Earth: blue seas, made-up continents, white swirls of cloud; half in shadow by day, full at night */
  function earth(x, y, r, night){
    var s = "";
    if (night) s += circ(x, y, r + 9, "#7FB8F0", 0).replace("/>", ' opacity=".12"/>') + circ(x, y, r + 4.5, "#7FB8F0", 0).replace("/>", ' opacity=".16"/>');
    s += circ(x, y, r, "#3E8EDC", 0);
    s += F(T.lumps(x - r * .38, y - r * .2, r * .36, 7, 7, .9), "#63B35A") + F(T.lumps(x - r * .3, y - r * .1, r * .16, 8, 6, .9), "#B68D55");
    s += F(T.lumps(x + r * .32, y + r * .34, r * .3, 9, 7, .85), "#63B35A") + F(T.lumps(x + r * .18, y - r * .5, r * .16, 10, 6, .9), "#63B35A");
    s += F("M" + f(x - r * .5) + " " + f(y - r * .82) + " q" + f(r * .5) + " " + f(-r * .22) + " " + f(r) + " 0 q" + f(-r * .5) + " " + f(r * .12) + " " + f(-r) + " 0 z", "#FFFFFF", .95);
    s += L("M" + f(x - r * .9) + " " + f(y + r * .2) + " q" + f(r * .4) + " " + f(-r * .26) + " " + f(r * .8) + " 0 q" + f(r * .3) + " " + f(r * .18) + " " + f(r * .6) + " " + f(-r * .06) +
      " M" + f(x - r * .2) + " " + f(y + r * .62) + " q" + f(r * .3) + " " + f(-r * .18) + " " + f(r * .66) + " 0 M" + f(x + r * .1) + " " + f(y - r * .2) + " q" + f(r * .3) + " " + f(-r * .14) + " " + f(r * .62) + " " + f(r * .02), 2.2, "#FFFFFF", .9);
    /* the night side, away from the sun */
    if (night) s += F("M" + f(x + r * .3) + " " + f(y - r * .95) + " A" + r + " " + r + " 0 0 1 " + f(x + r * .3) + " " + f(y + r * .95) + " A" + f(r * .62) + " " + f(r * .95) + " 0 0 0 " + f(x + r * .3) + " " + f(y - r * .95) + " Z", "#0B1438", .35);
    else s += F("M" + f(x) + " " + f(y - r) + " A" + r + " " + r + " 0 0 1 " + f(x) + " " + f(y + r) + " A" + f(r * .32) + " " + r + " 0 0 0 " + f(x) + " " + f(y - r) + " Z", "#0B1438", .72);
    s += circ(x, y, r, "none", 1.8) + HI("M" + f(x - r * .72) + " " + f(y - r * .4) + " a" + f(r * .82) + " " + f(r * .82) + " 0 0 1 " + f(r * .44) + " " + f(-r * .4), 1.6);
    return s;
  }
  /* a crater on the ground (screen space): a lit rim, its bowl, the shadow its far wall throws inside */
  function crater(x, y, r, c){
    return ell(x, y, r, r * .42, c[0], 1.1) + ell(x - r * .04, y - r * .02, r * .8, r * .32, c[2], 0) + ell(x + r * .14, y + r * .07, r * .64, r * .24, c[1], 0) + L("M" + f(x + r * .2) + " " + f(y + r * .38) + " q" + f(r * .5) + " " + f(-r * .04) + " " + f(r * .72) + " " + f(-r * .28), 1.1, c[3], .9);
  }
  function boulder(x, y, k, c, seed){
    var d = T.lumps(x, y - 4 * k, 6.4 * k, seed, 7, .62);
    return ell(x + 3 * k, y + .6, 8 * k, 2.4 * k, "#141824", 0, .22) + F(d, c[0]) + F(T.lumps(x + 2 * k, y - 3 * k, 4 * k, seed + 2, 6, .6), c[1], .9) + O(d, 1.3) + L("M" + f(x - 3.6 * k) + " " + f(y - 6.4 * k) + " q" + f(2 * k) + " " + f(-1.8 * k) + " " + f(4.4 * k) + " " + f(-1.4 * k), 1.2, "#FFFFFF", .55);
  }
  var scenes = {
    "lunar-plains": T.hillScene({
      note: "Gray regolith and craters under a black sky, the Earth hanging over the far crater rims",
      path: "crystal", treeKind: "crystal", lamp: "post", skirt: "space", grade: ["#B6C3F0", .05],
      ground: function(o){ return o.snow ? ["#F4F6FA", "#E6EBF2", "#D3DCE8", "#B4C2D6"] : o.night ? ["#9DA4C0", "#9098B5", "#8088A6", "#636B8B"] : ["#DEDCE3", "#D1CED9", "#BCB8C8", "#9591A8"]; },
      sky: function(o){
        var s = T.bands(o.night ? ["#05060F", "#080A18", "#0C0F21", "#11152B"] : ["#07080F", "#0B0D17", "#10121F", "#161928"], 0, 300);
        if (o.night) s += F("M-10 150 Q80 96 170 70 Q260 44 410 -10 L410 26 Q260 74 180 98 Q90 126 -10 176 Z", "#BFC9F5", .06);
        s += T.starField(73, o.night ? 46 : 22, 150);
        if (!o.night) s += T.sun(72, 42);
        return s + earth(316, 50, 19, o.night);
      },
      far: function(o){
        var c = o.snow ? ["#EEF2F8", "#DCE4EE", "#FFFFFF", "#C2CEDD"] : o.night ? ["#6F7695", "#5F6686", "#858CA8", "#4E5574"] : ["#ABA8BA", "#97949F", "#C9C6D3", "#7E7B90"], s = "";
        /* the far crater rims, low and rounded */
        s += F("M0 132 Q22 118 48 124 Q70 108 98 122 Q130 112 160 126 Q200 116 240 126 Q272 110 300 122 Q326 104 356 116 Q380 108 400 118 V300 H0 Z", c[0]) + L("M0 132 Q22 118 48 124 Q70 108 98 122 Q130 112 160 126 Q200 116 240 126 Q272 110 300 122 Q326 104 356 116 Q380 108 400 118", 1.4, INK, .5);
        s += ell(72, 116, 14, 3, c[3], 0, .8) + L("M58 116 Q72 110 86 116", 1.2, c[2], .9) + ell(328, 110, 16, 3.2, c[3], 0, .8) + L("M312 110 Q328 103 344 110", 1.2, c[2], .9);
        s += F("M0 150 Q40 136 84 142 Q118 132 150 144 Q240 136 300 144 Q340 130 400 140 V300 H0 Z", c[1]) + L("M0 150 Q40 136 84 142 Q118 132 150 144 Q240 136 300 144 Q340 130 400 140", 1.2, INK, .35);
        return s;
      },
      landExtra: function(o){
        if (o.snow) return "";
        var c = o.night ? ["#B3B9D2", "#7F87A6", "#5D6585", "#C9CEE2"] : ["#ECEBF0", "#B9B5C6", "#8E8AA1", "#FFFFFF"];
        return crater(304, 248, 22, c) + crater(96, 256, 14, c);
      },
      flat: function(o, on){
        var c = o.snow ? ["#FFFFFF", "#DCE4EE", "#C2CEDD", "#FFFFFF"] : o.night ? ["#B3B9D2", "#7F87A6", "#5D6585", "#C9CEE2"] : ["#ECEBF0", "#B9B5C6", "#8E8AA1", "#FFFFFF"];
        var s = T.scatter(171, 10, on, function(sx, sy, i){ return crater(sx, sy, 4.4 + (i % 4) * 2.2, c); }).join("");
        s += T.scatter(172, 18, on, function(sx, sy, i){ return ell(sx, sy, 1.6 + (i % 3) * .5, 1 + (i % 3) * .3, i % 2 ? c[1] : c[2], .7); }).join("");
        /* root prints: Timmy went for a walk (two roots, two little dents a step) */
        if (!o.snow) for (var i = 0; i < 9; i++){
          var t = i / 8, x = 16.2 + 3.4 * t, y = 12.4 - 6.2 * t + Math.sin(t * 5) * .5, side = i % 2 ? .18 : -.18, q = P(x + side, y + side, 0);
          if (!on(q[0], q[1], x, y)) continue;
          s += ell(q[0] - 1.6, q[1], 1.3, .8, c[2], 0) + ell(q[0] + 1.6, q[1], 1.3, .8, c[2], 0);
        }
        return s;
      },
      props: function(o, on){
        var rc = o.snow ? ["#F4F6FA", "#D3DCE8"] : o.night ? ["#8D94B0", "#6E7593"] : ["#C2BFCD", "#A29EB2"];
        var out = T.scatter(173, 6, on, function(sx, sy, i, R, x, y){ return { x: x, y: y, s: boulder(sx, sy, .8 + R() * .6, rc, 30 + i) + (i % 2 ? boulder(sx + 9, sy + 2, .5, rc, 50 + i) : "") }; });
        /* a little Timmy flag, planted out on the plain */
        var fq = P(17.4, 3.4, 0);
        if (on(fq[0], fq[1], 17.4, 3.4)) out.push({ x: 17.4, y: 3.4, s: ell(fq[0] + 2, fq[1] + 1, 6, 2, "#141824", 0, .2) + T.flagOn(17.4, 3.4, 0, 2.1) });
        return out;
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  /* a wheel lying on its axle (along y), its face turned to the light */
  function wheel(x, y, zc, R, wd){
    var rim = ring([x, y + wd, zc], [1, 0, 0], [0, 0, 1], R, 0, 360, 20), hub = ring([x, y + wd + .01, zc], [1, 0, 0], [0, 0, 1], R * .42, 0, 360, 14), s = tube("y", y, y + wd, x, zc, R, ["#4A5060", "#363B48", 1.4]);
    s += FO(D(rim), "#5E6575", 1.3);
    for (var a = 0; a < 360; a += 30){ var q0 = P(x + Math.cos(a * DEG) * R * .78, y + wd, zc + Math.sin(a * DEG) * R * .78), q1 = P(x + Math.cos(a * DEG) * R, y + wd, zc + Math.sin(a * DEG) * R); s += L(T.seg(q0, q1), 1, "#2B2F3A", .8); }
    return s + FO(D(hub), METAL[0], 1.1);
  }
  var ROVER = { x0: .7, x1: 2.95, y0: 1.2, y1: 2.45, z0: .78, z1: 1.22 };
  function roverBeacon(){ return P(.95, 2.2, 2.3); }
  var yard = {
    "moon-rover": {
      note: "A six-wheeled rover with a camera mast, a solar deck and a little dish", spot: [3.3, 3.45],
      egg: { n: "The moon rover", does: "its wheels spin up moon dust and its beacon blinks", say: "Beep beep! Six wheels, zero cavities. It's out collecting samples, like a good checkup." }, anim: "tp-pop 2.4s",
      draw: function(o){
        var V = ROVER, s = ell.apply(null, P(1.85, 1.95, 0).concat([30, 10, "#141824", 0, .16])), i;
        /* the far wheels, then the body, then the near wheels and their rocker arms */
        [.95, 1.82, 2.7].forEach(function(x){ s += wheel(x, V.y0 - .28, .36, .36, .24); });
        s += box(V.x0, V.y0, V.z0, V.x1 - V.x0, V.y1 - V.y0, V.z1 - V.z0, { top: WHITE[0], left: WHITE[0], right: WHITE[1] });
        s += F(D(T.onY(V.y1, T.rectUV(V.x0 + .05, V.x1 - .05, V.z0 + .06, V.z0 + .18))), GOLD[0]) + L(D(T.onY(V.y1, [[V.x0 + .05, V.z0 + .18], [V.x1 - .05, V.z0 + .18]]), true), .8, GOLD[1]);
        var lg = P(1.25, V.y1, (V.z0 + V.z1) / 2 + .06); s += circ(lg[0], lg[1], 3.6, "#3FA7E0", 1.1) + T.tinyTooth(lg[0], lg[1] + .3, .5, "#FFFFFF");
        /* the solar deck on top */
        s += solar([1.62, (V.y0 + V.y1) / 2, V.z1 + .08], [1, 0, 0], [0, 1, 0], .78, .5, 4, 2);
        /* the dish at the back, the antenna and its beacon */
        var dq = P(.95, 1.45, V.z1 + .05); s += L("M" + f(dq[0]) + " " + f(dq[1]) + " v-8", 2.6) + L("M" + f(dq[0]) + " " + f(dq[1]) + " v-8", 1.2, METAL[0]);
        s += '<g transform="translate(' + f(dq[0]) + " " + f(dq[1] - 9) + ') rotate(-24)">' + FO("M-7 -1.4 Q0 7 7 -1.4 Z", METAL[0], 1.3) + F("M-5 0 Q0 4.6 5 0 Z", METAL[1]) + L("M0 2 l0 -6", 1.1) + circ(0, -4.4, 1, INK) + "</g>";
        var ab = P(.95, 2.2, V.z1), bt = roverBeacon(); s += L(T.seg(ab, bt), 2.4) + L(T.seg(ab, bt), 1, METAL[0]) + beacon(bt[0], bt[1] - 1.6, 2.1, "#FFB23F");
        /* the camera mast and its head, two lenses looking out */
        var m0 = P(2.55, 1.75, V.z1), m1 = P(2.55, 1.75, 2.35); s += L(T.seg(m0, m1), 3.8) + L(T.seg(m0, m1), 2, METAL[0]);
        s += box(2.3, 1.5, 2.3, .55, .55, .4, { top: WHITE[0], left: WHITE[0], right: WHITE[1] }, { sw: 1.4, si: .9 });
        [[2.45, .1], [2.72, .07]].forEach(function(l, k){ var c = P(l[0], 2.06, 2.5); s += circ(c[0], c[1], k ? 1.5 : 2.2, "#2B2F3A", 1) + circ(c[0] - .5, c[1] - .6, k ? .5 : .8, "#BFE7FA"); });
        [.95, 1.82, 2.7].forEach(function(x){ s += wheel(x, V.y1 + .04, .36, .36, .24); });
        var hb = function(x){ return P(x, V.y1 + .3, .36); }, piv = P(1.4, V.y1 + .3, .86), piv2 = P(2.26, V.y1 + .3, .72);
        s += L(T.seg(hb(.95), piv) + " " + T.seg(piv, hb(1.82)) + " " + T.seg(piv, P(2.2, V.y1 + .3, .86)) + " " + T.seg(piv2, hb(2.7)), 2.6) + L(T.seg(hb(.95), piv) + " " + T.seg(piv, hb(1.82)) + " " + T.seg(piv, P(2.2, V.y1 + .3, .86)) + " " + T.seg(piv2, hb(2.7)), 1.2, METAL[1]) + circ(piv[0], piv[1], 1.4, METAL[0], .9);
        if (o.snow) s += ell.apply(null, P(1.6, 1.8, V.z1 + .14).concat([10, 2.6, "#FFFFFF", 0]));
        return s;
      },
      lights: function(){ var b = roverBeacon(); return circ(b[0], b[1] - 1.6, 7, "#FFB23F", 0).replace("/>", ' opacity=".3"/>'); },
      bits: function(){
        var s = "", b = roverBeacon();
        /* dust off the wheels, two tracks behind it, the beacon bright */
        [[.5, 2.85, .2, 4.6], [.2, 2.95, .55, 3.4], [.45, 1.0, .25, 3.8], [.1, 1.1, .6, 2.8], [-.15, 2.8, .9, 2.4]].forEach(function(q, i){ var c = P(q[0], q[1], q[2]), d = T.lumps(c[0], c[1], q[3], 60 + i, 6, .8); s += F(d, "#F1F0F5", .9) + L(d, 1, "#A9A5B8", .9); });
        s += L(D([[.62, 2.6, 0], [-.2, 2.6, 0]], true), 1.4, "#8E8AA1") + L(D([[.62, 1.05, 0], [-.2, 1.05, 0]], true), 1.4, "#8E8AA1");
        [.95, 1.82, 2.7].forEach(function(x){ var c = P(x, 2.75, .36); s += L("M" + f(c[0] - 3) + " " + f(c[1] - 5) + " a5 5 0 0 1 6 0", 1.3, "#FFFFFF"); });
        return s + circ(b[0], b[1] - 1.6, 6, "#FFE27A", 0).replace("/>", ' opacity=".55"/>') + circ(b[0], b[1] - 1.6, 2.4, "#FFF3C4", 1);
      }
    },
    "satellite-dish": {
      note: "A radio dish on a tripod, pointed up at the stars", spot: [3.35, 3.4],
      egg: { n: "The satellite dish", does: "it beams a signal up: rings pulse out of the dish", say: "Calling Earth! Message: brush twice a day. Over." }, anim: "tp-pop 2.6s",
      draw: function(o){ return dish(o, false); },
      lights: function(){ var fq = dishGeo().fq; return circ(fq[0], fq[1], 8, "#FF6B6B", 0).replace("/>", ' opacity=".3"/>'); },
      bits: function(){
        var g = dishGeo(), s = "", dx = g.up[0], dy = g.up[1], l = Math.sqrt(dx * dx + dy * dy), ux = dx / l, uy = dy / l, ang = Math.atan2(uy, ux) * 180 / Math.PI;
        for (var i = 0; i < 3; i++){ var d = 10 + i * 9, cx = g.fq[0] + ux * d, cy = g.fq[1] + uy * d, w = 7 + i * 5;
          s += '<g transform="translate(' + f(cx) + " " + f(cy) + ") rotate(" + f(ang + 90) + ')"><path class="tp-twinkle" d="M' + f(-w) + " 2 Q0 " + f(-5 - i) + " " + f(w) + ' 2" fill="none" stroke="#7FF0D2" stroke-width="2.6" stroke-linecap="round" style="animation-delay:' + f(i * .45) + 's"/></g>'; }
        return s + circ(g.fq[0], g.fq[1], 5, "#FFE27A", 0).replace("/>", ' opacity=".6"/>') + T.tinyTooth(g.fq[0] + ux * 44, g.fq[1] + uy * 44, .7, "#FFFFFF");
      }
    },
    "rocket": {
      note: "A tall finned rocket on its launch pad, a gantry beside it and a tooth on its nose", spot: [3.35, 3.45],
      egg: { n: "The rocket", does: "it rumbles, puffs smoke and hops up off the pad, then settles", say: "Three, two, one... liftoff! Well, lift-a-little. A rocket needs a full tank, and you need a full night's sleep." }, anim: "tp-jump 2.2s ease-in-out",
      draw: function(o){
        var s = "", c0 = P(RK.x, RK.y, 0), i;
        s += ell(c0[0] + 3, c0[1] + 2, 26, 9, "#141824", 0, .16);
        /* the pad: a low round deck, a ring painted on it */
        s += cyl(RK.x, RK.y, 0, 1.6, .3, 1.6, "#C9C6CF", "#A5A1B1", "#DAD8E0");
        var pc = P(RK.x, RK.y, .3); s += ell(pc[0], pc[1], RX(1.15), RY(1.15), "none", 0).replace('fill="none"', 'fill="none" stroke="#F2C94C" stroke-width="1.6"') + F("M" + f(pc[0] - 3) + " " + f(pc[1] - 1.4) + " l6 2.8 M" + f(pc[0] + 3) + " " + f(pc[1] - 1.4) + " l-6 2.8", "none");
        if (o.snow) s += ell(pc[0] - 6, pc[1] - 2, 12, 3, "#FFFFFF", 0);
        /* the gantry behind it: a lattice tower, two arms reaching over */
        s += gantry(o);
        s += rocketBody(o, 0);
        return s;
      },
      lights: function(){ var w = P(RK.x + RK.r * Math.cos(100 * DEG), RK.y + RK.r * Math.sin(100 * DEG), 3.2), t = P(GT.x + GT.w / 2, GT.y + GT.w / 2, GT.h + .3); return T.glowAt(w[0], w[1], 9) + circ(t[0], t[1] - 2, 8, "#FF6B6B", 0).replace("/>", ' opacity=".3"/>'); },
      bits: function(){
        /* the rocket again, lifted off the pad on its flame, with smoke billowing round the pad */
        var c0 = P(RK.x, RK.y, .3), s = "", e = P(RK.x, RK.y, .5);
        [[-24, 2, 8], [-15, 6, 9], [16, 6, 9], [25, 2, 8], [-6, 9, 8], [7, 9, 8], [-30, -3, 6], [31, -3, 6]].forEach(function(q){ s += circ(c0[0] + q[0], c0[1] + q[1] - 4, q[2], "#F1F0F5", 1.2); });
        s += FO("M" + f(e[0] - 5) + " " + f(e[1]) + " Q" + f(e[0] - 4) + " " + f(e[1] + 10) + " " + f(e[0]) + " " + f(e[1] + 17) + " Q" + f(e[0] + 4) + " " + f(e[1] + 10) + " " + f(e[0] + 5) + " " + f(e[1]) + " Z", "#FF9A3C", 1.2) + F("M" + f(e[0] - 2.6) + " " + f(e[1]) + " Q" + f(e[0] - 2) + " " + f(e[1] + 6) + " " + f(e[0]) + " " + f(e[1] + 11) + " Q" + f(e[0] + 2) + " " + f(e[1] + 6) + " " + f(e[0] + 2.6) + " " + f(e[1]) + " Z", "#FFE27A");
        [[-14, -50], [14, -44], [-12, -20], [13, -26]].forEach(function(q){ s += L("M" + f(c0[0] + q[0]) + " " + f(c0[1] + q[1]) + " l" + (q[0] < 0 ? -4 : 4) + " -1 M" + f(c0[0] + q[0]) + " " + f(c0[1] + q[1] + 4) + " l" + (q[0] < 0 ? -4 : 4) + " 1", 1.4, "#FFFFFF", .9); });
        return s + rocketBody({ night: false }, 1);
      }
    }
  };
  /* the dish: a bowl on a tripod, turned up and a little toward the light, a feed on three struts over it */
  function dishGeo(){
    var c = [1.75, 1.8, 2.45], n = norm([-.34, .44, .83]), a = norm(cross(n, [0, 0, 1])), b = cross(n, a), R = 1.32;
    var fz = [c[0] + n[0] * .95, c[1] + n[1] * .95, c[2] + n[2] * .95], fq = P(fz[0], fz[1], fz[2]), c2 = P(c[0], c[1], c[2]), up = [fq[0] - c2[0], fq[1] - c2[1]];
    return { c: c, n: n, a: a, b: b, R: R, fz: fz, fq: fq, up: up };
  }
  function dish(o){
    var g = dishGeo(), s = ell.apply(null, P(1.85, 1.9, 0).concat([26, 9, "#141824", 0, .16])), hub = [1.8, 1.85, .85], leg = function(an){ var ft = [1.8 + Math.cos(an * DEG) * 1.2, 1.85 + Math.sin(an * DEG) * 1.2, 0]; return L(D([ft, hub], true), 4) + L(D([ft, hub], true), 2, METAL[1]) + ell.apply(null, P(ft[0], ft[1], 0).concat([3, 1.4, METAL[2], 1])); };
    /* the tripod's back legs, a little receiver box by them with its cable, the front leg, the pedestal */
    s += leg(210) + leg(330);
    s += box(2.6, .3, 0, .62, .46, .44, { top: METAL[0], left: METAL[0], right: METAL[1] }, { sw: 1.3, si: .8 }) + L(D([[2.65, .76, .22], [2.2, 1.3, .3], [1.85, 1.75, .7]], true), 1.2, "#2B2F3A");
    var bq = P(2.95, .76, .26); s += circ(bq[0], bq[1], 1.1, o.night ? "#7FF0D2" : "#3ECF9E", .7);
    s += leg(90);
    s += cyl(1.8, 1.85, .7, .24, 1.75, .2, METAL[0], METAL[1], METAL[0], { sw: 1.5, si: .9 });
    s += box(1.6, 1.65, 1.72, .4, .4, .3, { top: METAL[0], left: METAL[1], right: METAL[2] }, { sw: 1.3, si: .8 });
    s += L(D([[1.8, 1.85, 1.95], [g.c[0], g.c[1], g.c[2] - .1]], true), 4.4) + L(D([[1.8, 1.85, 1.95], [g.c[0], g.c[1], g.c[2] - .1]], true), 2.4, METAL[0]);
    /* the bowl: its back shell, then the dish face, with the shade its rim throws inside */
    var rim = ring(g.c, g.a, g.b, g.R, 0, 360, 32), back = [g.c[0] - g.n[0] * .55, g.c[1] - g.n[1] * .55, g.c[2] - g.n[2] * .55];
    var shell = hull(rim.map(function(q){ return P(q[0], q[1], q[2]); }).concat([P(back[0], back[1], back[2])]));
    s += FO(D2(shell), METAL[1], 1.8) + FO(D(rim), "#F1F3F7", 1.6);
    var dip = function(k){ return [g.c[0] - g.n[0] * .2 * (1 - k * k), g.c[1] - g.n[1] * .2 * (1 - k * k), g.c[2] - g.n[2] * .2 * (1 - k * k)]; };
    s += F(D(ring(g.c, g.a, g.b, g.R * .92, 110, 290, 14).concat(ring(dip(.5), g.a, g.b, g.R * .5, 290, 110, 14))), "#CDD3DD", .95);
    [.45, .75].forEach(function(k){ s += L(D(ring(dip(k), g.a, g.b, g.R * k, 0, 360, 24)), .8, INK, .3); });
    if (o.snow) s += F(D(ring(dip(.4), g.a, g.b, g.R * .45, 0, 360, 18)), "#FFFFFF");
    s += L(D(rim), 2.2, "#FFFFFF", .5).replace(/ opacity="[^"]*"/, ' opacity=".5"') + O(D(rim), 1.6);
    /* the feed on its three struts, a light on its tip */
    [30, 150, 270].forEach(function(t){ var ca = Math.cos(t * DEG) * g.R * .9, sa = Math.sin(t * DEG) * g.R * .9, q = [g.c[0] + ca * g.a[0] + sa * g.b[0], g.c[1] + ca * g.a[1] + sa * g.b[1], g.c[2] + ca * g.a[2] + sa * g.b[2]]; s += L(D([q, g.fz], true), 2.4) + L(D([q, g.fz], true), 1, METAL[0]); });
    s += circ(g.fq[0], g.fq[1] + 1, 2.8, METAL[1], 1.2) + beacon(g.fq[0], g.fq[1] - 2.4, 2);
    return s;
  }
  /* the rocket on its pad, and the gantry beside it */
  var RK = { x: 1.95, y: 2.0, r: .5, z0: 1.05, z1: 4.0, z2: 5.6 }, GT = { x: 1.65, y: .1, w: .62, h: 5.0 };
  function gantry(o){
    var s = "", x0 = GT.x, y0 = GT.y, w = GT.w, h = GT.h, red = "#E5484D", z;
    /* its four legs (the far one hidden), braces on the two faces we see */
    var legs = [[x0, y0 + w], [x0 + w, y0 + w], [x0 + w, y0]];
    legs.forEach(function(q){ s += L(D([[q[0], q[1], 0], [q[0], q[1], h]], true), 3.4) + L(D([[q[0], q[1], 0], [q[0], q[1], h]], true), 1.6, red); });
    for (var k = 0, dz = h / 6; k < 6; k++){
      z = k * dz;
      s += L(D([[x0, y0 + w, z], [x0 + w, y0 + w, z + dz]], true) + D([[x0 + w, y0 + w, z], [x0, y0 + w, z + dz]], true) + D([[x0 + w, y0 + w, z], [x0 + w, y0, z + dz]], true) + D([[x0 + w, y0, z], [x0 + w, y0 + w, z + dz]], true), 1, red, .9);
      s += L(D([[x0, y0 + w, z], [x0 + w, y0 + w, z], [x0 + w, y0, z]], true), 1.2, INK, .8);
    }
    s += FO(D([[x0 - .08, y0 - .08, h], [x0 + w + .08, y0 - .08, h], [x0 + w + .08, y0 + w + .08, h], [x0 - .08, y0 + w + .08, h]]), "#B8323A", 1.4);
    var t = P(x0 + w / 2, y0 + w / 2, h); s += L("M" + f(t[0]) + " " + f(t[1]) + " v-4", 1.6) + beacon(t[0], t[1] - 5.4, 2.1);
    /* the arms, reaching to the rocket */
    [3.5, 2.2].forEach(function(z){ s += L(D([[x0 + w / 2, y0 + w, z], [RK.x - .05, RK.y - RK.r + .05, z]], true), 4) + L(D([[x0 + w / 2, y0 + w, z], [RK.x - .05, RK.y - RK.r + .05, z]], true), 2, METAL[0]); });
    return s;
  }
  function rocketBody(o, copy){
    var s = "", x = RK.x, y = RK.y, r = RK.r, red = "#E5484D", redS = "#B8323A";
    /* the fins: the two either side, then the engine bell */
    var fin = function(a){ var ca = Math.cos(a * DEG), sa = Math.sin(a * DEG), q = function(rr, z){ return [x + ca * rr, y + sa * rr, z]; };
      return D([q(r * .9, RK.z0 + 1.2), q(r * .96, RK.z0 - .1), q(r + .7, .32), q(r + .78, .62)]); };
    s += FO(fin(315), redS, 1.6) + FO(fin(135), red, 1.6);
    s += T.cone(x, y, .45, .34, RK.z0 + .15, METAL[1], METAL[2]).replace(/<path/, "<path");
    s += cyl(x, y, .45, .36, .55, .36, METAL[2], "#6F7984", "#3B4252", { sw: 1.4, si: .9 });
    /* the body: white with red bands, two portholes */
    s += cyl(x, y, RK.z0, r, RK.z1, r, WHITE[0], WHITE[1], WHITE[0], { open: true });
    s += cyl(x, y, RK.z0, r + .01, RK.z0 + .32, r + .01, red, redS, red, { open: true }) + cyl(x, y, RK.z1 - .4, r + .01, RK.z1 - .2, r + .01, red, redS, red, { open: true });
    [[100, 3.2, .2], [100, 2.35, .17]].forEach(function(w){ var a = w[0] * DEG, pw = port({ c: [x + r * Math.cos(a), y + r * Math.sin(a), w[1]], e1: [-Math.sin(a), Math.cos(a), 0], e2: [0, 0, 1] }, w[2], !copy && o.night, METAL[0]); s += pw.s; });
    /* the nose cone, with a tooth on it */
    s += T.cone(x, y, RK.z1, r, RK.z2, red, redS, { hi: true });
    var tq = P(x + r * .45 * Math.cos(100 * DEG), y + r * .45 * Math.sin(100 * DEG), RK.z1 + .55); s += T.tinyTooth(tq[0], tq[1], .8, "#FFFFFF");
    /* the fin toward us, seen edge-on */
    var fa = 45 * DEG, fq = function(rr, z){ return P(x + Math.cos(fa) * rr, y + Math.sin(fa) * rr, z); }, f0 = fq(r, RK.z0 + 1.1), f1 = fq(r, RK.z0 - .05), f2 = fq(r + .72, .32), f3 = fq(r + .78, .62);
    s += FO("M" + f(f0[0] - 1.6) + " " + f(f0[1]) + " L" + f(f1[0] - 1.6) + " " + f(f1[1]) + " L" + f(f2[0] - 1.8) + " " + f(f2[1]) + " L" + f(f3[0] + 1.8) + " " + f(f3[1]) + " L" + f(f1[0] + 1.6) + " " + f(f1[1] - 2) + " L" + f(f0[0] + 1.6) + " " + f(f0[1]) + " Z", red, 1.5);
    if (o.snow && !copy){ var sn = P(x, y, RK.z1 + .5); s += F("M" + f(sn[0] - 4) + " " + f(sn[1] + 1) + " q4 -3 8 0 q-4 1.4 -8 0 z", "#FFFFFF"); }
    return s;
  }

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  /* a coil spring from (x0, y0) to (x1, y1): an ink coil with a colored one over it */
  function spring(x0, y0, x1, y1, n, w, col){ /* n loops of a coil, w wide */
    var dx = x1 - x0, dy = y1 - y0, l = Math.sqrt(dx * dx + dy * dy), ux = dx / l, uy = dy / l, d = "M" + f(x0) + " " + f(y0);
    for (var i = 0; i < n; i++){ var t0 = (i + .5) / n, t1 = (i + 1) / n, sg = i % 2 ? 1 : -1;
      d += " Q" + f(x0 + dx * t0 - uy * w * sg) + " " + f(y0 + dy * t0 + ux * w * sg) + " " + f(x0 + dx * t1) + " " + f(y0 + dy * t1); }
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function bopper(x, y, c){ return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="' + c[2] + '" opacity=".45"/><circle cx="' + x + '" cy="' + y + '" r="9.4" fill="' + c[0] + '" ' + O3 + '/><path d="M' + (x + 1) + " " + (y + 9.2) + " A9.4 9.4 0 0 0 " + (x + 9.2) + " " + (y + 1) + " A11 11 0 0 1 " + (x + 1) + " " + (y + 9.2) + ' Z" fill="' + c[1] + '"/><circle cx="' + (x - 3) + '" cy="' + (y - 3.2) + '" r="2.4" fill="#FFFFFF"/>'; }
  var GLOW = ["#B6F06A", "#7CC43E", "#E4FFB0"];
  var tank = function(x, flip){
    var s = p("M" + x + " 54 C" + x + " 44 " + (x + 26) + " 44 " + (x + 26) + " 54 L" + (x + 26) + " 128 C" + (x + 26) + " 134 " + x + " 134 " + x + " 128 Z", "#D5DBE1", O3);
    s += '<path d="M' + (x + 18) + " 50 C" + (x + 24) + " 52 " + (x + 24) + " 56 " + (x + 24) + " 60 L" + (x + 24) + " 126 C" + (x + 22) + " 130 " + (x + 18) + " 131 " + (x + 16) + ' 131 Z" fill="#A9B3BE"/>';
    s += '<path d="M' + (x + 6) + ' 58 V118" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
    s += p("M" + (x - 1) + " 66 h28 v8 h-28 z", "#E5484D", O2) + p("M" + (x - 1) + " 108 h28 v8 h-28 z", "#E5484D", O2);
    s += p("M" + (x + 7) + " 44 C" + (x + 7) + " 36 " + (x + 19) + " 36 " + (x + 19) + " 44 Z", "#E5484D", O2) + '<path d="M' + (x + 13) + ' 37 v-6" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><circle cx="' + (x + 13) + '" cy="30" r="2.6" fill="#F2C94C" ' + O2 + "/>";
    return s;
  };
  var flame = function(x){ return p("M" + (x - 7) + " 140 Q" + (x - 9) + " 156 " + x + " 172 Q" + (x + 9) + " 156 " + (x + 7) + " 140 Z", "#FF9A3C", O2) + '<path d="M' + (x - 3.6) + " 141 Q" + (x - 4.4) + " 152 " + x + " 162 Q" + (x + 4.4) + " 152 " + (x + 3.6) + ' 141 Z" fill="#FFE27A"/>'; };
  var nozzle = function(x){ return p("M" + (x - 6) + " 131 h12 l2.4 9 h-16.8 z", "#8E98A3", O2) + '<path d="M' + (x - 5) + ' 135 h10" stroke="#59647A" stroke-width="1.6"/>'; };
  var outfits = {
    "antenna-headband": {
      note: "A headband with two springy antennae, a glowing ball on each",
      top: spring(80, 32, 63, 4, 6, 6, "#D5DBE1") + spring(120, 32, 137, 4, 6, 6, "#D5DBE1") + bopper(61, -4, GLOW) + bopper(139, -4, GLOW) +
        p("M43 82 C36 52 54 27 78 27 C92 27 96 36 100 37 C104 36 108 27 122 27 C146 27 164 52 157 82 L150 82 C155 56 142 35 122 35 C110 35 106 44 100 45 C94 44 90 35 78 35 C58 35 45 56 50 82 Z", "#7A5CD6", O3) +
        '<path d="M52 66 C50 50 60 36 76 33" fill="none" stroke="#B9A6F2" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="80" cy="31.6" r="4" fill="#D5DBE1" ' + O2 + '/><circle cx="120" cy="31.6" r="4" fill="#D5DBE1" ' + O2 + "/>",
      say: ["Beep boop. I'm picking up a signal. It says floss.", "Two antennae: twice the reception, twice a day.", "Take me to your leader. Or your hygienist."]
    },
    "space-visor": {
      note: "A wraparound gold visor for the glare of the sun, with a smile left showing", noLoupes: true,
      face: p("M40 74 C40 62 52 58 60 58 L140 58 C148 58 160 62 160 74 L160 80 L40 80 Z", "#D5DBE1", O3) +
        '<path d="M42 78 C42 64 64 62 100 62 C136 62 158 64 158 78 C158 92 150 99 136 99 Q118 100 107 94 Q100 90 93 94 Q82 100 64 99 C50 99 42 92 42 78 Z" fill="#F2C94C" opacity=".62"/>' +
        '<path d="M42 78 C42 64 64 62 100 62 C136 62 158 64 158 78 C158 92 150 99 136 99 Q118 100 107 94 Q100 90 93 94 Q82 100 64 99 C50 99 42 92 42 78 Z" fill="none" ' + O4 + "/>" +
        '<path d="M56 70 Q66 66 78 66 M54 78 L62 72" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity=".85"/><path d="M128 92 Q140 91 148 84" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>' +
        '<circle cx="140" cy="72" r="4.2" fill="#3E8EDC" stroke="' + INK + '" stroke-width="1.2"/><path d="M137.4 71 q2 -1.4 3.6 .2 M139 74 q2 .8 3.4 -.6" stroke="#63B35A" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M118 70 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 z" fill="#FFFFFF"/>' +
        '<path d="M44 74 Q100 66 156 74" fill="none" stroke="#C9971C" stroke-width="2" opacity=".8"/>' +
        '<circle cx="40" cy="78" r="7" fill="#A9B3BE" ' + O3 + '/><circle cx="160" cy="78" r="7" fill="#A9B3BE" ' + O3 + '/><circle cx="160" cy="78" r="2.6" fill="#3ECF9E"/><circle cx="40" cy="78" r="2.6" fill="#E5484D"/>',
      say: ["Visor down. No air up here to soften the sun.", "Gold visor, like a gold crown: shiny and protective.", "I can see you smiling from here. Keep that smile clean."]
    },
    "jetpack": {
      note: "Twin silver tanks on his back, little flames under them, straps over his front",
      back: tank(14, false) + tank(160, true) + p("M36 70 h128 v46 h-128 z", "#A9B3BE", O3),
      face: nozzle(27) + nozzle(173) + flame(27) + flame(173) +
        p("M48 70 C56 82 62 104 62 136 L72 140 C72 108 66 82 58 66 Z", "#3B4252", O2) + p("M152 70 C144 82 138 104 138 136 L128 140 C128 108 134 82 142 66 Z", "#3B4252", O2) +
        p("M60 126 Q100 134 140 126 L140 134 Q100 142 60 134 Z", "#3B4252", O2) +
        '<circle cx="100" cy="134" r="9" fill="#F2C94C" ' + O3 + "/>" + T.tinyTooth(100, 134.6, 1.25, "#FFFFFF"),
      say: ["Jetpack on! Next stop: your back molars.", "Liftoff in three, two... brush!", "I fly to every checkup. Twice a year, never late."]
    }
  };

  return { k: "moonbase", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
