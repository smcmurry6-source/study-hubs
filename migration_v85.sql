-- v85 (2026-11-19): Ask Timmy's first question after an idle hour gets a part of the hub's content (Sam, 2026-11-19: yes,
-- with the eval; vault/reference/ask-timmy.md, "Limits and money"). Writing a hub's whole content to the API's prompt cache
-- (130-165k tokens, cached for an hour that every read starts again) was most of what students' questions cost, mostly on
-- the first question after nobody had asked for an hour. The function now asks this table whether the whole content was
-- read in the last 55 minutes: if not, it sends the lecture the student is on with the exam facts, the cram sheet, the Exam
-- Hints and the High likelihood topics, and only asks again with the whole content when that part doesn't have the answer.
--
-- What it adds:
--   timmy_cache_marks: one row per cache entry ("<hub>:<hash of the model, the rules and the content>"), when the whole
--     content was last read or written. No visitor, no text. Rows for content that changed are left behind (a few a day,
--     a few dozen bytes each) and cleared after a week by the function itself.
--   timmy_cache(p_key, p_mark): with p_mark false, the time the entry was last marked (null for never); with p_mark true,
--     marks it now and returns null. The service role only (the function); no browser can call it.
-- Small and additive: a new table and a new function, no backfill, nothing else changed. Until it's applied the function
-- gets an error from the call and sends the whole content, as before.

create table if not exists public.timmy_cache_marks (
  key text primary key check (length(key) between 1 and 120),
  at timestamptz not null default now()
);
alter table public.timmy_cache_marks enable row level security;
revoke all on table public.timmy_cache_marks from public, anon, authenticated;
grant all on table public.timmy_cache_marks to service_role;

create or replace function public.timmy_cache(p_key text, p_mark boolean default false)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare t timestamptz;
begin
  if p_key is null or length(p_key) not between 1 and 120 then raise exception 'bad key'; end if;
  if not coalesce(p_mark, false) then
    select at into t from timmy_cache_marks where key = p_key;
    return t;
  end if;
  insert into timmy_cache_marks (key, at) values (p_key, now()) on conflict (key) do update set at = excluded.at;
  delete from timmy_cache_marks where at < now() - interval '7 days';
  return null;
end;
$$;
revoke all on function public.timmy_cache(text, boolean) from public, anon, authenticated;
grant execute on function public.timmy_cache(text, boolean) to service_role;
