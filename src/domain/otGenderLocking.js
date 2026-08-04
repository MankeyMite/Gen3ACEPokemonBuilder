const WISHMKR_MYSTERY_TAGS = new Set(['WISHMKR_BEST', 'WISHMKR_SHINY']);

export function getOtGenderLockPolicy({
  encounterMode,
  manualOverride = false,
  mysteryTag = '',
  mysteryUsesHatcherTrainerData = false,
  isEgg = false,
} = {}) {
  if (manualOverride) return { locked: false, forcedGender: '' };

  if (encounterMode === 'cxd_shadow' || encounterMode === 'cxd_trade') {
    return { locked: true, forcedGender: 'male' };
  }

  if (encounterMode !== 'mystery') {
    return { locked: false, forcedGender: '' };
  }

  const tag = String(mysteryTag || '').toUpperCase();
  if (!tag) return { locked: false, forcedGender: '' };

  if (tag === 'BOX_EVENT') {
    return isEgg
      ? { locked: true, forcedGender: 'female' }
      : { locked: false, forcedGender: '' };
  }

  if (tag === 'PCNY_WISH_EGGS' || mysteryUsesHatcherTrainerData) {
    return { locked: false, forcedGender: '' };
  }

  if (WISHMKR_MYSTERY_TAGS.has(tag)) {
    return { locked: true, forcedGender: 'male' };
  }

  // Other fixed-trainer distributions may derive OT gender from their selected
  // event row, PID seed, or RNG result. Lock the field without changing it.
  return { locked: true, forcedGender: '' };
}
