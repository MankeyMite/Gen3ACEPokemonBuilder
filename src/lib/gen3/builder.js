import { GAEM_PERMUTATIONS } from './permutations.js';
import { MOVES_MAP } from '../../data/moves.gen3.js';
import { encodeName, encodeNickname, encodeOT } from './encoding.js';
import { u32, writeU16LE, writeU32LE, readU32LE, packIVWord, checksum16, bytesToHex, bytesToFormattedHex } from './packers.js';
import { createProfanityFilter } from '../profanityFilter.js';
import { PROFANITY_LIST } from '../../data/profanity.gen3.js';

// Shared profanity filter instance for Base64 box-name shifting
const _b64ProfanityFilter = createProfanityFilter(PROFANITY_LIST);

export function getPokerusStateFromStatus(status) {
  switch (status) {
    case 'active': return 0x11;
    case 'cured': return 0x10;
    case 'none':
    default: return 0x00;
  }
}

export function getPokerusStatusFromState(byte) {
  const strain = (byte >> 4) & 0x0F;
  const days = byte & 0x0F;
  if (strain === 0) return 'none';
  if (days === 0) return 'cured';
  return 'active';
}

const BOX_LETTER_RE = /[a-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/i;

function isBoxLetter(ch) {
  return BOX_LETTER_RE.test(ch);
}

// Find a profanity term within a box while ignoring non-letter characters
// between letters, and return the original character indices of matched letters.
function findTermLetterPositionsInBox(boxText, term) {
  const box = String(boxText || '').toLowerCase();
  const needle = String(term || '').toLowerCase();
  if (!box || !needle) return null;

  for (let start = 0; start < box.length; start++) {
    if (!isBoxLetter(box[start])) continue;

    let ti = 0;
    const positions = [];
    for (let bi = start; bi < box.length; bi++) {
      const ch = box[bi];
      if (!isBoxLetter(ch)) continue;
      if (ch !== needle[ti]) break;
      positions.push(bi);
      ti++;
      if (ti === needle.length) return positions;
    }
  }

  return null;
}

/**
 * Core Pokémon builder — SCAFFOLD VERSION
 * This builds the minimal byte layout and stubs the exact word assignments.
 * Replace TODO blocks with authoritative offsets and fields.
 */

export function buildPokemonBytes(cfg){
  // Combine TID/SID into OTID
  const otid = ((cfg.sid & 0xFFFF) << 16) | (cfg.tid & 0xFFFF);

  // Use provided PID if available, otherwise generate one
  let pid = (cfg.pid && cfg.pid !== 0) ? (cfg.pid >>> 0) : pickPidStub(cfg.natureIndex);

  // If force shiny, brute-force a small search (very naive, placeholder)
  if(cfg.forceShiny && (!cfg.pid || cfg.pid === 0)){
    pid = findShinyPidStub(pid, cfg.tid, cfg.sid, cfg.natureIndex);
  }

  // Encryption key
  const key = (pid ^ otid) >>> 0;

  // Build decrypted substructures (48 bytes total = 4 * 12)
  const G = new Uint8Array(12);
  const A = new Uint8Array(12);
  const E = new Uint8Array(12);
  const M = new Uint8Array(12);

  // ---- G (Growth) ----
  writeU16LE(G, 0, cfg.speciesId);           // species (offset 0x00)
  writeU16LE(G, 2, cfg.itemId);              // held item (offset 0x02)
  writeU32LE(G, 4, cfg.totalExp & 0xFFFFFFFF); // experience (offset 0x04)
  // PP bonuses (offset 0x08): bits for each move's PP Ups (0-3 each)
  const ppBonuses = ((cfg.pps[0] & 3) << 0) | ((cfg.pps[1] & 3) << 2) 
                  | ((cfg.pps[2] & 3) << 4) | ((cfg.pps[3] & 3) << 6);
  G[8] = ppBonuses;
  G[9] = cfg.friendship & 0xFF;              // friendship (offset 0x09)
  // 0x0A-0x0B: unused/padding

  // ---- A (Attacks) ----
  writeU16LE(A, 0, (cfg.moves[0] ?? 0) & 0xFFFF); // Move 1 ID
  writeU16LE(A, 2, (cfg.moves[1] ?? 0) & 0xFFFF); // Move 2 ID
  writeU16LE(A, 4, (cfg.moves[2] ?? 0) & 0xFFFF); // Move 3 ID
  writeU16LE(A, 6, (cfg.moves[3] ?? 0) & 0xFFFF); // Move 4 ID
  // Move PP (calculated from basePP + PP Ups)
  for (let i = 0; i < 4; i++) {
    const moveId = cfg.moves[i] ?? 0;
    const ppUps = cfg.pps[i] ?? 0;
    const move = MOVES_MAP[moveId];
    let basePP = move && typeof move.basePP === 'number' ? move.basePP : 0;
    // Gen III: Each PP Up increases max PP by 20% of basePP, up to 3 PP Ups (max 60% increase)
    let maxPP = basePP > 0 ? Math.floor(basePP * (1 + 0.2 * Math.min(ppUps, 3))) : 0;
    // Clamp to 255 (1 byte)
    A[8 + i] = Math.max(0, Math.min(maxPP, 255));
  }

  // ---- E (EVs & Condition) ----
  E[0] = cfg.evs.hp & 0xFF;      // HP EV
  E[1] = cfg.evs.atk & 0xFF;     // Attack EV
  E[2] = cfg.evs.def & 0xFF;     // Defense EV
  E[3] = cfg.evs.spe & 0xFF;     // Speed EV
  E[4] = cfg.evs.spa & 0xFF;     // Special Attack EV
  E[5] = cfg.evs.spd & 0xFF;     // Special Defense EV
  // Contest stats (0x06-0x0B)
  E[6] = (cfg.contest?.cool ?? 0) & 0xFF;    // Coolness
  E[7] = (cfg.contest?.beauty ?? 0) & 0xFF;  // Beauty
  E[8] = (cfg.contest?.cute ?? 0) & 0xFF;    // Cuteness
  E[9] = (cfg.contest?.smart ?? 0) & 0xFF;   // Smartness
  E[10] = (cfg.contest?.tough ?? 0) & 0xFF;  // Toughness
  E[11] = (cfg.contest?.sheen ?? 0) & 0xFF;  // Feel (Sheen)

  // ---- M (Miscellaneous) ----
  // Pokérus status (offset 0x00): bits 0-3 = days, bits 4-7 = strain
  M[0] = (cfg.pokerusState ?? 0) & 0xFF;
  
  // Met Location (offset 0x01): 1 byte (0-255)
  M[1] = (cfg.metLocationId ?? 0) & 0xFF;
  
  // Origins info (offset 0x02-0x03, 16-bit LE):
  // bits 0-6: met level, bits 7-10: game origin, bits 11-14: ball, bit 15: OT gender
  let originsInfo = ((cfg.metLevel ?? cfg.level) & 0x7F)           // bits 0-6: met level
                  | (((cfg.originGame ?? 3) & 0x0F) << 7)            // bits 7-10: game origin (3 = Emerald)
                  | (((cfg.ballId ?? 0) & 0x0F) << 11) // bits 11-14: ball
                  | (((cfg.otGender ?? 0) & 0x01) << 15); // bit 15: OT gender (0=male, 1=female)
  writeU16LE(M, 2, originsInfo & 0xFFFF);
  
  // IVs + Egg + Ability (offset 0x04-0x07, 32-bit LE)
  const ivWord = packIVWord({
    hp: cfg.ivs.hp, atk: cfg.ivs.atk, def: cfg.ivs.def, spe: cfg.ivs.spe, spa: cfg.ivs.spa, spd: cfg.ivs.spd
  }, cfg.isEgg ? 1 : 0, cfg.abilityBit);
  writeU32LE(M, 4, ivWord);
  
  // Ribbons & Obedience (offset 0x08-0x0B, 32-bit LE)
  // Bits 0-2: Cool ribbon (0=none, 1-4=Normal/Super/Hyper/Master)
  // Bits 3-5: Beauty ribbon
  // Bits 6-8: Cute ribbon
  // Bits 9-11: Smart ribbon
  // Bits 12-14: Tough ribbon
  // Bit 15: Champion (Gen3)
  // Bit 16: Winning
  // Bit 17: Victory
  // Bit 18: Artist
  // Bit 19: Effort
  // Bit 20: Battle Champion
  // Bit 21: Regional Champion
  // Bit 22: National Champion
  // Bit 23: Country
  // Bit 24: National
  // Bit 25: Earth
  // Bit 26: World
  // Bit 31: Fateful Encounter (obedience flag)
  let ribbonWord = 0;
  ribbonWord |= ((cfg.ribbons?.cool ?? 0) & 0x7) << 0;
  ribbonWord |= ((cfg.ribbons?.beauty ?? 0) & 0x7) << 3;
  ribbonWord |= ((cfg.ribbons?.cute ?? 0) & 0x7) << 6;
  ribbonWord |= ((cfg.ribbons?.smart ?? 0) & 0x7) << 9;
  ribbonWord |= ((cfg.ribbons?.tough ?? 0) & 0x7) << 12;
  if (cfg.ribbons?.champion) ribbonWord |= (1 << 15);
  if (cfg.ribbons?.winning) ribbonWord |= (1 << 16);
  if (cfg.ribbons?.victory) ribbonWord |= (1 << 17);
  if (cfg.ribbons?.artist) ribbonWord |= (1 << 18);
  if (cfg.ribbons?.effort) ribbonWord |= (1 << 19);
  if (cfg.ribbons?.battleChampion) ribbonWord |= (1 << 20);
  if (cfg.ribbons?.regionalChampion) ribbonWord |= (1 << 21);
  if (cfg.ribbons?.nationalChampion) ribbonWord |= (1 << 22);
  if (cfg.ribbons?.country) ribbonWord |= (1 << 23);
  if (cfg.ribbons?.national) ribbonWord |= (1 << 24);
  if (cfg.ribbons?.earth) ribbonWord |= (1 << 25);
  if (cfg.ribbons?.world) ribbonWord |= (1 << 26);
  if (cfg.ribbons?.fatefulEncounter) ribbonWord |= (1 << 31);
  writeU32LE(M, 8, ribbonWord >>> 0);

  // Concatenate decrypted in GAEM order for checksum computation
  const order = GAEM_PERMUTATIONS[pid % 24];
  const map = {G,A,E,M};
  const decrypted48 = new Uint8Array(48);
  let off = 0;
  for(const tag of order){
    decrypted48.set(map[tag], off);
    off += 12;
  }

  const csum = checksum16(decrypted48);

  // Encrypt per 32-bit word
  const encrypted48 = new Uint8Array(48);
  for(let i=0;i<48;i+=4){
    const plain = readU32LE(decrypted48, i);
    const enc = (plain ^ key) >>> 0;
    writeU32LE(encrypted48, i, enc);
  }

  // Build final buffer: PC Pokémon = 80 bytes (0x00-0x4F)
  // Header (0x00-0x1F) + Encrypted Data (0x20-0x4F)
  const total = new Uint8Array(80);
  let p = 0;
  
  writeU32LE(total, p, pid); p += 4;              // 0x00-0x03: PID
  writeU32LE(total, p, otid); p += 4;             // 0x04-0x07: OT ID
  
  // Nickname (10 bytes) — proper Gen 3 encoding, 0xFF-padded
  const nick = encodeNickname(cfg.nickname || '');
  total.set(nick, p); p += 10;                    // 0x08-0x11: Nickname
  
  total[p++] = cfg.languageId & 0xFF;             // 0x12: Language (1 byte)
  
  // Misc Flags (0x13): bit 1 = has species (always 1 for valid)
  // 0x13: Misc Flags (bit 1 = has species, bit 2 = use egg name)
  let miscFlags = 0x02; // has species
  if (cfg.isEgg) miscFlags |= 0x04; // use egg name / egg flag
  total[p++] = miscFlags;                          // 0x13: Misc Flags
  
  // OT name (7 bytes) — proper Gen 3 encoding, 0xFF-padded
  const ot = encodeOT(cfg.otName || 'TRAINER');
  total.set(ot, p); p += 7;                       // 0x14-0x1A: OT Name
  
  // Markings (0x1B): bits 0-3 for Circle, Triangle, Square, Heart
  let markings = 0;
  if (cfg.markings?.circle) markings |= (1 << 0);
  if (cfg.markings?.triangle) markings |= (1 << 1);
  if (cfg.markings?.square) markings |= (1 << 2);
  if (cfg.markings?.heart) markings |= (1 << 3);
  total[p++] = markings;                          // 0x1B: Markings
  
  writeU16LE(total, p, csum); p += 2;             // 0x1C-0x1D: Checksum
  
  // Extra bytes (0x1E-0x1F): Usually unused/padding, but allow user to set
  const extraBytes = cfg.extraBytes ?? 0;
  writeU16LE(total, p, extraBytes & 0xFFFF); p += 2; // 0x1E-0x1F: Extra bytes
  
  // Append encrypted substructures (0x20-0x4F)
  total.set(encrypted48, 0x20);

  return {
    bytes: total,
    meta: { pid, otid, key, checksum: csum, order: order.join('') }
  };
}

// Build decrypted 80-byte Pokémon structure and return a 100-byte PKHeX-style
// decrypted file (first 80 bytes = PC Pokémon structure, trailing 20 bytes = zeros).
export function buildDecryptedPokemonFile(cfg){
  // We'll replicate the same substructure construction as in buildPokemonBytes
  const otid = ((cfg.sid & 0xFFFF) << 16) | (cfg.tid & 0xFFFF);
  let pid = (cfg.pid && cfg.pid !== 0) ? (cfg.pid >>> 0) : pickPidStub(cfg.natureIndex);
  const key = (pid ^ otid) >>> 0;

  // Build decrypted substructures (G,A,E,M) exactly as in buildPokemonBytes
  const G = new Uint8Array(12);
  const A = new Uint8Array(12);
  const E = new Uint8Array(12);
  const M = new Uint8Array(12);

  // G
  writeU16LE(G, 0, cfg.speciesId);
  writeU16LE(G, 2, cfg.itemId);
  writeU32LE(G, 4, cfg.totalExp & 0xFFFFFFFF);
  const ppBonuses = ((cfg.pps[0] & 3) << 0) | ((cfg.pps[1] & 3) << 2) | ((cfg.pps[2] & 3) << 4) | ((cfg.pps[3] & 3) << 6);
  G[8] = ppBonuses;
  G[9] = cfg.friendship & 0xFF;

  // A
  writeU16LE(A, 0, (cfg.moves[0] ?? 0) & 0xFFFF);
  writeU16LE(A, 2, (cfg.moves[1] ?? 0) & 0xFFFF);
  writeU16LE(A, 4, (cfg.moves[2] ?? 0) & 0xFFFF);
  writeU16LE(A, 6, (cfg.moves[3] ?? 0) & 0xFFFF);
  for (let i = 0; i < 4; i++) {
    const moveId = cfg.moves[i] ?? 0;
    const ppUps = cfg.pps[i] ?? 0;
    const move = MOVES_MAP[moveId];
    let basePP = move && typeof move.basePP === 'number' ? move.basePP : 0;
    let maxPP = basePP > 0 ? Math.floor(basePP * (1 + 0.2 * Math.min(ppUps, 3))) : 0;
    A[8 + i] = Math.max(0, Math.min(maxPP, 255));
  }

  // E
  E[0] = cfg.evs.hp & 0xFF;
  E[1] = cfg.evs.atk & 0xFF;
  E[2] = cfg.evs.def & 0xFF;
  E[3] = cfg.evs.spe & 0xFF;
  E[4] = cfg.evs.spa & 0xFF;
  E[5] = cfg.evs.spd & 0xFF;
  E[6] = (cfg.contest?.cool ?? 0) & 0xFF;
  E[7] = (cfg.contest?.beauty ?? 0) & 0xFF;
  E[8] = (cfg.contest?.cute ?? 0) & 0xFF;
  E[9] = (cfg.contest?.smart ?? 0) & 0xFF;
  E[10] = (cfg.contest?.tough ?? 0) & 0xFF;
  E[11] = (cfg.contest?.sheen ?? 0) & 0xFF;

  // M
  M[0] = (cfg.pokerusState ?? 0) & 0xFF;
  M[1] = (cfg.metLocationId ?? 0) & 0xFF;
  let originsInfo = ((cfg.metLevel ?? cfg.level) & 0x7F) | (((cfg.originGame ?? 3) & 0x0F) << 7) | (((cfg.ballId ?? 0) & 0x0F) << 11) | (((cfg.otGender ?? 0) & 0x01) << 15);
  writeU16LE(M, 2, originsInfo & 0xFFFF);
  const ivWord = packIVWord({ hp: cfg.ivs.hp, atk: cfg.ivs.atk, def: cfg.ivs.def, spe: cfg.ivs.spe, spa: cfg.ivs.spa, spd: cfg.ivs.spd }, cfg.isEgg ? 1 : 0, cfg.abilityBit);
  writeU32LE(M, 4, ivWord);
  let ribbonWord = 0;
  ribbonWord |= ((cfg.ribbons?.cool ?? 0) & 0x7) << 0;
  ribbonWord |= ((cfg.ribbons?.beauty ?? 0) & 0x7) << 3;
  ribbonWord |= ((cfg.ribbons?.cute ?? 0) & 0x7) << 6;
  ribbonWord |= ((cfg.ribbons?.smart ?? 0) & 0x7) << 9;
  ribbonWord |= ((cfg.ribbons?.tough ?? 0) & 0x7) << 12;
  if (cfg.ribbons?.champion) ribbonWord |= (1 << 15);
  if (cfg.ribbons?.winning) ribbonWord |= (1 << 16);
  if (cfg.ribbons?.victory) ribbonWord |= (1 << 17);
  if (cfg.ribbons?.artist) ribbonWord |= (1 << 18);
  if (cfg.ribbons?.effort) ribbonWord |= (1 << 19);
  if (cfg.ribbons?.battleChampion) ribbonWord |= (1 << 20);
  if (cfg.ribbons?.regionalChampion) ribbonWord |= (1 << 21);
  if (cfg.ribbons?.nationalChampion) ribbonWord |= (1 << 22);
  if (cfg.ribbons?.country) ribbonWord |= (1 << 23);
  if (cfg.ribbons?.national) ribbonWord |= (1 << 24);
  if (cfg.ribbons?.earth) ribbonWord |= (1 << 25);
  if (cfg.ribbons?.world) ribbonWord |= (1 << 26);
  if (cfg.ribbons?.fatefulEncounter) ribbonWord |= (1 << 31);
  writeU32LE(M, 8, ribbonWord >>> 0);

  // For PKHeX-style decrypted output we must use the canonical GAEM order
  // (G, A, E, M) regardless of PID permutation. PKHeX expects decrypted
  // files to contain substructures in this fixed order.
  const map = {G,A,E,M};
  const decrypted48 = new Uint8Array(48);
  // canonical GAEM order
  decrypted48.set(map['G'], 0);
  decrypted48.set(map['A'], 12);
  decrypted48.set(map['E'], 24);
  decrypted48.set(map['M'], 36);

  const csum = checksum16(decrypted48);

  // Build final 80-byte total with decrypted substructures
  const total = new Uint8Array(80);
  let p = 0;
  writeU32LE(total, p, pid); p += 4;
  writeU32LE(total, p, otid); p += 4;
  const nick = encodeNickname(cfg.nickname || '');
  total.set(nick, p); p += 10;
  total[p++] = cfg.languageId & 0xFF;
  // 0x13: Misc Flags (bit 1 = has species, bit 2 = use egg name)
  let miscFlags2 = 0x02;
  if (cfg.isEgg) miscFlags2 |= 0x04;
  total[p++] = miscFlags2;
  const ot = encodeOT(cfg.otName || 'TRAINER');
  total.set(ot, p); p += 7;
  let markings = 0;
  if (cfg.markings?.circle) markings |= (1 << 0);
  if (cfg.markings?.triangle) markings |= (1 << 1);
  if (cfg.markings?.square) markings |= (1 << 2);
  if (cfg.markings?.heart) markings |= (1 << 3);
  total[p++] = markings;
  writeU16LE(total, p, csum); p += 2;
  const extraBytes = cfg.extraBytes ?? 0;
  writeU16LE(total, p, extraBytes & 0xFFFF); p += 2;
  // Set decrypted substructures directly
  total.set(decrypted48, 0x20);

  // Build a 100-byte PKHeX-style decrypted file (pad with zeros)
  const out = new Uint8Array(100);
  out.set(total, 0);
  // remaining 20 bytes left as zeros

  return out;
}

// Convert canonical decrypted .pk3 bytes to encrypted raw 80-byte box layout.
// Preserves header bytes exactly and only rewrites 0x20-0x4F as permuted+xored data.
export function convertPk3CanonicalToEk3Raw(inputBytes) {
  const src = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes || []);
  if (src.length < 80) throw new Error('Expected at least 80 bytes for .pk3 import');

  const pk3 = src.slice(0, 80);
  const out = new Uint8Array(pk3);

  const pid = readU32LE(pk3, 0);
  const otid = readU32LE(pk3, 4);
  const key = (pid ^ otid) >>> 0;

  // .pk3 is canonical decrypted GAEM order in 0x20-0x4F.
  const canonical = {
    G: pk3.slice(0x20, 0x2C),
    A: pk3.slice(0x2C, 0x38),
    E: pk3.slice(0x38, 0x44),
    M: pk3.slice(0x44, 0x50),
  };

  // Reorder into PID-dependent in-save permutation.
  const order = GAEM_PERMUTATIONS[pid % 24];
  const permutedPlain = new Uint8Array(48);
  let off = 0;
  for (const tag of order) {
    permutedPlain.set(canonical[tag], off);
    off += 12;
  }

  // Encrypt 48-byte body in place at 0x20-0x4F.
  for (let i = 0; i < 48; i += 4) {
    const plain = readU32LE(permutedPlain, i);
    writeU32LE(out, 0x20 + i, (plain ^ key) >>> 0);
  }

  return out;
}

// Convert encrypted/raw 80-byte .ek3 bytes to canonical decrypted .pk3 bytes.
// Output defaults to 100 bytes (PKHeX-style), preserving the first 0x20 header bytes.
export function convertEk3RawToPk3Canonical(inputBytes, outputLength = 100) {
  const src = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes || []);
  if (src.length < 80) throw new Error('Expected at least 80 bytes for .ek3 conversion');

  const raw = src.slice(0, 80);
  const outLen = Math.max(80, Number(outputLength) || 100);
  const out = new Uint8Array(outLen);
  out.set(raw, 0);

  const pid = readU32LE(raw, 0);
  const otid = readU32LE(raw, 4);
  const key = (pid ^ otid) >>> 0;

  // Decrypt PID-permuted 48-byte body from raw 0x20-0x4F.
  const permutedPlain = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const enc = readU32LE(raw, 0x20 + i);
    writeU32LE(permutedPlain, i, (enc ^ key) >>> 0);
  }

  // Reorder from PID permutation into canonical GAEM order for .pk3.
  const order = GAEM_PERMUTATIONS[pid % 24];
  const map = {};
  let off = 0;
  for (const tag of order) {
    map[tag] = permutedPlain.slice(off, off + 12);
    off += 12;
  }

  const canonical = new Uint8Array(48);
  canonical.set(map.G || new Uint8Array(12), 0);
  canonical.set(map.A || new Uint8Array(12), 12);
  canonical.set(map.E || new Uint8Array(12), 24);
  canonical.set(map.M || new Uint8Array(12), 36);
  out.set(canonical, 0x20);

  return out;
}

// --- Utilities & stubs ---

// very simple PID picker that respects natureIndex (pid % 25 == nature)
function pickPidStub(natureIndex){
  let base = 0xA5A5_0000 >>> 0;
  for(let i=0;i<0xFFFF;i++){
    const pid = (base + i) >>> 0;
    if(pid % 25 === (natureIndex % 25)) return pid >>> 0;
  }
  return 0x00000000;
}

// Naive shiny finder within small window (placeholder). Real tool should use precomputed PID banks.
function findShinyPidStub(seedPid, tid, sid, natureIndex){
  const wants = (tid ^ sid) & 0xFFFF;
  let pid = seedPid >>> 0;
  for(let i=0;i<2_000_000;i++){
    if(pid % 25 === natureIndex){
      const v = ((tid ^ sid ^ (pid >>> 16) ^ (pid & 0xFFFF)) & 0xFFFF);
      if(v < 8) return pid >>> 0;
    }
    pid = (pid + 0x00010001) >>> 0; // keep nature parity
  }
  return seedPid;
}

// Convert bytes to flat hex string
export function toHexString(bytes){
  return bytesToHex(bytes);
}

// Convert bytes to formatted hex (10 lines, 8 bytes each)
export function toFormattedHex(bytes){
  return bytesToFormattedHex(bytes);
}

// Convert bytes to Base64 with Emerald ACE naming rules
export function toBase64Emerald(bytes, options = {}){
  const switchSafe = options.switchSafe !== false;
  // Standard btoa over binary string
  let bin = '';
  for(const b of bytes) bin += String.fromCharCode(b);
  let b64 = '';
  try{
    b64 = btoa(bin);
  }catch{
    return '';
  }
  
  // Apply Emerald naming rules: / → ?, + → !, strip trailing =
  b64 = b64.replace(/\//g, '?').replace(/\+/g, '!').replace(/=+$/, '');
  
  // Format as 14 boxes, 8 characters each
  const boxes = [];
  for (let i = 0; i < b64.length; i += 8) {
    boxes.push(b64.slice(i, i + 8));
  }
  
  // Ensure exactly 14 boxes (but DON'T pad box 14 with 'A' - leave it short to avoid overwriting box 1)
  while (boxes.length < 14) boxes.push('');
  
  // ── Profanity shifting: push bad-word characters forward so they split ──
  // If a bad word is found in boxes 1-13 and its last character is at
  // position 4+ (1-indexed), truncate the box right before that last
  // character and shift all remaining characters forward.  Box 14 absorbs
  // the overflow.  Re-scan after each shift since new boxes may form new
  // bad words.
  const MAX_SHIFT_PASSES = 14; // safety limit
  const shiftedBoxes = new Set();               // track which boxes were truncated
  let substitutionUsed = false;

  if (switchSafe) {
  for (let pass = 0; pass < MAX_SHIFT_PASSES; pass++) {
    let shifted = false;
    for (let bi = 0; bi < 13; bi++) {           // boxes 1-13 (index 0-12)
      const box = boxes[bi];
      if (!box) continue;
      const result = _b64ProfanityFilter.checkDetailed(box);
      if (!result.blocked) continue;

      // Collect all viable cut points from matched terms. We will choose the
      // latest one that still fits downstream box capacity so we avoid cutting
      // earlier than necessary.
      const cutCandidates = [];
      for (const term of result.matches) {
        const positions = findTermLetterPositionsInBox(box, term);
        if (!positions) continue;
        const lastCharPos = positions[positions.length - 1]; // original box index of last letter
        if (lastCharPos < 3) continue;                // position 4+ means index >= 3
        // Cut point: right before the last character of the bad word.
        // This removes just enough to break the word while keeping the
        // box as long as possible (at least 3 characters).
        cutCandidates.push(lastCharPos);
      }

      if (!cutCandidates.length) continue;

      // Remaining capacity in boxes after this one (respect 8-char box limit).
      let downstreamCapacity = 0;
      for (let j = bi + 1; j < 14; j++) {
        downstreamCapacity += Math.max(0, 8 - boxes[j].length);
      }

      // Prefer the latest cut (max keep, min displacement) that still fits.
      cutCandidates.sort((a, b) => b - a);
      let chosenCut = null;
      for (const cutAt of cutCandidates) {
        const displacedLen = box.length - cutAt;
        if (displacedLen <= downstreamCapacity) {
          chosenCut = cutAt;
          break;
        }
      }

      if (chosenCut === null) continue;

      // Truncate this box and push the rest forward
      const kept = box.slice(0, chosenCut);
      const displaced = box.slice(chosenCut);
      boxes[bi] = kept;
      shiftedBoxes.add(bi);                     // mark this box as truncated

      // Shift displaced characters into subsequent boxes
      let overflow = displaced;
      for (let j = bi + 1; j < 14 && overflow; j++) {
        overflow = overflow + boxes[j];
        boxes[j] = overflow.slice(0, 8);
        overflow = overflow.slice(8);
      }
      // Safety: chosenCut guarantees no overflow should remain here.
      // Keep this as a defensive fallback in case of unexpected state.
      if (overflow) {
        boxes[13] = boxes[13] + overflow;
      }

      shifted = true;
      break; // restart scan from the beginning after a shift
    }
    if (!shifted) break;
  }
  
  // ── Character substitution: replace letters with equivalent symbols ──
  // If box shifting couldn't eliminate all profanity (e.g. bad words in the
  // first 3 characters of a box, or in box 14), swap one letter per bad word
  // with a symbol that the game's Base64 decoder treats as value + 64.
  // The +64 overflows and requires carry-compensation on the previous digit
  // depending on position within the 4-character Base64 group.
  const SUBST_MAP = {
    'A': '.', 'B': '-', 'D': '\u2026', 'E': '\u201C', 'F': '\u201D',
    'G': '\u2018', 'H': '\u2019', 'I': '\u2642', 'J': '\u2640',
    'L': ',', 'N': '/'
  };
  const B64_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?';
  const B64_VAL = {};
  for (let i = 0; i < B64_ALPHA.length; i++) B64_VAL[B64_ALPHA[i]] = i;

  for (let sPass = 0; sPass < MAX_SHIFT_PASSES; sPass++) {
    let anySubst = false;
    for (let bi = 0; bi < 14; bi++) {
      const box = boxes[bi];
      if (!box) continue;
      const res = _b64ProfanityFilter.checkDetailed(box);
      if (!res.blocked) continue;

      for (const term of res.matches) {
        const positions = findTermLetterPositionsInBox(box, term);
        if (!positions) continue;

        let substituted = false;
        for (const ci of positions) {
          const ch = box[ci];
          if (!SUBST_MAP[ch]) continue;

          // Position in the total Base64 stream
          let streamPos = 0;
          for (let k = 0; k < bi; k++) streamPos += boxes[k].length;
          streamPos += ci;

          const posInGroup = streamPos % 4;

          if (posInGroup === 0) {
            // First character of a 4-char group — free swap, no carry
            boxes[bi] = box.slice(0, ci) + SUBST_MAP[ch] + box.slice(ci + 1);
            substitutionUsed = true;
            substituted = true;
            break;
          }

          // Locate the previous character (may be in the prior box)
          let prevBi = bi, prevCi = ci - 1;
          if (prevCi < 0) {
            prevBi = bi - 1;
            while (prevBi >= 0 && boxes[prevBi].length === 0) prevBi--;
            if (prevBi < 0) continue;
            prevCi = boxes[prevBi].length - 1;
          }

          const prevCh = boxes[prevBi][prevCi];
          const prevVal = B64_VAL[prevCh];
          if (prevVal === undefined) continue; // already-substituted char

          let newPrevVal;
          if (posInGroup === 1) {
            // Whole-digit decrement
            newPrevVal = (prevVal - 1 + 64) % 64;
          } else if (posInGroup === 2) {
            // Decrement lower 4 bits, preserve upper 2 bits
            newPrevVal = (prevVal & 0x30) | (((prevVal & 0x0F) - 1 + 16) % 16);
          } else {
            // posInGroup === 3 — decrement lower 2 bits, preserve upper 4 bits
            newPrevVal = (prevVal & 0x3C) | (((prevVal & 0x03) - 1 + 4) % 4);
          }

          // Apply carry adjustment + symbol swap
          if (prevBi === bi) {
            // Both changes in the same box (prevCi is always ci - 1)
            boxes[bi] = box.slice(0, prevCi) + B64_ALPHA[newPrevVal]
                      + SUBST_MAP[ch] + box.slice(ci + 1);
          } else {
            const pb = boxes[prevBi];
            boxes[prevBi] = pb.slice(0, prevCi) + B64_ALPHA[newPrevVal] + pb.slice(prevCi + 1);
            boxes[bi] = box.slice(0, ci) + SUBST_MAP[ch] + box.slice(ci + 1);
          }

          substitutionUsed = true;
          substituted = true;
          break;
        }

        if (substituted) { anySubst = true; break; }
      }
      if (anySubst) break; // restart full scan
    }
    if (!anySubst) break;
  }
  }

  // Ambiguous character annotations
  const ambiNotes = {
    'O': 'uppercase O',
    'o': 'lowercase o',
    '0': 'zero (0)',
    '1': 'one (1)',
    'l': 'lowercase L',
    'I': 'uppercase i (I)',
    'q': 'lowercase q',
    '\u2018': "left \u2018",   // G substitution — curls: \u2018
    '\u2019': "right \u2019",  // H substitution — curls: \u2019
    '\u201C': "left \u201C",   // E substitution — curls: \u201C
    '\u201D': "right \u201D",  // F substitution — curls: \u201D
  };
  
  function annotate(box) {
    const set = new Set();
    for (const ch of box) {
      if (ambiNotes[ch]) set.add(ambiNotes[ch]);
    }
    return set.size ? ' [' + [...set].join(', ') + ']' : '';
  }
  
  // Format output
  let output = 'Box names (BASE64):\n';
  boxes.forEach((box, i) => {
    const idx = i + 1;
    const space = idx < 10 ? '  ' : ' ';
    const shiftNote = shiftedBoxes.has(i) ? ' ⚠️ no trailing spaces!' : '';
    output += `  Box ${idx}:${space}(${box})${annotate(box)}${shiftNote}\n`;
  });
  
  return { text: output.trimEnd(), substitutionUsed };
}

// Parse Base64 generated by this tool (raw stream or "Box N: (...)" format)
// back into the original 80-byte Pokémon data blob.
export function parseBase64Emerald(inputText) {
  const raw = String(inputText || '').trim();
  if (!raw) throw new Error('Please paste a Base64 code first.');

  const extracted = extractBase64Stream(raw);
  if (!extracted.stream) throw new Error('Could not find Base64 content in the pasted text.');

  // Reverse symbol substitutions first (if present), then normalize Emerald
  // alphabet chars back to standard Base64 (+ and /).
  const hasNonSlashSubst = /[.\-,\u2026\u201C\u201D\u2018\u2019\u2642\u2640]/u.test(extracted.stream);
  const maybeSubstituted = reverseBase64SymbolSubstitutions(
    extracted.stream,
    { includeSlashSymbol: extracted.fromBoxFormat || hasNonSlashSubst }
  );

  // Emerald output uses ! and ? instead of + and /.
  let standard = maybeSubstituted.replace(/\?/g, '/').replace(/!/g, '+');

  // Remove any accidental trailing padding and rebuild valid padding.
  standard = standard.replace(/=+$/g, '');
  while (standard.length % 4 !== 0) standard += '=';

  const bytes = decodeBase64ToBytes(standard);
  if (bytes.length !== 80) {
    throw new Error(`Decoded Base64 length was ${bytes.length} bytes (expected 80).`);
  }

  return {
    bytes,
    hex: bytesToHex(bytes),
    base64: standard
  };
}

function extractBase64Stream(rawText) {
  const boxRegex = /box\s*(\d+)\s*:\s*\(([^)]*)\)/gi;
  const byIndex = new Map();
  let match;
  while ((match = boxRegex.exec(rawText)) !== null) {
    const boxIndex = Number(match[1]);
    if (boxIndex < 1 || boxIndex > 14) continue;
    const boxValue = String(match[2] || '').replace(/\s+/g, '');
    byIndex.set(boxIndex, boxValue);
  }

  if (byIndex.size > 0) {
    const ordered = Array.from(byIndex.keys()).sort((a, b) => a - b);
    let stream = '';
    for (const idx of ordered) stream += byIndex.get(idx) || '';
    return { stream, fromBoxFormat: true };
  }

  // Raw fallback: keep only characters that can appear in supported Base64
  // import variants (standard, Emerald replacements, and substitution symbols).
  const allowed = /[A-Za-z0-9!?+\/=?.,\-\u2026\u201C\u201D\u2018\u2019\u2642\u2640]/u;
  let stream = '';
  for (const ch of rawText) {
    if (allowed.test(ch)) stream += ch;
  }
  stream = stream.replace(/\s+/g, '');

  return { stream, fromBoxFormat: false };
}

function decodeBase64ToBytes(base64Text) {
  if (typeof atob === 'function') {
    const bin = atob(base64Text);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xFF;
    return out;
  }

  // Node fallback for test/runtime tooling.
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64Text, 'base64');
    return new Uint8Array(buf);
  }

  throw new Error('No Base64 decoder is available in this environment.');
}

function reverseBase64SymbolSubstitutions(stream, options = {}) {
  const includeSlashSymbol = Boolean(options.includeSlashSymbol);

  const reverseMap = {
    '.': 'A',
    '-': 'B',
    '\u2026': 'D',
    '\u201C': 'E',
    '\u201D': 'F',
    '\u2018': 'G',
    '\u2019': 'H',
    '\u2642': 'I',
    '\u2640': 'J',
    ',': 'L',
  };
  if (includeSlashSymbol) reverseMap['/'] = 'N';

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?';
  const alphaVal = {};
  for (let i = 0; i < alphabet.length; i++) alphaVal[alphabet[i]] = i;

  const chars = Array.from(stream);
  for (let i = 0; i < chars.length; i++) {
    const cur = chars[i];
    const original = reverseMap[cur];
    if (!original) continue;

    const posInGroup = i % 4;
    if (posInGroup !== 0) {
      if (i === 0) continue;
      const prev = chars[i - 1];
      const prevVal = alphaVal[prev];
      if (prevVal === undefined) continue;

      let fixedPrev;
      if (posInGroup === 1) {
        fixedPrev = (prevVal + 1) % 64;
      } else if (posInGroup === 2) {
        fixedPrev = (prevVal & 0x30) | (((prevVal & 0x0F) + 1) % 16);
      } else {
        fixedPrev = (prevVal & 0x3C) | (((prevVal & 0x03) + 1) % 4);
      }
      chars[i - 1] = alphabet[fixedPrev];
    }

    chars[i] = original;
  }

  return chars.join('');
}

// Expose a snapshot of the core source for the "Show source" panel
export function coreSource(){
  return `// builder.js (excerpt)\n` + findOwnSource();
}

// Attempt to read this module's own source (not guaranteed in all bundlers; fine in dev)
function findOwnSource(){
  return [
    'PID%24 permutations, XOR key, checksum16, packIVWord, and GAEM packing are implemented in scaffold form.',
    'Fill exact header sizes/offsets and substructure fields per Gen3 docs.'
  ].join('\n');
}

// Parse 80-byte hex blob and extract Pokémon data
export function parsePokemonBytes(hexString) {
  // Normalize hex input
  const hex = hexString.replace(/[^0-9a-fA-F]/g, '');
  if (hex.length !== 160) throw new Error('Expected 80 bytes (160 hex characters)');
  
  // Convert to bytes
  const bytes = new Uint8Array(80);
  for (let i = 0; i < 80; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  
  // Read header
  const pid = readU32LE(bytes, 0);
  const otid = readU32LE(bytes, 4);
  const tid = otid & 0xFFFF;
  const sid = (otid >>> 16) & 0xFFFF;
  
  // Read nickname (10 bytes at 0x08)
  const nicknameBytes = bytes.slice(8, 18);
  const nickname = decodeName(nicknameBytes);
  
  const languageId = bytes[0x12];
  const miscFlags = bytes[0x13];
  
  // Read OT name (7 bytes at 0x14)
  const otBytes = bytes.slice(0x14, 0x1B);
  const otName = decodeName(otBytes);
  
  // Read markings (1 byte at 0x1B)
  const markingsByte = bytes[0x1B];
  const markings = {
    circle: Boolean(markingsByte & (1 << 0)),
    triangle: Boolean(markingsByte & (1 << 1)),
    square: Boolean(markingsByte & (1 << 2)),
    heart: Boolean(markingsByte & (1 << 3))
  };
  
  const checksum = bytes[0x1C] | (bytes[0x1D] << 8);
  
  // Read extra bytes (2 bytes at 0x1E-0x1F)
  const extraBytes = bytes[0x1E] | (bytes[0x1F] << 8);
  
  // Decrypt substructures if needed. Some tools export decrypted PC data
  // (e.g. .pk3) where the 48-byte substructures are already plaintext. To
  // detect which case we have, try both (XOR with key vs no-op) and pick the
  // one whose checksum matches the stored checksum in the header.
  const key = (pid ^ otid) >>> 0;
  const encrypted48 = bytes.slice(0x20, 0x50);
  const tryCandidate = (useXor) => {
    const out = new Uint8Array(48);
    for (let i = 0; i < 48; i += 4) {
      const word = readU32LE(encrypted48, i);
      const plain = useXor ? ((word ^ key) >>> 0) : (word >>> 0);
      writeU32LE(out, i, plain);
    }
    return out;
  };

  // Compute checksum for XOR-decrypted candidate
  const decryptedCandidate = tryCandidate(true);
  const checksumCandidate = checksum16(decryptedCandidate);

  let decrypted48;
  let usedXor = true;
  if (checksumCandidate === checksum) {
    // Encrypted in file; XOR decryption produced matching checksum
    decrypted48 = decryptedCandidate;
    usedXor = true;
  } else {
    // Try treating the block as already decrypted (no XOR)
    const plainCandidate = tryCandidate(false);
    const checksumPlain = checksum16(plainCandidate);
    if (checksumPlain === checksum) {
      decrypted48 = plainCandidate;
      usedXor = false;
    } else {
      // Fallback: prefer XOR-decrypted (original behavior) but warn
      console.warn('Could not match checksum with or without XOR; using XOR-decrypted by default');
      decrypted48 = decryptedCandidate;
      usedXor = true;
    }
  }
  
  // Determine substructure order.
  // If the file was XOR-decrypted (encrypted on-disk), substructures are stored
  // in PID-dependent permutation order and must be mapped using GAEM_PERMUTATIONS.
  // If the file was already plaintext (typical for .pk3 exports we generate),
  // assume canonical GAEM order (G,A,E,M) at offsets 0,12,24,36 respectively.
  let G, A, E, M;
  if (usedXor) {
    const order = GAEM_PERMUTATIONS[pid % 24];
    const map = {};
    let off = 0;
    for (const tag of order) {
      map[tag] = decrypted48.slice(off, off + 12);
      off += 12;
    }
    G = map.G;
    A = map.A;
    E = map.E;
    M = map.M;
  } else {
    // canonical GAEM order
    G = decrypted48.slice(0, 12);
    A = decrypted48.slice(12, 24);
    E = decrypted48.slice(24, 36);
    M = decrypted48.slice(36, 48);
  }
  
  // Parse Growth (G)
  const speciesId = G[0] | (G[1] << 8);
  const itemId = G[2] | (G[3] << 8);
  const totalExp = readU32LE(G, 4);
  const ppBonuses = G[8];
  const friendship = G[9];
  
  const pps = [
    (ppBonuses >> 0) & 3,
    (ppBonuses >> 2) & 3,
    (ppBonuses >> 4) & 3,
    (ppBonuses >> 6) & 3
  ];
  
  // Parse Attacks (A)
  const moves = [
    A[0] | (A[1] << 8),
    A[2] | (A[3] << 8),
    A[4] | (A[5] << 8),
    A[6] | (A[7] << 8)
  ];
  
  // Parse EVs (E)
  const evs = {
    hp: E[0],
    atk: E[1],
    def: E[2],
    spe: E[3],
    spa: E[4],
    spd: E[5]
  };
  
  // Parse Contest stats (E)
  const contest = {
    cool: E[6],
    beauty: E[7],
    cute: E[8],
    smart: E[9],
    tough: E[10],
    sheen: E[11]
  };
  
  // Parse Miscellaneous (M)
  const pokerusState = M[0] & 0xFF;
  const pokerusStatus = getPokerusStatusFromState(pokerusState);
  const metLocationId = M[1];
  const originsInfo = M[2] | (M[3] << 8);
  const metLevel = originsInfo & 0x7F;
  const originGame = (originsInfo >> 7) & 0x0F;
  const ballId = (originsInfo >> 11) & 0x0F;
  const otGender = (originsInfo >> 15) & 0x01;
  
  const ivWord = readU32LE(M, 4);
  const ivs = {
    hp: (ivWord >> 0) & 0x1F,
    atk: (ivWord >> 5) & 0x1F,
    def: (ivWord >> 10) & 0x1F,
    spe: (ivWord >> 15) & 0x1F,
    spa: (ivWord >> 20) & 0x1F,
    spd: (ivWord >> 25) & 0x1F
  };
  const abilityBit = (ivWord >> 31) & 1;

  // Egg bit is stored in the IV word (bit 30). Also some tools mark egg in
  // the header misc flags (bit 2). Consider Pokémon an egg if either is set.
  const eggFromIv = (ivWord >>> 30) & 1;
  const isEggFinal = Boolean(miscFlags & 0x04) || Boolean(eggFromIv);
  
  // Parse ribbons (32-bit bitfield)
  const ribbonWord = readU32LE(M, 8);
  const ribbons = {
    cool: (ribbonWord >> 0) & 0x7,
    beauty: (ribbonWord >> 3) & 0x7,
    cute: (ribbonWord >> 6) & 0x7,
    smart: (ribbonWord >> 9) & 0x7,
    tough: (ribbonWord >> 12) & 0x7,
    champion: Boolean((ribbonWord >> 15) & 1),
    winning: Boolean((ribbonWord >> 16) & 1),
    victory: Boolean((ribbonWord >> 17) & 1),
    artist: Boolean((ribbonWord >> 18) & 1),
    effort: Boolean((ribbonWord >> 19) & 1),
    battleChampion: Boolean((ribbonWord >> 20) & 1),
    regionalChampion: Boolean((ribbonWord >> 21) & 1),
    nationalChampion: Boolean((ribbonWord >> 22) & 1),
    country: Boolean((ribbonWord >> 23) & 1),
    national: Boolean((ribbonWord >> 24) & 1),
    earth: Boolean((ribbonWord >> 25) & 1),
    world: Boolean((ribbonWord >> 26) & 1),
    fatefulEncounter: Boolean((ribbonWord >> 31) & 1)
  };
  
  const natureIndex = pid % 25;
  
  return {
    pid,
    tid,
    sid,
    nickname,
    otName,
    languageId,
    miscFlags,
    isEgg: isEggFinal,
    extraBytes,
    markings,
    speciesId,
    itemId,
    totalExp,
    friendship,
    pps,
    moves,
    evs,
    contest,
    pokerusStatus,
    pokerusState,
    ivs,
    metLocationId,
    metLevel,
    originGame,
    ballId,
    otGender,
    abilityBit,
    natureIndex,
    ribbons
    ,
    // Debug: whether XOR decryption was used when parsing
    usedXor
  };
}

// Decode Gen 3 string (0xFF terminated)
// Supports both Western and Japanese character sets
function decodeName(bytes) {
  // Western character table (used in English, French, German, Spanish, Italian games)
  const WESTERN_CHARS = {
    0x00: ' ', 0xA1: '0', 0xA2: '1', 0xA3: '2', 0xA4: '3', 0xA5: '4',
    0xA6: '5', 0xA7: '6', 0xA8: '7', 0xA9: '8', 0xAA: '9',
    0xAB: '!', 0xAC: '?', 0xAD: '.', 0xAE: '-', 0xB4: '\'', 0xB5: '♂', 0xB6: '♀',
    0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E',
    0xC0: 'F', 0xC1: 'G', 0xC2: 'H', 0xC3: 'I', 0xC4: 'J',
    0xC5: 'K', 0xC6: 'L', 0xC7: 'M', 0xC8: 'N', 0xC9: 'O',
    0xCA: 'P', 0xCB: 'Q', 0xCC: 'R', 0xCD: 'S', 0xCE: 'T',
    0xCF: 'U', 0xD0: 'V', 0xD1: 'W', 0xD2: 'X', 0xD3: 'Y',
    0xD4: 'Z', 0xD5: 'a', 0xD6: 'b', 0xD7: 'c', 0xD8: 'd',
    0xD9: 'e', 0xDA: 'f', 0xDB: 'g', 0xDC: 'h', 0xDD: 'i',
    0xDE: 'j', 0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n',
    0xE3: 'o', 0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's',
    0xE8: 't', 0xE9: 'u', 0xEA: 'v', 0xEB: 'w', 0xEC: 'x',
    0xED: 'y', 0xEE: 'z'
  };
  
  // Japanese character table (Hiragana, Katakana, fullwidth characters)
  const JAPANESE_CHARS = {
    0x00: '　', 0x01: 'あ', 0x02: 'い', 0x03: 'う', 0x04: 'え', 0x05: 'お',
    0x06: 'か', 0x07: 'き', 0x08: 'く', 0x09: 'け', 0x0A: 'こ', 0x0B: 'さ',
    0x0C: 'し', 0x0D: 'す', 0x0E: 'せ', 0x0F: 'そ', 0x10: 'た', 0x11: 'ち',
    0x12: 'つ', 0x13: 'て', 0x14: 'と', 0x15: 'な', 0x16: 'に', 0x17: 'ぬ',
    0x18: 'ね', 0x19: 'の', 0x1A: 'は', 0x1B: 'ひ', 0x1C: 'ふ', 0x1D: 'へ',
    0x1E: 'ほ', 0x1F: 'ま', 0x20: 'み', 0x21: 'む', 0x22: 'め', 0x23: 'も',
    0x24: 'や', 0x25: 'ゆ', 0x26: 'よ', 0x27: 'ら', 0x28: 'り', 0x29: 'る',
    0x2A: 'れ', 0x2B: 'ろ', 0x2C: 'わ', 0x2D: 'を', 0x2E: 'ん', 0x2F: 'ぁ',
    0x30: 'ぃ', 0x31: 'ぅ', 0x32: 'ぇ', 0x33: 'ぉ', 0x34: 'ゃ', 0x35: 'ゅ',
    0x36: 'ょ', 0x37: 'が', 0x38: 'ぎ', 0x39: 'ぐ', 0x3A: 'げ', 0x3B: 'ご',
    0x3C: 'ざ', 0x3D: 'じ', 0x3E: 'ず', 0x3F: 'ぜ', 0x40: 'ぞ', 0x41: 'だ',
    0x42: 'ぢ', 0x43: 'づ', 0x44: 'で', 0x45: 'ど', 0x46: 'ば', 0x47: 'び',
    0x48: 'ぶ', 0x49: 'べ', 0x4A: 'ぼ', 0x4B: 'ぱ', 0x4C: 'ぴ', 0x4D: 'ぷ',
    0x4E: 'ぺ', 0x4F: 'ぽ', 0x50: 'っ', 0x51: 'ア', 0x52: 'イ', 0x53: 'ウ',
    0x54: 'エ', 0x55: 'オ', 0x56: 'カ', 0x57: 'キ', 0x58: 'ク', 0x59: 'ケ',
    0x5A: 'コ', 0x5B: 'サ', 0x5C: 'シ', 0x5D: 'ス', 0x5E: 'セ', 0x5F: 'ソ',
    0x60: 'タ', 0x61: 'チ', 0x62: 'ツ', 0x63: 'テ', 0x64: 'ト', 0x65: 'ナ',
    0x66: 'ニ', 0x67: 'ヌ', 0x68: 'ネ', 0x69: 'ノ', 0x6A: 'ハ', 0x6B: 'ヒ',
    0x6C: 'フ', 0x6D: 'ヘ', 0x6E: 'ホ', 0x6F: 'マ', 0x70: 'ミ', 0x71: 'ム',
    0x72: 'メ', 0x73: 'モ', 0x74: 'ヤ', 0x75: 'ユ', 0x76: 'ヨ', 0x77: 'ラ',
    0x78: 'リ', 0x79: 'ル', 0x7A: 'レ', 0x7B: 'ロ', 0x7C: 'ワ', 0x7D: 'ヲ',
    0x7E: 'ン', 0x7F: 'ァ', 0x80: 'ィ', 0x81: 'ゥ', 0x82: 'ェ', 0x83: 'ォ',
    0x84: 'ャ', 0x85: 'ュ', 0x86: 'ョ', 0x87: 'ガ', 0x88: 'ギ', 0x89: 'グ',
    0x8A: 'ゲ', 0x8B: 'ゴ', 0x8C: 'ザ', 0x8D: 'ジ', 0x8E: 'ズ', 0x8F: 'ゼ',
    0x90: 'ゾ', 0x91: 'ダ', 0x92: 'ヂ', 0x93: 'ヅ', 0x94: 'デ', 0x95: 'ド',
    0x96: 'バ', 0x97: 'ビ', 0x98: 'ブ', 0x99: 'ベ', 0x9A: 'ボ', 0x9B: 'パ',
    0x9C: 'ピ', 0x9D: 'プ', 0x9E: 'ペ', 0x9F: 'ポ', 0xA0: 'ッ', 0xA1: '０',
    0xA2: '１', 0xA3: '２', 0xA4: '３', 0xA5: '４', 0xA6: '５', 0xA7: '６',
    0xA8: '７', 0xA9: '８', 0xAA: '９', 0xAB: '！', 0xAC: '？', 0xAD: '。',
    0xAE: 'ー', 0xAF: '・', 0xB5: '♂', 0xB6: '♀', 0xBB: 'Ａ', 0xBC: 'Ｂ',
    0xBD: 'Ｃ', 0xBE: 'Ｄ', 0xBF: 'Ｅ', 0xC0: 'Ｆ', 0xC1: 'Ｇ', 0xC2: 'Ｈ',
    0xC3: 'Ｉ', 0xC4: 'Ｊ', 0xC5: 'Ｋ', 0xC6: 'Ｌ', 0xC7: 'Ｍ', 0xC8: 'Ｎ',
    0xC9: 'Ｏ', 0xCA: 'Ｐ', 0xCB: 'Ｑ', 0xCC: 'Ｒ', 0xCD: 'Ｓ', 0xCE: 'Ｔ',
    0xCF: 'Ｕ', 0xD0: 'Ｖ', 0xD1: 'Ｗ', 0xD2: 'Ｘ', 0xD3: 'Ｙ', 0xD4: 'Ｚ',
    0xD5: 'ａ', 0xD6: 'ｂ', 0xD7: 'ｃ', 0xD8: 'ｄ', 0xD9: 'ｅ', 0xDA: 'ｆ',
    0xDB: 'ｇ', 0xDC: 'ｈ', 0xDD: 'ｉ', 0xDE: 'ｊ', 0xDF: 'ｋ', 0xE0: 'ｌ',
    0xE1: 'ｍ', 0xE2: 'ｎ', 0xE3: 'ｏ', 0xE4: 'ｐ', 0xE5: 'ｑ', 0xE6: 'ｒ',
    0xE7: 'ｓ', 0xE8: 'ｔ', 0xE9: 'ｕ', 0xEA: 'ｖ', 0xEB: 'ｗ', 0xEC: 'ｘ',
    0xED: 'ｙ', 0xEE: 'ｚ'
  };
  
  let str = '';
  for (const b of bytes) {
    // 0xFF is the Gen3 terminator; do NOT treat 0x00 (space) as terminator.
    if (b === 0xFF) break;
    // Prefer Western mapping for overlapping bytes (ASCII-like characters),
    // otherwise fall back to the Japanese table. Unknown bytes -> '?'.
    const ch = (WESTERN_CHARS[b] !== undefined)
      ? WESTERN_CHARS[b]
      : (JAPANESE_CHARS[b] !== undefined ? JAPANESE_CHARS[b] : '?');
    str += ch;
  }
  return str;
}
