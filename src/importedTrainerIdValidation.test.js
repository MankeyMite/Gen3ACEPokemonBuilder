import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { hasImportedDistributionTrainerIds } from './domain/importedPokemon.js';
import {
  buildPokemonBytes,
  convertEk3RawToPk3Canonical,
  convertPk3CanonicalToEk3Raw,
  parsePokemonBytes,
  toHexString,
} from './lib/gen3/builder.js';
import { isValidRSTrainerId } from './lib/gen3/rsTrainerId.js';

// Exercise the actual warning and validation gate with the same controls filled
// by hex/Base64 and file imports, including a subsequent switch to Legal Mode.
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const validationSource = mainSource.slice(
  mainSource.indexOf('function isRubySapphireOriginGame('),
  mainSource.indexOf('function adjustShinySidForOriginGame('),
);
const controls = {};
const warning = { style: {} };
const context = {
  currentEncounterMode: 'imported',
  manualOverrideActive: false,
  RS_ORIGIN_GAME_IDS: new Set([1, 2]),
  rsTrainerIdValidationCache: { tid: null, sid: null, valid: null },
  hasImportedDistributionTrainerIds,
  isValidRSTrainerId,
  $: selector => controls[selector],
  document: { getElementById: id => id === 'rsTidSidWarning' ? warning : null },
};
const validation = runInNewContext(`${validationSource}
  ({ getRSTrainerIdValidation, updateRSTidSidWarning });`, context);

function loadControls(data) {
  for (const [id, key] of Object.entries({
    species: 'speciesId', originGame: 'originGame',
    metLocation: 'metLocationId', metLevel: 'metLevel',
    tid: 'tid', sid: 'sid', otName: 'otName',
  })) controls[`#${id}`] = { value: String(data[key]) };
  controls['#isEgg'] = { checked: Boolean(data.isEgg) };
}

function assertValidation(applies, valid, label) {
  const result = validation.getRSTrainerIdValidation();
  assert.equal(result.applies, applies, label);
  assert.equal(result.valid, valid, label);
  validation.updateRSTidSidWarning();
  assert.equal(warning.style.display, applies && !valid ? '' : 'none', label);
}

const sample = {
  speciesId: 409, tid: 20043, sid: 0, otName: 'WISHMKR',
  originGame: 2, metLocationId: 255, metLevel: 5,
  level: 5, totalExp: 156, nickname: 'JIRACHI', languageId: 2,
  pid: 0x4633087D, natureIndex: 0, abilityBit: 0, ballId: 4,
  moves: [273, 93, 156], pps: [0, 0, 0, 0],
  ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
  evs: {}, contest: {}, ribbons: { fatefulEncounter: false },
};
assert.equal(isValidRSTrainerId(sample.tid, sample.sid), false,
  'the regression fixture must fail the ordinary R/S player-ID rule');

for (const originGame of [1, 2]) {
  const original = buildPokemonBytes({ ...sample, originGame }).bytes;
  const pk3 = convertEk3RawToPk3Canonical(original, 100);
  for (const raw of [original, convertPk3CanonicalToEk3Raw(pk3)]) {
    assert.deepEqual(raw, original, 'file conversion must preserve event bytes');
    const parsed = parsePokemonBytes(toHexString(raw));
    assert.equal(parsed.ribbons.fatefulEncounter, false);
    loadControls(parsed);
    assertValidation(false, true, 'non-fateful imported distributions are exempt in Legal Mode');
    assert.equal(controls['#tid'].value, '20043');
    assert.equal(controls['#sid'].value, '0');

    controls['#metLocation'].value = '16';
    assertValidation(true, false, 'changing the origin to an ordinary capture restores validation');
    controls['#metLocation'].value = '255';
    assertValidation(false, true, 'restoring the distribution origin clears the cached warning');

    context.currentEncounterMode = 'wild';
    assertValidation(true, false, 'distribution inference only applies in Imported mode');
    context.currentEncounterMode = 'imported';
  }
}

// Direct gifts need not match a curated representative OT/TID, such as PCNY
// serial numbers or distributions not yet present in the event picker.
loadControls({ ...sample, speciesId: 25, tid: 12345, sid: 43244, otName: 'PCNYc' });
assertValidation(false, true, 'custom distributor trainer IDs are preserved');

loadControls({ ...sample, metLevel: 0 });
assertValidation(true, false, 'a hatched gift still uses the hatcher trainer-ID rule');
controls['#isEgg'].checked = true;
controls['#metLevel'].value = '5';
assertValidation(true, false, 'an unhatched event Egg is not a direct distributor-owned gift');

let channelSid = 0;
while (isValidRSTrainerId(40122, channelSid)) channelSid++;
loadControls({ ...sample, tid: 40122, sid: channelSid, otName: 'CHANNEL', metLevel: 0 });
assertValidation(false, true, 'CHANNEL Jirachi has a distributor SID despite met level zero');
controls['#species'].value = '25';
assertValidation(true, false, 'the CHANNEL exception requires Jirachi');
controls['#species'].value = '409';
controls['#otName'].value = 'PLAYER';
assertValidation(true, false, 'the CHANNEL exception requires its distributor identity');

// A fateful ribbon alone must not bypass ordinary captured/hatched ID checks.
const fatefulCapture = parsePokemonBytes(toHexString(buildPokemonBytes({
  ...sample, metLocationId: 73, ribbons: { fatefulEncounter: true },
}).bytes));
assert.equal(fatefulCapture.ribbons.fatefulEncounter, true);
loadControls(fatefulCapture);
assertValidation(true, false, 'fateful in-game captures retain the R/S RNG check');
// Use a known obtainable pair, independently covered by rsTrainerId.test.js.
controls['#tid'].value = '12346';
controls['#sid'].value = '43244';
assertValidation(true, true, 'obtainable player trainer IDs still pass');
controls['#originGame'].value = '3';
assertValidation(false, true, 'Emerald does not use the R/S ID rule');

console.log('Imported trainer-ID validation tests passed');
