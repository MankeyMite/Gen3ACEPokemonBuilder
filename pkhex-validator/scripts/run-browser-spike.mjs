import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chromePath = chromeCandidates.find(candidate => fs.existsSync(candidate));
if (!chromePath) throw new Error('Chrome or Edge was not found.');

const targetUrl = process.argv[2] || 'http://127.0.0.1:8012/';
const debugPort = 9377;
const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pkhex-chrome-spike-'));

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

let browserSocket;

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function getJson(url, options) {
  const response = await fetch(url, options);
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
  throw new Error('Timed out waiting for the headless browser debugging target.');
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

try {
  const target = await waitForTarget();
  const client = await connectDebugger(target.webSocketDebuggerUrl);
  browserSocket = client.socket;
  await client.send('Runtime.enable');

  const deadline = Date.now() + 120_000;
  let spikeResult;
  while (Date.now() < deadline) {
    spikeResult = await evaluate(client, 'window.pkhexSpikeResults ?? null');
    if (spikeResult) break;
    await delay(100);
  }
  if (!spikeResult) throw new Error('Timed out waiting for PKHeX spike results.');

  const network = await evaluate(client, `(() => {
    const resources = performance.getEntriesByType('resource');
    const framework = resources.filter(entry => entry.name.includes('/_framework/'));
    const pkhex = resources.find(entry => /PKHeX\\.Core/i.test(entry.name));
    const sum = (entries, property) => entries.reduce((total, entry) => total + entry[property], 0);
    return {
      resourceCount: resources.length,
      transferBytes: sum(resources, 'transferSize'),
      encodedBodyBytes: sum(resources, 'encodedBodySize'),
      decodedBodyBytes: sum(resources, 'decodedBodySize'),
      frameworkTransferBytes: sum(framework, 'transferSize'),
      frameworkEncodedBodyBytes: sum(framework, 'encodedBodySize'),
      pkhex: pkhex ? {
        name: pkhex.name,
        transferSize: pkhex.transferSize,
        encodedBodySize: pkhex.encodedBodySize,
        decodedBodySize: pkhex.decodedBodySize,
        duration: pkhex.duration
      } : null
    };
  })()`);

  const output = {
    browser: path.basename(chromePath),
    targetUrl,
    coldProfile: true,
    ...spikeResult,
    network,
  };

  console.log(JSON.stringify(output, null, 2));

  const failed = Boolean(output.error) || output.tests?.some(test => !test.passed);
  if (failed) process.exitCode = 1;

  await client.send('Browser.close');
  browserSocket.close();
  await Promise.race([
    new Promise(resolve => chrome.once('exit', resolve)),
    delay(3_000),
  ]);
} finally {
  if (browserSocket?.readyState === WebSocket.OPEN) browserSocket.close();
  if (!chrome.killed) chrome.kill();
  await delay(500);

  const expectedPrefix = `${path.resolve(os.tmpdir())}${path.sep}pkhex-chrome-spike-`;
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
