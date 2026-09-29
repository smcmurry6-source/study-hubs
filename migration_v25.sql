-- migration_v25 (2026-09-29): tell people when their report or suggestion has been dealt with.
-- Question reports (question_flags) and suggestions (hub_suggestions) now keep the sender's visitor id, and resolving
-- one can carry a reply ("what was fixed"). The next time that person opens a hub or the dashboard, widget/replies.js
-- shows the reply once (get_my_replies), then marks it seen (mark_reply_seen).
-- Rows sent before this migration have no visitor id, so nobody is notified about them unless one is filled in by hand.

alter table public.question_flags
  add column if not exists visitor_id text,
  add column if not exists reply text,
  add column if not exists resolved_at timestamptz,
  add column if not exists reply_seen_at timestamptz;
alter table public.hub_suggestions
  add column if not exists visitor_id text,
  add column if not exists reply text,
  add column if not exists resolved_at timestamptz,
  add column if not exists reply_seen_at timestamptz;
create index if not exists question_flags_visitor_idx on public.question_flags (visitor_id) where visitor_id is not null;
create index if not exists hub_suggestions_visitor_idx on public.hub_suggestions (visitor_id) where visitor_id is not null;

-- Students still insert straight into the tables, but can't write a reply or resolve their own row
-- (that would let anyone send a "reply" to whoever's visitor id they put in).
drop policy if exists "public insert question_flags" on public.question_flags;
create policy "public insert question_flags" on public.question_flags for insert to public
  with check (resolved = false and reply is null and resolved_at is null and reply_seen_at is null
              and (visitor_id is null or length(visitor_id) between 1 and 80));
drop policy if exists "anon can insert suggestions" on public.hub_suggestions;
create policy "anon can insert suggestions" on public.hub_suggestions for insert to public
  with check (resolved = false and reply is null and resolved_at is null and reply_seen_at is null
              and (visitor_id is null or length(visitor_id) between 1 and 80));

-- ---------- student side (public) ----------
-- Resolved reports/suggestions of this visitor not yet shown, from the last 60 days.
create or replace function public.get_my_replies(p_visitor text)
returns table(kind text, id bigint, hub text, note text, reply text, resolved_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from (
    select 'flag'::text, f.id, f.hub, f.note, f.reply, f.resolved_at from question_flags f
     where p_visitor is not null and f.visitor_id = p_visitor and f.resolved and f.reply_seen_at is null
       and f.resolved_at > now() - interval '60 days'
    union all
    select 'suggestion'::text, s.id, s.hub, s.note, s.reply, s.resolved_at from hub_suggestions s
     where p_visitor is not null and s.visitor_id = p_visitor and s.resolved and s.reply_seen_at is null
       and s.resolved_at > now() - interval '60 days'
  ) r order by 6 limit 10;
$$;

create or replace function public.mark_reply_seen(p_visitor text, p_kind text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return; end if;
  if p_kind = 'flag' then
    update question_flags set reply_seen_at = now() where id = p_id and visitor_id = p_visitor and reply_seen_at is null;
  elsif p_kind = 'suggestion' then
    update hub_suggestions set reply_seen_at = now() where id = p_id and visitor_id = p_visitor and reply_seen_at is null;
  end if;
exception when others then return;
end;
$$;
grant execute on function public.get_my_replies(text) to anon, authenticated;
grant execute on function public.mark_reply_seen(text, text, bigint) to anon, authenticated;

-- ---------- admin side ----------
drop function if exists public.get_reports(text);
create or replace function public.get_reports(p_secret text)
returns table(kind text, id bigint, hub text, note text, resolved boolean, created_at timestamptz,
              reply text, resolved_at timestamptz, can_notify boolean, reply_seen_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select 'flag'::text, f.id, f.hub, f.note, f.resolved, f.created_at, f.reply, f.resolved_at, f.visitor_id is not null, f.reply_seen_at
    from question_flags f
  union all
  select 'suggestion'::text, s.id, s.hub, s.note, s.resolved, s.created_at, s.reply, s.resolved_at, s.visitor_id is not null, s.reply_seen_at
    from hub_suggestions s
  order by 6 desc;
end;
$$;

-- Resolve (or reopen) one report. p_reply is what the student is told; null keeps the current reply.
-- Reopening clears resolved_at and reply_seen_at, so resolving again notifies again.
create or replace function public.set_report_resolved(p_secret text, p_kind text, p_id bigint, p_resolved boolean, p_reply text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r text := nullif(left(trim(coalesce(p_reply, '')), 1500), '');
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_kind = 'flag' then
    update question_flags set resolved = p_resolved, reply = coalesce(r, reply),
      resolved_at = case when p_resolved then now() end, reply_seen_at = null where id = p_id;
  elsif p_kind = 'suggestion' then
    update hub_suggestions set resolved = p_resolved, reply = coalesce(r, reply),
      resolved_at = case when p_resolved then now() end, reply_seen_at = null where id = p_id;
  end if;
end;
$$;
drop function if exists public.set_report_resolved(text, text, bigint, boolean);

-- ---------- notices to everyone ----------
-- For a fix worth telling the whole class about (Sam, 2026-09-29: "for this instance, push a notification to everyone").
-- widget/replies.js shows each live notice once per device (localStorage sh_notice_seen), on the hubs and the dashboard;
-- hub = null means everywhere, otherwise only on that hub's page and the dashboard.
create table if not exists public.site_notices (
  id bigint generated always as identity primary key,
  hub text,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);
alter table public.site_notices enable row level security;

create or replace function public.get_notices()
returns table(id bigint, hub text, title text, message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.id, n.hub, n.title, n.message, n.created_at from site_notices n
   where n.expires_at > now() order by n.created_at limit 5;
$$;
grant execute on function public.get_notices() to anon, authenticated;

create or replace function public.admin_post_notice(p_secret text, p_hub text, p_title text, p_message text, p_days integer default 14)
returns bigint language plpgsql security definer set search_path = public as $$
declare nid bigint;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_message), '') = '' then raise exception 'title and message required'; end if;
  insert into site_notices (hub, title, message, expires_at)
  values (nullif(trim(coalesce(p_hub, '')), ''), left(trim(p_title), 120), left(trim(p_message), 1500),
          now() + make_interval(days => greatest(1, least(coalesce(p_days, 14), 60))))
  returning id into nid;
  return nid;
end;
$$;
