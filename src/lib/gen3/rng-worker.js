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
 *                 methods:[3 bools], pidParityPreference, maxResults, targetSpecies,
 *                 slotTables: { l:[[...]], w:[[...]], swarm_fish_50:[[...]], ... } | null }
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

const LCRNG_JUMP_MULT = [
  0x41C64E6D,0xC2A29A69,0xEE067F11,0xCFDDDF21,0x5F748241,0x8B2E1481,0x76006901,0x1711D201,
  0xBE67A401,0xDDDF4801,0x3FFE9001,0x90FD2001,0x65FA4001,0xDBF48001,0xF7E90001,0xEFD20001,
  0xDFA40001,0xBF480001,0x7E900001,0xFD200001,0xFA400001,0xF4800001,0xE9000001,0xD2000001,
  0xA4000001,0x48000001,0x90000001,0x20000001,0x40000001,0x80000001,0x00000001,0x00000001,
];
const LCRNG_JUMP_ADD = [
  0x00006073,0xE97E7B6A,0x31B0DDE4,0x67DBB608,0xCBA72510,0x1D29AE20,0xBA84EC40,0x79F01880,
  0x08793100,0x6B566200,0x803CC400,0xA6B98800,0xE6731000,0x30E62000,0xF1CC4000,0x23988000,
  0x47310000,0x8E620000,0x1CC40000,0x39880000,0x73100000,0xE6200000,0xCC400000,0x98800000,
  0x31000000,0x62000000,0xC4000000,0x88000000,0x10000000,0x20000000,0x40000000,0x80000000,
];

function getLcrngDistance(startSeed, endSeed) {
  let seed = startSeed >>> 0;
  const end = endSeed >>> 0;
  let distance = 0;
  let bit = 1;
  for (let i = 0; i < 32 && seed !== end; i++) {
    if (((seed ^ end) & bit) !== 0) {
      seed = (Math.imul(seed, LCRNG_JUMP_MULT[i]) + LCRNG_JUMP_ADD[i]) >>> 0;
      distance = (distance | bit) >>> 0;
    }
    bit = (bit << 1) >>> 0;
  }
  return distance >>> 0;
}

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

function getSlotIndexForType(type, rand100) {
  if (type === 'swarm_fish_50') {
    return rand100 < 50 ? 0 : -1;
  }

  const cum = SLOT_CUM[type];
  if (!cum) return -1;

  for (let i = 0; i < cum.length; i++) {
    if (rand100 < cum[i]) return i;
  }

  return -1;
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
 * Unown-specific encounter-chain backward validation for FRLG.
 *
 * Unown uses a fundamentally different RNG chain than regular wild Pokémon:
 *   - PID byte order is reversed: pid = (a << 16) | b  (first call HIGH)
 *   - No nature rejection loop — the loop rejects on FORM instead
 *   - No nature call consumed between Level and PID loop
 *   - Chain: ESV → Level(skip) → [form-rejected PID pairs] → accepted A → B → IVs
 *   - No Synchronize (FR/LG only)
 *
 * @param {number} pidAState - RNG state of the first accepted PID call (a)
 * @param {number} unownForm - target Unown form (0–27)
 * @param {Object} speciesSlots - slot index lookup from buildSpeciesSlotMap
 * @param {Object} allSlotTables - raw slotTables for level computation
 * @param {number} targetSpecies - species ID (201)
 * @returns {{initSeed:number, metLevels:number[]}|null}
 */
function validateEncounterChainUnown(pidAState, unownForm, speciesSlots, allSlotTables, targetSpecies) {
  let curState = pidAState;

  for (let K = 0; K <= MAX_REJECTIONS; K++) {
    if (K > 0) {
      // Step back 2 states (one more rejected PID pair: a, b)
      curState = reverse(reverse(curState));

      // Verify the rejected PID at curState had the WRONG form
      // (if it had the right form, the game would have accepted it — blocking)
      const rejA = curState >>> 16;
      const rejB = advance(curState) >>> 16;
      const rejPid = ((rejA << 16) | rejB) >>> 0;
      if (getUnownForm(rejPid) === unownForm) break; // blocking PID
    }

    // ESV is 2 states before curState: ESV → Level → curState(PID_a)
    const slotState = reverse(reverse(curState));
    const result = checkSlotWithLevel(slotState, speciesSlots, allSlotTables, targetSpecies);
    if (result !== null) return result;
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
    const si = getSlotIndexForType(type, slotRand);
    if (si < 0) continue;
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

/* ── Priority-buffer helper ────────────────────────────── */

function makePriorityBuffer(cap, preferEarlierRngFrames = false) {
  const buf = [];
  let worstTotal = -1;

  function getPriority(entry, total) {
    if (!preferEarlierRngFrames) return total;
    // IV total remains the primary rank. For equal totals, keep the result
    // requiring fewer advances from the user's selected starting state.
    return (total * 0x100000000) + (0xFFFFFFFF - entry.rngAdvances);
  }

  function tryAdd(entry, total) {
    if (buf.length >= cap && (total < worstTotal || (!preferEarlierRngFrames && total === worstTotal))) return;
    entry._t = total;
    entry._p = getPriority(entry, total);
    buf.push(entry);
    if (buf.length > cap) {
      let mi = 0, mv = buf[0]._p;
      for (let j = 1; j < buf.length; j++) {
        if (buf[j]._p < mv) { mv = buf[j]._p; mi = j; }
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

function getRngWindow(params) {
  if (!Number.isInteger(params.rngStartSeed)) return null;
  if (!Number.isFinite(params.rngMaxAdvances)) return null;
  return {
    startSeed: params.rngStartSeed >>> 0,
    maxAdvances: Math.max(0, Math.min(0xFFFFFFFF, Number(params.rngMaxAdvances))),
  };
}

function tryAddRngResult(pb, entry, total, rngWindow) {
  if (rngWindow) {
    const hasEncounterSeed = entry.initSeed !== null && entry.initSeed !== undefined &&
      Number.isFinite(Number(entry.initSeed));
    const targetSeed = hasEncounterSeed ? entry.initSeed : entry.seed;
    const advances = getLcrngDistance(rngWindow.startSeed, Number(targetSeed) >>> 0);
    if (advances > rngWindow.maxAdvances) return;
    entry.rngAdvances = advances;
    entry.rngStartSeed = rngWindow.startSeed;
  }
  pb.tryAdd(entry, total);
}

/* ── PID + shiny helpers ──────────────────────────────── */

function matchesPidParity(pid, preference) {
  if (preference === 'even') return (pid & 1) === 0;
  if (preference === 'odd') return (pid & 1) === 1;
  return true;
}

function matchesNature(pid, nature) {
  return Number(nature) < 0 || (pid >>> 0) % 25 === Number(nature);
}

function checkPid(pid, nature, ability, genderThreshold, targetGender, trainerXor, wantShiny, unownForm, pidParityPreference) {
  if (!matchesNature(pid, nature)) return false;
  if (ability >= 0 && (pid & 1) !== ability) return false;
  if (!matchesPidParity(pid, pidParityPreference)) return false;
  if (targetGender < 2) {
    const gb = pid & 0xFF;
    if (targetGender === 0 && gb >= genderThreshold) return false;
    if (targetGender === 1 && gb < genderThreshold) return false;
  }
  const xv = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ trainerXor;
  if (wantShiny && xv >= 8) return false;
  // Unown form filter
  if (unownForm >= 0) {
    const form = (((pid & 0x3000000) >> 18) |
                  ((pid & 0x30000)   >> 12) |
                  ((pid & 0x300)     >>  6) |
                   (pid & 0x3)) % 28;
    if (form !== unownForm) return false;
  }
  return true;
}

/* ── Unown form from PID ──────────────────────────────── */
function getUnownForm(pid) {
  return (((pid & 0x3000000) >> 18) |
          ((pid & 0x30000)   >> 12) |
          ((pid & 0x300)     >>  6) |
           (pid & 0x3)) % 28;
}

/* ══════════════════════════════════════════════════════════
 *  FAST PATH — IV-recovery search (≤ 4 096 iv1 combos)
 *
 *  Instead of brute-forcing 2³² seeds we enumerate the
 *  small set of valid HP/ATK/DEF triplets, recover the
 *  32-bit RNG state that produced them, verify the next
 *  RNG call matches the SPA/SPD/SPE range, then walk
 *  backwards to the PID.
 * ══════════════════════════════════════════════════════════ */

function fastSearch(params, isStopped) {
  const {
    nature, ability, genderThreshold, targetGender,
    tid, sid, wantShiny,
    minIVs, maxIVs, methods, maxResults,
    targetSpecies, slotTables, gameId,
    pidParityPreference = 'any',
    unownForm: rawUnownForm
  } = params;
  const unownForm = (rawUnownForm != null && rawUnownForm >= 0) ? rawUnownForm : -1;
  const isUnown = unownForm >= 0;

  const doValidation = !!(slotTables && targetSpecies);
  const speciesSlots = doValidation ? buildSpeciesSlotMap(slotTables, targetSpecies) : null;
  const hasAnySlots  = speciesSlots && Object.keys(speciesSlots).length > 0;
  const canSync      = (gameId === 3);

  const rngWindow = getRngWindow(params);
  const pb = makePriorityBuffer(maxResults || 50, Boolean(rngWindow));
  const m1 = methods[0], m2 = methods[1], m4 = methods[2];
  const trainerXor = (tid ^ sid) >>> 0;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs[0], xAtk = maxIVs[1], xDef = maxIVs[2],
        xSpA = maxIVs[3], xSpD = maxIVs[4], xSpe = maxIVs[5];

  const totalCombos = (xHp - mHp + 1) * (xAtk - mAtk + 1) * (xDef - mDef + 1);
  let combo = 0;
  const progressTick = Math.max(1, Math.floor(totalCombos / 50));

  for (let hp = mHp; hp <= xHp; hp++) {
    for (let atk = mAtk; atk <= xAtk; atk++) {
      for (let def = mDef; def <= xDef; def++) {
        combo++;
        if (combo % progressTick === 0) {
          self.postMessage({ type: 'progress', done: combo, total: totalCombos });
          if (pb.buf.length > 0) self.postMessage({ type: 'snapshot', results: pb.buf });
          if (isStopped()) { self.postMessage({ type: 'done', results: pb.buf }); return; }
        }

        const low15 = hp | (atk << 5) | (def << 10);
        const ivPartial = hp + atk + def;

        for (let bit15 = 0; bit15 <= 1; bit15++) {
          const iv1Hi = ((low15 | (bit15 << 15)) << 16) >>> 0;

          for (let x = 0; x < 65536; x++) {
            const seedIV1 = (iv1Hi | x) >>> 0;

            /* ── H1 & H4 share iv1 at position seed3 ─────── */
            if (m1 || m4) {
              let h1spe = -1, h1spa = -1, h1spd = -1;
              let h4spe = -1, h4spa = -1, h4spd = -1;
              let anyHit = false;

              if (m1) {
                const out = advance(seedIV1) >>> 16;
                const spe = out & 0x1F;
                if (spe >= mSpe && spe <= xSpe) {
                  const spa = (out >> 5) & 0x1F;
                  if (spa >= mSpA && spa <= xSpA) {
                    const spd = (out >> 10) & 0x1F;
                    if (spd >= mSpD && spd <= xSpD) {
                      h1spe = spe; h1spa = spa; h1spd = spd; anyHit = true;
                    }
                  }
                }
              }

              if (m4) {
                const out = advance(advance(seedIV1)) >>> 16;
                const spe = out & 0x1F;
                if (spe >= mSpe && spe <= xSpe) {
                  const spa = (out >> 5) & 0x1F;
                  if (spa >= mSpA && spa <= xSpA) {
                    const spd = (out >> 10) & 0x1F;
                    if (spd >= mSpD && spd <= xSpD) {
                      h4spe = spe; h4spa = spa; h4spd = spd; anyHit = true;
                    }
                  }
                }
              }

              if (anyHit) {
                // Both H1/H4 produce the same PID from this seedIV1
                const s2 = reverse(seedIV1);
                const pidHigh = s2 >>> 16;
                const s1 = reverse(s2);
                const pidLow = s1 >>> 16;
                // Unown: pid = (a << 16) | b where a=first call, b=second call
                // Regular: pid = (b << 16) | a  (pidHigh=b, pidLow=a)
                const pid = isUnown
                  ? ((pidLow << 16) | pidHigh) >>> 0
                  : ((pidHigh << 16) | pidLow) >>> 0;

                if (checkPid(pid, nature, ability, genderThreshold, targetGender, trainerXor, wantShiny, unownForm, pidParityPreference)) {
                  const seed0 = reverse(s1);
                  const candidateNature = (pid >>> 0) % 25;

                  let initSeed = null, metLevels = null;
                  let chainOK = true;
                  if (doValidation && hasAnySlots) {
                    const chain = isUnown
                      ? validateEncounterChainUnown(s1, unownForm, speciesSlots, slotTables, targetSpecies)
                      : validateEncounterChain(s1, candidateNature, speciesSlots, canSync, slotTables, targetSpecies);
                    if (!chain) { chainOK = false; }
                    else { initSeed = chain.initSeed; metLevels = chain.metLevels; }
                  }

                  if (chainOK) {
                    if (h1spe >= 0) {
                      const t = ivPartial + h1spe + h1spa + h1spd;
                      const ivs = { hp, atk, def, spa: h1spa, spd: h1spd, spe: h1spe };
                      tryAddRngResult(pb, { seed: seed0, pid, method: 'H1', ivs, hpt: hpType(ivs), hpp: hpPower(ivs), initSeed, metLevels }, t, rngWindow);
                    }
                    if (h4spe >= 0) {
                      const t = ivPartial + h4spe + h4spa + h4spd;
                      const ivs = { hp, atk, def, spa: h4spa, spd: h4spd, spe: h4spe };
                      tryAddRngResult(pb, { seed: seed0, pid, method: 'H4', ivs, hpt: hpType(ivs), hpp: hpPower(ivs), initSeed, metLevels }, t, rngWindow);
                    }
                  }
                }
              }
            }

            /* ── H2: iv1 at position seed4 ───────────────── */
            if (m2) {
              const out = advance(seedIV1) >>> 16;
              const spe = out & 0x1F;
              if (spe < mSpe || spe > xSpe) continue; // only skips H2 for this x
              const spa = (out >> 5) & 0x1F;
              if (spa < mSpA || spa > xSpA) continue;
              const spd = (out >> 10) & 0x1F;
              if (spd < mSpD || spd > xSpD) continue;

              // Walk back: seedIV1=seed4 → seed3(skip) → seed2(pidHi) → seed1(pidLo)
              const s3 = reverse(seedIV1);
              const s2 = reverse(s3);
              const pidHigh = s2 >>> 16;
              const s1 = reverse(s2);
              const pidLow = s1 >>> 16;
              const pid = isUnown
                ? ((pidLow << 16) | pidHigh) >>> 0
                : ((pidHigh << 16) | pidLow) >>> 0;

              if (!checkPid(pid, nature, ability, genderThreshold, targetGender, trainerXor, wantShiny, unownForm, pidParityPreference)) continue;

              const seed0 = reverse(s1);
              const candidateNature = (pid >>> 0) % 25;
              let initSeed = null, metLevels = null;
              if (doValidation && hasAnySlots) {
                const chain = isUnown
                  ? validateEncounterChainUnown(s1, unownForm, speciesSlots, slotTables, targetSpecies)
                  : validateEncounterChain(s1, candidateNature, speciesSlots, canSync, slotTables, targetSpecies);
                if (!chain) continue;
                initSeed = chain.initSeed;
                metLevels = chain.metLevels;
              }

              const t = ivPartial + spe + spa + spd;
              const ivs = { hp, atk, def, spa, spd, spe };
              tryAddRngResult(pb, { seed: seed0, pid, method: 'H2', ivs, hpt: hpType(ivs), hpp: hpPower(ivs), initSeed, metLevels }, t, rngWindow);
            }
          }
        }
      }
    }
  }

  self.postMessage({ type: 'done', results: pb.buf });
}

/* ══════════════════════════════════════════════════════════
 *  BRUTE-FORCE PATH — full 2³² seed scan
 * ══════════════════════════════════════════════════════════ */

function bruteForceSearch(params, isStopped) {
  const {
    startSeed, endSeed,
    nature, ability,
    genderThreshold, targetGender,
    tid, sid, wantShiny,
    minIVs, maxIVs, methods, maxResults,
    targetSpecies, slotTables, gameId,
    pidParityPreference = 'any',
    unownForm: rawUnownForm
  } = params;
  const unownForm = (rawUnownForm != null && rawUnownForm >= 0) ? rawUnownForm : -1;
  const isUnown = unownForm >= 0;

  const doValidation = !!(slotTables && targetSpecies);
  const speciesSlots = doValidation ? buildSpeciesSlotMap(slotTables, targetSpecies) : null;
  const hasAnySlots  = speciesSlots && Object.keys(speciesSlots).length > 0;
  const canSync      = (gameId === 3);

  const rngWindow = getRngWindow(params);
  const pb = makePriorityBuffer(maxResults || 50, Boolean(rngWindow));
  const TICK = 0x400000;
  const tickMask = TICK - 1;
  const trainerXor = (tid ^ sid) >>> 0;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs ? maxIVs[0] : 31, xAtk = maxIVs ? maxIVs[1] : 31, xDef = maxIVs ? maxIVs[2] : 31,
        xSpA = maxIVs ? maxIVs[3] : 31, xSpD = maxIVs ? maxIVs[4] : 31, xSpe = maxIVs ? maxIVs[5] : 31;
  const m1 = methods[0], m2 = methods[1], m4 = methods[2];

  for (let seed = startSeed; seed < endSeed; seed++) {
    if (((seed - startSeed) & tickMask) === 0 && seed > startSeed) {
      self.postMessage({ type: 'progress', done: seed - startSeed, total: endSeed - startSeed });
      if (pb.buf.length > 0) self.postMessage({ type: 'snapshot', results: pb.buf });
      if (isStopped()) break;
    }

    let s = seed >>> 0;
    s = advance(s);
    const pidFirst = s >>> 16;     // first RNG call (a)
    const pidFirstState = s;
    s = advance(s);
    const pidSecond = s >>> 16;    // second RNG call (b)
    // Unown: pid = (a << 16) | b  (first call HIGH)
    // Regular: pid = (b << 16) | a  (second call HIGH)
    const pid = isUnown
      ? ((pidFirst << 16) | pidSecond) >>> 0
      : ((pidSecond << 16) | pidFirst) >>> 0;

    if (!matchesNature(pid, nature)) continue;
    if (ability >= 0 && (pid & 1) !== ability) continue;
    if (!matchesPidParity(pid, pidParityPreference)) continue;
    if (targetGender < 2) {
      const gb = pid & 0xFF;
      if (targetGender === 0 && gb >= genderThreshold) continue;
      if (targetGender === 1 && gb < genderThreshold)  continue;
    }
    const xv = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ trainerXor;
    if (wantShiny  && xv >= 8) continue;

    // Unown form filter
    if (unownForm >= 0) {
      if (getUnownForm(pid) !== unownForm) continue;
    }

    const s3 = advance(s);
    const s4 = advance(s3);
    const s5 = advance(s4);
    const r3 = s3 >>> 16, r4 = s4 >>> 16, r5 = s5 >>> 16;

    let h1 = null, h2 = null, h4 = null;

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

    const t1 = h1 ? (h1.hp + h1.atk + h1.def + h1.spa + h1.spd + h1.spe) : -1;
    const t2 = h2 ? (h2.hp + h2.atk + h2.def + h2.spa + h2.spd + h2.spe) : -1;
    const t4 = h4 ? (h4.hp + h4.atk + h4.def + h4.spa + h4.spd + h4.spe) : -1;
    const bestMethodTotal = Math.max(t1, t2, t4);
    if (pb.full() && bestMethodTotal < pb.getWorst()) continue;

    let initSeed = null, metLevels = null;
    if (doValidation && hasAnySlots) {
      const candidateNature = (pid >>> 0) % 25;
      const chain = isUnown
        ? validateEncounterChainUnown(pidFirstState, unownForm, speciesSlots, slotTables, targetSpecies)
        : validateEncounterChain(pidFirstState, candidateNature, speciesSlots, canSync, slotTables, targetSpecies);
      if (chain === null) continue;
      initSeed  = chain.initSeed;
      metLevels = chain.metLevels;
    }

    if (h1) tryAddRngResult(pb, {seed:seed>>>0,pid,method:'H1',ivs:h1,hpt:hpType(h1),hpp:hpPower(h1),initSeed,metLevels}, t1, rngWindow);
    if (h2) tryAddRngResult(pb, {seed:seed>>>0,pid,method:'H2',ivs:h2,hpt:hpType(h2),hpp:hpPower(h2),initSeed,metLevels}, t2, rngWindow);
    if (h4) tryAddRngResult(pb, {seed:seed>>>0,pid,method:'H4',ivs:h4,hpt:hpType(h4),hpp:hpPower(h4),initSeed,metLevels}, t4, rngWindow);
  }

  self.postMessage({ type: 'done', results: pb.buf });
}

/* ── Entry point ─────────────────────────────────────── */
self.onmessage = function (e) {
  let stopped = false;
  self.onmessage = function () { stopped = true; };
  const isStopped = () => stopped;

  // Decide: fast IV-recovery or brute-force
  const minIVs = e.data.minIVs;
  const maxIVs = e.data.maxIVs || [31,31,31,31,31,31];
  const iv1Count = (maxIVs[0] - minIVs[0] + 1) *
                   (maxIVs[1] - minIVs[1] + 1) *
                   (maxIVs[2] - minIVs[2] + 1);

  if (iv1Count <= 4096) {
    fastSearch(e.data, isStopped);
  } else {
    bruteForceSearch(e.data, isStopped);
  }
};
