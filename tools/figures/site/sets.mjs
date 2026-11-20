/* The seasonal sets and the rank sets of Timmy's place and shop (Sam, 2026-11-10; vault/tasks/2026-11-10-redesign-timmys-place-round-3.md).
   One list, three readers: the art (tools/figures/site/packs/<season>.mjs draws exactly these pieces, with these ids), the
   catalog (migration_v54.sql's shop_items has exactly these rows; the collections' rows are migration_v65.sql's) and the
   build (build.mjs checks both against this file).

   A season's full set: 1 home and 1 scene (both Legendary), and a Rare, an Epic and a Legendary outfit and yard thing.
   Limited time: on sale only in its window (sh_shop_seasons in migration_v54.sql; the short holidays for the 7 days ending
   on their last day), and now and then on a throwback day. Halloween's set is everyone's from the start (gift: true).
   A rank set: an outfit and a yard thing for each full rank-up, earned by rank and never sold (price 0).

   Never sugar (Timmy is a tooth), never an outfit Timmy already wears for free on that holiday (OUTFITS in widget/pet.js). */

const R = "rare", E = "epic", L = "legendary";
function set(home, scene, outfits, yard){
  return [
    { id: home[0], n: home[1], kind: "home", rarity: L, price: home[2] },
    { id: scene[0], n: scene[1], kind: "scene", rarity: L, price: scene[2] },
    ...outfits.map((o, i) => ({ id: o[0], n: o[1], kind: "outfit", rarity: [R, E, L][i], price: o[2] })),
    ...yard.map((o, i) => ({ id: o[0], n: o[1], kind: "yard", rarity: [R, E, L][i], price: o[2] }))
  ];
}

/* when: for people; the dates are worked out by sh_shop_seasons(day) on the server */
export const SEASONS = [
  { k: "halloween", n: "Halloween", when: "October", gift: true, items: set(
    ["haunted-manor", "Haunted manor", 6500], ["pumpkin-patch", "Pumpkin patch at dusk", 5000],
    [["floss-mummy", "Floss mummy", 800], ["bedsheet-ghost", "Bedsheet ghost", 1800], ["skeleton-suit", "Skeleton suit", 4500]],
    [["pumpkin-lantern", "Pumpkin lanterns", 700], ["bubbling-cauldron", "Bubbling cauldron", 1800], ["haunted-tree", "Haunted tree", 4200]]) },
  { k: "thanksgiving", n: "Thanksgiving", when: "November 1 to the day after Thanksgiving", items: set(
    ["harvest-barn", "Harvest barn", 6000], ["harvest-fields", "Harvest fields", 5000],
    [["scarecrow-hat", "Scarecrow hat", 700], ["football-helmet", "Football helmet", 1800], ["parade-marshal", "Parade grand marshal", 4500]],
    [["hay-bales", "Hay bales", 700], ["harvest-table", "Harvest table", 2000], ["turkey-balloon", "Turkey parade balloon", 4500]]) },
  { k: "winter", n: "Winter holidays", when: "After Thanksgiving to December 26", items: set(
    ["log-cabin", "Snowy log cabin", 6500], ["aurora-lake", "Frozen lake under the northern lights", 5500],
    [["ugly-sweater", "Holiday sweater", 700], ["elf-suit", "Elf suit", 1800], ["nutcracker", "Nutcracker uniform", 4800]],
    [["snow-globe", "Snow globe", 800], ["ice-rink", "Ice rink", 2200], ["holiday-tree", "Decorated tree", 4500]]) },
  { k: "newyear", n: "New Year", when: "December 27 to January 2", items: set(
    ["clock-tower", "Clock tower", 7000], ["midnight-rooftops", "Midnight rooftops", 5500],
    [["sparkle-bow-tie", "Sparkly bow tie", 700], ["tuxedo", "Tuxedo", 2000], ["father-time", "Father Time", 4500]],
    [["confetti-cannon", "Confetti cannon", 800], ["countdown-clock", "Countdown clock", 2000], ["ball-drop", "Midnight ball drop", 4500]]) },
  { k: "mardigras", n: "Mardi Gras", when: "The week through Fat Tuesday", items: set(
    ["french-quarter", "French Quarter townhouse", 7000], ["parade-street", "Parade street", 5000],
    [["bead-necklaces", "Parade beads", 700], ["jester", "Jester", 1800], ["carnival-king", "Carnival king", 4500]],
    [["bead-tree", "Bead tree", 700], ["jazz-stand", "Jazz stand", 1800], ["parade-float", "Parade float", 4500]]) },
  { k: "valentine", n: "Valentine's Day", when: "February 8 to 14", items: set(
    ["heart-cottage", "Heart cottage", 6000], ["rose-garden", "Rose garden", 5000],
    [["mail-cap", "Love-letter mail cap", 700], ["knight-of-hearts", "Knight of hearts", 1800], ["masquerade", "Masquerade mask and cape", 4500]],
    [["heart-balloon", "Heart balloons", 700], ["swing-for-two", "Swing for two", 1800], ["swan-pond", "Swan pond", 4500]]) },
  { k: "toothfairy", n: "Tooth Fairy week", when: "February 22 to 28", items: set(
    ["pillow-palace", "Pillow palace", 7000], ["fairy-glen", "Moonlit fairy glen", 5500],
    [["fairy-wand", "Wand and tiara", 800], ["fairy-wings", "Fairy wings", 2000], ["tooth-fairy", "The Tooth Fairy", 5000]],
    [["coin-pile", "Pile of shiny coins", 800], ["tooth-pillow", "Tooth pillow", 1800], ["fairy-ring", "Fairy ring", 4500]]) },
  { k: "dentist", n: "Dentist's Day", when: "February 28 to March 6", items: set(
    ["dental-office", "Dental office", 7000], ["main-street", "Main Street", 5000],
    [["gold-mirror", "Golden mouth mirror", 900], ["surgical-scrubs", "Surgical scrubs and mask", 1800], ["dr-timmy", "Dr. Timmy's long white coat", 4500]],
    [["dental-chair", "Dental chair", 900], ["operatory-light", "Operatory light and tray", 1800], ["molar-monument", "Molar monument", 4500]]) },
  { k: "stpatrick", n: "St. Patrick's Day", when: "March 11 to 17", items: set(
    ["thatched-cottage", "Thatched cottage", 6000], ["emerald-hills", "Emerald hills", 5000],
    [["flat-cap", "Tweed flat cap", 700], ["bagpiper", "Bagpiper", 1800], ["gold-buckle-suit", "Gold-buckle suit", 4500]],
    [["clover-patch", "Clover patch", 700], ["wishing-well", "Wishing well", 1800], ["pot-of-gold", "Pot of gold", 4500]]) },
  { k: "easter", n: "Easter", when: "The week of Easter", items: set(
    ["egg-house", "Painted egg house", 6000], ["tulip-meadow", "Tulip meadow", 5000],
    [["easter-bonnet", "Easter bonnet", 700], ["egg-painter", "Egg painter's smock", 1800], ["bunny-suit", "Bunny suit", 4500]],
    [["egg-basket", "Giant egg basket", 700], ["carrot-patch", "Carrot patch", 1800], ["chick-coop", "Chick coop", 4200]]) },
  { k: "spring", n: "Spring", when: "March 20 to May 31", items: set(
    ["flowerpot-house", "Flowerpot house", 6000], ["cherry-blossoms", "Cherry blossom grove", 5000],
    [["rain-slicker", "Raincoat and boots", 700], ["beekeeper", "Beekeeper", 1800], ["butterfly-wings", "Butterfly wings", 4500]],
    [["birdbath", "Birdbath", 700], ["beehives", "Beehives", 1800], ["greenhouse", "Glass greenhouse", 4500]]) },
  { k: "july4", n: "Fourth of July", when: "June 28 to July 4", items: set(
    ["a-frame-cabin", "A-frame cabin", 6000], ["fairgrounds", "Fairgrounds", 5000],
    [["stars-top-hat", "Stars-and-stripes top hat", 700], ["drum-major", "Drum major", 1800], ["lady-liberty", "Lady Liberty", 4500]],
    [["picnic-blanket", "Picnic blanket", 700], ["fireworks-launcher", "Fireworks launcher", 1800], ["ferris-wheel", "Little Ferris wheel", 4500]]) },
  { k: "summer", n: "Summer", when: "June 1 to September 21", items: set(
    ["camper-van", "Camper van", 6500], ["summer-lake", "Summer lake", 5000],
    [["snorkel", "Snorkel and flippers", 700], ["lifeguard", "Lifeguard", 1800], ["deep-sea-diver", "Deep-sea diver", 4500]],
    [["lawn-sprinkler", "Lawn sprinkler", 700], ["barbecue-grill", "Barbecue grill", 1800], ["water-slide", "Water slide", 4500]]) },
  { k: "fall", n: "Fall", when: "September 22 to November 30", items: set(
    ["acorn-house", "Acorn house", 6000], ["autumn-woods", "Autumn woods", 5000],
    [["flannel", "Flannel and scarf", 700], ["fox-hood", "Fox hood", 1800], ["tweed-professor", "Tweed professor", 4500]],
    [["leaf-pile", "Leaf pile", 700], ["cider-stand", "Apple cider stand", 1800], ["apple-tree", "Apple tree with a swing", 4200]]) }
];

/* The rank sets (Sam: "timmy outfit and a decoration only. Do rank only"): one per full rank-up, in the rank's material.
   gtier is the server's global tier (sh_rank: 1 Antique ... 6 Dark Matter of the Handpiece; 7-13 the ModuPro; 14-20 the
   Loupes). All twenty are drawn (the later two journeys' fourteen on 2026-11-20, migration_v91). */
export const RANKS = [
  { gtier: 1, rank: "Antique", outfit: ["rank-antique-outfit", "Brass monocle and bowler", R], yard: ["rank-antique-yard", "Treadle dental engine", R] },
  { gtier: 2, rank: "Bronze", outfit: ["rank-bronze-outfit", "Bronze gladiator helmet", R], yard: ["rank-bronze-yard", "Bronze bell", R] },
  { gtier: 3, rank: "Silver", outfit: ["rank-silver-outfit", "Silver knight's helm", E], yard: ["rank-silver-yard", "Silver trophy cup", E] },
  { gtier: 4, rank: "Gold", outfit: ["rank-gold-outfit", "Golden laurels and toga", E], yard: ["rank-gold-yard", "Golden tooth statue", E] },
  { gtier: 5, rank: "Diamond", outfit: ["rank-diamond-outfit", "Diamond shades and ice cape", L], yard: ["rank-diamond-yard", "Diamond geode", L] },
  { gtier: 6, rank: "Dark Matter", outfit: ["rank-dark-outfit", "Dark Matter cloak", L], yard: ["rank-dark-yard", "Dark Matter orb", L] },
  /* the ModuPro (gtier 7-13: Stone to Dark Matter again): the sim lab, a dental material or tool in each rank's material */
  { gtier: 7, rank: "ModuPro Stone", outfit: ["rank-modu-stone-outfit", "Sculptor's beret and smock", E], yard: ["rank-modu-stone-yard", "Half-carved stone molar", E] },
  { gtier: 8, rank: "ModuPro Antique", outfit: ["rank-modu-antique-outfit", "Lab visor and brass-buttoned coat", E], yard: ["rank-modu-antique-yard", "Brass articulator", E] },
  { gtier: 9, rank: "ModuPro Bronze", outfit: ["rank-modu-bronze-outfit", "Foundry cap and casting tongs", E], yard: ["rank-modu-bronze-yard", "Bronze casting machine", E] },
  { gtier: 10, rank: "ModuPro Silver", outfit: ["rank-modu-silver-outfit", "Head mirror and scrub cap", E], yard: ["rank-modu-silver-yard", "Silver instrument tray", E] },
  { gtier: 11, rank: "ModuPro Gold", outfit: ["rank-modu-gold-outfit", "Gold crown and velvet cape", L], yard: ["rank-modu-gold-yard", "Golden dental chair", L] },
  { gtier: 12, rank: "ModuPro Diamond", outfit: ["rank-modu-diamond-outfit", "Crystal face shield and bur bandolier", L], yard: ["rank-modu-diamond-yard", "Giant diamond bur", L] },
  { gtier: 13, rank: "ModuPro Dark Matter", outfit: ["rank-modu-dark-outfit", "Nebula cape and ringed planet", L], yard: ["rank-modu-dark-yard", "Nebula in a bell jar", L] },
  /* the Loupes (gtier 14-20): light and sight. Timmy wears his loupes, so these outfits keep off his face */
  { gtier: 14, rank: "Loupes Stone", outfit: ["rank-loupes-stone-outfit", "Explorer's pith helmet", L], yard: ["rank-loupes-stone-yard", "Stone sundial", L] },
  { gtier: 15, rank: "Loupes Antique", outfit: ["rank-loupes-antique-outfit", "Navigator's tricorn and spyglass", L], yard: ["rank-loupes-antique-yard", "Brass telescope", L] },
  { gtier: 16, rank: "Loupes Bronze", outfit: ["rank-loupes-bronze-outfit", "Lamplighter's cap and lantern", L], yard: ["rank-loupes-bronze-yard", "Bronze armillary sphere", L] },
  { gtier: 17, rank: "Loupes Silver", outfit: ["rank-loupes-silver-outfit", "Bobble hat and binoculars", L], yard: ["rank-loupes-silver-yard", "Silver microscope", L] },
  { gtier: 18, rank: "Loupes Gold", outfit: ["rank-loupes-gold-outfit", "Sun crown and golden sash", L], yard: ["rank-loupes-gold-yard", "Golden lighthouse", L] },
  { gtier: 19, rank: "Loupes Diamond", outfit: ["rank-loupes-diamond-outfit", "Prism cape", L], yard: ["rank-loupes-diamond-yard", "Crystal prism", L] },
  { gtier: 20, rank: "Loupes Dark Matter", outfit: ["rank-loupes-dark-outfit", "Constellation robe and crescent moon", L], yard: ["rank-loupes-dark-yard", "Dark Matter observatory", L] }
];

/* The year-round collections (Sam, 2026-11-18: "Lets work on timmy outfits and place cosmetics. Go crazy"): eight pieces
   that belong together, like a season's set, but never limited: they join the everyday rotation (the daily and weekly
   picks, season null in the catalog), so the rarer ones turn up less often. A home (Legendary), a scene (Epic), outfits
   from Common to Rare and yard pieces from Uncommon to Epic. Drawn in packs/<k>.mjs, fetched only when a place shows one
   (widget/hub-art/place/<k>.js), so the kit every page loads stays the size it was. */
const C_ = "common", U = "uncommon";
function collection(home, scene, outfits, yard){
  return [
    { id: home[0], n: home[1], kind: "home", rarity: L, price: home[2] },
    { id: scene[0], n: scene[1], kind: "scene", rarity: E, price: scene[2] },
    ...outfits.map((o, i) => ({ id: o[0], n: o[1], kind: "outfit", rarity: [C_, U, R][i], price: o[2] })),
    ...yard.map((o, i) => ({ id: o[0], n: o[1], kind: "yard", rarity: [U, R, E][i], price: o[2] }))
  ];
}
export const COLLECTIONS = [
  { k: "dino", n: "Dino valley", note: "Giant ferns, a volcano smoking far off, and fossils with all their teeth", items: collection(
    ["stone-den", "Stone-age den", 6000], ["volcano-valley", "Volcano valley", 2400],
    [["field-hat", "Fossil hunter's hat", 150], ["fossil-vest", "Dig-site vest and brush", 350], ["stego-hood", "Stegosaurus hood", 900]],
    [["dino-nest", "Dino egg nest", 400], ["fossil-dig", "Fossil dig", 900], ["trex-skeleton", "T. rex skeleton", 2200]]) },
  { k: "moonbase", n: "Moon base", note: "Craters, a dome with an airlock, and the Earth hanging in a black sky", items: collection(
    ["moon-dome", "Moon base dome", 6500], ["lunar-plains", "Lunar plains", 2600],
    [["antenna-headband", "Antenna headband", 150], ["space-visor", "Space visor", 400], ["jetpack", "Jetpack", 1000]],
    [["moon-rover", "Moon rover", 450], ["satellite-dish", "Satellite dish", 1000], ["rocket", "Rocket on its pad", 2400]]) },
  { k: "reef", n: "Coral reef", note: "The bottom of a sunlit sea: kelp, coral, fish and a house in a shell", items: collection(
    ["conch-house", "Conch shell house", 6000], ["sunlit-reef", "Sunlit reef", 2600],
    [["starfish-clip", "Starfish clip", 120], ["octopus-hat", "Octopus hat", 400], ["mer-tail", "Mer-tail", 950]],
    [["coral-garden", "Coral garden", 350], ["giant-clam", "Giant clam", 900], ["sunken-chest", "Sunken treasure chest", 2000]]) },
  { k: "desert", n: "Desert ranch", note: "Red rock mesas, cactus, a windmill and the widest sky there is", items: collection(
    ["adobe-ranch", "Adobe ranch house", 5500], ["red-rocks", "Red rock desert", 2200],
    [["bandana", "Bandana", 120], ["cowboy-hat", "Cowboy hat", 350], ["sheriff-vest", "Sheriff's vest and star", 800]],
    [["cactus-garden", "Cactus garden", 300], ["windmill-pump", "Windmill", 800], ["covered-wagon", "Covered wagon", 1900]]) },
  { k: "arcade", n: "Retro arcade", note: "Pixel hills, a neon tooth over the door and a high score to beat", items: collection(
    ["arcade-hall", "Arcade hall", 6500], ["pixel-hills", "Pixel hills", 2400],
    [["gamer-headset", "Gamer headset", 180], ["pixel-shades", "Pixel shades", 300], ["high-score-jacket", "High-score jacket", 850]],
    [["arcade-cabinet", "Arcade cabinet", 450], ["pinball", "Pinball machine", 1000], ["claw-machine", "Giant claw machine", 2200]]) },
  { k: "rockshow", n: "Rock show", note: "A record shop, a festival field and a stage with the lights up", items: collection(
    ["record-shop", "Record shop", 6000], ["festival-field", "Festival field", 2400],
    [["band-tee", "Band tee", 120], ["leather-jacket", "Leather jacket", 450], ["electric-guitar", "Electric guitar", 1000]],
    [["amp-stack", "Amp stack", 400], ["drum-kit", "Drum kit", 1000], ["tour-stage", "Little stage and lights", 2400]]) }
];

/* The rare costumes (Sam, 2026-11-12: five at the release; "Go crazy", 2026-11-18: five more). Drawn in place.mjs's
   OUTFITS (costume: true, three lines each), on sale only to someone who has spotted one (record_costume_sighting).
   widget/hub-timmy.js, widget/dash.js and widget/shop.js name the same ten in the same order (tools/release/xp.js checks). */
export const COSTUMES = [
  ["pirate", "Pirate", E, 2000], ["astronaut", "Astronaut", E, 2500], ["detective", "Detective", E, 1800], ["chef", "Chef", E, 1500],
  ["captain-enamel", "Captain Enamel", L, 4000],
  ["wizard", "Wizard", E, 2000], ["robot", "Robot", E, 2200], ["firefighter", "Firefighter", E, 1600], ["shark", "Shark", E, 2400],
  ["dragon", "Dragon", L, 4500]
];

export function allCollectionItems(){
  const out = [];
  for (const c of COLLECTIONS) for (const it of c.items) out.push({ ...it, collection: c.k });
  return out;
}

export function allSetItems(){
  const out = [];
  for (const s of SEASONS) for (const it of s.items) out.push({ ...it, season: s.k, gift: !!s.gift });
  for (const r of RANKS) {
    out.push({ id: r.outfit[0], n: r.outfit[1], kind: "outfit", rarity: r.outfit[2], price: 0, rank: r.gtier });
    out.push({ id: r.yard[0], n: r.yard[1], kind: "yard", rarity: r.yard[2], price: 0, rank: r.gtier });
  }
  return out;
}
