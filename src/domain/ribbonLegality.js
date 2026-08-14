export const RIBBON_LEGALITY_STATE = Object.freeze({
  OPTIONAL: 'optional',
  REQUIRED: 'required',
  FORBIDDEN: 'forbidden',
  UNKNOWN: 'unknown',
});

export const GEN3_RIBBON_CONTROLS = Object.freeze([
  Object.freeze({ id: 'ribbonCool', key: 'cool', label: 'Cool Ribbon', kind: 'rank' }),
  Object.freeze({ id: 'ribbonBeauty', key: 'beauty', label: 'Beauty Ribbon', kind: 'rank' }),
  Object.freeze({ id: 'ribbonCute', key: 'cute', label: 'Cute Ribbon', kind: 'rank' }),
  Object.freeze({ id: 'ribbonSmart', key: 'smart', label: 'Smart Ribbon', kind: 'rank' }),
  Object.freeze({ id: 'ribbonTough', key: 'tough', label: 'Tough Ribbon', kind: 'rank' }),
  Object.freeze({ id: 'ribbonChampion', key: 'champion', label: 'Champion Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonWinning', key: 'winning', label: 'Winning Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonVictory', key: 'victory', label: 'Victory Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonArtist', key: 'artist', label: 'Artist Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonEffort', key: 'effort', label: 'Effort Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonBattleChampion', key: 'battleChampion', label: 'Battle Champion Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonRegionalChampion', key: 'regionalChampion', label: 'Regional Champion Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonNationalChampion', key: 'nationalChampion', label: 'National Champion Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonCountry', key: 'country', label: 'Country Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonNational', key: 'national', label: 'National Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonEarth', key: 'earth', label: 'Earth Ribbon', kind: 'boolean' }),
  Object.freeze({ id: 'ribbonWorld', key: 'world', label: 'World Ribbon', kind: 'boolean' }),
]);

// PKHeX's shared Generation 3/4 Battle Frontier banlist, limited to species
// that can exist in a native Generation 3 file. IDs use this builder's Gen 3
// internal species numbering.
export const GEN3_BATTLE_FRONTIER_BANNED_SPECIES = new Set([
  150, // Mewtwo
  151, // Mew
  249, // Lugia
  250, // Ho-Oh
  251, // Celebi
  404, // Kyogre
  405, // Groudon
  406, // Rayquaza
  409, // Jirachi
  410, // Deoxys
]);

const CONTEST_KEYS = Object.freeze(['cool', 'beauty', 'cute', 'smart', 'tough']);
const COMMON_KEYS = Object.freeze(['champion', 'artist', 'effort', 'earth']);
const EVENT_EXACT_KEYS = Object.freeze([
  'battleChampion',
  'regionalChampion',
  'nationalChampion',
  'country',
]);

function rule(state, reason = '', extra = {}) {
  return Object.freeze({ state, reason, ...extra });
}

function createUnknownRules(reason) {
  return Object.fromEntries(GEN3_RIBBON_CONTROLS.map(control => [
    control.key,
    rule(RIBBON_LEGALITY_STATE.UNKNOWN, reason, control.kind === 'rank' ? { max: 4 } : {}),
  ]));
}

/**
 * Resolve every stored Generation 3 ribbon to optional, required, forbidden,
 * or unknown for one selected encounter.
 *
 * Origin game is intentionally not used to restrict ordinary ribbons. A
 * native Gen 3 Pokemon can be traded among the GBA games and Colosseum/XD
 * before returning to the builder's target save.
 */
export function getGen3RibbonLegality({
  encounterMode = '',
  speciesId = 0,
  metLevel = 0,
  isEgg = false,
  encounter = null,
  event = null,
} = {}) {
  const mode = String(encounterMode || '').toLowerCase();

  if (!mode || !Number(speciesId) || mode === 'imported') {
    return createUnknownRules('The original encounter is not known, so ribbon legality cannot be locked safely.');
  }
  if (mode === 'mystery' && !event) {
    return createUnknownRules('Choose the exact distribution before ribbon legality can be determined.');
  }
  if (mode === 'cxd_shadow' && !encounter) {
    return createUnknownRules('Choose the exact Colosseum/XD encounter before ribbon legality can be determined.');
  }

  const rules = {};
  const forbid = (key, reason) => { rules[key] = rule(RIBBON_LEGALITY_STATE.FORBIDDEN, reason); };
  const optional = (key, reason, extra) => { rules[key] = rule(RIBBON_LEGALITY_STATE.OPTIONAL, reason, extra); };
  const require = (key, reason) => { rules[key] = rule(RIBBON_LEGALITY_STATE.REQUIRED, reason); };

  if (isEgg) {
    for (const control of GEN3_RIBBON_CONTROLS) {
      forbid(control.key, 'A currently unhatched Egg cannot have ribbons.');
    }
    return rules;
  }

  for (const key of CONTEST_KEYS) {
    optional(key, 'Any hatched or non-Egg Gen 3 Pokemon can earn contest ribbons.', { max: 4 });
  }
  for (const key of COMMON_KEYS) {
    optional(key, key === 'earth'
      ? 'Any non-Egg native Gen 3 Pokemon can earn this after visiting Colosseum/XD.'
      : 'Any hatched or non-Egg Gen 3 Pokemon can earn this ribbon.');
  }

  const battleFrontierBanned = GEN3_BATTLE_FRONTIER_BANNED_SPECIES.has(Number(speciesId));
  if (battleFrontierBanned) {
    forbid('winning', 'This species is banned from the Gen 3 Battle Tower and Battle Frontier.');
    forbid('victory', 'This species is banned from the Gen 3 Battle Tower and Battle Frontier.');
  } else {
    const level = Number(metLevel) || 0;
    if (level > 50) {
      forbid('winning', 'The Winning Ribbon requires a Pokemon whose original met level was 50 or lower.');
    } else {
      optional('winning', 'This species can enter the level-50 Battle Tower challenge.');
    }
    optional('victory', 'This species can enter the open-level Battle Tower or Battle Frontier challenge.');
  }

  const eventRibbons = event?.ribbons || {};
  for (const key of EVENT_EXACT_KEYS) {
    if (mode === 'mystery' && Boolean(eventRibbons[key])) {
      require(key, `The selected distribution includes the ${GEN3_RIBBON_CONTROLS.find(control => control.key === key)?.label || key}.`);
    } else {
      forbid(key, 'This event-only ribbon is not included with the selected encounter.');
    }
  }

  if (mode === 'cxd_shadow' && Boolean(encounter?.nationalRibbon)) {
    require('national', 'Purified Shadow Pokemon must have the National Ribbon.');
  } else if (mode === 'mystery' && Boolean(eventRibbons.national)) {
    require('national', 'The selected distribution includes the National Ribbon.');
  } else {
    forbid('national', 'The National Ribbon is limited to purified Shadow Pokemon and distributions that include it.');
  }

  if (mode === 'mystery' && Boolean(eventRibbons.earth)) {
    require('earth', 'The selected distribution includes the Earth Ribbon.');
  }

  forbid('world', 'The World Ribbon is not legal on a native Generation 3 Pokemon.');
  return rules;
}

export function validateGen3RibbonSelection(selection = {}, legality = {}) {
  const errors = [];
  for (const control of GEN3_RIBBON_CONTROLS) {
    const policy = legality[control.key];
    if (!policy || policy.state === RIBBON_LEGALITY_STATE.UNKNOWN) continue;
    const selected = control.kind === 'rank'
      ? Number(selection[control.key] || 0) > 0
      : Boolean(selection[control.key]);

    if (policy.state === RIBBON_LEGALITY_STATE.REQUIRED && !selected) {
      errors.push(`${control.label} is required: ${policy.reason}`);
    } else if (policy.state === RIBBON_LEGALITY_STATE.FORBIDDEN && selected) {
      errors.push(`${control.label} is impossible: ${policy.reason}`);
    }
  }
  return errors;
}
