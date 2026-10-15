/* study-hubs replies + inbox. When a report ("Report an issue" / the Report button on a question) or a suggestion
   someone sent has been dealt with, they're told once in a pop-up, with the reply written when it was resolved (for a
   question report, what was fixed). Notices to everyone (site_notices, posted from the admin Inbox's "Tell everyone")
   pop up once per device (sh_notice_seen) while they're live, on whichever page is opened first. Everything also stays
   in one Inbox (replies 90 days, notices 60), the same on every hub and the dashboard; a notice's hub only labels it.
   Any [data-sh-inbox] element opens it; .sh-inbox-badge elements show the unread count. Data: get_my_inbox; reading a reply calls mark_reply_seen.
   The live survey (get_my_survey) also waits at the top of the Inbox until it's answered, so "Later" on the dashboard's
   survey pop-up (or never seeing it) still leaves it one tap away; it counts as unread until the Inbox is opened
   (sh_survey_seen) and is answered right there (submit_survey). shReplies.refresh() reloads after the pop-up is used.
   Used by widget/v3.js (hubs) and the dashboard:
     shReplies.start({ sb: supabaseClient, visitor: "..." or null, hub: "perio" | "dashboard" }) */
(function(){
  "use strict";
  if (window.shReplies) return;
  var HUB_NAME = { "msk-exam3": "MSK Exam 3", perio: "Periodontology", hepatobiliary: "GI Exam 2", "gi-exam1": "GI Exam 1",
    genetics: "Genetics", "fixed-pros": "Fixed Pros", dashboard: "Study Hubs" };
  var SEEN_KEY = "sh_notice_seen";
  var TOKENS = "--r-bg:var(--surface,#fff);--r-ink:var(--ink,#15202A);--r-ink2:var(--ink-soft,var(--ink-2,#4A5864));" +
    "--r-line:var(--line,rgba(0,0,0,.12));--r-good:var(--good,#1F8A5B);--r-accent:var(--accent,var(--focus,#2F6FD6));" +
    "--r-bg2:var(--surface-2,rgba(127,127,127,.08));" +
    "font-family:var(--font-body,var(--sans,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif));font-size:14.5px;line-height:1.45;color:var(--r-ink);";
  var CSS =
    ".sh-reply,.sh-inbox{" + TOKENS + "}" +
    ".sh-reply *,.sh-inbox *{box-sizing:border-box;}" +
    /* bottom-right, like a notification: above the hub tools button (desktop) or the phone bar */
    ".sh-reply{position:fixed;right:16px;bottom:calc(var(--sh-tabbar-h,0px) + 16px + env(safe-area-inset-bottom,0px));z-index:10001;" +
    "width:min(400px,calc(var(--r-vw,100vw) - 32px));max-height:calc(var(--r-vh,100vh) - var(--sh-tabbar-h,0px) - 48px);overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box;padding:16px 18px 14px;border-radius:16px;" +
    "background:var(--r-bg);border:1px solid var(--r-line);" +
    "box-shadow:0 2px 6px rgba(20,16,12,.08),0 18px 44px -14px rgba(20,16,12,.4);animation:shReplyIn .28s ease-out;}" +
    "@media (max-width:560px){.sh-reply{right:12px;left:12px;width:auto;}}" +
    "@keyframes shReplyIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}" +
    ".sh-reply-top{display:flex;align-items:center;gap:8px;margin:0 28px 8px 0;font-weight:700;font-size:15.5px;}" +
    ".sh-reply-top svg{flex:none;width:20px;height:20px;color:var(--r-good);}" +
    ".sh-reply-x{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;" +
    "color:var(--r-ink2);font-size:22px;line-height:1;cursor:pointer;}" +
    ".sh-reply-x:hover{background:var(--r-bg2);}" +
    ".sh-reply-meta{font-size:12.5px;color:var(--r-ink2);margin-bottom:8px;}" +
    ".sh-reply-you{font-size:13px;color:var(--r-ink2);border-left:3px solid var(--r-line);padding:2px 0 2px 10px;margin:0 0 10px;" +
    "white-space:pre-wrap;overflow-wrap:anywhere;}" +
    ".sh-reply-msg{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 12px;}" +
    /* in the pop-up only the message scrolls, so the buttons stay on screen at any text size */
    ".sh-reply > *{flex:none;}.sh-reply > .sh-reply-msg{flex:0 1 auto;min-height:3em;overflow:auto;}" +
    ".sh-reply-row{display:flex;align-items:center;justify-content:flex-end;gap:10px;}" +
    ".sh-reply-count{margin-right:auto;font-size:12.5px;color:var(--r-ink2);}" +
    ".sh-reply-ok{border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;" +
    "background:var(--r-ink);color:var(--r-bg);}" +
    /* inbox: centered sheet on desktop, bottom sheet on phones */
    ".sh-inbox{position:fixed;inset:0;z-index:10002;display:flex;align-items:center;justify-content:center;padding:16px;" +
    "background:rgba(10,14,18,.45);animation:shInboxFade .2s ease-out;}" +
    "@keyframes shInboxFade{from{opacity:0;}to{opacity:1;}}" +
    ".sh-inbox-card{position:relative;width:min(520px,100%);max-height:min(640px,100%);display:flex;flex-direction:column;" +
    "background:var(--r-bg);border:1px solid var(--r-line);border-radius:18px;box-shadow:0 18px 50px -12px rgba(0,0,0,.45);}" +
    ".sh-inbox-head{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid var(--r-line);}" +
    ".sh-inbox-head h2{margin:0;font-size:18px;font-weight:700;font-family:inherit;flex:1;}" +
    ".sh-inbox-head .sh-reply-x{position:static;}" +
    ".sh-inbox-list{overflow:auto;padding:6px 18px 18px;}" +
    ".sh-inbox-item{padding:14px 0;border-bottom:1px solid var(--r-line);}" +
    ".sh-inbox-item:last-child{border-bottom:0;}" +
    ".sh-inbox-item .sh-reply-top{margin:0 0 4px;font-size:14.5px;}" +
    ".sh-inbox-item .sh-reply-top svg{width:18px;height:18px;}" +
    ".sh-inbox-new{flex:none;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--accent-contrast,#fff);" +
    "background:var(--r-accent);border-radius:999px;padding:2px 7px;}" +
    ".sh-inbox-item .sh-reply-msg{margin:0;}" +
    ".sh-inbox-empty{padding:28px 4px;color:var(--r-ink2);text-align:center;}" +
    "@media (max-width:560px){.sh-inbox{align-items:flex-end;padding:0;}" +
    ".sh-inbox-card{width:100%;max-height:88%;border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px);}}" +
    "@media (prefers-reduced-motion:reduce){.sh-reply,.sh-inbox{animation:none;}}" +
    ".sh-inbox-badge[hidden]{display:none !important;}" +
    /* the survey, answered inside the Inbox */
    ".sh-sv-q{margin:12px 0 0;}.sh-sv-q p{margin:0 0 7px;font-weight:600;font-size:14px;}" +
    ".sh-sv-opts{display:flex;flex-wrap:wrap;gap:6px;}" +
    ".sh-sv-opt{font:inherit;font-size:13.5px;padding:6px 12px;border-radius:999px;border:1px solid var(--r-line);background:var(--r-bg);color:var(--r-ink);cursor:pointer;}" +
    ".sh-sv-opt[aria-pressed=\"true\"]{background:var(--r-ink);border-color:var(--r-ink);color:var(--r-bg);}" +
    ".sh-sv-scale .sh-sv-opt{min-width:40px;}" +
    ".sh-sv-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--r-ink2);margin-top:4px;}" +
    ".sh-inbox textarea{width:100%;min-height:60px;font:inherit;font-size:14px;padding:8px 10px;border-radius:10px;border:1px solid var(--r-line);background:var(--r-bg2);color:var(--r-ink);resize:vertical;}" +
    ".sh-sv-other{margin-top:8px;}" +
    ".sh-sv-send{margin-top:14px;display:flex;justify-content:flex-end;align-items:center;gap:10px;}" +
    ".sh-sv-send .sh-reply-ok[disabled]{opacity:.45;cursor:default;}" +
    ".sh-sv-note{font-size:12.5px;color:var(--r-ink2);margin-right:auto;}" +
    "@media (max-width:560px){.sh-inbox textarea{font-size:16px;}}";
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/></svg>';
  var CLIPBOARD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/></svg>';
  var MEGAPHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  /* the widget appends "  — question <id> · <section>" to a report; show the student only what they typed */
  function ownWords(note){ return String(note || "").replace(/\s+—\s+(question\s+\S+|[a-z-]+\/[\w-]+)(\s+·\s+\S+)?\s*$/i, "").trim(); }
  function qidOf(note){ var m = /—\s+question\s+(\S+)/.exec(String(note || "")); return m ? m[1] : ""; }
  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtDate(t){ try { return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch (e) { return ""; } }
  /* The text-size setting zooms the whole page (html style.zoom), and 100vh/100vw inside a zoomed page are
     bigger than the screen, so the pop-up measures the real viewport in zoomed px instead. The inbox needs
     none of this: it sizes itself inside a fixed inset:0 layer, which always matches the screen. */
  function fitViewport(el){
    var z = 1;
    try { z = parseFloat(getComputedStyle(document.documentElement).zoom) || parseFloat(document.documentElement.style.zoom) || 1; } catch (e) {}
    el.style.setProperty("--r-vw", (window.innerWidth / z) + "px");
    el.style.setProperty("--r-vh", (window.innerHeight / z) + "px");
  }
  function injectCss(){
    if (document.getElementById("sh-reply-css")) return;
    var st = document.createElement("style"); st.id = "sh-reply-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  var pendingOpen = false;
  var api = window.shReplies = { start: start, open: function(){ pendingOpen = true; }, refresh: function(){}, unread: 0 };

  function start(o){
    if (!o || !o.sb || api.started) return;
    api.started = true;
    var sb = o.sb, visitor = o.visitor || null;
    var items = [], loading = null;

    function seenList(key){ try { return JSON.parse(localStorage.getItem(key) || "[]") || []; } catch (e) { return []; } }
    function seenNotices(){ return seenList(SEEN_KEY); }
    function isUnread(r){ return r.kind === "notice" ? seenNotices().indexOf(r.id) < 0 : r.kind === "survey" ? seenList("sh_survey_seen").indexOf(r.id) < 0 : !r.seen; }
    function markSeen(r){
      if (r.kind === "notice" || r.kind === "survey") {
        var key = r.kind === "notice" ? SEEN_KEY : "sh_survey_seen";
        try { var d = seenList(key); if (d.indexOf(r.id) < 0) d.push(r.id); localStorage.setItem(key, JSON.stringify(d.slice(-80))); } catch (e) {}
      } else if (!r.seen) {
        r.seen = true;
        try { sb.rpc("mark_reply_seen", { p_visitor: visitor, p_kind: r.kind, p_id: r.id }).then(function(){}, function(){}); } catch (e) {}
      }
      updateBadges();
    }
    function updateBadges(){
      var n = items.filter(isUnread).length;
      api.unread = n;
      document.querySelectorAll(".sh-inbox-badge").forEach(function(b){
        b.hidden = !n;
        if (!b.classList.contains("sh-inbox-dot")) b.textContent = n > 9 ? "9+" : String(n);
      });
      try { document.dispatchEvent(new CustomEvent("sh:inbox", { detail: { unread: n } })); } catch (e) {}
    }
    function load(){
      if (loading) return loading;
      function rowsOf(res){ return res && !res.error && Array.isArray(res.data) ? res.data : []; }
      var none = Promise.resolve(null);
      loading = Promise.all([
        sb.rpc("get_my_inbox", { p_visitor: visitor }).then(rowsOf, function(){ return null; }),
        visitor ? sb.rpc("get_my_survey", { p_visitor: visitor }).then(rowsOf, function(){ return []; }) : none
      ]).then(function(r){
        if (!r[0]) return items;
        /* one inbox: the same list on every hub and the dashboard (a notice's hub is just its label); an unanswered survey first */
        var sv = (r[1] || []).filter(function(x){ return x && Array.isArray(x.questions) && x.questions.length; })[0];
        items = (sv ? [{ kind: "survey", id: sv.id, title: sv.title, questions: sv.questions.slice(0, 5), at: sv.starts_at }] : []).concat(r[0]);
        updateBadges();
        return items;
      });
      return loading;
    }
    api.refresh = function(){ loading = null; return load(); };

    /* ---------- the survey, answered in the Inbox (same question kinds as the dashboard pop-up) ---------- */
    function surveyItem(el, r){
      var qs = r.questions, answers = {};
      var h = '<div class="sh-reply-top">' + CLIPBOARD + '<span>' + esc(r.title || "Quick survey") + '</span></div>' +
        '<div class="sh-reply-meta">Quick survey · ' + (qs.length === 1 ? "1 question" : qs.length + " questions") + '</div>';
      qs.forEach(function(q, qi){
        var id = String(q.id || ("q" + (qi + 1))), kind = q.kind || "choice";
        h += '<div class="sh-sv-q" data-sq="' + esc(id) + '" data-kind="' + esc(kind) + '"><p>' + esc(q.prompt || "") + '</p>';
        if (kind === "text") h += '<textarea maxlength="600" aria-label="' + esc(q.prompt || "Your answer") + '"></textarea>';
        else if (kind === "scale") {
          h += '<div class="sh-sv-opts sh-sv-scale">';
          for (var n = 1; n <= 5; n++) h += '<button type="button" class="sh-sv-opt" aria-pressed="false" data-sv="' + n + '">' + n + '</button>';
          h += '</div><div class="sh-sv-ends"><span>' + esc((q.ends && q.ends[0]) || "Not at all") + '</span><span>' + esc((q.ends && q.ends[1]) || "Very") + '</span></div>';
        } else {
          h += '<div class="sh-sv-opts">' + (q.options || []).map(function(o){ return '<button type="button" class="sh-sv-opt" aria-pressed="false" data-sv="' + esc(o) + '">' + esc(o) + '</button>'; }).join("") +
            (q.other ? '<button type="button" class="sh-sv-opt" aria-pressed="false" data-sv="Other" data-other>Other</button>' : '') + '</div>';
          if (q.other) h += '<textarea class="sh-sv-other" maxlength="300" hidden aria-label="Other: type your answer" placeholder="Type your answer"></textarea>';
        }
        h += '</div>';
      });
      h += '<div class="sh-sv-send"><span class="sh-sv-note"></span><button type="button" class="sh-reply-ok" disabled>Send</button></div>';
      el.innerHTML = h;
      var send = el.querySelector(".sh-reply-ok"), note = el.querySelector(".sh-sv-note");
      function refreshAnswers(){
        el.querySelectorAll("textarea").forEach(function(t){
          var id = t.closest(".sh-sv-q").getAttribute("data-sq"), other = t.classList.contains("sh-sv-other");
          if (other) id += "_other";
          var v = other && t.hidden ? "" : t.value.trim();
          if (v) answers[id] = v.slice(0, other ? 300 : 600); else delete answers[id];
        });
        send.disabled = !Object.keys(answers).length;
      }
      el.addEventListener("input", refreshAnswers);
      el.addEventListener("click", function(e){
        var opt = e.target.closest(".sh-sv-opt");
        if (!opt) return;
        var q = opt.closest(".sh-sv-q"), id = q.getAttribute("data-sq"), kind = q.getAttribute("data-kind");
        var on = opt.getAttribute("aria-pressed") !== "true";
        if (kind !== "multi") q.querySelectorAll(".sh-sv-opt").forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
        opt.setAttribute("aria-pressed", String(on));
        var box = q.querySelector(".sh-sv-other");
        if (box) { box.hidden = !q.querySelector('.sh-sv-opt[data-other][aria-pressed="true"]'); if (!box.hidden && opt.hasAttribute("data-other")) box.focus(); }
        var picked = Array.prototype.map.call(q.querySelectorAll('.sh-sv-opt[aria-pressed="true"]'), function(b){ return b.getAttribute("data-sv"); });
        if (!picked.length) delete answers[id];
        else answers[id] = kind === "multi" ? picked : (kind === "scale" ? +picked[0] : picked[0]);
        refreshAnswers();
      });
      send.addEventListener("click", function(){
        if (send.disabled) return;
        send.disabled = true; note.textContent = "Sending…";
        sb.rpc("submit_survey", { p_survey: r.id, p_visitor: visitor, p_answers: answers }).then(function(res){
          if (!res || res.error || res.data === false) { send.disabled = false; note.textContent = "That didn't send. Try again?"; return; }
          try { localStorage.setItem("sh_survey_done_" + r.id, "1"); } catch (e) {}
          items = items.filter(function(x){ return x !== r; });
          updateBadges();
          el.innerHTML = '<div class="sh-reply-top">' + CHECK + '<span>Thank you!</span></div><div class="sh-reply-msg">Your answers go straight into what gets built next.</div>';
          try { document.dispatchEvent(new CustomEvent("sh:survey-done", { detail: { id: r.id } })); } catch (e) {}
        }, function(){ send.disabled = false; note.textContent = "That didn't send. Try again?"; });
      });
    }

    /* one card's contents, shared by the pop-up and the inbox list */
    var CARD = '<div class="sh-reply-top"></div><div class="sh-reply-meta"></div><div class="sh-reply-you"></div><div class="sh-reply-msg"></div>';
    function fill(el, r){
      var flag = r.kind === "flag", notice = r.kind === "notice";
      var yours = notice ? "" : ownWords(r.note), qid = flag ? qidOf(r.note) : "";
      var msg = (r.message || "").trim() || (flag
        ? "It's been looked at and fixed where needed. Thanks for flagging it."
        : "It's been looked at. Thanks for the idea.");
      el.querySelector(".sh-reply-top").innerHTML = (notice ? MEGAPHONE : CHECK) + "<span></span>";
      el.querySelector(".sh-reply-top span").textContent = notice ? r.title : flag ? "Your report was addressed" : "Your suggestion was addressed";
      var meta = [HUB_NAME[r.hub] || r.hub || (notice ? "Everyone" : "")];
      if (qid) meta.push("question " + qid);
      if (r.at) meta.push(fmtDate(r.at));
      el.querySelector(".sh-reply-meta").textContent = meta.filter(Boolean).join(" · ");
      var you = el.querySelector(".sh-reply-you");
      if (yours) you.textContent = "You wrote: " + (yours.length > 240 ? yours.slice(0, 237) + "..." : yours);
      else you.remove();
      el.querySelector(".sh-reply-msg").textContent = msg;
    }

    /* ---------- pop-up: unread replies and live notices, once ---------- */
    function popup(rows){
      injectCss();
      var i = 0;
      var box = document.createElement("div");
      box.className = "sh-reply"; box.setAttribute("role", "dialog"); box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
      fitViewport(box);
      function refit(){ fitViewport(box); }
      window.addEventListener("resize", refit);
      function close(){ box.remove(); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", refit); }
      function onKey(e){ if (e.key === "Escape") { markSeen(rows[i]); close(); } }
      document.addEventListener("keydown", onKey);
      function render(){
        box.innerHTML = '<button class="sh-reply-x" type="button" aria-label="Close">&times;</button>' + CARD +
          '<div class="sh-reply-row"><span class="sh-reply-count"></span><button class="sh-reply-ok" type="button"></button></div>';
        fill(box, rows[i]);
        box.querySelector(".sh-reply-count").textContent = rows.length > 1 ? (i + 1) + " of " + rows.length : "Kept in your Inbox";
        var ok = box.querySelector(".sh-reply-ok");
        ok.textContent = i < rows.length - 1 ? "Next" : "Got it";
        ok.addEventListener("click", function(){
          markSeen(rows[i]);
          if (i < rows.length - 1) { i++; render(); } else close();
        });
        /* closing marks only the one on screen as read; the others show next visit (and sit in the Inbox) */
        box.querySelector(".sh-reply-x").addEventListener("click", function(){ markSeen(rows[i]); close(); });
      }
      render();
    }

    /* ---------- inbox ---------- */
    function openInbox(){
      injectCss();
      if (window.shCloseWidgetPanels) try { window.shCloseWidgetPanels(); } catch (e) {}
      var prev = document.querySelector(".sh-inbox"); if (prev) prev.remove();
      var pop = document.querySelector(".sh-reply"); if (pop) pop.remove();
      var opener = document.activeElement;
      var wrap = document.createElement("div");
      wrap.className = "sh-inbox";
      wrap.innerHTML = '<div class="sh-inbox-card" role="dialog" aria-modal="true" aria-labelledby="sh-inbox-h">' +
        '<div class="sh-inbox-head"><h2 id="sh-inbox-h">Inbox</h2><button class="sh-reply-x" type="button" aria-label="Close">&times;</button></div>' +
        '<div class="sh-inbox-list"><div class="sh-inbox-empty">Loading…</div></div></div>';
      document.body.appendChild(wrap);
      function close(){ wrap.remove(); document.removeEventListener("keydown", onKey); try { if (opener && opener.focus) opener.focus(); } catch (e) {} }
      function onKey(e){ if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);
      wrap.addEventListener("click", function(e){ if (e.target === wrap) close(); });
      wrap.querySelector(".sh-reply-x").addEventListener("click", close);
      wrap.querySelector(".sh-reply-x").focus();
      load().then(function(rows){
        var list = wrap.querySelector(".sh-inbox-list");
        if (!rows.length) {
          list.innerHTML = '<div class="sh-inbox-empty">Nothing here yet. When a problem you report or an idea you suggest is dealt with, the reply lands here, along with news for the whole class and any survey you haven\'t answered.</div>';
          return;
        }
        list.innerHTML = "";
        rows.forEach(function(r){
          var el = document.createElement("div");
          el.className = "sh-inbox-item";
          if (r.kind === "survey") surveyItem(el, r);
          else { el.innerHTML = CARD; fill(el, r); }
          if (isUnread(r)) {
            var tag = document.createElement("span"); tag.className = "sh-inbox-new"; tag.textContent = "New";
            el.querySelector(".sh-reply-top").appendChild(tag);
          }
          list.appendChild(el);
        });
        rows.forEach(function(r){ if (isUnread(r)) markSeen(r); });
      });
    }
    api.open = openInbox;
    document.addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("[data-sh-inbox]");
      if (b) { e.preventDefault(); openInbox(); }
    });
    if (pendingOpen) openInbox();

    setTimeout(function(){
      load().then(function(rows){
        var now = Date.now();
        var fresh = rows.filter(function(r){
          return r.kind !== "survey" && isUnread(r) && (r.kind !== "notice" || !r.expires_at || new Date(r.expires_at).getTime() > now);
        }).reverse();  /* oldest first */
        if (fresh.length && !document.querySelector(".sh-inbox")) popup(fresh.slice(0, 10));
      });
    }, 1500);
  }
})();
