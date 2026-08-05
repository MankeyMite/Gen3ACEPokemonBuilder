import assert from 'node:assert/strict';

import { isValidGCTidSid } from './shadowEncounters.gen3.js';

assert.equal(
  isValidGCTidSid(17560, 30071),
  false,
  'consecutive outputs that cannot be reached from the name screen must be rejected',
);
assert.equal(
  isValidGCTidSid(50328, 62839),
  true,
  'the corrected exact-IV Colosseum Espeon trainer pair must be accepted',
);
assert.equal(
  isValidGCTidSid(41, 51235),
  true,
  'a trainer pair produced from known reachable origin seed 1 must be accepted',
);

console.log('CXD trainer ID legality tests passed');
