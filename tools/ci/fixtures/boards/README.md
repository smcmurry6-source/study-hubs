# Boards build fixtures (never published)

`units/` re-exports the benchmark items in `docs/boards/bench/items.js`, one unit folder per home unit, with
`status: 'taught'` and fixture notes for perio, so the build's item, case and notes pipeline can be exercised
without putting benchmark items into `hubs/boards/`. Build it to a scratch file, never over the real hub:

```bash
node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out /tmp/boards-fixture/index.html
node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out /tmp/boards-fixture/index.html --include-drafts
```

The clean build publishes only the items with `checked` set and leaves out case `c-perio-0001` (not yet checked)
with its four items; `--include-drafts` publishes all of them.
