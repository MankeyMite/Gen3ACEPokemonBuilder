import assert from 'node:assert/strict';
import { WILD_ENCOUNTERS } from '../../data/wildEncounters.gen3.js';
import {
  HARDEN_MOVE_ID,
  getDirectWildMoveOverride,
} from './wildMoveLegality.js';

const DIRECT_WILD_COCOONS = [11, 14, 291, 293];

for (const speciesId of DIRECT_WILD_COCOONS) {
  assert.ok(WILD_ENCOUNTERS[speciesId], `${speciesId} should have a direct wild encounter`);
  assert.deepEqual(
    getDirectWildMoveOverride(speciesId, 'wild', Boolean(WILD_ENCOUNTERS[speciesId])),
    [HARDEN_MOVE_ID],
    `${speciesId} should be limited to Harden when directly caught in the wild`
  );
  assert.equal(
    getDirectWildMoveOverride(speciesId, 'hatched', Boolean(WILD_ENCOUNTERS[speciesId])),
    null,
    `${speciesId} should keep inherited move support when hatched`
  );
}

assert.equal(
  getDirectWildMoveOverride(291, 'wild', false),
  null,
  'an evolved-from-wild origin should not be treated as a direct wild encounter'
);
assert.equal(
  getDirectWildMoveOverride(12, 'wild', Boolean(WILD_ENCOUNTERS[12])),
  null,
  'ordinary evolved Pokémon should retain legal pre-evolution moves'
);

console.log('All Gen 3 direct wild move legality tests passed.');
