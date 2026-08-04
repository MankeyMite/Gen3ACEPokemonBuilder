const RAND_S7_MYSTERY_EVENT_TAGS = new Set([
  '10ANNI',
  'AURA_MEW',
  'DOEL_DEOXYS',
  'SPACE_CENTER_DEOXYS',
  'JOURNEY_ACROSS_AMERICA',
  'PARTY_OF_THE_DECADE',
  'MITSURIN_CELEBI',
]);

function nextGen3LCRNG(seed) {
  return (Math.imul(seed >>> 0, 0x41C64E6D) + 0x6073) >>> 0;
}

export function getRandS7OtGenderFromOriginSeed(originSeed) {
  let state = originSeed >>> 0;
  for (let call = 0; call < 5; call++) state = nextGen3LCRNG(state);

  const rand16 = state >>> 16;
  const female = ((((rand16 >>> 7) & 1) ^ 1) === 1);
  return female ? 'female' : 'male';
}

export function getSeedDerivedMysteryOtGender(eventTag, pidMethod, originSeed) {
  const tag = String(eventTag || '').trim().toUpperCase();
  const method = String(pidMethod || '').trim().toUpperCase();

  if (!RAND_S7_MYSTERY_EVENT_TAGS.has(tag)) return '';
  if (method !== 'BACD_R_A' && method !== 'BACD_A') return '';
  if (originSeed === null || originSeed === undefined || originSeed === '') return '';

  const numericSeed = Number(originSeed);
  if (!Number.isFinite(numericSeed)) return '';
  return getRandS7OtGenderFromOriginSeed(numericSeed);
}
