/**
 * BACD/BACD_R/BACD_R_A mystery gift PID/IV search worker.
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

function generateBACDFromSeed(originSeed, method, tid, sid) {
  const state = { seed: originSeed >>> 0 };

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
  const maxResults = Math.max(1, Number(params.maxResults) || 250);

  const inputStart = Number(params.startSeed);
  const inputEnd = Number(params.endSeed);
  const startSeed = Number.isFinite(inputStart) ? Math.max(0, Math.min(0x10000, inputStart >>> 0)) : 0;
  const endSeed = Number.isFinite(inputEnd) ? Math.max(startSeed, Math.min(0x10000, inputEnd >>> 0)) : 0x10000;

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

  const results = [];
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
    if (!passesFilters(r, searchParams)) continue;

    results.push(r);
    results.sort((a, b) => ivTotal(b) - ivTotal(a));
    if (results.length > maxResults) results.length = maxResults;
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
