import assert from 'node:assert/strict';

import { ENCOUNTER_SLOTS } from './encounterSlots.gen3.js';
import { WILD_ENCOUNTERS } from './wildEncounters.gen3.js';

const ZUBAT_SPECIES_ID = 41;
const EMERALD_ALTERING_CAVE_LOCATION_ID = 210;
const FRLG_ALTERING_CAVE_LOCATION_ID = 183;
const UNRELEASED_ALTERING_CAVE_SPECIES_IDS = [179, 190, 204, 213, 216, 228, 234, 235];

function getSlotSpecies(gameId, locationId) {
  const encounterTypes = ENCOUNTER_SLOTS[gameId]?.[locationId] || {};
  return Object.values(encounterTypes)
    .flatMap(tables => tables)
    .flatMap(table => table)
    .map(([speciesId]) => Number(speciesId));
}

for (const speciesId of UNRELEASED_ALTERING_CAVE_SPECIES_IDS) {
  assert.equal(
    WILD_ENCOUNTERS[speciesId]?.[3]?.[EMERALD_ALTERING_CAVE_LOCATION_ID],
    undefined,
    `species ${speciesId} must not appear in Emerald Altering Cave`
  );
  for (const gameId of [4, 5]) {
    assert.equal(
      WILD_ENCOUNTERS[speciesId]?.[gameId]?.[FRLG_ALTERING_CAVE_LOCATION_ID],
      undefined,
      `species ${speciesId} must not appear in FR/LG Altering Cave`
    );
  }
}

for (const [gameId, locationId] of [
  [3, EMERALD_ALTERING_CAVE_LOCATION_ID],
  [4, FRLG_ALTERING_CAVE_LOCATION_ID],
  [5, FRLG_ALTERING_CAVE_LOCATION_ID],
]) {
  const slotSpecies = getSlotSpecies(gameId, locationId);
  assert.ok(slotSpecies.includes(ZUBAT_SPECIES_ID), `Zubat should remain in Altering Cave for game ${gameId}`);
  for (const speciesId of UNRELEASED_ALTERING_CAVE_SPECIES_IDS) {
    assert.ok(!slotSpecies.includes(speciesId), `species ${speciesId} must be absent from game ${gameId} slot tables`);
  }
}

assert.ok(
  WILD_ENCOUNTERS[179]?.[3]?.[57],
  'Removing Altering Cave Mareep must not remove its released Emerald Safari Zone encounter'
);
assert.ok(
  WILD_ENCOUNTERS[235]?.[3]?.[202],
  'Removing Altering Cave Smeargle must not remove its released Emerald Artisan Cave encounter'
);

console.log('wild encounter Altering Cave tests passed');
