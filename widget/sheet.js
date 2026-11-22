/* ============ THE HUB ENGINE, on first use: a lecture's one-page sheet (widget/sheet.js + sheet.css) ============
   One page per lecture with its cram sheet, its High likelihood topics and its Exam hints together (on a hub of courses,
   core.json's hintsFrom "courses": its High-yield topics and High-yield points), on screen and, with Print or save as PDF
   (the browser's own print dialog), on one sheet of paper (idea board #5, 2026-11-22: Sam asked whether the class wanted to
   print it or to have the cram sheet and the topics and hints in one place; this is both). #notes/<lecture>/sheet, opened
   from the notes' toolbar and from each lecture on the cram sheet (More).

   Nothing on it is written for it: every line is the lecture's own, word for word, from study.json's cram and hints and
   core.json's likelyTopics, so it can't say what the notes don't and needs no recording (text-and-audio-never-drift). It
   isn't High yield: High yield is the notes' third reading level, the paragraphs of the notes that teach each topic (two
   printed pages or more a lecture), read to understand; the sheet is the list that fits on one page, read to review, and
   links to High yield for the why.

   The printed copy is its own block, .shp, a child of <body> (so the print rules can hide everything else), laid out for
   Letter paper in two columns and kept out of sight on screen. fit() sets its type size, from 10.5 pt down to 7 pt, until it
   fits one page (measured against a 10-inch ruler inside it, so the page's text size setting, which zooms the page, doesn't
   change the answer), when it is drawn, once the fonts are in and again just before printing. widget/hub.js fetches this
   file the first time a sheet opens; the core keeps the route, the buttons that open it and section()'s name for it
   (compendium/cram/sheet, sh_surface's cram). Its events: sheet:open, sheet:print and sheet:hy
   (vault/reference/event-taxonomy.md). ============ */
(function(){
  "use strict";
  window.SH_SHEET = function(HX){
    var $ = HX.$, $$ = HX.$$, esc = HX.esc, icon = HX.icon, pl = HX.pl, fmt = HX.fmt, lc = HX.lc, track = HX.track,
      LBY = HX.LBY, QBL = HX.QBL, lecLabel = HX.lecLabel, shortTitle = HX.shortTitle, STATE = HX.STATE, docEl = HX.docEl;
    var href = HX.WIDGET + "sheet.css";
    var ready = new Promise(function(res){
      if ($('link[href="' + href + '"]')) { res(); return; }
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.onload = res; l.onerror = res; document.head.appendChild(l);
    });
    /* the lecture's parts: its cram lines, its topics (strongest evidence first, as core.json lists them), what its professors
       stressed and what they said not to bother with */
    function parts(lec){
      var hints = (HX.STUDY.hints || []).filter(function(x){ return x.lec === lec.id; });
      return {
        cram: (HX.STUDY.cram || {})[lec.id] || [],
        topics: (HX.CORE.likelyTopics || []).filter(function(t){ return t.lec === lec.id; }),
        said: hints.filter(function(x){ return x.kind !== "deemphasize"; }),
        skip: hints.filter(function(x){ return x.kind === "deemphasize"; })
      };
    }
    /* the words for them, as the rest of the engine says them (hub.js courses(), hintsName(), likelyName()): a hub of courses
       never calls them a prediction of its exam */
    function names(){
      return HX.courses() ? { topics: "High-yield topics", topic: "high-yield topic", topicsIn: "high-yield topics", hints: "High-yield points", hint: "high-yield point",
          hintsIn: "high-yield points", skip: "Said not needed", order: "What each course stressed most, strongest evidence first" } :
        { topics: "High likelihood topics", topic: "High likelihood topic", topicsIn: "High likelihood topics", hints: "Exam hints", hint: "exam hint",
          hintsIn: "Exam hints", skip: "You can skip", order: "Strongest evidence first" };
    }
    function quote(x){ var said = x.kind !== "focus"; return (said ? "“" : "") + esc(x.quote) + (said ? "”" : ""); }
    function examLine(lec){
      var E = HX.EXAM; if (!E || !HX.isExamLec(lec.id)) return "";
      return (E.label || "The exam") + (E.date ? ", " + HX.dateLabel(E.date, { weekday: "long", month: "long", day: "numeric" }) : "");
    }
    function sheetUrl(lec){ return location.origin + location.pathname + "#notes/" + lec.id + "/sheet"; }
    function today(){ try { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return ""; } }

    /* ---------- the printed copy ---------- */
    function paperHTML(lec, P, N){
      var sub = String(lec.title).split(":").slice(1).join(":").trim(), ex = examLine(lec);
      return '<div class="shp-in">' +
        '<header class="shp-head"><div class="shp-t"><span class="shp-lb">' + esc(lecLabel(lec)) + "</span><div><h1>" + esc(shortTitle(lec)) + "</h1>" + (sub ? '<p class="shp-sub">' + esc(sub) + "</p>" : "") + "</div></div>" +
          '<p class="shp-meta"><b>' + esc(HX.C.name || HX.HUB) + "</b>" + (lec.who ? "<br>" + esc(lec.who) : "") + (ex ? "<br>" + esc(ex) : "") + "</p></header>" +
        (P.topics.length ? '<section class="shp-topics"><h2>' + esc(N.topics) + " <small>" + esc(N.order) + "</small></h2><ol>" +
          P.topics.map(function(t){ return "<li>" + esc(t.t) + (t.basis ? ' <i>' + esc(t.basis) + "</i>" : "") + "</li>"; }).join("") + "</ol></section>" : "") +
        '<div class="shp-cols">' +
          (P.cram.length ? '<section class="shp-cram"><h2>Cram sheet</h2><ul>' + P.cram.map(function(b){ return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>" : "") +
          (P.said.length ? '<section class="shp-hints"><h2>' + esc(N.hints) + "</h2><ul>" + P.said.map(function(x){ return '<li><span class="shp-q">' + quote(x) + "</span> " + esc(x.take) + "</li>"; }).join("") + "</ul></section>" : "") +
          (P.skip.length ? '<section class="shp-skip"><h2>' + esc(N.skip) + "</h2><ul>" + P.skip.map(function(x){ return '<li><span class="shp-q">' + quote(x) + "</span> " + esc(x.take) + "</li>"; }).join("") + "</ul></section>" : "") +
        "</div>" +
        '<footer class="shp-foot"><span>' + esc((HX.C.name || HX.HUB) + " study hub · " + sheetUrl(lec)) + '</span><span data-shp-day>' + esc(today()) + "</span></footer>" +
        "</div>" +
        '<div class="shp-ruler"></div>';
    }
    /* the type size that fits one Letter page (7.5 x 10 inches inside half-inch margins), a little to spare for the printer */
    function fit(p){
      if (!p || !p.isConnected) return;
      var inn = $(".shp-in", p), max = $(".shp-ruler", p).offsetHeight * 0.97, fs = 10.5;
      if (!inn || !max) return;
      for (; fs > 7; fs -= 0.25) { p.style.setProperty("--shp-fs", fs + "pt"); if (inn.offsetHeight <= max) break; }
      p.style.setProperty("--shp-fs", fs + "pt");
      var one = inn.offsetHeight <= max;
      p.setAttribute("data-fit", one ? "1" : "2"); p.setAttribute("data-fs", String(fs));
      var f = $("[data-sheet-fit]"); if (f) f.textContent = one ? "Fits on one sheet of paper" : "Prints on two pages";
    }
    function paperNow(){ return $("body > .shp"); }
    function clear(){ var p = paperNow(); if (p) p.remove(); docEl.classList.remove("sh-sheet-on"); }
    function onSheet(){ return HX.view === "notes" && /\/sheet$/.test(HX.sub || ""); }
    /* leaving the sheet takes its printed copy away, so printing any other page prints that page (hub.js's own hashchange
       listener runs first and draws the next page; another lecture's sheet replaces this copy when it is drawn) */
    window.addEventListener("hashchange", function(){ if (!onSheet()) clear(); });
    window.addEventListener("beforeprint", function(){
      var p = paperNow(); if (!p || !onSheet()) return;
      var d = $("[data-shp-day]", p); if (d) d.textContent = today();
      fit(p); track("sheet:print");
    });

    /* ---------- the page ---------- */
    function draw(el, lec){
      if (!onSheet()) return;
      var P = parts(lec), N = names(), id = esc(lec.id);
      var sub = String(lec.title).split(":").slice(1).join(":").trim();
      var hasHy = !!((HX.NOTES || {}).hy || {})[lec.id], nLikely = (QBL[lec.id] || []).filter(function(r){ return r.likely; }).length;
      var L = HX.LECS, i = L.indexOf(lec), has = function(l){ var p = parts(l); return p.cram.length || p.topics.length; };
      var prev = null, next = null, k;
      for (k = i - 1; k >= 0 && !prev; k--) if (has(L[k])) prev = L[k];
      for (k = i + 1; k < L.length && !next; k++) if (has(L[k])) next = L[k];
      var nav = function(l, dir){ return '<a class="btn fn-' + dir + lc(l.id) + '" href="#notes/' + esc(l.id) + '/sheet" data-sheet-open="' + dir + '">' + (dir === "prev" ? icon("chevron", 20, "flip") : "") +
        "<span><small>" + (dir === "prev" ? "Previous sheet" : "Next sheet") + "</small><b>" + esc(lecLabel(l) + " · " + shortTitle(l)) + "</b></span>" + (dir === "next" ? icon("chevron", 20) : "") + "</a>"; };
      var empty = !P.cram.length && !P.topics.length;
      var art = '<article class="sheet' + lc(lec.id) + '" id="sheet-' + id + '" aria-labelledby="shtH">' +
        '<p class="sht-kick">' + icon("cram", 18) + "One-page sheet</p>" +
        '<h1 class="rd-title" id="shtH">' + HX.lecBadge(lec, "lb-h") + '<span class="sr">' + esc(lecLabel(lec)) + " · </span><span>" + esc(shortTitle(lec)) + "</span></h1>" + (sub ? '<p class="sub">' + esc(sub) + "</p>" : "") +
        '<p class="note">' + esc([lec.who, P.cram.length ? pl(P.cram.length, "cram line") : "", P.topics.length ? pl(P.topics.length, N.topic) : "", P.said.length ? pl(P.said.length, N.hint) : ""].filter(Boolean).join(" · ")) + "</p>" +
        (empty ? '<p class="notice">' + icon("cram", 20) + "<span>This lecture has no cram lines or " + esc(N.topicsIn) + " yet, so there's no sheet to print. Its notes have everything.</span></p>" :
        '<div class="toolbar sht-bar" role="toolbar" aria-label="Sheet tools">' +
          '<button type="button" class="btn btn-primary" data-sheet="print">' + icon("print", 18) + "Print or save as PDF</button>" +
          '<span class="note sht-fit" data-sheet-fit aria-live="polite"></span>' +
          (hasHy ? '<a class="btn" href="#notes/' + id + '" data-sheet="hy">' + icon("hints", 18) + "Read High yield</a>" : "") +
          '<a class="btn" href="#questions" data-lecq="' + id + '"' + (nLikely ? " data-lqlk" : "") + ">" + icon("questions", 18) + (nLikely ? "Practice the " + fmt(nLikely) + " " + esc(HX.likelyName()) + " questions" : "Practice " + esc(lecLabel(lec)) + " questions") + "</a>" +
        "</div>" +
        '<p class="note sht-from">Every line here is this lecture’s own, word for word: its cram sheet, its ' + esc(N.topicsIn) + (P.said.length || P.skip.length ? " and its " + esc(N.hintsIn) : "") + "." + (hasHy ? " The why behind each topic is in <b>High yield</b>, in the notes." : "") + "</p>" +
        '<div class="sht-cols">' +
          (P.topics.length ? '<section class="panel sht-topics" aria-labelledby="shtT"><h2 id="shtT">' + esc(N.topics) + '</h2><p class="note">' + esc(N.order) + ".</p><ol>" +
            P.topics.map(function(t){ return "<li><span>" + esc(t.t) + "</span>" + (t.basis ? ' <span class="note">' + esc(t.basis) + "</span>" : "") + "</li>"; }).join("") + "</ol></section>" : "") +
          (P.cram.length ? '<section class="panel cram sht-cram" aria-labelledby="shtC"><h2 id="shtC">Cram sheet</h2><ul>' + P.cram.map(function(b){ return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>" : "") +
          (P.said.length ? '<section class="panel sht-hints" aria-labelledby="shtH2"><h2 id="shtH2">' + esc(N.hints) + "</h2>" +
            P.said.map(function(x){ return '<figure class="hint' + (x.kind === "focus" ? " is-focus" : "") + '"><blockquote>' + quote(x) + '</blockquote><figcaption><span class="kind ' + esc(x.kind) + '">' + (x.kind === "focus" ? "Focus list" : "Know this") + "</span>" + esc(x.take) + "</figcaption></figure>"; }).join("") + "</section>" : "") +
          (P.skip.length ? '<section class="panel sht-skip" aria-labelledby="shtS"><h2 id="shtS">' + esc(N.skip) + "</h2>" +
            P.skip.map(function(x){ return '<figure class="hint"><blockquote>' + quote(x) + '</blockquote><figcaption><span class="kind deemphasize">' + esc(N.skip) + "</span>" + esc(x.take) + "</figcaption></figure>"; }).join("") + "</section>" : "") +
        "</div>") +
        (prev || next ? '<nav class="foot-nav sht-nav" aria-label="Other sheets">' + (prev ? nav(prev, "prev") : "") + (next ? nav(next, "next") : "") + "</nav>" : "") +
        "</article>";
      el.innerHTML = '<div class="hx-page sheet-page"><a class="btn btn-text back" href="#notes/' + id + '">' + icon("chevron", 18, "flip") + esc(lecLabel(lec)) + " notes</a>" + art + "</div>";
      track("sheet:open");
      var old = paperNow(); if (old) old.remove();
      docEl.classList.toggle("sh-sheet-on", !empty);
      if (!empty) {
        var p = document.createElement("div"); p.className = "shp"; p.setAttribute("aria-hidden", "true"); p.setAttribute("data-lec", lec.id);
        p.innerHTML = paperHTML(lec, P, N); document.body.appendChild(p);
        fit(p);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fit(p); });
      }
      var pr = $('[data-sheet="print"]', el);
      if (pr) pr.addEventListener("click", function(){ fit(paperNow()); try { window.print(); } catch (e) { HX.toast("This browser can't print from here. Use its Share or Print menu.", "info"); } });
      var hy = $('[data-sheet="hy"]', el);
      if (hy) hy.addEventListener("click", function(){ STATE.ui.level = "hy"; HX.saveState(); track("sheet:hy"); });
      HX.wireLecLinks(el);
    }
    return { ready: ready, draw: draw, clear: clear };
  };
})();
