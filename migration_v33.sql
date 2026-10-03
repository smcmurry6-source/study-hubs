-- migration_v33 (2026-10-03): record when someone unlocks a tactical nuke, not only when they launch one.
--
-- Until now the only record was nuke_launches, so "unlocked but never used" could only be guessed from
-- personal_answers (the in-page streak resets on reload, which the data doesn't show). widget/v3.js now calls
-- record_nuke_unlock the moment the badge appears (100 right in a row on one page load).
--
-- get_nuke_unlocks (admin): per hub, unlocks in the range and how many went unused. An unlock counts as used
-- when the same person launches in the same hub after it and before their next unlock there (launching resets
-- the streak, so each unlock is followed by at most one launch). Unlocks before today were not recorded.

create table if not exists public.nuke_unlocks (
  id bigint generated always as identity primary key,
  hub text not null default '',
  visitor_id text not null,
  unlocked_at timestamptz not null default now()
);
create index if not exists nuke_unlocks_unlocked_idx on public.nuke_unlocks (unlocked_at);
alter table public.nuke_unlocks enable row level security;

create or replace function public.record_nuke_unlock(p_hub text, p_visitor text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 or length(coalesce(p_hub, '')) > 40 then return; end if;
  -- an unlock takes 100 answers, so two from one person in one hub within 5 minutes is a double fire
  if exists (select 1 from nuke_unlocks where visitor_id = p_visitor and hub = coalesce(p_hub, '')
             and unlocked_at > now() - interval '5 minutes') then return; end if;
  insert into nuke_unlocks (hub, visitor_id) values (coalesce(p_hub, ''), p_visitor);
end;
$$;
grant execute on function public.record_nuke_unlock(text, text) to anon, authenticated;

create or replace function public.get_nuke_unlocks(p_secret text, p_days integer default 30)
returns table(hub text, unlocks bigint, unused bigint, unlockers bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with u as (
    select n.hub, n.visitor_id, n.unlocked_at,
           lead(n.unlocked_at) over (partition by n.visitor_id, n.hub order by n.unlocked_at) as next_at
    from nuke_unlocks n
  ), m as (
    select u.hub, u.visitor_id, u.unlocked_at,
           exists (select 1 from nuke_launches l where l.visitor_id = u.visitor_id and l.hub = u.hub
                   and l.launched_at >= u.unlocked_at and (u.next_at is null or l.launched_at < u.next_at)) as used
    from u where u.unlocked_at >= now() - (p_days || ' days')::interval
  )
  select coalesce(nullif(m.hub, ''), '(unknown)'), count(*)::bigint, count(*) filter (where not m.used)::bigint,
         count(distinct m.visitor_id)::bigint
  from m group by coalesce(nullif(m.hub, ''), '(unknown)') order by 2 desc;
end;
$$;
