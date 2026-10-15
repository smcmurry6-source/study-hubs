/* Highlighter for lecture notes (student suggestion #5, 2026-10-15). Loaded by widget/v3.js in every hub.
   Select text inside a hub's narrated notes (.reading-prose) and a "Highlight" button appears; tap a highlight to remove
   it or clear the page. Highlights are drawn as <mark class="sh-hl"> around the existing text nodes, so the notes text
   (and its narration) never changes, and the Listen word-highlighting keeps working inside them.
   Saved on this device only (localStorage "sh_hl:<hub>:<hash of the notes text>", a list of [start, end] character
   offsets in the notes' textContent). If a lecture's text is rewritten, its hash changes and old highlights drop off
   rather than landing on the wrong words. */
(function(){
  if (window.shHighlight) return;
  var HUB = "hub", SEL = ".reading-prose";
  var bar = null, pending = null, menu = null;

  function hash(s){ var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
  function keyOf(el){ return "sh_hl:" + HUB + ":" + hash(el.textContent || ""); }
  function load(k){ try { var v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save(k, list){ try { if (list.length) localStorage.setItem(k, JSON.stringify(list)); else localStorage.removeItem(k); } catch (e) {} }

  function textNodes(el){
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function(n){
      var p = n.parentNode; return p && /^(SCRIPT|STYLE)$/i.test(p.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function offsetOf(el, node, off){
    if (node.nodeType !== 3) {
      // a range boundary on an element: count the text before its off-th child
      var r = document.createRange(); r.selectNodeContents(el); r.setEnd(node, off);
      return r.toString().length;
    }
    var nodes = textNodes(el), sum = 0;
    for (var i = 0; i < nodes.length; i++) { if (nodes[i] === node) return sum + off; sum += nodes[i].nodeValue.length; }
    return -1;
  }
  function merge(list){
    list = list.filter(function(r){ return r[1] > r[0]; }).sort(function(a, b){ return a[0] - b[0]; });
    var out = [];
    list.forEach(function(r){ var last = out[out.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([r[0], r[1]]); });
    return out;
  }
  function unwrap(el){
    Array.prototype.slice.call(el.querySelectorAll("mark.sh-hl")).forEach(function(m){
      var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m);
    });
  }
  function wrap(el, start, end, idx){
    var nodes = textNodes(el), sum = 0;
    nodes.forEach(function(n){
      var len = n.nodeValue.length, a = Math.max(start, sum), b = Math.min(end, sum + len);
      if (b > a && /\S/.test(n.nodeValue.slice(a - sum, b - sum))) {
        var mid = n;
        if (a - sum > 0) mid = mid.splitText(a - sum);
        if (b - a < mid.nodeValue.length) mid.splitText(b - a);
        var m = document.createElement("mark"); m.className = "sh-hl"; m.setAttribute("data-hl", String(idx));
        mid.parentNode.insertBefore(m, mid); m.appendChild(mid);
      }
      sum += len;
    });
  }
  function paint(el){
    unwrap(el);
    var k = keyOf(el), list = load(k);
    list.forEach(function(r, i){ wrap(el, r[0], r[1], i); });
    el.__shHlKey = k;
  }

  /* ---- the "Highlight" button for a fresh selection ---- */
  function hideBar(){ if (bar) bar.hidden = true; pending = null; }
  function hideMenu(){ if (menu) menu.hidden = true; }
  function place(box, rect){
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    box.hidden = false;
    var w = box.offsetWidth, h = box.offsetHeight;
    var top = rect.bottom + 10; if (top + h > vh - 8) top = Math.max(8, rect.top - h - 10);
    var left = Math.min(vw - w - 8, Math.max(8, rect.left + rect.width / 2 - w / 2));
    box.style.top = top + "px"; box.style.left = left + "px";
  }
  function barEl(){
    if (bar) return bar;
    bar = document.createElement("div"); bar.className = "sh-hl-pop"; bar.hidden = true;
    bar.innerHTML = '<button type="button" class="sh-hl-btn"><span class="sh-hl-swatch"></span>Highlight</button>';
    var keep = function(e){ e.preventDefault(); };
    bar.addEventListener("mousedown", keep); bar.addEventListener("touchstart", keep, { passive: false });
    bar.querySelector("button").addEventListener("click", function(){
      if (!pending) return;
      var p = pending, k = keyOf(p.el), list = load(k);
      list.push([p.start, p.end]); save(k, merge(list)); paint(p.el);
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      hideBar();
    });
    document.body.appendChild(bar);
    return bar;
  }
  function checkSelection(){
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideBar(); return; }
    var r = sel.getRangeAt(0), anc = r.commonAncestorContainer;
    var el = (anc.nodeType === 1 ? anc : anc.parentNode).closest && (anc.nodeType === 1 ? anc : anc.parentNode).closest(SEL);
    if (!el) { hideBar(); return; }
    var start = offsetOf(el, r.startContainer, r.startOffset), end = offsetOf(el, r.endContainer, r.endOffset);
    if (start < 0 || end <= start || !/\S/.test(r.toString())) { hideBar(); return; }
    pending = { el: el, start: start, end: end };
    hideMenu();
    var rects = r.getClientRects(), last = rects.length ? rects[rects.length - 1] : r.getBoundingClientRect();
    place(barEl(), last);
  }

  /* ---- tap a highlight: remove it or clear this page ---- */
  function menuEl(){
    if (menu) return menu;
    menu = document.createElement("div"); menu.className = "sh-hl-pop"; menu.hidden = true;
    menu.innerHTML = '<button type="button" class="sh-hl-btn" data-hl-act="remove">Remove highlight</button>' +
      '<button type="button" class="sh-hl-btn sh-hl-quiet" data-hl-act="clear">Clear all on this page</button>';
    menu.addEventListener("click", function(e){
      var b = e.target.closest("[data-hl-act]"); if (!b || !menu.__el) return;
      var el = menu.__el, k = keyOf(el), list = load(k);
      if (b.getAttribute("data-hl-act") === "clear") { if (!window.confirm("Clear every highlight in these notes?")) return; list = []; }
      else list.splice(menu.__idx, 1);
      save(k, list); paint(el); hideMenu();
    });
    document.body.appendChild(menu);
    return menu;
  }
  document.addEventListener("click", function(e){
    if (menu && !menu.hidden && !e.target.closest(".sh-hl-pop")) hideMenu();
    var m = e.target.closest && e.target.closest("mark.sh-hl");
    if (!m) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed) return;
    var el = m.closest(SEL); if (!el) return;
    var box = menuEl(); box.__el = el; box.__idx = +m.getAttribute("data-hl");
    hideBar(); box.__y = window.scrollY; place(box, m.getBoundingClientRect());
  });

  var selTimer = 0;
  document.addEventListener("selectionchange", function(){ clearTimeout(selTimer); selTimer = setTimeout(checkSelection, 220); });
  window.addEventListener("scroll", function(){
    if (menu && !menu.hidden && Math.abs(window.scrollY - (menu.__y || 0)) > 40) hideMenu();
    if (bar && !bar.hidden) checkSelection();
  }, { passive: true });

  /* ---- keep highlights drawn as hubs render notes ---- */
  var queued = false;
  function scan(){
    queued = false;
    Array.prototype.forEach.call(document.querySelectorAll(SEL), function(el){
      if (el.__shHlKey !== keyOf(el) || (load(el.__shHlKey).length && !el.querySelector("mark.sh-hl"))) paint(el);
    });
  }
  function queue(){ if (queued) return; queued = true; setTimeout(scan, 120); }

  window.shHighlight = {
    mount: function(hub){
      HUB = hub || HUB;
      scan();
      try { new MutationObserver(function(muts){
        for (var i = 0; i < muts.length; i++) { var t = muts[i].target; if (t.closest && (t.closest(SEL) || t.querySelector && t.querySelector(SEL))) { queue(); return; } }
      }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
  };
})();
