-- migration_v37 (2026-10-20): feature events, for the things clicks and study time can't answer.
--
-- Clicks (ui_clicks) count button taps and activity_pings count time, but some questions had no data at all:
-- who typed TIMMY, who said "No thanks" to Timmy Tooth or turned him off later (Settings "Off" buttons all look the
-- same as clicks), how far people got in a podcast episode, how many minutes of lecture narration were heard, who
-- moved a diagram's slider or tapped its parts, and which settings people actually have on.
-- widget/clicks.js now also keeps a small counter per event kind (window.shTrack(kind, n)) and sends it with the
-- click batch to record_events: one row per day, page (hub or "dashboard"), kind and visitor, n summed.
-- Kinds are short lowercase names, e.g. "egg:timmy-start", "pet:no-thanks", "pref:pet=off", "pod:exam4-review:q2",
-- "tts:secs", "fig:sarcomere", "state:pet=dash" (a once-a-day snapshot of each visitor's settings) and "view".
-- Automated browsers send nothing (navigator.webdriver), same as clicks.
--
-- get_feature_events (admin): per page and kind, people and total n in the range. review/ -> Clicks shows it.

create table if not exists public.feature_events (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  kind text not null,
  visitor_id text not null,
  n integer not null default 0,
  primary key (day, hub, kind, visitor_id)
);
create index if not exists feature_events_kind_idx on public.feature_events (kind, day);
alter table public.feature_events enable row level security;

create or replace function public.record_events(p_hub text, p_visitor text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; k text; n int; c int := 0;
begin
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' or p_visitor is null or length(p_visitor) not between 8 and 80
     or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    c := c + 1; exit when c > 40;
    k := lower(coalesce(it->>'k', ''));
    continue when k !~ '^[a-z0-9][a-z0-9:=_.+-]{0,63}$';
    n := least(greatest(coalesce((it->>'n')::numeric, 1), 1), 3600)::int;  -- seconds of listening come in chunks
    insert into feature_events (hub, kind, visitor_id, n) values (p_hub, k, p_visitor, n)
      on conflict (day, hub, kind, visitor_id) do update set n = least(feature_events.n + excluded.n, 1000000);
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;
grant execute on function public.record_events(text, text, jsonb) to anon, authenticated;

create or replace function public.get_feature_events(p_secret text, p_days integer default 30, p_hub text default null)
returns table(hub text, kind text, people bigint, total bigint, days bigint, last_day date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select e.hub, e.kind, count(distinct e.visitor_id)::bigint, sum(e.n)::bigint, count(distinct e.day)::bigint, max(e.day)
  from feature_events e
  where e.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 365))
    and (p_hub is null or e.hub = p_hub)
  group by e.hub, e.kind order by 3 desc, 4 desc limit 2000;
end;
$$;
grant execute on function public.get_feature_events(text, integer, text) to anon, authenticated;
