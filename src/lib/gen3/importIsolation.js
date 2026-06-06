export function isPristineImportedRoundTripState(currentEncounterMode, importedRoundTripBytes, importedRoundTripDirty) {
  return currentEncounterMode === 'imported'
    && importedRoundTripBytes instanceof Uint8Array
    && importedRoundTripBytes.length === 80
    && !importedRoundTripDirty;
}

export function tryBuildPristineImportedOutputs({
  currentEncounterMode,
  importedRoundTripBytes,
  importedRoundTripDirty,
  toFormattedHexFn,
  toBase64Fn,
}) {
  if (!isPristineImportedRoundTripState(currentEncounterMode, importedRoundTripBytes, importedRoundTripDirty)) {
    return null;
  }

  const hex = toFormattedHexFn(importedRoundTripBytes);
  const base64Result = toBase64Fn(importedRoundTripBytes);
  return {
    hex,
    base64Text: base64Result?.text || '',
    substitutionUsed: Boolean(base64Result?.substitutionUsed),
  };
}

export function shouldMarkImportedDirtyFromEvent({
  event,
  suppressImportedDirtyTracking,
  currentEncounterMode,
  importedRoundTripBytes,
  targetId,
  inDataCards,
}) {
  if (suppressImportedDirtyTracking) return false;
  if (!event?.isTrusted) return false;
  if (currentEncounterMode !== 'imported') return false;
  if (!(importedRoundTripBytes instanceof Uint8Array) || importedRoundTripBytes.length !== 80) return false;

  if (
    targetId === 'manualOverride' ||
    targetId === 'encounterMode' ||
    targetId === 'generateBtn' ||
    targetId === 'copyHexBtn' ||
    targetId === 'copyBase64Btn' ||
    targetId === 'showGbaTextPreview' ||
    targetId === 'codeTargetConsole' ||
    targetId === 'codeTargetSwitch'
  ) {
    return false;
  }

  if (!inDataCards) return false;
  return true;
}

export function resolvePokerusStateForBuild({
  currentEncounterMode,
  importedPokerusState,
  pokerusDropdownDirty,
  selectedPokerusStatus,
  getPokerusStateFromStatusFn,
}) {
  const selectedState = getPokerusStateFromStatusFn(selectedPokerusStatus);
  const shouldPreserveImportedState = currentEncounterMode === 'imported'
    && !pokerusDropdownDirty
    && Number.isFinite(Number(importedPokerusState));

  return shouldPreserveImportedState
    ? (Number(importedPokerusState) & 0xFF)
    : selectedState;
}
