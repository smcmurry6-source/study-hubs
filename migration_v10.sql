-- ============================================================
-- migration_v10.sql — class-wide arcade leaderboards (first used by
-- hubs/msk-exam3 "Bone Zone Arcade": games sort / snake / stack / match / hangman / fact / blaster / search / whack).
--
-- arcade_scores: one row per finished game. Reads return each
-- visitor's BEST score per (hub, game), ranked, using the same
-- display-name fallback as every other leaderboard
-- (visitor_names.display_name, else anon_name(visitor_id)).
--
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================

create table if not exists arcade_scores (
  id bigint generated always as identity primary key,
  hub text not null,
  game text not null,
  visitor_id text not null,
  score int not null,
  played_at timestamptz not null default now()
);
alter table arcade_scores enable row level security;
-- no select policy — function-only access

create index if not exists arcade_scores_board_idx on arcade_scores (hub, game, score desc);
create index if not exists arcade_scores_visitor_idx on arcade_scores (visitor_id, hub, game);

-- write-only from the client, no secret (same pattern as record_nuke_launch).
-- Light sanity limits: known game ids, score 1..200000, at most one
-- submission per visitor/game every 10 seconds.
create or replace function submit_arcade_score(p_visitor text, p_hub text, p_game text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_game not in ('sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack') then return; end if;
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

-- public read: top p_limit best scores for one hub+game, plus the caller's own
-- row (is_me = true) even when it falls outside the top p_limit.
create or replace function get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit int default 10)
returns table(rnk bigint, display_name text, best int, plays bigint, is_me boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays
    from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game
    group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk
    from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)) as display_name, r.best, r.plays,
         (p_visitor is not null and r.visitor_id = p_visitor) as is_me
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50))
     or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;
grant execute on function get_arcade_leaderboard(text, text, text, int) to anon, authenticated;
