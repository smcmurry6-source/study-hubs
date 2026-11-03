---
type: rule
tags: [security]
---

# Secrets

This repo is public. Never commit keys or tokens, and never put the admin
secret in client-side JS. In cloud sessions they come from the environment:

- `SB_KEY` — Supabase publishable key (also fine as an API credential on
  `thytmzsgymydbzcqdnix.supabase.co`, which opens network access to it).
- `ADMIN_SECRET` — for gated RPCs such as `log_changelog(p_secret, p_hub, p_message)`.

If they're missing, skip the changelog step and tell Sam rather than hunting
for them. Check Supabase reachability first:
`curl -sS -o /dev/null -w "%{http_code}" https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/`
(401 = reachable, no key).
