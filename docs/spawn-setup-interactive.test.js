import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./spawn-setup-interactive.html', import.meta.url), 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

assert.ok(inlineScript, 'the interactive guide should contain its setup script');
assert.doesNotThrow(
  () => new Function(inlineScript),
  'the interactive guide setup script should be valid JavaScript',
);

const gameSelectorIndex = html.indexOf('id="gameSelect"');
const platformSelectorIndex = html.indexOf('id="deviceSelect"');
const languageSelectorIndex = html.indexOf('id="languageSelect"');
assert.ok(gameSelectorIndex >= 0, 'the game selector should exist');
assert.ok(
  gameSelectorIndex < platformSelectorIndex && platformSelectorIndex < languageSelectorIndex,
  'the selectors should be ordered game, platform/emulator, then language',
);

const gameSelectorMarkup = html.slice(
  html.lastIndexOf('<select', gameSelectorIndex),
  html.indexOf('</select>', gameSelectorIndex),
);
assert.doesNotMatch(gameSelectorMarkup, /FRSW|LGSW|FireRed Switch|LeafGreen Switch/);
assert.deepEqual(
  [...gameSelectorMarkup.matchAll(/<option value="([A-Z]+)"/g)].map((match) => match[1]),
  ['EM', 'FR', 'LG', 'R', 'S'],
  'the game selector should contain each base game exactly once',
);

const platformSelectorMarkup = html.slice(
  html.lastIndexOf('<select', platformSelectorIndex),
  html.indexOf('</select>', platformSelectorIndex),
);
assert.match(platformSelectorMarkup, /value="switch">Nintendo Switch/);
assert.match(platformSelectorMarkup, /value="modern">GBA \/ Nintendo DS \/ mGBA/);

assert.match(
  inlineScript,
  /function effectiveMode\(\)\{[\s\S]*?if\(isRSGame\(\)\) return 'old';/,
  'Ruby/Sapphire must use the old-emulator offsets for every 0x44FC setup code',
);
assert.match(
  inlineScript,
  /var code1Box1 = \{[\s\S]*?old:\s+'B C U n x 0 E H'/,
  'Ruby/Sapphire Code 1 should keep its existing old-emulator offset',
);
assert.match(
  inlineScript,
  /var code2Box5 = \{[\s\S]*?old:\s+'_ H B [^']* e L Q [^']*'/,
  'Ruby/Sapphire Code 2 should use the old-emulator offset',
);
assert.match(
  inlineScript,
  /var code3Box5 = \{[\s\S]*?old:\s+'_ H B [^']* 8 L Q [^']*'/,
  'Ruby/Sapphire Code 3 should use the old-emulator offset',
);
assert.match(
  inlineScript,
  /var oldAllowed = !isRSGame\(\);[\s\S]*?oldOption\.hidden = !oldAllowed;[\s\S]*?oldOption\.disabled = !oldAllowed;/,
  'Ruby/Sapphire should not offer a separate Old Emulator platform choice',
);
assert.match(
  html,
  /Ruby and Sapphire use the same 0x44FC ACE offsets on every platform\./,
  'Ruby/Sapphire instructions should explain why Old Emulator is not selectable',
);

const switchLanguageLists = inlineScript.slice(
  inlineScript.indexOf('var fireRedSwitchLanguageOptions'),
  inlineScript.indexOf('var rsLanguageOptions'),
);
assert.doesNotMatch(
  switchLanguageLists,
  /English 1\.[01]/,
  'Switch language choices should not offer FireRed/LeafGreen revisions',
);
assert.match(switchLanguageLists, /value: 'eng10', label: 'English'/);

const regularFrlgLanguageList = inlineScript.slice(
  inlineScript.indexOf('var frlgLanguageOptions'),
  inlineScript.indexOf('var fireRedSwitchLanguageOptions'),
);
assert.match(regularFrlgLanguageList, /label: 'English 1\.1'/);
assert.match(regularFrlgLanguageList, /label: 'English 1\.0'/);
assert.match(
  regularFrlgLanguageList,
  /value: 'jap-unavailable', label: 'Japanese — not yet available', disabled: true/,
);

assert.match(
  inlineScript,
  /var consolePayloads = selectedGame === 'FR'\s*\? fireRedDexRegPayloads\s*: leafGreenDexRegPayloads;/,
  'the selected base game should choose the corresponding regular-console payload',
);
for (const expectedPayload of [
  "eng1: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0bDBwUI'])",
  "eng0: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0avBwUI'])",
  "spa: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0ajCAUI'])",
  "fra: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0aPCAUI'])",
  "ita: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0a7BwUI'])",
  "ger: makeDexRegPayloadRows(['6SDHggAg', '0L0Aowc7', 'DrQQpQBL', 'n0bPBwUI'])",
]) {
  assert.equal(
    inlineScript.split(expectedPayload).length - 1,
    2,
    `FireRed and LeafGreen should both contain ${expectedPayload}`,
  );
}
assert.doesNotMatch(
  inlineScript.slice(
    inlineScript.indexOf('var fireRedDexRegPayloads'),
    inlineScript.indexOf('// Switch DexReg payloads'),
  ),
  /jap[01]:/,
  'regular FireRed/LeafGreen should not expose Japanese DexReg payloads',
);
assert.match(
  inlineScript,
  /function makeDexRegPayloadRows\(firstFour\)\{[\s\S]*?note: text\.indexOf\('O'\) >= 0 \? 'upper case O \(O\)' : ''/,
  'DexReg box names containing uppercase O should receive the standard clarification',
);
assert.match(
  inlineScript,
  /if\(isBaseFRLGGame\(\)\)\{[\s\S]*?AQD[\s\S]*?&#32;&#32;[\s\S]*?This should spawn a Bulbasaur in Box 14, Slot 30\.[\s\S]*?The setup is now complete\./,
  'FireRed/LeafGreen DexReg instructions should include the two-space Bulbasaur test and the renumbered completion step',
);
assert.match(
  inlineScript,
  /If you ever want to create Pokémon without registering them in the Pokédex, swap this Porygon2 for the previous J7VC Pokémon\./,
  'FireRed/LeafGreen should explain how to restore the non-registering J7VC setup',
);
assert.match(
  inlineScript,
  /\[OＯ\]\/\.test\(plainCodeText\) && cleanNote\.indexOf\('upper case O \(O\)'\) < 0/,
  'Japanese keyboard rendering should not duplicate an existing uppercase-O clarification',
);

assert.match(
  inlineScript,
  /function isFRLGSwitchGame\(\)\{\s*return isBaseFRLGGame\(\) && selectedMode === 'switch';/,
  'Switch setup selection should combine the chosen FireRed/LeafGreen game with the platform',
);
assert.match(
  inlineScript,
  /var switchAllowed = isBaseFRLGGame\(\);/,
  'Nintendo Switch should only be offered after choosing FireRed or LeafGreen',
);
assert.match(
  inlineScript,
  /var switchPayloads = selectedGame === 'FR'\s*\? fireRedSwitchDexRegPayloads\s*: leafGreenSwitchDexRegPayloads;/,
  'the selected base game should still choose the corresponding Switch payload',
);
assert.match(
  inlineScript,
  /var options = selectedGame && selectedMode \? currentLanguageOptions\(\) : \[\];/,
  'language choices should not be populated until a platform is selected',
);

const languageHandler = inlineScript.slice(
  inlineScript.indexOf("languageSelect.addEventListener('change'"),
  inlineScript.indexOf('// Platform / emulator selector'),
);
assert.doesNotMatch(
  languageHandler,
  /selectedMode\s*=\s*null/,
  'choosing a language should preserve the selected platform',
);

const platformHandler = inlineScript.slice(
  inlineScript.indexOf("deviceSelect.addEventListener('change'"),
  inlineScript.indexOf('// Game selector'),
);
assert.match(platformHandler, /selectedLanguage = '';/);
assert.match(platformHandler, /populateLanguageOptions\(\);/);

const standardCode2And3Data = inlineScript.slice(
  inlineScript.indexOf('// Code 2 changes Box 5'),
  inlineScript.indexOf('var myBoyCode1Rows'),
);
assert.doesNotMatch(
  standardCode2And3Data,
  /skip boxes 6-8|highlightBoxNum/,
  'standard Codes 2 and 3 should no longer skip to a highlighted Box 9',
);
assert.match(
  standardCode2And3Data,
  /\{box:\s*14, text: 'H G L H G Q G M', note: 'G-Q-G — middle letter is Q, not G'\}/,
  'the shared Code 2 Box 14 should distinguish its Q from the surrounding G characters',
);
assert.match(inlineScript, /function getCode2Rows\([\s\S]*?return fillUnchangedCode1Rows\(changedRows\);/);
assert.match(inlineScript, /function getCode3Rows\([\s\S]*?return fillUnchangedCode1Rows\(changedRows\);/);
assert.match(
  inlineScript,
  /function fillUnchangedCode1Rows\([\s\S]*?return getCode1Rows\(\)\.map[\s\S]*?Same as Code 1 — no change needed\./,
  'unchanged continuation rows should be copied from Code 1 and clearly labelled',
);
assert.match(
  html,
  /grid-template-columns:8ch 11ch minmax\(0,1fr\)/,
  'desktop helper notes should begin after one fixed-width code column',
);
assert.match(
  html,
  /\.japanese-code-panel \.code-line\{grid-template-columns:8ch 10\.5em minmax\(0,1fr\)\}/,
  'Japanese full-width codes should reserve enough space before helper text',
);
assert.match(
  inlineScript,
  /function buildPanelHTML\(rows, useHTML\)\{\s*var html = '<div class="panel-inner"><div class="codes-box">' \+ buildCodeColorLegendHTML\(\);/,
  'each code box should begin with the color legend',
);
assert.match(
  inlineScript,
  /\['Upper case letters', 'Lower case letters', 'Symbols', 'Spaces \(any space works\)'\]/,
  'standard guides should explain the requested blue, red, green, and white meanings',
);
assert.match(
  inlineScript,
  /\['Hiragana', 'Katakana', 'Alphabet \/ numbers \/ symbols', 'Spaces \(any space works\)'\]/,
  'Japanese guides should describe their keyboard-page color meanings accurately',
);
for (const color of ['blue', 'red', 'green', 'white']) {
  assert.match(html, new RegExp(`\\.code-color-swatch-${color}\\{background:`));
}
assert.match(
  html,
  /@media \(max-width:640px\)\{[\s\S]*?\.code-color-legend\{display:grid;grid-template-columns:1fr;align-items:start;gap:6px\}/,
  'mobile color helpers should stack in one left-aligned column',
);
assert.match(inlineScript, /isUnchangedNote = \/\^Same as Code 1\\b\/i\.test\(cleanNote\)/);
assert.match(
  html,
  /\.code-line-unchanged \.code-box-prefix,[\s\S]*?\.code-line-unchanged \.code-box-main\{opacity:\.62\}/,
  'unchanged Code 1 rows should be visually subdued',
);

console.log('Interactive Base64 setup selector checks passed.');
