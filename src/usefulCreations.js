import {
  USEFUL_CREATION_GAMES,
  generateUsefulCreationCode,
  getUsefulCreationDevices,
  getUsefulCreationLanguages,
  getUsefulCreationsForSetup,
} from './data/usefulCreations.gen3.js';
import { getOnlineSpriteUrl } from './data/nationalDex.gen3.js';
import { renderBase64Code } from './lib/gen3/base64CodeDisplay.js';

export function getSelectOptionValue(optionData) {
  return String(optionData?.value ?? optionData?.id ?? '');
}

function fillSelect(select, placeholder, options) {
  select.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = getSelectOptionValue(optionData);
    option.textContent = optionData.label;
    select.appendChild(option);
  }
}

function createUsefulCreationsView() {
  const view = document.createElement('main');
  view.id = 'usefulCreationsView';
  view.className = 'container useful-creations-view';
  view.hidden = true;
  view.innerHTML = `
    <section class="card useful-creations-card" aria-labelledby="usefulCreationsTitle">
      <div class="useful-creations-header">
        <div>
          <p class="useful-creations-eyebrow">Builder tools</p>
          <h2 id="usefulCreationsTitle">Useful creations</h2>
          <p>Choose the setup you play on, then pick a ready-made Pokémon. Its box-name code appears immediately.</p>
        </div>
        <button id="usefulCreationsBack" class="useful-creations-back" type="button">← Back to builder</button>
      </div>

      <div class="useful-creations-setup" aria-label="Game setup">
        <label for="usefulCreationGame">Game
          <select id="usefulCreationGame" autocomplete="off"></select>
        </label>
        <label for="usefulCreationDevice">Platform / emulator
          <select id="usefulCreationDevice" autocomplete="off" disabled></select>
        </label>
        <label for="usefulCreationLanguage">Language
          <select id="usefulCreationLanguage" autocomplete="off" disabled></select>
        </label>
      </div>
      <p id="usefulCreationSetupHint" class="useful-creation-setup-hint" aria-live="polite">Start by selecting your game.</p>

      <div class="useful-creation-picker">
        <label for="usefulCreationPokemon">Useful Pokémon</label>
        <select id="usefulCreationPokemon" autocomplete="off" disabled></select>
      </div>

      <div id="usefulCreationEmpty" class="useful-creation-empty">
        Complete the three setup choices above to see the available Pokémon.
      </div>

      <article id="usefulCreationResult" class="useful-creation-result" hidden>
        <div class="useful-creation-summary">
          <img id="usefulCreationSprite" class="species-sprite visible" alt="" />
          <div>
            <h3 id="usefulCreationName"></h3>
            <p id="usefulCreationDescription"></p>
          </div>
        </div>

        <div class="useful-creation-code-header">
          <div>
            <h3>Box-name code</h3>
            <p>Enter all 14 box names exactly as shown, then execute with your Base64 writer.</p>
          </div>
          <button id="usefulCreationCopy" type="button">Copy Base64</button>
        </div>
        <p id="usefulCreationSwitchNote" class="useful-creation-switch-note" hidden></p>
        <pre id="usefulCreationCode" class="base64-code-display useful-creation-code" tabindex="0" role="textbox" aria-readonly="true" aria-label="Useful Pokémon Base64 box-name code"></pre>
        <p id="usefulCreationCopyStatus" class="useful-creation-copy-status" role="status" aria-live="polite"></p>
      </article>
    </section>`;
  return view;
}

export function initUsefulCreations() {
  const builderMain = document.querySelector('main.container');
  if (!builderMain) throw new Error('The builder view could not be found.');

  const view = document.getElementById('usefulCreationsView') || createUsefulCreationsView();
  if (!view.isConnected) builderMain.insertAdjacentElement('afterend', view);

  const get = id => view.querySelector(`#${id}`);
  const gameSelect = get('usefulCreationGame');
  const deviceSelect = get('usefulCreationDevice');
  const languageSelect = get('usefulCreationLanguage');
  const creationSelect = get('usefulCreationPokemon');
  const result = get('usefulCreationResult');
  const empty = get('usefulCreationEmpty');
  const codeDisplay = get('usefulCreationCode');
  const switchNote = get('usefulCreationSwitchNote');
  let codeText = '';
  let loadToken = 0;

  fillSelect(gameSelect, 'Select a game', USEFUL_CREATION_GAMES);
  fillSelect(deviceSelect, 'Select a game first', []);
  fillSelect(languageSelect, 'Select a platform first', []);
  fillSelect(creationSelect, 'Complete your setup first', []);

  const getSetup = () => ({
    game: gameSelect.value,
    device: deviceSelect.value,
    language: languageSelect.value,
  });

  function resetCreation({ clearSelection = true } = {}) {
    loadToken += 1;
    if (clearSelection) creationSelect.value = '';
    result.hidden = true;
    codeDisplay.textContent = '';
    codeText = '';
    switchNote.hidden = true;
    switchNote.textContent = '';
    get('usefulCreationCopyStatus').textContent = '';
  }

  function updateCreationOptions() {
    const setup = getSetup();
    const creations = getUsefulCreationsForSetup(setup);
    fillSelect(
      creationSelect,
      creations.length ? 'Select a useful Pokémon' : 'Complete your setup first',
      creations,
    );
    creationSelect.disabled = creations.length === 0;
    empty.hidden = creations.length > 0;
    empty.textContent = creations.length
      ? ''
      : 'Complete the three setup choices above to see the available Pokémon.';
    resetCreation();
  }

  function updateSetupHint() {
    const { game, device, language } = getSetup();
    const hint = get('usefulCreationSetupHint');
    if (!game) hint.textContent = 'Start by selecting your game.';
    else if (!device) hint.textContent = 'Now select the platform or emulator you use.';
    else if (!language) hint.textContent = 'Now select your game language and revision, where required.';
    else hint.textContent = 'Setup complete. Choose a useful Pokémon below.';
  }

  gameSelect.addEventListener('change', () => {
    const devices = getUsefulCreationDevices(gameSelect.value);
    fillSelect(deviceSelect, 'Select a platform / emulator', devices);
    deviceSelect.disabled = devices.length === 0;
    fillSelect(languageSelect, 'Select a platform first', []);
    languageSelect.disabled = true;
    updateCreationOptions();
    updateSetupHint();
  });

  deviceSelect.addEventListener('change', () => {
    const languages = getUsefulCreationLanguages(gameSelect.value, deviceSelect.value);
    fillSelect(languageSelect, gameSelect.value === 'FR' || gameSelect.value === 'LG'
      ? 'Select language / version'
      : 'Select a language', languages);
    languageSelect.disabled = languages.length === 0;
    updateCreationOptions();
    updateSetupHint();
  });

  languageSelect.addEventListener('change', () => {
    updateCreationOptions();
    updateSetupHint();
  });

  creationSelect.addEventListener('change', async () => {
    const creationId = creationSelect.value;
    resetCreation({ clearSelection: false });
    if (!creationId) return;
    const currentLoadToken = loadToken;
    empty.hidden = false;
    empty.textContent = 'Loading the matching payload…';

    try {
      const generated = await generateUsefulCreationCode(creationId, getSetup());
      if (currentLoadToken !== loadToken) return;
      codeText = generated.text;
      get('usefulCreationName').textContent = generated.creation.label;
      get('usefulCreationDescription').textContent = generated.creation.description;
      const sprite = get('usefulCreationSprite');
      const localSpritePath = generated.creation.spritePath;
      const onlineSpritePath = getOnlineSpriteUrl(generated.creation.speciesName, false);
      sprite.onerror = localSpritePath
        ? () => {
            sprite.onerror = null;
            sprite.src = localSpritePath;
          }
        : null;
      sprite.src = onlineSpritePath || localSpritePath;
      sprite.alt = generated.creation.speciesName;
      renderBase64Code(codeDisplay, codeText);
      switchNote.hidden = !(getSetup().device === 'switch' && generated.substitutionUsed);
      switchNote.textContent = switchNote.hidden
        ? ''
        : 'This code includes Switch-safe character substitutions. The Pokémon data is unchanged.';
      result.hidden = false;
      empty.hidden = true;
    } catch (error) {
      if (currentLoadToken !== loadToken) return;
      empty.hidden = false;
      empty.textContent = error?.message || 'This code could not be loaded.';
    }
  });

  get('usefulCreationCopy').addEventListener('click', async () => {
    if (!codeText) return;
    const status = get('usefulCreationCopyStatus');
    try {
      await navigator.clipboard.writeText(codeText);
      status.textContent = 'Copied.';
    } catch {
      status.textContent = 'Could not copy automatically. Select the code and copy it manually.';
    }
  });

  function open() {
    builderMain.classList.add('builder-main-is-hidden');
    view.hidden = false;
    document.body.classList.add('useful-creations-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => gameSelect.focus());
  }

  function close() {
    view.hidden = true;
    builderMain.classList.remove('builder-main-is-hidden');
    document.body.classList.remove('useful-creations-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get('usefulCreationsBack').addEventListener('click', close);

  return { open, close, isOpen: () => !view.hidden };
}
