import assert from 'node:assert/strict';
import {
  formatNatureOption,
  getAdjustedStatBarValue,
  getNatureEffect,
  getNatureMultiplier,
} from './naturePresentation.js';

assert.equal(formatNatureOption('Adamant', 3), 'Adamant (+Atk, -SpA)');
assert.equal(formatNatureOption('Calm', 20), 'Calm (+SpD, -Atk)');
assert.equal(formatNatureOption('Serious', 12), 'Serious');

assert.deepEqual(getNatureEffect(3), { up: 'atk', down: 'spa' });
assert.equal(getNatureMultiplier(3, 'atk'), 1.1);
assert.equal(getNatureMultiplier(3, 'spa'), 0.9);
assert.equal(getNatureMultiplier(3, 'hp'), 1);

assert.equal(getAdjustedStatBarValue({ base: 50, ev: 0, natureIndex: 0, statKey: 'atk' }), 50);
assert.equal(getAdjustedStatBarValue({ base: 50, ev: 252, natureIndex: 0, statKey: 'atk' }), 81.5);
assert.ok(Math.abs(getAdjustedStatBarValue({ base: 50, ev: 0, natureIndex: 3, statKey: 'atk' }) - 55) < 1e-9);
assert.equal(getAdjustedStatBarValue({ base: 50, ev: 0, natureIndex: 3, statKey: 'spa' }), 45);

console.log('nature presentation tests passed');
