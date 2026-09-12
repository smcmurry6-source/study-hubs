-- ============================================================
-- migration_v6.sql — visitor analytics (unique visitors, time per
-- visit, time per hub, time per section) for the review admin page.
--
-- How it works: every hub pings record_activity_ping roughly every
-- 25 seconds while the tab is actually visible (paused when the tab
-- is backgrounded, so idle tabs don't inflate the numbers), tagged
-- with a per-page-load visit_id and whatever top-level mode
-- (#modeSwitch [data-mode]) is currently active. Minutes are
-- approximated as ping_count * 25s — good enough for "roughly how
-- long", not meant to be to-the-second accurate.
--
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================

create table if not exists activity_pings (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  visit_id text not null,
  hub text not null default '',
  section text,
  pinged_at timestamptz not null default now()
);
alter table activity_pings enable row level security;
-- no select policy — function-only access, same pattern as personal_answers/visitor_names

create index if not exists activity_pings_visitor_idx on activity_pings (visitor_id, pinged_at);
create index if not exists activity_pings_visit_idx on activity_pings (visit_id, pinged_at);
create index if not exists activity_pings_hub_idx on activity_pings (hub, pinged_at);

-- anon can insert pings (write-only from the client, same pattern as
-- record_presence_ping/record_answer elsewhere) — no secret needed,
-- this just logs a heartbeat, it can't read anything back.
create or replace function record_activity_ping(p_visitor text, p_visit text, p_hub text, p_section text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_visit is null or length(trim(p_visit)) = 0 then return; end if;
  insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
  values (p_visitor, p_visit, coalesce(p_hub, ''), nullif(p_section, ''), now());
end;
$$;

-- ---------- admin-secret-gated reads (same '093025' secret as get_reports) ----------

-- overall: how many people, how many visits, how long each visit ran
create or replace function get_visitor_summary(p_secret text, p_days int default 30)
returns table(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  with visits as (
    select
      visit_id,
      visitor_id,
      extract(epoch from (max(pinged_at) - min(pinged_at))) / 60.0 as span_minutes
    from activity_pings
    where pinged_at >= now() - (p_days || ' days')::interval
    group by visit_id, visitor_id
  )
  select
    count(distinct visitor_id)::bigint as unique_visitors,
    count(*)::bigint as total_visits,
    round(avg(greatest(span_minutes, 0.4))::numeric, 1) as avg_visit_minutes
  from visits;
end;
$$;

-- time spent per hub
create or replace function get_visitor_by_hub(p_secret text, p_days int default 30)
returns table(hub text, unique_visitors bigint, total_minutes numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  select
    coalesce(nullif(a.hub, ''), '(unknown)') as hub,
    count(distinct a.visitor_id)::bigint as unique_visitors,
    round((count(*) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_pings a
  where a.pinged_at >= now() - (p_days || ' days')::interval
  group by coalesce(nullif(a.hub, ''), '(unknown)')
  order by total_minutes desc;
end;
$$;

-- time spent per section (mode) within each hub
create or replace function get_visitor_by_section(p_secret text, p_days int default 30)
returns table(hub text, section text, total_minutes numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  select
    coalesce(nullif(a.hub, ''), '(unknown)') as hub,
    coalesce(a.section, '(unspecified)') as section,
    round((count(*) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_pings a
  where a.pinged_at >= now() - (p_days || ' days')::interval
  group by coalesce(nullif(a.hub, ''), '(unknown)'), coalesce(a.section, '(unspecified)')
  order by hub, total_minutes desc;
end;
$$;
