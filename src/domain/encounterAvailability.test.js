import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { SPECIES } from '../data/species.gen3.js';
import {
  STATIC_ENCOUNTER_LIST,
  STATIC_SPECIES_SET,
  isLegendary,
} from '../data/staticEncounters.gen3.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';
import { PRE_EVOLUTIONS, buildWildWithEvolutions } from '../data/evolutions.gen3.js';
import {
  CXD_SHADOW_SPECIES,
  getShadowEncountersForSpecies as getForwardShadowEncountersForSpecies,
} from '../data/shadowEncounters.gen3.js';
import {
  CXD_TRADE_SPECIES,
  getCXDTradesForSpecies as getForwardXDTradesForSpecies,
} from '../data/cxdTrades.gen3.js';
import { ROAMER_SPECIES_SET } from '../data/roamers.gen3.js';
import {
  NORMAL_ORIGIN_MODES,
  getAvailableOriginsForSpecies,
  getMinimumLevelForEncounterEvolution,
  getMysteryEventsForSpecies,
  getOriginDefinition,
  getOriginTransitionForSpecies,
  getShadowEncountersForSpecies,
  getSpeciesLineage,
  getSpeciesForOrigin,
  getStaticEncountersForSpecies,
  getXDTradesForSpecies,
  isSpeciesAvailableForOrigin,
  isSupportedSpecies,
  reconcileOriginForSpecies,
} from './encounterAvailability.js';

const mysteryData = JSON.parse(await readFile(
  new URL('../data/Mystery gift pokemon gen 3.json', import.meta.url),
  'utf8'
));
const mysteryEvents = mysteryData.events || {};
const mysteryGifts = {};
for (const entry of mysteryData.pokemon || []) {
  if (!entry?.tag) continue;
  if (!mysteryGifts[entry.tag]) mysteryGifts[entry.tag] = [];
  mysteryGifts[entry.tag].push(entry);
}
const context = { mysteryEvents, mysteryGifts };
const wildPlusEvolutions = buildWildWithEvolutions(WILD_ENCOUNTERS);
const speciesByName = new Map(SPECIES.map(([id, name]) => [String(name).toLowerCase(), Number(id)]));

function speciesId(name) {
  const id = speciesByName.get(String(name).toLowerCase());
  assert.ok(id, `Expected species named ${name}`);
  return id;
}

function modesFor(id) {
  return new Set(getAvailableOriginsForSpecies(id, context).map(origin => origin.mode));
}

function lineageFor(id) {
  const result = [];
  const visited = new Set();
  let current = Number(id) || 0;
  while (current && !visited.has(current)) {
    result.push(current);
    visited.add(current);
    current = Number(PRE_EVOLUTIONS[current]) || 0;
  }
  return result;
}

assert.equal(getOriginDefinition('hatched')?.label, 'Hatched / evolved from an Egg');
assert.equal(getOriginDefinition('wild')?.label, 'Wild-caught / evolved from wild');
assert.equal(getOriginDefinition('static')?.label, 'Static encounter');
assert.equal(getOriginDefinition('roamer')?.label, 'Roamer');
assert.equal(getOriginDefinition('mystery')?.label, 'Mystery Gift');
assert.equal(getOriginDefinition('cxd_shadow')?.label, 'Pokémon Colosseum / XD');

// The reverse lookup must agree with the data-backed forward filters for every species.
for (const [rawId, name] of SPECIES) {
  const id = Number(rawId);
  const supported = id > 0 && !String(name || '').includes('?');
  const lineage = lineageFor(id);
  const expectedByMode = {
    hatched: supported && !isLegendary(id) && id !== 132 && id !== 201,
    wild: supported && wildPlusEvolutions.has(id),
    static: supported && lineage.some(sourceId => STATIC_SPECIES_SET.has(sourceId)),
    roamer: supported && lineage.some(sourceId => ROAMER_SPECIES_SET.has(sourceId)),
    mystery: supported && Object.values(mysteryEvents).some(event =>
      Array.isArray(event?.species) && event.species.map(Number).some(sourceId => lineage.includes(sourceId))
    ),
    cxd_shadow: supported && lineage.some(sourceId => CXD_SHADOW_SPECIES.has(sourceId)),
    cxd_trade: supported && lineage.some(sourceId => CXD_TRADE_SPECIES.has(sourceId)),
  };

  assert.equal(isSupportedSpecies(id), supported, `${name} support status differs`);
  for (const mode of NORMAL_ORIGIN_MODES) {
    assert.equal(
      isSpeciesAvailableForOrigin(id, mode, context),
      expectedByMode[mode],
      `${name} differs for ${mode}`
    );
    assert.equal(
      getSpeciesForOrigin(mode, context).some(([candidateId]) => Number(candidateId) === id),
      expectedByMode[mode],
      `${name} forward list differs for ${mode}`
    );
  }

  assert.deepEqual(
    getStaticEncountersForSpecies(id),
    STATIC_ENCOUNTER_LIST.filter(encounter => lineage.includes(Number(encounter.species))),
    `${name} static exact encounters differ from the existing data`
  );
  assert.deepEqual(
    getShadowEncountersForSpecies(id),
    lineage.flatMap(sourceId => getForwardShadowEncountersForSpecies(sourceId)),
    `${name} shadow exact encounters differ from the existing helper`
  );
  assert.deepEqual(
    getXDTradesForSpecies(id),
    lineage.flatMap(sourceId => getForwardXDTradesForSpecies(sourceId)),
    `${name} XD trade encounters differ from the existing helper`
  );
}

for (const [tag, event] of Object.entries(mysteryEvents)) {
  for (const id of event?.species || []) {
    assert.ok(
      getMysteryEventsForSpecies(Number(id), mysteryEvents, mysteryGifts)
        .some(candidate => candidate.tag === tag),
      `Mystery event ${tag} should remain available for species ${id}`
    );
  }
}

const pikachuModes = modesFor(speciesId('Pikachu'));
assert.ok(pikachuModes.has('hatched'), 'A normal breedable Pokémon should support Hatched');

const raichuModes = modesFor(speciesId('Raichu'));
assert.ok(raichuModes.has('hatched'), 'An evolved breedable Pokémon should support Hatched');

assert.ok(!modesFor(speciesId('Ditto')).has('hatched'), 'Ditto must not support Hatched');
assert.ok(!modesFor(speciesId('Unown')).has('hatched'), 'Unown must not support Hatched');

const pidgeyId = speciesId('Pidgey');
assert.ok(modesFor(pidgeyId).has('wild'), 'A directly wild Pokémon should support Wild');

const evolvedFromWild = SPECIES.find(([id, name]) =>
  isSupportedSpecies(id) && wildPlusEvolutions.has(Number(id)) && !WILD_ENCOUNTERS[Number(id)] && !String(name).includes('?')
);
assert.ok(evolvedFromWild, 'Expected at least one evolved-from-wild species');
assert.ok(modesFor(Number(evolvedFromWild[0])).has('wild'), `${evolvedFromWild[1]} should support evolved-from-wild`);

assert.ok(modesFor(speciesId('Mewtwo')).has('static'), 'A static legendary should support Static');
assert.ok(modesFor(speciesId('Latios')).has('roamer'), 'A roamer should support Roamer');

const mewEvents = getMysteryEventsForSpecies(speciesId('Mew'), mysteryEvents, mysteryGifts).map(item => item.tag);
assert.deepEqual(mewEvents, ['AURA_MEW', 'MYSTRY_MEW']);
assert.ok(!modesFor(speciesId('Mew')).has('hatched'), 'Mew must not support Hatched');

const jirachiEvents = getMysteryEventsForSpecies(speciesId('Jirachi'), mysteryEvents, mysteryGifts).map(item => item.tag);
assert.deepEqual(jirachiEvents, ['CHANNEL_JIRACHI', 'WISHMKR_BEST', 'WISHMKR_SHINY']);

const deoxysEvents = getMysteryEventsForSpecies(speciesId('Deoxys'), mysteryEvents, mysteryGifts).map(item => item.tag);
assert.deepEqual(deoxysEvents, ['DOEL_DEOXYS', 'SPACE_CENTER_DEOXYS']);

const metangEvents = getMysteryEventsForSpecies(speciesId('Metang'), mysteryEvents, mysteryGifts).map(item => item.tag);
assert.deepEqual(metangEvents, ['POKEMON_ROCKS_METANG']);

const venusaurId = speciesId('Venusaur');
const bulbasaurId = speciesId('Bulbasaur');
const venusaurStaticEncounters = getStaticEncountersForSpecies(venusaurId);
assert.ok(modesFor(venusaurId).has('static'), 'Venusaur should inherit Static from Bulbasaur');
assert.ok(
  venusaurStaticEncounters.some(encounter => Number(encounter.species) === bulbasaurId),
  'Venusaur should expose the FR/LG Bulbasaur static encounter'
);
assert.equal(
  getMinimumLevelForEncounterEvolution(venusaurId, bulbasaurId, 5),
  32,
  'Static Bulbasaur must reach level 32 before it can be Venusaur'
);

const metagrossId = speciesId('Metagross');
const metagrossRocksEvent = getMysteryEventsForSpecies(metagrossId, mysteryEvents, mysteryGifts)
  .find(item => item.tag === 'POKEMON_ROCKS_METANG');
assert.ok(metagrossRocksEvent, 'Metagross should inherit the Pokémon Rocks Metang distribution');
assert.deepEqual(metagrossRocksEvent.sourceSpeciesIds, [speciesId('Metang')]);
assert.equal(
  getMinimumLevelForEncounterEvolution(metagrossId, speciesId('Metang'), 30),
  45,
  'Pokémon Rocks Metang must reach level 45 before it can be Metagross'
);

const electabuzzId = speciesId('Electabuzz');
assert.ok(
  getXDTradesForSpecies(electabuzzId).some(encounter => Number(encounter.species) === speciesId('Elekid')),
  'Electabuzz should inherit the XD Hordel Elekid trade'
);
assert.ok(modesFor(electabuzzId).has('cxd_trade'));

const tyranitarId = speciesId('Tyranitar');
assert.ok(
  getXDTradesForSpecies(tyranitarId).some(encounter => Number(encounter.species) === speciesId('Larvitar')),
  'Tyranitar should inherit the XD Duking Larvitar trade'
);
assert.equal(getMinimumLevelForEncounterEvolution(tyranitarId, speciesId('Larvitar'), 20), 55);

const shadowSpeciesId = [...CXD_SHADOW_SPECIES][0];
assert.ok(getShadowEncountersForSpecies(shadowSpeciesId).length > 0);
assert.ok(modesFor(shadowSpeciesId).has('cxd_shadow'), 'A shadow species should support Colosseum/XD');

const evolvedShadowSpecies = SPECIES.find(([id, name]) => {
  const targetId = Number(id);
  return isSupportedSpecies(targetId) &&
    !CXD_SHADOW_SPECIES.has(targetId) &&
    getShadowEncountersForSpecies(targetId).some(encounter => Number(encounter.species) !== targetId) &&
    !String(name).includes('?');
});
assert.ok(evolvedShadowSpecies, 'Expected an evolution of a Shadow encounter species');
assert.ok(modesFor(Number(evolvedShadowSpecies[0])).has('cxd_shadow'));

assert.deepEqual(getSpeciesLineage(venusaurId), [venusaurId, speciesId('Ivysaur'), bulbasaurId]);

const shuckleId = speciesId('Shuckle');
const shuckleModes = modesFor(shuckleId);
assert.ok(shuckleModes.size > 1, 'A species with several valid origins should expose several choices');
assert.ok(shuckleModes.has('cxd_shadow'), 'Shuckle should expose its shadow encounter');
assert.ok(shuckleModes.has('cxd_trade'), 'Shuckle should expose its XD in-game trade');

assert.ok(getStaticEncountersForSpecies(speciesId('Snorlax')).length >= 2, 'Static reverse lookup should keep exact encounters');

assert.equal(reconcileOriginForSpecies(speciesId('Raichu'), 'hatched', context), 'hatched');
assert.equal(reconcileOriginForSpecies(speciesId('Mew'), 'hatched', context), '');
assert.equal(reconcileOriginForSpecies(speciesId('Mew'), 'imported', context), 'imported');

assert.deepEqual(
  getOriginTransitionForSpecies(speciesId('Raichu'), 'hatched', context),
  { mode: 'hatched', preserved: true, requiresExactEncounter: false, applyAutomaticPreset: true },
  'Changing to a species that still supports the origin should preserve it'
);
assert.deepEqual(
  getOriginTransitionForSpecies(speciesId('Mew'), 'hatched', context),
  { mode: '', preserved: false, requiresExactEncounter: false, applyAutomaticPreset: false },
  'Changing to a species that rejects the origin should clear it'
);
assert.equal(
  getOriginTransitionForSpecies(speciesId('Mewtwo'), 'static', context).applyAutomaticPreset,
  false,
  'Exact static presets must wait for encounter selection'
);
assert.equal(
  getOriginTransitionForSpecies(speciesId('Raichu'), 'hatched', { ...context, manualOverride: true }).applyAutomaticPreset,
  false,
  'Manual Mode must not receive an automatic preset during a species transition'
);

console.log('encounter availability tests passed');
