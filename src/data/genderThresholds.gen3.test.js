import assert from 'node:assert/strict';
import { getGenderThreshold } from './genderThresholds.gen3.js';

const SPECIES = {
  Machop: 66,
  Rhyhorn: 111,
  Rhydon: 112,
  Larvitar: 246,
  Pupitar: 247,
  Tyranitar: 248,
};

function isFemalePidLowByte(pid, speciesId) {
  return (pid & 0xFF) < getGenderThreshold(speciesId);
}

assert.equal(getGenderThreshold(SPECIES.Larvitar), 127, 'Larvitar should use the 50/50 threshold');
assert.equal(getGenderThreshold(SPECIES.Pupitar), 127, 'Pupitar should use the 50/50 threshold');
assert.equal(getGenderThreshold(SPECIES.Tyranitar), 127, 'Tyranitar should use the 50/50 threshold');

assert.equal(getGenderThreshold(SPECIES.Rhyhorn), 127, 'Rhyhorn should use the 50/50 threshold');
assert.equal(getGenderThreshold(SPECIES.Rhydon), 127, 'Rhydon should use the 50/50 threshold');

assert.equal(
  isFemalePidLowByte(0x00000049, SPECIES.Larvitar),
  true,
  'Larvitar PID low byte 0x49 should evaluate as female'
);

assert.equal(getGenderThreshold(SPECIES.Machop), 63, 'Machop should keep the true 75% male threshold');

console.log('All Gen 3 gender threshold tests passed.');
