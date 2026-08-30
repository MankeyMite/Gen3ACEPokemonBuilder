import assert from 'node:assert/strict';
import { MOVES as GEN3_MOVES } from '../data/moves.gen3.js';
import { LEARNSETS } from '../data/learnsets.gen3.js';
import { PRE_EVOLUTIONS } from '../data/evolutions.gen3.js';
import { getAllowedLevelUpMoveIdsForEncounter } from '../lib/gen3/hatchedMoveLegality.js';
import { getAlternativeMoveHints, getEggMoveIdsForSpecies } from './moveDiscoveryHints.js';

const moves = [[0, '— None —'], [10, 'Scratch'], [20, 'Dragon Dance'], [30, 'Outrage'], [40, 'Sky Attack']];
const learnsets = {
  1: { e: [30], x: [40] },
  2: { e: [20], x: [] },
};
const preEvolutions = { 2: 1 };

assert.deepEqual([...getEggMoveIdsForSpecies(2, learnsets, preEvolutions)].sort((a, b) => a - b), [20, 30]);

const hints = getAlternativeMoveHints({
  moves,
  learnsets,
  preEvolutions,
  speciesId: 1,
  levelUpMoves: [[10, 1], [20, 55]],
  legalMoveIds: new Set([10]),
  encounterMode: 'wild',
  pokemonLevel: 23,
});

assert.deepEqual(hints.map(({ id, hint, disabled, group }) => ({ id, hint, disabled, group })), [
  { id: 20, hint: 'Level 55', disabled: true, group: 'Available with a different encounter' },
  { id: 30, hint: 'Egg move', disabled: true, group: 'Available with a different encounter' },
  { id: 40, hint: 'XD only', disabled: true, group: 'Available with a different encounter' },
]);

const hatchedHints = getAlternativeMoveHints({
  moves,
  learnsets,
  preEvolutions,
  speciesId: 1,
  levelUpMoves: [[10, 1]],
  legalMoveIds: new Set([10, 30]),
  encounterMode: 'hatched',
  pokemonLevel: 1,
});
assert.deepEqual(hatchedHints.map(({ id, hint }) => ({ id, hint })), [{ id: 40, hint: 'XD only' }]);

const bagon = LEARNSETS[395];
const bagonLegalMoveIds = new Set([
  ...getAllowedLevelUpMoveIdsForEncounter(bagon.d, {
    speciesId: 395,
    encounterMode: 'wild',
    pokemonLevel: 23,
  }),
  ...bagon.t,
  ...bagon.u.filter(moveId => !bagon.x.includes(moveId)),
]);
const bagonHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  speciesId: 395,
  levelUpMoves: bagon.d,
  legalMoveIds: bagonLegalMoveIds,
  encounterMode: 'wild',
  pokemonLevel: 23,
});
assert.ok(bagonHints.some(move => move.name === 'Ember' && move.hint === 'Level 25'));
assert.ok(bagonHints.some(move => move.name === 'Dragon Dance' && move.hint === 'Egg move'));

const pidgey = LEARNSETS[16];
const pidgeyLegalMoveIds = new Set([
  ...getAllowedLevelUpMoveIdsForEncounter(pidgey.d, {
    speciesId: 16,
    encounterMode: 'wild',
    pokemonLevel: 100,
  }),
  ...pidgey.t,
  ...pidgey.u.filter(moveId => !pidgey.x.includes(moveId)),
]);
const pidgeyHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  speciesId: 16,
  levelUpMoves: pidgey.d,
  legalMoveIds: pidgeyLegalMoveIds,
  encounterMode: 'wild',
  pokemonLevel: 100,
});
assert.ok(pidgeyHints.some(move => move.name === 'Sky Attack' && move.hint === 'XD only'));

console.log('Move discovery hint tests passed.');
