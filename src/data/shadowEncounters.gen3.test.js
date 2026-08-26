import assert from 'node:assert/strict';

import { findValidGCShinySid, isValidGCTidSid } from './shadowEncounters.gen3.js';

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

const shinyPid = 0x12345678;
const shinySidResult = findValidGCShinySid(50328, shinyPid);
assert.ok(shinySidResult, 'Auto-Set should find a reachable shiny SID for the sample GameCube TID/PID');
assert.equal(
  isValidGCTidSid(50328, shinySidResult.sid),
  true,
  'the Auto-Set SID must be a reachable GameCube trainer-ID pair',
);
assert.ok(
  (((shinyPid >>> 16) ^ (shinyPid & 0xFFFF) ^ 50328 ^ shinySidResult.sid) & 0xFFFF) < 8,
  'the Auto-Set SID must make the selected PID shiny',
);

console.log('CXD trainer ID legality tests passed');
