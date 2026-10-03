# Boards hub (INBDE + ADEX): decisions so far

Living record of what Sam decided while this hub is being planned and built. Newest last.

## 2026-10-03

- **Exams**: INBDE (and ADEX) roughly **August 2028**; Sam is "not 100%" sure. Sam's class is in D2 now (fall 2026).
  Show dates as approximate ("~Aug 2028") and never let the dashboard auto-archive the hub on a guessed date (the
  dashboard archives at 10 pm on the last date in `exams`). Sam updates the real dates later.
- **Content**: Sam has no question material. We write original questions and notes to the official INBDE and ADEX
  outlines, fact-checked against public sources (CDC, FDA, ADA, AHA, AAP, AAE, AAOMS, AAPD...). Never copy
  prep-company banks, released exam items or textbook text; this repo is public.
- **Hub** = notes + question bank + one deep game.
- **Website access**: the cloud environment now has full network access (Sam changed it 2026-10-03).
- **Art and audio**: no paid ElevenLabs plan, so no AI-generated art or audio. The game's art is drawn in code
  (canvas / SVG / WebGL), optionally with verified CC0 packs and OFL fonts; sound is synthesized with WebAudio plus
  CC0 sound packs. Radiographs and clinical photos are never AI-made: accurate diagrams or openly licensed real images
  with attribution.
- **Build method**: Sam approved multi-agent workflows for the boards hub ("use workflows").

## What the ~22-month timeline changes

- A long-lived hub, not a one-week cram hub like perio and MSK. Design for steady use over two years.
- Spaced review needs long intervals (e.g. 1/3/7/14/30/60/120 days); the widget's 1/2/4/7-day gaps were tuned for
  hubs that go live a week before an exam. Make it a per-hub option, not a change for every hub.
- Staged releases: v1 is a solid core (some units complete plus the game's first slice); units are added over months,
  lined up where possible with the courses the class is taking.
- Every item records the outline version it was written against (INBDE Domain of Dentistry; ADEX manual year); a
  yearly re-check catches outline changes.
- The game needs long-term progression (months to years) and seasons or events, not just a single run.
- A countdown to a date two years out isn't motivating; prefer readiness per unit.
