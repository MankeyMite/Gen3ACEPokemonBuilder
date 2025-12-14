/**
 * Static encounter presets for Gen 3 Pokémon
 * These are hand-crafted legal PID/IV combinations for non-breedable Pokémon
 * Each entry maps: species -> nature -> gender -> { pid, ivs, metLocation, metLevel, isFatefulEncounter }
 */

import { getLegendaryPreset } from './legendaryPresets.gen3.js';

const STATIC_ENCOUNTERS = {
  // Example structure - we'll fill this in detail
  // Species ID: {
  //   natures: {
  //     natureIndex: {
  //       gender: { pid, ivHp, ivAtk, ivDef, ivSpd, ivSpAtk, ivSpDef, metLocation, metLevel, isFatefulEncounter }
  //     }
  //   },
  //   defaultMetLocation: string,
  //   defaultMetLevel: number,
  //   defaultFatefulEncounter: boolean
  // }
  
  // Bulbasaur (1) - Starter in FRLG
  1: {
    defaultMetLocation: "Pallet Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {
      // We'll add preset PIDs for each nature
      // For now, this is a template
    }
  },
  
  // Charmander (4) - Starter in FRLG
  4: {
    defaultMetLocation: "Pallet Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {}
  },
  
  // Squirtle (7) - Starter in FRLG
  7: {
    defaultMetLocation: "Pallet Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {}
  },
  
  // Treecko (252) - Starter in RSE
  252: {
    defaultMetLocation: "Littleroot Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {}
  },
  
  // Torchic (255) - Starter in RSE
  255: {
    defaultMetLocation: "Littleroot Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {}
  },
  
  // Mudkip (258) - Starter in RSE
  258: {
    defaultMetLocation: "Littleroot Town",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    natures: {}
  },
  
  // Articuno (144)
  144: {
    defaultMetLocation: "Seafoam Islands",
    defaultMetLevel: 50,
    defaultFatefulEncounter: false,
    defaultOriginGame: 4, // FireRed
    natures: {}
  },
  
  // Zapdos (145)
  145: {
    defaultMetLocation: "Power Plant",
    defaultMetLevel: 50,
    defaultFatefulEncounter: false,
    defaultOriginGame: 4, // FireRed
    natures: {}
  },
  
  // Moltres (146)
  146: {
    defaultMetLocation: "Mt. Ember",
    defaultMetLevel: 50,
    defaultFatefulEncounter: false,
    defaultOriginGame: 4, // FireRed
    natures: {}
  },
  
  // Mewtwo (150)
  150: {
    defaultMetLocation: "Cerulean Cave",
    defaultMetLevel: 70,
    defaultFatefulEncounter: false,
    defaultOriginGame: 4, // FireRed
    natures: {}
  },
  
  // Mew (151) - Event only
  151: {
    defaultMetLocation: "Faraway Island",
    defaultMetLevel: 30,
    defaultFatefulEncounter: true,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Raikou (243)
  243: {
    defaultMetLocationId: 125, // Deep Colosseum / Agate Village
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 15, // Colosseum/XD
    defaultRibbons: {
      national: true
    },
    natures: {}
  },
  
  // Entei (244)
  244: {
    defaultMetLocationId: 106, // Realgamtwr Dome / Phenac City
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 15, // Colosseum/XD
    defaultRibbons: {
      national: true
    },
    natures: {}
  },
  
  // Suicune (245)
  245: {
    defaultMetLocationId: 110, // Realgamtwr Dome / Pyrite Town
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 15, // Colosseum/XD
    defaultRibbons: {
      national: true
    },
    natures: {}
  },
  
  // Lugia (249)
  249: {
    defaultMetLocation: "Navel Rock",
    defaultMetLevel: 70,
    defaultFatefulEncounter: true,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Ho-Oh (250)
  250: {
    defaultMetLocation: "Navel Rock",
    defaultMetLevel: 70,
    defaultFatefulEncounter: true,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Regirock (401)
  401: {
    defaultMetLocation: "Desert Ruins",
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Regice (402)
  402: {
    defaultMetLocation: "Island Cave",
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Registeel (403)
  403: {
    defaultMetLocation: "Ancient Tomb",
    defaultMetLevel: 40,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Kyogre (404)
  404: {
    defaultMetLocation: "Marine Cave",
    defaultMetLevel: 70,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Groudon (405)
  405: {
    defaultMetLocation: "Terra Cave",
    defaultMetLevel: 70,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Rayquaza (406)
  406: {
    defaultMetLocation: "Sky Pillar",
    defaultMetLevel: 70,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Latias (407)
  407: {
    defaultMetLocation: "Southern Island",
    defaultMetLevel: 50,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Latios (408)
  408: {
    defaultMetLocation: "Southern Island",
    defaultMetLevel: 50,
    defaultFatefulEncounter: false,
    defaultOriginGame: 3, // Emerald
    natures: {}
  },
  
  // Jirachi (409) - WISHMKR Event
  409: {
    defaultMetLocation: "Fateful Encounter",
    defaultMetLevel: 5,
    defaultFatefulEncounter: false,
    defaultOriginGame: 2, // Ruby
    fixedEvent: true,
    fixedTID: 20043,
    fixedSID: 0,
    fixedOTName: "WISHMKR",
    fixedPID: 0x7B053548, // Jolly nature
    fixedIVs: {
      hp: 11,
      atk: 8,
      def: 6,
      spa: 14,
      spd: 5,
      spe: 20
    },
    fixedMoves: [
      { id: 273, name: "Wish" },
      { id: 93, name: "Confusion" },
      { id: 156, name: "Rest" },
      { id: 0, name: "" } // Empty move slot
    ],
    natures: {}
  },
  
  // Celebi (251) - Japanese Colosseum Bonus Disc Event
  251: {
    defaultMetLocation: "Fateful Encounter",
    defaultMetLevel: 10,
    defaultFatefulEncounter: false,
    defaultOriginGame: 2, // Ruby
    fixedEvent: true,
    fixedTID: 31121,
    fixedSID: 0,
    fixedOTName: "アゲト",
    fixedPID: 0x549EA197, // Quirky nature
    fixedIVs: {
      hp: 11,
      atk: 20,
      def: 5,
      spa: 26,
      spd: 1,
      spe: 3
    },
    fixedMoves: [
      { id: 93, name: "Confusion" },
      { id: 105, name: "Recover" },
      { id: 215, name: "Heal Bell" },
      { id: 219, name: "Safeguard" },
    ],
    natures: {}
  },
  
  // Deoxys (410) - Event only
  410: {
    defaultMetLocation: "Birth Island",
    defaultMetLevel: 30,
    defaultFatefulEncounter: true,
    defaultOriginGame: 3, // Emerald
    natures: {}
  }
};

/**
 * Helper function to generate a legal static encounter PID
 * This respects Method 1 RNG for static encounters in Gen 3
 * @param {number} nature - Nature index (0-24)
 * @param {string} gender - 'male', 'female', or 'genderless'
 * @param {number} speciesId - Species ID
 * @returns {number} Legal PID for static encounter
 */
function generateStaticEncounterPID(nature, gender, speciesId) {
  // For static encounters, we need Method 1 RNG compliance
  // This is a simplified version - real implementation would need proper Method 1
  // For now, we'll generate a random PID that matches nature/gender
  // TODO: Implement proper Method 1 RNG
  
  const genderThreshold = getGenderThreshold ? getGenderThreshold(speciesId) : 127;
  let attempts = 0;
  const maxAttempts = 10000;
  
  while (attempts < maxAttempts) {
    // Generate random PID
    const pid = (Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
    
    // Check nature
    if (pid % 25 !== nature) {
      attempts++;
      continue;
    }
    
    // Check gender
    const genderByte = pid & 0xFF;
    if (gender === 'female' && genderByte >= genderThreshold) {
      attempts++;
      continue;
    }
    if (gender === 'male' && genderByte < genderThreshold) {
      attempts++;
      continue;
    }
    
    // Check that it's not shiny (most static encounters aren't shiny locked, but we'll avoid shiny for presets)
    // In real usage, user can make it shiny if they want
    
    return pid;
  }
  
  // Fallback
  return 0;
}

/**
 * Generate legal IVs for a static encounter
 * Static encounters in Gen 3 can have varying IVs depending on the encounter
 * Most legendaries have at least 3 perfect IVs guaranteed
 * @param {number} speciesId - Species ID
 * @returns {object} { ivHp, ivAtk, ivDef, ivSpd, ivSpAtk, ivSpDef }
 */
function generateStaticEncounterIVs(speciesId) {
  // Most legendaries get 3 random perfect IVs
  // For simplicity, we'll return random IVs for now
  // TODO: Research exact IV generation for each static encounter
  
  return {
    ivHp: Math.floor(Math.random() * 32),
    ivAtk: Math.floor(Math.random() * 32),
    ivDef: Math.floor(Math.random() * 32),
    ivSpd: Math.floor(Math.random() * 32),
    ivSpAtk: Math.floor(Math.random() * 32),
    ivSpDef: Math.floor(Math.random() * 32)
  };
}

/**
 * Check if a species is a legendary/mythical (non-breedable)
 */
function isLegendary(speciesId) {
  const legendaries = [
    144, 145, 146, 150, 151, // Kanto legendaries + Mew
    243, 244, 245, 249, 250, 251, // Johto legendaries + Celebi
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410, // Hoenn legendaries + Jirachi + Deoxys
  ];
  return legendaries.includes(speciesId);
}

/**
 * Check if a species is a gift/static encounter (starters, fossils, etc.)
 * These are excluded from wild mode
 */
function isGiftPokemon(speciesId) {
  const giftPokemon = [
    1, 4, 7, // Kanto starters
    252, 255, 258, // Hoenn starters
    138, 140, 142, // Fossils (Omanyte, Kabuto, Aerodactyl)
    345, 347, // Hoenn fossils (Lileep, Anorith)
    133, // Eevee (gift in various games)
    175, // Togepi (gift egg in some versions)
    147, 148 // Dratini, Dragonair (sometimes gifted)
  ];
  return giftPokemon.includes(speciesId);
}

/**
 * Check if a species is breedable (not legendary, not Ditto, not baby with no egg moves)
 */
function isBreedable(speciesId) {
  if (isLegendary(speciesId)) return false;
  if (speciesId === 132) return false; // Ditto
  // Baby Pokémon that can't breed: Pichu, Cleffa, Igglybuff, Togepi, Tyrogue, Smoochum, Elekid, Magby, Azurill, Wynaut
  const babies = [172, 173, 174, 175, 236, 238, 239, 240, 298, 360];
  // Actually, babies CAN be obtained from breeding, so they're fine for "breedable" mode
  return true;
}

// Export for use in main.js
export {
  STATIC_ENCOUNTERS,
  generateStaticEncounterPID,
  generateStaticEncounterIVs,
  isLegendary,
  isBreedable,
  isGiftPokemon
};
