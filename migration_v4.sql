-- ============================================================
-- migration_v4.sql — dentistry-themed anonymous leaderboard names
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================

-- deterministic per-visitor "Adjective Noun" name, dentistry-flavored.
-- same visitor_id always maps to the same pair (hashtext is stable for a
-- given input), so a person doesn't appear to "change" between refreshes.
-- custom names (set via set_display_name / visitor_names) still win —
-- this is only ever the fallback when no display_name is on file.
create or replace function anon_name(p_visitor_id text)
returns text
language sql
stable
as $$
  select
    (array[
      'Gleaming','Sterile','Steady','Sharp','Polished','Bright','Bold','Calm',
      'Diligent','Keen','Vigilant','Minty','Pearly','Radiant','Precise','Speedy',
      'Tidy','Shiny','Meticulous','Golden'
    ])[1 + (abs(hashtext(p_visitor_id || ':adj')) % 20)]
    || ' ' ||
    (array[
      'Molar','Scaler','Bur','Enamel','Bicuspid','Incisor','Canine','Floss',
      'Curette','Crown','Veneer','Probe','Suction','Retainer','Bracket','Filling',
      'Drill','Bridge','Cusp','Bib'
    ])[1 + (abs(hashtext(p_visitor_id || ':noun')) % 20)];
$$;

-- swap the 'Anonymous' fallback for the generated name
create or replace function get_leaderboard(p_limit int default 10)
returns table(display_name text, streak int, total_answered int)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with days as (
    select visitor_id, (answered_at at time zone 'America/Chicago')::date as d
    from personal_answers
    group by visitor_id, (answered_at at time zone 'America/Chicago')::date
  ),
  islands as (
    select visitor_id, d,
      d - (row_number() over (partition by visitor_id order by d))::int as grp
    from days
  ),
  streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day
    from islands
    group by visitor_id, grp
  ),
  current_streaks as (
    select visitor_id, max(len) as streak
    from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1
    group by visitor_id
  ),
  totals as (
    select visitor_id, count(*)::int as total_answered
    from personal_answers
    group by visitor_id
  )
  select
    coalesce(vn.display_name, anon_name(cs.visitor_id)) as display_name,
    cs.streak,
    coalesce(t.total_answered, 0) as total_answered
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, total_answered desc
  limit p_limit;
end;
$$;
