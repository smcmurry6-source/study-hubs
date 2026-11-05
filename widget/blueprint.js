/* ============ THE EXAM SHEET'S SHARED PARTS (2026-11-05 redesign) ============
   Loaded by every hub with a Home page (a plain script in the head, like widget/cases.js, so it is there before the hub
   first draws). Styles: the house block in each hub (tools/house/house.css). Design notes:
   vault/release/reports/2026-11-05-redesign-design-notes.md.

   window.shBlueprint: the blueprint strip, the live thing on Home. One row per lecture; the bar's length is the
   lecture's share of the exam (opts.counts, the announced questions per lecture, else its share of the bank), filled to
   the questions right on the latest try, a lighter fill for tried-and-missed. A tap on a row calls
   opts.onPick(lecId, state) with 'missed' (the lecture has misses), 'unseen' (untried questions left) or 'all'.
     html(rows, opts)  rows: [{ id, label, title, total, right, missed, group? }] in course order (a group label heads its rows); returns HTML
     wire(root, opts)  after the HTML is in the page: taps, keyboard, and the bars growing in (unless reduced motion
                       or the answer-animation setting is off)
   window.shHome: the other drawn parts of the sheet: band(), ledger(), moments(), back(), wireMoments(root).
   Every string is plain text escaped here; nothing is read from the class's data. */
(function(){
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function still(){
    try { if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return true; } catch (e) {}
    try { return localStorage.getItem("sh_pref_fx") === "off"; } catch (e) { return false; }
  }
  function pct(a, b){ return b ? Math.max(0, Math.min(100, Math.round(a / b * 1000) / 10)) : 0; }

  var Blueprint = {
    html: function(rows, opts){
      opts = opts || {};
      var counts = opts.counts || {}, weights = rows.map(function(r){ return counts[r.id] != null ? counts[r.id] : r.total; });
      var max = Math.max.apply(null, weights.concat([1]));
      var last = null;
      var out = rows.map(function(r, i){
        var head = r.group && r.group !== last ? '<li class="shbp-group">' + esc(r.group) + '</li>' : ''; last = r.group || last;
        var w = Math.max(14, Math.round(weights[i] / max * 100)), done = pct(r.right + r.missed, r.total), ok = pct(r.right, r.total);
        var left = r.total - r.right - r.missed, state = r.missed ? "missed" : left ? "unseen" : "all";
        /* the spoken name starts with the visible text (axe: label-content-name-mismatch); the rest is hidden text, not an aria-label */
        var say = ": " + r.right + " of " + r.total + " right" + (r.missed ? ", " + r.missed + " missed" : "") + (left ? ", " + left + " to try" : "") + ". Practice this lecture.";
        var n = counts[r.id] != null ? counts[r.id] + " on the exam" : r.total + " in the bank";
        return head + '<li><button type="button" class="shbp-row" data-lec="' + esc(r.id) + '" data-state="' + state + '">' +
          '<span class="shbp-lab"><b>' + esc(r.label) + '</b> <span>' + esc(r.title) + '</span><span class="shbp-say">' + say + '</span></span>' +
          '<span class="shbp-n" aria-hidden="true">' + (counts[r.id] != null ? counts[r.id] : r.total) + '</span>' +
          '<span class="shbp-bar" style="width:' + w + '%" aria-hidden="true"><i class="shbp-miss" data-w="' + done + '"></i><i class="shbp-right" data-w="' + ok + '"></i></span>' +
          '</button></li>';
      }).join("");
      var key = '<ul class="shbp-key" aria-hidden="true"><li><i class="k-right"></i>right on the latest try</li><li><i class="k-miss"></i>missed last time</li><li><i></i>not tried yet</li></ul>';
      return '<ol class="shbp' + (still() ? "" : " is-live") + '" aria-label="' + esc(opts.label || "The exam, lecture by lecture") + '">' + out + '</ol>' + key +
        '<p class="shbp-note">' + esc(opts.note || "Bar lengths follow each lecture's share; the count is " + (Object.keys(counts).length ? "questions on the exam" : "questions in the bank") + ".") + '</p>';
    },
    wire: function(root, opts){
      opts = opts || {};
      var list = root.querySelector(".shbp"); if (!list) return;
      Array.prototype.forEach.call(list.querySelectorAll(".shbp-row"), function(b){
        b.addEventListener("click", function(){ if (opts.onPick) opts.onPick(b.getAttribute("data-lec"), b.getAttribute("data-state")); });
      });
      function paint(){ Array.prototype.forEach.call(list.querySelectorAll(".shbp-bar i"), function(i){ i.style.width = i.getAttribute("data-w") + "%"; }); }
      if (list.classList.contains("is-live") && window.requestAnimationFrame) requestAnimationFrame(function(){ requestAnimationFrame(paint); });
      else paint();
    }
  };

  var Home = {
    /* the sheet's striped band: alternating bars of the hub's ink and paper, a flex row of filled blocks (no gradient) */
    band: function(){
      /* the hub's frieze from the art kit (widget/art.js, band-<hub>: the course's things on a bench), else the stripes */
      var sc = document.querySelector("script[data-hub]"), m = location.pathname.match(/\/hubs\/([^\/]+)/);
      var hub = (sc && sc.getAttribute("data-hub")) || (m && m[1]);   /* a hub that draws Home before its v3 tag is parsed still gets its frieze */
      if (hub && window.shArt && window.shArt.has("band-" + hub)) return '<div class="sheet-band is-art" aria-hidden="true">' + window.shArt.svg("band-" + hub, { size: 600 }) + "</div>";
      var s = ""; for (var i = 0; i < 48; i++) s += "<i></i>"; return '<div class="sheet-band" aria-hidden="true">' + s + "</div>";
    },
    /* Where you stand: figures set large, aligned on the figure, units in the captions; the last 14 days under them */
    ledger: function(o){
      var items = (o.items || []).map(function(it){ return "<li><b>" + esc(it.n) + "</b><span>" + esc(it.t) + "</span></li>"; }).join("");
      return '<section class="ledger" aria-labelledby="ledgerH"><h3 id="ledgerH"><span>' + esc(o.lead || "Where you") + "</span>" + esc(o.head || "stand") + "</h3><ol>" + items + (o.days || "") + "</ol></section>";
    },
    /* The course so far: the dates as a row of moments that scrolls sideways, with a progress bar and two buttons */
    moments: function(o){
      var today = o.today, items = (o.dates || []).map(function(e){
        var when = e.date < today ? "past" : e.date === today ? "today" : "future";
        var d = new Date(e.date + "T12:00:00"), day = d.toLocaleDateString("en-US", { weekday:"long" }), mon = d.toLocaleDateString("en-US", { month:"long" });
        return '<li class="tl-' + when + (e.kind ? " tl-" + esc(e.kind) : "") + '"><span class="tl-date">' + esc(day + ", " + mon + " " + d.getDate()) + (when === "today" ? " (today)" : "") + '</span><span class="tl-what">' + esc(e.label) + '</span><span class="tl-day" aria-hidden="true"><b>' + d.getDate() + "</b></span></li>";
      }).join("");
      return '<section class="moments" aria-labelledby="momentsH"><div class="moments-head"><h3 id="momentsH">' + esc(o.title || "The course so far") + '</h3><div class="moments-nav"><button type="button" data-dir="-1" aria-label="Earlier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" data-dir="1" aria-label="Later"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div></div>' +
        '<div class="moments-track" aria-hidden="true"><i></i></div><ol class="home-tl" tabindex="0" aria-label="' + esc(o.title || "The course so far") + ', scrolls sideways">' + items + "</ol></section>";
    },
    wireMoments: function(root){
      var sec = root.querySelector(".moments"); if (!sec) return;
      var row = sec.querySelector(".home-tl"), bar = sec.querySelector(".moments-track i"), prev = sec.querySelector('[data-dir="-1"]'), next = sec.querySelector('[data-dir="1"]');
      function upd(){
        var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft, span = max > 0 ? row.clientWidth / row.scrollWidth : 1;
        bar.style.width = Math.round(span * 100) + "%"; bar.style.left = max > 0 ? Math.round(x / row.scrollWidth * 100) + "%" : "0";
        prev.disabled = x <= 2; next.disabled = max <= 0 || x >= max - 2;
      }
      row.addEventListener("scroll", upd, { passive:true }); window.addEventListener("resize", upd);
      [prev, next].forEach(function(b){ b.addEventListener("click", function(){ row.scrollBy({ left: (parseInt(b.getAttribute("data-dir"), 10) || 1) * Math.round(row.clientWidth * .8), behavior: still() ? "auto" : "smooth" }); }); });
      /* the row opens on today (or the next date), so the past doesn't fill the first screen */
      var at = row.querySelector(".tl-today") || row.querySelector(".tl-future"); if (at) row.scrollLeft = Math.max(0, at.offsetLeft - row.offsetLeft - 20);
      upd();
    },
    /* The back of the sheet: a field of the hub's ink with the rest of the hub as its address block, and a stamp */
    back: function(o){
      var links = (o.links || []).map(function(l){ return '<li><button type="button" class="linkbtn" data-home="' + esc(l.go) + '">' + esc(l.text) + "</button>" + (l.note ? ": " + esc(l.note) : "") + "</li>"; }).join("");
      var stamp = '<div class="home-stamp" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M20.5 15.5c3.4-3.8 7.4-2.8 11.5-.9 4.1-1.9 8.1-2.9 11.5.9 3.3 3.7 2.4 9.3-.2 13.8-1.7 3.1-2.5 7.2-3.2 11.6-.5 2.8-4 3.2-4.9.3l-1.5-5.6c-.5-1.8-2.9-1.8-3.4 0l-1.5 5.6c-.9 2.9-4.4 2.5-4.9-.3-.7-4.4-1.5-8.5-3.2-11.6-2.6-4.5-3.5-10.1-.2-13.8z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg></div>';
      return '<section class="home-back" aria-labelledby="backH"><div><h3 id="backH">' + esc(o.title || "Also in this hub") + "</h3><p>" + esc(o.text || "") + "</p></div><div>" + stamp + '<ul class="home-links">' + links + "</ul></div>" +
        '<p class="imprint">' + esc(o.imprint || "Built by Sam for the D2 class at UAB") + "</p></section>";
    }
  };
  window.shBlueprint = Blueprint;
  window.shHome = Home;
})();
