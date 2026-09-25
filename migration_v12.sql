-- migration_v12 (2026-09-25)
-- 1. Generated leaderboard names: 20 x 20 words means classmates collide (16 names were shared by
--    131 visitors). The visitor who has had a name longest keeps it plain; later holders of the
--    same name get a two-digit suffix. "Longest" = earliest first answer (first_seen), which never changes. anon_name_base() is the old word-pair logic.
-- 2. anon_name / anon_name_base get a fixed search_path (advisor: function_search_path_mutable).
-- 3. get_personal_stats groups answers by Central-time day like every other stat
--    (it used UTC, so evening study landed on the next day).
-- 4. Choice tracking: question_choices counts how often each option (by its authored index,
--    0 = the key) is picked, so the admin page can show each question's most popular wrong answer.
-- 5. Drop the unused nuke_launches_hub_idx.

create or replace function public.anon_name_base(p_visitor_id text)
returns text language sql immutable set search_path = public as $$
  select
    (array['Gleaming','Sterile','Steady','Sharp','Polished','Bright','Bold','Calm',
      'Diligent','Keen','Vigilant','Minty','Pearly','Radiant','Precise','Speedy',
      'Tidy','Shiny','Meticulous','Golden'])[1 + (abs(hashtext(p_visitor_id || ':adj')) % 20)]
    || ' ' ||
    (array['Molar','Scaler','Bur','Enamel','Bicuspid','Incisor','Canine','Floss',
      'Curette','Crown','Veneer','Probe','Suction','Retainer','Bracket','Filling',
      'Drill','Bridge','Cusp','Bib'])[1 + (abs(hashtext(p_visitor_id || ':noun')) % 20)];
$$;

create or replace function public.first_seen(p_visitor_id text)
returns timestamptz language sql stable set search_path = public as $$
  select min(answered_at) from personal_answers where visitor_id = p_visitor_id;
$$;

create or replace function public.anon_name(p_visitor_id text)
returns text language sql stable set search_path = public as $$
  with me as (select anon_name_base(p_visitor_id) as base, first_seen(p_visitor_id) as since)
  select me.base || case when exists (
      select 1 from correct_streaks c
      where c.visitor_id <> p_visitor_id
        and anon_name_base(c.visitor_id) = me.base
        and first_seen(c.visitor_id) is not null
        and (me.since is null or first_seen(c.visitor_id) < me.since
             or (first_seen(c.visitor_id) = me.since and c.visitor_id < p_visitor_id))
    ) then ' ' || (10 + abs(hashtext(p_visitor_id || ':n')) % 90)::text else '' end
  from me;
$$;

create or replace function public.get_personal_stats(p_visitor text, p_hub text)
returns table(answer_date date, attempts integer, correct integer)
language sql security definer set search_path = public as $$
  select (answered_at at time zone 'America/Chicago')::date as answer_date,
         count(*)::int as attempts,
         sum(case when correct then 1 else 0 end)::int as correct
  from personal_answers
  where visitor_id = p_visitor and hub = p_hub
  group by (answered_at at time zone 'America/Chicago')::date
  order by answer_date;
$$;

create table if not exists public.question_choices (
  hub text not null,
  qid text not null,
  choice integer not null,
  picks integer not null default 0,
  constraint question_choices_pkey primary key (hub, qid, choice)
);
alter table public.question_choices enable row level security;
drop policy if exists "public read question_choices" on public.question_choices;
create policy "public read question_choices" on public.question_choices for select to public using (true);

create or replace function public.record_choice(p_hub text, p_qid text, p_choice integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or p_qid is null or p_choice is null or p_choice < 0 or p_choice > 9 then return; end if;
  insert into question_choices (hub, qid, choice, picks) values (p_hub, p_qid, p_choice, 1)
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

drop index if exists public.nuke_launches_hub_idx;
