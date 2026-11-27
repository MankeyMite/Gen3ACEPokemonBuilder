import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPECIES } from '../data/species.gen3.js';
import { rankSpeciesMatches } from './speciesSearch.js';

const species = SPECIES.map(([, name]) => ({ name }));
const suggestions = query => rankSpeciesMatches(species, query).map(item => item.name);

test('species search favors an exact name over longer matches', () => {
  assert.deepEqual(suggestions('mEw'), ['Mew', 'Mewtwo']);
  assert.deepEqual(suggestions(' Mew '), ['Mew']);
});

test('species search keeps spaces in multiword prefixes and allows partial names', () => {
  assert.deepEqual(suggestions('Mr. '), ['Mr. Mime']);
  assert.deepEqual(suggestions('ewtw'), ['Mewtwo']);
});
