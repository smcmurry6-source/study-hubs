$h = @{ apikey = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS"; "Content-Type" = "application/json" }
try {
  $lb = Invoke-RestMethod -Uri "https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/rpc/get_leaderboard" -Method Post -Headers $h -Body '{"p_limit":10}'
  Write-Output "LEADERBOARD:"
  $lb | ConvertTo-Json -Compress
} catch {
  Write-Output "LB ERROR: $_"
}

try {
  $names = Invoke-RestMethod -Uri "https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/visitor_names?select=display_name&limit=10" -Method Get -Headers $h
  Write-Output "VISITOR_NAMES:"
  $names | ConvertTo-Json -Compress
} catch {
  Write-Output "NAMES ERROR: $_"
}
