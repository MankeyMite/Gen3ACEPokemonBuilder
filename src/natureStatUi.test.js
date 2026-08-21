import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(mainSource, /const baseBarColor = getStatBarColor\(base\);/);
assert.match(mainSource, /const powerBarColor = getStatBarColor\(powerValue\);/);
assert.match(mainSource, /--stat-base-bar-color/);
assert.match(mainSource, /--stat-power-bar-color/);
assert.match(html, /var\(--stat-base-bar-color,/);
assert.match(html, /var\(--stat-power-bar-color,/);

for (const id of ['contestCool', 'contestBeauty', 'contestCute', 'contestSmart', 'contestTough']) {
  assert.match(html, new RegExp(`id="${id}"[^>]*value="0"`));
  assert.match(mainSource, new RegExp(`${id}: '0'`));
}

console.log('nature stat UI tests passed');
