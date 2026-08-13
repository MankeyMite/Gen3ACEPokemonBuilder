/**
 * Gen III distributions missing from the original hand-curated JSON.
 *
 * The inventory follows PKHeX's EncountersWC3, PCNY and PCJP encounter
 * tables. National Pokédex numbers are converted to this builder's Gen III
 * internal species IDs at module load time.
 */
import { SPECIES } from './species.gen3.js';
import { NATIONAL_DEX } from './nationalDex.gen3.js';

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const internalByName = new Map(SPECIES.map(([id, name]) => [normalize(name), Number(id)]));
const nameByNational = new Map(NATIONAL_DEX.map(([dex, name]) => [Number(dex), name]));

export function nationalToInternalSpecies(nationalDex) {
  const name = nameByNational.get(Number(nationalDex));
  const internal = internalByName.get(normalize(name));
  if (!internal) throw new Error(`No Gen III internal species ID for National Dex ${nationalDex}`);
  return internal;
}

const events = {};
const pokemon = [];

function addEvent(tag, event, variants = []) {
  const normalizedVariants = variants.map(variant => {
    const { national, moves, ...details } = variant;
    return {
      tag,
      species: nationalToInternalSpecies(national),
      ...details,
      ...(moves ? { moves: moves.filter(Boolean) } : {}),
    };
  });
  const species = [...new Set(normalizedVariants.map(variant => variant.species))];
  const movesBySpecies = {};
  for (const variant of normalizedVariants) {
    if (variant.moves) movesBySpecies[variant.species] = variant.moves;
  }
  events[tag] = {
    ...event,
    species,
    ...(Object.keys(movesBySpecies).length ? { movesBySpecies } : {}),
  };
  pokemon.push(...normalizedVariants);
}

// Exact preserved specimens from the September 25, 2004 Toys "R" Us
// Trade and Battle Day. These were ordinary FR/LG captures cloned onto the
// JEREMY distribution saves, so their original PID, IVs, capture location,
// game, Ball, moves and trainer data are all part of the preset identity.
// Machoke and Haunter evolve during the distribution trade; the authentic
// received specimens are therefore Machamp and Gengar.
function addJeremySpecimen({
  tag, label, national, level, tid, sid, otGender, originGame, location,
  ball = 4, pid, ivs, pidMethod, nature, gender, ability, moves,
}) {
  addEvent(`JEREMY_${tag}`, {
    label: `Trade and Battle Day — JEREMY ${label}`,
    fixedEvent: true,
    fixedTID: tid,
    fixedSID: sid,
    fixedOTName: 'JEREMY',
    ot_name: 'JEREMY',
    ot_gender: otGender,
    nickname: label.includes('→') ? label.split('→').at(-1).trim().toUpperCase() : label.toUpperCase(),
    nicknameLocked: true,
    defaultLanguage: 2,
    allowedLanguages: [2],
    defaultOriginGame: originGame,
    allowedOriginGames: [originGame],
    defaultMetLocationId: location,
    defaultMetLevel: level,
    current_level: level,
    defaultBall: ball === 5 ? 'Safari Ball' : 'Poké Ball',
    defaultBallId: ball,
    defaultNoItem: true,
    defaultFatefulEncounter: false,
    shinyLocked: true,
    pidMethod,
    fixedPID: pid >>> 0,
    fixedIVs: { hp: ivs[0], atk: ivs[1], def: ivs[2], spe: ivs[3], spa: ivs[4], spd: ivs[5] },
    fixedNature: nature,
    fixedGender: gender,
    fixedAbility: ability,
  }, [{
    national,
    level,
    moves,
    pid: `0x${(pid >>> 0).toString(16).toUpperCase().padStart(8, '0')}`,
    ivs,
    nature,
    gender,
    ability,
  }]);
}

const jeremySpecimens = [
  { tag: 'EKANS', label: 'Ekans', national: 23, level: 14, tid: 24680, sid: 13330, otGender: 'female', originGame: 4, location: 111, pid: 0xE9D9B217, ivs: [26, 28, 6, 11, 14, 30], pidMethod: 'H4', nature: 6, gender: 'female', ability: 1, moves: [35, 43, 40, 44] },
  { tag: 'VULPIX', label: 'Vulpix', national: 37, level: 18, tid: 13579, sid: 26437, otGender: 'male', originGame: 5, location: 107, pid: 0x65A0DE74, ivs: [15, 6, 3, 22, 25, 13], pidMethod: 'H4', nature: 24, gender: 'female', ability: 0, moves: [39, 46, 98, 261] },
  { tag: 'ODDISH', label: 'Oddish', national: 43, level: 26, tid: 24680, sid: 13330, otGender: 'female', originGame: 4, location: 115, pid: 0xA23E7080, ivs: [11, 9, 31, 1, 14, 26], pidMethod: 'H4', nature: 24, gender: 'male', ability: 0, moves: [77, 78, 79, 51] },
  { tag: 'PSYDUCK', label: 'Psyduck', national: 54, level: 27, tid: 24680, sid: 13330, otGender: 'female', originGame: 4, location: 139, pid: 0xEBAEB6DA, ivs: [31, 16, 12, 14, 29, 31], pidMethod: 'H4', nature: 9, gender: 'male', ability: 0, moves: [39, 50, 93, 103] },
  { tag: 'GROWLITHE', label: 'Growlithe', national: 58, level: 32, tid: 24680, sid: 13330, otGender: 'female', originGame: 4, location: 135, pid: 0xD6A3173E, ivs: [11, 24, 28, 2, 1, 20], pidMethod: 'H1', nature: 17, gender: 'female', ability: 0, moves: [43, 316, 36, 172] },
  { tag: 'MACHAMP', label: 'Machoke → Machamp', national: 68, level: 38, tid: 13579, sid: 26437, otGender: 'male', originGame: 5, location: 175, pid: 0xF48C3744, ivs: [9, 23, 25, 10, 20, 15], pidMethod: 'H4', nature: 17, gender: 'male', ability: 0, moves: [69, 193, 279, 233] },
  { tag: 'GENGAR', label: 'Haunter → Gengar', national: 94, level: 23, tid: 13579, sid: 26437, otGender: 'male', originGame: 5, location: 140, pid: 0x227AD925, ivs: [19, 14, 0, 27, 14, 17], pidMethod: 'H1', nature: 0, gender: 'female', ability: 0, moves: [180, 174, 101, 109] },
  { tag: 'STARYU', label: 'Staryu', national: 120, level: 18, tid: 13579, sid: 26437, otGender: 'male', originGame: 5, location: 96, pid: 0xEAAFB104, ivs: [10, 3, 22, 18, 24, 3], pidMethod: 'H4', nature: 10, gender: 'genderless', ability: 0, moves: [106, 55, 229, 105] },
  { tag: 'TAUROS', label: 'Tauros', national: 128, level: 25, tid: 13579, sid: 26437, otGender: 'male', originGame: 5, location: 136, ball: 5, pid: 0xA5967A6D, ivs: [14, 19, 12, 26, 17, 5], pidMethod: 'H4', nature: 6, gender: 'male', ability: 0, moves: [99, 30, 184, 228] },
];
for (const specimen of jeremySpecimens) addJeremySpecimen(specimen);

// Deliberately excluded from exact presets: no verified JEREMY Sandshrew,
// Slowpoke or Shellder specimen is publicly preserved. The Stamp Contest
// Pichu and Absol likewise have no verified OT/TID/PID record. Adding either
// set would require fabricating identity data and would defeat legal-mode's
// exact-preset guarantee.

function japaneseGift(tag, label, national, level, tid, otName, moves, options = {}) {
  addEvent(tag, {
    label,
    fixedTID: tid,
    fixedSID: 0,
    ot_name: otName,
    defaultLanguage: 1,
    allowedLanguages: [1],
    defaultOriginGame: options.defaultOriginGame ?? 2,
    allowedOriginGames: options.allowedOriginGames ?? [options.defaultOriginGame ?? 2],
    defaultMetLocationId: 255,
    defaultMetLevel: level,
    current_level: level,
    defaultBall: 'Poke Ball',
    defaultNoItem: true,
    defaultFatefulEncounter: Boolean(options.fateful),
    shinyLocked: options.alwaysShiny ? false : options.shinyLocked !== false,
    alwaysShiny: Boolean(options.alwaysShiny),
    pidMethod: options.pidMethod || 'BACD_R_A',
    ...(options.otGender ? { ot_gender: options.otGender } : {}),
    ...(options.otGenderMethod ? { otGenderMethod: options.otGenderMethod } : {}),
    ...(options.usesRecipientOtGender ? { usesRecipientOtGender: true } : {}),
    ...(options.berryFixOtPreference ? { berryFixOtPreference: options.berryFixOtPreference } : {}),
    ...(options.tableNationalSpecies ? { tableNationalSpecies: options.tableNationalSpecies } : {}),
    ...(options.ribbons ? { ribbons: options.ribbons } : {}),
  }, [{ national, moves }]);
}

// Japanese cartridge/disc distributions in PKHeX's EncountersWC3.Japan.
japaneseGift('JPN_BERRY_FIX_RUBY', 'Japanese Berry Program Update — RUBY Zigzagoon', 263, 5, 21121, 'ルビー', [33, 45, 39], { pidMethod: 'BACD_RBCD', alwaysShiny: true, defaultOriginGame: 1, otGender: 'female', berryFixOtPreference: 'RUBY' });
japaneseGift('JPN_BERRY_FIX_SAPPHIRE', 'Japanese Berry Program Update — SAPPHIRE Zigzagoon', 263, 5, 21121, 'サファイア', [33, 45, 39], { pidMethod: 'BACD_RBCD', alwaysShiny: true, defaultOriginGame: 1, otGender: 'male', berryFixOtPreference: 'SAPHIRE' });
japaneseGift('NEGAI_BOSHI_JIRACHI_TABLE', 'Negai Boshi Jirachi — table-restricted', 385, 5, 30719, 'ネガイボシ', [273, 93, 156], { pidMethod: 'BACD_TA', otGender: 'male', tableNationalSpecies: 385 });
japaneseGift('NEGAI_BOSHI_JIRACHI_RECIPIENT', 'Negai Boshi Jirachi — recipient OT gender', 385, 5, 30719, 'ネガイボシ', [273, 93, 156], { pidMethod: 'BACD_U_AX', allowedOriginGames: [1, 2], otGenderMethod: 'RECIPIENT', usesRecipientOtGender: true });
japaneseGift('TANABATA_JIRACHI_2004', 'Tanabata Jirachi (2004)', 385, 5, 40707, 'タナバタ', [273, 93, 156], { otGender: 'female' });
japaneseGift('ANA_PIKACHU', 'ANA Pikachu', 25, 10, 41205, 'ＡＮＡ', [19, 84, 39, 86], { otGender: 'male' });
japaneseGift('POKEPARK_MEOWTH', 'PokéPark Meowth', 52, 5, 50318, 'ポケパーク', [10, 45], { otGender: 'male' });
japaneseGift('YOKOHAMA_PIKACHU', 'Yokohama Pikachu', 25, 10, 50319, 'ヨコハマ', [84, 45, 86, 57], { otGender: 'male' });
japaneseGift('HADOU_MEW', 'Hadou Mew', 151, 10, 50716, 'ハドウ', [1, 144], { fateful: true, otGenderMethod: 'RAND_D3' });
japaneseGift('GW_PIKACHU', 'GW Pikachu', 25, 10, 50425, 'ＧＷ', [45, 39, 86, 19], { otGenderMethod: 'RAND_S3' });
japaneseGift('SAPPORO_PIKACHU', 'Sapporo Pikachu', 25, 10, 50701, 'サッポロ', [45, 39, 86, 19], { otGender: 'male' });
japaneseGift('TANABATA_JIRACHI_2005', 'Tanabata Jirachi (2005)', 385, 5, 50707, 'タナバタ', [273, 93, 156], { otGender: 'female' });
japaneseGift('FESTA_METANG', 'Festa Metang', 375, 30, 2005, 'フェスタ', [36, 93, 232, 287], { otGender: 'male', ribbons: { national: true } });
japaneseGift('SUNDAY_WOBBUFFET', 'Sunday Wobbuffet', 202, 5, 50701, 'サンデー', [68, 243, 219, 194], { otGenderMethod: 'RAND_S3' });
for (const [name, national] of [['Regirock', 377], ['Regice', 378], ['Registeel', 379]]) {
  japaneseGift(`HADOU_${name.toUpperCase()}`, `Hadou ${name}`, national, 40, 50901, 'ハドウ', [174, 276, 246, 63], { otGenderMethod: 'RAND_SG15' });
}
japaneseGift('POKEPARK_MEW', 'PokéPark Mew', 151, 30, 60510, 'ポケパーク', [1, 144, 5, 118], { fateful: true, otGenderMethod: 'RAND_D3' });
japaneseGift('POKEPARK_CELEBI', 'PokéPark Celebi', 251, 30, 60623, 'ポケパーク', [215, 219, 246, 248], { otGenderMethod: 'RAND_S7' });
japaneseGift('TANABATA_JIRACHI_2006', 'Tanabata Jirachi (2006)', 385, 5, 60707, 'タナバタ', [273, 93, 156], { otGenderMethod: 'RAND_S7' });
japaneseGift('POKEPARK_JIRACHI_60731', 'PokéPark Jirachi — 60731', 385, 30, 60731, 'ポケパーク', [273, 94, 270, 156], { otGenderMethod: 'RAND_D3' });
japaneseGift('POKEPARK_JIRACHI_60830', 'PokéPark Jirachi — 60830', 385, 30, 60830, 'ポケパーク', [273, 94, 270, 156], { otGenderMethod: 'RAND_D3' });

function addHatchedEvent(tag, label, pidMethod, variants, options = {}) {
  addEvent(tag, {
    label,
    defaultLanguage: options.defaultLanguage ?? 1,
    allowedLanguages: options.allowedLanguages || [1, 2, 3, 4, 5, 7],
    defaultOriginGame: options.defaultOriginGame ?? 2,
    allowedOriginGames: options.allowedOriginGames || [1, 2, 3, 4, 5],
    defaultMetLocationId: options.defaultMetLocationId ?? 88,
    defaultBall: 'Poke Ball',
    defaultMetLevel: 0,
    current_level: 5,
    defaultFatefulEncounter: Boolean(options.fateful),
    defaultIsEgg: false,
    defaultNoItem: true,
    usesHatcherTrainerData: true,
    pidMethod,
    alwaysShiny: Boolean(options.alwaysShiny),
    shinyLocked: Boolean(options.shinyLocked),
    ...(options.fixedTID !== undefined ? { fixedTID: options.fixedTID } : {}),
    ...(options.fixedSID !== undefined ? { fixedSID: options.fixedSID } : {}),
    ...(options.ot_name ? { ot_name: options.ot_name } : {}),
    ...(options.ot_gender ? { ot_gender: options.ot_gender } : {}),
    ...(options.tableNationalSpecies ? { tableNationalSpecies: options.tableNationalSpecies } : {}),
    ...(options.tableWish !== undefined ? { tableWish: Boolean(options.tableWish) } : {}),
    ...(options.fatefulInFRLGOnly ? { fatefulInFRLGOnly: true } : {}),
  }, variants);
}

const fifthEggs = [
  ['PICHU_TEETER_SHINY', 'PCJP 5th Anniversary — shiny Pichu (Teeter Dance)', 172, [84, 204, 298], 'BACD_TS', true],
  ['PICHU_WISH_SHINY', 'PCJP 5th Anniversary — shiny Pichu (Wish)', 172, [84, 204, 273], 'BACD_TS', true],
  ['PICHU_TEETER', 'PCJP 5th Anniversary — Pichu (Teeter Dance)', 172, [84, 204, 298], 'BACD_TA', false],
  ['PICHU_WISH', 'PCJP 5th Anniversary — Pichu (Wish)', 172, [84, 204, 273], 'BACD_TA', false],
  ['RALTS_CHARM', 'PCJP 5th Anniversary — Ralts (Charm)', 280, [45, 204], 'BACD_TA', false],
  ['RALTS_WISH', 'PCJP 5th Anniversary — Ralts (Wish)', 280, [45, 273], 'BACD_TA', false],
  ['ABSOL_SPITE', 'PCJP 5th Anniversary — Absol (Spite)', 359, [10, 43, 180], 'BACD_TA', false],
  ['ABSOL_WISH', 'PCJP 5th Anniversary — Absol (Wish)', 359, [10, 43, 273], 'BACD_TA', false],
  ['BAGON_IRON_DEFENSE', 'PCJP 5th Anniversary — Bagon (Iron Defense)', 371, [99, 44, 334], 'BACD_TA', false],
  ['BAGON_WISH', 'PCJP 5th Anniversary — Bagon (Wish)', 371, [99, 44, 273], 'BACD_TA', false],
];
for (const [suffix, label, national, moves, method, shiny] of fifthEggs) {
  addHatchedEvent(`PCJP_5TH_EGG_${suffix}`, label, method, [{ national, moves }], {
    allowedOriginGames: [2],
    defaultOriginGame: 2,
    alwaysShiny: shiny,
    shinyLocked: !shiny,
    tableNationalSpecies: national,
    tableWish: moves.includes(273),
  });
}

addHatchedEvent('PCJP_EGG_POKEMON_PRESENT', 'PCJP Egg Pokémon Present', 'METHOD_2', [
  { national: 43, moves: [71, 73] },
  { national: 52, moves: [10, 45, 80] },
  { national: 60, moves: [145, 186] },
  { national: 69, moves: [22, 298] },
], { allowedOriginGames: [4, 5], defaultOriginGame: 4, fateful: true });

const pokeParkEggs = [
  { national: 54, moves: [346, 10, 39, 300] }, { national: 172, moves: [84, 204, 266] },
  { national: 174, moves: [47, 204, 111, 321] }, { national: 222, moves: [33, 300] },
  { national: 276, moves: [64, 45, 116, 297] }, { national: 283, moves: [145, 300] },
  { national: 293, moves: [1, 253, 298] }, { national: 300, moves: [45, 33, 39, 205] },
  { national: 311, moves: [45, 86, 346] }, { national: 312, moves: [45, 86, 300] },
  { national: 325, moves: [150, 253] }, { national: 327, moves: [33, 253, 47] },
  { national: 331, moves: [40, 43, 71, 227] }, { national: 341, moves: [145, 346] },
  { national: 360, moves: [150, 204, 227, 321] },
];
addHatchedEvent('POKEPARK_EGGS_WONDERCARD', 'PokéPark Eggs — Wonder Card', 'METHOD_2', pokeParkEggs, {
  allowedOriginGames: [3, 4, 5], defaultOriginGame: 4, fateful: true,
  fatefulInFRLGOnly: true,
});
addHatchedEvent('POKEPARK_EGGS_DS_DOWNLOAD', 'PokéPark Eggs — DS Download Play', 'BACD_R', pokeParkEggs, {
  allowedOriginGames: [2], defaultOriginGame: 2,
});

// Pokémon Center Japan "Gather More Pokémon" campaigns.
const pcjpCampaigns = [
  [1, 51126, [252, 255, 258]],
  [2, 51224, [152, 155, 158]],
  [3, 60114, [23, 25, 52, 58, 69, 79, 90, 113, 115, 123, 125, 126, 128, 198, 200, 211, 215, 225, 226]],
  [4, 60227, [1, 4, 7]],
  [5, 60321, [25, 270, 273, 283, 300, 302, 303, 307, 311, 312, 315, 335, 336, 337, 338, 358]],
  [6, 60505, [25, 163, 179, 190, 191, 202, 204, 207, 209, 213, 216, 228, 234, 235]],
];
for (const [campaign, tid, nationalSpecies] of pcjpCampaigns) {
  const allowedOtNames = ['トウキョー', 'ヨコハマ', 'ナゴヤ', 'オーサカ', 'フクオカ'];
  if (campaign !== 6) allowedOtNames.push('サッポロ');
  addEvent(`PCJP_GATHER_MORE_${campaign}`, {
    label: `PCJP Gather More Pokémon — Campaign ${campaign}`,
    fixedTID: tid,
    fixedSID: 0,
    ot_name: 'トウキョー',
    allowedOtNames,
    defaultLanguage: 1,
    allowedLanguages: [1],
    defaultOriginGame: 2,
    allowedOriginGames: [2],
    defaultMetLocationId: 255,
    defaultMetLevel: 10,
    current_level: 10,
    defaultBall: 'Poke Ball',
    defaultNoItem: true,
    defaultFatefulEncounter: false,
    shinyLocked: true,
    pidMethod: 'BACD_R_A',
    otGenderMethod: 'RAND_S7',
  }, nationalSpecies.map(national => ({ national })));
}

// PCNY direct-download campaigns. PKHeX permits a campaign-specific PCNY OT
// and a TID in 00001..02999; the builder uses one legal representative pair.
const pcnyRows = [
  ['EVOLUTION_PIKACHU', 'Evolution', 'PCNYc', 25, 50, [85, 97, 87, 113]],
  ['EVOLUTION_GLOOM', 'Evolution', 'PCNYc', 44, 50, [79, 51, 236, 80]],
  ['EVOLUTION_STARYU', 'Evolution', 'PCNYc', 120, 50, [107, 113, 322, 56]],
  ['DRAGON_SEADRA_ICE_BEAM', 'Dragon Week', 'PCNYc', 117, 45, [82, 56, 239, 58]],
  ['DRAGON_SEADRA_LEER', 'Dragon Week', 'PCNYc', 117, 45, [82, 56, 239, 43]],
  ['DRAGON_FLYGON', 'Dragon Week', 'PCNYc', 330, 45, [328, 242, 225, 53]],
  ['DRAGON_ALTARIA_ICE_BEAM', 'Dragon Week', 'PCNYc', 334, 45, [332, 225, 349, 53]],
  ['DRAGON_ALTARIA_DRAGON_DANCE', 'Dragon Week', 'PCNYc', 334, 45, [36, 225, 349, 58]],
  ['DRAGON_SALAMENCE', 'Dragon Week', 'PCNYc', 373, 50, [182, 225, 37, 19]],
  ['MONSTER_SHEDINJA', 'Monster Week', 'PCNYc', 292, 50, [180, 109, 247, 288]],
  ['MONSTER_CACTURNE', 'Monster Week', 'PCNYc', 332, 50, [185, 191, 302, 178]],
  ['MONSTER_SHUPPET', 'Monster Week', 'PCNYc', 353, 25, [103, 101, 174, 180]],
  ['MONSTER_DUSKULL', 'Monster Week', 'PCNYc', 355, 25, [50, 193, 310, 109]],
  ['HALLOWEEN_EXPLOUD_50', 'Halloween', 'PCNYc', 295, 50, [23, 304, 247, 46]],
  ['HALLOWEEN_EXPLOUD_100', 'Halloween', 'PCNYc', 295, 100, [46, 247, 280, 304]],
  ['HALLOWEEN_AGGRON_50', 'Halloween', 'PCNYc', 306, 50, [269, 231, 182, 232]],
  ['HALLOWEEN_AGGRON_100', 'Halloween', 'PCNYc', 306, 100, [231, 337, 58, 38]],
  ['HALLOWEEN_WAILORD_50', 'Halloween', 'PCNYc', 321, 50, [352, 59, 156, 323]],
  ['HALLOWEEN_WAILORD_100', 'Halloween', 'PCNYc', 321, 100, [59, 323, 89, 56]],
  ['HALLOWEEN_CRAWDAUNT_50', 'Halloween', 'PCNYc', 342, 50, [91, 61, 152, 14]],
  ['HALLOWEEN_CRAWDAUNT_100', 'Halloween', 'PCNYc', 342, 100, [92, 152, 258, 12]],
  ['EX_DRAGON_ALTARIA', 'Extreme Dragon Week', 'PCNYc', 334, 45, [36, 225, 349, 287]],
  ['EX_DRAGON_FLYGON', 'Extreme Dragon Week', 'PCNYc', 330, 45, [328, 242, 225, 103]],
  ['EX_DRAGON_SEADRA', 'Extreme Dragon Week', 'PCNYc', 117, 32, [108, 43, 55, 239]],
  ['EX_DRAGON_SALAMENCE', 'Extreme Dragon Week', 'PCNYc', 373, 50, [182, 225, 184, 19]],
  ['SPRING_GARDEVOIR', 'Spring', 'PCNYd', 282, 35, [100, 347, 94, 286]],
  ['SPRING_TROPIUS', 'Spring', 'PCNYd', 357, 30, [75, 23, 230, 18]],
  ['SPRING_SALAMENCE', 'Spring', 'PCNYd', 373, 50, [182, 225, 184, 19]],
  ['COLOSSEUM_HOUNDOUR', 'Colosseum', 'PCNYd', 228, 5, [43, 52]],
  ['COLOSSEUM_MAREEP', 'Colosseum', 'PCNYd', 179, 5, [33, 45]],
  ['BOX_FLYGON', 'Pokémon Box', 'PCNYd', 330, 45, [328, 242, 225, 103]],
  ['BOX_SEVIPER', 'Pokémon Box', 'PCNYd', 336, 30, [342, 103, 137, 242]],
  ['BOX_ABSOL_SPITE', 'Pokémon Box', 'PCNYd', 359, 35, [13, 44, 14, 180]],
  ['BOX_ABSOL_WISH', 'Pokémon Box', 'PCNYd', 359, 35, [13, 44, 14, 273]],
  ['BABY_AZURILL', 'Baby Trade', 'PCNYd', 298, 5, [150, 204]],
  ['BABY_WYNAUT', 'Baby Trade', 'PCNYd', 360, 5, [150, 204, 227]],
  ['BABY_HUNTAIL', 'Baby Trade', 'PCNYd', 367, 20, [250, 44, 103]],
  ['BABY_GOREBYSS', 'Baby Trade', 'PCNYd', 368, 20, [250, 93, 97]],
  ['SLITHER_KINGDRA', 'Slither & Swim', 'PCNYd', 230, 35, [108, 43, 55, 239]],
  ['SLITHER_ZANGOOSE', 'Slither & Swim', 'PCNYd', 335, 18, [43, 98, 14, 210]],
  ['SLITHER_SEVIPER', 'Slither & Swim', 'PCNYd', 336, 18, [35, 122, 44, 342]],
  ['SLITHER_MILOTIC', 'Slither & Swim', 'PCNYd', 350, 35, [352, 239, 105, 240]],
  ['ALIENS_SABLEYE', 'Ancient Aliens', 'PCNYd', 302, 18, [193, 101, 310, 154]],
  ['ALIENS_MAWILE', 'Ancient Aliens', 'PCNYd', 303, 18, [310, 313, 44, 230]],
  ['ALIENS_CRADILY', 'Ancient Aliens', 'PCNYd', 346, 40, [51, 275, 109, 133]],
  ['ALIENS_ARMALDO', 'Ancient Aliens', 'PCNYd', 348, 40, [55, 232, 182, 246]],
  ['SIXTH_MACHAMP', '6th Anniversary', 'PCNYd', 68, 30, [2, 69, 193, 279]],
  ['SIXTH_GOLEM', '6th Anniversary', 'PCNYd', 76, 30, [88, 222, 120, 205]],
  ['SIXTH_LUDICOLO', '6th Anniversary', 'PCNYd', 272, 20, [310, 45, 71, 267]],
  ['SIXTH_SHIFTRY', '6th Anniversary', 'PCNYd', 275, 20, [1, 106, 74, 267]],
];

const pcnyVariantLabels = Object.freeze({
  DRAGON_SEADRA_ICE_BEAM: 'Ice Beam',
  DRAGON_SEADRA_LEER: 'Leer',
  // Preserve the existing stable tags while labeling these Altaria variants
  // by the move that actually distinguishes their distributed movesets.
  DRAGON_ALTARIA_ICE_BEAM: 'Flamethrower',
  DRAGON_ALTARIA_DRAGON_DANCE: 'Ice Beam',
  BOX_ABSOL_SPITE: 'Spite',
  BOX_ABSOL_WISH: 'Wish',
});

for (const [suffix, campaign, otName, national, level, moves] of pcnyRows) {
  const speciesName = nameByNational.get(national) || `#${national}`;
  const variantLabel = pcnyVariantLabels[suffix];
  const allowedOtNames = campaign === 'Evolution'
    ? ['PCNYb', 'PCNYc']
    : campaign === 'Dragon Week'
      ? ['PCNYb', 'PCNYc', 'PCNYd']
      : ['Monster Week', 'Halloween', 'Extreme Dragon Week'].includes(campaign)
        ? ['PCNYb', 'PCNYc']
        : ['Spring', 'Colosseum', 'Pokémon Box'].includes(campaign)
          ? ['PCNYc', 'PCNYd']
          : ['PCNYd'];
  addEvent(`PCNY_${suffix}`, {
    label: `PCNY ${campaign} — ${speciesName} (Lv${level})${variantLabel ? ` — ${variantLabel}` : ''}`,
    defaultTID: 1,
    tidRange: [1, 2999],
    fixedSID: 0,
    ot_name: otName,
    allowedOtNames,
    otGenderMethod: 'RECIPIENT',
    usesRecipientOtGender: true,
    defaultLanguage: 2,
    allowedLanguages: [2],
    defaultOriginGame: 2,
    allowedOriginGames: [1, 2],
    defaultMetLocationId: 255,
    defaultMetLevel: level,
    current_level: level,
    defaultBall: 'Poke Ball',
    defaultNoItem: true,
    defaultFatefulEncounter: false,
    shinyLocked: true,
    pidMethod: 'BACD_U_AX',
  }, [{ national, level, moves }]);
}

export const MYSTERY_GIFT_EVENTS_SUPPLEMENTAL = Object.freeze(events);
export const MYSTERY_GIFT_POKEMON_SUPPLEMENTAL = Object.freeze(pokemon);

export const MYSTERY_GIFT_SUPPLEMENTAL_COUNTS = Object.freeze({
  events: Object.keys(events).length,
  pokemon: pokemon.length,
  jeremy: jeremySpecimens.length,
  japaneseWC3: Object.keys(events).filter(tag => /^(JPN_|NEGAI_|TANABATA_|ANA_|POKEPARK_(MEOWTH|MEW|CELEBI|JIRACHI)|YOKOHAMA_|HADOU_|GW_|SAPPORO_|FESTA_|SUNDAY_)/.test(tag)).length,
  pcny: pcnyRows.length,
  pcjpCampaigns: pcjpCampaigns.length,
});
