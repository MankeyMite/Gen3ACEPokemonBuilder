import assert from 'node:assert/strict';

import {
  getEncounterForSpecies,
  getGamesForStaticSpecies,
  getPreferredStaticOriginGame,
} from './staticEncounters.gen3.js';

assert.deepEqual(getGamesForStaticSpecies(145), [4, 5], 'Zapdos is only available in FireRed and LeafGreen');
assert.deepEqual(getGamesForStaticSpecies(406), [1, 2, 3], 'Rayquaza is available in Sapphire, Ruby, and Emerald');
assert.equal(getPreferredStaticOriginGame(145), 4, 'Zapdos defaults to FireRed because Emerald is unavailable');
assert.equal(getPreferredStaticOriginGame(406), 3, 'Rayquaza defaults to Emerald when available');

assert.equal(getEncounterForSpecies(145, 3)?.games.includes(3), false, 'Zapdos has no Emerald static encounter');
assert.equal(getEncounterForSpecies(145, 4)?.location, 142, 'Zapdos FireRed static encounter is Power Plant');
assert.equal(getEncounterForSpecies(406, 3)?.games.includes(3), true, 'Rayquaza has an Emerald static encounter');

console.log('staticEncounters.gen3 game availability tests passed');
