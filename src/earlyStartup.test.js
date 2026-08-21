import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const startupSource = await readFile(new URL('./earlyStartup.js', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(html, /<script type="module" src="\.\/src\/earlyStartup\.js"><\/script>/);
assert.doesNotMatch(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
assert.match(startupSource, /import \{ SPECIES \} from '\.\/data\/species\.gen3\.js'/);
assert.match(startupSource, /builderPromise = import\('\.\/main\.js'\)/);
assert.match(startupSource, /requestAnimationFrame\(\(\) => window\.requestAnimationFrame\(scheduleBuilderLoad\)\)/);
assert.match(startupSource, /wrapper\.dataset\.earlySelectedId = selectedId/);
assert.match(startupSource, /window\.__aceEarlySpeciesState = \{ selectedId, query: item\.name \}/);
assert.match(mainSource, /const startupSpeciesId = String\(/);
assert.match(mainSource, /earlySpeciesState\.selectedId/);
assert.match(mainSource, /speciesAutocomplete\?\.selectById\?\.\(startupSpeciesId\)/);
assert.match(mainSource, /upgradedInput\.value = startupSpeciesQuery/);

console.log('early startup tests passed');
