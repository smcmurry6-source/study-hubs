-- migration_v41 (2026-10-21): "Is this your other device?" When someone saves a name that another device already uses
-- (same name, ignoring case and outer spaces) and the two ids aren't linked, widget/linkask.js offers to link them.
-- Names are already public on the leaderboards, so saying "this name is taken" gives nothing away. The check follows
-- visitor_links both ways, so devices already linked into one id never count as a match.
-- Applied to the live database 2026-10-21 via the Supabase connector.
create or replace function public.name_shared(p_visitor text, p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  with me as (select coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor) as id)
  select case
    when p_visitor is null or length(p_visitor) not between 1 and 80 then false
    when p_name is null or length(btrim(p_name)) not between 1 and 24 then false
    else exists (
      select 1 from visitor_names vn, me
      where lower(btrim(vn.display_name)) = lower(btrim(p_name))
        and vn.visitor_id <> p_visitor
        and coalesce((select primary_id from visitor_links where alias_id = vn.visitor_id), vn.visitor_id) <> me.id)
  end;
$$;
grant execute on function public.name_shared(text, text) to anon, authenticated;
