import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(html, /id="randomizeIvsBtn"[^>]*aria-label="Randomize IVs"[^>]*title="Randomize IVs"/);
assert.match(html, /body\.encounter-hatched \.iv-randomize-btn[\s\S]*?display: grid/);
assert.match(html, /<svg class="iv-randomize-die" viewBox="0 0 12 12" width="12" height="12"/);
const dieSvg = html.match(/<svg class="iv-randomize-die"[\s\S]*?<\/svg>/)?.[0] || '';
assert.equal((dieSvg.match(/<circle /g) || []).length, 5, 'the IV dice has five pips');
assert.deepEqual(
  Array.from(dieSvg.matchAll(/<circle[^>]* r="([^"]+)"/g), match => match[1]),
  ['1.25', '1.25', '1.25', '1.25', '1.25'],
  'every pip has the same radius',
);
assert.match(mainSource, /levelInput\.value = String\(getHatchedLevelFloor\(speciesId\)\)/);
assert.match(mainSource, /function randomizeHatchedIvs\(\)[\s\S]*?currentEncounterMode !== 'hatched'[\s\S]*?Math\.floor\(Math\.random\(\) \* 32\)/);
assert.match(mainSource, /#randomizeIvsBtn'\)\?\.addEventListener\('click', randomizeHatchedIvs\)/);

console.log('hatched IV UI tests passed');
