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

  console.log(JSON.stringify({
    browser: path.basename(chromePath),
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
