/* The coral reef collection of Timmy's place (tools/figures/site/sets.mjs, COLLECTIONS, lists its eight pieces; the shop's
   catalog has the same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and
   pastes its source into the files that draw it, so it may use nothing from outside itself but T. packs/thanksgiving.mjs
   is the worked example and says what each kind of piece needs.

   The pieces: a conch shell to live in (a round door with a porthole, round windows, a pink lip, bubbles rising from a
   brass vent), the sunlit seafloor (water for a sky, light slanting down from the surface, kelp, a turtle far off), a
   coral garden, a giant clam with a tooth-shaped pearl inside, a sunken chest of Shiny Gold Crowns (the shop's coin: a
   gold dental crown), and a starfish clip, an octopus hat and a mer-tail for Timmy. No clownfish, no talking sponges or
   starfish with faces: just the reef. No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, D2 = T.D2, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, INK = T.INK, RX = T.RX, RY = T.RY;
  var p = T.p, O2 = T.O2, O3 = T.O3, O4 = T.O4;
  var rad = function(a){ return a * Math.PI / 180; };
  var op = function(s, o){ return s.replace("/>", ' opacity="' + o + '"/>'); };
  var q2 = function(v){ return f(v[0]) + " " + f(v[1]); };
  /* a cubic Bezier as points, and a chain of them ([p0, c1, c2, p1, c1, c2, p2, ...]) */
  function bz(a, b, c, d, n){ var out = []; for (var i = 0; i <= n; i++){ var t = i / n, u = 1 - t; out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return out; }
  function chain(pts, n){ var out = [pts[0]]; for (var i = 0; i + 3 < pts.length; i += 3) out = out.concat(bz(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], n || 10).slice(1)); return out; }
  function inside(q, pts){ var c = false; for (var i = 0, j = pts.length - 1; i < pts.length; j = i++){ var a = pts[i], b = pts[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* a band of tapering width along a line of points (an arm, a blade of kelp) */
  function ribbon(pts, w0, w1){
    var l = [], r = [], n = pts.length;
    for (var i = 0; i < n; i++){
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1, w = (w0 + (w1 - w0) * i / (n - 1)) / 2;
      l.push([pts[i][0] - dy / len * w, pts[i][1] + dx / len * w]); r.push([pts[i][0] + dy / len * w, pts[i][1] - dx / len * w]);
    }
    return D2(l.concat(r.reverse()));
  }
  /* a stroke with an ink edge */
  function tube(d, w, col){ return L(d, w + 2.4) + L(d, w, col); }
  /* a starfish: five plump arms with round tips */
  function starPath(cx, cy, r, rot, fat){
    var pt = function(a, k){ return [cx + Math.cos(rad(a)) * r * k, cy + Math.sin(rad(a)) * r * k]; }, d = "";
    for (var i = 0; i < 5; i++){
      var a = rot - 90 + i * 72;
      d += (i ? " Q" + q2(pt(a - 36, fat == null ? .22 : fat)) + " " : "M") + q2(pt(a - 9, .9)) + " Q" + q2(pt(a, 1.12)) + " " + q2(pt(a + 9, .9));
    }
    return d + " Q" + q2(pt(rot - 90 - 36, fat == null ? .22 : fat)) + " " + q2(pt(rot - 99, .9)) + " Z";
  }
  function starfish(cx, cy, r, rot, c, dots, sw){
    var s = FO(starPath(cx, cy, r, rot), c, sw || Math.max(.7, r * .12));
    if (dots) for (var i = 0; i < 5; i++){ var a = rad(rot - 90 + i * 72); [.36, .62].forEach(function(k){ s += circ(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k, r * .07 + .3, dots); }); }
    return s;
  }
  /* a little fish: dir 1 faces right, -1 left */
  function fish(x, y, k, dir, c, band){
    var d = dir || 1, q = function(a, b){ return f(x + a * k * d) + " " + f(y + b * k); };
    var body = "M" + q(6.4, 0) + " Q" + q(3.4, -4.2) + " " + q(-3, -2.6) + " L" + q(-7.4, -4.2) + " L" + q(-6.2, 0) + " L" + q(-7.4, 4.2) + " L" + q(-3, 2.6) + " Q" + q(3.4, 4.2) + " " + q(6.4, 0) + " Z";
    return FO(body, c, Math.max(.6, .8 * k)) + (band ? L("M" + q(.4, -3.1) + " Q" + q(1.6, 0) + " " + q(.4, 3.1), 1.3 * k, band) : "") + circ(x + 3.6 * k * d, y - .7 * k, Math.max(.45, .7 * k), INK);
  }
  /* rising bubbles: they float up like chimney smoke (tp-smoke animates its circles) */
  function bubbles(list, night){ return G("tp-smoke", list.map(function(b){ return circ(b[0], b[1], b[2], night ? "#9CC6E8" : "#EAFBFD", Math.max(.6, b[2] * .32)); }).join(""), ' opacity=".9"'); }
  function pearl(x, y, r){ return circ(x, y, r, "#FBF3F1", Math.max(.6, r * .4)) + circ(x - r * .35, y - r * .38, r * .34, "#FFFFFF"); }
  /* the shop's Shiny Gold Crown (shop.mjs coinBody): a gold dental crown, two cusps and the hollow it seats on */
  var CROWN = "M6.2 17.4 C4.5 14.3 3.5 10.9 4.3 8.1 C4.9 5.9 6.5 4.4 8.4 4.5 C10 4.6 10.8 6.1 12 6.1 C13.2 6.1 14 4.6 15.6 4.5 C17.5 4.4 19.1 5.9 19.7 8.1 C20.5 10.9 19.5 14.3 17.8 17.4 Z";
  function crown(x, y, k, rot){
    var w = 1 / k;
    return '<g transform="translate(' + f(x) + " " + f(y) + ")" + (rot ? " rotate(" + rot + ")" : "") + " scale(" + k + ') translate(-12 -11)">' + FO(CROWN, K.gold, 1.5 * w) +
      F("M15.7 5.3 C17.4 5.5 18.6 6.7 19 8.4 C19.6 11 18.8 14.2 17.4 16.8 L14.9 16.4 C16.6 12.6 17.1 8.8 15.7 5.3 Z", K.goldShade) + ell(12, 17.5, 5.75, 2.3, "#8A6410", 1.3 * w) +
      L("M6.4 9.6 C6.6 7.8 7.2 6.8 8.1 6.3", 1.6 * w, "#FFFFFF", .85) + "</g>";
  }
  /* a scallop shell, hinge down at (x, y), w wide, turned by rot */
  function scallop(x, y, w, c, rot, sw){
    var h = w * .9, s = "", d = "M" + f(-w * .14) + " 0 L" + f(-w * .5) + " " + f(-h * .55) + " Q" + f(-w * .52) + " " + f(-h * 1.02) + " 0 " + f(-h) + " Q" + f(w * .52) + " " + f(-h * 1.02) + " " + f(w * .5) + " " + f(-h * .55) + " L" + f(w * .14) + " 0 Z";
    s += FO(d, c[0], sw || 1);
    for (var i = -2; i <= 2; i++) s += L("M0 " + f(-h * .08) + " L" + f(i * w * .19) + " " + f(-h * .9), Math.max(.5, w * .05), c[1]);
    s += FO("M" + f(-w * .3) + " " + f(h * .06) + " h" + f(w * .6) + " l" + f(-w * .12) + " " + f(-h * .2) + " h" + f(-w * .36) + " z", c[0], (sw || 1) * .8);
    return '<g transform="translate(' + f(x) + " " + f(y) + ")" + (rot ? " rotate(" + rot + ")" : "") + '">' + s + "</g>";
  }
  /* a round brass porthole on a curved wall, in screen space */
  function port(x, y, r, night, squash){
    var k = squash || 1, glass = night ? K.lit : K.glass;
    var s = ell(x, y, (r + 2) * k, r + 2, "#E8BE45", 1.4) + ell(x, y, r * k, r, glass, 1.1), lights = "";
    for (var i = 0; i < 6; i++){ var a = rad(i * 60 + 30); s += circ(x + Math.cos(a) * (r + 1) * k, y + Math.sin(a) * (r + 1), .55, "#9C7414"); }
    if (!night) s += L("M" + f(x - r * .5 * k) + " " + f(y - r * .1) + " q" + f(r * .2) + " " + f(-r * .45) + " " + f(r * .55) + " " + f(-r * .5), 1.1, "#FFFFFF");
    else lights = T.glowAt(x, y, r * 2.2) + ell(x, y, r * k, r, K.lit, 1.1);
    return { s: s, lights: lights };
  }
  var SEAGRASS = ["#5FA35A", "#4A8C4C"], NSEAGRASS = ["#3E7A5A", "#2F6650"];
  function blade(x, y, h, lean, c){ var d = "M" + f(x) + " " + f(y) + " q" + f(lean * .2 - 2) + " " + f(-h * .5) + " " + f(lean * .5) + " " + f(-h * .62) + " q" + f(lean * .5 + 2) + " " + f(-h * .2) + " " + f(lean) + " " + f(-h * .38); return L(d, 3.6) + L(d, 1.8, c); }
  function grass(x, y, k, night){ var c = night ? NSEAGRASS : SEAGRASS; return blade(x - 2.4 * k, y, 13 * k, -5 * k, c[1]) + blade(x, y, 17 * k, 3 * k, c[0]) + blade(x + 2.6 * k, y, 11 * k, 6 * k, c[1]); }

  /* ------------------------------------------------------------------ the home: a conch shell ----------------------- */
  /* drawn as the shell is seen from the front, lying on its side: its axis runs from the siphonal canal, in the sand at
     the front right, up to the spire's tip at the back left. ax(v, w) is a point on screen: v from 0 (the canal's tip) to
     1 (the spire's tip), w across it (plus toward the knobby shoulder on top, minus down the flank that faces you, where
     the door is). The flank swells low down so the round door at x 5.5 sits in it, on the sand. */
  function cr(tab, v){
    var i = 0; while (i < tab.length - 2 && v > tab[i + 1][0]) i++;
    var a = tab[Math.max(0, i - 1)][1], b = tab[i][1], c = tab[i + 1][1], d = tab[Math.min(tab.length - 1, i + 2)][1], t = Math.max(0, Math.min(1, (v - tab[i][0]) / (tab[i + 1][0] - tab[i][0])));
    return .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  }
  var CTOP = [[0, 2], [.08, 9], [.18, 17], [.3, 25], [.42, 30], [.52, 31], [.6, 26], [.66, 21]];
  var CBOT = [[0, 2], [.08, 12], [.18, 27], [.3, 41], [.42, 50], [.5, 52], [.57, 45], [.66, 22]];
  var homes = {
    "conch-house": {
      note: "A giant conch shell lying on its side: a round door with a porthole, round windows, a pink lip and bubbles rising from its vent",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "More portholes, with sea-glass window boxes", porch: "A scallop-shell doorstep and a pot of coral", flag: "A Timmy flag on the spire", paint: "Shell color" },
      door: [5.5, 8.6], brush: [8.75, 7.5], statue: [2.7, 9.2], spots: { door: [6.95, 9.55] }, h: 7.4,
      eaves: [[5.9, 6, 5.2], [8.1, 6, 3.1], 5], foot: [3.4, 3.4, 8.4, 8.6], base: [[4.3, 8.9], [5.5, 8.75], [6.5, 8.15], [7.4, 7.25], [8.2, 6.05], [8.8, 4.75]], block: [2.6, 2.6, 9.1, 9.0],
      draw: function(o){
        var u = o.up, n = o.night, s = "", lights = "", i, pc = o.paint && o.paint !== "cream" && T.PAINTS[o.paint] ? T.PAINTS[o.paint] : null;
        var shell = pc ? pc.c : "#FFF2DF", band = pc ? pc.s : "#FFD0AC", shade = pc ? pc.s : "#E9C4A2", knobC = pc ? pc.c : "#FFF8EE", line = "#C9A27E";
        var lip = ["#FFB9C6", "#F590AA", "#DE6E90", "#FFE1E7"];
        var o0 = P(5.5, 5.5, 0), C = [o0[0] + 40, o0[1] + 12.3], S = [o0[0] - 50, o0[1] - 65.7], len = Math.sqrt(90 * 90 + 78 * 78);
        var A = [(S[0] - C[0]) / len, (S[1] - C[1]) / len], N = [-A[1], A[0]];
        if (N[1] > 0) N = [-N[0], -N[1]];
        var ax = function(v, w){ return [C[0] + A[0] * len * v + N[0] * w, C[1] + A[1] * len * v + N[1] * w]; };
        var top = function(v){ return cr(CTOP, v); }, bot = function(v){ return cr(CBOT, v); };
        /* a ring across the shell at v (the visible half of it bows toward the spire) */
        var across = function(v, k){ var a = ax(v, top(v) * (k || 1)), b = ax(v, -bot(v) * (k || 1)), m = ax(v + .035, (top(v) - bot(v)) * .5 * (k || 1)); return "M" + q2(a) + " Q" + q2(m) + " " + q2(b); };
        /* the flared lip, behind: it rises over the shoulder toward the spire, its glossy pink inside turned to you */
        var lipD = "M" + q2(ax(.28, top(.28) - 3)) + " C" + q2(ax(.36, top(.36) + 12)) + " " + q2(ax(.46, top(.46) + 24)) + " " + q2(ax(.56, top(.56) + 25)) +
          " C" + q2(ax(.62, top(.62) + 24)) + " " + q2(ax(.68, 34)) + " " + q2(ax(.71, 30)) + " C" + q2(ax(.7, 20)) + " " + q2(ax(.67, 16)) + " " + q2(ax(.64, 14)) + " Z";
        s += FO(lipD, lip[0], 1.8);
        s += F("M" + q2(ax(.34, top(.34) + 2)) + " C" + q2(ax(.42, top(.42) + 14)) + " " + q2(ax(.52, top(.52) + 20)) + " " + q2(ax(.6, top(.6) + 19)) + " C" + q2(ax(.64, top(.64) + 15)) + " " + q2(ax(.66, 26)) + " " + q2(ax(.66, 20)) + " L" + q2(ax(.5, 26)) + " Z", lip[1]);
        s += F("M" + q2(ax(.42, top(.42) + 1)) + " C" + q2(ax(.48, top(.48) + 9)) + " " + q2(ax(.56, top(.56) + 12)) + " " + q2(ax(.62, 32)) + " L" + q2(ax(.56, 26)) + " Z", lip[2], .8);
        s += L("M" + q2(ax(.38, top(.38) + 11)) + " C" + q2(ax(.46, top(.46) + 21)) + " " + q2(ax(.54, top(.54) + 23)) + " " + q2(ax(.62, top(.62) + 22)), 2, lip[3], .9);
        if (o.snow) s += F("M" + q2(ax(.36, top(.36) + 11)) + " C" + q2(ax(.46, top(.46) + 25)) + " " + q2(ax(.56, top(.56) + 26)) + " " + q2(ax(.66, top(.66) + 22)) + " L" + q2(ax(.64, top(.64) + 18)) + " C" + q2(ax(.56, top(.56) + 20)) + " " + q2(ax(.46, top(.46) + 18)) + " " + q2(ax(.38, top(.38) + 7)) + " Z", "#FFFFFF");
        /* the spire: whorls from the tip down, each one over the one above it, a suture between them and knobs on top */
        var VS = [.6, .7, .78, .85, .91, .96, 1], sr = function(v){ return 25 * Math.pow(Math.max(0, 1 - v) / .4, .95); };
        var tipP = ax(1, 0), tw = VS[VS.length - 2], tr = sr(tw);
        s += FO("M" + q2(ax(tw, tr)) + " L" + q2(tipP) + " L" + q2(ax(tw, -tr)) + " Q" + q2(ax(tw - .02, 0)) + " " + q2(ax(tw, tr)) + " Z", shell, 1.4);
        for (i = VS.length - 3; i >= 0; i--){
          var va = VS[i], vb = VS[i + 1], ra = sr(va), rb = sr(vb) * 1.04, vm = (va + vb) / 2, rm = (ra + rb) / 2 + 2.4;
          var d = "M" + q2(ax(vb, rb)) + " Q" + q2(ax(vm, rm + 1.4)) + " " + q2(ax(va, ra)) + " L" + q2(ax(va, -ra)) + " Q" + q2(ax(vm, -rm - 1.4)) + " " + q2(ax(vb, -rb)) + " Q" + q2(ax(vb + .045, 0)) + " " + q2(ax(vb, rb)) + " Z";
          s += F(d, i % 2 ? shell : (pc ? pc.c : "#FFE6CF"));
          s += F("M" + q2(ax(vb, -rb * .35)) + " Q" + q2(ax(vb + .02, -rb * .7)) + " " + q2(ax(vb, -rb)) + " Q" + q2(ax(vm, -rm - 1.4)) + " " + q2(ax(va, -ra)) + " L" + q2(ax(va, -ra * .45)) + " Z", shade, .7);
          s += O(d, 1.4);
          var kp = ax(vm, rm + .6), kw = Math.max(1.8, ra * .16);
          s += FO("M" + q2(ax(vm + .025, rm - .6)) + " Q" + q2([kp[0] + N[0] * kw * 2.4, kp[1] + N[1] * kw * 2.4]) + " " + q2(ax(vm - .025, rm - .6)) + " Z", knobC, 1.1);
          if (o.snow) s += F("M" + q2(ax(vb, rb)) + " Q" + q2(ax(vm, rm + 2.4)) + " " + q2(ax(va, ra + .6)) + " L" + q2(ax(va, ra - 2.6)) + " Q" + q2(ax(vm, rm - 2)) + " " + q2(ax(vb, rb - 2)) + " Z", "#FFFFFF");
        }
        /* the attic porthole in the spire */
        var aw = ax(.74, -2.4), pa = port(aw[0], aw[1], 3, n, .85); s += pa.s; lights += pa.lights;
        /* the tip: the flag, or a little gold tooth on a spike */
        var O0 = P(0, 0, 0), ty = 5.0, tx = ty + (tipP[0] - O0[0]) / (T.U * .8660254), tz = (O0[1] + (tx + ty) * .5 * T.U - tipP[1]) / T.U;
        if (u.flag) s += T.flagOn(tx, ty, tz - .1, 2.0);
        else s += L("M" + q2(tipP) + " l-1.6 -6", 1.4) + T.tinyTooth(tipP[0] - 2.4, tipP[1] - 10, .5, K.gold);
        /* the body whorl */
        var outline = [], vend = .66;
        for (i = 0; i <= 33; i++){ var v = vend * i / 33; outline.push(ax(v, top(v))); }
        for (i = 33; i >= 0; i--){ v = vend * i / 33; outline.push(ax(v, -bot(v))); }
        s += F(D2(outline), shell);
        /* bands of color round it, and the growth lines */
        var bandD = function(v0, v1){ var pts = []; for (var j = 0; j <= 8; j++){ var vv = v0 + (v1 - v0) * j / 8; pts.push(ax(vv + .03, top(vv) * .98)); } return pts; };
        [[.12, .17], [.3, .37]].forEach(function(b){
          var a0 = b[0], a1 = b[1], pts = [ax(a0, top(a0)), ax(a0 + .035, (top(a0) - bot(a0)) * .5), ax(a0, -bot(a0)), ax(a1, -bot(a1)), ax(a1 + .035, (top(a1) - bot(a1)) * .5), ax(a1, top(a1))];
          s += F("M" + q2(pts[0]) + " Q" + q2(pts[1]) + " " + q2(pts[2]) + " L" + q2(pts[3]) + " Q" + q2(pts[4]) + " " + q2(pts[5]) + " Z", band, pc ? .75 : 1);
        });
        [.06, .22, .44, .54].forEach(function(v){ s += L(across(v), .9, line, .6); });
        /* the shade toward the sand and round the canal, and the light along the top */
        var sh = []; for (i = 0; i <= 20; i++){ v = .62 * i / 20; sh.push(ax(v, -bot(v))); }
        for (i = 20; i >= 0; i--){ v = .62 * i / 20; sh.push(ax(v, -bot(v) * (.72 + .2 * (1 - v / .62)) + 2)); }
        s += F(D2(sh), shade, .75);
        s += O(D2(outline));
        s += L("M" + q2(ax(.2, top(.2) - 4)) + " Q" + q2(ax(.36, top(.36) - 4)) + " " + q2(ax(.5, top(.5) - 5)), 2.4, "#FFFFFF", .65);
        /* the knobs along the shoulder */
        var knob = function(v, k){ var b0 = ax(v - .028 * k, top(v - .028 * k) - 1.6), b1 = ax(v + .028 * k, top(v + .028 * k) - 1.6), tp = ax(v + .006, top(v) + 10 * k);
          return FO("M" + q2(b0) + " Q" + q2(ax(v - .018 * k, top(v) + 7 * k)) + " " + q2(tp) + " Q" + q2(ax(v + .022 * k, top(v) + 6 * k)) + " " + q2(b1) + " Z", knobC, 1.3) + (o.snow ? F("M" + q2(ax(v - .012 * k, top(v) + 6 * k)) + " Q" + q2(tp) + " " + q2(ax(v + .014 * k, top(v) + 5.4 * k)) + " Z", "#FFFFFF") : ""); };
        [[.16, .6], [.23, .75], [.31, .95], [.39, 1.05], [.47, 1.1], [.55, 1]].forEach(function(q){ s += knob(q[0], q[1]); });
        if (o.snow) s += F("M" + q2(ax(.1, top(.1) - .5)) + " Q" + q2(ax(.34, top(.34) + 3)) + " " + q2(ax(.62, top(.62) + 1)) + " L" + q2(ax(.62, top(.62) - 4)) + " Q" + q2(ax(.34, top(.34) - 3)) + " " + q2(ax(.1, top(.1) - 3)) + " Z", "#FFFFFF");
        /* the bubble vent: a brass pipe on its back, bubbles rising like chimney smoke */
        var vt = ax(.13, top(.13) - 2);
        s += L("M" + f(vt[0]) + " " + f(vt[1]) + " v-12 q0 -3 3 -3 h2", 5.6) + L("M" + f(vt[0]) + " " + f(vt[1]) + " v-12 q0 -3 3 -3 h2", 3, "#E8BE45") + ell(vt[0], vt[1], 4, 1.8, "#C9971C", 1.1) + FO("M" + f(vt[0] + 4.4) + " " + f(vt[1] - 18.4) + " h2.6 v4.4 h-2.6 z", "#C9971C", 1);
        s += bubbles([[vt[0] + 9, vt[1] - 22, 2.2], [vt[0] + 12, vt[1] - 32, 2.8], [vt[0] + 9, vt[1] - 43, 3.4]], n);
        /* portholes along the flank */
        [[ax(.6, -9), 5, .9], [ax(.32, -12), 4.8, .9]].concat(u.windows ? [[ax(.2, -12), 3.8, .9], [ax(.47, -2), 4, .9]] : []).forEach(function(w){
          var pw = port(w[0][0], w[0][1], w[1], n, w[2]); s += pw.s; lights += pw.lights;
          if (u.windows){ var bx = w[0][0], by = w[0][1] + w[1] + 3.4, bw = w[1] * 1.5;
            s += FO("M" + f(bx - bw) + " " + f(by) + " h" + f(2 * bw) + " l-1.2 3 h" + f(-2 * bw + 2.4) + " z", "#7FD0C8", 1.1) + L("M" + f(bx - bw * .6) + " " + f(by) + " q-1 -4 -3 -5 M" + f(bx) + " " + f(by) + " q1 -5 0 -7 M" + f(bx + bw * .6) + " " + f(by) + " q1 -4 3 -5", 1.3, n ? "#3E7A5A" : "#5FA35A") +
              circ(bx - bw * .3, by - 1.6, 1.2, "#F58FA8", .6) + circ(bx + bw * .35, by - 2, 1.2, "#FFD23F", .6); }
        });
        /* the round door: a teal door in a brass ring, a porthole in it, a little tooth over it */
        var Yd = 8.6, zc = 1.2, dRing = function(r, z){ var out = []; for (var j = 0; j < 24; j++){ var th = j / 24 * Math.PI * 2; out.push([5.5 + Math.cos(th) * r, Yd, (z || zc) + Math.sin(th) * r]); } return out; };
        s += FO(D(dRing(1.18)), "#E8BE45", 1.6) + FO(D(dRing(.96)), "#2FA8A8", 1.3);
        s += L(D([[5.15, Yd, .3], [5.15, Yd, 2.08]], true) + D([[5.85, Yd, .3], [5.85, Yd, 2.08]], true), .9, "#1F7F80");
        s += FO(D(dRing(.38, 1.5)), "#E8BE45", 1.1) + FO(D(dRing(.27, 1.5)), n ? K.lit : K.glassDay, .9);
        if (n){ var dc = P(5.5, Yd, 1.5); lights += T.glowAt(dc[0], dc[1], 8) + FO(D(dRing(.27, 1.5)), K.lit, .9); }
        var kn = P(6.17, Yd, 1.05); s += circ(kn[0], kn[1], 1.5, K.gold, .9);
        var sg = P(5.5, Yd, 2.66); s += T.tinyTooth(sg[0], sg[1], .62, "#FFFFFF");
        /* the doorstep: a flat stone, or a scallop shell with the porch */
        var ds = P(5.62, 9.0, 0);
        if (u.porch){
          s += '<g transform="translate(' + f(ds[0]) + " " + f(ds[1] - 2) + ') scale(1 .5)">' + scallop(0, 8, 21, ["#FFC9A8", "#E89A7A"], 180, 1.8) + "</g>";
          var pp = P(4.35, 9.05, 0);
          s += FO("M" + f(pp[0] - 4.4) + " " + f(pp[1] - 8) + " h8.8 l-1.4 8 q-3 1.2 -6 0 z", "#E07A5F", 1.2) + F("M" + f(pp[0] + 1.2) + " " + f(pp[1] - 8) + " h3.2 l-1.4 8 q-1 .4 -2 .2 z", "#B8553D") + ell(pp[0], pp[1] - 8, 4.4, 1.4, "#8A5A3A", 1);
          s += tube("M" + f(pp[0]) + " " + f(pp[1] - 8.4) + " v-6 M" + f(pp[0]) + " " + f(pp[1] - 12) + " l-4 -4 M" + f(pp[0]) + " " + f(pp[1] - 13) + " l3.4 -5", 1.8, "#F48BB0");
        } else s += ell(ds[0], ds[1], 9, 3.2, K.stone, 1.2) + ell(ds[0] + 1.4, ds[1] + .8, 5.4, 1.6, K.stoneShade, 0, .7);
        /* sea grass along its foot, and a small shell */
        if (!o.snow){
          [[4.5, 8.9, .9], [6.8, 8.05, .8], [7.6, 7.1, 1.1], [8.35, 5.9, .9], [8.95, 4.95, .7]].forEach(function(g){ var q = P(g[0] + .2, g[1] + .2, 0); s += grass(q[0], q[1], g[2], n); });
          var sh1 = P(7.25, 8.0, 0); s += scallop(sh1[0], sh1[1] + 1, 5.4, ["#FFC9D4", "#E58FA6"], -12, .8);
        }
        if (n) lights += T.firefly(o0[0] - 62, o0[1] - 40, .3) + T.firefly(o0[0] + 52, o0[1] - 70, 1.4);
        return { body: s, lights: lights };
      }
    }
  };
  /* ------------------------------------------------------------------ the scene: a sunlit reef --------------------- */
  /* the sea's surface seen from below, a light strip with a wavy edge */
  function surface(col){ var d = "M0 -80 H400 V13"; for (var x = 400; x > 0; x -= 25) d += " Q" + (x - 12.5) + " " + (x % 50 ? 18 : 8) + " " + (x - 25) + " 13"; return F(d + " Z", col); }
  function jelly(x, y, k, c){
    var w = 7 * k, bell = "M" + f(x - w) + " " + f(y) + " Q" + f(x - w) + " " + f(y - 9 * k) + " " + f(x) + " " + f(y - 9 * k) + " Q" + f(x + w) + " " + f(y - 9 * k) + " " + f(x + w) + " " + f(y);
    for (var i = 0; i < 4; i++) bell += " q" + f(-w / 4) + " " + f(2.2 * k) + " " + f(-w / 2) + " 0";
    var s = op(circ(x, y - 3 * k, 15 * k, c[0], 0), .22) + L("M" + f(x - 4 * k) + " " + f(y + 1) + " q-2 5 0 10 q2 5 0 10 M" + f(x) + " " + f(y + 1) + " q2 6 0 12 q-2 6 0 12 M" + f(x + 4 * k) + " " + f(y + 1) + " q2 5 0 9 q-2 5 0 9", 1, c[1], .85);
    s += F(bell + " Z", c[0], .88) + O(bell + " Z", .9) + L("M" + f(x - w * .55) + " " + f(y - 5 * k) + " q" + f(w * .3) + " " + f(-3 * k) + " " + f(w * .7) + " " + f(-3.4 * k), 1.2, "#FFFFFF", .7);
    return G("tp-float", s);
  }
  function kelp(x, y, h, sway, c, seed){
    var R = T.rng(seed), pts = chain([[x, y], [x + sway, y - h * .3], [x - sway, y - h * .66], [x + sway * .4, y - h]], 14), s = tube(D2(pts, true), 2, c[1]);
    for (var i = 2; i < pts.length - 1; i += 2){ var q = pts[i], side = i % 4 ? 1 : -1, bl = 7 + R() * 4;
      s += FO("M" + q2(q) + " q" + f(side * bl * .5) + " " + f(-bl * .6) + " " + f(side * bl) + " " + f(-bl * .3) + " q" + f(-side * bl * .4) + " " + f(bl * .5) + " " + f(-side * bl) + " " + f(bl * .3) + " z", c[0], .9); }
    return G("tp-fronds", s);
  }
  function turtle(x, y, n){
    var sh = n ? ["#3E6A5C", "#2E5448"] : ["#8DB078", "#6A9058"], sk = n ? "#5E8A74" : "#C3D69A";
    var s = FO("M" + f(x - 9) + " " + f(y - 2) + " q-7 -7 -12 -4 q4 4 10 6 z M" + f(x + 6) + " " + f(y + 2) + " q6 6 11 4 q-3 -4 -9 -6 z", sk, .9);
    s += FO("M" + f(x - 9) + " " + f(y + 3) + " q-6 5 -9 9 q5 0 10 -6 z M" + f(x + 8) + " " + f(y - 3) + " q6 -3 9 -2 q-3 3 -8 4 z", sk, .9);
    s += circ(x - 15, y - 1, 3.4, sk, .9) + circ(x - 16.4, y - 1.8, .6, INK);
    s += ell(x, y, 12, 6.4, sh[0], 1.1) + L("M" + f(x - 6) + " " + f(y - 5) + " l2 4.4 -2 4.4 M" + f(x) + " " + f(y - 6.2) + " v12.4 M" + f(x + 6) + " " + f(y - 5) + " l-2 4.4 2 4.4 M" + f(x - 4) + " " + f(y - .6) + " h8", .9, sh[1]);
    return G("tp-float", s);
  }
  var SAND = ["#F6E5B8", "#EEDAA6", "#E0C590", "#C7A873"], NSAND = ["#8C9EA6", "#7F939A", "#71858D", "#5B6E77"], SNOW = ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"];
  /* a reef head on the slopes: brain coral, staghorn, a sea fan, a kelp clump, an anemone on a rock */
  function brain(x, y, k, n){ var c = n ? ["#9C8A6A", "#7A6A50"] : ["#EDC46E", "#C9993E"], d = T.lumps(x, y - 6 * k, 9 * k, 7, 9, .7);
    return F(d, c[0]) + F(T.lumps(x + 2 * k, y - 4.6 * k, 6.4 * k, 9, 7, .6), c[1], .45) + O(d, 1.3) + L("M" + f(x - 6 * k) + " " + f(y - 7 * k) + " q2 -3 4 0 q2 3 4 0 q2 -3 4 0 M" + f(x - 5 * k) + " " + f(y - 3.4 * k) + " q2 -3 4 0 q2 3 4 0", .9, c[1]); }
  function staghorn(x, y, k, c){ return tube("M" + f(x) + " " + f(y) + " q-1 " + f(-6 * k) + " " + f(-5 * k) + " " + f(-11 * k) + " M" + f(x) + " " + f(y - 3 * k) + " q3 " + f(-5 * k) + " " + f(6 * k) + " " + f(-12 * k) + " M" + f(x - 2.6 * k) + " " + f(y - 7 * k) + " l" + f(-1 * k) + " " + f(-7 * k) + " M" + f(x + 3 * k) + " " + f(y - 8 * k) + " l" + f(4 * k) + " " + f(-3 * k), 2.6 * k, c); }
  function seafan(x, y, k, c){ var d = "M" + f(x) + " " + f(y) + " C" + f(x - 12 * k) + " " + f(y - 4 * k) + " " + f(x - 15 * k) + " " + f(y - 20 * k) + " " + f(x - 6 * k) + " " + f(y - 24 * k) + " C" + f(x) + " " + f(y - 27 * k) + " " + f(x + 9 * k) + " " + f(y - 25 * k) + " " + f(x + 12 * k) + " " + f(y - 17 * k) + " C" + f(x + 14 * k) + " " + f(y - 8 * k) + " " + f(x + 7 * k) + " " + f(y - 2 * k) + " " + f(x) + " " + f(y) + " Z";
    var s = FO(d, c[0], 1.2); for (var i = -2; i <= 2; i++) s += L("M" + f(x) + " " + f(y) + " L" + f(x + i * 5 * k) + " " + f(y - 22 * k), .8, c[1]);
    return s + L("M" + f(x - 10 * k) + " " + f(y - 9 * k) + " q" + f(10 * k) + " " + f(-3 * k) + " " + f(20 * k) + " 0 M" + f(x - 9 * k) + " " + f(y - 17 * k) + " q" + f(9 * k) + " " + f(-3 * k) + " " + f(18 * k) + " 0", .7, c[1]) + L("M" + f(x - 1.4) + " " + f(y + 1) + " h2.8", 1.6); }
  function anemone(x, y, k, c){ var s = FO("M" + f(x - 9 * k) + " " + f(y) + " q-1 " + f(-6 * k) + " " + f(4 * k) + " " + f(-7 * k) + " q" + f(8 * k) + " " + f(-1 * k) + " " + f(13 * k) + " " + f(3 * k) + " q1 " + f(3 * k) + " -2 " + f(4 * k) + " z", c[2], 1.2);
    for (var i = 0; i < 7; i++){ var a = -150 + i * 20, bx = x - 4 * k + i * 1.4 * k, by = y - 6 * k; s += tube("M" + f(bx) + " " + f(by) + " q" + f(Math.cos(rad(a)) * 3 * k) + " " + f(-4 * k) + " " + f(Math.cos(rad(a)) * 5 * k) + " " + f(-7 * k), 1.6 * k, c[i % 2]); }
    return s; }

  var scenes = {
    "sunlit-reef": T.hillScene({
      note: "The sunlit seafloor: rippled sand, coral heads and kelp, a turtle far off and light slanting down from the surface",
      path: "stones", treeKind: "crystal", lamp: "lantern", skirt: "sand", grade: ["#3FC4D8", .07],
      ground: function(o){ return o.snow ? SNOW : o.night ? NSAND : SAND; },
      sky: function(o){
        var s;
        if (o.night){
          s = T.bands(["#0F2C56", "#133565", "#183F73", "#1D4881"], 0, 300) + surface("#2A5A92") + G("tp-water", L("M64 22 q5 -2.4 10 0 q5 2.4 10 0 M150 28 q5 -2.4 10 0 M222 20 q5 -2.4 10 0 q5 2.4 10 0 M334 26 q5 -2.4 10 0", 1.2, "#8FB8E6", .5));
          /* moonlight from above the surface: a soft glow and a faint shaft */
          s += F("M286 10 L314 10 L270 160 L236 160 Z", "#CFE2FF", .07) + op(circ(300, 30, 34, "#FFF3C4", 0), .08) + op(circ(300, 30, 22, "#FFF3C4", 0), .14) + T.moon(300, 30);
          s += jelly(80, 52, 1, ["#F5B8E6", "#F9D3F0"]) + jelly(228, 28, .8, ["#B9C8FF", "#D9E1FF"]) + jelly(122, 70, .85, ["#F5B8E6", "#F9D3F0"]);
          var R = T.rng(41); for (var i = 0; i < 22; i++) s += '<circle class="tp-twinkle" cx="' + f(56 + R() * 290) + '" cy="' + f(16 + R() * 96) + '" r="' + (i % 3 ? .8 : 1.3) + '" fill="#C9FFF4" style="animation-delay:' + f(i * .37 % 3) + 's"/>';
          return s;
        }
        s = T.bands(["#A9E7EE", "#94DDE8", "#80D1E2", "#6EC5DA"], 0, 300) + surface("#D2F5F5") + G("tp-water", L("M64 22 q5 -2.4 10 0 q5 2.4 10 0 M150 28 q5 -2.4 10 0 M222 20 q5 -2.4 10 0 q5 2.4 10 0 M334 26 q5 -2.4 10 0 M270 34 q4 -2 8 0", 1.3, "#FFFFFF", .85));
        /* light rays slanting down from the surface */
        [[60, 74, 112, 134], [126, 142, 180, 212], [162, 172, 222, 246], [212, 230, 272, 302], [262, 272, 320, 340]].forEach(function(r){ s += F("M" + r[0] + " 12 L" + r[1] + " 12 L" + r[3] + " 160 L" + r[2] + " 160 Z", "#FFFFFF", .17); });
        s += op(circ(104, 34, 27, "#FFF7CC", 0), .45) + T.sun(104, 34);
        return s;
      },
      far: function(o){
        var n = o.night, s = "", R = T.rng(57), x;
        var hz = n ? ["#1E4A72", "#1A4266", "#2A5880"] : ["#8BCFD4", "#77C1C9", "#62B2BE"];
        /* the far reef: a ridge of coral heads, taller toward the sides where the hill lets you see it */
        var base = function(xx){ return 136 - 20 * Math.pow(Math.abs(xx - 200) / 200, 1.2); };
        var d = "M0 300 V" + f(base(0)), d2 = "";
        for (x = 0; x < 400;){ var w = 12 + R() * 14, h = 6 + R() * 12, x2 = Math.min(400, x + w); d += " C" + f(x) + " " + f(base(x) - h) + " " + f(x2) + " " + f(base(x2) - h) + " " + f(x2) + " " + f(base(x2)); x = x2; }
        s += F(d + " V300 Z", hz[0]) + L(d.replace(/^M0 300 V/, "M0 "), 1.2, INK, .35);
        /* coral shapes on the ridge: branching heads, fans and sponges, hazy with distance */
        var tint = n ? ["#2C5C86", "#335E8A", "#3A5F86"] : ["#C9B6D6", "#D9C0A8", "#A9C9D9"];
        [[60, 0], [76, 2], [92, 1], [112, 0], [292, 1], [310, 0], [328, 2], [346, 1]].forEach(function(q, i){
          var bx = q[0], by = base(bx) + 2, c = tint[q[1]];
          if (i % 3 === 0) s += tube("M" + bx + " " + f(by) + " q-1 -8 -6 -13 M" + bx + " " + f(by - 4) + " q3 -6 7 -12 M" + f(bx - 3) + " " + f(by - 9) + " v-7", 2.4, c).replace(/stroke="#[0-9A-Fa-f]{6}" stroke-width="4.8"/, 'stroke="' + INK + '" stroke-width="4.8" opacity=".35"');
          else if (i % 3 === 1) s += F("M" + bx + " " + f(by) + " C" + f(bx - 10) + " " + f(by - 4) + " " + f(bx - 12) + " " + f(by - 18) + " " + f(bx - 4) + " " + f(by - 20) + " C" + f(bx + 4) + " " + f(by - 22) + " " + f(bx + 11) + " " + f(by - 14) + " " + f(bx + 9) + " " + f(by - 6) + " Z", c);
          else s += F("M" + f(bx - 6) + " " + f(by) + " v-12 q2 -2 4 0 v12 z M" + f(bx - 1) + " " + f(by) + " v-17 q2 -2 4 0 v17 z M" + f(bx + 4) + " " + f(by) + " v-9 q2 -2 4 0 v9 z", c);
        });
        /* kelp at both edges, swaying */
        var kc = n ? ["#2E5E4E", "#24503F"] : ["#86B86A", "#5E9444"];
        s += kelp(58, 152, 118, 6, kc, 3) + kelp(70, 150, 96, -5, kc, 5) + kelp(336, 150, 112, 5, kc, 7) + kelp(348, 152, 90, -6, kc, 9);
        /* a sea turtle far off, a school of fish by day, bubbles rising */
        s += turtle(298, 98, n);
        if (!n){ var sc = ""; [[246, 52], [256, 47], [258, 57], [268, 51], [270, 61], [280, 45], [281, 56], [290, 50], [292, 62], [302, 54], [266, 40]].forEach(function(q, i){ sc += fish(q[0], q[1], .55, -1, "#EEF9FB", i % 2 ? "#9FD0DC" : "#F2C94C"); }); s += G("tp-float", sc); }
        s += bubbles([[94, 120, 1.8], [97, 108, 2.4], [93, 96, 3]], n) + bubbles([[272, 124, 1.6], [275, 113, 2.2], [271, 102, 2.8]], n);
        return s;
      },
      landExtra: function(o){
        if (o.snow) return "";
        var c = o.night ? NSAND[3] : SAND[3];
        return L("M44 212 q8 -3 16 0 q8 3 16 0 q8 -3 16 0 M66 232 q8 -3 16 0 q8 3 16 0 q8 -3 16 0 q8 3 16 0 M92 252 q8 -3 16 0 q8 3 16 0 q8 -3 16 0 M248 246 q8 -3 16 0 q8 3 16 0 q8 -3 16 0 q8 3 16 0 M296 222 q8 -3 16 0 q8 3 16 0 q8 -3 16 0 M318 200 q8 -3 16 0 q8 3 16 0", 1.2, c, .55);
      },
      flat: function(o, on){
        var n = o.night, sn = o.snow, rc = n ? "#6A7E86" : "#D6BB84", s = "";
        if (!sn) s += T.scatter(301, 34, on, function(sx, sy){ return L("M" + f(sx - 5) + " " + f(sy) + " q2.5 -1.6 5 0 q2.5 1.6 5 0", 1.1, rc); }).join("");
        s += T.scatter(302, 10, on, function(sx, sy, i){
          if (i % 3 === 0) return starfish(sx, sy - 1, 3.2, i * 23, n ? "#B07A6A" : ["#F59A3A", "#F27A8A"][i % 2], null, .7);
          if (i % 3 === 1) return scallop(sx, sy + 1, 5, n ? ["#B8A8B0", "#8E7E88"] : ["#FFD9C2", "#E8A98A"], i * 9 - 20, .7);
          return ell(sx, sy, 2.4, 1.5, n ? "#7A8A90" : "#D9D2C4", .7) + ell(sx + 3, sy + 1, 1.4, 1, n ? "#7A8A90" : "#C9C1B4", .6);
        }).join("");
        if (!sn) s += T.scatter(303, 10, on, function(sx, sy, i){ return grass(sx, sy, .55 + (i % 3) * .12, n); }).join("");
        return s;
      },
      props: function(o, on){
        var n = o.night;
        return T.scatter(304, 9, on, function(sx, sy, i, R, x, y){
          var s, k = .9 + R() * .3;
          if (i % 5 === 0) s = brain(sx, sy, k, n);
          else if (i % 5 === 1) s = staghorn(sx, sy, k, n ? "#9A6A86" : "#F48BB0") + staghorn(sx + 7, sy + 2, k * .7, n ? "#9A6A86" : "#F7A9C4");
          else if (i % 5 === 2) s = seafan(sx, sy, k * .8, n ? ["#5E5090", "#43386E"] : ["#A57EDB", "#7E58B8"]);
          else if (i % 5 === 3) s = kelp(sx, sy, 34 * k, 3, n ? ["#2E5E4E", "#24503F"] : ["#7DB35A", "#557F3C"], 20 + i) + kelp(sx + 5, sy + 1, 24 * k, -3, n ? ["#2E5E4E", "#24503F"] : ["#7DB35A", "#557F3C"], 30 + i);
          else s = FO("M" + f(sx - 9) + " " + f(sy) + " q1 -7 8 -7 q8 0 10 7 z", n ? "#6E7A84" : "#B9B2A6", 1.2) + anemone(sx, sy - 5, .8 * k, n ? ["#9A6A96", "#B888B0", "#6E7A84"] : ["#F7A6C8", "#FFD0E0", "#B9B2A6"]);
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var yard = {
    "coral-garden": {
      note: "Branching coral, brain coral and a sea fan in pink, orange and purple, with a few small fish", spot: [3.35, 3.4],
      egg: { n: "The coral garden", does: "the fish dart round it", say: "Look at them go! A parrotfish bites coral with teeth fused into a beak." }, anim: "tp-cow 2.4s ease-in-out",
      draw: function(o){
        var n = o.night, c = P(1.8, 1.8, 0), cx = c[0], cy = c[1], s = ell(cx + 1, cy + 2, 30, 11, "#1B2A3A", 0, .1);
        /* a rock to grow on */
        var rk = T.lumps(cx, cy - 1, 23, 5, 10, .42);
        s += F(rk, n ? "#7E868C" : "#CBBFA8") + F(T.lumps(cx + 6, cy + 1, 15, 8, 8, .4), n ? "#666E74" : "#A99C86", .6) + O(rk, 1.5);
        /* back: a purple sea fan and orange tube coral */
        s += seafan(cx + 11, cy - 4, 1.25, n ? ["#5E5090", "#43386E"] : ["#A57EDB", "#7E58B8"]);
        var tc = n ? ["#A0704E", "#7E5236", "#5A3A26"] : ["#F59A45", "#D9772B", "#9C4A1C"];
        [[-17, -2, 15], [-11, 0, 21], [-5, 1, 12]].forEach(function(q){ var x = cx + q[0], y = cy + q[1];
          s += FO("M" + f(x - 3) + " " + f(y) + " v" + f(-q[2]) + " h6 v" + f(q[2]) + " z", tc[0], 1.2) + F("M" + f(x + 1) + " " + f(y) + " v" + f(-q[2]) + " h2 v" + f(q[2]) + " z", tc[1]) + ell(x, y - q[2], 3, 1.4, tc[2], 1.1); });
        /* middle: pink branching coral */
        var pk = n ? "#A06A8A" : "#F48BB0", px = cx - 1, py = cy + 4;
        s += tube("M" + f(px) + " " + f(py) + " q-1 -9 -9 -16 M" + f(px) + " " + f(py - 4) + " q2 -10 9 -18 M" + f(px - 5) + " " + f(py - 10) + " q-2 -6 -1 -12 M" + f(px + 5) + " " + f(py - 13) + " q4 -2 7 -6 M" + f(px + 1) + " " + f(py - 6) + " q0 -10 -2 -20", 3.4, pk);
        [[px - 9, py - 16], [px + 9, py - 22], [px - 6, py - 22], [px + 12, py - 19], [px - 1, py - 26]].forEach(function(q){ s += circ(q[0], q[1], 1.6, n ? "#C08AA8" : "#FFC2D8"); });
        /* front: an orange brain coral and a purple cup coral */
        var bc = n ? ["#A0785A", "#7E5A40"] : ["#F7B067", "#D9853B"], bx = cx - 9, by = cy + 9, bd = "M" + f(bx - 11) + " " + f(by) + " Q" + f(bx - 11) + " " + f(by - 13) + " " + f(bx) + " " + f(by - 13) + " Q" + f(bx + 11) + " " + f(by - 13) + " " + f(bx + 11) + " " + f(by) + " Q" + f(bx) + " " + f(by + 4) + " " + f(bx - 11) + " " + f(by) + " Z";
        s += F(bd, bc[0]) + F("M" + f(bx + 3) + " " + f(by - 12.6) + " Q" + f(bx + 11) + " " + f(by - 12) + " " + f(bx + 11) + " " + f(by) + " Q" + f(bx + 6) + " " + f(by + 2.6) + " " + f(bx + 1) + " " + f(by + 2.4) + " Q" + f(bx + 8) + " " + f(by - 6) + " " + f(bx + 3) + " " + f(by - 12.6) + " Z", bc[1], .55) + O(bd, 1.5);
        s += L("M" + f(bx - 8) + " " + f(by - 3) + " q2 -4 4 0 q2 4 4 0 q2 -4 4 0 q2 4 4 0 M" + f(bx - 6) + " " + f(by - 8) + " q2 -3 4 0 q2 3 4 0 q2 -3 4 0 M" + f(bx - 3) + " " + f(by - 11.4) + " q1.5 -1.6 3 0 q1.5 1.6 3 0", 1, bc[1]);
        var cu = n ? ["#6E5A9A", "#4E3E7A"] : ["#B98CEB", "#8A5CC8"];
        [[cx + 12, cy + 8], [cx + 18, cy + 4], [cx + 6, cy + 11]].forEach(function(q, i){ var r = 3.4 - i * .4; s += FO("M" + f(q[0] - r) + " " + f(q[1] - 5) + " L" + f(q[0] - r * .6) + " " + f(q[1]) + " h" + f(r * 1.2) + " L" + f(q[0] + r) + " " + f(q[1] - 5) + " z", cu[0], 1) + ell(q[0], q[1] - 5, r, r * .45, cu[1], 1); });
        /* a few small fish */
        s += G("tp-float", fish(cx - 20, cy - 30, 1, 1, n ? "#B9A85A" : "#FFD23F", n ? "#8A7A3A" : "#F59A3A") + fish(cx + 22, cy - 38, .9, -1, n ? "#4A7AA8" : "#4FA9E8", "#FFFFFF") + fish(cx + 4, cy - 44, .7, 1, n ? "#7E6AA0" : "#B98CEB", n ? "#B9A85A" : "#FFD23F"));
        if (o.snow) s += ell(cx - 9, cy - 3, 7, 2, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var c = P(1.8, 1.8, 0), cx = c[0], cy = c[1];
        return fish(cx - 6, cy - 24, 1.1, 1, "#FFD23F", "#F59A3A") + fish(cx + 4, cy - 34, 1, 1, "#4FA9E8", "#FFFFFF") + fish(cx - 14, cy - 40, .9, 1, "#F48BB0", "#FFFFFF") + fish(cx + 14, cy - 20, .8, 1, "#7FE3C4", "#3FA7E0") +
          circ(cx + 18, cy - 46, 1.6, "#EAFBFD", .6) + circ(cx + 22, cy - 52, 2.2, "#EAFBFD", .7);
      }
    },
    "giant-clam": {
      note: "A big ridged clam resting on the sand, a little blue mantle showing between its shells", spot: [3.35, 3.45],
      egg: { n: "The giant clam", does: "it opens: a pearl shaped like a tiny tooth", say: "A pearl shaped like a tooth! Pearls grow in layers. So did your enamel." }, anim: "tp-pop 2.6s",
      draw: function(o){ return clam(o, false); },
      bits: function(o){ return clam(o || {}, true); }
    },
    "sunken-chest": {
      note: "A barnacled treasure chest half sunk in the sand, spilling Shiny Gold Crowns and pearls, an anchor beside it", spot: [3.4, 3.4],
      egg: { n: "The sunken chest", does: "the lid creaks open; bubbles and glints rise", say: "Shiny Gold Crowns! Real crowns go on teeth. These go in my wallet." }, anim: "tp-pop 2.6s",
      draw: function(o){ return chest(o, false); },
      lights: function(){ var g = P(1.7, 2.45, .95); return T.glowAt(g[0], g[1], 12); },
      bits: function(o){ return chest(o || {}, true); }
    }
  };
  /* the giant clam, closed (bits false) or open with its pearl (bits true) */
  function clam(o, open){
    var n = o.night, c = P(1.8, 1.9, 0), cx = c[0], cy = c[1] - 4, s = "", i;
    var sh = n ? ["#B9B4AC", "#9C968C", "#7E786E"] : ["#F6F1E4", "#E2D9C4", "#C9BEA6"], mant = n ? ["#2C7A86", "#5AA8B0", "#3A5A9A"] : ["#2FB5B0", "#9BF0E0", "#2F7FD0"];
    var H = [cx, cy - 22], edge = function(a, k){ return [cx + Math.cos(rad(a)) * 31 * k, cy + Math.sin(rad(a)) * 14 * k]; };
    /* the upper valve's outline: the hump over the hinge, then the scalloped front edge (five folds) */
    var crestA = [162, 126, 90, 54, 18], valA = [180, 144, 108, 72, 36, 0];
    var hump = chain([edge(180, 1), [cx - 30, cy - 14], [cx - 18, cy - 26], H, [cx + 18, cy - 26], [cx + 30, cy - 14], edge(0, 1)], 10);
    var front = [edge(0, 1)];
    for (i = 4; i >= 0; i--) front = front.concat(bz(edge(valA[i + 1], .97), edge(valA[i + 1] + 8, 1.12), edge(crestA[i] + 10, 1.16), edge(valA[i], .97), 6).slice(1));
    var outline = hump.concat(front.slice(1));
    if (!open){
      s += ell(cx + 2, cy + 8, 34, 11, "#1B2A3A", 0, .12);
      /* the lower valve under the front edge */
      var low = front.map(function(q, j){ return [q[0], q[1] + 6 + (j % 6 < 3 ? 1.6 : 0)]; });
      s += FO(D2(front.concat(low.slice().reverse())), sh[1], 1.6);
      for (i = 0; i < 5; i++){ var lv = edge(crestA[i], 1.12); s += L("M" + f(lv[0]) + " " + f(lv[1] + 1) + " v5", .9, sh[2]); }
      /* the mantle showing between the shells */
      s += F(D2(front.concat(front.slice().reverse().map(function(q){ return [q[0], q[1] + 3]; }))), mant[0]);
      for (i = 0; i < 9; i++){ var mp = front[Math.round(2 + i * (front.length - 5) / 8)]; s += circ(mp[0], mp[1] + 1.6, .9, i % 2 ? mant[1] : mant[2]); }
      /* the upper valve: five folds, each lit on its left half and shaded on its right */
      s += F(D2(outline), sh[0]);
      for (i = 0; i < 5; i++){
        var a0 = valA[i], a1 = valA[i + 1], cr = crestA[i], hp = [cx + (cr - 90) * -.12, cy - 20 + Math.abs(cr - 90) * .04];
        s += F(D2([hp, edge(cr, 1.14), edge(a1 + 6, 1.02), edge(a1, .97)]), i > 2 ? sh[2] : sh[1], i > 2 ? .75 : .7);
        s += L(D2([hp, edge(cr, 1.13)], true), 1, sh[2], .9);
      }
      s += O(D2(outline), 1.8) + T.HI("M" + f(cx - 22) + " " + f(cy - 12) + " Q" + f(cx - 14) + " " + f(cy - 22) + " " + f(cx - 4) + " " + f(cy - 23), 2);
      if (o.snow) s += F("M" + f(cx - 20) + " " + f(cy - 18) + " Q" + f(cx) + " " + f(cy - 30) + " " + f(cx + 20) + " " + f(cy - 18) + " Q" + f(cx) + " " + f(cy - 22) + " " + f(cx - 20) + " " + f(cy - 18) + " Z", "#FFFFFF");
      return s;
    }
    /* open: the upper valve swung up behind, its inside pearly; the bowl, the mantle round its rim, and the pearl */
    var lid = [edge(180, 1)].concat(bz(edge(180, 1), [cx - 34, cy - 40], [cx - 14, cy - 58], [cx, cy - 58], 8).slice(1)).concat(bz([cx, cy - 58], [cx + 14, cy - 58], [cx + 34, cy - 40], edge(0, 1), 8).slice(1));
    s += FO(D2(lid.concat(hump.slice().reverse())), sh[1], 1.8) + F(D2(lid.map(function(q){ return [cx + (q[0] - cx) * .8, cy - 18 + (q[1] - cy + 18) * .8]; })), "#FBEFF3");
    for (i = -2; i <= 2; i++) s += L("M" + f(cx + i * 3) + " " + f(cy - 22) + " L" + f(cx + i * 13) + " " + f(cy - 50 + Math.abs(i) * 4), .8, "#E9CBD6");
    s += FO(D2(outline), mant[0], 1.8);
    var inner = outline.map(function(q){ return [cx + (q[0] - cx) * .82, cy - 3 + (q[1] - cy + 3) * .76]; });
    s += F(D2(inner), "#FBF3F6") + F(D2(inner.map(function(q){ return [cx + (q[0] - cx) * .7 + 3, cy - 2 + (q[1] - cy + 2) * .7 + 2]; })), "#F3D7E2", .8);
    for (i = 0; i < 10; i++){ var mq = outline[Math.round(i * (outline.length - 1) / 9)]; s += circ(cx + (mq[0] - cx) * .92, cy - 3 + (mq[1] - cy + 3) * .88, 1, i % 2 ? mant[1] : mant[2]); }
    s += ell(cx, cy + 1, 6, 1.8, "#D9B8C6", 0) + T.tinyTooth(cx, cy - 4, 1.25, "#FFF9FB") + L("M" + f(cx - 3.4) + " " + f(cy - 8) + " q1 -2 3 -2.4", 1.4, "#FFFFFF");
    s += T.dmStar(cx + 10, cy - 14, 3.4, "#FFFFFF", "") + T.dmStar(cx - 11, cy - 10, 2.4, "#FFF3C4", "") + T.dmStar(cx + 4, cy - 22, 2, "#FFFFFF", "");
    return s;
  }
  /* the sunken chest, lid ajar (bits false) or flung open (bits true) */
  function chest(o, open){
    var n = o.night, s = "", i, x0 = .35, x1 = 3.0, y0 = .95, y1 = 2.5, zb = -.3, zt = 1.0, R = (y1 - y0) / 2, hl = .6;
    var wood = n ? { top: "#8A6A52", left: "#7A5A44", right: "#5E4434" } : { top: "#D9A06A", left: "#C4864F", right: "#94603A" }, iron = n ? "#3E3A48" : "#4E4A58", sand = n ? NSAND : SAND;
    var lidPts = function(ang){ var a = rad(ang), out = []; for (var j = 0; j <= 10; j++){ var ph = Math.PI * j / 10, dy = R + R * Math.cos(ph), dz = hl * Math.sin(ph); out.push([dy * Math.cos(a) - dz * Math.sin(a), dy * Math.sin(a) + dz * Math.cos(a)]); } return out; };
    /* a lid: its curved top (the faces you can see) and its end cap, hinged on the back edge */
    var drawLid = function(ang){
      var pr = lidPts(ang), out = "", at = function(x, q){ return [x, y0 + q[0], zt + q[1]]; };
      for (var j = 0; j < 10; j++){ var a = pr[j], b = pr[j + 1], ny = -(b[1] - a[1]), nz = b[0] - a[0]; if (ny + nz <= 0) continue;
        var col = nz > Math.abs(ny) * 1.6 ? wood.top : ny > 0 ? wood.left : wood.right;
        out += '<path d="' + D([at(x0, a), at(x1, a), at(x1, b), at(x0, b)]) + '" fill="' + col + '" stroke="' + col + '" stroke-width=".5"/>'; }
      var cap = pr.map(function(q){ return at(x1, q); });
      out += FO(D(cap), wood.right, 1.4) + O(D(pr.map(function(q){ return at(x0, q); }).concat(cap.slice().reverse())), 1.6);
      [x0 + .3, x1 - .3].forEach(function(x){ out += L(D(pr.map(function(q){ return at(x, q); }), true), 2.6, iron); });
      out += L(D(pr.map(function(q){ return at(x1 - .02, q); }), true), 1.6, iron);
      for (var k = 0; k < 3; k++){ var q = pr[2 + k * 3], bp = P.apply(null, at(x0 + .3, q)); out += circ(bp[0], bp[1], .8, "#9AA0AA"); }
      if (o.snow && ang < 60) out += F(D([at(x0 + .1, pr[4]), at(x1 - .1, pr[4]), at(x1 - .1, pr[6]), at(x0 + .1, pr[6])]), "#FFFFFF");
      return { s: out, pr: pr, at: at };
    };
    if (!open){
      var g = P(1.7, 1.75, 0);
      s += ell(g[0] + 2, g[1] + 4, 33, 11, "#1B2A3A", 0, .12);
      /* seaweed behind it, and the anchor leaning on its far end */
      var sw = P(.3, .55, 0), kc = n ? ["#2E5E4E", "#24503F"] : ["#7DB35A", "#557F3C"];
      s += kelp(sw[0], sw[1], 26, 3, kc, 11) + kelp(sw[0] + 6, sw[1] + 2, 18, -3, kc, 13);
      var an = P(3.35, .45, 0), at2 = P(3.35, .45, 3.0), ac = n ? "#4E5260" : "#6B6E7A";
      an = [an[0] + 6, an[1]];
      s += tube("M" + f(an[0]) + " " + f(an[1] - 2) + " L" + f(at2[0]) + " " + f(at2[1]), 2.6, ac) + tube("M" + f(at2[0] - 7) + " " + f(at2[1] + 5) + " l14 -6", 2.2, ac) + circ(at2[0] - 1, at2[1] - 4.4, 3.2, "none", 0).replace('fill="none"', 'fill="none" stroke="' + INK + '" stroke-width="4.4"') + circ(at2[0] - 1, at2[1] - 4.4, 3.2, "none", 0).replace('fill="none"', 'fill="none" stroke="' + ac + '" stroke-width="2"') +
        tube("M" + f(an[0] - 10) + " " + f(an[1] - 8) + " q10 10 20 -1", 2.4, ac) + FO("M" + f(an[0] - 12) + " " + f(an[1] - 11) + " l-1 6 5 -2 z M" + f(an[0] + 12) + " " + f(an[1] - 12) + " l1 6 -5 -2 z", ac, 1);
      /* the chest, its bottom in the sand */
      s += box(x0, y0, zb, x1 - x0, y1 - y0, zt - zb, wood, { sw: 1.8, si: 1.1 });
      for (i = 1; i < 3; i++) s += L(D([[x0, y1, zb + i * .38], [x1, y1, zb + i * .38]], true), .8, INK, .35);
      [x0 + .3, x1 - .3].forEach(function(x){ s += L(D([[x, y1, zb], [x, y1, zt]], true), 2.6, iron); });
      s += L(D([[x1, y0 + .25, zb], [x1, y0 + .25, zt]], true) + D([[x1, y1 - .25, zb], [x1, y1 - .25, zt]], true), 2.2, iron);
      /* the gap under the lid: the dark inside, gold in it */
      var L0 = drawLid(16), fe0 = L0.at(x0, L0.pr[0]), fe1 = L0.at(x1, L0.pr[0]);
      s += FO(D([[x0, y1, zt], [x1, y1, zt], fe1, fe0]), n ? "#2A1E18" : "#3B2A20", 1.2);
      for (i = 0; i < 8; i++){ var gp = P(x0 + .3 + i * .29, y1 - .05, zt + .08); s += crown(gp[0], gp[1] - 1, .34, (i % 3 - 1) * 12); }
      s += L0.s;
      /* the hasp: a gold plate with a tooth on it */
      var hp = P((x0 + x1) / 2, y1 + .01, zt - .28); s += FO("M" + f(hp[0] - 3.4) + " " + f(hp[1] - 4) + " h6.8 v6.4 l-3.4 2.4 -3.4 -2.4 z", K.gold, 1.1) + T.tinyTooth(hp[0], hp[1] + .4, .42, "#FFF0B3");
      /* barnacles */
      [[x0 + .08, y1, zt - .1], [x0 + .2, y1, zt - .3], [x1 - .1, y1, .1], [x1, y1 - .2, .3], [x1, y0 + .5, .55], [x0 + .9, y1, .05]].forEach(function(b, j){ var bp = P(b[0], b[1], b[2]); s += circ(bp[0], bp[1], j % 2 ? 1.4 : 1.9, n ? "#B9B4AC" : "#EEE8DA", .8) + circ(bp[0], bp[1], .5, INK); });
      /* the sand drifted up against it */
      var dr = [P(x0 - .3, y1 + .45, 0), P(x0 + .4, y1 + .1, .32), P(1.5, y1 + .05, .2), P(2.4, y1 + .08, .3), P(x1 + .1, y1 - .1, .25), P(x1 + .2, y1 - .7, .22), P(x1 + .5, y0 + .2, 0)];
      var drift = "M" + q2(dr[0]); for (i = 1; i < dr.length; i++) drift += " Q" + f((dr[i - 1][0] + dr[i][0]) / 2) + " " + f(Math.min(dr[i - 1][1], dr[i][1]) - 2.6) + " " + q2(dr[i]);
      var bot = P(x1 + .5, y1 + .6, 0), bot2 = P(x0 - .3, y1 + .9, 0);
      drift += " Q" + q2(bot) + " " + q2(bot2) + " Z";
      s += FO(drift, o.snow ? "#FFFFFF" : sand[1], 1.3) + L(D2([P(x0, y1 + .4, .08), P(1.6, y1 + .35, .1), P(2.6, y1 + .3, .08)], true), .9, sand[3], .7);
      /* spilled: crowns over the edge and on the sand, a few pearls */
      [[1.25, y1 + .12, .62, 20], [1.95, y1 + .1, .7, -10], [1.0, y1 + .75, 0, 30], [1.55, y1 + .85, 0, -6], [2.15, y1 + .7, 0, 14], [2.6, y1 + .9, 0, -24], [1.85, y1 + .98, 0, 8]].forEach(function(q){ var cp = P(q[0], q[1], q[2]); s += crown(cp[0], cp[1] - 3, .42, q[3]); });
      [[1.3, y1 + 1.0], [2.35, y1 + 1.05], [0.8, y1 + .55]].forEach(function(q){ var pp = P(q[0], q[1], 0); s += pearl(pp[0], pp[1] - 1.6, 1.8); });
      return s;
    }
    /* open: the lid swung right back, the hoard heaped up and glowing, glints and bubbles rising */
    var L1 = drawLid(112), Lc = drawLid(16), hull = Lc.pr.map(function(q){ return Lc.at(x0, q); }).concat(Lc.pr.slice().reverse().map(function(q){ return Lc.at(x1, q); }));
    s += L1.s;
    var g2 = P(1.7, 1.75, zt + .3);
    s += op(circ(g2[0], g2[1], 26, K.glow, 0), .35) + FO(D(hull), K.gold, 1.6) + F(D([[x0 + .1, y1 - .05, zt + .02], [x1 - .1, y1 - .05, zt + .02], [x1 - .1, y1 - .3, zt + .5], [x0 + .1, y1 - .3, zt + .5]]), K.goldShade, .5);
    [[.9, 1.5, .9], [1.4, 1.9, 1.0], [1.95, 1.6, 1.1], [2.5, 1.9, .95], [1.2, 2.2, .85], [2.2, 2.25, .9], [1.7, 1.3, 1.2], [2.6, 1.35, 1.0], [.8, 2.1, .8]].forEach(function(q, j){ var cp = P(q[0], q[1], q[2] + .1); s += crown(cp[0], cp[1], .4, (j % 4 - 1.5) * 14); });
    [[1.1, 1.8, 1.0], [2.0, 2.05, 1.0], [2.35, 1.5, 1.15]].forEach(function(q){ var pp = P(q[0], q[1], q[2] + .1); s += pearl(pp[0], pp[1], 2); });
    var gt = P(1.7, 1.75, 1.6);
    s += T.dmStar(gt[0] - 14, gt[1] - 6, 3.6, "#FFFFFF", "") + T.dmStar(gt[0] + 12, gt[1] - 14, 4.2, "#FFF3C4", "") + T.dmStar(gt[0] + 2, gt[1] - 24, 3, "#FFFFFF", "") + T.dmStar(gt[0] - 6, gt[1] - 32, 2.4, "#FFF3C4", "");
    s += circ(gt[0] + 18, gt[1] - 26, 2, "#EAFBFD", .7) + circ(gt[0] + 21, gt[1] - 36, 2.6, "#EAFBFD", .7) + circ(gt[0] - 16, gt[1] - 22, 1.8, "#EAFBFD", .7);
    return s;
  }

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  /* an arm of the octopus: a tapering curl along a curve, suckers on its underside */
  function arm(pts, w0, w1, col, sucker, side){
    var s = p(ribbon(pts, w0, w1), col, O2);
    for (var i = 2; i < pts.length - 2; i += 2){ var a = pts[i - 1], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1, w = (w0 + (w1 - w0) * i / (pts.length - 1)) * .26;
      s += '<circle cx="' + f(pts[i][0] + dy / l * w * side) + '" cy="' + f(pts[i][1] - dx / l * w * side) + '" r="' + f(Math.max(1, w * .7)) + '" fill="' + sucker + '" stroke="' + INK + '" stroke-width="1"/>'; }
    return s;
  }
  /* the mer-tail's outline: from the waist (as everything worn on his body starts, HEM's top), over his lower body and
     the gum he stands in, the tail sweeping down and round to the right, to the fin */
  var TAIL = chain([[50.6, 110], [64, 118], [86, 123], [100, 123], [114, 123], [136, 118], [149.4, 110], [151, 124], [148, 132], [146.6, 140], [143, 160], [138, 178], [150, 190], [156, 195], [164, 196], [170, 194],
    [168, 206], [166, 211], [160, 214], [140, 222], [108, 220], [84, 206], [64, 192], [54, 160], [52, 131], [50.4, 121], [50.6, 110]], 10);
  var FIN = "M166 196 C170 178 178 160 194 148 C196 164 192 178 184 190 C194 192 202 200 206 212 C192 214 178 212 168 210 Z";
  var outfits = {
    "starfish-clip": {
      note: "An orange starfish clipped to the side of his crown, a tiny pink shell beside it",
      top: p("M40 64 L64 48 L67 52 L43 68 Z", "#F2C94C", O2) + starfish(57, 47, 17, -18, "#F7923A", "#FFC27A", 3) + circ(57, 47, 3.4, "#FFB062") +
        '<path d="M50 38 q3 -2 6 -1" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' + scallop(86, 38, 13, ["#FFC9D4", "#E58FA6"], 16, 2),
      say: ["A starfish clip! I'm a little starstruck, honestly.", "Starfish have no teeth at all. I'm keeping this one company.", "Clip on, shine on. Brush on, too."]
    },
    "octopus-hat": {
      note: "A soft purple octopus sitting on his head, giving him a hug with its arms",
      top: arm(chain([[62, 44], [52, 52], [44, 64], [42, 78], [40, 92], [30, 102], [26, 94]], 8), 13, 3, "#A07AE0", "#F3C9EC", -1) +
        arm(chain([[74, 46], [64, 56], [56, 62], [50, 74], [46, 84], [52, 92], [56, 86]], 8), 11, 3, "#8E66D6", "#F3C9EC", 1) +
        arm(chain([[138, 44], [148, 52], [156, 64], [158, 78], [160, 92], [170, 102], [174, 94]], 8), 13, 3, "#A07AE0", "#F3C9EC", 1) +
        arm(chain([[126, 46], [136, 56], [144, 62], [150, 74], [154, 84], [148, 92], [144, 86]], 8), 11, 3, "#8E66D6", "#F3C9EC", -1) +
        arm(chain([[94, 48], [92, 56], [88, 60], [84, 62], [80, 64], [78, 58], [83, 57]], 6), 8, 2.6, "#A07AE0", "#F3C9EC", 1) +
        arm(chain([[106, 48], [108, 56], [112, 60], [116, 62], [120, 64], [122, 58], [117, 57]], 6), 8, 2.6, "#A07AE0", "#F3C9EC", -1) +
        p("M54 50 C48 12 72 -16 100 -16 C128 -16 152 12 146 50 Q100 62 54 50 Z", "#A07AE0") + '<path d="M128 -8 C148 6 152 28 146 50 Q132 56 116 57 C134 44 138 18 128 -8 Z" fill="#7C5BC4"/>' +
        '<path d="M54 50 C48 12 72 -16 100 -16 C128 -16 152 12 146 50 Q100 62 54 50 Z" fill="none" ' + O4 + "/>" +
        '<circle cx="78" cy="6" r="5" fill="#C3A6F2"/><circle cx="124" cy="0" r="3.6" fill="#C3A6F2"/><circle cx="66" cy="22" r="3" fill="#C3A6F2"/><circle cx="134" cy="18" r="3.4" fill="#9677D8"/>' +
        '<path d="M70 -2 Q80 -12 94 -13" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".55"/>' +
        '<ellipse cx="84" cy="30" rx="8.4" ry="9.4" fill="#FFFFFF" ' + O2 + '/><ellipse cx="116" cy="30" rx="8.4" ry="9.4" fill="#FFFFFF" ' + O2 + "/>" +
        '<ellipse cx="85.6" cy="32" rx="4.4" ry="5.4" fill="#2B2230"/><ellipse cx="117.6" cy="32" rx="4.4" ry="5.4" fill="#2B2230"/><circle cx="87.4" cy="29.4" r="1.8" fill="#FFFFFF"/><circle cx="119.4" cy="29.4" r="1.8" fill="#FFFFFF"/>' +
        '<ellipse cx="72" cy="40" rx="5" ry="2.8" fill="#FF8FB1" opacity=".7"/><ellipse cx="128" cy="40" rx="5" ry="2.8" fill="#FF8FB1" opacity=".7"/><path d="M94 42 Q100 47 106 42" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>',
      say: ["An octopus on my head. Eight arms, eight hugs.", "Octopuses have a beak instead of teeth. Rude, but fine.", "Ink-credible. That's my one octopus pun."]
    },
    "mer-tail": {
      note: "A teal and green scaly tail worn over his lower half, a belt of shells and a big fin curling to one side",
      face: (function(){
        var s = p(D2(TAIL), "#2FB8A8", O3);
        /* the shade down its right side */
        s += '<path d="M138 118 C150 132 146 156 142 176 C140 186 150 194 164 196 L168 206 C154 206 140 196 134 182 C130 164 138 140 138 118 Z" fill="#23978C"/>';
        /* scales: rows of little arcs, wherever they fall inside the tail */
        for (var r = 0; r < 12; r++) for (var c = 0; c < 14; c++){
          var x = 50 + c * 9 + (r % 2) * 4.5, y = 128 + r * 8;
          if (inside([x, y], TAIL) && inside([x - 4, y - 3], TAIL) && inside([x + 4, y - 3], TAIL) && inside([x, y + 3], TAIL)) s += '<path d="M' + f(x - 4) + " " + f(y - 2) + " Q" + f(x) + " " + f(y + 4) + " " + f(x + 4) + " " + f(y - 2) + '" fill="none" stroke="' + (y > 176 ? "#2E9E58" : "#1F8F86") + '" stroke-width="1.8" stroke-linecap="round"/>';
        }
        /* the green toward the fin */
        s += '<path d="M64 188 C84 204 108 214 140 214 C152 212 162 208 168 204 L166 211 C160 214 150 218 140 222 C110 222 84 208 64 192 Z" fill="#4FC26E" opacity=".9"/>';
        s += '<path d="' + D2(TAIL) + '" fill="none" ' + O3 + "/>";
        /* the fin, ribbed, curling up at the side */
        s += p(FIN, "#7FE3B4", O3) + '<path d="M168 202 L190 154 M170 204 L188 176 M170 206 L196 200 M168 208 L200 210" fill="none" stroke="#3FA870" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M182 160 Q186 156 190 154" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>';
        /* a belt of shells at the waist */
        s += '<path d="M50.6 110 Q100 124 149.4 110 L150 118 Q100 132 50 118 Z" fill="#F2C94C" ' + O2 + "/>";
        [[62, 119, -12, ["#FFC9D4", "#E58FA6"]], [81, 124, -6, ["#FFE2C8", "#E8A98A"]], [100, 126.4, 0, ["#FFFFFF", "#9FD0DC"]], [119, 124, 6, ["#FFE2C8", "#E8A98A"]], [138, 119, 12, ["#FFC9D4", "#E58FA6"]]].forEach(function(q){ s += scallop(q[0], q[1] + 4, 11, q[3], q[2], 1.8); });
        return s;
      })(),
      say: ["Mer-Timmy! Half tooth, half fish, all floss.", "A parrotfish has its teeth fused into a beak. Mine are just me.", "Can't walk in this. I'll swim to my checkup."]
    }
  };

  return { k: "reef", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
