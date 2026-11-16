/* Heme & Endo Exam 3's drawn figures for the engine (widget/hub.js): the anima figures, built between the markers by
   node tools/figures/heme-endo-exam3/build.mjs from the files in tools/figures/heme-endo-exam3/ (edit those, then run the
   build), and FIG_PLACE, edited here: where each figure sits inside a lecture's notes, matched by the start of a
   paragraph or heading's text at each reading level ({ full, plain, figs: [ids] }); a lecture's figures not placed
   there show under its notes ("Diagrams", core.json's figByLec). */
window.SH_FIGURES = function(env){
'use strict';
var FIGS = {};
var FIG_PLACE = {};
/* anima:js begin (built from tools/figures/heme-endo-exam3; edit there) */
var ANIMA = (function(){
  var FIGS = {};

  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* noTitle: the caller heads it (Review sections use their own h3). The figures use no SVG ids, so copies can repeat. */
  function html(key, noTitle){ var f = FIGS[key]; if(!f) return ""; return '<figure class="lec-fig">' + (noTitle ? '' : '<h4>' + esc(f.title) + '</h4>') + '<p class="lec-fig-cap">' + esc(f.caption) + '</p>' + f.html + '</figure>'; }
  function mount(scope){ Array.prototype.forEach.call(scope.querySelectorAll("[data-anima]"), function(el){ if(el.__animaOn) return; var f = FIGS[el.getAttribute("data-anima")]; if(!f) return; el.__animaOn = 1; try { f.live(el, f.data); } catch(e){ if(window.console) console.error("anima figure failed", e); } }); }
  function meta(key){ var f = FIGS[key]; return f ? { title: f.title, caption: f.caption, lec: f.lec } : null; }
  return { html: html, mount: mount, meta: meta };
})();
/* anima:js end */
return { OD: null, FIGS: FIGS, FIG_PLACE: FIG_PLACE, CASE_IMG: {}, caseImgHTML: function(){ return ""; }, cuspMapHTML: function(){ return ""; }, wireCuspMaps: function(){}, CUSP_GAME: { mount: function(){} }, ANIMA: ANIMA };
};
