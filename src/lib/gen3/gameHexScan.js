export const GAME_SCAN_CHUNK_COUNT = 20;
export const GAME_SCAN_CHUNK_LENGTH = 8;
export const GAME_SCAN_GUIDE_REGION = Object.freeze({
  x: 0.26,
  y: 0.26,
  width: 0.48,
  height: 0.48,
});

export const DEFAULT_GAME_SCAN_INSTRUCTION =
  'Show the next 8-character hexadecimal block in your game and hold it inside the guide. The camera confirms each character across several scans before saving it. Use manual capture if needed.';

export function createHexScanConsensus({ requiredMatches = 2, windowSize = 6 } = {}) {
  const required = Math.max(2, Math.floor(Number(requiredMatches) || 2));
  const size = Math.max(required, Math.floor(Number(windowSize) || 6));
  let readings = [];

  return {
    push(reading) {
      const validation = validateHexChunk(reading?.value || reading || '');
      if (validation.valid) {
        readings.push(validation.value);
        if (readings.length > size) readings = readings.slice(-size);
      }

      let candidate = '';
      let preview = '';
      let stableCharacters = 0;
      let weakestMatch = Infinity;
      for (let characterIndex = 0; characterIndex < GAME_SCAN_CHUNK_LENGTH; characterIndex++) {
        const counts = new Map();
        readings.forEach((value, readingIndex) => {
          const character = value[characterIndex];
          const current = counts.get(character) || { character, count: 0, lastSeen: -1 };
          current.count += 1;
          current.lastSeen = readingIndex;
          counts.set(character, current);
        });
        const ranked = [...counts.values()].sort((left, right) =>
          (right.count - left.count) || (right.lastSeen - left.lastSeen));
        const best = ranked[0];
        const runnerUp = ranked[1];
        const isStable = Boolean(best)
          && best.count >= required
          && best.count > (runnerUp?.count || 0);
        candidate += best?.character || '';
        preview += isStable ? best.character : '·';
        if (isStable) {
          stableCharacters += 1;
          weakestMatch = Math.min(weakestMatch, best.count);
        }
      }

      const accepted = candidate.length === GAME_SCAN_CHUNK_LENGTH
        && stableCharacters === GAME_SCAN_CHUNK_LENGTH;
      return {
        accepted,
        candidate,
        preview,
        stableCharacters,
        matches: Number.isFinite(weakestMatch) ? weakestMatch : 0,
        required,
        sampleCount: readings.length,
        samples: [...readings],
      };
    },
    reset() {
      readings = [];
    },
    getSamples() {
      return [...readings];
    },
  };
}

export function cleanHexChunkDraft(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-F]/g, '')
    .slice(0, GAME_SCAN_CHUNK_LENGTH);
}

export function validateHexChunk(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.length !== GAME_SCAN_CHUNK_LENGTH) {
    return {
      valid: false,
      value: normalized,
      message: `Enter exactly ${GAME_SCAN_CHUNK_LENGTH} hexadecimal characters.`,
    };
  }
  if (!/^[0-9A-F]{8}$/.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      message: 'Only the hexadecimal characters 0–9 and A–F are allowed.',
    };
  }
  return { valid: true, value: normalized, message: '' };
}

export function getConfirmedChunkCount(chunks) {
  return Array.from(chunks || []).filter(chunk => validateHexChunk(chunk).valid).length;
}

export function getNextIncompleteChunkIndex(chunks, startIndex = 0) {
  const list = Array.from(chunks || []);
  for (let offset = 0; offset < list.length; offset++) {
    const index = (Math.max(0, Number(startIndex) || 0) + offset) % list.length;
    if (!validateHexChunk(list[index]).valid) return index;
  }
  return -1;
}

export function assembleScannedPokemonHex(chunks) {
  const list = Array.from(chunks || []);
  if (list.length !== GAME_SCAN_CHUNK_COUNT) {
    throw new Error(`Expected ${GAME_SCAN_CHUNK_COUNT} confirmed chunks.`);
  }
  return list.map((chunk, index) => {
    const validation = validateHexChunk(chunk);
    if (!validation.valid) throw new Error(`Chunk ${index + 1}: ${validation.message}`);
    return validation.value;
  }).join('');
}

export function formatScannedPokemonHex(chunks) {
  const hex = assembleScannedPokemonHex(chunks);
  const bytes = hex.match(/.{2}/g) || [];
  const lines = [];
  for (let index = 0; index < bytes.length; index += 16) {
    lines.push(bytes.slice(index, index + 16).join(' '));
  }
  return lines.join('\n');
}

export function getCenteredVideoCrop(videoWidth, videoHeight, targetAspectRatio = 4) {
  const width = Math.max(1, Number(videoWidth) || 1);
  const height = Math.max(1, Number(videoHeight) || 1);
  const sourceAspect = width / height;
  if (sourceAspect > targetAspectRatio) {
    const cropWidth = height * targetAspectRatio;
    return { x: (width - cropWidth) / 2, y: 0, width: cropWidth, height };
  }
  const cropHeight = width / targetAspectRatio;
  return { x: 0, y: (height - cropHeight) / 2, width, height: cropHeight };
}
