# Reddit scout log

One entry per `/reddit-scout` run, newest first (`.claude/skills/reddit-scout/SKILL.md`). Each entry lists what the run
suggested, what Sam decided, and every post it judged, with its link: `scout.py` marks any post linked here as already
judged, and drops posts published before the newest date heading, so the next run starts where this one stopped.
An unfixed security finding is never described here (the repo is public): "a security finding, reported to Sam in chat"
until its fix ships, then the details and the PR.

Entry format:

```
## yyyy-mm-dd (<window>: <n> posts, <k> read closely)
Suggested
- <name>: <one line> (<post link>). Sam: <build / task / skip / pending>
Worth knowing
- ...
Passed
- <post or group>: <why> (<link>, <link>)
```

## 2026-11-04 (month: 728 posts, 13 read closely)

The first run, over the past month of r/ClaudeAI, r/ClaudeCode, r/Anthropic and r/claude.

Suggested
- Supabase: `admin_reset_changelog` let a NULL secret through. It checked `p_secret <> '...'`, and a comparison with
  NULL is NULL, so the check was skipped and anyone with the publishable key could empty the site changelog and write
  their own entries (<https://www.reddit.com/r/ClaudeAI/comments/1x95eyf/fixed_a_clients_lovable_app_so_many_security/>,
  on RLS and admin checks in vibe-coded Supabase apps; the Supabase security advisor and read-only SQL confirmed it).
  Sam (2026-11-04): fix it now. Fixed the same day: `migration_v48.sql` checks it with `sh_admin_ok()`, like every other
  admin function, applied to the live database and checked (a NULL secret fails); shipped in
  [#227](https://github.com/smcmurry6-source/study-hubs/pull/227). No other admin function had the pattern.
- "Find this in the notes" after a missed question: the widget jumps to the notes paragraph that best matches the
  question, through the `SH_EXPORT` sections and `SH_GOTO` every hub already has
  (<https://www.reddit.com/r/ClaudeCode/comments/1wzy1a6/i_built_a_jarvisstyle_study_console_for_my_notes/>). Sam
  (2026-11-04): build it now. Shipped as a widget feature (see `DEPLOY_NOTES.md`, 2026-11-04)
- A CI check that narration matches the notes (a text hash per lecture and level beside the mp3s, checked by
  `tools/ci/smoke.js`), so "text and audio never drift" is enforced rather than remembered
  (<https://www.reddit.com/r/ClaudeAI/comments/1xlujwl/claude_codes_docs_say_claudemd_is_context_not/>). Sam
  (2026-11-04): skip; don't suggest it again

Worth knowing
- `disable-model-invocation: true` in a skill's frontmatter keeps it to `/name` only (checked in the Claude Code skills
  docs); this skill uses it. Not added to `/lessons-audit`, whose description asks to run it before a new hub is built
  (<https://www.reddit.com/r/ClaudeAI/comments/1xj49xc/how_to_stop_claude_code_loading_a_skill/>).

Passed
- Anti-slop UI skills and reskin kits: the taste skill already covers this (since 2026-11-04)
  (<https://www.reddit.com/r/ClaudeAI/comments/1xihh3t/i_tested_the_hallmark_antiaislop_skill_in_claude/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1xm5lz3/what_toolsplugins_do_you_use_with_claude_code_to/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1x22sap/i_built_20_free_opensource_html_pages_you_can_use/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1xbvrfa/is_there_a_claude_code_skill_for_redesigning_an/>)
- A shared markdown memory folder, Obsidian with Claude: the repo is already the vault
  (<https://www.reddit.com/r/ClaudeAI/comments/1xn1527/i_gave_all_my_claude_code_sessions_one_shared/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1xmjhtd/how_to_start_obsidian_claudeai/>)
- Secret keys shipped to the browser: the hubs ship only the publishable key, by design; a grep found no secret key
  (<https://www.reddit.com/r/ClaudeAI/comments/1xhmtya/i_used_claude_code_to_audit_21k_product_hunt/>)
- Security scanners as an MCP server: the advisor and a grep did the job here; nothing to install
  (<https://www.reddit.com/r/ClaudeCode/comments/1xbdqtm/made_claude_code_check_its_own_code_for_security/>)
- Read a skill's scripts before installing it: anima and the taste skill are already vendored with their upstream
  commit (`UPSTREAM.md`), the practice the thread recommends
  (<https://www.reddit.com/r/ClaudeAI/comments/1xb2eyh/before_you_install_a_claude_skill_open_its/>)
- A persona that tries the app as a new user: the real click and reach data the lessons audit reads is the better
  signal for this class
  (<https://www.reddit.com/r/ClaudeAI/comments/1x5eblc/i_made_claude_sign_up_for_my_app_as_a_brandnew/>)
- Study prompts (explain each wrong choice, interview me, teach it back): each choice's why is already a rule; the rest
  needs a live tutor, not a static hub
  (<https://www.reddit.com/r/ClaudeAI/comments/1x80li5/how_are_you_guys_using_chatgpt_or_claude_to_study/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1xetfk1/how_do_you_use_claude_to_maximize_learning_as_a/>)
- CLAUDE.md lines and rule syntax tricks: the rules that matter most are CI checks already
  (<https://www.reddit.com/r/ClaudeCode/comments/1xeautc/whats_the_one_line_in_your_claudemd_that_made_the/>,
  <https://www.reddit.com/r/ClaudeAI/comments/1x3afay/why_claude_code_ignores_your_clauderules/>)
- Fewer subagents, slimmer skills and context: `CLAUDE.md` loads about 52 KB (about 13k tokens) since the 2026-11-03
  trim; nothing to cut
  (<https://www.reddit.com/r/ClaudeAI/comments/1xdwquj/anthropics_new_guide_oct_22_argues_most_agents/>,
  <https://www.reddit.com/r/claude/comments/1xmu1vb/optimizing_tokens_by_optimizing_skills_agents/>)
- Explore subagent on Haiku: a cost setting, not a hub change
  (<https://www.reddit.com/r/ClaudeCode/comments/1x0kzbh/haiku_55_is_40x_cheaper_than_opus_55_your_explore/>)
- Video review skill: for video explainers; the hubs have none
  (<https://www.reddit.com/r/ClaudeCode/comments/1xnaruh/video_review_skill_v2/>)
- Browser games built with Claude, with automated level checks: the arcade already runs on the real bank and the smoke
  test clicks through it (<https://www.reddit.com/r/ClaudeAI/comments/1xdamgn/i_built_a_browser_game_with_claude_code_then_used/>)
- The rest (about 700 posts): usage limits, outages, pricing, model rumors and benchmarks, news, memes, and apps or
  games with nothing to carry over.
