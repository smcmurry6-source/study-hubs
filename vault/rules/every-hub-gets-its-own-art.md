---
type: rule
tags: [art, hubs, redesign]
since: 2026-11-06
---

# Every new hub gets its own drawn art

Sam's rule, 2026-11-06 (approving the redesign's phase 0 art): **whenever a new hub is created, its emblem, masthead
scene, mastery medals and the rest of its art are drawn for that hub**, as part of building it. A new hub never ships with
another hub's art, a recolored copy of it or the generic placeholder.

- **What each new hub gets**, drawn by the agent in SVG in Timmy's ink style (nothing generated from a prompt, no emoji, no
  icon library; [decisions](../decisions.md), 2026-11-05):
  - **an emblem** of the course's own object (64 box; it sits on the hub's tab, the dashboard and its medals);
  - **a masthead scene** at the top of its Home (600 x 200, its own backdrop, drawn from what the course teaches);
  - **its own mastery medal set**, Bronze, Silver, Gold and Crown: a design unique to that hub, not the shared medal with
    its tint swapped in. The metal still says the level, so a student can read any hub's medals the same way;
  - **its tint** (one hue the live hubs don't use) and any other art the hub shows, such as its arcade skin
    ([arcade-skins](arcade-skins.md)) and lobby thumbnails.
- **Where it goes:** `tools/figures/site/` (`emblems.mjs`, `mastheads.mjs`, `medals.mjs`, the tint in `style.mjs`), then
  `node tools/figures/site/build.mjs`. Until the redesign reaches the hubs, the art shows on the design preview page
  (`tools/preview/design/`, its Hub picker).
- **Sam looks before it ships**, with the rest of the new hub in its preview
  ([preview-and-release-test](preview-and-release-test.md)): screenshots of the emblem, scene and medals in light and dark.
- **The live hubs' art stays as approved on 2026-11-06:** the five live hubs (Occlusion, Perio, PCD Implants, Heme &
  Endo 2, Special Patient Care) keep their emblems, scenes and the shared medal design. The generic "A new hub" set is a
  placeholder for the preview page only.
- Draw from the course's own material: what an emblem or scene shows is something the course teaches, drawn accurately
  ([figures-teach-the-lecture](figures-teach-the-lecture.md)).

How: [build-a-hub](../how-to/build-a-hub.md) (its "Its own drawn art" step).

Related: [arcade-skins](arcade-skins.md) · [build-a-hub](../how-to/build-a-hub.md) ·
[the redesign phase 0 task](../tasks/2026-11-05-redesign-phase-0-design-system.md) · [decisions](../decisions.md)
