# Boards hub: what the next session does (handoff, 2026-10-11)

Start here. Branch `claude/boards-hub`, draft PR #70. Read, in order: `DECISIONS.md`, `PLAN_V2.md` (approved), then
only the parts of `BUILD_SPEC.md` and `research/*.md` the current step needs (grep headings; never read big files
whole). Nothing on the live site has changed yet.

## Interim mode: Claude only

Sam will set up Codex and opencode later. Until then Claude does every role in `PLAN_V2.md`, keeping its principles:

- **Be frugal.** This account hit its weekly limit during planning. One drop per session; short, fresh sessions; no
  multi-agent research sweeps; batch shell commands; effort `high` for judgment, `medium` for routine edits.
- **Keep checking independent.** The writer never checks its own questions in the same context:
  - If `OPENROUTER_API_KEY` is set in the environment, run the scripted adversarial checker on a non-Anthropic model
    (Qwen or another family on OpenRouter; pick by the benchmark).
  - Otherwise use a separate Claude subagent with the adversarial prompt from `PLAN_V2.md` item 4 as the interim
    checker (weaker on independence; say so in the PR).
- **Code checks first:** never spend model tokens on what a script can prove.
- When Codex/opencode arrive, switch drafting and building to them per `PLAN_V2.md` "Who does what".

## Session 1: groundwork and the benchmark

1. **Trim `DEPLOY_NOTES.md`** (about 17k tokens loaded into every session and agent). Move "Recent major changes"
   entries older than about two weeks into a new `DEPLOY_HISTORY.md`, keep the rules sections and recent entries, and
   leave a one-line pointer. Make sure CLAUDE.md's `@DEPLOY_NOTES.md` import still makes sense.
2. **`AGENTS.md`** at the repo root: a short rules file for Codex/opencode (American English; no secrets; never push
   `main`; PRs into `claude/boards-hub`; run `node tools/ci/syntax.js`; the About-page rule; text/audio drift rule;
   point to `docs/boards/PLAN_V2.md`). Cheap now, needed later.
3. **Fact records** for the release-1 units (medcx, pharm, perio): convert `research/facts-medical.md` and the
   finished sections of `research/facts-dental.md` into structured records (`PLAN_V2.md` item 2), e.g.
   `src/boards/facts/<unit>.json`; fill gaps from primary sources; mark risk tier per fact.
4. **Scripts:** `tools/boards/check-quotes.mjs` (fetch each source, confirm the quote is there) and
   `tools/boards/lint-items.mjs` (the checks in `PLAN_V2.md` item 9, on top of the repo's existing CI lint).
5. **Benchmark** (`PLAN_V2.md` item 8): 20 deliberately hard items in INBDE style from the fact records, seeded-error
   copies made by a script, the checker run on clean + seeded items. Report to Sam: catch rate, false alarms, first-pass
   acceptance, defects found, tokens/dollars. Go/no-go before scaling.

Commit doc-only checkpoints with `[skip ci]`; let CI run on code changes.

## Session 2 onward: release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
