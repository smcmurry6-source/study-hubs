-- v57 (2026-11-13): Visit someone random, from the whole class (vault/tasks/done/2026-11-12-redesign-visiting.md; how
-- it works: vault/reference/game-server.md, "Visiting"). Written and tested on a throwaway copy of supabase/schema.sql
-- with migration_v54, migration_v55 and migration_v56 (tools/release/xp.js, tools/release/rls.js); applied to the live
-- project at the redesign's release with them, not before. Until then it is listed in supabase/pending-migrations.txt,
-- after v56. It needs migration_v54 (sh_visit_key, get_place) and changes nothing in it: migration_v54.sql is not to be
-- changed (Sam, 2026-11-12), so this is a new file.
--
-- Sam, 2026-11-13: "i want random to be for the whole class". The new dashboard's "Visit someone random" picked among
-- the rows of the board on the screen, because the page only ever holds the keys the boards hand out. This picks on the
-- server, from everyone get_place can open (anyone with XP, an answer streak or an arcade score: the same people), and
-- hands back what get_place would for them plus their visit key, so the page can go back to them and on to the next.
--
-- What it adds: get_random_place(p_visitor, p_skip), one read.
--   - never you: not your own id, nor the id your linked devices share, nor any device linked to another (its place
--     is the one under the id that remains, which can be picked itself);
--   - p_skip: up to 100 visit keys the page has already shown on this trip; anyone else comes first, so a trip goes
--     through the class before it sees someone twice, and once everyone has been seen it starts again (never nothing
--     while there is someone else);
--   - nothing when there is no one else, or the visitor id is malformed;
--   - the answer is get_place's (name, what stands in each slot, rank, mastery flair) and `visit`, the key the boards
--     show for that person: never a visitor id, XP, a date or anything a place doesn't show. No opt-out, as on the
--     boards (Sam, 2026-11-11).

create or replace function public.get_random_place(p_visitor text, p_skip text[] default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me text;
  skip text[];
  v text;
  k text;
begin
  if p_visitor is not null and length(p_visitor) not between 1 and 80 then return null; end if;
  me := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
  skip := array(select s from unnest(coalesce(p_skip, '{}'::text[])) s where s ~ '^[0-9a-f]{24}$' limit 100);
  select z.visitor_id into v from (
    select x.visitor_id from xp_visitors x
    union select c.visitor_id from correct_streaks c
    union select a.visitor_id from arcade_scores a
  ) z
  where z.visitor_id is distinct from me and z.visitor_id is distinct from p_visitor
    and not exists (select 1 from visitor_links l where l.alias_id = z.visitor_id)
  order by (cardinality(skip) > 0 and sh_visit_key(z.visitor_id) = any(skip)), random()
  limit 1;
  if v is null then return null; end if;
  k := sh_visit_key(v);
  return get_place(k) || jsonb_build_object('visit', k);
end;
$$;

-- ====================================================================== grants
revoke all on function public.get_random_place(text, text[]) from public;
grant execute on function public.get_random_place(text, text[]) to anon, authenticated;
