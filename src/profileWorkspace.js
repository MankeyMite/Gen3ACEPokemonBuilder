import {
  PROFILE_LIMIT,
  addRecentGeneration,
  createWorkspaceBackup,
  importWorkspaceBackup,
  normalizeProfile,
  removeProfile,
  upsertProfile,
  upsertSaveIdentity,
} from './domain/profileWorkspaceData.js';
import { loadProfileWorkspace, saveProfileWorkspace } from './lib/profileWorkspaceStore.js';

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function setOptions(select, options, selectedValue) {
  select.innerHTML = '';
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = String(optionData.value);
    option.textContent = String(optionData.label);
    select.appendChild(option);
  }
  if (selectedValue != null) select.value = String(selectedValue);
}

function safeFileName(value) {
  return String(value || 'trainer-workspace').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'trainer-workspace';
}

function createShell() {
  const root = document.createElement('div');
  root.id = 'profileWorkspaceRoot';
  root.innerHTML = `
    <button id="profileDrawerToggle" class="profile-drawer-toggle" type="button" aria-label="Open builder tools" aria-controls="profileDrawer" aria-expanded="false">
      <span class="profile-drawer-toggle-icon" aria-hidden="true">☰</span>
      <span class="profile-drawer-toggle-label">Tools</span>
      <span class="profile-drawer-toggle-arrow" aria-hidden="true">›</span>
      <span class="profile-drawer-toggle-mobile-icon" aria-hidden="true">&vellip;</span>
    </button>
    <button id="profileDrawerBackdrop" class="profile-drawer-backdrop" type="button" aria-label="Close builder tools" hidden></button>
    <aside id="profileDrawer" class="profile-drawer" aria-label="Builder tools" aria-hidden="true">
      <div class="profile-drawer-header">
        <h2>Builder tools</h2>
        <button id="profileDrawerClose" class="profile-drawer-close" type="button" aria-label="Close builder tools">×</button>
      </div>
      <div id="profileWorkspaceStatus" class="profile-workspace-status" role="status" aria-live="polite"></div>

      <nav class="workspace-tree" aria-label="Builder tool folders">
        <section class="workspace-folder">
          <button id="trainerFolderToggle" class="workspace-folder-toggle" type="button" aria-expanded="false" aria-controls="trainerFolderContent">
            <span class="workspace-folder-chevron" aria-hidden="true">›</span>
            <span>Trainer profiles</span>
          </button>
          <div id="trainerFolderContent" class="workspace-folder-content" hidden>
            <p class="profile-local-note">Saved only in this browser on this device. Fixed event trainer data is never replaced.</p>

            <section class="profile-panel-block" aria-labelledby="profileChooserTitle">
              <div class="profile-section-heading">
                <h3 id="profileChooserTitle">Current profile</h3>
                <button id="profileCreateBtn" class="profile-link-button" type="button">Create profile</button>
              </div>
              <select id="profileSelect" aria-label="Current trainer profile"></select>
              <div id="profileCreateForm" class="profile-inline-form" hidden>
                <label for="profileNameInput">Profile name</label>
                <input id="profileNameInput" maxlength="40" placeholder="My Emerald save" />
                <div class="profile-inline-actions">
                  <button id="profileCreateCancel" class="profile-secondary-button" type="button">Cancel</button>
                  <button id="profileCreateSave" type="button">Save profile</button>
                </div>
              </div>
              <div id="profileCurrentActions" class="profile-current-actions" hidden>
                <button id="profileRenameBtn" class="profile-secondary-button" type="button">Rename</button>
                <button id="profileDeleteBtn" class="profile-danger-button" type="button">Delete</button>
              </div>
            </section>

            <section class="profile-panel-block" aria-labelledby="saveIdentityTitle">
              <div class="profile-section-heading">
                <div>
                  <h3 id="saveIdentityTitle">Game trainer ID</h3>
                  <p>One game per profile.</p>
                </div>
                <button id="saveIdentityAddBtn" class="profile-link-button" type="button">Set game</button>
              </div>
              <div id="saveIdentityList" class="save-identity-list"></div>
              <div id="saveIdentityForm" class="profile-inline-form save-identity-form" hidden>
                <label for="saveIdentityGame">Origin game</label>
                <select id="saveIdentityGame"></select>
                <div class="profile-form-grid profile-form-grid-ids">
                  <label>TID<input id="saveIdentityTid" type="number" min="0" max="65535" value="12345" /></label>
                  <label>SID<input id="saveIdentitySid" type="number" min="0" max="65535" value="54321" /></label>
                </div>
                <label for="saveIdentityOt">OT name</label>
                <input id="saveIdentityOt" maxlength="7" placeholder="TRAINER" />
                <div class="profile-form-grid">
                  <label>OT gender<select id="saveIdentityGender"><option value="male">Male</option><option value="female">Female</option></select></label>
                  <label>Language<select id="saveIdentityLanguage"></select></label>
                </div>
                <div class="profile-inline-actions">
                  <button id="saveIdentityCancel" class="profile-secondary-button" type="button">Cancel</button>
                  <button id="saveIdentitySave" type="button">Save game</button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section class="workspace-folder">
          <button id="recentFolderToggle" class="workspace-folder-toggle" type="button" aria-expanded="false" aria-controls="recentFolderContent">
            <span class="workspace-folder-chevron" aria-hidden="true">›</span>
            <span>Recent generations</span>
          </button>
          <div id="recentFolderContent" class="workspace-folder-content" hidden>
            <p class="workspace-folder-note">The latest 30 successful generations are saved automatically.</p>
            <div class="recent-generation-picker">
              <button id="recentGenerationPickerButton" class="recent-generation-picker-button" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span id="recentGenerationPickerLabel">Choose a generation</span>
                <span class="recent-generation-picker-arrow" aria-hidden="true">▾</span>
              </button>
              <div id="recentGenerationPickerList" class="recent-generation-picker-list" role="listbox" hidden></div>
            </div>
            <p id="recentGenerationEmpty" class="profile-empty-state" hidden>Generated Pokémon will appear here.</p>
            <article id="recentGenerationDetail" class="recent-generation-detail" hidden>
              <strong id="recentGenerationDetailTitle"></strong>
              <span id="recentGenerationDetailDate"></span>
              <div class="recent-generation-actions">
                <button id="recentGenerationLoad" type="button">Load</button>
                <button id="recentGenerationCopy" class="profile-secondary-button" type="button">Copy code</button>
                <button id="recentGenerationDelete" class="profile-danger-button" type="button">Delete</button>
              </div>
            </article>
            <div class="profile-backup-actions">
              <button id="profileExportBtn" class="profile-secondary-button" type="button">Export backup</button>
              <button id="profileImportBtn" class="profile-secondary-button" type="button">Import backup</button>
              <input id="profileImportInput" type="file" accept="application/json,.json" hidden />
            </div>
            <p class="profile-backup-note">Backups keep profiles, editable snapshots, stable Pokémon fields, and generated bytes.</p>
          </div>
        </section>

        <a class="workspace-tree-link" href="./docs/spawn-setup-interactive.html" target="_blank" rel="noopener">
          <span class="workspace-tree-link-icon" aria-hidden="true">↗</span>
          <span>Base64 setup guide</span>
        </a>
      </nav>
    </aside>`;
  document.body.appendChild(root);
  return root;
}

export async function initProfileWorkspace({
  games = [],
  languages = [],
  onActiveProfileChange,
  onLoadRecent,
} = {}) {
  const root = document.getElementById('profileWorkspaceRoot') || createShell();
  let workspace = await loadProfileWorkspace();
  let selectedRecentId = null;

  const get = id => root.querySelector(`#${id}`);
  const drawer = get('profileDrawer');
  const toggle = get('profileDrawerToggle');
  const backdrop = get('profileDrawerBackdrop');
  const status = get('profileWorkspaceStatus');
  const profileSelect = get('profileSelect');
  const profileForm = get('profileCreateForm');
  const saveForm = get('saveIdentityForm');
  const recentPickerButton = get('recentGenerationPickerButton');
  const recentPickerList = get('recentGenerationPickerList');

  const getActiveProfile = () => workspace.profiles.find(profile => profile.id === workspace.activeProfileId) || null;

  function announce(message, type = 'info') {
    status.textContent = message || '';
    status.dataset.type = type;
  }

  function setDrawerOpen(open) {
    const isOpen = Boolean(open);
    document.body.classList.toggle('profile-drawer-open', isOpen);
    document.documentElement.classList.toggle('profile-drawer-open', isOpen);
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Close builder tools' : 'Open builder tools');
    backdrop.hidden = !isOpen;
    if (isOpen) requestAnimationFrame(() => drawer.focus?.());
  }

  function setFolderExpanded(toggleId, contentId, expanded) {
    const folderToggle = get(toggleId);
    const folderContent = get(contentId);
    const isExpanded = Boolean(expanded);
    folderToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    folderContent.hidden = !isExpanded;
    if (!isExpanded && contentId === 'recentFolderContent') setRecentPickerOpen(false);
  }

  function setRecentPickerOpen(open) {
    const isOpen = Boolean(open) && workspace.recents.length > 0;
    recentPickerList.hidden = !isOpen;
    recentPickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  async function persist({ notifyProfile = false } = {}) {
    workspace = await saveProfileWorkspace(workspace);
    render();
    if (notifyProfile) onActiveProfileChange?.(getActiveProfile());
  }

  function renderProfiles() {
    const options = [{ value: '', label: workspace.profiles.length ? '— Choose profile —' : '— No profiles yet —' }]
      .concat(workspace.profiles.map(profile => ({ value: profile.id, label: profile.name })));
    setOptions(profileSelect, options, workspace.activeProfileId || '');
    get('profileCurrentActions').hidden = !getActiveProfile();
    get('profileCreateBtn').disabled = workspace.profiles.length >= PROFILE_LIMIT;
    get('profileCreateBtn').title = workspace.profiles.length >= PROFILE_LIMIT
      ? `Maximum of ${PROFILE_LIMIT} profiles reached`
      : '';
  }

  function renderSaves() {
    const list = get('saveIdentityList');
    list.innerHTML = '';
    const profile = getActiveProfile();
    get('saveIdentityAddBtn').disabled = !profile;
    get('saveIdentityAddBtn').hidden = Boolean(profile?.saves.length);
    if (!profile) {
      const empty = document.createElement('p');
      empty.className = 'profile-empty-state';
      empty.textContent = 'Create or choose a profile to add trainer IDs.';
      list.appendChild(empty);
      return;
    }
    if (!profile.saves.length) {
      const empty = document.createElement('p');
      empty.className = 'profile-empty-state';
      empty.textContent = 'No game selected yet.';
      list.appendChild(empty);
      return;
    }
    const save = profile.saves[0];
    const card = document.createElement('article');
    card.className = 'save-identity-card';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = save.gameLabel;
    const details = document.createElement('span');
    details.textContent = `${save.otName || 'No OT'} · ${save.tid}/${save.sid}`;
    copy.append(title, details);
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'profile-secondary-button compact';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openSaveForm(save));
    card.append(copy, edit);
    list.appendChild(card);
  }

  function renderRecents() {
    recentPickerList.innerHTML = '';
    const hasRecents = workspace.recents.length > 0;
    const empty = get('recentGenerationEmpty');
    const detail = get('recentGenerationDetail');
    recentPickerButton.disabled = !hasRecents;
    empty.hidden = hasRecents;

    if (!workspace.recents.some(recent => recent.id === selectedRecentId)) selectedRecentId = null;
    const selected = workspace.recents.find(recent => recent.id === selectedRecentId) || null;
    get('recentGenerationPickerLabel').textContent = selected?.title || (hasRecents ? 'Choose a generation' : 'No recent generations');

    for (const recent of workspace.recents) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'recent-generation-picker-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', recent.id === selectedRecentId ? 'true' : 'false');
      option.textContent = recent.title;
      option.addEventListener('click', () => {
        selectedRecentId = recent.id;
        setRecentPickerOpen(false);
        renderRecents();
      });
      recentPickerList.appendChild(option);
    }

    detail.hidden = !selected;
    if (!selected) return;
    get('recentGenerationDetailTitle').textContent = selected.title;
    get('recentGenerationDetailDate').textContent = formatWhen(selected.createdAt);
    get('recentGenerationCopy').disabled = !selected.snapshot?.generated?.base64Text;
  }

  function render() {
    renderProfiles();
    renderSaves();
    renderRecents();
  }

  function openProfileForm(profile = null) {
    profileForm.hidden = false;
    profileForm.dataset.profileId = profile?.id || '';
    get('profileNameInput').value = profile?.name || '';
    get('profileNameInput').focus();
  }

  function closeProfileForm() {
    profileForm.hidden = true;
    profileForm.dataset.profileId = '';
    get('profileNameInput').value = '';
  }

  function openSaveForm(save = null) {
    if (!getActiveProfile()) return;
    saveForm.hidden = false;
    setOptions(get('saveIdentityGame'), games, save?.gameId || games[0]?.value);
    setOptions(get('saveIdentityLanguage'), languages, save?.languageId || 2);
    get('saveIdentityTid').value = String(save?.tid ?? 12345);
    get('saveIdentitySid').value = String(save?.sid ?? 54321);
    get('saveIdentityOt').value = save?.otName || '';
    get('saveIdentityGender').value = save?.otGender || 'male';
    get('saveIdentityGame').disabled = false;
    syncSaveOtLimit();
    get('saveIdentityOt').focus();
  }

  function syncSaveOtLimit() {
    const otInput = get('saveIdentityOt');
    const isJapanese = String(get('saveIdentityLanguage').value) === '1';
    otInput.maxLength = isJapanese ? 5 : 7;
    if (otInput.value.length > otInput.maxLength) otInput.value = otInput.value.slice(0, otInput.maxLength);
  }

  function closeSaveForm() {
    saveForm.hidden = true;
    get('saveIdentityGame').disabled = false;
  }

  function clampTrainerIdInput(input) {
    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) return;
    input.value = String(Math.max(0, Math.min(65535, Math.trunc(parsed))));
  }

  toggle.addEventListener('click', () => setDrawerOpen(!document.body.classList.contains('profile-drawer-open')));
  get('profileDrawerClose').addEventListener('click', () => setDrawerOpen(false));
  backdrop.addEventListener('click', () => setDrawerOpen(false));
  get('trainerFolderToggle').addEventListener('click', () => {
    const expanded = get('trainerFolderToggle').getAttribute('aria-expanded') === 'true';
    setFolderExpanded('trainerFolderToggle', 'trainerFolderContent', !expanded);
  });
  get('recentFolderToggle').addEventListener('click', () => {
    const expanded = get('recentFolderToggle').getAttribute('aria-expanded') === 'true';
    setFolderExpanded('recentFolderToggle', 'recentFolderContent', !expanded);
  });
  recentPickerButton.addEventListener('click', event => {
    event.stopPropagation();
    setRecentPickerOpen(recentPickerButton.getAttribute('aria-expanded') !== 'true');
  });
  recentPickerList.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.recent-generation-picker')) setRecentPickerOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (recentPickerButton.getAttribute('aria-expanded') === 'true') {
      setRecentPickerOpen(false);
    } else if (document.body.classList.contains('profile-drawer-open')) {
      setDrawerOpen(false);
    }
  });

  get('recentGenerationLoad').addEventListener('click', async () => {
    const recent = workspace.recents.find(item => item.id === selectedRecentId);
    if (!recent) return;
    const loadButton = get('recentGenerationLoad');
    loadButton.disabled = true;
    announce(`Loading ${recent.speciesName}…`);
    try {
      const result = await onLoadRecent?.(recent);
      const strategy = result?.strategy === 'semantic'
        ? 'Loaded with stable fields for compatibility.'
        : result?.strategy === 'bytes'
          ? 'Loaded from the saved Pokémon bytes.'
          : 'Editable generation loaded.';
      announce(strategy, 'success');
      if (window.matchMedia('(max-width: 820px)').matches) setDrawerOpen(false);
    } catch (error) {
      announce(error?.message || 'Could not load that generation.', 'error');
    } finally {
      loadButton.disabled = false;
    }
  });
  get('recentGenerationCopy').addEventListener('click', async () => {
    const recent = workspace.recents.find(item => item.id === selectedRecentId);
    if (!recent?.snapshot?.generated?.base64Text) return;
    await navigator.clipboard.writeText(recent.snapshot.generated.base64Text);
    announce('Box-name code copied.', 'success');
  });
  get('recentGenerationDelete').addEventListener('click', async () => {
    if (!selectedRecentId) return;
    workspace.recents = workspace.recents.filter(item => item.id !== selectedRecentId);
    selectedRecentId = null;
    await persist();
    announce('Recent generation deleted.');
  });

  get('profileCreateBtn').addEventListener('click', () => openProfileForm());
  get('profileRenameBtn').addEventListener('click', () => openProfileForm(getActiveProfile()));
  get('profileCreateCancel').addEventListener('click', closeProfileForm);
  get('profileCreateSave').addEventListener('click', async () => {
    const name = get('profileNameInput').value.trim();
    if (!name) {
      announce('Enter a profile name.', 'error');
      return;
    }
    const existing = workspace.profiles.find(profile => profile.id === profileForm.dataset.profileId);
    const profile = normalizeProfile(existing ? { ...existing, name, updatedAt: new Date().toISOString() } : {
      id: makeId('profile'),
      name,
      saves: [],
    });
    try {
      workspace = upsertProfile(workspace, profile);
      closeProfileForm();
      await persist({ notifyProfile: true });
      announce(existing ? 'Profile renamed.' : 'Profile created.', 'success');
    } catch (error) {
      announce(error.message, 'error');
    }
  });
  get('profileNameInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') get('profileCreateSave').click();
  });

  profileSelect.addEventListener('change', async () => {
    workspace.activeProfileId = profileSelect.value || null;
    closeSaveForm();
    await persist({ notifyProfile: true });
    announce(getActiveProfile() ? `${getActiveProfile().name} is active.` : 'No active profile.');
  });
  get('profileDeleteBtn').addEventListener('click', async () => {
    const profile = getActiveProfile();
    if (!profile || !window.confirm(`Delete the local profile “${profile.name}”? Recent generations will be kept.`)) return;
    workspace = removeProfile(workspace, profile.id);
    await persist({ notifyProfile: true });
    announce('Profile deleted.');
  });

  get('saveIdentityAddBtn').addEventListener('click', () => openSaveForm());
  get('saveIdentityCancel').addEventListener('click', closeSaveForm);
  get('saveIdentityLanguage').addEventListener('change', syncSaveOtLimit);
  for (const id of ['saveIdentityTid', 'saveIdentitySid']) {
    get(id).addEventListener('input', event => clampTrainerIdInput(event.currentTarget));
    get(id).addEventListener('change', event => clampTrainerIdInput(event.currentTarget));
  }
  get('saveIdentitySave').addEventListener('click', async () => {
    clampTrainerIdInput(get('saveIdentityTid'));
    clampTrainerIdInput(get('saveIdentitySid'));
    const gameId = Number(get('saveIdentityGame').value);
    const game = games.find(option => Number(option.value) === gameId);
    const existing = getActiveProfile()?.saves[0];
    const save = {
      ...existing,
      id: `save-${gameId}`,
      gameId,
      gameLabel: game?.label || `Game ${gameId}`,
      tid: Number(get('saveIdentityTid').value),
      sid: Number(get('saveIdentitySid').value),
      otName: get('saveIdentityOt').value,
      otGender: get('saveIdentityGender').value,
      languageId: Number(get('saveIdentityLanguage').value),
      updatedAt: new Date().toISOString(),
    };
    try {
      workspace = upsertSaveIdentity(workspace, workspace.activeProfileId, save);
      closeSaveForm();
      await persist({ notifyProfile: true });
      announce(`${save.gameLabel} trainer data saved.`, 'success');
    } catch (error) {
      announce(error.message, 'error');
    }
  });

  get('profileExportBtn').addEventListener('click', () => {
    const backup = createWorkspaceBackup(workspace);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFileName(getActiveProfile()?.name)}-gen3-builder-backup.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce('Versioned workspace backup exported.', 'success');
  });
  get('profileImportBtn').addEventListener('click', () => get('profileImportInput').click());
  get('profileImportInput').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = importWorkspaceBackup(JSON.parse(await file.text()));
      if (!window.confirm('Replace this browser’s profiles and recent generations with the imported backup?')) return;
      workspace = imported;
      await persist({ notifyProfile: true });
      announce('Workspace backup imported.', 'success');
    } catch (error) {
      announce(error.message || 'Could not import that backup.', 'error');
    }
  });

  render();

  return {
    getWorkspace: () => workspace,
    getActiveProfile,
    getActiveIdentity(gameId) {
      return getActiveProfile()?.saves.find(save => Number(save.gameId) === Number(gameId)) || null;
    },
    async recordGeneration(generation) {
      workspace = addRecentGeneration(workspace, {
        ...generation,
        profileId: workspace.activeProfileId,
      });
      await persist();
    },
    open: () => setDrawerOpen(true),
    close: () => setDrawerOpen(false),
  };
}
