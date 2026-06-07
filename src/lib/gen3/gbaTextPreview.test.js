import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  charToGen3Code,
  getGlyphIndexForChar,
  parseBase64BoxOutput,
  resolveGbaTextPreviewFontProfile,
} from './gbaTextPreview.js';
import { FRLG_FONT_NORMAL_COPY_1_WIDTHS, GBA_FONT_NORMAL_WIDTHS } from '../../data/gbaFontNormalWidths.js';

assert.equal(GBA_FONT_NORMAL_WIDTHS.length, 512);
assert.equal(FRLG_FONT_NORMAL_COPY_1_WIDTHS.length, 512);
assert.equal(resolveGbaTextPreviewFontProfile('emerald').fontId, 'FONT_NORMAL');
assert.equal(resolveGbaTextPreviewFontProfile('frlg').fontId, 'FONT_NORMAL_COPY_1');
assert.equal(resolveGbaTextPreviewFontProfile('unknown').id, 'emerald');
assert(existsSync(fileURLToPath(resolveGbaTextPreviewFontProfile('emerald').imagePath)), 'missing Emerald preview font image');
assert(existsSync(fileURLToPath(resolveGbaTextPreviewFontProfile('frlg').imagePath)), 'missing FRLG preview font image');

const rows = parseBase64BoxOutput(`Box names (BASE64):
  Box 1:  (AbC123!?)
  Box 2:  (.-\u2026\u201C\u201D\u2018\u2019)
  Box 14: (xyZ) [lowercase y]`);

assert.deepEqual(rows, [
  { label: 'Box 1', text: 'AbC123!?' },
  { label: 'Box 2', text: '.-\u2026\u201C\u201D\u2018\u2019' },
  { label: 'Box 14', text: 'xyZ' },
]);

const requiredChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/?!= ():';
for (const ch of requiredChars) {
  assert.notEqual(charToGen3Code(ch, { fontProfile: 'emerald' }), undefined, `missing Emerald code for ${JSON.stringify(ch)}`);
  assert.notEqual(charToGen3Code(ch, { fontProfile: 'frlg' }), undefined, `missing FRLG code for ${JSON.stringify(ch)}`);
}

assert.equal(charToGen3Code('+', { fontProfile: 'emerald' }), 0x2F);
assert.equal(charToGen3Code('+', { fontProfile: 'frlg' }), 0x2E);

const switchSubstitutionChars = ['.', '-', '\u2026', '\u201C', '\u201D', '\u2018', '\u2019', '\u2642', '\u2640', ',', '/'];
for (const ch of switchSubstitutionChars) {
  assert.notEqual(getGlyphIndexForChar(ch, { fontProfile: 'emerald' }), undefined, `missing Emerald Switch substitution glyph for ${JSON.stringify(ch)}`);
  assert.notEqual(getGlyphIndexForChar(ch, { fontProfile: 'frlg' }), undefined, `missing FRLG Switch substitution glyph for ${JSON.stringify(ch)}`);
}

console.log('gbaTextPreview tests passed');
