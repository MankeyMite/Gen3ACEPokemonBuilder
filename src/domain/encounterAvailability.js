import { SPECIES } from '../data/species.gen3.js';
import {
  STATIC_ENCOUNTER_LIST,
  isLegendary,
} from '../data/staticEncounters.gen3.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';
import {
  PRE_EVOLUTIONS,
  PRE_EVOLUTION_DETAILS,
  buildWildWithEvolutions,
} from '../data/evolutions.gen3.js';
import {
  getShadowEncountersForSpecies as getExistingShadowEncountersForSpecies,
} from '../data/shadowEncounters.gen3.js';
import {
  getCXDTradesForSpecies,
} from '../data/cxdTrades.gen3.js';
import { getCXDSpecialEncountersForSpecies } from '../data/cxdSpecialEncounters.gen3.js';
import { ROAMER_SPECIES } from '../data/roamers.gen3.js';

export const NORMAL_ORIGIN_MODES = Object.freeze([
  'hatched',
  'wild',
  'static',
  'roamer',
  'mystery',
  'cxd_shadow',
  'cxd_trade',
]);

export const ORIGIN_DEFINITIONS = Object.freeze([
  {
    mode: 'hatched',
    label: 'Hatched / evolved from an Egg',
    requiresExactEncounter: false,
  },
  {
    mode: 'wild',
    label: 'Wild-caught / evolved from wild',
    requiresExactEncounter: false,
  },
  {
    mode: 'static',
    label: 'Static encounter',
    requiresExactEncounter: true,
  },
  {
    mode: 'roamer',
    label: 'Roamer',
    requiresExactEncounter: false,
  },
  {
    mode: 'mystery',
    label: 'Mystery Gift',
    requiresExactEncounter: true,
  },
  {
    mode: 'cxd_shadow',
    label: 'Pokémon Colosseum / XD',
    requiresExactEncounter: true,
  },
  {
    mode: 'cxd_trade',
    label: 'In-Game Trade',
    requiresExactEncounter: false,
  },
]);

const ORIGIN_DEFINITION_BY_MODE = new Map(
  ORIGIN_DEFINITIONS.map(definition => [definition.mode, definition])
);
const WILD_PLUS_EVOLUTIONS = buildWildWithEvolutions(WILD_ENCOUNTERS);
const SUPPORTED_SPECIES = SPECIES.filter(([speciesId, name]) =>
  Number(speciesId) > 0 && !String(name || '').includes('?')
);
const SUPPORTED_SPECIES_IDS = new Set(SUPPORTED_SPECIES.map(([speciesId]) => Number(speciesId)));
const LEVEL_EVOLUTION_METHODS = new Set([
  'EVO_LEVEL',
  'EVO_LEVEL_ATK_LT_DEF',
  'EVO_LEVEL_ATK_GT_DEF',
  'EVO_LEVEL_ATK_EQ_DEF',
  'EVO_LEVEL_SILCOON',
  'EVO_LEVEL_CASCOON',
  'EVO_LEVEL_NINJASK',
  'EVO_LEVEL_SHEDINJA',
]);
const LEVEL_UP_CONDITION_METHODS = new Set([
  'EVO_FRIENDSHIP',
  'EVO_FRIENDSHIP_DAY',
  'EVO_FRIENDSHIP_NIGHT',
  'EVO_BEAUTY',
]);

/** Return the selected species followed by each of its pre-evolutions. */
export function getSpeciesLineage(speciesId) {
  const lineage = [];
  const visited = new Set();
  let current = Number(speciesId) || 0;
  while (current > 0 && !visited.has(current)) {
    lineage.push(current);
    visited.add(current);
    current = Number(PRE_EVOLUTIONS[current]) || 0;
  }
  return lineage;
}

function getLineageSet(speciesId) {
  return new Set(getSpeciesLineage(speciesId));
}

/**
 * Return the lowest possible current level after evolving an encountered source
 * species into the selected species. Item and trade evolutions do not add a
 * level; level-up evolutions do.
 */
export function getMinimumLevelForEncounterEvolution(speciesId, sourceSpeciesId, sourceLevel = 1) {
  const targetId = Number(speciesId) || 0;
  const sourceId = Number(sourceSpeciesId) || 0;
  let level = Math.max(1, Math.min(100, Number(sourceLevel) || 1));
  if (!targetId || !sourceId || targetId === sourceId) return level;

  const path = [];
  const visited = new Set();
  let current = targetId;
  while (current !== sourceId && PRE_EVOLUTION_DETAILS[current] && !visited.has(current)) {
    visited.add(current);
    const detail = PRE_EVOLUTION_DETAILS[current];
    path.push(detail);
    current = Number(detail.pre) || 0;
  }
  if (current !== sourceId) return level;

  for (const step of path.reverse()) {
    if (LEVEL_EVOLUTION_METHODS.has(step.method)) {
      const threshold = Math.max(1, Number(step.param) || 1);
      level = level < threshold ? threshold : level + 1;
    } else if (LEVEL_UP_CONDITION_METHODS.has(step.method)) {
      level += 1;
    }
  }
  return Math.max(1, Math.min(100, level));
}

function normalizeMysteryKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function reverseMysteryKey(value) {
  return String(value || '')
    .split(/[_\- ]+/)
    .filter(Boolean)
    .reverse()
    .join('_');
}

function getGiftEntriesForEvent(tag, event, mysteryGifts) {
  const gifts = mysteryGifts || {};
  const directKeys = [tag, event?.presetTag, reverseMysteryKey(tag), reverseMysteryKey(event?.presetTag)]
    .filter(Boolean);
  for (const key of directKeys) {
    if (Array.isArray(gifts[key])) return gifts[key];
  }

  const candidates = new Set(directKeys.map(normalizeMysteryKey).filter(Boolean));
  for (const [key, entries] of Object.entries(gifts)) {
    const normalized = normalizeMysteryKey(key);
    if ([...candidates].some(candidate =>
      normalized === candidate || normalized.includes(candidate) || candidate.includes(normalized)
    )) {
      return Array.isArray(entries) ? entries : [];
    }
  }
  return [];
}

export function isSupportedSpecies(speciesId) {
  return SUPPORTED_SPECIES_IDS.has(Number(speciesId));
}

export function getSupportedSpecies() {
  return SUPPORTED_SPECIES.slice();
}

export function getMysteryEventsForSpecies(speciesId, mysteryEvents = {}, mysteryGifts = {}) {
  const id = Number(speciesId);
  if (!id) return [];
  const lineage = getSpeciesLineage(id);
  const lineageSet = new Set(lineage);

  const eventEntries = Object.entries(mysteryEvents || {});
  if (eventEntries.length) {
    return eventEntries
      .filter(([tag, event]) => {
        const eventSpecies = Array.isArray(event?.species) ? event.species.map(Number) : [];
        if (eventSpecies.some(eventSpeciesId => lineageSet.has(eventSpeciesId))) return true;
        return getGiftEntriesForEvent(tag, event, mysteryGifts)
          .some(entry => lineageSet.has(Number(entry?.species)));
      })
      .map(([tag, event]) => {
        const gifts = getGiftEntriesForEvent(tag, event, mysteryGifts)
          .filter(entry => lineageSet.has(Number(entry?.species)));
        const eventSpecies = Array.isArray(event?.species) ? event.species.map(Number) : [];
        const sourceSpeciesIds = lineage.filter(sourceId =>
          eventSpecies.includes(sourceId) || gifts.some(entry => Number(entry?.species) === sourceId)
        );
        return { tag, event, gifts, sourceSpeciesIds };
      })
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }

  return Object.entries(mysteryGifts || {})
    .filter(([, entries]) => Array.isArray(entries) && entries.some(entry => lineageSet.has(Number(entry?.species))))
    .map(([tag, entries]) => ({
      tag,
      event: null,
      gifts: entries.filter(entry => lineageSet.has(Number(entry?.species))),
      sourceSpeciesIds: lineage.filter(sourceId =>
        entries.some(entry => Number(entry?.species) === sourceId)
      ),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function getStaticEncountersForSpecies(speciesId) {
  const lineage = getLineageSet(speciesId);
  return STATIC_ENCOUNTER_LIST.filter(encounter => lineage.has(Number(encounter.species)));
}

export function getShadowEncountersForSpecies(speciesId) {
  return getSpeciesLineage(speciesId)
    .flatMap(sourceId => getExistingShadowEncountersForSpecies(sourceId));
}

export function getCXDEncountersForSpecies(speciesId) {
  return getSpeciesLineage(speciesId).flatMap(sourceId => [
    ...getExistingShadowEncountersForSpecies(sourceId).map(encounter => ({
      kind: 'shadow',
      originGame: 15,
      // XD's opening Teddiursa and Hordel's Togepi are forced into Poké Balls;
      // other Shadow Pokémon retain the player's chosen capture Ball.
      ball: encounter.fixedBall ?? (encounter.game === 'xd' && [1, 81].includes(Number(encounter.shadowIndex)) ? 4 : null),
      fateful: encounter.game === 'xd',
      nationalRibbon: true,
      shinyLocked: encounter.game === 'xd',
      pidType: 'CXD',
      ...encounter,
    })),
    ...getCXDSpecialEncountersForSpecies(sourceId),
  ]);
}

export function getXDTradesForSpecies(speciesId) {
  return getSpeciesLineage(speciesId)
    .flatMap(sourceId => getCXDTradesForSpecies(sourceId));
}

export function getGameCubeEncountersForSpecies(speciesId) {
  return [
    ...getCXDEncountersForSpecies(speciesId).map((encounter, index) => ({
      mode: 'cxd_shadow',
      kind: encounter.kind || 'shadow',
      index,
      encounter,
    })),
    ...getXDTradesForSpecies(speciesId).map((encounter, index) => ({
      mode: 'cxd_trade',
      kind: 'trade',
      index,
      encounter,
    })),
  ];
}

export function isSpeciesAvailableForOrigin(speciesId, mode, context = {}) {
  const id = Number(speciesId);
  if (!isSupportedSpecies(id)) return false;

  switch (mode) {
    case 'hatched':
      return !isLegendary(id) && id !== 132 && id !== 201;
    case 'wild':
      return WILD_PLUS_EVOLUTIONS.has(id);
    case 'static':
      return getStaticEncountersForSpecies(id).length > 0;
    case 'roamer':
      return getSpeciesLineage(id).some(sourceId => Boolean(ROAMER_SPECIES[sourceId]));
    case 'mystery':
      return getMysteryEventsForSpecies(id, context.mysteryEvents, context.mysteryGifts).length > 0;
    case 'cxd_shadow':
      return getCXDEncountersForSpecies(id).length > 0;
    case 'cxd_trade':
      return getXDTradesForSpecies(id).length > 0;
    case 'imported':
      return context.includeImported === true;
    default:
      return false;
  }
}

export function getAvailableOriginsForSpecies(speciesId, context = {}) {
  return ORIGIN_DEFINITIONS.filter(definition =>
    isSpeciesAvailableForOrigin(speciesId, definition.mode, context)
  ).map(definition => ({ ...definition }));
}

export function getSpeciesForOrigin(mode, context = {}) {
  return SUPPORTED_SPECIES.filter(([speciesId]) =>
    isSpeciesAvailableForOrigin(speciesId, mode, context)
  );
}

export function getOriginDefinition(mode) {
  const definition = ORIGIN_DEFINITION_BY_MODE.get(String(mode || ''));
  return definition ? { ...definition } : null;
}

export function reconcileOriginForSpecies(speciesId, currentMode, context = {}) {
  if (currentMode === 'imported') return 'imported';
  return isSpeciesAvailableForOrigin(speciesId, currentMode, context) ? currentMode : '';
}

export function getOriginTransitionForSpecies(speciesId, currentMode, context = {}) {
  const mode = reconcileOriginForSpecies(speciesId, currentMode, context);
  const definition = getOriginDefinition(mode);
  const requiresExactEncounter = Boolean(definition?.requiresExactEncounter);
  return {
    mode,
    preserved: Boolean(mode && mode === currentMode),
    requiresExactEncounter,
    applyAutomaticPreset: Boolean(mode && !requiresExactEncounter && context.manualOverride !== true),
  };
}
