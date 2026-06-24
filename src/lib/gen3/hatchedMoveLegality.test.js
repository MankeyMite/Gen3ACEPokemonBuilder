import assert from 'node:assert/strict';
import { LEARNSETS } from '../../data/learnsets.gen3.js';
import {
  getAllowedLevelUpMoveIdsForEncounter,
  shouldCapHatchedLevelUpMoves,
} from './hatchedMoveLegality.js';

const BULBASAUR = 1;
const MAGNEMITE = 81;
const STARYU = 120;
const BELDUM = 398;

const SOLAR_BEAM = 76;
const RECOVER = 105;
const LOCK_ON = 199;
const ZAP_CANNON = 192;

function allowedLevelUpMoves(speciesId, level, encounterMode = 'hatched') {
  return new Set(getAllowedLevelUpMoveIdsForEncounter(LEARNSETS[speciesId].l, {
    speciesId,
    encounterMode,
    pokemonLevel: level,
  }));
}

assert.equal(shouldCapHatchedLevelUpMoves(STARYU, 'hatched'), true, 'genderless Staryu should cap hatched level-up moves');
assert.equal(shouldCapHatchedLevelUpMoves(MAGNEMITE, 'hatched'), true, 'genderless Magnemite should cap hatched level-up moves');
assert.equal(shouldCapHatchedLevelUpMoves(BELDUM, 'hatched'), true, 'genderless Beldum should cap hatched level-up moves');
assert.equal(shouldCapHatchedLevelUpMoves(BULBASAUR, 'hatched'), false, 'normal two-parent hatch species should not cap level-up moves');

assert.equal(allowedLevelUpMoves(STARYU, 5).has(RECOVER), false, 'level 5 hatched Staryu should not allow Recover');
assert.equal(allowedLevelUpMoves(STARYU, 15).has(RECOVER), true, 'level 15 hatched Staryu should allow Recover');

assert.equal(allowedLevelUpMoves(MAGNEMITE, 31).has(LOCK_ON), false, 'level 31 hatched Magnemite should not allow Lock-On');
assert.equal(allowedLevelUpMoves(MAGNEMITE, 32).has(LOCK_ON), true, 'level 32 hatched Magnemite should allow Lock-On');
assert.equal(allowedLevelUpMoves(MAGNEMITE, 49).has(ZAP_CANNON), false, 'level 49 hatched Magnemite should not allow Zap Cannon');
assert.equal(allowedLevelUpMoves(MAGNEMITE, 50).has(ZAP_CANNON), true, 'level 50 hatched Magnemite should allow Zap Cannon');
assert.equal(
  getAllowedLevelUpMoveIdsForEncounter(LEARNSETS[MAGNEMITE].l, {
    speciesId: MAGNEMITE,
    encounterMode: 'hatched',
  }).includes(ZAP_CANNON),
  true,
  'default level 100 hatched Magnemite should allow Zap Cannon'
);

assert.equal(allowedLevelUpMoves(BULBASAUR, 5).has(SOLAR_BEAM), true, 'normal hatched Bulbasaur can inherit late level-up moves');
assert.equal(allowedLevelUpMoves(BULBASAUR, 5, 'wild').has(SOLAR_BEAM), false, 'non-hatched Bulbasaur still caps level-up moves by level');

console.log('All Gen 3 hatched move legality tests passed.');
