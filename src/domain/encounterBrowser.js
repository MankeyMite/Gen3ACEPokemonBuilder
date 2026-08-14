import {
  getCXDEncountersForSpecies,
  getSpeciesForOrigin,
  getStaticEncountersForSpecies,
  getSupportedSpecies,
  getXDTradesForSpecies,
} from './encounterAvailability.js';
import { ROAMER_SPECIES } from '../data/roamers.gen3.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';

export const ENCOUNTER_BROWSE_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'event_distributions',
    label: 'Event distributions',
    originMode: 'mystery',
    description: 'official distributions and Mystery Gift Pokémon',
  }),
  Object.freeze({
    id: 'in_game_events',
    label: 'In-game events',
    originMode: 'static',
    description: 'starters, gifts, fossils, stationary Pokémon, and other in-game events',
  }),
  Object.freeze({
    id: 'in_game_trades',
    label: 'In-game trades',
    originMode: 'cxd_trade',
    description: 'NPC trades from the handheld games and Pokémon XD',
  }),
  Object.freeze({
    id: 'colosseum',
    label: 'Pokémon Colosseum',
    originMode: 'cxd_shadow',
    game: 'colo',
    description: 'Shadow, starter, gift, and e-Reader encounters from Pokémon Colosseum',
  }),
  Object.freeze({
    id: 'xd',
    label: 'Pokémon XD',
    originMode: 'cxd_shadow',
    game: 'xd',
    description: 'Shadow, starter, gift, and Poké Spot encounters from Pokémon XD',
  }),
  Object.freeze({
    id: 'roamers',
    label: 'Roaming Pokémon',
    originMode: 'roamer',
    description: 'Pokémon encountered directly as roamers',
  }),
  Object.freeze({
    id: 'wild',
    label: 'Wild encounters',
    originMode: 'wild',
    description: 'Pokémon found directly in Generation III wild encounter data',
  }),
  Object.freeze({
    id: 'hatched',
    label: 'Hatched / Egg Pokémon',
    originMode: 'hatched',
    description: 'Pokémon that can be bred or evolved from an Egg in Generation III',
  }),
]);

const CATEGORY_BY_ID = new Map(
  ENCOUNTER_BROWSE_CATEGORIES.map(category => [category.id, category])
);

export function getEncounterBrowseCategory(categoryId) {
  const category = CATEGORY_BY_ID.get(String(categoryId || ''));
  return category ? { ...category } : null;
}

export function getEncounterBrowseOriginMode(categoryId) {
  return getEncounterBrowseCategory(categoryId)?.originMode || '';
}

function getDirectMysterySpeciesIds(context) {
  const speciesIds = new Set();
  for (const event of Object.values(context.mysteryEvents || {})) {
    for (const speciesId of event?.species || []) speciesIds.add(Number(speciesId));
  }
  for (const entries of Object.values(context.mysteryGifts || {})) {
    for (const entry of entries || []) {
      if (entry?.species !== undefined) speciesIds.add(Number(entry.species));
    }
  }
  speciesIds.delete(0);
  return speciesIds;
}

export function getSpeciesForEncounterBrowseCategory(categoryId, context = {}) {
  const category = CATEGORY_BY_ID.get(String(categoryId || ''));
  if (!category) return [];

  const supportedSpecies = getSupportedSpecies();
  let species;
  switch (category.id) {
    case 'event_distributions': {
      const directSpeciesIds = getDirectMysterySpeciesIds(context);
      species = supportedSpecies.filter(([speciesId]) => directSpeciesIds.has(Number(speciesId)));
      break;
    }
    case 'in_game_events':
      species = supportedSpecies.filter(([speciesId]) =>
        getStaticEncountersForSpecies(Number(speciesId))
          .some(encounter => Number(encounter.species) === Number(speciesId))
      );
      break;
    case 'in_game_trades':
      species = supportedSpecies.filter(([speciesId]) =>
        getXDTradesForSpecies(Number(speciesId))
          .some(encounter => Number(encounter.species) === Number(speciesId))
      );
      break;
    case 'colosseum':
    case 'xd':
      species = supportedSpecies.filter(([speciesId]) =>
        getCXDEncountersForSpecies(Number(speciesId))
          .some(encounter => encounter.game === category.game && Number(encounter.species) === Number(speciesId))
      );
      break;
    case 'roamers':
      species = supportedSpecies.filter(([speciesId]) => Boolean(ROAMER_SPECIES[Number(speciesId)]));
      break;
    case 'wild':
      species = supportedSpecies.filter(([speciesId]) => Boolean(WILD_ENCOUNTERS[Number(speciesId)]));
      break;
    default:
      // Hatched browsing remains outcome-oriented because an evolved Pokémon
      // can legitimately originate from an Egg without a discrete encounter row.
      species = getSpeciesForOrigin(category.originMode, context);
  }

  return species
    .slice()
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
}
