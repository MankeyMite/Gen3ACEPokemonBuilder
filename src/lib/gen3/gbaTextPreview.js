import { GEN3_CHAR_MAP } from '../../data/gen3CharMap.js';

const UPPERCASE_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
const LOWERCASE_CHARS = new Set('abcdefghijklmnopqrstuvwxyz');
const NUMBER_CHARS = new Set('0123456789');
const UPPERCASE_EXTRA_CHARS = new Set(['\u00C4', '\u00D6', '\u00DC']);
const LOWERCASE_EXTRA_CHARS = new Set(['\u00E4', '\u00F6', '\u00FC']);

export const CHARACTER_KIND_INFO = {
  uppercase: { id: 'uppercase', label: 'Uppercase letter' },
  lowercase: { id: 'lowercase', label: 'Lowercase letter' },
  number: { id: 'number', label: 'Number' },
  symbol: { id: 'symbol', label: 'Symbol' },
};

export function getCharacterKind(ch) {
  if (UPPERCASE_CHARS.has(ch) || UPPERCASE_EXTRA_CHARS.has(ch)) {
    return CHARACTER_KIND_INFO.uppercase;
  }
  if (LOWERCASE_CHARS.has(ch) || LOWERCASE_EXTRA_CHARS.has(ch)) {
    return CHARACTER_KIND_INFO.lowercase;
  }
  if (NUMBER_CHARS.has(ch)) {
    return CHARACTER_KIND_INFO.number;
  }
  return CHARACTER_KIND_INFO.symbol;
}

export function charToGen3Code(ch) {
  return GEN3_CHAR_MAP[ch];
}

export function findBoxNameCharacterAtTextOffset(outputText, offset) {
  const text = String(outputText || '');
  const numericOffset = Number(offset);
  if (!Number.isFinite(numericOffset) || numericOffset < 0 || numericOffset >= text.length) {
    return null;
  }

  const targetOffset = Math.floor(numericOffset);
  const lines = text.split('\n');
  let lineStart = 0;

  for (const rawLine of lines) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const lineEnd = lineStart + line.length;

    if (targetOffset <= lineEnd) {
      const boxMatch = line.match(/^\s*Box\s*(\d+)\s*:/i);
      if (!boxMatch) return null;

      const openParen = line.indexOf('(', boxMatch[0].length);
      const closeParen = openParen >= 0 ? line.indexOf(')', openParen + 1) : -1;
      if (openParen < 0 || closeParen <= openParen) return null;

      const payloadStart = lineStart + openParen + 1;
      const payloadEnd = lineStart + closeParen;
      if (targetOffset < payloadStart || targetOffset >= payloadEnd) return null;

      const character = text[targetOffset];
      const boxNumber = Number(boxMatch[1]);
      return {
        character,
        offset: targetOffset,
        boxNumber,
        boxLabel: `Box ${boxNumber}`,
        kind: getCharacterKind(character),
      };
    }

    lineStart += rawLine.length + 1;
  }

  return null;
}

export function findNearestBoxNameCharacterAtTextOffset(outputText, offset) {
  const numericOffset = Number(offset);
  if (!Number.isFinite(numericOffset)) return null;

  const targetOffset = Math.floor(numericOffset);
  for (const candidate of [targetOffset, targetOffset - 1, targetOffset + 1]) {
    const info = findBoxNameCharacterAtTextOffset(outputText, candidate);
    if (info) return info;
  }

  return null;
}
