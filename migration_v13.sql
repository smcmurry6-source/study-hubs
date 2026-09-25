-- migration_v13 (2026-09-25): easter-egg state
-- Golden Probe: one question per hub per (Central-time) day is secretly golden; the first
--   classmate to answer it right claims the day and shows on the dashboard.
-- Tooth Fairy: rare catches, counted per visitor for a small collectors' board.
-- Both live in one table; all access is through the functions below (RLS on, no policies).

create table if not exists public.egg_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('golden', 'fairy')),
  hub text not null default '',
  visitor_id text not null,
  qid text,
  day date not null default ((now() at time zone 'America/Chicago')::date),
  created_at timestamptz not null default now()
);
alter table public.egg_events enable row level security;
create unique index if not exists egg_events_golden_once on public.egg_events (hub, day) where kind = 'golden';
create index if not exists egg_events_fairy_visitor on public.egg_events (visitor_id) where kind = 'fairy';

-- returns true only for the first claim of the day on that hub
create or replace function public.claim_golden_probe(p_hub text, p_visitor text, p_qid text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or p_hub is null then return false; end if;
  insert into egg_events (kind, hub, visitor_id, qid) values ('golden', p_hub, p_visitor, p_qid)
  on conflict do nothing;
  return found;
end;
$$;

create or replace function public.get_golden_today()
returns table(hub text, display_name text, qid text, claimed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.hub, coalesce(vn.display_name, anon_name(e.visitor_id)), e.qid, e.created_at
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'golden' and e.day = (now() at time zone 'America/Chicago')::date
  order by e.created_at;
$$;

-- one catch per visitor per minute at most; returns that visitor's total
create or replace function public.record_fairy(p_hub text, p_visitor text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return 0; end if;
  if not exists (select 1 from egg_events where kind = 'fairy' and visitor_id = p_visitor and created_at > now() - interval '1 minute') then
    insert into egg_events (kind, hub, visitor_id) values ('fairy', coalesce(p_hub, ''), p_visitor);
  end if;
  return (select count(*)::int from egg_events where kind = 'fairy' and visitor_id = p_visitor);
end;
$$;

create or replace function public.get_fairy_board(p_limit integer default 5)
returns table(display_name text, catches integer)
language sql stable security definer set search_path = public as $$
  select coalesce(vn.display_name, anon_name(e.visitor_id)), count(*)::int
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'fairy'
  group by e.visitor_id, vn.display_name
  order by count(*) desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;
