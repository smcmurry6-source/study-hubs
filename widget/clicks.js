/* study-hubs click analytics: counts clicks on buttons, tabs and links, and sends the counts
   once a minute (and when the tab is hidden) to record_clicks. Anonymous: it sends the visitor id
   the rest of the widget already uses, the section (e.g. "compendium/notes") and a short target
   name, never what anyone typed. Used by widget/v3.js (hubs) and the dashboard:
     shClicks.start({ sb: supabaseClient, hub: "perio", visitor: "...", section: function(){ return "..."; } }) */
(function(){
  "use strict";
  if (window.shClicks) return;
  /* attributes that identify one question/choice rather than a feature; their values would
     explode the list, so they're skipped when naming a target */
  var SKIP = /^data-(qid|q|idx|i|pick|choice|choice-idx|answer|opt|n|key|k|id|flag|sh-flag|seq|match|pair|step|card|lec-q)$/;
  function clean(t){ return String(t || "").replace(/\s+/g, " ").trim().slice(0, 48); }
  function nameOf(el){
    var root = el.closest("#shstat-root, .sh-egg, #shstat-panel, #shstat-searchpanel, #shstat-settingspanel, #shstat-flagpanel, #shstat-suggestpanel");
    var prefix = root ? "widget:" : "";
    if (el.id && !/\d{3,}/.test(el.id)) return prefix + "#" + el.id;
    for (var i = 0; i < el.attributes.length; i++){
      var a = el.attributes[i];
      if (a.name.indexOf("data-") !== 0 || SKIP.test(a.name) || !a.value || a.value.length > 40) continue;
      /* keep names (modes, lecture ids); collapse numbers and question-like ids */
      var v = /^\d+$/.test(a.value) || /^[a-z]{0,3}\d+[-_]/i.test(a.value) ? "#" : a.value;
      return prefix + a.name.slice(5) + "=" + v;
    }
    var cls = (el.className && typeof el.className === "string") ? el.className.split(/\s+/)[0] : "";
    if (cls && /choice|opt|ans|cell|tile|hole|card/.test(cls)) return prefix + "." + cls;
    var label = clean(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent);
    if (!label) return "";
    return prefix + label.replace(/\d+/g, "#");
  }
  window.shClicks = {
    start: function(o){
      if (!o || !o.sb || !o.hub) return;
      var pending = {}, count = 0;
      function flush(){
        if (!count) return;
        var items = Object.keys(pending).slice(0, 80).map(function(k){ var p = k.split("\u0001"); return { s: p[0], t: p[1], n: pending[k] }; });
        pending = {}; count = 0;
        try { o.sb.rpc("record_clicks", { p_hub: o.hub, p_visitor: o.visitor || null, p_items: items }).then(function(){}, function(){}); } catch (e) {}
      }
      document.addEventListener("click", function(e){
        var el = e.target && e.target.closest && e.target.closest('button, a[href], [role="tab"], [role="button"], summary, label, [data-mode], [data-view]');
        if (!el) return;
        var t = nameOf(el);
        if (!t) return;
        var s = ""; try { s = String((o.section && o.section()) || "").slice(0, 80); } catch (err) {}
        var k = s + "\u0001" + t;
        pending[k] = (pending[k] || 0) + 1; count++;
        if (count >= 60) flush();
      }, true);
      setInterval(flush, 60000);
      document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") flush(); });
      window.addEventListener("pagehide", flush);
    }
  };
})();
