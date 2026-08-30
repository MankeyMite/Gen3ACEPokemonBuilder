import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const artifactDirectory = path.resolve(process.cwd(), process.argv[2] || '.pkhex-site');
const frameworkDirectory = path.join(
  artifactDirectory,
  'pkhex-validator',
  'dist',
  'wwwroot',
  '_framework',
);

function requireFile(relativePath) {
  const absolutePath = path.join(artifactDirectory, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing artifact file: ${relativePath}`);
  return absolutePath;
}

function collectFiles(directory, relativeDirectory = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectFiles(absolutePath, relativePath)
      : [{
        absolutePath,
        relativePath: relativePath.split(path.sep).join('/'),
        size: fs.statSync(absolutePath).size,
      }];
  });
}

requireFile('index.html');
requireFile('src/main.js');
const workerPath = requireFile('src/workers/pkhex-validator-worker.js');
requireFile('.nojekyll');
assert.ok(fs.existsSync(frameworkDirectory), 'Missing PKHeX validator _framework directory.');
requireFile('pkhex-validator/dist/wwwroot/_framework/dotnet.js');

const files = collectFiles(artifactDirectory);
const pkhexCoreFiles = files.filter(file => /(?:^|\/)PKHeX\.Core\..+\.wasm(?:\.(?:br|gz))?$/i.test(file.relativePath));
assert.ok(pkhexCoreFiles.some(file => file.relativePath.endsWith('.wasm')), 'Missing uncompressed PKHeX.Core WASM asset.');

const workerSource = fs.readFileSync(workerPath, 'utf8');
assert.match(workerSource, /\.\.\/\.\.\/pkhex-validator\/dist\/wwwroot\/_framework\/dotnet\.js/);

const pagesRelativeValidatorUrl = new URL(
  '../../pkhex-validator/dist/wwwroot/_framework/dotnet.js',
  'https://mankeymite.github.io/Gen3ACEPokemonBuilder/src/workers/pkhex-validator-worker.js',
);
assert.equal(
  pagesRelativeValidatorUrl.pathname,
  '/Gen3ACEPokemonBuilder/pkhex-validator/dist/wwwroot/_framework/dotnet.js',
  'The worker must resolve the validator within the GitHub Pages project-site path.',
);

const sum = selectedFiles => selectedFiles.reduce((total, file) => total + file.size, 0);
const compressed = extension => files.filter(file => file.relativePath.endsWith(extension));
const uncompressedFiles = files.filter(file => !file.relativePath.endsWith('.br') && !file.relativePath.endsWith('.gz'));
const pkhexCoreUncompressed = pkhexCoreFiles.filter(file => !file.relativePath.endsWith('.br') && !file.relativePath.endsWith('.gz'));
const pkhexCoreBrotli = pkhexCoreFiles.filter(file => file.relativePath.endsWith('.br'));
const pkhexCoreGzip = pkhexCoreFiles.filter(file => file.relativePath.endsWith('.gz'));

console.log(JSON.stringify({
  artifactDirectory,
  verified: {
    noJekyll: true,
    frameworkDirectory: path.relative(artifactDirectory, frameworkDirectory).split(path.sep).join('/'),
    pagesRelativeValidatorUrl: pagesRelativeValidatorUrl.pathname,
    pkhexCoreAssets: pkhexCoreFiles.map(file => file.relativePath),
  },
  sizes: {
    totalOnDiskBytes: sum(files),
    totalUncompressedBytes: sum(uncompressedFiles),
    brotliBytes: sum(compressed('.br')),
    gzipBytes: sum(compressed('.gz')),
    pkhexCore: {
      totalBytes: sum(pkhexCoreFiles),
      uncompressedBytes: sum(pkhexCoreUncompressed),
      brotliBytes: sum(pkhexCoreBrotli),
      gzipBytes: sum(pkhexCoreGzip),
    },
  },
}, null, 2));
