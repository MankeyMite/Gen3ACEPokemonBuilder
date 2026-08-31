import assert from 'node:assert/strict';
import { MOVES as GEN3_MOVES } from '../data/moves.gen3.js';
import { SPECIES } from '../data/species.gen3.js';
import { LEARNSETS } from '../data/learnsets.gen3.js';
import { PRE_EVOLUTIONS } from '../data/evolutions.gen3.js';
import { CXD_SHADOW_ENCOUNTERS } from '../data/shadowEncounters.gen3.js';
import { CXD_SPECIAL_ENCOUNTERS } from '../data/cxdSpecialEncounters.gen3.js';
import { CXD_TRADE_ENCOUNTERS } from '../data/cxdTrades.gen3.js';
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

const moltres = LEARNSETS[146];
const moltresLegalMoveIds = new Set([
  ...getAllowedLevelUpMoveIdsForEncounter(moltres.d, {
    speciesId: 146,
    encounterMode: 'static',
    pokemonLevel: 50,
  }),
  ...moltres.t,
  ...moltres.u.filter(moveId => !moltres.x.includes(moveId)),
]);
const moltresHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  xdEncounterLists: [CXD_SHADOW_ENCOUNTERS, CXD_SPECIAL_ENCOUNTERS, CXD_TRADE_ENCOUNTERS],
  speciesId: 146,
  levelUpMoves: moltres.d,
  legalMoveIds: moltresLegalMoveIds,
  encounterMode: 'static',
  pokemonLevel: 50,
});
assert.ok(moltresHints.some(move => move.name === 'Will-O-Wisp' && move.hint === 'XD only'));

const chikorita = LEARNSETS[152];
const chikoritaLegalMoveIds = new Set([
  ...getAllowedLevelUpMoveIdsForEncounter(chikorita.d, {
    speciesId: 152,
    encounterMode: 'static',
    pokemonLevel: 5,
  }),
  ...chikorita.t,
  ...chikorita.u.filter(moveId => !chikorita.x.includes(moveId)),
]);
const chikoritaHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  xdEncounterLists: [CXD_SHADOW_ENCOUNTERS, CXD_SPECIAL_ENCOUNTERS, CXD_TRADE_ENCOUNTERS],
  speciesId: 152,
  levelUpMoves: chikorita.d,
  legalMoveIds: chikoritaLegalMoveIds,
  encounterMode: 'static',
  pokemonLevel: 5,
});
assert.ok(chikoritaHints.some(move => move.name === 'Frenzy Plant' && move.hint === 'XD only'));

const zigzagoon = LEARNSETS[288];
const ordinaryZigzagoonMoves = new Set([
  ...zigzagoon.d.map(([moveId]) => moveId),
  ...zigzagoon.e,
  ...zigzagoon.t,
  ...zigzagoon.u,
]);
assert.ok(!ordinaryZigzagoonMoves.has(245), 'Extreme Speed should remain a Pokémon Box-only move');

const boxEventContext = {
  species: SPECIES,
  mysteryEvents: {
    BOX_EVENT: { species: [358, 288, 315, 172] },
  },
  mysteryGifts: {},
  mysteryMovesets: {
    BOX_EVENT: {
      displayName: 'Box Event',
      moves: {
        Zigzagoon: [
          { name: 'Tackle', index: 33 },
          { name: 'Growl', index: 45 },
          { name: 'Tail Whip', index: 39 },
          { name: 'Extreme Speed', index: 245 },
        ],
      },
    },
  },
};
const zigzagoonHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  speciesId: 288,
  levelUpMoves: zigzagoon.d,
  legalMoveIds: ordinaryZigzagoonMoves,
  encounterMode: 'wild',
  pokemonLevel: 100,
  ...boxEventContext,
});
assert.ok(zigzagoonHints.some(move =>
  move.name === 'Extreme Speed' && move.hint === 'Pokémon Box event'
));

const linooneHints = getAlternativeMoveHints({
  moves: GEN3_MOVES,
  learnsets: LEARNSETS,
  preEvolutions: PRE_EVOLUTIONS,
  speciesId: 289,
  levelUpMoves: LEARNSETS[289].d,
  legalMoveIds: new Set(),
  encounterMode: 'wild',
  pokemonLevel: 100,
  ...boxEventContext,
});
assert.ok(linooneHints.some(move =>
  move.name === 'Extreme Speed' && move.hint === 'Pokémon Box event'
), 'event moves should remain discoverable after the distributed Pokémon evolves');

const gameCubeSourceHints = getAlternativeMoveHints({
  moves: [[0, '— None —'], [40, 'Sky Attack'], [50, 'Substitute']],
  learnsets: { 1: { d: [], e: [], t: [], u: [], x: [] } },
  preEvolutions: {},
  speciesId: 1,
  levelUpMoves: [],
  legalMoveIds: new Set(),
  encounterMode: 'wild',
  pokemonLevel: 100,
  xdEncounterLists: [[
    { species: 1, game: 'xd', moves: [40] },
    { species: 1, game: 'colo', eReader: true, moves: [50] },
  ]],
});
assert.ok(gameCubeSourceHints.some(move => move.id === 40 && move.hint === 'XD only'));
assert.ok(gameCubeSourceHints.some(move => move.id === 50 && move.hint === 'Colosseum e-Reader'));

console.log('Move discovery hint tests passed.');
