-- Read-only permissions audit of a LIVE database (production or staging): RELEASE_TEST_PLAN.md, "Security and RLS".
-- tools/release/rls.js tests supabase/schema.sql in a throwaway database; this checks that the live project still
-- matches it. It reads the system catalogs only: no student rows, no writes. Run it in the Supabase SQL editor or
-- through the Supabase connector's read-only execute_sql, before and after any migration.
-- Every query should return zero rows, except the last one, which should list exactly the tables in
-- tools/release/rls-expectations.json. Anything else is a finding: tell Sam in chat and fix it with a migration;
-- never write the details of an unfixed hole into this public repo, an issue or a PR.

-- 1. tables without row-level security
select 'rls off' as finding, c.relname as object
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
union all
-- 2. security-definer functions that don't pin search_path
select 'definer without search_path', p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
union all
-- 3. admin functions anon can run without a secret parameter
select 'admin function without p_secret', p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'admin\_%'
  and not ('p_secret' = any(coalesce(p.proargnames, '{}')))
  and has_function_privilege('anon', p.oid, 'execute')
union all
-- 4. secret checks written with = or <> (a NULL secret makes them NULL, and the check is skipped; migration_v48)
select 'secret compared with = or <>', p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and 'p_secret' = any(coalesce(p.proargnames, '{}'))
  and p.prosrc ~* 'p_secret\s*(<>|!=|=)\s*'''
  and p.prosrc !~* 'sh_admin_ok\(p_secret\)'
union all
-- 5. helpers the schema revokes that anon can run anyway
select 'internal helper open to anon', p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('sh_admin_ok', 'sh_visitor_xp', 'sh_xp_rebuild')
  and has_function_privilege('anon', p.oid, 'execute')
order by 1, 2;

-- 6. what anon may do to tables directly (compare with tools/release/rls-expectations.json)
select pol.tablename, pol.cmd, array_to_string(pol.roles, ',') as roles
from pg_policies pol
where pol.schemaname = 'public' and pol.roles && array['anon', 'public']::name[]
order by 1, 2;
