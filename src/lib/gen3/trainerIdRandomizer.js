// Trainer-ID generation follows the retail games' new-game routines:
// https://github.com/pret/pokeruby/blob/master/src/new_game.c
// https://github.com/pret/pokeemerald/blob/master/src/new_game.c
// https://github.com/pret/pokefirered/blob/master/src/new_game.c
// In Emerald/FRLG, main.c's SeedRngAndSetTrainerId stores the naming-screen
// timer as the TID and RNG seed. NewGameInitData later draws only the SID.
const GBA_FPS = 16777216 / 280896;
export const MAX_TRAINER_ID_SECONDS = 1000;

const TIMING = {
  1: { minimumSeconds: 60, scaleSeconds: 60 },
  2: { minimumSeconds: 60, scaleSeconds: 60 },
  3: { minimumSeconds: 10, scaleSeconds: 20 },
  4: { minimumSeconds: 30, scaleSeconds: 40 },
  5: { minimumSeconds: 30, scaleSeconds: 40 },
};

function gbaNext(seed) {
  return (Math.imul(seed, 0x41C64E6D) + 0x6073) >>> 0;
}

function gcNext(seed) {
  return (Math.imul(seed, 0x343FD) + 0x269EC3) >>> 0;
}

function sampleIntroAdvances(gameId, random) {
  const { minimumSeconds, scaleSeconds } = TIMING[gameId];
  const minimum = Math.ceil(minimumSeconds * GBA_FPS);
  const maximum = Math.floor(MAX_TRAINER_ID_SECONDS * GBA_FPS);
  // Truncated exponential: favor a short intro without an artificial pile-up
  // at the cap. This is a usability heuristic, not measured player behavior.
  const scale = scaleSeconds * GBA_FPS;
  const mass = -Math.expm1(-(maximum - minimum) / scale);
  const draw = random();
  if (draw >= 1) return maximum;
  return Math.min(maximum, minimum + Math.floor(-Math.log1p(-draw * mass) * scale));
}

export function canRandomizeTrainerIds({
  encounterMode, gameId, tidLocked = false, sidLocked = false, encounter = null,
} = {}) {
  if (!['wild', 'static', 'roamer', 'hatched', 'cxd_shadow', 'imported'].includes(encounterMode)) return false;
  if (![1, 2, 3, 4, 5, 15].includes(Number(gameId))) return false;
  if (tidLocked || sidLocked) return false;
  if (encounter?.tid !== undefined || encounter?.fixedTID !== undefined || encounter?.fixedSID !== undefined) return false;
  // GameCube starters must generate their trainer IDs, PID and IVs together.
  if (String(encounter?.pidType || '').includes('STARTER')) return false;
  return true;
}

export function generateTrainerId(gameId, { random = Math.random } = {}) {
  gameId = Number(gameId);
  if (gameId === 15) {
    let seed = Math.floor(random() * 0x100000000) >>> 0;
    // A run of four name-screen outputs above the threshold is a directly
    // reachable end seed under MethodCXD.IsValidNameScreenEndSeed. Construct
    // one before the game's 1,000-advance jump, rather than accepting arbitrary
    // consecutive outputs (which can fail the existing GameCube verifier).
    let run = 0;
    do {
      seed = gcNext(seed);
      run = (seed >>> 16) > 0x1999 ? run + 1 : 0;
    } while (run < 4);
    const nameScreenSeed = seed;
    for (let i = 0; i < 1000; i++) seed = gcNext(seed);
    const originSeed = seed;
    seed = gcNext(seed);
    const tid = seed >>> 16;
    seed = gcNext(seed);
    return { tid, sid: seed >>> 16, originSeed, nameScreenSeed };
  }
  if (!TIMING[gameId]) throw new RangeError(`Unsupported trainer-ID game: ${gameId}`);

  // Ruby/Sapphire boot from a 16-bit RTC seed. Emerald/FRLG reseed from the
  // 16-bit naming-screen timer, whose value also becomes the visible TID.
  const initialSeed = Math.floor(random() * 0x10000) & 0xffff;
  const advances = sampleIntroAdvances(gameId, random);
  let seed = initialSeed;
  for (let i = 0; i < advances; i++) seed = gbaNext(seed);
  const originSeed = seed;
  seed = gbaNext(seed);
  const sid = seed >>> 16;
  const tid = gameId <= 2 ? gbaNext(seed) >>> 16 : initialSeed;
  return { tid, sid, initialSeed, originSeed, advances, seconds: advances / GBA_FPS };
}
