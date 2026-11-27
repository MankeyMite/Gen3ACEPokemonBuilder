import { getNationalDexNumber } from './data/nationalDex.gen3.js';
import { getExpGroup } from './data/expGroups.gen3.js';
import { GEN3_RIBBON_CONTROLS } from './domain/ribbonLegality.js';
import { expForLevel } from './lib/exp.js';
import { connectPhonePageControls, createPhonePager } from './builderPhonePages.js';
import { alignBase64PreviewGlyphs } from './lib/gen3/base64CodeDisplay.js';

const desktopQuery = window.matchMedia('(min-width: 1000px)');
const previewFields = new Set(['item-input', 'pokerusStatus', ...GEN3_RIBBON_CONTROLS.map(control => control.id)]);
const formatNumber = new Intl.NumberFormat();
let selectStep;
let syncProgress;
let revealPhoneField;
let previewFrame;
let progress = {
  originReady: false,
  blockers: {
    builderTabEncounter: { fields: ['species-input'], message: 'Choose a Pokémon to continue.' },
  },
};

const PHONE_PANEL_ITEMS = {
  builderEncounterPanel: '#builderSetupStage > .row, #builderEncounterDock .row',
  builderTrainerPanel: '#builderTrainerDock .builder-trainer-fields > *',
  builderPidPanel: '#builderTraitsDock .row, #builderPidDock .row, .stat-graph-row, #builderStatsDock .stat-graph ~ .row',
  builderMovesPanel: '#builderMovesDock > .row, .move-row',
  builderExtrasPanel: '.builder-extras-fields > .row, #builderExtrasDock > details',
  builderCodesPanel: '.code-target-tabs, .generate-output-row, .output-tabs, #switchBoxConverter, .output-action-row, .builder-code-heading > *, #builderPhoneHexDisplay > span, #codeHelpInline',
};

const phoneBoxListFits = window.matchMedia('(min-width: 320px) and (min-height: 650px)');

export function initDesktopBuilder() {
  const editor = document.getElementById('builderDesktopEditor');
  const tabs = Array.from(editor.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const previous = document.getElementById('builderPreviousStep');
  const next = document.getElementById('builderNextStep');
  const footer = next.parentElement;
  const message = document.getElementById('builderStepMessage');
  const guidance = document.getElementById('builderGuidanceDock');
  const nav = editor.querySelector('.builder-tabs');
  const extras = Array.from(document.querySelectorAll('#builderDetailsCard .contest-stats-section, #builderDetailsCard .ribbons-section'));
  for (const node of document.querySelectorAll('[data-builder-dock]')) {
    document.getElementById(node.dataset.builderDock).append(node);
  }
  for (const disclosure of extras) disclosure.name = 'builderExtras';

  const detailsDialog = document.getElementById('builderPhoneDetails');
  const detailsContent = document.getElementById('builderPhoneDetailsContent');
  const detailsTitle = document.getElementById('builderPhoneDetailsTitle');
  const guideDock = document.getElementById('builderGuideDock');
  const phoneGuideDock = document.getElementById('builderPhoneGuideDock');
  const guide = guideDock.querySelector('.how-it-works-card');
  let detailItems = '';
  let restoreDetails;
  const detailsPager = connectPhonePageControls(
    detailsContent,
    () => detailsContent.querySelectorAll(detailItems),
    document.getElementById('builderPhoneDetailsPages'),
  );
  function openDetails(title, content, items) {
    const position = document.createComment('phone details');
    content.before(position);
    detailsTitle.textContent = title;
    detailItems = items;
    detailsContent.append(content);
    detailsDialog.showModal();
    restoreDetails = () => position.replaceWith(content);
    detailsPager.reset();
  }
  detailsDialog.addEventListener('close', () => {
    restoreDetails?.();
    restoreDetails = null;
  });
  for (const disclosure of extras) {
    const summary = disclosure.querySelector('summary');
    summary.addEventListener('click', event => {
      if (desktopQuery.matches) return;
      event.preventDefault();
      openDetails(summary.textContent.trim(), disclosure.querySelector(':scope > div'), 'h4, .row, #contestSheenStatus');
    });
  }

  const searchControls = document.getElementById('pidFinderSearchControls');
  const searchPosition = document.createComment('PID finder search controls');
  searchControls.before(searchPosition);
  const mobileSearchDock = document.getElementById('pidFinderMobileSearchDock');
  const outputActions = document.querySelector('.builder-output-actions');
  const outputSidebar = outputActions.parentElement;
  const mobileOutputActionsDock = document.getElementById('builderMobileOutputActionsDock');
  const verificationStatus = document.getElementById('pkhexVerificationStatus');
  const verificationPosition = document.createComment('code verification status');
  verificationStatus.before(verificationPosition);
  const phoneVerificationDock = document.getElementById('builderPhoneVerificationDock');
  let active = 0;
  let attemptedStep = null;
  let highlightedFields = new Set();
  const pageCount = document.getElementById('builderPhonePageCount');
  const phonePager = createPhonePager(
    editor.querySelector('.builder-panels'),
    () => {
      const panel = panels[active];
      const items = panel.querySelectorAll(PHONE_PANEL_ITEMS[panel.id]);
      if (panel.id !== 'builderCodesPanel') return items;
      const boxList = panel.querySelector('.box-code-output-grid:has(.base64-box-row)');
      if (!boxList) return items;
      if (phoneBoxListFits.matches) return [...items, boxList];
      const rows = boxList.querySelectorAll('.base64-box-row');
      rows[0].setAttribute('data-phone-page-start', '');
      return [...items, ...rows];
    },
    (index, total) => {
      pageCount.hidden = total < 2;
      pageCount.textContent = total > 1 ? `${index + 1} / ${total}` : '';
      updateNavigation();
      if (panels[active].id === 'builderCodesPanel') {
        alignBase64PreviewGlyphs(document.getElementById('base64CodeDisplay'));
      }
    },
  );
  revealPhoneField = target => {
    if (target) phonePager.refresh(target);
  };

  function lastAvailableStep() {
    const firstBlocked = tabs.findIndex(tab => progress.blockers[tab.id]);
    return firstBlocked < 0 ? tabs.length - 1 : firstBlocked;
  }

  function updateNavigation() {
    const mobile = !desktopQuery.matches;
    const last = lastAvailableStep();
    const needsReturn = active > last;
    const nextIndex = needsReturn ? last : active + 1;
    const morePages = mobile && phonePager.canMove(1);

    previous.hidden = active === 0 && !(mobile && phonePager.canMove(-1));
    next.hidden = mobile && !morePages && nextIndex >= tabs.length;
    footer.hidden = !mobile && nextIndex >= tabs.length;
    next.textContent = morePages ? 'Next page' : nextIndex < tabs.length
      ? `${needsReturn ? 'Return to' : 'Continue to'} ${tabs[nextIndex].textContent}`
      : '';
    if (!mobile) pageCount.hidden = true;
  }

  function updateRequiredHighlights() {
    const blocker = attemptedStep === tabs[active].id ? progress.blockers[attemptedStep] : null;
    if (!blocker) attemptedStep = null;
    const fields = new Set((blocker?.fields || [])
      .map(id => document.getElementById(id))
      .filter(Boolean));

    for (const field of highlightedFields) {
      if (fields.has(field)) continue;
      field.removeAttribute('data-builder-required');
      field.removeAttribute('aria-invalid');
    }
    for (const field of fields) {
      if (highlightedFields.has(field)) continue;
      field.setAttribute('data-builder-required', '');
      if (field.matches('input, select')) field.setAttribute('aria-invalid', 'true');
    }
    highlightedFields = fields;
  }

  syncProgress = () => {
    const last = lastAvailableStep();
    if (last === 0 && active !== 0) {
      active = 0;
      phonePager.reset();
    }
    const needsReturn = active > last;

    tabs.forEach((tab, index) => {
      const selected = index === active;
      tab.disabled = index > last && !selected;
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute('aria-selected', String(selected));
      panels[index].hidden = !selected;
    });

    const blocker = progress.blockers[tabs[needsReturn ? last : active].id];
    const instruction = active !== 0 || attemptedStep ? blocker?.message || '' : '';
    guidance.hidden = active !== 0 || Boolean(instruction);
    if (message.textContent !== instruction) message.textContent = instruction;
    message.hidden = !instruction;
    updateNavigation();
    updateRequiredHighlights();
    phonePager.schedule();
  };

  selectStep = (index, { focus = false, reveal = false } = {}) => {
    if (index < 0 || (!reveal && index > lastAvailableStep())) return;
    if (active !== index) phonePager.reset();
    active = index;
    syncProgress();
    if (focus) tabs[active].focus({ preventScroll: true });
  };

  tabs.forEach((tab, index) => tab.addEventListener('click', () => selectStep(index)));
  nav.addEventListener('keydown', event => {
    const last = lastAvailableStep();
    const destinations = {
      ArrowLeft: active > last ? last : (active + last) % (last + 1),
      ArrowRight: (active + 1) % (last + 1),
      Home: 0,
      End: last,
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    selectStep(destinations[event.key], { focus: true });
  });
  previous.addEventListener('click', () => {
    if (!desktopQuery.matches && phonePager.canMove(-1)) {
      previous.focus({ preventScroll: true });
      phonePager.move(-1);
      return;
    }
    selectStep(Math.min(active - 1, lastAvailableStep()), { focus: true });
  });
  next.addEventListener('click', () => {
    if (!desktopQuery.matches && phonePager.canMove(1)) {
      next.focus({ preventScroll: true });
      phonePager.move(1);
      return;
    }
    const last = lastAvailableStep();
    if (active < last) {
      selectStep(active + 1, { focus: true });
      return;
    }

    if (!progress.blockers[tabs[last].id]) return;
    active = last;
    attemptedStep = tabs[active].id;
    syncProgress();
    const field = highlightedFields.values().next().value;
    if (!desktopQuery.matches && field) phonePager.refresh(field);
    field?.focus({ preventScroll: true });
  });

  const refreshPreviewFromField = event => {
    if (previewFields.has(event.target.id)) queueBuilderPreview();
  };
  editor.addEventListener('input', refreshPreviewFromField);
  editor.addEventListener('change', refreshPreviewFromField);

  function setLayout() {
    const desktop = desktopQuery.matches;
    if (desktop) {
      if (detailsDialog.open) detailsDialog.close();
      searchPosition.after(searchControls);
      outputSidebar.prepend(outputActions);
      verificationPosition.after(verificationStatus);
      guideDock.append(guide);
    } else {
      mobileSearchDock.append(searchControls);
      mobileOutputActionsDock.append(outputActions);
      phoneVerificationDock.append(verificationStatus);
      phoneGuideDock.append(guide);
    }
    document.body.classList.toggle('builder-desktop', desktop);
    document.body.classList.toggle('builder-mobile', !desktop);
    syncProgress();
    queueBuilderPreview();
  }

  desktopQuery.addEventListener('change', setLayout);
  setLayout();
}

export function setDesktopBuilderProgress(state) {
  progress = state;
  syncProgress?.();
  queueBuilderPreview();
}

export function revealDesktopBuilderField(field) {
  const panel = field.closest('.builder-panel');
  if (!panel) return false;
  const panels = Array.from(panel.parentElement.children);
  selectStep?.(panels.indexOf(panel), { reveal: true });
  if (!desktopQuery.matches) revealPhoneField?.(field);
  return true;
}

export function showPhoneBuilderField(field) {
  if (!desktopQuery.matches) revealPhoneField?.(field);
}

export function showDesktopBuilderCodes() {
  revealDesktopBuilderField(document.getElementById('generateBtn'));
}

function renderPreviewExperience(get, hasEncounter, speciesId, level) {
  const group = getExpGroup(speciesId);
  const levelStart = expForLevel(group, level);
  const value = get('expTotal').value;
  const total = value === '' ? levelStart : Math.max(0, Math.floor(Number(value) || 0));
  const nextLevel = level === 100 ? null : expForLevel(group, level + 1);
  const remaining = nextLevel === null ? 0 : Math.max(0, nextLevel - total);

  get('builderPreviewExpBar').value = !hasEncounter ? 0 : nextLevel === null ? 1
    : Math.min(1, Math.max(0, (total - levelStart) / (nextLevel - levelStart)));
  get('builderPreviewExp').textContent = hasEncounter ? formatNumber.format(total) : '–';
  get('builderPreviewNextExp').textContent = !hasEncounter ? '–' : nextLevel === null ? 'Max level' : formatNumber.format(remaining);
}

export function queueBuilderPreview() {
  if (!desktopQuery.matches || previewFrame) return;
  previewFrame = requestAnimationFrame(() => {
    previewFrame = null;
    const get = id => document.getElementById(id);
    const sprite = get('desktopPokemonPreviewSprite');
    const name = sprite?.alt;
    const preview = get('builderPreview');
    const hasEncounter = progress.originReady;
    const speciesId = Number(get('species').value) || 0;
    const level = Math.max(1, Math.min(100, Math.floor(Number(get('level').value) || 1)));
    const dexNumber = name && getNationalDexNumber(name.startsWith('Unown ') ? 'Unown' : name);
    const optionText = id => {
      const select = get(id);
      return select.value ? select.selectedOptions[0]?.textContent.trim() : '';
    };
    get('builderPreviewName').textContent = name || (progress.originReady ? 'Imported Pokémon' : 'No Pokémon selected');
    get('builderPreviewNumber').textContent = dexNumber ? `#${String(dexNumber).padStart(3, '0')}` : '';
    get('builderPreviewLevel').textContent = hasEncounter ? `Lv. ${level}` : '';
    get('builderPreviewTraits').textContent = hasEncounter
      ? [optionText('nature'), optionText('ability'), get('shiny').checked && 'Shiny'].filter(Boolean).join(' · ')
      : '';
    get('builderPreviewOrigin').textContent = hasEncounter
      ? [optionText('pokemonOrigin'), optionText('originGame')].filter(Boolean).join(' · ')
      : '';

    for (const stat of preview.querySelectorAll('[data-stat-source]')) {
      stat.textContent = hasEncounter ? Number(get(stat.dataset.statSource).textContent) || '–' : '–';
    }

    const ribbons = GEN3_RIBBON_CONTROLS.reduce((count, control) => {
      const field = get(control.id);
      return count + (control.kind === 'rank' ? Number(field.value) || 0 : Number(field.checked));
    }, 0);
    const item = Number(get('item').value) ? get('item-input')?.value : '';
    const pokerus = hasEncounter ? get('pokerusStatus').value : 'none';
    get('builderPreviewItem').textContent = hasEncounter ? item || 'None' : '–';
    get('builderPreviewRibbons').textContent = hasEncounter ? ribbons : '–';
    get('builderPreviewPokerusActive').hidden = pokerus !== 'active';
    get('builderPreviewPokerusCured').hidden = pokerus !== 'cured';
    renderPreviewExperience(get, hasEncounter, speciesId, level);

    const verification = get('pkhexVerificationStatus');
    const status = get('builderPreviewStatus');
    status.hidden = verification.hidden;
    status.dataset.state = verification.dataset.state;
    get('builderPreviewVerification').textContent = get('pkhexVerificationText').textContent;
    get('builderPreviewReport').hidden = get('pkhexReportBtn').hidden;
  });
}
