import { getPokerusStateFromStatus, toBase64Emerald, toFormattedHex } from './builder.js';
import {
  resolvePokerusStateForBuild,
  tryBuildPristineImportedOutputs,
  shouldMarkImportedDirtyFromEvent,
} from './importIsolation.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n-- ${name} --`);
}

const rawBytes = new Uint8Array(80);
for (let i = 0; i < 80; i++) rawBytes[i] = i;

section('pristine imported output bypass helper');
{
  const out = tryBuildPristineImportedOutputs({
    currentEncounterMode: 'imported',
    importedRoundTripBytes: rawBytes,
    importedRoundTripDirty: false,
    toFormattedHexFn: toFormattedHex,
    toBase64Fn: toBase64Emerald,
  });

  assert(Boolean(out), 'helper should return output in pristine imported state');
  assert(out.hex === toFormattedHex(rawBytes), 'hex output should match exact imported bytes');
  assert(out.base64Text === toBase64Emerald(rawBytes).text, 'base64 output should match exact imported bytes');
}

section('edited import falls back to rebuild path helper');
{
  const out = tryBuildPristineImportedOutputs({
    currentEncounterMode: 'imported',
    importedRoundTripBytes: rawBytes,
    importedRoundTripDirty: true,
    toFormattedHexFn: toFormattedHex,
    toBase64Fn: toBase64Emerald,
  });

  assert(out === null, 'dirty imported state should not use byte-preserved passthrough helper');
}

section('synthetic events do not dirty imports');
{
  const shouldDirty = shouldMarkImportedDirtyFromEvent({
    event: { isTrusted: false },
    suppressImportedDirtyTracking: false,
    currentEncounterMode: 'imported',
    importedRoundTripBytes: rawBytes,
    targetId: 'species',
    inDataCards: true,
  });

  assert(shouldDirty === false, 'non-trusted synthetic events must not dirty imported state');
}

section('trusted user edits can dirty imports');
{
  const shouldDirty = shouldMarkImportedDirtyFromEvent({
    event: { isTrusted: true },
    suppressImportedDirtyTracking: false,
    currentEncounterMode: 'imported',
    importedRoundTripBytes: rawBytes,
    targetId: 'species',
    inDataCards: true,
  });

  assert(shouldDirty === true, 'trusted edits in data cards should dirty imported state');
}

section('ignored controls remain non-dirty');
{
  const shouldDirty = shouldMarkImportedDirtyFromEvent({
    event: { isTrusted: true },
    suppressImportedDirtyTracking: false,
    currentEncounterMode: 'imported',
    importedRoundTripBytes: rawBytes,
    targetId: 'generateBtn',
    inDataCards: true,
  });

  assert(shouldDirty === false, 'generate button interactions must not dirty imported state');
}

section('output controls remain non-dirty');
{
  for (const targetId of ['codeTargetConsole', 'codeTargetSwitch']) {
    const shouldDirty = shouldMarkImportedDirtyFromEvent({
      event: { isTrusted: true },
      suppressImportedDirtyTracking: false,
      currentEncounterMode: 'imported',
      importedRoundTripBytes: rawBytes,
      targetId,
      inDataCards: true,
    });

    assert(shouldDirty === false, `${targetId} interactions must not dirty imported state`);
  }
}

section('pokerus exact import byte is preserved until dropdown edit');
{
  const preserved = resolvePokerusStateForBuild({
    currentEncounterMode: 'imported',
    importedPokerusState: 0x42,
    pokerusDropdownDirty: false,
    selectedPokerusStatus: 'active',
    getPokerusStateFromStatusFn: getPokerusStateFromStatus,
  });
  assert(preserved === 0x42, 'unedited imported Pokerus byte should be preserved exactly');

  const edited = resolvePokerusStateForBuild({
    currentEncounterMode: 'imported',
    importedPokerusState: 0x42,
    pokerusDropdownDirty: true,
    selectedPokerusStatus: 'active',
    getPokerusStateFromStatusFn: getPokerusStateFromStatus,
  });
  assert(edited === 0x11, 'edited Pokerus dropdown should use the simple active state');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
