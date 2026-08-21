import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8');

assert.match(mainSource, /function setConfirmNextStep\(active\)/);
assert.match(mainSource, /confirmBtn\.classList\.toggle\('is-next-step', Boolean\(active\)\)/);
assert.match(mainSource, /function selectResult[\s\S]*?setConfirmNextStep\(true\)/);
assert.match(mainSource, /window\.matchMedia\('\(max-width: 700px\)'\)\.matches/);
assert.match(mainSource, /confirmBtn\.scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
assert.match(styles, /#pfConfirm\.is-next-step[\s\S]*?var\(--emerald\)/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);

console.log('PID Finder confirm-flow tests passed');
