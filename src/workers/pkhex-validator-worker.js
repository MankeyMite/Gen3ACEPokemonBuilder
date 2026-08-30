const FRAMEWORK_MODULE_URL = new URL(
  '../../pkhex-validator/dist/wwwroot/_framework/dotnet.js',
  import.meta.url,
);

let bridgePromise = null;
let fifo = Promise.resolve();

function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function loadBridge() {
  const { dotnet } = await import(FRAMEWORK_MODULE_URL.href);
  const { getAssemblyExports, getConfig } = await dotnet.create();
  const config = getConfig();
  const assemblyExports = await getAssemblyExports(config.mainAssemblyName);
  const bridge = assemblyExports?.PkhexValidator?.ValidatorBridge;
  if (!bridge?.Validate) throw new Error('PKHeX validator bridge export was not found.');
  return bridge;
}

function getBridge() {
  if (!bridgePromise) {
    bridgePromise = loadBridge().catch(error => {
      bridgePromise = null;
      throw error;
    });
  }
  return bridgePromise;
}

async function processMessage(message) {
  const { kind, requestId } = message || {};
  try {
    const bridge = await getBridge();
    if (kind === 'preload') {
      self.postMessage({ requestId, ok: true, result: { pkhexVersion: bridge.GetVersion() } });
      return;
    }
    if (kind !== 'validate') throw new Error(`Unknown validator request: ${kind}`);

    const exactBytes = new Uint8Array(message.bytes);
    if (exactBytes.byteLength !== 80) {
      throw new TypeError(`Expected exactly 80 bytes, received ${exactBytes.byteLength}.`);
    }

    // Base64 is transport encoding only. C# decodes these exact 80 bytes and
    // passes its own copy directly to PKHeX.Core's PK3 constructor.
    const result = JSON.parse(bridge.Validate(bytesToBase64(exactBytes), message.environment));
    self.postMessage({ requestId, ok: true, result });
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      error: error?.stack || error?.message || String(error),
    });
  }
}

self.addEventListener('message', event => {
  // Legality settings are process-global in PKHeX.Core. Strict FIFO processing
  // keeps each request's explicitly selected environment isolated.
  fifo = fifo.then(() => processMessage(event.data));
});
