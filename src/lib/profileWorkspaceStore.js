import { createEmptyWorkspace, normalizeWorkspace } from '../domain/profileWorkspaceData.js';

const DB_NAME = 'gen3-ace-builder-workspace';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const STATE_KEY = 'current';
const FALLBACK_KEY = 'gen3AceBuilderWorkspaceFallback';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local workspace storage'));
  });
}

async function withStore(mode, operation) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      try {
        result = operation(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(result?.result);
      transaction.onerror = () => reject(transaction.error || result?.error || new Error('Local storage transaction failed'));
      transaction.onabort = () => reject(transaction.error || new Error('Local storage transaction was cancelled'));
    });
  } finally {
    db.close();
  }
}

function readFallback() {
  try {
    const raw = globalThis.localStorage?.getItem(FALLBACK_KEY);
    return raw ? normalizeWorkspace(JSON.parse(raw)) : createEmptyWorkspace();
  } catch (error) {
    return createEmptyWorkspace();
  }
}

function writeFallback(workspace) {
  globalThis.localStorage?.setItem(FALLBACK_KEY, JSON.stringify(workspace));
}

export async function loadProfileWorkspace() {
  try {
    const stored = await withStore('readonly', store => store.get(STATE_KEY));
    return normalizeWorkspace(stored || createEmptyWorkspace());
  } catch (error) {
    return readFallback();
  }
}

export async function saveProfileWorkspace(workspace) {
  const normalized = normalizeWorkspace(workspace);
  try {
    await withStore('readwrite', store => store.put(normalized, STATE_KEY));
  } catch (error) {
    writeFallback(normalized);
  }
  return normalized;
}
