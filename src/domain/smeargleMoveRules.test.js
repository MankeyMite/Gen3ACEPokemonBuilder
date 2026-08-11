import assert from 'node:assert/strict';
import { MOVES } from '../data/moves.gen3.js';
import {
  SKETCH_MOVE_ID,
  STRUGGLE_MOVE_ID,
  getDefaultMoveIdsForSpecies,
  getSelectableMovesForSpecies,
} from './smeargleMoveRules.js';

const ordinaryMovePool = [[33, 'Tackle']];
assert.strictEqual(
  getSelectableMovesForSpecies(1, ordinaryMovePool, MOVES),
  ordinaryMovePool,
  'ordinary species should keep their existing filtered move pool',
);

const smeargleMoves = getSelectableMovesForSpecies(235, ordinaryMovePool, MOVES);
assert.equal(smeargleMoves.length, MOVES.length - 1);
assert.ok(smeargleMoves.some(([moveId]) => moveId === SKETCH_MOVE_ID));
assert.ok(smeargleMoves.some(([, moveName]) => moveName === 'Spore'));
assert.ok(smeargleMoves.some(([, moveName]) => moveName === 'Psycho Boost'));
assert.ok(
  !smeargleMoves.some(([moveId]) => moveId === STRUGGLE_MOVE_ID),
  'Struggle cannot be learned through Sketch',
);

assert.deepEqual(getDefaultMoveIdsForSpecies(235), [SKETCH_MOVE_ID, 0, 0, 0]);
assert.equal(getDefaultMoveIdsForSpecies(1), null);

console.log('All Smeargle move rule tests passed.');
