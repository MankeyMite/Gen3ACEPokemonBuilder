const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadWorker(fileName) {
  const workerPath = path.join(__dirname, fileName);
  const messages = [];
  const context = {
    self: {
      postMessage(message) { messages.push(message); },
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(workerPath, 'utf8'), context, { filename: workerPath });
  context.workerMessages = messages;
  return context;
}

function runRngSearch(nature) {
  const worker = loadWorker('rng-worker.js');
  worker.self.onmessage({
    data: {
      nature,
      ability: -1,
      genderThreshold: -1,
      targetGender: 3,
      tid: 0,
      sid: 0,
      wantShiny: false,
      minIVs: [31, 31, 31, 30, 30, 30],
      maxIVs: [31, 31, 31, 31, 31, 31],
      methods: [true, true, true],
      maxResults: 100,
      targetSpecies: 0,
      slotTables: null,
      gameId: 3,
    },
  });
  return worker.workerMessages.find(message => message.type === 'done')?.results || [];
}

for (const workerFile of ['rng-worker.js', 'cxd-worker.js', 'bacd-worker.js', 'channel-worker.js']) {
  const worker = loadWorker(workerFile);
  assert.equal(worker.matchesNature(26, 1), true, `${workerFile} should accept a matching fixed nature`);
  assert.equal(worker.matchesNature(26, 2), false, `${workerFile} should reject a different fixed nature`);
  assert.equal(worker.matchesNature(26, -1), true, `${workerFile} should accept nature -1 as the wildcard`);
}

const rngWorker = loadWorker('rng-worker.js');
assert.equal(
  rngWorker.checkPid(26, -1, -1, -1, 3, 0, false, -1, 'any'),
  true,
  'the standard Gen III PID filter should accept any derived nature in wildcard mode',
);

const cxdWorker = loadWorker('cxd-worker.js');
assert.equal(
  cxdWorker.checkPid(26, -1, -1, -1, 3, 0, false, 0),
  true,
  'the GameCube PID filter should accept any derived nature in wildcard mode',
);

const bacdWorker = loadWorker('bacd-worker.js');
assert.equal(bacdWorker.normalizeBACDSearchParams({ nature: -1 }).nature, -1);
assert.equal(
  bacdWorker.passesFilters(
    { pid: 26, ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } },
    {
      nature: -1,
      ability: -1,
      genderThreshold: -1,
      targetGender: 3,
      tid: 0,
      sid: 0,
      wantShiny: false,
      minIVs: [0, 0, 0, 0, 0, 0],
      maxIVs: [31, 31, 31, 31, 31, 31],
    },
  ),
  true,
  'the BACD result filter should preserve and accept the wildcard nature',
);

const wildcardResults = runRngSearch(-1);
assert.ok(wildcardResults.length > 0, 'an any-nature search should return actual PID results');
assert.ok(
  new Set(wildcardResults.map(result => result.pid % 25)).size > 1,
  'one any-nature search should return multiple derived natures without launching 25 searches',
);
const fixedNature = wildcardResults[0].pid % 25;
const fixedResults = runRngSearch(fixedNature);
assert.ok(fixedResults.length > 0);
assert.ok(
  fixedResults.every(result => result.pid % 25 === fixedNature),
  'a fixed-nature search should retain the previous filtering behaviour',
);

console.log('PID Finder any-nature worker tests passed');
