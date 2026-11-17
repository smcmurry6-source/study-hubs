-- v61 (2026-11-17): the survey and check-in reward goes from 500 XP to 1,000 XP. Sam: "Lets up the xp to 1000" (the crowns
-- stay 1,000). Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js).
--
-- 1. sh_form_reward pays 1,000 XP (migration_v60 paid 500). Still once per person and key, not boosted, on the linked id.
-- 2. Everyone already paid at 500 (the live functions since v60 and the back pay, tools/data-fixes/2026-11-17-reward-backpay.sql)
--    gets the other 500: their award row becomes base 1,000 / xp 1,000 and their XP total goes up by 500. Only rows still at
--    500 move, so running this twice changes nothing. sh_wallet needs no change: it takes a reward row's whole base out of the
--    1-crown-per-10-XP share and pays 1,000 crowns a row, so the crowns stay exactly 1,000.

create or replace function public.sh_form_reward(p_visitor text, p_key text, p_src text, p_hub text)
returns integer language plpgsql security definer set search_path = public as $$
declare me text;
begin
  if p_visitor is null or p_src not in ('survey', 'checkin') then return 0; end if;
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  return sh_award(me, p_key, p_src, coalesce(p_hub, ''), 1000, 1, now());
end;
$$;
revoke all on function public.sh_form_reward(text, text, text, text) from public, anon, authenticated;

-- the top-up for rewards paid at 500
do $$
declare r record;
begin
  for r in select visitor_id, key from xp_awards where src in ('survey', 'checkin') and base = 500 and xp = 500 for update loop
    perform pg_advisory_xact_lock(hashtext('xp|' || r.visitor_id));
    update xp_awards set base = 1000, xp = 1000 where visitor_id = r.visitor_id and key = r.key and base = 500;
    insert into xp_visitors (visitor_id, xp) values (r.visitor_id, 500)
      on conflict (visitor_id) do update set xp = xp_visitors.xp + 500;
  end loop;
end;
$$;
