/* Hub recap image: draws a 1080x1640 shareable summary of how the class used a hub onto a canvas.
   window.shRecap.draw(canvas, recap, opts) -- recap is get_hub_recap's jsonb; opts:
   { title, subtitle, color, names (bool), question: {text, answer, wrong} for the toughest question,
     sectionLabel(id) -> friendly name }. Pure drawing, no network. */
(function(){
  var W = 1080, H = 1640, PAD = 72;
  var INK = "#F3F1EC", INK2 = "#B9BDC4", INK3 = "#858B95", BG = "#12161C", PANEL = "#1B2029", LINE = "#2A303B";
  var SERIF = "'Fraunces', Georgia, serif", SANS = "'Work Sans', -apple-system, 'Segoe UI', sans-serif";

  function fmt(n){ return Math.round(n || 0).toLocaleString("en-US"); }
  function hours(min){ var h = (min || 0) / 60; return h >= 10 ? fmt(h) : h.toFixed(1); }
  function parseDay(s){ var p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function dayLabel(s, dow){ var d = parseDay(s); return (dow ? DOW[d.getDay()] + " " : "") + MON[d.getMonth()] + " " + d.getDate(); }
  function hourLabel(h){ return h === 0 ? "midnight" : h === 12 ? "noon" : (h % 12) + (h < 12 ? " am" : " pm"); }
  function addDays(s, n){ var d = parseDay(s); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function font(ctx, size, weight, fam){ ctx.font = (weight || 400) + " " + size + "px " + (fam || SANS); }
  function wrap(ctx, text, maxW, maxLines){
    var words = String(text || "").split(/\s+/), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + " " + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t;
    }
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[\s,.;:]+$/, "") + "…";
    }
    return lines;
  }
  function fit(ctx, text, maxW, size, weight, fam, min){
    font(ctx, size, weight, fam);
    while (size > (min || 12) && ctx.measureText(text).width > maxW) { size -= 2; font(ctx, size, weight, fam); }
    return size;
  }
  function rrect(ctx, x, y, w, h, r){
    r = Math.max(0, Math.min(r, w / 2, h / 2)); if (w <= 0 || h <= 0) return;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  /* a bar with 4px rounded top and a square base on the baseline */
  function bar(ctx, x, y, w, h){
    var r = Math.min(4, w / 2, h);
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  }
  function panel(ctx, x, y, w, h){ ctx.fillStyle = PANEL; rrect(ctx, x, y, w, h, 22); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.stroke(); }
  function eyebrow(ctx, text, x, y, color){ font(ctx, 19, 700); ctx.fillStyle = color || INK3; ctx.letterSpacing = "2px"; ctx.fillText(text.toUpperCase(), x, y); ctx.letterSpacing = "0px"; }

  function draw(canvas, R, o){
    o = o || {};
    var accent = o.color || "#DDAE52";
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.textBaseline = "alphabetic";

    /* background: deep ink with a soft glow of the hub colour */
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W - 120, 60, 20, W - 120, 60, 760);
    g.addColorStop(0, hexA(accent, .30)); g.addColorStop(1, hexA(accent, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 10);

    /* header */
    var y = PAD + 26;
    eyebrow(ctx, "Study Hubs · Hub recap", PAD, y, accent);
    var title = o.title || R.hub;
    var ts = fit(ctx, title, W - PAD * 2, 92, 600, SERIF, 52);
    y += ts + 8; ctx.fillStyle = INK; ctx.fillText(title, PAD, y);
    var end = R.exam_day || R.last_day;
    var sub = o.subtitle || (dayLabel(R.first_day) + " – " + dayLabel(end) + ", " + parseDay(end).getFullYear() + (R.exam_day ? "  ·  exam " + dayLabel(R.exam_day, true) : ""));
    font(ctx, 28, 500); ctx.fillStyle = INK2; y += 48; ctx.fillText(sub, PAD, y);

    /* four headline numbers */
    y += 40;
    var acc = R.answers ? Math.round(R.correct / R.answers * 100) : 0;
    var tiles = [
      [hours(R.minutes), "hours studied together"],
      [fmt(R.people), R.people === 1 ? "classmate" : "classmates"],
      [fmt(R.answers), "questions answered"],
      [acc + "%", "answered correctly"]
    ];
    var gap = 20, tw = (W - PAD * 2 - gap) / 2, th = 140;
    tiles.forEach(function(t, i){
      var tx = PAD + (i % 2) * (tw + gap), ty = y + Math.floor(i / 2) * (th + gap);
      panel(ctx, tx, ty, tw, th);
      fit(ctx, t[0], tw - 56, 76, 700, SANS, 40); ctx.fillStyle = INK; ctx.fillText(t[0], tx + 28, ty + 82);
      font(ctx, 24, 500); ctx.fillStyle = INK2; ctx.fillText(t[1], tx + 28, ty + 118);
    });
    y += th * 2 + gap + 34;

    /* hours per day, first day to exam day */
    var days = (R.by_day || []).filter(function(d){ return !R.exam_day || String(d.d).slice(0, 10) <= R.exam_day; });
    var byD = {}; days.forEach(function(d){ byD[String(d.d).slice(0, 10)] = d; });
    var list = [], cur = String(R.first_day).slice(0, 10), stop = String(end).slice(0, 10), guard = 0;
    while (cur <= stop && guard++ < 120) { list.push({ d: cur, minutes: byD[cur] ? byD[cur].minutes : 0, people: byD[cur] ? byD[cur].people : 0 }); cur = addDays(cur, 1); }
    var ch = 290; panel(ctx, PAD, y, W - PAD * 2, ch);
    eyebrow(ctx, "Hours per day", PAD + 28, y + 44);
    var peak = list.reduce(function(a, b){ return b.minutes > a.minutes ? b : a; }, list[0] || { minutes: 0 });
    var cx = PAD + 28, cw = W - PAD * 2 - 56, base = y + ch - 52, top = y + 92, n = Math.max(1, list.length);
    var slot = cw / n, bw = Math.max(4, Math.min(44, slot - 4)), max = Math.max(1, peak.minutes);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, base + .5); ctx.lineTo(cx + cw, base + .5); ctx.stroke();
    list.forEach(function(d, i){
      var h = d.minutes > 0 ? Math.max(3, (d.minutes / max) * (base - top)) : 0, bx = cx + i * slot + (slot - bw) / 2;
      var isExam = R.exam_day && d.d === R.exam_day;
      ctx.fillStyle = isExam ? INK : accent; if (h) bar(ctx, bx, base - h, bw, h);
      if (d === peak && d.minutes > 0) {
        font(ctx, 21, 700); ctx.fillStyle = INK; var lab = hours(d.minutes) + " h · " + dayLabel(d.d, true);
        var lw = ctx.measureText(lab).width, lx = Math.min(Math.max(bx + bw / 2 - lw / 2, cx), cx + cw - lw);
        ctx.fillText(lab, lx, base - h - 12);
      }
      if (isExam) { font(ctx, 18, 700); ctx.fillStyle = INK; var el = "Exam"; ctx.fillText(el, Math.min(bx + bw / 2 - ctx.measureText(el).width / 2, cx + cw - ctx.measureText(el).width), base + 30); }
    });
    font(ctx, 18, 500); ctx.fillStyle = INK3;
    if (list.length) { ctx.fillText(dayLabel(list[0].d), cx, base + 30); }
    y += ch + 24;

    /* fun facts */
    var byHour = R.by_hour || [], ph = 0; byHour.forEach(function(v, i){ if (v > byHour[ph]) ph = i; });
    var facts = [];
    if (R.night_before) facts.push(["The day before the exam", hours(R.night_before) + " hours", "from " + fmt(R.night_before_people) + " people"]);
    if (byHour.length) facts.push(["Prime time", hourLabel(ph), "the busiest hour of the day"]);
    if (R.after_midnight) facts.push(["Night owls", fmt(R.after_midnight), R.after_midnight === 1 ? "person studied after midnight" : "people studied after midnight"]);
    if (R.regulars) facts.push(["Regulars", fmt(R.regulars), "studied here on 3+ different days"]);
    var fw = (W - PAD * 2 - gap) / 2, fh = 128;
    facts.slice(0, 4).forEach(function(f, i){
      var fx = PAD + (i % 2) * (fw + gap), fy = y + Math.floor(i / 2) * (fh + gap);
      panel(ctx, fx, fy, fw, fh);
      eyebrow(ctx, f[0], fx + 26, fy + 38);
      fit(ctx, f[1], fw - 52, 44, 700, SANS, 28); ctx.fillStyle = accent; ctx.fillText(f[1], fx + 26, fy + 86);
      font(ctx, 21, 500); ctx.fillStyle = INK2; ctx.fillText(wrap(ctx, f[2], fw - 52, 1)[0], fx + 26, fy + 114);
    });
    y += Math.ceil(Math.min(4, facts.length) / 2) * (fh + gap) + 4;

    /* bottom row: the toughest question + hall of fame */
    var bh = H - y - 96, qw = Math.round((W - PAD * 2 - gap) * 0.56), hw = W - PAD * 2 - gap - qw;
    var tq = (R.toughest || [])[0], q = o.question;
    panel(ctx, PAD, y, qw, bh);
    eyebrow(ctx, "The one that got us", PAD + 26, y + 40);
    if (tq) {
      var pct = Math.round(tq.correct / tq.attempts * 100);
      font(ctx, 46, 700); ctx.fillStyle = accent; ctx.fillText(pct + "%", PAD + 26, y + 96);
      var pw = ctx.measureText(pct + "%").width;
      font(ctx, 21, 500); ctx.fillStyle = INK2; ctx.fillText("got it right (" + fmt(tq.correct) + " of " + fmt(tq.attempts) + ")", PAD + 36 + pw, y + 94);
      var ly = y + 138;
      if (q && q.text) {
        font(ctx, 23, 500); ctx.fillStyle = INK;
        var room = Math.max(1, Math.floor((bh - 150 - (q.answer ? 64 : 0)) / 31));
        wrap(ctx, q.text, qw - 52, room).forEach(function(l){ ctx.fillText(l, PAD + 26, ly); ly += 31; });
        if (q.answer) {
          ly += 10; font(ctx, 19, 700); ctx.fillStyle = INK3; ctx.fillText("ANSWER", PAD + 26, ly);
          font(ctx, 22, 600); ctx.fillStyle = INK; ctx.fillText(wrap(ctx, q.answer, qw - 52, 1)[0], PAD + 26, ly + 30);
        }
      } else { font(ctx, 22, 500); ctx.fillStyle = INK3; ctx.fillText("Question " + tq.qid, PAD + 26, ly); }
    } else { font(ctx, 22, 500); ctx.fillStyle = INK3; ctx.fillText("Not enough answers yet.", PAD + 26, y + 96); }

    var hx = PAD + qw + gap;
    panel(ctx, hx, y, hw, bh);
    eyebrow(ctx, "Hall of fame", hx + 26, y + 40);
    var hy = y + 84, top1 = (R.top_answers || [])[0], run = R.best_run;
    function fame(label, name, val){
      font(ctx, 19, 600); ctx.fillStyle = INK3; ctx.fillText(label, hx + 26, hy);
      if (o.names !== false && name) { fit(ctx, name, hw - 52, 28, 700, SANS, 18); ctx.fillStyle = INK; ctx.fillText(name, hx + 26, hy + 34); hy += 34; }
      font(ctx, 24, 700); ctx.fillStyle = accent; ctx.fillText(val, hx + 26, hy + 34);
      hy += 78;
    }
    if (top1) fame("Most questions answered", top1.name, fmt(top1.answers) + " answers");
    if (run && run.len) fame("Longest correct streak", run.name, fmt(run.len) + " right in a row");
    if (!top1 && !(run && run.len)) { font(ctx, 22, 500); ctx.fillStyle = INK3; ctx.fillText("—", hx + 26, hy); }

    /* footer */
    font(ctx, 21, 600); ctx.fillStyle = INK2; ctx.fillText("smcmurry6-source.github.io/study-hubs", PAD, H - 52);
    if (o.footnote) { font(ctx, 17, 500); ctx.fillStyle = INK3; var fl = wrap(ctx, o.footnote, 470, 2); fl.forEach(function(l, i){ ctx.fillText(l, W - PAD - ctx.measureText(l).width, H - 62 + i * 22); }); }
    return canvas;
  }
  function hexA(hex, a){
    var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  window.shRecap = { draw: draw, W: W, H: H };
})();
