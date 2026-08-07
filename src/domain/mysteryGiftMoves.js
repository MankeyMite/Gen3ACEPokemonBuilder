function normalizeMoveIds(moves) {
  if (!Array.isArray(moves)) return [];

  return moves
    .map(move => {
      if (move && typeof move === 'object' && move.index !== undefined) {
        return Number(move.index);
      }
      return Number(move);
    })
    .filter(moveId => Number.isInteger(moveId) && moveId > 0);
}

const MYSTERY_MOVESET_EVENT_ALIASES = Object.freeze({
  doeldeoxys: 'DOEL_DEOXYS',
  spacecenterdeoxys: 'SPACE_CENTER_DEOXYS',
  pokemonrocksamerica2005: 'POKEMON_ROCKS_METANG',
  berryfix: 'BERRY_PROGRAM_UPDATE_ZIGZAGOON',
  berryfixzigzagoon: 'BERRY_PROGRAM_UPDATE_ZIGZAGOON',
  berryprogramupdate: 'BERRY_PROGRAM_UPDATE_ZIGZAGOON',
  berryprogramupdatezigzagoon: 'BERRY_PROGRAM_UPDATE_ZIGZAGOON',
  partyofthedecade: 'PARTY_OF_THE_DECADE',
  pcnywisheggs: 'PCNY_WISH_EGGS',
  mystrymew: 'MYSTRY_MEW',
  mysterymew: 'MYSTRY_MEW',
  mitsurincelebi: 'MITSURIN_CELEBI',
  agetocelebi: 'AGETO_CELEBI',
  clubnintendojirachigiveaway: 'WISHMKR_BEST',
  wishmkrjirachibestivs: 'WISHMKR_BEST',
  wishmkrjirachiallshinypids: 'WISHMKR_SHINY',
  wishmkrjirachiallshinyversions: 'WISHMKR_SHINY',
});

export function getMysteryMovesetEventAlias(displayName) {
  const normalizedName = String(displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return MYSTERY_MOVESET_EVENT_ALIASES[normalizedName] || '';
}

export function getCuratedMysteryMovesForSpecies(moveset, speciesName) {
  if (!moveset?.moves || !speciesName) return [];

  if (Array.isArray(moveset.moves[speciesName])) {
    return moveset.moves[speciesName];
  }

  const normalizeName = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalizeName(speciesName);
  const candidateKey = Object.keys(moveset.moves).find(key => {
    const normalizedKey = normalizeName(key);
    return normalizedKey === target || normalizedKey.includes(target) || target.includes(normalizedKey);
  });

  return candidateKey ? moveset.moves[candidateKey] : [];
}

export function resolveMysteryMoveIds({
  entryMoves,
  eventMoves,
  curatedMoves,
  levelUpMoves,
  encounterLevel,
} = {}) {
  // Fixed per-entry/event moves are authoritative. Curated distribution
  // moves come next so special moves are not replaced by a level-up fallback.
  for (const moves of [entryMoves, eventMoves, curatedMoves]) {
    const moveIds = normalizeMoveIds(moves);
    if (moveIds.length) return moveIds.slice(0, 4);
  }

  const maxLevel = Number(encounterLevel);
  if (!Number.isFinite(maxLevel) || !Array.isArray(levelUpMoves)) return [];

  return levelUpMoves
    .filter(([, learnedAt]) => Number(learnedAt) <= maxLevel)
    .map(([moveId]) => Number(moveId))
    .filter(moveId => Number.isInteger(moveId) && moveId > 0)
    .slice(-4);
}
