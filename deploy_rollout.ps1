$ErrorActionPreference = "Stop"
$token = $env:STUDY_HUBS_GH_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host 'ERROR: Set $env:STUDY_HUBS_GH_TOKEN to your GitHub PAT first, e.g.:'
  Write-Host '  $env:STUDY_HUBS_GH_TOKEN = "github_pat_..."'
  exit 1
}
$owner = "smcmurry6-source"
$repo = "study-hubs"
$branch = "main"
$root = "C:\Users\smcmu\OneDrive\Documents\study-hubs"
$headers = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json" }
$base = "https://api.github.com/repos/$owner/$repo"

function New-Blob($localPath) {
  $content = [System.IO.File]::ReadAllText($localPath)
  $body = @{ content = $content; encoding = "utf-8" } | ConvertTo-Json -Depth 5 -Compress
  $resp = Invoke-RestMethod -Uri "$base/git/blobs" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
  return $resp.sha
}

function New-BinaryBlob($localPath) {
  $bytes = [System.IO.File]::ReadAllBytes($localPath)
  $content = [System.Convert]::ToBase64String($bytes)
  $body = @{ content = $content; encoding = "base64" } | ConvertTo-Json -Depth 5 -Compress
  $resp = Invoke-RestMethod -Uri "$base/git/blobs" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
  return $resp.sha
}

# NOTE: this list, the binary/delete lists below, and the commit
# message + changelog entries at the bottom all get hand-edited each
# deploy for whatever actually changed that session -- this is a
# template state after the 2026-09-16 ribbon/GI1-MCQ deploy already
# shipped (via deploy_rollout.py). Fill in real values before running.
$files = @(
  "widget\v3.js",
  "widget\v3.css",
  "index.html"
)

# Binary files (uploaded as base64 blobs via New-BinaryBlob, not New-Blob).
$binaryFiles = @()

# Hubs coming off the live site this deploy (kept on disk locally, per Sam --
# just delisted, never delete the local copy). Every file under each of
# these directories gets a tree-delete entry below rather than a hand-typed
# list, so it can never miss a file the next time a hub is delisted.
$deleteDirs = @("hubs\genetics", "hubs\fixed-pros", "hubs\gi-exam1")

Write-Host "Fetching current ref for $branch..."
$ref = Invoke-RestMethod -Uri "$base/git/ref/heads/$branch" -Headers $headers
$baseCommitSha = $ref.object.sha
$commit = Invoke-RestMethod -Uri "$base/git/commits/$baseCommitSha" -Headers $headers
$baseTreeSha = $commit.tree.sha

Write-Host "Uploading text blobs..."
$treeEntries = @()
foreach ($f in $files) {
  $full = Join-Path $root $f
  $sha = New-Blob $full
  $gitPath = $f -replace '\\', '/'
  $treeEntries += @{ path = $gitPath; mode = "100644"; type = "blob"; sha = $sha }
  Write-Host "  blob: $gitPath -> $sha"
}

Write-Host "Uploading binary blobs..."
foreach ($f in $binaryFiles) {
  $full = Join-Path $root $f
  if (-not (Test-Path $full)) { Write-Host "  skip (not found): $f"; continue }
  $sha = New-BinaryBlob $full
  $gitPath = $f -replace '\\', '/'
  $treeEntries += @{ path = $gitPath; mode = "100644"; type = "blob"; sha = $sha }
  Write-Host "  binary blob: $gitPath -> $sha"
}

Write-Host "Checking live tree for delisted-hub paths still present..."
$liveTreeUrl = "$base/git/trees/${baseTreeSha}?recursive=1"
$liveTree = Invoke-RestMethod -Uri $liveTreeUrl -Headers $headers
if ($liveTree.truncated) {
  Write-Host "ERROR: live tree listing was truncated -- refusing to compute deletes from a partial listing"
  exit 1
}
$livePaths = @{}
foreach ($e in $liveTree.tree) { if ($e.type -eq "blob") { $livePaths[$e.path] = $true } }
$anyDeletes = $false
foreach ($d in $deleteDirs) {
  $prefix = ($d -replace '\\', '/').TrimEnd('/') + "/"
  $matches = $livePaths.Keys | Where-Object { $_.StartsWith($prefix) } | Sort-Object
  if (-not $matches -or $matches.Count -eq 0) {
    Write-Host "  $d`: already absent from the live tree, nothing to delete"
    continue
  }
  foreach ($rel in $matches) {
    $treeEntries += @{ path = $rel; mode = "100644"; type = "blob"; sha = $null }
    Write-Host "  delete: $rel"
    $anyDeletes = $true
  }
}
if (-not $anyDeletes) { Write-Host "  (no delete entries needed this run)" }

$treeBody = @{ base_tree = $baseTreeSha; tree = $treeEntries } | ConvertTo-Json -Depth 6 -Compress
$newTree = Invoke-RestMethod -Uri "$base/git/trees" -Method Post -Headers $headers -Body $treeBody -ContentType "application/json; charset=utf-8"

$commitMessage = "Describe this deploy's changes here"
$commitBody = @{ message = $commitMessage; tree = $newTree.sha; parents = @($baseCommitSha) } | ConvertTo-Json -Depth 5 -Compress
$newCommit = Invoke-RestMethod -Uri "$base/git/commits" -Method Post -Headers $headers -Body $commitBody -ContentType "application/json; charset=utf-8"

Write-Host "Updating $branch to $($newCommit.sha)..."
$patchBody = @{ sha = $newCommit.sha; force = $false } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "$base/git/refs/heads/$branch" -Method Patch -Headers $headers -Body $patchBody -ContentType "application/json; charset=utf-8" | Out-Null

Write-Host "Pushed commit $($newCommit.sha) to $branch."

$sbUrl = "https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/rpc/log_changelog"
$sbHeaders = @{ apikey = "sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS"; "Content-Type" = "application/json" }
$changelogEntries = @(
  # (hub, message) pairs -- only NEW changes since the last deploy.
  # Check the live Supabase changelog table first so you never re-log
  # something already shipped (see study-hub-deploy skill).
)
foreach ($entry in $changelogEntries) {
  $sbBody = @{ p_secret = "093025"; p_hub = $entry.hub; p_message = $entry.message } | ConvertTo-Json -Compress
  try {
    Invoke-RestMethod -Uri $sbUrl -Method Post -Headers $sbHeaders -Body $sbBody | Out-Null
    Write-Host "Changelog logged: $($entry.hub) - $($entry.message)"
  } catch {
    Write-Host "Changelog logging skipped (non-fatal): $_"
  }
}

Write-Host "Done. Live in a minute or two at https://smcmurry6-source.github.io/study-hubs/"
