-- v45: admin "Time by section" still timed out after v43/v44. get_visitor_summary,
-- get_visitor_by_hub and get_visitor_by_section each counted ~190k raw activity_pings rows
-- (~1.1 s alone), and the admin page sends them with 13 other calls at once, past the 3 s anon
-- limit. A trigger now keeps two small summaries in step with activity_pings:
--   activity_hourly  pings per hour, hub, section and visitor (~10k rows for 241k pings)
--   activity_visits  first and last ping per visit (for "active time per visit" and visit counts)
-- The three admin functions read those instead. The range filter now works by whole hours
-- (a ping counts if its hour starts inside the range), so totals can differ from before by up to
-- an hour's pings at the start of the range. A null section is stored as '' (record_activity_ping
-- turns '' into null, so '' never means a real section). Moving a device's pings
-- (redeem_link_code) rebuilds the affected visitors from activity_pings.

create table if not exists public.activity_hourly (
  h timestamptz not null, hub text not null, section text not null, visitor_id text not null,
  n int not null default 0,
  primary key (h, hub, section, visitor_id)
);
create table if not exists public.activity_visits (
  visit_id text not null, visitor_id text not null,
  first_at timestamptz not null, last_at timestamptz not null,
  primary key (visit_id, visitor_id)
);
create index if not exists activity_hourly_visitor_idx on public.activity_hourly (visitor_id);
create index if not exists activity_visits_last_idx on public.activity_visits (last_at);
create index if not exists activity_visits_visitor_idx on public.activity_visits (visitor_id);
alter table public.activity_hourly enable row level security;
alter table public.activity_visits enable row level security;
revoke all on public.activity_hourly, public.activity_visits from anon, authenticated;

create or replace function public.sh_activity_rebuild(p_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from activity_hourly where visitor_id = any(p_ids);
  delete from activity_visits where visitor_id = any(p_ids);
  insert into activity_hourly (h, hub, section, visitor_id, n)
    select date_trunc('hour', pinged_at), coalesce(hub, ''), coalesce(section, ''), visitor_id, count(*)
    from activity_pings where visitor_id = any(p_ids) group by 1, 2, 3, 4;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    select visit_id, visitor_id, min(pinged_at), max(pinged_at)
    from activity_pings where visitor_id = any(p_ids) group by 1, 2;
end; $$;
revoke all on function public.sh_activity_rebuild(text[]) from public, anon, authenticated;

create or replace function public.sh_activity_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activity_hourly (h, hub, section, visitor_id, n)
    values (date_trunc('hour', new.pinged_at), coalesce(new.hub, ''), coalesce(new.section, ''), new.visitor_id, 1)
    on conflict (h, hub, section, visitor_id) do update set n = activity_hourly.n + 1;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    values (new.visit_id, new.visitor_id, new.pinged_at, new.pinged_at)
    on conflict (visit_id, visitor_id) do update set
      first_at = least(activity_visits.first_at, excluded.first_at),
      last_at = greatest(activity_visits.last_at, excluded.last_at);
  return null;
end; $$;

create or replace function public.sh_activity_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_activity_rebuild(array(select visitor_id from old_rows union select visitor_id from new_rows));
  return null;
end; $$;

create or replace function public.sh_activity_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_activity_rebuild(array(select distinct visitor_id from old_rows));
  return null;
end; $$;

drop trigger if exists activity_pings_sum_ins on public.activity_pings;
drop trigger if exists activity_pings_sum_upd on public.activity_pings;
drop trigger if exists activity_pings_sum_del on public.activity_pings;
create trigger activity_pings_sum_ins after insert on public.activity_pings
  for each row execute function public.sh_activity_on_insert();
create trigger activity_pings_sum_upd after update on public.activity_pings
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.sh_activity_on_update();
create trigger activity_pings_sum_del after delete on public.activity_pings
  referencing old table as old_rows
  for each statement execute function public.sh_activity_on_delete();

-- Backfill, with inserts held off until the migration commits.
lock table public.activity_pings in share row exclusive mode;
truncate public.activity_hourly, public.activity_visits;
insert into public.activity_hourly (h, hub, section, visitor_id, n)
  select date_trunc('hour', pinged_at), coalesce(hub, ''), coalesce(section, ''), visitor_id, count(*)
  from public.activity_pings group by 1, 2, 3, 4;
insert into public.activity_visits (visit_id, visitor_id, first_at, last_at)
  select visit_id, visitor_id, min(pinged_at), max(pinged_at) from public.activity_pings group by 1, 2;
analyze public.activity_hourly;
analyze public.activity_visits;

create or replace function public.get_visitor_by_hub(p_secret text, p_days integer default 30)
returns table(hub text, unique_visitors bigint, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)'), count(distinct a.visitor_id)::bigint,
    round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_hourly a
  where a.h >= date_trunc('hour', now() - (p_days || ' days')::interval)
  group by 1 order by total_minutes desc;
end; $$;

create or replace function public.get_visitor_by_section(p_secret text, p_days integer default 30)
returns table(hub text, section text, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)') as hub, coalesce(nullif(a.section, ''), '(unspecified)'),
    round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_hourly a
  where a.h >= date_trunc('hour', now() - (p_days || ' days')::interval)
  group by 1, 2 order by hub, total_minutes desc;
end; $$;

create or replace function public.get_visitor_summary(p_secret text, p_days integer default 30)
returns table(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric)
language plpgsql security definer set search_path = public as $$
declare since timestamptz := now() - (p_days || ' days')::interval;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select count(distinct v.visitor_id)::bigint, count(*)::bigint,
    round(avg(greatest(extract(epoch from (v.last_at - greatest(v.first_at, since))) / 60.0, 0.4))::numeric, 1)
  from activity_visits v where v.last_at >= since;
end; $$;
