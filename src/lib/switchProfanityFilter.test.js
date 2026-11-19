import assert from 'node:assert/strict';
import { getSwitchProfanityFilter, switchFilterModeFromSearch, DEFAULT_SWITCH_FILTER_MODE } from './switchProfanityFilter.js';
import { frlgProfanityFilter } from './frlgProfanityFilter.js';
import { createProfanityFilter } from './profanityFilter.js';
import { PROFANITY_LIST } from '../data/profanity.gen3.js';
import { HARDWARE_BLOCKED, HARDWARE_ALLOWED } from './fixtures/frlgProfanity.hardware.js';
import { toBase64Emerald, parseBase64Emerald } from './gen3/builder.js';
import { decodeAceBoxNames } from './gen3/base64RepairValidation.js';

assert.equal(DEFAULT_SWITCH_FILTER_MODE, 'current');
assert.equal(getSwitchProfanityFilter(), frlgProfanityFilter);
for (const search of ['', '?switchFilter=current', '?switchFilter=unknown', '?different=legacy']) {
  assert.equal(switchFilterModeFromSearch(search), 'current');
}
assert.equal(switchFilterModeFromSearch('?keep=1&switchFilter=legacy'), 'legacy');
assert.throws(() => getSwitchProfanityFilter('unknown'), /Unknown Switch filter mode/);
const backup = getSwitchProfanityFilter('legacy');
const original = createProfanityFilter(PROFANITY_LIST);
assert.equal(backup, getSwitchProfanityFilter('legacy'));
for (const input of [...HARDWARE_BLOCKED, ...HARDWARE_ALLOWED, 'Abj3bj1A', 'w!i!x', 'a s s', 'as s', 'xfagx']) {
  assert.equal(backup.check(input), original.check(input), `Legacy prediction retained: ${input}`);
  const actual = backup.checkDetailed(input), expected = original.checkDetailed(input);
  assert.equal(actual.blocked, expected.blocked);
  assert.deepEqual(actual.matches, expected.matches);
  for (const term of new Set(actual.matches)) {
    assert.ok(actual.occurrences.some(m => m.term === term), `Repair positions available for ${input}: ${term}`);
  }
  for (const match of actual.occurrences) {
    assert.equal(match.positions.map(i => input[i]).join('').toLowerCase(), match.term);
    assert.ok(match.patterns.length);
  }
}

const bytesOf = prefix => new Uint8Array(Buffer.from((prefix + 'A'.repeat(107)).slice(0, 107) + '=', 'base64'));
const boxesOf = output => [...output.text.matchAll(/Box\s+\d+:\s+\(([^)]*)\)/g)].map(m => m[1]);
const bytes = bytesOf('AdpAAAAA');
const current = toBase64Emerald(bytes);
assert.deepEqual(current, toBase64Emerald(bytes, { switchFilterMode: 'current' }));
assert.equal(current.repairComplete, true);
const legacy = toBase64Emerald(bytes, { switchFilterMode: 'legacy' });
assert.equal(legacy.repairComplete, false, 'Backup retains the known embedded dp false positive');
assert.ok(legacy.unresolvedMatches[0].matches.includes('dp'));

function verify(bytes, output) {
  const boxes = boxesOf(output);
  assert.equal(boxes.length, 14);
  assert.ok(boxes.every(box => box.length <= 8));
  assert.deepEqual(parseBase64Emerald(output.text).bytes, bytes);
  assert.deepEqual(decodeAceBoxNames(boxes), bytes);
}
verify(bytes, current);
verify(bytes, legacy);
const splitBytes = bytesOf('Rx5XxlIk');
const split = toBase64Emerald(splitBytes, { switchFilterMode: 'legacy' });
assert.equal(boxesOf(split)[0], 'Rx5X');
verify(splitBytes, split);
const manualBytes = new Uint8Array(80);
const manual = toBase64Emerald(manualBytes, { switchFilterMode: 'legacy', symbolSubstitutionBoxes: [5, 7] });
assert.equal(manual.manualSubstitutionCount, 8);
verify(manualBytes, manual);

const bjBase64 = 'A'.repeat(24) + '??AgLO7ebj4tn?AB' + 'A'.repeat(67);
const bjBytes = new Uint8Array(Buffer.from(bjBase64.replace(/\?/g, '/') + '=', 'base64'));
const borrowed = toBase64Emerald(bjBytes, { switchFilterMode: 'legacy' });
assert.ok(boxesOf(borrowed)[4].startsWith('ebj'));
verify(bjBytes, borrowed);
assert.deepEqual(toBase64Emerald(bytes, { switchSafe: false, switchFilterMode: 'legacy' }).text,
  toBase64Emerald(bytes, { switchSafe: false }).text, 'Filter mode does not alter console output');
console.log('Switch filter selection: current default, explicit legacy predictions, repair positions, splitting, borrowing, manual symbols and byte-exact output passed.');
