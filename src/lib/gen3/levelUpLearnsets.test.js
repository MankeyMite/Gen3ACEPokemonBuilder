import assert from 'node:assert/strict';
import { getDefaultLevelUpMoveIds } from './defaultLevelUpMoves.js';
import {
  GEN3_ORIGIN_GAME,
  getDirectLevelUpLearnsetForOriginGame,
  getLevelUpLearnsetForOriginGame,
} from './levelUpLearnsets.js';

const DEOXYS = 410;
const level50Defaults = game => getDefaultLevelUpMoveIds(
  getLevelUpLearnsetForOriginGame(DEOXYS, game),
  50,
);

assert.deepEqual(level50Defaults(GEN3_ORIGIN_GAME.SAPPHIRE), [322, 105, 354, 63]);
assert.deepEqual(level50Defaults(GEN3_ORIGIN_GAME.RUBY), [322, 105, 354, 63]);
assert.deepEqual(level50Defaults(GEN3_ORIGIN_GAME.EMERALD), [97, 105, 354, 245]);
assert.deepEqual(level50Defaults(GEN3_ORIGIN_GAME.FIRE_RED), [322, 192, 354, 63]);
assert.deepEqual(level50Defaults(GEN3_ORIGIN_GAME.LEAF_GREEN), [105, 354, 68, 243]);

const level30Defaults = game => getDefaultLevelUpMoveIds(
  getLevelUpLearnsetForOriginGame(DEOXYS, game),
  30,
);
assert.deepEqual(level30Defaults(GEN3_ORIGIN_GAME.SAPPHIRE), [282, 228, 94, 289]);
assert.deepEqual(level30Defaults(GEN3_ORIGIN_GAME.RUBY), [282, 228, 94, 289]);
assert.deepEqual(level30Defaults(GEN3_ORIGIN_GAME.EMERALD), [282, 228, 94, 129]);
assert.deepEqual(level30Defaults(GEN3_ORIGIN_GAME.FIRE_RED), [269, 228, 94, 276]);
assert.deepEqual(level30Defaults(GEN3_ORIGIN_GAME.LEAF_GREEN), [282, 191, 94, 289]);

assert.notStrictEqual(
  getLevelUpLearnsetForOriginGame(51, GEN3_ORIGIN_GAME.FIRE_RED),
  getLevelUpLearnsetForOriginGame(51, GEN3_ORIGIN_GAME.EMERALD),
  'FireRed Dugtrio should use the correctly parsed conditional FRLG override',
);
assert.deepEqual(
  getLevelUpLearnsetForOriginGame(43, GEN3_ORIGIN_GAME.RUBY),
  getLevelUpLearnsetForOriginGame(43, GEN3_ORIGIN_GAME.EMERALD),
  'species without an RS override should fall back to the Emerald base table',
);

const RATICATE = 20;
const directRaticateAt23 = getDefaultLevelUpMoveIds(
  getDirectLevelUpLearnsetForOriginGame(RATICATE, GEN3_ORIGIN_GAME.FIRE_RED),
  23,
);
assert.deepEqual(
  directRaticateAt23,
  [39, 98, 158, 184],
  'a directly encountered level-23 Raticate should use only Raticate level-up moves',
);
assert.equal(
  getDirectLevelUpLearnsetForOriginGame(RATICATE, GEN3_ORIGIN_GAME.FIRE_RED)
    .some(([moveId]) => moveId === 116),
  false,
  'direct Raticate must not inherit Rattata Focus Energy',
);
assert.equal(
  getLevelUpLearnsetForOriginGame(RATICATE, GEN3_ORIGIN_GAME.FIRE_RED)
    .some(([moveId]) => moveId === 116),
  true,
  'the merged table should retain pre-evolution moves for evolved/hatched paths',
);

console.log('All origin-game level-up learnset tests passed.');
