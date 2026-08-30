import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const outputDirectory = path.resolve(workspaceRoot, process.argv[2] || '.pkhex-site');
const outputRelative = path.relative(workspaceRoot, outputDirectory);

if (!outputRelative || outputRelative.startsWith('..') || path.isAbsolute(outputRelative)) {
  throw new Error('The future-site output directory must be a child of the repository root.');
}

const requiredSiteEntries = ['index.html', 'src', 'docs', 'LICENSE'];
const validatorPublishDirectory = path.join(workspaceRoot, 'pkhex-validator', 'dist');

if (!fs.existsSync(validatorPublishDirectory)) {
  throw new Error('PKHeX validator publish output is missing. Run dotnet publish before assembling the site.');
}

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const entry of requiredSiteEntries) {
  const source = path.join(workspaceRoot, entry);
  if (!fs.existsSync(source)) throw new Error(`Required static-site entry is missing: ${entry}`);
  fs.cpSync(source, path.join(outputDirectory, entry), { recursive: true });
}

const validatorDestination = path.join(outputDirectory, 'pkhex-validator', 'dist');
fs.mkdirSync(path.dirname(validatorDestination), { recursive: true });
fs.cpSync(validatorPublishDirectory, validatorDestination, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, '.nojekyll'), '');

console.log(`Assembled future PKHeX site artifact at ${outputDirectory}`);
