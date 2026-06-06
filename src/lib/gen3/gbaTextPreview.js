import { GBA_FONT_NORMAL_PROFILE } from '../../data/gbaFontNormalWidths.js';
import { GEN3_CHAR_MAP } from '../../data/gen3CharMap.js';

const DEFAULT_FONT_URL = new URL('../../assets/fonts/latin_normal.png', import.meta.url).href;
const GLYPH_BACKGROUND_KEY = 'glyphBackgroundKey';

let fontImagePromise = null;
let loadedFontImage = null;
const pixelSourceCache = new WeakMap();

export function loadGbaFontImage(src = DEFAULT_FONT_URL) {
  if (loadedFontImage?.src === src) return Promise.resolve(loadedFontImage);
  if (fontImagePromise) return fontImagePromise;

  fontImagePromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      loadedFontImage = image;
      resolve(image);
    };
    image.onerror = () => {
      fontImagePromise = null;
      reject(new Error('Could not load Gen 3 Latin font image.'));
    };
    image.src = src;
  });

  return fontImagePromise;
}

export function charToGen3Code(ch) {
  return GEN3_CHAR_MAP[ch];
}

export function getGlyphIndexForChar(ch) {
  return charToGen3Code(ch);
}

function getFontProfile(options = {}) {
  return options.fontProfile || GBA_FONT_NORMAL_PROFILE;
}

function getPixelSource(image) {
  let source = pixelSourceCache.get(image);
  if (source) return source;

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bg = imageData.data.slice(0, 4);
  source = { width: canvas.width, height: canvas.height, data: imageData.data, [GLYPH_BACKGROUND_KEY]: bg };
  pixelSourceCache.set(image, source);
  return source;
}

function pixelOffset(source, x, y) {
  return ((y * source.width) + x) * 4;
}

function isTransparentGlyphPixel(source, offset) {
  const bg = source[GLYPH_BACKGROUND_KEY];
  return source.data[offset + 3] === 0
    || (source.data[offset] === bg[0]
      && source.data[offset + 1] === bg[1]
      && source.data[offset + 2] === bg[2]
      && source.data[offset + 3] === bg[3]);
}

function glyphWidthForIndex(glyphIndex, profile) {
  return profile.widths[glyphIndex] ?? profile.glyphWidth;
}

function drawFallbackPlaceholder(ctx, x, y, scale, profile) {
  const width = Math.max(6, glyphWidthForIndex(profile.placeholderCode, profile));
  const height = profile.lineHeight;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeRect(x + scale, y + scale, (width - 2) * scale, (height - 2) * scale);
  return width;
}

export function drawGbaGlyph(ctx, ch, x, y, scale = 3, options = {}) {
  const profile = getFontProfile(options);
  const image = options.image || loadedFontImage;
  const gen3Code = getGlyphIndexForChar(ch);
  const missing = gen3Code === undefined;
  const glyphIndex = missing ? profile.placeholderCode : gen3Code;
  const width = glyphWidthForIndex(glyphIndex, profile);

  if (!image) {
    return {
      width: drawFallbackPlaceholder(ctx, x, y, scale, profile),
      missing,
    };
  }

  const source = getPixelSource(image);
  const sx = (glyphIndex % profile.columns) * profile.glyphWidth;
  const sy = Math.floor(glyphIndex / profile.columns) * profile.glyphHeight;
  const drawWidth = Math.min(width, profile.glyphWidth);
  const drawHeight = profile.glyphHeight;

  if (sx + drawWidth > source.width || sy + drawHeight > source.height) {
    return {
      width: drawFallbackPlaceholder(ctx, x, y, scale, profile),
      missing: true,
    };
  }

  for (let py = 0; py < drawHeight; py++) {
    for (let px = 0; px < drawWidth; px++) {
      const offset = pixelOffset(source, sx + px, sy + py);
      if (isTransparentGlyphPixel(source, offset)) continue;
      ctx.fillStyle = `rgba(${source.data[offset]}, ${source.data[offset + 1]}, ${source.data[offset + 2]}, ${source.data[offset + 3] / 255})`;
      ctx.fillRect(x + (px * scale), y + (py * scale), scale, scale);
    }
  }

  return { width, missing };
}

export function drawGbaText(ctx, text, x = 0, y = 0, scale = 3, options = {}) {
  const profile = getFontProfile(options);
  const missingChars = new Set();
  let cursorX = x;

  ctx.imageSmoothingEnabled = false;
  for (const ch of Array.from(String(text || ''))) {
    const result = drawGbaGlyph(ctx, ch, cursorX, y, scale, options);
    if (result.missing) missingChars.add(ch);
    cursorX += (result.width + (options.letterSpacing ?? 0)) * scale;
  }

  return {
    width: cursorX - x,
    height: profile.lineHeight * scale,
    missingChars,
  };
}

function measureGbaText(text, options = {}) {
  const profile = getFontProfile(options);
  let width = 0;
  for (const ch of Array.from(String(text || ''))) {
    const glyphIndex = getGlyphIndexForChar(ch);
    const code = glyphIndex === undefined ? profile.placeholderCode : glyphIndex;
    width += glyphWidthForIndex(code, profile) + (options.letterSpacing ?? 0);
  }
  return Math.max(1, width);
}

export function parseBase64BoxOutput(outputText) {
  const rows = [];
  const lines = String(outputText || '').split(/\r?\n/);

  for (const line of lines) {
    const wrapped = line.match(/^\s*Box\s*(\d+)\s*:\s*\((.*?)\)/i);
    if (wrapped) {
      rows.push({ label: `Box ${Number(wrapped[1])}`, text: wrapped[2] });
      continue;
    }

    const plain = line.match(/^\s*Box\s*(\d+)\s*:\s*(.*?)\s*$/i);
    if (plain) {
      rows.push({ label: `Box ${Number(plain[1])}`, text: plain[2] });
    }
  }

  return rows;
}

function normalizeRows(boxOutputLines) {
  if (typeof boxOutputLines === 'string') return parseBase64BoxOutput(boxOutputLines);
  return Array.isArray(boxOutputLines)
    ? boxOutputLines
      .filter(row => row && typeof row.label === 'string')
      .map(row => ({ label: row.label, text: String(row.text || '') }))
    : [];
}

function setWarning(warningElement, missingChars, errorMessage = '') {
  if (!warningElement) return;
  if (errorMessage) {
    warningElement.hidden = false;
    warningElement.textContent = errorMessage;
    return;
  }

  if (!missingChars.size) {
    warningElement.hidden = true;
    warningElement.textContent = '';
    return;
  }

  warningElement.hidden = false;
  warningElement.textContent = `Missing preview glyphs: ${Array.from(missingChars).join(' ')}`;
}

export async function renderBoxNamePreview(container, boxOutputLines, options = {}) {
  if (!container) return { rows: [], missingChars: new Set() };

  const rows = normalizeRows(boxOutputLines);
  const profile = getFontProfile(options);
  const scale = Math.max(1, Math.floor(options.scale || 3));
  const paddingX = 4;
  const paddingY = 1;
  const missingChars = new Set();
  let image = null;

  try {
    image = await loadGbaFontImage(options.fontUrl || DEFAULT_FONT_URL);
  } catch (err) {
    container.textContent = '';
    setWarning(options.warningElement, missingChars, err?.message || 'Could not load Gen 3 Latin font image.');
    return { rows, missingChars, error: err };
  }

  container.textContent = '';

  for (const row of rows) {
    const previewRow = document.createElement('div');
    previewRow.className = 'gba-preview-row';

    const label = document.createElement('div');
    label.className = 'gba-preview-label';
    label.textContent = row.label;

    const canvas = document.createElement('canvas');
    canvas.className = 'gba-preview-canvas';
    canvas.setAttribute('aria-label', `${row.label} preview: ${row.text}`);
    canvas.width = (measureGbaText(row.text, { ...options, fontProfile: profile }) + (paddingX * 2)) * scale;
    canvas.height = (profile.lineHeight + (paddingY * 2)) * scale;

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.imageSmoothingEnabled = false;
    const drawn = drawGbaText(ctx, row.text, paddingX * scale, paddingY * scale, scale, {
      ...options,
      fontProfile: profile,
      image,
    });
    for (const ch of drawn.missingChars) missingChars.add(ch);

    previewRow.append(label, canvas);
    container.appendChild(previewRow);
  }

  setWarning(options.warningElement, missingChars);
  return { rows, missingChars };
}
