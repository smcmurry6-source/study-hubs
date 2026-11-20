-- v56 (2026-11-12): Learn and Flashcards' server side (vault/tasks/2026-11-06-redesign-learn-and-flashcards.md; how it
-- works: vault/reference/game-server.md, "Learn and Flashcards"). Written and tested on a throwaway copy of
-- supabase/schema.sql with migration_v54 and migration_v55 (tools/release/xp.js, tools/release/rls.js); applied to the
-- live project at the redesign's release with them, not before. Until then it is listed in
-- supabase/pending-migrations.txt, after v54 and v55, which it needs and doesn't change (Sam, 2026-11-12: "B, go ahead":
-- a new file, so migration_v54.sql and migration_v55.sql stay as they are).
--
-- The Question Bank's "Study as" toggle studies the questions three ways. Questions and Learn are answers: they go
-- through record_answer_v2 as today (Learn's are filed under the context `other`, since v54's list of contexts is left
-- as it is). Flashcards are not answers: you flip a card and say how well you knew it (Again, Hard, Good, Easy), and
-- that rating never reaches question_stats, the class's picks, personal_answers or question health. This file keeps
-- those ratings, and Learn's step for each question, so a person's schedule and progress follow them to their other
-- devices, and pays a flashcard as v54 pays a self-graded card.
--
-- What it adds:
--   1. card_reviews: one row per rating or Learn step (visitor, hub, question id, what happened, when), per person,
--      closed to anon and authenticated altogether (kept like personal_answers: vault/reference/analytics-retention.md);
--   2. `card` as a kind of XP award (xp_awards.src), so the rebuild after a correction or Link my devices keeps them
--      as it keeps a mock's or a game's;
--   3. record_card_v2: records one rating or Learn step; a rating of a card that was due or new pays a flat 2 (doubled
--      by a boost), for a card's first three ratings a Central day, under the answers' speed limit (2 seconds since the
--      last answer or rating, no more than 30 in a minute); Study ahead (p_ahead) and Learn's steps pay nothing; a
--      replayed call returns its first answer and pays once, and another visitor's request id is refused;
--   4. reset_my_learn: Learn's Start over for a whole set in one call (a `learn-reset` row per question, no pay);
--      get_my_cards: your own rows for one hub, oldest first, which the page replays with the same scheduling code
--      (widget/study-modes.js) to rebuild the schedule and Learn's progress on another device;
--   5. Link my devices moves them (a trigger on visitor_links, as migration_v55 does for Timmy's chats, so
--      redeem_link_code stays as migration_v54 has it).
--
-- What it leaves alone (Sam, 2026-11-12): a rating is not an answer, so it doesn't make a day studied on the server (no
-- +20, not on the streak board, not the 20th answer) and never counts toward a medal. On the page it counts toward the
-- daily goal ring and the streak on every device (get_my_cards brings the days).

-- ====================================================================== 1. the log
create table if not exists public.card_reviews (
  id bigserial primary key,
  visitor_id text not null check (length(visitor_id) between 1 and 80),
  hub text not null check (hub ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  qid text not null check (length(qid) between 1 and 80),
  -- a flashcard's rating, or Learn's step for the question after this answer (0 missed, 1 right once, 2 mastered),
  -- or `learn-reset` (Start over)
  what text not null check (what in ('again', 'hard', 'good', 'easy', 'learn-0', 'learn-1', 'learn-2', 'learn-reset')),
  ahead boolean not null default false,       -- rated early with Study ahead: moves the schedule, pays nothing
  at timestamptz not null default now(),      -- when the server recorded it (the speed limit and the day use this)
  seen_at timestamptz not null default now(), -- when the page says it happened, kept within the last two days (the replay's order)
  request_id text unique check (request_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  xp integer not null default 0,
  resp jsonb
);
create index if not exists card_reviews_mine on public.card_reviews (visitor_id, hub, seen_at, id);
create index if not exists card_reviews_day on public.card_reviews (visitor_id, at);
alter table public.card_reviews enable row level security;
revoke all on table public.card_reviews from public, anon, authenticated;
revoke all on sequence public.card_reviews_id_seq from public, anon, authenticated;

-- ====================================================================== 2. a flashcard is a kind of award
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card'));

-- ====================================================================== 3. one rating or Learn step
-- p_what: 'again' | 'hard' | 'good' | 'easy' (a flashcard), 'learn-0' | 'learn-1' | 'learn-2' | 'learn-reset' (Learn);
-- p_ahead: rated with Study ahead (the card wasn't due); p_request: a random id per rating, so a retried or replayed call
-- records and pays once; p_seen: when the page says it happened (epoch milliseconds), for the replay's order only.
-- p_at is null except in the tests. The page decides whether a card was due or new; the server pays a card only for its
-- first three ratings a Central day, so tapping Easy over and over earns nothing after that.
create or replace function public.sh_card(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_what text,
  p_ahead boolean, p_request text, p_seen bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_at timestamptz; v_seen timestamptz; prev record; k public.question_keys; v_kind text; rid bigint; dd date;
  prev_t timestamptz; prev_c timestamptz; n60 int; n_day int; speed_ok boolean := false; v_base int := 0; v_mult int := 1;
  paid int := 0; why text; v_resp jsonb; rating boolean;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or p_what is null or p_what not in ('again', 'hard', 'good', 'easy', 'learn-0', 'learn-1', 'learn-2', 'learn-reset')
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$') then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  rating := p_what in ('again', 'hard', 'good', 'easy');
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  v_seen := v_at;
  if p_seen is not null and p_seen between 0 and 32503680000000 then
    v_seen := least(v_at, greatest(v_at - interval '2 days', to_timestamp(p_seen / 1000.0)));
  end if;

  -- the same rating again (a retry, a reload, a replayed call): what it got the first time, nothing new
  if p_request is not null then
    select r.resp, r.visitor_id into prev from card_reviews r where r.request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;

  insert into card_reviews (visitor_id, hub, qid, what, ahead, at, seen_at, request_id)
    values (p_visitor, p_hub, p_qid, p_what, rating and coalesce(p_ahead, false), v_at, v_seen, p_request)
    returning id into rid;
  dd := (v_at at time zone 'America/Chicago')::date;

  if not rating then
    why := 'learn';
  elsif coalesce(p_ahead, false) then
    why := 'ahead';
  else
    -- a question the server has a key for (an unknown or retired id is recorded and never paid, as with answers)
    select * into k from sh_key(p_hub, p_qid, null);
    v_kind := case when k.qid is null then 'unknown' when k.retired then 'retired' else 'card' end;
    if v_kind <> 'card' then
      why := v_kind;
    else
      -- the speed limit, shared with answers: 2 seconds since the last answer or rating, 30 in a minute (a mock's
      -- answers aside, as for answers)
      select max(a.answered_at) into prev_t from personal_answers a where a.visitor_id = p_visitor and a.answered_at <= v_at;
      select max(r.at) into prev_c from card_reviews r
        where r.visitor_id = p_visitor and r.id <> rid and r.at <= v_at and r.what in ('again', 'hard', 'good', 'easy');
      select count(*) into n60 from (
        select a.answered_at from personal_answers a
          left join answer_xp x on x.answer_id = a.id left join xp_sessions ss on ss.id = x.session_id
          where a.visitor_id = p_visitor and a.answered_at >= v_at - interval '60 seconds' and a.answered_at <= v_at
            and coalesce(ss.kind, '') <> 'mock'
        union all
        select r.at from card_reviews r where r.visitor_id = p_visitor and r.at >= v_at - interval '60 seconds' and r.at <= v_at
          and r.what in ('again', 'hard', 'good', 'easy')) z;
      speed_ok := (prev_t is null or v_at - prev_t >= interval '2 seconds')
              and (prev_c is null or v_at - prev_c >= interval '2 seconds') and n60 <= 30;
      if not speed_ok then
        why := 'fast';
      else
        -- a card's first three ratings a Central day (Study ahead's don't count)
        select count(*) into n_day from card_reviews r
          where r.visitor_id = p_visitor and r.hub = p_hub and r.qid = p_qid and r.what in ('again', 'hard', 'good', 'easy')
            and not r.ahead and r.at <= v_at and (r.at at time zone 'America/Chicago')::date = dd;
        v_base := case when n_day <= 3 then 2 else 0 end;
        if v_base = 0 then why := 'repeat'; end if;
        v_mult := sh_xp_mult(p_visitor, v_at);
        paid := sh_award(p_visitor, 'c:' || rid, 'card', p_hub, v_base, v_mult, v_at);
      end if;
    end if;
  end if;

  v_resp := jsonb_build_object('ok', true, 'xp', paid, 'base', v_base, 'mult', v_mult, 'why', why,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor));
  update card_reviews set xp = paid, resp = v_resp where id = rid;
  return v_resp;
end;
$$;

create or replace function public.record_card_v2(p_visitor text, p_hub text, p_qid text, p_what text,
  p_ahead boolean default false, p_request text default null, p_seen bigint default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_card(null, p_visitor, p_hub, p_qid, p_what, p_ahead, p_request, p_seen);
$$;

-- Learn's Start over for a whole set at once (up to 2,000 questions of one hub): one `learn-reset` row per question, in
-- one call. It pays nothing and needs no request id: a replayed reset resets again, which changes nothing.
create or replace function public.reset_my_learn(p_visitor text, p_hub text, p_qids text[], p_seen bigint default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := clock_timestamp(); v_seen timestamptz := v_at; n int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qids is null or cardinality(p_qids) not between 1 and 2000
     or exists (select 1 from unnest(p_qids) z where z is null or length(z) not between 1 and 80) then
    return 0;
  end if;
  if p_seen is not null and p_seen between 0 and 32503680000000 then
    v_seen := least(v_at, greatest(v_at - interval '2 days', to_timestamp(p_seen / 1000.0)));
  end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  insert into card_reviews (visitor_id, hub, qid, what, at, seen_at, resp)
    select p_visitor, p_hub, z, 'learn-reset', v_at, v_seen, '{"ok": true, "xp": 0, "why": "learn"}'::jsonb
    from (select distinct unnest(p_qids) as z) d;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ====================================================================== 4. your own rows, for the replay
-- [qid, what, when (epoch ms, the page's time), ahead (1/0), request id], oldest first: the newest 20,000 of one hub
create or replace function public.get_my_cards(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(x.qid, x.what, x.t, x.ahead, x.request_id) order by x.t, x.id), '[]'::jsonb)
  from (
    select r.id, r.qid, r.what, floor(extract(epoch from r.seen_at) * 1000)::bigint as t, case when r.ahead then 1 else 0 end as ahead, r.request_id
    from card_reviews r
    where p_visitor is not null and length(p_visitor) between 1 and 80 and length(coalesce(p_hub, '')) between 1 and 40
      and r.visitor_id = p_visitor and r.hub = p_hub
    order by r.seen_at desc, r.id desc
    limit 20000
  ) x;
$$;

-- ====================================================================== 5. Link my devices
-- redeem_link_code (migration_v54) records each pair in visitor_links (alias -> the id that remains); the ratings and
-- Learn's steps follow it inside the same transaction, after which its rebuild keeps the `card` awards it moved.
create or replace function public.sh_cards_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    update card_reviews set visitor_id = new.primary_id where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
drop trigger if exists visitor_links_cards on public.visitor_links;
create trigger visitor_links_cards after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_cards_on_link();

-- ====================================================================== grants
revoke all on function public.sh_card(timestamptz, text, text, text, text, boolean, text, bigint) from public, anon, authenticated;
revoke all on function public.sh_cards_on_link() from public, anon, authenticated;
revoke all on function public.record_card_v2(text, text, text, text, boolean, text, bigint) from public;
grant execute on function public.record_card_v2(text, text, text, text, boolean, text, bigint) to anon, authenticated;
revoke all on function public.reset_my_learn(text, text, text[], bigint) from public;
grant execute on function public.reset_my_learn(text, text, text[], bigint) to anon, authenticated;
revoke all on function public.get_my_cards(text, text) from public;
grant execute on function public.get_my_cards(text, text) to anon, authenticated;
