import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

const mewLockStart = mainSource.indexOf('function lockLanguageForMewLegend()');
const mewLockEnd = mainSource.indexOf('function updateLevelLocking()', mewLockStart);
assert.ok(mewLockStart >= 0 && mewLockEnd > mewLockStart);
const mewLockSource = mainSource.slice(mewLockStart, mewLockEnd);
assert.match(mewLockSource, /finally\s*\{\s*syncLanguageTextLimits\(\);\s*\}/);

const otInputStart = mainSource.indexOf("$('#otName').addEventListener('input'");
const otInputEnd = mainSource.indexOf("$('#otName').addEventListener('change'", otInputStart);
assert.ok(otInputStart >= 0 && otInputEnd > otInputStart);
assert.match(mainSource.slice(otInputStart, otInputEnd), /syncLanguageTextLimits\(\)/);

console.log('language text-limit UI integration tests passed');
