---
type: rule
tags: [diagrams]
---

# Building a hub = diagram review, approved by Sam one by one

Every time a hub is built, or gains new lectures, the session building it (hub Projects included) goes through every
lecture for places where a drawn diagram would teach better than text: a structure, a mechanism, where a drug acts,
a sequence that happens in space, two structures side by side. Draw these from the hub's own notes and check them
against the questions it tests. **Then ask Sam to approve each candidate separately before drawing any of them.**
For each candidate, give:

- what it shows, and any interaction (a toggle, a slider, stepping through a sequence, hover labels);
- why it helps, with the question ids it supports;
- where it goes: under a lecture's notes, in Review, or as a diagram question;
- its size and rough build time.

Only approved figures are built; note the skipped ones in the PR so the next session doesn't propose them again.
Claude Code sessions build approved figures with the anima skill ([diagrams-anima](diagrams-anima.md)).
Accuracy is the bar: perio's Atlas diagrams were removed for being inaccurate (2026-09-25).

What Sam already approved or skipped, per hub: [decisions](../decisions.md) and the hub notes in `vault/hubs/` (listed in [home](../home.md)).
