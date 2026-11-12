---
type: how-to
tags: [redesign, agents, cost]
---

# Run a redesign session (and keep it cheap)

Sam asked on 2026-11-11 how to make the rest of the redesign use fewer tokens. Most of the cost is what each turn carries
(the loaded notes, the session's history, big files, screenshots) and rework after a look round, not the code itself.
Do the redesign's remaining phases this way. What's left and in what order: [the release note](../tasks/2026-11-06-redesign-release.md)
and the phase notes it links.

1. **One phase (or one part) per session, started fresh.** Don't run two phases in one long session: every turn re-reads
   the whole history. Group by the files a piece shares: Perio's port alone; Heme & Endo Exam 2's alone; phase 4 parts B and
   C with the bowling egg (they share Timmy's place's renderer); part A alone; Learn and Flashcards alone; phase 5 part 2 alone.
2. **Hand off in the task note, not the chat.** Before a session ends, its task note's Log says what's built, what's left
   and the next step, so the next session reads that note and the notes it links and starts. No re-exploring.
3. **Decisions before code.** Put the open calls to Sam in one list and get them answered first (the first list:
   [the open calls](../tasks/done/2026-11-11-redesign-open-calls.md), all answered and made, 2026-11-11). Show new art as
   contact sheets (`tools/figures/site/pack-preview.mjs`, the design page) and get Sam's yes before it goes into the engine:
   a round that changes something already built costs a rebuild, the tests and new screenshots.
4. **Never read a big file whole.** `widget/hub.js`, `widget/v3.js`, a hub's `index.html` and `DEPLOY_NOTES.md` are tens of
   thousands of tokens each: grep for the function, read its lines. The engine is four files since 2026-11-12 (the first
   step of [phase 4](../tasks/2026-11-05-redesign-phase-4-game-layer.md)): work in the part your session changes
   (`widget/hub-bank.js`, the question card and the bank; `widget/hub-rewards.js`, the answer path, XP, rank and recap;
   `widget/hub-timmy.js`, Timmy) and leave the core, `widget/hub.js`, alone unless the change is its own. How the four
   share names is at the top and the end of `hub.js`.
5. **Test what you touched while building; everything once at the end.** `node tools/release/xp.js` (and `rls.js`) only when
   SQL changed; `node tools/ci/smoke.js` already checks only the touched hubs; `node tools/release/run.js` once before the PR,
   and let CI's "Release tests" do the rest ([long-tests-once](../rules/long-tests-once.md)). Screenshots only the agent looks at: `deviceScaleFactor: 1`, as few as answer
   the question (images cost far more than text). Screenshots for Sam stay at 2.
6. **Match the model to the work.** The engine, Perio's port, the SQL and the art need the strongest model. Copying
   content into a new hub's `content/`, vault write-backs and rerunning checks don't: a lighter model or effort does them.
   Sam's choice for the sessions left before the release is under "Which model" in
   [phase 4](../tasks/2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release".
7. **No fan-out.** Parallel subagents and workflows multiply the tokens. Two independent ports are two sessions, not one
   session with agents.
8. **Migrations wait for their release.** A file in `supabase/pending-migrations.txt` is never applied before the release
   its note names, even when asked to "apply the sql": ask which one (2026-11-10, `migration_v54`, undone).

Related: [the release](../tasks/2026-11-06-redesign-release.md) · [the open calls](../tasks/done/2026-11-11-redesign-open-calls.md) ·
[ship-a-change](ship-a-change.md) · [verify-before-pushing](verify-before-pushing.md) · [tasks](../tasks/README.md)
