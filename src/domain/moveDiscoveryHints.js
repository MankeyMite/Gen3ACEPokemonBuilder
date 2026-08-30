// Alternative move sources shown in Legal Mode. These entries are deliberately
// informational: they never add a move to the legal move set for the current
// encounter.

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
}) {
  const legalIds = new Set([...legalMoveIds || []].map(Number));
  const alternatives = new Map();
  const canUseEggMoves = encounterMode === 'hatched';
  const canUseXdTutors = String(encounterMode || '').startsWith('cxd_');

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

  if (!canUseXdTutors) {
    for (const moveId of learnsets[speciesId]?.x || []) {
      offer(moveId, 'XD only', 2);
    }
    for (const moveId of getXdEncounterMoveIdsForSpecies(speciesId, xdEncounterLists)) {
      offer(moveId, 'XD only', 2);
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
