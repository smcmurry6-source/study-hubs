-- ============================================================
-- migration_v11.sql — Pocket Arcade (hubs/perio) game ids.
--
-- Extends submit_arcade_score's game-id whitelist (migration_v10) with the
-- nine Periodontology games. Same table, same get_arcade_leaderboard; perio
-- posts with p_hub = 'perio'.
--
-- APPLIED to Supabase on 2026-09-24 via the Supabase connector
-- (migration name v11_perio_arcade_game_ids). Kept here for history.
-- ============================================================

create or replace function submit_arcade_score(p_visitor text, p_hub text, p_game text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_game not in (
    -- msk-exam3 Bone Zone Arcade
    'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',
    -- perio Pocket Arcade
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross'
  ) then return; end if;
  if p_score is null or p_score < 1 or p_score > 200000 then return; end if;
  if exists (
    select 1 from arcade_scores
    where visitor_id = p_visitor and hub = coalesce(p_hub, '') and game = p_game
      and played_at > now() - interval '10 seconds'
  ) then return; end if;
  insert into arcade_scores (hub, game, visitor_id, score)
  values (coalesce(p_hub, ''), p_game, p_visitor, p_score);
end;
$$;
grant execute on function submit_arcade_score(text, text, text, int) to anon, authenticated;
