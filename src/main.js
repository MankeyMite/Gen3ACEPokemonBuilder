// IV input selectors (used for visibility and clamping)
const ivIds = ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'];
import { NATURES, LANGUAGES } from './lib/gen3/constants.js';
import { formatNatureOption, getAdjustedStatBarValue, getNatureEffect, getNatureMultiplier } from './domain/naturePresentation.js';
import { SPECIES } from './data/species.gen3.js';
import { getLocalizedSpeciesName } from './data/localizedSpeciesNames.gen3.js';
import { BASE_STATS, DEOXYS_FORM_BASE_STATS } from './data/baseStats.gen3.js';
import { ITEMS } from './data/items.gen3.js';
import { MOVES } from './data/moves.gen3.js';
import { BALLS } from './data/balls.gen3.js';
import { LOCATIONS } from './data/locations.gen3.js';
import { PID_PRESETS } from './data/pid_presets.gen3.js';
import { STATIC_ENCOUNTERS, isRegiSpeciesId, STATIC_CATEGORIES } from './data/staticEncounters.gen3.js';
import { getLegendaryPreset, isColosseumXDLegendary } from './data/legendaryPresets.gen3.js';
import { buildPokemonBytes, toHexString, toFormattedHex, toBase64Emerald, coreSource, parsePokemonBytes, parseBase64Emerald, buildDecryptedPokemonFile, convertPk3CanonicalToEk3Raw, convertEk3RawToPk3Canonical, getPokerusStateFromStatus, getPokerusStatusFromState } from './lib/gen3/builder.js';
import { GROUP, expForLevel, levelForExp } from './lib/exp.js';
import EXP_GROUPS from './data/expGroups.gen3.js';
import { ABILITIES, getAbilityName } from './data/abilities.gen3.js';
import { hasDualAbilities, getSpeciesAbilities } from './data/pokemonAbilities.gen3.js';
import { LEARNSETS } from './data/learnsets.gen3.js';
import { WILD_ENCOUNTERS } from './data/wildEncounters.gen3.js';
import { ENCOUNTER_SLOTS } from './data/encounterSlots.gen3.js';
import { CXD_SHADOW_ENCOUNTERS } from './data/shadowEncounters.gen3.js';
import { CXD_SPECIAL_ENCOUNTERS } from './data/cxdSpecialEncounters.gen3.js';
import { CXD_TRADE_ENCOUNTERS } from './data/cxdTrades.gen3.js';
import { getMinimumHatchedLevel, getWildAncestor, PRE_EVOLUTIONS } from './data/evolutions.gen3.js';
import { PROFANITY_LIST } from './data/profanity.gen3.js';
import { createProfanityFilter } from './lib/profanityFilter.js';
import { findValidGCShinySid, isValidGCTidSid } from './data/shadowEncounters.gen3.js';
import { COLO_SHADOW_LOCKS, XD_SHADOW_LOCKS, COLO_NO_LOCK_SPECIES, XD_NO_LOCK_SPECIES } from './data/cxdLocks.gen3.js';
import { getCXDTradeLocalizedText, isCXDGeneratedTrade } from './data/cxdTrades.gen3.js';
import {
  MYSTERY_GIFT_EVENTS_SUPPLEMENTAL,
  MYSTERY_GIFT_POKEMON_SUPPLEMENTAL,
} from './data/mysteryGiftsSupplemental.gen3.js';
import { getNationalDexNumber, getSpritePath, getUnownFormIndex, getUnownFormChar, getUnownFormSuffix, getUnownSpritePath, getOnlineSpriteUrl, getOnlineUnownSpriteUrl, UNOWN_FORMS, TANOBY_FORMS_BY_LOCATION, getTanobyFormsForLocation, getTanobyLocationsForForm } from './data/nationalDex.gen3.js';
import { GENDER_THRESHOLDS, getGenderThreshold } from './data/genderThresholds.gen3.js';
import { isPristineImportedRoundTripState, tryBuildPristineImportedOutputs, shouldMarkImportedDirtyFromEvent, resolvePokerusStateForBuild } from './lib/gen3/importIsolation.js';
import { findNearestBoxNameCharacterAtTextOffset } from './lib/gen3/gbaTextPreview.js';
import { getLegalSheenRangeGen3 } from './lib/gen3/contestSheen.js';
import { getAllowedLevelUpMoveIdsForEncounter, shouldCapHatchedLevelUpMoves } from './lib/gen3/hatchedMoveLegality.js';
import { getDirectWildMoveOverride } from './lib/gen3/wildMoveLegality.js';
import { getDefaultLevelUpMoveIds } from './lib/gen3/defaultLevelUpMoves.js';
import { getDirectLevelUpLearnsetForOriginGame, getLevelUpLearnsetForOriginGame } from './lib/gen3/levelUpLearnsets.js';
import { adjustShinySidForRSTrainerId, findNearestValidRSTrainerSid, isValidRSTrainerId } from './lib/gen3/rsTrainerId.js';
import { normalizeGeneratedAbilityBit, resolvePidFinderAbilityBit } from './domain/pidFinderAbility.js';
import { getGen3ResultFrame } from './domain/gen3InitialSeedFrame.js';
import {
  ROAMER_GAMES_FOR_SPECIES,
  ROAMER_SPECIES,
  ROAMER_SPECIES_SET,
  getRoamerMetLocation,
  roamerHasTruncatedIVs,
} from './data/roamers.gen3.js';
import {
  getAvailableOriginsForSpecies,
  getMinimumLevelForEncounterEvolution,
  getMysteryGiftSourceLevel,
  getMysteryEventsForSpecies,
  getOriginDefinition,
  getOriginTransitionForSpecies,
  getCXDEncountersForSpecies,
  getSpeciesLineage,
  getStaticEncountersForSpecies,
  getSupportedSpecies,
  getXDTradesForSpecies,
  reconcileOriginForSpecies,
} from './domain/encounterAvailability.js';
import {
  ENCOUNTER_BROWSE_CATEGORIES,
  getEncounterBrowseCategory,
  getEventDistributionSubcategoryId,
  getEncounterBrowseOriginMode,
  getEncounterBrowseSubcategories,
  getEncounterBrowseSubcategory,
  getSpeciesForEncounterBrowseSelection,
} from './domain/encounterBrowser.js';
import {
  NICKNAME_SOURCE,
  createNicknameState,
  shouldSynchronizeSpeciesNickname,
} from './domain/nicknameLocalization.js';
import { getSeedDerivedMysteryOtGender } from './domain/mysteryGiftOtGender.js';
import { getWishmkrHeldItemId } from './domain/wishmkrHeldItem.js';
import {
  getCuratedMysteryMovesForSpecies,
  getMysteryMovesetEventAlias,
  resolveMysteryMoveIds,
} from './domain/mysteryGiftMoves.js';
import { canSelectJapaneseLanguage } from './domain/languageAvailability.js';
import { applyLanguageTextLimits } from './domain/languageTextLimits.js';
import { getOtGenderLockPolicy } from './domain/otGenderLocking.js';
import { BUILDER_SNAPSHOT_SCHEMA_VERSION, profileIdentityMatchesEncounter } from './domain/profileWorkspaceData.js';
import { initProfileWorkspace } from './profileWorkspace.js';
import {
  getDefaultMoveIdsForSpecies,
  getSelectableMovesForSpecies,
} from './domain/smeargleMoveRules.js';
import { getAlternativeMoveHints } from './domain/moveDiscoveryHints.js';
import {
  resolveImportedProgression,
  resolveShowdownAbilitySlot,
} from './domain/importedPokemon.js';
import {
  SHINY_CONTROL_KIND,
  SHINY_SID_MODE,
  getDefaultShinySidMode,
  getShinyControlPolicy,
} from './domain/shinyControl.js';
import {
  GEN3_RIBBON_CONTROLS,
  RIBBON_LEGALITY_STATE,
  getGen3RibbonLegality,
  validateGen3RibbonSelection,
} from './domain/ribbonLegality.js';
import { preloadPkhexValidator, validateExactStoredPokemon } from './lib/pkhexValidator.js';

const $ = sel => document.querySelector(sel);

const WILD_ORIGIN_GAME_PRIORITY = [3, 4, 5, 2, 1]; // Emerald, FR/LG, Ruby/Sapphire
const EVOLVED_UNHATCHED_EGG_EXCEPTIONS = new Set([183, 202]); // Marill, Wobbuffet
const ZUBAT_SPECIES_ID = 41;
const EMERALD_ALTERING_CAVE_LOCATION_ID = 210;
const DEOXYS_SPECIES_ID = 410;
const CELEBI_SPECIES_ID = 251;
const SHEDINJA_SPECIES_ID = 303;
const MILOTIC_SPECIES_ID = 329;
const MILOTIC_MIN_BEAUTY = 170;
const DEFAULT_TID = '12345';
const DEFAULT_SID = '54321';
const DEFAULT_OT_GENDER = 'male';
const DEFAULT_POKERUS_STATUS = 'none';
const DEFAULT_AUTO_SHEEN_ENABLED = true;
const DEFAULT_FRIENDSHIP = '70';
const DEFAULT_PP_UPS = '0';
const STATIC_DEFAULT_CATEGORY_ID = 'starters';
const SETUP_ORIGIN_GAME_IDS = [1, 2, 3, 4, 5];
const HATCHED_RSE_DEFAULT_MET_LOCATION_ID = 9; // Mauville City
const HATCHED_FRLG_DEFAULT_MET_LOCATION_ID = 146; // Four Island
const STATIC_LOCKED_ORIGIN_CATEGORIES = new Set(['starters', 'fossils', 'gifts', 'game_corner', 'stationary']);
const STATIC_LOCKED_MET_FIELD_CATEGORIES = new Set(['starters', 'fossils', 'gifts', 'game_corner', 'stationary', 'legends']);
const STATIC_LOCKED_BALL_CATEGORIES = new Set(['starters', 'fossils', 'gifts', 'game_corner']);
const STAT_GRAPH_MAX_BASE = 180;
const STAT_GRAPH_ROWS = [
  { key: 'hp', label: 'HP', ivId: 'ivHp', evId: 'evHp', baseId: 'baseStatHp', baseBarId: 'baseStatBarHp', powerBarId: 'powerStatBarHp', markerId: 'baseStatMarkerHp', trackId: 'statBarTrackHp', finalId: 'finalStatHp' },
  { key: 'atk', label: 'Attack', ivId: 'ivAtk', evId: 'evAtk', baseId: 'baseStatAtk', baseBarId: 'baseStatBarAtk', powerBarId: 'powerStatBarAtk', markerId: 'baseStatMarkerAtk', trackId: 'statBarTrackAtk', finalId: 'finalStatAtk' },
  { key: 'def', label: 'Defense', ivId: 'ivDef', evId: 'evDef', baseId: 'baseStatDef', baseBarId: 'baseStatBarDef', powerBarId: 'powerStatBarDef', markerId: 'baseStatMarkerDef', trackId: 'statBarTrackDef', finalId: 'finalStatDef' },
  { key: 'spa', label: 'Special Attack', ivId: 'ivSpAtk', evId: 'evSpAtk', baseId: 'baseStatSpAtk', baseBarId: 'baseStatBarSpAtk', powerBarId: 'powerStatBarSpAtk', markerId: 'baseStatMarkerSpAtk', trackId: 'statBarTrackSpAtk', finalId: 'finalStatSpAtk' },
  { key: 'spd', label: 'Special Defense', ivId: 'ivSpDef', evId: 'evSpDef', baseId: 'baseStatSpDef', baseBarId: 'baseStatBarSpDef', powerBarId: 'powerStatBarSpDef', markerId: 'baseStatMarkerSpDef', trackId: 'statBarTrackSpDef', finalId: 'finalStatSpDef' },
  { key: 'spe', label: 'Speed', ivId: 'ivSpe', evId: 'evSpe', baseId: 'baseStatSpe', baseBarId: 'baseStatBarSpe', powerBarId: 'powerStatBarSpe', markerId: 'baseStatMarkerSpe', trackId: 'statBarTrackSpe', finalId: 'finalStatSpe' },
];
const STAT_BAR_COLORS = [
  { max: 39, color: '#ef4444', soft: '#fb7185' },
  { max: 59, color: '#f97316', soft: '#fb923c' },
  { max: 79, color: '#f59e0b', soft: '#fbbf24' },
  { max: 99, color: '#eab308', soft: '#fde047' },
  { max: 119, color: '#22c55e', soft: '#4ade80' },
  { max: 149, color: '#14b8a6', soft: '#5eead4' },
  { max: Infinity, color: '#38bdf8', soft: '#7dd3fc' },
];

// Global variables for encounter mode and species filtering
let speciesAutocomplete = null;
// Mystery gift containers (declared early so functions can reference them)
let MYSTERY_EVENTS = {};
let MYSTERY_GIFTS = {};
// Movesets loaded from external file, mapped by internal tag when possible
let MYSTERY_MOVESETS = {};

// Move autocomplete wrappers (set after init)
let moveAutocompletes = [null, null, null, null];

// Callback populated by boot() for applying imported data with access to boot()-scoped helpers
let _postImportUpdate = null;
let _setEncounterModeDescription = null;
let _updateSpeciesListForMode = null;
let _validateForm = null;
let _updatePidTidSidWarning = null;
let _updateContestSheenAuto = null;
let _applyContestSpeciesRequirements = null;
let _syncLegalModeToggle = null;
let _syncPokemonFirstOriginUi = null;
let _createImportedSetPid = null;
let _captureProfileWorkspaceSnapshot = null;
let _restoreProfileWorkspaceSnapshot = null;
let profileWorkspaceController = null;
let suppressProfileTrainerDefaults = false;
let profileTrainerDefaultsQueued = false;
let lastProfileTrainerSignature = '';
let lastProfileEncounterSignature = '';
let profileEncounterDefaultGameId = 0;
let hasGeneratedCode = false;

const PKHEX_ENVIRONMENT = Object.freeze({
  GBA_CARTRIDGE: 'gba-cartridge',
  SWITCH_FRLG: 'switch-frlg',
});
let pkhexLegalityEnvironment = PKHEX_ENVIRONMENT.GBA_CARTRIDGE;
let pkhexGenerationToken = 0;
let pkhexVerificationState = 'idle';
let latestPkhexResult = null;
let latestPkhexAttempt = null;

function getPkhexChecksumCheck(result) {
  return Array.isArray(result?.checks)
    ? result.checks.find(check => String(check?.identifier || '').toLowerCase() === 'checksum') || null
    : null;
}

function isPkhexChecksumValid(result) {
  return String(getPkhexChecksumCheck(result)?.severity || '').toLowerCase() === 'valid';
}

function isFullyPkhexVerified(result) {
  return result?.valid === true && result?.parsed === true && isPkhexChecksumValid(result);
}

function setPkhexLegalityEnvironment(environment) {
  if (!Object.values(PKHEX_ENVIRONMENT).includes(environment)) {
    throw new TypeError(`Unsupported PKHeX legality environment: ${environment}`);
  }
  pkhexLegalityEnvironment = environment;
}

function renderPkhexVerificationStatus(state, result = latestPkhexResult) {
  const container = document.getElementById('pkhexVerificationStatus');
  const label = document.getElementById('pkhexVerificationText');
  const reportButton = document.getElementById('pkhexReportBtn');
  const retryButton = document.getElementById('pkhexRetryBtn');
  if (!container || !label || !reportButton || !retryButton) return;

  pkhexVerificationState = state;
  container.dataset.state = state;
  container.hidden = state === 'idle';
  reportButton.hidden = true;
  retryButton.hidden = true;

  if (state === 'checking') {
    label.textContent = '⏳ Verifying with PKHeX...';
  } else if (state === 'verified') {
    label.textContent = '✓ Verified by PKHeX.Core';
    reportButton.hidden = false;
  } else if (state === 'failed') {
    label.textContent = '✕ PKHeX verification failed';
    reportButton.hidden = false;
  } else if (state === 'unavailable') {
    label.textContent = '⚠ PKHeX verification unavailable';
    retryButton.hidden = !latestPkhexAttempt;
  } else if (state === 'stale') {
    label.textContent = '○ Verification outdated';
    reportButton.hidden = !result;
  } else {
    label.textContent = '';
  }
}

function formatPkhexEnvironment(environment) {
  if (environment === PKHEX_ENVIRONMENT.SWITCH_FRLG) return 'Nintendo Switch FRLG (switch-frlg)';
  if (environment === PKHEX_ENVIRONMENT.GBA_CARTRIDGE) return 'Original GBA / cartridge (gba-cartridge)';
  return environment || 'Unknown';
}

function setPkhexReportValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function getPkhexVerboseLineSeverity(line) {
  const normalized = String(line || '').toLowerCase();
  if (/\b(invalid|illegal|not valid|fail(?:ed|ure)?|error)\b/.test(normalized)) return 'invalid';
  if (/\b(fishy|suspicious|warning|unverified)\b/.test(normalized)) return 'fishy';
  if (/\bvalid\b/.test(normalized)) return 'valid';
  return '';
}

function renderPkhexVerboseReport(result) {
  const element = document.getElementById('pkhexVerboseReport');
  if (!element) return;

  const report = String(
    result?.verboseReport || result?.simpleReport || 'No legality report was returned.',
  );
  element.replaceChildren();

  for (const part of report.split(/(\r?\n)/)) {
    const line = document.createElement('span');
    const severity = getPkhexVerboseLineSeverity(part);
    line.className = severity
      ? `pkhex-verbose-line pkhex-verbose-line-${severity}`
      : 'pkhex-verbose-line';
    line.textContent = part;
    element.appendChild(line);
  }
}

function renderPkhexChecks(result) {
  const section = document.getElementById('pkhexStructuredChecks');
  const container = document.getElementById('pkhexChecksList');
  if (!section || !container) return;

  container.replaceChildren();
  const checks = Array.isArray(result?.checks) ? result.checks : [];
  section.hidden = checks.length === 0;
  for (const check of checks) {
    const row = document.createElement('div');
    row.className = 'pkhex-check-row';

    const heading = document.createElement('div');
    heading.className = 'pkhex-check-heading';
    const identifier = document.createElement('strong');
    identifier.textContent = check?.identifier || 'Check';
    const severity = document.createElement('span');
    severity.className = 'pkhex-check-severity';
    severity.dataset.severity = String(check?.severity || '').toLowerCase();
    severity.textContent = check?.severity || 'Unknown';
    heading.append(identifier, severity);

    const message = document.createElement('p');
    message.textContent = check?.message || '';
    row.append(heading, message);
    container.appendChild(row);
  }
}

function openPkhexLegalityReport() {
  if (!latestPkhexResult) return;

  const verified = isFullyPkhexVerified(latestPkhexResult);
  const checksum = isPkhexChecksumValid(latestPkhexResult);
  const staleSuffix = pkhexVerificationState === 'stale' ? ' (outdated)' : '';
  setPkhexReportValue('pkhexReportResult', `${verified ? 'Verified' : 'Failed'}${staleSuffix}`);
  setPkhexReportValue('pkhexReportEnvironment', formatPkhexEnvironment(latestPkhexResult.environment));
  setPkhexReportValue('pkhexReportVersion', latestPkhexResult.pkhexVersion || 'Unknown');
  setPkhexReportValue('pkhexReportChecksum', checksum ? 'Valid' : 'Invalid');
  renderPkhexVerboseReport(latestPkhexResult);
  renderPkhexChecks(latestPkhexResult);

  const overlay = document.getElementById('pkhexReportOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('pkhexReportClose')?.focus();
}

function closePkhexLegalityReport() {
  const overlay = document.getElementById('pkhexReportOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.getElementById('pkhexReportBtn')?.focus();
}

function beginPkhexVerification(sourceBytes, environment = pkhexLegalityEnvironment) {
  if (!(sourceBytes instanceof Uint8Array) || sourceBytes.byteLength !== 80) {
    latestPkhexAttempt = null;
    renderPkhexVerificationStatus('unavailable');
    return;
  }

  // This is the exact final encrypted stored-Pokémon buffer used by the ACE
  // payload. Copy it at the Generate boundary and do not reinterpret it here.
  const exactBytes = sourceBytes.slice();
  const requestToken = ++pkhexGenerationToken;
  latestPkhexAttempt = { bytes: exactBytes.slice(), environment };
  latestPkhexResult = null;
  renderPkhexVerificationStatus('checking', null);

  void validateExactStoredPokemon(exactBytes, environment)
    .then(result => {
      if (requestToken !== pkhexGenerationToken) return;
      if (!result || result.error) {
        renderPkhexVerificationStatus('unavailable', null);
        return;
      }

      latestPkhexResult = result;
      renderPkhexVerificationStatus(isFullyPkhexVerified(result) ? 'verified' : 'failed', result);
    })
    .catch(error => {
      if (requestToken !== pkhexGenerationToken) return;
      console.warn('PKHeX verification unavailable:', error);
      renderPkhexVerificationStatus('unavailable', null);
    });
}

function retryPkhexVerification() {
  if (!latestPkhexAttempt) return;
  beginPkhexVerification(latestPkhexAttempt.bytes, latestPkhexAttempt.environment);
}

function markPkhexVerificationStale() {
  if (pkhexVerificationState === 'idle' || pkhexVerificationState === 'stale') return;
  pkhexGenerationToken += 1;
  latestPkhexAttempt = null;
  renderPkhexVerificationStatus('stale', latestPkhexResult);
}

function markGeneratedCodeFresh() {
  hasGeneratedCode = true;
  const warning = document.getElementById('generatedCodeStaleWarning');
  if (warning) warning.hidden = true;
}

function markGeneratedCodeStale() {
  if (!hasGeneratedCode) return;
  const warning = document.getElementById('generatedCodeStaleWarning');
  if (warning) warning.hidden = false;
  markPkhexVerificationStale();
}

function getProfileEncounterSignature() {
  const ids = ['species', 'mysteryEvent', 'staticCategory', 'staticEncounter', 'shadowEncounter', 'cxdTradeEncounter'];
  const selection = ids.map(id => String(document.getElementById(id)?.value || '')).join('|');
  return `${currentEncounterMode}|${selection}`;
}

function getProfileEncounterDefaultGameId() {
  const encounterSignature = getProfileEncounterSignature();
  if (encounterSignature !== lastProfileEncounterSignature) {
    lastProfileEncounterSignature = encounterSignature;
    profileEncounterDefaultGameId = Number(document.getElementById('originGame')?.value || 0);
  }
  return profileEncounterDefaultGameId;
}

function setProfileEncounterDefaultGameFromSetup(gameId) {
  profileEncounterDefaultGameId = Number(gameId) || 0;
  lastProfileEncounterSignature = getProfileEncounterSignature();
  lastProfileTrainerSignature = '';
}

function getProfileTrainerSignature() {
  return `${profileWorkspaceController?.getActiveProfile()?.id || ''}|${getProfileEncounterSignature()}|${getProfileEncounterDefaultGameId()}`;
}

function isProfileEditableField(element) {
  return Boolean(element && !element.disabled && element.dataset.profileLocked !== '1');
}

function applyActiveProfileTrainerDefaults({ force = false } = {}) {
  if (!profileWorkspaceController || suppressProfileTrainerDefaults || currentEncounterMode === 'imported') return false;
  if (!Number(document.getElementById('species')?.value || 0)) return false;
  const signature = getProfileTrainerSignature();
  if (!force && signature === lastProfileTrainerSignature) return false;

  const originGameElement = document.getElementById('originGame');
  const defaultGameId = getProfileEncounterDefaultGameId();
  const currentGameId = Number(originGameElement?.value || 0);
  const activeIdentity = profileWorkspaceController.getActiveProfile()?.saves?.[0] || null;
  const identity = profileIdentityMatchesEncounter(activeIdentity, defaultGameId, currentGameId)
    ? activeIdentity
    : null;

  lastProfileTrainerSignature = getProfileTrainerSignature();
  if (!identity) return false;

  let changed = false;
  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (!isProfileEditableField(element) || value == null) return;
    const nextValue = String(value);
    if (String(element.value) === nextValue) return;
    element.value = nextValue;
    changed = true;
  };

  // Distribution encounters can have broader UI choices while still owning
  // their language. Only regular recipient-owned encounters inherit profile
  // language automatically.
  if (!['mystery', 'cxd_shadow', 'cxd_trade'].includes(currentEncounterMode)) {
    const language = document.getElementById('language');
    const languageOption = Array.from(language?.options || [])
      .find(option => String(option.value) === String(identity.languageId));
    if (languageOption && !languageOption.disabled && isProfileEditableField(language)) {
      setValue('language', identity.languageId);
      if (changed) {
        language.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
  setValue('tid', identity.tid);
  setValue('sid', identity.sid);
  setValue('otGender', identity.otGender);
  syncLanguageTextLimits();
  const otNameElement = document.getElementById('otName');
  const maxOtLength = Number(otNameElement?.maxLength || 7);
  setValue('otName', String(identity.otName || '').slice(0, maxOtLength > 0 ? maxOtLength : 7));

  if (changed) {
    markGeneratedCodeStale();
    try { _validateForm?.(); } catch (error) {}
  }
  return changed;
}

function queueActiveProfileTrainerDefaults({ force = false } = {}) {
  if (profileTrainerDefaultsQueued) return;
  profileTrainerDefaultsQueued = true;
  queueMicrotask(() => {
    profileTrainerDefaultsQueued = false;
    applyActiveProfileTrainerDefaults({ force });
  });
}

function recordRecentGeneration(bytes, base64Text) {
  if (!profileWorkspaceController || typeof _captureProfileWorkspaceSnapshot !== 'function') return;
  try {
    const captured = _captureProfileWorkspaceSnapshot(bytes, base64Text);
    if (!captured) return;
    profileWorkspaceController.recordGeneration(captured).catch(error => {
      console.warn('Could not save recent generation:', error);
    });
  } catch (error) {
    console.warn('Could not capture recent generation:', error);
  }
}

// Ensure a safe no-op exists early so callers from earlier code don't throw
function updateMysterySpeciesOptions(/*tag*/) { return; }

function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function getDeoxysBaseStatsForOriginGame(originGameId) {
  if (originGameId === 4) return DEOXYS_FORM_BASE_STATS.attack;
  if (originGameId === 5) return DEOXYS_FORM_BASE_STATS.defense;
  if (originGameId === 3) return DEOXYS_FORM_BASE_STATS.speed;
  return DEOXYS_FORM_BASE_STATS.normal;
}

function getDisplayedBaseStats(speciesId) {
  if (speciesId === DEOXYS_SPECIES_ID) {
    return getDeoxysBaseStatsForOriginGame(Number($('#originGame')?.value || 0));
  }
  return BASE_STATS[speciesId] || null;
}

function getNatureStatMultiplier(statKey) {
  const natureIndex = clampNumber($('#nature')?.value, 0, 24, 0);
  return Math.round(getNatureMultiplier(natureIndex, statKey) * 100);
}

function calculateDisplayedStat({ speciesId, statKey, base, iv, ev, level }) {
  if (speciesId === SHEDINJA_SPECIES_ID && statKey === 'hp') return 1;
  const evPoints = Math.floor(ev / 4);
  const raw = Math.floor(((2 * base + iv + evPoints) * level) / 100);
  if (statKey === 'hp') return raw + level + 10;
  return Math.floor((raw + 5) * getNatureStatMultiplier(statKey) / 100);
}

function getStatBarColor(baseStat) {
  return STAT_BAR_COLORS.find(entry => baseStat <= entry.max) || STAT_BAR_COLORS[STAT_BAR_COLORS.length - 1];
}

function updateStatGraph() {
  const speciesId = Number($('#species')?.value || 0);
  const baseStats = getDisplayedBaseStats(speciesId);
  const level = clampNumber($('#level')?.value, 1, 100, 1);
  const natureIndex = clampNumber($('#nature')?.value, 0, 24, 0);
  const natureName = NATURES[natureIndex] || 'neutral nature';
  const natureEffect = getNatureEffect(natureIndex);

  for (const row of STAT_GRAPH_ROWS) {
    const baseEl = document.getElementById(row.baseId);
    const baseBarEl = document.getElementById(row.baseBarId);
    const powerBarEl = document.getElementById(row.powerBarId);
    const markerEl = document.getElementById(row.markerId);
    const trackEl = document.getElementById(row.trackId);
    const finalEl = document.getElementById(row.finalId);
    const rowEl = baseEl?.closest('.stat-graph-row');
    if (!baseStats) {
      if (baseEl) baseEl.textContent = '--';
      if (baseBarEl) baseBarEl.style.width = '0%';
      if (powerBarEl) powerBarEl.style.width = '0%';
      if (markerEl) markerEl.style.left = '0%';
      if (rowEl) rowEl.dataset.natureEffect = 'neutral';
      if (finalEl) finalEl.textContent = '--';
      continue;
    }

    const base = Number(baseStats[row.key]) || 0;
    const iv = clampNumber(document.getElementById(row.ivId)?.value, 0, 31, 0);
    const ev = clampNumber(document.getElementById(row.evId)?.value, 0, 252, 0);
    const finalStat = calculateDisplayedStat({ speciesId, statKey: row.key, base, iv, ev, level });
    const powerValue = getAdjustedStatBarValue({ base, ev, natureIndex, statKey: row.key });
    const baseBarColor = getStatBarColor(base);
    const powerBarColor = getStatBarColor(powerValue);
    const baseWidth = Math.min(100, (base / STAT_GRAPH_MAX_BASE) * 100);
    const powerWidth = Math.min(100, (powerValue / STAT_GRAPH_MAX_BASE) * 100);
    const natureState = natureEffect.up === row.key
      ? 'boosted'
      : natureEffect.down === row.key
        ? 'lowered'
        : 'neutral';
    if (baseEl) baseEl.textContent = String(base);
    if (baseBarEl) baseBarEl.style.width = `${baseWidth}%`;
    if (powerBarEl) powerBarEl.style.width = `${powerWidth}%`;
    if (markerEl) markerEl.style.left = `${baseWidth}%`;
    if (trackEl) {
      trackEl.style.setProperty('--stat-base-bar-color', baseBarColor.color);
      trackEl.style.setProperty('--stat-base-bar-color-soft', baseBarColor.soft);
      trackEl.style.setProperty('--stat-power-bar-color', powerBarColor.color);
      trackEl.style.setProperty('--stat-power-bar-color-soft', powerBarColor.soft);
      trackEl.setAttribute('aria-label', `${row.label}: the line marks base ${base}; the filled bar includes ${ev} EVs and the ${natureName} nature.`);
    }
    if (rowEl) rowEl.dataset.natureEffect = natureState;
    if (finalEl) finalEl.textContent = String(finalStat);
  }
}

function randomizeHatchedIvs() {
  if (currentEncounterMode !== 'hatched') return;

  for (const selector of ivIds) {
    const input = $(selector);
    if (input) input.value = String(Math.floor(Math.random() * 32));
  }

  updateHiddenPower();
  updateStatGraph();
  try { _validateForm?.(); } catch (e) {}
  try { updateLegalityStatus(); } catch (e) {}
  markGeneratedCodeStale();
}

    // Apply event-level defaults (TID/SID, OT name per language, shiny lock, origin, met location/level, ball, fateful flag, default PID)
    function applyEventDefaults(tag) {
      if (!tag) return;
      const evt = MYSTERY_EVENTS[tag];
      console.log('applyEventDefaults for', tag, evt);
      if (!evt) return;

        // If there is no event-level metadata but there are per-pokemon entries
        // for this tag, apply sensible defaults from the first entry so the
        // UI updates immediately. Also attempt to reload mystery data in the
        // background to populate `MYSTERY_EVENTS` for future selections.
        if (!evt && MYSTERY_GIFTS[tag] && MYSTERY_GIFTS[tag].length) {
          const first = MYSTERY_GIFTS[tag][0];
          if (first.fixedTID !== undefined) $('#tid').value = String(first.fixedTID);
          if (first.fixedSID !== undefined) $('#sid').value = String(first.fixedSID);
          if (first.ot_name) $('#otName').value = first.ot_name;
          if (first.ot_gender) $('#otGender').value = String(first.ot_gender).toLowerCase();
          if (first.pid) {
            const pidEl = $('#pid'); if (pidEl) pidEl.value = String(first.pid);
          }
          if (first.ivs && first.ivs.length >= 6) {
            $('#ivHp').value = String(first.ivs[0]||0);
            $('#ivAtk').value = String(first.ivs[1]||0);
            $('#ivDef').value = String(first.ivs[2]||0);
            $('#ivSpe').value = String(first.ivs[3]||0);
            $('#ivSpAtk').value = String(first.ivs[4]||0);
            $('#ivSpDef').value = String(first.ivs[5]||0);
          }
          // Try to refresh full events metadata in background
          try { loadMysteryGifts(); } catch (e) {}
          return;
        }

        // TID / SID
        if (evt.fixedTID !== undefined) $('#tid').value = String(evt.fixedTID);
        else if (evt.defaultTID !== undefined) $('#tid').value = String(evt.defaultTID);
        if (evt.fixedSID !== undefined) $('#sid').value = String(evt.fixedSID);

      // OT name: prefer event default language when provided (fallback English).
      const preferredLangId = String(evt.defaultLanguage !== undefined ? evt.defaultLanguage : 2);
      try {
        const langEl = $('#language');
        if (langEl) {
          const allowedLanguages = Array.isArray(evt.allowedLanguages)
            ? new Set(evt.allowedLanguages.map(value => String(value)))
            : null;
          if (allowedLanguages && langEl.options) {
            for (const option of Array.from(langEl.options)) {
              option.disabled = !allowedLanguages.has(String(option.value));
            }
          }
          langEl.value = preferredLangId;
          langEl.dispatchEvent(new Event('change'));
        }
      } catch (e) {}

      if (evt.ot_names && evt.ot_names[preferredLangId]) {
        $('#otName').value = evt.ot_names[preferredLangId];
      } else if (evt.ot_names && evt.ot_names[String($('#language')?.value || preferredLangId)]) {
        $('#otName').value = evt.ot_names[String($('#language')?.value || preferredLangId)];
      } else if (evt.ot_name) {
        $('#otName').value = evt.ot_name;
      }

      // Fixed event nicknames stay exact. Otherwise use the localized species
      // name for the event's receiving language (Japanese => kana, max 5).
      setDistributionNicknameDefault({
        nickname: evt.nickname,
        speciesId: Number($('#species')?.value || 0),
        languageId: Number(preferredLangId),
      });

      // OT gender if provided
      if (evt.ot_gender !== undefined) {
        const og = $('#otGender'); if (og) og.value = String(evt.ot_gender).toLowerCase();
      }

      // Disable Pokémon gender selection for mystery gifts to prevent
      // user changes (mystery events define fixed genders via presets).
      try {
        const genderEl = $('#gender');
        if (genderEl) {
          genderEl.disabled = (!manualOverrideActive && currentEncounterMode === 'mystery');
        }
      } catch (e) {}

      // Shiny lock
      const shinyCheckbox = $('#shiny');
      if (shinyCheckbox) {
        if (evt.alwaysShiny) {
          shinyCheckbox.checked = true;
          shinyCheckbox.disabled = true;
          shinyCheckbox.title = 'This event is always shiny.';
        } else if (evt.shinyLocked) {
          const unlockShinyLock = shouldUnlockCelebiShinyLock(tag, evt);
          if (!unlockShinyLock) shinyCheckbox.checked = false;
          shinyCheckbox.disabled = !unlockShinyLock;
          shinyCheckbox.title = unlockShinyLock ? '' : 'This Pokemon is shiny locked.';
        } else {
          shinyCheckbox.disabled = false;
          shinyCheckbox.title = '';
        }
      }

      // Origin game
      if (evt.defaultOriginGame !== undefined) {
        const originGameSelect = $('#originGame');
        if (originGameSelect) {
          originGameSelect.value = String(evt.defaultOriginGame);
          // Update metLocation options for that game
          if (metLocationWrapper && metLocationWrapper.updateList) {
            try {
              metLocationWrapper.updateList(getLocationsForGame(evt.defaultOriginGame));
            } catch (e) {}
          }
        }
      }

      // Met location
      if (evt.defaultMetLocationId !== undefined) {
        const sel = $('#metLocation'); if (sel) sel.value = String(evt.defaultMetLocationId);
      } else if (evt.defaultMetLocation) {
        const sel = $('#metLocation');
        if (sel) {
          try {
            const candidates = getLocationsForGame(Number($('#originGame')?.value) || evt.defaultOriginGame || 2);
            const found = candidates.find(loc => loc[1] && loc[1].toLowerCase().includes(evt.defaultMetLocation.toLowerCase()));
            if (found) sel.value = String(found[0]);
            else {
              const allFound = LOCATIONS.find(loc => loc[1] && loc[1].toLowerCase().includes(evt.defaultMetLocation.toLowerCase()));
              if (allFound) sel.value = String(allFound[0]);
            }
          } catch (e) {}
        }
      }

      // Met level
      if (evt.defaultMetLevel !== undefined) {
        const ml = $('#metLevel'); if (ml) ml.value = String(evt.defaultMetLevel);
        const levelEl = $('#level'); if (levelEl) {
          let newLevel = (evt.current_level !== undefined) ? evt.current_level : evt.defaultMetLevel;
          try {
            const tU = String(tag).toUpperCase();
            if (tU === '10ANNI') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'AURA_MEW') {
              newLevel = Math.max(10, Number(newLevel));
            } else if (tU === 'AGETO_CELEBI' || tU === 'MITSURIN_CELEBI') {
              newLevel = Math.max(10, Number(newLevel));
            } else if (tU === 'BOX_EVENT') {
              newLevel = Math.max(5, Number(newLevel));
            } else if (tU === 'DOEL_DEOXYS' || tU === 'SPACE_CENTER_DEOXYS') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'JOURNEY_ACROSS_AMERICA') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'PARTY_OF_THE_DECADE') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'POKEMON_ROCKS_METANG') {
              newLevel = Math.max(30, Number(newLevel));
            } else if (tU === 'WISHMKR_BEST' || tU === 'WISHMKR_SHINY' || isBerryFixMysteryTag(tU)) {
              newLevel = Math.max(5, Number(newLevel));
            } else if (tU === 'CHANNEL_JIRACHI') {
              newLevel = Math.max(5, Number(newLevel));
            }
          } catch (e) {}
          levelEl.value = String(newLevel);
        }
        // Compute total EXP for the set level (inline to avoid scope issues)
        try {
          const sid_local = Number($('#species')?.value || 0);
          const group_local = EXP_GROUPS[sid_local] ?? GROUP.MEDIUM_FAST;
          const lvl_local = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
          const exp_local = expForLevel(group_local, lvl_local);
          const expEl_local = document.querySelector('#expTotal');
          if (expEl_local) expEl_local.value = String(exp_local);
        } catch (e) {}
      }

      // Ball - prefer an exact numeric ID, then fall back to option text.
      if (evt.defaultBallId !== undefined) {
        const ballSel = $('#ball');
        if (ballSel) ballSel.value = String(evt.defaultBallId);
      } else if (evt.defaultBall) {
        const ballSel = $('#ball');
        if (ballSel) {
          const opts = ballSel.options && typeof ballSel.options[Symbol.iterator] === 'function' ? Array.from(ballSel.options) : Array.from(ballSel.querySelectorAll ? ballSel.querySelectorAll('option') : []);
          const opt = opts.find(o => (o.text || o.textContent || '').toLowerCase() === String(evt.defaultBall).toLowerCase());
          if (opt) ballSel.value = opt.value;
        }
      }

      // Held item default
      if (evt.defaultNoItem) {
        const itemEl = $('#item');
        if (itemEl) {
          itemEl.value = '';
          try { itemEl.dispatchEvent(new Event('change')); } catch (e) {}
        }
      } else if (evt.defaultItemId !== undefined) {
        const itemEl = $('#item');
        if (itemEl) {
          itemEl.value = String(evt.defaultItemId);
          try { itemEl.dispatchEvent(new Event('change')); } catch (e) {}
        }
      } else if (evt.defaultItem) {
        const itemEl = $('#item');
        if (itemEl) {
          const normalized = String(evt.defaultItem).toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = ITEMS.find(([id, name]) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
          if (match) {
            itemEl.value = String(match[0]);
            try { itemEl.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      }

      // Fateful encounter flag
      if (evt.defaultFatefulEncounter !== undefined) {
        const f = $('#fatefulEncounter');
        if (f) {
          // Special-case: 10ANNI event should keep met location but NOT check the fateful box
          if (String(tag).toUpperCase() === '10ANNI') {
            f.checked = false;
          } else {
            f.checked = Boolean(evt.defaultFatefulEncounter);
          }
        }
      }

      if (evt.defaultIsEgg !== undefined) {
        const isEggEl = $('#isEgg');
        if (isEggEl) isEggEl.checked = Boolean(evt.defaultIsEgg);
      }

      // If event requires fateful encounter, ensure met location is set to a "Fateful" entry
      if (evt.defaultFatefulEncounter && !evt.usesHatcherTrainerData && !isPcnyWishEggsMysteryTag(tag) && !isBoxEventMysteryTag(tag)) {
        try {
          const sel = $('#metLocation');
          if (sel) {
            // Determine candidate locations for current origin game
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            // Look for any location whose name contains 'fateful' (case-insensitive)
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
        } catch (e) {}
      }

      // Special-case: JOURNEY_ACROSS_AMERICA should set metLocation to a
      // Fateful entry but NOT check the fatefulEncounter checkbox.
      try {
        if (String(tag).toUpperCase() === 'JOURNEY_ACROSS_AMERICA') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // PARTY_OF_THE_DECADE: set met location to a Fateful entry but do not
      // check the fatefulEncounter checkbox (event metadata requests Fateful
      // location but the encounter is not flagged fateful in UI).
      try {
        if (String(tag).toUpperCase() === 'PARTY_OF_THE_DECADE') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // POKEMON_ROCKS_METANG should always default met location to a
      // Fateful Encounter entry.
      try {
        const tU = String(tag).toUpperCase();
        if (tU === 'POKEMON_ROCKS_METANG') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
        }
      } catch (e) {}

      // PARTY_OF_THE_DECADE: restrict language selection to English only
      try {
        if (String(tag).toUpperCase() === 'PARTY_OF_THE_DECADE') {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}

      // Default/fixed PID and other immutable specimen attributes.
      if (evt.fixedPID !== undefined) {
        const fixedPid = Number(evt.fixedPID) >>> 0;
        const pidEl = $('#pid');
        if (pidEl) pidEl.value = `0x${fixedPid.toString(16).toUpperCase().padStart(8, '0')}`;
        const natureEl = $('#nature');
        if (natureEl) natureEl.value = String(evt.fixedNature ?? (fixedPid % 25));
        const genderEl = $('#gender');
        if (genderEl && evt.fixedGender !== undefined) genderEl.value = String(evt.fixedGender).toLowerCase();
        const abilityEl = $('#ability');
        if (abilityEl && evt.fixedAbility !== undefined) {
          const abilityValue = String(evt.fixedAbility);
          const hasOption = Array.from(abilityEl.options || []).some(option => String(option.value) === abilityValue);
          if (!hasOption) {
            const baseLabel = abilityEl.options?.[0]?.textContent || `Ability slot ${Number(evt.fixedAbility) + 1}`;
            abilityEl.insertAdjacentHTML('beforeend', `<option value="${abilityValue}">${baseLabel} (slot ${Number(evt.fixedAbility) + 1})</option>`);
          }
          abilityEl.value = abilityValue;
        }
      } else if (evt.defaultPID) {
        const pidEl = $('#pid'); if (pidEl) pidEl.value = String(evt.defaultPID);
      }
      if (evt.fixedIVs) {
        $('#ivHp').value = String(evt.fixedIVs.hp);
        $('#ivAtk').value = String(evt.fixedIVs.atk);
        $('#ivDef').value = String(evt.fixedIVs.def);
        $('#ivSpe').value = String(evt.fixedIVs.spe);
        $('#ivSpAtk').value = String(evt.fixedIVs.spa);
        $('#ivSpDef').value = String(evt.fixedIVs.spd);
      }

      // WISHMKR_BEST: this version of the event does not allow shinies.
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_BEST') {
          const shinyCheckbox = $('#shiny');
          if (shinyCheckbox) {
            shinyCheckbox.checked = false;
            shinyCheckbox.disabled = true;
          }
        }
      } catch (e) {}

      // WISHMKR_BEST: set metLocation to a Fateful entry but do NOT check the fatefulEncounter box
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_BEST') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // Special-case language restrictions for certain events (e.g., 10ANNI disables Japanese)
      try {
        if (String(tag).toUpperCase() === '10ANNI') {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              if (String(o.value) === '1') o.disabled = true; // disable Japanese
            }
            if (String(langSel.value) === '1') {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // Aura Mew: force nickname to MEW, OT to 'Aura' for allowed languages,
      // and restrict selectable languages to EN/FR/IT/DE/ES.
      try {
        if (String(tag).toUpperCase() === 'AURA_MEW') {
          setTrackedNickname('MEW', NICKNAME_SOURCE.PRESET);

          const allowed = new Set(['2','3','4','5','7']); // EN, FR, IT, DE, ES
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = !allowed.has(String(o.value));
            }
            if (!allowed.has(String(langSel.value))) {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            } else {
              // ensure OT name is explicitly set
              const ot = $('#otName'); if (ot) ot.value = 'Aura';
              try { updateLegalityStatus(); } catch (e) {}
            }
          }

          // Ensure TID is set for Aura Mew
          try { const tidEl = $('#tid'); if (tidEl) tidEl.value = '20078'; } catch (e) {}

          // Ensure event metadata lists Aura as the OT for allowed languages
          evt.ot_names = evt.ot_names || {};
          for (const v of Array.from(allowed)) evt.ot_names[String(v)] = 'Aura';
        }
      } catch (e) {}

          // JOURNEY_ACROSS_AMERICA: restrict language to English only
          try {
            if (String(tag).toUpperCase() === 'JOURNEY_ACROSS_AMERICA') {
              const langSel = $('#language');
              if (langSel && langSel.options) {
                for (const o of Array.from(langSel.options)) {
                  o.disabled = String(o.value) !== '2';
                }
                langSel.value = '2';
                try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
              }
            }
          } catch (e) {}

      // Populate mystery species options if event-level species list exists
      updateMysterySpeciesOptions(tag);

      // Data-driven event ribbons.
      if (evt.ribbons) {
        const ribbonMap = {
          national: 'ribbonNational', country: 'ribbonCountry', earth: 'ribbonEarth',
          battleChampion: 'ribbonBattleChampion', regionalChampion: 'ribbonRegionalChampion',
          nationalChampion: 'ribbonNationalChampion', world: 'ribbonWorld',
        };
        for (const [key, elementId] of Object.entries(ribbonMap)) {
          const element = document.getElementById(elementId);
          if (element && Object.prototype.hasOwnProperty.call(evt.ribbons, key)) {
            element.checked = Boolean(evt.ribbons[key]);
          }
        }
      }

      // Trigger UI recalculations / derived updates
      try {
        updateGenderFromPID();
      } catch (e) {}

      // POKEMON_ROCKS_METANG: ensure National ribbon is checked
      try {
        if (String(tag).toUpperCase() === 'POKEMON_ROCKS_METANG') {
          const national = $('#ribbonNational');
          if (national) {
            national.checked = true;
          }
        }
      } catch (e) {}

      // Force English-only languages for specific events where only English
      // game versions are supported in this dataset.
      try {
        const englishOnly = ['POKEMON_ROCKS_METANG','WISHMKR_BEST','WISHMKR_SHINY','DOEL_DEOXYS','SPACE_CENTER_DEOXYS','BERRY_PROGRAM_UPDATE_ZIGZAGOON','BERRY_PROGRAM_UPDATE_ZIGZAGOON_RUBY','CHANNEL_JIRACHI','PCNY_WISH_EGGS','MYSTRY_MEW'];
        if (englishOnly.includes(String(tag).toUpperCase())) {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}

      // PCNY Wish Eggs: use FR/LG hatch locations (not Fateful met-location),
      // keep fateful flag enabled separately, and enforce hatched-style defaults.
      try {
        if (isPcnyWishEggsMysteryTag(tag)) {
          applyPcnyWishEggsOriginAndLocationConstraints();

          const metLocationEl = $('#metLocation');
          if (metLocationEl) metLocationEl.value = String(PCNY_WISH_EGGS_DEFAULT_MET_LOCATION_ID);

          const metLevelEl = $('#metLevel');
          if (metLevelEl) metLevelEl.value = '0';

          const levelEl = $('#level');
          if (levelEl && (!String(levelEl.value || '').trim() || Number(levelEl.value) < 5)) {
            levelEl.value = '5';
            try { computeAndSetExpFromLevel(); } catch (e) {}
          }

          const f = $('#fatefulEncounter');
          if (f) f.checked = true;

          const eggEl = $('#isEgg');
          if (eggEl) eggEl.checked = false;

          const otNameEl = $('#otName');
          if (otNameEl) {
            otNameEl.disabled = false;
            otNameEl.style.pointerEvents = '';
            otNameEl.style.opacity = '';
            otNameEl.style.cursor = '';
          }
        }
      } catch (e) {}

      try {
        if (evt.usesHatcherTrainerData && !isPcnyWishEggsMysteryTag(tag)) {
          applyMysteryEventOriginConstraints(evt, { hatcherLocations: true });
        } else if (Array.isArray(evt.allowedOriginGames)) {
          applyMysteryEventOriginConstraints(evt);
        }
      } catch (e) {}

      // MYSTRY Mew: restrict Origin Game to Ruby.
      try {
        if (isMystryMewMysteryTag(tag)) {
          applyMystryMewOriginGameConstraints();
        }
      } catch (e) {}

      // WISHMKR Jirachi: restrict Origin Game to Ruby.
      try {
        if (isWishmkrMysteryTag(tag)) {
          applyWishmkrOriginGameConstraints();
        }
      } catch (e) {}

      // BOX_EVENT: keep the Fateful Encounter checkbox disabled/unchecked.
      // Non-egg defaults: Route 117 (RSE) or Four Island (FRLG).
      // Egg: met location switches to Fateful Encounter.
      try {
        if (isBoxEventMysteryTag(tag)) {
          const f = $('#fatefulEncounter');
          if (f) f.checked = false;
          applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: false });
        }
      } catch (e) {}

      // WISHMKR_SHINY: set metLocation to a Fateful entry (but do NOT check
      // the fatefulEncounter box), force shiny checked+locked, and restrict
      // available natures to the specific set provided in the JSON for this
      // event so only those 9 preset PIDs are selectable.
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_SHINY') {
          // set met location to a Fateful entry
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;

          const shinyEl = $('#shiny');
          if (shinyEl) {
            shinyEl.checked = true;
            shinyEl.disabled = true;
            shinyEl.title = 'This event is always shiny.';
          }

          // Restrict nature choices to those present in the mystery JSON for this tag
          try {
            const allowed = new Set();
            const entries = MYSTERY_GIFTS[tag] || [];
            for (const e of entries) {
              if (!e) continue;
              const n = e.nature;
              if (n === undefined || n === null) continue;
              // numeric index
              if (!isNaN(Number(n))) {
                allowed.add(Number(n));
                continue;
              }
              // string name -> find index in NATURES (case-insensitive, canonical)
              const target = String(n).toLowerCase().replace(/[^a-z]/g,'');
              for (let i = 0; i < NATURES.length; i++) {
                const canon = String(NATURES[i] || '').toLowerCase().replace(/[^a-z]/g,'');
                if (canon && canon === target) { allowed.add(i); break; }
              }
            }
            const natSel = $('#nature');
            if (natSel && natSel.options) {
              // If no allowed natures found, leave options alone
              if (allowed.size) {
                for (const o of Array.from(natSel.options)) {
                  // option values are indices as strings
                  const val = Number(o.value);
                  // Keep placeholder (empty) enabled
                  if (o.value === '') { o.disabled = false; continue; }
                  o.disabled = !allowed.has(val);
                }
                // If current selection not allowed, pick first allowed
                const cur = Number(natSel.value || -1);
                if (!allowed.has(cur)) {
                  const first = Array.from(allowed)[0];
                  if (first !== undefined) {
                    natSel.value = String(first);
                    try { natSel.dispatchEvent(new Event('change')); } catch (e) {}
                  }
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
      // ── CHANNEL_JIRACHI special handling ──────────────────────────
      try {
        if (String(tag).toUpperCase() === 'CHANNEL_JIRACHI') {
          // Channel Jirachi uses XDRNG-based PID — not pre-computed.
          // Disable the simple shiny checkbox (shiny only via Find Legal PID).
          const shinyCheckbox = $('#shiny');
          if (shinyCheckbox) {
            shinyCheckbox.checked = false;
            shinyCheckbox.disabled = true;
          }

          // SID is determined by the Channel RNG — clear it for now.
          // The user will get it from Find Legal PID.
          const sidEl = $('#sid');
          if (sidEl) sidEl.value = '0';

          // Force language to English (Channel Jirachi is English-only)
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }

          // set met location to Fateful entry if present
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || 1;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;

          // Show PID Finder row and Make Shiny row for Channel Jirachi
          const pfRow = document.getElementById('pidFinderRow');
          if (pfRow) pfRow.style.display = 'flex';
          const makeShinyRow = document.getElementById('makeShinyRow');
          if (makeShinyRow) makeShinyRow.style.display = 'flex';
          // Hide simple shiny row (replaced by Make Shiny btn)
          try {
            const shinyExtRows = document.querySelectorAll('.shiny-external');
            for (const r of shinyExtRows) r.style.display = 'none';
          } catch (e) {}

          // All natures should be available
          const natSel = $('#nature');
          if (natSel && natSel.options) {
            for (const o of Array.from(natSel.options)) o.disabled = false;
          }

          // Moves: Wish, Confusion, Rest
          try {
            const channelMoves = [273, 93, 156];
            for (let i = 0; i < 4; i++) {
              const el = $(`#move${i+1}`);
              if (!el) continue;
              el.value = i < channelMoves.length ? String(channelMoves[i]) : '';
              try { el.dispatchEvent(new Event('change')); } catch (e) {}
            }
          } catch (e) {}
        }
      } catch (e) {}
      try { updatePidFinderVisibility(); } catch (e) {}
      try { checkShiny(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    }
let currentEncounterMode = '';

/** Return the selected NPC in-game trade, or null outside trade mode. */
function getSelectedCXDTrade() {
  if (currentEncounterMode !== 'cxd_trade') return null;
  const sel = document.getElementById('cxdTradeEncounter');
  if (!sel) return null;
  const encounters = getXDTradesForSpecies(Number($('#species').value) || 0);
  return encounters[Number(sel.value) || 0] || null;
}

/** Return the selected Colosseum/XD encounter, including special encounters. */
function getSelectedCXDEncounter() {
  if (currentEncounterMode !== 'cxd_shadow') return null;
  const sel = document.getElementById('shadowEncounter');
  if (!sel?.value) return null;
  const speciesId = Number($('#species').value) || 0;
  const encounters = getCXDEncountersForSpecies(speciesId);
  return encounters[Number(sel.value) || 0] || null;
}

// When true, the PID Finder has set the met level and it should stay locked
let pidFinderLockedMetLevel = false;
// When true, a PID Finder result is applied — protects PID/IVs/nature from preset overwrites
let pidFinderResultActive = false;
// TID/SID that were used when the PID Finder result was selected (for change detection)
let pidFinderOriginalTid = 0;
let pidFinderOriginalSid = 0;
// True after a PID Finder result has been selected until it is explicitly cleared.
let pidFinderHadSelection = false;
// Mystery event tag that the current PID Finder result belongs to.
let pidFinderMysteryTag = '';
// Internal ability bit returned by the active PID Finder result. Keep it
// separate from UI repopulation; single-ability species are normalized to 0.
let pidFinderResultAbilityBit = null;
// Assigned from boot() so non-boot modules (PID finder modal) can clear active locks safely.
let unlockPidFinderFieldsFn = null;
// When true, the Manual Override checkbox is active — all field locks are bypassed
let manualOverrideActive = false;
const RS_ORIGIN_GAME_IDS = new Set([1, 2]); // Sapphire, Ruby
const RS_TRAINER_ID_LEGALITY_MESSAGE = 'Ruby/Sapphire trainer IDs must be obtainable from the R/S RNG. This TID/SID pair is not possible.';
let rsTrainerIdValidationCache = { tid: null, sid: null, valid: null };
// Per-encounter-mode field snapshots to prevent cross-mode value bleed.
const encounterModeStateCache = {};
// Raw imported bytes for exact round-trip output in imported mode.
let importedRoundTripBytes = null;
let importedRoundTripDirty = true;
let suppressImportedDirtyTracking = false;
let outputCodeTarget = 'console';
const manualSwitchSymbolBoxes = new Set();
let importedPokerusState = null;
let pokerusDropdownDirty = false;
const makeShinyUndoStateByMode = {};
let suppressMakeShinyUndoClear = false;
// When true, skip applying simple-mode PID presets (used during imports)
let suppressPresetApply = false;
// When true, suppress marking user-change events while programmatically applying presets
let suppressUserChangeMark = false;
// Species ID for which a mystery preset was last applied (or 0/null when none)
let mysteryPresetAppliedFor = 0;
// Whether the user has modified fields (other than nickname) since the preset was applied
let mysteryUserModifiedSincePreset = false;
let preserveSpeciesOnNextModeChange = false;
let deferExactPresetOnNextModeChange = false;
let selectedStaticEncounterDetail = null;
let nicknameLocalizationState = createNicknameState();

function setTrackedNickname(value, source, speciesId = Number($('#species')?.value || 0)) {
  const nicknameEl = $('#nickname');
  if (!nicknameEl) return false;
  nicknameEl.value = String(value ?? '');
  nicknameLocalizationState = createNicknameState(source, speciesId);
  return true;
}

function setLocalizedSpeciesNickname(speciesId, languageId, { force = false } = {}) {
  const id = Number(speciesId) || 0;
  if (!id || currentEncounterMode === 'imported') return false;
  if (!force && !shouldSynchronizeSpeciesNickname(nicknameLocalizationState, id, currentEncounterMode)) {
    return false;
  }
  const localizedName = getLocalizedSpeciesName(id, languageId);
  if (!localizedName) return false;
  return setTrackedNickname(localizedName, NICKNAME_SOURCE.SPECIES_DEFAULT, id);
}

function syncLanguageTextLimits() {
  applyLanguageTextLimits({
    languageId: $('#language')?.value,
    nicknameInput: $('#nickname'),
    otNameInput: $('#otName'),
  });
}

// Distribution presets may provide a genuinely fixed nickname. When they do
// not, reset to the receiving language's species name instead of inheriting a
// stale nickname from the previously selected event.
function setDistributionNicknameDefault({ nickname, speciesId, languageId }) {
  let applied;
  if (nickname !== undefined) {
    applied = setTrackedNickname(nickname, NICKNAME_SOURCE.PRESET, speciesId);
  } else {
    applied = setLocalizedSpeciesNickname(speciesId, languageId, { force: true });
  }
  syncLanguageTextLimits();
  return applied;
}

function markNicknameAsUserEdited() {
  nicknameLocalizationState = createNicknameState(
    NICKNAME_SOURCE.USER,
    Number($('#species')?.value || 0)
  );
}

function markNicknameAsImported(speciesId = Number($('#species')?.value || 0)) {
  nicknameLocalizationState = createNicknameState(NICKNAME_SOURCE.IMPORTED, speciesId);
}

function restoreNicknameState(state) {
  if (!state) return;
  nicknameLocalizationState = createNicknameState(state.source, state.speciesId);
}

function isCurrentOriginSelectionResolved() {
  const speciesId = Number($('#species')?.value || 0);
  if (!speciesId) return false;
  if (currentEncounterMode === 'imported') return true;
  const originMode = String($('#pokemonOrigin')?.value || '');
  if (!originMode || originMode !== currentEncounterMode) return false;
  const definition = getOriginDefinition(originMode);
  if (!definition) return false;
  if (!definition.requiresExactEncounter) return true;
  if (originMode === 'mystery') return Boolean($('#mysteryEvent')?.value);
  if (originMode === 'static') {
    const availableEncounters = getStaticEncountersForSpecies(speciesId);
    return Boolean(
      $('#staticEncounter')?.value &&
      availableEncounters.includes(selectedStaticEncounterDetail?.encounter) &&
      Number(selectedStaticEncounterDetail.gameId) === Number($('#originGame')?.value || 0)
    );
  }
  if (originMode === 'cxd_shadow') return Boolean($('#shadowEncounter')?.value);
  return true;
}

const PID_PARITY_PREFERENCES = new Set(['any', 'even', 'odd']);
const GBA_GEN3_ORIGIN_GAME_IDS = new Set([1, 2, 3, 4, 5]);

function normalizePidParityPreference(value) {
  const normalized = String(value || 'any').toLowerCase();
  return PID_PARITY_PREFERENCES.has(normalized) ? normalized : 'any';
}

function matchesPidParity(pid, preference) {
  const pref = normalizePidParityPreference(preference);
  if (pref === 'even') return (pid & 1) === 0;
  if (pref === 'odd') return (pid & 1) === 1;
  return true;
}

function hasSingleNormalGen3Ability(speciesId) {
  const abilities = getSpeciesAbilities(Number(speciesId) || 0);
  return !!abilities && abilities[0] === abilities[1];
}

function pidParityContextSupportsCurrentMode() {
  return currentEncounterMode === 'wild' ||
    currentEncounterMode === 'hatched' ||
    currentEncounterMode === 'static';
}

function shouldShowPidParityPreference(speciesId) {
  const gameId = Number($('#originGame')?.value || 0);
  return pidParityContextSupportsCurrentMode() &&
    GBA_GEN3_ORIGIN_GAME_IDS.has(gameId) &&
    hasSingleNormalGen3Ability(speciesId) &&
    getGenderThreshold(Number(speciesId) || 0) !== -1;
}

function getPidParityPreferenceForSpecies(speciesId) {
  if (!shouldShowPidParityPreference(speciesId)) return 'any';
  return normalizePidParityPreference($('#pidParityPreference')?.value);
}

function getPidParityPreferenceForPidFinder(speciesId) {
  if (!shouldShowPidParityPreference(speciesId)) return 'any';
  return normalizePidParityPreference($('#pfPidParity')?.value || $('#pidParityPreference')?.value);
}

function requiresPidFinderForPidParity() {
  if (!(currentEncounterMode === 'wild' || currentEncounterMode === 'static')) return false;
  const speciesId = Number($('#species')?.value || 0);
  if (!shouldShowPidParityPreference(speciesId)) return false;
  return getPidParityPreferenceForSpecies(speciesId) !== 'any';
}

function hasRequiredPidFinderForPidParitySelection() {
  return !requiresPidFinderForPidParity() || !!pidFinderHadSelection;
}

function hasRequiredCXDEncounterPidFinderSelection() {
  if ((currentEncounterMode !== 'cxd_shadow' && currentEncounterMode !== 'cxd_trade') || manualOverrideActive) return true;
  if (currentEncounterMode === 'cxd_trade' && !isCXDGeneratedTrade(getSelectedCXDTrade())) return true;
  return pidFinderResultActive &&
    (Number($('#tid')?.value || 0) & 0xFFFF) === pidFinderOriginalTid &&
    (Number($('#sid')?.value || 0) & 0xFFFF) === pidFinderOriginalSid;
}

function syncPidParityPreferenceUi() {
  const speciesId = Number($('#species')?.value || 0);
  const show = shouldShowPidParityPreference(speciesId);
  const mainWrap = document.getElementById('pidParityPreferenceWrap');
  const mainSelect = document.getElementById('pidParityPreference');
  const pfRow = document.getElementById('pfPidParityRow');
  const pfSelect = document.getElementById('pfPidParity');

  if (mainSelect) {
    mainSelect.value = show ? normalizePidParityPreference(mainSelect.value) : 'any';
    mainSelect.disabled = !show;
  }
  if (mainWrap) mainWrap.hidden = !show;

  if (pfSelect) {
    const preferred = show ? normalizePidParityPreference(pfSelect.value || mainSelect?.value) : 'any';
    pfSelect.value = preferred;
    pfSelect.disabled = !show;
  }
  if (pfRow) pfRow.hidden = !show;
}

function isRubySapphireOriginGame(gameId) {
  return RS_ORIGIN_GAME_IDS.has(Number(gameId));
}

function shouldValidateRSTrainerId() {
  if (manualOverrideActive) return false;
  if (currentEncounterMode === 'mystery') return false;
  if (currentEncounterMode === 'cxd_trade' && !isCXDGeneratedTrade(getSelectedCXDTrade())) return false;
  if (currentEncounterMode === 'cxd_shadow') {
    const speciesId = Number($('#species')?.value || 0);
    const index = Number($('#shadowEncounter')?.value || 0);
    if (getCXDEncountersForSpecies(speciesId)[index]?.fixedSID !== undefined) return false;
  }
  return isRubySapphireOriginGame(Number($('#originGame')?.value || 0));
}

function getRSTrainerIdValidation() {
  if (!shouldValidateRSTrainerId()) {
    return { applies: false, valid: true };
  }

  const tid = Number($('#tid')?.value) & 0xffff;
  const sid = Number($('#sid')?.value) & 0xffff;
  if (rsTrainerIdValidationCache.tid !== tid || rsTrainerIdValidationCache.sid !== sid) {
    rsTrainerIdValidationCache = {
      tid,
      sid,
      valid: isValidRSTrainerId(tid, sid),
    };
  }

  return {
    applies: true,
    valid: rsTrainerIdValidationCache.valid,
    tid,
    sid,
  };
}

function updateRSTidSidWarning() {
  const warningEl = document.getElementById('rsTidSidWarning');
  if (!warningEl) return;

  const validation = getRSTrainerIdValidation();
  warningEl.style.display = validation.applies && !validation.valid ? '' : 'none';
}

function adjustShinySidForOriginGame(tid, pid, sid) {
  const originGame = Number($('#originGame')?.value || 0);
  if (!isRubySapphireOriginGame(originGame)) {
    return { sid: Number(sid) & 0xffff, adjusted: false, direction: 0, valid: true };
  }

  return adjustShinySidForRSTrainerId(tid, pid, sid);
}

function setControlLockState(el, shouldLock, options = {}) {
  if (!el) return;
  const locked = Boolean(shouldLock);
  el.disabled = locked;
  el.style.pointerEvents = locked ? 'none' : '';
  el.style.opacity = locked ? '0.6' : '';
  el.style.cursor = locked ? 'not-allowed' : '';

  const inputEl = typeof el.querySelector === 'function' ? el.querySelector('input') : null;
  if (!inputEl) return;

  inputEl.disabled = locked;
  inputEl.style.pointerEvents = locked ? 'none' : '';
  inputEl.style.opacity = '';
  inputEl.style.cursor = locked ? 'not-allowed' : '';
  if (options.autocompleteFieldStyle) {
    inputEl.style.borderColor = locked ? 'rgba(74, 158, 255, 0.3)' : '';
    inputEl.style.background = locked ? 'rgba(10, 20, 40, 0.6)' : '';
  }
}

function getSelectedMysteryAvailability(speciesId = Number($('#species')?.value || 0)) {
  const selectedTag = String(document.getElementById('mysteryEvent')?.value || '');
  if (!speciesId || !selectedTag) return null;
  const normalizedTag = selectedTag.toUpperCase();
  return getMysteryEventsForSpecies(speciesId, MYSTERY_EVENTS, MYSTERY_GIFTS)
    .find(candidate => String(candidate.tag || '').toUpperCase() === normalizedTag) || null;
}

function getCurrentOriginSourceSpeciesId(speciesId = Number($('#species')?.value || 0)) {
  const targetId = Number(speciesId) || 0;
  if (!targetId) return 0;

  if (currentEncounterMode === 'wild') {
    return getWildAncestor(targetId, WILD_ENCOUNTERS) || targetId;
  }
  if (currentEncounterMode === 'static') {
    return Number(getSelectedStaticEncounter()?.species) || targetId;
  }
  if (currentEncounterMode === 'roamer') {
    return getSpeciesLineage(targetId).find(sourceId => Boolean(ROAMER_SPECIES[sourceId])) || targetId;
  }
  if (currentEncounterMode === 'mystery') {
    return Number(getSelectedMysteryAvailability(targetId)?.sourceSpeciesIds?.[0]) || targetId;
  }
  if (currentEncounterMode === 'cxd_shadow') {
    const select = document.getElementById('shadowEncounter');
    const encounters = getCXDEncountersForSpecies(targetId);
    const encounter = select?.value === '' ? null : encounters[Number(select?.value) || 0];
    return Number(encounter?.species) || targetId;
  }
  if (currentEncounterMode === 'cxd_trade') {
    return Number(getSelectedCXDTrade()?.species) || targetId;
  }
  return targetId;
}

function getCurrentLevelFloor() {
  let floor = 1;
  const metLevel = Math.max(0, Math.min(100, Number($('#metLevel')?.value || 0)));
  floor = Math.max(floor, metLevel);

  if (currentEncounterMode === 'hatched') {
    const speciesId = Number($('#species')?.value || 0);
    const hatchedFloor = manualOverrideActive
      ? IS_EGG_OVERRIDE_LEVEL
      : getHatchedLevelFloor(speciesId);
    floor = Math.max(floor, hatchedFloor);
  } else if (currentEncounterMode === 'mystery') {
    floor = Math.max(
      floor,
      getMysteryGiftSourceLevel(getSelectedMysteryEvent().event, metLevel)
    );
  } else if (currentEncounterMode === 'static') {
    const speciesId = Number($('#species')?.value || 0);
    if (speciesId === 151) floor = Math.max(floor, 30);
    if (getSelectedStaticEncounter()?.isEgg) floor = Math.max(floor, IS_EGG_OVERRIDE_LEVEL);
  }

  const speciesId = Number($('#species')?.value || 0);
  const sourceSpeciesId = getCurrentOriginSourceSpeciesId(speciesId);
  if (speciesId && sourceSpeciesId && sourceSpeciesId !== speciesId) {
    const selectedStatic = currentEncounterMode === 'static' ? getSelectedStaticEncounter() : null;
    const selectedMystery = currentEncounterMode === 'mystery'
      ? getSelectedMysteryEvent().event
      : null;
    const sourceLevel = selectedMystery
      ? getMysteryGiftSourceLevel(selectedMystery, metLevel)
      : selectedStatic?.isEgg
        ? IS_EGG_OVERRIDE_LEVEL
        : Math.max(1, metLevel);
    floor = Math.max(
      floor,
      getMinimumLevelForEncounterEvolution(speciesId, sourceSpeciesId, sourceLevel)
    );
  }

  try {
    if (shouldApplyIsEggOverrides()) floor = Math.max(floor, IS_EGG_OVERRIDE_LEVEL);
  } catch (e) {}

  return Math.max(1, Math.min(100, floor));
}

function syncCurrentLevelMinimumAttribute() {
  const levelEl = $('#level');
  if (!levelEl) return 1;
  const floor = getCurrentLevelFloor();
  levelEl.min = String(floor);
  return floor;
}

function clampCurrentLevelToMinimum() {
  const levelEl = $('#level');
  if (!levelEl) return false;

  const floor = syncCurrentLevelMinimumAttribute();
  const raw = String(levelEl.value ?? '').trim();
  let next = raw === '' ? floor : Number(raw);
  if (!Number.isFinite(next)) next = floor;
  next = Math.max(1, Math.min(100, Math.floor(next)));

  try {
    if (shouldApplyIsEggOverrides()) {
      next = IS_EGG_OVERRIDE_LEVEL;
    } else if (next < floor) {
      next = floor;
    }
  } catch (e) {
    if (next < floor) next = floor;
  }

  if (String(levelEl.value) === String(next)) return false;
  levelEl.value = String(next);
  return true;
}

function getSelectedStaticCategory() {
  return String(document.getElementById('staticCategory')?.value || '');
}

function getSelectedStaticEncounter() {
  if (currentEncounterMode !== 'static') return null;
  const speciesId = Number($('#species')?.value || 0);
  if (!speciesId) return null;
  const exactSelect = document.getElementById('staticEncounter');
  if (exactSelect && !exactSelect.value) return null;
  const availableEncounters = getStaticEncountersForSpecies(speciesId);
  if (availableEncounters.includes(selectedStaticEncounterDetail?.encounter)) {
    return selectedStaticEncounterDetail.encounter;
  }
  const currentGame = Number($('#originGame')?.value || 0);
  return availableEncounters.find(encounter =>
    Array.isArray(encounter.games) && encounter.games.map(Number).includes(currentGame)
  ) || availableEncounters[0] || null;
}

function getStaticAllowedOriginGames(speciesId) {
  const id = Number(speciesId) || 0;
  if (!id) return [];

  if (
    getStaticEncountersForSpecies(id).includes(selectedStaticEncounterDetail?.encounter) &&
    Number(selectedStaticEncounterDetail?.gameId)
  ) {
    return [Number(selectedStaticEncounterDetail.gameId)];
  }
  const selected = getSelectedStaticEncounter();
  const encounters = selected ? [selected] : getStaticEncountersForSpecies(id);
  const games = [...new Set(encounters.flatMap(encounter =>
    Array.isArray(encounter.games) ? encounter.games.map(Number) : []
  ))];
  if (games.length) return games;

  const sourceSpeciesId = Number(selected?.species || id);
  const fallbackGame = Number(STATIC_ENCOUNTERS[sourceSpeciesId]?.defaultOriginGame || 0);
  return fallbackGame ? [fallbackGame] : [];
}

function updateStaticOriginGameLocking(speciesId, options = {}) {
  if (currentEncounterMode !== 'static') return Number($('#originGame')?.value || 0);

  const originGameSelect = $('#originGame');
  if (!originGameSelect) return 0;
  const finish = (gameId) => {
    try { syncPidParityPreferenceUi(); } catch (e) {}
    return gameId;
  };
  const preferDefaultGame = options.preferDefaultGame === true;

  if (manualOverrideActive) {
    resetOriginGameOptions();
    return finish(Number(originGameSelect.value) || 0);
  }

  const allowedGames = getStaticAllowedOriginGames(speciesId);
  if (!allowedGames.length) {
    resetOriginGameOptions();
    return finish(Number(originGameSelect.value) || 0);
  }

  for (const opt of Array.from(originGameSelect.options || [])) {
    const gameId = Number(opt.value);
    const allowed = allowedGames.includes(gameId);
    opt.disabled = !allowed;
    opt.hidden = false;
    opt.style.color = allowed ? '' : '#666';
  }

  let currentGame = Number(originGameSelect.value) || 0;
  if (preferDefaultGame || !allowedGames.includes(currentGame)) {
    const preferredOrder = [3, 4, 5, 2, 1];
    currentGame = preferredOrder.find(gameId => allowedGames.includes(gameId)) || allowedGames[0];
    originGameSelect.value = String(currentGame);
  }

  return finish(currentGame);
}

function shouldLockStaticEncounterOriginFields() {
  if (currentEncounterMode !== 'static') return false;
  const speciesId = Number($('#species')?.value || 0);
  const allowedGames = getStaticAllowedOriginGames(speciesId);
  if (allowedGames.length) return allowedGames.length <= 1;

  const category = getSelectedStaticCategory();
  if (STATIC_LOCKED_ORIGIN_CATEGORIES.has(category)) return true;

  const encounter = getSelectedStaticEncounter();
  return Boolean(encounter && STATIC_LOCKED_ORIGIN_CATEGORIES.has(encounter.category));
}

function shouldLockStaticEncounterMetFields() {
  if (currentEncounterMode !== 'static') return false;
  const category = getSelectedStaticCategory();
  if (STATIC_LOCKED_MET_FIELD_CATEGORIES.has(category)) return true;

  const encounter = getSelectedStaticEncounter();
  return Boolean(encounter && STATIC_LOCKED_MET_FIELD_CATEGORIES.has(encounter.category));
}

function shouldLockStaticEncounterBall() {
  if (currentEncounterMode !== 'static') return false;
  const category = getSelectedStaticCategory();
  if (STATIC_LOCKED_BALL_CATEGORIES.has(category)) return true;

  const encounter = getSelectedStaticEncounter();
  return Boolean(encounter && STATIC_LOCKED_BALL_CATEGORIES.has(encounter.category));
}

function getSelectedMysteryEvent() {
  const rawTag = String(document.getElementById('mysteryEvent')?.value || '').toUpperCase();
  let tag = rawTag;
  if (tag === 'BERRY_FIX_ZIGZAGOON') tag = 'BERRY_PROGRAM_UPDATE_ZIGZAGOON';
  return {
    tag,
    event: MYSTERY_EVENTS[tag] || null,
  };
}

function shouldUnlockCelebiShinyLock(tag, evt) {
  if (!manualOverrideActive || currentEncounterMode !== 'mystery' || !evt?.shinyLocked) return false;
  const speciesId = Number($('#species')?.value) || 0;
  if (speciesId === CELEBI_SPECIES_ID) return true;

  const eventSpecies = Array.isArray(evt.species) ? evt.species.map(n => Number(n)) : [];
  return eventSpecies.length === 1 && eventSpecies[0] === CELEBI_SPECIES_ID;
}

function isBerryFixMysteryTag(tag) {
  const t = String(tag || '').toUpperCase();
  return t === 'BERRY_PROGRAM_UPDATE_ZIGZAGOON' ||
    t === 'BERRY_PROGRAM_UPDATE_ZIGZAGOON_RUBY' ||
    t === 'BERRY_FIX_ZIGZAGOON';
}

function isBerryFixMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isBerryFixMysteryTag(getSelectedMysteryEvent().tag);
}

function isMystryMewMysteryTag(tag) {
  return String(tag || '').toUpperCase() === 'MYSTRY_MEW';
}

function isMystryMewMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isMystryMewMysteryTag(getSelectedMysteryEvent().tag);
}

function isChannelJirachiMysteryTag(tag) {
  return String(tag || '').toUpperCase() === 'CHANNEL_JIRACHI';
}

function isChannelJirachiMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isChannelJirachiMysteryTag(getSelectedMysteryEvent().tag);
}

function requiresMysteryGiftPidFinderSelection() {
  if (currentEncounterMode !== 'mystery') return false;
  const { tag, event } = getSelectedMysteryEvent();
  if (!tag || tag === 'WISHMKR_SHINY') return false;
  // A preserved fixed specimen already supplies its authoritative PID and
  // IVs. Running a PID search would replace the exact event identity.
  if (event?.fixedPID !== undefined && event?.fixedIVs) return false;
  return true;
}

function getCurrentRibbonLegality() {
  const mysteryEvent = currentEncounterMode === 'mystery'
    ? getSelectedMysteryEvent().event
    : null;
  const encounter = currentEncounterMode === 'cxd_shadow'
    ? getSelectedCXDEncounter()
    : currentEncounterMode === 'cxd_trade'
      ? getSelectedCXDTrade()
      : null;

  return getGen3RibbonLegality({
    encounterMode: currentEncounterMode,
    speciesId: Number($('#species')?.value || 0),
    metLevel: Number($('#metLevel')?.value || 0),
    isEgg: Boolean($('#isEgg')?.checked),
    encounter,
    event: mysteryEvent,
  });
}

function readCurrentRibbonSelection() {
  return Object.fromEntries(GEN3_RIBBON_CONTROLS.map(control => {
    const element = document.getElementById(control.id);
    const value = control.kind === 'rank'
      ? Number(element?.value || 0)
      : Boolean(element?.checked);
    return [control.key, value];
  }));
}

function hasRequiredMysteryGiftPidFinderSelection() {
  if (manualOverrideActive) return true;
  if (!requiresMysteryGiftPidFinderSelection()) return true;
  return !!pidFinderHadSelection && pidFinderMysteryTag === getSelectedMysteryEvent().tag;
}

function getBerryFixOtPreference() {
  const raw = String(document.getElementById('berryFixOtPreference')?.value || 'SAPHIRE').toUpperCase();
  if (raw === 'RUBY') return 'RUBY';
  if (raw === 'ANY') return 'ANY';
  return 'SAPHIRE';
}

const PCNY_WISH_EGGS_TAG = 'PCNY_WISH_EGGS';
const PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES = [4, 5];
const PCNY_WISH_EGGS_DEFAULT_MET_LOCATION_ID = 88; // Pallet Town
const PCNY_FRLG_HATCH_LOCATION_MIN = 88;
const PCNY_FRLG_HATCH_LOCATION_MAX = 196;
const MYSTRY_MEW_ORIGIN_GAME_ID = 2;
const WISHMKR_ORIGIN_GAME_ID = 2;
const BOX_EVENT_TAG = 'BOX_EVENT';
const BOX_EVENT_ALLOWED_ORIGIN_GAMES = [1, 2, 3, 4, 5];
const BOX_EVENT_DEFAULT_MET_LOCATION_ID = 32; // Route 117
const BOX_EVENT_FRLG_EGG_MET_LOCATION_ID = 146; // Four Island
const BOX_EVENT_FATEFUL_MET_LOCATION_ID = 255;
const IS_EGG_OVERRIDE_LANGUAGE_ID = 1; // Japanese
const IS_EGG_OVERRIDE_LEVEL = 5;

function isPcnyWishEggsMysteryTag(tag) {
  return String(tag || '').toUpperCase() === PCNY_WISH_EGGS_TAG;
}

function isPcnyWishEggsMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isPcnyWishEggsMysteryTag(getSelectedMysteryEvent().tag);
}

function isBoxEventMysteryTag(tag) {
  return String(tag || '').toUpperCase() === BOX_EVENT_TAG;
}

function isBoxEventMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isBoxEventMysteryTag(getSelectedMysteryEvent().tag);
}

function getFatefulLocationIdForGame(originGame) {
  const gameId = Number(originGame) || 0;
  const gameLocations = getLocationsForGame(gameId);
  const found = gameLocations.find(([id, name]) => {
    if (Number(id) === BOX_EVENT_FATEFUL_MET_LOCATION_ID) return true;
    return String(name || '').toLowerCase().includes('fateful');
  }) || LOCATIONS.find(([id, name]) => {
    if (Number(id) === BOX_EVENT_FATEFUL_MET_LOCATION_ID) return true;
    return String(name || '').toLowerCase().includes('fateful');
  });
  return found ? Number(found[0]) : BOX_EVENT_FATEFUL_MET_LOCATION_ID;
}

function getBoxEventDefaultMetLocationIdForGame(originGame) {
  const gameId = Number(originGame) || 0;
  if (gameId === 1 || gameId === 2 || gameId === 3) {
    return BOX_EVENT_DEFAULT_MET_LOCATION_ID;
  }
  if (gameId === 4 || gameId === 5) {
    return BOX_EVENT_FRLG_EGG_MET_LOCATION_ID;
  }
  return null;
}

function getIsEggOverrideMetLocationId(originGame) {
  if (isBoxEventMysteryEventSelected()) {
    return getFatefulLocationIdForGame(originGame);
  }
  const gameId = Number(originGame) || 0;
  if (gameId === 1 || gameId === 2 || gameId === 3) {
    return BOX_EVENT_DEFAULT_MET_LOCATION_ID;
  }
  if (gameId === 4 || gameId === 5) {
    return BOX_EVENT_FRLG_EGG_MET_LOCATION_ID;
  }
  return null;
}

function shouldApplyIsEggOverrides() {
  const isEggChecked = Boolean($('#isEgg')?.checked);
  if (!isEggChecked) return false;
  if (!canSelectedSpeciesBeUnhatchedEgg()) return false;
  if (currentEncounterMode === 'hatched') return true;
  if (isBoxEventMysteryEventSelected()) return true;
  return false;
}

function canSpeciesBeUnhatchedEgg(speciesId) {
  const id = Number(speciesId) || 0;
  return id > 0 && (PRE_EVOLUTIONS[id] == null || EVOLVED_UNHATCHED_EGG_EXCEPTIONS.has(id));
}

function getHatchedLevelFloor(speciesId) {
  return getMinimumHatchedLevel(speciesId, {
    directHatchSpeciesIds: EVOLVED_UNHATCHED_EGG_EXCEPTIONS,
  });
}

function canSelectedSpeciesBeUnhatchedEgg() {
  return canSpeciesBeUnhatchedEgg(Number($('#species')?.value || 0));
}

function applyIsEggOverrides(options = {}) {
  if (!shouldApplyIsEggOverrides()) return false;

  const syncUi = options.syncUi !== false;
  const updateLegality = options.updateLegality === true;
  const originGameId = Number($('#originGame')?.value) || 0;
  const forcedMetLocationId = getIsEggOverrideMetLocationId(originGameId);

  if (!syncUi) return true;

  try { updateItemLockingForEgg(); } catch (e) {}

  const languageEl = $('#language');
  if (languageEl && String(languageEl.value) !== String(IS_EGG_OVERRIDE_LANGUAGE_ID)) {
    languageEl.value = String(IS_EGG_OVERRIDE_LANGUAGE_ID);
    try { languageEl.dispatchEvent(new Event('change')); } catch (e) {}
  }

  const levelEl = $('#level');
  if (levelEl && Number(levelEl.value) !== IS_EGG_OVERRIDE_LEVEL) {
    levelEl.value = String(IS_EGG_OVERRIDE_LEVEL);
  }
  try { computeAndSetExpFromLevel(); } catch (e) {}

  const metLocationEl = $('#metLocation');
  if (metLocationEl && forcedMetLocationId !== null) {
    try {
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(originGameId));
      }
    } catch (e) {}
    metLocationEl.value = String(forcedMetLocationId);
  }

  if (isBoxEventMysteryEventSelected()) {
    const otNameEl = $('#otName');
    if (otNameEl) {
      otNameEl.value = 'AZUZA';
    }
  }

  try { enforceJapaneseOption(); } catch (e) {}
  if (updateLegality) {
    try { updateLegalityStatus(); } catch (e) {}
  }
  return true;
}

function updateItemLockingForEgg() {
  const itemEl = $('#item');
  if (!itemEl) return;

  const trade = currentEncounterMode === 'cxd_trade' ? getSelectedCXDTrade() : null;
  const shouldLockForEgg = shouldApplyIsEggOverrides();
  const shouldLockForTrade = Boolean(trade && !manualOverrideActive);
  const shouldLock = shouldLockForEgg || shouldLockForTrade;
  const inputEl = typeof itemEl.querySelector === 'function'
    ? itemEl.querySelector('input')
    : null;

  if (shouldLock) {
    const fixedValue = shouldLockForTrade ? String(Number(trade.heldItem) || '') : '';
    if (String(itemEl.value || '') !== fixedValue) {
      itemEl.value = fixedValue;
      try { itemEl.dispatchEvent(new Event('change')); } catch (e) {}
    }
    itemEl.disabled = true;
    itemEl.style.pointerEvents = 'none';
    itemEl.style.opacity = '0.6';
    itemEl.style.cursor = 'not-allowed';
    itemEl.dataset.itemLockedByPreset = '1';
    if (inputEl) {
      inputEl.disabled = true;
      inputEl.style.pointerEvents = 'none';
      inputEl.style.cursor = 'not-allowed';
    }
    return;
  }

  if (itemEl.dataset.itemLockedByPreset === '1') {
    itemEl.disabled = false;
    itemEl.style.pointerEvents = '';
    itemEl.style.opacity = '';
    itemEl.style.cursor = '';
    delete itemEl.dataset.itemLockedByPreset;
    if (inputEl) {
      inputEl.disabled = false;
      inputEl.style.pointerEvents = '';
      inputEl.style.cursor = '';
    }
  }
}

function getPcnyWishEggsHatchLocationsForGame(originGame) {
  const gameId = Number(originGame);
  if (!PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES.includes(gameId)) return [];

  return getLocationsForGame(gameId).filter(([id, name]) => {
    const locId = Number(id);
    if (!Number.isFinite(locId)) return false;
    if (locId < PCNY_FRLG_HATCH_LOCATION_MIN || locId > PCNY_FRLG_HATCH_LOCATION_MAX) return false;
    if (locId === 255) return false;
    if (String(name || '').toLowerCase().includes('fateful')) return false;
    return true;
  });
}

function applyMysteryEventOriginConstraints(event, { hatcherLocations = false } = {}) {
  if (currentEncounterMode !== 'mystery' || !event) return false;
  const allowed = Array.isArray(event.allowedOriginGames)
    ? event.allowedOriginGames.map(Number).filter(Number.isFinite)
    : [];
  if (!allowed.length) return false;

  const originGameSelect = $('#originGame');
  if (!originGameSelect) return true;
  for (const option of Array.from(originGameSelect.options || [])) {
    const enabled = allowed.includes(Number(option.value));
    option.disabled = !enabled;
    option.hidden = !enabled;
  }

  let gameId = Number(originGameSelect.value);
  if (!allowed.includes(gameId)) {
    gameId = allowed.includes(Number(event.defaultOriginGame))
      ? Number(event.defaultOriginGame)
      : allowed[0];
    originGameSelect.value = String(gameId);
  }

  if (!hatcherLocations) return true;
  // Recipient trainer data and hatch location are editable, but an egg event
  // with one permitted origin game (such as the Ruby-only PCJP 5th Anniversary
  // eggs) still has a genuinely fixed Origin Game field.
  setControlLockState(originGameSelect, !manualOverrideActive && allowed.length === 1);
  const locations = getLocationsForGame(gameId).filter(([, name]) =>
    !String(name || '').toLowerCase().includes('fateful')
  );
  if (metLocationWrapper?.updateList) metLocationWrapper.updateList(locations);
  const metLocationEl = $('#metLocation');
  if (!metLocationEl) return true;
  const validIds = new Set(locations.map(([id]) => Number(id)));
  if (!validIds.has(Number(metLocationEl.value))) {
    const preferred = Number(event.defaultMetLocationId);
    metLocationEl.value = String(validIds.has(preferred) ? preferred : Number(locations[0]?.[0] || 0));
  }
  setControlLockState(metLocationEl, false);
  return true;
}

function applyPcnyWishEggsOriginAndLocationConstraints() {
  if (!isPcnyWishEggsMysteryEventSelected()) return false;

  const originGameSelect = $('#originGame');
  if (!originGameSelect) return true;

  for (const opt of Array.from(originGameSelect.options || [])) {
    const gid = Number(opt.value);
    const allow = PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES.includes(gid);
    opt.disabled = !allow;
    opt.hidden = !allow;
  }
  originGameSelect.disabled = false;
  originGameSelect.style.pointerEvents = '';
  originGameSelect.style.opacity = '';
  originGameSelect.style.cursor = '';

  let gameId = Number(originGameSelect.value);
  if (!PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES.includes(gameId)) {
    gameId = PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES[0];
    originGameSelect.value = String(gameId);
  }

  const filteredLocations = getPcnyWishEggsHatchLocationsForGame(gameId);
  if (metLocationWrapper && metLocationWrapper.updateList) {
    metLocationWrapper.updateList(filteredLocations);
  }

  const metLocationEl = $('#metLocation');
  if (metLocationEl) {
    const validIds = new Set(filteredLocations.map(([id]) => Number(id)));
    const currentLocId = Number(metLocationEl.value);
    if (!validIds.has(currentLocId)) {
      const defaultLocationId = validIds.has(PCNY_WISH_EGGS_DEFAULT_MET_LOCATION_ID)
        ? PCNY_WISH_EGGS_DEFAULT_MET_LOCATION_ID
        : (filteredLocations.length ? Number(filteredLocations[0][0]) : PCNY_FRLG_HATCH_LOCATION_MIN);
      metLocationEl.value = String(defaultLocationId);
    }
    metLocationEl.disabled = false;
    metLocationEl.style.pointerEvents = '';
    metLocationEl.style.opacity = '';
    metLocationEl.style.cursor = '';
  }

  return true;
}

function applyMystryMewOriginGameConstraints() {
  if (!isMystryMewMysteryEventSelected()) return false;

  const originGameSelect = $('#originGame');
  if (!originGameSelect) return true;

  for (const opt of Array.from(originGameSelect.options || [])) {
    const gid = Number(opt.value);
    const allow = gid === MYSTRY_MEW_ORIGIN_GAME_ID;
    opt.disabled = !allow;
    opt.hidden = !allow;
  }

  if (Number(originGameSelect.value) !== MYSTRY_MEW_ORIGIN_GAME_ID) {
    originGameSelect.value = String(MYSTRY_MEW_ORIGIN_GAME_ID);
  }

  try {
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(getLocationsForGame(MYSTRY_MEW_ORIGIN_GAME_ID));
    }
  } catch (e) {}

  return true;
}

function isWishmkrMysteryTag(tag) {
  const t = String(tag || '').toUpperCase();
  return t === 'WISHMKR_BEST' || t === 'WISHMKR_SHINY';
}

function isWishmkrMysteryEventSelected() {
  if (currentEncounterMode !== 'mystery') return false;
  return isWishmkrMysteryTag(getSelectedMysteryEvent().tag);
}

function applyWishmkrHeldItemFromSeed(originSeed) {
  const itemId = getWishmkrHeldItemId(originSeed);
  const itemEl = $('#item');
  if (itemId === null || !itemEl) return false;

  itemEl.value = String(itemId);
  try { itemEl.dispatchEvent(new Event('change')); } catch (e) {}
  return true;
}

function applyWishmkrOriginGameConstraints() {
  if (!isWishmkrMysteryEventSelected()) return false;

  const originGameSelect = $('#originGame');
  if (!originGameSelect) return true;

  if (Number(originGameSelect.value) !== WISHMKR_ORIGIN_GAME_ID) {
    originGameSelect.value = String(WISHMKR_ORIGIN_GAME_ID);
  }

  const shouldLock = !manualOverrideActive;
  originGameSelect.disabled = shouldLock;
  originGameSelect.style.pointerEvents = shouldLock ? 'none' : '';
  originGameSelect.style.opacity = shouldLock ? '0.6' : '';
  originGameSelect.style.cursor = shouldLock ? 'not-allowed' : '';

  try {
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(getLocationsForGame(WISHMKR_ORIGIN_GAME_ID));
    }
  } catch (e) {}

  return true;
}

function applyBoxEventMysteryLocationConstraints(options = {}) {
  if (!isBoxEventMysteryEventSelected()) return false;

  const preserveCurrentNonEgg = options.preserveCurrentNonEgg !== undefined
    ? Boolean(options.preserveCurrentNonEgg)
    : true;

  const evt = MYSTERY_EVENTS[BOX_EVENT_TAG] || null;
  const originGameSelect = $('#originGame');
  const isEgg = Boolean($('#isEgg')?.checked);
  const allowedOriginGames = new Set(BOX_EVENT_ALLOWED_ORIGIN_GAMES);

  if (originGameSelect) {
    for (const opt of Array.from(originGameSelect.options || [])) {
      const gid = Number(opt.value);
      const allow = allowedOriginGames.has(gid);
      opt.disabled = !allow;
      opt.hidden = !allow;
    }
  }

  let originGameId = Number(originGameSelect?.value) || Number(evt?.defaultOriginGame) || 2;

  if (!allowedOriginGames.has(originGameId)) {
    const preferredGames = [Number(evt?.defaultOriginGame) || 0, 2, 3, 1, 4, 5];
    const fallbackGameId = preferredGames.find((gameId) => allowedOriginGames.has(Number(gameId)))
      || BOX_EVENT_ALLOWED_ORIGIN_GAMES[0];
    originGameId = Number(fallbackGameId);
    if (originGameSelect) {
      originGameSelect.value = String(originGameId);
    }
  }

  if (!manualOverrideActive && !isEgg) {
    const supportsRoute117 = getLocationsForGame(originGameId)
      .some(([id]) => Number(id) === BOX_EVENT_DEFAULT_MET_LOCATION_ID);
    if (!supportsRoute117) {
      const preferredGames = [Number(evt?.defaultOriginGame) || 0, 2, 3, 1];
      const fallbackGameId = preferredGames.find((gameId) => {
        if (!gameId) return false;
        return getLocationsForGame(gameId)
          .some(([id]) => Number(id) === BOX_EVENT_DEFAULT_MET_LOCATION_ID);
      });
      if (fallbackGameId) {
        originGameId = Number(fallbackGameId);
        if (originGameSelect) {
          originGameSelect.value = String(originGameId);
        }
      }
    }
  }

  const metLocationEl = $('#metLocation');
  if (!metLocationEl) return true;

  const locations = getLocationsForGame(originGameId);
  if (metLocationWrapper && metLocationWrapper.updateList) {
    metLocationWrapper.updateList(locations);
  }

  if (manualOverrideActive) return true;

  if (isEgg) {
    const fatefulLocationId = getFatefulLocationIdForGame(originGameId);
    metLocationEl.value = String(fatefulLocationId);
    return true;
  }

  const defaultMetLocationId = getBoxEventDefaultMetLocationIdForGame(originGameId);
  if (defaultMetLocationId !== null) {
    metLocationEl.value = String(defaultMetLocationId);
    return true;
  }

  const fallback = locations.find(([id]) => !HATCHED_DISABLED_MET_LOCATION_IDS.has(Number(id))) || locations[0];
  if (fallback) {
    metLocationEl.value = String(fallback[0]);
  }
  return true;
}

function updateBerryFixOtPreferenceUi() {
  const row = document.getElementById('berryFixOtFilterRow');
  const pref = document.getElementById('berryFixOtPreference');
  if (!row || !pref) return;

  const show = isBerryFixMysteryEventSelected();
  row.style.display = show ? '' : 'none';

  if (!show) {
    pref.disabled = false;
    pref.value = 'SAPHIRE';
    const pidFinderBtn = document.getElementById('pidFinderBtn');
    if (pidFinderBtn) pidFinderBtn.classList.remove('field-error');
    return;
  }

  const fixedPreference = String(getSelectedMysteryEvent().event?.berryFixOtPreference || '').toUpperCase();
  pref.value = fixedPreference === 'RUBY' ? 'RUBY' : 'SAPHIRE';
  pref.disabled = Boolean(fixedPreference) || !!pidFinderResultActive;
}

function getMysteryPidMethod() {
  if (currentEncounterMode !== 'mystery') return '';

  const { tag, event } = getSelectedMysteryEvent();
  const explicit = String(event?.pidMethod || '').trim();
  if (explicit) return explicit.toUpperCase();

  if (tag === 'CHANNEL_JIRACHI') return 'CHANNEL';
  if (tag === 'AGETO_CELEBI') return 'CXD';
  if (tag === 'MITSURIN_CELEBI') return 'BACD_R_A';
  if (isBerryFixMysteryTag(tag)) return 'BACD_RBCD';
  if (tag === 'MYSTRY_MEW') return 'BACD_M';
  if (tag === BOX_EVENT_TAG) return 'BACD_U';
  if (tag === PCNY_WISH_EGGS_TAG) return 'METHOD_2';

  if (tag === 'WISHMKR_BEST' || tag === 'WISHMKR_SHINY') return 'BACD_R';

  if (
    tag === '10ANNI' ||
    tag === 'AURA_MEW' ||
    tag === 'DOEL_DEOXYS' ||
    tag === 'SPACE_CENTER_DEOXYS' ||
    tag === 'JOURNEY_ACROSS_AMERICA' ||
    tag === 'PARTY_OF_THE_DECADE' ||
    tag === 'POKEMON_ROCKS_METANG'
  ) {
    return 'BACD_R_A';
  }

  return '';
}

function isMysteryBACDMethod(method) {
  return (
    method === 'BACD' ||
    method === 'BACD_U' ||
    method === 'BACD_U_AX' ||
    method === 'BACD_R' ||
    method === 'BACD_R_A' ||
    method === 'BACD_A' ||
    method === 'BACD_RBCD' ||
    method === 'BACD_TA' ||
    method === 'BACD_TS' ||
    method === 'BACD_M'
  );
}

function isMysteryMethod2(method) {
  const normalized = String(method || '').toUpperCase().replace(/\s+/g, '_');
  return normalized === 'METHOD_2' || normalized === 'METHOD2' || normalized === 'H2';
}

function normalizeOtGenderValue(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'female' || normalized === 'f' || normalized === '1') return 'female';
  if (normalized === 'male' || normalized === 'm' || normalized === '0') return 'male';
  return '';
}

function parseSeedLike(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value >>> 0;
  }

  const str = String(value).trim();
  if (!str) return null;
  const parsed = str.toLowerCase().startsWith('0x')
    ? Number.parseInt(str.slice(2), 16)
    : Number(str);
  if (!Number.isFinite(parsed)) return null;
  return parsed >>> 0;
}

function resolveMysteryBacdOtGender(result) {
  if (currentEncounterMode !== 'mystery') return '';
  if (!isMysteryBACDMethod(String(result?.method || '').toUpperCase())) return '';

  const { tag, event } = getSelectedMysteryEvent();

  // Event-level fixed OT gender always takes precedence when present.
  const fixedEventGender = normalizeOtGenderValue(event?.ot_gender);
  if (fixedEventGender) return fixedEventGender;

  // Some event methods derive OT gender directly from the seed and include it
  // in finder results. Prefer that value when present.
  const seededGender = normalizeOtGenderValue(result?.otGender);
  if (seededGender) return seededGender;

  const originSpeciesId = getCurrentOriginSourceSpeciesId();
  const entries = (Array.isArray(MYSTERY_GIFTS[tag]) ? MYSTERY_GIFTS[tag] : [])
    .filter(entry => entry?.species === undefined || Number(entry.species) === originSpeciesId);
  const resultPid = parseSeedLike(result?.pid);
  const resultSeed = parseSeedLike(result?.originSeed ?? result?.seed);

  // Prefer exact match against known event rows when available.
  const matched = entries.find((entry) => {
    const entryPid = parseSeedLike(entry?.pid);
    if (entryPid !== null && resultPid !== null && entryPid === resultPid) return true;
    const entrySeed = parseSeedLike(entry?.seed);
    if (entrySeed !== null && resultSeed !== null && entrySeed === resultSeed) return true;
    return false;
  });
  const matchedGender = normalizeOtGenderValue(matched?.ot_gender);
  if (matchedGender) return matchedGender;

  // If all known rows for a tag agree on one OT gender, keep it fixed.
  const uniqueGenders = [...new Set(entries
    .map(entry => normalizeOtGenderValue(entry?.ot_gender))
    .filter(Boolean))];
  if (uniqueGenders.length === 1) return uniqueGenders[0];

  // BACD_R_A / BACD_A OT gender correlation uses the RandS7 derivation.
  const method = String(result?.method || '').toUpperCase();
  if (tag === 'POKEMON_ROCKS_METANG') return 'male';

  return getSeedDerivedMysteryOtGender(tag, method, resultSeed);
}

function updatePidFinderVisibility() {
  const row = document.getElementById('pidFinderRow');
  if (!row) return;

  const pidFinderBtn = document.getElementById('pidFinderBtn');

  const shouldShow = isPidFinderAvailableForCurrentEncounter();

  row.classList.toggle('pid-finder-visible', shouldShow);
  row.style.display = shouldShow ? '' : 'none';

  if (pidFinderBtn) {
    const mysteryTag = String(document.getElementById('mysteryEvent')?.value || '').toUpperCase();
    const disableForWishmkrShiny = currentEncounterMode === 'mystery' && mysteryTag === 'WISHMKR_SHINY';
    const selectedCXD = currentEncounterMode === 'cxd_shadow' ? getSelectedCXDEncounter() : null;
    pidFinderBtn.disabled = disableForWishmkrShiny;
    pidFinderBtn.style.pointerEvents = disableForWishmkrShiny ? 'none' : '';
    pidFinderBtn.style.opacity = disableForWishmkrShiny ? '0.6' : '';
    pidFinderBtn.style.cursor = disableForWishmkrShiny ? 'not-allowed' : '';
    pidFinderBtn.title = disableForWishmkrShiny
      ? 'Find Legal Encounter is unavailable for WISHMKR JIRACHI - ALL SHINY VERSIONS.'
      : selectedCXD?.eReader
        ? 'Find an XDRNG/team-lock-valid e-Reader PID. All six IVs remain fixed at 0.'
        : '';

    if (disableForWishmkrShiny) {
      pidFinderBtn.classList.remove('field-error');
    }
  }

  try { updateBerryFixOtPreferenceUi(); } catch (e) {}
}

function isPidFinderAvailableForCurrentEncounter() {
  const mysteryMethod = getMysteryPidMethod();
  return (
    currentEncounterMode === 'hatched' ||
    currentEncounterMode === 'wild' ||
    currentEncounterMode === 'static' ||
    currentEncounterMode === 'roamer' ||
    currentEncounterMode === 'cxd_shadow' ||
    (currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade())) ||
    isMysteryMethod2(mysteryMethod) ||
    mysteryMethod === 'CHANNEL' ||
    mysteryMethod === 'CXD' ||
    isMysteryBACDMethod(mysteryMethod)
  );
}

// Gender thresholds are now imported from ./data/genderThresholds.gen3.js
// (keyed by internal species ID, derived from species names)

const HIDDEN_POWER_TYPES = [
  'Fighting', 'Flying', 'Poison', 'Ground',
  'Rock', 'Bug', 'Ghost', 'Steel',
  'Fire', 'Water', 'Grass', 'Electric',
  'Psychic', 'Ice', 'Dragon', 'Dark'
];

// Calculate Hidden Power type and power from IVs
function calculateHiddenPower(ivs) {
  // Type is determined by the lowest bit of each IV (odd=1, even=0)
  // Order: HP, ATK, DEF, SPE, SPA, SPD
  const a = ivs.hp & 1;
  const b = ivs.atk & 1;
  const c = ivs.def & 1;
  const d = ivs.spe & 1;
  const e = ivs.spa & 1;
  const f = ivs.spd & 1;
  
  const typeIndex = Math.floor(((a + 2*b + 4*c + 8*d + 16*e + 32*f) * 15) / 63);
  const type = HIDDEN_POWER_TYPES[typeIndex];
  
  // Power is determined by the second-lowest bit of each IV (bit 1)
  // Order: HP, ATK, DEF, SPE, SPA, SPD
  const u = (ivs.hp >> 1) & 1;
  const v = (ivs.atk >> 1) & 1;
  const w = (ivs.def >> 1) & 1;
  const x = (ivs.spe >> 1) & 1;
  const y = (ivs.spa >> 1) & 1;
  const z = (ivs.spd >> 1) & 1;
  
  const power = Math.floor(((u + 2*v + 4*w + 8*x + 16*y + 32*z) * 40) / 63) + 30;
  
  return { type, power };
}

function getHiddenPower70IVSpread(typeName) {
  const idx = HIDDEN_POWER_TYPES.indexOf(String(typeName || ''));
  if (idx < 0) return null;

  // For target type t: t <= (S*15/63) < t+1, where S is the weighted parity sum.
  // For 70 BP in Gen 3, each IV's second bit must be 1, so each stat is 30 or 31.
  const minS = Math.ceil((idx * 63) / 15);
  const maxS = Math.ceil(((idx + 1) * 63) / 15) - 1;

  let bestS = minS;
  let bestScore = -1;
  for (let s = minS; s <= maxS; s++) {
    let bitCount = 0;
    for (let b = 0; b < 6; b++) {
      if ((s >> b) & 1) bitCount++;
    }
    // Prefer more 31s (better total IVs), then larger parity sum for consistency.
    const score = bitCount * 100 + s;
    if (score > bestScore) {
      bestScore = score;
      bestS = s;
    }
  }

  const toIv = (weight) => ((bestS & weight) !== 0 ? 31 : 30);
  return {
    hp: toIv(1),
    atk: toIv(2),
    def: toIv(4),
    spe: toIv(8),
    spa: toIv(16),
    spd: toIv(32)
  };
}

function applyHiddenPowerType70(typeName) {
  if (currentEncounterMode !== 'hatched') return;
  const spread = getHiddenPower70IVSpread(typeName);
  if (!spread) return;

  const setIv = (sel, val) => {
    const el = $(sel);
    if (!el) return;
    el.value = String(val);
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  };

  setIv('#ivHp', spread.hp);
  setIv('#ivAtk', spread.atk);
  setIv('#ivDef', spread.def);
  setIv('#ivSpAtk', spread.spa);
  setIv('#ivSpDef', spread.spd);
  setIv('#ivSpe', spread.spe);
  try { updateHiddenPower(); } catch (e) {}
}

// Parse PID input accepting hex (with or without 0x) or decimal. Returns unsigned 32-bit number.
function parsePidInput(s){
  if(s === null || s === undefined) return 0;
  const v = String(s).trim();
  if(v === '') return 0;
  // 0x... hex
  if(/^0x[0-9a-fA-F]+$/.test(v)) return parseInt(v.slice(2),16) >>> 0;
  // plain hex (no prefix)
  if(/^[0-9a-fA-F]{1,8}$/.test(v)) return parseInt(v,16) >>> 0;
  // decimal fallback
  const n = Number(v);
  if(!Number.isNaN(n)) return n >>> 0;
  return 0;
}

// Turn any entry into [name, id], supporting both [name,id] and [id,name]
function toNameId(entry) {
  if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'id' in entry) {
    return [String(entry.name ?? ''), Number(entry.id)];
  }
  if (!Array.isArray(entry) || entry.length < 2) return [String(entry), 0];
  const [a, b] = entry;

  const isNumeric = v =>
    typeof v === 'number' ||
    (typeof v === 'string' && /^[0-9]+$/.test(v));

  // If first looks numeric and second looks like a name => assume [id,name]
  if (isNumeric(a) && !isNumeric(b)) {
    return [String(b), Number(a)];
  }
  // Otherwise assume [name,id]
  return [String(a), Number(b)];
}

function sortMoveListAlphabetically(list) {
  return [...list].sort((a, b) => {
    const [nameA, idA] = toNameId(a);
    const [nameB, idB] = toNameId(b);
    if (idA === 0 && idB !== 0) return -1;
    if (idB === 0 && idA !== 0) return 1;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' }) || idA - idB;
  });
}

function fillSelect(el, list, opts = {}) {
  el.innerHTML = '';
  const placeholder = opts.placeholder ?? '— Select —';
  if (placeholder !== null) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    el.appendChild(opt);
  }
  for (const row of list) {
    const [name, id] = toNameId(row);
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = name;
    el.appendChild(opt);
  }
}

// Ensure Mew in Legendary mode is at least level 30. Called after species/mode changes.
function enforceMewLegendMinLevel() {
  try {
    if (currentEncounterMode === 'imported') return;
    if (currentEncounterMode !== 'static') return;
    const sp = Number($('#species')?.value || 0);
    if (sp !== 151) return;
    const levelEl = $('#level');
    if (!levelEl) return;
    let val = Number(levelEl.value) || 0;
    if (val < 30) {
      levelEl.value = '30';
      try { computeAndSetExpFromLevel(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    }
  } catch (e) {}
}

// Create autocomplete input that replaces a select element
function createAutocomplete(selectEl, list, opts = {}) {
  const placeholder = opts.placeholder ?? '— Select —';
  const allowEmpty = opts.placeholder !== null;
  const onSelect = opts.onSelect || null;
  const blurOnSelect = opts.blurOnSelect === true;
  const isItemDisabled = typeof opts.isItemDisabled === 'function'
    ? opts.isItemDisabled
    : () => false;
  // Optional full list used to resolve display names for values not in the
  // current filtered list (e.g. mystery-gift preset moves outside the learnset).
  const masterList = opts.masterList || null;
  
  // Store the data - make it mutable so we can update it
  const toAutocompleteItem = row => {
    const [name, id] = toNameId(row);
    return {
      name,
      id: String(id),
      disabled: Boolean(row?.disabled),
      hint: typeof row?.hint === 'string' ? row.hint : '',
      group: typeof row?.group === 'string' ? row.group : '',
    };
  };
  const itemIsDisabled = item => Boolean(item?.disabled) || isItemDisabled(item);
  let items = list.map(toAutocompleteItem);
  let masterItems = masterList ? masterList.map(row => {
    const [name, id] = toNameId(row);
    return { name, id: String(id) };
  }) : null;
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  
  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'autocomplete-input';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  // Limit dropdown height to 5 items and make it scrollable
  dropdown.style.maxHeight = '160px'; // ~32px per item * 5
  dropdown.style.overflowY = 'auto';
  
  // Store current selection
  let selectedId = '';
  let selectedIndex = -1;
  
  // Expose value property on wrapper for compatibility
  Object.defineProperty(wrapper, 'value', {
    get() { return selectedId; },
    set(val) {
      selectedId = String(val);
      const item = items.find(i => i.id === selectedId);
      if (item) {
        input.value = item.name;
      } else if (masterItems) {
        // Fallback: resolve display name from the full master list
        // (e.g. mystery-gift moves not in the current learnset)
        const fallback = masterItems.find(i => i.id === selectedId);
        if (fallback) input.value = fallback.name;
      }
      if (!item && !masterItems?.find(i => i.id === selectedId)) {
        if (allowEmpty && val === '') {
          input.value = '';
          selectedId = '';
        }
      }
    },
    configurable: true
  });
  
  // Expose method to update the list
  // opts.preserveValue — keep current selection even if it's not in the new list
  wrapper.updateList = function(newList, opts = {}) {
    items = newList.map(toAutocompleteItem);
    // Clear current selection if it's not in the new list
    // (unless preserveValue is set — keeps e.g. mystery-gift moves visible)
    if (!opts.preserveValue) {
      const stillExists = items.some(i => i.id === selectedId);
      if (!stillExists) {
        selectedId = '';
        input.value = '';
      }
    }
  };

  // Select an item through the same callback/event path as a pointer or
  // keyboard selection. Used by alternate discovery UIs such as encounter
  // browsing so every existing species-change side effect remains intact.
  wrapper.selectById = function(value) {
    const item = items.find(candidate => candidate.id === String(value));
    if (!item || itemIsDisabled(item)) return false;
    selectItem(item);
    return true;
  };
  
  // Also expose addEventListener for compatibility
  wrapper.addEventListener = function(type, handler) {
    input.addEventListener(type, handler);
  };
  // Forward dispatchEvent to the internal input so callers that dispatch
  // events on the wrapper (compat shim) trigger the attached handlers.
  wrapper.dispatchEvent = function(evt) {
    try { return input.dispatchEvent(evt); } catch (e) { return false; }
  };
  
  function filterItems(query) {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => item.name.toLowerCase().includes(q));
  }
  
  function renderDropdown(filtered) {
    dropdown.innerHTML = '';
    selectedIndex = -1;
    
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'autocomplete-no-results';
      noResults.textContent = 'No matches found';
      dropdown.appendChild(noResults);
      return;
    }
    
    // Show all filtered items, but dropdown is scrollable and visually limited to 5
    let activeGroup = '';
    filtered.forEach((item, idx) => {
      if (item.group && item.group !== activeGroup) {
        const group = document.createElement('div');
        group.className = 'autocomplete-group-label';
        group.textContent = item.group;
        dropdown.appendChild(group);
        activeGroup = item.group;
      }
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      const disabled = itemIsDisabled(item);
      if (disabled) {
        div.classList.add('disabled');
        div.setAttribute('aria-disabled', 'true');
      }
      const name = document.createElement('span');
      name.className = 'autocomplete-item-name';
      name.textContent = item.name;
      div.appendChild(name);
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'autocomplete-item-hint';
        hint.textContent = item.hint;
        div.appendChild(hint);
      }
      div.dataset.id = item.id;
      div.dataset.index = idx;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (disabled) return;
        selectItem(item);
      });
      dropdown.appendChild(div);
    });
  }
  
  function selectItem(item) {
    if (itemIsDisabled(item)) return;
    selectedId = item.id;
    input.value = item.name;
    dropdown.classList.remove('show');
    
    // Trigger callback if provided
    if (onSelect) {
      onSelect(item);
    }
    
    // Trigger change event for compatibility
    const event = new Event('change', { bubbles: true });
    wrapper.dispatchEvent(event);

    if (blurOnSelect) {
      requestAnimationFrame(() => {
        try { input.blur(); } catch (e) {}
      });
    }
  }
  
  function showDropdown() {
    const filtered = filterItems(input.value);
    renderDropdown(filtered);
    dropdown.classList.add('show');
  }
  
  function hideDropdown() {
    dropdown.classList.remove('show');
  }
  
  // Event listeners
  input.addEventListener('input', (e) => {
    const query = e.target.value;
    const filtered = filterItems(query);
    renderDropdown(filtered);
    dropdown.classList.add('show');
    
    // Clear selected ID when typing (user is searching)
    selectedId = '';
  });
  
  input.addEventListener('focus', () => {
    // If a value is already selected, show ALL options so the user can
    // browse and pick a different one (instead of filtering by current text).
    if (selectedId) {
      renderDropdown(items);
      dropdown.classList.add('show');
      // Scroll the currently selected item into view
      const active = dropdown.querySelector(`.autocomplete-item[data-id="${selectedId}"]`);
      if (active) {
        active.classList.add('selected');
        active.scrollIntoView({ block: 'nearest' });
      }
    } else {
      showDropdown();
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      hideDropdown();
      
      // Auto-select if user typed an exact match
      if (input.value && !selectedId) {
        // Skip auto-resolve when Manual Override is active (import or PID
        // Finder result applied) to prevent any async preset application.
        if (suppressPresetApply) return;
        const exactMatch = items.find(item => 
          item.name.toLowerCase() === input.value.toLowerCase()
        );
        if (exactMatch && !itemIsDisabled(exactMatch)) {
          selectItem(exactMatch);
        } else {
          // Clear invalid input
          input.value = '';
          selectedId = '';
        }
      }
    }, 200);
  });
  
  input.addEventListener('keydown', (e) => {
    const allItems = Array.from(dropdown.querySelectorAll('.autocomplete-item'));
    const selectableItems = allItems.filter(el => !el.classList.contains('disabled'));
    if (allItems.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectableItems.length === 0) return;
      selectedIndex = Math.min(selectedIndex + 1, selectableItems.length - 1);
      updateSelectedItem(selectableItems, allItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectableItems.length === 0) return;
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelectedItem(selectableItems, allItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectableItems[selectedIndex]) {
        const id = selectableItems[selectedIndex].dataset.id;
        const filtered = filterItems(input.value);
        const item = filtered.find(i => i.id === id);
        if (item) selectItem(item);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });
  
  function updateSelectedItem(selectableItems, allItems) {
    allItems.forEach(el => {
      el.classList.remove('selected');
    });
    if (selectableItems[selectedIndex]) {
      selectableItems[selectedIndex].classList.add('selected');
      selectableItems[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // Replace select with autocomplete
  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);
  selectEl.parentNode.replaceChild(wrapper, selectEl);
  
  // Copy ID to wrapper for querySelector compatibility
  wrapper.id = selectEl.id;
  wrapper.querySelector('input').id = selectEl.id + '-input';
  
  return wrapper;
}


// Filter locations based on origin game
function isMetLocationAllowedForEncounterState(locationId, options = {}) {
  const locId = Number(locationId);
  if (locId !== EMERALD_ALTERING_CAVE_LOCATION_ID) return true;

  const encounterMode = options.encounterMode ?? currentEncounterMode;
  const speciesId = Number(
    options.speciesId ?? (typeof document !== 'undefined' ? ($('#species')?.value || 0) : 0)
  );
  const originGame = Number(options.originGame ?? 0);
  return originGame === 3 && (
    encounterMode === 'hatched' ||
    (encounterMode === 'wild' && speciesId === ZUBAT_SPECIES_ID)
  );
}

function filterLocationsForEncounterState(locations, options = {}) {
  return locations.filter(([id]) => isMetLocationAllowedForEncounterState(id, options));
}

function getLocationsForGame(originGame, options = {}) {
  const gameId = Number(originGame);
  const locationFilterOptions = { ...options, originGame: gameId };

  const SHARED_SPECIAL_LOCATION_IDS = new Set([253, 254, 255]);
  const isColoXdLocation = (name) => /^\d{3}:/.test(String(name || ''));
  const isRseLocationId = (id) => {
    const locId = Number(id);
    // Core RSE table plus Emerald-exclusive extension IDs.
    return (locId >= 0 && locId <= 87) || (locId >= 197 && locId <= 212);
  };
  const isFrlgLocationId = (id) => {
    const locId = Number(id);
    return locId >= 88 && locId <= 196;
  };
  
  // Colosseum/XD (game ID 15) uses locations with format "###: Name / Name"
  if (gameId === 15) {
    return filterLocationsForEncounterState(LOCATIONS.filter(([id, name]) => {
      // Check if name starts with "###:" pattern (Colosseum/XD format)
      return isColoXdLocation(name);
    }), locationFilterOptions);
  }

  // RSE games: Sapphire(1), Ruby(2), Emerald(3)
  if (gameId === 1 || gameId === 2 || gameId === 3) {
    return filterLocationsForEncounterState(LOCATIONS.filter(([id, name]) => {
      if (isColoXdLocation(name)) return false;
      const locId = Number(id);
      return isRseLocationId(locId) || SHARED_SPECIAL_LOCATION_IDS.has(locId);
    }), locationFilterOptions);
  }

  // FRLG games: FireRed(4), LeafGreen(5)
  if (gameId === 4 || gameId === 5) {
    return filterLocationsForEncounterState(LOCATIONS.filter(([id, name]) => {
      if (isColoXdLocation(name)) return false;
      const locId = Number(id);
      return isFrlgLocationId(locId) || SHARED_SPECIAL_LOCATION_IDS.has(locId);
    }), locationFilterOptions);
  }
  
  // Fallback: all non-Colosseum/XD locations
  return filterLocationsForEncounterState(LOCATIONS.filter(([id, name]) => {
    // Exclude Colosseum/XD formatted locations
    return !isColoXdLocation(name);
  }), locationFilterOptions);
}

// Store reference to metLocation autocomplete wrapper for updating
let metLocationWrapper = null;
const MIRAGE_ISLAND_LOCATION_ID = 71;
const HATCHED_DISABLED_MET_LOCATION_IDS = new Set([253, 254, 255]);
const COLOSSEUM_XD_ORIGIN_GAME_ID = 15;

function getHatchedDefaultMetLocationId(originGame) {
  return [4, 5].includes(Number(originGame))
    ? HATCHED_FRLG_DEFAULT_MET_LOCATION_ID
    : HATCHED_RSE_DEFAULT_MET_LOCATION_ID;
}

function applyHatchedOriginGameDefaults(originGame) {
  const gameId = SETUP_ORIGIN_GAME_IDS.includes(Number(originGame))
    ? Number(originGame)
    : 3;
  const locations = getLocationsForGame(gameId);
  if (metLocationWrapper?.updateList) metLocationWrapper.updateList(locations);

  const metLocation = $('#metLocation');
  const defaultLocationId = getHatchedDefaultMetLocationId(gameId);
  if (metLocation && locations.some(([id]) => Number(id) === defaultLocationId)) {
    metLocation.value = String(defaultLocationId);
  }
}

function syncSetupOriginGameSelector() {
  const row = document.getElementById('setupOriginGameRow');
  const setupSelect = document.getElementById('setupOriginGame');
  const originGameSelect = document.getElementById('originGame');
  if (!row || !setupSelect || !originGameSelect) return;

  const shouldShow = currentEncounterMode === 'hatched' || currentEncounterMode === 'wild';
  row.hidden = !shouldShow;
  if (!shouldShow) return;

  setupSelect.replaceChildren();
  for (const gameId of SETUP_ORIGIN_GAME_IDS) {
    const canonicalOption = Array.from(originGameSelect.options || [])
      .find(option => Number(option.value) === gameId);
    if (!canonicalOption) continue;
    const option = document.createElement('option');
    option.value = String(gameId);
    option.textContent = canonicalOption.textContent;
    option.disabled = canonicalOption.disabled;
    option.hidden = canonicalOption.hidden;
    setupSelect.appendChild(option);
  }

  const currentGame = String(originGameSelect.value || '3');
  const hasCurrentGame = Array.from(setupSelect.options).some(option => option.value === currentGame);
  setupSelect.value = hasCurrentGame ? currentGame : String(setupSelect.options[0]?.value || '');
  setupSelect.disabled = !Array.from(setupSelect.options).some(option => !option.disabled);
}

/**
 * Given an array of merged level ranges [[min,max], ...] and a target level,
 * return the closest valid level that falls inside one of the ranges.
 * If the value is between two disjoint ranges, snaps to the nearest boundary.
 */
function snapToValidLevel(ranges, target) {
  if (!ranges || !ranges.length) return target;
  // Flatten to absolute min/max first for quick bounds check
  const absMin = ranges[0][0];
  const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
  if (target <= absMin) return absMin;
  if (target >= absMax) return absMax;
  // Check if target falls inside any range
  for (const r of ranges) {
    const lo = r[0], hi = r.length > 1 ? r[1] : r[0];
    if (target >= lo && target <= hi) return target; // already valid
  }
  // Target is in a gap — find the closest boundary
  let best = absMin, bestDist = Math.abs(target - absMin);
  for (const r of ranges) {
    const lo = r[0], hi = r.length > 1 ? r[1] : r[0];
    for (const bound of [lo, hi]) {
      const d = Math.abs(target - bound);
      if (d < bestDist) { best = bound; bestDist = d; }
    }
  }
  return best;
}

/**
 * Build a human-readable label for a set of level ranges, e.g. "2–5, 8, 10–12".
 */
function rangesToLabel(ranges) {
  return ranges.map(r => r.length > 1 && r[0] !== r[1] ? `${r[0]}\u2013${r[1]}` : `${r[0]}`).join(', ');
}

function getPreferredWildOriginGame(availableGames) {
  const available = new Set((availableGames || []).map(Number));
  for (const gameId of WILD_ORIGIN_GAME_PRIORITY) {
    if (available.has(gameId)) return gameId;
  }
  return availableGames && availableGames.length ? Number(availableGames[0]) : 0;
}

/**
 * Update Origin Game, Met Location, and Met Level in wild mode based on
 * the selected species' wild encounter data.
 *
 * The encounter data uses merged level ranges:
 *   locationId â†’ [[min,max], ...]  (e.g. [[5,10],[20,30]])
 *
 * Flow:
 *   1. Disable Origin Game options where the species has no wild encounters.
 *   2. Auto-select the priority default when requested, or if the current
 *      game has no encounters.
 *   3. Filter Met Location to only the locations for this species + game.
 *   4. Snap Met Level to the closest valid level within the ranges.
 *
 * Called when: species changes, mode changes to wild, origin game changes,
 * or met location changes.
 */
function updateWildEncounterFilters(speciesId, options = {}) {
  if (currentEncounterMode !== 'wild') return;
  const preferDefaultGame = options.preferDefaultGame === true;

  // For evolved forms not directly in the wild, resolve to their wild ancestor
  const wildId = WILD_ENCOUNTERS[speciesId] ? speciesId : getWildAncestor(speciesId, WILD_ENCOUNTERS);
  const encounterData = wildId != null ? WILD_ENCOUNTERS[wildId] : null;
  const originGameSelect = $('#originGame');
  const metLevelInput =    $('#metLevel');
  if (!originGameSelect) {
    try { syncPidParityPreferenceUi(); } catch (e) {}
    return;
  }

  // â”€â”€ 1. Filter Origin Game options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const availableGames = encounterData ? Object.keys(encounterData).map(Number) : [];
  const gameOptions = Array.from(originGameSelect.options);
  for (const opt of gameOptions) {
    const gId = Number(opt.value);
    // Colosseum/XD (15) — always disabled/greyed in wild mode (no data yet)
    if (gId === 15) { opt.disabled = true; continue; }
    opt.disabled = !availableGames.includes(gId);
    opt.hidden   = !availableGames.includes(gId);
  }

  // â”€â”€ 2. Auto-select default game if requested or current is disabled â”€â”€â”€
  let currentGame = Number(originGameSelect.value);
  const preferredGame = getPreferredWildOriginGame(availableGames);
  if (availableGames.length && (preferDefaultGame || !availableGames.includes(currentGame))) {
    originGameSelect.value = String(preferredGame);
    currentGame = preferredGame;
  }

  // â”€â”€ 3. Filter Met Location to valid locations for species + game â”€â”€â”€â”€â”€â”€â”€â”€
  if (encounterData && encounterData[currentGame]) {
    const gameLocs = encounterData[currentGame]; // { locId: [[min,max],...] }
    const locIds = Object.keys(gameLocs)
      .map(Number)
      .filter(locId => isMetLocationAllowedForEncounterState(locId, {
        encounterMode: 'wild',
        speciesId,
        originGame: currentGame,
      }));
    // Build the filtered location list from LOCATIONS
    const baseLocations = getLocationsForGame(currentGame, {
      encounterMode: 'wild',
      speciesId,
    });
    const filteredLocations = baseLocations.filter(([id]) => locIds.includes(id));
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(filteredLocations);
    }

    // If the current met location isn't in the filtered set, auto-pick the first
    const metLocVal = Number($('#metLocation').value);
    if (!locIds.includes(metLocVal) && filteredLocations.length) {
      $('#metLocation').value = String(filteredLocations[0][0]);
    }

    // â”€â”€ 4. Snap Met Level to the closest valid level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const chosenLoc = Number($('#metLocation').value);
    const ranges = locIds.includes(chosenLoc) ? gameLocs[chosenLoc] : null;
    if (ranges && ranges.length && metLevelInput) {
      const absMin = ranges[0][0];
      const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
      const curLevel = Number(metLevelInput.value) || 0;
      metLevelInput.value = String(snapToValidLevel(ranges, curLevel));
      metLevelInput.min = String(absMin);
      metLevelInput.max = String(absMax);
      metLevelInput.title = `Valid levels: ${rangesToLabel(ranges)}`;

      // Also sync the main level so it's at least the met level
      const metLevel  = Number(metLevelInput.value);
      const mainLevel = Number($('#level').value) || 0;
      if (mainLevel < metLevel) {
        $('#level').value = String(metLevel);
        try { computeAndSetExpFromLevel(); } catch (e) {}
      }
      // Refresh move filtering with the updated level
      try { refreshMoveExclusions(); } catch (e) {}
    }
  } else {
    // No encounter data: show all locations for this game, reset level constraints
    const baseLocations = getLocationsForGame(currentGame, {
      encounterMode: 'wild',
      speciesId,
    });
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(baseLocations);
    }
    if (metLevelInput) {
      metLevelInput.min = '0';
      metLevelInput.max = '100';
      metLevelInput.title = '';
    }
  }

  // Unown: filter form dropdown to match the (now-updated) met location
  if (speciesId === 201) {
    filterUnownFormsByLocation();
  }
  try { syncPidParityPreferenceUi(); } catch (e) {}
  try { syncSetupOriginGameSelector(); } catch (e) {}
}

/**
 * Reset Origin Game dropdown to its normal state (all options enabled).
 * Called when switching away from wild mode.
 */
function resetOriginGameOptions() {
  const select = $('#originGame');
  if (!select) return;
  select.disabled = false;
  select.style.pointerEvents = '';
  select.style.opacity = '';
  select.style.cursor = '';
  for (const opt of Array.from(select.options)) {
    opt.disabled = false;
    opt.hidden   = false;
  }
}

/**
 * Update the move dropdowns to only show moves the selected species can
 * legally learn, taking the current encounter mode and level into account.
 *
 * Mode rules:
 *   hatched     — level-up (any level for normal breeding, capped by level for genderless Ditto-only species) + egg + TM/HM + tutor
 *   wild /
 *   legendaries — level-up (≤ pokémon level) + TM/HM + tutor  (NO egg moves)
 *   mystery     — level-up (≤ pokémon level) + TM/HM + tutor  (NO egg moves)
 *
 * `preserveValue` keeps the current selection even when it is not in the
 * new filtered list (used for mystery-gift preset moves & imports).
 */
let currentLegalMoveIds = new Set();

function shouldValidateCurrentMoveLegality() {
  if (manualOverrideActive || currentEncounterMode === 'imported') return false;
  if (!['wild', 'static', 'roamer'].includes(currentEncounterMode)) return false;
  const speciesId = Number($('#species')?.value || 0);
  const fixedStaticMoves = currentEncounterMode === 'static'
    ? STATIC_ENCOUNTERS[speciesId]?.fixedMoves
    : null;
  return !Array.isArray(fixedStaticMoves) || fixedStaticMoves.length === 0;
}

function getInvalidMoveSlotIndexes() {
  if (!shouldValidateCurrentMoveLegality()) return [];
  const invalid = [];
  for (let index = 0; index < 4; index += 1) {
    const moveId = Number($(`#move${index + 1}`)?.value || 0);
    if (moveId > 0 && !currentLegalMoveIds.has(moveId)) invalid.push(index);
  }
  return invalid;
}

function updateMoveLegalityUi() {
  const invalidSlots = new Set(getInvalidMoveSlotIndexes());
  for (let index = 0; index < 4; index += 1) {
    const flag = document.getElementById(`move${index + 1}LegalityFlag`);
    if (flag) flag.hidden = !invalidSlots.has(index);
  }
  return [...invalidSlots];
}

function updateMovesForSpecies(speciesId, { preserveValue = false } = {}) {
  const clearOutOfLevelHatchedMoves = !manualOverrideActive &&
    shouldCapHatchedLevelUpMoves(speciesId, currentEncounterMode);
  let effectivePreserveValue = (preserveValue || currentEncounterMode === 'imported') &&
    !clearOutOfLevelHatchedMoves;
  const data = LEARNSETS[speciesId];
  const level = Number($('#level')?.value) || 100;
  const originGame = Number($('#originGame')?.value) || 0;
  const inheritedLevelUpMoves = getLevelUpLearnsetForOriginGame(speciesId, originGame);
  const directLevelUpMoves = getDirectLevelUpLearnsetForOriginGame(speciesId, originGame);
  const sourceSpeciesId = getCurrentOriginSourceSpeciesId(speciesId);
  const directEncounter = ['wild', 'static', 'roamer'].includes(currentEncounterMode) &&
    sourceSpeciesId === Number(speciesId);
  const levelUpMoves = directEncounter ? directLevelUpMoves : inheritedLevelUpMoves;
  let baseMoves;

  if (manualOverrideActive) {
    // Manual Override is the only mode that exposes every Gen III move.
    // Encounter-specific distribution/CXD moves are preserved by the preset
    // without making unrelated moves selectable.
    baseMoves = MOVES;
  } else if (data) {
    const mode = currentEncounterMode;

    // Collect move IDs that are legal for the current mode + level
    const idSet = new Set();

    // Determine the correct level-up moves based on origin game.
    // Ruby/Sapphire, Emerald, FireRed, and LeafGreen may use different
    // level-up learnsets (most notably each game's Deoxys form).
    // Level-up moves. Normal hatched breeding can inherit late level-up moves
    // from both parents; genderless Ditto-only species are capped by level.
    if (levelUpMoves) {
      for (const mid of getAllowedLevelUpMoveIdsForEncounter(levelUpMoves, {
        speciesId,
        encounterMode: mode,
        pokemonLevel: level,
      })) idSet.add(mid);
    }
    // TM/HM and Game Boy Advance tutors have no level restriction. Pokémon XD
    // tutors are recorded separately so ordinary GBA encounters can show them
    // as an accurate disabled "XD only" discovery hint instead of selectable.
    if (data.t) for (const mid of data.t) idSet.add(mid);
    const xdTutorMoveIds = new Set(data.x || []);
    if (data.u) {
      for (const mid of data.u) {
        if (String(mode).startsWith('cxd_') || !xdTutorMoveIds.has(mid)) idSet.add(mid);
      }
    }
    // Egg moves — only in hatched mode
    // Include egg moves from this species and all pre-evolutions in the chain
    if (mode === 'hatched') {
      if (data.e) {
        for (const mid of data.e) idSet.add(mid);
      }
      let preId = PRE_EVOLUTIONS[speciesId];
      while (preId != null) {
        const preData = LEARNSETS[preId];
        if (preData?.e) {
          for (const mid of preData.e) idSet.add(mid);
        }
        preId = PRE_EVOLUTIONS[preId];
      }
    }

    // Keep the empty/0 entry ("— None —") plus all legal moves
    baseMoves = MOVES.filter(([id]) => id === 0 || idSet.has(id));
  } else {
    // No learnset data â†’ show everything
    baseMoves = MOVES;
  }
  const directWildMoveOverride = getDirectWildMoveOverride(
    speciesId,
    currentEncounterMode,
    Boolean(WILD_ENCOUNTERS[speciesId])
  );
  if (directWildMoveOverride) {
    const allowedMoveIds = new Set(directWildMoveOverride);
    baseMoves = MOVES.filter(([id]) => id === 0 || allowedMoveIds.has(id));
    effectivePreserveValue = false;
  }
  if (!manualOverrideActive) {
    baseMoves = getSelectableMovesForSpecies(speciesId, baseMoves, MOVES);
  }
  currentLegalMoveIds = manualOverrideActive
    ? new Set(MOVES.map(([id]) => Number(id)).filter(id => id > 0))
    : new Set(baseMoves.map(([id]) => Number(id)).filter(id => id > 0));
  baseMoves = sortMoveListAlphabetically(baseMoves);
  const supportsAlternativeMoveHints = !manualOverrideActive &&
    !directWildMoveOverride &&
    ['wild', 'static', 'roamer', 'hatched'].includes(currentEncounterMode);
  if (supportsAlternativeMoveHints) {
    baseMoves = baseMoves.concat(getAlternativeMoveHints({
      moves: MOVES,
      learnsets: LEARNSETS,
      preEvolutions: PRE_EVOLUTIONS,
      speciesId,
      levelUpMoves,
      legalMoveIds: currentLegalMoveIds,
      encounterMode: currentEncounterMode,
      pokemonLevel: level,
      xdEncounterLists: [CXD_SHADOW_ENCOUNTERS, CXD_SPECIAL_ENCOUNTERS, CXD_TRADE_ENCOUNTERS],
      species: SPECIES,
      mysteryEvents: MYSTERY_EVENTS,
      mysteryGifts: MYSTERY_GIFTS,
      mysteryMovesets: MYSTERY_MOVESETS,
    }));
  }

  // Fresh ordinary encounters start with the last four level-up moves learned
  // at their current level. Keep curated distribution, import, and CXD moves
  // intact; Smeargle retains its explicit Sketch default.
  const selectedStaticSourceSpecies = Number(
    selectedStaticEncounterDetail?.encounter?.species || getSelectedStaticEncounter()?.species || speciesId
  );
  const hasFixedStaticMoves = currentEncounterMode === 'static' &&
    Array.isArray(STATIC_ENCOUNTERS[selectedStaticSourceSpecies]?.fixedMoves) &&
    STATIC_ENCOUNTERS[selectedStaticSourceSpecies].fixedMoves.length > 0;
  let defaultMoveIds = null;
  if (!preserveValue && !hasFixedStaticMoves) {
    const defaultLevelUpMoves = currentEncounterMode === 'hatched'
      ? inheritedLevelUpMoves
      : directLevelUpMoves;
    defaultMoveIds = getDefaultMoveIdsForSpecies(speciesId)
      || (directWildMoveOverride
        ? directWildMoveOverride.slice(-4)
        : getDefaultLevelUpMoveIds(defaultLevelUpMoves, level));
  }
  if (defaultMoveIds) {
    moveAutocompletes.forEach((ac, index) => {
      if (ac) ac.value = defaultMoveIds[index] ? String(defaultMoveIds[index]) : '';
    });
  }

  // For each slot, exclude moves already chosen in other slots to
  // prevent the same move from being selected twice.
  const selected = moveAutocompletes.map(ac => ac ? ac.value : '');
  for (let i = 0; i < moveAutocompletes.length; i++) {
    const ac = moveAutocompletes[i];
    if (!ac || !ac.updateList) continue;
    const othersSelected = new Set(
      selected.filter((id, j) => j !== i && id && id !== '0' && id !== '')
    );
    const filtered = othersSelected.size > 0
      ? baseMoves.filter(row => {
        const [, id] = toNameId(row);
        return id === 0 || !othersSelected.has(String(id));
      })
      : baseMoves;
    ac.updateList(filtered, { preserveValue: effectivePreserveValue });
  }
  updateMoveLegalityUi();
}

/**
 * Re-apply move-slot exclusion / level filtering using the currently
 * selected species and level — call after any individual move selection
 * or level change so that duplicates and out-of-level moves are kept
 * out of the other slots' dropdowns.
 */
function refreshMoveExclusions() {
  const speciesId = Number($('#species')?.value || 0);
  updateMovesForSpecies(speciesId, { preserveValue: true });
}

// Update Hidden Power display based on current IV values
function updateHiddenPower() {
  const ivs = {
    hp: Number($('#ivHp')?.value || 0),
    atk: Number($('#ivAtk')?.value || 0),
    def: Number($('#ivDef')?.value || 0),
    spa: Number($('#ivSpAtk')?.value || 0),
    spd: Number($('#ivSpDef')?.value || 0),
    spe: Number($('#ivSpe')?.value || 0)
  };
  
  const hp = calculateHiddenPower(ivs);
  const typeTextEl = $('#hiddenPowerTypeText');
  const typeSelectEl = $('#hiddenPowerTypeSelect');
  const powerEl = $('#hiddenPowerPower');
  const canChooseType = currentEncounterMode === 'hatched';
  
  if (typeTextEl) {
    typeTextEl.textContent = hp.type;
    typeTextEl.style.display = canChooseType ? 'none' : '';
  }
  if (typeSelectEl) {
    typeSelectEl.value = hp.type;
    typeSelectEl.style.display = canChooseType ? '' : 'none';
    typeSelectEl.disabled = !canChooseType;
    typeSelectEl.title = canChooseType
      ? 'Choose Hidden Power type (auto-sets 70 BP IV spread).'
      : 'Hidden Power type selection is only available in hatched mode.';
  }
  if (powerEl) powerEl.textContent = `Power: ${hp.power}`;
  try { updateStatGraph(); } catch (e) {}
}

function getFieldFocusTarget(target) {
  if (!target) return null;
  if (target.matches?.('input, select, textarea, button')) return target;
  return target.querySelector?.('input, select, textarea, button, [tabindex]:not([tabindex="-1"])') || null;
}

function scrollToMissingField(target, focusTarget = null) {
  if (!target?.scrollIntoView) return;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
    const focusEl = focusTarget || getFieldFocusTarget(target);
    if (!focusEl?.focus) return;
    window.setTimeout(() => {
      try {
        focusEl.focus({ preventScroll: true });
      } catch (e) {
        focusEl.focus();
      }
    }, prefersReducedMotion ? 0 : 250);
  });
}

// Highlight missing required fields (global scope for access from onGenerate)
function highlightMissingFields({ scrollToFirst = true } = {}) {
  const speciesEl = $('#species');
  const natureEl = $('#nature');
  const move1El = $('#move1');
  const move2El = $('#move2');
  const move3El = $('#move3');
  const move4El = $('#move4');
  const otNameEl = $('#otName');
  const tidEl = $('#tid');
  const sidEl = $('#sid');
  const pidFinderBtn = $('#pidFinderBtn');
  const originSelect = document.getElementById('pokemonOrigin');
  const originRow = document.getElementById('pokemonOriginRow');

  const speciesValue = speciesEl.value;
  const natureValue = natureEl.value;
  const move1Value = move1El.value;
  const move2Value = move2El.value;
  const move3Value = move3El.value;
  const move4Value = move4El.value;
  const otNameValue = otNameEl.value;
  const speciesErrorTarget = speciesEl.parentElement;
  const move1ErrorTarget = move1El.parentElement;
  const move2ErrorTarget = move2El.parentElement;
  const move3ErrorTarget = move3El.parentElement;
  const move4ErrorTarget = move4El.parentElement;
  
  // Remove any existing error highlights
  speciesErrorTarget.classList.remove('field-error');
  natureEl.classList.remove('field-error');
  move1ErrorTarget.classList.remove('field-error');
  move2ErrorTarget.classList.remove('field-error');
  move3ErrorTarget.classList.remove('field-error');
  move4ErrorTarget.classList.remove('field-error');
  otNameEl.classList.remove('field-error');
  tidEl?.classList.remove('field-error');
  sidEl?.classList.remove('field-error');
  originRow?.classList.remove('field-error');
  document.getElementById('mysteryEventRow')?.classList.remove('field-error');
  document.getElementById('staticEncounterRow')?.classList.remove('field-error');
  document.getElementById('shadowEncounter')?.closest('.row')?.classList.remove('field-error');
  if (pidFinderBtn) pidFinderBtn.classList.remove('field-error');
  
  let missingFields = [];
  let firstMissingTarget = null;
  let firstMissingFocusTarget = null;

  const markMissing = (label, highlightTarget, focusTarget = null) => {
    highlightTarget?.classList.add('field-error');
    missingFields.push(label);
    if (!firstMissingTarget && highlightTarget) {
      firstMissingTarget = highlightTarget;
      firstMissingFocusTarget = focusTarget || getFieldFocusTarget(highlightTarget);
    }
  };
  
  // Check each required field
  if (!speciesValue || speciesValue.trim() === '') {
    markMissing('Species', speciesErrorTarget, getFieldFocusTarget(speciesEl));
  } else if (!isCurrentOriginSelectionResolved()) {
    if (!originSelect?.value) {
      markMissing('Origin', originRow, originSelect);
    } else if (currentEncounterMode === 'mystery') {
      const row = document.getElementById('mysteryEventRow');
      markMissing('Distribution', row, document.getElementById('mysteryEvent'));
    } else if (currentEncounterMode === 'static') {
      const row = document.getElementById('staticEncounterRow');
      markMissing('Encounter', row, document.getElementById('staticEncounter'));
    } else if (currentEncounterMode === 'cxd_shadow') {
      const field = document.getElementById('shadowEncounter');
      markMissing('Trainer / Location', field?.closest('.row'), field);
    }
  }
  
  if (!natureValue || natureValue.trim() === '') {
    markMissing('Nature', natureEl);
  }
  
  // Check if at least one move is selected
  const hasMove = (move1Value && move1Value !== '0') || 
                  (move2Value && move2Value !== '0') || 
                  (move3Value && move3Value !== '0') || 
                  (move4Value && move4Value !== '0');
  
  if (!hasMove) {
    markMissing('At least one Move', move1ErrorTarget, getFieldFocusTarget(move1El));
  }

  for (const slotIndex of updateMoveLegalityUi()) {
    const moveEl = $(`#move${slotIndex + 1}`);
    markMissing('Invalid move', moveEl?.parentElement, getFieldFocusTarget(moveEl));
  }

  if (!otNameValue || otNameValue.trim() === '') {
    markMissing('OT Name', otNameEl);
  }

  if (!hasRequiredMysteryGiftPidFinderSelection()) {
    markMissing('Find Legal Encounter', pidFinderBtn);
  }

  if (!hasRequiredCXDEncounterPidFinderSelection()) {
    markMissing('Find Legal Encounter', pidFinderBtn);
  }

  if (!hasRequiredPidFinderForPidParitySelection()) {
    markMissing('Find Legal Encounter for PID parity', pidFinderBtn);
  }

  const rsTrainerIdValidation = getRSTrainerIdValidation();
  if (rsTrainerIdValidation.applies && !rsTrainerIdValidation.valid) {
    tidEl?.classList.add('field-error');
    sidEl?.classList.add('field-error');
    missingFields.push('Valid Ruby/Sapphire Trainer ID');
    if (!firstMissingTarget) {
      firstMissingTarget = tidEl || sidEl;
      firstMissingFocusTarget = tidEl || sidEl;
    }
  }

  if (scrollToFirst && firstMissingTarget) {
    scrollToMissingField(firstMissingTarget, firstMissingFocusTarget);
  }
  
  return missingFields;
}

function renderSpeciesSprite(img, speciesId) {
  if (!img) return;
  img.onerror = null;
  const isShiny = $('#shiny')?.checked || false;

  // Unown: use form-specific sprite
  if (speciesId === 201) {
    const pid = parsePidInput($('#pid')?.value || '0');
    const formIndex = getUnownFormIndex(pid);
    const localPath = getUnownSpritePath(formIndex);
    const onlinePath = getOnlineUnownSpriteUrl(isShiny);
    img.onerror = () => { img.onerror = null; img.src = localPath; };
    img.src = onlinePath || localPath;
    img.alt = `Unown ${UNOWN_FORMS[formIndex]}`;
    img.classList.add('visible');
    return;
  }

  const species = SPECIES.find(s => s[0] === speciesId);
  const localPath = species ? getSpritePath(species[1]) : null;

  if (species) {
    const onlinePath = getOnlineSpriteUrl(species[1], isShiny);
    if (onlinePath) {
      if (localPath) {
        img.onerror = () => { img.onerror = null; img.src = localPath; };
      }
      img.src = onlinePath;
      img.alt = species[1];
      img.classList.add('visible');
      return;
    }
  }

  if (localPath) {
    img.src = localPath;
    img.alt = species[1];
    img.classList.add('visible');
  } else {
    img.removeAttribute('src');
    img.alt = '';
    img.classList.remove('visible');
  }
}

function updateSpeciesSprite(speciesId) {
  renderSpeciesSprite($('#speciesSprite'), speciesId);
  updateDesktopPokemonPreviewSprite(speciesId);
}

function updateEncounterBrowseSprite(speciesId) {
  renderSpeciesSprite(document.getElementById('encounterBrowseSprite'), speciesId);
  updateDesktopPokemonPreviewSprite(speciesId);
}

function updateDesktopPokemonPreviewSprite(speciesId) {
  const img = document.getElementById('desktopPokemonPreviewSprite');
  const preview = document.getElementById('desktopPokemonPreview');
  renderSpeciesSprite(img, speciesId);
  preview?.classList.toggle('has-sprite', Boolean(img?.classList.contains('visible')));
}

function updateUnownPreviewSprites(formIndex) {
  const spritePath = getUnownSpritePath(formIndex);
  const altText = `Unown ${UNOWN_FORMS[formIndex]}`;
  for (const imageId of ['speciesSprite', 'encounterBrowseSprite', 'desktopPokemonPreviewSprite']) {
    const img = document.getElementById(imageId);
    if (!img) continue;
    img.src = spritePath;
    img.alt = altText;
    img.classList.add('visible');
  }
  document.getElementById('desktopPokemonPreview')?.classList.add('has-sprite');
}

// â”€â”€ Unown form helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/** Populate and show/hide the Unown form dropdown based on current species. */
function updateUnownFormVisibility(speciesId) {
  const row = document.getElementById('unownFormRow');
  if (!row) return;
  if (speciesId === 201) {
    // Populate dropdown with all 28 forms initially
    const sel = document.getElementById('unownForm');
    if (sel && sel.options.length === 0) {
      for (let i = 0; i < 28; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        const ch = UNOWN_FORMS[i];
        opt.textContent = ch === '!' ? '! (Exclamation)' : ch === '?' ? '? (Question)' : ch;
        sel.appendChild(opt);
      }
    }
    // Sync to current PID
    updateUnownFormFromPID();
    // In wild mode, restrict forms to those available in the current chamber
    if (currentEncounterMode === 'wild') {
      filterUnownFormsByLocation();
    }
    row.style.display = '';
  } else {
    row.style.display = 'none';
  }
}

/** Sync the Unown form dropdown + sprite to the current PID value. */
function updateUnownFormFromPID() {
  const speciesId = Number($('#species')?.value || 0);
  if (speciesId !== 201) return;
  const pid = parsePidInput($('#pid')?.value || '0');
  const formIndex = getUnownFormIndex(pid);
  const sel = document.getElementById('unownForm');
  if (sel) sel.value = String(formIndex);
  // Update sprite to matching form
  updateUnownPreviewSprites(formIndex);
}

/**
 * Ensure all 28 Unown forms are visible in the dropdown.
 * (Previously filtered by location; now all forms are always selectable
 * and picking a form snaps the location instead.)
 */
function filterUnownFormsByLocation() {
  const sel = document.getElementById('unownForm');
  if (!sel) return;
  for (const opt of Array.from(sel.options)) {
    opt.hidden = false;
    opt.disabled = false;
  }
}

/**
 * When the Unown form dropdown changes, snap the met location
 * to a valid Tanoby chamber for the chosen form (if the current
 * location cannot produce it).  The full location list is kept intact.
 */
function filterUnownLocationsByForm() {
  if (currentEncounterMode !== 'wild') return;
  const speciesId = Number($('#species')?.value || 0);
  if (speciesId !== 201) return;

  const formIndex = Number(document.getElementById('unownForm')?.value ?? 0);
  const validLocIds = getTanobyLocationsForForm(formIndex);

  // If current location cannot produce this form, snap to the first valid one
  const curLoc = Number($('#metLocation')?.value || 0);
  if (!validLocIds.includes(curLoc) && validLocIds.length) {
    $('#metLocation').value = String(validLocIds[0]);
    // Snap met level for the new location
    const gameId = Number($('#originGame')?.value || 0);
    const enc = WILD_ENCOUNTERS[speciesId];
    if (enc && enc[gameId] && enc[gameId][validLocIds[0]]) {
      const ranges = enc[gameId][validLocIds[0]];
      const ml = $('#metLevel');
      if (ml && ranges && ranges.length) {
        ml.value = String(snapToValidLevel(ranges, Number(ml.value) || 0));
        const absMin = ranges[0][0];
        const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
        ml.min = String(absMin);
        ml.max = String(absMax);
        ml.title = `Valid levels: ${rangesToLabel(ranges)}`;
      }
    }
    try { updateBallLocking(); } catch (e) {}
  }
}

/** Update sprite to match the currently selected Unown form. */
function updateUnownFormSprite() {
  const formIndex = Number(document.getElementById('unownForm')?.value ?? 0);
  updateUnownPreviewSprites(formIndex);
}

// When user manually picks a form, update sprite + filter locations
document.getElementById('unownForm')?.addEventListener('change', function () {
  updateUnownFormSprite();
  filterUnownLocationsByForm();
});

function populateAbilitySelectForSpecies(speciesId, abilityBit = 0) {
  const abilitySelect = $('#ability');
  if (!abilitySelect) return 0;

  const abilities = getSpeciesAbilities(Number(speciesId));
  const selectedBit = Number(abilityBit) === 1 ? 1 : 0;
  if (!abilities) {
    abilitySelect.innerHTML = '<option value="0">0</option><option value="1">1</option>';
    abilitySelect.value = String(selectedBit);
    return selectedBit;
  }

  const [ability0Id, ability1Id] = abilities;
  const ability0Name = getAbilityName(ability0Id);
  const ability1Name = getAbilityName(ability1Id);
  if (ability0Id === ability1Id) {
    abilitySelect.innerHTML = `<option value="0">${ability0Name}</option>`;
    abilitySelect.value = '0';
    return 0;
  }

  abilitySelect.innerHTML = [
    `<option value="0">${ability0Name}</option>`,
    `<option value="1">${ability1Name}</option>`,
  ].join('');
  abilitySelect.value = String(selectedBit);
  return selectedBit;
}

function getImportedGenderForPid(speciesId, pid) {
  const threshold = getGenderThreshold(Number(speciesId));
  if (threshold === -1) return 'genderless';
  if (threshold === 0) return 'male';
  if (threshold >= 254) return 'female';
  return ((Number(pid) >>> 0) & 0xFF) < threshold ? 'female' : 'male';
}

function populateImportedGenderForSpecies(speciesId, preferredGender = '') {
  const genderSelect = $('#gender');
  if (!genderSelect) return 'male';

  const threshold = getGenderThreshold(Number(speciesId));
  let selectedGender;
  if (threshold === -1) {
    selectedGender = 'genderless';
    genderSelect.innerHTML = '<option value="genderless">Genderless</option>';
  } else if (threshold === 0) {
    selectedGender = 'male';
    genderSelect.innerHTML = '<option value="male">Male</option>';
  } else if (threshold >= 254) {
    selectedGender = 'female';
    genderSelect.innerHTML = '<option value="female">Female</option>';
  } else {
    genderSelect.innerHTML = '<option value="male">Male</option><option value="female">Female</option>';
    selectedGender = preferredGender === 'female' ? 'female' : 'male';
  }

  genderSelect.value = selectedGender;
  const fixedGender = threshold === -1 || threshold === 0 || threshold >= 254;
  genderSelect.disabled = fixedGender;
  genderSelect.style.pointerEvents = fixedGender ? 'none' : '';
  genderSelect.style.opacity = fixedGender ? '0.6' : '';
  genderSelect.style.cursor = fixedGender ? 'not-allowed' : '';
  return selectedGender;
}

function boot(){
  // Function to update ability select based on species
  function updateAbilitySelect(speciesId) {
    if (currentEncounterMode === 'imported') return;
    const currentValue = $('#ability')?.value;
    populateAbilitySelectForSpecies(speciesId, currentValue);
    try { syncPidParityPreferenceUi(); } catch (e) {}
  }

  const ENCOUNTER_BODY_CLASSES = [
    'encounter-hatched',
    'encounter-wild',
    'encounter-static',
    'encounter-roamer',
    'encounter-mystery',
    'encounter-cxd_shadow',
    'encounter-cxd_trade',
    'encounter-imported',
  ];

  function syncEncounterModeBodyClasses(mode) {
    for (const className of ENCOUNTER_BODY_CLASSES) {
      document.body.classList.toggle(className, className === `encounter-${mode}`);
    }
    syncSetupOriginGameSelector();
  }

  function getMysteryEventLabel(tag) {
    const configuredLabel = MYSTERY_EVENTS?.[tag]?.label;
    if (configuredLabel) return configuredLabel;
    const labels = {
      '10ANNI': 'TOP 10 DISTRIBUTION POKÉMON',
      MITSURIN_CELEBI: 'MITSURIN CELEBI',
      AGETO_CELEBI: 'AGETO CELEBI',
      WISHMKR_BEST: 'WISHMKR JIRACHI',
      WISHMKR_SHINY: 'WISHMKR JIRACHI - ALL SHINY VERSIONS',
      CHANNEL_JIRACHI: 'CHANNEL JIRACHI',
      BOX_EVENT: 'POKÉMON BOX RUBY & SAPPHIRE',
    };
    const upperTag = String(tag || '').toUpperCase();
    return labels[upperTag] || String(tag || '').replace(/_/g, ' ');
  }

  function getOriginGameLabel(gameId) {
    const option = Array.from(document.querySelector('#originGame')?.options || [])
      .find(candidate => Number(candidate.value) === Number(gameId));
    return option?.textContent?.trim() || `Game ${gameId}`;
  }

  function getLocationLabel(locationId) {
    return LOCATIONS.find(([id]) => Number(id) === Number(locationId))?.[1] || `Location ${locationId}`;
  }

  function populateEncounterBrowserCategories() {
    const select = document.getElementById('encounterBrowseCategory');
    if (!select) return;
    const currentValue = String(select.value || '');
    select.innerHTML = '<option value="">Choose source</option>';
    for (const category of ENCOUNTER_BROWSE_CATEGORIES) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.label;
      select.appendChild(option);
    }
    select.value = ENCOUNTER_BROWSE_CATEGORIES.some(category => category.id === currentValue)
      ? currentValue
      : '';
  }

  function populateEncounterBrowserSubcategories(options = {}) {
    const sourceSelect = document.getElementById('encounterBrowseCategory');
    const subcategorySelect = document.getElementById('encounterBrowseSubcategory');
    if (!sourceSelect || !subcategorySelect) return;

    const previousValue = options.preserveSelection === false
      ? ''
      : String(subcategorySelect.value || '');
    const subcategories = getEncounterBrowseSubcategories(sourceSelect.value);
    subcategorySelect.innerHTML = '<option value="">Choose category</option>';
    for (const subcategory of subcategories) {
      const option = document.createElement('option');
      option.value = subcategory.id;
      option.textContent = subcategory.label;
      subcategorySelect.appendChild(option);
    }

    if (subcategories.some(subcategory => subcategory.id === previousValue)) {
      subcategorySelect.value = previousValue;
    } else if (subcategories.length === 1) {
      subcategorySelect.value = subcategories[0].id;
    } else {
      subcategorySelect.value = '';
    }
    subcategorySelect.disabled = subcategories.length === 0;
  }

  function refreshEncounterBrowserResults(options = {}) {
    const sourceSelect = document.getElementById('encounterBrowseCategory');
    const subcategorySelect = document.getElementById('encounterBrowseSubcategory');
    const speciesSelect = document.getElementById('encounterBrowseSpecies');
    const status = document.getElementById('encounterBrowseStatus');
    if (!sourceSelect || !subcategorySelect || !speciesSelect || !status) return;

    const sourceId = String(sourceSelect.value || '');
    const subcategoryId = String(subcategorySelect.value || '');
    const source = getEncounterBrowseCategory(sourceId);
    const subcategory = getEncounterBrowseSubcategory(sourceId, subcategoryId);
    const previousValue = options.preserveSelection === false
      ? ''
      : String(speciesSelect.value || '');
    speciesSelect.innerHTML = '';

    if (!source || !subcategory) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Choose Pokémon';
      speciesSelect.appendChild(option);
      speciesSelect.disabled = true;
      updateEncounterBrowseSprite(0);
      status.textContent = source
        ? 'Choose a category to see compatible Pokémon.'
        : 'Choose a source, then a category, to see compatible Pokémon.';
      return;
    }

    const availableSpecies = getSpeciesForEncounterBrowseSelection(sourceId, subcategoryId, {
      mysteryEvents: MYSTERY_EVENTS,
      mysteryGifts: MYSTERY_GIFTS,
    });
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = availableSpecies.length
      ? 'Choose Pokémon'
      : 'No Pokémon available';
    speciesSelect.appendChild(placeholder);
    for (const [speciesId, speciesName] of availableSpecies) {
      const option = document.createElement('option');
      option.value = String(speciesId);
      option.textContent = String(speciesName);
      speciesSelect.appendChild(option);
    }

    speciesSelect.disabled = availableSpecies.length === 0;
    const currentSpeciesId = options.preserveSelection === false
      ? ''
      : String($('#species')?.value || '');
    const preferredValue = availableSpecies.some(([id]) => String(id) === currentSpeciesId)
      ? currentSpeciesId
      : previousValue;
    speciesSelect.value = availableSpecies.some(([id]) => String(id) === preferredValue)
      ? preferredValue
      : '';
    updateEncounterBrowseSprite(Number(speciesSelect.value) || 0);
    status.textContent = `${availableSpecies.length} Pokémon available in ${subcategory.label}.`;
  }

  function syncEncounterBrowserSelection(speciesId) {
    const speciesSelect = document.getElementById('encounterBrowseSpecies');
    if (!speciesSelect) return;
    const value = String(Number(speciesId) || '');
    speciesSelect.value = Array.from(speciesSelect.options)
      .some(option => option.value === value)
      ? value
      : '';
  }

  function getActiveEncounterBrowseSelection() {
    if (!document.body.classList.contains('encounter-browser-mode')) return null;
    const sourceId = String(document.getElementById('encounterBrowseCategory')?.value || '');
    const subcategoryId = String(document.getElementById('encounterBrowseSubcategory')?.value || '');
    if (!getEncounterBrowseSubcategory(sourceId, subcategoryId)) return null;
    return { sourceId, subcategoryId };
  }

  function isEncounterInActiveBrowseSelection(encounter) {
    const selection = getActiveEncounterBrowseSelection();
    if (!selection) return true;
    const source = getEncounterBrowseCategory(selection.sourceId);
    if (!source) return true;

    if (selection.sourceId === 'in_game_events') {
      return encounter.category === selection.subcategoryId;
    }
    if (selection.sourceId === 'in_game_trades') {
      return Number(encounter.originGame) === Number(selection.subcategoryId);
    }
    if (selection.sourceId === 'colosseum' || selection.sourceId === 'xd') {
      if (encounter.game !== source.game) return false;
      if (selection.subcategoryId === 'ereader') return Boolean(encounter.eReader);
      if (selection.subcategoryId === 'shadow') return encounter.kind === 'shadow' && !encounter.eReader;
      return encounter.kind === selection.subcategoryId;
    }
    return true;
  }

  function resetResolvedPokemonSetupState() {
    for (const key of Object.keys(encounterModeStateCache)) delete encounterModeStateCache[key];
    preserveSpeciesOnNextModeChange = false;
    deferExactPresetOnNextModeChange = false;
    if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });

    currentEncounterMode = '';
    const internalModeSelect = document.getElementById('encounterMode');
    if (internalModeSelect) internalModeSelect.value = '';
    const originSelect = document.getElementById('pokemonOrigin');
    if (originSelect) originSelect.value = '';
    syncEncounterModeBodyClasses('');

    if (speciesAutocomplete) speciesAutocomplete.value = '';
    clearExactEncounterSelections();
    resetAllModeState();
    syncPokemonFirstOriginUi(0, {
      mode: '',
      preserveCurrent: false,
      preserveExact: false,
    });
    validateForm();
    updateLegalityStatus();
  }

  function resetPokemonSelectionModeState() {
    const sourceSelect = document.getElementById('encounterBrowseCategory');
    if (sourceSelect) sourceSelect.value = '';
    populateEncounterBrowserSubcategories({ preserveSelection: false });
    refreshEncounterBrowserResults({ preserveSelection: false });
    resetResolvedPokemonSetupState();
  }

  function initializeEncounterBrowser() {
    const sourceSelect = document.getElementById('encounterBrowseCategory');
    const subcategorySelect = document.getElementById('encounterBrowseSubcategory');
    const speciesSelect = document.getElementById('encounterBrowseSpecies');
    if (!sourceSelect || !subcategorySelect || !speciesSelect) return;

    const disclosure = document.getElementById('encounterBrowserDisclosure');
    const disclosureSummary = disclosure?.querySelector('summary');
    let previousBrowseMode = false;
    const syncBrowseMode = ({ resetSelection = true } = {}) => {
      const browseMode = Boolean(disclosure?.open);
      document.body.classList.toggle('encounter-browser-mode', browseMode);
      if (resetSelection && browseMode !== previousBrowseMode) {
        resetPokemonSelectionModeState();
      }
      previousBrowseMode = browseMode;
      disclosureSummary?.setAttribute(
        'aria-label',
        browseMode
          ? 'Selection mode: Browse. Switch to Search'
          : 'Selection mode: Search. Switch to Browse',
      );
    };
    if (disclosure) disclosure.open = false;
    syncBrowseMode({ resetSelection: false });
    disclosure?.addEventListener('toggle', () => syncBrowseMode());

    populateEncounterBrowserCategories();
    populateEncounterBrowserSubcategories();
    sourceSelect.addEventListener('change', () => {
      subcategorySelect.value = '';
      resetResolvedPokemonSetupState();
      populateEncounterBrowserSubcategories({ preserveSelection: false });
      refreshEncounterBrowserResults({ preserveSelection: false });
    });
    subcategorySelect.addEventListener('change', () => {
      resetResolvedPokemonSetupState();
      refreshEncounterBrowserResults({ preserveSelection: false });
    });
    speciesSelect.addEventListener('change', () => {
      const speciesId = Number(speciesSelect.value) || 0;
      updateEncounterBrowseSprite(speciesId);
      if (!speciesId || !speciesAutocomplete?.selectById?.(speciesId)) return;
      $('#species').value = String(speciesId);

      const sourceId = String(sourceSelect.value || '');
      const subcategoryId = String(subcategorySelect.value || '');
      const originMode = getEncounterBrowseOriginMode(sourceId);
      const originSelect = document.getElementById('pokemonOrigin');
      const hasOrigin = Array.from(originSelect?.options || [])
        .some(option => option.value === originMode);
      if (originSelect && originMode && hasOrigin) {
        originSelect.value = originMode;
        originSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // The first selection reveals and configures the compatible origin list.
      // Re-apply the species after choosing that origin so the autocomplete and
      // all exact-encounter controls finish in the same resolved state.
      if (Number($('#species')?.value || 0) !== speciesId) {
        speciesAutocomplete.selectById(speciesId);
      }
      $('#species').value = String(speciesId);

      if (sourceId === 'in_game_events') {
        const staticCategory = document.getElementById('staticCategory');
        if (staticCategory) staticCategory.value = subcategoryId;
      } else if (['wild', 'roamers'].includes(sourceId)) {
        const originGame = document.getElementById('originGame');
        if (originGame && Array.from(originGame.options).some(option => option.value === subcategoryId)) {
          originGame.value = subcategoryId;
          originGame.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    refreshEncounterBrowserResults({ preserveSelection: false });
  }

  function clearExactEncounterSelections() {
    selectedStaticEncounterDetail = null;
    const mysterySelect = document.getElementById('mysteryEvent');
    if (mysterySelect) mysterySelect.value = '';
    const staticSelect = document.getElementById('staticEncounter');
    if (staticSelect) staticSelect.innerHTML = '<option value="">— Select encounter —</option>';
    const shadowSelect = document.getElementById('shadowEncounter');
    if (shadowSelect) shadowSelect.innerHTML = '<option value="">— Select encounter —</option>';
    const tradeSelect = document.getElementById('cxdTradeEncounter');
    if (tradeSelect) tradeSelect.innerHTML = '';
    mysteryPresetAppliedFor = 0;
    mysteryUserModifiedSincePreset = false;
  }

  function populateMysteryEventsForSpecies(speciesId, selectedTag = '') {
    const select = document.getElementById('mysteryEvent');
    if (!select) return;
    const browseSelection = getActiveEncounterBrowseSelection();
    const events = getMysteryEventsForSpecies(speciesId, MYSTERY_EVENTS, MYSTERY_GIFTS)
      .filter(({ tag, event }) => browseSelection?.sourceId !== 'event_distributions'
        || getEventDistributionSubcategoryId(tag, event) === browseSelection.subcategoryId);
    select.innerHTML = '<option value="">— Select distribution —</option>';
    for (const { tag, sourceSpeciesIds = [] } of events) {
      const option = document.createElement('option');
      option.value = tag;
      const sourceNames = sourceSpeciesIds
        .filter(sourceId => Number(sourceId) !== Number(speciesId))
        .map(sourceId => SPECIES.find(([id]) => Number(id) === Number(sourceId))?.[1])
        .filter(Boolean);
      option.textContent = `${getMysteryEventLabel(tag)}${sourceNames.length ? ` — from ${sourceNames.join(' / ')}` : ''}`;
      select.appendChild(option);
    }
    select.value = events.some(event => event.tag === selectedTag) ? selectedTag : '';
  }

  function populateStaticEncountersForSpecies(speciesId, selectedValue = '') {
    const select = document.getElementById('staticEncounter');
    if (!select) return;
    const encounters = getStaticEncountersForSpecies(speciesId);
    select.innerHTML = '<option value="">— Select encounter —</option>';
    encounters.forEach((encounter, encounterIndex) => {
      if (!isEncounterInActiveBrowseSelection(encounter)) return;
      for (const gameId of encounter.games || []) {
        const option = document.createElement('option');
        option.value = `${encounterIndex}:${Number(gameId)}`;
        const category = STATIC_CATEGORIES.find(item => item.id === encounter.category)?.label || 'Static';
        const sourceName = SPECIES.find(([id]) => Number(id) === Number(encounter.species))?.[1] || 'Pokémon';
        const sourcePrefix = Number(encounter.species) === Number(speciesId) ? '' : `${sourceName} — `;
        option.textContent = `${sourcePrefix}${category} — ${getOriginGameLabel(gameId)} — ${getLocationLabel(encounter.location)} — Lv${encounter.level}`;
        select.appendChild(option);
      }
    });
    select.value = Array.from(select.options).some(option => option.value === selectedValue) ? selectedValue : '';
    if (!select.value) {
      selectedStaticEncounterDetail = null;
      const categorySelect = document.getElementById('staticCategory');
      if (categorySelect) categorySelect.value = '';
    }
  }

  function getSelectedStaticOriginEncounter() {
    if (currentEncounterMode !== 'static') return null;
    const select = document.getElementById('staticEncounter');
    if (!select?.value) return null;
    const [encounterIndexText, gameIdText] = String(select.value).split(':');
    const encounters = getStaticEncountersForSpecies(Number($('#species')?.value || 0));
    const encounter = encounters[Number(encounterIndexText)];
    const gameId = Number(gameIdText);
    if (!encounter || !(encounter.games || []).map(Number).includes(gameId)) return null;
    return { encounter, gameId };
  }

  function hasResolvedOriginSelection() {
    return isCurrentOriginSelectionResolved();
  }

  function syncPokemonFirstOriginUi(speciesId, options = {}) {
    const originRow = document.getElementById('pokemonOriginRow');
    const originSelect = document.getElementById('pokemonOrigin');
    const internalModeSelect = document.getElementById('encounterMode');
    const description = document.getElementById('encounterModeDescription');
    if (!originRow || !originSelect) return;

    const id = Number(speciesId) || 0;
    if (currentEncounterMode === 'imported') {
      originRow.hidden = !id;
      originSelect.disabled = true;
      originSelect.innerHTML = '<option value="imported">Imported / Custom</option>';
      originSelect.value = 'imported';
      if (internalModeSelect) internalModeSelect.value = 'imported';
      if (description) description.hidden = false;
      setEncounterModeDescription('imported');
      return;
    }

    originSelect.disabled = false;
    originRow.hidden = !id;
    const availableOrigins = id
      ? getAvailableOriginsForSpecies(id, { mysteryEvents: MYSTERY_EVENTS, mysteryGifts: MYSTERY_GIFTS })
      : [];
    const requestedMode = options.preserveCurrent === false
      ? ''
      : reconcileOriginForSpecies(id, String(options.mode ?? currentEncounterMode), {
          mysteryEvents: MYSTERY_EVENTS,
          mysteryGifts: MYSTERY_GIFTS,
        });

    originSelect.innerHTML = '<option value="">— Select origin —</option>';
    for (const origin of availableOrigins) {
      const option = document.createElement('option');
      option.value = origin.mode;
      option.textContent = origin.label;
      originSelect.appendChild(option);
    }
    originSelect.value = requestedMode;
    if (internalModeSelect) internalModeSelect.value = requestedMode;
    if (description) description.hidden = !requestedMode;
    if (requestedMode) setEncounterModeDescription(requestedMode);

    if (requestedMode === 'mystery') {
      populateMysteryEventsForSpecies(id, options.preserveExact ? String($('#mysteryEvent')?.value || '') : '');
    } else if (requestedMode === 'static') {
      populateStaticEncountersForSpecies(id, options.preserveExact ? String($('#staticEncounter')?.value || '') : '');
    }
  }

  _syncPokemonFirstOriginUi = syncPokemonFirstOriginUi;

  function prepareOriginForSpeciesChange(speciesId, importedMode) {
    if (importedMode) return { deferExact: false, applyAutomaticPreset: false };

    const previousMode = String($('#pokemonOrigin')?.value || currentEncounterMode || '');
    const transition = getOriginTransitionForSpecies(speciesId, previousMode, {
      mysteryEvents: MYSTERY_EVENTS,
      mysteryGifts: MYSTERY_GIFTS,
      manualOverride: manualOverrideActive,
    });
    const nextMode = transition.mode;

    for (const key of Object.keys(encounterModeStateCache)) delete encounterModeStateCache[key];
    if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });

    if (!manualOverrideActive) {
      resetAllModeState();
      $('#species').value = String(speciesId);
    } else {
      clearGeneratedOutputs();
    }

    currentEncounterMode = nextMode;
    const internalModeSelect = document.getElementById('encounterMode');
    if (internalModeSelect) internalModeSelect.value = nextMode;
    syncEncounterModeBodyClasses(nextMode);
    clearExactEncounterSelections();
    return {
      deferExact: transition.requiresExactEncounter,
      applyAutomaticPreset: transition.applyAutomaticPreset,
      nextMode,
    };
  }

  function syncBuilderProgressiveDisclosure(resolved = isCurrentOriginSelectionResolved()) {
    const speciesId = Number($('#species')?.value || 0);
    const originMode = String($('#pokemonOrigin')?.value || '');
    const stage = document.getElementById('builderSetupStage');
    const guidance = document.getElementById('builderSetupGuidance');
    const basicsCard = document.getElementById('basicsCard');

    document.body.classList.toggle('builder-setup-pending', !resolved);
    stage?.classList.toggle('is-complete', resolved);
    guidance?.classList.toggle('is-complete', resolved);
    basicsCard?.setAttribute('data-setup-complete', resolved ? 'true' : 'false');

    if (!guidance) return;
    if (resolved && currentEncounterMode === 'imported') {
      guidance.textContent = 'Imported Pokémon loaded. Review or customize its details below.';
    } else if (resolved) {
      guidance.textContent = 'Setup complete. You can now customize the Pokémon below.';
    } else if (!speciesId) {
      guidance.textContent = 'Start by choosing the Pokémon you want to create.';
    } else if (!originMode) {
      guidance.textContent = 'Now choose how this Pokémon was obtained.';
    } else if (originMode === 'mystery') {
      guidance.textContent = 'Choose the exact distribution to continue.';
    } else if (originMode === 'static') {
      guidance.textContent = 'Choose the exact encounter to continue.';
    } else if (originMode === 'cxd_shadow') {
      guidance.textContent = 'Choose the exact Colosseum/XD encounter to continue.';
    } else {
      guidance.textContent = 'Finish the origin setup to continue.';
    }
  }

  // Form validation - check if generate button should be enabled
  function validateForm() {
    const speciesValue = $('#species').value;
    const natureValue = $('#nature').value;
    const move1Value = $('#move1').value;
    const move2Value = $('#move2').value;
    const move3Value = $('#move3').value;
    const move4Value = $('#move4').value;
    const otNameValue = $('#otName').value;
    const pidFinderBtn = $('#pidFinderBtn');
    
    // Check if species and nature are selected
    const hasSpecies = speciesValue && speciesValue.trim() !== '';
    const hasNature = natureValue && natureValue.trim() !== '';
    const hasOTName = otNameValue && otNameValue.trim() !== '';
    
    // Check if at least one move is selected
    const hasMove = (move1Value && move1Value !== '0') || 
                    (move2Value && move2Value !== '0') || 
                    (move3Value && move3Value !== '0') || 
                    (move4Value && move4Value !== '0');
    const hasLegalMoves = updateMoveLegalityUi().length === 0;
    const hasMysteryGiftLegalPid = hasRequiredMysteryGiftPidFinderSelection();
    const hasLegalRSTrainerId = getRSTrainerIdValidation().valid;
    const hasRequiredParityPid = hasRequiredPidFinderForPidParitySelection();
    const hasRequiredCXDEncounterPid = hasRequiredCXDEncounterPidFinderSelection();
    const hasResolvedOrigin = hasResolvedOriginSelection();
    syncBuilderProgressiveDisclosure(hasResolvedOrigin);

    if (pidFinderBtn && hasMysteryGiftLegalPid) {
      pidFinderBtn.classList.remove('field-error');
    }
    if (pidFinderBtn && hasRequiredParityPid) {
      pidFinderBtn.classList.remove('field-error');
    }
    if (pidFinderBtn && hasRequiredCXDEncounterPid) {
      pidFinderBtn.classList.remove('field-error');
    }
    
    // Enable generate button only if all conditions are met
    const generateBtn = $('#generateBtn');
    if (hasSpecies && hasResolvedOrigin && hasNature && hasMove && hasLegalMoves && hasOTName && hasMysteryGiftLegalPid && hasLegalRSTrainerId && hasRequiredParityPid && hasRequiredCXDEncounterPid) {
      generateBtn.setAttribute('data-disabled', 'false');
    } else {
      generateBtn.setAttribute('data-disabled', 'true');
    }
  }

  _validateForm = validateForm;

  // Expose post-import update callback so module-level import functions
  // (onLoadFromHex, Smogon import) can access boot()-scoped helpers.
  _postImportUpdate = function(speciesId) {
    if (currentEncounterMode === 'imported') {
      updateSpeciesSprite(speciesId);
      updateUnownFormVisibility(speciesId);
      syncPokemonFirstOriginUi(speciesId, { mode: 'imported' });
      updateRibbonLocking();
      validateForm();
      return;
    }
    updateAbilitySelect(speciesId);
    updateSpeciesSprite(speciesId);
    updateUnownFormVisibility(speciesId);
    handleEncounterModeChange(speciesId);
    validateForm();
  };

  /**
   * Check legality of current Pokémon data
   * Returns { legal: boolean, errors: string[], unknown: boolean }
   */
  function checkLegality() {
    const errors = [];
    const speciesId = Number($('#species').value) || 0;
    const natureValue = $('#nature').value;
    const level = Number($('#level').value) || 1;
    const metLevel = Number($('#metLevel').value) || 0;
    const mode = currentEncounterMode;
    
    // Return unknown status if essential fields are not set
    if (!speciesId || !isCurrentOriginSelectionResolved() || natureValue === null || natureValue === undefined || natureValue === '') {
      return {
        legal: false,
        errors: ['Please select a Pokémon, its origin, any required encounter, and a Nature to check legality'],
        unknown: true
      };
    }
    
    // Universal rules
    if (level < 2 || level > 100) {
      errors.push('Level must be between 2 and 100');
    }
    
    // Level must be at or above met level (applies to all modes)
    if (level < metLevel) {
      errors.push('Current level cannot be lower than met level');
    }
    const originLevelFloor = getCurrentLevelFloor();
    if (level < originLevelFloor && mode !== 'imported') {
      errors.push(`Current level must be at least ${originLevelFloor} for this Pokémon to have evolved from the selected origin`);
    }

    if (speciesId === MILOTIC_SPECIES_ID && clampContestByte($('#contestBeauty')?.value) < MILOTIC_MIN_BEAUTY) {
      errors.push(`Milotic must have at least ${MILOTIC_MIN_BEAUTY} Beauty`);
    }

    for (const slotIndex of updateMoveLegalityUi()) {
      errors.push(`Move ${slotIndex + 1} is invalid for this encounter`);
    }

    const rsTrainerIdValidation = getRSTrainerIdValidation();
    if (rsTrainerIdValidation.applies && !rsTrainerIdValidation.valid) {
      errors.push(RS_TRAINER_ID_LEGALITY_MESSAGE);
    }

    const metLocationId = Number($('#metLocation')?.value || 0);
    if (
      mode !== 'imported' &&
      !isMetLocationAllowedForEncounterState(metLocationId, {
        encounterMode: mode,
        speciesId,
        originGame: Number($('#originGame')?.value || 0),
      })
    ) {
      errors.push('Altering Cave (Emerald) is only available for hatched Pokémon or wild Zubat');
    }
    
    if (mode === 'hatched') {
      // Hatched mode rules
      const hatchedMinLevel = getHatchedLevelFloor(speciesId);
      if (level < hatchedMinLevel) {
        const speciesName = SPECIES.find(s => Number(s[0]) === speciesId)?.[1] || 'Pokémon';
        errors.push(`Hatched ${speciesName} must be at least level ${hatchedMinLevel}`);
      }
      
      if (metLevel !== 0) {
        errors.push('Met level must be 0 for hatched Pokémon');
      }
      
      // Hatched Pokémon must be in a Poké Ball (ID 4)
      const ballId = Number($('#ball').value) || 0;
      if (ballId !== 4) {
        errors.push('Hatched Pokémon must be in a Poké Ball');
      }
      
      // Check EVs if level is exactly 5 with base EXP
      if (level === 5) {
        const expTotal = Number($('#expTotal').value) || 0;
        const species = SPECIES.find(s => s[0] === speciesId);
        if (species) {
          const group = EXP_GROUPS[speciesId] ?? GROUP.MEDIUM_FAST;
          const baseExpFor5 = expForLevel(group, 5);
          
          if (expTotal === baseExpFor5) {
            // Check if any individual EV exceeds 100
            const evs = [
              Number($('#evHp').value) || 0,
              Number($('#evAtk').value) || 0,
              Number($('#evDef').value) || 0,
              Number($('#evSpAtk').value) || 0,
              Number($('#evSpDef').value) || 0,
              Number($('#evSpe').value) || 0
            ];
            
            const maxEV = Math.max(...evs);
            if (maxEV > 100) {
              errors.push('No individual EV stat can exceed 100 for level 5 Pokémon with no additional EXP');
            }
          }
        }
      }
      
      // Hatched Pokémon must NOT have fateful encounter checked
      const fatefulCheckbox = $('#fatefulEncounter');
      if (fatefulCheckbox && fatefulCheckbox.checked) {
        errors.push('Fateful encounter cannot be checked for hatched Pokémon');
      }

      const eggCheckbox = $('#isEgg');
      if (eggCheckbox && eggCheckbox.checked && !canSpeciesBeUnhatchedEgg(speciesId)) {
        errors.push('Only base-stage Pokémon and valid incense-baby exceptions can be created as unhatched Eggs');
      }
    } else if (mode === 'cxd_shadow') {
      const encounter = getSelectedCXDEncounter();
      const sourceName = SPECIES.find(entry => Number(entry[0]) === Number(encounter?.species))?.[1] || 'Pokémon';
      if (!encounter || !getCXDEncountersForSpecies(speciesId).includes(encounter)) {
        errors.push('Select a valid Pokémon Colosseum / XD encounter');
      } else {
        const originGame = Number($('#originGame')?.value || 0);
        const currentMetLocation = Number($('#metLocation')?.value || 0);
        const currentBall = Number($('#ball')?.value || 0);
        const currentTid = Number($('#tid')?.value || 0) & 0xFFFF;
        const currentSid = Number($('#sid')?.value || 0) & 0xFFFF;
        const language = Number($('#language')?.value || 0);

        if (originGame !== Number(encounter.originGame ?? 15)) errors.push('Origin game does not match the selected Colosseum / XD encounter');
        if (currentMetLocation !== Number(encounter.location)) errors.push(`${sourceName} must have its fixed Colosseum / XD met location`);
        const encounterLevelMin = Number(encounter.levelMin ?? encounter.level);
        const encounterLevelMax = Number(encounter.levelMax ?? encounter.level);
        if (metLevel < encounterLevelMin || metLevel > encounterLevelMax) {
          errors.push(`${sourceName} must be received from level ${encounterLevelMin} to ${encounterLevelMax}`);
        }
        if (encounter.ball !== null && encounter.ball !== undefined && currentBall !== Number(encounter.ball)) errors.push(`${sourceName} must use its fixed encounter Ball`);
        if (Boolean($('#fatefulEncounter')?.checked) !== Boolean(encounter.fateful)) errors.push('Fateful Encounter does not match the selected Colosseum / XD encounter');
        if (encounter.tid !== undefined && currentTid !== Number(encounter.tid)) errors.push(`${sourceName} must use TID ${encounter.tid}`);
        if (encounter.fixedSID !== undefined && currentSid !== Number(encounter.fixedSID)) errors.push(`${sourceName} must use SID ${encounter.fixedSID}`);
        if (encounter.fixedOtGender && $('#otGender')?.value !== encounter.fixedOtGender) errors.push('OT gender does not match the selected Colosseum / XD gift');
        if (encounter.fixedNature !== undefined && Number($('#nature')?.value) !== Number(encounter.fixedNature)) errors.push(`${sourceName} has a fixed nature for this encounter`);
        if (encounter.fixedGender && $('#gender')?.value !== encounter.fixedGender) errors.push(`${sourceName} has a fixed gender for this encounter`);
        if (encounter.fixedAbility !== undefined && Number($('#ability')?.value) !== Number(encounter.fixedAbility)) errors.push(`${sourceName} has a fixed ability slot for this encounter`);
        if (Array.isArray(encounter.allowedLanguages) && !encounter.allowedLanguages.map(Number).includes(language)) errors.push('Language is not available for the selected Colosseum / XD encounter');

        if (encounter.fixedIVs) {
          const currentIVs = {
            hp: Number($('#ivHp')?.value || 0), atk: Number($('#ivAtk')?.value || 0),
            def: Number($('#ivDef')?.value || 0), spa: Number($('#ivSpAtk')?.value || 0),
            spd: Number($('#ivSpDef')?.value || 0), spe: Number($('#ivSpe')?.value || 0),
          };
          if (Object.entries(encounter.fixedIVs).some(([stat, value]) => currentIVs[stat] !== Number(value))) {
            errors.push(`${sourceName} must use its fixed encounter IVs`);
          }
        }

        const pid = parsePidInput($('#pid')?.value || '0');
        const shinyXor = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (currentTid ^ currentSid);
        if (encounter.shinyLocked && shinyXor < 8) errors.push(`${sourceName} cannot be shiny in this encounter`);
        if (!pidFinderResultActive && !manualOverrideActive) errors.push('Select a legal result with Find Legal Encounter before generating this Colosseum / XD Pokémon');
        if (pidFinderResultActive && (currentTid !== pidFinderOriginalTid || currentSid !== pidFinderOriginalSid)) {
          errors.push('The trainer IDs changed after CXD result selection; select a new CXD result');
        }
      }
    } else if (mode === 'cxd_trade') {
      const trade = getSelectedCXDTrade();
      const tradeName = SPECIES.find(entry => Number(entry[0]) === speciesId)?.[1] || 'Pokémon';
      if (!trade || !getXDTradesForSpecies(speciesId).includes(trade)) {
        errors.push('Select a valid in-game trade');
      } else {
        const originGame = Number($('#originGame')?.value || 0);
        const currentMetLocation = Number($('#metLocation')?.value || 0);
        const currentBall = Number($('#ball')?.value || 0);
        const currentTid = Number($('#tid')?.value || 0) & 0xFFFF;
        const currentSid = Number($('#sid')?.value || 0) & 0xFFFF;
        const currentMoves = [1, 2, 3, 4].map(slot => Number($(`#move${slot}`)?.value || 0));
        const expectedNickname = getCXDTradeLocalizedText(trade, 'nicknameByLanguage', Number($('#language')?.value || 2));
        const expectedOtName = getCXDTradeLocalizedText(trade, 'otNames', Number($('#language')?.value || 2));
        const expectedOtGender = Number(trade.otGender) === 1 ? 'female' : 'male';

        if (originGame !== trade.originGame) errors.push('Origin game does not match the selected in-game trade');
        if (currentMetLocation !== trade.location) errors.push(`${tradeName} must have its fixed in-game trade met location`);
        if (metLevel !== trade.level) errors.push(`${tradeName} must be received at level ${trade.level}`);
        if (currentBall !== trade.ball) errors.push(`${tradeName} must be in a Poké Ball`);
        if (currentTid !== trade.tid) errors.push(`${tradeName} must use TID ${trade.tid}`);
        if (trade.fixedSID !== undefined && currentSid !== Number(trade.fixedSID)) errors.push(`${tradeName} must use SID ${trade.fixedSID}`);
        if (Boolean($('#fatefulEncounter')?.checked) !== Boolean(trade.fateful)) errors.push('Fateful Encounter does not match the selected trade');
        if ($('#otGender')?.value !== expectedOtGender) errors.push('OT gender does not match the selected trade');
        if (expectedOtName && $('#otName')?.value !== expectedOtName) errors.push('OT name does not match the selected language');
        if (trade.nicknameLocked && expectedNickname && $('#nickname')?.value !== expectedNickname) errors.push('Nickname does not match the selected language');
        if (currentMoves.some((move, index) => move !== Number(trade.moves[index] || 0))) errors.push('Moves do not match the selected trade preset');

        const pid = parsePidInput($('#pid')?.value || '0');
        if (isCXDGeneratedTrade(trade)) {
          if (!pidFinderResultActive && !manualOverrideActive) {
            errors.push('Select a CXD result with Find Legal Encounter before generating this trade');
          }
          if (pidFinderResultActive && (currentTid !== pidFinderOriginalTid || currentSid !== pidFinderOriginalSid)) {
            errors.push('The trade trainer IDs changed after CXD result selection; select a new CXD result');
          }
        } else {
          const currentIVs = {
            hp: Number($('#ivHp')?.value || 0), atk: Number($('#ivAtk')?.value || 0),
            def: Number($('#ivDef')?.value || 0), spa: Number($('#ivSpAtk')?.value || 0),
            spd: Number($('#ivSpDef')?.value || 0), spe: Number($('#ivSpe')?.value || 0),
          };
          if ((pid >>> 0) !== (trade.fixedPID >>> 0)) errors.push(`${tradeName} must use its fixed in-game trade PID`);
          if (Object.entries(trade.fixedIVs).some(([stat, value]) => currentIVs[stat] !== Number(value))) errors.push(`${tradeName} must use its fixed in-game trade IVs`);
          if (Number($('#nature')?.value) !== Number(trade.fixedNature)) errors.push(`${tradeName} must use its fixed nature`);
          if ($('#gender')?.value !== trade.fixedGender) errors.push(`${tradeName} must use its fixed gender`);
          if (Number($('#ability')?.value) !== Number(trade.fixedAbility)) errors.push(`${tradeName} must use its fixed ability slot`);
        }
        if (trade.shinyLocked && ((((pid >>> 16) ^ (pid & 0xFFFF)) ^ (currentTid ^ currentSid)) < 8)) {
          errors.push('This in-game trade Pokémon cannot be shiny');
        }
      }
    } else if (
      mode === 'static' &&
      getSelectedStaticEncounter() &&
      STATIC_ENCOUNTERS[Number(getSelectedStaticEncounter().species)]
    ) {
      // Legendary mode rules
      const detailedStaticEncounter = getSelectedStaticEncounter();
      const originSpeciesId = Number(detailedStaticEncounter.species);
      const encounter = STATIC_ENCOUNTERS[originSpeciesId];
      const originGame = Number($('#originGame')?.value || 0);
      const allowedOriginGames = getStaticAllowedOriginGames(speciesId);
      const hasInvalidStaticOrigin = allowedOriginGames.length && !allowedOriginGames.includes(originGame);
      if (hasInvalidStaticOrigin) {
        errors.push('Selected Origin Game is not available for this static encounter');
      }
      
      // Check if the PID matches a known preset
      const currentPID = parsePidInput($('#pid').value);
      let expectedPID = null;
      let isKnownPID = false;
      
      if (encounter.fixedEvent && encounter.fixedPID !== undefined) {
        // Fixed event Pokémon have predetermined PID
        expectedPID = encounter.fixedPID;
        isKnownPID = (currentPID === expectedPID);
      } else {
        // Non-fixed legendaries use preset PIDs based on nature
        const natureIndex = Number($('#nature').value || 0);
        const presetOriginGame = originGame || encounter.defaultOriginGame || 2;
        const preset = getLegendaryPreset(natureIndex, presetOriginGame);
        if (preset && preset.pid !== undefined) {
          expectedPID = preset.pid;
          isKnownPID = (currentPID === expectedPID);
        }
      }
      
      // If PID doesn't match any known preset, return unknown status
      if (!isKnownPID) {
        if (hasInvalidStaticOrigin) {
          return {
            legal: false,
            errors,
            unknown: false
          };
        }
        return {
          legal: false,
          errors: ['Legality check does not yet support custom PIDs for the legendary mode'],
          unknown: true
        };
      }
      
      // Check met level
      const expectedStaticMetLevel = Number(detailedStaticEncounter.level ?? encounter.defaultMetLevel);
      if (Number.isFinite(expectedStaticMetLevel) && metLevel !== expectedStaticMetLevel) {
        errors.push(`Met level must be ${expectedStaticMetLevel} for this static encounter`);
      }
      
      // Check EVs if level equals met level with base EXP (same logic as hatched mode)
      if (level === metLevel && metLevel > 0) {
        const expTotal = Number($('#expTotal').value) || 0;
        const species = SPECIES.find(s => s[0] === speciesId);
        if (species) {
          const group = EXP_GROUPS[speciesId] ?? GROUP.MEDIUM_FAST;
          const baseExpForLevel = expForLevel(group, level);
          
          if (expTotal === baseExpForLevel) {
            // Check if any individual EV exceeds 100
            const evs = [
              Number($('#evHp').value) || 0,
              Number($('#evAtk').value) || 0,
              Number($('#evDef').value) || 0,
              Number($('#evSpAtk').value) || 0,
              Number($('#evSpDef').value) || 0,
              Number($('#evSpe').value) || 0
            ];
            
            const maxEV = Math.max(...evs);
            if (maxEV > 100) {
              errors.push(`No individual EV stat can exceed 100 for this Pokémon without increasing the EXP`);
            }
          }
        }
      }
      
      // Get expected IVs based on whether it's a fixed event or uses preset
      let expectedIVs = null;
      
      if (encounter.fixedEvent && encounter.fixedIVs) {
        // Fixed event Pokémon have predetermined IVs
        expectedIVs = encounter.fixedIVs;
      } else {
        // Non-fixed legendaries use preset IVs based on nature
        const natureIndex = Number($('#nature').value || 0);
        const originGame = Number($('#originGame')?.value || encounter.defaultOriginGame || 2);
        const preset = getLegendaryPreset(natureIndex, originGame);
        if (preset && preset.ivs) {
          expectedIVs = preset.ivs;
        }
      }
      
      // Check if IVs match the expected values
      if (expectedIVs) {
        const currentIVs = {
          hp: Number($('#ivHp').value) || 0,
          atk: Number($('#ivAtk').value) || 0,
          def: Number($('#ivDef').value) || 0,
          spa: Number($('#ivSpAtk').value) || 0,
          spd: Number($('#ivSpDef').value) || 0,
          spe: Number($('#ivSpe').value) || 0
        };
        
        if (currentIVs.hp !== expectedIVs.hp ||
            currentIVs.atk !== expectedIVs.atk ||
            currentIVs.def !== expectedIVs.def ||
            currentIVs.spa !== expectedIVs.spa ||
            currentIVs.spd !== expectedIVs.spd ||
            currentIVs.spe !== expectedIVs.spe) {
          errors.push(`IVs must be ${expectedIVs.hp}/${expectedIVs.atk}/${expectedIVs.def}/${expectedIVs.spa}/${expectedIVs.spd}/${expectedIVs.spe} (HP/Atk/Def/SpA/SpD/Spe) for this PID`);
        }
      }
      
      // Check if met location was changed (if it has a default)
      if (encounter.defaultMetLocationId) {
        const currentMetLocation = Number($('#metLocation').value);
        if (currentMetLocation !== encounter.defaultMetLocationId) {
          errors.push('Met location cannot be changed for this legendary');
        }
      }
      
      // Check origin game legality (complex rules for different legendaries)
      const currentOriginGame = Number($('#originGame').value);
      const currentMetLocation = Number($('#metLocation').value);
      
      // Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen, 15=Colosseum/XD
      
      // Mewtwo (150)
      if (speciesId === 150) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![4, 5].includes(currentOriginGame)) {
          errors.push('This legendary must have FireRed or LeafGreen as its origin game');
        }
      }
      // Legendary birds: Articuno (144), Zapdos (145), Moltres (146)
      else if ([144, 145, 146].includes(speciesId)) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![4, 5].includes(currentOriginGame)) {
          errors.push('This legendary must have FireRed, LeafGreen, or Colosseum/XD as its origin game');
        }
      }
      // Mew (151)
      else if (speciesId === 151) {
        if (currentOriginGame !== 3) {
          errors.push('Mew must have Emerald as origin game');
        }
      }
      // Jirachi (409) and Celebi (251)
      else if ([409, 251].includes(speciesId)) {
        if (![1, 2].includes(currentOriginGame)) {
          errors.push('Jirachi and Celebi must have Ruby or Sapphire as origin game');
        }
      }
      // Regis: Regirock (401), Regice (402), Registeel (403)
      else if (isRegiSpeciesId(speciesId)) {
        if (![1, 2, 3].includes(currentOriginGame)) {
          errors.push('Regi legendaries must have Emerald, Ruby, or Sapphire as origin game');
        }
      }
      // Lugia (249) and Ho-Oh (250)
      else if ([249, 250].includes(speciesId)) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![3, 4, 5].includes(currentOriginGame)) {
          errors.push('Lugia and Ho-Oh must have Emerald, FireRed, or LeafGreen as origin game');
        }
      }
      // Latios (408) and Latias (407)
      else if ([407, 408].includes(speciesId)) {
        if (currentEncounterMode === 'roamer') {
          // Roamer mode: validate species↔game pairing
          const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
          if (!allowedGames.includes(currentOriginGame)) {
            const gameName = speciesId === 408 ? 'Ruby or Emerald' : 'Sapphire or Emerald';
            errors.push(`${speciesId === 408 ? 'Latios' : 'Latias'} roamer must have ${gameName} as origin game`);
          }
        } else {
          // Static/event mode: Southern Island encounters require RSE
          if (![1, 2, 3].includes(currentOriginGame)) {
            errors.push('Latios and Latias must have Ruby, Sapphire, or Emerald as origin game');
          }
        }
      }
      // Kyogre (404)
      else if (speciesId === 404) {
        if (![1, 3].includes(currentOriginGame)) {
          errors.push('Kyogre must have Emerald or Sapphire as origin game');
        } else if (currentOriginGame === 1) {
          // Sapphire specific rules
          if (currentMetLocation !== 72) {
            errors.push('Kyogre from Sapphire must be caught at Cave of Origin');
          }
          if (metLevel !== 45) {
            errors.push('Kyogre from Sapphire must have met level 45');
          }
        }
      }
      // Groudon (405)
      else if (speciesId === 405) {
        if (![2, 3].includes(currentOriginGame)) {
          errors.push('Groudon must have Emerald or Ruby as origin game');
        } else if (currentOriginGame === 2) {
          // Ruby specific rules
          if (currentMetLocation !== 72) {
            errors.push('Groudon from Ruby must be caught at Cave of Origin');
          }
          if (metLevel !== 45) {
            errors.push('Groudon from Ruby must have met level 45');
          }
        }
      }
      // For other legendaries, check against default origin game
      else if (encounter.defaultOriginGame !== undefined) {
        const exactGames = Array.isArray(detailedStaticEncounter.games)
          ? detailedStaticEncounter.games.map(Number)
          : [Number(encounter.defaultOriginGame)];
        if (!exactGames.includes(currentOriginGame)) {
          errors.push('Origin game cannot be changed for this legendary Pokémon');
        }
      }
      
      // Check fateful encounter requirement for specific legendaries
      // Mew (151), Lugia (249), Ho-Oh (250), Deoxys (410), Latios (408), Latias (407)
      // Roamers do NOT have fateful encounter
      const fatefulEncounterRequired = [151, 249, 250, 410, 408, 407];
      const fatefulCheckbox = $('#fatefulEncounter');
      
      if (currentEncounterMode === 'roamer') {
        // Roamers must NOT have fateful encounter
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Roaming legendaries do not have the fateful encounter flag');
        }
      } else if (fatefulEncounterRequired.includes(speciesId)) {
        // These Pokémon MUST have fateful encounter checked
        if (fatefulCheckbox && !fatefulCheckbox.checked) {
          errors.push('Fateful encounter must be checked for this legendary Pokémon');
        }
      } else {
        // All other Pokémon must NOT have fateful encounter checked
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Fateful encounter cannot be checked for this Pokémon');
        }
      }
      
      // Check ball legality for legendary mode
      const ballId = Number($('#ball').value) || 0;
      const legendLocId = Number($('#metLocation')?.value) || 0;
      if (ballId === 5 && !SAFARI_ZONE_IDS.includes(legendLocId)) {
        errors.push('Legendary Pokémon cannot be caught in a Safari Ball');
      }
      
    } else if (mode === 'roamer') {
      // ── Roamer legality checks ─────────────────────────────────
      if (!ROAMER_SPECIES_SET.has(speciesId)) {
        errors.push('This species is not a roaming legendary');
      } else {
        const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
        const currentOriginGame = Number($('#originGame').value) || 0;
        if (!allowedGames.includes(currentOriginGame)) {
          errors.push('Selected origin game is not valid for this roaming species');
        }
        // Met level must match roamer's fixed level
        const roamerLevel = ROAMER_SPECIES[speciesId]?.level || 0;
        if (metLevel !== roamerLevel) {
          errors.push(`Roamer met level must be ${roamerLevel}`);
        }
        // Check met location
        const expectedLoc = getRoamerMetLocation(speciesId);
        const currentMetLocation = Number($('#metLocation').value) || 0;
        if (currentMetLocation !== expectedLoc) {
          errors.push('Met location does not match this roaming species');
        }
        // Fateful encounter must be off for roamers
        const fatefulCheckbox = $('#fatefulEncounter');
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Roaming legendaries do not have the fateful encounter flag');
        }
        // IV truncation check: non-Emerald roamers must have truncated IVs
        if (roamerHasTruncatedIVs(speciesId, currentOriginGame)) {
          const atkIV = Number($('#ivAtk').value) || 0;
          const defIV = Number($('#ivDef').value) || 0;
          const speIV = Number($('#ivSpe').value) || 0;
          const spaIV = Number($('#ivSpAtk').value) || 0;
          const spdIV = Number($('#ivSpDef').value) || 0;
          if (atkIV > 7) errors.push('Non-Emerald roamer ATK IV cannot exceed 7');
          if (defIV !== 0) errors.push('Non-Emerald roamer DEF IV must be 0');
          if (speIV !== 0) errors.push('Non-Emerald roamer Speed IV must be 0');
          if (spaIV !== 0) errors.push('Non-Emerald roamer SpAtk IV must be 0');
          if (spdIV !== 0) errors.push('Non-Emerald roamer SpDef IV must be 0');
        }
      }
    } else if (mode === 'mystery') {
      const { tag, event } = getSelectedMysteryEvent();
      if (isPcnyWishEggsMysteryTag(tag)) {
        const originGame = Number($('#originGame')?.value) || 0;
        if (!PCNY_WISH_EGGS_ALLOWED_ORIGIN_GAMES.includes(originGame)) {
          errors.push('PCNY Wish Eggs must have FireRed or LeafGreen as origin game');
        }

        if (metLevel !== 0) {
          errors.push('PCNY Wish Eggs must have met level 0');
        }

        const fatefulCheckbox = $('#fatefulEncounter');
        if (fatefulCheckbox && !fatefulCheckbox.checked) {
          errors.push('Fateful encounter must be checked for PCNY Wish Eggs');
        }

        const metLocationId = Number($('#metLocation')?.value) || 0;
        const validLocationIds = new Set(getPcnyWishEggsHatchLocationsForGame(originGame).map(([id]) => Number(id)));
        if (!validLocationIds.has(metLocationId)) {
          errors.push('Met location must be a FireRed/LeafGreen hatch location for PCNY Wish Eggs');
        }
        const locName = String((LOCATIONS.find(([id]) => Number(id) === metLocationId)?.[1]) || '');
        if (metLocationId === 255 || locName.toLowerCase().includes('fateful')) {
          errors.push('Met location cannot be a Fateful Encounter entry for PCNY Wish Eggs');
        }

        const languageId = Number($('#language')?.value) || 0;
        if (languageId !== 2) {
          errors.push('PCNY Wish Eggs must use English language setting');
        }

        const itemId = Number($('#item')?.value) || 0;
        if (itemId !== 0) {
          errors.push('PCNY Wish Eggs should not have a held item');
        }

        const ballId = Number($('#ball')?.value) || 0;
        if (ballId !== 4) {
          errors.push('PCNY Wish Eggs must be in a Poké Ball');
        }

        const eggCheckbox = $('#isEgg');
        if (eggCheckbox && eggCheckbox.checked) {
          errors.push('PCNY Wish Eggs output should be hatched (Egg flag off)');
        }
      } else if (isMystryMewMysteryTag(tag)) {
        const originGame = Number($('#originGame')?.value) || 0;
        if (originGame !== 2) {
          errors.push('MYSTRY Mew must have Ruby as origin game');
        }

        if (metLevel !== 10) {
          errors.push('MYSTRY Mew must have met level 10');
        }

        const fatefulCheckbox = $('#fatefulEncounter');
        if (fatefulCheckbox && !fatefulCheckbox.checked) {
          errors.push('Fateful encounter must be checked for MYSTRY Mew');
        }

        const metLocationId = Number($('#metLocation')?.value) || 0;
        const locName = String((LOCATIONS.find(([id]) => Number(id) === metLocationId)?.[1]) || '');
        if (metLocationId !== 255 && !locName.toLowerCase().includes('fateful')) {
          errors.push('Met location must be Fateful Encounter for MYSTRY Mew');
        }

        const languageId = Number($('#language')?.value) || 0;
        if (languageId !== 2) {
          errors.push('MYSTRY Mew must use English language setting');
        }

        const tid = Number($('#tid')?.value) || 0;
        const sid = Number($('#sid')?.value) || 0;
        if (tid !== 6930 || sid !== 0) {
          errors.push('MYSTRY Mew must have TID 06930 and SID 00000');
        }

        const otName = String($('#otName')?.value || '').trim().toUpperCase();
        if (otName !== 'MYSTRY') {
          errors.push('MYSTRY Mew must have OT name MYSTRY');
        }

        const itemId = Number($('#item')?.value) || 0;
        if (itemId !== 0) {
          errors.push('MYSTRY Mew should not have a held item');
        }

        const ballId = Number($('#ball')?.value) || 0;
        if (ballId !== 4) {
          errors.push('MYSTRY Mew must be in a Poké Ball');
        }

        const shinyCheckbox = $('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          errors.push('MYSTRY Mew cannot be shiny');
        }

        const pid = parsePidInput($('#pid')?.value || '0');
        const pidHigh = (pid >>> 16) & 0xFFFF;
        const pidLow = pid & 0xFFFF;
        const xor = (pidHigh ^ pidLow) ^ (6930 ^ 0);
        if (xor < 8) {
          errors.push('Selected PID is shiny for MYSTRY Mew and is illegal');
        }
      } else if (isBoxEventMysteryTag(tag)) {
        if (metLevel !== 0) {
          errors.push('BOX Event must have met level 0');
        }

        const fatefulCheckbox = $('#fatefulEncounter');
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('BOX Event must keep the Fateful Encounter checkbox unchecked');
        }

        const isEgg = Boolean($('#isEgg')?.checked);
        const metLocationId = Number($('#metLocation')?.value) || 0;
        const expectedLocationId = isEgg
          ? getFatefulLocationIdForGame(Number($('#originGame')?.value) || 0)
          : getBoxEventDefaultMetLocationIdForGame(Number($('#originGame')?.value) || 0);
        if (expectedLocationId !== null && metLocationId !== expectedLocationId) {
          const expectedName = String((LOCATIONS.find(([id]) => Number(id) === expectedLocationId)?.[1]) || expectedLocationId);
          errors.push(`BOX Event must use ${expectedName} as met location`);
        }

        if (isEgg) {
          const otName = String($('#otName')?.value || '').trim().toUpperCase();
          if (otName !== 'AZUZA') {
            errors.push('BOX Event eggs must have OT name AZUZA');
          }
        }
      } else if (event) {
        const originGame = Number($('#originGame')?.value || 0);
        const language = Number($('#language')?.value || 0);
        const ball = Number($('#ball')?.value || 0);
        const tid = Number($('#tid')?.value || 0) & 0xFFFF;
        const sid = Number($('#sid')?.value || 0) & 0xFFFF;
        const hatcherOwned = Boolean(event.usesHatcherTrainerData);

        if (Array.isArray(event.allowedOriginGames) && !event.allowedOriginGames.map(Number).includes(originGame)) {
          errors.push('Origin game is not available for the selected Mystery Gift');
        }
        if (Array.isArray(event.allowedLanguages) && !event.allowedLanguages.map(Number).includes(language)) {
          errors.push('Language is not available for the selected Mystery Gift');
        }
        if (event.defaultMetLevel !== undefined && metLevel !== Number(event.defaultMetLevel)) {
          errors.push(`The selected Mystery Gift must have met level ${event.defaultMetLevel}`);
        }
        if (!hatcherOwned && event.defaultMetLocationId !== undefined && Number($('#metLocation')?.value || 0) !== Number(event.defaultMetLocationId)) {
          errors.push('Met location does not match the selected Mystery Gift');
        }
        if (hatcherOwned) {
          const locationName = String(LOCATIONS.find(([id]) => Number(id) === Number($('#metLocation')?.value || 0))?.[1] || '');
          if (locationName.toLowerCase().includes('fateful')) errors.push('Hatched Mystery Gifts must use a normal hatch location');
          if ($('#isEgg')?.checked) errors.push('This Mystery Gift preset represents the hatched Pokémon, not an unhatched Egg');
        }
        if (!hatcherOwned && event.fixedTID !== undefined && tid !== Number(event.fixedTID)) errors.push(`The selected Mystery Gift must use TID ${event.fixedTID}`);
        if (Array.isArray(event.tidRange)) {
          const [minimumTid, maximumTid] = event.tidRange.map(Number);
          if (tid < minimumTid || tid > maximumTid) errors.push(`The selected Mystery Gift TID must be between ${minimumTid} and ${maximumTid}`);
        }
        if (!hatcherOwned && event.fixedSID !== undefined && sid !== Number(event.fixedSID)) errors.push(`The selected Mystery Gift must use SID ${event.fixedSID}`);
        if (Array.isArray(event.allowedOtNames) && !event.allowedOtNames.includes(String($('#otName')?.value || ''))) {
          errors.push('OT name is not available for the selected Mystery Gift campaign');
        }
        if (event.defaultBallId !== undefined && ball !== Number(event.defaultBallId)) {
          errors.push('Ball does not match the selected Mystery Gift');
        } else if (event.defaultBall && String(event.defaultBall).toLowerCase().includes('poke') && ball !== 4) {
          errors.push('The selected Mystery Gift must be in a Poké Ball');
        }
        if (event.defaultNoItem && Number($('#item')?.value || 0) !== 0) errors.push('The selected Mystery Gift should not hold an item');
        if (event.fixedOTName !== undefined && String($('#otName')?.value || '') !== String(event.fixedOTName)) {
          errors.push('OT name does not match the selected Mystery Gift');
        }
        if (event.nicknameLocked && event.nickname !== undefined && String($('#nickname')?.value || '') !== String(event.nickname)) {
          errors.push('Nickname does not match the selected Mystery Gift');
        }
        if (event.fixedPID !== undefined) {
          const pid = parsePidInput($('#pid')?.value || '0');
          if ((pid >>> 0) !== (Number(event.fixedPID) >>> 0)) errors.push('PID does not match the preserved Mystery Gift specimen');
          if (event.fixedNature !== undefined && Number($('#nature')?.value) !== Number(event.fixedNature)) errors.push('Nature does not match the preserved Mystery Gift specimen');
          if (event.fixedGender !== undefined && String($('#gender')?.value) !== String(event.fixedGender)) errors.push('Gender does not match the preserved Mystery Gift specimen');
          if (event.fixedAbility !== undefined && Number($('#ability')?.value) !== Number(event.fixedAbility)) errors.push('Ability slot does not match the preserved Mystery Gift specimen');
        }
        if (event.fixedIVs) {
          const currentIVs = {
            hp: Number($('#ivHp')?.value || 0), atk: Number($('#ivAtk')?.value || 0),
            def: Number($('#ivDef')?.value || 0), spe: Number($('#ivSpe')?.value || 0),
            spa: Number($('#ivSpAtk')?.value || 0), spd: Number($('#ivSpDef')?.value || 0),
          };
          if (Object.entries(event.fixedIVs).some(([stat, value]) => currentIVs[stat] !== Number(value))) {
            errors.push('IVs do not match the preserved Mystery Gift specimen');
          }
        }

        const expectedFateful = event.fatefulInFRLGOnly
          ? [4, 5].includes(originGame)
          : Boolean(event.defaultFatefulEncounter);
        if (Boolean($('#fatefulEncounter')?.checked) !== expectedFateful) errors.push('Fateful Encounter does not match the selected Mystery Gift');
        if (event.alwaysShiny && !$('#shiny')?.checked) errors.push('The selected Mystery Gift must be shiny');
        if (event.shinyLocked && $('#shiny')?.checked) errors.push('The selected Mystery Gift cannot be shiny');
      }
    }

    errors.push(...validateGen3RibbonSelection(
      readCurrentRibbonSelection(),
      getCurrentRibbonLegality(),
    ));
    
    return {
      legal: errors.length === 0,
      errors: errors,
      unknown: false
    };
  }

  /**
   * Update legality status display
   */
  function updateLegalityStatus() {
    // Legality-sensitive presets often update met level and encounter data
    // programmatically without firing DOM change events. Re-apply ribbon
    // policy here so every legality refresh first clears and locks ribbons
    // against the final encounter state.
    try { updateRibbonLocking(); } catch (e) {}
    try { updateRSTidSidWarning(); } catch (e) {}
    const result = checkLegality();
    // If a mystery preset is active and the user modified fields since the
    // preset was applied (except nickname), present 'unknown' (grey) status
    // to indicate the preset may no longer match exactly.
    try {
      if (currentEncounterMode === 'mystery' && mysteryPresetAppliedFor && mysteryUserModifiedSincePreset) {
        result.unknown = true;
        // Prefer an explanatory message if none present
        if (!result.errors || !result.errors.length) result.errors = ['User-modified since mystery preset'];
      }
    } catch (e) {}
    // Global explanatory message for unknown/grey legality state
    const unknownLegalityMessage = "Unable to check legality with the current changes. Please export the pokemon to a pk3 or ek3 file below and open it in PkHex to confirm legality.";
    const statusEl = $('#legalityStatus');
    const iconEl = $('#legalityIcon');
    const textEl = $('#legalityText');
    
    if (result.unknown) {
      // Unknown/unsupported - show grey and display global explanatory message
      statusEl.className = 'unknown';
      iconEl.textContent = '?';
      iconEl.style.color = '#9ca3af';
      textEl.textContent = 'Legal?';
      textEl.style.color = '#9ca3af';
      statusEl.title = unknownLegalityMessage;
    } else if (result.legal) {
      statusEl.className = 'legal';
      iconEl.textContent = 'âœ“';
      iconEl.style.color = '#22c55e';
      textEl.textContent = 'Legal';
      textEl.style.color = '#22c55e';
      statusEl.title = 'This Pokémon passes all legality checks';
    } else {
      statusEl.className = 'illegal';
      iconEl.textContent = 'âœ—';
      iconEl.style.color = '#ef4444';
      textEl.textContent = 'Illegal';
      textEl.style.color = '#ef4444';
      statusEl.title = result.errors.join('\n');
    }
  }

  // Click handler to show legality errors
  $('#legalityStatus').addEventListener('click', () => {
    const result = checkLegality();
    const statusEl = $('#legalityStatus');
    const unknownMsg = "Unable to check legality with the current changes. Please export the pokemon to a pk3 or ek3 file below and open it in PkHex to confirm legality.";
    // If the UI currently shows 'unknown' (grey), present the global explanatory message
    if (statusEl && statusEl.className === 'unknown') {
      alert('Legality Unknown:\n\n' + unknownMsg);
      return;
    }
    if (result.unknown) {
      alert('Legality Unknown:\n\n• ' + result.errors.join('\n• '));
    } else if (!result.legal) {
      alert('Legality Issues:\n\n• ' + result.errors.join('\n• '));
    } else {
      alert('This Pokémon should be legal and transferrable to Pokémon Home.\n\nTo make sure, export the .ek3 file and load it up in PKHeX for validation.');
    }
  });

  // Create autocomplete fields for searchable dropdowns
  const earlySpeciesState = window.__aceEarlySpeciesState || {};
  const startupSpeciesControl = $('#species');
  const startupSpeciesInput = startupSpeciesControl?.querySelector?.('.autocomplete-input');
  const startupSpeciesId = String(
    startupSpeciesControl?.value
      || startupSpeciesControl?.dataset?.earlySelectedId
      || earlySpeciesState.selectedId
      || ''
  );
  const startupSpeciesQuery = String(startupSpeciesInput?.value || earlySpeciesState.query || '');
  const startupSpeciesHadFocus = document.activeElement === startupSpeciesInput;
  speciesAutocomplete = createAutocomplete($('#species'), getSupportedSpecies(), {
    blurOnSelect: true,
    onSelect: (item) => {
      const speciesId = Number(item.id);
      const importedMode = currentEncounterMode === 'imported';
      const originTransition = prepareOriginForSpeciesChange(speciesId, importedMode);
      // Keep imported nickname bytes authoritative unless user edits nickname directly.
      if (!importedMode) {
        const species = SPECIES.find(s => s[0] === speciesId);
        if (species) {
          const currentTag = document.getElementById('mysteryEvent')?.value || '';
          const normalizedTag = String(currentTag).toUpperCase();
          if (speciesId === 151 && currentEncounterMode === 'mystery' && normalizedTag === 'AURA_MEW') {
            setTrackedNickname('MEW', NICKNAME_SOURCE.PRESET, speciesId);
            $('#otName').value = 'Aura';
            const allowed = new Set(['2', '3', '4', '5', '7']);
            const langSel = $('#language');
            if (langSel && !allowed.has(String(langSel.value))) {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            }
            const fatefulCheckbox = $('#fatefulEncounter');
            if (fatefulCheckbox) fatefulCheckbox.checked = true;
          } else if (speciesId === 151 && currentEncounterMode === 'mystery' && normalizedTag === 'MYSTRY_MEW') {
            setTrackedNickname('MEW', NICKNAME_SOURCE.PRESET, speciesId);
            $('#otName').value = 'MYSTRY';
            $('#language').value = '2';
            const fatefulCheckbox = $('#fatefulEncounter');
            if (fatefulCheckbox) fatefulCheckbox.checked = true;
          } else if (speciesId === 251 && currentEncounterMode === 'mystery') {
            const currentEvent = MYSTERY_EVENTS?.[currentTag] || null;
            if (currentEvent?.nickname) {
              setTrackedNickname(currentEvent.nickname, NICKNAME_SOURCE.PRESET, speciesId);
              $('#language').value = String(currentEvent.defaultLanguage ?? 1);
            } else if (normalizedTag === 'JOURNEY_ACROSS_AMERICA') {
              setTrackedNickname('CELEBI', NICKNAME_SOURCE.PRESET, speciesId);
              $('#language').value = '2';
            } else {
              setLocalizedSpeciesNickname(speciesId, Number($('#language')?.value || 2), { force: true });
            }
          } else {
            setLocalizedSpeciesNickname(speciesId, Number($('#language')?.value || 2), { force: true });
          }
        }
        // Update ability select based on species
        updateAbilitySelect(speciesId);
      }
      // Update species sprite
      updateSpeciesSprite(speciesId);
      // Show/hide Unown form dropdown
      updateUnownFormVisibility(speciesId);
      // Uncheck shiny since species changed (gender ratios may differ)
      if (!importedMode) {
        clearMakeShinyUndoState();
        const shinyCheckbox = document.querySelector('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          shinyCheckbox.checked = false;
          checkShiny();
        }
      }
      // Reset PID Finder locks when species changes (result is no longer valid)
      if (!importedMode && hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });
      // Always update gender dropdown for selected species
      if (!importedMode && currentEncounterMode) {
        const previousSuppressPresetApply = suppressPresetApply;
        if (!originTransition.applyAutomaticPreset) suppressPresetApply = true;
        try {
          handleEncounterModeChange(speciesId);
        } finally {
          suppressPresetApply = previousSuppressPresetApply;
        }
      }
      if (!importedMode && currentEncounterMode === 'static') {
        try { updateTidSidLocking(); } catch (e) {}
        try { updateMetLevelLocking(); } catch (e) {}
        try {
          const changed = clampCurrentLevelToMinimum();
          if (changed) computeAndSetExpFromLevel();
        } catch (e) {}
        try { updateBallLocking(); } catch (e) {}
      }

      // Update move dropdowns to only show moves this species can learn.
      // In mystery mode, preserve already-set moves (may be special event moves).
      updateMovesForSpecies(speciesId, {
        preserveValue: currentEncounterMode === 'mystery' || importedMode || currentEncounterMode === 'cxd_shadow' || currentEncounterMode === 'cxd_trade'
      });
      try { updateIsEggVisibility(); } catch (e) {}

      // If we're in Mystery Gifts mode and an event is selected, apply any
      // per-species mystery preset (TID/SID/OT/PID/IVs) so the basics/stats
      // reflect the event immediately and are not overridden by other logic.
      if (!importedMode && !pidFinderResultActive && currentEncounterMode === 'mystery') {
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag) applyMysteryPresetForSpecies(speciesId);
      }
      syncPokemonFirstOriginUi(speciesId, {
        mode: currentEncounterMode,
        preserveCurrent: true,
        preserveExact: false,
      });
      try { updateContestSheenAuto({ markImportedDirty: true }); } catch (e) {}
      try { updateShinyCheckboxState(); } catch (e) {}
      try { updateMakeShinyButton(); } catch (e) {}
      // Validate form
      syncEncounterBrowserSelection(speciesId);
      validateForm();
    }
  });

  initializeEncounterBrowser();
  
  // Keep the searchable Pokémon selector independent of encounter origin.
  updateSpeciesListForMode();
  // Filter out items with IDs 259-288 and 339-376
  const filteredItems = ITEMS.filter(([id, name]) => {
    return !((id >= 259 && id <= 288) || (id >= 339 && id <= 376));
  });
  createAutocomplete($('#item'), filteredItems, { placeholder: '— None —' });
  const alphabetizedMoves = sortMoveListAlphabetically(MOVES);
  moveAutocompletes[0] = createAutocomplete($('#move1'), alphabetizedMoves, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[1] = createAutocomplete($('#move2'), alphabetizedMoves, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[2] = createAutocomplete($('#move3'), alphabetizedMoves, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[3] = createAutocomplete($('#move4'), alphabetizedMoves, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  createAutocomplete($('#ball'), BALLS);
  
  // Set default ball to Poké Ball (ID 4)
  $('#ball').value = '4';
  
  // Create metLocation autocomplete with initial filtered list
  const initialGame = $('#originGame').value || '3';
  metLocationWrapper = createAutocomplete($('#metLocation'), getLocationsForGame(initialGame), {
    isItemDisabled: (item) => {
      if (manualOverrideActive) return false;
      const locationId = Number(item?.id);
      // Keep Mirage Island visible but non-selectable unless Manual Override is enabled.
      if (locationId === MIRAGE_ISLAND_LOCATION_ID) return true;
      // In Hatched mode, keep special event/trade locations visible but not selectable.
      if (currentEncounterMode === 'hatched' && HATCHED_DISABLED_MET_LOCATION_IDS.has(locationId)) {
        return true;
      }
      // BOX_EVENT in mystery mode should use hatched-style location choices
      // when not marked as an egg.
      if (currentEncounterMode === 'mystery' && isBoxEventMysteryEventSelected()) {
        const isEgg = Boolean($('#isEgg')?.checked);
        return !isEgg && HATCHED_DISABLED_MET_LOCATION_IDS.has(locationId);
      }
      return false;
    }
  });
  
  // Set default met location to Mauville City (ID 9)
  $('#metLocation').value = '9';
  
  // Keep these as regular selects (small lists)
  fillSelect($('#nature'), NATURES.map((n,i)=>[formatNatureOption(n, i), String(i)]), { placeholder: null });
  fillSelect($('#language'), LANGUAGES.map(([name,id])=>[name,String(id)]), { placeholder: null });
  
  // Set default language to English (ID 2)
  $('#language').value = '2';
  // Legal-mode rules decide when Japanese can be selected for an encounter.
  try {
    const langSelInit = $('#language');
    if (langSelInit && langSelInit.options) {
      for (const o of Array.from(langSelInit.options)) {
        if (String(o.value) === '1') o.disabled = true;
      }
    }
  } catch (e) {}
  try { enforceJapaneseOption(); } catch (e) {}
  try { lockLanguageForMewLegend(); } catch (e) {}

  // A real nickname edit opts out of automatic species-name localization.
  // Direct preset/import assignments do not emit `input`, so their state is
  // recorded explicitly at the assignment sites below.
  $('#nickname').addEventListener('input', markNicknameAsUserEdited);
  
  // Adjust nickname/OT maxlength based on language selection
  $('#language').addEventListener('change', () => {
    const languageId = $('#language').value;
    syncLanguageTextLimits();

    if (currentEncounterMode === 'cxd_trade') {
      applyCXDTradeLocalizedNames(getSelectedCXDTrade());
      try { updateTidSidLocking(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
      return;
    }
    if (currentEncounterMode === 'cxd_shadow') {
      const encounter = getSelectedCXDEncounter();
      if (encounter?.otNames) {
        $('#otName').value = encounter.otNames[String(languageId)] || encounter.otNames['2'] || Object.values(encounter.otNames)[0] || '';
      }
    }

    setLocalizedSpeciesNickname(
      Number($('#species')?.value || 0),
      Number(languageId)
    );

    // If we're in mystery mode and an event is selected, attempt to apply
    // the event-provided OT name for the chosen language.
    try {
      if (currentEncounterMode === 'mystery') {
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag && MYSTERY_EVENTS && MYSTERY_EVENTS[tag]) {
          const evt = MYSTERY_EVENTS[tag];
          const langKey = String($('#language')?.value || '');
          if (evt.ot_names && evt.ot_names[langKey]) {
            $('#otName').value = evt.ot_names[langKey];
            // update legality/status if needed
            try { updateLegalityStatus(); } catch (e) {}
            try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
            return;
          }
          // Fallback to generic ot_name if provided
          if (evt.ot_name) {
            $('#otName').value = evt.ot_name;
            try { updateLegalityStatus(); } catch (e) {}
            try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
            return;
          }
        }
      }
    } catch (e) {}

    try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
  });
  
  // Attach validation to relevant fields
  $('#species').addEventListener('change', () => {
    clearMakeShinyUndoState();
    validateForm();
    updateLegalityStatus();
    // Recompute total EXP when species changes (exp group may differ)
    try { computeAndSetExpFromLevel(); } catch (e) {}
    // Clear error highlighting immediately on interaction
    $('#species').parentElement.classList.remove('field-error');
    try { lockLanguageForMewLegend(); } catch (e) {}
    try { enforceMewLegendMinLevel(); } catch (e) {}
    // Update sprite (covers imports / preset changes)
    updateSpeciesSprite(Number($('#species').value) || 0);
    // Update Unown form visibility (covers imports / mode changes)
    updateUnownFormVisibility(Number($('#species').value) || 0);
    try { updateMakeShinyButton(); } catch (e) {}
  });
  $('#species').addEventListener('input', () => {
    clearMakeShinyUndoState();
    if (currentEncounterMode !== 'imported' && !$('#species').value) {
      currentEncounterMode = '';
      const internalModeSelect = document.getElementById('encounterMode');
      if (internalModeSelect) internalModeSelect.value = '';
      syncEncounterModeBodyClasses('');
      clearExactEncounterSelections();
      syncPokemonFirstOriginUi(0, { preserveCurrent: false });
    }
    validateForm();
    updateLegalityStatus();
    try { computeAndSetExpFromLevel(); } catch (e) {}
    try { updateMakeShinyButton(); } catch (e) {}
    $('#species').parentElement.classList.remove('field-error');
  });
  $('#species').addEventListener('focus', () => {
    $('#species').parentElement.classList.remove('field-error');
  });
  $('#nature').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    try { updateStatGraph(); } catch (e) {}
    try { updateContestSheenAuto({ markImportedDirty: true }); } catch (e) {}
    $('#nature').classList.remove('field-error');
    // If we're in mystery event mode, apply the per-event preset for the
    // currently selected species so PID/IV from the JSON are used instead
    // of the simple-mode/randomized presets.
    try {
      if (!suppressPresetApply && !pidFinderResultActive && currentEncounterMode === 'mystery') {
        const sp = Number($('#species').value) || 0;
        if (sp) applyMysteryPresetForSpecies(sp);
      }
    } catch (e) {}
    // Re-apply roamer preset when nature changes (PID depends on nature)
    try {
      if (!suppressPresetApply && !pidFinderResultActive && currentEncounterMode === 'roamer') {
        const sp = Number($('#species').value) || 0;
        if (sp) applyRoamerPreset(sp);
      }
    } catch (e) {}
  });
  for (const moveId of ['move1', 'move2', 'move3', 'move4']) {
    const moveEl = $('#' + moveId);
    moveEl.addEventListener('change', () => {
      refreshMoveExclusions();
      updateMoveLegalityUi();
      validateForm();
      updateLegalityStatus();
      moveEl.parentElement.classList.remove('field-error');
    });
  }
  $('#otName').addEventListener('input', () => {
    // Programmatic encounter-language changes do not emit a native change
    // event. Re-assert the active language limit before validating user input.
    syncLanguageTextLimits();
    validateForm();
    updateLegalityStatus();
    $('#otName').classList.remove('field-error');
  });
  $('#otName').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    $('#otName').classList.remove('field-error');
  });
  $('#otName').addEventListener('focus', () => {
    $('#otName').classList.remove('field-error');
  });
  
  // PID changes should trigger legality check (for legendary mode)
  const pidField = $('#pid');
  if (pidField) {
    pidField.addEventListener('input', updateLegalityStatus);
    pidField.addEventListener('change', updateLegalityStatus);
  }
  
  // Ribbon changes should trigger legality check
  const ribbonIds = [
    'ribbonWorld', 'ribbonBattleChampion', 'ribbonCountry', 'ribbonNational',
    'ribbonNationalChampion', 'ribbonRegionalChampion', 'ribbonVictory', 'ribbonWinning'
  ];
  
  ribbonIds.forEach(ribbonId => {
    const ribbonEl = $(`#${ribbonId}`);
    if (ribbonEl) {
      ribbonEl.addEventListener('change', updateLegalityStatus);
    }
  });
  
  // Fateful encounter checkbox should trigger legality check
  const fatefulEncounterCheckbox = $('#fatefulEncounter');
  if (fatefulEncounterCheckbox) {
    fatefulEncounterCheckbox.addEventListener('change', updateLegalityStatus);
  }

  const isEggCheckbox = $('#isEgg');
  if (isEggCheckbox) {
    isEggCheckbox.addEventListener('change', () => {
      if (isEggCheckbox.checked) {
        const friendshipEl = $('#friendship');
        if (friendshipEl) {
          friendshipEl.value = '1';
          try { friendshipEl.dispatchEvent(new Event('input')); } catch (e) {}
          try { friendshipEl.dispatchEvent(new Event('change')); } catch (e) {}
        }
      }
      if (isBoxEventMysteryEventSelected()) {
        applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: true });
        try { updateBallLocking(); } catch (e) {}
      }
      try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
      try { updateItemLockingForEgg(); } catch (e) {}
      try { updateOtGenderLocking(); } catch (e) {}
      updateLegalityStatus();
    });
  }
  
  // Run initial validation
  try { syncPidParityPreferenceUi(); } catch (e) {}
  validateForm();
  updateLegalityStatus();
  
  // Update locations when origin game changes
  $('#originGame').addEventListener('change', (e) => {
    const newGame = e.target.value;
    const refreshOriginDependentLegality = () => {
      try { syncPidParityPreferenceUi(); } catch (err) {}
      try { updateRSTidSidWarning(); } catch (err) {}
      try { validateForm(); } catch (err) {}
      updateLegalityStatus();
    };

    if (currentEncounterMode === 'hatched') {
      applyHatchedOriginGameDefaults(newGame);
      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: manualOverrideActive });
      try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
      try { updateHatchedOriginGameLocking(); } catch (e) {}
      refreshOriginDependentLegality();
      return;
    }

    // In roamer mode, re-apply roamer preset for the new game
    if (currentEncounterMode === 'roamer') {
      const speciesId = Number($('#species').value) || 0;
      if (speciesId && ROAMER_SPECIES[speciesId]) {
        // Update location list for the new game
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(newGame));
        }
        if (!pidFinderResultActive) applyRoamerPreset(speciesId);
      }
      // Reload defaults from the newly selected origin game's learnset.
      const sp = Number($('#species').value) || 0;
      if (sp) updateMovesForSpecies(sp, { preserveValue: manualOverrideActive });
      refreshOriginDependentLegality();
      return;
    }

    // In wild mode, delegate to the encounter filter (handles locations + level)
    if (currentEncounterMode === 'wild') {
      const speciesId = Number($('#species').value) || 0;
      updateWildEncounterFilters(speciesId);
      // Reload defaults from the newly selected origin game's learnset.
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: manualOverrideActive });
      try { updateBallLocking(); } catch (e) {}
      refreshOriginDependentLegality();
      return;
    }

    if (currentEncounterMode === 'static') {
      const speciesId = Number($('#species').value) || 0;
      if (speciesId) {
        updateStaticOriginGameLocking(speciesId);
        let selected = getSelectedStaticOriginEncounter();
        const selectedGameId = Number(newGame);
        if (selected && selected.gameId !== selectedGameId) {
          const staticSelect = document.getElementById('staticEncounter');
          const encounterIndex = String(staticSelect?.value || '').split(':')[0];
          const replacementValue = `${encounterIndex}:${selectedGameId}`;
          if ((selected.encounter.games || []).map(Number).includes(selectedGameId) &&
              Array.from(staticSelect?.options || []).some(option => option.value === replacementValue)) {
            staticSelect.value = replacementValue;
            selected = { encounter: selected.encounter, gameId: selectedGameId };
          } else {
            if (staticSelect) staticSelect.value = '';
            selected = null;
          }
        }
        selectedStaticEncounterDetail = selected;
        if (!pidFinderResultActive && !manualOverrideActive && selected) {
          applyStaticEncounterPreset(speciesId, {
            detailedEncounter: selected.encounter,
            gameId: selected.gameId,
          });
        }
        updateMovesForSpecies(speciesId, { preserveValue: true });
      }
      updateTidSidLocking();
      updateMetLevelLocking();
      updateBallLocking();
      refreshOriginDependentLegality();
      return;
    }

    if (isPcnyWishEggsMysteryEventSelected()) {
      applyPcnyWishEggsOriginAndLocationConstraints();

      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });

      refreshOriginDependentLegality();
      return;
    }

    if (isMystryMewMysteryEventSelected()) {
      applyMystryMewOriginGameConstraints();

      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });

      refreshOriginDependentLegality();
      return;
    }

    if (isWishmkrMysteryEventSelected()) {
      applyWishmkrOriginGameConstraints();

      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });

      refreshOriginDependentLegality();
      return;
    }

    if (isBoxEventMysteryEventSelected()) {
      applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: true });

      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });

      try { updateBallLocking(); } catch (e) {}
      try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
      refreshOriginDependentLegality();
      return;
    }

    if (currentEncounterMode === 'mystery') {
      const { event } = getSelectedMysteryEvent();
      if (event?.usesHatcherTrainerData) {
        applyMysteryEventOriginConstraints(event, { hatcherLocations: true });
      } else if (Array.isArray(event?.allowedOriginGames)) {
        applyMysteryEventOriginConstraints(event);
      }
      if (event?.fatefulInFRLGOnly) {
        const fateful = $('#fatefulEncounter');
        if (fateful) fateful.checked = [4, 5].includes(Number($('#originGame')?.value || 0));
      }
      const speciesId = Number($('#species').value) || 0;
      if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });
      refreshOriginDependentLegality();
      return;
    }

    // Default: show all locations for the selected game
    const filteredLocations = getLocationsForGame(newGame);

    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(filteredLocations);
    }
    
    // Reload defaults from the newly selected origin game's learnset.
    const speciesId = Number($('#species').value) || 0;
    if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: manualOverrideActive });

    try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}

    // Update legality status when origin game changes
    refreshOriginDependentLegality();
  });

  const setupOriginGameSelect = document.getElementById('setupOriginGame');
  setupOriginGameSelect?.addEventListener('change', () => {
    const originGameSelect = $('#originGame');
    const selectedOption = setupOriginGameSelect.selectedOptions?.[0];
    if (!originGameSelect || !selectedOption || selectedOption.disabled) {
      syncSetupOriginGameSelector();
      return;
    }

    const gameId = Number(setupOriginGameSelect.value) || 0;
    const canonicalOption = Array.from(originGameSelect.options || [])
      .find(option => Number(option.value) === gameId);
    if (!canonicalOption || canonicalOption.disabled) {
      syncSetupOriginGameSelector();
      return;
    }

    setProfileEncounterDefaultGameFromSetup(gameId);
    originGameSelect.value = String(gameId);
    originGameSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
  $('#originGame')?.addEventListener('change', syncSetupOriginGameSelector);
  syncSetupOriginGameSelector();

  // Global listener to mark user modifications after a mystery preset is applied.
  // Any user-driven `input` or `change` (except `#nickname`) will flip the
  // `mysteryUserModifiedSincePreset` flag so the legality UI shows 'Legal?'.
  document.addEventListener('input', (e) => {
    if (suppressUserChangeMark) return;
    if (currentEncounterMode !== 'mystery') return;
    if (!mysteryPresetAppliedFor) return;
    const tgt = e.target || {};
    const id = tgt.id || '';
    if (!id) return;
    if (id === 'nickname') return; // nickname changes are allowed
    // If selected species differs from the preset species, ignore
    const curSpecies = Number($('#species')?.value) || 0;
    if (curSpecies !== Number(mysteryPresetAppliedFor)) return;
    mysteryUserModifiedSincePreset = true;
    try { updateLegalityStatus(); } catch (e) {}
  }, true);

  document.addEventListener('change', (e) => {
    if (suppressUserChangeMark) return;
    if (currentEncounterMode !== 'mystery') return;
    if (!mysteryPresetAppliedFor) return;
    const tgt = e.target || {};
    const id = tgt.id || '';
    if (!id) return;
    if (id === 'nickname') return;
    const curSpecies = Number($('#species')?.value) || 0;
    if (curSpecies !== Number(mysteryPresetAppliedFor)) return;
    mysteryUserModifiedSincePreset = true;
    try { updateLegalityStatus(); } catch (e) {}
  }, true);

  // Add legality check listeners for fields that affect legality
  const levelInput = $('#level');
  if (levelInput) {
    levelInput.addEventListener('input', () => {
      syncCurrentLevelMinimumAttribute();
      updateLegalityStatus();
    });
    levelInput.addEventListener('change', () => {
      const changed = clampCurrentLevelToMinimum();
      if (changed) {
        try { computeAndSetExpFromLevel(); } catch (e) {}
        try { refreshMoveExclusions(); } catch (e) {}
      }
      updateLegalityStatus();
    });
    levelInput.addEventListener('input', updateStatGraph);
    levelInput.addEventListener('change', updateStatGraph);
  }
  
  const metLevelInput = $('#metLevel');
  if (metLevelInput) {
    metLevelInput.addEventListener('input', () => {
      syncCurrentLevelMinimumAttribute();
      updateLegalityStatus();
    });
    metLevelInput.addEventListener('change', () => {
      const changed = clampCurrentLevelToMinimum();
      if (changed) {
        try { computeAndSetExpFromLevel(); } catch (e) {}
        try { refreshMoveExclusions(); } catch (e) {}
      }
      updateLegalityStatus();
    });
    // In wild mode, snap met level to closest valid encounter level on blur
    metLevelInput.addEventListener('blur', () => {
      if (currentEncounterMode !== 'wild') return;
      const spId   = Number($('#species').value) || 0;
      const gameId = Number($('#originGame').value) || 0;
      const locId  = Number($('#metLocation').value) || 0;
      const wId = WILD_ENCOUNTERS[spId] ? spId : getWildAncestor(spId, WILD_ENCOUNTERS);
      const enc = wId != null ? WILD_ENCOUNTERS[wId] : null;
      if (enc && enc[gameId] && enc[gameId][locId]) {
        const ranges = enc[gameId][locId];
        let v = Number(metLevelInput.value) || 0;
        metLevelInput.value = String(snapToValidLevel(ranges, v));
        const changed = clampCurrentLevelToMinimum();
        if (changed) {
          try { computeAndSetExpFromLevel(); } catch (e) {}
          try { refreshMoveExclusions(); } catch (e) {}
        }
      }
    });
  }
  
  const metLocationInput = $('#metLocation');
  if (metLocationInput) {
    metLocationInput.addEventListener('change', () => {
      updateLegalityStatus();
      // Update ball locking for Safari Zone logic
      try { updateBallLocking(); } catch (e) {}
      try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
      // In wild mode, snap met level for the newly chosen location
      if (currentEncounterMode === 'wild') {
        const spId = Number($('#species').value) || 0;
        const gameId = Number($('#originGame').value) || 0;
        const locId  = Number($('#metLocation').value) || 0;
        const wId = WILD_ENCOUNTERS[spId] ? spId : getWildAncestor(spId, WILD_ENCOUNTERS);
        const enc = wId != null ? WILD_ENCOUNTERS[wId] : null;
        if (enc && enc[gameId] && enc[gameId][locId]) {
          const ranges = enc[gameId][locId];
          const ml = $('#metLevel');
          if (ml && ranges && ranges.length) {
            const absMin = ranges[0][0];
            const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
            ml.min = String(absMin);
            ml.max = String(absMax);
            ml.title = `Valid levels: ${rangesToLabel(ranges)}`;
            const cur = Number(ml.value) || 0;
            ml.value = String(snapToValidLevel(ranges, cur));
            const changed = clampCurrentLevelToMinimum();
            if (changed) {
              try { computeAndSetExpFromLevel(); } catch (e) {}
              try { refreshMoveExclusions(); } catch (e) {}
            }
          }
        }
        // Unown: filter form dropdown to forms available in this chamber
        if (spId === 201) {
          filterUnownFormsByLocation();
        }
      }
    });
    metLocationInput.addEventListener('input', updateLegalityStatus);
  }
  
  const ballInput = $('#ball');
  if (ballInput) {
    ballInput.addEventListener('change', updateLegalityStatus);
    ballInput.addEventListener('input', updateLegalityStatus);
  }

  $('#originGame')?.addEventListener('change', updateStatGraph);
  
  // IVs
  ['#ivHp', '#ivAtk', '#ivDef', '#ivSpAtk', '#ivSpDef', '#ivSpe'].forEach(ivField => {
    const element = $(ivField);
    if (element) {
      element.addEventListener('input', updateLegalityStatus);
      element.addEventListener('change', updateLegalityStatus);
    }
  });
  
  // EVs
  ['#evHp', '#evAtk', '#evDef', '#evSpAtk', '#evSpDef', '#evSpe'].forEach(evField => {
    const element = $(evField);
    if (element) {
      element.addEventListener('input', updateLegalityStatus);
      element.addEventListener('change', updateLegalityStatus);
    }
  });

  // Inline tooltip helper (supports hover + explicit click open/close)
  (function setupInlineTooltips() {
    const wrappers = Array.from(document.querySelectorAll('.inline-tooltip'));
    if (!wrappers.length) return;

    const closeAll = (except = null) => {
      wrappers.forEach((wrap) => {
        if (except && wrap === except) return;
        wrap.classList.remove('is-open');
        const btn = wrap.querySelector('.tooltip-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    };

    wrappers.forEach((wrap) => {
      const btn = wrap.querySelector('.tooltip-toggle');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const shouldOpen = !wrap.classList.contains('is-open');
        closeAll(wrap);
        wrap.classList.toggle('is-open', shouldOpen);
        btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          wrap.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          btn.blur();
        }
      });
    });

    document.addEventListener('click', () => closeAll());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  })();
  
  // Experience field (affects legality for level 5 base EXP check)
  const experienceInput = $('#experience');
  if (experienceInput) {
    experienceInput.addEventListener('input', updateLegalityStatus);
    experienceInput.addEventListener('change', updateLegalityStatus);
  }
  
  // Setup marking symbols - make them clickable
  document.querySelectorAll('.marking-symbol').forEach(symbol => {
    symbol.addEventListener('click', () => {
      const checkboxId = symbol.getAttribute('data-marking');
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        symbol.classList.toggle('active', checkbox.checked);
      }
    });
  });

  // Simple/advanced mode selector removed: keep PID lock state refreshed.
  try { updatePidLocking(); } catch (e) {}

  const pokemonOriginSelect = document.querySelector('#pokemonOrigin');
  if (pokemonOriginSelect) {
    pokemonOriginSelect.addEventListener('change', () => {
      const speciesId = Number($('#species')?.value || 0);
      const nextMode = String(pokemonOriginSelect.value || '');
      if (!speciesId || !nextMode) {
        currentEncounterMode = '';
        const internalModeSelect = document.getElementById('encounterMode');
        if (internalModeSelect) internalModeSelect.value = '';
        syncEncounterModeBodyClasses('');
        clearExactEncounterSelections();
        const description = document.getElementById('encounterModeDescription');
        if (description) description.hidden = true;
        validateForm();
        return;
      }

      const available = getAvailableOriginsForSpecies(speciesId, {
        mysteryEvents: MYSTERY_EVENTS,
        mysteryGifts: MYSTERY_GIFTS,
      });
      const selectedOrigin = available.find(origin => origin.mode === nextMode);
      if (!selectedOrigin) {
        pokemonOriginSelect.value = '';
        validateForm();
        return;
      }

      clearExactEncounterSelections();
      if (selectedOrigin.requiresExactEncounter) delete encounterModeStateCache[nextMode];
      preserveSpeciesOnNextModeChange = true;
      deferExactPresetOnNextModeChange = selectedOrigin.requiresExactEncounter;
      const internalModeSelect = document.getElementById('encounterMode');
      if (internalModeSelect) {
        internalModeSelect.value = nextMode;
        internalModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncPokemonFirstOriginUi(speciesId, {
        mode: nextMode,
        preserveCurrent: true,
        preserveExact: false,
      });
      validateForm();
      updateLegalityStatus();
    });
  }

  // The legacy encounter-mode control remains as the internal mode switch.
  const encounterModeSelect = document.querySelector('#encounterMode');
  if (encounterModeSelect) {
    encounterModeSelect.addEventListener('change', (e) => {
      const previousMode = currentEncounterMode;
      const nextMode = String(e.target.value || '');
      const selectedSpeciesId = Number($('#species')?.value || 0);
      const preservedSpeciesIdentity = {
        nickname: String($('#nickname')?.value || ''),
        nicknameState: nicknameLocalizationState,
        otName: String($('#otName')?.value || ''),
        language: String($('#language')?.value || ''),
      };
      const shouldPreserveSpecies = preserveSpeciesOnNextModeChange;
      const shouldDeferExactPreset = deferExactPresetOnNextModeChange;
      const shouldPreserveManualValues = shouldPreserveSpecies && manualOverrideActive;
      preserveSpeciesOnNextModeChange = false;
      deferExactPresetOnNextModeChange = false;
      // Save current mode edits before switching away
      try {
        if (previousMode) encounterModeStateCache[previousMode] = captureCurrentEncounterModeState();
      } catch (ee) {}
      const cachedNextModeState = encounterModeStateCache[nextMode] || null;
      const savedNextModeState = cachedNextModeState && (
        !shouldPreserveSpecies || Number(cachedNextModeState.fields?.species || 0) === selectedSpeciesId
      ) ? cachedNextModeState : null;
      const restorePreservedSelection = () => {
        if (shouldPreserveSpecies && selectedSpeciesId) $('#species').value = String(selectedSpeciesId);
        if (shouldPreserveSpecies && $('#nickname')) {
          $('#nickname').value = preservedSpeciesIdentity.nickname;
          restoreNicknameState(preservedSpeciesIdentity.nicknameState);
        }
        if (shouldPreserveSpecies && $('#otName')) $('#otName').value = preservedSpeciesIdentity.otName;
        if (shouldPreserveSpecies && preservedSpeciesIdentity.language && $('#language')) {
          $('#language').value = preservedSpeciesIdentity.language;
        }
        if (shouldPreserveManualValues) {
          manualOverrideActive = true;
          const override = document.getElementById('manualOverride');
          if (override) override.checked = true;
          _syncLegalModeToggle?.();
        }
      };
      // For first-time mode visits, hard reset to a clean slate
      if (!savedNextModeState && !shouldPreserveManualValues) {
        try { clearMakeShinyUndoState(nextMode); } catch (ee) {}
        try { resetAllModeState(); } catch (ee) {}
        restorePreservedSelection();
      }
      // Restore Origin Game dropdown options when leaving wild mode
      try { resetOriginGameOptions(); } catch (ee) {}
      // Restore full location list for the current origin game
      try {
        const curGame = $('#originGame').value || '3';
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(curGame));
        }
      } catch (ee) {}
      // Reset met level constraints and PID Finder lock
      try {
        const ml = $('#metLevel');
        if (ml) { ml.min = '0'; ml.max = '100'; ml.title = ''; }
      } catch (ee) {}
      pidFinderLockedMetLevel = false;
      // Reset PID Finder field locks when encounter mode changes
      if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });
      // Unlock CXD-specific field locks (origin game, met location, met level)
      const unlockEl = (el) => { if (!el) return; el.disabled = false; el.style.pointerEvents = ''; el.style.opacity = ''; el.style.cursor = ''; };
      unlockEl($('#originGame'));
      unlockEl($('#metLocation'));
      unlockEl($('#metLevel'));
      // Unlock any greyed-out origin game options from roamer mode
      try { unlockAllOriginGameOptions(); } catch (e) {}
      // Reset Make Shiny row visibility (let CSS handle it for non-CXD modes)
      const makeShinyRowEl = document.getElementById('makeShinyRow');
      if (makeShinyRowEl) makeShinyRowEl.style.display = '';
      const shinyLockedLabelEl = document.getElementById('xdShinyLocked');
      if (shinyLockedLabelEl) shinyLockedLabelEl.style.display = 'none';
      const shinyFinderHintEl = document.getElementById('cxdShinyFinderHint');
      if (shinyFinderHintEl) shinyFinderHintEl.style.display = 'none';
      const makeShinyBtnEl = document.getElementById('makeShinyBtn');
      if (makeShinyBtnEl) makeShinyBtnEl.style.display = '';
      const shinyIndicatorBtnEl = document.getElementById('shinyIndicatorBtn');
      if (shinyIndicatorBtnEl) shinyIndicatorBtnEl.style.display = '';
      const makeShinyStatusEl = document.getElementById('makeShinyStatus');
      if (makeShinyStatusEl) {
        makeShinyStatusEl.style.display = '';
        makeShinyStatusEl.textContent = '';
      }
      currentEncounterMode = nextMode;
      try { clearGeneratedOutputs(); } catch (e) {}
      syncEncounterModeBodyClasses(currentEncounterMode);
      
      // Filter species list based on encounter mode
      updateSpeciesListForMode();
      // Toggle availability of Pokémon gender control based on mode
      try {
        const genderEl = document.querySelector('#gender');
        if (genderEl && !manualOverrideActive) genderEl.disabled = (currentEncounterMode === 'mystery');
      } catch (e) {}

      // Restore saved edits for this mode (if any), else keep the clean reset.
      if (savedNextModeState) {
        try { applyEncounterModeState(savedNextModeState); } catch (e) {}
      } else if (!shouldPreserveManualValues) {
        try { resetAllModeState(); } catch (e) {}
      }
      restorePreservedSelection();
      
      // When changing encounter mode, update the Pokémon if needed
      const speciesId = Number($('#species').value) || 0;
      try { updateAbilitySelect(speciesId); } catch (e) {}
      try { updateUnownFormVisibility(speciesId); } catch (e) {}
      try { updateSpeciesSprite(speciesId); } catch (e) {}
      const previousSuppressPresetApply = suppressPresetApply;
      if (shouldDeferExactPreset || shouldPreserveManualValues) suppressPresetApply = true;
      try {
        handleEncounterModeChange(speciesId);
      } finally {
        suppressPresetApply = previousSuppressPresetApply;
      }

      // Second pass restore so mode presets/handlers don't overwrite saved edits.
      if (savedNextModeState) {
        try { applyEncounterModeState(savedNextModeState); } catch (e) {}
      }
      try { syncPidParityPreferenceUi(); } catch (e) {}

      // Default language should be English for non-mystery encounter types.
      // Keep mystery/imported behavior untouched.
      try {
        if (currentEncounterMode !== 'mystery' && currentEncounterMode !== 'imported') {
          const langEl = $('#language');
          if (langEl && !String(langEl.value || '').trim()) {
            langEl.value = '2';
          }
        }
      } catch (e) {}

      const finalSpeciesId = Number($('#species').value) || 0;
      try { updateAbilitySelect(finalSpeciesId); } catch (e) {}
      try { updateUnownFormVisibility(finalSpeciesId); } catch (e) {}
      try { updateSpeciesSprite(finalSpeciesId); } catch (e) {}
      // Re-apply move filtering for the current species
      if (finalSpeciesId) {
        updateMovesForSpecies(finalSpeciesId, {
          preserveValue: currentEncounterMode === 'mystery' || currentEncounterMode === 'cxd_shadow' || currentEncounterMode === 'cxd_trade'
        });
      }
      // Update human-readable description under the selector
      try { setEncounterModeDescription(currentEncounterMode); } catch (e) {}
      syncPokemonFirstOriginUi(finalSpeciesId, {
        mode: currentEncounterMode,
        preserveCurrent: true,
        preserveExact: !shouldDeferExactPreset,
      });
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}
      try {
        const changed = clampCurrentLevelToMinimum();
        if (changed) computeAndSetExpFromLevel();
      } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      try { updateContestStatsLocking(); } catch (e) {}
      try { updateRibbonLocking(); } catch (e) {}
      try { updateLevelLocking(); } catch (e) {}
      try { updateIvLocking(); } catch (e) {}
      try { updateHiddenPower(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { enforceMewLegendMinLevel(); } catch (e) {}
      try { updateFatefulLocking(); } catch (e) {}
      try { updateShinyCheckboxState(); } catch (e) {}
      try { updatePidLocking(); } catch (e) {}
      try { updatePidFinderVisibility(); } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { updateOtGenderLocking(); } catch (e) {}
      try { applyPcnyWishEggsOriginAndLocationConstraints(); } catch (e) {}
      try { applyMystryMewOriginGameConstraints(); } catch (e) {}
      try { applyWishmkrOriginGameConstraints(); } catch (e) {}
      try { applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: true }); } catch (e) {}
      try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}
      try { updateItemLockingForEgg(); } catch (e) {}
      try { updateMakeShinyButton(); } catch (e) {}
    });
  }

  // Legal mode toggle: On = normal legality locks, Off = manual override/unlocked fields.
  const overrideCheckbox = document.querySelector('#manualOverride');
  const legalModeToggle = document.querySelector('#legalModeToggle');

  function syncLegalModeToggle() {
    if (!legalModeToggle) return;
    const legalModeOn = !manualOverrideActive;
    legalModeToggle.textContent = legalModeOn ? 'On' : 'Off';
    legalModeToggle.classList.toggle('is-on', legalModeOn);
    legalModeToggle.classList.toggle('is-off', !legalModeOn);
    legalModeToggle.setAttribute('aria-pressed', legalModeOn ? 'true' : 'false');
    legalModeToggle.title = legalModeOn
      ? 'Legal mode is on. Legality-sensitive fields stay locked.'
      : 'Legal mode is off. All fields are unlocked for customization.';
  }

  _syncLegalModeToggle = syncLegalModeToggle;

  if (overrideCheckbox) {
    if (legalModeToggle) {
      legalModeToggle.addEventListener('click', () => {
        overrideCheckbox.checked = !overrideCheckbox.checked;
        overrideCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    overrideCheckbox.addEventListener('change', (e) => {
      if (e.target.checked && !manualOverrideActive) {
        const proceed = window.confirm(
          "Manually editing locked fields may result in illegally made Pokemon that may not be transferable to other generations or Pokemon Home.\n\nIf you proceed, it is recommended to export the Pokemon via .ek3 and import it in PkHex to check its legality afterwards.\n\nPress OK to proceed, or Cancel to go back."
        );
        if (!proceed) {
          e.target.checked = false;
          syncLegalModeToggle();
          return;
        }
      }
      manualOverrideActive = e.target.checked;
      syncLegalModeToggle();
      // Clear PID Finder locks when override is toggled
      if (hasPidFinderSelectionState()) unlockPidFinderFields();
      // Re-run all locking functions — they will skip locks when override is active
      try { updateMetLevelLocking(); } catch (e) {}
      try {
        const changed = clampCurrentLevelToMinimum();
        if (changed) computeAndSetExpFromLevel();
      } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      try { updateLevelLocking(); } catch (e) {}
      try { updatePidLocking(); } catch (e) {}
      try { updateIvLocking(); } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { updateOtGenderLocking(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { updateFatefulLocking(); } catch (e) {}
      try { updateShinyCheckboxState(); } catch (e) {}
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateItemLockingForEgg(); } catch (e) {}
      try { updateContestStatsLocking(); } catch (e) {}
      try { updateRibbonLocking(); } catch (e) {}
      try { updateHatchedOriginGameLocking(); } catch (e) {}
      try { updateStaticOriginGameLocking(Number($('#species')?.value || 0)); } catch (e) {}
      try { $('#pidFinderBtn')?.classList.remove('field-error'); } catch (e) {}
      // Refresh move dropdowns — override shows all Gen 3 moves, normal re-applies learnset
      try {
        const speciesId = Number($('#species').value) || 0;
        if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });
      } catch (e) {}
      // Unlock gender control if override is on
      try {
        const genderEl = document.querySelector('#gender');
        if (genderEl) {
          if (manualOverrideActive) {
            genderEl.disabled = false;
            genderEl.style.pointerEvents = '';
            genderEl.style.opacity = '';
            genderEl.style.cursor = '';
          } else {
            // Re-apply mode-specific gender locking
            const speciesId = Number($('#species').value) || 0;
            const previousSuppressPresetApply = suppressPresetApply;
            suppressPresetApply = true;
            try {
              handleEncounterModeChange(speciesId);
            } finally {
              suppressPresetApply = previousSuppressPresetApply;
            }
          }
        }
      } catch (e) {}
      try { validateForm(); } catch (e) {}
      try { updateRSTidSidWarning(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    });

    syncLegalModeToggle();
  }

  // Set the encounter mode description element text
  function setEncounterModeDescription(mode) {
    const el = document.getElementById('encounterModeDescription');
    if (!el) return;
    const map = {
      hatched: {label: 'Hatched / evolved from an Egg', color: '#10b981', text: 'Use this for Pokémon hatched from an Egg or evolved from one. Egg-origin met data and legality rules are applied; customizable trainer and PID fields remain available where legal.'},
      static: {label: 'Static encounter', color: '#f59e0b', text: 'Choose the exact starter, fossil, gift, Game Corner, stationary, legendary, or ticket encounter. Its game, location, level, ball, and other fixed values are applied by the existing static preset logic.'},
      roamer: {label: 'Roamer', color: '#e879f9', text: 'Roaming legendaries (Latios, Latias, Raikou, Entei, Suicune). Uses Method 1 PID generation. Non-Emerald roamers have the IV truncation bug (only HP and partial ATK IVs are kept; DEF/SPE/SPA/SPD are forced to 0).'},
      wild: {label: 'Wild-caught / evolved from wild', color: '#60a5fa', text: 'Use this for a wild-caught Pokémon or one evolved from a wild ancestor. Origin game, location, level, encounter-slot, and Method H filtering continue to use the existing wild encounter data.'},
      mystery: {label: 'Mystery Gift', color: '#ef476f', text: 'Choose the exact distribution for this Pokémon. Fixed OT, IDs, language, level, ball, fateful flag, moves, PID method, and shiny rules are applied from the existing event data.'},
      cxd_shadow: {label: 'Pokémon Colosseum / XD', color: '#a78bfa', text: 'Choose the exact Shadow, starter, gift, e-Reader, or Poké Spot encounter. Its game, level, moves, flags, and RNG method are applied automatically.'},
      cxd_trade: {label: 'In-Game Trade', color: '#38bdf8', text: 'Choose an NPC trade from Ruby, Sapphire, Emerald, FireRed, LeafGreen, or Pokémon XD. Handheld trades apply their fixed PID, IVs, trainer, nickname, and contest data; XD trades use the CXD finder for their correlated random values.'},
      imported: {label: 'Imported', color: '#94a3b8', text: 'Pokémon imported from external data. Rule: unedited imports are byte-preserved; after a real edit, output is rebuilt from UI fields. This matters for glitched bytes the UI cannot safely represent.'}
    };
    const m = map[mode] || {label: '', color: '#94a3b8', text: ''};
    el.innerHTML = '';
    el.style.setProperty('--mode-accent', m.color);
    const txt = document.createElement('span');
    txt.className = 'mode-desc-text';
    txt.textContent = m.text;
    el.appendChild(txt);
  }

  _setEncounterModeDescription = setEncounterModeDescription;

  // Initialize description for the default/current encounter mode
  try { setEncounterModeDescription(currentEncounterMode); } catch (e) {}
  try { updateHatchedOriginGameLocking(); } catch (e) {}
  try { updateMetLevelLocking(); } catch (e) {}
  try { updateBallLocking(); } catch (e) {}
  try { updateContestStatsLocking(); } catch (e) {}
  try { updateRibbonLocking(); } catch (e) {}
  try { updateLevelLocking(); } catch (e) {}
  try { updateIvLocking(); } catch (e) {}
  try { updateFatefulLocking(); } catch (e) {}
  try { updateIsEggVisibility(); } catch (e) {}
  try { updatePidFinderVisibility(); } catch (e) {}
  try { updateOtGenderLocking(); } catch (e) {}
  try { updateStaticOriginGameLocking(Number($('#species')?.value || 0)); } catch (e) {}

  // Lock or unlock TID/SID inputs depending on selected mystery event.
  // If in `mystery` mode and a non-BOX_EVENT tag is selected, these should
  // be locked so users cannot change event-provided TID/SID values.
  function updateTidSidLocking() {
    try {
      const tidEl = $('#tid');
      const sidEl = $('#sid');
      const otEl = $('#otName');
      const originGameEl = $('#originGame');
      const tag = String($('#mysteryEvent')?.value || '').toUpperCase();
      const evt = (tag && MYSTERY_EVENTS && MYSTERY_EVENTS[tag]) ? MYSTERY_EVENTS[tag] : null;
      const usesHatcherTrainerData = isPcnyWishEggsMysteryTag(tag) || !!evt?.usesHatcherTrainerData;
      const locksRepresentativeTrainer = currentEncounterMode === 'mystery' &&
        Boolean(tag && evt?.lockRepresentativeTrainer);
      const usesEditableOriginGame = isPcnyWishEggsMysteryTag(tag) ||
        (Array.isArray(evt?.allowedOriginGames) && evt.allowedOriginGames.length > 1);
      const trade = getSelectedCXDTrade();
      const shadowEncounter = getSelectedCXDEncounter();
      const cxdEncounter = trade || shadowEncounter;
      if (trade && !manualOverrideActive && tidEl) tidEl.value = String(trade.tid);
      if (trade?.fixedSID !== undefined && !manualOverrideActive && sidEl) sidEl.value = String(trade.fixedSID);
      if (shadowEncounter?.tid !== undefined && !manualOverrideActive && tidEl) tidEl.value = String(shadowEncounter.tid);
      if (shadowEncounter?.fixedSID !== undefined && !manualOverrideActive && sidEl) sidEl.value = String(shadowEncounter.fixedSID);
      if (locksRepresentativeTrainer && !manualOverrideActive) {
        if (tidEl && evt?.defaultTID !== undefined) tidEl.value = String(evt.defaultTID);
        if (otEl && evt?.ot_name) otEl.value = String(evt.ot_name);
      }
      if (cxdEncounter && !manualOverrideActive && originGameEl) {
        const fixedOriginGame = Number(trade?.originGame ?? shadowEncounter?.originGame ?? 15);
        const originGameChanged = Number(originGameEl.value || 0) !== fixedOriginGame;
        originGameEl.value = String(fixedOriginGame);
        if (originGameChanged && metLocationWrapper?.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(fixedOriginGame));
          const metLocationEl = $('#metLocation');
          if (metLocationEl && cxdEncounter.location !== undefined) {
            metLocationEl.value = String(cxdEncounter.location);
          }
        }
      }
      const hasSeedDerivedStarterIds = pidFinderResultActive &&
        String(shadowEncounter?.pidType || '').includes('STARTER');
      const profileLockTid = Boolean(hasSeedDerivedStarterIds || trade || shadowEncounter?.tid !== undefined || locksRepresentativeTrainer || (currentEncounterMode === 'mystery' && tag && tag !== 'BOX_EVENT' && !usesHatcherTrainerData && !Array.isArray(evt?.tidRange)));
      const profileLockSid = Boolean(hasSeedDerivedStarterIds || trade?.fixedSID !== undefined || shadowEncounter?.fixedSID !== undefined || (!trade && currentEncounterMode === 'mystery' && tag && tag !== 'BOX_EVENT' && !usesHatcherTrainerData));
      const profileLockOtName = Boolean(trade || shadowEncounter?.otNames || locksRepresentativeTrainer || (currentEncounterMode === 'mystery' && tag !== 'BOX_EVENT' && !usesHatcherTrainerData && !Array.isArray(evt?.allowedOtNames)));
      const shouldLockTid = !manualOverrideActive && profileLockTid;
      const shouldLockSid = !manualOverrideActive && profileLockSid;
      const shouldLockOtName = !manualOverrideActive && profileLockOtName;
      const shouldLockOriginGame = !manualOverrideActive && (
        pidFinderResultActive ||
        (currentEncounterMode === 'mystery' && tag !== 'BOX_EVENT' && !usesEditableOriginGame) ||
        shouldLockStaticEncounterOriginFields() ||
        Boolean(cxdEncounter)
      );
      if (currentEncounterMode === 'static') {
        try { updateStaticOriginGameLocking(Number($('#species')?.value || 0)); } catch (e) {}
      }
      if (tidEl) {
        tidEl.dataset.profileLocked = profileLockTid ? '1' : '0';
        tidEl.disabled = Boolean(shouldLockTid);
        tidEl.style.pointerEvents = shouldLockTid ? 'none' : '';
        tidEl.style.opacity = shouldLockTid ? '0.6' : '';
        tidEl.style.cursor = shouldLockTid ? 'not-allowed' : '';
      }
      if (sidEl) {
        sidEl.dataset.profileLocked = profileLockSid ? '1' : '0';
        sidEl.disabled = Boolean(shouldLockSid);
        sidEl.style.pointerEvents = shouldLockSid ? 'none' : '';
        sidEl.style.opacity = shouldLockSid ? '0.6' : '';
        sidEl.style.cursor = shouldLockSid ? 'not-allowed' : '';
      }
      if (otEl) {
        otEl.dataset.profileLocked = profileLockOtName ? '1' : '0';
        otEl.disabled = Boolean(shouldLockOtName);
        otEl.style.pointerEvents = shouldLockOtName ? 'none' : '';
        otEl.style.opacity = shouldLockOtName ? '0.6' : '';
        otEl.style.cursor = shouldLockOtName ? 'not-allowed' : '';
      }
      if (originGameEl) setControlLockState(originGameEl, shouldLockOriginGame);
      try { updateCXDTradeIdentityLocking(); } catch (e) {}

      if (isPcnyWishEggsMysteryEventSelected()) {
        applyPcnyWishEggsOriginAndLocationConstraints();
      } else if (evt?.usesHatcherTrainerData) {
        applyMysteryEventOriginConstraints(evt, { hatcherLocations: true });
      } else if (Array.isArray(evt?.allowedOriginGames)) {
        applyMysteryEventOriginConstraints(evt);
      }
      if (isMystryMewMysteryEventSelected()) {
        applyMystryMewOriginGameConstraints();
      }
      if (isWishmkrMysteryEventSelected()) {
        applyWishmkrOriginGameConstraints();
      }
      if (isBoxEventMysteryEventSelected()) {
        applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: true });
      }
      try { updateMysteryFixedSpecimenLocking(); } catch (e) {}
      try { updateCXDEncounterPersonalityLocking(); } catch (e) {}
    } catch (e) {
    } finally {
      // Encounter presets (notably Faraway Island Mew) set language through
      // code, so the language select's change listener does not run.
      syncLanguageTextLimits();
      queueActiveProfileTrainerDefaults();
    }
  }

  // Lock fixed Mystery Gift and Colosseum/XD OT genders in Legal Mode. Event
  // rows and PID/RNG results may still update the value programmatically.
  function updateOtGenderLocking() {
    try {
      const otGenderEl = $('#otGender');
      if (!otGenderEl) return;

      const { tag, event } = getSelectedMysteryEvent();
      const profilePolicy = getOtGenderLockPolicy({
        encounterMode: currentEncounterMode,
        manualOverride: false,
        tradeOtGender: getSelectedCXDTrade()?.otGender,
        mysteryTag: tag,
        mysteryUsesHatcherTrainerData: Boolean(event?.usesHatcherTrainerData),
        mysteryUsesRecipientOtGender: Boolean(event?.usesRecipientOtGender || event?.otGenderMethod === 'RECIPIENT'),
        isEgg: shouldApplyIsEggOverrides(),
      });
      otGenderEl.dataset.profileLocked = profilePolicy.locked ? '1' : '0';
      const policy = getOtGenderLockPolicy({
        encounterMode: currentEncounterMode,
        manualOverride: manualOverrideActive,
        tradeOtGender: getSelectedCXDTrade()?.otGender,
        mysteryTag: tag,
        mysteryUsesHatcherTrainerData: Boolean(event?.usesHatcherTrainerData),
        mysteryUsesRecipientOtGender: Boolean(event?.usesRecipientOtGender || event?.otGenderMethod === 'RECIPIENT'),
        isEgg: shouldApplyIsEggOverrides(),
      });
      if (policy.locked) {
        if (policy.forcedGender) otGenderEl.value = policy.forcedGender;
        otGenderEl.disabled = true;
        otGenderEl.style.pointerEvents = 'none';
        otGenderEl.style.opacity = '0.6';
        otGenderEl.style.cursor = 'not-allowed';
        otGenderEl.dataset.otGenderForcedLock = '1';
        return;
      }

      if (otGenderEl.dataset.otGenderForcedLock === '1') {
        otGenderEl.disabled = false;
        otGenderEl.style.pointerEvents = '';
        otGenderEl.style.opacity = '';
        otGenderEl.style.cursor = '';
        delete otGenderEl.dataset.otGenderForcedLock;
      }
    } catch (e) {}
  }

  // Keep PID locked by default in all modes unless Manual Override is enabled.
  function updatePidLocking() {
    try {
      const pidEl = $('#pid');
      if (!pidEl) return;
      const shouldLock = !manualOverrideActive;
      pidEl.disabled = Boolean(shouldLock);
      pidEl.style.pointerEvents = shouldLock ? 'none' : '';
      pidEl.style.opacity = shouldLock ? '0.6' : '';
      pidEl.style.cursor = shouldLock ? 'not-allowed' : '';
    } catch (e) {}
  }

  // Lock IVs outside hatched mode unless Manual Override is enabled.
  function updateIvLocking() {
    try {
      const shouldLock = !manualOverrideActive && currentEncounterMode !== 'hatched';
      for (const sel of ivIds) {
        const ivEl = $(sel);
        if (!ivEl) continue;
        ivEl.disabled = Boolean(shouldLock);
        ivEl.style.pointerEvents = shouldLock ? 'none' : '';
        ivEl.style.opacity = shouldLock ? '0.6' : '';
        ivEl.style.cursor = shouldLock ? 'not-allowed' : '';
      }
    } catch (e) {}
  }

  // Preserved Mystery Gift specimens such as JEREMY already have an exact
  // PID, so their nature is derived and cannot be selected independently.
  function updateMysteryFixedSpecimenLocking() {
    try {
      const natureEl = $('#nature');
      const abilityEl = $('#ability');
      const { event } = getSelectedMysteryEvent();
      const isFixedSpecimen = !manualOverrideActive &&
        currentEncounterMode === 'mystery' &&
        event?.fixedPID !== undefined;
      const shouldLockNature = isFixedSpecimen && event?.fixedNature !== undefined;
      const shouldLockAbility = isFixedSpecimen && event?.fixedAbility !== undefined;

      if (natureEl && shouldLockNature) {
        natureEl.value = String(event.fixedNature);
        natureEl.disabled = true;
        natureEl.style.pointerEvents = 'none';
        natureEl.style.opacity = '0.6';
        natureEl.style.cursor = 'not-allowed';
        natureEl.title = 'Nature is fixed by this preserved specimen\'s PID.';
        natureEl.dataset.mysteryFixedNatureLock = '1';
      } else if (natureEl?.dataset.mysteryFixedNatureLock === '1') {
        delete natureEl.dataset.mysteryFixedNatureLock;
        if (natureEl.title === 'Nature is fixed by this preserved specimen\'s PID.') natureEl.title = '';
        if (!pidFinderResultActive && natureEl.dataset.cxdEncounterFixedLock !== '1') {
          natureEl.disabled = false;
          natureEl.style.pointerEvents = '';
          natureEl.style.opacity = '';
          natureEl.style.cursor = '';
        }
      }

      if (abilityEl && shouldLockAbility) {
        abilityEl.value = String(event.fixedAbility);
        abilityEl.disabled = true;
        abilityEl.style.pointerEvents = 'none';
        abilityEl.style.opacity = '0.6';
        abilityEl.style.cursor = 'not-allowed';
        abilityEl.title = 'Ability slot is fixed by this preserved specimen\'s PID.';
        abilityEl.dataset.mysteryFixedAbilityLock = '1';
      } else if (abilityEl?.dataset.mysteryFixedAbilityLock === '1') {
        delete abilityEl.dataset.mysteryFixedAbilityLock;
        if (abilityEl.title === 'Ability slot is fixed by this preserved specimen\'s PID.') abilityEl.title = '';
        if (!pidFinderResultActive && abilityEl.dataset.cxdEncounterFixedLock !== '1') {
          abilityEl.disabled = false;
          abilityEl.style.pointerEvents = '';
          abilityEl.style.opacity = '';
          abilityEl.style.cursor = '';
        }
      }
    } catch (e) {}
  }

  // Colosseum e-Reader shadow PIDs are XDRNG/team-lock constrained even
  // though their IVs are fixed independently at zero. PKHeX's final team lock
  // fixes nature and gender, and generation always refreshes ability slot 0.
  function updateCXDEncounterPersonalityLocking() {
    try {
      const encounter = currentEncounterMode === 'cxd_shadow'
        ? getSelectedCXDEncounter()
        : currentEncounterMode === 'cxd_trade'
          ? getSelectedCXDTrade()
          : null;
      const fixed = !manualOverrideActive && (encounter?.eReader || encounter?.fixedPID !== undefined)
        ? encounter
        : null;
      const controls = [
        { el: $('#nature'), value: fixed?.fixedNature },
        { el: $('#gender'), value: fixed?.fixedGender },
        { el: $('#ability'), value: fixed?.fixedAbility },
      ];

      for (const { el, value } of controls) {
        if (!el) continue;
        const shouldLock = value !== undefined && value !== null;
        if (shouldLock) {
          el.value = String(value);
          el.disabled = true;
          el.style.pointerEvents = 'none';
          el.style.opacity = '0.6';
          el.style.cursor = 'not-allowed';
          el.dataset.cxdEncounterFixedLock = '1';
        } else if (el.dataset.cxdEncounterFixedLock === '1') {
          delete el.dataset.cxdEncounterFixedLock;
          if (!pidFinderResultActive) {
            el.disabled = false;
            el.style.pointerEvents = '';
            el.style.opacity = '';
            el.style.cursor = '';
          }
        }
      }
    } catch (e) {}
  }

  /**
   * Unlock all fields that were locked by the PID Finder result.
   * Called when species or encounter mode changes, invalidating the previous result.
   */
  function hasPidFinderSelectionState() {
    const statusText = String(document.getElementById('pidFinderStatus')?.textContent || '').trim();
    return pidFinderResultActive || pidFinderHadSelection || statusText.length > 0;
  }

  function unlockPidFinderFields(options = {}) {
    const clearPid = !!options.clearPid;
    pidFinderResultActive = false;
    pidFinderLockedMetLevel = false;
    const pidFinderStatusEl = document.getElementById('pidFinderStatus');
    if (pidFinderStatusEl) pidFinderStatusEl.textContent = '';
    pidFinderHadSelection = false;
    pidFinderMysteryTag = '';
    pidFinderResultAbilityBit = null;
    const unlock = (el) => {
      if (!el) return;
      el.disabled = false;
      el.style.pointerEvents = '';
      el.style.opacity = '';
      el.style.cursor = '';
    };
    unlock($('#nature'));
    unlock($('#gender'));
    unlock($('#ability'));
    unlock($('#pid'));
    for (const id of ['ivHp','ivAtk','ivDef','ivSpAtk','ivSpDef','ivSpe']) {
      unlock($('#' + id));
    }
    // Also unlock Channel-specific fields if they were locked
    unlock($('#item'));
    unlock($('#otGender'));
    unlock($('#otName'));
    unlock($('#originGame'));
    const metLocationEl = $('#metLocation');
    if (metLocationEl) {
      setControlLockState(metLocationEl, false);
      if (metLocationEl.dataset.pidFinderLocationLock === '1') {
        delete metLocationEl.dataset.pidFinderLocationLock;
        delete metLocationEl.dataset.pidFinderLocationId;
        metLocationEl.title = '';
      }
    }

    if (clearPid) {
      const pidEl = $('#pid');
      if (pidEl) {
        pidEl.value = '';
        try { pidEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
      }
    }

    try { updatePidLocking(); } catch (e) {}
    try { updateTidSidLocking(); } catch (e) {}
    try { updateOtGenderLocking(); } catch (e) {}
    try { updateMetLevelLocking(); } catch (e) {}
    try { updateBallLocking(); } catch (e) {}
    try { updateIvLocking(); } catch (e) {}
    try { updateMysteryFixedSpecimenLocking(); } catch (e) {}
    try { updateCXDEncounterPersonalityLocking(); } catch (e) {}
    try { updateContestStatsLocking(); } catch (e) {}
    try { updateRibbonLocking(); } catch (e) {}
    try { updateBerryFixOtPreferenceUi(); } catch (e) {}
    try { validateForm(); } catch (e) {}
  }

  unlockPidFinderFieldsFn = unlockPidFinderFields;

  // Japanese (language id '1') is selectable for normal in-game origins.
  // Mystery Gifts remain limited by their existing distribution metadata.
  function enforceJapaneseOption(tag) {
    try {
      if (currentEncounterMode === 'imported') return;
      const langSel = $('#language');
      if (!langSel || !langSel.options) return;
      const mysteryTag = String(
        tag || (currentEncounterMode === 'mystery' ? $('#mysteryEvent')?.value : '') || ''
      ).toUpperCase();
      const mysteryEvent = mysteryTag && MYSTERY_EVENTS
        ? MYSTERY_EVENTS[mysteryTag] || null
        : null;
      const allowJapanese = canSelectJapaneseLanguage({
        encounterMode: currentEncounterMode,
        manualOverride: manualOverrideActive,
        isEgg: shouldApplyIsEggOverrides(),
        mysteryEvent,
      });
      for (const o of Array.from(langSel.options)) {
        if (String(o.value) === '1') {
          o.disabled = !allowJapanese;
        }
      }
    } catch (e) {}
  }

  // Show or hide the "Is Egg" row depending on current encounter mode.
  function updateIsEggVisibility() {
    try {
      const isEggInput = $('#isEgg');
      if (!isEggInput) return;
      const row = isEggInput.parentElement;
      if (!row) return;
      const shouldShow = currentEncounterMode === 'hatched' || isBoxEventMysteryEventSelected();
      if (shouldShow) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }

      const canBeEgg = shouldShow && canSelectedSpeciesBeUnhatchedEgg();
      if (!canBeEgg && isEggInput.checked) {
        isEggInput.checked = false;
        try { isEggInput.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
      }

      isEggInput.disabled = !canBeEgg;
      isEggInput.style.pointerEvents = canBeEgg ? '' : 'none';
      isEggInput.style.opacity = canBeEgg ? '' : '0.6';
      isEggInput.style.cursor = canBeEgg ? '' : 'not-allowed';
      isEggInput.title = canBeEgg
        ? ''
        : 'Only base-stage Pokémon and valid incense-baby exceptions can be created as unhatched Eggs.';
      try { updateItemLockingForEgg(); } catch (e) {}
    } catch (e) {}
  }

  // Lock/unlock the Fateful Encounter checkbox.
  // Disabled by default in all modes; only Manual Override unlocks it.
  function updateFatefulLocking() {
    const el = $('#fatefulEncounter');
    if (!el) return;

    if (isBoxEventMysteryEventSelected()) {
      if (manualOverrideActive) {
        el.disabled = false;
      } else {
        el.checked = false;
        el.disabled = true;
      }
      return;
    }

      const selectedMysteryEvent = currentEncounterMode === 'mystery'
        ? getSelectedMysteryEvent().event
        : null;
      if (isPcnyWishEggsMysteryEventSelected() || selectedMysteryEvent?.usesHatcherTrainerData) {
        if (manualOverrideActive) {
          el.disabled = false;
        } else {
          el.checked = selectedMysteryEvent?.fatefulInFRLGOnly
            ? [4, 5].includes(Number($('#originGame')?.value || 0))
            : Boolean(selectedMysteryEvent?.defaultFatefulEncounter ?? true);
          el.disabled = true;
        }
        return;
      }

    if (currentEncounterMode === 'cxd_trade') {
      const trade = getSelectedCXDTrade();
      if (!manualOverrideActive && trade) el.checked = Boolean(trade.fateful);
      el.disabled = !manualOverrideActive;
      return;
    }

    if (manualOverrideActive) {
      el.disabled = false;
    } else {
      el.disabled = true;
    }
  }

  // Lock met level to 0 for hatched encounter mode, or keep it locked
  // if the PID Finder has set a specific level.
  function updateMetLevelLocking() {
    try {
      const metEl = $('#metLevel');
      if (!metEl) return;
      if (manualOverrideActive) {
        // Override: unlock met level for manual editing
        setControlLockState(metEl, false);
        return;
      }
      const selectedMysteryEvent = currentEncounterMode === 'mystery'
        ? getSelectedMysteryEvent().event
        : null;
      if (isPcnyWishEggsMysteryEventSelected() || selectedMysteryEvent?.usesHatcherTrainerData) {
        metEl.value = '0';
        setControlLockState(metEl, true);
        return;
      }
      if (currentEncounterMode === 'cxd_trade') {
        const trade = getSelectedCXDTrade();
        if (trade) metEl.value = String(trade.level);
        setControlLockState(metEl, true);
        return;
      }
      if (currentEncounterMode === 'cxd_shadow') {
        const encounter = getSelectedCXDEncounter();
        if (encounter && !pidFinderLockedMetLevel) metEl.value = String(encounter.level);
        setControlLockState(metEl, true);
        return;
      }
      if (currentEncounterMode === 'mystery' || isChannelJirachiMysteryEventSelected()) {
        setControlLockState(metEl, true);
        return;
      }
      if (currentEncounterMode === 'hatched') {
        metEl.value = '0';
        setControlLockState(metEl, true);
      } else if (shouldLockStaticEncounterMetFields()) {
        setControlLockState(metEl, true);
      } else if (pidFinderLockedMetLevel) {
        // PID Finder set a specific met level — keep it locked
        setControlLockState(metEl, true);
      } else {
        setControlLockState(metEl, false);
      }
    } catch (e) {}
  }
      // Lock ball selection based on encounter mode and location.
      // Safari Zone locations (Hoenn 57, Kanto 136) require Safari Ball;
      // other wild/legendary locations cannot use Safari Ball.
      function updateBallLocking() {
        try {
          const ballEl = $('#ball');
          const metLocationEl = $('#metLocation');
          const safariZoneIds = [57, 136];
          if (!ballEl) return;

          const setBallLockState = (shouldLock) => {
            setControlLockState(ballEl, shouldLock, { autocompleteFieldStyle: true });
          };

          const applyDefaultPokeBallIfEmpty = () => {
            const current = String(ballEl.value ?? '').trim();
            if (!current) {
              try { ballEl.value = '4'; } catch (e) {}
            }
          };
          const setMetLocationLock = (shouldLock) => {
            const pidFinderWildLock = !manualOverrideActive &&
              currentEncounterMode === 'wild' && pidFinderResultActive;
            if (pidFinderWildLock && metLocationEl?.dataset.pidFinderLocationId !== undefined) {
              metLocationEl.value = metLocationEl.dataset.pidFinderLocationId;
            }
            setControlLockState(metLocationEl, shouldLock || pidFinderWildLock);
          };

          if (manualOverrideActive) {
            // Override: full ball list, unlocked
            if (ballEl.updateList) ballEl.updateList(BALLS);
            applyDefaultPokeBallIfEmpty();
            setBallLockState(false);
            setMetLocationLock(false);
            return;
          }

          if (isChannelJirachiMysteryEventSelected()) {
            if (ballEl.updateList) ballEl.updateList(BALLS);
            applyDefaultPokeBallIfEmpty();
            setBallLockState(true);
            setMetLocationLock(true);
            return;
          }

          setMetLocationLock(false);

          if (isPcnyWishEggsMysteryEventSelected()) {
            if (ballEl.updateList) ballEl.updateList(BALLS);
            try { ballEl.value = '4'; } catch (e) {}
            setBallLockState(true);
            setMetLocationLock(false);
            return;
          }

          if (currentEncounterMode === 'mystery') {
            if (ballEl.updateList) ballEl.updateList(BALLS);
            applyDefaultPokeBallIfEmpty();
            setBallLockState(true);
            if (isBoxEventMysteryEventSelected()) {
              try { applyBoxEventMysteryLocationConstraints({ preserveCurrentNonEgg: true }); } catch (e) {}
              const shouldLockMetLocation = Boolean($('#isEgg')?.checked);
              setMetLocationLock(shouldLockMetLocation);
            } else {
              setMetLocationLock(true);
            }
            return;
          }

          if (currentEncounterMode === 'cxd_trade') {
            const trade = getSelectedCXDTrade();
            if (trade) {
              if (ballEl.updateList) ballEl.updateList(BALLS);
              ballEl.value = String(trade.ball);
              setBallLockState(true);
              setMetLocationLock(true);
              return;
            }
          }

          if (currentEncounterMode === 'cxd_shadow') {
            const encounter = getSelectedCXDEncounter();
            if (encounter?.ball !== null && encounter?.ball !== undefined) {
              if (ballEl.updateList) ballEl.updateList(BALLS);
              ballEl.value = String(encounter.ball);
              setBallLockState(true);
            } else {
              if (ballEl.updateList) ballEl.updateList(BALLS.filter(([id]) => Number(id) !== 5));
              if (!String(ballEl.value ?? '').trim() || Number(ballEl.value) === 5) ballEl.value = '4';
              setBallLockState(false);
            }
            setMetLocationLock(true);
            return;
          }

          if (currentEncounterMode === 'static' && shouldLockStaticEncounterMetFields()) {
            setMetLocationLock(true);
          }

          if (currentEncounterMode === 'static' && shouldLockStaticEncounterBall()) {
            const detEnc = getSelectedStaticEncounter();
            if (ballEl.updateList) ballEl.updateList(BALLS);
            if (detEnc?.fixedBall) {
              try { ballEl.value = String(detEnc.fixedBall); } catch (e) {}
            } else {
              applyDefaultPokeBallIfEmpty();
            }
            setBallLockState(true);
            return;
          }

          const locId = Number($('#metLocation')?.value) || 0;
          const isSafariZone = safariZoneIds.includes(locId);

          if (isSafariZone) {
            // Safari Zone: force Safari Ball and lock, regardless of encounter mode
            if (ballEl.updateList) ballEl.updateList(BALLS);
            try { ballEl.value = '5'; } catch (e) {}
            setBallLockState(true);
          } else if (currentEncounterMode === 'hatched') {
            // Hatched: force Poké Ball and lock
            if (ballEl.updateList) ballEl.updateList(BALLS);
            try { ballEl.value = '4'; } catch (e) {}
            setBallLockState(true);
          } else if (currentEncounterMode === 'wild' || currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
            // Check if this static encounter has a fixed ball (starters, gifts, fossils, game corner)
            const detEnc = currentEncounterMode === 'static' ? getSelectedStaticEncounter() : null;
            if (detEnc && detEnc.fixedBall) {
              // Fixed ball: force it and lock
              if (ballEl.updateList) ballEl.updateList(BALLS);
              try { ballEl.value = String(detEnc.fixedBall); } catch (e) {}
              setBallLockState(true);
            } else {
              // Wild/Static NOT at Safari Zone, no fixed ball: remove Safari Ball from options
              const filteredBalls = BALLS.filter(b => b[0] !== 5);
              if (ballEl.updateList) ballEl.updateList(filteredBalls);
              if (!String(ballEl.value ?? '').trim() || Number(ballEl.value) === 5) {
                try { ballEl.value = '4'; } catch (e) {}
              }
              setBallLockState(false);
            }
          } else {
            // Other modes: full ball list, unlocked
            if (ballEl.updateList) ballEl.updateList(BALLS);
            applyDefaultPokeBallIfEmpty();
            setBallLockState(false);
          }
        } catch (e) {}
      }

      // Lock language to Japanese for Mew when in Legendary encounter mode.
  function lockLanguageForMewLegend() {
    try {
      if (currentEncounterMode === 'imported') return;
      const langSel = $('#language');
      if (!langSel || !langSel.options) return;
      const speciesId = Number($('#species')?.value || 0);
      const isMew = speciesId === 151;
      const mysteryTag = String($('#mysteryEvent')?.value || '').toUpperCase();
      const mysteryEvent = currentEncounterMode === 'mystery'
        ? getSelectedMysteryEvent().event
        : null;
      const fixedSpecimenLanguages = Array.isArray(mysteryEvent?.allowedLanguages)
        ? [...new Set(mysteryEvent.allowedLanguages.map(Number))]
        : [];
      const shouldLockFixedSpecimenLanguage = !manualOverrideActive
        && currentEncounterMode === 'mystery'
        && mysteryEvent?.fixedPID !== undefined
        && fixedSpecimenLanguages.length === 1;
      const shouldLockEnglishForWishmkrMystery = !manualOverrideActive
        && currentEncounterMode === 'mystery'
        && isWishmkrMysteryEventSelected();

      const shouldLockJapaneseForCelebiMystery = !manualOverrideActive
        && currentEncounterMode === 'mystery'
        && (mysteryTag === 'MITSURIN_CELEBI' || mysteryTag === 'AGETO_CELEBI');

      const semanticStaticMewLock = currentEncounterMode === 'static' && isMew;
      const semanticMysteryLanguageLock = currentEncounterMode === 'mystery'
        && Boolean(mysteryTag)
        && !Boolean(mysteryEvent?.usesHatcherTrainerData);
      langSel.dataset.profileLocked = (semanticStaticMewLock || semanticMysteryLanguageLock) ? '1' : '0';
      if (semanticStaticMewLock && $('#otName')) $('#otName').dataset.profileLocked = '1';

      if (shouldLockFixedSpecimenLanguage) {
        langSel.value = String(fixedSpecimenLanguages[0]);
        langSel.disabled = true;
        langSel.style.pointerEvents = 'none';
        langSel.style.opacity = '0.6';
        langSel.style.cursor = 'not-allowed';
        langSel.title = 'Language is fixed for this preserved specimen.';
        langSel.dataset.mysteryFixedLanguageLock = '1';
        return;
      }

      if (langSel.dataset.mysteryFixedLanguageLock === '1') {
        delete langSel.dataset.mysteryFixedLanguageLock;
        if (langSel.title === 'Language is fixed for this preserved specimen.') langSel.title = '';
      }

      if (shouldLockEnglishForWishmkrMystery) {
        langSel.value = '2';
        langSel.disabled = true;
        langSel.style.pointerEvents = 'none';
        langSel.style.opacity = '0.6';
        langSel.style.cursor = 'not-allowed';
        return;
      }

      if (shouldLockJapaneseForCelebiMystery) {
        for (const o of Array.from(langSel.options)) {
          if (String(o.value) === '1') o.disabled = false;
        }
        langSel.value = '1';
        langSel.disabled = true;
        langSel.style.pointerEvents = 'none';
        langSel.style.opacity = '0.6';
        langSel.style.cursor = 'not-allowed';
        return;
      }

      if (!manualOverrideActive && currentEncounterMode === 'static' && isMew) {
        // Ensure Japanese option is enabled and select it, then disable the control
        for (const o of Array.from(langSel.options)) {
          if (String(o.value) === '1') o.disabled = false;
        }
        langSel.value = '1';
        langSel.disabled = true;
        langSel.style.pointerEvents = 'none';
        langSel.style.opacity = '0.6';
        langSel.style.cursor = 'not-allowed';
        // Lock OT name to the Japanese Mew name
        try {
          const otEl = $('#otName');
          if (otEl) {
            otEl.dataset.profileLocked = '1';
            otEl.value = 'ミュウ';
            otEl.disabled = true;
            otEl.style.pointerEvents = 'none';
            otEl.style.opacity = '0.6';
            otEl.style.cursor = 'not-allowed';
          }
        } catch (e) {}
        // Lock nickname as well for legendary Mew
        try {
          const nickEl = $('#nickname');
          if (nickEl) {
            setTrackedNickname('ミュウ', NICKNAME_SOURCE.PRESET, speciesId);
            nickEl.disabled = true;
            nickEl.style.pointerEvents = 'none';
            nickEl.style.opacity = '0.6';
            nickEl.style.cursor = 'not-allowed';
          }
        } catch (e) {}
      } else {
        // Restore language control to normal and re-apply Japanese availability rules
        langSel.disabled = false;
        langSel.style.pointerEvents = '';
        langSel.style.opacity = '';
        langSel.style.cursor = '';
        try { enforceJapaneseOption(); } catch (e) {}
        // Restore OT name control
        try {
          const otEl = $('#otName');
          if (otEl) {
            if (currentEncounterMode === 'cxd_trade') {
              // XD trade OT names are fixed by the selected trade and language.
              updateTidSidLocking();
            } else {
              const mysteryEvent = (mysteryTag && MYSTERY_EVENTS && MYSTERY_EVENTS[mysteryTag]) ? MYSTERY_EVENTS[mysteryTag] : null;
              const usesHatcherTrainerData = isPcnyWishEggsMysteryTag(mysteryTag) || !!mysteryEvent?.usesHatcherTrainerData;
              const locksRepresentativeTrainer = Boolean(mysteryEvent?.lockRepresentativeTrainer);
              if (!manualOverrideActive && currentEncounterMode === 'mystery' && mysteryTag !== 'BOX_EVENT' && !usesHatcherTrainerData && (locksRepresentativeTrainer || !Array.isArray(mysteryEvent?.allowedOtNames))) {
                otEl.disabled = true;
                otEl.style.pointerEvents = 'none';
                otEl.style.opacity = '0.6';
                otEl.style.cursor = 'not-allowed';
              } else {
                otEl.disabled = false;
                otEl.style.pointerEvents = '';
                otEl.style.opacity = '';
                otEl.style.cursor = '';
              }
            }
          }
        } catch (e) {}
        // Restore nickname control
        try {
          const nickEl = $('#nickname');
          if (nickEl) {
            if (currentEncounterMode === 'cxd_trade') {
              // XD trade identity rules are stricter than this generic
              // language helper; preserve Elekid's fixed nickname lock.
              updateCXDTradeIdentityLocking();
            } else {
              nickEl.disabled = false;
              nickEl.style.pointerEvents = '';
              nickEl.style.opacity = '';
              nickEl.style.cursor = '';
            }
          }
        } catch (e) {}
      }
    } catch (e) {
    } finally {
      syncLanguageTextLimits();
    }
  }

  // Enforce minimum level and UI constraints for every selected legal origin.
  function updateLevelLocking() {
    try {
      const levelEl = $('#level');
      if (!levelEl) return;
      if (manualOverrideActive) {
        // Override: remove min constraints
        try { levelEl.min = '1'; } catch (e) {}
        return;
      }
      if (currentEncounterMode && currentEncounterMode !== 'imported') {
        const floor = getCurrentLevelFloor();
        // Set min attribute for better UX and snap stale values up.
        try { levelEl.min = String(floor); } catch (e) {}
        const cur = Number(levelEl.value) || 0;
        if (cur < floor) {
          levelEl.value = String(floor);
          try { computeAndSetExpFromLevel(); } catch (e) {}
          try { updateLegalityStatus(); } catch (e) {}
        }
      } else {
        try { levelEl.min = '1'; } catch (e) {}
      }
    } catch (e) {}
  }

  function clampContestByte(value) {
    return clampNumber(value, 0, 255, 0);
  }

  function getContestStatsFromUI() {
    return {
      cool: clampContestByte($('#contestCool')?.value),
      beauty: clampContestByte($('#contestBeauty')?.value),
      cute: clampContestByte($('#contestCute')?.value),
      smart: clampContestByte($('#contestSmart')?.value),
      tough: clampContestByte($('#contestTough')?.value),
      sheen: clampContestByte($('#contestSheen')?.value),
    };
  }

  function isSelectedMilotic() {
    return Number($('#species')?.value || 0) === MILOTIC_SPECIES_ID;
  }

  function markImportedContestDirty(options = {}) {
    if (options.markImportedDirty && currentEncounterMode === 'imported') {
      importedRoundTripDirty = true;
    }
  }

  function enforceMiloticBeautyMinimum(options = {}) {
    if (!isSelectedMilotic()) return false;
    const beautyEl = $('#contestBeauty');
    if (!beautyEl) return false;

    const currentBeauty = clampContestByte(beautyEl.value);
    const nextBeauty = Math.max(currentBeauty, MILOTIC_MIN_BEAUTY);
    const nextValue = String(nextBeauty);
    if (beautyEl.value === nextValue) return false;

    beautyEl.value = nextValue;
    markImportedContestDirty(options);
    return true;
  }

  function getSelectedNature() {
    return Number($('#nature')?.value || 0);
  }

  function readInitialContestStatsFromTemplate(template) {
    if (!template) return null;
    const src = template.contest || template.contestStats || template.initialContestStats || template;
    const hasContestValue = ['cool', 'beauty', 'cute', 'smart', 'tough', 'sheen']
      .some(key => Object.prototype.hasOwnProperty.call(src, key));
    if (!hasContestValue) return null;
    return {
      cool: Math.max(0, Math.min(255, Number(src.cool || 0))),
      beauty: Math.max(0, Math.min(255, Number(src.beauty || 0))),
      cute: Math.max(0, Math.min(255, Number(src.cute || 0))),
      smart: Math.max(0, Math.min(255, Number(src.smart || 0))),
      tough: Math.max(0, Math.min(255, Number(src.tough || 0))),
      sheen: Math.max(0, Math.min(255, Number(src.sheen || 0))),
    };
  }

  function getEncounterInitialContestStatsOrZero() {
    const speciesId = Number($('#species')?.value || 0);
    const candidates = [];
    try {
      if (currentEncounterMode === 'static') candidates.push(getSelectedStaticEncounter());
    } catch (e) {}
    try {
      if (currentEncounterMode === 'cxd_trade') candidates.push(getSelectedCXDTrade());
    } catch (e) {}
    try {
      if (currentEncounterMode === 'mystery') {
        const tag = document.getElementById('mysteryEvent')?.value || '';
        const originSpeciesId = getCurrentOriginSourceSpeciesId(speciesId);
        if (tag && MYSTERY_EVENTS[tag]) candidates.push(MYSTERY_EVENTS[tag]);
        if (tag && MYSTERY_GIFTS[tag]) {
          candidates.push((MYSTERY_GIFTS[tag] || []).find(entry => Number(entry.species) === originSpeciesId));
        }
      }
    } catch (e) {}

    for (const candidate of candidates) {
      const stats = readInitialContestStatsFromTemplate(candidate);
      if (stats) return stats;
    }

    return {
      cool: 0,
      beauty: 0,
      cute: 0,
      smart: 0,
      tough: 0,
      sheen: 0,
    };
  }

  function setSheenInputValue(value, options = {}) {
    const sheenEl = $('#contestSheen');
    if (!sheenEl) return false;
    const next = String(Math.max(0, Math.min(255, Number(value) || 0)));
    if (sheenEl.value === next) return false;
    sheenEl.value = next;
    if (options.markImportedDirty && currentEncounterMode === 'imported') {
      importedRoundTripDirty = true;
    }
    return true;
  }

  function setContestSheenStatus(message, type = 'info') {
    const statusEl = $('#contestSheenStatus');
    if (!statusEl) return;
    const warning = type === 'warning';
    statusEl.textContent = message;
    statusEl.style.color = warning ? '#fbbf24' : 'var(--muted)';
    statusEl.style.padding = warning ? '0.5rem 0.65rem' : '';
    statusEl.style.borderRadius = warning ? '8px' : '';
    statusEl.style.background = warning ? 'rgba(245, 158, 11, 0.12)' : '';
    statusEl.style.border = warning ? '1px solid rgba(245, 158, 11, 0.35)' : '';
  }

  function applyContestSpeciesRequirements(options = {}) {
    if (!isSelectedMilotic()) {
      const beautyEl = $('#contestBeauty');
      if (beautyEl) beautyEl.min = '0';

      const sheenEl = $('#contestSheen');
      if (sheenEl) {
        const autoEnabled = getAutoSheenEnabled();
        sheenEl.disabled = autoEnabled;
        sheenEl.style.pointerEvents = autoEnabled ? 'none' : '';
        sheenEl.style.opacity = autoEnabled ? '0.6' : '';
        sheenEl.style.cursor = autoEnabled ? 'not-allowed' : '';
        sheenEl.title = autoEnabled ? 'Sheen is automatically calculated from the contest stats.' : '';
      }

      if (options.updateStatus !== false) {
        if (getAutoSheenEnabled()) {
          setContestSheenStatus('Sheen is automatically adjusted so the contest stats stay legal.');
        } else {
          validateManualSheen();
        }
      }

      return { applied: false, beautyChanged: false, sheenChanged: false };
    }

    const beautyEl = $('#contestBeauty');
    if (beautyEl) beautyEl.min = String(MILOTIC_MIN_BEAUTY);

    const sheenEl = $('#contestSheen');
    if (sheenEl) {
      sheenEl.disabled = true;
      sheenEl.style.pointerEvents = 'none';
      sheenEl.style.opacity = '0.6';
      sheenEl.style.cursor = 'not-allowed';
      sheenEl.title = 'Milotic requires at least 170 Beauty, so Sheen is automatically calculated.';
    }

    const beautyChanged = enforceMiloticBeautyMinimum(options);
    const stats = getContestStatsFromUI();
    const nature = getSelectedNature();
    const initial = getEncounterInitialContestStatsOrZero();
    const { minSheen, maxSheen } = getLegalSheenRangeGen3(stats, nature, initial);
    const sheenChanged = setSheenInputValue(minSheen, options);

    if (options.updateStatus !== false) {
      setContestSheenStatus(`Milotic requires at least ${MILOTIC_MIN_BEAUTY} Beauty. Legal Sheen range: ${minSheen}-${maxSheen}. Auto set to ${minSheen}.`);
    }

    return {
      applied: true,
      beautyChanged,
      sheenChanged,
      minSheen,
      maxSheen,
      sheen: minSheen,
    };
  }

  function getAutoSheenEnabled() {
    const autoEl = $('#autoSheenEnabled');
    return autoEl ? Boolean(autoEl.checked) : true;
  }

  function validateManualSheen() {
    const stats = getContestStatsFromUI();
    const nature = getSelectedNature();
    const initial = getEncounterInitialContestStatsOrZero();
    const { minSheen, maxSheen } = getLegalSheenRangeGen3(stats, nature, initial);
    const sheen = Math.max(0, Math.min(255, Number($('#contestSheen')?.value || 0)));

    if (sheen < minSheen) {
      setContestSheenStatus(`Sheen is too low for these contest stats. PKHeX expects at least ${minSheen}.`, 'warning');
    } else if (sheen > maxSheen) {
      setContestSheenStatus(`Sheen is too high for these contest stats. PKHeX expects at most ${maxSheen}.`, 'warning');
    } else {
      setContestSheenStatus('Contest stats and Sheen are within the legal Gen 3 range.');
    }

    return { minSheen, maxSheen, sheen };
  }

  function updateContestSheenAuto(options = {}) {
    const forceAutoSheen = isSelectedMilotic();
    const autoEnabled = getAutoSheenEnabled();
    const beautyEl = $('#contestBeauty');
    if (beautyEl) beautyEl.min = forceAutoSheen ? String(MILOTIC_MIN_BEAUTY) : '0';

    const sheenEl = $('#contestSheen');
    if (sheenEl) {
      const shouldLockSheen = autoEnabled || forceAutoSheen;
      sheenEl.disabled = shouldLockSheen;
      sheenEl.style.pointerEvents = shouldLockSheen ? 'none' : '';
      sheenEl.style.opacity = shouldLockSheen ? '0.6' : '';
      sheenEl.style.cursor = shouldLockSheen ? 'not-allowed' : '';
      sheenEl.title = forceAutoSheen
        ? 'Milotic requires at least 170 Beauty, so Sheen is automatically calculated.'
        : autoEnabled ? 'Sheen is automatically calculated from the contest stats.' : '';
    }

    if (forceAutoSheen) {
      return applyContestSpeciesRequirements(options);
    }

    if (!autoEnabled) {
      return validateManualSheen();
    }

    const stats = getContestStatsFromUI();
    const nature = getSelectedNature();
    const initial = getEncounterInitialContestStatsOrZero();
    const { minSheen, maxSheen } = getLegalSheenRangeGen3(stats, nature, initial);
    setSheenInputValue(minSheen, options);
    setContestSheenStatus(`Legal Sheen range: ${minSheen}-${maxSheen}. Auto set to ${minSheen}. Sheen is automatically adjusted so the contest stats stay legal.`);
    return { minSheen, maxSheen, sheen: minSheen };
  }

  // Contest stats stay editable; Sheen is locked only while auto calculation is enabled.
  function updateContestStatsLocking() {
    try {
      const ids = ['contestCool', 'contestBeauty', 'contestCute', 'contestSmart', 'contestTough'];
      for (const id of ids) {
        const el = $('#' + id);
        if (!el) continue;
        el.disabled = false;
        el.style.pointerEvents = '';
        el.style.opacity = '';
        el.style.cursor = '';
      }
      updateContestSheenAuto();
    } catch (e) {}
  }
  _updateContestSheenAuto = updateContestSheenAuto;
  _applyContestSpeciesRequirements = applyContestSpeciesRequirements;

  // Apply the same centralized ribbon policy used by final legality validation.
  function updateRibbonLocking() {
    try {
      const legality = getCurrentRibbonLegality();
      for (const control of GEN3_RIBBON_CONTROLS) {
        const el = document.getElementById(control.id);
        if (!el) continue;
        const policy = legality[control.key];
        const shouldApply = !manualOverrideActive && policy &&
          policy.state !== RIBBON_LEGALITY_STATE.UNKNOWN;
        const shouldLock = shouldApply && policy.state !== RIBBON_LEGALITY_STATE.OPTIONAL;

        if (shouldApply && policy.state === RIBBON_LEGALITY_STATE.REQUIRED) {
          if (control.kind === 'rank') el.value = '1';
          else el.checked = true;
        } else if (shouldApply && policy.state === RIBBON_LEGALITY_STATE.FORBIDDEN) {
          if (control.kind === 'rank') el.value = '0';
          else el.checked = false;
        } else if (shouldApply && control.kind === 'rank') {
          const rank = Number(el.value);
          if (el.value === '' || !Number.isInteger(rank) || rank < 0 || rank > Number(policy.max ?? 4)) {
            el.value = '0';
          }
        }
        el.disabled = Boolean(shouldLock);
        el.style.pointerEvents = shouldLock ? 'none' : '';
        el.style.opacity = shouldLock ? '0.6' : '';
        el.style.cursor = shouldLock ? 'not-allowed' : '';
        el.title = shouldLock ? policy.reason : '';
        const row = el.closest('.row');
        if (row) row.title = shouldLock ? policy.reason : '';
      }
    } catch (e) {}
  }

  // Exact encounter presets and met-level handlers run in their own change
  // listeners. Re-evaluate after those listeners finish so ribbon locks always
  // see the final selected encounter values.
  const scheduleRibbonLocking = () => queueMicrotask(() => {
    try { updateRibbonLocking(); } catch (e) {}
    try { updateLegalityStatus(); } catch (e) {}
  });
  for (const id of ['species', 'mysteryEvent', 'shadowEncounter', 'cxdTradeEncounter', 'metLevel', 'isEgg']) {
    const element = document.getElementById(id);
    if (!element) continue;
    element.addEventListener('change', scheduleRibbonLocking);
    if (id === 'metLevel') element.addEventListener('input', scheduleRibbonLocking);
  }

    // Load mystery gift data (JSON) to populate event list
    async function loadMysteryGifts() {
      try {
        // Try fetching the JSON; try both encoded and plain filename variants
        let data = null;
        const pathsToTry = [
          'src/data/' + encodeURIComponent('Mystery gift pokemon gen 3.json'),
          'src/data/Mystery gift pokemon gen 3.json'
        ];
        for (const p of pathsToTry) {
          try {
            const res = await fetch(p);
            if (!res || !res.ok) continue;
            data = await res.json();
            break;
          } catch (e) {
            // try next
          }
        }
        if (!data) throw new Error('Failed to fetch mystery gifts JSON');

        // group individual pokemon entries by tag
        MYSTERY_GIFTS = {};
        const allMysteryPokemon = [
          ...(data.pokemon || []),
          ...MYSTERY_GIFT_POKEMON_SUPPLEMENTAL,
        ];
        for (const entry of allMysteryPokemon) {
          const tag = entry.tag || 'UNKNOWN';
          if (!MYSTERY_GIFTS[tag]) MYSTERY_GIFTS[tag] = [];
          MYSTERY_GIFTS[tag].push(entry);
        }

        // load event-level metadata if present
        MYSTERY_EVENTS = {
          ...(data.events || {}),
          ...MYSTERY_GIFT_EVENTS_SUPPLEMENTAL,
        };

        // Try loading external moveset file to supply per-event moves
        try {
          const msRes = await fetch('src/data/gen3_event_movesets.json');
          if (msRes && msRes.ok) {
            const movesData = await msRes.json();
            const internalKeys = Object.keys(MYSTERY_EVENTS).length ? Object.keys(MYSTERY_EVENTS) : Object.keys(MYSTERY_GIFTS);
            const normalize = s => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
            // Explicit aliases checked FIRST so curated mappings always win
            // over heuristic species/name matching (critical when multiple
            // events share the same single species, e.g. Jirachi).
            for (const displayName of Object.keys(movesData || {})) {
              const movesForEvent = movesData[displayName];
              let found = null;

              // 1. Check explicit alias map first (highest priority)
              const nd = normalize(displayName);
              found = getMysteryMovesetEventAlias(displayName) || null;

              // 2. Species-based matching
              if (!found) {
                const speciesNames = Object.keys(movesForEvent || {});
                const ids = new Set();
                for (const nm of speciesNames) {
                  const sp = SPECIES.find(s => String(s[1]).toLowerCase() === String(nm).toLowerCase());
                  if (sp) ids.add(Number(sp[0]));
                }
                if (ids.size) {
                  let bestSize = Infinity;
                  for (const k of internalKeys) {
                    const evt = MYSTERY_EVENTS[k];
                    let allowed = new Set();
                    if (evt && Array.isArray(evt.species)) {
                      for (const s of evt.species) allowed.add(Number(s));
                    } else if (MYSTERY_GIFTS[k]) {
                      for (const e of MYSTERY_GIFTS[k]) if (e.species) allowed.add(Number(e.species));
                    }
                    if (!allowed.size) continue;
                    let all = true;
                    for (const id of ids) if (!allowed.has(id)) { all = false; break; }
                    if (all && allowed.size < bestSize) { found = k; bestSize = allowed.size; }
                  }
                }
              }

              // 3. Fallback to name-based matching
              if (!found) {
                found = internalKeys.find(k => normalize(k) === nd || normalize(k).includes(nd) || nd.includes(normalize(k)));
                if (!found) {
                  const toks = String(displayName).split(/[_\- ]+/).filter(Boolean).reverse().join('');
                  found = internalKeys.find(k => normalize(k) === toks || normalize(k).includes(toks));
                }
              }
              if (found) {
                if (!MYSTERY_MOVESETS[found]) {
                  MYSTERY_MOVESETS[found] = { displayName, moves: {} };
                }
                // Merge moves from this file entry into any existing moves for
                // the resolved internal event key. This avoids later entries
                // overwriting earlier ones when multiple display names map to
                // the same internal event (and preserves all species moves).
                MYSTERY_MOVESETS[found].moves = Object.assign({}, MYSTERY_MOVESETS[found].moves || {}, movesForEvent || {});
                // Track alternate display names for diagnostics
                if (MYSTERY_MOVESETS[found].displayName !== displayName) {
                  if (!MYSTERY_MOVESETS[found].aliases) MYSTERY_MOVESETS[found].aliases = [MYSTERY_MOVESETS[found].displayName];
                  if (!MYSTERY_MOVESETS[found].aliases.includes(displayName)) MYSTERY_MOVESETS[found].aliases.push(displayName);
                }
              }
            }
          }
        } catch (e) {
          // non-fatal
        }

        // If any events include an event-level exp group, don't apply it globally.
        // Prefer explicit per-pokemon `expGroup` fields so each species keeps its own group.
        try {
          for (const [tag, evt] of Object.entries(MYSTERY_EVENTS || {})) {
            if (evt && (evt.defaultExpGroup || evt.default_exp_group)) {
              console.warn('Ignoring event-level defaultExpGroup for mystery event', tag);
            }
          }
        } catch (e) {}

        // Apply per-pokemon exp group mappings if present in the JSON entries.
        // JSON entries may provide `expGroup` (string like "MEDIUM_SLOW") or `exp_group`.
        try {
          for (const entry of allMysteryPokemon) {
            if (!entry) continue;
            const sid = entry.species !== undefined ? Number(entry.species) : NaN;
            const eg = entry.expGroup ?? entry.exp_group ?? null;
            if (!Number.isFinite(sid) || !eg) continue;
            let groupVal = null;
            if (typeof eg === 'string') {
              const key = String(eg).toUpperCase();
              if (typeof GROUP !== 'undefined' && GROUP[key] !== undefined) groupVal = GROUP[key];
            } else if (typeof eg === 'number') {
              groupVal = Number(eg);
            }
            if (groupVal !== null) {
              EXP_GROUPS[sid] = groupVal;
              console.log('Mapped exp group for species', sid, '->', groupVal);
            }
          }
        } catch (e) {}

        // Populate event select from events object keys (fallback to tags found in pokemon)
        const eventSel = document.getElementById('mysteryEvent');
        if (eventSel) {
          populateMysteryEventsForSpecies(Number($('#species')?.value || 0));

          if (eventSel.dataset.originSelectionListener !== '1') {
            eventSel.addEventListener('change', () => {
              const tag = eventSel.value;
              console.log('Mystery event selected:', tag);
              clearMakeShinyUndoState();
              const shinyStatus = document.getElementById('makeShinyStatus');
              if (shinyStatus) shinyStatus.textContent = '';
              // Unlock any PID Finder result from the previous event
              if (hasPidFinderSelectionState()) try { unlockPidFinderFields({ clearPid: true }); } catch (e) {}
              if (!manualOverrideActive) {
                // Clear any previous event-specific UI state (ribbons, language disables)
                try { clearMysteryEventState(); } catch (e) {}
                // Apply event-level defaults
                applyEventDefaults(tag);
              } else {
                mysteryPresetAppliedFor = 0;
                mysteryUserModifiedSincePreset = false;
              }
              try { updatePidFinderVisibility(); } catch (e) {}
              try { updateMetLevelLocking(); } catch (e) {}
              try { updateLevelLocking(); } catch (e) {}
              try { updateFatefulLocking(); } catch (e) {}
              try { updateBallLocking(); } catch (e) {}
              try { applyIsEggOverrides({ syncUi: true }); } catch (e) {}

              // Update available species/options for this event
              updateSpeciesListForMode();
              // Also try to apply preset for selected species
              const sp = Number($('#species').value) || 0;
              if (sp) {
                // Update move dropdowns for the species learnset (preserve preset moves)
                updateMovesForSpecies(sp, { preserveValue: true });
                if (!manualOverrideActive) applyMysteryPresetForSpecies(sp);
              }
              try { updateShinyCheckboxState(); } catch (e) {}
              try { updateMakeShinyVisibility(); } catch (e) {}
              // Update mystery species options (noop if selector removed)
              updateMysterySpeciesOptions(tag);
              try { updateTidSidLocking(); } catch (e) {}
              try { updateOtGenderLocking(); } catch (e) {}
              try { enforceJapaneseOption(tag); } catch (e) {}
              try { lockLanguageForMewLegend(); } catch (e) {}
              validateForm();
              updateLegalityStatus();
            });
            eventSel.dataset.originSelectionListener = '1';
          }
        }
        syncPokemonFirstOriginUi(Number($('#species')?.value || 0), {
          mode: currentEncounterMode,
          preserveCurrent: true,
          preserveExact: true,
        });
        const selectedSpeciesId = Number($('#species')?.value || 0);
        if (selectedSpeciesId) {
          updateMovesForSpecies(selectedSpeciesId, { preserveValue: true });
        }
        refreshEncounterBrowserResults();
      } catch (e) {
        console.warn('Failed to load mystery gifts JSON', e);
      }
    }
    loadMysteryGifts();

    // ── Static encounter category dropdown ──────────────────────────
    {
      const catSel = document.getElementById('staticCategory');
      if (catSel) {
        catSel.innerHTML = '';
        for (const cat of STATIC_CATEGORIES) {
          const o = document.createElement('option');
          o.value = cat.id;
          o.textContent = cat.label;
          catSel.appendChild(o);
        }
        if (!catSel.value && STATIC_CATEGORIES.some(cat => cat.id === STATIC_DEFAULT_CATEGORY_ID)) {
          catSel.value = STATIC_DEFAULT_CATEGORY_ID;
        }
        catSel.addEventListener('change', () => {
          updateSpeciesListForMode();
          const sp = Number($('#species').value) || 0;
          if (sp) {
            handleEncounterModeChange(sp);
            try { updateStaticOriginGameLocking(sp); } catch (e) {}
            updateMovesForSpecies(sp, { preserveValue: false });
          }
          try { updateTidSidLocking(); } catch (e) {}
          try { updateMetLevelLocking(); } catch (e) {}
          try {
            const changed = clampCurrentLevelToMinimum();
            if (changed) computeAndSetExpFromLevel();
          } catch (e) {}
          try { updateBallLocking(); } catch (e) {}
          validateForm();
        });
      }
    }

    const staticEncounterSelect = document.getElementById('staticEncounter');
    if (staticEncounterSelect) {
      staticEncounterSelect.addEventListener('change', () => {
        if (currentEncounterMode !== 'static') return;
        const selected = getSelectedStaticOriginEncounter();
        selectedStaticEncounterDetail = selected;
        if (!selected) {
          validateForm();
          updateLegalityStatus();
          return;
        }

        if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });
        const categorySelect = document.getElementById('staticCategory');
        if (categorySelect) categorySelect.value = selected.encounter.category;
        if (!manualOverrideActive) {
          applyStaticEncounterPreset(Number($('#species')?.value || 0), {
            detailedEncounter: selected.encounter,
            gameId: selected.gameId,
          });
        }
        updateStaticOriginGameLocking(Number($('#species')?.value || 0));
        updateTidSidLocking();
        updateMetLevelLocking();
        updateBallLocking();
        validateForm();
        updateLegalityStatus();
      });
    }

    // Clear UI state that may have been set by a previously-selected mystery event
    function clearMysteryEventState() {
      try {
        // Re-enable all language options
        const langSel = $('#language');
        if (langSel && langSel.options) {
          for (const o of Array.from(langSel.options)) o.disabled = false;
        }

        // Uncheck event-specific ribbons that events might set
        const ribbonIds = ['ribbonWorld','ribbonBattleChampion','ribbonCountry','ribbonNational','ribbonNationalChampion','ribbonRegionalChampion','ribbonVictory','ribbonWinning'];
        for (const id of ribbonIds) {
          const el = $(`#${id}`);
          if (el) el.checked = false;
        }

        // Clear fateful flag (new event will set if needed)
        const f = $('#fatefulEncounter'); if (f) f.checked = false;
        // Re-enable all nature options (undo any event-specific restrictions)
        const natSel = $('#nature');
        if (natSel && natSel.options) {
          for (const o of Array.from(natSel.options)) {
            o.disabled = false;
          }
        }

        // Re-enable shiny checkbox (Channel Jirachi disables it)
        const shinyEl = $('#shiny');
        if (shinyEl) shinyEl.disabled = false;

        // Restore origin-game options and full met-location list after
        // event-specific restrictions (for example, PCNY FR/LG-only).
        try { resetOriginGameOptions(); } catch (e) {}
        try {
          const gameId = Number($('#originGame')?.value || 3);
          if (metLocationWrapper && metLocationWrapper.updateList) {
            metLocationWrapper.updateList(getLocationsForGame(gameId));
          }
        } catch (e) {}

        // Remove Channel-specific inline display overrides
        const pfRow = document.getElementById('pidFinderRow');
        if (pfRow) pfRow.style.removeProperty('display');
        const makeShinyRow = document.getElementById('makeShinyRow');
        if (makeShinyRow) makeShinyRow.style.removeProperty('display');
        try {
          const shinyExtRows = document.querySelectorAll('.shiny-external');
          for (const r of shinyExtRows) r.style.removeProperty('display');
        } catch (_) {}

        // Clear any mystery-preset tracking
        mysteryPresetAppliedFor = 0;
        mysteryUserModifiedSincePreset = false;
      } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}
      try { updatePidFinderVisibility(); } catch (e) {}

    }

    // Apply a mystery event preset for a species (if entries exist for selected event)
    function applyMysteryPresetForSpecies(speciesId) {
      // Prevent our own programmatic changes from being treated as user edits
      suppressUserChangeMark = true;
      const rawTag = document.getElementById('mysteryEvent')?.value || '';
      if (!rawTag) { suppressUserChangeMark = false; return; }
      const targetSpeciesId = Number(speciesId) || 0;
      const originSpeciesId = Number(getSelectedMysteryAvailability(targetSpeciesId)?.sourceSpeciesIds?.[0]) || targetSpeciesId;

      // Resolve common mismatches between event keys and per-pokemon tags.
      let tag = rawTag;
      if (!MYSTERY_GIFTS[tag]) {
        try {
          // Try reversed token order: DOEL_DEOXYS <-> DEOXYS_DOEL
          const toks = String(rawTag).split(/[_\- ]+/).filter(Boolean);
          if (toks.length > 1) {
            const rev = toks.slice().reverse().join('_');
            if (MYSTERY_GIFTS[rev]) tag = rev;
          }
        } catch (e) {}
      }
      // Fallback: case-insensitive contains/substring match
      if (!MYSTERY_GIFTS[tag]) {
        const low = String(rawTag).toLowerCase();
        const foundKey = Object.keys(MYSTERY_GIFTS).find(k => {
          const kl = String(k).toLowerCase();
          return kl === low || kl === low.replace(/[_\- ]+/g,'_') || kl.includes(low) || low.includes(kl);
        });
        if (foundKey) tag = foundKey;
      }
      const selectedEvent = (MYSTERY_EVENTS && MYSTERY_EVENTS[rawTag]) ? MYSTERY_EVENTS[rawTag] : null;
      const rawTagUpper = String(rawTag).toUpperCase();
      const isCxdCelebiMysteryEvent = rawTagUpper === 'AGETO_CELEBI';
      const selectedPresetTag = String(selectedEvent?.presetTag || '').trim();
      const presetTag = selectedPresetTag || tag;
      const natureIndex = Number($('#nature').value || 0);
      const natureName = NATURES[natureIndex] || '';

      // AGETO CELEBI uses the CXD nature PID table from imported preset data.
      let candidates = [];
      if (isCxdCelebiMysteryEvent) {
        try {
          const preset = getLegendaryPreset(natureIndex, 15);
          if (preset && preset.pid !== undefined && preset.ivs) {
            candidates.push({
              nature: natureName,
              pid: '0x' + ((Number(preset.pid) >>> 0).toString(16).toUpperCase().padStart(8, '0')),
              // Order: [hp, atk, def, speed, sp.atk, sp.def]
              ivs: [
                Number(preset.ivs.hp) || 0,
                Number(preset.ivs.atk) || 0,
                Number(preset.ivs.def) || 0,
                Number(preset.ivs.spe) || 0,
                Number(preset.ivs.spa) || 0,
                Number(preset.ivs.spd) || 0
              ],
              fixedTID: selectedEvent?.fixedTID,
              fixedSID: selectedEvent?.fixedSID,
              ot_name: selectedEvent?.ot_name,
              ot_gender: selectedEvent?.ot_gender
            });
          }
        } catch (e) {}
      }

      // Diagnostics: log available entries and currently selected nature
      if (!candidates.length) {
        try {
          const candidateNatures = (MYSTERY_GIFTS[presetTag] || []).map(e => String(e.nature || ''));
          console.log('applyMysteryPresetForSpecies', { tag, presetTag, speciesId, natureIndex, natureName, candidateNatures });
        } catch (e) {}
      }

      // Build candidate list. Prefer exact-per-tag list, but if missing,
      // scan all per-pokemon entries for matching entry.tag values (handles
      // mismatches like DEOXYS_DOEL vs DOEL_DEOXYS).
      if (!candidates.length) {
        if (MYSTERY_GIFTS[presetTag] && MYSTERY_GIFTS[presetTag].length) {
          candidates = MYSTERY_GIFTS[presetTag];
        } else {
          try {
            const rawLower = String(rawTag).toLowerCase();
            const rev = String(rawTag).split(/[_\- ]+/).filter(Boolean).reverse().join('_').toLowerCase();
            const presetLower = String(selectedPresetTag || presetTag || '').toLowerCase();
            const revPreset = String(selectedPresetTag || presetTag || '').split(/[_\- ]+/).filter(Boolean).reverse().join('_').toLowerCase();
            for (const k of Object.keys(MYSTERY_GIFTS)) {
              for (const e of (MYSTERY_GIFTS[k] || [])) {
                const etag = String(e.tag || '').toLowerCase();
                if (!etag) continue;
                if (
                  etag === rawLower ||
                  etag === rev ||
                  (rawLower && (etag.includes(rawLower) || rawLower.includes(etag))) ||
                  (presetLower && (
                    etag === presetLower ||
                    etag === revPreset ||
                    etag.includes(presetLower) ||
                    presetLower.includes(etag)
                  ))
                ) {
                  candidates.push(e);
                }
              }
            }
          } catch (e) {}
        }
      }
      const matchingSpeciesCandidates = candidates.filter(candidate =>
        candidate?.species === undefined || Number(candidate.species) === originSpeciesId
      );
      if (matchingSpeciesCandidates.length) candidates = matchingSpeciesCandidates;
      console.log('Mystery preset candidates count for', rawTag, candidates.length);
      const targetCanon = String(natureName || '').toLowerCase().replace(/[^a-z]/g, '');
      const entry = candidates.find(e => {
        const en = String(e.nature || '').toLowerCase().trim();
        if (!en) return false;
        if (en === String(natureName || '').toLowerCase()) return true;
        // If JSON used a numeric nature index
        if (!isNaN(Number(en)) && Number(en) === natureIndex) return true;
        // Canonical compare (ignore non-letters)
        const ec = en.replace(/[^a-z]/g, '');
        if (ec && ec === targetCanon) return true;
        return false;
      }) || candidates[0];
      if (entry) {
        // Reset user-modified flag when applying a concrete preset row.
        mysteryUserModifiedSincePreset = false;

        // If entry contains pid/ivs, apply them.
        const pidInput = $('#pid');
        if (pidInput && entry.pid) pidInput.value = String(entry.pid);
        if (entry.ivs && entry.ivs.length >= 6) {
          // JSON ivs order: [hp, atk, def, speed, sp.atk, sp.def] per notes
          $('#ivHp').value = String(entry.ivs[0]);
          $('#ivAtk').value = String(entry.ivs[1]);
          $('#ivDef').value = String(entry.ivs[2]);
          $('#ivSpe').value = String(entry.ivs[3]);
          $('#ivSpAtk').value = String(entry.ivs[4]);
          $('#ivSpDef').value = String(entry.ivs[5]);
        }
        if (entry.fixedTID !== undefined) $('#tid').value = String(entry.fixedTID);
        if (entry.fixedSID !== undefined) $('#sid').value = String(entry.fixedSID);
        if (entry.ot_name) $('#otName').value = entry.ot_name;
        if (entry.ot_gender) $('#otGender').value = entry.ot_gender.toLowerCase();
        if (isWishmkrMysteryTag(rawTag)) applyWishmkrHeldItemFromSeed(entry.seed);
      }
      // Apply moveset from external moveset mapping if available.
      // Use a resilient lookup: try the resolved tag, the raw selected tag,
      // the reversed-token variant, and normalized matching against keys.
      try {
        const normalizeKey = k => String(k||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        const raw = String(rawTag || '');
        const revRaw = String(rawTag).split(/[_\- ]+/).filter(Boolean).reverse().join('_');
        let ms = null;
        // Direct lookups
        if (tag && MYSTERY_MOVESETS[tag]) ms = MYSTERY_MOVESETS[tag];
        if (!ms && presetTag && MYSTERY_MOVESETS[presetTag]) ms = MYSTERY_MOVESETS[presetTag];
        if (!ms && raw && MYSTERY_MOVESETS[raw]) ms = MYSTERY_MOVESETS[raw];
        if (!ms && revRaw && MYSTERY_MOVESETS[revRaw]) ms = MYSTERY_MOVESETS[revRaw];
        // Fallback: normalized name matching against available moveset keys
        if (!ms) {
          const nd = normalizeKey(raw);
          for (const k of Object.keys(MYSTERY_MOVESETS)) {
            const nk = normalizeKey(k);
            if (!nk) continue;
            if (nk === nd || nk.includes(nd) || nd.includes(nk)) { ms = MYSTERY_MOVESETS[k]; break; }
          }
        }
        // Final fallback: compare the moveset's displayName to the raw tag/display name
        if (!ms) {
          const rawNorm = normalizeKey(raw);
          for (const [k, v] of Object.entries(MYSTERY_MOVESETS)) {
            const disp = normalizeKey(v.displayName || '');
            if (!disp) continue;
            if (disp === rawNorm || disp.includes(rawNorm) || rawNorm.includes(disp)) { ms = v; break; }
          }
        }
        const speciesObj = SPECIES.find(species => Number(species[0]) === originSpeciesId);
        const speciesName = speciesObj ? String(speciesObj[1]) : '';
        const curatedMoves = getCuratedMysteryMovesForSpecies(ms, speciesName);
        const eventMoveIds = resolveMysteryMoveIds({
          entryMoves: entry?.moves,
          eventMoves: selectedEvent?.movesBySpecies?.[originSpeciesId],
          curatedMoves,
          levelUpMoves: selectedEvent ? (LEARNSETS[originSpeciesId]?.l || []) : [],
          encounterLevel: selectedEvent
            ? Number(selectedEvent.defaultMetLevel || selectedEvent.current_level || 1)
            : undefined,
        });
        if (Array.isArray(eventMoveIds) && eventMoveIds.length) {
          for (let i = 0; i < 4; i++) {
            const el = $(`#move${i+1}`);
            if (!el) continue;
            el.value = eventMoveIds[i] ? String(eventMoveIds[i]) : '';
            try { el.dispatchEvent(new Event('change')); } catch (e) {}
          }
        } else if (isBerryFixMysteryTag(rawTag)) {
          const fallbackMoves = [33, 45, 39];
          for (let i = 0; i < 4; i++) {
            const el = $(`#move${i+1}`);
            if (!el) continue;
            const mv = fallbackMoves[i];
            el.value = mv !== undefined ? String(mv) : '';
            try { el.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}
      updateGenderFromPID();
      checkShiny();
      // Ensure gender is locked for mystery presets so it cannot be changed
      try {
        const g = $('#gender');
        if (currentEncounterMode === 'mystery' && g) {
          // If preset provided a gender explicitly in the entry, prefer it
          if (entry && entry.gender) {
            g.value = String(entry.gender).toLowerCase();
          }
          g.style.pointerEvents = 'none';
          g.style.opacity = '0.6';
          g.style.cursor = 'not-allowed';
          g.disabled = true;
        }
      } catch (e) {}
          try { updateTidSidLocking(); } catch (e) {}
      // Mark which species the preset was applied for and update legality
      mysteryPresetAppliedFor = Number(speciesId) || 0;
      try {
        const changed = clampCurrentLevelToMinimum();
        if (changed) computeAndSetExpFromLevel();
      } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
      // Re-enable marking of user changes after programmatic updates
      suppressUserChangeMark = false;
    }

    // The dedicated mystery-species select element was removed from the UI.
    // Keep a minimal no-op function so existing callers are safe and the
    // top-level `#mysteryEvent` dropdown continues to work without errors.
    function updateMysterySpeciesOptions(/*tag*/) {
      return; // noop — species selector was removed from the page
    }
  
  /**
   * Filter species list based on current encounter mode
   */
  function updateSpeciesListForMode() {
    if (!speciesAutocomplete) return;
    speciesAutocomplete.updateList(getSupportedSpecies(), { preserveValue: true });
  }

  _updateSpeciesListForMode = updateSpeciesListForMode;

  /**
   * Handle encounter mode changes and apply appropriate PID/IV logic
   */
  function handleEncounterModeChange(speciesId) {
    const mode = currentEncounterMode;
    if (mode === 'imported') {
      updateLegalityStatus();
      return;
    }
    if (mode !== 'mystery') {
      mysteryPresetAppliedFor = 0;
      mysteryUserModifiedSincePreset = false;
    }
    const genderSelect = $('#gender');
    const previousGender = String(genderSelect?.value || '');
    // Set gender options based on species gender threshold
    if (genderSelect) {
      const threshold = getGenderThreshold(speciesId);
      genderSelect.innerHTML = '';
      if (threshold === 255) {
        // Female only
        const opt = document.createElement('option');
        opt.value = 'female';
        opt.textContent = 'Female';
        genderSelect.appendChild(opt);
        genderSelect.value = 'female';
        genderSelect.disabled = true;
      } else if (threshold === 0) {
        // Male only
        const opt = document.createElement('option');
        opt.value = 'male';
        opt.textContent = 'Male';
        genderSelect.appendChild(opt);
        genderSelect.value = 'male';
        genderSelect.disabled = true;
      } else if (threshold === -1) {
        // Genderless
        const opt = document.createElement('option');
        opt.value = 'genderless';
        opt.textContent = 'Genderless';
        genderSelect.appendChild(opt);
        genderSelect.value = 'genderless';
        genderSelect.disabled = true;
      } else {
        // Both male and female
        const optM = document.createElement('option');
        optM.value = 'male';
        optM.textContent = 'Male';
        genderSelect.appendChild(optM);
        const optF = document.createElement('option');
        optF.value = 'female';
        optF.textContent = 'Female';
        genderSelect.appendChild(optF);
        genderSelect.disabled = false;
      }
      // Keep lock visuals in sync with actual disabled state.
      if (genderSelect.disabled) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
      } else {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      // If we're in mystery mode, lock the gender control so users cannot change it
      if (!manualOverrideActive && currentEncounterMode === 'mystery' && genderSelect) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
        genderSelect.disabled = true;
      }
      if (
        suppressPresetApply &&
        previousGender &&
        Array.from(genderSelect.options || []).some(option => option.value === previousGender)
      ) {
        genderSelect.value = previousGender;
      }
    try { updateTidSidLocking(); } catch (e) {}
    }
    if (mode === 'static' && getStaticEncountersForSpecies(speciesId).length) {
      // Static mode should only lock gender when the species itself is fixed/genderless.
      // (Handled above by species gender-threshold options.)
      if (!pidFinderResultActive) applyStaticEncounterPreset(speciesId, { preferDefaultGame: true });
    } else if (mode === 'roamer') {
      // ── Roamer encounter mode ────────────────────────────────────
      // Lock gender (roamers are all genderless)
      if (genderSelect) {
        genderSelect.style.pointerEvents = manualOverrideActive ? '' : 'none';
        genderSelect.style.opacity = manualOverrideActive ? '' : '0.6';
        genderSelect.style.cursor = manualOverrideActive ? '' : 'not-allowed';
      }
      // Apply roamer-specific defaults
      if (!pidFinderResultActive) applyRoamerPreset(speciesId);
    } else if (mode === 'hatched') {
      // Reset to hatched defaults when switching from legendaries
      const metLevelInput = $('#metLevel');
      const levelInput = $('#level');
      const fatefulCheckbox = $('#fatefulEncounter');
      const originGameSelect = $('#originGame');
      // Re-enable gender selection
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      if (!suppressPresetApply) {
      // Reset met level to 0 (hatched)
      if (metLevelInput) {
        metLevelInput.value = '0';
      }
      
      // A hatched Pokémon starts at the earliest level its selected species
      // could have reached from a Gen III egg (including evolution levels).
      if (levelInput) {
        levelInput.value = String(getHatchedLevelFloor(speciesId));
      }
      
      // Reset fateful encounter flag
      if (fatefulCheckbox) {
        fatefulCheckbox.checked = false;
      }
      
      // Reset origin game to Emerald (game ID 3)
      if (originGameSelect) {
        originGameSelect.value = '3';
      }

      // Emerald is the default; R/S/E hatch in Mauville City and FR/LG hatch
      // on Four Island when the Game choice is changed later in the setup.
      applyHatchedOriginGameDefaults(Number(originGameSelect?.value || 3));
      
      // Reset IVs to 31
      $('#ivHp').value = '31';
      $('#ivAtk').value = '31';
      $('#ivDef').value = '31';
      $('#ivSpAtk').value = '31';
      $('#ivSpDef').value = '31';
      $('#ivSpe').value = '31';
      
      // Reset EVs to 0
      $('#evHp').value = '0';
      $('#evAtk').value = '0';
      $('#evDef').value = '0';
      $('#evSpAtk').value = '0';
      $('#evSpDef').value = '0';
      $('#evSpe').value = '0';
      
      // Update experience to match the selected hatch-level default.
      computeAndSetExpFromLevel();
      }
    } else if (mode === 'wild') {
      // For wild mode, re-enable gender selection and apply encounter filters
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }

      if (!suppressPresetApply) {
        // Apply wild encounter filtering for origin game, met location, met level
        updateWildEncounterFilters(speciesId, { preferDefaultGame: true });

        // Re-check ball locking after location was set (may now be Safari Zone)
        try { updateBallLocking(); } catch (e) {}

        // Auto-select ability slot 0 for wild encounters
        const abilitySelect = $('#ability');
        if (abilitySelect) abilitySelect.value = '0';

        // Re-apply nature preset so PID/IV reflect the selected nature for wild mode
        // Skip during imports (suppressPresetApply) and when
        // PID Finder result is active to preserve their PID/IVs.
        if (!suppressPresetApply && !pidFinderResultActive) {
          const natureElLocal = document.querySelector('#nature');
          if (natureElLocal) {
            natureElLocal.dispatchEvent(new Event('change'));
          }
        }

        // Ensure ability is visibly selected after all preset logic
        if (abilitySelect && !abilitySelect.value) abilitySelect.value = '0';
      }
    } else if (mode === 'cxd_shadow') {
      // CXD Shadow mode: populate shadow encounter sub-selector and auto-apply
      // Gender is NOT locked — user can choose gender freely
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      // Lock origin game (always game ID 15 for CXD)
      const originGameEl = $('#originGame');
      if (originGameEl) setControlLockState(originGameEl, !manualOverrideActive);
      // Lock met location (set by the shadow encounter preset)
      const metLocEl = $('#metLocation');
      if (metLocEl) setControlLockState(metLocEl, !manualOverrideActive);
      // Lock met level (set by the shadow encounter preset)
      const metLvlEl = $('#metLevel');
      if (metLvlEl) setControlLockState(metLvlEl, !manualOverrideActive);
      // Update shiny checkbox state (CXD tooltip)
      try { updateShinyCheckboxState(); } catch (e) {}
      // Always populate the shadow encounter dropdown and auto-apply the preset.
      // Only skip auto-apply when PID Finder result is active.
      applyCXDShadowEncounterForSpecies(
        speciesId,
        !pidFinderResultActive && !suppressPresetApply,
        { requireSelection: suppressPresetApply, preserveSelection: true }
      );
    } else if (mode === 'cxd_trade') {
      // Handheld trades use fixed personality data. XD trades share this mode
      // but obtain their correlated PID/IV/ability values from the PID Finder.
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      const originGameEl = $('#originGame');
      if (originGameEl) setControlLockState(originGameEl, !manualOverrideActive);
      const metLocEl = $('#metLocation');
      if (metLocEl) setControlLockState(metLocEl, !manualOverrideActive);
      const metLvlEl = $('#metLevel');
      if (metLvlEl) setControlLockState(metLvlEl, !manualOverrideActive);
      applyCXDTradeEncounterForSpecies(speciesId, !pidFinderResultActive && !suppressPresetApply);
      try { updateShinyCheckboxState(); } catch (e) {}
    } else {
      // Fallback: re-enable gender selection
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
    }
    try { updateOtGenderLocking(); } catch (e) {}
    try { updateHatchedOriginGameLocking(); } catch (e) {}
    try { updateStaticOriginGameLocking(speciesId); } catch (e) {}
    try {
      const changed = clampCurrentLevelToMinimum();
      if (changed) computeAndSetExpFromLevel();
    } catch (e) {}
    // For 'wild' mode, use normal PID generation (already working)
    
    try { updateContestSheenAuto({ markImportedDirty: true }); } catch (e) {}

    // Update legality status after mode change
    updateLegalityStatus();
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   *  CXD Shadow Encounter helpers
   * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  /**
   * Populate the #shadowEncounter dropdown with all encounters for the given
   * species, and auto-apply the first one.
   */
  function applyCXDShadowEncounterForSpecies(speciesId, applyPreset = true, options = {}) {
    const encounters = getCXDEncountersForSpecies(speciesId);
    const sel = document.getElementById('shadowEncounter');
    if (!sel) return;
    const previousValue = options.preserveSelection === true ? String(sel.value || '') : '';
    sel.innerHTML = '';

    const eligibleIndices = encounters
      .map((encounter, index) => isEncounterInActiveBrowseSelection(encounter) ? index : -1)
      .filter(index => index >= 0);
    const hasPreviousSelection = previousValue !== ''
      && eligibleIndices.includes(Number(previousValue));
    const requireSelection = options.requireSelection === true && !hasPreviousSelection;
    if (requireSelection) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Select encounter —';
      sel.appendChild(placeholder);
    }

    if (!eligibleIndices.length) {
      sel.innerHTML = '<option value="">— No encounters —</option>';
      try { updateMakeShinyVisibility(null); } catch (e) {}
      return;
    }

    // Build dropdown options: "Kind — Trainer @ Location [###] (Game, Lv##)"
    for (const i of eligibleIndices) {
      const enc = encounters[i];
      const locPad = String(enc.location).padStart(3, '0');
      const gameLabel = enc.game === 'colo' ? 'Colo' : 'XD';
      const sourceName = SPECIES.find(([id]) => Number(id) === Number(enc.species))?.[1] || 'Pokémon';
      const sourcePrefix = Number(enc.species) === Number(speciesId) ? '' : `${sourceName} — `;
      const kindLabel = ({ shadow: 'Shadow', starter: 'Starter', gift: 'Gift', pokespot: 'Poké Spot' })[enc.kind] || 'Encounter';
      const levelLabel = Number.isFinite(Number(enc.levelMin)) && Number(enc.levelMin) !== Number(enc.level)
        ? `${enc.levelMin}–${enc.levelMax ?? enc.level}`
        : String(enc.level);
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${sourcePrefix}${kindLabel} — ${enc.trainer} @ ${enc.locationName} [${locPad}] (${gameLabel}, Lv${levelLabel})`;
      sel.appendChild(opt);
    }
    sel.value = hasPreviousSelection
      ? previousValue
      : (requireSelection ? '' : String(eligibleIndices[0]));
    const selectedEncounter = sel.value === '' ? null : encounters[Number(sel.value)] || null;
    // Apply the selected encounter (or just update visibility when override is active).
    if (applyPreset && selectedEncounter) {
      applyCXDShadowPreset(selectedEncounter);
    } else {
      try { updateMakeShinyVisibility(selectedEncounter); } catch (e) {}
    }
  }

  /**
   * Apply a single CXD shadow encounter preset to the form.
   * Sets origin game, met location, met level, level, moves, and fateful encounter.
   */
  function applyCXDShadowPreset(enc) {
    if (!enc) return;

    const fixedOriginGame = Number(enc.originGame ?? 15);
    const originGameSelect = $('#originGame');
    if (originGameSelect) {
      originGameSelect.value = String(fixedOriginGame);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(fixedOriginGame));
      }
    }

    // Met location
    const metLocationSelect = $('#metLocation');
    if (metLocationSelect) {
      metLocationSelect.value = String(enc.location);
    }

    // Met level and level
    const metLevelInput = $('#metLevel');
    const levelInput = $('#level');
    const targetSpeciesId = Number($('#species')?.value || enc.species);
    const currentLevel = getMinimumLevelForEncounterEvolution(targetSpeciesId, enc.species, enc.level);
    if (metLevelInput) metLevelInput.value = String(enc.level);
    if (levelInput) levelInput.value = String(currentLevel);
    computeAndSetExpFromLevel();

    // Moves
    const moveIds = enc.moves || [];
    for (let i = 0; i < 4; i++) {
      const moveEl = $(`#move${i + 1}`);
      if (moveEl) moveEl.value = String(moveIds[i] || 0);
    }
    // Show all moves in dropdown for this species so shadow moves are available
    updateMovesForSpecies(targetSpeciesId, { preserveValue: true });

    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) fatefulCheckbox.checked = Boolean(enc.fateful);

    const nationalRibbonCb = $('#ribbonNational');
    if (nationalRibbonCb) nationalRibbonCb.checked = Boolean(enc.nationalRibbon);

    const ballEl = $('#ball');
    if (ballEl && enc.ball !== null && enc.ball !== undefined) ballEl.value = String(enc.ball);

    const languageEl = $('#language');
    if (languageEl) {
      for (const option of Array.from(languageEl.options || [])) option.disabled = false;
      if (Array.isArray(enc.allowedLanguages)) {
        const allowed = new Set(enc.allowedLanguages.map(String));
        for (const option of Array.from(languageEl.options || [])) option.disabled = !allowed.has(String(option.value));
        if (!allowed.has(String(languageEl.value))) languageEl.value = String(enc.allowedLanguages[0]);
      }
    }

    if (enc.tid !== undefined && $('#tid')) $('#tid').value = String(enc.tid);
    if (enc.fixedSID !== undefined && $('#sid')) $('#sid').value = String(enc.fixedSID);
    if (enc.fixedOtGender && $('#otGender')) $('#otGender').value = enc.fixedOtGender;
    if (enc.fixedNature !== undefined && $('#nature')) $('#nature').value = String(enc.fixedNature);
    if (enc.fixedGender && $('#gender')) $('#gender').value = enc.fixedGender;
    if (enc.fixedAbility !== undefined && $('#ability')) $('#ability').value = String(enc.fixedAbility);
    if (enc.otNames && $('#otName')) {
      const language = String($('#language')?.value || 2);
      $('#otName').value = enc.otNames[language] || enc.otNames['2'] || Object.values(enc.otNames)[0] || '';
    }

    setDistributionNicknameDefault({
      nickname: enc.nickname,
      speciesId: targetSpeciesId,
      languageId: Number($('#language')?.value || 2),
    });

    const shinyEl = $('#shiny');
    if (shinyEl && enc.shinyLocked) shinyEl.checked = false;

    const ivs = enc.fixedIVs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    $('#ivHp').value = String(ivs.hp);
    $('#ivAtk').value = String(ivs.atk);
    $('#ivDef').value = String(ivs.def);
    $('#ivSpAtk').value = String(ivs.spa);
    $('#ivSpDef').value = String(ivs.spd);
    $('#ivSpe').value = String(ivs.spe);

    updateHiddenPower();
    try { validateForm(); } catch (e) {}
    try { updateGCTidSidWarning(); } catch (e) {}
    try { updateRSTidSidWarning(); } catch (e) {}
    try { updateMakeShinyVisibility(enc); } catch (e) {}
    try { updateTidSidLocking(); } catch (e) {}
    try { updateBallLocking(); } catch (e) {}
    try { updateCXDEncounterPersonalityLocking(); } catch (e) {}
    try { updatePidFinderVisibility(); } catch (e) {}
  }

  function applyCXDTradeLocalizedNames(enc) {
    if (!enc || manualOverrideActive) return;
    const languageId = Number($('#language')?.value || 2);
    const otName = getCXDTradeLocalizedText(enc, 'otNames', languageId);
    const nickname = getCXDTradeLocalizedText(enc, 'nicknameByLanguage', languageId);
    if (otName && $('#otName')) $('#otName').value = otName;
    const nicknameEl = $('#nickname');
    if (nickname && nicknameEl && (enc.nicknameLocked || !nicknameEl.value || nicknameEl.dataset.cxdTradeDefaultNickname === '1')) {
      setTrackedNickname(nickname, NICKNAME_SOURCE.PRESET);
      if (enc.nicknameLocked) {
        delete nicknameEl.dataset.cxdTradeDefaultNickname;
      } else {
        nicknameEl.dataset.cxdTradeDefaultNickname = '1';
      }
    }
    syncLanguageTextLimits();
  }

  function updateCXDTradeIdentityLocking() {
    const nicknameEl = $('#nickname');
    if (!nicknameEl) return;
    if (nicknameEl.dataset.cxdTradeNicknameWatcher !== '1') {
      nicknameEl.addEventListener('input', () => {
        if (currentEncounterMode === 'cxd_trade' && !getSelectedCXDTrade()?.nicknameLocked) {
          delete nicknameEl.dataset.cxdTradeDefaultNickname;
        }
      });
      nicknameEl.dataset.cxdTradeNicknameWatcher = '1';
    }
    const enc = getSelectedCXDTrade();
    const shouldLockNickname = Boolean(enc?.nicknameLocked && !manualOverrideActive);
    if (enc && !manualOverrideActive) {
      applyCXDTradeLocalizedNames(enc);
    }
    if (shouldLockNickname) {
      nicknameEl.disabled = true;
      nicknameEl.style.pointerEvents = 'none';
      nicknameEl.style.opacity = '0.6';
      nicknameEl.style.cursor = 'not-allowed';
      nicknameEl.dataset.cxdTradeNicknameLock = '1';
    } else if (nicknameEl.dataset.cxdTradeNicknameLock === '1') {
      nicknameEl.disabled = false;
      nicknameEl.style.pointerEvents = '';
      nicknameEl.style.opacity = '';
      nicknameEl.style.cursor = '';
      delete nicknameEl.dataset.cxdTradeNicknameLock;
    }
  }

  function applyCXDTradeEncounterForSpecies(speciesId, applyPreset = true) {
    const encounters = getXDTradesForSpecies(speciesId);
    const sel = document.getElementById('cxdTradeEncounter');
    if (!sel) return;
    sel.innerHTML = '';

    const eligibleIndices = encounters
      .map((encounter, index) => isEncounterInActiveBrowseSelection(encounter) ? index : -1)
      .filter(index => index >= 0);
    if (!eligibleIndices.length) {
      sel.innerHTML = '<option value="">- No trades -</option>';
      return;
    }

    for (const i of eligibleIndices) {
      const opt = document.createElement('option');
      opt.value = String(i);
      const sourceName = SPECIES.find(([id]) => Number(id) === Number(encounters[i].species))?.[1] || 'Pokémon';
      const sourcePrefix = Number(encounters[i].species) === Number(speciesId) ? '' : `${sourceName} — `;
      opt.textContent = `${sourcePrefix}${encounters[i].label}`;
      sel.appendChild(opt);
    }
    sel.value = String(eligibleIndices[0]);
    if (applyPreset) applyCXDTradePreset(encounters[eligibleIndices[0]]);
  }

  function applyCXDTradePreset(enc) {
    if (!enc) return;

    const originGameSelect = $('#originGame');
    if (originGameSelect) {
      originGameSelect.value = String(enc.originGame);
      if (metLocationWrapper?.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(enc.originGame));
      }
    }

    const metLocationSelect = $('#metLocation');
    if (metLocationSelect) metLocationSelect.value = String(enc.location);

    const metLevelInput = $('#metLevel');
    const levelInput = $('#level');
    const targetSpeciesId = Number($('#species')?.value || enc.species);
    const currentLevel = getMinimumLevelForEncounterEvolution(targetSpeciesId, enc.species, enc.level);
    if (metLevelInput) metLevelInput.value = String(enc.level);
    if (levelInput) levelInput.value = String(currentLevel);
    computeAndSetExpFromLevel();

    const ballEl = $('#ball');
    if (ballEl) ballEl.value = String(enc.ball);

    const itemEl = $('#item');
    if (itemEl) itemEl.value = String(Number(enc.heldItem) || '');

    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) fatefulCheckbox.checked = Boolean(enc.fateful);

    updateMovesForSpecies(targetSpeciesId, { preserveValue: true });
    for (let i = 0; i < 4; i++) {
      const moveEl = $(`#move${i + 1}`);
      if (moveEl) moveEl.value = String(enc.moves[i] || 0);
    }
    refreshMoveExclusions();

    const presetIVs = enc.fixedIVs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    for (const [id, value] of [
      ['ivHp', presetIVs.hp], ['ivAtk', presetIVs.atk], ['ivDef', presetIVs.def],
      ['ivSpAtk', presetIVs.spa], ['ivSpDef', presetIVs.spd], ['ivSpe', presetIVs.spe]
    ]) {
      const el = $(`#${id}`);
      if (el) el.value = String(value);
    }

    const tidEl = $('#tid');
    if (tidEl) tidEl.value = String(enc.tid);
    const sidEl = $('#sid');
    if (sidEl && enc.fixedSID !== undefined) sidEl.value = String(enc.fixedSID);
    const otGenderEl = $('#otGender');
    if (otGenderEl) otGenderEl.value = enc.otGender === 1 ? 'female' : 'male';

    if (enc.fixedPID !== undefined) {
      const pidEl = $('#pid');
      if (pidEl) pidEl.value = `0x${(enc.fixedPID >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
      if ($('#nature')) $('#nature').value = String(enc.fixedNature);
      if ($('#gender')) $('#gender').value = String(enc.fixedGender);
      if ($('#ability')) $('#ability').value = String(enc.fixedAbility);
    }

    if (enc.contest) {
      for (const [id, key] of [
        ['contestCool', 'cool'], ['contestBeauty', 'beauty'], ['contestCute', 'cute'],
        ['contestSmart', 'smart'], ['contestTough', 'tough'], ['contestSheen', 'sheen'],
      ]) {
        const el = $(`#${id}`);
        if (el) el.value = String(enc.contest[key]);
      }
    }
    const nicknameEl = $('#nickname');
    if (nicknameEl) {
      if (enc.nicknameLocked) {
        delete nicknameEl.dataset.cxdTradeDefaultNickname;
      } else {
        nicknameEl.dataset.cxdTradeDefaultNickname = '1';
      }
    }
    applyCXDTradeLocalizedNames(enc);

    const shinyEl = $('#shiny');
    if (shinyEl && enc.shinyLocked) shinyEl.checked = false;

    updateHiddenPower();
    try { updateCXDTradeIdentityLocking(); } catch (e) {}
    try { updateTidSidLocking(); } catch (e) {}
    try { updateMetLevelLocking(); } catch (e) {}
    try { updateBallLocking(); } catch (e) {}
    try { updateFatefulLocking(); } catch (e) {}
    try { updateItemLockingForEgg(); } catch (e) {}
    try { updateCXDEncounterPersonalityLocking(); } catch (e) {}
    try { updatePidFinderVisibility(); } catch (e) {}
    try { updateShinyCheckboxState(); } catch (e) {}
    try { updateMakeShinyVisibility(enc); } catch (e) {}
    try { validateForm(); } catch (e) {}
    try { updateLegalityStatus(); } catch (e) {}
  }

  function getCurrentShinyControlPolicy(encounterOverride = undefined) {
    if (currentEncounterMode === 'mystery') {
      const { tag, event } = getSelectedMysteryEvent();
      return getShinyControlPolicy({
        encounterMode: currentEncounterMode,
        eventTag: tag,
        event,
        pidMethod: getMysteryPidMethod(),
        unlockShinyLock: shouldUnlockCelebiShinyLock(tag, event),
      });
    }

    const encounter = encounterOverride !== undefined
      ? encounterOverride
      : currentEncounterMode === 'cxd_shadow'
        ? getSelectedCXDEncounter()
        : currentEncounterMode === 'cxd_trade'
          ? getSelectedCXDTrade()
          : null;

    return getShinyControlPolicy({
      encounterMode: currentEncounterMode,
      encounter,
    });
  }

  /** Configure the shared shiny control for every encounter type. */
  function updateMakeShinyVisibility(enc) {
    const row = document.getElementById('makeShinyRow');
    const shinyLockedLabel = document.getElementById('xdShinyLocked');
    const shinyIndicatorBtnLocal = document.getElementById('shinyIndicatorBtn');
    if (!row) return;

    const selectedEncounter = enc !== undefined ? enc : getSelectedCXDEncounter();
    if (currentEncounterMode === 'cxd_shadow' && !selectedEncounter) {
      row.style.display = 'none';
      if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
      return;
    }

    const policy = getCurrentShinyControlPolicy(enc);
    row.style.display = policy.kind === SHINY_CONTROL_KIND.LOCKED ? '' : 'none';
    if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
    if (shinyIndicatorBtnLocal) shinyIndicatorBtnLocal.style.display = '';

    if (policy.kind === SHINY_CONTROL_KIND.LOCKED) {
      if (shinyIndicatorBtnLocal) shinyIndicatorBtnLocal.style.display = 'none';
      if (shinyLockedLabel) {
        shinyLockedLabel.textContent = policy.message;
        shinyLockedLabel.style.display = '';
      }
    }

    try { updateMakeShinyButton(); } catch (e) {}
  }

  // Wire up the shadow encounter dropdown change handler
  const shadowEncounterSel = document.getElementById('shadowEncounter');
  if (shadowEncounterSel) {
    shadowEncounterSel.addEventListener('change', () => {
      if (currentEncounterMode !== 'cxd_shadow') return;
      if (!shadowEncounterSel.value) {
        updateMakeShinyVisibility(null);
        try { updateTidSidLocking(); } catch (e) {}
        validateForm();
        updateLegalityStatus();
        return;
      }
      const speciesId = Number($('#species').value) || 0;
      if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });
      const encounters = getCXDEncountersForSpecies(speciesId);
      const idx = Number(shadowEncounterSel.value) || 0;
      if (encounters[idx]) {
        if (!manualOverrideActive) applyCXDShadowPreset(encounters[idx]);
        updateMakeShinyVisibility(encounters[idx]);
      }
      try { updateTidSidLocking(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      validateForm();
      updateLegalityStatus();
    });
  }

  const cxdTradeEncounterSel = document.getElementById('cxdTradeEncounter');
  if (cxdTradeEncounterSel) {
    cxdTradeEncounterSel.addEventListener('change', () => {
      if (currentEncounterMode !== 'cxd_trade') return;
      if (hasPidFinderSelectionState()) unlockPidFinderFields({ clearPid: true });
      const trade = getSelectedCXDTrade();
      if (trade) applyCXDTradePreset(trade);
    });
  }

  /**
   * Check and display warning if TID/SID pair is invalid for GC RNG.
   * Shiny/PID trainer-ID warnings apply to CXD shadow and XD trade modes.
   */
  function updateGCTidSidWarning() {
    const warningEl = document.getElementById('gcTidSidWarning');
    if (!warningEl) return;
    if (currentEncounterMode !== 'cxd_shadow' && !(currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade()))) {
      warningEl.style.display = 'none';
      return;
    }
    const tid = Number($('#tid').value) & 0xFFFF;
    const sid = Number($('#sid').value) & 0xFFFF;
    const valid = isValidGCTidSid(tid, sid);
    warningEl.style.display = valid ? 'none' : '';
  }

  const generateRsTidSidBtn = document.getElementById('generateRsTidSidBtn');
  if (generateRsTidSidBtn) {
    generateRsTidSidBtn.addEventListener('click', () => {
      const tidEl = $('#tid');
      const sidEl = $('#sid');
      const tid = Number(tidEl?.value) & 0xffff;
      const sid = Number(sidEl?.value) & 0xffff;
      const nearest = findNearestValidRSTrainerSid(tid, sid);
      if (sidEl) sidEl.value = String(nearest.sid);
      tidEl?.classList.remove('field-error');
      sidEl?.classList.remove('field-error');

      try { checkShiny(); } catch (e) {}
      try { updateMakeShinyButton(); } catch (e) {}
      try { updateGCTidSidWarning(); } catch (e) {}
      try { updateRSTidSidWarning(); } catch (e) {}
      try { updatePidTidSidWarning(); } catch (e) {}
      try { validateForm(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    });
  }

  try { updateRSTidSidWarning(); } catch (e) {}

  /**
   * Show warning when PID Finder result is active but TID/SID has been changed
   * to a combination that doesn't match the CXD PID (i.e. Make Shiny adjusted
   * SID to an impossible GC value, or user manually edited TID/SID).
   * Applies to CXD shadow and XD trade modes.
   */
  function updatePidTidSidWarning() {
    const warningEl = document.getElementById('pidTidSidWarning');
    if (!warningEl) return;
    if (currentEncounterMode !== 'cxd_shadow' && !(currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade()))) {
      warningEl.style.display = 'none';
      return;
    }

    const enc = currentEncounterMode === 'cxd_shadow' ? getSelectedCXDEncounter() : null;
    const trade = currentEncounterMode === 'cxd_trade' ? getSelectedCXDTrade() : null;
    const tid = Number($('#tid').value) & 0xFFFF;
    const sid = Number($('#sid').value) & 0xFFFF;
    const pidStr = $('#pid')?.value || '';
    const pid = parsePidInput(pidStr);

    // Nothing to validate if there's no PID set
    if (!pidStr || pid === 0) {
      warningEl.style.display = 'none';
      return;
    }

    // Check 1 (explicitly shiny-locked encounters): is the PID shiny for the
    // current IDs? Shiny-capable XD gifts and Poké Spot encounters must not be
    // rejected merely because their origin game is XD.
    if (enc?.shinyLocked || trade?.shinyLocked) {
      const pidHigh = (pid >>> 16) & 0xFFFF;
      const pidLow = pid & 0xFFFF;
      const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
      if (xor < 8) {
        warningEl.innerHTML = '\u26A0\uFE0F This PID is <b>shiny</b> for the current TID/SID, ' +
          'which is <b>impossible</b> for this XD encounter (anti-shiny rerolling ' +
          'would have skipped this PID). Change TID/SID or re-run the PID Finder.';
        warningEl.style.display = '';
        return;
      }
    }

    // Check 2 (XD & Colosseum): If a PID Finder result is active and TID or
    // SID was changed, warn that the PID was found for a different TID/SID.
    const pidFinderIdsChanged = currentEncounterMode === 'cxd_trade'
      ? tid !== pidFinderOriginalTid
      : tid !== pidFinderOriginalTid || sid !== pidFinderOriginalSid;
    if (pidFinderResultActive && pidFinderIdsChanged) {
      warningEl.innerHTML = '\u26A0\uFE0F The TID/SID has been changed after PID selection. ' +
        'The current TID/SID may not be possible with the current PID. ' +
        'Input your TID and SID and select a PID again to ensure legality.';
      warningEl.style.display = '';
      return;
    }

    warningEl.style.display = 'none';
  }
  _updatePidTidSidWarning = updatePidTidSidWarning;

  /**
   * Apply static encounter preset for a species.
   * Uses both the legacy STATIC_ENCOUNTERS keyed object (for fixed events)
  * and the new STATIC_ENCOUNTER_LIST (for per-game/category aware defaults).
  */
  function applyStaticEncounterPreset(speciesId, options = {}) {
    // Do not apply static encounter presets while Mystery Gifts mode is active;
    // event defaults should take precedence for mystery events.
    if (currentEncounterMode === 'mystery') return;

    // Skip preset application during imports so imported PID/IVs are preserved,
    // and also when PID Finder result is active.
    if (suppressPresetApply || pidFinderResultActive) return;

    // Look up the detailed encounter entry from the new list.
    // Prefer matching by current origin game so that level/location are correct.
    const requestedEncounter = options.detailedEncounter || null;
    const sourceSpeciesId = Number(requestedEncounter?.species || getSelectedStaticEncounter()?.species || speciesId);
    const encounter = STATIC_ENCOUNTERS[sourceSpeciesId];
    if (!encounter) return;
    const requestedGameId = Number(options.gameId) || 0;
    if (requestedEncounter && requestedGameId && $('#originGame')) {
      $('#originGame').value = String(requestedGameId);
    }
    const currentGame = updateStaticOriginGameLocking(speciesId, {
      preferDefaultGame: requestedEncounter ? false : options.preferDefaultGame === true,
    });
    const detailedEnc = requestedEncounter || getStaticEncountersForSpecies(speciesId).find(candidate =>
      Array.isArray(candidate.games) && candidate.games.map(Number).includes(currentGame)
    ) || null;

    // Check if this is a fixed event (like WISHMKR Jirachi)
    if (encounter.fixedEvent) {
      // Set fixed TID/SID
      if (encounter.fixedTID !== undefined) {
        $('#tid').value = String(encounter.fixedTID);
      }
      if (encounter.fixedSID !== undefined) {
        $('#sid').value = String(encounter.fixedSID);
      }
      
      // Set fixed OT Name
      if (encounter.fixedOTName) {
        $('#otName').value = encounter.fixedOTName;
      }
      
      // Set fixed PID
      if (encounter.fixedPID !== undefined) {
        $('#pid').value = '0x' + encounter.fixedPID.toString(16).toUpperCase().padStart(8, '0');
        
        // Update nature from fixed PID
        const natureIndex = encounter.fixedPID % 25;
        $('#nature').value = String(natureIndex);
      }
      
      // Set fixed IVs
      if (encounter.fixedIVs) {
        $('#ivHp').value = encounter.fixedIVs.hp;
        $('#ivAtk').value = encounter.fixedIVs.atk;
        $('#ivDef').value = encounter.fixedIVs.def;
        $('#ivSpAtk').value = encounter.fixedIVs.spa;
        $('#ivSpDef').value = encounter.fixedIVs.spd;
        $('#ivSpe').value = encounter.fixedIVs.spe;
      }
      
      // Set fixed moves
      if (encounter.fixedMoves) {
        encounter.fixedMoves.forEach((move, index) => {
          const moveSlot = index + 1;
          const moveInput = $(`#move${moveSlot}`);
          if (moveInput && move.id) {
            moveInput.value = String(move.id);
          }
        });
        refreshMoveExclusions();
      }
    }

    // Use detailed encounter for origin game / location / level if available.
    // If the currently selected game is valid, preserve it.
    const gameId = requestedEncounter && requestedGameId
      ? requestedGameId
      : detailedEnc
      ? (detailedEnc.games.includes(currentGame) ? currentGame : detailedEnc.games[0])
      : encounter.defaultOriginGame;

    // Set origin game (do this BEFORE met location so the
    // location list contains the correct entries for this game)
    if (gameId !== undefined) {
      const originGameSelect = $('#originGame');
      if (originGameSelect) {
        originGameSelect.value = String(gameId);
        updateStaticOriginGameLocking(speciesId);
        // Refresh location list for the new game
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(gameId));
        }
      }
    }

    // Set met location (prefer detailed encounter's location ID)
    const locationId = detailedEnc ? detailedEnc.location : encounter.defaultMetLocationId;
    if (locationId !== undefined) {
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        locationSelect.value = String(locationId);
      }
    } else if (encounter.defaultMetLocation) {
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        const location = LOCATIONS.find(loc => 
          loc[1] && loc[1].toLowerCase().includes(encounter.defaultMetLocation.toLowerCase())
        );
        if (location) {
          locationSelect.value = String(location[0]);
        }
      }
    }

    // Set met level and current level
    const metLevel = detailedEnc ? detailedEnc.level : encounter.defaultMetLevel;
    if (metLevel !== undefined) {
      const metLevelInput = $('#metLevel');
      const levelInput = $('#level');
      const sourceLevel = detailedEnc?.isEgg ? Math.max(IS_EGG_OVERRIDE_LEVEL, 5) : Math.max(1, metLevel);
      const currentLevel = getMinimumLevelForEncounterEvolution(speciesId, sourceSpeciesId, sourceLevel);
      if (metLevelInput) {
        metLevelInput.value = String(metLevel);
      }
      if (levelInput) {
        levelInput.value = String(currentLevel);
      }
      syncCurrentLevelMinimumAttribute();
      computeAndSetExpFromLevel();
    }

    // Set fateful encounter flag from detailed encounter or legacy data
    const isFateful = detailedEnc ? !!detailedEnc.fateful : !!encounter.defaultFatefulEncounter;
    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) {
      fatefulCheckbox.checked = isFateful;
    }

    // Set default ribbons if specified
    if (encounter.defaultRibbons) {
      if (encounter.defaultRibbons.national !== undefined) {
        const nationalRibbon = $('#ribbonNational');
        if (nationalRibbon) {
          nationalRibbon.checked = encounter.defaultRibbons.national;
        }
      }
    }

    // Handle fixed ball from detailed encounter
    if (detailedEnc && detailedEnc.fixedBall) {
      try {
        const ballEl = $('#ball');
        if (ballEl) {
          ballEl.value = String(detailedEnc.fixedBall);
        }
      } catch (e) {}
    }

    // For non-fixed events, apply legendary PID and IV preset based on selected nature
    if (!encounter.fixedEvent) {
      const natureIndex = Number($('#nature').value || 0);
      const originGame = gameId || 2;
      const preset = getLegendaryPreset(natureIndex, originGame);
      
      if (preset) {
        // Set PID
        const pidInput = $('#pid');
        if (pidInput) {
          pidInput.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
        }

        // Set IVs
        if (preset.ivs) {
          $('#ivHp').value = preset.ivs.hp;
          $('#ivAtk').value = preset.ivs.atk;
          $('#ivDef').value = preset.ivs.def;
          $('#ivSpAtk').value = preset.ivs.spa;
          $('#ivSpDef').value = preset.ivs.spd;
          $('#ivSpe').value = preset.ivs.spe;
        }
      }
    }

    // Update gender and ability
    updateGenderFromPID();
    $('#ability').value = '0';

    // Check if shiny
    checkShiny();
    
    // Update legality status after applying preset
    updateLegalityStatus();

    console.log(`Applied static preset for species ${speciesId} from encounter species ${sourceSpeciesId}`);

    // The exact encounter determines the current level and sometimes the game,
    // so populate ordinary defaults only after those values have been applied.
    // Fixed event moves remain authoritative.
    if (!encounter.fixedMoves?.length) {
      updateMovesForSpecies(speciesId, { preserveValue: false });
    }
  }

  /**
   * Apply roamer encounter preset: sets origin game, met location, met level,
   * IVs (truncated for non-Emerald), and PID using Method 1.
   */
  function applyRoamerPreset(speciesId) {
    if (!ROAMER_SPECIES[speciesId]) return;
    if (suppressPresetApply || pidFinderResultActive) return;

    const info = ROAMER_SPECIES[speciesId];
    const originGameSelect = $('#originGame');
    const currentGame = Number(originGameSelect?.value || 0);

    // If current game is not valid for this roamer, auto-select the first allowed game
    let gameId = info.games.includes(currentGame) ? currentGame : info.games[0];

    // Set origin game
    if (originGameSelect) {
      originGameSelect.value = String(gameId);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(gameId));
      }
    }

    // Set met location (Roaming uses Route 101 for FRLG beasts, Route 101 for RSE Lati@s)
    const locId = getRoamerMetLocation(speciesId);
    const locationSelect = $('#metLocation');
    if (locationSelect) locationSelect.value = String(locId);

    // Set met level and current level
    const metLevelInput = $('#metLevel');
    const levelInput = $('#level');
    if (metLevelInput) metLevelInput.value = String(info.level);
    if (levelInput) levelInput.value = String(info.level);
    computeAndSetExpFromLevel();

    // Lock origin game, met location, met level (like CXD mode)
    if (!manualOverrideActive) {
      const lockEl = (el) => { if (!el) return; el.disabled = true; el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; el.style.cursor = 'not-allowed'; };
      lockEl($('#metLocation'));
      lockEl($('#metLevel'));
    }

    // Lock/grey games that are not allowed for this roamer species
    updateRoamerGameLocking(speciesId);

    // Set fateful encounter (roamers do NOT have fateful encounter)
    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) {
      fatefulCheckbox.checked = false;
    }

    // Set IVs based on whether this roamer has the truncation bug
    const truncated = roamerHasTruncatedIVs(speciesId, gameId);
    const natureIndex = Number($('#nature').value || 0);
    const preset = getLegendaryPreset(natureIndex, gameId);
    if (preset && preset.ivs) {
      $('#ivHp').value = preset.ivs.hp;
      $('#ivAtk').value = truncated ? (preset.ivs.atk & 7) : preset.ivs.atk;
      $('#ivDef').value = truncated ? '0' : preset.ivs.def;
      $('#ivSpAtk').value = truncated ? '0' : preset.ivs.spa;
      $('#ivSpDef').value = truncated ? '0' : preset.ivs.spd;
      $('#ivSpe').value = truncated ? '0' : preset.ivs.spe;
    }

    // Apply PID from legendary preset (Method 1)
    if (preset) {
      const pidInput = $('#pid');
      if (pidInput) {
        pidInput.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
      }
    }

    updateGenderFromPID();
    $('#ability').value = '0';
    checkShiny();
    updateLegalityStatus();
  }

  /**
   * Lock/grey-out origin game options that are not allowed for the selected roamer species.
   * Called whenever the roamer species changes.
   */
  function updateRoamerGameLocking(speciesId) {
    const originGameSelect = $('#originGame');
    if (!originGameSelect) return;
    const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
    for (const opt of Array.from(originGameSelect.options)) {
      const gid = Number(opt.value);
      if (allowedGames.includes(gid)) {
        opt.disabled = false;
        opt.style.color = '';
      } else {
        opt.disabled = true;
        opt.style.color = '#666';
      }
    }
    // If current selection is not allowed, switch to first allowed
    const curGame = Number(originGameSelect.value);
    if (!allowedGames.includes(curGame) && allowedGames.length > 0) {
      originGameSelect.value = String(allowedGames[0]);
      // Re-apply preset with the corrected game
      if (!pidFinderResultActive && !suppressPresetApply) applyRoamerPreset(speciesId);
    }
  }

  // In hatched mode, keep Colosseum/XD visible in Origin Game but locked
  // unless Manual Override is active.
  function updateHatchedOriginGameLocking() {
    try {
      if (currentEncounterMode !== 'hatched') return;

      const originGameSelect = $('#originGame');
      if (!originGameSelect) return;

      const coloXdOption = Array.from(originGameSelect.options || [])
        .find(opt => Number(opt.value) === COLOSSEUM_XD_ORIGIN_GAME_ID);
      if (!coloXdOption) return;

      const shouldDisableColoXd = !manualOverrideActive;
      coloXdOption.hidden = false;
      coloXdOption.disabled = shouldDisableColoXd;
      coloXdOption.style.color = shouldDisableColoXd ? '#666' : '';

      if (!shouldDisableColoXd) return;
      if (Number(originGameSelect.value) !== COLOSSEUM_XD_ORIGIN_GAME_ID) return;

      const fallback = Array.from(originGameSelect.options || []).find(opt =>
        Number(opt.value) === 3 && !opt.disabled
      ) || Array.from(originGameSelect.options || []).find(opt =>
        !opt.disabled && Number(opt.value) !== COLOSSEUM_XD_ORIGIN_GAME_ID
      );

      if (!fallback) return;
      originGameSelect.value = String(fallback.value);

      const fallbackGameId = Number(fallback.value) || 3;
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(fallbackGameId));
      }

      const speciesId = Number($('#species')?.value) || 0;
      if (speciesId) {
        updateMovesForSpecies(speciesId, { preserveValue: true });
      }
      updateLegalityStatus();
    } catch (e) {} finally {
      syncSetupOriginGameSelector();
    }
  }

  /**
   * Unlock all origin game options (called when leaving roamer mode).
   */
  function unlockAllOriginGameOptions() {
    const originGameSelect = $('#originGame');
    if (!originGameSelect) return;
    for (const opt of Array.from(originGameSelect.options)) {
      opt.disabled = false;
      opt.style.color = '';
    }
  }

  /**
   * Get current encounter mode
   */
  function getEncounterMode() {
    return currentEncounterMode;
  }

  // Level input validation
  $('#level').addEventListener('input', (e) => {
    // Allow typing freely (don't enforce minimums while user types).
    try {
      syncCurrentLevelMinimumAttribute();
      const valRaw = e.target.value;
      if (valRaw === '') return; // allow empty while typing
      const val = Number(valRaw) || 0;
      if (val > 100) e.target.value = '100';
      // Do not force values <1 here to avoid snapping while typing (e.g., typing 74)
      try { updateStatGraph(); } catch (e) {}
    } catch (e) {}
  });

  // Enforce bounds and event-specific minimums when the user leaves the field
  $('#level').addEventListener('blur', (e) => {
    try {
      let val = Number(e.target.value) || 0;
      if (val < 1) val = 1;
      // Enforce mode-specific minimums when leaving the field.
      try {
        if (currentEncounterMode === 'hatched') {
          val = Math.max(val, getCurrentLevelFloor());
        }
      } catch (eee) {}
      if (val > 100) val = 100;
        try {
        if (currentEncounterMode === 'mystery') {
          const tag = String(document.getElementById('mysteryEvent')?.value || '').toUpperCase();
          if (tag === '10ANNI' && val < 70) val = 70;
          else if (tag === 'AURA_MEW' && val < 10) val = 10;
          else if ((tag === 'AGETO_CELEBI' || tag === 'MITSURIN_CELEBI') && val < 10) val = 10;
          else if (tag === 'BOX_EVENT' && val < 5) val = 5;
          else if ((tag === 'DOEL_DEOXYS' || tag === 'SPACE_CENTER_DEOXYS') && val < 70) val = 70;
          else if (tag === 'JOURNEY_ACROSS_AMERICA' && val < 70) val = 70;
          else if (tag === 'PARTY_OF_THE_DECADE' && val < 70) val = 70;
          else if (tag === 'POKEMON_ROCKS_METANG' && val < 30) val = 30;
          else if ((tag === 'WISHMKR_BEST' || tag === 'WISHMKR_SHINY' || isBerryFixMysteryTag(tag)) && val < 5) val = 5;
          }
          // Legendary Mew: if in legendaries mode and species is Mew (151), enforce min level 30
          else if (currentEncounterMode === 'static') {
            try {
              const sp = Number($('#species')?.value || 0);
              if (sp === 151 && val < 30) val = 30;
            } catch (eee) {}
          }
      } catch (ee) {}
      val = Math.max(val, getCurrentLevelFloor());
      try {
        if (shouldApplyIsEggOverrides()) {
          val = IS_EGG_OVERRIDE_LEVEL;
        }
      } catch (eee) {}
      if (String(e.target.value) !== String(val)) {
        e.target.value = String(val);
      }
      try { computeAndSetExpFromLevel(); } catch (e) {}
      try { updateStatGraph(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
      // Re-filter moves: in non-hatched modes the available level-up moves
      // depend on the Pokémon's level, so update the dropdowns.
      try { refreshMoveExclusions(); } catch (e) {}
    } catch (e) {}
  });

  // EXP sync: when species or level changes, compute total EXP; when EXP edited (advanced), adjust level
  function computeAndSetExpFromLevel() {
    const sid = Number($('#species')?.value || 0);
    const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
    const lvl = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
    const exp = expForLevel(group, lvl);
    const expEl = document.querySelector('#expTotal');
    if (expEl) expEl.value = String(exp);
    try { updateStatGraph(); } catch (e) {}
  }

  const ENCOUNTER_MODE_CHECKBOX_IDS = new Set([
    'shiny', 'isEgg', 'fatefulEncounter', 'autoSheenEnabled',
    'markCircle', 'markTriangle', 'markSquare', 'markHeart',
    'ribbonChampion', 'ribbonWinning', 'ribbonVictory', 'ribbonArtist', 'ribbonEffort',
    'ribbonBattleChampion', 'ribbonRegionalChampion', 'ribbonNationalChampion',
    'ribbonCountry', 'ribbonNational', 'ribbonEarth', 'ribbonWorld'
  ]);

  const ENCOUNTER_MODE_FIELD_IDS = [
    'mysteryEvent', 'staticCategory', 'staticEncounter', 'species', 'shadowEncounter', 'cxdTradeEncounter', 'unownForm',
    'nickname', 'level', 'expTotal', 'pid', 'nature', 'ability', 'pidParityPreference', 'gender',
    'item', 'ball', 'originGame', 'metLocation', 'metLevel',
    'tid', 'sid', 'shiny', 'otName', 'otGender', 'language', 'isEgg',
    'ivHp', 'ivAtk', 'ivDef', 'ivSpAtk', 'ivSpDef', 'ivSpe',
    'evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpe',
    'move1', 'move2', 'move3', 'move4', 'pp1', 'pp2', 'pp3', 'pp4',
    'friendship', 'pokerusStatus', 'fatefulEncounter',
    'contestCool', 'contestBeauty', 'contestCute', 'contestSmart', 'contestTough', 'contestSheen', 'autoSheenEnabled',
    'markCircle', 'markTriangle', 'markSquare', 'markHeart',
    'ribbonCool', 'ribbonBeauty', 'ribbonCute', 'ribbonSmart', 'ribbonTough',
    'ribbonChampion', 'ribbonWinning', 'ribbonVictory', 'ribbonArtist', 'ribbonEffort',
    'ribbonBattleChampion', 'ribbonRegionalChampion', 'ribbonNationalChampion',
    'ribbonCountry', 'ribbonNational', 'ribbonEarth', 'ribbonWorld',
    'hiddenPowerTypeSelect'
  ];

  function readEncounterModeField(id) {
    const el = document.getElementById(id);
    if (!el) return undefined;
    if (ENCOUNTER_MODE_CHECKBOX_IDS.has(id)) return Boolean(el.checked);
    if ('value' in el) return String(el.value ?? '');
    return undefined;
  }

  function writeEncounterModeField(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (ENCOUNTER_MODE_CHECKBOX_IDS.has(id)) {
      el.checked = Boolean(value);
      return;
    }
    if ('value' in el) {
      el.value = value == null ? '' : String(value);
    }
  }

  function captureCurrentEncounterModeState() {
    const fields = {};
    for (const id of ENCOUNTER_MODE_FIELD_IDS) {
      const v = readEncounterModeField(id);
      if (v !== undefined) fields[id] = v;
    }
    return {
      manualOverrideActive: Boolean(manualOverrideActive),
      nicknameState: nicknameLocalizationState,
      fields
    };
  }

  function applyEncounterModeState(state) {
    if (!state) return;
    const fields = state.fields || {};
    const overrideCb = document.getElementById('manualOverride');
    manualOverrideActive = Boolean(state.manualOverrideActive);
    if (overrideCb) overrideCb.checked = manualOverrideActive;
    try { _syncLegalModeToggle?.(); } catch (e) {}

    for (const id of ENCOUNTER_MODE_FIELD_IDS) {
      if (Object.prototype.hasOwnProperty.call(fields, id)) {
        writeEncounterModeField(id, fields[id]);
      }
    }
    restoreNicknameState(state.nicknameState);

    try {
      const gameId = Number($('#originGame')?.value || 3);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(gameId));
      }
      if (Object.prototype.hasOwnProperty.call(fields, 'metLocation')) {
        writeEncounterModeField('metLocation', fields.metLocation);
      }
    } catch (e) {}
  }

  function getSelectedOptionLabel(id, fallback = '') {
    const element = document.getElementById(id);
    const option = Array.from(element?.options || []).find(candidate => String(candidate.value) === String(element.value));
    return option?.textContent?.trim() || fallback;
  }

  function getRecentGenerationLabels() {
    const speciesId = Number($('#species')?.value || 0);
    const speciesName = SPECIES.find(([id]) => Number(id) === speciesId)?.[1] || 'Pokémon';
    const categoryLabels = {
      hatched: 'Hatched',
      wild: 'Wild',
      static: 'Static',
      roamer: 'Roamer',
      mystery: 'Event',
      cxd_shadow: 'Colosseum-XD',
      cxd_trade: 'In-game trade',
      imported: 'Imported',
    };
    const categoryName = categoryLabels[currentEncounterMode] || 'Encounter';
    let encounterName = categoryName;
    if (currentEncounterMode === 'static') encounterName = getSelectedOptionLabel('staticCategory', 'Static');
    else if (currentEncounterMode === 'mystery') encounterName = getSelectedOptionLabel('mysteryEvent', 'Event');
    else if (currentEncounterMode === 'cxd_shadow') encounterName = getSelectedOptionLabel('shadowEncounter', 'Shadow');
    else if (currentEncounterMode === 'cxd_trade') encounterName = getSelectedOptionLabel('cxdTradeEncounter', 'Trade');
    else if (currentEncounterMode === 'wild') encounterName = `${getSelectedOptionLabel('originGame', 'Game')} wild`;
    else if (currentEncounterMode === 'hatched') encounterName = `${getSelectedOptionLabel('originGame', 'Game')} egg`;
    const titlePart = value => String(value || '')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48);
    return {
      speciesName,
      categoryName,
      encounterName,
      title: [speciesName, categoryName, encounterName].map(titlePart).filter(Boolean).join('_'),
    };
  }

  function createSemanticSnapshot(modeState) {
    const fields = { ...(modeState?.fields || {}) };
    const value = id => fields[id] ?? '';
    return {
      version: 1,
      speciesId: Number(value('species')) || 0,
      encounter: {
        mode: currentEncounterMode,
        originGameId: Number(value('originGame')) || 0,
        mysteryEventId: value('mysteryEvent'),
        staticCategoryId: value('staticCategory'),
        staticEncounterId: value('staticEncounter'),
        shadowEncounterId: value('shadowEncounter'),
        tradeEncounterId: value('cxdTradeEncounter'),
      },
      pokemon: {
        nickname: value('nickname'),
        level: Number(value('level')) || 1,
        experience: Number(value('expTotal')) || 0,
        pid: value('pid'),
        natureId: Number(value('nature')) || 0,
        abilitySlot: Number(value('ability')) || 0,
        gender: value('gender'),
        heldItemId: Number(value('item')) || 0,
        ballId: Number(value('ball')) || 0,
        metLocationId: Number(value('metLocation')) || 0,
        metLevel: Number(value('metLevel')) || 0,
        isEgg: Boolean(value('isEgg')),
        fatefulEncounter: Boolean(value('fatefulEncounter')),
        trainer: {
          tid: Number(value('tid')) || 0,
          sid: Number(value('sid')) || 0,
          otName: value('otName'),
          otGender: value('otGender'),
          languageId: Number(value('language')) || 2,
        },
        ivs: ['ivHp', 'ivAtk', 'ivDef', 'ivSpAtk', 'ivSpDef', 'ivSpe'].map(id => Number(value(id)) || 0),
        evs: ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpe'].map(id => Number(value(id)) || 0),
        moves: [1, 2, 3, 4].map(index => ({
          moveId: Number(value(`move${index}`)) || 0,
          ppUps: Number(value(`pp${index}`)) || 0,
        })),
        friendship: Number(value('friendship')) || 0,
        pokerusStatus: value('pokerusStatus'),
        contest: {
          cool: Number(value('contestCool')) || 0,
          beauty: Number(value('contestBeauty')) || 0,
          cute: Number(value('contestCute')) || 0,
          smart: Number(value('contestSmart')) || 0,
          tough: Number(value('contestTough')) || 0,
          sheen: Number(value('contestSheen')) || 0,
        },
      },
      // Stable field keys make migrations straightforward even if the visual
      // builder flow, element order, or grouping changes in a later release.
      builderFields: fields,
    };
  }

  function semanticSnapshotToModeState(semantic) {
    if (!semantic || typeof semantic !== 'object') return null;
    const pokemon = semantic.pokemon || {};
    const trainer = pokemon.trainer || {};
    const encounter = semantic.encounter || {};
    const ivs = Array.isArray(pokemon.ivs) ? pokemon.ivs : [];
    const evs = Array.isArray(pokemon.evs) ? pokemon.evs : [];
    const moves = Array.isArray(pokemon.moves) ? pokemon.moves : [];
    const explicitFields = {
      species: semantic.speciesId,
      originGame: encounter.originGameId,
      mysteryEvent: encounter.mysteryEventId,
      staticCategory: encounter.staticCategoryId,
      staticEncounter: encounter.staticEncounterId,
      shadowEncounter: encounter.shadowEncounterId,
      cxdTradeEncounter: encounter.tradeEncounterId,
      nickname: pokemon.nickname,
      level: pokemon.level,
      expTotal: pokemon.experience,
      pid: pokemon.pid,
      nature: pokemon.natureId,
      ability: pokemon.abilitySlot,
      gender: pokemon.gender,
      item: pokemon.heldItemId,
      ball: pokemon.ballId,
      metLocation: pokemon.metLocationId,
      metLevel: pokemon.metLevel,
      isEgg: pokemon.isEgg,
      fatefulEncounter: pokemon.fatefulEncounter,
      tid: trainer.tid,
      sid: trainer.sid,
      otName: trainer.otName,
      otGender: trainer.otGender,
      language: trainer.languageId,
      ivHp: ivs[0], ivAtk: ivs[1], ivDef: ivs[2], ivSpAtk: ivs[3], ivSpDef: ivs[4], ivSpe: ivs[5],
      evHp: evs[0], evAtk: evs[1], evDef: evs[2], evSpAtk: evs[3], evSpDef: evs[4], evSpe: evs[5],
      move1: moves[0]?.moveId, move2: moves[1]?.moveId, move3: moves[2]?.moveId, move4: moves[3]?.moveId,
      pp1: moves[0]?.ppUps, pp2: moves[1]?.ppUps, pp3: moves[2]?.ppUps, pp4: moves[3]?.ppUps,
      friendship: pokemon.friendship,
      pokerusStatus: pokemon.pokerusStatus,
      contestCool: pokemon.contest?.cool,
      contestBeauty: pokemon.contest?.beauty,
      contestCute: pokemon.contest?.cute,
      contestSmart: pokemon.contest?.smart,
      contestTough: pokemon.contest?.tough,
      contestSheen: pokemon.contest?.sheen,
    };
    const compactExplicitFields = Object.fromEntries(
      Object.entries(explicitFields).filter(([, value]) => value !== undefined && value !== null)
    );
    return {
      manualOverrideActive: false,
      nicknameState: null,
      fields: {
        ...(semantic.builderFields && typeof semantic.builderFields === 'object' ? semantic.builderFields : {}),
        ...compactExplicitFields,
      },
    };
  }

  function restorePidFinderSnapshot(pidFinder = {}) {
    pidFinderResultActive = Boolean(pidFinder.resultActive);
    pidFinderHadSelection = Boolean(pidFinder.hadSelection || pidFinder.resultActive);
    pidFinderLockedMetLevel = Boolean(pidFinder.lockedMetLevel);
    pidFinderOriginalTid = Number(pidFinder.originalTid) || 0;
    pidFinderOriginalSid = Number(pidFinder.originalSid) || 0;
    pidFinderMysteryTag = String(pidFinder.mysteryTag || '');
    pidFinderResultAbilityBit = pidFinder.abilityBit == null ? null : Number(pidFinder.abilityBit);
    const statusElement = document.getElementById('pidFinderStatus');
    if (statusElement) statusElement.textContent = pidFinder.statusText || (pidFinderResultActive ? 'Legal PID set' : '');
  }

  function validateRestoredModeState(modeState) {
    const expectedSpecies = Number(modeState?.fields?.species || 0);
    if (expectedSpecies && Number($('#species')?.value || 0) !== expectedSpecies) return false;
    for (const id of ['mysteryEvent', 'staticCategory', 'staticEncounter', 'shadowEncounter', 'cxdTradeEncounter']) {
      const expected = modeState?.fields?.[id];
      if (expected != null && String(expected) && String(document.getElementById(id)?.value || '') !== String(expected)) return false;
    }
    return true;
  }

  function applyWorkspaceModeState(mode, modeState, pidFinderState) {
    const modeSelect = document.getElementById('encounterMode');
    if (!modeSelect?.querySelector(`option[value="${CSS.escape(String(mode))}"]`)) return false;

    pidFinderResultActive = false;
    pidFinderHadSelection = false;
    pidFinderLockedMetLevel = false;

    if (currentEncounterMode !== mode) {
      encounterModeStateCache[mode] = modeState;
      modeSelect.value = mode;
      modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      applyEncounterModeState(modeState);
      const speciesId = Number(modeState?.fields?.species || 0);
      try { updateSpeciesListForMode(); } catch (error) {}
      try { handleEncounterModeChange(speciesId); } catch (error) {}
    }

    applyEncounterModeState(modeState);
    if (mode === 'static') {
      document.getElementById('staticCategory')?.dispatchEvent(new Event('change', { bubbles: true }));
      applyEncounterModeState(modeState);
      document.getElementById('staticEncounter')?.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (mode === 'mystery') {
      document.getElementById('mysteryEvent')?.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (mode === 'cxd_shadow') {
      document.getElementById('shadowEncounter')?.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (mode === 'cxd_trade') {
      document.getElementById('cxdTradeEncounter')?.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const speciesId = Number(modeState?.fields?.species || 0);
    try { updateAbilitySelect(speciesId); } catch (error) {}
    try { updateMovesForSpecies(speciesId, { preserveValue: true }); } catch (error) {}
    applyEncounterModeState(modeState);
    restorePidFinderSnapshot(pidFinderState);
    try { _postImportUpdate?.(speciesId); } catch (error) {}
    try { updateTidSidLocking(); } catch (error) {}
    try { updateOtGenderLocking(); } catch (error) {}
    try { updatePidLocking(); } catch (error) {}
    try { updateIvLocking(); } catch (error) {}
    try { updateMetLevelLocking(); } catch (error) {}
    try { updateMakeShinyButton(); } catch (error) {}
    try { validateForm(); } catch (error) {}
    return validateRestoredModeState(modeState);
  }

  function restoreGeneratedOutput(generated) {
    if (!generated || typeof generated !== 'object') return;
    if (generated.codeTarget) setOutputCodeTarget(generated.codeTarget, { regenerate: false });
    if (generated.rawHex) {
      const pairs = String(generated.rawHex).match(/[0-9a-fA-F]{2}/g) || [];
      if (pairs.length >= 80) {
        $('#hexOutput').value = toFormattedHex(new Uint8Array(pairs.slice(0, 80).map(pair => parseInt(pair, 16))));
      }
    }
    if (generated.base64Text) {
      setBase64OutputText(generated.base64Text);
      setOutputTroubleshootingVisible(true);
      hideBase64CharacterInspector();
      markGeneratedCodeFresh();
    }
  }

  _captureProfileWorkspaceSnapshot = (bytes, base64Text) => {
    const modeState = captureCurrentEncounterModeState();
    const rawHex = bytes instanceof Uint8Array ? toHexString(bytes) : '';
    return {
      ...getRecentGenerationLabels(),
      snapshot: {
        schemaVersion: BUILDER_SNAPSHOT_SCHEMA_VERSION,
        exact: {
          mode: currentEncounterMode,
          uiState: modeState,
          pidFinder: {
            resultActive: pidFinderResultActive,
            hadSelection: pidFinderHadSelection,
            lockedMetLevel: pidFinderLockedMetLevel,
            originalTid: pidFinderOriginalTid,
            originalSid: pidFinderOriginalSid,
            mysteryTag: pidFinderMysteryTag,
            abilityBit: pidFinderResultAbilityBit,
            statusText: String(document.getElementById('pidFinderStatus')?.textContent || ''),
          },
        },
        semantic: createSemanticSnapshot(modeState),
        generated: {
          rawHex,
          base64Text: String(base64Text || ''),
          codeTarget: outputCodeTarget,
        },
      },
    };
  };

  _restoreProfileWorkspaceSnapshot = async snapshot => {
    if (!snapshot || typeof snapshot !== 'object') throw new Error('This generation has no restorable snapshot.');
    suppressProfileTrainerDefaults = true;
    let strategy = null;
    try {
      if (Number(snapshot.schemaVersion) === BUILDER_SNAPSHOT_SCHEMA_VERSION && snapshot.exact?.uiState) {
        const exactMode = String(snapshot.exact.mode || snapshot.semantic?.encounter?.mode || '');
        if (exactMode && exactMode !== 'imported' && applyWorkspaceModeState(exactMode, snapshot.exact.uiState, snapshot.exact.pidFinder)) {
          strategy = 'exact';
        }
      }
      if (!strategy && snapshot.semantic) {
        const semanticMode = String(snapshot.semantic.encounter?.mode || snapshot.exact?.mode || '');
        const semanticState = semanticSnapshotToModeState(snapshot.semantic);
        if (semanticMode && semanticMode !== 'imported' && semanticState && applyWorkspaceModeState(semanticMode, semanticState, snapshot.exact?.pidFinder)) {
          strategy = 'semantic';
        }
      }
      if (!strategy && snapshot.generated?.rawHex) {
        onLoadFromHex(snapshot.generated.rawHex);
        strategy = 'bytes';
      }
      if (!strategy) throw new Error('This generation could not be matched to the current builder.');
      restoreGeneratedOutput(snapshot.generated);
      lastProfileTrainerSignature = getProfileTrainerSignature();
      await new Promise(resolve => setTimeout(resolve, 0));
      return { strategy };
    } finally {
      suppressProfileTrainerDefaults = false;
    }
  };

  // Reset all mode-specific state to defaults to avoid carryover between modes
  function resetAllModeState() {
    try {
      selectedStaticEncounterDetail = null;
      clearImportedRoundTripState();
      // First-time mode visit defaults: clear values so nothing bleeds across modes.
      const defaults = {
        staticCategory: STATIC_DEFAULT_CATEGORY_ID,
        tid: DEFAULT_TID,
        sid: DEFAULT_SID,
        otGender: DEFAULT_OT_GENDER,
        pokerusStatus: DEFAULT_POKERUS_STATUS,
        autoSheenEnabled: DEFAULT_AUTO_SHEEN_ENABLED,
        friendship: DEFAULT_FRIENDSHIP,
        evHp: '0',
        evAtk: '0',
        evDef: '0',
        evSpAtk: '0',
        evSpDef: '0',
        evSpe: '0',
        contestCool: '0',
        contestBeauty: '0',
        contestCute: '0',
        contestSmart: '0',
        contestTough: '0',
        contestSheen: '0',
        pp1: DEFAULT_PP_UPS,
        pp2: DEFAULT_PP_UPS,
        pp3: DEFAULT_PP_UPS,
        pp4: DEFAULT_PP_UPS
      };

      for (const id of ENCOUNTER_MODE_FIELD_IDS) {
        if (Object.prototype.hasOwnProperty.call(defaults, id)) {
          writeEncounterModeField(id, defaults[id]);
        } else if (ENCOUNTER_MODE_CHECKBOX_IDS.has(id)) {
          writeEncounterModeField(id, false);
        } else {
          writeEncounterModeField(id, '');
        }
      }
      nicknameLocalizationState = createNicknameState();

      // Reset manual override for a fresh mode unless that mode has its own saved state.
      manualOverrideActive = false;
      const overrideCb = document.getElementById('manualOverride');
      if (overrideCb) overrideCb.checked = false;
      try { _syncLegalModeToggle?.(); } catch (e) {}

      // Re-enable all language options
      const langSel = $('#language');
      if (langSel && langSel.options) {
        for (const o of Array.from(langSel.options)) o.disabled = false;
      }

      // Clear sprite and form visibility for stale species
      try { updateSpeciesSprite(0); } catch (e) {}
      try { updateUnownFormVisibility(0); } catch (e) {}
      try { clearGeneratedOutputs(); } catch (e) {}

      // Clear GC TID/SID warning, PID/TID/SID warning and shadow encounter dropdown
      const gcWarn = document.getElementById('gcTidSidWarning');
      if (gcWarn) gcWarn.style.display = 'none';
      const rsWarn = document.getElementById('rsTidSidWarning');
      if (rsWarn) rsWarn.style.display = 'none';
      const pidWarn = document.getElementById('pidTidSidWarning');
      if (pidWarn) pidWarn.style.display = 'none';
      const shadowEnc = document.getElementById('shadowEncounter');
      if (shadowEnc) { shadowEnc.innerHTML = ''; }
      const cxdTradeEnc = document.getElementById('cxdTradeEncounter');
      if (cxdTradeEnc) { cxdTradeEnc.innerHTML = ''; }
      const shinyLockedLabel = document.getElementById('xdShinyLocked');
      if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
      const shinyFinderHint = document.getElementById('cxdShinyFinderHint');
      if (shinyFinderHint) shinyFinderHint.style.display = 'none';
      const makeShinyBtn = document.getElementById('makeShinyBtn');
      if (makeShinyBtn) makeShinyBtn.style.display = '';
      const shinyIndicatorBtn = document.getElementById('shinyIndicatorBtn');
      if (shinyIndicatorBtn) shinyIndicatorBtn.style.display = '';
      const makeShinyStatus = document.getElementById('makeShinyStatus');
      if (makeShinyStatus) {
        makeShinyStatus.style.display = '';
        makeShinyStatus.textContent = '';
      }
      try { updatePidLocking(); } catch (e) {}
    } catch (e) {}
  }

  // PID preset helpers: when in simple mode, select PID based on nature+gender.
  function getSelectedPreset(){
    const natureIndex = Number($('#nature').value || 0);
    const natureName = NATURES[natureIndex] || null;
    const gender = ($('#gender').value || 'male');
    if(!natureName) return null;
    const entry = PID_PRESETS[natureName];
    if(!entry) return null;
    // prefer explicit gender match, fallback to male, then female, then genderless
    return entry[gender] || entry.male || entry.female || entry.genderless || null;
  }

  function findPresetByPid(pid){
    const pidNum = parsePidInput(pid);
    for(const natureName of Object.keys(PID_PRESETS)){
      const entry = PID_PRESETS[natureName];
      for(const g of ['male','female','genderless']){
        if(entry && entry[g] && parsePidInput(entry[g].pid) === pidNum){
          return { nature: natureName, gender: g, preset: entry[g] };
        }
      }
    }
    return null;
  }

  function applyPresetIfSimple(){
    if (currentEncounterMode === 'imported') return;
    if (suppressPresetApply || pidFinderResultActive) return; 
    if (currentEncounterMode === 'mystery') return; // mystery uses its own presets
    if(document.body.classList.contains('mode-simple')){
      const preset = getSelectedPreset();
      if(preset){
        const pidEl = document.querySelector('#pid');
        if(pidEl) pidEl.value = '0x' + ((preset.pid >>> 0).toString(16).toUpperCase()).padStart(8,'0');
      }
    }
  }

  // When the PID input is changed (advanced mode or programmatic), if it matches a preset
  // update the IV inputs to reflect the preset IVs so advanced users see the correct IVs.
  // Also update the nature to match PID % 25 and check if shiny
  const pidEl = document.querySelector('#pid');
  if(pidEl){
    pidEl.addEventListener('input', (e) => {
      if (currentEncounterMode === 'imported') {
        checkShiny();
        return;
      }
      const val = parsePidInput(e.target.value);
      
      // Update nature to match PID
      const natureIndex = val % 25;
      const natureEl = document.querySelector('#nature');
      if(natureEl && natureEl.value !== String(natureIndex)){
        natureEl.value = String(natureIndex);
      }
      
      // Check if shiny
      checkShiny();
      
      // Update Unown form from PID
      updateUnownFormFromPID();
      // If Unown in wild mode, update met location to match new form
      if (Number($('#species')?.value || 0) === 201 && currentEncounterMode === 'wild') {
        filterUnownLocationsByForm();
      }
      
      // Check if PID matches a preset and update IVs
      // Skip when pidFinderResultActive so PID Finder results aren't overwritten
      if (!pidFinderResultActive) {
        const found = findPresetByPid(val);
        if(found && found.preset && found.preset.ivs){
          // populate IV inputs
          const ivs = found.preset.ivs;
          if(document.querySelector('#ivHp')) document.querySelector('#ivHp').value = String(ivs.hp);
          if(document.querySelector('#ivAtk')) document.querySelector('#ivAtk').value = String(ivs.atk);
          if(document.querySelector('#ivDef')) document.querySelector('#ivDef').value = String(ivs.def);
          if(document.querySelector('#ivSpAtk')) document.querySelector('#ivSpAtk').value = String(ivs.spa || ivs.spa === 0 ? ivs.spa : ivs.spa);
          if(document.querySelector('#ivSpDef')) document.querySelector('#ivSpDef').value = String(ivs.spd);
          if(document.querySelector('#ivSpe')) document.querySelector('#ivSpe').value = String(ivs.spe);
        }
      }
    });
  }

  // Check shiny status and update indicator
  checkShiny();

  // Also check shiny when TID or SID changes
  $('#tid').addEventListener('input', checkShiny);
  $('#sid').addEventListener('input', checkShiny);
  
  // Update checkbox disabled state when conditions change.
  // Do NOT disable while the user is typing a partial TID/SID; only
  // disable for events that explicitly lock shininess.
  function updateShinyCheckboxState() {
    try {
      const shinyCheckboxLocal = $('#shiny');
      if (!shinyCheckboxLocal) return;
      // If we're in mystery mode and the selected event requests a shiny lock,
      // enforce it here. Otherwise keep the control enabled so the user can
      // toggle shiny while entering TID/SID.
      if (currentEncounterMode === 'mystery') {
        const tag = ($('#mysteryEvent') && $('#mysteryEvent').value) ? String($('#mysteryEvent').value).toUpperCase() : '';
        const evt = MYSTERY_EVENTS[tag];
        if (tag === 'WISHMKR_SHINY') {
          shinyCheckboxLocal.checked = true;
          shinyCheckboxLocal.disabled = true;
          shinyCheckboxLocal.title = 'This event is always shiny.';
          return;
        }
        if (evt && evt.alwaysShiny) {
          shinyCheckboxLocal.checked = true;
          shinyCheckboxLocal.disabled = true;
          shinyCheckboxLocal.title = 'This event is always shiny.';
          return;
        }
        if (evt && evt.shinyLocked) {
          const unlockShinyLock = shouldUnlockCelebiShinyLock(tag, evt);
          if (!unlockShinyLock) shinyCheckboxLocal.checked = false;
          shinyCheckboxLocal.disabled = !unlockShinyLock;
          shinyCheckboxLocal.title = unlockShinyLock ? '' : 'This Pokémon is shiny locked!';
          return;
        }
      }
      // CXD encounters use their explicit shiny policy.
      if (currentEncounterMode === 'cxd_shadow') {
        const enc = getSelectedCXDEncounter();
        if (enc?.shinyLocked) {
          shinyCheckboxLocal.checked = false;
          shinyCheckboxLocal.disabled = true;
          shinyCheckboxLocal.title = 'This Colosseum/XD encounter is shiny locked';
          return;
        }
        shinyCheckboxLocal.disabled = true;
        shinyCheckboxLocal.title = 'Choose Shiny in Find Legal Encounter so PID, IVs, TID, and SID remain correlated';
        return;
      }
      if (currentEncounterMode === 'cxd_trade') {
        const trade = getSelectedCXDTrade();
        if (trade?.shinyLocked) {
          shinyCheckboxLocal.checked = false;
          shinyCheckboxLocal.disabled = true;
          shinyCheckboxLocal.title = 'This in-game trade Pokémon is shiny locked';
          return;
        }
        shinyCheckboxLocal.disabled = true;
        shinyCheckboxLocal.title = 'Choose Shiny in Find Legal Encounter so the GameCube RNG correlation remains valid';
        return;
      }
      // Default: ensure enabled, clear tooltip
      shinyCheckboxLocal.disabled = false;
      shinyCheckboxLocal.title = '';
      const shinyLockedLabel = document.getElementById('xdShinyLocked');
      if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
      const shinyFinderHint = document.getElementById('cxdShinyFinderHint');
      if (shinyFinderHint) shinyFinderHint.style.display = 'none';
    } catch (e) {}
  }

  function getMakeShinyContextKey() {
    const speciesId = Number($('#species')?.value || 0);
    const parts = [currentEncounterMode, speciesId];
    if (currentEncounterMode === 'mystery') {
      parts.push(String($('#mysteryEvent')?.value || '').toUpperCase());
    } else if (currentEncounterMode === 'cxd_shadow') {
      parts.push(String($('#shadowEncounter')?.value || ''));
    } else if (currentEncounterMode === 'cxd_trade') {
      parts.push(String($('#cxdTradeEncounter')?.value || ''));
    } else if (currentEncounterMode === 'static') {
      parts.push(String($('#staticCategory')?.value || ''), String($('#staticEncounter')?.value || ''));
    }
    return parts.join(':');
  }

  function rememberSidBeforeMakeShiny(pid, tid, sid, resultSid) {
    makeShinyUndoStateByMode[currentEncounterMode] = {
      kind: 'sid',
      mode: currentEncounterMode,
      contextKey: getMakeShinyContextKey(),
      pid: pid >>> 0,
      tid: tid & 0xFFFF,
      sid: sid & 0xFFFF,
      resultSid: resultSid & 0xFFFF,
    };
  }

  function rememberPidBeforeMakeShiny(pid, tid, sid, resultPid, pidText = '') {
    makeShinyUndoStateByMode[currentEncounterMode] = {
      kind: 'pid',
      mode: currentEncounterMode,
      contextKey: getMakeShinyContextKey(),
      pid: pid >>> 0,
      pidText: String(pidText),
      tid: tid & 0xFFFF,
      sid: sid & 0xFFFF,
      resultPid: resultPid >>> 0,
    };
  }

  function getMakeShinyUndoState(mode = currentEncounterMode) {
    return makeShinyUndoStateByMode[mode] || null;
  }

  function hasUndoableMakeShinyState(pid, tid, sid, isShiny) {
    const state = getMakeShinyUndoState();
    if (!state || !isShiny) return false;
    if (state.mode !== currentEncounterMode) return false;
    if (state.contextKey !== getMakeShinyContextKey()) return false;
    if (state.kind === 'sid') {
      return state.pid === (pid >>> 0)
        && state.tid === (tid & 0xFFFF)
        && state.resultSid === (sid & 0xFFFF);
    }
    if (state.kind === 'pid') {
      return state.tid === (tid & 0xFFFF)
        && state.sid === (sid & 0xFFFF)
        && state.resultPid === (pid >>> 0);
    }
    return false;
  }

  function restoreSidBeforeMakeShiny(pid, tid) {
    const state = getMakeShinyUndoState();
    if (!state || state.kind !== 'sid') return null;
    if (state.mode !== currentEncounterMode) return null;
    if (state.contextKey !== getMakeShinyContextKey()) return null;
    if (state.pid !== (pid >>> 0)) return null;
    if (state.tid !== (tid & 0xFFFF)) return null;

    const restoredSid = state.sid & 0xFFFF;
    clearMakeShinyUndoState();
    return restoredSid;
  }

  function restorePidBeforeMakeShiny(tid, sid) {
    const state = getMakeShinyUndoState();
    if (!state || state.kind !== 'pid') return null;
    if (state.mode !== currentEncounterMode) return null;
    if (state.contextKey !== getMakeShinyContextKey()) return null;
    if (state.tid !== (tid & 0xFFFF)) return null;
    if (state.sid !== (sid & 0xFFFF)) return null;

    const restoredPid = {
      value: state.pid >>> 0,
      text: state.pidText,
    };
    clearMakeShinyUndoState();
    return restoredPid;
  }

  function clearMakeShinyUndoState(mode = currentEncounterMode) {
    delete makeShinyUndoStateByMode[mode];
  }

  function clearSidBeforeMakeShiny() {
    if (suppressMakeShinyUndoClear) return;
    clearMakeShinyUndoState();
    const status = document.getElementById('makeShinyStatus');
    if (status) status.textContent = '';
  }

  function setInputValueForMakeShiny(element, value) {
    if (!element) return;
    suppressMakeShinyUndoClear = true;
    try {
      element.value = String(value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      suppressMakeShinyUndoClear = false;
    }
  }

  // Handle shiny checkbox
  const shinyCheckbox = $('#shiny');
  if (shinyCheckbox) {
    $('#tid').addEventListener('input', updateShinyCheckboxState);
    $('#sid').addEventListener('input', updateShinyCheckboxState);
    $('#tid').addEventListener('input', clearSidBeforeMakeShiny);
    $('#sid').addEventListener('input', clearSidBeforeMakeShiny);
    updateShinyCheckboxState(); // Initial check
    
    // When shiny checkbox is clicked
    shinyCheckbox.addEventListener('change', (e) => {
      // CXD shininess must be selected inside the PID Finder. Changing only
      // SID here would invalidate the correlated trainer/PID result.
      if (currentEncounterMode === 'cxd_shadow' || currentEncounterMode === 'cxd_trade') {
        checkShiny();
        return;
      }

      const tid = Number($('#tid').value) & 0xFFFF;
      const natureIndex = Number($('#nature').value);
      const gender = $('#gender').value;
      const speciesId = Number($('#species').value) || 0;
      const ability = Number($('#ability').value);
      
      // Captures and hatcher-owned gifts can keep their legal PID and adjust
      // the recipient's SID. Fixed-trainer events use the finder instead.
      const shinyPolicy = getCurrentShinyControlPolicy();
      const shouldAdjustSid = currentEncounterMode === 'static'
        || currentEncounterMode === 'wild'
        || currentEncounterMode === 'roamer'
        || (currentEncounterMode === 'mystery' && shinyPolicy.kind === SHINY_CONTROL_KIND.DIRECT);
      if (shouldAdjustSid) {
        const pid = parsePidInput($('#pid').value);
        
        if (e.target.checked) {
          // Calculate SID to make this PID shiny
          // For shiny: (pidHigh ^ pidLow ^ tid ^ sid) < 8
          // We want xor = 0 for most reliable shiny (square shiny in later gens)
          const pidHigh = (pid >>> 16) & 0xFFFF;
          const pidLow = pid & 0xFFFF;
          const currentSid = Number($('#sid').value) & 0xFFFF;
          const newSid = (pidHigh ^ pidLow ^ tid) & 0xFFFF;
          rememberSidBeforeMakeShiny(pid, tid, currentSid, newSid);
          setInputValueForMakeShiny($('#sid'), newSid);
        } else {
          const pidHigh = (pid >>> 16) & 0xFFFF;
          const pidLow = pid & 0xFFFF;
          const restoredSid = restoreSidBeforeMakeShiny(pid, tid);
          const newSid = restoredSid ?? ((pidHigh ^ pidLow ^ tid ^ 8) & 0xFFFF);
          setInputValueForMakeShiny($('#sid'), newSid);
        }
      } else {
        // For hatched mode, change PID as before
        const sid = Number($('#sid').value) & 0xFFFF;
        
        if (e.target.checked) {
          // Calculate a shiny PID with the correct gender and ability
          const shinyPID = calculateShinyPID(tid, sid, natureIndex, gender, speciesId, ability, getPidParityPreferenceForSpecies(speciesId));
          rememberPidBeforeMakeShiny(parsePidInput($('#pid').value), tid, sid, shinyPID, $('#pid').value);
          setInputValueForMakeShiny($('#pid'), '0x' + shinyPID.toString(16).toUpperCase().padStart(8, '0'));
        } else {
          // Undo restores the exact previous PID; a direct checkbox toggle
          // without undo history still creates a compatible non-shiny PID.
          const restoredPid = restorePidBeforeMakeShiny(tid, sid);
          const nonShinyPID = restoredPid?.value ?? calculateNonShinyPID(tid, sid, natureIndex, gender, speciesId, ability, getPidParityPreferenceForSpecies(speciesId));
          const nextPidText = restoredPid
            ? restoredPid.text
            : '0x' + nonShinyPID.toString(16).toUpperCase().padStart(8, '0');
          setInputValueForMakeShiny($('#pid'), nextPidText);
        }
        
        // Update gender based on new PID (should match what we requested)
        updateGenderFromPID();
        
        // Update ability based on new PID
        const abilityFromPID = ($('#pid').value ? parsePidInput($('#pid').value) & 1 : 0);
        const specId = Number($('#species').value) || 0;
        const specAbs = getSpeciesAbilities(specId);
        if (abilityFromPID === 1 && specAbs && specAbs[0] === specAbs[1]) {
          $('#ability').value = '0';
        } else {
          $('#ability').value = String(abilityFromPID);
        }
      }
      
      // Update shiny indicator
      checkShiny();
      try { updateMakeShinyButton(); } catch (e) {}
      try { updateGCTidSidWarning(); } catch (e) {}
      try { updateRSTidSidWarning(); } catch (e) {}
      try { updatePidTidSidWarning(); } catch (e) {}
      try { validateForm(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
      
      // Update previous values so changes are detected
      if (typeof previousNature !== 'undefined') previousNature = String(natureIndex);
      if (typeof previousGender !== 'undefined') previousGender = gender;
      if (typeof previousAbility !== 'undefined') previousAbility = String(ability);
    });
  }
  
  // Update gender when PID changes
  const pidInput = $('#pid');
  if (pidInput) {
    pidInput.addEventListener('input', () => {
      clearSidBeforeMakeShiny();
      updateGenderFromPID();
      checkShiny();
      updateMakeShinyButton();
      try { updatePidTidSidWarning(); } catch (e) {}
    });
  }

  /* Keep the compact shiny indicator in sync. Shiny changes are configured
     inside Set Legal PID/Shiny. */
  const shinyIndicatorBtn = document.getElementById('shinyIndicatorBtn');

  function updateMakeShinyButton() {
    const pid = parsePidInput($('#pid').value);
    const tid = Number($('#tid').value) & 0xFFFF;
    const sid = Number($('#sid').value) & 0xFFFF;
    const pidHigh = (pid >>> 16) & 0xFFFF;
    const pidLow = pid & 0xFFFF;
    const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
    const isShiny = xor < 8;
    if (shinyIndicatorBtn) {
      shinyIndicatorBtn.classList.toggle('active', isShiny);
    }
  }

  $('#tid').addEventListener('input', updateMakeShinyButton);
  $('#sid').addEventListener('input', updateMakeShinyButton);
  updateMakeShinyButton();

  // Wire nature/gender changes to apply preset PID when in simple mode
  const natureEl = document.querySelector('#nature');
  const genderEl = document.querySelector('#gender');
  
  // Track previous values to detect actual changes
  let previousGender = genderEl ? genderEl.value : null;
  
  const abilityEl = document.querySelector('#ability');
  let previousAbility = abilityEl ? abilityEl.value : null;

  const pidParityEl = document.querySelector('#pidParityPreference');
  if (pidParityEl) {
    pidParityEl.addEventListener('change', () => {
      const speciesId = Number($('#species').value) || 0;
      syncPidParityPreferenceUi();
      if (!shouldShowPidParityPreference(speciesId)) return;

      clearSidBeforeMakeShiny();

      if ((currentEncounterMode === 'wild' || currentEncounterMode === 'static') && hasPidFinderSelectionState()) {
        unlockPidFinderFields({ clearPid: true });
        const status = document.getElementById('pidFinderStatus');
        if (status) status.textContent = 'PID parity changed. Select a new legal encounter.';
      }

      if (currentEncounterMode === 'hatched') {
        const pidEl = document.querySelector('#pid');
        const currentPid = parsePidInput(pidEl?.value || '');
        const pref = getPidParityPreferenceForSpecies(speciesId);
        if (pidEl && !matchesPidParity(currentPid, pref)) {
          const tid = Number($('#tid').value) & 0xFFFF;
          const sid = Number($('#sid').value) & 0xFFFF;
          const natureIndex = Number($('#nature').value);
          const gender = $('#gender').value;
          const ability = Number($('#ability').value);
          const isCurrentlyShiny = ((((currentPid >>> 16) ^ (currentPid & 0xFFFF)) ^ (tid ^ sid)) < 8);
          const newPid = isCurrentlyShiny
            ? calculateShinyPID(tid, sid, natureIndex, gender, speciesId, ability, pref)
            : calculateNonShinyPID(tid, sid, natureIndex, gender, speciesId, ability, pref);
          pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8, '0');
          try { pidEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
        }
      }

      checkShiny();
      try { updateMakeShinyButton(); } catch (e) {}
      try { validateForm(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    });
  }
  
  if(natureEl) {
    natureEl.addEventListener('change', () => {
      if (currentEncounterMode === 'imported') {
        validateForm();
        updateLegalityStatus();
        return;
      }
      clearSidBeforeMakeShiny();
      applyPresetIfSimple();
      
      // Always uncheck shiny when nature changes
      const shinyCheckbox = document.querySelector('#shiny');
      if (shinyCheckbox && shinyCheckbox.checked) {
        shinyCheckbox.checked = false;
      }
      
      // If we're in mystery mode, apply per-event presets first.
      // Skip while a PID Finder selection is active so selected PID/IVs remain authoritative.
      if (!suppressPresetApply && !pidFinderResultActive && currentEncounterMode === 'mystery') {
        const speciesId = Number($('#species').value) || 0;
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag) {
          applyMysteryPresetForSpecies(speciesId);
          return; // do not fall-through to other preset logic
        }
      }

      // If we're in static, wild, or roamer mode, apply per-nature PID/IV presets
      // Also skip when pidFinderResultActive (PID Finder selected a result)
      if (!suppressPresetApply && !pidFinderResultActive && (currentEncounterMode === 'static' || currentEncounterMode === 'wild' || currentEncounterMode === 'roamer')) {
        const speciesId = Number($('#species').value) || 0;
        const targetNature = Number(natureEl.value || 0);

        // Determine origin game.
        // Static mode uses the selected origin game when available (fallback to encounter default),
        // wild/roamer use the selected origin game (fallback to 2).
        let originGame = 2;
        if (currentEncounterMode === 'static') {
          const sourceSpeciesId = Number(getSelectedStaticEncounter()?.species || speciesId);
          const encounter = STATIC_ENCOUNTERS[sourceSpeciesId];
          // Fixed-event statics must keep their predetermined PID/IVs.
          if (encounter?.fixedEvent && encounter.fixedPID !== undefined) {
            const fixedPid = encounter.fixedPID >>> 0;
            const pidEl = document.querySelector('#pid');
            if (pidEl) {
              pidEl.value = '0x' + fixedPid.toString(16).toUpperCase().padStart(8, '0');
            }
            const fixedNature = fixedPid % 25;
            if (natureEl.value !== String(fixedNature)) {
              natureEl.value = String(fixedNature);
            }
            if (encounter.fixedIVs) {
              $('#ivHp').value = encounter.fixedIVs.hp;
              $('#ivAtk').value = encounter.fixedIVs.atk;
              $('#ivDef').value = encounter.fixedIVs.def;
              $('#ivSpAtk').value = encounter.fixedIVs.spa;
              $('#ivSpDef').value = encounter.fixedIVs.spd;
              $('#ivSpe').value = encounter.fixedIVs.spe;
            }
            updateGenderFromPID();
            $('#ability').value = '0';
            updateLegalityStatus();
            originGame = null;
          } else {
            const og = Number($('#originGame')?.value);
            originGame = Number.isFinite(og) && og > 0 ? og : (encounter?.defaultOriginGame || 2);
          }
        } else {
          // Wild/roamer mode: use the selected origin game if present
          const og = Number($('#originGame')?.value);
          originGame = Number.isFinite(og) && og > 0 ? og : 2;
        }

        if (originGame !== null) {
          const preset = getLegendaryPreset(targetNature, originGame);
          if (preset) {
            const pidEl = document.querySelector('#pid');
            if (pidEl) {
              pidEl.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
            }

            if (preset.ivs) {
              // For truncated roamers, override IVs with truncated values
              if (currentEncounterMode === 'roamer' && roamerHasTruncatedIVs(speciesId, originGame)) {
                $('#ivHp').value = preset.ivs.hp;
                $('#ivAtk').value = preset.ivs.atk & 7;
                $('#ivDef').value = '0';
                $('#ivSpAtk').value = '0';
                $('#ivSpDef').value = '0';
                $('#ivSpe').value = '0';
              } else {
                $('#ivHp').value = preset.ivs.hp;
                $('#ivAtk').value = preset.ivs.atk;
                $('#ivDef').value = preset.ivs.def;
                $('#ivSpAtk').value = preset.ivs.spa;
                $('#ivSpDef').value = preset.ivs.spd;
                $('#ivSpe').value = preset.ivs.spe;
              }
            }

            // Update gender from PID
            updateGenderFromPID();

            // For legendaries/roamers, force ability to 0; for wild, derive ability bit from PID
            if (currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
              $('#ability').value = '0';
            } else {
              // Only set ability to 1 if the species actually has two different abilities
              const abilityBit = preset.pid & 1;
              const specAbilities = getSpeciesAbilities(speciesId);
              if (abilityBit === 1 && specAbilities && specAbilities[0] === specAbilities[1]) {
                $('#ability').value = '0'; // single-ability species, slot 1 doesn't exist in dropdown
              } else {
                $('#ability').value = String(abilityBit);
              }
            }

            updateLegalityStatus();
          }
        }
      } else if (!suppressPresetApply && !pidFinderResultActive) {
        // Normal mode: calculate PID to match the selected nature
        const pidEl = document.querySelector('#pid');
        if(pidEl){
          const currentPid = parsePidInput(pidEl.value);
          const targetNature = Number(natureEl.value || 0);
          const currentNature = currentPid % 25;
          
          // If PID is 0 or nature doesn't match, generate a new PID
          if(currentPid === 0 || currentNature !== targetNature){
            // Generate a new non-shiny PID with correct nature, gender, and ability
            const tid = Number($('#tid').value) & 0xFFFF;
            const sid = Number($('#sid').value) & 0xFFFF;
            const gender = $('#gender').value;
            const speciesId = Number($('#species').value) || 0;
            const ability = Number($('#ability').value);
            const newPid = calculateNonShinyPID(tid, sid, targetNature, gender, speciesId, ability, getPidParityPreferenceForSpecies(speciesId));
            pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          }
        }
      }
      
      // Update shiny indicator after PID change
      checkShiny();
    });
  }
  if(genderEl) {
    genderEl.addEventListener('change', () => {
      if (currentEncounterMode === 'imported') return;
      clearSidBeforeMakeShiny();
      const currentGender = genderEl.value;
      const actuallyChanged = currentGender !== previousGender;
      
      applyPresetIfSimple();
      
      // Only uncheck shiny if gender actually changed
      if (actuallyChanged) {
        const shinyCheckbox = document.querySelector('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          shinyCheckbox.checked = false;
          checkShiny();
        }
      }
      
      // Update previous value AFTER checking
      previousGender = currentGender;
      
      // Adjust PID to match the selected gender (works in both simple and advanced modes)
      const pidEl = document.querySelector('#pid');
      if(pidEl){
        const currentPid = parsePidInput(pidEl.value);
        const speciesId = Number($('#species').value) || 0;
        const genderThreshold = getGenderThreshold(speciesId);
        const currentGenderByte = currentPid & 0xFF;
        
        // Check if current PID matches selected gender
        let needsChange = false;
        if (currentGender === 'female' && currentGenderByte >= genderThreshold) {
          needsChange = true;
        } else if (currentGender === 'male' && currentGenderByte < genderThreshold) {
          needsChange = true;
        }
        
        if (needsChange) {
          // Generate a new non-shiny PID with correct nature, gender, and ability
          const tid = Number($('#tid').value) & 0xFFFF;
          const sid = Number($('#sid').value) & 0xFFFF;
          const natureIndex = Number($('#nature').value);
          const ability = Number($('#ability').value);
          const newPid = calculateNonShinyPID(tid, sid, natureIndex, currentGender, speciesId, ability, getPidParityPreferenceForSpecies(speciesId));
          pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          checkShiny();
        }
      }
    });
  }
  
  if(abilityEl) {
    abilityEl.addEventListener('change', () => {
      if (currentEncounterMode === 'imported') return;
      clearSidBeforeMakeShiny();
      const currentAbility = abilityEl.value;
      const actuallyChanged = currentAbility !== previousAbility;
      
      // Only uncheck shiny if ability actually changed
      if (actuallyChanged) {
        const shinyCheckbox = document.querySelector('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          shinyCheckbox.checked = false;
          checkShiny();
        }
      }
      
      // Update previous value AFTER checking
      previousAbility = currentAbility;
      
      // Adjust PID to match the selected ability (works in both simple and advanced modes)
      const pidEl = document.querySelector('#pid');
      if(pidEl){
        const currentPid = parsePidInput(pidEl.value);
        const currentAbilityBit = currentPid & 1;
        const targetAbility = Number(currentAbility);
        
        if (currentAbilityBit !== targetAbility) {
          // Generate a new non-shiny PID with correct nature, gender, and ability
          const tid = Number($('#tid').value) & 0xFFFF;
          const sid = Number($('#sid').value) & 0xFFFF;
          const natureIndex = Number($('#nature').value);
          const gender = $('#gender').value;
          const speciesId = Number($('#species').value) || 0;
          const newPid = calculateNonShinyPID(tid, sid, natureIndex, gender, speciesId, targetAbility, getPidParityPreferenceForSpecies(speciesId));
          pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          checkShiny();
        }
      }
    });
  }

  // When EXP is typed (advanced mode) update level to match
  const expEl = document.querySelector('#expTotal');
  if (expEl) {
    expEl.addEventListener('input', (e) => {
      const sid = Number($('#species')?.value || 0);
      const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
      // Cap at max EXP for level 100
      const maxExp = expForLevel(group, 100);
      const val = Math.max(0, Math.min(maxExp, Math.floor(Number(e.target.value) || 0)));
      e.target.value = String(val);
      const lvl = levelForExp(group, val);
      $('#level').value = String(lvl);
      try { updateStatGraph(); } catch (ex) {}
      try { refreshMoveExclusions(); } catch (ex) {}
    });
  }

  // Recompute when species or level changes
  speciesAutocomplete.addEventListener('change', computeAndSetExpFromLevel);
  $('#level').addEventListener('change', () => {
    computeAndSetExpFromLevel();
    refreshMoveExclusions();
  });
  // initialize
  computeAndSetExpFromLevel();

  // Move selection is handled by updateMovesForSpecies / refreshMoveExclusions
  // which filter by species learnset, encounter mode, level, and cross-slot dupes.

  // PP selects exist as dropdowns (0-3) so no typing clamp needed; keep them defaulted

  // IV and EV input handling: clamp values and enforce EV total
  const ivIds = ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'];
  const evIds = ['#evHp','#evAtk','#evDef','#evSpAtk','#evSpDef','#evSpe'];

  const clampInt = (v, min, max) => {
    if (v === '' || v === null) return '';
    const n = Number(v) || 0;
    if (n > max) return String(max);
    if (n < min) return String(min);
    return String(Math.floor(n));
  };

  // IVs: cap each at 31 and update Hidden Power
  ivIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 31);
      updateHiddenPower();
      try { updateStatGraph(); } catch (e) {}
    });
  });
  
  // Initialize Hidden Power display
  updateHiddenPower();

  // In hatched mode, selecting Hidden Power type auto-applies a 70 BP IV spread.
  const hiddenPowerTypeSelect = $('#hiddenPowerTypeSelect');
  if (hiddenPowerTypeSelect) {
    hiddenPowerTypeSelect.addEventListener('change', (e) => {
      const typeName = String(e.target?.value || '');
      applyHiddenPowerType70(typeName);
    });
  }

  // Contest stats: cap each at 255 and keep Sheen legal when auto mode is enabled.
  const contestFlavorIds = ['#contestCool', '#contestBeauty', '#contestCute', '#contestSmart', '#contestTough'];
  const contestIds = [...contestFlavorIds, '#contestSheen'];
  contestIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 255);
      try { updateContestSheenAuto({ markImportedDirty: true }); } catch (ex) {}
      try { updateLegalityStatus(); } catch (ex) {}
    });
  });

  const autoSheenEl = document.querySelector('#autoSheenEnabled');
  if (autoSheenEl) {
    autoSheenEl.addEventListener('change', () => {
      try { updateContestStatsLocking(); } catch (e) {}
      try { updateContestSheenAuto({ markImportedDirty: true }); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    });
  }

  // EVs: cap each at 252 and ensure total <= 510 by reducing the changed field
  evIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      // First cap the individual value to 252
      e.target.value = clampInt(e.target.value, 0, 252);

      // Then enforce total <= 510 by reducing this field if necessary
      const values = evIds.map(id => Number((document.querySelector(id)?.value) || 0));
      const sum = values.reduce((a,b)=>a+b,0);
      if (sum > 510) {
        const over = sum - 510;
        const cur = Number(e.target.value) || 0;
        const newVal = Math.max(0, cur - over);
        e.target.value = String(newVal);
      }
      try { updateStatGraph(); } catch (e) {}
    });
  });

  // TID and SID: allow leading zeros (common user confusion from trainer card),
  // but strip non-digit characters and cap the numeric value at 65535.
  const clampIdField = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { e.target.value = ''; return; }
    const n = Number(raw);
    // Only replace when the numeric value exceeds the cap
    e.target.value = n > 65535 ? '65535' : raw;
  };
  $('#tid').addEventListener('input', (e) => {
    clampIdField(e);
    try { updateGCTidSidWarning(); } catch (ex) {}
    try { updateRSTidSidWarning(); } catch (ex) {}
    try { updatePidTidSidWarning(); } catch (ex) {}
    try { validateForm(); } catch (ex) {}
    try { updateLegalityStatus(); } catch (ex) {}
    e.target.classList.remove('field-error');
  });

  $('#sid').addEventListener('input', (e) => {
    clampIdField(e);
    try { updateGCTidSidWarning(); } catch (ex) {}
    try { updateRSTidSidWarning(); } catch (ex) {}
    try { updatePidTidSidWarning(); } catch (ex) {}
    try { validateForm(); } catch (ex) {}
    try { updateLegalityStatus(); } catch (ex) {}
    e.target.classList.remove('field-error');
  });

  // Friendship: cap at 0-255
  const friendshipEl = document.querySelector('#friendship');
  if (friendshipEl) {
    friendshipEl.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 255);
    });
  }

  const pokerusStatusEl = document.querySelector('#pokerusStatus');
  if (pokerusStatusEl) {
    pokerusStatusEl.addEventListener('change', () => {
      if (!suppressImportedDirtyTracking) pokerusDropdownDirty = true;
    });
  }

  // Met Level: cap at 0-100
  const metLevelEl = document.querySelector('#metLevel');
  if (metLevelEl) {
    metLevelEl.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 100);
      const changed = clampCurrentLevelToMinimum();
      if (changed) {
        try { computeAndSetExpFromLevel(); } catch (ex) {}
        try { refreshMoveExclusions(); } catch (ex) {}
      }
    });
  }


  // Output tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector(`[data-tab-content="${tab}"]`)?.classList.add('active');
    });
  });

  document.querySelectorAll('.code-target-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setOutputCodeTarget(btn.dataset.codeTarget, { regenerate: true });
    });
  });
  setOutputCodeTarget(outputCodeTarget);

  // Output help: prepare the clickable Metang sprite.
  const codeHelpInline = $('#codeHelpInline');
  const codeHelpMetangSprite = $('#codeHelpMetangSprite');
  if (codeHelpInline && codeHelpMetangSprite) {
    const metangOnlineSprite = getOnlineSpriteUrl('Metang', false);
    const metangLocalSprite = getSpritePath('Metang');

    if (metangOnlineSprite || metangLocalSprite) {
      if (metangLocalSprite) {
        codeHelpMetangSprite.onerror = () => {
          codeHelpMetangSprite.onerror = null;
          codeHelpMetangSprite.src = metangLocalSprite;
        };
      }
      codeHelpMetangSprite.src = metangOnlineSprite || metangLocalSprite;
    }

    setOutputTroubleshootingVisible(true);
  }

  const generateButton = $('#generateBtn');
  generateButton.addEventListener('click', () => {
    resetManualSwitchBoxConversion();
    onGenerate();
  });
  $('#randomizeIvsBtn')?.addEventListener('click', randomizeHatchedIvs);
  const preloadValidator = () => {
    void preloadPkhexValidator().catch(() => {
      // Generate still performs a normal lazy load and exposes Retry on error.
    });
  };
  generateButton.addEventListener('pointerenter', preloadValidator);
  generateButton.addEventListener('focus', preloadValidator);
  $('#pkhexReportBtn')?.addEventListener('click', openPkhexLegalityReport);
  $('#pkhexRetryBtn')?.addEventListener('click', retryPkhexVerification);
  $('#pkhexReportClose')?.addEventListener('click', closePkhexLegalityReport);
  document.getElementById('pkhexReportOverlay')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closePkhexLegalityReport();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('pkhexReportOverlay')?.classList.contains('open')) {
      closePkhexLegalityReport();
    }
  });
  const markStaleFromBuilderField = event => {
    const target = event.target;
    if (!target?.matches?.('input, select, textarea')) return;
    if (target.matches('.autocomplete-input')) return;
    if (!target.closest('#basicsCard, #builderDetailsCard')) return;
    markGeneratedCodeStale();
  };
  document.addEventListener('input', markStaleFromBuilderField);
  document.addEventListener('change', markStaleFromBuilderField);
  $('#convertSwitchBoxBtn')?.addEventListener('click', convertSelectedSwitchBox);
  $('#undoSwitchBoxConversionsBtn')?.addEventListener('click', undoSwitchBoxConversions);
  $('#copyHexBtn').addEventListener('click', ()=> {
    copy($('#hexOutput').value);
    showCopyConfirmation('copyHexCheck');
  });
  $('#copyBase64Btn').addEventListener('click', ()=> {
    copy(getBase64OutputText());
    showCopyConfirmation('copyBase64Check');
  });
  const base64Output = $('#base64Output');
  base64Output?.addEventListener('click', inspectBase64OutputCharacter);
  base64Output?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideBase64CharacterInspector();
  });
  const base64CodeDisplay = $('#base64CodeDisplay');
  base64CodeDisplay?.addEventListener('click', inspectBase64DisplayCharacter);
  base64CodeDisplay?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideBase64CharacterInspector();
  });
  renderBase64CodeDisplay(base64Output?.value || '');
  document.getElementById('base64CharacterInspector')?.addEventListener('click', hideBase64CharacterInspector);
  document.addEventListener('click', hideBase64CharacterInspectorFromOutsideClick, true);
  $('#loadFromHexBtn')?.addEventListener('click', onLoadFromHex);
  // Wire export/import buttons: keep .ek3 export, add .pk3 (decrypted) export,
  // and a unified Import Pokémon button that accepts .ek3 or .pk3 files.
  $('#exportEk3Btn')?.addEventListener('click', onExportPk3);
  $('#exportPk3Btn')?.addEventListener('click', () => {
    try {
      let bytes;
      let speciesId = Number($('#species')?.value || 0);

      if (isPristineImportedRoundTrip()) {
        bytes = convertEk3RawToPk3Canonical(importedRoundTripBytes, 100);
        try {
          const parsed = parsePokemonBytes(toHexString(importedRoundTripBytes));
          speciesId = Number(parsed.speciesId) || speciesId;
        } catch (e) {}
      } else {
        const cfg = collect();
        speciesId = cfg.speciesId;
        bytes = buildDecryptedPokemonFile(cfg);
      }

      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const speciesEntry = SPECIES.find(s => s[0] === speciesId);
      const speciesName = speciesEntry ? String(speciesEntry[1]) : 'Pokemon';
      // Prefer species name for filenames; sanitize and collapse underscores
      const rawName = speciesName || 'Pokemon';
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Pokemon';
      a.download = `${safeName}.pk3`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('Error exporting .pk3 file: ' + err.message);
    }
  });
  $('#importPokemonBtn')?.addEventListener('click', ()=> { $('#pk3FileInput').click(); });
  $('#pk3FileInput').addEventListener('change', onImportPk3);

  // Import Modal wiring
  $('#openImportBtn')?.addEventListener('click', openImportModal);
  $('#importModalClose')?.addEventListener('click', closeImportModal);
  document.getElementById('importOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeImportModal();
  });
  document.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.import-tab-content').forEach(c => c.classList.remove('active'));
      const target = document.querySelector(`[data-import-tab-content="${btn.dataset.importTab}"]`);
      if (target) target.classList.add('active');
      const errEl = document.getElementById('importError');
      if (errEl) errEl.style.display = 'none';
    });
  });
  $('#importSmogonBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('importError');
    const input = document.getElementById('importSmogonInput')?.value || '';
    if (!input.trim()) {
      if (errEl) { errEl.textContent = 'Please paste a Smogon/Showdown set first.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      const parsed = parseSmogonSet(input);
      if (!parsed) {
        if (errEl) { errEl.textContent = 'Could not parse the set. Make sure the species name matches a Gen 3 Pokémon.'; errEl.style.display = 'block'; }
        return;
      }
      applySmogonImport(parsed);
      closeImportModal();
    } catch (e) {
      if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    }
  });
  $('#importHexBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('importError');
    const input = document.getElementById('importHexInput')?.value || '';
    if (!input.trim()) {
      if (errEl) { errEl.textContent = 'Please paste hex data first.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      onLoadFromHex(input);
      closeImportModal();
    } catch (e) {
      if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    }
  });
  $('#importBase64Btn')?.addEventListener('click', () => {
    const errEl = document.getElementById('importError');
    const input = document.getElementById('importBase64Input')?.value || '';
    if (!input.trim()) {
      if (errEl) { errEl.textContent = 'Please paste Base64 data first.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      const parsed = parseBase64Emerald(input);
      onLoadFromHex(parsed.hex);
      closeImportModal();
    } catch (e) {
      if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    }
  });
  $('#importFileBtn')?.addEventListener('click', () => {
    $('#pk3FileInput').click();
    const fileInput = document.getElementById('pk3FileInput');
    const closeOnce = () => {
      closeImportModal();
      fileInput.removeEventListener('change', closeOnce);
    };
    fileInput.addEventListener('change', closeOnce);
  });

  // Any user edit in imported mode marks the imported round-trip snapshot as dirty.
  const markImportedDirty = (event) => {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;

    const id = target.id || '';
    const inDataCards = Boolean(target.closest('#basicsCard') || target.closest('#statsCard'));
    const shouldDirty = shouldMarkImportedDirtyFromEvent({
      event,
      suppressImportedDirtyTracking,
      currentEncounterMode,
      importedRoundTripBytes,
      targetId: id,
      inDataCards,
    });
    if (!shouldDirty) return;

    importedRoundTripDirty = true;
  };
  document.addEventListener('input', markImportedDirty, true);
  document.addEventListener('change', markImportedDirty, true);

  initPidFinder();
  if (startupSpeciesId) {
    speciesAutocomplete?.selectById?.(startupSpeciesId);
  } else if (startupSpeciesQuery) {
    const upgradedInput = speciesAutocomplete?.querySelector?.('.autocomplete-input');
    if (upgradedInput) {
      upgradedInput.value = startupSpeciesQuery;
      upgradedInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (startupSpeciesHadFocus) requestAnimationFrame(() => upgradedInput.focus());
    }
  }

  const profileSelectionFields = new Set([
    'species', 'originGame', 'encounterMode', 'mysteryEvent', 'staticCategory',
    'staticEncounter', 'shadowEncounter', 'cxdTradeEncounter',
  ]);
  document.addEventListener('change', event => {
    const selectionId = String(event.target?.id || '');
    if (profileSelectionFields.has(selectionId)) {
      queueActiveProfileTrainerDefaults();
    }
  });

  const games = Array.from(document.getElementById('originGame')?.options || [])
    .map(option => ({ value: Number(option.value), label: option.textContent.trim() }))
    .filter(option => option.value);
  const languages = Array.from(document.getElementById('language')?.options || [])
    .map(option => ({ value: Number(option.value), label: option.textContent.trim() }))
    .filter(option => option.value);
  initProfileWorkspace({
    games,
    languages,
    onActiveProfileChange: () => {
      lastProfileTrainerSignature = '';
      applyActiveProfileTrainerDefaults({ force: true });
    },
    onLoadRecent: recent => _restoreProfileWorkspaceSnapshot?.(recent.snapshot),
  }).then(controller => {
    profileWorkspaceController = controller;
    lastProfileTrainerSignature = '';
    applyActiveProfileTrainerDefaults({ force: true });
  }).catch(error => {
    console.warn('Trainer profiles are unavailable:', error);
  });
  delete window.__aceEarlySpeciesState;
}

function copy(text){
  if(!text) return;
  navigator.clipboard.writeText(text).catch(()=>{});
}

function showCopyConfirmation(elementId){
  const el = $('#' + elementId);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
  }, 1500);
}

// Check shiny status and update indicator
function checkShiny() {
  const pid = parsePidInput($('#pid').value);
  const tid = Number($('#tid').value) & 0xFFFF;
  const sid = Number($('#sid').value) & 0xFFFF;
  
  const pidHigh = (pid >>> 16) & 0xFFFF;
  const pidLow = pid & 0xFFFF;
  const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
  const isShiny = xor < 8;
  
  // Update all shiny indicators (advanced mode, simple mode, and make-shiny button)
  const indicators = [document.querySelector('#shinyIndicator'), document.querySelector('#shinyIndicatorSimple'), document.querySelector('#shinyIndicatorBtn')];
  indicators.forEach(indicator => {
    if (indicator) {
      if (isShiny) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    }
  });
  
  // Update shiny checkbox to reflect current state
  const shinyCheckbox = $('#shiny');
  if (shinyCheckbox) {
    shinyCheckbox.checked = isShiny;
  }

  try { updateMakeShinyVisibility(); } catch (e) {}

  // Refresh sprite to show shiny/normal version
  updateSpeciesSprite(Number($('#species').value) || 0);
}

function getDesiredPidParityForGeneration(speciesId, ability, preference) {
  const pref = normalizePidParityPreference(preference);
  if (pref === 'even') return 0;
  if (pref === 'odd') return 1;
  if (hasSingleNormalGen3Ability(speciesId)) return null;
  return Number(ability) & 1;
}

function enforceGenderByteParity(genderByte, desiredParity, targetGender, genderThreshold) {
  if (desiredParity == null || (genderByte & 1) === desiredParity) return genderByte;
  const adjusted = genderByte ^ 1;
  if (targetGender === 'female' && adjusted >= genderThreshold) return null;
  if (targetGender === 'male' && adjusted < genderThreshold) return null;
  return adjusted;
}

// Calculate a shiny PID for given TID/SID, nature, and gender
function calculateShinyPID(tid, sid, nature, targetGender, speciesId, ability, pidParityPreference = 'any') {
  // For a Pokémon to be shiny in Gen 3:
  // (pidHigh ^ pidLow ^ tid ^ sid) < 8
  // Nature = PID % 25
  // Gender is determined by lowest byte compared to species gender threshold
  // Dual-ability species use PID & 1 for ability. Single-ability species can
  // optionally filter PID parity without changing the stored ability slot.
  
  const genderThreshold = getGenderThreshold(speciesId);
  const desiredParity = getDesiredPidParityForGeneration(speciesId, ability, pidParityPreference);
  
  // Handle genderless species
  if (genderThreshold === -1) {
    // Just generate any shiny PID with correct nature
    targetGender = 'genderless';
  }
  
  // Strategy: Build pidLow with gender, calculate pidHigh for shiny, then verify nature and ability
  let attempts = 0;
  const maxAttempts = 10000;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Determine gender byte (lowest byte of PID)
    let genderByte;
    if (targetGender === 'female') {
      // Female: genderByte must be < threshold
      if (genderThreshold > 0) {
        genderByte = Math.floor(Math.random() * genderThreshold);
      } else {
        continue; // Can't be female (male-only species)
      }
    } else if (targetGender === 'male') {
      // Male: genderByte must be >= threshold
      if (genderThreshold < 255) {
        genderByte = genderThreshold + Math.floor(Math.random() * (256 - genderThreshold));
      } else {
        continue; // Can't be male (female-only species)
      }
    } else {
      // Genderless - any byte
      genderByte = Math.floor(Math.random() * 256);
    }
    
    genderByte = enforceGenderByteParity(genderByte, desiredParity, targetGender, genderThreshold);
    if (genderByte == null) continue;
    
    // Generate random second byte for lower 16 bits
    const byte1 = Math.floor(Math.random() * 256);
    
    // Construct pidLow (lower 16 bits)
    const pidLow = genderByte | (byte1 << 8);
    
    // Pick a random shiny XOR value (0-7)
    const shinyXor = Math.floor(Math.random() * 8);
    
    // Calculate pidHigh to make it shiny
    // shinyXor = pidHigh ^ pidLow ^ tid ^ sid
    // Therefore: pidHigh = shinyXor ^ pidLow ^ tid ^ sid
    const pidHigh = (shinyXor ^ pidLow ^ tid ^ sid) & 0xFFFF;
    
    // Construct full 32-bit PID
    const pid = ((pidHigh << 16) | pidLow) >>> 0;
    
    // Verify all constraints are met
    if ((pid & 0xFF) !== genderByte) continue;
    if (desiredParity != null && !matchesPidParity(pid, desiredParity === 0 ? 'even' : 'odd')) continue;
    if (pid % 25 !== nature) continue;
    
    const verifyXor = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (tid ^ sid);
    if (verifyXor >= 8) continue;
    
    return pid;
  }
  
  // Fallback: return a non-shiny PID with correct nature and gender
  console.warn('Could not generate shiny PID after', maxAttempts, 'attempts');
  
  let genderByte;
  if (targetGender === 'female') {
    genderByte = Math.floor(Math.random() * 127);
  } else {
    genderByte = 127 + Math.floor(Math.random() * 129);
  }
  
  // Find byte1 for correct nature
  let byte1 = 0;
  for (let i = 0; i < 256; i++) {
    const pidLow = genderByte | (i << 8);
    if (pidLow % 25 === nature) {
      byte1 = i;
      break;
    }
  }
  
  const adjustedGenderByte = enforceGenderByteParity(genderByte, desiredParity, targetGender, genderThreshold);
  if (adjustedGenderByte != null) genderByte = adjustedGenderByte;

  const pidLow = genderByte | (byte1 << 8);
  const pidHigh = Math.floor(Math.random() * 0x10000);
  
  return ((pidHigh << 16) | pidLow) >>> 0;
}

function calculateNonShinyPID(tid, sid, nature, targetGender, speciesId, ability, pidParityPreference = 'any') {
  // Generate a PID with correct nature/gender/ability/parity that is guaranteed NOT shiny
  const genderThreshold = getGenderThreshold(speciesId);
  const desiredParity = getDesiredPidParityForGeneration(speciesId, ability, pidParityPreference);
  
  if (genderThreshold === -1) {
    targetGender = 'genderless';
  }
  
  let attempts = 0;
  const maxAttempts = 10000;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Determine gender byte
    let genderByte;
    if (targetGender === 'female') {
      if (genderThreshold > 0) {
        genderByte = Math.floor(Math.random() * genderThreshold);
      } else {
        continue;
      }
    } else if (targetGender === 'male') {
      if (genderThreshold < 255) {
        genderByte = genderThreshold + Math.floor(Math.random() * (256 - genderThreshold));
      } else {
        continue;
      }
    } else {
      genderByte = Math.floor(Math.random() * 256);
    }
    
    genderByte = enforceGenderByteParity(genderByte, desiredParity, targetGender, genderThreshold);
    if (genderByte == null) continue;
    
    // Generate random second byte
    const byte1 = Math.floor(Math.random() * 256);
    const pidLow = genderByte | (byte1 << 8);
    
    // Generate random pidHigh
    const pidHigh = Math.floor(Math.random() * 0x10000);
    
    // Construct PID
    const pid = ((pidHigh << 16) | pidLow) >>> 0;
    
    // Verify it's the correct nature
    if (desiredParity != null && !matchesPidParity(pid, desiredParity === 0 ? 'even' : 'odd')) continue;
    if (pid % 25 !== nature) continue;
    
    // Verify it's NOT shiny
    const xor = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (tid ^ sid);
    if (xor >= 8) {
      // Not shiny and correct nature/gender - perfect!
      return pid;
    }
  }
  
  // Fallback: just return any non-shiny PID with correct nature/gender
  let genderByte;
  if (targetGender === 'female') {
    genderByte = genderThreshold > 0 ? Math.floor(Math.random() * genderThreshold) : 0;
  } else if (targetGender === 'male') {
    genderByte = genderThreshold < 255 ? genderThreshold + Math.floor(Math.random() * (256 - genderThreshold)) : 255;
  } else {
    genderByte = Math.floor(Math.random() * 256);
  }

  const adjustedGenderByte = enforceGenderByteParity(genderByte, desiredParity, targetGender, genderThreshold);
  if (adjustedGenderByte != null) genderByte = adjustedGenderByte;
  
  let byte1 = 0;
  for (let i = 0; i < 256; i++) {
    const pidLow = genderByte | (i << 8);
    if (pidLow % 25 === nature) {
      byte1 = i;
      break;
    }
  }
  
  const pidLow = genderByte | (byte1 << 8);
  // Generate pidHigh that ensures non-shiny (XOR >= 8)
  const pidHigh = ((tid ^ sid ^ pidLow) + 8) & 0xFFFF;
  
  return ((pidHigh << 16) | pidLow) >>> 0;
}

_createImportedSetPid = ({
  tid,
  sid,
  natureIndex,
  gender,
  speciesId,
  abilityBit,
  shiny,
}) => {
  const args = [
    Number(tid) & 0xFFFF,
    Number(sid) & 0xFFFF,
    Number(natureIndex) || 0,
    String(gender || 'male'),
    Number(speciesId) || 0,
    Number(abilityBit) === 1 ? 1 : 0,
    'any',
  ];
  return shiny
    ? calculateShinyPID(...args)
    : calculateNonShinyPID(...args);
};

// Update gender display based on PID
// In Gen 3, gender is determined by the lowest byte of PID vs species gender ratio
// For now, we'll just display the gender based on PID's lowest byte
// 0-126 = female for 50/50 species, 127-255 = male
function updateGenderFromPID() {
  if (currentEncounterMode === 'imported') return;
  const pidInput = $('#pid').value;
  if (!pidInput) return;
  
  const pid = parsePidInput(pidInput);
  const genderByte = pid & 0xFF;
  const speciesId = Number($('#species').value) || 0;
  const threshold = getGenderThreshold(speciesId);
  
  const genderSelect = $('#gender');
  if (genderSelect) {
    if (threshold === -1) {
      // Genderless - keep current selection or default to male
      return;
    } else if (threshold === 0) {
      genderSelect.value = 'male'; // Always male
    } else if (threshold === 255) {
      genderSelect.value = 'female'; // Always female
    } else {
      genderSelect.value = genderByte < threshold ? 'female' : 'male';
    }
  }
}

/* â”€â”€ PID Finder (RNG-legal PID search via Web Workers) â”€ */

let pfWorkers = [];
let pfWorkerSnapshots = [];
let pfAllResults = [];
let pfIsRoamerTruncated = false;

function initPidFinder() {
  const overlay  = document.getElementById('pidFinderOverlay');
  const btn      = document.getElementById('pidFinderBtn');
  const closeBtn = document.getElementById('pidFinderClose');
  const searchBtn   = document.getElementById('pfSearch');
  const stopBtn     = document.getElementById('pfStop');
  const progressFill = document.getElementById('pfProgressFill');
  const progressText = document.getElementById('pfProgressText');
  const resultsBody  = document.getElementById('pfResults');
  const resultCount  = document.getElementById('pfResultCount');
  const summaryEl    = document.getElementById('pidFinderSummary');
  const statusSpan   = document.getElementById('pidFinderStatus');
  const berryFixOtPrefEl = document.getElementById('berryFixOtPreference');
  const confirmBtn = document.getElementById('pfConfirm');
  const cancelBtn = document.getElementById('pfCancel');
  const pendingStatus = document.getElementById('pfPendingStatus');
  const pfPidInput = document.getElementById('pfPid');
  const wantShinyCheckbox = document.getElementById('pfWantShiny');
  const keepSidRadio = document.getElementById('pfShinyKeepSid');
  const autoSidRadio = document.getElementById('pfShinyAutoSid');
  const keepSidHatchedRecommendation = document.getElementById('pfKeepSidHatchedRecommendation');
  const shinyLockedMessage = document.getElementById('pfShinyLockedMessage');
  const searchWorkspace = document.getElementById('pfSearchWorkspace');
  const hatchedNotice = document.getElementById('pfHatchedNotice');
  const pfOriginGameRow = document.getElementById('pfOriginGameRow');
  const pfOriginGame = document.getElementById('pfOriginGame');
  const rngPanel = document.getElementById('pfRngManipulation');
  const rngWindowEnabled = document.getElementById('pfRngWindowEnabled');
  const rngStartSeedInput = document.getElementById('pfRngStartSeed');
  const rngMaxFrameInput = document.getElementById('pfRngMaxFrame');
  const rngPresetBtn = document.getElementById('pfRngPreset');
  const rngStatusBadge = document.getElementById('pfRngStatusBadge');
  const manipFrameHeader = document.getElementById('pfManipFrameHeader');
  let pendingPidFinderResult = null;
  let pendingPidFinderRow = null;
  let modalConfirmed = false;
  let modalOriginalOriginGame = '';
  let activeRngWindow = null;
  let activeSearchMetLocationId = null;

  if (!btn || !overlay) return;

  for (const id of ['tid', 'sid', 'pid']) {
    document.getElementById(id)?.addEventListener('input', () => {
      const sidStatus = document.getElementById('sidShinyStatus');
      if (sidStatus) sidStatus.textContent = '';
    });
  }

  const formatPidHex = pid => `0x${(Number(pid) >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const readCurrentMetLocationId = () => {
    const metLocation = $('#metLocation');
    const rawValue = String(metLocation?.value ?? '').trim();
    if (rawValue !== '') return Number(rawValue);

    // Searchable controls retain their display text separately from their ID.
    // Resolve that text as a fallback so the search and the eventual lock are
    // always tied to the location the user can actually see.
    const displayName = String(document.getElementById('metLocation-input')?.value || '').trim().toLowerCase();
    if (!displayName) return 0;
    const gameId = Number($('#originGame')?.value) || 3;
    const match = getLocationsForGame(gameId)
      .find(([, name]) => String(name || '').trim().toLowerCase() === displayName);
    return Number(match?.[0] ?? 0);
  };
  const hasValidPidFormat = value => /^(?:0x)?[0-9a-f]{1,8}$/i.test(String(value || '').trim());
  const hasValidPidText = value => hasValidPidFormat(value) && parsePidInput(value) !== 0;
  const invalidPidMessage = value => hasValidPidFormat(value) && parsePidInput(value) === 0
    ? 'PID 0x00000000 is not allowed because it has no valid encryption constant.'
    : 'Enter a PID from 0x00000001 to 0xFFFFFFFF.';
  const isShinyForIds = (pid, tid, sid) => {
    const value = Number(pid) >>> 0;
    return ((((value >>> 16) & 0xFFFF) ^ (value & 0xFFFF)) ^ ((Number(tid) & 0xFFFF) ^ (Number(sid) & 0xFFFF))) < 8;
  };
  const setMainSidValue = value => {
    const sidEl = $('#sid');
    if (!sidEl) return;
    sidEl.value = String(Number(value) & 0xFFFF);
    sidEl.dispatchEvent(new Event('input', { bubbles: true }));
    sidEl.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setMinimumIvDefaults = value => {
    const normalized = String(Math.max(0, Math.min(31, Number(value) || 0)));
    for (const id of ['pfMinHp', 'pfMinAtk', 'pfMinDef', 'pfMinSpA', 'pfMinSpD', 'pfMinSpe']) {
      const input = document.getElementById(id);
      if (input && !input.disabled) input.value = normalized;
    }
  };
  const formatRngSeed = seed => `0x${(Number(seed) >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const parseRngSeed = value => {
    const text = String(value || '').trim();
    if (!/^(?:0x)?[0-9a-f]{1,8}$/i.test(text)) return null;
    return Number.parseInt(text.replace(/^0x/i, ''), 16) >>> 0;
  };
  const getRngPresetForGame = gameId => {
    if (Number(gameId) === 3) return { seed: 0, label: 'Use Emerald startup seed (0x00000000)' };
    if (Number(gameId) === 1 || Number(gameId) === 2) {
      return { seed: 0x05A0, label: 'Use R/S dry-battery seed (0x000005A0)' };
    }
    return null;
  };
  const isRngManipulationAvailable = () => {
    const gameId = Number($('#originGame')?.value) || 0;
    return gameId >= 1 && gameId <= 5 &&
      (currentEncounterMode === 'wild' || currentEncounterMode === 'static' || currentEncounterMode === 'roamer');
  };

  function syncRngManipulationUi({ resetSeed = false } = {}) {
    const available = isRngManipulationAvailable();
    const enabled = Boolean(available && rngWindowEnabled?.checked);
    const gameId = Number($('#originGame')?.value) || 0;
    const preset = getRngPresetForGame(gameId);

    if (rngPanel) rngPanel.hidden = !available;
    if (rngStartSeedInput) rngStartSeedInput.disabled = !enabled;
    if (rngMaxFrameInput) rngMaxFrameInput.disabled = !enabled;
    if (rngPresetBtn) {
      rngPresetBtn.hidden = !preset;
      rngPresetBtn.disabled = !enabled;
      rngPresetBtn.textContent = preset?.label || '';
    }
    if (rngStatusBadge) {
      rngStatusBadge.textContent = enabled ? 'Active' : 'Optional';
      rngStatusBadge.classList.toggle('is-active', enabled);
    }
    if (resetSeed || !String(rngStartSeedInput?.value || '').trim()) {
      if (rngStartSeedInput) rngStartSeedInput.value = preset ? formatRngSeed(preset.seed) : '';
    }
    if (!available) activeRngWindow = null;
  }

  function readRngWindow() {
    if (!rngWindowEnabled?.checked || !isRngManipulationAvailable()) return null;
    const startSeed = parseRngSeed(rngStartSeedInput?.value);
    const maxFrame = Number(rngMaxFrameInput?.value);
    rngStartSeedInput?.classList.toggle('field-error', startSeed === null);
    rngMaxFrameInput?.classList.toggle(
      'field-error',
      !Number.isInteger(maxFrame) || maxFrame < 1 || maxFrame > 0x100000000,
    );
    if (startSeed === null || !Number.isInteger(maxFrame) || maxFrame < 1 || maxFrame > 0x100000000) {
      if (pendingStatus) pendingStatus.textContent = 'Enter a valid 1–8 digit hex starting state and maximum frame.';
      return false;
    }
    return { startSeed, maxFrame, maxAdvances: maxFrame - 1 };
  }

  function getModalShinyPolicy() {
    const { tag, event } = currentEncounterMode === 'mystery'
      ? getSelectedMysteryEvent()
      : { tag: '', event: null };
    const encounter = currentEncounterMode === 'cxd_shadow'
      ? getSelectedCXDEncounter()
      : currentEncounterMode === 'cxd_trade'
        ? getSelectedCXDTrade()
        : null;
    return getShinyControlPolicy({
      encounterMode: currentEncounterMode,
      eventTag: tag,
      event,
      pidMethod: getMysteryPidMethod(),
      encounter,
      unlockShinyLock: shouldUnlockCelebiShinyLock(tag, event),
    });
  }

  function canAutoSetGameCubeSid() {
    if (currentEncounterMode !== 'cxd_shadow') return false;
    const encounter = getSelectedCXDEncounter();
    if (!encounter || encounter.shinyLocked || encounter.fixedSID !== undefined) return false;
    // GameCube starters derive TID, SID, PID, and IVs from one encounter RNG
    // tuple, so changing only their SID would break that correlation.
    return !String(encounter.pidType || '').includes('STARTER');
  }

  function resetPendingResult(message = '') {
    pendingPidFinderResult = null;
    pendingPidFinderRow?.classList.remove('is-selected');
    pendingPidFinderRow = null;
    if (resultsBody) resultsBody.innerHTML = '';
    if (resultCount) resultCount.textContent = '';
    pfAllResults = [];
    if (confirmBtn) confirmBtn.disabled = currentEncounterMode !== 'hatched';
    setConfirmNextStep(false);
    if (pendingStatus && message) pendingStatus.textContent = message;
  }

  function setConfirmNextStep(active) {
    if (!confirmBtn) return;
    confirmBtn.classList.toggle('is-next-step', Boolean(active));
    if (active) confirmBtn.setAttribute('aria-current', 'step');
    else confirmBtn.removeAttribute('aria-current');
  }

  function generateHatchedPid() {
    if (currentEncounterMode !== 'hatched' || !pfPidInput) return;
    const speciesId = Number($('#species')?.value) || 0;
    const tid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
    const sid = Number(document.getElementById('pfSid')?.value) & 0xFFFF;
    const nature = Number($('#nature')?.value) || 0;
    const gender = $('#gender')?.value || 'male';
    const ability = Number($('#ability')?.value) || 0;
    const parity = normalizePidParityPreference($('#pidParityPreference')?.value);
    const wantsShiny = Boolean(wantShinyCheckbox?.checked);
    let pid = 0;
    for (let attempt = 0; attempt < 16 && pid === 0; attempt++) {
      pid = wantsShiny
        ? calculateShinyPID(tid, sid, nature, gender, speciesId, ability, parity)
        : calculateNonShinyPID(tid, sid, nature, gender, speciesId, ability, parity);
    }
    if (pid === 0) {
      if (confirmBtn) confirmBtn.disabled = true;
      if (pendingStatus) pendingStatus.textContent = 'Could not generate a valid non-zero PID. Try again.';
      return;
    }
    pfPidInput.value = formatPidHex(pid);
    if (confirmBtn) confirmBtn.disabled = false;
    if (pendingStatus) pendingStatus.textContent = `${wantsShiny ? 'Shiny' : 'Non-shiny'} PID ready. Confirm to apply it.`;
  }

  function syncShinyModeUi({ generateHatched = false } = {}) {
    const policy = getModalShinyPolicy();
    const pfShinyEl = document.getElementById('pfShiny');
    const pfSidEl = document.getElementById('pfSid');
    const sidLocked = pfSidEl?.dataset.encounterLocked === '1';
    const autoAllowed = !sidLocked && (
      policy.kind === SHINY_CONTROL_KIND.DIRECT ||
      (policy.kind === SHINY_CONTROL_KIND.FINDER && canAutoSetGameCubeSid())
    );
    const shinyLocked = policy.kind === SHINY_CONTROL_KIND.LOCKED;
    const alwaysShiny = policy.kind === SHINY_CONTROL_KIND.ALWAYS;

    if (keepSidHatchedRecommendation) {
      keepSidHatchedRecommendation.hidden = currentEncounterMode !== 'hatched';
    }

    if (wantShinyCheckbox) {
      if (shinyLocked) wantShinyCheckbox.checked = false;
      if (alwaysShiny) wantShinyCheckbox.checked = true;
      wantShinyCheckbox.disabled = shinyLocked || alwaysShiny;
    }
    const wantsShiny = Boolean(wantShinyCheckbox?.checked);
    wantShinyCheckbox?.closest('label')?.classList.toggle('is-disabled', Boolean(wantShinyCheckbox.disabled));
    if (shinyLockedMessage) {
      shinyLockedMessage.hidden = !shinyLocked;
      shinyLockedMessage.textContent = policy.message || 'This Pokémon cannot be shiny.';
    }

    if (alwaysShiny && keepSidRadio) keepSidRadio.checked = true;
    if (!wantsShiny || shinyLocked) {
      if (keepSidRadio) keepSidRadio.checked = false;
      if (autoSidRadio) autoSidRadio.checked = false;
    } else if (!autoAllowed && autoSidRadio?.checked && keepSidRadio) {
      keepSidRadio.checked = true;
    }
    if (keepSidRadio) keepSidRadio.disabled = !wantsShiny || shinyLocked || alwaysShiny;
    if (autoSidRadio) autoSidRadio.disabled = !wantsShiny || !autoAllowed || shinyLocked || alwaysShiny;
    keepSidRadio?.closest('.pid-shiny-option')?.classList.toggle('is-disabled', Boolean(keepSidRadio.disabled));
    autoSidRadio?.closest('.pid-shiny-option')?.classList.toggle('is-disabled', Boolean(autoSidRadio.disabled));

    const hasShinyStrategy = Boolean(keepSidRadio?.checked || autoSidRadio?.checked);
    const autoMode = Boolean(wantsShiny && autoSidRadio?.checked && !autoSidRadio.disabled);
    if (pfShinyEl) {
      pfShinyEl.checked = Boolean(wantsShiny && !autoMode);
      pfShinyEl.disabled = false;
    }

    if (pfSidEl) {
      pfSidEl.disabled = sidLocked || autoMode;
    }
    if (currentEncounterMode === 'hatched') {
      if (wantsShiny && !hasShinyStrategy) {
        if (confirmBtn) confirmBtn.disabled = true;
        if (pendingStatus) pendingStatus.textContent = 'Choose Auto-Set SID or Keep SID to continue.';
      } else if (autoMode) {
        if (pfPidInput && !hasValidPidText(pfPidInput.value)) generateHatchedPid();
        const validPid = hasValidPidText(pfPidInput?.value);
        if (confirmBtn) confirmBtn.disabled = !validPid;
        if (pendingStatus) pendingStatus.textContent = validPid
          ? 'Confirm to calculate an SID for this PID.'
          : invalidPidMessage(pfPidInput?.value);
      } else if (generateHatched) {
        const pid = parsePidInput(pfPidInput?.value || '0');
        const tid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
        const sid = Number(document.getElementById('pfSid')?.value) & 0xFFFF;
        if (!hasValidPidText(pfPidInput?.value) || isShinyForIds(pid, tid, sid) !== wantsShiny) {
          generateHatchedPid();
        } else {
          if (confirmBtn) confirmBtn.disabled = false;
          if (pendingStatus) pendingStatus.textContent = `${wantsShiny ? 'Shiny' : 'Non-shiny'} PID ready. Confirm to apply it.`;
        }
      }
    } else {
      resetPendingResult(wantsShiny && !hasShinyStrategy
        ? 'Choose Auto-Set SID or Keep SID before searching.'
        : `Search and select a legal ${wantsShiny ? 'shiny ' : 'non-shiny '}PID, then confirm your changes.`);
      if (searchBtn) searchBtn.disabled = Boolean(wantsShiny && !hasShinyStrategy);
    }
  }

  function clearActivePidFinderResult(reasonText) {
    const hasStatus = !!String(statusSpan?.textContent || '').trim();
    if (!pidFinderResultActive && !pidFinderHadSelection && !hasStatus) return;

    if (pidFinderResultActive) {
      if (typeof unlockPidFinderFieldsFn === 'function') {
        try { unlockPidFinderFieldsFn({ clearPid: true }); } catch (e) {}
      } else {
        pidFinderResultActive = false;
        pidFinderLockedMetLevel = false;
        pidFinderResultAbilityBit = null;
      }
    }

    const pidEl = $('#pid');
    if (pidEl) {
      pidEl.value = '';
      try { pidEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
    }
    pidFinderHadSelection = false;
    pidFinderMysteryTag = '';
    pidFinderResultAbilityBit = null;

    if (statusSpan) {
      statusSpan.textContent = reasonText || '';
    }

    try { updateBerryFixOtPreferenceUi(); } catch (e) {}
    try { checkShiny(); } catch (e) {}
    try { updateMakeShinyButton(); } catch (e) {}
    try { _updatePidTidSidWarning?.(); } catch (e) {}
    try { _validateForm?.(); } catch (e) {}
  }

  function maybeClearStaleMysteryGiftSelection(reasonText) {
    if (currentEncounterMode !== 'mystery') return;
    clearActivePidFinderResult(reasonText);
  }

  // Validate PID-finder TID/SID: strip non-digits, cap at 65535, preserve leading zeros
  const pfClampId = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { e.target.value = ''; return; }
    e.target.value = Number(raw) > 65535 ? '65535' : raw;
  };
  const pfTidInput = document.getElementById('pfTid');
  const pfSidInput = document.getElementById('pfSid');
  if (pfTidInput) pfTidInput.addEventListener('input', pfClampId);
  if (pfSidInput) pfSidInput.addEventListener('input', pfClampId);
  for (const input of [pfTidInput, pfSidInput]) {
    input?.addEventListener('input', () => {
      if (currentEncounterMode === 'hatched' && !autoSidRadio?.checked) {
        if (confirmBtn) confirmBtn.disabled = true;
        if (pendingStatus) pendingStatus.textContent = `TID or SID changed. Enter a ${wantShinyCheckbox?.checked ? 'shiny' : 'non-shiny'} PID for the new IDs before confirming.`;
      } else if (currentEncounterMode !== 'hatched') {
        resetPendingResult('Trainer IDs changed. Search and select a new legal PID.');
      }
    });
  }
  wantShinyCheckbox?.addEventListener('change', () => {
    const defaultSidMode = wantShinyCheckbox.checked
      ? getDefaultShinySidMode(currentEncounterMode)
      : '';
    if (keepSidRadio) keepSidRadio.checked = defaultSidMode === SHINY_SID_MODE.KEEP;
    if (autoSidRadio) autoSidRadio.checked = defaultSidMode === SHINY_SID_MODE.AUTO;
    syncShinyModeUi({ generateHatched: true });
    setMinimumIvDefaults(keepSidRadio?.checked ? 15 : 20);
  });
  for (const radio of [keepSidRadio, autoSidRadio]) {
    radio?.addEventListener('change', () => {
      if (radio.checked) {
        setMinimumIvDefaults(radio === keepSidRadio ? 15 : 20);
        syncShinyModeUi({ generateHatched: true });
      }
    });
  }
  pfPidInput?.addEventListener('input', () => {
    if (currentEncounterMode !== 'hatched') return;
    const valid = hasValidPidText(pfPidInput.value);
    const wantsShiny = Boolean(wantShinyCheckbox?.checked);
    const hasStrategy = Boolean(keepSidRadio?.checked || autoSidRadio?.checked);
    const autoMode = Boolean(wantsShiny && autoSidRadio?.checked && !autoSidRadio.disabled);
    const tid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
    const sid = Number(document.getElementById('pfSid')?.value) & 0xFFFF;
    const matches = valid && (autoMode || isShinyForIds(parsePidInput(pfPidInput.value), tid, sid) === wantsShiny);
    if (confirmBtn) confirmBtn.disabled = !valid || (wantsShiny && !hasStrategy) || !matches;
    if (pendingStatus) pendingStatus.textContent = !valid
      ? invalidPidMessage(pfPidInput.value)
      : wantsShiny && !hasStrategy
        ? 'Choose Auto-Set SID or Keep SID to continue.'
        : !matches
          ? `That PID is ${wantsShiny ? 'not shiny' : 'shiny'} for this TID/SID.`
          : autoMode
            ? 'Confirm to calculate an SID for this PID.'
            : 'Confirm to apply this PID.';
  });
  // Live re-filter when HP type / HP power filters change
  const pfHpTypeSelect = document.getElementById('pfHpType');
  const pfHpPowerInput = document.getElementById('pfHpPower');
  const refilter = () => { if (pfAllResults.length > 0) displayResults(); };
  if (pfHpTypeSelect) pfHpTypeSelect.addEventListener('change', refilter);
  if (pfHpPowerInput) pfHpPowerInput.addEventListener('input', refilter);

  const resetForRngWindowChange = () => {
    activeRngWindow = null;
    if (manipFrameHeader) manipFrameHeader.hidden = true;
    resetPendingResult('RNG frame window changed. Search and select a new legal PID.');
  };
  rngWindowEnabled?.addEventListener('change', () => {
    syncRngManipulationUi();
    resetForRngWindowChange();
  });
  rngStartSeedInput?.addEventListener('input', () => {
    rngStartSeedInput.classList.remove('field-error');
    resetForRngWindowChange();
  });
  rngStartSeedInput?.addEventListener('blur', () => {
    const seed = parseRngSeed(rngStartSeedInput.value);
    if (seed !== null) rngStartSeedInput.value = formatRngSeed(seed);
  });
  rngMaxFrameInput?.addEventListener('input', () => {
    rngMaxFrameInput.classList.remove('field-error');
    resetForRngWindowChange();
  });
  rngPresetBtn?.addEventListener('click', () => {
    const preset = getRngPresetForGame(Number($('#originGame')?.value) || 0);
    if (!preset || !rngStartSeedInput) return;
    rngStartSeedInput.value = formatRngSeed(preset.seed);
    rngStartSeedInput.classList.remove('field-error');
    resetForRngWindowChange();
  });

  if (berryFixOtPrefEl) {
    berryFixOtPrefEl.addEventListener('change', () => {
      if (isBerryFixMysteryEventSelected()) {
        maybeClearStaleMysteryGiftSelection('Berry Fix OT changed. Select a new legal encounter.');
      }
      try { updateBerryFixOtPreferenceUi(); } catch (e) {}
    });
  }

  const staleResultFilterIds = [
    'pfGender', 'pfAbility', 'pfPidParity', 'pfShiny', 'pfMinHp', 'pfMinAtk', 'pfMinDef', 'pfMinSpA', 'pfMinSpD', 'pfMinSpe',
    'pfMaxHp', 'pfMaxAtk', 'pfMaxDef', 'pfMaxSpA', 'pfMaxSpD', 'pfMaxSpe', 'pfHpType', 'pfHpPower'
  ];
  const staleResultMsg = 'Filters changed. Select a new legal encounter.';
  for (const id of staleResultFilterIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', () => maybeClearStaleMysteryGiftSelection(staleResultMsg));
    el.addEventListener('change', () => maybeClearStaleMysteryGiftSelection(staleResultMsg));
  }

  /* â”€â”€ Open / Close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function openModal() {
    modalConfirmed = false;
    modalOriginalOriginGame = String($('#originGame')?.value || '');
    pendingPidFinderResult = null;
    pendingPidFinderRow = null;
    if (wantShinyCheckbox) wantShinyCheckbox.checked = false;
    if (keepSidRadio) keepSidRadio.checked = false;
    if (autoSidRadio) autoSidRadio.checked = false;
    if (confirmBtn) confirmBtn.disabled = true;
    setConfirmNextStep(false);
    if (pendingStatus) pendingStatus.textContent = currentEncounterMode === 'hatched'
      ? 'The current non-shiny PID will be used when possible.'
      : 'Choose settings, then search for a legal PID.';

    // Populate summary from current form values
    const speciesId   = Number($('#species').value) || 0;
    const speciesEntry = SPECIES.find(s => s[0] === speciesId);
    const speciesName  = speciesEntry ? speciesEntry[1] : '\u2014';
    const sourceSpeciesId = getCurrentOriginSourceSpeciesId(speciesId);
    const sourceSpeciesEntry = SPECIES.find(s => s[0] === sourceSpeciesId);
    const sourceSpeciesName = sourceSpeciesEntry ? sourceSpeciesEntry[1] : '';
    const natureIndex  = Number($('#nature').value || 0);
    const natureName   = NATURES[natureIndex] || '\u2014';
    const ability      = Number($('#ability').value);
    let abilityName = '\u2014';
    try {
      const speciesAbilities = getSpeciesAbilities(speciesId);
      const abilityId = speciesAbilities?.[ability] ?? speciesAbilities?.[0];
      abilityName = getAbilityName(abilityId) || `Ability slot ${ability + 1}`;
    } catch (_) {}

    summaryEl.innerHTML = [
      `<span class="pf-summary-primary"><b>${speciesName}</b><span>\u2013</span><b>${natureName}</b><span>\u2013</span><b>${abilityName}</b></span>`,
      sourceSpeciesId && sourceSpeciesId !== speciesId
        ? `<span class="pf-tag">Encounter source: <b>${sourceSpeciesName}</b></span>`
        : ''
    ].filter(Boolean).join('');

    const isHatchedMode = currentEncounterMode === 'hatched';
    if (searchWorkspace) searchWorkspace.hidden = isHatchedMode;
    if (hatchedNotice) hatchedNotice.hidden = !isHatchedMode;
    if (pfPidInput) {
      pfPidInput.value = formatPidHex(parsePidInput($('#pid')?.value || '0'));
      pfPidInput.readOnly = !isHatchedMode;
    }

    const mainOriginGame = $('#originGame');
    if (pfOriginGame && mainOriginGame) {
      const availableGames = Array.from(mainOriginGame.options || []).filter(option => !option.disabled);
      pfOriginGame.innerHTML = availableGames
        .map(option => `<option value="${option.value}">${option.textContent}</option>`)
        .join('');
      pfOriginGame.value = String(mainOriginGame.value || '');
      const canChooseGame = !mainOriginGame.disabled && availableGames.length > 1;
      if (pfOriginGameRow) pfOriginGameRow.hidden = !canChooseGame;
    } else if (pfOriginGameRow) {
      pfOriginGameRow.hidden = true;
    }

    /* â”€â”€ Populate PID Finder Gender selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const pfGenderSel     = document.getElementById('pfGender');
    const gender          = $('#gender').value || 'male';
    const genderThreshold = getGenderThreshold(speciesId);

    if (genderThreshold === -1) {
      // Genderless species – lock to Genderless
      pfGenderSel.innerHTML = '<option value="genderless">Genderless</option>';
      pfGenderSel.disabled = true;
    } else if (genderThreshold === 0) {
      // Always male
      pfGenderSel.innerHTML = '<option value="male">Male (fixed)</option>';
      pfGenderSel.disabled = true;
    } else if (genderThreshold >= 254) {
      // Always female
      pfGenderSel.innerHTML = '<option value="female">Female (fixed)</option>';
      pfGenderSel.disabled = true;
    } else {
      // Variable gender – offer choices with "Any" option
      pfGenderSel.innerHTML =
        '<option value="male">Male</option>' +
        '<option value="female">Female</option>' +
        '<option value="any">Any</option>';
      pfGenderSel.disabled = false;
      pfGenderSel.value = gender;  // pre-select from main form
    }

    /* â”€â”€ Populate PID Finder Ability selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const pfAbilitySel = document.getElementById('pfAbility');
    try {
      const abilities = getSpeciesAbilities(speciesId);
      if (abilities) {
        const [a0Id, a1Id] = abilities;
        const a0Name = getAbilityName(a0Id) || 'Slot 0';
        const a1Name = getAbilityName(a1Id) || 'Slot 1';
        if (a0Id === a1Id) {
          // Single ability – lock to slot 0 but show "Any" since both slots are same
          pfAbilitySel.innerHTML = `<option value="-1">${a0Name} (Any)</option>`;
          pfAbilitySel.disabled = true;
        } else {
          pfAbilitySel.innerHTML =
            `<option value="0">${a0Name} (Slot 0)</option>` +
            `<option value="1">${a1Name} (Slot 1)</option>` +
            '<option value="-1">Any</option>';
          pfAbilitySel.disabled = false;
          pfAbilitySel.value = String(ability);
        }
      } else {
        pfAbilitySel.innerHTML =
          '<option value="0">Slot 0</option>' +
          '<option value="1">Slot 1</option>' +
          '<option value="-1">Any</option>';
        pfAbilitySel.disabled = false;
        pfAbilitySel.value = String(ability);
      }
    } catch (_) {
      pfAbilitySel.innerHTML =
        '<option value="0">Slot 0</option><option value="1">Slot 1</option><option value="-1">Any</option>';
      pfAbilitySel.disabled = false;
    }

    const pfPidParityRow = document.getElementById('pfPidParityRow');
    const pfPidParitySel = document.getElementById('pfPidParity');
    const showPidParity = shouldShowPidParityPreference(speciesId);
    if (pfPidParityRow) pfPidParityRow.hidden = !showPidParity;
    if (pfPidParitySel) {
      pfPidParitySel.disabled = !showPidParity;
      pfPidParitySel.value = showPidParity
        ? normalizePidParityPreference($('#pidParityPreference')?.value)
        : 'any';
    }

    /* Populate trainer IDs and reset the internal shiny-search flag. */
    const pfTidEl   = document.getElementById('pfTid');
    const pfSidEl   = document.getElementById('pfSid');
    const pfShinyEl = document.getElementById('pfShiny');
    const mainTidEl = $('#tid');
    const mainSidEl = $('#sid');
    if (pfTidEl) {
      pfTidEl.value = String(Number(mainTidEl?.value) || 0);
      pfTidEl.disabled = Boolean(mainTidEl?.disabled);
      pfTidEl.dataset.encounterLocked = pfTidEl.disabled ? '1' : '0';
    }
    if (pfSidEl) {
      pfSidEl.value = String(Number(mainSidEl?.value) || 0);
      pfSidEl.disabled = Boolean(mainSidEl?.disabled);
      pfSidEl.dataset.encounterLocked = pfSidEl.disabled ? '1' : '0';
    }
    if (pfShinyEl) {
      pfShinyEl.checked = false;
      pfShinyEl.disabled = false;
    }

    /* â”€â”€ Adjust method checkboxes based on encounter mode â”€â”€ */
    const pfM1  = document.getElementById('pfMethod1');
    const pfM2  = document.getElementById('pfMethod2');
    const pfM4  = document.getElementById('pfMethod4');

    // Helper: relabel a checkbox's parent <label> without detaching the checkbox
    function relabelCheckbox(cb, text) {
      const lbl = cb.parentElement;
      if (!lbl) return;
      // Remove all text nodes, keep the checkbox
      Array.from(lbl.childNodes).forEach(n => { if (n.nodeType === 3) lbl.removeChild(n); });
      lbl.appendChild(document.createTextNode(' ' + text));
    }

    const currentGameId = Number($('#originGame').value) || 3;
    const mysteryMethod = getMysteryPidMethod();
    const selectedCXDForPF = currentEncounterMode === 'cxd_shadow' ? getSelectedCXDEncounter() : null;
    const isChannelPF = mysteryMethod === 'CHANNEL';
    const isBACDPF = isMysteryBACDMethod(mysteryMethod);
    const isMysteryMethod2PF = currentEncounterMode === 'mystery' && isMysteryMethod2(mysteryMethod);
    const isMysteryCXD = currentEncounterMode === 'mystery' && mysteryMethod === 'CXD';
    const isCXDTradePF = currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade());

    if (pfM1) pfM1.disabled = false;
    if (pfM2) pfM2.disabled = false;
    if (pfM4) pfM4.disabled = false;
    syncRngManipulationUi({
      resetSeed: String(rngStartSeedInput?.dataset.gameId || '') !== String(currentGameId),
    });
    if (rngStartSeedInput) rngStartSeedInput.dataset.gameId = String(currentGameId);

    // Fixed-IV GameCube encounters (the Japanese e-Reader shadows) must
    // search their exact spread. Restore normal editability for every other
    // encounter so a previous e-Reader selection cannot leak into the modal.
    const fixedIvFields = [
      ['pfMinHp', 'pfMaxHp', 'hp'], ['pfMinAtk', 'pfMaxAtk', 'atk'],
      ['pfMinDef', 'pfMaxDef', 'def'], ['pfMinSpA', 'pfMaxSpA', 'spa'],
      ['pfMinSpD', 'pfMaxSpD', 'spd'], ['pfMinSpe', 'pfMaxSpe', 'spe'],
    ];
    for (const [minId, maxId, stat] of fixedIvFields) {
      const minEl = document.getElementById(minId);
      const maxEl = document.getElementById(maxId);
      if (minEl) minEl.disabled = false;
      if (maxEl) maxEl.disabled = false;
      if (selectedCXDForPF?.fixedIVs) {
        const value = String(Number(selectedCXDForPF.fixedIVs[stat]) || 0);
        if (minEl) {
          if (minEl.dataset.cxdFixedIvSaved === undefined) minEl.dataset.cxdFixedIvSaved = minEl.value;
          minEl.value = value;
          minEl.disabled = true;
        }
        if (maxEl) {
          if (maxEl.dataset.cxdFixedIvSaved === undefined) maxEl.dataset.cxdFixedIvSaved = maxEl.value;
          maxEl.value = value;
          maxEl.disabled = true;
        }
      } else {
        if (minEl?.dataset.cxdFixedIvSaved !== undefined) {
          minEl.value = minEl.dataset.cxdFixedIvSaved;
          delete minEl.dataset.cxdFixedIvSaved;
        }
        if (maxEl?.dataset.cxdFixedIvSaved !== undefined) {
          maxEl.value = maxEl.dataset.cxdFixedIvSaved;
          delete maxEl.dataset.cxdFixedIvSaved;
        }
      }
    }

    if (isChannelPF) {
      // Channel Jirachi uses XDRNG Channel method only
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, 'Channel'); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
      // Lock TID to 40122, SID to 0 (SID comes from result)
      if (pfTidEl) { pfTidEl.value = '40122'; pfTidEl.disabled = true; }
      if (pfSidEl) { pfSidEl.value = '0'; pfSidEl.disabled = true; }
      // Gender: genderless (already handled above by threshold=-1)
      // Ability: lock (single ability Serene Grace)
    } else if (isBACDPF) {
      const bacdMethodLabel = mysteryMethod === 'BACD_M'
        ? 'BACD [BACD_M] (index-subIndex)'
        : mysteryMethod;
      if (pfM1) {
        pfM1.checked = true;
        pfM1.parentElement.style.display = '';
        relabelCheckbox(pfM1, bacdMethodLabel);
      }
      if (pfM2) {
        pfM2.checked = false;
        pfM2.parentElement.style.display = 'none';
      }
      if (pfM4) {
        pfM4.checked = false;
        pfM4.parentElement.style.display = 'none';
      }

      const { tag, event } = getSelectedMysteryEvent();
      if (pfTidEl && event?.fixedTID !== undefined) {
        pfTidEl.value = String(event.fixedTID);
        pfTidEl.disabled = true;
      }
      if (pfSidEl && event?.fixedSID !== undefined) {
        pfSidEl.value = String(event.fixedSID);
        pfSidEl.disabled = true;
      }
      const unlockShinyLock = shouldUnlockCelebiShinyLock(tag, event);
      if (pfShinyEl && (event?.alwaysShiny || tag === 'WISHMKR_SHINY')) {
        pfShinyEl.checked = true;
        pfShinyEl.disabled = true;
      } else if (pfShinyEl && event?.shinyLocked && !unlockShinyLock) {
        pfShinyEl.checked = false;
        pfShinyEl.disabled = true;
      }

      // BACD mystery distributions are often very sparse per nature.
      // Default to broad filters so valid shiny/event rows are not hidden.
      if (pfAbilitySel && !pfAbilitySel.disabled && pfAbilitySel.querySelector('option[value="-1"]')) {
        pfAbilitySel.value = '-1';
      }
      if (pfGenderSel && !pfGenderSel.disabled && pfGenderSel.querySelector('option[value="any"]')) {
        pfGenderSel.value = 'any';
      }

    } else if (isMysteryMethod2PF) {
      // PCNY Wish Eggs and other Method 2 mystery events: Method 2 only.
      if (pfM1) {
        pfM1.checked = false;
        pfM1.parentElement.style.display = 'none';
      }
      if (pfM2) {
        pfM2.checked = true;
        pfM2.parentElement.style.display = '';
        relabelCheckbox(pfM2, 'Method 2');
        pfM2.disabled = true;
      }
      if (pfM4) {
        pfM4.checked = false;
        pfM4.parentElement.style.display = 'none';
      }

      // Event-generated Method 2 spreads should begin without a target-species
      // gender or ability filter. This keeps one legal encounter stable when
      // the distributed Pokémon is viewed as one of its evolutions.
      if (pfAbilitySel && !pfAbilitySel.disabled && pfAbilitySel.querySelector('option[value="-1"]')) {
        pfAbilitySel.value = '-1';
      }
      if (pfGenderSel && !pfGenderSel.disabled && pfGenderSel.querySelector('option[value="any"]')) {
        pfGenderSel.value = 'any';
      }

    } else if (isMysteryCXD || currentEncounterMode === 'cxd_shadow' || isCXDTradePF || (currentEncounterMode === 'static' && currentGameId === 15)) {
      // CXD encounters use CXD PRNG only
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, selectedCXDForPF?.eReader ? 'CXD e-Reader PID' : 'CXD'); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
      if (isCXDTradePF) {
        const trade = getSelectedCXDTrade();
        if (trade && pfTidEl) {
          pfTidEl.value = String(trade.tid);
          pfTidEl.disabled = true;
        }
        if (pfSidEl) {
          pfSidEl.value = String(Number($('#sid').value) || 0);
          pfSidEl.disabled = false;
        }
        if (pfShinyEl && trade?.shinyLocked) {
          pfShinyEl.checked = false;
          pfShinyEl.disabled = true;
        }
        if (pfAbilitySel && pfAbilitySel.querySelector('option[value="-1"]')) {
          pfAbilitySel.value = '-1';
        }
      }
      if (selectedCXDForPF) {
        if (pfTidEl && selectedCXDForPF.tid !== undefined) {
          pfTidEl.value = String(selectedCXDForPF.tid);
          pfTidEl.disabled = true;
        }
        if (pfSidEl && selectedCXDForPF.fixedSID !== undefined) {
          pfSidEl.value = String(selectedCXDForPF.fixedSID);
          pfSidEl.disabled = true;
        }
        if (pfShinyEl && selectedCXDForPF.shinyLocked) {
          pfShinyEl.checked = false;
          pfShinyEl.disabled = true;
        }
        if (selectedCXDForPF.fixedGender && pfGenderSel) {
          const fixedGender = String(selectedCXDForPF.fixedGender);
          pfGenderSel.innerHTML = `<option value="${fixedGender}">${fixedGender === 'female' ? 'Female' : 'Male'} (fixed)</option>`;
          pfGenderSel.value = fixedGender;
          pfGenderSel.disabled = true;
        }
        if (selectedCXDForPF.fixedAbility !== undefined && pfAbilitySel) {
          const fixedAbility = String(selectedCXDForPF.fixedAbility);
          const fixedOption = pfAbilitySel.querySelector(`option[value="${fixedAbility}"]`);
          if (fixedOption) {
            pfAbilitySel.value = fixedAbility;
            pfAbilitySel.disabled = true;
          }
        }
      }
      if (currentEncounterMode === 'mystery') {
        const { tag, event } = getSelectedMysteryEvent();
        if (pfTidEl && event?.fixedTID !== undefined) {
          pfTidEl.value = String(event.fixedTID);
          pfTidEl.disabled = true;
        }
        if (pfSidEl && event?.fixedSID !== undefined) {
          pfSidEl.value = String(event.fixedSID);
          pfSidEl.disabled = true;
        }
        if (pfShinyEl && event?.shinyLocked && !shouldUnlockCelebiShinyLock(tag, event)) {
          pfShinyEl.checked = false;
          pfShinyEl.disabled = true;
        }
      }
    } else if (currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
      // Static and roamer encounters use Method 1 only
      const label = currentEncounterMode === 'roamer' ? 'Method H-1-Roaming' : 'Method 1';
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, label); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
    } else {
      // Wild encounters use all three methods
      if (pfM1) { pfM1.checked = true; pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, 'Method H-1'); }
      if (pfM2) { pfM2.checked = true; pfM2.parentElement.style.display = ''; relabelCheckbox(pfM2, 'Method H-2'); }
      if (pfM4) { pfM4.checked = true; pfM4.parentElement.style.display = ''; relabelCheckbox(pfM4, 'Method H-4'); }
    }

    if (pfTidEl) pfTidEl.dataset.encounterLocked = pfTidEl.disabled ? '1' : '0';
    if (pfSidEl) pfSidEl.dataset.encounterLocked = pfSidEl.disabled ? '1' : '0';
    setMinimumIvDefaults(20);

    // Reset state
    resultsBody.innerHTML = '';
    resultCount.textContent = '';
    progressFill.style.width = '0%';
    progressText.textContent = 'Ready';
    searchBtn.disabled = false;
    stopBtn.disabled   = true;
    pfAllResults = [];
    activeRngWindow = null;
    if (manipFrameHeader) manipFrameHeader.hidden = true;

    try { updateBerryFixOtPreferenceUi(); } catch (e) {}
    syncShinyModeUi({ generateHatched: true });

    overlay.scrollTop = 0;
    overlay.classList.add('open');
  }

  function closeModal() {
    setConfirmNextStep(false);
    overlay.classList.remove('open');
    stopSearch();
  }

  function cancelModal() {
    if (!modalConfirmed && modalOriginalOriginGame && String($('#originGame')?.value || '') !== modalOriginalOriginGame) {
      const mainOriginGame = $('#originGame');
      if (mainOriginGame) {
        mainOriginGame.value = modalOriginalOriginGame;
        try { mainOriginGame.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
    }
    closeModal();
  }

  pfOriginGame?.addEventListener('change', () => {
    const mainOriginGame = $('#originGame');
    if (!mainOriginGame || !pfOriginGame.value) return;
    mainOriginGame.value = pfOriginGame.value;
    try { mainOriginGame.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
    syncRngManipulationUi({ resetSeed: true });
    if (rngStartSeedInput) rngStartSeedInput.dataset.gameId = String(pfOriginGame.value);
    resetPendingResult('Origin game changed. Search and select a legal PID.');
  });

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const natureEl = $('#nature');
    if (!natureEl || !String(natureEl.value || '').trim()) {
      natureEl?.classList.add('field-error');
      scrollToMissingField(natureEl, natureEl);
      return;
    }
    btn.classList.remove('field-error');
    openModal();
  });
  closeBtn.addEventListener('click', cancelModal);
  cancelBtn?.addEventListener('click', cancelModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) cancelModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) cancelModal();
  });

  /* â”€â”€ Stop running workers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function stopSearch() {
    pfWorkers.forEach(w => { try { w.postMessage({ stop: true }); } catch (_) {} });
    pfWorkers.forEach(w => { try { w.terminate(); } catch (_) {} });
    pfWorkers = [];
    // Merge whatever snapshots we have from the workers so far
    pfAllResults = [];
    for (const snap of pfWorkerSnapshots) {
      if (snap) pfAllResults.push(...snap);
    }
    displayResults();
    searchBtn.disabled = false;
    stopBtn.disabled   = true;
    progressText.textContent = pfAllResults.length ? 'Stopped (partial)' : 'Stopped';
    if (overlay.classList.contains('open') && pendingStatus) {
      pendingStatus.textContent = pfAllResults.length
        ? 'Partial results are available. Select one or search again.'
        : 'Search stopped before any matching PIDs were found.';
    }
  }
  stopBtn.addEventListener('click', stopSearch);

  /* â”€â”€ Start search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  searchBtn.addEventListener('click', () => {
    const speciesId      = Number($('#species').value) || 0;
    const nature         = Number($('#nature').value || 0);
    let   ability        = Number(document.getElementById('pfAbility').value);
    const pidParityPreference = getPidParityPreferenceForPidFinder(speciesId);
    const pfGenderVal    = document.getElementById('pfGender').value;
    const genderThreshold = getGenderThreshold(speciesId);
    const tid = Number(document.getElementById('pfTid').value) & 0xFFFF;
    const sid = Number(document.getElementById('pfSid').value) & 0xFFFF;
    const wantShiny = !!document.getElementById('pfShiny')?.checked;

    // Map gender to numeric code for worker: 0=female 1=male 2=genderless 3=any
    let targetGender;
    if (genderThreshold === -1)        targetGender = 2;       // genderless
    else if (genderThreshold === 0)    targetGender = 1;       // always male
    else if (genderThreshold >= 254)   targetGender = 0;       // always female
    else if (pfGenderVal === 'any')    targetGender = 3;       // any (skip filter)
    else                               targetGender = (pfGenderVal === 'female') ? 0 : 1;

    const clamp = (id) => Math.max(0, Math.min(31, Number(document.getElementById(id).value) || 0));
    const minIVs = [clamp('pfMinHp'), clamp('pfMinAtk'), clamp('pfMinDef'),
                    clamp('pfMinSpA'), clamp('pfMinSpD'), clamp('pfMinSpe')];
    const clampMax = (id) => { const v = Number(document.getElementById(id).value); return Number.isFinite(v) ? Math.max(0, Math.min(31, v)) : 31; };
    const maxIVs = [clampMax('pfMaxHp'), clampMax('pfMaxAtk'), clampMax('pfMaxDef'),
                    clampMax('pfMaxSpA'), clampMax('pfMaxSpD'), clampMax('pfMaxSpe')];

    // For roamer mode with IV truncation bug, the RNG still generates normal
    // Method 1 IVs; the game then truncates the IV data in memory.
    // We search with unconstrained IVs and post-process results below.
    pfIsRoamerTruncated = currentEncounterMode === 'roamer' &&
      roamerHasTruncatedIVs(speciesId, Number($('#originGame').value) || 3);

    const methods = [
      document.getElementById('pfMethod1').checked,
      document.getElementById('pfMethod2').checked,
      document.getElementById('pfMethod4').checked
    ];
    if (!methods[0] && !methods[1] && !methods[2]) { alert('Select at least one method.'); return; }
    const rngWindow = readRngWindow();
    if (rngWindow === false) return;
    activeRngWindow = rngWindow;

    // For CXD mode, warn the user if TID/SID is not a valid GameCube RNG pair.
    // An invalid TID/SID will produce no results (or only results that are
    // illegal in practice), so alert the user before wasting search time.
    const isCXDPreSearch = currentEncounterMode === 'cxd_shadow' ||
      (currentEncounterMode === 'static' && (Number($('#originGame').value) || 3) === 15);
    const selectedCXDForTrainerCheck = currentEncounterMode === 'cxd_shadow' ? getSelectedCXDEncounter() : null;
    const starterSearchDerivesTrainerIds = String(selectedCXDForTrainerCheck?.pidType || '').includes('STARTER');
    const willAutoSetGameCubeSid = Boolean(
      wantShinyCheckbox?.checked && autoSidRadio?.checked &&
      !autoSidRadio.disabled && canAutoSetGameCubeSid()
    );
    if (isCXDPreSearch && !willAutoSetGameCubeSid && !starterSearchDerivesTrainerIds && selectedCXDForTrainerCheck?.fixedSID === undefined && !isValidGCTidSid(tid, sid)) {
      const proceed = confirm(
        'Warning: This TID/SID combination is not possible in Colosseum/XD.\n\n' +
        'The IDs must be consecutive GC RNG outputs reachable from the ' +
        'player-name screen. Any results found will be illegal.\n\n' +
        'Do you want to search anyway?'
      );
      if (!proceed) return;
    }

    // Reset UI
    pendingPidFinderResult = null;
    pendingPidFinderRow?.classList.remove('is-selected');
    pendingPidFinderRow = null;
    if (confirmBtn) confirmBtn.disabled = true;
    setConfirmNextStep(false);
    if (pendingStatus) pendingStatus.textContent = 'Searching for matching legal PIDs…';
    resultsBody.innerHTML = '';
    resultCount.textContent = '';
    pfAllResults = [];
    progressFill.style.width = '0%';
    progressText.textContent = 'Searching\u2026';
    searchBtn.disabled = true;
    stopBtn.disabled   = false;

    // Determine which worker to use
    const gameId     = Number($('#originGame').value) || 3;
    activeSearchMetLocationId = currentEncounterMode === 'wild'
      ? readCurrentMetLocationId()
      : null;
    const mysteryMethod = getMysteryPidMethod();

    const isChannelSearch = currentEncounterMode === 'mystery' && mysteryMethod === 'CHANNEL';
    const isBACDSearch = currentEncounterMode === 'mystery' && isMysteryBACDMethod(mysteryMethod);
    const isCXD = !isChannelSearch && !isBACDSearch && (
      currentEncounterMode === 'cxd_shadow' ||
      (currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade())) ||
      (currentEncounterMode === 'static' && gameId === 15) ||
      (currentEncounterMode === 'mystery' && mysteryMethod === 'CXD')
    );
    const workerPath = isChannelSearch
      ? './src/lib/gen3/channel-worker.js'
      : isBACDSearch
        ? './src/lib/gen3/bacd-worker.js'
        : isCXD ? './src/lib/gen3/cxd-worker.js' : './src/lib/gen3/rng-worker.js';

    // Decide fast-path (IV recovery) vs brute-force (full seed scan).
    // IV recovery enumerates HP/ATK/DEF combos × 131 k inner checks instead
    // of scanning all 2³² seeds, so one worker finishes almost instantly
    // when the user asks for high minimum IVs.
    const iv1Count = (maxIVs[0] - minIVs[0] + 1) *
                     (maxIVs[1] - minIVs[1] + 1) *
                     (maxIVs[2] - minIVs[2] + 1);
    const useFastPath = !isChannelSearch && !isBACDSearch && iv1Count <= 4096;

    const cores = navigator.hardwareConcurrency || 4;
    const workerCount = isBACDSearch
      ? 1
      : useFastPath
        ? 1
        : Math.max(1, Math.min(Math.floor(cores / 2), 4));
    const totalSeeds  = isBACDSearch ? 0x10000 : 0x100000000;
    const chunkSize   = Math.ceil(totalSeeds / workerCount);
    let finishedWorkers = 0;
    const progressArr   = new Array(workerCount).fill(0);
    // Per-worker snapshot: each worker sends its current best results
    // periodically.  We replace (not append) on each snapshot so partial
    // results are always available if the user clicks Stop.
    pfWorkerSnapshots = new Array(workerCount).fill(null);
    pfWorkers = [];

    /** Merge all per-worker snapshots into pfAllResults for display. */
    function mergeSnapshots() {
      pfAllResults = [];
      for (const snap of pfWorkerSnapshots) {
        if (snap) pfAllResults.push(...snap);
      }
    }

    for (let i = 0; i < workerCount; i++) {
      const start = i * chunkSize;
      const end   = Math.min(start + chunkSize, totalSeeds);
      const worker = new Worker(workerPath);
      pfWorkers.push(worker);

      worker.onmessage = function (msg) {
        const d = msg.data;
        if (d.type === 'progress') {
          progressArr[i] = d.done / d.total;
          const pct = (progressArr.reduce((a, b) => a + b, 0) / workerCount * 100);
          progressFill.style.width = pct.toFixed(1) + '%';
          progressText.textContent = pct.toFixed(0) + '%';
        } else if (d.type === 'snapshot') {
          // Workers periodically send their current priority buffer
          pfWorkerSnapshots[i] = d.results;
        } else if (d.type === 'done') {
          pfWorkerSnapshots[i] = d.results;
          finishedWorkers++;
          progressArr[i] = 1;
          const pct = (progressArr.reduce((a, b) => a + b, 0) / workerCount * 100);
          progressFill.style.width = pct.toFixed(1) + '%';
          progressText.textContent = pct.toFixed(0) + '%';

          if (finishedWorkers === workerCount) {
            mergeSnapshots();
            displayResults();
            searchBtn.disabled = false;
            stopBtn.disabled   = true;
            progressText.textContent = 'Done';
            if (pendingStatus) pendingStatus.textContent = pfAllResults.length
              ? 'Select a legal PID result, then confirm your changes.'
              : 'No matching legal PIDs were found. Adjust the filters and search again.';
            pfWorkers = [];
          }
        }
      };

      worker.onerror = function (err) {
        console.error('PID finder worker error:', err);
        finishedWorkers++;
        if (finishedWorkers === workerCount) {
          displayResults();
          searchBtn.disabled = false;
          stopBtn.disabled   = true;
          progressText.textContent = 'Done (with errors)';
          if (pendingStatus) pendingStatus.textContent = pfAllResults.length
            ? 'Select a legal PID result, then confirm your changes.'
            : 'No matching legal PIDs were found. Adjust the filters and search again.';
          pfWorkers = [];
        }
      };

      // Look up encounter slot tables for this game + location.
      // Static/roamer encounters do NOT use wild encounter slots,
      // so pass null to skip encounter-chain validation.
      const locationId = activeSearchMetLocationId ?? readCurrentMetLocationId();
      const slotTables = (currentEncounterMode === 'static' || currentEncounterMode === 'roamer' || currentEncounterMode === 'mystery' || currentEncounterMode === 'cxd_trade')
        ? null
        : (ENCOUNTER_SLOTS[gameId] && ENCOUNTER_SLOTS[gameId][locationId]) || null;

      if (isBACDSearch) {
        const { event } = getSelectedMysteryEvent();
        const berryFixOtPreference = mysteryMethod === 'BACD_RBCD'
          ? (event?.berryFixOtPreference || (isBerryFixMysteryEventSelected() ? getBerryFixOtPreference() : 'ANY'))
          : 'ANY';

        worker.postMessage({
          startSeed: start,
          endSeed: end,
          method: mysteryMethod,
          nature,
          ability,
          genderThreshold: genderThreshold === -1 ? -1 : genderThreshold,
          targetGender,
          tid,
          sid,
          wantShiny,
          noShiny: !!event?.shinyLocked || mysteryMethod === 'BACD_M',
          otGenderMethod: event?.otGenderMethod || '',
          eventNationalSpecies: event?.tableNationalSpecies || 0,
          eventWish: event?.tableWish,
          berryFixOtPreference,
          minIVs,
          maxIVs,
          maxResults: Math.ceil(250 / workerCount)
        });
      } else if (isChannelSearch) {
        // Channel Jirachi worker: nature + shiny + IV filters, seed validation
        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, wantShiny,
          tid: 40122,
          minIVs, maxIVs,
          maxResults: Math.ceil(250 / workerCount)
        });
      } else if (isCXD) {
        // CXD worker: core filters + anti-shiny rerolling + team-lock data.
        // Use the SELECTED encounter to determine game-specific behaviour.
        const isCXDTradeSearch = currentEncounterMode === 'cxd_trade' && isCXDGeneratedTrade(getSelectedCXDTrade());
        const cxdEncounters = isCXDTradeSearch ? [] : getCXDEncountersForSpecies(speciesId);
        const selEnc = document.getElementById('shadowEncounter');
        const selIdx = selEnc ? (Number(selEnc.value) || 0) : 0;
        const selectedEnc = cxdEncounters[selIdx] || null;
        const isShadow = selectedEnc?.kind === 'shadow';
        const isXD = selectedEnc?.game === 'xd';
        const sourceSpeciesName = SPECIES.find(([id]) => Number(id) === Number(selectedEnc?.species))?.[1] || '';
        const lockSpecies = Number(selectedEnc?.teamLockSpecies || getNationalDexNumber(sourceSpeciesName) || selectedEnc?.species || speciesId);

        // Gather lock patterns for the selected encounter's game only.
        let teamLocks = null;
        if (isCXDTradeSearch) {
          teamLocks = null;
        } else if (isShadow && isXD) {
          if (!XD_NO_LOCK_SPECIES.has(lockSpecies) && XD_SHADOW_LOCKS[lockSpecies])
            teamLocks = XD_SHADOW_LOCKS[lockSpecies];
        } else if (isShadow) {
          if (!COLO_NO_LOCK_SPECIES.has(lockSpecies) && COLO_SHADOW_LOCKS[lockSpecies])
            teamLocks = COLO_SHADOW_LOCKS[lockSpecies];
        }

        // XD: anti-shiny rerolling uses the player's TSV — shadows can
        //     NEVER be shiny. Pass noShiny=true and the player's TSV.
        // Colosseum: anti-shiny rerolling uses the NPC trainer's TSV —
        //     shadows CAN be shiny for the player. Pass noShiny=false
        //     and NOT_FORCED so the worker doesn't reject player-shiny PIDs.
        const mysteryEvent = currentEncounterMode === 'mystery' ? getSelectedMysteryEvent().event : null;
        const forceNoShiny = currentEncounterMode === 'mystery' && !!mysteryEvent?.shinyLocked;
        const tsvVal = isShadow && isXD ? ((tid ^ sid) >>> 3) : 0xFFFFFFFF;

        const cxdAbility = hasSingleNormalGen3Ability(speciesId) ? 0 : ability;
        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, ability: cxdAbility,
          genderThreshold: genderThreshold === -1 ? -1 : genderThreshold,
          targetGender, tid, sid, wantShiny,
          minIVs, maxIVs,
          maxResults: Math.ceil(250 / workerCount),
          noShiny: Boolean(selectedEnc?.shinyLocked) || forceNoShiny,
          pidType: selectedEnc?.pidType || 'CXD',
          starterIndex: Number(selectedEnc?.starterIndex || 0),
          pokeSpotSlot: Number(selectedEnc?.pokeSpotSlot || 0),
          levelMin: Number(selectedEnc?.levelMin ?? selectedEnc?.level ?? $('#metLevel')?.value ?? 1),
          levelMax: Number(selectedEnc?.levelMax ?? selectedEnc?.level ?? $('#metLevel')?.value ?? 1),
          teamLocks,
          tsv: tsvVal,
          unownForm: speciesId === 201 ? Number($('#unownForm')?.value ?? -1) : -1
        });
      } else {
        // For evolved wild species, use the wild ancestor for encounter-slot validation
        const slotSpecies = (currentEncounterMode === 'wild' && !WILD_ENCOUNTERS[speciesId])
          ? (getWildAncestor(speciesId, WILD_ENCOUNTERS) ?? speciesId)
          : speciesId;
        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, ability,
          genderThreshold: genderThreshold === -1 ? -1 : genderThreshold,
          targetGender, tid, sid, wantShiny,
          minIVs, maxIVs, methods,
          pidParityPreference,
          maxResults: Math.ceil(250 / workerCount),
          targetSpecies: slotSpecies,
          slotTables,
          gameId,
          rngStartSeed: rngWindow?.startSeed,
          rngMaxAdvances: rngWindow?.maxAdvances,
          unownForm: speciesId === 201 ? Number($('#unownForm')?.value ?? -1) : -1
        });
      }
    }
  });

  /* â”€â”€ Display results table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function displayResults() {
    // For truncated roamers, post-process IVs: apply the roaming IV bug
    // The RNG generates normal Method 1 IVs, but only HP (0-31) and ATK (0-7) survive
    if (pfIsRoamerTruncated) {
      for (const r of pfAllResults) {
        r.ivs.atk = r.ivs.atk & 7;
        r.ivs.def = 0;
        r.ivs.spe = 0;
        r.ivs.spa = 0;
        r.ivs.spd = 0;
      }
      // De-duplicate: multiple RNG seeds can produce the same PID after truncation
      const seen = new Set();
      pfAllResults = pfAllResults.filter(r => {
        const key = `${r.pid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    pfAllResults.sort((a, b) => {
      const tA = a.ivs.hp + a.ivs.atk + a.ivs.def + a.ivs.spa + a.ivs.spd + a.ivs.spe;
      const tB = b.ivs.hp + b.ivs.atk + b.ivs.def + b.ivs.spa + b.ivs.spd + b.ivs.spe;
      if (tB !== tA) return tB - tA;
      if (activeRngWindow) {
        const aAdvances = Number.isFinite(Number(a.rngAdvances)) ? Number(a.rngAdvances) : 0xFFFFFFFF;
        const bAdvances = Number.isFinite(Number(b.rngAdvances)) ? Number(b.rngAdvances) : 0xFFFFFFFF;
        if (aAdvances !== bAdvances) return aAdvances - bAdvances;
      }
      return (a.method < b.method) ? -1 : (a.method > b.method) ? 1 : 0;
    });

    // Recalculate hidden power for truncated roamers (IVs changed above)
    if (pfIsRoamerTruncated) {
      for (const r of pfAllResults) {
        r.hpt = calculateHiddenPower(r.ivs).type;
        r.hpp = calculateHiddenPower(r.ivs).power;
      }
    }

    // A non-shiny choice is explicit, not merely the absence of a shiny-only
    // filter. Remove any rare shiny rows returned by the general RNG search.
    const wantsShiny = Boolean(wantShinyCheckbox?.checked);
    const autoShinySid = Boolean(wantsShiny && autoSidRadio?.checked && !autoSidRadio.disabled);
    const autoGameCubeSid = Boolean(autoShinySid && canAutoSetGameCubeSid());
    const modalTid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
    const modalSid = Number(document.getElementById('pfSid')?.value) & 0xFFFF;
    const resultIsShiny = r => isShinyForIds(
      r.pid,
      Number.isFinite(Number(r.tid)) ? r.tid : modalTid,
      Number.isFinite(Number(r.sid)) ? r.sid : modalSid,
    );

    // Apply shiny-state, HP type, and HP power filters.
    const filterHpType  = document.getElementById('pfHpType')?.value || 'any';
    const filterHpPower = Number(document.getElementById('pfHpPower')?.value) || 30;
    let filtered = pfAllResults.filter(r => (Number(r.pid) >>> 0) !== 0);
    if (!wantsShiny) {
      filtered = filtered.filter(r => !resultIsShiny(r));
    } else if (!autoShinySid) {
      filtered = filtered.filter(resultIsShiny);
    }
    if (autoGameCubeSid) {
      filtered = filtered.filter(r => {
        const resultTid = Number.isFinite(Number(r.tid)) ? (Number(r.tid) & 0xFFFF) : modalTid;
        const validSid = findValidGCShinySid(resultTid, r.pid);
        if (!validSid) return false;
        r.autoShinySid = validSid.sid;
        r.autoShinyXor = validSid.shinyXor;
        return true;
      });
    }
    if (filterHpType !== 'any') {
      filtered = filtered.filter(r => r.hpt === filterHpType);
    }
    if (filterHpPower > 30) {
      filtered = filtered.filter(r => r.hpp >= filterHpPower);
    }

    // Determine if encounter-chain validation was active
    const gameId     = Number($('#originGame').value) || 3;
    const locationId = activeSearchMetLocationId ?? readCurrentMetLocationId();
    const hadValidation = !!(ENCOUNTER_SLOTS[gameId] && ENCOUNTER_SLOTS[gameId][locationId]);

    const capped = filtered.slice(0, 25);
    if (pfAllResults.length === 0) {
      resultCount.textContent = (activeRngWindow
        ? 'No results in this frame window. Increase the maximum frame or lower minimum IVs.'
        : 'No results found. Try lowering minimum IVs.')
        + (hadValidation ? ' \u00B7 \u2714 encounter-valid' : '');
    } else if (capped.length === 0) {
      resultCount.textContent = 'No results match the current filters.'
        + (hadValidation ? ' \u00B7 \u2714 encounter-valid' : '');
    } else {
      const resultSummary = [
        capped.length < filtered.length
          ? `Showing top ${capped.length} results by IV total`
          : `Showing all ${capped.length} result${capped.length === 1 ? '' : 's'}`,
      ];
      if (hadValidation) resultSummary.push('\u2714 encounter-valid');
      if (activeRngWindow) {
        resultSummary.push(
          `frame \u2264 ${activeRngWindow.maxFrame.toLocaleString('en-US')} from ${formatRngSeed(activeRngWindow.startSeed)}`,
        );
      }
      resultCount.textContent = resultSummary.join(' \u00B7 ');
    }

    resultsBody.innerHTML = '';
    if (manipFrameHeader) manipFrameHeader.hidden = !activeRngWindow;
    const speciesId = Number($('#species').value) || 0;
    const rGenderThreshold = getGenderThreshold(speciesId);
    let rAbility0Name = 'Slot 0', rAbility1Name = 'Slot 1';
    try {
      const ab = getSpeciesAbilities(speciesId);
      if (ab) {
        rAbility0Name = getAbilityName(ab[0]) || 'Slot 0';
        rAbility1Name = getAbilityName(ab[1]) || 'Slot 1';
      }
    } catch (_) {}

    // Detect Channel results to adjust table columns
    const isChannelResults = capped.length > 0 && capped[0].method === 'Channel';

    // Update table header for Channel vs normal
    try {
      const thead = resultsBody.closest('table')?.querySelector('thead tr');
      if (thead) {
        const ths = thead.querySelectorAll('th');
        // Columns: PID(0) HP(1) Atk(2) Def(3) SpA(4) SpD(5) Spe(6) Total(7) HPType(8) HPPwr(9) Mth(10) Lv(11) Gender(12) Ability(13) Frame(14) InitSeed(15) ManipFrame(16) btn(17)
        if (ths.length >= 18) {
          ths[11].textContent = isChannelResults ? 'SID' : 'Lv';
          ths[12].textContent = isChannelResults ? 'Game' : 'Gender';
          ths[13].textContent = isChannelResults ? 'Item' : 'Ability';
        }
      }
    } catch (_) {}

    for (const r of capped) {
      const total = r.ivs.hp + r.ivs.atk + r.ivs.def + r.ivs.spa + r.ivs.spd + r.ivs.spe;

      // Derive gender from PID
      let genderStr;
      if (rGenderThreshold === -1)          genderStr = '\u2014';
      else if (rGenderThreshold === 0)      genderStr = '\u2642';
      else if (rGenderThreshold >= 254)     genderStr = '\u2640';
      else                                  genderStr = (r.pid & 0xFF) < rGenderThreshold ? '\u2640' : '\u2642';

      // CXD stores an RNG-derived ability slot independently of PID parity.
      const abilitySlot = Number.isInteger(r.abilityBit) ? r.abilityBit : (r.pid & 1);
      const abilityName = abilitySlot === 0 ? rAbility0Name : rAbility1Name;
      const frameInfo = getGen3ResultFrame(r, {
        gameId: Number($('#originGame')?.value) || 3,
        encounterMode: currentEncounterMode,
      });
      const frameCell = frameInfo
        ? `<td class="pid-frame-cell">${frameInfo.frame.toLocaleString('en-US')}</td>`
        : '<td class="pid-frame-cell">—</td>';
      const seedCell = frameInfo
        ? `<td class="pid-seed-cell">${(frameInfo.initialSeed & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}</td>`
        : '<td class="pid-seed-cell">—</td>';
      const manipFrame = Number.isFinite(Number(r.rngAdvances)) ? Number(r.rngAdvances) + 1 : null;
      const manipFrameCell = activeRngWindow && manipFrame !== null
        ? `<td class="pid-frame-cell pid-manip-frame-cell" title="${Number(r.rngAdvances).toLocaleString('en-US')} RNG advances from ${formatRngSeed(activeRngWindow.startSeed)}">${manipFrame.toLocaleString('en-US')}</td>`
        : '<td class="pid-frame-cell pid-manip-frame-cell" hidden>—</td>';

      // For static encounters, show method without 'H' prefix; for roamer, show 'H-1-Roaming'
      // CXD results already have method='CXD' so no replacement needed
      const bacdMethodDisplay = String(r.method || '').toUpperCase() === 'BACD_M'
        ? `BACD [BACD_M] (${Number.isFinite(Number(r.seedIndex)) ? Number(r.seedIndex) : '?'}-${Number.isFinite(Number(r.subIndex)) ? Number(r.subIndex) : '?'})`
        : r.method;
      const methodLabel = r.method === 'CXD'
        ? 'CXD'
        : currentEncounterMode === 'roamer'
          ? r.method.replace(/^H-?(\d)/, 'H-$1-Roaming')
          : currentEncounterMode === 'static'
            ? r.method.replace('H', '')
            : bacdMethodDisplay;

      const tr = document.createElement('tr');
      if (r.method === 'Channel') {
        // Channel-specific columns: SID, Game version, Held item
        const gameName = r.versionGameId === 1 ? 'Sapphire' : 'Ruby';
        const itemName = r.heldItemId === 169 ? 'Ganlon Berry' : 'Salac Berry';
        tr.innerHTML =
          `<td class="pid-cell">0x${(r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0')}</td>` +
          ivTd(r.ivs.hp) + ivTd(r.ivs.atk) + ivTd(r.ivs.def) +
          ivTd(r.ivs.spa) + ivTd(r.ivs.spd) + ivTd(r.ivs.spe) +
          `<td>${total}</td>` +
          `<td>${r.hpt}</td>` +
          `<td>${r.hpp}</td>` +
          `<td>${methodLabel}</td>` +
          `<td>${r.sid}</td>` +
          `<td>${gameName}</td>` +
          `<td>${itemName}</td>` +
          frameCell +
          seedCell +
          manipFrameCell +
          `<td class="pid-finder-action"><button type="button" class="select-btn">Select</button></td>`;
      } else {
      tr.innerHTML =
        `<td class="pid-cell">0x${(r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0')}</td>` +
        ivTd(r.ivs.hp) + ivTd(r.ivs.atk) + ivTd(r.ivs.def) +
        ivTd(r.ivs.spa) + ivTd(r.ivs.spd) + ivTd(r.ivs.spe) +
        `<td>${total}</td>` +
        `<td>${r.hpt}</td>` +
        `<td>${r.hpp}</td>` +
        `<td>${methodLabel}</td>` +
        `<td>${r.metLevels ? r.metLevels.join('/') : '\u2014'}</td>` +
        `<td>${genderStr}</td>` +
        `<td>${abilityName}</td>` +
        frameCell +
        seedCell +
        manipFrameCell +
        `<td class="pid-finder-action"><button type="button" class="select-btn">Select</button></td>`;
      }
      tr.querySelector('.select-btn').addEventListener('click', () => selectResult(r, tr));
      resultsBody.appendChild(tr);
    }
  }

  function ivTd(v) {
    const cls = v === 31 ? ' class="iv-perfect"' : v === 0 ? ' class="iv-zero"' : '';
    return `<td${cls}>${v}</td>`;
  }

  /* â”€â”€ Apply selected result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function selectResult(r, row) {
    pendingPidFinderRow?.classList.remove('is-selected');
    pendingPidFinderResult = currentEncounterMode === 'wild'
      ? { ...r, searchMetLocationId: activeSearchMetLocationId ?? readCurrentMetLocationId() }
      : r;
    pendingPidFinderRow = row || null;
    pendingPidFinderRow?.classList.add('is-selected');
    if (pfPidInput) pfPidInput.value = formatPidHex(r.pid);
    if (confirmBtn) confirmBtn.disabled = false;
    setConfirmNextStep(true);
    if (pendingStatus) {
      pendingStatus.textContent = wantShinyCheckbox?.checked && autoSidRadio?.checked
        ? 'Legal PID selected. Confirm to apply it and calculate a shiny SID.'
        : wantShinyCheckbox?.checked
          ? 'Legal shiny PID selected. Confirm to apply it.'
          : 'Legal non-shiny PID selected. Confirm to apply it.';
    }
    if (confirmBtn && window.matchMedia('(max-width: 700px)').matches) {
      requestAnimationFrame(() => {
        confirmBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  function applySelectedResult(r) {
    // Mark PID Finder result as active — this guards preset-application paths
    // from overwriting the selected PID/IVs without enabling full Manual Override.
    pidFinderResultActive = true;
    pidFinderHadSelection = true;
    pidFinderMysteryTag = currentEncounterMode === 'mystery' ? getSelectedMysteryEvent().tag : '';
    const selectedSpeciesId = Number($('#species')?.value || 0);
    const abilityCorrelationSpeciesId = currentEncounterMode === 'mystery'
      ? getCurrentOriginSourceSpeciesId(selectedSpeciesId)
      : selectedSpeciesId;
    pidFinderResultAbilityBit = normalizeGeneratedAbilityBit({
      pid: r.pid,
      generatedAbilityBit: r.abilityBit,
      correlationSpeciesHasSingleAbility: hasSingleNormalGen3Ability(abilityCorrelationSpeciesId),
    });

    // Sync TID/SID from PID Finder modal back to main form
    const pfTid = Number(document.getElementById('pfTid').value) & 0xFFFF;
    const pfSid = Number(document.getElementById('pfSid').value) & 0xFFFF;
    const resultTid = Number.isFinite(Number(r.tid)) ? (Number(r.tid) & 0xFFFF) : pfTid;
    const resultSid = Number.isFinite(Number(r.sid)) ? (Number(r.sid) & 0xFFFF) : pfSid;
    if (currentEncounterMode === 'cxd_trade') {
      const trade = getSelectedCXDTrade();
      $('#tid').value = String(trade?.tid ?? pfTid);
    } else {
      $('#tid').value = String(resultTid);
    }
    $('#sid').value = String(resultSid);

    // Store the TID/SID used for this PID result so we can detect changes later
    pidFinderOriginalTid = currentEncounterMode === 'cxd_trade'
      ? (Number(getSelectedCXDTrade()?.tid ?? pfTid) & 0xFFFF)
      : resultTid;
    pidFinderOriginalSid = resultSid;

    const isBACDResult = isMysteryBACDMethod(String(r.method || '').toUpperCase());

    // Channel Jirachi: apply seed-derived fields (SID, held item, origin game, OT gender)
    if (r.method === 'Channel') {
      $('#sid').value = String(r.sid);
      const itemEl = $('#item');
      if (itemEl) { itemEl.value = String(r.heldItemId); try { itemEl.dispatchEvent(new Event('change')); } catch (_) {} }
      const gameEl = $('#originGame');
      if (gameEl) { gameEl.value = String(r.versionGameId); try { gameEl.dispatchEvent(new Event('change')); } catch (_) {} }
      const otGenderEl = $('#otGender');
      if (otGenderEl) { otGenderEl.value = r.otGender === 1 ? 'female' : 'male'; }
    } else if (isBACDResult && currentEncounterMode === 'mystery') {
      const otNameEl = $('#otName');
      if (otNameEl && r.otName && isBerryFixMysteryEventSelected()) {
        otNameEl.value = String(r.otName);
      }
      const otGenderEl = $('#otGender');
      const otGender = normalizeOtGenderValue(r.otGender) || resolveMysteryBacdOtGender(r);
      if (otGenderEl && otGender) {
        otGenderEl.value = otGender;
      }

      if (String(r.method || '').toUpperCase() === 'BACD_RBCD') {
        const berryFixOtEl = document.getElementById('berryFixOtPreference');
        if (berryFixOtEl && r.otName) {
          berryFixOtEl.value = String(r.otName).toUpperCase() === 'RUBY' ? 'RUBY' : 'SAPHIRE';
          berryFixOtEl.disabled = true;
        }
      }

      if (isWishmkrMysteryEventSelected()) {
        applyWishmkrHeldItemFromSeed(r.originSeed ?? r.seed);
      }
    }

    // Determine actual shiny status from PID and the IDs tied to this result.
    const pidHigh = (r.pid >>> 16) & 0xFFFF;
    const pidLow = r.pid & 0xFFFF;
    const xor = (pidHigh ^ pidLow) ^ (resultTid ^ resultSid);
    const isActuallyShiny = xor < 8;
    const mainShiny = $('#shiny');
    if (mainShiny) mainShiny.checked = isActuallyShiny;

    const pidHex = '0x' + (r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0');
    const pidEl  = $('#pid');
    if (pidEl) {
      pidEl.value = pidHex;
      pidEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Nature is PID-derived in Gen 3; always sync it from the selected result.
    const natureEl = $('#nature');
    if (natureEl) {
      natureEl.value = String((r.pid >>> 0) % 25);
      const prevSuppressPresetApply = suppressPresetApply;
      suppressPresetApply = true;
      try { natureEl.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      suppressPresetApply = prevSuppressPresetApply;
    }

    // Set IVs (after PID event so we overwrite any stale preset lookup)
    $('#ivHp').value    = r.ivs.hp;
    $('#ivAtk').value   = r.ivs.atk;
    $('#ivDef').value   = r.ivs.def;
    $('#ivSpAtk').value = r.ivs.spa;
    $('#ivSpDef').value = r.ivs.spd;
    $('#ivSpe').value   = r.ivs.spe;

    // Set met level from encounter chain (use first valid level) and lock it
    if (r.metLevels && r.metLevels.length > 0) {
      const metLvEl = $('#metLevel');
      if (metLvEl) {
        metLvEl.value = r.metLevels[0];
        metLvEl.dispatchEvent(new Event('input', { bubbles: true }));
        // Lock the met level so the user cannot change it (PID-bound)
        pidFinderLockedMetLevel = true;
        metLvEl.disabled = true;
        metLvEl.style.pointerEvents = 'none';
        metLvEl.style.opacity = '0.6';
        metLvEl.style.cursor = 'not-allowed';
      }
    }

    updateHiddenPower();
    updateGenderFromPID();

    // CXD derives the stored ability slot from its own RNG call, independent
    // of PID parity. Older worker results fall back to the Gen 3 PID rule.
    const abilityBit = pidFinderResultAbilityBit;
    const abilitySel = $('#ability');
    if (abilitySel) {
      abilitySel.value = String(abilityBit);
      // Single-ability species are normalized to legal ability number 0;
      // dual-ability RNG slots are retained separately for serialization.
      if (abilitySel.value !== String(abilityBit)) abilitySel.value = '0';
    }

    // Lock nature, gender, ability, and IVs so casual changes don't invalidate
    // the PID Finder result.  Manual Override can still unlock everything.
    const lockStyle = (el) => {
      if (!el) return;
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.6';
      el.style.cursor = 'not-allowed';
    };
    lockStyle($('#nature'));
    lockStyle($('#gender'));
    lockStyle($('#pid'));
    lockStyle($('#originGame'));
    lockStyle(abilitySel);
    for (const id of ['ivHp','ivAtk','ivDef','ivSpAtk','ivSpDef','ivSpe']) {
      lockStyle($('#' + id));
    }
    if (currentEncounterMode === 'wild') {
      const metLocationEl = $('#metLocation');
      if (metLocationEl) {
        const searchedLocationId = Number(r.searchMetLocationId);
        if (Number.isInteger(searchedLocationId) && searchedLocationId >= 0) {
          metLocationEl.value = String(searchedLocationId);
          metLocationEl.dataset.pidFinderLocationId = String(searchedLocationId);
        }
        setControlLockState(metLocationEl, true);
        metLocationEl.dataset.pidFinderLocationLock = '1';
        metLocationEl.title = 'Met location is tied to the selected legal wild PID.';
      }
    }
    try { updatePidLocking(); } catch (e) {}
    try { updateIvLocking(); } catch (e) {}

    // Channel Jirachi: also lock seed-derived fields
    if (r.method === 'Channel') {
      lockStyle($('#sid'));
      lockStyle($('#item'));
      lockStyle($('#originGame'));
      lockStyle($('#otGender'));
      lockStyle($('#otName'));
    } else if (String(r.method || '').includes('STARTER') && Number.isFinite(Number(r.tid)) && Number.isFinite(Number(r.sid))) {
      // GameCube starter PID/IVs and trainer IDs are one RNG tuple. Keep the
      // seed-derived IDs together unless the user explicitly enables Manual Override.
      lockStyle($('#tid'));
      lockStyle($('#sid'));
    } else if (isBACDResult && currentEncounterMode === 'mystery') {
      // BACD mystery OT gender is part of the legality correlation.
      lockStyle($('#otGender'));
      if (r.otName) lockStyle($('#otName'));
    }

    checkShiny();
    try { refreshMoveExclusions(); } catch (e) {}
    try { updateMoveLegalityUi(); } catch (e) {}
    try { updateGCTidSidWarning(); } catch (e) {}
    try { updateRSTidSidWarning(); } catch (e) {}
    try { _updatePidTidSidWarning?.(); } catch (e) {}
    try { updateTidSidLocking(); } catch (e) {}
    try { updateCXDTradeIdentityLocking(); } catch (e) {}
    try { updateMakeShinyButton(); } catch (e) {}

    const statusMethod = r.method === 'Channel'
      ? 'Channel'
      : r.method === 'CXD'
      ? 'CXD'
      : isBACDResult
        ? r.method
        : currentEncounterMode === 'roamer'
          ? r.method.replace(/^H-?(\d)/, 'H-$1-Roaming')
          : currentEncounterMode === 'static'
            ? r.method.replace('H', '')
            : r.method;
    const bacdStatusLabel = String(r.method || '').toUpperCase() === 'BACD_M'
      ? `BACD [BACD_M] (${Number.isFinite(Number(r.seedIndex)) ? Number(r.seedIndex) : '?'}-${Number.isFinite(Number(r.subIndex)) ? Number(r.subIndex) : '?'})`
      : r.method;
    if (statusSpan) {
      statusSpan.textContent = r.method === 'Channel'
        ? `PID set (Channel, SID ${r.sid})`
        : r.method === 'CXD_EREADER'
          ? 'PID set (Colosseum e-Reader, fixed 0 IVs)'
        : String(r.method || '').includes('STARTER') && Number.isFinite(Number(r.tid)) && Number.isFinite(Number(r.sid))
          ? `PID set (${r.method === 'CXD_COLO_STARTER' ? 'Colosseum starter' : 'XD starter'}, seed-derived TID ${resultTid} / SID ${resultSid})`
        : isBACDResult
          ? `PID set (${bacdStatusLabel}, seed 0x${Number(r.originSeed ?? r.seed ?? 0).toString(16).toUpperCase().padStart(4, '0')})`
          : `PID set (${statusMethod === 'CXD' ? 'CXD' : 'Method ' + statusMethod}, Lv ${r.metLevels ? r.metLevels[0] : '?'})`;
    }
    try { _validateForm?.(); } catch (e) {}
    try { updateLegalityStatus(); } catch (e) {}
    if (currentEncounterMode === 'wild') {
      const metLocationEl = $('#metLocation');
      const searchedLocationId = metLocationEl?.dataset.pidFinderLocationId;
      if (metLocationEl && searchedLocationId !== undefined) {
        metLocationEl.value = searchedLocationId;
        setControlLockState(metLocationEl, true);
      }
    }
  }

  confirmBtn?.addEventListener('click', () => {
    const sidStatus = document.getElementById('sidShinyStatus');
    const wantsShiny = Boolean(wantShinyCheckbox?.checked);
    const hasShinyStrategy = Boolean(keepSidRadio?.checked || autoSidRadio?.checked);
    const autoMode = Boolean(wantsShiny && autoSidRadio?.checked && !autoSidRadio.disabled);

    if (wantsShiny && !hasShinyStrategy) {
      if (pendingStatus) pendingStatus.textContent = 'Choose Auto-Set SID or Keep SID before confirming.';
      return;
    }

    if (currentEncounterMode === 'hatched') {
      if (!hasValidPidText(pfPidInput?.value)) {
        if (pendingStatus) pendingStatus.textContent = invalidPidMessage(pfPidInput?.value);
        return;
      }
      const pid = parsePidInput(pfPidInput.value);
      const tid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
      let sid = Number(document.getElementById('pfSid')?.value) & 0xFFFF;
      const isCurrentlyShiny = isShinyForIds(pid, tid, sid);
      if (!autoMode && isCurrentlyShiny !== wantsShiny) {
        if (pendingStatus) pendingStatus.textContent = wantsShiny
          ? 'That PID is not shiny for this TID/SID. Enter a different PID or choose Auto-Set SID.'
          : 'That PID is shiny for this TID/SID. Enter a non-shiny PID.';
        return;
      }
      if (autoMode) {
        const preferredSid = (((pid >>> 16) & 0xFFFF) ^ (pid & 0xFFFF) ^ tid) & 0xFFFF;
        sid = adjustShinySidForOriginGame(tid, pid, preferredSid).sid;
      }

      const tidEl = $('#tid');
      const sidEl = $('#sid');
      const pidEl = $('#pid');
      if (tidEl) {
        tidEl.value = String(tid);
        tidEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (sidEl) setMainSidValue(sid);
      if (pidEl) {
        pidEl.value = formatPidHex(pid);
        pidEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const mainShiny = $('#shiny');
      if (mainShiny) mainShiny.checked = wantsShiny;
      if (statusSpan) statusSpan.textContent = 'PID set (Hatched)';
      if (sidStatus) sidStatus.textContent = autoMode
        ? `SID was set to ${sid} to make this PID shiny.`
        : '';
      checkShiny();
      try { _validateForm?.(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    } else {
      if (!pendingPidFinderResult) {
        if (pendingStatus) pendingStatus.textContent = 'Select a legal PID result before confirming.';
        return;
      }
      let gameCubeSidResult = null;
      if (autoMode && canAutoSetGameCubeSid()) {
        const pid = Number(pendingPidFinderResult.pid) >>> 0;
        const modalTid = Number(document.getElementById('pfTid')?.value) & 0xFFFF;
        const tid = Number.isFinite(Number(pendingPidFinderResult.tid))
          ? (Number(pendingPidFinderResult.tid) & 0xFFFF)
          : modalTid;
        gameCubeSidResult = findValidGCShinySid(tid, pid);
        if (!gameCubeSidResult) {
          if (pendingStatus) {
            pendingStatus.textContent = 'This PID has no GameCube-valid shiny SID for the selected TID. Choose another result.';
          }
          return;
        }
      }
      applySelectedResult(pendingPidFinderResult);
      if (autoMode) {
        const pid = Number(pendingPidFinderResult.pid) >>> 0;
        const tid = Number($('#tid')?.value) & 0xFFFF;
        const preferredSid = (((pid >>> 16) & 0xFFFF) ^ (pid & 0xFFFF) ^ tid) & 0xFFFF;
        const newSid = gameCubeSidResult?.sid ?? adjustShinySidForOriginGame(tid, pid, preferredSid).sid;
        pidFinderOriginalTid = tid;
        pidFinderOriginalSid = newSid;
        // Accept the validated Auto-Set pair before dispatching the SID input
        // event, so the manual-change warning never flashes for this flow.
        setMainSidValue(newSid);
        const mainShiny = $('#shiny');
        if (mainShiny) mainShiny.checked = true;
        if (sidStatus) sidStatus.textContent = gameCubeSidResult
          ? `SID set to ${newSid} — shiny and GameCube-valid.`
          : `SID was set to ${newSid} to make this PID shiny.`;
        checkShiny();
        try { updateGCTidSidWarning(); } catch (e) {}
        try { updateRSTidSidWarning(); } catch (e) {}
        try { _updatePidTidSidWarning?.(); } catch (e) {}
        try { _validateForm?.(); } catch (e) {}
      } else if (sidStatus) {
        sidStatus.textContent = '';
      }
    }

    modalConfirmed = true;
    closeModal();
  });
}

function collect(){
  try { _updateContestSheenAuto?.({ markImportedDirty: true }); } catch (e) {}

  const isImportedMode = currentEncounterMode === 'imported';
  const ivClamp = s => Math.max(0, Math.min(31, Number(s)));
  const evClamp = s => Math.max(0, Math.min(isImportedMode ? 255 : 252, Number(s)));
  const level = s => Math.max(1, Math.min(100, Number(s)));
  const moves = [$('#move1').value, $('#move2').value, $('#move3').value, $('#move4').value].filter(x=>x!=='');

  let ivs = {
    hp: ivClamp($('#ivHp').value),
    atk: ivClamp($('#ivAtk').value),
    def: ivClamp($('#ivDef').value),
    spa: ivClamp($('#ivSpAtk').value),
    spd: ivClamp($('#ivSpDef').value),
    spe: ivClamp($('#ivSpe').value)
  };

  let evs = {
    hp: evClamp($('#evHp').value),
    atk: evClamp($('#evAtk').value),
    def: evClamp($('#evDef').value),
    spa: evClamp($('#evSpAtk').value),
    spd: evClamp($('#evSpDef').value),
    spe: evClamp($('#evSpe').value)
  };

  // Normalize EVs so total <= 510 (reduce in order: spe, spd, spa, def, atk, hp)
  const total = Object.values(evs).reduce((a,b)=>a+b,0);
  if (!isImportedMode && total > 510) {
    let over = total - 510;
    const order = ['spe','spd','spa','def','atk','hp'];
    for (const k of order) {
      const take = Math.min(evs[k], over);
      evs[k] -= take;
      over -= take;
      if (over === 0) break;
    }
  }

  const selectedPokerusStatus = $('#pokerusStatus')?.value || 'none';
  const pokerusState = resolvePokerusStateForBuild({
    currentEncounterMode,
    importedPokerusState,
    pokerusDropdownDirty,
    selectedPokerusStatus,
    getPokerusStateFromStatusFn: getPokerusStateFromStatus,
  });
  const pokerusStatus = getPokerusStatusFromState(pokerusState);

  const out = {
    speciesId: Number($('#species').value || 0),
    itemId: Number($('#item').value || 0),
    level: level($('#level').value || 50),
    natureIndex: Number($('#nature').value),
    abilityBit: resolvePidFinderAbilityBit({
      selectedAbilityBit: $('#ability').value,
      resultActive: pidFinderResultActive,
      resultAbilityBit: pidFinderResultAbilityBit,
      manualOverride: manualOverrideActive,
    }),
    genderPref: $('#gender').value, // 'any' | 'male' | 'female'
    tid: Number($('#tid').value) & 0xFFFF,
    sid: Number($('#sid').value) & 0xFFFF,
    pid: parsePidInput($('#pid').value) & 0xFFFFFFFF,
    ballId: Number($('#ball').value || 4),
    metLocationId: Number($('#metLocation').value || 0),
    metLevel: Math.max(0, Math.min(isImportedMode ? 127 : 100, Number($('#metLevel').value || 0))),
    originGame: Number($('#originGame').value || 3),
    otGender: $('#otGender').value === 'female' ? 1 : 0,
    otName: $('#otName').value || 'BRENDAN',
    nickname: $('#nickname').value || '',
    languageId: Number($('#language').value),
    isEgg: Boolean($('#isEgg')?.checked) && canSpeciesBeUnhatchedEgg(Number($('#species').value || 0)),
    markings: {
      circle: $('#markCircle')?.checked || false,
      triangle: $('#markTriangle')?.checked || false,
      square: $('#markSquare')?.checked || false,
      heart: $('#markHeart')?.checked || false
    },
    // If we're in simple mode, prefer the preset's IVs to avoid mismatches.
    // BUT skip this when a PID Finder result is active — the finder already set the
    // correct correlated IVs in the DOM fields.
    ivs: (function(){
      try{
        if(document.body.classList.contains('mode-simple') && !pidFinderResultActive
           && currentEncounterMode !== 'roamer' && currentEncounterMode !== 'static' && currentEncounterMode !== 'cxd_shadow' && currentEncounterMode !== 'cxd_trade'){
          const natureIndex = Number($('#nature').value || 0);
          const natureName = NATURES[natureIndex] || null;
          const gender = ($('#gender').value || 'male');
          const entry = PID_PRESETS[natureName];
          const preset = entry ? (entry[gender] || entry.male || entry.female || entry.genderless) : null;
          if(preset && preset.ivs){
            return {
              hp: Number(preset.ivs.hp) || 0,
              atk: Number(preset.ivs.atk) || 0,
              def: Number(preset.ivs.def) || 0,
              spa: Number(preset.ivs.spa) || 0,
              spd: Number(preset.ivs.spd) || 0,
              spe: Number(preset.ivs.spe) || 0
            };
          }
        }
      }catch(e){ }
      return ivs;
    })(),
    evs,
    contest: {
      cool: Math.max(0, Math.min(255, Number($('#contestCool')?.value || 0))),
      beauty: Math.max(0, Math.min(255, Number($('#contestBeauty')?.value || 0))),
      cute: Math.max(0, Math.min(255, Number($('#contestCute')?.value || 0))),
      smart: Math.max(0, Math.min(255, Number($('#contestSmart')?.value || 0))),
      tough: Math.max(0, Math.min(255, Number($('#contestTough')?.value || 0))),
      sheen: Math.max(0, Math.min(255, Number($('#contestSheen')?.value || 0)))
    },
    friendship: Number($('#friendship').value) & 0xFF,
    pokerusStatus,
    pokerusState,
    moves: moves.map(x=>Number(x)),
    forceShiny: $('#shiny').checked,
    // totalExp: either the advanced input or computed from species+level
    totalExp: (function(){
      const sid = Number($('#species').value || 0);
      const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
      const inputExp = Number($('#expTotal')?.value);
      if (!Number.isNaN(inputExp) && String($('#expTotal')?.value).trim() !== '') return Math.max(0, Math.floor(inputExp));
      return expForLevel(group, level($('#level').value || 1));
    })(),
    pps: [
      Math.max(0, Math.min(3, Number($('#pp1')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp2')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp3')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp4')?.value || 0)))
    ],
    // â”€â”€ EV > 100 legality fix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // If any single stat has EVs > 100 and the Pokémon's level equals its
    // met level (i.e. never battled), add 1 EXP to avoid a legality flag.
    // A freshly-caught mon can't have >100 EVs in a stat without gaining
    // at least some experience.
    evLegalityBump: (function() {
      const lv  = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
      const met = Math.max(0, Math.min(100, Number($('#metLevel')?.value || 0)));
      if (lv === met) {
        const evVals = ['#evHp','#evAtk','#evDef','#evSpAtk','#evSpDef','#evSpe']
          .map(id => Math.max(0, Math.min(252, Number($(id)?.value || 0))));
        if (evVals.some(v => v > 100)) return true;
      }
      return false;
    })(),
    ribbons: {
      cool: Number($('#ribbonCool')?.value || 0),
      beauty: Number($('#ribbonBeauty')?.value || 0),
      cute: Number($('#ribbonCute')?.value || 0),
      smart: Number($('#ribbonSmart')?.value || 0),
      tough: Number($('#ribbonTough')?.value || 0),
      champion: $('#ribbonChampion')?.checked || false,
      winning: $('#ribbonWinning')?.checked || false,
      victory: $('#ribbonVictory')?.checked || false,
      artist: $('#ribbonArtist')?.checked || false,
      effort: $('#ribbonEffort')?.checked || false,
      battleChampion: $('#ribbonBattleChampion')?.checked || false,
      regionalChampion: $('#ribbonRegionalChampion')?.checked || false,
      nationalChampion: $('#ribbonNationalChampion')?.checked || false,
      country: $('#ribbonCountry')?.checked || false,
      national: $('#ribbonNational')?.checked || false,
      earth: $('#ribbonEarth')?.checked || false,
      world: $('#ribbonWorld')?.checked || false,
      fatefulEncounter: $('#fatefulEncounter')?.checked || false
    }
  };

  let outputLevelFloor = Math.min(100, out.metLevel);
  if (currentEncounterMode === 'hatched' && !manualOverrideActive && !out.isEgg) {
    outputLevelFloor = Math.max(outputLevelFloor, getHatchedLevelFloor(out.speciesId));
  }
  if (out.level < outputLevelFloor) {
    out.level = outputLevelFloor;
    const growthGroup = EXP_GROUPS[out.speciesId] ?? GROUP.MEDIUM_FAST;
    out.totalExp = expForLevel(growthGroup, out.level);
  }
  if (out.metLevel <= 100 && out.level === out.metLevel && Object.values(out.evs).some(v => v > 100)) {
    out.evLegalityBump = true;
  }

  // â”€â”€ EV > 100 legality fix: bump EXP by 1 when at met level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (out.evLegalityBump) {
    out.totalExp += 1;
  }
  delete out.evLegalityBump;

  // WISHMKR Jirachi Mystery Gift is Ruby-origin only.
  if (currentEncounterMode === 'mystery' && isWishmkrMysteryEventSelected()) {
    out.originGame = WISHMKR_ORIGIN_GAME_ID;
  }

  // BOX event should keep the explicit Fateful Encounter flag unchecked.
  if (currentEncounterMode === 'mystery' && isBoxEventMysteryEventSelected()) {
    out.ribbons.fatefulEncounter = false;
  }

  // Hatched and BOX_EVENT egg outputs must use Japanese + level 5 + game-specific met location.
  if (out.isEgg && (currentEncounterMode === 'hatched' || isBoxEventMysteryEventSelected())) {
    out.languageId = IS_EGG_OVERRIDE_LANGUAGE_ID;
    out.level = IS_EGG_OVERRIDE_LEVEL;

    const forcedMetLocationId = getIsEggOverrideMetLocationId(out.originGame);
    if (forcedMetLocationId !== null) {
      out.metLocationId = forcedMetLocationId;
    }

    const growthGroup = EXP_GROUPS[out.speciesId] ?? GROUP.MEDIUM_FAST;
    out.totalExp = expForLevel(growthGroup, IS_EGG_OVERRIDE_LEVEL);

    if (currentEncounterMode === 'mystery' && isBoxEventMysteryEventSelected()) {
      out.otName = 'AZUZA';
    }
  }

  return out;
}

// â”€â”€ Profanity check for Base64 box names â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Hybrid filter: boundary-only terms (short/ambiguous words only banned at word
// boundaries) + strong substring terms (slurs banned even inside larger words).
// See src/lib/profanityFilter.js for rule class documentation.
const _profanityFilter = createProfanityFilter(PROFANITY_LIST);

/**
 * Scan the Base64 box-name output for profanity.
 * Returns an array of { box, word } objects for every match found.
 */
function checkBase64Profanity(b64Text) {
  const hits = [];
  // Parse individual box names from the formatted output
  const lines = b64Text.split('\n');
  for (const line of lines) {
    const m = line.match(/Box\s+(\d+):\s+\(([^)]*)\)/);
    if (!m) continue;
    const boxNum = Number(m[1]);
    const boxName = m[2];
    // Test the box name against the hybrid profanity filter
    const result = _profanityFilter.checkDetailed(boxName);
    if (result.blocked) {
      for (const word of result.matches) hits.push({ box: boxNum, word });
    }
  }
  return hits;
}

/** Show or hide the profanity warning banner above the Base64 output. */
function updateProfanityWarning(b64Text) {
  const banner = document.getElementById('profanityWarning');
  if (!banner) return;
  const hits = checkBase64Profanity(b64Text);
  if (hits.length === 0) {
    banner.style.display = 'none';
    banner.textContent = '';
    return;
  }
  // Build a human-readable message
  const details = hits.map(h => `Box ${h.box}: "${h.word}"`).join(', ');
  banner.textContent = `�� ️ This code may be censored on the Nintendo Switch — detected: ${details}`;
  banner.style.display = 'block';
}

function isNintendoSwitchCodeTarget() {
  return outputCodeTarget !== 'console';
}

function hideBase64SafetyWarnings() {
  const profanityBanner = document.getElementById('profanityWarning');
  if (profanityBanner) {
    profanityBanner.style.display = 'none';
    profanityBanner.textContent = '';
  }

  const substitutionBanner = document.getElementById('substitutionWarning');
  if (substitutionBanner) {
    substitutionBanner.style.display = 'none';
    substitutionBanner.textContent = '';
  }
}

function updateBase64SafetyWarnings(b64Text, substitutionUsed) {
  if (!isNintendoSwitchCodeTarget()) {
    hideBase64SafetyWarnings();
    return;
  }

  updateProfanityWarning(b64Text);

  const substBanner = document.getElementById('substitutionWarning');
  if (!substBanner) return;
  if (substitutionUsed) {
    substBanner.textContent = 'One or more characters have been converted to a symbol to avoid the profanity filter on Switch.';
    substBanner.style.display = 'block';
  } else {
    substBanner.style.display = 'none';
    substBanner.textContent = '';
  }
}

function getBase64GenerationOptions() {
  return {
    switchSafe: isNintendoSwitchCodeTarget(),
    ...(manualSwitchSymbolBoxes.size > 0
      ? { symbolSubstitutionBoxes: [...manualSwitchSymbolBoxes].sort((a, b) => a - b) }
      : {}),
  };
}

function setSwitchBoxConverterStatus(message = '') {
  const status = document.getElementById('switchBoxConverterStatus');
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
}

function resetManualSwitchBoxConversion() {
  manualSwitchSymbolBoxes.clear();
  setSwitchBoxConverterStatus('');
}

function formatConvertedBoxList() {
  const boxes = [...manualSwitchSymbolBoxes].sort((a, b) => a - b);
  if (boxes.length === 0) return '';
  if (boxes.length === 1) return `Box ${boxes[0]}`;
  return `Boxes ${boxes.slice(0, -1).join(', ')} and ${boxes.at(-1)}`;
}

function updateSwitchBoxConverterUi() {
  const tool = document.getElementById('switchBoxConverter');
  const convertButton = document.getElementById('convertSwitchBoxBtn');
  const undoButton = document.getElementById('undoSwitchBoxConversionsBtn');
  if (!tool) return;

  tool.hidden = !isNintendoSwitchCodeTarget();
  const hasSwitchOutput = isNintendoSwitchCodeTarget() && Boolean(getBase64OutputText());
  if (convertButton) convertButton.disabled = !hasSwitchOutput;
  if (undoButton) undoButton.disabled = !hasSwitchOutput || manualSwitchSymbolBoxes.size === 0;
}

function convertSelectedSwitchBox() {
  if (!isNintendoSwitchCodeTarget() || !getBase64OutputText()) return;

  const select = document.getElementById('switchBlockedBoxNumber');
  const boxNumber = Number(select?.value);
  if (!Number.isInteger(boxNumber) || boxNumber < 1 || boxNumber > 14) return;

  manualSwitchSymbolBoxes.add(boxNumber);
  const result = onGenerate();
  const convertedCount = Number(result?.manualSubstitutionCounts?.[boxNumber]) || 0;

  if (convertedCount > 0) {
    const noun = convertedCount === 1 ? 'capital' : 'capitals';
    setSwitchBoxConverterStatus(
      `Converted ${convertedCount} compatible ${noun} in Box ${boxNumber}. Active: ${formatConvertedBoxList()}. The Pokemon data is unchanged.`
    );
  } else {
    manualSwitchSymbolBoxes.delete(boxNumber);
    if (manualSwitchSymbolBoxes.size > 0) onGenerate();
    const activeMessage = manualSwitchSymbolBoxes.size > 0
      ? ` ${formatConvertedBoxList()} remains converted.`
      : '';
    setSwitchBoxConverterStatus(
      `Box ${boxNumber} has no compatible capitals that can be converted safely.${activeMessage}`
    );
  }
}

function undoSwitchBoxConversions() {
  if (!isNintendoSwitchCodeTarget() || manualSwitchSymbolBoxes.size === 0) return;

  resetManualSwitchBoxConversion();
  onGenerate();
  setSwitchBoxConverterStatus('All manual box conversions were undone. The original generated code has been restored.');
}

function setOutputCodeTarget(target, options = {}) {
  const previousTarget = outputCodeTarget;
  outputCodeTarget = target === 'console' ? 'console' : 'switch';
  setPkhexLegalityEnvironment(
    outputCodeTarget === 'switch'
      ? PKHEX_ENVIRONMENT.SWITCH_FRLG
      : PKHEX_ENVIRONMENT.GBA_CARTRIDGE,
  );

  if (previousTarget !== outputCodeTarget) resetManualSwitchBoxConversion();

  document.querySelectorAll('.code-target-btn').forEach(btn => {
    const active = btn.dataset.codeTarget === outputCodeTarget;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  updateSwitchBoxConverterUi();

  if (options.regenerate && getBase64OutputText()) {
    onGenerate();
    return;
  } else if (!isNintendoSwitchCodeTarget()) {
    hideBase64SafetyWarnings();
  }
}

function setOutputTroubleshootingVisible(visible) {
  const helper = document.getElementById('codeHelpInline');
  if (!helper) return;
  const show = Boolean(visible);
  helper.hidden = !show;
  helper.style.display = show ? 'inline-flex' : 'none';
}

function hideBase64CharacterInspector() {
  const inspector = document.getElementById('base64CharacterInspector');
  if (!inspector) return;
  inspector.hidden = true;
  inspector.textContent = '';
}

function hideBase64CharacterInspectorFromOutsideClick(event) {
  const inspector = document.getElementById('base64CharacterInspector');
  if (!inspector || inspector.hidden) return;

  const output = document.getElementById('base64Output');
  const display = document.getElementById('base64CodeDisplay');
  if (output && output.contains(event.target)) return;
  if (display && display.contains(event.target)) return;

  hideBase64CharacterInspector();
}

function getTextareaCharacterWidth(textarea, style) {
  const canvas = getTextareaCharacterWidth.canvas || document.createElement('canvas');
  getTextareaCharacterWidth.canvas = canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 8;

  ctx.font = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ].filter(Boolean).join(' ');

  return ctx.measureText('M').width || 8;
}

function getTextareaTextOffsetFromPointer(textarea, event) {
  const value = textarea.value || '';
  if (!value) return -1;

  const style = getComputedStyle(textarea);
  const rect = textarea.getBoundingClientRect();
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const borderLeft = parseFloat(style.borderLeftWidth) || 0;
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const x = event.clientX - rect.left - borderLeft - paddingLeft + textarea.scrollLeft;
  const y = event.clientY - rect.top - borderTop - paddingTop + textarea.scrollTop;
  if (x < 0 || y < 0) return -1;

  const fontSize = parseFloat(style.fontSize) || 13;
  const parsedLineHeight = parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.4;
  const lineIndex = Math.floor(y / lineHeight);
  const lines = value.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return -1;

  const line = lines[lineIndex].endsWith('\r') ? lines[lineIndex].slice(0, -1) : lines[lineIndex];
  if (!line.length) return -1;

  const charWidth = getTextareaCharacterWidth(textarea, style);
  const column = Math.max(0, Math.min(line.length - 1, Math.floor(x / charWidth)));
  let offset = 0;
  for (let i = 0; i < lineIndex; i++) {
    offset += lines[i].length + 1;
  }

  return offset + column;
}

function formatInspectorCharacter(ch) {
  return ch === ' ' ? 'space' : ch;
}

function showBase64CharacterInspector(info, event) {
  const inspector = document.getElementById('base64CharacterInspector');
  if (!inspector || !info) return;
  const wrapper = inspector.closest('.base64-output-wrap');
  if (!wrapper) return;

  inspector.textContent = '';
  const character = document.createElement('strong');
  character.textContent = `"${formatInspectorCharacter(info.character)}"`;

  const kind = document.createElement('span');
  kind.className = 'base64-character-kind';
  kind.textContent = info.kind.label.toLowerCase();

  inspector.append(`${info.boxLabel}: `, character, ' is ', kind);
  inspector.hidden = false;

  const margin = 8;
  const wrapperRect = wrapper.getBoundingClientRect();
  let left = event.clientX - wrapperRect.left + 12;
  let top = event.clientY - wrapperRect.top + 12;
  inspector.style.left = `${left}px`;
  inspector.style.top = `${top}px`;

  requestAnimationFrame(() => {
    const box = inspector.getBoundingClientRect();
    left = Math.min(left, wrapper.clientWidth - box.width - margin);
    top = Math.min(top, wrapper.clientHeight - box.height - margin);
    inspector.style.left = `${Math.max(margin, left)}px`;
    inspector.style.top = `${Math.max(margin, top)}px`;
  });
}

function inspectBase64OutputCharacter(event) {
  const textarea = event.currentTarget;
  if (!textarea || typeof textarea.value !== 'string') return;

  const caretOffset = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : -1;
  const pointerOffset = getTextareaTextOffsetFromPointer(textarea, event);
  const info = findNearestBoxNameCharacterAtTextOffset(textarea.value, caretOffset)
    || findNearestBoxNameCharacterAtTextOffset(textarea.value, pointerOffset);
  if (!info) {
    hideBase64CharacterInspector();
    return;
  }

  showBase64CharacterInspector(info, event);
}

function getBase64OutputText() {
  return document.getElementById('base64Output')?.value || '';
}

function setBase64OutputText(text) {
  const value = String(text || '');
  const output = document.getElementById('base64Output');
  if (output) output.value = value;
  renderBase64CodeDisplay(value);
  updateSwitchBoxConverterUi();
}

function getAceCodeCharacterClass(ch) {
  if (ch === '.' || ch === ',') return 'code-char-flexible';
  if (ch === '-' || ch === '\u2010' || ch === '\u2011' || ch === '\u2012' || ch === '\u2013' || ch === '\u2014') {
    return 'code-char-hyphen';
  }
  if (ch === '_') return 'code-char-underscore';
  if ('()[]{}'.includes(ch)) return 'code-char-bracket';
  if ((ch >= 'A' && ch <= 'Z') || ch === '\u00C4' || ch === '\u00D6' || ch === '\u00DC') return 'code-char-upper';
  if (ch === 'q') return 'code-char-lower code-char-lower-q';
  if ((ch >= 'a' && ch <= 'z') || ch === '\u00E4' || ch === '\u00F6' || ch === '\u00FC') return 'code-char-lower';
  if (ch >= '0' && ch <= '9') return 'code-char-number';
  return 'code-char-symbol';
}

function appendColorizedCodeText(parent, text, rawStartOffset = null) {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement('span');
    span.className = getAceCodeCharacterClass(ch);
    span.textContent = ch;
    if (rawStartOffset !== null) span.dataset.base64Offset = String(rawStartOffset + i);
    parent.appendChild(span);
  }
}

function renderBase64CodeDisplay(text) {
  const display = document.getElementById('base64CodeDisplay');
  if (!display) return;

  const value = String(text || '');
  display.textContent = '';
  if (!value) return;

  const lines = value.split('\n');
  let lineStartOffset = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const lineEl = document.createElement('span');
    lineEl.className = 'base64-code-line';

    const boxMatch = line.match(/^(\s*)(Box\s+\d+:)(\s*)(\([^)]*\))(.*)$/i);
    if (boxMatch) {
      const [, leading, prefixText, prefixSpace, codeText, annotationText] = boxMatch;

      const prefix = document.createElement('span');
      prefix.className = 'code-box-prefix';
      prefix.textContent = prefixText;
      lineEl.appendChild(prefix);

      const code = document.createElement('span');
      code.className = 'code-box-main';
      appendColorizedCodeText(code, codeText, lineStartOffset + leading.length + prefixText.length + prefixSpace.length);
      lineEl.appendChild(code);

      if (annotationText) {
        const annotation = document.createElement('span');
        annotation.className = 'code-box-annotation';
        annotation.textContent = annotationText;
        lineEl.appendChild(annotation);
      }
    } else {
      lineEl.classList.add('base64-code-header');
      lineEl.textContent = line;
    }

    display.appendChild(lineEl);
    lineStartOffset += rawLine.length + 1;
  });
}

function inspectBase64DisplayCharacter(event) {
  const display = event.currentTarget;
  if (!display) return;

  const offsetElement = event.target.closest?.('[data-base64-offset]');
  const offset = offsetElement ? Number(offsetElement.dataset.base64Offset) : -1;
  const info = findNearestBoxNameCharacterAtTextOffset(getBase64OutputText(), offset);
  if (!info) {
    hideBase64CharacterInspector();
    return;
  }

  showBase64CharacterInspector(info, event);
}

function clearGeneratedOutputs() {
  markGeneratedCodeStale();
  resetManualSwitchBoxConversion();
  const hexOut = document.getElementById('hexOutput');
  if (hexOut) hexOut.value = '';

  setBase64OutputText('');

  const profanityBanner = document.getElementById('profanityWarning');
  if (profanityBanner) {
    profanityBanner.style.display = 'none';
    profanityBanner.textContent = '';
  }

  const substitutionBanner = document.getElementById('substitutionWarning');
  if (substitutionBanner) {
    substitutionBanner.style.display = 'none';
    substitutionBanner.textContent = '';
  }

  const copyHex = document.getElementById('copyHexCheck');
  if (copyHex) copyHex.classList.remove('show');
  const copyB64 = document.getElementById('copyBase64Check');
  if (copyB64) copyB64.classList.remove('show');

  hideBase64CharacterInspector();
  setOutputTroubleshootingVisible(true);
}

function clearImportedRoundTripState() {
  importedRoundTripBytes = null;
  importedRoundTripDirty = true;
  importedPokerusState = null;
  pokerusDropdownDirty = false;
}

function setPokerusUiFromParsedData(data) {
  const state = Number(data?.pokerusState);
  importedPokerusState = Number.isFinite(state) ? (state & 0xFF) : null;
  pokerusDropdownDirty = false;

  const pokerusEl = document.getElementById('pokerusStatus');
  if (!pokerusEl) return;
  const status = data?.pokerusStatus || getPokerusStatusFromState(importedPokerusState ?? 0);
  pokerusEl.value = ['none', 'active', 'cured'].includes(status) ? status : 'none';
}

function setImportedRoundTripFromHex(hexInput) {
  const pairs = String(hexInput || '').match(/[0-9a-fA-F]{2}/g) || [];
  if (pairs.length < 80) {
    clearImportedRoundTripState();
    return;
  }
  const bytes = new Uint8Array(80);
  for (let i = 0; i < 80; i++) {
    bytes[i] = parseInt(pairs[i], 16);
  }
  importedRoundTripBytes = bytes;
  importedRoundTripDirty = false;
}

function setImportedRoundTripFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 80) {
    clearImportedRoundTripState();
    return;
  }
  importedRoundTripBytes = new Uint8Array(bytes);
  importedRoundTripDirty = false;
}

function isPristineImportedRoundTrip() {
  return isPristineImportedRoundTripState(currentEncounterMode, importedRoundTripBytes, importedRoundTripDirty);
}

function onGenerate(){
  try { _validateForm?.(); } catch (e) {}
  try { _updateContestSheenAuto?.({ markImportedDirty: true }); } catch (e) {}

  // Rule of thumb:
  // - Unedited import => byte-preserved output
  // - Edited import   => rebuild from current UI fields
  const pristineOutput = tryBuildPristineImportedOutputs({
    currentEncounterMode,
    importedRoundTripBytes,
    importedRoundTripDirty,
    toFormattedHexFn: toFormattedHex,
    toBase64Fn: (bytes) => toBase64Emerald(bytes, getBase64GenerationOptions()),
  });
  if (pristineOutput) {
    $('#hexOutput').value = pristineOutput.hex;
    setBase64OutputText(pristineOutput.base64Text);
    setOutputTroubleshootingVisible(true);
    updateBase64SafetyWarnings(pristineOutput.base64Text, pristineOutput.substitutionUsed);
    hideBase64CharacterInspector();
    markGeneratedCodeFresh();
    recordRecentGeneration(new Uint8Array(importedRoundTripBytes), pristineOutput.base64Text);
    beginPkhexVerification(new Uint8Array(importedRoundTripBytes), pkhexLegalityEnvironment);
    return pristineOutput;
  }

  // Check if button is disabled and show validation errors
  if ($('#generateBtn').getAttribute('data-disabled') === 'true') {
    highlightMissingFields();
    return;
  }

  if (!hasRequiredMysteryGiftPidFinderSelection()) {
    highlightMissingFields();
    return;
  }
  
  const cfg = collect();
  const result = buildPokemonBytes(cfg);
  const hex = toFormattedHex(result.bytes);
  const b64Result = toBase64Emerald(result.bytes, getBase64GenerationOptions());
  $('#hexOutput').value = hex;
  setBase64OutputText(b64Result.text);
  setOutputTroubleshootingVisible(true);
  updateBase64SafetyWarnings(b64Result.text, b64Result.substitutionUsed);
  recordRecentGeneration(result.bytes, b64Result.text);
  hideBase64CharacterInspector();
  markGeneratedCodeFresh();
  beginPkhexVerification(new Uint8Array(result.bytes), pkhexLegalityEnvironment);
  return b64Result;
}

function enterImportedModeSilently() {
  const select = document.querySelector('#encounterMode');
  if (select && !select.querySelector('option[value="imported"]')) {
    const opt = document.createElement('option');
    opt.value = 'imported';
    opt.textContent = 'Imported';
    select.appendChild(opt);
  }
  if (select) select.value = 'imported';

  currentEncounterMode = 'imported';

  document.body.classList.toggle('encounter-wild', false);
  document.body.classList.toggle('encounter-hatched', false);
  document.body.classList.toggle('encounter-static', false);
  document.body.classList.toggle('encounter-roamer', false);
  document.body.classList.toggle('encounter-mystery', false);
  document.body.classList.toggle('encounter-cxd_shadow', false);
  document.body.classList.toggle('encounter-cxd_trade', false);
  document.body.classList.toggle('encounter-imported', true);

  const shinyLockedLabel = document.getElementById('xdShinyLocked');
  if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
  const shinyFinderHint = document.getElementById('cxdShinyFinderHint');
  if (shinyFinderHint) shinyFinderHint.style.display = 'none';
  const makeShinyBtn = document.getElementById('makeShinyBtn');
  if (makeShinyBtn) makeShinyBtn.style.display = '';
  const shinyIndicatorBtn = document.getElementById('shinyIndicatorBtn');
  if (shinyIndicatorBtn) shinyIndicatorBtn.style.display = '';
  const makeShinyStatus = document.getElementById('makeShinyStatus');
  if (makeShinyStatus) {
    makeShinyStatus.style.display = '';
    makeShinyStatus.textContent = '';
  }

  try { _updateSpeciesListForMode?.(); } catch (e) {}
  if (speciesAutocomplete) {
    try { speciesAutocomplete.updateList(SPECIES.filter(s => s[0] > 0 && !String(s[1] || '').includes('?'))); } catch (e) {}
  }
  try { _setEncounterModeDescription?.('imported'); } catch (e) {}
}

/**
 * Switch the encounter mode dropdown to "imported" and apply its settings.
 * This gives the user a clear "imported" label while behaving like hatched
 * mode (all moves, all species visible, manual override enabled).
 */
function switchToImportedMode() {
  const select = document.querySelector('#encounterMode');
  if (!select) return;
  // Add the imported option if it doesn't exist yet
  if (!select.querySelector('option[value="imported"]')) {
    const opt = document.createElement('option');
    opt.value = 'imported';
    opt.textContent = 'Imported';
    select.appendChild(opt);
  }
  select.value = 'imported';
  currentEncounterMode = 'imported';
  try { clearGeneratedOutputs(); } catch (e) {}
  const shinyLockedLabel = document.getElementById('xdShinyLocked');
  if (shinyLockedLabel) shinyLockedLabel.style.display = 'none';
  const shinyFinderHint = document.getElementById('cxdShinyFinderHint');
  if (shinyFinderHint) shinyFinderHint.style.display = 'none';
  const makeShinyBtn = document.getElementById('makeShinyBtn');
  if (makeShinyBtn) makeShinyBtn.style.display = '';
  const shinyIndicatorBtn = document.getElementById('shinyIndicatorBtn');
  if (shinyIndicatorBtn) shinyIndicatorBtn.style.display = '';
  const makeShinyStatus = document.getElementById('makeShinyStatus');
  if (makeShinyStatus) {
    makeShinyStatus.style.display = '';
    makeShinyStatus.textContent = '';
  }
  // Apply body class
  document.body.classList.remove('encounter-hatched','encounter-wild','encounter-static','encounter-roamer','encounter-mystery','encounter-cxd_shadow','encounter-cxd_trade');
  document.body.classList.add('encounter-imported');
  // Show all species in the autocomplete (imported could be anything)
  if (speciesAutocomplete) {
    speciesAutocomplete.updateList(SPECIES.filter(s => s[0] > 0 && !String(s[1]||'').includes('?')));
  }
  // Update mode description
  try {
    const el = document.getElementById('encounterModeDescription');
    if (el) {
      el.innerHTML = '';
      el.style.setProperty('--mode-accent', '#94a3b8');
      const txt = document.createElement('span');
      txt.className = 'mode-desc-text';
      txt.textContent = 'Pokémon imported from external data. Rule: unedited imports are byte-preserved; after a real edit, output is rebuilt from UI fields. This matters for glitched bytes the UI cannot safely represent.';
      el.appendChild(txt);
    }
  } catch (e) {}
}

/**
 * Parse a Smogon/Showdown-format set into an object with the fields it defines.
 * Returns null if the text doesn't look like a valid set.
 */
function parseSmogonSet(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  const result = {
    species: null,
    speciesId: null,
    item: null,
    itemId: null,
    ability: null,
    nature: null,
    natureIndex: null,
    level: null,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    moveIds: [],
    gender: null,
    shiny: false,
    happiness: null,
  };

  // Stat name mapping (case-insensitive)
  const statMap = { hp: 'hp', atk: 'atk', attack: 'atk', def: 'def', defense: 'def',
    spa: 'spa', spatk: 'spa', 'sp. atk': 'spa', 'sp.atk': 'spa', spd: 'spd',
    spdef: 'spd', 'sp. def': 'spd', 'sp.def': 'spd', spe: 'spe', speed: 'spe' };

  function parseStat(key) {
    return statMap[key.toLowerCase().trim()] || null;
  }

  // Line 1: "Species @ Item" or "Species (M) @ Item" or just "Species"
  const firstLine = lines[0];
  let speciesStr, itemStr = null;
  if (firstLine.includes('@')) {
    const parts = firstLine.split('@');
    speciesStr = parts[0].trim();
    itemStr = parts.slice(1).join('@').trim();
  } else {
    speciesStr = firstLine.trim();
  }
  // Strip gender indicator from species: "Gardevoir (F)" → "Gardevoir"
  const genderMatch = speciesStr.match(/^(.+?)\s*\(([MF])\)\s*$/);
  if (genderMatch) {
    speciesStr = genderMatch[1].trim();
    result.gender = genderMatch[2].toLowerCase() === 'm' ? 'male' : 'female';
  }
  // Strip nickname: "Nickname (Species)" → "Species"
  const nicknameMatch = speciesStr.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (nicknameMatch) {
    speciesStr = nicknameMatch[2].trim();
  }

  // Resolve species
  result.species = speciesStr;
  const specLower = speciesStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  const specEntry = SPECIES.find(s => {
    const sName = String(s[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return sName === specLower;
  });
  if (specEntry) result.speciesId = specEntry[0];

  // Resolve item
  if (itemStr) {
    result.item = itemStr;
    const itemLower = itemStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    const itemEntry = ITEMS.find(i => {
      const iName = String(i[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return iName === itemLower;
    });
    if (itemEntry) result.itemId = itemEntry[0];
  }

  // Remaining lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Moves: lines starting with "- "
    if (line.startsWith('-')) {
      let moveName = line.replace(/^-\s*/, '').trim();
      // Handle "Hidden Power [Type]" → "Hidden Power"
      // In Gen 3, Hidden Power is move ID 237
      if (/^hidden\s*power/i.test(moveName)) {
        moveName = 'Hidden Power';
      }
      result.moves.push(moveName);
      const moveLower = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const moveEntry = MOVES.find(m => {
        const mName = String(m[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return mName === moveLower;
      });
      result.moveIds.push(moveEntry ? moveEntry[0] : null);
      continue;
    }

    // Ability
    if (/^ability\s*:/i.test(line)) {
      result.ability = line.replace(/^ability\s*:\s*/i, '').trim();
      continue;
    }

    // Level
    if (/^level\s*:/i.test(line)) {
      result.level = parseInt(line.replace(/^level\s*:\s*/i, ''), 10) || null;
      continue;
    }

    // Shiny
    if (/^shiny\s*:\s*yes/i.test(line)) {
      result.shiny = true;
      continue;
    }

    // Happiness
    if (/^happiness\s*:/i.test(line)) {
      result.happiness = parseInt(line.replace(/^happiness\s*:\s*/i, ''), 10);
      if (isNaN(result.happiness)) result.happiness = null;
      continue;
    }

    // Nature: "Modest Nature"
    if (/nature$/i.test(line)) {
      const natureName = line.replace(/\s*nature\s*$/i, '').trim();
      const natureIdx = NATURES.findIndex(n => n.toLowerCase() === natureName.toLowerCase());
      if (natureIdx >= 0) {
        result.nature = natureName;
        result.natureIndex = natureIdx;
      }
      continue;
    }

    // EVs: "EVs: 252 HP / 252 SpA / 4 Spe"
    if (/^evs\s*:/i.test(line)) {
      const evStr = line.replace(/^evs\s*:\s*/i, '');
      const parts = evStr.split('/');
      for (const part of parts) {
        const m = part.trim().match(/^(\d+)\s+(.+)$/);
        if (m) {
          const stat = parseStat(m[2]);
          if (stat) result.evs[stat] = Math.min(255, parseInt(m[1], 10) || 0);
        }
      }
      continue;
    }

    // IVs: "IVs: 0 Atk / 30 SpA"
    if (/^ivs\s*:/i.test(line)) {
      const ivStr = line.replace(/^ivs\s*:\s*/i, '');
      const parts = ivStr.split('/');
      for (const part of parts) {
        const m = part.trim().match(/^(\d+)\s+(.+)$/);
        if (m) {
          const stat = parseStat(m[2]);
          if (stat) result.ivs[stat] = Math.min(31, parseInt(m[1], 10) || 0);
        }
      }
      continue;
    }
  }

  // Must have at least a species to be valid
  if (!result.speciesId) return null;
  return result;
}

/**
 * Apply a parsed Smogon set to the form fields.
 * Only sets fields that the Smogon format provides; leaves others at defaults.
 */
function applySmogonImport(parsed) {
  clearImportedRoundTripState();
  // Enable manual override
  manualOverrideActive = true;
  suppressPresetApply = true;
  const overrideCb = document.querySelector('#manualOverride');
  if (overrideCb) overrideCb.checked = true;
  try { _syncLegalModeToggle?.(); } catch (e) {}

  // Unlock fields
  const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
  fieldsToUnlock.forEach(sel => {
    const el = $(sel);
    if (el) { el.disabled = false; el.style.pointerEvents = ''; el.style.opacity = ''; el.style.cursor = ''; }
  });

  // Switch to imported mode FIRST so the species list includes all species
  switchToImportedMode();

  // Species
  $('#species').value = String(parsed.speciesId);
  const specEntry = SPECIES.find(s => s[0] === parsed.speciesId);
  if (specEntry) {
    setTrackedNickname(
      getLocalizedSpeciesName(parsed.speciesId, Number($('#language')?.value || 2)),
      NICKNAME_SOURCE.IMPORTED,
      parsed.speciesId
    );
  }

  const progression = resolveImportedProgression({
    speciesId: parsed.speciesId,
    level: parsed.level,
  });
  $('#level').value = String(progression.level);
  $('#expTotal').value = String(progression.totalExp);

  // Item
  if (parsed.itemId != null) {
    $('#item').value = String(parsed.itemId);
  }

  // Showdown sets normally include a nature. Use Hardy if it is omitted so
  // the generated PID and the displayed nature never inherit stale state.
  const natureIndex = parsed.natureIndex ?? 0;
  $('#nature').value = String(natureIndex);

  // Populate the species-specific options before selecting the requested
  // ability. Assigning the value first leaves the select blank.
  const abilityBit = resolveShowdownAbilitySlot(parsed.speciesId, parsed.ability);
  populateAbilitySelectForSpecies(parsed.speciesId, abilityBit);

  // EVs
  $('#evHp').value = String(parsed.evs.hp);
  $('#evAtk').value = String(parsed.evs.atk);
  $('#evDef').value = String(parsed.evs.def);
  $('#evSpAtk').value = String(parsed.evs.spa);
  $('#evSpDef').value = String(parsed.evs.spd);
  $('#evSpe').value = String(parsed.evs.spe);

  // IVs
  $('#ivHp').value = String(parsed.ivs.hp);
  $('#ivAtk').value = String(parsed.ivs.atk);
  $('#ivDef').value = String(parsed.ivs.def);
  $('#ivSpAtk').value = String(parsed.ivs.spa);
  $('#ivSpDef').value = String(parsed.ivs.spd);
  $('#ivSpe').value = String(parsed.ivs.spe);

  // Moves — update learnset filter first, then set move values
  updateMovesForSpecies(parsed.speciesId, { preserveValue: true });
  for (let i = 0; i < 4; i++) {
    const moveId = parsed.moveIds[i] ?? 0;
    $(`#move${i+1}`).value = String(moveId);
  }
  refreshMoveExclusions();

  // Populate gender options before choosing one, including fixed/genderless
  // species whose option may not exist from the previously displayed species.
  const importedGender = populateImportedGenderForSpecies(parsed.speciesId, parsed.gender);

  // Happiness
  if (parsed.happiness != null) {
    $('#friendship').value = String(parsed.happiness);
  }

  // Showdown text has no PID field. Generate one only after species, nature,
  // gender, ability, and trainer IDs are all known so every derived property
  // agrees with the imported set (including Shiny: Yes).
  if (typeof _createImportedSetPid !== 'function') {
    throw new Error('PID generator is unavailable');
  }
  const importedPid = _createImportedSetPid({
    tid: Number($('#tid')?.value || 0),
    sid: Number($('#sid')?.value || 0),
    natureIndex,
    gender: importedGender,
    speciesId: parsed.speciesId,
    abilityBit,
    shiny: parsed.shiny,
  });
  $('#pid').value = '0x' + importedPid.toString(16).toUpperCase().padStart(8, '0');
  try { checkShiny(); } catch (e) {}

  // Update Hidden Power
  try { updateHiddenPower(); } catch (e) {}

  // Update species-specific UI
  if (_postImportUpdate) _postImportUpdate(parsed.speciesId);
  try { _applyContestSpeciesRequirements?.({ markImportedDirty: true }); } catch (e) {}

  suppressPresetApply = false;
}

/**
 * Open the import modal
 */
function openImportModal() {
  const overlay = document.getElementById('importOverlay');
  if (overlay) overlay.classList.add('open');
}

/**
 * Close the import modal
 */
function closeImportModal() {
  const overlay = document.getElementById('importOverlay');
  if (overlay) overlay.classList.remove('open');
}

function onLoadFromHex(hexString){
  try {
    suppressImportedDirtyTracking = true;
    const hexInput = hexString || $('#hexOutput').value;
    const bytePairs = String(hexInput || '').match(/[0-9a-fA-F]{2}/g) || [];
    if (bytePairs.length < 80) throw new Error('Expected 80 bytes (160 hex characters)');
    const rawBytes = new Uint8Array(80);
    for (let i = 0; i < 80; i++) rawBytes[i] = parseInt(bytePairs[i], 16);
    const data = parsePokemonBytes(Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Debug: log species ID and exp group
    const progression = resolveImportedProgression({
      speciesId: data.speciesId,
      totalExp: data.totalExp,
    });
    console.log(`Species ID: ${data.speciesId}, Exp Group: ${progression.group}, Total Exp: ${data.totalExp}`);
    
    // Enable manual override so imported values aren't overwritten by mode locks
    manualOverrideActive = true;
    suppressPresetApply = true;
    const overrideCb = document.querySelector('#manualOverride');
    if (overrideCb) overrideCb.checked = true;
    try { _syncLegalModeToggle?.(); } catch (e) {}

    // Switch to imported mode FIRST so the species list includes all species
    // (otherwise legendaries or other filtered-out species won't display properly)
    enterImportedModeSilently();

    // Temporarily unlock all disabled fields so .value assignments take effect
    const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
    fieldsToUnlock.forEach(sel => {
      const el = $(sel);
      if (el) {
        el.disabled = false;
        el.style.pointerEvents = '';
        el.style.opacity = '';
        el.style.cursor = '';
      }
    });
    
    // Populate all fields
    $('#species').value = String(data.speciesId);
    $('#item').value = String(data.itemId);
    $('#level').value = String(progression.level);
    $('#expTotal').value = String(progression.totalExp);
    $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
    $('#nature').value = String(data.natureIndex);
    populateAbilitySelectForSpecies(data.speciesId, data.abilityBit);
    populateImportedGenderForSpecies(
      data.speciesId,
      getImportedGenderForPid(data.speciesId, data.pid),
    );
    $('#tid').value = String(data.tid);
    $('#sid').value = String(data.sid);
    $('#ball').value = String(data.ballId);
    // Set origin game BEFORE met location so the location list is correct
    $('#originGame').value = String(data.originGame);
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(getLocationsForGame(data.originGame));
    }
    $('#metLocation').value = String(data.metLocationId);
    $('#metLevel').value = String(data.metLevel);
    $('#otGender').value = data.otGender === 1 ? 'female' : 'male';
    $('#otName').value = data.otName;
    $('#nickname').value = data.nickname;
    markNicknameAsImported(data.speciesId);
    $('#language').value = String(data.languageId);
    // Egg flag (misc header bit 2 -> 0x04). parsePokemonBytes now returns `isEgg`.
    if (typeof data.isEgg !== 'undefined') $('#isEgg').checked = Boolean(data.isEgg);
    
    // Extra bytes removed from UI/controls
    
    // Markings
    if (data.markings) {
      $('#markCircle').checked = data.markings.circle;
      $('#markTriangle').checked = data.markings.triangle;
      $('#markSquare').checked = data.markings.square;
      $('#markHeart').checked = data.markings.heart;
      
      // Update visual state of marking symbols
      document.querySelector('[data-marking="markCircle"]')?.classList.toggle('active', data.markings.circle);
      document.querySelector('[data-marking="markTriangle"]')?.classList.toggle('active', data.markings.triangle);
      document.querySelector('[data-marking="markSquare"]')?.classList.toggle('active', data.markings.square);
      document.querySelector('[data-marking="markHeart"]')?.classList.toggle('active', data.markings.heart);
    }
    
    // IVs
    $('#ivHp').value = String(data.ivs.hp);
    $('#ivAtk').value = String(data.ivs.atk);
    $('#ivDef').value = String(data.ivs.def);
    $('#ivSpAtk').value = String(data.ivs.spa);
    $('#ivSpDef').value = String(data.ivs.spd);
    $('#ivSpe').value = String(data.ivs.spe);
    
    // EVs
    $('#evHp').value = String(data.evs.hp);
    $('#evAtk').value = String(data.evs.atk);
    $('#evDef').value = String(data.evs.def);
    $('#evSpAtk').value = String(data.evs.spa);
    $('#evSpDef').value = String(data.evs.spd);
    $('#evSpe').value = String(data.evs.spe);
    
    // Contest stats
    if (data.contest) {
      $('#contestCool').value = String(data.contest.cool);
      $('#contestBeauty').value = String(data.contest.beauty);
      $('#contestCute').value = String(data.contest.cute);
      $('#contestSmart').value = String(data.contest.smart);
      $('#contestTough').value = String(data.contest.tough);
      $('#contestSheen').value = String(data.contest.sheen);
    }
    
    // Moves and PP Ups
    // Update learnset filter for the imported species (preserve imported moves)
    updateMovesForSpecies(Number(data.speciesId) || 0, { preserveValue: true });
    $('#move1').value = String(data.moves[0]);
    $('#move2').value = String(data.moves[1]);
    $('#move3').value = String(data.moves[2]);
    $('#move4').value = String(data.moves[3]);
    refreshMoveExclusions();
    $('#pp1').value = String(data.pps[0]);
    $('#pp2').value = String(data.pps[1]);
    $('#pp3').value = String(data.pps[2]);
    $('#pp4').value = String(data.pps[3]);
    
    $('#friendship').value = String(data.friendship);
    setPokerusUiFromParsedData(data);
    
    // Ribbons
    if (data.ribbons) {
      $('#ribbonCool').value = String(data.ribbons.cool);
      $('#ribbonBeauty').value = String(data.ribbons.beauty);
      $('#ribbonCute').value = String(data.ribbons.cute);
      $('#ribbonSmart').value = String(data.ribbons.smart);
      $('#ribbonTough').value = String(data.ribbons.tough);
      $('#ribbonChampion').checked = data.ribbons.champion;
      $('#ribbonWinning').checked = data.ribbons.winning;
      $('#ribbonVictory').checked = data.ribbons.victory;
      $('#ribbonArtist').checked = data.ribbons.artist;
      $('#ribbonEffort').checked = data.ribbons.effort;
      $('#ribbonBattleChampion').checked = data.ribbons.battleChampion;
      $('#ribbonRegionalChampion').checked = data.ribbons.regionalChampion;
      $('#ribbonNationalChampion').checked = data.ribbons.nationalChampion;
      $('#ribbonCountry').checked = data.ribbons.country;
      $('#ribbonNational').checked = data.ribbons.national;
      $('#ribbonEarth').checked = data.ribbons.earth;
      $('#ribbonWorld').checked = data.ribbons.world;
      $('#fatefulEncounter').checked = data.ribbons.fatefulEncounter;
    }
    
    // Check shiny status
    checkShiny();
    
    // Update Hidden Power display based on loaded IVs
    updateHiddenPower();
    
    // Update display-only species UI and validation state without dispatching synthetic edits.
    const speciesId = Number(data.speciesId) || 0;
    if (_postImportUpdate) _postImportUpdate(speciesId);
    try { _validateForm?.(); } catch (e) {}
    try { updateLegalityStatus(); } catch (e) {}

    // Re-arm snapshot after all UI updates so untouched Generate is exact 1:1 raw output.
    setImportedRoundTripFromBytes(rawBytes);
    importedRoundTripDirty = false;
    try { _applyContestSpeciesRequirements?.({ markImportedDirty: true }); } catch (e) {}

    // Re-enable preset application for explicit user actions after import.
    suppressPresetApply = false;
    
    if (!hexString) {
      alert('Pokémon data loaded successfully! Rule: unedited imports are byte-preserved; after a real edit, output is rebuilt from current UI fields.');
    }
  } catch (e) {
    if (hexString) throw e; // Re-throw when called from modal so it can show its own error
    alert('Error loading hex data: ' + e.message);
  } finally {
    suppressImportedDirtyTracking = false;
  }
}

// Export Pokémon data as .ek3 file (encrypted PKHeX format)
function onExportPk3() {
  try {
    let bytes;
    let speciesId = Number($('#species')?.value || 0);

    if (isPristineImportedRoundTrip()) {
      bytes = new Uint8Array(importedRoundTripBytes);
      try {
        const parsed = parsePokemonBytes(toHexString(importedRoundTripBytes));
        speciesId = Number(parsed.speciesId) || speciesId;
      } catch (e) {}
    } else {
      const cfg = collect();
      const result = buildPokemonBytes(cfg);
      bytes = result.bytes;
      speciesId = cfg.speciesId;
    }
    
    // Ensure we have exactly 80 bytes
    if (bytes.length !== 80) {
      alert(`Error: Generated ${bytes.length} bytes instead of 80`);
      return;
    }
    
    // Create a fresh Uint8Array to ensure clean copy without any offset issues
    const cleanBytes = new Uint8Array(80);
    for (let i = 0; i < 80; i++) {
      cleanBytes[i] = bytes[i];
    }
    
    // Create blob from the clean buffer
    const blob = new Blob([cleanBytes], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    // Generate filename based on species name (prefer English species name)
    const speciesEntry = SPECIES.find(s => s[0] === speciesId);
    const speciesName = speciesEntry ? String(speciesEntry[1]) : 'Pokemon';
    const rawName = speciesName || 'Pokemon';
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Pokemon';
    a.download = `${safeName}.ek3`;
    
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert('Error exporting .ek3 file: ' + e.message);
  }
}

// Import Pokémon data from .ek3/.pk3 file
function onImportPk3(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = String(file.name || '').toLowerCase();
  const ext = fileName.endsWith('.pk3') ? 'pk3' : (fileName.endsWith('.ek3') ? 'ek3' : '');
  if (!ext) {
    alert('Invalid file type. Please import a .pk3 or .ek3 file.');
    event.target.value = '';
    return;
  }
  
  // Reset the file input so the same file can be imported again
  event.target.value = '';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      suppressImportedDirtyTracking = true;
      const arrayBuffer = e.target.result;
      const bytes = new Uint8Array(arrayBuffer);

      let rawBytes;
      if (ext === 'pk3') {
        if (bytes.length < 80) {
          alert(`Invalid .pk3 file size: ${bytes.length} bytes (expected at least 80 bytes)`);
          return;
        }
        // .pk3 is canonical decrypted data; convert to encrypted/raw ek3 bytes.
        rawBytes = convertPk3CanonicalToEk3Raw(bytes);
      } else {
        // .ek3 is encrypted/raw box data (80 bytes). Some tools can export
        // a 100-byte variant with a trailing 20-byte tail; ignore that tail.
        if (bytes.length < 80 || bytes.length > 100) {
          alert(`Invalid .ek3 file size: ${bytes.length} bytes (expected 80 to 100 bytes)`);
          return;
        }
        rawBytes = bytes.slice(0, 80);
        if (bytes.length > 80) {
          console.info(`Imported .ek3 has ${bytes.length} bytes; ignoring trailing ${bytes.length - 80} bytes.`);
        }
      }
      
      // Parse the bytes and load into form fields (without updating outputs yet)
      const data = parsePokemonBytes(Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
      // Diagnostic: log whether XOR-decryption was used and PID read from header
      console.log(`Imported .${ext} — PID:`, data.pid, 'usedXor:', data.usedXor);
      
      // Debug: log species ID and exp group
      const progression = resolveImportedProgression({
        speciesId: data.speciesId,
        totalExp: data.totalExp,
      });
      console.log(`Species ID: ${data.speciesId}, Exp Group: ${progression.group}, Total Exp: ${data.totalExp}`);
      
      // Enable manual override so imported values aren't overwritten by mode locks.
      // Also suppress preset application so PID/IVs come from the imported file.
      manualOverrideActive = true;
      suppressPresetApply = true;
      const overrideCb = document.querySelector('#manualOverride');
      if (overrideCb) overrideCb.checked = true;
      try { _syncLegalModeToggle?.(); } catch (e) {}

      enterImportedModeSilently();

      // Temporarily unlock all disabled fields so .value assignments take effect
      const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
      fieldsToUnlock.forEach(sel => {
        const el = $(sel);
        if (el) {
          el.disabled = false;
          el.style.pointerEvents = '';
          el.style.opacity = '';
          el.style.cursor = '';
        }
      });

      // Populate all fields (same as onLoadFromHex)
      $('#species').value = String(data.speciesId);
      populateAbilitySelectForSpecies(data.speciesId, data.abilityBit);
      populateImportedGenderForSpecies(
        data.speciesId,
        getImportedGenderForPid(data.speciesId, data.pid),
      );
      $('#item').value = String(data.itemId);
      $('#level').value = String(progression.level);
      $('#expTotal').value = String(progression.totalExp);
      $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
      $('#nature').value = String(data.natureIndex);
      $('#tid').value = String(data.tid);
      $('#sid').value = String(data.sid);
      $('#ball').value = String(data.ballId);
      // Set origin game BEFORE met location so the location list is correct
      $('#originGame').value = String(data.originGame);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(data.originGame));
      }
      $('#metLocation').value = String(data.metLocationId);
      $('#metLevel').value = String(data.metLevel);
      $('#otGender').value = data.otGender === 1 ? 'female' : 'male';
      $('#otName').value = data.otName;
      $('#nickname').value = data.nickname;
      markNicknameAsImported(data.speciesId);
      $('#language').value = String(data.languageId);
      if (typeof data.isEgg !== 'undefined') $('#isEgg').checked = Boolean(data.isEgg);
      
      // Extra bytes removed from UI/controls
      
      // Markings
      if (data.markings) {
        $('#markCircle').checked = data.markings.circle;
        $('#markTriangle').checked = data.markings.triangle;
        $('#markSquare').checked = data.markings.square;
        $('#markHeart').checked = data.markings.heart;
        
        // Update visual state of marking symbols
        document.querySelector('[data-marking="markCircle"]')?.classList.toggle('active', data.markings.circle);
        document.querySelector('[data-marking="markTriangle"]')?.classList.toggle('active', data.markings.triangle);
        document.querySelector('[data-marking="markSquare"]')?.classList.toggle('active', data.markings.square);
        document.querySelector('[data-marking="markHeart"]')?.classList.toggle('active', data.markings.heart);
      }
      
      // IVs
      $('#ivHp').value = String(data.ivs.hp);
      $('#ivAtk').value = String(data.ivs.atk);
      $('#ivDef').value = String(data.ivs.def);
      $('#ivSpAtk').value = String(data.ivs.spa);
      $('#ivSpDef').value = String(data.ivs.spd);
      $('#ivSpe').value = String(data.ivs.spe);
      
      // EVs
      $('#evHp').value = String(data.evs.hp);
      $('#evAtk').value = String(data.evs.atk);
      $('#evDef').value = String(data.evs.def);
      $('#evSpAtk').value = String(data.evs.spa);
      $('#evSpDef').value = String(data.evs.spd);
      $('#evSpe').value = String(data.evs.spe);
      
      // Contest stats
      if (data.contest) {
        $('#contestCool').value = String(data.contest.cool);
        $('#contestBeauty').value = String(data.contest.beauty);
        $('#contestCute').value = String(data.contest.cute);
        $('#contestSmart').value = String(data.contest.smart);
        $('#contestTough').value = String(data.contest.tough);
        $('#contestSheen').value = String(data.contest.sheen);
      }
      
      // Moves and PP Ups
      // Update learnset filter for the imported species (preserve imported moves)
      updateMovesForSpecies(Number(data.speciesId) || 0, { preserveValue: true });
      $('#move1').value = String(data.moves[0]);
      $('#move2').value = String(data.moves[1]);
      $('#move3').value = String(data.moves[2]);
      $('#move4').value = String(data.moves[3]);
      refreshMoveExclusions();
      $('#pp1').value = String(data.pps[0]);
      $('#pp2').value = String(data.pps[1]);
      $('#pp3').value = String(data.pps[2]);
      $('#pp4').value = String(data.pps[3]);
      
      $('#friendship').value = String(data.friendship);
      setPokerusUiFromParsedData(data);
      
      // Ribbons
      if (data.ribbons) {
        $('#ribbonCool').value = String(data.ribbons.cool);
        $('#ribbonBeauty').value = String(data.ribbons.beauty);
        $('#ribbonCute').value = String(data.ribbons.cute);
        $('#ribbonSmart').value = String(data.ribbons.smart);
        $('#ribbonTough').value = String(data.ribbons.tough);
        $('#ribbonChampion').checked = data.ribbons.champion;
        $('#ribbonWinning').checked = data.ribbons.winning;
        $('#ribbonVictory').checked = data.ribbons.victory;
        $('#ribbonArtist').checked = data.ribbons.artist;
        $('#ribbonEffort').checked = data.ribbons.effort;
        $('#ribbonBattleChampion').checked = data.ribbons.battleChampion;
        $('#ribbonRegionalChampion').checked = data.ribbons.regionalChampion;
        $('#ribbonNationalChampion').checked = data.ribbons.nationalChampion;
        $('#ribbonCountry').checked = data.ribbons.country;
        $('#ribbonNational').checked = data.ribbons.national;
        $('#ribbonEarth').checked = data.ribbons.earth;
        $('#ribbonWorld').checked = data.ribbons.world;
        $('#fatefulEncounter').checked = data.ribbons.fatefulEncounter;
      }
      
      // Check shiny status
      checkShiny();

      // Update Hidden Power display based on loaded IVs
      updateHiddenPower();

      // Display-only refresh for sprite/form/validation.
      const speciesId = Number(data.speciesId) || 0;
      if (_postImportUpdate) _postImportUpdate(speciesId);
      try { _validateForm?.(); } catch (e) {}

      // Imported Pokémon may be event/custom or otherwise unverifiable.
      // Force the legality checker into 'unknown' (grey question-mark) mode
      // to indicate the result should be verified in PKHeX.
      try {
        const statusEl = $('#legalityStatus');
        const iconEl = $('#legalityIcon');
        const textEl = $('#legalityText');
        if (statusEl && iconEl && textEl) {
          statusEl.className = 'unknown';
          iconEl.textContent = '?';
          iconEl.style.color = '#9ca3af';
          textEl.textContent = 'Legal?';
          textEl.style.color = '#9ca3af';
          statusEl.title = 'Imported Pokémon — legality unknown; please verify in PKHeX.';
        }
      } catch (e) {}

      // Re-arm pristine snapshot at end so untouched Generate/export are byte-perfect.
      setImportedRoundTripFromBytes(rawBytes);
      importedRoundTripDirty = false;
      try { _applyContestSpeciesRequirements?.({ markImportedDirty: true }); } catch (e) {}

      // Finished programmatic updates; re-enable preset application.
      // Keep manualOverrideActive = true so user can freely edit imported values.
      suppressPresetApply = false;

      alert('Pokémon imported successfully! Rule: unedited imports are byte-preserved; after a real edit, output is rebuilt from current UI fields.');
    } catch (err) {
      alert('Error importing .ek3/.pk3 file: ' + err.message);
    } finally {
      suppressImportedDirtyTracking = false;
    }
  };
  
  reader.onerror = function() {
    alert('Failed to read .pk3/.ek3 file');
  };
  
  reader.readAsArrayBuffer(file);
}

function onDownload(){
  const cfg = collect();
  const result = buildPokemonBytes(cfg);
  const payload = {
    input: cfg,
    meta: result.meta,
    hex: toHexString(result.bytes),
    base64: toBase64Emerald(result.bytes).text
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pkmn_${Date.now()}.json`;
  a.click();
}

boot();
