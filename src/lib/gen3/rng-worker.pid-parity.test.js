const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const vm = require('vm');

const ZIGZAGOON_ID = 288;
const AIPOM_ID = 190;

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

function loadWorker(workerFile) {
  const workerPath = path.join(__dirname, workerFile);
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

function runSearch(workerFile, params) {
  const { context, messages } = loadWorker(workerFile);
  context.self.onmessage({ data: params });
  const done = messages.find((message) => message.type === 'done');
  assert(Boolean(done), `${workerFile} should post a done message`);
  return done ? done.results : [];
}

function samePidList(left, right) {
  return JSON.stringify(left.map((r) => r.pid)) === JSON.stringify(right.map((r) => r.pid));
}

async function main() {
  const thresholdsPath = path.join(__dirname, '..', '..', 'data', 'genderThresholds.gen3.js');
  const { getGenderThreshold } = await import(pathToFileURL(thresholdsPath).href);

  const baseGbaSearch = {
    nature: 0,
    ability: -1,
    genderThreshold: getGenderThreshold(ZIGZAGOON_ID),
    targetGender: 3,
    tid: 0,
    sid: 0,
    wantShiny: false,
    minIVs: [30, 30, 30, 0, 0, 0],
    maxIVs: [31, 31, 31, 31, 31, 31],
    methods: [true, true, true],
    maxResults: 100,
    targetSpecies: ZIGZAGOON_ID,
    slotTables: null,
    gameId: 3,
  };

  const anyResults = runSearch('rng-worker.js', {
    ...baseGbaSearch,
    pidParityPreference: 'any',
  });
  assert(anyResults.length > 0, 'single-ability Zigzagoon any parity should return results');
  assert(
    anyResults.some((result) => (result.pid & 1) === 0) &&
      anyResults.some((result) => (result.pid & 1) === 1),
    'single-ability Zigzagoon any parity should allow both even and odd PIDs'
  );

  const evenResults = runSearch('rng-worker.js', {
    ...baseGbaSearch,
    pidParityPreference: 'even',
  });
  assert(evenResults.length > 0, 'single-ability Zigzagoon even parity should return results');
  assert(
    evenResults.every((result) => (result.pid & 1) === 0),
    'single-ability Zigzagoon even parity should only return even PIDs'
  );

  const oddResults = runSearch('rng-worker.js', {
    ...baseGbaSearch,
    pidParityPreference: 'odd',
  });
  assert(oddResults.length > 0, 'single-ability Zigzagoon odd parity should return results');
  assert(
    oddResults.every((result) => (result.pid & 1) === 1),
    'single-ability Zigzagoon odd parity should only return odd PIDs'
  );

  const dualAbilityResults = runSearch('rng-worker.js', {
    ...baseGbaSearch,
    genderThreshold: getGenderThreshold(AIPOM_ID),
    targetSpecies: AIPOM_ID,
    ability: 1,
    pidParityPreference: 'any',
  });
  assert(dualAbilityResults.length > 0, 'dual-ability ability-slot filter should return results');
  assert(
    dualAbilityResults.every((result) => (result.pid & 1) === 1),
    'dual-ability searches should keep using the existing Ability field behavior'
  );

  const baseCxdSearch = {
    nature: 0,
    ability: -1,
    genderThreshold: getGenderThreshold(ZIGZAGOON_ID),
    targetGender: 3,
    tid: 0,
    sid: 0,
    wantShiny: false,
    noShiny: false,
    minIVs: [30, 30, 30, 0, 0, 0],
    maxIVs: [31, 31, 31, 31, 31, 31],
    maxResults: 40,
    teamLocks: null,
    tsv: 0xFFFFFFFF,
  };
  const cxdAnyResults = runSearch('cxd-worker.js', {
    ...baseCxdSearch,
    pidParityPreference: 'any',
  });
  const cxdOddResults = runSearch('cxd-worker.js', {
    ...baseCxdSearch,
    pidParityPreference: 'odd',
  });
  assert(cxdAnyResults.length > 0, 'CXD search should still return results');
  assert(
    samePidList(cxdAnyResults, cxdOddResults),
    'CXD generation should be unaffected by pidParityPreference'
  );

  if (failed > 0) {
    console.error(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }

  console.log(`All RNG worker PID parity tests passed (${passed} assertions).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
