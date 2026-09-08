import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GEN3_HEX_FONT_SHEETS } from '../../data/gen3HexFontSheets.js';
import {
  GAME_SCAN_CHUNK_COUNT,
  assembleScannedPokemonHex,
  cleanHexChunkDraft,
  formatScannedPokemonHex,
  getCenteredVideoCrop,
  getConfirmedChunkCount,
  getNextIncompleteChunkIndex,
  validateHexChunk,
} from './gameHexScan.js';
import {
  compareGen3GlyphMasks,
  extractHexCandidate,
  recognizeGen3HexFromCanvas,
} from './gen3HexRecognizer.js';

assert.equal(cleanHexChunkDraft(' ab-cd 12g34 '), 'ABCD1234');
assert.equal(validateHexChunk('ABCDEF09').valid, true);
assert.equal(validateHexChunk('ABCDE').valid, false);
assert.equal(extractHexCandidate('Box 1: ABCD1234'), 'ABCD1234');
assert.equal(extractHexCandidate('B1 ABCD 1234 extra'), '');

const sampleGlyphMask = new Uint8Array(16 * 16);
sampleGlyphMask[17] = 1;
sampleGlyphMask[18] = 1;
assert.equal(compareGen3GlyphMasks(sampleGlyphMask, sampleGlyphMask), 1);

const recognition = await recognizeGen3HexFromCanvas({}, {
  TextDetector: class {
    async detect() {
      return [{ rawValue: 'ABCD1234' }];
    }
  },
});
assert.deepEqual(recognition, {
  value: 'ABCD1234',
  supported: true,
  method: 'browser-text-detector',
});

const chunks = Array.from({ length: GAME_SCAN_CHUNK_COUNT }, (_, index) =>
  index.toString(16).toUpperCase().padStart(8, '0'));
assert.equal(getConfirmedChunkCount(chunks), GAME_SCAN_CHUNK_COUNT);
assert.equal(getNextIncompleteChunkIndex(chunks), -1);
assert.equal(assembleScannedPokemonHex(chunks).length, 160);
assert.equal(formatScannedPokemonHex(chunks).split('\n').length, 5);

const incomplete = [...chunks];
incomplete[7] = '';
assert.equal(getNextIncompleteChunkIndex(incomplete), 7);
assert.throws(() => assembleScannedPokemonHex(incomplete), /Chunk 8/);

assert.deepEqual(getCenteredVideoCrop(1600, 900, 4), {
  x: 0,
  y: 250,
  width: 1600,
  height: 400,
});

assert.match(GEN3_HEX_FONT_SHEETS.emerald, /^data:image\/png;base64,/);
assert.match(GEN3_HEX_FONT_SHEETS.frlg, /^data:image\/png;base64,/);

const indexMarkup = await readFile(new URL('../../../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../../main.js', import.meta.url), 'utf8');
assert.match(indexMarkup, /data-import-tab="scan"/);
assert.match(indexMarkup, /id="gameScanImportRoot"/);
assert.match(mainSource, /initGameHexScanner\(\{/);
assert.match(mainSource, /onImportHex:\s*hex\s*=>\s*\{[\s\S]*?onLoadFromHex\(hex\)/);

class FakeTextDetector {
  async detect() {
    return [{ rawValue: 'ABCD 1234' }];
  }
}
assert.deepEqual(
  await recognizeGen3HexFromCanvas({}, { TextDetector: FakeTextDetector }),
  { value: 'ABCD1234', supported: true, method: 'browser-text-detector' },
);

console.log('game hex scan tests passed');
