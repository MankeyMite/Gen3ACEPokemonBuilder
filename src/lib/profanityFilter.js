/**
 * Hybrid Nintendo Switch Profanity Filter
 *
 * This filter models the observed behavior of the real Nintendo Switch
 * profanity check more accurately than a simple "ban any substring" regex.
 *
 * Rule classes:
 *
 *   1. BOUNDARY-ONLY terms (exact_or_boundary_only_terms)
 *      - Banned when the term appears as an isolated token, i.e. NOT embedded
 *        inside a larger all-letter run.
 *      - "ass"  → banned  (standalone)
 *      - "12ass34" → banned  (digits are non-letter boundaries)
 *      - "a s s" → banned  (space-separated letters recombine to "ass")
 *      - "mass"  → allowed  (embedded inside a longer letter run)
 *      - "xassx" → allowed  (embedded inside a longer letter run)
 *
 *   2. STRONG SUBSTRING terms (strong_substring_terms)
 *      - Banned whenever the term appears anywhere, EVEN inside a larger
 *        all-letter token.
 *      - "fag"  → banned
 *      - "xfagx" → banned  (still contains "fag")
 *      - "shit"  → banned
 *      - "xshit" → banned
 *
 * Normalization:
 *   - Input is lowercased.
 *   - Letters (a-z, plus Unicode letters) and digits (0-9) are preserved.
 *   - Separators (spaces, hyphens, periods, commas, !, ?, quotes, ellipsis,
 *     ♂, ♀) are treated as boundaries and removed before token analysis.
 *   - Digits are ignored for matching (treated like nothing), so letters
 *     on either side are evaluated as one run.
 *
 * Migration from PKHeX:
 *   The original PKHeX badwords_switch.txt patterns are preserved in
 *   profanity.gen3.js. This module reads those patterns and applies a default
 *   classification heuristic:
 *     - PKHeX exact-match patterns (^word$) → boundary-only
 *     - PKHeX substring patterns (.*word.*) → depends on term length and
 *       manual overrides
 *     - Terms ≤ 3 letters default to boundary-only (conservative)
 *     - Known strong slurs are manually promoted to strong-substring
 *   The classification can be overridden per-term via the manual lists below.
 */

// ─── SEPARATOR CHARACTERS ──────────────────────────────────────────────
// Characters that act as word boundaries (stripped during normalization).
const SEPARATOR_RE = /[\s\-.,!?'"''""…♂♀`~@#$%^&*()_+={}[\]|\\:;<>/]+/g;

// ─── MANUAL CLASSIFICATION ─────────────────────────────────────────────
// Add terms here to explicitly control their rule class, overriding
// the automatic heuristic. All terms must be lowercase.

/**
 * Terms that should ONLY be banned at boundaries (not inside larger words).
 * Typically short or ambiguous terms that appear in normal words.
 */
const MANUAL_BOUNDARY_ONLY = new Set([
  'ass',
  'sa',
  'ho',
  'cum',
  'tit',
  'nob',
  'cox',
  'cok',
  'pis',
  'pee',
  'pad',
  'gai',
  'git',
  'hoe',
  'hor',
]);

/**
 * Terms that should ALWAYS be banned, even inside larger letter tokens.
 * Strong slurs, severe profanity, etc.
 */
const MANUAL_STRONG_SUBSTRING = new Set([
  'fag',
  'shit',
  'fuck',
  'cunt',
  'dick',
  'cock',
  'nigga',
  'nigger',
  'niger',
  'niga',
  'nigg',
  'porn',
  'rape',
  'nazi',
  'penis',
  'vagina',
  'bitch',
  'whore',
  'slut',
  'wank',
]);

// ─── NORMALIZATION ─────────────────────────────────────────────────────

/**
 * Normalize input: lowercase, strip separators (replaced with a boundary
 * marker \x00), preserve letters and digits.
 *
 * @param {string} str - raw input string
 * @returns {string} normalized string where separators become \x00
 */
export function normalizeInput(str) {
  return str
    .toLowerCase()
    .replace(SEPARATOR_RE, '\x00');     // mark separator positions
}

/**
 * Split a normalized string into "letter tokens" — contiguous runs of
 * letters (a-z / Unicode) — separated by non-letter characters (digits,
 * boundary markers, etc.).
 *
 * Examples:
 *   "ass"      → ["ass"]
 *   "12ass34"  → ["ass"]         (digits are boundaries)
 *   "wi8x"     → ["wix"]         (digits are ignored)
 *   "xassx"    → ["xassx"]      (all letters = one token)
 *   "a\x00s\x00s" → ["a","s","s"]  (separators split tokens)
 *
 * @param {string} normalized - output of normalizeInput()
 * @returns {string[]} array of letter-only tokens (lowercase)
 */
export function splitIntoLetterTokens(normalized) {
  // Ignore digits so letter runs remain contiguous (e.g. "wi8x" -> "wix").
  const digitsRemoved = normalized.replace(/[0-9]+/g, '');
  // Match runs of Unicode letters
  const tokens = digitsRemoved.match(/[a-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]+/gi);
  return tokens ? tokens.map(t => t.toLowerCase()) : [];
}

/**
 * Check whether a boundary-only term is present in the input.
 *
 * A boundary-only term matches when:
 *   - A letter token exactly equals the term, OR
 *   - Consecutive single-character tokens spell out the term (separator bypass)
 *
 * It does NOT match when the term is a substring of a longer letter token.
 *
 * @param {string} normalized - output of normalizeInput()
 * @param {string} term - lowercase term to search for
 * @returns {boolean}
 */
export function containsBoundaryTerm(normalized, term) {
  const tokens = splitIntoLetterTokens(normalized);

  // Direct exact-token match
  for (const token of tokens) {
    if (token === term) return true;
  }

  // Check for separator-bypassed spelling: consecutive single-char tokens
  // that together spell the term (e.g. "a\x00s\x00s" → "a","s","s" → "ass")
  if (term.length > 1) {
    const singles = [];
    for (const token of tokens) {
      if (token.length === 1) {
        singles.push(token);
      } else {
        // Check accumulated singles before resetting
        if (singles.length >= term.length) {
          const joined = singles.join('');
          if (joined.includes(term)) return true;
        }
        singles.length = 0;
      }
    }
    // Check remaining singles
    if (singles.length >= term.length) {
      const joined = singles.join('');
      if (joined.includes(term)) return true;
    }
  }

  return false;
}

/**
 * Check whether a strong-substring term is present in the input.
 *
 * This matches the term ANYWHERE in the letter content of the input,
 * even inside a larger all-letter token.
 *
 * Separators are stripped first so "s.h.i.t" still matches "shit".
 *
 * @param {string} normalized - output of normalizeInput()
 * @param {string} term - lowercase term to search for
 * @returns {boolean}
 */
export function containsStrongSubstring(normalized, term) {
  // Strip all non-letter characters and check for substring
  const lettersOnly = normalized.replace(/[^a-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/gi, '');
  return lettersOnly.includes(term);
}

// ─── MIGRATION LAYER ───────────────────────────────────────────────────

/**
 * Extract the core term from a PKHeX regex pattern.
 *
 * Strips anchors (^, $) and wildcard wrappers (.*, .*) and common
 * regex escapes to get the plain-text term.
 *
 * @param {string} pattern - raw PKHeX pattern like ".*shit.*" or "^ass$"
 * @returns {{ term: string, type: 'exact'|'substring'|'prefix'|'suffix'|'other' }}
 */
export function parsePkhexPattern(pattern) {
  let type = 'other';
  const isSubstring = pattern.startsWith('.*') && pattern.endsWith('.*');
  const isExact = pattern.startsWith('^') && pattern.endsWith('$') && !pattern.includes('.*');
  const isPrefix = pattern.startsWith('^') && pattern.endsWith('.*');
  const isSuffix = pattern.startsWith('.*') && pattern.endsWith('$') && !isSubstring;

  if (isExact) type = 'exact';
  else if (isSubstring) type = 'substring';
  else if (isPrefix) type = 'prefix';
  else if (isSuffix) type = 'suffix';

  // Strip wrappers to get the core term
  let term = pattern;
  term = term.replace(/^\.\*/, '').replace(/\.\*$/, '');
  term = term.replace(/^\^/, '').replace(/\$$/, '');
  // Unescape common regex escapes
  term = term.replace(/\\\$/g, '$').replace(/\\\./g, '.').replace(/\\\\/g, '\\');
  term = term.toLowerCase();

  return { term, type };
}

/**
 * Classify a PKHeX pattern into a rule class using the default heuristic
 * plus manual overrides.
 *
 * Heuristic:
 *   - If manually listed in MANUAL_STRONG_SUBSTRING → 'strong'
 *   - If manually listed in MANUAL_BOUNDARY_ONLY → 'boundary'
 *   - If PKHeX type is 'exact' → 'boundary'
 *   - If PKHeX type is 'substring' and term length ≤ 3 → 'boundary'
 *   - If PKHeX type is 'substring' and term length > 3 → 'strong'
 *   - prefix / suffix / other → 'strong' (conservative)
 *
 * @param {string} pattern - raw PKHeX pattern
 * @returns {{ term: string, ruleClass: 'boundary'|'strong', pkhexType: string }}
 */
export function classifyPattern(pattern) {
  const { term, type } = parsePkhexPattern(pattern);

  // Manual overrides take highest priority
  if (MANUAL_STRONG_SUBSTRING.has(term)) {
    return { term, ruleClass: 'strong', pkhexType: type };
  }
  if (MANUAL_BOUNDARY_ONLY.has(term)) {
    return { term, ruleClass: 'boundary', pkhexType: type };
  }

  // Automatic heuristic
  let ruleClass;
  if (type === 'exact') {
    ruleClass = 'boundary';
  } else if (type === 'substring' && term.length <= 3) {
    ruleClass = 'boundary';
  } else {
    ruleClass = 'strong';
  }

  return { term, ruleClass, pkhexType: type };
}

/**
 * Build the filter term sets from the PKHeX PROFANITY_LIST.
 *
 * @param {string[]} pkhexPatterns - array from PROFANITY_LIST
 * @returns {{ boundaryTerms: Set<string>, strongTerms: Set<string> }}
 */
export function buildFilterSets(pkhexPatterns) {
  const boundaryTerms = new Set();
  const strongTerms = new Set();

  for (const pattern of pkhexPatterns) {
    const { term, ruleClass } = classifyPattern(pattern);
    if (!term) continue;
    if (ruleClass === 'boundary') {
      boundaryTerms.add(term);
    } else {
      strongTerms.add(term);
    }
  }

  return { boundaryTerms, strongTerms };
}

// ─── MAIN FILTER ───────────────────────────────────────────────────────

/**
 * Create a profanity checker from the PKHeX pattern list.
 *
 * Returns a function `check(input) → boolean` that returns true if the
 * input string triggers the profanity filter.
 *
 * @param {string[]} pkhexPatterns - array from PROFANITY_LIST
 * @returns {{ check: (input: string) => boolean, checkDetailed: (input: string) => { blocked: boolean, matches: string[] } }}
 */
export function createProfanityFilter(pkhexPatterns) {
  const { boundaryTerms, strongTerms } = buildFilterSets(pkhexPatterns);

  /**
   * Check an input string for profanity.
   * @param {string} input - the string to check (e.g. a box name)
   * @returns {boolean} true if profanity detected
   */
  function check(input) {
    const normalized = normalizeInput(input);

    // Check strong substring terms first (more restrictive)
    for (const term of strongTerms) {
      if (containsStrongSubstring(normalized, term)) return true;
    }

    // Check boundary-only terms
    for (const term of boundaryTerms) {
      if (containsBoundaryTerm(normalized, term)) return true;
    }

    return false;
  }

  /**
   * Check with detailed match info (for UI display).
   * @param {string} input
   * @returns {{ blocked: boolean, matches: string[] }}
   */
  function checkDetailed(input) {
    const normalized = normalizeInput(input);
    const matches = [];

    for (const term of strongTerms) {
      if (containsStrongSubstring(normalized, term)) {
        matches.push(term);
      }
    }

    for (const term of boundaryTerms) {
      if (containsBoundaryTerm(normalized, term)) {
        matches.push(term);
      }
    }

    return { blocked: matches.length > 0, matches };
  }

  return { check, checkDetailed, boundaryTerms, strongTerms };
}
