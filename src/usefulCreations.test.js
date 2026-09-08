import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  USEFUL_CREATIONS,
  generateUsefulCreationCode,
  getUsefulCreationDevices,
  getUsefulCreationLanguages,
  getUsefulCreationsForSetup,
  normalizeUsefulCreationEk3,
} from './data/usefulCreations.gen3.js';
import { getAceCodeCharacterClass } from './lib/gen3/base64CodeDisplay.js';
import { parseBase64Emerald, parsePokemonBytes, toHexString } from './lib/gen3/builder.js';
import { getSelectOptionValue } from './usefulCreations.js';

const loadBinary = async sourceUrl => new Uint8Array(await readFile(sourceUrl));

assert.equal(getSelectOptionValue({ value: 'EM' }), 'EM');
assert.equal(getSelectOptionValue({ id: 'catching-smeargle' }), 'catching-smeargle');
assert.equal(getSelectOptionValue({}), '');

assert.deepEqual(getUsefulCreationDevices('R').map(option => option.value), ['modern']);
assert(getUsefulCreationDevices('FR').some(option => option.value === 'switch'));
assert(!getUsefulCreationLanguages('EM', 'myboy').some(option => option.value === 'jap'));
assert(!getUsefulCreationLanguages('FR', 'myboy').some(option => option.languageId === 1));
assert(getUsefulCreationLanguages('EM', 'modern').some(option => option.value === 'jap'));
assert(getUsefulCreationLanguages('FR', 'modern').some(option => option.value === 'jap1'));
assert.equal(getUsefulCreationsForSetup({ game: 'EM', device: 'modern', language: '' }).length, 0);
assert.equal(getUsefulCreationsForSetup({ game: 'EM', device: 'modern', language: 'eng' }).length, USEFUL_CREATIONS.length);

const emerald = await generateUsefulCreationCode('catching-smeargle', {
  game: 'EM',
  device: 'modern',
  language: 'eng',
});
const fireRed = await generateUsefulCreationCode('catching-smeargle', {
  game: 'FR',
  device: 'modern',
  language: 'eng1',
});
const japanese = await generateUsefulCreationCode('catching-smeargle', {
  game: 'EM',
  device: 'modern',
  language: 'jap',
});
assert.notEqual(emerald.text, fireRed.text);
assert.equal(japanese.text.includes('（'), false);
assert.match(japanese.text, /[Ａ-Ｚａ-ｚ０-９]/);
assert.equal(emerald.text.split('\n').filter(line => /^\s*Box \d+:/.test(line)).length, 14);

for (const generated of [emerald, fireRed, japanese]) {
  assert.match(generated.text, /^Box names \(BASE64\):/);
  assert.equal((generated.text.match(/Box\s+\d+:/g) || []).length, 14);
}
assert.notEqual(emerald.text, japanese.text);
const parsedCatchingSmeargle = parsePokemonBytes(toHexString(parseBase64Emerald(emerald.text).bytes));
assert.equal(parsedCatchingSmeargle.speciesId, 235);
assert.deepEqual(parsedCatchingSmeargle.moves, [147, 206, 212, 230]);

for (const creation of USEFUL_CREATIONS) {
  for (const setup of [
    { game: 'EM', device: 'modern', language: 'eng' },
    { game: 'EM', device: 'modern', language: 'jap' },
    { game: 'FR', device: 'switch', language: 'eng10' },
    { game: 'S', device: 'modern', language: 'ger0' },
  ]) {
    if (!getUsefulCreationsForSetup(setup).some(option => option.id === creation.id)) continue;
    const generated = await generateUsefulCreationCode(creation.id, setup, { loadBinary });
    assert.equal((generated.text.match(/Box\s+\d+:/g) || []).length, 14);
  }
}

const spgthCases = [
  ...[
    ['eng', 'en'], ['spa', 'es'], ['fra', 'fr'], ['ita', 'it'], ['ger', 'de'], ['jap', 'jp'],
  ].map(([language, suffix]) => ({
    setup: { game: 'EM', device: 'modern', language },
    file: `sprite_Emerald_${suffix}.ek3`,
  })),
  ...['FR', 'LG'].flatMap(game => {
    const gameName = game === 'FR' ? 'FireRed' : 'LeafGreen';
    return [
      ['eng0', 'en'], ['eng1', 'en_1'], ['spa', 'es'], ['fra', 'fr'],
      ['ita', 'it'], ['ger', 'de'], ['jap0', 'jp'], ['jap1', 'jp_1'],
    ].map(([language, suffix]) => ({
      setup: { game, device: 'modern', language },
      file: `grab_${gameName}_${suffix}.ek3`,
    }));
  }),
  ...['FR', 'LG'].flatMap(game => {
    const gameName = game === 'FR' ? 'FireRed' : 'LeafGreen';
    return [
      ['eng10', 'en'], ['spa10', 'es'], ['fra10', 'fr'], ['ita10', 'it'], ['ger10', 'de'],
    ].map(([language, suffix]) => ({
      setup: { game, device: 'switch', language },
      file: `grab_${gameName}Switch_${suffix}.ek3`,
    }));
  }),
];

function toAsciiKeyboardCode(text) {
  return String(text).replace(/[Ａ-Ｚａ-ｚ０-９]/g, character =>
    String.fromCharCode(character.charCodeAt(0) - 0xFEE0));
}

assert.equal(spgthCases.length, 32);
for (const testCase of spgthCases) {
  let sourceBytes;
  let loadedUrl;
  const generated = await generateUsefulCreationCode(
    'spgth-read-all-pokemon-data',
    testCase.setup,
    {
      loadBinary: async sourceUrl => {
        loadedUrl = sourceUrl;
        sourceBytes = await loadBinary(sourceUrl);
        return sourceBytes;
      },
    },
  );
  assert.equal(path.basename(decodeURIComponent(loadedUrl.pathname)), testCase.file);
  assert.equal(sourceBytes.length, 160);
  assert.deepEqual(generated.bytes, normalizeUsefulCreationEk3(sourceBytes));
  const decoded = parseBase64Emerald(toAsciiKeyboardCode(generated.text)).bytes;
  assert.deepEqual(decoded, generated.bytes);
  assert.equal((generated.text.match(/Box\s+\d+:/g) || []).length, 14);
}
assert.equal(getAceCodeCharacterClass('A'), 'code-char-upper');
assert.equal(getAceCodeCharacterClass('a'), 'code-char-lower');
assert.equal(getAceCodeCharacterClass('1'), 'code-char-number');
assert.equal(getAceCodeCharacterClass('Ａ'), 'code-char-upper');

console.log('useful creations tests passed');
