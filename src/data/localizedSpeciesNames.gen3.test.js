import assert from 'node:assert/strict';

import { CHAR_TABLE } from '../lib/gen3/encoding.js';
import { SPECIES } from './species.gen3.js';
import {
  SPECIES_NAMES_BY_LANGUAGE,
  getLocalizedSpeciesName,
} from './localizedSpeciesNames.gen3.js';

const supportedSpecies = SPECIES.filter(([speciesId, name]) => speciesId > 0 && !String(name).includes('?'));
const languageIds = [1, 2, 3, 4, 5, 7];

for (const [speciesId, englishName] of supportedSpecies) {
  for (const languageId of languageIds) {
    const name = getLocalizedSpeciesName(speciesId, languageId);
    assert.ok(name, `${englishName} is missing its language ${languageId} default name`);
    assert.equal(
      name,
      SPECIES_NAMES_BY_LANGUAGE[languageId][speciesId],
      `${englishName} language ${languageId} should use the internal-ID-indexed table`
    );
    assert.ok(
      name.length <= (languageId === 1 ? 5 : 10),
      `${englishName} language ${languageId} exceeds the Generation III name limit: ${name}`
    );
    for (const character of name) {
      assert.notEqual(
        CHAR_TABLE[character],
        undefined,
        `${englishName} language ${languageId} contains an unsupported character: ${character}`
      );
    }
  }
}

assert.deepEqual(
  languageIds.map(languageId => getLocalizedSpeciesName(1, languageId)),
  ['フシギダネ', 'BULBASAUR', 'BULBIZARRE', 'BULBASAUR', 'BISASAM', 'BULBASAUR']
);
assert.equal(getLocalizedSpeciesName(151, 1), 'ミュウ');
assert.equal(getLocalizedSpeciesName(277, 3), 'ARCKO', 'Treecko uses internal species ID 277');
assert.equal(getLocalizedSpeciesName(410, 1), 'デオキシス', 'Deoxys uses internal species ID 410');
assert.equal(getLocalizedSpeciesName(411, 5), 'PALIMPALIM', 'Chimecho uses internal species ID 411');
assert.equal(getLocalizedSpeciesName(252, 2), '', 'placeholder species must remain unnamed');

console.log('localizedSpeciesNames.gen3 data tests passed');
