-- v48: admin_reset_changelog refuses a missing secret.
-- It compared the secret with `p_secret <> '...'`. In SQL a comparison with NULL is NULL, not true, so a call with
-- p_secret = null skipped the check, and anyone could empty the site changelog and write their own entries into it.
-- It now checks the secret with sh_admin_ok() like every other admin function (`is not distinct from`, so NULL fails).
-- Found by /reddit-scout's first run (tools/reddit-scout/log.md, 2026-11-04). Nothing in the repo calls this function.

create or replace function public.admin_reset_changelog(p_secret text, p_entries jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare entry jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  delete from changelog;
  for entry in select * from jsonb_array_elements(p_entries) loop
    insert into changelog (hub, message, created_at)
    values (entry->>'hub', entry->>'message', coalesce((entry->>'created_at')::timestamptz, now()));
  end loop;
end;
$$;
