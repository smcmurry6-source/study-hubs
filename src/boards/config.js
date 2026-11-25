// Boards hub build configuration (BUILD_SPEC 2.1, docs/boards/ENGINE_PLAN.md section 4). Read by tools/build-boards.js,
// which writes hubs/boards/content/ from it and the units; nothing here runs in the browser. The page's own settings
// (its wording, the answered event) are in hubs/boards/index.html.
'use strict';

module.exports = {
  HUB: 'boards',                                   // core.json's hub, RPC p_hub, the widget's data-hub (BUILD_SPEC 1.1)
  TITLE: 'Boards Hub',                             // core.json's title
  EXAM_NOTE: 'INBDE + ADEX ~Aug 2028',             // core.json's examNote; the exams have no dates until Sam gives real ones
  STATE_KEY: 'boards-state-v1',                    // core.json's stateKey (and SH_HUB's)

  // Units in teaching order. A listed unit is a lecture on the hub: a 'preview' one shows as coming (its title only),
  // a 'taught' one has its notes, and its items and cases once verification has set `checked`. Release 1: pharm, medcx,
  // perio. The engine draws Home and Notes only with a lecture, so pharm and medcx are listed while still 'preview'.
  UNITS: ['pharm', 'medcx'],

  // The INBDE's three components, which group the units in Notes, the bank's panel and Home's progress (core.json's
  // groups). A unit goes under the component of its home CCs (BUILD_SPEC 3.1: D&TP CC1-15, OHM CC16-38, P&P CC39-56).
  // anat, physio, micro and gpath have no home CC (foundation knowledge): which component they go under is decided
  // before the first of them is published (the build fails on a published unit in no group).
  GROUPS: [
    { id: 'dtp', code: 'D&TP', title: 'Diagnosis and Treatment Planning', units: ['opath', 'rad', 'medcx'] },
    { id: 'ohm', code: 'OHM', title: 'Oral Health Management', units: ['perio', 'endo', 'oper', 'pros', 'ortho', 'peds', 'oms', 'anes', 'pharm'] },
    { id: 'pp', code: 'P&P', title: 'Practice and Profession', units: ['infect', 'prof', 'pubh'] },
  ],

  ENABLED_TYPES: ['mcq'],                          // ADEX-only formats (dlmulti, rx, spot) stay off until their release

  // Spaced review (BUILD_SPEC 1.5) and the daily plan's budget: not written yet. T-12 puts them in core.json (srs, plan)
  // for widget/plan.js and widget/v3.js. Budget: 12 items a day, at most 4 new, new items only while the projected
  // 7-day due load stays under 0.8 x budget per day; retirement after 3 right at the 120-day step.
  SRS: { steps: [1, 3, 7, 14, 30, 60, 120], examCap: false, v: 'boards-1', fuzz: 0.1, server: true },
  BUDGET: { daily: 12, newPerDay: 4, governor: 0.8, retireStep: 120, retireStreak: 3, retiredSamplePerMonth: 4 },

  // Exam blocks (BUILD_SPEC 1.2): seconds per item, written as core.json's mock.blocks (T-14 builds the presets).
  MOCK: { standaloneSec: 63, caseSec: 95 },

  // Size limits: the build fails over these.
  SIZE_LIMIT: 3.5 * 1000 * 1000,                   // hubs/boards/content/*.json together, raw bytes
  GAME_GZIP_LIMIT: { 'chairside-core': 110 * 1000 }, // gzipped bytes per game bundle
};
