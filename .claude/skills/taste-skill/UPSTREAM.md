# Upstream

Vendored from https://github.com/Leonxlnx/taste-skill (MIT, see `LICENSE`), plugin version 2.1.5, at commit
`12af471f627f866411b4bd785b19646d3672784c` (2026-10-25), so cloud sessions have the skill without installing it.
Its install name (the `name:` in `SKILL.md`) is `design-taste-frontend`.

Kept: everything in upstream's `skills/taste-skill/` (`SKILL.md`, `README.md`, `references/`, `scripts/`, `library/`,
`assets/`, `evals/`), plus the repo's `LICENSE` and `CHANGELOG.md`. Left out: the repo's own README, wordmarks,
sponsor logos and example screenshots (`assets/`, `examples/`), the plugin manifests (`.claude-plugin/`,
`.codex-plugin/`, `.agents/`), `install.sh` (it symlinks into `~/.claude/skills`), CI and `tests/`.
Nothing was edited.

Upstream's `SKILL.md` mentions `library/scenes.json` and `assets/scenes/demo/`, which aren't in this commit;
`draw.mjs` checks for the file and deals no scroll scenes without it.

Running it here:
- The scripts need Node 22+ (the container has it) and write their working files to `.taste-skill/` in the folder
  they're run from (gitignored at the repo root). `draw.mjs` also keeps a history in `~/.taste-skill/history.json`
  (`TASTE_SKILL_HISTORY` moves it).
- `assets.mjs` searches Openverse, Wikimedia Commons, the Art Institute of Chicago, the Met, the Internet Archive and
  NASA; the environment's network policy has to allow those hosts.
- `inspect.mjs` / `scenes.mjs` launch Chrome (`CHROME_PATH`, else the usual install paths). As root, Chromium needs
  `--no-sandbox`: point `CHROME_PATH` at a wrapper around `/opt/pw-browsers/chromium`, as for anima.

Its house rules (no monospace outside code, no eyebrow labels, no gradients, no index numbering, no thin rules, two
typefaces at most) are upstream's taste, not this repo's: the hubs use monospace accents, L1/L2 lecture labels and
gradients today. Treat them as advice for new pages, not as a reason to restyle a live hub without Sam's say-so.

To update: `git clone https://github.com/Leonxlnx/taste-skill`, read the new `SKILL.md` and diff the scripts, then copy
`skills/taste-skill/*`, `LICENSE` and `CHANGELOG.md` over these and bump the commit above.
