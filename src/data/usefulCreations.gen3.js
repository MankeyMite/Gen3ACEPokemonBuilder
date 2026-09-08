import { getLocalizedSpeciesName } from './localizedSpeciesNames.gen3.js';
import EXP_GROUPS from './expGroups.gen3.js';
import { buildPokemonBytes, toBase64Emerald } from '../lib/gen3/builder.js';
import { GROUP, expForLevel } from '../lib/exp.js';

export const USEFUL_CREATION_GAMES = Object.freeze([
  { value: 'EM', label: 'Emerald', originGame: 3 },
  { value: 'FR', label: 'FireRed', originGame: 4 },
  { value: 'LG', label: 'LeafGreen', originGame: 5 },
  { value: 'R', label: 'Ruby', originGame: 2 },
  { value: 'S', label: 'Sapphire', originGame: 1 },
]);

const DEVICES = Object.freeze({
  modern: Object.freeze({ value: 'modern', label: 'GBA / Nintendo DS / mGBA' }),
  switch: Object.freeze({ value: 'switch', label: 'Nintendo Switch' }),
  old: Object.freeze({ value: 'old', label: 'Old Emulator' }),
  myboy: Object.freeze({ value: 'myboy', label: 'MyBoy Emulator' }),
});

const EMERALD_LANGUAGES = Object.freeze([
  { value: 'eng', label: 'English', languageId: 2 },
  { value: 'spa', label: 'Spanish', languageId: 7 },
  { value: 'fra', label: 'French', languageId: 3 },
  { value: 'ita', label: 'Italian', languageId: 4 },
  { value: 'ger', label: 'German', languageId: 5 },
  { value: 'jap', label: 'Japanese', languageId: 1 },
]);

const FRLG_LANGUAGES = Object.freeze([
  { value: 'eng1', label: 'English 1.1', languageId: 2 },
  { value: 'eng0', label: 'English 1.0', languageId: 2 },
  { value: 'spa', label: 'Spanish', languageId: 7 },
  { value: 'fra', label: 'French', languageId: 3 },
  { value: 'ita', label: 'Italian', languageId: 4 },
  { value: 'ger', label: 'German', languageId: 5 },
  { value: 'jap1', label: 'Japanese 1.1', languageId: 1 },
  { value: 'jap0', label: 'Japanese 1.0', languageId: 1 },
]);

const SWITCH_LANGUAGES = Object.freeze([
  { value: 'eng10', label: 'English', languageId: 2 },
  { value: 'spa10', label: 'Spanish', languageId: 7 },
  { value: 'fra10', label: 'French', languageId: 3 },
  { value: 'ita10', label: 'Italian', languageId: 4 },
  { value: 'ger10', label: 'German', languageId: 5 },
]);

const RS_LANGUAGES = Object.freeze([
  { value: 'eng0', label: 'English', languageId: 2 },
  { value: 'spa0', label: 'Spanish', languageId: 7 },
  { value: 'fra0', label: 'French', languageId: 3 },
  { value: 'ita0', label: 'Italian', languageId: 4 },
  { value: 'ger0', label: 'German', languageId: 5 },
]);

const EMPTY_RIBBONS = Object.freeze({
  cool: 0,
  beauty: 0,
  cute: 0,
  smart: 0,
  tough: 0,
  champion: false,
  winning: false,
  victory: false,
  artist: false,
  effort: false,
  battleChampion: false,
  regionalChampion: false,
  nationalChampion: false,
  country: false,
  national: false,
  earth: false,
  world: false,
  fatefulEncounter: false,
});

const SPGTH_FILE_SUFFIXES = Object.freeze({
  eng: 'en',
  eng0: 'en',
  eng1: 'en_1',
  eng10: 'en',
  spa: 'es',
  spa10: 'es',
  fra: 'fr',
  fra10: 'fr',
  ita: 'it',
  ita10: 'it',
  ger: 'de',
  ger10: 'de',
  jap: 'jp',
  jap0: 'jp',
  jap1: 'jp_1',
});

function resolveSpgthSource(setup) {
  const suffix = SPGTH_FILE_SUFFIXES[setup.language];
  if (!suffix) return '';
  if (setup.game === 'EM') {
    return setup.device === 'switch' ? '' : `./useful-creations/spgth/sprite_Emerald_${suffix}.ek3`;
  }
  if (setup.game !== 'FR' && setup.game !== 'LG') return '';
  const gameName = setup.game === 'FR' ? 'FireRed' : 'LeafGreen';
  const switchName = setup.device === 'switch' ? 'Switch' : '';
  return `./useful-creations/spgth/grab_${gameName}${switchName}_${suffix}.ek3`;
}

export const USEFUL_CREATIONS = Object.freeze([
  Object.freeze({
    id: 'spgth-read-all-pokemon-data',
    label: 'Read ALL Pokémon data - Payload',
    speciesId: 114,
    speciesName: 'Tangela',
    spritePath: './src/data/Sprites/0114.png',
    description: 'A Tangela called “SPGHT” that reads a Pokémon’s raw data. Place it in Box 14, Slot 29, with the Pokémon you want to inspect in Slot 30. Move WELDR and the additional DexReg or nicknamed Pokémon out of Box 14 before using it. Execute ACE to print the first 40 bytes as hexadecimal across Boxes 1–10. To read the remaining 40 bytes, apply any markings to SPGHT and execute ACE again; Boxes 1–10 will then contain the rest. This can also help “transport” Pokémon between platforms or games: read its data in one game, then recreate it with the Base64 writer in another.',
    resolveBinarySource: resolveSpgthSource,
  }),
  Object.freeze({
    id: 'catching-smeargle',
    label: 'Catching Smeargle',
    speciesId: 235,
    speciesName: 'Smeargle',
    spritePath: './src/data/Sprites/0235.png',
    description: 'A level 50 Smeargle with Spore, False Swipe, Mean Look, and Sweet Scent. It can put targets to sleep, leave them at 1 HP, stop roaming Pokémon from fleeing, and start wild encounters.',
    level: 50,
    pid: 0x45A51234,
    moves: [147, 206, 212, 230],
    pokerusState: 0,
  }),
  Object.freeze({
    id: 'field-smeargle',
    label: 'Field-move Smeargle',
    speciesId: 235,
    speciesName: 'Smeargle',
    spritePath: './src/data/Sprites/0235.png',
    description: 'A level 50 Smeargle with Fly, Surf, Strength, and Rock Smash. It keeps four common field moves on one Pokémon; the usual badge requirements still apply.',
    level: 50,
    pid: 0x45A5124D,
    moves: [19, 57, 70, 249],
    pokerusState: 0,
  }),
  Object.freeze({
    id: 'pokerus-zigzagoon',
    label: 'Pokérus donor Zigzagoon',
    speciesId: 288,
    speciesName: 'Zigzagoon',
    spritePath: './src/data/Sprites/0263.png',
    description: 'A level 5 Zigzagoon with active Pokérus and Pickup. Keep it in your party beside other Pokémon to spread Pokérus, then store an infected Pokémon in the PC before midnight to preserve an active donor.',
    level: 5,
    pid: 0x45A51266,
    moves: [33, 45, 39, 0],
    pokerusState: 0x14,
  }),
]);

export function getUsefulCreationDevices(game) {
  if (game === 'EM') return [DEVICES.modern, DEVICES.old, DEVICES.myboy];
  if (game === 'FR' || game === 'LG') return [DEVICES.modern, DEVICES.switch, DEVICES.old, DEVICES.myboy];
  if (game === 'R' || game === 'S') return [DEVICES.modern];
  return [];
}

export function getUsefulCreationLanguages(game, device) {
  if (!game || !device) return [];
  if (game === 'EM') {
    return device === 'myboy'
      ? EMERALD_LANGUAGES.filter(language => language.value !== 'jap')
      : [...EMERALD_LANGUAGES];
  }
  if (game === 'FR' || game === 'LG') {
    if (device === 'switch') return [...SWITCH_LANGUAGES];
    return device === 'myboy'
      ? FRLG_LANGUAGES.filter(language => language.languageId !== 1)
      : [...FRLG_LANGUAGES];
  }
  if (game === 'R' || game === 'S') return [...RS_LANGUAGES];
  return [];
}

export function getUsefulCreationsForSetup({ game, device, language } = {}) {
  const validDevice = getUsefulCreationDevices(game).some(option => option.value === device);
  const validLanguage = getUsefulCreationLanguages(game, device).some(option => option.value === language);
  if (!validDevice || !validLanguage) return [];
  const setup = { game, device, language };
  return USEFUL_CREATIONS.filter(creation => !creation.resolveBinarySource || creation.resolveBinarySource(setup));
}

function makeCreationConfig(creation, setup) {
  const game = USEFUL_CREATION_GAMES.find(option => option.value === setup.game);
  const language = getUsefulCreationLanguages(setup.game, setup.device)
    .find(option => option.value === setup.language);
  if (!game || !language) throw new Error('Choose a supported game, device, and language first.');

  const level = creation.level;
  const growthGroup = EXP_GROUPS[creation.speciesId] ?? GROUP.MEDIUM_FAST;
  return {
    speciesId: creation.speciesId,
    itemId: 0,
    totalExp: expForLevel(growthGroup, level),
    moves: creation.moves,
    pps: [3, 3, 3, 3],
    friendship: 255,
    evs: { hp: 0, atk: 0, def: 0, spe: 0, spa: 0, spd: 0 },
    contest: { cool: 0, beauty: 0, cute: 0, smart: 0, tough: 0, sheen: 0 },
    metLocationId: 255,
    metLevel: level,
    originGame: game.originGame,
    ballId: 4,
    otGender: 0,
    ivs: { hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31 },
    abilityBit: 0,
    isEgg: false,
    ribbons: EMPTY_RIBBONS,
    pokerusState: creation.pokerusState,
    tid: 30317,
    sid: 4919,
    pid: creation.pid,
    natureIndex: creation.pid % 25,
    forceShiny: false,
    languageId: language.languageId,
    nickname: getLocalizedSpeciesName(creation.speciesId, language.languageId),
    otName: language.languageId === 1 ? 'ＡＣＥ' : 'UTILITY',
    markings: { circle: false, triangle: false, square: false, heart: false },
    extraBytes: 0,
    level,
  };
}

function toJapaneseKeyboardCode(text) {
  return String(text || '').split('\n').map(line => {
    if (!/^\s*Box \d+:/.test(line)) return line;
    return line.replace(/\(([^)]*)\)/, (match, code) => {
      const keyboardCode = code.replace(/[A-Za-z0-9_]/g, character => {
        if (character === '_') return '\u3000';
        return String.fromCharCode(character.charCodeAt(0) + 0xFEE0);
      });
      return `(${keyboardCode})`;
    });
  }).join('\n');
}

export function normalizeUsefulCreationEk3(inputBytes) {
  const bytes = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes || []);
  if (bytes.length < 80) throw new Error(`The payload file contains ${bytes.length} bytes; at least 80 are required.`);
  if (bytes.length > 80 && bytes.slice(80).some(byte => byte !== 0)) {
    throw new Error('The payload file has unexpected non-zero data after its 80-byte box record.');
  }
  return bytes.slice(0, 80);
}

async function fetchUsefulCreationBinary(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`The payload file could not be loaded (${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateUsefulCreationCode(creationId, setup, { loadBinary = fetchUsefulCreationBinary } = {}) {
  const available = getUsefulCreationsForSetup(setup);
  const creation = available.find(option => option.id === creationId);
  if (!creation) throw new Error('Choose a useful Pokémon available for this setup.');

  let bytes;
  if (creation.resolveBinarySource) {
    const source = creation.resolveBinarySource(setup);
    bytes = normalizeUsefulCreationEk3(await loadBinary(new URL(source, import.meta.url)));
  } else {
    bytes = buildPokemonBytes(makeCreationConfig(creation, setup)).bytes;
  }

  const base64 = toBase64Emerald(bytes, { switchSafe: setup.device === 'switch' });
  if (!base64?.text) throw new Error('The Base64 code could not be generated.');
  const language = getUsefulCreationLanguages(setup.game, setup.device)
    .find(option => option.value === setup.language);
  return {
    creation,
    text: language?.languageId === 1 ? toJapaneseKeyboardCode(base64.text) : base64.text,
    substitutionUsed: Boolean(base64.substitutionUsed),
    bytes,
  };
}
