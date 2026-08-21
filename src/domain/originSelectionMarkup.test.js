import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

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

assert.match(html, /id="pidFinderBtn"[^>]*>Set Legal PID\/Shiny</);
assert.match(mainSource, /row\.classList\.toggle\('pid-finder-visible', shouldShow\)/);
assert.match(styles, /#pidFinderRow\.pid-finder-visible[\s\S]*?grid-template-columns:/);
assert.match(styles, /#pidFinderRow \.pid-finder-status[\s\S]*?grid-column:\s*2/);
assert.match(html, /id="pfHatchedNotice"/);
assert.match(html, /id="pfPid"/);
assert.match(html, /id="pfConfirm"/);
assert.match(html, /id="pfWantShiny" type="checkbox"/);
assert.match(html, /id="pfKeepSidInfoTooltip"/);
assert.match(html, /id="pfAutoSidInfoTooltip"/);
assert.match(html, /id="pfKeepSidHatchedRecommendation"[^>]*>Recommended for hatched<\/span>/);
assert.match(html, /id="pfMinHp"[^>]*value="20"/);
assert.match(html, /<th class="pid-finder-action">Select<\/th>/);
assert.match(html, /<th title="PKHeX-style RNG frame from the relevant Gen III initial seed \(1-indexed\)">Frame<\/th>/);
assert.match(html, /id="pfRngManipulation" class="pid-rng-panel"/);
assert.match(html, /id="pfRngWindowEnabled" type="checkbox"/);
assert.match(html, /id="pfRngStartSeed"[^>]*placeholder="0x00000000"/);
assert.match(html, /id="pfRngMaxFrame"[^>]*value="1000000"/);
assert.match(html, /id="pfManipFrameHeader"[^>]*hidden>Manip Frame<\/th>/);
assert.match(mainSource, /const frameInfo = getGen3ResultFrame\(r, \{/);
assert.match(mainSource, /rngStartSeed:\s*rngWindow\?\.startSeed/);
assert.match(mainSource, /rngMaxAdvances:\s*rngWindow\?\.maxAdvances/);
assert.match(styles, /\.pid-rng-fields\s*\{[\s\S]*?grid-template-columns:/);
assert.match(html, /class="pid-shiny-switch"/);
assert.match(html, /class="pid-shiny-switch-star"/);
assert.match(html, /<b>Auto-Set SID<\/b>[\s\S]*<b>Keep SID<\/b>/);
assert.match(html, /Recommended if you want high IVs and do not care about the SID/);
assert.match(html, /fewer high-IV PID choices/);
assert.doesNotMatch(html, /id="pfRandomPid"/);
assert.match(html, /id="pfAbility" hidden/);
assert.match(html, /id="pfPidParity" hidden/);
assert.doesNotMatch(html, /id="pfPidParityRow"|<label for="pfAbility"/);
assert.doesNotMatch(html, /id="makeShinyBtn"|id="makeShinyMethodToggle"|id="makeShinyRow"|class="row shiny-external"/);
assert.match(mainSource, /pfTidEl\.disabled = Boolean\(mainTidEl\?\.disabled\)/);
assert.match(mainSource, /pfSidEl\.disabled = Boolean\(mainSidEl\?\.disabled\)/);
assert.match(styles, /\.pid-finder-identity-grid input:disabled/);
assert.match(styles, /\.pid-finder-identity-grid select \{[\s\S]*?height:\s*2\.5rem;/);
assert.match(styles, /\.pid-shiny-option-copy \{[\s\S]*?align-items:\s*center;/);
assert.match(styles, /grid-template-columns:\s*140px 140px minmax\(0, 290px\)/);
assert.match(html, /<input id="sid"[^>]+>\s*<\/div>\s*<span id="sidShinyStatus"/);
assert.match(mainSource, /currentEncounterMode === 'hatched' \|\|\s*currentEncounterMode === 'wild'/);
assert.match(mainSource, /wantShinyCheckbox\.checked = false/);
assert.match(mainSource, /keepSidHatchedRecommendation\.hidden = currentEncounterMode !== 'hatched'/);
assert.match(mainSource, /setMinimumIvDefaults\(radio === keepSidRadio \? 15 : 20\)/);
assert.match(mainSource, /setMinimumIvDefaults\(20\);/);
assert.match(mainSource, /getDefaultShinySidMode\(currentEncounterMode\)/);
assert.match(mainSource, /keepSidRadio\.checked = defaultSidMode === SHINY_SID_MODE\.KEEP/);
assert.match(mainSource, /autoSidRadio\.checked = defaultSidMode === SHINY_SID_MODE\.AUTO/);
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.pid-finder-table \.pid-finder-action \{[\s\S]*?position:\s*sticky;[\s\S]*?right:\s*0;/);
assert.match(styles, /\.pid-finder-table tr\.is-selected \.pid-finder-action,[\s\S]*?background:\s*#0f3a41;/);
assert.match(mainSource, /natureEl\?\.classList\.add\('field-error'\);\s*scrollToMissingField\(natureEl, natureEl\);/);
assert.match(mainSource, /PID 0x00000000 is not allowed because it has no valid encryption constant\./);
assert.match(mainSource, /This Pokémon cannot be shiny\./);
assert.match(mainSource, /filtered = filtered\.filter\(r => !resultIsShiny\(r\)\)/);
assert.match(mainSource, /`Showing top \$\{capped\.length\} results by IV total`/);
assert.match(mainSource, /`Showing all \$\{capped\.length\} result/);
assert.match(mainSource, /No results match the current filters\./);
assert.doesNotMatch(mainSource, /resultLabel\(pfAllResults\.length\)|match current filters/);
assert.doesNotMatch(mainSource, /`\$\{filtered\.length\} result\$\{filtered\.length !== 1 \? 's' : ''\} shown`/);
assert.match(mainSource, /speciesAbilities\?\.\[ability\]/);

const isEggListenerStart = mainSource.indexOf("isEggCheckbox.addEventListener('change'");
const isEggListenerEnd = mainSource.indexOf('updateLegalityStatus();', isEggListenerStart);
assert.ok(isEggListenerStart >= 0 && isEggListenerEnd > isEggListenerStart);
assert.match(
  mainSource.slice(isEggListenerStart, isEggListenerEnd),
  /updateOtGenderLocking\(\)/,
  'changing Pokémon Box egg state should refresh OT gender locking',
);

console.log('origin selection markup tests passed');
