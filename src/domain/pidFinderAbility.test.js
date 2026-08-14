import assert from 'node:assert/strict';

import { normalizeGeneratedAbilityBit, resolvePidFinderAbilityBit } from './pidFinderAbility.js';

assert.equal(resolvePidFinderAbilityBit({
  selectedAbilityBit: 0,
  resultActive: true,
  resultAbilityBit: 1,
  manualOverride: false,
}), 1, 'an active GameCube result must preserve its selected RNG slot');

assert.equal(resolvePidFinderAbilityBit({
  selectedAbilityBit: 1,
  resultActive: true,
  resultAbilityBit: 0,
  manualOverride: false,
}), 0, 'an active finder result must preserve RNG slot 0');

assert.equal(resolvePidFinderAbilityBit({
  selectedAbilityBit: 0,
  resultActive: false,
  resultAbilityBit: 1,
  manualOverride: false,
}), 0, 'an inactive finder result must not override the form');

assert.equal(resolvePidFinderAbilityBit({
  selectedAbilityBit: 0,
  resultActive: true,
  resultAbilityBit: 1,
  manualOverride: true,
}), 0, 'manual override must use the user-selected ability bit');

assert.equal(resolvePidFinderAbilityBit({
  selectedAbilityBit: 1,
  resultActive: true,
  resultAbilityBit: null,
  manualOverride: false,
}), 1, 'missing legacy result metadata must fall back to the form');

assert.equal(normalizeGeneratedAbilityBit({
  pid: 0x12345679,
  generatedAbilityBit: undefined,
  correlationSpeciesHasSingleAbility: false,
}), 1, 'an evolved event must preserve the source encounter ability slot');

assert.equal(normalizeGeneratedAbilityBit({
  pid: 0x12345679,
  generatedAbilityBit: 1,
  correlationSpeciesHasSingleAbility: true,
}), 0, 'a genuinely single-ability source encounter must normalize to slot 0');

console.log('PID Finder ability-slot tests passed');
