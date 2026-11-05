-- migration_v50: admin live presence, hub archive overrides with an audit trail, newest-first check-ins and surveys.
-- Admin page (review/): a Live tab, a Hubs tab, and the Surveys tab's check-ins in order. Sam's calls (2026-11-04,
-- vault/decisions.md): live names are the leaderboard name; a manual archive state lasts until it is cleared, or until
-- an optional end time. How it all works: vault/reference/admin-operations.md.
--
-- Applied to the live project on 2026-11-05 (connector apply_migration), after Sam approved the release in writing
-- ("Merge when ready"; tier 3, RELEASE_TEST_PLAN.md). Tested first on a throwaway database built from
-- supabase/schema.sql (tools/release/rls.js and tools/release/admin-ops.js), never against the class's data; the live
-- permission audit (tools/release/rls-audit.sql) returned no findings after it.
-- Numbered v49 while it was being written; main's migration_v49.sql (analytics insights, #237) took that number.
--
-- 1. Live presence. "Live" = at least one study ping in the last 3 minutes (p_minutes, 1-15). widget/v3.js sends a ping
--    for every 25 s a hub tab is visible and in use (record_activity_ping); it stops when the tab is hidden and after 15
--    minutes with no input, so an open but forgotten tab drops off within 3 minutes. Three minutes leaves room for
--    someone moving between sections (each section banks its own 25 s) and a ping lost on a bad connection. The dashboard
--    sends no pings, so this counts people in a hub. It reads only activity_pings_time_idx (pinged_at, include hub,
--    visitor_id), a few minutes of rows. Devices linked to one person count once (visitor_links). Each person is shown by
--    their leaderboard name (their own name if they chose one, otherwise their random class name: get_display_name).
--    Never a visitor id, an email, a section or a timestamp per person.
--
-- 2. Archive overrides. The dashboard archives a hub by its dates in index.html (HUBS: ARCHIVE_HOUR on its last exam
--    day, archiveOn, hideCardOn). An override sets a hub's public state by hand: live (card open, even after its exam),
--    archived (greyed card, no Open button) or hidden (no card). Precedence (widget/archive.js does the same in the
--    browser): an override that is in force wins; it is in force until Sam sets the hub back to automatic, or until its
--    end time (until) if it has one; then the dates decide again. It never deletes or moves anything: the hub's page,
--    its direct link, questions, analytics and everyone's progress stay as they are, and check-ins still follow the
--    exam dates. Every change is written to hub_archive_log in the same transaction (old and new state, end time, note,
--    when). One passphrase is shared, so the log can't say who; the note can.
--
-- 3. Order. get_exam_debriefs (from migration_v47's activity_hourly version, applied 2026-10-30) and
--    get_survey_results return newest first by created_at with id as the tie-breaker, so equal times can't swap
--    between loads. The admin page also sorts the check-in groups by their newest check-in, not by hub name.

-- ---------------------------------------------------------------- archive overrides
create table if not exists public.hub_archive_overrides (
  hub text primary key check (hub ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  state text not null check (state in ('live', 'archived', 'hidden')),
  until timestamptz,                                  -- null: until Sam sets the hub back to automatic
  note text check (note is null or length(note) <= 300),
  set_at timestamptz not null default now()
);
create table if not exists public.hub_archive_log (
  id bigint generated always as identity primary key,
  hub text not null,
  old_state text not null check (old_state in ('auto', 'live', 'archived', 'hidden')),
  old_until timestamptz,
  new_state text not null check (new_state in ('auto', 'live', 'archived', 'hidden')),
  new_until timestamptz,
  note text,
  at timestamptz not null default now()
);
create index if not exists hub_archive_log_at_idx on public.hub_archive_log (at desc, id desc);
alter table public.hub_archive_overrides enable row level security;   -- no policies: only the functions below touch them
alter table public.hub_archive_log enable row level security;
revoke all on public.hub_archive_overrides, public.hub_archive_log from anon, authenticated;

-- the version token the admin page sends back, so a change made in another tab isn't overwritten blind
create or replace function public.sh_archive_version(p_set_at timestamptz)
returns text language sql stable set search_path = public as $$
  select case when p_set_at is null then 'auto' else (floor(extract(epoch from p_set_at) * 1000000))::bigint::text end;
$$;

-- public: the overrides in force now (the dashboard and widget/v3.js read this; no notes)
create or replace function public.get_hub_overrides()
returns table(hub text, state text, until timestamptz)
language sql stable security definer set search_path = public as $$
  select o.hub, o.state, o.until from hub_archive_overrides o
  where o.until is null or o.until > now()
  order by o.hub;
$$;

-- admin: every override row, with its note, whether it is still in force, and its version token
create or replace function public.admin_hub_overrides(p_secret text)
returns table(hub text, state text, until timestamptz, note text, set_at timestamptz, active boolean, version text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select o.hub, o.state, o.until, o.note, o.set_at, (o.until is null or o.until > now()),
           case when o.until is null or o.until > now() then sh_archive_version(o.set_at) else 'auto' end
    from hub_archive_overrides o order by o.hub;
end;
$$;

-- admin: set a hub to 'auto' (no override: the dates decide), 'live', 'archived' or 'hidden'.
-- p_until: optional end time (future, within 400 days); p_note: optional, 300 characters; p_expect: the version token
-- the page showed ('auto' when no override was in force), or null to skip the check. A different token raises 40001.
create or replace function public.admin_set_hub_archive(p_secret text, p_hub text, p_state text,
  p_until timestamptz default null, p_note text default null, p_expect text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cur hub_archive_overrides%rowtype;
  in_force boolean;
  v_old_state text; v_old_until timestamptz; v_version text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_until timestamptz := case when p_state = 'auto' then null else p_until end;
  r hub_archive_overrides%rowtype;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then raise exception 'bad hub id' using errcode = '22023'; end if;
  if p_state is null or p_state not in ('auto', 'live', 'archived', 'hidden') then raise exception 'bad state' using errcode = '22023'; end if;
  if v_until is not null and (v_until <= now() or v_until > now() + interval '400 days') then
    raise exception 'end time must be in the future, within 400 days' using errcode = '22023'; end if;
  if v_note is not null and length(v_note) > 300 then raise exception 'note is over 300 characters' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtext('hub_archive:' || p_hub));
  select * into cur from hub_archive_overrides o where o.hub = p_hub;
  in_force := found and (cur.until is null or cur.until > now());
  v_old_state := case when in_force then cur.state else 'auto' end;
  v_old_until := case when in_force then cur.until end;
  v_version := case when in_force then sh_archive_version(cur.set_at) else 'auto' end;
  if p_expect is not null and p_expect <> v_version then
    raise exception 'conflict: this hub was changed since the page loaded' using errcode = '40001'; end if;

  if p_state = v_old_state and v_until is not distinct from v_old_until then
    return jsonb_build_object('hub', p_hub, 'state', v_old_state, 'until', v_old_until, 'changed', false, 'version', v_version);
  end if;

  if p_state = 'auto' then
    delete from hub_archive_overrides o where o.hub = p_hub;
  else
    insert into hub_archive_overrides as o (hub, state, until, note, set_at)
    values (p_hub, p_state, v_until, v_note, clock_timestamp())
    on conflict (hub) do update set state = excluded.state, until = excluded.until, note = excluded.note, set_at = excluded.set_at
    returning * into r;
  end if;
  insert into hub_archive_log (hub, old_state, old_until, new_state, new_until, note)
  values (p_hub, v_old_state, v_old_until, p_state, v_until, v_note);
  return jsonb_build_object('hub', p_hub, 'state', p_state, 'until', v_until, 'changed', true,
    'version', case when p_state = 'auto' then 'auto' else sh_archive_version(r.set_at) end);
end;
$$;

-- admin: the audit trail, newest first
create or replace function public.admin_hub_archive_log(p_secret text, p_limit integer default 50)
returns table(id bigint, hub text, old_state text, old_until timestamptz, new_state text, new_until timestamptz, note text, at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select l.id, l.hub, l.old_state, l.old_until, l.new_state, l.new_until, l.note, l.at
    from hub_archive_log l order by l.at desc, l.id desc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

-- ---------------------------------------------------------------- live presence
-- { minutes, as_of, total, hubs: [{ hub, people, names: [..] }] }: busiest hub first, names A-Z. total counts a person
-- once even with two hubs open.
create or replace function public.admin_live_presence(p_secret text, p_minutes integer default 3)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_min integer := greatest(1, least(coalesce(p_minutes, 3), 15));
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return (
    with recent as (
      select distinct p.hub, coalesce(l.primary_id, p.visitor_id) as who
      from activity_pings p
      left join visitor_links l on l.alias_id = p.visitor_id
      where p.pinged_at > now() - make_interval(mins => v_min) and coalesce(p.hub, '') <> ''
    ),
    people as (
      select w.who, coalesce(vn.display_name, anon_name(w.who)) as name
      from (select distinct r.who from recent r) w
      left join visitor_names vn on vn.visitor_id = w.who
    ),
    per_hub as (
      select r.hub, count(*)::int as n, jsonb_agg(pp.name order by lower(pp.name), pp.name) as names
      from recent r join people pp on pp.who = r.who
      group by r.hub
    )
    select jsonb_build_object(
      'minutes', v_min,
      'as_of', now(),
      'total', (select count(*) from people)::int,
      'hubs', coalesce((select jsonb_agg(jsonb_build_object('hub', h.hub, 'people', h.n, 'names', h.names) order by h.n desc, h.hub) from per_hub h), '[]'::jsonb))
  );
end;
$$;

-- ---------------------------------------------------------------- newest first, with a tie-breaker
create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with d as (select * from exam_debriefs e order by e.created_at desc, e.id desc limit 2000),
  who as (select distinct d.hub, d.visitor_id from d),
  t as (select w.hub, w.visitor_id, coalesce(sum(h.n), 0) * 25 / 60 as minutes
        from who w left join activity_hourly h on h.visitor_id = w.visitor_id and h.hub = w.hub
        group by w.hub, w.visitor_id),
  a as (select w.hub, w.visitor_id, count(pa.id) as answered,
               round(avg(case when pa.id is null then null when pa.correct then 100 else 0 end), 0) as accuracy
        from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
        group by w.hub, w.visitor_id)
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    t.minutes::bigint, a.answered::bigint, a.accuracy
  from d
  join t on t.hub = d.hub and t.visitor_id = d.visitor_id
  join a on a.hub = d.hub and a.visitor_id = d.visitor_id
  order by d.created_at desc, d.id desc;
end;
$$;

create or replace function public.get_survey_results(p_secret text)
returns table(survey_id bigint, slug text, title text, questions jsonb, active boolean, created_at timestamptz,
              responses bigint, skipped bigint, answers jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select s.id, s.slug, s.title, s.questions, s.active, s.created_at,
    count(r.id) filter (where r.answers is not null), count(r.id) filter (where r.answers is null),
    coalesce(jsonb_agg(r.answers order by r.created_at desc, r.id desc) filter (where r.answers is not null), '[]'::jsonb)
  from surveys s left join survey_responses r on r.survey_id = s.id
  group by s.id order by s.created_at desc, s.id desc;
end;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.sh_archive_version(timestamptz) from public, anon, authenticated;
revoke all on function public.get_hub_overrides() from public;
revoke all on function public.admin_hub_overrides(text) from public;
revoke all on function public.admin_set_hub_archive(text, text, text, timestamptz, text, text) from public;
revoke all on function public.admin_hub_archive_log(text, integer) from public;
revoke all on function public.admin_live_presence(text, integer) from public;
grant execute on function public.get_hub_overrides() to anon, authenticated;
grant execute on function public.admin_hub_overrides(text) to anon, authenticated;
grant execute on function public.admin_set_hub_archive(text, text, text, timestamptz, text, text) to anon, authenticated;
grant execute on function public.admin_hub_archive_log(text, integer) to anon, authenticated;
grant execute on function public.admin_live_presence(text, integer) to anon, authenticated;
