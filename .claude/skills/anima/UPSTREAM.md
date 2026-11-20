# Upstream

Vendored from https://github.com/Garinmckayl/anima (MIT, see `LICENSE`) at commit
`1bc2a244186986e836e8bf85899a23e0e0f9291d`, so cloud sessions have the skill without installing it.

Kept: `SKILL.md`, `references/`, `kit/`, `scripts/` and each example's `build.mjs`. Left out: the demo videos and
thumbnails (`assets/`), the project's own landing page, CI and community files, `scripts/make-demo.mjs`, and the
built example pages (`node examples/<name>/build.mjs` writes them; they're gitignored).

Local change: the "In study-hubs, the house rules come first" box at the top of `SKILL.md`, which points at the
repo's diagram rules (they override the skill: no figure without Sam's approval). Put it back after an update.

To update: `npx skills add Garinmckayl/anima -g -a claude-code`, read the new `SKILL.md` and diff the code, then copy
the same files over these and bump the commit above.
