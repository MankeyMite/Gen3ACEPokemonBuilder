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

export function renderBase64Code(display, text) {
  if (!display) return;

  const value = String(text || '');
  display.textContent = '';
  if (!value) return;

  const lines = value.split('\n');
  let lineStartOffset = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const lineElement = document.createElement('span');
    lineElement.className = 'base64-code-line';

    const boxMatch = line.match(/^(\s*)(Box\s+\d+:)(\s*)(\([^)]*\))(.*)$/i);
    if (boxMatch) {
      const [, leading, prefixText, prefixSpace, codeText, annotationText] = boxMatch;

      const prefix = document.createElement('span');
      prefix.className = 'code-box-prefix';
      prefix.textContent = prefixText;
      lineElement.appendChild(prefix);

      const code = document.createElement('span');
      code.className = 'code-box-main';
      appendColorizedCodeText(code, codeText, lineStartOffset + leading.length + prefixText.length + prefixSpace.length);
      lineElement.appendChild(code);

      if (annotationText) {
        const annotation = document.createElement('span');
        annotation.className = 'code-box-annotation';
        annotation.textContent = annotationText;
        lineElement.appendChild(annotation);
      }
    } else {
      lineElement.classList.add('base64-code-header');
      lineElement.textContent = line;
    }

    display.appendChild(lineElement);
    lineStartOffset += rawLine.length + 1;
  });
}
