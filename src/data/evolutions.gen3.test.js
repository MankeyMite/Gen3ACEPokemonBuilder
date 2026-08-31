import assert from 'node:assert/strict';

import {
  EVOLUTIONS,
  PRE_EVOLUTION_DETAILS,
  getMinimumHatchedLevel,
} from './evolutions.gen3.js';

const directHatchSpeciesIds = new Set([183, 202]); // Marill, Wobbuffet

assert.deepEqual(EVOLUTIONS[5][0], {
  evo: 6,
  method: 'EVO_LEVEL',
  param: 36,
});
assert.deepEqual(PRE_EVOLUTION_DETAILS[6], {
  pre: 5,
  method: 'EVO_LEVEL',
  param: 36,
});

assert.equal(getMinimumHatchedLevel(6, { directHatchSpeciesIds }), 36, 'Charizard evolves from Charmeleon at level 36');
assert.equal(getMinimumHatchedLevel(7, { directHatchSpeciesIds }), 5, 'Squirtle can hatch at level 5');
assert.equal(getMinimumHatchedLevel(8, { directHatchSpeciesIds }), 16, 'Wartortle evolves from Squirtle at level 16');
assert.equal(getMinimumHatchedLevel(9, { directHatchSpeciesIds }), 36, 'Blastoise evolves from Wartortle at level 36');
assert.equal(getMinimumHatchedLevel(169, { directHatchSpeciesIds }), 23, 'Crobat needs Golbat level 22 plus a friendship level-up');
assert.equal(getMinimumHatchedLevel(26, { directHatchSpeciesIds }), 6, 'Raichu needs Pikachu from Pichu plus a Thunder Stone');
assert.equal(getMinimumHatchedLevel(38, { directHatchSpeciesIds }), 5, 'Ninetales can evolve immediately from a level 5 Vulpix');
assert.equal(getMinimumHatchedLevel(94, { directHatchSpeciesIds }), 25, 'Gengar needs Haunter at level 25 plus a trade');
assert.equal(getMinimumHatchedLevel(184, { directHatchSpeciesIds }), 18, 'Azumarill can start from direct-hatched Marill in Gen 3');
assert.equal(getMinimumHatchedLevel(183, { directHatchSpeciesIds }), 5, 'Marill can hatch directly without Sea Incense');
assert.equal(getMinimumHatchedLevel(202, { directHatchSpeciesIds }), 5, 'Wobbuffet can hatch directly without Lax Incense');
assert.equal(getMinimumHatchedLevel(329, { directHatchSpeciesIds }), 6, 'Milotic needs one level-up after hatching Feebas with enough beauty');
assert.equal(getMinimumHatchedLevel(212, { directHatchSpeciesIds }), 5, 'Scizor can evolve immediately from a level 5 Scyther trade');

console.log('evolutions.gen3 minimum hatched level tests passed');
