-- v90 (2026-11-20): the admin page's first read of a new key is left to the job, not worked out inline.
-- vault/tasks/inbox.md, "An admin read the kept copies don't have yet still times out" (found applying migration_v83).
-- (v89 is PR #492's, the Dark Matter crowns.)
--
-- Since v83 the admin page's heavy reads come from admin_cache, worked out ahead by the sh-admin-cache job (10 s limit).
-- But a read with no row yet (a hub's first Question health, a read nobody used for 30 days) was worked out inline by
-- sh_admin_cached, under a visitor's 3 s limit: live, insights takes 4.1 s, Perio's question health 3.6 s, clicks up to
-- 3.2 s. When it stopped at 3 s the error rolled back the new row with it, so the job never picked the read up and the
-- page showed the error until a quiet moment.
--
--   1. sh_admin_cached: a read with no row inserts one with no body (what the job works out first, within a minute or two)
--      and returns null; a row whose body hasn't come yet returns null too. Nothing is worked out inline any more.
--   2. The admin functions turn that null into a marker: get_insights, get_insight_retries and get_data_quality return
--      {"pending": true} (get_data_quality's retention part is still read fresh), get_question_health returns
--      {"pending": true} in place of its list, and the ones that return rows (visitors, check-ins, clicks, features) return
--      none.
--   3. get_admin_cache_status says "pending" for a read with no body yet. The admin page shows "Being worked out" for it
--      and, as with "newer numbers on the way", looks again every 30 s and draws the view when it has come.
--
-- Functions only: nothing locked, no backfill, safe at any hour.

-- ---------------------------------------------------------------- 1. the read path: the kept copy, or a row for the job
create or replace function public.sh_admin_cached(p_key text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql set search_path = public as $$
declare c record; a jsonb := coalesce(p_args, '{}'::jsonb);
begin
  select x.body, x.args, x.wanted_at into c from admin_cache x where x.key = p_key;
  if found then
    if c.args is distinct from a or c.wanted_at < now() - interval '1 minute' then
      update admin_cache set args = a, wanted_at = now() where key = p_key;
    end if;
    return c.body;   -- null until the job has worked it out
  end if;
  -- the first read (v90): no body, so the job works it out first, at its next tick; never inline under a visitor's 3 s
  insert into admin_cache (key, args, wanted_at) values (p_key, a, now()) on conflict (key) do nothing;
  return null;
end;
$$;

-- ---------------------------------------------------------------- 2. the admin functions: null is "being worked out"
create or replace function public.get_insights(p_secret text, p_exams jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return coalesce(sh_admin_cached('insights', jsonb_build_object('exams', coalesce(p_exams, '{}'::jsonb))),
                  '{"pending": true}'::jsonb);
end;
$$;
create or replace function public.get_insight_retries(p_secret text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return coalesce(sh_admin_cached('retries'), '{"pending": true}'::jsonb);
end;
$$;
create or replace function public.get_data_quality(p_secret text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return coalesce(sh_admin_cached('quality'), '{"pending": true}'::jsonb) || jsonb_build_object('retention', sh_retention_status());
end;
$$;
create or replace function public.get_question_health(p_secret text, p_hub text, p_days integer default 120, p_current jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' then return '[]'::jsonb; end if;
  b := sh_admin_cached('qh:' || p_hub,
    jsonb_build_object('days', greatest(1, least(coalesce(p_days, 120), 730)), 'current', p_current));
  if b is null then return '{"pending": true}'::jsonb; end if;
  return sh_qh_overlay(p_hub, b);
end;
$$;
-- get_visitor_summary / _by_hub / _by_section, get_exam_debriefs, get_click_summary and get_feature_events are unchanged:
-- jsonb_to_recordset(null) returns no rows, and the page reads "pending" from get_admin_cache_status.

-- ---------------------------------------------------------------- 3. the status: "pending" for a read not worked out yet
create or replace function public.get_admin_cache_status(p_secret text, p_ask text[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_ask is not null then
    update admin_cache set asked_at = now(), wanted_at = now()
    where key = any(p_ask[1:20]) and computed_at < now() - interval '2 minutes'
      and (asked_at is null or asked_at <= computed_at);
  end if;
  return coalesce((select jsonb_object_agg(c.key, jsonb_build_object(
      'at', c.computed_at, 'ms', c.took_ms, 'failed_at', c.failed_at, 'pending', c.body is null,
      'waiting', c.body_args is distinct from md5(c.args::text) or coalesce(c.asked_at > c.computed_at, false)))
    from admin_cache c), '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------- grants (as v83's; create or replace keeps them, restated)
revoke all on function public.sh_admin_cached(text, jsonb) from public, anon, authenticated;
revoke all on function public.get_admin_cache_status(text, text[]) from public;
grant execute on function public.get_admin_cache_status(text, text[]) to anon, authenticated;
