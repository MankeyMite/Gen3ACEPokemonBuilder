import assert from 'node:assert/strict';
import { LEARNSETS } from './learnsets.gen3.js';

const SELF_DESTRUCT = 120;
const SKY_ATTACK = 143;
const NIGHTMARE = 171;
const MEW_XD_TUTORS = [185, 252, 95, 101, 272, 192];

function tutorSpeciesFor(moveId) {
  return Object.entries(LEARNSETS)
    .filter(([, learnset]) => learnset.u.includes(moveId))
    .map(([speciesId]) => Number(speciesId));
}

function xdTutorSpeciesFor(moveId) {
  return Object.entries(LEARNSETS)
    .filter(([, learnset]) => learnset.x.includes(moveId))
    .map(([speciesId]) => Number(speciesId));
}

assert.equal(tutorSpeciesFor(SELF_DESTRUCT).length, 48, 'XD Self-Destruct compatibility count');
assert.equal(tutorSpeciesFor(SKY_ATTACK).length, 27, 'XD Sky Attack compatibility count');
assert.equal(tutorSpeciesFor(NIGHTMARE).length, 69, 'XD Nightmare compatibility count');
assert.equal(xdTutorSpeciesFor(SELF_DESTRUCT).length, 48, 'XD Self-Destruct provenance count');
assert.equal(xdTutorSpeciesFor(SKY_ATTACK).length, 27, 'XD Sky Attack provenance count');
assert.equal(xdTutorSpeciesFor(NIGHTMARE).length, 69, 'XD Nightmare provenance count');

// Kanto IDs are unchanged, while Hoenn species must resolve through names to
// this builder's non-National Gen III internal order.
for (const speciesId of [143, 150, 298, 314, 400, 401, 402, 403]) {
  assert.ok(LEARNSETS[speciesId].u.includes(SELF_DESTRUCT), `species ${speciesId} should learn Self-Destruct`);
}
for (const speciesId of [16, 358, 359]) {
  assert.ok(LEARNSETS[speciesId].u.includes(SKY_ATTACK), `species ${speciesId} should learn Sky Attack`);
}
for (const speciesId of [12, 392, 409, 410]) {
  assert.ok(LEARNSETS[speciesId].u.includes(NIGHTMARE), `species ${speciesId} should learn Nightmare`);
}

assert.ok(!LEARNSETS[315].u.includes(SKY_ATTACK), 'Skitty must not learn Sky Attack from the XD tutor');

for (const moveId of MEW_XD_TUTORS) {
  assert.deepEqual(tutorSpeciesFor(moveId), [151], `XD move ${moveId} should be Mew-only`);
}
for (const moveId of [SELF_DESTRUCT, SKY_ATTACK, NIGHTMARE, ...MEW_XD_TUTORS]) {
  assert.ok(LEARNSETS[151].u.includes(moveId), `Mew should learn XD tutor move ${moveId}`);
  assert.ok(LEARNSETS[151].x.includes(moveId), `Mew should retain XD-only provenance for move ${moveId}`);
}

console.log('All Gen 3 XD tutor learnset tests passed.');
