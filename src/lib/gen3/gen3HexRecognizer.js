import { validateHexChunk } from './gameHexScan.js';
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
  scratch.width = GLYPH_SIZE;
  scratch.height = GLYPH_SIZE;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  const regionX = canvas.width * 0.05;
  const regionY = canvas.height * 0.14;
  const regionWidth = canvas.width * 0.9;
  const regionHeight = canvas.height * 0.72;
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
    GLYPH_SIZE,
    GLYPH_SIZE,
  );
  const data = context.getImageData(0, 0, GLYPH_SIZE, GLYPH_SIZE).data;
  const borderPixels = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    for (let x = 0; x < GLYPH_SIZE; x++) {
      if (x > 1 && x < GLYPH_SIZE - 2 && y > 1 && y < GLYPH_SIZE - 2) continue;
      const offset = ((y * GLYPH_SIZE) + x) * 4;
      borderPixels.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  const background = [0, 1, 2].map(channel =>
    borderPixels.reduce((total, pixel) => total + pixel[channel], 0) / borderPixels.length);
  const distances = [];
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] - background[0];
    const green = data[index + 1] - background[1];
    const blue = data[index + 2] - background[2];
    distances.push(Math.min(255, Math.round(Math.sqrt((red ** 2) + (green ** 2) + (blue ** 2)) / 1.732)));
  }
  const threshold = getOtsuThreshold(distances);
  const mask = Uint8Array.from(distances, distance => distance > threshold ? 1 : 0);
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
