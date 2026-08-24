import assert from 'node:assert/strict';
import { applyLanguageTextLimits, getLanguageTextLimits } from './languageTextLimits.js';

assert.deepEqual(getLanguageTextLimits(1), { nickname: 5, otName: 5 });
assert.deepEqual(getLanguageTextLimits('2'), { nickname: 10, otName: 7 });

const japaneseNickname = { value: '1234567890', maxLength: 10 };
const japaneseOtName = { value: '1234567', maxLength: 7 };
applyLanguageTextLimits({
  languageId: 1,
  nicknameInput: japaneseNickname,
  otNameInput: japaneseOtName,
});
assert.deepEqual(japaneseNickname, { value: '12345', maxLength: 5 });
assert.deepEqual(japaneseOtName, { value: '12345', maxLength: 5 });

const englishNickname = { value: '1234567890', maxLength: 5 };
const englishOtName = { value: '1234567', maxLength: 5 };
applyLanguageTextLimits({
  languageId: 2,
  nicknameInput: englishNickname,
  otNameInput: englishOtName,
});
assert.deepEqual(englishNickname, { value: '1234567890', maxLength: 10 });
assert.deepEqual(englishOtName, { value: '1234567', maxLength: 7 });

console.log('language text-limit tests passed');
