import {
  NINTENDO_FILTER_VERSION, NINTENDO_LANGUAGES, NINTENDO_REJECTION_RULES, NINTENDO_ALLOWLIST,
} from '../data/frlgProfanity.v70.js';

// This is the tested English-system / European-region profile, not a universal
// FRLG language selection. Call createFrlgProfanityFilter with another profile
// when hardware evidence supports it. No digit-to-letter substitutions occur.
export const DEFAULT_FRLG_PROFILE = Object.freeze({
  version: NINTENDO_FILTER_VERSION,
  languages: Object.freeze(['jja', 'een', 'pen', 'pfr', 'pde', 'pit', 'pes', 'common']),
});

// Digits and !/? are supported by the hardware corpus. Other Base64 repair
// symbols retain the previous filter's separator behavior, pending more Switch
// tests. Unknown characters are retained and do not automatically form boundaries.
const DEFAULT_SEPARATORS = new Set(Array.from('0123456789!? .,-/\u2026\u201C\u201D\u2018\u2019\u2642\u2640\'"\t\r\n\u3000'));

/** Standard Nintendo case/width/kana folding, with original UTF-16 positions. */
export function normalizeNintendoCharacters(input) {
  const value = String(input ?? '');
  const characters = [];
  for (let start = 0; start < value.length;) {
    let character = String.fromCodePoint(value.codePointAt(start));
    let end = start + character.length;
    if (/[\uFF66-\uFF9D]/u.test(character)) {
      if (/[\uFF9E\uFF9F]/u.test(value[end] || '')) end++;
      character = value.slice(start, end).normalize('NFKC');
    }
    character = Array.from(character, c => {
      const code = c.codePointAt(0);
      if (/[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/u.test(c)) return String.fromCodePoint(code - 0xFEE0);
      if (/[\u3041-\u3096]/u.test(c)) return String.fromCodePoint(code + 0x60);
      return c;
    }).join('').replace(/[ァィゥェォッャュョヮ]/gu, c => String.fromCodePoint(c.codePointAt(0) + 1))
      .replace(/ヵ/gu, 'カ').replace(/ヶ/gu, 'ケ').toLowerCase();
    const positions = [];
    for (let i = start; i < end; i += String.fromCodePoint(value.codePointAt(i)).length) positions.push(i);
    for (const folded of character) characters.push({ character: folded, start, end, positions });
    start = end;
  }
  return characters;
}

function makeTrie(entries, literal) {
  const root = { children: new Map(), entries: [] };
  for (const entry of entries) {
    if (!literal(entry)) throw new Error('A profanity literal must not be empty');
    let node = root;
    for (const character of literal(entry).toLowerCase()) {
      if (!node.children.has(character)) node.children.set(character, { children: new Map(), entries: [] });
      node = node.children.get(character);
    }
    node.entries.push(entry);
  }
  return root;
}

function searchTrie(characters, trie, accept) {
  const found = [];
  for (let first = 0; first < characters.length; first++) {
    let node = trie;
    for (let last = first; last < characters.length; last++) {
      node = node.children.get(characters[last].character);
      if (!node) break;
      for (const entry of node.entries) {
        if (accept(entry, characters[first], characters[last])) {
          found.push({
            ...entry,
            start: characters[first].start,
            end: characters[last].end,
            positions: [...new Set(characters.slice(first, last + 1).flatMap(c => c.positions))],
          });
        }
      }
    }
  }
  return found;
}

/**
 * Character overrides have independent { skip, boundary } booleans.
 * allowlistMode defaults to disabled: FRLG exception behavior is unverified.
 * same-language-contained is an explicit research option, not a hardware claim.
 */
export function createFrlgProfanityFilter({
  profile = DEFAULT_FRLG_PROFILE,
  rules = NINTENDO_REJECTION_RULES,
  allowlist = NINTENDO_ALLOWLIST,
  characterProperties = {},
  allowlistMode = 'disabled',
} = {}) {
  if (!['disabled', 'same-language-contained'].includes(allowlistMode)) throw new Error('Unknown allowlist mode');
  const version = profile.version ?? NINTENDO_FILTER_VERSION;
  const languages = new Set(profile.languages ?? DEFAULT_FRLG_PROFILE.languages);
  const available = new Set([...NINTENDO_LANGUAGES, ...rules.flatMap(r => r.sources.map(s => s.language))]);
  for (const language of languages) if (!available.has(language)) throw new Error(`Unknown filter language: ${language}`);
  if (!rules.some(r => r.sources.some(s => s.version === version))) throw new Error(`Unsupported Nintendo filter version: ${version}`);
  const select = entry => Object.freeze({ ...entry, sources: Object.freeze(entry.sources.filter(s => s.version === version && languages.has(s.language))) });
  const selectedRules = rules.map(select).filter(r => r.sources.length);
  const selectedAllowlist = allowlist.map(select).filter(r => r.sources.length);
  const trie = makeTrie(selectedRules, r => r.term);
  const allowTrie = makeTrie(selectedAllowlist, r => r.term);
  const overrides = Object.fromEntries(Object.entries(characterProperties).map(([character, flags]) => {
    for (const name of ['skip', 'boundary']) {
      if (flags[name] !== undefined && typeof flags[name] !== 'boolean') throw new TypeError(`${name} must be boolean`);
    }
    return [character, Object.freeze({ ...flags })];
  }));
  const properties = character => ({
    skip: overrides[character]?.skip ?? DEFAULT_SEPARATORS.has(character),
    boundary: overrides[character]?.boundary ?? DEFAULT_SEPARATORS.has(character),
  });

  function checkDetailed(input) {
    const original = normalizeNintendoCharacters(input).map((c, ordinal) => ({ ...c, ordinal, ...properties(c.character) }));
    const compact = original.filter(c => !c.skip);
    const allowlistCandidates = searchTrie(original, allowTrie, () => true);
    const allMatches = searchTrie(compact, trie, (rule, first, last) =>
      (!rule.requiresLeftBoundary || first.ordinal === 0 || original[first.ordinal - 1].boundary)
      && (!rule.requiresRightBoundary || last.ordinal === original.length - 1 || original[last.ordinal + 1].boundary));
    const occurrences = [];
    const suppressedOccurrences = [];
    for (const match of allMatches) {
      const suppressedSources = allowlistMode === 'disabled' ? [] : match.sources.filter(source =>
        allowlistCandidates.some(exception => exception.start <= match.start && exception.end >= match.end
          && exception.sources.some(s => s.language === source.language)));
      const sources = match.sources.filter(s => !suppressedSources.includes(s));
      const detailed = { ...match, sources, suppressedSources, languages: sources.map(s => s.language), version };
      if (sources.length) occurrences.push(detailed);
      else suppressedOccurrences.push(detailed);
    }
    return {
      blocked: occurrences.length > 0,
      // Preserve the warning UI's term-string contract; repair uses occurrences.
      matches: [...new Set(occurrences.map(m => m.term))],
      occurrences,
      allowlistCandidates,
      suppressedOccurrences,
    };
  }

  return Object.freeze({
    profile: Object.freeze({ version, languages: Object.freeze([...languages]) }),
    allowlistMode,
    rules: Object.freeze(selectedRules),
    checkDetailed,
    check: input => checkDetailed(input).blocked,
    isBoundary: character => character === undefined || properties(character).boundary,
    isSkippable: character => properties(character).skip,
  });
}

export const frlgProfanityFilter = createFrlgProfanityFilter();
