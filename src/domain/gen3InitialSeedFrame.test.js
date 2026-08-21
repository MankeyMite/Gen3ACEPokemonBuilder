import assert from 'node:assert/strict';
import {
  findNearestGen3InitialSeedFrame,
  getGen3LcrngDistance,
  getGen3ResultFrame,
  getPkhexGen3InitialSeedFrame,
} from './gen3InitialSeedFrame.js';

const advance = seed => (Math.imul(seed, 0x41C64E6D) + 0x6073) >>> 0;
const advanceBy = (initialSeed, count) => {
  let seed = initialSeed >>> 0;
  for (let i = 0; i < count; i++) seed = advance(seed);
  return seed;
};

assert.deepEqual(
  findNearestGen3InitialSeedFrame(0x000052D2),
  { initialSeed: 0x52D2, advances: 0, frame: 1 },
  'displayed RNG frames are one-indexed',
);
assert.deepEqual(
  findNearestGen3InitialSeedFrame(0x388A2E32),
  { initialSeed: 0x1D47, advances: 6085, frame: 6086 },
  'the nearest 16-bit initial seed should use reverse LCRNG frame counting',
);

const emeraldTarget = advanceBy(0, 1250);
assert.equal(getGen3LcrngDistance(0, emeraldTarget), 1250);
assert.deepEqual(
  getPkhexGen3InitialSeedFrame(emeraldTarget, 3),
  { initialSeed: 0, advances: 1250, frame: 1251 },
  'Emerald uses zero as its normal startup seed',
);

const rubyDryTarget = advanceBy(0x05A0, 900);
assert.deepEqual(
  getPkhexGen3InitialSeedFrame(rubyDryTarget, 2),
  { initialSeed: 0x05A0, advances: 900, frame: 901 },
  'Ruby/Sapphire prefer the short dry-battery seed route',
);

const wildEncounterSeed = advanceBy(0, 700);
const wildPidOriginSeed = advanceBy(wildEncounterSeed, 48);
assert.deepEqual(
  getGen3ResultFrame(
    { method: 'H1', seed: wildPidOriginSeed, initSeed: wildEncounterSeed },
    { gameId: 3, encounterMode: 'wild' },
  ),
  { initialSeed: 0, advances: 700, frame: 701 },
  'wild results count to the validated encounter seed rather than the later PID origin seed',
);
assert.deepEqual(
  getGen3ResultFrame(
    { method: 'H2', seed: wildPidOriginSeed, initSeed: wildEncounterSeed },
    { gameId: 3, encounterMode: 'static' },
  ),
  { initialSeed: 0, advances: 748, frame: 749 },
  'static results use the PID origin seed',
);

assert.equal(getGen3ResultFrame({ method: 'CXD', seed: 0x388A2E32 }), null);
assert.equal(getGen3ResultFrame({ method: 'BACD_R', seed: 0x0020 }), null);

console.log('Gen 3 initial-seed frame tests passed');
