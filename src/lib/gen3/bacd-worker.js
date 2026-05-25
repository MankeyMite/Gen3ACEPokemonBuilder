/**
 * BACD/BACD_R/BACD_R_A/BACD_RBCD/BACD_M mystery gift PID/IV search worker.
 *
 * Restricted Gen 3 event methods use a 16-bit origin seed space (0x0000..0xFFFF).
 * This worker scans that space and returns best-IV results matching UI filters.
 */

const MULT = 0x41C64E6D;
const ADD = 0x6073;

const HP_TYPES = [
  'Fighting','Flying','Poison','Ground','Rock','Bug',
  'Ghost','Steel','Fire','Water','Grass','Electric',
  'Psychic','Ice','Dragon','Dark'
];

const MYSTRY_MEW_FIXED_TID = 6930;
const MYSTRY_MEW_FIXED_SID = 0;
const MYSTRY_MEW_BASE_SEEDS = [
  0x0652, 0x0932, 0x0C13, 0x0D43, 0x0EEE,
  0x1263, 0x13C9, 0x1614, 0x1C09, 0x1EA5,
  0x20BF, 0x2389, 0x2939, 0x302D, 0x306E,
  0x34F3, 0x45F3, 0x46CE, 0x4A0D, 0x4B63,
  0x4C79, 0x508E, 0x50AB, 0x5240, 0x5327,
  0x56BA, 0x56CC, 0x5841, 0x5A60, 0x5BC1,
  0x5E2B, 0x5EF3, 0x6065, 0x643F, 0x6457,
  0x67A3, 0x6944, 0x6E06, 0x6E62, 0x7667,
  0x77EF, 0x78D2, 0x8655, 0x8A92, 0x8B48,
  0x93D0, 0x941D, 0x95A0, 0x967D, 0x9690,
  0x9C37, 0x9C40, 0x9D9C, 0x9DE4, 0x9E86,
  0xA153, 0xA443, 0xA8AC, 0xAC08, 0xAFFB,
  0xB1F2, 0xB831, 0xBE96, 0xC2D4, 0xC385,
  0xC6CE, 0xC92C, 0xC953, 0xC962, 0xCC43,
  0xCD47, 0xCD96, 0xD1E4, 0xDFED, 0xE62C,
  0xE6CC, 0xE90A, 0xE95D, 0xE991, 0xEBB2,
  0xEE7F, 0xEE9F, 0xEFC8, 0xF0E4, 0xFE4E,
  0xFE9D
];

let mystryMewOriginSeedCache = null;

let stopped = false;

function advance(seed) {
  return (Math.imul(seed, MULT) + ADD) >>> 0;
}

function next16(state) {
  state.seed = advance(state.seed);
  return state.seed >>> 16;
}

function isShinyGen3(pid, tid, sid) {
  const hi = (pid >>> 16) & 0xFFFF;
  const lo = pid & 0xFFFF;
  return (((hi ^ lo) ^ (tid ^ sid)) & 0xFFFF) < 8;
}

function regularAntiShinyAdd(pid) {
  return ((pid + 8) & 0xFFFFFFF8) >>> 0;
}

function getMystryMewOriginSeeds() {
  if (mystryMewOriginSeedCache) return mystryMewOriginSeedCache;

  const seeds = [];
  for (let seedIndex = 0; seedIndex < MYSTRY_MEW_BASE_SEEDS.length; seedIndex++) {
    const baseSeed = MYSTRY_MEW_BASE_SEEDS[seedIndex] >>> 0;
    let derivedSeed = baseSeed;

    for (let subIndex = 0; subIndex <= 4; subIndex++) {
      if (subIndex > 0) {
        for (let step = 0; step < 5; step++) {
          derivedSeed = advance(derivedSeed);
        }
      }

      // Special legality rule from PKHeX/Gen3 seed table notes.
      if (baseSeed === 0x6065 && subIndex !== 2) continue;

      seeds.push({
        seed: derivedSeed >>> 0,
        baseSeed,
        seedIndex,
        subIndex,
      });
    }
  }

  mystryMewOriginSeedCache = seeds;
  return seeds;
}

function hpType(ivs) {
  const v =
    (ivs.hp & 1) |
    ((ivs.atk & 1) << 1) |
    ((ivs.def & 1) << 2) |
    ((ivs.spe & 1) << 3) |
    ((ivs.spa & 1) << 4) |
    ((ivs.spd & 1) << 5);

  return HP_TYPES[Math.floor(v * 15 / 63)];
}

function hpPower(ivs) {
  const v =
    ((ivs.hp >> 1) & 1) |
    (((ivs.atk >> 1) & 1) << 1) |
    (((ivs.def >> 1) & 1) << 2) |
    (((ivs.spe >> 1) & 1) << 3) |
    (((ivs.spa >> 1) & 1) << 4) |
    (((ivs.spd >> 1) & 1) << 5);

  return Math.floor(v * 40 / 63) + 30;
}

function getGenderFromPID(pid, genderThreshold) {
  if (genderThreshold === -1) return 2;
  if (genderThreshold === 0) return 1;
  if (genderThreshold >= 254) return 0;
  return (pid & 0xFF) < genderThreshold ? 0 : 1;
}

function passesFilters(result, p) {
  const { pid, ivs } = result;

  if (pid % 25 !== p.nature) return false;
  if (p.ability >= 0 && (pid & 1) !== p.ability) return false;

  if (p.targetGender < 2) {
    const gender = getGenderFromPID(pid, p.genderThreshold);
    if (gender !== p.targetGender) return false;
  }

  const shiny = isShinyGen3(pid, p.tid, p.sid);
  if (p.wantShiny && !shiny) return false;
  if (p.noShiny && shiny) return false;

  const min = p.minIVs || [0, 0, 0, 0, 0, 0];
  const max = p.maxIVs || [31, 31, 31, 31, 31, 31];

  // UI order: HP, Atk, Def, SpA, SpD, Spe
  const arr = [ivs.hp, ivs.atk, ivs.def, ivs.spa, ivs.spd, ivs.spe];
  for (let i = 0; i < 6; i++) {
    if (arr[i] < min[i] || arr[i] > max[i]) return false;
  }

  return true;
}

function generateBACDFromSeed(originSeed, method, tid, sid, candidateMeta = null) {
  const state = { seed: originSeed >>> 0 };

  if (method === 'BACD_M') {
    const pidHigh = next16(state);
    const pidLow = next16(state);
    const pid = (((pidHigh & 0xFFFF) << 16) | (pidLow & 0xFFFF)) >>> 0;

    const ivRand1 = next16(state) & 0x7FFF;
    const ivRand2 = next16(state) & 0x7FFF;
    const iv32 = ((ivRand2 << 15) | ivRand1) >>> 0;

    const ivs = {
      hp: iv32 & 31,
      atk: (iv32 >>> 5) & 31,
      def: (iv32 >>> 10) & 31,
      spe: (iv32 >>> 15) & 31,
      spa: (iv32 >>> 20) & 31,
      spd: (iv32 >>> 25) & 31,
    };

    const otRand = next16(state);
    const otGenderBit = (Math.floor(otRand / 3) & 1);
    const otGender = otGenderBit === 1 ? 'female' : 'male';

    return {
      seed: originSeed >>> 0,
      originSeed: originSeed >>> 0,
      pid,
      method,
      ivs,
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      metLevels: null,
      otName: 'MYSTRY',
      otGender,
      otGenderBit,
      seedIndex: Number.isFinite(Number(candidateMeta?.seedIndex)) ? Number(candidateMeta.seedIndex) : -1,
      subIndex: Number.isFinite(Number(candidateMeta?.subIndex)) ? Number(candidateMeta.subIndex) : -1,
      baseSeed: Number.isFinite(Number(candidateMeta?.baseSeed)) ? Number(candidateMeta.baseSeed) : null,
    };
  }

  if (method === 'BACD_RBCD') {
    // Berry Program Update Zigzagoon (PKHeX: BACD_S [BACD_RBCD]).
    // PID: forced shiny from first/third RNG calls; second call consumed.
    const pidHigh = next16(state);
    const consumed = next16(state);
    const pidTail = next16(state);
    void consumed;

    const idXor = (tid ^ sid) & 0xFFFF;
    const pidLow = (((idXor ^ pidHigh) & 0xFFF8) | (pidTail & 0x7)) & 0xFFFF;
    const pid = (((pidHigh & 0xFFFF) << 16) | pidLow) >>> 0;

    // IVs use the next two sequential calls packed as 30 bits.
    const ivRand1 = next16(state) & 0x7FFF;
    const ivRand2 = next16(state) & 0x7FFF;
    const iv32 = ((ivRand2 << 15) | ivRand1) >>> 0;

    const ivs = {
      hp: iv32 & 31,
      atk: (iv32 >>> 5) & 31,
      def: (iv32 >>> 10) & 31,
      spe: (iv32 >>> 15) & 31,
      spa: (iv32 >>> 20) & 31,
      spd: (iv32 >>> 25) & 31,
    };

    // Sixth RNG call selects OT variant (RUBY/SAPHIRE).
    const otRand = next16(state);
    const otGenderBit = (Math.floor(otRand / 3) & 1);
    const otName = otGenderBit === 1 ? 'RUBY' : 'SAPHIRE';
    const otGender = otGenderBit === 1 ? 'female' : 'male';

    return {
      seed: originSeed >>> 0,
      originSeed: originSeed >>> 0,
      pid,
      method,
      ivs,
      hpt: hpType(ivs),
      hpp: hpPower(ivs),
      metLevels: null,
      otName,
      otGender,
      otGenderBit,
    };
  }

  const a = next16(state);
  const b = next16(state);
  const c = next16(state);
  const d = next16(state);

  let pid = ((a << 16) | b) >>> 0;

  if (method === 'BACD_R_A' || method === 'BACD_A') {
    if (isShinyGen3(pid, tid, sid)) {
      pid = regularAntiShinyAdd(pid);
    }
  }

  const ivs = {
    hp: c & 31,
    atk: (c >> 5) & 31,
    def: (c >> 10) & 31,
    spe: d & 31,
    spa: (d >> 5) & 31,
    spd: (d >> 10) & 31,
  };

  return {
    seed: originSeed >>> 0,
    originSeed: originSeed >>> 0,
    pid,
    method,
    ivs,
    hpt: hpType(ivs),
    hpp: hpPower(ivs),
    metLevels: null,
  };
}

function ivTotal(r) {
  return r.ivs.hp + r.ivs.atk + r.ivs.def + r.ivs.spa + r.ivs.spd + r.ivs.spe;
}

function searchBACD(params) {
  const method = String(params.method || 'BACD_R').toUpperCase();
  const isMystryMewMethod = method === 'BACD_M';
  const maxResults = Math.max(1, Number(params.maxResults) || 250);
  const rawBerryFixOtPref = String(
    params.berryFixOtPreference || (method === 'BACD_RBCD' ? 'SAPHIRE' : 'ANY')
  ).toUpperCase();
  const berryFixOtPreference = rawBerryFixOtPref === 'RUBY'
    ? 'RUBY'
    : rawBerryFixOtPref === 'ANY'
      ? 'ANY'
      : 'SAPHIRE';

  let startSeed = 0;
  let endSeed = 0x10000;
  if (!isMystryMewMethod) {
    const inputStart = Number(params.startSeed);
    const inputEnd = Number(params.endSeed);
    startSeed = Number.isFinite(inputStart) ? Math.max(0, Math.min(0x10000, inputStart >>> 0)) : 0;
    endSeed = Number.isFinite(inputEnd) ? Math.max(startSeed, Math.min(0x10000, inputEnd >>> 0)) : 0x10000;

    if (method === 'BACD_RBCD') {
      // PKHeX legality range for Berry Program Update BCD sum seeds: [3, 213].
      const rbcdMin = 3;
      const rbcdMaxExclusive = 214;
      startSeed = Math.max(startSeed, rbcdMin);
      endSeed = Math.min(endSeed, rbcdMaxExclusive);
      if (endSeed < startSeed) endSeed = startSeed;
    }
  }

  const searchParams = {
    nature: Number(params.nature) || 0,
    ability: Number.isFinite(Number(params.ability)) ? Number(params.ability) : -1,
    genderThreshold: Number.isFinite(Number(params.genderThreshold)) ? Number(params.genderThreshold) : -1,
    targetGender: Number.isFinite(Number(params.targetGender)) ? Number(params.targetGender) : 3,
    tid: Number(params.tid) & 0xFFFF,
    sid: Number(params.sid) & 0xFFFF,
    wantShiny: !!params.wantShiny,
    noShiny: !!params.noShiny,
    minIVs: params.minIVs,
    maxIVs: params.maxIVs,
  };

  if (isMystryMewMethod) {
    searchParams.tid = MYSTRY_MEW_FIXED_TID;
    searchParams.sid = MYSTRY_MEW_FIXED_SID;
    searchParams.wantShiny = false;
    searchParams.noShiny = true;
  }

  const results = [];
  const pushResult = (r) => {
    results.push(r);
    results.sort((a, b) => ivTotal(b) - ivTotal(a));
    if (results.length > maxResults) results.length = maxResults;
  };

  if (isMystryMewMethod) {
    const candidates = getMystryMewOriginSeeds();
    const total = candidates.length;

    for (let i = 0; i < candidates.length; i++) {
      if (stopped) break;

      if ((i & 0x1F) === 0) {
        self.postMessage({ type: 'progress', done: i, total });
        if (results.length) {
          self.postMessage({ type: 'snapshot', results: results.slice(0, maxResults) });
        }
      }

      const candidate = candidates[i];
      const r = generateBACDFromSeed(candidate.seed, method, searchParams.tid, searchParams.sid, candidate);
      if (isShinyGen3(r.pid, MYSTRY_MEW_FIXED_TID, MYSTRY_MEW_FIXED_SID)) continue;
      if (!passesFilters(r, searchParams)) continue;

      pushResult(r);
    }
  } else {
    const total = Math.max(0, endSeed - startSeed);
    for (let seed = startSeed; seed < endSeed; seed++) {
      if (stopped) break;

      const done = seed - startSeed;
      if ((done & 0x3FF) === 0) {
        self.postMessage({ type: 'progress', done, total });
        if (results.length) {
          self.postMessage({ type: 'snapshot', results: results.slice(0, maxResults) });
        }
      }

      const r = generateBACDFromSeed(seed, method, searchParams.tid, searchParams.sid);
      if (method === 'BACD_RBCD' && berryFixOtPreference !== 'ANY' && r.otName !== berryFixOtPreference) {
        continue;
      }
      if (!passesFilters(r, searchParams)) continue;

      pushResult(r);
    }
  }

  self.postMessage({ type: 'done', results });
}

self.onmessage = function (e) {
  if (e.data && e.data.stop) {
    stopped = true;
    return;
  }

  stopped = false;
  searchBACD(e.data || {});
};
