import assert from 'node:assert/strict';

import {
  REGI_SPECIES_IDS,
  getEncounterForSpecies,
  getEncountersForSpeciesGame,
  getGamesForStaticSpecies,
  getPreferredStaticOriginGame,
  isRegiSpeciesId,
} from './staticEncounters.gen3.js';

assert.deepEqual(getGamesForStaticSpecies(145), [4, 5], 'Zapdos is only available in FireRed and LeafGreen');
assert.deepEqual(getGamesForStaticSpecies(406), [1, 2, 3], 'Rayquaza is available in Sapphire, Ruby, and Emerald');
assert.deepEqual(getGamesForStaticSpecies(410), [3, 4, 5], 'Birth Island Deoxys is only available in Emerald, FireRed, and LeafGreen');
assert.equal(getPreferredStaticOriginGame(145), 4, 'Zapdos defaults to FireRed because Emerald is unavailable');
assert.equal(getPreferredStaticOriginGame(406), 3, 'Rayquaza defaults to Emerald when available');

assert.equal(getEncounterForSpecies(145, 3)?.games.includes(3), false, 'Zapdos has no Emerald static encounter');
assert.equal(getEncounterForSpecies(145, 4)?.location, 142, 'Zapdos FireRed static encounter is Power Plant');
assert.equal(getEncounterForSpecies(406, 3)?.games.includes(3), true, 'Rayquaza has an Emerald static encounter');
assert.equal(getEncountersForSpeciesGame(410, 1).length, 0, 'Deoxys has no Sapphire Birth Island encounter');
assert.equal(getEncountersForSpeciesGame(410, 2).length, 0, 'Deoxys has no Ruby Birth Island encounter');
assert.equal(getEncountersForSpeciesGame(410, 3).length, 1, 'Deoxys has an Emerald Birth Island encounter');
assert.equal(getEncountersForSpeciesGame(410, 4).length, 1, 'Deoxys has a FireRed Birth Island encounter');
assert.equal(getEncountersForSpeciesGame(410, 5).length, 1, 'Deoxys has a LeafGreen Birth Island encounter');

assert.deepEqual([...REGI_SPECIES_IDS], [401, 402, 403], 'Regi species IDs should use internal Gen 3 IDs');
for (const speciesId of [377, 378, 379]) {
  assert.equal(isRegiSpeciesId(speciesId), false, `species ${speciesId} should not be treated as a Regi`);
}
for (const speciesId of [401, 402, 403]) {
  assert.equal(isRegiSpeciesId(speciesId), true, `species ${speciesId} should be treated as a Regi`);
}

console.log('staticEncounters.gen3 game availability tests passed');
