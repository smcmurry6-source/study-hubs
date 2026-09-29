-- migration_v23 (2026-09-29): data for improving the next hub after one is archived.
--
-- 1. Exam check-ins. The day after each exam in the dashboard's HUBS list (for 6 days), anyone with progress
--    in that hub is asked once, on the dashboard: how ready they felt, how it went, how the hub's questions
--    compared to the exam, and what the exam had that the hub missed. One row per visitor per exam; "No thanks"
--    is stored as null answers so it is never asked again. visitor_id joins to activity_pings/personal_answers,
--    so readiness and outcome can be compared with how the hub was used.
-- 2. Search terms. The hub widget's Search panel sends what someone searched for (lowercased, 2-60 characters,
--    once they stop typing) and how many results it found. Counted per day, hub and term, like ui_clicks. A term
--    with 0 results is content the hub didn't have.
--
-- Writing is public (validated, errors swallowed); reading is admin only (sh_admin_ok) or via the connector.

-- ---------- exam check-ins ----------
create table if not exists public.exam_debriefs (
  id bigint generated always as identity primary key,
  hub text not null,
  exam text not null,                 -- 'YYYY-MM-DD <label>', e.g. '2026-10-01 Midterm'
  visitor_id text not null,
  answers jsonb,                      -- {ready: 1-5, went: text, match: text, missed: text}; null = no thanks
  created_at timestamptz not null default now(),
  unique (hub, exam, visitor_id)
);
alter table public.exam_debriefs enable row level security;

create or replace function public.submit_exam_debrief(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or length(p_hub) not between 1 and 40 then return false; end if;
  if p_exam is null or p_exam !~ '^\d{4}-\d{2}-\d{2}' or length(p_exam) > 60 then return false; end if;
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 3000) then return false; end if;
  -- only for an exam that has happened, and not forever after
  if left(p_exam, 10)::date >= (now() at time zone 'America/Chicago')::date
     or left(p_exam, 10)::date < (now() at time zone 'America/Chicago')::date - 21 then return false; end if;
  insert into exam_debriefs (hub, exam, visitor_id, answers) values (p_hub, p_exam, p_visitor, p_answers)
    on conflict (hub, exam, visitor_id) do nothing;
  return found;
exception when others then return false;
end;
$$;

create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    (select count(*) * 25 / 60 from activity_pings p where p.hub = d.hub and p.visitor_id = d.visitor_id)::bigint,
    (select count(*) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id)::bigint,
    (select round(avg(case when a.correct then 100 else 0 end), 0) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id)
  from exam_debriefs d order by d.created_at desc limit 2000;
end;
$$;

-- ---------- search terms ----------
create table if not exists public.search_terms (
  day date not null default (now() at time zone 'America/Chicago')::date,
  hub text not null,
  term text not null,
  searches integer not null default 0,
  hits integer not null default 0,    -- results found the last time this term was searched
  primary key (day, hub, term)
);
alter table public.search_terms enable row level security;

create or replace function public.record_search(p_hub text, p_term text, p_hits integer)
returns void language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if p_hub is null or length(p_hub) > 40 then return; end if;
  t := lower(regexp_replace(trim(coalesce(p_term, '')), '\s+', ' ', 'g'));
  if length(t) not between 2 and 60 then return; end if;
  insert into search_terms (hub, term, searches, hits) values (p_hub, t, 1, greatest(0, least(coalesce(p_hits, 0), 100000)))
    on conflict (day, hub, term) do update set searches = least(search_terms.searches + 1, 1000000), hits = excluded.hits;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;

create or replace function public.get_search_terms(p_secret text, p_days integer default 30)
returns table(hub text, term text, searches bigint, hits integer, last_day date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select s.hub, s.term, sum(s.searches)::bigint, (array_agg(s.hits order by s.day desc))[1], max(s.day)
  from search_terms s
  where s.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 365))
  group by s.hub, s.term order by 3 desc limit 1000;
end;
$$;

