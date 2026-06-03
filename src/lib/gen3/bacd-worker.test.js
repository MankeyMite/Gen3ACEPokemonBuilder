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

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}

console.log(`All BACD worker tests passed (${passed} assertions).`);
