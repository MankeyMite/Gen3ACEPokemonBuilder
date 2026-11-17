import assert from 'node:assert/strict';
import {
  MEDIUM_FAST, ERRATIC, FLUCTUATING, MEDIUM_SLOW, FAST, SLOW,
  getExpGroup,
} from './expGroups.gen3.js';
import { SPECIES } from './species.gen3.js';
import { GROUP, expForLevel, levelForExp } from '../lib/exp.js';
import { resolveImportedProgression } from '../domain/importedPokemon.js';

const groups = [MEDIUM_FAST, ERRATIC, FLUCTUATING, MEDIUM_SLOW, FAST, SLOW];
for (const [speciesId, name] of SPECIES) {
  if (speciesId < 1 || name.includes('?')) continue;
  assert.equal(groups.flat().filter(id => id === speciesId).length, 1,
    `${name} must have exactly one experience group`);
}

// Gen III internal IDs: Clamperl/Huntail/Gorebyss are 373/374/375.
// Using the medium-fast fallback writes 125 EXP for level 5, which PKHeX
// reads as level 4 and cannot match to a hatched encounter.
for (const speciesId of [373, 374, 375]) {
  const group = getExpGroup(speciesId);
  assert.equal(group, GROUP.ERRATIC);
  assert.equal(expForLevel(group, 5), 237);
  assert.equal(levelForExp(group, 125), 4);
  assert.equal(resolveImportedProgression({ speciesId, totalExp: 237 }).level, 5);
}
assert.equal(getExpGroup(376), GROUP.MEDIUM_SLOW, 'Absol keeps its own curve');
assert.equal(getExpGroup(377), GROUP.FAST, 'Shuppet keeps its own curve');

console.log('experience group tests passed');
