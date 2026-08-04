export const HARDEN_MOVE_ID = 106;

// These cocoon Pokémon can be encountered directly in the wild, but their
// merged learnsets also contain moves retained from their pre-evolutions.
// A directly caught cocoon only has access to its own Harden-only learnset.
const DIRECT_WILD_HARDEN_ONLY_SPECIES = new Set([
  11,  // Metapod
  14,  // Kakuna
  291, // Silcoon
  293, // Cascoon
]);

export function getDirectWildMoveOverride(speciesId, encounterMode, hasDirectWildEncounter) {
  if (
    encounterMode !== 'wild' ||
    !hasDirectWildEncounter ||
    !DIRECT_WILD_HARDEN_ONLY_SPECIES.has(Number(speciesId))
  ) {
    return null;
  }

  return [HARDEN_MOVE_ID];
}
