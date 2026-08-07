export const SHINY_CONTROL_KIND = Object.freeze({
  DIRECT: 'direct',
  FINDER: 'finder',
  LOCKED: 'locked',
  ALWAYS: 'always',
});

/**
 * Choose the legal shiny interaction for the current encounter.
 *
 * Hatcher-owned gifts may change the recipient SID without changing the
 * event-generated PID. Fixed-trainer distributions and GameCube encounters
 * must instead search PID/TID/SID together so their RNG correlation remains
 * intact.
 */
export function getShinyControlPolicy({
  encounterMode = '',
  eventTag = '',
  event = null,
  pidMethod = '',
  encounter = null,
  unlockShinyLock = false,
} = {}) {
  const mode = String(encounterMode || '').toLowerCase();
  const tag = String(eventTag || '').toUpperCase();
  const alwaysShiny = Boolean(event?.alwaysShiny) || tag === 'WISHMKR_SHINY';
  const shinyLocked = Boolean(encounter?.shinyLocked ?? event?.shinyLocked);

  if (alwaysShiny) {
    return {
      kind: SHINY_CONTROL_KIND.ALWAYS,
      message: 'This Pokémon is always shiny.',
    };
  }

  if (shinyLocked && !unlockShinyLock) {
    return {
      kind: SHINY_CONTROL_KIND.LOCKED,
      message: '🔒 This Pokémon cannot be shiny.',
    };
  }

  if (mode === 'cxd_shadow' || mode === 'cxd_trade') {
    return {
      kind: SHINY_CONTROL_KIND.FINDER,
      message: 'Shiny is possible — use Find Legal Encounter so the RNG values stay correlated.',
    };
  }

  if (mode === 'mystery') {
    const usesHatcherTrainerData = tag === 'BOX_EVENT' || Boolean(event?.usesHatcherTrainerData);
    if (!usesHatcherTrainerData && String(pidMethod || '').trim()) {
      return {
        kind: SHINY_CONTROL_KIND.FINDER,
        message: 'Shiny is possible — use Find Legal Encounter so the event PID and trainer IDs stay legal.',
      };
    }
  }

  return { kind: SHINY_CONTROL_KIND.DIRECT, message: '' };
}

export function getShinyButtonPresentation({
  policyKind = SHINY_CONTROL_KIND.DIRECT,
  isShiny = false,
  undoActive = false,
} = {}) {
  if (policyKind === SHINY_CONTROL_KIND.ALWAYS) {
    return { label: '✨ Always Shiny', disabled: true, active: true };
  }
  if (policyKind === SHINY_CONTROL_KIND.FINDER) {
    return { label: '✨ Find Shiny', disabled: false, active: false };
  }
  if (undoActive) {
    return { label: '✨ Undo Shiny', disabled: false, active: true };
  }
  if (isShiny) {
    return { label: '✨ Already Shiny', disabled: true, active: true };
  }
  return { label: '✨ Make Shiny', disabled: false, active: false };
}
