/**
 * Gender thresholds for Gen 3 species, keyed by INTERNAL species ID.
 *
 * Semantics (matching the rest of the app):
 *   female  if (PID & 0xFF) < threshold
 *   male    otherwise
 *   -1  = genderless
 *    0  = always male
 *  255  = always female
 *
 * The table is derived from species *names* (looked up in SPECIES)
 * so that it never drifts if internal IDs are reordered.
 */

import { SPECIES } from './species.gen3.js';

/* ── Build a name → internal-ID map from the canonical species list ── */
const _nameToId = Object.create(null);
for (const [id, name] of SPECIES) {
  if (name && name !== '??' && name !== '??????????' && name !== '?') {
    _nameToId[name] = id;
  }
}

/**
 * Helper: given an object keyed by species name → threshold,
 * return an object keyed by internal species ID → threshold.
 */
function _resolve(byName) {
  const out = Object.create(null);
  for (const [name, threshold] of Object.entries(byName)) {
    const id = _nameToId[name];
    if (id !== undefined) {
      out[id] = threshold;
    } else {
      console.warn(`[genderThresholds] unknown species name: "${name}"`);
    }
  }
  return out;
}

/* ── Define thresholds by species NAME ── */

// 87.5 % male  (threshold 31)
const MALE_87_5 = _resolve({
  // Kanto starters
  Bulbasaur: 31, Ivysaur: 31, Venusaur: 31,
  Charmander: 31, Charmeleon: 31, Charizard: 31,
  Squirtle: 31, Wartortle: 31, Blastoise: 31,
  // Johto starters
  Chikorita: 31, Bayleef: 31, Meganium: 31,
  Cyndaquil: 31, Quilava: 31, Typhlosion: 31,
  Totodile: 31, Croconaw: 31, Feraligatr: 31,
  // Hoenn starters
  Treecko: 31, Grovyle: 31, Sceptile: 31,
  Torchic: 31, Combusken: 31, Blaziken: 31,
  Mudkip: 31, Marshtomp: 31, Swampert: 31,
  // Kanto fossils
  Omanyte: 31, Omastar: 31,
  Kabuto: 31, Kabutops: 31,
  Aerodactyl: 31,
  // Hoenn fossils
  Lileep: 31, Cradily: 31,
  Anorith: 31, Armaldo: 31,
  // Eevee line
  Eevee: 31, Vaporeon: 31, Jolteon: 31, Flareon: 31,
  Espeon: 31, Umbreon: 31,
});

// 75 % male  (threshold 63)
const MALE_75 = _resolve({
  Machop: 63, Machoke: 63, Machamp: 63,
  Cubone: 63, Marowak: 63,
});

// 75 % female  (threshold 191)
const FEMALE_75 = _resolve({
  Cleffa: 191, Clefairy: 191, Clefable: 191,
  Igglybuff: 191, Jigglypuff: 191, Wigglytuff: 191,
  Marill: 191, Azumarill: 191,
  Azurill: 191,
  Skitty: 191, Delcatty: 191,
});

// Always female  (threshold 255)
const FEMALE_ONLY = _resolve({
  'Nidoran\u2640': 255, Nidorina: 255, Nidoqueen: 255,
  Chansey: 255, Blissey: 255,
  Smoochum: 255, Jynx: 255,
  Kangaskhan: 255,
  Miltank: 255,
  Illumise: 255,
  Latias: 255,
});

// Always male  (threshold 0)
const MALE_ONLY = _resolve({
  'Nidoran\u2642': 0, Nidorino: 0, Nidoking: 0,
  Hitmonlee: 0, Hitmonchan: 0, Tyrogue: 0, Hitmontop: 0,
  Tauros: 0,
  Volbeat: 0,
  Latios: 0,
});

// Genderless  (threshold -1)
const GENDERLESS = _resolve({
  Magnemite: -1, Magneton: -1,
  Voltorb: -1, Electrode: -1,
  Staryu: -1, Starmie: -1,
  Ditto: -1,
  Porygon: -1, Porygon2: -1,
  Unown: -1,
  // Legendary birds
  Articuno: -1, Zapdos: -1, Moltres: -1,
  // Mewtwo & Mew
  Mewtwo: -1, Mew: -1,
  // Legendary beasts
  Raikou: -1, Entei: -1, Suicune: -1,
  // Tower duo
  Lugia: -1, 'Ho-Oh': -1,
  Celebi: -1,
  // Beldum line
  Beldum: -1, Metang: -1, Metagross: -1,
  // Regi trio
  Regirock: -1, Regice: -1, Registeel: -1,
  // Weather trio
  Kyogre: -1, Groudon: -1, Rayquaza: -1,
  // Event legendaries
  Jirachi: -1, Deoxys: -1,
});

/* ── Merge all sub-tables into the final map (internal-ID → threshold) ── */
export const GENDER_THRESHOLDS = Object.assign(
  Object.create(null),
  MALE_87_5,
  MALE_75,
  FEMALE_75,
  FEMALE_ONLY,
  MALE_ONLY,
  GENDERLESS,
);

/**
 * Look up the gender threshold for a species by its internal ID.
 * Returns 127 (50/50) for any species not in the table.
 */
export function getGenderThreshold(speciesId) {
  if (speciesId in GENDER_THRESHOLDS) {
    return GENDER_THRESHOLDS[speciesId];
  }
  return 127; // default 50/50
}
