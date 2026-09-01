/**
 * Unit tests for the hybrid Nintendo Switch profanity filter.
 *
 * Run with: node src/lib/profanityFilter.test.js
 *
 * Tests cover all observed behavior from real Switch testing.
 */

import {
  normalizeInput,
  splitIntoLetterTokens,
  containsBoundaryTerm,
  containsStrongSubstring,
  parsePkhexPattern,
  classifyPattern,
  buildFilterSets,
  createProfanityFilter,
} from './profanityFilter.js';
import { PROFANITY_LIST } from '../data/profanity.gen3.js';

// ─── Minimal test runner ────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ─── Build a test filter with representative PKHeX patterns ─────────────
// Simulate the real PKHeX patterns for the terms we care about:
const TEST_PATTERNS = [
  '^ass$',        // exact → boundary-only
  '^sa$',         // exact → boundary-only
  '^bv$',         // exact → boundary-only (confirmed Switch behavior)
  '^bj$',         // exact → boundary-only (confirmed Switch behavior)
  '^dp$',         // exact in PKHeX, but manually overridden to strong
  '.*nlq.*',      // short substring, manually overridden to strong
  '.*xxx.*',      // short substring, confirmed as strong by Switch testing
  '.*wix.*',      // substring len 3 -> boundary (digit-bridged regression case)
  '.*kz.*',       // substring len 2 -> boundary (Nintendo digit-isolated behavior)
  '.*fag.*',      // substring, len 3, but manually overridden to strong
  '.*sex.*',      // substring, len 3, but manually overridden to strong
  '.*dick.*',     // substring, len 4, manually overridden to strong
  '.*shit.*',     // substring, len 4 → strong
  '.*fuck.*',     // substring, len 4 → strong
  '.*asshole.*',  // substring, len 7 → strong
];

const filter = createProfanityFilter(TEST_PATTERNS);
const productionFilter = createProfanityFilter(PROFANITY_LIST);

assert(!PROFANITY_LIST.includes('^jod.*'), 'the unconfirmed "jod" rule is not in the production list');
assert(productionFilter.check('jod') === false, '"jod" is allowed by the production filter');

// ═══════════════════════════════════════════════════════════════════════
// normalizeInput
// ═══════════════════════════════════════════════════════════════════════
section('normalizeInput');

assert(normalizeInput('Hello') === 'hello', 'lowercases input');
assert(normalizeInput('a s s').includes('\x00'), 'spaces become boundary markers');
assert(normalizeInput('a-s-s').includes('\x00'), 'hyphens become boundary markers');
assert(normalizeInput('a.s.s').includes('\x00'), 'periods become boundary markers');
assert(normalizeInput('12ass34') === '12ass34', 'digits preserved as-is');
assert(normalizeInput('ABC') === 'abc', 'uppercase to lowercase');

// ═══════════════════════════════════════════════════════════════════════
// splitIntoLetterTokens
// ═══════════════════════════════════════════════════════════════════════
section('splitIntoLetterTokens');

assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('ass'))) === '["ass"]',
  'simple word → one token'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('12ass34'))) === '["ass"]',
  'digits are ignored inside the letter run'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('wi8x'))) === '["wix"]',
  'digits are ignored so wi8x tokenizes as wix'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('xassx'))) === '["xassx"]',
  'all-letter run stays as one token'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('a s s'))) === '["a","s","s"]',
  'spaces split into single-char tokens'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('mass'))) === '["mass"]',
  '"mass" is one token'
);
assert(
  JSON.stringify(splitIntoLetterTokens(normalizeInput('class'))) === '["class"]',
  '"class" is one token'
);

// ═══════════════════════════════════════════════════════════════════════
// containsBoundaryTerm
// ═══════════════════════════════════════════════════════════════════════
section('containsBoundaryTerm');

assert(containsBoundaryTerm(normalizeInput('ass'), 'ass') === true, '"ass" matches boundary term "ass"');
assert(containsBoundaryTerm(normalizeInput('12ass34'), 'ass') === true, '"12ass34" matches (digits are boundaries)');
assert(containsBoundaryTerm(normalizeInput('a s s'), 'ass') === true, '"a s s" matches (separator bypass)');
assert(containsBoundaryTerm(normalizeInput('a-s-s'), 'ass') === true, '"a-s-s" matches (separator bypass)');
assert(containsBoundaryTerm(normalizeInput('a.s.s'), 'ass') === true, '"a.s.s" matches (separator bypass)');
assert(containsBoundaryTerm(normalizeInput('assh'), 'ass') === false, '"assh" does NOT match (inside larger token)');
assert(containsBoundaryTerm(normalizeInput('xass'), 'ass') === false, '"xass" does NOT match');
assert(containsBoundaryTerm(normalizeInput('assx'), 'ass') === false, '"assx" does NOT match');
assert(containsBoundaryTerm(normalizeInput('mass'), 'ass') === false, '"mass" does NOT match');
assert(containsBoundaryTerm(normalizeInput('class'), 'ass') === false, '"class" does NOT match');
assert(containsBoundaryTerm(normalizeInput('xassx'), 'ass') === false, '"xassx" does NOT match');
assert(containsBoundaryTerm(normalizeInput('wi8x'), 'wix') === true, '"wi8x" matches boundary term "wix"');

assert(containsBoundaryTerm(normalizeInput('kz'), 'kz') === true, '"kz" matches boundary term "kz"');
assert(containsBoundaryTerm(normalizeInput('Hkz'), 'kz') === false, '"Hkz" does NOT match');
assert(containsBoundaryTerm(normalizeInput('Kza'), 'kz') === false, '"Kza" does NOT match');
assert(containsBoundaryTerm(normalizeInput('k8z'), 'kz') === true, '"k8z" matches (digits inside term are skipped)');
assert(containsBoundaryTerm(normalizeInput('H8kz'), 'kz') === true, '"H8kz" matches (digit boundary before term)');
assert(containsBoundaryTerm(normalizeInput('kz8a'), 'kz') === true, '"kz8a" matches (digit boundary after term)');
assert(containsBoundaryTerm(normalizeInput('H6K8z8a8'), 'kz') === true, '"H6K8z8a8" matches "kz" with digit isolation');

assert(containsBoundaryTerm(normalizeInput('sa'), 'sa') === true, '"sa" matches boundary term "sa"');
assert(containsBoundaryTerm(normalizeInput('xsa'), 'sa') === false, '"xsa" does NOT match');
assert(containsBoundaryTerm(normalizeInput('sax'), 'sa') === false, '"sax" does NOT match');
assert(containsBoundaryTerm(normalizeInput('xsax'), 'sa') === false, '"xsax" does NOT match');

// ═══════════════════════════════════════════════════════════════════════
// containsStrongSubstring
// ═══════════════════════════════════════════════════════════════════════
section('containsStrongSubstring');

assert(containsStrongSubstring(normalizeInput('fag'), 'fag') === true, '"fag" matches strong substring');
assert(containsStrongSubstring(normalizeInput('xfag'), 'fag') === true, '"xfag" matches');
assert(containsStrongSubstring(normalizeInput('fagx'), 'fag') === true, '"fagx" matches');
assert(containsStrongSubstring(normalizeInput('xfagx'), 'fag') === true, '"xfagx" matches');
assert(containsStrongSubstring(normalizeInput('yfagy'), 'fag') === true, '"yfagy" matches');

assert(containsStrongSubstring(normalizeInput('shit'), 'shit') === true, '"shit" matches strong substring');
assert(containsStrongSubstring(normalizeInput('xshit'), 'shit') === true, '"xshit" matches');
assert(containsStrongSubstring(normalizeInput('shitx'), 'shit') === true, '"shitx" matches');

// ═══════════════════════════════════════════════════════════════════════
// parsePkhexPattern
// ═══════════════════════════════════════════════════════════════════════
section('parsePkhexPattern');

assert(parsePkhexPattern('^ass$').type === 'exact', '^ass$ is exact');
assert(parsePkhexPattern('^ass$').term === 'ass', '^ass$ term is ass');
assert(parsePkhexPattern('.*fag.*').type === 'substring', '.*fag.* is substring');
assert(parsePkhexPattern('.*fag.*').term === 'fag', '.*fag.* term is fag');
assert(parsePkhexPattern('^shit.*').type === 'prefix', '^shit.* is prefix');
assert(parsePkhexPattern('.*shit$').type === 'suffix', '.*shit$ is suffix');

// ═══════════════════════════════════════════════════════════════════════
// classifyPattern
// ═══════════════════════════════════════════════════════════════════════
section('classifyPattern');

assert(classifyPattern('^ass$').ruleClass === 'boundary', '^ass$ → boundary (exact match)');
assert(classifyPattern('^sa$').ruleClass === 'boundary', '^sa$ → boundary (exact match)');
assert(classifyPattern('^bv$').ruleClass === 'boundary', '^bv$ → boundary (confirmed Switch behavior)');
assert(classifyPattern('^dp$').ruleClass === 'strong', '^dp$ → strong (manual override)');
assert(classifyPattern('.*nlq.*').ruleClass === 'strong', '.*nlq.* → strong (manual override)');
assert(classifyPattern('.*xxx.*').ruleClass === 'strong', '.*xxx.* → strong (confirmed Switch override)');
assert(classifyPattern('.*fag.*').ruleClass === 'strong', '.*fag.* → strong (manual override)');
assert(classifyPattern('.*sex.*').ruleClass === 'strong', '.*sex.* → strong (manual override)');
assert(classifyPattern('.*shit.*').ruleClass === 'strong', '.*shit.* → strong (manual override)');
assert(classifyPattern('.*fuck.*').ruleClass === 'strong', '.*fuck.* → strong (manual override)');
assert(classifyPattern('.*asshole.*').ruleClass === 'strong', '.*asshole.* → strong (len > 3)');

// A short substring term NOT in manual lists → boundary (heuristic: len ≤ 3)
assert(classifyPattern('.*xyz.*').ruleClass === 'boundary', '.*xyz.* → boundary (len 3, not manual)');
// A longer substring term NOT in manual lists → strong
assert(classifyPattern('.*abcdef.*').ruleClass === 'strong', '.*abcdef.* → strong (len > 3)');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "ass" (boundary-only)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "ass" (boundary-only)');

assert(filter.check('ass') === true, '"ass" = banned');
assert(filter.check('assh') === false, '"assh" = allowed');
assert(filter.check('xass') === false, '"xass" = allowed');
assert(filter.check('assx') === false, '"assx" = allowed');
assert(filter.check('mass') === false, '"mass" = allowed');
assert(filter.check('class') === false, '"class" = allowed');
assert(filter.check('xassx') === false, '"xassx" = allowed');
assert(filter.check('12ass34') === true, '"12ass34" = banned');
assert(filter.check('a s s') === true, '"a s s" = banned');
assert(filter.check('a-s-s') === true, '"a-s-s" = banned');
assert(filter.check('a.s.s') === true, '"a.s.s" = banned');
assert(filter.check('wi8x') === true, '"wi8x" = banned');

// Boundary-only short term should respect Nintendo-style digit-isolated boundaries.
assert(filter.check('kz') === true, '"kz" = blocked');
assert(filter.check('Hkz') === false, '"Hkz" = allowed');
assert(filter.check('Kza') === false, '"Kza" = allowed');
assert(filter.check('k8z') === true, '"k8z" = blocked');
assert(filter.check('H8kz') === true, '"H8kz" = blocked');
assert(filter.check('kz8a') === true, '"kz8a" = blocked');
assert(filter.check('H6K8z8a8') === true, '"H6K8z8a8" = blocked');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "fag" (strong substring)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "fag" (strong substring)');

assert(filter.check('fag') === true, '"fag" = banned');
assert(filter.check('xfag') === true, '"xfag" = banned');
assert(filter.check('fagx') === true, '"fagx" = banned');
assert(filter.check('xfagx') === true, '"xfagx" = banned');
assert(filter.check('yfagy') === true, '"yfagy" = banned');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "shit" (strong substring)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "shit" (strong substring)');

assert(filter.check('shit') === true, '"shit" = banned');
assert(filter.check('xshit') === true, '"xshit" = banned');
assert(filter.check('shitx') === true, '"shitx" = banned');

section('Full filter: "dick" (strong substring)');

assert(filter.check('dick') === true, '"dick" = blocked');
assert(filter.check('xdick') === true, '"xdick" = blocked');
assert(filter.check('dickx') === true, '"dickx" = blocked');
assert(filter.check('xdickx') === true, '"xdickx" = blocked');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "sa" (boundary-only)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "sa" (boundary-only)');

assert(filter.check('sa') === true, '"sa" = banned');
assert(filter.check('xsa') === false, '"xsa" = allowed');
assert(filter.check('sax') === false, '"sax" = allowed');
assert(filter.check('xsax') === false, '"xsax" = allowed');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "dp" (manual strong override)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "dp" (strong override)');

assert(filter.check('dp') === true, '"dp" = banned');
assert(filter.check('tetdp') === true, '"tetdp" = banned');
assert(filter.check('t0?et7dP') === true, '"t0?et7dP" = banned (digit/separator bridged)');

section('Full filter: "bv" and "bj" (confirmed boundary-only terms)');

assert(filter.check('bv') === true, '"bv" = banned');
assert(filter.check('ebv') === false, '"ebv" = allowed (direct letter prefix)');
assert(filter.check('e3bv') === true, '"e3bv" = banned (digit does not protect)');
assert(filter.check('bj') === true, '"bj" = banned');
assert(filter.check('ebj') === false, '"ebj" = allowed (direct letter prefix)');
assert(filter.check('e3bj') === true, '"e3bj" = banned (digit does not protect)');
assert(productionFilter.check('ebv') === false, 'production filter allows the confirmed bv letter prefix');
assert(productionFilter.check('e3bv') === true, 'production filter blocks bv after a digit');
assert(productionFilter.check('ebj') === false, 'production filter allows the confirmed bj letter prefix');
assert(productionFilter.check('e3bj') === true, 'production filter blocks bj after a digit');

section('Full filter: "nlq" (strong override)');

assert(filter.check('nlq') === true, '"nlq" = banned');
assert(filter.check('anlqb') === true, '"anlqb" = banned (embedded substring)');
assert(filter.check('n1?l2q3A') === true, '"n1?l2q3A" = banned (digit/separator bridged)');

section('Full filter: "xxx" (confirmed Switch override)');

assert(filter.check('xxx') === true, '"xxx" = banned');
assert(filter.check('rxxxlik') === true, '"rxxxlik" = banned (embedded substring)');
assert(filter.check('Rx5XxlIk') === true, '"Rx5XxlIk" = banned (confirmed Switch digit-bridged case)');
assert(productionFilter.check('Rx5XxlIk') === true, 'production filter blocks the confirmed Switch case');

section('Full filter: "sex" (strong override)');

assert(filter.check('sex') === true, '"sex" = banned');
assert(filter.check('s1?e2x3A') === true, '"s1?e2x3A" = banned (digit/separator bridged)');

// ═══════════════════════════════════════════════════════════════════════
// Full filter integration — "asshole" (strong substring)
// ═══════════════════════════════════════════════════════════════════════
section('Full filter: "asshole" (strong substring)');

assert(filter.check('asshole') === true, '"asshole" = banned');
assert(filter.check('xassholex') === true, '"xassholex" = banned (strong)');

// ═══════════════════════════════════════════════════════════════════════
// Case insensitivity
// ═══════════════════════════════════════════════════════════════════════
section('Case insensitivity');

assert(filter.check('ASS') === true, '"ASS" = banned (case insensitive)');
assert(filter.check('Ass') === true, '"Ass" = banned (case insensitive)');
assert(filter.check('SHIT') === true, '"SHIT" = banned (case insensitive)');
assert(filter.check('FaG') === true, '"FaG" = banned (case insensitive)');

// ═══════════════════════════════════════════════════════════════════════
// Clean strings should pass
// ═══════════════════════════════════════════════════════════════════════
section('Clean strings');

assert(filter.check('hello') === false, '"hello" = allowed');
assert(filter.check('pikachu') === false, '"pikachu" = allowed');
assert(filter.check('classic') === false, '"classic" = allowed');
assert(filter.check('grass') === false, '"grass" = allowed');
assert(filter.check('massive') === false, '"massive" = allowed');
assert(filter.check('passage') === false, '"passage" = allowed');
assert(filter.check('sassafras') === false, '"sassafras" = allowed');
assert(filter.check('POKEMON') === false, '"POKEMON" = allowed');

// ═══════════════════════════════════════════════════════════════════════
// checkDetailed
// ═══════════════════════════════════════════════════════════════════════
section('checkDetailed');

const detail1 = filter.checkDetailed('ass');
assert(detail1.blocked === true && detail1.matches.includes('ass'), 'checkDetailed finds "ass"');

const detail2 = filter.checkDetailed('hello');
assert(detail2.blocked === false && detail2.matches.length === 0, 'checkDetailed clean for "hello"');

const detail3 = filter.checkDetailed('shit');
assert(detail3.blocked === true && detail3.matches.includes('shit'), 'checkDetailed finds "shit"');

// ═══════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
} else {
  console.log('All tests passed!');
}
