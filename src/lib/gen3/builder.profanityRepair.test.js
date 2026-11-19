import assert from 'node:assert/strict';
import { toBase64Emerald, parseBase64Emerald } from './builder.js';
import { decodeAceBoxNames, inspectBase64Repair } from './base64RepairValidation.js';
import { createFrlgProfanityFilter, frlgProfanityFilter } from '../frlgProfanityFilter.js';

const symbols = { A: '.', B: '-', D: '\u2026', E: '\u201C', F: '\u201D', G: '\u2018', H: '\u2019', I: '\u2642', J: '\u2640', L: ',', N: '/' };
const boxesOf = output => [...output.text.matchAll(/Box\s+\d+:\s+\(([^)]*)\)/g)].map(m => m[1]);
function bytesOf(stream) {
  const padded = (stream + 'A'.repeat(107)).slice(0, 107);
  return new Uint8Array(Buffer.from(padded.replace(/!/g, '+').replace(/\?/g, '/') + '=', 'base64'));
}
function customFilter(term, type) {
  const left = ['exact', 'prefix'].includes(type), right = ['exact', 'suffix'].includes(type);
  return createFrlgProfanityFilter({ rules: [{
    id: `test:${term}:${type}`, term, type, pattern: (left ? '^' : '.*') + term + (right ? '$' : '.*'),
    requiresLeftBoundary: left, requiresRightBoundary: right,
    sources: [{ language: 'een', version: 70, path: 'synthetic' }],
  }], allowlist: [] });
}
const cleanFilter = customFilter('nevermatching', 'substring');
let roundtrips = 0;
function verify(bytes, output, filter = frlgProfanityFilter) {
  const boxes = boxesOf(output);
  assert.equal(boxes.length, 14);
  assert.ok(boxes.every(box => Array.from(box).length <= 8));
  assert.deepEqual(parseBase64Emerald(output.text).bytes, bytes, 'Importer byte-exact roundtrip');
  assert.deepEqual(decodeAceBoxNames(boxes), bytes, 'Independent ACE arithmetic roundtrip');
  const inspection = inspectBase64Repair(boxes, bytes, filter);
  assert.equal(inspection.valid, true);
  assert.deepEqual(output.unresolvedMatches, inspection.unresolvedMatches);
  assert.equal(output.repairComplete, !inspection.unresolvedMatches.length);
  roundtrips++;
  return boxes;
}

// Every supported symbol at every position in a continuous four-digit group,
// including compensation wraparound in low nibbles and low two-bit fields.
for (const [letter, symbol] of Object.entries(symbols)) {
  for (let phase = 0; phase < 4; phase++) {
    for (const previous of ['P', 'g', 'w', '?']) {
      const prefix = Array(8).fill('P');
      prefix[phase] = letter;
      if (phase) prefix[phase - 1] = previous;
      const bytes = bytesOf(prefix.join(''));
      const output = toBase64Emerald(bytes, { profanityFilter: cleanFilter, symbolSubstitutionBoxes: [1] });
      assert.equal(verify(bytes, output, cleanFilter)[0][phase], symbol, `${letter}, phase ${phase}, previous ${previous}`);
    }
  }
}

// The first occurrence is embedded and allowed; only the later bj is blocked.
// Reconstructing a match by term alone would pick positions [1,2] and miss this cut.
const repeatedBytes = bytesOf('Abj3bj1A');
const repeatedOutput = toBase64Emerald(repeatedBytes);
assert.equal(verify(repeatedBytes, repeatedOutput)[0], 'Abj3b');
assert.equal(repeatedOutput.repairComplete, true);

// Retain the existing shift operation and its actual xxx match across a digit.
const xxxBytes = bytesOf('Rx5XxlIk');
const xxxOutput = toBase64Emerald(xxxBytes);
assert.equal(verify(xxxBytes, xxxOutput)[0], 'Rx5X');

// A prefix rule can be repaired by borrowing, even without the old boundaryTerms.
const prefixFilter = customFilter('bj', 'prefix');
const prefixBytes = bytesOf('A'.repeat(24) + 'AAAAAAAe' + 'bjAAAAAA');
const prefixOutput = toBase64Emerald(prefixBytes, { profanityFilter: prefixFilter });
assert.ok(verify(prefixBytes, prefixOutput, prefixFilter)[4].startsWith('ebj'));
assert.equal(prefixOutput.repairComplete, true);

// A suffix in the final box is not fixed by borrowing a prefix letter.
const suffixFilter = customFilter('bg', 'suffix');
// g has zero padding bits and survives canonical Base64 re-encoding unchanged.
const suffixBytes = bytesOf('A'.repeat(104) + 'Abg');
const suffixOutput = toBase64Emerald(suffixBytes, { profanityFilter: suffixFilter });
assert.equal(verify(suffixBytes, suffixOutput, suffixFilter)[13], 'Abg');
assert.equal(suffixOutput.repairComplete, false);

// Symbol compensation crosses a shifted box boundary and must update the
// preceding box as well. No Pokemon bytes may be changed by that correction.
const exactFilter = customFilter('bj', 'exact');
const crossBytes = bytesOf('Abj3bj1A' + 'PPPPgAPP');
const crossOutput = toBase64Emerald(crossBytes, { profanityFilter: exactFilter, symbolSubstitutionBoxes: [3] });
const crossBoxes = verify(crossBytes, crossOutput, exactFilter);
assert.equal(crossBoxes[2][0], '.');
assert.equal(crossBoxes[1].at(-1), 'f');

const impossibleBytes = bytesOf('xxxAAAAA');
const impossibleOutput = toBase64Emerald(impossibleBytes);
verify(impossibleBytes, impossibleOutput);
assert.equal(impossibleOutput.repairComplete, false);
assert.equal(impossibleOutput.unresolvedMatches[0].box, 1);
assert.ok(impossibleOutput.unresolvedMatches[0].occurrences.some(m => m.pattern === '.*xxx.*'));

const original = boxesOf(toBase64Emerald(new Uint8Array(80), { switchSafe: false }));
assert.equal(inspectBase64Repair(original.slice(1), new Uint8Array(80), cleanFilter).valid, false);
assert.equal(inspectBase64Repair([...original, ''], new Uint8Array(80), cleanFilter).valid, false);
assert.equal(inspectBase64Repair(['A'.repeat(9), ...original.slice(1)], new Uint8Array(80), cleanFilter).valid, false);
assert.equal(inspectBase64Repair(['P' + original[0].slice(1), ...original.slice(1)], new Uint8Array(80), cleanFilter).valid, false);
assert.equal(inspectBase64Repair(['\u2603' + original[0].slice(1), ...original.slice(1)], new Uint8Array(80), cleanFilter).valid, false);
assert.throws(() => toBase64Emerald(new Uint8Array(81)), /exactly 80 bytes/);

// Deterministic mixed inputs exercise repairs and retained manual controls.
let seed = 0x6ACE2026;
for (let n = 0; n < 96; n++) {
  const bytes = Uint8Array.from({ length: 80 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed >>> 24;
  });
  const before = new Uint8Array(bytes);
  verify(bytes, toBase64Emerald(bytes, n % 2 ? { symbolSubstitutionBoxes: [1, 5, 7, 14] } : {}));
  assert.deepEqual(bytes, before, 'The caller Pokemon bytes must remain untouched');
}
console.log(`FRLG repair: ${roundtrips} byte-exact cases; all symbols/phases, shifting, borrowing, repeated matches, cross-box compensation, rejection guards and unresolved cases passed.`);
