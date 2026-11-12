/* The class's room: the "studying right now" tile as a drawn classroom (Sam, 2026-11-11). A kit, like Timmy's place:
   room() draws the empty room at any width and height, seats() says where the desks are, desk() draws one, and the page
   puts a Timmy (widget/pet.js art(), dressed by the place kit) behind each desk that someone is studying at.
   Drawn in Timmy's ink (style.mjs): flat fills, ink outlines, no ids, gradients, filters, <text> or <style>. */
export function classroomKit(INK, C, TINTS){
  "use strict";
  var SW = 1.8, SI = 1.1;
  function f(n){ return Math.round(n * 10) / 10; }
  function P(d, fill, sw){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function L(d, sw, col, op){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || SI) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function rr(x, y, w, h, r){ r = Math.min(r || 0, w / 2, h / 2); return "M" + f(x + r) + " " + f(y) + " H" + f(x + w - r) + " Q" + f(x + w) + " " + f(y) + " " + f(x + w) + " " + f(y + r) + " V" + f(y + h - r) + " Q" + f(x + w) + " " + f(y + h) + " " + f(x + w - r) + " " + f(y + h) + " H" + f(x + r) + " Q" + f(x) + " " + f(y + h) + " " + f(x) + " " + f(y + h - r) + " V" + f(y + r) + " Q" + f(x) + " " + f(y) + " " + f(x + r) + " " + f(y) + " Z"; }
  function circ(x, y, r, fill, sw){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + "/>"; }
  function T(x, y, s, inner, cls, extra){ return "<g" + (cls ? ' class="' + cls + '"' : "") + ' transform="translate(' + f(x) + " " + f(y) + ")" + (s && s !== 1 ? " scale(" + f(s * 100) / 100 + ")" : "") + '"' + (extra || "") + ">" + inner + "</g>"; }
  /* a small tooth, the class's mark (on the door sign, a desk's front, the poster) */
  var TOOTH = "M-5 -3.4 C-5.4 -6.4 -3.6 -8 -1.8 -8 C-.8 -8 -.4 -7.2 0 -7.2 C.4 -7.2 .8 -8 1.8 -8 C3.6 -8 5.4 -6.4 5 -3.4 C4.6 -.6 3.8 .8 3.4 3.6 C3.2 5.4 2 5.6 1.6 4 L.8 1.2 Q0 .2 -.8 1.2 L-1.6 4 C-2 5.6 -3.2 5.4 -3.4 3.6 C-3.8 .8 -4.6 -.6 -5 -3.4 Z";

  /* ---- the room: wall, board, clock, windows, poster, door, lamps, floor. o: { w, h, night, open (the door) } ---- */
  function geo(o){
    var W = o.w, H = o.h, wall = Math.round(H * .5), small = W < 480, WS = 10;      // WS: the wainscot's height
    var by = small ? 8 : 9, bw = small ? Math.min(150, W * .44) : Math.min(230, W * .32), bh = Math.max(20, wall - WS - by - 9);
    var door = { w: small ? 32 : 42, h: Math.min(wall - 12, small ? 66 : 74) }; door.x = W - door.w - (small ? 26 : 40); door.y = wall - door.h;
    return { W: W, H: H, wall: wall, small: small, WS: WS, board: { x: small ? 10 : 18, y: by, w: bw, h: bh }, door: door };
  }
  function room(o){
    var g = geo(o), W = g.W, H = g.H, wall = g.wall, b = g.board, d = g.door, s = "", night = !!o.night;
    /* wall, ceiling trim, wainscot, floor */
    s += F("M0 0 H" + W + " V" + wall + " H0 Z", night ? "#EBDCCB" : "#F8ECDD");
    s += F("M0 0 H" + W + " V5 H0 Z", night ? "#D9C6B0" : "#EAD9C4");
    s += F("M0 " + (wall - g.WS) + " H" + W + " V" + wall + " H0 Z", night ? "#D9BE9C" : "#EBD3B2") + L("M0 " + (wall - g.WS) + " H" + W, 1.2, INK, .55);
    s += F("M0 " + wall + " H" + W + " V" + H + " H0 Z", night ? "#C9A478" : "#DDBA8E");
    for (var i = 1, n = Math.max(2, Math.round((H - wall) / 14)); i < n; i++) s += L("M0 " + f(wall + (H - wall) * i / n) + " H" + W, 1, "#B98F62", .5);
    for (var x = 30; x < W; x += 74) s += L("M" + x + " " + wall + " l-10 " + (H - wall), 1, "#B98F62", .35);
    s += L("M0 " + wall + " H" + W, SW);
    /* the board: a green chalkboard in a wood frame, a tray with chalk and an eraser; the count is written on it by the page */
    s += P(rr(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 4), C.wood) + P(rr(b.x, b.y, b.w, b.h, 2), night ? "#2F5F4D" : "#3C7C63", 1.3);
    s += F(rr(b.x + 2, b.y + 2, b.w - 4, 4, 2), "#fff", .1);
    s += P(rr(b.x - 6, b.y + b.h + 4, b.w + 12, 4, 2), C.woodShade, 1.3) + F(rr(b.x + b.w - 30, b.y + b.h + 1.2, 12, 3.4, 1), "#fff") + F(rr(b.x + b.w - 14, b.y + b.h + .6, 9, 4, 1), "#E5484D") + L(rr(b.x + b.w - 14, b.y + b.h + .6, 9, 4, 1), .9);
    /* a chalk tooth and a line of scribble in the board's corner */
    s += L("M" + f(b.x + b.w - 40) + " " + f(b.y + b.h - 5) + " q4 -4 8 0 t8 0 t8 0 t8 0", 1, "#fff", .4);
    /* what's between the board and the door: a clock, windows, a poster */
    var x0 = b.x + b.w + (g.small ? 12 : 22), x1 = d.x - (g.small ? 10 : 22), top = g.small ? 9 : 10, wh = Math.max(16, wall - g.WS - top - 9);
    function windowAt(wx, ww, k){
      var t = P(rr(wx - 3, top - 3, ww + 6, wh + 6, 3), C.paper) + F(rr(wx, top, ww, wh, 1.5), night ? "#2B3A7A" : C.sky);
      if (night){
        if (k % 2 === 0) t += F("M" + f(wx + ww * .62) + " " + f(top + wh * .2) + " a" + f(wh * .2) + " " + f(wh * .2) + " 0 1 0 " + f(wh * .2) + " " + f(wh * .3) + " a" + f(wh * .16) + " " + f(wh * .16) + " 0 1 1 -" + f(wh * .2) + " -" + f(wh * .3) + " Z", "#FFE9A8");
        [[.2, .25], [.42, .6], [.78, .7], [.3, .82], [.86, .2]].forEach(function(q, j){ if ((j + k) % 5 < 4) t += circ(wx + ww * q[0], top + wh * q[1], j % 2 ? .9 : 1.3, "#FFF6CF"); });
      } else {
        if (k % 2 === 0) t += circ(wx + ww * .74, top + wh * .3, Math.min(7, wh * .16), C.yellow, 1.1);
        var cxx = wx + ww * (k % 2 ? .52 : .3), cyy = top + wh * (k % 2 ? .36 : .62);
        t += F("M" + f(cxx - 9) + " " + f(cyy + 3) + " q-4 -1 -3 -4 q1 -3 5 -2 q2 -5 7 -3 q4 -2 6 2 q5 0 4 4 q-1 3 -5 3 Z", "#fff");
        t += F("M" + f(wx) + " " + f(top + wh * .78) + " q" + f(ww * .25) + " -8 " + f(ww * .5) + " -2 t" + f(ww * .5) + " -3 V" + f(top + wh) + " H" + f(wx) + " Z", C.grass);
      }
      t += L("M" + f(wx + ww / 2) + " " + top + " V" + f(top + wh) + " M" + wx + " " + f(top + wh * .5) + " H" + f(wx + ww), 1.4, C.paper) + L(rr(wx, top, ww, wh, 1.5), 1.1);
      t += P(rr(wx - 6, top + wh + 3, ww + 12, 3.6, 1.6), C.paperShade, 1.2);
      return t;
    }
    var room_ = x1 - x0, k = 0;
    if (room_ > 40){
      /* the clock comes first, then as many windows as fit, then a poster in what's left */
      var cr = g.small ? 7.5 : 10, cxk = x0 + cr + 2, cyk = top + cr + 2;
      s += circ(cxk, cyk, cr, C.paper, SW) + L("M" + f(cxk) + " " + f(cyk) + " V" + f(cyk - cr * .62) + " M" + f(cxk) + " " + f(cyk) + " L" + f(cxk + cr * .46) + " " + f(cyk + cr * .22), 1.3) + circ(cxk, cyk, 1.1, C.red);
      for (var a = 0; a < 12; a += 3) s += circ(cxk + Math.sin(a / 12 * 2 * Math.PI) * cr * .78, cyk - Math.cos(a / 12 * 2 * Math.PI) * cr * .78, .7, INK);
      var wx = x0 + cr * 2 + (g.small ? 12 : 20), ww = g.small ? 34 : 62, gap = g.small ? 12 : 20;
      while (wx + ww <= x1 - (g.small ? 0 : 0) && k < 4){
        if (x1 - (wx + ww) < 0) break;
        /* leave the last slot for the poster when there's room for one more thing */
        if (x1 - wx < ww + gap + 44 && x1 - wx >= ww && k >= 1 && x1 - wx > 50 && !g.small){ break; }
        s += windowAt(wx, ww, k); wx += ww + gap; k++;
      }
      if (x1 - wx >= 40){
        /* the poster: a tooth in section (enamel, dentin, pulp), two label lines, two pins */
        var pw = Math.min(46, x1 - wx), ph = Math.min(wh + 2, 52), px = wx + (x1 - wx - pw) / 2, py = top - 1;
        s += P(rr(px, py, pw, ph, 1.5), C.paper, 1.3);
        s += '<g transform="translate(' + f(px + pw * .42) + " " + f(py + ph * .5) + ") scale(" + f(Math.min(pw, ph) / 21) + ')">' + P(TOOTH, C.enamel, .9) +
          F("M-3.4 -3.6 C-3.6 -5.6 -2.6 -6.4 -1.6 -6.2 C-.8 -6 -.4 -5.4 0 -5.4 C.4 -5.4 .8 -6 1.6 -6.2 C2.6 -6.4 3.6 -5.6 3.4 -3.6 C3.1 -1.4 2.6 .2 2.4 2.4 L1.9 2.6 L1.2 0 Q0 -1.2 -1.2 0 L-1.9 2.6 L-2.4 2.4 C-2.6 .2 -3.1 -1.4 -3.4 -3.6 Z", "#F3DDA8") +
          F("M-1.6 -3.4 Q0 -4.6 1.6 -3.4 Q1.5 -1.6 1 -.4 Q0 -1.4 -1 -.4 Q-1.5 -1.6 -1.6 -3.4 Z", "#F78FA8") + "</g>";
        s += L("M" + f(px + pw * .68) + " " + f(py + ph * .3) + " h" + f(pw * .2) + " M" + f(px + pw * .68) + " " + f(py + ph * .46) + " h" + f(pw * .16) + " M" + f(px + pw * .68) + " " + f(py + ph * .62) + " h" + f(pw * .2), 1, INK, .55);
        s += circ(px + 4, py + 3.4, 1.3, C.red) + circ(px + pw - 4, py + 3.4, 1.3, C.red);
      }
    }
    /* hanging lamps; at night each throws a cone of light */
    var lamps = Math.max(2, Math.round(W / 190));
    for (i = 0; i < lamps; i++){
      var lx = W * (i + .5) / lamps;
      if (night) s += F("M" + f(lx - 7) + " 14 L" + f(lx - 30) + " " + wall + " H" + f(lx + 30) + " L" + f(lx + 7) + " 14 Z", "#FFE9A8", .13);
      s += L("M" + f(lx) + " 0 V8", 1.2) + P("M" + f(lx - 4) + " 8 H" + f(lx + 4) + " L" + f(lx + 8) + " 14 H" + f(lx - 8) + " Z", night ? C.yellow : C.metalLight, 1.2);
      if (night) s += F("M" + f(lx - 5) + " 14 q5 4 10 0 Z", "#FFF6CF");
    }
    s += door(o) + plant(o);
    return s;
  }
  /* the door, with the class's sign over it; open (o.open), it shows the hallway and the leaf edge on. Its own piece,
     so the page can lay the open door over the shut one while someone walks in or out. */
  function door(o){
    var g = geo(o), d = g.door, wall = g.wall, night = !!o.night, s = "";
    s += P(rr(d.x - 4, d.y - 4, d.w + 8, d.h + 4, 3), C.woodShade);
    if (o.open){
      s += F("M" + d.x + " " + d.y + " H" + (d.x + d.w) + " V" + wall + " H" + d.x + " Z", "#4A3B48") + F("M" + f(d.x + 3) + " " + wall + " L" + f(d.x + d.w * .5) + " " + f(d.y + d.h * .55) + " L" + f(d.x + d.w - 3) + " " + wall + " Z", "#FFE9A8", .35);
      s += P("M" + (d.x + d.w) + " " + d.y + " l" + f(d.w * .34) + " " + f(-d.h * .05) + " V" + f(wall + 5) + " L" + (d.x + d.w) + " " + wall + " Z", "#5E9BAE", 1.4) + circ(d.x + d.w + d.w * .22, d.y + d.h * .56, 1.5, C.gold, .8);
      s += L(rr(d.x, d.y, d.w, d.h, 0), 1.3);
    } else {
      s += P("M" + d.x + " " + d.y + " H" + (d.x + d.w) + " V" + wall + " H" + d.x + " Z", "#6FA9BB", 1.3);
      s += P(rr(d.x + d.w * .22, d.y + d.h * .1, d.w * .56, d.h * .3, 2), night ? "#FFE9A8" : C.sky, 1.1) + L(rr(d.x + d.w * .16, d.y + d.h * .5, d.w * .68, d.h * .4, 2), 1, INK, .45);
      s += circ(d.x + d.w * .16, d.y + d.h * .56, 1.9, C.gold, 1);
    }
    s += P(rr(d.x + d.w / 2 - 9, d.y - 17, 18, 11, 3), C.green, 1.2) + '<g transform="translate(' + f(d.x + d.w / 2) + " " + f(d.y - 10.6) + ') scale(.62)">' + F(TOOTH, "#fff") + "</g>";
    return s;
  }
  /* the plant in the corner by the door (its own piece, so the page can draw it over the open door's leaf) */
  function plant(o){
    var g = geo(o), W = g.W, wall = g.wall, s = "";
    var px2 = W - (g.small ? 12 : 18);
    s += F("M" + f(px2) + " " + f(wall - 13) + " q-12 -10 -9 -26 q8 6 9 18 q-1 -16 6 -24 q7 12 -3 26 q5 -10 12 -10 q-2 11 -15 16 Z", C.grassShade) + L("M" + f(px2) + " " + f(wall - 13) + " q-12 -10 -9 -26 q8 6 9 18 q-1 -16 6 -24 q7 12 -3 26 q5 -10 12 -10 q-2 11 -15 16 Z", 1.2);
    s += P("M" + f(px2 - 8) + " " + f(wall - 14) + " h16 l-2.4 14 h-11.2 Z", "#D08A52", 1.3);
    return s;
  }

  /* ---- the desks: rows from the back (small, high) to the front (big, low), every other row shifted half a desk ---- */
  function fit(o, rows){
    var g = geo(o), sc = Math.min(1.35, (g.H - g.wall - 5) / (15 + 25 * (rows - 1)));
    return { g: g, sc: sc };
  }
  /* o.rows, or as few rows (two at least) as seat o.n people: fewer rows are bigger desks */
  function seats(o){
    var rows = o.rows || 2, out;
    for (;;){
      out = layout(o, rows);
      /* stop adding rows when the desks would get too small to read: the page says how many more are in the hall */
      if (o.rows || !o.n || out.length >= o.n || rows >= 6 || fit(o, rows + 1).sc < (o.min || .66)) return out;
      rows++;
    }
  }
  function layout(o, rows){
    var q = fit(o, rows), g = q.g, s0 = q.sc, out = [], left = g.small ? 6 : 14, right = g.door.x - (g.small ? 4 : 10);
    var yb = g.wall + 19 * s0 * .88, yf = g.H - 5;
    for (var r = 0; r < rows; r++){
      var t = rows === 1 ? 1 : r / (rows - 1), sc = s0 * (.88 + .12 * t), pitch = 46 * sc, y = yb + (yf - yb) * t;
      var n = Math.floor((right - left - (r % 2 ? pitch / 2 : 0)) / pitch), x = left + (right - left - n * pitch) / 2 + pitch / 2;
      for (var i = 0; i < n; i++) out.push({ row: r, i: i, x: f(x + i * pitch), y: f(y), s: f(sc * 100) / 100 });
    }
    return out;
  }
  /* one desk, at the origin (its feet on y 0): the chair's back, then (the page puts Timmy here) the desk. tint: a hub's
     tint paints its front and puts the tooth on it; things: 0 a book, 1 a cup, 2 a laptop, 3 notes and a pencil */
  function chair(){ return P(rr(-9, -30, 18, 16, 5), "#9C8A98", 1.4) + L("M-5 -25 h10 M-5 -21 h10", 1, INK, .35); }
  function desk(tint, things){
    var t = tint && TINTS[tint], s = "";
    s += F("M-17 -1 h4 v7 h-4 Z M13 -1 h4 v7 h-4 Z", INK);
    s += P(rr(-20, -12, 40, 13, 2.5), t ? t.light : "#D9B182", 1.4);
    if (t) s += circ(0, -5.4, 4.6, t.ink) + '<g transform="translate(0 -4.6) scale(.5)">' + F(TOOTH, "#fff") + "</g>";
    else s += L("M-14 -5.4 h28", 1, INK, .3);
    s += P("M-22 -16.4 H22 L24 -11.6 H-24 Z", "#EBC892", 1.4) + L("M-20 -15 H20", 1, "#fff", .6);
    var k = things == null ? -1 : things % 4;
    if (k === 0) s += P("M8 -17.4 q3.6 -2.4 7 0 q3.4 -2.4 7 0 v-4.6 q-3.6 -2.2 -7 0 q-3.4 -2.2 -7 0 Z", C.paper, 1) + L("M15 -22 v4.6", .9);
    if (k === 1) s += P("M-19 -24 h7 l-.8 7.4 h-5.4 Z", C.paper, 1) + L("M-12 -22.4 q3.4 .4 2.4 3 q-.8 1.6 -2.8 1.4", 1) + L("M-17 -27 q1.4 -1.6 0 -3.2 M-14 -27 q1.4 -1.6 0 -3.2", .9, INK, .45);
    if (k === 2) s += P("M9 -17 h12 l1.4 -1 h-12.2 Z", C.metalShade, .9) + P("M10.4 -18 l1.6 -8.6 h10.4 l-1.6 8.6 Z", t ? t.mid : C.metal, 1) ;
    if (k === 3) s += P("M-21 -17.2 l1.6 -3 h9 l-1.6 3 Z", C.paper, .9) + L("M-18.4 -18.8 h5.4", .8, INK, .5) + L("M-9.4 -20.6 l4.6 3", 1.6, C.yellow) + L("M-9.4 -20.6 l4.6 3", .5);
    return s;
  }
  /* where Timmy's picture goes at a desk at the origin: his box (viewBox 0 -30 200 262) drawn w wide, sunk so the desk
     covers his cushion from its middle down */
  var SEAT = { x: -16, y: -46.2, w: 32, h: 41.92 };
  /* standing on the floor (walking in or out): his cushion's foot on y 0 */
  var STAND = { x: -16, y: -39.1, w: 32, h: 41.92 };

  return { room: room, door: door, plant: plant, seats: seats, desk: desk, chair: chair, geo: geo, SEAT: SEAT, STAND: STAND, TOOTH: TOOTH, T: T };
}
