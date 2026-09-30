-- migration_v27 (2026-09-30): exam-day luck on the dashboard.
-- The hubs' pop-up "luck wall" (widget/eggs.js) was removed: it got in the way of last-minute studying.
-- It now lives on the dashboard's next-exam card the day before and the morning of an exam: one "Send luck" per
-- person per exam, and everyone sees how many classmates sent it (and the latest few names).

create table if not exists public.exam_luck (
  hub text not null,
  exam_date date not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (hub, exam_date, visitor_id)
);
alter table public.exam_luck enable row level security;

create or replace function public.get_exam_luck(p_hub text, p_date date, p_visitor text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'count', (select count(*)::int from exam_luck where hub = p_hub and exam_date = p_date),
    'mine', exists (select 1 from exam_luck where hub = p_hub and exam_date = p_date and p_visitor is not null and visitor_id = p_visitor),
    'recent', coalesce((select jsonb_agg(n) from (
        select coalesce(vn.display_name, anon_name(l.visitor_id)) as n
          from exam_luck l left join visitor_names vn on vn.visitor_id = l.visitor_id
         where l.hub = p_hub and l.exam_date = p_date
         order by l.created_at desc limit 5) r), '[]'::jsonb)
  );
$$;

create or replace function public.send_exam_luck(p_visitor text, p_hub text, p_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'America/Chicago')::date;
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80
     or p_hub is null or length(p_hub) > 40 or p_date is null then
    return get_exam_luck(p_hub, p_date, p_visitor);
  end if;
  -- only around a real exam day (the dashboard offers it the day before and the morning of)
  if p_date between today and today + 2 then
    insert into exam_luck (hub, exam_date, visitor_id) values (p_hub, p_date, p_visitor) on conflict do nothing;
  end if;
  return get_exam_luck(p_hub, p_date, p_visitor);
end;
$$;

grant execute on function public.get_exam_luck(text, date, text) to anon, authenticated;
grant execute on function public.send_exam_luck(text, text, date) to anon, authenticated;
