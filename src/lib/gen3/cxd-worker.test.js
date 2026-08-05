const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert').strict;

function runSearch(params) {
  const messages = [];
  const context = { self: { postMessage(message) { messages.push(message); } } };
  const workerPath = path.join(__dirname, 'cxd-worker.js');
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(workerPath, 'utf8'), context, { filename: workerPath });
  context.self.onmessage({ data: params });
  const done = messages.find(message => message.type === 'done');
  assert.ok(done, 'worker should post a done message');
  return done.results;
}

const exactPerfect = {
  startSeed: 0,
  endSeed: 0x100000000,
  ability: -1,
  genderThreshold: -1,
  targetGender: 3,
  tid: 12345,
  sid: 54321,
  wantShiny: false,
  noShiny: true,
  minIVs: [31, 31, 31, 31, 31, 31],
  maxIVs: [31, 31, 31, 31, 31, 31],
  maxResults: 5,
  teamLocks: null,
  tsv: 0xFFFFFFFF,
};

function firstNatureResult(extra) {
  for (let nature = 0; nature < 25; nature++) {
    const results = runSearch({ ...exactPerfect, nature, ...extra });
    if (results.length) return results[0];
  }
  return null;
}

// Independent PKHeX-style XDRNG checks. These reverse the displayed values
// instead of trusting the worker's retained search seeds.
const next = seed => (Math.imul(seed, 0x343FD) + 0x269EC3) >>> 0;
const prev = seed => (Math.imul(seed, 0xB9B33155) + 0xA170F641) >>> 0;
const advance = (seed, count, step) => {
  let state = seed >>> 0;
  for (let i = 0; i < count; i++) state = step(state);
  return state;
};

function isValidPokeSpotActivation(slot, seed) {
  const esv = (seed >>> 16) % 100;
  const actualSlot = esv < 50 ? 0 : esv < 85 ? 1 : 2;
  if (actualSlot !== slot) return false;

  let state = prev(seed);
  const first = state >>> 16;
  if (first % 3 === 0) return true;
  if (first % 100 < 10) return false;
  state = prev(state);
  return (state >>> 16) % 3 === 0;
}

function isValidPokeSpotAnimation(seed) {
  let state = prev(seed);
  let animation = (state >>> 16) % 10;
  if (animation < 5 && animation !== 3) return true;

  state = prev(state);
  animation = (state >>> 16) % 10;
  if (animation >= 5 && animation !== 8) return true;

  state = advance(state, 3, prev);
  return (state >>> 16) % 10 === 8;
}

// Port of XDRNG.GetSeedsIVs. PKHeX reverse-recovers every possible pre-IV
// seed from only the six exported IVs, including ignored upper RNG bits.
function recoverPokeSpotPreIVSeeds(ivs) {
  const first = ((ivs.hp | (ivs.atk << 5) | (ivs.def << 10)) << 16) >>> 0;
  const second = ((ivs.spe | (ivs.spa << 5) | (ivs.spd << 10)) << 16) >>> 0;
  const product = Math.imul(0xB9B33155, second) >>> 0;
  const tmp = ((((product - first) >>> 0) >>> 16) * 0xE8D1);
  const lag0 = 0x44C5;
  const lag1 = 0xE8D1;
  const lo = (Math.floor((tmp + 0x1E694392) / 0x8000) * lag0) >>> 0;
  const mi = (lo + lag0) >>> 0;
  const up = (Math.floor((tmp + 0x1E69FAC8) / 0x8000) * lag0) >>> 0;
  const bases = mi === up ? [lo, mi] : [lo, mi, up];
  const seeds = [];

  for (const base of bases) {
    let low = base % lag1;
    do {
      let seed = prev((second | low) >>> 0);
      if ((seed & 0x7FFF0000) === first) {
        seed = prev(seed);
        seeds.push(seed >>> 0, (seed ^ 0x80000000) >>> 0);
      }
      low += lag1;
    } while (low < 0x10000);
  }
  return seeds;
}

function isValidPokeSpotPreIVSeed(preIV, levelMin, levelMax, metLevel, abilityBit) {
  const animationSeed = advance(preIV, 6, prev);
  if (!isValidPokeSpotAnimation(animationSeed)) return false;
  const levelRoll = (advance(preIV, 2, prev) >>> 16) % (1 + levelMax - levelMin);
  if (levelMin + levelRoll !== metLevel) return false;
  return ((advance(preIV, 3, next) >>> 16) & 1) === abilityBit;
}

const xdStarter = firstNatureResult({ pidType: 'CXD_XD_STARTER' });
assert.ok(xdStarter, 'XD Eevee starter search should find an exact-IV result');
assert.equal(xdStarter.method, 'CXD_XD_STARTER');
assert.ok(Number.isInteger(xdStarter.tid) && Number.isInteger(xdStarter.sid), 'XD starter should return its seed-derived trainer IDs');
assert.ok(((((xdStarter.pid >>> 16) ^ (xdStarter.pid & 0xFFFF)) ^ (xdStarter.tid ^ xdStarter.sid))) >= 8, 'XD starter should respect its derived anti-shiny IDs');

for (const starterIndex of [0, 1]) {
  const coloStarter = firstNatureResult({ pidType: 'CXD_COLO_STARTER', starterIndex });
  assert.ok(coloStarter, `Colosseum starter ${starterIndex} should find an exact-IV result`);
  assert.equal(coloStarter.method, 'CXD_COLO_STARTER');
  assert.ok((coloStarter.pid & 0xFF) >= 31, 'Colosseum starters must satisfy the male Eevee gender threshold');
  assert.ok(((((coloStarter.pid >>> 16) ^ (coloStarter.pid & 0xFFFF)) ^ (coloStarter.tid ^ coloStarter.sid))) >= 8, 'Colosseum starters must not be shiny for their derived trainer IDs');
}

const oldIllegalEspeon = runSearch({
  ...exactPerfect,
  nature: 0,
  pidType: 'CXD_COLO_STARTER',
  starterIndex: 1,
});
assert.equal(oldIllegalEspeon.length, 0, 'Hardy 6x31 Espeon with unreachable TID 17560 / SID 30071 must be rejected');

const legalPerfectEspeon = firstNatureResult({ pidType: 'CXD_COLO_STARTER', starterIndex: 1 });
assert.deepEqual(
  [legalPerfectEspeon.tid, legalPerfectEspeon.sid],
  [50328, 62839],
  'Espeon search should retain the first PKHeX-reachable exact-IV trainer pair',
);

const pokeSpotCases = [
  ['Rock Sandshrew', 0, 10, 23], ['Rock Gligar', 1, 10, 20], ['Rock Trapinch', 2, 10, 20],
  ['Oasis Hoppip', 0, 10, 20], ['Oasis Phanpy', 1, 10, 20], ['Oasis Surskit', 2, 10, 20],
  ['Cave Zubat', 0, 10, 21], ['Cave Aron', 1, 10, 21], ['Cave Wooper', 2, 10, 21],
];

for (const [name, slot, levelMin, levelMax] of pokeSpotCases) {
  const result = firstNatureResult({
    pidType: 'POKESPOT',
    pokeSpotSlot: slot,
    levelMin,
    levelMax,
  });
  assert.ok(result, `${name} search should find an exact-IV result`);
  assert.equal(result.method, 'POKESPOT');
  assert.ok(Number.isInteger(result.ivSeed), `${name} should retain its separate IV/animation seed`);
  assert.ok(['hp', 'atk', 'def', 'spa', 'spd', 'spe'].every(stat => result.ivs[stat] === 31), `${name} should preserve all six exact IVs`);
  assert.ok(isValidPokeSpotActivation(slot, result.seed), `${name} PID seed must reverse to its encounter slot`);
  const highState = next(result.seed);
  const generatedPID = (((highState >>> 16) << 16) | (next(highState) >>> 16)) >>> 0;
  assert.equal(result.pid, generatedPID, `${name} PID must use the two calls after the slot roll`);
  const metLevel = result.metLevels[0];
  assert.ok(metLevel >= levelMin && metLevel <= levelMax, `${name} must report its seed-derived met level`);
  const recovered = recoverPokeSpotPreIVSeeds(result.ivs);
  assert.ok(
    recovered.some(seed => isValidPokeSpotPreIVSeed(seed, levelMin, levelMax, metLevel, result.abilityBit)),
    `${name} IVs, level, and ability bit must reverse through PKHeX's Poké Spot animation frames`,
  );
}

const sandshrewLegalAbility = firstNatureResult({
  pidType: 'POKESPOT',
  pokeSpotSlot: 0,
  levelMin: 10,
  levelMax: 23,
  ability: 0,
});
assert.equal(sandshrewLegalAbility.abilityBit, 0, 'single-ability Sandshrew must use legal ability number 0');

const eReaderCases = [
  {
    name: 'Togepi', nature: 22, genderThreshold: 31, targetGender: 0,
    locks: [[
      { s: 302, n: 23, g: 0, r: 127 }, { s: 88, n: 8, g: 0, r: 127 },
      { s: 316, n: 24, g: 0, r: 127 }, { s: 175, n: 22, g: 1, r: 31 },
    ]],
  },
  {
    name: 'Mareep', nature: 16, genderThreshold: 127, targetGender: 0,
    locks: [[
      { s: 300, n: 4, g: 1, r: 191 }, { s: 211, n: 10, g: 1, r: 127 },
      { s: 355, n: 12, g: 1, r: 127 }, { s: 179, n: 16, g: 1, r: 127 },
    ]],
  },
  {
    name: 'Scizor', nature: 11, genderThreshold: 127, targetGender: 1,
    locks: [[
      { s: 198, n: 13, g: 1, r: 191 }, { s: 344, n: 2, g: 2, r: 255 },
      { s: 208, n: 3, g: 0, r: 127 }, { s: 212, n: 11, g: 0, r: 127 },
    ]],
  },
];

for (const testCase of eReaderCases) {
  const result = runSearch({
    ...exactPerfect,
    pidType: 'CXD_EREADER',
    nature: testCase.nature,
    genderThreshold: testCase.genderThreshold,
    targetGender: testCase.targetGender,
    noShiny: false,
    minIVs: [0, 0, 0, 0, 0, 0],
    maxIVs: [0, 0, 0, 0, 0, 0],
    maxResults: 1,
    teamLocks: testCase.locks,
  })[0];
  assert.ok(result, `e-Reader ${testCase.name} search should find a team-lock-valid PID`);
  assert.equal(result.method, 'CXD_EREADER');
  assert.equal(result.pid % 25, testCase.nature, `${testCase.name} must retain its fixed nature`);
  assert.equal(result.abilityBit, 0, `${testCase.name} must use ability slot 0`);
  assert.ok(Object.values(result.ivs).every(iv => iv === 0), `${testCase.name} must retain six zero IVs`);

  const highState = prev(prev(prev(result.seed)));
  const expectedPid = (((highState >>> 16) << 16) | (next(highState) >>> 16)) >>> 0;
  assert.equal(result.pid, expectedPid, `${testCase.name} PID must use PKHeX's e-Reader XDRNG frame`);
}

console.log('CXD special RNG worker tests passed');
