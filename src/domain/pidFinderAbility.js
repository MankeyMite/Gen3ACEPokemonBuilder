/**
 * Resolve the stored Gen 3 ability bit for an exported PID Finder result.
 *
 * While a finder result is active, preserve its chosen correlation bit instead
 * of relying on a potentially repopulated form selector.
 */
export function resolvePidFinderAbilityBit({
  selectedAbilityBit,
  resultActive,
  resultAbilityBit,
  manualOverride,
}) {
  const hasRngBit = resultAbilityBit !== null && resultAbilityBit !== undefined && resultAbilityBit !== '';
  const rngBit = Number(resultAbilityBit);
  if (resultActive && !manualOverride && hasRngBit && Number.isInteger(rngBit) && (rngBit === 0 || rngBit === 1)) {
    return rngBit;
  }
  return Number(selectedAbilityBit) & 1;
}

/**
 * Normalize a freshly selected PID Finder result against the species whose
 * ability slots were present when the encounter was generated. For evolved
 * event Pokémon this can be the pre-evolution: evolution preserves the stored
 * Gen III ability bit even when the evolved species displays only one ability.
 */
export function normalizeGeneratedAbilityBit({
  pid,
  generatedAbilityBit,
  correlationSpeciesHasSingleAbility,
}) {
  if (correlationSpeciesHasSingleAbility) return 0;
  return Number.isInteger(generatedAbilityBit)
    ? (generatedAbilityBit & 1)
    : (Number(pid) & 1);
}
