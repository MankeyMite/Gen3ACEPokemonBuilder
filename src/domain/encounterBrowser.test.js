import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { SPECIES } from '../data/species.gen3.js';
import {
  MYSTERY_GIFT_EVENTS_SUPPLEMENTAL,
  MYSTERY_GIFT_POKEMON_SUPPLEMENTAL,
} from '../data/mysteryGiftsSupplemental.gen3.js';
import { ROAMER_SPECIES } from '../data/roamers.gen3.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';
import {
  getCXDEncountersForSpecies,
  getStaticEncountersForSpecies,
  getXDTradesForSpecies,
} from './encounterAvailability.js';
import {
  ENCOUNTER_BROWSE_CATEGORIES,
  getEncounterBrowseCategory,
  getEncounterBrowseOriginMode,
  getSpeciesForEncounterBrowseCategory,
} from './encounterBrowser.js';

const mysteryData = JSON.parse(await readFile(
  new URL('../data/Mystery gift pokemon gen 3.json', import.meta.url),
  'utf8'
));
const mysteryEvents = { ...(mysteryData.events || {}), ...MYSTERY_GIFT_EVENTS_SUPPLEMENTAL };
const mysteryGifts = {};
for (const entry of [...(mysteryData.pokemon || []), ...MYSTERY_GIFT_POKEMON_SUPPLEMENTAL]) {
  if (!entry?.tag) continue;
  if (!mysteryGifts[entry.tag]) mysteryGifts[entry.tag] = [];
  mysteryGifts[entry.tag].push(entry);
}
const context = { mysteryEvents, mysteryGifts };
const directMysterySpecies = new Set();
for (const event of Object.values(mysteryEvents)) {
  for (const speciesId of event?.species || []) directMysterySpecies.add(Number(speciesId));
}
for (const entries of Object.values(mysteryGifts)) {
  for (const entry of entries) directMysterySpecies.add(Number(entry.species));
}
const speciesByName = new Map(SPECIES.map(([id, name]) => [String(name), Number(id)]));
const idsFor = category => new Set(
  getSpeciesForEncounterBrowseCategory(category, context).map(([id]) => Number(id))
);

assert.equal(new Set(ENCOUNTER_BROWSE_CATEGORIES.map(item => item.id)).size, ENCOUNTER_BROWSE_CATEGORIES.length);
assert.equal(getEncounterBrowseOriginMode('event_distributions'), 'mystery');
assert.equal(getEncounterBrowseOriginMode('in_game_events'), 'static');
assert.equal(getEncounterBrowseOriginMode('colosseum'), 'cxd_shadow');
assert.equal(getEncounterBrowseOriginMode('xd'), 'cxd_shadow');
assert.equal(getEncounterBrowseOriginMode('missing'), '');
assert.equal(getEncounterBrowseCategory('missing'), null);

assert.ok(idsFor('event_distributions').has(speciesByName.get('Jirachi')));
assert.ok(idsFor('in_game_events').has(speciesByName.get('Bulbasaur')));
assert.ok(idsFor('in_game_trades').has(speciesByName.get('Shuckle')));
assert.ok(idsFor('colosseum').has(speciesByName.get('Espeon')));
assert.ok(idsFor('xd').has(speciesByName.get('Eevee')));
assert.ok(idsFor('roamers').has(speciesByName.get('Latios')));
assert.ok(idsFor('wild').has(speciesByName.get('Pidgey')));
assert.ok(idsFor('hatched').has(speciesByName.get('Pikachu')));

for (const speciesId of idsFor('event_distributions')) {
  assert.ok(directMysterySpecies.has(speciesId), `Mystery browser entry ${speciesId} must be directly distributed`);
}
for (const speciesId of idsFor('in_game_events')) {
  assert.ok(
    getStaticEncountersForSpecies(speciesId).some(encounter => Number(encounter.species) === speciesId),
    `Static browser entry ${speciesId} must be directly encountered`
  );
}
for (const speciesId of idsFor('in_game_trades')) {
  assert.ok(
    getXDTradesForSpecies(speciesId).some(encounter => Number(encounter.species) === speciesId),
    `Trade browser entry ${speciesId} must be directly received`
  );
}
for (const [speciesId] of getSpeciesForEncounterBrowseCategory('colosseum', context)) {
  assert.ok(
    getCXDEncountersForSpecies(speciesId)
      .some(encounter => encounter.game === 'colo' && Number(encounter.species) === Number(speciesId)),
    `Colosseum browser entry ${speciesId} must have a Colosseum encounter`
  );
}
for (const [speciesId] of getSpeciesForEncounterBrowseCategory('xd', context)) {
  assert.ok(
    getCXDEncountersForSpecies(speciesId)
      .some(encounter => encounter.game === 'xd' && Number(encounter.species) === Number(speciesId)),
    `XD browser entry ${speciesId} must have an XD encounter`
  );
}
for (const speciesId of idsFor('roamers')) assert.ok(ROAMER_SPECIES[speciesId]);
for (const speciesId of idsFor('wild')) assert.ok(WILD_ENCOUNTERS[speciesId]);

const indexMarkup = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
assert.match(indexMarkup, /id="encounterBrowseCategory"/);
assert.match(indexMarkup, /id="encounterBrowseSpecies"/);
assert.match(indexMarkup, /id="encounterBrowseStatus"[^>]*aria-live="polite"/);
assert.match(indexMarkup, /<option value="">Encounter type<\/option>/);
assert.match(indexMarkup, /<option value="">Available Pokémon<\/option>/);

console.log('encounter browser tests passed');
