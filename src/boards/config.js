// Boards hub build configuration (BUILD_SPEC 2.1). Read by tools/build-boards.js; nothing here runs in the browser
// except what the build copies into the page (HUB, SRS, BUDGET, MODES, EXAM_NOTE).
'use strict';

module.exports = {
  HUB: 'boards',                                   // data-hub, RPC p_hub, HUB_LABEL key (BUILD_SPEC 1.1)
  TITLE: 'Boards Hub',                             // <title> and the header
  SUBTITLE: 'INBDE + ADEX',
  DESCRIPTION: 'Boards Hub for the INBDE and ADEX: notes, a board-style question bank, timed exam blocks and Chairside, a clinic game built on the same questions. Grows unit by unit.',
  EXAM_NOTE: 'INBDE + ADEX ~Aug 2028',             // display only; exams stay [] until Sam gives real dates
  STATE_KEY: 'boards-state-v1',

  // Units in teaching order. A unit is published only when it is listed here, its unit.js says status:'taught',
  // and (for items and cases) verification has set `checked`. Release 1: medcx, pharm, perio.
  UNITS: [],

  ENABLED_TYPES: ['mcq'],                          // ADEX-only formats (dlmulti, rx, spot) stay off until their release

  // Spaced review (BUILD_SPEC 1.5): copied to window.SH_SRS at the top of the hub script. Data only here;
  // the widget reads it once int-widget lands.
  SRS: { steps: [1, 3, 7, 14, 30, 60, 120], examCap: false, v: 'boards-1', fuzz: 0.1, server: true },

  // Daily plan budget (BUILD_SPEC 1.5): 12 items a day, at most 4 new from Today's plan, new items only while the
  // projected 7-day due load stays under 0.8 x budget per day; retirement after 3 right at the 120-day step.
  BUDGET: { daily: 12, newPerDay: 4, governor: 0.8, retireStep: 120, retireStreak: 3, retiredSamplePerMonth: 4 },

  // Exam blocks (BUILD_SPEC 1.2): seconds per item.
  MOCK: { standaloneSec: 63, caseSec: 95 },

  // Modes in tab order (BUILD_SPEC 1.2). `subs` are the sub-views behind each panel's .subtabs buttons.
  MODES: [
    { id: 'home',   label: 'Today',       icon: 'today',  subs: [['today', 'Today'], ['readiness', 'Readiness']] },
    { id: 'notes',  label: 'Notes',       icon: 'notes',  subs: [['core', 'Core'], ['deep', 'Deep dive']] },
    { id: 'bank',   label: 'Questions',   icon: 'bank',   subs: [['practice', 'Practice'], ['cases', 'Cases'], ['missed', 'Missed']] },
    { id: 'mock',   label: 'Exam blocks', icon: 'clock',  subs: [['setup', 'Set up a block'], ['review', 'Past blocks']] },
    { id: 'arcade', label: 'Clinic',      icon: 'clinic', subs: [] },
  ],

  // Size limits (BUILD_SPEC 2.2 step 7): the build fails over these.
  SIZE_LIMIT: 3.5 * 1000 * 1000,                   // hubs/boards/index.html, raw bytes
  GAME_GZIP_LIMIT: { 'chairside-core': 110 * 1000 }, // gzipped bytes per game bundle
};
