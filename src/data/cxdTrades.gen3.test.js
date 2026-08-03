import assert from 'node:assert/strict';

import {
  CXD_TRADE_ENCOUNTERS,
  CXD_TRADE_SPECIES,
  getCXDTradeLocalizedText,
  getCXDTradesForSpecies,
} from './cxdTrades.gen3.js';

assert.deepEqual(
  CXD_TRADE_ENCOUNTERS.map(encounter => [encounter.species, encounter.tid, encounter.location]),
  [[239, 41400, 164], [356, 37149, 116], [213, 37149, 116], [246, 37149, 116]],
  'XD trade species, TIDs, and locations should match the encounter table'
);

assert.deepEqual(
  CXD_TRADE_ENCOUNTERS.map(encounter => encounter.moves),
  [[7, 8, 9, 238], [223, 93, 247, 197], [92, 164, 188, 227], [201, 349, 44, 200]],
  'XD trade move sets should match the encounter table'
);

assert.deepEqual(
  CXD_TRADE_ENCOUNTERS.map(encounter => encounter.nicknameLocked),
  [true, false, false, false],
  'Only Elekid should have a fixed trade nickname'
);

for (const encounter of CXD_TRADE_ENCOUNTERS) {
  assert.equal(encounter.level, 20, `${encounter.id} should be level 20`);
  assert.equal(encounter.originGame, 15, `${encounter.id} should originate in XD`);
  assert.equal(encounter.ball, 4, `${encounter.id} should use a Poké Ball`);
  assert.equal(encounter.fateful, true, `${encounter.id} should be fateful`);
  assert.equal(encounter.pidType, 'CXD', `${encounter.id} should use CXD PID generation`);
  assert.equal(encounter.ivType, 'CXD_CORRELATED', `${encounter.id} should use correlated CXD IVs`);
  assert.equal(encounter.fixedIVs, null, `${encounter.id} should not have fixed IVs`);
  assert.equal(encounter.sidType, 'PLAYER_SID', `${encounter.id} should copy the player's SID`);
  assert.equal(encounter.shinyLocked, false, `${encounter.id} should allow shiny results`);
  assert.ok(CXD_TRADE_SPECIES.has(encounter.species), `${encounter.id} species should be selectable`);
  assert.equal(getCXDTradesForSpecies(encounter.species).length, 1, `${encounter.id} should have one trade record`);
}

const elekid = CXD_TRADE_ENCOUNTERS[0];
assert.equal(getCXDTradeLocalizedText(elekid, 'otNames', 2), 'HORDEL');
assert.equal(getCXDTradeLocalizedText(elekid, 'otNames', 1), 'ダニー');
assert.equal(getCXDTradeLocalizedText(elekid, 'nicknameByLanguage', 2), 'ZAPRONG');
assert.equal(getCXDTradeLocalizedText(elekid, 'nicknameByLanguage', 1), 'コンセント');

console.log('cxdTrades.gen3 encounter tests passed');
