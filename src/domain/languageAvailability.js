const JAPANESE_SELECTABLE_ORIGIN_MODES = new Set([
  'hatched',
  'wild',
  'static',
  'roamer',
  'cxd_shadow',
  'cxd_trade',
]);

export function canSelectJapaneseLanguage({
  encounterMode,
  manualOverride = false,
  isEgg = false,
  mysteryEvent = null,
} = {}) {
  if (manualOverride || isEgg) return true;
  if (JAPANESE_SELECTABLE_ORIGIN_MODES.has(String(encounterMode || ''))) return true;
  if (encounterMode !== 'mystery' || !mysteryEvent) return false;

  return Number(mysteryEvent.defaultLanguage) === 1 ||
    Boolean(mysteryEvent.ot_names?.['1']);
}
