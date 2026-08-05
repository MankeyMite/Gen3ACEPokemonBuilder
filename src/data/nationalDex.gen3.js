// National Pokédex mapping: [nationalDexNumber, "SpeciesName"]
// Used to resolve sprite filenames (Sprites/NNNN.png) from species names.
// Gen 3 internal IDs diverge from National Dex order starting at Treecko (#252).
export const NATIONAL_DEX = [
  [1, "Bulbasaur"],
  [2, "Ivysaur"],
  [3, "Venusaur"],
  [4, "Charmander"],
  [5, "Charmeleon"],
  [6, "Charizard"],
  [7, "Squirtle"],
  [8, "Wartortle"],
  [9, "Blastoise"],
  [10, "Caterpie"],
  [11, "Metapod"],
  [12, "Butterfree"],
  [13, "Weedle"],
  [14, "Kakuna"],
  [15, "Beedrill"],
  [16, "Pidgey"],
  [17, "Pidgeotto"],
  [18, "Pidgeot"],
  [19, "Rattata"],
  [20, "Raticate"],
  [21, "Spearow"],
  [22, "Fearow"],
  [23, "Ekans"],
  [24, "Arbok"],
  [25, "Pikachu"],
  [26, "Raichu"],
  [27, "Sandshrew"],
  [28, "Sandslash"],
  [29, "Nidoran♀"],
  [30, "Nidorina"],
  [31, "Nidoqueen"],
  [32, "Nidoran♂"],
  [33, "Nidorino"],
  [34, "Nidoking"],
  [35, "Clefairy"],
  [36, "Clefable"],
  [37, "Vulpix"],
  [38, "Ninetales"],
  [39, "Jigglypuff"],
  [40, "Wigglytuff"],
  [41, "Zubat"],
  [42, "Golbat"],
  [43, "Oddish"],
  [44, "Gloom"],
  [45, "Vileplume"],
  [46, "Paras"],
  [47, "Parasect"],
  [48, "Venonat"],
  [49, "Venomoth"],
  [50, "Diglett"],
  [51, "Dugtrio"],
  [52, "Meowth"],
  [53, "Persian"],
  [54, "Psyduck"],
  [55, "Golduck"],
  [56, "Mankey"],
  [57, "Primeape"],
  [58, "Growlithe"],
  [59, "Arcanine"],
  [60, "Poliwag"],
  [61, "Poliwhirl"],
  [62, "Poliwrath"],
  [63, "Abra"],
  [64, "Kadabra"],
  [65, "Alakazam"],
  [66, "Machop"],
  [67, "Machoke"],
  [68, "Machamp"],
  [69, "Bellsprout"],
  [70, "Weepinbell"],
  [71, "Victreebel"],
  [72, "Tentacool"],
  [73, "Tentacruel"],
  [74, "Geodude"],
  [75, "Graveler"],
  [76, "Golem"],
  [77, "Ponyta"],
  [78, "Rapidash"],
  [79, "Slowpoke"],
  [80, "Slowbro"],
  [81, "Magnemite"],
  [82, "Magneton"],
  [83, "Farfetch'd"],
  [84, "Doduo"],
  [85, "Dodrio"],
  [86, "Seel"],
  [87, "Dewgong"],
  [88, "Grimer"],
  [89, "Muk"],
  [90, "Shellder"],
  [91, "Cloyster"],
  [92, "Gastly"],
  [93, "Haunter"],
  [94, "Gengar"],
  [95, "Onix"],
  [96, "Drowzee"],
  [97, "Hypno"],
  [98, "Krabby"],
  [99, "Kingler"],
  [100, "Voltorb"],
  [101, "Electrode"],
  [102, "Exeggcute"],
  [103, "Exeggutor"],
  [104, "Cubone"],
  [105, "Marowak"],
  [106, "Hitmonlee"],
  [107, "Hitmonchan"],
  [108, "Lickitung"],
  [109, "Koffing"],
  [110, "Weezing"],
  [111, "Rhyhorn"],
  [112, "Rhydon"],
  [113, "Chansey"],
  [114, "Tangela"],
  [115, "Kangaskhan"],
  [116, "Horsea"],
  [117, "Seadra"],
  [118, "Goldeen"],
  [119, "Seaking"],
  [120, "Staryu"],
  [121, "Starmie"],
  [122, "Mr. Mime"],
  [123, "Scyther"],
  [124, "Jynx"],
  [125, "Electabuzz"],
  [126, "Magmar"],
  [127, "Pinsir"],
  [128, "Tauros"],
  [129, "Magikarp"],
  [130, "Gyarados"],
  [131, "Lapras"],
  [132, "Ditto"],
  [133, "Eevee"],
  [134, "Vaporeon"],
  [135, "Jolteon"],
  [136, "Flareon"],
  [137, "Porygon"],
  [138, "Omanyte"],
  [139, "Omastar"],
  [140, "Kabuto"],
  [141, "Kabutops"],
  [142, "Aerodactyl"],
  [143, "Snorlax"],
  [144, "Articuno"],
  [145, "Zapdos"],
  [146, "Moltres"],
  [147, "Dratini"],
  [148, "Dragonair"],
  [149, "Dragonite"],
  [150, "Mewtwo"],
  [151, "Mew"],
  [152, "Chikorita"],
  [153, "Bayleef"],
  [154, "Meganium"],
  [155, "Cyndaquil"],
  [156, "Quilava"],
  [157, "Typhlosion"],
  [158, "Totodile"],
  [159, "Croconaw"],
  [160, "Feraligatr"],
  [161, "Sentret"],
  [162, "Furret"],
  [163, "Hoothoot"],
  [164, "Noctowl"],
  [165, "Ledyba"],
  [166, "Ledian"],
  [167, "Spinarak"],
  [168, "Ariados"],
  [169, "Crobat"],
  [170, "Chinchou"],
  [171, "Lanturn"],
  [172, "Pichu"],
  [173, "Cleffa"],
  [174, "Igglybuff"],
  [175, "Togepi"],
  [176, "Togetic"],
  [177, "Natu"],
  [178, "Xatu"],
  [179, "Mareep"],
  [180, "Flaaffy"],
  [181, "Ampharos"],
  [182, "Bellossom"],
  [183, "Marill"],
  [184, "Azumarill"],
  [185, "Sudowoodo"],
  [186, "Politoed"],
  [187, "Hoppip"],
  [188, "Skiploom"],
  [189, "Jumpluff"],
  [190, "Aipom"],
  [191, "Sunkern"],
  [192, "Sunflora"],
  [193, "Yanma"],
  [194, "Wooper"],
  [195, "Quagsire"],
  [196, "Espeon"],
  [197, "Umbreon"],
  [198, "Murkrow"],
  [199, "Slowking"],
  [200, "Misdreavus"],
  [201, "Unown"],
  [202, "Wobbuffet"],
  [203, "Girafarig"],
  [204, "Pineco"],
  [205, "Forretress"],
  [206, "Dunsparce"],
  [207, "Gligar"],
  [208, "Steelix"],
  [209, "Snubbull"],
  [210, "Granbull"],
  [211, "Qwilfish"],
  [212, "Scizor"],
  [213, "Shuckle"],
  [214, "Heracross"],
  [215, "Sneasel"],
  [216, "Teddiursa"],
  [217, "Ursaring"],
  [218, "Slugma"],
  [219, "Magcargo"],
  [220, "Swinub"],
  [221, "Piloswine"],
  [222, "Corsola"],
  [223, "Remoraid"],
  [224, "Octillery"],
  [225, "Delibird"],
  [226, "Mantine"],
  [227, "Skarmory"],
  [228, "Houndour"],
  [229, "Houndoom"],
  [230, "Kingdra"],
  [231, "Phanpy"],
  [232, "Donphan"],
  [233, "Porygon2"],
  [234, "Stantler"],
  [235, "Smeargle"],
  [236, "Tyrogue"],
  [237, "Hitmontop"],
  [238, "Smoochum"],
  [239, "Elekid"],
  [240, "Magby"],
  [241, "Miltank"],
  [242, "Blissey"],
  [243, "Raikou"],
  [244, "Entei"],
  [245, "Suicune"],
  [246, "Larvitar"],
  [247, "Pupitar"],
  [248, "Tyranitar"],
  [249, "Lugia"],
  [250, "Ho-Oh"],
  [251, "Celebi"],
  [252, "Treecko"],
  [253, "Grovyle"],
  [254, "Sceptile"],
  [255, "Torchic"],
  [256, "Combusken"],
  [257, "Blaziken"],
  [258, "Mudkip"],
  [259, "Marshtomp"],
  [260, "Swampert"],
  [261, "Poochyena"],
  [262, "Mightyena"],
  [263, "Zigzagoon"],
  [264, "Linoone"],
  [265, "Wurmple"],
  [266, "Silcoon"],
  [267, "Beautifly"],
  [268, "Cascoon"],
  [269, "Dustox"],
  [270, "Lotad"],
  [271, "Lombre"],
  [272, "Ludicolo"],
  [273, "Seedot"],
  [274, "Nuzleaf"],
  [275, "Shiftry"],
  [276, "Taillow"],
  [277, "Swellow"],
  [278, "Wingull"],
  [279, "Pelipper"],
  [280, "Ralts"],
  [281, "Kirlia"],
  [282, "Gardevoir"],
  [283, "Surskit"],
  [284, "Masquerain"],
  [285, "Shroomish"],
  [286, "Breloom"],
  [287, "Slakoth"],
  [288, "Vigoroth"],
  [289, "Slaking"],
  [290, "Nincada"],
  [291, "Ninjask"],
  [292, "Shedinja"],
  [293, "Whismur"],
  [294, "Loudred"],
  [295, "Exploud"],
  [296, "Makuhita"],
  [297, "Hariyama"],
  [298, "Azurill"],
  [299, "Nosepass"],
  [300, "Skitty"],
  [301, "Delcatty"],
  [302, "Sableye"],
  [303, "Mawile"],
  [304, "Aron"],
  [305, "Lairon"],
  [306, "Aggron"],
  [307, "Meditite"],
  [308, "Medicham"],
  [309, "Electrike"],
  [310, "Manectric"],
  [311, "Plusle"],
  [312, "Minun"],
  [313, "Volbeat"],
  [314, "Illumise"],
  [315, "Roselia"],
  [316, "Gulpin"],
  [317, "Swalot"],
  [318, "Carvanha"],
  [319, "Sharpedo"],
  [320, "Wailmer"],
  [321, "Wailord"],
  [322, "Numel"],
  [323, "Camerupt"],
  [324, "Torkoal"],
  [325, "Spoink"],
  [326, "Grumpig"],
  [327, "Spinda"],
  [328, "Trapinch"],
  [329, "Vibrava"],
  [330, "Flygon"],
  [331, "Cacnea"],
  [332, "Cacturne"],
  [333, "Swablu"],
  [334, "Altaria"],
  [335, "Zangoose"],
  [336, "Seviper"],
  [337, "Lunatone"],
  [338, "Solrock"],
  [339, "Barboach"],
  [340, "Whiscash"],
  [341, "Corphish"],
  [342, "Crawdaunt"],
  [343, "Baltoy"],
  [344, "Claydol"],
  [345, "Lileep"],
  [346, "Cradily"],
  [347, "Anorith"],
  [348, "Armaldo"],
  [349, "Feebas"],
  [350, "Milotic"],
  [351, "Castform"],
  [352, "Kecleon"],
  [353, "Shuppet"],
  [354, "Banette"],
  [355, "Duskull"],
  [356, "Dusclops"],
  [357, "Tropius"],
  [358, "Chimecho"],
  [359, "Absol"],
  [360, "Wynaut"],
  [361, "Snorunt"],
  [362, "Glalie"],
  [363, "Spheal"],
  [364, "Sealeo"],
  [365, "Walrein"],
  [366, "Clamperl"],
  [367, "Huntail"],
  [368, "Gorebyss"],
  [369, "Relicanth"],
  [370, "Luvdisc"],
  [371, "Bagon"],
  [372, "Shelgon"],
  [373, "Salamence"],
  [374, "Beldum"],
  [375, "Metang"],
  [376, "Metagross"],
  [377, "Regirock"],
  [378, "Regice"],
  [379, "Registeel"],
  [380, "Latias"],
  [381, "Latios"],
  [382, "Kyogre"],
  [383, "Groudon"],
  [384, "Rayquaza"],
  [385, "Jirachi"],
  [386, "Deoxys"],
];

// Build lookup: normalized name → national dex number
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const _nameToDex = {};
for (const [dex, name] of NATIONAL_DEX) {
  _nameToDex[normalizeName(name)] = dex;
}

/**
 * Get the sprite path for a species name.
 * Returns null if the species has no sprite (e.g. Egg, "?", "??????????").
 */
export function getSpritePath(speciesName) {
  if (!speciesName || speciesName === '?' || speciesName === '??????????') return null;
  const dex = _nameToDex[normalizeName(speciesName)];
  if (!dex) return null;
  return `src/data/Sprites/${String(dex).padStart(4, '0')}.png`;
}

export function getNationalDexNumber(speciesName) {
  return _nameToDex[normalizeName(speciesName)] || null;
}

// ── Unown form helpers ──────────────────────────────────

const UNOWN_FORMS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?';

/**
 * Calculate the Unown form index (0–27) from a PID.
 */
export function getUnownFormIndex(pid) {
  pid = pid >>> 0;
  return (((pid & 0x3000000) >> 18) |
          ((pid & 0x30000)   >> 12) |
          ((pid & 0x300)     >>  6) |
           (pid & 0x3)) % 28;
}

/**
 * Get the Unown form letter/symbol for a PID.
 */
export function getUnownFormChar(pid) {
  return UNOWN_FORMS[getUnownFormIndex(pid)];
}

/**
 * Get the Unown form sprite filename suffix for a form index (0–27).
 * e.g. 0→'a', 25→'z', 26→'exclamation', 27→'question'
 */
export function getUnownFormSuffix(formIndex) {
  if (formIndex >= 0 && formIndex <= 25) return String.fromCharCode(97 + formIndex); // a-z
  if (formIndex === 26) return 'exclamation';
  if (formIndex === 27) return 'question';
  return 'a';
}

/**
 * Get the sprite path for a specific Unown form index.
 */
export function getUnownSpritePath(formIndex) {
  return `src/data/Sprites/0201-${getUnownFormSuffix(formIndex)}.png`;
}

// ── Online sprite URL helpers (pokemondb.net Ruby/Sapphire) ──

const POKEMONDB_SPRITE_BASE = 'https://img.pokemondb.net/sprites/ruby-sapphire';

function speciesNameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/['.’]/g, '')
    .replace(/\s+/g, '-');
}

function getOnlineVariantSegment(shiny) {
  return shiny ? 'shiny' : 'normal';
}

export function getOnlineSpriteUrl(speciesName, shiny = false) {
  if (!speciesName || speciesName === '?' || speciesName === '??????????') return null;
  return `${POKEMONDB_SPRITE_BASE}/${getOnlineVariantSegment(shiny)}/${speciesNameToSlug(speciesName)}.png`;
}

export function getOnlineUnownSpriteUrl(shiny = false) {
  return `${POKEMONDB_SPRITE_BASE}/${getOnlineVariantSegment(shiny)}/unown.png`;
}

// ── Tanoby Ruins chamber → Unown form slot mapping (PKHeX TanobyRuins3.cs) ──
// Each array has 12 entries (one per encounter slot) giving the form index.
export const TANOBY_FORMS_BY_LOCATION = {
  188: [0,0,0,0,0,0,0,0,0,0,0,27],          // Monean:  A, ?
  189: [2,2,2,3,3,3,7,7,7,20,20,14],         // Liptoo:  C,D,H,U,O
  190: [13,13,13,13,18,18,18,18,8,8,4,4],     // Weepth:  N,S,I,E
  191: [15,15,11,11,9,9,17,17,17,16,16,16],   // Dilford: P,L,J,R,Q
  192: [24,24,19,19,6,6,6,5,5,5,10,10],       // Scufib:  Y,T,G,F,K
  193: [21,21,21,22,22,22,23,23,12,12,1,1],   // Rixy:    V,W,X,M,B
  194: [25,25,25,25,25,25,25,25,25,25,25,26], // Viapois: Z, !
};

/**
 * Get the set of unique form indices available in a given Tanoby chamber.
 */
export function getTanobyFormsForLocation(locationId) {
  const arr = TANOBY_FORMS_BY_LOCATION[locationId];
  return arr ? [...new Set(arr)] : null;
}

/**
 * Get all Tanoby location IDs that can produce a given form index.
 */
export function getTanobyLocationsForForm(formIndex) {
  const result = [];
  for (const [locId, slots] of Object.entries(TANOBY_FORMS_BY_LOCATION)) {
    if (slots.includes(formIndex)) result.push(Number(locId));
  }
  return result;
}

export { UNOWN_FORMS };
