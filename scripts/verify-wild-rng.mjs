import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gen3-wild-rng-'));
const fixtures = path.join(directory, 'fixtures.json');
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}
try {
  run(process.execPath, ['src/lib/gen3/rng-worker.encounter.test.js'],
    { ...process.env, PKHEX_RNG_FIXTURES: fixtures });
  run('dotnet', ['run', '--project', 'scripts/pkhex-rng-check/PkhexRngCheck.csproj', '--', fixtures]);
} finally {
  if (fs.existsSync(fixtures)) fs.unlinkSync(fixtures);
  fs.rmdirSync(directory);
}
