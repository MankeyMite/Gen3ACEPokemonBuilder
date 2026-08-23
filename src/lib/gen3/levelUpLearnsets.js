import { LEARNSETS } from '../../data/learnsets.gen3.js';
import { LEARNSETS_RS } from '../../data/learnsets.rs.js';
import { LEARNSETS_FIRE_RED, LEARNSETS_LEAF_GREEN } from '../../data/learnsets.frlg.js';

export const GEN3_ORIGIN_GAME = Object.freeze({
  SAPPHIRE: 1,
  RUBY: 2,
  EMERALD: 3,
  FIRE_RED: 4,
  LEAF_GREEN: 5,
});

/**
 * Resolve the level-up learnset for the Pokémon's stored origin game.
 * Emerald is the complete base table; the other games contain generated
 * overrides only where their learnset differs from Emerald.
 */
export function getLevelUpLearnsetForOriginGame(speciesId, originGame) {
  const id = Number(speciesId) || 0;
  const game = Number(originGame) || 0;
  const emeraldLearnset = LEARNSETS[id]?.l || [];

  if (game === GEN3_ORIGIN_GAME.SAPPHIRE || game === GEN3_ORIGIN_GAME.RUBY) {
    return LEARNSETS_RS[id] || emeraldLearnset;
  }
  if (game === GEN3_ORIGIN_GAME.FIRE_RED) {
    return LEARNSETS_FIRE_RED[id] || emeraldLearnset;
  }
  if (game === GEN3_ORIGIN_GAME.LEAF_GREEN) {
    return LEARNSETS_LEAF_GREEN[id] || emeraldLearnset;
  }
  return emeraldLearnset;
}
