/**
 * Pokémon XD in-game trade encounters.
 *
 * These are non-shadow XD trades. Their IVs, ability slot, and PID must come
 * from one CXD RNG sequence; none of the IVs are fixed.
 */

const EN = 2;

export const CXD_TRADE_ENCOUNTERS = [
  {
    id: 'xd_hordel_elekid',
    label: 'Pokémon XD - Hordel Trade Elekid',
    species: 239,
    level: 20,
    tid: 41400,
    sidType: 'PLAYER_SID',
    pidType: 'CXD',
    ivType: 'CXD_CORRELATED',
    fixedIVs: null,
    originGame: 15,
    location: 164,
    ball: 4,
    fateful: true,
    shinyLocked: false,
    otGender: 0,
    nicknameLocked: true,
    otNames: { 1: 'ダニー', 2: 'HORDEL', 3: 'VOLKER', 4: 'ODINO', 5: 'HORAZ', 7: 'HORDEL' },
    nicknameByLanguage: { 1: 'コンセント', 2: 'ZAPRONG', 3: 'ZAPRONG', 4: 'ZAPRONG', 5: 'ZAPRONG', 7: 'ZAPRONG' },
    moves: [7, 8, 9, 238]
  },
  {
    id: 'xd_duking_meditite',
    label: 'Pokémon XD - Duking Trade Meditite',
    species: 356,
    level: 20,
    tid: 37149,
    sidType: 'PLAYER_SID',
    pidType: 'CXD',
    ivType: 'CXD_CORRELATED',
    fixedIVs: null,
    originGame: 15,
    location: 116,
    ball: 4,
    fateful: true,
    shinyLocked: false,
    otGender: 0,
    nicknameLocked: false,
    otNames: { 1: 'ギンザル', 2: 'DUKING', 3: 'DOKING', 4: 'RODRIGO', 5: 'GRAND', 7: 'GERMÁN' },
    nicknameByLanguage: { 1: 'アサナン', 2: 'MEDITITE', 3: 'MEDITIKKA', 4: 'MEDITITE', 5: 'MEDITIE', 7: 'MEDITITE' },
    moves: [223, 93, 247, 197]
  },
  {
    id: 'xd_duking_shuckle',
    label: 'Pokémon XD - Duking Trade Shuckle',
    species: 213,
    level: 20,
    tid: 37149,
    sidType: 'PLAYER_SID',
    pidType: 'CXD',
    ivType: 'CXD_CORRELATED',
    fixedIVs: null,
    originGame: 15,
    location: 116,
    ball: 4,
    fateful: true,
    shinyLocked: false,
    otGender: 0,
    nicknameLocked: false,
    otNames: { 1: 'ギンザル', 2: 'DUKING', 3: 'DOKING', 4: 'RODRIGO', 5: 'GRAND', 7: 'GERMÁN' },
    nicknameByLanguage: { 1: 'ツボツボ', 2: 'SHUCKLE', 3: 'CARATROC', 4: 'SHUCKLE', 5: 'POTTROTT', 7: 'SHUCKLE' },
    moves: [92, 164, 188, 227]
  },
  {
    id: 'xd_duking_larvitar',
    label: 'Pokémon XD - Duking Trade Larvitar',
    species: 246,
    level: 20,
    tid: 37149,
    sidType: 'PLAYER_SID',
    pidType: 'CXD',
    ivType: 'CXD_CORRELATED',
    fixedIVs: null,
    originGame: 15,
    location: 116,
    ball: 4,
    fateful: true,
    shinyLocked: false,
    otGender: 0,
    nicknameLocked: false,
    otNames: { 1: 'ギンザル', 2: 'DUKING', 3: 'DOKING', 4: 'RODRIGO', 5: 'GRAND', 7: 'GERMÁN' },
    nicknameByLanguage: { 1: 'ヨーギラス', 2: 'LARVITAR', 3: 'EMBRYLEX', 4: 'LARVITAR', 5: 'LARVITAR', 7: 'LARVITAR' },
    moves: [201, 349, 44, 200]
  }
];

export const CXD_TRADE_SPECIES = new Set(CXD_TRADE_ENCOUNTERS.map(encounter => encounter.species));

export function getCXDTradesForSpecies(speciesId) {
  return CXD_TRADE_ENCOUNTERS.filter(encounter => encounter.species === Number(speciesId));
}

export function getCXDTradeById(id) {
  return CXD_TRADE_ENCOUNTERS.find(encounter => encounter.id === id) || null;
}

export function getCXDTradeLocalizedText(encounter, field, languageId) {
  const values = encounter?.[field];
  if (!values || typeof values !== 'object') return '';
  return values[String(languageId)] || values[String(EN)] || '';
}
