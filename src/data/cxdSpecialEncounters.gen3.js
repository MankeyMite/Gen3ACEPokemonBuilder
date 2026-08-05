/** Non-shadow and special Pokémon Colosseum / XD encounters from PKHeX. */
import { nationalToInternalSpecies as species } from './mysteryGiftsSupplemental.gen3.js';

const pokeBall = 4;
const allZeroIVs = Object.freeze({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

const encounter = (data) => Object.freeze({
  originGame: 15,
  ball: pokeBall,
  fateful: false,
  nationalRibbon: false,
  shinyLocked: false,
  pidType: 'CXD',
  ...data,
  species: species(data.national),
});

export const CXD_SPECIAL_ENCOUNTERS = Object.freeze([
  encounter({ id: 'colo_starter_espeon', kind: 'starter', game: 'colo', national: 196, level: 25, location: 254, locationName: 'Pokémon Colosseum', trainer: 'Starter', moves: [93, 216, 115, 270], pidType: 'CXD_COLO_STARTER', starterIndex: 1, shinyLocked: true, fixedGender: 'male' }),
  encounter({ id: 'colo_starter_umbreon', kind: 'starter', game: 'colo', national: 197, level: 26, location: 254, locationName: 'Pokémon Colosseum', trainer: 'Starter', moves: [44, 269, 290, 289], pidType: 'CXD_COLO_STARTER', starterIndex: 0, shinyLocked: true, fixedGender: 'male' }),
  encounter({ id: 'colo_duking_plusle', kind: 'gift', game: 'colo', national: 311, level: 13, location: 254, locationName: 'Pyrite Town', trainer: 'Duking Gift', moves: [45, 86, 98, 270], tid: 37149, fixedSID: 0, shinyLocked: true, fixedOtGender: 'male', otNames: { 1: 'ギンザル', 2: 'DUKING', 3: 'DOKING', 4: 'RODRIGO', 5: 'GRAND', 7: 'GERMÁN' } }),

  encounter({ id: 'colo_ereader_togepi', kind: 'shadow', game: 'colo', national: 175, level: 20, location: 128, locationName: 'Card e Room', trainer: 'Chaser ボデス', moves: [118, 204, 186, 281], fixedIVs: allZeroIVs, fixedNature: 22, fixedGender: 'female', fixedAbility: 0, allowedLanguages: [1], nationalRibbon: true, eReader: true, pidType: 'CXD_EREADER', teamLockSpecies: 175 }),
  encounter({ id: 'colo_ereader_mareep', kind: 'shadow', game: 'colo', national: 179, level: 37, location: 128, locationName: 'Card e Room', trainer: 'Hunter ホル', moves: [87, 84, 86, 178], fixedIVs: allZeroIVs, fixedNature: 16, fixedGender: 'female', fixedAbility: 0, allowedLanguages: [1], nationalRibbon: true, eReader: true, pidType: 'CXD_EREADER', teamLockSpecies: 179 }),
  encounter({ id: 'colo_ereader_scizor', kind: 'shadow', game: 'colo', national: 212, level: 50, location: 128, locationName: 'Card e Room', trainer: 'Bodybuilder ワーバン', moves: [210, 232, 14, 163], fixedIVs: allZeroIVs, fixedNature: 11, fixedGender: 'male', fixedAbility: 0, allowedLanguages: [1], nationalRibbon: true, eReader: true, pidType: 'CXD_EREADER', teamLockSpecies: 212 }),

  encounter({ id: 'xd_starter_eevee', kind: 'starter', game: 'xd', national: 133, level: 10, location: 0, locationName: 'Pokémon HQ Lab', trainer: 'Starter', moves: [33, 39, 44, 28], fateful: true, pidType: 'CXD_XD_STARTER' }),
  encounter({ id: 'xd_mt_battle_chikorita', kind: 'gift', game: 'xd', national: 152, level: 5, location: 16, locationName: 'Mt. Battle', trainer: 'Mt. Battle Gift', moves: [246, 33, 45, 338], fateful: true }),
  encounter({ id: 'xd_mt_battle_cyndaquil', kind: 'gift', game: 'xd', national: 155, level: 5, location: 16, locationName: 'Mt. Battle', trainer: 'Mt. Battle Gift', moves: [179, 33, 43, 307], fateful: true }),
  encounter({ id: 'xd_mt_battle_totodile', kind: 'gift', game: 'xd', national: 158, level: 5, location: 16, locationName: 'Mt. Battle', trainer: 'Mt. Battle Gift', moves: [242, 10, 43, 308], fateful: true }),

  encounter({ id: 'xd_pokespot_rock_sandshrew', kind: 'pokespot', game: 'xd', national: 27, level: 23, levelMin: 10, levelMax: 23, location: 90, locationName: 'Rock Poké Spot', trainer: 'Wild slot 1', moves: [111, 28, 40, 163], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 0 }),
  encounter({ id: 'xd_pokespot_rock_gligar', kind: 'pokespot', game: 'xd', national: 207, level: 20, levelMin: 10, levelMax: 20, location: 90, locationName: 'Rock Poké Spot', trainer: 'Wild slot 2', moves: [40, 28, 106, 98], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 1 }),
  encounter({ id: 'xd_pokespot_rock_trapinch', kind: 'pokespot', game: 'xd', national: 328, level: 20, levelMin: 10, levelMax: 20, location: 90, locationName: 'Rock Poké Spot', trainer: 'Wild slot 3', moves: [44, 28, 185], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 2 }),
  encounter({ id: 'xd_pokespot_oasis_hoppip', kind: 'pokespot', game: 'xd', national: 187, level: 20, levelMin: 10, levelMax: 20, location: 91, locationName: 'Oasis Poké Spot', trainer: 'Wild slot 1', moves: [77, 78, 79, 73], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 0 }),
  encounter({ id: 'xd_pokespot_oasis_phanpy', kind: 'pokespot', game: 'xd', national: 231, level: 20, levelMin: 10, levelMax: 20, location: 91, locationName: 'Oasis Poké Spot', trainer: 'Wild slot 2', moves: [45, 316, 111, 175], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 1 }),
  encounter({ id: 'xd_pokespot_oasis_surskit', kind: 'pokespot', game: 'xd', national: 283, level: 20, levelMin: 10, levelMax: 20, location: 91, locationName: 'Oasis Poké Spot', trainer: 'Wild slot 3', moves: [145, 98, 230, 346], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 2 }),
  encounter({ id: 'xd_pokespot_cave_zubat', kind: 'pokespot', game: 'xd', national: 41, level: 21, levelMin: 10, levelMax: 21, location: 92, locationName: 'Cave Poké Spot', trainer: 'Wild slot 1', moves: [48, 310, 44, 17], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 0 }),
  encounter({ id: 'xd_pokespot_cave_aron', kind: 'pokespot', game: 'xd', national: 304, level: 21, levelMin: 10, levelMax: 21, location: 92, locationName: 'Cave Poké Spot', trainer: 'Wild slot 2', moves: [29, 232, 334, 46], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 1 }),
  encounter({ id: 'xd_pokespot_cave_wooper', kind: 'pokespot', game: 'xd', national: 194, level: 21, levelMin: 10, levelMax: 21, location: 92, locationName: 'Cave Poké Spot', trainer: 'Wild slot 3', moves: [55, 21, 341, 133], fateful: true, ball: null, pidType: 'POKESPOT', pokeSpotSlot: 2 }),

  // Colosseum-origin gifts deposited directly into GBA cartridges.
  encounter({ id: 'colo_bonus_disc_pikachu', kind: 'gift', game: 'colo', national: 25, level: 10, originGame: 2, location: 255, locationName: 'Event', trainer: 'Japanese Bonus Disc', moves: [84, 45, 39, 86], tid: 31121, fixedSID: 0, shinyLocked: true, fixedOtGender: 'male', allowedLanguages: [1], otNames: { 1: 'コロシアム' } }),
  encounter({ id: 'colo_mt_battle_hooh', kind: 'gift', game: 'colo', national: 250, level: 70, originGame: 1, location: 255, locationName: 'Event', trainer: 'Mt. Battle', moves: [105, 126, 241, 129], tid: 10048, fixedSID: 0, shinyLocked: true, fixedOtGender: 'male', otNames: { 1: 'バトルやま', 2: 'MATTLE', 3: 'MT BATAILL', 4: 'MONTE LOTT', 5: 'DUELLBERG', 7: 'ERNESTO' } }),
]);

export const CXD_SPECIAL_SPECIES = new Set(CXD_SPECIAL_ENCOUNTERS.map(value => value.species));

export function getCXDSpecialEncountersForSpecies(speciesId) {
  return CXD_SPECIAL_ENCOUNTERS.filter(value => value.species === Number(speciesId));
}
