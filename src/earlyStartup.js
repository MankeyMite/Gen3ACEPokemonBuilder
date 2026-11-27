import { SPECIES } from './data/species.gen3.js';
import { initDesktopBuilder } from './builderDesktop.js';
import { rankSpeciesMatches } from './domain/speciesSearch.js';

initDesktopBuilder();

const STARTUP_PICKER_LIMIT = 80;
window.__aceEarlySpeciesState = { selectedId: '', query: '' };

function getStartupSpecies() {
  return SPECIES
    .filter(([speciesId, name]) => Number(speciesId) > 0 && !String(name || '').includes('?'))
    .map(([speciesId, name]) => ({ id: String(speciesId), name: String(name) }));
}

function createStartupSpeciesPicker(selectElement, onSelect) {
  const items = getStartupSpecies();
  let selectedId = '';
  let selectedIndex = -1;
  let visibleItems = [];

  const wrapper = document.createElement('div');
  wrapper.id = selectElement.id;
  wrapper.className = 'autocomplete-wrapper startup-species-picker';
  wrapper.dataset.startupPicker = 'true';

  const input = document.createElement('input');
  input.id = `${selectElement.id}-input`;
  input.type = 'text';
  input.className = 'autocomplete-input';
  input.placeholder = '— Select —';
  input.autocomplete = 'off';

  const dropdown = document.createElement('div');
  dropdown.id = `${selectElement.id}-options`;
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.maxHeight = '160px';
  dropdown.style.overflowY = 'auto';
  dropdown.setAttribute('role', 'listbox');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', dropdown.id);
  input.setAttribute('aria-expanded', 'false');

  Object.defineProperty(wrapper, 'value', {
    configurable: true,
    get: () => selectedId,
    set: value => {
      const item = items.find(candidate => candidate.id === String(value));
      selectedId = item?.id || '';
      input.value = item?.name || '';
      wrapper.dataset.earlySelectedId = selectedId;
    },
  });

  function closeDropdown() {
    dropdown.classList.remove('show');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function chooseItem(item) {
    selectedId = item.id;
    input.value = item.name;
    wrapper.dataset.earlySelectedId = selectedId;
    window.__aceEarlySpeciesState = { selectedId, query: item.name };
    closeDropdown();
    onSelect?.(item);
  }

  function renderDropdown(matches) {
    dropdown.innerHTML = '';
    selectedIndex = -1;
    visibleItems = matches.slice(0, STARTUP_PICKER_LIMIT);

    if (visibleItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'autocomplete-no-results';
      empty.textContent = 'No matches found';
      dropdown.appendChild(empty);
      return;
    }

    visibleItems.forEach((item, index) => {
      const option = document.createElement('div');
      option.id = `${dropdown.id}-${item.id}`;
      option.className = 'autocomplete-item';
      option.textContent = item.name;
      option.dataset.id = item.id;
      option.dataset.index = String(index);
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.addEventListener('mousedown', event => {
        event.preventDefault();
        chooseItem(item);
      });
      dropdown.appendChild(option);
    });

    if (matches.length > visibleItems.length) {
      const hint = document.createElement('div');
      hint.className = 'autocomplete-more-results';
      hint.textContent = `Type to narrow ${matches.length} Pokémon`;
      dropdown.appendChild(hint);
    }
  }

  function showMatches() {
    renderDropdown(rankSpeciesMatches(items, input.value));
    dropdown.classList.add('show');
    input.setAttribute('aria-expanded', 'true');
    if (visibleItems.length) selectedIndex = 0;
    updateKeyboardSelection({ scroll: false });
  }

  function updateKeyboardSelection({ scroll = true } = {}) {
    const options = Array.from(dropdown.querySelectorAll('.autocomplete-item'));
    const active = options[selectedIndex];
    for (const option of options) {
      option.classList.toggle('selected', option === active);
      option.setAttribute('aria-selected', String(option === active));
    }
    if (active) {
      input.setAttribute('aria-activedescendant', active.id);
      if (scroll) active.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  input.addEventListener('focus', showMatches);
  input.addEventListener('input', () => {
    selectedId = '';
    wrapper.dataset.earlySelectedId = '';
    window.__aceEarlySpeciesState = { selectedId: '', query: input.value };
    showMatches();
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing || !dropdown.classList.contains('show')) return;
    if (!visibleItems.length && event.key !== 'Escape') return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
      updateKeyboardSelection();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateKeyboardSelection();
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      chooseItem(visibleItems[selectedIndex]);
    } else if (event.key === 'Escape') {
      closeDropdown();
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      closeDropdown();
      if (!input.value || selectedId) return;
      const exact = items.find(item => item.name.toLowerCase() === input.value.trim().toLowerCase());
      if (exact) chooseItem(exact);
      else input.value = '';
    }, 150);
  });

  wrapper.append(input, dropdown);
  selectElement.parentNode.replaceChild(wrapper, selectElement);
  return wrapper;
}

let builderPromise = null;
function loadBuilder() {
  if (builderPromise) return builderPromise;
  document.documentElement.classList.add('builder-loading');
  builderPromise = import('./main.js')
    .then(() => {
      document.documentElement.classList.remove('builder-loading');
      document.documentElement.classList.add('builder-ready');
    })
    .catch(error => {
      document.documentElement.classList.remove('builder-loading');
      document.documentElement.classList.add('builder-load-failed');
      const guidance = document.getElementById('builderSetupGuidance');
      if (guidance) guidance.textContent = 'The builder could not finish loading. Refresh the page to try again.';
      console.error('Failed to load the Pokémon builder:', error);
    });
  return builderPromise;
}

const speciesSelect = document.getElementById('species');
if (speciesSelect) {
  createStartupSpeciesPicker(speciesSelect, item => {
    const guidance = document.getElementById('builderSetupGuidance');
    if (guidance) guidance.textContent = `Loading builder options for ${item.name}…`;
    loadBuilder();
  });
}

const scheduleBuilderLoad = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadBuilder, { timeout: 1000 });
  } else {
    window.setTimeout(loadBuilder, 50);
  }
};

// Let the header, guide, and lightweight picker paint before loading the full app.
window.requestAnimationFrame(() => window.requestAnimationFrame(scheduleBuilderLoad));
