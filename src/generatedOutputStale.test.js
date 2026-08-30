import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('./main.js', import.meta.url), 'utf8');

assert.match(html, /id="generateBtn"[\s\S]*?id="generatedCodeStaleWarning"/);
assert.match(html, /Changes made — generate again\./);
assert.match(html, /generated-code-stale-warning\[hidden\]/);

assert.match(mainSource, /function markGeneratedCodeFresh\(\)/);
assert.match(mainSource, /function markGeneratedCodeStale\(\)/);
assert.match(mainSource, /if \(!hasGeneratedCode\) return;/);
assert.match(mainSource, /target\.matches\('\.autocomplete-input'\)/);
assert.match(mainSource, /target\.closest\('#basicsCard, #builderDetailsCard'\)/);
assert.match(mainSource, /document\.addEventListener\('input', markStaleFromBuilderField\)/);
assert.match(mainSource, /document\.addEventListener\('change', markStaleFromBuilderField\)/);
assert.match(mainSource, /hideBase64CharacterInspector\(\);\s*markGeneratedCodeFresh\(\);\s*beginPkhexVerification\(new Uint8Array\(result\.bytes\), pkhexLegalityEnvironment\);\s*return b64Result;/);

console.log('generated output stale-warning tests passed');
