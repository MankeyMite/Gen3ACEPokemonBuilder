import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GEN3_HEX_FONT_SHEETS } from '../../data/gen3HexFontSheets.js';
import {
  GAME_SCAN_CHUNK_COUNT,
  GAME_SCAN_GUIDE_REGION,
  assembleScannedPokemonHex,
  cleanHexChunkDraft,
  createHexScanConsensus,
  formatScannedPokemonHex,
  getCenteredVideoCrop,
  getConfirmedChunkCount,
  getNextIncompleteChunkIndex,
  validateHexChunk,
} from './gameHexScan.js';
import {
  extractHexCandidate,
  recognizeGen3HexFromCanvas,
} from './gen3HexRecognizer.js';

assert.equal(cleanHexChunkDraft(' ab-cd 12g34 '), 'ABCD1234');
assert.deepEqual(GAME_SCAN_GUIDE_REGION, {
  x: 0.26,
  y: 0.26,
  width: 0.48,
  height: 0.48,
});
assert.equal(validateHexChunk('ABCDEF09').valid, true);
assert.equal(validateHexChunk('ABCDE').valid, false);
assert.equal(extractHexCandidate('Box 1: ABCD1234'), 'ABCD1234');
assert.equal(extractHexCandidate('B1 ABCD 1234 extra'), '');

const consensus = createHexScanConsensus({ requiredMatches: 3, windowSize: 5 });
assert.equal(consensus.push('9E439043').accepted, false);
assert.equal(consensus.push('9E439043').accepted, false);
assert.equal(consensus.push('1E439043').accepted, false);
const stableReading = consensus.push('9E439043');
assert.equal(stableReading.accepted, true);
assert.equal(stableReading.candidate, '9E439043');
consensus.reset();
assert.deepEqual(consensus.getSamples(), []);

const recognition = await recognizeGen3HexFromCanvas({}, {
  tesseractWorker: {
    async recognize() {
      return { data: { text: 'ABCD 1234\n', confidence: 88 } };
    },
  },
  skipPreprocessing: true,
});
assert.deepEqual(recognition, {
  value: 'ABCD1234',
  confidence: 88,
  rawText: 'ABCD 1234\n',
  supported: true,
  method: 'tesseract',
});

const browserRecognition = await recognizeGen3HexFromCanvas({}, {
  tesseractWorker: {
    async recognize() {
      throw new Error('OCR unavailable');
    },
  },
  TextDetector: class {
    async detect() {
      return [{ rawValue: 'ABCD1234' }];
    }
  },
});
assert.deepEqual(browserRecognition, {
  value: 'ABCD1234',
  rawText: 'ABCD1234',
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
const stylesSource = await readFile(new URL('../../styles.css', import.meta.url), 'utf8');
assert.match(indexMarkup, /data-import-tab="scan"/);
assert.match(indexMarkup, /id="gameScanImportRoot"/);
assert.match(mainSource, /initGameHexScanner\(\{/);
assert.match(mainSource, /onImportHex:\s*hex\s*=>\s*\{[\s\S]*?onLoadFromHex\(hex\)/);
assert.match(stylesSource, /\.game-scan-reticle\s*\{[\s\S]*?width:\s*48%/);
assert.match(stylesSource, /\.game-scan-camera-shell\s*\{[\s\S]*?min-height:\s*0/);

class FakeTextDetector {
  async detect() {
    return [{ rawValue: 'ABCD 1234' }];
  }
}
assert.deepEqual(
  await recognizeGen3HexFromCanvas({}, {
    tesseractWorker: { recognize: async () => { throw new Error('OCR unavailable'); } },
    TextDetector: FakeTextDetector,
  }),
  { value: 'ABCD1234', rawText: 'ABCD 1234', supported: true, method: 'browser-text-detector' },
);

console.log('game hex scan tests passed');
