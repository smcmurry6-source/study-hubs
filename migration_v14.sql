-- migration_v14 (2026-09-25): click analytics + dashboard surveys
--
-- Clicks: the widget (hubs) and the dashboard batch up clicks on buttons, tabs and links and send
--   them once a minute as {s: section, t: target, n: count}. Stored as daily counts, plus a
--   visitor-per-target table so the admin page can show "how many people" and not just "how many clicks".
-- Surveys: at most one active survey is offered on the dashboard; each visitor answers (or skips)
--   once. Surveys are created/activated by Sam (or a Claude session) with admin_upsert_survey.
--
-- The admin secret is not in this file: sh_admin_ok() copies the check from an existing admin
-- function (get_nuke_summary) when the migration runs.

-- ---------- private admin check ----------
do $mig$
declare s text;
begin
  s := (regexp_match(pg_get_functiondef('public.get_nuke_summary'::regproc), 'p_secret is distinct from ''([^'']+)'''))[1];
  if s is null then raise exception 'could not find the admin check in get_nuke_summary'; end if;
  execute format($f$
    create or replace function public.sh_admin_ok(p_secret text) returns boolean
    language sql immutable security definer set search_path = public as $b$ select p_secret is not distinct from %L $b$;
  $f$, s);
end;
$mig$;
revoke all on function public.sh_admin_ok(text) from public, anon, authenticated;

-- ---------- clicks ----------
create table if not exists public.ui_clicks (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  section text not null default '',
  target text not null,
  clicks integer not null default 0,
  primary key (day, hub, section, target)
);
create table if not exists public.ui_click_reach (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  target text not null,
  visitor_id text not null,
  primary key (day, hub, target, visitor_id)
);
alter table public.ui_clicks enable row level security;
alter table public.ui_click_reach enable row level security;

create or replace function public.record_clicks(p_hub text, p_visitor text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; s text; t text; n int; k int := 0;
begin
  if p_hub is null or length(p_hub) > 40 or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    k := k + 1; exit when k > 80;
    s := left(coalesce(it->>'s', ''), 80);
    t := left(coalesce(it->>'t', ''), 80);
    n := least(greatest(coalesce((it->>'n')::int, 1), 1), 50);
    continue when t = '';
    insert into ui_clicks (hub, section, target, clicks) values (p_hub, s, t, n)
      on conflict (day, hub, section, target) do update set clicks = ui_clicks.clicks + excluded.clicks;
    if p_visitor is not null and length(p_visitor) between 1 and 80 then
      insert into ui_click_reach (hub, target, visitor_id) values (p_hub, t, p_visitor) on conflict do nothing;
    end if;
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;

create or replace function public.get_click_summary(p_secret text, p_days integer default 14, p_hub text default null)
returns table(hub text, section text, target text, clicks bigint, people bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with c as (
    select c.hub, c.section, c.target, sum(c.clicks)::bigint as clicks from ui_clicks c
    where c.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 14), 365))
      and (p_hub is null or c.hub = p_hub)
    group by 1, 2, 3
  ), r as (
    select r.hub, r.target, count(distinct r.visitor_id)::bigint as people from ui_click_reach r
    where r.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 14), 365))
      and (p_hub is null or r.hub = p_hub)
    group by 1, 2
  )
  select c.hub, c.section, c.target, c.clicks, coalesce(r.people, 0) from c left join r on r.hub = c.hub and r.target = c.target
  order by c.clicks desc limit 1000;
end;
$$;

-- ---------- surveys ----------
create table if not exists public.surveys (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  questions jsonb not null,           -- [{id, kind: 'choice'|'multi'|'scale'|'text', prompt, options?: [..]}], at most 3
  active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys(id) on delete cascade,
  visitor_id text not null,
  answers jsonb,                      -- null = skipped
  created_at timestamptz not null default now(),
  unique (survey_id, visitor_id)
);
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

create or replace function public.get_active_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.questions from surveys s
  where s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id and r.visitor_id = p_visitor)
  order by s.starts_at desc limit 1;
$$;

-- p_answers null = "no thanks" (recorded so it is never offered again to that visitor)
create or replace function public.submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 4000) then return false; end if;
  if not exists (select 1 from surveys where id = p_survey and active) then return false; end if;
  insert into survey_responses (survey_id, visitor_id, answers) values (p_survey, p_visitor, p_answers)
    on conflict (survey_id, visitor_id) do nothing;
  return found;
end;
$$;

create or replace function public.admin_upsert_survey(p_secret text, p_slug text, p_title text, p_questions jsonb,
  p_active boolean default false, p_ends_at timestamptz default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 1 and 3 then
    raise exception 'questions must be an array of 1-3 items'; end if;
  insert into surveys (slug, title, questions, active, ends_at) values (p_slug, p_title, p_questions, p_active, p_ends_at)
  on conflict (slug) do update set title = excluded.title, questions = excluded.questions, active = excluded.active, ends_at = excluded.ends_at
  returning id into v;
  if p_active then update surveys set active = false where id <> v; end if;  -- one live survey at a time
  return v;
end;
$$;

create or replace function public.admin_set_survey_active(p_secret text, p_survey bigint, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_active then update surveys set active = false where id <> p_survey; end if;
  update surveys set active = p_active where id = p_survey;
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
    coalesce(jsonb_agg(r.answers order by r.created_at desc) filter (where r.answers is not null), '[]'::jsonb)
  from surveys s left join survey_responses r on r.survey_id = s.id
  group by s.id order by s.created_at desc;
end;
$$;
