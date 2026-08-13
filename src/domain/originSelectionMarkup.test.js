import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');

const speciesIndex = html.indexOf('id="species"');
const originIndex = html.indexOf('id="pokemonOrigin"');
const mysteryIndex = html.indexOf('id="mysteryEvent"');
const staticIndex = html.indexOf('id="staticEncounter"');
const shadowIndex = html.indexOf('id="shadowEncounter"');

assert.ok(speciesIndex >= 0, 'Pokémon selector should exist');
assert.ok(originIndex > speciesIndex, 'Origin selector should follow Pokémon');
assert.ok(mysteryIndex > originIndex, 'Mystery exact selector should follow Origin');
assert.ok(staticIndex > originIndex, 'Static exact selector should follow Origin');
assert.ok(shadowIndex > originIndex, 'GameCube exact selector should follow Origin');

assert.match(html, /How was this Pokémon obtained\?/);
assert.match(html, /<label for="mysteryEvent">Distribution<\/label>/);
assert.match(html, /<label for="staticEncounter">Encounter<\/label>/);
assert.match(html, /<label for="shadowEncounter">Encounter<\/label>/);
assert.match(html, /class="internal-builder-control" id="encounterModeToggle"/);
assert.match(html, /<select id="staticCategory" tabindex="-1"><\/select>/);
assert.match(html, /class="row builder-exact-row show-when-cxd-trade" id="cxdTradeEncounterRow"/);
assert.match(html, /<label for="cxdTradeEncounter">Trade<\/label>/);
assert.match(html, /<select id="cxdTradeEncounter"><\/select>/);
assert.match(html, /\.internal-builder-control,[\s\S]*?display:\s*none\s*!important;/);
assert.match(html, /\.row\.builder-origin-row\s*\{[\s\S]*?display:\s*block;/);
assert.match(html, /#pokemonOrigin\s*\{[\s\S]*?width:\s*min\(100%,\s*240px\);/);
assert.match(html, /<body class="builder-setup-pending">/);
assert.match(html, /id="builderSetupStage"/);
assert.match(html, /id="builderSetupGuidance"[^>]*aria-live="polite"/);
assert.match(html, /class="row builder-species-row"/);
assert.match(html, /class="builder-species-control"/);
assert.match(html, /class="row builder-exact-row show-when-mystery" id="mysteryEventRow"/);
assert.match(html, /class="row builder-exact-row show-when-static" id="staticEncounterRow"/);
assert.match(html, /class="row builder-exact-row show-when-cxd" id="shadowEncounterRow"/);
assert.match(html, /body\.encounter-mystery #mysteryEventRow,[\s\S]*?body\.encounter-static #staticEncounterRow,[\s\S]*?flex-direction:\s*column;/);
assert.match(html, /<section class="card" id="builderDetailsCard"/);
assert.match(html, /body\.builder-setup-pending #builderDetailsCard/);
assert.match(html, /body\.builder-setup-pending #outputCard/);
assert.match(html, /<option value="" selected>Unresolved<\/option>/);

assert.match(mainSource, /function syncBuilderProgressiveDisclosure\(/);
assert.match(mainSource, /document\.body\.classList\.toggle\('builder-setup-pending', !resolved\)/);
assert.match(mainSource, /const hasResolvedOrigin = hasResolvedOriginSelection\(\);\s*syncBuilderProgressiveDisclosure\(hasResolvedOrigin\);/);
assert.match(mainSource, /const shadowEncounter = getSelectedCXDEncounter\(\);\s*const cxdEncounter = trade \|\| shadowEncounter;/);
assert.match(mainSource, /originGameEl\.value = String\(fixedOriginGame\);/);
assert.match(mainSource, /shouldLockStaticEncounterOriginFields\(\) \|\|\s*Boolean\(cxdEncounter\)/);
assert.match(mainSource, /canSelectJapaneseLanguage\(\{/);

const mysteryEventListenerStart = mainSource.indexOf("eventSel.addEventListener('change'");
const mysteryEventListenerEnd = mainSource.indexOf("eventSel.dataset.originSelectionListener = '1'", mysteryEventListenerStart);
assert.ok(mysteryEventListenerStart >= 0 && mysteryEventListenerEnd > mysteryEventListenerStart);
const mysteryEventListenerSource = mainSource.slice(mysteryEventListenerStart, mysteryEventListenerEnd);
assert.match(
  mysteryEventListenerSource,
  /updateOtGenderLocking\(\)/,
  'changing an exact Mystery Gift distribution should refresh OT gender locking',
);
assert.match(
  mainSource,
  /return t === 'WISHMKR_BEST' \|\| t === 'WISHMKR_SHINY';/,
  'both WISHMKR distributions should use the fixed OT gender rule',
);
assert.match(mainSource, /getOtGenderLockPolicy\(\{/);
assert.match(
  mainSource,
  /currentEncounterMode === 'cxd_trade'\) candidates\.push\(getSelectedCXDTrade\(\)\)/,
  'fixed trade contest condition should be the baseline for automatic Sheen calculation',
);
const updateMovesStart = mainSource.indexOf('function updateMovesForSpecies(');
const updateMovesEnd = mainSource.indexOf('function refreshMoveExclusions()', updateMovesStart);
assert.ok(updateMovesStart >= 0 && updateMovesEnd > updateMovesStart);
const updateMovesSource = mainSource.slice(updateMovesStart, updateMovesEnd);
assert.match(updateMovesSource, /if \(manualOverrideActive\) \{/);
assert.doesNotMatch(
  updateMovesSource,
  /currentEncounterMode === 'cxd_shadow'|isCXDGeneratedTrade/,
  'Colosseum/XD encounters must use the species move pool plus preserved preset moves',
);
assert.match(
  mainSource,
  /event\?\.fixedPID !== undefined && event\?\.fixedIVs\) return false;/,
  'fixed Mystery Gift specimens must not require a PID Finder selection',
);
assert.match(mainSource, /function updateMysteryFixedSpecimenLocking\(\)/);
assert.match(
  mainSource,
  /const shouldLockNature = isFixedSpecimen && event\?\.fixedNature !== undefined/,
  'fixed Mystery Gift specimens must lock their PID-derived nature',
);
assert.match(mainSource, /natureEl\.dataset\.mysteryFixedNatureLock = '1'/);
assert.match(mainSource, /abilityEl\.dataset\.mysteryFixedAbilityLock = '1'/);
assert.match(
  mainSource,
  /mysteryEvent\?\.fixedPID !== undefined\s*&& fixedSpecimenLanguages\.length === 1/,
  'a fixed specimen with one legal language must lock the language selector',
);
assert.match(mainSource, /langSel\.dataset\.mysteryFixedLanguageLock = '1'/);

const selectedCXDHelperIndex = mainSource.indexOf('function getSelectedCXDEncounter()');
const bootFunctionIndex = mainSource.indexOf('function boot()');
assert.ok(
  selectedCXDHelperIndex >= 0 && selectedCXDHelperIndex < bootFunctionIndex,
  'the selected CXD encounter helper must remain module-scoped for the PID Finder modal',
);

const isEggListenerStart = mainSource.indexOf("isEggCheckbox.addEventListener('change'");
const isEggListenerEnd = mainSource.indexOf('updateLegalityStatus();', isEggListenerStart);
assert.ok(isEggListenerStart >= 0 && isEggListenerEnd > isEggListenerStart);
assert.match(
  mainSource.slice(isEggListenerStart, isEggListenerEnd),
  /updateOtGenderLocking\(\)/,
  'changing Pokémon Box egg state should refresh OT gender locking',
);

console.log('origin selection markup tests passed');
