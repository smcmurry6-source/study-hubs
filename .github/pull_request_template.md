## What changed

<!-- In plain, student-facing words (American English). Which hubs, which pages. -->

## Tier

<!-- 0 notes, 1 small content, 2 substantial, 3 high risk (RELEASE_TEST_PLAN.md, section 1). Tiers 0 and 1 can skip the
     rest down to "Checks run". -->

## Preview

Preview: <!-- only when Sam asked for one (the `preview` label): the link from this PR's preview comment, on its own
     line. Otherwise write "none, not asked for" (vault/rules/preview-and-release-test.md). -->

<!-- What Sam was shown (screenshots, a recording, the cloud session's live preview) and, with a preview, how to open it
     (the PR's link, a cloud session, or the Preview run's preview-site artifact) and the Preview button's status at the
     end: "No request has reached production". -->

## Checks run

<!-- What you ran and what passed: the "Check hubs" checks, `node tools/release/run.js` (paste its summary), anything
     blocked and why. -->

## UAT

<!-- The vault/release/uat-checklist.md sections you used, devices and browsers, test accounts, what you saw. -->

## Bugs

<!-- Bug-log rows added, fixed or accepted (vault/release/bug-log.md). Never describe an unfixed security hole here. -->

## Not covered or unsure

## Release

- [ ] Sam approved this release <!-- tiers 2 and 3: only Sam ticks this -->
- [ ] After merge: `node tools/release/postcheck.js` passed
- [ ] Vault written back (task note, decisions, hub note), `DEPLOY_NOTES.md`, About page if students can see it
