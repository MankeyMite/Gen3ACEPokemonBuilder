/**
 * Gen 3 roaming encounters used by both origin availability and presets.
 * Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen.
 */
export const ROAMER_SPECIES = {
  408: { name: 'Latios', games: [2, 3], level: 40 },
  407: { name: 'Latias', games: [1, 3], level: 40 },
  243: { name: 'Raikou', games: [4, 5], level: 50 },
  244: { name: 'Entei', games: [4, 5], level: 50 },
  245: { name: 'Suicune', games: [4, 5], level: 50 },
};

export const ROAMER_SPECIES_SET = new Set(Object.keys(ROAMER_SPECIES).map(Number));

export const ROAMER_SPECIES_BY_GAME = Object.freeze({
  1: [407],
  2: [408],
  3: [407, 408],
  4: [243, 244, 245],
  5: [243, 244, 245],
});

export const ROAMER_GAMES_FOR_SPECIES = Object.freeze(
  Object.fromEntries(
    Object.entries(ROAMER_SPECIES).map(([speciesId, info]) => [Number(speciesId), info.games])
  )
);

export function roamerHasTruncatedIVs(speciesId, gameId) {
  return Boolean(ROAMER_SPECIES[Number(speciesId)] && Number(gameId) !== 3);
}

export function getRoamerMetLocation(speciesId) {
  return [243, 244, 245].includes(Number(speciesId)) ? 101 : 16;
}
