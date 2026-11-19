import { frlgProfanityFilter } from './frlgProfanityFilter.js';
import {
  createProfanityFilter, classifyPattern, normalizeInput, containsBoundaryTerm,
} from './profanityFilter.js';
import { PROFANITY_LIST } from '../data/profanity.gen3.js';

export const DEFAULT_SWITCH_FILTER_MODE = 'current';

// Unknown URL values cannot accidentally opt users into the backup.
export function switchFilterModeFromSearch(search = '') {
  return new URLSearchParams(search).get('switchFilter') === 'legacy' ? 'legacy' : DEFAULT_SWITCH_FILTER_MODE;
}

const isLegacyLetter = character => /^[a-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]$/i.test(character ?? '');
let legacyAdapter;

function createLegacyAdapter() {
  const legacy = createProfanityFilter(PROFANITY_LIST);
  const patterns = new Map();
  for (const pattern of PROFANITY_LIST) {
    const { term, ruleClass } = classifyPattern(pattern);
    const key = `${ruleClass}:${term}`;
    if (!patterns.has(key)) patterns.set(key, []);
    patterns.get(key).push(pattern);
  }
  function checkDetailed(input) {
    // Keep the old detection result authoritative. This adapter only supplies
    // positions/requirements needed by the byte-preserving repair interface.
    const result = legacy.checkDetailed(input);
    const text = String(input).toLowerCase();
    const letters = [];
    for (let i = 0; i < text.length; i++) if (isLegacyLetter(text[i])) letters.push({ value: text[i], position: i });
    const flat = letters.map(c => c.value).join('');
    const occurrences = [];
    for (const term of new Set(result.matches)) {
      const boundary = !legacy.strongTerms.has(term);
      const ruleClass = boundary ? 'boundary' : 'strong';
      for (let from = 0; from <= flat.length;) {
        const at = flat.indexOf(term, from);
        if (at < 0) break;
        from = at + 1;
        const positions = letters.slice(at, at + term.length).map(c => c.position);
        const start = positions[0], end = positions.at(-1) + 1;
        if (boundary && (isLegacyLetter(text[start - 1]) || isLegacyLetter(text[end])
          || !containsBoundaryTerm(normalizeInput(text.slice(start, end)), term))) continue;
        const sourcePatterns = patterns.get(`${ruleClass}:${term}`);
        occurrences.push({
          id: `legacy:${ruleClass}:${term}`, term,
          pattern: sourcePatterns[0], patterns: sourcePatterns,
          type: boundary ? 'exact' : 'substring', legacyRuleClass: ruleClass,
          requiresLeftBoundary: boundary, requiresRightBoundary: boundary,
          positions, start, end,
          sources: [{ language: 'combined', version: 'legacy', path: 'src/data/profanity.gen3.js' }],
        });
      }
    }
    return { ...result, occurrences };
  }
  return Object.freeze({
    check: legacy.check, checkDetailed,
    isBoundary: character => !isLegacyLetter(character),
    isSkippable: character => !isLegacyLetter(character),
  });
}

export function getSwitchProfanityFilter(mode = DEFAULT_SWITCH_FILTER_MODE) {
  if (mode === 'current') return frlgProfanityFilter;
  if (mode !== 'legacy') throw new Error(`Unknown Switch filter mode: ${mode}`);
  return legacyAdapter ??= createLegacyAdapter();
}
