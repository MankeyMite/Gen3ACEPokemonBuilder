/**
 * Channel Jirachi PID / IV searcher — Web Worker
 *
 * Scans XDRNG seeds to find valid Channel Jirachi results matching the
 * user's criteria (nature, shiny, IV ranges).
 *
 * Channel Jirachi generation from the PID/IV seed:
 *   advance → SID            (u16)
 *   advance → PID high       (u16)
 *   advance → PID low        (u16)  — bit 31 flip rule
 *   advance → Held item      (u16 >> 15 → 0=Ganlon, 1=Salac)
 *   advance → Version        (u16 >> 15 → 0=Sapphire, 1=Ruby)
 *   advance → OT Gender      (u16 >> 15 → 0=Male, 1=Female)
 *   advance × 6 → IVs        (top 5 bits: seed >>> 27, HP ATK DEF SPE SPA SPD)
 *
 * Fixed: TID = 40122
 *
 * Before a PID/IV seed is valid, it must pass the Channel menu + accept
 * backwards-validation (≈18% of seeds are valid).
 *
 * Message IN  → { startSeed, endSeed, nature, wantShiny, tid,
 *                 minIVs:[6], maxIVs:[6], maxResults }
 *
 * Message OUT → { type:'progress', done, total }
 *            → { type:'snapshot', results:[…] }
 *            → { type:'done', results:[…] }
 */

/* ── XDRNG ──────────────────────────────────────────── */
const MULT  = 0x343FD;
const ADD   = 0x269EC3;
const rMULT = 0xB9B33155;
const rADD  = 0xA170F641;

function next(s)  { return (Math.imul(s, MULT) + ADD) >>> 0; }
function prev(s)  { return (Math.imul(s, rMULT) + rADD) >>> 0; }

/* ── Hidden-Power helpers ─────────────────────────────── */
const HP_TYPES = [
  'Fighting','Flying','Poison','Ground','Rock','Bug',
  'Ghost','Steel','Fire','Water','Grass','Electric',
  'Psychic','Ice','Dragon','Dark'
];
function hpType(iv) {
  const v = (iv.hp&1)|((iv.atk&1)<<1)|((iv.def&1)<<2)|
            ((iv.spe&1)<<3)|((iv.spa&1)<<4)|((iv.spd&1)<<5);
  return HP_TYPES[Math.floor(v * 15 / 63)];
}
function hpPower(iv) {
  const v = ((iv.hp>>1)&1)|(((iv.atk>>1)&1)<<1)|(((iv.def>>1)&1)<<2)|
            (((iv.spe>>1)&1)<<3)|(((iv.spa>>1)&1)<<4)|(((iv.spd>>1)&1)<<5);
  return Math.floor(v * 40 / 63) + 30;
}

/* ── Priority-buffer ──────────────────────────────────── */
function makePriorityBuffer(cap) {
  const buf = [];
  let worstTotal = -1;
  function tryAdd(entry, total) {
    if (buf.length >= cap && total <= worstTotal) return;
    entry._t = total;
    buf.push(entry);
    if (buf.length > cap) {
      let mi = 0, mv = buf[0]._t;
      for (let j = 1; j < buf.length; j++) {
        if (buf[j]._t < mv) { mv = buf[j]._t; mi = j; }
      }
      buf.splice(mi, 1);
    }
    if (buf.length >= cap) {
      worstTotal = buf[0]._t;
      for (let j = 1; j < buf.length; j++) {
        if (buf[j]._t < worstTotal) worstTotal = buf[j]._t;
      }
    }
  }
  return { buf, tryAdd, getWorst: () => worstTotal, full: () => buf.length >= cap };
}

/* ── Channel seed validation (backwards from PID/IV seed) ── */

const BIT123 = 0b1110;

/**
 * Validate accept step backwards. Returns post-menu seed or -1 on fail.
 * Uses -1 instead of null for performance in hot loop.
 */
function isValidAccept(seed, pivot) {
  if (pivot === 0) {
    seed = prev(seed);
    seed = prev(seed);
    const r1 = seed >>> 16;
    if (r1 <= 0x547A) return -1;
    seed = prev(seed);
    const r2 = seed >>> 16;
    if (r2 <= 0x4000) return -1;
  } else if (pivot === 1) {
    seed = prev(seed);
    const r = seed >>> 16;
    if (r > 0x4000) return -1;
  } else {
    seed = prev(seed);
    const r1 = seed >>> 16;
    if (r1 > 0x547A) return -1;
    seed = prev(seed);
    const r2 = seed >>> 16;
    if (r2 <= 0x4000) return -1;
  }
  // 5 base advances backwards
  seed = prev(seed);
  seed = prev(seed);
  seed = prev(seed);
  seed = prev(seed);
  seed = prev(seed);
  return seed;
}

/**
 * Validate menu pattern backwards. Returns origin seed or -1 on fail.
 */
function isValidMenu(seed) {
  const end = seed >>> 30;
  if (end === 0) return -1;
  let seen = 1 << end;
  for (;;) {
    seed = prev(seed);
    const p = seed >>> 30;
    if (p === end) return -1;
    seen |= (1 << p);
    if (seen >= BIT123) return seed;
  }
}

/**
 * Check if a PID/IV seed is reachable via the Channel pattern.
 */
function isPossible(seed) {
  for (let i = 0; i < 3; i++) {
    const postMenu = isValidAccept(seed, i);
    if (postMenu === -1) continue;
    const origin = isValidMenu(postMenu);
    if (origin === -1) continue;
    return true;
  }
  return false;
}

/* ── Brute-force search ─────────────────────────────── */

const TID = 40122;

function matchesNature(pid, nature) {
  return Number(nature) < 0 || (pid >>> 0) % 25 === Number(nature);
}

function bruteForceSearch(params, isStopped) {
  const {
    startSeed, endSeed,
    nature, wantShiny,
    minIVs, maxIVs, maxResults
  } = params;

  const pb = makePriorityBuffer(maxResults || 50);
  const TICK = 0x400000;
  const tickMask = TICK - 1;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs[0], xAtk = maxIVs[1], xDef = maxIVs[2],
        xSpA = maxIVs[3], xSpD = maxIVs[4], xSpe = maxIVs[5];

  for (let seed = startSeed; seed < endSeed; seed++) {
    if (((seed - startSeed) & tickMask) === 0 && seed > startSeed) {
      self.postMessage({ type: 'progress', done: seed - startSeed, total: endSeed - startSeed });
      if (pb.buf.length > 0) self.postMessage({ type: 'snapshot', results: pb.buf });
      if (isStopped()) break;
    }

    const pivotSeed = seed >>> 0;

    // Inline PID generation (3 advances) for early nature check
    let s = next(pivotSeed);
    const sid = s >>> 16;
    s = next(s);
    const pid1 = s >>> 16;
    s = next(s);
    const pid2 = s >>> 16;

    let pid = ((pid1 << 16) | pid2) >>> 0;
    if ((pid2 > 7 ? 0 : 1) !== (pid1 ^ sid ^ TID))
      pid = (pid ^ 0x80000000) >>> 0;

    // Nature check first (eliminates 24/25 seeds)
    if (!matchesNature(pid, nature)) continue;

    // Advance past item/version/OT gender, extract values
    s = next(s); const heldItemBit = s >>> 31;
    s = next(s); const versionBit = s >>> 31;
    s = next(s); const otGender = s >>> 31;

    // IV generation (top 5 bits) with early bailout
    s = next(s); const hp  = s >>> 27;
    if (hp  < mHp  || hp  > xHp)  continue;
    s = next(s); const atk = s >>> 27;
    if (atk < mAtk || atk > xAtk) continue;
    s = next(s); const def = s >>> 27;
    if (def < mDef || def > xDef) continue;
    s = next(s); const spe = s >>> 27;
    if (spe < mSpe || spe > xSpe) continue;
    s = next(s); const spa = s >>> 27;
    if (spa < mSpA || spa > xSpA) continue;
    s = next(s); const spd = s >>> 27;
    if (spd < mSpD || spd > xSpD) continue;

    const ivTotal = hp + atk + def + spa + spd + spe;
    if (pb.full() && ivTotal <= pb.getWorst()) continue;

    // Shiny filter
    const xv = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (TID ^ sid);
    const isShiny = xv < 8;
    if (wantShiny && !isShiny) continue;

    // Channel seed validity check (most expensive, do last)
    if (!isPossible(pivotSeed)) continue;

    const heldItemId = 169 + heldItemBit;
    const versionGameId = versionBit === 0 ? 1 : 2;
    const ivs = { hp, atk, def, spa, spd, spe };
    pb.tryAdd({
      seed: pivotSeed,
      pid,
      sid,
      heldItemId,
      versionGameId,
      otGender,
      method: 'Channel',
      ivs,
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      metLevels: null
    }, ivTotal);
  }

  self.postMessage({ type: 'done', results: pb.buf });
}

/* ── Entry ──────────────────────────────────────────── */
self.onmessage = function (e) {
  let stopped = false;
  self.onmessage = function () { stopped = true; };
  const isStopped = () => stopped;
  bruteForceSearch(e.data, isStopped);
};
