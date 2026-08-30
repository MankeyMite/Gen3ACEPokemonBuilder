import { dotnet } from './_framework/dotnet.js';
import fixtures from './fixtures.generated.js';

const summary = document.querySelector('#summary');
const resultsContainer = document.querySelector('#results');

function hexToBytes(hex) {
  const normalized = hex.replace(/\s+/g, '');
  if (normalized.length !== 160) {
    throw new Error(`Expected 160 hexadecimal characters, received ${normalized.length}.`);
  }
  return Uint8Array.from(normalized.match(/.{2}/g), pair => Number.parseInt(pair, 16));
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function render(results) {
  const passed = results.tests.every(test => test.passed);
  summary.className = passed ? 'pass' : 'fail';
  summary.textContent = `${passed ? 'PASS' : 'FAIL'} — PKHeX ${results.pkhexVersion}; startup ${results.startupMs.toFixed(1)} ms`;

  const rows = results.tests.map(test => `
    <tr>
      <td class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASS' : 'FAIL'}</td>
      <td>${test.name}</td>
      <td>${test.environment}</td>
      <td>${test.elapsedMs.toFixed(2)} ms</td>
      <td><pre>${JSON.stringify(test.result, null, 2)}</pre></td>
    </tr>`).join('');

  resultsContainer.innerHTML = `
    <table>
      <thead><tr><th>Status</th><th>Case</th><th>Environment</th><th>Check time</th><th>Result</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

try {
  const runtimeStart = performance.now();
  const { getAssemblyExports, getConfig } = await dotnet.create();
  const config = getConfig();
  const assemblyExports = await getAssemblyExports(config.mainAssemblyName);
  const bridge = assemblyExports.PkhexValidator.ValidatorBridge;
  const startupMs = performance.now() - window.pkhexSpikePageStarted;
  const runtimeStartupMs = performance.now() - runtimeStart;

  function validateExactStoredBytes(sourceBytes, environment) {
    if (!(sourceBytes instanceof Uint8Array) || sourceBytes.byteLength !== 80) {
      throw new TypeError('Validator input must be an 80-byte Uint8Array.');
    }

    // Deliberate boundary copy. No decryption, padding, or PK3 conversion occurs in JS.
    const exactCopy = sourceBytes.slice();
    return JSON.parse(bridge.Validate(bytesToBase64(exactCopy), environment));
  }

  const cases = [
    { fixture: 'knownLegal', environment: 'gba-cartridge', expect: result => result.valid && result.parsed && !result.error },
    { fixture: 'knownLegal', environment: 'switch-frlg', expect: result => result.valid && result.parsed && !result.error },
    { fixture: 'intentionallyIllegal', environment: 'gba-cartridge', expect: result => !result.valid && result.parsed && !result.error },
    { fixture: 'checksumInvalid', environment: 'gba-cartridge', expect: result => !result.valid },
    { fixture: 'eraDependent', environment: 'gba-cartridge', expect: result => result.valid && result.parsed && !result.error },
    { fixture: 'eraDependent', environment: 'switch-frlg', expect: result => !result.valid && result.parsed && !result.error },
  ];

  const tests = cases.map(testCase => {
    const fixture = fixtures[testCase.fixture];
    const bytes = hexToBytes(fixture.hex);
    const start = performance.now();
    const result = validateExactStoredBytes(bytes, testCase.environment);
    const elapsedMs = performance.now() - start;
    return {
      name: fixture.name,
      fixture: testCase.fixture,
      environment: testCase.environment,
      elapsedMs,
      passed: testCase.expect(result),
      result,
    };
  });

  const output = {
    pkhexVersion: bridge.GetVersion(),
    startupMs,
    runtimeStartupMs,
    tests,
  };

  window.pkhexSpikeResults = output;
  render(output);
  console.log('PKHEX_SPIKE_RESULTS', JSON.stringify(output));
  await dotnet.run();
} catch (error) {
  const failure = { error: error?.stack || String(error) };
  window.pkhexSpikeResults = failure;
  summary.className = 'fail';
  summary.textContent = `FAIL — ${error}`;
  console.error('PKHEX_SPIKE_FAILURE', error);
}
