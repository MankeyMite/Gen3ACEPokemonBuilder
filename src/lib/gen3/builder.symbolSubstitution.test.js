import { parseBase64Emerald, toBase64Emerald } from './builder.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function boxName(output, boxNumber) {
  const match = output.match(new RegExp(`Box\\s+${boxNumber}:\\s+\\(([^)]*)\\)`));
  return match?.[1] || '';
}

const bytes = new Uint8Array(80);
const original = toBase64Emerald(bytes, { switchSafe: true });
const converted = toBase64Emerald(bytes, {
  switchSafe: true,
  symbolSubstitutionBox: 5,
});

assert(converted.manualSubstitutionCount === 4, 'Box 5 should convert four safely replaceable capitals');
assert(converted.manualSubstitutionCounts[5] === 4, 'Box 5 should report its conversion count');
assert(boxName(converted.text, 4) === boxName(original.text, 4), 'Box 4 should remain unchanged');
assert(boxName(converted.text, 5) === '.P.A.P.A', 'Box 5 should contain compensated symbol replacements');
assert(boxName(converted.text, 6) === boxName(original.text, 6), 'Box 6 should remain unchanged');

const parsed = parseBase64Emerald(converted.text);
assert(
  Buffer.from(parsed.bytes).equals(Buffer.from(bytes)),
  'Manually converted output must decode to the original bytes',
);

const multipleBoxes = toBase64Emerald(bytes, {
  switchSafe: true,
  symbolSubstitutionBoxes: [7, 5],
});
assert(multipleBoxes.manualSubstitutionCount === 8, 'Multiple selected boxes should remain converted together');
assert(multipleBoxes.manualSubstitutionCounts[5] === 4, 'Box 5 should remain converted');
assert(multipleBoxes.manualSubstitutionCounts[7] === 4, 'Box 7 should also be converted');
assert(boxName(multipleBoxes.text, 5) === '.P.A.P.A', 'Box 5 conversion should be retained');
assert(boxName(multipleBoxes.text, 7) === '.P.A.P.A', 'Box 7 conversion should be applied');
assert(
  Buffer.from(parseBase64Emerald(multipleBoxes.text).bytes).equals(Buffer.from(bytes)),
  'Multiple converted boxes must still decode to the original bytes',
);

const consoleOutput = toBase64Emerald(bytes, {
  switchSafe: false,
  symbolSubstitutionBoxes: [5, 7],
});
assert(consoleOutput.manualSubstitutionCount === 0, 'Console output must ignore manual Switch conversion');
assert(boxName(consoleOutput.text, 5) === 'AAAAAAAA', 'Console output must retain the original box name');

console.log('Manual Switch symbol-substitution checks passed.');
