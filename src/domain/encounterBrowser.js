import {
  getCXDEncountersForSpecies,
  getSpeciesForOrigin,
  getStaticEncountersForSpecies,
  getSupportedSpecies,
  getXDTradesForSpecies,
} from './encounterAvailability.js';
import { STATIC_CATEGORIES } from '../data/staticEncounters.gen3.js';
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

const GAME_SUBCATEGORIES = Object.freeze([
  Object.freeze({ id: '1', label: 'Pokémon Sapphire' }),
  Object.freeze({ id: '2', label: 'Pokémon Ruby' }),
  Object.freeze({ id: '3', label: 'Pokémon Emerald' }),
  Object.freeze({ id: '4', label: 'Pokémon FireRed' }),
  Object.freeze({ id: '5', label: 'Pokémon LeafGreen' }),
]);

const SUBCATEGORIES_BY_SOURCE = Object.freeze({
  event_distributions: Object.freeze([
    Object.freeze({ id: 'international', label: 'International' }),
    Object.freeze({ id: 'pcny', label: 'PCNY' }),
    Object.freeze({ id: 'japanese', label: 'Japanese' }),
    Object.freeze({ id: 'gather_more', label: 'Gather More' }),
    Object.freeze({ id: 'game_based', label: 'Game-Based' }),
    Object.freeze({ id: 'colosseum', label: 'Colosseum' }),
    Object.freeze({ id: 'xd', label: 'XD' }),
  ]),
  in_game_events: Object.freeze(
    STATIC_CATEGORIES.map(category => Object.freeze({ id: category.id, label: category.label }))
  ),
  in_game_trades: Object.freeze([
    ...GAME_SUBCATEGORIES,
    Object.freeze({ id: '15', label: 'Pokémon XD' }),
  ]),
  colosseum: Object.freeze([
    Object.freeze({ id: 'shadow', label: 'Shadow Pokémon' }),
    Object.freeze({ id: 'starter', label: 'Starters' }),
    Object.freeze({ id: 'gift', label: 'Gifts' }),
    Object.freeze({ id: 'ereader', label: 'e-Reader encounters' }),
  ]),
  xd: Object.freeze([
    Object.freeze({ id: 'shadow', label: 'Shadow Pokémon' }),
    Object.freeze({ id: 'starter', label: 'Starter' }),
    Object.freeze({ id: 'gift', label: 'Gifts' }),
    Object.freeze({ id: 'pokespot', label: 'Poké Spot encounters' }),
  ]),
  roamers: GAME_SUBCATEGORIES,
  wild: GAME_SUBCATEGORIES,
  hatched: Object.freeze([
    Object.freeze({ id: 'all', label: 'All Egg-compatible Pokémon' }),
  ]),
});

export function getEncounterBrowseCategory(categoryId) {
  const category = CATEGORY_BY_ID.get(String(categoryId || ''));
  return category ? { ...category } : null;
}

export function getEncounterBrowseOriginMode(categoryId) {
  return getEncounterBrowseCategory(categoryId)?.originMode || '';
}

export function getEncounterBrowseSubcategories(categoryId) {
  return (SUBCATEGORIES_BY_SOURCE[String(categoryId || '')] || [])
    .map(subcategory => ({ ...subcategory }));
}

export function getEncounterBrowseSubcategory(categoryId, subcategoryId) {
  return getEncounterBrowseSubcategories(categoryId)
    .find(subcategory => subcategory.id === String(subcategoryId || '')) || null;
}

const COLOSSEUM_DISTRIBUTION_TAGS = new Set([
  'WISHMKR_BEST',
  'WISHMKR_SHINY',
  'AGETO_CELEBI',
]);

const GAME_BASED_DISTRIBUTION_TAGS = new Set([
  'BOX_EVENT',
  'CHANNEL_JIRACHI',
  'BERRY_PROGRAM_UPDATE_ZIGZAGOON',
  'BERRY_PROGRAM_UPDATE_ZIGZAGOON_RUBY',
  'JPN_BERRY_FIX_RUBY',
  'JPN_BERRY_FIX_SAPPHIRE',
]);

const JAPANESE_DISTRIBUTION_PREFIXES = Object.freeze([
  'JPN_',
  'PCJP_',
  'NEGAI_BOSHI_',
  'TANABATA_',
  'ANA_',
  'POKEPARK_',
  'HADOU_',
  'GW_',
  'SAPPORO_',
  'FESTA_',
  'SUNDAY_',
  'YOKOHAMA_',
  'MITSURIN_',
]);

/**
 * Maps the project's distribution tags to the browse taxonomy. Prefix checks
 * intentionally run after the special PCNY, Gather More, and game-disc groups.
 */
export function getEventDistributionSubcategoryId(tag, event = {}) {
  const normalizedTag = String(tag || '').trim().toUpperCase();
  const normalizedLabel = String(event?.label || '').trim().toUpperCase();

  if (normalizedTag.startsWith('PCNY_')) return 'pcny';
  if (normalizedTag.startsWith('PCJP_GATHER_MORE_')) return 'gather_more';
  if (COLOSSEUM_DISTRIBUTION_TAGS.has(normalizedTag)
      || normalizedTag.includes('COLOSSEUM_BONUS_DISC')) return 'colosseum';
  if (normalizedTag.startsWith('XD_')
      || normalizedLabel.includes('POKÉMON XD')
      || normalizedLabel.includes('POKEMON XD')) return 'xd';
  if (GAME_BASED_DISTRIBUTION_TAGS.has(normalizedTag)) return 'game_based';
  if (JAPANESE_DISTRIBUTION_PREFIXES.some(prefix => normalizedTag.startsWith(prefix))) {
    return 'japanese';
  }
  return 'international';
}

function getDirectMysterySpeciesIds(context, subcategoryId = '') {
  const speciesIds = new Set();
  for (const [tag, event] of Object.entries(context.mysteryEvents || {})) {
    if (subcategoryId && getEventDistributionSubcategoryId(tag, event) !== subcategoryId) continue;
    for (const speciesId of event?.species || []) speciesIds.add(Number(speciesId));
  }
  for (const [tag, entries] of Object.entries(context.mysteryGifts || {})) {
    const event = context.mysteryEvents?.[tag] || {};
    if (subcategoryId && getEventDistributionSubcategoryId(tag, event) !== subcategoryId) continue;
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

function isCxdSubcategoryMatch(encounter, subcategoryId) {
  if (subcategoryId === 'ereader') return Boolean(encounter.eReader);
  if (subcategoryId === 'shadow') return encounter.kind === 'shadow' && !encounter.eReader;
  return encounter.kind === subcategoryId;
}

export function getSpeciesForEncounterBrowseSelection(categoryId, subcategoryId, context = {}) {
  const category = CATEGORY_BY_ID.get(String(categoryId || ''));
  const subcategory = getEncounterBrowseSubcategory(categoryId, subcategoryId);
  if (!category || !subcategory) return [];

  const species = getSpeciesForEncounterBrowseCategory(categoryId, context);
  if (subcategory.id === 'all') return species;

  return species.filter(([speciesId]) => {
    const id = Number(speciesId);
    switch (category.id) {
      case 'event_distributions':
        return getDirectMysterySpeciesIds(context, subcategory.id).has(id);
      case 'in_game_events':
        return getStaticEncountersForSpecies(id)
          .some(encounter => Number(encounter.species) === id && encounter.category === subcategory.id);
      case 'in_game_trades':
        return getXDTradesForSpecies(id)
          .some(encounter => Number(encounter.species) === id && Number(encounter.originGame) === Number(subcategory.id));
      case 'colosseum':
      case 'xd':
        return getCXDEncountersForSpecies(id).some(encounter =>
          encounter.game === category.game
          && Number(encounter.species) === id
          && isCxdSubcategoryMatch(encounter, subcategory.id)
        );
      case 'roamers':
        return (ROAMER_SPECIES[id]?.games || []).map(Number).includes(Number(subcategory.id));
      case 'wild':
        return Boolean(WILD_ENCOUNTERS[id]?.[Number(subcategory.id)]);
      default:
        return true;
    }
  });
}
