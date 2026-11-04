# Upstream

Vendored from https://github.com/Leonxlnx/taste-skill (MIT, see `LICENSE`), plugin version 2.1.5, at commit
`12af471f627f866411b4bd785b19646d3672784c` (2026-10-25), so cloud sessions have the skill without installing it.
Its install name (the `name:` in `SKILL.md`) is `design-taste-frontend`.

Kept: everything in upstream's `skills/taste-skill/` (`SKILL.md`, `README.md`, `references/`, `scripts/`, `library/`,
`assets/`, `evals/`), plus the repo's `LICENSE` and `CHANGELOG.md`. Left out: the repo's own README, wordmarks,
sponsor logos and example screenshots (`assets/`, `examples/`), the plugin manifests (`.claude-plugin/`,
`.codex-plugin/`, `.agents/`), `install.sh` (it symlinks into `~/.claude/skills`), CI and `tests/`.
One local edit: the box at the top of `SKILL.md` (Sam's call, 2026-11-04): when Sam asks for a redesign, the skill is
used in full, its house rules included; the vault's content and feature rules still hold. Keep it when updating.

Upstream's `SKILL.md` mentions `library/scenes.json` and `assets/scenes/demo/`, which aren't in this commit;
`draw.mjs` checks for the file and deals no scroll scenes without it.

Running it here:
- The scripts need Node 22+ (the container has it) and write their working files to `.taste-skill/` in the folder
  they're run from (gitignored at the repo root). `draw.mjs` also keeps a history in `~/.taste-skill/history.json`
  (`TASTE_SKILL_HISTORY` moves it).
- `assets.mjs` searches Openverse, Wikimedia Commons, the Art Institute of Chicago, the Met, the Internet Archive and
  NASA; the environment's network policy has to allow those hosts.
- `inspect.mjs` / `scenes.mjs` launch Chrome (`CHROME_PATH`, else the usual install paths). As root, Chromium needs
  `--no-sandbox`, which they can't pass themselves: run them with `CHROME_PATH=tools/chrome-no-sandbox.sh` (a wrapper
  around `/opt/pw-browsers/chromium`; `CHROME_BIN` overrides it).

Its house rules (no monospace outside code, no eyebrow labels, no gradients, no index numbering, no thin rules, two
typefaces at most) differ from the hubs' current look (monospace accents, L1/L2 lecture labels, gradients). In a
redesign Sam asks for, the skill's rules win; without one, sessions don't restyle a live page on their own.

To update: `git clone https://github.com/Leonxlnx/taste-skill`, read the new `SKILL.md` and diff the scripts, then copy
`skills/taste-skill/*`, `LICENSE` and `CHANGELOG.md` over these, put the local box back at the top of `SKILL.md`, and
bump the commit above.
