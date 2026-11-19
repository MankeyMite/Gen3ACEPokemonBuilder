# Nintendo Switch FRLG box-name filtering

The production matcher is `src/lib/frlgProfanityFilter.js`. The previous
heuristic implementation and combined PKHeX list remain available for comparison;
they are not used by default by the production warning UI or repair engine.

The new filter is the default whenever Nintendo Switch output is selected.
For troubleshooting, append `?switchFilter=legacy` to the builder URL (or
`&switchFilter=legacy` if it already has a query). This explicitly selects the
old detector for both warnings and repairs. A visible backup-mode notice links
back to the current filter. There is no automatic fallback: the known legacy
false positives/negatives must not silently override the new detector.

The legacy adapter adds match positions without changing the old detector's
predictions. Splitting, substitutions, borrowing, manual conversion, and the
80-byte safety checks still apply. Programmatic callers can request the backup
with `toBase64Emerald(bytes, { switchFilterMode: 'legacy' })`; omitting that option
always selects the new filter. The historical implementation remains unchanged.

## Data and profile

The initial target is Nintendo filter **version 70**, from
[`abcboy101/badword`](https://github.com/abcboy101/badword/tree/1a76c29d53f2f6e98c23b6849215e99801c4224b)
(GPL-3.0), pinned to commit `1a76c29d53f2f6e98c23b6849215e99801c4224b`.
The vendored source snapshot contains the original language-specific `b2` and
`not_b` text parses, their Git blob hashes, and the language index mapping.
Masking-only `b1` data and the optimized combined PKHeX file are not imported.

The generated module preserves all 19 source lists (5,500 distinct rejection
patterns). Its default profile selects **jja, een, pen, pfr, pde, pit, pes,
common**, yielding 2,677 patterns with per-language/version/path provenance.
That selection matches the reported LeafGreen tests with English system language
and European region. It is not claimed to apply to every game/system language.

Regenerate or verify the runtime module offline:

```sh
node scripts/build-frlg-profanity.mjs
node scripts/build-frlg-profanity.mjs --check
node scripts/compare-frlg-profanity.mjs
```

The generator verifies the vendored UTF-8 contents against the pinned Git blob
hashes. It merges identical rules' provenance; it does not eliminate narrower
rules based on other languages' broader patterns.

## Matching

Each literal independently requires a left boundary, a right boundary, both, or
neither. Word length never selects the rule type. Case, full-width alphanumerics,
and kana use Nintendo-style folding, preserving original UTF-16 positions.

Character processing has separate `skip` and `boundary` flags. The matcher finds
literal sequences across skippable characters but checks boundary flags at the
original positions immediately before and after the matched span. Therefore
`b3j` and `e3bj` are blocked, while `ebj`, `ab3j`, and `b3ja` are allowed.
`d1ck` becomes a sequence of `dck`, not `dick`: no digit-to-letter mapping occurs.
Dictionary digits remain literal, even when input processing makes those rules
unreachable in the default profile.

The default skip/boundary set contains decimal digits, `!`, `?`, spaces, and the
existing Base64 repair punctuation: period, comma, dash, slash, ellipsis, straight
and curly quotation marks, and gender symbols. The hardware corpus directly
supports only part of this set. Other digit/symbol combinations retain the
working hypothesis/previous separator behavior and need additional Switch tests.
Unknown characters are retained and are not automatically boundaries.

`checkDetailed` retains the existing `blocked` and term-string `matches` fields
for the warning UI. Its `occurrences` include the original pattern, literal,
type, source languages/version/paths, original character positions, start/end
offsets, and both boundary requirements. Repeated/overlapping occurrences are
preserved so repair never has to rediscover a match by its term alone.

## Configuration and exceptions

```js
import { createFrlgProfanityFilter, DEFAULT_FRLG_PROFILE } from '../src/lib/frlgProfanityFilter.js';

const filter = createFrlgProfanityFilter({
  profile: { version: 70, languages: [...DEFAULT_FRLG_PROFILE.languages, 'pnl'] },
  characterProperties: { '3': { skip: true, boundary: true } },
});
// For programmatic generation: toBase64Emerald(bytes, { profanityFilter: filter }).
```

The default instance is shared by production warnings and repairs. To change the
application-wide default after new hardware evidence, update `DEFAULT_FRLG_PROFILE`;
do not independently configure the warning UI and generator. Programmatic callers
using an injected filter should also use that filter to inspect their results.

Version 70's parsed allowlist files are absent upstream. The snapshot preserves
18 version 66 parses only after verifying that both corresponding raw version 70
trie blob hashes are identical. The Polish tries changed, so an old Polish
allowlist is not substituted. The generated module contains 48 allowlist literals.

**Allowlist overrides are disabled by default** because their application to
FRLG PC box names is not hardware-confirmed. `allowlistCandidates` exposes the
preserved entries without silently accepting a name. An explicit research option,
`allowlistMode: 'same-language-contained'`, suppresses only a matching source
language whose match lies inside an exception found before separator removal.
This option models a candidate behavior, not verified FRLG semantics; it is not
enabled by the production UI. Similar-form mappings such as `1 -> i` and species
name whitelisting are also not enabled without relevant box-name evidence.

## Automatic repair and byte preservation

The existing operation sequence remains: split and shift boxes, substitute
supported capitals with compensated symbols, borrow a previous box's trailing
letter, then apply requested manual box conversions. The original compensation
arithmetic is unchanged. Splits and substitutions use actual match positions.
Borrowing applies only to an occurrence that requires a left boundary.

Each proposed change is made on a copy. `inspectBase64Repair` requires exactly
14 boxes, no box longer than eight characters, and independently decodes the
continuous stream using the ACE writer's extended-symbol arithmetic. Every one
of the original 80 bytes must agree before a candidate is accepted. It rescans
all boxes, including a preceding box changed by compensation. Repeated candidate
layouts are rejected to avoid cycling.

The generator returns `repairComplete` and detailed `unresolvedMatches`. Failure
to find a repair never changes the Pokemon bytes or hides the remaining names:
the warning UI lists them. The bounded existing search is not a proof that no
possible encoding/layout exists; it reports what it could not repair.

## Verification and remaining hardware work

`src/lib/fixtures/frlgProfanity.hardware.js` records all 74 supplied results and
three earlier project observations separately from inferred unit-test cases.
The comparison script identifies the old matcher's 12 false positives and five
false negatives on the supplied corpus.

Run the new matcher/repair tests, the existing symbol tests, and the data check:

```sh
node src/lib/frlgProfanityFilter.test.js
node src/lib/gen3/builder.profanityRepair.test.js
node src/lib/gen3/builder.symbolSubstitution.test.js
node scripts/build-frlg-profanity.mjs --check
```

The complete JavaScript suite passed during implementation. The
new repair suite covers 278 byte-exact cases. The existing headless Chrome UI
harness now also checks all 74 hardware cases, automatic splitting, unresolved
warnings, console-mode warning visibility, and manual conversion/undo with an
80-byte comparison. Run it against the local server with:

```sh
node qa-server.cjs
# In another terminal:
node pkhex-validator/scripts/run-builder-ui.mjs http://127.0.0.1:8012/
```

Prioritize testing other internal digits, every substitution symbol in both
internal and boundary positions, allowlist candidates (`grape`, `iwashita`,
`kanal`, `killian`), and system-language changes. Version 70 is an evidence-based
initial target, not a claim that every source pattern is enforced by FRLG.
