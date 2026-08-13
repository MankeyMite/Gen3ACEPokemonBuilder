import assert from 'node:assert/strict';
import { getOtGenderLockPolicy } from './otGenderLocking.js';

for (const mysteryTag of ['WISHMKR_BEST', 'WISHMKR_SHINY']) {
  assert.deepEqual(
    getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag }),
    { locked: true, forcedGender: 'male' },
    `${mysteryTag} should be locked to its fixed male OT`,
  );
}

for (const mysteryTag of ['10ANNI', 'AURA_MEW', 'MITSURIN_CELEBI', 'CHANNEL_JIRACHI']) {
  assert.deepEqual(
    getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag }),
    { locked: true, forcedGender: '' },
    `${mysteryTag} should lock its preset or RNG-derived OT gender without overwriting it`,
  );
}

assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag: 'PCNY_WISH_EGGS' }),
  { locked: false, forcedGender: '' },
  'PCNY Wish Eggs should retain editable hatcher OT gender',
);
assert.deepEqual(
  getOtGenderLockPolicy({
    encounterMode: 'mystery',
    mysteryTag: 'CUSTOM_HATCHER_EVENT',
    mysteryUsesHatcherTrainerData: true,
  }),
  { locked: false, forcedGender: '' },
  'events using hatcher trainer data should retain editable OT gender',
);
assert.deepEqual(
  getOtGenderLockPolicy({
    encounterMode: 'mystery',
    mysteryTag: 'PCNY_EVOLUTION_PIKACHU',
    mysteryUsesRecipientOtGender: true,
  }),
  { locked: false, forcedGender: '' },
  'PCNY direct downloads should retain the recipient trainer gender',
);
assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag: 'BOX_EVENT', isEgg: false }),
  { locked: false, forcedGender: '' },
  'a hatched Pokémon Box gift should use editable hatcher OT gender',
);
assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag: 'BOX_EVENT', isEgg: true }),
  { locked: true, forcedGender: 'female' },
  'an unhatched Pokémon Box gift should use its fixed female event OT',
);
assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'mystery', mysteryTag: 'MITSURIN_CELEBI', manualOverride: true }),
  { locked: false, forcedGender: '' },
  'Manual Mode should unlock fixed Mystery Gift OT gender',
);

assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'cxd_trade', tradeOtGender: 1 }),
  { locked: true, forcedGender: 'female' },
  'female handheld trade OTs should remain fixed',
);
assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'cxd_trade', tradeOtGender: 0 }),
  { locked: true, forcedGender: 'male' },
  'male trade OTs should remain fixed',
);
assert.deepEqual(
  getOtGenderLockPolicy({ encounterMode: 'cxd_trade', tradeOtGender: 1, manualOverride: true }),
  { locked: false, forcedGender: '' },
  'Manual Mode should unlock trade OT gender',
);

console.log('OT gender locking tests passed');
