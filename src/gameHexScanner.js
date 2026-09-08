import {
  DEFAULT_GAME_SCAN_INSTRUCTION,
  GAME_SCAN_CHUNK_COUNT,
  assembleScannedPokemonHex,
  cleanHexChunkDraft,
  createHexScanConsensus,
  formatScannedPokemonHex,
  getCenteredVideoCrop,
  getConfirmedChunkCount,
  getNextIncompleteChunkIndex,
  validateHexChunk,
} from './lib/gen3/gameHexScan.js';
import { renderGen3HexGlyphs } from './lib/gen3/gen3HexGlyphRenderer.js';
import { recognizeGen3HexFromCanvas } from './lib/gen3/gen3HexRecognizer.js';

const HEX_KEYS = '0123456789ABCDEF';

function scannerMarkup() {
  return `
    <section class="game-scan" aria-labelledby="gameScanHeading">
      <div class="game-scan-heading">
        <div>
          <span class="game-scan-eyebrow">Camera-assisted import</span>
          <h4 id="gameScanHeading">Scan from game</h4>
        </div>
        <strong id="gameScanCount">0 / ${GAME_SCAN_CHUNK_COUNT}</strong>
      </div>

      <progress id="gameScanProgress" max="${GAME_SCAN_CHUNK_COUNT}" value="0">0%</progress>
      <p id="gameScanStep" class="game-scan-step"></p>

      <details class="game-scan-instructions-editor">
        <summary>Edit scanning instructions</summary>
        <label for="gameScanInstructionEditor">Instruction shown for each chunk</label>
        <textarea id="gameScanInstructionEditor" rows="4">${DEFAULT_GAME_SCAN_INSTRUCTION}</textarea>
        <p>You may use <code>{current}</code>, <code>{total}</code>, and <code>{remaining}</code>.</p>
        <div class="game-scan-inline-actions">
          <button id="gameScanApplyInstructions" type="button">Apply instructions</button>
          <button id="gameScanResetInstructions" type="button" class="game-scan-secondary">Reset text</button>
        </div>
      </details>

      <div id="gameScanChunkGrid" class="game-scan-chunk-grid" aria-label="Scan progress by chunk"></div>

      <div class="game-scan-font-row">
        <label for="gameScanFont">In-game glyph style</label>
        <select id="gameScanFont">
          <option value="emerald">Emerald (Latin)</option>
          <option value="frlg">FireRed / LeafGreen (Latin)</option>
        </select>
      </div>

      <label class="game-scan-auto-row" for="gameScanAuto">
        <input id="gameScanAuto" type="checkbox" checked />
        <span>
          <strong>Continuous scan</strong>
          <small>Waits for the same code across 3 frames before saving it.</small>
        </span>
      </label>

      <div class="game-scan-camera-shell">
        <video id="gameScanVideo" autoplay muted playsinline hidden></video>
        <canvas id="gameScanCapture" hidden></canvas>
        <div id="gameScanReticle" class="game-scan-reticle" hidden aria-hidden="true">
          ${Array.from({ length: 8 }, () => '<span></span>').join('')}
        </div>
        <div id="gameScanLiveResult" class="game-scan-live-result" hidden aria-live="polite">
          <span>✓</span>
          <strong id="gameScanLiveCode"></strong>
        </div>
        <div id="gameScanCameraEmpty" class="game-scan-camera-empty">
          <strong>Camera is off</strong>
          <span>Use your phone’s rear camera and keep it parallel to the game screen.</span>
        </div>
      </div>
      <p id="gameScanCameraStatus" class="game-scan-camera-status" role="status" aria-live="polite"></p>

      <div class="game-scan-primary-actions">
        <button id="gameScanStartCamera" type="button">Start camera</button>
        <button id="gameScanCaptureButton" type="button" disabled>Capture chunk</button>
        <button id="gameScanManualButton" type="button" class="game-scan-secondary">Enter manually</button>
      </div>

      <section id="gameScanConfirm" class="game-scan-confirm" hidden aria-labelledby="gameScanConfirmHeading">
        <div class="game-scan-confirm-heading">
          <div>
            <span>Frozen image</span>
            <h5 id="gameScanConfirmHeading">Confirm all 8 characters</h5>
          </div>
          <button id="gameScanRetake" type="button" class="game-scan-secondary">Retake</button>
        </div>
        <label for="gameScanChunkInput">Hex block</label>
        <input id="gameScanChunkInput" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8" placeholder="00000000" />
        <p id="gameScanRecognitionStatus" class="game-scan-recognition-status" role="status" aria-live="polite"></p>
        <div class="game-scan-glyph-preview-wrap">
          <span>Official Gen 3 glyph preview</span>
          <canvas id="gameScanGlyphPreview" aria-label="Entered value rendered with Gen 3 glyphs"></canvas>
        </div>
        <div id="gameScanKeypad" class="game-scan-keypad" aria-label="Hexadecimal keypad"></div>
        <div class="game-scan-inline-actions">
          <button id="gameScanBackspace" type="button" class="game-scan-secondary">⌫ Delete</button>
          <button id="gameScanClear" type="button" class="game-scan-secondary">Clear</button>
          <button id="gameScanConfirmButton" type="button">Confirm chunk</button>
        </div>
      </section>

      <section id="gameScanComplete" class="game-scan-complete" hidden aria-labelledby="gameScanCompleteHeading">
        <h5 id="gameScanCompleteHeading">All 80 bytes are ready</h5>
        <p>Review any chunk above if needed, or import the assembled data directly into the builder.</p>
        <textarea id="gameScanAssembledHex" rows="5" readonly aria-label="Assembled 80-byte hexadecimal data"></textarea>
        <div class="game-scan-primary-actions">
          <button id="gameScanImportButton" type="button">Import into builder</button>
          <button id="gameScanStartOver" type="button" class="game-scan-secondary">Start over</button>
        </div>
      </section>
    </section>`;
}

function applyInstructionTemplate(template, currentIndex) {
  const current = currentIndex + 1;
  return String(template || DEFAULT_GAME_SCAN_INSTRUCTION)
    .replaceAll('{current}', String(current))
    .replaceAll('{total}', String(GAME_SCAN_CHUNK_COUNT))
    .replaceAll('{remaining}', String(Math.max(0, GAME_SCAN_CHUNK_COUNT - current)));
}

export function initGameHexScanner({ root, onImportHex, recognize = recognizeGen3HexFromCanvas } = {}) {
  if (!root) return null;
  root.innerHTML = scannerMarkup();

  const find = id => root.querySelector(`#${id}`);
  const video = find('gameScanVideo');
  const captureCanvas = find('gameScanCapture');
  const reticle = find('gameScanReticle');
  const cameraEmpty = find('gameScanCameraEmpty');
  const cameraStatus = find('gameScanCameraStatus');
  const captureButton = find('gameScanCaptureButton');
  const confirmPanel = find('gameScanConfirm');
  const input = find('gameScanChunkInput');
  const recognitionStatus = find('gameScanRecognitionStatus');
  const glyphPreview = find('gameScanGlyphPreview');
  const fontSelect = find('gameScanFont');
  const autoScanToggle = find('gameScanAuto');
  const liveResult = find('gameScanLiveResult');
  const liveCode = find('gameScanLiveCode');
  const completePanel = find('gameScanComplete');
  const instructionEditor = find('gameScanInstructionEditor');
  const chunks = Array(GAME_SCAN_CHUNK_COUNT).fill('');
  let currentIndex = 0;
  let instruction = DEFAULT_GAME_SCAN_INSTRUCTION;
  let stream = null;
  let recognitionToken = 0;
  let reviewingConfirmedChunk = false;
  let autoScanTimer = null;
  let autoScanGeneration = 0;
  let waitingForSceneChange = false;
  let changedFrameCount = 0;
  let lastAcceptedValue = '';
  const analysisCanvas = document.createElement('canvas');
  const consensus = createHexScanConsensus({ requiredMatches: 3, windowSize: 5 });

  function renderGlyphPreview() {
    renderGen3HexGlyphs(glyphPreview, input.value, fontSelect.value).catch(() => {
      const context = glyphPreview.getContext('2d');
      context?.clearRect(0, 0, glyphPreview.width, glyphPreview.height);
    });
  }

  function renderChunkGrid() {
    const grid = find('gameScanChunkGrid');
    grid.textContent = '';
    chunks.forEach((chunk, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.chunkIndex = String(index);
      button.className = 'game-scan-chunk';
      button.classList.toggle('is-current', index === currentIndex
        && (getConfirmedChunkCount(chunks) < GAME_SCAN_CHUNK_COUNT || reviewingConfirmedChunk));
      button.classList.toggle('is-complete', validateHexChunk(chunk).valid);
      button.disabled = !chunk && index !== currentIndex;
      button.setAttribute('aria-label', chunk
        ? `Review chunk ${index + 1}, currently ${chunk}`
        : `Chunk ${index + 1}, not captured`);
      button.innerHTML = `<span>${index + 1}</span><strong>${chunk || '········'}</strong>`;
      grid.appendChild(button);
    });
  }

  function renderState() {
    const confirmed = getConfirmedChunkCount(chunks);
    const complete = confirmed === GAME_SCAN_CHUNK_COUNT && !reviewingConfirmedChunk;
    find('gameScanCount').textContent = `${confirmed} / ${GAME_SCAN_CHUNK_COUNT}`;
    find('gameScanProgress').value = confirmed;
    find('gameScanStep').textContent = complete
      ? 'Every chunk is confirmed. The complete 80-byte value is ready to import.'
      : `Chunk ${currentIndex + 1} of ${GAME_SCAN_CHUNK_COUNT}. ${applyInstructionTemplate(instruction, currentIndex)}`;
    completePanel.hidden = !complete;
    if (complete) {
      find('gameScanAssembledHex').value = formatScannedPokemonHex(chunks);
      confirmPanel.hidden = true;
      stopCamera();
    }
    renderChunkGrid();
  }

  function drawVideoFrame(targetCanvas) {
    if (!stream || !video.videoWidth || !video.videoHeight) return false;
    const crop = getCenteredVideoCrop(video.videoWidth, video.videoHeight, 4);
    targetCanvas.width = 800;
    targetCanvas.height = 200;
    const context = targetCanvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true;
    context.drawImage(
      video,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      targetCanvas.width,
      targetCanvas.height,
    );
    return true;
  }

  function cancelAutoScan() {
    autoScanGeneration += 1;
    if (autoScanTimer !== null) clearTimeout(autoScanTimer);
    autoScanTimer = null;
    consensus.reset();
  }

  function setLiveResult(value, state = 'reading') {
    liveCode.textContent = value || '';
    liveResult.dataset.state = state;
    liveResult.hidden = !value;
    reticle.classList.toggle('is-recognized', state === 'accepted');
  }

  function acceptAutomaticReading(value) {
    const savedChunkNumber = currentIndex + 1;
    chunks[currentIndex] = value;
    reviewingConfirmedChunk = false;
    lastAcceptedValue = value;
    waitingForSceneChange = true;
    changedFrameCount = 0;
    consensus.reset();
    setLiveResult(value, 'accepted');
    cameraStatus.textContent = `✓ ${value} saved as chunk ${savedChunkNumber}. Move to the next box.`;

    const nextIndex = getNextIncompleteChunkIndex(chunks, currentIndex + 1);
    if (nextIndex === -1) {
      renderState();
      return;
    }
    currentIndex = nextIndex;
    renderState();
    setTimeout(() => {
      if (!stream || !waitingForSceneChange) return;
      liveResult.hidden = true;
      reticle.classList.remove('is-recognized');
    }, 800);
  }

  function scheduleAutoScan(delay = 180) {
    if (!stream || !autoScanToggle.checked || video.hidden || !completePanel.hidden) return;
    const generation = autoScanGeneration;
    if (autoScanTimer !== null) clearTimeout(autoScanTimer);
    autoScanTimer = setTimeout(async () => {
      autoScanTimer = null;
      if (generation !== autoScanGeneration || !drawVideoFrame(analysisCanvas)) return;
      let result = null;
      try {
        result = await recognize(analysisCanvas, { fontProfile: fontSelect.value });
      } catch {}
      if (generation !== autoScanGeneration || !stream || !autoScanToggle.checked) return;

      const value = validateHexChunk(result?.value).valid
        ? String(result.value).toUpperCase()
        : '';
      if (waitingForSceneChange) {
        if (!value || value !== lastAcceptedValue) changedFrameCount += 1;
        else changedFrameCount = 0;
        if (changedFrameCount >= 2) {
          waitingForSceneChange = false;
          changedFrameCount = 0;
          consensus.reset();
          setLiveResult('', 'reading');
          cameraStatus.textContent = `Scanning chunk ${currentIndex + 1}… Hold the code steady inside the guide.`;
        }
        scheduleAutoScan();
        return;
      }

      const vote = consensus.push(value);
      if (vote.candidate) {
        setLiveResult(vote.candidate, 'reading');
        cameraStatus.textContent = `Reading ${vote.candidate} — ${vote.matches} of ${vote.required} matching frames.`;
      } else {
        setLiveResult('', 'reading');
        cameraStatus.textContent = `Scanning chunk ${currentIndex + 1}… Hold the code steady inside the guide.`;
      }
      if (vote.accepted) acceptAutomaticReading(vote.candidate);
      scheduleAutoScan();
    }, delay);
  }

  function showLiveCamera() {
    recognitionToken += 1;
    cancelAutoScan();
    captureCanvas.hidden = true;
    confirmPanel.hidden = true;
    waitingForSceneChange = false;
    changedFrameCount = 0;
    setLiveResult('', 'reading');
    input.value = chunks[currentIndex] || '';
    renderGlyphPreview();
    if (stream) {
      video.hidden = false;
      reticle.hidden = false;
      cameraEmpty.hidden = true;
      captureButton.disabled = false;
      scheduleAutoScan(80);
    }
  }

  function stopCamera() {
    recognitionToken += 1;
    cancelAutoScan();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.srcObject = null;
    video.hidden = true;
    reticle.hidden = true;
    captureButton.disabled = true;
    cameraEmpty.hidden = false;
    cameraEmpty.querySelector('strong').textContent = 'Camera is off';
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.textContent = 'Camera access is unavailable here. Open the site over HTTPS or localhost, or enter each captured block manually.';
      return;
    }
    stopCamera();
    cameraStatus.textContent = 'Requesting camera access…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      video.srcObject = stream;
      await video.play();
      showLiveCamera();
      cameraStatus.textContent = autoScanToggle.checked
        ? 'Scanning automatically… Hold one 8-character block steady inside the guide.'
        : 'Center one 8-character block in the guide, then capture it.';
    } catch (error) {
      stopCamera();
      cameraStatus.textContent = error?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser and try again.'
        : 'The camera could not be started. Check whether another app is using it, then try again.';
    }
  }

  async function captureCurrentChunk() {
    if (!drawVideoFrame(captureCanvas)) return;
    cancelAutoScan();
    video.hidden = true;
    reticle.hidden = true;
    captureCanvas.hidden = false;
    confirmPanel.hidden = false;
    input.value = chunks[currentIndex] || '';
    recognitionStatus.textContent = 'Checking for a readable text match…';
    renderGlyphPreview();
    const token = ++recognitionToken;
    const result = await recognize(captureCanvas, { fontProfile: fontSelect.value });
    if (token !== recognitionToken) return;
    if (result?.value) {
      input.value = cleanHexChunkDraft(result.value);
      recognitionStatus.textContent = 'Possible match found. Compare every character with the frozen image before confirming.';
    } else if (result?.supported) {
      recognitionStatus.textContent = 'No reliable match was found. Enter the block with the keypad while comparing it with the image.';
    } else {
      recognitionStatus.textContent = 'Automatic text reading is not available in this browser. Enter the block with the Gen 3 glyph keypad.';
    }
    renderGlyphPreview();
    input.focus();
  }

  function enterCurrentChunkManually() {
    recognitionToken += 1;
    cancelAutoScan();
    video.hidden = true;
    reticle.hidden = true;
    captureCanvas.hidden = true;
    confirmPanel.hidden = false;
    input.value = chunks[currentIndex] || '';
    recognitionStatus.textContent = 'Enter the block with the Gen 3 glyph keypad, then confirm all eight characters.';
    renderGlyphPreview();
    input.focus();
  }

  function confirmCurrentChunk() {
    const validation = validateHexChunk(input.value);
    if (!validation.valid) {
      recognitionStatus.textContent = validation.message;
      input.focus();
      return;
    }
    chunks[currentIndex] = validation.value;
    reviewingConfirmedChunk = false;
    const nextIndex = getNextIncompleteChunkIndex(chunks, currentIndex + 1);
    if (nextIndex === -1) {
      renderState();
      return;
    }
    currentIndex = nextIndex;
    if (stream) showLiveCamera();
    else enterCurrentChunkManually();
    recognitionStatus.textContent = '';
    renderState();
  }

  function startOver() {
    const shouldReset = typeof globalThis.confirm !== 'function'
      || globalThis.confirm('Clear all 20 confirmed chunks and start again?');
    if (!shouldReset) return;
    chunks.fill('');
    currentIndex = 0;
    reviewingConfirmedChunk = false;
    completePanel.hidden = true;
    find('gameScanAssembledHex').value = '';
    recognitionStatus.textContent = '';
    showLiveCamera();
    renderState();
  }

  const keypad = find('gameScanKeypad');
  HEX_KEYS.split('').forEach(character => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'game-scan-key';
    button.dataset.hexKey = character;
    button.textContent = character;
    button.setAttribute('aria-label', `Enter ${character}`);
    keypad.appendChild(button);
  });

  find('gameScanStartCamera').addEventListener('click', startCamera);
  captureButton.addEventListener('click', captureCurrentChunk);
  find('gameScanManualButton').addEventListener('click', enterCurrentChunkManually);
  find('gameScanRetake').addEventListener('click', showLiveCamera);
  find('gameScanConfirmButton').addEventListener('click', confirmCurrentChunk);
  find('gameScanBackspace').addEventListener('click', () => {
    input.value = input.value.slice(0, -1);
    renderGlyphPreview();
    input.focus();
  });
  find('gameScanClear').addEventListener('click', () => {
    input.value = '';
    renderGlyphPreview();
    input.focus();
  });
  input.addEventListener('input', () => {
    input.value = cleanHexChunkDraft(input.value);
    recognitionStatus.textContent = '';
    renderGlyphPreview();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') confirmCurrentChunk();
  });
  keypad.addEventListener('click', event => {
    const character = event.target.closest('[data-hex-key]')?.dataset.hexKey;
    if (!character || input.value.length >= 8) return;
    input.value += character;
    recognitionStatus.textContent = '';
    renderGlyphPreview();
    input.focus();
  });
  fontSelect.addEventListener('change', () => {
    consensus.reset();
    renderGlyphPreview();
    if (stream && autoScanToggle.checked && !video.hidden) scheduleAutoScan(80);
  });
  autoScanToggle.addEventListener('change', () => {
    cancelAutoScan();
    setLiveResult('', 'reading');
    if (autoScanToggle.checked && stream && !video.hidden) {
      cameraStatus.textContent = `Scanning chunk ${currentIndex + 1}… Hold the code steady inside the guide.`;
      scheduleAutoScan(80);
    } else if (stream) {
      cameraStatus.textContent = 'Continuous scan is off. Use Capture chunk when the code is centered.';
    }
  });
  find('gameScanApplyInstructions').addEventListener('click', () => {
    instruction = instructionEditor.value.trim() || DEFAULT_GAME_SCAN_INSTRUCTION;
    instructionEditor.value = instruction;
    renderState();
  });
  find('gameScanResetInstructions').addEventListener('click', () => {
    instruction = DEFAULT_GAME_SCAN_INSTRUCTION;
    instructionEditor.value = instruction;
    renderState();
  });
  find('gameScanChunkGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-chunk-index]');
    if (!button || button.disabled) return;
    currentIndex = Number(button.dataset.chunkIndex);
    reviewingConfirmedChunk = validateHexChunk(chunks[currentIndex]).valid;
    completePanel.hidden = true;
    if (stream) showLiveCamera();
    else enterCurrentChunkManually();
    renderState();
  });
  find('gameScanStartOver').addEventListener('click', startOver);
  find('gameScanImportButton').addEventListener('click', () => {
    try {
      const assembled = assembleScannedPokemonHex(chunks);
      onImportHex?.(assembled);
    } catch (error) {
      cameraStatus.textContent = error?.message || 'The assembled data could not be imported.';
    }
  });

  renderState();

  return {
    activate: renderState,
    deactivate: stopCamera,
    stopCamera,
    getChunks: () => [...chunks],
  };
}
