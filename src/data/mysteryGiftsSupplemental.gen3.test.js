import assert from 'node:assert/strict';

import { SPECIES } from './species.gen3.js';
import {
  MYSTERY_GIFT_EVENTS_SUPPLEMENTAL,
  MYSTERY_GIFT_POKEMON_SUPPLEMENTAL,
  MYSTERY_GIFT_SUPPLEMENTAL_COUNTS,
} from './mysteryGiftsSupplemental.gen3.js';

const events = MYSTERY_GIFT_EVENTS_SUPPLEMENTAL;
const rows = MYSTERY_GIFT_POKEMON_SUPPLEMENTAL;
const validSpecies = new Set(SPECIES.map(([id]) => Number(id)).filter(Boolean));
const tags = Object.keys(events);

assert.equal(tags.length, 91, 'supplement should contain all 91 missing event variants');
assert.equal(rows.length, 174, 'supplement should contain all 174 event/species rows');
assert.deepEqual(MYSTERY_GIFT_SUPPLEMENTAL_COUNTS, {
  events: 91,
  pokemon: 174,
  japaneseWC3: 22,
  pcny: 50,
  pcjpCampaigns: 6,
});
assert.equal(new Set(tags).size, tags.length, 'every event tag must be unique');

for (const row of rows) {
  assert.ok(events[row.tag], `row references unknown event ${row.tag}`);
  assert.ok(validSpecies.has(Number(row.species)), `${row.tag} has an invalid internal species ID`);
  assert.ok(events[row.tag].species.includes(Number(row.species)), `${row.tag} event species omits its row species`);
  assert.ok(!row.moves || row.moves.every(move => Number.isInteger(move) && move > 0 && move <= 354), `${row.tag} has an invalid Gen III move`);
}

const pcnyTags = tags.filter(tag => tag.startsWith('PCNY_'));
assert.equal(pcnyTags.length, 50, 'all 50 PCNY direct-download records should be present');
for (const tag of pcnyTags) {
  assert.equal(events[tag].pidMethod, 'BACD_U_AX');
  assert.equal(events[tag].usesRecipientOtGender, true);
  assert.deepEqual(events[tag].tidRange, [1, 2999]);
  assert.ok(events[tag].allowedOtNames.length >= 1);
  assert.ok(!('ot_gender' in events[tag]), `${tag} must use the recipient trainer gender`);
}

const fifthEggTags = tags.filter(tag => tag.startsWith('PCJP_5TH_EGG_'));
assert.equal(fifthEggTags.length, 10, 'all ten PCJP 5th Anniversary egg variants should be present');
for (const tag of fifthEggTags) {
  assert.deepEqual(events[tag].allowedOriginGames, [2]);
  assert.deepEqual(events[tag].allowedLanguages, [1, 2, 3, 4, 5, 7], 'hatched event Eggs may use the hatcher language');
  assert.ok(['BACD_TA', 'BACD_TS'].includes(events[tag].pidMethod));
  assert.ok(Number(events[tag].tableNationalSpecies) > 0);
}

assert.equal(events.NEGAI_BOSHI_JIRACHI_TABLE.tableNationalSpecies, 385);
assert.equal(events.JPN_BERRY_FIX_RUBY.berryFixOtPreference, 'RUBY');
assert.equal(events.JPN_BERRY_FIX_SAPPHIRE.berryFixOtPreference, 'SAPHIRE');
assert.equal(events.POKEPARK_EGGS_WONDERCARD.fatefulInFRLGOnly, true);
assert.deepEqual(events.POKEPARK_EGGS_DS_DOWNLOAD.allowedLanguages, [1, 2, 3, 4, 5, 7]);
assert.equal(events.PCJP_GATHER_MORE_1.allowedOtNames.length, 6);
assert.equal(events.PCJP_GATHER_MORE_6.allowedOtNames.length, 5);

console.log('supplemental Mystery Gift tests passed');
