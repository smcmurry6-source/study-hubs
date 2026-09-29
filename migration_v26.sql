-- migration_v26 (2026-09-29): an inbox for replies and notices.
-- The hubs' menu and the dashboard's top bar get an Inbox (widget/replies.js) that keeps every reply to this visitor's
-- reports/suggestions (last 90 days, read or not) and every notice from the last 60 days, so people can reread them.
-- The one-time pop-up still shows what's unread (replies not yet seen; notices not expired and not seen on this device).

create or replace function public.get_my_inbox(p_visitor text)
returns table(kind text, id bigint, hub text, title text, note text, message text, at timestamptz,
              seen boolean, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from (
    select 'flag'::text, f.id, f.hub, null::text, f.note, f.reply, f.resolved_at, f.reply_seen_at is not null, null::timestamptz
      from question_flags f
     where p_visitor is not null and f.visitor_id = p_visitor and f.resolved and f.resolved_at > now() - interval '90 days'
    union all
    select 'suggestion'::text, s.id, s.hub, null::text, s.note, s.reply, s.resolved_at, s.reply_seen_at is not null, null::timestamptz
      from hub_suggestions s
     where p_visitor is not null and s.visitor_id = p_visitor and s.resolved and s.resolved_at > now() - interval '90 days'
    union all
    select 'notice'::text, n.id, n.hub, n.title, null::text, n.message, n.created_at, false, n.expires_at
      from site_notices n
     where n.created_at > now() - interval '60 days'
  ) r order by 7 desc limit 60;
$$;
grant execute on function public.get_my_inbox(text) to anon, authenticated;
