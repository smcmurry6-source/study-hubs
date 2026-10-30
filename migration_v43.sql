-- v43: admin "Time by section" timed out (API anon limit is 3 s). get_visitor_by_hub and
-- get_visitor_by_section filter activity_pings on pinged_at alone, which had no index, so each
-- did a full table scan. A covering index lets both run as index-only scans.
create index if not exists activity_pings_time_idx
  on public.activity_pings (pinged_at) include (hub, section, visitor_id);
analyze public.activity_pings;
