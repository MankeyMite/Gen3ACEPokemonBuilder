import {
  adjustShinySidForRSTrainerId,
  findNearestValidRSTrainerSid,
  generateValidRSTrainerId,
  isValidRSTrainerId,
} from './rsTrainerId.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

console.log('\n-- Ruby/Sapphire trainer ID legality --');

assert(isValidRSTrainerId(12345, 43244) === false, 'TID 12345 / SID 43244 is not R/S RNG-obtainable');
assert(isValidRSTrainerId(12346, 43244) === true, 'TID 12346 / SID 43244 is R/S RNG-obtainable');

const adjacent = adjustShinySidForRSTrainerId(0, 17, 17);
assert(adjacent.valid === true, 'adjacent R/S shiny SID adjustment should find a valid SID');
assert(adjacent.adjusted === true, 'adjacent R/S shiny SID adjustment should report adjustment');
assert(adjacent.direction === 1, 'adjacent R/S shiny SID adjustment should prefer +1 when valid');
assert(adjacent.sid === 18, 'adjacent R/S shiny SID adjustment should return SID 18');
assert(isValidRSTrainerId(0, adjacent.sid) === true, 'adjusted adjacent SID should be R/S valid');

const adjacentMinus = adjustShinySidForRSTrainerId(0, 15, 15);
assert(adjacentMinus.valid === true, 'adjacent R/S shiny SID adjustment should find -1 when +1 is not shiny');
assert(adjacentMinus.adjusted === true, 'adjacent -1 R/S shiny SID adjustment should report adjustment');
assert(adjacentMinus.direction === -1, 'adjacent R/S shiny SID adjustment should use -1 when +1 is not shiny');
assert(adjacentMinus.sid === 14, 'adjacent -1 R/S shiny SID adjustment should return SID 14');
assert(isValidRSTrainerId(0, adjacentMinus.sid) === true, 'adjusted -1 SID should be R/S valid');

const alreadyValid = adjustShinySidForRSTrainerId(12346, 0, 43244);
assert(alreadyValid.valid === true, 'already-valid R/S SID remains valid');
assert(alreadyValid.adjusted === false, 'already-valid R/S SID is not adjusted');
assert(alreadyValid.sid === 43244, 'already-valid R/S SID is preserved');

const nearestAlreadyValid = findNearestValidRSTrainerSid(12346, 43244);
assert(nearestAlreadyValid.valid === true, 'nearest SID lookup accepts an already-valid pair');
assert(nearestAlreadyValid.adjusted === false, 'nearest SID lookup preserves an already-valid SID');
assert(nearestAlreadyValid.sid === 43244, 'nearest SID lookup preserves SID 43244 for TID 12346');

const nearestFixed = findNearestValidRSTrainerSid(12345, 43244);
assert(nearestFixed.valid === true, 'nearest SID lookup finds a valid SID for fixed TID');
assert(nearestFixed.adjusted === true, 'nearest SID lookup adjusts invalid SID');
assert(isValidRSTrainerId(12345, nearestFixed.sid) === true, 'nearest SID lookup result is R/S valid');
assert(nearestFixed.sid !== 43244, 'nearest SID lookup changes only the invalid SID value');

for (let i = 0; i < 64; i++) {
  const { tid, sid, seed } = generateValidRSTrainerId();
  assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, `generated seed ${i} is uint32`);
  assert(isValidRSTrainerId(tid, sid) === true, `generated TID/SID pair ${i} is valid`);
}

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}

console.log(`${passed} passed`);
