export const WORKSPACE_FORMAT = 'gen3-ace-builder-workspace';
export const WORKSPACE_SCHEMA_VERSION = 1;
export const BUILDER_SNAPSHOT_SCHEMA_VERSION = 1;
export const PROFILE_LIMIT = 10;
export const RECENT_GENERATION_LIMIT = 30;

const VALID_OT_GENDERS = new Set(['male', 'female']);

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function integer(value, fallback = 0, min = 0, max = 65535) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function timestamp(value, fallback = new Date().toISOString()) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function fallbackId(prefix = 'item') {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function createEmptyWorkspace() {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    activeProfileId: null,
    profiles: [],
    recents: [],
  };
}

export function normalizeSaveIdentity(value = {}, fallbackGameLabel = '') {
  const gameId = integer(value.gameId, 0, 0, 255);
  if (!gameId) return null;
  const now = new Date().toISOString();
  return {
    ...value,
    id: text(value.id, `save-${gameId}`),
    gameId,
    gameLabel: text(value.gameLabel, fallbackGameLabel || `Game ${gameId}`),
    tid: integer(value.tid),
    sid: integer(value.sid),
    otName: String(value.otName ?? '').trim(),
    otGender: VALID_OT_GENDERS.has(String(value.otGender)) ? String(value.otGender) : 'male',
    languageId: integer(value.languageId, 2, 1, 7),
    createdAt: timestamp(value.createdAt, now),
    updatedAt: timestamp(value.updatedAt, now),
  };
}

export function normalizeProfile(value = {}) {
  const now = new Date().toISOString();
  let saveIdentity = null;
  for (const rawSave of Array.isArray(value.saves) ? value.saves : []) {
    const save = normalizeSaveIdentity(rawSave);
    if (save) {
      saveIdentity = save;
      break;
    }
  }
  return {
    ...value,
    id: text(value.id, fallbackId('profile')),
    name: text(value.name, 'Trainer profile').slice(0, 40),
    saves: saveIdentity ? [saveIdentity] : [],
    createdAt: timestamp(value.createdAt, now),
    updatedAt: timestamp(value.updatedAt, now),
  };
}

export function normalizeBuilderSnapshot(value = {}) {
  const schemaVersion = integer(value.schemaVersion, BUILDER_SNAPSHOT_SCHEMA_VERSION, 1, Number.MAX_SAFE_INTEGER);
  return {
    ...value,
    schemaVersion,
    exact: value.exact && typeof value.exact === 'object' ? value.exact : null,
    semantic: value.semantic && typeof value.semantic === 'object' ? value.semantic : null,
    generated: value.generated && typeof value.generated === 'object' ? value.generated : null,
  };
}

export function getRecentFingerprint(value = {}) {
  const explicit = text(value.fingerprint);
  if (explicit) return explicit;
  const snapshot = normalizeBuilderSnapshot(value.snapshot || {});
  const stable = {
    semantic: snapshot.semantic,
    rawHex: text(snapshot.generated?.rawHex).toUpperCase(),
    codeTarget: text(snapshot.generated?.codeTarget, 'console'),
  };
  return JSON.stringify(stable);
}

export function normalizeRecentGeneration(value = {}) {
  const now = new Date().toISOString();
  const snapshot = normalizeBuilderSnapshot(value.snapshot || {});
  const speciesName = text(value.speciesName, 'Pokémon');
  const categoryName = text(value.categoryName, 'Encounter');
  const encounterName = text(value.encounterName, categoryName);
  return {
    ...value,
    id: text(value.id, fallbackId('recent')),
    title: text(value.title, `${speciesName}_${categoryName}_${encounterName}`),
    speciesName,
    categoryName,
    encounterName,
    profileId: text(value.profileId) || null,
    pinned: Boolean(value.pinned),
    fingerprint: getRecentFingerprint({ ...value, snapshot }),
    snapshot,
    createdAt: timestamp(value.createdAt, now),
    updatedAt: timestamp(value.updatedAt, now),
  };
}

function trimRecents(recents, limit = RECENT_GENERATION_LIMIT) {
  const sorted = [...recents].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return sorted.slice(0, limit);
}

export function normalizeWorkspace(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : [])
    .map(normalizeProfile)
    .slice(0, PROFILE_LIMIT);
  const profileIds = new Set(profiles.map(profile => profile.id));
  const recents = trimRecents((Array.isArray(raw.recents) ? raw.recents : []).map(normalizeRecentGeneration));
  const requestedActiveId = text(raw.activeProfileId);
  return {
    ...raw,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    activeProfileId: profileIds.has(requestedActiveId) ? requestedActiveId : (profiles[0]?.id || null),
    profiles,
    recents,
  };
}

export function upsertProfile(workspace, profile) {
  const next = normalizeWorkspace(workspace);
  const normalized = normalizeProfile(profile);
  const existingIndex = next.profiles.findIndex(item => item.id === normalized.id);
  if (existingIndex >= 0) {
    next.profiles[existingIndex] = normalized;
  } else {
    if (next.profiles.length >= PROFILE_LIMIT) throw new Error(`You can save up to ${PROFILE_LIMIT} profiles.`);
    next.profiles.push(normalized);
  }
  next.activeProfileId = normalized.id;
  return normalizeWorkspace(next);
}

export function removeProfile(workspace, profileId) {
  const next = normalizeWorkspace(workspace);
  next.profiles = next.profiles.filter(profile => profile.id !== profileId);
  if (next.activeProfileId === profileId) next.activeProfileId = next.profiles[0]?.id || null;
  return normalizeWorkspace(next);
}

export function upsertSaveIdentity(workspace, profileId, identity) {
  const next = normalizeWorkspace(workspace);
  const profile = next.profiles.find(item => item.id === profileId);
  if (!profile) throw new Error('Choose a profile first.');
  const save = normalizeSaveIdentity(identity);
  if (!save) throw new Error('Choose an origin game.');
  profile.saves = [save];
  profile.updatedAt = new Date().toISOString();
  return normalizeWorkspace(next);
}

export function addRecentGeneration(workspace, generation) {
  const next = normalizeWorkspace(workspace);
  const normalized = normalizeRecentGeneration(generation);
  const latest = next.recents[0];
  if (latest && latest.fingerprint === normalized.fingerprint) {
    next.recents[0] = {
      ...normalized,
      id: latest.id,
      pinned: latest.pinned,
      createdAt: latest.createdAt,
    };
  } else {
    next.recents.unshift(normalized);
  }
  next.recents = trimRecents(next.recents);
  return normalizeWorkspace(next);
}

export function createWorkspaceBackup(workspace) {
  return {
    format: WORKSPACE_FORMAT,
    version: WORKSPACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: normalizeWorkspace(workspace),
  };
}

export function importWorkspaceBackup(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('That file is not a workspace backup.');
  if (payload.format && payload.format !== WORKSPACE_FORMAT) throw new Error('That file belongs to a different app.');

  // Version 1 uses a workspace envelope. Pre-release backups stored the same
  // collections at the root, so accept both. Unknown future fields are kept by
  // the normalizers while current stable profile and semantic snapshot fields
  // remain usable.
  const source = payload.workspace && typeof payload.workspace === 'object'
    ? payload.workspace
    : payload;
  return normalizeWorkspace(source);
}
