import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  NICKNAME_SOURCE,
  createNicknameState,
  shouldSynchronizeSpeciesNickname,
} from './nicknameLocalization.js';
import { getLocalizedSpeciesName } from '../data/localizedSpeciesNames.gen3.js';

const automaticBulbasaur = createNicknameState(NICKNAME_SOURCE.SPECIES_DEFAULT, 1);
assert.equal(shouldSynchronizeSpeciesNickname(automaticBulbasaur, 1, 'hatched'), true);
assert.equal(shouldSynchronizeSpeciesNickname(automaticBulbasaur, 2, 'hatched'), false);
assert.equal(
  shouldSynchronizeSpeciesNickname(createNicknameState(NICKNAME_SOURCE.USER, 1), 1, 'hatched'),
  false,
  'a user-edited nickname must survive a language change'
);
assert.equal(
  shouldSynchronizeSpeciesNickname(createNicknameState(NICKNAME_SOURCE.PRESET, 1), 1, 'mystery'),
  false,
  'an event-fixed nickname must survive a language change'
);
assert.equal(shouldSynchronizeSpeciesNickname(automaticBulbasaur, 1, 'imported'), false);
assert.equal(shouldSynchronizeSpeciesNickname(automaticBulbasaur, 1, 'cxd_trade'), false);

for (const [speciesId, expected] of [[25, 'ピカチュウ'], [151, 'ミュウ'], [175, 'トゲピー'], [409, 'ジラーチ']]) {
  const localized = getLocalizedSpeciesName(speciesId, 1);
  assert.equal(localized, expected);
  assert.ok(localized.length <= 5, `Japanese species nickname ${localized} must fit the five-character limit`);
}

const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');
assert.match(mainSource, /#nickname'\)\.addEventListener\('input', markNicknameAsUserEdited\)/);
assert.match(mainSource, /#language'\)\.addEventListener\('change',[\s\S]*?setLocalizedSpeciesNickname\(/);
assert.match(mainSource, /markNicknameAsImported\(data\.speciesId\)/);
assert.match(mainSource, /function setDistributionNicknameDefault\([\s\S]*?nickname !== undefined[\s\S]*?NICKNAME_SOURCE\.PRESET[\s\S]*?force: true/);
assert.match(mainSource, /function syncLanguageTextLimits\([\s\S]*?isJapanese \? 5 : 10[\s\S]*?isJapanese \? 5 : 7/);
assert.equal(
  (mainSource.match(/setDistributionNicknameDefault\(\{/g) || []).length,
  3,
  'the helper definition plus Mystery Gift and Colosseum\/XD preset calls must be present',
);

console.log('nicknameLocalization state tests passed');
