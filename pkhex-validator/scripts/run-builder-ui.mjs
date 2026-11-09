import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fixtures from '../wwwroot/fixtures.generated.js';

const chromeCandidates = [
  process.env.CHROME_BIN,
  process.env.GOOGLE_CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = chromeCandidates.find(candidate => fs.existsSync(candidate));
if (!chromePath) throw new Error('Chrome or Edge was not found.');

const targetUrl = process.argv[2] || 'http://127.0.0.1:8012/';
const debugPort = 9378;
const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pkhex-builder-ui-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--metrics-recording-only',
  '--no-first-run',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDirectory}`,
  targetUrl,
], { stdio: ['ignore', 'ignore', 'pipe'] });
let chromeDiagnostics = '';
chrome.stderr.on('data', chunk => {
  chromeDiagnostics += chunk.toString();
});

let browserSocket;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function waitForTarget() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${debugPort}/json/list`);
      const page = targets.find(target => target.type === 'page' && target.url.startsWith(targetUrl));
      if (page) return page;
    } catch {}
    await delay(100);
  }
  throw new Error('Timed out waiting for the headless browser target.');
}

async function connectDebugger(socketUrl) {
  const socket = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  socket.addEventListener('close', () => {
    for (const waiter of pending.values()) {
      waiter.reject(new Error(`Browser debugger disconnected. ${chromeDiagnostics}`));
    }
    pending.clear();
  });

  return {
    socket,
    send(method, params = {}) {
      const id = ++sequence;
      const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return response;
    },
  };
}

async function evaluate(client, expression) {
  const response = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  }
  return response.result.value;
}

async function waitFor(client, expression, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await evaluate(client, expression);
    if (value) return value;
    await delay(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

try {
  const target = await waitForTarget();
  const client = await connectDebugger(target.webSocketDebuggerUrl);
  browserSocket = client.socket;
  await client.send('Runtime.enable');
  await waitFor(client, "document.documentElement?.classList?.contains('builder-ready') === true");

  const trainerIdDice = await evaluate(client, `(async () => {
    const { generateTrainerId } = await import('./src/lib/gen3/trainerIdRandomizer.js');
    const { isValidGCTidSid } = await import('./src/data/shadowEncounters.gen3.js');
    const { getCXDEncountersForSpecies } = await import('./src/domain/encounterAvailability.js');
    const { CXD_SPECIAL_ENCOUNTERS } = await import('./src/data/cxdSpecialEncounters.gen3.js');
    const change = (id, value) => {
      const input = document.getElementById(id);
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = String(value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const selectSpecies = id => {
      if (!document.querySelector('#species').selectById(id)) throw new Error('Could not select species ' + id);
    };
    const dice = document.querySelector('#randomizeTrainerIdsBtn');
    const roll = () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.314159;
        dice.click();
      } finally { Math.random = originalRandom; }
    };
    change('encounterMode', 'hatched');
    selectSpecies(25);
    await Promise.resolve();
    const games = [];
    for (const gameId of [1, 2, 3, 4, 5]) {
      change('originGame', gameId);
      await Promise.resolve();
      if (dice.hidden || dice.disabled || getComputedStyle(dice).display === 'none') {
        throw new Error('Trainer dice unavailable for GBA game ' + gameId);
      }
      const expected = generateTrainerId(gameId, { random: () => 0.314159 });
      document.querySelector('#pid').value = '0x' + (expected.tid ^ expected.sid).toString(16);
      roll();
      await Promise.resolve();
      if (Number(document.querySelector('#tid').value) !== expected.tid ||
          Number(document.querySelector('#sid').value) !== expected.sid ||
          !document.querySelector('#shiny').checked ||
          !document.querySelector('#shinyIndicator').classList.contains('active')) {
        throw new Error('Trainer dice did not apply both IDs and refresh shiny: ' + JSON.stringify({ gameId, expected,
          tid: document.querySelector('#tid').value, sid: document.querySelector('#sid').value,
          pid: document.querySelector('#pid').value, shiny: document.querySelector('#shiny').checked,
          indicator: document.querySelector('#shinyIndicator').className,
          mode: document.querySelector('#encounterMode').value, game: document.querySelector('#originGame').value }));
      }
      games.push(gameId);
    }
    change('encounterMode', 'mystery');
    await Promise.resolve();
    if (!dice.hidden || !dice.disabled) throw new Error('Mystery Gifts must hide trainer dice');
    const fixedBefore = [document.querySelector('#tid').value, document.querySelector('#sid').value];
    dice.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (JSON.stringify(fixedBefore) !== JSON.stringify([document.querySelector('#tid').value, document.querySelector('#sid').value])) {
      throw new Error('A synthetic click changed fixed trainer IDs');
    }
    const originalConfirm = window.confirm;
    try {
      window.confirm = () => true;
      change('manualOverride', true);
    } finally { window.confirm = originalConfirm; }
    if (!dice.hidden) throw new Error('Manual Override must not expose Mystery Gift trainer dice');
    document.querySelector('#manualOverride').checked = false;
    change('manualOverride', false);

    change('encounterMode', 'cxd_shadow');
    selectSpecies(185);
    const shadowSelect = document.querySelector('#shadowEncounter');
    const firstShadow = [...shadowSelect.options].find(option => option.value !== '');
    change('shadowEncounter', firstShadow.value);
    await Promise.resolve();
    if (dice.hidden) throw new Error('Editable GameCube encounter must show trainer dice');
    roll();
    if (!isValidGCTidSid(Number(document.querySelector('#tid').value), Number(document.querySelector('#sid').value))) {
      throw new Error('GameCube dice produced an unreachable pair');
    }

    selectSpecies(197);
    const starterIndex = getCXDEncountersForSpecies(197).findIndex(encounter => String(encounter.pidType).includes('STARTER'));
    change('shadowEncounter', starterIndex);
    await Promise.resolve();
    if (!dice.hidden) throw new Error('Correlated GameCube starters must hide trainer dice');

    const fixedGift = CXD_SPECIAL_ENCOUNTERS.find(encounter => encounter.id === 'colo_duking_plusle');
    selectSpecies(fixedGift.species);
    const fixedGiftIndex = getCXDEncountersForSpecies(fixedGift.species).findIndex(encounter => encounter.id === fixedGift.id);
    change('shadowEncounter', fixedGiftIndex);
    await Promise.resolve();
    if (!dice.hidden) throw new Error('Fixed-trainer gifts must hide trainer dice');
    return { games, shinyUpdated: true, mysteryHidden: true, gameCubeReachable: true, fixedTrainersHidden: true };
  })()`);

  const moveDiscoveryHints = await evaluate(client, `(() => {
    const encounterMode = document.querySelector('#encounterMode');
    encounterMode.value = 'wild';
    encounterMode.dispatchEvent(new Event('change', { bubbles: true }));
    const species = document.querySelector('#species');
    if (!species.selectById(395)) return { error: 'Could not select Bagon.' };
    const level = document.querySelector('#level');
    level.value = '23';
    level.dispatchEvent(new Event('input', { bubbles: true }));
    level.dispatchEvent(new Event('change', { bubbles: true }));

    const moveInput = document.querySelector('#move1-input');
    moveInput.focus();
    const dropdown = document.querySelector('#move1 .autocomplete-dropdown');
    const alternatives = [...dropdown.querySelectorAll('.autocomplete-item.disabled')].map(item => ({
      name: item.querySelector('.autocomplete-item-name')?.textContent,
      hint: item.querySelector('.autocomplete-item-hint')?.textContent,
    }));
    const heading = dropdown.querySelector('.autocomplete-group-label')?.textContent;
    const selectedBefore = document.querySelector('#move1').value;
    dropdown.querySelector('.autocomplete-item.disabled')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    return {
      heading,
      alternatives,
      disabledSelectionBlocked: document.querySelector('#move1').value === selectedBefore,
    };
  })()`);
  if (moveDiscoveryHints.error || moveDiscoveryHints.heading !== 'Available with a different encounter' ||
      !moveDiscoveryHints.alternatives.some(item => /^Level\s+\d+$/.test(String(item.hint || ''))) ||
      !moveDiscoveryHints.alternatives.some(item => item.hint === 'Egg move') ||
      !moveDiscoveryHints.disabledSelectionBlocked) {
    throw new Error(`Unexpected legal-mode move discovery hints: ${JSON.stringify(moveDiscoveryHints)}`);
  }

  const legalHex = JSON.stringify(fixtures.knownLegal.hex);
  const wildEvolutionOrigins = [];
  for (const testCase of [
    { species: 65, source: 63, location: 124, otherLocations: [125, 141], name: 'Abra' },
    { species: 30, source: 29, location: 103, otherLocations: [136], name: 'Nidoran' },
  ]) {
    await evaluate(client, `(async () => {
      const testCase = ${JSON.stringify(testCase)};
      const { ENCOUNTER_SLOTS } = await import('./src/data/encounterSlots.gen3.js');
      const change = (id, value) => {
        const input = document.getElementById(id);
        input.value = String(value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      change('encounterMode', 'wild');
      document.querySelector('#species').selectById(testCase.species);
      change('originGame', 4);
      await Promise.resolve();
      const location = document.querySelector('#metLocation');
      const expectedDefault = testCase.species === 30 ? 136 : 141;
      if (Number(location.value) !== expectedDefault) throw new Error('Wild location did not prefer the selected species or nearest ancestor');
      if (Number(document.querySelector('#metLevel').value) < (testCase.species === 30 ? 30 : 55)) {
        throw new Error('Default capture level did not match the preferred species');
      }
      const dropdownButton = location.querySelector('.autocomplete-toggle');
      const dropdown = location.querySelector('.autocomplete-dropdown');
      if (!dropdownButton || !dropdownButton.getAttribute('aria-label')) throw new Error('Met location dropdown button is missing');
      document.querySelector('#level').focus();
      dropdownButton.click();
      if (!dropdown.classList.contains('show') || dropdownButton.getAttribute('aria-expanded') !== 'true' ||
          Number(dropdown.querySelector('.autocomplete-item').dataset.id) !== expectedDefault) {
        throw new Error('Met location button did not open the prioritized list');
      }
      dropdownButton.click();
      if (dropdown.classList.contains('show') || dropdownButton.getAttribute('aria-expanded') !== 'false') {
        throw new Error('Met location button did not close the list');
      }
      for (const id of [...testCase.otherLocations, testCase.location]) {
        if (!location.selectById(id)) throw new Error('Missing lineage location ' + id + ' for species ' + testCase.species);
      }
      if (Number(location.value) !== testCase.location) throw new Error('Manual pre-evolution location was reset');
      change('metLevel', 1);
      document.querySelector('#metLevel').dispatchEvent(new Event('blur'));
      change('level', 1);
      if (Number(document.querySelector('#level').value) < 16) throw new Error('Evolved level floor was not applied');
      document.querySelector('#pidFinderBtn').click();
      if (!document.querySelector('#pidFinderSummary').textContent.includes(testCase.name)) {
        throw new Error('PID finder does not describe the selected pre-evolution source');
      }
      const sample = await new Promise((resolve, reject) => {
        const worker = new Worker('./src/lib/gen3/rng-worker.js');
        worker.onerror = reject;
        worker.onmessage = event => {
          if (event.data.type === 'done') { worker.terminate(); resolve(event.data.results[0]); }
        };
        worker.postMessage({ startSeed: 0, endSeed: 12000, nature: -1, ability: -1,
          genderThreshold: testCase.species === 30 ? 254 : 63, targetGender: 3,
          tid: Number(document.querySelector('#tid').value), sid: Number(document.querySelector('#sid').value),
          wantShiny: false, minIVs: [0,0,0,0,0,0], maxIVs: [31,31,31,31,31,31],
          methods: [true,true,true], maxResults: 1, gameId: 4,
          targetSpecies: [testCase.source], slotTables: ENCOUNTER_SLOTS[4][testCase.location] });
      });
      if (!sample) throw new Error('No wild ancestor fixture found');
      const shiny = document.querySelector('#pfWantShiny');
      shiny.checked = false;
      shiny.dispatchEvent(new Event('change', { bubbles: true }));
      for (const [suffix, key] of [['Hp','hp'],['Atk','atk'],['Def','def'],['SpA','spa'],['SpD','spd'],['Spe','spe']]) {
        change('pfMin' + suffix, sample.ivs[key]);
        change('pfMax' + suffix, sample.ivs[key]);
      }
      change('pfNature', -1);
      change('pfGender', 'any');
      change('pfAbility', -1);
      document.querySelector('#pfSearch').click();
      return true;
    })()`);
    await waitFor(client, "!document.querySelector('#pfSearch').disabled", 30_000);
    const applied = await evaluate(client, `(() => {
      const row = document.querySelector('#pfResults tr');
      if (!row) throw new Error('No ancestor PID results: ' + JSON.stringify({
        count: document.querySelector('#pfResultCount').textContent,
        pending: document.querySelector('#pfPendingStatus').textContent,
        species: document.querySelector('#species').value,
        location: document.querySelector('#metLocation').value,
        shiny: document.querySelector('#pfWantShiny').checked,
        nature: document.querySelector('#pfNature').value,
        gender: document.querySelector('#pfGender').value,
        ability: document.querySelector('#pfAbility').value,
        ivs: [...document.querySelectorAll('#pfSearchWorkspace input[type=number]')].map(input => [input.id,input.value]),
      }));
      const sourceShown = row.textContent.includes(${JSON.stringify(testCase.name)});
      row.querySelector('.select-btn').click();
      document.querySelector('#pfConfirm').click();
      const locationControl = document.querySelector('#metLocation');
      locationControl.querySelector('.autocomplete-toggle').click();
      if (locationControl.querySelector('.autocomplete-dropdown').classList.contains('show')) {
        throw new Error('Locked met location dropdown can still be opened');
      }
      return {
        species: Number(document.querySelector('#species').value),
        location: Number(document.querySelector('#metLocation').value),
        metLevel: Number(document.querySelector('#metLevel').value),
        level: Number(document.querySelector('#level').value),
        sourceShown,
        pidApplied: document.querySelector('#pid').value !== '' && document.querySelector('#metLevel').disabled,
      };
    })()`);
    if (!applied.sourceShown || !applied.pidApplied || applied.species !== testCase.species ||
        applied.location !== testCase.location || applied.metLevel >= 16 || applied.level < 16) {
      throw new Error(`Wild ancestor selection failed: ${JSON.stringify(applied)}`);
    }
    wildEvolutionOrigins.push(applied);
  }

  await evaluate(client, `(() => {
    document.querySelector('#importHexInput').value = ${legalHex};
    document.querySelector('#importHexBtn').click();
    return true;
  })()`);

  const immediate = await evaluate(client, `(() => {
    document.querySelector('#generateBtn').click();
    return {
      codeVisible: document.querySelector('#base64Output').value.length > 0,
      exactHexVisible: document.querySelector('#hexOutput').value.replace(/[^0-9a-f]/gi, '').toUpperCase() === ${legalHex},
      state: document.querySelector('#pkhexVerificationStatus').dataset.state,
      text: document.querySelector('#pkhexVerificationText').textContent,
    };
  })()`);
  if (!immediate.codeVisible || !immediate.exactHexVisible || immediate.state !== 'checking') {
    throw new Error(`Generate did not expose code before async checking: ${JSON.stringify(immediate)}`);
  }

  await waitFor(client, "document.querySelector('#pkhexVerificationStatus').dataset.state === 'verified'");
  const gbaReport = await evaluate(client, `(() => {
    document.querySelector('#pkhexReportBtn').click();
    return {
      open: document.querySelector('#pkhexReportOverlay').classList.contains('open'),
      result: document.querySelector('#pkhexReportResult').textContent,
      environment: document.querySelector('#pkhexReportEnvironment').textContent,
      version: document.querySelector('#pkhexReportVersion').textContent,
      checksum: document.querySelector('#pkhexReportChecksum').textContent,
      verboseLength: document.querySelector('#pkhexVerboseReport').textContent.length,
      validLineCount: document.querySelectorAll('#pkhexVerboseReport .pkhex-verbose-line-valid').length,
    };
  })()`);
  if (!gbaReport.open || gbaReport.result !== 'Verified' || !gbaReport.environment.includes('gba-cartridge') ||
      gbaReport.version !== '26.8.26' || gbaReport.checksum !== 'Valid' || gbaReport.verboseLength < 10 ||
      gbaReport.validLineCount === 0) {
    throw new Error(`Unexpected GBA report: ${JSON.stringify(gbaReport)}`);
  }
  await evaluate(client, "document.querySelector('#pkhexReportClose').click()");

  const illegalHex = JSON.stringify(fixtures.intentionallyIllegal.hex);
  await evaluate(client, `(() => {
    document.querySelector('#importHexInput').value = ${illegalHex};
    document.querySelector('#importHexBtn').click();
    document.querySelector('#generateBtn').click();
    return true;
  })()`);
  await waitFor(client, "document.querySelector('#pkhexVerificationStatus').dataset.state === 'failed'");
  const illegalReport = await evaluate(client, `(() => {
    document.querySelector('#pkhexReportBtn').click();
    return {
      result: document.querySelector('#pkhexReportResult').textContent,
      checksum: document.querySelector('#pkhexReportChecksum').textContent,
      verbose: document.querySelector('#pkhexVerboseReport').textContent,
      invalidLineCount: document.querySelectorAll('#pkhexVerboseReport .pkhex-verbose-line-invalid').length,
    };
  })()`);
  if (illegalReport.result !== 'Failed' || illegalReport.checksum !== 'Valid' || !illegalReport.verbose.includes('Invalid') ||
      illegalReport.invalidLineCount === 0) {
    throw new Error(`Unexpected illegal-Pokémon report: ${JSON.stringify(illegalReport)}`);
  }
  await evaluate(client, "document.querySelector('#pkhexReportClose').click()");

  const checksumHex = JSON.stringify(fixtures.checksumInvalid.hex);
  await evaluate(client, `(() => {
    document.querySelector('#importHexInput').value = ${checksumHex};
    document.querySelector('#importHexBtn').click();
    document.querySelector('#generateBtn').click();
    return true;
  })()`);
  await waitFor(client, "document.querySelector('#pkhexVerificationStatus').dataset.state === 'failed'");
  const checksumReport = await evaluate(client, `(() => {
    document.querySelector('#pkhexReportBtn').click();
    return {
      result: document.querySelector('#pkhexReportResult').textContent,
      checksum: document.querySelector('#pkhexReportChecksum').textContent,
    };
  })()`);
  if (checksumReport.result !== 'Failed' || checksumReport.checksum !== 'Invalid') {
    throw new Error(`Unexpected checksum report: ${JSON.stringify(checksumReport)}`);
  }
  await evaluate(client, "document.querySelector('#pkhexReportClose').click()");

  await evaluate(client, `(() => {
    document.querySelector('#importHexInput').value = ${legalHex};
    document.querySelector('#importHexBtn').click();
    document.querySelector('#codeTargetSwitch').click();
    return true;
  })()`);
  const switchImmediate = await evaluate(client, `(() => {
    document.querySelector('#generateBtn').click();
    return document.querySelector('#pkhexVerificationStatus').dataset.state;
  })()`);
  if (switchImmediate !== 'checking') throw new Error(`Switch verification did not start: ${switchImmediate}`);
  await waitFor(client, "document.querySelector('#pkhexVerificationStatus').dataset.state === 'verified'");
  const switchEnvironment = await evaluate(client, `(() => {
    document.querySelector('#pkhexReportBtn').click();
    return document.querySelector('#pkhexReportEnvironment').textContent;
  })()`);
  if (!switchEnvironment.includes('switch-frlg')) {
    throw new Error(`Unexpected Switch environment: ${switchEnvironment}`);
  }
  await evaluate(client, "document.querySelector('#pkhexReportClose').click()");

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(100);
  const desktopLayout = await evaluate(client, `(() => {
    const generate = document.querySelector('#generateBtn').getBoundingClientRect();
    const status = document.querySelector('#pkhexVerificationStatus').getBoundingClientRect();
    return { inline: status.left >= generate.right && Math.abs(status.top - generate.top) < 12 };
  })()`);
  if (!desktopLayout.inline) throw new Error('PKHeX status is not inline to the right of Generate on desktop.');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(100);
  const mobileLayout = await evaluate(client, `(() => {
    const generate = document.querySelector('#generateBtn').getBoundingClientRect();
    const status = document.querySelector('#pkhexVerificationStatus').getBoundingClientRect();
    return {
      wrapped: status.top >= generate.bottom - 1,
      noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    };
  })()`);
  if (!mobileLayout.wrapped || !mobileLayout.noHorizontalOverflow) {
    throw new Error(`Unexpected mobile layout: ${JSON.stringify(mobileLayout)}`);
  }

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(100);

  const rebuiltImmediate = await evaluate(client, `(() => {
    const field = document.querySelector('#otName');
    field.value = 'ASH';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#generateBtn').click();
    return {
      codeVisible: document.querySelector('#base64Output').value.length > 0,
      state: document.querySelector('#pkhexVerificationStatus').dataset.state,
    };
  })()`);
  if (!rebuiltImmediate.codeVisible || rebuiltImmediate.state !== 'checking') {
    throw new Error(`Rebuilt result.bytes path did not start asynchronously: ${JSON.stringify(rebuiltImmediate)}`);
  }
  const rebuiltState = await waitFor(client, `(() => {
    const state = document.querySelector('#pkhexVerificationStatus').dataset.state;
    return state === 'verified' || state === 'failed' ? state : '';
  })()`);

  const raceState = await evaluate(client, `(() => {
    document.querySelector('#codeTargetConsole').click();
    const field = document.querySelector('#otName');
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelector('#pkhexVerificationStatus').dataset.state;
  })()`);
  if (raceState !== 'stale') throw new Error(`Edit did not mark the active request stale: ${raceState}`);
  await delay(750);
  const finalState = await evaluate(client, "document.querySelector('#pkhexVerificationStatus').dataset.state");
  if (finalState !== 'stale') throw new Error(`A stale request overwrote the UI: ${finalState}`);

  const importedTrainerIdDice = await evaluate(client, `(async () => {
    const { parsePokemonBytes } = await import('./src/lib/gen3/builder.js');
    document.querySelector('#importHexInput').value = ${legalHex};
    document.querySelector('#importHexBtn').click();
    const dice = document.querySelector('#randomizeTrainerIdsBtn');
    if (dice.hidden || dice.disabled) throw new Error('Editable imported trainer IDs must show the dice: ' + JSON.stringify({
      mode: document.querySelector('#encounterMode').value, game: document.querySelector('#originGame').value,
      tidDisabled: document.querySelector('#tid').disabled, sidDisabled: document.querySelector('#sid').disabled,
      tidLock: document.querySelector('#tid').dataset.profileLocked, sidLock: document.querySelector('#sid').dataset.profileLocked,
      species: document.querySelector('#species').value }));
    dice.click();
    const tid = Number(document.querySelector('#tid').value);
    const sid = Number(document.querySelector('#sid').value);
    const stale = !document.querySelector('#generatedCodeStaleWarning').hidden;
    document.querySelector('#generateBtn').click();
    const hex = document.querySelector('#hexOutput').value.replace(/[^0-9a-f]/gi, '').toUpperCase();
    const exported = parsePokemonBytes(hex);
    if (!stale || hex === ${legalHex} || exported.tid !== tid || exported.sid !== sid) {
      throw new Error('Randomized imported IDs were not marked stale and written into the exported bytes');
    }
    return { staleOutputMarked: stale, exportedIdsMatch: true };
  })()`);

  console.log(JSON.stringify({
    browser: path.basename(chromePath),
    trainerIdDice,
    importedTrainerIdDice,
    wildEvolutionOrigins,
    immediate,
    gbaReport,
    illegalReport: { result: illegalReport.result, checksum: illegalReport.checksum },
    checksumReport,
    switchEnvironment,
    desktopLayout,
    mobileLayout,
    rebuiltResultBytesPath: rebuiltState,
    staleRequestDiscarded: true,
  }, null, 2));

  await client.send('Browser.close');
  browserSocket.close();
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3_000)]);
} finally {
  if (browserSocket?.readyState === WebSocket.OPEN) browserSocket.close();
  if (!chrome.killed) chrome.kill();
  await delay(500);

  const expectedPrefix = `${path.resolve(os.tmpdir())}${path.sep}pkhex-builder-ui-`;
  const resolvedProfile = path.resolve(profileDirectory);
  if (!resolvedProfile.startsWith(expectedPrefix)) {
    throw new Error(`Refusing to remove unexpected browser profile path: ${resolvedProfile}`);
  }
  try {
    fs.rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (error) {
    console.error(`Warning: could not remove temporary browser profile ${resolvedProfile}: ${error.message}`);
  }
}
