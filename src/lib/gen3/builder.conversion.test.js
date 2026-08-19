import {
  buildDecryptedPokemonFile,
  buildPokemonBytes,
  convertEk3RawToPk3Canonical,
  convertPk3CanonicalToEk3Raw,
  getPokerusStateFromStatus,
  getPokerusStatusFromState,
  parsePokemonBytes,
  toHexString,
} from './builder.js';

const ZIGZAGOON_ID = 288;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

function makeSampleCfg() {
  return {
    speciesId: 151,
    itemId: 1,
    totalExp: 100000,
    moves: [15, 33, 45, 92],
    pps: [0, 1, 2, 3],
    friendship: 200,
    evs: { hp: 1, atk: 2, def: 3, spe: 4, spa: 5, spd: 6 },
    contest: { cool: 10, beauty: 11, cute: 12, smart: 13, tough: 14, sheen: 15 },
    metLocationId: 9,
    metLevel: 30,
    originGame: 3,
    ballId: 4,
    otGender: 0,
    ivs: { hp: 31, atk: 22, def: 13, spe: 4, spa: 30, spd: 29 },
    abilityBit: 1,
    isEgg: false,
    ribbons: {
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
    },
    tid: 12345,
    sid: 54321,
    pid: 0x12345678,
    natureIndex: 0,
    forceShiny: false,
    languageId: 2,
    nickname: 'Mew?',
    otName: 'TRAINER',
    markings: { circle: true, triangle: false, square: true, heart: false },
    extraBytes: 0,
    level: 30,
  };
}

function section(name) {
  console.log(`\n-- ${name} --`);
}

section('raw .ek3 <-> canonical .pk3 byte-exact roundtrip');
{
  const raw = buildPokemonBytes(makeSampleCfg()).bytes;
  const pk3 = convertEk3RawToPk3Canonical(raw, 100);
  const roundTrip = convertPk3CanonicalToEk3Raw(pk3);

  assert(roundTrip.length === 80, 'roundtrip output must be 80 bytes');
  assert(raw.length === 80, 'source raw bytes must be 80 bytes');

  let same = true;
  for (let i = 0; i < 80; i++) {
    if (raw[i] !== roundTrip[i]) {
      same = false;
      break;
    }
  }
  assert(same, 'raw -> pk3 -> raw must preserve bytes exactly');
}

section('Japanese name fields use Japanese limits and OT terminator');
{
  const cfg = {
    ...makeSampleCfg(),
    languageId: 1,
    nickname: 'ABCDEFGHIJ',
    otName: 'TRAINER',
  };
  const outputs = [
    ['encrypted output', buildPokemonBytes(cfg).bytes],
    ['decrypted output', buildDecryptedPokemonFile(cfg)],
  ];

  for (const [label, bytes] of outputs) {
    assert(bytes[0x0C] !== 0xFF, `${label} keeps the fifth Japanese nickname character`);
    assert(bytes.slice(0x0D, 0x12).every(byte => byte === 0xFF), `${label} truncates and pads the Japanese nickname after five characters`);
    assert(bytes[0x18] !== 0xFF, `${label} keeps the fifth Japanese OT character`);
    assert(bytes[0x19] === 0xFF, `${label} pads Japanese OT byte 5 with 0xFF`);
    assert(bytes[0x1A] === 0x00, `${label} writes the required final Japanese OT terminator`);
  }
}

section('international name encoding remains unchanged');
{
  const cfg = {
    ...makeSampleCfg(),
    languageId: 2,
    nickname: 'ABCDEFGHIJ',
    otName: 'TRAINER',
  };
  const outputs = [
    ['encrypted output', buildPokemonBytes(cfg).bytes],
    ['decrypted output', buildDecryptedPokemonFile(cfg)],
  ];

  for (const [label, bytes] of outputs) {
    assert(bytes[0x11] !== 0xFF, `${label} keeps the tenth international nickname character`);
    assert(bytes[0x1A] !== 0x00 && bytes[0x1A] !== 0xFF, `${label} keeps the seventh international OT character`);
  }
}

section('glitch-like header bytes remain unchanged');
{
  const raw = buildPokemonBytes(makeSampleCfg()).bytes;
  const glitchLike = new Uint8Array(raw);

  // Nickname/OT header bytes can be unusual in glitch data; conversion must preserve them.
  glitchLike[0x08] = 0x00;
  glitchLike[0x09] = 0xAB;
  glitchLike[0x0A] = 0xFE;
  glitchLike[0x14] = 0x00;
  glitchLike[0x15] = 0xB6;

  const pk3 = convertEk3RawToPk3Canonical(glitchLike, 100);
  const roundTrip = convertPk3CanonicalToEk3Raw(pk3);

  let same = true;
  for (let i = 0; i < 80; i++) {
    if (glitchLike[i] !== roundTrip[i]) {
      same = false;
      break;
    }
  }
  assert(same, 'conversion must preserve glitch-like raw bytes exactly');

  const before = parsePokemonBytes(toHexString(glitchLike));
  const after = parsePokemonBytes(toHexString(roundTrip));
  assert(before.pid === after.pid, 'PID must not change during conversion roundtrip');
  assert(before.ivs.hp === after.ivs.hp, 'HP IV must not change during conversion roundtrip');
  assert(before.ivs.atk === after.ivs.atk, 'ATK IV must not change during conversion roundtrip');
  assert(before.nickname === after.nickname, 'decoded nickname view must remain stable through conversion');
}

section('pokerus simple states write and parse Misc offset 0');
{
  const cases = [
    { status: 'none', state: 0x00, label: 'No Pokerus' },
    { status: 'active', state: 0x11, label: 'Has Pokerus' },
    { status: 'cured', state: 0x10, label: 'Cured Pokerus' },
  ];

  for (const tc of cases) {
    const cfg = { ...makeSampleCfg(), pokerusStatus: tc.status, pokerusState: getPokerusStateFromStatus(tc.status) };
    const raw = buildPokemonBytes(cfg).bytes;
    const parsedRaw = parsePokemonBytes(toHexString(raw));
    assert(parsedRaw.pokerusState === tc.state, `${tc.label} writes encrypted M[0]`);
    assert(parsedRaw.pokerusStatus === tc.status, `${tc.label} parses from encrypted output`);

    const pk3 = buildDecryptedPokemonFile(cfg);
    const parsedPk3 = parsePokemonBytes(toHexString(pk3.slice(0, 80)));
    assert(parsedPk3.pokerusState === tc.state, `${tc.label} writes decrypted M[0]`);
    assert(parsedPk3.pokerusStatus === tc.status, `${tc.label} parses from decrypted output`);
  }
}

section('pokerus exact imported byte can be preserved');
{
  const cfg = { ...makeSampleCfg(), pokerusStatus: 'active', pokerusState: 0x42 };
  const raw = buildPokemonBytes(cfg).bytes;
  const parsed = parsePokemonBytes(toHexString(raw));

  assert(parsed.pokerusState === 0x42, 'nonstandard Pokerus strain/day byte must parse exactly');
  assert(parsed.pokerusStatus === 'active', 'nonstandard Pokerus strain/day byte displays as active');
  assert(getPokerusStatusFromState(0x00) === 'none', '0x00 displays No Pokerus');
  assert(getPokerusStatusFromState(0x11) === 'active', '0x11 displays Has Pokerus');
  assert(getPokerusStatusFromState(0x10) === 'cured', '0x10 displays Cured Pokerus');
}

section('single-ability PID parity does not alter stored Gen 3 ability slot');
{
  const cfg = {
    ...makeSampleCfg(),
    speciesId: ZIGZAGOON_ID,
    pid: 0x12345679,
    abilityBit: 0,
  };
  const raw = buildPokemonBytes(cfg).bytes;
  const parsed = parsePokemonBytes(toHexString(raw));

  assert((parsed.pid & 1) === 1, 'Zigzagoon test fixture should use an odd PID');
  assert(parsed.abilityBit === 0, 'Zigzagoon should keep stored Gen 3 ability slot 0 even with an odd PID');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
