/**
 * Return the moves a freshly loaded Pokémon would know from its level-up
 * learnset: the four most recently learned moves at or below its current
 * level. If a move appears more than once, only its latest occurrence is kept.
 */
export function getDefaultLevelUpMoveIds(levelUpMoves, pokemonLevel, maxMoves = 4) {
  const level = Number(pokemonLevel);
  const limit = Math.max(0, Math.trunc(Number(maxMoves)) || 0);
  if (!Array.isArray(levelUpMoves) || !Number.isFinite(level) || limit === 0) return [];

  const learnedMoveIds = [];
  for (const entry of levelUpMoves) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const moveId = Number(entry[0]);
    const learnedAt = Number(entry[1]);
    if (!Number.isInteger(moveId) || moveId <= 0 || !Number.isFinite(learnedAt) || learnedAt > level) {
      continue;
    }

    // A Pokémon cannot occupy two move slots with the same move. Treat a
    // repeated learnset entry as the latest time that move was learned.
    const previousIndex = learnedMoveIds.indexOf(moveId);
    if (previousIndex !== -1) learnedMoveIds.splice(previousIndex, 1);
    learnedMoveIds.push(moveId);
  }

  return learnedMoveIds.slice(-limit);
}
