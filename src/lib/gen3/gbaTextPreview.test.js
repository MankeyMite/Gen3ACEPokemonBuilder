import assert from 'node:assert/strict';
import {
  charToGen3Code,
  findBoxNameCharacterAtTextOffset,
  findNearestBoxNameCharacterAtTextOffset,
  getCharacterKind,
} from './gbaTextPreview.js';

assert.equal(getCharacterKind('A').id, 'uppercase');
assert.equal(getCharacterKind('Z').label, 'Uppercase letter');
assert.equal(getCharacterKind('a').id, 'lowercase');
assert.equal(getCharacterKind('z').label, 'Lowercase letter');
assert.equal(getCharacterKind('0').id, 'number');
assert.equal(getCharacterKind('9').label, 'Number');
assert.equal(getCharacterKind('?').id, 'symbol');
assert.equal(getCharacterKind(' ').label, 'Symbol');

const output = `Box names (BASE64):
  Box 1:  (AbC123!?)
  Box 2:  (xyZ) [lowercase y]`;

const uppercaseOffset = output.indexOf('(AbC') + 1;
assert.deepEqual(findBoxNameCharacterAtTextOffset(output, uppercaseOffset), {
  character: 'A',
  offset: uppercaseOffset,
  boxNumber: 1,
  boxLabel: 'Box 1',
  kind: getCharacterKind('A'),
});

const lowercaseOffset = output.indexOf('b');
assert.equal(findBoxNameCharacterAtTextOffset(output, lowercaseOffset).kind.id, 'lowercase');

const numberOffset = output.indexOf('2');
assert.equal(findBoxNameCharacterAtTextOffset(output, numberOffset).kind.id, 'number');

const symbolOffset = output.indexOf('?');
assert.equal(findBoxNameCharacterAtTextOffset(output, symbolOffset).kind.id, 'symbol');
assert.equal(findNearestBoxNameCharacterAtTextOffset(output, symbolOffset + 1).character, '?');

assert.equal(findBoxNameCharacterAtTextOffset(output, output.indexOf('Box names')), null);
assert.equal(findBoxNameCharacterAtTextOffset(output, output.indexOf('[lowercase y]')), null);

const requiredChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/?!= ():';
for (const ch of requiredChars) {
  assert.notEqual(charToGen3Code(ch), undefined, `missing Gen 3 code for ${JSON.stringify(ch)}`);
}

assert.equal(charToGen3Code('+'), 0x2F);

console.log('gbaTextPreview character inspector tests passed');
