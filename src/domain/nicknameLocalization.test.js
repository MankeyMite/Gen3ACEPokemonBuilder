import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  NICKNAME_SOURCE,
  createNicknameState,
  shouldSynchronizeSpeciesNickname,
} from './nicknameLocalization.js';

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

const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');
assert.match(mainSource, /#nickname'\)\.addEventListener\('input', markNicknameAsUserEdited\)/);
assert.match(mainSource, /#language'\)\.addEventListener\('change',[\s\S]*?setLocalizedSpeciesNickname\(/);
assert.match(mainSource, /markNicknameAsImported\(data\.speciesId\)/);

console.log('nicknameLocalization state tests passed');
