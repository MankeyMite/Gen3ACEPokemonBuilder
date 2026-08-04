#!/usr/bin/env node
/**
 * build-encounter-slots.js
 *
 * Generates encounter slot tables for encounter-chain-valid PID searching.
 * Output: src/data/encounterSlots.gen3.js
 *
 * Format per game/location:
 *   { l: [table, ...], w: [table, ...], r: [table, ...] }
 * where each table = [[speciesId, minLv, maxLv], ...] in slot order.
 * Multiple tables per type = different sub-maps sharing the same locationId.
 * Duplicate tables are removed.
 *
 * Encounter types:
 *   l = land (12 slots),  w = water (5 slots),  r = rock_smash (5 slots)
 *   o = old_rod (2 slots), g = good_rod (3 slots), s = super_rod (5 slots)
 *
 * Usage:  node scripts/build-encounter-slots.js
 */

const fs   = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');
const OUT  = path.join(DATA, 'encounterSlots.gen3.js');
const { shouldExcludeAlteringCaveTable } = require('./encounter-exclusions.js');
const FEEBAS_SPECIES_ID = 328;
const ROUTE_119_LOCATION_ID = 34;
const HOENN_MAIN_GAME_IDS = [1, 2, 3]; // Sapphire, Ruby, Emerald
const SWARM_FISH_50_TYPE = 'swarm_fish_50';
const KANTO_SAFARI_ZONE_LOCATION_ID = 136;

// ── Load JSONs ────────────────────────────────────────────────────────────────
const emerald = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters emerald.json'), 'utf8'));
const rs      = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters RS.json'), 'utf8'));
const frlg    = JSON.parse(fs.readFileSync(path.join(DATA, 'wild_encounters FRLG.json'), 'utf8'));

// ── Species name→ID map (reuse from build-wild-encounters) ───────────────────
const speciesSrc = fs.readFileSync(path.join(DATA, 'species.gen3.js'), 'utf8');
const nameToId = {};
for (const m of speciesSrc.matchAll(/\[\s*(\d+)\s*,\s*"([^"]+)"\s*\]/g)) {
  nameToId[m[2].toUpperCase()] = Number(m[1]);
}

function speciesConstToId(s) {
  const name = s.replace(/^SPECIES_/, '').replace(/_/g, ' ');
  if (nameToId[name] !== undefined) return nameToId[name];
  const aliases = {
    'NIDORAN F': 'NIDORAN♀', 'NIDORAN_F': 'NIDORAN♀',
    'NIDORAN M': 'NIDORAN♂', 'NIDORAN_M': 'NIDORAN♂',
    'MR MIME': 'MR. MIME', 'HO OH': 'HO-OH', 'FARFETCHD': "FARFETCH'D",
  };
  if (aliases[name] !== undefined && nameToId[aliases[name]] !== undefined)
    return nameToId[aliases[name]];
  const stripped = name.replace(/[\s-]/g, '');
  for (const [k, v] of Object.entries(nameToId)) {
    if (k.replace(/[\s\-'♀♂.]/g, '') === stripped) return v;
  }
  console.warn(`  ⚠ Could not resolve species: ${s}`);
  return null;
}

// ── MAP → Location ID (copied from build-wild-encounters.js) ─────────────────
const MAP_TO_LOC = {
  MAP_LITTLEROOT_TOWN:0,MAP_OLDALE_TOWN:1,MAP_DEWFORD_TOWN:2,MAP_LAVARIDGE_TOWN:3,
  MAP_FALLARBOR_TOWN:4,MAP_VERDANTURF_TOWN:5,MAP_PACIFIDLOG_TOWN:6,MAP_PETALBURG_CITY:7,
  MAP_SLATEPORT_CITY:8,MAP_MAUVILLE_CITY:9,MAP_RUSTBORO_CITY:10,MAP_FORTREE_CITY:11,
  MAP_LILYCOVE_CITY:12,MAP_MOSSDEEP_CITY:13,MAP_SOOTOPOLIS_CITY:14,MAP_EVER_GRANDE_CITY:15,
  MAP_ROUTE101:16,MAP_ROUTE102:17,MAP_ROUTE103:18,MAP_ROUTE104:19,
  MAP_ROUTE105:20,MAP_ROUTE106:21,MAP_ROUTE107:22,MAP_ROUTE108:23,
  MAP_ROUTE109:24,MAP_ROUTE110:25,MAP_ROUTE111:26,MAP_ROUTE112:27,
  MAP_ROUTE113:28,MAP_ROUTE114:29,MAP_ROUTE115:30,MAP_ROUTE116:31,
  MAP_ROUTE117:32,MAP_ROUTE118:33,MAP_ROUTE119:34,MAP_ROUTE120:35,
  MAP_ROUTE121:36,MAP_ROUTE122:37,MAP_ROUTE123:38,MAP_ROUTE124:39,
  MAP_ROUTE125:40,MAP_ROUTE126:41,MAP_ROUTE127:42,MAP_ROUTE128:43,
  MAP_ROUTE129:44,MAP_ROUTE130:45,MAP_ROUTE131:46,MAP_ROUTE132:47,
  MAP_ROUTE133:48,MAP_ROUTE134:49,
  MAP_UNDERWATER_ROUTE124:50,MAP_UNDERWATER_ROUTE126:51,
  MAP_UNDERWATER1:52,MAP_UNDERWATER2:53,
  MAP_GRANITE_CAVE_1F:55,MAP_GRANITE_CAVE_B1F:55,MAP_GRANITE_CAVE_B2F:55,
  MAP_GRANITE_CAVE_STEVENS_ROOM:55,
  MAP_MT_CHIMNEY:56,
  MAP_SAFARI_ZONE_CENTER:57,MAP_SAFARI_ZONE_EAST:57,MAP_SAFARI_ZONE_NORTH:57,
  MAP_SAFARI_ZONE_NORTHEAST:57,MAP_SAFARI_ZONE_NORTHWEST:57,MAP_SAFARI_ZONE_SOUTH:57,
  MAP_SAFARI_ZONE_SOUTHEAST:57,MAP_SAFARI_ZONE_SOUTHWEST:57,MAP_SAFARI_ZONE_WEST:57,
  MAP_PETALBURG_WOODS:59,MAP_RUSTURF_TUNNEL:60,
  MAP_ABANDONED_SHIP_HIDDEN_FLOOR_CORRIDORS:61,MAP_ABANDONED_SHIP_ROOMS_B1F:61,
  MAP_NEW_MAUVILLE_ENTRANCE:62,MAP_NEW_MAUVILLE_INSIDE:62,
  MAP_METEOR_FALLS_1F_1R:63,MAP_METEOR_FALLS_1F_2R:63,MAP_METEOR_FALLS_B1F_1R:63,
  MAP_METEOR_FALLS_B1F_2R:63,MAP_METEOR_FALLS_STEVENS_CAVE:63,
  MAP_MT_PYRE_1F:65,MAP_MT_PYRE_2F:65,MAP_MT_PYRE_3F:65,MAP_MT_PYRE_4F:65,
  MAP_MT_PYRE_5F:65,MAP_MT_PYRE_6F:65,MAP_MT_PYRE_EXTERIOR:65,MAP_MT_PYRE_SUMMIT:65,
  MAP_SHOAL_CAVE_LOW_TIDE_ENTRANCE_ROOM:67,MAP_SHOAL_CAVE_LOW_TIDE_ICE_ROOM:67,
  MAP_SHOAL_CAVE_LOW_TIDE_INNER_ROOM:67,MAP_SHOAL_CAVE_LOW_TIDE_LOWER_ROOM:67,
  MAP_SHOAL_CAVE_LOW_TIDE_STAIRS_ROOM:67,
  MAP_SEAFLOOR_CAVERN_ENTRANCE:68,MAP_SEAFLOOR_CAVERN_ROOM1:68,MAP_SEAFLOOR_CAVERN_ROOM2:68,
  MAP_SEAFLOOR_CAVERN_ROOM3:68,MAP_SEAFLOOR_CAVERN_ROOM4:68,MAP_SEAFLOOR_CAVERN_ROOM5:68,
  MAP_SEAFLOOR_CAVERN_ROOM6:68,MAP_SEAFLOOR_CAVERN_ROOM7:68,MAP_SEAFLOOR_CAVERN_ROOM8:68,
  MAP_VICTORY_ROAD_1F:70,MAP_VICTORY_ROAD_2F:70,MAP_VICTORY_ROAD_3F:70,
  MAP_CAVE_OF_ORIGIN_1F:72,MAP_CAVE_OF_ORIGIN_B1F:72,MAP_CAVE_OF_ORIGIN_B2F:72,
  MAP_CAVE_OF_ORIGIN_B3F:72,MAP_CAVE_OF_ORIGIN_ENTRANCE:72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP1:72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP2:72,
  MAP_CAVE_OF_ORIGIN_UNUSED_RUBY_SAPPHIRE_MAP3:72,
  MAP_FIERY_PATH:74,MAP_JAGGED_PASS:76,MAP_SCORCHED_SLAB:80,
  MAP_SKY_PILLAR_1F:85,MAP_SKY_PILLAR_3F:85,MAP_SKY_PILLAR_5F:85,
  MAP_MAGMA_HIDEOUT_1F:198,MAP_MAGMA_HIDEOUT_2F_1R:198,MAP_MAGMA_HIDEOUT_2F_2R:198,
  MAP_MAGMA_HIDEOUT_2F_3R:198,MAP_MAGMA_HIDEOUT_3F_1R:198,MAP_MAGMA_HIDEOUT_3F_2R:198,
  MAP_MAGMA_HIDEOUT_3F_3R:198,MAP_MAGMA_HIDEOUT_4F:198,
  MAP_MIRAGE_TOWER_1F:199,MAP_MIRAGE_TOWER_2F:199,MAP_MIRAGE_TOWER_3F:199,MAP_MIRAGE_TOWER_4F:199,
  MAP_ARTISAN_CAVE_1F:202,MAP_ARTISAN_CAVE_B1F:202,
  MAP_DESERT_UNDERPASS:209,MAP_ALTERING_CAVE:210,
  MAP_PALLET_TOWN:88,MAP_VIRIDIAN_CITY:89,MAP_PEWTER_CITY:90,MAP_CERULEAN_CITY:91,
  MAP_LAVENDER_TOWN:92,MAP_VERMILION_CITY:93,MAP_CELADON_CITY:94,MAP_FUCHSIA_CITY:95,
  MAP_CINNABAR_ISLAND:96,MAP_SAFFRON_CITY:98,
  MAP_ROUTE1:101,MAP_ROUTE2:102,MAP_ROUTE3:103,MAP_ROUTE4:104,MAP_ROUTE5:105,
  MAP_ROUTE6:106,MAP_ROUTE7:107,MAP_ROUTE8:108,MAP_ROUTE9:109,MAP_ROUTE10:110,
  MAP_ROUTE11:111,MAP_ROUTE12:112,MAP_ROUTE13:113,MAP_ROUTE14:114,MAP_ROUTE15:115,
  MAP_ROUTE16:116,MAP_ROUTE17:117,MAP_ROUTE18:118,MAP_ROUTE19:119,MAP_ROUTE20:120,
  MAP_ROUTE21_NORTH:121,MAP_ROUTE21_SOUTH:121,MAP_ROUTE22:122,MAP_ROUTE23:123,
  MAP_ROUTE24:124,MAP_ROUTE25:125,
  MAP_VIRIDIAN_FOREST:126,MAP_MT_MOON_1F:127,MAP_MT_MOON_B1F:127,MAP_MT_MOON_B2F:127,
  MAP_SSANNE_EXTERIOR:128,MAP_DIGLETTS_CAVE_B1F:131,
  MAP_VICTORY_ROAD_B1F:132,MAP_VICTORY_ROAD_B2F:132,
  MAP_POKEMON_MANSION_1F:135,MAP_POKEMON_MANSION_2F:135,MAP_POKEMON_MANSION_3F:135,
  MAP_POKEMON_MANSION_B1F:135,
  MAP_ROCK_TUNNEL_1F:138,MAP_ROCK_TUNNEL_B1F:138,
  MAP_SEAFOAM_ISLANDS_1F:139,MAP_SEAFOAM_ISLANDS_B1F:139,MAP_SEAFOAM_ISLANDS_B2F:139,
  MAP_SEAFOAM_ISLANDS_B3F:139,MAP_SEAFOAM_ISLANDS_B4F:139,
  MAP_POKEMON_TOWER_3F:140,MAP_POKEMON_TOWER_4F:140,MAP_POKEMON_TOWER_5F:140,
  MAP_POKEMON_TOWER_6F:140,MAP_POKEMON_TOWER_7F:140,
  MAP_CERULEAN_CAVE_1F:141,MAP_CERULEAN_CAVE_2F:141,MAP_CERULEAN_CAVE_B1F:141,
  MAP_POWER_PLANT:142,
  MAP_ONE_ISLAND:143,MAP_ONE_ISLAND_KINDLE_ROAD:150,MAP_ONE_ISLAND_TREASURE_BEACH:151,
  MAP_TWO_ISLAND_CAPE_BRINK:152,
  MAP_THREE_ISLAND_BOND_BRIDGE:153,MAP_THREE_ISLAND_PORT:154,MAP_THREE_ISLAND_BERRY_FOREST:176,
  MAP_FOUR_ISLAND:146,MAP_FOUR_ISLAND_ICEFALL_CAVE_1F:177,MAP_FOUR_ISLAND_ICEFALL_CAVE_B1F:177,
  MAP_FOUR_ISLAND_ICEFALL_CAVE_BACK:177,MAP_FOUR_ISLAND_ICEFALL_CAVE_ENTRANCE:177,
  MAP_FIVE_ISLAND:147,MAP_FIVE_ISLAND_RESORT_GORGEOUS:159,MAP_FIVE_ISLAND_WATER_LABYRINTH:160,
  MAP_FIVE_ISLAND_MEADOW:161,MAP_FIVE_ISLAND_MEMORIAL_PILLAR:162,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM1:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM2:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM3:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM4:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM5:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM6:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM7:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM8:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM9:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM10:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM11:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM12:181,
  MAP_FIVE_ISLAND_LOST_CAVE_ROOM13:181,MAP_FIVE_ISLAND_LOST_CAVE_ROOM14:181,
  MAP_SIX_ISLAND_OUTCAST_ISLAND:163,MAP_SIX_ISLAND_GREEN_PATH:164,
  MAP_SIX_ISLAND_WATER_PATH:165,MAP_SIX_ISLAND_RUIN_VALLEY:166,
  MAP_SIX_ISLAND_PATTERN_BUSH:182,MAP_SIX_ISLAND_ALTERING_CAVE:183,
  MAP_SEVEN_ISLAND_SEVAULT_CANYON:169,MAP_SEVEN_ISLAND_SEVAULT_CANYON_ENTRANCE:168,
  MAP_SEVEN_ISLAND_TANOBY_RUINS:170,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_MONEAN_CHAMBER:188,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_LIPTOO_CHAMBER:189,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_WEEPTH_CHAMBER:190,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_DILFORD_CHAMBER:191,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_SCUFIB_CHAMBER:192,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_RIXY_CHAMBER:193,
  MAP_SEVEN_ISLAND_TANOBY_RUINS_VIAPOIS_CHAMBER:194,
  MAP_SEVEN_ISLAND_TRAINER_TOWER:179,
  MAP_MT_EMBER_EXTERIOR:175,MAP_MT_EMBER_SUMMIT_PATH_1F:175,MAP_MT_EMBER_SUMMIT_PATH_2F:175,
  MAP_MT_EMBER_SUMMIT_PATH_3F:175,MAP_MT_EMBER_RUBY_PATH_1F:175,
  MAP_MT_EMBER_RUBY_PATH_B1F:175,MAP_MT_EMBER_RUBY_PATH_B2F:175,
  MAP_MT_EMBER_RUBY_PATH_B3F:175,MAP_MT_EMBER_RUBY_PATH_B1F_STAIRS:175,
  MAP_MT_EMBER_RUBY_PATH_B2F_STAIRS:175,
};

// ── Game detection ────────────────────────────────────────────────────────────
const SAFARI_ZONE_MAPS = new Set([
  'MAP_SAFARI_ZONE_CENTER',
  'MAP_SAFARI_ZONE_EAST',
  'MAP_SAFARI_ZONE_NORTH',
  'MAP_SAFARI_ZONE_NORTHEAST',
  'MAP_SAFARI_ZONE_NORTHWEST',
  'MAP_SAFARI_ZONE_SOUTH',
  'MAP_SAFARI_ZONE_SOUTHEAST',
  'MAP_SAFARI_ZONE_SOUTHWEST',
  'MAP_SAFARI_ZONE_WEST',
]);

function getLocationIdForMap(map, sourceFile) {
  if (sourceFile === 'frlg' && SAFARI_ZONE_MAPS.has(map)) {
    return KANTO_SAFARI_ZONE_LOCATION_ID;
  }
  return MAP_TO_LOC[map];
}

function detectGame(baseLabel, sourceFile) {
  if (sourceFile === 'emerald') return [3];
  if (baseLabel.endsWith('_Ruby'))      return [2];
  if (baseLabel.endsWith('_Sapphire'))  return [1];
  if (baseLabel.endsWith('_FireRed'))   return [4];
  if (baseLabel.endsWith('_LeafGreen')) return [5];
  if (sourceFile === 'rs')   return [1, 2];
  if (sourceFile === 'frlg') return [4, 5];
  return [];
}

// ── Build slot tables ─────────────────────────────────────────────────────────
// result[gameId][locationId] = {
//   l: Set of JSON-stringified tables (land, 12 slots),
//   w: Set (water, 5 slots),
//   r: Set (rock_smash, 5 slots),
//   o: Set (old_rod, 2 slots),
//   g: Set (good_rod, 3 slots),
//   s: Set (super_rod, 5 slots)
// }

const result = {};

function ensureEntry(gameId, locId) {
  if (!result[gameId]) result[gameId] = {};
  if (!result[gameId][locId]) result[gameId][locId] = {
    l: new Set(), w: new Set(), r: new Set(),
    o: new Set(), g: new Set(), s: new Set(),
    [SWARM_FISH_50_TYPE]: new Set()
  };
}

function shouldSkipTable(sourceFile, locId, table) {
  return shouldExcludeAlteringCaveTable(sourceFile, locId, table);
}

function processFile(data, sourceFile) {
  const groups = data.wild_encounter_groups[0];
  const fishingGroups = null;
  // Find fishing groups definition
  let fishGroups = null;
  for (const f of groups.fields) {
    if (f.type === 'fishing_mons' && f.groups) {
      fishGroups = f.groups;
      break;
    }
  }

  for (const entry of groups.encounters) {
    const map = entry.map;
    const locId = getLocationIdForMap(map, sourceFile);
    if (locId === undefined) continue;
    const games = detectGame(entry.base_label, sourceFile);

    for (const gId of games) {
      ensureEntry(gId, locId);
      const e = result[gId][locId];

      // Land (12 slots)
      if (entry.land_mons && entry.land_mons.mons) {
        const table = entry.land_mons.mons.map(m => {
          const sp = speciesConstToId(m.species);
          return [sp || 0, m.min_level, m.max_level];
        });
        if (!shouldSkipTable(sourceFile, locId, table)) e.l.add(JSON.stringify(table));
      }

      // Water (5 slots)
      if (entry.water_mons && entry.water_mons.mons) {
        const table = entry.water_mons.mons.map(m => {
          const sp = speciesConstToId(m.species);
          return [sp || 0, m.min_level, m.max_level];
        });
        if (!shouldSkipTable(sourceFile, locId, table)) e.w.add(JSON.stringify(table));
      }

      // Rock Smash (5 slots)
      if (entry.rock_smash_mons && entry.rock_smash_mons.mons) {
        const table = entry.rock_smash_mons.mons.map(m => {
          const sp = speciesConstToId(m.species);
          return [sp || 0, m.min_level, m.max_level];
        });
        if (!shouldSkipTable(sourceFile, locId, table)) e.r.add(JSON.stringify(table));
      }

      // Fishing (split by rod type)
      if (entry.fishing_mons && entry.fishing_mons.mons && fishGroups) {
        const allMons = entry.fishing_mons.mons;
        const toTable = (indices) => indices.map(i => {
          if (i >= allMons.length) return [0, 0, 0];
          const m = allMons[i];
          const sp = speciesConstToId(m.species);
          return [sp || 0, m.min_level, m.max_level];
        });

        if (fishGroups.old_rod) {
          const table = toTable(fishGroups.old_rod);
          if (!shouldSkipTable(sourceFile, locId, table)) e.o.add(JSON.stringify(table));
        }
        if (fishGroups.good_rod) {
          const table = toTable(fishGroups.good_rod);
          if (!shouldSkipTable(sourceFile, locId, table)) e.g.add(JSON.stringify(table));
        }
        if (fishGroups.super_rod) {
          const table = toTable(fishGroups.super_rod);
          if (!shouldSkipTable(sourceFile, locId, table)) e.s.add(JSON.stringify(table));
        }
      }
    }
  }
}

processFile(emerald, 'emerald');
processFile(rs, 'rs');
processFile(frlg, 'frlg');

// Feebas is a special 50% Route 119 fishing encounter in R/S/E, not a normal
// Super Rod slot. This exists only for encounter-chain RNG validation.
for (const gameId of HOENN_MAIN_GAME_IDS) {
  ensureEntry(gameId, ROUTE_119_LOCATION_ID);
  result[gameId][ROUTE_119_LOCATION_ID][SWARM_FISH_50_TYPE].add(
    JSON.stringify([[FEEBAS_SPECIES_ID, 20, 25]])
  );
}

// ── Convert Sets to arrays & remove empty types ──────────────────────────────
const TYPE_KEYS = ['l', 'w', 'r', 'o', 'g', 's', SWARM_FISH_50_TYPE];

for (const gId of Object.keys(result)) {
  for (const locId of Object.keys(result[gId])) {
    const entry = result[gId][locId];
    for (const k of TYPE_KEYS) {
      if (entry[k].size === 0) {
        delete entry[k];
      } else {
        entry[k] = [...entry[k]].map(s => JSON.parse(s));
      }
    }
    // Remove location entirely if no types remain
    if (Object.keys(entry).length === 0) {
      delete result[gId][locId];
    }
  }
  if (Object.keys(result[gId]).length === 0) {
    delete result[gId];
  }
}

function compareLocationForStableOutput(a, b) {
  if (a === KANTO_SAFARI_ZONE_LOCATION_ID && b !== KANTO_SAFARI_ZONE_LOCATION_ID) return -1;
  if (b === KANTO_SAFARI_ZONE_LOCATION_ID && a !== KANTO_SAFARI_ZONE_LOCATION_ID) return 1;
  return a - b;
}

// ── Statistics ────────────────────────────────────────────────────────────────
let locCount = 0, tableCount = 0;
for (const gId of Object.keys(result)) {
  for (const locId of Object.keys(result[gId])) {
    locCount++;
    for (const k of TYPE_KEYS) {
      if (result[gId][locId][k]) tableCount += result[gId][locId][k].length;
    }
  }
}
console.log(`✓ ${locCount} game-location combos, ${tableCount} slot tables`);

// ── Generate output ───────────────────────────────────────────────────────────
const lines = [
  '// Auto-generated by scripts/build-encounter-slots.js — do not edit',
  '// Maps gameId → locationId → { type: [slotTable, ...] }',
  '// Types: l=land(12), w=water(5), r=rock_smash(5), o=old_rod(2), g=good_rod(3), s=super_rod(5), swarm_fish_50=Feebas 50%',
  '// Each slotTable = [[speciesId, minLevel, maxLevel], ...]',
  '// Multiple tables per type = different sub-maps at the same location',
  '// Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen',
  'export const ENCOUNTER_SLOTS = {',
];

const sortedGames = Object.keys(result).map(Number).sort((a, b) => a - b);
for (const gId of sortedGames) {
  lines.push(`  ${gId}:{`);
  const sortedLocs = Object.keys(result[gId]).map(Number).sort(compareLocationForStableOutput);
  for (const locId of sortedLocs) {
    const entry = result[gId][locId];
    const parts = [];
    for (const k of TYPE_KEYS) {
      if (!entry[k]) continue;
      // Compact: each slotTable as inline array
      const tables = entry[k].map(t => '[' + t.map(s => `[${s.join(',')}]`).join(',') + ']');
      parts.push(`${k}:[${tables.join(',')}]`);
    }
    lines.push(`    ${locId}:{${parts.join(',')}},`);
  }
  lines.push(`  },`);
}
lines.push('};');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`✓ Written to ${OUT}`);
