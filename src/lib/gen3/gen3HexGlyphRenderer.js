import { GEN3_HEX_FONT_SHEETS } from '../../data/gen3HexFontSheets.js';
import { EMERALD_CHAR_MAP } from '../../data/gen3CharMap.js';

const GLYPH_SIZE = 16;
const GLYPH_COLUMNS = 16;
const GLYPH_ADVANCE = 7;
const HEX_CHARACTERS = '0123456789ABCDEF';
const imagePromises = new Map();
const pixelSources = new WeakMap();
const templatePromises = new Map();

function loadFontImage(profile) {
  const source = GEN3_HEX_FONT_SHEETS[profile] || GEN3_HEX_FONT_SHEETS.emerald;
  if (imagePromises.has(source)) return imagePromises.get(source);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The Gen 3 glyph sheet could not be loaded.'));
    image.src = source;
  });
  imagePromises.set(source, promise);
  return promise;
}

function getPixelSource(image) {
  if (pixelSources.has(image)) return pixelSources.get(image);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const source = {
    width: canvas.width,
    data: imageData.data,
    background: Array.from(imageData.data.slice(0, 4)),
  };
  pixelSources.set(image, source);
  return source;
}

function isBackgroundPixel(source, offset) {
  const background = source.background;
  return source.data[offset] === background[0]
    && source.data[offset + 1] === background[1]
    && source.data[offset + 2] === background[2]
    && source.data[offset + 3] === background[3];
}

function drawGlyph(context, source, character, outputX, scale) {
  const glyphIndex = EMERALD_CHAR_MAP[character];
  if (glyphIndex === undefined) return;
  const sourceX = (glyphIndex % GLYPH_COLUMNS) * GLYPH_SIZE;
  const sourceY = Math.floor(glyphIndex / GLYPH_COLUMNS) * GLYPH_SIZE;

  for (let y = 0; y < GLYPH_SIZE; y++) {
    for (let x = 0; x < GLYPH_SIZE; x++) {
      const offset = (((sourceY + y) * source.width) + sourceX + x) * 4;
      if (source.data[offset + 3] === 0 || isBackgroundPixel(source, offset)) continue;
      context.fillStyle = `rgba(${source.data[offset]}, ${source.data[offset + 1]}, ${source.data[offset + 2]}, ${source.data[offset + 3] / 255})`;
      context.fillRect(outputX + (x * scale), y * scale, scale, scale);
    }
  }
}

function centerBinaryMask(mask) {
  let minX = GLYPH_SIZE;
  let minY = GLYPH_SIZE;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < GLYPH_SIZE; y++) {
    for (let x = 0; x < GLYPH_SIZE; x++) {
      if (!mask[(y * GLYPH_SIZE) + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return mask;
  const centered = new Uint8Array(GLYPH_SIZE * GLYPH_SIZE);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const targetX = Math.floor((GLYPH_SIZE - width) / 2);
  const targetY = Math.floor((GLYPH_SIZE - height) / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      centered[((targetY + y) * GLYPH_SIZE) + targetX + x] =
        mask[((minY + y) * GLYPH_SIZE) + minX + x];
    }
  }
  return centered;
}

export function centerGen3GlyphMask(mask) {
  return centerBinaryMask(mask);
}

export async function getGen3HexGlyphTemplates(profile = 'emerald') {
  if (templatePromises.has(profile)) return templatePromises.get(profile);
  const promise = loadFontImage(profile).then(image => {
    const source = getPixelSource(image);
    const templates = {};
    for (const character of HEX_CHARACTERS) {
      const glyphIndex = EMERALD_CHAR_MAP[character];
      const sourceX = (glyphIndex % GLYPH_COLUMNS) * GLYPH_SIZE;
      const sourceY = Math.floor(glyphIndex / GLYPH_COLUMNS) * GLYPH_SIZE;
      const mask = new Uint8Array(GLYPH_SIZE * GLYPH_SIZE);
      for (let y = 0; y < GLYPH_SIZE; y++) {
        for (let x = 0; x < GLYPH_SIZE; x++) {
          const offset = (((sourceY + y) * source.width) + sourceX + x) * 4;
          mask[(y * GLYPH_SIZE) + x] =
            source.data[offset + 3] > 0 && !isBackgroundPixel(source, offset) ? 1 : 0;
        }
      }
      templates[character] = centerBinaryMask(mask);
    }
    return templates;
  });
  templatePromises.set(profile, promise);
  return promise;
}

export async function renderGen3HexGlyphs(canvas, text, profile = 'emerald', options = {}) {
  if (!canvas) return;
  const value = String(text || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  const scale = Math.max(1, Number(options.scale) || 3);
  const image = await loadFontImage(profile);
  const source = getPixelSource(image);
  const width = Math.max(1, ((value.length * GLYPH_ADVANCE) + 1) * scale);
  const height = GLYPH_SIZE * scale;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  value.split('').forEach((character, index) => {
    drawGlyph(context, source, character, index * GLYPH_ADVANCE * scale, scale);
  });
}
