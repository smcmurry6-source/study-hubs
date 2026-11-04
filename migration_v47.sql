-- v47: likes, dislikes and comments on Timmy Time episodes (widget/podcast.js; rule: vault/rules/podcast-reactions.md).
-- Under every episode card: a like and a dislike (one per visitor, tap again to take it back), the episode's lore comments
-- (written into the hub's SH_PODCAST.fans, not stored here) and the class's own comments. A comment is posted under the
-- visitor's leaderboard name (get_display_name, so nobody can post as someone else), 280 characters at most, at most 5
-- per visitor per episode a day and one every 20 seconds. It shows at once (Sam, 2026-11-04). Its author can delete it;
-- anyone can report it, and 3 different reporters hide it until Sam looks. The admin page's Inbox lists every comment
-- (admin_pod_comments) and can hide or restore any (admin_hide_pod_comment).

create table if not exists public.podcast_reactions (
  hub text not null,
  episode text not null,
  visitor_id text not null,
  val smallint not null check (val in (-1, 1)),
  updated_at timestamptz not null default now(),
  primary key (hub, episode, visitor_id)
);
create table if not exists public.podcast_comments (
  id bigint generated always as identity primary key,
  hub text not null,
  episode text not null,
  visitor_id text not null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  hidden_by text  -- 'self', 'reports' or 'admin'
);
create index if not exists podcast_comments_ep on public.podcast_comments (hub, episode, created_at);
create index if not exists podcast_comments_visitor on public.podcast_comments (visitor_id, created_at);
create table if not exists public.podcast_comment_reports (
  comment_id bigint not null references public.podcast_comments (id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, visitor_id)
);
alter table public.podcast_reactions enable row level security;        -- no policies: only the functions below touch them
alter table public.podcast_comments enable row level security;
alter table public.podcast_comment_reports enable row level security;

-- { likes, dislikes, mine: -1|0|1, comments: [{ id, name, body, at, mine, reported }] }, oldest comment first (the latest 200)
create or replace function public.pod_feed(p_hub text, p_ep text, p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'likes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = 1),
    'dislikes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = -1),
    'mine', coalesce((select val from podcast_reactions where hub = p_hub and episode = p_ep and visitor_id = p_visitor), 0),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'body', c.body, 'at', c.created_at,
               'mine', c.visitor_id = p_visitor,
               'reported', exists (select 1 from podcast_comment_reports r where r.comment_id = c.id and r.visitor_id = p_visitor))
             order by c.created_at)
      from (select * from podcast_comments where hub = p_hub and episode = p_ep and not hidden
            order by created_at desc limit 200) c), '[]'::jsonb));
$$;

-- p_val: 1 like, -1 dislike, 0 take it back. Returns the new counts, as pod_feed without the comments.
create or replace function public.pod_react(p_hub text, p_ep text, p_visitor text, p_val integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or length(coalesce(p_ep, '')) not between 1 and 60 or p_val not in (-1, 0, 1) then return null; end if;
  if p_val = 0 then
    delete from podcast_reactions where hub = p_hub and episode = p_ep and visitor_id = p_visitor;
  else
    insert into podcast_reactions (hub, episode, visitor_id, val) values (p_hub, p_ep, p_visitor, p_val)
      on conflict (hub, episode, visitor_id) do update set val = excluded.val, updated_at = now();
  end if;
  return jsonb_build_object(
    'likes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = 1),
    'dislikes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = -1),
    'mine', p_val);
end;
$$;

-- { ok: true, id, name, at } or { ok: false, error: 'empty' | 'long' | 'slow' | 'limit' | 'bad' }
create or replace function public.pod_comment(p_hub text, p_ep text, p_visitor text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); n text; r podcast_comments;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or length(coalesce(p_ep, '')) not between 1 and 60 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if length(b) = 0 then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  if length(b) > 280 then return jsonb_build_object('ok', false, 'error', 'long'); end if;
  if exists (select 1 from podcast_comments where visitor_id = p_visitor and created_at > now() - interval '20 seconds') then
    return jsonb_build_object('ok', false, 'error', 'slow'); end if;
  if (select count(*) from podcast_comments where visitor_id = p_visitor and hub = p_hub and episode = p_ep
      and created_at > now() - interval '1 day') >= 5 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  n := left(coalesce(nullif(btrim(get_display_name(p_visitor)), ''), 'A classmate'), 24);
  insert into podcast_comments (hub, episode, visitor_id, name, body) values (p_hub, p_ep, p_visitor, n, b) returning * into r;
  return jsonb_build_object('ok', true, 'id', r.id, 'name', r.name, 'at', r.created_at);
end;
$$;

-- the author takes their own comment down
create or replace function public.pod_delete_comment(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update podcast_comments set hidden = true, hidden_by = 'self' where id = p_id and visitor_id = p_visitor and not hidden;
  return found;
end;
$$;

-- anyone reports a comment once; the third different reporter hides it
create or replace function public.pod_report_comment(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if not exists (select 1 from podcast_comments where id = p_id and visitor_id <> p_visitor) then return false; end if;
  insert into podcast_comment_reports (comment_id, visitor_id) values (p_id, p_visitor) on conflict do nothing;
  if (select count(*) from podcast_comment_reports where comment_id = p_id) >= 3 then
    update podcast_comments set hidden = true, hidden_by = 'reports' where id = p_id and not hidden;
  end if;
  return true;
end;
$$;

-- admin: every comment from the last p_days, newest first, with its report count
create or replace function public.admin_pod_comments(p_secret text, p_days integer default 60)
returns table (id bigint, hub text, episode text, name text, body text, created_at timestamptz, hidden boolean,
               hidden_by text, reports bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select c.id, c.hub, c.episode, c.name, c.body, c.created_at, c.hidden, c.hidden_by,
           (select count(*) from podcast_comment_reports r where r.comment_id = c.id)
    from podcast_comments c
    where c.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 60), 400)))
    order by c.created_at desc limit 500;
end;
$$;

create or replace function public.admin_hide_pod_comment(p_secret text, p_id bigint, p_hidden boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  update podcast_comments set hidden = coalesce(p_hidden, true),
    hidden_by = case when coalesce(p_hidden, true) then 'admin' else null end where id = p_id;
  return found;
end;
$$;

revoke all on function public.pod_feed(text, text, text) from public;
revoke all on function public.pod_react(text, text, text, integer) from public;
revoke all on function public.pod_comment(text, text, text, text) from public;
revoke all on function public.pod_delete_comment(text, bigint) from public;
revoke all on function public.pod_report_comment(text, bigint) from public;
revoke all on function public.admin_pod_comments(text, integer) from public;
revoke all on function public.admin_hide_pod_comment(text, bigint, boolean) from public;
grant execute on function public.pod_feed(text, text, text) to anon, authenticated;
grant execute on function public.pod_react(text, text, text, integer) to anon, authenticated;
grant execute on function public.pod_comment(text, text, text, text) to anon, authenticated;
grant execute on function public.pod_delete_comment(text, bigint) to anon, authenticated;
grant execute on function public.pod_report_comment(text, bigint) to anon, authenticated;
grant execute on function public.admin_pod_comments(text, integer) to anon, authenticated;
grant execute on function public.admin_hide_pod_comment(text, bigint, boolean) to anon, authenticated;
