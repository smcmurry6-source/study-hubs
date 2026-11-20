-- v55 (2026-11-12): Ask Timmy's server side, the database half (vault/tasks/2026-11-12-redesign-ask-timmy.md, how it
-- works: vault/reference/ask-timmy.md). Written and tested on a throwaway copy of supabase/schema.sql
-- (tools/release/rls.js, tools/release/timmy.js); applied to the live project at the redesign's release with
-- migration_v54, not before. Until then it is listed in supabase/pending-migrations.txt.
--
-- The Edge Function `timmy` (supabase/functions/timmy/) answers students' questions from the hubs' own content. It is the
-- only writer: it calls timmy_begin before it asks the model and timmy_finish after, with the service role. Students'
-- browsers read only their own chats (get_timmy_history) and can only thumb an answer, say what they did with an offer,
-- or report an answer.
-- The admin page reads everything behind the admin secret.
--
-- What it adds:
--   1. timmy_config: on or off, the site-wide daily spending cap (about $10), the messages per person per day (40);
--   2. timmy_chats and timmy_messages: every message to and from Timmy, with the visitor id (Sam, 2026-11-12: "store all
--      chat logs with timmy"; vault/rules/learner-data-privacy.md), closed to anon and authenticated altogether;
--   3. timmy_begin / timmy_finish (service role only): the limits, the chat, the last 10 messages, whether the question
--      being asked about was answered, then the reply with its tokens and estimated cost;
--   4. the students' calls: get_timmy_history, timmy_thumb, timmy_offer, and timmy_report (the chat's Report button on
--      an answer that went wrong; Sam, 2026-11-12: "so if timmy gives an error or bad answer or something, you can report
--      it and we can fix what went wrong"), sent as a usual report so it reaches the admin Inbox and Sam's reply comes back;
--   5. the admin page's: admin_timmy_days, admin_timmy_chats, admin_timmy_chat, admin_timmy_not_covered,
--      admin_timmy_unchecked, admin_timmy_reported, admin_timmy_config;
--   6. Link my devices moves the chats (a trigger on visitor_links, so redeem_link_code stays as migration_v54 has it).
--
-- Every new table has row-level security on and no policy, and anon and authenticated have no privilege on it.

-- ====================================================================== 1. the settings
-- One row. enabled = false turns Timmy off everywhere at once (the chat says he's napping). day_cap_usd stops new
-- questions for the rest of the Central day once the day's estimated cost (plus what's in flight) would pass it.
-- reserve_usd is what each question in flight holds against the cap until its answer's real cost is known.
create table if not exists public.timmy_config (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  day_cap_usd numeric(8,2) not null default 10 check (day_cap_usd >= 0),
  per_visitor_day integer not null default 40 check (per_visitor_day >= 0),
  reserve_usd numeric(8,4) not null default 0.08 check (reserve_usd >= 0),
  updated_at timestamptz not null default now()
);
insert into public.timmy_config (id) values (true) on conflict (id) do nothing;

-- ====================================================================== 2. the chats
-- hub: a hub id, or 'dashboard' (there Timmy knows every live hub; the function sends the hubs it used in context).
create table if not exists public.timmy_chats (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  hub text not null,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  messages integer not null default 0
);
create index if not exists timmy_chats_visitor on public.timmy_chats (visitor_id, hub, last_at desc);
create index if not exists timmy_chats_last on public.timmy_chats (last_at desc);

-- One row per message. A student's row: what they typed (text), where they were and what the page sent with it (context:
-- view, lecture, paragraph, the answered question's id and pick, the progress summary for "What should I study
-- tonight?"), the exact text the model was sent (sent, so later turns replay it byte for byte and the prompt cache holds),
-- the browser's id for the send (request_id), and what it holds against the day's cap while in flight (reserve_usd).
-- Timmy's row (reply_to = the student's row): the answer's paragraphs as plain text (text), the checked answer as the
-- browser got it (reply), what the model wrote (raw), its kind, the quotes that checked and the ones that didn't, the
-- offer and what the student did with it, the thumb, the model that served it, its tokens, estimated cost and time.
create table if not exists public.timmy_messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.timmy_chats (id) on delete cascade,
  who text not null check (who in ('student', 'timmy')),
  text text not null,
  context jsonb,
  sent text,
  request_id text,
  reserve_usd numeric(8,4) not null default 0,
  reply_to bigint references public.timmy_messages (id) on delete cascade,
  reply jsonb,
  raw text,
  kind text check (kind in ('answer', 'not_covered', 'quiz_declined', 'hint_declined', 'off_topic', 'support', 'refusal', 'error')),
  cites_ok integer,
  cites_bad integer,
  unchecked jsonb,
  offer_kind text check (offer_kind in ('report', 'idea')),
  offer_action text check (offer_action in ('sent', 'posted', 'dismissed')),
  offer_at timestamptz,
  thumb smallint check (thumb in (-1, 1)),
  thumb_at timestamptz,
  report_id bigint,
  reported_at timestamptz,
  model text,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  cost_usd numeric(10,6),
  ms integer,
  day date not null default ((now() at time zone 'America/Chicago')::date),
  created_at timestamptz not null default now()
);
create index if not exists timmy_messages_chat on public.timmy_messages (chat_id, id);
create index if not exists timmy_messages_day on public.timmy_messages (day);
create unique index if not exists timmy_messages_reply on public.timmy_messages (reply_to) where reply_to is not null;
create unique index if not exists timmy_messages_request on public.timmy_messages (request_id) where request_id is not null;

alter table public.timmy_config enable row level security;
alter table public.timmy_chats enable row level security;
alter table public.timmy_messages enable row level security;
revoke all on table public.timmy_config, public.timmy_chats, public.timmy_messages from public, anon, authenticated;
grant all on table public.timmy_config, public.timmy_chats, public.timmy_messages to service_role;

-- ====================================================================== 3. the function's two calls (service role only)
-- Before the model is asked. p_chat: the chat to continue (null starts one; a chat of someone else's or another hub's
-- starts a new one). p_qid: the question "Ask Timmy" was tapped on, so the function knows whether this visitor answered it
-- (only then may its key and whys go in the prompt). p_request: the browser's random id for this send.
-- { ok: true, chat, message, history: [{ who, text, kind, sent, raw }] (the last 10 messages before this one, oldest
--   first), answered, spent, cap }
-- { ok: true, repeat: true, chat, message, reply }         this request was answered before: the same answer, no new call
-- { ok: false, error: 'bad' | 'off' | 'limit' | 'cap' | 'busy' }
--   limit: this person's 40 for the Central day; cap: the site's daily spend; busy: a question of theirs is still being
--   answered (one at a time, so a script can't fire forty at once).
create or replace function public.timmy_begin(p_visitor text, p_hub text, p_chat uuid, p_text text, p_context jsonb,
  p_request text default null, p_qid text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg record; t text := btrim(coalesce(p_text, '')); today date := (now() at time zone 'America/Chicago')::date;
  prev record; n int; spent numeric; ch uuid; mid bigint; hist jsonb; ans boolean := false; rep record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or length(t) not between 1 and 1000
     or (p_context is not null and (jsonb_typeof(p_context) <> 'object' or length(p_context::text) > 6000))
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_qid is not null and length(p_qid) not between 1 and 80) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  select * into cfg from timmy_config where id;
  if not found or not cfg.enabled then return jsonb_build_object('ok', false, 'error', 'off'); end if;
  perform pg_advisory_xact_lock(hashtext('timmy|' || p_visitor));

  -- a retried send: the same answer again, or wait for the one in flight
  if p_request is not null then
    select m.id, m.chat_id, m.created_at, c.visitor_id into prev from timmy_messages m join timmy_chats c on c.id = m.chat_id where m.request_id = p_request;
    if found then
      if prev.visitor_id <> p_visitor then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
      select id, reply into rep from timmy_messages where reply_to = prev.id;
      if found and rep.reply is not null then
        return jsonb_build_object('ok', true, 'repeat', true, 'chat', prev.chat_id, 'message', rep.id, 'reply', rep.reply);
      end if;
      if prev.created_at > now() - interval '2 minutes' then return jsonb_build_object('ok', false, 'error', 'busy'); end if;
      -- asked over 2 minutes ago and never answered (the function stopped): ask again as a new message
      delete from timmy_messages where id = prev.id;
      update timmy_chats set messages = greatest(0, messages - 1) where id = prev.chat_id;
    end if;
  end if;

  -- one question at a time
  if exists (select 1 from timmy_messages m join timmy_chats c on c.id = m.chat_id
             where c.visitor_id = p_visitor and m.who = 'student' and m.created_at > now() - interval '2 minutes'
               and not exists (select 1 from timmy_messages r where r.reply_to = m.id)) then
    return jsonb_build_object('ok', false, 'error', 'busy');
  end if;

  -- this person's messages today (an answer that failed doesn't count)
  select count(*) into n from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where c.visitor_id = p_visitor and m.who = 'student' and m.day = today
      and not exists (select 1 from timmy_messages r where r.reply_to = m.id and r.kind = 'error');
  if n >= cfg.per_visitor_day then return jsonb_build_object('ok', false, 'error', 'limit'); end if;

  -- the site's spend today: what answers cost, plus what questions in flight hold
  perform pg_advisory_xact_lock(hashtext('timmy-spend'));
  select coalesce(sum(cost_usd), 0) + coalesce(sum(reserve_usd) filter (where created_at > now() - interval '5 minutes'), 0)
    into spent from timmy_messages where day = today;
  if spent + cfg.reserve_usd > cfg.day_cap_usd then return jsonb_build_object('ok', false, 'error', 'cap'); end if;

  -- the chat
  if p_chat is not null then select id into ch from timmy_chats where id = p_chat and visitor_id = p_visitor and hub = p_hub; end if;
  if ch is null then insert into timmy_chats (visitor_id, hub) values (p_visitor, p_hub) returning id into ch; end if;
  select coalesce(jsonb_agg(jsonb_build_object('who', h.who, 'text', h.text, 'kind', h.kind, 'sent', h.sent, 'raw', h.raw) order by h.id), '[]'::jsonb)
    into hist from (select * from timmy_messages where chat_id = ch order by id desc limit 10) h;
  insert into timmy_messages (chat_id, who, text, context, request_id, reserve_usd)
    values (ch, 'student', t, p_context, p_request, cfg.reserve_usd) returning id into mid;
  update timmy_chats set last_at = now(), messages = messages + 1 where id = ch;

  if p_qid is not null and p_hub <> 'dashboard' then
    ans := exists (select 1 from personal_answers where visitor_id = p_visitor and hub = p_hub and qid = p_qid);
  end if;
  return jsonb_build_object('ok', true, 'chat', ch, 'message', mid, 'history', hist, 'answered', ans,
    'spent', round(spent, 4), 'cap', cfg.day_cap_usd);
end;
$$;

-- After the model answered (or failed: kind 'error', no cost). p_sent: the exact text the model was sent for the
-- student's turn (kept on the student's row, so a later turn replays it byte for byte). Returns Timmy's message id; a
-- second call for the same student message returns the first one's id and changes nothing.
create or replace function public.timmy_finish(p_student bigint, p_sent text, p_kind text, p_text text, p_reply jsonb, p_raw text,
  p_cites_ok integer default 0, p_cites_bad integer default 0, p_unchecked jsonb default null, p_offer_kind text default null,
  p_model text default null, p_input integer default null, p_output integer default null, p_cache_read integer default null,
  p_cache_write integer default null, p_cost numeric default 0, p_ms integer default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare s record; mid bigint;
begin
  select * into s from timmy_messages where id = p_student and who = 'student';
  if not found then raise exception 'unknown message'; end if;
  select id into mid from timmy_messages where reply_to = p_student;
  if found then return mid; end if;
  insert into timmy_messages (chat_id, who, text, reply_to, reply, raw, kind, cites_ok, cites_bad, unchecked, offer_kind,
      model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, ms)
    values (s.chat_id, 'timmy', left(coalesce(p_text, ''), 8000), p_student, p_reply, left(p_raw, 24000), p_kind,
      greatest(0, coalesce(p_cites_ok, 0)), greatest(0, coalesce(p_cites_bad, 0)), p_unchecked, p_offer_kind,
      left(p_model, 80), p_input, p_output, p_cache_read, p_cache_write, greatest(0, coalesce(p_cost, 0)), p_ms)
    returning id into mid;
  update timmy_messages set reserve_usd = 0, sent = left(p_sent, 24000) where id = p_student;
  update timmy_chats set last_at = now(), messages = messages + 1 where id = s.chat_id;
  return mid;
end;
$$;

-- ====================================================================== 4. the students' calls
-- The caller's own chats on one hub (or the dashboard), newest first, with their messages oldest first: what each said,
-- Timmy's checked answers, the thumbs and what was done with each offer. Never the context, tokens or cost.
create or replace function public.get_timmy_history(p_visitor text, p_hub text, p_limit integer default 10)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'started', c.started_at, 'last', c.last_at, 'messages', (
        select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'who', m.who, 'text', m.text, 'reply', m.reply, 'kind', m.kind,
            'thumb', m.thumb, 'offer', m.offer_kind, 'offer_action', m.offer_action, 'at', m.created_at) order by m.id), '[]'::jsonb)
        from (select * from timmy_messages where chat_id = c.id order by id desc limit 60) m)) order by c.last_at desc)
    from (select * from timmy_chats where visitor_id = p_visitor and hub = p_hub order by last_at desc
          limit greatest(1, least(coalesce(p_limit, 10), 20))) c), '[]'::jsonb);
end;
$$;

-- a thumb on one of Timmy's answers to the caller: 1 up, -1 down, 0 takes it back
create or replace function public.timmy_thumb(p_visitor text, p_message bigint, p_val integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or p_val is null or p_val not in (-1, 0, 1) then return false; end if;
  update timmy_messages m set thumb = nullif(p_val, 0)::smallint, thumb_at = now()
    from timmy_chats c where m.id = p_message and m.who = 'timmy' and c.id = m.chat_id and c.visitor_id = p_visitor;
  return found;
end;
$$;

-- what the student did with Timmy's offer: 'sent' (the report), 'posted' (the idea), 'dismissed' (No thanks)
create or replace function public.timmy_offer(p_visitor text, p_message bigint, p_action text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or p_action is null or p_action not in ('sent', 'posted', 'dismissed') then return false; end if;
  update timmy_messages m set offer_action = p_action, offer_at = now()
    from timmy_chats c where m.id = p_message and m.who = 'timmy' and m.offer_kind is not null
      and (p_action = 'dismissed' or (p_action = 'sent') = (m.offer_kind = 'report'))
      and c.id = m.chat_id and c.visitor_id = p_visitor;
  return found;
end;
$$;

-- a report on one of Timmy's answers (the chat's Report button: a wrong or bad answer, an error), sent the site's usual
-- way: a question_flags row, so it is in the admin page's Inbox and Sam's reply reaches the sender as any reply does. Its
-- note ends " — Timmy's answer <id> · <where>", and the answer is marked, so the Timmy tab opens the whole chat. p_message
-- null: a report about Timmy with no answer to point at (he was napping, or wouldn't answer); then p_hub says where.
-- Ten Timmy reports a person a day; reporting the same answer again returns the first report.
-- { ok: true, id } or { ok: false, error: 'bad' | 'limit' }
create or replace function public.timmy_report(p_visitor text, p_hub text, p_message bigint, p_note text, p_section text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n text := btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')); m record; h text; fid bigint;
  w text := nullif(left(regexp_replace(coalesce(p_section, ''), '[^A-Za-z0-9/_:-]', '', 'g'), 60), '');
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(n) not between 1 and 600 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  if p_message is not null then
    select tm.id, tm.report_id, c.hub into m from timmy_messages tm join timmy_chats c on c.id = tm.chat_id
      where tm.id = p_message and tm.who = 'timmy' and c.visitor_id = p_visitor;
    if not found then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    if m.report_id is not null then return jsonb_build_object('ok', true, 'id', m.report_id, 'repeat', true); end if;
    h := m.hub;
  else
    if p_hub is null or not (p_hub = 'dashboard' or p_hub ~ '^[a-z0-9][a-z0-9-]{0,39}$') then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    h := p_hub;
  end if;
  perform pg_advisory_xact_lock(hashtext('timmy-report|' || p_visitor));
  if (select count(*) from question_flags where visitor_id = p_visitor and note like '% — Timmy%' and created_at > now() - interval '1 day') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;
  insert into question_flags (hub, note, visitor_id)
    values (h, left(n, 600) || ' — Timmy' || coalesce('''s answer ' || p_message, '') || coalesce(' · ' || w, ''), p_visitor) returning id into fid;
  if p_message is not null then update timmy_messages set report_id = fid, reported_at = now() where id = p_message; end if;
  return jsonb_build_object('ok', true, 'id', fid);
end;
$$;

-- ====================================================================== 5. the admin page (the Timmy tab)
-- By Central day and hub: people, questions, answers, estimated cost, not covered, declined (quiz and practice), errors,
-- thumbs, quotes that checked and didn't, offers made and taken, answers reported.
create or replace function public.admin_timmy_days(p_secret text, p_days integer default 30)
returns table(day date, hub text, people bigint, questions bigint, answers bigint, cost_usd numeric, not_covered bigint,
  quiz_declined bigint, hint_declined bigint, errors bigint, thumbs_up bigint, thumbs_down bigint, cites_ok bigint,
  cites_bad bigint, offers bigint, offers_taken bigint, reported bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.day, c.hub, count(distinct c.visitor_id), count(*) filter (where m.who = 'student'), count(*) filter (where m.who = 'timmy'),
      round(coalesce(sum(m.cost_usd), 0), 4), count(*) filter (where m.kind = 'not_covered'), count(*) filter (where m.kind = 'quiz_declined'),
      count(*) filter (where m.kind = 'hint_declined'), count(*) filter (where m.kind in ('error', 'refusal')),
      count(*) filter (where m.thumb = 1), count(*) filter (where m.thumb = -1),
      coalesce(sum(m.cites_ok), 0)::bigint, coalesce(sum(m.cites_bad), 0)::bigint,
      count(*) filter (where m.offer_kind is not null), count(*) filter (where m.offer_action in ('sent', 'posted')),
      count(*) filter (where m.report_id is not null)
    from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where m.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    group by m.day, c.hub order by m.day desc, c.hub;
end;
$$;

-- recent chats, newest first: no visitor id, the first question and how each went
create or replace function public.admin_timmy_chats(p_secret text, p_hub text default null, p_days integer default 14, p_limit integer default 100)
returns table(id uuid, hub text, started_at timestamptz, last_at timestamptz, messages integer, first_question text,
  kinds text[], thumbs_down bigint, cost_usd numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select c.id, c.hub, c.started_at, c.last_at, c.messages,
      (select left(m.text, 200) from timmy_messages m where m.chat_id = c.id and m.who = 'student' order by m.id limit 1),
      array(select distinct m.kind from timmy_messages m where m.chat_id = c.id and m.kind is not null order by 1),
      (select count(*) from timmy_messages m where m.chat_id = c.id and m.thumb = -1),
      (select round(coalesce(sum(m.cost_usd), 0), 4) from timmy_messages m where m.chat_id = c.id)
    from timmy_chats c
    where (p_hub is null or c.hub = p_hub) and c.last_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 14), 400)))
    order by c.last_at desc limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

-- one chat, every message with what it carried (no visitor id)
create or replace function public.admin_timmy_chat(p_secret text, p_chat uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return (select jsonb_build_object('id', c.id, 'hub', c.hub, 'started', c.started_at, 'last', c.last_at, 'messages', (
      select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'who', m.who, 'text', m.text, 'kind', m.kind, 'context', m.context,
          'reply', m.reply, 'cites_ok', m.cites_ok, 'cites_bad', m.cites_bad, 'unchecked', m.unchecked, 'offer', m.offer_kind,
          'offer_action', m.offer_action, 'thumb', m.thumb, 'report_id', m.report_id, 'reported_at', m.reported_at,
          'report', (select f.note from question_flags f where f.id = m.report_id), 'model', m.model, 'input_tokens', m.input_tokens,
          'output_tokens', m.output_tokens, 'cache_read_tokens', m.cache_read_tokens, 'cache_write_tokens', m.cache_write_tokens,
          'cost_usd', m.cost_usd, 'ms', m.ms, 'at', m.created_at) order by m.id), '[]'::jsonb)
      from timmy_messages m where m.chat_id = c.id))
    from timmy_chats c where c.id = p_chat);
end;
$$;

-- the questions Timmy said the notes don't cover (gaps in the content), with the closest lecture he named
create or replace function public.admin_timmy_not_covered(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, question text, closest text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select r.id, c.id, c.hub, r.day, s.text, r.reply->>'closest'
    from timmy_messages r join timmy_messages s on s.id = r.reply_to join timmy_chats c on c.id = r.chat_id
    where r.kind = 'not_covered' and r.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    order by r.id desc limit 500;
end;
$$;

-- the quotes that didn't check out against the paragraph they cited (each shows as plain text, without a link)
create or replace function public.admin_timmy_unchecked(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, unchecked jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.id, c.id, c.hub, m.day, m.unchecked
    from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where m.cites_bad > 0 and m.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    order by m.id desc limit 500;
end;
$$;

-- the answers students reported from the chat, newest first, with the report's words and whether it's resolved
-- (the reply itself is written in the Inbox, as for any report)
create or replace function public.admin_timmy_reported(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, kind text, answer text, report_id bigint, report text,
  resolved boolean, reported_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.id, c.id, c.hub, m.day, m.kind, left(m.text, 400), m.report_id, f.note, coalesce(f.resolved, false), m.reported_at
    from timmy_messages m join timmy_chats c on c.id = m.chat_id left join question_flags f on f.id = m.report_id
    where m.report_id is not null and m.reported_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 400)))
    order by m.reported_at desc limit 500;
end;
$$;

-- read the settings, or change them (a null leaves a setting as it is), with today's spend
create or replace function public.admin_timmy_config(p_secret text, p_enabled boolean default null, p_day_cap_usd numeric default null,
  p_per_visitor_day integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg record; today date := (now() at time zone 'America/Chicago')::date;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_enabled is not null or p_day_cap_usd is not null or p_per_visitor_day is not null then
    update timmy_config set enabled = coalesce(p_enabled, enabled),
      day_cap_usd = coalesce(greatest(0, least(p_day_cap_usd, 100)), day_cap_usd),
      per_visitor_day = coalesce(greatest(0, least(p_per_visitor_day, 500)), per_visitor_day), updated_at = now() where id;
  end if;
  select * into cfg from timmy_config where id;
  return jsonb_build_object('enabled', cfg.enabled, 'day_cap_usd', cfg.day_cap_usd, 'per_visitor_day', cfg.per_visitor_day,
    'reserve_usd', cfg.reserve_usd, 'updated_at', cfg.updated_at,
    'spent_today', (select round(coalesce(sum(cost_usd), 0), 4) from timmy_messages where day = today),
    'questions_today', (select count(*) from timmy_messages where day = today and who = 'student'));
end;
$$;

-- ====================================================================== 6. Link my devices moves the chats
-- redeem_link_code (migration_v54) records each pair in visitor_links (alias -> the id that remains); the chats follow it,
-- so a linked device's history shows on the other. The trigger runs inside redeem_link_code's transaction.
create or replace function public.sh_timmy_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    update timmy_chats set visitor_id = new.primary_id where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
drop trigger if exists visitor_links_timmy on public.visitor_links;
create trigger visitor_links_timmy after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_timmy_on_link();

-- ====================================================================== grants
revoke all on function public.timmy_begin(text, text, uuid, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.timmy_begin(text, text, uuid, text, jsonb, text, text) to service_role;
revoke all on function public.timmy_finish(bigint, text, text, text, jsonb, text, integer, integer, jsonb, text, text, integer, integer, integer, integer, numeric, integer) from public, anon, authenticated;
grant execute on function public.timmy_finish(bigint, text, text, text, jsonb, text, integer, integer, jsonb, text, text, integer, integer, integer, integer, numeric, integer) to service_role;
revoke all on function public.sh_timmy_on_link() from public, anon, authenticated;
revoke all on function public.get_timmy_history(text, text, integer) from public;
grant execute on function public.get_timmy_history(text, text, integer) to anon, authenticated;
revoke all on function public.timmy_thumb(text, bigint, integer) from public;
grant execute on function public.timmy_thumb(text, bigint, integer) to anon, authenticated;
revoke all on function public.timmy_offer(text, bigint, text) from public;
grant execute on function public.timmy_offer(text, bigint, text) to anon, authenticated;
revoke all on function public.timmy_report(text, text, bigint, text, text) from public;
grant execute on function public.timmy_report(text, text, bigint, text, text) to anon, authenticated;
revoke all on function public.admin_timmy_reported(text, integer) from public;
grant execute on function public.admin_timmy_reported(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_days(text, integer) from public;
grant execute on function public.admin_timmy_days(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_chats(text, text, integer, integer) from public;
grant execute on function public.admin_timmy_chats(text, text, integer, integer) to anon, authenticated;
revoke all on function public.admin_timmy_chat(text, uuid) from public;
grant execute on function public.admin_timmy_chat(text, uuid) to anon, authenticated;
revoke all on function public.admin_timmy_not_covered(text, integer) from public;
grant execute on function public.admin_timmy_not_covered(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_unchecked(text, integer) from public;
grant execute on function public.admin_timmy_unchecked(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_config(text, boolean, numeric, integer) from public;
grant execute on function public.admin_timmy_config(text, boolean, numeric, integer) to anon, authenticated;
