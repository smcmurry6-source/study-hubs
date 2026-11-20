-- v87 (2026-11-19): "Is this your other device?" asks only about a device someone has used in the last 3 weeks.
-- Sam, after the data showed the card asking some people over and over about a device nobody had opened in a month:
-- "do 1 and 2" (2 was "stop asking about a device nobody has opened in 3 weeks").
-- name_shared(p_visitor, p_name) (migration_v41) said whether another device, not linked to this one, has saved the same
-- name. widget/linkask.js asks "Is this your other device?" when it does: once a day on page load ("Not now" waits 3
-- days), and right after a name is saved; the v2 bootstrap (get_widget_bootstrap_v2, migration_v82, and v84 while it
-- waits) returns the same answer as `name_shared`. A browser that's been cleared or given up keeps its name row for good,
-- so the card went on asking about it, though there was nothing left to link it to.
-- Now the other device (that is, the person it's linked to, whose id its visits are kept under once linked) needs a visit
-- in activity_visits in the last 21 days. Everything else is as it was: case and spaces ignored, a linked device never
-- counts, a bad id or a name over 24 characters answers false.
-- Written in PL/pgSQL, not SQL: the bootstrap calls it on every page load of a named device, and a security definer SQL
-- function is planned again on every call (migration_v76, vault/reference/shared-infrastructure.md).
-- The visit check runs only for a device with the same name (a handful of rows), through activity_visits_visitor_idx.
-- One function replaced, no table touched: a moment, any time of day (vault/how-to/run-sql-on-the-live-database.md).
-- Copied from main's newest copy (migration_v41.sql, as in supabase/schema.sql).

create or replace function public.name_shared(p_visitor text, p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  n text := lower(btrim(coalesce(p_name, '')));
  me text;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if length(n) not between 1 and 24 then return false; end if;
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  return exists (
    select 1
    from visitor_names vn
    cross join lateral (select coalesce((select l.primary_id from visitor_links l where l.alias_id = vn.visitor_id), vn.visitor_id) as id) o
    where lower(btrim(vn.display_name)) = n
      and vn.visitor_id <> p_visitor
      and o.id <> me
      and exists (select 1 from activity_visits a where a.visitor_id = o.id and a.last_at > now() - interval '21 days'));
end;
$$;
grant execute on function public.name_shared(text, text) to anon, authenticated;
