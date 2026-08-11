export const SMEARGLE_SPECIES_ID = 235;
export const STRUGGLE_MOVE_ID = 165;
export const SKETCH_MOVE_ID = 166;

/**
 * Smeargle can permanently replace Sketch with any regular Gen 3 move except
 * Struggle. Sketch itself remains legal because Smeargle learns it by level.
 */
export function getSelectableMovesForSpecies(speciesId, standardMoves, allMoves) {
  if (Number(speciesId) !== SMEARGLE_SPECIES_ID) return standardMoves;
  return allMoves.filter(([moveId]) => Number(moveId) !== STRUGGLE_MOVE_ID);
}

export function getDefaultMoveIdsForSpecies(speciesId) {
  if (Number(speciesId) !== SMEARGLE_SPECIES_ID) return null;
  return [SKETCH_MOVE_ID, 0, 0, 0];
}
