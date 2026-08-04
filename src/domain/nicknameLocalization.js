export const NICKNAME_SOURCE = Object.freeze({
  EMPTY: 'empty',
  SPECIES_DEFAULT: 'species-default',
  PRESET: 'preset',
  IMPORTED: 'imported',
  USER: 'user',
});

export function createNicknameState(source = NICKNAME_SOURCE.EMPTY, speciesId = 0) {
  return Object.freeze({
    source,
    speciesId: Number(speciesId) || 0,
  });
}

export function shouldSynchronizeSpeciesNickname(state, speciesId, encounterMode) {
  const id = Number(speciesId) || 0;
  if (!id || encounterMode === 'imported' || encounterMode === 'cxd_trade') return false;
  return state?.source === NICKNAME_SOURCE.SPECIES_DEFAULT && Number(state.speciesId) === id;
}
