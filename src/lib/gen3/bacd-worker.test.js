const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

function loadWorker() {
  const workerPath = path.join(__dirname, 'bacd-worker.js');
  const messages = [];
  const context = {
    self: {
      postMessage(message) {
        messages.push(message);
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(workerPath, 'utf8'), context, { filename: workerPath });
  return { context, messages };
}

function runSearch(params) {
  const { context, messages } = loadWorker();
  context.self.onmessage({ data: params });
  const done = messages.find((message) => message.type === 'done');
  assert(Boolean(done), 'worker should post a done message');
  return done ? done.results : [];
}

function hex(value) {
  return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

function hasPerfectIVs(result) {
  const ivs = result.ivs;
  return ivs.hp === 31 &&
    ivs.atk === 31 &&
    ivs.def === 31 &&
    ivs.spa === 31 &&
    ivs.spd === 31 &&
    ivs.spe === 31;
}

const exactPerfectLonely = {
  nature: 1,
  ability: -1,
  genderThreshold: -1,
  targetGender: 3,
  tid: 0,
  sid: 0,
  wantShiny: false,
  noShiny: false,
  minIVs: [31, 31, 31, 31, 31, 31],
  maxIVs: [31, 31, 31, 31, 31, 31],
  maxResults: 250,
};

const expectedOriginSeed = 0xFB0448D1;
const expectedPid = 0x91A9E850;

const bacduResults = runSearch({
  ...exactPerfectLonely,
  method: 'BACD_U',
  startSeed: 0,
  endSeed: 1,
});
const bacduMatch = bacduResults.find((result) =>
  result.originSeed === expectedOriginSeed &&
  result.seed === expectedOriginSeed &&
  result.pid === expectedPid &&
  result.method === 'BACD_U' &&
  hasPerfectIVs(result)
);

assert(
  Boolean(bacduMatch),
  `BACD_U should recover ${hex(expectedOriginSeed)} / ${hex(expectedPid)} from IVs`
);

const bacdrResults = runSearch({
  ...exactPerfectLonely,
  method: 'BACD_R',
  startSeed: expectedOriginSeed,
  endSeed: expectedOriginSeed + 1,
});
const bacdrMatch = bacdrResults.find((result) =>
  result.originSeed === expectedOriginSeed ||
  result.seed === expectedOriginSeed ||
  result.pid === expectedPid
);

assert(
  !bacdrMatch,
  'BACD_R should keep its 16-bit seed restriction and not scan the BACD_U vector'
);

const bacdrRestrictedResults = runSearch({
  method: 'BACD_R',
  nature: 0,
  ability: -1,
  genderThreshold: -1,
  targetGender: 3,
  tid: 0,
  sid: 0,
  wantShiny: false,
  noShiny: false,
  minIVs: [0, 0, 0, 0, 0, 0],
  maxIVs: [31, 31, 31, 31, 31, 31],
  maxResults: 500,
});

assert(
  bacdrRestrictedResults.length > 0,
  'BACD_R broad search should produce guard results'
);
assert(
  bacdrRestrictedResults.every((result) => result.originSeed <= 0xFFFF && result.seed <= 0xFFFF),
  'BACD_R results should stay within 0x0000..0xFFFF'
);

const antiXResults = runSearch({
  ...exactPerfectLonely,
  method: 'BACD_U_AX',
  nature: 22,
  noShiny: true,
  startSeed: 0,
  endSeed: 1,
});
assert(
  antiXResults.some(result =>
    result.originSeed === expectedOriginSeed &&
    result.pid === 0x79F9E850 &&
    result.method === 'BACD_U_AX' &&
    hasPerfectIVs(result)
  ),
  'BACD_U_AX should recover the PCNY anti-X PID transform from exact IVs'
);

const tableBase = {
  nature: 0,
  ability: -1,
  genderThreshold: -1,
  targetGender: 3,
  tid: 0,
  sid: 0,
  minIVs: [0, 0, 0, 0, 0, 0],
  maxIVs: [31, 31, 31, 31, 31, 31],
  startSeed: 0,
  endSeed: 0x10000,
  maxResults: 20,
};
const taResults = runSearch({
  ...tableBase,
  method: 'BACD_TA',
  wantShiny: false,
  noShiny: true,
  eventNationalSpecies: 385,
  otGenderMethod: 'RAND_S7',
});
assert(taResults.length > 0, 'BACD_TA should produce table-distribution results');
assert(taResults.every(result => result.method === 'BACD_TA' && result.otGender), 'BACD_TA should preserve its method and seed-derived OT gender');

const tsResults = runSearch({
  ...tableBase,
  method: 'BACD_TS',
  wantShiny: true,
  noShiny: false,
  eventNationalSpecies: 385,
});
assert(tsResults.length > 0, 'BACD_TS should produce forced-shiny table results');
assert(tsResults.every(result => ((((result.pid >>> 16) ^ (result.pid & 0xFFFF)) ^ 0) < 8)), 'every BACD_TS result should be shiny');

const berryProgramBase = {
  ability: -1,
  genderThreshold: -1,
  targetGender: 3,
  tid: 30317,
  sid: 0,
  wantShiny: true,
  noShiny: false,
  minIVs: [0, 0, 0, 0, 0, 0],
  maxIVs: [31, 31, 31, 31, 31, 31],
  method: 'BACD_RBCD',
  startSeed: 0,
  endSeed: 0x10000,
  maxResults: 250,
};

for (const variant of [
  { otName: 'SAPHIRE', otGender: 'male', seed: 5, pid: 0x48DF3EB5 },
  { otName: 'RUBY', otGender: 'female', seed: 3, pid: 0xC553B33A },
]) {
  const results = runSearch({
    ...berryProgramBase,
    nature: variant.pid % 25,
    berryFixOtPreference: variant.otName,
  });
  assert(results.length > 0, `${variant.otName} Berry Program search should produce results`);
  assert(results.every(result => result.originSeed >= 3 && result.originSeed <= 213), `${variant.otName} results should obey the PKHeX BCD seed range`);
  assert(results.every(result => result.otName === variant.otName), `${variant.otName} event should only return its OT-name seed branch`);
  assert(results.every(result => result.otGender === variant.otGender), `${variant.otName} event should only return its OT-gender seed branch`);
  assert(results.every(result => ((((result.pid >>> 16) ^ (result.pid & 0xFFFF)) ^ 30317) < 8)), `${variant.otName} results should always be shiny`);
  assert(results.some(result => result.originSeed === variant.seed && result.pid === variant.pid), `${variant.otName} should include its expected legal seed vector`);
}

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}

console.log(`All BACD worker tests passed (${passed} assertions).`);
