import assert from 'node:assert/strict';
import { LEARNSETS } from '../../data/learnsets.gen3.js';
import { LEARNSETS_FIRE_RED } from '../../data/learnsets.frlg.js';
import { getDefaultLevelUpMoveIds } from './defaultLevelUpMoves.js';

assert.deepEqual(
  getDefaultLevelUpMoveIds(LEARNSETS[43].l, 20),
  [230, 77, 78, 79],
  'level 20 Oddish should load Sweet Scent, PoisonPowder, Stun Spore, and Sleep Powder',
);

assert.deepEqual(
  getDefaultLevelUpMoveIds(LEARNSETS[1].l, 5),
  [33, 45],
  'species with fewer than four learned moves should use only those moves',
);

assert.deepEqual(
  getDefaultLevelUpMoveIds(LEARNSETS[1].l, 20),
  [22, 77, 79, 75],
  'moves learned above the current level should be excluded',
);

assert.deepEqual(
  getDefaultLevelUpMoveIds([[10, 1], [20, 5], [10, 10], [30, 15]], 20),
  [20, 10, 30],
  'repeated moves should only occupy one slot at their latest learn point',
);

assert.notDeepEqual(
  getDefaultLevelUpMoveIds(LEARNSETS[4].l, 13),
  getDefaultLevelUpMoveIds(LEARNSETS_FIRE_RED[4], 13),
  'the helper should preserve origin-game-specific learnset differences supplied by the caller',
);

assert.deepEqual(getDefaultLevelUpMoveIds(null, 20), []);
assert.deepEqual(getDefaultLevelUpMoveIds(LEARNSETS[43].l, Number.NaN), []);

console.log('All default level-up move tests passed.');
