/**
 * CXD PID / IV searcher — Web Worker
 *
 * Generates shadow Pokémon using the CXD PRNG pipeline, matching PKHeX's
 * MethodCXD 1:1 — including 15-bit IVs, anti-shiny PID rerolling, and
 * team-lock reachability validation.
 *
 * CXD Method sequence from origin seed:
 *   advance → IV1 ((state>>16) & 0x7FFF, 15-bit)
 *   advance → IV2 (15-bit)
 *   advance → ability ((state>>16) & 1)
 *   advance → PID_hi (state>>16, 16-bit)
 *   advance → PID_lo (state>>16, 16-bit)
 *   If noShiny and PID is shiny for trainer, re-consume PID_hi+PID_lo
 *   until non-shiny.
 *
 * XD shadows: noShiny ALWAYS true (no legal shiny XD shadows).
 * Colosseum shadows can be shiny for the player; their NPC team generation
 * still performs its own trainer-specific anti-shiny handling in lock checks.
 * Colosseum e-Reader shadows use a separate fixed-IV PID-only path below.
 *
 * Message IN  → { startSeed, endSeed, nature, ability, genderThreshold,
 *                 targetGender, tid, sid, wantShiny, minIVs:[6], maxIVs:[6],
 *                 maxResults, noShiny, teamLocks, tsv }
 *
 * Message OUT → { type:'progress', done, total }
 *            → { type:'done', results:[…] }
 */

/* ── CXD PRNG ────────────────────────────────────────── */
const CXD_MULT = 0x343FD;
const CXD_ADD  = 0x269EC3;
function cxdNext(s) { return (Math.imul(s, CXD_MULT) + CXD_ADD) >>> 0; }

/* ── CXD reverse PRNG ─────────────────────────────────── */
const CXD_INV  = 0xB9B33155;
const CXD_RADD = 0xA170F641;
function cxdPrev(s) { return (Math.imul(s, CXD_INV) + CXD_RADD) >>> 0; }

// PKHeX's Colosseum/XD trainer-ID verifier does more than check that TID and
// SID are consecutive XDRNG outputs. The seed before those outputs must also
// be reachable from the player-name screen after the game's 1,000-frame jump.
function cxdPrev1000(s) {
  return (Math.imul(s, 0x251CC8E1) + 0x94750758) >>> 0;
}

function isValidNameScreenEndSeed(inputSeed) {
  const threshold = 0x1999;
  const pending = [inputSeed >>> 0];
  const visited = new Set();

  // Iterative form of PKHeX MethodCXD.IsValidNameScreenEndSeed. Each branch
  // walks farther backwards, so the set is only a cycle guard for malformed or
  // adversarial inputs and does not change normal results.
  while (pending.length) {
    const input = pending.pop() >>> 0;
    if (visited.has(input)) continue;
    visited.add(input);

    let state = input;
    const p1 = (state >>> 16) > threshold;
    state = cxdPrev(state);
    const p2 = (state >>> 16) > threshold;
    state = cxdPrev(state);
    const p3 = (state >>> 16) > threshold;
    state = cxdPrev(state);
    const p4 = (state >>> 16) > threshold;
    if (p1 && p2 && p3 && p4) return true;

    state = cxdPrev(state);
    if ((state >>> 16) <= threshold) pending.push(cxdPrev(state));
    state = cxdPrev(state);
    if ((state >>> 16) <= threshold && p1) pending.push(cxdPrev(state));
    state = cxdPrev(state);
    if ((state >>> 16) <= threshold && p1 && p2) pending.push(cxdPrev(state));
    state = cxdPrev(state);
    if ((state >>> 16) <= threshold && p1 && p2 && p3) pending.push(cxdPrev(state));
  }
  return false;
}

function isValidStarterTrainerOrigin(origin) {
  return isValidNameScreenEndSeed(cxdPrev1000(origin));
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

/* ── Priority-buffer helper ───────────────────────────── */
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

/* ── Shiny check (Gen 3) ─────────────────────────────── */
function isShiny3(trainerXor, pid) {
  return ((pid >>> 16) ^ (pid & 0xFFFF) ^ trainerXor) < 8;
}

/* ── CXD PID generation with anti-shiny rerolling ─────── */
/**
 * From the ability state, generate PID with anti-shiny loop.
 * Matches PKHeX MethodCXD.GetPID exactly.
 *
 * @param {number} sAbility – RNG state AFTER ability call
 * @param {number} trainerXor – TID ^ SID
 * @param {boolean} noShiny – if true, reroll shiny PIDs
 * @returns {{ pid: number, sAfter: number }}
 */
function generateCXDPid(sAbility, trainerXor, noShiny) {
  let s = sAbility;
  while (true) {
    s = cxdNext(s);
    const pidHi = s >>> 16;
    s = cxdNext(s);
    const pidLo = s >>> 16;
    const pid = ((pidHi << 16) | pidLo) >>> 0;
    if (!noShiny || !isShiny3(trainerXor, pid))
      return { pid, sAfter: s };
  }
}

/* ── PID filter helper ────────────────────────────────── */
function checkPid(pid, nature, ability, genderThreshold, targetGender, trainerXor, wantShiny, abilityBit) {
  if (ability >= 0 && abilityBit !== ability) return false;
  if (pid % 25 !== nature) return false;
  if (targetGender < 2) {
    const gb = pid & 0xFF;
    if (targetGender === 0 && gb >= genderThreshold) return false;
    if (targetGender === 1 && gb < genderThreshold)  return false;
  }
  const xv = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ trainerXor;
  if (wantShiny  && xv >= 8) return false;
  return true;
}

function previousState(seed, count) {
  let state = seed >>> 0;
  for (let i = 0; i < count; i++) state = cxdPrev(state);
  return state;
}

function getRegularPidAfter(state) {
  let s = cxdNext(state);
  const high = s >>> 16;
  s = cxdNext(s);
  return { pid: ((high << 16) | (s >>> 16)) >>> 0, sAfter: s };
}

function generateColoStarterPid(abilityState, trainerXor) {
  let state = abilityState >>> 0;
  while (true) {
    const result = getRegularPidAfter(state);
    state = result.sAfter;
    const isMaleEevee = (result.pid & 0xFF) >= 31;
    if (isMaleEevee && !isShiny3(trainerXor, result.pid)) return result;
  }
}

function getStarterIds(origin) {
  let state = cxdNext(origin);
  const tid = state >>> 16;
  state = cxdNext(state);
  const sid = state >>> 16;
  return { tid, sid, trainerXor: (tid ^ sid) >>> 0 };
}

function getStarterFrame(seedIV1, params) {
  const iv2State = cxdNext(seedIV1);
  const abilityState = cxdNext(iv2State);
  const abilityBit = (abilityState >>> 16) & 1;

  if (params.pidType === 'CXD_XD_STARTER') {
    const origin = previousState(seedIV1, 5);
    if (!isValidStarterTrainerOrigin(origin)) return null;
    const ids = getStarterIds(origin);
    const { pid } = getRegularPidAfter(abilityState);
    return { origin, pid, abilityBit, ...ids };
  }

  if (Number(params.starterIndex) === 0) {
    const origin = previousState(seedIV1, 5);
    if (!isValidStarterTrainerOrigin(origin)) return null;
    const ids = getStarterIds(origin);
    const { pid } = generateColoStarterPid(abilityState, ids.trainerXor);
    return { origin, pid, abilityBit, ...ids };
  }

  // Espeon follows a variable-length Umbreon PID reroll loop. The two calls
  // directly before Espeon's fake PID are Umbreon's final (valid) PID.
  const finalLowState = previousState(seedIV1, 3);
  let candidateLowState = finalLowState;
  for (let rerolls = 0; rerolls < 64; rerolls++) {
    const candidateHighState = cxdPrev(candidateLowState);
    const priorAbilityState = cxdPrev(candidateHighState);
    const priorIV1State = previousState(priorAbilityState, 2);
    const origin = previousState(priorIV1State, 5);
    if (!isValidStarterTrainerOrigin(origin)) {
      candidateLowState = cxdPrev(candidateHighState);
      continue;
    }
    const ids = getStarterIds(origin);

    let attemptLowState = candidateLowState;
    let validSequence = true;
    for (let attempt = rerolls; attempt >= 0; attempt--) {
      const attemptHighState = cxdPrev(attemptLowState);
      const priorPid = (((attemptHighState >>> 16) << 16) | (attemptLowState >>> 16)) >>> 0;
      const validPrior = (priorPid & 0xFF) >= 31 && !isShiny3(ids.trainerXor, priorPid);
      if ((attempt === 0) !== validPrior) { validSequence = false; break; }
      attemptLowState = cxdNext(cxdNext(attemptLowState));
    }
    if (validSequence) {
      const { pid } = generateColoStarterPid(abilityState, ids.trainerXor);
      return { origin, pid, abilityBit, ...ids };
    }
    candidateLowState = cxdPrev(candidateHighState);
  }
  return null;
}

function getPokeSpotSlot(esv) {
  return esv < 50 ? 0 : esv < 85 ? 1 : 2;
}

function isValidPokeSpotActivation(slot, seed) {
  if (getPokeSpotSlot((seed >>> 16) % 100) !== Number(slot)) return false;
  let state = cxdPrev(seed);
  const first = state >>> 16;
  if (first % 3 === 0) return true;
  if (first % 100 < 10) return false;
  state = cxdPrev(state);
  return (state >>> 16) % 3 === 0;
}

function isValidPokeSpotAnimation(seed) {
  let state = cxdPrev(seed);
  let animation = (state >>> 16) % 10;
  if (animation < 5 && animation !== 3) return true;
  state = cxdPrev(state);
  animation = (state >>> 16) % 10;
  if (animation >= 5 && animation !== 8) return true;
  state = previousState(state, 3);
  return ((state >>> 16) % 10) === 8;
}

function findPokeSpotPid(params, isStopped) {
  const trainerXor = (params.tid ^ params.sid) >>> 0;
  const start = (Math.imul(params.tid & 0xFFFF, 0x10001) ^ params.sid) >>> 0;
  for (let offset = 0; offset < 0x100000000; offset++) {
    if ((offset & 0xFFFFF) === 0 && isStopped()) return null;
    const seed = (start + offset) >>> 0;
    if (!isValidPokeSpotActivation(params.pokeSpotSlot, seed)) continue;
    const { pid } = getRegularPidAfter(seed);
    if (!checkPid(pid, params.nature, -1, params.genderThreshold, params.targetGender, trainerXor, params.wantShiny, 0)) continue;
    return { seed, pid };
  }
  return null;
}

/* ══════════════════════════════════════════════════════════
 *  TEAM-LOCK VALIDATION  (port of PKHeX TeamLockResult)
 *
 *  Verifies that an origin seed can be reached through valid
 *  NPC team generation for a given shadow encounter.
 *
 *  The origin seed is the state BEFORE the shadow's IV1 call.
 *  In the game, 2 fakePID calls precede the IVs, so the NPC
 *  team member closest to the shadow has its PID ending at
 *  Prev2(origin).
 *
 *  FrameCache[0] = Prev2(origin) >> 16  (PID_lo of closest member)
 *  FrameCache[1] = Prev3(origin) >> 16  (PID_hi of closest member)
 *  FrameCache[n] = Prev(n+2)(origin) >> 16
 *
 *  Locks are ordered first→last in the data arrays.
 *  Validation processes them in REVERSE (last first).
 * ══════════════════════════════════════════════════════════ */

const NOT_FORCED = 0xFFFFFFFF;

/** Check if a PID matches an NPCLock's constraints. */
function matchesLock(lock, pid) {
  if (lock.shadow) return true; // shadow locks always match
  // Gender check
  if (lock.g !== 2) {
    const genderBit = (pid & 0xFF) < lock.r ? 1 : 0; // 1=female, 0=male
    if (lock.g !== genderBit) return false;
  }
  // Nature check
  if (pid % 25 !== lock.n) return false;
  return true;
}

/** FramesConsumed for a lock entry. */
function framesConsumed(lock) {
  return (lock.shadow && lock.seen) ? 5 : 7;
}

/**
 * Lazily-growing frame cache that walks backward from a start seed.
 * Mirrors PKHeX FrameCache exactly.
 */
function makeFrameCache(startSeed) {
  const values = [];
  const seeds  = [];
  let last = startSeed;
  values.push(last >>> 16);
  seeds.push(last);

  function ensure(index) {
    while (index >= values.length) {
      last = cxdPrev(last);
      values.push(last >>> 16);
      seeds.push(last);
    }
  }

  return {
    val(i) { ensure(i); return values[i]; },
    seed(i) { ensure(i); return seeds[i]; }
  };
}

/**
 * Validate one team-lock pattern against an origin seed.
 *
 * @param {number} originSeed  – state before shadow's IV1
 * @param {Array}  locks       – lock entries [first_member, …, closest_to_shadow]
 * @param {number} tsv         – player's trainer shiny value (XD) or NOT_FORCED (Colo)
 * @returns {boolean}
 */
function validatePattern(originSeed, locks, tsv) {
  if (locks.length === 0) return true;

  const cache = makeFrameCache(cxdPrev(cxdPrev(originSeed)));

  // Process locks in reverse (closest to shadow first)
  const stack = [];
  for (let i = locks.length - 1; i >= 0; i--) stack.push(locks[i]);

  let rcsv = NOT_FORCED;

  // teamPids[i] stores the PID found for stack[i]
  const teamPids = [];

  /**
   * Depth-first search: try to find valid PIDs for all locks.
   */
  function findLockSeed(lockIdx, frame, prior) {
    if (lockIdx >= stack.length) {
      return verifyNPC(frame);
    }

    const current = stack[lockIdx];
    const possibles = (prior && !prior.shadow)
      ? getAllLocks(frame, current, prior)
      : getSingleLock(frame, current);

    for (const pf of possibles) {
      teamPids[lockIdx] = pf.pid;
      if (findLockSeed(lockIdx + 1, pf.frameId, current))
        return true;
    }
    teamPids.length = lockIdx;
    return false;
  }

  /**
   * GetSingleLock: PID must match at exactly `ctr`.
   * Also handles anti-shiny reroll detection.
   */
  function getSingleLock(ctr, current) {
    const results = [];
    const pid = ((cache.val(ctr + 1) << 16) | cache.val(ctr)) >>> 0;
    if (!matchesLock(current, pid)) return results;
    results.push({ pid, frameId: ctr + framesConsumed(current) });

    // Check for anti-shiny reroll gaps: the game may have generated a
    // shiny PID at an earlier frame and rerolled, landing at this frame.
    const savedRcsv = rcsv;
    let forcedOT = false;
    let start = ctr + 2;
    for (let iter = 0; iter < 64; iter++, start += 2) {
      const upper = cache.val(start + 1);
      const lower = cache.val(start);
      const sv = (upper ^ lower) >>> 3;
      if (sv === tsv) {
        // Anti-shiny rerolled (player TSV match) — valid position
      } else if (rcsv !== NOT_FORCED) {
        if (sv === rcsv) {
          rcsv = sv;
          forcedOT = true;
          continue;
        }
        if (forcedOT) rcsv = savedRcsv;
        break;
      } else {
        rcsv = sv;
        forcedOT = true;
        continue;
      }
      results.push({ pid, frameId: start + framesConsumed(current) });
    }
    if (forcedOT && results.length <= 1) rcsv = savedRcsv;
    return results;
  }

  /**
   * GetAllLocks: scan multiple frame positions until interrupted by
   * the prior lock's PID.
   */
  function getAllLocks(ctr, current, prior) {
    const results = [];
    const savedRcsv = rcsv;
    let forcedOT = false;
    let pos = ctr;

    for (let iter = 0; iter < 512; iter++, pos += 2) {
      // Check for interrupt from prior lock at expected distance
      const p7 = pos - 7;
      if (p7 > ctr) {
        const upper = cache.val(p7 + 1);
        const lower = cache.val(p7);
        const cid = ((upper << 16) | lower) >>> 0;
        const sv = (upper ^ lower) >>> 3;
        if (sv === tsv) {
          // Shiny for player TSV — interrupt is ignored
        } else if (matchesLock(prior, cid)) {
          if (rcsv !== NOT_FORCED) {
            if (sv !== rcsv) {
              if (forcedOT) rcsv = savedRcsv;
              break;
            }
          } else {
            rcsv = sv;
            forcedOT = true;
          }
        }
      }
      const pid = ((cache.val(pos + 1) << 16) | cache.val(pos)) >>> 0;
      if (matchesLock(current, pid))
        results.push({ pid, frameId: pos + framesConsumed(current) });
    }
    if (forcedOT && results.length === 0) rcsv = savedRcsv;
    return results;
  }

  /**
   * VerifyNPC: check CPU trainer's TID/SID doesn't make any team member shiny.
   */
  function verifyNPC(ctr) {
    const cpuTid = cache.val(ctr + 1);
    const cpuSid = cache.val(ctr);
    const cpuSV = (cpuTid ^ cpuSid) >>> 3;
    if (rcsv !== NOT_FORCED && rcsv !== cpuSV) return false;

    for (let i = 0; i < teamPids.length; i++) {
      const pid = teamPids[i];
      const psv = (((pid >>> 16) ^ (pid & 0xFFFF)) >>> 3);
      if (psv === cpuSV) {
        if (!stack[i].shadow) return false;   // non-shadow can't be shiny for CPU
        if (tsv !== NOT_FORCED) return false;  // XD: no shiny shadows at all
      }
    }
    return true;
  }

  return findLockSeed(0, 0, null);
}

/**
 * Validate an origin seed against all team-lock patterns.
 * Returns true if ANY pattern is valid.
 */
function validateTeamLocks(originSeed, teamPatterns, tsv) {
  if (!teamPatterns || teamPatterns.length === 0) return true;
  for (const pattern of teamPatterns) {
    if (validatePattern(originSeed, pattern, tsv)) return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
 *  FAST PATH — IV-recovery search
 *
 *  Enumerate valid HP/ATK/DEF triplets, recover the 32-bit
 *  CXD state that produced them, verify the next call yields
 *  valid SPE/SPA/SPD, then walk forward to ability & PID
 *  (with anti-shiny rerolling + optional team-lock validation).
 * ══════════════════════════════════════════════════════════ */

function pokeSpotSearch(params, isStopped) {
  const pidFrame = findPokeSpotPid(params, isStopped);
  if (!pidFrame) {
    self.postMessage({ type: 'done', results: [] });
    return;
  }
  const min = params.minIVs || [0, 0, 0, 0, 0, 0];
  const max = params.maxIVs || [31, 31, 31, 31, 31, 31];
  const levelMin = Math.max(1, Number(params.levelMin) || 1);
  const levelMax = Math.max(levelMin, Number(params.levelMax) || levelMin);
  const levelCount = 1 + levelMax - levelMin;
  const maxResults = Math.max(1, Number(params.maxResults) || 50);
  const results = [];

  outer:
  for (let hp = max[0]; hp >= min[0]; hp--) {
    for (let atk = max[1]; atk >= min[1]; atk--) {
      for (let def = max[2]; def >= min[2]; def--) {
        const iv1 = hp | (atk << 5) | (def << 10);
        for (let bit15 = 0; bit15 <= 1; bit15++) {
          const high = ((iv1 | (bit15 << 15)) << 16) >>> 0;
          for (let low = 0; low < 0x10000; low++) {
            const iv1State = (high | low) >>> 0;
            const iv2State = cxdNext(iv1State);
            const iv2 = (iv2State >>> 16) & 0x7FFF;
            const spe = iv2 & 31;
            const spa = (iv2 >>> 5) & 31;
            const spd = (iv2 >>> 10) & 31;
            if (spa < min[3] || spa > max[3] || spd < min[4] || spd > max[4] || spe < min[5] || spe > max[5]) continue;
            const preIV = cxdPrev(iv1State);
            const animationSeed = previousState(preIV, 6);
            if (!isValidPokeSpotAnimation(animationSeed)) continue;
            // Poké Spot level is rolled two frames before the IV seed. It is
            // part of PKHeX's IV correlation and is not always the slot max.
            const levelState = previousState(preIV, 2);
            const metLevel = levelMin + ((levelState >>> 16) % levelCount);
            const abilityState = cxdNext(iv2State);
            const abilityBit = (abilityState >>> 16) & 1;
            if (params.ability >= 0 && abilityBit !== params.ability) continue;
            const ivs = { hp, atk, def, spa, spd, spe };
            results.push({
              seed: pidFrame.seed, ivSeed: animationSeed, pid: pidFrame.pid,
              abilityBit, method: 'POKESPOT', ivs,
              hpt: hpType(ivs), hpp: hpPower(ivs), initSeed: null,
              metLevels: [metLevel],
            });
            if (results.length >= maxResults) break outer;
          }
        }
      }
    }
  }
  self.postMessage({ type: 'done', results });
}

function fastSearch(params, isStopped) {
  const {
    nature, ability, genderThreshold, targetGender,
    tid, sid, wantShiny, minIVs, maxIVs, maxResults,
    noShiny, teamLocks, tsv
  } = params;

  const pb = makePriorityBuffer(maxResults || 50);
  const trainerXor = (tid ^ sid) >>> 0;
  const doLockCheck = teamLocks && teamLocks.length > 0;

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

            /* iv2 check (one CXD advance from iv1) */
            const seedIV2 = cxdNext(seedIV1);
            const out2 = (seedIV2 >>> 16) & 0x7FFF;
            const spe = out2 & 0x1F;
            if (spe < mSpe || spe > xSpe) continue;
            const spa = (out2 >> 5) & 0x1F;
            if (spa < mSpA || spa > xSpA) continue;
            const spd = (out2 >> 10) & 0x1F;
            if (spd < mSpD || spd > xSpD) continue;

            const ivTotal = ivPartial + spe + spa + spd;
            if (pb.full() && ivTotal <= pb.getWorst()) continue;

            /* ability → PID with anti-shiny rerolling */
            const seedAb = cxdNext(seedIV2);
            const abilityBit = (seedAb >>> 16) & 1;
            const isStarter = params.pidType === 'CXD_COLO_STARTER' || params.pidType === 'CXD_XD_STARTER';
            const starter = isStarter ? getStarterFrame(seedIV1, params) : null;
            if (isStarter && !starter) continue;
            const pid = starter ? starter.pid : generateCXDPid(seedAb, trainerXor, noShiny).pid;
            const resultTrainerXor = starter ? starter.trainerXor : trainerXor;

            if (!checkPid(pid, nature, ability, genderThreshold, targetGender, resultTrainerXor, wantShiny, abilityBit)) continue;

            const seed0 = starter ? starter.origin : cxdPrev(seedIV1);

            /* Team-lock validation */
            if (doLockCheck && !validateTeamLocks(seed0, teamLocks, tsv != null ? tsv : NOT_FORCED)) continue;

            const ivs = { hp, atk, def, spa, spd, spe };
            pb.tryAdd({
              seed: seed0,
              pid,
              abilityBit,
              method: params.pidType || 'CXD',
              ivs,
              hpt: hpType(ivs),
              hpp: hpPower(ivs),
              initSeed: null,
              metLevels: null,
              ...(starter ? { tid: starter.tid, sid: starter.sid } : {})
            }, ivTotal);
          }
        }
      }
    }
  }

  self.postMessage({ type: 'done', results: pb.buf });
}

/*
 * Colosseum e-Reader shadows are a special XDRNG case. Their six IVs are
 * fixed to zero and therefore are not correlated to their PID. The PID is
 * still generated by XDRNG and must reverse to the complete, nature/gender-
 * locked NPC team. This mirrors EncounterShadow3Colo.SetPINGA_EReader and
 * EncounterGenerator3GC.GetIsShadowLockValidEReader in PKHeX.
 */
function eReaderSearch(params, isStopped) {
  const {
    startSeed, endSeed,
    nature, genderThreshold, targetGender,
    tid, sid, wantShiny, maxResults, teamLocks
  } = params;

  const results = [];
  const limit = Math.max(1, Number(maxResults) || 50);
  const trainerXor = (tid ^ sid) >>> 0;
  const TICK = 0x100000;
  const tickMask = TICK - 1;
  const ivs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

  for (let origin = startSeed; origin < endSeed; origin++) {
    if (((origin - startSeed) & tickMask) === 0 && origin > startSeed) {
      self.postMessage({ type: 'progress', done: origin - startSeed, total: endSeed - startSeed });
      if (results.length > 0) self.postMessage({ type: 'snapshot', results });
      if (isStopped()) break;
    }

    // PKHeX: D = XDRNG.Prev3(origin), E = XDRNG.Next(D), PID = D_hi | E_hi.
    const pidHighState = previousState(origin >>> 0, 3);
    const pidLowState = cxdNext(pidHighState);
    const pid = (((pidHighState >>> 16) << 16) | (pidLowState >>> 16)) >>> 0;

    // RefreshAbility(0) is mandatory for these encounters.
    if (!checkPid(pid, nature, 0, genderThreshold, targetGender, trainerXor, wantShiny, 0)) continue;
    if (!validateTeamLocks(origin >>> 0, teamLocks, NOT_FORCED)) continue;

    results.push({
      seed: origin >>> 0,
      pid,
      abilityBit: 0,
      method: 'CXD_EREADER',
      ivs: { ...ivs },
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      initSeed: null,
      metLevels: null
    });
    if (results.length >= limit) break;
  }

  self.postMessage({ type: 'done', results });
}

/* ══════════════════════════════════════════════════════════
 *  BRUTE-FORCE PATH — full 2³² seed scan
 *  (with anti-shiny PID rerolling + optional lock validation)
 * ══════════════════════════════════════════════════════════ */

function bruteForceSearch(params, isStopped) {
  const {
    startSeed, endSeed,
    nature, ability, genderThreshold, targetGender,
    tid, sid, wantShiny, minIVs, maxIVs, maxResults,
    noShiny, teamLocks, tsv
  } = params;

  const pb = makePriorityBuffer(maxResults || 50);
  const TICK = 0x400000;
  const tickMask = TICK - 1;
  const trainerXor = (tid ^ sid) >>> 0;
  const doLockCheck = teamLocks && teamLocks.length > 0;
  const tsvVal = tsv != null ? tsv : NOT_FORCED;

  const mHp = minIVs[0], mAtk = minIVs[1], mDef = minIVs[2],
        mSpA = minIVs[3], mSpD = minIVs[4], mSpe = minIVs[5];
  const xHp = maxIVs ? maxIVs[0] : 31, xAtk = maxIVs ? maxIVs[1] : 31, xDef = maxIVs ? maxIVs[2] : 31,
        xSpA = maxIVs ? maxIVs[3] : 31, xSpD = maxIVs ? maxIVs[4] : 31, xSpe = maxIVs ? maxIVs[5] : 31;

  for (let seed = startSeed; seed < endSeed; seed++) {
    if (((seed - startSeed) & tickMask) === 0 && seed > startSeed) {
      self.postMessage({ type: 'progress', done: seed - startSeed, total: endSeed - startSeed });
      if (pb.buf.length > 0) self.postMessage({ type: 'snapshot', results: pb.buf });
      if (isStopped()) break;
    }

    let s = seed >>> 0;

    s = cxdNext(s);
    const iv1r = (s >>> 16) & 0x7FFF;
    const hp   = iv1r & 0x1F;          if (hp  < mHp  || hp  > xHp)  continue;
    const atk  = (iv1r >> 5)  & 0x1F;  if (atk < mAtk || atk > xAtk) continue;
    const def  = (iv1r >> 10) & 0x1F;  if (def < mDef || def > xDef) continue;

    s = cxdNext(s);
    const iv2r = (s >>> 16) & 0x7FFF;
    const spe  = iv2r & 0x1F;          if (spe < mSpe || spe > xSpe) continue;
    const spa  = (iv2r >> 5)  & 0x1F;  if (spa < mSpA || spa > xSpA) continue;
    const spd  = (iv2r >> 10) & 0x1F;  if (spd < mSpD || spd > xSpD) continue;

    const ivTotal = hp + atk + def + spa + spd + spe;
    if (pb.full() && ivTotal <= pb.getWorst()) continue;

    s = cxdNext(s);
    const abilityBit = (s >>> 16) & 1;
    if (ability >= 0 && abilityBit !== ability) continue;

    /* PID with anti-shiny rerolling */
    const { pid } = generateCXDPid(s, trainerXor, noShiny);

    if (pid % 25 !== nature) continue;
    if (targetGender < 2) {
      const gb = pid & 0xFF;
      if (targetGender === 0 && gb >= genderThreshold) continue;
      if (targetGender === 1 && gb < genderThreshold)  continue;
    }
    const xv = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ trainerXor;
    if (wantShiny  && xv >= 8) continue;

    /* Team-lock validation */
    if (doLockCheck && !validateTeamLocks(seed >>> 0, teamLocks, tsvVal)) continue;

    const ivs = { hp, atk, def, spa, spd, spe };
    pb.tryAdd({
      seed: seed >>> 0,
      pid,
      abilityBit,
      method: 'CXD',
      ivs,
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      initSeed: null,
      metLevels: null
    }, ivTotal);
  }

  self.postMessage({ type: 'done', results: pb.buf });
}

/* ── Entry point ─────────────────────────────────────── */
self.onmessage = function (e) {
  let stopped = false;
  self.onmessage = function () { stopped = true; };
  const isStopped = () => stopped;

  if (e.data.pidType === 'POKESPOT') {
    pokeSpotSearch(e.data, isStopped);
    return;
  }

  if (e.data.pidType === 'CXD_EREADER') {
    eReaderSearch(e.data, isStopped);
    return;
  }

  const minIVs = e.data.minIVs;
  const maxIVs = e.data.maxIVs || [31,31,31,31,31,31];
  const iv1Count = (maxIVs[0] - minIVs[0] + 1) *
                   (maxIVs[1] - minIVs[1] + 1) *
                   (maxIVs[2] - minIVs[2] + 1);

  if (iv1Count <= 4096 || e.data.pidType === 'CXD_COLO_STARTER' || e.data.pidType === 'CXD_XD_STARTER') {
    fastSearch(e.data, isStopped);
  } else {
    bruteForceSearch(e.data, isStopped);
  }
};
