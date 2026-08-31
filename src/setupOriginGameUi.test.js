import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(html, /id="setupOriginGameRow" hidden>[\s\S]*?<label for="setupOriginGame">Game<\/label>[\s\S]*?id="setupOriginGame"/);
assert.match(html, /body\.encounter-hatched #setupOriginGameRow,[\s\S]*?body\.encounter-wild #setupOriginGameRow/);
assert.match(html, /body\.encounter-hatched #originGameDetailRow,[\s\S]*?body\.encounter-wild #originGameDetailRow/);

assert.match(mainSource, /const SETUP_ORIGIN_GAME_IDS = \[1, 2, 3, 4, 5\]/);
assert.match(mainSource, /const HATCHED_RSE_DEFAULT_MET_LOCATION_ID = 9/);
assert.match(mainSource, /const HATCHED_FRLG_DEFAULT_MET_LOCATION_ID = 146/);
assert.match(mainSource, /function getHatchedDefaultMetLocationId\(originGame\)[\s\S]*?\[4, 5\]\.includes/);
assert.match(mainSource, /function syncSetupOriginGameSelector\(\)/);
assert.match(mainSource, /function setProfileEncounterDefaultGameFromSetup\(gameId\)/);
assert.match(mainSource, /setProfileEncounterDefaultGameFromSetup\(gameId\);[\s\S]*?originGameSelect\.dispatchEvent\(new Event\('change'/);
assert.match(mainSource, /currentEncounterMode === 'hatched'[\s\S]*?applyHatchedOriginGameDefaults\(newGame\)/);

console.log('setup origin-game UI tests passed');
