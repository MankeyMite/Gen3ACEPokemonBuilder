import assert from 'node:assert/strict';
import fs from 'node:fs';

import { SPECIES } from '../data/species.gen3.js';

import {
  GEN3_BATTLE_FRONTIER_BANNED_SPECIES,
  GEN3_RIBBON_CONTROLS,
  RIBBON_LEGALITY_STATE,
  getGen3RibbonLegality,
  validateGen3RibbonSelection,
} from './ribbonLegality.js';

const { OPTIONAL, REQUIRED, FORBIDDEN, UNKNOWN } = RIBBON_LEGALITY_STATE;

const baseMysteryGiftData = JSON.parse(fs.readFileSync(
  new URL('../data/Mystery gift pokemon gen 3.json', import.meta.url),
  'utf8',
));
assert.deepEqual(
  baseMysteryGiftData.events.POKEMON_ROCKS_METANG.ribbons,
  { national: true },
  'Pokemon Rocks Metang must retain its distribution National Ribbon',
);

const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const legalityStatusStart = mainSource.indexOf('function updateLegalityStatus()');
const ribbonRefreshInsideStatus = mainSource.indexOf('updateRibbonLocking()', legalityStatusStart);
const legalityCheckInsideStatus = mainSource.indexOf('const result = checkLegality()', legalityStatusStart);
assert.ok(
  legalityStatusStart >= 0 &&
  ribbonRefreshInsideStatus > legalityStatusStart &&
  ribbonRefreshInsideStatus < legalityCheckInsideStatus,
  'UI ribbon locking must refresh before every displayed legality check',
);

const normal = getGen3RibbonLegality({
  encounterMode: 'wild',
  speciesId: 25,
  metLevel: 5,
});
assert.equal(normal.cool.state, OPTIONAL);
assert.equal(normal.champion.state, OPTIONAL);
assert.equal(normal.artist.state, OPTIONAL);
assert.equal(normal.effort.state, OPTIONAL);
assert.equal(normal.earth.state, OPTIONAL, 'GBA Pokemon can visit Colosseum/XD and earn Earth');
assert.equal(normal.winning.state, OPTIONAL);
assert.equal(normal.victory.state, OPTIONAL);
assert.equal(normal.national.state, FORBIDDEN);
assert.equal(normal.country.state, FORBIDDEN);
assert.equal(normal.world.state, FORBIDDEN);

for (const [speciesId, speciesName] of SPECIES.filter(([id]) => Number(id) > 0)) {
  const rules = getGen3RibbonLegality({ encounterMode: 'wild', speciesId, metLevel: 5 });
  for (const control of GEN3_RIBBON_CONTROLS) {
    assert.ok(rules[control.key], `${speciesName} is missing a ${control.key} ribbon policy`);
  }
}

const highLevel = getGen3RibbonLegality({ encounterMode: 'static', speciesId: 25, metLevel: 70 });
assert.equal(highLevel.winning.state, FORBIDDEN);
assert.equal(highLevel.victory.state, OPTIONAL);

assert.deepEqual(
  [...GEN3_BATTLE_FRONTIER_BANNED_SPECIES],
  [150, 151, 249, 250, 251, 404, 405, 406, 409, 410],
);
for (const speciesId of GEN3_BATTLE_FRONTIER_BANNED_SPECIES) {
  const rules = getGen3RibbonLegality({ encounterMode: 'static', speciesId, metLevel: 5 });
  assert.equal(rules.winning.state, FORBIDDEN, `${speciesId} cannot earn Winning`);
  assert.equal(rules.victory.state, FORBIDDEN, `${speciesId} cannot earn Victory`);
}
for (const speciesId of [144, 145, 146, 243, 244, 245, 401, 402, 403, 407, 408]) {
  const rules = getGen3RibbonLegality({ encounterMode: 'static', speciesId, metLevel: 50 });
  assert.equal(rules.winning.state, OPTIONAL, `${speciesId} can earn Winning`);
  assert.equal(rules.victory.state, OPTIONAL, `${speciesId} can earn Victory`);
}

const shadow = getGen3RibbonLegality({
  encounterMode: 'cxd_shadow',
  speciesId: 245,
  metLevel: 40,
  encounter: { nationalRibbon: true },
});
assert.equal(shadow.national.state, REQUIRED);
assert.equal(shadow.earth.state, OPTIONAL);

const cxdGift = getGen3RibbonLegality({
  encounterMode: 'cxd_shadow',
  speciesId: 133,
  metLevel: 10,
  encounter: { nationalRibbon: false },
});
assert.equal(cxdGift.national.state, FORBIDDEN);

const ordinaryEvent = getGen3RibbonLegality({
  encounterMode: 'mystery',
  speciesId: 25,
  metLevel: 10,
  event: {},
});
assert.equal(ordinaryEvent.cool.state, OPTIONAL, 'event Pokemon can earn ordinary ribbons later');
assert.equal(ordinaryEvent.earth.state, OPTIONAL);
assert.equal(ordinaryEvent.national.state, FORBIDDEN);
assert.equal(ordinaryEvent.battleChampion.state, FORBIDDEN);

const jaaBulbasaur = getGen3RibbonLegality({
  encounterMode: 'mystery',
  speciesId: 1,
  metLevel: 70,
  event: {},
});
assert.equal(jaaBulbasaur.winning.state, FORBIDDEN, 'JAA Bulbasaur is met too high for Winning');
assert.equal(jaaBulbasaur.victory.state, OPTIONAL);
assert.equal(jaaBulbasaur.cool.state, OPTIONAL);
assert.match(
  validateGen3RibbonSelection({ winning: true }, jaaBulbasaur)[0],
  /Winning Ribbon is impossible/,
);

const ribbonEvent = getGen3RibbonLegality({
  encounterMode: 'mystery',
  speciesId: 399,
  metLevel: 30,
  event: { ribbons: { national: true, country: true, battleChampion: true } },
});
assert.equal(ribbonEvent.national.state, REQUIRED);
assert.equal(ribbonEvent.country.state, REQUIRED);
assert.equal(ribbonEvent.battleChampion.state, REQUIRED);
assert.equal(ribbonEvent.regionalChampion.state, FORBIDDEN);

const egg = getGen3RibbonLegality({ encounterMode: 'hatched', speciesId: 1, isEgg: true });
for (const control of GEN3_RIBBON_CONTROLS) {
  assert.equal(egg[control.key].state, FORBIDDEN, `${control.key} is forbidden on an Egg`);
}

const hatched = getGen3RibbonLegality({ encounterMode: 'hatched', speciesId: 1, metLevel: 0 });
assert.equal(hatched.cool.state, OPTIONAL);
assert.equal(hatched.earth.state, OPTIONAL);
assert.equal(hatched.winning.state, OPTIONAL);
assert.equal(hatched.national.state, FORBIDDEN);

const imported = getGen3RibbonLegality({ encounterMode: 'imported', speciesId: 25 });
for (const control of GEN3_RIBBON_CONTROLS) {
  assert.equal(imported[control.key].state, UNKNOWN, `${control.key} stays untouched for imports`);
}
assert.equal(getGen3RibbonLegality({ encounterMode: 'wild' }).world.state, UNKNOWN);

assert.deepEqual(
  validateGen3RibbonSelection(
    { national: false, world: true, cool: 4 },
    ribbonEvent,
  ),
  [
    'Battle Champion Ribbon is required: The selected distribution includes the Battle Champion Ribbon.',
    'Country Ribbon is required: The selected distribution includes the Country Ribbon.',
    'National Ribbon is required: The selected distribution includes the National Ribbon.',
    'World Ribbon is impossible: The World Ribbon is not legal on a native Generation 3 Pokemon.',
  ],
);

console.log('ribbonLegality tests passed');
