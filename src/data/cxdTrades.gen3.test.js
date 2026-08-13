import assert from 'node:assert/strict';

import {
  CXD_TRADE_ENCOUNTERS,
  CXD_TRADE_SPECIES,
  getCXDTradeById,
  getCXDTradeLocalizedText,
  getCXDTradesForSpecies,
  isCXDGeneratedTrade,
} from './cxdTrades.gen3.js';

const handheld = CXD_TRADE_ENCOUNTERS.filter(encounter => !isCXDGeneratedTrade(encounter));
const xd = CXD_TRADE_ENCOUNTERS.filter(isCXDGeneratedTrade);

assert.equal(CXD_TRADE_ENCOUNTERS.length, 32, 'all 28 handheld and four XD trades should be present');
assert.equal(handheld.length, 28, 'all Ruby, Sapphire, Emerald, FireRed, and LeafGreen trades should be present');
assert.equal(xd.length, 4, 'the existing XD trades should remain present');
assert.equal(new Set(CXD_TRADE_ENCOUNTERS.map(encounter => encounter.id)).size, 32, 'trade IDs should be unique');

assert.deepEqual(
  Object.fromEntries([...new Set(CXD_TRADE_ENCOUNTERS.map(encounter => encounter.originGame))]
    .sort((a, b) => a - b)
    .map(game => [game, CXD_TRADE_ENCOUNTERS.filter(encounter => encounter.originGame === game).length])),
  { 1: 3, 2: 3, 3: 4, 4: 9, 5: 9, 15: 4 },
  'each game should expose its complete received-Pokémon trade table',
);

for (const encounter of handheld) {
  assert.equal(encounter.tradeKind, 'handheld');
  assert.equal(encounter.location, 254, `${encounter.id} should use the Gen III NPC trade location`);
  assert.equal(encounter.ball, 4, `${encounter.id} should use a Poké Ball`);
  assert.equal(encounter.fateful, false, `${encounter.id} should not be fateful`);
  assert.equal(encounter.shinyLocked, true, `${encounter.id} should be shiny locked`);
  assert.equal(encounter.nicknameLocked, true, `${encounter.id} should retain its fixed nickname`);
  assert.equal(encounter.pidType, 'FIXED');
  assert.equal(encounter.ivType, 'FIXED');
  assert.equal(encounter.fixedNature, encounter.fixedPID % 25, `${encounter.id} nature should derive from its PID`);
  assert.deepEqual(Object.keys(encounter.fixedIVs).sort(), ['atk', 'def', 'hp', 'spa', 'spd', 'spe']);
  assert.deepEqual(Object.keys(encounter.contest).sort(), ['beauty', 'cool', 'cute', 'sheen', 'smart', 'tough']);
  assert.ok(encounter.moves.length >= 1 && encounter.moves.length <= 4, `${encounter.id} should have its initial moves`);
  assert.ok(CXD_TRADE_SPECIES.has(encounter.species), `${encounter.id} species should be selectable`);
  assert.equal(getCXDTradeById(encounter.id), encounter, `${encounter.id} should be addressable by ID`);
}

const dots = getCXDTradeById('emerald_dots_seedot_emerald');
assert.deepEqual(
  {
    species: dots.species, requestedSpecies: dots.requestedSpecies, level: dots.level,
    tid: dots.tid, sid: dots.fixedSID, pid: dots.fixedPID, moves: dots.moves,
    ivs: dots.fixedIVs, item: dots.heldItem,
  },
  {
    species: 298, requestedSpecies: 392, level: 4,
    tid: 38726, sid: 0, pid: 0x84, moves: [117, 106],
    ivs: { hp: 5, atk: 4, def: 5, spa: 4, spd: 4, spe: 4 }, item: 134,
  },
  'DOTS should match Emerald trade data',
);

const pluses = getCXDTradeById('emerald_pluses_plusle_emerald');
assert.deepEqual(
  {
    species: pluses.species, requestedSpecies: pluses.requestedSpecies, level: pluses.level,
    tid: pluses.tid, sid: pluses.fixedSID, pid: pluses.fixedPID, moves: pluses.moves,
    ivs: pluses.fixedIVs, item: pluses.heldItem,
  },
  {
    species: 353, requestedSpecies: 386, level: 5,
    tid: 8460, sid: 1, pid: 0x6F, moves: [45, 86],
    ivs: { hp: 4, atk: 4, def: 4, spa: 5, spd: 4, spe: 5 }, item: 125,
  },
  'PLUSES should match Emerald trade data, including its nonzero SID',
);

const italianFireRedJynx = getCXDTradeById('frlg_zynx_jynx_firered');
const italianLeafGreenJynx = getCXDTradeById('frlg_zynx_jynx_leafgreen');
assert.equal(getCXDTradeLocalizedText(italianFireRedJynx, 'nicknameByLanguage', 4), 'ZYNX');
assert.equal(getCXDTradeLocalizedText(italianFireRedJynx, 'otNames', 4), 'RINO');
assert.equal(getCXDTradeLocalizedText(italianLeafGreenJynx, 'nicknameByLanguage', 4), 'ZYNX');
assert.equal(getCXDTradeLocalizedText(italianLeafGreenJynx, 'otNames', 4), 'DONTAE');
assert.equal(
  getCXDTradeLocalizedText(italianLeafGreenJynx, 'otNames', 5),
  'DANTE  ',
  'the German Jynx OT should preserve its two trailing spaces',
);

assert.deepEqual(
  xd.map(encounter => [encounter.species, encounter.tid, encounter.location]),
  [[239, 41400, 164], [356, 37149, 116], [213, 37149, 116], [246, 37149, 116]],
  'XD trade species, TIDs, and locations should remain unchanged',
);
assert.deepEqual(
  xd.map(encounter => encounter.moves),
  [[7, 8, 9, 238], [223, 93, 247, 197], [92, 164, 188, 227], [201, 349, 44, 200]],
  'XD trade move sets should remain unchanged',
);
assert.deepEqual(xd.map(encounter => encounter.nicknameLocked), [true, false, false, false]);

for (const encounter of xd) {
  assert.equal(encounter.level, 20, `${encounter.id} should be level 20`);
  assert.equal(encounter.originGame, 15, `${encounter.id} should originate in XD`);
  assert.equal(encounter.ball, 4, `${encounter.id} should use a Poké Ball`);
  assert.equal(encounter.fateful, true, `${encounter.id} should be fateful`);
  assert.equal(encounter.pidType, 'CXD', `${encounter.id} should use CXD PID generation`);
  assert.equal(encounter.ivType, 'CXD_CORRELATED', `${encounter.id} should use correlated CXD IVs`);
  assert.equal(encounter.fixedIVs, null, `${encounter.id} should not have fixed IVs`);
  assert.equal(encounter.sidType, 'PLAYER_SID', `${encounter.id} should copy the player's SID`);
  assert.equal(encounter.shinyLocked, false, `${encounter.id} should allow shiny results`);
}

const elekid = getCXDTradeById('xd_hordel_elekid');
assert.equal(getCXDTradeLocalizedText(elekid, 'otNames', 2), 'HORDEL');
assert.equal(getCXDTradeLocalizedText(elekid, 'otNames', 1), 'ダニー');
assert.equal(getCXDTradeLocalizedText(elekid, 'nicknameByLanguage', 2), 'ZAPRONG');
assert.equal(getCXDTradeLocalizedText(elekid, 'nicknameByLanguage', 1), 'コンセント');
assert.equal(getCXDTradesForSpecies(239).length, 1, 'Elekid should have one trade record');

console.log('cxdTrades.gen3 encounter tests passed');
