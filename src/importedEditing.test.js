import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { IMPORTED_POKEMON_FIELDS, readImportedPokemonFields, resetImportedControl, setImportedControlValue } from './domain/importedPokemonFields.js';
import { resolveImportedProgression } from './domain/importedPokemon.js';
import { editImportedPokemonBytes, getImportedCanonicalBytes } from './lib/gen3/importedPokemonEditor.js';
import { isPristineImportedRoundTripState, resolvePokerusStateForBuild, tryBuildPristineImportedOutputs } from './lib/gen3/importIsolation.js';
import * as builder from './lib/gen3/builder.js';
import { checksum16, writeU16LE, writeU32LE } from './lib/gen3/packers.js';

// Run the real import and Generate handlers against form controls with native
// select semantics: assigning an unavailable value loses it unless an option
// is added. No browser package or full application boot is needed.
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const section = (start, end) => mainSource.slice(mainSource.indexOf(start), mainSource.indexOf(end));
const noop = () => {};
const controls = new Map();
const messages = [];
let generatedBytes;
const document = {
  getElementById: id => controls.get(id),
  querySelector: selector => selector.startsWith('#') ? controls.get(selector.slice(1)) : null,
  createElement: () => ({ dataset: {} }),
};
const selectIds = new Set(['species', 'item', 'ball', 'originGame', 'language', 'ability', 'metLocation',
  'move1', 'move2', 'move3', 'move4', 'ribbonCool', 'ribbonBeauty', 'ribbonCute', 'ribbonSmart', 'ribbonTough']);
for (const id of [...IMPORTED_POKEMON_FIELDS.map(field => field[0]),
  'pid', 'level', 'nature', 'otGender', 'manualOverride', 'pokerusStatus', 'autoSheenEnabled', 'hexOutput']) {
  let stored = '';
  const control = {
    id, style: {}, dataset: {}, options: [{ value: '0', dataset: {} }],
    tagName: selectIds.has(id) ? 'SELECT' : 'INPUT',
    type: id === 'evHp' ? 'number' : 'text', min: '0', max: '252',
    checked: false, ownerDocument: document,
    classList: { toggle: noop },
    appendChild(option) {
      option.remove = () => { this.options = this.options.filter(candidate => candidate !== option); };
      this.options.push(option);
    },
    get value() { return stored; },
    set value(value) {
      stored = this.tagName !== 'SELECT' || this.options.some(option => option.value === String(value))
        ? String(value) : '';
    },
  };
  controls.set(id, control);
}
class FileReader {
  readAsArrayBuffer(file) { this.onload({ target: { result: file.data.buffer.slice(0) } }); }
}
const context = {
  ...builder, Uint8Array, FileReader, document,
  $: document.querySelector,
  console: { log: noop }, alert: text => messages.push(text),
  IMPORTED_POKEMON_FIELDS, readImportedPokemonFields, setImportedControlValue,
  resolveImportedProgression, editImportedPokemonBytes, getImportedCanonicalBytes,
  isPristineImportedRoundTripState, resolvePokerusStateForBuild, tryBuildPristineImportedOutputs,
  parsePidInput: value => Number(value) >>> 0,
  currentEncounterMode: '', importedRoundTripBytes: null, importedRoundTripBaseline: null,
  importedRoundTripDirty: true, importedPokerusState: null, pokerusDropdownDirty: false,
  suppressImportedDirtyTracking: false, manualOverrideActive: false, suppressPresetApply: false,
  _syncLegalModeToggle: noop, _postImportUpdate: noop, _validateForm: noop,
  metLocationWrapper: null, pkhexLegalityEnvironment: 'gba-cartridge',
  populateAbilitySelectForSpecies: noop, populateImportedGenderForSpecies: noop,
  getImportedGenderForPid: noop, markNicknameAsImported: noop, getLocationsForGame: () => [],
  updateMovesForSpecies: noop, refreshMoveExclusions: noop, checkShiny: noop,
  updateHiddenPower: noop, updateLegalityStatus: noop, setContestSheenStatus: noop,
  setControlLockState: (control, locked) => { if (control) control.disabled = locked; },
  enterImportedModeSilently: () => { context.currentEncounterMode = 'imported'; },
  getBase64GenerationOptions: () => ({}), setBase64OutputText: noop,
  setOutputTroubleshootingVisible: noop, updateBase64SafetyWarnings: noop,
  hideBase64CharacterInspector: noop, markGeneratedCodeFresh: noop, recordRecentGeneration: noop,
  beginPkhexVerification: bytes => { generatedBytes = bytes; },
};
const handlers = runInNewContext([
  section('function clearImportedRoundTripState()', 'function enterImportedModeSilently()'),
  section('function onLoadFromHex(', '// Export Pokémon data as .ek3 file'),
  section('function onImportPk3(', 'function onDownload()'),
  section('  function applyContestSpeciesRequirements(', '  function getAutoSheenEnabled()'),
  '_applyContestSpeciesRequirements = applyContestSpeciesRequirements;',
  '({ onLoadFromHex, onImportPk3, onGenerate });',
].join('\n'), context);

const canonical = Uint8Array.from({ length: 80 }, (_, index) => (index * 17 + 13) & 255);
writeU32LE(canonical, 0, 0); // PID zero must survive even after an edit.
writeU16LE(canonical, 0x20, 329); // Milotic, with impossible contest values.
canonical[0x3F] = 0;
canonical[0x43] = 0;
writeU16LE(canonical, 0x22, 65535);
writeU16LE(canonical, 0x2C, 65534);
canonical[0x12] = 254;
canonical[0x38] = 255;
canonical[0x46] = 127;
writeU32LE(canonical, 0x4C, 0xFFFFFFFF);
writeU16LE(canonical, 0x1C, checksum16(canonical.slice(0x20)));
const raw = builder.convertPk3CanonicalToEk3Raw(canonical);
const pk3 = builder.convertEk3RawToPk3Canonical(raw, 100);

for (const importRecord of [
  () => handlers.onLoadFromHex(builder.toHexString(raw)),
  () => handlers.onImportPk3({ target: { files: [{ name: 'custom.ek3', data: raw }], value: '' } }),
  () => handlers.onImportPk3({ target: { files: [{ name: 'custom.pk3', data: pk3 }], value: '' } }),
]) {
  importRecord();
  assert.equal(messages.some(message => message.startsWith('Error')), false, messages.join('\n'));
  for (const [id, expected] of Object.entries({
    species: '329', item: '65535', move1: '65534', language: '254',
    evHp: '255', metLevel: '127', ribbonCool: '7', contestBeauty: '0', contestSheen: '0',
  })) assert.equal(controls.get(id).value, expected, `imported ${id} must be displayed exactly`);
  assert.equal(controls.get('evHp').max, '255');
  assert.equal(context.importedRoundTripDirty, false, 'Milotic import must remain untouched');
  handlers.onGenerate();
  assert.deepEqual(generatedBytes, raw);

  // Synthetic autocomplete changes used to bypass dirty tracking. Comparing
  // the actual form values must still detect and apply the edit.
  controls.get('friendship').value = '17';
  handlers.onGenerate();
  const edited = builder.convertEk3RawToPk3Canonical(generatedBytes, 80);
  assert.equal(edited[0x29], 17);
  canonical.forEach((byte, index) => {
    if (![0x29, 0x1C, 0x1D].includes(index)) assert.equal(edited[index], byte, `changed unrelated byte ${index}`);
  });
  assert.deepEqual(context.importedRoundTripBytes, raw, 'Generate must not replace the original snapshot');
  handlers.onGenerate();
  assert.deepEqual(builder.convertEk3RawToPk3Canonical(generatedBytes, 80), edited, 'repeated Generate must be stable');
}

resetImportedControl(controls.get('evHp'));
assert.equal(controls.get('evHp').max, '252', 'leaving Imported mode restores normal numeric limits');
resetImportedControl(controls.get('item'));
assert.equal(controls.get('item').options.some(option => option.value === '65535'), false,
  'leaving Imported mode removes unknown imported select options');

// Exercise the actual autocomplete value/list methods as well as native selects.
const autocompleteContext = {
  wrapper: {}, input: { value: '' }, items: [{ id: '0', name: 'None' }],
  masterItems: null, selectedId: '', allowEmpty: true, currentEncounterMode: 'imported',
  toAutocompleteItem: ([id, name]) => ({ id: String(id), name }),
};
runInNewContext(section("  Object.defineProperty(wrapper, 'value',", '  // Select an item through the same callback'), autocompleteContext);
const autocomplete = autocompleteContext.wrapper;
autocomplete.setImportedValue(65535);
assert.equal(autocomplete.value, '65535');
assert.equal(autocompleteContext.input.value, 'Imported value (65535)');
autocomplete.updateList([[0, 'None'], [1, 'Normal choice']]);
assert.equal(autocomplete.value, '65535', 'list refresh must retain unknown imported IDs');
assert(autocompleteContext.items.some(item => item.id === '65535'));
autocompleteContext.currentEncounterMode = 'wild';
autocomplete.clearImportedValues();
autocomplete.updateList([[0, 'None'], [1, 'Normal choice']]);
assert.equal(autocomplete.value, '', 'unknown imported IDs must not leak into normal choices');

console.log('Imported editing integration tests passed');
