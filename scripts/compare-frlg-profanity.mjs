import { createProfanityFilter } from '../src/lib/profanityFilter.js';
import { PROFANITY_LIST } from '../src/data/profanity.gen3.js';
import { frlgProfanityFilter } from '../src/lib/frlgProfanityFilter.js';
import { HARDWARE_BLOCKED, HARDWARE_ALLOWED } from '../src/lib/fixtures/frlgProfanity.hardware.js';

const legacy = createProfanityFilter(PROFANITY_LIST);
const cases = [...HARDWARE_BLOCKED.map(input => [input, true]), ...HARDWARE_ALLOWED.map(input => [input, false])];
const differences = cases.flatMap(([input, hardwareBlocked]) => {
  const oldBlocked = legacy.check(input);
  const newBlocked = frlgProfanityFilter.check(input);
  return oldBlocked === newBlocked ? [] : [{ input, hardwareBlocked, oldBlocked, newBlocked }];
});
console.log(JSON.stringify({
  cases: cases.length,
  oldFalsePositives: cases.filter(([s, b]) => !b && legacy.check(s)).length,
  oldFalseNegatives: cases.filter(([s, b]) => b && !legacy.check(s)).length,
  newMismatches: cases.filter(([s, b]) => frlgProfanityFilter.check(s) !== b).map(([s]) => s),
  differences,
}, null, 2));
