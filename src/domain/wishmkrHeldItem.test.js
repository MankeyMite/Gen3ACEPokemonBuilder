import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WISHMKR_GANLON_BERRY_ID,
  WISHMKR_SALAC_BERRY_ID,
  getWishmkrHeldItemId,
} from './wishmkrHeldItem.js';

test('derives both WISHMKR berries from the fifth RNG call', () => {
  // Seed A030: fifth upper-16 result 89A5, divide-by-three parity is odd.
  assert.equal(getWishmkrHeldItemId('0xA030'), WISHMKR_GANLON_BERRY_ID);

  // Seed D517: fifth upper-16 result EADA, divide-by-three parity is even.
  assert.equal(getWishmkrHeldItemId('0xD517'), WISHMKR_SALAC_BERRY_ID);
});

test('supports a zero origin seed and rejects missing seeds', () => {
  assert.ok([
    WISHMKR_GANLON_BERRY_ID,
    WISHMKR_SALAC_BERRY_ID,
  ].includes(getWishmkrHeldItemId(0)));
  assert.equal(getWishmkrHeldItemId(''), null);
  assert.equal(getWishmkrHeldItemId(undefined), null);
  assert.equal(getWishmkrHeldItemId('not-a-seed'), null);
});

test('both WISHMKR preset flows and PID finder selection apply the derived item', () => {
  const mainSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert.match(mainSource, /isWishmkrMysteryTag\(rawTag\).*applyWishmkrHeldItemFromSeed\(entry\.seed\)/s);
  assert.match(mainSource, /isWishmkrMysteryEventSelected\(\).*applyWishmkrHeldItemFromSeed\(r\.originSeed \?\? r\.seed\)/s);
});
