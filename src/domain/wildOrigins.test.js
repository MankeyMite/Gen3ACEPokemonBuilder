import assert from 'node:assert/strict';
import { getWildOriginEncounters, getWildOriginSpeciesIds, sortWildOriginLocations } from './wildOrigins.js';
import { getMinimumLevelForEncounterEvolution } from './encounterAvailability.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';

assert.deepEqual(getWildOriginSpeciesIds(65), [64, 63]);
assert.deepEqual(getWildOriginSpeciesIds(65, 4, 124), [63], 'Route 24 Alakazam originates as Abra');
assert.deepEqual(getWildOriginSpeciesIds(65, 4, 141), [64], 'Cerulean Cave still supports Kadabra');
assert.deepEqual(getWildOriginSpeciesIds(65, 3, 31), [63], 'Abra also enables Emerald origins for Alakazam');
assert.deepEqual(getWildOriginSpeciesIds(30, 4, 103, 6), [29], 'Route 3 Nidorina originates as Nidoran');
assert.deepEqual(getWildOriginSpeciesIds(30, 4, 136, 30), [30, 29], 'shared locations retain both sources');
assert.deepEqual(getWildOriginSpeciesIds(30, 4, 103, 30), [], 'source levels are location-specific');
assert.deepEqual(getWildOriginSpeciesIds(30, 3), [], 'unavailable games remain unavailable');
assert.equal(getMinimumLevelForEncounterEvolution(30, 29, 6), 16);
assert.equal(getMinimumLevelForEncounterEvolution(65, 63, 8), 16);
assert.deepEqual(getWildOriginEncounters(30)[4][136], [[24, 24], [30, 31]], 'merge overlapping ranges without filling gaps');
assert.ok(getWildOriginEncounters(169)[3][210], 'Crobat includes Zubat Altering Cave origins');
assert.deepEqual(getWildOriginEncounters(150), {});
assert.deepEqual(sortWildOriginLocations(30, 4, [[103, 'Route 3'], [136, 'Safari Zone']]),
  [[136, 'Safari Zone'], [103, 'Route 3']], 'Nidorina locations precede Nidoran routes');
assert.deepEqual(sortWildOriginLocations(65, 4, [[124, 'Route 24'], [125, 'Route 25'], [141, 'Cerulean Cave']]),
  [[141, 'Cerulean Cave'], [124, 'Route 24'], [125, 'Route 25']], 'Alakazam prefers nearest ancestor Kadabra');

// Every real lineage encounter and level must survive the union. No game,
// location or capture level may be introduced without a corresponding source.
for (const species of [30, 31, 34, 65, 76, 130, 169, 184, 292, 303]) {
  const union = getWildOriginEncounters(species);
  for (const source of getWildOriginSpeciesIds(species)) {
    for (const [game, locations] of Object.entries(WILD_ENCOUNTERS[source])) {
      for (const [location, ranges] of Object.entries(locations)) {
        for (const [lo, hi = lo] of ranges) {
          for (let level = lo; level <= hi; level++) {
            assert(union[game][location].some(([a, b]) => level >= a && level <= b));
          }
        }
      }
    }
  }
  for (const [game, locations] of Object.entries(union)) {
    for (const [location, ranges] of Object.entries(locations)) {
      for (const [lo, hi] of ranges) {
        for (let level = lo; level <= hi; level++) {
          assert(getWildOriginSpeciesIds(species, game, location, level).length > 0);
        }
      }
    }
  }
}
console.log('Wild evolution origin tests passed');
