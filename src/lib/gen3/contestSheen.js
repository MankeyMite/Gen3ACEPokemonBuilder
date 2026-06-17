const LOWEST_FEEL_BLOCK3 = 1;
const BEST_SHEEN_STAT3 = 214;
const MAX_CONTEST_STAT = 255;

const CONTEST_STAT_KEYS = ['cool', 'beauty', 'cute', 'smart', 'tough'];

const ZERO_CONTEST_STATS = Object.freeze({
  cool: 0,
  beauty: 0,
  cute: 0,
  smart: 0,
  tough: 0,
  sheen: 0,
});

// Nature flavor amps in requested order: Spicy, Dry, Sweet, Bitter, Sour.
// Contest stat mapping: Cool, Beauty, Cute, Smart, Tough.
export const NATURE_FLAVOR_AMP_TABLE_GEN3 = Object.freeze([
  [ 0, 0, 0, 0, 0], // Hardy
  [ 1, 0, 0, 0,-1], // Lonely
  [ 1, 0,-1, 0, 0], // Brave
  [ 1,-1, 0, 0, 0], // Adamant
  [ 1, 0, 0,-1, 0], // Naughty
  [-1, 0, 0, 0, 1], // Bold
  [ 0, 0, 0, 0, 0], // Docile
  [ 0, 0,-1, 0, 1], // Relaxed
  [ 0,-1, 0, 0, 1], // Impish
  [ 0, 0, 0,-1, 1], // Lax
  [-1, 0, 1, 0, 0], // Timid
  [ 0, 0, 1, 0,-1], // Hasty
  [ 0, 0, 0, 0, 0], // Serious
  [ 0,-1, 1, 0, 0], // Jolly
  [ 0, 0, 1,-1, 0], // Naive
  [-1, 1, 0, 0, 0], // Modest
  [ 0, 1, 0, 0,-1], // Mild
  [ 0, 1,-1, 0, 0], // Quiet
  [ 0, 0, 0, 0, 0], // Bashful
  [ 0, 1, 0,-1, 0], // Rash
  [-1, 0, 0, 1, 0], // Calm
  [ 0, 0, 0, 1,-1], // Gentle
  [ 0, 0,-1, 1, 0], // Sassy
  [ 0,-1, 0, 1, 0], // Careful
  [ 0, 0, 0, 0, 0], // Quirky
]);

function clampByte(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_CONTEST_STAT, Math.floor(n)));
}

function normalizeContestStats(stats = ZERO_CONTEST_STATS) {
  return {
    cool: clampByte(stats.cool),
    beauty: clampByte(stats.beauty),
    cute: clampByte(stats.cute),
    smart: clampByte(stats.smart),
    tough: clampByte(stats.tough),
    sheen: clampByte(stats.sheen),
  };
}

function hasSameContestStats(a, b) {
  return CONTEST_STAT_KEYS.every(key => a[key] === b[key]);
}

function isAnyContestStatMax(stats) {
  return CONTEST_STAT_KEYS.some(key => stats[key] >= MAX_CONTEST_STAT);
}

function getNatureFlavorAmps(nature) {
  const natureIndex = Number(nature);
  if (!Number.isInteger(natureIndex) || natureIndex < 0 || natureIndex >= NATURE_FLAVOR_AMP_TABLE_GEN3.length) {
    return NATURE_FLAVOR_AMP_TABLE_GEN3[0];
  }
  return NATURE_FLAVOR_AMP_TABLE_GEN3[natureIndex];
}

function isNeutralNature(nature) {
  const natureIndex = Number(nature);
  return !Number.isInteger(natureIndex) || natureIndex < 0 || natureIndex >= 25 || natureIndex % 6 === 0;
}

function getStatAdjustment(gain, amp) {
  const undoFactor = amp === 1 ? 11 : 9;
  let boost = Math.floor(gain / undoFactor);
  if (gain % undoFactor >= 5) boost++;
  return amp === -1 ? boost : -boost;
}

function getAmpedGain(amps, index, current, initial) {
  const gain = current - initial;
  if (gain <= 0) return 0;

  const amp = amps[index] || 0;
  if (amp === 0) return gain;
  return gain + getStatAdjustment(gain, amp);
}

function getGainedSum(stats, nature, initial) {
  const amps = getNatureFlavorAmps(nature);
  return getAmpedGain(amps, 0, stats.cool, initial.cool)
    + getAmpedGain(amps, 1, stats.beauty, initial.beauty)
    + getAmpedGain(amps, 2, stats.cute, initial.cute)
    + getAmpedGain(amps, 3, stats.smart, initial.smart)
    + getAmpedGain(amps, 4, stats.tough, initial.tough);
}

function getAverageFeel(stats, nature, initial) {
  return Math.ceil(getGainedSum(stats, nature, initial) / 5);
}

function clampSheen(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function calculateMinimumSheenGen3(stats, nature, initial = ZERO_CONTEST_STATS) {
  const current = normalizeContestStats(stats);
  const base = normalizeContestStats(initial);
  if (hasSameContestStats(current, base)) return base.sheen;

  const rawAvg = getAverageFeel(current, 0, base);
  if (rawAvg <= 0) return base.sheen;
  if (rawAvg === MAX_CONTEST_STAT) return BEST_SHEEN_STAT3;

  let avg = isNeutralNature(nature) ? rawAvg : getAverageFeel(current, nature, base);
  avg = Math.max(LOWEST_FEEL_BLOCK3, avg);
  avg = Math.min(rawAvg, avg);

  const scaled = Math.floor((BEST_SHEEN_STAT3 * avg) / MAX_CONTEST_STAT);
  return clampSheen(scaled, LOWEST_FEEL_BLOCK3, BEST_SHEEN_STAT3);
}

export function calculateMaximumSheenGen3(stats, nature, initial = ZERO_CONTEST_STATS) {
  const current = normalizeContestStats(stats);
  const base = normalizeContestStats(initial);
  if (isAnyContestStatMax(current)) return MAX_CONTEST_STAT;
  if (hasSameContestStats(current, base)) return base.sheen;

  const sum = getGainedSum(current, nature, base);
  if (sum <= 0) return base.sheen;

  const gainedAtLeast2 = CONTEST_STAT_KEYS
    .filter(key => current[key] - base[key] >= 2)
    .length;
  const permit = gainedAtLeast2 >= 3
    ? Math.floor((sum * 83) / 6)
    : Math.floor((sum * 19) / 9);

  return clampSheen(permit, LOWEST_FEEL_BLOCK3, MAX_CONTEST_STAT);
}

export function getLegalSheenRangeGen3(stats, nature, initial = ZERO_CONTEST_STATS) {
  const minSheen = calculateMinimumSheenGen3(stats, nature, initial);
  const maxSheen = calculateMaximumSheenGen3(stats, nature, initial);
  return {
    minSheen,
    maxSheen: Math.max(minSheen, maxSheen),
  };
}

export function autoCalculateSheenGen3(stats, nature, initial = ZERO_CONTEST_STATS) {
  return getLegalSheenRangeGen3(stats, nature, initial).minSheen;
}
