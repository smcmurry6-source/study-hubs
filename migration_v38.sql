-- migration_v38 (2026-10-20): two new hub trophies, kept per hub like the others.
--   'seen-all'     : answered every question in a hub at least once (widget/ranks.js, from get_hub_mastery)
--   'mock-perfect' : every question right on a mock exam of 20+ questions in a hub
-- Only the record_achievement whitelist changes; get_rank_profile already returns every achievement as kind:hub.
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect', 'pet-adopt',
                    'seen-all', 'mock-perfect') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;
