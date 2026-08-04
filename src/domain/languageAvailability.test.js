import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canSelectJapaneseLanguage } from './languageAvailability.js';

const mysteryGiftData = JSON.parse(await readFile(
  new URL('../data/Mystery gift pokemon gen 3.json', import.meta.url),
  'utf8',
));

const normalJapaneseOrigins = [
  'hatched',
  'wild',
  'static',
  'roamer',
  'cxd_shadow',
  'cxd_trade',
];

for (const encounterMode of normalJapaneseOrigins) {
  assert.equal(
    canSelectJapaneseLanguage({ encounterMode }),
    true,
    `${encounterMode} should allow Japanese language selection`,
  );
}

for (const tag of ['MITSURIN_CELEBI', 'AGETO_CELEBI']) {
  assert.equal(
    canSelectJapaneseLanguage({
      encounterMode: 'mystery',
      mysteryEvent: mysteryGiftData.events[tag],
    }),
    true,
    `${tag} should allow its Japanese language setting`,
  );
}

for (const tag of ['10ANNI', 'AURA_MEW', 'MYSTRY_MEW', 'CHANNEL_JIRACHI']) {
  assert.equal(
    canSelectJapaneseLanguage({
      encounterMode: 'mystery',
      mysteryEvent: mysteryGiftData.events[tag],
    }),
    false,
    `${tag} should retain its non-Japanese distribution restriction`,
  );
}

assert.equal(
  canSelectJapaneseLanguage({ encounterMode: 'static', manualOverride: false }),
  true,
  'static encounters should allow Japanese in Legal Mode',
);
assert.equal(
  canSelectJapaneseLanguage({ encounterMode: '', manualOverride: true }),
  true,
  'Manual Mode should allow Japanese before an origin is resolved',
);
assert.equal(
  canSelectJapaneseLanguage({ encounterMode: 'mystery', isEgg: true }),
  true,
  'the existing unhatched Egg override should continue to allow Japanese',
);

console.log('language availability tests passed');
