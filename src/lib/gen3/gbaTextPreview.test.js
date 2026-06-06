import assert from 'node:assert/strict';
import {
  charToGen3Code,
  getGlyphIndexForChar,
  parseBase64BoxOutput,
} from './gbaTextPreview.js';
import { GBA_FONT_NORMAL_WIDTHS } from '../../data/gbaFontNormalWidths.js';

assert.equal(GBA_FONT_NORMAL_WIDTHS.length, 512);

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
  assert.notEqual(charToGen3Code(ch), undefined, `missing Gen 3 code for ${JSON.stringify(ch)}`);
}

const switchSubstitutionChars = ['.', '-', '\u2026', '\u201C', '\u201D', '\u2018', '\u2019', '\u2642', '\u2640', ',', '/'];
for (const ch of switchSubstitutionChars) {
  assert.notEqual(getGlyphIndexForChar(ch), undefined, `missing Switch substitution glyph for ${JSON.stringify(ch)}`);
}

console.log('gbaTextPreview tests passed');
