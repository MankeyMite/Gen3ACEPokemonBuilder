// Independent of the importer's reverse-compensation helper: model the ACE
// writer's byte arithmetic directly, including extended symbol values (+64).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?';
const EXTENDED_VALUES = Object.freeze({
  '.': 64, '-': 65, '\u2026': 67, '\u201C': 68, '\u201D': 69,
  '\u2018': 70, '\u2019': 71, '\u2642': 72, '\u2640': 73, ',': 75, '/': 77,
});

export function decodeAceBoxNames(boxes) {
  const values = Array.from(boxes.join(''), character => EXTENDED_VALUES[character] ?? ALPHABET.indexOf(character));
  if (values.some(value => value < 0) || values.length % 4 === 1) throw new Error('Invalid ACE Base64 stream');
  const bytes = [];
  for (let i = 0; i < values.length; i += 4) {
    const [a, b, c, d] = values.slice(i, i + 4);
    if (b !== undefined) bytes.push(((a << 2) + (b >> 4)) & 0xFF);
    if (c !== undefined) bytes.push(((b << 4) + (c >> 2)) & 0xFF);
    if (d !== undefined) bytes.push(((c << 6) + d) & 0xFF);
  }
  return Uint8Array.from(bytes);
}

/** Validate a complete candidate, then scan every box, including neighbors. */
export function inspectBase64Repair(boxes, originalBytes, filter) {
  if (!Array.isArray(boxes) || boxes.length !== 14 || boxes.some(box => typeof box !== 'string' || Array.from(box).length > 8)) {
    return { valid: false, reason: 'Box names must fit within 14 boxes of eight characters.' };
  }
  let decoded;
  try { decoded = decodeAceBoxNames(boxes); }
  catch { return { valid: false, reason: 'The repaired Base64 stream cannot be decoded.' }; }
  if (originalBytes.length !== 80 || decoded.length !== 80 || decoded.some((byte, i) => byte !== originalBytes[i])) {
    return { valid: false, reason: 'The repaired output does not preserve all 80 Pokemon bytes.' };
  }
  const unresolvedMatches = boxes.flatMap((boxName, index) => {
    const result = filter.checkDetailed(boxName);
    return result.blocked ? [{ box: index + 1, boxName, matches: result.matches, occurrences: result.occurrences }] : [];
  });
  return {
    valid: true,
    unresolvedMatches,
    matchCount: unresolvedMatches.reduce((count, box) => count + box.occurrences.length, 0),
  };
}
