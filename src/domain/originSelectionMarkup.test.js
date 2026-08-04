import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');

const speciesIndex = html.indexOf('id="species"');
const originIndex = html.indexOf('id="pokemonOrigin"');
const mysteryIndex = html.indexOf('id="mysteryEvent"');
const staticIndex = html.indexOf('id="staticEncounter"');
const shadowIndex = html.indexOf('id="shadowEncounter"');

assert.ok(speciesIndex >= 0, 'Pokémon selector should exist');
assert.ok(originIndex > speciesIndex, 'Origin selector should follow Pokémon');
assert.ok(mysteryIndex > originIndex, 'Mystery exact selector should follow Origin');
assert.ok(staticIndex > originIndex, 'Static exact selector should follow Origin');
assert.ok(shadowIndex > originIndex, 'GameCube exact selector should follow Origin');

assert.match(html, /How was this Pokémon obtained\?/);
assert.match(html, /<label for="mysteryEvent">Distribution<\/label>/);
assert.match(html, /<label for="staticEncounter">Encounter<\/label>/);
assert.match(html, /<label for="shadowEncounter">Trainer \/ Location<\/label>/);
assert.match(html, /class="internal-builder-control" id="encounterModeToggle"/);
assert.match(html, /<select id="staticCategory" tabindex="-1"><\/select>/);
assert.match(html, /<select id="cxdTradeEncounter" tabindex="-1"><\/select>/);
assert.match(html, /\.internal-builder-control,[\s\S]*?display:\s*none\s*!important;/);
assert.match(html, /\.row\.builder-origin-row\s*\{[\s\S]*?display:\s*block;/);
assert.match(html, /#pokemonOrigin\s*\{[\s\S]*?width:\s*min\(100%,\s*240px\);/);
assert.match(html, /<body class="builder-setup-pending">/);
assert.match(html, /id="builderSetupStage"/);
assert.match(html, /id="builderSetupGuidance"[^>]*aria-live="polite"/);
assert.match(html, /class="row builder-species-row"/);
assert.match(html, /class="builder-species-control"/);
assert.match(html, /class="row builder-exact-row show-when-mystery" id="mysteryEventRow"/);
assert.match(html, /class="row builder-exact-row show-when-static" id="staticEncounterRow"/);
assert.match(html, /class="row builder-exact-row show-when-cxd" id="shadowEncounterRow"/);
assert.match(html, /body\.encounter-mystery #mysteryEventRow,[\s\S]*?body\.encounter-static #staticEncounterRow,[\s\S]*?flex-direction:\s*column;/);
assert.match(html, /<section class="card" id="builderDetailsCard"/);
assert.match(html, /body\.builder-setup-pending #builderDetailsCard/);
assert.match(html, /body\.builder-setup-pending #outputCard/);
assert.match(html, /<option value="" selected>Unresolved<\/option>/);

assert.match(mainSource, /function syncBuilderProgressiveDisclosure\(/);
assert.match(mainSource, /document\.body\.classList\.toggle\('builder-setup-pending', !resolved\)/);
assert.match(mainSource, /const hasResolvedOrigin = hasResolvedOriginSelection\(\);\s*syncBuilderProgressiveDisclosure\(hasResolvedOrigin\);/);

console.log('origin selection markup tests passed');
