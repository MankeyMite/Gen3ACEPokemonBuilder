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

assert.equal(tags.length, 100, 'supplement should contain all 100 supported event variants');
assert.equal(rows.length, 183, 'supplement should contain all 183 event/species rows');
assert.deepEqual(MYSTERY_GIFT_SUPPLEMENTAL_COUNTS, {
  events: 100,
  pokemon: 183,
  jeremy: 9,
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
assert.equal(
  new Set(pcnyTags.map(tag => events[tag].label)).size,
  pcnyTags.length,
  'each PCNY distribution must have a distinguishable label',
);
for (const tag of pcnyTags) {
  assert.equal(events[tag].pidMethod, 'BACD_U_AX');
  assert.equal(events[tag].usesRecipientOtGender, true);
  assert.deepEqual(events[tag].tidRange, [1, 2999]);
  assert.ok(events[tag].allowedOtNames.length >= 1);
  assert.equal(events[tag].defaultTID, 1);
  assert.equal(events[tag].lockRepresentativeTrainer, true);
  assert.ok(events[tag].allowedOtNames.includes(events[tag].ot_name));
  assert.ok(!('ot_gender' in events[tag]), `${tag} must use the recipient trainer gender`);
}

const pcnycTags = pcnyTags.filter(tag => events[tag].ot_name === 'PCNYc');
assert.ok(pcnycTags.length > 0, 'the PCNYc representative distributions should be present');
for (const tag of pcnycTags) {
  assert.equal(events[tag].ot_name, 'PCNYc');
  assert.equal(events[tag].defaultTID, 1);
}

assert.match(events.PCNY_DRAGON_SEADRA_ICE_BEAM.label, /Ice Beam/);
assert.match(events.PCNY_DRAGON_SEADRA_LEER.label, /Leer/);
assert.match(events.PCNY_DRAGON_ALTARIA_ICE_BEAM.label, /Flamethrower/);
assert.match(events.PCNY_DRAGON_ALTARIA_DRAGON_DANCE.label, /Ice Beam/);
assert.match(events.PCNY_BOX_ABSOL_SPITE.label, /Spite/);
assert.match(events.PCNY_BOX_ABSOL_WISH.label, /Wish/);

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
assert.deepEqual(events.FESTA_METANG.ribbons, { national: true });
assert.equal(events.PCJP_GATHER_MORE_1.allowedOtNames.length, 6);
assert.equal(events.PCJP_GATHER_MORE_6.allowedOtNames.length, 5);

const jeremyTags = tags.filter(tag => tag.startsWith('JEREMY_'));
assert.equal(jeremyTags.length, 9, 'all nine preserved JEREMY specimens should be available');
for (const tag of jeremyTags) {
  const event = events[tag];
  const [row] = rows.filter(candidate => candidate.tag === tag);
  assert.ok(['H1', 'H4'].includes(event.pidMethod), `${tag} must identify its underlying wild PID method`);
  assert.equal(event.fixedEvent, true);
  assert.equal(event.fixedOTName, 'JEREMY');
  assert.deepEqual(event.allowedLanguages, [2]);
  assert.equal(event.defaultFatefulEncounter, false);
  assert.equal(event.shinyLocked, true);
  assert.equal(typeof event.fixedPID, 'number');
  assert.equal(row.pid, `0x${event.fixedPID.toString(16).toUpperCase().padStart(8, '0')}`);
  assert.equal(row.ivs.length, 6);
  assert.equal(row.moves.length, 4);
}
assert.equal(events.JEREMY_EKANS.fixedPID, 0xE9D9B217);
assert.equal(events.JEREMY_EKANS.fixedAbility, 1, 'the preserved Ekans uses ability bit 1');
assert.equal(events.JEREMY_EKANS.pidMethod, 'H4');
assert.equal(events.JEREMY_GROWLITHE.pidMethod, 'H1');
assert.equal(events.JEREMY_GENGAR.pidMethod, 'H1');
assert.equal(events.JEREMY_TAUROS.defaultBallId, 5, 'the preserved Tauros was caught in a Safari Ball');
assert.match(events.JEREMY_MACHAMP.label, /Machoke → Machamp/);
assert.match(events.JEREMY_GENGAR.label, /Haunter → Gengar/);

console.log('supplemental Mystery Gift tests passed');
