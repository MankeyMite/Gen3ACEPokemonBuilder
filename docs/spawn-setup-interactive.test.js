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

console.log('Interactive Base64 setup selector checks passed.');
