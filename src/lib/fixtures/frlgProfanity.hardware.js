// User-reported PC box-name tests; no inferred expectations belong here.
export const HARDWARE_CONTEXT = Object.freeze({
  game: 'Pokemon LeafGreen on Nintendo Switch', systemLanguage: 'English', region: 'Europe',
  field: 'PC box name', candidateFilterVersion: 70,
});
export const HARDWARE_BLOCKED = Object.freeze([
  'bbwjja', 'bbween', 'bbwpen', 'bbwpfr', 'bbwpde', 'bbwpit', 'bbwpes', 'badworda',
  'qxz', 'wtf', 'AwtfA', 'bj', 'dp', 'bv', 'pd', 'kz', 'sa', 'ss', 'xxx', 'AxxxA',
  'nlq', 'wix', 'AwixA', 'w1ix', 'w2ix', 'w!ix', 'w?ix', 'eta', 'figa', 'AfigaA',
  'cazz', 'd1p', 'd!p', 'wttp', 'dick', 'di1ck', 'd!ick',
  'e3bj', 'e3bv', 'h8kz', 'A1dp1A', 'A!dp!A', 'A1qxz1A', 'b3j', 'b!j', 'b?j',
]);
export const HARDWARE_ALLOWED = Object.freeze([
  'bbwefr', 'bbwees', 'bbwpnl', 'bbwppt', 'bbwept', 'bbwpru', 'bbwkko', 'bbwczh',
  'bbwtzh', 'bbwpol', 'bbwtha', 'h8', 'Ah8', 'h8A', 'AqxzA', 'n1g', 'An1gA', '4ne',
  'AdpA', 'AbvA', 'AkzA', 'Ad1pA', 'd1ck', 'lul', 'ebj', 'ebv', 'ab3j', 'b3ja',
]);
// Earlier hardware observations recorded in the project's existing repair tests.
export const PROJECT_HARDWARE_BLOCKED = Object.freeze(['Rx5XxlIk', 'H8kz', 'kz8a']);
