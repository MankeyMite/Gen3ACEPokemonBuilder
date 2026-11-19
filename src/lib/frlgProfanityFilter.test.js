import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createFrlgProfanityFilter, frlgProfanityFilter, DEFAULT_FRLG_PROFILE, normalizeNintendoCharacters,
} from './frlgProfanityFilter.js';
import { NINTENDO_REJECTION_RULES, NINTENDO_ALLOWLIST } from '../data/frlgProfanity.v70.js';
import { HARDWARE_BLOCKED, HARDWARE_ALLOWED, PROJECT_HARDWARE_BLOCKED } from './fixtures/frlgProfanity.hardware.js';

for (const input of [...HARDWARE_BLOCKED, ...PROJECT_HARDWARE_BLOCKED]) {
  assert.equal(frlgProfanityFilter.check(input), true, `Hardware blocked: ${input}`);
}
for (const input of HARDWARE_ALLOWED) {
  assert.equal(frlgProfanityFilter.check(input), false, `Hardware allowed: ${input}`);
}
assert.equal(new Set([...HARDWARE_BLOCKED, ...HARDWARE_ALLOWED]).size, 74);
assert.equal(NINTENDO_REJECTION_RULES.length, 5500);
assert.equal(frlgProfanityFilter.rules.length, 2677);
assert.ok(NINTENDO_REJECTION_RULES.every(r => r.sources.every(s => s.version === 70 && !s.path.includes('_b1_'))));
assert.equal(NINTENDO_REJECTION_RULES.find(r => r.term === 'wttp').type, 'substring');
assert.deepEqual(NINTENDO_REJECTION_RULES.find(r => r.term === 'lul').sources.map(s => s.language), ['pnl']);
assert.ok(NINTENDO_REJECTION_RULES.some(r => r.pattern === '^rectum$' && r.sources.some(s => s.language === 'pde')));
assert.ok(NINTENDO_REJECTION_RULES.some(r => r.pattern === '.*rectum.*' && r.sources.some(s => s.language === 'pnl')));
// Compare every emitted pattern and source against the original rejection text,
// including literal punctuation that must be escaped in the displayed pattern.
const snapshot = JSON.parse(await readFile(new URL('../data/nintendoSwitchProfanity.v70.source.json', import.meta.url), 'utf8'));
const emitted = new Map(NINTENDO_REJECTION_RULES.map(r => [r.pattern, r]));
for (const file of snapshot.rejectionFiles) {
  for (const raw of file.content.split('\n').filter(Boolean)) {
    const left = file.bucket === 'b2' && raw.startsWith('\\b');
    const right = file.bucket === 'b2' && raw.endsWith('\\b');
    const literal = raw.slice(left ? 2 : 0, right ? -2 : undefined);
    const pattern = (left ? '^' : '.*') + literal.replace(/[.*^$]/g, '\\$&') + (right ? '$' : '.*');
    assert.ok(emitted.get(pattern)?.sources.some(s => s.path === file.path && s.language === file.language), pattern);
  }
}

function rule(term, type, languages = ['een']) {
  const left = type === 'exact' || type === 'prefix';
  const right = type === 'exact' || type === 'suffix';
  return {
    id: `${type}:${term}`, term, type,
    pattern: (left ? '^' : '.*') + term + (right ? '$' : '.*'),
    requiresLeftBoundary: left, requiresRightBoundary: right,
    sources: languages.map(language => ({ language, version: 70, path: 'synthetic' })),
  };
}
function synthetic(rules, options = {}) {
  return createFrlgProfanityFilter({ rules, allowlist: [], ...options });
}
for (const [type, allowed, blocked] of [
  ['exact', ['abcdZ', 'Zabcd', 'ZabcdZ'], ['abcd', 'Z1abcd1Z', 'a!bc?d']],
  ['prefix', ['Zabcd', 'ZabcdZ'], ['abcd', 'abcdZ', 'Z1abcdZ']],
  ['suffix', ['abcdZ', 'ZabcdZ'], ['abcd', 'Zabcd', 'Zabcd1Z']],
  ['substring', [], ['abcd', 'abcdZ', 'Zabcd', 'ZabcdZ', 'Za!bc?dZ']],
]) {
  const filter = synthetic([rule('abcd', type)]);
  for (const value of allowed) assert.equal(filter.check(value), false, `${type} allowed: ${value}`);
  for (const value of blocked) assert.equal(filter.check(value), true, `${type} blocked: ${value}`);
}

const bridged = frlgProfanityFilter.checkDetailed('b3j').occurrences.find(m => m.term === 'bj');
assert.equal(bridged.pattern, '^bj$');
assert.equal(bridged.type, 'exact');
assert.deepEqual(bridged.positions, [0, 2]);
assert.deepEqual([bridged.start, bridged.end], [0, 3]);
assert.deepEqual(bridged.languages, ['een']);
assert.equal(bridged.requiresLeftBoundary, true);
assert.equal(bridged.requiresRightBoundary, true);
assert.equal(bridged.sources[0].path, 'parsed/NgWord2/70/ac_1_b2_nx.txt');
assert.deepEqual(frlgProfanityFilter.checkDetailed('e3bj').occurrences[0].positions, [2, 3]);
assert.deepEqual(frlgProfanityFilter.checkDetailed('Abj3bj').occurrences.find(m => m.term === 'bj').positions, [4, 5]);
assert.ok(frlgProfanityFilter.checkDetailed('dick').occurrences[0].sources.length > 1, 'Overlapping languages retain provenance');
assert.ok(frlgProfanityFilter.checkDetailed('w!ix').matches.every(m => typeof m === 'string'), 'Legacy UI term contract');

const repeated = synthetic([rule('abc', 'substring'), rule('bc', 'substring')]).checkDetailed('abc1abc');
assert.equal(repeated.occurrences.length, 4, 'Keep all overlapping and repeated occurrences');
assert.deepEqual(repeated.occurrences.map(m => m.positions), [[0, 1, 2], [1, 2], [4, 5, 6], [5, 6]]);
const skipWithoutBoundary = synthetic([rule('bj', 'exact')], { characterProperties: { '3': { skip: true, boundary: false } } });
assert.equal(skipWithoutBoundary.check('b3j'), true);
assert.equal(skipWithoutBoundary.check('e3bj'), false);
const boundaryWithoutSkip = synthetic([rule('bj', 'exact')], { characterProperties: { '3': { skip: false, boundary: true } } });
assert.equal(boundaryWithoutSkip.check('b3j'), false);
assert.equal(boundaryWithoutSkip.check('e3bj'), true);
const literalDigits = synthetic([rule('4ne', 'substring')]);
assert.equal(literalDigits.rules[0].term, '4ne', 'Dictionary digits must remain literal');
assert.equal(literalDigits.check('4ne'), false, 'Default input processing omits the digit');
assert.equal(synthetic([rule('4ne', 'substring')], { characterProperties: { '4': { skip: false } } }).check('4ne'), true);
assert.equal(synthetic([rule('a.b', 'substring')], { characterProperties: { '.': { skip: false } } }).check('a.b'), true);
assert.equal(synthetic([rule('a.b', 'substring')]).check('aXb'), false, 'Pattern body is a literal, not a wildcard');

const dutch = createFrlgProfanityFilter({ profile: { languages: [...DEFAULT_FRLG_PROFILE.languages, 'pnl'] } });
assert.equal(dutch.check('lul'), true);
assert.equal(dutch.check('bbwpnl'), true);
assert.equal(createFrlgProfanityFilter({ profile: { languages: ['common'] } }).check('bj'), false);
assert.throws(() => createFrlgProfanityFilter({ profile: { languages: ['unknown'] } }), /Unknown filter language/);
assert.throws(() => createFrlgProfanityFilter({ profile: { version: 66 } }), /Unsupported Nintendo filter version/);

assert.ok(NINTENDO_ALLOWLIST.some(e => e.term === 'grape' && e.sources.some(s => s.language === 'een' && s.parsedVersion === 66)));
const grape = frlgProfanityFilter.checkDetailed('Grape');
assert.equal(grape.blocked, true, 'No unverified production allowlist override');
assert.equal(grape.allowlistCandidates[0].term, 'grape');
const experimental = createFrlgProfanityFilter({ allowlistMode: 'same-language-contained' });
assert.equal(experimental.check('Grape'), false, 'Explicit opt-in same-language exception');
assert.equal(experimental.check('gr!ape'), true, 'Exception lookup occurs before separator skipping');
assert.equal(experimental.check('killian'), true, 'Common exception does not override another language');
const partialException = synthetic([rule('abc', 'substring', ['een', 'pen'])], {
  allowlist: [{ term: 'xabcx', sources: [{ language: 'een', version: 70 }] }],
  allowlistMode: 'same-language-contained',
}).checkDetailed('xabcx');
assert.deepEqual(partialException.occurrences[0].languages, ['pen']);
assert.equal(partialException.occurrences[0].suppressedSources[0].language, 'een');

assert.equal(frlgProfanityFilter.check('B3J'), true);
assert.equal(frlgProfanityFilter.check('Ｂ３Ｊ'), true);
assert.equal(synthetic([rule('カタカナ', 'exact')]).check('かたかな'), true);
assert.equal(synthetic([rule('ガ', 'exact')]).check('ｶﾞ'), true);
assert.deepEqual(normalizeNintendoCharacters('ｶﾞ')[0].positions, [0, 1]);
assert.equal(synthetic([rule('abc', 'substring')]).check('a☃bc'), false, 'Unknown symbols are not automatically skipped');

console.log(`FRLG matcher: ${HARDWARE_BLOCKED.length + HARDWARE_ALLOWED.length} supplied hardware cases, ${PROJECT_HARDWARE_BLOCKED.length} recorded project observations, rule types, provenance, profiles, exceptions and normalization passed.`);
