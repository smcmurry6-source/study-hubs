-- migration_v40 (2026-10-21): the arcade revamp (six games per hub, shared widget/games.js) adds three game ids to the
-- class leaderboards: 'board' (Showdown quiz board), 'cloze' (Mind the Gap) and 'escape' (Operatory Escape).
-- 'smile' and 'cross' were already allowed. Old ids stay so archived hubs' arcades keep posting.
-- Same signature, so create or replace keeps the anon grant.
-- Applied to the live database 2026-10-21 via the Supabase connector.
create or replace function public.submit_arcade_score(p_visitor text, p_hub text, p_game text, p_score integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_game not in (
    'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',          -- msk-exam3 Bone Zone Arcade
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross',  -- perio Pocket Arcade
    'board', 'cloze', 'escape'                                                                   -- shared games (widget/games.js)
  ) then return; end if;
  if p_score is null or p_score < 1 or p_score > 200000 then return; end if;
  if exists (select 1 from arcade_scores where visitor_id = p_visitor and hub = coalesce(p_hub, '') and game = p_game
             and played_at > now() - interval '10 seconds') then return; end if;
  insert into arcade_scores (hub, game, visitor_id, score) values (coalesce(p_hub, ''), p_game, p_visitor, p_score);
end;
$$;
