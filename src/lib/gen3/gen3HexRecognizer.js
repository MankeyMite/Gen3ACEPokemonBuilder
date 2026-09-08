import { GAME_SCAN_GUIDE_REGION, validateHexChunk } from './gameHexScan.js';
import {
  centerGen3GlyphMask,
  getGen3HexGlyphTemplates,
} from './gen3HexGlyphRenderer.js';

const GLYPH_SIZE = 16;
const HEX_CHARACTERS = '0123456789ABCDEF';

export function extractHexCandidate(text) {
  const compact = String(text || '').toUpperCase().replace(/\s+/g, '');
  const exact = compact.match(/(?:^|[^0-9A-F])([0-9A-F]{8})(?:[^0-9A-F]|$)/);
  if (exact) return exact[1];
  return validateHexChunk(compact).valid ? compact : '';
}

function maskPixel(mask, x, y) {
  if (x < 0 || y < 0 || x >= GLYPH_SIZE || y >= GLYPH_SIZE) return 0;
  return mask[(y * GLYPH_SIZE) + x] ? 1 : 0;
}

export function compareGen3GlyphMasks(sample, template) {
  let best = 0;
  for (let shiftY = -2; shiftY <= 2; shiftY++) {
    for (let shiftX = -2; shiftX <= 2; shiftX++) {
      let intersection = 0;
      let samplePixels = 0;
      let templatePixels = 0;
      for (let y = 0; y < GLYPH_SIZE; y++) {
        for (let x = 0; x < GLYPH_SIZE; x++) {
          const samplePixel = maskPixel(sample, x, y);
          const templatePixel = maskPixel(template, x - shiftX, y - shiftY);
          samplePixels += samplePixel;
          templatePixels += templatePixel;
          if (samplePixel && templatePixel) intersection += 1;
        }
      }
      const score = samplePixels + templatePixels
        ? (2 * intersection) / (samplePixels + templatePixels)
        : 0;
      best = Math.max(best, score);
    }
  }
  return best;
}

function getOtsuThreshold(values) {
  const histogram = new Uint32Array(256);
  values.forEach(value => { histogram[value] += 1; });
  const total = values.length;
  let weightedTotal = 0;
  for (let index = 0; index < histogram.length; index++) {
    weightedTotal += index * histogram[index];
  }
  let backgroundWeight = 0;
  let backgroundTotal = 0;
  let bestVariance = -1;
  let threshold = 32;
  for (let index = 0; index < histogram.length; index++) {
    backgroundWeight += histogram[index];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundTotal += index * histogram[index];
    const backgroundMean = backgroundTotal / backgroundWeight;
    const foregroundMean = (weightedTotal - backgroundTotal) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * ((backgroundMean - foregroundMean) ** 2);
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = index;
    }
  }
  return Math.max(18, threshold);
}

function makeCellMask(canvas, cellIndex) {
  const scratch = document.createElement('canvas');
  // A Gen 3 hex glyph advances about 7 pixels across a 16-pixel line. Keeping
  // that narrow cell aspect prevents camera pixels from being stretched to
  // twice the width of the reference glyphs.
  const normalizedCellWidth = 8;
  scratch.width = normalizedCellWidth;
  scratch.height = GLYPH_SIZE;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  const regionX = canvas.width * GAME_SCAN_GUIDE_REGION.x;
  const regionY = canvas.height * GAME_SCAN_GUIDE_REGION.y;
  const regionWidth = canvas.width * GAME_SCAN_GUIDE_REGION.width;
  const regionHeight = canvas.height * GAME_SCAN_GUIDE_REGION.height;
  const cellWidth = regionWidth / 8;
  context.imageSmoothingEnabled = true;
  context.drawImage(
    canvas,
    regionX + (cellIndex * cellWidth),
    regionY,
    cellWidth,
    regionHeight,
    0,
    0,
    normalizedCellWidth,
    GLYPH_SIZE,
  );
  const data = context.getImageData(0, 0, normalizedCellWidth, GLYPH_SIZE).data;
  const borderPixels = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    for (let x = 0; x < normalizedCellWidth; x++) {
      if (x > 0 && x < normalizedCellWidth - 1 && y > 0 && y < GLYPH_SIZE - 1) continue;
      const offset = ((y * normalizedCellWidth) + x) * 4;
      borderPixels.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  const background = [0, 1, 2].map(channel => {
    const values = borderPixels.map(pixel => pixel[channel]).sort((left, right) => left - right);
    return values[Math.floor(values.length / 2)];
  });
  const distances = [];
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] - background[0];
    const green = data[index + 1] - background[1];
    const blue = data[index + 2] - background[2];
    distances.push(Math.min(255, Math.round(Math.sqrt((red ** 2) + (green ** 2) + (blue ** 2)) / 1.732)));
  }
  const threshold = getOtsuThreshold(distances);
  const mask = new Uint8Array(GLYPH_SIZE * GLYPH_SIZE);
  const insetX = Math.floor((GLYPH_SIZE - normalizedCellWidth) / 2);
  distances.forEach((distance, index) => {
    const x = index % normalizedCellWidth;
    const y = Math.floor(index / normalizedCellWidth);
    mask[(y * GLYPH_SIZE) + insetX + x] = distance > threshold ? 1 : 0;
  });
  return centerGen3GlyphMask(mask);
}

async function recognizeWithGen3Templates(canvas, profile) {
  if (!canvas || !canvas.width || !canvas.height || typeof document === 'undefined') {
    return { value: '', supported: false, method: 'gen3-template' };
  }
  const templates = await getGen3HexGlyphTemplates(profile);
  const characters = [];
  const confidences = [];
  for (let cellIndex = 0; cellIndex < 8; cellIndex++) {
    const sample = makeCellMask(canvas, cellIndex);
    const ranked = HEX_CHARACTERS.split('')
      .map(character => ({
        character,
        score: compareGen3GlyphMasks(sample, templates[character]),
      }))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];
    const margin = best.score - ranked[1].score;
    if (best.score < 0.42 || margin < 0.015) {
      return { value: '', supported: true, method: 'gen3-template' };
    }
    characters.push(best.character);
    confidences.push(best.score);
  }
  return {
    value: characters.join(''),
    confidence: confidences.reduce((total, value) => total + value, 0) / confidences.length,
    supported: true,
    method: 'gen3-template',
  };
}

export async function recognizeGen3HexFromCanvas(canvas, options = {}) {
  let templateResult = { value: '', supported: false, method: 'gen3-template' };
  try {
    templateResult = await recognizeWithGen3Templates(canvas, options.fontProfile || 'emerald');
    if (templateResult.value) return templateResult;
  } catch {}

  const Detector = options.TextDetector || globalThis.TextDetector;
  if (typeof Detector !== 'function') {
    return templateResult.supported
      ? templateResult
      : { value: '', supported: false, method: 'manual' };
  }

  try {
    const detector = new Detector();
    const results = await detector.detect(canvas);
    const detectedText = Array.from(results || [])
      .map(result => result?.rawValue || result?.text || '')
      .filter(Boolean)
      .join(' ');
    return {
      value: extractHexCandidate(detectedText),
      supported: true,
      method: 'browser-text-detector',
    };
  } catch {
    return { value: '', supported: true, method: 'browser-text-detector' };
  }
}
