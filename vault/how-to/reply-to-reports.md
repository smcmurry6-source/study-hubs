---
type: how-to
tags: [students]
---

# Student reports, suggestions and notices

Reports (`question_flags`) and suggestions (`hub_suggestions`) carry the sender's `visitor_id` (from 2026-09-29).
**Resolving one tells the sender** the next time they open a hub or the dashboard (`widget/replies.js`: a pop-up once,
then kept in their Inbox, in the hub menu and the dashboard's top bar), so always
write the reply: for a question report, what was wrong and what changed, in plain words. Use the admin page's Inbox,
or SQL through the connector: `update question_flags set resolved = true, resolved_at = now(), reply = '...' where id = N`
(`set_report_resolved(p_secret, p_kind, p_id, true, p_reply)` does the same). For a fix the whole class should hear
about, post a notice everyone sees once (and keeps in their Inbox): Inbox → "Tell everyone" (its own title and message,
written for the whole class, not the sender), or `insert into site_notices (hub, title, message)`
(`hub` only labels it, e.g. which hub was fixed; it shows everywhere, pops up for 14 days and stays in the Inbox 60). Ask Sam before sending one to everyone.
