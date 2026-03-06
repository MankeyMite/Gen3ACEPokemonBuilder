/**
 * Static Encounter data for Gen 3 — parsed from PKHeX EncounterStatic3 definitions.
 *
 * Each encounter object has:
 *   species      – internal species ID used by the tool
 *   level        – encounter level
 *   games        – array of game IDs where this encounter appears
 *                   (1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen)
 *   location     – met location ID
 *   method       – PID generation method (1 = Method 1, 4 = Method 4, etc.)
 *   fixedBall    – ball forced into (4 = Poké Ball); omit if catchable in any ball
 *   isEgg        – true for egg gifts
 *   moves        – array of move IDs when egg/gift has preset moves
 *   fateful      – true when FatefulEncounter flag must be set
 *   form         – Deoxys form index (0=Normal, 1=Attack, 2=Defense, 3=Speed)
 *   isRoaming    – true for roaming encounters
 *   roamTruncIVs – true when roamer IVs are truncated (RS only; not Emerald)
 *   nickname     – forced nickname string (e.g. Japanese Mew)
 *   language     – forced language ID (1 = Japanese)
 *
 * Changing a species' PID generation method: just edit the `method` field.
 *
 * Source: PKHeX Encounters3RSE.cs, Encounters3FRLG.cs, EncounterStatic3.cs
 */

import { getLegendaryPreset } from './legendaryPresets.gen3.js';

// ─── Game ID constants ────────────────────────────────────────────
const SAP = 1, RUB = 2, EME = 3, FR = 4, LG = 5;
const RSE  = [SAP, RUB, EME];
const RS   = [SAP, RUB];
const FRLG = [FR, LG];

// ─── Categories ───────────────────────────────────────────────────
export const STATIC_CATEGORIES = [
  { id: 'starters',    label: 'Starters' },
  { id: 'fossils',     label: 'Fossils' },
  { id: 'gifts',       label: 'Gifts' },
  { id: 'game_corner', label: 'Game Corner' },
  { id: 'stationary',  label: 'Other Stationary' },
  { id: 'legends',     label: 'Legends' },
  { id: 'events',      label: 'Events' },
  { id: 'roamers',     label: 'Roamers' },
];

// ─── Encounter definitions ────────────────────────────────────────
// Each entry is one legal encounter.  Multiple entries may exist for the same
// species when it appears in different games / locations / levels.

export const STATIC_ENCOUNTER_LIST = [
  // ══════════════════════════════════════════════════════════════════
  //  STARTERS
  // ══════════════════════════════════════════════════════════════════

  // RSE starters @ Route 101
  { category: 'starters', species: 277, level: 5, games: [...RSE], location: 16,  method: 1, fixedBall: 4 }, // Treecko
  { category: 'starters', species: 280, level: 5, games: [...RSE], location: 16,  method: 1, fixedBall: 4 }, // Torchic
  { category: 'starters', species: 283, level: 5, games: [...RSE], location: 16,  method: 1, fixedBall: 4 }, // Mudkip

  // Emerald-only Johto starters @ Littleroot Town
  { category: 'starters', species: 152, level: 5, games: [EME], location: 0,  method: 1, fixedBall: 4 }, // Chikorita
  { category: 'starters', species: 155, level: 5, games: [EME], location: 0,  method: 1, fixedBall: 4 }, // Cyndaquil
  { category: 'starters', species: 158, level: 5, games: [EME], location: 0,  method: 1, fixedBall: 4 }, // Totodile

  // FRLG starters @ Pallet Town
  { category: 'starters', species: 1,   level: 5, games: [...FRLG], location: 88,  method: 1, fixedBall: 4 }, // Bulbasaur
  { category: 'starters', species: 4,   level: 5, games: [...FRLG], location: 88,  method: 1, fixedBall: 4 }, // Charmander
  { category: 'starters', species: 7,   level: 5, games: [...FRLG], location: 88,  method: 1, fixedBall: 4 }, // Squirtle

  // ══════════════════════════════════════════════════════════════════
  //  FOSSILS
  // ══════════════════════════════════════════════════════════════════

  // RSE fossils @ Rustboro City
  { category: 'fossils', species: 388, level: 20, games: [...RSE], location: 10,  method: 1, fixedBall: 4 }, // Lileep
  { category: 'fossils', species: 390, level: 20, games: [...RSE], location: 10,  method: 1, fixedBall: 4 }, // Anorith

  // FRLG fossils @ Cinnabar Island
  { category: 'fossils', species: 138, level: 5,  games: [...FRLG], location: 96,  method: 1, fixedBall: 4 }, // Omanyte
  { category: 'fossils', species: 140, level: 5,  games: [...FRLG], location: 96,  method: 1, fixedBall: 4 }, // Kabuto
  { category: 'fossils', species: 142, level: 5,  games: [...FRLG], location: 96,  method: 1, fixedBall: 4 }, // Aerodactyl

  // ══════════════════════════════════════════════════════════════════
  //  GIFTS
  // ══════════════════════════════════════════════════════════════════

  // RSE gifts
  { category: 'gifts', species: 385, level: 25, games: [...RSE], location: 34,  method: 1, fixedBall: 4 }, // Castform @ Weather Institute
  { category: 'gifts', species: 398, level: 5,  games: [...RSE], location: 13,  method: 1, fixedBall: 4 }, // Beldum @ Mossdeep City
  { category: 'gifts', species: 360, level: 0,  games: [...RSE], location: 32,  method: 1, fixedBall: 4, isEgg: true }, // Wynaut Egg (hatch location varies; default Route 117)

  // FRLG gifts
  { category: 'gifts', species: 106, level: 25, games: [...FRLG], location: 98,  method: 1, fixedBall: 4 }, // Hitmonlee @ Saffron City
  { category: 'gifts', species: 107, level: 25, games: [...FRLG], location: 98,  method: 1, fixedBall: 4 }, // Hitmonchan @ Saffron City
  { category: 'gifts', species: 129, level: 5,  games: [...FRLG], location: 104, method: 1, fixedBall: 4 }, // Magikarp @ Route 4
  { category: 'gifts', species: 131, level: 25, games: [...FRLG], location: 134, method: 1, fixedBall: 4 }, // Lapras @ Silph Co.
  { category: 'gifts', species: 133, level: 25, games: [...FRLG], location: 94,  method: 1, fixedBall: 4 }, // Eevee @ Celadon City
  { category: 'gifts', species: 175, level: 0,  games: [...FRLG], location: 102, method: 1, fixedBall: 4, isEgg: true, moves: [45, 204, 118] }, // Togepi Egg (hatch location varies; default Route 2)

  // ══════════════════════════════════════════════════════════════════
  //  GAME CORNER
  // ══════════════════════════════════════════════════════════════════

  // FireRed — Celadon City Game Corner
  { category: 'game_corner', species: 63,  level: 9,  games: [FR], location: 94,  method: 1, fixedBall: 4 }, // Abra
  { category: 'game_corner', species: 35,  level: 8,  games: [FR], location: 94,  method: 1, fixedBall: 4 }, // Clefairy
  { category: 'game_corner', species: 123, level: 25, games: [FR], location: 94,  method: 1, fixedBall: 4 }, // Scyther
  { category: 'game_corner', species: 147, level: 18, games: [FR], location: 94,  method: 1, fixedBall: 4 }, // Dratini
  { category: 'game_corner', species: 137, level: 26, games: [FR], location: 94,  method: 1, fixedBall: 4 }, // Porygon

  // LeafGreen — Celadon City Game Corner
  { category: 'game_corner', species: 63,  level: 7,  games: [LG], location: 94,  method: 1, fixedBall: 4 }, // Abra
  { category: 'game_corner', species: 35,  level: 12, games: [LG], location: 94,  method: 1, fixedBall: 4 }, // Clefairy
  { category: 'game_corner', species: 127, level: 18, games: [LG], location: 94,  method: 1, fixedBall: 4 }, // Pinsir
  { category: 'game_corner', species: 147, level: 24, games: [LG], location: 94,  method: 1, fixedBall: 4 }, // Dratini
  { category: 'game_corner', species: 137, level: 18, games: [LG], location: 94,  method: 1, fixedBall: 4 }, // Porygon

  // ══════════════════════════════════════════════════════════════════
  //  OTHER STATIONARY (catchable in the field)
  // ══════════════════════════════════════════════════════════════════

  // RSE Kecleon (stationary, catchable in any ball)
  { category: 'stationary', species: 317, level: 30, games: [...RSE], location: 34, method: 1 }, // Kecleon @ Route 119
  { category: 'stationary', species: 317, level: 30, games: [...RSE], location: 35, method: 1 }, // Kecleon @ Route 120

  // Electrode
  { category: 'stationary', species: 101, level: 30, games: [RUB], location: 66,  method: 1 }, // Electrode @ Magma Hideout (Ruby)
  { category: 'stationary', species: 101, level: 30, games: [SAP], location: 66,  method: 1 }, // Electrode @ Aqua Hideout (Sapphire)
  { category: 'stationary', species: 101, level: 30, games: [EME], location: 197, method: 1 }, // Electrode @ Aqua Hideout (Emerald)
  { category: 'stationary', species: 101, level: 34, games: [...FRLG], location: 142, method: 1 }, // Electrode @ Power Plant (FRLG)

  // FRLG stationary
  { category: 'stationary', species: 143, level: 30, games: [...FRLG], location: 112, method: 1 }, // Snorlax @ Route 12
  { category: 'stationary', species: 143, level: 30, games: [...FRLG], location: 116, method: 1 }, // Snorlax @ Route 16
  { category: 'stationary', species: 97,  level: 30, games: [...FRLG], location: 176, method: 1 }, // Hypno @ Berry Forest

  // Emerald
  { category: 'stationary', species: 185, level: 40, games: [EME], location: 58, method: 1 },  // Sudowoodo @ Battle Frontier

  // ══════════════════════════════════════════════════════════════════
  //  LEGENDS (stationary legendaries, caught in the field)
  // ══════════════════════════════════════════════════════════════════

  // Regis (RSE)
  { category: 'legends', species: 401, level: 40, games: [...RSE], location: 82,  method: 1 }, // Regirock @ Desert Ruins
  { category: 'legends', species: 402, level: 40, games: [...RSE], location: 81,  method: 1 }, // Regice @ Island Cave
  { category: 'legends', species: 403, level: 40, games: [...RSE], location: 83,  method: 1 }, // Registeel @ Ancient Tomb
  { category: 'legends', species: 406, level: 70, games: [...RSE], location: 85,  method: 1 }, // Rayquaza @ Sky Pillar

  // Version-specific box legendaries
  { category: 'legends', species: 405, level: 45, games: [RUB], location: 72,  method: 1 }, // Groudon @ Cave of Origin (Ruby)
  { category: 'legends', species: 404, level: 45, games: [SAP], location: 72,  method: 1 }, // Kyogre @ Cave of Origin (Sapphire)
  { category: 'legends', species: 404, level: 70, games: [EME], location: 203, method: 1 }, // Kyogre @ Marine Cave (Emerald)
  { category: 'legends', species: 405, level: 70, games: [EME], location: 205, method: 1 }, // Groudon @ Terra Cave (Emerald)

  // FRLG legendary birds
  { category: 'legends', species: 144, level: 50, games: [...FRLG], location: 139, method: 1 }, // Articuno @ Seafoam Islands
  { category: 'legends', species: 145, level: 50, games: [...FRLG], location: 142, method: 1 }, // Zapdos @ Power Plant
  { category: 'legends', species: 146, level: 50, games: [...FRLG], location: 175, method: 1 }, // Moltres @ Mt. Ember
  { category: 'legends', species: 150, level: 70, games: [...FRLG], location: 141, method: 1 }, // Mewtwo @ Cerulean Cave

  // ══════════════════════════════════════════════════════════════════
  //  EVENTS (ticket / special encounters; fateful encounter required)
  // ══════════════════════════════════════════════════════════════════

  // Deoxys — different forms per game
  { category: 'events', species: 410, level: 30, games: [RUB], location: 200, method: 1, fateful: true, form: 0 }, // Deoxys (Normal) @ Birth Island — Ruby
  { category: 'events', species: 410, level: 30, games: [SAP], location: 200, method: 1, fateful: true, form: 0 }, // Deoxys (Normal) @ Birth Island — Sapphire
  { category: 'events', species: 410, level: 30, games: [EME], location: 200, method: 1, fateful: true, form: 3 }, // Deoxys (Speed) @ Birth Island — Emerald
  { category: 'events', species: 410, level: 30, games: [FR],  location: 187, method: 1, fateful: true, form: 1 }, // Deoxys (Attack) @ Birth Island — FireRed
  { category: 'events', species: 410, level: 30, games: [LG],  location: 187, method: 1, fateful: true, form: 2 }, // Deoxys (Defense) @ Birth Island — LeafGreen

  // Ho-Oh & Lugia — Navel Rock (event ticket)
  { category: 'events', species: 250, level: 70, games: [EME], location: 211, method: 1, fateful: true }, // Ho-Oh @ Navel Rock (Emerald)
  { category: 'events', species: 249, level: 70, games: [EME], location: 211, method: 1, fateful: true }, // Lugia @ Navel Rock (Emerald)
  { category: 'events', species: 250, level: 70, games: [...FRLG], location: 174, method: 1, fateful: true }, // Ho-Oh @ Navel Rock (FRLG)
  { category: 'events', species: 249, level: 70, games: [...FRLG], location: 174, method: 1, fateful: true }, // Lugia @ Navel Rock (FRLG)

  // Mew — Old Sea Map (Japan-only event)
  { category: 'events', species: 151, level: 30, games: [EME], location: 201, method: 1, fateful: true, language: 1, nickname: 'ミュウ' }, // Mew @ Faraway Island

  // Latias & Latios — Southern Island (Eon Ticket)
  { category: 'events', species: 407, level: 50, games: [RUB], location: 73, method: 1 },                      // Latias @ Southern Island (Ruby — natural)
  { category: 'events', species: 408, level: 50, games: [SAP], location: 73, method: 1 },                      // Latios @ Southern Island (Sapphire — natural)
  { category: 'events', species: 407, level: 50, games: [EME], location: 73, method: 1, fateful: true },       // Latias @ Southern Island (Emerald — Eon Ticket)
  { category: 'events', species: 408, level: 50, games: [EME], location: 73, method: 1, fateful: true },       // Latios @ Southern Island (Emerald — Eon Ticket)

  // ══════════════════════════════════════════════════════════════════
  //  ROAMERS
  // ══════════════════════════════════════════════════════════════════

  // RSE roamers
  { category: 'roamers', species: 408, level: 40, games: [RUB], location: 16, method: 1, isRoaming: true, roamTruncIVs: true },  // Latios (Ruby)
  { category: 'roamers', species: 407, level: 40, games: [SAP], location: 16, method: 1, isRoaming: true, roamTruncIVs: true },  // Latias (Sapphire)
  { category: 'roamers', species: 407, level: 40, games: [EME], location: 16, method: 1, isRoaming: true },  // Latias (Emerald — no truncated IVs)
  { category: 'roamers', species: 408, level: 40, games: [EME], location: 16, method: 1, isRoaming: true },  // Latios (Emerald — no truncated IVs)

  // FRLG roamers (legendary beasts)
  { category: 'roamers', species: 243, level: 50, games: [...FRLG], location: 101, method: 1, isRoaming: true, roamTruncIVs: true }, // Raikou
  { category: 'roamers', species: 244, level: 50, games: [...FRLG], location: 101, method: 1, isRoaming: true, roamTruncIVs: true }, // Entei
  { category: 'roamers', species: 245, level: 50, games: [...FRLG], location: 101, method: 1, isRoaming: true, roamTruncIVs: true }, // Suicune
];

// ─── Derived lookups ──────────────────────────────────────────────

/** Set of all species IDs that appear in the static encounter list. */
export const STATIC_SPECIES_SET = new Set(STATIC_ENCOUNTER_LIST.map(e => e.species));

/** Get encounters filtered by category. */
export function getEncountersByCategory(categoryId) {
  return STATIC_ENCOUNTER_LIST.filter(e => e.category === categoryId);
}

/** Get unique species IDs for a category. */
export function getSpeciesForCategory(categoryId) {
  const set = new Set();
  for (const e of STATIC_ENCOUNTER_LIST) {
    if (e.category === categoryId) set.add(e.species);
  }
  return [...set];
}

/**
 * Get the encounter entries for a given species + game combination.
 * Returns an array because the same species can appear at multiple locations.
 */
export function getEncountersForSpeciesGame(speciesId, gameId) {
  return STATIC_ENCOUNTER_LIST.filter(
    e => e.species === speciesId && e.games.includes(gameId)
  );
}

/**
 * Pick the best (first-matching) encounter for a species + game.
 * Falls back to any encounter for that species if the exact game isn't found.
 */
export function getEncounterForSpecies(speciesId, gameId) {
  const exact = STATIC_ENCOUNTER_LIST.find(
    e => e.species === speciesId && e.games.includes(gameId)
  );
  if (exact) return exact;
  return STATIC_ENCOUNTER_LIST.find(e => e.species === speciesId) || null;
}

// ─── Legacy helpers (keep compatibility with existing code) ───────

const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 151,       // Kanto
  243, 244, 245, 249, 250, 251,  // Johto
  401, 402, 403, 404, 405, 406, 407, 408, 409, 410, // Hoenn
]);

function isLegendary(speciesId) {
  return LEGENDARY_IDS.has(speciesId);
}

function isBreedable(speciesId) {
  if (isLegendary(speciesId)) return false;
  if (speciesId === 132) return false; // Ditto
  if (speciesId === 201) return false; // Unown
  return true;
}

function isGiftPokemon(speciesId) {
  return STATIC_SPECIES_SET.has(speciesId);
}

/**
 * Backward-compatible STATIC_ENCOUNTERS keyed by speciesId.
 * Old code that does `STATIC_ENCOUNTERS[speciesId]` still works.
 */
const STATIC_ENCOUNTERS = {};
for (const enc of STATIC_ENCOUNTER_LIST) {
  if (!STATIC_ENCOUNTERS[enc.species]) {
    STATIC_ENCOUNTERS[enc.species] = {
      defaultMetLocationId: enc.location,
      defaultMetLevel: enc.level,
      defaultFatefulEncounter: !!enc.fateful,
      defaultOriginGame: enc.games[0],
      natures: {},
    };
  }
}
// Patch in the fixed events that the old format had (WISHMKR Jirachi / Ageto Celebi)
STATIC_ENCOUNTERS[409] = {
  defaultMetLocation: "Fateful Encounter",
  defaultMetLevel: 5,
  defaultFatefulEncounter: false,
  defaultOriginGame: 2,
  fixedEvent: true,
  fixedTID: 20043,
  fixedSID: 0,
  fixedOTName: "WISHMKR",
  fixedPID: 0x7B053548,
  fixedIVs: { hp: 11, atk: 8, def: 6, spa: 14, spd: 5, spe: 20 },
  fixedMoves: [
    { id: 273, name: "Wish" },
    { id: 93, name: "Confusion" },
    { id: 156, name: "Rest" },
    { id: 0, name: "" },
  ],
  natures: {},
};
STATIC_ENCOUNTERS[251] = {
  defaultMetLocation: "Fateful Encounter",
  defaultMetLevel: 10,
  defaultFatefulEncounter: false,
  defaultOriginGame: 2,
  fixedEvent: true,
  fixedTID: 31121,
  fixedSID: 0,
  fixedOTName: "アゲト",
  fixedPID: 0x549EA197,
  fixedIVs: { hp: 11, atk: 20, def: 5, spa: 26, spd: 1, spe: 3 },
  fixedMoves: [
    { id: 93, name: "Confusion" },
    { id: 105, name: "Recover" },
    { id: 215, name: "Heal Bell" },
    { id: 219, name: "Safeguard" },
  ],
  natures: {},
};

export {
  STATIC_ENCOUNTERS,
  isLegendary,
  isBreedable,
  isGiftPokemon,
};
