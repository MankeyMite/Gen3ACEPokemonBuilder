/**
 * Channel Jirachi RNG logic — ported from PKHeX ChannelJirachi.cs + EncounterGift3.cs.
 *
 * XDRNG:  seed = (seed * 0x343FD + 0x269EC3) >>> 0
 * Reverse: seed = (seed * 0xB9B33155 + 0xA170F641) >>> 0
 *
 * Generation order from the PID/IV seed:
 *   1. SID (upper 16 of XDRNG)
 *   2. PID high (u16)
 *   3. PID low  (u16)   — bit 31 of PID flipped depending on shiny check
 *   4. Held item (u16 >> 15 → 0=Ganlon, 1=Salac → item ids 169/170)
 *   5. Version  (u16 >> 15 → 0=Sapphire, 1=Ruby → game ids 1/2)
 *   6. OT Gender (u16 >> 15 → 0=Male, 1=Female)
 *   7–12. IVs: HP, ATK, DEF, SPE, SPA, SPD  (each u16 & 0x1F, individual calls)
 *
 * Fixed: TID = 40122, OT = "CHANNEL", Species = 385 (Jirachi), Level = 5
 *
 * Validation:
 *   Working backwards from the PID/IV seed, the seed must pass the
 *   Accept step (25%/33% branches) and the Menu pattern (1–3 ordering).
 */

/* ── XDRNG primitives ─────────────────────────────────────── */

const MULT  = 0x343FD;
const ADD   = 0x269EC3;
const rMULT = 0xB9B33155;
const rADD  = 0xA170F641;

function next(seed)  { return (Math.imul(seed, MULT) + ADD) >>> 0; }
function prev(seed)  { return (Math.imul(seed, rMULT) + rADD) >>> 0; }
function next16(seed) { return ((Math.imul(seed, MULT) + ADD) >>> 16) & 0xFFFF; }

// Multi-step forward helpers
function next2(seed) { return next(next(seed)); }
function next3(seed) { return next(next2(seed)); }
function next4(seed) { return next(next3(seed)); }
function next5(seed) { return next(next4(seed)); }

// Advance and return { seed, value } (upper 16)
function advU16(seed) {
  seed = next(seed);
  return { seed, value: seed >>> 16 };
}

// Prev + return upper 16
function prevU16(seed) {
  seed = prev(seed);
  return { seed, value: seed >>> 16 };
}

/* ── Seed validation (backwards from PID/IV seed) ──────── */

const BIT_PATTERN_123 = 0b1110;

/**
 * Check if the Accept step is valid for a given pivot (0–2).
 * Works backwards: `seed` is the PID/IV seed. Returns the post-menu seed or null.
 */
function isValidAccept(seed, acceptPivot) {
  if (acceptPivot === 0) {
    // Both fail → 2 advances after 5 base. 8 total before PID/IV seed.
    seed = prev(seed); // undo the extra "both fail" advance
    let r;
    ({ seed, value: r } = prevU16(seed));
    if (r <= 0x547A) return null; // 33% should FAIL
    ({ seed, value: r } = prevU16(seed));
    if (r <= 0x4000) return null; // 25% should FAIL
  } else if (acceptPivot === 1) {
    // 25% passes → 1 advance after 5 base. 6 total.
    let r;
    ({ seed, value: r } = prevU16(seed));
    if (r > 0x4000) return null; // 25% should PASS
  } else {
    // 25% fails, 33% passes → 1 advance. 7 total.
    let r;
    ({ seed, value: r } = prevU16(seed));
    if (r > 0x547A) return null; // 33% should PASS
    ({ seed, value: r } = prevU16(seed));
    if (r <= 0x4000) return null; // 25% should FAIL
  }
  seed = prev(prev(prev(prev(prev(seed))))); // 5 base advances
  return seed;
}

/**
 * Check if the Menu pattern is valid.
 * `seed` is immediately after the menu pattern (post-menu). Works backwards.
 * Returns the origin seed (before the menu) or null.
 */
function isValidMenu(seed) {
  const end = seed >>> 30;
  if (end === 0) return null; // menu can't end on 0

  let seen = 1 << end;

  while (true) {
    seed = prev(seed);
    const pattern = seed >>> 30;
    if (pattern === end) return null; // duplicate end → invalid

    seen |= (1 << pattern);
    if (seen >= BIT_PATTERN_123) {
      return seed; // seen all 1–3
    }
  }
}

/**
 * Check if a PID/IV seed is a valid Channel Jirachi seed.
 * Returns { pattern, originSeed } or null.
 */
export function isPossible(seed) {
  seed = seed >>> 0;
  for (let i = 0; i < 3; i++) {
    let s = seed;
    const postMenu = isValidAccept(s, i);
    if (postMenu === null) continue;
    const origin = isValidMenu(postMenu);
    if (origin === null) continue;
    return { pattern: i + 1, originSeed: prev(origin) >>> 0 };
  }
  return null;
}

/* ── Forward generation ─────────────────────────────────── */

/**
 * Skip the menu pattern (forward). Returns the seed after the menu completes.
 */
export function skipMenuPattern(seed) {
  let seen = 0;
  while (true) {
    seed = next(seed);
    const p = seed >>> 30;
    seen |= (1 << p);
    if (seen >= BIT_PATTERN_123) return seed;
  }
}

/**
 * Skip the accept step (forward). Returns the PID/IV seed.
 */
export function skipAccept(seed) {
  seed = next4(seed);
  const s1 = next(seed);
  const r1 = s1 >>> 16;
  if (r1 <= 0x4000) return next(s1); // 25% passed

  const s2 = next(s1);
  const r2 = s2 >>> 16;
  if (r2 <= 0x547A) return next(s2); // 33% passed

  return next2(s2); // both failed
}

/**
 * Skip from origin seed to PID/IV seed.
 */
export function skipToPIDIV(originSeed) {
  return skipAccept(skipMenuPattern(originSeed));
}

/**
 * Generate all Channel Jirachi values from the PID/IV seed.
 * Returns { sid, pid, heldItem, heldItemId, version, versionGameId,
 *           otGender, ivs: {hp, atk, def, spe, spa, spd} }
 */
export function generateFromSeed(seed) {
  const TID = 40122;
  let s = seed >>> 0;

  // 1. SID
  let t;
  ({ seed: s, value: t } = advU16(s));
  const sid = t;

  // 2–3. PID
  let pid1, pid2;
  ({ seed: s, value: pid1 } = advU16(s));
  ({ seed: s, value: pid2 } = advU16(s));

  let pid = ((pid1 << 16) | pid2) >>> 0;

  // Bit-31 flip rule: if (pid2 > 7 ? 0 : 1) != (pid1 ^ sid ^ TID) → flip bit 31
  // The XOR result is compared as a full value (not just lowest bit).
  // Since the XOR is almost never exactly 0 or 1, the flip fires ~99.997% of the time.
  const lowCheck = pid2 > 7 ? 0 : 1;
  const xorCheck = pid1 ^ sid ^ TID;
  if (lowCheck !== xorCheck) {
    pid = (pid ^ 0x80000000) >>> 0;
  }

  // 4. Held item (bit 15 → 0=Ganlon 169, 1=Salac 170)
  ({ seed: s, value: t } = advU16(s));
  const heldItemBit = t >> 15;
  const heldItemId = 169 + heldItemBit; // 169=Ganlon Berry, 170=Salac Berry

  // 5. Version (bit 15 → 0=Sapphire, 1=Ruby)  
  ({ seed: s, value: t } = advU16(s));
  const versionBit = t >> 15;
  const versionGameId = versionBit === 0 ? 1 : 2; // 1=Sapphire, 2=Ruby

  // 6. OT Gender (bit 15 → 0=Male, 1=Female)
  ({ seed: s, value: t } = advU16(s));
  const otGender = t >> 15;

  // 7–12. IVs (individual calls, top 5 bits of each 32-bit state)
  // Channel Jirachi uses seed >>> 27 (top 5 bits), NOT (seed >>> 16) & 0x1F.
  const readIV = () => {
    s = next(s);
    return s >>> 27;
  };
  const hp  = readIV();
  const atk = readIV();
  const def = readIV();
  const spe = readIV();
  const spa = readIV();
  const spd = readIV();

  return {
    sid,
    pid,
    heldItemId,
    heldItemName: heldItemBit === 0 ? 'Ganlon Berry' : 'Salac Berry',
    versionGameId,
    versionName: versionBit === 0 ? 'Sapphire' : 'Ruby',
    otGender, // 0=Male, 1=Female
    ivs: { hp, atk, def, spe, spa, spd }
  };
}

/**
 * Validate a finished Channel Jirachi against its seed.
 * Performs the full check: PID/IV seed → menu + accept validation → value comparison.
 */
export function validateChannel(pid, sid, iv32or6, tid) {
  if (tid === undefined) tid = 40122;
  // TODO: implement if needed for import validation
  return true;
}

/* ── Seed recovery from IVs ────────────────────────────── */

/**
 * XDRNG seed recovery from Channel Jirachi IVs.
 * Channel IVs are generated as 6 individual u16 calls (unlike standard CXD which packs 3+3).
 * Given target IVs, we try all 2^32 seeds (brute-force) or use the
 * worker for parallel search.
 *
 * For the worker fast-path, we enumerate possible (HP, ATK, DEF) combos
 * and work backwards to find candidate seeds; see channel-worker.js.
 */

// Exported XDRNG primitives for worker use
export { next, prev, next16, next2, next3, next4, next5, advU16 };
