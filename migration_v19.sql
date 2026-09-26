-- migration_v19 (2026-09-26): let a visitor drop their custom name and go back to their generated one
create or replace function public.clear_display_name(p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return null; end if;
  delete from visitor_names where visitor_id = p_visitor;
  return anon_name(p_visitor);
end;
$$;
