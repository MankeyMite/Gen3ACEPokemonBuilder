import assert from 'node:assert/strict';
import { editImportedPokemonBytes, getImportedCanonicalBytes } from './importedPokemonEditor.js';
import { convertEk3RawToPk3Canonical, convertPk3CanonicalToEk3Raw, parsePokemonBytes, toHexString } from './builder.js';
import { checksum16, readU32LE, writeU16LE, writeU32LE } from './packers.js';

function fixture(pid) {
  const canonical = Uint8Array.from({ length: 80 }, (_, index) => (index * 61 + 29) & 255);
  writeU32LE(canonical, 0, pid);
  writeU16LE(canonical, 0x20, 65535); // glitch species
  writeU16LE(canonical, 0x22, 65534); // unknown held item
  writeU32LE(canonical, 0x24, 0xFFFFFFFF); // EXP above the legal maximum
  writeU16LE(canonical, 0x2C, 65533); // unknown move
  canonical[0x38] = 255;
  canonical[0x39] = 254; // EV total > 510
  canonical[0x12] = 255; // unknown language
  canonical[0x13] = 0xF9; // unrelated and inconsistent header flags
  canonical[0x1B] = 0xF5; // unused marking bits
  canonical[0x08] = 0xFE;
  canonical[0x09] = 0xFF; // undecodable name plus trash after the terminator
  canonical[0x46] = 0xFF; // met level 127
  canonical[0x47] = 0xFF; // unknown game and ball
  writeU32LE(canonical, 0x48, 0xFFFFFFFF); // both Egg and ability bits
  writeU32LE(canonical, 0x4C, 0xFFFFFFFF); // rank 7 ribbons and reserved bits
  writeU16LE(canonical, 0x1C, checksum16(canonical.slice(0x20)));
  const raw = convertPk3CanonicalToEk3Raw(canonical);
  return { raw, canonical, baseline: parsePokemonBytes(toHexString(raw)) };
}

function expectOnlyChanged(original, actual, offsets) {
  const allowed = new Set(offsets);
  original.forEach((byte, offset) => {
    if (!allowed.has(offset)) assert.equal(actual[offset], byte, `unexpected change at 0x${offset.toString(16)}`);
  });
}

for (let pid = 0; pid < 24; pid++) {
  const { raw, canonical, baseline } = fixture(pid);
  const initial = new Uint8Array(raw);
  assert.deepEqual(editImportedPokemonBytes(raw, baseline, structuredClone(baseline)), raw,
    'untouched imports are byte-identical, including PID zero');

  const renamed = editImportedPokemonBytes(raw, baseline, { ...baseline, nickname: 'NEW' });
  expectOnlyChanged(raw, renamed, Array.from({ length: 10 }, (_, index) => 8 + index));

  const changedItem = editImportedPokemonBytes(raw, baseline, { ...baseline, itemId: 1 });
  const changedCanonical = convertEk3RawToPk3Canonical(changedItem, 80);
  expectOnlyChanged(canonical, changedCanonical, [0x22, 0x23, 0x1C, 0x1D]);
  assert.equal(changedCanonical[0x22], 1);
  assert.equal(changedCanonical[0x23], 0);
  assert.equal(parsePokemonBytes(toHexString(changedItem)).speciesId, 65535);
  assert.equal(parsePokemonBytes(toHexString(changedItem)).pid, pid);

  for (const headerEdit of [{ pid: (pid + 13) >>> 0 }, { pid: 0 }, { tid: 123 }, { sid: 321 }]) {
    const edited = editImportedPokemonBytes(raw, baseline, { ...baseline, ...headerEdit });
    const decoded = convertEk3RawToPk3Canonical(edited, 80);
    assert.deepEqual(decoded.slice(0x20), canonical.slice(0x20), 'encryption/header edits must preserve the entire body');
    assert.equal(readU32LE(decoded, 0), headerEdit.pid ?? pid);
  }

  const evs = { ...baseline.evs, hp: 100 };
  const editedEV = convertEk3RawToPk3Canonical(editImportedPokemonBytes(raw, baseline, { ...baseline, evs }), 80);
  expectOnlyChanged(canonical, editedEV, [0x38, 0x1C, 0x1D]);
  assert.equal(editedEV[0x38], 100);
  assert.equal(editedEV[0x39], 254, 'editing one EV must not normalize another EV');
  assert.deepEqual(raw, initial, 'the imported snapshot is immutable');
}

const { raw, canonical, baseline } = fixture(5);
const independentEdits = [
  [{ metLevel: 3 }, [0x46]],
  [{ originGame: 2 }, [0x46, 0x47]],
  [{ ballId: 4 }, [0x47]],
  [{ abilityBit: 0 }, [0x4B]],
  [{ ribbons: { ...baseline.ribbons, cool: 2 } }, [0x4C]],
  [{ ribbons: { ...baseline.ribbons, fatefulEncounter: false } }, [0x4F]],
  [{ markings: { ...baseline.markings, circle: false } }, [0x1B]],
  [{ ivs: { ...baseline.ivs, hp: 2 } }, [0x48]],
  [{ moves: [33, ...baseline.moves.slice(1)] }, [0x2C, 0x2D, 0x34]],
  [{ pps: [0, ...baseline.pps.slice(1)] }, [0x28, 0x34]],
  [{ contest: { ...baseline.contest, beauty: 0 } }, [0x3F]],
  [{ totalExp: 0 }, [0x24, 0x25, 0x26, 0x27]],
  [{ languageId: 1 }, [0x12]],
];
for (const [changes, offsets] of independentEdits) {
  const edited = convertEk3RawToPk3Canonical(editImportedPokemonBytes(raw, baseline, { ...baseline, ...changes }), 80);
  expectOnlyChanged(canonical, edited, [...offsets, 0x1C, 0x1D]);
  assert.notDeepEqual(edited, canonical, `edit must take effect: ${JSON.stringify(changes)}`);
}

const eggEdit = convertEk3RawToPk3Canonical(editImportedPokemonBytes(raw, baseline, { ...baseline, isEgg: false }), 80);
expectOnlyChanged(canonical, eggEdit, [0x13, 0x4B, 0x1C, 0x1D]);
assert.equal(eggEdit[0x13], canonical[0x13] & ~4);
assert.equal(eggEdit[0x4B], canonical[0x4B] & ~0x40);

// Returning a control to its original value recovers the exact original bytes.
assert.deepEqual(editImportedPokemonBytes(raw, baseline, baseline), raw);
const corrupt = new Uint8Array(raw);
corrupt[0x1C] ^= 1;
assert.deepEqual(editImportedPokemonBytes(corrupt, baseline, baseline), corrupt,
  'untouched corrupt checksums must not be silently repaired');

// The tolerant hex importer also accepts canonical plaintext; keep its format.
const plainBaseline = parsePokemonBytes(toHexString(canonical));
assert.equal(plainBaseline.usedXor, false);
const plainEdited = editImportedPokemonBytes(canonical, plainBaseline, { ...plainBaseline, itemId: 7 });
expectOnlyChanged(canonical, plainEdited, [0x22, 0x23, 0x1C, 0x1D]);
assert.equal(plainEdited[0x22], 7);
for (const stored of [raw, canonical]) {
  const exported = getImportedCanonicalBytes(stored, 100);
  assert.equal(exported.length, 100);
  assert.deepEqual(exported.slice(0, 80), canonical, 'PK3 export preserves all original canonical bytes');
  assert(exported.slice(80).every(value => value === 0));
}

console.log('Imported Pokémon field-preservation tests passed');
