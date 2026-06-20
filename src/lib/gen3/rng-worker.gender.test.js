const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const vm = require('vm');

const LARVITAR_ID = 246;

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
  const workerPath = path.join(__dirname, 'rng-worker.js');
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

async function main() {
  const thresholdsPath = path.join(__dirname, '..', '..', 'data', 'genderThresholds.gen3.js');
  const { getGenderThreshold } = await import(pathToFileURL(thresholdsPath).href);
  const larvitarThreshold = getGenderThreshold(LARVITAR_ID);

  const baseSearch = {
    nature: 0,
    ability: -1,
    genderThreshold: larvitarThreshold,
    tid: 0,
    sid: 0,
    wantShiny: false,
    minIVs: [30, 30, 30, 0, 0, 0],
    maxIVs: [31, 31, 31, 31, 31, 31],
    methods: [true, true, true],
    maxResults: 100,
    targetSpecies: LARVITAR_ID,
    slotTables: null,
    gameId: 3,
  };

  const maleResults = runSearch({
    ...baseSearch,
    targetGender: 1,
  });

  assert(maleResults.length > 0, 'Larvitar male search should return results');
  assert(
    maleResults.every((result) => (result.pid & 0xFF) >= larvitarThreshold),
    'Larvitar male search should not return PID low bytes below 127'
  );

  const femaleResults = runSearch({
    ...baseSearch,
    targetGender: 0,
  });

  assert(femaleResults.length > 0, 'Larvitar female search should return results');
  assert(
    femaleResults.every((result) => (result.pid & 0xFF) < larvitarThreshold),
    'Larvitar female search should only return PID low bytes below 127'
  );

  if (failed > 0) {
    console.error(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }

  console.log(`All RNG worker gender tests passed (${passed} assertions).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
