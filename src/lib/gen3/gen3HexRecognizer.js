import { GAME_SCAN_GUIDE_REGION, validateHexChunk } from './gameHexScan.js';

const HEX_CHARACTERS = '0123456789ABCDEF';
const TESSERACT_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
const OCR_CANVAS_WIDTH = 1000;
const OCR_CANVAS_HEIGHT = 280;
const OCR_PADDING = 20;

let tesseractLibraryPromise = null;
let tesseractWorkerPromise = null;

export function extractHexCandidate(text) {
  const compact = String(text || '').toUpperCase().replace(/\s+/g, '');
  const exact = compact.match(/(?:^|[^0-9A-F])([0-9A-F]{8})(?:[^0-9A-F]|$)/);
  if (exact) return exact[1];
  return validateHexChunk(compact).valid ? compact : '';
}

function getOtsuThreshold(histogram, total) {
  let weightedTotal = 0;
  for (let value = 0; value < histogram.length; value++) {
    weightedTotal += value * histogram[value];
  }

  let backgroundWeight = 0;
  let backgroundTotal = 0;
  let bestVariance = -1;
  let threshold = 127;
  for (let value = 0; value < histogram.length; value++) {
    backgroundWeight += histogram[value];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundTotal += value * histogram[value];
    const backgroundMean = backgroundTotal / backgroundWeight;
    const foregroundMean = (weightedTotal - backgroundTotal) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * ((backgroundMean - foregroundMean) ** 2);
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }
  return threshold;
}

// Give the OCR engine only the guide contents, enlarged and converted to clean
// black-on-white text. It remains font- and spacing-agnostic.
export function prepareHexOcrCanvas(canvas, { documentRef = globalThis.document } = {}) {
  if (!canvas?.width || !canvas?.height || !documentRef?.createElement) return canvas;

  const output = documentRef.createElement('canvas');
  output.width = OCR_CANVAS_WIDTH;
  output.height = OCR_CANVAS_HEIGHT;
  const context = output.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;

  const sourceX = Math.round(canvas.width * GAME_SCAN_GUIDE_REGION.x);
  const sourceY = Math.round(canvas.height * GAME_SCAN_GUIDE_REGION.y);
  const sourceWidth = Math.round(canvas.width * GAME_SCAN_GUIDE_REGION.width);
  const sourceHeight = Math.round(canvas.height * GAME_SCAN_GUIDE_REGION.height);
  context.fillStyle = '#fff';
  context.fillRect(0, 0, output.width, output.height);
  context.imageSmoothingEnabled = true;
  context.drawImage(
    canvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    OCR_PADDING,
    OCR_PADDING,
    output.width - (OCR_PADDING * 2),
    output.height - (OCR_PADDING * 2),
  );

  const image = context.getImageData(
    OCR_PADDING,
    OCR_PADDING,
    output.width - (OCR_PADDING * 2),
    output.height - (OCR_PADDING * 2),
  );
  const histogram = new Uint32Array(256);
  for (let index = 0; index < image.data.length; index += 4) {
    const gray = Math.round(
      (image.data[index] * 0.299)
      + (image.data[index + 1] * 0.587)
      + (image.data[index + 2] * 0.114),
    );
    histogram[gray] += 1;
    image.data[index] = gray;
    image.data[index + 1] = gray;
    image.data[index + 2] = gray;
  }

  const threshold = getOtsuThreshold(histogram, image.data.length / 4);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = image.data[index] <= threshold ? 0 : 255;
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, OCR_PADDING, OCR_PADDING);
  return output;
}

function loadTesseractLibrary() {
  if (globalThis.Tesseract?.createWorker) return Promise.resolve(globalThis.Tesseract);
  if (!globalThis.document?.createElement) {
    return Promise.reject(new Error('The browser OCR library is unavailable.'));
  }
  if (tesseractLibraryPromise) return tesseractLibraryPromise;

  tesseractLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-game-hex-ocr]');
    const script = existing || document.createElement('script');
    const finish = () => {
      if (globalThis.Tesseract?.createWorker) resolve(globalThis.Tesseract);
      else reject(new Error('The browser OCR library did not load.'));
    };
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('The browser OCR library could not be downloaded.')), { once: true });
    if (!existing) {
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.dataset.gameHexOcr = 'true';
      document.head.appendChild(script);
    }
  });
  return tesseractLibraryPromise;
}

async function getTesseractWorker(options = {}) {
  if (options.tesseractWorker) return options.tesseractWorker;
  if (tesseractWorkerPromise) return tesseractWorkerPromise;

  tesseractWorkerPromise = (async () => {
    const tesseract = options.Tesseract || await loadTesseractLibrary();
    const worker = await tesseract.createWorker('eng', tesseract.OEM?.LSTM_ONLY ?? 1);
    await worker.setParameters({
      tessedit_pageseg_mode: tesseract.PSM?.SINGLE_LINE ?? '7',
      tessedit_char_whitelist: HEX_CHARACTERS,
      preserve_interword_spaces: '0',
      user_defined_dpi: '300',
    });
    return worker;
  })();
  return tesseractWorkerPromise;
}

async function recognizeWithTesseract(canvas, options = {}) {
  const worker = await getTesseractWorker(options);
  const source = options.skipPreprocessing
    ? canvas
    : prepareHexOcrCanvas(canvas, options);
  const result = await worker.recognize(source);
  const rawText = result?.data?.text || '';
  return {
    value: extractHexCandidate(rawText),
    confidence: Number(result?.data?.confidence) || 0,
    rawText,
    supported: true,
    method: 'tesseract',
  };
}

async function recognizeWithBrowserTextDetector(canvas, options = {}) {
  const Detector = options.TextDetector || globalThis.TextDetector;
  if (typeof Detector !== 'function') return null;
  try {
    const detector = new Detector();
    const results = await detector.detect(canvas);
    const rawText = Array.from(results || [])
      .map(result => result?.rawValue || result?.text || '')
      .filter(Boolean)
      .join(' ');
    return {
      value: extractHexCandidate(rawText),
      rawText,
      supported: true,
      method: 'browser-text-detector',
    };
  } catch {
    return null;
  }
}

export async function recognizeGen3HexFromCanvas(canvas, options = {}) {
  try {
    return await recognizeWithTesseract(canvas, options);
  } catch (error) {
    const browserResult = await recognizeWithBrowserTextDetector(canvas, options);
    if (browserResult) return browserResult;
    return {
      value: '',
      supported: false,
      method: 'manual',
      error: error?.message || 'The browser OCR scanner is unavailable.',
    };
  }
}
