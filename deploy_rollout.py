"""
Deploy study-hubs to GitHub Pages via the GitHub Git Data API.

Companion to deploy_rollout.ps1 (same job, plain-Python instead of
PowerShell). Prefer THIS script when running from the device-bridge's own
shell (mcp__remote-devices__device_bash) -- that shell is a Linux VM, so
PowerShell usually isn't available there anyway, and this sidesteps every
PowerShell-specific gotcha (Get-Content/ConvertTo-Json string corruption,
etc.) documented in the study-hub-deploy skill.

MUST run from the device bridge, never a cloud-sandbox Bash tool -- the
cloud sandbox's calls to api.github.com are refused outright with a
session-scoped 403. Reads GH_PAT (required) and, if you want changelog
entries logged, SB_KEY and ADMIN_SECRET, from the environment -- never
hardcode the token in this file. All three currently live in Sam's local
"Perma token" Claude Project doc / ops scripts; read them fresh each
session rather than trusting a value cached from earlier in a long
conversation.

Before each deploy, edit the CONFIG block below for what's actually
changing this run -- file lists, delete list, commit message, changelog
entries -- the same way deploy_rollout.ps1 gets hand-edited each session.
Leave DELETE_DIRS populated even for hubs that were already removed in an
earlier deploy this same day/week: the script checks the LIVE tree before
adding delete entries, so a path that's already gone is silently skipped
rather than causing GitRPC::BadObjectState (that check is what a previous
version of deploy_rollout.ps1 was missing -- it walked the local OneDrive
folder instead of the live tree, so a hub already deleted in an earlier
session's deploy would get a redundant delete entry for a path GitHub no
longer had, which is exactly what triggered that error on 2026-09-16).

Usage: run from the repo root (the directory containing this file), e.g.
  GH_PAT='github_pat_...' SB_KEY='sb_publishable_...' ADMIN_SECRET='...' \\
    python3 deploy_rollout.py
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error

OWNER = "smcmurry6-source"
REPO = "study-hubs"
BRANCH = "main"
ROOT = os.path.dirname(os.path.abspath(__file__))
API = f"https://api.github.com/repos/{OWNER}/{REPO}"

TOKEN = os.environ.get("GH_PAT")
if not TOKEN:
    sys.exit("ERROR: set GH_PAT in the environment first")

# ============================== CONFIG ==================================
# Edit every field below for what THIS deploy actually changes, then run.

FILES = [
    # text files, relative to repo root, forward slashes
]

BINARY_FILES = [
    # audio/images, etc -- uploaded as base64 same as text, just listed
    # separately for clarity
]

DELETE_DIRS = [
    "hubs/genetics",
    "hubs/fixed-pros",
    "hubs/gi-exam1",
]

COMMIT_MESSAGE = "Describe this deploy's changes here"

CHANGELOG_ENTRIES = [
    # (hub, message) tuples -- only NEW changes since the last deploy.
    # Check the live changelog table first (see study-hub-deploy skill /
    # DEPLOY_NOTES.md) so you never re-log something already shipped.
]
# ============================ END CONFIG =================================


def api_request(path, method="GET", body=None):
    url = path if path.startswith("http") else f"{API}{path}"
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    if data is not None:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} on {method} {url}\n{err_body}", file=sys.stderr)
        raise


def create_blob_b64(local_path):
    with open(local_path, "rb") as f:
        raw = f.read()
    content = base64.b64encode(raw).decode("ascii")
    resp = api_request("/git/blobs", "POST", {"content": content, "encoding": "base64"})
    return resp["sha"], len(raw)


def main():
    print(f"Fetching current ref for {BRANCH}...")
    ref = api_request(f"/git/ref/heads/{BRANCH}")
    base_commit_sha = ref["object"]["sha"]
    commit = api_request(f"/git/commits/{base_commit_sha}")
    base_tree_sha = commit["tree"]["sha"]
    print(f"  base commit: {base_commit_sha}  base tree: {base_tree_sha}")

    tree_entries = []

    if FILES:
        print("Uploading text blobs (base64)...")
        for f in FILES:
            full = os.path.join(ROOT, f)
            sha, size = create_blob_b64(full)
            tree_entries.append({"path": f, "mode": "100644", "type": "blob", "sha": sha})
            print(f"  blob: {f} -> {sha} ({size} bytes)")

    if BINARY_FILES:
        print("Uploading binary blobs...")
        for f in BINARY_FILES:
            full = os.path.join(ROOT, f)
            if not os.path.exists(full):
                print(f"  skip (not found): {f}")
                continue
            sha, size = create_blob_b64(full)
            tree_entries.append({"path": f, "mode": "100644", "type": "blob", "sha": sha})
            print(f"  binary blob: {f} -> {sha} ({size} bytes)")

    if DELETE_DIRS:
        print("Checking live tree for delisted-hub paths still present...")
        live_tree = api_request(f"/git/trees/{base_tree_sha}?recursive=1")
        if live_tree.get("truncated"):
            sys.exit("ERROR: live tree listing was truncated -- refusing to compute deletes from a partial listing")
        live_paths = {e["path"] for e in live_tree["tree"] if e["type"] == "blob"}
        any_deletes = False
        for d in DELETE_DIRS:
            prefix = d.rstrip("/") + "/"
            matches = sorted(p for p in live_paths if p.startswith(prefix))
            if not matches:
                print(f"  {d}: already absent from the live tree, nothing to delete")
                continue
            for rel in matches:
                tree_entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": None})
                print(f"  delete: {rel}")
                any_deletes = True
        if not any_deletes:
            print("  (no delete entries needed this run)")

    if not tree_entries:
        sys.exit("Nothing to do -- FILES, BINARY_FILES, and DELETE_DIRS all produced zero tree entries. Edit the CONFIG block.")

    print(f"Creating tree with {len(tree_entries)} entries...")
    new_tree = api_request("/git/trees", "POST", {"base_tree": base_tree_sha, "tree": tree_entries})
    print(f"  new tree: {new_tree['sha']}")

    print("Creating commit...")
    new_commit = api_request("/git/commits", "POST", {
        "message": COMMIT_MESSAGE,
        "tree": new_tree["sha"],
        "parents": [base_commit_sha],
    })
    print(f"  new commit: {new_commit['sha']}")

    print(f"Updating {BRANCH} to {new_commit['sha']}...")
    api_request(f"/git/refs/heads/{BRANCH}", "PATCH", {"sha": new_commit["sha"], "force": False})
    print(f"Pushed commit {new_commit['sha']} to {BRANCH}.")

    if CHANGELOG_ENTRIES:
        print("Logging changelog entries...")
        sb_key = os.environ.get("SB_KEY", "")
        admin_secret = os.environ.get("ADMIN_SECRET", "")
        if not sb_key or not admin_secret:
            print("  SKIPPED: set SB_KEY and ADMIN_SECRET in the environment to log changelog entries")
        else:
            sb_url = "https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/rpc/log_changelog"
            for hub, message in CHANGELOG_ENTRIES:
                body = json.dumps({"p_secret": admin_secret, "p_hub": hub, "p_message": message}).encode("utf-8")
                req = urllib.request.Request(sb_url, data=body, method="POST")
                req.add_header("apikey", sb_key)
                req.add_header("Content-Type", "application/json")
                try:
                    with urllib.request.urlopen(req) as resp:
                        resp.read()
                    print(f"  changelog logged: {hub} - {message[:60]}")
                except Exception as e:
                    print(f"  changelog logging skipped (non-fatal): {e}")

    print("Done. Live in a minute or two at https://smcmurry6-source.github.io/study-hubs/")


if __name__ == "__main__":
    main()
