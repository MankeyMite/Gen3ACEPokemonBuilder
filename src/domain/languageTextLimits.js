export function getLanguageTextLimits(languageId) {
  const japanese = String(languageId ?? '') === '1';
  return Object.freeze({
    nickname: japanese ? 5 : 10,
    otName: japanese ? 5 : 7,
  });
}

function applyInputLimit(input, limit) {
  if (!input) return;
  input.maxLength = limit;
  const value = String(input.value ?? '');
  if (value.length > limit) input.value = value.slice(0, limit);
}

export function applyLanguageTextLimits({ languageId, nicknameInput, otNameInput }) {
  const limits = getLanguageTextLimits(languageId);
  applyInputLimit(nicknameInput, limits.nickname);
  applyInputLimit(otNameInput, limits.otName);
  return limits;
}
