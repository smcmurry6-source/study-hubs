# Hub content extractor

`extract.mjs` is the bridge from the four single-file hubs to the shared hub engine. Before the one-time migration it
evaluates the data-building portion of a page in a small Node VM, so factory-created question objects are written in
their final runtime shape without starting a hub, touching the DOM, or making a network request. It evaluates the
shared question factories only to derive those final plain objects.

Run it after changing one of the current source pages:

```sh
node tools/hub-content/extract.mjs
node tools/hub-content/extract.mjs --hub occlusion --check
node tools/hub-content/extract.mjs --migrate
```

It writes compact JSON to `hubs/<hub>/content/` for Occlusion, Heme & Endo Exam 2, PCD Implants Exam 1, and Special
Patient Care. `manifest.json` names the files. The important split is:

- `core.json`: lectures, exam/course information, small bank settings and the compact `{id, lec, src}` question index
  used by Home before the full bank is fetched.
- `questions.json`: final, normalized question objects, including whys created by question helpers.
- `whys.json`: the older per-question `QUESTION_WHY` map.
- `notes.json`, `review.json`, `study.json`, and `cases.json`: the corresponding named content.
- `figures.json`: only JSON-safe static figure data and placements.

The manifest explicitly lists figure values that remain code (`ANIMA`, and Occlusion's `OD` kit). Their functions cannot
be safely represented as JSON; the existing figure builds own them until the engine change writes per-figure modules.
`manifest.json` may later list `figureAssets` for their lazy script/style modules. Every JSON data file has a generated
`.js` companion used only when a student opens a local `file://` copy: Chromium blocks `fetch()` for local JSON, but
external scripts still load. GitHub Pages uses the JSON files.

`--migrate` replaces the four target hubs' authored static blocks with lexical placeholders and loader hooks. Use it
only while a hub is still pre-migration. After that, `--check` validates the manifest/schema, compact index, question
ids, whys, and generated local-file companions without trying to evaluate absent inline data. It fails when any
generated file is missing or stale.
