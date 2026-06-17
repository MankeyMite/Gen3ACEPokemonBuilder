import {
  autoCalculateSheenGen3,
  calculateMaximumSheenGen3,
  calculateMinimumSheenGen3,
  getLegalSheenRangeGen3,
} from './contestSheen.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

function stats(values = {}) {
  return {
    cool: values.cool ?? 0,
    beauty: values.beauty ?? 0,
    cute: values.cute ?? 0,
    smart: values.smart ?? 0,
    tough: values.tough ?? 0,
    sheen: values.sheen ?? 0,
  };
}

function isManualWarningLow(s, nature, sheen) {
  const { minSheen } = getLegalSheenRangeGen3(s, nature, stats());
  return sheen < minSheen;
}

function isManualWarningHigh(s, nature, sheen) {
  const { maxSheen } = getLegalSheenRangeGen3(s, nature, stats());
  return sheen > maxSheen;
}

console.log('\n-- Gen 3 contest Sheen legality --');

assert(autoCalculateSheenGen3(stats(), 0, stats()) === 0, 'all zero contest stats auto-set Sheen to 0');

const coolOne = stats({ cool: 1 });
assert(autoCalculateSheenGen3(coolOne, 0, stats()) >= 1, 'Cool 1 sets Sheen to at least 1');
assert(autoCalculateSheenGen3(stats({ beauty: 1 }), 0, stats()) !== 0, 'nonzero Beauty does not leave Sheen at 0');

const allMax = stats({ cool: 255, beauty: 255, cute: 255, smart: 255, tough: 255 });
assert(calculateMinimumSheenGen3(allMax, 0, stats()) === 214, 'all five contest stats 255 has minimum Sheen 214');
assert(autoCalculateSheenGen3(allMax, 0, stats()) === 214, 'all five contest stats 255 auto-sets Sheen to 214');

const coolHundred = stats({ cool: 100 });
const neutralMin = autoCalculateSheenGen3(coolHundred, 0, stats()); // Hardy
const favoredMin = autoCalculateSheenGen3(coolHundred, 3, stats()); // Adamant likes Spicy/Cool
const dislikedMin = autoCalculateSheenGen3(coolHundred, 5, stats()); // Bold dislikes Spicy/Cool
assert(favoredMin !== neutralMin || dislikedMin !== neutralMin, 'changing nature recalculates the legal Sheen range');

const manualStats = stats({ cool: 10 });
const manualRange = getLegalSheenRangeGen3(manualStats, 0, stats());
assert(isManualWarningLow(manualStats, 0, manualRange.minSheen - 1), 'manual Sheen below range shows low warning');
assert(isManualWarningHigh(manualStats, 0, manualRange.maxSheen + 1), 'manual Sheen above range shows high warning');

const cases = [
  stats(),
  stats({ cool: 1 }),
  stats({ beauty: 50, cute: 25 }),
  stats({ cool: 255, beauty: 255, cute: 255, smart: 255, tough: 255 }),
  stats({ cool: 12, beauty: 34, cute: 56, smart: 78, tough: 90 }),
];

for (let nature = 0; nature < 25; nature++) {
  for (const s of cases) {
    const sheen = autoCalculateSheenGen3(s, nature, stats());
    const min = calculateMinimumSheenGen3(s, nature, stats());
    const max = calculateMaximumSheenGen3(s, nature, stats());
    assert(sheen >= min && sheen <= Math.max(min, max), `auto Sheen is inside range for nature ${nature}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}

console.log(`${passed} passed`);
