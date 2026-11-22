-- migration_v98: the weekly class challenge (idea board #6): answer 100 questions between Monday and Sunday and your Timmy
-- gets that week's pennant (the idea said 50; Sam, 2026-11-22: "lets do 100").
--
-- * The week is Monday to Sunday, Central time (the days xp_days already keeps). What counts is every answer saved, in any hub
--   and any part of it: practice, the drill, a mock, an arcade game, Learn (xp_days.n, which sh_xp_on_insert adds to on every
--   answer; a flashcard isn't an answer). Linked devices count as one person (their answers move to the primary id).
-- * Each person earns their own pennant; the "class" part is the same week for everyone, and a count of how many have theirs
--   (shown only once it is at least 5, as everything the class sees about itself).
-- * A pennant is one row in week_pennants per person per week, made once: by the page when the 100th answer is in
--   (claim_week_v2), or by the Monday sweep for anyone who got there without the page claiming it (sh_week_sweep). Its art is
--   drawn from the week's date (tools/figures/site/pennant.mjs), so nothing about it is stored but the week.
-- * It pays `week` (sh_prizes: 500 XP and as many crowns; Sam, 2026-11-22: the rest "looks good"), once, keyed 'week:<monday>'.
--
-- Apply: small and quick (a new table, a few functions, a constraint added not valid, a cron line); any quiet hour. Nothing
-- in the answer path changes: record_answer_v2, sh_answer and the bootstrap are untouched. Replaced: sh_prizes (adds `week`),
-- sh_is_prize (adds `week`) and the xp_awards src check (adds `week`), each copied from migration_v92, the newest.
set local lock_timeout = '3s';

-- ====================================================================== 1. the prize
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min',
  'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime', 'notes',
  'trophy', 'visit', 'game', 'record', 'restore', 'collection', 'fairy', 'goldfairy', 'probe', 'perfect', 'misses', 'idea', 'back',
  'week')) not valid;

create or replace function public.sh_is_prize(p_src text)
returns boolean language plpgsql immutable set search_path = public as $$
begin
  return p_src in ('survey', 'checkin', 'report', 'medal', 'pod-done', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime',
                   'notes', 'trophy', 'visit', 'game', 'record', 'collection', 'fairy', 'goldfairy', 'probe', 'perfect', 'misses', 'idea', 'back',
                   'week');
end;
$$;

-- what every prize pays, for the page (migration_v89's table, v92's seven and v98's week; widget/v3.js's PRIZES says the same)
create or replace function public.sh_prizes()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('name', 500, 'ring', 5, 'boss', 500, 'nuke', 10000, 'alltime', 20000, 'notes', 50, 'trophy', 200,
    'visit', 50, 'game', 100, 'pb', 50, 'top', 250, 'report', 100, 'collection', 1000, 'dark', 5000, 'modupro', 20000, 'loupes', 30000,
    'fairy', 250, 'goldfairy', 500, 'probe', 300, 'perfect', 750, 'misses', 100, 'idea', 500, 'back', 200, 'week', 500,
    'streak', jsonb_build_array(jsonb_build_array(3, 100), jsonb_build_array(7, 300), jsonb_build_array(14, 700),
      jsonb_build_array(30, 1500), jsonb_build_array(60, 3000), jsonb_build_array(100, 5000)),
    'row', jsonb_build_array(jsonb_build_array(10, 25), jsonb_build_array(25, 100), jsonb_build_array(50, 250)),
    'medal', jsonb_build_array(250, 500, 750, 1000));
$$;
revoke all on function public.sh_prizes() from public;
grant execute on function public.sh_prizes() to anon, authenticated;

-- ====================================================================== 2. the pennants
create table if not exists public.week_pennants (
  visitor_id text not null,
  week date not null check (extract(isodow from week) = 1),          -- the week's Monday (Central)
  n int not null,                                                    -- answers that week when it was made
  at timestamptz not null default now(),
  how text not null default 'claim' check (how in ('claim', 'sweep')),
  primary key (visitor_id, week)
);
create index if not exists week_pennants_week on public.week_pennants (week);
alter table public.week_pennants enable row level security;
revoke all on public.week_pennants from anon, authenticated;

-- PL/pgSQL throughout, like every function a page calls and what it calls (shared-infrastructure, migration_v76): a SQL
-- function with its own search_path can't be inlined, so it would be planned again on every call
create or replace function public.sh_week_goal()
returns integer language plpgsql immutable set search_path = public as $$ begin return 100; end; $$;

-- the Monday (Central) of the week a moment falls in
create or replace function public.sh_week_of(p_at timestamptz)
returns date language plpgsql immutable set search_path = public as $$
begin
  return date_trunc('week', p_at at time zone 'America/Chicago')::date;
end;
$$;

-- a person's main id: a linked device's answers and pennants count for the id it was linked to (as sh_form_reward pays)
create or replace function public.sh_week_me(p_visitor text)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
end;
$$;

-- a person's answers in a week, given their main id: its xp_days rows (at most seven, by the primary key) and any still
-- under a device linked to it (Link my devices moves a device's answers to the main id, so normally none: a tab left open
-- through the link can still save under the old one)
create or replace function public.sh_week_n(p_visitor text, p_week date)
returns integer language plpgsql stable security definer set search_path = public as $$
declare k int;
begin
  select coalesce(sum(z.n), 0)::int into k from (
    select x.n from xp_days x where x.visitor_id = p_visitor and x.d between p_week and p_week + 6
    union all
    select x.n from visitor_links l join xp_days x on x.visitor_id = l.alias_id and x.d between p_week and p_week + 6
    where l.primary_id = p_visitor and l.alias_id <> p_visitor
  ) z;
  return k;
end;
$$;

-- how many have the week's pennant, or null under 5 (a total over at least 5 people, like everything the class sees)
create or replace function public.sh_week_class(p_week date)
returns integer language plpgsql stable security definer set search_path = public as $$
declare k int;
begin
  select count(*)::int into k from week_pennants w where w.week = p_week;
  return case when k >= 5 then k end;
end;
$$;

-- make a person's pennant for a week and pay its prize, once; returns what it paid (0 when it was already theirs)
create or replace function public.sh_week_award(p_visitor text, p_week date, p_n integer, p_at timestamptz, p_how text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  insert into week_pennants (visitor_id, week, n, at, how) values (p_visitor, p_week, p_n, p_at, p_how)
    on conflict (visitor_id, week) do nothing;
  if not found then return 0; end if;
  return sh_award(p_visitor, 'week:' || p_week, 'week', '', (sh_prizes()->>'week')::int, 1, p_at);
end;
$$;

-- what the page shows: this week, how far along, the class count and every pennant earned (newest first)
create or replace function public.sh_my_week(p_at timestamptz, p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); wk date := sh_week_of(v_at); k int := 0; mine jsonb := '[]'::jsonb; me text;
begin
  if p_visitor is not null and length(p_visitor) between 1 and 80 then
    me := sh_week_me(p_visitor);
    k := sh_week_n(me, wk);
    select coalesce(jsonb_agg(z.week order by z.week desc), '[]'::jsonb) into mine
      from (select w.week from week_pennants w where w.visitor_id = me order by w.week desc limit 260) z;
  end if;
  return jsonb_build_object('ok', true, 'week', wk, 'goal', sh_week_goal(), 'n', k,
    'done', mine @> jsonb_build_array(to_jsonb(wk)), 'class', sh_week_class(wk), 'pennants', mine,
    'pays', (sh_prizes()->>'week')::int);
end;
$$;
create or replace function public.get_my_week_v2(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  return sh_my_week(null, p_visitor);
end;
$$;

-- the page asks for this week's pennant once its count reaches 100; the server counts again, so the page's count is only a hint
create or replace function public.sh_claim_week(p_at timestamptz, p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); wk date := sh_week_of(v_at); k int; paid int; had int; me text;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  -- counted and paid under the main id, so two linked devices make one week, and its pennant is the person's
  me := sh_week_me(p_visitor);
  perform pg_advisory_xact_lock(hashtext('xp|' || me));
  k := sh_week_n(me, wk);
  if k < sh_week_goal() then
    return sh_prize_reply(me, 'week', 0, jsonb_build_object('why', 'short', 'n', k, 'goal', sh_week_goal(), 'week', wk));
  end if;
  paid := sh_week_award(me, wk, k, v_at, 'claim');
  select count(*)::int into had from week_pennants w where w.visitor_id = me;
  return sh_prize_reply(me, 'week', paid, jsonb_build_object('week', wk, 'n', k, 'goal', sh_week_goal(), 'pennant', true,
    'class', sh_week_class(wk), 'have', had));
end;
$$;
create or replace function public.claim_week_v2(p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  return sh_claim_week(null, p_visitor);
end;
$$;

-- Monday's sweep: whoever reached 100 last week without the page claiming it (the tab closed on the 100th answer, an answer
-- saved later from the device) gets the pennant, dated the week's last second. A linked device's answers count for its main
-- id, as the claim counts them. Returns how many it made. One query over last week's xp_days rows (a few hundred), once a week.
create or replace function public.sh_week_sweep(p_at timestamptz default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); wk date := sh_week_of(v_at) - 7; t_end timestamptz; r record; made int := 0;
begin
  t_end := ((wk + 7)::timestamp at time zone 'America/Chicago') - interval '1 second';
  for r in
    select g.who, g.k from (
      select coalesce(l.primary_id, x.visitor_id) as who, sum(x.n)::int as k
      from xp_days x left join visitor_links l on l.alias_id = x.visitor_id and l.alias_id <> l.primary_id
      where x.d between wk and wk + 6
      group by 1 having sum(x.n) >= sh_week_goal()
    ) g
    where not exists (select 1 from week_pennants w where w.visitor_id = g.who and w.week = wk)
  loop
    perform pg_advisory_xact_lock(hashtext('xp|' || r.who));
    if sh_week_award(r.who, wk, r.k, t_end, 'sweep') > 0 then made := made + 1; end if;
  end loop;
  return made;
end;
$$;

-- linking devices: the alias's pennants move to the primary id (a week both had stays once, and its prize was paid once each,
-- as every prize of two devices before they were linked)
create or replace function public.sh_pennants_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    insert into week_pennants (visitor_id, week, n, at, how)
      select new.primary_id, w.week, w.n, w.at, w.how from week_pennants w where w.visitor_id = new.alias_id
      on conflict (visitor_id, week) do nothing;
    delete from week_pennants where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
drop trigger if exists visitor_links_pennants on public.visitor_links;
create trigger visitor_links_pennants after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_pennants_on_link();

-- ====================================================================== 3. Monday's sweep, at 1:17 am Central (7:17 UTC; 2:17 in summer)
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    begin perform cron.unschedule('sh-week-pennants'); exception when others then null; end;
    perform cron.schedule('sh-week-pennants', '17 7 * * 1', 'select public.sh_week_sweep()');
  end if;
exception when others then
  raise notice 'pg_cron not scheduled: %', sqlerrm;
end
$do$;

-- ====================================================================== grants
revoke all on function public.sh_week_goal() from public, anon, authenticated;
revoke all on function public.sh_week_of(timestamptz) from public, anon, authenticated;
revoke all on function public.sh_week_n(text, date) from public, anon, authenticated;
revoke all on function public.sh_week_me(text) from public, anon, authenticated;
revoke all on function public.sh_week_class(date) from public, anon, authenticated;
revoke all on function public.sh_week_award(text, date, integer, timestamptz, text) from public, anon, authenticated;
revoke all on function public.sh_my_week(timestamptz, text) from public, anon, authenticated;
revoke all on function public.sh_claim_week(timestamptz, text) from public, anon, authenticated;
revoke all on function public.sh_week_sweep(timestamptz) from public, anon, authenticated;
revoke all on function public.sh_pennants_on_link() from public, anon, authenticated;
revoke all on function public.get_my_week_v2(text) from public;
grant execute on function public.get_my_week_v2(text) to anon, authenticated;
revoke all on function public.claim_week_v2(text) from public;
grant execute on function public.claim_week_v2(text) to anon, authenticated;
