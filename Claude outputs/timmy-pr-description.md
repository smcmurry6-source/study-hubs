## What students will see

**Mastery medals.** Reaching Bronze / Silver / Gold / Crown mastery in a hub now puts a little medal (or a crown) next to your name on every leaderboard: the dashboard's rank, streak and arcade boards, both hub arcades, and Tooth Fairy collectors. A new medal gets its own pop-up.

**Five new easter eggs** (all off with Settings → Surprises, never during a mock exam):
- **mirror**: type it and the hub flips left-to-right, like the maxillary arch in a mouth mirror.
- **Full Arch**: a little dental chart in the corner; each right answer grows a tooth, each miss knocks one out. Fill all 32 once per hub; after that it's gone for good in that hub.
- **Floss Chain**: three people typing *floss* in the same hub within a minute get a row of dancing teeth with their names, linked by floss.
- **Cavity Search**: once a week a tiny cavity hides in one paragraph of each hub's Lecture Notes. The first five people to tap it fill it.
- **Holidays**: Halloween, Thanksgiving, winter break, New Year, Valentine's, Dentist's Day, St. Patrick's and Easter each bring themed confetti, a costumed Plaque Boss ("Count Plaqula") and a magic word.

Magic words also work typed into the hub's Search box (that's the phone path). 7 new secret trophies with clues.

**Timmy Tooth**, an optional cartoon tooth buddy (Settings → Timmy Tooth: Everywhere / Dashboard only / Off):
- Before you meet him he sits on your name on the dashboard. Tap him for the introduction.
- Afterwards he lives in his own house card on the dashboard and in the bottom-left corner of every hub. He hides during mock exams.
- Right answers and study streaks keep him healthy. Skipped days bring plaque, then stains and gingivitis, then caries, periodontitis and fractures. He can't die, but at 0 HP healing is half speed until he's back to 50.
- He tells dental jokes, cheers streaks, reacts to wrong answers, modes and eggs, and gives exam-day pep talks.
- His house earns upgrades from your rank (fence, mailbox, lamppost, gold trim, diamond windows, a night sky), a pennant per mastered hub, and a roof crown. It also decorates for each holiday.

## Under the hood
- `migration_v31.sql`, **already applied** via the connector. It is backward compatible (adds a `flair` column to the leaderboards) plus `claim_cavity`, `get_cavity_week`, `get_pet_days` and new `record_achievement` kinds. `supabase/schema.sql` is refreshed.
- New `widget/pet.js`. Changes in `widget/eggs.js`, `widget/ranks.js`, `widget/v3.js`/`v3.css` and `index.html`, plus a one-line flair hook in each hub's arcade board.
- `node tools/ci/syntax.js` and `node tools/ci/smoke.js` pass locally. Clicked through in the browser on desktop and phone, with database writes stubbed out while testing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
