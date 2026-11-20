/* ============ THE HUB ENGINE, on first use: a professor's study guide (widget/guide.js + guide.css) ============
   A professor's study guide, item by item (Sam, 2026-11-19, Heme & Endo Exam 3: "under notes, make a section for dr herrs
   study guide. have each item as a heading and have high yield explainer of everything we need to know about that topic"):
   study.json's guide, one entry per lecture on it ({ lec, items: [{ h, body }], more: [{ h, body }], terms: [{ t, d }] }), each
   heading the guide's own words with its explainer under it, then the lecture's sections that aren't on the guide (more:
   "Also stressed in class", "Said not needed"), then its key terms. Since the same day each explainer is short and opens with
   what the professor said in class (Sam: "the study guide is really long. can we combine the study guide with in class exam
   hints to make it much higher yield"): .gd-said, the quotes, from study.json's hints; .hy-know; .gd-trap. SH_HUB.notes.guide names it ({ title, sub, note }).
   It is #notes/guide, first in the notes' lecture list. widget/hub.js fetches this file the first time Notes opens on a hub
   whose study.json has a guide, so no other hub downloads it (Sam, 2026-11-19: "the study guide is only for this particular
   heme test"); the core keeps only the loader, the route, the search entries (exportSections) and their jump (SH_GOTO).
   Listen plays its Kokoro recording, audio/guide.mp3 (Sam, 2026-11-19: "add kokoro"), with Follow along, while notes.json's
   guideAudio says it was spoken from today's guide (tools/hub-next/build.mjs; the text is tools/hub-next/guide.mjs, the
   readable part of this page: what is marked data-sh-noread isn't in it); otherwise it reads the page in the device's
   voice, so it never drifts from the text. The highlighter works on it as on any notes. ============ */
(function(){
  "use strict";
  window.SH_GUIDE = function(HX){
    var $ = HX.$, $$ = HX.$$, esc = HX.esc, icon = HX.icon, pl = HX.pl, fmt = HX.fmt, lc = HX.lc, track = HX.track, toast = HX.toast,
      LBY = HX.LBY, QBL = HX.QBL, lecLabel = HX.lecLabel, shortTitle = HX.shortTitle, STATE = HX.STATE;
    var href = HX.WIDGET + "guide.css";
    var ready = new Promise(function(res){
      if ($('link[href="' + href + '"]')) { res(); return; }
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.onload = res; l.onerror = res; document.head.appendChild(l);
    });
    function info(){ var G = (HX.C.notes || {}).guide || {}; return { title: G.title || "Study guide", sub: G.sub || "", note: G.note || "" }; }
    function secs(){ var L = HX.LECS; return (HX.STUDY.guide || []).filter(function(g){ return LBY[g.lec]; }).sort(function(a, b){ return L.indexOf(LBY[a.lec]) - L.indexOf(LBY[b.lec]); }); }
    function badge(){ return '<span class="lb gd-lb" aria-hidden="true">' + icon("hints", 20) + "</span>"; }
    /* its row at the top of the notes' lecture list, and the phone's picker when it is the page open */
    function entry(cur){
      var s = secs(); if (!s.length) return "";
      var n = s.reduce(function(t, g){ return t + (g.items || []).length; }, 0);
      var span = lecLabel(LBY[s[0].lec]) + (s.length > 1 ? " to " + lecLabel(LBY[s[s.length - 1].lec]) : "");
      return '<li><a class="lec-item lec-guide" href="#notes/guide"' + (cur ? ' aria-current="page"' : "") + ">" + badge() +
        '<span class="lt"><b>' + esc(info().title) + '</b><small class="num">' + esc(pl(n, "item") + " · " + span) + "</small></span>" +
        (cur ? '<span class="sr">, open now</span>' : "") + "</a></li>";
    }
    function pick(){ return badge() + '<span class="lp-t"><b>' + esc(info().title) + "</b><small>Change to a lecture</small></span>"; }
    function draw(el){
      if (HX.view !== "notes") return;
      var I = info(), S = secs(), counts = HX.CORE.examCounts || {};
      var mp3 = !HX.AUDIO_OFF && (HX.NOTES || {}).guideAudio ? HX.ASSETS + "audio/guide.mp3" : "";
      /* the bank's study guide toggle, when the hub has one (SH_HUB.bank.only with basis "study guide"; Sam, 2026-11-20): each
         lecture's Practice button, and one for the whole guide, open the bank with it on, so only the guide's questions show */
      var GT = ((HX.C.bank || {}).only || []).filter(function(x){ return x[2] && /study guide/i.test(x[2].basis || ""); })[0];
      var gIds = GT && HX.lkBasis ? HX.lkBasis(GT[2].basis) : null;
      var gOf = function(id){ return (QBL[id] || []).filter(function(r){ return gIds[r.id]; }).length; };
      var gAll = gIds ? S.reduce(function(t, g){ return t + gOf(g.lec); }, 0) : 0;
      var body = S.map(function(g){
        var l = LBY[g.lec], n = counts[l.id], nG = gIds ? gOf(l.id) : 0, nLikely = nG || (QBL[l.id] || []).filter(function(r){ return r.likely; }).length;
        return '<section class="gd-lec' + lc(l.id) + '" id="gd-' + esc(l.id) + '" aria-labelledby="gdh-' + esc(l.id) + '">' +
          '<h2 class="gd-h" id="gdh-' + esc(l.id) + '"><span data-sh-noread>' + HX.lecBadge(l) + "</span><span>" + esc(lecLabel(l) + " · " + shortTitle(l)) + "</span></h2>" +
          '<p class="note gd-meta" data-sh-noread>' + esc(l.who) + (n ? " · " + pl(n, "question") + " on the exam" : "") + "</p>" +
          (g.items || []).map(function(it){ return '<h3 class="gd-item">' + esc(it.h) + "</h3>" + (it.body || ""); }).join("") +
          (g.more || []).map(function(it){ return '<h3 class="gd-item gd-more">' + esc(it.h) + "</h3>" + (it.body || ""); }).join("") +   // not on the guide: what else was said in class
          ((g.terms || []).length ? '<h3 class="gd-item">Key terms</h3><dl class="gd-terms">' + g.terms.map(function(t){ return "<div><dt>" + esc(t.t) + "</dt><dd>" + t.d + "</dd></div>"; }).join("") + "</dl>" : "") +
          '<p class="gd-acts" data-sh-noread><a class="btn" href="#notes/' + esc(l.id) + '">' + icon("notes", 18) + esc(lecLabel(l)) + "'s notes</a>" +
            '<a class="btn" href="#questions" data-lecq="' + esc(l.id) + '"' + (nG ? ' data-lqlk="' + esc(GT[0]) + '"' : nLikely ? " data-lqlk" : "") + ">" + icon("questions", 18) + (nG ? "Practice its " + fmt(nG) + " study guide questions" : nLikely ? "Practice its " + fmt(nLikely) + " High likelihood questions" : "Practice " + esc(lecLabel(l)) + " questions") + "</a></p>" +
          "</section>";
      }).join("");
      var art = '<article class="reading guide" id="guide">' +
        '<h1 class="rd-title">' + badge() + "<span>" + esc(I.title) + "</span></h1>" + (I.sub ? '<p class="sub">' + esc(I.sub) + "</p>" : "") +
        (I.note ? '<p class="note lec-note">' + esc(I.note) + "</p>" : "") +
        '<div class="toolbar" role="toolbar" aria-label="Study guide tools">' +
          '<button type="button" class="btn sh-tts-btn" id="sh-tts-btn"' + (mp3 ? ' data-sh-tts-audio="1"' : ' title="Read aloud in your device\'s voice"') + ' aria-label="Listen to the study guide">' + icon("listen", 18) + '<span class="sh-tts-label-play">Listen</span><span class="sh-tts-label-pause">Pause</span></button>' +
          (HX.followBtn ? HX.followBtn() : "") +   // an engine from before it had one: no toggle
          '<button type="button" class="btn btn-text" data-report-notes>' + icon("report", 18) + "Report a mistake</button>" +
          '<span class="note tool-tip">' + icon("highlight", 18) + "Select text to highlight it</span>" +
        "</div>" +
        '<nav class="gd-jump" aria-label="Lectures on the guide">' + S.map(function(g){ var l = LBY[g.lec]; return '<button type="button" class="chip gd-chip' + lc(l.id) + '" data-gdjump="' + esc(l.id) + '"><span class="ld" aria-hidden="true"></span>' + esc(lecLabel(l) + " " + shortTitle(l)) + "</button>"; }).join("") + "</nav>" +
        (gAll ? '<p class="gd-acts gd-all" data-sh-noread><a class="btn btn-primary" href="#questions" data-gdall>' + icon("questions", 18) + "Practice all " + fmt(gAll) + " study guide questions</a></p>" : "") +
        '<div class="reading-prose gd">' + body + "</div>" +
        '<p class="foot-report"><button class="btn btn-text" type="button" data-report-notes>' + icon("report", 18) + "Report a mistake in the study guide</button></p>" +
        "</article>";
      el.innerHTML = '<div class="hx-page notes"><div class="notes-grid">' + HX.lecListHTML(LBY[STATE.ui.lec] || HX.LECS[0], true) + art + "</div></div>";
      var prose = $(".reading-prose", el);
      HX.wireLecPick(el);
      $$("[data-gdjump]", el).forEach(function(b){ b.addEventListener("click", function(){ var s = document.getElementById("gd-" + b.getAttribute("data-gdjump")); if (s) s.scrollIntoView({ block: "start", behavior: HX.reduced ? "auto" : "smooth" }); track("notes:guide-jump"); }); });
      var tts = $("#sh-tts-btn", el);
      if (tts) tts.addEventListener("click", function(){ if (window.shTTS) window.shTTS.speak(prose, tts, mp3); });
      if (HX.wireFollow) HX.wireFollow(el, prose, mp3);
      $$("[data-report-notes]", el).forEach(function(b){ b.addEventListener("click", function(){
        track("notes:report"); if (window.shOpenFlag) window.shOpenFlag({ lec: "guide", label: I.title }); else toast("The report form is still loading. Try again in a moment.");
      }); });
      HX.wireLecLinks(el);
      $$("[data-gdall]", el).forEach(function(a){ a.addEventListener("click", function(){ var U = STATE.ui; U.qset = ""; U.qlec = "all"; U.qstatus = "all"; U.qlikely = GT[0]; U.qfmt = "all"; U.qsrc = "all"; HX.saveState(); track("notes:practice-guide-all"); }); });
      track("notes:guide");
    }
    return { ready: ready, entry: entry, pick: pick, draw: draw };
  };
})();
