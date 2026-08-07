import assert from 'node:assert/strict';
import {
  resolveImportedProgression,
  resolveShowdownAbilitySlot,
} from './importedPokemon.js';

assert.deepEqual(
  resolveImportedProgression({ speciesId: 248, level: null }),
  { level: 100, totalExp: 1250000, group: 5 },
  'a level-less Showdown Tyranitar must use Slow-group level-100 EXP',
);

assert.deepEqual(
  resolveImportedProgression({ speciesId: 248, level: 50 }),
  { level: 50, totalExp: 156250, group: 5 },
);

assert.deepEqual(
  resolveImportedProgression({ speciesId: 248, totalExp: 156251 }),
  { level: 50, totalExp: 156251, group: 5 },
  'raw imports must keep their exact stored EXP while deriving level from it',
);

assert.equal(resolveShowdownAbilitySlot(19, 'Guts'), 1, 'Rattata Guts is ability slot 1');
assert.equal(resolveShowdownAbilitySlot(19, 'Run Away'), 0, 'Rattata Run Away is ability slot 0');
assert.equal(resolveShowdownAbilitySlot(248, 'Sand Stream'), 0, 'single abilities use slot 0');
assert.equal(resolveShowdownAbilitySlot(19, 'Hustle'), 0, 'unavailable modern abilities fall back to legal slot 0');

console.log('imported Pokémon tests passed');
