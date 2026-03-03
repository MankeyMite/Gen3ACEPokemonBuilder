/**
 * Gen 3 PRNG PID / IV searcher — Web Worker (v2, encounter-chain-valid)
 *
 * Iterates a slice of the 32-bit seed space, finds Method H1/H2/H4
 * PID+IV combinations, then validates each result against the full
 * wild encounter RNG chain (slot → level → nature → PID loop → IVs)
 * so that every returned result passes PkHex's origin-seed check.
 *
 * Message IN  → { startSeed, endSeed, nature, ability, genderThreshold,
 *                 targetGender, tid, sid, wantShiny, minIVs:[6],
 *                 methods:[3 bools], maxResults, targetSpecies,
 *                 slotTables: { l:[[...]], w:[[...]], ... } | null }
 *
 * Message OUT → { type:'progress', done, total }
 *            → { type:'done', results:[ {seed,pid,method,ivs,hpt,hpp,initSeed} ] }
 */

/* ── Gen 3 LCG ─────────────────────────────────────────── */
const MULT  = 0x41C64E6D;
const ADD   = 0x6073;
const RMULT = 0xEEB9EB65;          // modular inverse of MULT mod 2^32
const RADD  = 0x0A3561A1;          // (-ADD * RMULT) & 0xFFFFFFFF

function advance(s) { return (Math.imul(s, MULT) + ADD)   >>> 0; }
function reverse(s) { return (Math.imul(s, RMULT) + RADD) >>> 0; }

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

/* ── Encounter-slot helpers ───────────────────────────── */

/* Cumulative thresholds for (rand % 100) → slot index */
const SLOT_CUM = {
  l: [20,40,50,60,70,80,85,90,94,98,99,100],   // land       12 slots
  w: [60,90,95,99,100],                          // water       5 slots
  r: [60,90,95,99,100],                          // rock_smash  5 slots
  o: [70,100],                                   // old_rod     2 slots
  g: [60,80,100],                                // good_rod    3 slots
  s: [40,80,95,99,100]                           // super_rod   5 slots
};

function getSlotIndex(rand100, cum) {
  for (let i = 0; i < cum.length; i++) if (rand100 < cum[i]) return i;
  return cum.length - 1;
}

/**
 * Build a quick-lookup: for each encounter type, which slot indices
 * contain the target species?
 * Returns { l: Set([0,2,6]), w: Set([1,3]) }
 */
function buildSpeciesSlotMap(slotTables, targetSpecies) {
  const map = {};
  for (const type of Object.keys(slotTables)) {
    const set = new Set();
    for (const table of slotTables[type]) {
      for (let i = 0; i < table.length; i++) {
        if (table[i][0] === targetSpecies) set.add(i);
      }
    }
    if (set.size > 0) map[type] = set;
  }
  return map;
}

/* ── Encounter-chain backward validation ──────────────── */

const MAX_REJECTIONS = 660;

/**
 * Given the RNG state that produced PID_low, walk backwards through the
 * nature rejection loop and check whether the encounter slot call maps
 * to the target species.
 *
 * Checks up to three chain patterns for each #rejections K:
 *   A) No Synchronize (slot → level → nature → PID loop)       [all games]
 *   B) Sync success   (slot → level → sync_check → PID loop)   [Emerald only]
 *   C) Sync fail      (slot → level → sync_check → nature → PID loop) [Emerald only]
 *
 * @param {boolean} canSync - true only for Emerald (game 3); RS and FRLG lack Sync lead
 * @param {Object} allSlotTables - the raw slotTables from the caller (for level computation)
 * @param {number} targetSpecies - species ID we're looking for
 * @returns {{initSeed:number, metLevels:number[]}|null}
 */
function validateEncounterChain(pidLowState, nature, speciesSlots, canSync, allSlotTables, targetSpecies) {
  let pls = reverse(pidLowState);     // pre-loop state for K = 0

  for (let K = 0; K <= MAX_REJECTIONS; K++) {
    if (K > 0) {
      // Step back 2 states (one more rejected PID)
      pls = reverse(reverse(pls));
      // Verify the rejected PID we stepped over had wrong nature
      const rLow  = advance(pls);
      const rHigh = advance(rLow);
      const rPid  = ((rHigh >>> 16) << 16) | (rLow >>> 16);
      if ((rPid >>> 0) % 25 === nature) break;   // blocking PID → stop
    }

    // pls = state after the last pre-loop Random() call.
    const plsOut = pls >>> 16;

    // ── Pattern A (no sync, 3 calls: slot→level→nature→PID) ─────
    // Pattern B (sync success, 3 calls) — Emerald only
    // Both share the same slot position (2 steps before pls)
    const patternA = (plsOut % 25 === nature);
    const patternB = canSync && ((plsOut & 1) === 0);
    if (patternA || patternB) {
      const slotState = reverse(reverse(pls));     // 2 steps back
      const result    = checkSlotWithLevel(slotState, speciesSlots, allSlotTables, targetSpecies);
      if (result !== null) return result;
    }

    // ── Pattern C (sync fail, 4 calls: slot→level→sync→nature→PID) ── Emerald only
    if (canSync && patternA) {
      const syncState = reverse(pls);
      if (((syncState >>> 16) & 1) === 1) {       // sync failed (odd)
        const slotState = reverse(reverse(syncState));  // 2 more back
        const result    = checkSlotWithLevel(slotState, speciesSlots, allSlotTables, targetSpecies);
        if (result !== null) return result;
      }
    }
  }
  return null;
}

/**
 * Check whether the slot determined by slotState contains the target species,
 * and if so compute every possible met level (one per sub-area table).
 * @returns {{initSeed:number, metLevels:number[]}|null}
 */
function checkSlotWithLevel(slotState, speciesSlots, allSlotTables, targetSpecies) {
  const slotRand  = (slotState >>> 16) % 100;
  const levelRand = advance(slotState) >>> 16;   // next RNG call = level

  for (const type of Object.keys(speciesSlots)) {
    const cum = SLOT_CUM[type];
    if (!cum) continue;
    const si = getSlotIndex(slotRand, cum);
    if (!speciesSlots[type].has(si)) continue;

    // Slot matches — compute level from every sub-area table containing the species
    const levelsSet = new Set();
    for (const table of allSlotTables[type]) {
      if (table[si] && table[si][0] === targetSpecies) {
        const minLv = table[si][1], maxLv = table[si][2];
        levelsSet.add(minLv + (levelRand % (maxLv - minLv + 1)));
      }
    }
    if (levelsSet.size > 0) {
      return { initSeed: reverse(slotState), metLevels: [...levelsSet].sort((a, b) => a - b) };
    }
  }
  return null;
}

/* ── Main search loop ────────────────────────────────── */
self.onmessage = function (e) {
  const {
    startSeed, endSeed,
    nature, ability,
    genderThreshold, targetGender,
    tid, sid, wantShiny,
    minIVs, maxIVs, methods, maxResults,
    targetSpecies, slotTables, gameId
  } = e.data;

  /* Build species-slot lookup */
  const doValidation = !!(slotTables && targetSpecies);
  const speciesSlots = doValidation ? buildSpeciesSlotMap(slotTables, targetSpecies) : null;
  const hasAnySlots  = speciesSlots && Object.keys(speciesSlots).length > 0;
  const canSync      = (gameId === 3);     // Synchronize lead: Emerald only

  const results = [];
  const cap = maxResults || 500;
  const TICK = 0x800000;
  const tickMask = TICK - 1;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs ? maxIVs[0] : 31, xAtk = maxIVs ? maxIVs[1] : 31, xDef = maxIVs ? maxIVs[2] : 31,
        xSpA = maxIVs ? maxIVs[3] : 31, xSpD = maxIVs ? maxIVs[4] : 31, xSpe = maxIVs ? maxIVs[5] : 31;
  const m1 = methods[0], m2 = methods[1], m4 = methods[2];
  const trainerXor = (tid ^ sid) >>> 0;

  for (let seed = startSeed; seed < endSeed; seed++) {
    if (((seed - startSeed) & tickMask) === 0 && seed > startSeed) {
      self.postMessage({ type: 'progress', done: seed - startSeed, total: endSeed - startSeed });
      if (results.length >= cap) break;
    }

    let s = seed >>> 0;

    /* Two advances → PID */
    s = advance(s);
    const pidLow = s >>> 16;
    const pidLowState = s;
    s = advance(s);
    const pidHigh = s >>> 16;
    const pid = ((pidHigh << 16) | pidLow) >>> 0;

    /* ── Fast filter cascade ─────────────────────────── */
    if (pid % 25 !== nature)  continue;
    if (ability >= 0 && (pid & 1) !== ability) continue;

    if (targetGender < 2) {
      const gb = pid & 0xFF;
      if (targetGender === 0 && gb >= genderThreshold) continue;
      if (targetGender === 1 && gb < genderThreshold)  continue;
    }

    const xv = (pidHigh ^ pidLow) ^ trainerXor;
    if (wantShiny  && xv >= 8) continue;
    if (!wantShiny && xv <  8) continue;

    /* ── IV check per method (before encounter validation) ── */
    const s3 = advance(s);
    const s4 = advance(s3);
    const s5 = advance(s4);
    const r3 = s3 >>> 16, r4 = s4 >>> 16, r5 = s5 >>> 16;

    let h1 = null, h2 = null, h4 = null;

    /* Method H1  iv1=r3  iv2=r4 */
    if (m1) {
      const hp=r3&0x1F; if(hp>=mHp&&hp<=xHp){
      const atk=(r3>>5)&0x1F; if(atk>=mAtk&&atk<=xAtk){
      const def=(r3>>10)&0x1F; if(def>=mDef&&def<=xDef){
      const spe=r4&0x1F; if(spe>=mSpe&&spe<=xSpe){
      const spa=(r4>>5)&0x1F; if(spa>=mSpA&&spa<=xSpA){
      const spd=(r4>>10)&0x1F; if(spd>=mSpD&&spd<=xSpD){
        h1={hp,atk,def,spa,spd,spe};
      }}}}}}
    }

    /* Method H2  iv1=r4  iv2=r5 */
    if (m2) {
      const hp=r4&0x1F; if(hp>=mHp&&hp<=xHp){
      const atk=(r4>>5)&0x1F; if(atk>=mAtk&&atk<=xAtk){
      const def=(r4>>10)&0x1F; if(def>=mDef&&def<=xDef){
      const spe=r5&0x1F; if(spe>=mSpe&&spe<=xSpe){
      const spa=(r5>>5)&0x1F; if(spa>=mSpA&&spa<=xSpA){
      const spd=(r5>>10)&0x1F; if(spd>=mSpD&&spd<=xSpD){
        h2={hp,atk,def,spa,spd,spe};
      }}}}}}
    }

    /* Method H4  iv1=r3  iv2=r5 */
    if (m4) {
      const hp=r3&0x1F; if(hp>=mHp&&hp<=xHp){
      const atk=(r3>>5)&0x1F; if(atk>=mAtk&&atk<=xAtk){
      const def=(r3>>10)&0x1F; if(def>=mDef&&def<=xDef){
      const spe=r5&0x1F; if(spe>=mSpe&&spe<=xSpe){
      const spa=(r5>>5)&0x1F; if(spa>=mSpA&&spa<=xSpA){
      const spd=(r5>>10)&0x1F; if(spd>=mSpD&&spd<=xSpD){
        h4={hp,atk,def,spa,spd,spe};
      }}}}}}
    }

    if (!h1 && !h2 && !h4) continue;

    /* ── Encounter-chain validation (only for IV-matching seeds) ── */
    let initSeed = null, metLevels = null;
    if (doValidation && hasAnySlots) {
      const chain = validateEncounterChain(pidLowState, nature, speciesSlots, canSync, slotTables, targetSpecies);
      if (chain === null) continue;
      initSeed  = chain.initSeed;
      metLevels = chain.metLevels;
    }

    /* ── Push validated results ──────────────────────── */
    if (h1) results.push({seed:seed>>>0,pid,method:'H1',ivs:h1,hpt:hpType(h1),hpp:hpPower(h1),initSeed,metLevels});
    if (h2) results.push({seed:seed>>>0,pid,method:'H2',ivs:h2,hpt:hpType(h2),hpp:hpPower(h2),initSeed,metLevels});
    if (h4) results.push({seed:seed>>>0,pid,method:'H4',ivs:h4,hpt:hpType(h4),hpp:hpPower(h4),initSeed,metLevels});
  }

  self.postMessage({ type: 'done', results });
};
