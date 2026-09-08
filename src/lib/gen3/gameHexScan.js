export const GAME_SCAN_CHUNK_COUNT = 20;
export const GAME_SCAN_CHUNK_LENGTH = 8;

export const DEFAULT_GAME_SCAN_INSTRUCTION =
  'Show the next 8-character hexadecimal block in your game, then center it inside the camera guide. Capture it, compare every character with the frozen image, and correct anything before confirming.';

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
