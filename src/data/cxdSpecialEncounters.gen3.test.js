import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  CXD_SPECIAL_ENCOUNTERS,
  CXD_SPECIAL_SPECIES,
  getCXDSpecialEncountersForSpecies,
} from './cxdSpecialEncounters.gen3.js';

assert.equal(CXD_SPECIAL_ENCOUNTERS.length, 21, 'all non-shadow Colosseum/XD encounter slots should be present');
assert.equal(new Set(CXD_SPECIAL_ENCOUNTERS.map(encounter => encounter.id)).size, 21, 'encounter IDs must be unique');
assert.equal(CXD_SPECIAL_ENCOUNTERS.filter(encounter => encounter.kind === 'starter').length, 3);
assert.equal(CXD_SPECIAL_ENCOUNTERS.filter(encounter => encounter.kind === 'pokespot').length, 9);
assert.equal(CXD_SPECIAL_ENCOUNTERS.filter(encounter => encounter.eReader).length, 3);

for (const encounter of CXD_SPECIAL_ENCOUNTERS) {
  assert.ok(Number(encounter.species) > 0, `${encounter.id} needs an internal species ID`);
  assert.ok(Number(encounter.level) > 0 && Number(encounter.level) <= 100, `${encounter.id} has an invalid level`);
  assert.ok(Array.isArray(encounter.moves) && encounter.moves.length > 0 && encounter.moves.length <= 4, `${encounter.id} needs one to four moves`);
  assert.ok(getCXDSpecialEncountersForSpecies(encounter.species).includes(encounter), `${encounter.id} is missing from reverse lookup`);
}

for (const encounter of CXD_SPECIAL_ENCOUNTERS.filter(value => value.eReader)) {
  assert.deepEqual(encounter.allowedLanguages, [1]);
  assert.deepEqual(encounter.fixedIVs, { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  assert.equal(encounter.nationalRibbon, true);
  assert.equal(encounter.pidType, 'CXD_EREADER');
  assert.ok(Number.isInteger(encounter.fixedNature) && encounter.fixedNature >= 0 && encounter.fixedNature < 25);
  assert.ok(['male', 'female'].includes(encounter.fixedGender));
  assert.equal(encounter.fixedAbility, 0);
}

for (const encounter of CXD_SPECIAL_ENCOUNTERS.filter(value => value.kind === 'pokespot')) {
  assert.equal(encounter.levelMin, 10, `${encounter.id} must start at Poké Spot level 10`);
  assert.equal(encounter.levelMax, encounter.level, `${encounter.id} maximum level must match its slot table`);
  assert.ok(encounter.levelMax >= encounter.levelMin, `${encounter.id} has an invalid Poké Spot level range`);
}

const randomShinyIds = new Set([
  'xd_starter_eevee',
  'xd_mt_battle_chikorita',
  'xd_mt_battle_cyndaquil',
  'xd_mt_battle_totodile',
  ...CXD_SPECIAL_ENCOUNTERS.filter(value => value.kind === 'pokespot').map(value => value.id),
]);
for (const encounter of CXD_SPECIAL_ENCOUNTERS.filter(value => randomShinyIds.has(value.id))) {
  assert.equal(encounter.shinyLocked, false, `${encounter.id} can legitimately be shiny`);
}
for (const id of ['colo_starter_espeon', 'colo_starter_umbreon']) {
  assert.equal(CXD_SPECIAL_ENCOUNTERS.find(value => value.id === id)?.shinyLocked, true, `${id} must remain shiny locked`);
}

assert.deepEqual(
  CXD_SPECIAL_ENCOUNTERS.filter(value => value.eReader).map(value => [value.id, value.fixedNature, value.fixedGender]),
  [
    ['colo_ereader_togepi', 22, 'female'],
    ['colo_ereader_mareep', 16, 'female'],
    ['colo_ereader_scizor', 11, 'male'],
  ],
  'e-Reader nature/gender locks must match the final PKHeX team lock',
);

assert.equal(CXD_SPECIAL_SPECIES.size, new Set(CXD_SPECIAL_ENCOUNTERS.map(encounter => encounter.species)).size);

const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');
assert.ok(
  mainSource.includes('levelMin: Number(selectedEnc?.levelMin ?? selectedEnc?.level'),
  'the PID Finder must pass the Poké Spot minimum level to the worker',
);
assert.ok(
  mainSource.includes('levelMax: Number(selectedEnc?.levelMax ?? selectedEnc?.level'),
  'the PID Finder must pass the Poké Spot maximum level to the worker',
);
assert.ok(
  mainSource.includes('const cxdAbility = hasSingleNormalGen3Ability(speciesId) ? 0 : ability'),
  'single-ability GameCube encounters must search legal ability number 0',
);
assert.ok(
  mainSource.includes('(policy.kind === SHINY_CONTROL_KIND.FINDER && canAutoSetGameCubeSid())'),
  'eligible GameCube encounters should allow Auto-Set only through the GameCube SID validator',
);
assert.ok(
  mainSource.includes('gameCubeSidResult = findValidGCShinySid(tid, pid);'),
  'GameCube Auto-Set must validate the selected TID/PID before applying an SID',
);
const acceptedAutoSidIndex = mainSource.indexOf('pidFinderOriginalSid = newSid;');
const dispatchedAutoSidIndex = mainSource.indexOf('setMainSidValue(newSid);', acceptedAutoSidIndex);
assert.ok(
  acceptedAutoSidIndex >= 0 && dispatchedAutoSidIndex > acceptedAutoSidIndex,
  'Auto-Set must accept the validated SID before its input event checks for manual ID changes',
);
assert.ok(
  mainSource.includes('_updatePidTidSidWarning = updatePidTidSidWarning;'),
  'the PID Finder must be able to refresh the trainer-ID warning after applying a result',
);
assert.ok(
  mainSource.includes("document.getElementById('pfShiny')"),
  'the legal PID window must keep an internal shiny-only search flag',
);
assert.ok(
  mainSource.includes('if (enc?.shinyLocked || trade?.shinyLocked)'),
  'shiny warnings must follow encounter policy instead of rejecting every XD encounter',
);

const indexSource = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
assert.ok(indexSource.includes('id="pfShinyKeepSid"'), 'the legal PID window must offer Keep SID');
assert.ok(indexSource.includes('id="pfShinyAutoSid"'), 'the legal PID window must expose Auto-Set SID where legal');
assert.ok(indexSource.includes('id="pfShinyLockedMessage"'), 'shiny-locked encounters must explain the lock inside the legal PID window');

console.log('special Colosseum/XD encounter tests passed');
