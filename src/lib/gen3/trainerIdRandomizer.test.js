import assert from 'node:assert/strict';
import { canRandomizeTrainerIds, generateTrainerId, MAX_TRAINER_ID_SECONDS } from './trainerIdRandomizer.js';
import { isValidRSTrainerId } from './rsTrainerId.js';
import { isValidGCTidSid } from '../../data/shadowEncounters.gen3.js';

// Independent, full-precision reference to catch signed/float multiplication
// errors and the different order of trainer-ID draws in the two GBA paths.
const next = seed => Number((BigInt(seed) * 0x41C64E6Dn + 0x6073n) & 0xffffffffn);
const fps = 16777216 / 280896;
const minimumSeconds = { 1: 60, 2: 60, 3: 10, 4: 30, 5: 30 };
for (const gameId of [1, 2, 3, 4, 5]) {
  for (const seedDraw of [0, 0.25, 0.5, 1 - Number.EPSILON]) {
    for (const timeDraw of [0, 0.5, 1 - Number.EPSILON, 1]) {
      const draws = [seedDraw, timeDraw];
      const result = generateTrainerId(gameId, { random: () => draws.shift() });
      assert.equal(draws.length, 0);
      assert(result.tid >= 0 && result.tid <= 65535);
      assert(result.sid >= 0 && result.sid <= 65535);
      assert(result.seconds >= minimumSeconds[gameId]);
      assert(result.seconds <= MAX_TRAINER_ID_SECONDS);
      let state = result.initialSeed;
      for (let i = 0; i < result.advances; i++) state = next(state);
      assert.equal(result.originSeed, state);
      state = next(state);
      assert.equal(result.sid, state >>> 16);
      assert.equal(result.tid, gameId <= 2 ? next(state) >>> 16 : result.initialSeed);
      if (gameId <= 2) assert(isValidRSTrainerId(result.tid, result.sid));
    }
  }
  const draws = [0.5, 0.5];
  const typical = generateTrainerId(gameId, { random: () => draws.shift() });
  assert(typical.seconds < minimumSeconds[gameId] + 60, 'median favors short intros');
}

for (let i = 0; i <= 64; i++) {
  const result = generateTrainerId(15, { random: () => Math.min(i / 64, 1 - Number.EPSILON) });
  assert(isValidGCTidSid(result.tid, result.sid), 'GameCube pairs must pass the full name-screen rule');
}
assert.throws(() => generateTrainerId(0), RangeError);

const editable = { encounterMode: 'wild', gameId: 3 };
for (const encounterMode of ['wild', 'hatched', 'static', 'roamer', 'cxd_shadow', 'imported']) {
  assert(canRandomizeTrainerIds({ ...editable, encounterMode }));
}
for (const encounterMode of ['mystery', 'cxd_trade', '', 'unknown']) {
  assert(!canRandomizeTrainerIds({ ...editable, encounterMode }));
}
for (const locks of [{ tidLocked: true }, { sidLocked: true }, { gameId: 0 }]) {
  assert(!canRandomizeTrainerIds({ ...editable, ...locks }));
}
for (const encounter of [{ tid: 0 }, { fixedTID: 0 }, { fixedSID: 0 }, { pidType: 'CXD_XD_STARTER' }, { pidType: 'CXD_COLO_STARTER' }]) {
  assert(!canRandomizeTrainerIds({ ...editable, encounter }));
}

console.log('Trainer-ID randomizer tests passed');
