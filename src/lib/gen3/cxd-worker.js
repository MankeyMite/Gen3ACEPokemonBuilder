/**
 * CXD PID / IV searcher — Web Worker
 *
 * Iterates the 32-bit CXD seed space, generates shadow Pokémon using the
 * CXD PRNG and pipeline (IVs → ability → PID), filters by nature/gender/
 * ability/IVs/shiny, and returns matching results.
 *
 * Message IN  → { startSeed, endSeed, nature, ability, genderThreshold,
 *                 targetGender, tid, sid, wantShiny, minIVs:[6], maxIVs:[6],
 *                 maxResults }
 *
 * Message OUT → { type:'progress', done, total }
 *            → { type:'done', results:[{ seed, pid, method:'CXD', ivs, hpt, hpp }] }
 */

/* ── CXD PRNG ────────────────────────────────────────── */
const CXD_MULT = 0x343FD;
const CXD_ADD  = 0x269EC3;
function cxdNext(s) { return (Math.imul(s, CXD_MULT) + CXD_ADD) >>> 0; }

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

/* ── Main search loop ────────────────────────────────── */
self.onmessage = function (e) {
  const {
    startSeed, endSeed,
    nature, ability,
    genderThreshold, targetGender,
    tid, sid, wantShiny,
    minIVs, maxIVs, maxResults
  } = e.data;

  const results = [];
  const cap = maxResults || 500;
  const TICK = 0x800000;
  const tickMask = TICK - 1;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs ? maxIVs[0] : 31, xAtk = maxIVs ? maxIVs[1] : 31, xDef = maxIVs ? maxIVs[2] : 31,
        xSpA = maxIVs ? maxIVs[3] : 31, xSpD = maxIVs ? maxIVs[4] : 31, xSpe = maxIVs ? maxIVs[5] : 31;
  const trainerXor = (tid ^ sid) >>> 0;

  for (let seed = startSeed; seed < endSeed; seed++) {
    if (((seed - startSeed) & tickMask) === 0 && seed > startSeed) {
      self.postMessage({ type: 'progress', done: seed - startSeed, total: endSeed - startSeed });
      if (results.length >= cap) break;
    }

    let s = seed >>> 0;

    /* CXD pipeline: IV1 → IV2 → Ability → PID_hi → PID_lo */

    // IV1
    s = cxdNext(s);
    const iv1r = (s >>> 16) & 0x7FFF;
    const hp   = iv1r & 0x1F;          if (hp  < mHp  || hp  > xHp)  continue;
    const atk  = (iv1r >> 5)  & 0x1F;  if (atk < mAtk || atk > xAtk) continue;
    const def  = (iv1r >> 10) & 0x1F;  if (def < mDef || def > xDef) continue;

    // IV2
    s = cxdNext(s);
    const iv2r = (s >>> 16) & 0x7FFF;
    const spe  = iv2r & 0x1F;          if (spe < mSpe || spe > xSpe) continue;
    const spa  = (iv2r >> 5)  & 0x1F;  if (spa < mSpA || spa > xSpA) continue;
    const spd  = (iv2r >> 10) & 0x1F;  if (spd < mSpD || spd > xSpD) continue;

    // Ability
    s = cxdNext(s);
    const abilityBit = ((s >>> 16) & 0x7FFF) & 1;
    if (ability >= 0 && abilityBit !== ability) continue;

    // PID
    s = cxdNext(s);
    const pidHi = s >>> 16;
    s = cxdNext(s);
    const pidLo = s >>> 16;
    const pid = ((pidHi << 16) | pidLo) >>> 0;

    /* ── Fast filter cascade ─────────────────────────── */
    if (pid % 25 !== nature) continue;

    if (targetGender < 2) {
      const gb = pid & 0xFF;
      if (targetGender === 0 && gb >= genderThreshold) continue;
      if (targetGender === 1 && gb < genderThreshold)  continue;
    }

    const xv = (pidHi ^ pidLo) ^ trainerXor;
    if (wantShiny  && xv >= 8) continue;
    if (!wantShiny && xv <  8) continue;

    /* ── Match! ──────────────────────────────────────── */
    const ivs = { hp, atk, def, spa, spd, spe };
    results.push({
      seed: seed >>> 0,
      pid,
      method: 'CXD',
      ivs,
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      initSeed: null,
      metLevels: null
    });
  }

  self.postMessage({ type: 'done', results });
};
