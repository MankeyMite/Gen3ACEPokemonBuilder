// Alternative move sources shown in Legal Mode. These entries are deliberately
// informational: they never add a move to the legal move set for the current
// encounter.

import { getCuratedMysteryMovesForSpecies } from './mysteryGiftMoves.js';

function getMoveNameById(moves, moveId) {
  const entry = (moves || []).find(([id]) => Number(id) === Number(moveId));
  return entry ? String(entry[1]) : '';
}

export function getEggMoveIdsForSpecies(speciesId, learnsets, preEvolutions) {
  const result = new Set();
  const visited = new Set();
  let currentSpeciesId = Number(speciesId);

  while (currentSpeciesId > 0 && !visited.has(currentSpeciesId)) {
    visited.add(currentSpeciesId);
    for (const moveId of learnsets[currentSpeciesId]?.e || []) result.add(Number(moveId));
    currentSpeciesId = Number(preEvolutions[currentSpeciesId] || 0);
  }

  return result;
}

export function getXdEncounterMoveIdsForSpecies(speciesId, encounterLists) {
  const result = new Set();
  for (const encounters of encounterLists || []) {
    for (const encounter of encounters || []) {
      const isXdEncounter = encounter?.game === 'xd' || encounter?.tradeKind === 'xd';
      if (!isXdEncounter || Number(encounter.species) !== Number(speciesId)) continue;
      for (const moveId of encounter.moves || []) result.add(Number(moveId));
    }
  }
  return result;
}

function getSpeciesLineageIds(speciesId, preEvolutions) {
  const lineage = [];
  const visited = new Set();
  let currentSpeciesId = Number(speciesId);

  while (currentSpeciesId > 0 && !visited.has(currentSpeciesId)) {
    lineage.push(currentSpeciesId);
    visited.add(currentSpeciesId);
    currentSpeciesId = Number(preEvolutions[currentSpeciesId] || 0);
  }

  return lineage;
}

function normalizeMoveIds(moveIds) {
  const values = Array.isArray(moveIds)
    ? moveIds
    : moveIds && typeof moveIds[Symbol.iterator] === 'function'
      ? [...moveIds]
      : [];
  return values
    .map(move => Number(move && typeof move === 'object' ? move.index : move))
    .filter(moveId => Number.isInteger(moveId) && moveId > 0);
}

function getMysteryEventHint(tag, event, moveset) {
  if (String(tag || '').toUpperCase() === 'BOX_EVENT') return 'Pokémon Box event';

  const label = String(event?.label || moveset?.displayName || tag || 'Mystery Gift')
    .replace(/_/g, ' ')
    .trim();
  if (/\bevent$/i.test(label)) return label;
  return `${label} event`;
}

/**
 * Return every fixed move supplied by a local Gen III Mystery Gift/event
 * source that can produce the selected species (including an ancestor that
 * can evolve into it). Event rows, event-level movesBySpecies data, and the
 * curated event moveset catalog are intentionally combined: different
 * distributions or preserved variants can have different fixed moves.
 */
export function getMysteryEventMoveSourcesForSpecies({
  speciesId,
  preEvolutions,
  species,
  mysteryEvents,
  mysteryGifts,
  mysteryMovesets,
}) {
  const lineage = getSpeciesLineageIds(speciesId, preEvolutions || {});
  const lineageSet = new Set(lineage);
  const speciesNames = new Map((species || []).map(([id, name]) => [Number(id), String(name)]));
  const sources = [];
  const coveredGiftTags = new Set();

  function addSource(sourceSpeciesId, moveIds, hint) {
    const id = Number(sourceSpeciesId);
    if (!lineageSet.has(id)) return;
    const moves = [...new Set(normalizeMoveIds(moveIds))];
    if (moves.length) sources.push({ speciesId: id, moveIds: moves, hint });
  }

  for (const [tag, event] of Object.entries(mysteryEvents || {})) {
    const moveset = mysteryMovesets?.[tag] || null;
    const giftTags = [...new Set([tag, event?.presetTag].filter(Boolean))];
    giftTags.forEach(giftTag => coveredGiftTags.add(giftTag));
    const giftEntries = giftTags.flatMap(giftTag => mysteryGifts?.[giftTag] || []);
    const sourceSpeciesIds = new Set([
      ...(event?.species || []).map(Number),
      ...giftEntries.map(entry => Number(entry?.species)).filter(Number.isInteger),
    ]);
    const hint = getMysteryEventHint(tag, event, moveset);

    for (const sourceSpeciesId of sourceSpeciesIds) {
      if (!lineageSet.has(sourceSpeciesId)) continue;
      const moveIds = new Set(normalizeMoveIds(event?.movesBySpecies?.[sourceSpeciesId]));
      for (const entry of giftEntries) {
        if (entry?.species !== undefined && Number(entry.species) !== sourceSpeciesId) continue;
        for (const moveId of normalizeMoveIds(entry?.moves)) moveIds.add(moveId);
      }
      const curatedMoves = getCuratedMysteryMovesForSpecies(
        moveset,
        speciesNames.get(sourceSpeciesId) || '',
      );
      for (const moveId of normalizeMoveIds(curatedMoves)) moveIds.add(moveId);
      addSource(sourceSpeciesId, moveIds, hint);
    }
  }

  // Keep working if an event exists only as per-Pokémon rows. This also makes
  // the helper tolerant of future local data additions that do not need a
  // separate event metadata object.
  for (const [tag, giftEntries] of Object.entries(mysteryGifts || {})) {
    if (coveredGiftTags.has(tag)) continue;
    for (const entry of giftEntries || []) {
      const sourceSpeciesId = Number(entry?.species);
      addSource(sourceSpeciesId, entry?.moves, getMysteryEventHint(tag, null, null));
    }
  }

  return sources;
}

export function getGameCubeEncounterMoveSourcesForSpecies(
  speciesId,
  preEvolutions,
  encounterLists,
) {
  const lineage = new Set(getSpeciesLineageIds(speciesId, preEvolutions || {}));
  const sources = [];

  for (const encounters of encounterLists || []) {
    for (const encounter of encounters || []) {
      if (!lineage.has(Number(encounter?.species))) continue;
      const isXdEncounter = encounter?.game === 'xd' || encounter?.tradeKind === 'xd';
      const isColosseumEncounter = encounter?.game === 'colo';
      if (!isXdEncounter && !isColosseumEncounter) continue;
      const hint = isXdEncounter
        ? 'XD only'
        : encounter?.eReader
          ? 'Colosseum e-Reader'
          : 'Colosseum only';
      const moveIds = normalizeMoveIds(encounter?.moves);
      if (moveIds.length) sources.push({ moveIds, hint });
    }
  }

  return sources;
}

/**
 * Return disabled, explanatory move-picker entries for moves that are not
 * legal for the current encounter but could be learned through another Gen III
 * route. Lower priority wins when a move has multiple possible explanations.
 */
export function getAlternativeMoveHints({
  moves,
  learnsets,
  preEvolutions,
  speciesId,
  levelUpMoves,
  legalMoveIds,
  encounterMode,
  pokemonLevel,
  xdEncounterLists,
  species,
  mysteryEvents,
  mysteryGifts,
  mysteryMovesets,
}) {
  const legalIds = new Set([...legalMoveIds || []].map(Number));
  const alternatives = new Map();
  const canUseEggMoves = encounterMode === 'hatched';

  function offer(moveId, hint, priority) {
    const id = Number(moveId);
    if (!id || legalIds.has(id)) return;
    const name = getMoveNameById(moves, id);
    if (!name) return;
    const existing = alternatives.get(id);
    if (!existing || priority < existing.priority) {
      alternatives.set(id, { id, name, hint, priority });
    }
  }

  // A later level-up is the clearest useful explanation, including direct
  // level-up learnsets for wild/static encounters and inherited tables where
  // those are the current encounter's legal source.
  for (const [moveId, learnLevel] of levelUpMoves || []) {
    if (Number(learnLevel) > Number(pokemonLevel || 0)) {
      offer(moveId, `Level ${learnLevel}`, 0);
    }
  }

  if (!canUseEggMoves) {
    for (const moveId of getEggMoveIdsForSpecies(speciesId, learnsets, preEvolutions)) {
      offer(moveId, 'Egg move', 1);
    }
  }

  // XD tutor compatibility is already part of the selectable tutor pool: an
  // eligible GBA Pokémon can be traded to XD, taught the move, and traded
  // back. Only moves tied to a particular GameCube encounter belong here.
  for (const source of getGameCubeEncounterMoveSourcesForSpecies(
    speciesId,
    preEvolutions,
    xdEncounterLists,
  )) {
    for (const moveId of source.moveIds) offer(moveId, source.hint, 2);
  }

  for (const source of getMysteryEventMoveSourcesForSpecies({
    speciesId,
    preEvolutions,
    species,
    mysteryEvents,
    mysteryGifts,
    mysteryMovesets,
  })) {
    for (const moveId of source.moveIds) {
      offer(moveId, source.hint, 3);
    }
  }

  return [...alternatives.values()]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id - b.id)
    .map(({ id, name, hint }) => ({
      id,
      name,
      hint,
      disabled: true,
      group: 'Available with a different encounter',
    }));
}
