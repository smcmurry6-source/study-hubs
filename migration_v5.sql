-- migration_v5.sql
-- Run this ONCE in the Supabase SQL editor (Project: thytmzsgymydbzcqdnix).
--
-- What this does:
-- 1. Adds an admin_reset_changelog() function that can wipe and replace the
--    changelog table's contents (the existing log_changelog() function can
--    only INSERT new rows -- it can't fix old ones).
-- 2. Immediately calls it once, replacing the 6 existing changelog entries
--    with a simplified, non-technical, bullet-point-friendly set that
--    reflects what's actually true right now (e.g. class-wide correctness
--    is automatic now, not a button click).
--
-- Safe to run more than once -- it just resets the log to the same curated
-- text again.

create or replace function admin_reset_changelog(p_secret text, p_entries jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  entry jsonb;
begin
  if p_secret <> '093025' then
    raise exception 'invalid secret';
  end if;

  delete from changelog;

  for entry in select * from jsonb_array_elements(p_entries)
  loop
    insert into changelog (hub, message, created_at)
    values (
      entry->>'hub',
      entry->>'message',
      coalesce((entry->>'created_at')::timestamptz, now())
    );
  end loop;
end;
$$;

grant execute on function admin_reset_changelog(text, jsonb) to anon, authenticated;

select admin_reset_changelog('093025', '[
  {"hub": null, "message": "Added study streaks, a live class activity pulse, an opt-in leaderboard, and a way to flag or suggest fixes to questions.", "created_at": "2026-09-09T01:27:53.59274+00:00"},
  {"hub": "dashboard", "message": "Updated the Genetics and Hepatobiliary hubs, and moved Class Pulse and Study Streaks near the top of the dashboard.", "created_at": "2026-09-09T02:17:14.045954+00:00"},
  {"hub": "dashboard", "message": "Added search across every hub, fixed the toughest-questions list on Hepatobiliary, and made the What''s New box collapsible.", "created_at": "2026-09-09T10:51:50.742808+00:00"},
  {"hub": null, "message": "Added a Listen button so lecture summaries can be read aloud.", "created_at": "2026-09-09T20:29:36.170539+00:00"},
  {"hub": null, "message": "Redesigned the site for mobile with easier navigation and bigger buttons.", "created_at": "2026-09-09T20:29:36.527206+00:00"},
  {"hub": null, "message": "Class-wide correctness now shows automatically on every question in Genetics, Perio, and Hepatobiliary -- no button needed.", "created_at": "2026-09-09T21:42:36.710788+00:00"},
  {"hub": null, "message": "Improved the Listen feature: a more natural voice, word-by-word highlighting as it reads, and click any word to resume from there.", "created_at": "2026-09-09T22:20:00+00:00"},
  {"hub": "dashboard", "message": "Added a heads-up banner when a new update goes live, and grouped the What''s New box by day (collapsed by default).", "created_at": "2026-09-09T22:21:00+00:00"}
]'::jsonb);
