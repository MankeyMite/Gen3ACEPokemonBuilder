#!/usr/bin/env node
/**
 * build-wild-encounters.js
 *
 * Parses the three wild encounter JSON files (Emerald, RS, FRLG) and the
 * locations + species data to produce a compact JS module that maps:
 *
 *   speciesId → { gameId → { locationId → { min, max } } }
 *
 * Usage:
 *   node scripts/build-wild-encounters.js
 *
 * Output:
 *   src/data/wildEncounters.gen3.js
 */

const fs   = require('fs');
const path = require('path');

const DATA  = path.join(__dirname, '..', 'src', 'data');
const OUT   = path.join(DATA, 'wildEncounters.gen3.js');
const ZUBAT_SPECIES_ID = 41;
const EMERALD_ALTERING_CAVE_LOCATION_ID = 210;

// ── 1. Load JSON encounter files ──────────────────────────────────────────────
const emerald = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters emerald.json'), 'utf8'));
const rs      = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters RS.json'), 'utf8'));
const frlg    = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters FRLG.json'), 'utf8'));

// ── 2. Load species list to map SPECIES_XXX → numeric ID ─────────────────────
// species.gen3.js exports `SPECIES = [[id, "Name"], ...]`
const speciesSrc = fs.readFileSync(path.join(DATA, 'species.gen3.js'), 'utf8');
// Build a name→id map: "Bulbasaur" → 1, etc.
const nameToId = {};
for (const m of speciesSrc.matchAll(/\[\s*(\d+)\s*,\s*"([^"]+)"\s*\]/g)) {
  nameToId[m[2].toUpperCase()] = Number(m[1]);
}

/** Convert SPECIES_WURMPLE → species ID */
function speciesConstToId(s) {
  // SPECIES_WURMPLE → WURMPLE → "Wurmple"  but we use uppercase lookup
  const name = s.replace(/^SPECIES_/, '').replace(/_/g, ' ');
  // Try exact uppercase match first
  if (nameToId[name] !== undefined) return nameToId[name];
  // Try some known special cases
  const aliases = {
    'NIDORAN F': 'NIDORAN♀',
    'NIDORAN_F': 'NIDORAN♀',
    'NIDORAN M': 'NIDORAN♂',
    'NIDORAN_M': 'NIDORAN♂',
    'MR MIME': 'MR. MIME',
    'HO OH': 'HO-OH',
    'FARFETCHD': "FARFETCH'D",
  };
  if (aliases[name] !== undefined && nameToId[aliases[name]] !== undefined) {
    return nameToId[aliases[name]];
  }
  // Fallback: try fuzzy — strip spaces/hyphens
  const stripped = name.replace(/[\s-]/g, '');
  for (const [k, v] of Object.entries(nameToId)) {
    if (k.replace(/[\s\-'♀♂.]/g, '') === stripped) return v;
  }
  console.warn(`  ⚠ Could not resolve species: ${s} (${name})`);
  return null;
}

// ── 3. MAP_XXX → Met Location ID mapping ─────────────────────────────────────
//
// Built by matching the MAP constant names from the encounter JSONs to the
// LOCATIONS list (locations.gen3.js).  Multi-floor / sub-area maps are grouped
// under their parent location.

const MAP_TO_LOC = {
  // ─── Hoenn Towns & Cities ───
  MAP_LITTLEROOT_TOWN:             0,
  MAP_OLDALE_TOWN:                 1,
  MAP_DEWFORD_TOWN:                2,
  MAP_LAVARIDGE_TOWN:              3,
  MAP_FALLARBOR_TOWN:              4,
  MAP_VERDANTURF_TOWN:             5,
  MAP_PACIFIDLOG_TOWN:             6,
  MAP_PETALBURG_CITY:              7,
  MAP_SLATEPORT_CITY:              8,
  MAP_MAUVILLE_CITY:               9,
  MAP_RUSTBORO_CITY:              10,
  MAP_FORTREE_CITY:               11,
  MAP_LILYCOVE_CITY:              12,
  MAP_MOSSDEEP_CITY:              13,
  MAP_SOOTOPOLIS_CITY:            14,
  MAP_EVER_GRANDE_CITY:           15,

  // ─── Hoenn Routes ───
  MAP_ROUTE101:                   16,
  MAP_ROUTE102:                   17,
  MAP_ROUTE103:                   18,
  MAP_ROUTE104:                   19,
  MAP_ROUTE105:                   20,
  MAP_ROUTE106:                   21,
  MAP_ROUTE107:                   22,
  MAP_ROUTE108:                   23,
  MAP_ROUTE109:                   24,
  MAP_ROUTE110:                   25,
  MAP_ROUTE111:                   26,
  MAP_ROUTE112:                   27,
  MAP_ROUTE113:                   28,
  MAP_ROUTE114:                   29,
  MAP_ROUTE115:                   30,
  MAP_ROUTE116:                   31,
  MAP_ROUTE117:                   32,
  MAP_ROUTE118:                   33,
  MAP_ROUTE119:                   34,
  MAP_ROUTE120:                   35,
  MAP_ROUTE121:                   36,
  MAP_ROUTE122:                   37,
  MAP_ROUTE123:                   38,
  MAP_ROUTE124:                   39,
  MAP_ROUTE125:                   40,
  MAP_ROUTE126:                   41,
  MAP_ROUTE127:                   42,
  MAP_ROUTE128:                   43,
  MAP_ROUTE129:                   44,
  MAP_ROUTE130:                   45,
  MAP_ROUTE131:                   46,
  MAP_ROUTE132:                   47,
  MAP_ROUTE133:                   48,
  MAP_ROUTE134:                   49,

  // ─── Hoenn Underwater ───
  MAP_UNDERWATER_ROUTE124:        50,
  MAP_UNDERWATER_ROUTE126:        51,
  MAP_UNDERWATER1:                52, // Underwater (Route 127)
  MAP_UNDERWATER2:                53, // Underwater (Route 128)

  // ─── Hoenn Caves / Dungeons ───
  MAP_GRANITE_CAVE_1F:            55,
  MAP_GRANITE_CAVE_B1F:           55,
  MAP_GRANITE_CAVE_B2F:           55,
  MAP_GRANITE_CAVE_STEVENS_ROOM:  55,

  MAP_MT_CHIMNEY:                 56,

  MAP_SAFARI_ZONE_CENTER:         57,
  MAP_SAFARI_ZONE_EAST:           57,
  MAP_SAFARI_ZONE_NORTH:          57,
  MAP_SAFARI_ZONE_NORTHEAST:      57,
  MAP_SAFARI_ZONE_NORTHWEST:      57,
  MAP_SAFARI_ZONE_SOUTH:          57,
  MAP_SAFARI_ZONE_SOUTHEAST:      57,
  MAP_SAFARI_ZONE_SOUTHWEST:      57,
  MAP_SAFARI_ZONE_WEST:           57,

  MAP_PETALBURG_WOODS:            59,
  MAP_RUSTURF_TUNNEL:             60,

  MAP_ABANDONED_SHIP_HIDDEN_FLOOR_CORRIDORS: 61,
  MAP_ABANDONED_SHIP_ROOMS_B1F:              61,

  MAP_NEW_MAUVILLE_ENTRANCE:      62,
  MAP_NEW_MAUVILLE_INSIDE:        62,

  MAP_METEOR_FALLS_1F_1R:         63,
  MAP_METEOR_FALLS_1F_2R:         63,
  MAP_METEOR_FALLS_B1F_1R:        63,
  MAP_METEOR_FALLS_B1F_2R:        63,
  MAP_METEOR_FALLS_STEVENS_CAVE:  63,

  MAP_MT_PYRE_1F:                 65,
  MAP_MT_PYRE_2F:                 65,
  MAP_MT_PYRE_3F:                 65,
  MAP_MT_PYRE_4F:                 65,
  MAP_MT_PYRE_5F:                 65,
  MAP_MT_PYRE_6F:                 65,
  MAP_MT_PYRE_EXTERIOR:           65,
  MAP_MT_PYRE_SUMMIT:             65,

  MAP_SHOAL_CAVE_LOW_TIDE_ENTRANCE_ROOM: 67,
  MAP_SHOAL_CAVE_LOW_TIDE_ICE_ROOM:     67,
  MAP_SHOAL_CAVE_LOW_TIDE_INNER_ROOM:   67,
  MAP_SHOAL_CAVE_LOW_TIDE_LOWER_ROOM:   67,
  MAP_SHOAL_CAVE_LOW_TIDE_STAIRS_ROOM:  67,

  MAP_SEAFLOOR_CAVERN_ENTRANCE:   68,
  MAP_SEAFLOOR_CAVERN_ROOM1:      68,
  MAP_SEAFLOOR_CAVERN_ROOM2:      68,
  MAP_SEAFLOOR_CAVERN_ROOM3:      68,
  MAP_SEAFLOOR_CAVERN_ROOM4:      68,
  MAP_SEAFLOOR_CAVERN_ROOM5:      68,
  MAP_SEAFLOOR_CAVERN_ROOM6:      68,
  MAP_SEAFLOOR_CAVERN_ROOM7:      68,
  MAP_SEAFLOOR_CAVERN_ROOM8:      68,

  MAP_VICTORY_ROAD_1F:            70, // Hoenn Victory Road
  MAP_VICTORY_ROAD_2F:            70,
  MAP_VICTORY_ROAD_3F:            70, // 3F only in R/S (not Emerald VR which is B1F/B2F)

  MAP_CAVE_OF_ORIGIN_1F:                             72,
  MAP_CAVE_OF_ORIGIN_B1F:                            72,
  MAP_CAVE_OF_ORIGIN_B2F:                            72,
  MAP_CAVE_OF_ORIGIN_B3F:                            72,
  MAP_CAVE_OF_ORIGIN_ENTRANCE:                       72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP1:      72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP2:      72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP3:      72,

  MAP_FIERY_PATH:                 74,
  MAP_JAGGED_PASS:                76,
  MAP_SCORCHED_SLAB:              80,

  MAP_SKY_PILLAR_1F:              85,
  MAP_SKY_PILLAR_3F:              85,
  MAP_SKY_PILLAR_5F:              85,

  MAP_MAGMA_HIDEOUT_1F:           198, // Magma Hideout
  MAP_MAGMA_HIDEOUT_2F_1R:        198,
  MAP_MAGMA_HIDEOUT_2F_2R:        198,
  MAP_MAGMA_HIDEOUT_2F_3R:        198,
  MAP_MAGMA_HIDEOUT_3F_1R:        198,
  MAP_MAGMA_HIDEOUT_3F_2R:        198,
  MAP_MAGMA_HIDEOUT_3F_3R:        198,
  MAP_MAGMA_HIDEOUT_4F:           198,

  MAP_MIRAGE_TOWER_1F:            199, // Mirage Tower
  MAP_MIRAGE_TOWER_2F:            199,
  MAP_MIRAGE_TOWER_3F:            199,
  MAP_MIRAGE_TOWER_4F:            199,

  MAP_ARTISAN_CAVE_1F:            202, // Artisan Cave
  MAP_ARTISAN_CAVE_B1F:           202,

  MAP_DESERT_UNDERPASS:           209,
  MAP_ALTERING_CAVE:              210,

  // ─── Kanto Towns & Cities ─── (FRLG locations)
  MAP_PALLET_TOWN:                88,
  MAP_VIRIDIAN_CITY:              89,
  MAP_PEWTER_CITY:                90,
  MAP_CERULEAN_CITY:              91,
  MAP_LAVENDER_TOWN:              92,
  MAP_VERMILION_CITY:             93,
  MAP_CELADON_CITY:               94,
  MAP_FUCHSIA_CITY:               95,
  MAP_CINNABAR_ISLAND:            96,
  MAP_SAFFRON_CITY:               98,

  // ─── Kanto Routes ───
  MAP_ROUTE1:                    101,
  MAP_ROUTE2:                    102,
  MAP_ROUTE3:                    103,
  MAP_ROUTE4:                    104,
  MAP_ROUTE5:                    105,
  MAP_ROUTE6:                    106,
  MAP_ROUTE7:                    107,
  MAP_ROUTE8:                    108,
  MAP_ROUTE9:                    109,
  MAP_ROUTE10:                   110,
  MAP_ROUTE11:                   111,
  MAP_ROUTE12:                   112,
  MAP_ROUTE13:                   113,
  MAP_ROUTE14:                   114,
  MAP_ROUTE15:                   115,
  MAP_ROUTE16:                   116,
  MAP_ROUTE17:                   117,
  MAP_ROUTE18:                   118,
  MAP_ROUTE19:                   119,
  MAP_ROUTE20:                   120,
  MAP_ROUTE21_NORTH:             121,
  MAP_ROUTE21_SOUTH:             121,
  MAP_ROUTE22:                   122,
  MAP_ROUTE23:                   123,
  MAP_ROUTE24:                   124,
  MAP_ROUTE25:                   125,

  // ─── Kanto Caves / Dungeons ───
  MAP_VIRIDIAN_FOREST:           126,

  MAP_MT_MOON_1F:                127,
  MAP_MT_MOON_B1F:               127,
  MAP_MT_MOON_B2F:               127,

  MAP_SSANNE_EXTERIOR:           128,

  MAP_DIGLETTS_CAVE_B1F:         131,

  MAP_VICTORY_ROAD_B1F:          132, // Kanto Victory Road
  MAP_VICTORY_ROAD_B2F:          132,

  MAP_POKEMON_MANSION_1F:        135,
  MAP_POKEMON_MANSION_2F:        135,
  MAP_POKEMON_MANSION_3F:        135,
  MAP_POKEMON_MANSION_B1F:       135,

  MAP_ROCK_TUNNEL_1F:            138,
  MAP_ROCK_TUNNEL_B1F:           138,

  MAP_SEAFOAM_ISLANDS_1F:        139,
  MAP_SEAFOAM_ISLANDS_B1F:       139,
  MAP_SEAFOAM_ISLANDS_B2F:       139,
  MAP_SEAFOAM_ISLANDS_B3F:       139,
  MAP_SEAFOAM_ISLANDS_B4F:       139,

  MAP_POKEMON_TOWER_3F:          140,
  MAP_POKEMON_TOWER_4F:          140,
  MAP_POKEMON_TOWER_5F:          140,
  MAP_POKEMON_TOWER_6F:          140,
  MAP_POKEMON_TOWER_7F:          140,

  MAP_CERULEAN_CAVE_1F:          141,
  MAP_CERULEAN_CAVE_2F:          141,
  MAP_CERULEAN_CAVE_B1F:         141,

  MAP_POWER_PLANT:               142,

  // ─── Sevii Islands ───
  MAP_ONE_ISLAND:                143,
  MAP_ONE_ISLAND_KINDLE_ROAD:    150,
  MAP_ONE_ISLAND_TREASURE_BEACH: 151,

  MAP_TWO_ISLAND_CAPE_BRINK:     152,

  MAP_THREE_ISLAND_BOND_BRIDGE:  153,
  MAP_THREE_ISLAND_PORT:         154,
  MAP_THREE_ISLAND_BERRY_FOREST: 176,

  MAP_FOUR_ISLAND:               146,
  MAP_FOUR_ISLAND_ICEFALL_CAVE_1F:       177,
  MAP_FOUR_ISLAND_ICEFALL_CAVE_B1F:      177,
  MAP_FOUR_ISLAND_ICEFALL_CAVE_BACK:     177,
  MAP_FOUR_ISLAND_ICEFALL_CAVE_ENTRANCE: 177,

  MAP_FIVE_ISLAND:               147,
  MAP_FIVE_ISLAND_RESORT_GORGEOUS:     159,
  MAP_FIVE_ISLAND_WATER_LABYRINTH:     160,
  MAP_FIVE_ISLAND_MEADOW:              161,
  MAP_FIVE_ISLAND_MEMORIAL_PILLAR:     162,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM1:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM2:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM3:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM4:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM5:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM6:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM7:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM8:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM9:     181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM10:    181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM11:    181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM12:    181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM13:    181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM14:    181,

  MAP_SIX_ISLAND_OUTCAST_ISLAND:       163,
  MAP_SIX_ISLAND_GREEN_PATH:           164,
  MAP_SIX_ISLAND_WATER_PATH:           165,
  MAP_SIX_ISLAND_RUIN_VALLEY:          166,
  MAP_SIX_ISLAND_PATTERN_BUSH:         182,
  MAP_SIX_ISLAND_ALTERING_CAVE:        183,

  MAP_SEVEN_ISLAND_SEVAULT_CANYON:          169,
  MAP_SEVEN_ISLAND_SEVAULT_CANYON_ENTRANCE: 168,
  MAP_SEVEN_ISLAND_TANOBY_RUINS:           170,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_MONEAN_CHAMBER:  188,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_LIPTOO_CHAMBER:  189,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_WEEPTH_CHAMBER:  190,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_DILFORD_CHAMBER: 191,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_SCUFIB_CHAMBER:  192,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_RIXY_CHAMBER:    193,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_VIAPOIS_CHAMBER: 194,
  MAP_SEVEN_ISLAND_TRAINER_TOWER:                 179,

  // ─── Sevii misc ───
  MAP_MT_EMBER_EXTERIOR:                     175,
  MAP_MT_EMBER_SUMMIT_PATH_1F:               175,
  MAP_MT_EMBER_SUMMIT_PATH_2F:               175,
  MAP_MT_EMBER_SUMMIT_PATH_3F:               175,
  MAP_MT_EMBER_RUBY_PATH_1F:                 175,
  MAP_MT_EMBER_RUBY_PATH_B1F:                175,
  MAP_MT_EMBER_RUBY_PATH_B2F:                175,
  MAP_MT_EMBER_RUBY_PATH_B3F:                175,
  MAP_MT_EMBER_RUBY_PATH_B1F_STAIRS:         175,
  MAP_MT_EMBER_RUBY_PATH_B2F_STAIRS:         175,
};

// ── 4. Game detection ─────────────────────────────────────────────────────────
// Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen

function detectGame(baseLabel, sourceFile) {
  if (sourceFile === 'emerald') return [3]; // Emerald only
  if (baseLabel.endsWith('_Ruby'))      return [2];
  if (baseLabel.endsWith('_Sapphire'))  return [1];
  if (baseLabel.endsWith('_FireRed'))   return [4];
  if (baseLabel.endsWith('_LeafGreen')) return [5];
  // Fallback: if the label doesn't have a suffix, assume all games for that file
  if (sourceFile === 'rs')   return [1, 2];
  if (sourceFile === 'frlg') return [4, 5];
  return [];
}

// ── 5. Process encounters ─────────────────────────────────────────────────────
// Result: { speciesId: { gameId: { locationId: [[min,max], ...] } } }
// Each location stores an array of [min,max] ranges from individual encounter
// slots.  After all files are processed we merge overlapping ranges so the
// final output is a compact, sorted list of non-overlapping [min,max] pairs
// (section 6).
const result = {};
let unmappedMaps = new Set();
let unmappedSpecies = new Set();

function processFile(data, sourceFile) {
  const encounters = data.wild_encounter_groups[0].encounters;
  for (const entry of encounters) {
    const map = entry.map;
    const locId = MAP_TO_LOC[map];
    if (locId === undefined) {
      unmappedMaps.add(map);
      continue;
    }

    const games = detectGame(entry.base_label, sourceFile);
    const monTypes = ['land_mons', 'water_mons', 'rock_smash_mons', 'fishing_mons'];

    for (const mtype of monTypes) {
      if (!entry[mtype] || !entry[mtype].mons) continue;
      for (const mon of entry[mtype].mons) {
        const spId = speciesConstToId(mon.species);
        if (spId === null || spId === 0) {
          unmappedSpecies.add(mon.species);
          continue;
        }
        if (
          sourceFile === 'emerald' &&
          locId === EMERALD_ALTERING_CAVE_LOCATION_ID &&
          spId !== ZUBAT_SPECIES_ID
        ) {
          continue;
        }
        for (const g of games) {
          if (!result[spId]) result[spId] = {};
          if (!result[spId][g]) result[spId][g] = {};
          if (!result[spId][g][locId]) {
            result[spId][g][locId] = [];
          }
          result[spId][g][locId].push([mon.min_level, mon.max_level]);
        }
      }
    }
  }
}

processFile(emerald, 'emerald');
processFile(rs, 'rs');
processFile(frlg, 'frlg');

// ── 5b. Merge overlapping ranges per location ────────────────────────────────
function mergeRanges(ranges) {
  if (!ranges.length) return [];
  // Sort by start, then by end
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [ranges[0].slice()];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    const cur  = ranges[i];
    // Overlap or adjacent (e.g., [2,5] and [6,8] → [2,8])
    if (cur[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      merged.push(cur.slice());
    }
  }
  return merged;
}

for (const spId of Object.keys(result)) {
  for (const gId of Object.keys(result[spId])) {
    for (const locId of Object.keys(result[spId][gId])) {
      result[spId][gId][locId] = mergeRanges(result[spId][gId][locId]);
    }
  }
}

// ── 6. Report ─────────────────────────────────────────────────────────────────
const speciesCount = Object.keys(result).length;
let totalEntries = 0;
for (const sp of Object.values(result))
  for (const g of Object.values(sp))
    totalEntries += Object.keys(g).length;

console.log(`✓ ${speciesCount} species with wild encounters, ${totalEntries} total entries`);
if (unmappedMaps.size)    console.warn(`⚠ Unmapped maps (${unmappedMaps.size}):`, [...unmappedMaps].join(', '));
if (unmappedSpecies.size) console.warn(`⚠ Unmapped species (${unmappedSpecies.size}):`, [...unmappedSpecies].join(', '));

// ── 7. Generate output ────────────────────────────────────────────────────────
// Format: speciesId: { gameId: { locationId: [[min,max],...] } }
// Single-element ranges where min===max are stored as [n] for compactness.
let lines = [
  '// Auto-generated by scripts/build-wild-encounters.js — do not edit',
  '// Maps speciesId → { gameId → { locationId → [[min,max], ...] } }',
  '// Each location has an array of merged, non-overlapping [min,max] level ranges.',
  '// Single-level entries are stored as [n] for compactness.',
  '// Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen',
  'export const WILD_ENCOUNTERS = {',
];

const sortedSpecies = Object.keys(result).map(Number).sort((a, b) => a - b);
for (const spId of sortedSpecies) {
  const games = result[spId];
  const gameParts = [];
  for (const gId of Object.keys(games).map(Number).sort((a, b) => a - b)) {
    const locs = games[gId];
    const locParts = [];
    for (const [lId, ranges] of Object.entries(locs).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const rangeStr = ranges.map(r => r[0] === r[1] ? `[${r[0]}]` : `[${r[0]},${r[1]}]`).join(',');
      locParts.push(`${lId}:[${rangeStr}]`);
    }
    gameParts.push(`${gId}:{${locParts.join(',')}}`);
  }
  lines.push(`  ${spId}:{${gameParts.join(',')}},`);
}

lines.push('};');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`✓ Written to ${OUT}`);
