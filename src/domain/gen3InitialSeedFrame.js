const LCRNG_PREV_MULTIPLIER = 0xEEB9EB65;
const LCRNG_PREV_INCREMENT = 0x0A3561A1;
const DEFAULT_MAX_REVERSE_ADVANCES = 0x1000000;
const MINIMUM_BOOT_ADVANCES = 6 * 60;
const RS_DRY_BATTERY_SEED = 0x05A0;
const RS_DRY_BATTERY_MAX_ADVANCES = 0xFFFF << 2;

// LCRNG jump constants used by PKHeX's logarithmic seed-distance routine.
const LCRNG_JUMP_MULTIPLIERS = [
  0x41C64E6D, 0xC2A29A69, 0xEE067F11, 0xCFDDDF21,
  0x5F748241, 0x8B2E1481, 0x76006901, 0x1711D201,
  0xBE67A401, 0xDDDF4801, 0x3FFE9001, 0x90FD2001,
  0x65FA4001, 0xDBF48001, 0xF7E90001, 0xEFD20001,
  0xDFA40001, 0xBF480001, 0x7E900001, 0xFD200001,
  0xFA400001, 0xF4800001, 0xE9000001, 0xD2000001,
  0xA4000001, 0x48000001, 0x90000001, 0x20000001,
  0x40000001, 0x80000001, 0x00000001, 0x00000001,
];

const LCRNG_JUMP_INCREMENTS = [
  0x00006073, 0xE97E7B6A, 0x31B0DDE4, 0x67DBB608,
  0xCBA72510, 0x1D29AE20, 0xBA84EC40, 0x79F01880,
  0x08793100, 0x6B566200, 0x803CC400, 0xA6B98800,
  0xE6731000, 0x30E62000, 0xF1CC4000, 0x23988000,
  0x47310000, 0x8E620000, 0x1CC40000, 0x39880000,
  0x73100000, 0xE6200000, 0xCC400000, 0x98800000,
  0x31000000, 0x62000000, 0xC4000000, 0x88000000,
  0x10000000, 0x20000000, 0x40000000, 0x80000000,
];

function reverseLcrng(seed) {
  return (Math.imul(seed, LCRNG_PREV_MULTIPLIER) + LCRNG_PREV_INCREMENT) >>> 0;
}

/** Return the number of LCRNG advances from startSeed to endSeed. */
export function getGen3LcrngDistance(startSeed, endSeed) {
  let seed = Number(startSeed) >>> 0;
  const end = Number(endSeed) >>> 0;
  let distance = 0;
  let bit = 1;

  for (let index = 0; index < 32 && seed !== end; index++) {
    if (((seed ^ end) & bit) !== 0) {
      seed = (Math.imul(seed, LCRNG_JUMP_MULTIPLIERS[index]) + LCRNG_JUMP_INCREMENTS[index]) >>> 0;
      distance = (distance | bit) >>> 0;
    }
    bit = (bit << 1) >>> 0;
  }

  return seed === end ? distance : null;
}

/**
 * Reverse to the nearest 16-bit initial seed, optionally requiring enough
 * advances for the game to have completed its boot sequence.
 */
export function findNearestGen3InitialSeedFrame(
  originSeed,
  maxAdvances = DEFAULT_MAX_REVERSE_ADVANCES,
  minimumAdvances = 0,
) {
  let seed = Number(originSeed) >>> 0;
  const limit = Math.max(0, Number(maxAdvances) || 0);
  const minimum = Math.max(0, Number(minimumAdvances) || 0);

  for (let advances = 0; advances <= limit; advances++) {
    if (advances >= minimum && (seed >>> 16) === 0) {
      return { initialSeed: seed, advances, frame: advances + 1 };
    }
    seed = reverseLcrng(seed);
  }

  return null;
}

/** Match PKHeX's Generation III initial-seed and one-indexed frame display. */
export function getPkhexGen3InitialSeedFrame(seed, gameId) {
  const targetSeed = Number(seed) >>> 0;
  const version = Number(gameId) || 0;

  // Emerald normally starts from zero. PKHeX handles the separate New Game /
  // Elite Four seed as an additional display value, not as this initial frame.
  if (version === 3) {
    const advances = getGen3LcrngDistance(0, targetSeed);
    return advances === null ? null : { initialSeed: 0, advances, frame: advances + 1 };
  }

  const nearest = findNearestGen3InitialSeedFrame(
    targetSeed,
    DEFAULT_MAX_REVERSE_ADVANCES,
    MINIMUM_BOOT_ADVANCES,
  );
  if (!nearest) return null;

  // Ruby/Sapphire can use the fixed dry-battery startup seed when it gives a
  // reasonably short route, which PKHeX prefers over the nearest 16-bit seed.
  if (version === 1 || version === 2) {
    const advances = getGen3LcrngDistance(RS_DRY_BATTERY_SEED, targetSeed);
    if (advances !== null && advances < RS_DRY_BATTERY_MAX_ADVANCES) {
      return { initialSeed: RS_DRY_BATTERY_SEED, advances, frame: advances + 1 };
    }
  }

  return nearest;
}

export function getGen3ResultFrame(result, options = {}) {
  if (!/^H[124]$/.test(String(result?.method || '').toUpperCase())) return null;

  // PKHeX displays a valid wild slot from the seed that starts the encounter
  // routine. Static/roamer results instead use the PID/IV origin seed.
  const encounterSeed = options.encounterMode === 'wild' ? result?.initSeed : undefined;
  const hasEncounterSeed = encounterSeed !== null && encounterSeed !== undefined &&
    Number.isFinite(Number(encounterSeed));
  const seed = hasEncounterSeed
    ? encounterSeed
    : (result?.originSeed ?? result?.seed);
  if (!Number.isFinite(Number(seed))) return null;

  return getPkhexGen3InitialSeedFrame(seed, options.gameId);
}
