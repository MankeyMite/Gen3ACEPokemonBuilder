import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const rngWorkerSource = await readFile(new URL('./lib/gen3/rng-worker.js', import.meta.url), 'utf8');

assert.match(html, /<select id="pfNature"[\s\S]*?<option value="-1">Any nature<\/option>/);
assert.match(html, /<th>PID<\/th>\s*<th>Nature<\/th>/);
assert.match(
  mainSource,
  /const nature\s*=\s*Number\(document\.getElementById\('pfNature'\)\?\.value/,
  'PID searches should read the independent nature filter from the modal',
);
assert.match(
  mainSource,
  /const natureIndex = mainNatureValue === '' \? -1 : Number\(mainNatureValue\)/,
  'a blank builder nature should map to the PID Finder wildcard',
);
assert.match(mainSource, /pfNatureSel\.value = String\(natureIndex\)/);
assert.doesNotMatch(
  mainSource,
  /btn\.addEventListener\('click',[\s\S]*?natureEl\?\.classList\.add\('field-error'\)[\s\S]*?openModal\(\)/,
  'the PID Finder button should not reject a blank builder nature',
);
assert.match(
  mainSource,
  /hasSpecies && hasResolvedOrigin && hasNature && hasMove/,
  'Generate should still require a resolved nature after the PID Finder entry gate is relaxed',
);
assert.match(
  mainSource,
  /resultNatureName = NATURES\[\(Number\(r\.pid\) >>> 0\) % 25\]/,
  'each wildcard result should display the nature derived from its exact PID',
);
assert.match(
  rngWorkerSource,
  /candidateNature = \(pid >>> 0\) % 25;[\s\S]*?validateEncounterChain\([^\n]*candidateNature/,
  'wild encounter validation should use each candidate PID\'s derived nature',
);
assert.match(mainSource, /Nature is PID-derived in Gen 3; always sync it from the selected result/);

console.log('PID Finder any-nature UI tests passed');
