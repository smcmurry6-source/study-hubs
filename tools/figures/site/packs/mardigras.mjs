/* The Mardi Gras set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the
   same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source
   into tools/preview/design/place.js, so it may use nothing from outside itself but T. Structure: packs/thanksgiving.mjs.

   Purple, green and gold throughout. Beads, bells, balloons, brass and confetti; no king cake, no drinks, no sweets
   (never sugar: Timmy is a tooth) and nothing religious. No ids, gradients, filters, text, images or emoji. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var PUR = ["#9457D0", "#7240AE", "#4F2B80"], GRN = ["#3FB36F", "#2B8A52"], GLD = ["#F4C63A", "#C9971C"], MG = [PUR[0], GLD[0], GRN[0]];
  function m(x, y){ return f(x) + " " + f(y); }
  /* a strand of beads in screen space, sagging between two points */
  function strand(x0, y0, x1, y1, sag, n, col, r, sw){
    var s = "", cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + sag;
    for (var i = 0; i <= n; i++){ var t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; s += circ(a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1, r, typeof col === "string" ? col : col[i % col.length], sw == null ? .6 : sw); }
    return s;
  }
  /* a paper streamer: ink under, color over */
  function ribbon(d, col, w){ return L(d, (w || 2.2) + 1.5) + L(d, w || 2.2, col); }
  /* a hanging basket of fern on its hook at (x, y) */
  function basket(x, y, k, night){
    var c = night ? ["#57A06A", "#3A7A4E"] : ["#6CC774", "#3F9A54"], cy = y + 4.6 * k, s = L("M" + m(x, y) + " V" + f(cy), .8);
    [[-8, 5], [8, 5], [-7.4, -1], [7.4, -1], [-4.4, -5], [4.4, -5], [-5.4, 8.4], [5.4, 8.4], [0, -6], [-2.2, 9.6], [2.2, 9.6]].forEach(function(q, i){
      s += L("M" + m(x, cy) + " q" + m(q[0] * .7 * k, (q[1] - 5) * .6 * k) + " " + m(q[0] * k, q[1] * k), 2.1 * k, c[i % 2]); });
    return s + FO("M" + m(x - 2.6 * k, cy) + " h" + f(5.2 * k) + " q0 " + f(3.4 * k) + " " + f(-2.6 * k) + " " + f(3.4 * k) + " q" + f(-2.6 * k) + " 0 " + f(-2.6 * k) + " " + f(-3.4 * k) + " z", "#B5651D", .8);
  }
  function balloon(x, y, col, k){
    k = k || 1;
    return FO("M" + m(x - 1.3 * k, y + 6.6 * k) + " l" + m(1.3 * k, -1.6 * k) + " " + m(1.3 * k, 1.6 * k) + " z", col, .7) + ell(x, y, 4.6 * k, 5.6 * k, col, 1.1) + L("M" + m(x - 2.4 * k, y - 1.6 * k) + " q.2 " + f(-2.2 * k) + " " + m(1.8 * k, -2.6 * k), 1, "#FFFFFF", .8);
  }
  /* a trumpet in screen space, mouthpiece left, bell right, about 24 long */
  function trumpet(x, y){
    var tube = "M" + m(x - 11, y + 1.6) + " L" + m(x + 4, y - 1), loop = "M" + m(x - 6.4, y + .8) + " h7 q2 .2 2 2.2 q0 2 -2 2 h-7 q-2 0 -2 -2.1 q0 -2.1 2 -2.1 z", v = "M" + m(x - 4.6, y - .2) + " v-3.4 M" + m(x - 2, y - .6) + " v-3.4 M" + m(x + .6, y - 1) + " v-3.4";
    return L(loop, 2.8) + L(loop, 1.3, GLD[0]) + L(tube, 4) + L(tube, 2.2, GLD[0]) + L(v, 2.6) + L(v, 1.2, GLD[1]) +
      FO("M" + m(x + 3, y - 2.8) + " q5.4 -.6 8.6 -5 l1.8 10.6 q-4.8 -3.4 -9.8 -2.8 z", GLD[0], 1.1) + ell(x + 12.6, y - 2.4, 1.5, 5.4, "#FBE7A0", 1) + FO("M" + m(x - 12.8, y + .4) + " l2 -.3 v3.2 l-2 -.5 z", GLD[1], .8);
  }
  function note(x, y, two){
    return ell(x, y, 2.3, 1.7, INK, 0) + L("M" + m(x + 2, y) + " v-7.4" + (two ? " l5.4 -1.4 v7.4" : " q3 .8 3.2 3.6"), 1.4) + (two ? ell(x + 5.4, y - 1.4, 2.3, 1.7, INK, 0) : "");
  }

  /* ------------------------------------------------------------------ the home: a French Quarter townhouse ---------- */
  var homes = {
    "french-quarter": {
      note: "A tall, narrow townhouse: two iron-lace galleries, shutters, hanging ferns and gas lanterns by a green door",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the roof", paint: "Stucco paint" },
      door: [5.5, 8.4], brush: [7.7, 9.35], statue: [3.4, 9.5], spots: { door: [5.5, 10.4] }, h: 11.3,
      eaves: [[2.7, 8.8, 8.6], [8.3, 8.8, 8.6]], foot: [3.0, 3.8, 8.6, 9.0], base: [[3.0, 8.4], [8.0, 8.4], [8.0, 3.8]], block: [2.8, 3.5, 8.6, 9.0],
      draw: function(o){
        var u = o.up, wp = o.paint && o.paint !== "cream" ? T.PAINTS[o.paint] : { c: "#F9DB7C", s: "#DFB854" }, s = "", lights = "";
        var x0 = 3.0, x1 = 8.0, y0 = 3.8, y1 = 8.4, zw = 8.5, g1 = 3.5, g2 = 6.1, SH = "#7C4BC0", TRIM = "#FFFDF6";
        var e0 = x0 - .3, e1 = x1 + .3, ye = y1 + .4, ze = 8.6, ym = 6.1, zr = 10.4, yb = y0 - .4;
        var a = x0 - .2, b = x1 + .7, c = y1 + .7, e = y0 - .1, th = .14, rh = .82;
        var roof = o.snow ? ["#F7FBFF", "#DCEAF6", "#C4D6E6"] : ["#70598A", "#58466C", "#463756"];
        var post = function(x, y, z0, z1){ return L(D([[x, y, z0], [x, y, z1]], true), 1.7); };
        /* an iron-lace railing on a wall plane: bars, a zigzag of lace under the top rail */
        var rail = function(face, pl, u0, u1, z){
          var on = face === "y" ? T.onY : T.onX, n = Math.max(2, Math.round((u1 - u0) / .3)), bars = "", zz = [], i;
          for (i = 1; i < n; i++) bars += D(on(pl, [[u0 + (u1 - u0) * i / n, z], [u0 + (u1 - u0) * i / n, z + rh - .24]]), true);
          for (i = 0; i <= n * 2; i++) zz.push([u0 + (u1 - u0) * i / (n * 2), z + rh - (i % 2 ? .05 : .22)]);
          return L(bars, .7) + L(D(on(pl, zz), true), .7) + L(D(on(pl, [[u0, z + rh - .24], [u1, z + rh - .24]]), true), .8) + L(D(on(pl, [[u0, z + .09], [u1, z + .09]]), true), .9) +
            L(D(on(pl, [[u0, z + rh], [u1, z + rh]]), true), 1.8) + L(D(on(pl, [[u0, z], [u0, z + rh]]), true) + D(on(pl, [[u1, z], [u1, z + rh]]), true), 1.5);
        };
        /* a gallery: a deck round the front and the right side, its edge and its railings */
        var gallery = function(z){
          var zt = z + th, g = FO(D([[a, y1, zt], [x1, y1, zt], [x1, e, zt], [b, e, zt], [b, c, zt], [a, c, zt]]), o.snow ? "#FFFFFF" : "#EDE4D3", 1.2);
          g += FO(D([[a, c, z], [b, c, z], [b, c, zt], [a, c, zt]]), "#66557A", 1.2) + FO(D([[b, e, z], [b, c, z], [b, c, zt], [b, e, zt]]), "#4C3D5C", 1.2);
          return g + rail("x", a + .03, y1 + .05, c - .03, zt) + rail("x", b - .03, e + .03, c - .03, zt) + rail("y", c - .03, a + .03, b - .03, zt);
        };
        var fernAt = function(x, y, z, k){ var q = P(x, y, z); return basket(q[0], q[1], k, o.night); };

        /* over the ridge: the far slope and a brick chimney */
        s += T.backSlope(e0, e1, ym, yb, ze, zr, roof[1]);
        s += box(3.5, 4.9, 9.4, .7, .7, 1.5, { top: "#8E5E50", left: "#CC7A60", right: "#A85C48" }, { sw: 1.5, si: 1 }) + box(3.4, 4.8, 10.9, .9, .9, .2, { top: o.snow ? "#FFFFFF" : "#8E98A3", left: "#D5DBE1", right: "#A9B3BE" }, { sw: 1.3, si: .9 });
        /* the walls: the shaded side with its gable, then the front */
        s += FO(D([[x1, y0, 0], [x1, y1, 0], [x1, y1, zw + .3], [x1, ym, zr - .1], [x1, y0, zw + .3]]), wp.s);
        s += FO(D([[x0, y1, 0], [x1, y1, 0], [x1, y1, zw], [x0, y1, zw]]), wp.c);
        s += L(D([[x0, y1, .1], [x0, y1, zw]], true) + D([[x1, y1, .1], [x1, y1, zw]], true), 2.2, TRIM, .9);
        var pw = T.porthole("x", x1, ym, 9.3, .36, { night: o.night }); s += pw.s; lights += pw.lights;
        [[.95, 2.45], [3.85, 5.3], [6.45, 7.85]].forEach(function(z){
          [[4.55, 5.35], [6.75, 7.55]].forEach(function(q){ var w = T.win("x", x1, q[0], q[1], z[0], z[1], { night: o.night, shutters: SH }); s += w.s; lights += w.lights; });
        });
        [[3.85, 5.35], [6.45, 7.9]].forEach(function(z){
          [[3.8, 4.6], [6.4, 7.2]].forEach(function(q){ var w = T.win("y", y1, q[0], q[1], z[0], z[1], { night: o.night, shutters: SH }); s += w.s; lights += w.lights; });
        });
        /* the door in its white surround, a stone step, a gas lantern on each side */
        s += FO(D(T.onY(y1, T.archUV(4.72, 6.28, 0, 2.86, 10))), TRIM, 1.4) + T.doorArch("y", y1, 4.9, 6.1, 2.66, { color: GRN[0] });
        s += L(D(T.onY(y1, [[5.1, .25], [5.1, 1.5], [5.42, 1.5], [5.42, .25]]), false) + D(T.onY(y1, [[5.58, .25], [5.58, 1.5], [5.9, 1.5], [5.9, .25]]), false), .8, GRN[1]);
        s += box(4.7, 8.4, 0, 1.6, .5, .16, { top: "#EEE8F2", left: K.stone, right: K.stoneShade }, { sw: 1.3, si: .8 });
        [4.42, 6.58].forEach(function(uu){
          var q = P(uu, y1 + .16, 2.5), lamp = "M" + m(q[0] - 2, q[1]) + " h4 l-.8 5.4 h-2.4 z";
          s += L("M" + m(q[0], q[1] - 3.4) + " v2", 1.1) + FO(lamp, o.night ? K.lit : "#FFE9A8", 1) + FO("M" + m(q[0] - 2.6, q[1]) + " l2.6 -2.4 2.6 2.4 z", INK, .6);
          if (o.night) lights += T.glowAt(q[0], q[1] + 2.6, 9) + FO(lamp, K.litHot, 1);
        });
        /* the lower gallery on its corner posts, a fern hanging under it */
        s += post(b - .06, e + .06, 0, g1) + post(a + .06, c - .06, 0, g1) + post(b - .06, c - .06, 0, g1);
        s += fernAt(4.1, c - .12, g1, .78) + fernAt(b - .12, 6.65, g1, .78);
        s += gallery(g1);
        /* the upper gallery: posts, ferns, then its railing dressed in purple, green and gold */
        s += post(b - .06, e + .06, g1 + th, g2) + post(a + .06, c - .06, g1 + th, g2) + post(b - .06, c - .06, g1 + th, g2);
        s += fernAt(3.0, c - .12, g2, .8) + fernAt(6.1, c - .12, g2, .8) + fernAt(b - .12, 6.65, g2, .8) + fernAt(b - .12, 4.5, g2, .7);
        s += gallery(g2);
        var zt = g2 + th + rh, i, A, B, w5 = (b - a) / 5, w4 = (c - e) / 4;
        for (i = 3; i >= 0; i--){ A = P(b, e + i * w4, zt); B = P(b, e + (i + 1) * w4, zt); s += FO("M" + m(A[0], A[1]) + " Q" + m((A[0] + B[0]) / 2 + 1, (A[1] + B[1]) / 2 + 9) + " " + m(B[0], B[1]) + " Z", [PUR[1], GLD[1], GRN[1]][i % 3], .9); }
        for (i = 0; i < 5; i++){ A = P(a + i * w5, c, zt); B = P(a + (i + 1) * w5, c, zt); s += FO("M" + m(A[0], A[1]) + " Q" + m((A[0] + B[0]) / 2 - 1, (A[1] + B[1]) / 2 + 9) + " " + m(B[0], B[1]) + " Z", MG[i % 3], .9); }
        /* the slate roof, its bargeboard, a dormer */
        var slope = [[e0, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0, ym, zr]];
        s += F(D(slope), roof[0]) + F(D([[e0 + 3.6, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0 + 4.6, ym, zr]]), roof[1], .45);
        for (i = 1; i < 4; i++) s += L(D([[e0, ye - (ye - ym) * i / 4, ze + (zr - ze) * i / 4], [e1, ye - (ye - ym) * i / 4, ze + (zr - ze) * i / 4]], true), 1, roof[2], .6);
        s += T.HI(D([[e0 + .4, ye - .3, ze + .25], [e0 + .8, ym + .5, zr - .3]], true), 2);
        s += FO(D([[e1, ye, ze], [e1, ym, zr], [e1, yb, ze], [e1, yb, ze - .32], [e1, ym, zr - .38], [e1, ye, ze - .32]]), roof[2]) + O(D(slope));
        if (o.snow) s += T.snowSlope(e0, e1, ye, ym, ze, zr);
        var yd = 8.05;
        s += FO(D([[6.0, yd, 9.1], [6.0, yd, 9.85], [6.0, 6.93, 9.85]]), wp.s, 1.3) + FO(D([[5.0, yd, 9.1], [6.0, yd, 9.1], [6.0, yd, 9.85], [5.5, yd, 10.2], [5.0, yd, 9.85]]), wp.c, 1.4);
        var dw = T.win("y", yd, 5.2, 5.8, 9.2, 9.8, { night: o.night }); s += dw.s; lights += dw.lights;
        s += FO(D([[5.5, yd + .12, 10.26], [4.88, yd + .12, 9.82], [4.88, 7.0, 9.82], [5.5, 6.4, 10.26]]), o.snow ? "#FFFFFF" : roof[0], 1.3) + FO(D([[5.5, yd + .12, 10.26], [6.12, yd + .12, 9.82], [6.12, 7.0, 9.82], [5.5, 6.4, 10.26]]), o.snow ? "#DCEAF6" : roof[2], 1.3);
        if (u.flag) s += T.flagOn(7.9, ym, zr - .05, 2.2);
        else { var fin = P(8.0, ym, zr); s += L("M" + m(fin[0], fin[1]) + " v-6", 1.4) + circ(fin[0], fin[1] - 7.4, 2.2, GLD[0], 1); }
        if (o.night) lights += T.firefly(132, 150, .3) + T.firefly(268, 128, 1.4);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: parade street ---------------------- */
  var ROW = [[34, 30, 96, 0], [64, 34, 82, 1], [98, 30, 92, 2], [128, 32, 80, 3], [160, 30, 90, 0], [210, 30, 90, 2], [240, 32, 80, 1], [272, 30, 92, 4], [302, 34, 82, 0], [336, 34, 96, 2]];
  var WALLS = [["#BB97E8", "#6E5C9E", "#F4C63A"], ["#F7D76E", "#9C8C5C", "#3FA06A"], ["#78CC9E", "#4F8672", "#7C4BC0"], ["#F5ABC2", "#98728C", "#4FA774"], ["#8AD1E8", "#567F98", "#F4C63A"]];
  function rowHouse(q, i, o){
    var x = q[0], w = q[1], top = q[2], c = WALLS[q[3]], nt = o.night, wall = nt ? c[1] : c[0], s = FO("M" + x + " 214 V" + top + " h" + w + " V214 Z", wall, 1.4), r, j, k, bars = "";
    if (i % 2) s += FO("M" + (x - 1.5) + " " + (top - 4) + " h" + (w + 3) + " v5 h" + (-(w + 3)) + " z", o.snow ? "#FFFFFF" : nt ? "#A9A0BE" : "#FFFDF6", 1.2);
    else s += FO("M" + (x - 2) + " " + top + " l5 -10 h" + (w - 6) + " l5 10 z", o.snow ? "#F7FBFF" : nt ? "#4A3D5E" : "#75608C", 1.3) + FO("M" + f(x + w / 2 - 3.4) + " " + (top - 1.4) + " v-5.4 l3.4 -3 3.4 3 v5.4 z", wall, 1) + F("M" + f(x + w / 2 - 1.6) + " " + (top - 6.6) + " h3.2 v3.6 h-3.2 z", nt ? K.lit : "#D8F1FC");
    for (r = 0; r < 3; r++) for (j = 0; j < 2; j++){
      var wx = x + w * (j ? .7 : .3) - 2.6, wy = top + 7 + r * 17, pane = nt ? ((i + r + j) % 4 ? K.lit : "#5A5378") : "#D8F1FC";
      s += F("M" + f(wx - 2.5) + " " + wy + " h2.2 v10 h-2.2 z M" + f(wx + 5.5) + " " + wy + " h2.2 v10 h-2.2 z", c[2]) + FO("M" + f(wx) + " " + wy + " h5.2 v10 h-5.2 z", pane, .9);
    }
    var by = top + 7 + 17 + 12;
    for (k = x; k < x + w + 1; k += 3) bars += "M" + k + " " + by + " v-5";
    return s + L(bars, .6) + L("M" + (x - 1.5) + " " + by + " h" + (w + 3), 1.5) + L("M" + (x - 1.5) + " " + (by - 5) + " h" + (w + 3), .9);
  }
  /* a string of party lights from (x0, y0) to (x1, y1), sagging */
  function lightString(x0, y0, x1, y1, sag, n, night){
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + sag, s = L("M" + m(x0, y0) + " Q" + m(cx, cy) + " " + m(x1, y1), 1, INK, .8), i;
    for (i = 1; i < n; i++){
      var t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t, x = a * x0 + b * cx + c * x1, y = a * y0 + b * cy + c * y1 + 2, col = night ? ["#D9B8FF", "#FFF0A8", "#B4F5CC"][i % 3] : MG[i % 3];
      if (night) s += circ(x, y, 5.4, col, 0).replace("/>", ' opacity=".3"/>');
      s += circ(x, y, 2.3, col, .7);
    }
    return s;
  }
  function curl(x, n, col, flip){
    var d = "M" + x + " -6", i;
    for (i = 0; i < n; i++) d += " q" + ((i % 2 ? -1 : 1) * (flip ? -7 : 7)) + " 4.5 0 9";
    return ribbon(d, col, 2.2);
  }
  var scenes = {
    "parade-street": T.hillScene({
      note: "A cobbled street on parade day: streamers, strings of lights, a row of bright townhouses and confetti underfoot",
      path: "gold", treeKind: "round", lamp: "post", grade: ["#E8C8FF", .06],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#7A7098", "#6E648C", "#60577E", "#4A4266"] : ["#DDD4E8", "#CFC5DC", "#BEB2CF", "#9C8FB3"]; },
      sky: function(o){
        var st = curl(124, 4, MG[0]) + curl(148, 2, MG[1], true) + curl(252, 3, MG[2]) + curl(276, 5, MG[0], true) + curl(322, 3, MG[1]) + curl(346, 6, MG[2], true) + curl(54, 2, MG[2], true), cf = "", R = T.rng(41), i;
        for (i = 0; i < 26; i++){ var x = 48 + R() * 304, y = 8 + R() * 70; cf += F("M" + m(x, y) + " l2.4 .9 -.9 2.4 -2.4 -.9 z", [PUR[0], GLD[0], GRN[0], "#F58FB0"][i % 4], o.night ? .7 : .9); }
        if (o.night) return T.bands(["#1D1444", "#291B5A", "#39256F", "#4C3284"], 0, 300) + T.starField(11, 24, 120) + T.moon(86, 23) + cf + st;
        return T.bands(["#BBD8F8", "#CCE2FA", "#E0EBFB", "#F4EEFB"], 0, 300) + T.sun(86, 32) + T.cloud(300, 44, .9) + T.cloud(196, 14, .6) + cf + st;
      },
      far: function(o){
        var s = '<g opacity="' + (o.night ? ".9" : ".95") + '">';
        ROW.forEach(function(q, i){ s += rowHouse(q, i, o); });
        s += "</g>";
        /* party lights strung from the street's houses over to Timmy's */
        return s + lightString(30, 54, 200, 50, 30, 15, o.night) + lightString(200, 50, 370, 54, 30, 15, o.night);
      },
      flat: function(o, on){
        if (o.snow) return "";
        var ln = o.night ? "#4A4266" : "#A99CBF", cols = [PUR[0], GLD[0], GRN[0], "#F58FB0", PUR[1], GLD[0], GRN[1]];
        return T.scatter(151, 44, on, function(sx, sy){ return L("M" + m(sx - 5, sy) + " q2.6 -2.6 5.2 0 q2.6 -2.6 5.2 0 M" + m(sx - 2.4, sy + 3) + " q2.6 -2.6 5.2 0", 1, ln, .7); }).join("") +
          T.scatter(152, 90, on, function(sx, sy, i){ return i % 3 ? F("M" + m(sx, sy) + " l2.8 1 -1 2.4 -2.8 -1 z", cols[i % 7]) : circ(sx, sy, 1.4, cols[i % 7]); }).join("") +
          T.scatter(153, 9, on, function(sx, sy, i){ return L("M" + m(sx - 7, sy) + " q2 -3.4 4 0 q2 3.4 4 0 q2 -3.4 4 0 q1 1.6 2 1", 1.6, MG[i % 3]); }).join("");
      },
      props: function(o, on){
        return T.scatter(154, 9, on, function(sx, sy, i, R, x, y){
          var s, j;
          if (i % 3 === 0){
            /* a bunch of balloons on a weight */
            s = ell(sx, sy, 6, 2, "#1B2A3A", 0, .12) + L("M" + m(sx, sy - 3) + " L" + m(sx - 6.4, sy - 20) + " M" + m(sx, sy - 3) + " L" + m(sx + .8, sy - 26) + " M" + m(sx, sy - 3) + " L" + m(sx + 7.2, sy - 19), .8, INK, .8) +
              FO("M" + m(sx - 2.8, sy) + " h5.6 l-1 -3.8 h-3.6 z", "#8E98A3", 1) + G("tp-float", balloon(sx - 6.6, sy - 26, MG[0]) + balloon(sx + 7.4, sy - 25, MG[2]) + balloon(sx + .8, sy - 32.5, MG[1]));
          } else if (i % 3 === 1){
            /* a parade barricade */
            s = L("M" + m(sx - 8, sy - 7.4) + " l-2 7.4 M" + m(sx - 8, sy - 7.4) + " l2 7.4 M" + m(sx + 8, sy - 7.4) + " l-2 7.4 M" + m(sx + 8, sy - 7.4) + " l2 7.4", 1.5) + FO("M" + m(sx - 11, sy - 13) + " h22 v5.4 h-22 z", "#FFFDF6", 1.2);
            for (j = 0; j < 4; j++) s += F("M" + m(sx - 8.6 + j * 5.4, sy - 12.4) + " h2.8 l-2 4.2 h-2.8 z", j % 2 ? GLD[0] : PUR[0]);
          } else {
            /* a planter of fern */
            s = ell(sx, sy, 6, 2, "#1B2A3A", 0, .12);
            [[-9, -6], [-6, -11], [-2, -13.4], [2, -13.4], [6, -11], [9, -6]].forEach(function(q, n){ s += L("M" + m(sx, sy - 7) + " q" + m(q[0] * .3, q[1]) + " " + m(q[0], q[1]), 2.2, (o.night ? ["#57A06A", "#3A7A4E"] : ["#6CC774", "#3F9A54"])[n % 2]); });
            s += FO("M" + m(sx - 4.6, sy - 7.4) + " h9.2 l-1.3 7.4 h-6.6 z", PUR[0], 1.2) + L("M" + m(sx - 4, sy - 5) + " h8", 1.2, GLD[0]);
          }
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var yard = {
    "bead-tree": {
      note: "A little tree with a parade's worth of beads caught in its branches", spot: [3.3, 3.4],
      egg: { n: "The bead tree", does: "a strand of beads jumps off a branch", say: "Caught one! Beads are for wearing, never for chewing." }, anim: "tp-jump 1.8s",
      draw: function(o){
        var g0 = P(1.7, 1.8, 0), x = g0[0], y = g0[1], lf = o.snow ? ["#F7FBFF", "#DCEAF6"] : o.night ? ["#4A8A62", "#356E4C"] : ["#74C883", "#4AA062"], s = "";
        s += ell(x + 2, y + 1, 22, 7.5, "#1B2A3A", 0, .1);
        s += FO("M" + m(x - 3.6, y) + " q1.8 -8 .8 -16 l-6 -6.4 2.6 -2 4.6 4.6 l.4 -7 h3.2 l.4 6.6 5 -5.2 2.6 2 -6 7 q-1 8.4 1 16.4 q-4 1.8 -8.6 0 z", K.wood, 1.5) + L("M" + m(x - .4, y - 4) + " q.8 -5 .2 -10", 1, K.woodShade);
        s += T.canopy(x, y - 31, 16, lf, 23);
        /* strands over the canopy, loops hanging under it, one that fell */
        s += strand(x - 13.6, y - 36, x + 12.6, y - 39, 9, 11, PUR[0], 1.8) + strand(x - 12, y - 27, x + 14.6, y - 31, 11, 11, GLD[0], 1.8) + strand(x - 6, y - 43, x + 9, y - 44, 5, 6, "#FFFFFF", 1.6);
        s += strand(x - 13, y - 21, x - 5, y - 17.4, 15, 7, GLD[0], 1.6) + strand(x + 4, y - 17, x + 12.6, y - 21, 17, 8, PUR[0], 1.6) + strand(x - 4, y - 16.4, x + 3, y - 16.4, 9, 5, GRN[0], 1.5);
        s += strand(x + 8, y + 2.4, x + 18, y + .6, 4, 6, GRN[0], 1.5);
        if (o.snow) s += ell(x - 2, y - 44.6, 8, 2.6, "#FFFFFF", 0);
        return s;
      },
      bits: function(){ var g0 = P(1.7, 1.8, 0), x = g0[0], y = g0[1]; return strand(x + 12, y - 44, x + 24, y - 40, -10, 8, MG, 1.8) + T.dmStar(x + 25, y - 50, 3.4, "#FFFFFF", "") + T.dmStar(x + 9, y - 54, 2.6, GLD[0], ""); }
    },
    "jazz-stand": {
      note: "A little bandstand under a swag of bunting: a trumpet, a drum and a music stand", spot: [3.4, 3.45],
      egg: { n: "The jazz stand", does: "a few notes float up", say: "Brass players look after their front teeth. So should you." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.0, 0).concat([32, 11, "#1B2A3A", 0, .1])), c0 = P(1.8, 1.8, .17), i, a;
        /* the round stage: purple skirt, gold studs, a board floor */
        s += cyl(1.8, 1.8, 0, 1.64, .36, 1.64, PUR[0], PUR[1], o.snow ? "#FFFFFF" : K.woodLight);
        for (i = 0; i < 9; i++){ a = (16 + i * 18.5) * Math.PI / 180; s += circ(c0[0] + Math.cos(a) * T.RX(1.64), c0[1] + Math.sin(a) * T.RY(1.64) + .6, 1.3, GLD[0], .6); }
        var top = P(1.8, 1.8, .36); s += L("M" + m(top[0] - 15, top[1] - 4) + " l22 12.6 M" + m(top[0] - 9, top[1] - 8) + " l24 13.8 M" + m(top[0] - 19, top[1] + .6) + " l17 9.8", .7, K.woodShade, .7);
        /* two posts at the back, a lamp on each, bunting between them */
        var pa = P(.4, 2.25, .36), pb = P(2.25, .4, .36), hgt = 35, w = (pb[0] - pa[0]) / 5;
        [pa, pb].forEach(function(q){ s += L("M" + m(q[0], q[1]) + " v" + (-hgt), 3.4) + L("M" + m(q[0], q[1]) + " v" + (-hgt), 1.7, GLD[0]) + circ(q[0], q[1] - hgt - 2, 3, o.night ? K.lit : "#FFF3C4", 1.1); });
        s += L("M" + m(pa[0], pa[1] - hgt + 3) + " L" + m(pb[0], pb[1] - hgt + 3), 1.2);
        for (i = 0; i < 5; i++) s += FO("M" + m(pa[0] + i * w, pa[1] - hgt + 3) + " q" + m(w / 2, 11) + " " + m(w, 0) + " z", MG[i % 3], 1);
        /* the drum, a tooth on its head, and its mallet */
        var d = P(1.0, 2.2, .36), dx = d[0], dy = d[1] - 8.4;
        s += ell(dx + 3.4, dy - 1.6, 8, 8.4, PUR[1], 1.3) + circ(dx, dy, 8.4, GLD[0], 1.3) + circ(dx, dy, 6.4, "#FFFDF6", 1) + T.tinyTooth(dx, dy + .4, .7, "#FFFFFF");
        s += L("M" + m(dx + 6, dy + 7.6) + " l5.4 -11", 2.6) + L("M" + m(dx + 6, dy + 7.6) + " l5.4 -11", 1.2, K.woodLight) + circ(dx + 11.6, dy - 4, 2.2, "#F58FB0", .9);
        /* the music stand */
        var ms = P(2.6, 1.35, .36), mx = ms[0], my = ms[1];
        s += L("M" + m(mx, my - 3) + " l-4 3.2 M" + m(mx, my - 3) + " l4 3.2 M" + m(mx, my) + " v-16", 1.4) + FO("M" + m(mx - 6.4, my - 13) + " l12 -2.6 l.8 -8.6 l-12 2.6 z", "#FFFDF6", 1.1) +
          L("M" + m(mx - 4.4, my - 16) + " l8.4 -1.8 M" + m(mx - 4.2, my - 18.4) + " l8.4 -1.8 M" + m(mx - 4, my - 20.8) + " l8.4 -1.8", .6, INK, .6) + circ(mx - 2, my - 17.4, .9, INK) + circ(mx + 1.6, my - 20.6, .9, INK);
        /* the trumpet on its stool, out front */
        s += cyl(2.3, 2.45, .36, .34, 1.0, .34, GRN[0], GRN[1], "#8BDDA8", { sw: 1.4, si: 1 });
        var t = P(2.3, 2.45, 1.0); s += trumpet(t[0] - 1, t[1] - 4.4);
        return s;
      },
      lights: function(){ var pa = P(.4, 2.25, .36), pb = P(2.25, .4, .36); return T.glowAt(pa[0], pa[1] - 37, 9) + T.glowAt(pb[0], pb[1] - 37, 9); },
      bits: function(){ var t = P(2.3, 2.45, 1.0); return note(t[0] + 14, t[1] - 18) + note(t[0] + 4, t[1] - 28, true) + note(t[0] + 20, t[1] - 32); }
    },
    "parade-float": {
      note: "A float in full dress: a purple skirt with gold fringe, strings of bulbs, a plume fan and a giant crown on top", spot: [3.4, 3.45],
      egg: { n: "The parade float", does: "it throws beads and confetti", say: "Hands up for beads! Catch them with your hands, not your teeth." }, anim: "tp-sparks 2.2s ease-out",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.1, 0).concat([34, 12, "#1B2A3A", 0, .12])), X0 = .25, X1 = 3.35, Y0 = .95, Y1 = 2.75, i, q, A, B;
        /* wheels under the skirt */
        var wheel = function(uc){ var ring = [], hub = []; for (var k = 0; k < 16; k++){ var th = k / 16 * Math.PI * 2; ring.push([uc + Math.cos(th) * .34, Y1 + .02, .34 + Math.sin(th) * .34]); hub.push([uc + Math.cos(th) * .13, Y1 + .02, .34 + Math.sin(th) * .13]); } return FO(D(ring), "#4A4152", 1.3) + FO(D(hub), GLD[0], .8); };
        s += wheel(.85) + wheel(2.75);
        /* the skirt, its gold fringe and bead swags */
        s += box(X0, Y0, .4, X1 - X0, Y1 - Y0, .72, { top: PUR[0], left: PUR[0], right: PUR[1] });
        for (i = 0; i < 8; i++){ A = P(X0 + i * (X1 - X0) / 8, Y1, .4); B = P(X0 + (i + 1) * (X1 - X0) / 8, Y1, .4); s += FO("M" + m(A[0], A[1]) + " Q" + m((A[0] + B[0]) / 2 - .6, (A[1] + B[1]) / 2 + 5) + " " + m(B[0], B[1]) + " Z", GLD[0], .9); }
        for (i = 0; i < 4; i++){ A = P(X1, Y1 - i * (Y1 - Y0) / 4, .4); B = P(X1, Y1 - (i + 1) * (Y1 - Y0) / 4, .4); s += FO("M" + m(A[0], A[1]) + " Q" + m((A[0] + B[0]) / 2 + .6, (A[1] + B[1]) / 2 + 5) + " " + m(B[0], B[1]) + " Z", GLD[1], .9); }
        for (i = 0; i < 4; i++){ A = P(X0 + .1 + i * .75, Y1, 1.02); B = P(X0 + .1 + (i + 1) * .75, Y1, 1.02); s += strand(A[0], A[1], B[0], B[1], 4.6, 5, i % 2 ? "#FFFFFF" : GRN[0], 1.15, .5); }
        q = P(X1, 1.85, .78); s += circ(q[0], q[1], 5, GLD[0], 1.1) + T.tinyTooth(q[0], q[1] + .2, .52, "#FFFFFF");
        /* the green deck with a row of bulbs, and the gold dais */
        s += box(X0 - .1, Y0 - .1, 1.12, X1 - X0 + .2, Y1 - Y0 + .2, .14, { top: o.snow ? "#FFFFFF" : "#7AD79C", left: GRN[0], right: GRN[1] }, { sw: 1.5, si: 1 });
        for (i = 0; i < 8; i++){ q = P(X0 + .1 + i * .42, Y1 + .1, 1.2); s += circ(q[0], q[1] + .6, 1.5, o.night ? K.litHot : ["#FFFFFF", GLD[0], "#F58FB0"][i % 3], .6); }
        s += box(.95, 1.35, 1.26, 1.7, 1.0, .5, { top: "#FBE38E", left: GLD[0], right: GLD[1] }, { sw: 1.5, si: 1 });
        /* pennants at two corners */
        [[P(.45, 1.2, 1.26), GRN[0]], [P(3.1, 2.5, 1.26), PUR[0]]].forEach(function(e){ var x = e[0][0], y = e[0][1]; s += L("M" + m(x, y) + " v-17", 2.6) + L("M" + m(x, y) + " v-17", 1.2, "#FFFDF6") + G("tp-flag", FO("M" + m(x + .6, y - 17) + " l9 3 -9 3.4 z", e[1], 1)) + circ(x, y - 18, 1.5, GLD[0], .7); });
        /* the plume fan and the crown in front of it */
        var c = P(1.8, 1.85, 1.76), cx = c[0], cy = c[1], fan = [PUR[0], GRN[0], GLD[0], GRN[0], PUR[0]];
        for (i = 0; i < 5; i++) s += '<g transform="translate(' + m(cx, cy - 7) + ") rotate(" + (-56 + i * 28) + ')">' + FO("M-3.6 0 q-2.4 -13 3.6 -19.6 q6 6.6 3.6 19.6 z", fan[i], 1.1) + L("M0 -3 v-12", .8, "#FFFDF6", .7) + "</g>";
        s += FO("M" + m(cx - 9, cy - 1) + " l-2 -12 l5 4.6 l3 -7.4 l3 6.2 l3 -6.2 l3 7.4 l5 -4.6 l-2 12 q-9 4.6 -18 0 z", GLD[0], 1.4) + L("M" + m(cx - 9.4, cy - 4) + " q9.4 4.4 18.8 0", 1, GLD[1]) +
          circ(cx - 4.6, cy - 1.4, 1.4, PUR[0], .6) + circ(cx, cy - .2, 1.4, GRN[0], .6) + circ(cx + 4.6, cy - 1.4, 1.4, PUR[0], .6) +
          circ(cx - 11, cy - 13.4, 1.6, PUR[0], .7) + circ(cx - 3, cy - 16.2, 1.6, GRN[0], .7) + circ(cx + 3, cy - 16.2, 1.6, GRN[0], .7) + circ(cx + 11, cy - 13.4, 1.6, PUR[0], .7);
        return s;
      },
      lights: function(){ var s = "", i, q; for (i = 0; i < 8; i += 2){ q = P(.35 + i * .42, 2.85, 1.2); s += T.glowAt(q[0] + 2, q[1], 6); } return s; },
      bits: function(){
        var c = P(1.8, 1.85, 1.76), x = c[0], y = c[1], s = strand(x - 26, y - 22, x - 14, y - 26, 9, 7, PUR[0], 1.7) + strand(x + 14, y - 30, x + 27, y - 24, 9, 7, GLD[0], 1.7) + strand(x - 6, y - 40, x + 6, y - 40, 8, 6, GRN[0], 1.7);
        [[-20, -40, GLD[0]], [20, -42, PUR[0]], [-30, -10, GRN[0]], [30, -12, "#F58FB0"], [0, -52, GLD[0]], [-12, -50, GRN[0]]].forEach(function(q){ s += F("M" + m(x + q[0], y + q[1]) + " l2.8 1 -1 2.8 -2.8 -1 z", q[2]); });
        return s;
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var bead = function(x, y, r, col){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="' + col + '" stroke="' + INK + '" stroke-width="1.5"/>'; };
  var necklace = function(x0, y0, x1, y1, sag, n, col, r){ var s = "", cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + sag; for (var i = 0; i <= n; i++){ var t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; s += bead(a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1, r, col); } return s; };
  var bell = function(x, y, r){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + GLD[0] + '" ' + (r > 4 ? O3 : O2) + '/><path d="M' + f(x - r * .55) + " " + f(y + r * .15) + " h" + f(r * 1.1) + '" stroke="' + INK + '" stroke-width="' + (r > 4 ? 1.8 : 1.2) + '" stroke-linecap="round"/><circle cx="' + x + '" cy="' + f(y + r * .5) + '" r="' + f(r * .16) + '" fill="' + INK + '"/>'; };
  var collar = (function(){
    var pts = [[50, 117], [70, 126], [90, 130.4], [110, 130.4], [130, 126], [150, 117]], tips = [[58, 137], [79, 146], [100, 151], [121, 146], [142, 137]], cols = [PUR[0], GLD[0], GRN[0], GLD[0], PUR[0]], s = "", i;
    for (i = 0; i < 5; i++) s += p("M" + pts[i][0] + " " + pts[i][1] + " L" + pts[i + 1][0] + " " + pts[i + 1][1] + " L" + tips[i][0] + " " + tips[i][1] + " Z", cols[i], O3);
    s += '<path d="M50 117 Q100 143 150 117" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M50 117 Q100 143 150 117" fill="none" stroke="#FFFDF6" stroke-width="3" stroke-linecap="round"/>';
    for (i = 0; i < 5; i++) s += bell(tips[i][0], tips[i][1] + 2, 3.6);
    return s;
  })();
  var ermine = function(list){ return '<path d="' + list.map(function(q){ return "M" + q[0] + " " + q[1] + " l" + (q[2] || 0) + " 5"; }).join(" ") + '" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>'; };
  var outfits = {
    "bead-necklaces": {
      note: "Three strands of parade beads, purple, gold and green, and a tooth medallion",
      face: necklace(49, 109, 151, 109, 34, 17, PUR[0], 3.5) + necklace(47, 113, 153, 113, 52, 19, GLD[0], 3.5) + necklace(46, 118, 154, 118, 66, 21, GRN[0], 3.5) +
        '<circle cx="100" cy="141" r="8.4" fill="' + GLD[0] + '" ' + O3 + "/>" + T.tinyTooth(100, 141.4, 1.05, "#FFFFFF"),
      say: ["Throw me something! I caught every strand.", "Purple, green and gold. I'd floss in all three.", "Beads are for wearing. Never bite one: trust a tooth."]
    },
    "jester": {
      note: "A three-point hat in purple, gold and green with a bell on every tip, and a pointed collar that jingles",
      face: collar,
      top: p("M62 42 Q44 -12 13 32 Q50 24 92 38 Z", PUR[0]) + p("M138 42 Q156 -12 187 32 Q150 24 108 38 Z", GRN[0]) + p("M74 40 Q84 4 100 -20 Q116 4 126 40 Z", GLD[0]) +
        '<path d="M56 22 Q40 14 26 24 M144 22 Q160 14 174 24 M100 -4 V24" fill="none" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>' +
        p("M61 30 Q100 20 139 30 L141 45 Q100 56 59 45 Z", PUR[1]) + [70, 85, 100, 115, 130].map(function(x, i){ var y = 38 + (i === 2 ? 3.4 : i === 1 || i === 3 ? 2.4 : 0); return '<path d="M' + x + " " + (y - 5) + " l4 5 -4 5 -4 -5 z" + '" fill="' + GLD[0] + '" stroke="' + INK + '" stroke-width="1.4"/>'; }).join("") +
        bell(13, 35, 6) + bell(187, 35, 6) + bell(100, -23, 6),
      say: ["Why did the jester see the dentist? To fix his crown!", "Jingle, jingle. That's me nodding along to your notes.", "No fooling: you've got this."]
    },
    "carnival-king": {
      note: "A gold crown with jewels, a purple cape trimmed in white fur and a scepter topped with a tooth",
      back: p("M100 28 C62 26 32 42 24 76 C13 112 13 146 20 178 L180 178 C187 146 187 112 176 76 C168 42 138 26 100 28 Z", "#FFFDF6") +
        p("M100 38 C68 36 43 50 35 80 C26 112 25 146 31 178 L169 178 C175 146 174 112 165 80 C157 50 132 36 100 38 Z", PUR[0], O3) +
        ermine([[28, 84, -1], [21, 108, 0], [19, 134, 0], [22, 158, 1], [42, 50, -3], [62, 34, -4], [172, 84, 1], [179, 108, 0], [181, 134, 0], [178, 158, -1], [158, 50, 3], [138, 34, 4]]),
      face: p("M48 112 Q100 140 152 112 L154 126 Q100 156 46 126 Z", "#FFFDF6", O3) + ermine([[62, 124, 1], [80, 132, 1], [120, 132, -1], [138, 124, -1]]) +
        '<circle cx="100" cy="140" r="8" fill="' + GLD[0] + '" ' + O3 + '/><path d="M100 134.6 l4.6 5.4 -4.6 5.4 -4.6 -5.4 z" fill="' + PUR[0] + '" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<path d="M166 126 L183 58" stroke="' + INK + '" stroke-width="7.4" stroke-linecap="round"/><path d="M166 126 L183 58" stroke="' + GLD[0] + '" stroke-width="3.6" stroke-linecap="round"/>' +
        '<circle cx="165.6" cy="127.6" r="3.8" fill="' + GRN[0] + '" ' + O2 + '/><circle cx="183.6" cy="56" r="6" fill="' + GLD[0] + '" ' + O3 + "/>" + T.tinyTooth(186, 39, 1.9, "#FFFFFF"),
      top: p("M60 44 L52 6 L74 23 L86 -5 L100 21 L114 -5 L126 23 L148 6 L140 44 Q100 55 60 44 Z", GLD[0]) + p("M58.6 33 Q100 44 141.4 33 L140 44 Q100 55 60 44 Z", GLD[1], O2) +
        '<path d="M66 24 Q70 18 72 26" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>' +
        '<circle cx="77" cy="42.6" r="4" fill="' + PUR[0] + '" ' + O2 + '/><circle cx="123" cy="42.6" r="4" fill="' + PUR[0] + '" ' + O2 + '/><path d="M100 40.4 l5 5.6 -5 5.6 -5 -5.6 z" fill="' + GRN[0] + '" ' + O2 + "/>" +
        '<circle cx="52" cy="5" r="5" fill="' + PUR[0] + '" ' + O3 + '/><circle cx="86" cy="-6" r="5" fill="' + GRN[0] + '" ' + O3 + '/><circle cx="114" cy="-6" r="5" fill="' + GRN[0] + '" ' + O3 + '/><circle cx="148" cy="5" r="5" fill="' + PUR[0] + '" ' + O3 + "/>",
      say: ["All hail King Timmy! First decree: brush twice a day.", "A crown on a crown. I'm twice as royal.", "King for a day, ready for the exam tomorrow."]
    }
  };

  return { k: "mardigras", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
