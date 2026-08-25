import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8');

assert.match(mainSource, /function setConfirmNextStep\(active\)/);
assert.match(mainSource, /confirmBtn\.classList\.toggle\('is-next-step', Boolean\(active\)\)/);
assert.match(mainSource, /function selectResult[\s\S]*?setConfirmNextStep\(true\)/);
assert.match(mainSource, /window\.matchMedia\('\(max-width: 700px\)'\)\.matches/);
assert.match(mainSource, /confirmBtn\.scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
assert.match(
  mainSource,
  /if \(currentEncounterMode === 'wild'\)[\s\S]*?setControlLockState\(metLocationEl, true\)[\s\S]*?pidFinderLocationLock/,
  'confirming a wild PID Finder result must lock its met location',
);
assert.match(
  mainSource,
  /activeSearchMetLocationId = currentEncounterMode === 'wild'[\s\S]*?searchMetLocationId: activeSearchMetLocationId[\s\S]*?metLocationEl\.value = String\(searchedLocationId\)/,
  'the confirmed result must restore and lock the exact met location used by its wild search',
);
assert.match(
  mainSource,
  /const pidFinderWildLock = !manualOverrideActive[\s\S]*?currentEncounterMode === 'wild' && pidFinderResultActive/,
  'later legality refreshes must preserve the active wild PID met-location lock',
);
assert.match(
  mainSource,
  /delete metLocationEl\.dataset\.pidFinderLocationLock[\s\S]*?updateBallLocking\(\)/,
  'clearing a PID Finder result must release and recalculate its met-location lock',
);
assert.match(styles, /#pfConfirm\.is-next-step[\s\S]*?var\(--emerald\)/);
assert.match(styles, /\.profile-drawer-backdrop:hover,[\s\S]*?background:\s*rgba\(1, 8, 17, 0\.64\)[\s\S]*?transform:\s*none/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);

console.log('PID Finder confirm-flow tests passed');
