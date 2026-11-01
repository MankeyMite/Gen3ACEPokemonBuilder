import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { ENCOUNTER_SLOTS } from '../../data/encounterSlots.gen3.js';

const source = fs.readFileSync(new URL('./rng-worker.js', import.meta.url), 'utf8');
const messages = [];
const worker = { self: { postMessage: message => messages.push(message) } };
vm.createContext(worker);
vm.runInContext(source, worker);
const startSearch = worker.self.onmessage;
const next = seed => (Math.imul(seed, 0x41C64E6D) + 0x6073) >>> 0;
const base = {
  startSeed: 0, endSeed: 12000, nature: -1, ability: -1,
  genderThreshold: 127, targetGender: 2, tid: 16669, sid: 61226,
  wantShiny: false, minIVs: [0, 0, 0, 0, 0, 0],
  maxIVs: [31, 31, 31, 31, 31, 31], methods: [true, true, true], maxResults: 60,
};
function search(params) {
  messages.length = 0;
  startSearch({ data: { ...base, ...params } });
  const done = messages.find(message => message.type === 'done');
  assert.ok(done, 'search completes');
  return done.results;
}

// Independently replay forward from the reported encounter seed, including
// activation, slot, level, nature rejection, and the IV calls for each method.
const chances = { l: [20,20,10,10,10,10,5,5,4,4,1,1], w: [60,30,5,4,1],
  r: [60,30,5,4,1], o: [70,30], g: [60,20,20], s: [40,40,15,4,1] };
function replay(result, type, table, species, syncMode = 'none', unownForm = -1) {
  let seed = result.initSeed;
  const rand = () => { seed = next(seed); return seed >>> 16; };
  if (type === 'r' && rand() % 2880 >= table[0][3] * 24) return false;
  let roll = rand() % 100;
  let slot = 0;
  while (roll >= chances[type][slot]) roll -= chances[type][slot++];
  if (table[slot][0] !== species) return false;
  const level = table[slot][1] + rand() % (table[slot][2] - table[slot][1] + 1);
  if (!result.metLevels.includes(level)) return false;
  let nature;
  if (unownForm < 0) {
    if (syncMode !== 'none') {
      const success = (rand() & 1) === 0;
      if (success !== (syncMode === 'success')) return false;
    }
    nature = syncMode === 'success' ? result.pid % 25 : rand() % 25;
  }
  let pid;
  for (let tries = 0; tries <= 660; tries++) {
    const first = rand(), second = rand();
    pid = unownForm < 0 ? ((second << 16) | first) >>> 0 : ((first << 16) | second) >>> 0;
    const form = (((pid >>> 24 & 3) << 6) | ((pid >>> 16 & 3) << 4) |
      ((pid >>> 8 & 3) << 2) | (pid & 3)) % 28;
    if (unownForm < 0 ? pid % 25 === nature : form === unownForm) break;
  }
  if (pid !== result.pid) return false;
  if (result.method === 'H2') rand();
  const iv1 = rand();
  if (result.method === 'H4') rand();
  const iv2 = rand();
  return JSON.stringify({ hp: iv1 & 31, atk: iv1 >>> 5 & 31, def: iv1 >>> 10 & 31,
    spa: iv2 >>> 5 & 31, spd: iv2 >>> 10 & 31, spe: iv2 & 31 }) === JSON.stringify(result.ivs);
}

// Reported shiny Adamant male Sturdy Graveler/Golem: this PID's only
// Rock Tunnel chain rolls 1605; even White Flute's maximum threshold is 1200.
for (const gameId of [4, 5]) {
  const params = { gameId, slotTables: ENCOUNTER_SLOTS[gameId][138], targetSpecies: 75,
    nature: 3, ability: 1, targetGender: 1, wantShiny: true,
    startSeed: 0xF7D1F8F4, endSeed: 0xF7D1F8F5 };
  assert.equal(search(params).length, 0, `FR/LG ${gameId} brute search rejects PID 50C8FEF9`);
  for (const ivs of [[29,30,18,22,31,27], [27,22,31,22,13,3], [29,30,18,22,13,3]]) {
    assert.ok(search({ ...params, minIVs: ivs, maxIVs: ivs }).every(r => r.pid !== 0x50C8FEF9),
      `FR/LG ${gameId} IV recovery rejects PID 50C8FEF9`);
  }
}

const fixtures = [];
// Activation boundaries and the reported seed must include the activation
// call. Missing rate data cannot establish a possible Rock Smash encounter.
for (const areaRate of [20, 25, 50]) {
  for (const roll of [areaRate * 24 - 1, areaRate * 24]) {
    const activationState = (roll << 16) >>> 0;
    const table = Array.from({ length: 5 }, () => [75, 25, 40, areaRate]);
    const result = worker.checkSlotWithLevel(next(activationState), { r: new Set([0,1,2,3,4]) }, { r: [table] }, 75);
    assert.equal(Boolean(result), roll < areaRate * 24);
    if (result) assert.equal(next(result.initSeed), activationState);
  }
}
assert.equal(worker.checkSlotWithLevel(next(0), { r: new Set([0,1,2,3,4]) },
  { r: [Array.from({ length: 5 }, () => [75, 25, 40])] }, 75), null);

for (const gameId of [1, 2, 3, 4, 5]) {
  const hoenn = gameId <= 3;
  for (const [type, location, species] of [
    ['r', hoenn ? 55 : 138, hoenn ? 74 : 75],
    ['l', hoenn ? 16 : 101, hoenn ? 288 : 16],
    ['w', hoenn ? 2 : 88, 72],
    ['o', hoenn ? 2 : 88, 129],
    ['g', hoenn ? 2 : 88, 129],
    ['s', hoenn ? 2 : 88, ENCOUNTER_SLOTS[gameId][hoenn ? 2 : 88].s[0][0][0]],
  ]) {
    const tables = ENCOUNTER_SLOTS[gameId][location][type];
    assert.ok(tables, `${gameId}/${location}/${type} has tables`);
    const results = search({ gameId, slotTables: { [type]: tables }, targetSpecies: species });
    assert.ok(results.length > 0, `${gameId}/${type} retains valid results`);
    for (const method of ['H1', 'H2', 'H4']) assert.ok(results.some(r => r.method === method));
    for (const result of results) {
      const modes = gameId === 3 ? ['none', 'success', 'fail'] : ['none'];
      assert.ok(tables.some(table => modes.some(mode => replay(result, type, table, species, mode))),
        `${gameId}/${type}/${result.method} ${result.pid.toString(16)} replays on the game's RNG`);
      fixtures.push({ gameId, location, species, type, ...result });
    }
    // IV recovery must enforce the same encounter constraints as brute search.
    const sample = results[0];
    const ivs = ['hp','atk','def','spa','spd','spe'].map(key => sample.ivs[key]);
    const recovered = search({ gameId, slotTables: { [type]: tables }, targetSpecies: species,
      minIVs: ivs, maxIVs: ivs });
    assert.ok(recovered.some(r => r.pid === sample.pid && r.method === sample.method));
    for (const result of recovered) {
      const modes = gameId === 3 ? ['none', 'success', 'fail'] : ['none'];
      assert.ok(tables.some(table => modes.some(mode => replay(result, type, table, species, mode))));
      fixtures.push({ gameId, location, species, type, ...result });
    }
  }
  assert.equal(search({ gameId, slotTables: ENCOUNTER_SLOTS[gameId][hoenn ? 16 : 101],
    targetSpecies: 150 }).length, 0, 'missing species slots must not bypass validation');
  assert.equal(search({ gameId, slotTables: ENCOUNTER_SLOTS[gameId][hoenn ? 16 : 101],
    targetSpecies: 150, minIVs: [31,31,31,31,31,31] }).length, 0,
  'IV recovery must also reject missing species slots');
}

// Check every Rock Smash sub-map's activation metadata, including different
// rates in FR/LG (25, 50) and RSE (20, 25).
for (const locations of Object.values(ENCOUNTER_SLOTS)) {
  for (const types of Object.values(locations)) {
    for (const table of types.r || []) {
      assert.equal(table.length, 5);
      for (const slot of table) assert.ok([20,25,50].includes(slot[3]));
    }
  }
}

if (process.env.PKHEX_RNG_FIXTURES) fs.writeFileSync(process.env.PKHEX_RNG_FIXTURES, JSON.stringify(fixtures));
console.log(`Wild encounter RNG tests passed: ${fixtures.length} results across FR/LG and RSE, H1/H2/H4, both search paths.`);
