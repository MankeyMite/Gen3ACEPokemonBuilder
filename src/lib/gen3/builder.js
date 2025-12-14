import { GAEM_PERMUTATIONS } from './permutations.js';
import { MOVES_MAP } from '../../data/moves.gen3.js';
import { encodeName, encodeNickname, encodeOT } from './encoding.js';
import { u32, writeU16LE, writeU32LE, readU32LE, packIVWord, checksum16, bytesToHex, bytesToFormattedHex } from './packers.js';

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
  M[0] = 0; // No Pokérus for now
  
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
  M[0] = 0;
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
export function toBase64Emerald(bytes){
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
  
  // Ambiguous character annotations
  const ambiNotes = {
    'O': 'uppercase O',
    'o': 'lowercase o',
    '0': 'zero (0)',
    '1': 'one (1)',
    'l': 'lowercase L',
    'I': 'uppercase i (I)',
    'q': 'lowercase q'
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
    output += `  Box ${idx}:${space}(${box})${annotate(box)}\n`;
  });
  
  return output.trimEnd();
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
    if (b === 0xFF || b === 0x00) break;
    // Try Japanese first (more comprehensive), then Western
    str += JAPANESE_CHARS[b] || WESTERN_CHARS[b] || '?';
  }
  return str;
}
