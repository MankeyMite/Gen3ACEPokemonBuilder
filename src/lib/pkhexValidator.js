const VALID_ENVIRONMENTS = new Set(['gba-cartridge', 'switch-frlg']);

let validatorWorker = null;
let nextRequestId = 0;
let preloadPromise = null;
const pendingRequests = new Map();

function rejectPending(error) {
  for (const { reject } of pendingRequests.values()) reject(error);
  pendingRequests.clear();
}

function getValidatorWorker() {
  if (validatorWorker) return validatorWorker;

  const worker = new Worker(
    new URL('../workers/pkhex-validator-worker.js', import.meta.url),
    { type: 'module', name: 'pkhex-validator' },
  );

  worker.addEventListener('message', event => {
    const message = event.data || {};
    const pending = pendingRequests.get(message.requestId);
    if (!pending) return;

    pendingRequests.delete(message.requestId);
    if (message.ok) pending.resolve(message.result ?? null);
    else pending.reject(new Error(message.error || 'PKHeX validator worker failed.'));
  });

  worker.addEventListener('error', event => {
    const error = new Error(event.message || 'PKHeX validator worker failed to load.');
    rejectPending(error);
    worker.terminate();
    if (validatorWorker === worker) validatorWorker = null;
  });

  validatorWorker = worker;
  return worker;
}

function sendWorkerRequest(kind, payload = {}, transfer = []) {
  const requestId = ++nextRequestId;
  const worker = getValidatorWorker();

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    try {
      worker.postMessage({ kind, requestId, ...payload }, transfer);
    } catch (error) {
      pendingRequests.delete(requestId);
      reject(error);
    }
  });
}

export function preloadPkhexValidator() {
  if (!preloadPromise) {
    preloadPromise = sendWorkerRequest('preload').catch(error => {
      preloadPromise = null;
      throw error;
    });
  }
  return preloadPromise;
}

export function validateExactStoredPokemon(sourceBytes, environment) {
  if (!(sourceBytes instanceof Uint8Array) || sourceBytes.byteLength !== 80) {
    return Promise.reject(new TypeError('PKHeX validator input must be an exact 80-byte Uint8Array.'));
  }
  if (!VALID_ENVIRONMENTS.has(environment)) {
    return Promise.reject(new TypeError(`Unsupported PKHeX legality environment: ${environment}`));
  }

  // Deliberate boundary copy. The transferred buffer is never decrypted,
  // padded, rebuilt, or converted to a 100-byte party structure in JavaScript.
  const exactCopy = sourceBytes.slice();
  return sendWorkerRequest(
    'validate',
    { environment, bytes: exactCopy.buffer },
    [exactCopy.buffer],
  );
}
