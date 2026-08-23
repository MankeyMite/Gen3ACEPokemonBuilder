export const WISHMKR_GANLON_BERRY_ID = 169;
export const WISHMKR_SALAC_BERRY_ID = 170;

const LCRNG_MULTIPLIER = 0x41C64E6D;
const LCRNG_INCREMENT = 0x6073;

function nextSeed(seed) {
  return (Math.imul(seed >>> 0, LCRNG_MULTIPLIER) + LCRNG_INCREMENT) >>> 0;
}

/**
 * WISHMKR generates PID high, PID low, IV1, IV2, then the held-item roll.
 * The fifth upper-16 RNG result selects Ganlon or Salac using the disc's
 * divide-by-three parity check.
 */
export function getWishmkrHeldItemId(originSeed) {
  if (originSeed === null || originSeed === undefined || originSeed === '') return null;

  const parsedSeed = Number(originSeed);
  if (!Number.isFinite(parsedSeed) || !Number.isInteger(parsedSeed)) return null;

  let seed = parsedSeed >>> 0;
  for (let call = 0; call < 5; call++) seed = nextSeed(seed);

  const itemRoll = seed >>> 16;
  return (Math.floor(itemRoll / 3) & 1) === 0
    ? WISHMKR_SALAC_BERRY_ID
    : WISHMKR_GANLON_BERRY_ID;
}
