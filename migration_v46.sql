-- v46: pinned questions follow you across devices. The Question Bank's Pin button (widget/v3.js, window.shPins) kept pins
-- in localStorage only (sh_pins_<hub>). question_pins keeps one row per visitor, hub and question with the latest change:
-- pinned true or false (an unpin is kept, so it beats an older pin from another device) and t, the device's time of that
-- change in epoch ms. set_pins saves changes (only when newer than the stored one); get_my_pins reads them back on hub load,
-- and the widget merges by t. redeem_link_code (Link my devices) moves a device's pins onto the linked id, newer change winning.

create table if not exists public.question_pins (
  visitor_id text not null,
  hub text not null,
  qid text not null,
  pinned boolean not null,
  t bigint not null,
  primary key (visitor_id, hub, qid)
);
alter table public.question_pins enable row level security;  -- no policies: only the functions below touch it

-- p_pins: [[qid, 1|0, t], ...] (at most 500 per call); a visitor keeps at most 3000 rows per hub
create or replace function public.set_pins(p_visitor text, p_hub text, p_pins jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare n int := 0; x jsonb; tt bigint; now_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or jsonb_typeof(p_pins) <> 'array' or jsonb_array_length(p_pins) > 500 then return 0; end if;
  for x in select * from jsonb_array_elements(p_pins) loop
    if jsonb_typeof(x) <> 'array' or length(coalesce(x->>0, '')) not between 1 and 80 then continue; end if;
    tt := least(greatest(coalesce((x->>2)::numeric, 0), 0), now_ms + 86400000)::bigint;
    if not exists (select 1 from question_pins where visitor_id = p_visitor and hub = p_hub and qid = x->>0)
       and (select count(*) from question_pins where visitor_id = p_visitor and hub = p_hub) >= 3000 then continue; end if;
    insert into question_pins (visitor_id, hub, qid, pinned, t) values (p_visitor, p_hub, x->>0, (x->>1) = '1', tt)
      on conflict (visitor_id, hub, qid) do update set pinned = excluded.pinned, t = excluded.t where excluded.t >= question_pins.t;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- [[qid, 1|0, t], ...], newest change first
create or replace function public.get_my_pins(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(qid, case when pinned then 1 else 0 end, t) order by t desc), '[]'::jsonb)
  from question_pins
  where p_visitor is not null and length(p_visitor) between 1 and 80 and visitor_id = p_visitor and hub = p_hub;
$$;

revoke all on function public.set_pins(text, text, jsonb) from public;
revoke all on function public.get_my_pins(text, text) from public;
grant execute on function public.set_pins(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_my_pins(text, text) to anon, authenticated;

create or replace function public.redeem_link_code(p_code text, p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare p text; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  if (select count(*) from link_attempts where visitor_id = p_visitor and tried_at > now() - interval '1 hour') >= 10 then return null; end if;
  insert into link_attempts (visitor_id) values (p_visitor);
  select visitor_id into p from link_codes where code = c and created_at > now() - interval '10 minutes';
  if p is null then return null; end if;
  delete from link_codes where code = c;
  if p = p_visitor then return p; end if;
  -- follow an existing chain so everything ends on one id
  p := coalesce((select primary_id from visitor_links where alias_id = p), p);

  update personal_answers set visitor_id = p where visitor_id = p_visitor;
  update arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update egg_events set visitor_id = p where visitor_id = p_visitor;
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
  update nuke_launches set visitor_id = p where visitor_id = p_visitor;
  insert into achievements (visitor_id, kind, hub, created_at) select p, kind, hub, created_at from achievements where visitor_id = p_visitor on conflict do nothing;
  delete from achievements where visitor_id = p_visitor;
  insert into survey_responses (survey_id, visitor_id, answers, created_at) select survey_id, p, answers, created_at from survey_responses where visitor_id = p_visitor on conflict do nothing;
  delete from survey_responses where visitor_id = p_visitor;
  insert into ui_click_reach (day, hub, target, visitor_id) select day, hub, target, p from ui_click_reach where visitor_id = p_visitor on conflict do nothing;
  delete from ui_click_reach where visitor_id = p_visitor;
  insert into correct_streaks (visitor_id, current_streak, best_streak, updated_at)
    select p, current_streak, best_streak, updated_at from correct_streaks where visitor_id = p_visitor
    on conflict (visitor_id) do update set best_streak = greatest(correct_streaks.best_streak, excluded.best_streak),
      current_streak = case when excluded.updated_at > correct_streaks.updated_at then excluded.current_streak else correct_streaks.current_streak end,
      updated_at = greatest(correct_streaks.updated_at, excluded.updated_at);
  delete from correct_streaks where visitor_id = p_visitor;
  -- pinned questions (v46): per question, the newer change wins
  insert into question_pins (visitor_id, hub, qid, pinned, t)
    select p, hub, qid, pinned, t from question_pins where visitor_id = p_visitor
    on conflict (visitor_id, hub, qid) do update set pinned = case when excluded.t > question_pins.t then excluded.pinned else question_pins.pinned end,
      t = greatest(question_pins.t, excluded.t);
  delete from question_pins where visitor_id = p_visitor;
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  return p;
end;
$$;
