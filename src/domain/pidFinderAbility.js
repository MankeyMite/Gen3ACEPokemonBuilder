/**
 * Resolve the stored Gen 3 ability bit for an exported PID Finder result.
 *
 * While a finder result is active, preserve its chosen correlation bit instead
 * of relying on a potentially repopulated form selector. The caller must
 * normalize single-ability species to legal ability number 0.
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
