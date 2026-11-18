/* The Dino valley collection of Timmy's place (tools/figures/site/sets.mjs COLLECTIONS lists its eight pieces; the
   shop's catalog has the same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS)
   and pastes its source into the files that draw it, so it may use nothing from outside itself but T. Structure:
   packs/thanksgiving.mjs.

   - home:    stone-den, a round den of big boulders under a roof of giant fern fronds; a round door under an arch of two
              curved tusks, a tooth carved in the keystone, an ammonite set in the wall, a little stone chimney.
   - scene:   volcano-valley, giant ferns and cycads on the valley floor, a gentle volcano puffing far off on the right,
              a long-neck browsing a tree fern, a pterosaur gliding by; at night the crater glows and fireflies come out.
   - yard:    dino-nest (Uncommon), fossil-dig (Rare), trex-skeleton (Epic).
   - outfits: field-hat (Common), fossil-vest (Uncommon), stego-hood (Rare).
   Friendly fossils only: nothing scary. No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3, O4 = T.O4;
  var BONE = ["#F4EBD3", "#DCCBA3", "#B9A47A"], FERN = ["#86C060", "#6AA84C", "#4F8F3E", "#3B7333"], NFERN = ["#5C9466", "#4C8358", "#3E714B", "#2F5C3C"];
  var SNOWF = ["#F4F8FB", "#DCE8F2", "#C9D9E6", "#A9BDD0"];
  function hex(c){ return [1, 3, 5].map(function(i){ return parseInt(c.substr(i, 2), 16); }); }
  function mix(a, b, t){ var x = hex(a), y = hex(b); return "#" + x.map(function(v, i){ return ("0" + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2); }).join(""); }
  function pts(list){ return "M" + list.map(function(q){ return f(q[0]) + " " + f(q[1]); }).join(" L") + " Z"; }
  /* outline-then-fill: every shape stroked in ink first, then filled on top, so a figure of overlapping parts has one
     outline round the outside (shapes: [d, fill] for areas, [d, color, width] for strokes) */
  function sil(shapes, ink, sw){
    var a = "", b = "";
    shapes.forEach(function(q){
      if (q[2]){ a += L(q[0], q[2] + sw * 2, ink); b += L(q[0], q[2], q[1]); }
      else { a += '<path d="' + q[0] + '" fill="' + ink + '" stroke="' + ink + '" stroke-width="' + f(sw * 2) + '"/>'; b += F(q[0], q[1]); }
    });
    return a + b;
  }
  /* a fern frond in screen space: its midrib starts at (x, y) heading a degrees (0 right, -90 up) and bends by bend
     degrees along len; the leaflets make a saw-toothed edge, widest near the base, pointing toward the tip */
  function frondD(x, y, len, a, bend, w, n){
    n = n || 7;
    var th = a * Math.PI / 180, db = bend * Math.PI / 180 / n, st = len / n, px = x, py = y, lt = [], rt = [], rib = "M" + f(x) + " " + f(y);
    for (var i = 0; i < n; i++){
      var ux = -Math.sin(th), uy = Math.cos(th), ww = w * (1 - Math.pow((i + .5) / (n + .3), 1.5)), fx = px + Math.cos(th) * st * .9, fy = py + Math.sin(th) * st * .9;
      lt.push([px + ux * ww * .5, py + uy * ww * .5], [fx + ux * ww, fy + uy * ww]);
      rt.push([px - ux * ww * .5, py - uy * ww * .5], [fx - ux * ww, fy - uy * ww]);
      px += Math.cos(th) * st; py += Math.sin(th) * st; th += db;
      rib += " L" + f(px) + " " + f(py);
    }
    return { d: pts([[x, y]].concat(lt, [[px, py]], rt.reverse())), rib: rib };
  }
  function frond(x, y, len, a, bend, w, c, sw, n){ var r = frondD(x, y, len, a, bend, w, n); return FO(r.d, c[0], sw || .9) + L(r.rib, (sw || .9) * .8, c[1]); }
  /* a clump of giant fern: fronds arching out of one root, the far ones in shade */
  function giantFern(x, y, k, c){
    var s = "";
    [[-150, -50, 1], [-32, 50, 1], [-122, -60, 0], [-58, 60, 0], [-100, -42, 0], [-80, 40, 0]].forEach(function(q){
      s += frond(x, y, 24 * k * (q[2] ? .9 : 1), q[0], q[1], 5.4 * k, q[2] ? [c[1], c[3]] : [c[0], c[2]], .9, 6);
    });
    return s;
  }
  /* a cycad: a stout scaly trunk and a crown of stiff fronds */
  function cycad(x, y, k, c, wood){
    var tw = 4.2 * k, th = 11 * k, s = FO("M" + f(x - tw) + " " + f(y) + " Q" + f(x - tw - 1) + " " + f(y - th * .6) + " " + f(x - tw * .7) + " " + f(y - th) + " L" + f(x + tw * .7) + " " + f(y - th) + " Q" + f(x + tw + 1) + " " + f(y - th * .6) + " " + f(x + tw) + " " + f(y) + " Z", wood[0], 1.2);
    s += F("M" + f(x + tw * .2) + " " + f(y) + " L" + f(x + tw * .3) + " " + f(y - th) + " L" + f(x + tw * .7) + " " + f(y - th) + " Q" + f(x + tw + 1) + " " + f(y - th * .6) + " " + f(x + tw) + " " + f(y) + " Z", wood[1], .8);
    var d = ""; for (var i = 1; i < 4; i++) d += "M" + f(x - tw) + " " + f(y - th * i / 4) + " l" + f(tw) + " " + f(-th * .16) + " l" + f(tw) + " " + f(th * .16) + " ";
    s += L(d, .7, INK, .55);
    [[-172, -10], [-145, -24], [-118, -18], [-62, 18], [-35, 24], [-8, 10], [-92, -6]].forEach(function(q, i){ s += frond(x, y - th, 15 * k, q[0], q[1], 3.2 * k, i < 3 ? [c[0], c[2]] : i < 6 ? [c[1], c[3]] : [c[0], c[2]], .85, 5); });
    return s;
  }
  /* a tree fern: a thin trunk and a crown of drooping fronds (the far backdrop's, and the long-neck's lunch) */
  function treeFern(x, y, h, k, c, trunk, sw){
    var t = [x + 2 * k, y - h], s = L("M" + f(x) + " " + f(y) + " Q" + f(x - 2 * k) + " " + f(y - h * .5) + " " + f(t[0]) + " " + f(t[1]), 3.6 * k + (sw || 1)) + L("M" + f(x) + " " + f(y) + " Q" + f(x - 2 * k) + " " + f(y - h * .5) + " " + f(t[0]) + " " + f(t[1]), 3.6 * k, trunk);
    [[-160, -60, 1], [-20, 60, 1], [-130, -80, 0], [-50, 80, 0], [-100, -50, 0], [-76, 50, 0]].forEach(function(q){ s += frond(t[0], t[1], 16 * k, q[0], q[1], 3.2 * k, q[2] ? [c[1], c[2]] : [c[0], c[2]], sw || 1, 6); });
    return s;
  }
  /* a little ammonite: a coiled shell with its ribs */
  function ammonite(x, y, r, c){
    var s = circ(x, y, r, c[0], 1.1), d = "", i;
    for (i = 0; i <= 40; i++){ var a = i / 40 * Math.PI * 4.2, rr = r * .86 * (1 - i / 46); d += (i ? " L" : "M") + f(x + Math.cos(a) * rr) + " " + f(y + Math.sin(a) * rr * .96); }
    s += L(d, .9, c[2]);
    var rb = ""; for (i = 0; i < 14; i++){ var b = i / 14 * Math.PI * 2; rb += "M" + f(x + Math.cos(b) * r * .62) + " " + f(y + Math.sin(b) * r * .6) + " L" + f(x + Math.cos(b + .12) * r * .96) + " " + f(y + Math.sin(b + .12) * r * .94) + " "; }
    return s + L(rb, .7, c[1]) + circ(x - r * .3, y - r * .35, r * .16, "#FFFFFF", 0).replace("/>", ' opacity=".6"/>');
  }
  /* a three-toed footprint pressed in the ground */
  function print(x, y, k, c){ return F("M" + f(x) + " " + f(y) + " q" + f(-2.4 * k) + " " + f(-.6 * k) + " " + f(-1.6 * k) + " " + f(-2.4 * k) + " l" + f(-2.6 * k) + " " + f(-2.4 * k) + " l" + f(3.6 * k) + " " + f(1 * k) + " l" + f(.4 * k) + " " + f(-3.2 * k) + " l" + f(1.4 * k) + " " + f(3.2 * k) + " l" + f(3.4 * k) + " " + f(-1.4 * k) + " l" + f(-1.6 * k) + " " + f(3.2 * k) + " q" + f(.2 * k) + " " + f(2.2 * k) + " " + f(-3 * k) + " " + f(2 * k) + " z", c, .8); }

  /* ------------------------------------------------------------------ the home: a stone den ---------------------------- */
  var homes = {
    "stone-den": {
      note: "A round den of big boulders under a roof of giant fern fronds: a door under an arch of two tusks, an ammonite in the wall and a tooth carved over the door",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the roof's tip", paint: "Stone color" },
      door: [5.5, 7.8], brush: [9.0, 7.2], statue: [2.7, 9.4], spots: { door: [6.15, 9.95] }, h: 8.4,
      eaves: [[3.59, 7.41, 4.15], [7.41, 3.59, 4.15], 19], round: [5.5, 5.5, 2.45], base: T.arcPts(5.5, 5.5, 2.42, -40, 135, 14), block: [2.4, 2.6, 8.6, 8.9],
      draw: function(o){
        var u = o.up, pt = o.paint && o.paint !== "cream" && T.PAINTS[o.paint] ? T.PAINTS[o.paint] : null, s = "", lights = "", i;
        var st = pt ? { c: mix(pt.c, "#CFC4B2", .3), s: mix(pt.s, "#9C8C78", .35) } : { c: "#DCD1BF", s: "#AE9E88" };
        var c0 = P(5.5, 5.5, 0), cx = c0[0], gy = c0[1], R = T.rng(31);
        var on = function(a, r, z){ var t = a * Math.PI / 180; return P(5.5 + Math.cos(t) * r, 5.5 + Math.sin(t) * r, z); };
        var wallR = function(z){ return 2.42 - .07 * z; };
        /* the wall behind the boulders: the dark between them */
        var ax0 = T.RX(2.42), ay0 = T.RY(2.42), ax1 = T.RX(2.1), zt = 4.3 * 10.5;
        s += FO("M" + f(cx - ax0) + " " + f(gy) + " C" + f(cx - ax0 - 2) + " " + f(gy - 14) + " " + f(cx - ax1 - 2) + " " + f(gy - zt + 8) + " " + f(cx - ax1) + " " + f(gy - zt) + " L" + f(cx + ax1) + " " + f(gy - zt) +
          " C" + f(cx + ax1 + 2) + " " + f(gy - zt + 8) + " " + f(cx + ax0 + 2) + " " + f(gy - 14) + " " + f(cx + ax0) + " " + f(gy) + " A" + f(ax0) + " " + f(ay0) + " 0 0 1 " + f(cx - ax0) + " " + f(gy) + " Z", mix(st.s, "#5E5248", .45), 2);
        /* big rounded boulders, three rows, the biggest at the bottom; lit on the left, in shade on the right */
        [[.66, 1.34, 7, .5], [1.94, 1.2, 8, 0], [3.1, 1.08, 9, .5], [4.05, .9, 10, 0]].forEach(function(rw, ri){
          var n = rw[2], da = 196 / n, row = [];
          for (var k = 0; k < n; k++){
            var a = -55 + da * (k + rw[3]) + (R() - .5) * 5, r = wallR(rw[0]) + .08, q = on(a, r, rw[0]), q0 = on(a - da / 2, r, rw[0]), q1 = on(a + da / 2, r, rw[0]);
            var hw = Math.max(3, Math.sqrt((q1[0] - q0[0]) * (q1[0] - q0[0]) + (q1[1] - q0[1]) * (q1[1] - q0[1])) * .6), hh = rw[1] * 10.5 * .5, lf = Math.max(-1, Math.min(1, (a - 45) / 90));
            var col = lf >= 0 ? mix(st.c, "#FFFFFF", lf * .14) : mix(st.c, st.s, -lf * .85);
            col = mix(col, ["#CDB898", "#BFC4C4", "#D9C9AC", "#C4B6A6"][(k + ri) % 4], .14 + R() * .1);
            row.push({ near: Math.cos((a - 45) * Math.PI / 180), x: q[0], y: q[1], hw: hw * (.92 + R() * .16), hh: hh * (.9 + R() * .16), c: col, lf: lf, seed: 40 + ri * 13 + k });
          }
          row.sort(function(x, y){ return x.near - y.near; }).forEach(function(b){
            var d = T.lumps(b.x, b.y, b.hw, b.seed, 8, b.hh / b.hw);
            s += F(d, b.c) + F(T.lumps(b.x + b.hw * .24, b.y + b.hh * .26, b.hw * .72, b.seed + 5, 7, b.hh / b.hw), mix(b.c, "#6E6052", .26), .8) + O(d, 1.5);
            if (b.lf > -.4) s += T.HI("M" + f(b.x - b.hw * .6) + " " + f(b.y - b.hh * .05) + " Q" + f(b.x - b.hw * .5) + " " + f(b.y - b.hh * .62) + " " + f(b.x - b.hw * .08) + " " + f(b.y - b.hh * .72), 1.4);
          });
        });
        /* the ammonite, set in a smooth round stone front and center */
        var am = on(42, wallR(1.45) + .12, 1.45);
        s += FO(T.lumps(am[0], am[1], 8.4, 5, 9, .9), mix(st.c, "#FFFFFF", .22), 1.6) + F(T.lumps(am[0] + 2, am[1] + 2, 6, 8, 7, .85), mix(st.c, st.s, .5), .45) + ammonite(am[0] - .4, am[1] - .2, 5.8, ["#E2B477", "#B98245", "#8A5A2E"]);
        /* a round window on the shaded side, a wooden ring round it */
        var wq = on(-14, wallR(2.1) + .1, 2.05), wg = ell(wq[0], wq[1], 2.8, 4.4, o.night ? K.lit : K.glass, 1) + L("M" + f(wq[0]) + " " + f(wq[1] - 4.4) + " v8.8 M" + f(wq[0] - 2.8) + " " + f(wq[1]) + " h5.6", .9);
        s += ell(wq[0], wq[1], 4.6, 6.2, K.wood, 1.5) + wg;
        if (o.night) lights += T.glowAt(wq[0], wq[1], 10) + wg;
        /* the roof: a low dome thatched with giant fern fronds, three rows of frond tips, the lowest over the wall */
        var R0 = 2.7, z0 = 4.15, H = 2.05, bq = P(5.5, 5.5, z0), bx = bq[0], by = bq[1], rax = T.RX(R0), ray = T.RY(R0), hy = H * 10.5 + ray * .2;
        var fc = o.snow ? SNOWF : o.night ? NFERN : FERN;
        var lv = function(a, ph, dn){ var t = a * Math.PI / 180, r = R0 * Math.cos(ph), q = P(5.5 + Math.cos(t) * r, 5.5 + Math.sin(t) * r, z0 + H * Math.sin(ph)); return [q[0], q[1] - ray * .2 * Math.sin(ph) + (dn || 0)]; };
        var tiers = [[0, 9, 6.4], [.55, 7, 5.6], [1.02, 5, 4.8]].map(function(tr){
          var ph = tr[0], n = tr[1], drop = tr[2], segs = [], tips = [];
          for (var k = 0; k < n; k++){
            var a0 = 135 - k * 180 / n, am2 = 135 - (k + .5) * 180 / n, a1 = 135 - (k + 1) * 180 / n, tp = lv(am2, ph, drop);
            segs.push({ a: a0, p0: lv(a0, ph), c: lv((a0 + am2) / 2 + 3, ph, drop * .7), p1: tp }, { a: am2, p0: tp, c: lv((am2 + a1) / 2 - 3, ph, drop * .7), p1: lv(a1, ph) });
            tips.push({ a: am2, p: tp });
          }
          var path = "M" + f(segs[0].p0[0]) + " " + f(segs[0].p0[1]) + segs.map(function(g){ return " Q" + f(g.c[0]) + " " + f(g.c[1]) + " " + f(g.p1[0]) + " " + f(g.p1[1]); }).join("");
          var L0 = lv(135, ph);
          return { ph: ph, segs: segs, tips: tips, edge: path, cap: path + " A" + f(rax) + " " + f(hy) + " 0 0 0 " + f(L0[0]) + " " + f(L0[1]) + " Z" };
        });
        /* the eave's shadow on the wall */
        s += F(tiers[0].edge + " L" + f(bx + rax) + " " + f(by + 9) + " Q" + f(bx) + " " + f(by + ray + 16) + " " + f(bx - rax) + " " + f(by + 9) + " Z", INK, .16);
        tiers.forEach(function(t, k){ s += F(t.cap, k ? fc[0] : fc[1]); });
        /* the side away from the light, in shade: from the top round to the lowest row's tips on the right */
        var t0 = tiers[0], cut = t0.segs.filter(function(g){ return g.a <= 15.1; }), top = [bx + rax * .14, by - hy];
        var shd = "M" + f(top[0]) + " " + f(top[1]) + " A" + f(rax) + " " + f(hy) + " 0 0 1 " + f(bx + rax) + " " + f(by) +
          cut.slice().reverse().map(function(g){ return " Q" + f(g.c[0]) + " " + f(g.c[1]) + " " + f(g.p0[0]) + " " + f(g.p0[1]); }).join("") + " Q" + f(bx + rax * .42) + " " + f(by - hy * .5) + " " + f(top[0]) + " " + f(top[1]) + " Z";
        s += F(shd, fc[2], .78);
        /* each frond tip's midrib and leaflets, then the rows' edges */
        tiers.forEach(function(t, k){
          var up = k < 2 ? tiers[k + 1].ph : 1.45;
          t.tips.forEach(function(tp){
            var b = lv(tp.a, Math.min(1.5, t.ph + (up - t.ph) * .95), 0), mx = tp.p[0], my = tp.p[1], vx = b[0] - mx, vy = b[1] - my, ln = Math.sqrt(vx * vx + vy * vy) || 1, d = "M" + f(mx) + " " + f(my) + " L" + f(b[0]) + " " + f(b[1]);
            for (var j = 1; j < 4; j++){ var px = mx + vx * j / 4, py = my + vy * j / 4, sx = -vy / ln * 3.4, sy = vx / ln * 3.4; d += " M" + f(px + sx) + " " + f(py + sy + 1.6) + " L" + f(px) + " " + f(py) + " L" + f(px - sx) + " " + f(py - sy + 1.6); }
            s += L(d, .9, fc[3], .85);
          });
          if (k) s += L(t.edge, 1.5);
        });
        s += O(tiers[0].cap, 2);
        if (o.snow) s += T.snowDome(5.5, 5.5, z0, R0, H, .45);
        /* the chimney: a short stack of round stones on the right slope, smoking */
        var ch = P(6.7, 5.35, 5.95), cx2 = ch[0], cy2 = ch[1] - 2, cw = 5.4;
        s += FO("M" + f(cx2 - cw) + " " + f(cy2 + 3) + " L" + f(cx2 - cw + .6) + " " + f(cy2 - 13) + " A" + f(cw - .6) + " 2.4 0 0 1 " + f(cx2 + cw - .6) + " " + f(cy2 - 13) + " L" + f(cx2 + cw) + " " + f(cy2 + 3) + " A" + f(cw) + " 2.6 0 0 1 " + f(cx2 - cw) + " " + f(cy2 + 3) + " Z", st.c, 1.6);
        s += F("M" + f(cx2 + 1.4) + " " + f(cy2 + 5.4) + " L" + f(cx2 + 1.4) + " " + f(cy2 - 10.6) + " L" + f(cx2 + cw - .6) + " " + f(cy2 - 13) + " L" + f(cx2 + cw) + " " + f(cy2 + 3) + " A" + f(cw) + " 2.6 0 0 1 " + f(cx2 + 1.4) + " " + f(cy2 + 5.4) + " Z", st.s, .8);
        s += L("M" + f(cx2 - cw + .3) + " " + f(cy2 - 4.6) + " Q" + f(cx2) + " " + f(cy2 - 2) + " " + f(cx2 + cw - .3) + " " + f(cy2 - 4.6) + " M" + f(cx2 - cw + .5) + " " + f(cy2 - 9.6) + " Q" + f(cx2) + " " + f(cy2 - 7) + " " + f(cx2 + cw - .5) + " " + f(cy2 - 9.6) + " M" + f(cx2 - 1.6) + " " + f(cy2 - 4) + " q-.6 2.6 .2 5.6 M" + f(cx2 + 2.4) + " " + f(cy2 - 9) + " q-.4 2.4 .2 4.6 M" + f(cx2 - 2.4) + " " + f(cy2 - 13) + " q.6 1.8 0 3.6", 1.1, INK, .7);
        s += ell(cx2, cy2 - 13, cw - .6, 2.4, "#4A3A3A", 1.3) + (o.snow ? ell(cx2 - 1, cy2 - 14.6, cw - 1, 1.6, "#FFFFFF", 0) : "") + T.smoke(cx2 + 1, cy2 - 18);
        s += frond(cx2 - 7, cy2 + 6, 8, -20, 20, 2.2, [fc[0], fc[3]], 1, 4) + frond(cx2 + 7, cy2 + 6, 7, -160, -20, 2.2, [fc[2], fc[3]], 1, 4);
        /* the top: a tuft of young fronds, or the flag */
        var tipP = lv(0, Math.PI / 2);
        if (u.flag) s += T.flagOn(5.5, 5.5, z0 + H - .05, 2.3);
        [[-128, -36], [-52, 36], [-92, -12]].forEach(function(q, k){ s += frond(tipP[0], tipP[1] + 2, k === 2 ? 9 : 10, q[0], q[1], 2.6, [k === 1 ? fc[1] : fc[0], fc[3]], 1, 5); });
        /* the door: round-topped planks on a flat stone step, a little lit porthole in it */
        var dp = P(5.5, 7.92, 0), dx = dp[0], dy = dp[1];
        s += ell(dx + 1, dy + 2.6, 12, 3.9, mix(st.c, st.s, .3), 1.3);
        s += T.roundDoor(dx, dy, 13.6, 20, "#A0683C", "#7A4A28");
        var dw = ell(dx - .4, dy - 13.6, 2.3, 2.5, o.night ? K.lit : K.glass, 1); s += dw; if (o.night) lights += T.glowAt(dx - .4, dy - 13.6, 8) + dw;
        /* the arch: two curved tusks planted on either side, their tips crossing over the door */
        var tusk = function(m){
          var x = function(v){ return f(dx + v * m); };
          var d = "M" + x(-16) + " " + f(dy + 2.4) + " C" + x(-19.4) + " " + f(dy - 12) + " " + x(-12) + " " + f(dy - 27) + " " + x(2.4) + " " + f(dy - 29.4) + " C" + x(-6.4) + " " + f(dy - 23.4) + " " + x(-10.4) + " " + f(dy - 12) + " " + x(-9.4) + " " + f(dy + 2.4) + " Q" + x(-12.6) + " " + f(dy + 4.2) + " " + x(-16) + " " + f(dy + 2.4) + " Z";
          return FO(d, m < 0 ? BONE[1] : BONE[0], 1.7) + L("M" + x(-17) + " " + f(dy - 5) + " q3.4 1.2 6.6 0 M" + x(-16) + " " + f(dy - 14.6) + " q3.2 1.6 6 .2 M" + x(-11.6) + " " + f(dy - 22.4) + " q2.6 1.8 4.6 1", .8, BONE[2]) + (m > 0 ? T.HI("M" + x(-15.4) + " " + f(dy - 8) + " Q" + x(-14.4) + " " + f(dy - 19) + " " + x(-7) + " " + f(dy - 25.4), 1.4) : "");
        };
        s += tusk(-1) + tusk(1);
        s += FO(T.lumps(dx - 13, dy + 3, 4.2, 3, 6, .55), st.s, 1.2) + FO(T.lumps(dx + 13, dy + 3.4, 4.2, 4, 6, .55), st.s, 1.2);
        /* the keystone where they cross, a tooth carved in it */
        var ky = dy - 31;
        s += FO(T.lumps(dx, ky, 7.4, 9, 8, .78), mix(st.c, "#FFFFFF", .18), 1.7) + F(T.lumps(dx + 1.8, ky + 1.6, 5.2, 12, 6, .76), mix(st.c, st.s, .45), .55) + T.tinyTooth(dx, ky + .5, 1, mix(st.c, "#FFFFFF", .6));
        if (o.night) lights += T.firefly(150, 150, .2) + T.firefly(258, 124, 1.3) + T.firefly(236, 170, 2.2);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: volcano valley ------------------------ */
  /* the backdrop is drawn as if the land's edge stood near y 150 at the picture's sides (hillScene lifts it 22) */
  function longNeck(x, y, k, body, ink, sw){
    var q = function(a, b){ return f(x + a * k) + " " + f(y + b * k); };
    return sil([
      ["M" + q(14, -17) + " C" + q(26, -16) + " " + q(36, -11) + " " + q(48, -7), body, 6.4 * k],
      ["M" + q(36, -11) + " L" + q(48, -7), body, 3.4 * k],
      ["M" + q(-9, -18) + " C" + q(-15, -26) + " " + q(-21, -40) + " " + q(-25, -52), body, 6.4 * k],
      ["M" + q(-25, -52) + " L" + q(-27, -56), body, 5 * k],
      ["M" + q(-33.4, -57) + " C" + q(-33, -61) + " " + q(-26, -62.6) + " " + q(-23, -58.6) + " C" + q(-22, -55.4) + " " + q(-27, -54) + " " + q(-33.4, -57) + " Z", body],
      ["M" + q(-8, -12) + " L" + q(-8, 1), body, 4.6 * k], ["M" + q(-2, -12) + " L" + q(-2, 1), body, 4.6 * k], ["M" + q(9, -12) + " L" + q(9, 1), body, 4.8 * k], ["M" + q(15, -12) + " L" + q(15, 1), body, 4.8 * k],
      ["M" + q(-14, -15) + " C" + q(-14, -27) + " " + q(16, -29) + " " + q(20, -16) + " C" + q(20, -9) + " " + q(-14, -7) + " " + q(-14, -15) + " Z", body]
    ], ink, sw);
  }
  function pterosaur(x, y, k, body, ink){
    var q = function(a, b){ return f(x + a * k) + " " + f(y + b * k); };
    return G("tp-float", sil([
      ["M" + q(-2, -1) + " L" + q(-13, -6) + " L" + q(-28, 1) + " Q" + q(-15, -1) + " " + q(-3, 3) + " Z", body],
      ["M" + q(2, -1) + " L" + q(12, -7) + " L" + q(25, -2) + " Q" + q(13, -1) + " " + q(3, 3) + " Z", body],
      ["M" + q(-4, 0) + " Q" + q(0, -3) + " " + q(5, 1) + " Q" + q(0, 3.4) + " " + q(-4, 0) + " Z", body],
      ["M" + q(-3, -1) + " L" + q(-13, -1.4) + " L" + q(-4, .6) + " Z", body],
      ["M" + q(-3.6, -1.4) + " L" + q(3, -6.6) + " L" + q(-1.2, -.6) + " Z", body]
    ], ink, .9));
  }
  var scenes = {
    "volcano-valley": T.hillScene({
      note: "Giant ferns and cycads on the valley floor, a long-neck browsing far off and a gentle volcano puffing on the skyline",
      path: "stones", treeKind: "palm", lamp: "tiki", skirt: "grass", grade: ["#FFD9A0", .05],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#5B9466", "#4F865B", "#43784F", "#356442"] : ["#A9D886", "#98CC76", "#84BD66", "#62A14F"]; },
      sky: function(o){
        if (o.night) return T.bands(["#1C2256", "#242C66", "#2D3874", "#374381", "#43508C", "#4D5A94"], 0, 150) + T.moon(84, 40) + T.starField(23, 26, 96);
        return T.bands(["#B6E0F2", "#C2E6F1", "#CFEBEE", "#DCEFE8", "#E9F1DE", "#F4F0D2"], 0, 150) + T.sun(80, 38) + T.cloud(206, 20, .6) + pterosaur(152, 30, 1.05, "#A88A8E", "#6E5862");
      },
      far: function(o){
        var n = o.night, sn = o.snow, s = "";
        var vc = sn ? ["#F2F6FA", "#D6E2EE", "#B9C9DA"] : n ? ["#4C4468", "#3E3858", "#2E2A46"] : ["#C2A89C", "#A68C84", "#8C7470"];
        var ridge = sn ? ["#EEF5FB", "#DCEAF6"] : n ? ["#3D6A58", "#335C4C"] : ["#A2D08E", "#8CC27C"];
        var haze = sn ? ["#E6EFF7", "#C9D9E6", "#B9CCDD"] : n ? ["#33585A", "#2B4C4E", "#22403F"] : ["#8DBE88", "#76AA74", "#5E9460"];
        /* the volcano: a broad rounded cone, a shallow crater, a soft puff rising and drifting right */
        var cone = "M222 140 C250 128 276 94 287 78 Q291 71 298 70 Q310 67 322 70 Q329 71 333 78 C346 96 374 128 406 138 V172 H222 Z";
        s += FO(cone, vc[0], 1.5) + F("M316 69 Q326 70 333 78 C346 96 374 128 406 138 V172 H334 C340 140 334 100 316 69 Z", vc[1], .85);
        s += L("M295 77 q-7 22 -19 42 M305 75 q-3 26 -9 50 M319 76 q5 26 15 52 M328 78 q10 22 24 40", 1, vc[2], .75);
        s += F("M222 140 Q266 122 314 128 Q362 122 406 134 V172 H222 Z", sn ? "#FFFFFF" : n ? "#3C5E50" : "#A6C88C", .95) + L("M232 136 Q268 122 314 127 Q360 121 400 132", 1, INK, .35);
        s += ell(310, 71, 12, 3.2, n ? "#FFB24D" : "#7E6660", 1.3);
        if (n) s += ell(310, 71.4, 7.6, 1.8, "#FFE08A", 0) + circ(310, 65, 10, "#FF9A3C", 0).replace("/>", ' opacity=".34"/>') + circ(310, 63, 17, "#FF8A3C", 0).replace("/>", ' opacity=".14"/>');
        var puff = sn ? ["#FFFFFF", "#E3ECF4"] : n ? ["#6E5E82", "#D98A5E"] : ["#F4F0EC", "#DDD4CD"];
        var pf = [[312, 61, 5.6, 3], [318, 51, 7.4, 5], [329, 41, 8.6, 7], [343, 35, 7, 9]];
        s += G("tp-cloud", sil(pf.map(function(q){ return [T.lumps(q[0], q[1], q[2], q[3], 8), puff[0]]; }), INK, .6) +
          pf.map(function(q){ return F(T.lumps(q[0] + q[2] * .2, q[1] + q[2] * .28, q[2] * .66, q[3] + 2, 7, .7), puff[1], n ? .8 : .75); }).join(""), ' opacity=".96"');
        /* the far ridge with its tree ferns and cycads, and a long-neck standing behind the hill, head up */
        s += F("M0 124 Q30 106 70 112 Q110 102 150 112 Q196 104 236 112 Q280 104 318 114 Q356 110 400 122 V300 H0 Z", ridge[0]) + L("M0 124 Q30 106 70 112 Q110 102 150 112 Q196 104 236 112 Q280 104 318 114 Q356 110 400 122", 1.3, INK, .45);
        var tf = sn ? ["#F7FBFF", "#DCEAF6", "#B9CCDD"] : haze, trunk = sn ? "#B9A88E" : n ? "#3A3F4A" : "#8E7A5E", cw = sn ? ["#C9B9A0", "#B09E84"] : n ? ["#3E3A44", "#33303A"] : ["#A08A68", "#8A7456"];
        s += '<g opacity="' + (n ? ".95" : ".9") + '">' + treeFern(52, 116, 30, .9, tf, trunk, .9) + treeFern(74, 112, 22, .7, tf, trunk, .9) + cycad(98, 110, .8, tf, cw) + treeFern(148, 112, 26, .8, tf, trunk, .9) + cycad(346, 116, .8, tf, cw) + "</g>";
        s += longNeck(264, 112, .72, sn ? "#E3ECF4" : n ? "#161A36" : "#86A8A0", sn ? "#9FB4C8" : n ? "#0E1126" : "#58776F", .8);
        s += F("M0 162 Q70 144 140 154 Q230 142 300 158 Q360 148 400 156 V300 H0 Z", ridge[1]);
        return s;
      },
      landExtra: function(o){
        if (o.snow) return [[284, 248], [300, 240], [318, 246], [334, 236]].map(function(q, i){ return print(q[0], q[1], 1, "#B9CCDD"); }).join("");
        var c = o.night ? "#335C40" : "#5E9248";
        return [[280, 250], [297, 241], [314, 247], [331, 237], [346, 243]].map(function(q, i){ return print(q[0], q[1], i % 2 ? .95 : 1, c); }).join("");
      },
      flat: function(o, on){
        var fc = o.snow ? SNOWF : o.night ? NFERN : FERN;
        var s = T.scatter(161, 22, on, function(sx, sy, i){ return i % 3 ? T.tuft(sx, sy, o.snow ? "#C9D9E6" : o.night ? "#3E714B" : "#6AA84C", .8) : frond(sx, sy, 6, -120, -30, 1.6, [fc[1], fc[3]], .7, 4) + frond(sx, sy, 6, -60, 30, 1.6, [fc[0], fc[3]], .7, 4); }).join("");
        s += T.scatter(162, 10, on, function(sx, sy, i){ return ell(sx, sy, 2.2, 1.4, o.night ? "#8E98A3" : ["#D6CCBC", "#C4B8A6"][i % 2], .7); }).join("");
        return s;
      },
      props: function(o, on){
        var fc = o.snow ? SNOWF : o.night ? NFERN : FERN, wood = o.snow ? ["#B9A88E", "#9C8C74"] : o.night ? ["#7A6A58", "#5E5044"] : ["#B08A5E", "#8E6A44"];
        return T.scatter(163, 10, on, function(sx, sy, i, Rr, x, y){
          var s;
          if (i % 5 === 4) s = treeFern(sx, sy, 34 + Rr() * 8, 1.05, [fc[0], fc[1], fc[3]], wood[1], 1) + T.tuft(sx, sy + 1, o.night ? "#3E714B" : "#6AA84C", 1.1);
          else if (i % 4 === 0) s = giantFern(sx, sy, 1.05 + Rr() * .3, fc);
          else if (i % 4 === 1) s = cycad(sx, sy, 1.25 + Rr() * .25, fc, wood);
          else if (i % 4 === 2) s = FO(T.lumps(sx, sy - 5, 8, 70 + i, 7, .7), o.night ? "#8E98A3" : "#CFC4B2", 1.4) + F(T.lumps(sx + 2.4, sy - 3.6, 5.4, 74 + i, 6, .7), o.night ? "#6E7882" : "#ADA08C", .8) + (o.snow ? ell(sx - 1, sy - 9, 6, 2, "#FFFFFF", 0) : ammonite(sx - 1.4, sy - 5.6, 2.6, ["#E2B477", "#B98245", "#8A5A2E"])) + frond(sx + 8, sy, 9, -70, 30, 2.2, [fc[1], fc[3]], .9, 5);
          else s = [-3, 0, 3.4].map(function(dx, j){ var h = 12 + j * 3; return L("M" + f(sx + dx) + " " + f(sy) + " v" + f(-h), 2.4) + L("M" + f(sx + dx) + " " + f(sy) + " v" + f(-h), 1.2, o.snow ? "#C9D9E6" : o.night ? "#4C8358" : "#7DB85A") + L("M" + f(sx + dx - 1.4) + " " + f(sy - h * .35) + " h2.8 M" + f(sx + dx - 1.4) + " " + f(sy - h * .65) + " h2.8", 1, o.night ? "#2F5C3C" : "#3B7333"); }).join("") + T.tuft(sx, sy + 1, o.night ? "#3E714B" : "#6AA84C", 1.1);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(o){ return o.night ? T.firefly(86, 196, .3) + T.firefly(312, 210, 1.1) + T.firefly(150, 236, 2) + T.firefly(272, 180, 2.8) + T.firefly(64, 150, 1.6) : ""; }
    })
  };

  /* ------------------------------------------------------------------ the yard ----------------------------------------- */
  /* an egg standing on its bottom at (x, y): w wide, h tall, speckled, in shade on the right */
  function egg(x, y, w, h, c, spots){
    var q = function(a, b){ return f(x + a) + " " + f(y + b); };
    var d = "M" + q(0, -h) + " C" + q(w * .62, -h) + " " + q(w * .68, -h * .02) + " " + q(0, 0) + " C" + q(-w * .68, -h * .02) + " " + q(-w * .62, -h) + " " + q(0, -h) + " Z";
    var sh = "M" + q(w * .12, -h * .98) + " C" + q(w * .62, -h * .9) + " " + q(w * .68, -h * .02) + " " + q(0, 0) + " C" + q(w * .3, -h * .2) + " " + q(w * .42, -h * .7) + " " + q(w * .12, -h * .98) + " Z";
    var s = F(d, c[0]) + F(sh, c[1], .9) + O(d, 1.4), R = T.rng(spots);
    for (var i = 0; i < 7; i++){ var a = -.4 + R() * .8, b = -.15 - R() * .7; s += ell(x + a * w * .8, y + b * h, .9 + R() * .9, .7 + R() * .6, i % 2 ? "#7FAE6A" : "#B98559", 0); }
    return s + T.HI("M" + q(-w * .3, -h * .55) + " Q" + q(-w * .3, -h * .82) + " " + q(-w * .08, -h * .9), 1.3);
  }
  var EGG = ["#F4EEDC", "#DCD2B8"];
  /* the T. rex's skull, facing left, its jaw hinged at (hx, hy); open: the jaw's turn in degrees */
  function rexSkull(x, y, open){
    var q = function(a, b){ return f(x + a) + " " + f(y + b); }, s = "", i;
    /* the upper skull: brow, snout and the row of teeth along its edge */
    var up = "M" + q(0, -10) + " C" + q(-3, -14) + " " + q(-9, -15) + " " + q(-13, -13.4) + " L" + q(-15, -15.6) + " L" + q(-17, -13) + " C" + q(-22, -12.6) + " " + q(-27, -10.4) + " " + q(-30.6, -7.4) + " Q" + q(-32.2, -5.6) + " " + q(-31.4, -3.2) +
      " L" + q(-6, -2.2) + " Q" + q(-1, -2.6) + " " + q(1.6, -4.6) + " Q" + q(2.4, -8) + " " + q(0, -10) + " Z";
    var jaw = "M" + q(-29.4, -2.6) + " Q" + q(-30.4, .6) + " " + q(-27.6, 1.6) + " L" + q(-8, 4.6) + " Q" + q(-1.6, 5.6) + " " + q(1.2, 1.4) + " L" + q(-1, -2.2) + " Z";
    var upT = "", loT = "";
    for (i = 0; i < 8; i++){ var tx = -29 + i * 3.1, tl = i === 1 || i === 4 ? 3.6 : 2.8; upT += FO("M" + q(tx - 1.1, -2.9) + " L" + q(tx, -2.9 + tl) + " L" + q(tx + 1.1, -2.7) + " Z", "#FFFDF6", .7); }
    for (i = 0; i < 7; i++){ var bx = -27.4 + i * 3.1, bl = i === 2 ? 3.4 : 2.6; loT += FO("M" + q(bx - 1, -1.4) + " L" + q(bx, -1.4 - bl) + " L" + q(bx + 1, -1.2) + " Z", "#FFFDF6", .7); }
    var jawG = loT + FO(jaw, BONE[1], 1.5) + L("M" + q(-24, 1.4) + " L" + q(-9, 3.4), .8, BONE[2]) + ell(x - 9.6, y + 1.6, 2.6, 1.3, BONE[2], .7);
    if (open) s += F("M" + q(1.2, -1) + " L" + q(-31.4, -3.2) + " L" + q(-27, 12.4) + " L" + q(-6, 8) + " Z", "#4A3440") + '<g transform="rotate(' + open + " " + f(x + .4) + " " + f(y - 1.4) + ')">' + jawG + "</g>";
    else s += jawG;
    s += upT + FO(up, BONE[0], 1.6);
    /* the openings: the eye socket, the big window in front of it, the nostril */
    s += ell(x - 7.2, y - 8, 2.6, 2.8, "#5E4A4A", 1) + FO("M" + q(-12.4, -7) + " Q" + q(-15, -10.6) + " " + q(-20, -8.8) + " Q" + q(-17.4, -5.2) + " " + q(-12.4, -7) + " Z", "#5E4A4A", 1) + ell(x - 28, y - 7.4, 1.3, .9, "#5E4A4A", .7);
    s += L("M" + q(-2, -4.6) + " Q" + q(-6, -5.6) + " " + q(-11, -4.4), .8, BONE[2]) + T.HI("M" + q(-6, -11.6) + " Q" + q(-14, -12.6) + " " + q(-22, -10), 1.3);
    return s;
  }
  var yard = {
    "dino-nest": {
      note: "A twig nest with three big speckled eggs, one of them wobbling", spot: [3.3, 3.4],
      egg: { n: "The dino egg nest", does: "an egg cracks and a baby dino peeks out", say: "A hatchling! Some baby dinos had teeth before they even hatched." }, anim: "tp-peek 2.4s",
      draw: function(o){
        var g = P(1.8, 1.85, 0), x = g[0], y = g[1] - 1, fc = o.snow ? SNOWF : o.night ? NFERN : FERN, tw = o.night ? ["#8A6E52", "#6E563E", "#54402E"] : ["#B98A5A", "#94683E", "#74502E"], s = ell(x + 2, y + 6, 30, 11, "#1B2A3A", 0, .1), R = T.rng(17), i;
        /* ferns behind it */
        s += frond(x - 14, y - 4, 22, -120, -50, 4.4, [fc[1], fc[3]], 1, 7) + frond(x - 12, y - 4, 20, -96, -30, 4, [fc[0], fc[3]], 1, 7) + frond(x + 16, y - 5, 18, -70, 40, 3.8, [fc[1], fc[3]], 1, 6);
        /* the nest: its side, its rim and the hollow; the eggs; the front of the rim over them */
        s += FO("M" + f(x - 25) + " " + f(y) + " Q" + f(x - 25) + " " + f(y + 9) + " " + f(x) + " " + f(y + 11) + " Q" + f(x + 25) + " " + f(y + 9) + " " + f(x + 25) + " " + f(y) + " Z", tw[1], 1.6);
        s += ell(x, y, 25, 11, tw[0], 1.6) + ell(x, y - 1.4, 17, 6.6, tw[2], 1.2) + ell(x - 1, y - .8, 13, 4.4, o.night ? "#5E4A3A" : "#7E5E40", 0);
        var tws = ""; for (i = 0; i < 22; i++){ var a = R() * Math.PI * 2, rx = 21 * (.9 + R() * .2), ry = 9 * (.9 + R() * .2), px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry; tws += "M" + f(px - 4) + " " + f(py + (R() - .5) * 2) + " l" + f(8) + " " + f((R() - .5) * 3) + " "; }
        s += L(tws, 1, tw[2], .8);
        s += egg(x - 7.6, y + .2, 10.6, 14.6, EGG, 3) + egg(x + 7.8, y - .4, 10.6, 14.4, EGG, 7) + G("tp-bob", egg(x + .2, y + 3.4, 11.6, 16, EGG, 11));
        var front = "M" + f(x - 25) + " " + f(y) + " Q" + f(x - 21) + " " + f(y + 2.4) + " " + f(x - 16.6) + " " + f(y + 1.2) + " Q" + f(x) + " " + f(y + 7.6) + " " + f(x + 16.6) + " " + f(y + 1.2) + " Q" + f(x + 21) + " " + f(y + 2.4) + " " + f(x + 25) + " " + f(y) + " Q" + f(x + 25) + " " + f(y + 9) + " " + f(x) + " " + f(y + 11) + " Q" + f(x - 25) + " " + f(y + 9) + " " + f(x - 25) + " " + f(y) + " Z";
        s += FO(front, tw[0], 1.6);
        var ft = ""; for (i = 0; i < 14; i++){ var px2 = x - 22 + i * 3.3 + R(), py2 = y + 4 + Math.sin(i / 13 * Math.PI) * 4.4 + R(); ft += "M" + f(px2 - 3) + " " + f(py2 - 1 + R() * 2) + " l" + f(6 + R() * 2) + " " + f((R() - .5) * 3) + " "; }
        s += L(ft, 1, tw[2], .9) + L("M" + f(x + 22) + " " + f(y + 1) + " l7 -4 M" + f(x - 23) + " " + f(y + 3) + " l-6 -3 M" + f(x + 10) + " " + f(y + 9) + " l5 4", 1.4, tw[2]);
        if (o.snow) s += ell(x - 16, y - 2, 6, 2, "#FFFFFF", 0) + ell(x + 18, y - 1, 5, 1.8, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var g = P(1.8, 1.85, 0), x = g[0] + .2, y = g[1] + 2.4 - 15, s = "";
        /* a baby dino, the egg's cap on its head like a hat, peeking over the broken shell */
        s += FO("M" + f(x - 6.4) + " " + f(y + 6) + " C" + f(x - 7.6) + " " + f(y - 4) + " " + f(x - 3) + " " + f(y - 8) + " " + f(x + 1) + " " + f(y - 7.6) + " C" + f(x + 6.4) + " " + f(y - 7) + " " + f(x + 7.4) + " " + f(y - 1) + " " + f(x + 6.4) + " " + f(y + 6) + " Z", "#8FD07A", 1.3);
        s += F("M" + f(x + 2.6) + " " + f(y - 7) + " C" + f(x + 6.6) + " " + f(y - 6) + " " + f(x + 7.4) + " " + f(y - 1) + " " + f(x + 6.4) + " " + f(y + 6) + " L" + f(x + 3.6) + " " + f(y + 6) + " Q" + f(x + 5.4) + " " + f(y - 1) + " " + f(x + 2.6) + " " + f(y - 7) + " Z", "#6BB45E", .9);
        s += circ(x - 2.6, y - 1.6, 1.5, INK) + circ(x + 2.2, y - 1.6, 1.5, INK) + circ(x - 2.2, y - 2.1, .5, "#FFFFFF") + circ(x + 2.6, y - 2.1, .5, "#FFFFFF") + L("M" + f(x - 1.6) + " " + f(y + 1.6) + " q1.6 1.4 3.2 0", 1) + F("M" + f(x - .4) + " " + f(y + 2.2) + " l.6 1.2 .6 -1.2 z", "#FFFFFF");
        s += FO("M" + f(x - 5) + " " + f(y - 6.4) + " Q" + f(x - 4) + " " + f(y - 12.4) + " " + f(x + 1) + " " + f(y - 12.4) + " Q" + f(x + 5.6) + " " + f(y - 12) + " " + f(x + 5.4) + " " + f(y - 6.4) + " L" + f(x + 3.4) + " " + f(y - 8) + " L" + f(x + 1.4) + " " + f(y - 6) + " L" + f(x - 1) + " " + f(y - 8) + " L" + f(x - 3) + " " + f(y - 6) + " Z", EGG[0], 1.1);
        s += FO("M" + f(x - 6.6) + " " + f(y + 4.6) + " L" + f(x - 4.4) + " " + f(y + 2.4) + " L" + f(x - 2.4) + " " + f(y + 4.8) + " L" + f(x) + " " + f(y + 2.6) + " L" + f(x + 2.4) + " " + f(y + 4.8) + " L" + f(x + 4.6) + " " + f(y + 2.4) + " L" + f(x + 6.6) + " " + f(y + 4.6) + " L" + f(x + 6.4) + " " + f(y + 8) + " L" + f(x - 6.4) + " " + f(y + 8) + " Z", EGG[0], 1.1);
        return s;
      }
    },
    "fossil-dig": {
      note: "A little roped-off dig: a fossil skull half uncovered in its pit, a bucket, a sieve and brushes", spot: [3.3, 3.45],
      egg: { n: "The fossil dig", does: "a brush sweeps and a big fossil tooth glints", say: "A fossil tooth! Teeth are the fossils found most often. Enamel is built to last." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var s = T.ell.apply(null, P(1.8, 1.9, 0).concat([32, 12, "#1B2A3A", 0, .1])), D = T.D, dirt = o.night ? ["#8A6E56", "#6E5644", "#54402F"] : o.snow ? ["#E6E0D6", "#BFAE96", "#8E7A62"] : ["#C9A27A", "#A47E58", "#7E5C3E"], i;
        var x0 = .55, x1 = 2.95, y0 = .55, y1 = 2.8, d = .5, rope = o.night ? "#B9AA88" : "#E2D2A8";
        var post = function(x, y){ return box(x - .08, y - .08, 0, .16, .16, .62, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.1, si: .7 }); };
        var top = function(x, y){ return P(x, y, .52); };
        var rp = function(a, b){ var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1.6]; return "M" + f(a[0]) + " " + f(a[1]) + " Q" + f(m[0]) + " " + f(m[1]) + " " + f(b[0]) + " " + f(b[1]); };
        var c00 = [x0 - .25, y0 - .25], c10 = [x1 + .25, y0 - .25], c11 = [x1 + .25, y1 + .25], c01 = [x0 - .25, y1 + .25];
        /* the back posts and their rope */
        s += post(c00[0], c00[1]) + post(c10[0], c10[1]) + post(c01[0], c01[1]);
        s += L(rp(top(c01[0], c01[1]), top(c00[0], c00[1])) + " " + rp(top(c00[0], c00[1]), top(c10[0], c10[1])), 2.4) + L(rp(top(c01[0], c01[1]), top(c00[0], c00[1])) + " " + rp(top(c00[0], c00[1]), top(c10[0], c10[1])), 1.1, rope);
        /* the spoil heap behind */
        var sp = P(3.05, .35, 0); s += FO("M" + f(sp[0] - 12) + " " + f(sp[1] + 2) + " Q" + f(sp[0] - 12) + " " + f(sp[1] - 4) + " " + f(sp[0] - 7) + " " + f(sp[1] - 5) + " Q" + f(sp[0] - 4) + " " + f(sp[1] - 10) + " " + f(sp[0] + 2) + " " + f(sp[1] - 8) + " Q" + f(sp[0] + 8) + " " + f(sp[1] - 8) + " " + f(sp[0] + 9) + " " + f(sp[1] - 3) + " Q" + f(sp[0] + 13) + " " + f(sp[1] - 2) + " " + f(sp[0] + 12) + " " + f(sp[1] + 2) + " Q" + f(sp[0]) + " " + f(sp[1] + 5) + " " + f(sp[0] - 12) + " " + f(sp[1] + 2) + " Z", dirt[0], 1.3) + F("M" + f(sp[0] + 2) + " " + f(sp[1] - 8) + " Q" + f(sp[0] + 8) + " " + f(sp[1] - 8) + " " + f(sp[0] + 9) + " " + f(sp[1] - 3) + " Q" + f(sp[0] + 13) + " " + f(sp[1] - 2) + " " + f(sp[0] + 12) + " " + f(sp[1] + 2) + " Q" + f(sp[0] + 6) + " " + f(sp[1] + 3.6) + " " + f(sp[0] + 1) + " " + f(sp[1] + 3.4) + " Q" + f(sp[0] + 5) + " " + f(sp[1] - 3) + " " + f(sp[0] + 2) + " " + f(sp[1] - 8) + " Z", dirt[1], .8) + circ(sp[0] - 5, sp[1] - 1, .9, dirt[2]) + circ(sp[0] + 4, sp[1] - 4, .8, dirt[2]);
        /* the pit: its rim, the floor, the two far walls */
        s += FO(D([[x0 - .12, y0 - .12, 0], [x1 + .12, y0 - .12, 0], [x1 + .12, y1 + .12, 0], [x0 - .12, y1 + .12, 0]]), dirt[1], 1.4);
        s += F(D([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]), dirt[0]);
        s += F(D([[x0, y0, 0], [x1, y0, 0], [x1, y0 + d, 0], [x0, y0, -d]]), dirt[1]) + F(D([[x0, y0, 0], [x0, y1, 0], [x0 + d, y1, 0], [x0, y0, -d]]), dirt[2]);
        s += L(D([[x0, y0, -d], [x1 - d, y0, -d]], true) + D([[x0, y0, -d], [x0, y1 - d, -d]], true), .9, INK, .6) + O(D([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]), 1.4);
        /* the grid strings across it */
        s += L(D([[1.75, y0, .02], [1.75, y1, .02]], true) + D([[x0, 1.68, .02], [x1, 1.68, .02]], true), .8, "#FFFDF6", .8);
        /* the fossil skull lying in the floor, its back half still in the dirt */
        var sk = P(2.05, 1.95, -d);
        s += '<g transform="translate(' + f(sk[0] + 8) + " " + f(sk[1] + 2) + ') scale(.8)">' + rexSkull(0, 0, 0) + "</g>";
        s += FO("M" + f(sk[0] + 1) + " " + f(sk[1] + 6) + " Q" + f(sk[0] + 4) + " " + f(sk[1] - 4) + " " + f(sk[0] + 10) + " " + f(sk[1] - 3) + " Q" + f(sk[0] + 16) + " " + f(sk[1] - 2) + " " + f(sk[0] + 17) + " " + f(sk[1] + 6) + " Z", dirt[0], 1.1) + L("M" + f(sk[0] + 6) + " " + f(sk[1] + 1) + " q3 -1.6 6 0", .7, dirt[2]);
        var bn = P(1.0, 2.2, -d); s += L("M" + f(bn[0] - 4) + " " + f(bn[1]) + " l8 -2", 3.4) + L("M" + f(bn[0] - 4) + " " + f(bn[1]) + " l8 -2", 1.8, BONE[0]) + circ(bn[0] - 4.4, bn[1] + .2, 1.6, BONE[0], .8) + circ(bn[0] + 4.4, bn[1] - 2.1, 1.6, BONE[0], .8);
        /* the front posts and their rope, with little pennants */
        s += post(c11[0], c11[1]);
        var fr = rp(top(c01[0], c01[1]), top(c11[0], c11[1])) + " " + rp(top(c11[0], c11[1]), top(c10[0], c10[1]));
        s += L(fr, 2.4) + L(fr, 1.1, rope);
        [[.2, c01, c11], [.55, c01, c11], [.85, c01, c11], [.3, c11, c10], [.7, c11, c10]].forEach(function(q, k){ var a = top(q[1][0], q[1][1]), b = top(q[2][0], q[2][1]), t = q[0], px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t + 1.6 * 2 * t * (1 - t); s += FO("M" + f(px - 1.8) + " " + f(py) + " h3.6 l-1.8 3.6 z", k % 2 ? "#F2C94C" : "#E5484D", .7); });
        /* the tools: a bucket, a sieve leaning on the post, brushes by the edge */
        s += T.cyl(3.15, 1.0, 0, .36, .8, .44, o.night ? "#8E98A3" : "#C9D2DA", o.night ? "#6E7882" : "#A9B3BE", "#5A4A3E", { sw: 1.4, si: 1 });
        var bk = P(3.15, 1.0, .8); s += L("M" + f(bk[0] - 5.4) + " " + f(bk[1]) + " Q" + f(bk[0]) + " " + f(bk[1] - 7) + " " + f(bk[0] + 5.4) + " " + f(bk[1]), 1.1) + ell(bk[0], bk[1] + .4, 4.2, 1.6, dirt[1], 0);
        var sv = P(.45, 3.35, 0); s += ell(sv[0], sv[1] + 1, 8.6, 4.2, K.woodShade, 1.4) + ell(sv[0], sv[1], 8.6, 4.2, K.woodLight, 1.4) + ell(sv[0], sv[1] + .4, 6.6, 3, o.night ? "#7A6A5A" : "#B9A88E", .9) + L("M" + f(sv[0] - 4) + " " + f(sv[1] - 2) + " l8 4 M" + f(sv[0] - 6) + " " + f(sv[1]) + " l6 3 M" + f(sv[0]) + " " + f(sv[1] - 2.6) + " l5.4 2.6 M" + f(sv[0] + 4) + " " + f(sv[1] - 2) + " l-8 4 M" + f(sv[0] + 6) + " " + f(sv[1]) + " l-6 3 M" + f(sv[0]) + " " + f(sv[1] - 2.6) + " l-5.4 2.6", .6, INK, .55) + circ(sv[0] - 2, sv[1], 1, dirt[2]) + circ(sv[0] + 2.4, sv[1] + 1, .8, BONE[1]);
        var br = function(x, y, a, c){ return '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + a + ')">' + FO("M-.9 0 h1.8 v-8 h-1.8 z", K.wood, .9) + FO("M-1.3 -8 h2.6 v-1.6 h-2.6 z", "#C9D2DA", .8) + FO("M-1.6 -9.6 q-.6 -3 0 -4.4 h3.2 q.6 1.4 0 4.4 z", c, .8) + "</g>"; };
        var b1 = P(3.25, 2.4, 0), b2 = P(2.3, 3.3, 0); s += br(b1[0], b1[1], 70, "#F2D9A6") + br(b2[0], b2[1], -78, "#3B2E3A");
        if (o.snow) s += ell.apply(null, P(1.75, 1.68, 0).concat([18, 3, "#FFFFFF", 0, .6]));
        return s;
      },
      bits: function(){
        var c = P(1.4, 1.45, -.5), s = "";
        /* the big tooth, swept clean, glinting; the brush and the dust it raised */
        s += FO("M" + f(c[0] - 3) + " " + f(c[1] + 1) + " Q" + f(c[0] - 3.6) + " " + f(c[1] - 7) + " " + f(c[0] + 2.4) + " " + f(c[1] - 12) + " Q" + f(c[0] + 1.2) + " " + f(c[1] - 5) + " " + f(c[0] + 3.2) + " " + f(c[1] + 1) + " Q" + f(c[0]) + " " + f(c[1] + 2.6) + " " + f(c[0] - 3) + " " + f(c[1] + 1) + " Z", "#F2E2BE", 1.2) + L("M" + f(c[0] + 2.2) + " " + f(c[1] - 10) + " q-1 4 .8 9", .7, "#C9A86A");
        s += T.dmStar(c[0] + 5, c[1] - 12, 4.4, "#FFFFFF", "") + T.dmStar(c[0] - 5, c[1] - 6, 2.4, "#FFF3C4", "");
        s += '<g transform="translate(' + f(c[0] + 14) + " " + f(c[1] - 8) + ') rotate(-58)">' + FO("M-1.2 0 h2.4 v-12 h-2.4 z", K.wood, 1) + FO("M-1.7 -12 h3.4 v-2 h-3.4 z", "#C9D2DA", .9) + FO("M-2.2 -14 q-.8 -4 0 -6 h4.4 q.8 2 0 6 z", "#F2D9A6", .9) + "</g>";
        s += circ(c[0] + 7, c[1] - 1, 2.4, "#D9C2A0", 0) + circ(c[0] + 10, c[1] - 4, 1.8, "#D9C2A0", 0) + circ(c[0] + 4, c[1] - 3, 1.4, "#E6D6BA", 0) + L("M" + f(c[0] + 6) + " " + f(c[1] - 9) + " q4 1 6 4", 1, INK, .5);
        return s;
      }
    },
    "trex-skeleton": {
      note: "A T. rex skeleton on a museum plinth, the star of the valley: a big skull grinning with a jaw full of teeth", spot: [3.4, 3.4],
      egg: { n: "The T. rex skeleton", does: "its jaw opens and snaps shut", say: "Chomp! A T. rex had about 60 teeth and grew new ones all its life. Show-off." }, anim: "tp-peek 1.1s steps(1, end) 2",
      draw: function(o){
        var s = ell.apply(null, P(1.8, 1.8, 0).concat([34, 13, "#1B2A3A", 0, .1])), stn = o.night ? { top: "#B9BFC7", left: "#A9B0B9", right: "#858D98" } : { top: "#E3E7EB", left: "#D0D6DC", right: "#A9B3BE" };
        /* the plinth, a brass plaque with a little tooth on it, an uplight on its corner */
        s += box(.35, .7, 0, 2.95, 2.25, .4, stn, { sw: 1.6, si: 1 });
        var pl = [[1.3, 2.95, .08], [2.4, 2.95, .08], [2.4, 2.95, .32], [1.3, 2.95, .32]];
        s += FO(T.D(pl), "#E8BE45", 1) + T.tinyTooth.apply(null, P(1.85, 2.95, .2).concat([.5, "#FFFDF6"]));
        var c = P(1.8, 1.82, .4), x = c[0], y = c[1], B = o.night ? ["#E3DCC8", "#C4B898", "#A0916E"] : BONE;
        var bone = function(d, w, col){ return L(d, w + 2.6) + L(d, w, col || B[0]); };
        var knob = function(px, py, r, col){ return circ(px, py, r, col || B[0], 1.1); };
        /* the far leg, in shade */
        var leg = function(dx, col){
          return bone("M" + f(x + 6 + dx) + " " + f(y - 31) + " L" + f(x - 1 + dx) + " " + f(y - 18) + " L" + f(x + 6 + dx) + " " + f(y - 7) + " L" + f(x + dx) + " " + f(y - .6), 3.4, col) + knob(x - 1 + dx, y - 18, 2.2, col) + knob(x + 6 + dx, y - 7, 1.8, col) +
            L("M" + f(x + dx) + " " + f(y - .6) + " l-6 .6 M" + f(x + dx) + " " + f(y - .6) + " l-5 2.4 M" + f(x + dx) + " " + f(y - .6) + " l-5.6 -1.4", 3.4) + L("M" + f(x + dx) + " " + f(y - .6) + " l-6 .6 M" + f(x + dx) + " " + f(y - .6) + " l-5 2.4 M" + f(x + dx) + " " + f(y - .6) + " l-5.6 -1.4", 1.6, col || B[0]);
        };
        s += leg(6, B[1]);
        /* the tail, the spine, the neck: one long curve of vertebrae */
        var spine = "M" + f(x - 15) + " " + f(y - 37) + " Q" + f(x - 4) + " " + f(y - 41) + " " + f(x + 8) + " " + f(y - 38) + " Q" + f(x + 22) + " " + f(y - 35) + " " + f(x + 32) + " " + f(y - 27) + " Q" + f(x + 37) + " " + f(y - 23) + " " + f(x + 41) + " " + f(y - 19);
        s += bone(spine, 3.6);
        s += bone("M" + f(x + 28) + " " + f(y - 30) + " Q" + f(x + 36) + " " + f(y - 24) + " " + f(x + 41) + " " + f(y - 19), 1.8);
        var ticks = ""; [[-11, -39, -12, -43], [-6, -40, -6.4, -44.6], [-1, -40.4, -1, -45], [4, -40, 4.4, -44.6], [9, -38.4, 9.8, -43], [14, -37.4, 15.4, -41.4], [19, -36, 20.6, -39.6], [24, -33.4, 26, -36.6]].forEach(function(t){ ticks += "M" + f(x + t[0]) + " " + f(y + t[1]) + " L" + f(x + t[2]) + " " + f(y + t[3]) + " "; });
        s += bone(ticks, 1.6);
        var ribs = ""; [-12, -8, -4, 0, 4].forEach(function(rx, k){ ribs += "M" + f(x + rx) + " " + f(y - 38.6) + " q" + f(-3.4 + k * .3) + " " + f(7 + (k === 2 ? 1 : 0)) + " " + f(1 + k * .4) + " " + f(13 - Math.abs(k - 2) * 1.6) + " "; });
        s += bone(ribs, 1.5);
        /* the hips */
        s += FO("M" + f(x) + " " + f(y - 36) + " Q" + f(x + 2) + " " + f(y - 43) + " " + f(x + 9) + " " + f(y - 43) + " Q" + f(x + 16) + " " + f(y - 42) + " " + f(x + 15) + " " + f(y - 35) + " Q" + f(x + 8) + " " + f(y - 31.6) + " " + f(x) + " " + f(y - 36) + " Z", B[0], 1.4);
        s += bone("M" + f(x + 5) + " " + f(y - 33) + " L" + f(x - 2) + " " + f(y - 22), 2.4) + ell(x - 3, y - 21.4, 3, 1.6, B[0], 1.1);
        /* the near leg, over the hips */
        s += leg(0);
        s += knob(x + 6, y - 31.4, 2.6);
        /* the neck, the little arms */
        s += bone("M" + f(x - 15) + " " + f(y - 37) + " Q" + f(x - 21) + " " + f(y - 40) + " " + f(x - 20) + " " + f(y - 46), 3.2);
        s += bone("M" + f(x - 13) + " " + f(y - 31) + " L" + f(x - 17) + " " + f(y - 27.4) + " L" + f(x - 19.4) + " " + f(y - 24.6), 1.5) + L("M" + f(x - 19.4) + " " + f(y - 24.6) + " l-1.6 .2 M" + f(x - 19.4) + " " + f(y - 24.6) + " l-.8 1.4", 1.1);
        /* the skull */
        s += rexSkull(x - 14, y - 46, 0);
        if (o.snow) s += ell(x - 22, y - 60.6, 7, 1.6, "#FFFFFF", 0) + ell(x + 6, y - 44, 5, 1.4, "#FFFFFF", 0);
        /* the uplight */
        var ul = P(.6, 2.85, .4); s += FO("M" + f(ul[0] - 2.4) + " " + f(ul[1]) + " l.8 -3.4 h3.2 l.8 3.4 z", "#3B2E3A", .9) + ell(ul[0], ul[1] - 3.4, 1.6, .7, o.night ? K.litHot : "#FFF3C4", .6);
        return s;
      },
      lights: function(){ var c = P(1.8, 1.82, .4), ul = P(.6, 2.85, .4); return T.glowAt(c[0] - 24, c[1] - 52, 14) + T.glowAt(ul[0], ul[1] - 4, 6); },
      bits: function(o){
        var c = P(1.8, 1.82, .4);
        return rexSkull(c[0] - 14, c[1] - 46, -26);
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits -------------------------------------- */
  var KHAKI = ["#D2BC86", "#B39A62", "#8A7344"];
  var outfits = {
    "field-hat": {
      note: "A wide-brim canvas field hat with a leather band and a dusting brush tucked in",
      top: '<ellipse cx="100" cy="45" rx="72" ry="13" fill="#C9B07A" ' + O4 + "/>" + '<path d="M100 32 Q160 34 168 44 Q150 52 120 55 Q156 46 100 40 Z" fill="#B39A62" opacity=".7"/>' +
        '<ellipse cx="100" cy="45" rx="62" ry="9.6" fill="none" stroke="#A88F58" stroke-width="1.6" stroke-dasharray="3 3"/>' +
        '<g transform="translate(130 28) rotate(24)">' + p("M-2.6 14 h5.2 v-26 h-5.2 z", "#B5763E", O2) + p("M-3.4 -12 h6.8 v-5 h-6.8 z", "#C9D2DA", O2) + p("M-4.2 -17 Q-6 -27 -2 -33 Q0 -35 2 -33 Q6 -27 4.2 -17 Z", "#F4E2B8", O2) + '<path d="M-1.6 -19 v-10 M1.4 -19 v-10" stroke="#C9A86A" stroke-width="1.2"/>' + "</g>" +
        p("M64 44 C62 16 76 4 100 4 C124 4 138 16 136 44 Q100 54 64 44 Z", "#DEC896") + '<path d="M112 6 C128 10 136 24 136 44 Q124 48 116 48 C122 30 120 16 112 6 Z" fill="#C9B07A"/>' + '<path d="M64 44 C62 16 76 4 100 4 C124 4 138 16 136 44 Q100 54 64 44 Z" fill="none" ' + O4 + "/>" +
        '<path d="M88 8 Q100 20 112 8" fill="none" stroke="#B39A62" stroke-width="2.2" stroke-linecap="round"/>' +
        p("M64 36 Q100 28 136 36 L136 44 Q100 52 64 44 Z", "#7A5536", O3) + '<path d="M70 41 Q100 35 130 41" fill="none" stroke="#9C7048" stroke-width="1.6"/>' +
        p("M121 33 h8 v9.6 h-8 z", "#C9971C", O2) + '<path d="M123.6 37.8 h2.8" stroke="' + INK + '" stroke-width="1.4" stroke-linecap="round"/>' +
        '<circle cx="76" cy="22" r="2.2" fill="#B39A62" ' + O2.replace("2.2", "1.4") + '/><path d="M72 18 Q78 10 90 8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".55"/>',
      say: ["Fossil hunter Timmy, reporting for dig duty.", "Teeth are the fossils found most often. Enamel is built to last.", "I sweep fossils the way I brush: soft bristles, small circles."]
    },
    "fossil-vest": {
      note: "A khaki dig-site vest: a pencil and a little notebook in its pockets, an ammonite patch and a soft brush in hand",
      face: p("M50.6 108 Q58 104 66 106 Q76 108 82 111 L96 156.6 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 108 Z", KHAKI[0], O3) +
        p("M149.4 108 Q142 104 134 106 Q124 108 118 111 L104 156.6 Q120 156 135 143 Q140 132 146.6 131 Q149.6 121 149.4 108 Z", KHAKI[0], O3) +
        '<path d="M140 108 Q147 112 147 124 Q146 134 135 143 Q122 152 108 155 L118 114 Q128 108 140 108 Z" fill="' + KHAKI[1] + '" opacity=".45"/>' +
        '<path d="M83.4 115 L95 154 M116.6 115 L105 154" fill="none" stroke="' + KHAKI[2] + '" stroke-width="1.6" stroke-dasharray="2.6 2.6"/>' +
        /* the pencil in the left pocket, the notebook peeking out of the right one */
        '<g transform="translate(64 127) rotate(-28)">' + p("M-2.2 0 v-20 l2.2 -5 l2.2 5 v20 z", "#F2C94C", O2) + p("M-2.2 0 h4.4 v3.6 h-4.4 z", "#FF9FB0", O2) + '<path d="M-1 -25 l1 -2.4 l1 2.4 z" fill="' + INK + '"/>' + "</g>" +
        p("M56 128 Q66 126 78 130 L76 144 Q66 146 58 141 Z", KHAKI[1], O2) + p("M55 126 Q66 123 79 128 L78.4 133 Q66 129 55.4 131.4 Z", KHAKI[0], O2) + '<circle cx="67" cy="129.6" r="1.4" fill="' + KHAKI[2] + '"/>' +
        p("M124 124 l14 -2 2.4 13 -14 2.4 z", "#3FA7E0", O2) + '<path d="M126.4 125.6 l11.6 -1.6" stroke="#FFFDF6" stroke-width="1.6"/>' +
        p("M121 130 Q132 127 143 129 L142 142 Q132 146 123 143 Z", KHAKI[1], O2) + p("M120.4 128.4 Q132 125.4 143.6 127.6 L143 132.4 Q132 130 121 133 Z", KHAKI[0], O2) + '<circle cx="132" cy="129.4" r="1.4" fill="' + KHAKI[2] + '"/>' +
        /* an ammonite patch on the chest */
        '<circle cx="70" cy="116" r="5.4" fill="#5E8A3A" ' + O2.replace("2.2", "1.6") + "/>" + '<path d="M70 116 m-.6 0 a1.2 1.2 0 1 1 1.8 .8 a2.4 2.4 0 1 1 -3.6 -2 a3.6 3.6 0 1 1 5 4.6" fill="none" stroke="#F2E2BE" stroke-width="1.2" stroke-linecap="round"/>' +
        /* the soft brush, in his right hand */
        '<g transform="translate(168 120) rotate(32)">' + p("M-2.4 6 h4.8 v-24 h-4.8 z", "#B5763E", O2) + p("M-3.2 -18 h6.4 v-4 h-6.4 z", "#C9D2DA", O2) + p("M-5.6 -22 Q-8 -32 -4 -37 L4 -37 Q8 -32 5.6 -22 Z", "#F4E2B8", O2) + '<path d="M-2 -24 v-10 M0 -24 v-11 M2 -24 v-10" stroke="#C9A86A" stroke-width="1"/>' + "</g>",
      say: ["Pencil, notebook, soft brush. A dig is mostly very gentle brushing.", "Field note: one lower first molar, number thirty. Excellent condition.", "Slow strokes, light pressure. Works on fossils. Works on gums."]
    },
    "stego-hood": {
      note: "A green stegosaurus hood: a row of plates on top, felt teeth round his face and a spiky tail behind",
      back: p("M146 130 C170 138 190 124 194 104 C196 94 194 84 190 78 C184 88 178 96 168 102 C158 108 150 112 146 118 Z", "#8CC45E") + '<path d="M150 126 C168 130 184 120 188 104" fill="none" stroke="#6FA84A" stroke-width="2.4" opacity=".8"/>' +
        p("M186 84 L196 64 L192 86 Z", "#F4EBD3", O3) + p("M190 80 L206 70 L194 88 Z", "#F4EBD3", O3) + p("M182 92 L186 72 L188 92 Z", "#F4EBD3", O3) + p("M188 90 L202 86 L190 96 Z", "#F4EBD3", O3),
      top: p("M100 -18 Q112 -8 108 8 L92 8 Q88 -8 100 -18 Z", "#F2A23C", O3) + p("M74 -6 Q87 -2 86 12 L70 18 Q64 6 74 -6 Z", "#F2A23C", O3) + p("M126 -6 Q136 6 130 18 L114 12 Q113 -2 126 -6 Z", "#F2A23C", O3) +
        p("M52 14 Q64 10 66 22 L54 32 Q46 24 52 14 Z", "#F2A23C", O3) + p("M148 14 Q154 24 146 32 L134 22 Q136 10 148 14 Z", "#F2A23C", O3) +
        '<path d="M100 -12 v16 M76 0 l3 12 M124 0 l-3 12 M55 18 l3 8 M145 18 l-3 8" stroke="#D9822B" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M46 118 C36 96 34 60 46 38 C58 14 78 6 100 6 C122 6 142 14 154 38 C166 60 164 96 154 118 C140 134 120 138 100 138 C80 138 60 134 46 118 Z M56 90 C56 70 74 60 100 60 C126 60 144 70 144 90 C144 108 126 118 100 118 C74 118 56 108 56 90 Z" fill="#8CC45E" fill-rule="evenodd" ' + O4 + "/>" +
        '<path d="M126 12 C142 18 152 32 158 56 C162 78 160 100 152 118 C146 124 140 128 134 130 C146 112 150 90 146 76 C140 62 130 58 120 58 C132 44 134 24 126 12 Z" fill="#74AE4C" opacity=".75"/>' +
        '<ellipse cx="66" cy="30" rx="5" ry="3.4" fill="#6FA84A"/><ellipse cx="84" cy="20" rx="4" ry="2.8" fill="#6FA84A"/><ellipse cx="140" cy="44" rx="4.6" ry="3.2" fill="#5E9A40"/><ellipse cx="48" cy="70" rx="3.4" ry="4.4" fill="#6FA84A"/><ellipse cx="152" cy="84" rx="3.2" ry="4.4" fill="#5E9A40"/>' +
        '<path d="M56 90 C56 70 74 60 100 60 C126 60 144 70 144 90 C144 108 126 118 100 118 C74 118 56 108 56 90 Z" fill="none" stroke="#E9E6A8" stroke-width="5"/>' +
        '<path d="M56 90 C56 70 74 60 100 60 C126 60 144 70 144 90 C144 108 126 118 100 118 C74 118 56 108 56 90 Z" fill="none" ' + O3 + "/>" +
        (function(){ var s = ""; [[70, 66], [82, 62.4], [94, 61], [106, 61], [118, 62.4], [130, 66]].forEach(function(q){ s += p("M" + (q[0] - 4.4) + " " + (q[1] - 1) + " L" + q[0] + " " + (q[1] + 6) + " L" + (q[0] + 4.4) + " " + (q[1] - 1) + " Z", "#FFFDF6", O2.replace("2.2", "1.6")); }); return s; })() +
        '<circle cx="80" cy="36" r="6.4" fill="#FFFFFF" ' + O2 + '/><circle cx="120" cy="36" r="6.4" fill="#FFFFFF" ' + O2 + '/><circle cx="81.4" cy="37.4" r="3" fill="' + INK + '"/><circle cx="118.6" cy="37.4" r="3" fill="' + INK + '"/>' +
        '<path d="M73 32 Q80 27 87 32 M113 32 Q120 27 127 32" fill="none" stroke="#6FA84A" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M60 30 Q72 16 92 12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>',
      say: ["Rawr! Stegosaurus had a beak up front and little leaf-shaped teeth in back.", "Plates on top, spikes on the tail, a molar underneath.", "Ferns for breakfast, ferns for lunch. Rough on the enamel."]
    }
  };

  return { k: "dino", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
