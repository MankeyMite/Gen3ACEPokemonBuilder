import { renderGen3BoxNameGlyphs } from './gen3HexGlyphRenderer.js';

export function getAceCodeCharacterClass(ch) {
  if (ch === '.' || ch === ',') return 'code-char-flexible';
  if (ch === '-' || ch === '\u2010' || ch === '\u2011' || ch === '\u2012' || ch === '\u2013' || ch === '\u2014') {
    return 'code-char-hyphen';
  }
  if (ch === '_') return 'code-char-underscore';
  if ('()[]{}'.includes(ch)) return 'code-char-bracket';
  if ((ch >= 'A' && ch <= 'Z') || (ch >= '\uFF21' && ch <= '\uFF3A') || ch === '\u00C4' || ch === '\u00D6' || ch === '\u00DC') return 'code-char-upper';
  if (ch === 'q') return 'code-char-lower code-char-lower-q';
  if ((ch >= 'a' && ch <= 'z') || (ch >= '\uFF41' && ch <= '\uFF5A') || ch === '\u00E4' || ch === '\u00F6' || ch === '\u00FC') return 'code-char-lower';
  if ((ch >= '0' && ch <= '9') || (ch >= '\uFF10' && ch <= '\uFF19')) return 'code-char-number';
  return 'code-char-symbol';
}

export function appendColorizedCodeText(parent, text, rawStartOffset = null) {
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = getAceCodeCharacterClass(text[i]);
    span.textContent = text[i];
    if (rawStartOffset !== null) span.dataset.base64Offset = String(rawStartOffset + i);
    parent.appendChild(span);
  }
}

export function alignBase64PreviewGlyphs(display) {
  if (!display?.getClientRects().length) return;
  const canvases = [...display.querySelectorAll('.gba-box-name-preview canvas')];
  const ratio = window.devicePixelRatio || 1;

  // Snap each bitmap to the physical pixel grid without moving its box-name row.
  for (const canvas of canvases) {
    canvas.style.left = '';
    canvas.style.top = '';
  }
  const positions = canvases.map(canvas => canvas.getBoundingClientRect());
  canvases.forEach((canvas, index) => {
    const { x, y } = positions[index];
    canvas.style.left = `${Math.round(x * ratio) / ratio - x}px`;
    canvas.style.top = `${Math.round(y * ratio) / ratio - y}px`;
  });
}

export function renderBase64Code(display, text, fontProfile = 'emerald') {
  if (!display) return;

  const value = String(text || '');
  display.textContent = '';
  if (!value) return;

  const lines = value.split('\n');
  const hasShiftedBoxes = value.includes('no trailing spaces!');
  const previews = [];
  let lineStartOffset = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const lineElement = document.createElement('span');
    lineElement.className = 'base64-code-line';

    const boxMatch = line.match(/^(\s*)(Box\s+\d+:)(\s*)(\([^)]*\))(.*)$/i);
    if (boxMatch) {
      const [, leading, prefixText, prefixSpace, codeText, annotationText] = boxMatch;
      lineElement.classList.add('base64-box-row');
      const entry = document.createElement('span');
      entry.className = 'base64-code-entry';

      const prefix = document.createElement('span');
      prefix.className = 'code-box-prefix';
      prefix.textContent = prefixText;
      entry.appendChild(prefix);

      const code = document.createElement('span');
      code.className = 'code-box-main';
      appendColorizedCodeText(code, codeText, lineStartOffset + leading.length + prefixText.length + prefixSpace.length);
      entry.appendChild(code);

      if (annotationText) {
        const annotation = document.createElement('span');
        annotation.className = 'code-box-annotation';
        annotation.textContent = annotationText;
        entry.appendChild(annotation);
      }

      const preview = document.createElement('span');
      preview.className = 'gba-box-name-preview';
      preview.setAttribute('aria-hidden', 'true');
      const canvas = document.createElement('canvas');
      preview.appendChild(canvas);
      lineElement.append(entry, preview);

      previews.push(renderGen3BoxNameGlyphs(canvas, codeText.slice(1, -1), fontProfile).catch(() => {
        preview.remove();
      }));
    } else {
      lineElement.classList.add('base64-code-header');
      if (hasShiftedBoxes && line === 'Box names (BASE64):') {
        const title = document.createElement('span');
        title.className = 'base64-code-default-title';
        title.textContent = line;
        const phoneTitle = document.createElement('span');
        phoneTitle.className = 'base64-code-phone-title';
        phoneTitle.textContent = 'Box names · No trailing spaces';
        lineElement.append(title, phoneTitle);
      } else {
        lineElement.textContent = line;
      }
    }

    display.appendChild(lineElement);
    lineStartOffset += rawLine.length + 1;
  });
  Promise.all(previews).then(() => alignBase64PreviewGlyphs(display));
}
