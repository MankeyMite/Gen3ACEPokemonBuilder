import { convertEk3RawToPk3Canonical, convertPk3CanonicalToEk3Raw, parsePokemonBytes, toHexString } from './builder.js';
import { checksum16, readU32LE, writeU16LE, writeU32LE } from './packers.js';
import { encodeNickname, encodeOT } from './encoding.js';
import { MOVES_MAP } from '../../data/moves.gen3.js';

export function getImportedCanonicalBytes(bytes, outputLength = 80) {
  if (parsePokemonBytes(toHexString(bytes)).usedXor) return convertEk3RawToPk3Canonical(bytes, outputLength);
  const result = new Uint8Array(outputLength);
  result.set(bytes);
  return result;
}

// Patch individual stored fields, preserving padding, unknown bits, current PP,
// and strings the form cannot losslessly decode. Never rebuild an imported mon.
export function editImportedPokemonBytes(originalBytes, baseline, current) {
  const encrypted = parsePokemonBytes(toHexString(originalBytes)).usedXor;
  const original = encrypted
    ? convertEk3RawToPk3Canonical(originalBytes, 80)
    : new Uint8Array(originalBytes);
  const result = new Uint8Array(original);
  const value = (object, path) => path.split('.').reduce((part, key) => part?.[key], object);
  const changed = path => value(baseline, path) !== value(current, path);
  const number = path => Number(value(current, path));
  const byte = (path, offset) => { if (changed(path)) result[offset] = number(path); };
  const word = (path, offset) => { if (changed(path)) writeU16LE(result, offset, number(path)); };
  const bits = (path, offset, mask, shift = 0) => {
    if (changed(path)) result[offset] = (result[offset] & ~mask) | ((number(path) << shift) & mask);
  };
  const wideBits = (path, offset, mask, shift) => {
    if (changed(path)) writeU32LE(result, offset,
      (readU32LE(result, offset) & ~mask) | ((number(path) << shift) & mask));
  };

  if (changed('pid')) writeU32LE(result, 0, number('pid'));
  word('tid', 4);
  word('sid', 6);
  if (changed('nickname')) result.set(encodeNickname(current.nickname, current.languageId), 8);
  byte('languageId', 0x12);
  bits('isEgg', 0x13, 4, 2);
  if (changed('otName')) result.set(encodeOT(current.otName, current.languageId), 0x14);
  ['circle', 'triangle', 'square', 'heart'].forEach((key, index) =>
    bits(`markings.${key}`, 0x1B, 1 << index, index));

  word('speciesId', 0x20);
  word('itemId', 0x22);
  if (changed('totalExp')) writeU32LE(result, 0x24, number('totalExp'));
  byte('friendship', 0x29);
  for (let index = 0; index < 4; index++) {
    bits(`pps.${index}`, 0x28, 3 << (index * 2), index * 2);
    word(`moves.${index}`, 0x2C + index * 2);
    // Changing a move or its PP Ups refills only that slot. Untouched slots
    // retain their stored current PP, including depleted or glitched values.
    if (changed(`moves.${index}`) || changed(`pps.${index}`)) {
      const basePP = MOVES_MAP[current.moves[index]]?.basePP ?? 0;
      result[0x34 + index] = Math.min(255, Math.floor(basePP * (1 + 0.2 * current.pps[index])));
    }
  }
  ['hp', 'atk', 'def', 'spe', 'spa', 'spd'].forEach((key, index) => {
    byte(`evs.${key}`, 0x38 + index);
    wideBits(`ivs.${key}`, 0x48, 31 << (index * 5), index * 5);
  });
  ['cool', 'beauty', 'cute', 'smart', 'tough', 'sheen'].forEach((key, index) =>
    byte(`contest.${key}`, 0x3E + index));
  byte('pokerusState', 0x44);
  byte('metLocationId', 0x45);
  // Origin fields share a word: update only the selected field's bits.
  const originBits = (path, mask, shift) => {
    if (changed(path)) {
      const old = result[0x46] | (result[0x47] << 8);
      writeU16LE(result, 0x46, (old & ~mask) | ((number(path) << shift) & mask));
    }
  };
  originBits('metLevel', 0x7F, 0);
  originBits('originGame', 0x780, 7);
  originBits('ballId', 0x7800, 11);
  originBits('otGender', 0x8000, 15);
  wideBits('isEgg', 0x48, 1 << 30, 30);
  wideBits('abilityBit', 0x48, 1 << 31, 31);
  ['cool', 'beauty', 'cute', 'smart', 'tough'].forEach((key, index) =>
    wideBits(`ribbons.${key}`, 0x4C, 7 << (index * 3), index * 3));
  ['champion', 'winning', 'victory', 'artist', 'effort', 'battleChampion',
    'regionalChampion', 'nationalChampion', 'country', 'national', 'earth', 'world']
    .forEach((key, index) => wideBits(`ribbons.${key}`, 0x4C, 1 << (15 + index), 15 + index));
  wideBits('ribbons.fatefulEncounter', 0x4C, 1 << 31, 31);

  if (result.every((value, index) => value === original[index])) return new Uint8Array(originalBytes);
  if (result.slice(0x20).some((value, index) => value !== original[0x20 + index])) {
    writeU16LE(result, 0x1C, checksum16(result.slice(0x20)));
  }
  // A PID/OT-ID edit necessarily changes encryption, and a PID edit can change
  // block order. Convert with the new header while retaining the original body.
  return encrypted ? convertPk3CanonicalToEk3Raw(result) : result;
}
