import assert from 'node:assert/strict';
import { getGenderThreshold } from './genderThresholds.gen3.js';

const SPECIES = {
  Kangaskhan: 115,
  Machop: 66,
  Rhyhorn: 111,
  Rhydon: 112,
  Miltank: 241,
  Larvitar: 246,
  Pupitar: 247,
  Tyranitar: 248,
  Latias: 407,
  Latios: 408,
  Marill: 183,
  Azumarill: 184,
  Azurill: 350,
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

assert.equal(getGenderThreshold(SPECIES.Kangaskhan), 255, 'Kangaskhan should be female-only');
assert.equal(getGenderThreshold(SPECIES.Miltank), 255, 'Miltank should be female-only');
assert.equal(getGenderThreshold(SPECIES.Latias), 255, 'Latias should be female-only');
assert.equal(getGenderThreshold(SPECIES.Latios), 0, 'Latios should be male-only');

assert.equal(getGenderThreshold(SPECIES.Azurill), 191, 'Azurill should use the 75% female threshold');
assert.equal(getGenderThreshold(SPECIES.Marill), 127, 'Marill should use the 50/50 threshold');
assert.equal(getGenderThreshold(SPECIES.Azumarill), 127, 'Azumarill should use the 50/50 threshold');
assert.equal(isFemalePidLowByte(0x000000A0, SPECIES.Azurill), true);
assert.equal(
  isFemalePidLowByte(0x000000A0, SPECIES.Marill),
  false,
  'the same PID can change displayed gender after Azurill evolves'
);

console.log('All Gen 3 gender threshold tests passed.');
