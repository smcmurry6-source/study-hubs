/* ============ ASK TIMMY: the chat (widget/ask.js + widget/ask.css) ============
   The redesign's study assistant (vault/tasks/2026-11-12-redesign-ask-timmy.md, part 2; the server is
   supabase/functions/timmy/, how it works: vault/reference/ask-timmy.md). Loaded only by the new pages: a redesigned hub
   (widget/hub-timmy.js loads it with the shared widget) and the new dashboard (widget/dash.js, with its late scripts).
   Nothing on a live hub loads it, so nothing here reaches the class before the redesign's release.

   What it draws:
   - the chat: a bottom sheet on a phone, a side panel on a laptop. Above the box, what he answers from and that chats are
     saved to help improve the hub (Sam, 2026-11-12). Starter chips, past chats on this hub, a new chat;
   - each of Timmy's answers: its paragraphs, a "From the notes" link for every quote the server checked (to the very
     paragraph), a "go" button (the notes, practice on a lecture, the Daily drill), the closest lecture when the notes don't
     cover it, a drafted report or idea to edit and send (nothing is sent without the student's tap), thumbs, and Report
     (Sam, 2026-11-12: "so if timmy gives an error or bad answer or something, you can report it and we can fix what went
     wrong"), on a nap or an error too;
   - the Ask icon in Timmy's spot whenever he isn't shown on the page (turned off, Dashboard only, Focus mode, or not adopted
     yet; Sam: "if someone turns timmy off in the settings, he is replaced with an icon in the same place that you can click
     on to ask the hub"). On a hub that's the bottom-left corner; on the dashboard, the "you" card. Without Timmy the chat
     speaks in a plain "Ask the hub" voice, with the same rules;
   - "Ask Timmy" on an answered question (widget/hub-bank.js puts the button in the card's after-answer row; this file
     opens the chat with the question attached). Before it's answered he gives neither hints nor the answer.
   Paused during a mock exam (the chat says why), and not on an archived hub.

   Privacy (vault/rules/learner-data-privacy.md): what a student types and what Timmy says are drawn as text, never as
   markup; every button has a fixed data-ska value, so click counts (widget/clicks.js) never record anyone's words; the
   feature events are ask:<what> with no free text.

   shAsk.mount(o)   o: { where: "hub" | "dashboard", hub, name, sb (a client or a function giving one), section(),
                         place() ({ lec, k }: where in the notes), lecName(lec, hub), go(g) (open a link on this page),
                         href(hub) (a hub's page, dashboard), hubs() (the live hubs: [{ id, name, content, stateKey }],
                         dashboard), core(), state(), exam (a hub's: what "What should I study tonight?" reads),
                         answeredEvent, about (the About page), spot() (the dashboard's place for the Ask button),
                         archived(), mock() }
   shAsk.open({ from, text, ask: { qid, right, picks, label } })   shAsk.close()   shAsk.available()   shAsk.voice()
   ============ */
(function(){
  "use strict";
  if (window.shAsk) return;
  var SELF = "";
  try { SELF = document.currentScript.src; } catch (e) {}
  var docEl = document.documentElement;
  var reduced = false; try { reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var MAX = 1000, TIMEOUT = 45000, KEEP_HOURS = 6;

  /* ---------- small helpers ---------- */
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function track(k){ try { if (window.shTrack) window.shTrack("ask:" + k); } catch (e) {} }
  function visitor(){ return ls("sh_visitor_id") || ""; }
  function rid(){
    var a = new Uint8Array(16), out = "", abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < 16; j++) out += abc[a[j] & 63];
    return out;
  }
  function ymd(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function el(tag, cls, attrs){ var e = document.createElement(tag); if (cls) e.className = cls; Object.keys(attrs || {}).forEach(function(k){ e.setAttribute(k, attrs[k]); }); return e; }
  function txt(tag, cls, t){ var e = el(tag, cls); e.textContent = t == null ? "" : String(t); return e; }
  function btn(ska, label, cls, ic){
    var b = el("button", "ska-btn" + (cls ? " " + cls : ""), { type: "button", "data-ska": ska });
    if (ic) b.insertAdjacentHTML("beforeend", icon(ic, 18));
    if (label) b.appendChild(txt("span", "", label));
    return b;
  }
  /* the hubs' own icons (widget/hub-art.js) where there's one, a few of this file's own otherwise */
  var OWN = {
    send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    ask: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10.5L6 20v-4h-.5A1.5 1.5 0 0 1 4 14.5z"/><path d="M9.9 8.1a2.2 2.2 0 1 1 3.1 2c-.6.3-1 .8-1 1.5"/><path d="M12 14h.01"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    clock: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>'
  };
  function icon(k, px){
    var A = window.SH_HUB_ART, b = OWN[k] || (A && A.icons && A.icons[k] ? A.icons[k].body : OWN.ask);
    px = px || 20;
    return '<svg class="ska-ic" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>";
  }
  /* the stylesheet loads only when something of the chat is drawn (the Ask icon or button, or the chat itself), so a page
     where Timmy is shown and nobody asks doesn't download it (the new dashboard's request budget, tools/release/budgets.json) */
  var cssP = null, cssDone = false;
  function css(){
    if (cssP) return cssP;
    cssP = new Promise(function(ok){
      var l = document.querySelector('link[href*="widget/ask.css"], link[href$="ask.css"]');
      function done(){ cssDone = true; ok(); }
      if (l) { if (l.sheet) done(); else { l.addEventListener("load", done); l.addEventListener("error", done); setTimeout(done, 8000); } return; }
      l = document.createElement("link"); l.rel = "stylesheet"; l.href = SELF ? SELF.replace(/ask\.js(\?.*)?$/, "ask.css") : "ask.css";
      l.onload = l.onerror = done; setTimeout(done, 8000);
      document.head.appendChild(l);
    });
    return cssP;
  }
  function loadScript(src){
    return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.async = true; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  function widgetUrl(f){ return SELF ? SELF.replace(/ask\.js(\?.*)?$/, f) : f; }

  /* ---------- the page it's on ---------- */
  var O = null;
  function opt(k){ var v = O && O[k]; try { return typeof v === "function" ? v() : v; } catch (e) { return null; } }
  function sb(){ return opt("sb") || window.shSupabase || null; }
  function isDash(){ return !!O && O.where === "dashboard"; }
  function hubId(){ return isDash() ? "dashboard" : (O && O.hub) || ""; }
  function hubName(id){
    if (!id || id === "dashboard") return "";
    var hs = isDash() ? (opt("hubs") || []) : [{ id: O.hub, name: O.name }];
    for (var i = 0; i < hs.length; i++) if (hs[i].id === id) return hs[i].name || id;
    var T = window.SH_DASH_ART && window.SH_DASH_ART.tints; return (T && T[id] && T[id].name) || id;
  }
  function pref(k){ return ls(k) || "on"; }
  /* Timmy on this page: on a hub, pet.js sets html.sh-pet-on while he's in his corner; on the dashboard, his house */
  function timmyHere(){
    if (isDash()) return !!document.querySelector("#petHome.shpet-house:not([hidden])");
    return docEl.classList.contains("sh-pet-on");
  }
  /* he should be there once his script has loaded (so the icon doesn't flash up in his spot first) */
  function timmyDue(){
    if (pref("sh_pref_pet") === "off" || ls("sh_pref_focus") === "on" || !ls("sh_pet_born")) return false;
    return isDash() || pref("sh_pref_pet") !== "dash";
  }
  function voice(){ return timmyHere() ? "timmy" : "plain"; }
  function archived(){ return !isDash() && !!opt("archived"); }
  function mockOn(){
    if (isDash()) return false;
    if (docEl.classList.contains("sh-mock-on")) return true;
    var s = String(opt("section") || ""); return /(^|\/)mock(\/|$)/.test(s);
  }
  function available(){ return !!O && !archived(); }

  /* ---------- the chat's state ---------- */
  var S = { chat: null, busy: false, attach: null, started: false, past: null, opener: null, lastBody: null, ended: "", seen: {} };
  /* answers this page recorded, so "Ask Timmy" waits until the database has the answer (the server reads it there) */
  var answered = {}, paid = {};

  /* ======================= the panel ======================= */
  var P = null;   /* { root, panel, log, form, input, starters, attach, past, foot, title, sub, av, note, count } */
  function build(){
    if (P) return P;
    css();
    var root = el("div", "ska", { "data-ska-root": "" }); root.hidden = true;
    var scrim = el("div", "ska-scrim"); scrim.addEventListener("click", function(){ close(); });
    var panel = el("section", "ska-panel", { role: "dialog", "aria-modal": "false", "aria-labelledby": "skaT", tabindex: "-1" });
    var head = el("header", "ska-head");
    var av = el("span", "ska-av", { "aria-hidden": "true" });
    var tt = el("div", "ska-tt"); var title = el("h2", "", { id: "skaT" }), sub = el("p", "ska-sub");
    tt.appendChild(title); tt.appendChild(sub);
    var bPast = el("button", "ska-ib", { type: "button", "data-ska": "past", "aria-label": "Past chats", title: "Past chats" }); bPast.innerHTML = icon("clock", 20);
    var bNew = el("button", "ska-ib", { type: "button", "data-ska": "new", "aria-label": "New chat", title: "New chat" }); bNew.innerHTML = icon("plus", 20);
    var bX = el("button", "ska-ib", { type: "button", "data-ska": "close", "aria-label": "Close", title: "Close" }); bX.innerHTML = icon("close", 20);
    [av, tt, bPast, bNew, bX].forEach(function(x){ head.appendChild(x); });
    var note = el("p", "ska-note");
    var log = el("div", "ska-log", { role: "log", "aria-live": "polite", "aria-relevant": "additions text", "aria-label": "The chat" });
    var past = el("div", "ska-pastlist"); past.hidden = true;
    var foot = el("div", "ska-foot");
    var starters = el("div", "ska-starters", { role: "group", "aria-label": "Ideas to ask" });
    var attach = el("div", "ska-attach"); attach.hidden = true;
    var form = el("form", "ska-form");
    var lab = el("label", "sr", { "data-ska": "in", "for": "skaIn" }); lab.textContent = "Your question";
    var input = el("textarea", "ska-in", { id: "skaIn", rows: "1", maxlength: String(MAX), autocomplete: "off", enterkeyhint: "send" });
    var sendB = el("button", "ska-send", { type: "submit", "data-ska": "send", "aria-label": "Send" }); sendB.innerHTML = icon("send", 22);
    form.appendChild(lab); form.appendChild(input); form.appendChild(sendB);
    var count = el("p", "ska-count", { "aria-live": "polite" }); count.hidden = true;
    var paused = el("p", "ska-paused"); paused.hidden = true;
    [starters, attach, form, count, paused].forEach(function(x){ foot.appendChild(x); });
    [head, note, log, past, foot].forEach(function(x){ panel.appendChild(x); });
    root.appendChild(scrim); root.appendChild(panel);
    document.body.appendChild(root);
    P = { root: root, panel: panel, log: log, form: form, input: input, send: sendB, starters: starters, attach: attach, past: past, foot: foot, title: title, sub: sub, av: av, note: note, count: count, paused: paused, bPast: bPast, bNew: bNew };

    bX.addEventListener("click", function(){ close(); });
    bNew.addEventListener("click", function(){ track("new"); newChat(); });
    bPast.addEventListener("click", function(){ if (P.past.hidden) showPast(); else hidePast(); });
    panel.addEventListener("keydown", function(e){ if (e.key === "Escape") { e.stopPropagation(); close(); } });
    form.addEventListener("submit", function(e){ e.preventDefault(); send0(); });
    input.addEventListener("keydown", function(e){
      /* Enter sends on a keyboard; Shift+Enter is a new line. A phone's Return key adds a line (it has the send button) */
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !touch()) { e.preventDefault(); send0(); }
    });
    input.addEventListener("input", function(){ grow(); counter(); });
    function send0(){ var t = P.input.value; if (!t.trim() || S.busy) return; send(t, {}); }
    return P;
  }
  function touch(){ try { return matchMedia("(hover: none) and (pointer: coarse)").matches; } catch (e) { return false; } }
  function phone(){ try { return matchMedia("(max-width: 760px)").matches; } catch (e) { return false; } }
  function grow(){ var i = P.input; i.style.height = "auto"; i.style.height = Math.min(i.scrollHeight, 140) + "px"; }
  function counter(){
    var n = P.input.value.length;
    P.count.hidden = n < MAX - 150;
    P.count.textContent = n > MAX ? "That's over 1,000 characters: shorten it a little." : (MAX - n) + " characters left";
  }
  /* the header, the line above the box and the starters, in the voice of the moment */
  function dress(){
    var v = voice(), dash = isDash(), name = O.name || "this hub";
    P.root.setAttribute("data-voice", v);
    P.title.textContent = v === "timmy" ? "Ask Timmy" : "Ask the hub";
    P.sub.textContent = dash ? "From the live hubs' notes" : "From " + name + "'s notes";
    var art = "";
    if (v === "timmy" && window.shPet && window.shPet.art) { try { var hp = null; try { hp = window.shPet.hp(); } catch (e) {} art = window.shPet.art({ hp: hp == null ? 85 : hp, mood: "happy" }, 44); } catch (e) { art = ""; } }
    P.av.innerHTML = art || icon("ask", 26);
    P.av.classList.toggle("is-icon", !art);
    P.note.textContent = (v === "timmy" ? "Timmy answers" : "Answers come") + " from " + (dash ? "the live hubs' notes" : "this hub's notes") +
      " only, with Claude, Anthropic's AI. Chats are saved to help improve the hub.";
    setBusy(S.busy);
    paintPaused();
    drawStarters();
  }
  function paintPaused(){
    var m = mockOn();
    P.form.hidden = m; P.starters.hidden = m || S.started; P.attach.hidden = m || !S.attach;
    P.paused.hidden = !m;
    P.paused.textContent = m ? (voice() === "timmy" ? "No help from me during a mock exam: it's your test. I'll be here when you finish." : "Paused during the mock exam: it's your test.") : "";
  }
  function drawStarters(){
    var host = P.starters; host.innerHTML = "";
    var list = [["tonight", "What should I study tonight?"]];
    var pl = isDash() ? null : opt("place");
    if (isDash()) list.push(["exams", "When are my exams?"], ["site", "What can this site do?"]);
    else {
      if (pl && pl.lec) list.push(["simple", "Explain this lecture simply"]);
      list.push(["likely", "What's most likely on the exam?"], ["site", "How do I use this hub?"]);
    }
    list.forEach(function(s){
      var b = el("button", "ska-chip", { type: "button", "data-ska": "starter-" + s[0] }); b.textContent = s[1];
      b.addEventListener("click", function(){ track("starter=" + s[0]); send(s[1], { progress: s[0] === "tonight" }); });
      host.appendChild(b);
    });
    host.hidden = S.started || mockOn();
  }
  function drawAttach(){
    var a = S.attach, host = P.attach; host.innerHTML = "";
    host.hidden = !a || mockOn();
    if (!a) return;
    host.appendChild(txt("span", "ska-attach-l", "About the question you answered"));
    if (a.label) host.appendChild(txt("span", "ska-attach-q", a.label.length > 110 ? a.label.slice(0, 108) + "…" : a.label));
    var x = el("button", "ska-x", { type: "button", "data-ska": "unattach", "aria-label": "Don't ask about this question" }); x.innerHTML = icon("close", 16);
    x.addEventListener("click", function(){ S.attach = null; drawAttach(); P.input.focus(); });
    host.appendChild(x);
  }

  /* ======================= open and close ======================= */
  function open(o){
    o = o || {};
    if (!O) return;
    if (!cssDone) { css().then(function(){ open(o); }); return; }
    build();
    if (archived()) return;
    var was = !P.root.hidden;
    S.opener = was ? S.opener : document.activeElement;
    P.panel.setAttribute("aria-modal", String(phone()));
    P.root.hidden = false;
    docEl.classList.add("ska-open");
    requestAnimationFrame(function(){ P.root.classList.add("is-on"); });
    if (o.ask && o.ask.qid) { S.attach = { qid: String(o.ask.qid), right: o.ask.right === true ? true : o.ask.right === false ? false : null, picks: Array.isArray(o.ask.picks) ? o.ask.picks.slice(0, 12) : [], label: o.ask.label || "" }; }
    dress(); drawAttach(); hidePast();
    if (o.text != null) { P.input.value = String(o.text).slice(0, MAX); grow(); counter(); }
    if (!was) track("open=" + (o.from || "other"));
    if (!S.started && !S.loaded) resume();
    if (!touch() || o.text != null) { try { P.input.focus(); var n = P.input.value.length; P.input.setSelectionRange(n, n); } catch (e) {} }
    else { try { P.panel.focus(); } catch (e) {} }
    scrollEnd();
  }
  function close(){
    if (!P || P.root.hidden) return;
    P.root.classList.remove("is-on"); docEl.classList.remove("ska-open");
    setTimeout(function(){ if (!P.root.classList.contains("is-on")) P.root.hidden = true; }, reduced ? 0 : 220);
    var back = S.opener; S.opener = null;
    if (back && back.isConnected && back.focus) { try { back.focus(); } catch (e) {} }
  }
  function isOpen(){ return !!P && !P.root.hidden; }
  function scrollEnd(){ if (P) requestAnimationFrame(function(){ P.log.scrollTop = P.log.scrollHeight; }); }

  /* ======================= the server ======================= */
  function rpc(fn, args){
    var c = sb(); if (!c) return Promise.resolve({ fail: true });
    try { return c.rpc(fn, args).then(function(r){ return r && !r.error ? { data: r.data } : { fail: true, error: r && r.error }; }, function(){ return { fail: true }; }); }
    catch (e) { return Promise.resolve({ fail: true }); }
  }
  /* the function's address and the site's publishable key, from the page's own client (a preview's points at its fixtures) */
  function endpoint(c){
    var u = "";
    try { u = c.functionsUrl ? (c.functionsUrl.href || String(c.functionsUrl)) : c.supabaseUrl ? String(c.supabaseUrl).replace(/\/$/, "") + "/functions/v1" : ""; } catch (e) {}
    return u ? u.replace(/\/$/, "") + "/timmy" : "";
  }
  function waitClient(ms){
    return new Promise(function(ok){ var t0 = Date.now(); (function poll(){ var c = sb(); if (c || Date.now() - t0 > ms) { ok(c); return; } setTimeout(poll, 200); })(); });
  }
  function post(body){
    return waitClient(10000).then(function(c){
      var url = c && endpoint(c);
      if (!url) return { fail: "offline" };
      var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function(){ if (ctl) ctl.abort(); }, TIMEOUT);
      var headers = { "content-type": "application/json" };
      if (c.supabaseKey) headers.apikey = c.supabaseKey;
      return fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, credentials: "omit" }).then(function(r){
        clearTimeout(timer);
        return r.json().then(function(d){ return r.ok && d && d.ok ? { data: d } : { fail: r.status === 400 ? "bad" : "error", data: d }; }, function(){ return { fail: "error" }; });
      }, function(e){ clearTimeout(timer); return { fail: e && e.name === "AbortError" ? "slow" : "offline" }; });
    });
  }

  /* where the student is: the view, and in the notes the lecture and the paragraph at the top of the screen */
  function context(){
    var c = { view: String(opt("section") || (isDash() ? "dashboard" : "")).slice(0, 60) };
    var pl = isDash() ? null : opt("place");
    if (pl && pl.lec) { c.lec = String(pl.lec); if (Number.isInteger(pl.k)) c.k = pl.k; }
    return c;
  }
  /* "What should I study tonight?": the student's own progress, worked out here from each hub's saved state */
  function progressFrom(hub, core, state, examId){
    if (!core || !Array.isArray(core.lectures)) return [];
    var today = ymd(new Date()), exams = (core.exams || []).filter(function(x){ return x && x.date; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    var ex = examId ? (core.exams || []).filter(function(x){ return x.id === examId; })[0] : null;
    if (!ex) ex = exams.filter(function(x){ return x.date >= today; })[0] || exams[exams.length - 1] || null;
    var rev = {}; (core.reviewOnly || []).forEach(function(id){ rev[id] = 1; });
    var tagged = core.lectures.some(function(l){ return !!l.exam; });
    var lecs = core.lectures.filter(function(l){ return !rev[l.id] && (!ex || !tagged || l.exam === ex.id); });
    var by = {}; (core.index || []).forEach(function(r){ (by[r[1]] = by[r[1]] || []).push(r[0]); });
    var st = state || {}, A = st.answered && typeof st.answered === "object" && !st.seen ? st.answered : null, SN = st.seen || {}, RD = st.read || {};
    function rec(id){
      if (A) { var a = A[id]; return a ? { n: a.seen || 0, last: typeof a.lastCorrect === "boolean" ? a.lastCorrect : !!a.correct } : null; }
      var s = SN[id]; return s ? { n: s.n || 0, last: s.last } : null;
    }
    return lecs.map(function(l){
      var ids = by[l.id] || [], n = 0, right = 0, missed = 0;
      ids.forEach(function(id){ var r = rec(id); if (!r || !r.n) return; n++; if (r.last === true) right++; else if (r.last === false) missed++; });
      return { hub: hub, lec: l.id, questions: ids.length, answered: n, right: right, missed: missed, notes_done: !!RD[l.id] };
    });
  }
  var coreMemo = {};
  function progress(){
    if (!isDash()) return Promise.resolve({ lectures: progressFrom(O.hub, opt("core"), opt("state"), O.exam).slice(0, 40) });
    var hubs = (opt("hubs") || []).filter(function(h){ return h && h.content; }).slice(0, 4);
    return Promise.all(hubs.map(function(h){
      var p = coreMemo[h.id] || (coreMemo[h.id] = fetch(h.content + "core.json").then(function(r){ if (!r.ok) throw new Error(); return r.json(); }).then(function(c){ p.done = c; return c; }).catch(function(){ delete coreMemo[h.id]; return null; }));
      return p.then(function(core){ var st = null; try { st = JSON.parse(ls(h.stateKey) || "null"); } catch (e) {} return progressFrom(h.id, core, st, null); });
    })).then(function(all){ return { lectures: [].concat.apply([], all).slice(0, 40) }; });
  }
  /* the question "Ask Timmy" was tapped on is read by the server only once the database has this answer: wait for it */
  function recorded(qid){
    var at = answered[qid]; if (!at || paid[qid]) return Promise.resolve();
    return new Promise(function(ok){ (function poll(){ if (paid[qid] || Date.now() - at > 2500) ok(); else setTimeout(poll, 150); })(); });
  }

  /* ======================= one question ======================= */
  var TONIGHT = /\b(study|review|focus on|work on)\b.*\b(tonight|today|next|now|first)\b|\bwhere (should|do) i (start|begin)\b|\bwhat should i (do|study|review)\b/i;
  function send(text, x){
    x = x || {};
    if (!O || S.busy || mockOn() || archived()) return;
    text = String(text || "").trim();
    if (!text) return;
    if (text.length > MAX) { counter(); P.count.hidden = false; return; }
    build();
    var body = { visitor: visitor(), hub: hubId(), text: text, chat: S.chat, request: rid(), voice: voice(), context: context() };
    if (isDash()) body.hubs = (opt("hubs") || []).map(function(h){ return h.id; });
    var ask = S.attach && !isDash() ? { qid: S.attach.qid, right: S.attach.right, picks: S.attach.picks } : null;
    if (ask) body.ask = ask;
    var wantProgress = x.progress || TONIGHT.test(text);
    S.busy = true; setBusy(true);
    S.started = true; S.attach = null; drawAttach(); P.starters.hidden = true; hidePast();
    P.input.value = ""; grow(); counter();
    addStudent(text, { ask: !!ask, progress: wantProgress });
    track("send" + (ask ? "=question" : wantProgress ? "=tonight" : ""));
    var prep = wantProgress ? progress().catch(function(){ return null; }) : Promise.resolve(null);
    prep.then(function(p){ if (p && p.lectures && p.lectures.length) body.progress = p; return ask ? recorded(ask.qid) : null; }).then(function(){ deliver(body); });
  }
  function deliver(body){
    S.busy = true; setBusy(true); S.lastBody = body;
    var wait = addWaiting();
    post(body).then(function(r){
      wait.remove();
      S.busy = false; setBusy(false);
      if (r.fail || !r.data) { addTimmy(failReply(r.fail), { retry: r.fail !== "bad" ? body : null }); track("error=" + (r.fail || "error")); return; }
      var d = r.data;
      if (d.chat) S.chat = d.chat;
      addTimmy(d, {});
      if (d.limited) {
        track("nap=" + d.limited);
        if (d.limited === "busy") { setBusy(true); setTimeout(function(){ if (!S.busy) setBusy(false); }, 6000); }
        else { S.ended = d.limited; setBusy(true); }
      }
    });
  }
  function failReply(why){
    var t = voice() === "timmy";
    var line = why === "bad" ? (t ? "Hmm, I couldn't read that one. Try asking another way?" : "That question couldn't be sent. Try asking another way.")
      : why === "slow" ? (t ? "That's taking me too long. Try again in a minute?" : "That took too long. Try again in a minute.")
      : (t ? "I can't reach my notes right now. Check your connection and try again?" : "Couldn't reach the server. Check your connection and try again.");
    return { kind: "error", paragraphs: [{ text: line, cites: [] }], message: null, local: true };
  }
  function setBusy(on){
    if (!P) return;
    var off = on || !!S.ended;
    P.input.disabled = off; P.send.disabled = off;
    P.input.placeholder = S.ended ? (S.ended === "limit" ? "Back tomorrow: that's today's 40 questions" : "Resting for now") : voice() === "timmy" ? "Ask Timmy about the notes" : "Ask about the notes";
  }

  /* ======================= the messages ======================= */
  function addStudent(text, o){
    var m = el("div", "ska-m is-me");
    var b = txt("p", "ska-b", text);
    m.appendChild(b);
    var tags = [];
    if (o && o.ask) tags.push("About a question you answered");
    if (o && o.progress) tags.push("With your progress");
    if (tags.length) m.appendChild(txt("p", "ska-tag", tags.join(" · ")));
    P.log.appendChild(m); scrollEnd();
    return m;
  }
  function addWaiting(){
    var m = el("div", "ska-m is-tim is-wait");
    var b = el("div", "ska-b");
    b.innerHTML = '<span class="ska-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    b.appendChild(txt("span", "", voice() === "timmy" ? "Timmy is thinking…" : "Thinking…"));
    m.appendChild(b); P.log.appendChild(m); scrollEnd();
    return m;
  }
  /* one of Timmy's answers, from the function's reply (or a past one, from get_timmy_history). d: { kind, paragraphs:
     [{ text, cites: [{ id, hub, kind, label, quote, go }] }], offer, go, closest, message, limited }; o: { retry, past } */
  function addTimmy(d, o){
    o = o || {};
    var m = el("div", "ska-m is-tim", { "data-kind": String(d.kind || "answer").replace(/[^a-z_]/g, "") });
    var b = el("div", "ska-b");
    (Array.isArray(d.paragraphs) ? d.paragraphs : []).forEach(function(p){
      if (!p || !p.text) return;
      b.appendChild(txt("p", "", p.text));
      var cites = (Array.isArray(p.cites) ? p.cites : []).filter(function(c){ return c && c.go; });
      if (cites.length) {
        var ul = el("ul", "ska-cites", { "aria-label": "From the notes" });
        cites.forEach(function(c){
          var li = el("li"), a = el("button", "ska-cite", { type: "button", "data-ska": "cite" });
          a.innerHTML = icon(c.kind === "site" ? "about" : c.kind === "question" ? "questions" : c.kind === "hint" || c.kind === "likely" ? "hints" : c.kind === "cram" ? "cram" : "notes", 16);
          var lab = (isDash() && c.hub ? hubName(c.hub) + " · " : "") + (c.label || "The notes");
          a.appendChild(txt("span", "", lab));
          if (c.quote) a.setAttribute("title", "“" + String(c.quote).slice(0, 200) + "”");
          a.addEventListener("click", function(){ track("cite=" + String(c.kind || "notes").replace(/[^a-z]/g, "")); goTo(Object.assign({ hub: c.hub || "" }, c.go)); });
          li.appendChild(a); ul.appendChild(li);
        });
        b.appendChild(ul);
      }
    });
    if (!b.childNodes.length) b.appendChild(txt("p", "", voice() === "timmy" ? "Hmm. Ask me that one more time?" : "Something went wrong. Ask again?"));
    m.appendChild(b);

    /* where to go next: the go button, the closest lecture when the notes don't cover it, the notes after a nap */
    var row = el("div", "ska-go");
    if (d.go && d.go.v) row.appendChild(goButton(d.go));
    if (d.kind === "not_covered" && d.closest && d.closest.lec) {
      var cl = d.closest, gb = btn("closest", "Closest: " + [cl.label, cl.title].filter(Boolean).join(" "), "", "notes");
      gb.addEventListener("click", function(){ track("go=closest"); goTo({ v: "notes", hub: cl.hub || "", lec: cl.lec }); });
      row.appendChild(gb);
    }
    if (d.limited && d.limited !== "busy" && !isDash()) { var nb = btn("notes", "Open the notes", "", "notes"); nb.addEventListener("click", function(){ track("go=notes-nap"); goTo({ v: "notes" }); }); row.appendChild(nb); }
    if (o.retry) {
      var rb = btn("retry", "Try again", "", "retry");
      rb.addEventListener("click", function(){ m.remove(); track("retry"); deliver(o.retry); });
      row.appendChild(rb);
    }
    if (row.childNodes.length) m.appendChild(row);

    if (d.offer && (d.offer.kind === "report" || d.offer.kind === "idea")) m.appendChild(offerCard(d, o.past || {}));
    m.appendChild(actions(d, o.past || {}));
    P.log.appendChild(m); scrollEnd();
    return m;
  }
  function goLabel(g){
    var lec = g.lec ? lecShort(g.lec, g.hub) : "", hn = isDash() && g.hub ? hubName(g.hub) : "";
    if (g.v === "drill") return [hn ? hn + "'s Daily drill" : "Daily drill", "drill"];
    if (g.v === "practice") return [lec ? "Practice " + lec : hn ? "Practice in " + hn : "Practice this lecture", "questions"];
    return [lec ? "Open the notes: " + lec : hn ? "Open " + hn + "'s notes" : "Open the notes", "notes"];
  }
  /* a lecture's short name (the hub's page knows them; the dashboard only for a hub whose core.json it has read) */
  function lecShort(lec, hub){
    var n = ""; try { n = O.lecName ? O.lecName(lec, hub) : ""; } catch (e) {}
    if (!n && hub && coreMemo[hub] && coreMemo[hub].done) { var l = (coreMemo[hub].done.lectures || []).filter(function(x){ return x.id === lec; })[0]; if (l) n = (l.label || "L" + l.num) + " " + String(l.title || "").split(":")[0]; }
    return n;
  }
  function goButton(g){
    var l = goLabel(g), b = btn("go-" + String(g.v).replace(/[^a-z]/g, ""), l[0], "is-pri", l[1]);
    b.addEventListener("click", function(){ track("go=" + String(g.v).replace(/[^a-z]/g, "")); goTo(g); });
    return b;
  }
  /* thumbs and Report under an answer (Report on a nap or an error too) */
  function actions(d, past){
    var row = el("div", "ska-acts"), mid = d.message || null;
    if (mid && !d.local) {
      var cur = past.thumb || 0;
      var up = el("button", "ska-ib", { type: "button", "data-ska": "up", "aria-label": "Helpful", "aria-pressed": String(cur === 1) }), dn = el("button", "ska-ib", { type: "button", "data-ska": "down", "aria-label": "Not helpful", "aria-pressed": String(cur === -1) });
      up.innerHTML = icon("thumbup", 18); dn.innerHTML = icon("thumbdown", 18);
      var set = function(v){
        cur = cur === v ? 0 : v;
        up.setAttribute("aria-pressed", String(cur === 1)); dn.setAttribute("aria-pressed", String(cur === -1));
        track("thumb=" + (cur === 1 ? "up" : cur === -1 ? "down" : "undo"));
        rpc("timmy_thumb", { p_visitor: visitor(), p_message: mid, p_val: cur });
      };
      up.addEventListener("click", function(){ set(1); }); dn.addEventListener("click", function(){ set(-1); });
      row.appendChild(up); row.appendChild(dn);
    }
    var rep = el("button", "ska-link", { type: "button", "data-ska": "report" }); rep.innerHTML = icon("report", 16); rep.appendChild(txt("span", "", "Report"));
    row.appendChild(rep);
    var box = null;
    rep.addEventListener("click", function(){
      if (box) { box.hidden = !box.hidden; if (!box.hidden) box.querySelector("textarea").focus(); return; }
      track("report-open");
      box = reportBox(d, mid, function(){ rep.disabled = true; rep.lastChild.textContent = "Reported"; });
      row.parentNode.insertBefore(box, row.nextSibling);
      box.querySelector("textarea").focus();
    });
    if (past.reported) { rep.disabled = true; rep.lastChild.textContent = "Reported"; }
    return row;
  }
  function reportBox(d, mid, done){
    var box = el("div", "ska-rep");
    var lab = el("label", "ska-f", { "data-ska": "report-label" });
    lab.appendChild(txt("span", "", "What went wrong? (A wrong or odd answer, an error, a link to the wrong place…)"));
    var ta = el("textarea", "", { rows: "3", maxlength: "600" }); lab.appendChild(ta); box.appendChild(lab);
    var rowb = el("div", "ska-orow"), sendB = btn("report-send", "Send report", "is-pri"), cancel = btn("report-cancel", "Cancel");
    rowb.appendChild(sendB); rowb.appendChild(cancel); box.appendChild(rowb);
    var say = el("p", "ska-say", { role: "status" }); box.appendChild(say);
    cancel.addEventListener("click", function(){ box.hidden = true; });
    sendB.addEventListener("click", function(){
      var n = ta.value.trim(); if (!n) { say.textContent = "Type a few words first."; ta.focus(); return; }
      sendB.disabled = true; say.textContent = "Sending…";
      rpc("timmy_report", { p_visitor: visitor(), p_hub: hubId(), p_message: mid, p_note: n.slice(0, 600), p_section: String(opt("section") || hubId()).slice(0, 60) }).then(function(r){
        var x = r.data;
        if (r.fail || !x || !x.ok) { sendB.disabled = false; say.textContent = x && x.error === "limit" ? "That's 10 reports about Timmy today. Try again tomorrow." : "Couldn't send it. Try again in a minute."; return; }
        track("report"); box.innerHTML = ""; box.appendChild(txt("p", "ska-say", "Thanks. Sam will look at the whole chat, and a reply shows up in your Inbox.")); done();
      });
    });
    return box;
  }

  /* ---------- Timmy's offers: a report or an idea, drafted for the student to edit and send (or not) ---------- */
  function offerCard(d, past){
    var f = d.offer, mid = d.message || null, card = el("div", "ska-offer", { "data-offer": f.kind });
    var said = function(t){ card.innerHTML = ""; card.classList.add("is-done"); card.appendChild(txt("p", "ska-say", t)); };
    if (past.offer_action) { said(past.offer_action === "dismissed" ? "No thanks." : f.kind === "report" ? "Report sent." : "Posted on the idea board."); return card; }
    var no = btn("offer-no", "No thanks");
    no.addEventListener("click", function(){ track("offer=" + f.kind + "-no"); if (mid) rpc("timmy_offer", { p_visitor: visitor(), p_message: mid, p_action: "dismissed" }); said("No thanks."); });
    if (f.kind === "report") {
      card.appendChild(txt("p", "ska-ot", "Send this as a report?"));
      var lab = el("label", "ska-f", { "data-ska": "offer-report-label" }); lab.appendChild(txt("span", "", "Your report (change anything first)"));
      var ta = el("textarea", "", { rows: "3", maxlength: "600" }); ta.value = f.text || ""; lab.appendChild(ta); card.appendChild(lab);
      var row = el("div", "ska-orow"), go = btn("offer-send", "Send report", "is-pri"); row.appendChild(go); row.appendChild(no); card.appendChild(row);
      var say = el("p", "ska-say", { role: "status" }); card.appendChild(say);
      go.addEventListener("click", function(){
        var t = ta.value.trim(); if (!t) { say.textContent = "Type a few words first."; return; }
        go.disabled = true; say.textContent = "Sending…";
        sendReport(t, f.qid).then(function(ok){
          if (!ok) { go.disabled = false; say.textContent = "Couldn't send it. Try again in a minute."; return; }
          track("offer=report-sent"); if (mid) rpc("timmy_offer", { p_visitor: visitor(), p_message: mid, p_action: "sent" });
          said("Sent. Sam reads every report, and a reply shows up in your Inbox.");
        });
      });
      return card;
    }
    /* an idea for the idea board (widget/ideas.js posts it, the same as from the board itself) */
    card.appendChild(txt("p", "ska-ot", "Post this on the idea board?"));
    var named = (ls("sh_display_name") || "").trim();
    var nameIn = null;
    if (!named) {
      var nl = el("label", "ska-f", { "data-ska": "offer-name-label" }); nl.appendChild(txt("span", "", "Your name on the board (your leaderboard name)"));
      nameIn = el("input", "", { type: "text", maxlength: "24", autocomplete: "nickname", placeholder: "Pick a name" });
      try { nameIn.value = (window.shNameNow && window.shNameNow()) || ""; } catch (e) {}
      nl.appendChild(nameIn); card.appendChild(nl);
    }
    var tl = el("label", "ska-f", { "data-ska": "offer-title-label" }); tl.appendChild(txt("span", "", "Title"));
    var ti = el("input", "", { type: "text", maxlength: "80" }); ti.value = f.title || ""; tl.appendChild(ti); card.appendChild(tl);
    var bl = el("label", "ska-f", { "data-ska": "offer-body-label" }); bl.appendChild(txt("span", "", "Details (optional)"));
    var bo = el("textarea", "", { rows: "3", maxlength: "280" }); bo.value = f.body || ""; bl.appendChild(bo); card.appendChild(bl);
    var kl = el("label", "ska-f", { "data-ska": "offer-kind-label" }); kl.appendChild(txt("span", "", "Kind of idea"));
    var ks = el("select");
    var cats = (window.shIdeas && window.shIdeas.cats) || [{ id: "feature", name: "New feature" }, { id: "better", name: "Make something better" }, { id: "content", name: "Content" }, { id: "fun", name: "Fun" }, { id: "look", name: "Look and feel" }, { id: "other", name: "Something else" }];
    cats.forEach(function(c){ var op = el("option", "", { value: c.id }); op.textContent = c.name; if (c.id === f.category) op.selected = true; ks.appendChild(op); });
    kl.appendChild(ks); card.appendChild(kl);
    var forHub = f.hub && f.hub !== "dashboard" ? f.hub : "";
    card.appendChild(txt("p", "ska-fine", "For " + (forHub ? hubName(forHub) : "all hubs") + ". The class sees it right away, under your name."));
    var row2 = el("div", "ska-orow"), postB = btn("offer-post", "Post it", "is-pri"); row2.appendChild(postB); row2.appendChild(no); card.appendChild(row2);
    var say2 = el("p", "ska-say", { role: "status" }); card.appendChild(say2);
    var reqId = rid();
    postB.addEventListener("click", function(){
      var t = ti.value.trim(), body = bo.value.trim(), nm = nameIn ? nameIn.value.trim() : "";
      if (nameIn && !nm) { say2.textContent = "Pick a name to post it."; nameIn.focus(); return; }
      if (t.length < 3) { say2.textContent = "Give it a title of 3 to 80 characters."; ti.focus(); return; }
      postB.disabled = true; say2.textContent = "Posting…";
      ideas().then(function(I){
        if (!I || !I.post) return { ok: false, msg: "The idea board isn't open yet. For now, Suggest something reaches Sam." };
        return I.up(sb()).then(function(isUp){
          if (!isUp) return { ok: false, msg: "The idea board isn't open yet. For now, Suggest something reaches Sam." };
          return I.post({ sb: sb(), title: t, body: body, hub: forHub || null, category: ks.value, source: "board", newName: nm, request: reqId });
        });
      }).then(function(r){
        if (!r || !r.ok) { postB.disabled = false; say2.textContent = (r && r.msg) || "Couldn't post it. Try again in a minute."; return; }
        track("offer=idea-posted"); if (mid) rpc("timmy_offer", { p_visitor: visitor(), p_message: mid, p_action: "posted" });
        said("Posted on the idea board" + (r.name ? " as " + r.name : "") + ". Classmates can vote on it now.");
      }, function(){ postB.disabled = false; say2.textContent = "Couldn't post it. Try again in a minute."; });
    });
    return card;
  }
  function ideas(){ return window.shIdeas ? Promise.resolve(window.shIdeas) : loadScript(widgetUrl("ideas.js")).then(function(){ return window.shIdeas || null; }, function(){ return null; }); }
  /* a report the student sends from Timmy's draft: the hubs' usual report (question_flags, as the Report form sends it),
     so it reaches the admin page's Inbox and Sam's reply comes back the usual way */
  function sendReport(text, qid){
    var c = sb(); if (!c) return Promise.resolve(false);
    var where = [];
    if (qid) where.push("question " + qid);
    var sec = String(opt("section") || ""); if (sec) where.push(sec);
    where.push("drafted by Timmy");
    var note = (text + "  — " + where.join(" · ")).slice(0, 700);
    try {
      return c.from("question_flags").insert({ hub: isDash() ? "dashboard" : O.hub, note: note, visitor_id: visitor() || null }).then(function(r){ return !(r && r.error); }, function(){ return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  /* ---------- links: on this page, or (from the dashboard) on a hub's page, opened there when it loads ---------- */
  var GO_KEY = "sh_ask_goto";
  function goTo(g){
    if (!g || !g.v) return;
    if (g.v === "about") { location.href = (O.about || "../about/") + (g.id ? "#" + encodeURIComponent(g.id) : ""); return; }
    if (isDash()) {
      if (!g.hub) return;
      var href = ""; try { href = O.href ? O.href(g.hub) : ""; } catch (e) {}
      if (!href) return;
      try { sessionStorage.setItem(GO_KEY, JSON.stringify(g)); } catch (e) {}
      location.href = href;
      return;
    }
    if (phone()) close();
    try { if (O.go) O.go(g); else if (window.SH_GOTO) window.SH_GOTO(g); } catch (e) {}
  }
  /* a link the dashboard's chat opened on this hub */
  function pendingGo(){
    var raw = null; try { raw = sessionStorage.getItem(GO_KEY); sessionStorage.removeItem(GO_KEY); } catch (e) {}
    if (!raw || isDash()) return;
    var g = null; try { g = JSON.parse(raw); } catch (e) {}
    if (!g || (g.hub && g.hub !== O.hub)) return;
    var t0 = Date.now();
    (function wait(){
      /* the notes' links need the notes loaded (the engine's SH_GOTO waits for the page itself) */
      if ((window.SH_EXPORT && window.SH_EXPORT.sections && window.SH_EXPORT.sections.length) || Date.now() - t0 > 8000) { try { if (O.go) O.go(g); else if (window.SH_GOTO) window.SH_GOTO(g); } catch (e) {} return; }
      setTimeout(wait, 200);
    })();
  }

  /* ======================= chats: the last one carries on, the others are a tap away ======================= */
  function resume(){
    S.loaded = true;
    var v = visitor(); if (!v) return;
    rpc("get_timmy_history", { p_visitor: v, p_hub: hubId(), p_limit: 10 }).then(function(r){
      var chats = r.fail || !Array.isArray(r.data) ? [] : r.data;
      S.past = chats;
      var last = chats[0];
      if (!last || S.started || !Array.isArray(last.messages) || !last.messages.length) return;
      if (Date.now() - new Date(last.last).getTime() > KEEP_HOURS * 3600e3) return;
      showChat(last);
    });
  }
  function showChat(c){
    P.log.innerHTML = "";
    S.chat = c.id; S.started = true; S.ended = ""; setBusy(false);
    P.starters.hidden = true;
    var earlier = txt("p", "ska-when", "Started " + when(c.started)); P.log.appendChild(earlier);
    (c.messages || []).forEach(function(m){
      if (m.who === "student") addStudent(m.text || "", {});
      else if (m.reply && typeof m.reply === "object") addTimmy(Object.assign({}, m.reply, { message: m.id, kind: m.kind || m.reply.kind }), { past: { thumb: m.thumb || 0, offer_action: m.offer_action || null } });
      else addTimmy({ kind: m.kind || "answer", paragraphs: [{ text: m.text || "", cites: [] }], message: m.id }, { past: { thumb: m.thumb || 0 } });
    });
    scrollEnd();
  }
  function when(iso){
    var d = new Date(iso); if (isNaN(d)) return "";
    var today = ymd(new Date()), y = new Date(); y.setDate(y.getDate() - 1);
    var t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return ymd(d) === today ? "today, " + t : ymd(d) === ymd(y) ? "yesterday, " + t : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ", " + t;
  }
  function newChat(){
    S.chat = null; S.started = false; S.ended = ""; setBusy(false);
    P.log.innerHTML = ""; hidePast(); drawStarters(); drawAttach();
    try { P.input.focus(); } catch (e) {}
  }
  function showPast(){
    track("history");
    var host = P.past; host.hidden = false; P.log.hidden = true; P.foot.hidden = true;
    P.bPast.setAttribute("aria-pressed", "true");
    host.innerHTML = "";
    var back = btn("past-back", "Back to the chat", "", "back"); back.addEventListener("click", hidePast); host.appendChild(back);
    host.appendChild(txt("h3", "", "Past chats " + (isDash() ? "on the dashboard" : "on " + (O.name || "this hub"))));
    var list = el("ul", "ska-pastul"); host.appendChild(list);
    var draw = function(chats){
      list.innerHTML = "";
      if (!chats.length) { list.appendChild(txt("li", "ska-fine", "No past chats here yet.")); return; }
      chats.forEach(function(c){
        var first = (c.messages || []).filter(function(m){ return m.who === "student"; })[0];
        var li = el("li"), b = el("button", "ska-pastb", { type: "button", "data-ska": "past-chat" });
        b.appendChild(txt("b", "", first ? first.text : "A chat"));
        b.appendChild(txt("small", "", when(c.last) + " · " + (c.messages || []).length + " messages"));
        b.addEventListener("click", function(){ track("history-open"); hidePast(); showChat(c); });
        li.appendChild(b); list.appendChild(li);
      });
    };
    list.appendChild(txt("li", "ska-fine", "Loading…"));
    rpc("get_timmy_history", { p_visitor: visitor(), p_hub: hubId(), p_limit: 10 }).then(function(r){
      if (r.fail) { list.innerHTML = ""; list.appendChild(txt("li", "ska-fine", "Past chats couldn't load. Try again in a minute.")); return; }
      S.past = Array.isArray(r.data) ? r.data : []; draw(S.past);
    });
    try { back.focus(); } catch (e) {}
  }
  function hidePast(){
    if (!P) return;
    P.past.hidden = true; P.log.hidden = false; P.foot.hidden = false; P.bPast.setAttribute("aria-pressed", "false");
  }

  /* ======================= the Ask icon in Timmy's spot, and the dashboard's Ask button ======================= */
  var fab = null, spotEl = null, bootAt = Date.now();
  function sync(){
    if (!O) return;
    var on = available(), here = timmyHere(), due = timmyDue() && Date.now() - bootAt < 6000;
    if (!isDash()) {
      var show = on && !here && !due && !mockOn();
      if (show && !cssDone) { css().then(sync); show = false; }
      if (show && !fab) {
        fab = el("button", "ska-fab", { type: "button", "data-ska": "fab", "aria-label": "Ask the hub about the notes", title: "Ask the hub" });
        fab.innerHTML = icon("ask", 26);
        fab.addEventListener("click", function(){ open({ from: "icon" }); });
        document.body.appendChild(fab);
      }
      if (fab) fab.hidden = !show;
    } else {
      var host = opt("spot"), want = on && !here && !due;
      if (want && !cssDone) { css().then(sync); want = false; }
      if (host && !spotEl && want) {
        spotEl = el("div", "ska-spot");
        spotEl.innerHTML = '<span class="ska-spot-ic" aria-hidden="true">' + icon("ask", 26) + "</span>";
        var tx = el("div", "ska-spot-t"); tx.appendChild(txt("b", "", "Ask the hub")); tx.appendChild(txt("small", "", "Questions about the notes, answered from the live hubs"));
        spotEl.appendChild(tx);
        var b = btn("spot", "Ask", "is-pri"); b.addEventListener("click", function(){ open({ from: "spot" }); }); spotEl.appendChild(b);
        host.appendChild(spotEl);
      }
      if (host) host.hidden = !want;
    }
    if (isOpen()) { var v = P.root.getAttribute("data-voice"); if (v !== voice()) dress(); paintPaused(); }
  }

  function mount(o){
    if (O || !o) return;
    O = o;
    /* answers on this page: "Ask Timmy" on a card waits until the server has the answer */
    if (O.answeredEvent) document.addEventListener(O.answeredEvent, function(e){ var d = e && e.detail; if (d && d.qid) answered[String(d.qid)] = Date.now(); });
    document.addEventListener("sh:answer-paid", function(e){ var d = e && e.detail; if (d && d.qid) paid[String(d.qid)] = 1; });
    document.addEventListener("sh:pref", function(){ setTimeout(sync, 60); });
    window.addEventListener("hashchange", function(){ setTimeout(sync, 120); });
    setInterval(sync, 1500);
    sync();
    pendingGo();
  }

  window.shAsk = {
    mount: mount, open: open, close: close, isOpen: isOpen, voice: voice, available: available,
    /* for the tests: the progress summary from a hub's content and saved state */
    progressFrom: progressFrom
  };
})();
