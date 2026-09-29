/* study-hubs replies: when a report ("Report a problem" / the Report button on a question) or a suggestion
   someone sent has been dealt with, tell them once, with the reply written when it was resolved (for a
   question report, what was fixed). Rows come from get_my_replies (only this visitor's, resolved, not yet
   seen); closing or moving past one calls mark_reply_seen. It also shows notices to everyone (get_notices,
   posted with admin_post_notice) once per device (sh_notice_seen); a notice with a hub only shows on that hub
   and the dashboard. Used by widget/v3.js (hubs) and the dashboard:
     shReplies.start({ sb: supabaseClient, visitor: "..." or null, hub: "perio" | "dashboard" }) */
(function(){
  "use strict";
  if (window.shReplies) return;
  var HUB_NAME = { "msk-exam3": "MSK Exam 3", perio: "Periodontology", hepatobiliary: "GI Exam 2", "gi-exam1": "GI Exam 1",
    genetics: "Genetics", "fixed-pros": "Fixed Pros" };
  var CSS =
    ".sh-reply{--r-bg:var(--surface,#fff);--r-ink:var(--ink,#15202A);--r-ink2:var(--ink-soft,var(--ink-2,#4A5864));" +
    "--r-line:var(--line,rgba(0,0,0,.12));--r-good:var(--good,#1F8A5B);--r-bg2:var(--surface-2,rgba(127,127,127,.08));" +
    "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:10001;width:min(440px,calc(100vw - 32px));" +
    "max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:16px 18px 14px;border-radius:16px;" +
    "background:var(--r-bg);color:var(--r-ink);border:1px solid var(--r-line);" +
    "box-shadow:0 2px 6px rgba(20,16,12,.08),0 18px 44px -14px rgba(20,16,12,.4);" +
    "font-family:var(--font-body,var(--sans,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif));font-size:14.5px;line-height:1.45;" +
    "animation:shReplyIn .28s ease-out;}" +
    "@keyframes shReplyIn{from{opacity:0;transform:translate(-50%,-8px);}to{opacity:1;transform:translate(-50%,0);}}" +
    "@media (prefers-reduced-motion:reduce){.sh-reply{animation:none;}}" +
    ".sh-reply *{box-sizing:border-box;}" +
    ".sh-reply-top{display:flex;align-items:center;gap:8px;margin:0 28px 8px 0;font-weight:700;font-size:15.5px;}" +
    ".sh-reply-top svg{flex:none;width:20px;height:20px;color:var(--r-good);}" +
    ".sh-reply-x{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;" +
    "color:var(--r-ink2);font-size:22px;line-height:1;cursor:pointer;}" +
    ".sh-reply-x:hover{background:var(--r-bg2);}" +
    ".sh-reply-meta{font-size:12.5px;color:var(--r-ink2);margin-bottom:8px;}" +
    ".sh-reply-you{font-size:13px;color:var(--r-ink2);border-left:3px solid var(--r-line);padding:2px 0 2px 10px;margin:0 0 10px;" +
    "white-space:pre-wrap;overflow-wrap:anywhere;}" +
    ".sh-reply-msg{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 12px;}" +
    ".sh-reply-row{display:flex;align-items:center;justify-content:flex-end;gap:10px;}" +
    ".sh-reply-count{margin-right:auto;font-size:12.5px;color:var(--r-ink2);}" +
    ".sh-reply-ok{border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;" +
    "background:var(--r-ink);color:var(--r-bg);}";
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/></svg>';

  /* the widget appends "  — question <id> · <section>" to a report; show the student only what they typed */
  function ownWords(note){ return String(note || "").replace(/\s+—\s+(question\s+\S+|[a-z-]+\/[\w-]+)(\s+·\s+\S+)?\s*$/i, "").trim(); }
  function qidOf(note){ var m = /—\s+question\s+(\S+)/.exec(String(note || "")); return m ? m[1] : ""; }

  window.shReplies = {
    start: function(o){
      if (!o || !o.sb) return;
      var sb = o.sb, visitor = o.visitor || null, hub = o.hub || "";
      var SEEN_KEY = "sh_notice_seen";
      function seenNotices(){ try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") || []; } catch (e) { return []; } }
      function rowsOf(res){ return res && !res.error && Array.isArray(res.data) ? res.data : []; }
      function none(){ return { data: [] }; }
      setTimeout(function(){
        var mine = visitor ? sb.rpc("get_my_replies", { p_visitor: visitor }).then(null, none) : Promise.resolve(none());
        var all = sb.rpc("get_notices").then(null, none);
        Promise.all([mine, all]).then(function(r){
          var done = seenNotices();
          var notices = rowsOf(r[1]).filter(function(n){
            return done.indexOf(n.id) < 0 && (!n.hub || hub === "dashboard" || n.hub === hub);
          }).map(function(n){ n.kind = "notice"; return n; });
          var rows = rowsOf(r[0]).concat(notices);
          if (rows.length) show(rows);
        }, function(){});
      }, 1500);

      function seen(r){
        if (r.kind === "notice") {
          try { var d = seenNotices(); if (d.indexOf(r.id) < 0) d.push(r.id); localStorage.setItem(SEEN_KEY, JSON.stringify(d.slice(-50))); } catch (e) {}
          return;
        }
        try { sb.rpc("mark_reply_seen", { p_visitor: visitor, p_kind: r.kind, p_id: r.id }).then(function(){}, function(){}); } catch (e) {}
      }

      function show(rows){
        if (!document.getElementById("sh-reply-css")) {
          var st = document.createElement("style"); st.id = "sh-reply-css"; st.textContent = CSS; document.head.appendChild(st);
        }
        var i = 0;
        var box = document.createElement("div");
        box.className = "sh-reply"; box.setAttribute("role", "dialog"); box.setAttribute("aria-live", "polite");
        box.setAttribute("aria-labelledby", "sh-reply-title");
        document.body.appendChild(box);
        function close(){ box.remove(); document.removeEventListener("keydown", onKey); }
        function onKey(e){ if (e.key === "Escape") { seen(rows[i]); close(); } }
        document.addEventListener("keydown", onKey);
        function render(){
          var r = rows[i], flag = r.kind === "flag", notice = r.kind === "notice";
          var yours = notice ? "" : ownWords(r.note), qid = flag ? qidOf(r.note) : "";
          var reply = notice ? r.message : (r.reply || "").trim() || (flag
            ? "It's been looked at and fixed where needed. Thanks for flagging it."
            : "It's been looked at. Thanks for the idea.");
          box.innerHTML =
            '<button class="sh-reply-x" type="button" aria-label="Close">&times;</button>' +
            '<div class="sh-reply-top" id="sh-reply-title">' + CHECK + '<span></span></div>' +
            '<div class="sh-reply-meta"></div>' +
            (yours ? '<div class="sh-reply-you"></div>' : '') +
            '<div class="sh-reply-msg"></div>' +
            '<div class="sh-reply-row"><span class="sh-reply-count"></span><button class="sh-reply-ok" type="button"></button></div>';
          box.querySelector(".sh-reply-top span").textContent = notice ? r.title : flag ? "Your report was addressed" : "Your suggestion was addressed";
          var meta = [HUB_NAME[r.hub] || r.hub || ""];
          if (qid) meta.push("question " + qid);
          box.querySelector(".sh-reply-meta").textContent = meta.filter(Boolean).join(" · ");
          if (yours) box.querySelector(".sh-reply-you").textContent = "You wrote: " + (yours.length > 240 ? yours.slice(0, 237) + "..." : yours);
          box.querySelector(".sh-reply-msg").textContent = reply;
          box.querySelector(".sh-reply-count").textContent = rows.length > 1 ? (i + 1) + " of " + rows.length : "";
          var ok = box.querySelector(".sh-reply-ok");
          ok.textContent = i < rows.length - 1 ? "Next" : "Got it";
          ok.addEventListener("click", function(){
            seen(rows[i]);
            if (i < rows.length - 1) { i++; render(); } else close();
          });
          /* closing marks only the one on screen as seen; any others show next visit */
          box.querySelector(".sh-reply-x").addEventListener("click", function(){ seen(rows[i]); close(); });
        }
        render();
      }
    }
  };
})();
