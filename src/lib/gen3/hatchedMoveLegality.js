import { getGenderThreshold } from '../../data/genderThresholds.gen3.js';

export function shouldCapHatchedLevelUpMoves(speciesId, encounterMode) {
  return encounterMode === 'hatched' && getGenderThreshold(Number(speciesId) || 0) === -1;
}

export function isLevelUpMoveAllowedForEncounter({ speciesId, encounterMode, pokemonLevel, learnLevel }) {
  if (encounterMode === 'hatched' && !shouldCapHatchedLevelUpMoves(speciesId, encounterMode)) {
    return true;
  }

  const level = Number(pokemonLevel) || 100;
  return Number(learnLevel) <= level;
}

export function getAllowedLevelUpMoveIdsForEncounter(levelUpMoves, options) {
  const ids = [];
  for (const [moveId, learnLevel] of levelUpMoves || []) {
    if (isLevelUpMoveAllowedForEncounter({ ...options, learnLevel })) {
      ids.push(moveId);
    }
  }
  return ids;
}
