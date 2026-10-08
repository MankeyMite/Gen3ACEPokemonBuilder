import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(
  mainSource,
  /function requiresPidFinderResultForWildOrStatic\(\) \{\s*return currentEncounterMode === 'wild' \|\| currentEncounterMode === 'static';\s*\}/,
  'only Wild and Static modes should receive this universal Finder requirement',
);
assert.match(
  mainSource,
  /function hasRequiredPidFinderResultForWildOrStatic\(\) \{\s*return !requiresPidFinderResultForWildOrStatic\(\) \|\| pidFinderResultActive;\s*\}/,
  'a confirmed Finder result, not a preset PID, must unlock Wild and Static generation',
);
assert.match(
  mainSource,
  /markMissing\('Set Legal PID\/Shiny and select a result', pidFinderBtn\)/,
  'validation should point users to the required Finder action',
);
assert.match(mainSource, /const hasRequiredWildStaticPid = hasRequiredPidFinderResultForWildOrStatic\(\)/);
assert.match(
  mainSource,
  /const canGenerate = [^;]*hasRequiredWildStaticPid[^;]*;\s*generateBtn\.setAttribute\('data-disabled', String\(!canGenerate\)\);\s*\/\/ Keep the greyed visual state clickable[\s\S]*?generateBtn\.setAttribute\('aria-disabled', String\(!canGenerate\)\);/,
  'Generate must stay visually disabled while remaining clickable for missing-field navigation',
);
assert.match(
  mainSource,
  /generateBtn\.title = !hasRequiredWildStaticPid\s*\? 'Use Set Legal PID\/Shiny and confirm a result before generating a wild or static encounter\.'\s*: '';/,
  'the disabled Generate button should explain the required Finder action',
);
assert.match(
  mainSource,
  /if \(!hasRequiredPidFinderResultForWildOrStatic\(\)\) \{\s*errors\.push\('Use Set Legal PID\/Shiny and confirm a result before generating a wild or static encounter'\);\s*\}/,
  'the legality panel should explain the disabled Generate button',
);
assert.match(
  mainSource,
  /if \(!hasRequiredPidFinderResultForWildOrStatic\(\)\) \{\s*highlightMissingFields\(\);\s*return;\s*\}/,
  'direct programmatic generation must remain blocked too',
);
assert.match(
  mainSource,
  /if \(\$\('#generateBtn'\)\.getAttribute\('data-disabled'\) === 'true'\) \{\s*highlightMissingFields\(\);\s*return;\s*\}/,
  'clicking the grey Generate button must still mark and scroll to the first missing field',
);
assert.doesNotMatch(mainSource, /generateBtn\.disabled\s*=/);
assert.match(html, /<button id="generateBtn" type="button" data-disabled="true" aria-disabled="true">Generate<\/button>/);

console.log('wild/static PID Finder requirement tests passed');
