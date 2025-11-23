/**
 * Legendary Pokemon PID and IV presets for Gen 3
 * These are legal PIDs for static legendary encounters in RSE/FRLG
 * Data imported from PID presets gen 3.json
 */

// PID presets for each nature (RSE/FRLG legendaries)
// Indexed by Gen 3 nature order (0-24)
const LEGENDARY_PIDS_RSE = {
  0: 0xC36540B9,  // Hardy
  1: 0x51065B8F,  // Lonely
  2: 0x70B0CE0D,  // Brave
  3: 0x3F6A3D8A,  // Adamant
  4: 0x81A0A98D,  // Naughty
  5: 0x45EEFCF6,  // Bold
  6: 0xE85091A9,  // Docile
  7: 0x455D4A0B,  // Relaxed
  8: 0x77452EC2,  // Impish
  9: 0x8F77AD7C,  // Lax
  10: 0xE955D07C, // Timid
  11: 0x6463B3AD, // Hasty
  12: 0xBF9C4083, // Serious
  13: 0x67A6D16E, // Jolly
  14: 0xB074A070, // Naive
  15: 0x86E5C0AF, // Modest
  16: 0xE46333AD, // Mild
  17: 0x99CA26F4, // Quiet
  18: 0x0F772D7C, // Bashful
  19: 0xA0698B46, // Rash
  20: 0x8CBCA403, // Calm
  21: 0xD37055E4, // Gentle
  22: 0x936DF94D, // Sassy
  23: 0x30742070, // Careful
  24: 0x45D75A5A  // Quirky
};

// PID presets for Colosseum/XD legendaries (Raikou, Entei, Suicune, Lugia, Ho-Oh)
// These use a different RNG method than RSE/FRLG
// Indexed by Gen 3 nature order (0-24)
const LEGENDARY_PIDS_COLOSSEUM_XD = {
  0: 0x0D94218D,  // Hardy
  1: 0x760ED664,  // Lonely
  2: 0x1A684F2B,  // Brave
  3: 0x53505668,  // Adamant
  4: 0xE872003F,  // Naughty
  5: 0xA8B2BE45,  // Bold
  6: 0x083B4159,  // Docile
  7: 0x34D8B012,  // Relaxed
  8: 0xC53D9D8F,  // Impish
  9: 0x91C12658,  // Lax
  10: 0x883EC465, // Timid
  11: 0xE319200C, // Hasty
  12: 0x53C27594, // Serious
  13: 0x31D10483, // Jolly
  14: 0xB124F3FD, // Naive
  15: 0x5A134534, // Modest
  16: 0x8D94A18D, // Mild
  17: 0xD9F9515F, // Quiet
  18: 0xA947F413, // Bashful
  19: 0x43515EF2, // Rash
  20: 0x1E98B426, // Calm
  21: 0x44FAC407, // Gentle
  22: 0x883BC159, // Sassy
  23: 0xE6BCEF74, // Careful
  24: 0x6872803F  // Quirky
};

// IV descriptions for Colosseum/XD legendaries
// Indexed by Gen 3 nature order (0-24)
const LEGENDARY_IVS_DESCRIPTIONS_COLOSSEUM_XD = {
  0: "max",                      // Hardy
  1: "30 sp.def, 30 spe",       // Lonely
  2: "6 spe",                    // Brave
  3: "25 sp.atk",                // Adamant
  4: "max",                      // Naughty
  5: "12 atk",                   // Bold
  6: "30 spe",                   // Docile
  7: "4 spe",                    // Relaxed
  8: "23 sp.atk",                // Impish
  9: "30 atk, 30 sp.def",       // Lax
  10: "6 atk",                   // Timid
  11: "31 spe",                  // Hasty
  12: "30 sp.def, 30 spe",      // Serious
  13: "21 sp.atk",               // Jolly
  14: "30 sp.def",               // Naive
  15: "4 atk",                   // Modest
  16: "max",                     // Mild
  17: "4 spe",                   // Quiet
  18: "30 spe",                  // Bashful
  19: "max",                     // Rash
  20: "5 atk",                   // Calm
  21: "30 atk, 30 sp.atk",      // Gentle
  22: "30 spe",                  // Sassy
  23: "27 sp.atk",               // Careful
  24: "max"                      // Quirky
};

/**
 * Parse IV string descriptions into actual IV values
 * Examples: "max" -> all 31s, "30 sp.atk" -> sp.atk is 30, rest are 31, "24 sp.atk" -> sp.atk is 24, rest are 31
 * For legendaries, unspecified IVs default to 31 (not random)
 */
function parseIVString(ivString) {
  // Default all IVs to 31 for legendaries
  const ivs = {
    hp: 31,
    atk: 31,
    def: 31,
    spa: 31,
    spd: 31,
    spe: 31
  };

  if (ivString === "max") {
    return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  }

  // Parse patterns like "30 sp.atk, 30 spe"
  const parts = ivString.split(',').map(s => s.trim());
  
  for (const part of parts) {
    const match = part.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const value = parseInt(match[1]);
      const stat = match[2].toLowerCase();
      
      if (stat.includes('sp.atk') || stat.includes('spatk')) ivs.spa = value;
      else if (stat.includes('sp.def') || stat.includes('spdef')) ivs.spd = value;
      else if (stat === 'atk' || stat === 'attack') ivs.atk = value;
      else if (stat === 'def' || stat === 'defense') ivs.def = value;
      else if (stat === 'spe' || stat === 'speed') ivs.spe = value;
      else if (stat === 'hp') ivs.hp = value;
    }
  }

  return ivs;
}

// IV descriptions for RSE/FRLG legendaries
// Indexed by Gen 3 nature order (0-24)
const LEGENDARY_IVS_DESCRIPTIONS_RSE = {
  0: "30 sp.def, 30 spe",                       // Hardy
  1: "26 sp.atk",                                // Lonely
  2: "23 sp.atk, 0 spe",                        // Brave
  3: "24 sp.atk",                                // Adamant
  4: "30 atk, 30 def",                          // Naughty
  5: "14 atk",                                   // Bold
  6: "max",                                      // Docile
  7: "5 spe",                                    // Relaxed
  8: "25 sp.atk",                                // Impish
  9: "30 sp.atk, 30 spe",                       // Lax
  10: "7 atk",                                   // Timid
  11: "30 sp.def",                               // Hasty
  12: "30 def",                                  // Serious
  13: "29 sp.atk",                               // Jolly
  14: "30 sp.atk",                               // Naive
  15: "2 atk",                                   // Modest
  16: "30 sp.def",                               // Mild
  17: "30 sp.def, 30 spe",                      // Quiet
  18: "30 sp.atk, 30 spe",                      // Bashful
  19: "30 sp.atk, 30 spe",                      // Rash
  20: "0 atk",                                   // Calm
  21: "30 sp.def, 30 spe",                      // Gentle
  22: "3 spe",                                   // Sassy
  23: "30 sp.atk",                               // Careful
  24: "30 atk, 30 def, 30 sp.atk, 30 sp.def"   // Quirky
};

/**
 * Get legendary preset for a given nature
 * @param {number} natureIndex - Nature index (0-24)
 * @param {number} originGame - Origin game value (2=Ruby, 15=Colosseum/XD, etc.)
 * @returns {object} { pid, ivs }
 */
export function getLegendaryPreset(natureIndex, originGame = 2) {
  // Choose PID set and IV descriptions based on origin game
  let pidSet, ivDescriptions;
  
  if (originGame === 15) {
    // Colosseum/XD
    pidSet = LEGENDARY_PIDS_COLOSSEUM_XD;
    ivDescriptions = LEGENDARY_IVS_DESCRIPTIONS_COLOSSEUM_XD;
  } else {
    // RSE/FRLG (games 1-5)
    pidSet = LEGENDARY_PIDS_RSE;
    ivDescriptions = LEGENDARY_IVS_DESCRIPTIONS_RSE;
  }

  const pid = pidSet[natureIndex];
  const ivDescription = ivDescriptions[natureIndex];
  const ivs = parseIVString(ivDescription);

  return { pid, ivs };
}

/**
 * Check if a species is a Colosseum/XD exclusive legendary
 * (Legendary beasts need different PIDs for Colosseum/XD)
 */
export function isColosseumXDLegendary(speciesId) {
  // Raikou, Entei, Suicune, Lugia, Ho-Oh can be from Colosseum/XD
  return [243, 244, 245, 249, 250].includes(speciesId);
}

export { LEGENDARY_PIDS_RSE, LEGENDARY_IVS_DESCRIPTIONS_RSE, LEGENDARY_PIDS_COLOSSEUM_XD, LEGENDARY_IVS_DESCRIPTIONS_COLOSSEUM_XD };
