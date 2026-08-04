const ZUBAT_SPECIES_ID = 41;
const EMERALD_ALTERING_CAVE_LOCATION_ID = 210;
const FRLG_ALTERING_CAVE_LOCATION_ID = 183;

// These Altering Cave event rotations were never released in Generation III.
const UNRELEASED_ALTERING_CAVE_SPECIES_IDS = new Set([
  179, // Mareep
  190, // Aipom
  204, // Pineco
  213, // Shuckle
  216, // Teddiursa
  228, // Houndour
  234, // Stantler
  235, // Smeargle
]);

function shouldExcludeAlteringCaveSpecies(sourceFile, locationId, speciesId) {
  const id = Number(speciesId) || 0;
  if (id === ZUBAT_SPECIES_ID) return false;

  if (sourceFile === 'emerald' && locationId === EMERALD_ALTERING_CAVE_LOCATION_ID) {
    return true;
  }

  return sourceFile === 'frlg' &&
    locationId === FRLG_ALTERING_CAVE_LOCATION_ID &&
    UNRELEASED_ALTERING_CAVE_SPECIES_IDS.has(id);
}

function shouldExcludeAlteringCaveTable(sourceFile, locationId, table) {
  return table.some(([speciesId]) =>
    shouldExcludeAlteringCaveSpecies(sourceFile, locationId, speciesId)
  );
}

module.exports = {
  EMERALD_ALTERING_CAVE_LOCATION_ID,
  FRLG_ALTERING_CAVE_LOCATION_ID,
  UNRELEASED_ALTERING_CAVE_SPECIES_IDS,
  ZUBAT_SPECIES_ID,
  shouldExcludeAlteringCaveSpecies,
  shouldExcludeAlteringCaveTable,
};
