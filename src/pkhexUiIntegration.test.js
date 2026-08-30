import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');
const clientSource = await readFile(new URL('./lib/pkhexValidator.js', import.meta.url), 'utf8');
const workerSource = await readFile(new URL('./workers/pkhex-validator-worker.js', import.meta.url), 'utf8');
const bridgeSource = await readFile(new URL('../pkhex-validator/ValidatorBridge.cs', import.meta.url), 'utf8');

assert.match(html, /id="generateBtn"[\s\S]*?id="pkhexVerificationStatus"/);
assert.match(html, /id="pkhexReportOverlay"[\s\S]*?id="pkhexVerboseReport"/);
assert.match(mainSource, /beginPkhexVerification\(new Uint8Array\(result\.bytes\), pkhexLegalityEnvironment\)/);
assert.match(mainSource, /beginPkhexVerification\(new Uint8Array\(importedRoundTripBytes\), pkhexLegalityEnvironment\)/);
assert.match(mainSource, /const requestToken = \+\+pkhexGenerationToken/);
assert.match(mainSource, /if \(requestToken !== pkhexGenerationToken\) return/);
assert.match(mainSource, /markPkhexVerificationStale\(\)/);
assert.match(clientSource, /const exactCopy = sourceBytes\.slice\(\)/);
assert.doesNotMatch(clientSource, /convertEk3RawToPk3Canonical\(/);
assert.match(workerSource, /fifo = fifo\.then\(\(\) => processMessage\(event\.data\)\)/);
assert.match(workerSource, /bridge\.Validate\(bytesToBase64\(exactBytes\), message\.environment\)/);
assert.match(bridgeSource, /var pk = new PK3\(exactCopy\.AsMemory\(\)\)/);
assert.match(bridgeSource, /analysis\.Valid && checksumValid/);
assert.match(bridgeSource, /ParseSettings\.AllowEraCartGBA = cartridge/);
assert.match(bridgeSource, /ParseSettings\.AllowEraSwitchGBA = !cartridge/);

console.log('PKHeX UI integration source tests passed');
