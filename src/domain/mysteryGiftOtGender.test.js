import assert from 'node:assert/strict';
import { getSeedDerivedMysteryOtGender } from './mysteryGiftOtGender.js';

function nextGen3LCRNG(seed) {
  return (Math.imul(seed >>> 0, 0x41C64E6D) + 0x6073) >>> 0;
}

function getReferenceRandS7Gender(originSeed) {
  let state = originSeed >>> 0;
  for (let call = 0; call < 5; call++) state = nextGen3LCRNG(state);
  return (((state >>> 23) & 1) ^ 1) === 1 ? 'female' : 'male';
}

let maleSeeds = 0;
let femaleSeeds = 0;

for (let originSeed = 0; originSeed <= 0xFFFF; originSeed++) {
  const expected = getReferenceRandS7Gender(originSeed);
  const actual = getSeedDerivedMysteryOtGender(
    'MITSURIN_CELEBI',
    'BACD_R_A',
    originSeed,
  );

  assert.equal(actual, expected, `Mitsurin OT gender differs for seed 0x${originSeed.toString(16).padStart(4, '0')}`);
  if (actual === 'female') femaleSeeds++;
  else maleSeeds++;
}

assert.ok(maleSeeds > 0, 'Mitsurin seeds should include male OT results');
assert.ok(femaleSeeds > 0, 'Mitsurin seeds should include female OT results');
assert.equal(
  getSeedDerivedMysteryOtGender('MITSURIN_CELEBI', 'BACD_R_A', 0x0E74),
  'female',
  'the reported 0x0E74 Mitsurin seed should use a female OT',
);
assert.equal(
  getSeedDerivedMysteryOtGender('MITSURIN_CELEBI', 'BACD_A', 0x0E74),
  'female',
  'the observed anti-shiny method alias should use the same OT gender',
);
assert.equal(
  getSeedDerivedMysteryOtGender('MITSURIN_CELEBI', 'BACD_R', 0x0E74),
  '',
  'an unrelated PID method should not apply Mitsurin RandS7 handling',
);
assert.equal(
  getSeedDerivedMysteryOtGender('WISHMKR_BEST', 'BACD_R_A', 0x0E74),
  '',
  'an unrelated event should not apply RandS7 handling',
);

console.log(`Mitsurin OT gender tests passed (65,536 seeds; ${maleSeeds} male, ${femaleSeeds} female).`);
