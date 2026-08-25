import assert from 'node:assert/strict';
import {
  PROFILE_LIMIT,
  addRecentGeneration,
  createEmptyWorkspace,
  createWorkspaceBackup,
  importWorkspaceBackup,
  normalizeWorkspace,
  upsertProfile,
  upsertSaveIdentity,
} from './profileWorkspaceData.js';

let workspace = createEmptyWorkspace();
workspace = upsertProfile(workspace, { id: 'emerald-profile', name: 'Emerald', saves: [] });
workspace = upsertSaveIdentity(workspace, 'emerald-profile', {
  gameId: 3,
  gameLabel: 'Emerald',
  tid: 12345,
  sid: 54321,
  otName: 'MAY',
  otGender: 'female',
  languageId: 2,
});
assert.equal(workspace.activeProfileId, 'emerald-profile');
assert.deepEqual(workspace.profiles[0].saves[0], {
  id: 'save-3',
  gameId: 3,
  gameLabel: 'Emerald',
  tid: 12345,
  sid: 54321,
  otName: 'MAY',
  otGender: 'female',
  languageId: 2,
  createdAt: workspace.profiles[0].saves[0].createdAt,
  updatedAt: workspace.profiles[0].saves[0].updatedAt,
});

workspace = upsertSaveIdentity(workspace, 'emerald-profile', {
  gameId: 2,
  gameLabel: 'Ruby',
  tid: 70000,
  sid: 99999,
  otName: 'BRENDAN',
  otGender: 'male',
  languageId: 2,
});
assert.equal(workspace.profiles[0].saves.length, 1, 'a profile can contain only one game identity');
assert.equal(workspace.profiles[0].saves[0].gameId, 2);
assert.equal(workspace.profiles[0].saves[0].tid, 65535);
assert.equal(workspace.profiles[0].saves[0].sid, 65535);

const snapshot = {
  schemaVersion: 1,
  exact: { mode: 'static', uiState: { fields: { species: '1' } } },
  semantic: {
    speciesId: 1,
    encounter: { mode: 'static', staticCategoryId: 'starters' },
    pokemon: { nickname: 'BULBASAUR', evs: [0, 0, 0, 0, 0, 0] },
  },
  generated: { rawHex: 'AA'.repeat(80), base64Text: 'code', codeTarget: 'console' },
};
workspace = addRecentGeneration(workspace, {
  id: 'first',
  speciesName: 'Bulbasaur',
  categoryName: 'Static',
  encounterName: 'Starters',
  snapshot,
});
workspace = addRecentGeneration(workspace, {
  id: 'duplicate',
  speciesName: 'Bulbasaur',
  categoryName: 'Static',
  encounterName: 'Starters',
  snapshot,
});
assert.equal(workspace.recents.length, 1, 'consecutive identical generations should be deduplicated');
assert.equal(workspace.recents[0].id, 'first');

let cappedRecents = createEmptyWorkspace();
for (let index = 0; index < 35; index++) {
  cappedRecents = addRecentGeneration(cappedRecents, {
    id: `recent-${index}`,
    fingerprint: `fingerprint-${index}`,
    speciesName: `Pokémon ${index}`,
    categoryName: 'Static',
    encounterName: 'Legends',
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    snapshot,
  });
}
assert.equal(cappedRecents.recents.length, 30);
assert.equal(cappedRecents.recents[0].id, 'recent-34');
assert.equal(cappedRecents.recents.at(-1).id, 'recent-5', 'the oldest generation should be removed first');

const backup = createWorkspaceBackup(workspace);
backup.version = 99;
backup.workspace.recents[0].snapshot.futureExtension = { retained: true };
const restored = importWorkspaceBackup(JSON.parse(JSON.stringify(backup)));
assert.equal(restored.profiles[0].saves[0].otName, 'BRENDAN');
assert.equal(restored.recents[0].snapshot.semantic.pokemon.nickname, 'BULBASAUR');
assert.equal(restored.recents[0].snapshot.generated.rawHex.length, 160);
assert.deepEqual(restored.recents[0].snapshot.futureExtension, { retained: true });

const tooManyProfiles = normalizeWorkspace({
  profiles: Array.from({ length: PROFILE_LIMIT + 4 }, (_, index) => ({
    id: `profile-${index}`,
    name: `Profile ${index}`,
  })),
});
assert.equal(tooManyProfiles.profiles.length, PROFILE_LIMIT);

console.log('profileWorkspaceData tests passed');
