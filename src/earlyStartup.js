import { SPECIES } from './data/species.gen3.js';

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
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.maxHeight = '160px';
  dropdown.style.overflowY = 'auto';

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

  function filterItems(query) {
    const normalized = String(query || '').trim().toLowerCase();
    return normalized
      ? items.filter(item => item.name.toLowerCase().includes(normalized))
      : items;
  }

  function chooseItem(item) {
    selectedId = item.id;
    input.value = item.name;
    wrapper.dataset.earlySelectedId = selectedId;
    window.__aceEarlySpeciesState = { selectedId, query: item.name };
    dropdown.classList.remove('show');
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
      option.className = 'autocomplete-item';
      option.textContent = item.name;
      option.dataset.id = item.id;
      option.dataset.index = String(index);
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
    renderDropdown(filterItems(input.value));
    dropdown.classList.add('show');
  }

  function updateKeyboardSelection() {
    const options = Array.from(dropdown.querySelectorAll('.autocomplete-item'));
    options.forEach(option => option.classList.remove('selected'));
    options[selectedIndex]?.classList.add('selected');
    options[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', showMatches);
  input.addEventListener('input', () => {
    selectedId = '';
    wrapper.dataset.earlySelectedId = '';
    window.__aceEarlySpeciesState = { selectedId: '', query: input.value };
    showMatches();
  });
  input.addEventListener('keydown', event => {
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
      dropdown.classList.remove('show');
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.classList.remove('show');
      if (!input.value || selectedId) return;
      const exact = items.find(item => item.name.toLowerCase() === input.value.toLowerCase());
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
