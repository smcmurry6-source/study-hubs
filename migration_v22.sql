-- migration_v22 (2026-09-28): published hub recaps for the dashboard slideshow.
-- The admin page's Recap tab publishes a snapshot (the numbers as they were when published, the featured question,
-- title, colour, whether names show). The dashboard reads get_published_recaps() and draws each one with
-- widget/recap.js. Publishing and removing are admin only (sh_admin_ok); reading is public.

create table if not exists public.hub_recaps (
  hub text primary key,
  title text not null,
  color text,
  data jsonb not null,
  question jsonb,
  names boolean not null default true,
  footnote text,
  published_at timestamptz not null default now()
);
alter table public.hub_recaps enable row level security;

create or replace function public.admin_publish_recap(p_secret text, p_hub text, p_title text, p_color text, p_data jsonb,
  p_question jsonb, p_names boolean, p_footnote text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;
  if p_hub is null or length(p_hub) > 40 or p_data is null or length(p_data::text) > 200000 then raise exception 'bad recap'; end if;
  insert into hub_recaps (hub, title, color, data, question, names, footnote, published_at)
  values (p_hub, left(coalesce(nullif(trim(p_title), ''), p_hub), 60), left(p_color, 16), p_data, p_question, coalesce(p_names, true), left(p_footnote, 300), now())
  on conflict (hub) do update set title = excluded.title, color = excluded.color, data = excluded.data, question = excluded.question,
    names = excluded.names, footnote = excluded.footnote, published_at = now();
end;
$$;

create or replace function public.admin_unpublish_recap(p_secret text, p_hub text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;
  delete from hub_recaps where hub = p_hub;
end;
$$;

create or replace function public.get_published_recaps()
returns table(hub text, title text, color text, data jsonb, question jsonb, names boolean, footnote text, published_at timestamptz)
language sql stable security definer set search_path = public as $$
  select hub, title, color, data, question, names, footnote, published_at from hub_recaps
  order by coalesce((data->>'exam_day')::date, published_at::date) desc, published_at desc;
$$;
